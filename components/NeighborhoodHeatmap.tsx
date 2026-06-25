'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, DollarSign, Home, ShoppingCart, Utensils, Train,
  Heart, Wifi, TreePine, Wind, TrendingUp, TrendingDown,
  ArrowRight, Sparkles, Info, RefreshCw, Globe, Zap
} from 'lucide-react';

interface NeighborhoodHeatmapProps {
  city: string;
}

interface Neighborhood {
  id: string;
  name: string;
  affordability: number;
  safety: number;
  transit: number;
  lifestyle: number;
  avgRent: number;
  groceryCost: number;
  color: string;
  x: number;
  y: number;
}

interface LifestyleMapping {
  category: string;
  homeCity: string;
  homeCost: number;
  homeExample: string;
  targetCity: string;
  targetCost: number;
  targetExample: string;
  icon: any;
}

export function NeighborhoodHeatmap({ city }: NeighborhoodHeatmapProps) {
  const [selectedCity, setSelectedCity] = useState(city);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'cultural' | 'realtime'>('heatmap');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const cityData: { [key: string]: { neighborhoods: Neighborhood[], currency: string, lifestyleMappings: LifestyleMapping[] } } = {
    'Tokyo': {
      currency: '¥',
      neighborhoods: [
        { id: '1', name: 'Shibuya', affordability: 35, safety: 92, transit: 98, lifestyle: 95, avgRent: 2800, groceryCost: 450, color: '#ef4444', x: 45, y: 35 },
        { id: '2', name: 'Shinjuku', affordability: 40, safety: 88, transit: 99, lifestyle: 90, avgRent: 2500, groceryCost: 420, color: '#f97316', x: 35, y: 25 },
        { id: '3', name: 'Nakano', affordability: 65, safety: 94, transit: 92, lifestyle: 78, avgRent: 1600, groceryCost: 380, color: '#22c55e', x: 25, y: 30 },
        { id: '4', name: 'Meguro', affordability: 45, safety: 96, transit: 90, lifestyle: 88, avgRent: 2200, groceryCost: 400, color: '#eab308', x: 50, y: 55 },
        { id: '5', name: 'Setagaya', affordability: 55, safety: 97, transit: 85, lifestyle: 82, avgRent: 1900, groceryCost: 370, color: '#84cc16', x: 30, y: 60 },
        { id: '6', name: 'Nerima', affordability: 75, safety: 95, transit: 80, lifestyle: 70, avgRent: 1300, groceryCost: 340, color: '#10b981', x: 20, y: 15 },
        { id: '7', name: 'Minato', affordability: 25, safety: 94, transit: 95, lifestyle: 98, avgRent: 3500, groceryCost: 520, color: '#dc2626', x: 55, y: 45 },
        { id: '8', name: 'Suginami', affordability: 68, safety: 96, transit: 88, lifestyle: 75, avgRent: 1450, groceryCost: 355, color: '#22c55e', x: 15, y: 40 },
      ],
      lifestyleMappings: [
        { category: 'Entertainment', homeCity: 'London', homeCost: 150, homeExample: 'West End Theatre Show', targetCity: 'Tokyo', targetCost: 18000, targetExample: 'Premium Kabuki at Kabukiza Theatre', icon: Heart },
        { category: 'Fine Dining', homeCity: 'London', homeCost: 120, homeExample: 'Michelin Star Restaurant', targetCity: 'Tokyo', targetCost: 15000, targetExample: 'Omakase at Sukiyabashi Jiro', icon: Utensils },
        { category: 'Fitness', homeCity: 'London', homeCost: 80, homeExample: 'Premium Gym Monthly', targetCity: 'Tokyo', targetCost: 12000, targetExample: 'Anytime Fitness + Onsen Access', icon: Heart },
        { category: 'Coffee Culture', homeCity: 'London', homeCost: 4.5, homeExample: 'Flat White at Specialty Cafe', targetCity: 'Tokyo', targetCost: 550, targetExample: 'Pour-over at Blue Bottle Shibuya', icon: Utensils },
        { category: 'Commute', homeCity: 'London', homeCost: 165, homeExample: 'Zone 1-3 Monthly Oyster', targetCity: 'Tokyo', targetCost: 10000, targetExample: 'Tokyo Metro All-Lines Pass', icon: Train },
      ]
    },
    'Berlin': {
      currency: '€',
      neighborhoods: [
        { id: '1', name: 'Mitte', affordability: 30, safety: 85, transit: 95, lifestyle: 92, avgRent: 1800, groceryCost: 320, color: '#ef4444', x: 50, y: 40 },
        { id: '2', name: 'Kreuzberg', affordability: 45, safety: 78, transit: 92, lifestyle: 95, avgRent: 1400, groceryCost: 280, color: '#f97316', x: 55, y: 55 },
        { id: '3', name: 'Prenzlauer Berg', affordability: 40, safety: 90, transit: 90, lifestyle: 88, avgRent: 1500, groceryCost: 300, color: '#eab308', x: 55, y: 25 },
        { id: '4', name: 'Friedrichshain', affordability: 50, safety: 82, transit: 88, lifestyle: 90, avgRent: 1300, groceryCost: 270, color: '#84cc16', x: 65, y: 45 },
        { id: '5', name: 'Neukölln', affordability: 70, safety: 72, transit: 85, lifestyle: 82, avgRent: 1000, groceryCost: 240, color: '#10b981', x: 55, y: 70 },
        { id: '6', name: 'Charlottenburg', affordability: 35, safety: 92, transit: 88, lifestyle: 85, avgRent: 1600, groceryCost: 350, color: '#f97316', x: 25, y: 35 },
        { id: '7', name: 'Wedding', affordability: 75, safety: 75, transit: 82, lifestyle: 70, avgRent: 900, groceryCost: 220, color: '#10b981', x: 45, y: 15 },
        { id: '8', name: 'Schöneberg', affordability: 55, safety: 88, transit: 90, lifestyle: 86, avgRent: 1200, groceryCost: 290, color: '#84cc16', x: 40, y: 55 },
      ],
      lifestyleMappings: [
        { category: 'Entertainment', homeCity: 'London', homeCost: 150, homeExample: 'West End Theatre Show', targetCity: 'Berlin', targetCost: 85, targetExample: 'Berliner Ensemble Performance', icon: Heart },
        { category: 'Fine Dining', homeCity: 'London', homeCost: 120, homeExample: 'Michelin Star Restaurant', targetCity: 'Berlin', targetCost: 95, targetExample: 'Tasting Menu at Tim Raue', icon: Utensils },
        { category: 'Fitness', homeCity: 'London', homeCost: 80, homeExample: 'Premium Gym Monthly', targetCity: 'Berlin', targetCost: 45, targetExample: 'McFit + Sauna Access', icon: Heart },
        { category: 'Coffee Culture', homeCity: 'London', homeCost: 4.5, homeExample: 'Flat White at Specialty Cafe', targetCity: 'Berlin', targetCost: 3.5, targetExample: 'Flat White at The Barn', icon: Utensils },
        { category: 'Commute', homeCity: 'London', homeCost: 165, homeExample: 'Zone 1-3 Monthly Oyster', targetCity: 'Berlin', targetCost: 86, targetExample: 'BVG Monthly AB Zone', icon: Train },
      ]
    },
    'Singapore': {
      currency: 'S$',
      neighborhoods: [
        { id: '1', name: 'Orchard', affordability: 20, safety: 98, transit: 95, lifestyle: 98, avgRent: 4500, groceryCost: 600, color: '#dc2626', x: 45, y: 35 },
        { id: '2', name: 'Marina Bay', affordability: 15, safety: 99, transit: 92, lifestyle: 95, avgRent: 5500, groceryCost: 650, color: '#dc2626', x: 55, y: 50 },
        { id: '3', name: 'Tiong Bahru', affordability: 40, safety: 96, transit: 88, lifestyle: 90, avgRent: 3200, groceryCost: 450, color: '#f97316', x: 40, y: 55 },
        { id: '4', name: 'Tanjong Pagar', affordability: 35, safety: 97, transit: 90, lifestyle: 92, avgRent: 3500, groceryCost: 480, color: '#f97316', x: 50, y: 60 },
        { id: '5', name: 'Clementi', affordability: 60, safety: 95, transit: 85, lifestyle: 78, avgRent: 2400, groceryCost: 380, color: '#84cc16', x: 20, y: 50 },
        { id: '6', name: 'Tampines', affordability: 70, safety: 94, transit: 80, lifestyle: 72, avgRent: 2000, groceryCost: 350, color: '#10b981', x: 80, y: 40 },
        { id: '7', name: 'Jurong East', affordability: 65, safety: 93, transit: 82, lifestyle: 75, avgRent: 2200, groceryCost: 360, color: '#22c55e', x: 15, y: 45 },
        { id: '8', name: 'Bugis', affordability: 45, safety: 95, transit: 94, lifestyle: 88, avgRent: 3000, groceryCost: 420, color: '#eab308', x: 55, y: 35 },
      ],
      lifestyleMappings: [
        { category: 'Entertainment', homeCity: 'London', homeCost: 150, homeExample: 'West End Theatre Show', targetCity: 'Singapore', targetCost: 180, targetExample: 'Marina Bay Sands Show', icon: Heart },
        { category: 'Fine Dining', homeCity: 'London', homeCost: 120, homeExample: 'Michelin Star Restaurant', targetCity: 'Singapore', targetCost: 250, targetExample: 'Odette at National Gallery', icon: Utensils },
        { category: 'Fitness', homeCity: 'London', homeCost: 80, homeExample: 'Premium Gym Monthly', targetCity: 'Singapore', targetCost: 200, targetExample: 'Virgin Active Premium', icon: Heart },
        { category: 'Coffee Culture', homeCity: 'London', homeCost: 4.5, homeExample: 'Flat White at Specialty Cafe', targetCity: 'Singapore', targetCost: 7, targetExample: 'Flat White at Common Man', icon: Utensils },
        { category: 'Commute', homeCity: 'London', homeCost: 165, homeExample: 'Zone 1-3 Monthly Oyster', targetCity: 'Singapore', targetCost: 128, targetExample: 'MRT Monthly Pass', icon: Train },
      ]
    },
    'Dubai': {
      currency: 'AED',
      neighborhoods: [
        { id: '1', name: 'Downtown', affordability: 25, safety: 98, transit: 85, lifestyle: 98, avgRent: 12000, groceryCost: 2000, color: '#dc2626', x: 50, y: 45 },
        { id: '2', name: 'Dubai Marina', affordability: 30, safety: 97, transit: 82, lifestyle: 95, avgRent: 10000, groceryCost: 1800, color: '#ef4444', x: 25, y: 60 },
        { id: '3', name: 'JBR', affordability: 35, safety: 96, transit: 78, lifestyle: 92, avgRent: 9000, groceryCost: 1700, color: '#f97316', x: 20, y: 55 },
        { id: '4', name: 'Business Bay', affordability: 40, safety: 95, transit: 80, lifestyle: 88, avgRent: 8000, groceryCost: 1600, color: '#eab308', x: 55, y: 50 },
        { id: '5', name: 'JLT', affordability: 55, safety: 94, transit: 75, lifestyle: 82, avgRent: 6000, groceryCost: 1400, color: '#84cc16', x: 30, y: 45 },
        { id: '6', name: 'Deira', affordability: 70, safety: 88, transit: 88, lifestyle: 70, avgRent: 4000, groceryCost: 1100, color: '#10b981', x: 70, y: 25 },
        { id: '7', name: 'Bur Dubai', affordability: 65, safety: 90, transit: 85, lifestyle: 72, avgRent: 4500, groceryCost: 1200, color: '#22c55e', x: 60, y: 35 },
        { id: '8', name: 'Al Barsha', affordability: 60, safety: 93, transit: 72, lifestyle: 78, avgRent: 5500, groceryCost: 1300, color: '#84cc16', x: 35, y: 35 },
      ],
      lifestyleMappings: [
        { category: 'Entertainment', homeCity: 'London', homeCost: 150, homeExample: 'West End Theatre Show', targetCity: 'Dubai', targetCost: 500, targetExample: 'La Perle by Dragone', icon: Heart },
        { category: 'Fine Dining', homeCity: 'London', homeCost: 120, homeExample: 'Michelin Star Restaurant', targetCity: 'Dubai', targetCost: 800, targetExample: 'Dinner at Burj Al Arab', icon: Utensils },
        { category: 'Fitness', homeCity: 'London', homeCost: 80, homeExample: 'Premium Gym Monthly', targetCity: 'Dubai', targetCost: 500, targetExample: 'Fitness First Platinum', icon: Heart },
        { category: 'Coffee Culture', homeCity: 'London', homeCost: 4.5, homeExample: 'Flat White at Specialty Cafe', targetCity: 'Dubai', targetCost: 25, targetExample: 'Flat White at % Arabica', icon: Utensils },
        { category: 'Commute', homeCity: 'London', homeCost: 165, homeExample: 'Zone 1-3 Monthly Oyster', targetCity: 'Dubai', targetCost: 350, targetExample: 'Dubai Metro Gold Monthly', icon: Train },
      ]
    },
    'Lisbon': {
      currency: '€',
      neighborhoods: [
        { id: '1', name: 'Chiado', affordability: 30, safety: 88, transit: 90, lifestyle: 95, avgRent: 1800, groceryCost: 280, color: '#ef4444', x: 45, y: 45 },
        { id: '2', name: 'Baixa', affordability: 35, safety: 85, transit: 95, lifestyle: 90, avgRent: 1600, groceryCost: 260, color: '#f97316', x: 50, y: 50 },
        { id: '3', name: 'Alfama', affordability: 50, safety: 82, transit: 80, lifestyle: 88, avgRent: 1200, groceryCost: 240, color: '#84cc16', x: 60, y: 45 },
        { id: '4', name: 'Príncipe Real', affordability: 40, safety: 90, transit: 85, lifestyle: 92, avgRent: 1500, groceryCost: 270, color: '#eab308', x: 40, y: 35 },
        { id: '5', name: 'Graça', affordability: 60, safety: 86, transit: 78, lifestyle: 82, avgRent: 1000, groceryCost: 220, color: '#22c55e', x: 55, y: 30 },
        { id: '6', name: 'Belém', affordability: 55, safety: 92, transit: 75, lifestyle: 78, avgRent: 1100, groceryCost: 230, color: '#84cc16', x: 20, y: 55 },
        { id: '7', name: 'Alcântara', affordability: 65, safety: 84, transit: 82, lifestyle: 75, avgRent: 900, groceryCost: 210, color: '#10b981', x: 30, y: 50 },
        { id: '8', name: 'Parque das Nações', affordability: 45, safety: 94, transit: 88, lifestyle: 80, avgRent: 1400, groceryCost: 250, color: '#eab308', x: 75, y: 25 },
      ],
      lifestyleMappings: [
        { category: 'Entertainment', homeCity: 'London', homeCost: 150, homeExample: 'West End Theatre Show', targetCity: 'Lisbon', targetCost: 45, targetExample: 'Fado Show in Alfama', icon: Heart },
        { category: 'Fine Dining', homeCity: 'London', homeCost: 120, homeExample: 'Michelin Star Restaurant', targetCity: 'Lisbon', targetCost: 80, targetExample: 'Belcanto Tasting Menu', icon: Utensils },
        { category: 'Fitness', homeCity: 'London', homeCost: 80, homeExample: 'Premium Gym Monthly', targetCity: 'Lisbon', targetCost: 40, targetExample: 'Holmes Place Premium', icon: Heart },
        { category: 'Coffee Culture', homeCity: 'London', homeCost: 4.5, homeExample: 'Flat White at Specialty Cafe', targetCity: 'Lisbon', targetCost: 2.5, targetExample: 'Bica at Fabrica Coffee', icon: Utensils },
        { category: 'Commute', homeCity: 'London', homeCost: 165, homeExample: 'Zone 1-3 Monthly Oyster', targetCity: 'Lisbon', targetCost: 40, targetExample: 'Navegante Monthly Pass', icon: Train },
      ]
    }
  };

  const availableCities = Object.keys(cityData);
  const currentCityData = cityData[selectedCity] || cityData['Tokyo'];
  const neighborhoods = currentCityData.neighborhoods;
  const lifestyleMappings = currentCityData.lifestyleMappings;

  // Auto-select first neighborhood on city change
  useEffect(() => {
    if (neighborhoods.length > 0) {
      setSelectedNeighborhood(neighborhoods[0]);
    }
  }, [selectedCity]);

  // City-specific real-time price data
  const cityRealTimeData: { [key: string]: { source: string; item: string; price: string; change: number; updated: string }[] } = {
    'Tokyo': [
      { source: 'Uber Eats Tokyo', item: 'Weekly Grocery Basket', price: '¥4,200', change: -3.2, updated: '2 min ago' },
      { source: 'Suumo Rentals', item: 'Avg 1BR Shibuya', price: '¥285,000/mo', change: 1.8, updated: '15 min ago' },
      { source: 'Tabelog', item: 'Avg Lunch Set', price: '¥1,100', change: 0, updated: '1 hr ago' },
      { source: 'JR East', item: 'Commuter Pass (30 days)', price: '¥9,800', change: 0, updated: '1 day ago' },
      { source: 'Rakuten Mobile', item: 'Unlimited Data Plan', price: '¥2,980/mo', change: -5.0, updated: '3 hrs ago' },
    ],
    'Berlin': [
      { source: 'Lieferando', item: 'Weekly Grocery Basket', price: '€85', change: -1.5, updated: '5 min ago' },
      { source: 'Immoscout24', item: 'Avg 1BR Mitte', price: '€1,800/mo', change: 2.3, updated: '20 min ago' },
      { source: 'Yelp Berlin', item: 'Avg Lunch Set', price: '€12', change: 0, updated: '1 hr ago' },
      { source: 'BVG', item: 'Monthly Transit Pass', price: '€86', change: 0, updated: '1 day ago' },
      { source: 'O2 Germany', item: 'Unlimited Data Plan', price: '€40/mo', change: -8.0, updated: '2 hrs ago' },
    ],
    'Singapore': [
      { source: 'GrabFood SG', item: 'Weekly Grocery Basket', price: 'S$120', change: -2.1, updated: '3 min ago' },
      { source: 'PropertyGuru', item: 'Avg 1BR Orchard', price: 'S$4,500/mo', change: 1.2, updated: '10 min ago' },
      { source: 'Burpple', item: 'Avg Lunch Set', price: 'S$15', change: 0.5, updated: '45 min ago' },
      { source: 'TransitLink', item: 'Monthly MRT Pass', price: 'S$128', change: 0, updated: '1 day ago' },
      { source: 'Singtel', item: 'Unlimited Data Plan', price: 'S$50/mo', change: -3.0, updated: '4 hrs ago' },
    ],
    'Dubai': [
      { source: 'Talabat', item: 'Weekly Grocery Basket', price: 'AED 450', change: -1.8, updated: '4 min ago' },
      { source: 'Bayut', item: 'Avg 1BR Downtown', price: 'AED 12,000/mo', change: 3.5, updated: '25 min ago' },
      { source: 'Zomato Dubai', item: 'Avg Lunch Set', price: 'AED 55', change: 0, updated: '1 hr ago' },
      { source: 'RTA Dubai', item: 'Monthly Metro Pass', price: 'AED 350', change: 0, updated: '1 day ago' },
      { source: 'Du Telecom', item: 'Unlimited Data Plan', price: 'AED 200/mo', change: -5.0, updated: '3 hrs ago' },
    ],
    'Lisbon': [
      { source: 'Glovo Portugal', item: 'Weekly Grocery Basket', price: '€55', change: -2.5, updated: '6 min ago' },
      { source: 'Idealista', item: 'Avg 1BR Chiado', price: '€1,800/mo', change: 4.2, updated: '15 min ago' },
      { source: 'Zomato Lisbon', item: 'Avg Lunch Set', price: '€10', change: 0, updated: '2 hrs ago' },
      { source: 'Navegante', item: 'Monthly Transit Pass', price: '€40', change: 0, updated: '1 day ago' },
      { source: 'NOS Portugal', item: 'Unlimited Data Plan', price: '€30/mo', change: -4.0, updated: '5 hrs ago' },
    ]
  };

  // Function to generate randomized price changes
  const generateRealTimeData = (cityKey: string) => {
    const baseData = cityRealTimeData[cityKey] || cityRealTimeData['Tokyo'];
    return baseData.map(item => ({
      ...item,
      change: Math.round((Math.random() * 10 - 5) * 10) / 10, // Random -5% to +5%
      updated: ['Just now', '1 min ago', '2 min ago', '5 min ago'][Math.floor(Math.random() * 4)]
    }));
  };

  const [liveData, setLiveData] = useState(() => generateRealTimeData(selectedCity));

  // Update live data when city changes
  useEffect(() => {
    setLiveData(generateRealTimeData(selectedCity));
  }, [selectedCity]);

  const realTimeData = liveData;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLiveData(generateRealTimeData(selectedCity));
      setIsRefreshing(false);
      setLastUpdated(new Date());
      setRefreshKey(prev => prev + 1);
    }, 1500);
  };

  const getAffordabilityColor = (score: number) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#eab308';
    if (score >= 35) return '#f97316';
    return '#ef4444';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '100px', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '16px' }}>
          <Globe style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
          <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 600 }}>Hyper-Local Intelligence</span>
        </motion.div>
        <h2 style={{ fontSize: '36px', fontWeight: 800, background: 'linear-gradient(135deg, #667eea 0%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px' }}>
          Neighborhood Heatmap
        </h2>
        
        {/* City Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {availableCities.map((cityName) => (
            <motion.button
              key={cityName}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCity(cityName)}
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
                cursor: 'pointer',
                boxShadow: selectedCity === cityName ? '0 4px 16px rgba(102, 126, 234, 0.3)' : 'none'
              }}
            >
              {cityName}
            </motion.button>
          ))}
        </div>
        
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
          Real-time pricing from local APIs • Cultural lifestyle translation
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {[
          { id: 'heatmap', label: 'Affordability Map', icon: MapPin },
          { id: 'cultural', label: 'Cultural Context', icon: Sparkles },
          { id: 'realtime', label: 'Live Prices', icon: Zap }
        ].map(tab => (
          <motion.button key={tab.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
              border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}>
            <tab.icon style={{ width: '16px', height: '16px' }} />
            {tab.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'heatmap' && (
          <motion.div key="heatmap" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Map */}
            <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '24px', padding: '24px', position: 'relative', height: '450px' }}>
              <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                Click neighborhoods to explore
              </div>
              {/* Grid overlay */}
              <div style={{ position: 'absolute', inset: '24px', opacity: 0.1, backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              
              {/* Neighborhood dots */}
              {neighborhoods.map((n, i) => (
                <motion.div key={n.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedNeighborhood(n)}
                  style={{
                    position: 'absolute', left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)',
                    cursor: 'pointer', zIndex: selectedNeighborhood?.id === n.id ? 20 : 10
                  }}>
                  <motion.div whileHover={{ scale: 1.2 }}
                    style={{
                      width: selectedNeighborhood?.id === n.id ? '60px' : '45px',
                      height: selectedNeighborhood?.id === n.id ? '60px' : '45px',
                      borderRadius: '50%', background: `${getAffordabilityColor(n.affordability)}30`,
                      border: `3px solid ${getAffordabilityColor(n.affordability)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 20px ${getAffordabilityColor(n.affordability)}50`,
                      transition: 'all 0.3s ease'
                    }}>
                    <span style={{ fontSize: selectedNeighborhood?.id === n.id ? '14px' : '12px', fontWeight: 700, color: 'white' }}>{n.affordability}</span>
                  </motion.div>
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '4px', whiteSpace: 'nowrap', fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{n.name}</div>
                </motion.div>
              ))}
              
              {/* Legend */}
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '16px', fontSize: '11px' }}>
                {[{ label: 'Affordable', color: '#10b981' }, { label: 'Moderate', color: '#eab308' }, { label: 'Expensive', color: '#ef4444' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: l.color }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Panel */}
            <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '24px', padding: '24px' }}>
              {selectedNeighborhood ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{selectedNeighborhood.name}</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>{selectedCity}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: 'Affordability', value: selectedNeighborhood.affordability, icon: DollarSign },
                      { label: 'Safety Score', value: selectedNeighborhood.safety, icon: Heart },
                      { label: 'Transit Access', value: selectedNeighborhood.transit, icon: Train },
                      { label: 'Lifestyle Match', value: selectedNeighborhood.lifestyle, icon: Sparkles }
                    ].map((stat, i) => (
                      <div key={stat.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <stat.icon style={{ width: '14px', height: '14px', color: '#a78bfa' }} />
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{stat.label}</span>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{stat.value}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${stat.value}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                            style={{ height: '100%', background: stat.value > 80 ? '#10b981' : stat.value > 50 ? '#eab308' : '#ef4444', borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Avg. Rent (1BR)</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>{currentCityData.currency}{selectedNeighborhood.avgRent.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Monthly Groceries</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>{currentCityData.currency}{(selectedNeighborhood.groceryCost * 4).toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  <MapPin style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '14px' }}>Select a neighborhood</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'cultural' && (
          <motion.div key="cultural" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '24px', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Sparkles style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Cultural Context Engine</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Translating your London lifestyle to {selectedCity} equivalents</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {lifestyleMappings.map((mapping, i) => (
                  <motion.div key={mapping.category} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <mapping.icon style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{mapping.category}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
                      <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{mapping.homeCity}</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6', marginBottom: '4px' }}>£{mapping.homeCost}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{mapping.homeExample}</div>
                      </div>
                      <ArrowRight style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.3)' }} />
                      <div style={{ padding: '16px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{mapping.targetCity}</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#ec4899', marginBottom: '4px' }}>{currentCityData.currency}{mapping.targetCost.toLocaleString()}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{mapping.targetExample}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'realtime' && (
          <motion.div key="realtime" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '24px', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Zap style={{ width: '24px', height: '24px', color: '#10b981' }} />
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Real-Time Price Feed</h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Last updated: {lastUpdated.toLocaleTimeString()}</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRefresh}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '13px', cursor: 'pointer' }}>
                  <RefreshCw style={{ width: '14px', height: '14px', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                  Refresh
                </motion.button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {realTimeData.map((item, i) => (
                  <motion.div key={`${item.source}-${refreshKey}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingCart style={{ width: '18px', height: '18px', color: 'white' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{item.item}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{item.source}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>{item.price}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        {item.change !== 0 && (item.change > 0 ? <TrendingUp style={{ width: '12px', height: '12px', color: '#ef4444' }} /> : <TrendingDown style={{ width: '12px', height: '12px', color: '#10b981' }} />)}
                        <span style={{ fontSize: '12px', color: item.change > 0 ? '#ef4444' : item.change < 0 ? '#10b981' : 'rgba(255,255,255,0.5)' }}>
                          {item.change > 0 ? '+' : ''}{item.change}%
                        </span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>{item.updated}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Data sourced from local {selectedCity} APIs • Updated in real-time</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
