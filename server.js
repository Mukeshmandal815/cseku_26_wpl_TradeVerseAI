const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { spawn } = require('child_process');
const { fetchMarketSnapshot } = require('./src/services/nepseService');
const { buildDashboardData, createTradeRequest } = require('./src/data/mockData');

const pythonBin = 'C:\\Users\\User\\AppData\\Local\\Programs\\Python\\Python314\\python.exe';
const projectRoot = __dirname;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'TradeVerse AI',
    mode: 'educational-demo'
  });
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const snapshot = await fetchMarketSnapshot();
    res.json(snapshot.dashboard);
  } catch (error) {
    res.status(500).json({
      error: 'Unable to load dashboard data',
      message: error.message
    });
  }
});

app.get('/api/market', async (req, res) => {
  try {
    const snapshot = await fetchMarketSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({
      error: 'Unable to load market data',
      message: error.message
    });
  }
});

app.get('/api/stock/:symbol', (req, res) => {
  const symbol = req.params.symbol;
  const py = spawn(pythonBin, ['live_nepse_adapter.py', 'stock', symbol], {
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
      return res.status(500).json({
        error: 'stock detail fetch failed',
        detail: stderr || 'Unknown Python error'
      });
    }

    try {
      const payload = JSON.parse(stdout);
      res.json(payload);
    } catch (err) {
      res.status(500).json({ error: 'Invalid stock detail payload', detail: stdout });
    }
  });
});

app.get('/api/portfolio', (req, res) => {
  const { computePortfolio } = require('./src/data/mockData');
  res.json({
    ...computePortfolio(),
    disclaimer: 'Educational paper-trading portfolio only.'
  });
});

app.post('/api/trade', (req, res) => {
  const trade = createTradeRequest(req.body || {});

  if (!trade.symbol) {
    return res.status(400).json({
      error: 'Invalid trade payload',
      message: 'Symbol is required.'
    });
  }

  if (trade.quantity <= 0 || trade.total <= 0) {
    return res.status(400).json({
      error: 'Invalid quantity',
      message: 'Quantity and price must be positive.'
    });
  }

  res.status(201).json({
    success: true,
    message: 'Virtual order submitted successfully.',
    trade
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`TradeVerse AI is running at http://localhost:${PORT}`);
});
