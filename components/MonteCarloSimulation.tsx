'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, TrendingUp, BarChart3, Zap, Play, RefreshCw,
  ChevronDown, Info, Target, Shield, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SimulationResult {
  year: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  mean: number;
}

interface MonteCarloProps {
  baseWealth?: number;
  annualIncome?: number;
  targetCity?: string;
}

// Box-Muller transform for normal distribution
function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

// Run Monte Carlo simulation
function runMonteCarloSimulation(
  initialWealth: number,
  annualReturn: number,
  volatility: number,
  years: number,
  numSimulations: number
): SimulationResult[] {
  const allPaths: number[][] = [];
  
  // Run simulations
  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [initialWealth];
    let wealth = initialWealth;
    
    for (let year = 1; year <= years; year++) {
      // Geometric Brownian Motion with fat tails (occasional black swans)
      const blackSwanProb = Math.random();
      let yearReturn: number;
      
      if (blackSwanProb < 0.05) {
        // 5% chance of black swan event (-30% to -50%)
        yearReturn = gaussianRandom(-0.35, 0.1);
      } else if (blackSwanProb < 0.10) {
        // 5% chance of exceptional year (+25% to +40%)
        yearReturn = gaussianRandom(0.30, 0.08);
      } else {
        // Normal year
        yearReturn = gaussianRandom(annualReturn, volatility);
      }
      
      wealth = wealth * (1 + yearReturn);
      wealth = Math.max(wealth, 0); // Can't go negative
      path.push(wealth);
    }
    allPaths.push(path);
  }
  
  // Calculate percentiles for each year
  const results: SimulationResult[] = [];
  for (let year = 0; year <= years; year++) {
    const yearValues = allPaths.map(path => path[year]).sort((a, b) => a - b);
    const n = yearValues.length;
    
    results.push({
      year,
      p5: yearValues[Math.floor(n * 0.05)],
      p25: yearValues[Math.floor(n * 0.25)],
      p50: yearValues[Math.floor(n * 0.50)],
      p75: yearValues[Math.floor(n * 0.75)],
      p95: yearValues[Math.floor(n * 0.95)],
      mean: yearValues.reduce((a, b) => a + b, 0) / n
    });
  }
  
  return results;
}

export function MonteCarloSimulation({ baseWealth = 85000, annualIncome = 95000, targetCity = 'Berlin' }: MonteCarloProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [simCount, setSimCount] = useState(1000);
  const [volatility, setVolatility] = useState(0.15);
  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const runSimulation = () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 100);
    
    // Run actual simulation after brief delay for UX
    setTimeout(() => {
      const simResults = runMonteCarloSimulation(baseWealth, 0.07, volatility, 5, simCount);
      setResults(simResults);
      setProgress(100);
      clearInterval(progressInterval);
      setIsRunning(false);
      toast.success(`Completed ${simCount.toLocaleString()} simulations!`, { icon: '📊' });
    }, 1500);
  };

  const maxValue = results ? Math.max(...results.map(r => r.p95)) : baseWealth * 2;
  const minValue = results ? Math.min(...results.map(r => r.p5)) : 0;

  // Calculate risk metrics
  const riskMetrics = useMemo(() => {
    if (!results) return null;
    const finalYear = results[results.length - 1];
    const initialWealth = results[0].p50;
    
    return {
      expectedReturn: ((finalYear.mean / initialWealth - 1) * 100).toFixed(1),
      bestCase: ((finalYear.p95 / initialWealth - 1) * 100).toFixed(1),
      worstCase: ((finalYear.p5 / initialWealth - 1) * 100).toFixed(1),
      medianOutcome: finalYear.p50,
      valueAtRisk: ((initialWealth - finalYear.p5) / initialWealth * 100).toFixed(1),
      probabilityOfLoss: results[5] ? (results[5].p25 < initialWealth ? '~25%' : '<10%') : 'N/A'
    };
  }, [results]);

  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '24px', padding: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Monte Carlo Simulation</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{simCount.toLocaleString()} probabilistic wealth trajectories</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select value={simCount} onChange={(e) => setSimCount(Number(e.target.value))}
            style={{ padding: '10px 14px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'white', fontSize: '13px', cursor: 'pointer' }}>
            <option value={100} style={{ background: '#1a1a2e', color: 'white' }}>100 sims</option>
            <option value={500} style={{ background: '#1a1a2e', color: 'white' }}>500 sims</option>
            <option value={1000} style={{ background: '#1a1a2e', color: 'white' }}>1,000 sims</option>
            <option value={5000} style={{ background: '#1a1a2e', color: 'white' }}>5,000 sims</option>
            <option value={10000} style={{ background: '#1a1a2e', color: 'white' }}>10,000 sims</option>
          </select>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runSimulation} disabled={isRunning}
            style={{ padding: '10px 20px', background: isRunning ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isRunning ? <><RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> Running...</> : <><Play style={{ width: '14px', height: '14px' }} /> Run Simulation</>}
          </motion.button>
        </div>
      </div>

      {/* Volatility Slider */}
      <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Market Volatility</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: volatility > 0.25 ? '#ef4444' : volatility > 0.15 ? '#f59e0b' : '#10b981' }}>{(volatility * 100).toFixed(0)}%</span>
        </div>
        <input type="range" min="5" max="40" value={volatility * 100} onChange={(e) => setVolatility(Number(e.target.value) / 100)}
          style={{ width: '100%', height: '6px', borderRadius: '3px', background: `linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)`, cursor: 'pointer', WebkitAppearance: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Low Risk</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>High Risk</span>
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Running simulations...</span>
            <span style={{ fontSize: '12px', color: '#f59e0b' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: '2px' }} />
          </div>
        </div>
      )}

      {/* Chart */}
      {results && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Confidence Interval Chart */}
          <div style={{ position: 'relative', height: '280px', marginBottom: '24px', padding: '20px 0', overflow: 'hidden' }}>
            {/* Y-axis */}
            <div style={{ position: 'absolute', left: 0, top: '20px', bottom: '40px', width: '55px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {[maxValue, (maxValue + minValue) / 2, minValue].map((val, i) => (
                <span key={i} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textAlign: 'right', paddingRight: '8px' }}>
                  ${(val / 1000).toFixed(0)}k
                </span>
              ))}
            </div>

            {/* Chart Area */}
            <div style={{ position: 'absolute', left: '60px', right: '10px', top: '20px', bottom: '40px', overflow: 'hidden' }}>
              {/* Grid lines */}
              {[0, 1, 2].map(i => (
                <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 50}%`, borderTop: '1px dashed rgba(255,255,255,0.1)' }} />
              ))}

              {/* Confidence bands */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* 90% confidence band (p5-p95) */}
                <polygon
                  points={results.map((r, i) => `${(i / (results.length - 1)) * 100},${100 - ((r.p95 - minValue) / (maxValue - minValue)) * 100}`).join(' ') + ' ' + 
                    results.map((r, i) => `${((results.length - 1 - i) / (results.length - 1)) * 100},${100 - ((results[results.length - 1 - i].p5 - minValue) / (maxValue - minValue)) * 100}`).join(' ')}
                  fill="rgba(245, 158, 11, 0.15)"
                />
                {/* 50% confidence band (p25-p75) */}
                <polygon
                  points={results.map((r, i) => `${(i / (results.length - 1)) * 100},${100 - ((r.p75 - minValue) / (maxValue - minValue)) * 100}`).join(' ') + ' ' + 
                    results.map((r, i) => `${((results.length - 1 - i) / (results.length - 1)) * 100},${100 - ((results[results.length - 1 - i].p25 - minValue) / (maxValue - minValue)) * 100}`).join(' ')}
                  fill="rgba(245, 158, 11, 0.3)"
                />
                {/* Median line */}
                <polyline
                  points={results.map((r, i) => `${(i / (results.length - 1)) * 100},${100 - ((r.p50 - minValue) / (maxValue - minValue)) * 100}`).join(' ')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="0.8"
                />
                {/* Mean line */}
                <polyline
                  points={results.map((r, i) => `${(i / (results.length - 1)) * 100},${100 - ((r.mean - minValue) / (maxValue - minValue)) * 100}`).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              </svg>

              {/* Data points */}
              {results.map((r, i) => {
                const yPercent = ((r.p50 - minValue) / (maxValue - minValue)) * 100;
                return (
                  <div key={i} style={{ 
                    position: 'absolute', 
                    left: `${(i / (results.length - 1)) * 100}%`, 
                    top: `${100 - yPercent}%`, 
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', border: '2px solid rgba(26, 26, 46, 0.9)' }} />
                  </div>
                );
              })}
            </div>

            {/* X-axis */}
            <div style={{ position: 'absolute', left: '60px', right: '10px', bottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              {results.map((r, i) => (
                <span key={i} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Year {r.year}</span>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '12px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '2px' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>90% Confidence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '12px', background: 'rgba(245, 158, 11, 0.3)', borderRadius: '2px' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>50% Confidence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '2px', background: '#f59e0b' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Median</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '2px', background: '#10b981', borderStyle: 'dashed' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Mean</span>
            </div>
          </div>

          {/* Risk Metrics */}
          {riskMetrics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <TrendingUp style={{ width: '14px', height: '14px', color: '#10b981' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Expected Return (5Y)</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#10b981' }}>+{riskMetrics.expectedReturn}%</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Target style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Best Case (95th %ile)</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#3b82f6' }}>+{riskMetrics.bestCase}%</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <AlertTriangle style={{ width: '14px', height: '14px', color: '#ef4444' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Worst Case (5th %ile)</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444' }}>{riskMetrics.worstCase}%</div>
              </div>
            </div>
          )}

          {/* Detailed Stats Toggle */}
          <div onClick={() => setShowDetails(!showDetails)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>Detailed Statistics</span>
            </div>
            <ChevronDown style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)', transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          <AnimatePresence>
            {showDetails && riskMetrics && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px', marginTop: '12px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Median Outcome (Year 5)</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>${(riskMetrics.medianOutcome / 1000).toFixed(0)}k</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Value at Risk (VaR 95%)</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>{riskMetrics.valueAtRisk}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Probability of Loss</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>{riskMetrics.probabilityOfLoss}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Simulations Run</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{simCount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Info style={{ width: '14px', height: '14px', color: '#a78bfa', flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>
                        This Monte Carlo simulation uses Geometric Brownian Motion with fat-tailed distributions to model black swan events. 
                        5% of simulations include severe market crashes (-30% to -50%), and 5% include exceptional growth years (+25% to +40%).
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State */}
      {!results && !isRunning && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Activity style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Run a Monte Carlo simulation to see probabilistic wealth projections</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Adjust volatility and simulation count, then click "Run Simulation"</p>
        </div>
      )}
    </div>
  );
}
