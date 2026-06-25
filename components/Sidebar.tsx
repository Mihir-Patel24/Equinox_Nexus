'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Globe, TrendingUp, BarChart3, Settings, User, 
  Bell, Bookmark, History, HelpCircle, Shield, LogOut,
  ChevronRight, Sparkles, Brain, Calculator, Scale, Code
} from 'lucide-react';
import { useState } from 'react';
import { SignOutModal } from './SignOutModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  activeView: string;
}

export function Sidebar({ isOpen, onClose, onNavigate, activeView }: SidebarProps) {
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = () => {
    localStorage.clear();
    window.location.reload();
  };

  const menuSections = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', icon: Home, label: 'Dashboard', badge: null },
        { id: 'globe', icon: Globe, label: 'Global Map', badge: null },
        { id: 'simulations', icon: TrendingUp, label: 'Simulations', badge: '3' },
        { id: 'analytics', icon: BarChart3, label: 'Analytics', badge: null },
      ]
    },
    {
      title: 'Advanced Features',
      items: [
        { id: 'compliance', icon: Shield, label: 'Compliance Pack', badge: 'New' },
        { id: 'heatmap', icon: Globe, label: 'Neighborhood Heatmap', badge: 'New' },
        { id: 'swarm', icon: Brain, label: 'Agent Swarm', badge: 'New' },
        { id: 'blackswan', icon: TrendingUp, label: 'Black Swan Testing', badge: 'New' },
      ]
    },
    {
      title: 'AI Agents',
      items: [
        { id: 'actuary', icon: Brain, label: 'The Actuary', badge: 'Active' },
        { id: 'fiscal', icon: Calculator, label: 'Fiscal Ghost', badge: 'Active' },
        { id: 'nexus', icon: Scale, label: 'The Nexus', badge: 'Active' },
      ]
    },
    {
      title: 'Library',
      items: [
        { id: 'saved', icon: Bookmark, label: 'Saved Reports', badge: null },
        { id: 'history', icon: History, label: 'History', badge: null },
        { id: 'notifications', icon: Bell, label: 'Notifications', badge: '12' },
      ]
    },
    {
      title: 'Account',
      items: [
        { id: 'profile', icon: User, label: 'Profile', badge: null },
        { id: 'settings', icon: Settings, label: 'Settings', badge: null },
        { id: 'help', icon: HelpCircle, label: 'Help & Support', badge: null },
        { id: 'privacy', icon: Shield, label: 'Privacy', badge: null },
      ]
    }
  ];

  const handleItemClick = (itemId: string) => {
    onNavigate(itemId);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 998
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '280px',
              height: '100vh',
              background: 'linear-gradient(180deg, rgba(15, 15, 30, 0.98) 0%, rgba(30, 20, 60, 0.98) 100%)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderLeft: 'none',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'white',
                      marginBottom: '2px'
                    }}>
                      Equinox Nexus
                    </h2>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      Agentic Financial Twin
                    </p>
                  </div>
                </div>
                
                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Navigation */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 0'
            }}>
              {menuSections.map((section, sectionIndex) => (
                <div key={section.title} style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '0 20px',
                    marginBottom: '8px'
                  }}>
                    {section.title}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {section.items.map((item, itemIndex) => {
                      const isActive = activeView === item.id;
                      const isAgent = section.title === 'AI Agents';
                      
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                          onClick={() => handleItemClick(item.id)}
                          whileHover={{ x: 4 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 20px',
                            margin: '2px 8px',
                            borderRadius: '12px',
                            background: isActive 
                              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
                              : 'transparent',
                            border: isActive ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid transparent',
                            color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '14px',
                            fontWeight: isActive ? 600 : 500,
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '3px',
                                background: 'linear-gradient(180deg, #667eea, #764ba2)',
                                borderRadius: '0 2px 2px 0'
                              }}
                            />
                          )}
                          
                          <item.icon style={{ 
                            width: '18px', 
                            height: '18px',
                            color: isActive ? '#a78bfa' : 'rgba(255,255,255,0.6)'
                          }} />
                          
                          <span style={{ flex: 1 }}>{item.label}</span>
                          
                          {item.badge && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: isAgent && item.badge === 'Active' 
                                ? 'rgba(34, 197, 94, 0.2)' 
                                : 'rgba(139, 92, 246, 0.2)',
                              color: isAgent && item.badge === 'Active' 
                                ? '#4ade80' 
                                : '#a78bfa',
                              border: `1px solid ${isAgent && item.badge === 'Active' 
                                ? 'rgba(34, 197, 94, 0.3)' 
                                : 'rgba(139, 92, 246, 0.3)'}`
                            }}>
                              {item.badge}
                            </span>
                          )}
                          
                          {!item.badge && (
                            <ChevronRight style={{ 
                              width: '14px', 
                              height: '14px',
                              color: 'rgba(255,255,255,0.3)',
                              opacity: isActive ? 1 : 0,
                              transition: 'opacity 0.2s'
                            }} />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <motion.button
                whileHover={{ x: 4 }}
                onClick={() => setShowSignOutModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  width: '100%'
                }}
              >
                <LogOut style={{ width: '18px', height: '18px' }} />
                <span>Sign Out</span>
              </motion.button>
              
              <div style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                  Version 2.1.0
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                  © 2026 Equinox Nexus
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Out Modal */}
      <SignOutModal 
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
      />
    </>
  );
}
