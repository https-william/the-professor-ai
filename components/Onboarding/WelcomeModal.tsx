
import React, { useState } from 'react';
import { UserProfile } from '../../types';

interface WelcomeModalProps {
  onComplete: (data: Partial<UserProfile>) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    alias: '',
    fullName: '',
    age: '',
    school: '',
    academicLevel: '',
    country: '',
    studyReminders: false,
    reminderTime: '20:00',
    ambientTheme: 'Deep Space', // Forced Default
    socials: {
      whatsapp: '',
      telegram: '',
      instagram: '',
      snapchat: ''
    }
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(formData);
  };

  const isStepValid = () => {
    if (step === 1) return formData.alias?.trim().length! > 0;
    if (step === 2) return true; 
    if (step === 3) return true; 
    return true;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="glass-panel border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">
                {step === 1 && '🎓'}
                {step === 2 && '🪪'}
                {step === 3 && '🌐'}
            </span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
            {step === 1 && "Identification"}
            {step === 2 && "Academic Profile"}
            {step === 3 && "Network Protocols"}
          </h2>
          <p className="text-gray-500 text-xs mt-2 font-mono uppercase tracking-widest">
             Step {step} of 3
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-4">
            {/* STEP 1: Identity */}
            {step === 1 && (
                <div className="space-y-6 animate-slide-in">
                    <p className="text-sm text-gray-400 text-center leading-relaxed">
                        I am The Professor. To enroll in my class, I must know who you are.
                        Choose an alias for the leaderboards.
                    </p>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wider">Codename (Alias)</label>
                        <input
                            type="text"
                            value={formData.alias}
                            onChange={(e) => setFormData({...formData, alias: e.target.value})}
                            placeholder="e.g. The Architect"
                            className="w-full bg-black/40 border border-blue-500/50 rounded-xl px-4 py-4 text-white focus:bg-white/5 outline-none font-bold text-xl text-center placeholder-gray-700"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wider">Full Name (Private)</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            placeholder="John Doe"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none placeholder-gray-700"
                        />
                    </div>
                </div>
            )}

            {/* STEP 2: Demographics */}
            {step === 2 && (
                <div className="space-y-5 animate-slide-in">
                    <p className="text-sm text-gray-400 text-center leading-relaxed">
                        Help me tailor your curriculum. This data helps me understand your context.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wider">Age</label>
                            <input
                                type="text"
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: e.target.value})}
                                placeholder="21"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none placeholder-gray-700"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wider">Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({...formData, country: e.target.value})}
                                placeholder="Nigeria"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none placeholder-gray-700"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wider">School / Institution</label>
                        <input
                            type="text"
                            value={formData.school}
                            onChange={(e) => setFormData({...formData, school: e.target.value})}
                            placeholder="University of Lagos"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none placeholder-gray-700"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wider">Level / Class</label>
                        <input
                            type="text"
                            value={formData.academicLevel}
                            onChange={(e) => setFormData({...formData, academicLevel: e.target.value})}
                            placeholder="300 Level"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none placeholder-gray-700"
                        />
                    </div>
                    
                    <div className="pt-4 border-t border-white/5">
                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={formData.studyReminders} 
                                onChange={(e) => setFormData({...formData, studyReminders: e.target.checked})}
                                className="w-5 h-5 rounded accent-blue-500"
                            />
                            <span className="text-sm text-white font-medium">Enable Study Reminders?</span>
                        </label>
                        {formData.studyReminders && (
                            <div className="mt-3 animate-slide-up-fade">
                                <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wider">Preferred Time</label>
                                <input 
                                    type="time" 
                                    value={formData.reminderTime}
                                    onChange={(e) => setFormData({...formData, reminderTime: e.target.value})}
                                    className="bg-black/40 border border-white/10 text-white rounded-xl px-4 py-2 w-full outline-none focus:border-blue-500"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 3: Socials */}
            {step === 3 && (
                <div className="space-y-5 animate-slide-in">
                    <p className="text-sm text-gray-400 text-center leading-relaxed">
                        Connect your networks. (Optional)
                    </p>
                    <div className="space-y-4">
                        {['whatsapp', 'telegram', 'instagram', 'snapchat'].map((social) => (
                             <div key={social} className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 uppercase text-[10px] font-bold w-20 group-focus-within:text-blue-400 transition-colors">
                                    {social}
                                </div>
                                <input
                                    type="text"
                                    value={(formData.socials as any)[social]}
                                    onChange={(e) => setFormData({...formData, socials: { ...formData.socials, [social]: e.target.value }})}
                                    placeholder="@username"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-28 pr-4 py-3.5 text-white focus:border-blue-500 outline-none font-mono text-sm placeholder-gray-800 transition-all"
                                />
                             </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
            {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="text-gray-500 hover:text-white font-bold text-xs uppercase tracking-widest px-4 py-2 transition-colors">
                    Back
                </button>
            ) : <div></div>}
            
            <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg ${
                    isStepValid() 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105' 
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
            >
                {step === 3 ? 'Initialize Student' : 'Next Step →'}
            </button>
        </div>

      </div>
    </div>
  );
};
