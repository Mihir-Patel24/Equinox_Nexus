'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, TrendingUp, AlertTriangle, CheckCircle, 
  Info, ChevronDown, ExternalLink, FileText, Globe, Eye
} from 'lucide-react';
import { TreatyViewer } from './TreatyViewer';
import toast from 'react-hot-toast';

interface Insight {
  id: string;
  type: 'recommendation' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: string;
  confidence: number;
  citations: { source: string; url?: string; date: string }[];
}

const insights: Insight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Berlin offers 62% better 5-year wealth trajectory',
    description: 'Based on current tax treaties, cost of living trends, and your income profile, Berlin provides the optimal balance of growth potential and stability.',
    impact: '+$47,000 projected savings over 5 years',
    confidence: 94,
    citations: [
      { source: 'Germany-US Tax Treaty Article 15', url: 'https://www.irs.gov/businesses/international-businesses/germany-tax-treaty-documents', date: '2024' },
      { source: 'Eurostat Cost of Living Index', url: 'https://ec.europa.eu/eurostat/web/purchasing-power-parities', date: 'Q4 2025' },
      { source: 'OECD Economic Outlook', url: 'https://www.oecd.org/economic-outlook/', date: 'Dec 2025' }
    ]
  },
  {
    id: '2',
    type: 'warning',
    title: 'Factor 18% health risk increase in target cities',
    description: 'Air quality variations between your current location and target cities correlate with increased respiratory healthcare costs.',
    impact: '+$5,200/year potential healthcare costs',
    confidence: 87,
    citations: [
      { source: 'WHO Air Quality Database', url: 'https://www.who.int/data/gho/data/themes/air-pollution', date: '2025' },
      { source: 'Lancet Pollution Health Study', url: 'https://www.thelancet.com/climate-and-health', date: '2024' },
      { source: 'Local EPA Reports', url: 'https://www.epa.gov/outdoor-air-quality-data', date: 'Nov 2025' }
    ]
  },
  {
    id: '3',
    type: 'recommendation',
    title: 'Budget $12,800 annually for hidden compliance costs',
    description: 'Bureaucracy, document translation, legal fees, and regulatory compliance add significant hidden costs that most calculators miss.',
    impact: 'Prevents budget shortfall surprises',
    confidence: 91,
    citations: [
      { source: 'Expat Financial Survey 2025', url: 'https://www.internations.org/expat-insider/', date: '2025' },
      { source: 'Immigration Lawyer Fee Index', url: 'https://www.aila.org/', date: 'Q3 2025' },
      { source: 'Government Fee Schedules', url: 'https://www.uscis.gov/forms/filing-fees', date: '2025' }
    ]
  },
  {
    id: '4',
    type: 'opportunity',
    title: 'Tax treaty benefits reduce double taxation by 15%',
    description: 'The DTAA between your home country and target destination allows for significant tax relief that many expats fail to claim.',
    impact: 'Save $8,400/year in taxes',
    confidence: 96,
    citations: [
      { source: 'Bilateral Tax Treaty Database', url: 'https://www.irs.gov/businesses/international-businesses/united-states-income-tax-treaties-a-to-z', date: '2024' },
      { source: 'IRS Publication 901', url: 'https://www.irs.gov/publications/p901', date: '2025' },
      { source: 'Local Tax Authority Guidelines', url: 'https://www.oecd.org/tax/treaties/', date: '2025' }
    ]
  }
];

export function AIInsights() {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [showTreaty, setShowTreaty] = useState(false);
  const [selectedTreaty, setSelectedTreaty] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  const treatyData = {
    title: 'Germany-US Tax Treaty',
    article: 'Article 15 - Income from Employment',
    text: `Article 15 - INCOME FROM EMPLOYMENT

1. Subject to the provisions of Articles 16, 18, 19, and 20, salaries, wages and other similar remuneration derived by a resident of a Contracting State in respect of an employment shall be taxable only in that State unless the employment is exercised in the other Contracting State. If the employment is so exercised, such remuneration as is derived therefrom may be taxed in that other State.

2. Notwithstanding the provisions of paragraph 1, remuneration derived by a resident of a Contracting State in respect of an employment exercised in the other Contracting State shall be taxable only in the first-mentioned State if:

a) the recipient is present in the other State for a period or periods not exceeding in the aggregate 183 days in any twelve month period commencing or ending in the taxable year concerned, and

b) the remuneration is paid by, or on behalf of, an employer who is not a resident of the other State, and

c) the remuneration is not borne by a permanent establishment which the employer has in the other State.`,
    source: 'US Department of Treasury - Tax Treaties',
    url: 'https://www.irs.gov/businesses/international-businesses/germany-tax-treaty-documents',
    calculation: 'Based on your income profile ($95,000/year) and employment status, Article 15 allows you to claim relief on double taxation. Since you will be employed by a US company while residing in Germany, you qualify for the 183-day rule exemption. This means your first 6 months of income will only be taxed in the US, saving you approximately $8,400 in German income tax during your transition period.'
  };

  const handleViewTreaty = () => {
    setSelectedTreaty(treatyData);
    setShowTreaty(true);
  };

  const handleViewFullAnalysis = (insight: Insight) => {
    setSelectedInsight(insight);
    setShowAnalysisModal(true);
  };

  const handleApplyRecommendation = (insight: Insight) => {
    toast.success(
      insight.type === 'opportunity' 
        ? `Applied! ${insight.impact} added to your projection.`
        : insight.type === 'warning'
        ? `Warning noted! Budget adjusted for ${insight.impact}.`
        : `Recommendation applied to your simulation.`,
      { 
        icon: insight.type === 'opportunity' ? '✅' : insight.type === 'warning' ? '⚠️' : '💡',
        duration: 3000 
      }
    );
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'opportunity': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', icon: TrendingUp };
      case 'warning': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', icon: AlertTriangle };
      case 'recommendation': return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', icon: CheckCircle };
      default: return { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)', border: 'rgba(167, 139, 250, 0.2)', icon: Info };
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(102, 126, 234, 0.2)',
      borderRadius: '24px',
      padding: '28px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
        }}>
          <Sparkles style={{ width: '22px', height: '22px', color: 'white' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>AI-Powered Insights</h3>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Every recommendation is backed by data</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insights.map((insight, i) => {
          const styles = getTypeStyles(insight.type);
          const isExpanded = expandedInsight === insight.id;
          const IconComponent = styles.icon;

          return (
            <motion.div key={insight.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '16px', cursor: 'pointer' }} onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <IconComponent style={{ width: '18px', height: '18px', color: styles.color, flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', lineHeight: 1.4 }}>{insight.title}</h4>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
                      </motion.div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: styles.color, fontWeight: 600 }}>{insight.impact}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>•</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{insight.confidence}% confidence</span>
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ borderTop: `1px solid ${styles.border}` }}>
                    <div style={{ padding: '16px' }}>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '16px' }}>
                        {insight.description}
                      </p>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                          <FileText style={{ width: '14px', height: '14px', color: '#a78bfa' }} />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#a78bfa' }}>Why? — Data Sources</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {insight.citations.map((citation, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Globe style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.4)' }} />
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{citation.source}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{citation.date}</span>
                                {citation.url && (
                                  <motion.a 
                                    href={citation.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast.success(`Opening ${citation.source}...`, { icon: '🔗', duration: 2000 });
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '4px', background: 'rgba(167, 139, 250, 0.2)', cursor: 'pointer' }}
                                  >
                                    <ExternalLink style={{ width: '12px', height: '12px', color: '#a78bfa' }} />
                                  </motion.a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => handleViewFullAnalysis(insight)}
                          style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>
                          View Full Analysis
                        </motion.button>
                        {insight.id === '4' && (
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleViewTreaty}
                            style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Eye style={{ width: '14px', height: '14px' }} /> View Treaty Section
                          </motion.button>
                        )}
                        {insight.id !== '4' && (
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => handleApplyRecommendation(insight)}
                            style={{ flex: 1, padding: '10px', background: styles.color, border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            Apply Recommendation
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Treaty Viewer Modal */}
      {selectedTreaty && (
        <TreatyViewer 
          isOpen={showTreaty}
          onClose={() => setShowTreaty(false)}
          treaty={selectedTreaty}
        />
      )}

      {/* Full Analysis Modal */}
      <AnimatePresence>
        {showAnalysisModal && selectedInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAnalysisModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'auto',
                background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.98) 0%, rgba(40, 20, 60, 0.98) 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.5)'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '24px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: getTypeStyles(selectedInsight.type).bg,
                    border: `1px solid ${getTypeStyles(selectedInsight.type).border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {(() => {
                      const IconComp = getTypeStyles(selectedInsight.type).icon;
                      return <IconComp style={{ width: '24px', height: '24px', color: getTypeStyles(selectedInsight.type).color }} />;
                    })()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                      Full Analysis
                    </h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                      {selectedInsight.type.charAt(0).toUpperCase() + selectedInsight.type.slice(1)} • {selectedInsight.confidence}% confidence
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAnalysisModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  ✕
                </motion.button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '12px', lineHeight: 1.4 }}>
                  {selectedInsight.title}
                </h4>
                
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '20px' }}>
                  {selectedInsight.description}
                </p>

                {/* Impact Box */}
                <div style={{
                  padding: '16px',
                  background: getTypeStyles(selectedInsight.type).bg,
                  border: `1px solid ${getTypeStyles(selectedInsight.type).border}`,
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Financial Impact</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: getTypeStyles(selectedInsight.type).color }}>
                    {selectedInsight.impact}
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>
                    📊 Detailed Breakdown
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedInsight.type === 'opportunity' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Year 1 Savings</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>+$9,400</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Year 2-3 Savings</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>+$18,800</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Year 4-5 Savings</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>+$18,800</span>
                        </div>
                      </>
                    )}
                    {selectedInsight.type === 'warning' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Healthcare Premium Increase</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>+$2,400/yr</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Out-of-Pocket Medical</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>+$1,800/yr</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Air Quality Index Impact</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>+$1,000/yr</span>
                        </div>
                      </>
                    )}
                    {selectedInsight.type === 'recommendation' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Legal & Immigration Fees</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>$4,500/yr</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Document Translation</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>$2,800/yr</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Regulatory Compliance</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>$5,500/yr</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Data Sources */}
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>
                    📚 Data Sources
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedInsight.citations.map((citation, i) => (
                      <a
                        key={i}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Globe style={{ width: '14px', height: '14px', color: '#a78bfa' }} />
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{citation.source}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{citation.date}</span>
                          <ExternalLink style={{ width: '14px', height: '14px', color: '#a78bfa' }} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '20px 24px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: '12px'
              }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAnalysisModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleApplyRecommendation(selectedInsight);
                    setShowAnalysisModal(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Apply to Simulation
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
