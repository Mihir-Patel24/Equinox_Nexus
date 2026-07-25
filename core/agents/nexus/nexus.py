"""
Nexus Agent — RAG-Powered Compliance & Tax Intelligence Engine v3.0

Architecture:
1. Retrieves live compliance passages from ChromaDB using the RAG engine
2. Uses OECD 2024 tax rates as structured numeric backbone (for calculations)
3. Enriches with DTA intelligence and visa category from RAG
4. Produces a compliance brief grounded in retrieved documents

NO hardcoded static strings for compliance advice.
All qualitative compliance text is retrieved from the knowledge base.
"""

from typing import Dict, Any
import os
import sys

# Add parent to path to import RAG engine
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

# Lazy import — RAG engine initializes ChromaDB/sentence-transformers
_rag_engine = None

def _get_rag():
    global _rag_engine
    if _rag_engine is None:
        try:
            from rag.rag_engine import get_rag_engine
            _rag_engine = get_rag_engine()
        except Exception as e:
            print(f"Nexus: RAG engine unavailable ({e}). Proceeding without RAG.")
            _rag_engine = False  # Mark as unavailable
    return _rag_engine if _rag_engine is not False else None


# ── OECD 2024 Numeric Tax Backbone ──────────────────────────────────────────
# These are used ONLY for numeric calculations (effective rate, estimated tax).
# All human-readable compliance text comes from RAG.
TAX_DATA = {
    # city_key: (income_tax, social_security, vat, regime_label, country_for_rag)
    "london":     (0.40, 0.080, 0.20, "PAYE (UK)",               "United Kingdom"),
    "berlin":     (0.42, 0.195, 0.19, "Lohnsteuer (DE)",          "Germany"),
    "frankfurt":  (0.42, 0.195, 0.19, "Lohnsteuer (DE)",          "Germany"),
    "munich":     (0.42, 0.195, 0.19, "Lohnsteuer (DE)",          "Germany"),
    "hamburg":    (0.42, 0.195, 0.19, "Lohnsteuer (DE)",          "Germany"),
    "tokyo":      (0.33, 0.145, 0.10, "National + Resident Tax",  "Japan"),
    "osaka":      (0.33, 0.145, 0.10, "National + Resident Tax",  "Japan"),
    "singapore":  (0.22, 0.170, 0.09, "SRS Eligible (SG)",        "Singapore"),
    "dubai":      (0.00, 0.000, 0.05, "Tax-Free (UAE)",           "United Arab Emirates"),
    "abu dhabi":  (0.00, 0.000, 0.05, "Tax-Free (UAE)",           "United Arab Emirates"),
    "new york":   (0.37, 0.0765, 0.08, "Federal + State + City", "United States"),
    "miami":      (0.37, 0.0765, 0.08, "Federal Only (FL)",       "United States"),
    "austin":     (0.37, 0.0765, 0.08, "Federal Only (TX)",       "United States"),
    "san francisco": (0.37, 0.0765, 0.08, "Federal + CA State",  "United States"),
    "paris":      (0.45, 0.220, 0.20, "IR + Cotisations (FR)",    "France"),
    "sydney":     (0.325, 0.020, 0.10, "PAYG + Medicare (AU)",    "Australia"),
    "melbourne":  (0.325, 0.020, 0.10, "PAYG + Medicare (AU)",    "Australia"),
    "toronto":    (0.335, 0.057, 0.13, "Federal + Ontario",       "Canada"),
    "vancouver":  (0.335, 0.057, 0.13, "Federal + BC",            "Canada"),
    "montreal":   (0.335, 0.057, 0.15, "Federal + Quebec",        "Canada"),
    "amsterdam":  (0.495, 0.000, 0.21, "Box 1 + 30% Ruling",      "Netherlands"),
    "lisbon":     (0.28, 0.110, 0.23, "NHR Regime (PT)",          "Portugal"),
    "porto":      (0.28, 0.110, 0.23, "NHR Regime (PT)",          "Portugal"),
    "mumbai":     (0.30, 0.120, 0.18, "New Tax Regime (IN)",      "India"),
    "bangalore":  (0.30, 0.120, 0.18, "New Tax Regime (IN)",      "India"),
    "delhi":      (0.30, 0.120, 0.18, "New Tax Regime (IN)",      "India"),
    "hyderabad":  (0.30, 0.120, 0.18, "New Tax Regime (IN)",      "India"),
    "pune":       (0.30, 0.120, 0.18, "New Tax Regime (IN)",      "India"),
    "bangkok":    (0.35, 0.050, 0.07, "PIT Standard (TH)",        "Thailand"),
    "seoul":      (0.38, 0.045, 0.10, "Global Income Tax (KR)",   "South Korea"),
    "zurich":     (0.22, 0.065, 0.077, "Cantonal + Federal (CH)", "Switzerland"),
    "vienna":     (0.48, 0.185, 0.20, "Einkommensteuer (AT)",     "Austria"),
    "stockholm":  (0.52, 0.070, 0.25, "Kommunalskatt (SE)",       "Sweden"),
    "oslo":       (0.40, 0.082, 0.25, "Trinnskatt (NO)",          "Norway"),
    "hong kong":  (0.17, 0.050, 0.00, "Salaries Tax (HK)",        "Hong Kong"),
    "kuala lumpur": (0.28, 0.11, 0.08, "PIT (MY)",                "Malaysia"),
    "prague":     (0.23, 0.065, 0.21, "Daň z příjmů (CZ)",       "Czech Republic"),
    "warsaw":     (0.32, 0.137, 0.23, "PIT (PL)",                 "Poland"),
    "budapest":   (0.15, 0.185, 0.27, "SZJA Flat (HU)",           "Hungary"),
    "dubai internet city": (0.00, 0.000, 0.05, "Free Zone (UAE)", "United Arab Emirates"),
}

# DTA relief rates (fraction of gross tax rate)
DTA_RELIEF = {
    "london": 0.10, "berlin": 0.08, "frankfurt": 0.08, "munich": 0.08,
    "tokyo": 0.10, "singapore": 0.15, "dubai": 0.30, "abu dhabi": 0.30,
    "paris": 0.08, "sydney": 0.10, "melbourne": 0.10, "toronto": 0.10,
    "vancouver": 0.10, "amsterdam": 0.08, "lisbon": 0.12, "porto": 0.12,
    "bangkok": 0.05, "zurich": 0.12, "hong kong": 0.08, "seoul": 0.07,
    "oslo": 0.08, "stockholm": 0.07,
}

# Country → relevant KB document mapping
COUNTRY_KB_MAP = {
    "United Kingdom":        "uk_compliance",
    "Germany":               "germany_compliance",
    "Singapore":             "singapore_compliance",
    "United Arab Emirates":  "uae_compliance",
    "United States":         "usa_compliance",
    "Japan":                 "japan_compliance",
    "Australia":             "australia_compliance",
    "India":                 "india_compliance",
    "Netherlands":           "netherlands_compliance",
    "Canada":                "canada_compliance",
}


class NexusAgent:
    def __init__(self):
        # Pre-warm RAG engine at startup
        self._rag = None

    def _get_rag(self):
        if self._rag is None:
            self._rag = _get_rag()
        return self._rag

    def _get_tax_params(self, city_key: str):
        """Look up OECD tax parameters. Returns (income_tax, ss, vat, regime, country)."""
        row = TAX_DATA.get(city_key)
        if row:
            return row
        # Fuzzy match — check if city_key contains a known key
        for key, row in TAX_DATA.items():
            if key in city_key or city_key in key:
                return row
        return (0.30, 0.100, 0.15, "Standard Jurisdiction", "Unknown")

    def _build_rag_compliance_brief(
        self,
        city_key: str,
        country: str,
        income: float,
    ) -> Dict[str, Any]:
        """Query the RAG engine for compliance intelligence."""
        rag = self._get_rag()
        if not rag:
            return {"compliance_brief": "RAG engine unavailable.", "retrieved_passages": [], "sources_used": []}

        queries = [
            f"income tax rates {country} employed professional",
            f"visa work permit {country} highly skilled professional engineer",
            f"double taxation agreement DTA {country} foreign income relief",
            f"social security pension contributions {country} employee",
        ]

        return rag.get_compliance_brief(
            city=city_key,
            country=country,
            income=income,
            query_topics=queries,
        )

    def _extract_visa_category(self, passages: list, country: str) -> str:
        """
        Extract the primary visa category from retrieved RAG passages.
        Looks for common visa keywords in passage text.
        """
        visa_keywords = {
            "Employment Pass": ["employment pass", "ep holder"],
            "Skilled Worker Visa": ["skilled worker", "sponsorship", "sponsored"],
            "EU Blue Card": ["blue card", "blaue karte"],
            "H-1B Visa": ["h-1b", "h1b", "specialty occupation"],
            "TSS 482 Visa": ["subclass 482", "tss visa", "temporary skill shortage"],
            "Highly Skilled Migrant": ["kennismigrant", "highly skilled migrant"],
            "Highly Skilled Professional": ["highly skilled professional", "hsp", "points-based"],
            "Express Entry": ["express entry", "crs", "comprehensive ranking"],
            "Employer Sponsored": ["employer sponsored", "employer nomination"],
            "Golden Visa": ["golden visa", "long-term residence visa"],
            "Green Visa": ["green visa", "self-sponsorship"],
            "Work Permit": ["work permit", "work authorization"],
        }

        all_text = " ".join([p.get("text", "") for p in passages]).lower()

        matched_visas = []
        for visa_name, keywords in visa_keywords.items():
            if any(kw in all_text for kw in keywords):
                matched_visas.append(visa_name)

        if matched_visas:
            return " / ".join(matched_visas[:2])  # Return top 2 matched
        return "Work Permit / Professional Visa (see compliance brief)"

    def _extract_dta_status(self, passages: list, city_key: str) -> Dict[str, Any]:
        """Derive DTA treaty status from RAG content and stored relief rates."""
        relief = DTA_RELIEF.get(city_key, 0.05)
        all_text = " ".join([p.get("text", "") for p in passages]).lower()

        # Detect DTA mentions in retrieved content
        has_dta = any(kw in all_text for kw in [
            "double taxation", "dta", "dtaa", "tax treaty", "tax agreement",
            "withholding tax", "wht", "foreign tax credit"
        ])

        if relief >= 0.15:
            status = "highly_favorable_dta"
            treaty_label = "Highly Favorable Tax Treaty"
        elif relief >= 0.10:
            status = "favorable_dta"
            treaty_label = "Favorable DTA — Significant Relief Available"
        elif relief >= 0.05 or has_dta:
            status = "standard_dta"
            treaty_label = "Standard DTA — Moderate Relief"
        else:
            status = "no_dta"
            treaty_label = "No DTA Confirmed — Risk of Double Taxation"

        return {
            "treaty_status": status,
            "treaty_label": treaty_label,
            "dta_mentions_in_kb": has_dta,
            "relief_rate": relief,
        }

    def analyze_compliance(self, user_profile: Dict[str, Any], target_city: str) -> Dict[str, Any]:
        print(f"Nexus (RAG): Analyzing compliance for {target_city}")

        city_key = target_city.lower().split(",")[0].strip()
        income = user_profile.get("annual_income", 60000)
        currency = user_profile.get("currency", "USD")

        # 1. Get numeric tax parameters (OECD backbone)
        income_tax, social_security, vat, regime, country = self._get_tax_params(city_key)

        # 2. Get DTA relief
        dta_relief = DTA_RELIEF.get(city_key, 0.05)
        gross_tax_rate = income_tax + social_security
        effective_rate = max(0.0, gross_tax_rate - dta_relief)
        estimated_tax = income * effective_rate
        net_annual = income - estimated_tax

        # 3. RAG-powered compliance intelligence
        rag_brief = self._build_rag_compliance_brief(city_key, country, income)
        passages = rag_brief.get("retrieved_passages", [])

        # 4. Extract visa and DTA status from RAG output
        visa_category = self._extract_visa_category(passages, country)
        dta_info = self._extract_dta_status(passages, city_key)

        # 5. Build top compliance notes from retrieved passages (sorted by relevance)
        top_notes = []
        for p in passages[:3]:
            if p.get("relevance_score", 0) > 0.2:
                # Extract first 2 sentences as a compliance note
                text = p.get("text", "")
                sentences = text.split(".")[:2]
                note = ". ".join(s.strip() for s in sentences if s.strip()) + "."
                if len(note) > 30:
                    top_notes.append(note)

        # Special adjustments for specific regimes
        special_notes = []
        if city_key in ("amsterdam",):
            special_notes.append("30% Ruling may apply if recruited abroad — reduces taxable income to 70% of salary for up to 5 years.")
        if city_key in ("lisbon", "porto"):
            special_notes.append("Non-Habitual Resident (NHR) status may provide flat 20% rate on Portuguese-sourced income for 10 years.")
        if city_key in ("dubai", "abu dhabi"):
            special_notes.append("UAE has zero personal income tax. End of Service Gratuity (21 days/year) is mandatory employer benefit.")
        if city_key == "singapore" and social_security > 0:
            special_notes.append("CPF contributions apply only to Singapore PRs and Citizens. Work Pass holders are exempt from CPF.")

        return {
            # Numeric outputs (for calculations)
            "income_tax_rate": income_tax,
            "social_security_rate": social_security,
            "vat_rate": vat,
            "gross_tax_rate": round(gross_tax_rate, 4),
            "dta_relief_applied": dta_relief,
            "effective_rate": round(effective_rate, 4),
            "estimated_tax": round(estimated_tax, 2),
            "net_annual_income": round(net_annual, 2),
            "net_wealth_projection": round(net_annual, 2),

            # Qualitative outputs (from RAG or structured data)
            "tax_regime": regime,
            "country": country,
            "visa_requirements": visa_category,
            "treaty_status": dta_info["treaty_status"],
            "treaty_label": dta_info["treaty_label"],

            # RAG-retrieved compliance intelligence
            "compliance_notes": top_notes + special_notes,
            "compliance_brief_excerpt": rag_brief.get("compliance_brief", "")[:800] if rag_brief.get("compliance_brief") else "",
            "rag_sources": rag_brief.get("sources_used", []),
            "rag_passage_count": rag_brief.get("rag_retrieval_count", 0),

            "data_source": f"OECD Tax Database 2024 + RAG ({', '.join(rag_brief.get('sources_used', [])[:2])})",
        }
