# TradeVerse AI

An AI-assisted web and mobile platform for virtual NEPSE stock trading and market analysis.

TradeVerse AI lets a user trade Nepal Stock Exchange (NEPSE) listed companies with a simulated cash balance, track a full portfolio, and view AI-generated trend predictions and news sentiment — all clearly labelled as experimental and educational, never as financial advice. Real brokerage integration and real-money transactions are permanently out of scope for this project.

## Problem

Learners rarely have a safe way to practise stock trading. Real brokerages carry financial risk, and spreadsheets offer no live data, charting, or intelligence layer, leaving a gap between theoretical market knowledge and applied trading practice.

## Solution

TradeVerse AI combines a backend-authoritative trading engine with a bounded, advisory AI layer:

- A `MarketDataProvider` abstraction sources live NEPSE data or falls back to a mock provider if the live feed is unreachable.
- Every order is validated, priced, and executed entirely on the backend — client-submitted price or quantity values are never trusted.
- An XGBoost model and an LSTM model each produce a short-term trend prediction, evaluated with MAE, RMSE, MAPE, and directional accuracy.
- A FinBERT pipeline scores financial-news sentiment per stock.
- The AI service is advisory, not load-bearing: if it is unreachable, the platform shows "insufficient data" rather than blocking a trade.

## System Architecture

```text
Web app (Next.js) ── Mobile app (Flutter) ── Admin console (web)
                 |
        TradeVerse AI backend (NestJS + Node.js)
                 |
   ┌─────────────┴─────────────┐
   |                            |
Trading engine            AI service (FastAPI)
(validate → price →       (XGBoost / LSTM / FinBERT)
 execute → update)               |
   |                       Data layer
   └───────────┬────────── (PostgreSQL + Redis)
               |
   User dashboards / Admin dashboards
```

The system follows a modular, service-oriented architecture layered over a conventional client-server web application. Full detail, including the order-execution flow and the data model, is in `docs/SRS.md` Section 6.

### Client Layer
- Responsive web app (Next.js, PWA-capable) — primary, current build
- Mobile app (Flutter) — shares the same backend APIs as the web app
- Admin console (web, role-gated) — no separate app; access controlled by the ADMIN role

### Application / Service Layer
- Auth → Trading → Portfolio → Watchlist → Notification modules (NestJS, deterministic, backend-authoritative)
- Each AI-backed feature has a defined "insufficient data" fallback for availability without a reachable AI service
- The system depends on two external sources — the NEPSE market data feed and the AI service — both with documented fallback behavior if unreachable

### Data Layer
- Relational database: local PostgreSQL via Docker (development) → managed PostgreSQL + Prisma (production upgrade path)
- Redis for caching, session/rate limiting, and pub-sub delivery of live price ticks
- Historical price and audit data are retained; no real-money records exist anywhere in the system by design

### Market Data Layer
- Resolves every trade request to an authoritative current price before execution, never trusting a client-submitted price
- Implemented via the `MarketDataProvider` interface, with a live `NepseProvider` and a `MockMarketDataProvider` fallback
- Live NEPSE data source coverage and rate limits will be verified during implementation; the mock provider serves as fallback if the live feed proves unavailable or rate-limited during development

## Features

- Email/password registration with email verification and JWT session management
- NEPSE company list, search, sector filters, OHLC data, and interactive historical charts (1D–5Y)
- Virtual wallet with a fixed NPR 1,000,000 starting balance
- MARKET and LIMIT buy/sell orders, validated and executed entirely on the backend
- Holdings, realized/unrealized profit-loss, and a filterable transaction history
- Watchlists with configurable above/below price alerts and real-time notifications
- AI dashboard: trend prediction, prediction score, trend signal, and news sentiment per stock — always labelled experimental/educational
- Admin dashboard: user management, audit log viewer, AI model performance monitoring
- Public market summary (index, top gainers, top losers) viewable without an account

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui, ECharts, TanStack Query |
| Mobile | Flutter, Dart |
| Backend | NestJS, Node.js, TypeScript, Prisma |
| Database / Cache | PostgreSQL, Redis |
| AI service | Python, FastAPI, XGBoost, TensorFlow/Keras (LSTM), FinBERT |
| DevOps | Docker, Docker Compose, GitHub Actions, Nginx |

## Installation

Requirements:
- Node.js 20 or newer
- Python 3.11 or newer
- Docker Desktop
- PostgreSQL 15 or compatible (or use the provided Docker service)

```bash
pnpm install
cp .env.example .env
pnpm prisma:migrate
pnpm prisma:seed
```

Update `.env` with your local database URL, a long `JWT_SECRET`, and your chosen `MARKET_DATA_PROVIDER` (`mock` or `nepse`).

## Running Locally

```bash
docker compose up -d              # postgres, redis
pnpm dev                          # web + api
uvicorn app.main:app --reload     # ai-service
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api/v1`
- AI service: `http://localhost:8000`

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm prisma:migrate
pnpm prisma:seed
pytest services/ai-service
```

## Documentation

Start with `docs/SRS.md` (Software Requirements Specification). It covers the full requirement set (`REQ-UM`, `REQ-MD`, `REQ-TE`, `REQ-PF`, `REQ-AI`, `REQ-AL`, `REQ-AD`, `REQ-TP`), non-functional requirements, system architecture, and a glossary. Section-specific documents (`docs/DATABASE.md`, `docs/API.md`, `docs/AI_MODEL.md`, `docs/DEPLOYMENT.md`, `docs/TESTING.md`) are added as each area is implemented.

## Testing and AI Evaluation Notes

- Backend: unit and integration tests cover authentication, the trading engine, and portfolio calculations.
- AI service: every trained model is evaluated with MAE, RMSE, MAPE, and directional accuracy on a chronological hold-out set — never a shuffled split, to avoid leaking future data into training.
- Every AI-generated prediction or sentiment badge in the UI carries a visible "experimental / educational" disclaimer; this is enforced at the component level, not left to documentation alone.

## Known Open Items

This project documents its gaps rather than omitting mention of them. See `docs/SRS.md` Appendix C for the full list; current highlights:

- Live NEPSE data source/vendor has not been finalized — `MockMarketDataProvider` is the current default.
- Historical NEPSE price dataset for model training has not yet been collected.
- ER diagram field-level detail and the API contract are scheduled for Week 2.

## Contribution Workflow

- Branch naming: `feature/<topic>`, `fix/<topic>`, `docs/<topic>`
- Commits: concise conventional messages, e.g. `feat(api): add order endpoint`
- Every pull request links an issue and includes testing notes
- Never commit `.env`, database passwords, or API keys — `.env.example` documents required variables

## Project Status

Version 0.1 — Week 1 draft. Developed as a course project for **Web Programming & Mobile Applications Development**, CSE Discipline, Khulna University, by Mukesh Kumar Mandal (220242) and Nuzhat Liana (220205).

## License

Educational use — course project for Khulna University, CSE Discipline. License terms (open-source vs. restricted) not yet finalized; see Appendix C of the SRS.
