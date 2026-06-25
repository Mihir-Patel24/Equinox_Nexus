'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface TreatyViewerProps {
  isOpen: boolean;
  onClose: () => void;
  treaty: {
    title: string;
    article: string;
    text: string;
    source: string;
    url: string;
    calculation: string;
  };
}

export function TreatyViewer({ isOpen, onClose, treaty }: TreatyViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(treaty.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', padding: '20px'
          }} onClick={onClose}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.98) 0%, rgba(30, 20, 60, 0.98) 100%)',
              backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '24px',
              padding: '32px', maxWidth: '700px', width: '100%', maxHeight: '80vh', overflowY: 'auto'
            }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FileText style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                    {treaty.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{treaty.article}</p>
                </div>
              </div>
              <button onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
                  padding: '8px', cursor: 'pointer', color: 'white'
                }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Treaty Text */}
            <div style={{
              background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '24px',
              border: '1px solid rgba(102, 126, 234, 0.2)', marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase' }}>
                  Legal Text
                </span>
                <button onClick={handleCopy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: 'white', fontSize: '12px', cursor: 'pointer'
                  }}>
                  {copied ? <><CheckCircle style={{ width: '14px', height: '14px' }} /> Copied</> : <><Copy style={{ width: '14px', height: '14px' }} /> Copy</>}
                </button>
              </div>
              <p style={{
                fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8,
                fontFamily: 'Georgia, serif', whiteSpace: 'pre-wrap'
              }}>
                {treaty.text}
              </p>
            </div>

            {/* Calculation Explanation */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '20px', marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CheckCircle style={{ width: '18px', height: '18px', color: '#10b981' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>How This Applies to You</span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                {treaty.calculation}
              </p>
            </div>

            {/* Source */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Official Source</div>
                <div style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>{treaty.source}</div>
              </div>
              <a href={treaty.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px',
                  textDecoration: 'none', fontWeight: 600
                }}>
                View Full Treaty <ExternalLink style={{ width: '14px', height: '14px' }} />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
