'use client';

import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, AlertTriangle, Shield, Zap, BarChart3, Info } from 'lucide-react';

interface ChronosViewProps {
  data: any;
}

const formatK = (v: number) =>
  v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` :
  v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${Math.round(v)}`;

const BandTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10, 10, 25, 0.97)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '14px',
      padding: '14px 18px',
      backdropFilter: 'blur(20px)',
      minWidth: '180px'
    }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '8px' }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.stroke || entry.fill }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', minWidth: '60px' }}>{entry.name}</span>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>{formatK(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function ChronosView({ data }: ChronosViewProps) {
  const chronos = data?.chronos;
  const paths = chronos?.simulation_paths || {};
  const riskMetrics = chronos?.risk_metrics || {};
  const finalStats = chronos?.final_year_stats || {};
  const scenarios = chronos?.scenarios || [];
  const years = paths.years || [1, 2, 3, 4, 5];

  const hasData = chronos && years.length > 0;

  const chartData = years.map((yr: number, i: number) => ({
    year: `Year ${yr}`,
    p95: paths.p95?.[i],
    p75: paths.p75?.[i],
    p50: paths.p50?.[i],
    p25: paths.p25?.[i],
    p5: paths.p5?.[i],
  }));

  const scenarioColors: Record<string, string> = {
    'Severe Downside': '#ef4444',
    'Mild Downside': '#f97316',
    'Base Case': '#10b981',
    'Upside Case': '#3b82f6',
    'Bull Case': '#a855f7',
  };

  const getScenarioColor = (name: string) => {
    for (const key in scenarioColors) {
      if (name.includes(key)) return scenarioColors[key];
    }
    return '#6b7280';
  };

  const fxRiskColor = riskMetrics.fx_risk_level === 'Low' ? '#10b981' :
    riskMetrics.fx_risk_level === 'High' ? '#ef4444' : '#eab308';

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
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: '50px', padding: '8px 20px', marginBottom: '16px'
        }}>
          <BarChart3 size={16} color="#3b82f6" />
          <span style={{ color: '#60a5fa', fontSize: '13px', fontWeight: 600 }}>
            {chronos?.n_simulations?.toLocaleString() ?? '1,000'} Monte Carlo Paths · GBM Model
          </span>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
          Chronos — Wealth Simulation
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
          5-year stochastic wealth projection with Prophet FX drift
        </p>
      </motion.div>

      {!hasData ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <BarChart3 size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '8px' }}>No simulation data</h3>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Run a simulation to see Monte Carlo wealth projections</p>
        </div>
      ) : (
        <>
          {/* Wealth Band Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(15,15,30,0.9) 100%)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: '24px',
              padding: '32px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                  Percentile Wealth Bands
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  Shaded region = 90% probability corridor (P5–P95)
                </p>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'P95 (Bull)', color: '#a855f7' },
                  { label: 'P50 (Base)', color: '#10b981' },
                  { label: 'P5 (Bear)', color: '#ef4444' },
                ].map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '3px', background: b.color, borderRadius: '2px' }} />
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="p95grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="p50grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="p5grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatK(v)} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<BandTooltip />} />
                <Area type="monotone" dataKey="p95" name="P95 Bull" stroke="#a855f7" strokeWidth={2} fill="url(#p95grad)" />
                <Area type="monotone" dataKey="p75" name="P75 Upside" stroke="#3b82f6" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="p50" name="P50 Base" stroke="#10b981" strokeWidth={2.5} fill="url(#p50grad)" />
                <Area type="monotone" dataKey="p25" name="P25 Downside" stroke="#f97316" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="p5" name="P5 Bear" stroke="#ef4444" strokeWidth={2} fill="url(#p5grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Risk Metrics Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px', marginBottom: '24px'
            }}
          >
            {[
              {
                label: 'Median Wealth (Yr 5)',
                value: finalStats.median_wealth ? formatK(finalStats.median_wealth) : '—',
                sub: 'P50 base case',
                color: '#10b981',
                icon: TrendingUp
              },
              {
                label: 'Value at Risk (5%)',
                value: riskMetrics.value_at_risk_5pct ? formatK(riskMetrics.value_at_risk_5pct) : '—',
                sub: 'Worst 5th percentile',
                color: '#ef4444',
                icon: AlertTriangle
              },
              {
                label: 'Probability of Growth',
                value: finalStats.probability_of_growth != null ? `${finalStats.probability_of_growth.toFixed(0)}%` : '—',
                sub: 'Wealth increases',
                color: '#10b981',
                icon: Shield
              },
              {
                label: 'Sharpe Proxy',
                value: riskMetrics.sharpe_proxy != null ? riskMetrics.sharpe_proxy.toFixed(2) : '—',
                sub: 'Risk-adj. return ratio',
                color: '#3b82f6',
                icon: Zap
              },
              {
                label: 'FX Risk',
                value: riskMetrics.fx_risk_level ?? '—',
                sub: `Volatility: ${((riskMetrics.fx_volatility_used ?? 0) * 100).toFixed(1)}%`,
                color: fxRiskColor,
                icon: Info
              },
              {
                label: 'FX Drift (Yr 1)',
                value: riskMetrics.fx_drift_applied != null ? `${(riskMetrics.fx_drift_applied * 100).toFixed(1)}%` : '—',
                sub: riskMetrics.forecast_source?.includes('Prophet') ? 'Prophet ML forecast' : 'Estimated',
                color: '#a855f7',
                icon: BarChart3
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
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>{m.value}</div>
                  <div style={{ fontSize: '12px', color: m.color, fontWeight: 500 }}>{m.sub}</div>
                </div>
              );
            })}
          </motion.div>

          {/* Scenario Cards */}
          {scenarios.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
                Scenario Breakdown
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                {scenarios.map((s: any, i: number) => {
                  const c = getScenarioColor(s.name);
                  return (
                    <div key={i} style={{
                      background: `linear-gradient(135deg, ${c}12 0%, rgba(15,15,30,0.9) 100%)`,
                      border: `1px solid ${c}30`,
                      borderRadius: '16px', padding: '20px'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: c, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
                        {formatK(s.final_wealth)}
                      </div>
                      <div style={{ fontSize: '13px', color: s.change_pct >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, marginBottom: '8px' }}>
                        {s.change_pct >= 0 ? '+' : ''}{s.change_pct.toFixed(1)}% change
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{s.description}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Data Source */}
          {chronos?.data_source && (
            <div style={{
              marginTop: '24px', padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                📊 Data source: {chronos.data_source}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
