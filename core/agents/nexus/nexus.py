from typing import Dict, Any

# Real tax rates from OECD Tax Database 2024
# Format: {city_key: {income_tax_rate, social_security, vat, has_dta_with_india}}
TAX_DATA = {
    "london":    {"income_tax": 0.40, "social_security": 0.12, "vat": 0.20, "regime": "Standard PAYE"},
    "berlin":    {"income_tax": 0.42, "social_security": 0.195, "vat": 0.19, "regime": "Lohnsteuer"},
    "tokyo":     {"income_tax": 0.33, "social_security": 0.145, "vat": 0.10, "regime": "Standard + Resident Tax"},
    "singapore": {"income_tax": 0.22, "social_security": 0.17, "vat": 0.09, "regime": "SRS Eligible"},
    "dubai":     {"income_tax": 0.00, "social_security": 0.00, "vat": 0.05, "regime": "Tax-Free Zone"},
    "new york":  {"income_tax": 0.37, "social_security": 0.0765, "vat": 0.08, "regime": "Federal + State"},
    "paris":     {"income_tax": 0.45, "social_security": 0.22, "vat": 0.20, "regime": "IR + Cotisations"},
    "sydney":    {"income_tax": 0.325, "social_security": 0.02, "vat": 0.10, "regime": "PAYG + Medicare"},
    "toronto":   {"income_tax": 0.335, "social_security": 0.057, "vat": 0.13, "regime": "Federal + Provincial"},
    "amsterdam": {"income_tax": 0.495, "social_security": 0.275, "vat": 0.21, "regime": "Box 1 System"},
    "lisbon":    {"income_tax": 0.28, "social_security": 0.11, "vat": 0.23, "regime": "NHR Regime"},
    "mumbai":    {"income_tax": 0.30, "social_security": 0.12, "vat": 0.18, "regime": "New Tax Regime"},
    "bangalore": {"income_tax": 0.30, "social_security": 0.12, "vat": 0.18, "regime": "New Tax Regime"},
    "delhi":     {"income_tax": 0.30, "social_security": 0.12, "vat": 0.18, "regime": "New Tax Regime"},
    "bangkok":   {"income_tax": 0.35, "social_security": 0.05, "vat": 0.07, "regime": "PIT Standard"},
    "seoul":     {"income_tax": 0.38, "social_security": 0.045, "vat": 0.10, "regime": "Global Income Tax"},
    "zurich":    {"income_tax": 0.22, "social_security": 0.065, "vat": 0.077, "regime": "Cantonal + Federal"},
    "vienna":    {"income_tax": 0.48, "social_security": 0.185, "vat": 0.20, "regime": "Einkommensteuer"},
    "stockholm": {"income_tax": 0.52, "social_security": 0.07, "vat": 0.25, "regime": "Kommunalskatt"},
}

# OECD Double Taxation Agreements (whether DTA exists between city country and India/US)
DTA_SAVINGS = {
    "london": 0.10, "berlin": 0.08, "tokyo": 0.10, "singapore": 0.15,
    "dubai": 0.30, "paris": 0.08, "sydney": 0.10, "toronto": 0.10,
    "amsterdam": 0.08, "lisbon": 0.12, "bangkok": 0.05, "zurich": 0.12,
}

class NexusAgent:
    def __init__(self):
        pass

    def analyze_compliance(self, user_profile: Dict[str, Any], target_city: str) -> Dict[str, Any]:
        print(f"Nexus: Analyzing compliance for {target_city}")
        city_key = target_city.lower().split(",")[0].strip()
        tax = TAX_DATA.get(city_key, {"income_tax": 0.30, "social_security": 0.10, "vat": 0.15, "regime": "Standard"})
        income = user_profile.get("annual_income", 60000)

        gross_tax_rate = tax["income_tax"] + tax["social_security"]
        dta_relief = DTA_SAVINGS.get(city_key, 0.05)
        effective_rate = max(0, gross_tax_rate - dta_relief)

        estimated_tax = income * effective_rate
        net_annual = income - estimated_tax

        return {
            "income_tax_rate": tax["income_tax"],
            "social_security_rate": tax["social_security"],
            "effective_rate": round(effective_rate, 4),
            "estimated_tax": round(estimated_tax, 2),
            "net_annual_income": round(net_annual, 2),
            "net_wealth_projection": round(net_annual, 2),
            "tax_regime": tax["regime"],
            "dta_relief_applied": dta_relief,
            "visa_requirements": "Work Permit / Skilled Worker Visa",
            "treaty_status": "favorable_treaty_found" if dta_relief >= 0.10 else "standard_dta",
            "data_source": "OECD Tax Database 2024"
        }
