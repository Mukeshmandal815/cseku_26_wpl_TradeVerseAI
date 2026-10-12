const express = require('express');
const helmet = require('helmet');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
dotenv.config();
const { fetchMarketSnapshot, fetchGlobalHistory, fetchVercelNepseFunction } = require('./src/services/nepseService');
const {
  exchangeIds,
  getExchangeData,
  getStockHistory,
  getNepseHistory
} = require('./src/data/mockData');

const app = express();
const PORT = process.env.PORT || 3000;
const projectRoot = __dirname;

app.disable('x-powered-by');
if (process.env.VERCEL) app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"]
    }
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

function validExchange(exchange) {
  return typeof exchange === 'string' && exchangeIds.includes(exchange);
}

function resolvePythonBin() {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;

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

function runPythonAdapter(action, symbol, res) {
  if (process.env.VERCEL) {
    fetchVercelNepseFunction(action, symbol).then(
      payload => res.json(payload),
      error => {
        console.error('NEPSE Python function request failed:', error.message);
        res.status(502).json({ error: 'NEPSE data provider is unavailable.' });
      }
    );
    return;
  }

  const pythonBin = resolvePythonBin();
  const args = [path.join(projectRoot, 'live_nepse_adapter.py'), action];
  if (symbol) args.push(symbol);
  const py = spawn(pythonBin, args, {
    cwd: projectRoot,
    env: {
      ...process.env,
      PYTHONPATH: [projectRoot, path.dirname(projectRoot), process.env.PYTHONPATH].filter(Boolean).join(path.delimiter)
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';
  let responseSent = false;
  let outputTooLarge = false;
  const timeout = setTimeout(() => {
    py.kill();
    if (!responseSent) {
      responseSent = true;
      res.status(504).json({ error: 'NEPSE data provider timed out.' });
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
  py.on('error', error => {
    clearTimeout(timeout);
    if (responseSent) return;
    responseSent = true;
    console.error('Could not start NEPSE data adapter:', error.message);
    res.status(503).json({ error: 'NEPSE data provider is unavailable.' });
  });
  py.on('close', code => {
    clearTimeout(timeout);
    if (responseSent) return;
    responseSent = true;
    if (outputTooLarge) return res.status(502).json({ error: 'NEPSE data provider returned an oversized response.' });
    if (code !== 0) {
      console.error('NEPSE data adapter failed:', stderr.slice(0, 1000));
      return res.status(503).json({ error: 'NEPSE data provider is unavailable.' });
    }
    try {
      return res.json(JSON.parse(stdout));
    } catch {
      console.error('NEPSE adapter returned invalid JSON.');
      return res.status(502).json({ error: 'NEPSE data provider returned an invalid response.' });
    }
  });
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'TradeVerse AI',
    mode: 'educational-paper-trading',
    storageMode: 'browser-demo'
  });
});

app.get('/api/dashboard', async (req, res) => {
  const exchange = String(req.query.exchange || 'nepse').toLowerCase();
  if (!validExchange(exchange)) return res.status(400).json({ error: 'Unsupported exchange.' });
  try {
    const snapshot = await fetchMarketSnapshot(exchange);
    if (exchange !== 'nepse') {
      return res.json(snapshot.dashboard);
    }
    return res.json({
      ...snapshot.dashboard,
      exchange: snapshot,
      index: snapshot.index,
      marketOverview: snapshot.stocks,
      source: snapshot.source
    });
  } catch (error) {
    console.error('Dashboard market request failed:', error.message);
    return res.status(502).json({ error: 'Unable to load market data.' });
  }
});

app.get('/api/market', async (req, res) => {
  const exchange = String(req.query.exchange || 'nepse').toLowerCase();
  if (!validExchange(exchange)) return res.status(400).json({ error: 'Unsupported exchange.' });
  try {
    return res.json(await fetchMarketSnapshot(exchange));
  } catch (error) {
    console.error('Market request failed:', error.message);
    return res.status(502).json({ error: 'Unable to load market data.' });
  }
});

app.get('/api/stock/:symbol', (req, res) => {
  const symbol = String(req.params.symbol || '').toUpperCase();
  if (!/^[A-Z0-9.-]{1,20}$/.test(symbol)) return res.status(400).json({ error: 'Invalid stock symbol.' });
  runPythonAdapter('stock', symbol, res);
});

app.get('/api/history/nepse', (req, res) => {
  const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 180, 1), 730);
  try {
    return res.json(getNepseHistory(days));
  } catch (error) {
    console.error('NEPSE history request failed:', error.message);
    return res.status(500).json({ error: 'Unable to load NEPSE index history.' });
  }
});

app.get('/api/history/:symbol', async (req, res) => {
  const symbol = String(req.params.symbol || '').toUpperCase();
  if (!/^[A-Z0-9.-]{1,20}$/.test(symbol)) return res.status(400).json({ error: 'Invalid stock symbol.' });
  const days = Math.min(Math.max(Number.parseInt(req.query.days, 10) || 180, 1), 730);
  const exchange = String(req.query.exchange || 'nepse').toLowerCase();
  if (!validExchange(exchange)) return res.status(400).json({ error: 'Unsupported exchange.' });
  try {
    if (exchange !== 'nepse' && process.env.TWELVE_DATA_API_KEY) {
      const history = await fetchGlobalHistory(symbol, exchange, days);
      return res.json(history);
    }
    if (exchange !== 'nepse') {
      const quote = getExchangeData(exchange).stocks.find(stock => stock.symbol === symbol);
      if (!quote) return res.status(404).json({ error: 'Symbol is not in this exchange watchlist.' });
      return res.json({
        ...getStockHistory(symbol, days),
        company: quote.company,
        currentPrice: quote.price,
        currentChange: quote.change,
        currentVolume: quote.volume,
        dataSource: 'simulated'
      });
    }
    return res.json({ ...getStockHistory(symbol, days), dataSource: 'simulated' });
  } catch (error) {
    console.warn('Stock history provider request failed:', error.message);
    return res.status(502).json({ error: 'Historical data is unavailable for this symbol from the configured provider.' });
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API endpoint.' }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TradeVerse AI is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
