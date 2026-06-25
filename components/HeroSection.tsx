'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle, TrendingUp, Shield, Globe, Zap } from 'lucide-react';

export function HeroSection() {
  const [showSurvey, setShowSurvey] = useState(false);
  const [readinessScore, setReadinessScore] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState({ income: '', savings: '', timeline: '' });
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    const hasScore = localStorage.getItem('readinessScore');
    if (hasScore) {
      setReadinessScore(parseInt(hasScore));
      setShowScore(true);
    }
    // Survey disabled - users can access it from settings if needed
  }, []);

  const calculateReadiness = () => {
    let score = 0;
    if (surveyAnswers.income === 'high') score += 35;
    else if (surveyAnswers.income === 'medium') score += 25;
    else score += 15;
    
    if (surveyAnswers.savings === 'high') score += 35;
    else if (surveyAnswers.savings === 'medium') score += 25;
    else score += 15;
    
    if (surveyAnswers.timeline === 'soon') score += 30;
    else if (surveyAnswers.timeline === 'year') score += 25;
    else score += 15;
    
    setReadinessScore(score);
    localStorage.setItem('readinessScore', score.toString());
    setShowSurvey(false);
    setShowScore(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Highly Ready';
    if (score >= 60) return 'Moderately Ready';
    return 'Needs Planning';
  };

  return (
    <div style={{ textAlign: 'center', padding: '60px 0 40px', position: 'relative' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '100px', marginBottom: '24px'
          }}>
          <Sparkles style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#a78bfa' }}>
            Agentic Financial Digital Twin
          </span>
        </motion.div>

        <h1 style={{
          fontSize: '64px', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Equinox Nexus
        </h1>

        <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>
          Multi-agent AI system that simulates your financial future across 10 global cities.
          <br />Real-time data. Zero-knowledge privacy. Autonomous compliance.
        </p>

        {/* Readiness Score Display */}
        <AnimatePresence>
          {showScore && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{
                display: 'inline-block', padding: '24px 32px', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%)',
                backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '20px', marginBottom: '32px'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                    <motion.circle cx="40" cy="40" r="35" fill="none" stroke={getScoreColor(readinessScore)} strokeWidth="6"
                      strokeLinecap="round" strokeDasharray={220} initial={{ strokeDashoffset: 220 }}
                      animate={{ strokeDashoffset: 220 - (220 * readinessScore / 100) }} transition={{ duration: 1.5, ease: "easeOut" }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: getScoreColor(readinessScore) }}>{readinessScore}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Your Relocation Readiness</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: getScoreColor(readinessScore) }}>{getScoreLabel(readinessScore)}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Based on your profile</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fast-Start Survey */}
        <AnimatePresence>
          {showSurvey && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'
              }} onClick={() => {
                setShowSurvey(false);
                sessionStorage.setItem('surveyDismissed', 'true');
              }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.98) 0%, rgba(30, 20, 60, 0.98) 100%)',
                  backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '24px',
                  padding: '40px', maxWidth: '500px', width: '90%', position: 'relative'
                }}>
                {/* Close button for survey */}
                <button
                  onClick={() => {
                    setShowSurvey(false);
                    sessionStorage.setItem('surveyDismissed', 'true');
                  }}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <Zap style={{ width: '48px', height: '48px', color: '#a78bfa', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Quick Start</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>3 questions to calculate your readiness score</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>
                      Annual Income Level
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[{ id: 'low', label: '<$50k' }, { id: 'medium', label: '$50k-$100k' }, { id: 'high', label: '>$100k' }].map(opt => (
                        <button key={opt.id} onClick={() => setSurveyAnswers({ ...surveyAnswers, income: opt.id })}
                          style={{
                            flex: 1, padding: '12px', background: surveyAnswers.income === opt.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                            border: surveyAnswers.income === opt.id ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                            color: 'white', fontSize: '13px', cursor: 'pointer', fontWeight: surveyAnswers.income === opt.id ? 600 : 400
                          }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>
                      Emergency Savings
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[{ id: 'low', label: '<3 months' }, { id: 'medium', label: '3-6 months' }, { id: 'high', label: '>6 months' }].map(opt => (
                        <button key={opt.id} onClick={() => setSurveyAnswers({ ...surveyAnswers, savings: opt.id })}
                          style={{
                            flex: 1, padding: '12px', background: surveyAnswers.savings === opt.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                            border: surveyAnswers.savings === opt.id ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                            color: 'white', fontSize: '13px', cursor: 'pointer', fontWeight: surveyAnswers.savings === opt.id ? 600 : 400
                          }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>
                      Move Timeline
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[{ id: 'soon', label: '<6 months' }, { id: 'year', label: '6-12 months' }, { id: 'later', label: '>1 year' }].map(opt => (
                        <button key={opt.id} onClick={() => setSurveyAnswers({ ...surveyAnswers, timeline: opt.id })}
                          style={{
                            flex: 1, padding: '12px', background: surveyAnswers.timeline === opt.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
                            border: surveyAnswers.timeline === opt.id ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                            color: 'white', fontSize: '13px', cursor: 'pointer', fontWeight: surveyAnswers.timeline === opt.id ? 600 : 400
                          }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={calculateReadiness}
                  disabled={!surveyAnswers.income || !surveyAnswers.savings || !surveyAnswers.timeline}
                  style={{
                    width: '100%', marginTop: '24px', padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none', borderRadius: '12px', color: 'white', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
                    opacity: (!surveyAnswers.income || !surveyAnswers.savings || !surveyAnswers.timeline) ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}>
                  Calculate My Score <ArrowRight style={{ width: '18px', height: '18px' }} />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: TrendingUp, label: '10 Cities Analyzed', color: '#10b981' },
            { icon: Shield, label: 'Zero-Knowledge Privacy', color: '#8b5cf6' },
            { icon: Globe, label: 'Real-Time Data', color: '#3b82f6' }
          ].map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'
              }}>
              <feature.icon style={{ width: '18px', height: '18px', color: feature.color }} />
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{feature.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
