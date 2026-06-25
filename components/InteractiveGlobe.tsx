'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingUp, Shield, DollarSign, X, Plane, Users, Play } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '500px',
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
      borderRadius: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(255,255,255,0.5)'
    }}>
      Loading map...
    </div>
  )
});

interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  growthPotential: number;
  riskLevel: number;
  taxBurden: number;
  costOfLiving: number;
  qualityOfLife: number;
  color: string;
}

const cities: City[] = [
  { id: '1', name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, growthPotential: 92, riskLevel: 15, taxBurden: 18, costOfLiving: 85, qualityOfLife: 94, color: '#10b981' },
  { id: '2', name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, growthPotential: 88, riskLevel: 22, taxBurden: 0, costOfLiving: 72, qualityOfLife: 87, color: '#f59e0b' },
  { id: '3', name: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393, growthPotential: 78, riskLevel: 18, taxBurden: 28, costOfLiving: 45, qualityOfLife: 89, color: '#8b5cf6' },
  { id: '4', name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050, growthPotential: 82, riskLevel: 12, taxBurden: 42, costOfLiving: 58, qualityOfLife: 91, color: '#3b82f6' },
  { id: '5', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, growthPotential: 75, riskLevel: 10, taxBurden: 35, costOfLiving: 78, qualityOfLife: 95, color: '#ec4899' },
  { id: '6', name: 'Austin', country: 'USA', lat: 30.2672, lng: -97.7431, growthPotential: 90, riskLevel: 20, taxBurden: 25, costOfLiving: 65, qualityOfLife: 88, color: '#06b6d4' },
  { id: '7', name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, growthPotential: 80, riskLevel: 16, taxBurden: 40, costOfLiving: 82, qualityOfLife: 90, color: '#f43f5e' },
  { id: '8', name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, growthPotential: 85, riskLevel: 14, taxBurden: 32, costOfLiving: 75, qualityOfLife: 93, color: '#14b8a6' },
  { id: '9', name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041, growthPotential: 79, riskLevel: 11, taxBurden: 38, costOfLiving: 70, qualityOfLife: 92, color: '#a855f7' },
  { id: '10', name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, growthPotential: 83, riskLevel: 13, taxBurden: 33, costOfLiving: 68, qualityOfLife: 91, color: '#22c55e' },
];

interface InteractiveGlobeProps {
  onRunAnalysis?: (cityName: string, country: string) => void;
}

export function InteractiveGlobe({ onRunAnalysis }: InteractiveGlobeProps) {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      {/* Map Container */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(102, 126, 234, 0.2)',
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <MapComponent 
          cities={cities}
          selectedCity={selectedCity}
          onCitySelect={setSelectedCity}
          hoveredCity={hoveredCity}
          onCityHover={setHoveredCity}
        />

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(15, 15, 30, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          padding: '12px 16px',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>High Growth</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>Medium Growth</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>Low Risk</span>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          gap: '12px',
          zIndex: 1000
        }}>
          {[
            { icon: MapPin, value: '10', label: 'Cities' },
            { icon: Plane, value: '45', label: 'Routes' },
            { icon: Users, value: '128M', label: 'Population' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(15, 15, 30, 0.9)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '12px 16px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
              minWidth: '70px'
            }}>
              <stat.icon style={{ width: '16px', height: '16px', color: '#a78bfa', margin: '0 auto 4px' }} />
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* City Detail Modal */}
      <AnimatePresence>
        {selectedCity && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '320px',
              background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.98) 0%, rgba(30, 20, 60, 0.98) 100%)',
              backdropFilter: 'blur(24px)',
              borderRadius: '20px',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              overflow: 'hidden',
              zIndex: 1001,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px',
              background: `linear-gradient(135deg, ${selectedCity.color}20 0%, transparent 100%)`,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              position: 'relative'
            }}>
              <button
                onClick={() => setSelectedCity(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${selectedCity.color}30`,
                  border: `2px solid ${selectedCity.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin style={{ width: '24px', height: '24px', color: selectedCity.color }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>
                    {selectedCity.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                    {selectedCity.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Growth Potential', value: selectedCity.growthPotential, icon: TrendingUp, color: '#10b981' },
                  { label: 'Risk Level', value: selectedCity.riskLevel, icon: Shield, color: '#f59e0b', inverse: true },
                  { label: 'Tax Burden', value: selectedCity.taxBurden, icon: DollarSign, color: '#8b5cf6' },
                  { label: 'Quality of Life', value: selectedCity.qualityOfLife, icon: Users, color: '#3b82f6' }
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    padding: '14px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <stat.icon style={{ width: '14px', height: '14px', color: stat.color }} />
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        flex: 1,
                        height: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.inverse ? 100 - stat.value : stat.value}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          style={{
                            height: '100%',
                            background: stat.color,
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'white', minWidth: '32px' }}>
                        {stat.value}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost of Living */}
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Cost of Living Index</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#a78bfa' }}>{selectedCity.costOfLiving}</span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedCity.costOfLiving}%` }}
                    transition={{ duration: 0.8 }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (onRunAnalysis && selectedCity) {
                    onRunAnalysis(selectedCity.name, selectedCity.country);
                  }
                }}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Play style={{ width: '16px', height: '16px' }} />
                Run Full Analysis for {selectedCity.name}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
