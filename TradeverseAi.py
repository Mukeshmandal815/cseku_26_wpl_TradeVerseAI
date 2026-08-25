"""
TradeverseAi.py
================
TradeVerse AI — Branch 0.1 proof-of-concept prototype.

Purpose
-------
This standalone script demonstrates the CORE trading-engine logic described in
Section 6.2 (Application / Service Layer) and Section 3.3 (REQ-TE-*) of the
SRS, ahead of the full NestJS/TypeScript implementation. It exists so the
team can validate the trading rules in isolation before committing to the
service architecture.

It intentionally has NO web framework, NO database, and NO AI service —
those are out of scope for this prototype and are covered separately in
Branch 0.2 (API contract, ER diagram) and beyond.

What this prototype proves:
  1. A user starts with a fixed virtual balance (REQ-TE-01).
  2. An order is validated (funds, quantity, stock existence) entirely in
     backend-style logic before it is allowed to execute (REQ-TE-03).
  3. Execution always uses the authoritative price from the
     MarketDataProvider, never a client-supplied price (REQ-TE-04).
  4. Holdings and cash balance update correctly after a fill (REQ-PF-01).
  5. Every AI-backed feature has a defined fallback (REQ-AI-05) — modelled
     here as `MockMarketDataProvider`, the mock counterpart of the future
     live NepseProvider.

Run:
    python3 TradeverseAi.py
"""

from __future__ import annotations
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
from typing import Optional
import uuid


# ---------------------------------------------------------------------------
# Market data layer (Section 6.4 of the SRS)
# ---------------------------------------------------------------------------

class MarketDataProvider:
    """Abstract interface. A live NepseProvider would implement this same
    contract; only the data source changes, never the trading logic."""

    def get_price(self, symbol: str) -> Decimal:
        raise NotImplementedError


class MockMarketDataProvider(MarketDataProvider):
    """Fallback provider used when a live NEPSE feed is unavailable
    (REQ-MD-06). Prices below are illustrative, not real market data."""

    _PRICES = {
        "NABIL": Decimal("1180.00"),
        "NLIC": Decimal("950.50"),
        "NTC": Decimal("880.00"),
        "HIDCL": Decimal("310.25"),
    }

    def get_price(self, symbol: str) -> Decimal:
        if symbol not in self._PRICES:
            raise ValueError(f"Unknown symbol: {symbol}")
        return self._PRICES[symbol]


# ---------------------------------------------------------------------------
# Domain model
# ---------------------------------------------------------------------------

class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    REJECTED = "REJECTED"


@dataclass
class Holding:
    symbol: str
    quantity: int = 0
    avg_price: Decimal = Decimal("0")


@dataclass
class User:
    name: str
    cash_balance: Decimal = Decimal("1000000.00")  # REQ-TE-01: fixed virtual starting balance
    holdings: dict[str, Holding] = field(default_factory=dict)

    def portfolio_value(self, provider: MarketDataProvider) -> Decimal:
        total = self.cash_balance
        for h in self.holdings.values():
            total += provider.get_price(h.symbol) * h.quantity
        return total


@dataclass
class Order:
    user: User
    symbol: str
    side: OrderSide
    quantity: int
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    status: OrderStatus = OrderStatus.PENDING
    fill_price: Optional[Decimal] = None


# ---------------------------------------------------------------------------
# Trading engine (Section 6.2 / REQ-TE-02 through REQ-TE-06)
# ---------------------------------------------------------------------------

class OrderRejected(Exception):
    """Raised when server-side validation fails. Mirrors the API returning
    a 4xx error rather than silently ignoring a bad order."""


class TradingEngine:
    """Backend-authoritative trading engine. Every check here corresponds
    to a requirement in the SRS — nothing is trusted from the caller except
    the symbol, side, and requested quantity."""

    def __init__(self, market_data: MarketDataProvider):
        self.market_data = market_data

    def place_order(self, user: User, symbol: str, side: OrderSide, quantity: int) -> Order:
        order = Order(user=user, symbol=symbol, side=side, quantity=quantity)

        # REQ-TE-03: validate funds, quantity, and stock validity server-side
        if quantity <= 0:
            return self._reject(order, "Quantity must be positive")

        try:
            price = self.market_data.get_price(symbol)  # REQ-TE-04: authoritative price only
        except ValueError as exc:
            return self._reject(order, str(exc))

        if side is OrderSide.BUY:
            cost = price * quantity
            if cost > user.cash_balance:
                return self._reject(order, "Insufficient funds")
        else:  # SELL
            holding = user.holdings.get(symbol)
            if holding is None or holding.quantity < quantity:
                return self._reject(order, "Insufficient holdings to sell")

        return self._execute(order, price)

    def _execute(self, order: Order, price: Decimal) -> Order:
        user = order.user
        holding = user.holdings.setdefault(order.symbol, Holding(symbol=order.symbol))

        if order.side is OrderSide.BUY:
            total_cost = price * order.quantity
            new_qty = holding.quantity + order.quantity
            # weighted-average cost basis (REQ-PF-01)
            holding.avg_price = (
                (holding.avg_price * holding.quantity) + total_cost
            ) / new_qty
            holding.quantity = new_qty
            user.cash_balance -= total_cost
        else:  # SELL
            holding.quantity -= order.quantity
            user.cash_balance += price * order.quantity
            if holding.quantity == 0:
                holding.avg_price = Decimal("0")

        order.status = OrderStatus.FILLED
        order.fill_price = price
        return order

    @staticmethod
    def _reject(order: Order, reason: str) -> Order:
        order.status = OrderStatus.REJECTED
        print(f"  [REJECTED] Order {order.id} ({order.side.value} {order.quantity} {order.symbol}): {reason}")
        return order


# ---------------------------------------------------------------------------
# Demo run
# ---------------------------------------------------------------------------

def main() -> None:
    provider = MockMarketDataProvider()
    engine = TradingEngine(provider)
    user = User(name="Demo Trader")

    print(f"Starting balance: NPR {user.cash_balance:,.2f}\n")

    print("Placing BUY 10 NABIL...")
    o1 = engine.place_order(user, "NABIL", OrderSide.BUY, 10)
    print(f"  -> {o1.status.value} at NPR {o1.fill_price}\n")

    print("Placing BUY 5 NLIC...")
    o2 = engine.place_order(user, "NLIC", OrderSide.BUY, 5)
    print(f"  -> {o2.status.value} at NPR {o2.fill_price}\n")

    print("Placing SELL 3 NABIL...")
    o3 = engine.place_order(user, "NABIL", OrderSide.SELL, 3)
    print(f"  -> {o3.status.value} at NPR {o3.fill_price}\n")

    print("Attempting to oversell 100 NLIC (should be rejected)...")
    engine.place_order(user, "NLIC", OrderSide.SELL, 100)
    print()

    print("Attempting to buy an unknown symbol 'FAKE' (should be rejected)...")
    engine.place_order(user, "FAKE", OrderSide.BUY, 1)
    print()

    print("Final holdings:")
    for h in user.holdings.values():
        if h.quantity > 0:
            print(f"  {h.symbol}: {h.quantity} @ avg NPR {h.avg_price:.2f}")

    print(f"\nCash balance:     NPR {user.cash_balance:,.2f}")
    print(f"Portfolio value:  NPR {user.portfolio_value(provider):,.2f}")


if __name__ == "__main__":
    main()
