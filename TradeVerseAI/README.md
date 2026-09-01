# TradeVerse AI

TradeVerse AI is an educational NEPSE paper-trading web app built to demonstrate a stock market learning platform with simulated data, AI insights, and basic portfolio functionality.

## Features
- Dashboard with market overview and portfolio metrics
- Markets view for asset browsing and quick trades
- Portfolio tracking with holdings and unrealized P/L
- AI insight cards with explanation and educational disclaimer
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

## Educational Use Note
This project uses simulated NEPSE data and is intended for learning and demonstration only. It is not financial advice.
