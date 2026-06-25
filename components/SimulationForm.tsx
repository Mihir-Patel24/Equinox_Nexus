'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Select from 'react-select';
import { MapPin, DollarSign, Settings, Plus, X, Sparkles, ChevronDown, Home, Car, Utensils, Dumbbell, Music, Users } from 'lucide-react';
import { WORLD_CURRENCIES, POPULAR_LOCATIONS, getCurrencyByCountry } from '@/lib/currencies';
import toast from 'react-hot-toast';

interface SimulationFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export function SimulationForm({ onSubmit, isLoading }: SimulationFormProps) {
  const [formData, setFormData] = useState({
    current_location: '',
    target_locations: ['', '', ''],
    current_salary: '',
    currency: 'USD',
    lifestyle_preferences: {
      housing_type: 'apartment',
      transportation: 'public',
      dining_frequency: 'moderate',
      entertainment_budget: 'moderate',
      fitness_level: 'gym_member',
      social_frequency: 'weekly'
    }
  });

  const [expandedSection, setExpandedSection] = useState<string | null>('lifestyle');

  const currencyOptions = WORLD_CURRENCIES.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name} (${currency.symbol})`,
    country: currency.country
  }));

  const locationOptions = POPULAR_LOCATIONS.map(location => ({
    value: location,
    label: location
  }));

  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderColor: state.isFocused ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255, 255, 255, 0.1)',
      borderRadius: '14px',
      padding: '6px',
      minHeight: '52px',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(102, 126, 234, 0.1)' : 'none',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: 'rgba(102, 126, 234, 0.3)'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'rgba(26, 26, 46, 0.98)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      zIndex: 9999
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: '8px'
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? 'rgba(102, 126, 234, 0.3)'
        : state.isFocused 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'transparent',
      color: 'white',
      borderRadius: '8px',
      padding: '12px 16px',
      margin: '2px 0',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'white'
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'rgba(255, 255, 255, 0.4)'
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'white'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: 'rgba(255, 255, 255, 0.4)'
    })
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.current_location) {
      toast.error('Please enter your current location');
      return;
    }
    
    if (!formData.current_salary) {
      toast.error('Please enter your annual salary');
      return;
    }

    const validTargetLocations = formData.target_locations.filter(loc => loc.trim() !== '');
    if (validTargetLocations.length === 0) {
      toast.error('Please add at least one target location');
      return;
    }

    toast.success('Starting agentic simulation...', { icon: '🚀' });
    
    onSubmit({
      ...formData,
      current_salary: parseFloat(formData.current_salary),
      target_locations: validTargetLocations
    });
  };

  const updateTargetLocation = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      target_locations: prev.target_locations.map((loc, i) => i === index ? value : loc)
    }));
  };

  const removeTargetLocation = (index: number) => {
    if (formData.target_locations.length > 1) {
      setFormData(prev => ({
        ...prev,
        target_locations: prev.target_locations.filter((_, i) => i !== index)
      }));
    }
  };

  const addTargetLocation = () => {
    if (formData.target_locations.length < 5) {
      setFormData(prev => ({
        ...prev,
        target_locations: [...prev.target_locations, '']
      }));
    }
  };

  const handleLocationChange = (value: string, isCurrentLocation = false) => {
    if (isCurrentLocation) {
      const detectedCurrency = getCurrencyByCountry(value);
      setFormData(prev => ({
        ...prev,
        current_location: value,
        currency: detectedCurrency
      }));
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 20px',
    fontSize: '16px',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    outline: 'none',
    transition: 'all 0.3s ease'
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    outline: 'none',
    cursor: 'pointer'
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '12px'
  };

  const lifestyleOptions = [
    { key: 'housing_type', label: 'Housing', icon: Home, options: [
      { value: 'studio', label: 'Studio' }, { value: 'apartment', label: 'Apartment' },
      { value: 'house', label: 'House' }, { value: 'luxury', label: 'Luxury' }
    ]},
    { key: 'transportation', label: 'Transport', icon: Car, options: [
      { value: 'public', label: 'Public' }, { value: 'car', label: 'Car' },
      { value: 'bike', label: 'Bike' }, { value: 'mixed', label: 'Mixed' }
    ]},
    { key: 'dining_frequency', label: 'Dining', icon: Utensils, options: [
      { value: 'minimal', label: 'Minimal' }, { value: 'moderate', label: 'Moderate' },
      { value: 'frequent', label: 'Frequent' }, { value: 'luxury', label: 'Fine Dining' }
    ]},
    { key: 'fitness_level', label: 'Fitness', icon: Dumbbell, options: [
      { value: 'none', label: 'None' }, { value: 'basic', label: 'Basic' },
      { value: 'gym_member', label: 'Premium' }, { value: 'personal_trainer', label: 'Trainer' }
    ]},
    { key: 'entertainment_budget', label: 'Entertainment', icon: Music, options: [
      { value: 'minimal', label: 'Minimal' }, { value: 'moderate', label: 'Moderate' },
      { value: 'high', label: 'High' }, { value: 'luxury', label: 'Luxury' }
    ]},
    { key: 'social_frequency', label: 'Social', icon: Users, options: [
      { value: 'rarely', label: 'Rarely' }, { value: 'weekly', label: 'Weekly' },
      { value: 'frequent', label: 'Often' }, { value: 'daily', label: 'Daily' }
    ]},
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Current Location */}
      <div>
        <label style={labelStyle}>
          <MapPin style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
          Current Location
        </label>
        <Select
          options={locationOptions}
          value={locationOptions.find(opt => opt.value === formData.current_location)}
          onChange={(option) => handleLocationChange(option?.value || '', true)}
          styles={customSelectStyles}
          placeholder="Where are you now?"
          isSearchable
        />
      </div>

      {/* Target Locations */}
      <div>
        <label style={labelStyle}>
          <MapPin style={{ width: '16px', height: '16px', color: '#a855f7' }} />
          Target Locations
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            ({formData.target_locations.filter(l => l).length}/5)
          </span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {formData.target_locations.map((location, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <Select
                  options={locationOptions}
                  value={locationOptions.find(opt => opt.value === location)}
                  onChange={(option) => updateTargetLocation(index, option?.value || '')}
                  styles={customSelectStyles}
                  placeholder={`Destination ${index + 1}`}
                  isSearchable
                />
              </div>
              {formData.target_locations.length > 1 && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeTargetLocation(index)}
                  style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X style={{ width: '20px', height: '20px', color: '#f87171' }} />
                </motion.button>
              )}
            </div>
          ))}
          {formData.target_locations.length < 5 && (
            <button
              type="button"
              onClick={addTargetLocation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                fontSize: '14px',
                color: '#a78bfa',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Add destination
            </button>
          )}
        </div>
      </div>

      {/* Salary & Currency */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStyle}>
            <DollarSign style={{ width: '16px', height: '16px', color: '#22c55e' }} />
            Annual Salary
          </label>
          <input
            type="number"
            value={formData.current_salary}
            onChange={(e) => setFormData(prev => ({ ...prev, current_salary: e.target.value }))}
            placeholder="75,000"
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>
            <DollarSign style={{ width: '16px', height: '16px', color: '#eab308' }} />
            Currency
          </label>
          <Select
            options={currencyOptions}
            value={currencyOptions.find(opt => opt.value === formData.currency)}
            onChange={(option) => setFormData(prev => ({ ...prev, currency: option?.value || 'USD' }))}
            styles={{
              ...customSelectStyles,
              control: (provided: any, state: any) => ({
                ...provided,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderColor: state.isFocused ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '6px 8px',
                minHeight: '52px',
                boxShadow: state.isFocused ? '0 0 0 4px rgba(102, 126, 234, 0.1)' : 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'rgba(102, 126, 234, 0.3)'
                }
              }),
              singleValue: (provided: any) => ({
                ...provided,
                color: 'white',
                fontSize: '15px'
              }),
            }}
            isSearchable
            placeholder="Select currency"
            formatOptionLabel={(option: any) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 600,
                  color: '#a78bfa',
                  minWidth: '45px'
                }}>
                  {option.value}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  {option.label.split(' - ')[1]}
                </span>
              </div>
            )}
          />
        </div>
      </div>

      {/* Lifestyle Preferences */}
      <div>
        <button
          type="button"
          onClick={() => setExpandedSection(expandedSection === 'lifestyle' ? null : 'lifestyle')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0',
            marginBottom: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings style={{ width: '16px', height: '16px', color: '#a855f7' }} />
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
              Lifestyle Preferences
            </span>
          </div>
          <ChevronDown style={{
            width: '16px',
            height: '16px',
            color: 'rgba(255,255,255,0.4)',
            transform: expandedSection === 'lifestyle' ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s'
          }} />
        </button>

        {expandedSection === 'lifestyle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}
          >
            {lifestyleOptions.map((option) => (
              <div key={option.key}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                  <option.icon style={{ width: '12px', height: '12px' }} />
                  {option.label}
                </label>
                <select
                  value={formData.lifestyle_preferences[option.key as keyof typeof formData.lifestyle_preferences]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    lifestyle_preferences: { ...prev.lifestyle_preferences, [option.key]: e.target.value }
                  }))}
                  style={selectStyle}
                >
                  {option.options.map(opt => (
                    <option key={opt.value} value={opt.value} style={{ background: '#1a1a2e' }}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        style={{
          width: '100%',
          padding: '20px 36px',
          fontSize: '18px',
          fontWeight: 700,
          color: 'white',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          backgroundSize: '200% 200%',
          border: 'none',
          borderRadius: '16px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}
      >
        {isLoading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles style={{ width: '20px', height: '20px' }} />
            </motion.div>
            Running Simulation...
          </>
        ) : (
          <>
            <Sparkles style={{ width: '20px', height: '20px' }} />
            Run Agentic Simulation
          </>
        )}
      </motion.button>
    </form>
  );
}
