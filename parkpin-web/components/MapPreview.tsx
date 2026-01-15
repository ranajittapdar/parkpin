
import React from 'react';
import { ParkingData } from '../types';

interface MapPreviewProps {
  data: ParkingData;
}

const MapPreview: React.FC<MapPreviewProps> = ({ data }) => {
  // Using static map image placeholder for simulation
  const mapUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${data.latitude}${data.longitude}`;
  
  return (
    <div className="w-full mt-4">
      <div className="map-container shadow-inner border border-gray-200 relative bg-blue-50 overflow-hidden flex items-center justify-center">
        {/* Simulating a map grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#1D56CF 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
        
        {/* Location Pin */}
        <div className="relative flex flex-col items-center">
          <div className="animate-bounce mb-1">
            <i className="fa-solid fa-location-dot text-4xl text-red-500 drop-shadow-md"></i>
          </div>
          <div className="bg-white px-2 py-1 rounded-full text-[10px] font-bold shadow-sm border border-gray-100">
            {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
          </div>
        </div>

        <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-gray-500">
          Raw GPS Active
        </div>
      </div>
    </div>
  );
};

export default MapPreview;
