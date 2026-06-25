'use client';

import { motion } from 'framer-motion';
import { Brain, DollarSign, Scale, Activity, TrendingUp, Shield, Cpu, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function AgentShowcase() {
  const [activeAgent, setActiveAgent] = useState(0);

  const agents = [
    {
      name: 'The Actuary',
      subtitle: 'Risk Agent',
      icon: Activity,
      color: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.2)',
      description: 'Analyzes non-financial "Life Quality" data including air quality, healthcare wait times, and safety indices.',
      insight: '"Moving to City X increases salary by 20%, but increases Respiratory Health Risk by 15%"',
      capabilities: ['Health Risk Analysis', 'AQI Monitoring', 'Safety Index', 'Healthcare Access'],
    },
    {
      name: 'Fiscal Ghost',
      subtitle: 'Expense Agent',
      icon: DollarSign,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.2)',
      description: 'Ingests actual bank data and "replays" your specific spending habits in new city\'s local prices.',
      insight: '"Your $200/month coffee habit would cost $340/month in Zurich"',
      capabilities: ['Bank Data Integration', 'Brand-Specific Tracking', 'Lifestyle Cost Analysis', 'Hidden Fees Detection'],
    },
    {
      name: 'The Nexus',
      subtitle: 'Compliance Agent',
      icon: Scale,
      color: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.2)',
      description: 'Uses RAG on 2025 Double Taxation Treaties to calculate real-time "Net-Wealth" across jurisdictions.',
      insight: '"Tax treaty between US-Germany reduces your burden by 18%"',
      capabilities: ['Tax Treaty Analysis', 'Visa Compliance', 'Regulatory Timeline', 'Double Taxation Relief'],
    }
  ];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '28px',
      padding: '28px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Background Glow */}
      <motion.div
        animate={{ background: `radial-gradient(circle at 50% 50%, ${agents[activeAgent].bgGlow}, transparent 70%)` }}
        transition={{ duration: 0.5 }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <Cpu style={{ width: '20px', height: '20px', color: '#a78bfa' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>The Agentic Trio</h3>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Multi-Agent Orchestration</p>
          </div>
        </div>

        {/* Agent Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {agents.map((agent, index) => (
            <motion.button
              key={agent.name}
              onClick={() => setActiveAgent(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                background: activeAgent === index 
                  ? `linear-gradient(135deg, ${agent.color}, ${agent.color}99)` 
                  : 'rgba(255,255,255,0.05)',
                boxShadow: activeAgent === index ? `0 8px 24px ${agent.bgGlow}` : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <agent.icon style={{ 
                width: '20px', 
                height: '20px', 
                margin: '0 auto',
                color: activeAgent === index ? 'white' : 'rgba(255,255,255,0.5)' 
              }} />
            </motion.button>
          ))}
        </div>

        {/* Active Agent Details */}
        <motion.div
          key={activeAgent}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              padding: '10px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${agents[activeAgent].color}, ${agents[activeAgent].color}99)`
            }}>
              {(() => {
                const Icon = agents[activeAgent].icon;
                return <Icon style={{ width: '20px', height: '20px', color: 'white' }} />;
              })()}
            </div>
            <div>
              <h4 style={{ fontWeight: 600, color: 'white', fontSize: '15px' }}>{agents[activeAgent].name}</h4>
              <span style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '100px',
                background: `linear-gradient(135deg, ${agents[activeAgent].color}, ${agents[activeAgent].color}99)`,
                color: 'white'
              }}>
                {agents[activeAgent].subtitle}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '16px' }}>
            {agents[activeAgent].description}
          </p>

          {/* Insight Quote */}
          <div style={{
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Sparkles style={{ width: '14px', height: '14px', color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 1.5 }}>
                {agents[activeAgent].insight}
              </p>
            </div>
          </div>

          {/* Capabilities */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {agents[activeAgent].capabilities.map((cap, index) => (
              <span
                key={index}
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {cap}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Footer Stats */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain style={{ width: '14px', height: '14px', color: '#a78bfa' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>LangGraph Orchestration</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield style={{ width: '12px', height: '12px', color: '#4ade80' }} />
                <span>80% Success</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp style={{ width: '12px', height: '12px', color: '#3b82f6' }} />
                <span>40h Saved</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
