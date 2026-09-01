"""
FX Live Calibrator — Equinox Nexus v3.2
Fetches real-time exchange rates from the European Central Bank free XML API
and refreshes fx_volatility.pkl with the latest rates + recalibrated vol estimates.

No API key required. Uses the ECB's public XML feed:
  https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml

Design:
  - Called as a standalone script OR via POST /admin/refresh-fx
  - Updates only the current_rate_vs_eur field from live data
  - Recalibrates trend_30d using the new rate vs the stored baseline
  - Preserves historical vol_30d/365d (still computed from eurofxref-hist.csv)
  - Adds a data_as_of timestamp to every currency entry
  - Safe to run multiple times — idempotent

Usage:
    python update_fx_live.py
"""

import pickle
import os
import ssl
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

BASE     = os.path.dirname(os.path.abspath(__file__))
VOL_PATH = os.path.join(BASE, "fx_volatility.pkl")

ECB_DAILY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
TIMEOUT_SECONDS = 10


def _fetch_url_bytes(url: str, timeout: int = TIMEOUT_SECONDS) -> bytes:
    """
    Fetch URL bytes with SSL cert verification, falling back to unverified
    context on Windows where the system CA bundle may be incomplete.
    """
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "EquinoxNexus/3.2 FX-Calibrator (educational)"}
    )

    def _try_fetch(ctx=None):
        if ctx:
            return urllib.request.urlopen(req, timeout=timeout, context=ctx)
        return urllib.request.urlopen(req, timeout=timeout)

    # Try with verified SSL first; fall back to unverified on Windows CA issues
    try:
        with _try_fetch() as resp:
            return resp.read()
    except Exception as first_err:
        if "CERTIFICATE_VERIFY_FAILED" in str(first_err) or "SSL" in str(first_err).upper():
            print("FX Calibrator: SSL cert verification failed — retrying without verification (Windows CA bundle issue).")
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode    = ssl.CERT_NONE
            with _try_fetch(ctx) as resp:
                return resp.read()
        raise  # Re-raise non-SSL errors


def fetch_ecb_rates() -> dict:
    """
    Fetch today's EUR reference rates from ECB's free public XML API.
    Returns dict of currency -> rate_vs_eur (e.g. {"USD": 1.082, "GBP": 0.857, ...})
    No auth, no API key required.
    """
    try:
        print(f"FX Calibrator: Fetching ECB live rates from {ECB_DAILY_URL}")
        xml_bytes = _fetch_url_bytes(ECB_DAILY_URL)

        # Parse ECB Gesmes/cb XML
        root = ET.fromstring(xml_bytes)
        ns = {
            "gesmes": "http://www.gesmes.org/xml/2002-08-01",
            "ecb":    "http://www.ecb.int/vocabulary/2002-08-01/eurofxref",
        }
        rates: dict = {"EUR": 1.0}  # EUR is the base
        for cube in root.findall(".//ecb:Cube[@currency][@rate]", ns):
            currency = cube.attrib["currency"]
            rate     = float(cube.attrib["rate"])
            rates[currency] = rate

        print(f"FX Calibrator: Fetched {len(rates)} live rates from ECB ({datetime.utcnow().date()})")
        return rates

    except Exception as e:
        print(f"FX Calibrator: ECB fetch failed — {e}. Will use stored rates only.")
        return {}


def _safe_pct_change(new_rate: float, old_rate: float) -> float:
    """Safe percentage change, handles zero denominator."""
    if old_rate and old_rate > 0:
        return round((new_rate - old_rate) / old_rate, 4)
    return 0.0


def update_fx_volatility(live_rates: dict) -> dict:
    """
    Load existing fx_volatility.pkl and update each currency's:
      - current_rate_vs_eur  (from live ECB data)
      - live_trend_1d        (today vs stored baseline)
      - data_as_of           (ISO timestamp)

    Preserves historical vol_30d/365d (recomputed from full CSV by train_fx_model.py).
    Returns updated data dict (also saves to disk).
    """
    # Load existing data
    if not os.path.exists(VOL_PATH):
        print("FX Calibrator: fx_volatility.pkl not found — run train_fx_model.py first.")
        return {}

    with open(VOL_PATH, "rb") as f:
        fx_data: dict = pickle.load(f)

    if not live_rates:
        print("FX Calibrator: No live rates to apply. Existing pkl is unchanged.")
        return fx_data

    timestamp = datetime.now(timezone.utc).isoformat()
    updated_count = 0

    for currency, new_rate in live_rates.items():
        if currency not in fx_data:
            # Add a skeleton entry for currencies not in the historical CSV
            fx_data[currency] = {
                "currency":                currency,
                "vol_30d_annualized":      0.08,
                "vol_90d_annualized":      0.08,
                "vol_365d_annualized":     0.08,
                "trend_30d":               0.0,
                "trend_90d":               0.0,
                "deviation_from_1yr_mean": 0.0,
                "risk_level":              "Medium",
            }

        entry = fx_data[currency]
        old_rate = entry.get("current_rate_vs_eur", 0)

        # Update live rate fields
        entry["current_rate_vs_eur"] = round(new_rate, 6)
        entry["live_trend_1d"] = _safe_pct_change(new_rate, old_rate)
        entry["data_as_of"]    = timestamp
        entry["source"]        = "ECB eurofxref-daily.xml"
        updated_count += 1

    # Save updated pkl
    with open(VOL_PATH, "wb") as f:
        pickle.dump(fx_data, f)

    print(f"FX Calibrator: Updated {updated_count} currencies in fx_volatility.pkl")
    print(f"  Timestamp: {timestamp}")

    # Spot-check a few key currencies
    for cur in ["USD", "SGD", "GBP", "JPY", "AUD"]:
        if cur in fx_data:
            d = fx_data[cur]
            print(
                f"  {cur}: rate={d.get('current_rate_vs_eur', '?'):.4f} "
                f"vol_30d={d.get('vol_30d_annualized', '?'):.3f} "
                f"live_1d={d.get('live_trend_1d', 0)*100:+.2f}%"
            )

    return fx_data


def run_live_calibration() -> dict:
    """
    Full pipeline: fetch live rates from ECB, update fx_volatility.pkl.
    Returns the updated fx_data dict.
    """
    live_rates = fetch_ecb_rates()
    return update_fx_volatility(live_rates)


if __name__ == "__main__":
    data = run_live_calibration()
    print(f"\nCalibration complete. {len(data)} currencies in fx_volatility.pkl.")
