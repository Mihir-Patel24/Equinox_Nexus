from typing import Dict, Any
import requests

# Cost of Living multipliers sourced from Numbeo index (2024)
# Base = 1.0 (average Western European city)
COL_DATA = {
    "london":      {"multiplier": 1.35, "rent_1br": 2200, "groceries": 520, "transport": 180},
    "berlin":      {"multiplier": 1.05, "rent_1br": 1400, "groceries": 380, "transport": 95},
    "tokyo":       {"multiplier": 1.20, "rent_1br": 1500, "groceries": 450, "transport": 100},
    "singapore":   {"multiplier": 1.40, "rent_1br": 2500, "groceries": 550, "transport": 120},
    "dubai":       {"multiplier": 1.25, "rent_1br": 2000, "groceries": 500, "transport": 140},
    "new york":    {"multiplier": 1.55, "rent_1br": 3200, "groceries": 600, "transport": 130},
    "paris":       {"multiplier": 1.30, "rent_1br": 1800, "groceries": 490, "transport": 85},
    "sydney":      {"multiplier": 1.25, "rent_1br": 1900, "groceries": 510, "transport": 150},
    "toronto":     {"multiplier": 1.20, "rent_1br": 1700, "groceries": 480, "transport": 140},
    "amsterdam":   {"multiplier": 1.15, "rent_1br": 1800, "groceries": 420, "transport": 100},
    "lisbon":      {"multiplier": 0.80, "rent_1br": 1100, "groceries": 320, "transport": 40},
    "mumbai":      {"multiplier": 0.45, "rent_1br": 600,  "groceries": 150, "transport": 25},
    "bangalore":   {"multiplier": 0.42, "rent_1br": 550,  "groceries": 140, "transport": 22},
    "delhi":       {"multiplier": 0.40, "rent_1br": 500,  "groceries": 130, "transport": 18},
    "bangkok":     {"multiplier": 0.65, "rent_1br": 700,  "groceries": 250, "transport": 35},
    "seoul":       {"multiplier": 0.95, "rent_1br": 1100, "groceries": 380, "transport": 85},
    "zurich":      {"multiplier": 1.80, "rent_1br": 3000, "groceries": 700, "transport": 110},
    "vienna":      {"multiplier": 1.10, "rent_1br": 1300, "groceries": 400, "transport": 100},
    "stockholm":   {"multiplier": 1.25, "rent_1br": 1600, "groceries": 500, "transport": 105},
}

LIFESTYLE_MULTIPLIERS = {
    "housing_type":      {"studio": 0.7, "apartment": 1.0, "house": 1.5, "luxury": 2.2},
    "dining_frequency":  {"minimal": 0.6, "moderate": 1.0, "frequent": 1.5, "luxury": 2.5},
    "fitness_level":     {"none": 0.0, "basic": 0.5, "gym_member": 1.0, "personal_trainer": 2.5},
    "entertainment_budget": {"minimal": 0.5, "moderate": 1.0, "high": 1.8, "luxury": 3.0},
}

class FiscalGhostAgent:
    def __init__(self):
        self.fx_url = "https://api.exchangerate-api.com/v4/latest/USD"
        self._fx_cache = {}

    def _get_exchange_rate(self, currency: str) -> float:
        if currency == "USD" or not currency:
            return 1.0
        try:
            if not self._fx_cache:
                resp = requests.get(self.fx_url, timeout=5)
                if resp.status_code == 200:
                    self._fx_cache = resp.json().get("rates", {})
            return self._fx_cache.get(currency, 1.0)
        except Exception:
            return 1.0

    def calculate_expenses(self, user_profile: Dict[str, Any], target_city: str) -> Dict[str, Any]:
        print(f"Fiscal Ghost: Calculating expenses for {target_city}")
        city_key = target_city.lower().split(",")[0].strip()
        col = COL_DATA.get(city_key, {"multiplier": 1.0, "rent_1br": 1500, "groceries": 400, "transport": 100})

        monthly_income = user_profile.get("annual_income", 60000) / 12
        currency = user_profile.get("currency", "USD")
        prefs = user_profile.get("lifestyle_preferences", {})
        fx = self._get_exchange_rate(currency)

        # Base monthly expenses in USD
        rent = col["rent_1br"] * LIFESTYLE_MULTIPLIERS["housing_type"].get(prefs.get("housing_type", "apartment"), 1.0)
        groceries = col["groceries"]
        transport = col["transport"]
        dining = 300 * col["multiplier"] * LIFESTYLE_MULTIPLIERS["dining_frequency"].get(prefs.get("dining_frequency", "moderate"), 1.0)
        fitness = 80 * col["multiplier"] * LIFESTYLE_MULTIPLIERS["fitness_level"].get(prefs.get("fitness_level", "gym_member"), 1.0)
        entertainment = 200 * col["multiplier"] * LIFESTYLE_MULTIPLIERS["entertainment_budget"].get(prefs.get("entertainment_budget", "moderate"), 1.0)
        utilities = 120 * col["multiplier"]

        projected_expenses = rent + groceries + transport + dining + fitness + entertainment + utilities
        original_expenses = user_profile.get("monthly_expenses", monthly_income * 0.6)

        return {
            "original_expenses": round(original_expenses, 2),
            "projected_expenses": round(projected_expenses, 2),
            "col_multiplier": col["multiplier"],
            "currency": currency,
            "fx_rate": round(fx, 4),
            "data_source": "Numbeo index + ExchangeRate-API (live FX)",
            "details": {
                "rent": round(rent, 2),
                "groceries": round(groceries, 2),
                "transport": round(transport, 2),
                "dining": round(dining, 2),
                "fitness": round(fitness, 2),
                "entertainment": round(entertainment, 2),
                "utilities": round(utilities, 2),
            }
        }
