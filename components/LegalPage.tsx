
import React, { useState } from 'react';

interface LegalPageProps {
    onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'TERMS' | 'PRIVACY'>('TERMS');

    return (
        <div className="min-h-screen bg-[#050505] text-gray-300 font-sans p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <button onClick={onBack} className="mb-8 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                    ← Return to Campus
                </button>

                <h1 className="text-4xl font-serif font-bold text-white mb-2">Legal & Compliance</h1>
                <p className="text-sm text-gray-500 mb-8">Last Updated: March 2024</p>

                <div className="flex border-b border-white/10 mb-8">
                    <button 
                        onClick={() => setActiveTab('TERMS')}
                        className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'TERMS' ? 'border-amber-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Terms of Service
                    </button>
                    <button 
                        onClick={() => setActiveTab('PRIVACY')}
                        className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'PRIVACY' ? 'border-amber-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Privacy Policy
                    </button>
                </div>

                <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                    {activeTab === 'TERMS' ? (
                        <>
                            <h3>1. Introduction</h3>
                            <p>Welcome to The Professor ("we," "our," or "us"). By accessing or using our AI-powered academic accelerator (the "Service"), you agree to be bound by these Terms of Service.</p>

                            <h3>2. Acceptable Use</h3>
                            <p>You agree to use the Service only for lawful academic purposes. You must not:</p>
                            <ul>
                                <li>Upload illegal, harmful, or infringing content.</li>
                                <li>Attempt to reverse-engineer the neural engine or prompts.</li>
                                <li>Use the Service for academic dishonesty (e.g., generating essays to pass off as your own without citation).</li>
                            </ul>

                            <h3>3. Intellectual Property</h3>
                            <p>The content you generate via The Professor remains your intellectual property, provided you own the rights to the source material. We claim no ownership over your uploads.</p>

                            <h3>4. Payments & Credits</h3>
                            <p>Transactions for Neural Tokens (credits) and subscriptions are processed securely via Paystack. Credits are non-refundable unless required by law. Unused credits may expire after 12 months of inactivity.</p>

                            <h3>5. Disclaimer of Warranties</h3>
                            <p>The Service is provided "as is." While we strive for academic accuracy, AI models can hallucinate. Always verify critical information from primary sources.</p>

                            <h3>6. Termination</h3>
                            <p>We reserve the right to suspend accounts that violate these terms or abuse the API (e.g., DDOS attacks, script automation).</p>
                        </>
                    ) : (
                        <>
                            <h3>1. Data Collection</h3>
                            <p>We collect only the minimum data required to operate:</p>
                            <ul>
                                <li><strong>Identity:</strong> Email address and profile name (via Google or Email auth).</li>
                                <li><strong>Academic Content:</strong> Files you upload are processed in-memory by our AI engine and are not persistently stored unless you explicitly save them to your history.</li>
                                <li><strong>Usage Data:</strong> Transaction logs and gamification stats (XP, Streak).</li>
                            </ul>

                            <h3>2. Data Processing</h3>
                            <p>We use Google Gemini API for intelligence. Your text data is sent to Google for processing but is not used to train their public models (Enterprise Privacy standards apply).</p>

                            <h3>3. Cookies</h3>
                            <p>We use local storage to maintain your session and preferences. No third-party tracking cookies are used for advertising.</p>

                            <h3>4. Your Rights</h3>
                            <p>You may request full deletion of your account and data at any time via the "Danger Zone" in your profile settings. Upon deletion, all history and XP are permanently erased.</p>

                            <h3>5. Contact</h3>
                            <p>For privacy concerns, contact our Data Officer at: <a href="mailto:vexis.automations@gmail.com" className="text-blue-400">vexis.automations@gmail.com</a></p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
