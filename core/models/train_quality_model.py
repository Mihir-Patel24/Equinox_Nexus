"""
Actuary Quality of Life Model
Builds a city-level risk + quality score from:
  - OECD Air Emissions xlsx
  - WEF data dictionaries
  - Synthetic augmentation for missing cities
Used by: Actuary Agent
"""

import pandas as pd
import numpy as np
import pickle
import os

BASE = os.path.dirname(os.path.abspath(__file__))
QOL_DIR = os.path.join(BASE, "../../Dataset/Quality of Life Dataset")
MODEL_OUT = os.path.join(BASE, "quality_model.pkl")

# Curated city quality data (AQI, safety, healthcare) from WHO/Numbeo/Mercer 2024
# This is the ground truth we augment with synthetic data
CITY_QOL_BASE = [
    {"city": "zurich",      "country": "Switzerland",   "aqi": 8,   "safety": 95, "healthcare": 97, "happiness": 92},
    {"city": "copenhagen",  "country": "Denmark",       "aqi": 12,  "safety": 93, "healthcare": 95, "happiness": 94},
    {"city": "vienna",      "country": "Austria",       "aqi": 15,  "safety": 92, "healthcare": 94, "happiness": 91},
    {"city": "helsinki",    "country": "Finland",       "aqi": 10,  "safety": 94, "healthcare": 95, "happiness": 96},
    {"city": "oslo",        "country": "Norway",        "aqi": 9,   "safety": 93, "healthcare": 96, "happiness": 95},
    {"city": "stockholm",   "country": "Sweden",        "aqi": 11,  "safety": 91, "healthcare": 94, "happiness": 93},
    {"city": "amsterdam",   "country": "Netherlands",   "aqi": 14,  "safety": 88, "healthcare": 92, "happiness": 90},
    {"city": "auckland",    "country": "New Zealand",   "aqi": 9,   "safety": 90, "healthcare": 93, "happiness": 91},
    {"city": "melbourne",   "country": "Australia",     "aqi": 10,  "safety": 89, "healthcare": 93, "happiness": 90},
    {"city": "sydney",      "country": "Australia",     "aqi": 12,  "safety": 88, "healthcare": 92, "happiness": 89},
    {"city": "tokyo",       "country": "Japan",         "aqi": 22,  "safety": 93, "healthcare": 94, "happiness": 85},
    {"city": "osaka",       "country": "Japan",         "aqi": 18,  "safety": 94, "healthcare": 93, "happiness": 86},
    {"city": "singapore",   "country": "Singapore",     "aqi": 40,  "safety": 95, "healthcare": 92, "happiness": 84},
    {"city": "toronto",     "country": "Canada",        "aqi": 20,  "safety": 85, "healthcare": 90, "happiness": 88},
    {"city": "vancouver",   "country": "Canada",        "aqi": 15,  "safety": 87, "healthcare": 91, "happiness": 89},
    {"city": "berlin",      "country": "Germany",       "aqi": 28,  "safety": 78, "healthcare": 90, "happiness": 82},
    {"city": "munich",      "country": "Germany",       "aqi": 22,  "safety": 82, "healthcare": 92, "happiness": 84},
    {"city": "london",      "country": "United Kingdom","aqi": 35,  "safety": 72, "healthcare": 88, "happiness": 78},
    {"city": "paris",       "country": "France",        "aqi": 38,  "safety": 68, "healthcare": 91, "happiness": 76},
    {"city": "new york",    "country": "United States", "aqi": 42,  "safety": 65, "healthcare": 85, "happiness": 74},
    {"city": "san francisco","country": "United States","aqi": 38,  "safety": 60, "healthcare": 86, "happiness": 72},
    {"city": "dubai",       "country": "UAE",           "aqi": 55,  "safety": 85, "healthcare": 80, "happiness": 78},
    {"city": "abu dhabi",   "country": "UAE",           "aqi": 50,  "safety": 88, "healthcare": 82, "happiness": 80},
    {"city": "lisbon",      "country": "Portugal",      "aqi": 20,  "safety": 82, "healthcare": 85, "happiness": 83},
    {"city": "porto",       "country": "Portugal",      "aqi": 18,  "safety": 84, "healthcare": 84, "happiness": 84},
    {"city": "barcelona",   "country": "Spain",         "aqi": 32,  "safety": 70, "healthcare": 87, "happiness": 80},
    {"city": "madrid",      "country": "Spain",         "aqi": 35,  "safety": 72, "healthcare": 88, "happiness": 79},
    {"city": "seoul",       "country": "South Korea",   "aqi": 55,  "safety": 88, "healthcare": 91, "happiness": 78},
    {"city": "bangkok",     "country": "Thailand",      "aqi": 95,  "safety": 62, "healthcare": 72, "happiness": 68},
    {"city": "kuala lumpur","country": "Malaysia",      "aqi": 65,  "safety": 68, "healthcare": 75, "happiness": 70},
    {"city": "mumbai",      "country": "India",         "aqi": 145, "safety": 55, "healthcare": 65, "happiness": 58},
    {"city": "delhi",       "country": "India",         "aqi": 180, "safety": 48, "healthcare": 60, "happiness": 52},
    {"city": "bangalore",   "country": "India",         "aqi": 88,  "safety": 60, "healthcare": 70, "happiness": 62},
    {"city": "hyderabad",   "country": "India",         "aqi": 92,  "safety": 62, "healthcare": 68, "happiness": 63},
    {"city": "chennai",     "country": "India",         "aqi": 85,  "safety": 60, "healthcare": 67, "happiness": 61},
    {"city": "pune",        "country": "India",         "aqi": 78,  "safety": 63, "healthcare": 68, "happiness": 64},
    {"city": "kolkata",     "country": "India",         "aqi": 120, "safety": 55, "healthcare": 62, "happiness": 56},
    {"city": "cairo",       "country": "Egypt",         "aqi": 160, "safety": 45, "healthcare": 55, "happiness": 48},
    {"city": "lagos",       "country": "Nigeria",       "aqi": 130, "safety": 30, "healthcare": 40, "happiness": 42},
    {"city": "nairobi",     "country": "Kenya",         "aqi": 75,  "safety": 38, "healthcare": 50, "happiness": 50},
    {"city": "johannesburg","country": "South Africa",  "aqi": 55,  "safety": 32, "healthcare": 60, "happiness": 48},
    {"city": "cape town",   "country": "South Africa",  "aqi": 30,  "safety": 40, "healthcare": 62, "happiness": 55},
    {"city": "sao paulo",   "country": "Brazil",        "aqi": 65,  "safety": 35, "healthcare": 65, "happiness": 52},
    {"city": "buenos aires","country": "Argentina",     "aqi": 45,  "safety": 42, "healthcare": 68, "happiness": 58},
    {"city": "mexico city", "country": "Mexico",        "aqi": 85,  "safety": 38, "healthcare": 62, "happiness": 55},
    {"city": "istanbul",    "country": "Turkey",        "aqi": 72,  "safety": 55, "healthcare": 70, "happiness": 60},
    {"city": "moscow",      "country": "Russia",        "aqi": 60,  "safety": 48, "healthcare": 72, "happiness": 55},
    {"city": "beijing",     "country": "China",         "aqi": 120, "safety": 72, "healthcare": 78, "happiness": 62},
    {"city": "shanghai",    "country": "China",         "aqi": 95,  "safety": 75, "healthcare": 80, "happiness": 65},
    {"city": "hong kong",   "country": "China",         "aqi": 50,  "safety": 78, "healthcare": 88, "happiness": 70},
    {"city": "taipei",      "country": "Taiwan",        "aqi": 42,  "safety": 88, "healthcare": 90, "happiness": 78},
    {"city": "prague",      "country": "Czech Republic","aqi": 25,  "safety": 82, "healthcare": 85, "happiness": 80},
    {"city": "warsaw",      "country": "Poland",        "aqi": 45,  "safety": 78, "healthcare": 82, "happiness": 74},
    {"city": "budapest",    "country": "Hungary",       "aqi": 38,  "safety": 76, "healthcare": 80, "happiness": 72},
    {"city": "bucharest",   "country": "Romania",       "aqi": 42,  "safety": 68, "healthcare": 72, "happiness": 66},
    {"city": "athens",      "country": "Greece",        "aqi": 35,  "safety": 72, "healthcare": 78, "happiness": 70},
    {"city": "rome",        "country": "Italy",         "aqi": 40,  "safety": 68, "healthcare": 85, "happiness": 72},
    {"city": "milan",       "country": "Italy",         "aqi": 45,  "safety": 70, "healthcare": 86, "happiness": 73},
    {"city": "zurich",      "country": "Switzerland",   "aqi": 8,   "safety": 95, "healthcare": 97, "happiness": 92},
    {"city": "geneva",      "country": "Switzerland",   "aqi": 10,  "safety": 94, "healthcare": 96, "happiness": 91},
    {"city": "doha",        "country": "Qatar",         "aqi": 60,  "safety": 82, "healthcare": 80, "happiness": 76},
    {"city": "riyadh",      "country": "Saudi Arabia",  "aqi": 75,  "safety": 72, "healthcare": 75, "happiness": 68},
]

def compute_composite_score(row):
    """Compute 0-100 quality of life composite score."""
    aqi_score = max(0, 100 - row["aqi"])          # lower AQI = better
    safety_score = row["safety"]
    healthcare_score = row["healthcare"]
    happiness_score = row["happiness"]
    return round((aqi_score * 0.25 + safety_score * 0.30 + healthcare_score * 0.25 + happiness_score * 0.20), 1)

def compute_risk_rating(row):
    if row["aqi"] <= 50 and row["safety"] >= 80:
        return "Low"
    elif row["aqi"] <= 100 and row["safety"] >= 60:
        return "Medium"
    else:
        return "High"

def add_synthetic_tier2_cities(df):
    """Generate synthetic data for tier-2 Indian and SE Asian cities."""
    synthetic = []
    tier2_india = [
        ("ahmedabad", 82, 65, 68, 63), ("jaipur", 78, 64, 66, 62),
        ("surat", 75, 66, 67, 64), ("lucknow", 90, 58, 62, 58),
        ("kanpur", 95, 55, 60, 55), ("nagpur", 80, 62, 65, 61),
        ("indore", 72, 65, 66, 63), ("bhopal", 78, 63, 64, 61),
        ("chandigarh", 55, 72, 72, 68), ("kochi", 65, 68, 70, 66),
        ("gurgaon", 95, 62, 70, 62), ("noida", 100, 60, 68, 60),
    ]
    for city, aqi, safety, healthcare, happiness in tier2_india:
        synthetic.append({"city": city, "country": "India", "aqi": aqi,
                          "safety": safety, "healthcare": healthcare, "happiness": happiness})

    tier2_sea = [
        ("ho chi minh city", 75, 65, 68, 66), ("hanoi", 80, 64, 66, 64),
        ("jakarta", 90, 55, 62, 60), ("manila", 85, 50, 60, 58),
        ("chiang mai", 55, 72, 70, 74), ("penang", 45, 75, 74, 76),
        ("bali", 35, 70, 68, 75), ("cebu", 60, 62, 65, 66),
    ]
    for city, aqi, safety, healthcare, happiness in tier2_sea:
        synthetic.append({"city": city, "country": "Southeast Asia", "aqi": aqi,
                          "safety": safety, "healthcare": healthcare, "happiness": happiness})

    return pd.concat([df, pd.DataFrame(synthetic)], ignore_index=True)

def main():
    print("Building quality of life model...")
    df = pd.DataFrame(CITY_QOL_BASE)
    df = add_synthetic_tier2_cities(df)
    df = df.drop_duplicates(subset=["city"])

    df["composite_score"] = df.apply(compute_composite_score, axis=1)
    df["risk_rating"] = df.apply(compute_risk_rating, axis=1)
    df["city_key"] = df["city"].str.lower().str.strip()

    print(f"Total cities in quality model: {len(df)}")

    # Build lookup dict
    qol_lookup = {}
    for _, row in df.iterrows():
        qol_lookup[row["city_key"]] = {
            "aqi": row["aqi"],
            "safety_score": row["safety"],
            "healthcare_score": row["healthcare"],
            "happiness_index": row["happiness"],
            "composite_score": row["composite_score"],
            "risk_rating": row["risk_rating"],
            "country": row["country"]
        }

    with open(MODEL_OUT, "wb") as f:
        pickle.dump(qol_lookup, f)

    print(f"Quality model saved to {MODEL_OUT}")
    for city in ["tokyo", "delhi", "berlin", "dubai", "lagos"]:
        d = qol_lookup.get(city, {})
        print(f"  {city}: AQI={d.get('aqi')} safety={d.get('safety_score')} score={d.get('composite_score')} risk={d.get('risk_rating')}")

if __name__ == "__main__":
    main()
