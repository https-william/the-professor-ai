import React, { useState } from 'react';
import { ProfessorState } from '../types';

interface ProfessorViewProps {
  state: ProfessorState;
  onExit: () => void;
  timeRemaining: number | null;
}

export const ProfessorView: React.FC<ProfessorViewProps> = ({ state, onExit, timeRemaining }) => {
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const sections = state.sections;
  const currentSection = sections[currentSectionIdx];
  const progress = ((currentSectionIdx + 1) / sections.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyContent = () => {
    const text = `${currentSection.title}\n\n${currentSection.content}\n\nAnalogy: ${currentSection.analogy}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 relative z-10">
      {/* Professor Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg shadow-amber-900/20">
              <span className="text-xl">👨‍🏫</span>
           </div>
           <div>
             <h2 className="text-lg font-bold text-gray-200">The Professor</h2>
             <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-mono">
                <span>Part {currentSectionIdx + 1}/{sections.length}</span>
                {timeRemaining !== null && (
                  <>
                    <span className="text-gray-700">•</span>
                    <span className={`${timeRemaining < 60 ? 'text-red-400' : 'text-gray-500'}`}>
                       {formatTime(timeRemaining)}
                    </span>
                  </>
                )}
             </div>
           </div>
        </div>
        <button onClick={onExit} className="text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
          Exit Class
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-white/5 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-amber-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Content Card */}
      <div className="glass-panel rounded-[2rem] p-8 sm:p-16 relative overflow-hidden transition-transform duration-500 animate-slide-up-fade">
         
         {/* Copy Button */}
         <button 
           onClick={copyContent} 
           className={`absolute top-8 right-8 p-2 rounded-lg transition-all duration-300 hover:bg-white/10 ${copied ? 'text-green-400' : 'text-gray-600 hover:text-white'}`}
           title="Copy Lesson Content"
         >
            {copied ? (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span className="text-xs font-bold uppercase">Copied</span>
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
         </button>

         <div key={currentSection.id} className="animate-fade-in">
             <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-10 leading-tight">
               {currentSection.title}
             </h1>

             <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed font-light mb-12 border-l-2 border-white/10 pl-6">
               {currentSection.content}
             </div>

             <div className="grid grid-cols-1 gap-6">
               {/* Analogy Box */}
               <div className="bg-amber-900/10 p-8 rounded-2xl border border-amber-500/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                 </div>
                 <h4 className="text-amber-500 font-bold uppercase tracking-wider text-xs mb-3">Analogy</h4>
                 <p className="text-amber-100 font-serif text-xl italic leading-relaxed">"{currentSection.analogy}"</p>
               </div>

               {/* Key Takeaway */}
               <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex items-start gap-4">
                 <div className="mt-1 p-2 bg-green-500/20 rounded-lg text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <div>
                    <h4 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-1">Key Takeaway</h4>
                    <p className="text-gray-200 font-medium">{currentSection.key_takeaway}</p>
                 </div>
               </div>
             </div>
         </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center mt-8 px-4">
        <button
          onClick={() => setCurrentSectionIdx(prev => Math.max(0, prev - 1))}
          disabled={currentSectionIdx === 0}
          className={`text-sm font-bold uppercase tracking-wider transition-colors ${currentSectionIdx === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
        >
          ← Previous
        </button>

        <button
          onClick={() => {
            if (currentSectionIdx < sections.length - 1) {
              setCurrentSectionIdx(prev => prev + 1);
            } else {
              onExit();
            }
          }}
          className={`px-8 py-3 rounded-full font-bold shadow-lg transition-all hover-lift flex items-center gap-2 ${
            currentSectionIdx === sections.length - 1 
             ? 'bg-white text-black hover:bg-gray-200' 
             : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:brightness-110'
          }`}
        >
          {currentSectionIdx === sections.length - 1 ? 'Finish Class' : 'Next Concept'}
          {currentSectionIdx !== sections.length - 1 && <span>→</span>}
        </button>
      </div>
    </div>
  );
};