# TradeVerse AI

TradeVerse AI is an educational NEPSE paper-trading web app built to demonstrate a stock market learning platform with simulated data, AI insights, and basic portfolio functionality.

## Features
- Dashboard with market overview and portfolio metrics
- Markets view for asset browsing and quick trades
- Portfolio tracking with holdings and unrealized P/L
- AI insight cards with explanation and educational disclaimer
- Sprint 2 backlog CRUD forms with velocity monitoring and AI backlog suggestions
- Weekly AI-generated sprint retrospective reports
- Mock NEPSE data provider with fallback support for real API integration
- REST API for dashboard, market, portfolio, and trade endpoints

## Tech Stack
- Node.js + Express
- Vanilla JS frontend served from the public folder
- Tailwind CSS for UI styling
- Environment-based configuration

## Setup
1. Open a terminal in this project folder.
2. Run:
   ```bash
   npm install
   ```
3. Copy the sample environment file:
   ```bash
   copy .env.example .env
   ```
   Add your Twelve Data key to `TWELVE_DATA_API_KEY` in `.env` to enable live quotes for the non-NEPSE exchanges. Keep this key server-side and never put it in `public/index.html`.
4. Start the app:
   ```bash
   npm start
   ```
5. Open:
   ```text
   http://localhost:3000
   ```

## API Endpoints
- GET /api/health
- GET /api/dashboard
- GET /api/market
- GET /api/portfolio
- POST /api/trade
- GET /api/sprint
- POST /api/sprint/items
- PUT /api/sprint/items/:id
- DELETE /api/sprint/items/:id
- POST /api/sprint/retrospective

Pass an exchange id to load its market data, for example:

```text
GET /api/market?exchange=nyse
GET /api/dashboard?exchange=sse
```

When `TWELVE_DATA_API_KEY` is configured, supported non-NEPSE exchanges use Twelve Data quotes. If the key is missing, the provider rejects a request, or a rate limit is reached, the app falls back to clearly labeled simulated data.

Sprint backlog data is held in memory for this educational demo and resets when the server restarts.

## Educational Use Note
This project uses simulated NEPSE data and is intended for learning and demonstration only. It is not financial advice.
