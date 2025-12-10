
import React, { useState, useEffect } from 'react';

export const PWAPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user has already dismissed it recently? For now, always show if installable
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-slide-up-fade">
      <div className="bg-[#18181b] border border-amber-500/20 p-5 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
        <div className="flex items-start gap-4">
           <div className="text-3xl">📱</div>
           <div>
             <h4 className="font-serif font-bold text-amber-100 text-lg">Secure Connection?</h4>
             <p className="text-gray-400 text-xs mt-1 leading-relaxed">
               A dedicated neural link is available. Install the app for offline access and faster processing. Do not be the student who lags.
             </p>
             <div className="flex gap-3 mt-4">
               <button onClick={handleInstall} className="px-4 py-2 bg-amber-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-amber-500">Install App</button>
               <button onClick={() => setShowPrompt(false)} className="px-4 py-2 text-gray-500 hover:text-white text-xs font-bold uppercase">Dismiss</button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
