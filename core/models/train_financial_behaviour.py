"""
Financial Behaviour Synthetic Dataset Generator
Since no real financial behaviour dataset is available, this generates
realistic synthetic spending profiles for 10,000 users across income brackets.
Used by: Fiscal Ghost Agent
"""

import pandas as pd
import numpy as np
import pickle
import os
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

BASE = os.path.dirname(os.path.abspath(__file__))
SYNTH_OUT = os.path.join(BASE, "financial_behaviour_model.pkl")
CSV_OUT = os.path.join(BASE, "synthetic_financial_behaviour.csv")

np.random.seed(42)

INCOME_BRACKETS = [
    ("low",    15000,  35000),
    ("mid",    35000,  80000),
    ("high",   80000, 150000),
    ("ultra", 150000, 400000),
]

LIFESTYLE_PROFILES = {
    "frugal":    {"housing": 0.28, "food": 0.18, "transport": 0.08, "entertainment": 0.04, "savings": 0.30},
    "moderate":  {"housing": 0.32, "food": 0.15, "transport": 0.10, "entertainment": 0.08, "savings": 0.20},
    "comfort":   {"housing": 0.35, "food": 0.14, "transport": 0.12, "entertainment": 0.12, "savings": 0.12},
    "luxury":    {"housing": 0.40, "food": 0.12, "transport": 0.15, "entertainment": 0.18, "savings": 0.05},
}

def generate_user(income_bracket, lifestyle):
    label, low, high = income_bracket
    annual_income = np.random.uniform(low, high)
    monthly_income = annual_income / 12
    profile = LIFESTYLE_PROFILES[lifestyle]

    noise = lambda: np.random.normal(1.0, 0.08)

    housing       = monthly_income * profile["housing"] * noise()
    food_groceries= monthly_income * profile["food"] * 0.6 * noise()
    food_dining   = monthly_income * profile["food"] * 0.4 * noise()
    transport     = monthly_income * profile["transport"] * noise()
    entertainment = monthly_income * profile["entertainment"] * noise()
    savings       = monthly_income * profile["savings"] * noise()
    healthcare    = monthly_income * np.random.uniform(0.02, 0.06) * noise()
    subscriptions = np.random.uniform(20, 120)
    clothing      = monthly_income * np.random.uniform(0.02, 0.06) * noise()
    utilities     = np.random.uniform(60, 250) * noise()
    fitness       = np.random.choice([0, 30, 60, 100, 150], p=[0.2, 0.2, 0.3, 0.2, 0.1])
    coffee        = np.random.uniform(0, 80) * noise()

    total_expenses = housing + food_groceries + food_dining + transport + entertainment + healthcare + subscriptions + clothing + utilities + fitness + coffee

    return {
        "annual_income": round(annual_income, 2),
        "monthly_income": round(monthly_income, 2),
        "income_bracket": label,
        "lifestyle": lifestyle,
        "housing": round(max(0, housing), 2),
        "food_groceries": round(max(0, food_groceries), 2),
        "food_dining": round(max(0, food_dining), 2),
        "transport": round(max(0, transport), 2),
        "entertainment": round(max(0, entertainment), 2),
        "healthcare": round(max(0, healthcare), 2),
        "subscriptions": round(subscriptions, 2),
        "clothing": round(max(0, clothing), 2),
        "utilities": round(max(0, utilities), 2),
        "fitness": round(fitness, 2),
        "coffee": round(max(0, coffee), 2),
        "total_monthly_expenses": round(total_expenses, 2),
        "monthly_savings": round(max(0, monthly_income - total_expenses), 2),
        "savings_rate": round(max(0, (monthly_income - total_expenses) / monthly_income), 4),
    }

def main():
    print("Generating synthetic financial behaviour dataset...")
    records = []
    n_per_combo = 625  # 4 brackets × 4 lifestyles × 625 = 10,000

    for bracket in INCOME_BRACKETS:
        for lifestyle in LIFESTYLE_PROFILES:
            for _ in range(n_per_combo):
                records.append(generate_user(bracket, lifestyle))

    df = pd.DataFrame(records)
    print(f"Generated {len(df)} synthetic user profiles")
    print(df.groupby(["income_bracket", "lifestyle"])["total_monthly_expenses"].mean().round(0))

    # Save CSV
    df.to_csv(CSV_OUT, index=False)
    print(f"Synthetic dataset saved to {CSV_OUT}")

    # Train XGBoost to predict total_monthly_expenses from income + lifestyle features
    feature_cols = ["annual_income", "monthly_income", "housing", "food_groceries",
                    "food_dining", "transport", "entertainment", "healthcare",
                    "subscriptions", "clothing", "utilities", "fitness", "coffee"]

    X = df[feature_cols]
    y = df["total_monthly_expenses"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBRegressor(n_estimators=200, max_depth=5, learning_rate=0.05,
                         subsample=0.8, random_state=42, verbosity=0)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    print(f"Behaviour model MAE: ${mean_absolute_error(y_test, preds):.2f} | R2: {r2_score(y_test, preds):.4f}")

    # Spending profile averages by bracket for quick lookup
    spending_profiles = df.groupby("income_bracket")[feature_cols + ["total_monthly_expenses", "savings_rate"]].mean().round(2).to_dict("index")

    with open(SYNTH_OUT, "wb") as f:
        pickle.dump({
            "model": model,
            "feature_cols": feature_cols,
            "spending_profiles": spending_profiles,
            "lifestyle_profiles": LIFESTYLE_PROFILES
        }, f)

    print(f"Financial behaviour model saved to {SYNTH_OUT}")

if __name__ == "__main__":
    main()
