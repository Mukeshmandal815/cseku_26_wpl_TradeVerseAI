import json
import logging
import re
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from live_nepse_adapter import fetch_market_payload, fetch_stock_detail


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        action = query.get("action", ["market"])[0]
        symbol = query.get("symbol", [""])[0].strip().upper()

        if action not in ("market", "stock"):
            self._send_json(400, {"error": "Unsupported NEPSE action."})
            return
        if action == "stock" and not re.fullmatch(r"[A-Z0-9.-]{1,20}", symbol):
            self._send_json(400, {"error": "Invalid stock symbol."})
            return

        try:
            payload = fetch_market_payload() if action == "market" else fetch_stock_detail(symbol)
            self._send_json(200, payload)
        except Exception:
            logging.exception("NEPSE Python function failed")
            self._send_json(502, {"error": "NEPSE upstream data is unavailable."})

    def do_POST(self):
        self._send_json(405, {"error": "Method not allowed."})

    def _send_json(self, status, payload):
        body = json.dumps(payload, separators=(",", ":"), allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
