"""
Fiscal Ghost Expense Model
Trains XGBoost to predict monthly total expenses per city
Dataset: cost-of-living_v2.csv (55 price features per city)
"""

import pandas as pd
import numpy as np
import pickle
import os
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE, "../../Dataset/Cost Of Living/cost-of-living_v2.csv")
MODEL_OUT = os.path.join(BASE, "expense_model.pkl")
ENCODER_OUT = os.path.join(BASE, "city_encoder.pkl")

# Column mapping: x1-x55 → meaningful names based on Numbeo ordering
COL_NAMES = {
    "x1": "meal_cheap_restaurant", "x2": "meal_midrange_restaurant",
    "x3": "mcmeal", "x4": "domestic_beer_restaurant", "x5": "imported_beer_restaurant",
    "x6": "cappuccino", "x7": "coke_pepsi", "x8": "water_restaurant",
    "x9": "milk_1l", "x10": "bread_500g", "x11": "rice_1kg", "x12": "eggs_12",
    "x13": "local_cheese_1kg", "x14": "chicken_1kg", "x15": "beef_1kg",
    "x16": "apples_1kg", "x17": "banana_1kg", "x18": "oranges_1kg",
    "x19": "tomato_1kg", "x20": "potato_1kg", "x21": "onion_1kg",
    "x22": "lettuce", "x23": "water_1_5l", "x24": "wine_bottle",
    "x25": "domestic_beer_market", "x26": "imported_beer_market",
    "x27": "cigarettes_20", "x28": "one_way_ticket", "x29": "monthly_pass",
    "x30": "taxi_start", "x31": "taxi_1km", "x32": "taxi_1hr_wait",
    "x33": "gasoline_1l", "x34": "volkswagen_golf", "x35": "toyota_corolla",
    "x36": "basic_utilities_85m2", "x37": "mobile_plan",
    "x38": "internet_60mbps", "x39": "fitness_club_monthly",
    "x40": "tennis_court_1hr", "x41": "cinema_ticket",
    "x42": "preschool_monthly", "x43": "intl_primary_school_yearly",
    "x44": "jeans_levis", "x45": "summer_dress", "x46": "nike_shoes",
    "x47": "mens_leather_shoes", "x48": "rent_1br_city_center",
    "x49": "rent_1br_outside_center", "x50": "rent_3br_city_center",
    "x51": "rent_3br_outside_center", "x52": "price_per_sqm_city_center",
    "x53": "price_per_sqm_outside", "x54": "avg_net_salary",
    "x55": "mortgage_rate"
}

def build_monthly_expense(df):
    """Construct a realistic monthly expense total from individual price columns."""
    e = pd.DataFrame()
    e["rent"]          = df["rent_1br_outside_center"].fillna(df["rent_1br_city_center"] * 0.75)
    e["groceries"]     = (df["milk_1l"] * 4 + df["bread_500g"] * 8 + df["rice_1kg"] * 2 +
                          df["eggs_12"] * 2 + df["chicken_1kg"] * 3 + df["apples_1kg"] * 2 +
                          df["tomato_1kg"] * 2 + df["potato_1kg"] * 2)
    e["dining"]        = df["meal_cheap_restaurant"] * 8 + df["meal_midrange_restaurant"] * 2
    e["transport"]     = df["monthly_pass"].fillna(df["one_way_ticket"] * 40)
    e["utilities"]     = df["basic_utilities_85m2"].fillna(100)
    e["internet"]      = df["internet_60mbps"].fillna(30)
    e["entertainment"] = df["cinema_ticket"] * 4 + df["domestic_beer_restaurant"] * 8
    e["fitness"]       = df["fitness_club_monthly"].fillna(40)
    return e.sum(axis=1)

def main():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    df = df.rename(columns=COL_NAMES)
    df = df.dropna(subset=["city", "country"])

    # Build target
    df["monthly_expense_usd"] = build_monthly_expense(df)
    df = df[df["monthly_expense_usd"] > 200]  # remove bad rows

    print(f"Dataset: {len(df)} cities after cleaning")

    # Features: all numeric price columns
    feature_cols = list(COL_NAMES.values())
    feature_cols = [c for c in feature_cols if c in df.columns and c not in ["avg_net_salary", "mortgage_rate"]]

    X = df[feature_cols].fillna(df[feature_cols].median())
    y = df["monthly_expense_usd"]

    # Encode city + country for lookup later
    le_city = LabelEncoder()
    df["city_encoded"] = le_city.fit_transform(df["city"].str.lower().str.strip())

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training XGBoost expense model...")
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"MAE: ${mae:.2f} | R2: {r2:.4f}")

    # Save model + city lookup table
    city_lookup = df[["city", "country"] + feature_cols + ["monthly_expense_usd"]].copy()
    city_lookup["city_key"] = df["city"].str.lower().str.strip()

    with open(MODEL_OUT, "wb") as f:
        pickle.dump({"model": model, "feature_cols": feature_cols, "city_lookup": city_lookup}, f)

    print(f"Model saved to {MODEL_OUT}")

if __name__ == "__main__":
    main()
