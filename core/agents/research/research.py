"""
Research Agent — Equinox Nexus v3.1

Autonomous agent that keeps the compliance RAG knowledge base fresh.
Fetches structured data from free, keyless public APIs:
  - OECD.Stat API  (tax rates, social contributions, economic indicators)
  - World Bank API (inflation CPI, GDP growth, exchange rates)
  - IMF Data API   (fiscal monitor, regional economic outlook)

Architecture:
    ResearchAgent.run()
        ↓ fetch_oecd_tax_rates()     → OECD.Stat API
        ↓ fetch_world_bank_macro()   → World Bank Indicators API
        ↓ fetch_imf_indicators()     → IMF Data API
        ↓ build_country_brief()      → structured Markdown per country
        ↓ inject_into_rag()          → ChromaDB upsert (auto-rebuild index)

All data sources are:
  - Free (no API key required)
  - Structured JSON (not web scraping)
  - Rate-limit safe (respectful polling with sleep)

The agent runs automatically when:
  1. Called via POST /research/refresh (manual trigger)
  2. Triggered by ContinuousMonitor when high FX drift is detected
  3. Run at startup if KB is older than 7 days
"""

import os
import sys
import json
import time
import requests
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
KB_DIR       = Path(__file__).parent.parent.parent / "rag" / "compliance_kb"
CACHE_DIR    = Path(__file__).parent / "research_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
LAST_RUN_FILE = CACHE_DIR / "last_research_run.json"

# ── OECD API config ───────────────────────────────────────────────────────────
# OECD.Stat JSON API — free, no key required
# Docs: https://data.oecd.org/api/sdmx-json-documentation/
OECD_BASE = "https://stats.oecd.org/SDMX-JSON/data"

# World Bank Indicators API — free, no key required
# Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
WB_BASE = "https://api.worldbank.org/v2"

# IMF Data API — free, no key required
# Docs: https://datahelp.imf.org/knowledgebase/articles/630877
IMF_BASE = "https://www.imf.org/external/datamapper/api/v1"

# ── Country mapping: our cities → ISO codes for API calls ─────────────────────
COUNTRY_CONFIG = {
    "GBR": {
        "name": "United Kingdom",
        "kb_file": "uk_compliance.md",
        "wb_iso2": "GB",
        "cities": ["London"],
        "currency": "GBP",
    },
    "DEU": {
        "name": "Germany",
        "kb_file": "germany_compliance.md",
        "wb_iso2": "DE",
        "cities": ["Berlin", "Frankfurt", "Munich"],
        "currency": "EUR",
    },
    "SGP": {
        "name": "Singapore",
        "kb_file": "singapore_compliance.md",
        "wb_iso2": "SG",
        "cities": ["Singapore"],
        "currency": "SGD",
    },
    "ARE": {
        "name": "United Arab Emirates",
        "kb_file": "uae_compliance.md",
        "wb_iso2": "AE",
        "cities": ["Dubai", "Abu Dhabi"],
        "currency": "AED",
    },
    "USA": {
        "name": "United States",
        "kb_file": "usa_compliance.md",
        "wb_iso2": "US",
        "cities": ["New York", "San Francisco", "Austin", "Miami"],
        "currency": "USD",
    },
    "JPN": {
        "name": "Japan",
        "kb_file": "japan_compliance.md",
        "wb_iso2": "JP",
        "cities": ["Tokyo", "Osaka"],
        "currency": "JPY",
    },
    "AUS": {
        "name": "Australia",
        "kb_file": "australia_compliance.md",
        "wb_iso2": "AU",
        "cities": ["Sydney", "Melbourne"],
        "currency": "AUD",
    },
    "IND": {
        "name": "India",
        "kb_file": "india_compliance.md",
        "wb_iso2": "IN",
        "cities": ["Mumbai", "Bangalore", "Delhi"],
        "currency": "INR",
    },
    "NLD": {
        "name": "Netherlands",
        "kb_file": "netherlands_compliance.md",
        "wb_iso2": "NL",
        "cities": ["Amsterdam"],
        "currency": "EUR",
    },
    "CAN": {
        "name": "Canada",
        "kb_file": "canada_compliance.md",
        "wb_iso2": "CA",
        "cities": ["Toronto", "Vancouver"],
        "currency": "CAD",
    },
    "PRT": {
        "name": "Portugal",
        "kb_file": "portugal_compliance.md",
        "wb_iso2": "PT",
        "cities": ["Lisbon", "Porto"],
        "currency": "EUR",
    },
    "FRA": {
        "name": "France",
        "kb_file": "france_compliance.md",
        "wb_iso2": "FR",
        "cities": ["Paris"],
        "currency": "EUR",
    },
    "CHE": {
        "name": "Switzerland",
        "kb_file": "switzerland_compliance.md",
        "wb_iso2": "CH",
        "cities": ["Zurich", "Geneva"],
        "currency": "CHF",
    },
    "SWE": {
        "name": "Sweden",
        "kb_file": "sweden_compliance.md",
        "wb_iso2": "SE",
        "cities": ["Stockholm"],
        "currency": "SEK",
    },
    "KOR": {
        "name": "South Korea",
        "kb_file": "south_korea_compliance.md",
        "wb_iso2": "KR",
        "cities": ["Seoul"],
        "currency": "KRW",
    },
    "THA": {
        "name": "Thailand",
        "kb_file": "thailand_compliance.md",
        "wb_iso2": "TH",
        "cities": ["Bangkok"],
        "currency": "THB",
    },
}

# ── Minimum refresh interval ──────────────────────────────────────────────────
MIN_REFRESH_DAYS = 7  # Don't re-fetch if KB updated within 7 days


def _safe_get(url: str, params: dict = None, timeout: int = 10) -> Optional[dict]:
    """Resilient HTTP GET with retry logic and rate-limit awareness."""
    for attempt in range(3):
        try:
            resp = requests.get(url, params=params, timeout=timeout)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:
                # Rate limited — back off
                wait = 10 * (attempt + 1)
                print(f"Research: Rate limited. Waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"Research: HTTP {resp.status_code} for {url}")
                return None
        except requests.exceptions.Timeout:
            print(f"Research: Timeout on attempt {attempt + 1} for {url}")
            time.sleep(2)
        except Exception as e:
            print(f"Research: Error fetching {url}: {e}")
            return None
    return None


class ResearchAgent:
    """
    Autonomous Research Agent for Equinox Nexus.
    Fetches macroeconomic intelligence and keeps the RAG compliance KB current.
    """

    def __init__(self):
        self.session_log: List[str] = []
        self.countries_updated: List[str] = []
        self.api_calls_made: int = 0
        self.errors: List[str] = []

    def _log(self, msg: str) -> None:
        timestamp = datetime.utcnow().strftime("%H:%M:%S")
        entry = f"[{timestamp}] {msg}"
        print(f"ResearchAgent: {msg}")
        self.session_log.append(entry)

    # ── World Bank Macroeconomic Data ────────────────────────────────────────

    def fetch_world_bank_macro(self, wb_iso2: str) -> Dict[str, Any]:
        """
        Fetch key macroeconomic indicators from World Bank API.
        Returns dict of indicator → latest value.
        All indicators are free and keyless.
        """
        indicators = {
            "FP.CPI.TOTL.ZG": "inflation_rate_pct",          # CPI inflation
            "NY.GDP.MKTP.KD.ZG": "gdp_growth_pct",           # GDP growth (constant prices)
            "SL.UEM.TOTL.ZS": "unemployment_rate_pct",       # Unemployment
            "GC.TAX.TOTL.GD.ZS": "tax_revenue_pct_gdp",      # Tax revenue % of GDP
            "GC.NLD.TOTL.GD.ZS": "govt_net_lending_pct_gdp", # Fiscal balance
        }

        result = {}
        for indicator_code, field_name in indicators.items():
            url = f"{WB_BASE}/country/{wb_iso2}/indicator/{indicator_code}"
            params = {"format": "json", "per_page": 1, "mrv": 1}  # most recent value
            data = _safe_get(url, params=params, timeout=8)
            self.api_calls_made += 1

            if data and len(data) == 2 and data[1]:
                entries = data[1]
                for entry in entries:
                    val = entry.get("value")
                    year = entry.get("date", "N/A")
                    if val is not None:
                        result[field_name] = {
                            "value": round(float(val), 2),
                            "year": year,
                            "source": "World Bank",
                        }
                        break

            time.sleep(0.3)  # Respectful rate limiting

        return result

    # ── OECD Tax Data ────────────────────────────────────────────────────────

    def fetch_oecd_tax_wages(self, iso3: str) -> Dict[str, Any]:
        """
        Fetch OECD Taxing Wages data for a country.
        Returns effective tax rates for average wage earners.
        Uses OECD.Stat JSON API (free, keyless).
        """
        # OECD Revenue Statistics dataset — tax rates as % of GDP
        url = f"{OECD_BASE}/REV/CRCTOT+CRSSSC.{iso3}.PC_GDP/all"
        params = {
            "startTime": "2022",
            "endTime": "2024",
            "dimensionAtObservation": "allDimensions",
        }
        data = _safe_get(url, params=params, timeout=12)
        self.api_calls_made += 1

        if not data:
            return {}

        try:
            obs = data.get("dataSets", [{}])[0].get("observations", {})
            if not obs:
                return {}

            values = [v[0] for v in obs.values() if v and v[0] is not None]
            if values:
                latest = values[-1]
                return {
                    "tax_revenue_pct_gdp_oecd": round(float(latest), 1),
                    "source": "OECD Revenue Statistics",
                    "year": "2022-2024",
                }
        except Exception as e:
            self._log(f"OECD parse error for {iso3}: {e}")

        return {}

    # ── IMF Regional Indicators ──────────────────────────────────────────────

    def fetch_imf_inflation(self, wb_iso2: str) -> Dict[str, Any]:
        """
        Fetch latest CPI inflation forecast from IMF World Economic Outlook.
        Free endpoint, no key required.
        """
        url = f"{IMF_BASE}/PCPIPCH/{wb_iso2}"
        data = _safe_get(url, timeout=8)
        self.api_calls_made += 1

        if not data:
            return {}

        try:
            imf_data = data.get("values", {}).get("PCPIPCH", {}).get(wb_iso2, {})
            if imf_data:
                # Get most recent year
                years = sorted(imf_data.keys(), reverse=True)
                for year in years[:3]:
                    val = imf_data.get(year)
                    if val is not None:
                        return {
                            "imf_cpi_forecast_pct": round(float(val), 2),
                            "imf_forecast_year": year,
                            "source": "IMF World Economic Outlook",
                        }
        except Exception as e:
            self._log(f"IMF parse error for {wb_iso2}: {e}")

        return {}

    # ── Compliance KB Document Builder ───────────────────────────────────────

    def _read_existing_kb(self, kb_file: str) -> str:
        """Read existing KB document content."""
        kb_path = KB_DIR / kb_file
        if kb_path.exists():
            return kb_path.read_text(encoding="utf-8")
        return ""

    def build_country_brief(
        self,
        iso3: str,
        config: Dict[str, Any],
        wb_macro: Dict[str, Any],
        oecd_tax: Dict[str, Any],
        imf_data: Dict[str, Any],
    ) -> str:
        """
        Construct a rich Markdown compliance document for a country.
        Merges: existing KB content + fresh macroeconomic data from APIs.
        The document is chunked and embedded into ChromaDB by the RAG engine.
        """
        country = config["name"]
        currency = config["currency"]
        cities   = ", ".join(config["cities"])
        now      = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        # Read existing document to preserve existing compliance text
        existing = self._read_existing_kb(config["kb_file"])

        # ── Build the "Live Macroeconomic Intelligence" section ───────────────
        macro_lines = [
            f"## Live Macroeconomic Intelligence",
            f"*Last updated by Research Agent: {now}*",
            f"*Data sources: World Bank API, OECD.Stat, IMF World Economic Outlook*",
            "",
        ]

        if wb_macro.get("inflation_rate_pct"):
            inf = wb_macro["inflation_rate_pct"]
            macro_lines.append(
                f"- **CPI Inflation ({inf['year']}):** {inf['value']}% "
                f"— sourced from {inf['source']}"
            )

        if wb_macro.get("gdp_growth_pct"):
            gdp = wb_macro["gdp_growth_pct"]
            macro_lines.append(
                f"- **GDP Growth ({gdp['year']}):** {gdp['value']}% "
                f"— sourced from {gdp['source']}"
            )

        if wb_macro.get("unemployment_rate_pct"):
            unem = wb_macro["unemployment_rate_pct"]
            macro_lines.append(
                f"- **Unemployment Rate ({unem['year']}):** {unem['value']}% "
                f"— sourced from {unem['source']}"
            )

        if wb_macro.get("tax_revenue_pct_gdp"):
            tax = wb_macro["tax_revenue_pct_gdp"]
            macro_lines.append(
                f"- **Tax Revenue (% of GDP, {tax['year']}):** {tax['value']}% "
                f"— sourced from {tax['source']}"
            )

        if oecd_tax.get("tax_revenue_pct_gdp_oecd"):
            macro_lines.append(
                f"- **OECD Tax Burden (% GDP):** {oecd_tax['tax_revenue_pct_gdp_oecd']}% "
                f"— {oecd_tax.get('source', 'OECD')} ({oecd_tax.get('year', '')})"
            )

        if imf_data.get("imf_cpi_forecast_pct"):
            macro_lines.append(
                f"- **IMF CPI Forecast ({imf_data['imf_forecast_year']}):** "
                f"{imf_data['imf_cpi_forecast_pct']}% "
                f"— {imf_data['source']}"
            )

        if wb_macro.get("govt_net_lending_pct_gdp"):
            fisc = wb_macro["govt_net_lending_pct_gdp"]
            direction = "surplus" if fisc["value"] > 0 else "deficit"
            macro_lines.append(
                f"- **Fiscal Balance ({fisc['year']}):** {fisc['value']}% of GDP "
                f"({direction}) — {fisc['source']}"
            )

        macro_lines += [
            "",
            f"### Relocation Context",
            f"- **Currency:** {currency}",
            f"- **Key Cities Covered:** {cities}",
            "",
        ]

        macro_section = "\n".join(macro_lines)

        # ── Merge with existing document ──────────────────────────────────────
        if existing:
            # Replace or append the live macro section
            SECTION_MARKER = "## Live Macroeconomic Intelligence"
            if SECTION_MARKER in existing:
                # Replace existing macro section
                pre = existing.split(SECTION_MARKER)[0].rstrip()
                updated_doc = pre + "\n\n" + macro_section
            else:
                # Append new section to existing document
                updated_doc = existing.rstrip() + "\n\n" + macro_section
        else:
            # Create new document from scratch
            header = f"# {country} — Compliance & Financial Intelligence\n\n"
            updated_doc = header + macro_section

        return updated_doc

    # ── RAG Index Update ─────────────────────────────────────────────────────

    def inject_into_rag(self, kb_file: str, content: str) -> bool:
        """
        Write updated document to the compliance KB directory.
        The RAG engine will auto-detect the hash change and rebuild the index
        on the next query (lazy rebuild).
        """
        try:
            kb_path = KB_DIR / kb_file
            kb_path.write_text(content, encoding="utf-8")

            # Invalidate the RAG hash so it re-indexes on next query
            hash_file = KB_DIR.parent / "kb_index.hash"
            if hash_file.exists():
                hash_file.write_text("invalidated_by_research_agent")

            self._log(f"Injected updated KB: {kb_file} ({len(content)} chars)")
            return True
        except Exception as e:
            error = f"Failed to write {kb_file}: {e}"
            self._log(error)
            self.errors.append(error)
            return False

    # ── Freshness Check ──────────────────────────────────────────────────────

    def is_refresh_needed(self, force: bool = False) -> bool:
        """Check if the KB is stale and needs a refresh."""
        if force:
            return True
        if not LAST_RUN_FILE.exists():
            return True
        try:
            last_run_data = json.loads(LAST_RUN_FILE.read_text())
            last_run = datetime.fromisoformat(last_run_data.get("timestamp", "2000-01-01"))
            age_days = (datetime.utcnow() - last_run).days
            if age_days >= MIN_REFRESH_DAYS:
                self._log(f"KB is {age_days} days old — refresh needed.")
                return True
            else:
                self._log(f"KB is {age_days} days old — still fresh (threshold: {MIN_REFRESH_DAYS} days).")
                return False
        except Exception:
            return True

    def _save_run_record(self) -> None:
        """Record the timestamp and results of this research run."""
        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "countries_updated": self.countries_updated,
            "api_calls_made": self.api_calls_made,
            "errors": self.errors,
        }
        LAST_RUN_FILE.write_text(json.dumps(record, indent=2))

    # ── Main Run Method ──────────────────────────────────────────────────────

    def run(self, force: bool = False, countries: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Execute the full research cycle.

        Args:
            force:     Skip freshness check and always refresh.
            countries: Optional ISO3 list to restrict which countries to update.
                       Pass None to update all configured countries.

        Returns:
            Session report dict with counts, errors, and log.
        """
        self._log("=" * 60)
        self._log("Research Agent: Starting autonomous KB refresh cycle")
        self._log("=" * 60)
        start_time = datetime.utcnow()

        if not self.is_refresh_needed(force=force):
            return {
                "status": "skipped",
                "reason": "KB is fresh (updated within 7 days)",
                "last_run": LAST_RUN_FILE.read_text() if LAST_RUN_FILE.exists() else None,
            }

        target_countries = countries or list(COUNTRY_CONFIG.keys())
        self._log(f"Target countries: {target_countries}")

        for iso3 in target_countries:
            config = COUNTRY_CONFIG.get(iso3)
            if not config:
                self._log(f"Unknown ISO3: {iso3} — skipping")
                continue

            country = config["name"]
            self._log(f"--- Processing: {country} ({iso3}) ---")

            # 1. Fetch World Bank macro data
            self._log(f"Fetching World Bank indicators for {config['wb_iso2']}...")
            wb_macro = self.fetch_world_bank_macro(config["wb_iso2"])
            self._log(f"  WB: {list(wb_macro.keys())}")

            # 2. Fetch OECD tax data (best-effort — may return empty for non-OECD)
            self._log(f"Fetching OECD tax data for {iso3}...")
            oecd_tax = self.fetch_oecd_tax_wages(iso3)
            self._log(f"  OECD: {list(oecd_tax.keys())}")

            # 3. Fetch IMF inflation forecast
            self._log(f"Fetching IMF CPI forecast for {config['wb_iso2']}...")
            imf_data = self.fetch_imf_inflation(config["wb_iso2"])
            self._log(f"  IMF: {list(imf_data.keys())}")

            # 4. Build updated compliance document
            updated_doc = self.build_country_brief(iso3, config, wb_macro, oecd_tax, imf_data)

            # 5. Write to KB and invalidate RAG index
            success = self.inject_into_rag(config["kb_file"], updated_doc)
            if success:
                self.countries_updated.append(country)

            # Polite delay between countries to avoid rate limits
            time.sleep(1.0)

        # ── Rebuild RAG index with updated documents ──────────────────────────
        if self.countries_updated:
            self._log("Triggering RAG index rebuild...")
            try:
                sys.path.insert(0, str(Path(__file__).parent.parent.parent))
                from rag.rag_engine import build_index
                chunk_count = build_index(force=True)
                self._log(f"RAG index rebuilt: {chunk_count} chunks indexed")
            except Exception as e:
                error = f"RAG rebuild failed: {e}"
                self._log(error)
                self.errors.append(error)

        elapsed = (datetime.utcnow() - start_time).total_seconds()
        self._save_run_record()

        report = {
            "status": "completed",
            "countries_updated": self.countries_updated,
            "countries_attempted": len(target_countries),
            "api_calls_made": self.api_calls_made,
            "elapsed_seconds": round(elapsed, 1),
            "errors": self.errors,
            "log": self.session_log[-20:],  # Last 20 log lines
        }

        self._log(f"Research cycle complete: {len(self.countries_updated)} countries updated in {elapsed:.1f}s")
        return report


# ── Singleton and convenience functions ──────────────────────────────────────

_research_agent: Optional[ResearchAgent] = None


def get_research_agent() -> ResearchAgent:
    """Get or create the global Research Agent singleton."""
    global _research_agent
    if _research_agent is None:
        _research_agent = ResearchAgent()
    return _research_agent


def run_research_if_stale() -> Dict[str, Any]:
    """
    Called at startup and by the monitor.
    Runs the full research cycle only if KB is stale (>7 days old).
    """
    agent = get_research_agent()
    return agent.run(force=False)
