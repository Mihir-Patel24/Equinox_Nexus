"""
EvidenceChain — Equinox Nexus v3.1
Evidence-First Compliance Layer for the Nexus RAG Agent.

Responsibility:
  Takes raw RAG passages and structures them into a traceable evidence bundle
  where every compliance claim is linked to:
    - Source file (jurisdiction)
    - Section of the KB document
    - Effective year (when the data was last authoritative)
    - Retrieval confidence (high / medium / low) based on similarity score
    - Data freshness status (current / may_be_stale / no_evidence)

  Also detects EVIDENCE GAPS — topics where no KB passage was retrieved.
  These gaps are surfaced in the output so the frontend can warn the user
  instead of silently presenting invented (hallucinated) conclusions.

Design principle:
  "No claim without a source. No source without a date. No date without a
   freshness assessment."
"""

from typing import List, Dict, Any, Optional
from datetime import datetime


# ── Retrieval confidence thresholds ──────────────────────────────────────────
CONFIDENCE_HIGH   = 0.55   # cosine similarity >= 0.55 → "high"
CONFIDENCE_MEDIUM = 0.30   # 0.30 – 0.55 → "medium"
# < 0.30 → "low"

# ── Freshness thresholds (days) ───────────────────────────────────────────────
FRESHNESS_CURRENT_DAYS = 365    # < 1 year old → "current"
FRESHNESS_STALE_DAYS   = 730    # < 2 years old → "may_be_stale"
# >= 2 years → "stale"

# ── Topics we expect evidence for in every compliance analysis ────────────────
MANDATORY_TOPICS = {
    "income_tax":         ["income tax", "tax rate", "effective tax", "marginal rate", "tax bracket"],
    "visa":               ["visa", "employment pass", "work permit", "residency", "skilled worker"],
    "social_security":    ["social security", "cpf", "pension", "national insurance", "contributions"],
    "dta":                ["double taxation", "dta", "tax treaty", "dtaa", "foreign tax credit"],
}


class EvidenceChain:
    """
    Structures raw RAG passages into a traceable, verifiable evidence bundle.
    Called by NexusAgent after retrieving passages from ChromaDB.
    """

    def build(
        self,
        passages: List[Dict[str, Any]],
        topic_queries: List[str],
        country: str,
        current_year: int = None,
    ) -> Dict[str, Any]:
        """
        Build a complete evidence bundle from retrieved passages.

        Args:
            passages:     List of passage dicts from ComplianceRAGEngine.query()
            topic_queries: The queries that were used to retrieve these passages
            country:      Target country (for jurisdiction labelling)
            current_year: Current year for freshness calculation

        Returns:
            A structured evidence bundle dict.
        """
        if current_year is None:
            current_year = datetime.utcnow().year

        # ── Step 1: Enrich each passage with evidence metadata ─────────────────
        enriched = [
            self._enrich_passage(p, country, current_year)
            for p in passages
        ]

        # ── Step 2: Build structured compliance claims ─────────────────────────
        claims = self._build_claims(enriched)

        # ── Step 3: Detect evidence gaps ───────────────────────────────────────
        gaps = self._detect_gaps(enriched, topic_queries)

        # ── Step 4: Compute evidence quality summary ───────────────────────────
        summary = self._summarise(claims, gaps)

        return {
            "claims":           claims,
            "evidence_gaps":    gaps,
            "evidence_summary": summary,
            "enriched_passages": enriched,
        }

    # ── Private: enrich a single passage ──────────────────────────────────────

    def _enrich_passage(
        self,
        passage: Dict[str, Any],
        country: str,
        current_year: int,
    ) -> Dict[str, Any]:
        """
        Add evidence metadata to a raw passage dict.
        """
        score  = passage.get("relevance_score", 0.0)
        text   = passage.get("text", "")
        source = passage.get("source", "unknown")

        # Confidence tier
        if score >= CONFIDENCE_HIGH:
            confidence = "high"
        elif score >= CONFIDENCE_MEDIUM:
            confidence = "medium"
        else:
            confidence = "low"

        # Effective year — from metadata or detected from text
        effective_year = passage.get("effective_year") or self._detect_year(text, current_year)

        # Freshness
        age_years = current_year - effective_year
        age_days  = age_years * 365
        if age_days <= FRESHNESS_CURRENT_DAYS:
            freshness_status = "current"
        elif age_days <= FRESHNESS_STALE_DAYS:
            freshness_status = "may_be_stale"
        else:
            freshness_status = "stale"

        # Section title from metadata or detected from text
        section_title = (
            passage.get("section_title")
            or self._detect_section(text)
        )

        # Jurisdiction
        jurisdiction = passage.get("jurisdiction") or country

        return {
            **passage,
            "confidence":        confidence,
            "confidence_score":  round(score, 4),
            "effective_year":    effective_year,
            "freshness_status":  freshness_status,
            "age_years":         age_years,
            "section_title":     section_title,
            "jurisdiction":      jurisdiction,
            "source_file":       source,
        }

    # ── Private: build claims from enriched passages ───────────────────────────

    def _build_claims(self, enriched: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract the 2-sentence summary from each passage and attach full provenance.
        Only includes passages with confidence >= low (eliminates noise below 0.15).
        """
        claims = []
        seen_texts: set = set()

        for p in enriched:
            if p.get("confidence_score", 0) < 0.15:
                continue

            text = p.get("text", "")
            # Dedup
            key = text[:80]
            if key in seen_texts:
                continue
            seen_texts.add(key)

            # Extract the most informative 2 sentences
            sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 20]
            summary = ". ".join(sentences[:2])
            if summary and not summary.endswith("."):
                summary += "."

            if not summary:
                continue

            claims.append({
                "claim":               summary,
                "source_file":         p["source_file"],
                "jurisdiction":        p["jurisdiction"],
                "section":             p["section_title"],
                "effective_year":      p["effective_year"],
                "freshness_status":    p["freshness_status"],
                "retrieval_confidence": p["confidence"],
                "confidence_score":    p["confidence_score"],
                "hallucination_risk":  p["confidence"] == "low",
                "supporting_text":     text[:300],
            })

        # Sort: high confidence first, then by year (newest first)
        claims.sort(
            key=lambda c: (
                {"high": 3, "medium": 2, "low": 1}[c["retrieval_confidence"]],
                c["effective_year"],
            ),
            reverse=True,
        )
        return claims[:8]  # Return top 8 most relevant

    # ── Private: detect evidence gaps ─────────────────────────────────────────

    def _detect_gaps(
        self,
        enriched: List[Dict[str, Any]],
        topic_queries: List[str],
    ) -> List[Dict[str, Any]]:
        """
        Check which mandatory compliance topics have no high/medium confidence passage.
        Returns a list of gap descriptors.
        """
        all_text_lower = " ".join(
            p.get("text", "").lower()
            for p in enriched
            if p.get("confidence") in ("high", "medium")
        )

        gaps = []
        for topic_key, keywords in MANDATORY_TOPICS.items():
            covered = any(kw in all_text_lower for kw in keywords)
            if not covered:
                gaps.append({
                    "topic":      topic_key,
                    "keywords":   keywords[:3],
                    "severity":   "warning" if topic_key in ("income_tax", "visa") else "info",
                    "message":    (
                        f"No high-confidence evidence found for '{topic_key}'. "
                        f"The compliance conclusion for this topic may not be grounded in retrieved data."
                    ),
                })

        return gaps

    # ── Private: evidence quality summary ─────────────────────────────────────

    def _summarise(
        self,
        claims: List[Dict[str, Any]],
        gaps: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Produce a machine-readable quality summary of the evidence bundle.
        """
        total    = len(claims)
        high_ct  = sum(1 for c in claims if c["retrieval_confidence"] == "high")
        med_ct   = sum(1 for c in claims if c["retrieval_confidence"] == "medium")
        low_ct   = sum(1 for c in claims if c["retrieval_confidence"] == "low")
        stale_ct = sum(1 for c in claims if c["freshness_status"] in ("may_be_stale", "stale"))
        halluc   = sum(1 for c in claims if c["hallucination_risk"])
        warning_gaps = [g for g in gaps if g["severity"] == "warning"]

        if total == 0:
            overall_quality = "no_evidence"
        elif high_ct >= 2 and not warning_gaps:
            overall_quality = "strong"
        elif high_ct + med_ct >= 2 and len(warning_gaps) <= 1:
            overall_quality = "adequate"
        elif total >= 1:
            overall_quality = "weak"
        else:
            overall_quality = "no_evidence"

        return {
            "total_claims":      total,
            "high_confidence":   high_ct,
            "medium_confidence": med_ct,
            "low_confidence":    low_ct,
            "stale_claims":      stale_ct,
            "hallucination_risk_claims": halluc,
            "evidence_gaps_count":  len(gaps),
            "warning_gaps_count":   len(warning_gaps),
            "overall_quality":   overall_quality,
            "trustworthy":       overall_quality in ("strong", "adequate"),
            "note": (
                "Evidence quality based on RAG retrieval confidence and KB data freshness. "
                "Claims with retrieval_confidence='low' should be independently verified."
            ),
        }

    # ── Private: text analysis helpers ────────────────────────────────────────

    @staticmethod
    def _detect_year(text: str, current_year: int) -> int:
        """
        Try to find a 4-digit year in the text (e.g. '2024', '2025').
        Falls back to current_year - 1 if none found.
        """
        import re
        # Look for years in range 2018–2027
        years = re.findall(r'\b(202[0-7]|201[89])\b', text)
        if years:
            return max(int(y) for y in years)
        return current_year - 1  # Conservative fallback

    @staticmethod
    def _detect_section(text: str) -> str:
        """
        Infer the section topic from keyword presence in the passage text.
        Returns a human-readable section label.
        """
        lower = text.lower()
        if any(k in lower for k in ["income tax", "tax rate", "marginal rate", "taxable income"]):
            return "Income Tax"
        if any(k in lower for k in ["visa", "employment pass", "work permit", "ep holder"]):
            return "Work Visa & Residency"
        if any(k in lower for k in ["cpf", "social security", "national insurance", "pension contribution"]):
            return "Social Security & Contributions"
        if any(k in lower for k in ["dta", "double taxation", "tax treaty", "withholding"]):
            return "Double Taxation Agreement"
        if any(k in lower for k in ["vat", "gst", "consumption tax", "sales tax"]):
            return "Indirect Tax"
        if any(k in lower for k in ["cost of living", "rent", "housing", "condo"]):
            return "Cost of Living"
        if any(k in lower for k in ["inflation", "gdp", "unemployment", "cpi"]):
            return "Macroeconomic Context"
        return "General Compliance"
