const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { after, before, test } = require('node:test');
const app = require('../server');
const { fetchVercelNepseFunction } = require('../src/services/nepseService');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    const closed = new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    server.closeAllConnections?.();
    await closed;
  }
});

test('inline frontend script parses without nested or duplicate declarations', () => {
  const html = readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0);
  for (const script of scripts) {
    assert.doesNotThrow(() => new Function(script[1]));
  }
});

test('dashboard provides the three tabbed market-performance tables', () => {
  const html = readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  for (const tab of ['Top Gainers', 'Top Losers', 'Top Turnover', 'Top Volume', 'Top Transactions', 'Top Demand', 'Top Supply', 'Active Scrips']) {
    assert.ok(html.includes(`>${tab}</button>`), `Missing market tab: ${tab}`);
  }
  assert.equal((html.match(/class="performer-more/g) || []).length, 3);
  assert.match(html, /Live order-book data is not provided by this exchange feed/);
});

test('demo sign-in uses browser-local data and never sends or stores the password', () => {
  const html = readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  assert.match(html, /Enter any password to continue/);
  assert.match(html, /Continue in Demo Mode/);
  assert.match(html, /localStorage\.setItem\(DEMO_USER_KEY, email\)/);
  assert.match(html, /document\.getElementById\('loginPassword'\)\.value = ''/);
  assert.match(html, /DEMO_DATA_PREFIX/);
  assert.doesNotMatch(html, /\/api\/auth\/(login|signup|session|logout)/);
  assert.doesNotMatch(html, /\/api\/(portfolio|orders|trade)/);
});

test('Vercel config builds and routes the NEPSE Python function with its WASM asset', () => {
  const config = JSON.parse(readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  const pythonBuild = config.builds.find(build => build.src === 'api/nepse.py');
  assert.equal(pythonBuild?.use, '@vercel/python');
  assert.match(pythonBuild?.config?.includeFiles || '', /css\.wasm/);
  assert.equal(config.routes[0].src, '/api/nepse');
  assert.equal(config.routes[0].dest, 'api/nepse.py');
});

test('health endpoint reports browser-only demo storage', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.status, 'ok');
  assert.equal(payload.storageMode, 'browser-demo');
});

test('Vercel NEPSE client calls the Python function and parses its response', async () => {
  const originalVercel = process.env.VERCEL;
  const originalVercelUrl = process.env.VERCEL_URL;
  const originalBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const originalFetch = global.fetch;
  process.env.VERCEL = '1';
  process.env.VERCEL_URL = 'tradeverse.example.vercel.app';
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET = 'preview-bypass-test';
  let requestedUrl;
  let requestedHeaders;
  global.fetch = async (url, options) => {
    requestedUrl = new URL(url);
    requestedHeaders = options.headers;
    return new Response(JSON.stringify({ source: 'nepse-live', stocks: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
  try {
    const payload = await fetchVercelNepseFunction('stock', 'NABIL');
    assert.equal(requestedUrl.origin, 'https://tradeverse.example.vercel.app');
    assert.equal(requestedUrl.pathname, '/api/nepse');
    assert.equal(requestedUrl.searchParams.get('action'), 'stock');
    assert.equal(requestedUrl.searchParams.get('symbol'), 'NABIL');
    assert.equal(requestedHeaders['x-vercel-protection-bypass'], 'preview-bypass-test');
    assert.equal(payload.source, 'nepse-live');
  } finally {
    global.fetch = originalFetch;
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
    if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = originalVercelUrl;
    if (originalBypassSecret === undefined) delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    else process.env.VERCEL_AUTOMATION_BYPASS_SECRET = originalBypassSecret;
  }
});

test('database-backed auth and portfolio endpoints are not exposed in demo mode', async () => {
  const portfolio = await fetch(`${baseUrl}/api/portfolio`);
  const trade = await fetch(`${baseUrl}/api/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exchange: 'nepse', symbol: 'NABIL', side: 'BUY', quantity: 1 })
  });
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@example.com', password: 'unused' })
  });
  for (const response of [portfolio, trade, login]) {
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Unknown API endpoint.' });
  }
});

test('market endpoint rejects exchanges outside the configured universe', async () => {
  const response = await fetch(`${baseUrl}/api/market?exchange=not-an-exchange`);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'Unsupported exchange.');
});

test('global market response includes only quotes returned by the provider', async () => {
  const originalKey = process.env.TWELVE_DATA_API_KEY;
  const originalFetch = global.fetch;
  process.env.TWELVE_DATA_API_KEY = 'unit-test-key';
  global.fetch = async url => {
    const symbol = new URL(url).searchParams.get('symbol');
    const payload = symbol === 'JPM'
      ? { symbol, name: 'JPMorgan Chase', close: '202.50', percent_change: '0.5', volume: '1200', high: '204', low: '201', open: '202', datetime: '2026-10-08' }
      : { status: 'error', message: 'Symbol unavailable' };
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const response = await originalFetch(`${baseUrl}/api/market?exchange=nyse`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.source, 'twelve-data-live');
    assert.deepEqual(payload.liveSymbols, ['JPM']);
    assert.equal(payload.stocks.length, 1);
    assert.equal(payload.stocks[0].price, 202.5);
    assert.ok(payload.unavailableSymbols.length > 0);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.TWELVE_DATA_API_KEY;
    else process.env.TWELVE_DATA_API_KEY = originalKey;
  }
});

test('global market uses Yahoo Finance quotes without a key where symbols are covered', async () => {
  const originalKey = process.env.TWELVE_DATA_API_KEY;
  const originalFetch = global.fetch;
  delete process.env.TWELVE_DATA_API_KEY;
  global.fetch = async url => {
    const yahooSymbol = new URL(url).pathname.split('/').pop();
    const payload = yahooSymbol === 'JPM'
      ? {
          chart: {
            result: [{
              meta: {
                regularMarketPrice: 202.5,
                regularMarketChangePercent: 0.5,
                regularMarketVolume: 1200,
                regularMarketDayHigh: 204,
                regularMarketDayLow: 201,
                regularMarketTime: 1791489600,
                longName: 'JPMorgan Chase & Co.'
              },
              indicators: { quote: [{ open: [202] }] }
            }],
            error: null
          }
        }
      : { chart: { result: null, error: { description: 'Symbol unavailable' } } };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
  try {
    const response = await originalFetch(`${baseUrl}/api/market?exchange=nyse`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.source, 'yahoo-finance-unofficial');
    assert.deepEqual(payload.quoteSymbols, ['JPM']);
    assert.equal(payload.stocks.length, 1);
    assert.equal(payload.stocks[0].price, 202.5);
    assert.equal(payload.stocks[0].dataSource, 'Yahoo Finance (unofficial)');
    assert.equal(payload.updatedAt, new Date(1791489600 * 1000).toISOString());
    assert.ok(payload.unavailableSymbols.length > 0);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.TWELVE_DATA_API_KEY;
    else process.env.TWELVE_DATA_API_KEY = originalKey;
  }
});

test('markets without a configured Yahoo ticker suffix remain simulated without provider calls', async () => {
  const originalKey = process.env.TWELVE_DATA_API_KEY;
  const originalFetch = global.fetch;
  delete process.env.TWELVE_DATA_API_KEY;
  global.fetch = async () => {
    throw new Error('Yahoo should not be called for an unsupported exchange.');
  };
  try {
    const response = await originalFetch(`${baseUrl}/api/market?exchange=dse`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.source, 'simulated-provider');
    assert.equal(payload.stocks[0].source, 'simulated');
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.TWELVE_DATA_API_KEY;
    else process.env.TWELVE_DATA_API_KEY = originalKey;
  }
});

test('Yahoo ticker suffixes are applied to the configured international exchanges', async () => {
  const originalKey = process.env.TWELVE_DATA_API_KEY;
  const originalFetch = global.fetch;
  const requestedSymbols = [];
  delete process.env.TWELVE_DATA_API_KEY;
  global.fetch = async url => {
    requestedSymbols.push(new URL(url).pathname.split('/').pop());
    return new Response(JSON.stringify({
      chart: {
        result: [{
          meta: {
            regularMarketPrice: 100,
            regularMarketChangePercent: 1,
            regularMarketTime: 1791489600,
            longName: 'Example Corporation'
          },
          indicators: { quote: [{ open: [99] }] }
        }],
        error: null
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const marketSymbols = [
      ['nasdaq', 'AAPL'],
      ['sse', '601318.SS'],
      ['hkex', '0700.HK'],
      ['nse', 'RELIANCE.NS'],
      ['lse', 'SHEL.L'],
      ['tse', '7203.T'],
      ['asx', 'BHP.AX']
    ];
    for (const [exchange, yahooSymbol] of marketSymbols) {
      const response = await originalFetch(`${baseUrl}/api/market?exchange=${exchange}`);
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.source, 'yahoo-finance-unofficial');
      assert.ok(requestedSymbols.includes(yahooSymbol), `Expected Yahoo symbol ${yahooSymbol}`);
    }
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.TWELVE_DATA_API_KEY;
    else process.env.TWELVE_DATA_API_KEY = originalKey;
  }
});
