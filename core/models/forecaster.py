"""
Time-Series Trend Forecaster — Equinox Nexus v3.0
Defines the TrendForecaster class which runs Prophet time-series models
with a robust polynomial trend fallback if Prophet is not installed.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

try:
    from prophet import Prophet
    _has_prophet = True
except ImportError:
    _has_prophet = False


class TrendForecaster:
    """
    Predicts future values of a time-series (e.g. FX rates, inflation)
    using Prophet or polynomial regression fallbacks.
    """

    def __init__(self):
        self.has_prophet = _has_prophet

    def forecast(
        self,
        historical_dates: List[datetime],
        historical_values: List[float],
        steps_ahead: int,
        freq: str = "M"
    ) -> List[float]:
        """
        Forecast future steps.
        :param historical_dates: list of datetimes
        :param historical_values: list of float values
        :param steps_ahead: number of steps to project
        :param freq: frequency, e.g. "M" (monthly) or "D" (daily)
        """
        if not historical_dates or not historical_values:
            return [0.0] * steps_ahead

        # Clean inputs
        df = pd.DataFrame({
            "ds": pd.to_datetime(historical_dates),
            "y": [float(v) for v in historical_values]
        }).dropna().sort_values("ds").reset_index(drop=True)

        if len(df) < 5:
            # Not enough data for trend fitting; return last value
            last_val = df["y"].iloc[-1] if len(df) > 0 else 0.0
            return [last_val] * steps_ahead

        # ── 1. Prophet execution if available ─────────────────────────
        if self.has_prophet:
            try:
                # Silence prophet logging
                import logging
                logging.getLogger('prophet').setLevel(logging.ERROR)
                
                model = Prophet(
                    yearly_seasonality=True,
                    weekly_seasonality=False,
                    daily_seasonality=False,
                    interval_width=0.95
                )
                model.fit(df)
                
                future = model.make_future_dataframe(periods=steps_ahead, freq=freq, include_history=False)
                forecast = model.predict(future)
                return [round(float(v), 6) for v in forecast["yhat"].tolist()]
            except Exception as e:
                print(f"Forecaster: Prophet failed ({e}). Falling back to polynomial regression.")

        # ── 2. Polynomial trend fallback ─────────────────────────────
        # Fit a quadratic/linear trend over time indices
        x = np.arange(len(df))
        y = df["y"].values
        
        degree = 2 if len(df) >= 15 else 1
        coefficients = np.polyfit(x, y, degree)
        poly = np.poly1d(coefficients)
        
        future_x = np.arange(len(df), len(df) + steps_ahead)
        forecast_values = poly(future_x)
        
        # Bound positive values (like exchange rates or prices)
        if y.min() >= 0:
            forecast_values = np.maximum(0.0001, forecast_values)
            
        return [round(float(v), 6) for v in forecast_values]
