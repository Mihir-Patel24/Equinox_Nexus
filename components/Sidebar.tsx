'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, TrendingUp, BarChart3, Brain, Calculator, Scale, Shield,
  Bookmark, History, Settings, HelpCircle, X, Layers,
  Cpu, Target, Zap, ChevronRight, FlaskConical
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  activeView: string;
  hasSimulationData?: boolean;
}

export function Sidebar({ isOpen, onClose, onNavigate, activeView, hasSimulationData = false }: SidebarProps) {

  const handleNav = (id: string) => {
    onNavigate(id);
    onClose();
  };

  const sections = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', icon: Home, label: 'Dashboard', badge: null, locked: false },
        { id: 'simulations', icon: TrendingUp, label: 'New Simulation', badge: null, locked: false },
        { id: 'results', icon: Layers, label: 'Results', badge: hasSimulationData ? 'Ready' : null, locked: false },
      ]
    },
    {
      title: 'AI Intelligence',
      items: [
        { id: 'chronos', icon: BarChart3, label: 'Chronos — Monte Carlo', badge: null, locked: !hasSimulationData },
        { id: 'xai',     icon: Target,        label: 'XAI — Explainability', badge: null, locked: !hasSimulationData },
        { id: 'eval',    icon: FlaskConical,   label: 'Evaluation',            badge: hasSimulationData ? 'New' : null, locked: !hasSimulationData },
        { id: 'decision',icon: Cpu,            label: 'Decision Intelligence', badge: null, locked: !hasSimulationData },
      ]
    },
    {
      title: 'AI Agents',
      items: [
        { id: 'actuary', icon: Brain, label: 'The Actuary', badge: hasSimulationData ? 'Live' : null, locked: !hasSimulationData },
        { id: 'fiscal', icon: Calculator, label: 'Fiscal Ghost', badge: hasSimulationData ? 'Live' : null, locked: !hasSimulationData },
        { id: 'nexus', icon: Scale, label: 'The Nexus', badge: hasSimulationData ? 'Live' : null, locked: !hasSimulationData },
        { id: 'payroll', icon: Shield, label: 'Payroll Intel', badge: 'Upload', locked: false },
      ]
    },
    {
      title: 'Reports',
      items: [
        { id: 'saved', icon: Bookmark, label: 'Saved Twins', badge: null, locked: false },
        { id: 'history', icon: History, label: 'History', badge: null, locked: false },
      ]
    },
    {
      title: 'Account',
      items: [
        { id: 'profile', icon: Zap, label: 'Profile', badge: null, locked: false },
        { id: 'settings', icon: Settings, label: 'Settings', badge: null, locked: false },
        { id: 'help', icon: HelpCircle, label: 'Help', badge: null, locked: false },
      ]
    },
  ];

  const badgeColor: Record<string, string> = {
    'Ready': '#10b981',
    'Live': '#3b82f6',
    'New': '#a855f7',
    'Upload': '#ef4444',
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              zIndex: 998
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{
              position: 'fixed', top: 0, left: 0,
              width: '275px', height: '100vh',
              background: 'linear-gradient(180deg, rgba(12,12,28,0.99) 0%, rgba(20,14,40,0.99) 100%)',
              backdropFilter: 'blur(32px)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              zIndex: 999,
              display: 'flex', flexDirection: 'column',
              boxShadow: '8px 0 40px rgba(0,0,0,0.5)'
            }}
          >
            {/* Logo Header */}
            <div style={{
              padding: '22px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(102,126,234,0.4)'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                    Equinox Nexus
                  </h2>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
                    Agentic Financial Twin · v3.2
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s, color 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Simulation Status Banner */}
            {hasSimulationData && (
              <div style={{
                margin: '12px 14px 0',
                padding: '10px 14px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(59,130,246,0.08) 100%)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                  Simulation data loaded · All agents active
                </span>
              </div>
            )}

            {/* Nav Sections */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 0 20px', scrollbarWidth: 'none' }}>
              {sections.map((section) => (
                <div key={section.title} style={{ marginBottom: '6px' }}>
                  <p style={{
                    fontSize: '10px', fontWeight: 700,
                    color: 'rgba(255,255,255,0.28)',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                    padding: '14px 20px 6px'
                  }}>
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const isLocked = item.locked;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !isLocked && handleNav(item.id)}
                        disabled={isLocked}
                        style={{
                          width: '100%', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 14px 9px 20px',
                          background: isActive
                            ? 'linear-gradient(90deg, rgba(102,126,234,0.18) 0%, rgba(102,126,234,0.06) 100%)'
                            : 'transparent',
                          border: 'none',
                          borderLeft: isActive ? '2px solid #667eea' : '2px solid transparent',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          borderRadius: '0 10px 10px 0',
                          marginRight: '10px',
                          opacity: isLocked ? 0.4 : 1,
                          transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (!isLocked && !isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Icon
                          size={16}
                          color={isActive ? '#818cf8' : 'rgba(255,255,255,0.45)'}
                          style={{ flexShrink: 0 }}
                        />
                        <span style={{
                          flex: 1, fontSize: '13.5px', fontWeight: isActive ? 600 : 500,
                          color: isActive ? 'white' : 'rgba(255,255,255,0.6)'
                        }}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span style={{
                            fontSize: '10px', fontWeight: 700,
                            padding: '2px 7px', borderRadius: '20px',
                            background: `${badgeColor[item.badge] || '#6b7280'}20`,
                            color: badgeColor[item.badge] || '#6b7280',
                            border: `1px solid ${badgeColor[item.badge] || '#6b7280'}30`
                          }}>
                            {item.badge}
                          </span>
                        )}
                        {isLocked && !item.badge && (
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>🔒</span>
                        )}
                        {isActive && <ChevronRight size={14} color="#818cf8" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.3))',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '13px' }}>🧠</span>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Equinox Nexus</p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Groq · ChromaDB · LangGraph</p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
