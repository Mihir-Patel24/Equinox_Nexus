'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, Shield, FileText, Globe, CheckCircle, ExternalLink,
  AlertCircle, AlertTriangle, Info, Zap, Clock, TrendingUp
} from 'lucide-react';
import { useState } from 'react';

interface ComplianceClaim {
  text: string;
  source?: string;
  section?: string;
  year?: number | string;
  confidence?: 'high' | 'medium' | 'low';
  freshness?: 'current' | 'may_be_stale' | 'stale' | string;
  grounded?: boolean;
}

interface EvidenceGap {
  topic: string;
  severity?: 'warning' | 'info';
  message?: string;
}

interface EvidenceSummary {
  overall_quality?: 'strong' | 'adequate' | 'weak' | 'no_evidence' | string;
  total_claims?: number;
  high_confidence?: number;
  medium_confidence?: number;
  stale_claims?: number;
  trustworthy?: boolean;
}

interface NexusViewProps {
  data: any;
}

// ── Evidence badge helpers ────────────────────────────────────────────────────

const CONFIDENCE_CONFIG: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  high:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'High',   icon: CheckCircle },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Medium', icon: Info },
  low:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Low',    icon: AlertTriangle },
};

const FRESHNESS_CONFIG: Record<string, { color: string; label: string }> = {
  current:       { color: '#10b981', label: 'Current' },
  may_be_stale:  { color: '#f59e0b', label: 'May be stale' },
  stale:         { color: '#ef4444', label: 'Stale' },
};

const QUALITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  strong:     { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  label: 'Strong Evidence' },
  adequate:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  label: 'Adequate Evidence' },
  weak:       { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  label: 'Weak Evidence' },
  no_evidence:{ color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   label: 'No Evidence' },
};

export function NexusView({ data }: NexusViewProps) {
  const nexus = data?.nexus;
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);

  const hasData = !!nexus;

  // v3.1 evidence-first fields
  const complianceClaims: ComplianceClaim[] = Array.isArray(nexus?.compliance_claims)
    ? nexus.compliance_claims
    : [];

  // Fallback: legacy string notes (v3.0 backward compat)
  const legacyNotes: string[] = Array.isArray(nexus?.compliance_notes)
    ? nexus.compliance_notes.filter((n: any) => typeof n === 'string')
    : nexus?.compliance_notes
      ? [nexus.compliance_notes]
      : [];

  const evidenceSummary: EvidenceSummary = nexus?.evidence_summary ?? {};
  const evidenceGaps: EvidenceGap[] = nexus?.evidence_gaps ?? [];
  const evidenceQuality: string = nexus?.evidence_quality ?? '';
  const claimCount: number = nexus?.claim_count ?? 0;

  const rawStrategy: string = nexus?.raw_strategy || nexus?.compliance_brief_excerpt || '';
  const ragSources: string[] = nexus?.rag_sources || [];
  const effectiveRate = nexus?.effective_rate ?? nexus?.effective_tax_rate ?? null;
  const grossRate = nexus?.gross_tax_rate ?? null;
  const dtaRelief = nexus?.dta_relief_applied ?? 0;
  const treatyLabel = nexus?.treaty_label ?? '—';
  const treatyStatus = nexus?.treaty_status ?? '';
  const taxRegime = nexus?.tax_regime ?? '—';
  const country = nexus?.country ?? '—';
  const visaReq = nexus?.visa_requirements ?? '—';
  const incomeAfterTax = nexus?.net_annual_income ?? null;
  const estimatedTax = nexus?.estimated_tax ?? null;

  const treatyColor =
    treatyStatus === 'highly_favorable_dta' ? '#10b981' :
    treatyStatus === 'favorable_dta' ? '#3b82f6' :
    treatyStatus === 'standard_dta' ? '#eab308' : '#ef4444';

  const qualityCfg = QUALITY_CONFIG[evidenceQuality] ?? QUALITY_CONFIG.weak;
  const hasEvidence = complianceClaims.length > 0;
  const warningGaps = evidenceGaps.filter(g => g.severity === 'warning');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: '50px', padding: '8px 20px', marginBottom: '16px'
        }}>
          <Scale size={16} color="#a855f7" />
          <span style={{ color: '#c084fc', fontSize: '13px', fontWeight: 600 }}>
            RAG-Powered · OECD Tax Database 2024 · EvidenceChain v3.1
          </span>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
          The Nexus — Tax & Compliance
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
          International tax treaties, visa requirements, and compliance intelligence
        </p>
      </motion.div>

      {!hasData ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <Scale size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '8px' }}>No compliance data</h3>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Run a simulation to see RAG-powered tax & compliance analysis</p>
        </div>
      ) : (
        <>
          {/* Evidence Quality Banner */}
          {evidenceQuality && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '12px',
                background: qualityCfg.bg,
                border: `1px solid ${qualityCfg.border}`,
                borderRadius: '16px', padding: '14px 20px', marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={16} color={qualityCfg.color} />
                <span style={{ color: qualityCfg.color, fontWeight: 700, fontSize: '14px' }}>
                  {qualityCfg.label}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
                  · {claimCount} claim{claimCount !== 1 ? 's' : ''} retrieved
                  {evidenceSummary.high_confidence != null && ` · ${evidenceSummary.high_confidence} high-confidence`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {warningGaps.map((g, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: '8px', padding: '4px 10px'
                  }}>
                    <AlertTriangle size={11} color="#f59e0b" />
                    <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600 }}>
                      No evidence: {g.topic.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tax Overview Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}
          >
            {[
              { label: 'Tax Regime', value: taxRegime, sub: country, color: '#a855f7', icon: Globe },
              {
                label: 'Effective Tax Rate',
                value: effectiveRate != null ? `${(effectiveRate * 100).toFixed(1)}%` : '—',
                sub: grossRate != null ? `Gross: ${(grossRate * 100).toFixed(1)}%` : 'After DTA',
                color: effectiveRate != null && effectiveRate < 0.25 ? '#10b981' : effectiveRate != null && effectiveRate > 0.4 ? '#ef4444' : '#eab308',
                icon: Scale
              },
              { label: 'DTA Relief Applied', value: `${(dtaRelief * 100).toFixed(0)}%`, sub: treatyLabel, color: treatyColor, icon: Shield },
              {
                label: 'Tax Treaty Savings',
                value: nexus?.treaty_savings != null ? `$${Math.round(nexus.treaty_savings).toLocaleString()}` : '—',
                sub: 'Annual DTA benefit', color: '#10b981', icon: CheckCircle
              },
              {
                label: 'Estimated Tax',
                value: estimatedTax != null ? `$${Math.round(estimatedTax).toLocaleString()}` : '—',
                sub: 'Annual liability', color: '#f59e0b', icon: FileText
              },
              {
                label: 'Net Annual Income',
                value: incomeAfterTax != null ? `$${Math.round(incomeAfterTax).toLocaleString()}` : '—',
                sub: 'Post-tax & DTA', color: '#10b981', icon: TrendingUp
              },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Icon size={14} color={m.color} />
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px', wordBreak: 'break-word' }}>{m.value}</div>
                  <div style={{ fontSize: '12px', color: m.color, fontWeight: 500 }}>{m.sub}</div>
                </div>
              );
            })}
          </motion.div>

          {/* Tax Rate Visual Breakdown */}
          {grossRate != null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(15,15,30,0.9) 100%)',
                border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: '24px', padding: '28px', marginBottom: '24px'
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '20px' }}>Rate Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Income Tax', value: nexus.income_tax_rate, color: '#ef4444' },
                  { label: 'Social Security', value: nexus.social_security_rate, color: '#f97316' },
                  { label: '− DTA Relief', value: -dtaRelief, color: '#10b981' },
                  { label: 'VAT', value: nexus.vat_rate, color: '#6b7280' },
                ].filter(r => r.value != null).map((r, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{
                      height: '6px', borderRadius: '3px', background: r.color, opacity: 0.8,
                      width: `${Math.min(100, Math.abs(r.value * 100 / 0.5))}%`,
                      margin: '0 auto 8px',
                      transform: r.value < 0 ? 'scaleX(-1)' : 'none'
                    }} />
                    <div style={{ fontSize: '20px', fontWeight: 800, color: r.value < 0 ? '#10b981' : 'white' }}>
                      {r.value < 0 ? '−' : ''}{(Math.abs(r.value) * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>{r.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Visa & Treaty */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}
          >
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <FileText size={18} color="#3b82f6" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Visa Pathway</h3>
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '12px' }}>
                <p style={{ color: '#60a5fa', fontWeight: 600, fontSize: '15px' }}>{visaReq}</p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Category derived from RAG knowledge base passages</p>
            </div>

            <div style={{
              background: `linear-gradient(135deg, ${treatyColor}0a 0%, rgba(15,15,30,0.9) 100%)`,
              border: `1px solid ${treatyColor}30`,
              borderRadius: '20px', padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Shield size={18} color={treatyColor} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Tax Treaty Status</h3>
              </div>
              <div style={{ padding: '12px 16px', background: `${treatyColor}15`, borderRadius: '12px', border: `1px solid ${treatyColor}30`, marginBottom: '12px' }}>
                <p style={{ color: treatyColor, fontWeight: 600, fontSize: '15px' }}>{treatyLabel}</p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Relief rate: {(dtaRelief * 100).toFixed(0)}% of gross tax</p>
            </div>
          </motion.div>

          {/* ── Evidence-Grounded Compliance Claims (v3.1) ── */}
          {hasEvidence ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{
                background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)',
                borderRadius: '24px', padding: '28px', marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} color="#a855f7" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
                    Evidence-Grounded Compliance Claims
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: '#a855f7', fontWeight: 600, background: 'rgba(168,85,247,0.15)', padding: '3px 10px', borderRadius: '20px' }}>
                  {complianceClaims.length} sourced claim{complianceClaims.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {complianceClaims.map((claim, i) => {
                  const confCfg = CONFIDENCE_CONFIG[claim.confidence ?? 'low'] ?? CONFIDENCE_CONFIG.low;
                  const freshCfg = FRESHNESS_CONFIG[claim.freshness ?? ''] ?? { color: 'rgba(255,255,255,0.3)', label: 'Unknown' };
                  const ConfIcon = confCfg.icon;
                  const isOpen = expandedClaim === i;

                  return (
                    <div
                      key={i}
                      onClick={() => setExpandedClaim(isOpen ? null : i)}
                      style={{
                        background: `linear-gradient(135deg, ${confCfg.color}08 0%, rgba(15,15,30,0.9) 100%)`,
                        border: `1px solid ${isOpen ? confCfg.color + '35' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '14px', padding: '16px 18px',
                        cursor: 'pointer', transition: 'border-color 0.2s'
                      }}
                    >
                      {/* Claim header row */}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <ConfIcon size={14} color={confCfg.color} style={{ marginTop: '3px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                            {claim.text.length > 250 ? claim.text.slice(0, 250) + '…' : claim.text}
                          </p>
                        </div>
                      </div>

                      {/* Provenance badge row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', paddingLeft: '26px' }}>
                        {/* Confidence */}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: confCfg.bg, color: confCfg.color }}>
                          {confCfg.label} confidence
                        </span>

                        {/* Freshness */}
                        {claim.freshness && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: freshCfg.color }}>
                            <Clock size={9} />
                            {freshCfg.label}
                          </span>
                        )}

                        {/* Year */}
                        {claim.year && (
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                            {claim.year}
                          </span>
                        )}

                        {/* Section */}
                        {claim.section && claim.section !== 'General' && (
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}>
                            {claim.section}
                          </span>
                        )}

                        {/* Hallucination risk warning */}
                        {claim.confidence === 'low' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                            <AlertTriangle size={9} /> Verify independently
                          </span>
                        )}
                      </div>

                      {/* Expanded: source file */}
                      <AnimatePresence>
                        {isOpen && claim.source && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ marginTop: '10px', paddingLeft: '26px' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', width: 'fit-content' }}>
                              <ExternalLink size={11} color="rgba(255,255,255,0.35)" />
                              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{claim.source}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <p style={{ marginTop: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.25)', paddingLeft: '2px' }}>
                Click any claim to see its source KB file · Claims are ranked by retrieval confidence
              </p>
            </motion.div>
          ) : legacyNotes.length > 0 || rawStrategy ? (
            /* Legacy fallback — string notes */
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '24px', padding: '28px', marginBottom: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <AlertCircle size={18} color="#a855f7" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>RAG Compliance Intelligence</h3>
                {ragSources.length > 0 && (
                  <span style={{ fontSize: '11px', color: '#a855f7', fontWeight: 600, background: 'rgba(168,85,247,0.15)', padding: '3px 10px', borderRadius: '20px' }}>
                    {ragSources.length} source{ragSources.length > 1 ? 's' : ''} retrieved
                  </span>
                )}
              </div>
              {legacyNotes.length > 0 ? (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {legacyNotes.map((note: string, i: number) => (
                    <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                      <CheckCircle size={14} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.6 }}>
                        {note.length > 300 ? note.slice(0, 300) + '…' : note}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : rawStrategy ? (
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.7 }}>
                  {rawStrategy.length > 600 ? rawStrategy.slice(0, 600) + '…' : rawStrategy}
                </p>
              ) : null}
            </motion.div>
          ) : null}

          {/* Evidence Gaps */}
          {evidenceGaps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '20px 24px', marginBottom: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <AlertTriangle size={16} color="#f59e0b" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24' }}>Evidence Gaps</h3>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Topics where no KB evidence was retrieved</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {evidenceGaps.map((gap, i) => (
                  <div key={i} style={{
                    padding: '6px 12px',
                    background: gap.severity === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${gap.severity === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '12px', color: gap.severity === 'warning' ? '#fbbf24' : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                      {gap.topic.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* RAG Sources */}
          {ragSources.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Knowledge Base Sources Retrieved
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ragSources.map((src: string, i: number) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}>
                    <ExternalLink size={12} color="rgba(255,255,255,0.4)" />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{src}</span>
                  </div>
                ))}
              </div>
              {nexus?.data_source && (
                <p style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                  {nexus.data_source}
                </p>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
