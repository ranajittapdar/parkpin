
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
      // Initialize Leaflet map with optimized settings
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: false
      }).setView([data.latitude, data.longitude], 17);

      // Using a modern, clean tile set
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(leafletMap.current);

      // High-quality custom pin icon
      const customIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping"></div>
            <div class="relative flex flex-col items-center">
              <div class="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-blue-600">
                <i class="fa-solid fa-car text-blue-600 text-lg"></i>
              </div>
              <div class="w-1 h-2 bg-blue-600"></div>
            </div>
          </div>`,
        iconSize: [48, 56],
        iconAnchor: [24, 56]
      });

      // Add marker
      L.marker([data.latitude, data.longitude], { icon: customIcon }).addTo(leafletMap.current);

      // Add accuracy circle
      L.circle([data.latitude, data.longitude], {
        color: '#1D56CF',
        fillColor: '#1D56CF',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '5, 5',
        radius: 40
      }).addTo(leafletMap.current);
    } else if (leafletMap.current) {
      // Update existing map view
      leafletMap.current.panTo([data.latitude, data.longitude]);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [data.latitude, data.longitude]);

  const handleRecenter = () => {
    if (leafletMap.current) {
      leafletMap.current.setView([data.latitude, data.longitude], 17, { animate: true });
    }
  };

  return (
    <div className="w-full mt-2 relative group">
      <div className="map-container shadow-xl border border-gray-100/50 relative overflow-hidden bg-gray-100">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Info Overlay */}
        <div className="absolute top-3 left-3 z-[1000] bg-white/80 backdrop-blur-lg px-3 py-1.5 rounded-2xl text-[10px] font-bold text-gray-700 shadow-sm border border-white/50 flex items-center gap-2">
          <i className="fa-solid fa-satellite-dish text-blue-500"></i>
          <span>GPS Signal Active</span>
        </div>

        {/* Recenter Button */}
        <button 
          onClick={handleRecenter}
          className="absolute bottom-3 right-3 z-[1000] w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center active:scale-90 transition-transform text-blue-600 border border-gray-100"
        >
          <i className="fa-solid fa-location-crosshairs"></i>
        </button>
      </div>
    </div>
  );
};

export default MapPreview;
