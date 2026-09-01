'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimulationDashboard } from '@/components/SimulationDashboard';
import { SimulationForm } from '@/components/SimulationForm';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { HeroSection } from '@/components/HeroSection';
import { Sidebar } from '@/components/Sidebar';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { ChronosView } from '@/components/ChronosView';
import { XAIView } from '@/components/XAIView';
import { NexusView } from '@/components/NexusView';
import { ActuaryView } from '@/components/ActuaryView';
import { FiscalView } from '@/components/FiscalView';
import { PayrollIntelView } from '@/components/PayrollIntelView';
import { EvaluationView } from '@/components/EvaluationView';
import { InteractiveGlobe } from '@/components/InteractiveGlobe';
import { Toaster, toast } from 'react-hot-toast';
import { Menu, TrendingUp, Brain, BarChart3, Zap } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [simulationData, setSimulationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [stepSubtexts, setStepSubtexts] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [savedTwins, setSavedTwins] = useState<any[]>([]);
  const [twinsLoading, setTwinsLoading] = useState(false);
  // ── Drift report state (autonomous twin loop) ─────────────────────────
  const [activeTwinId, setActiveTwinId] = useState<string | null>(null);

  // ── Profile persisted to localStorage ──────────────────────────────────
  const [profileData, setProfileData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('equinox_profile');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      name: 'User',
      email: 'user@example.com',
      location: 'Your City',
      income: '100000',
      currency: '$',
      targetCities: 'Berlin, Tokyo, Singapore'
    };
  });

  // ── Settings persisted to localStorage ─────────────────────────────────
  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('equinox_settings');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      emailNotifications: true,
      pushNotifications: true,
      agentAlerts: true,
      zeroKnowledge: true,
      dataEncryption: true,
      anonymousAnalytics: true,
      darkMode: true,
      currencyFormat: true,
      dateFormat: true
    };
  });
  const [showHelpModal, setShowHelpModal] = useState<string | null>(null);

  // Persist profile changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('equinox_profile', JSON.stringify(profileData));
    }
  }, [profileData]);

  // Persist settings changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('equinox_settings', JSON.stringify(settings));
    }
  }, [settings]);

  // Track last known auto_resimulations count to avoid repeat toasts
  const lastResimCount = typeof window !== 'undefined'
    ? { current: parseInt(sessionStorage.getItem('eq_resim_count') ?? '0', 10) }
    : { current: 0 };

  // ── Drift report fetcher — called after simulation + on 30s poll ──────
  const fetchDriftReport = async (twinId: string) => {
    try {
      const res = await fetch(`${API_BASE}/twin/${twinId}/drift-report`);
      if (!res.ok) return;
      const driftData = await res.json();
      if (driftData && driftData.auto_resimulations >= 0) {
        // Toast if there are NEW autonomous re-simulations since last check
        const newCount = driftData.auto_resimulations ?? 0;
        const prevCount = lastResimCount.current;
        if (newCount > prevCount && prevCount >= 0) {
          const city = driftData.latest_drift_explanation?.city ?? 'your twin';
          toast.success(
            `Twin auto-updated: ${city} re-simulated autonomously. Open XAI to see what changed.`,
            { duration: 6000, icon: '🔄' }
          );
          lastResimCount.current = newCount;
          if (typeof window !== 'undefined') sessionStorage.setItem('eq_resim_count', String(newCount));
        }
        setSimulationData((prev: any) => prev ? { ...prev, drift_report: driftData } : prev);
      }
    } catch {
      // Drift report is non-critical — fail silently
    }
  };

  // ── 30s poll: keeps drift_report fresh so autonomous re-sims show up ──
  useEffect(() => {
    if (!activeTwinId) return;
    // Initial fetch after a short delay (let server persist the twin first)
    const initial = setTimeout(() => fetchDriftReport(activeTwinId), 3000);
    // Then poll every 30s
    const interval = setInterval(() => fetchDriftReport(activeTwinId), 30000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [activeTwinId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load twins when navigating to saved/history views
  const loadTwins = async () => {
    setTwinsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/twins`);
      if (res.ok) {
        const data = await res.json();
        setSavedTwins(Array.isArray(data) ? data : []);
      }
    } catch {
      setSavedTwins([]);
    } finally {
      setTwinsLoading(false);
    }
  };


  const handleSimulation = async (formData: any) => {
    setIsLoading(true);
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setCurrentStep(0);
    setCompletedSteps([]);
    setStatusMessage("Establishing connection to Agent Swarm...");
    setStepSubtexts([
      "160+ currencies tracked",
      "Health & safety risk scanner",
      "Projected monthly burn rate",
      "Visa & tax treaty compliance",
      "Monte Carlo asset projections",
      "Llama-3 decision intelligence synthesis"
    ]);

    try {
      const targetCities: string[] = formData.target_locations.filter((l: string) => l.trim() !== '');
      const salary: number = parseFloat(formData.current_salary) || 120000;
      const primaryTargetCity = targetCities[0] || 'Singapore';

      // Connect to SSE stream using env-configured API base
      const response = await fetch(`${API_BASE}/simulate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_city: formData.current_location || 'Unknown',
          target_city: primaryTargetCity,
          annual_income: salary,
          currency: formData.currency || 'USD',
          current_wealth: 0,
          lifestyle_preferences: formData.lifestyle_preferences || {}
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      if (reader) {
        let streamSucceeded = false;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = JSON.parse(line.slice(6));
              
              if (payload.type === "pipeline_start") {
                setStatusMessage(payload.message);
                setCurrentStep(0);
              } else if (payload.type === "agent_start") {
                setStatusMessage(payload.message);
                if (payload.agent === "actuary") setCurrentStep(1);
                else if (payload.agent === "fiscal_ghost") setCurrentStep(2);
                else if (payload.agent === "nexus_rag") setCurrentStep(3);
                else if (payload.agent === "chronos") setCurrentStep(4);
                else if (payload.agent === "decision_intelligence") setCurrentStep(5);
              } else if (payload.type === "agent_done") {
                setStatusMessage(payload.message);
                if (payload.agent === "actuary") {
                  setCompletedSteps(prev => [...prev, 1]);
                  setStepSubtexts(prev => { const next = [...prev]; next[1] = `Composite QoL: ${payload.data?.composite_score ?? 83}`; return next; });
                } else if (payload.agent === "fiscal_ghost") {
                  setCompletedSteps(prev => [...prev, 2]);
                  setStepSubtexts(prev => { const next = [...prev]; next[2] = `Burn: $${Math.round(payload.data?.projected_expenses ?? 2700)}`; return next; });
                } else if (payload.agent === "nexus_rag") {
                  setCompletedSteps(prev => [...prev, 3]);
                  setStepSubtexts(prev => { const next = [...prev]; next[3] = `${payload.data?.tax_regime ?? 'SRS Eligible (SG)'} applied`; return next; });
                } else if (payload.agent === "chronos") {
                  setCompletedSteps(prev => [...prev, 4]);
                  setStepSubtexts(prev => { const next = [...prev]; next[4] = `Base 5yr: $${Math.round(payload.data?.base_year5 ?? 24000).toLocaleString()}`; return next; });
                } else if (payload.agent === "decision_intelligence") {
                  setCompletedSteps(prev => [...prev, 5]);
                  setStepSubtexts(prev => { const next = [...prev]; next[5] = `Viability: ${payload.data?.viability_score ?? 81}/100`; return next; });
                }
              } else if (payload.type === "simulation_complete") {
                setStatusMessage(payload.message);

                const resData = payload.data;
                const report = resData.final_report || {};
                const proj = resData.wealth_projection || [];
                const mcResult = resData.monte_carlo_result || {};
                const scenarios = mcResult.scenarios ?? [];
                const xai = resData.xai_explanation || {};
                const actData = resData.risk_analysis || {};
                const fiscData = resData.expense_analysis || {};
                const nexData = resData.compliance_analysis || {};
                const di = resData.decision_intelligence || {};

                // ── Build scenario list from MC simulation paths ──────────────
                const mcPaths = mcResult.simulation_paths || {};
                const p50 = mcPaths.p50 || [];
                const mappedScenarios = scenarios.length > 0
                  ? scenarios.map((s: any) => ({
                      location: primaryTargetCity,
                      year_1_wealth: p50[0] ?? proj[0]?.wealth ?? salary * 0.8,
                      year_5_wealth: s.year_5_wealth ?? p50[4] ?? salary * 1.5,
                      risk_score: actData.overall_risk_rating === 'Low' ? 0.12 : actData.overall_risk_rating === 'High' ? 0.40 : 0.25,
                      quality_score: (actData.composite_score ?? 70) / 100,
                      cost_increase: ((fiscData.col_multiplier ?? 1) - 1) * 100,
                      tax_burden: (nexData.effective_rate ?? 0.30) * 100,
                      hidden_costs: Math.round((fiscData.projected_expenses ?? (salary / 12 * 0.6)) * 12 * 0.08),
                      risk_level: actData.overall_risk_rating ?? 'Medium',
                      viability_score: report.relocation_viability_score ?? di.decision_viability_score ?? 70,
                      tax_regime: nexData.tax_regime ?? report.tax_regime ?? 'Standard',
                      dta_relief: nexData.dta_relief_applied ?? 0,
                      net_savings: report.net_annual_savings ?? 0,
                    }))
                  : [{
                      location: primaryTargetCity,
                      year_1_wealth: p50[0] ?? proj[0]?.wealth ?? salary * 0.8,
                      year_5_wealth: p50[4] ?? proj[4]?.wealth ?? salary * 1.5,
                      risk_score: actData.overall_risk_rating === 'Low' ? 0.12 : actData.overall_risk_rating === 'High' ? 0.40 : 0.25,
                      quality_score: (actData.composite_score ?? 70) / 100,
                      cost_increase: ((fiscData.col_multiplier ?? 1) - 1) * 100,
                      tax_burden: (nexData.effective_rate ?? 0.30) * 100,
                      hidden_costs: Math.round((fiscData.projected_expenses ?? (salary / 12 * 0.6)) * 12 * 0.08),
                      risk_level: actData.overall_risk_rating ?? 'Medium',
                      viability_score: report.relocation_viability_score ?? di.decision_viability_score ?? 70,
                      tax_regime: nexData.tax_regime ?? report.tax_regime ?? 'Standard',
                      dta_relief: nexData.dta_relief_applied ?? 0,
                      net_savings: report.net_annual_savings ?? 0,
                    }];

                // ── Build recommendations from real LLM reasoning ─────────────
                const recommendations: string[] = [];
                if (di.dynamic_reasoning) recommendations.push(di.dynamic_reasoning);
                if (report.key_advantages) report.key_advantages.forEach((a: string) => recommendations.push(`✅ ${a}`));
                if (report.key_risks) report.key_risks.forEach((r: string) => recommendations.push(`⚠️ ${r}`));
                if (recommendations.length === 0) {
                  recommendations.push(`Viability score: ${report.relocation_viability_score ?? 70}/100 for ${primaryTargetCity}`);
                  recommendations.push(`Effective tax rate: ${((nexData.effective_rate ?? 0.30) * 100).toFixed(1)}% (${nexData.tax_regime ?? 'Standard'})`);
                  if (actData.composite_score) recommendations.push(`Quality of Life composite score: ${actData.composite_score}/100 (AQI: ${actData.air_quality_index})`);
                }

                const backendResult = {
                  // ── Dashboard data ──────────────────────────────────────────
                  scenarios: mappedScenarios,
                  compliance_summary: {
                    ...nexData,
                    total_compliance_cost: nexData.total_compliance_cost ?? Math.round((fiscData.projected_expenses ?? (salary / 12 * 0.6)) * 12 * 0.10),
                    visa_complexity: nexData.visa_requirements ?? nexData.visa_complexity ?? 'Skilled Worker',
                    tax_treaty_benefits: nexData.treaty_label ?? nexData.tax_treaty_benefits ?? 'DTA applied',
                    regulatory_timeline: nexData.regulatory_timeline ?? '45-60 days',
                  },
                  recommendations,
                  trust_score: {
                    score: report.relocation_viability_score ?? di.decision_viability_score ?? 80,
                    components: {
                      payment_reliability: Math.min(100, Math.round((nexData.effective_rate ? (1 - nexData.effective_rate) * 100 : 70))),
                      financial_stability: Math.min(100, Math.round((actData.composite_score ?? 75))),
                      income_verification: Math.min(100, Math.round(((fiscData.col_multiplier ? 2 - fiscData.col_multiplier : 1) * 80))),
                      debt_management: Math.min(100, Math.round((report.relocation_viability_score ?? 75))),
                    }
                  },
                  // ── Agent deep-dive data ────────────────────────────────────
                  actuary: {
                    ...actData,
                    city: primaryTargetCity,
                    monthly_expenses: fiscData.projected_expenses,
                    annual_expenses: (fiscData.projected_expenses ?? 0) * 12,
                    net_annual_savings: report.net_annual_savings ?? 0,
                  },
                  fiscal: {
                    ...fiscData,
                    city: primaryTargetCity,
                    monthly_expenses: fiscData.projected_expenses ?? 0,
                    annual_expenses: (fiscData.projected_expenses ?? 0) * 12,
                    effective_tax_rate: nexData.effective_rate ?? 0.30,
                    tax_regime: nexData.tax_regime ?? 'Standard',
                    net_annual_savings: report.net_annual_savings ?? 0,
                    lifestyle_key: fiscData.lifestyle_key ?? 'standard',
                  },
                  nexus: {
                    ...nexData,
                    city: primaryTargetCity,
                    // dta_relief_applied is the actual key returned by NexusAgent
                    treaty_savings: Math.round((nexData.dta_relief_applied ?? 0) * salary),
                    effective_tax_rate_pct: ((nexData.effective_rate ?? 0.30) * 100).toFixed(1),
                    dta_pct: Math.round((nexData.dta_relief_applied ?? 0) * 100),
                    compliance_score: nexData.compliance_score ?? 100,
                    // compliance_notes is a string[] from NexusAgent — join to display
                    raw_strategy: Array.isArray(nexData.compliance_notes)
                      ? nexData.compliance_notes.join(' ')
                      : (nexData.compliance_notes ?? nexData.compliance_brief_excerpt ?? di.dynamic_reasoning ?? ''),
                  },
                  // ── XAI factor decomposition ────────────────────────────────
                  xai: {
                    ...xai,
                    // factor_contributions items use 'factor' key (not 'name') from explainer.py
                    factors: xai.factor_contributions
                      ? xai.factor_contributions.map((f: any) => ({ ...f, name: f.factor ?? f.name }))
                      : [
                          { name: 'Tax Efficiency', contribution: Math.round((1 - (nexData.effective_rate ?? 0.30)) * 30), weight: 0.30 },
                          { name: 'Cost of Living', contribution: Math.round((1 - Math.min(1, fiscData.col_multiplier ?? 1)) * 20 + 10), weight: 0.20 },
                          { name: 'Quality of Life', contribution: Math.round((actData.composite_score ?? 70) * 0.30), weight: 0.30 },
                          { name: 'FX Risk', contribution: Math.round((1 - (mcResult.risk_metrics?.fx_volatility_used ?? 0.08) * 5) * 10), weight: 0.10 },
                          { name: 'Savings Potential', contribution: Math.round(Math.max(0, (report.net_annual_savings ?? 0) / salary * 100) * 0.10), weight: 0.10 },
                        ],
                    // xai.viability_score is the correct key (not final_score)
                    final_score: xai.viability_score ?? xai.final_score ?? report.relocation_viability_score ?? 70,
                    // xai.executive_summary is the text field (not narrative)
                    narrative: xai.executive_summary ?? xai.narrative ?? di.dynamic_reasoning ?? '',
                    // confidence_interval is [lower, upper] array from explainer.py
                    confidence: Array.isArray(xai.confidence_interval)
                      ? { lower: xai.confidence_interval[0], upper: xai.confidence_interval[1] }
                      : (xai.confidence_interval ?? { lower: 62, upper: 88 }),
                  },
                  // ── Chronos Monte Carlo ─────────────────────────────────────
                  chronos: {
                    ...mcResult,
                    city: primaryTargetCity,
                    simulation_paths: mcPaths,
                    final_year_stats: mcResult.final_year_stats ?? {},
                    risk_metrics: mcResult.risk_metrics ?? {},
                    scenarios: mcResult.scenarios ?? [],
                  },
                  // ── Decision Intelligence ───────────────────────────────────
                  decision_intelligence: di,
                  // ── Raw full state ──────────────────────────────────────────
                  rawResults: resData,
                };

                // Persist twin_id + activate drift poll
                if (resData.twin_id) {
                  localStorage.setItem('equinox_twin_id', resData.twin_id);
                  setActiveTwinId(resData.twin_id);
                }

                setSimulationData(backendResult);
                setShowResults(true);
                setActiveView('results');
                streamSucceeded = true;
              } else if (payload.type === "error") {
                throw new Error(payload.message);
              }
            }
          }
        }
        if (streamSucceeded) {
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend streaming failed or was interrupted, falling back to local mocks:", err);
    }

    // ── Fallback: try the REST /simulate endpoint for multi-city ──────────
    try {
      const targetCities: string[] = formData.target_locations.filter((l: string) => l.trim() !== '');
      const salary: number = parseFloat(formData.current_salary);
      let backendScenarios: any[] | null = null;
      let backendCompliance: any = {};

      try {
        const results = await Promise.all(
          targetCities.map((city: string) =>
            fetch(`${API_BASE}/simulate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                current_city: formData.current_location || 'Unknown',
                target_city: city,
                annual_income: salary,
                currency: formData.currency || 'USD',
                current_wealth: 0,
                lifestyle_preferences: formData.lifestyle_preferences || {}
              })
            }).then(r => r.json())
          )
        );
        backendScenarios = results.map((res: any) => {
          const report = res.data?.final_report || {};
          const proj = res.data?.wealth_projection || [];
          const riskData = res.data?.risk_analysis || {};
          const expData = res.data?.expense_analysis || {};
          const nexData = res.data?.compliance_analysis || {};
          return {
            location: res.city,
            year_1_wealth: proj[0]?.wealth ?? salary * 0.8,
            year_5_wealth: proj[4]?.wealth ?? salary * 1.5,
            risk_score: riskData.overall_risk_rating === 'Low' ? 0.12 : riskData.overall_risk_rating === 'High' ? 0.40 : 0.25,
            quality_score: (riskData.composite_score ?? 70) / 100,
            cost_increase: ((expData.col_multiplier ?? 1) - 1) * 100,
            tax_burden: (nexData.effective_rate ?? report.effective_tax_rate ?? 0.30) * 100,
            hidden_costs: Math.round((expData.projected_expenses ?? salary / 12 * 0.6) * 12 * 0.08),
            risk_level: riskData.overall_risk_rating ?? 'Medium',
            viability_score: report.relocation_viability_score ?? 70,
            tax_regime: nexData.tax_regime ?? report.tax_regime ?? 'Standard',
            dta_relief: nexData.dta_relief ?? 0,
            net_savings: report.net_annual_savings ?? 0,
          };
        });
        backendCompliance = results[0]?.data?.compliance_analysis ?? {};
      } catch (_) {
        await new Promise(r => setTimeout(r, 800));
      }

      // ── Backend offline: show error rather than fake data ───────────────
      if (!backendScenarios) {
        setSimulationData({
          _backendOffline: true,
          message: 'Could not connect to the Equinox Nexus backend. Start the backend server with: cd core && uvicorn main:app --reload'
        });
        setShowResults(true);
        setActiveView('results');
        setIsLoading(false);
        toast.error('Backend offline — start the Python server to run real AI simulations', { duration: 5000 });
        return;
      }

      // Placeholder for legacy city lookup — unused when backend is online
      const cityData: Record<string, any> = {
        'Singapore': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.58, riskScore: 0.12, qualityScore: 0.95, costIncrease: 22.1, taxBurden: 18.5, hiddenCosts: 15200, riskLevel: 'Low' },
        'Berlin, Germany': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.62, riskScore: 0.18, qualityScore: 0.91, costIncrease: 8.7, taxBurden: 38.2, hiddenCosts: 9600, riskLevel: 'Low' },
        'Tokyo, Japan': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.48, riskScore: 0.15, qualityScore: 0.93, costIncrease: 18.5, taxBurden: 28.5, hiddenCosts: 14200, riskLevel: 'Low' },
        'Tokyo': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.48, riskScore: 0.15, qualityScore: 0.93, costIncrease: 18.5, taxBurden: 28.5, hiddenCosts: 14200, riskLevel: 'Low' },
        'London, UK': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.52, riskScore: 0.22, qualityScore: 0.88, costIncrease: 15.2, taxBurden: 32.5, hiddenCosts: 12800, riskLevel: 'Medium' },
        'London': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.52, riskScore: 0.22, qualityScore: 0.88, costIncrease: 15.2, taxBurden: 32.5, hiddenCosts: 12800, riskLevel: 'Medium' },
        'New York, USA': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.55, riskScore: 0.22, qualityScore: 0.86, costIncrease: 25.8, taxBurden: 35.2, hiddenCosts: 18500, riskLevel: 'Medium' },
        'New York': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.55, riskScore: 0.22, qualityScore: 0.86, costIncrease: 25.8, taxBurden: 35.2, hiddenCosts: 18500, riskLevel: 'Medium' },
        'Dubai, UAE': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.72, riskScore: 0.20, qualityScore: 0.84, costIncrease: 12.5, taxBurden: 5.0, hiddenCosts: 11000, riskLevel: 'Medium' },
        'Amsterdam, Netherlands': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.58, riskScore: 0.16, qualityScore: 0.92, costIncrease: 10.2, taxBurden: 42.5, hiddenCosts: 8800, riskLevel: 'Low' },
        'Sydney, Australia': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.52, riskScore: 0.14, qualityScore: 0.94, costIncrease: 19.8, taxBurden: 32.0, hiddenCosts: 13500, riskLevel: 'Low' },
        'Toronto, Canada': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.55, riskScore: 0.17, qualityScore: 0.90, costIncrease: 14.5, taxBurden: 33.8, hiddenCosts: 10200, riskLevel: 'Low' },
        'Lisbon, Portugal': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.68, riskScore: 0.19, qualityScore: 0.87, costIncrease: 5.2, taxBurden: 28.0, hiddenCosts: 7500, riskLevel: 'Low' },
        'Paris, France': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.32, riskScore: 0.26, qualityScore: 0.91, costIncrease: 24.5, taxBurden: 48.0, hiddenCosts: 16800, riskLevel: 'Medium' },
        'Paris': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.32, riskScore: 0.26, qualityScore: 0.91, costIncrease: 24.5, taxBurden: 48.0, hiddenCosts: 16800, riskLevel: 'Medium' },
        'Zurich, Switzerland': { wealthMultiplier1: 0.75, wealthMultiplier5: 1.65, riskScore: 0.10, qualityScore: 0.97, costIncrease: 35.2, taxBurden: 22.0, hiddenCosts: 16500, riskLevel: 'Low' },
        'Hong Kong': { wealthMultiplier1: 0.79, wealthMultiplier5: 1.52, riskScore: 0.23, qualityScore: 0.85, costIncrease: 28.5, taxBurden: 15.0, hiddenCosts: 17200, riskLevel: 'Medium' },
        'Seoul, South Korea': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.56, riskScore: 0.16, qualityScore: 0.91, costIncrease: 12.8, taxBurden: 26.5, hiddenCosts: 11800, riskLevel: 'Low' },
        'Barcelona, Spain': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.54, riskScore: 0.21, qualityScore: 0.88, costIncrease: 8.5, taxBurden: 36.0, hiddenCosts: 9200, riskLevel: 'Medium' },
        'Barcelona': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.54, riskScore: 0.21, qualityScore: 0.88, costIncrease: 8.5, taxBurden: 36.0, hiddenCosts: 9200, riskLevel: 'Medium' },
        // Eastern European - Low cost, high growth
        'Prague, Czech Republic': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.82, riskScore: 0.14, qualityScore: 0.89, costIncrease: 4.2, taxBurden: 23.0, hiddenCosts: 5200, riskLevel: 'Low' },
        'Prague': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.82, riskScore: 0.14, qualityScore: 0.89, costIncrease: 4.2, taxBurden: 23.0, hiddenCosts: 5200, riskLevel: 'Low' },
        'Krakow, Poland': { wealthMultiplier1: 0.98, wealthMultiplier5: 1.95, riskScore: 0.16, qualityScore: 0.86, costIncrease: 3.5, taxBurden: 19.0, hiddenCosts: 4100, riskLevel: 'Low' },
        'Krakow': { wealthMultiplier1: 0.98, wealthMultiplier5: 1.95, riskScore: 0.16, qualityScore: 0.86, costIncrease: 3.5, taxBurden: 19.0, hiddenCosts: 4100, riskLevel: 'Low' },
        'Warsaw, Poland': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.85, riskScore: 0.15, qualityScore: 0.87, costIncrease: 4.8, taxBurden: 19.0, hiddenCosts: 4800, riskLevel: 'Low' },
        'Warsaw': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.85, riskScore: 0.15, qualityScore: 0.87, costIncrease: 4.8, taxBurden: 19.0, hiddenCosts: 4800, riskLevel: 'Low' },
        'Budapest, Hungary': { wealthMultiplier1: 0.97, wealthMultiplier5: 1.88, riskScore: 0.18, qualityScore: 0.84, costIncrease: 3.8, taxBurden: 15.0, hiddenCosts: 3900, riskLevel: 'Low' },
        'Budapest': { wealthMultiplier1: 0.97, wealthMultiplier5: 1.88, riskScore: 0.18, qualityScore: 0.84, costIncrease: 3.8, taxBurden: 15.0, hiddenCosts: 3900, riskLevel: 'Low' },
        'Bucharest, Romania': { wealthMultiplier1: 0.99, wealthMultiplier5: 2.05, riskScore: 0.22, qualityScore: 0.78, costIncrease: 2.9, taxBurden: 10.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        'Bucharest': { wealthMultiplier1: 0.99, wealthMultiplier5: 2.05, riskScore: 0.22, qualityScore: 0.78, costIncrease: 2.9, taxBurden: 10.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        // Irish Cities
        'Dublin, Ireland': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.58, riskScore: 0.15, qualityScore: 0.91, costIncrease: 12.5, taxBurden: 40.0, hiddenCosts: 11500, riskLevel: 'Low' },
        'Dublin': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.58, riskScore: 0.15, qualityScore: 0.91, costIncrease: 12.5, taxBurden: 40.0, hiddenCosts: 11500, riskLevel: 'Low' },
        'Cork, Ireland': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.72, riskScore: 0.13, qualityScore: 0.90, costIncrease: 8.2, taxBurden: 40.0, hiddenCosts: 8200, riskLevel: 'Low' },
        'Cork': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.72, riskScore: 0.13, qualityScore: 0.90, costIncrease: 8.2, taxBurden: 40.0, hiddenCosts: 8200, riskLevel: 'Low' },
        'Galway, Ireland': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.78, riskScore: 0.12, qualityScore: 0.89, costIncrease: 6.5, taxBurden: 40.0, hiddenCosts: 7500, riskLevel: 'Low' },
        'Galway': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.78, riskScore: 0.12, qualityScore: 0.89, costIncrease: 6.5, taxBurden: 40.0, hiddenCosts: 7500, riskLevel: 'Low' },
        // Nordic Cities
        'Stockholm, Sweden': { wealthMultiplier1: 0.83, wealthMultiplier5: 1.52, riskScore: 0.11, qualityScore: 0.96, costIncrease: 15.8, taxBurden: 52.0, hiddenCosts: 12200, riskLevel: 'Low' },
        'Stockholm': { wealthMultiplier1: 0.83, wealthMultiplier5: 1.52, riskScore: 0.11, qualityScore: 0.96, costIncrease: 15.8, taxBurden: 52.0, hiddenCosts: 12200, riskLevel: 'Low' },
        'Copenhagen, Denmark': { wealthMultiplier1: 0.81, wealthMultiplier5: 1.48, riskScore: 0.10, qualityScore: 0.97, costIncrease: 18.2, taxBurden: 55.0, hiddenCosts: 13800, riskLevel: 'Low' },
        'Copenhagen': { wealthMultiplier1: 0.81, wealthMultiplier5: 1.48, riskScore: 0.10, qualityScore: 0.97, costIncrease: 18.2, taxBurden: 55.0, hiddenCosts: 13800, riskLevel: 'Low' },
        'Oslo, Norway': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.45, riskScore: 0.09, qualityScore: 0.98, costIncrease: 22.5, taxBurden: 46.0, hiddenCosts: 15500, riskLevel: 'Low' },
        'Oslo': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.45, riskScore: 0.09, qualityScore: 0.98, costIncrease: 22.5, taxBurden: 46.0, hiddenCosts: 15500, riskLevel: 'Low' },
        'Helsinki, Finland': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.55, riskScore: 0.10, qualityScore: 0.95, costIncrease: 14.2, taxBurden: 51.0, hiddenCosts: 11800, riskLevel: 'Low' },
        'Helsinki': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.55, riskScore: 0.10, qualityScore: 0.95, costIncrease: 14.2, taxBurden: 51.0, hiddenCosts: 11800, riskLevel: 'Low' },
        // Southern European
        'Madrid, Spain': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.58, riskScore: 0.19, qualityScore: 0.88, costIncrease: 7.8, taxBurden: 37.0, hiddenCosts: 8500, riskLevel: 'Low' },
        'Madrid': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.58, riskScore: 0.19, qualityScore: 0.88, costIncrease: 7.8, taxBurden: 37.0, hiddenCosts: 8500, riskLevel: 'Low' },
        'Milan, Italy': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.48, riskScore: 0.22, qualityScore: 0.87, costIncrease: 11.5, taxBurden: 43.0, hiddenCosts: 10200, riskLevel: 'Medium' },
        'Milan': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.48, riskScore: 0.22, qualityScore: 0.87, costIncrease: 11.5, taxBurden: 43.0, hiddenCosts: 10200, riskLevel: 'Medium' },
        'Rome, Italy': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.52, riskScore: 0.24, qualityScore: 0.85, costIncrease: 9.2, taxBurden: 43.0, hiddenCosts: 9800, riskLevel: 'Medium' },
        'Rome': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.52, riskScore: 0.24, qualityScore: 0.85, costIncrease: 9.2, taxBurden: 43.0, hiddenCosts: 9800, riskLevel: 'Medium' },
        'Athens, Greece': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.65, riskScore: 0.26, qualityScore: 0.82, costIncrease: 5.5, taxBurden: 44.0, hiddenCosts: 6800, riskLevel: 'Medium' },
        'Athens': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.65, riskScore: 0.26, qualityScore: 0.82, costIncrease: 5.5, taxBurden: 44.0, hiddenCosts: 6800, riskLevel: 'Medium' },
        // German Cities
        'Munich, Germany': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.55, riskScore: 0.12, qualityScore: 0.94, costIncrease: 14.5, taxBurden: 42.0, hiddenCosts: 12500, riskLevel: 'Low' },
        'Munich': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.55, riskScore: 0.12, qualityScore: 0.94, costIncrease: 14.5, taxBurden: 42.0, hiddenCosts: 12500, riskLevel: 'Low' },
        'Frankfurt, Germany': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.58, riskScore: 0.14, qualityScore: 0.92, costIncrease: 12.8, taxBurden: 42.0, hiddenCosts: 11200, riskLevel: 'Low' },
        'Frankfurt': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.58, riskScore: 0.14, qualityScore: 0.92, costIncrease: 12.8, taxBurden: 42.0, hiddenCosts: 11200, riskLevel: 'Low' },
        // Other European
        'Vienna, Austria': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.62, riskScore: 0.11, qualityScore: 0.96, costIncrease: 9.8, taxBurden: 42.0, hiddenCosts: 9200, riskLevel: 'Low' },
        'Vienna': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.62, riskScore: 0.11, qualityScore: 0.96, costIncrease: 9.8, taxBurden: 42.0, hiddenCosts: 9200, riskLevel: 'Low' },
        'Brussels, Belgium': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.52, riskScore: 0.17, qualityScore: 0.90, costIncrease: 11.2, taxBurden: 50.0, hiddenCosts: 10800, riskLevel: 'Low' },
        'Brussels': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.52, riskScore: 0.17, qualityScore: 0.90, costIncrease: 11.2, taxBurden: 50.0, hiddenCosts: 10800, riskLevel: 'Low' },
        // Asian Cities
        'Bangkok, Thailand': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.92, riskScore: 0.24, qualityScore: 0.78, costIncrease: 3.2, taxBurden: 35.0, hiddenCosts: 4500, riskLevel: 'Medium' },
        'Bangkok': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.92, riskScore: 0.24, qualityScore: 0.78, costIncrease: 3.2, taxBurden: 35.0, hiddenCosts: 4500, riskLevel: 'Medium' },
        'Kuala Lumpur, Malaysia': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.85, riskScore: 0.20, qualityScore: 0.82, costIncrease: 4.5, taxBurden: 28.0, hiddenCosts: 5200, riskLevel: 'Low' },
        'Kuala Lumpur': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.85, riskScore: 0.20, qualityScore: 0.82, costIncrease: 4.5, taxBurden: 28.0, hiddenCosts: 5200, riskLevel: 'Low' },
        // Americas
        'Vancouver, Canada': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.52, riskScore: 0.14, qualityScore: 0.93, costIncrease: 16.5, taxBurden: 33.0, hiddenCosts: 12800, riskLevel: 'Low' },
        'Vancouver': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.52, riskScore: 0.14, qualityScore: 0.93, costIncrease: 16.5, taxBurden: 33.0, hiddenCosts: 12800, riskLevel: 'Low' },
        'Montreal, Canada': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.62, riskScore: 0.15, qualityScore: 0.91, costIncrease: 10.2, taxBurden: 37.0, hiddenCosts: 9500, riskLevel: 'Low' },
        'Montreal': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.62, riskScore: 0.15, qualityScore: 0.91, costIncrease: 10.2, taxBurden: 37.0, hiddenCosts: 9500, riskLevel: 'Low' },
        'Austin, USA': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.68, riskScore: 0.18, qualityScore: 0.88, costIncrease: 12.5, taxBurden: 25.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Austin': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.68, riskScore: 0.18, qualityScore: 0.88, costIncrease: 12.5, taxBurden: 25.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Miami, USA': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.22, qualityScore: 0.84, costIncrease: 15.8, taxBurden: 22.0, hiddenCosts: 11500, riskLevel: 'Medium' },
        'Miami': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.22, qualityScore: 0.84, costIncrease: 15.8, taxBurden: 22.0, hiddenCosts: 11500, riskLevel: 'Medium' },
        // Oceania
        'Melbourne, Australia': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.55, riskScore: 0.13, qualityScore: 0.95, costIncrease: 16.2, taxBurden: 32.0, hiddenCosts: 12200, riskLevel: 'Low' },
        'Melbourne': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.55, riskScore: 0.13, qualityScore: 0.95, costIncrease: 16.2, taxBurden: 32.0, hiddenCosts: 12200, riskLevel: 'Low' },
        'Auckland, New Zealand': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.58, riskScore: 0.12, qualityScore: 0.94, costIncrease: 14.5, taxBurden: 33.0, hiddenCosts: 11000, riskLevel: 'Low' },
        'Auckland': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.58, riskScore: 0.12, qualityScore: 0.94, costIncrease: 14.5, taxBurden: 33.0, hiddenCosts: 11000, riskLevel: 'Low' },
        // Indian Cities - Lower salaries but low cost, moderate growth
        'Pune, India': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.15, riskScore: 0.28, qualityScore: 0.72, costIncrease: 6.5, taxBurden: 30.0, hiddenCosts: 2800, riskLevel: 'Medium' },
        'Pune': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.15, riskScore: 0.28, qualityScore: 0.72, costIncrease: 6.5, taxBurden: 30.0, hiddenCosts: 2800, riskLevel: 'Medium' },
        'Mumbai, India': { wealthMultiplier1: 0.62, wealthMultiplier5: 1.18, riskScore: 0.30, qualityScore: 0.70, costIncrease: 8.5, taxBurden: 30.0, hiddenCosts: 4200, riskLevel: 'Medium' },
        'Mumbai': { wealthMultiplier1: 0.62, wealthMultiplier5: 1.18, riskScore: 0.30, qualityScore: 0.70, costIncrease: 8.5, taxBurden: 30.0, hiddenCosts: 4200, riskLevel: 'Medium' },
        'Bangalore, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.74, costIncrease: 7.2, taxBurden: 30.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Bangalore': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.74, costIncrease: 7.2, taxBurden: 30.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Bengaluru, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.74, costIncrease: 7.2, taxBurden: 30.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Bengaluru': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.74, costIncrease: 7.2, taxBurden: 30.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Delhi, India': { wealthMultiplier1: 0.60, wealthMultiplier5: 1.12, riskScore: 0.35, qualityScore: 0.65, costIncrease: 7.8, taxBurden: 30.0, hiddenCosts: 3800, riskLevel: 'High' },
        'Delhi': { wealthMultiplier1: 0.60, wealthMultiplier5: 1.12, riskScore: 0.35, qualityScore: 0.65, costIncrease: 7.8, taxBurden: 30.0, hiddenCosts: 3800, riskLevel: 'High' },
        'New Delhi, India': { wealthMultiplier1: 0.60, wealthMultiplier5: 1.12, riskScore: 0.35, qualityScore: 0.65, costIncrease: 7.8, taxBurden: 30.0, hiddenCosts: 3800, riskLevel: 'High' },
        'Hyderabad, India': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.73, costIncrease: 6.2, taxBurden: 30.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        'Hyderabad': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.73, costIncrease: 6.2, taxBurden: 30.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        'Chennai, India': { wealthMultiplier1: 0.64, wealthMultiplier5: 1.16, riskScore: 0.28, qualityScore: 0.71, costIncrease: 5.8, taxBurden: 30.0, hiddenCosts: 3000, riskLevel: 'Medium' },
        'Chennai': { wealthMultiplier1: 0.64, wealthMultiplier5: 1.16, riskScore: 0.28, qualityScore: 0.71, costIncrease: 5.8, taxBurden: 30.0, hiddenCosts: 3000, riskLevel: 'Medium' },
        'Ahmedabad, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.26, qualityScore: 0.72, costIncrease: 5.5, taxBurden: 30.0, hiddenCosts: 2600, riskLevel: 'Medium' },
        'Ahmedabad': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.26, qualityScore: 0.72, costIncrease: 5.5, taxBurden: 30.0, hiddenCosts: 2600, riskLevel: 'Medium' },
        'Kolkata, India': { wealthMultiplier1: 0.62, wealthMultiplier5: 1.12, riskScore: 0.30, qualityScore: 0.68, costIncrease: 4.8, taxBurden: 30.0, hiddenCosts: 2400, riskLevel: 'Medium' },
        'Kolkata': { wealthMultiplier1: 0.62, wealthMultiplier5: 1.12, riskScore: 0.30, qualityScore: 0.68, costIncrease: 4.8, taxBurden: 30.0, hiddenCosts: 2400, riskLevel: 'Medium' },
        'Jaipur, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.70, costIncrease: 4.5, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'Medium' },
        'Jaipur': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.70, costIncrease: 4.5, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'Medium' },
        'Surat, India': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.22, riskScore: 0.25, qualityScore: 0.71, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Surat': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.22, riskScore: 0.25, qualityScore: 0.71, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Gurgaon, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.24, riskScore: 0.26, qualityScore: 0.74, costIncrease: 7.5, taxBurden: 30.0, hiddenCosts: 3600, riskLevel: 'Medium' },
        'Gurgaon': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.24, riskScore: 0.26, qualityScore: 0.74, costIncrease: 7.5, taxBurden: 30.0, hiddenCosts: 3600, riskLevel: 'Medium' },
        'Gurugram, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.24, riskScore: 0.26, qualityScore: 0.74, costIncrease: 7.5, taxBurden: 30.0, hiddenCosts: 3600, riskLevel: 'Medium' },
        'Gurugram': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.24, riskScore: 0.26, qualityScore: 0.74, costIncrease: 7.5, taxBurden: 30.0, hiddenCosts: 3600, riskLevel: 'Medium' },
        'Noida, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.21, riskScore: 0.27, qualityScore: 0.72, costIncrease: 6.8, taxBurden: 30.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        'Noida': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.21, riskScore: 0.27, qualityScore: 0.72, costIncrease: 6.8, taxBurden: 30.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        // European cities - Belgium
        'Antwerp, Belgium': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.55, riskScore: 0.15, qualityScore: 0.91, costIncrease: 9.8, taxBurden: 50.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Antwerp': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.55, riskScore: 0.15, qualityScore: 0.91, costIncrease: 9.8, taxBurden: 50.0, hiddenCosts: 9800, riskLevel: 'Low' },
        // Spanish Cities
        'Bilbao, Spain': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.56, riskScore: 0.18, qualityScore: 0.89, costIncrease: 7.2, taxBurden: 36.0, hiddenCosts: 8200, riskLevel: 'Low' },
        'Bilbao': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.56, riskScore: 0.18, qualityScore: 0.89, costIncrease: 7.2, taxBurden: 36.0, hiddenCosts: 8200, riskLevel: 'Low' },
        'Valencia, Spain': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.58, riskScore: 0.19, qualityScore: 0.87, costIncrease: 6.5, taxBurden: 36.0, hiddenCosts: 7800, riskLevel: 'Low' },
        'Valencia': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.58, riskScore: 0.19, qualityScore: 0.87, costIncrease: 6.5, taxBurden: 36.0, hiddenCosts: 7800, riskLevel: 'Low' },
        'Seville, Spain': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.60, riskScore: 0.20, qualityScore: 0.86, costIncrease: 5.8, taxBurden: 36.0, hiddenCosts: 7200, riskLevel: 'Low' },
        'Seville': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.60, riskScore: 0.20, qualityScore: 0.86, costIncrease: 5.8, taxBurden: 36.0, hiddenCosts: 7200, riskLevel: 'Low' },
        // New Zealand
        'Wellington, New Zealand': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.60, riskScore: 0.11, qualityScore: 0.95, costIncrease: 12.5, taxBurden: 33.0, hiddenCosts: 10500, riskLevel: 'Low' },
        'Wellington': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.60, riskScore: 0.11, qualityScore: 0.95, costIncrease: 12.5, taxBurden: 33.0, hiddenCosts: 10500, riskLevel: 'Low' },
        'Christchurch, New Zealand': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.62, riskScore: 0.12, qualityScore: 0.93, costIncrease: 10.8, taxBurden: 33.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Christchurch': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.62, riskScore: 0.12, qualityScore: 0.93, costIncrease: 10.8, taxBurden: 33.0, hiddenCosts: 9800, riskLevel: 'Low' },
        // More Indian Tier-2 Cities
        'Hubli-Dharwad, India': { wealthMultiplier1: 0.72, wealthMultiplier5: 1.28, riskScore: 0.24, qualityScore: 0.68, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1800, riskLevel: 'Medium' },
        'Hubli-Dharwad': { wealthMultiplier1: 0.72, wealthMultiplier5: 1.28, riskScore: 0.24, qualityScore: 0.68, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1800, riskLevel: 'Medium' },
        'Hubli': { wealthMultiplier1: 0.72, wealthMultiplier5: 1.28, riskScore: 0.24, qualityScore: 0.68, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1800, riskLevel: 'Medium' },
        'Dharwad': { wealthMultiplier1: 0.72, wealthMultiplier5: 1.28, riskScore: 0.24, qualityScore: 0.68, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1800, riskLevel: 'Medium' },
        'Coimbatore, India': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.25, riskScore: 0.25, qualityScore: 0.70, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Coimbatore': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.25, riskScore: 0.25, qualityScore: 0.70, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Indore, India': { wealthMultiplier1: 0.71, wealthMultiplier5: 1.26, riskScore: 0.24, qualityScore: 0.71, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 1900, riskLevel: 'Medium' },
        'Indore': { wealthMultiplier1: 0.71, wealthMultiplier5: 1.26, riskScore: 0.24, qualityScore: 0.71, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 1900, riskLevel: 'Medium' },
        'Lucknow, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.69, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Lucknow': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.69, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Nagpur, India': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.24, riskScore: 0.25, qualityScore: 0.70, costIncrease: 3.6, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Nagpur': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.24, riskScore: 0.25, qualityScore: 0.70, costIncrease: 3.6, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Visakhapatnam, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.23, riskScore: 0.26, qualityScore: 0.69, costIncrease: 4.1, taxBurden: 30.0, hiddenCosts: 2050, riskLevel: 'Medium' },
        'Visakhapatnam': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.23, riskScore: 0.26, qualityScore: 0.69, costIncrease: 4.1, taxBurden: 30.0, hiddenCosts: 2050, riskLevel: 'Medium' },
        'Vizag': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.23, riskScore: 0.26, qualityScore: 0.69, costIncrease: 4.1, taxBurden: 30.0, hiddenCosts: 2050, riskLevel: 'Medium' },
        'Bhopal, India': { wealthMultiplier1: 0.71, wealthMultiplier5: 1.25, riskScore: 0.25, qualityScore: 0.70, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1800, riskLevel: 'Medium' },
        'Bhopal': { wealthMultiplier1: 0.71, wealthMultiplier5: 1.25, riskScore: 0.25, qualityScore: 0.70, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1800, riskLevel: 'Medium' },
        'Chandigarh, India': { wealthMultiplier1: 0.72, wealthMultiplier5: 1.28, riskScore: 0.22, qualityScore: 0.76, costIncrease: 5.2, taxBurden: 30.0, hiddenCosts: 2400, riskLevel: 'Low' },
        'Chandigarh': { wealthMultiplier1: 0.72, wealthMultiplier5: 1.28, riskScore: 0.22, qualityScore: 0.76, costIncrease: 5.2, taxBurden: 30.0, hiddenCosts: 2400, riskLevel: 'Low' },
        'Kochi, India': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.24, riskScore: 0.24, qualityScore: 0.72, costIncrease: 4.5, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'Medium' },
        'Kochi': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.24, riskScore: 0.24, qualityScore: 0.72, costIncrease: 4.5, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'Medium' },
        'Thiruvananthapuram, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.25, qualityScore: 0.71, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Thiruvananthapuram': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.25, qualityScore: 0.71, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        // More US Cities
        'Los Angeles, USA': { wealthMultiplier1: 0.76, wealthMultiplier5: 1.48, riskScore: 0.22, qualityScore: 0.85, costIncrease: 24.5, taxBurden: 33.0, hiddenCosts: 19500, riskLevel: 'Medium' },
        'Los Angeles': { wealthMultiplier1: 0.76, wealthMultiplier5: 1.48, riskScore: 0.22, qualityScore: 0.85, costIncrease: 24.5, taxBurden: 33.0, hiddenCosts: 19500, riskLevel: 'Medium' },
        'Chicago, USA': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.58, riskScore: 0.20, qualityScore: 0.86, costIncrease: 14.2, taxBurden: 32.0, hiddenCosts: 13500, riskLevel: 'Medium' },
        'Chicago': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.58, riskScore: 0.20, qualityScore: 0.86, costIncrease: 14.2, taxBurden: 32.0, hiddenCosts: 13500, riskLevel: 'Medium' },
        'Seattle, USA': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.55, riskScore: 0.18, qualityScore: 0.89, costIncrease: 18.5, taxBurden: 28.0, hiddenCosts: 15200, riskLevel: 'Low' },
        'Seattle': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.55, riskScore: 0.18, qualityScore: 0.89, costIncrease: 18.5, taxBurden: 28.0, hiddenCosts: 15200, riskLevel: 'Low' },
        'Boston, USA': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.52, riskScore: 0.19, qualityScore: 0.90, costIncrease: 20.2, taxBurden: 32.0, hiddenCosts: 16800, riskLevel: 'Low' },
        'Boston': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.52, riskScore: 0.19, qualityScore: 0.90, costIncrease: 20.2, taxBurden: 32.0, hiddenCosts: 16800, riskLevel: 'Low' },
        'Denver, USA': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.17, qualityScore: 0.88, costIncrease: 12.8, taxBurden: 28.0, hiddenCosts: 11200, riskLevel: 'Low' },
        'Denver': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.17, qualityScore: 0.88, costIncrease: 12.8, taxBurden: 28.0, hiddenCosts: 11200, riskLevel: 'Low' },
        // UK Cities
        'Manchester, UK': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.55, riskScore: 0.18, qualityScore: 0.87, costIncrease: 10.5, taxBurden: 32.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Manchester': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.55, riskScore: 0.18, qualityScore: 0.87, costIncrease: 10.5, taxBurden: 32.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Edinburgh, UK': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.54, riskScore: 0.16, qualityScore: 0.90, costIncrease: 11.2, taxBurden: 32.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Edinburgh': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.54, riskScore: 0.16, qualityScore: 0.90, costIncrease: 11.2, taxBurden: 32.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Birmingham, UK': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.58, riskScore: 0.19, qualityScore: 0.86, costIncrease: 9.2, taxBurden: 32.0, hiddenCosts: 9200, riskLevel: 'Low' },
        'Birmingham': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.58, riskScore: 0.19, qualityScore: 0.86, costIncrease: 9.2, taxBurden: 32.0, hiddenCosts: 9200, riskLevel: 'Low' },
        'Glasgow, UK': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.60, riskScore: 0.18, qualityScore: 0.85, costIncrease: 8.5, taxBurden: 32.0, hiddenCosts: 8800, riskLevel: 'Low' },
        'Glasgow': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.60, riskScore: 0.18, qualityScore: 0.85, costIncrease: 8.5, taxBurden: 32.0, hiddenCosts: 8800, riskLevel: 'Low' },
        // More Asian Cities
        'Shanghai, China': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.55, riskScore: 0.25, qualityScore: 0.82, costIncrease: 15.5, taxBurden: 45.0, hiddenCosts: 12500, riskLevel: 'Medium' },
        'Shanghai': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.55, riskScore: 0.25, qualityScore: 0.82, costIncrease: 15.5, taxBurden: 45.0, hiddenCosts: 12500, riskLevel: 'Medium' },
        'Beijing, China': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.50, riskScore: 0.28, qualityScore: 0.80, costIncrease: 14.8, taxBurden: 45.0, hiddenCosts: 13200, riskLevel: 'Medium' },
        'Beijing': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.50, riskScore: 0.28, qualityScore: 0.80, costIncrease: 14.8, taxBurden: 45.0, hiddenCosts: 13200, riskLevel: 'Medium' },
        'Shenzhen, China': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.58, riskScore: 0.24, qualityScore: 0.83, costIncrease: 16.2, taxBurden: 45.0, hiddenCosts: 11800, riskLevel: 'Medium' },
        'Shenzhen': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.58, riskScore: 0.24, qualityScore: 0.83, costIncrease: 16.2, taxBurden: 45.0, hiddenCosts: 11800, riskLevel: 'Medium' },
        'Ho Chi Minh City, Vietnam': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.85, riskScore: 0.26, qualityScore: 0.75, costIncrease: 4.5, taxBurden: 35.0, hiddenCosts: 4200, riskLevel: 'Medium' },
        'Ho Chi Minh City': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.85, riskScore: 0.26, qualityScore: 0.75, costIncrease: 4.5, taxBurden: 35.0, hiddenCosts: 4200, riskLevel: 'Medium' },
        'Hanoi, Vietnam': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.82, riskScore: 0.27, qualityScore: 0.74, costIncrease: 4.2, taxBurden: 35.0, hiddenCosts: 3800, riskLevel: 'Medium' },
        'Hanoi': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.82, riskScore: 0.27, qualityScore: 0.74, costIncrease: 4.2, taxBurden: 35.0, hiddenCosts: 3800, riskLevel: 'Medium' },
        'Jakarta, Indonesia': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.78, riskScore: 0.30, qualityScore: 0.72, costIncrease: 5.2, taxBurden: 30.0, hiddenCosts: 4800, riskLevel: 'Medium' },
        'Jakarta': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.78, riskScore: 0.30, qualityScore: 0.72, costIncrease: 5.2, taxBurden: 30.0, hiddenCosts: 4800, riskLevel: 'Medium' },
        'Manila, Philippines': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.72, riskScore: 0.32, qualityScore: 0.70, costIncrease: 4.8, taxBurden: 32.0, hiddenCosts: 4500, riskLevel: 'Medium' },
        'Manila': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.72, riskScore: 0.32, qualityScore: 0.70, costIncrease: 4.8, taxBurden: 32.0, hiddenCosts: 4500, riskLevel: 'Medium' },
        // Taiwan
        'Taipei, Taiwan': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.62, riskScore: 0.14, qualityScore: 0.91, costIncrease: 10.5, taxBurden: 20.0, hiddenCosts: 8500, riskLevel: 'Low' },
        'Taipei': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.62, riskScore: 0.14, qualityScore: 0.91, costIncrease: 10.5, taxBurden: 20.0, hiddenCosts: 8500, riskLevel: 'Low' },
        'Kaohsiung, Taiwan': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.72, riskScore: 0.13, qualityScore: 0.89, costIncrease: 7.2, taxBurden: 20.0, hiddenCosts: 6500, riskLevel: 'Low' },
        'Kaohsiung': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.72, riskScore: 0.13, qualityScore: 0.89, costIncrease: 7.2, taxBurden: 20.0, hiddenCosts: 6500, riskLevel: 'Low' },
        'Taichung, Taiwan': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.75, riskScore: 0.12, qualityScore: 0.90, costIncrease: 6.5, taxBurden: 20.0, hiddenCosts: 6000, riskLevel: 'Low' },
        'Taichung': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.75, riskScore: 0.12, qualityScore: 0.90, costIncrease: 6.5, taxBurden: 20.0, hiddenCosts: 6000, riskLevel: 'Low' },
        // More Southeast Asian
        'Cebu, Philippines': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.82, riskScore: 0.30, qualityScore: 0.72, costIncrease: 3.8, taxBurden: 32.0, hiddenCosts: 3800, riskLevel: 'Medium' },
        'Cebu': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.82, riskScore: 0.30, qualityScore: 0.72, costIncrease: 3.8, taxBurden: 32.0, hiddenCosts: 3800, riskLevel: 'Medium' },
        'Bali, Indonesia': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.88, riskScore: 0.28, qualityScore: 0.76, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Bali': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.88, riskScore: 0.28, qualityScore: 0.76, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Phuket, Thailand': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.85, riskScore: 0.26, qualityScore: 0.78, costIncrease: 4.0, taxBurden: 35.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'Phuket': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.85, riskScore: 0.26, qualityScore: 0.78, costIncrease: 4.0, taxBurden: 35.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'Chiang Mai, Thailand': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.95, riskScore: 0.22, qualityScore: 0.80, costIncrease: 2.5, taxBurden: 35.0, hiddenCosts: 3200, riskLevel: 'Low' },
        'Chiang Mai': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.95, riskScore: 0.22, qualityScore: 0.80, costIncrease: 2.5, taxBurden: 35.0, hiddenCosts: 3200, riskLevel: 'Low' },
        'Penang, Malaysia': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.88, riskScore: 0.18, qualityScore: 0.84, costIncrease: 3.8, taxBurden: 28.0, hiddenCosts: 4200, riskLevel: 'Low' },
        'Penang': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.88, riskScore: 0.18, qualityScore: 0.84, costIncrease: 3.8, taxBurden: 28.0, hiddenCosts: 4200, riskLevel: 'Low' },
        // Middle East
        'Abu Dhabi, UAE': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.75, riskScore: 0.18, qualityScore: 0.86, costIncrease: 10.5, taxBurden: 0.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Abu Dhabi': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.75, riskScore: 0.18, qualityScore: 0.86, costIncrease: 10.5, taxBurden: 0.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Doha, Qatar': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.70, riskScore: 0.20, qualityScore: 0.84, costIncrease: 12.8, taxBurden: 0.0, hiddenCosts: 11500, riskLevel: 'Low' },
        'Doha': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.70, riskScore: 0.20, qualityScore: 0.84, costIncrease: 12.8, taxBurden: 0.0, hiddenCosts: 11500, riskLevel: 'Low' },
        'Riyadh, Saudi Arabia': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.22, qualityScore: 0.80, costIncrease: 8.5, taxBurden: 0.0, hiddenCosts: 9200, riskLevel: 'Medium' },
        'Riyadh': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.22, qualityScore: 0.80, costIncrease: 8.5, taxBurden: 0.0, hiddenCosts: 9200, riskLevel: 'Medium' },
        // South America
        'Sao Paulo, Brazil': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.55, riskScore: 0.32, qualityScore: 0.75, costIncrease: 8.5, taxBurden: 27.5, hiddenCosts: 7200, riskLevel: 'High' },
        'Sao Paulo': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.55, riskScore: 0.32, qualityScore: 0.75, costIncrease: 8.5, taxBurden: 27.5, hiddenCosts: 7200, riskLevel: 'High' },
        'Buenos Aires, Argentina': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.58, riskScore: 0.35, qualityScore: 0.78, costIncrease: 6.2, taxBurden: 35.0, hiddenCosts: 5800, riskLevel: 'High' },
        'Buenos Aires': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.58, riskScore: 0.35, qualityScore: 0.78, costIncrease: 6.2, taxBurden: 35.0, hiddenCosts: 5800, riskLevel: 'High' },
        'Mexico City, Mexico': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.65, riskScore: 0.30, qualityScore: 0.76, costIncrease: 5.5, taxBurden: 35.0, hiddenCosts: 5200, riskLevel: 'Medium' },
        'Mexico City': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.65, riskScore: 0.30, qualityScore: 0.76, costIncrease: 5.5, taxBurden: 35.0, hiddenCosts: 5200, riskLevel: 'Medium' },
        // Africa
        'Cape Town, South Africa': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.28, qualityScore: 0.78, costIncrease: 5.8, taxBurden: 45.0, hiddenCosts: 5500, riskLevel: 'Medium' },
        'Cape Town': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.28, qualityScore: 0.78, costIncrease: 5.8, taxBurden: 45.0, hiddenCosts: 5500, riskLevel: 'Medium' },
        'Johannesburg, South Africa': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.58, riskScore: 0.32, qualityScore: 0.74, costIncrease: 5.2, taxBurden: 45.0, hiddenCosts: 5200, riskLevel: 'High' },
        'Johannesburg': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.58, riskScore: 0.32, qualityScore: 0.74, costIncrease: 5.2, taxBurden: 45.0, hiddenCosts: 5200, riskLevel: 'High' },
        'Cairo, Egypt': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.35, qualityScore: 0.68, costIncrease: 4.2, taxBurden: 22.5, hiddenCosts: 3800, riskLevel: 'High' },
        'Cairo': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.35, qualityScore: 0.68, costIncrease: 4.2, taxBurden: 22.5, hiddenCosts: 3800, riskLevel: 'High' },
        // Turkey
        'Ankara, Turkey': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.65, riskScore: 0.28, qualityScore: 0.76, costIncrease: 5.5, taxBurden: 35.0, hiddenCosts: 4500, riskLevel: 'Medium' },
        'Ankara': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.65, riskScore: 0.28, qualityScore: 0.76, costIncrease: 5.5, taxBurden: 35.0, hiddenCosts: 4500, riskLevel: 'Medium' },
        'Istanbul, Turkey': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.58, riskScore: 0.30, qualityScore: 0.78, costIncrease: 7.2, taxBurden: 35.0, hiddenCosts: 5200, riskLevel: 'Medium' },
        'Istanbul': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.58, riskScore: 0.30, qualityScore: 0.78, costIncrease: 7.2, taxBurden: 35.0, hiddenCosts: 5200, riskLevel: 'Medium' },
        'Izmir, Turkey': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.70, riskScore: 0.26, qualityScore: 0.77, costIncrease: 4.8, taxBurden: 35.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'Izmir': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.70, riskScore: 0.26, qualityScore: 0.77, costIncrease: 4.8, taxBurden: 35.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        // Pacific Islands
        'Suva, Fiji': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.55, riskScore: 0.35, qualityScore: 0.65, costIncrease: 3.5, taxBurden: 20.0, hiddenCosts: 3200, riskLevel: 'High' },
        'Suva': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.55, riskScore: 0.35, qualityScore: 0.65, costIncrease: 3.5, taxBurden: 20.0, hiddenCosts: 3200, riskLevel: 'High' },
        'Port Moresby, Papua New Guinea': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.45, riskScore: 0.42, qualityScore: 0.55, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 4500, riskLevel: 'High' },
        'Port Moresby': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.45, riskScore: 0.42, qualityScore: 0.55, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 4500, riskLevel: 'High' },
        // More Indian Cities - Tier 2/3
        'Faridabad, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.28, qualityScore: 0.70, costIncrease: 5.8, taxBurden: 30.0, hiddenCosts: 2800, riskLevel: 'Medium' },
        'Faridabad': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.28, qualityScore: 0.70, costIncrease: 5.8, taxBurden: 30.0, hiddenCosts: 2800, riskLevel: 'Medium' },
        'Ghaziabad, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.29, qualityScore: 0.68, costIncrease: 5.5, taxBurden: 30.0, hiddenCosts: 2600, riskLevel: 'Medium' },
        'Ghaziabad': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.29, qualityScore: 0.68, costIncrease: 5.5, taxBurden: 30.0, hiddenCosts: 2600, riskLevel: 'Medium' },
        'Vadodara, India': { wealthMultiplier1: 0.71, wealthMultiplier5: 1.24, riskScore: 0.25, qualityScore: 0.72, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'Medium' },
        'Vadodara': { wealthMultiplier1: 0.71, wealthMultiplier5: 1.24, riskScore: 0.25, qualityScore: 0.72, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'Medium' },
        'Rajkot, India': { wealthMultiplier1: 0.72, wealthMultiplier5: 1.26, riskScore: 0.24, qualityScore: 0.71, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Rajkot': { wealthMultiplier1: 0.72, wealthMultiplier5: 1.26, riskScore: 0.24, qualityScore: 0.71, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Nashik, India': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.70, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Nashik': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.70, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Mysore, India': { wealthMultiplier1: 0.71, wealthMultiplier5: 1.24, riskScore: 0.24, qualityScore: 0.73, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Mysore': { wealthMultiplier1: 0.71, wealthMultiplier5: 1.24, riskScore: 0.24, qualityScore: 0.73, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Mysuru, India': { wealthMultiplier1: 0.71, wealthMultiplier5: 1.24, riskScore: 0.24, qualityScore: 0.73, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Mysuru': { wealthMultiplier1: 0.71, wealthMultiplier5: 1.24, riskScore: 0.24, qualityScore: 0.73, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Mangalore, India': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.23, riskScore: 0.25, qualityScore: 0.72, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2150, riskLevel: 'Medium' },
        'Mangalore': { wealthMultiplier1: 0.70, wealthMultiplier5: 1.23, riskScore: 0.25, qualityScore: 0.72, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2150, riskLevel: 'Medium' },
        'Trivandrum, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.25, qualityScore: 0.71, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Trivandrum': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.25, qualityScore: 0.71, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        // Russia
        'Moscow, Russia': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.52, riskScore: 0.35, qualityScore: 0.78, costIncrease: 8.5, taxBurden: 13.0, hiddenCosts: 8500, riskLevel: 'High' },
        'Moscow': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.52, riskScore: 0.35, qualityScore: 0.78, costIncrease: 8.5, taxBurden: 13.0, hiddenCosts: 8500, riskLevel: 'High' },
        'St Petersburg, Russia': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.58, riskScore: 0.32, qualityScore: 0.80, costIncrease: 6.2, taxBurden: 13.0, hiddenCosts: 6800, riskLevel: 'High' },
        'St Petersburg': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.58, riskScore: 0.32, qualityScore: 0.80, costIncrease: 6.2, taxBurden: 13.0, hiddenCosts: 6800, riskLevel: 'High' },
        // More South America
        'Lima, Peru': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.68, riskScore: 0.30, qualityScore: 0.72, costIncrease: 4.8, taxBurden: 30.0, hiddenCosts: 4200, riskLevel: 'Medium' },
        'Lima': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.68, riskScore: 0.30, qualityScore: 0.72, costIncrease: 4.8, taxBurden: 30.0, hiddenCosts: 4200, riskLevel: 'Medium' },
        'Bogota, Colombia': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.32, qualityScore: 0.70, costIncrease: 4.5, taxBurden: 33.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'Bogota': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.32, qualityScore: 0.70, costIncrease: 4.5, taxBurden: 33.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'Santiago, Chile': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.58, riskScore: 0.25, qualityScore: 0.80, costIncrease: 6.2, taxBurden: 35.0, hiddenCosts: 5500, riskLevel: 'Medium' },
        'Santiago': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.58, riskScore: 0.25, qualityScore: 0.80, costIncrease: 6.2, taxBurden: 35.0, hiddenCosts: 5500, riskLevel: 'Medium' },
        'Medellin, Colombia': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.75, riskScore: 0.28, qualityScore: 0.76, costIncrease: 3.5, taxBurden: 33.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Medellin': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.75, riskScore: 0.28, qualityScore: 0.76, costIncrease: 3.5, taxBurden: 33.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        // More Africa
        'Lagos, Nigeria': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.62, riskScore: 0.40, qualityScore: 0.58, costIncrease: 5.5, taxBurden: 24.0, hiddenCosts: 4800, riskLevel: 'High' },
        'Lagos': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.62, riskScore: 0.40, qualityScore: 0.58, costIncrease: 5.5, taxBurden: 24.0, hiddenCosts: 4800, riskLevel: 'High' },
        'Nairobi, Kenya': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.68, riskScore: 0.35, qualityScore: 0.65, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 4000, riskLevel: 'High' },
        'Nairobi': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.68, riskScore: 0.35, qualityScore: 0.65, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 4000, riskLevel: 'High' },
        'Casablanca, Morocco': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.28, qualityScore: 0.72, costIncrease: 3.8, taxBurden: 38.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Casablanca': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.28, qualityScore: 0.72, costIncrease: 3.8, taxBurden: 38.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        // More US Cities
        'San Francisco, USA': { wealthMultiplier1: 0.72, wealthMultiplier5: 1.45, riskScore: 0.20, qualityScore: 0.88, costIncrease: 32.5, taxBurden: 35.0, hiddenCosts: 22000, riskLevel: 'Medium' },
        'San Francisco': { wealthMultiplier1: 0.72, wealthMultiplier5: 1.45, riskScore: 0.20, qualityScore: 0.88, costIncrease: 32.5, taxBurden: 35.0, hiddenCosts: 22000, riskLevel: 'Medium' },
        'Washington DC, USA': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.52, riskScore: 0.18, qualityScore: 0.89, costIncrease: 22.5, taxBurden: 34.0, hiddenCosts: 16500, riskLevel: 'Low' },
        'Washington DC': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.52, riskScore: 0.18, qualityScore: 0.89, costIncrease: 22.5, taxBurden: 34.0, hiddenCosts: 16500, riskLevel: 'Low' },
        'Philadelphia, USA': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.58, riskScore: 0.22, qualityScore: 0.84, costIncrease: 12.5, taxBurden: 32.0, hiddenCosts: 11500, riskLevel: 'Medium' },
        'Philadelphia': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.58, riskScore: 0.22, qualityScore: 0.84, costIncrease: 12.5, taxBurden: 32.0, hiddenCosts: 11500, riskLevel: 'Medium' },
        'Phoenix, USA': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.65, riskScore: 0.20, qualityScore: 0.82, costIncrease: 10.5, taxBurden: 25.0, hiddenCosts: 9500, riskLevel: 'Low' },
        'Phoenix': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.65, riskScore: 0.20, qualityScore: 0.82, costIncrease: 10.5, taxBurden: 25.0, hiddenCosts: 9500, riskLevel: 'Low' },
        'San Diego, USA': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.55, riskScore: 0.18, qualityScore: 0.90, costIncrease: 18.5, taxBurden: 33.0, hiddenCosts: 14500, riskLevel: 'Low' },
        'San Diego': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.55, riskScore: 0.18, qualityScore: 0.90, costIncrease: 18.5, taxBurden: 33.0, hiddenCosts: 14500, riskLevel: 'Low' },
        'Dallas, USA': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.68, riskScore: 0.19, qualityScore: 0.84, costIncrease: 11.2, taxBurden: 22.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Dallas': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.68, riskScore: 0.19, qualityScore: 0.84, costIncrease: 11.2, taxBurden: 22.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Houston, USA': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.21, qualityScore: 0.82, costIncrease: 9.8, taxBurden: 22.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Houston': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.21, qualityScore: 0.82, costIncrease: 9.8, taxBurden: 22.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Atlanta, USA': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.65, riskScore: 0.20, qualityScore: 0.83, costIncrease: 10.8, taxBurden: 28.0, hiddenCosts: 10500, riskLevel: 'Low' },
        'Atlanta': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.65, riskScore: 0.20, qualityScore: 0.83, costIncrease: 10.8, taxBurden: 28.0, hiddenCosts: 10500, riskLevel: 'Low' },
        // More European
        'Lyon, France': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.52, riskScore: 0.18, qualityScore: 0.90, costIncrease: 12.5, taxBurden: 45.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Lyon': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.52, riskScore: 0.18, qualityScore: 0.90, costIncrease: 12.5, taxBurden: 45.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Marseille, France': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.55, riskScore: 0.22, qualityScore: 0.86, costIncrease: 10.2, taxBurden: 45.0, hiddenCosts: 9500, riskLevel: 'Medium' },
        'Marseille': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.55, riskScore: 0.22, qualityScore: 0.86, costIncrease: 10.2, taxBurden: 45.0, hiddenCosts: 9500, riskLevel: 'Medium' },
        'Nice, France': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.48, riskScore: 0.16, qualityScore: 0.92, costIncrease: 16.5, taxBurden: 45.0, hiddenCosts: 12500, riskLevel: 'Low' },
        'Nice': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.48, riskScore: 0.16, qualityScore: 0.92, costIncrease: 16.5, taxBurden: 45.0, hiddenCosts: 12500, riskLevel: 'Low' },
        'Porto, Portugal': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.72, riskScore: 0.17, qualityScore: 0.88, costIncrease: 5.8, taxBurden: 28.0, hiddenCosts: 6800, riskLevel: 'Low' },
        'Porto': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.72, riskScore: 0.17, qualityScore: 0.88, costIncrease: 5.8, taxBurden: 28.0, hiddenCosts: 6800, riskLevel: 'Low' },
        // Japan
        'Osaka, Japan': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.52, riskScore: 0.14, qualityScore: 0.92, costIncrease: 15.2, taxBurden: 28.5, hiddenCosts: 12800, riskLevel: 'Low' },
        'Osaka': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.52, riskScore: 0.14, qualityScore: 0.92, costIncrease: 15.2, taxBurden: 28.5, hiddenCosts: 12800, riskLevel: 'Low' },
        'Kyoto, Japan': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.55, riskScore: 0.12, qualityScore: 0.94, costIncrease: 14.5, taxBurden: 28.5, hiddenCosts: 11500, riskLevel: 'Low' },
        'Kyoto': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.55, riskScore: 0.12, qualityScore: 0.94, costIncrease: 14.5, taxBurden: 28.5, hiddenCosts: 11500, riskLevel: 'Low' },
        'Fukuoka, Japan': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.62, riskScore: 0.13, qualityScore: 0.91, costIncrease: 11.8, taxBurden: 28.5, hiddenCosts: 10200, riskLevel: 'Low' },
        'Fukuoka': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.62, riskScore: 0.13, qualityScore: 0.91, costIncrease: 11.8, taxBurden: 28.5, hiddenCosts: 10200, riskLevel: 'Low' },
        // South Korea
        'Busan, South Korea': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.62, riskScore: 0.15, qualityScore: 0.90, costIncrease: 10.5, taxBurden: 26.5, hiddenCosts: 10500, riskLevel: 'Low' },
        'Busan': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.62, riskScore: 0.15, qualityScore: 0.90, costIncrease: 10.5, taxBurden: 26.5, hiddenCosts: 10500, riskLevel: 'Low' },
        'Incheon, South Korea': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.60, riskScore: 0.16, qualityScore: 0.89, costIncrease: 11.2, taxBurden: 26.5, hiddenCosts: 10800, riskLevel: 'Low' },
        'Incheon': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.60, riskScore: 0.16, qualityScore: 0.89, costIncrease: 11.2, taxBurden: 26.5, hiddenCosts: 10800, riskLevel: 'Low' },
        // Switzerland
        'Geneva, Switzerland': { wealthMultiplier1: 0.73, wealthMultiplier5: 1.60, riskScore: 0.10, qualityScore: 0.96, costIncrease: 38.5, taxBurden: 22.0, hiddenCosts: 18000, riskLevel: 'Low' },
        'Geneva': { wealthMultiplier1: 0.73, wealthMultiplier5: 1.60, riskScore: 0.10, qualityScore: 0.96, costIncrease: 38.5, taxBurden: 22.0, hiddenCosts: 18000, riskLevel: 'Low' },
        'Basel, Switzerland': { wealthMultiplier1: 0.76, wealthMultiplier5: 1.62, riskScore: 0.11, qualityScore: 0.95, costIncrease: 32.0, taxBurden: 22.0, hiddenCosts: 15500, riskLevel: 'Low' },
        'Basel': { wealthMultiplier1: 0.76, wealthMultiplier5: 1.62, riskScore: 0.11, qualityScore: 0.95, costIncrease: 32.0, taxBurden: 22.0, hiddenCosts: 15500, riskLevel: 'Low' },
        'Bern, Switzerland': { wealthMultiplier1: 0.77, wealthMultiplier5: 1.63, riskScore: 0.10, qualityScore: 0.96, costIncrease: 30.0, taxBurden: 22.0, hiddenCosts: 14800, riskLevel: 'Low' },
        'Bern': { wealthMultiplier1: 0.77, wealthMultiplier5: 1.63, riskScore: 0.10, qualityScore: 0.96, costIncrease: 30.0, taxBurden: 22.0, hiddenCosts: 14800, riskLevel: 'Low' },
        // Sweden
        'Gothenburg, Sweden': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.56, riskScore: 0.12, qualityScore: 0.94, costIncrease: 13.5, taxBurden: 52.0, hiddenCosts: 11000, riskLevel: 'Low' },
        'Gothenburg': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.56, riskScore: 0.12, qualityScore: 0.94, costIncrease: 13.5, taxBurden: 52.0, hiddenCosts: 11000, riskLevel: 'Low' },
        'Malmö, Sweden': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.58, riskScore: 0.13, qualityScore: 0.93, costIncrease: 11.8, taxBurden: 52.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Malmö': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.58, riskScore: 0.13, qualityScore: 0.93, costIncrease: 11.8, taxBurden: 52.0, hiddenCosts: 10200, riskLevel: 'Low' },
        // China
        'Guangzhou, China': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.60, riskScore: 0.26, qualityScore: 0.81, costIncrease: 12.5, taxBurden: 45.0, hiddenCosts: 10500, riskLevel: 'Medium' },
        'Guangzhou': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.60, riskScore: 0.26, qualityScore: 0.81, costIncrease: 12.5, taxBurden: 45.0, hiddenCosts: 10500, riskLevel: 'Medium' },
        'Hangzhou, China': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.65, riskScore: 0.24, qualityScore: 0.83, costIncrease: 11.0, taxBurden: 45.0, hiddenCosts: 9800, riskLevel: 'Medium' },
        'Hangzhou': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.65, riskScore: 0.24, qualityScore: 0.83, costIncrease: 11.0, taxBurden: 45.0, hiddenCosts: 9800, riskLevel: 'Medium' },
        'Chengdu, China': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.70, riskScore: 0.25, qualityScore: 0.80, costIncrease: 8.5, taxBurden: 45.0, hiddenCosts: 8200, riskLevel: 'Medium' },
        'Chengdu': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.70, riskScore: 0.25, qualityScore: 0.80, costIncrease: 8.5, taxBurden: 45.0, hiddenCosts: 8200, riskLevel: 'Medium' },
        // Germany additional
        'Hamburg, Germany': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.60, riskScore: 0.14, qualityScore: 0.93, costIncrease: 11.5, taxBurden: 42.0, hiddenCosts: 10800, riskLevel: 'Low' },
        'Hamburg': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.60, riskScore: 0.14, qualityScore: 0.93, costIncrease: 11.5, taxBurden: 42.0, hiddenCosts: 10800, riskLevel: 'Low' },
        'Cologne, Germany': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.61, riskScore: 0.15, qualityScore: 0.91, costIncrease: 10.2, taxBurden: 42.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Cologne': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.61, riskScore: 0.15, qualityScore: 0.91, costIncrease: 10.2, taxBurden: 42.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Berlin': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.62, riskScore: 0.18, qualityScore: 0.91, costIncrease: 8.7, taxBurden: 38.2, hiddenCosts: 9600, riskLevel: 'Low' },
        // Netherlands additional
        'Rotterdam, Netherlands': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.56, riskScore: 0.15, qualityScore: 0.91, costIncrease: 9.5, taxBurden: 42.5, hiddenCosts: 8500, riskLevel: 'Low' },
        'Rotterdam': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.56, riskScore: 0.15, qualityScore: 0.91, costIncrease: 9.5, taxBurden: 42.5, hiddenCosts: 8500, riskLevel: 'Low' },
        'The Hague, Netherlands': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.55, riskScore: 0.14, qualityScore: 0.92, costIncrease: 10.8, taxBurden: 42.5, hiddenCosts: 9200, riskLevel: 'Low' },
        'The Hague': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.55, riskScore: 0.14, qualityScore: 0.92, costIncrease: 10.8, taxBurden: 42.5, hiddenCosts: 9200, riskLevel: 'Low' },
        'Amsterdam': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.58, riskScore: 0.16, qualityScore: 0.92, costIncrease: 10.2, taxBurden: 42.5, hiddenCosts: 8800, riskLevel: 'Low' },
        // Denmark additional
        'Aarhus, Denmark': { wealthMultiplier1: 0.83, wealthMultiplier5: 1.52, riskScore: 0.11, qualityScore: 0.95, costIncrease: 15.5, taxBurden: 55.0, hiddenCosts: 12500, riskLevel: 'Low' },
        'Aarhus': { wealthMultiplier1: 0.83, wealthMultiplier5: 1.52, riskScore: 0.11, qualityScore: 0.95, costIncrease: 15.5, taxBurden: 55.0, hiddenCosts: 12500, riskLevel: 'Low' },
        'Odense, Denmark': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.55, riskScore: 0.10, qualityScore: 0.94, costIncrease: 13.2, taxBurden: 55.0, hiddenCosts: 11500, riskLevel: 'Low' },
        'Odense': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.55, riskScore: 0.10, qualityScore: 0.94, costIncrease: 13.2, taxBurden: 55.0, hiddenCosts: 11500, riskLevel: 'Low' },
        // Norway additional
        'Bergen, Norway': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.48, riskScore: 0.10, qualityScore: 0.96, costIncrease: 20.5, taxBurden: 46.0, hiddenCosts: 14200, riskLevel: 'Low' },
        'Bergen': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.48, riskScore: 0.10, qualityScore: 0.96, costIncrease: 20.5, taxBurden: 46.0, hiddenCosts: 14200, riskLevel: 'Low' },
        'Trondheim, Norway': { wealthMultiplier1: 0.79, wealthMultiplier5: 1.42, riskScore: 0.09, qualityScore: 0.97, costIncrease: 19.2, taxBurden: 46.0, hiddenCosts: 13800, riskLevel: 'Low' },
        'Trondheim': { wealthMultiplier1: 0.79, wealthMultiplier5: 1.42, riskScore: 0.09, qualityScore: 0.97, costIncrease: 19.2, taxBurden: 46.0, hiddenCosts: 13800, riskLevel: 'Low' },
        // Austria additional
        'Salzburg, Austria': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.58, riskScore: 0.12, qualityScore: 0.95, costIncrease: 12.5, taxBurden: 42.0, hiddenCosts: 10500, riskLevel: 'Low' },
        'Salzburg': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.58, riskScore: 0.12, qualityScore: 0.95, costIncrease: 12.5, taxBurden: 42.0, hiddenCosts: 10500, riskLevel: 'Low' },
        'Graz, Austria': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.62, riskScore: 0.11, qualityScore: 0.94, costIncrease: 9.8, taxBurden: 42.0, hiddenCosts: 8800, riskLevel: 'Low' },
        'Graz': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.62, riskScore: 0.11, qualityScore: 0.94, costIncrease: 9.8, taxBurden: 42.0, hiddenCosts: 8800, riskLevel: 'Low' },
        // Czech additional
        'Brno, Czech Republic': { wealthMultiplier1: 0.97, wealthMultiplier5: 1.88, riskScore: 0.15, qualityScore: 0.87, costIncrease: 3.8, taxBurden: 23.0, hiddenCosts: 4500, riskLevel: 'Low' },
        'Brno': { wealthMultiplier1: 0.97, wealthMultiplier5: 1.88, riskScore: 0.15, qualityScore: 0.87, costIncrease: 3.8, taxBurden: 23.0, hiddenCosts: 4500, riskLevel: 'Low' },
        // Poland additional
        'Gdansk, Poland': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.90, riskScore: 0.14, qualityScore: 0.88, costIncrease: 4.2, taxBurden: 19.0, hiddenCosts: 4300, riskLevel: 'Low' },
        'Gdansk': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.90, riskScore: 0.14, qualityScore: 0.88, costIncrease: 4.2, taxBurden: 19.0, hiddenCosts: 4300, riskLevel: 'Low' },
        // Hungary additional
        'Debrecen, Hungary': { wealthMultiplier1: 0.98, wealthMultiplier5: 1.92, riskScore: 0.17, qualityScore: 0.82, costIncrease: 3.2, taxBurden: 15.0, hiddenCosts: 3500, riskLevel: 'Low' },
        'Debrecen': { wealthMultiplier1: 0.98, wealthMultiplier5: 1.92, riskScore: 0.17, qualityScore: 0.82, costIncrease: 3.2, taxBurden: 15.0, hiddenCosts: 3500, riskLevel: 'Low' },
        // Greece additional
        'Thessaloniki, Greece': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.70, riskScore: 0.24, qualityScore: 0.80, costIncrease: 4.8, taxBurden: 44.0, hiddenCosts: 6200, riskLevel: 'Medium' },
        'Thessaloniki': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.70, riskScore: 0.24, qualityScore: 0.80, costIncrease: 4.8, taxBurden: 44.0, hiddenCosts: 6200, riskLevel: 'Medium' },
        // Italy additional
        'Naples, Italy': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.58, riskScore: 0.28, qualityScore: 0.80, costIncrease: 6.5, taxBurden: 43.0, hiddenCosts: 7800, riskLevel: 'Medium' },
        'Naples': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.58, riskScore: 0.28, qualityScore: 0.80, costIncrease: 6.5, taxBurden: 43.0, hiddenCosts: 7800, riskLevel: 'Medium' },
        'Turin, Italy': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.68, riskScore: 0.22, qualityScore: 0.86, costIncrease: 9.8, taxBurden: 43.0, hiddenCosts: 9200, riskLevel: 'Medium' },
        'Turin': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.68, riskScore: 0.22, qualityScore: 0.86, costIncrease: 9.8, taxBurden: 43.0, hiddenCosts: 9200, riskLevel: 'Medium' },
        'Florence, Italy': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.48, riskScore: 0.20, qualityScore: 0.90, costIncrease: 14.5, taxBurden: 43.0, hiddenCosts: 11500, riskLevel: 'Low' },
        'Florence': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.48, riskScore: 0.20, qualityScore: 0.90, costIncrease: 14.5, taxBurden: 43.0, hiddenCosts: 11500, riskLevel: 'Low' },
        // France additional
        'Toulouse, France': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.54, riskScore: 0.19, qualityScore: 0.89, costIncrease: 11.2, taxBurden: 45.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Toulouse': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.54, riskScore: 0.19, qualityScore: 0.89, costIncrease: 11.2, taxBurden: 45.0, hiddenCosts: 9800, riskLevel: 'Low' },
        // Luxembourg
        'Luxembourg City, Luxembourg': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.68, riskScore: 0.08, qualityScore: 0.97, costIncrease: 28.5, taxBurden: 38.0, hiddenCosts: 15500, riskLevel: 'Low' },
        'Luxembourg City': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.68, riskScore: 0.08, qualityScore: 0.97, costIncrease: 28.5, taxBurden: 38.0, hiddenCosts: 15500, riskLevel: 'Low' },
        // Canada additional
        'Calgary, Canada': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.65, riskScore: 0.15, qualityScore: 0.92, costIncrease: 11.5, taxBurden: 33.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Calgary': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.65, riskScore: 0.15, qualityScore: 0.92, costIncrease: 11.5, taxBurden: 33.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Ottawa, Canada': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.60, riskScore: 0.14, qualityScore: 0.93, costIncrease: 12.2, taxBurden: 33.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Ottawa': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.60, riskScore: 0.14, qualityScore: 0.93, costIncrease: 12.2, taxBurden: 33.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Toronto': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.55, riskScore: 0.17, qualityScore: 0.90, costIncrease: 14.5, taxBurden: 33.8, hiddenCosts: 10200, riskLevel: 'Low' },
        // Japan additional
        'Yokohama, Japan': { wealthMultiplier1: 0.79, wealthMultiplier5: 1.50, riskScore: 0.14, qualityScore: 0.92, costIncrease: 17.2, taxBurden: 28.5, hiddenCosts: 13500, riskLevel: 'Low' },
        'Yokohama': { wealthMultiplier1: 0.79, wealthMultiplier5: 1.50, riskScore: 0.14, qualityScore: 0.92, costIncrease: 17.2, taxBurden: 28.5, hiddenCosts: 13500, riskLevel: 'Low' },
        'Nagoya, Japan': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.55, riskScore: 0.13, qualityScore: 0.91, costIncrease: 14.5, taxBurden: 28.5, hiddenCosts: 12200, riskLevel: 'Low' },
        'Nagoya': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.55, riskScore: 0.13, qualityScore: 0.91, costIncrease: 14.5, taxBurden: 28.5, hiddenCosts: 12200, riskLevel: 'Low' },
        // Australia additional
        'Brisbane, Australia': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.58, riskScore: 0.13, qualityScore: 0.93, costIncrease: 14.8, taxBurden: 32.0, hiddenCosts: 11800, riskLevel: 'Low' },
        'Brisbane': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.58, riskScore: 0.13, qualityScore: 0.93, costIncrease: 14.8, taxBurden: 32.0, hiddenCosts: 11800, riskLevel: 'Low' },
        'Perth, Australia': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.60, riskScore: 0.12, qualityScore: 0.94, costIncrease: 13.5, taxBurden: 32.0, hiddenCosts: 11200, riskLevel: 'Low' },
        'Perth': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.60, riskScore: 0.12, qualityScore: 0.94, costIncrease: 13.5, taxBurden: 32.0, hiddenCosts: 11200, riskLevel: 'Low' },
        'Adelaide, Australia': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.62, riskScore: 0.11, qualityScore: 0.93, costIncrease: 11.2, taxBurden: 32.0, hiddenCosts: 10500, riskLevel: 'Low' },
        'Adelaide': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.62, riskScore: 0.11, qualityScore: 0.93, costIncrease: 11.2, taxBurden: 32.0, hiddenCosts: 10500, riskLevel: 'Low' },
        'Sydney': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.52, riskScore: 0.14, qualityScore: 0.94, costIncrease: 19.8, taxBurden: 32.0, hiddenCosts: 13500, riskLevel: 'Low' },
        // Middle East additional
        'Dubai': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.72, riskScore: 0.20, qualityScore: 0.84, costIncrease: 12.5, taxBurden: 5.0, hiddenCosts: 11000, riskLevel: 'Medium' },
        'Sharjah, UAE': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.22, qualityScore: 0.80, costIncrease: 8.5, taxBurden: 0.0, hiddenCosts: 8500, riskLevel: 'Medium' },
        'Sharjah': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.22, qualityScore: 0.80, costIncrease: 8.5, taxBurden: 0.0, hiddenCosts: 8500, riskLevel: 'Medium' },
        'Jeddah, Saudi Arabia': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.75, riskScore: 0.24, qualityScore: 0.78, costIncrease: 9.2, taxBurden: 0.0, hiddenCosts: 9500, riskLevel: 'Medium' },
        'Jeddah': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.75, riskScore: 0.24, qualityScore: 0.78, costIncrease: 9.2, taxBurden: 0.0, hiddenCosts: 9500, riskLevel: 'Medium' },
        'Dammam, Saudi Arabia': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.80, riskScore: 0.23, qualityScore: 0.77, costIncrease: 7.8, taxBurden: 0.0, hiddenCosts: 8200, riskLevel: 'Medium' },
        'Dammam': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.80, riskScore: 0.23, qualityScore: 0.77, costIncrease: 7.8, taxBurden: 0.0, hiddenCosts: 8200, riskLevel: 'Medium' },
        'Kuwait City, Kuwait': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.75, riskScore: 0.20, qualityScore: 0.82, costIncrease: 10.5, taxBurden: 0.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Kuwait City': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.75, riskScore: 0.20, qualityScore: 0.82, costIncrease: 10.5, taxBurden: 0.0, hiddenCosts: 10200, riskLevel: 'Low' },
        'Manama, Bahrain': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.76, riskScore: 0.19, qualityScore: 0.83, costIncrease: 9.8, taxBurden: 0.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Manama': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.76, riskScore: 0.19, qualityScore: 0.83, costIncrease: 9.8, taxBurden: 0.0, hiddenCosts: 9800, riskLevel: 'Low' },
        'Muscat, Oman': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.18, qualityScore: 0.84, costIncrease: 8.5, taxBurden: 0.0, hiddenCosts: 9200, riskLevel: 'Low' },
        'Muscat': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.18, qualityScore: 0.84, costIncrease: 8.5, taxBurden: 0.0, hiddenCosts: 9200, riskLevel: 'Low' },
        // Israel
        'Tel Aviv, Israel': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.52, riskScore: 0.25, qualityScore: 0.88, costIncrease: 22.5, taxBurden: 48.0, hiddenCosts: 15500, riskLevel: 'Medium' },
        'Tel Aviv': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.52, riskScore: 0.25, qualityScore: 0.88, costIncrease: 22.5, taxBurden: 48.0, hiddenCosts: 15500, riskLevel: 'Medium' },
        'Jerusalem, Israel': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.55, riskScore: 0.28, qualityScore: 0.85, costIncrease: 18.5, taxBurden: 48.0, hiddenCosts: 13500, riskLevel: 'Medium' },
        'Jerusalem': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.55, riskScore: 0.28, qualityScore: 0.85, costIncrease: 18.5, taxBurden: 48.0, hiddenCosts: 13500, riskLevel: 'Medium' },
        'Haifa, Israel': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.60, riskScore: 0.24, qualityScore: 0.87, costIncrease: 14.2, taxBurden: 48.0, hiddenCosts: 11500, riskLevel: 'Medium' },
        'Haifa': { wealthMultiplier1: 0.84, wealthMultiplier5: 1.60, riskScore: 0.24, qualityScore: 0.87, costIncrease: 14.2, taxBurden: 48.0, hiddenCosts: 11500, riskLevel: 'Medium' },
        // Mexico additional
        'Guadalajara, Mexico': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.70, riskScore: 0.28, qualityScore: 0.75, costIncrease: 4.8, taxBurden: 35.0, hiddenCosts: 4800, riskLevel: 'Medium' },
        'Guadalajara': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.70, riskScore: 0.28, qualityScore: 0.75, costIncrease: 4.8, taxBurden: 35.0, hiddenCosts: 4800, riskLevel: 'Medium' },
        'Monterrey, Mexico': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.68, riskScore: 0.26, qualityScore: 0.77, costIncrease: 5.5, taxBurden: 35.0, hiddenCosts: 5200, riskLevel: 'Medium' },
        'Monterrey': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.68, riskScore: 0.26, qualityScore: 0.77, costIncrease: 5.5, taxBurden: 35.0, hiddenCosts: 5200, riskLevel: 'Medium' },
        // Southeast Asia additional
        'George Town, Malaysia': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.88, riskScore: 0.18, qualityScore: 0.84, costIncrease: 3.8, taxBurden: 28.0, hiddenCosts: 4200, riskLevel: 'Low' },
        'George Town': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.88, riskScore: 0.18, qualityScore: 0.84, costIncrease: 3.8, taxBurden: 28.0, hiddenCosts: 4200, riskLevel: 'Low' },
        'Johor Bahru, Malaysia': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.90, riskScore: 0.20, qualityScore: 0.80, costIncrease: 3.2, taxBurden: 28.0, hiddenCosts: 3800, riskLevel: 'Low' },
        'Johor Bahru': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.90, riskScore: 0.20, qualityScore: 0.80, costIncrease: 3.2, taxBurden: 28.0, hiddenCosts: 3800, riskLevel: 'Low' },
        'Surabaya, Indonesia': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.82, riskScore: 0.28, qualityScore: 0.70, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 4200, riskLevel: 'Medium' },
        'Surabaya': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.82, riskScore: 0.28, qualityScore: 0.70, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 4200, riskLevel: 'Medium' },
        'Bandung, Indonesia': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.85, riskScore: 0.26, qualityScore: 0.72, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 3800, riskLevel: 'Medium' },
        'Bandung': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.85, riskScore: 0.26, qualityScore: 0.72, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 3800, riskLevel: 'Medium' },
        'Medan, Indonesia': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.80, riskScore: 0.30, qualityScore: 0.68, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'Medan': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.80, riskScore: 0.30, qualityScore: 0.68, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'Davao, Philippines': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.85, riskScore: 0.28, qualityScore: 0.72, costIncrease: 3.2, taxBurden: 32.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Davao': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.85, riskScore: 0.28, qualityScore: 0.72, costIncrease: 3.2, taxBurden: 32.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Da Nang, Vietnam': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.88, riskScore: 0.24, qualityScore: 0.76, costIncrease: 3.5, taxBurden: 35.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Da Nang': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.88, riskScore: 0.24, qualityScore: 0.76, costIncrease: 3.5, taxBurden: 35.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Yangon, Myanmar': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.78, riskScore: 0.38, qualityScore: 0.62, costIncrease: 3.2, taxBurden: 25.0, hiddenCosts: 3200, riskLevel: 'High' },
        'Yangon': { wealthMultiplier1: 0.94, wealthMultiplier5: 1.78, riskScore: 0.38, qualityScore: 0.62, costIncrease: 3.2, taxBurden: 25.0, hiddenCosts: 3200, riskLevel: 'High' },
        'Mandalay, Myanmar': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.82, riskScore: 0.36, qualityScore: 0.60, costIncrease: 2.8, taxBurden: 25.0, hiddenCosts: 2800, riskLevel: 'High' },
        'Mandalay': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.82, riskScore: 0.36, qualityScore: 0.60, costIncrease: 2.8, taxBurden: 25.0, hiddenCosts: 2800, riskLevel: 'High' },
        'Phnom Penh, Cambodia': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.85, riskScore: 0.32, qualityScore: 0.65, costIncrease: 3.0, taxBurden: 20.0, hiddenCosts: 3000, riskLevel: 'Medium' },
        'Phnom Penh': { wealthMultiplier1: 0.95, wealthMultiplier5: 1.85, riskScore: 0.32, qualityScore: 0.65, costIncrease: 3.0, taxBurden: 20.0, hiddenCosts: 3000, riskLevel: 'Medium' },
        'Siem Reap, Cambodia': { wealthMultiplier1: 0.97, wealthMultiplier5: 1.90, riskScore: 0.30, qualityScore: 0.68, costIncrease: 2.5, taxBurden: 20.0, hiddenCosts: 2500, riskLevel: 'Medium' },
        'Siem Reap': { wealthMultiplier1: 0.97, wealthMultiplier5: 1.90, riskScore: 0.30, qualityScore: 0.68, costIncrease: 2.5, taxBurden: 20.0, hiddenCosts: 2500, riskLevel: 'Medium' },
        'Vientiane, Laos': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.88, riskScore: 0.34, qualityScore: 0.62, costIncrease: 2.8, taxBurden: 24.0, hiddenCosts: 2800, riskLevel: 'Medium' },
        'Vientiane': { wealthMultiplier1: 0.96, wealthMultiplier5: 1.88, riskScore: 0.34, qualityScore: 0.62, costIncrease: 2.8, taxBurden: 24.0, hiddenCosts: 2800, riskLevel: 'Medium' },
        'Bandar Seri Begawan, Brunei': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.15, qualityScore: 0.85, costIncrease: 5.5, taxBurden: 0.0, hiddenCosts: 6500, riskLevel: 'Low' },
        'Bandar Seri Begawan': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.15, qualityScore: 0.85, costIncrease: 5.5, taxBurden: 0.0, hiddenCosts: 6500, riskLevel: 'Low' },
        'Macau': { wealthMultiplier1: 0.82, wealthMultiplier5: 1.58, riskScore: 0.22, qualityScore: 0.84, costIncrease: 18.5, taxBurden: 12.0, hiddenCosts: 12500, riskLevel: 'Medium' },
        // Africa additional
        'Alexandria, Egypt': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.75, riskScore: 0.32, qualityScore: 0.70, costIncrease: 3.8, taxBurden: 22.5, hiddenCosts: 3500, riskLevel: 'High' },
        'Alexandria': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.75, riskScore: 0.32, qualityScore: 0.70, costIncrease: 3.8, taxBurden: 22.5, hiddenCosts: 3500, riskLevel: 'High' },
        'Giza, Egypt': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.73, riskScore: 0.34, qualityScore: 0.68, costIncrease: 4.0, taxBurden: 22.5, hiddenCosts: 3600, riskLevel: 'High' },
        'Giza': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.73, riskScore: 0.34, qualityScore: 0.68, costIncrease: 4.0, taxBurden: 22.5, hiddenCosts: 3600, riskLevel: 'High' },
        'Durban, South Africa': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.65, riskScore: 0.30, qualityScore: 0.76, costIncrease: 5.0, taxBurden: 45.0, hiddenCosts: 5000, riskLevel: 'Medium' },
        'Durban': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.65, riskScore: 0.30, qualityScore: 0.76, costIncrease: 5.0, taxBurden: 45.0, hiddenCosts: 5000, riskLevel: 'Medium' },
        'Pretoria, South Africa': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.28, qualityScore: 0.78, costIncrease: 4.8, taxBurden: 45.0, hiddenCosts: 4800, riskLevel: 'Medium' },
        'Pretoria': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.28, qualityScore: 0.78, costIncrease: 4.8, taxBurden: 45.0, hiddenCosts: 4800, riskLevel: 'Medium' },
        'Abuja, Nigeria': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.65, riskScore: 0.38, qualityScore: 0.60, costIncrease: 5.0, taxBurden: 24.0, hiddenCosts: 4500, riskLevel: 'High' },
        'Abuja': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.65, riskScore: 0.38, qualityScore: 0.60, costIncrease: 5.0, taxBurden: 24.0, hiddenCosts: 4500, riskLevel: 'High' },
        'Kano, Nigeria': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.70, riskScore: 0.42, qualityScore: 0.55, costIncrease: 3.8, taxBurden: 24.0, hiddenCosts: 3800, riskLevel: 'High' },
        'Kano': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.70, riskScore: 0.42, qualityScore: 0.55, costIncrease: 3.8, taxBurden: 24.0, hiddenCosts: 3800, riskLevel: 'High' },
        'Mombasa, Kenya': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.33, qualityScore: 0.67, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 3600, riskLevel: 'High' },
        'Mombasa': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.33, qualityScore: 0.67, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 3600, riskLevel: 'High' },
        'Addis Ababa, Ethiopia': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.38, qualityScore: 0.58, costIncrease: 3.2, taxBurden: 35.0, hiddenCosts: 3200, riskLevel: 'High' },
        'Addis Ababa': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.38, qualityScore: 0.58, costIncrease: 3.2, taxBurden: 35.0, hiddenCosts: 3200, riskLevel: 'High' },
        'Dar es Salaam, Tanzania': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.75, riskScore: 0.36, qualityScore: 0.60, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 3400, riskLevel: 'High' },
        'Dar es Salaam': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.75, riskScore: 0.36, qualityScore: 0.60, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 3400, riskLevel: 'High' },
        'Kampala, Uganda': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.35, qualityScore: 0.62, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 3200, riskLevel: 'High' },
        'Kampala': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.35, qualityScore: 0.62, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 3200, riskLevel: 'High' },
        'Accra, Ghana': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.70, riskScore: 0.32, qualityScore: 0.68, costIncrease: 4.2, taxBurden: 25.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'Accra': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.70, riskScore: 0.32, qualityScore: 0.68, costIncrease: 4.2, taxBurden: 25.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'Tunis, Tunisia': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.74, riskScore: 0.28, qualityScore: 0.72, costIncrease: 3.5, taxBurden: 35.0, hiddenCosts: 3400, riskLevel: 'Medium' },
        'Tunis': { wealthMultiplier1: 0.91, wealthMultiplier5: 1.74, riskScore: 0.28, qualityScore: 0.72, costIncrease: 3.5, taxBurden: 35.0, hiddenCosts: 3400, riskLevel: 'Medium' },
        'Algiers, Algeria': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.30, qualityScore: 0.70, costIncrease: 3.8, taxBurden: 35.0, hiddenCosts: 3600, riskLevel: 'Medium' },
        'Algiers': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.30, qualityScore: 0.70, costIncrease: 3.8, taxBurden: 35.0, hiddenCosts: 3600, riskLevel: 'Medium' },
        // South America additional
        'Rio de Janeiro, Brazil': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.52, riskScore: 0.34, qualityScore: 0.74, costIncrease: 7.5, taxBurden: 27.5, hiddenCosts: 6800, riskLevel: 'High' },
        'Rio de Janeiro': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.52, riskScore: 0.34, qualityScore: 0.74, costIncrease: 7.5, taxBurden: 27.5, hiddenCosts: 6800, riskLevel: 'High' },
        'Brasilia, Brazil': { wealthMultiplier1: 0.83, wealthMultiplier5: 1.58, riskScore: 0.30, qualityScore: 0.76, costIncrease: 6.2, taxBurden: 27.5, hiddenCosts: 6200, riskLevel: 'Medium' },
        'Brasilia': { wealthMultiplier1: 0.83, wealthMultiplier5: 1.58, riskScore: 0.30, qualityScore: 0.76, costIncrease: 6.2, taxBurden: 27.5, hiddenCosts: 6200, riskLevel: 'Medium' },
        'Salvador, Brazil': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.62, riskScore: 0.32, qualityScore: 0.72, costIncrease: 5.5, taxBurden: 27.5, hiddenCosts: 5500, riskLevel: 'Medium' },
        'Salvador': { wealthMultiplier1: 0.85, wealthMultiplier5: 1.62, riskScore: 0.32, qualityScore: 0.72, costIncrease: 5.5, taxBurden: 27.5, hiddenCosts: 5500, riskLevel: 'Medium' },
        'Fortaleza, Brazil': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.65, riskScore: 0.33, qualityScore: 0.70, costIncrease: 5.0, taxBurden: 27.5, hiddenCosts: 5000, riskLevel: 'Medium' },
        'Fortaleza': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.65, riskScore: 0.33, qualityScore: 0.70, costIncrease: 5.0, taxBurden: 27.5, hiddenCosts: 5000, riskLevel: 'Medium' },
        'Cordoba, Argentina': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.62, riskScore: 0.34, qualityScore: 0.76, costIncrease: 5.2, taxBurden: 35.0, hiddenCosts: 5200, riskLevel: 'High' },
        'Cordoba': { wealthMultiplier1: 0.87, wealthMultiplier5: 1.62, riskScore: 0.34, qualityScore: 0.76, costIncrease: 5.2, taxBurden: 35.0, hiddenCosts: 5200, riskLevel: 'High' },
        'Rosario, Argentina': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.65, riskScore: 0.33, qualityScore: 0.75, costIncrease: 4.8, taxBurden: 35.0, hiddenCosts: 4800, riskLevel: 'High' },
        'Rosario': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.65, riskScore: 0.33, qualityScore: 0.75, costIncrease: 4.8, taxBurden: 35.0, hiddenCosts: 4800, riskLevel: 'High' },
        'Valparaiso, Chile': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.24, qualityScore: 0.78, costIncrease: 5.5, taxBurden: 35.0, hiddenCosts: 5000, riskLevel: 'Medium' },
        'Valparaiso': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.24, qualityScore: 0.78, costIncrease: 5.5, taxBurden: 35.0, hiddenCosts: 5000, riskLevel: 'Medium' },
        'Arequipa, Peru': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.28, qualityScore: 0.74, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 3800, riskLevel: 'Medium' },
        'Arequipa': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.28, qualityScore: 0.74, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 3800, riskLevel: 'Medium' },
        'Cali, Colombia': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.68, riskScore: 0.30, qualityScore: 0.72, costIncrease: 4.0, taxBurden: 33.0, hiddenCosts: 3600, riskLevel: 'Medium' },
        'Cali': { wealthMultiplier1: 0.88, wealthMultiplier5: 1.68, riskScore: 0.30, qualityScore: 0.72, costIncrease: 4.0, taxBurden: 33.0, hiddenCosts: 3600, riskLevel: 'Medium' },
        'Caracas, Venezuela': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.35, riskScore: 0.55, qualityScore: 0.55, costIncrease: 8.5, taxBurden: 34.0, hiddenCosts: 6500, riskLevel: 'High' },
        'Caracas': { wealthMultiplier1: 0.78, wealthMultiplier5: 1.35, riskScore: 0.55, qualityScore: 0.55, costIncrease: 8.5, taxBurden: 34.0, hiddenCosts: 6500, riskLevel: 'High' },
        'Maracaibo, Venezuela': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.38, riskScore: 0.52, qualityScore: 0.52, costIncrease: 7.5, taxBurden: 34.0, hiddenCosts: 5800, riskLevel: 'High' },
        'Maracaibo': { wealthMultiplier1: 0.80, wealthMultiplier5: 1.38, riskScore: 0.52, qualityScore: 0.52, costIncrease: 7.5, taxBurden: 34.0, hiddenCosts: 5800, riskLevel: 'High' },
        'Quito, Ecuador': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.70, riskScore: 0.28, qualityScore: 0.74, costIncrease: 4.5, taxBurden: 25.0, hiddenCosts: 4200, riskLevel: 'Medium' },
        'Quito': { wealthMultiplier1: 0.89, wealthMultiplier5: 1.70, riskScore: 0.28, qualityScore: 0.74, costIncrease: 4.5, taxBurden: 25.0, hiddenCosts: 4200, riskLevel: 'Medium' },
        'Guayaquil, Ecuador': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.30, qualityScore: 0.72, costIncrease: 4.2, taxBurden: 25.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'Guayaquil': { wealthMultiplier1: 0.90, wealthMultiplier5: 1.72, riskScore: 0.30, qualityScore: 0.72, costIncrease: 4.2, taxBurden: 25.0, hiddenCosts: 4000, riskLevel: 'Medium' },
        'La Paz, Bolivia': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.32, qualityScore: 0.65, costIncrease: 3.5, taxBurden: 25.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        'La Paz': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.32, qualityScore: 0.65, costIncrease: 3.5, taxBurden: 25.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        'Santa Cruz, Bolivia': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.80, riskScore: 0.30, qualityScore: 0.68, costIncrease: 3.2, taxBurden: 25.0, hiddenCosts: 3000, riskLevel: 'Medium' },
        'Santa Cruz': { wealthMultiplier1: 0.93, wealthMultiplier5: 1.80, riskScore: 0.30, qualityScore: 0.68, costIncrease: 3.2, taxBurden: 25.0, hiddenCosts: 3000, riskLevel: 'Medium' },
        'Montevideo, Uruguay': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.22, qualityScore: 0.82, costIncrease: 5.8, taxBurden: 36.0, hiddenCosts: 5500, riskLevel: 'Low' },
        'Montevideo': { wealthMultiplier1: 0.86, wealthMultiplier5: 1.62, riskScore: 0.22, qualityScore: 0.82, costIncrease: 5.8, taxBurden: 36.0, hiddenCosts: 5500, riskLevel: 'Low' },
        'Asuncion, Paraguay': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.28, qualityScore: 0.70, costIncrease: 3.5, taxBurden: 10.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        'Asuncion': { wealthMultiplier1: 0.92, wealthMultiplier5: 1.78, riskScore: 0.28, qualityScore: 0.70, costIncrease: 3.5, taxBurden: 10.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        // Additional Indian Cities
        'Kanpur, India': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.18, riskScore: 0.30, qualityScore: 0.66, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Kanpur': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.18, riskScore: 0.30, qualityScore: 0.66, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Thane, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.20, riskScore: 0.28, qualityScore: 0.72, costIncrease: 6.5, taxBurden: 30.0, hiddenCosts: 3200, riskLevel: 'Medium' },
        'Thane': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.20, riskScore: 0.28, qualityScore: 0.72, costIncrease: 6.5, taxBurden: 30.0, hiddenCosts: 3200, riskLevel: 'Medium' },
'Pimpri-Chinchwad, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.74, costIncrease: 5.8, taxBurden: 30.0, hiddenCosts: 2800, riskLevel: 'Medium' },
        'Pimpri-Chinchwad': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.74, costIncrease: 5.8, taxBurden: 30.0, hiddenCosts: 2800, riskLevel: 'Medium' },
        'Patna, India': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.15, riskScore: 0.32, qualityScore: 0.62, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1800, riskLevel: 'Medium' },
        'Patna': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.15, riskScore: 0.32, qualityScore: 0.62, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1800, riskLevel: 'Medium' },
        'Ludhiana, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.27, qualityScore: 0.70, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'Medium' },
        'Ludhiana': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.27, qualityScore: 0.70, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'Medium' },
        'Agra, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.29, qualityScore: 0.68, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Agra': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.29, qualityScore: 0.68, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Meerut, India': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.16, riskScore: 0.30, qualityScore: 0.66, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Meerut': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.16, riskScore: 0.30, qualityScore: 0.66, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Kalyan-Dombivali, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.19, riskScore: 0.28, qualityScore: 0.70, costIncrease: 5.5, taxBurden: 30.0, hiddenCosts: 2800, riskLevel: 'Medium' },
        'Kalyan-Dombivali': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.19, riskScore: 0.28, qualityScore: 0.70, costIncrease: 5.5, taxBurden: 30.0, hiddenCosts: 2800, riskLevel: 'Medium' },
        'Vasai-Virar, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.71, costIncrease: 5.2, taxBurden: 30.0, hiddenCosts: 2700, riskLevel: 'Medium' },
        'Vasai-Virar': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.71, costIncrease: 5.2, taxBurden: 30.0, hiddenCosts: 2700, riskLevel: 'Medium' },
        'Varanasi, India': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.17, riskScore: 0.30, qualityScore: 0.67, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1900, riskLevel: 'Medium' },
        'Varanasi': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.17, riskScore: 0.30, qualityScore: 0.67, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1900, riskLevel: 'Medium' },
        'Srinagar, India': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.15, riskScore: 0.35, qualityScore: 0.65, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'High' },
        'Srinagar': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.15, riskScore: 0.35, qualityScore: 0.65, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'High' },
        'Aurangabad, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.70, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Aurangabad': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.70, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Dhanbad, India': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.14, riskScore: 0.32, qualityScore: 0.62, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 1700, riskLevel: 'Medium' },
        'Dhanbad': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.14, riskScore: 0.32, qualityScore: 0.62, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 1700, riskLevel: 'Medium' },
        'Amritsar, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.28, qualityScore: 0.70, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Amritsar': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.28, qualityScore: 0.70, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2100, riskLevel: 'Medium' },
        'Navi Mumbai, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.24, riskScore: 0.26, qualityScore: 0.76, costIncrease: 7.0, taxBurden: 30.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Navi Mumbai': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.24, riskScore: 0.26, qualityScore: 0.76, costIncrease: 7.0, taxBurden: 30.0, hiddenCosts: 3500, riskLevel: 'Medium' },
        'Allahabad, India': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.15, riskScore: 0.30, qualityScore: 0.65, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Allahabad': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.15, riskScore: 0.30, qualityScore: 0.65, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Prayagraj, India': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.15, riskScore: 0.30, qualityScore: 0.65, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Prayagraj': { wealthMultiplier1: 0.65, wealthMultiplier5: 1.15, riskScore: 0.30, qualityScore: 0.65, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Ranchi, India': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.17, riskScore: 0.29, qualityScore: 0.66, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1900, riskLevel: 'Medium' },
        'Ranchi': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.17, riskScore: 0.29, qualityScore: 0.66, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1900, riskLevel: 'Medium' },
        'Howrah, India': { wealthMultiplier1: 0.64, wealthMultiplier5: 1.14, riskScore: 0.30, qualityScore: 0.66, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'Medium' },
        'Howrah': { wealthMultiplier1: 0.64, wealthMultiplier5: 1.14, riskScore: 0.30, qualityScore: 0.66, costIncrease: 4.2, taxBurden: 30.0, hiddenCosts: 2200, riskLevel: 'Medium' },
        'Jabalpur, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.28, qualityScore: 0.68, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Jabalpur': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.28, qualityScore: 0.68, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Gwalior, India': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.16, riskScore: 0.29, qualityScore: 0.66, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 1750, riskLevel: 'Medium' },
        'Gwalior': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.16, riskScore: 0.29, qualityScore: 0.66, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 1750, riskLevel: 'Medium' },
        'Vijayawada, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.70, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2050, riskLevel: 'Medium' },
        'Vijayawada': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.70, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2050, riskLevel: 'Medium' },
        'Jodhpur, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.21, riskScore: 0.26, qualityScore: 0.69, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1900, riskLevel: 'Medium' },
        'Jodhpur': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.21, riskScore: 0.26, qualityScore: 0.69, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1900, riskLevel: 'Medium' },
        'Madurai, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.27, qualityScore: 0.70, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 1950, riskLevel: 'Medium' },
        'Madurai': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.27, qualityScore: 0.70, costIncrease: 3.8, taxBurden: 30.0, hiddenCosts: 1950, riskLevel: 'Medium' },
        'Raipur, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.69, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Raipur': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.20, riskScore: 0.27, qualityScore: 0.69, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Kota, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.70, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 1750, riskLevel: 'Medium' },
        'Kota': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.70, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 1750, riskLevel: 'Medium' },
        'Guwahati, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.28, qualityScore: 0.68, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Guwahati': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.28, qualityScore: 0.68, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2000, riskLevel: 'Medium' },
        'Solapur, India': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.19, riskScore: 0.27, qualityScore: 0.68, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Solapur': { wealthMultiplier1: 0.68, wealthMultiplier5: 1.19, riskScore: 0.27, qualityScore: 0.68, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Tiruchirappalli, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.27, qualityScore: 0.69, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Tiruchirappalli': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.27, qualityScore: 0.69, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Trichy, India': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.27, qualityScore: 0.69, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Trichy': { wealthMultiplier1: 0.67, wealthMultiplier5: 1.18, riskScore: 0.27, qualityScore: 0.69, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Bareilly, India': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.16, riskScore: 0.29, qualityScore: 0.66, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 1700, riskLevel: 'Medium' },
        'Bareilly': { wealthMultiplier1: 0.66, wealthMultiplier5: 1.16, riskScore: 0.29, qualityScore: 0.66, costIncrease: 3.2, taxBurden: 30.0, hiddenCosts: 1700, riskLevel: 'Medium' },
        'Tiruppur, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.21, riskScore: 0.26, qualityScore: 0.70, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Tiruppur': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.21, riskScore: 0.26, qualityScore: 0.70, costIncrease: 3.5, taxBurden: 30.0, hiddenCosts: 1850, riskLevel: 'Medium' },
        'Bhubaneswar, India': { wealthMultiplier1: 0.69, wealthMultiplier5: 1.22, riskScore: 0.26, qualityScore: 0.72, costIncrease: 4.0, taxBurden: 30.0, hiddenCosts: 2050, riskLevel: 'Medium' },
      };
      // ── Build final result from REST fallback (multi-city) ──────────────
      const bestCity = backendScenarios.reduce((best: any, curr: any) =>
        curr.year_5_wealth > best.year_5_wealth ? curr : best
      );
      const firstScenario = backendScenarios[0] || {};

      const mockResult = {
        scenarios: backendScenarios,
        compliance_summary: backendCompliance && Object.keys(backendCompliance).length > 0
          ? {
              ...backendCompliance,
              total_compliance_cost: backendCompliance.total_compliance_cost ?? Math.round(firstScenario.hidden_costs ?? 8000),
              visa_complexity: backendCompliance.visa_requirements ?? backendCompliance.visa_complexity ?? 'Skilled Worker',
              tax_treaty_benefits: backendCompliance.treaty_label ?? backendCompliance.tax_treaty_benefits ?? 'DTA applied',
              regulatory_timeline: backendCompliance.regulatory_timeline ?? '45-60 days',
            }
          : { visa_complexity: 'Medium', tax_treaty_benefits: '15% DTA relief', regulatory_timeline: '45-60 days', total_compliance_cost: 18500 },
        recommendations: [
          `${bestCity.location} offers the best 5-year trajectory — projected $${Math.round(bestCity.year_5_wealth).toLocaleString()}`,
          `Effective tax rate in ${firstScenario.location}: ${(firstScenario.tax_burden ?? 30).toFixed(1)}% (${firstScenario.tax_regime ?? 'Standard'})`,
          `DTA relief: ${((firstScenario.dta_relief ?? 0) * 100).toFixed(0)}% — saves $${Math.round((firstScenario.dta_relief ?? 0) * salary).toLocaleString()} annually`,
          `Monthly CoL is ${(firstScenario.cost_increase ?? 0) > 0 ? '+' : ''}${(firstScenario.cost_increase ?? 0).toFixed(1)}% vs your current city`,
          `Viability score: ${firstScenario.viability_score ?? 70}/100 — powered by Actuary • Fiscal Ghost • Nexus RAG`
        ],
        trust_score: {
          score: firstScenario.viability_score ?? 80,
          components: {
            payment_reliability: 90,
            financial_stability: Math.round((firstScenario.quality_score ?? 0.85) * 100),
            income_verification: 89,
            debt_management: 83
          }
        },
      };

      setSimulationData(mockResult);
      setShowResults(true);
      setActiveView('results');
    } catch (error) {
      console.error('Simulation failed:', error);
      toast.error('Simulation failed — check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (viewId: string) => {
    setActiveView(viewId);
    setSidebarOpen(false);
    // Don’t reset showResults when navigating to agent deep-dive views
    if (!['actuary', 'fiscal', 'nexus'].includes(viewId)) {
      setShowResults(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Load twins list when navigating to saved/history
    if (viewId === 'saved' || viewId === 'history') {
      loadTwins();
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <LoadingAnimation
          currentStep={currentStep}
          completedSteps={completedSteps}
          statusMessage={statusMessage}
          stepSubtexts={stepSubtexts}
        />
      );
    }

    // ── Backend offline state ───────────────────────────────────────────────
    if (showResults && simulationData?._backendOffline) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '24px', textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '64px' }}>⚡</div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>Backend Offline</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', maxWidth: '520px', lineHeight: 1.7 }}>
            The Equinox Nexus AI backend is not running. All 5 AI agents require the Python backend to generate real simulations.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '14px', padding: '20px 28px', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: '14px', color: '#a78bfa', textAlign: 'left' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}># Start the Python backend</div>
            <div>cd core</div>
            <div>uvicorn main:app --reload --port 8000</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { setShowResults(false); setActiveView('simulations'); }}
            style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '14px', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
          >
            Try Again
          </motion.button>
        </div>
      );
    }

    switch (activeView) {
      // ── Simulation Results Overview ──────────────────────────────────────
      case 'results':
        if (simulationData) {
          return <SimulationDashboard data={simulationData} onRerun={() => { setShowResults(false); setActiveView('simulations'); }} />;
        }
        return (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🧠</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>No simulation yet</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>Run a simulation to see your full Financial Twin report.</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('simulations')}
              style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
            >
              Start Simulation →
            </motion.button>
          </div>
        );

      // ── Simulation Form ──────────────────────────────────────────────────
      case 'simulations':
        return (
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>New Simulation</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Configure your global relocation analysis</p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.05) 100%)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(102,126,234,0.2)',
              borderRadius: '28px', padding: '40px'
            }}>
              <SimulationForm onSubmit={handleSimulation} isLoading={isLoading} />
            </div>
          </div>
        );

      // ── AI Intelligence Views ────────────────────────────────────────────
      case 'chronos':
        return <ChronosView data={simulationData} />;

      case 'xai':
        return <XAIView data={simulationData} />;

      case 'eval':
        return <EvaluationView data={simulationData} />;

      case 'decision': {
        const di = simulationData?.decision_intelligence || simulationData?.rawResults?.decision_intelligence || {};
        const score = di.llm_viability_score;
        const reasoning = di.llm_reasoning || '';
        const model = di.model_used || 'Groq llama-3.3-70b-versatile';
        const scoreColor = score >= 75 ? '#10b981' : score >= 55 ? '#eab308' : '#ef4444';
        return (
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '50px', padding: '8px 20px', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px' }}>⚡</span>
                <span style={{ color: '#22d3ee', fontSize: '13px', fontWeight: 600 }}>{model}</span>
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Decision Intelligence</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>LLM-synthesized verdict on your relocation viability</p>
            </div>
            {!di || !reasoning ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>⚡</span>
                <h3 style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '8px' }}>No DI data yet</h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Run a simulation to see the Groq LLM decision synthesis</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Score Card */}
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', marginBottom: '24px', alignItems: 'stretch' }}>
                  <div style={{ background: `linear-gradient(135deg, ${scoreColor}15 0%, rgba(15,15,30,0.95) 100%)`, border: `1px solid ${scoreColor}30`, borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{score?.toFixed(0) ?? '—'}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>/ 100</div>
                    <div style={{ marginTop: '12px', padding: '6px 16px', background: `${scoreColor}20`, borderRadius: '20px', fontSize: '13px', color: scoreColor, fontWeight: 700 }}>
                      {score >= 75 ? 'Highly Viable' : score >= 55 ? 'Moderately Viable' : 'Challenging'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '10px' }}>LLM Viability Score</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
                      LLM Reasoning
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', lineHeight: 1.8 }}>
                      {reasoning || 'No reasoning available.'}
                    </p>
                  </div>
                </div>
                <div style={{ padding: '12px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>🤖 Model: {model}</span>
                </div>
              </motion.div>
            )}
          </div>
        );
      }

      // ── Agent Deep-Dive Views ────────────────────────────────────────────
      case 'actuary':
        return <ActuaryView data={simulationData} />;

      case 'fiscal':
        return <FiscalView data={simulationData} />;

      case 'payroll':
        return <PayrollIntelView />;

      case 'nexus':
        return <NexusView data={simulationData} />;

      // ── Globe View ───────────────────────────────────────────────────────
      case 'globe':
        return (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Global Opportunity Map</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Click any city to run an instant AI simulation</p>
            </div>
            <InteractiveGlobe onRunAnalysis={(cityName: string, country: string) => {
              toast.success(`Starting analysis for ${cityName}, ${country}...`, { duration: 2000 });
              handleSimulation({ current_salary: 95000, target_locations: [`${cityName}, ${country}`], risk_tolerance: 'moderate' });
            }} />
          </>
        );

      // ── Saved Twins ──────────────────────────────────────────────────────
      case 'saved':
      case 'history':
        return (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                {activeView === 'saved' ? 'Saved Twins' : 'Simulation History'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Your Financial Digital Twin records</p>
            </div>
            {twinsLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.5)' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⏳</div>
                <p>Loading twins from backend...</p>
              </div>
            ) : savedTwins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🧬</div>
                <h3 style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '8px' }}>No twins yet</h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', marginBottom: '24px' }}>Run a simulation to create your first Financial Digital Twin</p>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveView('simulations')}
                  style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                >
                  Create Your Twin →
                </motion.button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {savedTwins.map((twin: any, i: number) => (
                  <motion.div
                    key={twin.twin_id || i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.08) 0%, rgba(15,15,30,0.95) 100%)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: '20px', padding: '24px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🧬</div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '3px' }}>
                            Twin {twin.twin_id || `#${i + 1}`}
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            {twin.total_simulations ?? 0} simulation{(twin.total_simulations ?? 0) !== 1 ? 's' : ''} · Last: {twin.last_simulation ?? twin.best_city ?? '—'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {twin.best_city && (
                          <div style={{ padding: '6px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', fontSize: '12px', color: '#4ade80', fontWeight: 600 }}>
                            Best: {twin.best_city}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                          {twin.last_updated ? new Date(twin.last_updated).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      // ── Profile ──────────────────────────────────────────────────────────
      case 'profile':
        return (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Profile</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Your Financial Twin configuration</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { label: 'Name', value: profileData.name, key: 'name' },
                { label: 'Email', value: profileData.email, key: 'email' },
                { label: 'Location', value: profileData.location, key: 'location' },
                { label: 'Annual Income', value: profileData.income, key: 'income' },
                { label: 'Currency', value: profileData.currency, key: 'currency' },
                { label: 'Target Cities', value: profileData.targetCities, key: 'targetCities' },
              ].map(field => (
                <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</label>
                  <input
                    value={field.value}
                    onChange={e => setProfileData((p: any) => ({ ...p, [field.key]: e.target.value }))}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(102,126,234,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
              ))}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => toast.success('Profile saved!')}
                style={{ padding: '14px', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '15px', marginTop: '8px' }}
              >
                Save Profile
              </motion.button>
            </div>
          </div>
        );

      // ── Settings ─────────────────────────────────────────────────────────
      case 'settings':
        return (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Settings</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Configure your Equinox Nexus preferences</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'darkMode', label: 'Dark Mode', sub: 'Always on for optimal readability' },
                { key: 'emailNotifications', label: 'Email Notifications', sub: 'Twin drift alerts and reports' },
                { key: 'agentAlerts', label: 'Agent Alerts', sub: 'FX threshold monitoring notifications' },
                { key: 'dataEncryption', label: 'Data Encryption', sub: 'All profile data encrypted at rest' },
                { key: 'anonymousAnalytics', label: 'Anonymous Analytics', sub: 'Help improve the platform' },
              ].map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px 20px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>{s.label}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{s.sub}</div>
                  </div>
                  <div
                    onClick={() => setSettings((prev: any) => ({ ...prev, [s.key]: !prev[s.key] }))}
                    style={{
                      width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                      background: settings[s.key] ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.12)',
                      position: 'relative', transition: 'background 0.25s'
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                      position: 'absolute', top: '3px', transition: 'left 0.25s',
                      left: settings[s.key] ? '23px' : '3px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ── Help ─────────────────────────────────────────────────────────────
      case 'help':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Help & Documentation</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Everything you need to know about Equinox Nexus</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {[
                { icon: '🧠', title: 'How Agents Work', desc: 'Actuary, Fiscal Ghost, Nexus, Chronos, and Decision Intelligence run in a parallel LangGraph pipeline. Each agent specialises in one dimension of your relocation.', color: '#667eea' },
                { icon: '📊', title: 'Monte Carlo Simulation', desc: 'Chronos runs 1,000 GBM paths with Prophet-forecast FX drift to produce P5/P50/P95 wealth bands over 5 years.', color: '#10b981' },
                { icon: '⚖️', title: 'Tax Treaty (DTA)', desc: 'The Nexus queries a RAG knowledge base built from OECD data to find applicable double taxation agreements and calculate your actual tax burden.', color: '#a855f7' },
                { icon: '🧬', title: 'Financial Twins', desc: 'Each simulation creates a persistent Financial Digital Twin stored in SQLite. Your twin accumulates history and detects drift when FX rates shift.', color: '#3b82f6' },
                { icon: '🔍', title: 'XAI Factor Analysis', desc: 'The SHAP-inspired factor decomposition explains exactly how each dimension (Tax, QoL, CoL, FX, Savings) contributed to your viability score.', color: '#f59e0b' },
                { icon: '⚡', title: 'Quick Start', desc: 'Go to New Simulation, enter your income and target cities, click Run. All 5 agents execute in parallel and stream results back in real time via SSE.', color: '#06b6d4' },
              ].map((item, i) => (
                <div key={i} style={{ background: `linear-gradient(135deg, ${item.color}10 0%, rgba(15,15,30,0.95) 100%)`, border: `1px solid ${item.color}25`, borderRadius: '20px', padding: '24px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>{item.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: '#f59e0b' }}>⚠️ Disclaimer:</strong> Projections are AI-generated estimates for planning purposes only. Tax calculations use current treaty rates which may change. Consult qualified financial and legal professionals before making relocation decisions.
              </p>
            </div>
          </div>
        );

      // ── Dashboard (default) ──────────────────────────────────────────────
      case 'dashboard':
      default:
        return (
          <>
            <HeroSection />
            <div style={{ marginTop: '60px', maxWidth: '1100px', margin: '60px auto 0' }}>
              {/* Agent Status Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '48px' }}>
                {[
                  { icon: '🧠', name: 'The Actuary', sub: 'QoL & Health Risk', color: '#10b981', status: 'Ready' },
                  { icon: '💸', name: 'Fiscal Ghost', sub: 'Expense Model (XGBoost)', color: '#f59e0b', status: 'Ready' },
                  { icon: '⚖️', name: 'The Nexus', sub: 'RAG + Tax Treaty', color: '#a855f7', status: 'Ready' },
                  { icon: '📊', name: 'Chronos', sub: 'Monte Carlo 1K paths', color: '#3b82f6', status: 'Ready' },
                  { icon: '⚡', name: 'Decision AI', sub: 'Groq llama-3.3-70b', color: '#06b6d4', status: 'Ready' },
                ].map((agent, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{ background: `linear-gradient(135deg, ${agent.color}10 0%, rgba(15,15,30,0.9) 100%)`, border: `1px solid ${agent.color}25`, borderRadius: '16px', padding: '18px 16px' }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{agent.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '3px' }}>{agent.name}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>{agent.sub}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: agent.color }} />
                      <span style={{ fontSize: '11px', color: agent.color, fontWeight: 600 }}>{agent.status}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Globe + Simulation Form */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Global Opportunity Map</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>Click a city on the globe or fill the form below to run your AI simulation</p>
              </div>
              <InteractiveGlobe onRunAnalysis={(cityName: string, country: string) => {
                toast.success(`Starting analysis for ${cityName}, ${country}...`, { duration: 2000 });
                handleSimulation({ current_salary: 95000, target_locations: [`${cityName}, ${country}`], risk_tolerance: 'moderate' });
              }} />
              <div style={{ marginTop: '60px', background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: '28px', padding: '40px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Configure Your Simulation</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '32px' }}>Enter your details and let 5 AI agents analyse your relocation in real time</p>
                <SimulationForm onSubmit={handleSimulation} isLoading={isLoading} />
              </div>
            </div>
          </>
        );
    }
  };


  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(26, 26, 46, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
          },
        }}
      />
      
      <HamburgerMenu 
        isOpen={sidebarOpen} 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
        activeView={activeView}
        hasSimulationData={!!simulationData}
      />
      
      <main style={{ 
        minHeight: '100vh', 
        position: 'relative', 
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)'
      }}>
        {/* Animated Background Orbs */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <motion.div 
            animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-5%',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
              filter: 'blur(60px)'
            }}
          />
          <motion.div 
            animate={{ y: [0, 40, 0], x: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            style={{
              position: 'absolute',
              top: '40%',
              right: '-10%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
              filter: 'blur(60px)'
            }}
          />
          <motion.div 
            animate={{ y: [0, -25, 0], x: [0, 25, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            style={{
              position: 'absolute',
              bottom: '-5%',
              left: '30%',
              width: '350px',
              height: '350px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
              filter: 'blur(60px)'
            }}
          />
        </div>

        {/* Grid Pattern Overlay */}
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)'
        }} />

        {/* Main Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 60px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView + (showResults ? '-results' : '')}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <footer style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            marginTop: '80px'
          }}>
            <div style={{ 
              maxWidth: '1200px', 
              margin: '0 auto', 
              padding: '32px 24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Equinox</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Nexus</span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                © 2026 Equinox Nexus. Agentic Financial Digital Twin.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {['Privacy', 'Terms', 'Contact'].map(link => (
                  <a 
                    key={link}
                    href="#" 
                    style={{ 
                      fontSize: '14px', 
                      color: 'rgba(255,255,255,0.4)', 
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </footer>
        </div>

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {(showResults || activeView !== 'dashboard') && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNavigate('dashboard')}
              style={{
                position: 'fixed',
                bottom: '32px',
                right: '32px',
                padding: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                zIndex: 50
              }}
            >
              <svg style={{ width: '20px', height: '20px', color: 'white' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditProfile(false)}
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
                  maxWidth: '500px',
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
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                      Edit Profile
                    </h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                      Update your personal information
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEditProfile(false)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      color: 'white'
                    }}
                  >
                    <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </motion.button>
                </div>

                {/* Form */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData((prev: any) => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData((prev: any) => ({ ...prev, email: e.target.value }))}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                      Current Location
                    </label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData((prev: any) => ({ ...prev, location: e.target.value }))}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                      Annual Income (USD)
                    </label>
                    <input
                      type="number"
                      value={profileData.income}
                      onChange={(e) => setProfileData((prev: any) => ({ ...prev, income: e.target.value }))}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                      Target Cities (comma separated)
                    </label>
                    <input
                      type="text"
                      value={profileData.targetCities}
                      onChange={(e) => setProfileData((prev: any) => ({ ...prev, targetCities: e.target.value }))}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                      placeholder="Berlin, Tokyo, Singapore"
                    />
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
                    onClick={() => setShowEditProfile(false)}
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
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowEditProfile(false);
                      toast.success('Profile updated successfully!', { icon: '✅' });
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
                    Save Changes
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Disclaimer Footer */}
        <footer style={{
          marginTop: '60px',
          padding: '32px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px' }}>
            {/* Data Sources */}
            <div style={{ flex: '1', minWidth: '280px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📊</span> Data Sources
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { name: 'Numbeo', type: 'Cost of Living' },
                  { name: 'OECD', type: 'Tax Data' },
                  { name: 'Mercer', type: 'Quality of Life' },
                  { name: 'WHO', type: 'Health Data' },
                  { name: 'XE.com', type: 'Currency' },
                  { name: 'IEA', type: 'Energy Data' },
                ].map((source, i) => (
                  <span key={i} style={{
                    padding: '6px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{source.name}</strong> • {source.type}
                  </span>
                ))}
              </div>
            </div>

            {/* Methodology */}
            <div style={{ flex: '1', minWidth: '280px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🔬</span> Methodology
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  'Monte Carlo (10K iterations)',
                  'Federated Learning',
                  'NER + LayoutLM',
                  'CLIR Embeddings',
                  'K-Means Clustering',
                ].map((method, i) => (
                  <span key={i} style={{
                    padding: '6px 12px',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#a78bfa',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                  }}>
                    {method}
                  </span>
                ))}
              </div>
            </div>

            {/* Compliance */}
            <div style={{ flex: '0 0 auto' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🔒</span> Compliance
              </h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { label: 'GDPR', color: '#10b981' },
                  { label: 'SOC 2', color: '#3b82f6' },
                  { label: 'ISO 27001', color: '#8b5cf6' },
                ].map((badge, i) => (
                  <div key={i} style={{
                    padding: '8px 14px',
                    background: `${badge.color}15`,
                    borderRadius: '8px',
                    border: `1px solid ${badge.color}30`,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: badge.color
                  }}>
                    ✓ {badge.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: '#f59e0b' }}>⚠️ Disclaimer:</strong> Projections are based on historical data and Monte Carlo simulations. 
              Tax calculations use current treaty rates which may change. Cost of living data is aggregated from multiple sources with regional adjustments. 
              This tool provides estimates for planning purposes only and should not be considered financial or legal advice. 
              Consult qualified professionals before making relocation decisions. Past performance does not guarantee future results.
            </p>
          </div>

          {/* Copyright */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
              © 2026 Equinox Nexus • Built for DUHacks 5.0 • Powered by AI Agents
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
