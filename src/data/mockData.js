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
    close: 1245.5
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
    close: 210
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
    close: 1820
  }
];

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

function buildDashboardData() {
  const portfolio = computePortfolio();
  return {
    greeting: 'Good morning, Trader',
    virtualBuyingPower: 682400,
    portfolioValue: portfolio.totalNetWorth,
    availableCash: portfolio.cashBalance,
    nepseIndex: 2085.42,
    indexChange: 14.2,
    marketOverview: stocks,
    aiInsight: {
      title: 'Banking Sector Momentum',
      summary: 'Market sentiment is moderately bullish based on recent price movement, strong quarterly reporting, and positive news sentiment scores.',
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

module.exports = {
  stocks,
  holdings,
  computePortfolio,
  buildDashboardData,
  createTradeRequest
};
