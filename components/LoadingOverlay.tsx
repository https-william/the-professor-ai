
import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  status: string;
  type: 'EXAM' | 'PROFESSOR';
  onCancel?: () => void;
}

const STEPS_EXAM = [
    "Establishing Neural Link...",
    "Scanning Document Structure...",
    "Extracting Key Concepts...",
    "Filtering for Relevance...",
    "Constructing Questions...",
    "Verifying Answers...",
    "Calibrating Difficulty...",
    "Finalizing Exam Paper..."
];

const STEPS_PROFESSOR = [
    "Initializing Feynman Protocol...",
    "Parsing Content...",
    "Identifying Core Principles...",
    "Generating Analogies...",
    "Structuring Lesson Plan...",
    "Synthesizing Speech Patterns...",
    "Optimizing for Retention..."
];

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status, type, onCancel }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const isProfessor = type === 'PROFESSOR';
  const steps = isProfessor ? STEPS_PROFESSOR : STEPS_EXAM;

  useEffect(() => {
    const interval = setInterval(() => {
        setStepIndex(prev => {
            if (prev < steps.length - 1) {
                setLogs(l => [...l, `[NEURAL]: ${steps[prev]}`]);
                return prev + 1;
            }
            return prev;
        });
    }, 1500);

    return () => clearInterval(interval);
  }, [steps]);

  const currentStep = stepIndex < steps.length ? steps[stepIndex] : "Finalizing...";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-xl animate-fade-in p-6 font-mono">
      
      {/* Central Visual */}
      <div className="relative w-32 h-32 mb-10">
         <div className={`absolute inset-0 border-4 border-t-transparent rounded-full animate-spin ${isProfessor ? 'border-amber-500' : 'border-blue-500'}`}></div>
         <div className={`absolute inset-4 border-4 border-b-transparent rounded-full animate-spin-reverse opacity-50 ${isProfessor ? 'border-amber-300' : 'border-blue-300'}`}></div>
         <div className="absolute inset-0 flex items-center justify-center text-white">
             {/* Dynamic Center Icon */}
             {isProfessor ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 animate-pulse text-amber-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
                 </svg>
             ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 animate-pulse text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                 </svg>
             )}
         </div>
      </div>

      <div className="w-full max-w-md">
          <h2 className="text-xl text-white font-bold text-center mb-6 uppercase tracking-widest animate-pulse">
              {currentStep}
          </h2>

          {/* Terminal Output */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-4 h-48 overflow-y-auto custom-scrollbar flex flex-col-reverse shadow-inner">
              {logs.map((log, i) => (
                  <div key={i} className="text-[10px] text-green-400 mb-1 font-mono opacity-80">
                      <span className="opacity-50 mr-2">{new Date().toLocaleTimeString()}</span>
                      {log}
                  </div>
              ))}
              <div className="text-[10px] text-gray-500 italic mb-2">System Initialized...</div>
          </div>
      </div>

      <button 
        onClick={onCancel}
        className="mt-8 text-gray-600 text-xs uppercase tracking-widest hover:text-white transition-colors"
      >
        Cancel Process
      </button>
    </div>
  );
};
