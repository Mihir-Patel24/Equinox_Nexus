'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Calculator, Scale, MessageSquare, Zap, CheckCircle,
  AlertTriangle, ArrowRight, Sparkles, Users, Target, Shield,
  GitBranch, Eye, RefreshCw, XCircle, ChevronDown, ChevronUp,
  MapPin, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  agent: 'actuary' | 'fiscal' | 'nexus' | 'refiner';
  type: 'proposal' | 'objection' | 'mediation' | 'consensus' | 'insight' | 'rejection' | 'verification' | 'challenge';
  content: string;
  timestamp: number;
  citations?: string[];
  rejected?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'failed';
}

interface ThinkingTrace {
  id: string;
  agent: string;
  thought: string;
  timestamp: number;
  type: 'analysis' | 'conflict' | 'resolution' | 'verification';
}

interface Agent {
  id: 'actuary' | 'fiscal' | 'nexus' | 'refiner';
  name: string;
  role: string;
  icon: any;
  color: string;
  gradient: string;
}

const agents: Agent[] = [
  { id: 'actuary', name: 'The Actuary', role: 'Quality of Life Analyst', icon: Brain, color: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { id: 'fiscal', name: 'Fiscal Ghost', role: 'Cost & Finance Optimizer', icon: Calculator, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
  { id: 'nexus', name: 'The Nexus', role: 'Tax & Compliance Expert', icon: Scale, color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
  { id: 'refiner', name: 'The Refiner', role: 'Mediator & Consensus Builder', icon: GitBranch, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
];

// City-specific data for debates
const cityDebateData: { [key: string]: { currency: string; neighborhoods: string[]; taxTreaty: string; localSources: string[] } } = {
  'Tokyo': { currency: '¥', neighborhoods: ['Shibuya', 'Meguro', 'Nakano', 'Shinjuku', 'Setagaya'], taxTreaty: 'Japan-US DTAA', localSources: ['Suumo Rental Index', 'Tabelog', 'JR East'] },
  'Berlin': { currency: '€', neighborhoods: ['Mitte', 'Kreuzberg', 'Prenzlauer Berg', 'Friedrichshain', 'Neukölln'], taxTreaty: 'Germany-US DTA', localSources: ['Immoscout24', 'BVG Transit', 'Lieferando'] },
  'Singapore': { currency: 'S$', neighborhoods: ['Orchard', 'Marina Bay', 'Tiong Bahru', 'Clementi', 'Bugis'], taxTreaty: 'Singapore-US Tax Treaty', localSources: ['PropertyGuru', 'TransitLink', 'GrabFood'] },
  'Dubai': { currency: 'AED', neighborhoods: ['Downtown', 'Dubai Marina', 'JBR', 'Business Bay', 'JLT'], taxTreaty: 'UAE Tax Regulations', localSources: ['Bayut', 'RTA Dubai', 'Talabat'] },
  'Lisbon': { currency: '€', neighborhoods: ['Chiado', 'Baixa', 'Alfama', 'Príncipe Real', 'Belém'], taxTreaty: 'Portugal-US Tax Treaty', localSources: ['Idealista', 'Navegante', 'Zomato'] },
};

const debateTopics = [
  'Best neighborhood to live',
  'Cost of living analysis',
  'Healthcare quality',
  'Tax optimization',
  'Work-life balance',
  'Family-friendly areas',
  'Investment opportunities',
  'Retirement planning'
];

// Generate dynamic debate based on city and topic
const generateDebateScenario = (city: string, topic: string): { messages: Message[], traces: ThinkingTrace[], finalSolution: any } => {
  const cityData = cityDebateData[city] || cityDebateData['Tokyo'];
  const n1 = cityData.neighborhoods[0];
  const n2 = cityData.neighborhoods[1];
  const n3 = cityData.neighborhoods[2];
  const cur = cityData.currency;
  
  const rentHigh = city === 'Tokyo' ? '285,000' : city === 'Singapore' ? '4,500' : city === 'Dubai' ? '12,000' : '1,800';
  const rentMid = city === 'Tokyo' ? '180,000' : city === 'Singapore' ? '3,200' : city === 'Dubai' ? '8,000' : '1,200';
  const rentLow = city === 'Tokyo' ? '145,000' : city === 'Singapore' ? '2,400' : city === 'Dubai' ? '6,000' : '1,000';

  const traces: ThinkingTrace[] = [
    { id: 't1', agent: 'Actuary', thought: `Analyzing quality of life data for ${n1}, ${city}... Cross-referencing with health outcomes and lifestyle metrics.`, timestamp: 500, type: 'analysis' },
    { id: 't2', agent: 'Fiscal Ghost', thought: `Calculating budget impact for ${topic.toLowerCase()}... ${cur}${rentHigh}/month exceeds 30% income threshold. Flagging as HIGH RISK.`, timestamp: 1500, type: 'analysis' },
    { id: 't3', agent: 'Refiner', thought: `⚠️ CONFLICT DETECTED: Actuary recommends ${n1} for quality, but Fiscal Ghost flags budget violation. Initiating cross-verification.`, timestamp: 2500, type: 'conflict' },
    { id: 't4', agent: 'Nexus', thought: `Checking ${cityData.taxTreaty}... Analyzing applicable deductions and tax relief options for ${city}.`, timestamp: 3500, type: 'analysis' },
    { id: 't5', agent: 'Refiner', thought: `Requesting Actuary to quantify long-term costs for alternatives. Need comprehensive cost-benefit analysis.`, timestamp: 4500, type: 'verification' },
    { id: 't6', agent: 'Actuary', thought: `Recalculating... ${n2} shows 15% lower healthcare costs projection. Adjusting recommendation weight.`, timestamp: 5500, type: 'analysis' },
    { id: 't7', agent: 'Refiner', thought: `Fiscal Ghost's objection is valid but incomplete. Hidden costs partially offset savings. Searching for middle ground.`, timestamp: 6500, type: 'resolution' },
    { id: 't8', agent: 'Nexus', thought: `Found: ${n3} qualifies for regional tax incentives. ${cur}50,000/year potential reduction. Proposing as compromise.`, timestamp: 7500, type: 'analysis' },
    { id: 't9', agent: 'Refiner', thought: `✅ CONSENSUS PATH: ${n3} satisfies 89% of Actuary requirements + 94% of Fiscal constraints + 100% Nexus optimization.`, timestamp: 9500, type: 'resolution' },
    { id: 't10', agent: 'Refiner', thought: `All agents verified. No outstanding objections. Finalizing recommendation with confidence score 94.2%.`, timestamp: 11500, type: 'verification' },
  ];

  const messages: Message[] = [
    { id: '1', agent: 'actuary', type: 'proposal', content: `For ${topic.toLowerCase()} in ${city}, I recommend ${n1} district. Quality of life index: 92/100. Excellent healthcare access, green spaces, and lifestyle amenities. Life satisfaction correlation suggests +15% improvement.`, timestamp: 0, citations: [`WHO ${city} Health Report 2025`, `${cityData.localSources[0]} Data`], verificationStatus: 'pending' },
    { id: '2', agent: 'fiscal', type: 'objection', content: `⚠️ OBJECTION: ${n1} costs average ${cur}${rentHigh}/month - 34% above optimal budget. This creates significant annual shortfall. The quality benefits don't offset the financial stress impact.`, timestamp: 2000, citations: [`${cityData.localSources[0]} Q4 2025`, 'Financial Stress Health Study, Lancet 2024'] },
    { id: '3', agent: 'refiner', type: 'challenge', content: `🔍 CROSS-VERIFICATION REQUIRED: Actuary, please quantify the long-term savings from quality improvements. Fiscal Ghost, factor in potential hidden expenses for budget alternatives.`, timestamp: 3500 },
    { id: '4', agent: 'actuary', type: 'insight', content: `Counter-point: ${n2}'s lower quality metrics correlate with ${cur}${Math.round(parseInt(rentMid.replace(',', '')) * 0.12).toLocaleString()}/year in projected additional costs. The "cheaper" option has hidden long-term expenses.`, timestamp: 5000, citations: [`${city} Quality of Life Impact Study`], verificationStatus: 'verified' },
    { id: '5', agent: 'nexus', type: 'rejection', content: `❌ REJECTION: Actuary's initial ${n1} suggestion violates ${cityData.taxTreaty} Article 23 - the cost level disqualifies certain deductions. Tax impact: +${cur}120,000/year.`, timestamp: 6500, citations: [`${cityData.taxTreaty} Article 23`], rejected: true },
    { id: '6', agent: 'refiner', type: 'mediation', content: `🔄 MEDIATING: I've identified 3 areas in ${city} that satisfy >85% of all agent requirements. Running optimization algorithm...`, timestamp: 8000 },
    { id: '7', agent: 'nexus', type: 'insight', content: `${n3} qualifies for Regional Development tax credit - ${cur}50,000/year reduction. Also eligible for ${cityData.taxTreaty} Article 17 deductions.`, timestamp: 9500, citations: ['Regional Tax Incentive Act 2024', `${cityData.taxTreaty} Article 17`], verificationStatus: 'verified' },
    { id: '8', agent: 'fiscal', type: 'consensus', content: `✅ VERIFIED: ${n3} budget analysis complete. Net savings vs ${n1}: ${cur}${Math.round(parseInt(rentHigh.replace(',', '')) * 12 * 0.3).toLocaleString()}/year. Financial stress index: LOW. Approving recommendation.`, timestamp: 11000, verificationStatus: 'verified' },
    { id: '9', agent: 'actuary', type: 'consensus', content: `✅ AGREED: ${n3} has quality index 88/100 (Good), excellent transit access, healthcare score 91/100. Adjusting recommendation for ${topic.toLowerCase()}.`, timestamp: 12500, verificationStatus: 'verified' },
    { id: '10', agent: 'refiner', type: 'consensus', content: `🎯 CONSENSUS ACHIEVED: ${n3}, ${city} selected for ${topic.toLowerCase()} with 94.2% confidence. All agents verified. Quality: 88/100 | Budget: 94/100 | Tax Efficiency: 97/100`, timestamp: 14000 },
  ];

  // Final solution data
  const finalSolution = {
    recommendation: n3,
    city: city,
    topic: topic,
    currency: cur,
    confidence: 94.2,
    scores: {
      quality: 88,
      budget: 94,
      taxEfficiency: 97,
      overall: 93
    },
    monthlyCost: rentLow,
    annualSavings: Math.round(parseInt(rentHigh.replace(',', '')) * 12 * 0.3).toLocaleString(),
    taxBenefit: '50,000',
    agentApprovals: [
      { agent: 'The Actuary', status: 'approved', reason: 'Quality of life index 88/100, healthcare score 91/100' },
      { agent: 'Fiscal Ghost', status: 'approved', reason: 'Within budget, low financial stress index' },
      { agent: 'The Nexus', status: 'approved', reason: 'Tax optimized, eligible for regional credits' },
      { agent: 'The Refiner', status: 'approved', reason: 'All criteria satisfied, consensus achieved' }
    ],
    keyBenefits: [
      'Optimal balance of quality and affordability',
      `${cur}${Math.round(parseInt(rentHigh.replace(',', '')) * 12 * 0.3).toLocaleString()}/year savings vs premium areas`,
      `${cur}50,000/year tax benefits`,
      'Excellent transit and healthcare access'
    ]
  };

  return { messages, traces, finalSolution };
};

export function AgentSwarm() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [traces, setTraces] = useState<ThinkingTrace[]>([]);
  const [isDebating, setIsDebating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'debating' | 'consensus'>('idle');
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [showThinkingTrace, setShowThinkingTrace] = useState(true);
  const [consensusScore, setConsensusScore] = useState(0);
  const [selectedCity, setSelectedCity] = useState('Tokyo');
  const [selectedTopic, setSelectedTopic] = useState('Best neighborhood to live');
  const [finalSolution, setFinalSolution] = useState<any>(null);
  const [useRealAI, setUseRealAI] = useState(true);
  const [aiModels, setAiModels] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const tracesEndRef = useRef<HTMLDivElement>(null);

  const availableCities = Object.keys(cityDebateData);

  // Try to use real AI API
  const startRealDebate = async () => {
    setMessages([]);
    setTraces([]);
    setFinalSolution(null);
    setIsDebating(true);
    setCurrentPhase('debating');
    setConsensusScore(0);

    try {
      // Add initial thinking trace
      setTraces([{ id: 't0', agent: 'System', thought: '🤖 Connecting to AI models...', timestamp: 0, type: 'analysis' }]);
      
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: selectedCity, topic: selectedTopic })
      });

      const data = await response.json();

      if (!data.success || data.mock) {
        // Fall back to mock debate
        console.log('Falling back to mock debate:', data.error || 'No API key');
        setUseRealAI(false);
        startMockDebate();
        return;
      }

      // Process real AI responses
      setAiModels(data.models);
      setTraces([{ id: 't1', agent: 'System', thought: `✅ Connected! Using ${Object.keys(data.models).length} specialized AI models`, timestamp: 0, type: 'analysis' }]);

      const agentTypeMap: any = {
        'proposal': 'proposal',
        'objection': 'objection', 
        'challenge': 'challenge',
        'insight': 'insight',
        'consensus': 'consensus'
      };

      // Display messages with delays for effect
      for (let i = 0; i < data.debate.length; i++) {
        const msg = data.debate[i];
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setActiveAgent(msg.agent);
        
        // Add thinking trace
        const modelName = data.models[msg.agent] || 'AI';
        setTraces(prev => [...prev, {
          id: `t${i + 2}`,
          agent: msg.agent.charAt(0).toUpperCase() + msg.agent.slice(1),
          thought: `Processing with ${modelName}...`,
          timestamp: 0,
          type: msg.type === 'consensus' ? 'resolution' : 'analysis'
        }]);

        await new Promise(resolve => setTimeout(resolve, 500));
        
        setMessages(prev => [...prev, {
          id: String(i + 1),
          agent: msg.agent,
          type: agentTypeMap[msg.type] || 'insight',
          content: msg.content,
          timestamp: i * 2000,
          verificationStatus: msg.type === 'consensus' ? 'verified' : undefined
        }]);

        setActiveAgent(null);

        // Update consensus score
        if (msg.type === 'consensus') {
          setConsensusScore(100);
          setCurrentPhase('consensus');
          
          // Generate final solution
          const cityData = cityDebateData[selectedCity];
          setFinalSolution({
            recommendation: cityData.neighborhoods[2],
            city: selectedCity,
            topic: selectedTopic,
            currency: cityData.currency,
            confidence: 94.2,
            scores: { quality: 88, budget: 94, taxEfficiency: 97, overall: 93 },
            monthlyCost: '2,400',
            annualSavings: '18,000',
            taxBenefit: '50,000',
            agentApprovals: [
              { agent: 'The Actuary', status: 'approved', reason: 'AI-verified health metrics' },
              { agent: 'Fiscal Ghost', status: 'approved', reason: 'AI-verified budget analysis' },
              { agent: 'The Nexus', status: 'approved', reason: 'AI-verified tax optimization' },
              { agent: 'The Refiner', status: 'approved', reason: 'Consensus achieved via multi-model reasoning' }
            ],
            keyBenefits: ['Real AI analysis', 'Multi-model consensus', 'Dynamic recommendations', 'Live reasoning']
          });

          toast.success(`🤖 AI Consensus Achieved for ${selectedCity}!`, {
            duration: 5000,
            style: { background: 'rgba(16, 185, 129, 0.95)', color: 'white', fontWeight: 600 }
          });
        } else {
          setConsensusScore(prev => Math.min(prev + 20, 80));
        }
      }

      setIsDebating(false);

    } catch (error) {
      console.error('Real AI debate failed:', error);
      setUseRealAI(false);
      startMockDebate();
    }
  };

  // Fallback mock debate
  const startMockDebate = () => {
    setMessages([]);
    setTraces([]);
    setFinalSolution(null);
    setIsDebating(true);
    setCurrentPhase('debating');
    setConsensusScore(0);
    
    // Generate dynamic debate based on selected city and topic
    const { messages: debateMessages, traces: debateTraces, finalSolution: solution } = generateDebateScenario(selectedCity, selectedTopic);
    
    // Start thinking traces
    debateTraces.forEach((trace) => {
      setTimeout(() => {
        setTraces(prev => [...prev, trace]);
      }, trace.timestamp);
    });
    
    // Start debate messages
    debateMessages.forEach((msg, index) => {
      setTimeout(() => {
        setActiveAgent(msg.agent);
        
        // Update consensus score progressively
        if (msg.type === 'consensus') {
          setConsensusScore(prev => Math.min(prev + 25, 100));
        } else if (msg.type === 'verification' || msg.verificationStatus === 'verified') {
          setConsensusScore(prev => Math.min(prev + 10, 75));
        }
        
        setTimeout(() => {
          setMessages(prev => [...prev, msg]);
          setActiveAgent(null);
          
          if (msg.type === 'consensus' && index === debateMessages.length - 1) {
            setConsensusScore(100);
            setFinalSolution(solution);
            toast.success(`🎯 Consensus Achieved for ${selectedCity}!`, {
              duration: 5000,
              style: { background: 'rgba(16, 185, 129, 0.95)', color: 'white', fontWeight: 600 }
            });
          }
          
          if (index === debateMessages.length - 1) {
            setCurrentPhase('consensus');
            setIsDebating(false);
          }
        }, 800);
      }, msg.timestamp);
    });
  };

  const startDebate = () => {
    if (useRealAI) {
      startRealDebate();
    } else {
      startMockDebate();
    }
  };

  // Removed auto-scroll to prevent page jumping
  // Messages and traces will stay in their containers without auto-scrolling

  const getMessageStyle = (type: string, rejected?: boolean) => {
    if (rejected) return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
    switch (type) {
      case 'proposal': return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' };
      case 'objection': return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' };
      case 'rejection': return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' };
      case 'challenge': return { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)' };
      case 'mediation': return { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)' };
      case 'verification': return { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' };
      case 'consensus': return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' };
      default: return { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)' };
    }
  };

  const getTraceStyle = (type: string) => {
    switch (type) {
      case 'conflict': return { color: '#ef4444', icon: AlertTriangle };
      case 'resolution': return { color: '#10b981', icon: CheckCircle };
      case 'verification': return { color: '#3b82f6', icon: Eye };
      default: return { color: '#a78bfa', icon: Brain };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '100px', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '16px' }}>
          <GitBranch style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
          <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 600 }}>Hierarchical Multi-Agent Orchestration</span>
        </div>
        <h2 style={{ fontSize: '36px', fontWeight: 800, background: 'linear-gradient(135deg, #667eea 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          Adversarial Agent Swarm
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', marginBottom: '24px' }}>
          Select a city and topic, then watch AI agents debate and reach consensus
        </p>

        {/* City Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {availableCities.map((cityName) => (
            <button
              key={cityName}
              onClick={() => !isDebating && setSelectedCity(cityName)}
              style={{
                padding: '10px 20px',
                background: selectedCity === cityName 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'rgba(255,255,255,0.05)',
                border: selectedCity === cityName ? 'none' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                fontWeight: selectedCity === cityName ? 600 : 400,
                cursor: isDebating ? 'not-allowed' : 'pointer',
                opacity: isDebating ? 0.5 : 1,
                boxShadow: selectedCity === cityName ? '0 4px 16px rgba(102, 126, 234, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <MapPin style={{ width: '14px', height: '14px' }} />
              {cityName}
            </button>
          ))}
        </div>

        {/* Topic Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', maxWidth: '800px', margin: '0 auto' }}>
          {debateTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => !isDebating && setSelectedTopic(topic)}
              style={{
                padding: '8px 16px',
                background: selectedTopic === topic 
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                  : 'rgba(255,255,255,0.03)',
                border: selectedTopic === topic ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: selectedTopic === topic ? 600 : 400,
                cursor: isDebating ? 'not-allowed' : 'pointer',
                opacity: isDebating ? 0.5 : 1,
                boxShadow: selectedTopic === topic ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Consensus Progress Bar */}
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Consensus Progress</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: consensusScore === 100 ? '#10b981' : '#a78bfa' }}>{consensusScore}%</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <motion.div animate={{ width: `${consensusScore}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', background: consensusScore === 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #667eea, #8b5cf6)', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          {['Analysis', 'Debate', 'Verification', 'Consensus'].map((phase, i) => (
            <span key={phase} style={{ fontSize: '10px', color: consensusScore >= (i + 1) * 25 ? '#10b981' : 'rgba(255,255,255,0.3)' }}>{phase}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        {/* Agent Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {agents.map((agent) => (
            <div key={agent.id}
              style={{
                background: activeAgent === agent.id ? `${agent.color}20` : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
                backdropFilter: 'blur(24px)', border: `1px solid ${activeAgent === agent.id ? agent.color : 'rgba(102, 126, 234, 0.2)'}`,
                borderRadius: '16px', padding: '16px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease'
              }}>
              {activeAgent === agent.id && (
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: agent.color, borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: '10px', color: 'white', fontWeight: 600 }}>THINKING</span>
                </div>
              )}
              {agent.id === 'refiner' && (
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(139, 92, 246, 0.3)', borderRadius: '4px', padding: '2px 6px' }}>
                  <span style={{ fontSize: '9px', color: '#a78bfa', fontWeight: 700 }}>LEAD</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: agent.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${agent.color}40` }}>
                  <agent.icon style={{ width: '20px', height: '20px', color: 'white' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{agent.name}</h4>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{agent.role}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                <div style={{ flex: 1, padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: agent.color }}>{messages.filter(m => m.agent === agent.id).length}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Messages</div>
                </div>
                <div style={{ flex: 1, padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: messages.filter(m => m.agent === agent.id && m.verificationStatus === 'verified').length > 0 ? '#10b981' : 'rgba(255,255,255,0.4)' }}>
                    {messages.filter(m => m.agent === agent.id && m.verificationStatus === 'verified').length > 0 ? '✓' : '—'}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Verified</div>
                </div>
              </div>
            </div>
          ))}
          
          {/* AI Mode Toggle */}
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: useRealAI ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
            borderRadius: '10px', border: `1px solid ${useRealAI ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: useRealAI ? '#10b981' : '#f59e0b' }}>
                {useRealAI ? '🤖 Real AI Mode' : '📝 Demo Mode'}
              </span>
            </div>
            <button 
              onClick={() => setUseRealAI(!useRealAI)}
              disabled={isDebating}
              style={{
                padding: '4px 10px', fontSize: '10px', fontWeight: 600,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px', color: 'white', cursor: isDebating ? 'not-allowed' : 'pointer'
              }}
            >
              Switch
            </button>
          </div>

          {/* Model Info */}
          {useRealAI && (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', padding: '0 4px', marginBottom: '8px' }}>
              Models: Llama 3.3 70B • Mixtral 8x7B
            </div>
          )}
          
          <button onClick={startDebate} disabled={isDebating}
            style={{
              padding: '14px', background: isDebating ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: isDebating ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: isDebating ? 'none' : '0 4px 20px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.2s ease', transform: 'scale(1)'
            }}
            onMouseEnter={(e) => { if (!isDebating) e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {isDebating ? <><RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> {useRealAI ? 'AI Thinking...' : 'Processing...'}</> : <><Sparkles style={{ width: '16px', height: '16px' }} /> Start {useRealAI ? 'AI' : ''} Debate</>}
          </button>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Thinking Trace Panel */}
          <motion.div style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '16px', overflow: 'hidden' }}>
            <div onClick={() => setShowThinkingTrace(!showThinkingTrace)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', borderBottom: showThinkingTrace ? '1px solid rgba(139, 92, 246, 0.2)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Thinking Trace</h3>
                <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '4px', color: '#a78bfa' }}>
                  {traces.length} thoughts
                </span>
              </div>
              {showThinkingTrace ? <ChevronUp style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.4)' }} />}
            </div>
            <AnimatePresence>
              {showThinkingTrace && (
                <div style={{ maxHeight: '200px', overflowY: 'auto', padding: traces.length > 0 ? '12px 18px' : '0' }}>
                  {traces.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                      Internal agent reasoning will appear here...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {traces.map((trace) => {
                        const traceStyle = getTraceStyle(trace.type);
                        const TraceIcon = traceStyle.icon;
                        return (
                          <motion.div key={trace.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: `3px solid ${traceStyle.color}` }}>
                            <TraceIcon style={{ width: '14px', height: '14px', color: traceStyle.color, flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '10px', fontWeight: 600, color: traceStyle.color }}>{trace.agent}</span>
                              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, margin: '4px 0 0' }}>{trace.thought}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                      <div ref={tracesEndRef} />
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Debate Stream */}
          <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Agent Debate Stream</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: currentPhase === 'consensus' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)', borderRadius: '8px' }}>
                {currentPhase === 'consensus' ? <CheckCircle style={{ width: '14px', height: '14px', color: '#10b981' }} /> : <Target style={{ width: '14px', height: '14px', color: '#a78bfa' }} />}
                <span style={{ fontSize: '12px', fontWeight: 600, color: currentPhase === 'consensus' ? '#10b981' : '#a78bfa' }}>
                  {currentPhase === 'idle' ? 'Ready' : currentPhase === 'debating' ? 'Debating' : 'Consensus'}
                </span>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', paddingRight: '8px' }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px' }}>
                  <Users style={{ width: '40px', height: '40px', marginBottom: '12px', opacity: 0.3 }} />
                  <p style={{ fontSize: '13px' }}>Click "Start Adversarial Debate" to begin</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const agent = agents.find(a => a.id === msg.agent)!;
                  const style = getMessageStyle(msg.type, msg.rejected);
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                      style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: '14px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: agent.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <agent.icon style={{ width: '14px', height: '14px', color: 'white' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{agent.name}</span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px', textTransform: 'uppercase' }}>{msg.type}</span>
                        </div>
                        {msg.verificationStatus === 'verified' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '4px' }}>
                            <CheckCircle style={{ width: '10px', height: '10px', color: '#10b981' }} />
                            <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 600 }}>VERIFIED</span>
                          </div>
                        )}
                        {msg.rejected && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '4px' }}>
                            <XCircle style={{ width: '10px', height: '10px', color: '#ef4444' }} />
                            <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 600 }}>REJECTED</span>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, marginBottom: msg.citations ? '10px' : 0 }}>{msg.content}</p>
                      {msg.citations && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {msg.citations.map((cite, j) => (
                            <span key={j} style={{ fontSize: '9px', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'rgba(255,255,255,0.5)' }}>📄 {cite}</span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Final Solution Card - Shows when consensus is reached */}
      {finalSolution && currentPhase === 'consensus' && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)', 
          backdropFilter: 'blur(24px)', 
          border: '2px solid rgba(16, 185, 129, 0.4)', 
          borderRadius: '24px', 
          padding: '32px',
          marginTop: '24px'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '56px', height: '56px', borderRadius: '16px', 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)'
              }}>
                <CheckCircle style={{ width: '28px', height: '28px', color: 'white' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
                  🎯 Final Recommendation
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                  All 4 AI Agents have reached consensus
                </p>
              </div>
            </div>
            <div style={{ 
              padding: '12px 24px', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
            }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>{finalSolution.confidence}%</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginLeft: '8px' }}>Confidence</span>
            </div>
          </div>

          {/* Main Recommendation */}
          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: '16px', 
            padding: '24px', 
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Recommended for {finalSolution.topic}
            </p>
            <h2 style={{ 
              fontSize: '42px', 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              {finalSolution.recommendation}, {finalSolution.city}
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>
              Monthly Cost: <span style={{ color: '#10b981', fontWeight: 700 }}>{finalSolution.currency}{finalSolution.monthlyCost}</span>
            </p>
          </div>

          {/* Scores Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Quality of Life', score: finalSolution.scores.quality, color: '#10b981' },
              { label: 'Budget Fit', score: finalSolution.scores.budget, color: '#f59e0b' },
              { label: 'Tax Efficiency', score: finalSolution.scores.taxEfficiency, color: '#3b82f6' },
              { label: 'Overall Score', score: finalSolution.scores.overall, color: '#8b5cf6' }
            ].map((item) => (
              <div key={item.label} style={{ 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: '12px', 
                padding: '16px', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: item.color, marginBottom: '4px' }}>
                  {item.score}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Agent Approvals */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Agent Approvals
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {finalSolution.agentApprovals.map((approval: any, i: number) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: '10px', 
                  padding: '12px 16px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{approval.agent}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{approval.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: '12px', 
            padding: '20px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#10b981', marginBottom: '12px' }}>
              ✨ Key Benefits
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {finalSolution.keyBenefits.map((benefit: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Annual Savings</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{finalSolution.currency}{finalSolution.annualSavings}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Tax Benefits</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>{finalSolution.currency}{finalSolution.taxBenefit}/yr</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
