
import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#18181b] w-full max-w-2xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up-fade">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/20">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-blue-500">System</span> Overview
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar text-gray-300 leading-relaxed">
          <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/20">
            <p className="font-medium text-blue-200">
              The Professor is an AI-powered academic accelerator designed to transform passive reading into active mastery.
            </p>
          </div>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">Operational Protocols</h3>
            <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
              <li>
                <strong className="text-gray-200">Ingestion:</strong> Drag and drop PDFs, DOCXs, or ZIPs. The Neural Engine extracts concepts instantly.
              </li>
              <li>
                <strong className="text-gray-200">Exam Mode:</strong> Generate interactive quizzes. Features include <span className="text-red-400">Nightmare Difficulty</span>, focus tracking, and detailed grading.
              </li>
              <li>
                <strong className="text-gray-200">Professor Mode:</strong> Activates the Feynman Tutor. Complex topics are simplified using analogies from your favorite domains (Sports, Gaming, etc.).
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">Core Modules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                <div className="text-orange-400 font-bold text-xs uppercase mb-1">The Arena</div>
                <p className="text-sm">Multiplayer competitive exams. Wager XP against peers.</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                <div className="text-amber-400 font-bold text-xs uppercase mb-1">Feynman Learning</div>
                <p className="text-sm">Learn by simplification. If you can't explain it simply, you don't understand it.</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                <div className="text-blue-400 font-bold text-xs uppercase mb-1">Neural History</div>
                <p className="text-sm">Auto-saves sessions. Revisit past exams or lectures anytime.</p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                <div className="text-purple-400 font-bold text-xs uppercase mb-1">Data Privacy</div>
                <p className="text-sm">Your documents are processed in memory and typically not stored persistently.</p>
              </div>
            </div>
          </section>

          <section>
             <p className="text-xs text-gray-500 text-center pt-4 border-t border-gray-800">
               Engine: Google Gemini Pro 1.5 & Flash. Stack: React/Supabase.
             </p>
          </section>
        </div>

        <div className="p-6 border-t border-gray-800 bg-black/20 flex justify-end">
           <button 
             onClick={onClose} 
             className="px-8 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
           >
             Acknowledge
           </button>
        </div>
      </div>
    </div>
  );
};
