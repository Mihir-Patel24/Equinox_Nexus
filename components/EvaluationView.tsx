'use client';

import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from 'recharts';
import {
  FlaskConical, CheckCircle, AlertTriangle, XCircle, Zap, Shield,
  Brain, Target, BarChart3, Clock, FileText, ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface EvaluationViewProps {
  data: any;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRADE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  A: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
  B: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  C: { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.25)' },
  D: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)' },
  F: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)' },
};

const MetricBar = ({
  label, value, color, icon: Icon,
}: {
  label: string; value: number; color: string; icon: any;
}) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color }}>{value.toFixed(1)}%</span>
    </div>
    <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: '3px' }}
      />
    </div>
  </div>
);

const TagList = ({ items, color, emptyLabel }: { items: string[]; color: string; emptyLabel: string }) => {
  if (!items || items.length === 0) {
    return <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{emptyLabel}</span>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.map((item, i) => (
        <span key={i} style={{
          fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '6px',
          background: `${color}15`, color, border: `1px solid ${color}25`,
        }}>
          {item.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  );
};

export function EvaluationView({ data }: EvaluationViewProps) {
  const [evalReport, setEvalReport] = useState<any>(data?.evaluation_report ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Auto-fetch evaluation if not pre-populated
  useEffect(() => {
    if (evalReport || !data?.rawResults) return;
    setLoading(true);
    fetch(`${API_BASE}/evaluate/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulation_result: data.rawResults }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(d => { setEvalReport(d.report); setError(null); })
      .catch(e => setError(`Could not load evaluation: ${e}`))
      .finally(() => setLoading(false));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasData = !!evalReport;
  const report  = evalReport ?? {};

  const overall = report.overall_score ?? 0;
  const grade   = report.overall_grade ?? 'F';
  const label   = report.overall_label ?? '—';
  const rag     = report.rag     ?? {};
  const xai     = report.xai     ?? {};
  const agents  = report.agents  ?? {};
  const compScores = report.component_scores ?? {};
  const recs    = report.recommendations ?? [];

  const gradeCfg = GRADE_CONFIG[grade] ?? GRADE_CONFIG.F;

  // Radar data
  const radarData = [
    { subject: 'RAG Faith.',   value: compScores.rag_faithfulness   ?? 0, fullMark: 100 },
    { subject: 'RAG Coverage', value: compScores.rag_topic_coverage ?? 0, fullMark: 100 },
    { subject: 'RAG Freshness',value: compScores.rag_freshness      ?? 0, fullMark: 100 },
    { subject: 'XAI Factors',  value: compScores.xai_factor_coverage ?? 0, fullMark: 100 },
    { subject: 'XAI CI',       value: compScores.xai_ci_quality     ?? 0, fullMark: 100 },
    { subject: 'Agents',       value: compScores.agent_completeness ?? 0, fullMark: 100 },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)',
          borderRadius: '50px', padding: '8px 20px', marginBottom: '16px'
        }}>
          <FlaskConical size={16} color="#06b6d4" />
          <span style={{ color: '#22d3ee', fontSize: '13px', fontWeight: 600 }}>
            RAG Faithfulness · XAI Coverage · Agent Completeness
          </span>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
          Evaluation Framework
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
          Research-grade quality metrics for every simulation
        </p>
      </motion.div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <FlaskConical size={20} style={{ animation: 'spin 1.5s linear infinite' }} />
            <span>Running evaluation pipeline…</span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '20px 24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <XCircle size={16} color="#ef4444" />
            <span style={{ color: '#f87171', fontSize: '14px' }}>{error}</span>
          </div>
        </div>
      )}

      {!hasData && !loading && !error && (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <FlaskConical size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '8px' }}>No evaluation data</h3>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Run a simulation to automatically evaluate its quality</p>
        </div>
      )}

      {hasData && (
        <>
          {/* Overall Score + Grade */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{
              display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px',
              marginBottom: '24px', alignItems: 'stretch'
            }}
          >
            {/* Grade Card */}
            <div style={{
              background: `linear-gradient(135deg, ${gradeCfg.bg} 0%, rgba(15,15,30,0.95) 100%)`,
              border: `1px solid ${gradeCfg.border}`,
              borderRadius: '24px', padding: '36px 28px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '80px', fontWeight: 900, color: gradeCfg.color, lineHeight: 1, marginBottom: '8px' }}>
                {grade}
              </div>
              <div style={{ fontSize: '38px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
                {overall.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>/ 100</div>
              <div style={{
                marginTop: '14px', padding: '6px 16px',
                background: gradeCfg.bg, borderRadius: '20px',
                fontSize: '13px', color: gradeCfg.color, fontWeight: 700
              }}>
                {label}
              </div>
              {report.evaluated_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '12px' }}>
                  <Clock size={11} color="rgba(255,255,255,0.3)" />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(report.evaluated_at).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {/* Radar Chart */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px', padding: '24px',
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                Quality Radar
              </h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
                6-axis quality decomposition
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Component Score Bars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
              marginBottom: '24px'
            }}
          >
            {/* RAG Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.07) 0%, rgba(15,15,30,0.95) 100%)',
              border: '1px solid rgba(168,85,247,0.18)',
              borderRadius: '20px', padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Shield size={16} color="#a855f7" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>RAG Faithfulness</h3>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                  background: 'rgba(168,85,247,0.15)', color: '#c084fc'
                }}>
                  {rag.total_claims ?? 0} claims
                </span>
              </div>

              <MetricBar label="Faithfulness Rate"    value={compScores.rag_faithfulness   ?? 0} color="#10b981" icon={CheckCircle} />
              <MetricBar label="Topic Coverage"       value={compScores.rag_topic_coverage ?? 0} color="#3b82f6" icon={Target} />
              <MetricBar label="Freshness Rate"       value={compScores.rag_freshness      ?? 0} color="#06b6d4" icon={Clock} />

              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                {/* Hallucination risk */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <AlertTriangle size={12} color={rag.hallucination_risk_rate > 0.3 ? '#ef4444' : '#10b981'} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    Hallucination risk:
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: rag.hallucination_risk_rate > 0.3 ? '#ef4444' : '#10b981' }}>
                    {((rag.hallucination_risk_rate ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Covered topics */}
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Covered topics</p>
                  <TagList items={rag.covered_topics ?? []} color="#10b981" emptyLabel="None" />
                </div>

                {/* Uncovered topics */}
                {(rag.uncovered_topics ?? []).length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Uncovered topics</p>
                    <TagList items={rag.uncovered_topics} color="#ef4444" emptyLabel="None" />
                  </div>
                )}
              </div>
            </div>

            {/* XAI Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(15,15,30,0.95) 100%)',
              border: '1px solid rgba(59,130,246,0.18)',
              borderRadius: '20px', padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Brain size={16} color="#3b82f6" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>XAI Coverage</h3>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                  background: 'rgba(59,130,246,0.15)', color: '#60a5fa'
                }}>
                  {xai.factor_count ?? 0}/5 factors
                </span>
              </div>

              <MetricBar label="Factor Coverage"       value={compScores.xai_factor_coverage ?? 0} color="#a855f7" icon={BarChart3} />
              <MetricBar label="CI Quality"            value={compScores.xai_ci_quality      ?? 0} color="#06b6d4" icon={Zap} />
              <MetricBar label="Narrative Completeness" value={compScores.xai_narrative       ?? 0} color="#f59e0b" icon={FileText} />

              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                {/* CI details */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px' }}>CI Width</p>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
                      {xai.confidence_interval_width ?? '—'} pts
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px' }}>CI Quality</p>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#06b6d4' }}>
                      {xai.confidence_quality ?? '—'}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px' }}>Viability Score</p>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                      {xai.viability_score?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Covered factors */}
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Covered factors</p>
                  <TagList items={xai.covered_factors ?? []} color="#a855f7" emptyLabel="None" />
                </div>

                {/* Missing factors */}
                {(xai.missing_factors ?? []).length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Missing factors</p>
                    <TagList items={xai.missing_factors} color="#f59e0b" emptyLabel="None" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Agent Completeness */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '24px', marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <Zap size={16} color="#eab308" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Agent Completeness</h3>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                background: 'rgba(234,179,8,0.15)', color: '#fbbf24'
              }}>
                {((agents.completeness_score ?? 0) * 100).toFixed(0)}% complete
              </span>
              {agents.twin_created && (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  ✓ Twin persisted
                </span>
              )}
              {agents.chronos_mc_quality === 'full_5yr' && (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                  ✓ MC full 5yr ({(agents.n_simulations ?? 0).toLocaleString()} paths)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {['actuary', 'fiscal', 'nexus', 'chronos', 'xai', 'decision'].map(name => {
                const present = (agents.agents_present ?? []).includes(name);
                return (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '8px 14px', borderRadius: '10px',
                    background: present ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${present ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    {present
                      ? <CheckCircle size={13} color="#10b981" />
                      : <XCircle size={13} color="#ef4444" />
                    }
                    <span style={{ fontSize: '13px', fontWeight: 600, color: present ? '#d1fae5' : '#fca5a5', textTransform: 'capitalize' }}>
                      {name === 'xai' ? 'XAI' : name === 'decision' ? 'Decision Intel' : name.charAt(0).toUpperCase() + name.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Recommendations */}
          {recs.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '14px' }}>
                Evaluation Recommendations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recs.map((rec: string, i: number) => {
                  const isGood = rec.toLowerCase().includes('passed') || rec.toLowerCase().includes('production');
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      padding: '14px 16px', borderRadius: '14px',
                      background: isGood ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.07)',
                      border: `1px solid ${isGood ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}>
                      {isGood
                        ? <CheckCircle size={14} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                        : <ChevronRight size={14} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                      }
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                        {rec}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                  🔬 Weighted formula: RAG Faithfulness 35% · Topic Coverage 15% · XAI Factors 20% · CI Quality 10% · Narrative 10% · Agents 10%
                </span>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
