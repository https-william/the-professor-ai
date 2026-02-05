
import React, { useState } from 'react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'TERMS' | 'PRIVACY'>('TERMS');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#0f0f10] w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up-fade">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-bold text-white font-display">Legal & Compliance</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="flex border-b border-white/5 bg-black/20">
            <button 
                onClick={() => setActiveTab('TERMS')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'TERMS' ? 'text-amber-500 bg-white/5 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Terms of Service
            </button>
            <button 
                onClick={() => setActiveTab('PRIVACY')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'PRIVACY' ? 'text-amber-500 bg-white/5 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Privacy Policy
            </button>
        </div>

        <div className="overflow-y-auto p-8 custom-scrollbar text-gray-300 leading-relaxed space-y-6 text-sm">
            {activeTab === 'TERMS' ? (
                <>
                    <div>
                        <h3 className="text-white font-bold mb-2">1. Introduction</h3>
                        <p>Welcome to The Professor ("we," "our," or "us"). By accessing or using our AI-powered academic accelerator (the "Service"), you agree to be bound by these Terms of Service.</p>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-2">2. Acceptable Use</h3>
                        <p>You agree to use the Service only for lawful academic purposes. You must not:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                            <li>Upload illegal, harmful, or infringing content.</li>
                            <li>Attempt to reverse-engineer the neural engine or prompts.</li>
                            <li>Use the Service for academic dishonesty (e.g., generating essays to pass off as your own without citation).</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-2">3. Intellectual Property</h3>
                        <p>The content you generate via The Professor remains your intellectual property, provided you own the rights to the source material. We claim no ownership over your uploads.</p>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-2">4. Payments & Credits</h3>
                        <p>Transactions for Neural Tokens (credits) and subscriptions are processed securely via Paystack. Credits are non-refundable unless required by law. Unused credits may expire after 12 months of inactivity.</p>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-2">5. Disclaimer</h3>
                        <p>The Service is provided "as is." While we strive for academic accuracy, AI models can hallucinate. Always verify critical information from primary sources.</p>
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <h3 className="text-white font-bold mb-2">1. Data Collection</h3>
                        <p>We collect only the minimum data required to operate:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                            <li><strong>Identity:</strong> Email address and profile name (via Google or Email auth).</li>
                            <li><strong>Academic Content:</strong> Files you upload are processed in-memory by our AI engine and are not persistently stored unless you explicitly save them to your history.</li>
                            <li><strong>Usage Data:</strong> Transaction logs and gamification stats.</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-2">2. AI Processing</h3>
                        <p>We use Google Gemini API for intelligence. Your text data is sent to Google for processing but is not used to train their public models (Enterprise Privacy standards apply).</p>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-2">3. Your Rights</h3>
                        <p>You may request full deletion of your account and data at any time via the "Danger Zone" in your profile settings.</p>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-2">4. Contact</h3>
                        <p>For privacy concerns, contact our Data Officer at: <a href="mailto:vexis.automations@gmail.com" className="text-blue-400">vexis.automations@gmail.com</a></p>
                    </div>
                </>
            )}
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end">
           <button 
             onClick={onClose} 
             className="px-8 py-2 bg-white text-black rounded-xl font-bold uppercase text-xs hover:bg-gray-200 transition-colors"
           >
             Acknowledge
           </button>
        </div>
      </div>
    </div>
  );
};
