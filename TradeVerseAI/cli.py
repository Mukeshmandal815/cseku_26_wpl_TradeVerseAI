#!/usr/bin/env python3
"""
NEPSE CLI Tool - Command-line interface for NEPSE data
"""

import argparse
import json
import sys
from nepse_data_api.market import Nepse
from datetime import datetime

def format_json(data):
    """Pretty print JSON"""
    return json.dumps(data, indent=2, ensure_ascii=False)

def display_market_status(nepse):
    """Display market status"""
    status = nepse.get_market_status()
    is_open = status.get('isOpen', 'Unknown')
    as_of = status.get('asOf', '')
    
    color = '\033[92m' if is_open == 'OPEN' else '\033[91m'
    print(f"{color}Market Status: {is_open}\033[0m")
    print(f"As of: {as_of}")

def display_top_performers(nepse, limit=5):
    """Display top gainers and losers"""
    gainers = nepse.get_top_gainers(limit=limit)
    losers = nepse.get_top_losers(limit=limit)
    
    print(f"\n\033[92mTop {limit} Gainers:\033[0m")
    print(f"{'Symbol':<12} {'LTP':<10} {'Change %':<10}")
    print("-" * 40)
    for stock in gainers:
        print(f"{stock['symbol']:<12} {stock['ltp']:<10} +{stock['percentageChange']}%")
    
    print(f"\n\033[91mTop {limit} Losers:\033[0m")
    print(f"{'Symbol':<12} {'LTP':<10} {'Change %':<10}")
    print("-" * 40)
    for stock in losers:
        print(f"{stock['symbol']:<12} {stock['ltp']:<10} {stock['percentageChange']}%")

def display_nepse_index(nepse):
    """Display NEPSE index"""
    indices = nepse.get_nepse_index()
    if isinstance(indices, list):
        nepse_index = next((item for item in indices if item.get('index') == 'NEPSE Index'), indices[0])
    else:
        nepse_index = indices
    
    print(f"\n\033[1mNEPSE Index: {nepse_index.get('currentValue')}\033[0m")
    change = nepse_index.get('change', 0)
    color = '\033[92m' if change > 0 else '\033[91m'
    print(f"Change: {color}{change} ({nepse_index.get('perChange', 0)}%)\033[0m")

def main():
    parser = argparse.ArgumentParser(
        description='NEPSE CLI - Access Nepal Stock Exchange data from command line',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  nepse-cli status              # Show market status
  nepse-cli gainers --limit 10  # Top 10 gainers
  nepse-cli index               # NEPSE index
  nepse-cli all                 # Show everything
        """
    )
    
    parser.add_argument('command', 
                       choices=['status', 'gainers', 'losers', 'index', 'summary', 'all'],
                       help='Command to execute')
    parser.add_argument('--limit', type=int, default=5,
                       help='Limit number of results (default: 5)')
    parser.add_argument('--json', action='store_true',
                       help='Output in JSON format')
    parser.add_argument('--no-cache', action='store_true',
                       help='Disable caching')
    
    args = parser.parse_args()
    
    try:
        # Initialize NEPSE interface
        nepse = Nepse(enable_cache=not args.no_cache)
        
        if args.json:
            # JSON output mode
            if args.command == 'status':
                print(format_json(nepse.get_market_status()))
            elif args.command == 'gainers':
                print(format_json(nepse.get_top_gainers(limit=args.limit)))
            elif args.command == 'losers':
                print(format_json(nepse.get_top_losers(limit=args.limit)))
            elif args.command == 'index':
                print(format_json(nepse.get_nepse_index()))
            elif args.command == 'summary':
                print(format_json(nepse.get_market_summary()))
            elif args.command == 'all':
                data = {
                    'status': nepse.get_market_status(),
                    'index': nepse.get_nepse_index(),
                    'gainers': nepse.get_top_gainers(limit=args.limit),
                    'losers': nepse.get_top_losers(limit=args.limit)
                }
                print(format_json(data))
        else:
            # Pretty output mode
            print(f"\n{'=' * 60}")
            print(f"  NEPSE Data - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'=' * 60}\n")
            
            if args.command in ['status', 'all']:
                display_market_status(nepse)
            
            if args.command in ['index', 'all']:
                display_nepse_index(nepse)
            
            if args.command in ['gainers', 'all']:
                display_top_performers(nepse, limit=args.limit)
            elif args.command == 'losers':
                print(f"\n\033[91mTop {args.limit} Losers:\033[0m")
                losers = nepse.get_top_losers(limit=args.limit)
                print(f"{'Symbol':<12} {'LTP':<10} {'Change %':<10}")
                print("-" * 40)
                for stock in losers:
                    print(f"{stock['symbol']:<12} {stock['ltp']:<10} {stock['percentageChange']}%")
            
            if args.command == 'summary':
                summary = nepse.get_market_summary()
                print("\nMarket Summary:")
                if isinstance(summary, list):
                    for item in summary:
                        print(f"  {item.get('detail', '')}: {item.get('value', '')}")
                else:
                    print(format_json(summary))
            
            print(f"\n{'=' * 60}\n")
        
    except KeyboardInterrupt:
        print("\nInterrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\033[91mError: {e}\033[0m", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
