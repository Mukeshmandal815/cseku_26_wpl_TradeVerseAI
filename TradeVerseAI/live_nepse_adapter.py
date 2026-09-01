#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timedelta

PROJECT_ROOT = "D:/4th yr 2nd term/Web Programming & Mobile App Dev Project"
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from TradeVerseAI.market import Nepse


def normalize_stock(item):
    price = item.get('lastTradedPrice') or item.get('openPrice') or item.get('averageTradedPrice') or 0
    change = item.get('percentageChange') or 0
    return {
        'symbol': item.get('symbol', ''),
        'company': item.get('securityName') or item.get('symbol', ''),
        'sector': item.get('sector') or 'NEPSE',
        'price': float(price),
        'change': float(change),
        'volume': int(item.get('totalTradeQuantity') or item.get('lastTradedVolume') or 0),
        'high': float(item.get('highPrice') or price),
        'low': float(item.get('lowPrice') or price),
        'open': float(item.get('openPrice') or price),
        'close': float(item.get('previousClose') or price),
        'signal': 'Bullish' if float(change) >= 0 else 'Bearish',
        'confidence': max(45, min(95, int(abs(float(change)) * 30 + 50))),
        'securityId': item.get('securityId'),
        'lastUpdated': item.get('lastUpdatedDateTime')
    }


def fetch_dashboard_payload():
    nepse = Nepse(enable_cache=True)
    market_status = nepse.get_market_status()
    index_payload = nepse.get_nepse_index()
    stock_rows = nepse.get_stocks()
    top_gainers = nepse.get_top_gainers(limit=5)
    top_losers = nepse.get_top_losers(limit=5)

    nepse_index = {}
    if isinstance(index_payload, list) and index_payload:
        nepse_index = next((p for p in index_payload if p.get('index') == 'NEPSE Index'), index_payload[0])
    elif isinstance(index_payload, dict):
        nepse_index = index_payload

    # Return ALL stocks, not just 30
    normalized = [normalize_stock(item) for item in stock_rows]

    return {
        'greeting': 'Good morning, Trader',
        'virtualBuyingPower': 682400,
        'portfolioValue': 1249100,
        'availableCash': 682400,
        'nepseIndex': float(nepse_index.get('currentValue') or nepse_index.get('close') or 0),
        'indexChange': float(nepse_index.get('change') or 0),
        'marketOverview': normalized,
        'marketStatus': market_status,
        'topGainers': top_gainers,
        'topLosers': top_losers,
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
        'stocks': payload.get('marketOverview'),
        'topGainers': payload.get('topGainers'),
        'topLosers': payload.get('topLosers')
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

    if action == 'dashboard':
        result = fetch_dashboard_payload()
    elif action == 'stock':
        result = fetch_stock_detail(symbol)
    else:
        result = fetch_market_payload()

    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
