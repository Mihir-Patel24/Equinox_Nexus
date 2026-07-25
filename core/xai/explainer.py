"""
XAI Explainer — Equinox Nexus v3.0
Produces SHAP-inspired factor decomposition of the viability score.
Every score is explained with:
  - Factor contributions (positive/negative)
  - Confidence interval (from Monte Carlo spread)
  - Natural-language explanation paragraph
  - Data provenance (which model/source each number comes from)
"""

from typing import Dict, Any, List, Optional
import math


class ViabilityExplainer:
    """
    Decomposes the relocation viability score into interpretable factor contributions.
    Uses the same math as the aggregator but surfaces every intermediate value
    with human-readable explanations.
    """

    # Factor weights — must match aggregator logic
    WEIGHTS = {
        "tax_efficiency":    0.30,
        "cost_of_living":    0.20,
        "quality_of_life":   0.30,
        "fx_risk":           0.10,
        "savings_potential": 0.10,
    }

    def explain_viability(
        self,
        state: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Full viability explanation from agent state.
        Returns structured XAI output with factor contributions and narrative.
        """
        tax_info = state.get("compliance_analysis", {}) or {}
        expense_info = state.get("expense_analysis", {}) or {}
        risk_info = state.get("risk_analysis", {}) or {}
        mc = state.get("monte_carlo_result", {}) or {}
        user = state.get("user_profile", {}) or {}
        target_city = state.get("target_city", "Unknown City")

        income = user.get("annual_income", 60000)
        current_wealth = user.get("current_wealth", 0)

        # ── Raw inputs ───────────────────────────────────────────────
        effective_rate = tax_info.get("effective_rate", 0.30)
        net_income = tax_info.get("net_annual_income", income * 0.70)
        tax_saved = income - net_income
        regime = tax_info.get("tax_regime", "Standard")

        projected_expenses = expense_info.get("projected_expenses", 0) or 0
        original_expenses = expense_info.get("original_expenses", 0) or 0
        col_multiplier = expense_info.get("col_multiplier", 1.0) or 1.0
        annual_expenses = projected_expenses * 12
        annual_savings = net_income - annual_expenses

        aqi = risk_info.get("air_quality_index", 75) or 75
        safety = risk_info.get("safety_score", 65) or 65
        healthcare = risk_info.get("healthcare_score", 70) or 70
        happiness = risk_info.get("happiness_index", 65) or 65

        mc_final = mc.get("final_year_stats", {}) or {}
        mc_risk = mc.get("risk_metrics", {}) or {}
        fx_vol = mc_risk.get("fx_volatility_used", 0.08) or 0.08
        fx_risk_level = mc_risk.get("fx_risk_level", "Medium")
        prob_growth = mc_final.get("probability_of_growth", 50.0) or 50.0
        prob_loss = mc_final.get("probability_of_significant_loss", 10.0) or 10.0
        median_wealth_yr5 = mc_final.get("median_wealth_wealth", mc_final.get("median_wealth", 0)) or 0

        # ── Factor Scores (0–100) ────────────────────────────────────

        # 1. Tax Efficiency (higher is better — lower effective rate = better score)
        # Dubai at 0% → 100. Stockholm at 55% → 45.
        tax_score = max(0, 100 - effective_rate * 100 * 1.3)
        tax_contribution = tax_score * self.WEIGHTS["tax_efficiency"]

        # 2. Cost of Living Delta
        # If projected > original: penalise. If projected < original: reward.
        if original_expenses > 0:
            col_delta_pct = ((projected_expenses - original_expenses) / original_expenses) * 100
        else:
            col_delta_pct = (col_multiplier - 1.0) * 100

        # Score: 50 = same cost, 100 = 50% cheaper, 0 = 50%+ more expensive
        col_score = max(0, min(100, 50 - col_delta_pct))
        col_contribution = col_score * self.WEIGHTS["cost_of_living"]

        # 3. Quality of Life
        aqi_score = max(0, 100 - aqi)  # Lower AQI = better air = higher score
        qol_composite = (safety + healthcare + happiness + aqi_score) / 4
        qol_contribution = qol_composite * self.WEIGHTS["quality_of_life"]

        # 4. FX Risk (lower vol = higher score)
        fx_score = max(0, 100 - fx_vol * 400)  # 0.25 vol → 0; 0 vol → 100
        fx_contribution = fx_score * self.WEIGHTS["fx_risk"]

        # 5. Savings Potential
        if income > 0:
            savings_rate = annual_savings / income
        else:
            savings_rate = 0
        savings_score = max(0, min(100, savings_rate * 200))  # 50% savings → 100
        savings_contribution = savings_score * self.WEIGHTS["savings_potential"]

        # ── Overall Viability Score ──────────────────────────────────
        viability_score = round(
            tax_contribution + col_contribution + qol_contribution
            + fx_contribution + savings_contribution,
            1,
        )
        viability_score = max(0.0, min(100.0, viability_score))

        # ── Confidence Interval from Monte Carlo ────────────────────
        mc_p5 = mc_final.get("worst_case_p5", 0)
        mc_p95 = mc_final.get("best_case_p95", 0)
        # Map wealth spread to score uncertainty (wider spread = wider CI)
        if median_wealth_yr5 > 0:
            spread_ratio = (mc_p95 - mc_p5) / max(median_wealth_yr5, 1)
        else:
            spread_ratio = 0.3

        ci_half_width = min(15.0, spread_ratio * 20)
        confidence_interval = [
            round(max(0, viability_score - ci_half_width), 1),
            round(min(100, viability_score + ci_half_width), 1),
        ]

        # ── Factor Contribution List ─────────────────────────────────
        factors = [
            {
                "factor": "Tax Efficiency",
                "raw_value": f"{effective_rate * 100:.1f}% effective rate ({regime})",
                "score": round(tax_score, 1),
                "weight": self.WEIGHTS["tax_efficiency"],
                "contribution": round(tax_contribution, 2),
                "direction": "positive" if tax_score >= 50 else "negative",
                "data_source": tax_info.get("data_source", "OECD 2024"),
                "explanation": self._explain_tax(effective_rate, regime, income, net_income),
            },
            {
                "factor": "Cost of Living",
                "raw_value": f"{col_delta_pct:+.1f}% vs current city (×{col_multiplier:.2f})",
                "score": round(col_score, 1),
                "weight": self.WEIGHTS["cost_of_living"],
                "contribution": round(col_contribution, 2),
                "direction": "positive" if col_delta_pct <= 0 else "negative",
                "data_source": expense_info.get("data_source", "Numbeo + XGBoost"),
                "explanation": self._explain_col(col_delta_pct, projected_expenses, original_expenses),
            },
            {
                "factor": "Quality of Life",
                "raw_value": f"Safety {safety}/100 | Healthcare {healthcare}/100 | AQI {aqi} | Happiness {happiness}/100",
                "score": round(qol_composite, 1),
                "weight": self.WEIGHTS["quality_of_life"],
                "contribution": round(qol_contribution, 2),
                "direction": "positive" if qol_composite >= 60 else "negative",
                "data_source": risk_info.get("data_source", "WHO + Numbeo QoL"),
                "explanation": self._explain_qol(safety, healthcare, aqi, happiness),
            },
            {
                "factor": "FX Risk",
                "raw_value": f"{fx_vol * 100:.1f}% annualized volatility — {fx_risk_level} risk",
                "score": round(fx_score, 1),
                "weight": self.WEIGHTS["fx_risk"],
                "contribution": round(fx_contribution, 2),
                "direction": "positive" if fx_risk_level in ("Low", "Very Low") else "negative",
                "data_source": "ECB historical FX data (trained model)",
                "explanation": self._explain_fx(fx_vol, fx_risk_level, mc_risk.get("target_currency", "?")),
            },
            {
                "factor": "Savings Potential",
                "raw_value": f"${annual_savings:,.0f}/year savings ({savings_rate * 100:.1f}% of income)",
                "score": round(savings_score, 1),
                "weight": self.WEIGHTS["savings_potential"],
                "contribution": round(savings_contribution, 2),
                "direction": "positive" if annual_savings > 0 else "negative",
                "data_source": "Derived from expense + tax agent outputs",
                "explanation": self._explain_savings(annual_savings, income, prob_growth, prob_loss),
            },
        ]

        # Sort by absolute contribution magnitude
        factors_sorted = sorted(factors, key=lambda x: abs(x["contribution"]), reverse=True)

        # ── Natural-Language Executive Summary ───────────────────────
        summary = self._generate_summary(
            city=target_city,
            viability_score=viability_score,
            factors=factors_sorted,
            annual_savings=annual_savings,
            income=income,
            effective_rate=effective_rate,
            col_delta_pct=col_delta_pct,
            qol_composite=qol_composite,
            prob_growth=prob_growth,
            prob_loss=prob_loss,
        )

        return {
            "viability_score": viability_score,
            "confidence_interval": confidence_interval,
            "executive_summary": summary,
            "factor_contributions": factors_sorted,
            "methodology": {
                "model": "Weighted Factor Decomposition with Monte Carlo Confidence Intervals",
                "weights": self.WEIGHTS,
                "n_simulations": mc.get("n_simulations", 1000),
                "data_sources": [
                    tax_info.get("data_source", "OECD 2024"),
                    expense_info.get("data_source", "Numbeo + XGBoost"),
                    risk_info.get("data_source", "WHO + QoL model"),
                    mc.get("data_source", "Monte Carlo GBM + ECB FX"),
                ],
            },
            "key_risks": self._identify_key_risks(
                effective_rate, col_delta_pct, fx_vol, annual_savings, prob_loss
            ),
            "key_advantages": self._identify_advantages(
                effective_rate, col_delta_pct, qol_composite, annual_savings
            ),
        }

    # ── Natural-language explanation helpers ────────────────────────

    def _explain_tax(self, rate, regime, income, net_income):
        saved = income - net_income
        if rate < 0.10:
            return f"{regime} imposes virtually no income tax. You retain ~{(1-rate)*100:.0f}% of gross income, saving ${saved:,.0f}/year vs a typical 30% jurisdiction."
        elif rate < 0.25:
            return f"{regime} has a competitive effective rate of {rate*100:.1f}%. You keep ${net_income:,.0f} of your ${income:,.0f} gross income — favorable for wealth accumulation."
        elif rate < 0.40:
            return f"{regime} levies a moderate effective rate of {rate*100:.1f}% after DTA relief. Net income is ${net_income:,.0f}/year."
        else:
            return f"{regime} is a high-tax jurisdiction ({rate*100:.1f}% effective after DTA). Total tax liability: ${saved:,.0f}/year — significant drag on wealth accumulation."

    def _explain_col(self, col_delta_pct, projected, original):
        if col_delta_pct <= -20:
            return f"Cost of living is {abs(col_delta_pct):.1f}% LOWER than your current city. Monthly spend drops to ${projected:,.0f}, freeing ${(original - projected) * 12:,.0f}/year."
        elif col_delta_pct <= 5:
            return f"Cost of living is roughly comparable to your current city (±{abs(col_delta_pct):.1f}%). Monthly expenses: ${projected:,.0f}."
        elif col_delta_pct <= 25:
            return f"Cost of living is {col_delta_pct:.1f}% higher than your current city. Expect to spend an extra ${(projected - original) * 12:,.0f}/year — primarily driven by housing and food."
        else:
            return f"Cost of living is significantly higher ({col_delta_pct:.1f}%). Monthly spend rises to ${projected:,.0f} — a material impact on your savings rate."

    def _explain_qol(self, safety, healthcare, aqi, happiness):
        if aqi <= 30:
            air_note = f"Excellent air quality (AQI {aqi})."
        elif aqi <= 70:
            air_note = f"Moderate air quality (AQI {aqi})."
        else:
            air_note = f"Poor air quality (AQI {aqi}) — health risk for sensitive individuals."
        return (
            f"Safety score {safety}/100, healthcare {healthcare}/100, happiness {happiness}/100. {air_note} "
            f"Combined QoL score: {(safety + healthcare + happiness + max(0, 100 - aqi)) / 4:.0f}/100."
        )

    def _explain_fx(self, fx_vol, fx_risk_level, currency):
        vol_pct = fx_vol * 100
        if fx_vol < 0.03:
            return f"{currency} carries very low FX risk ({vol_pct:.1f}% annualized vol). Currency stability is a significant advantage."
        elif fx_vol < 0.08:
            return f"{currency} carries moderate FX risk ({vol_pct:.1f}% annualized vol). Some currency hedging may be advisable over 3–5 year horizon."
        else:
            return f"{currency} carries elevated FX risk ({vol_pct:.1f}% annualized vol — {fx_risk_level}). Currency depreciation is a meaningful downside scenario. Consider FX hedging or maintaining savings in USD/EUR."

    def _explain_savings(self, annual_savings, income, prob_growth, prob_loss):
        if annual_savings <= 0:
            return f"At this income and expense level, projected expenses exceed net income — wealth accumulation requires either income growth or expense reduction."
        savings_rate = annual_savings / income * 100
        return (
            f"Projected annual savings: ${annual_savings:,.0f} ({savings_rate:.1f}% savings rate). "
            f"Monte Carlo: {prob_growth:.0f}% probability of wealth growth over 5 years, "
            f"{prob_loss:.0f}% probability of significant loss."
        )

    def _generate_summary(
        self, city, viability_score, factors, annual_savings,
        income, effective_rate, col_delta_pct, qol_composite, prob_growth, prob_loss
    ) -> str:
        top_factor = factors[0] if factors else {}
        top_name = top_factor.get("factor", "")
        top_direction = top_factor.get("direction", "positive")

        if viability_score >= 75:
            overall = f"{city} is a highly favorable relocation destination"
        elif viability_score >= 55:
            overall = f"{city} is a viable relocation destination with notable trade-offs"
        elif viability_score >= 35:
            overall = f"{city} presents a mixed financial picture for relocation"
        else:
            overall = f"{city} poses significant financial challenges for relocation"

        tax_note = f"effective tax rate of {effective_rate * 100:.1f}%"
        col_note = f"cost of living {abs(col_delta_pct):.0f}% {'lower' if col_delta_pct < 0 else 'higher'} than your current city"
        qol_note = f"quality of life score of {qol_composite:.0f}/100"

        if annual_savings > 0:
            savings_note = f"projected annual savings of ${annual_savings:,.0f}"
        else:
            savings_note = f"projected annual shortfall of ${abs(annual_savings):,.0f}"

        return (
            f"{overall} (viability score: {viability_score}/100). "
            f"The dominant factor is {top_name} ({top_direction}). "
            f"Key metrics: {tax_note}, {col_note}, {qol_note}, {savings_note}. "
            f"Monte Carlo simulation ({prob_growth:.0f}% probability of wealth growth over 5 years, "
            f"{prob_loss:.0f}% probability of significant loss) "
            f"supports {'a confident' if prob_growth > 70 else 'a cautious' if prob_growth > 50 else 'a skeptical'} outlook."
        )

    def _identify_key_risks(self, effective_rate, col_delta_pct, fx_vol, annual_savings, prob_loss) -> List[str]:
        risks = []
        if effective_rate > 0.40:
            risks.append(f"Very high tax burden ({effective_rate*100:.0f}% effective) — largest single drag on wealth accumulation")
        if col_delta_pct > 30:
            risks.append(f"Cost of living {col_delta_pct:.0f}% higher than current city — significantly compresses savings")
        if fx_vol > 0.12:
            risks.append(f"High FX volatility ({fx_vol*100:.0f}% annualized) — currency depreciation risk over 5-year horizon")
        if annual_savings < 0:
            risks.append("Projected expenses exceed net income at current income/lifestyle — requires income growth or expense reduction")
        if prob_loss > 20:
            risks.append(f"{prob_loss:.0f}% probability of significant wealth loss over 5 years (Monte Carlo p80 analysis)")
        return risks if risks else ["No critical risks identified at this income level"]

    def _identify_advantages(self, effective_rate, col_delta_pct, qol_composite, annual_savings) -> List[str]:
        advantages = []
        if effective_rate < 0.15:
            advantages.append(f"Exceptional tax efficiency ({effective_rate*100:.0f}% effective) — maximizes take-home pay")
        elif effective_rate < 0.28:
            advantages.append(f"Competitive tax rate ({effective_rate*100:.0f}% effective) — favorable for wealth building")
        if col_delta_pct < -10:
            advantages.append(f"Cost of living significantly lower ({abs(col_delta_pct):.0f}%) — stretches purchasing power")
        if qol_composite >= 80:
            advantages.append(f"High quality of life ({qol_composite:.0f}/100) — excellent safety, healthcare, and living standards")
        if annual_savings > 20000:
            advantages.append(f"Strong savings potential (${annual_savings:,.0f}/year) — accelerates wealth accumulation")
        return advantages if advantages else ["Moderate advantages relative to other destinations"]
