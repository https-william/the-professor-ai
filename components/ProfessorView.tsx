
import React, { useState, useEffect, useRef } from 'react';
import { ProfessorState, LockInConfig } from '../types';
import { MermaidDiagram } from './MermaidDiagram';
import { KnowledgeGraph } from './KnowledgeGraph';
import { generateSummary } from '../services/geminiService';
import { LockInModal } from './LockInModal';
import { StudyRoom } from './StudyRoom';
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
    renderMathInElement: any;
  }
}

export const ProfessorView: React.FC<ProfessorViewProps> = ({ state, onExit }) => {
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const section = state.sections[currentSectionIdx];

  useEffect(() => {
      initVoice();
      return () => stopSpeaking();
  }, []);

  // Stop speaking when section changes
  useEffect(() => {
      stopSpeaking();
      setIsReading(false);
  }, [currentSectionIdx]);

  const toggleVoice = () => {
      if (isReading) {
          stopSpeaking();
          setIsReading(false);
      } else {
          // Strip HTML/Markdown for clean speech
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
          alert("Session Shared! Link copied to clipboard.");
      } else {
          alert("Share failed.");
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
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 relative">
       
       <div className="no-print">
           <div className="flex flex-col gap-4 mb-6 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                 <div className="flex-1 flex items-center gap-3">
                   <h2 className="text-xl font-bold text-white">The Professor</h2>
                   <button 
                     onClick={toggleVoice}
                     className={`p-2 rounded-full border transition-all ${isReading ? 'bg-amber-500 text-black border-amber-500 animate-pulse' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                     title="Read Aloud"
                   >
                       {isReading ? (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                       ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                       )}
                   </button>
                 </div>
                 
                 <button onClick={handleShare} className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold uppercase hover:bg-blue-600/40">
                    {shareUrl ? 'Link Copied' : 'Share Class'}
                 </button>
                 
                 <button onClick={() => onExit(false)} className="px-4 py-2 bg-red-900/20 text-red-500 border border-red-500/30 rounded-xl text-xs font-bold uppercase">End</button>
              </div>
           </div>

           <div className={`glass-panel rounded-3xl p-6 md:p-12 relative overflow-hidden`}>
              <div ref={contentRef}>
                  <h1 className="text-2xl md:text-4xl font-serif font-bold text-white mb-8 leading-tight">{section.title}</h1>
                  <div 
                    className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed mb-8 text-sm md:text-base"
                    dangerouslySetInnerHTML={renderContent(section.content)}
                  />
              </div>
              <div className="bg-amber-900/10 p-6 rounded-2xl border border-amber-500/20 mb-6 relative overflow-hidden">
                 <h4 className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-2">Feynman Analogy</h4>
                 <p className="text-amber-100 italic text-base md:text-lg font-serif">"{section.analogy}"</p>
              </div>
           </div>

           <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 md:static md:bg-transparent md:border-none md:p-0 md:mt-8 z-30">
              <div className="flex gap-4 max-w-4xl mx-auto">
                 <button onClick={() => setCurrentSectionIdx(Math.max(0, currentSectionIdx - 1))} disabled={currentSectionIdx === 0} className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold uppercase text-xs hover:bg-white/10 disabled:opacity-30">← Previous</button>
                 <button onClick={() => { if (currentSectionIdx < state.sections.length - 1) setCurrentSectionIdx(currentSectionIdx + 1); else onExit(true); }} className="flex-[2] py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase text-xs shadow-lg">{currentSectionIdx === state.sections.length - 1 ? 'Complete Class' : 'Next Concept →'}</button>
              </div>
           </div>
       </div>
    </div>
  );
};

export default ProfessorView;
