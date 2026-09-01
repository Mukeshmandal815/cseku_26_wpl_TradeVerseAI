const { stocks, buildDashboardData } = require('../data/mockData');
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

async function fetchMarketSnapshot() {
  try {
    const live = await fetchPythonMarketPayload();
    if (live && Array.isArray(live.stocks) && live.stocks.length > 0) {
      return {
        source: 'nepse-live',
        stocks: live.stocks,
        dashboard: {
          ...buildDashboardData(),
          ...live,
          marketOverview: live.stocks.slice(0, 10),  // Show top 10 in dashboard summary
          allStocks: live.stocks,                     // Keep all for markets view
          nepseIndex: live.nepseIndex,
          indexChange: live.indexChange,
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
    dashboard: buildDashboardData()
  };
}

module.exports = {
  fetchMarketSnapshot
};
