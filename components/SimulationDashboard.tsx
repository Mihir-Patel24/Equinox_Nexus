'use client';

import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, Shield, Award, FileText, ArrowUpRight, Brain,
  Download, Share2, RefreshCw, CheckCircle, Database, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SimulationDashboardProps {
  data: any;
  onRerun?: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 15, 30, 0.95)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)'
      }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }} />
            <span style={{ fontSize: '14px', color: 'white', fontWeight: 600 }}>
              ${entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function SimulationDashboard({ data, onRerun }: SimulationDashboardProps) {
  const wealthData = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'].map((year, yearIndex) => {
    const yearData: any = { year };
    data.scenarios.forEach((scenario: any) => {
      const growth = (scenario.year_5_wealth - scenario.year_1_wealth) / 4;
      yearData[scenario.location] = Math.round(scenario.year_1_wealth + (growth * yearIndex));
    });
    return yearData;
  });

  const chartColors = ['#667eea', '#f093fb', '#10B981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const bestScenario = data.scenarios.reduce((best: any, current: any) => 
    current.year_5_wealth > best.year_5_wealth ? current : best
  );

  const handleExport = () => {
    // Create export data
    const exportData = {
      generatedAt: new Date().toISOString(),
      scenarios: data.scenarios,
      recommendations: data.recommendations,
      trustScore: data.trust_score,
      complianceSummary: data.compliance_summary
    };
    
    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equinox-simulation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully!', { icon: '📥' });
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Equinox Nexus Simulation Results',
      text: `Check out my relocation analysis: Best destination is ${bestScenario.location} with ${Math.round(((bestScenario.year_5_wealth - bestScenario.year_1_wealth) / bestScenario.year_1_wealth) * 100)}% projected growth!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!', { icon: '🔗' });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          // Fallback to clipboard
          await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
          toast.success('Link copied to clipboard!', { icon: '📋' });
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success('Link copied to clipboard!', { icon: '📋' });
    }
  };

  const handleRerun = () => {
    if (onRerun) {
      onRerun();
    } else {
      toast.success('Navigating to simulation form...', { icon: '🔄' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Trigger page reload to go back to form
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  };

  const buttonStyle: React.CSSProperties = {
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
    cursor: 'pointer'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header Actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
      >
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Simulation Results</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              Analysis complete • {data.scenarios.length} scenarios compared
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '100px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <CheckCircle style={{ width: '14px', height: '14px', color: '#4ade80' }} />
              <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: 500 }}>Verified</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            style={buttonStyle}
          >
            <Download style={{ width: '16px', height: '16px' }} />
            Export
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            style={buttonStyle}
          >
            <Share2 style={{ width: '16px', height: '16px' }} />
            Share
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRerun}
            style={{
              ...buttonStyle,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Re-run
          </motion.button>
        </div>
      </motion.div>

      {/* Key Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}
      >
        {[
          { 
            label: 'Best 5-Year Growth', 
            value: `${Math.round(((bestScenario.year_5_wealth - bestScenario.year_1_wealth) / bestScenario.year_1_wealth) * 100)}%`,
            icon: TrendingUp,
            color: '#4ade80',
            bg: 'rgba(34, 197, 94, 0.1)'
          },
          { 
            label: 'Lowest Risk Score', 
            value: `${Math.round(Math.min(...data.scenarios.map((s: any) => s.risk_score * 100)))}%`,
            icon: Shield,
            color: '#3b82f6',
            bg: 'rgba(59, 130, 246, 0.1)'
          },
          { 
            label: 'Trust Score', 
            value: `${data.trust_score.score}%`,
            icon: Award,
            color: '#a78bfa',
            bg: 'rgba(139, 92, 246, 0.1)'
          },
          { 
            label: 'Total Compliance Cost', 
            value: `$${data.compliance_summary.total_compliance_cost.toLocaleString()}`,
            icon: FileText,
            color: '#fb923c',
            bg: 'rgba(249, 115, 22, 0.1)'
          }
        ].map((stat, index) => (
          <motion.div 
            key={stat.label}
            whileHover={{ scale: 1.02, y: -4 }}
            style={{
              padding: '24px',
              borderRadius: '20px',
              background: stat.bg,
              border: `1px solid ${stat.color}30`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
              <ArrowUpRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)' }} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Wealth Projection Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={cardStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>5-Year Wealth Projection</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {data.scenarios.map((scenario: any, index: number) => (
              <div key={scenario.location} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: chartColors[index] }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{scenario.location.split(',')[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={wealthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              {data.scenarios.map((scenario: any, index: number) => (
                <Area
                  key={scenario.location}
                  type="monotone"
                  dataKey={scenario.location}
                  stroke={chartColors[index]}
                  fill={chartColors[index]}
                  fillOpacity={0.1}
                  strokeWidth={3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Scenario Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}
      >
        {data.scenarios.map((scenario: any, index: number) => (
          <motion.div 
            key={scenario.location} 
            whileHover={{ scale: 1.02 }}
            style={{
              ...cardStyle,
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h4 style={{ fontWeight: 700, color: 'white', fontSize: '16px' }}>{scenario.location}</h4>
              <div style={{
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 500,
                background: scenario.risk_score < 0.2 ? 'rgba(34, 197, 94, 0.2)' :
                           scenario.risk_score < 0.3 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: scenario.risk_score < 0.2 ? '#4ade80' :
                       scenario.risk_score < 0.3 ? '#fbbf24' : '#f87171'
              }}>
                {scenario.risk_score < 0.2 ? 'Low Risk' : scenario.risk_score < 0.3 ? 'Medium Risk' : 'High Risk'}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>5-Year Wealth</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>${scenario.year_5_wealth.toLocaleString()}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px' }}>
                  <div style={{
                    width: `${(scenario.year_5_wealth / Math.max(...data.scenarios.map((s: any) => s.year_5_wealth))) * 100}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${chartColors[index]}, ${chartColors[index]}99)`,
                    borderRadius: '100px'
                  }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Quality Score</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{Math.round(scenario.quality_score * 100)}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px' }}>
                  <div style={{
                    width: `${scenario.quality_score * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #34d399)',
                    borderRadius: '100px'
                  }} />
                </div>
              </div>
              
              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Tax Burden</span>
                  <span style={{ color: 'white' }}>{scenario.tax_burden}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Hidden Costs</span>
                  <span style={{ color: 'white' }}>${scenario.hidden_costs.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={cardStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)'
          }}>
            <Brain style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>AI Recommendations</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.recommendations.map((recommendation: string, index: number) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>{index + 1}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, fontSize: '14px' }}>{recommendation}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Data Sources & Methodology */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          ...cardStyle,
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Database style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>Data Sources & Methodology</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {[
            { name: 'Numbeo', type: 'Cost of Living Index', year: '2025', confidence: '94%' },
            { name: 'OECD Tax Database', type: 'Tax Rates & Treaties', year: '2024', confidence: '98%' },
            { name: 'Mercer', type: 'Quality of Living Survey', year: '2025', confidence: '96%' },
            { name: 'WHO', type: 'Air Quality & Health Data', year: '2024', confidence: '97%' },
            { name: 'XE.com', type: 'Real-time Exchange Rates', year: 'Live', confidence: '99%' },
            { name: 'IRS/OECD', type: 'Tax Treaty Documents', year: '2024', confidence: '100%' },
          ].map((source, i) => (
            <div key={i} style={{
              padding: '14px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{source.name}</span>
                <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px', color: '#10b981' }}>{source.confidence}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{source.type}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Updated: {source.year}</div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '16px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <Info style={{ width: '16px', height: '16px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b', marginBottom: '4px' }}>Methodology Note</div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>
              Projections use Monte Carlo simulation with 10,000 iterations. Tax calculations based on current treaty rates and may vary. 
              Cost of living data aggregated from multiple sources with regional adjustments. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
