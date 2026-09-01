"""
Simulation Evaluator — Equinox Nexus v3.2
Priority 7: Evaluation Framework

Measures the quality of every simulation run across three dimensions:

1. RAG Faithfulness
   - What % of compliance claims are high/medium-confidence (grounded)?
   - What % of mandatory topics have evidence coverage?
   - Hallucination risk rate (low-confidence claims / total claims)
   - Evidence freshness rate (current vs stale)

2. XAI Coverage
   - How many of the 5 expected factors are represented?
   - Confidence interval quality (tight CI = well-calibrated model)
   - Narrative completeness (does the LLM mention key factors?)

3. Agent Completeness
   - Which agents ran vs were skipped by the Adaptive Planner?
   - Was a Financial Twin created and persisted?
   - Is the Chronos MC simulation present with enough paths?

Output is a structured dict suitable for direct API serialisation and
frontend rendering in EvaluationView.tsx.
"""

from typing import Any, Dict, List
from datetime import datetime


# Expected XAI factors (from explainer.py canonical set)
_EXPECTED_FACTORS = {"Tax Efficiency", "Cost of Living", "Quality of Life", "FX Risk", "Savings Potential"}

# Mandatory RAG compliance topics
_MANDATORY_TOPICS = {"income_tax", "visa", "social_security", "dta"}

# Evidence quality → 0-1 score
_QUALITY_SCORES = {"strong": 1.0, "adequate": 0.75, "weak": 0.40, "no_evidence": 0.0}


class SimulationEvaluator:
    """
    Evaluates a full simulation result dict (as returned by the LangGraph pipeline)
    and produces structured quality metrics.
    """

    def evaluate(self, simulation_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run the full evaluation pipeline.

        Args:
            simulation_result: The raw LangGraph state dict (resData from /simulate/stream)

        Returns:
            Structured evaluation dict with rag, xai, agents, and overall_score sections.
        """
        rag    = self._evaluate_rag(simulation_result)
        xai    = self._evaluate_xai(simulation_result)
        agents = self._evaluate_agents(simulation_result)

        overall = self._overall_score(rag, xai, agents)

        return {
            "evaluated_at":   datetime.utcnow().isoformat(),
            "target_city":    simulation_result.get("target_city", "Unknown"),
            "overall_score":  overall["score"],
            "overall_grade":  overall["grade"],
            "overall_label":  overall["label"],
            "rag":            rag,
            "xai":            xai,
            "agents":         agents,
            "component_scores": {
                "rag_faithfulness":    round(rag["faithfulness_rate"] * 100, 1),
                "rag_topic_coverage":  round(rag["topic_coverage"] * 100, 1),
                "rag_freshness":       round(rag["freshness_rate"] * 100, 1),
                "xai_factor_coverage": round(xai["factor_coverage"] * 100, 1),
                "xai_ci_quality":      round(xai["confidence_quality_score"] * 100, 1),
                "xai_narrative":       round(xai["narrative_completeness"] * 100, 1),
                "agent_completeness":  round(agents["completeness_score"] * 100, 1),
            },
            "recommendations": self._build_recommendations(rag, xai, agents),
        }

    # ── RAG Evaluation ─────────────────────────────────────────────────────────

    def _evaluate_rag(self, result: Dict) -> Dict:
        compliance = result.get("compliance_analysis", {})
        claims: List[Dict] = compliance.get("compliance_claims", [])
        total_claims = len(claims)

        # Faithfulness: % of claims with high or medium confidence
        grounded = [c for c in claims if c.get("confidence") in ("high", "medium")]
        faithfulness_rate = len(grounded) / max(total_claims, 1)

        # Freshness: % of claims marked 'current'
        current_claims = [c for c in claims if c.get("freshness") == "current"]
        freshness_rate = len(current_claims) / max(total_claims, 1)

        # Stale claims
        stale_claims = [c for c in claims if c.get("freshness") in ("stale", "may_be_stale")]

        # Topic coverage: mandatory topics not covered by warning-level gaps
        gaps: List[Dict] = compliance.get("evidence_gaps", [])
        warning_gap_topics = {g.get("topic", "") for g in gaps if g.get("severity") == "warning"}
        covered_topics = _MANDATORY_TOPICS - warning_gap_topics
        topic_coverage = len(covered_topics) / len(_MANDATORY_TOPICS)

        # Evidence quality → numeric
        eq = compliance.get("evidence_quality", "no_evidence")
        quality_score = _QUALITY_SCORES.get(eq, 0.0)

        # Hallucination risk: low-confidence claims
        risky_claims = [c for c in claims if c.get("confidence") == "low"]
        hallucination_risk_rate = len(risky_claims) / max(total_claims, 1)

        # Sources diversity
        sources = {c.get("source", "") for c in claims if c.get("source")}

        return {
            "total_claims":         total_claims,
            "grounded_claims":      len(grounded),
            "faithfulness_rate":    round(faithfulness_rate, 3),
            "freshness_rate":       round(freshness_rate, 3),
            "topic_coverage":       round(topic_coverage, 3),
            "covered_topics":       sorted(covered_topics),
            "uncovered_topics":     sorted(warning_gap_topics),
            "stale_claim_count":    len(stale_claims),
            "hallucination_risk_rate": round(hallucination_risk_rate, 3),
            "risky_claim_count":    len(risky_claims),
            "evidence_quality":     eq,
            "evidence_quality_score": quality_score,
            "unique_sources":       len(sources),
            "rag_sources":          sorted(sources),
        }

    # ── XAI Evaluation ─────────────────────────────────────────────────────────

    def _evaluate_xai(self, result: Dict) -> Dict:
        xai = result.get("xai_explanation", {})

        # Factor coverage
        factors = xai.get("factor_contributions", []) or xai.get("factors", [])
        factor_names = {f.get("factor") or f.get("name", "") for f in factors}
        covered = _EXPECTED_FACTORS & factor_names
        missing  = _EXPECTED_FACTORS - factor_names
        factor_coverage = len(covered) / len(_EXPECTED_FACTORS)

        # Confidence interval quality
        ci = xai.get("confidence_interval", [])
        if isinstance(ci, list) and len(ci) == 2:
            ci_width = abs(ci[1] - ci[0])
        elif isinstance(ci, dict):
            ci_width = abs(ci.get("upper", 100) - ci.get("lower", 0))
        else:
            ci_width = 50.0  # unknown → wide

        ci_quality_score = (
            1.0  if ci_width < 20 else
            0.75 if ci_width < 30 else
            0.50 if ci_width < 40 else
            0.25
        )
        ci_quality_label = (
            "excellent" if ci_width < 20 else
            "good"      if ci_width < 30 else
            "moderate"  if ci_width < 40 else
            "uncertain"
        )

        # Narrative completeness: check for key topic mentions
        narrative = (
            xai.get("executive_summary", "")
            or xai.get("narrative", "")
            or result.get("decision_intelligence", {}).get("dynamic_reasoning", "")
        )
        narrative_lower = narrative.lower()
        key_terms = ["tax", "cost", "quality", "fx", "savings", "risk", "visa", "inflation"]
        narrative_mentions = sum(1 for t in key_terms if t in narrative_lower)
        narrative_completeness = min(1.0, narrative_mentions / 5)  # 5 mentions = complete

        viability_score = (
            xai.get("viability_score")
            or xai.get("final_score")
            or result.get("final_report", {}).get("relocation_viability_score", 0)
        )

        return {
            "factor_count":            len(factors),
            "factor_coverage":         round(factor_coverage, 3),
            "covered_factors":         sorted(covered),
            "missing_factors":         sorted(missing),
            "confidence_interval_width": round(ci_width, 1),
            "confidence_quality":      ci_quality_label,
            "confidence_quality_score": ci_quality_score,
            "narrative_length_chars":  len(narrative),
            "narrative_key_mentions":  narrative_mentions,
            "narrative_completeness":  round(narrative_completeness, 3),
            "viability_score":         viability_score,
        }

    # ── Agent Completeness ──────────────────────────────────────────────────────

    def _evaluate_agents(self, result: Dict) -> Dict:
        # Detect which major output blocks are present and non-empty
        agent_checks = {
            "actuary":    bool(result.get("risk_analysis")),
            "fiscal":     bool(result.get("expense_analysis")),
            "nexus":      bool(result.get("compliance_analysis")),
            "chronos":    bool(result.get("monte_carlo_result")),
            "xai":        bool(result.get("xai_explanation")),
            "decision":   bool(result.get("decision_intelligence")),
        }
        present = [k for k, v in agent_checks.items() if v]
        missing = [k for k, v in agent_checks.items() if not v]

        completeness_score = len(present) / len(agent_checks)

        # Financial Twin
        twin_id = result.get("twin_id")

        # Chronos paths quality
        mc = result.get("monte_carlo_result", {})
        mc_paths = mc.get("simulation_paths", {})
        p50 = mc_paths.get("p50", [])
        mc_quality = (
            "full_5yr"   if len(p50) >= 5 else
            "partial"    if len(p50) > 0  else
            "unavailable"
        )

        # Planner skips
        plan = result.get("agent_plan", {})
        skipped = plan.get("skipped", [])
        ran     = plan.get("ran", [])

        return {
            "agents_present":    present,
            "agents_missing":    missing,
            "completeness_score": round(completeness_score, 3),
            "twin_created":      bool(twin_id),
            "twin_id":           twin_id,
            "planner_ran":       ran,
            "planner_skipped":   skipped,
            "chronos_mc_quality": mc_quality,
            "n_simulations":     mc.get("n_simulations", 0),
        }

    # ── Overall Score ───────────────────────────────────────────────────────────

    def _overall_score(self, rag: Dict, xai: Dict, agents: Dict) -> Dict:
        """
        Weighted composite quality score (0–100):
          RAG faithfulness   35%
          RAG topic coverage 15%
          XAI factor cov.    20%
          XAI CI quality     10%
          XAI narrative      10%
          Agent completeness 10%
        """
        raw = (
            rag["faithfulness_rate"]          * 0.35 +
            rag["topic_coverage"]             * 0.15 +
            xai["factor_coverage"]            * 0.20 +
            xai["confidence_quality_score"]   * 0.10 +
            xai["narrative_completeness"]     * 0.10 +
            agents["completeness_score"]      * 0.10
        )
        score = round(raw * 100, 1)

        if score >= 85:
            grade, label = "A", "Production-Grade"
        elif score >= 70:
            grade, label = "B", "High Quality"
        elif score >= 55:
            grade, label = "C", "Adequate"
        elif score >= 40:
            grade, label = "D", "Needs Improvement"
        else:
            grade, label = "F", "Poor Coverage"

        return {"score": score, "grade": grade, "label": label}

    # ── Recommendations ─────────────────────────────────────────────────────────

    def _build_recommendations(self, rag: Dict, xai: Dict, agents: Dict) -> List[str]:
        recs = []

        if rag["hallucination_risk_rate"] > 0.4:
            recs.append(
                f"High hallucination risk ({rag['risky_claim_count']} low-confidence claims). "
                "Consider re-indexing the knowledge base with more recent regulatory documents."
            )
        if rag["uncovered_topics"]:
            recs.append(
                f"Missing evidence for: {', '.join(rag['uncovered_topics'])}. "
                "Add dedicated KB files for these topics to improve coverage."
            )
        if rag["stale_claim_count"] > 0:
            recs.append(
                f"{rag['stale_claim_count']} claims are sourced from potentially stale regulations. "
                "Run POST /research/refresh to update the knowledge base."
            )
        if xai["missing_factors"]:
            recs.append(
                f"XAI is missing factors: {', '.join(xai['missing_factors'])}. "
                "Check that the explainer agent is returning factor_contributions for all categories."
            )
        if xai["confidence_interval_width"] >= 40:
            recs.append(
                f"Wide confidence interval ({xai['confidence_interval_width']:.1f} pts). "
                "The Monte Carlo simulation may need more calibration data or longer simulation history."
            )
        if xai["narrative_completeness"] < 0.6:
            recs.append(
                "XAI narrative is sparse. Consider improving the LLM prompt to cover more financial factors."
            )
        if agents["agents_missing"]:
            recs.append(
                f"Agents with no output: {', '.join(agents['agents_missing'])}. "
                "Check backend logs for errors in those pipeline nodes."
            )

        if not recs:
            recs.append("All quality checks passed. Simulation output is production-grade.")

        return recs
