from typing import Dict, Any
import httpx
import pickle
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../models/quality_model.pkl")

# Load quality model at startup
_qol_lookup = {}
try:
    with open(MODEL_PATH, "rb") as f:
        _qol_lookup = pickle.load(f)
except FileNotFoundError:
    pass  # fallback to API-only mode

CITY_COORDINATES = {
    "london": (51.5074, -0.1278), "berlin": (52.5200, 13.4050),
    "tokyo": (35.6762, 139.6503), "singapore": (1.3521, 103.8198),
    "dubai": (25.2048, 55.2708), "new york": (40.7128, -74.0060),
    "paris": (48.8566, 2.3522), "sydney": (-33.8688, 151.2093),
    "toronto": (43.6532, -79.3832), "amsterdam": (52.3676, 4.9041),
    "lisbon": (38.7223, -9.1393), "mumbai": (19.0760, 72.8777),
    "bangalore": (12.9716, 77.5946), "delhi": (28.6139, 77.2090),
    "bangkok": (13.7563, 100.5018), "seoul": (37.5665, 126.9780),
    "zurich": (47.3769, 8.5417), "vienna": (48.2082, 16.3738),
    "stockholm": (59.3293, 18.0686), "oslo": (59.9139, 10.7522),
}

class ActuaryAgent:
    def __init__(self):
        self.aqi_base_url = "https://air-quality-api.open-meteo.com/v1/air-quality"

    def _get_coordinates(self, city: str):
        return CITY_COORDINATES.get(city.lower().split(",")[0].strip())

    def _fetch_live_aqi(self, lat: float, lon: float) -> int:
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(
                    self.aqi_base_url,
                    params={"latitude": lat, "longitude": lon, "current": "pm2_5,us_aqi"},
                )
                if resp.status_code == 200:
                    return int(resp.json().get("current", {}).get("us_aqi", 50))
        except Exception:
            pass
        return None

    def analyze_risk(self, target_city: str) -> Dict[str, Any]:
        print(f"Actuary: Analyzing risks for {target_city}")
        city_key = target_city.lower().split(",")[0].strip()

        # Use trained quality model if available
        if city_key in _qol_lookup:
            data = _qol_lookup[city_key]
            aqi = data["aqi"]
            # Try to get live AQI to override
            coords = self._get_coordinates(target_city)
            if coords:
                live_aqi = self._fetch_live_aqi(*coords)
                if live_aqi is not None:
                    aqi = live_aqi
            return {
                "air_quality_index": aqi,
                "safety_score": data["safety_score"],
                "healthcare_score": data["healthcare_score"],
                "happiness_index": data["happiness_index"],
                "composite_score": data["composite_score"],
                "healthcare_wait_time_hours": max(1, int((100 - data["healthcare_score"]) / 10)),
                "overall_risk_rating": data["risk_rating"],
                "data_source": "Trained QoL model + Open-Meteo AQI",
                "notes": f"AQI {aqi} — {'Good' if aqi <= 50 else 'Moderate' if aqi <= 100 else 'Unhealthy'}. Safety {data['safety_score']}/100."
            }

        # Fallback: API only
        aqi = 75
        coords = self._get_coordinates(target_city)
        if coords:
            live_aqi = self._fetch_live_aqi(*coords)
            if live_aqi is not None:
                aqi = live_aqi
        rating = "Low" if aqi <= 50 else "Medium" if aqi <= 100 else "High"
        return {
            "air_quality_index": aqi,
            "safety_score": 65,
            "healthcare_score": 70,
            "happiness_index": 65,
            "composite_score": 65.0,
            "healthcare_wait_time_hours": 8,
            "overall_risk_rating": rating,
            "data_source": "Open-Meteo AQI (live)",
            "notes": f"AQI {aqi} — city not in trained model, using live AQI only."
        }
