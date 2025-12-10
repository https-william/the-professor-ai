import React, { useState } from 'react';
import { ProfessorState } from '../types';
import { MermaidDiagram } from './MermaidDiagram';
import { KnowledgeGraph } from './KnowledgeGraph';

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

  React.useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    return () => window.speechSynthesis.cancel();
  }, [currentSectionIdx]);

  const topics = state.sections.map(s => ({ id: s.id, title: s.title }));

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6">
       {/* Header & Controls */}
       <div className="flex flex-col gap-4 mb-6 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-amber-900/20 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-500 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-200 leading-tight">The Professor</h2>
               <span className="text-xs text-amber-500 font-mono uppercase tracking-wider flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                 Live Lecture
               </span>
             </div>
          </div>

          {/* Protocols Grid */}
          <div className="grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto mt-2">
             <button onClick={toggleSpeech} className={`py-3 sm:py-2 px-2 sm:px-4 border rounded-xl text-[10px] sm:text-xs font-bold uppercase transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 ${isSpeaking ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                {isSpeaking ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
                <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
             </button>
             
             <button onClick={handleShare} className="py-3 sm:py-2 px-2 sm:px-4 bg-white/5 border border-white/10 rounded-xl text-[10px] sm:text-xs font-bold uppercase text-gray-400 hover:text-white hover:bg-white/10 transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                <span>Share</span>
             </button>
             
             <button onClick={onExit} className="py-3 sm:py-2 px-2 sm:px-4 bg-red-900/10 border border-red-500/20 rounded-xl text-[10px] sm:text-xs font-bold uppercase text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                <span>End</span>
             </button>
          </div>
       </div>

       {/* Knowledge Graph Nav */}
       <KnowledgeGraph 
          topics={topics} 
          currentId={section.id} 
          onSelect={(id) => {
             const idx = state.sections.findIndex(s => s.id === id);
             if (idx >= 0) setCurrentSectionIdx(idx);
          }} 
       />

       <div className="glass-panel rounded-3xl p-6 md:p-12 animate-slide-up-fade relative overflow-hidden">
          {/* Section Indicator */}
          <div className="absolute top-4 right-6 text-[10px] font-bold font-mono text-gray-600 uppercase tracking-widest">
             Section {currentSectionIdx + 1} / {state.sections.length}
          </div>

          <h1 className="text-2xl md:text-4xl font-serif font-bold text-white mb-8 leading-tight">{section.title}</h1>
          <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed mb-8 text-sm md:text-base">{section.content}</div>

          {section.diagram_markdown && (
             <div className="mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Visual Architecture</h4>
                <MermaidDiagram chart={section.diagram_markdown} />
             </div>
          )}

          <div className="bg-amber-900/10 p-6 rounded-2xl border border-amber-500/20 mb-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
             <h4 className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-2">Feynman Analogy</h4>
             <p className="text-amber-100 italic text-base md:text-lg font-serif">"{section.analogy}"</p>
          </div>
       </div>

       {/* Nav */}
       <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 md:static md:bg-transparent md:border-none md:p-0 md:mt-8 z-30">
          <div className="flex gap-4 max-w-4xl mx-auto">
             <button onClick={() => setCurrentSectionIdx(Math.max(0, currentSectionIdx - 1))} disabled={currentSectionIdx === 0} className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold uppercase text-xs hover:bg-white/10 disabled:opacity-30">← Previous</button>
             <button onClick={() => { if (currentSectionIdx < state.sections.length - 1) setCurrentSectionIdx(currentSectionIdx + 1); else onExit(); }} className="flex-[2] py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase text-xs shadow-lg">{currentSectionIdx === state.sections.length - 1 ? 'Complete Class' : 'Next Concept →'}</button>
          </div>
       </div>
    </div>
  );
};