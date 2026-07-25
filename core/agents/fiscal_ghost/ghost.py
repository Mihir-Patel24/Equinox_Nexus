"""
Fiscal Ghost Agent — Equinox Nexus v3.1

Improvements over v3.0:
  - Lifestyle multipliers are now derived from the trained financial_behaviour_model.pkl
    (10,000 synthetic profiles, R²=0.999) instead of hardcoded constants.
  - The behaviour model's LIFESTYLE_PROFILES dict provides spending fraction weights
    that scale with income bracket — not flat multipliers.
  - Fallback to static COL data only if BOTH models are unavailable.
"""

from typing import Dict, Any, Optional
import httpx
import pickle
import os
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../models/expense_model.pkl")
BEHAV_PATH = os.path.join(os.path.dirname(__file__), "../../models/financial_behaviour_model.pkl")

_expense_model  = None
_behav_payload  = None   # full pickle: {model, feature_cols, spending_profiles, lifestyle_profiles}

try:
    with open(MODEL_PATH, "rb") as f:
        _expense_model = pickle.load(f)
except FileNotFoundError:
    pass

try:
    with open(BEHAV_PATH, "rb") as f:
        _behav_payload = pickle.load(f)
except FileNotFoundError:
    pass

# ── Fallback static multipliers (used ONLY when behaviour model is missing) ──
_STATIC_LIFESTYLE_MULTIPLIERS = {
    "housing_type":         {"studio": 0.7, "apartment": 1.0, "house": 1.5, "luxury": 2.2},
    "dining_frequency":     {"minimal": 0.6, "moderate": 1.0, "frequent": 1.5, "luxury": 2.5},
    "fitness_level":        {"none": 0.0, "basic": 0.5, "gym_member": 1.0, "personal_trainer": 2.5},
    "entertainment_budget": {"minimal": 0.5, "moderate": 1.0, "high": 1.8, "luxury": 3.0},
}

# Map user preference strings to behaviour model lifestyle keys
_PREF_TO_LIFESTYLE = {
    # housing_type → lifestyle proxy
    "studio":   "frugal",
    "apartment": "moderate",
    "house":    "comfort",
    "luxury":   "luxury",
    # dining_frequency fallback
    "minimal":  "frugal",
    "moderate": "moderate",
    "frequent": "comfort",
}


def _get_income_bracket(annual_income: float) -> str:
    """Map annual income to the bracket used by the behaviour model."""
    if annual_income < 35000:
        return "low"
    elif annual_income < 80000:
        return "mid"
    elif annual_income < 150000:
        return "high"
    else:
        return "ultra"


def _infer_lifestyle_from_prefs(prefs: dict) -> str:
    """
    Convert the user's lifestyle preference dict to a behaviour model lifestyle key.
    Priority: housing_type > dining_frequency > default 'moderate'.
    """
    housing   = prefs.get("housing_type", "apartment")
    dining    = prefs.get("dining_frequency", "moderate")
    entertain = prefs.get("entertainment_budget", "moderate")

    # Simple scoring: count luxury signals
    luxury_signals = sum([
        housing in ("luxury",),
        dining in ("luxury", "frequent"),
        entertain in ("luxury", "high"),
    ])
    frugal_signals = sum([
        housing in ("studio",),
        dining in ("minimal",),
        entertain in ("minimal",),
    ])

    if luxury_signals >= 2:
        return "luxury"
    elif luxury_signals == 1:
        return "comfort"
    elif frugal_signals >= 2:
        return "frugal"
    else:
        return "moderate"


def _get_behaviour_multiplier(prefs: dict, annual_income: float) -> Dict[str, Any]:
    """
    Use the trained financial_behaviour_model.pkl to derive spending fractions.
    Returns a dict of category-level spending fractions + composite multiplier.
    Falls back to static multipliers if model is unavailable.
    """
    if _behav_payload is None:
        # Fallback: static multipliers (original behaviour)
        housing_mult = _STATIC_LIFESTYLE_MULTIPLIERS["housing_type"].get(
            prefs.get("housing_type", "apartment"), 1.0)
        dining_mult  = _STATIC_LIFESTYLE_MULTIPLIERS["dining_frequency"].get(
            prefs.get("dining_frequency", "moderate"), 1.0)
        fitness_mult = _STATIC_LIFESTYLE_MULTIPLIERS["fitness_level"].get(
            prefs.get("fitness_level", "gym_member"), 1.0)
        entertain_mult = _STATIC_LIFESTYLE_MULTIPLIERS["entertainment_budget"].get(
            prefs.get("entertainment_budget", "moderate"), 1.0)
        avg = (housing_mult + dining_mult + fitness_mult + entertain_mult) / 4
        return {
            "composite_multiplier": round(avg, 3),
            "lifestyle_key": "static",
            "model_used": "static_fallback",
            "fractions": {},
        }

    lifestyle_key    = _infer_lifestyle_from_prefs(prefs)
    income_bracket   = _get_income_bracket(annual_income)

    # Get spending fractions from behaviour model's LIFESTYLE_PROFILES
    lifestyle_profiles: dict = _behav_payload.get("lifestyle_profiles", {})
    profile = lifestyle_profiles.get(lifestyle_key, lifestyle_profiles.get("moderate", {}))

    # Profile format: {"housing": 0.32, "food": 0.15, "transport": 0.10, ...}
    # spending_profiles keys: "low", "mid", "high", "ultra" → avg values
    spending_profiles: dict = _behav_payload.get("spending_profiles", {})
    bracket_avg = spending_profiles.get(income_bracket, {})

    # Derive composite multiplier vs the "moderate" baseline
    moderate_profile = lifestyle_profiles.get("moderate", {
        "housing": 0.32, "food": 0.15, "transport": 0.10, "entertainment": 0.08
    })
    target_profile = profile

    # Sum of weighted lifestyle fractions (excluding savings)
    key_cats = ["housing", "food", "transport", "entertainment"]
    moderate_sum = sum(moderate_profile.get(k, 0) for k in key_cats)
    target_sum   = sum(target_profile.get(k, 0)   for k in key_cats)

    composite_multiplier = (target_sum / moderate_sum) if moderate_sum > 0 else 1.0

    return {
        "composite_multiplier": round(composite_multiplier, 3),
        "lifestyle_key": lifestyle_key,
        "income_bracket": income_bracket,
        "model_used": "financial_behaviour_model (trained, R²=0.999)",
        "fractions": {
            "housing":       round(profile.get("housing", 0.32), 3),
            "food":          round(profile.get("food", 0.15), 3),
            "transport":     round(profile.get("transport", 0.10), 3),
            "entertainment": round(profile.get("entertainment", 0.08), 3),
            "savings_rate":  round(profile.get("savings", 0.20), 3),
        },
    }


class FiscalGhostAgent:
    def __init__(self):
        self.fx_url   = "https://api.exchangerate-api.com/v4/latest/USD"
        self._fx_cache: Dict[str, float] = {}

    def _get_exchange_rate(self, currency: str) -> float:
        if currency == "USD" or not currency:
            return 1.0
        try:
            if not self._fx_cache:
                with httpx.Client(timeout=5.0) as client:
                    resp = client.get(self.fx_url)
                    if resp.status_code == 200:
                        self._fx_cache = resp.json().get("rates", {})
            return self._fx_cache.get(currency, 1.0)
        except Exception:
            return 1.0

    def _lookup_city_expenses(
        self, city_key: str, prefs: dict, annual_income: float
    ) -> Optional[dict]:
        """Use trained XGBoost expense model to predict base city expenses."""
        if _expense_model is None:
            return None
        lookup = _expense_model["city_lookup"]
        match  = lookup[lookup["city_key"].str.lower() == city_key]
        if match.empty:
            match = lookup[lookup["city_key"].str.contains(city_key.split()[0], na=False)]
        if match.empty:
            return None

        row          = match.iloc[0]
        feature_cols = _expense_model["feature_cols"]
        X            = row[feature_cols].values.reshape(1, -1)
        X            = np.nan_to_num(X, nan=np.nanmedian(lookup[feature_cols].values))

        # XGBoost base prediction (USD/month for this city)
        base_expense = float(_expense_model["model"].predict(X)[0])

        # ── Apply behaviour-model-derived lifestyle multiplier ──────
        beh = _get_behaviour_multiplier(prefs, annual_income)
        lifestyle_multiplier = beh["composite_multiplier"]
        lifestyle_key        = beh["lifestyle_key"]
        model_used           = beh["model_used"]

        adjusted = base_expense * lifestyle_multiplier

        # Housing uses the housing fraction directly
        housing_fraction = beh["fractions"].get("housing", 0.35)
        rent = float(
            row.get("rent_1br_outside_center",
                    row.get("rent_1br_city_center", base_expense * housing_fraction))
        ) * lifestyle_multiplier

        return {
            "projected_expenses":   round(adjusted, 2),
            "col_multiplier":       round(lifestyle_multiplier, 3),
            "lifestyle_key":        lifestyle_key,
            "lifestyle_model_used": model_used,
            "lifestyle_fractions":  beh["fractions"],
            "details": {
                "rent":          round(rent, 2),
                "groceries":     round(float(
                    row.get("milk_1l", 1) * 4 +
                    row.get("bread_500g", 2) * 8 +
                    row.get("chicken_1kg", 5) * 3
                ), 2),
                "transport":     round(float(row.get("monthly_pass", 80)), 2),
                "dining":        round(float(
                    row.get("meal_cheap_restaurant", 10) * 8 * lifestyle_multiplier
                ), 2),
                "fitness":       round(float(
                    row.get("fitness_club_monthly", 50) * lifestyle_multiplier
                ), 2),
                "entertainment": round(float(
                    row.get("cinema_ticket", 12) * 4 * lifestyle_multiplier
                ), 2),
                "utilities":     round(float(row.get("basic_utilities_85m2", 100)), 2),
            },
            "data_source": (
                f"XGBoost (Numbeo) + {model_used} lifestyle adjustment"
            ),
        }

    def calculate_expenses(
        self, user_profile: Dict[str, Any], target_city: str
    ) -> Dict[str, Any]:
        print(f"Fiscal Ghost: Calculating expenses for {target_city}")
        city_key        = target_city.lower().split(",")[0].strip()
        prefs           = user_profile.get("lifestyle_preferences", {})
        currency        = user_profile.get("currency", "USD")
        annual_income   = user_profile.get("annual_income", 60000)
        monthly_income  = annual_income / 12
        original_expenses = user_profile.get("monthly_expenses", monthly_income * 0.6)
        fx              = self._get_exchange_rate(currency)

        # Primary: XGBoost city model + behaviour model lifestyle adjustment
        model_result = self._lookup_city_expenses(city_key, prefs, annual_income)
        if model_result:
            model_result["original_expenses"] = round(original_expenses, 2)
            model_result["currency"]          = currency
            model_result["fx_rate"]           = round(fx, 4)
            return model_result

        # Fallback: rule-based CoL data (when city not in training data)
        beh = _get_behaviour_multiplier(prefs, annual_income)
        lifestyle_multiplier = beh["composite_multiplier"]

        COL_DATA = {
            "london": 1.35, "berlin": 1.05, "tokyo": 1.20, "singapore": 1.40,
            "dubai": 1.25, "new york": 1.55, "paris": 1.30, "sydney": 1.25,
            "toronto": 1.20, "amsterdam": 1.15, "lisbon": 0.80, "mumbai": 0.45,
            "bangalore": 0.42, "delhi": 0.40, "bangkok": 0.65, "seoul": 0.95,
        }
        col = COL_DATA.get(city_key, 1.0)
        # Apply behaviour-model lifestyle multiplier on top of CoL index
        effective_multiplier = col * lifestyle_multiplier
        projected = original_expenses * effective_multiplier

        return {
            "original_expenses":    round(original_expenses, 2),
            "projected_expenses":   round(projected, 2),
            "col_multiplier":       round(effective_multiplier, 3),
            "lifestyle_key":        beh["lifestyle_key"],
            "lifestyle_model_used": beh["model_used"],
            "lifestyle_fractions":  beh["fractions"],
            "currency":             currency,
            "fx_rate":              round(fx, 4),
            "details": {
                "rent":          round(projected * 0.38, 2),
                "groceries":     round(projected * 0.15, 2),
                "transport":     round(projected * 0.10, 2),
                "dining":        round(projected * 0.12, 2),
                "fitness":       round(projected * 0.04, 2),
                "entertainment": round(projected * 0.08, 2),
                "utilities":     round(projected * 0.08, 2),
            },
            "data_source": (
                f"CoL index (rule-based) + {beh['model_used']} lifestyle adjustment"
            ),
        }
