const fs = require('fs');
const { stocks, buildDashboardData, getExchangeData } = require('../data/mockData');
const { spawn } = require('child_process');
const path = require('path');

const yahooQuoteCache = new Map();
const YAHOO_QUOTE_CACHE_MS = 30000;
const YAHOO_SUFFIXES = {
  sse: 'SS',
  hkex: 'HK',
  nse: 'NS',
  lse: 'L',
  tse: 'T',
  asx: 'AX'
};

async function fetchVercelNepseFunction(action, symbol) {
  const deploymentHost = process.env.VERCEL_URL;
  if (!deploymentHost) throw new Error('VERCEL_URL is not available for the NEPSE Python function request.');

  const url = new URL(`https://${deploymentHost}/api/nepse`);
  url.searchParams.set('action', action);
  if (symbol) url.searchParams.set('symbol', symbol);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response;
  let payload;
  try {
    const headers = {};
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    }
    response = await fetch(url, { signal: controller.signal, headers });
    const body = await response.text();
    if (body.length > 2_000_000) throw new Error('NEPSE Python function returned an oversized response.');
    try {
      payload = JSON.parse(body);
    } catch {
      throw new Error('NEPSE Python function returned invalid JSON.');
    }
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(payload.error || `NEPSE Python function returned HTTP ${response.status}.`);
  }
  return payload;
}

function resolvePythonBin() {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;

  const projectRoot = path.join(__dirname, '..', '..');
  const candidates = [
    path.join(projectRoot, '..', '.venv', 'Scripts', 'python.exe'),
    path.join(projectRoot, '..', '.venv', 'bin', 'python'),
    path.join(projectRoot, '.venv', 'Scripts', 'python.exe'),
    path.join(projectRoot, '.venv', 'bin', 'python'),
    process.platform === 'win32' ? 'python' : 'python3'
  ];

  const resolved = candidates.find(candidate => typeof candidate === 'string' && candidate && fs.existsSync(candidate));
  return resolved || (process.platform === 'win32' ? 'python' : 'python3');
}

function fetchPythonMarketPayload() {
  if (process.env.VERCEL) {
    return fetchVercelNepseFunction('market');
  }

  return new Promise((resolve, reject) => {
    const projectRoot = path.join(__dirname, '..', '..');
    const pythonBin = resolvePythonBin();

    const py = spawn(pythonBin, ['live_nepse_adapter.py', 'market'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PYTHONPATH: [projectRoot, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter)
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    let outputTooLarge = false;
    const timeout = setTimeout(() => {
      py.kill();
      if (!settled) {
        settled = true;
        reject(new Error('NEPSE market adapter timed out'));
      }
    }, 12000);

    py.stdout.on('data', chunk => {
      stdout += chunk;
      if (stdout.length > 2_000_000) {
        outputTooLarge = true;
        py.kill();
      }
    });
    py.stderr.on('data', chunk => {
      if (stderr.length < 10000) stderr += chunk.toString().slice(0, 10000 - stderr.length);
    });

    py.on('close', (code) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      if (outputTooLarge) {
        reject(new Error('NEPSE market adapter response exceeded the size limit'));
        return;
      }
      if (code !== 0) {
        reject(new Error(stderr || 'python market adapter failed'));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error('Invalid JSON returned by Python adapter'));
      }
    });

    py.on('error', error => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      reject(error);
    });
  });
}

async function fetchGlobalQuote(symbol, exchange) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const params = new URLSearchParams({
    symbol,
    exchange,
    apikey: process.env.TWELVE_DATA_API_KEY
  });
  let response;
  let data;
  try {
    response = await fetch(`https://api.twelvedata.com/quote?${params}`, { signal: controller.signal });
    data = await response.json();
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok || data.status === 'error' || data.code) {
    throw new Error(data.message || `Twelve Data request failed for ${symbol}`);
  }

  const price = Number(data.close);
  const change = Number(data.percent_change);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(change)) {
    throw new Error(`Twelve Data returned an incomplete quote for ${symbol}`);
  }

  return {
    symbol: data.symbol || symbol,
    company: data.name || symbol,
    price,
    change,
    volume: Number(data.volume || 0),
    high: Number(data.high || price),
    low: Number(data.low || price),
    open: Number(data.open || price),
    close: price,
    signal: change >= 0 ? 'Positive' : 'Negative',
    updatedAt: data.datetime || data.timestamp || null,
    dataSource: 'Twelve Data'
  };
}

function toYahooSymbol(symbol, exchangeId) {
  if (exchangeId === 'nyse' || exchangeId === 'nasdaq') return symbol;
  const suffix = YAHOO_SUFFIXES[exchangeId];
  return suffix ? `${symbol}.${suffix}` : null;
}

async function fetchYahooQuote(stock, exchangeId) {
  const yahooSymbol = toYahooSymbol(stock.symbol, exchangeId);
  if (!yahooSymbol) throw new Error(`Yahoo Finance does not have a configured symbol mapping for ${exchangeId}.`);

  const cached = yahooQuoteCache.get(yahooSymbol);
  if (cached && Date.now() - cached.cachedAt < YAHOO_QUOTE_CACHE_MS) return cached.quote;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response;
  let data;
  try {
    response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1m`,
      { signal: controller.signal, headers: { 'User-Agent': 'TradeVerseAI/1.0' } }
    );
    data = await response.json();
  } finally {
    clearTimeout(timeout);
  }

  const result = data.chart?.result?.[0];
  const meta = result?.meta;
  const price = Number(meta?.regularMarketPrice);
  const change = Number(meta?.regularMarketChangePercent);
  if (!response.ok || data.chart?.error || !Number.isFinite(price) || price <= 0 || !Number.isFinite(change)) {
    throw new Error(data.chart?.error?.description || `Yahoo Finance returned no quote for ${yahooSymbol}.`);
  }

  const quote = {
    symbol: stock.symbol,
    company: meta.longName || meta.shortName || stock.company,
    price,
    change,
    volume: Number(meta.regularMarketVolume || 0),
    high: Number(meta.regularMarketDayHigh || price),
    low: Number(meta.regularMarketDayLow || price),
    open: Number(result.indicators?.quote?.[0]?.open?.at(-1) || price),
    close: price,
    signal: change >= 0 ? 'Positive' : 'Negative',
    updatedAt: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    dataSource: 'Yahoo Finance (unofficial)'
  };
  yahooQuoteCache.set(yahooSymbol, { quote, cachedAt: Date.now() });
  return quote;
}

async function fetchGlobalMarket(exchangeId) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;

  const simulated = getExchangeData(exchangeId);
  const exchangeCode = simulated.shortName;
  const symbolLimit = Math.max(1, Math.min(simulated.stocks.length, Number(process.env.TWELVE_DATA_SYMBOL_LIMIT) || 8));
  const requestedStocks = simulated.stocks.slice(0, symbolLimit);
  const results = await Promise.allSettled(requestedStocks.map(stock => fetchGlobalQuote(stock.symbol, exchangeCode)));
  const stocksFromProvider = results.flatMap((result, index) => result.status === 'fulfilled'
    ? [{ ...requestedStocks[index], ...result.value, sector: requestedStocks[index].sector }]
    : []);
  if (!stocksFromProvider.length) {
    throw new Error('Twelve Data returned no supported quotes for this exchange.');
  }

  return {
    ...simulated,
    stocks: stocksFromProvider,
    liveSymbols: stocksFromProvider.map(stock => stock.symbol),
    unavailableSymbols: results.flatMap((result, index) => result.status === 'rejected' ? [requestedStocks[index].symbol] : []),
    notRequestedSymbols: simulated.stocks.slice(symbolLimit).map(stock => stock.symbol),
    watchlistCount: simulated.stocks.length,
    updatedAt: stocksFromProvider.map(stock => stock.updatedAt).filter(Boolean).sort().at(-1) || null,
    indexDataState: 'REFERENCE',
    topGainers: [...stocksFromProvider].sort((a, b) => b.change - a.change).slice(0, 10),
    topLosers: [...stocksFromProvider].sort((a, b) => a.change - b.change).slice(0, 10)
  };
}

async function fetchYahooMarket(exchangeId) {
  const simulated = getExchangeData(exchangeId);
  if (!toYahooSymbol(simulated.stocks[0]?.symbol || 'A', exchangeId)) return null;

  const symbolLimit = Math.max(1, Math.min(
    simulated.stocks.length,
    Number(process.env.YAHOO_SYMBOL_LIMIT) || 8
  ));
  const requestedStocks = simulated.stocks.slice(0, symbolLimit);
  const results = await Promise.allSettled(requestedStocks.map(stock => fetchYahooQuote(stock, exchangeId)));
  const stocksFromProvider = results.flatMap((result, index) => result.status === 'fulfilled'
    ? [{ ...requestedStocks[index], ...result.value, sector: requestedStocks[index].sector }]
    : []);
  if (!stocksFromProvider.length) return null;

  return {
    ...simulated,
    stocks: stocksFromProvider,
    quoteSymbols: stocksFromProvider.map(stock => stock.symbol),
    unavailableSymbols: results.flatMap((result, index) => result.status === 'rejected' ? [requestedStocks[index].symbol] : []),
    notRequestedSymbols: simulated.stocks.slice(symbolLimit).map(stock => stock.symbol),
    watchlistCount: simulated.stocks.length,
    updatedAt: stocksFromProvider.map(stock => stock.updatedAt).filter(Boolean).sort().at(-1) || null,
    indexDataState: 'REFERENCE',
    topGainers: [...stocksFromProvider].sort((a, b) => b.change - a.change).slice(0, 10),
    topLosers: [...stocksFromProvider].sort((a, b) => a.change - b.change).slice(0, 10)
  };
}

async function fetchGlobalHistory(symbol, exchangeId, outputsize = 180) {
  if (!process.env.TWELVE_DATA_API_KEY) return null;
  const exchange = getExchangeData(exchangeId);
  const params = new URLSearchParams({
    symbol,
    exchange: exchange.shortName,
    interval: '1day',
    outputsize: String(outputsize),
    apikey: process.env.TWELVE_DATA_API_KEY
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response;
  let data;
  try {
    response = await fetch(`https://api.twelvedata.com/time_series?${params}`, { signal: controller.signal });
    data = await response.json();
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok || data.status === 'error' || data.code || !Array.isArray(data.values) || !data.values.length) {
    throw new Error(data.message || `No Twelve Data history is available for ${symbol}.`);
  }
  const history = data.values.map(point => ({
    date: point.datetime,
    timestamp: Date.parse(`${point.datetime}T00:00:00Z`),
    open: Number(point.open),
    high: Number(point.high),
    low: Number(point.low),
    close: Number(point.close),
    volume: Number(point.volume || 0)
  })).filter(point => [point.open, point.high, point.low, point.close].every(Number.isFinite)).reverse();
  if (!history.length) throw new Error(`Twelve Data returned invalid history for ${symbol}.`);
  const current = history.at(-1);
  const previous = history.at(-2);
  return {
    symbol,
    company: data.meta?.name || symbol,
    tradingStartDate: history[0].date,
    history,
    currentPrice: current.close,
    currentChange: previous && previous.close ? ((current.close - previous.close) / previous.close) * 100 : 0,
    currentVolume: current.volume,
    dataSource: 'twelve-data-daily'
  };
}

async function fetchMarketSnapshot(exchangeId = 'nepse') {
  if (exchangeId !== 'nepse') {
    let market = getExchangeData(exchangeId);
    let source = 'simulated-provider';
    try {
      const liveMarket = await fetchGlobalMarket(exchangeId);
      if (liveMarket) {
        market = liveMarket;
        source = 'twelve-data-live';
      } else {
        const yahooMarket = await fetchYahooMarket(exchangeId);
        if (yahooMarket) {
          market = yahooMarket;
          source = 'yahoo-finance-unofficial';
        }
      }
    } catch (error) {
      console.warn(`Provider quotes unavailable for ${market.shortName}:`, error.message);
      try {
        const yahooMarket = await fetchYahooMarket(exchangeId);
        if (yahooMarket) {
          market = yahooMarket;
          source = 'yahoo-finance-unofficial';
        }
      } catch (fallbackError) {
        console.warn(`Yahoo Finance fallback unavailable for ${market.shortName}:`, fallbackError.message);
      }
    }

    return {
      source,
      ...market,
      dashboard: {
        source,
        ...buildDashboardData(exchangeId),
        exchange: market,
        index: market.index,
        indexName: market.indexName,
        marketStatus: market.marketStatus,
        marketOverview: market.stocks.slice(0, 10),
        topGainers: market.topGainers,
        topLosers: market.topLosers,
        aiInsight: {
          title: `${market.shortName} Market Summary`,
          summary: source === 'twelve-data-live' || source === 'yahoo-finance-unofficial'
            ? `Provider quotes are available for ${market.stocks.length} symbols. The displayed index value is a reference, not a live index quote.`
            : `${market.name} is showing simulated educational data because provider quotes are unavailable.`,
          disclaimer: 'Educational paper-trading data only. Not financial advice.'
        }
      }
    };
  }

  try {
    const live = await fetchPythonMarketPayload();
    if (live && Number.isFinite(Number(live.nepseIndex)) && Number(live.nepseIndex) > 0) {
      const liveStocks = Array.isArray(live.stocks) ? live.stocks : [];
      const indexExchange = {
        ...getExchangeData('nepse'),
        index: live.nepseIndex,
        indexChange: live.indexChange,
        indexChangePercent: live.indexChangePercent,
        indexHigh: live.indexHigh,
        indexLow: live.indexLow,
        marketStatus: live.marketStatus,
        stocks: liveStocks
      };
      return {
        source: 'nepse-live',
        ...indexExchange,
        index: live.nepseIndex,
        indexChange: live.indexChange,
        indexChangePercent: live.indexChangePercent,
        indexHigh: live.indexHigh,
        indexLow: live.indexLow,
        previousClose: live.previousClose,
        marketDataState: live.marketDataState,
        updatedAt: live.updatedAt,
        marketStats: live.marketStats,
        marketStatus: live.marketStatus,
        stocks: liveStocks,
        dashboard: {
          source: 'nepse-live',
          ...buildDashboardData('nepse'),
          ...live,
          index: live.nepseIndex,
          indexChange: live.indexChange,
          indexChangePercent: live.indexChangePercent,
          indexHigh: live.indexHigh,
          indexLow: live.indexLow,
          previousClose: live.previousClose,
          marketDataState: live.marketDataState,
          updatedAt: live.updatedAt,
          marketStats: live.marketStats,
          exchange: indexExchange,
          marketStatus: live.marketStatus,
          marketOverview: liveStocks,
          allStocks: liveStocks,
          nepseIndex: live.nepseIndex,
          indexChange: live.indexChange,
          topGainers: live.topGainers,
          topLosers: live.topLosers,
          topTransactions: live.topTransactions,
          aiInsight: {
            title: 'NEPSE Market Summary',
            summary: `${live.stocks.length} securities are present in the NEPSE data feed.`,
            disclaimer: 'Educational paper-trading data only. Not financial advice.'
          }
        }
      };
    }
  } catch (error) {
    console.warn('Live NEPSE feed unavailable, falling back to mock:', error.message);
  }

  return {
    source: 'mock-provider',
    stocks,
    ...getExchangeData('nepse'),
    dashboard: { source: 'mock-provider', ...buildDashboardData('nepse') }
  };
}

module.exports = {
  fetchMarketSnapshot,
  fetchGlobalHistory,
  fetchVercelNepseFunction
};
