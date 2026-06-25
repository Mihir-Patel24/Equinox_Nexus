'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ToggleLeft, ToggleRight } from 'lucide-react';

interface StressTestVisualizerProps {
  scenario: string;
  baselineData: number[];
  stressData: number[];
}

export function StressTestVisualizer({ scenario, baselineData, stressData }: StressTestVisualizerProps) {
  const [showStress, setShowStress] = useState(false);
  
  const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
  const maxValue = Math.max(...baselineData, ...stressData);
  const currentData = showStress ? stressData : baselineData;
  
  const totalBaseline = baselineData[4];
  const totalStress = stressData[4];
  const difference = totalBaseline - totalStress;
  const percentChange = ((difference / totalBaseline) * 100).toFixed(1);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
      backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)',
      borderRadius: '24px', padding: '32px'
    }}>
      {/* Header with Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            5-Year Wealth Trajectory
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Impact of {scenario}
          </p>
        </div>
        
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowStress(!showStress)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
            background: showStress ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            border: `1px solid ${showStress ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: '12px', cursor: 'pointer', color: 'white', fontSize: '14px', fontWeight: 600
          }}>
          {showStress ? <ToggleRight style={{ width: '20px', height: '20px', color: '#ef4444' }} /> : <ToggleLeft style={{ width: '20px', height: '20px', color: '#10b981' }} />}
          {showStress ? 'After Stress' : 'Baseline'}
        </motion.button>
      </div>

      {/* Chart */}
      <div style={{ position: 'relative', height: '300px', marginBottom: '24px' }}>
        {/* Y-axis labels */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '12px' }}>
          {[maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0].map((val, i) => (
            <span key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>
              ${(val / 1000).toFixed(0)}k
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ position: 'absolute', left: '70px', right: 0, top: 0, bottom: 0 }}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              position: 'absolute', left: 0, right: 0, top: `${i * 25}%`,
              borderTop: '1px solid rgba(255,255,255,0.05)'
            }} />
          ))}

          {/* Bars */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '0 20px' }}>
            {currentData.map((value, i) => {
              const height = (value / maxValue) * 100;
              const isStress = showStress;
              
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    style={{
                      width: '100%', borderRadius: '8px 8px 0 0',
                      background: isStress 
                        ? 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)'
                        : 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                      position: 'relative', boxShadow: `0 -4px 20px ${isStress ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                    }}>
                    <div style={{
                      position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)',
                      fontSize: '11px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap'
                    }}>
                      ${(value / 1000).toFixed(0)}k
                    </div>
                  </motion.div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                    {years[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <TrendingUp style={{ width: '14px', height: '14px', color: '#10b981' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Baseline (5Y)</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
            ${(totalBaseline / 1000).toFixed(0)}k
          </div>
        </div>

        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <TrendingDown style={{ width: '14px', height: '14px', color: '#ef4444' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>After Stress (5Y)</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>
            ${(totalStress / 1000).toFixed(0)}k
          </div>
        </div>

        <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Wealth Lost</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>
            -${(difference / 1000).toFixed(0)}k
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            ({percentChange}% decline)
          </div>
        </div>
      </div>
    </div>
  );
}
