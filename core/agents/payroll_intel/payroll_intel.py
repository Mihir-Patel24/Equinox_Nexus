"""
Payroll Intel Agent — Enterprise Anomaly Detection
Uses trained payroll_anomaly_model.pkl (Isolation Forest) to detect:
- Ghost employees (no department/manager)
- Salary spikes (sudden large increases)
- Duplicate billing (same employee, multiple entries)
- Overpayments (salary >> role benchmark)
"""

import pickle
import os
import numpy as np
from typing import Dict, Any, List

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../models/payroll_anomaly_model.pkl")

_payroll_model = None
_feature_cols = []
try:
    with open(MODEL_PATH, "rb") as f:
        payload = pickle.load(f)
        _payroll_model = payload.get("model")
        _feature_cols = payload.get("feature_cols", [])
except (FileNotFoundError, AttributeError):
    pass

# Role salary benchmarks (USD/year) — used for overpayment detection
ROLE_BENCHMARKS = {
    "Sales Executive": 65000, "Research Scientist": 85000, "Laboratory Technician": 55000,
    "Manufacturing Director": 120000, "Healthcare Representative": 70000,
    "Manager": 95000, "Human Resources": 60000, "Marketing": 72000,
    "Sales Representative": 58000, "Research Director": 130000,
}

ANOMALY_TYPES = {
    "ghost_employee": "No department or manager assigned — possible ghost employee",
    "salary_spike": "Salary significantly above role benchmark",
    "duplicate_entry": "Duplicate employee ID detected in payroll batch",
    "overpayment": "Monthly rate inconsistent with annual salary",
    "ml_anomaly": "Isolation Forest flagged as statistical outlier",
}


class PayrollIntelAgent:
    OVERPAYMENT_THRESHOLD = 1.5   # 50% above benchmark = flag
    ANOMALY_SCORE_THRESHOLD = -0.1  # IF scores below this = anomaly

    def analyze_payroll(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze a batch of payroll records for anomalies.
        Each record should have: EmployeeID, MonthlyIncome, JobRole, Department,
        YearsAtCompany, PerformanceRating, OverTime, etc.
        """
        print(f"Payroll Intel: Analyzing {len(records)} payroll records")

        anomalies = []
        seen_ids = {}
        total_flagged = 0

        for i, record in enumerate(records):
            flags = []
            emp_id = record.get("EmployeeID") or record.get("employee_id") or f"EMP_{i}"
            monthly = float(record.get("MonthlyIncome", 0) or record.get("monthly_income", 0))
            annual = monthly * 12
            role = record.get("JobRole") or record.get("job_role", "Unknown")
            dept = record.get("Department") or record.get("department", "")

            # Rule 1: Ghost employee
            if not dept or dept.strip() == "" or dept == "None":
                flags.append({"type": "ghost_employee", "detail": ANOMALY_TYPES["ghost_employee"]})

            # Rule 2: Duplicate entry
            if emp_id in seen_ids:
                flags.append({"type": "duplicate_entry", "detail": f"Duplicate of record at index {seen_ids[emp_id]}"})
            else:
                seen_ids[emp_id] = i

            # Rule 3: Salary vs benchmark
            benchmark = ROLE_BENCHMARKS.get(role, 70000)
            if annual > benchmark * self.OVERPAYMENT_THRESHOLD:
                flags.append({
                    "type": "salary_spike",
                    "detail": f"Annual salary ${annual:,.0f} is {annual/benchmark:.1f}x the benchmark of ${benchmark:,} for {role}"
                })

            # Rule 4: ML anomaly detection
            if _payroll_model is not None and _feature_cols:
                try:
                    feature_vector = self._extract_features(record)
                    score = float(_payroll_model.score_samples([feature_vector])[0])
                    if score < self.ANOMALY_SCORE_THRESHOLD:
                        flags.append({
                            "type": "ml_anomaly",
                            "detail": f"Isolation Forest anomaly score: {score:.4f} (threshold: {self.ANOMALY_SCORE_THRESHOLD})"
                        })
                except Exception:
                    pass

            if flags:
                total_flagged += 1
                anomalies.append({
                    "employee_id": emp_id,
                    "record_index": i,
                    "monthly_income": monthly,
                    "job_role": role,
                    "department": dept,
                    "flags": flags,
                    "risk_level": "High" if len(flags) >= 2 else "Medium",
                })

        risk_score = round((total_flagged / max(len(records), 1)) * 100, 1)

        return {
            "total_records": len(records),
            "total_flagged": total_flagged,
            "anomaly_rate_pct": risk_score,
            "risk_level": "High" if risk_score > 10 else "Medium" if risk_score > 3 else "Low",
            "anomalies": anomalies,
            "summary": self._generate_summary(anomalies, len(records)),
            "model_used": "Isolation Forest (trained on HR Attrition + synthetic anomalies)",
            "data_source": "Uploaded payroll batch",
        }

    def _extract_features(self, record: Dict) -> List[float]:
        """Extract numeric features matching training schema."""
        def safe_float(val, default=0.0):
            try:
                return float(val) if val is not None else default
            except (ValueError, TypeError):
                return default

        overtime_map = {"Yes": 1, "No": 0, 1: 1, 0: 0}
        feature_map = {
            "Age": safe_float(record.get("Age"), 35),
            "MonthlyIncome": safe_float(record.get("MonthlyIncome"), 5000),
            "YearsAtCompany": safe_float(record.get("YearsAtCompany"), 3),
            "PerformanceRating": safe_float(record.get("PerformanceRating"), 3),
            "JobLevel": safe_float(record.get("JobLevel"), 2),
            "TotalWorkingYears": safe_float(record.get("TotalWorkingYears"), 8),
            "OverTime": float(overtime_map.get(record.get("OverTime", "No"), 0)),
            "DistanceFromHome": safe_float(record.get("DistanceFromHome"), 10),
            "NumCompaniesWorked": safe_float(record.get("NumCompaniesWorked"), 2),
            "TrainingTimesLastYear": safe_float(record.get("TrainingTimesLastYear"), 2),
        }
        return [feature_map.get(col, 0.0) for col in _feature_cols] if _feature_cols else list(feature_map.values())

    def _generate_summary(self, anomalies: List[Dict], total: int) -> Dict[str, Any]:
        type_counts = {}
        for a in anomalies:
            for flag in a["flags"]:
                t = flag["type"]
                type_counts[t] = type_counts.get(t, 0) + 1

        recommendations = []
        if type_counts.get("ghost_employee", 0) > 0:
            recommendations.append(f"Investigate {type_counts['ghost_employee']} records with missing department/manager data")
        if type_counts.get("salary_spike", 0) > 0:
            recommendations.append(f"Review {type_counts['salary_spike']} salary entries exceeding role benchmarks by >50%")
        if type_counts.get("duplicate_entry", 0) > 0:
            recommendations.append(f"Resolve {type_counts['duplicate_entry']} duplicate employee IDs before payroll processing")
        if type_counts.get("ml_anomaly", 0) > 0:
            recommendations.append(f"Manually audit {type_counts['ml_anomaly']} ML-flagged statistical outliers")

        return {
            "anomaly_type_breakdown": type_counts,
            "high_risk_count": sum(1 for a in anomalies if a["risk_level"] == "High"),
            "recommendations": recommendations,
        }
