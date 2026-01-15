
import React, { useEffect, useState } from 'react';
import { AdMob, BannerAdPosition, BannerAdSize, BannerAdPluginEvents } from '@capacitor-community/admob';

const AD_UNITS = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  NATIVE: 'ca-app-pub-3940256099942544/2247696110' 
};

// Helper to check if we are in a native app environment
const isNative = () => {
  return (window as any).Capacitor?.isNativePlatform();
};

export const BannerAd: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isNative()) {
      setIsLoaded(true); // Show web placeholder
      return;
    }

    const showBanner = async () => {
      try {
        await AdMob.showBanner({
          adId: AD_UNITS.BANNER,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: true 
        });
        
        AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
          setIsLoaded(true);
        });
      } catch (e) {
        console.warn("AdMob Banner not available in this environment.");
      }
    };

    showBanner();

    return () => {
      if (isNative()) {
        try { AdMob.removeBanner(); } catch(e) {}
      }
    };
  }, []);

  if (!isNative()) {
    return (
      <div className="fixed bottom-0 left-0 w-full h-[60px] bg-white border-t border-gray-100 flex items-center justify-center z-50 shadow-lg">
        <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Sponsored Content</div>
      </div>
    );
  }

  return <div className="h-[60px] w-full" />;
};

export const NativeAd: React.FC = () => {
  return (
    <div className="w-full mt-2 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col gap-3 relative overflow-hidden">
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-1.5">
           <span className="text-[9px] font-black text-white bg-yellow-500 px-1.5 py-0.5 rounded shadow-sm">AD</span>
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sponsored</span>
         </div>
         <i className="fa-solid fa-circle-info text-gray-200 text-xs"></i>
      </div>
      
      <div className="flex gap-4 items-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
           <i className="fa-solid fa-car-side text-parkpin-primary text-xl opacity-40"></i>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-gray-800 leading-tight truncate">Premium Parking Services</div>
          <p className="text-[11px] text-gray-500 leading-snug mt-1 line-clamp-2">Looking for covered parking? Find premium spots nearby.</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <i className="fa-solid fa-star text-yellow-400 text-[8px]"></i>
          <span className="text-[10px] font-bold text-gray-400 ml-1">4.9</span>
        </div>
        <button className="h-9 px-6 bg-parkpin-primary text-white text-xs font-black rounded-xl shadow-lg active:scale-95 transition-transform">
          VIEW
        </button>
      </div>
    </div>
  );
};
