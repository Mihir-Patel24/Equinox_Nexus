'use client';

import { motion } from 'framer-motion';
import { Brain, Globe, Calculator, Shield, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export function LoadingAnimation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    { icon: Globe, text: 'Scanning global markets', subtext: '160+ currencies analyzed', color: '#3b82f6' },
    { icon: Brain, text: 'Actuary evaluating risks', subtext: 'Health & safety metrics', color: '#ef4444' },
    { icon: Calculator, text: 'Fiscal Ghost processing', subtext: 'Expense pattern analysis', color: '#10b981' },
    { icon: Shield, text: 'Nexus checking compliance', subtext: 'Tax treaty optimization', color: '#8b5cf6' },
    { icon: TrendingUp, text: 'Generating projections', subtext: '5-year wealth trajectory', color: '#06b6d4' },
    { icon: Zap, text: 'Finalizing results', subtext: 'AI recommendations ready', color: '#f59e0b' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          setCompletedSteps(completed => [...completed, prev]);
          return prev + 1;
        }
        return prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        {/* Central Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 32px' }}>
            {/* Outer Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #667eea, #764ba2, #f093fb, #667eea)',
                padding: '3px',
              }}
            >
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0a0a1a' }} />
            </motion.div>

            {/* Middle Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              style={{
                position: 'absolute',
                inset: '16px',
                borderRadius: '50%',
                border: '2px dashed rgba(139, 92, 246, 0.3)'
              }}
            />

            {/* Center Icon */}
            <div style={{
              position: 'absolute',
              inset: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
            }}>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Brain style={{ width: '40px', height: '40px', color: 'white' }} />
              </motion.div>
            </div>

            {/* Orbiting Dots */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 1 }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <div style={{
                  position: 'absolute',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
                  top: '0%',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }} />
              </motion.div>
            ))}
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '12px' }}
          >
            Running Agentic Simulation
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}
          >
            Our AI agents are analyzing your borderless future
          </motion.p>
        </motion.div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;
            const isPending = index > currentStep;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                style={{
                  position: 'relative',
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isCurrent ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '16px',
                  opacity: isPending ? 0.4 : 1,
                  boxShadow: isCurrent ? '0 0 30px rgba(139, 92, 246, 0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    padding: '12px',
                    borderRadius: '14px',
                    background: `linear-gradient(135deg, ${step.color}, ${step.color}99)`,
                    boxShadow: isCurrent ? `0 8px 24px ${step.color}40` : 'none'
                  }}>
                    {isCompleted ? (
                      <CheckCircle style={{ width: '20px', height: '20px', color: 'white' }} />
                    ) : isCurrent ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <step.icon style={{ width: '20px', height: '20px', color: 'white' }} />
                      </motion.div>
                    ) : (
                      <step.icon style={{ width: '20px', height: '20px', color: 'white' }} />
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500, color: isCompleted || isCurrent ? 'white' : 'rgba(255,255,255,0.5)' }}>
                        {step.text}
                      </span>
                      {isCompleted && (
                        <span style={{ fontSize: '12px', color: '#4ade80' }}>Complete</span>
                      )}
                      {isCurrent && (
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          style={{ fontSize: '12px', color: '#a78bfa' }}
                        >
                          Processing...
                        </motion.span>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{step.subtext}</span>
                  </div>
                </div>

                {isCurrent && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5 }}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, #667eea, #f093fb)',
                      borderRadius: '0 0 16px 16px'
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ marginTop: '32px', textAlign: 'center' }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '100px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
            </motion.div>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Processing across 190+ jurisdictions</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
