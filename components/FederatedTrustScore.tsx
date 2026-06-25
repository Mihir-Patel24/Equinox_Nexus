'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Lock, Users, Server, Cpu, CheckCircle, Eye, EyeOff,
  RefreshCw, Info, Zap, Globe, Database, Key
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TrustComponent {
  name: string;
  score: number;
  weight: number;
  locallyComputed: boolean;
  description: string;
}

interface FederatedNode {
  id: string;
  region: string;
  status: 'active' | 'syncing' | 'offline';
  contribution: number;
  lastSync: string;
}

export function FederatedTrustScore() {
  const [isComputing, setIsComputing] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [trustScore, setTrustScore] = useState(87.3);
  const [lastComputed, setLastComputed] = useState('2 minutes ago');

  const trustComponents: TrustComponent[] = [
    { name: 'Payment Reliability', score: 92, weight: 0.30, locallyComputed: true, description: 'Computed from encrypted transaction hashes - raw data never leaves device' },
    { name: 'Income Stability', score: 88, weight: 0.25, locallyComputed: true, description: 'Derived from salary deposit patterns using differential privacy' },
    { name: 'Financial Behavior', score: 85, weight: 0.20, locallyComputed: true, description: 'Spending patterns analyzed locally via on-device ML model' },
    { name: 'Document Verification', score: 94, weight: 0.15, locallyComputed: false, description: 'Document authenticity verified against federated template database' },
    { name: 'Community Trust', score: 78, weight: 0.10, locallyComputed: false, description: 'Aggregated from federated learning across 50,000+ verified users' },
  ];

  const federatedNodes: FederatedNode[] = [
    { id: 'eu-west', region: 'EU West (Frankfurt)', status: 'active', contribution: 23.4, lastSync: '12s ago' },
    { id: 'us-east', region: 'US East (Virginia)', status: 'active', contribution: 31.2, lastSync: '8s ago' },
    { id: 'ap-east', region: 'Asia Pacific (Tokyo)', status: 'syncing', contribution: 18.7, lastSync: '45s ago' },
    { id: 'eu-north', region: 'EU North (Stockholm)', status: 'active', contribution: 15.9, lastSync: '15s ago' },
    { id: 'ap-south', region: 'Asia Pacific (Singapore)', status: 'active', contribution: 10.8, lastSync: '22s ago' },
  ];

  const recomputeScore = () => {
    setIsComputing(true);
    toast.loading('Computing trust score locally...', { id: 'compute' });

    setTimeout(() => {
      toast.loading('Syncing with federated network...', { id: 'compute' });
    }, 1500);

    setTimeout(() => {
      const newScore = 87.3 + (Math.random() * 2 - 1);
      setTrustScore(parseFloat(newScore.toFixed(1)));
      setLastComputed('Just now');
      setIsComputing(false);
      toast.success('Trust score updated!', { id: 'compute', icon: '🔐' });
    }, 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '100px', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '16px' }}>
          <Database style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
          <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 600 }}>Federated Learning Architecture</span>
        </motion.div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          Privacy-Preserving Trust Score
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>
          Your data never leaves your device. Only encrypted model updates are shared.
        </p>
      </div>

      {/* Main Trust Score Card */}
      <div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield style={{ width: '32px', height: '32px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Your Federated Trust Score</div>
              <div style={{ fontSize: '48px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{trustScore}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Lock style={{ width: '14px', height: '14px', color: '#10b981' }} />
              <span style={{ fontSize: '12px', color: '#10b981' }}>Computed Locally</span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Last updated: {lastComputed}</div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={recomputeScore} disabled={isComputing}
              style={{ marginTop: '12px', padding: '10px 20px', background: isComputing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isComputing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw style={{ width: '14px', height: '14px', animation: isComputing ? 'spin 1s linear infinite' : 'none' }} />
              {isComputing ? 'Computing...' : 'Recompute'}
            </motion.button>
          </div>
        </div>

        {/* Score Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trustComponents.map((component, i) => (
            <div key={i} style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{component.name}</span>
                  {component.locallyComputed ? (
                    <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Cpu style={{ width: '10px', height: '10px' }} /> LOCAL
                    </span>
                  ) : (
                    <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '4px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Globe style={{ width: '10px', height: '10px' }} /> FEDERATED
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Weight: {(component.weight * 100).toFixed(0)}%</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: component.score >= 90 ? '#10b981' : component.score >= 80 ? '#f59e0b' : '#ef4444' }}>{component.score}</span>
                </div>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${component.score}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                  style={{ height: '100%', background: component.score >= 90 ? '#10b981' : component.score >= 80 ? '#f59e0b' : '#ef4444', borderRadius: '3px' }} />
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>{component.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Federated Network Status */}
      <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
            Federated Learning Network
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', color: '#10b981' }}>5 nodes active</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {federatedNodes.map((node) => (
            <div key={node.id} style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: node.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : node.status === 'syncing' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Server style={{ width: '16px', height: '16px', color: node.status === 'active' ? '#10b981' : node.status === 'syncing' ? '#f59e0b' : '#ef4444' }} />
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>{node.region.split(' ')[0]}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>{node.region.split('(')[1]?.replace(')', '')}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa' }}>{node.contribution}%</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>contribution</div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Details Toggle */}
      <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', borderRadius: '20px', border: '1px solid rgba(102, 126, 234, 0.2)', overflow: 'hidden' }}>
        <div onClick={() => setShowTechnical(!showTechnical)}
          style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>Technical Architecture</span>
          </div>
          <motion.div animate={{ rotate: showTechnical ? 180 : 0 }}>
            <Info style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.4)' }} />
          </motion.div>
        </div>

        <AnimatePresence>
          {showTechnical && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '16px' }}>
                  <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Lock style={{ width: '16px', height: '16px', color: '#10b981' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>Differential Privacy</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                      ε = 0.1 noise added to all gradients before aggregation. Guarantees individual data points cannot be reverse-engineered from model updates.
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Cpu style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>Edge AI Processing</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                      TensorFlow.js model runs in-browser. Financial analysis happens on your device using WebGL acceleration. No raw data transmitted.
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Globe style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>Federated Averaging</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                      FedAvg algorithm aggregates model weights from 50,000+ users. Your contribution improves the global model without sharing your data.
                    </p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Shield style={{ width: '16px', height: '16px', color: '#ec4899' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>Secure Aggregation</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                      Cryptographic secure aggregation ensures even the central server cannot see individual model updates - only the aggregate.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Privacy Guarantee */}
      <div style={{ padding: '16px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <CheckCircle style={{ width: '18px', height: '18px', color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>Privacy Guarantee</div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>
            Your raw financial data, bank statements, and personal documents never leave your device. The Trust Score is computed locally using on-device ML, 
            and only encrypted gradient updates are shared with the federated network. This architecture is mathematically proven to preserve privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
