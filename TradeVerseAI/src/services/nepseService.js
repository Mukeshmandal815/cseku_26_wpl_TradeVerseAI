const { stocks, buildDashboardData, getExchangeData } = require('../data/mockData');
const { spawn } = require('child_process');
const path = require('path');

function fetchPythonMarketPayload() {
  return new Promise((resolve, reject) => {
    const projectRoot = path.join(__dirname, '..', '..');
    const pythonBin = 'C:\\Users\\User\\AppData\\Local\\Programs\\Python\\Python314\\python.exe';

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

    py.stdout.on('data', (chunk) => { stdout += chunk; });
    py.stderr.on('data', (chunk) => { stderr += chunk; });

    py.on('close', (code) => {
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
  });
}

async function fetchGlobalQuote(symbol, exchange) {
  const params = new URLSearchParams({
    symbol,
    exchange,
    apikey: process.env.TWELVE_DATA_API_KEY
  });
  const response = await fetch(`https://api.twelvedata.com/quote?${params}`);
  const data = await response.json();

  if (!response.ok || data.status === 'error' || data.code) {
    throw new Error(data.message || `Twelve Data request failed for ${symbol}`);
  }

  const price = Number(data.close);
  const change = Number(data.percent_change);
  if (!Number.isFinite(price) || !Number.isFinite(change)) {
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
    signal: change >= 0 ? 'Bullish' : 'Bearish',
    confidence: Math.min(95, 55 + Math.round(Math.abs(change) * 10))
  };
}

async function fetchGlobalMarket(exchangeId) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;

  const simulated = getExchangeData(exchangeId);
  const exchangeCode = simulated.shortName;
  const quotes = await Promise.all(simulated.stocks.map(stock => fetchGlobalQuote(stock.symbol, exchangeCode)));
  const stocksFromProvider = quotes.map((quote, index) => ({
    ...simulated.stocks[index],
    ...quote,
    sector: simulated.stocks[index].sector
  }));

  return {
    ...simulated,
    stocks: stocksFromProvider,
    topGainers: [...stocksFromProvider].sort((a, b) => b.change - a.change).slice(0, 10),
    topLosers: [...stocksFromProvider].sort((a, b) => a.change - b.change).slice(0, 10)
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
      }
    } catch (error) {
      console.warn(`Live ${market.shortName} feed unavailable, falling back to mock:`, error.message);
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
          title: `${market.shortName} Live Momentum`,
          summary: source === 'twelve-data-live' ? `Market data updated from Twelve Data for ${market.name}.` : `${market.name} is using simulated educational data.`,
          confidence: source === 'twelve-data-live' ? 84 : 78,
          disclaimer: 'Experimental AI signal for educational purposes only. Not financial advice.'
        }
      }
    };
  }

  try {
    const live = await fetchPythonMarketPayload();
    if (live && Array.isArray(live.stocks) && live.stocks.length > 0) {
      return {
        source: 'nepse-live',
        ...getExchangeData('nepse'),
        index: live.nepseIndex,
        indexChange: live.indexChange,
        marketStatus: live.marketStatus,
        stocks: live.stocks,
        dashboard: {
          source: 'nepse-live',
          ...buildDashboardData('nepse'),
          ...live,
          index: live.nepseIndex,
          indexChange: live.indexChange,
          exchange: { ...getExchangeData('nepse'), index: live.nepseIndex, indexChange: live.indexChange, marketStatus: live.marketStatus },
          marketStatus: live.marketStatus,
          marketOverview: live.stocks.slice(0, 10),  // Show top 10 in dashboard summary
          allStocks: live.stocks,                     // Keep all for markets view
          nepseIndex: live.nepseIndex,
          indexChange: live.indexChange,
          topGainers: live.topGainers,
          topLosers: live.topLosers,
          aiInsight: {
            title: 'Live NEPSE Momentum',
            summary: 'Market data updated from live NEPSE feed. ' + live.stocks.length + ' stocks trading.',
            confidence: 82,
            disclaimer: 'Experimental AI signal for educational purposes only. Not financial advice.'
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
  fetchMarketSnapshot
};
