"""
nepse_data_api - Advanced NEPSE Stock Market Data Library
======================================================

from nepse_data_api.market import Nepse, AsyncNepse
from nepse_data_api.security import NepseTokenParser, MyNepseSession

__all__ = ["Nepse", "AsyncNepse", "NepseTokenParser", "MyNepseSession"]

Quick Start:
    >>> from nepse_data_api import Nepse
    >>> nepse = Nepse()
    >>> stocks = nepse.get_stocks()

Features:
    - Live market data (OHLCV)
    - Sector indices
    - Corporate actions (Dividends, AGM)
    - News & alerts
    - Market depth & floorsheet
    - Built-in caching for performance
"""

from .market import Nepse, AsyncNepse
from .version import __version__

__author__ = "NEPSE Core Contributors"
__all__ = ["Nepse", "AsyncNepse"]
