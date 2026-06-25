'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Globe, Zap, ArrowRight, AlertTriangle, CheckCircle,
  RefreshCw, Copy, Sparkles, Info, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CulturalAnalysis {
  originalText: string;
  targetCulture: string;
  directnessScore: number;
  contextLevel: 'high' | 'low';
  issues: { type: string; text: string; suggestion: string }[];
  rewrittenText: string;
  culturalNotes: string[];
}

const cultureProfiles = [
  { code: 'DE', name: 'German', context: 'low', directness: 95, formality: 'formal', notes: 'Direct, explicit communication. Get to the point quickly. Avoid small talk in business.' },
  { code: 'JP', name: 'Japanese', context: 'high', directness: 25, formality: 'very-formal', notes: 'Indirect, implicit communication. Read between the lines. Harmony (wa) is paramount.' },
  { code: 'US', name: 'American', context: 'low', directness: 75, formality: 'casual', notes: 'Friendly but direct. Positive framing preferred. Time is money.' },
  { code: 'FR', name: 'French', context: 'high', directness: 55, formality: 'formal', notes: 'Eloquent and nuanced. Intellectual discourse valued. Formality in business.' },
  { code: 'NL', name: 'Dutch', context: 'low', directness: 98, formality: 'casual', notes: 'Extremely direct. Bluntness is honesty. Egalitarian culture.' },
];

export function CulturalCommunication() {
  const [inputText, setInputText] = useState('');
  const [sourceCulture, setSourceCulture] = useState('US');
  const [targetCulture, setTargetCulture] = useState('DE');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CulturalAnalysis | null>(null);
  const [showCultureInfo, setShowCultureInfo] = useState(false);

  const sampleTexts = [
    { label: 'Landlord Inquiry', text: "Hi! I hope you're doing well. I was wondering if maybe you might have some time to discuss the apartment? I think it could be a good fit, but no pressure of course! Let me know when works for you. Thanks so much! 😊" },
    { label: 'Business Proposal', text: "Hey there! Just wanted to touch base about that project we discussed. I think there might be some synergies we could explore if you're open to it. Would love to grab coffee sometime and brainstorm!" },
    { label: 'Rent Negotiation', text: "I really appreciate the apartment and everything, but I was kind of hoping we could maybe talk about the rent a little bit? I totally understand if not, but it would really help me out." },
  ];

  const analyzeText = () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      const sourceProfile = cultureProfiles.find(c => c.code === sourceCulture)!;
      const targetProfile = cultureProfiles.find(c => c.code === targetCulture)!;
      
      const mockResult: CulturalAnalysis = {
        originalText: inputText,
        targetCulture: targetProfile.name,
        directnessScore: 35,
        contextLevel: sourceProfile.context as 'high' | 'low',
        issues: [
          { type: 'Indirectness', text: 'I was wondering if maybe', suggestion: 'I would like to' },
          { type: 'Hedging', text: 'might have some time', suggestion: 'please schedule a time' },
          { type: 'Excessive Politeness', text: 'no pressure of course', suggestion: '[Remove - unnecessary in German context]' },
          { type: 'Informal Emoji', text: '😊', suggestion: '[Remove - unprofessional in German business communication]' },
          { type: 'Vague Request', text: 'Let me know when works', suggestion: 'Please propose 2-3 specific times' },
        ],
        rewrittenText: targetCulture === 'DE' 
          ? `Sehr geehrte/r [Name],

ich interessiere mich für die Wohnung in [Adresse] und möchte einen Besichtigungstermin vereinbaren.

Bitte teilen Sie mir 2-3 mögliche Termine mit.

Folgende Unterlagen kann ich vorlegen:
- Einkommensnachweis
- SCHUFA-Auskunft
- Mietschuldenfreiheitsbescheinigung

Mit freundlichen Grüßen,
[Ihr Name]`
          : `Dear [Name],

I am interested in the apartment at [Address] and would like to schedule a viewing.

Please provide 2-3 available time slots.

I can provide the following documents:
- Proof of income
- Credit report
- Previous landlord reference

Best regards,
[Your Name]`,
        culturalNotes: [
          `German business communication is direct and explicit. State your purpose in the first sentence.`,
          `Avoid hedging language ("maybe", "might", "kind of") - it signals uncertainty or unreliability.`,
          `Include concrete details and documentation upfront - Germans value thoroughness.`,
          `Use formal salutations (Sehr geehrte/r) until invited to use first names.`,
          `Emojis are generally inappropriate in German professional correspondence.`
        ]
      };

      setResult(mockResult);
      setIsAnalyzing(false);
      toast.success('Cultural analysis complete!', { icon: '🌍' });
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '100px', border: '1px solid rgba(236, 72, 153, 0.3)', marginBottom: '16px' }}>
          <MessageSquare style={{ width: '16px', height: '16px', color: '#ec4899' }} />
          <span style={{ fontSize: '13px', color: '#ec4899', fontWeight: 600 }}>Pragmatic Sentiment Analysis</span>
        </motion.div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          Cultural Communication Adapter
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>
          Detect cultural directness and rewrite for local professional norms
        </p>
      </div>

      {/* Culture Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'end' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>Your Communication Style</label>
          <select value={sourceCulture} onChange={(e) => setSourceCulture(e.target.value)}
            style={{ width: '100%', padding: '14px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '15px', cursor: 'pointer' }}>
            {cultureProfiles.map(c => <option key={c.code} value={c.code} style={{ background: '#1a1a2e', color: 'white' }}>{c.name}</option>)}
          </select>
          <div style={{ marginTop: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            Context: {cultureProfiles.find(c => c.code === sourceCulture)?.context === 'high' ? 'High (Indirect)' : 'Low (Direct)'}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <ArrowRight style={{ width: '28px', height: '28px', color: '#ec4899' }} />
        </div>
        
        <div style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>Target Audience Culture</label>
          <select value={targetCulture} onChange={(e) => setTargetCulture(e.target.value)}
            style={{ width: '100%', padding: '14px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '15px', cursor: 'pointer' }}>
            {cultureProfiles.map(c => <option key={c.code} value={c.code} style={{ background: '#1a1a2e', color: 'white' }}>{c.name}</option>)}
          </select>
          <div style={{ marginTop: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            Directness: {cultureProfiles.find(c => c.code === targetCulture)?.directness}%
          </div>
        </div>
      </div>

      {/* Sample Texts */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', alignSelf: 'center' }}>Try sample:</span>
        {sampleTexts.map((sample, i) => (
          <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setInputText(sample.text)}
            style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '12px', cursor: 'pointer' }}>
            {sample.label}
          </motion.button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px', display: 'block' }}>Your Message</label>
        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your email, message, or communication here..."
          rows={5} style={{ width: '100%', boxSizing: 'border-box', padding: '16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '14px', lineHeight: 1.6, resize: 'none', outline: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{inputText.length} characters</span>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={analyzeText} disabled={isAnalyzing}
            style={{ padding: '14px 28px', background: isAnalyzing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: isAnalyzing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAnalyzing ? <><RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Sparkles style={{ width: '16px', height: '16px' }} /> Analyze & Adapt</>}
          </motion.button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Directness Score */}
            <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>Cultural Directness Score</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Your message is too indirect for {result.targetCulture} communication</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '120px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${result.directnessScore}%`, height: '100%', background: result.directnessScore < 50 ? '#ef4444' : result.directnessScore < 75 ? '#f59e0b' : '#10b981', borderRadius: '4px' }} />
                  </div>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{result.directnessScore}%</span>
                </div>
              </div>
            </div>

            {/* Issues Found */}
            <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
                Cultural Mismatches Detected ({result.issues.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', padding: '3px 8px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '4px', color: '#f59e0b', fontWeight: 600 }}>{issue.type}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div style={{ fontSize: '10px', color: '#ef4444', marginBottom: '4px' }}>Original</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>"{issue.text}"</div>
                      </div>
                      <ArrowRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ fontSize: '10px', color: '#10b981', marginBottom: '4px' }}>Suggestion</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{issue.suggestion}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rewritten Text */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle style={{ width: '18px', height: '18px', color: '#10b981' }} />
                  Culturally Adapted Version
                </h4>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { navigator.clipboard.writeText(result.rewrittenText); toast.success('Copied to clipboard!'); }}
                  style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Copy style={{ width: '14px', height: '14px' }} /> Copy
                </motion.button>
              </div>
              <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <pre style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{result.rewrittenText}</pre>
              </div>
            </div>

            {/* Cultural Notes */}
            <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
                {result.targetCulture} Communication Tips
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.culturalNotes.map((note, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                    <Info style={{ width: '14px', height: '14px', color: '#a78bfa', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
