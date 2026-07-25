"""
Exchange Rate Trend Forecaster Training — Equinox Nexus v3.0
Loads historical ECB daily exchange rates, converts them to USD base,
and uses TrendForecaster to project currency movements 12 months ahead.
Saves model forecasts to core/models/fx_forecast.pkl.
"""

import pandas as pd
import numpy as np
import pickle
import os
import sys
from datetime import datetime

# Setup paths
BASE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE, "../../Dataset/Exchange Rates/eurofxref-hist.csv")
MODEL_OUT = os.path.join(BASE, "fx_forecast.pkl")

# Import TrendForecaster
sys.path.insert(0, os.path.join(BASE, ".."))
from models.forecaster import TrendForecaster


def train_forecasts():
    print("Loading exchange rate dataset...")
    if not os.path.exists(DATA_PATH):
        print(f"Error: Dataset not found at {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)
    # Strip column names
    df.columns = [c.strip() for c in df.columns]
    
    # Parse dates
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values("Date").reset_index(drop=True)

    # We need to forecast key target currencies: USD, JPY, GBP, CHF, INR, SGD, CAD, AUD
    # The source dataset is EUR-based (e.g. USD column is number of USD per 1 EUR).
    # To get USD-based rates (e.g. number of JPY per 1 USD):
    # JPY_per_USD = JPY_per_EUR / USD_per_EUR
    target_currencies = ["JPY", "GBP", "CHF", "INR", "SGD", "CAD", "AUD", "TRY", "BRL"]
    
    # Clean N/A strings to NaN and forward-fill
    for col in ["USD"] + target_currencies:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col].astype(str).str.replace("N/A", ""), errors="coerce")
            df[col] = df[col].ffill().bfill()

    print(f"Dataset covers dates from {df['Date'].min().strftime('%Y-%m-%d')} to {df['Date'].max().strftime('%Y-%m-%d')}")
    
    # Downsample to weekly to speed up fitting while keeping seasonality
    df_weekly = df.resample("W", on="Date").mean().reset_index()

    forecaster = TrendForecaster()
    forecasts = {}

    print(f"Running forecasts using TrendForecaster (Prophet enabled: {forecaster.has_prophet})...")
    
    # We want to project 12 months ahead (52 weekly steps)
    steps_ahead = 52
    
    for currency in target_currencies:
        if currency not in df_weekly.columns:
            continue
            
        print(f"Forecasting JPY_per_USD rates for {currency}...")
        # Calculate USD-based historical rate
        historical_rates = (df_weekly[currency] / df_weekly["USD"]).values.tolist()
        dates = df_weekly["Date"].tolist()
        
        # Train and forecast
        forecasted_values = forecaster.forecast(
            historical_dates=dates,
            historical_values=historical_rates,
            steps_ahead=steps_ahead,
            freq="W"
        )
        
        forecasts[currency] = {
            "last_value": historical_rates[-1],
            "forecasted_trend": forecasted_values,
            "min_forecast": min(forecasted_values),
            "max_forecast": max(forecasted_values),
            "volatility": float(np.std(historical_rates) / np.mean(historical_rates))
        }
        print(f"   {currency}/USD: Last={historical_rates[-1]:.4f} | Peak Forecast={max(forecasted_values):.4f}")

    # Save to pickle file
    with open(MODEL_OUT, "wb") as f:
        pickle.dump({
            "forecasts": forecasts,
            "updated_at": datetime.now().isoformat(),
            "forecaster_used": "Prophet" if forecaster.has_prophet else "Polynomial Trend Extrapolator"
        }, f)
        
    print(f"Exchange rate forecasts saved successfully to {MODEL_OUT}")


if __name__ == "__main__":
    train_forecasts()
