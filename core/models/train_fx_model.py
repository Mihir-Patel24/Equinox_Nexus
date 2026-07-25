"""
Exchange Rate Volatility Model
Computes currency volatility features from eurofxref-hist.csv
Used by: Actuary (Risk) Agent, Chronos Agent
"""

import pandas as pd
import numpy as np
import pickle
import os

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE, "../../Dataset/Exchange Rates/eurofxref-hist.csv")
MODEL_OUT = os.path.join(BASE, "fx_volatility.pkl")

def compute_volatility_features(df, currency):
    """Compute 30d/90d/365d volatility + trend for a currency vs EUR."""
    series = pd.to_numeric(df[currency], errors="coerce").dropna()
    if len(series) < 30:
        return None

    returns = series.pct_change().dropna()

    vol_30d  = returns.tail(30).std() * np.sqrt(252)
    vol_90d  = returns.tail(90).std() * np.sqrt(252) if len(returns) >= 90 else vol_30d
    vol_365d = returns.tail(365).std() * np.sqrt(252) if len(returns) >= 365 else vol_90d

    trend_30d = (series.iloc[-1] / series.iloc[-30] - 1) if len(series) >= 30 else 0
    trend_90d = (series.iloc[-1] / series.iloc[-90] - 1) if len(series) >= 90 else 0

    current_rate = series.iloc[-1]
    mean_1yr = series.tail(252).mean() if len(series) >= 252 else series.mean()
    deviation_from_mean = (current_rate - mean_1yr) / mean_1yr

    return {
        "currency": currency,
        "current_rate_vs_eur": round(current_rate, 6),
        "vol_30d_annualized": round(vol_30d, 4),
        "vol_90d_annualized": round(vol_90d, 4),
        "vol_365d_annualized": round(vol_365d, 4),
        "trend_30d": round(trend_30d, 4),
        "trend_90d": round(trend_90d, 4),
        "deviation_from_1yr_mean": round(deviation_from_mean, 4),
        "risk_level": "High" if vol_30d > 0.15 else "Medium" if vol_30d > 0.07 else "Low"
    }

def add_synthetic_currencies(results):
    """Add synthetic data for currencies not in ECB dataset (INR, PKR, BDT, etc.)"""
    synthetic = [
        {"currency": "INR",  "current_rate_vs_eur": 90.5,   "vol_30d_annualized": 0.065, "vol_90d_annualized": 0.072, "vol_365d_annualized": 0.078, "trend_30d": -0.012, "trend_90d": -0.025, "deviation_from_1yr_mean": -0.018, "risk_level": "Low"},
        {"currency": "AED",  "current_rate_vs_eur": 4.02,   "vol_30d_annualized": 0.030, "vol_90d_annualized": 0.032, "vol_365d_annualized": 0.035, "trend_30d":  0.005, "trend_90d":  0.008, "deviation_from_1yr_mean":  0.003, "risk_level": "Low"},
        {"currency": "SAR",  "current_rate_vs_eur": 4.01,   "vol_30d_annualized": 0.031, "vol_90d_annualized": 0.033, "vol_365d_annualized": 0.036, "trend_30d":  0.004, "trend_90d":  0.007, "deviation_from_1yr_mean":  0.002, "risk_level": "Low"},
        {"currency": "SGD",  "current_rate_vs_eur": 1.49,   "vol_30d_annualized": 0.055, "vol_90d_annualized": 0.058, "vol_365d_annualized": 0.062, "trend_30d":  0.008, "trend_90d":  0.015, "deviation_from_1yr_mean":  0.010, "risk_level": "Low"},
        {"currency": "PKR",  "current_rate_vs_eur": 305.0,  "vol_30d_annualized": 0.220, "vol_90d_annualized": 0.250, "vol_365d_annualized": 0.280, "trend_30d": -0.050, "trend_90d": -0.120, "deviation_from_1yr_mean": -0.150, "risk_level": "High"},
        {"currency": "BDT",  "current_rate_vs_eur": 120.0,  "vol_30d_annualized": 0.090, "vol_90d_annualized": 0.100, "vol_365d_annualized": 0.110, "trend_30d": -0.020, "trend_90d": -0.040, "deviation_from_1yr_mean": -0.030, "risk_level": "Medium"},
        {"currency": "VND",  "current_rate_vs_eur": 27000.0,"vol_30d_annualized": 0.045, "vol_90d_annualized": 0.050, "vol_365d_annualized": 0.055, "trend_30d": -0.005, "trend_90d": -0.010, "deviation_from_1yr_mean": -0.008, "risk_level": "Low"},
        {"currency": "NGN",  "current_rate_vs_eur": 1800.0, "vol_30d_annualized": 0.350, "vol_90d_annualized": 0.400, "vol_365d_annualized": 0.450, "trend_30d": -0.080, "trend_90d": -0.200, "deviation_from_1yr_mean": -0.250, "risk_level": "High"},
        {"currency": "KES",  "current_rate_vs_eur": 145.0,  "vol_30d_annualized": 0.120, "vol_90d_annualized": 0.140, "vol_365d_annualized": 0.160, "trend_30d": -0.030, "trend_90d": -0.060, "deviation_from_1yr_mean": -0.050, "risk_level": "High"},
        {"currency": "EGP",  "current_rate_vs_eur": 53.0,   "vol_30d_annualized": 0.180, "vol_90d_annualized": 0.200, "vol_365d_annualized": 0.220, "trend_30d": -0.040, "trend_90d": -0.090, "deviation_from_1yr_mean": -0.100, "risk_level": "High"},
    ]
    existing = {r["currency"] for r in results}
    for s in synthetic:
        if s["currency"] not in existing:
            results.append(s)
    return results

def main():
    print("Loading exchange rate history...")
    df = pd.read_csv(DATA_PATH)
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df = df.sort_values("Date").reset_index(drop=True)

    currencies = [c for c in df.columns if c != "Date"]
    print(f"Found {len(currencies)} currencies, {len(df)} trading days")

    results = []
    for cur in currencies:
        feat = compute_volatility_features(df, cur)
        if feat:
            results.append(feat)

    results = add_synthetic_currencies(results)

    fx_data = {r["currency"]: r for r in results}
    print(f"Computed volatility for {len(fx_data)} currencies")

    with open(MODEL_OUT, "wb") as f:
        pickle.dump(fx_data, f)

    print(f"FX volatility data saved to {MODEL_OUT}")

    # Print sample
    for cur in ["USD", "INR", "JPY", "NGN"]:
        if cur in fx_data:
            d = fx_data[cur]
            print(f"  {cur}: vol_30d={d['vol_30d_annualized']:.3f} risk={d['risk_level']}")

if __name__ == "__main__":
    main()
