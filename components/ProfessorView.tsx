
import React, { useState, useEffect, useRef } from 'react';
import { ProfessorState } from '../types';
import DOMPurify from 'dompurify';
import { createShareLink } from '../services/supabase';
import { speak, stopSpeaking, initVoice, isSpeaking } from '../services/voiceService';

interface ProfessorViewProps {
  state: ProfessorState;
  onExit: (force?: boolean) => void;
  timeRemaining: number | null;
}

declare global {
  interface Window {
    marked: any;
  }
}

export const ProfessorView: React.FC<ProfessorViewProps> = ({ state, onExit }) => {
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  
  const section = state.sections[currentSectionIdx];

  useEffect(() => {
      initVoice();
      return () => stopSpeaking();
  }, []);

  useEffect(() => {
      stopSpeaking();
      setIsReading(false);
  }, [currentSectionIdx]);

  const toggleVoice = () => {
      if (isReading) {
          stopSpeaking();
          setIsReading(false);
      } else {
          const cleanText = `${section.title}. ${section.content.replace(/[*#]/g, '')}. Analogy: ${section.analogy}`;
          speak(cleanText);
          setIsReading(true);
      }
  };

  const handleShare = async () => {
      if (shareUrl) {
          navigator.clipboard.writeText(shareUrl);
          alert("Link Copied!");
          return;
      }
      const id = await createShareLink('PROFESSOR', section.title, state);
      if (id) {
          const url = `https://theprofessor.xyz/#/share/${id}`;
          setShareUrl(url);
          navigator.clipboard.writeText(url);
          alert("Link Copied!");
      }
  };

  const renderContent = (content: string) => {
      const sanitized = DOMPurify.sanitize(content);
      if (window.marked) {
          return { __html: window.marked.parse(sanitized) };
      }
      return { __html: sanitized };
  };

  return (
    <div className="max-w-3xl mx-auto pb-32 px-6 sm:px-8 relative font-serif">
       
       <div className="no-print">
           <div className="flex flex-col gap-4 mb-8 pt-4 border-b border-white/10 pb-6 sticky top-0 bg-[#050505]/95 backdrop-blur-xl z-20 transition-all">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-sans">Lecture Hall</h2>
                   <span className="text-gray-600">/</span>
                   <span className="text-white font-mono text-xs">{currentSectionIdx + 1} of {state.sections.length}</span>
                 </div>
                 
                 <div className="flex gap-2">
                     <button onClick={toggleVoice} className={`p-2 rounded-full border transition-all ${isReading ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}>
                        {isReading ? '🔊' : '🔈'}
                     </button>
                     <button onClick={handleShare} className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors">
                        🔗
                     </button>
                     <button onClick={() => onExit(false)} className="px-4 py-2 bg-red-900/20 text-red-500 border border-red-500/30 rounded-full text-xs font-bold uppercase font-sans">End</button>
                 </div>
              </div>
           </div>

           <div className="animate-fade-in space-y-12">
              <div>
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight tracking-tight">{section.title}</h1>
                  
                  {/* Main Content with Better Typography */}
                  <div 
                    className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed space-y-6 font-serif"
                    style={{ fontSize: '1.125rem', lineHeight: '1.8' }}
                    dangerouslySetInnerHTML={renderContent(section.content)}
                  />
              </div>

              {/* Analogy Block */}
              <div className="bg-[#0a0a0c] p-8 rounded-3xl border border-amber-500/20 relative overflow-hidden font-sans">
                 <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                 <h4 className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="text-lg">💡</span> Feynman Analogy
                 </h4>
                 <p className="text-amber-100/90 text-lg leading-relaxed italic">"{section.analogy}"</p>
              </div>

              {/* Key Takeaway Block */}
              <div className="bg-blue-900/10 p-6 rounded-2xl border border-blue-500/20 font-sans">
                  <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Core Memory</h4>
                  <p className="text-white font-medium">{section.key_takeaway}</p>
              </div>
           </div>

           <div className="fixed bottom-8 left-0 right-0 px-6 pointer-events-none z-30">
              <div className="max-w-3xl mx-auto flex gap-4 pointer-events-auto">
                 <button 
                    onClick={() => setCurrentSectionIdx(Math.max(0, currentSectionIdx - 1))} 
                    disabled={currentSectionIdx === 0} 
                    className="flex-1 py-4 rounded-2xl bg-[#1a1a1a] border border-white/10 text-gray-400 font-bold uppercase text-xs hover:bg-[#252525] disabled:opacity-0 transition-all font-sans shadow-lg"
                 >
                    Previous
                 </button>
                 <button 
                    onClick={() => { if (currentSectionIdx < state.sections.length - 1) setCurrentSectionIdx(currentSectionIdx + 1); else onExit(true); }} 
                    className="flex-[2] py-4 rounded-2xl btn-glass bg-white text-black font-bold uppercase text-xs shadow-xl hover:scale-[1.02] transition-transform font-sans"
                 >
                    {currentSectionIdx === state.sections.length - 1 ? 'Finish Class' : 'Next Concept'}
                 </button>
              </div>
           </div>
       </div>
    </div>
  );
};
