"""
DriftExplainer — Equinox Nexus v3.1
Generates structured, human-readable explanations of Financial Twin drift events.

Responsibility:
  After an autonomous re-simulation, compare the new agent results against the
  previous SimulationRecord and produce a structured explanation that answers:
    - What changed?
    - By how much?
    - Which factor was most impacted?
    - What does this mean for the user?
    - What is the recommended action?

Output format is stable — frontend can render it directly.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime


class DriftExplainer:
    """
    Compares a previous SimulationRecord against a new LangGraph result dict
    and produces a structured drift explanation.
    """

    def explain(
        self,
        old_record,         # SimulationRecord dataclass
        new_result: Dict[str, Any],
        drift_alerts: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Generate a complete drift explanation comparing old vs new simulation.

        Args:
            old_record:    The most recent SimulationRecord from the twin's history.
            new_result:    Raw LangGraph state dict from the fresh re-simulation.
            drift_alerts:  The drift alerts that triggered the re-simulation.

        Returns:
            A structured dict suitable for direct API serialisation.
        """
        new_report  = (new_result.get("final_report") or {})
        new_mc      = (new_result.get("monte_carlo_result") or {}).get("final_year_stats", {})
        new_xai     = (new_result.get("xai_explanation") or {})

        # ── Extract new values ─────────────────────────────────────────────────
        new_viability  = new_report.get("relocation_viability_score",  old_record.viability_score)
        new_savings    = new_report.get("net_annual_savings",           old_record.net_annual_savings)
        new_tax_rate   = new_report.get("effective_tax_rate",           old_record.effective_tax_rate)
        new_col        = new_report.get("col_multiplier",               old_record.col_multiplier)
        new_qol        = new_report.get("quality_of_life_score",        old_record.quality_of_life_score)
        new_prob_growth = new_mc.get("probability_of_growth", 50.0)
        new_worst_case  = new_mc.get("worst_case_p5",          0)
        new_best_case   = new_mc.get("best_case_p95",          0)

        # ── Compute deltas ─────────────────────────────────────────────────────
        def _delta(new_val, old_val, round_digits=2):
            try:
                return round(float(new_val) - float(old_val), round_digits)
            except (TypeError, ValueError):
                return 0.0

        viability_delta  = _delta(new_viability,  old_record.viability_score,  1)
        savings_delta    = _delta(new_savings,     old_record.net_annual_savings, 0)
        tax_delta        = _delta(new_tax_rate,    old_record.effective_tax_rate, 4)
        col_delta        = _delta(new_col,         old_record.col_multiplier, 3)
        qol_delta        = _delta(new_qol,         old_record.quality_of_life_score, 1)

        # ── Identify most-impacted factor ──────────────────────────────────────
        factor_impacts = {
            "Viability Score":   abs(viability_delta),
            "Annual Savings":    abs(savings_delta) / max(abs(old_record.net_annual_savings), 1) * 100,
            "Tax Rate":          abs(tax_delta) * 100,
            "Cost of Living":    abs(col_delta) * 50,
            "Quality of Life":   abs(qol_delta),
        }
        most_impacted_factor = max(factor_impacts, key=factor_impacts.get)

        # ── FX context from drift alerts ────────────────────────────────────
        fx_triggers = [
            {
                "currency":  a.get("currency", "?"),
                "drift_pct": a.get("drift_pct", 0),
                "direction": a.get("direction", ""),
            }
            for a in drift_alerts
            if a.get("type") == "fx_drift"
        ]
        stale_trigger = any(a.get("type") == "stale_simulation" for a in drift_alerts)

        # ── Natural-language narrative ─────────────────────────────────────────
        narrative = self._build_narrative(
            city=old_record.target_city,
            viability_delta=viability_delta,
            new_viability=new_viability,
            savings_delta=savings_delta,
            new_savings=new_savings,
            col_delta=col_delta,
            fx_triggers=fx_triggers,
            stale_trigger=stale_trigger,
            most_impacted_factor=most_impacted_factor,
        )

        # ── Recommendation ────────────────────────────────────────────────────
        recommendation = self._build_recommendation(
            new_viability=new_viability,
            viability_delta=viability_delta,
            savings_delta=savings_delta,
            col_delta=col_delta,
            city=old_record.target_city,
        )

        # ── Confidence ────────────────────────────────────────────────────────
        # Higher confidence when FX data is fresh and drift is clearly directional
        if fx_triggers and all(t["drift_pct"] > 7 for t in fx_triggers):
            confidence = "high"
        elif fx_triggers:
            confidence = "medium"
        else:
            confidence = "low"  # stale-sim only, no live FX change

        return {
            # What caused this
            "triggered_by": (
                [f"FX drift: {t['currency']} {t['drift_pct']:.1f}% ({t['direction']})" for t in fx_triggers]
                + (["stale_simulation: data older than 30 days"] if stale_trigger else [])
            ),

            # Score comparison
            "viability_delta": {
                "before": round(old_record.viability_score, 1),
                "after":  round(new_viability, 1),
                "change": round(viability_delta, 1),
                "direction": "improved" if viability_delta > 0 else "declined" if viability_delta < 0 else "unchanged",
            },

            # Financial comparison
            "savings_delta": {
                "before": round(old_record.net_annual_savings, 0),
                "after":  round(new_savings, 0),
                "change": round(savings_delta, 0),
            },
            "tax_delta": {
                "before": round(old_record.effective_tax_rate, 4),
                "after":  round(new_tax_rate, 4),
                "change": round(tax_delta, 4),
            },
            "col_delta": {
                "before": round(old_record.col_multiplier, 3),
                "after":  round(new_col, 3),
                "change": round(col_delta, 3),
            },
            "qol_delta": {
                "before": round(old_record.quality_of_life_score, 1),
                "after":  round(new_qol, 1),
                "change": round(qol_delta, 1),
            },

            # Monte Carlo new outcomes
            "new_monte_carlo": {
                "probability_of_growth": round(new_prob_growth, 1),
                "best_case_yr5":  round(new_best_case, 0),
                "worst_case_yr5": round(new_worst_case, 0),
            },

            # XAI key risks/advantages from new run
            "new_key_risks":      new_xai.get("key_risks", []),
            "new_key_advantages": new_xai.get("key_advantages", []),

            # Summary
            "most_impacted_factor": most_impacted_factor,
            "narrative":      narrative,
            "recommendation": recommendation,
            "confidence":     confidence,
            "data_freshness": datetime.utcnow().isoformat(),
            "city":           old_record.target_city,
        }

    # ── Private helpers ────────────────────────────────────────────────────────

    def _build_narrative(
        self, city, viability_delta, new_viability, savings_delta,
        new_savings, col_delta, fx_triggers, stale_trigger, most_impacted_factor,
    ) -> str:
        parts = []

        if fx_triggers:
            fx_desc = ", ".join(
                f"{t['currency']} {t['direction']} {t['drift_pct']:.1f}%"
                for t in fx_triggers
            )
            parts.append(f"Since your last {city} simulation, currency markets moved: {fx_desc}.")

        if stale_trigger:
            parts.append(
                f"Your {city} data was also stale (>30 days old), "
                "so macroeconomic conditions have been refreshed."
            )

        if abs(viability_delta) < 0.5:
            parts.append(
                f"Overall viability remains stable at {new_viability:.1f}/100 — "
                "the FX movement had minimal net effect."
            )
        elif viability_delta > 0:
            parts.append(
                f"Your {city} viability score improved by {viability_delta:+.1f} points "
                f"to {new_viability:.1f}/100."
            )
        else:
            parts.append(
                f"Your {city} viability score declined by {abs(viability_delta):.1f} points "
                f"to {new_viability:.1f}/100."
            )

        if abs(savings_delta) > 500:
            direction = "increased" if savings_delta > 0 else "decreased"
            parts.append(
                f"Projected annual savings {direction} by ${abs(savings_delta):,.0f} "
                f"to ${new_savings:,.0f}/year."
            )

        if abs(col_delta) > 0.03:
            direction = "rose" if col_delta > 0 else "fell"
            parts.append(
                f"The cost-of-living multiplier {direction} from "
                f"{(col_delta - col_delta + (col_delta > 0 and col_delta or -col_delta)):.2f} "
                f"— primarily driven by {most_impacted_factor}."
            )

        return " ".join(parts) if parts else (
            f"Autonomous re-simulation of {city} completed. "
            f"Viability: {new_viability:.1f}/100. "
            f"No significant changes detected."
        )

    def _build_recommendation(
        self, new_viability, viability_delta, savings_delta, col_delta, city
    ) -> str:
        if new_viability >= 75:
            base = f"{city} remains a strong relocation option"
        elif new_viability >= 55:
            base = f"{city} is still a viable option, but conditions have shifted"
        elif new_viability >= 35:
            base = f"{city} presents a mixed outlook under current conditions"
        else:
            base = f"{city} now poses significant financial risks"

        if viability_delta <= -5:
            action = (
                "Consider reviewing your relocation timeline. "
                "FX conditions are working against this destination — "
                "re-evaluate after market stabilisation or compare alternative cities."
            )
        elif viability_delta >= 5:
            action = (
                "Current conditions have improved the financial case for this move. "
                "This may be a favourable window to finalise relocation plans."
            )
        elif savings_delta < -3000:
            action = (
                "Your projected savings have compressed. "
                "Review your expense assumptions or consider income growth targets."
            )
        else:
            action = (
                "No immediate action required. "
                "Continue monitoring for further FX or macroeconomic changes."
            )

        return f"{base}. {action}"
