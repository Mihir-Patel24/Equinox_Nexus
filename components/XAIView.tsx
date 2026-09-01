'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import { Brain, Target, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Zap, AlertTriangle, RefreshCw, Clock, ArrowRight, Minus } from 'lucide-react';
import { useState } from 'react';

interface XAIViewProps {
  data: any;
}

const FACTOR_COLORS: Record<string, string> = {
  'Tax Efficiency': '#10b981',
  'Cost of Living': '#3b82f6',
  'Quality of Life': '#a855f7',
  'FX Risk': '#f59e0b',
  'Savings Potential': '#06b6d4',
};

const DIRECTION_LABEL: Record<string, { label: string; color: string }> = {
  positive: { label: '▲ Positive driver', color: '#10b981' },
  negative: { label: '▼ Negative driver', color: '#ef4444' },
  neutral:  { label: '● Neutral',         color: '#6b7280' },
};

// ── Drift section helpers ─────────────────────────────────────────────────────

const DeltaCard = ({
  label, before, after, change, format,
}: {
  label: string; before: number; after: number; change: number; format: (v: number) => string;
}) => {
  const improved = change > 0;
  const neutral  = Math.abs(change) < 0.001;
  const color    = neutral ? '#6b7280' : improved ? '#10b981' : '#ef4444';
  const Icon     = neutral ? Minus : improved ? TrendingUp : TrendingDown;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>{format(before)}</span>
        <ArrowRight size={12} color="rgba(255,255,255,0.25)" />
        <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>{format(after)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: '12px', fontWeight: 700, color }}>
          {neutral ? 'Unchanged' : `${change > 0 ? '+' : ''}${format(change)}`}
        </span>
      </div>
    </div>
  );
};

const formatUSD  = (v: number) => `$${Math.round(v).toLocaleString()}`;
const formatPct  = (v: number) => `${(v * 100).toFixed(1)}%`;
const formatPts  = (v: number) => `${v.toFixed(1)} pts`;
const formatMult = (v: number) => `${v.toFixed(2)}×`;

export function XAIView({ data }: XAIViewProps) {
  const xai  = data?.xai;
  const drift = data?.drift_report;
  const [expandedFactor, setExpandedFactor] = useState<number | null>(null);
  const [driftExpanded, setDriftExpanded] = useState(true);

  const hasData  = xai && Array.isArray(xai.factors) && xai.factors.length > 0;
  const hasDrift = drift && (drift.latest_drift_explanation || drift.auto_resimulations > 0);

  const finalScore = xai?.final_score ?? 0;
  const confidence = xai?.confidence || {};
  const factors    = xai?.factors || [];
  const narrative  = xai?.narrative || '';

  const scoreColor = finalScore >= 75 ? '#10b981' : finalScore >= 55 ? '#eab308' : '#ef4444';
  const scoreLabel = finalScore >= 75 ? 'Highly Favorable' : finalScore >= 55 ? 'Moderate' : 'Challenging';

  const chartData = factors.map((f: any) => ({
    name:         f.name,
    contribution: Math.max(0, f.contribution ?? 0),
    weight:       Math.round((f.weight ?? 0) * 100),
    direction:    f.direction,
    explanation:  f.explanation,
  }));

  const radius       = 72;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference - (finalScore / 100) * circumference;

  // Drift section data
  const driftExpl   = drift?.latest_drift_explanation ?? {};
  const vTrend: number[]  = drift?.viability_trend ?? [];
  const autoResims  = drift?.auto_resimulations ?? 0;
  const vbDelta     = driftExpl?.viability_delta ?? {};
  const savDelta    = driftExpl?.savings_delta ?? {};
  const taxDelta    = driftExpl?.tax_delta ?? {};
  const colDelta    = driftExpl?.col_delta ?? {};
  const triggeredBy: string[] = driftExpl?.triggered_by ?? [];
  const mostImpacted = driftExpl?.most_impacted_factor ?? '';
  const driftConf   = driftExpl?.confidence ?? '';
  const driftNarrative  = driftExpl?.narrative ?? '';
  const driftRec    = driftExpl?.recommendation ?? '';
  const driftFresh  = driftExpl?.data_freshness ?? '';

  const confColor   = driftConf === 'high' ? '#10b981' : driftConf === 'medium' ? '#f59e0b' : '#6b7280';

  // Build sparkline for viability trend
  const sparkData = vTrend.map((v, i) => ({ i: `Run ${i + 1}`, v }));
  const trendDown = vTrend.length >= 2 && vTrend[vTrend.length - 1] < vTrend[0];
  const trendColor = trendDown ? '#ef4444' : '#10b981';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '40px' }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)',
          borderRadius: '50px', padding: '8px 20px', marginBottom: '16px'
        }}>
          <Brain size={16} color="#a855f7" />
          <span style={{ color: '#c084fc', fontSize: '13px', fontWeight: 600 }}>
            SHAP-Inspired Factor Decomposition
          </span>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
          XAI — Explainable Intelligence
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
          Understand exactly why this score was computed
        </p>
      </motion.div>

      {/* ── Twin Drift Report Banner ── */}
      {hasDrift && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(15,15,30,0.95) 100%)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '20px', marginBottom: '24px', overflow: 'hidden',
          }}
        >
          {/* Banner header */}
          <div
            onClick={() => setDriftExpanded(!driftExpanded)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b',
                boxShadow: '0 0 8px #f59e0b', animation: 'pulse 2s infinite',
              }} />
              <RefreshCw size={16} color="#f59e0b" />
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '15px' }}>
                Twin Auto-Updated — {autoResims} Re-simulation{autoResims !== 1 ? 's' : ''} Performed
              </span>
              {driftConf && (
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                  background: `${confColor}20`, color: confColor,
                }}>
                  {driftConf} confidence
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {driftFresh && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={11} color="rgba(255,255,255,0.3)" />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                    {new Date(driftFresh).toLocaleString()}
                  </span>
                </div>
              )}
              {driftExpanded
                ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" />
                : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
              }
            </div>
          </div>

          <AnimatePresence>
            {driftExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ padding: '0 24px 24px' }}
              >
                {/* Triggers */}
                {triggeredBy.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>
                      Triggered by:
                    </span>
                    {triggeredBy.map((t, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '8px',
                        background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                      }}>
                        <Zap size={11} color="#f59e0b" />
                        <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Delta cards */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px', marginBottom: '20px',
                }}>
                  {vbDelta.before != null && (
                    <DeltaCard
                      label="Viability Score" format={formatPts}
                      before={vbDelta.before} after={vbDelta.after} change={vbDelta.change}
                    />
                  )}
                  {savDelta.before != null && (
                    <DeltaCard
                      label="Annual Savings" format={formatUSD}
                      before={savDelta.before} after={savDelta.after} change={savDelta.change}
                    />
                  )}
                  {taxDelta.before != null && (
                    <DeltaCard
                      label="Effective Tax" format={formatPct}
                      before={taxDelta.before} after={taxDelta.after} change={-taxDelta.change}
                    />
                  )}
                  {colDelta.before != null && (
                    <DeltaCard
                      label="Cost of Living" format={formatMult}
                      before={colDelta.before} after={colDelta.after} change={-colDelta.change}
                    />
                  )}
                </div>

                {/* Most impacted + viability sparkline */}
                <div style={{ display: 'grid', gridTemplateColumns: sparkData.length >= 2 ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '20px' }}>
                  {mostImpacted && (
                    <div style={{
                      padding: '16px', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
                    }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Most Impacted Factor
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '8px 14px', borderRadius: '10px',
                        background: `${FACTOR_COLORS[mostImpacted] ?? '#667eea'}18`,
                        border: `1px solid ${FACTOR_COLORS[mostImpacted] ?? '#667eea'}35`,
                      }}>
                        <AlertTriangle size={14} color={FACTOR_COLORS[mostImpacted] ?? '#667eea'} />
                        <span style={{ fontSize: '15px', fontWeight: 700, color: FACTOR_COLORS[mostImpacted] ?? '#667eea' }}>
                          {mostImpacted}
                        </span>
                      </div>
                    </div>
                  )}

                  {sparkData.length >= 2 && (
                    <div style={{
                      padding: '16px', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
                    }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Viability Trend Across Re-Sims
                      </div>
                      <ResponsiveContainer width="100%" height={60}>
                        <LineChart data={sparkData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                          <Line
                            type="monotone" dataKey="v" stroke={trendColor}
                            strokeWidth={2.5} dot={{ r: 3, fill: trendColor }} animationDuration={800}
                          />
                          <ReferenceLine y={60} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                        </LineChart>
                      </ResponsiveContainer>
                      <div style={{ fontSize: '11px', color: trendColor, fontWeight: 600, textAlign: 'right', marginTop: '2px' }}>
                        {trendDown ? '▼ Declining' : '▲ Improving'} over {sparkData.length} re-simulations
                      </div>
                    </div>
                  )}
                </div>

                {/* Narrative + Recommendation */}
                {driftNarrative && (
                  <div style={{
                    padding: '16px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', marginBottom: '12px',
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      AI Analysis
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                      {driftNarrative}
                    </p>
                  </div>
                )}
                {driftRec && (
                  <div style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    padding: '14px 16px', background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px',
                  }}>
                    <Target size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>
                      <strong style={{ color: '#10b981' }}>Recommendation: </strong>{driftRec}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {!hasData ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <Brain size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '8px' }}>No XAI data</h3>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Run a simulation to see the AI factor decomposition</p>
        </div>
      ) : (
        <>
          {/* Score + Confidence Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: 'grid', gridTemplateColumns: '300px 1fr',
              gap: '24px', marginBottom: '24px',
              alignItems: 'stretch'
            }}
          >
            {/* Viability Ring */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(15,15,30,0.95) 100%)',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '24px', padding: '32px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ position: 'relative', width: '180px', height: '180px', marginBottom: '20px' }}>
                <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                  <circle
                    cx="90" cy="90" r={radius} fill="none"
                    stroke={scoreColor} strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1.2s ease-out, stroke 0.5s' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '42px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                    {Math.round(finalScore)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>/100</div>
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: scoreColor, marginBottom: '8px' }}>
                {scoreLabel}
              </div>
              {confidence.lower != null && confidence.upper != null && (
                <div style={{
                  padding: '8px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                    90% Confidence Interval
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
                    {confidence.lower.toFixed(1)} — {confidence.upper.toFixed(1)}
                  </div>
                </div>
              )}
            </div>

            {/* Executive Summary */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px', padding: '32px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Target size={18} color="#a855f7" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
                  AI Executive Summary
                </h3>
              </div>
              <p style={{
                color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.8,
                fontStyle: narrative ? 'normal' : 'italic'
              }}>
                {narrative || 'No executive summary available. Run a simulation to get the AI analysis.'}
              </p>
            </div>
          </motion.div>

          {/* Factor Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(15,15,30,0.95) 100%)',
              border: '1px solid rgba(168,85,247,0.15)',
              borderRadius: '24px', padding: '32px', marginBottom: '24px'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                Factor Contribution Breakdown
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                Each factor's contribution to the final viability score (SHAP-inspired weights)
              </p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 60, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 35]} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: 'rgba(10,10,25,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 16px' }}>
                        <p style={{ color: 'white', fontWeight: 700, marginBottom: '4px' }}>{d.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Score contribution: {d.contribution.toFixed(1)} pts</p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Weight: {d.weight}%</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="contribution" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {chartData.map((entry: any, i: number) => (
                    <Cell key={i} fill={FACTOR_COLORS[entry.name] || '#667eea'} />
                  ))}
                  <LabelList dataKey="contribution" position="right"
                    formatter={(v: number) => `${v.toFixed(1)} pts`}
                    style={{ fill: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Factor Detail Cards (expandable) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
              Factor Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {factors.map((f: any, i: number) => {
                const color = FACTOR_COLORS[f.name] || '#667eea';
                const dir   = DIRECTION_LABEL[f.direction] || DIRECTION_LABEL.neutral;
                const isOpen = expandedFactor === i;
                return (
                  <div
                    key={i}
                    onClick={() => setExpandedFactor(isOpen ? null : i)}
                    style={{
                      background: `linear-gradient(135deg, ${color}0a 0%, rgba(15,15,30,0.9) 100%)`,
                      border: `1px solid ${isOpen ? color + '40' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '16px', padding: '18px 22px',
                      cursor: 'pointer', transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>{f.name}</span>
                        <span style={{ fontSize: '12px', color: dir.color, fontWeight: 500 }}>{dir.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>
                            {(f.contribution ?? 0).toFixed(1)}
                          </span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '4px' }}>pts</span>
                        </div>
                        <div style={{ padding: '4px 10px', background: `${color}20`, borderRadius: '8px' }}>
                          <span style={{ fontSize: '12px', color, fontWeight: 600 }}>{Math.round((f.weight ?? 0) * 100)}% weight</span>
                        </div>
                        {isOpen ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
                      </div>
                    </div>
                    {isOpen && f.explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: 1.7 }}>
                          {f.explanation}
                        </p>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
