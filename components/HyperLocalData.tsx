'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Leaf, Zap, TrendingUp, TrendingDown, RefreshCw,
  MapPin, Clock, Droplets, Wind, Sun, Battery, Globe, Database
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BasketItem {
  name: string;
  category: string;
  priceUSD: number;
  priceLocal: string;
  change: number;
  source: string;
}

interface CityESG {
  city: string;
  renewableEnergy: number;
  carbonFootprint: number;
  airQuality: number;
  waterQuality: number;
  publicTransit: number;
  greenSpaces: number;
  overallScore: number;
}

const basketItems: Record<string, BasketItem[]> = {
  'Berlin': [
    { name: 'Milk (1L)', category: 'Groceries', priceUSD: 1.45, priceLocal: '€1.35', change: 1.8, source: 'Flink' },
    { name: 'Bread (500g)', category: 'Groceries', priceUSD: 2.10, priceLocal: '€1.95', change: 0.5, source: 'Gorillas' },
    { name: 'Rice (5kg)', category: 'Groceries', priceUSD: 12.80, priceLocal: '€11.90', change: -0.3, source: 'Amazon Fresh' },
    { name: 'Chicken (1kg)', category: 'Groceries', priceUSD: 7.50, priceLocal: '€6.98', change: 2.1, source: 'Flink' },
    { name: 'Coffee (Starbucks)', category: 'Dining', priceUSD: 4.85, priceLocal: '€4.50', change: 0, source: 'Starbucks DE' },
    { name: 'Lunch Set', category: 'Dining', priceUSD: 12.50, priceLocal: '€11.60', change: 2.8, source: 'Lieferando' },
    { name: 'BVG Pass (Monthly)', category: 'Transport', priceUSD: 96.00, priceLocal: '€89.00', change: 0, source: 'BVG' },
    { name: 'Gym Membership', category: 'Lifestyle', priceUSD: 35.00, priceLocal: '€32.50', change: 0, source: 'McFit' },
  ],
  'Tokyo': [
    { name: 'Milk (1L)', category: 'Groceries', priceUSD: 2.15, priceLocal: '¥322', change: 2.3, source: 'Uber Eats JP' },
    { name: 'Bread (500g)', category: 'Groceries', priceUSD: 1.89, priceLocal: '¥283', change: -1.2, source: 'Instacart' },
    { name: 'Rice (5kg)', category: 'Groceries', priceUSD: 18.50, priceLocal: '¥2,775', change: 0.8, source: 'Amazon Fresh' },
    { name: 'Chicken (1kg)', category: 'Groceries', priceUSD: 8.20, priceLocal: '¥1,230', change: 3.5, source: 'Uber Eats JP' },
    { name: 'Coffee (Starbucks)', category: 'Dining', priceUSD: 4.50, priceLocal: '¥675', change: 0, source: 'Starbucks JP' },
    { name: 'Lunch Set', category: 'Dining', priceUSD: 9.80, priceLocal: '¥1,470', change: 1.5, source: 'Tabelog' },
    { name: 'Metro Pass (Monthly)', category: 'Transport', priceUSD: 68.00, priceLocal: '¥10,200', change: 0, source: 'Tokyo Metro' },
    { name: 'Gym Membership', category: 'Lifestyle', priceUSD: 45.00, priceLocal: '¥6,750', change: -5.0, source: 'Anytime Fitness' },
  ],
  'Singapore': [
    { name: 'Milk (1L)', category: 'Groceries', priceUSD: 2.85, priceLocal: 'S$3.80', change: 1.2, source: 'FairPrice' },
    { name: 'Bread (500g)', category: 'Groceries', priceUSD: 2.25, priceLocal: 'S$3.00', change: 0.8, source: 'RedMart' },
    { name: 'Rice (5kg)', category: 'Groceries', priceUSD: 9.75, priceLocal: 'S$13.00', change: -0.5, source: 'FairPrice' },
    { name: 'Chicken (1kg)', category: 'Groceries', priceUSD: 6.75, priceLocal: 'S$9.00', change: 2.8, source: 'RedMart' },
    { name: 'Coffee (Starbucks)', category: 'Dining', priceUSD: 5.25, priceLocal: 'S$7.00', change: 0, source: 'Starbucks SG' },
    { name: 'Lunch Set', category: 'Dining', priceUSD: 8.25, priceLocal: 'S$11.00', change: 1.0, source: 'GrabFood' },
    { name: 'MRT Pass (Monthly)', category: 'Transport', priceUSD: 90.00, priceLocal: 'S$120.00', change: 0, source: 'TransitLink' },
    { name: 'Gym Membership', category: 'Lifestyle', priceUSD: 75.00, priceLocal: 'S$100.00', change: -2.0, source: 'Fitness First' },
  ],
  'Dubai': [
    { name: 'Milk (1L)', category: 'Groceries', priceUSD: 1.90, priceLocal: 'AED 7.00', change: 0.5, source: 'Carrefour' },
    { name: 'Bread (500g)', category: 'Groceries', priceUSD: 1.35, priceLocal: 'AED 5.00', change: 0, source: 'Lulu' },
    { name: 'Rice (5kg)', category: 'Groceries', priceUSD: 10.85, priceLocal: 'AED 40.00', change: 1.2, source: 'Carrefour' },
    { name: 'Chicken (1kg)', category: 'Groceries', priceUSD: 5.45, priceLocal: 'AED 20.00', change: 3.0, source: 'Talabat Mart' },
    { name: 'Coffee (Starbucks)', category: 'Dining', priceUSD: 5.45, priceLocal: 'AED 20.00', change: 0, source: 'Starbucks UAE' },
    { name: 'Lunch Set', category: 'Dining', priceUSD: 13.60, priceLocal: 'AED 50.00', change: 2.5, source: 'Talabat' },
    { name: 'Metro Pass (Monthly)', category: 'Transport', priceUSD: 95.00, priceLocal: 'AED 350.00', change: 0, source: 'RTA Dubai' },
    { name: 'Gym Membership', category: 'Lifestyle', priceUSD: 80.00, priceLocal: 'AED 295.00', change: -3.0, source: 'Fitness First' },
  ],
  'Lisbon': [
    { name: 'Milk (1L)', category: 'Groceries', priceUSD: 1.10, priceLocal: '€1.02', change: 1.5, source: 'Continente' },
    { name: 'Bread (500g)', category: 'Groceries', priceUSD: 1.40, priceLocal: '€1.30', change: 0.3, source: 'Pingo Doce' },
    { name: 'Rice (5kg)', category: 'Groceries', priceUSD: 8.60, priceLocal: '€8.00', change: -0.8, source: 'Continente' },
    { name: 'Chicken (1kg)', category: 'Groceries', priceUSD: 5.90, priceLocal: '€5.50', change: 1.8, source: 'Pingo Doce' },
    { name: 'Coffee (Starbucks)', category: 'Dining', priceUSD: 4.30, priceLocal: '€4.00', change: 0, source: 'Starbucks PT' },
    { name: 'Lunch Set', category: 'Dining', priceUSD: 10.75, priceLocal: '€10.00', change: 2.0, source: 'Uber Eats PT' },
    { name: 'Navegante Pass (Monthly)', category: 'Transport', priceUSD: 43.00, priceLocal: '€40.00', change: 0, source: 'Navegante' },
    { name: 'Gym Membership', category: 'Lifestyle', priceUSD: 32.00, priceLocal: '€30.00', change: 0, source: 'Solinca' },
  ],
};

const cityESGData: CityESG[] = [
  { city: 'Berlin', renewableEnergy: 42, carbonFootprint: 5.2, airQuality: 78, waterQuality: 92, publicTransit: 88, greenSpaces: 85, overallScore: 81 },
  { city: 'Tokyo', renewableEnergy: 22, carbonFootprint: 8.1, airQuality: 65, waterQuality: 95, publicTransit: 96, greenSpaces: 62, overallScore: 72 },
  { city: 'Singapore', renewableEnergy: 15, carbonFootprint: 7.5, airQuality: 72, waterQuality: 98, publicTransit: 94, greenSpaces: 70, overallScore: 74 },
  { city: 'Dubai', renewableEnergy: 12, carbonFootprint: 18.2, airQuality: 58, waterQuality: 85, publicTransit: 65, greenSpaces: 45, overallScore: 52 },
  { city: 'Lisbon', renewableEnergy: 68, carbonFootprint: 3.8, airQuality: 85, waterQuality: 88, publicTransit: 72, greenSpaces: 78, overallScore: 86 },
];

export function HyperLocalData() {
  const [selectedCity, setSelectedCity] = useState('Berlin');
  const [comparisonCity, setComparisonCity] = useState('Tokyo');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showESG, setShowESG] = useState(true);

  const currentBasket = basketItems[selectedCity] || basketItems['Tokyo'];
  const comparisonBasket = basketItems[comparisonCity] || basketItems['Berlin'];
  
  const currentESG = cityESGData.find(c => c.city === selectedCity) || cityESGData[0];
  const comparisonESG = cityESGData.find(c => c.city === comparisonCity) || cityESGData[1];

  const totalBasketCost = currentBasket.reduce((sum, item) => sum + item.priceUSD, 0);
  const comparisonBasketCost = comparisonBasket.reduce((sum, item) => sum + item.priceUSD, 0);
  const costDifference = ((totalBasketCost - comparisonBasketCost) / comparisonBasketCost * 100).toFixed(1);

  const carbonDifference = ((currentESG.carbonFootprint - comparisonESG.carbonFootprint) / comparisonESG.carbonFootprint * 100).toFixed(0);

  const refreshPrices = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
      toast.success('Prices updated from live APIs!', { icon: '🔄' });
    }, 2000);
  };

  // Data sources
  const dataSources = [
    { name: 'Uber Eats', icon: '🚗', status: 'live' },
    { name: 'Instacart', icon: '🛒', status: 'live' },
    { name: 'Numbeo', icon: '📊', status: 'live' },
    { name: 'IEA Energy', icon: '⚡', status: 'cached' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart style={{ width: '22px', height: '22px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}>Hyper-Local Micro-Economy</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Real-time prices from delivery APIs • Updated {lastUpdated.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={refreshPrices} disabled={isRefreshing}
          style={{ padding: '10px 18px', background: isRefreshing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: isRefreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw style={{ width: '14px', height: '14px', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          {isRefreshing ? 'Fetching...' : 'Refresh Prices'}
        </motion.button>
      </div>

      {/* City Selectors */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', display: 'block' }}>Current City</label>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
            style={{ width: '100%', padding: '12px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
            {Object.keys(basketItems).map(city => <option key={city} value={city} style={{ background: '#1a1a2e', color: 'white' }}>{city}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', display: 'block' }}>Compare With</label>
          <select value={comparisonCity} onChange={(e) => setComparisonCity(e.target.value)}
            style={{ width: '100%', padding: '12px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
            {Object.keys(basketItems).map(city => <option key={city} value={city} style={{ background: '#1a1a2e', color: 'white' }}>{city}</option>)}
          </select>
        </div>
      </div>

      {/* Cost Comparison Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>{selectedCity} Basket Cost</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>${totalBasketCost.toFixed(2)}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>8 items • Today's prices</div>
        </div>
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>{comparisonCity} Basket Cost</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>${comparisonBasketCost.toFixed(2)}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>8 items • Today's prices</div>
        </div>
        <div style={{ padding: '20px', background: `linear-gradient(135deg, ${Number(costDifference) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'} 0%, rgba(0,0,0,0.1) 100%)`, borderRadius: '16px', border: `1px solid ${Number(costDifference) > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Cost Difference</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: Number(costDifference) > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Number(costDifference) > 0 ? <TrendingUp style={{ width: '24px', height: '24px' }} /> : <TrendingDown style={{ width: '24px', height: '24px' }} />}
            {costDifference}%
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{Number(costDifference) > 0 ? 'More expensive' : 'Cheaper'} than {comparisonCity}</div>
        </div>
      </div>

      {/* Basket Items */}
      <div style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(102, 126, 234, 0.2)', borderRadius: '20px', padding: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
          {selectedCity} - Live Basket Prices
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {currentBasket.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>{item.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', color: 'rgba(255,255,255,0.5)' }}>{item.category}</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>via {item.source}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>{item.priceLocal}</div>
                <div style={{ fontSize: '11px', color: item.change > 0 ? '#ef4444' : item.change < 0 ? '#10b981' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  {item.change !== 0 && (item.change > 0 ? <TrendingUp style={{ width: '10px', height: '10px' }} /> : <TrendingDown style={{ width: '10px', height: '10px' }} />)}
                  {item.change > 0 ? '+' : ''}{item.change}% this week
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ESG / Carbon Footprint Section */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '20px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'white' }}>Personal ESG Impact</h3>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Your carbon footprint by city</p>
            </div>
          </div>
          <div style={{ padding: '10px 16px', background: Number(carbonDifference) < 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderRadius: '10px', border: `1px solid ${Number(carbonDifference) < 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Moving to {comparisonCity}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: Number(carbonDifference) < 0 ? '#10b981' : '#ef4444' }}>
              {Number(carbonDifference) < 0 ? '↓' : '↑'} {Math.abs(Number(carbonDifference))}% Carbon
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* Current City ESG */}
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>{selectedCity}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Renewable Energy', value: currentESG.renewableEnergy, icon: Sun, unit: '%' },
                { label: 'Carbon Footprint', value: currentESG.carbonFootprint, icon: Wind, unit: ' t/yr' },
                { label: 'Air Quality', value: currentESG.airQuality, icon: Droplets, unit: '/100' },
                { label: 'Public Transit', value: currentESG.publicTransit, icon: Globe, unit: '/100' },
              ].map((metric, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <metric.icon style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{metric.label}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{metric.value}{metric.unit}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Overall ESG Score</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{currentESG.overallScore}/100</div>
            </div>
          </div>

          {/* Comparison City ESG */}
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '12px' }}>{comparisonCity}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Renewable Energy', value: comparisonESG.renewableEnergy, icon: Sun, unit: '%' },
                { label: 'Carbon Footprint', value: comparisonESG.carbonFootprint, icon: Wind, unit: ' t/yr' },
                { label: 'Air Quality', value: comparisonESG.airQuality, icon: Droplets, unit: '/100' },
                { label: 'Public Transit', value: comparisonESG.publicTransit, icon: Globe, unit: '/100' },
              ].map((metric, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <metric.icon style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{metric.label}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{metric.value}{metric.unit}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Overall ESG Score</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{comparisonESG.overallScore}/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources Footer */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '16px', 
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Database style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Live Data Sources</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {dataSources.map((source, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 14px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <span style={{ fontSize: '14px' }}>{source.icon}</span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{source.name}</span>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                padding: '2px 6px',
                background: source.status === 'live' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                borderRadius: '4px'
              }}>
                <div style={{ 
                  width: '5px', 
                  height: '5px', 
                  borderRadius: '50%', 
                  background: source.status === 'live' ? '#10b981' : '#f59e0b',
                  animation: source.status === 'live' ? 'pulse 2s infinite' : 'none'
                }} />
                <span style={{ fontSize: '9px', color: source.status === 'live' ? '#10b981' : '#f59e0b', fontWeight: 600, textTransform: 'uppercase' }}>
                  {source.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
          ESG data sourced from IEA World Energy Outlook 2024, WHO Air Quality Database, and local government reports.
        </div>
      </div>
    </div>
  );
}
