'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, TrendingDown, Building, Heart, FileText,
  Shield, Zap, ChevronRight, Info, DollarSign, Activity,
  Globe, Clock, CheckCircle, XCircle, ArrowRight
} from 'lucide-react';
import { StressTestVisualizer } from './StressTestVisualizer';

interface Scenario {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  probability: number;
  impact: {
    wealth: number;
    rent: number;
    savings: number;
    timeline: string;
  };
  mitigations: string[];
  healthCorrelation?: {
    factor: string;
    annualCost: number;
    ageThreshold: number;
  };
}

const scenarios: Scenario[] = [
  {
    id: 'currency',
    name: '20% Currency Crash',
    icon: TrendingDown,
    color: '#ef4444',
    description: 'Sudden 20% devaluation of your home currency against JPY',
    probability: 15,
    impact: { wealth: -18, rent: 25, savings: -22, timeline: '3-6 months' },
    mitigations: [
      'Maintain 40% of savings in target currency (JPY)',
      'Set up automatic currency hedging via Wise or Revolut',
      'Negotiate salary adjustment clause in employment contract',
      'Consider JPY-denominated emergency fund (¥500,000 minimum)'
    ]
  },
  {
    id: 'housing',
    name: 'Housing Market Crash',
    icon: Building,
    color: '#f59e0b',
    description: 'Local housing market drops 30%, affecting rental dynamics',
    probability: 8,
    impact: { wealth: 5, rent: -15, savings: 12, timeline: '12-18 months' },
    mitigations: [
      'Opportunity: Renegotiate lease at 15-20% lower rate',
      'Lock in 2-year lease during market bottom',
      'Avoid property purchase until market stabilizes',
      'Build relationship with landlord for priority renewal'
    ]
  },
  {
    id: 'health',
    name: 'Major Health Crisis',
    icon: Heart,
    color: '#ec4899',
    description: 'Unexpected health issue requiring extended medical care',
    probability: 12,
    impact: { wealth: -35, rent: 0, savings: -45, timeline: '6-24 months' },
    mitigations: [
      'Enroll in Japan National Health Insurance (70% coverage)',
      'Maintain international health insurance as backup',
      'Build medical emergency fund: ¥2,000,000',
      'Register with embassy for emergency repatriation'
    ],
    healthCorrelation: {
      factor: 'Air pollution exposure in Shinjuku',
      annualCost: 180000,
      ageThreshold: 45
    }
  },
  {
    id: 'visa',
    name: 'Visa Law Changes',
    icon: FileText,
    color: '#8b5cf6',
    description: 'Sudden changes to visa requirements or work permit rules',
    probability: 20,
    impact: { wealth: -8, rent: 0, savings: -15, timeline: '1-3 months' },
    mitigations: [
      'Maintain valid passport with 2+ years validity',
      'Keep all employment documentation current',
      'Build relationship with immigration lawyer',
      'Have backup country visa options prepared'
    ]
  }
];

export function BlackSwanTesting() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [simulationRun, setSimulationRun] = useState(false);
  const [showTimeMachine, setShowTimeMachine] = useState(false);

  const runSimulation = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setSimulationRun(true);
  };

  // Sample data for visualization
  const baselineWealth = [85000, 105000, 128000, 155000, 185000];
  const getStressData = (scenario: Scenario) => {
    const impactFactor = 1 + (scenario.impact.wealth / 100);
    return baselineWealth.map(val => val * impactFactor);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '100px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '16px' }}>
          <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
          <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>Predictive Risk Analysis</span>
        </motion.div>
        <h2 style={{ fontSize: '36px', fontWeight: 800, background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          Black Swan Stress Testing
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
          Simulate worst-case scenarios and build resilient financial strategies
        </p>
      </div>

      {/* Alert Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>🚨 AI Alert: Timing Optimization Detected</h4>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            Moving in <strong style={{ color: 'white' }}>January</strong> instead of October saves <strong style={{ color: '#10b981' }}>¥960,000</strong> in partial-year tax residency fees. 
            <span style={{ color: '#a78bfa', cursor: 'pointer', marginLeft: '8px' }}>View calculation →</span>
          </p>
        </div>
      </motion.div>

      {/* Scenario Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {scenarios.map((scenario, i) => (
          <motion.div key={scenario.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            onClick={() => runSimulation(scenario)}
            style={{
              background: selectedScenario?.id === scenario.id ? `${scenario.color}15` : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
              backdropFilter: 'blur(24px)', border: `1px solid ${selectedScenario?.id === scenario.id ? scenario.color : 'rgba(102, 126, 234, 0.2)'}`,
              borderRadius: '20px', padding: '24px', cursor: 'pointer', transition: 'all 0.3s ease'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${scenario.color}20`, border: `1px solid ${scenario.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <scenario.icon style={{ width: '22px', height: '22px', color: scenario.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>{scenario.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: scenario.probability > 15 ? '#ef4444' : scenario.probability > 10 ? '#f59e0b' : '#10b981' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{scenario.probability}% probability</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '16px' }}>{scenario.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: scenario.impact.wealth < 0 ? '#ef4444' : '#10b981' }}>{scenario.impact.wealth > 0 ? '+' : ''}{scenario.impact.wealth}%</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Wealth</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: scenario.impact.rent > 0 ? '#ef4444' : '#10b981' }}>{scenario.impact.rent > 0 ? '+' : ''}{scenario.impact.rent}%</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Rent</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: scenario.impact.savings < 0 ? '#ef4444' : '#10b981' }}>{scenario.impact.savings > 0 ? '+' : ''}{scenario.impact.savings}%</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Savings</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Analysis Panel */}
      <AnimatePresence>
        {selectedScenario && simulationRun && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Visualizer */}
            <StressTestVisualizer 
              scenario={selectedScenario.name}
              baselineData={baselineWealth}
              stressData={getStressData(selectedScenario)}
            />

            {/* Details */}
            <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '24px', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${selectedScenario.color}20`, border: `2px solid ${selectedScenario.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <selectedScenario.icon style={{ width: '28px', height: '28px', color: selectedScenario.color }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>{selectedScenario.name}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Impact Timeline: {selectedScenario.impact.timeline}</p>
                </div>
              </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Mitigations */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield style={{ width: '18px', height: '18px', color: '#10b981' }} />
                  AI Mitigation Strategies
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedScenario.mitigations.map((mitigation, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{mitigation}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Health Correlation */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity style={{ width: '18px', height: '18px', color: '#ec4899' }} />
                  Health-Wealth Correlation
                </h4>
                {selectedScenario.healthCorrelation ? (
                  <div style={{ padding: '20px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '16px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>{selectedScenario.healthCorrelation.factor}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Projected Annual Cost</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: '#ec4899' }}>¥{selectedScenario.healthCorrelation.annualCost.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Impact Threshold Age</span>
                      <span style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>{selectedScenario.healthCorrelation.ageThreshold}+</span>
                    </div>
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                        💡 <strong style={{ color: '#10b981' }}>Recommendation:</strong> Moving to Nakano reduces this cost by 67% due to better air quality index.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Stress Impact Score</span>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#f59e0b' }}>Medium</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Recovery Timeline</span>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>{selectedScenario.impact.timeline}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Resilience Rating</span>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#10b981' }}>High (with mitigations)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
