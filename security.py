
import requests
import pywasm
import time
import json
import random
from datetime import datetime, date
import pathlib

class NepseTokenParser:
    """Handles the WASM-based token decryption logic"""
    
    def __init__(self):
        base_dir = pathlib.Path(__file__).parent
        wasm_candidates = [base_dir / "assets" / "css.wasm", base_dir / "css.wasm"]
        wasm_path = next((p for p in wasm_candidates if p.exists()), wasm_candidates[0])
        if not wasm_path.exists():
            raise FileNotFoundError(f"NEPSE WASM file not found. Checked: {wasm_candidates}")
        self.runtime = pywasm.core.Runtime()
        self.wasm_module = self.runtime.instance_from_file(str(wasm_path))
        
    def parse_token_response(self, response_data):
        """
        Reverse-engineered logic to descramble the token using WASM.
        """
        # 1. Extract salts from response
        try:
            salts = [
                int(response_data["salt1"]),
                int(response_data["salt2"]),
                int(response_data["salt3"]),
                int(response_data["salt4"]),
                int(response_data["salt5"]),
            ]
        except (KeyError, ValueError, TypeError) as e:
            raise ValueError(f"Invalid salt data in response: {e}")

        # 2. Calculate indices for Access Token using WASM functions
        # The WASM module exports functions like cdx, rdx, bdx...
        n = self.runtime.invocate(self.wasm_module, "cdx", salts)[0]
        l_index = self.runtime.invocate(self.wasm_module, "rdx", [salts[0], salts[1], salts[3], salts[2], salts[4]])[0]
        o = self.runtime.invocate(self.wasm_module, "bdx", [salts[0], salts[1], salts[3], salts[2], salts[4]])[0]
        p = self.runtime.invocate(self.wasm_module, "ndx", [salts[0], salts[1], salts[3], salts[2], salts[4]])[0]
        q = self.runtime.invocate(self.wasm_module, "mdx", [salts[0], salts[1], salts[3], salts[2], salts[4]])[0]
        
        # 3. Calculate indices for Refresh Token
        # Note the specific salt permutation used here
        salts_reversed = [salts[1], salts[0], salts[2], salts[4], salts[3]]
        a = self.runtime.invocate(self.wasm_module, "cdx", salts_reversed)[0]
        b = self.runtime.invocate(self.wasm_module, "rdx", [salts[1], salts[0], salts[2], salts[3], salts[4]])[0]
        c = self.runtime.invocate(self.wasm_module, "bdx", [salts[1], salts[0], salts[3], salts[2], salts[4]])[0]
        d = self.runtime.invocate(self.wasm_module, "ndx", [salts[1], salts[0], salts[3], salts[2], salts[4]])[0]
        e = self.runtime.invocate(self.wasm_module, "mdx", [salts[1], salts[0], salts[3], salts[2], salts[4]])[0]
        
        # 4. Extract raw tokens
        access_token = response_data["accessToken"]
        refresh_token = response_data["refreshToken"]
        
        # 5. Descramble Access Token
        parsed_access_token = (
            access_token[0:n]
            + access_token[n + 1 : l_index]
            + access_token[l_index + 1 : o]
            + access_token[o + 1 : p]
            + access_token[p + 1 : q]
            + access_token[q + 1 :]
        )
        
        # 6. Descramble Refresh Token
        parsed_refresh_token = (
            refresh_token[0:a]
            + refresh_token[a + 1 : b]
            + refresh_token[b + 1 : c]
            + refresh_token[c + 1 : d]
            + refresh_token[d + 1 : e]
            + refresh_token[e + 1 :]
        )
        
        return parsed_access_token, parsed_refresh_token, salts

class MyNepseSession:
    """Custom NEPSE Session Implementation"""
    
    BASE_URL = "https://www.nepalstock.com.np"
    
    def __init__(self):
        self.session = requests.Session()
        self.token_parser = NepseTokenParser()
        
        # State
        self.access_token = None
        self.refresh_token = None
        self.salts = None
        self.token_timestamp = 0
        
        # Configure session
        self.session.verify = False  # Ignore SSL errors
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
            "Content-Type": "application/json",
            "Referer": self.BASE_URL,
            "Origin": self.BASE_URL
        })
        
        # Authenticate immediately
        self.authenticate()

    def authenticate(self):
        """Fetch and process the scramble token"""
        url = f"{self.BASE_URL}/api/authenticate/prove"
        print(f"Authenticating with {url}...")
        
        # 1. Get the raw scrambled response
        response = self.session.get(url)
        response.raise_for_status()
        data = response.json()
        
        # 2. Use our parser to decrypt it
        self.access_token, self.refresh_token, self.salts = \
            self.token_parser.parse_token_response(data)
            
        self.token_timestamp = int(time.time())
        print("Authentication successful! Token descrambled.")

    def _get_auth_headers(self):
        """Construct the special headers required by NEPSE"""
        if not self.access_token:
            self.authenticate()
            
        return {
            "Authorization": f"Salter {self.access_token}",
            "Content-Type": "application/json",
            "User-Agent": self.session.headers["User-Agent"]
        }

    def _get_dummy_id(self):
        """
        Generates the magic 'id' required for POST requests.
        Reverse engineered logic:
        id = (dummy_id + salts[index] * day_of_month - salts[index-1])
        """
        # First we need a base ID from market status
        # In a full implementation we'd fetch market status first
        # For now, let's fetch market status without this ID logic
        # (Market status uses GET, so it might be simpler)
        
        # Wait, getting dummy data requires market status first
        status = self.get_market_status()
        base_id = status['id']
        
        # Standard dummy ID calculation logic
        today_day = date.today().day
        
        # Calculation for 'Scrips' (standard)
        # e = dummy_data[dummy_id] + dummy_id + 2 * date.today().day
        # But we need the 'dummy_data' array. 
        # The library ignores this complexity sometimes or uses a hardcoded array?
        # Let's inspect DUMMY_DATA.json in the library if we need it.
        
        # For simplicity, let's try to just use the token parsing for now
        # and see if GET requests work. Many endpoints are GET.
        return base_id

    def get_market_status(self):
        """Get market open/close status"""
        url = f"{self.BASE_URL}/api/nots/nepse-data/market-open"
        response = self.session.get(url, headers=self._get_auth_headers())
        return response.json()

    def get_market_summary(self):
        """Get market summary"""
        url = f"{self.BASE_URL}/api/nots/market-summary/"
        response = self.session.get(url, headers=self._get_auth_headers())
        return response.json()
        
    def get_top_gainers(self):
        """Get top gainers"""
        url = f"{self.BASE_URL}/api/nots/top-ten/top-gainer"
        response = self.session.get(url, headers=self._get_auth_headers())
        return response.json()

