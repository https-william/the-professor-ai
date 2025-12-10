
import React, { useState } from 'react';
import { ProfessorState } from '../types';
import { MermaidDiagram } from './MermaidDiagram';

interface ProfessorViewProps {
  state: ProfessorState;
  onExit: () => void;
  timeRemaining: number | null;
}

export const ProfessorView: React.FC<ProfessorViewProps> = ({ state, onExit }) => {
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const section = state.sections[currentSectionIdx];

  const handleShare = async () => {
    const text = `The Professor - ${section.title}\n\n${section.content}`;
    if (navigator.share) {
      try { await navigator.share({ title: section.title, text: text, url: 'https://theprofessorai.vercel.app' }); } catch (err) {}
    } else {
      try { await navigator.clipboard.writeText(text); alert('Copied.'); } catch (err) {}
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(`${section.title}. ${section.content}. Analogy: ${section.analogy}`);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Cleanup speech on unmount or section change
  React.useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    return () => window.speechSynthesis.cancel();
  }, [currentSectionIdx]);

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6">
       {/* Header */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-amber-900/20 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-200 leading-tight">The Professor</h2>
               <span className="text-xs text-amber-500 font-mono uppercase tracking-wider">Live Lecture</span>
             </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
             <button onClick={toggleSpeech} className={`flex-1 sm:flex-none px-4 py-2 border rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${isSpeaking ? 'bg-amber-500 text-white border-amber-500' : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'}`}>
                {isSpeaking ? (
                  <>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Stop
                  </>
                ) : 'Read Aloud'}
             </button>
             <button onClick={handleShare} className="flex-1 sm:flex-none px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase text-gray-300 hover:text-white transition-all">Share</button>
             <button onClick={onExit} className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold uppercase text-red-400 hover:bg-red-500/20 transition-all">End Class</button>
          </div>
       </div>

       {/* Progress Bar */}
       <div className="h-1 w-full bg-white/10 rounded-full mb-8">
          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${((currentSectionIdx + 1) / state.sections.length) * 100}%` }}></div>
       </div>

       <div className="glass-panel rounded-3xl p-6 md:p-12 animate-slide-up-fade">
          <h1 className="text-2xl md:text-5xl font-serif font-bold text-white mb-8 leading-tight">{section.title}</h1>
          <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed mb-8 text-sm md:text-base">{section.content}</div>

          {section.diagram_markdown && (
             <div className="mb-8">
                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Visual Concept</h4>
                <MermaidDiagram chart={section.diagram_markdown} />
             </div>
          )}

          <div className="bg-amber-900/20 p-6 rounded-2xl border border-amber-500/20 mb-6">
             <h4 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Analogy</h4>
             <p className="text-amber-100 italic text-base md:text-lg">"{section.analogy}"</p>
          </div>
       </div>

       {/* Nav */}
       <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 md:static md:bg-transparent md:border-none md:p-0 md:mt-8 z-30">
          <div className="flex gap-4 max-w-4xl mx-auto">
             <button onClick={() => setCurrentSectionIdx(Math.max(0, currentSectionIdx - 1))} disabled={currentSectionIdx === 0} className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold uppercase text-xs hover:bg-white/10 disabled:opacity-30">← Previous</button>
             <button onClick={() => { if (currentSectionIdx < state.sections.length - 1) setCurrentSectionIdx(currentSectionIdx + 1); else onExit(); }} className="flex-[2] py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase text-xs shadow-lg">{currentSectionIdx === state.sections.length - 1 ? 'Complete' : 'Next →'}</button>
          </div>
       </div>
    </div>
  );
};
