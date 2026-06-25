'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MapPin, Coffee, Train, Home, Leaf, Music, Dumbbell,
  Search, Sparkles, ChevronDown, Star, TrendingUp, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LifestyleFeatures {
  walkability: number;
  coffeeScene: number;
  nightlife: number;
  greenSpaces: number;
  publicTransit: number;
  gymAccess: number;
  artsCulture: number;
  foodDiversity: number;
  rentAffordability: number;
  safety: number;
}

interface NeighborhoodMatch {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  similarity: number;
  features: LifestyleFeatures;
  avgRent: number;
  currency: string;
  highlights: string[];
  vibeDescription: string;
}

const sourceNeighborhoods: { name: string; city: string; features: LifestyleFeatures }[] = [
  { name: 'Williamsburg', city: 'Brooklyn, NY', features: { walkability: 92, coffeeScene: 95, nightlife: 88, greenSpaces: 65, publicTransit: 85, gymAccess: 90, artsCulture: 94, foodDiversity: 92, rentAffordability: 25, safety: 72 } },
  { name: 'Shoreditch', city: 'London, UK', features: { walkability: 94, coffeeScene: 92, nightlife: 90, greenSpaces: 55, publicTransit: 95, gymAccess: 85, artsCulture: 96, foodDiversity: 90, rentAffordability: 20, safety: 68 } },
  { name: 'Le Marais', city: 'Paris, FR', features: { walkability: 96, coffeeScene: 88, nightlife: 82, greenSpaces: 45, publicTransit: 92, gymAccess: 70, artsCulture: 98, foodDiversity: 85, rentAffordability: 15, safety: 75 } },
  { name: 'Shibuya', city: 'Tokyo, JP', features: { walkability: 90, coffeeScene: 85, nightlife: 95, greenSpaces: 40, publicTransit: 98, gymAccess: 88, artsCulture: 85, foodDiversity: 95, rentAffordability: 30, safety: 95 } },
];

const globalMatches: NeighborhoodMatch[] = [
  { id: '1', name: 'Kreuzberg', city: 'Berlin', country: 'Germany', countryCode: 'DE', similarity: 94.2, features: { walkability: 91, coffeeScene: 93, nightlife: 92, greenSpaces: 72, publicTransit: 94, gymAccess: 82, artsCulture: 95, foodDiversity: 91, rentAffordability: 55, safety: 70 }, avgRent: 1450, currency: '€', highlights: ['Vibrant street art scene', 'Turkish food corridor', '24/7 nightlife'], vibeDescription: 'Creative, multicultural, edgy. The Brooklyn of Berlin with better transit and lower rent.' },
  { id: '2', name: 'Shimokitazawa', city: 'Tokyo', country: 'Japan', countryCode: 'JP', similarity: 89.7, features: { walkability: 88, coffeeScene: 90, nightlife: 75, greenSpaces: 55, publicTransit: 95, gymAccess: 72, artsCulture: 92, foodDiversity: 85, rentAffordability: 45, safety: 96 }, avgRent: 145000, currency: '¥', highlights: ['Vintage shopping paradise', 'Live music venues', 'Indie theater scene'], vibeDescription: 'Bohemian Tokyo. Narrow streets, vinyl shops, and the best thrift stores in Asia.' },
  { id: '3', name: 'Gracia', city: 'Barcelona', country: 'Spain', countryCode: 'ES', similarity: 87.3, features: { walkability: 94, coffeeScene: 86, nightlife: 80, greenSpaces: 68, publicTransit: 88, gymAccess: 75, artsCulture: 88, foodDiversity: 82, rentAffordability: 40, safety: 78 }, avgRent: 1200, currency: '€', highlights: ['Village feel in the city', 'Plaza culture', 'Modernist architecture'], vibeDescription: 'Mediterranean Brooklyn. Artsy, local, with amazing plazas for people-watching.' },
  { id: '4', name: 'Fitzroy', city: 'Melbourne', country: 'Australia', countryCode: 'AU', similarity: 91.5, features: { walkability: 90, coffeeScene: 98, nightlife: 85, greenSpaces: 70, publicTransit: 82, gymAccess: 88, artsCulture: 90, foodDiversity: 88, rentAffordability: 35, safety: 80 }, avgRent: 2100, currency: 'A$', highlights: ['World-class coffee', 'Street art laneways', 'Live music capital'], vibeDescription: 'If Williamsburg moved to Australia and got really into coffee. Hipster paradise.' },
  { id: '5', name: 'Príncipe Real', city: 'Lisbon', country: 'Portugal', countryCode: 'PT', similarity: 85.8, features: { walkability: 85, coffeeScene: 82, nightlife: 78, greenSpaces: 75, publicTransit: 80, gymAccess: 70, artsCulture: 85, foodDiversity: 78, rentAffordability: 50, safety: 82 }, avgRent: 1100, currency: '€', highlights: ['Botanical garden views', 'LGBTQ+ friendly', 'Antique markets'], vibeDescription: 'Elegant bohemian. Tree-lined streets, vintage shops, and sunset viewpoints.' },
];

export function LifestyleTwins() {
  const [selectedSource, setSelectedSource] = useState(sourceNeighborhoods[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<NeighborhoodMatch[] | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [featureWeights, setFeatureWeights] = useState({
    coffeeScene: 1,
    nightlife: 1,
    greenSpaces: 1,
    publicTransit: 1,
    rentAffordability: 1,
  });

  const findTwins = () => {
    setIsSearching(true);
    setResults(null);

    setTimeout(() => {
      // Sort by similarity (in real app, would recalculate based on weights)
      const sorted = [...globalMatches].sort((a, b) => b.similarity - a.similarity);
      setResults(sorted);
      setIsSearching(false);
      toast.success(`Found ${sorted.length} lifestyle twins worldwide!`, { icon: '🌍' });
    }, 2000);
  };

  const featureIcons: Record<string, any> = {
    walkability: MapPin,
    coffeeScene: Coffee,
    nightlife: Music,
    greenSpaces: Leaf,
    publicTransit: Train,
    gymAccess: Dumbbell,
    artsCulture: Star,
    foodDiversity: Globe,
    rentAffordability: Home,
    safety: Users,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '16px' }}>
          <Users style={{ width: '16px', height: '16px', color: '#10b981' }} />
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>K-Means Lifestyle Clustering</span>
        </motion.div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
          Find Your Lifestyle Twins
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>
          Discover neighborhoods worldwide that match your current vibe
        </p>
      </div>

      {/* Source Neighborhood Selector */}
      <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', borderRadius: '20px', padding: '24px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px', display: 'block' }}>Your Current Neighborhood</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {sourceNeighborhoods.map((n) => (
            <motion.div key={n.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedSource(n)}
              style={{
                padding: '16px', background: selectedSource.name === n.name ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${selectedSource.name === n.name ? '#10b981' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '12px', cursor: 'pointer', textAlign: 'center'
              }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>{n.name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{n.city}</div>
            </motion.div>
          ))}
        </div>

        {/* Feature Weights */}
        <div style={{ marginTop: '24px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', display: 'block' }}>Prioritize Features (adjust importance)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {Object.entries(featureWeights).map(([key, value]) => {
              const Icon = featureIcons[key];
              return (
                <div key={key} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Icon style={{ width: '14px', height: '14px', color: '#a78bfa' }} />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                  </div>
                  <input type="range" min="0" max="2" step="0.5" value={value}
                    onChange={(e) => setFeatureWeights(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                    style={{ width: '100%', height: '4px', borderRadius: '2px', cursor: 'pointer' }} />
                </div>
              );
            })}
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={findTwins} disabled={isSearching}
          style={{ width: '100%', marginTop: '24px', padding: '16px', background: isSearching ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: 600, cursor: isSearching ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          {isSearching ? <><Search style={{ width: '18px', height: '18px', animation: 'pulse 1s infinite' }} /> Clustering neighborhoods...</> : <><Sparkles style={{ width: '18px', height: '18px' }} /> Find My Lifestyle Twins</>}
        </motion.button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>
                Top Matches for {selectedSource.name}
              </h3>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Sorted by lifestyle similarity</span>
            </div>

            {results.map((match, i) => (
              <motion.div key={match.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', borderRadius: '20px', border: '1px solid rgba(102, 126, 234, 0.2)', overflow: 'hidden' }}>
                <div onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                  style={{ padding: '20px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: 'white' }}>
                        #{i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{match.name}</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                          {match.city}, {match.country} {match.countryCode === 'DE' && '🇩🇪'}{match.countryCode === 'JP' && '🇯🇵'}{match.countryCode === 'ES' && '🇪🇸'}{match.countryCode === 'AU' && '🇦🇺'}{match.countryCode === 'PT' && '🇵🇹'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{match.similarity}%</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>match</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>{match.currency}{match.avgRent.toLocaleString()}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>avg rent/mo</div>
                      </div>
                      <ChevronDown style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.4)', transform: expandedMatch === match.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedMatch === match.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* Vibe Description */}
                        <div style={{ padding: '16px', marginTop: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{match.vibeDescription}"</p>
                        </div>

                        {/* Highlights */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                          {match.highlights.map((h, j) => (
                            <span key={j} style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px', color: '#a78bfa' }}>✨ {h}</span>
                          ))}
                        </div>

                        {/* Feature Comparison */}
                        <div style={{ marginTop: '20px' }}>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>Feature Comparison vs {selectedSource.name}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                            {(['coffeeScene', 'nightlife', 'greenSpaces', 'publicTransit', 'rentAffordability'] as const).map((feature) => {
                              const Icon = featureIcons[feature];
                              const diff = match.features[feature] - selectedSource.features[feature];
                              return (
                                <div key={feature} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                                  <Icon style={{ width: '16px', height: '16px', color: '#a78bfa', margin: '0 auto 8px' }} />
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>{match.features[feature]}</div>
                                  <div style={{ fontSize: '10px', color: diff >= 0 ? '#10b981' : '#ef4444' }}>
                                    {diff >= 0 ? '+' : ''}{diff}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
