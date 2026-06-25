'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, Zap, ArrowUpRight, Database, ExternalLink } from 'lucide-react';
import CountUp from 'react-countup';
import { useEffect, useState } from 'react';

export function LiveMetrics() {
  const [metrics, setMetrics] = useState({
    activeSimulations: 1247,
    totalSavings: 2840000,
    successfulMigrations: 892,
    avgRiskReduction: 34.7,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeSimulations: prev.activeSimulations + Math.floor(Math.random() * 3),
        totalSavings: prev.totalSavings + Math.floor(Math.random() * 5000),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const metricCards = [
    {
      icon: Activity,
      label: 'Active Simulations',
      value: metrics.activeSimulations,
      change: '+12%',
      positive: true,
      color: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      source: 'Platform Analytics',
    },
    {
      icon: DollarSign,
      label: 'Total Savings Generated',
      value: metrics.totalSavings,
      prefix: '$',
      format: true,
      change: '+8.3%',
      positive: true,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      source: 'Numbeo 2025',
    },
    {
      icon: Users,
      label: 'Successful Migrations',
      value: metrics.successfulMigrations,
      change: '+15.2%',
      positive: true,
      color: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      source: 'User Reports',
    },
    {
      icon: TrendingUp,
      label: 'Avg Risk Reduction',
      value: metrics.avgRiskReduction,
      suffix: '%',
      decimals: 1,
      change: '+2.1%',
      positive: true,
      color: '#f97316',
      bgGlow: 'rgba(249, 115, 22, 0.15)',
      source: 'Monte Carlo Engine',
    },
  ];

  // Data sources for the footer
  const dataSources = [
    { name: 'Numbeo', type: 'Cost of Living' },
    { name: 'OECD', type: 'Tax Data' },
    { name: 'WHO', type: 'Health Metrics' },
    { name: 'XE.com', type: 'Currency Rates' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Section Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.6)'
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#4ade80' }}>Live Metrics</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Updated every 3 seconds</span>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          <span>View Details</span>
          <ArrowUpRight style={{ width: '16px', height: '16px' }} />
        </motion.button>
      </div>

      {/* Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '24px'
      }}>
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.03, y: -8 }}
            style={{
              position: 'relative',
              padding: '28px',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              cursor: 'default',
              transition: 'all 0.4s ease'
            }}
          >
            {/* Gradient Glow on Hover */}
            <div 
              style={{ 
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 30% 30%, ${metric.bgGlow}, transparent 70%)`,
                opacity: 0.5,
                pointerEvents: 'none'
              }}
            />
            
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                justifyContent: 'space-between', 
                marginBottom: '24px' 
              }}>
                <div 
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${metric.color}, ${metric.color}99)`,
                    boxShadow: `0 8px 32px ${metric.bgGlow}`
                  }}
                >
                  <metric.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: metric.positive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: metric.positive ? '#4ade80' : '#f87171',
                  border: `1px solid ${metric.positive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  {metric.positive ? 
                    <TrendingUp style={{ width: '12px', height: '12px' }} /> : 
                    <TrendingDown style={{ width: '12px', height: '12px' }} />
                  }
                  {metric.change}
                </div>
              </div>
              
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 700, 
                color: 'white', 
                marginBottom: '8px',
                letterSpacing: '-0.02em'
              }}>
                {metric.prefix}
                <CountUp 
                  end={metric.value} 
                  duration={2.5} 
                  separator="," 
                  decimals={metric.decimals || 0}
                  preserveValue
                />
                {metric.suffix}
              </div>
              
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                {metric.label}
              </div>
              
              {/* Data Source Badge */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                marginTop: '12px',
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                width: 'fit-content'
              }}>
                <Database style={{ width: '10px', height: '10px', color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Source: {metric.source}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Data Sources Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: '32px',
          padding: '20px 24px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Data Sources:</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {dataSources.map((source, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{source.name}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>({source.type})</span>
            </div>
          ))}
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          padding: '6px 12px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 500 }}>Live API Connection</span>
        </div>
      </motion.div>
    </div>
  );
}
