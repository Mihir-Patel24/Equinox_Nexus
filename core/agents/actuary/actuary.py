from typing import Dict, Any
import requests

# Real AQI data per city using Open-Meteo Air Quality API (completely free, no key needed)
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

# Fallback city risk data when API is unavailable
CITY_RISK_DATA = {
    "london": {"safety_score": 72, "healthcare_score": 88, "aqi": 35},
    "berlin": {"safety_score": 78, "healthcare_score": 90, "aqi": 28},
    "tokyo": {"safety_score": 92, "healthcare_score": 94, "aqi": 22},
    "singapore": {"safety_score": 95, "healthcare_score": 92, "aqi": 40},
    "dubai": {"safety_score": 85, "healthcare_score": 80, "aqi": 55},
    "new york": {"safety_score": 65, "healthcare_score": 85, "aqi": 42},
    "paris": {"safety_score": 68, "healthcare_score": 91, "aqi": 38},
    "sydney": {"safety_score": 88, "healthcare_score": 92, "aqi": 18},
    "toronto": {"safety_score": 85, "healthcare_score": 90, "aqi": 20},
    "mumbai": {"safety_score": 55, "healthcare_score": 65, "aqi": 145},
    "delhi": {"safety_score": 48, "healthcare_score": 60, "aqi": 180},
    "bangalore": {"safety_score": 60, "healthcare_score": 70, "aqi": 88},
    "bangkok": {"safety_score": 62, "healthcare_score": 72, "aqi": 95},
}

class ActuaryAgent:
    def __init__(self):
        self.aqi_base_url = "https://air-quality-api.open-meteo.com/v1/air-quality"

    def _get_coordinates(self, city: str):
        return CITY_COORDINATES.get(city.lower().split(",")[0].strip())

    def _fetch_live_aqi(self, lat: float, lon: float) -> int:
        try:
            resp = requests.get(
                self.aqi_base_url,
                params={"latitude": lat, "longitude": lon, "current": "pm2_5,us_aqi"},
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                return int(data.get("current", {}).get("us_aqi", 50))
        except Exception:
            pass
        return None

    def analyze_risk(self, target_city: str) -> Dict[str, Any]:
        print(f"Actuary: Analyzing risks for {target_city}")
        city_key = target_city.lower().split(",")[0].strip()
        fallback = CITY_RISK_DATA.get(city_key, {"safety_score": 65, "healthcare_score": 70, "aqi": 75})

        # Try live AQI first
        aqi = fallback["aqi"]
        coords = self._get_coordinates(target_city)
        if coords:
            live_aqi = self._fetch_live_aqi(*coords)
            if live_aqi is not None:
                aqi = live_aqi

        safety = fallback["safety_score"]
        healthcare = fallback["healthcare_score"]

        # Risk rating logic
        if aqi <= 50 and safety >= 80:
            rating = "Low"
        elif aqi <= 100 and safety >= 60:
            rating = "Medium"
        else:
            rating = "High"

        return {
            "air_quality_index": aqi,
            "safety_score": safety,
            "healthcare_score": healthcare,
            "healthcare_wait_time_hours": max(1, int((100 - healthcare) / 10)),
            "overall_risk_rating": rating,
            "data_source": "Open-Meteo AQI (live)" if coords else "Curated dataset",
            "notes": (
                f"AQI {aqi} — {'Good' if aqi <= 50 else 'Moderate' if aqi <= 100 else 'Unhealthy'}. "
                f"Safety score {safety}/100."
            )
        }
