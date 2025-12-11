
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
    ambientTheme: 'Deep Space', 
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
                            placeholder="Student Name"
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
                                placeholder="Age"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none placeholder-gray-700"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wider">Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({...formData, country: e.target.value})}
                                placeholder="Country"
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
                            placeholder="University / College"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none placeholder-gray-700"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block tracking-wider">Level / Class</label>
                        <input
                            type="text"
                            value={formData.academicLevel}
                            onChange={(e) => setFormData({...formData, academicLevel: e.target.value})}
                            placeholder="Undergraduate / High School"
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
                        {[
                            { id: 'whatsapp', label: 'WhatsApp', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z"/></svg> },
                            { id: 'telegram', label: 'Telegram', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0011.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
                            { id: 'instagram', label: 'Instagram', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                            { id: 'snapchat', label: 'Snapchat', icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.003 2c-3.084 0-5.467 2.196-5.467 4.939 0 1.25.663 2.454 1.638 3.327-.123.407-.373 1.356-.837 2.052-1.393.21-2.276.516-2.583.714-.728.472-.658 1.253.02 1.744.417.303 1.135.534 2.223.771.135.293.332.747.332.747.792 1.796 2.64 2.768 4.673 2.768 2.036 0 3.882-.972 4.675-2.768 0 0 .197-.454.331-.747 1.09-.237 1.808-.468 2.223-.771.679-.491.75-1.272.02-1.744-.306-.198-1.189-.504-2.582-.714-.465-.696-.715-1.645-.838-2.052.975-.873 1.637-2.077 1.637-3.327C17.469 4.196 15.086 2 12.003 2z"/></svg> }
                        ].map(({ id, label, icon }) => (
                             <div key={id} className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-8 h-8 flex items-center justify-center group-focus-within:text-blue-400 transition-colors">
                                    {icon}
                                </div>
                                <input
                                    type="text"
                                    value={(formData.socials as any)[id]}
                                    onChange={(e) => setFormData({...formData, socials: { ...formData.socials, [id]: e.target.value }})}
                                    placeholder={label}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-14 pr-4 py-3.5 text-white focus:border-blue-500 outline-none font-mono text-sm placeholder-gray-800 transition-all"
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
