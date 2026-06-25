'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface MapComponentProps {
  cities: City[];
  selectedCity: City | null;
  onCitySelect: (city: City | null) => void;
  hoveredCity: string | null;
  onCityHover: (cityId: string | null) => void;
}

// Custom marker icon creator
const createCustomIcon = (color: string, isSelected: boolean, isHovered: boolean) => {
  const size = isSelected ? 24 : isHovered ? 20 : 16;
  const pulseSize = size + 20;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; width: ${pulseSize}px; height: ${pulseSize}px; display: flex; align-items: center; justify-content: center;">
        ${isSelected || isHovered ? `
          <div style="
            position: absolute;
            width: ${pulseSize}px;
            height: ${pulseSize}px;
            border-radius: 50%;
            background: ${color}30;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 4px 12px ${color}80, 0 0 20px ${color}40;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
        "></div>
      </div>
    `,
    iconSize: [pulseSize, pulseSize],
    iconAnchor: [pulseSize / 2, pulseSize / 2],
  });
};

// Connection lines between cities
const connections = [
  ['1', '5'], // Singapore - Tokyo
  ['1', '8'], // Singapore - Sydney
  ['2', '7'], // Dubai - London
  ['3', '4'], // Lisbon - Berlin
  ['4', '9'], // Berlin - Amsterdam
  ['6', '10'], // Austin - Toronto
  ['7', '9'], // London - Amsterdam
  ['5', '10'], // Tokyo - Toronto
  ['2', '1'], // Dubai - Singapore
  ['8', '5'], // Sydney - Tokyo
];

function MapContent({ cities, selectedCity, onCitySelect, hoveredCity, onCityHover }: MapComponentProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedCity) {
      map.flyTo([selectedCity.lat, selectedCity.lng], 5, { duration: 1 });
    }
  }, [selectedCity, map]);

  // Get city by id
  const getCityById = (id: string) => cities.find(c => c.id === id);

  return (
    <>
      {/* Connection lines */}
      {connections.map(([from, to], index) => {
        const fromCity = getCityById(from);
        const toCity = getCityById(to);
        if (!fromCity || !toCity) return null;
        
        return (
          <Polyline
            key={`${from}-${to}`}
            positions={[[fromCity.lat, fromCity.lng], [toCity.lat, toCity.lng]]}
            pathOptions={{
              color: '#667eea',
              weight: 1,
              opacity: 0.3,
              dashArray: '5, 10',
            }}
          />
        );
      })}

      {/* City markers */}
      {cities.map((city) => (
        <Marker
          key={city.id}
          position={[city.lat, city.lng]}
          icon={createCustomIcon(
            city.color,
            selectedCity?.id === city.id,
            hoveredCity === city.id
          )}
          eventHandlers={{
            click: () => onCitySelect(city),
            mouseover: () => onCityHover(city.id),
            mouseout: () => onCityHover(null),
          }}
        >
          <Popup>
            <div style={{ 
              padding: '8px', 
              minWidth: '150px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              <h4 style={{ 
                margin: '0 0 4px 0', 
                fontSize: '16px', 
                fontWeight: 600,
                color: '#1a1a2e'
              }}>
                {city.name}
              </h4>
              <p style={{ 
                margin: '0 0 8px 0', 
                fontSize: '12px', 
                color: '#666' 
              }}>
                {city.country}
              </p>
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                fontSize: '11px' 
              }}>
                <div>
                  <span style={{ color: '#10b981' }}>●</span> Growth: {city.growthPotential}%
                </div>
                <div>
                  <span style={{ color: '#f59e0b' }}>●</span> Risk: {city.riskLevel}%
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function MapComponent(props: MapComponentProps) {
  return (
    <>
      <style>{`
        .leaflet-container {
          background: #0a0a1a !important;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(26, 26, 46, 0.95) !important;
          border-radius: 12px !important;
          border: 1px solid rgba(102, 126, 234, 0.3) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
        }
        .leaflet-popup-content {
          margin: 8px !important;
          color: white !important;
        }
        .leaflet-popup-content h4 {
          color: white !important;
        }
        .leaflet-popup-content p {
          color: rgba(255,255,255,0.6) !important;
        }
        .leaflet-popup-tip {
          background: rgba(26, 26, 46, 0.95) !important;
          border: 1px solid rgba(102, 126, 234, 0.3) !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(26, 26, 46, 0.95) !important;
          color: white !important;
          border: none !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(102, 126, 234, 0.3) !important;
        }
        .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }
        .leaflet-control-attribution {
          background: rgba(26, 26, 46, 0.8) !important;
          color: rgba(255,255,255,0.4) !important;
          font-size: 10px !important;
          border-radius: 8px 0 0 0 !important;
        }
        .leaflet-control-attribution a {
          color: rgba(167, 139, 250, 0.8) !important;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      <MapContainer
        center={[30, 0]}
        zoom={2}
        style={{ height: '500px', width: '100%', borderRadius: '24px' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapContent {...props} />
      </MapContainer>
    </>
  );
}
