#!/usr/bin/env python3
import json
import sys
import contextlib
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from market import Nepse


def normalize_stock(item):
    price = float(item.get('lastTradedPrice') or item.get('ltp') or item.get('closingPrice') or item.get('closePrice') or item.get('close') or item.get('openPrice') or item.get('averageTradedPrice') or 0)
    previous_close = float(item.get('previousClose') or item.get('cp') or item.get('close') or price)
    change = item.get('percentageChange') or 0
    return {
        'symbol': item.get('symbol', ''),
        'company': item.get('securityName') or item.get('symbol', ''),
        'sector': item.get('sector') or 'NEPSE',
        'price': price,
        'change': float(change),
        'pointChange': float(item.get('pointChange') if item.get('pointChange') is not None else price - previous_close),
        'volume': int(item.get('totalTradeQuantity') or item.get('shareTraded') or item.get('lastTradedVolume') or 0),
        'turnover': float(item.get('totalTradeValue') or item.get('turnover') or 0),
        'transactions': int(item.get('totalTrades') or item.get('totalTransaction') or item.get('transactions') or 0),
        'buyQuantity': item.get('topBuyQuantity') or item.get('totalBuyQuantity') or item.get('buyQuantity'),
        'buyOrders': item.get('buyOrders') or item.get('totalBuyOrders') or item.get('buyOrderCount'),
        'sellQuantity': item.get('topSellQuantity') or item.get('totalSellQuantity') or item.get('sellQuantity'),
        'sellOrders': item.get('sellOrders') or item.get('totalSellOrders') or item.get('sellOrderCount'),
        'high': float(item.get('highPrice') or item.get('high') or price),
        'low': float(item.get('lowPrice') or item.get('low') or price),
        'open': float(item.get('openPrice') or price),
        'close': previous_close,
        'securityId': item.get('securityId'),
        'lastUpdated': item.get('lastUpdatedDateTime')
    }


def fetch_dashboard_payload():
    nepse = Nepse(enable_cache=True)
    market_status = nepse.get_market_status()
    index_payload = nepse.get_nepse_index()
    stock_rows = nepse.get_stocks()
    if not stock_rows:
        stock_rows = nepse.get_price_volume()
    market_summary = nepse.get_market_summary()
    transaction_rows = nepse.get_top_transaction()

    nepse_index = {}
    if isinstance(index_payload, list) and index_payload:
        nepse_index = next((p for p in index_payload if p.get('index') == 'NEPSE Index'), index_payload[0])
    elif isinstance(index_payload, dict):
        nepse_index = index_payload

    normalized = [normalize_stock(item) for item in stock_rows if item.get('symbol')]
    advances = sum(stock['change'] > 0 for stock in normalized)
    declines = sum(stock['change'] < 0 for stock in normalized)
    unchanged = sum(stock['change'] == 0 for stock in normalized)

    def summary_value(detail):
        row = next((item for item in market_summary if item.get('detail') == detail), None)
        return float(row.get('value') or 0) if row else 0

    top_gainers = sorted(normalized, key=lambda stock: stock['change'], reverse=True)[:10]
    top_losers = sorted(normalized, key=lambda stock: stock['change'])[:10]
    top_transactions = [normalize_stock(item) for item in transaction_rows if item.get('symbol')]
    latest_index = float(nepse_index.get('currentValue') or nepse_index.get('close') or 0)
    index_change = float(nepse_index.get('change') or 0)
    market_is_open = str(market_status.get('isOpen', '')).upper() in ('OPEN', 'TRUE')
    market_data_as_of = nepse_index.get('generatedTime') if market_is_open else market_status.get('asOf')

    return {
        'greeting': 'Good morning, Trader',
        'virtualBuyingPower': 682400,
        'portfolioValue': 1249100,
        'availableCash': 682400,
        'nepseIndex': latest_index,
        'indexChange': index_change,
        'indexChangePercent': float(nepse_index.get('perChange') or 0),
        'indexHigh': float(nepse_index.get('high') or 0),
        'indexLow': float(nepse_index.get('low') or 0),
        'previousClose': float(nepse_index.get('previousClose') or 0),
        'marketDataState': 'LIVE' if market_is_open else 'PREVIOUS CLOSE',
        'updatedAt': market_data_as_of or nepse_index.get('generatedTime'),
        'marketStats': {
            'turnover': summary_value('Total Turnover Rs:'),
            'sharesTraded': int(summary_value('Total Traded Shares')),
            'transactions': int(summary_value('Total Transactions')),
            'scripsTraded': int(summary_value('Total Scrips Traded')),
            'marketCapitalization': summary_value('Total Market Capitalization Rs:'),
            'advances': advances if normalized else None,
            'declines': declines if normalized else None,
            'unchanged': unchanged if normalized else None
        },
        'marketOverview': normalized,
        'marketStatus': market_status,
        'topGainers': top_gainers,
        'topLosers': top_losers,
        'topTransactions': top_transactions,
        'aiInsight': {
            'title': 'Live NEPSE Momentum',
            'summary': 'Market sentiment is updated from the latest NEPSE live feed and top-performing sectors.',
            'confidence': 82,
            'disclaimer': 'Experimental AI signal for educational purposes only. Not financial advice.'
        }
    }


def fetch_market_payload():
    payload = fetch_dashboard_payload()
    return {
        'source': 'nepse-live',
        'marketStatus': payload.get('marketStatus'),
        'nepseIndex': payload.get('nepseIndex'),
        'indexChange': payload.get('indexChange'),
        'indexChangePercent': payload.get('indexChangePercent'),
        'indexHigh': payload.get('indexHigh'),
        'indexLow': payload.get('indexLow'),
        'previousClose': payload.get('previousClose'),
        'marketDataState': payload.get('marketDataState'),
        'updatedAt': payload.get('updatedAt'),
        'marketStats': payload.get('marketStats'),
        'stocks': payload.get('marketOverview'),
        'topGainers': payload.get('topGainers'),
        'topLosers': payload.get('topLosers'),
        'topTransactions': payload.get('topTransactions')
    }


def fetch_stock_detail(symbol):
    symbol = (symbol or '').upper()
    nepse = Nepse(enable_cache=True)
    market_rows = nepse.get_stocks()
    security_rows = nepse.get_security_list()

    match = None
    for item in market_rows:
        if str(item.get('symbol', '')).upper() == symbol:
            match = item
            break

    if not match:
        for item in security_rows:
            if str(item.get('symbol', '')).upper() == symbol:
                match = {'symbol': item.get('symbol'), 'securityName': item.get('securityName'), 'securityId': item.get('id')}
                break

    if not match:
        return {'symbol': symbol, 'error': 'Stock not found'}

    security_id = match.get('securityId')
    if not security_id:
        for sec in security_rows:
            if str(sec.get('symbol','')).upper() == symbol:
                security_id = sec.get('id')
                break

    history = []
    if security_id:
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')
        raw_chart = nepse.get_historical_chart(int(security_id), start_date, end_date)
        if isinstance(raw_chart, list):
            history = []
            for point in raw_chart:
                if 't' in point:
                    try:
                        d = datetime.fromtimestamp(int(point.get('t')) / 1000)
                        history.append({
                            'date': d.strftime('%Y-%m-%d'),
                            'close': float(point.get('c') or point.get('close') or 0),
                            'open': float(point.get('o') or point.get('open') or 0),
                            'high': float(point.get('h') or point.get('high') or 0),
                            'low': float(point.get('l') or point.get('low') or 0),
                            'volume': int(point.get('v') or point.get('volume') or 0)
                        })
                    except Exception:
                        continue

    normalized = normalize_stock(match)
    return {
        'symbol': symbol,
        'company': normalized.get('company') or match.get('securityName') or symbol,
        'securityId': security_id,
        'price': normalized.get('price'),
        'change': normalized.get('change'),
        'volume': normalized.get('volume'),
        'high': normalized.get('high'),
        'low': normalized.get('low'),
        'open': normalized.get('open'),
        'close': normalized.get('close'),
        'history': history[:60],
        'marketStatus': nepse.get_market_status()
    }


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else 'market'
    symbol = sys.argv[2] if len(sys.argv) > 2 else None

    with contextlib.redirect_stdout(sys.stderr):
        if action == 'dashboard':
            result = fetch_dashboard_payload()
        elif action == 'stock':
            result = fetch_stock_detail(symbol)
        else:
            result = fetch_market_payload()

    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
