import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ParkingData, AppStatus } from './types';
import MapPreview from './components/MapPreview';
import { BannerAd, NativeAd } from './components/AdSpace';
import { AdMob } from '@capacitor-community/admob';

const STORAGE_KEY = 'parkpin_v2_storage';
const EXPIRY_MS = 43200000; // 12 hours

const App: React.FC = () => {
  const [data, setData] = useState<ParkingData | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.LOADING);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initializeApp = async () => {
      if ((window as any).Capacitor?.isNativePlatform()) {
        try {
          await AdMob.initialize();
        } catch (e) {
          console.warn('AdMob skipped');
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed: ParkingData = JSON.parse(saved);
          if (Date.now() - parsed.timestamp > EXPIRY_MS) {
            handleClear();
          } else {
            setData(parsed);
            setStatus(AppStatus.PARKED);
          }
        } catch (err) {
          handleClear();
        }
      } else {
        setStatus(AppStatus.IDLE);
      }
    };
    initializeApp();
  }, []);

  const handleClear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(null);
    setStatus(AppStatus.IDLE);
    setError(null);
  }, []);

  const handleSaveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS not supported');
      return;
    }

    setStatus(AppStatus.LOADING);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newItem: ParkingData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItem));
        setData(newItem);
        setStatus(AppStatus.PARKED);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      },
      (err) => {
        setStatus(AppStatus.IDLE);
        setError(err.code === 1 ? 'Enable location permissions' : 'GPS signal lost');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && data) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const updated = { ...data, photo: base64 };
        setData(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      };
      reader.readAsDataURL(file);
    }
  };

  const openNavigation = () => {
    if (!data) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`, '_blank');
  };

  return (
    <div className={`max-w-md mx-auto min-h-screen flex flex-col bg-[#FDF9F2] pt-[var(--safe-area-inset-top)] ${status === AppStatus.PARKED ? 'pb-24' : 'pb-6'}`}>
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-30 bg-[#FDF9F2]/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="parkpin-logo-mark"></div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            Park<span style={{ color: '#da3a2c' }}>P</span>in
          </h1>
        </div>
        {status === AppStatus.PARKED && (
          <button 
            onClick={handleClear} 
            className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-xl border border-red-100 active:scale-95 transition-all"
          >
            Clear
          </button>
        )}
      </header>

      <main className="flex-1 px-6 flex flex-col items-center">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handlePhotoUpload} 
        />

        {status === AppStatus.IDLE || (status === AppStatus.LOADING && !data) ? (
          <div className="w-full pt-16 flex flex-col items-center space-y-10 text-center animate-fade-in-up">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center border border-gray-50">
              <i className="fa-solid fa-location-dot text-5xl text-parkpin-primary"></i>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-black text-gray-800 uppercase">Save Your Spot</h2>
              <p className="text-xs text-gray-400 px-10 leading-relaxed">Pin your parking. Find it fast.</p>
            </div>
            <button 
              onClick={handleSaveLocation} 
              className="w-full h-20 bg-parkpin-primary text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center"
            >
              {status === AppStatus.LOADING ? <i className="fa-solid fa-circle-notch animate-spin text-2xl"></i> : "PIN LOCATION"}
            </button>
            {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}
          </div>
        ) : (
          <div className="w-full py-4 space-y-6 animate-fade-in-up">
            {showToast && (
              <div className="bg-green-500 text-white p-4 rounded-2xl text-center font-black text-xs uppercase tracking-widest shadow-lg">
                Location Secured
              </div>
            )}
            
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <MapPreview data={data!} />
              
              <div className="space-y-3">
                {data?.photo ? (
                  <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-50 border border-gray-100 shadow-inner">
                    <img src={data.photo} className="w-full h-full object-cover" alt="Parking memo" />
                    <button 
                      onClick={() => {
                        const updated = { ...data, photo: undefined };
                        setData(updated);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                      }} 
                      className="absolute top-2 right-2 w-9 h-9 bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full h-24 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-1 active:bg-gray-50 transition-colors"
                  >
                    <i className="fa-solid fa-camera text-xl"></i>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Add Photo Reminder</span>
                  </button>
                )}
              </div>

              <NativeAd />

              <button 
                onClick={openNavigation} 
                className="w-full h-18 bg-parkpin-primary text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-location-arrow text-xl"></i>
                NAVIGATE BACK
              </button>
            </div>
          </div>
        )}
      </main>

      {status === AppStatus.PARKED && <BannerAd />}
    </div>
  );
};

export default App;