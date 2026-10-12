# TradeVerse AI

TradeVerse AI is an educational market research and paper-trading app. It combines a browser-based dashboard, an Android shell built with Capacitor, and market data for NEPSE and selected global exchanges. It is for learning and demonstration; it does not place real trades or provide financial advice.

## Features

- Browse NEPSE, NYSE, NASDAQ, DSE, SSE, HKEX, NSE India, LSE, TSE, and ASX.
- View market snapshots, stock details, charts, gainers and losers, turnover, volume, and transaction rankings.
- Browse exchange-index and stock charts with candlesticks and volume bars; the current daily candle follows refreshed quotes while the exchange is open, holds its last observed quote after close, and is saved in browser storage for the next visit. Use the range slider below either chart to navigate older and newer dates. Simulated history is labeled. Drag to pan, scroll or use the zoom buttons, and move across candles to track OHLC and volume. Click a stock symbol to view details and open a paper-trade ticket.
- Add a user-selected amount of virtual cash to an exchange portfolio and place simulated buy/sell orders.
- Use Twelve Data for global quotes and daily candles when an API key is configured; supported global markets can fall back to Yahoo Finance. Simulated values are labeled.
- View NEPSE data through the Python adapter and Vercel function when deployed with its dependencies.
- Ask the AI Market Explainer about a stock by ticker or company name to get its latest quote, daily point and percentage move, volume, and recent OHLC trend. It uses the built-in explainer by default and the OpenAI Responses API when configured; simulated history is labeled and is never treated as a forecast.
- Enter the demo with an email label and track paper holdings, orders, and portfolio information in browser storage.
- Use the Android app, which loads the hosted web app at `https://trade-verse-ai.vercel.app`.

## Requirements

- Node.js 18 or later and npm.
- Python 3.9 or later with the packages in `requirements.txt` for local NEPSE data. Python is not needed to run the global-market demo.
- Android Studio and the Android SDK only if building the Android app from source.

## Run the web app locally

From the `TradeVerseAI` directory:

```sh
npm install
npm start
```

Open `http://localhost:3000`. For development with automatic server restart, run `npm run dev`.

The built-in Market Explainer works without an API key and gives educational answers from the selected market snapshot. Mention a ticker or company name (for example, `NABIL` or `Apple`) to include that stock's quote and recent chart history. To add OpenAI generated answers, set `OPENAI_API_KEY=...` in `.env` and restart the server. The key stays on the server. OpenAI API usage may incur charges according to your account.

To enable AI explanations, add your OpenAI API key to `.env` as `OPENAI_API_KEY=...`, then restart the server. The key is used only by the server and is never sent to the browser. Without it, the rest of the app works and the AI panel explains how to configure the feature. API usage may incur charges according to your OpenAI account.

To enable the local NEPSE Python adapter, install its dependencies and set `PYTHON_BIN` if the Python executable is not named `python` or `python3` on your PATH:

```sh
python -m pip install -r requirements.txt
```

Copy `.env.example` to `.env` to configure optional settings:

| Variable | Purpose | Default |
| --- | --- | --- |
| `TWELVE_DATA_API_KEY` | Server-side key for Twelve Data global quotes and daily candles. Keep it out of `public/` and source control. | unset |
| `TWELVE_DATA_SYMBOL_LIMIT` | Maximum symbols requested per Twelve Data exchange snapshot. | `8` |
| `YAHOO_SYMBOL_LIMIT` | Maximum symbols requested per Yahoo Finance exchange snapshot. | `8` |
| `OPENAI_API_KEY` | Optional server-side key for the AI Market Explainer. Never expose it in frontend code or commit a real key. | unset |
| `OPENAI_MODEL` | OpenAI model used for market explanations. | `gpt-4.1-mini` |
| `OPENAI_API_KEY` | Optional server-side key for the AI Market Explainer. Never expose it in frontend code or commit a real key. | unset |
| `OPENAI_MODEL` | OpenAI model used for market explanations. | `gpt-4.1-mini` |
| `PYTHON_BIN` | Python executable used by the local NEPSE adapter. | `python` or `python3` from PATH |

The app also reads `PORT` when set by a hosting environment.

## Android app

The Capacitor project is in `mobile-app/`. Its `capacitor.config.json` points to the hosted app at `https://trade-verse-ai.vercel.app`; the mobile app therefore needs a reachable backend and internet access for market data.

An APK is included at `mobile-app/TradeVerseAI.apk`. To regenerate a debug APK from source, install the mobile project dependencies and Android tooling, then run the following from `mobile-app/`:

```sh
npm install
npm run build:android
```

The Gradle build output is under `mobile-app/android/app/build/outputs/apk/debug/`.

## Deploy to Vercel

Set the Vercel project Root Directory to `TradeVerseAI`. `vercel.json` configures the Node app and the Python function at `/api/nepse`; `requirements.txt` supplies Python dependencies, and the NEPSE WASM asset is bundled with that function. Add `TWELVE_DATA_API_KEY` for Twelve Data coverage and `OPENAI_API_KEY` for the AI explainer in Vercel's environment settings. When Deployment Protection is enabled, set `VERCEL_AUTOMATION_BYPASS_SECRET` if the Node app needs to call the protected NEPSE function.

After deployment, check `/api/health` for app status and `/api/nepse?action=market` for the NEPSE function. The mobile build uses the configured hosted URL; update `mobile-app/capacitor.config.json` if deploying to a different domain before rebuilding.

## API routes

- `GET /api/health` — service status.
- `GET /api/dashboard?exchange=nepse` — dashboard data for an exchange.
- `GET /api/market?exchange=nepse` — market snapshot.
- `GET /api/stock/:symbol` and `GET /api/history/:symbol` — stock detail and history.
- `GET /api/history/nepse` — NEPSE history.
- `GET /api/nepse?action=market` — NEPSE Python function endpoint on Vercel.
- Portfolio, trade, and demo login routes are also available in the server; portfolio and order state in the current demo is maintained in the browser.

## Data and demo limitations

The global exchange lists are curated starter watchlists, not full listings. Yahoo Finance access is unofficial, can be delayed or unavailable, and may change; DSE has no Yahoo ticker mapping in this app. These are snapshot requests, not a streaming feed. Non-NEPSE index values and market-hours badges are indicative references. NEPSE data relies on an unofficial upstream adapter and upstream availability. The live NEPSE snapshot does not include exchange-wide order-book depth, so demand and supply figures are not estimated when unavailable. Confirm provider terms and permissions before public or commercial use.

Demo sign-in is not authentication: a valid-format email or username and any non-empty password are accepted. The password is discarded and is neither stored nor sent to the server. Profile labels, portfolios, and order history are browser-local and are not synced between browsers or devices. Do not use real account credentials or rely on this demo to protect sensitive information. PostgreSQL settings from earlier project versions are not used by the current demo workflow.

## Provider documentation

- [Twelve Data quote API](https://twelvedata.com/docs/market-data/quote)
- [Twelve Data time-series API](https://twelvedata.com/docs/market-data/time-series)
- [Twelve Data exchange reference](https://twelvedata.com/docs/markets/exchanges)
- [Vercel Python runtime](https://vercel.com/docs/functions/runtimes/python)
