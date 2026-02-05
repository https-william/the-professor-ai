
import React, { useState, useEffect } from 'react';

export const PWAPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if previously dismissed in the last 14 days
    const dismissedTs = localStorage.getItem('pwa_dismissed_ts');
    if (dismissedTs) {
      const days = (Date.now() - parseInt(dismissedTs)) / (1000 * 60 * 60 * 24);
      if (days < 14) {
        setIsDismissed(true);
        return;
      }
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Delay showing the prompt to allow user to settle in (Subtle friction reduction)
      setTimeout(() => {
        if (!isDismissed) setShowPrompt(true);
      }, 10000); 
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isDismissed]);

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

  const handleDismiss = () => {
      setShowPrompt(false);
      // Save dismissal timestamp
      localStorage.setItem('pwa_dismissed_ts', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-slide-up-fade">
      <div className="bg-[#18181b]/90 backdrop-blur-md border border-amber-500/20 p-5 rounded-2xl shadow-2xl relative overflow-hidden group hover:border-amber-500/40 transition-colors">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
        <div className="flex items-start gap-4">
           <div className="text-3xl text-amber-500 bg-amber-900/20 p-2 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
           </div>
           <div>
             <h4 className="font-serif font-bold text-amber-100 text-sm">Dedicated Neural Link</h4>
             <p className="text-gray-400 text-[10px] mt-1 leading-relaxed">
               Install the App for faster processing and fullscreen focus mode.
             </p>
             <div className="flex gap-3 mt-3">
               <button onClick={handleInstall} className="px-4 py-2 bg-amber-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-amber-500 shadow-lg">Install</button>
               <button onClick={handleDismiss} className="px-4 py-2 text-gray-500 hover:text-white text-[10px] font-bold uppercase">Later</button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
