
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ParkingData, AppStatus } from './types';
import MapPreview from './components/MapPreview';

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
        const msg = err.code === 1 ? 'Allow location access' : 'Unable to find GPS signal';
        setError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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

    // Call Android bridge if available
    if ((window as any).Android?.navigateBack) {
      try {
        (window as any).Android.navigateBack();
      } catch (e) {
        console.error("Android bridge error:", e);
      }
    }

    // Continue with existing navigation logic
    const url = `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`;
    window.open(url, '_blank');
  };

  const handleShare = useCallback(async () => {
    const shareText = "📍 Never lose your car again! Tired of wandering parking lots like a goldfish trying to remember things? 🐟 ParkPin saves your parking spot in one tap — download it free!";
    const shareUrl = "https://play.google.com/store/apps/details?id=com.parkpin.parkingapp";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ParkPin',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      const fullMessage = `${shareText} ${shareUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, '_blank');
    }
  }, []);

  const formatTime = (ts: number) => {
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(ts));
  };

  return (
    <div className={`max-w-md mx-auto min-h-screen flex flex-col bg-[#FDF9F2] pt-[var(--safe-area-inset-top)] pb-10`}>
      
      {/* App Header */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-30 bg-[#FDF9F2]/95 backdrop-blur-xl border-b border-gray-100/50">
        <div className="flex items-center gap-3">
          <div className="parkpin-logo-mark"></div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center">
            Park<span className="text-[#da3a2c]">P</span>in
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100 active:scale-90 transition-all shadow-sm"
            title="Share App"
          >
            <i className="fa-solid fa-share-nodes text-sm"></i>
          </button>
          <a 
            href="https://ko-fi.com/supportparkpindev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-100 active:scale-90 transition-all shadow-sm"
            title="Buy me a coffee"
          >
            <i className="fa-solid fa-mug-hot text-sm"></i>
          </a>
          {status === AppStatus.PARKED && (
            <button 
              onClick={handleClear} 
              className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-2xl border border-red-100 active:scale-95 transition-all shadow-sm"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 flex flex-col">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handlePhotoUpload} 
        />

        {status === AppStatus.IDLE || (status === AppStatus.LOADING && !data) ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-12 py-10 animate-fade-in-up">
            <div className="w-40 h-40 bg-white rounded-[3rem] shadow-2xl shadow-blue-100 flex items-center justify-center border border-gray-50 relative">
              <div className="absolute inset-0 bg-blue-500/5 rounded-[3rem] animate-pulse"></div>
              <i className="fa-solid fa-location-dot text-6xl text-parkpin-primary relative z-10"></i>
            </div>
            
            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Ready to Park?</h2>
              <p className="text-xs text-gray-400 font-bold w-full mx-auto leading-relaxed uppercase tracking-widest whitespace-nowrap">
                Pin your parking. Find it fast.
              </p>
            </div>

            <button 
              onClick={handleSaveLocation} 
              disabled={status === AppStatus.LOADING}
              className="w-full h-20 bg-parkpin-primary text-white rounded-[2.2rem] font-black text-xl shadow-2xl shadow-blue-300 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-70"
            >
              {status === AppStatus.LOADING ? (
                <i className="fa-solid fa-circle-notch animate-spin text-2xl"></i>
              ) : (
                <>
                  <i className="fa-solid fa-thumbtack"></i>
                  <span>PIN MY SPOT</span>
                </>
              )}
            </button>
            
            {error && (
              <div className="px-6 py-3 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-red-500"></i>
                <p className="text-red-600 text-[10px] font-black uppercase">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full py-6 space-y-6 animate-fade-in-up">
            {showToast && (
              <div className="fixed top-24 left-6 right-6 z-50 bg-green-500 text-white p-4 rounded-3xl text-center font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-green-200 animate-bounce">
                Spot Locked • {formatTime(data!.timestamp)}
              </div>
            )}
            
            <div className="bg-white p-6 rounded-[2.8rem] shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live View</span>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                  Parked at {formatTime(data!.timestamp)}
                </span>
              </div>
              
              <MapPreview data={data!} />
              
              <div className="space-y-4">
                {data?.photo ? (
                  <div className="relative rounded-3xl overflow-hidden h-52 bg-gray-50 border border-gray-100 shadow-inner group">
                    <img src={data.photo} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="Parking memo" />
                    <button 
                      onClick={() => {
                        const updated = { ...data, photo: undefined };
                        setData(updated);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                      }} 
                      className="absolute top-3 right-3 w-10 h-10 bg-white/40 backdrop-blur-md rounded-full text-white flex items-center justify-center border border-white/20 active:scale-90 transition-all"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full h-28 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-2 active:bg-blue-50/50 active:border-blue-200 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-active:bg-blue-100 transition-colors">
                      <i className="fa-solid fa-camera text-lg"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Photo Reminder</span>
                  </button>
                )}
              </div>

              <button 
                onClick={openNavigation} 
                className="w-full h-[72px] bg-parkpin-primary text-white rounded-[1.8rem] font-black shadow-xl shadow-blue-100 flex items-center justify-center gap-4 active:scale-95 transition-all text-lg"
              >
                <i className="fa-solid fa-location-arrow text-xl"></i>
                NAVIGATE BACK
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
