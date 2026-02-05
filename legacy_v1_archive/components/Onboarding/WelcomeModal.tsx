
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { saveUserToSupabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface WelcomeModalProps {
  onComplete: (data: Partial<UserProfile>) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Use the name from AuthContext (which comes from metadata/db) or fallback
  const displayName = user?.displayName || user?.profile?.alias || 'Scholar';

  const handleStart = async () => {
      setIsLoading(true);
      
      const updateData = {
          has_completed_onboarding: true, // DB Field
          hasCompletedOnboarding: true // Local Field
      };

      try {
        if (user) {
            // Force DB update immediately
            await saveUserToSupabase(user.uid, updateData);
        } else {
            // Guest Mode Persistence
            localStorage.setItem('app_onboarding_completed', 'true');
        }
        
        // Add a small delay for effect
        setTimeout(() => {
            onComplete(updateData);
            setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error("Onboarding Save Failed", error);
        // Fallback to local state update so user isn't stuck
        onComplete(updateData);
        setIsLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#050505]/98 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center">
        
        {/* ID Card Header */}
        <div className="w-full h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 absolute top-0 left-0"></div>
        
        <div className="mb-8 relative">
            <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-4 relative overflow-hidden group">
                 <span className="text-3xl font-bold text-white uppercase">{displayName[0]}</span>
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Welcome, {displayName}</h2>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Scholar Registration Protocol</p>
        </div>

        <div className="w-full space-y-6">
            <button
                onClick={handleStart}
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] bg-white text-black hover:bg-gray-200 transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-black rounded-full animate-ping"></span>
                        Initializing...
                    </span>
                ) : 'Enter System'}
            </button>
            
            <button 
                onClick={() => setShowInfo(!showInfo)}
                className="text-[10px] text-gray-600 hover:text-white transition-colors uppercase tracking-wider flex items-center justify-center gap-1 mx-auto"
            >
                <span>What is this system?</span>
                <span className={`transform transition-transform ${showInfo ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showInfo && (
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-left text-xs text-gray-400 leading-relaxed animate-slide-up-fade">
                    <p className="mb-2"><strong className="text-white">The Professor</strong> is your AI academic accelerator.</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Upload docs to generate <strong>Exams</strong>.</li>
                        <li>Use <strong>Professor Mode</strong> for simple explanations.</li>
                        <li>Fight in <strong>The Arena</strong> to earn XP.</li>
                    </ul>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
