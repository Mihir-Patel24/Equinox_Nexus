'use client';

import { motion } from 'framer-motion';
import { DollarSign, Home, ShoppingCart, Car, Coffee, Dumbbell, Tv, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

interface FiscalViewProps {
  data: any;
}

const EXPENSE_ICONS: Record<string, any> = {
  rent: Home,
  groceries: ShoppingCart,
  transport: Car,
  dining: Coffee,
  fitness: Dumbbell,
  entertainment: Tv,
  utilities: Zap,
};

const EXPENSE_COLORS: Record<string, string> = {
  rent: '#667eea',
  groceries: '#10b981',
  transport: '#3b82f6',
  dining: '#f59e0b',
  fitness: '#ec4899',
  entertainment: '#8b5cf6',
  utilities: '#06b6d4',
};

export function FiscalView({ data }: FiscalViewProps) {
  const fiscal = data?.fiscal;
  const hasData = !!fiscal;

  const details = fiscal?.details || {};
  const expenses = Object.entries(details).map(([key, value]) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: Math.round(value as number),
    color: EXPENSE_COLORS[key] || '#6b7280',
    icon: EXPENSE_ICONS[key] || DollarSign,
  })).filter(e => e.value > 0);

  const totalMonthly = fiscal?.projected_expenses ?? expenses.reduce((sum, e) => sum + e.value, 0);
  const colMultiplier = fiscal?.col_multiplier ?? 1;
  const lifestyleKey = fiscal?.lifestyle_key ?? fiscal?.lifestyle_model_used ?? '';
  const lifestyleModel = fiscal?.lifestyle_model_used ?? '';
  const netSavings = fiscal?.net_annual_savings ?? null;
  const effectiveTaxRate = fiscal?.effective_tax_rate ?? null;
  const taxRegime = fiscal?.tax_regime ?? '';
  const dataSource = fiscal?.data_source ?? '';
  const colChangeSign = colMultiplier > 1 ? '+' : '';
  const colChangePct = ((colMultiplier - 1) * 100).toFixed(1);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '50px', padding: '8px 20px', marginBottom: '16px'
        }}>
          <DollarSign size={16} color="#f59e0b" />
          <span style={{ color: '#fcd34d', fontSize: '13px', fontWeight: 600 }}>
            XGBoost (Numbeo) · {lifestyleModel.includes('R²') ? lifestyleModel.split('(')[1]?.replace(')', '') ?? 'Trained' : 'Trained Model'}
          </span>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
          Fiscal Ghost — Expense Analysis
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
          AI-predicted monthly burn rate for your exact lifestyle
        </p>
      </motion.div>

      {!hasData ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <DollarSign size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '8px' }}>No expense data</h3>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Run a simulation to see your AI-predicted expense breakdown</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}
          >
            {[
              {
                label: 'Monthly Burn Rate',
                value: `$${Math.round(totalMonthly).toLocaleString()}`,
                sub: fiscal?.city ? `in ${fiscal.city}` : 'Projected',
                color: '#f59e0b'
              },
              {
                label: 'Annual Expenses',
                value: `$${Math.round(totalMonthly * 12).toLocaleString()}`,
                sub: 'Total cost per year',
                color: '#f97316'
              },
              {
                label: 'Cost of Living',
                value: `${colChangeSign}${colChangePct}%`,
                sub: colMultiplier > 1 ? 'More expensive than home' : colMultiplier < 1 ? 'Cheaper than home' : 'Same as home',
                color: colMultiplier <= 1 ? '#10b981' : colMultiplier <= 1.3 ? '#eab308' : '#ef4444'
              },
              {
                label: 'Net Annual Savings',
                value: netSavings != null ? `$${Math.round(netSavings).toLocaleString()}` : '—',
                sub: 'After all expenses & tax',
                color: netSavings != null && netSavings > 0 ? '#10b981' : '#ef4444'
              },
              {
                label: 'Effective Tax Rate',
                value: effectiveTaxRate != null ? `${(effectiveTaxRate * 100).toFixed(1)}%` : '—',
                sub: taxRegime || 'Tax regime',
                color: '#a855f7'
              },
              {
                label: 'Lifestyle Profile',
                value: lifestyleKey.charAt(0).toUpperCase() + lifestyleKey.slice(1) || 'Standard',
                sub: 'Behaviour model',
                color: '#3b82f6'
              },
            ].map((m, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '20px'
              }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: m.color, marginBottom: '4px', wordBreak: 'break-word' }}>
                  {m.value}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{m.sub}</div>
              </div>
            ))}
          </motion.div>

          {/* Expense Chart + Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '24px', alignItems: 'start' }}
          >
            {/* Bar Chart */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(15,15,30,0.95) 100%)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '24px', padding: '28px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '20px' }}>
                Monthly Spend by Category
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={expenses} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${v}`} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: 'rgba(10,10,25,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 14px' }}>
                          <p style={{ color: 'white', fontWeight: 700 }}>{d.label}</p>
                          <p style={{ color: d.color, fontSize: '16px', fontWeight: 800 }}>${d.value.toLocaleString()}/mo</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                            {((d.value / totalMonthly) * 100).toFixed(1)}% of budget
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {expenses.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Itemized List */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px', padding: '24px'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
                Itemized Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {expenses.map((e, i) => {
                  const Icon = e.icon;
                  const pct = ((e.value / totalMonthly) * 100).toFixed(0);
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 0',
                      borderBottom: i < expenses.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: `${e.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Icon size={14} color={e.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{e.label}</div>
                        <div style={{
                          height: '3px', borderRadius: '2px', marginTop: '4px',
                          background: 'rgba(255,255,255,0.08)', overflow: 'hidden'
                        }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: e.color, borderRadius: '2px' }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>${e.value.toLocaleString()}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{pct}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600 }}>Total / month</span>
                <span style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 800 }}>${Math.round(totalMonthly).toLocaleString()}</span>
              </div>
            </div>
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
