"""
Run all model training scripts in sequence.
Run this once before starting the backend.
"""
import subprocess
import sys
import os

BASE = os.path.dirname(os.path.abspath(__file__))

scripts = [
    ("Expense Model (Fiscal Ghost)",        "train_expense_model.py"),
    ("FX Volatility Model (Risk/Chronos)",  "train_fx_model.py"),
    ("Quality of Life Model (Actuary)",     "train_quality_model.py"),
    ("Payroll Anomaly Model (Payroll Intel)","train_payroll_model.py"),
    ("Financial Behaviour (Fiscal Ghost)",  "train_financial_behaviour.py"),
]

for name, script in scripts:
    print(f"\n{'='*60}")
    print(f"Training: {name}")
    print('='*60)
    result = subprocess.run(
        [sys.executable, os.path.join(BASE, script)],
        capture_output=False
    )
    if result.returncode != 0:
        print(f"ERROR in {script} — returncode {result.returncode}")
    else:
        print(f"DONE: {name}")

print("\n\nAll models trained. pkl files saved in core/models/")
print("You can now start the backend: uvicorn main:app --reload --port 8000")
