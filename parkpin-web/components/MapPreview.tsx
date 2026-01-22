import React, { useEffect, useRef } from 'react';
import { ParkingData } from '../types';

interface MapPreviewProps {
  data: ParkingData;
}

declare const L: any;

const MapPreview: React.FC<MapPreviewProps> = ({ data }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      // Initialize Leaflet map
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([data.latitude, data.longitude], 17);

      // Add high-quality light-themed tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(leafletMap.current);

      // Create a custom pin icon using FontAwesome
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-10px);">
                <i class="fa-solid fa-location-dot" style="color: #da3a2c; font-size: 32px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></i>
                <div style="width: 8px; height: 8px; background: rgba(0,0,0,0.1); border-radius: 50%; margin-top: -4px;"></div>
              </div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      // Add marker
      L.marker([data.latitude, data.longitude], { icon: customIcon }).addTo(leafletMap.current);

      // Add a decorative accuracy circle
      L.circle([data.latitude, data.longitude], {
        color: '#1D56CF',
        fillColor: '#1D56CF',
        fillOpacity: 0.1,
        weight: 1,
        radius: 30
      }).addTo(leafletMap.current);
    } else if (leafletMap.current) {
      // Update existing map view if data changes
      leafletMap.current.setView([data.latitude, data.longitude], 17);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [data.latitude, data.longitude]);

  return (
    <div className="w-full mt-2">
      <div className="map-container shadow-md border border-gray-100 relative overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Overlay info */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black text-gray-800 shadow-sm border border-gray-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
        </div>
      </div>
    </div>
  );
};

export default MapPreview;
