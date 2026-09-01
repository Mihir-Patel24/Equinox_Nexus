'use client';

import { motion } from 'framer-motion';
import { Heart, Shield, Wind, Smile, Activity, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ActuaryViewProps {
  data: any;
}

function ScoreArc({ value, color, size = 120 }: { value: number; color: string; size?: number }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  );
}

export function ActuaryView({ data }: ActuaryViewProps) {
  const actuary = data?.actuary;
  const hasData = !!actuary;

  const aqi = actuary?.air_quality_index ?? null;
  const safety = actuary?.safety_score ?? null;
  const healthcare = actuary?.healthcare_score ?? null;
  const happiness = actuary?.happiness_index ?? null;
  const composite = actuary?.composite_score ?? null;
  const riskRating = actuary?.overall_risk_rating ?? '—';
  const notes = actuary?.notes ?? '';
  const dataSource = actuary?.data_source ?? '';
  const waitTime = actuary?.healthcare_wait_time_hours ?? null;

  const riskConfig: Record<string, { color: string; bg: string; label: string }> = {
    Low: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: '✓ Low Risk' },
    Medium: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', label: '⚠ Medium Risk' },
    High: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: '✗ High Risk' },
  };
  const risk = riskConfig[riskRating] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: riskRating };

  // AQI interpretation
  const aqiStatus =
    aqi == null ? '—' :
    aqi <= 50 ? 'Good' :
    aqi <= 100 ? 'Moderate' :
    aqi <= 150 ? 'Unhealthy for Sensitive' :
    aqi <= 200 ? 'Unhealthy' : 'Very Unhealthy';

  const aqiColor =
    aqi == null ? '#6b7280' :
    aqi <= 50 ? '#10b981' :
    aqi <= 100 ? '#eab308' :
    aqi <= 150 ? '#f97316' : '#ef4444';

  const metrics = [
    {
      label: 'Safety Score',
      value: safety,
      color: safety == null ? '#6b7280' : safety >= 80 ? '#10b981' : safety >= 60 ? '#eab308' : '#ef4444',
      icon: Shield,
      description: 'Crime index, political stability, personal safety'
    },
    {
      label: 'Healthcare Quality',
      value: healthcare,
      color: healthcare == null ? '#6b7280' : healthcare >= 80 ? '#10b981' : healthcare >= 60 ? '#eab308' : '#ef4444',
      icon: Heart,
      description: waitTime != null ? `Avg wait time: ${waitTime}h` : 'Hospital access & quality'
    },
    {
      label: 'Happiness Index',
      value: happiness,
      color: happiness == null ? '#6b7280' : happiness >= 80 ? '#10b981' : happiness >= 65 ? '#eab308' : '#ef4444',
      icon: Smile,
      description: 'WHO + UN World Happiness Report'
    },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: '50px', padding: '8px 20px', marginBottom: '16px'
        }}>
          <Activity size={16} color="#10b981" />
          <span style={{ color: '#34d399', fontSize: '13px', fontWeight: 600 }}>
            QoL Model + Open-Meteo AQI · Live Data
          </span>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
          The Actuary — Quality of Life
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
          Health risk, environmental quality, and lifestyle analysis
        </p>
      </motion.div>

      {!hasData ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <Activity size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '8px' }}>No risk data yet</h3>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Run a simulation to see QoL & health risk analysis</p>
        </div>
      ) : (
        <>
          {/* Top Row: Composite Score + Risk Rating + AQI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}
          >
            {/* Composite Score */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(15,15,30,0.95) 100%)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '24px', padding: '28px',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <ScoreArc value={composite ?? 0} color="#10b981" />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'white' }}>
                    {composite != null ? composite.toFixed(0) : '—'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>/100</span>
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                Composite QoL Score
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', textAlign: 'center' }}>
                Weighted across all dimensions
              </div>
            </div>

            {/* Risk Rating */}
            <div style={{
              background: `linear-gradient(135deg, ${risk.color}12 0%, rgba(15,15,30,0.95) 100%)`,
              border: `1px solid ${risk.color}30`,
              borderRadius: '24px', padding: '28px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: risk.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px'
              }}>
                {riskRating === 'Low' ? <CheckCircle size={28} color={risk.color} /> :
                 riskRating === 'High' ? <AlertCircle size={28} color={risk.color} /> :
                 <Info size={28} color={risk.color} />}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'white', marginBottom: '6px' }}>
                {riskRating}
              </div>
              <div style={{ fontSize: '14px', color: risk.color, fontWeight: 600, marginBottom: '8px' }}>
                {risk.label}
              </div>
              {actuary?.city && (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                  {actuary.city}
                </div>
              )}
            </div>

            {/* AQI */}
            <div style={{
              background: `linear-gradient(135deg, ${aqiColor}12 0%, rgba(15,15,30,0.95) 100%)`,
              border: `1px solid ${aqiColor}30`,
              borderRadius: '24px', padding: '28px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <Wind size={32} color={aqiColor} style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '38px', fontWeight: 900, color: 'white', marginBottom: '4px' }}>
                {aqi ?? '—'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                AQI
              </div>
              <div style={{
                padding: '5px 14px', borderRadius: '20px',
                background: `${aqiColor}20`,
                fontSize: '12px', color: aqiColor, fontWeight: 600
              }}>
                {aqiStatus}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '8px', textAlign: 'center' }}>
                Open-Meteo live data
              </div>
            </div>
          </motion.div>

          {/* Sub-Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}
          >
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px', padding: '24px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <div style={{ position: 'relative', marginBottom: '14px' }}>
                    <ScoreArc value={m.value ?? 0} color={m.color} size={96} />
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: 'white' }}>
                        {m.value != null ? m.value.toFixed(0) : '—'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Icon size={14} color={m.color} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{m.label}</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center' }}>
                    {m.description}
                  </p>
                </div>
              );
            })}
          </motion.div>

          {/* Notes + Financials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}
          >
            {/* Actuary Notes */}
            {notes && (
              <div style={{
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                borderRadius: '20px', padding: '24px'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
                  🤖 Actuary Notes
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.7 }}>{notes}</p>
              </div>
            )}

            {/* Financial Impact */}
            {(actuary?.net_annual_savings != null || actuary?.monthly_expenses != null) && (
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px', padding: '24px'
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
                  💰 Financial Impact
                </h3>
                {[
                  { label: 'Monthly Expenses', value: actuary.monthly_expenses != null ? `$${Math.round(actuary.monthly_expenses).toLocaleString()}` : '—', color: '#f59e0b' },
                  { label: 'Annual Expenses', value: actuary.annual_expenses != null ? `$${Math.round(actuary.annual_expenses).toLocaleString()}` : '—', color: '#f97316' },
                  { label: 'Net Annual Savings', value: actuary.net_annual_savings != null ? `$${Math.round(actuary.net_annual_savings).toLocaleString()}` : '—', color: '#10b981' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 700, fontSize: '15px' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Data Source */}
          {dataSource && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                📊 Data source: {dataSource}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
