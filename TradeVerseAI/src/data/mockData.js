// Historical trading data configuration for each stock
const stockTradingStartDates = {
  'NABIL': '2020-01-15',    // IPO/listing date
  'GBIME': '2018-06-20',
  'HDL': '2019-03-10'
};

const stocks = [
  {
    symbol: 'NABIL',
    company: 'Nabil Bank Limited',
    sector: 'Commercial Banks',
    price: 1245.5,
    change: 1.51,
    volume: 42890,
    signal: 'Bullish',
    confidence: 78,
    high: 1260,
    low: 1215,
    open: 1228,
    close: 1245.5,
    tradingStartDate: stockTradingStartDates['NABIL']
  },
  {
    symbol: 'GBIME',
    company: 'Global IME Bank',
    sector: 'Commercial Banks',
    price: 210.0,
    change: -0.85,
    volume: 112400,
    signal: 'Neutral',
    confidence: 52,
    high: 215,
    low: 208,
    open: 213,
    close: 210,
    tradingStartDate: stockTradingStartDates['GBIME']
  },
  {
    symbol: 'HDL',
    company: 'Himalayan Distillery',
    sector: 'Manufacturing',
    price: 1820.0,
    change: 2.1,
    volume: 18520,
    signal: 'Bullish',
    confidence: 84,
    high: 1850,
    low: 1790,
    open: 1785,
    close: 1820,
    tradingStartDate: stockTradingStartDates['HDL']
  },
  {
    symbol: 'SCB', company: 'Standard Chartered Bank Nepal', sector: 'Commercial Banks', price: 615, change: 0.72, volume: 18400, signal: 'Bullish', confidence: 69, high: 620, low: 605, open: 610, close: 615
  },
  {
    symbol: 'SHIVM', company: 'Shivam Holdings', sector: 'Manufacturing', price: 548, change: -1.18, volume: 53600, signal: 'Bearish', confidence: 61, high: 560, low: 540, open: 555, close: 548
  },
  {
    symbol: 'NLIC', company: 'Nepal Life Insurance', sector: 'Insurance', price: 735, change: 1.04, volume: 29700, signal: 'Bullish', confidence: 72, high: 742, low: 720, open: 728, close: 735
  },
  {
    symbol: 'UPPER', company: 'Upper Tamakoshi Hydropower', sector: 'Hydropower', price: 218, change: -0.46, volume: 89400, signal: 'Neutral', confidence: 55, high: 222, low: 214, open: 219, close: 218
  },
  {
    symbol: 'CIT', company: 'Citizen Investment Trust', sector: 'Investment', price: 2460, change: 1.86, volume: 9200, signal: 'Bullish', confidence: 81, high: 2490, low: 2410, open: 2420, close: 2460
  },
  {
    symbol: 'NTC', company: 'Nepal Telecom', sector: 'Telecommunication', price: 912, change: -0.31, volume: 16500, signal: 'Neutral', confidence: 53, high: 920, low: 905, open: 915, close: 912
  },
  {
    symbol: 'API', company: 'Api Power Company', sector: 'Hydropower', price: 286, change: 2.34, volume: 102300, signal: 'Bullish', confidence: 88, high: 292, low: 278, open: 280, close: 286
  }
];

const exchangeDefinitions = {
  nepse: { name: 'Nepal Stock Exchange', shortName: 'NEPSE', currency: 'NPR', locale: 'en-NP', timeZone: 'Asia/Kathmandu', open: '11:00', close: '15:00', indexName: 'NEPSE Index', index: 2085.42, indexChange: 14.2, currencyRate: 1, stocks },
  nyse: { name: 'New York Stock Exchange', shortName: 'NYSE', currency: 'USD', locale: 'en-US', timeZone: 'America/New_York', open: '09:30', close: '16:00', indexName: 'Dow Jones Industrial Average', index: 45761.32, indexChange: 0.64, currencyRate: 0.0075, symbols: ['JPM', 'WMT', 'V', 'JNJ', 'DIS', 'KO', 'IBM', 'XOM', 'CAT', 'BA', 'MCD', 'GS'] },
  nasdaq: { name: 'Nasdaq Stock Market', shortName: 'NASDAQ', currency: 'USD', locale: 'en-US', timeZone: 'America/New_York', open: '09:30', close: '16:00', indexName: 'Nasdaq Composite', index: 22181.93, indexChange: 1.12, currencyRate: 0.0075, symbols: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AVGO', 'COST', 'NFLX', 'AMD', 'ADBE'] },
  dse: { name: 'Dhaka Stock Exchange', shortName: 'DSE', currency: 'BDT', locale: 'en-BD', timeZone: 'Asia/Dhaka', open: '10:00', close: '14:30', indexName: 'DSEX Index', index: 5724.18, indexChange: -0.28, currencyRate: 0.88, symbols: ['GP', 'SQURPHARMA', 'BATBC', 'BRACBANK', 'RENATA', 'BEXIMCO', 'OLYMPIC', 'CITYBANK', 'EBL', 'LHBL', 'IFIC', 'ACMELAB'] },
  sse: { name: 'Shanghai Stock Exchange', shortName: 'SSE', currency: 'CNY', locale: 'zh-CN', timeZone: 'Asia/Shanghai', open: '09:30', close: '15:00', indexName: 'Shanghai Composite', index: 3387.83, indexChange: 0.91, currencyRate: 0.054, symbols: ['601318', '600519', '600036', '601398', '600276', '600887', '601857', '600030', '601288', '600028', '600900', '601166'] },
  hkex: { name: 'Hong Kong Stock Exchange', shortName: 'HKEX', currency: 'HKD', locale: 'en-HK', timeZone: 'Asia/Hong_Kong', open: '09:30', close: '16:00', indexName: 'Hang Seng Index', index: 26435.12, indexChange: -0.42, currencyRate: 0.058, symbols: ['0700', '9988', '3690', '0005', '1299', '0941', '2318', '1810', '0388', '0883', '0016', '0823'] },
  nse: { name: 'National Stock Exchange of India', shortName: 'NSE', currency: 'INR', locale: 'en-IN', timeZone: 'Asia/Kolkata', open: '09:15', close: '15:30', indexName: 'NIFTY 50', index: 25108.3, indexChange: 0.37, currencyRate: 0.62, symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'ITC', 'LT', 'BHARTIARTL', 'AXISBANK', 'MARUTI', 'SUNPHARMA'] },
  lse: { name: 'London Stock Exchange', shortName: 'LSE', currency: 'GBP', locale: 'en-GB', timeZone: 'Europe/London', open: '08:00', close: '16:30', indexName: 'FTSE 100', index: 8276.17, indexChange: 0.22, currencyRate: 0.0057, symbols: ['SHEL', 'AZN', 'HSBA', 'ULVR', 'BP', 'GSK', 'RIO', 'DGE', 'LSEG', 'REL', 'BARC', 'VOD'] },
  tse: { name: 'Tokyo Stock Exchange', shortName: 'TSE', currency: 'JPY', locale: 'ja-JP', timeZone: 'Asia/Tokyo', open: '09:00', close: '15:30', indexName: 'Nikkei 225', index: 44768.12, indexChange: 0.83, currencyRate: 1.12, symbols: ['7203', '6758', '9984', '6861', '8306', '9432', '8035', '6098', '6501', '7267', '7974', '9433'] },
  asx: { name: 'Australian Securities Exchange', shortName: 'ASX', currency: 'AUD', locale: 'en-AU', timeZone: 'Australia/Sydney', open: '10:00', close: '16:00', indexName: 'ASX 200', index: 8784.2, indexChange: -0.16, currencyRate: 0.011, symbols: ['BHP', 'CBA', 'CSL', 'NAB', 'WBC', 'ANZ', 'WES', 'WOW', 'FMG', 'MQG', 'TLS', 'RIO'] }
};

const exchangeIds = Object.keys(exchangeDefinitions);

function getMarketStatus(definition) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: definition.timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const minutes = Number(values.hour) * 60 + Number(values.minute);
  const [openHour, openMinute] = definition.open.split(':').map(Number);
  const [closeHour, closeMinute] = definition.close.split(':').map(Number);
  const weekday = !['Sat', 'Sun'].includes(values.weekday);
  const isOpen = weekday && minutes >= openHour * 60 + openMinute && minutes < closeHour * 60 + closeMinute;
  return { state: isOpen ? 'OPEN' : 'CLOSED', isOpen, localTime: `${values.hour}:${values.minute}`, session: `${definition.open}-${definition.close}`, timeZone: definition.timeZone };
}

function createExchangeStocks(definition) {
  return definition.symbols.map((symbol, index) => {
    const direction = ((index * 7 + symbol.length) % 5) - 2;
    const change = Number((direction * 0.47 + (index % 3) * 0.18).toFixed(2));
    const price = Number((definition.index / (18 + index) + (index * 13)).toFixed(2));
    return {
      symbol,
      company: `${symbol} ${definition.shortName} Holdings`,
      sector: ['Technology', 'Finance', 'Energy', 'Consumer', 'Healthcare'][index % 5],
      price,
      change,
      volume: 12000 + index * 11300,
      high: Number((price * 1.02).toFixed(2)),
      low: Number((price * 0.98).toFixed(2)),
      open: Number((price * (1 - change / 100 / 2)).toFixed(2)),
      close: price,
      signal: change >= 0 ? 'Bullish' : 'Bearish',
      confidence: Math.min(95, 55 + Math.round(Math.abs(change) * 10))
    };
  });
}

function getExchangeData(exchangeId = 'nepse') {
  const id = exchangeDefinitions[exchangeId] ? exchangeId : 'nepse';
  const definition = exchangeDefinitions[id];
  const exchangeStocks = definition.stocks || createExchangeStocks(definition);
  return {
    id,
    name: definition.name,
    shortName: definition.shortName,
    currency: definition.currency,
    locale: definition.locale,
    currencyRate: definition.currencyRate,
    indexName: definition.indexName,
    index: definition.index,
    indexChange: definition.indexChange,
    marketStatus: getMarketStatus(definition),
    stocks: exchangeStocks,
    topGainers: [...exchangeStocks].sort((a, b) => b.change - a.change).slice(0, 10),
    topLosers: [...exchangeStocks].sort((a, b) => a.change - b.change).slice(0, 10)
  };
}

const holdings = [
  {
    symbol: 'NABIL',
    units: 320,
    avgCost: 1180,
    currentPrice: 1245.5,
    unrealizedPL: 20960
  },
  {
    symbol: 'GBIME',
    units: 480,
    avgCost: 215,
    currentPrice: 210,
    unrealizedPL: -2400
  },
  {
    symbol: 'HDL',
    units: 37,
    avgCost: 1720,
    currentPrice: 1820,
    unrealizedPL: 3700
  }
];

let sprintItems = [
  { id: 1, title: 'Backlog CRUD API', description: 'Create, update, and remove sprint work items.', owner: 'Backend', status: 'Done', points: 5, priority: 'High', createdAt: '2026-09-01' },
  { id: 2, title: 'Sprint planning form', description: 'Capture the next sprint scope with validation.', owner: 'Frontend', status: 'In Progress', points: 3, priority: 'High', createdAt: '2026-09-02' },
  { id: 3, title: 'Velocity insights', description: 'Show completed points and AI backlog guidance.', owner: 'AI Team', status: 'Review', points: 5, priority: 'Medium', createdAt: '2026-09-03' },
  { id: 4, title: 'Retrospective report', description: 'Generate a weekly summary from delivery signals.', owner: 'Product', status: 'Todo', points: 3, priority: 'Medium', createdAt: '2026-09-04' }
];
let nextSprintItemId = 5;
let latestRetrospective = null;

function normalizeSprintItem(payload = {}, existing = {}) {
  return {
    ...existing,
    title: String(payload.title ?? existing.title ?? '').trim(),
    description: String(payload.description ?? existing.description ?? '').trim(),
    owner: String(payload.owner ?? existing.owner ?? 'Unassigned').trim(),
    status: ['Todo', 'In Progress', 'Review', 'Done'].includes(payload.status ?? existing.status) ? (payload.status ?? existing.status) : 'Todo',
    points: Math.max(1, Math.min(13, Number(payload.points ?? existing.points ?? 1))),
    priority: ['Low', 'Medium', 'High'].includes(payload.priority ?? existing.priority) ? (payload.priority ?? existing.priority) : 'Medium'
  };
}

function getSprintMetrics() {
  const totalPoints = sprintItems.reduce((sum, item) => sum + item.points, 0);
  const completedPoints = sprintItems.filter(item => item.status === 'Done').reduce((sum, item) => sum + item.points, 0);
  const progress = totalPoints ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const velocityTarget = 16;
  const remainingPoints = totalPoints - completedPoints;
  const suggestions = [];

  if (completedPoints < velocityTarget * 0.5) suggestions.push('Move one high-priority item into the next sprint and pair on the API work to protect delivery momentum.');
  if (remainingPoints > velocityTarget * 0.5) suggestions.push('Trim or split the largest unfinished story before committing to new scope.');
  if (!suggestions.length) suggestions.push('Velocity is on track. Reserve the next planning session for quality checks and stakeholder feedback.');

  return { completedPoints, totalPoints, remainingPoints, progress, velocityTarget, suggestions };
}

function getSprintData() {
  return {
    sprint: { name: 'Sprint 2', week: 'Week 4', goal: 'Turn the planning workflow into a measurable, AI-assisted delivery loop.' },
    items: sprintItems,
    metrics: getSprintMetrics(),
    retrospective: latestRetrospective
  };
}

function createSprintItem(payload) {
  const item = normalizeSprintItem(payload);
  if (!item.title) throw new Error('Title is required.');
  item.id = nextSprintItemId++;
  item.createdAt = new Date().toISOString().slice(0, 10);
  sprintItems.push(item);
  return item;
}

function updateSprintItem(id, payload) {
  const index = sprintItems.findIndex(item => item.id === Number(id));
  if (index < 0) return null;
  const item = normalizeSprintItem(payload, sprintItems[index]);
  if (!item.title) throw new Error('Title is required.');
  sprintItems[index] = item;
  return item;
}

function deleteSprintItem(id) {
  const index = sprintItems.findIndex(item => item.id === Number(id));
  if (index < 0) return false;
  sprintItems.splice(index, 1);
  return true;
}

function generateRetrospective(notes = '') {
  const metrics = getSprintMetrics();
  const completed = sprintItems.filter(item => item.status === 'Done').map(item => item.title);
  latestRetrospective = {
    generatedAt: new Date().toISOString(),
    headline: metrics.progress >= 70 ? 'Sprint delivery is healthy' : 'Sprint delivery needs focus',
    summary: `The team completed ${metrics.completedPoints} of ${metrics.totalPoints} planned points (${metrics.progress}%). ${completed.length ? `Completed work includes ${completed.join(', ')}.` : 'No work is marked complete yet.'}`,
    wentWell: completed.length ? `The team closed ${completed.length} backlog item${completed.length === 1 ? '' : 's'} and has visible ownership across the sprint.` : 'The backlog is defined and ready for focused execution.',
    improve: metrics.remainingPoints ? 'Break down unfinished work and make the next owner handoff explicit before adding scope.' : 'Keep the delivery rhythm and add a small buffer for regression testing.',
    action: metrics.suggestions[0],
    notes: String(notes).trim()
  };
  return latestRetrospective;
}

function computePortfolio() {
  const cashBalance = 682400;
  const marketValue = holdings.reduce((sum, item) => sum + item.units * item.currentPrice, 0);
  const totalNetWorth = cashBalance + marketValue;
  const totalProfitLoss = holdings.reduce((sum, item) => sum + item.unrealizedPL, 0);

  return {
    cashBalance,
    marketValue,
    totalNetWorth,
    totalProfitLoss,
    investedCapital: holdings.reduce((sum, item) => sum + item.units * item.avgCost, 0),
    holdings
  };
}

function buildDashboardData(exchangeId = 'nepse') {
  const portfolio = computePortfolio();
  const market = getExchangeData(exchangeId);
  return {
    greeting: 'Good morning, Trader',
    virtualBuyingPower: 682400,
    portfolioValue: portfolio.totalNetWorth,
    availableCash: portfolio.cashBalance,
    exchange: market,
    index: market.index,
    indexName: market.indexName,
    marketStatus: market.marketStatus,
    marketOverview: market.stocks,
    topGainers: market.topGainers,
    topLosers: market.topLosers,
    aiInsight: {
      title: `${market.shortName} Market Momentum`,
      summary: `${market.name} is showing ${market.indexChange >= 0 ? 'positive' : 'negative'} index momentum across its leading listed companies.`,
      confidence: 78,
      disclaimer: 'Experimental AI signal for educational purposes only. Not financial advice.'
    }
  };
}

function createTradeRequest(payload) {
  const qty = Number(payload.quantity || 0);
  const price = Number(payload.price || 0);
  return {
    symbol: String(payload.symbol || '').toUpperCase(),
    side: String(payload.side || 'BUY').toUpperCase(),
    quantity: qty,
    estimatedPrice: price,
    total: qty * price,
    status: 'simulated',
    timestamp: new Date().toISOString()
  };
}

// Generate candlestick data for a given stock symbol
function generateCandlestickData(symbol, days = 180) {
  const stockConfig = {
    'NABIL': { basePrice: 950, volatility: 0.04, trend: 0.0008 },
    'GBIME': { basePrice: 180, volatility: 0.06, trend: 0.0005 },
    'HDL': { basePrice: 1500, volatility: 0.05, trend: 0.0010 }
  };

  const config = stockConfig[symbol] || { basePrice: 100, volatility: 0.03, trend: 0.0005 };
  const data = [];
  const now = new Date();
  let price = config.basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // Generate realistic OHLC data
    const dailyReturn = (Math.random() - 0.5) * config.volatility + config.trend;
    const openPrice = price;
    price = openPrice * (1 + dailyReturn);
    
    const highPrice = Math.max(openPrice, price) * (1 + Math.random() * 0.01);
    const lowPrice = Math.min(openPrice, price) * (1 - Math.random() * 0.01);
    const closePrice = lowPrice + Math.random() * (highPrice - lowPrice);
    
    const volume = Math.floor(30000 + Math.random() * 100000);

    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      open: Math.round(openPrice * 100) / 100,
      high: Math.round(highPrice * 100) / 100,
      low: Math.round(lowPrice * 100) / 100,
      close: Math.round(closePrice * 100) / 100,
      volume
    });
  }

  return data;
}

// Generate NEPSE index historical data
function generateNepseIndexHistory(days = 180) {
  const data = [];
  const now = new Date();
  let indexValue = 1950;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dailyChange = (Math.random() - 0.48) * 50 + 5; // Slight upward bias
    indexValue += dailyChange;
    
    const highIndex = indexValue * (1 + Math.random() * 0.005);
    const lowIndex = indexValue * (1 - Math.random() * 0.005);
    const openIndex = highIndex - Math.random() * (highIndex - lowIndex);

    const volume = Math.floor(100000 + Math.random() * 500000);

    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      open: Math.round(openIndex),
      high: Math.round(highIndex),
      low: Math.round(lowIndex),
      close: Math.round(indexValue),
      volume
    });
  }

  return data;
}

// Get candlestick data for a specific stock
function getStockHistory(symbol, days = 180) {
  const history = generateCandlestickData(symbol, days);
  const stock = stocks.find(s => s.symbol === symbol);
  
  return {
    symbol,
    company: stock?.company || 'Unknown',
    sector: stock?.sector || 'Unknown',
    tradingStartDate: stock?.tradingStartDate || '2018-01-01',
    history,
    currentPrice: stock?.price || 0,
    currentChange: stock?.change || 0,
    currentVolume: stock?.volume || 0
  };
}

// Get NEPSE index history
function getNepseHistory(days = 180) {
  const history = generateNepseIndexHistory(days);
  
  return {
    symbol: 'NEPSE',
    name: 'Nepal Stock Exchange Index',
    tradingStartDate: '2007-01-09',
    history,
    currentIndex: 2085.42,
    currentChange: 14.2
  };
}

module.exports = {
  stocks,
  exchangeIds,
  getExchangeData,
  holdings,
  computePortfolio,
  buildDashboardData,
  createTradeRequest,
  generateCandlestickData,
  generateNepseIndexHistory,
  getStockHistory,
  getNepseHistory,
  getSprintData,
  createSprintItem,
  updateSprintItem,
  deleteSprintItem,
  generateRetrospective
};
