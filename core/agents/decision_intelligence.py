"""
Decision Intelligence Agent — Equinox Nexus v3.0
Uses Groq LLM to synthesize multi-agent findings (taxes, costs, quality, risk)
and output a dynamic viability score + natural-language rationale.
"""

import os
import requests
import json
from typing import Dict, Any

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class DecisionIntelligenceAgent:
    """
    Lead AI Decision Mediator.
    Synthesizes outputs from Actuary, Fiscal Ghost, Nexus, and Chronos.
    """

    def synthesize_decision(self, state: Dict[str, Any]) -> Dict[str, Any]:
        if not GROQ_API_KEY:
            return {
                "decision_viability_score": None,
                "dynamic_reasoning": "Groq API key not configured. Using standard linear aggregator score."
            }

        tax_info = state.get("compliance_analysis") or {}
        expense_info = state.get("expense_analysis") or {}
        risk_info = state.get("risk_analysis") or {}
        mc = state.get("monte_carlo_result") or {}
        target_city = state.get("target_city", "Target Destination")

        prompt = f"""
        You are the Lead Decision Intelligence Agent for Equinox Nexus.
        Synthesize the following relocation metrics for {target_city} and determine a final viability score (0-100) and rationale.

        1. Tax Compliance (Nexus):
           - Effective tax rate: {tax_info.get('effective_rate', 0.3) * 100}%
           - Tax regime: {tax_info.get('tax_regime')}
           - Visa category: {tax_info.get('visa_requirements')}
           - DTA status: {tax_info.get('treaty_label')}
           - Notes: {tax_info.get('compliance_notes')}

        2. Cost of Living (Fiscal Ghost):
           - Projected monthly expenses: ${expense_info.get('projected_expenses', 2000)}
           - Cost multiplier relative to home city: {expense_info.get('col_multiplier', 1.0)}x

        3. Quality of Life (Actuary):
           - Composite quality score: {risk_info.get('composite_score', 65)}/100
           - Air Quality Index (AQI): {risk_info.get('air_quality_index', 75)}
           - Safety index: {risk_info.get('safety_score', 65)}/100
           - Healthcare index: {risk_info.get('healthcare_score', 70)}/100

        4. Financial Projections (Chronos):
           - Probability of 5-year wealth growth: {mc.get('final_year_stats', {}).get('probability_of_growth', 50)}%
           - Probability of significant wealth loss: {mc.get('final_year_stats', {}).get('probability_of_significant_loss', 10)}%
           - FX Risk Level: {mc.get('risk_metrics', {}).get('fx_risk_level', 'Medium')}

        Respond strictly in JSON format with two keys:
        1. "score": a number between 0 and 100 representing the overall viability of relocation.
        2. "rationale": a 3-4 sentence concise summary of the key trade-offs and decision reasoning.
        """

        try:
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are a financial relocation intelligence system. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 512
            }
            res = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
            res.raise_for_status()
            res_data = res.json()
            content = res_data["choices"][0]["message"]["content"]
            result = json.loads(content)
            return {
                "decision_viability_score": result.get("score"),
                "dynamic_reasoning": result.get("rationale")
            }
        except Exception as e:
            print(f"DecisionIntelligence: API call failed ({e})")

        return {
            "decision_viability_score": None,
            "dynamic_reasoning": "Error executing Groq LLM synthesis. Falling back to linear aggregator."
        }
