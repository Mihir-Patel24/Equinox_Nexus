"""
Payroll Anomaly Detection Model
Trains Isolation Forest on HR Employee Attrition dataset
Used by: Payroll Intel Agent
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE, "../../Dataset/Payroll/WA_Fn-UseC_-HR-Employee-Attrition.csv")
MODEL_OUT = os.path.join(BASE, "payroll_anomaly_model.pkl")

NUMERIC_FEATURES = [
    "Age", "DailyRate", "DistanceFromHome", "HourlyRate",
    "MonthlyIncome", "MonthlyRate", "NumCompaniesWorked",
    "PercentSalaryHike", "TotalWorkingYears", "TrainingTimesLastYear",
    "YearsAtCompany", "YearsInCurrentRole", "YearsSinceLastPromotion",
    "YearsWithCurrManager", "JobLevel", "StockOptionLevel"
]

def add_synthetic_anomalies(df):
    """
    Inject synthetic payroll anomalies since the dataset has no labeled fraud.
    Anomaly types:
      1. Ghost employee: very high salary, 0 years experience
      2. Salary spike: sudden 50%+ hike with no promotion
      3. Duplicate rate: same employee billed twice (doubled MonthlyRate)
      4. Overpayment: MonthlyIncome >> expected for job level
    """
    n = len(df)
    anomalies = []

    # Type 1: Ghost employees (50 records)
    for _ in range(50):
        row = df.sample(1).iloc[0].copy()
        row["MonthlyIncome"] = np.random.randint(15000, 25000)
        row["TotalWorkingYears"] = 0
        row["YearsAtCompany"] = 0
        row["JobLevel"] = 1
        row["is_anomaly"] = 1
        anomalies.append(row)

    # Type 2: Salary spike (50 records)
    for _ in range(50):
        row = df.sample(1).iloc[0].copy()
        row["PercentSalaryHike"] = np.random.randint(60, 100)
        row["YearsSinceLastPromotion"] = np.random.randint(5, 10)
        row["is_anomaly"] = 1
        anomalies.append(row)

    # Type 3: Duplicate billing (50 records)
    for _ in range(50):
        row = df.sample(1).iloc[0].copy()
        row["MonthlyRate"] = row["MonthlyRate"] * 2
        row["DailyRate"] = row["DailyRate"] * 2
        row["is_anomaly"] = 1
        anomalies.append(row)

    # Type 4: Overpayment (50 records)
    for _ in range(50):
        row = df.sample(1).iloc[0].copy()
        row["MonthlyIncome"] = row["MonthlyIncome"] * np.random.uniform(3.0, 5.0)
        row["JobLevel"] = 1
        row["is_anomaly"] = 1
        anomalies.append(row)

    df["is_anomaly"] = 0
    synthetic_df = pd.DataFrame(anomalies)
    return pd.concat([df, synthetic_df], ignore_index=True)

def main():
    print("Loading payroll dataset...")
    df = pd.read_csv(DATA_PATH)
    print(f"Original records: {len(df)}, Columns: {len(df.columns)}")

    df = add_synthetic_anomalies(df)
    print(f"After synthetic anomalies: {len(df)} records ({df['is_anomaly'].sum()} anomalies)")

    X = df[NUMERIC_FEATURES].fillna(df[NUMERIC_FEATURES].median())

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Isolation Forest: contamination = fraction of anomalies
    contamination = df["is_anomaly"].mean()
    print(f"Training Isolation Forest (contamination={contamination:.3f})...")

    model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_scaled)

    # Evaluate
    preds = model.predict(X_scaled)
    preds_binary = (preds == -1).astype(int)
    print(classification_report(df["is_anomaly"], preds_binary, target_names=["Normal", "Anomaly"]))

    # Anomaly score thresholds
    scores = model.score_samples(X_scaled)
    threshold_high = np.percentile(scores, 5)    # top 5% most anomalous
    threshold_medium = np.percentile(scores, 15)

    with open(MODEL_OUT, "wb") as f:
        pickle.dump({
            "model": model,
            "scaler": scaler,
            "feature_cols": NUMERIC_FEATURES,
            "threshold_high": threshold_high,
            "threshold_medium": threshold_medium,
            "anomaly_types": ["ghost_employee", "salary_spike", "duplicate_billing", "overpayment"]
        }, f)

    print(f"Payroll anomaly model saved to {MODEL_OUT}")

if __name__ == "__main__":
    main()
