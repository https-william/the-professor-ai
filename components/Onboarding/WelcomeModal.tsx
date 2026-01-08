
import React, { useState } from 'react';
import { UserProfile } from '../../types';

interface WelcomeModalProps {
  onComplete: (data: Partial<UserProfile>) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    alias: '',
    school: '',
    academicLevel: '',
    studyReminders: false,
    reminderTime: '20:00'
  });

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else onComplete(formData);
  };

  const isStepValid = () => {
    if (step === 1) return formData.alias?.trim().length! > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-500" style={{ width: `${(step / 2) * 100}%` }}></div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
            {step === 1 ? "Identity" : "Calibration"}
          </h2>
          <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">
             Step {step} of 2
          </p>
        </div>

        <div className="flex-1 space-y-6">
            {step === 1 && (
                <div className="space-y-4 animate-slide-in">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Codename</label>
                        <input
                            type="text"
                            value={formData.alias}
                            onChange={(e) => setFormData({...formData, alias: e.target.value})}
                            placeholder="e.g. Scholar"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-blue-500 outline-none font-bold text-lg text-center"
                            autoFocus
                        />
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4 animate-slide-in">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-400 mb-2 block tracking-wider">Academic Level</label>
                        <input
                            type="text"
                            value={formData.academicLevel}
                            onChange={(e) => setFormData({...formData, academicLevel: e.target.value})}
                            placeholder="e.g. Undergraduate, Year 2"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none text-sm"
                        />
                    </div>
                    
                    <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={formData.studyReminders} 
                            onChange={(e) => setFormData({...formData, studyReminders: e.target.checked})}
                            className="w-5 h-5 rounded accent-blue-500"
                        />
                        <div>
                            <span className="text-sm text-white font-medium block">Daily Reminders</span>
                            <span className="text-xs text-gray-500">Keep my streak alive.</span>
                        </div>
                    </label>
                </div>
            )}
        </div>

        <div className="mt-8 flex justify-between items-center">
            {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="text-gray-500 hover:text-white font-bold text-xs uppercase tracking-widest px-4 py-2">Back</button>
            ) : <div></div>}
            
            <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isStepValid() ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
            >
                {step === 2 ? 'Initialize' : 'Next →'}
            </button>
        </div>
      </div>
    </div>
  );
};
