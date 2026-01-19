
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

// Helper for Title Case
const toTitleCase = (str: string) => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const ProfessorView: React.FC<ProfessorViewProps> = ({ state, onExit }) => {
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  
  // Guard Clause: Handle empty state
  if (!state || !state.sections || state.sections.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Lecture Hall Empty</h2>
              <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                  The Professor could not extract a lecture from the provided material. This often happens with empty documents or image-based PDFs without OCR.
              </p>
              <button 
                onClick={() => onExit(true)} 
                className="mt-8 px-8 py-3 bg-white text-black rounded-full font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors"
              >
                Return to Campus
              </button>
          </div>
      );
  }

  const section = state.sections[currentSectionIdx];

  useEffect(() => {
      initVoice();
      return () => stopSpeaking();
  }, []);

  useEffect(() => {
      stopSpeaking();
      setIsReading(false);
      setShareUrl(null); 
      setShareFeedback(null);
      // Auto scroll to top when slide changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          setShareFeedback("Copied!");
          setTimeout(() => setShareFeedback(null), 2000);
          return;
      }

      setIsSharing(true);
      setShareFeedback("Generating Link...");
      
      try {
          const id = await createShareLink('PROFESSOR', section.title, state);
          
          if (id) {
              const url = `${window.location.origin}/#/share/${id}`;
              setShareUrl(url);
              
              if (navigator.share) {
                  try {
                      await navigator.share({
                          title: section.title,
                          text: "Check out this lecture from The Professor.",
                          url: url
                      });
                      setShareFeedback(null);
                  } catch (e) {
                      // Share API cancelled or failed, fallback to clipboard
                      navigator.clipboard.writeText(url);
                      setShareFeedback("Link Copied!");
                  }
              } else {
                  navigator.clipboard.writeText(url);
                  setShareFeedback("Link Copied!");
              }
          } else {
              // Fallback: Just copy the text content if link creation fails
              const textContent = `${section.title}\n\n${section.content}\n\nAnalogy: ${section.analogy}`;
              navigator.clipboard.writeText(textContent);
              setShareFeedback("Text Copied!");
          }
      } catch (e) {
          console.error(e);
          setShareFeedback("Failed.");
      } finally {
          setIsSharing(false);
          setTimeout(() => setShareFeedback(null), 3000);
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
    <div className="pb-20 px-4 sm:px-6 relative font-serif flex justify-center">
       
       <div className="w-full max-w-2xl no-print flex flex-col gap-8">
           
           {/* Top Navigation Bar */}
           <div className="flex flex-col gap-4 pt-6 border-b border-white/10 pb-6 sticky top-0 bg-[#050505]/95 backdrop-blur-xl z-20 transition-all">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-sans">Lecture Hall</h2>
                   <span className="text-gray-700">/</span>
                   <span className="text-white font-mono text-xs font-bold">Slide {currentSectionIdx + 1} of {state.sections.length}</span>
                 </div>
                 
                 <div className="flex gap-3">
                     <button 
                        onClick={toggleVoice} 
                        className={`p-2 rounded-full border transition-all ${isReading ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-white/30'}`}
                        title="Read Aloud"
                     >
                        {isReading ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" /><path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.061z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                        )}
                     </button>
                     
                     <button 
                        onClick={handleShare} 
                        disabled={isSharing}
                        className="flex items-center gap-2 px-3 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 min-w-[40px]"
                        title="Share Lecture"
                     >
                        {isSharing ? (
                            <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin"></div>
                        ) : shareFeedback ? (
                            <span className="text-[10px] font-bold uppercase text-green-400 animate-pulse whitespace-nowrap">{shareFeedback}</span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.287.696.287 1.093s-.107.768-.287 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                        )}
                     </button>
                     
                     <button 
                        onClick={() => onExit(false)} 
                        className="px-5 py-2 bg-red-600 text-white border border-red-500 rounded-full text-xs font-bold uppercase font-sans hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20"
                     >
                        End Class
                     </button>
                 </div>
              </div>
           </div>

           {/* The "Paper" - Main Content Area */}
           <div className="animate-fade-in space-y-10 bg-[#0a0a0c] border border-white/5 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
              
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 opacity-50"></div>

              <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight tracking-tight font-display normal-case">
                      {toTitleCase(section.title)}
                  </h1>
                  
                  {/* Main Content with Optimized Typography */}
                  <div 
                    className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-6 font-serif leading-loose normal-case"
                    dangerouslySetInnerHTML={renderContent(section.content)}
                  />
              </div>

              {/* Analogy Block (Inline) */}
              <div className="bg-[#121212] p-8 rounded-2xl border-l-4 border-amber-500 relative font-sans my-8">
                 <h4 className="text-amber-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="text-lg">💡</span> Feynman Analogy
                 </h4>
                 <p className="text-amber-100/90 text-lg leading-relaxed italic normal-case">"{section.analogy}"</p>
              </div>

              {/* Key Takeaway Block */}
              <div className="bg-blue-900/10 p-6 rounded-2xl border border-blue-500/20 font-sans">
                  <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Core Memory</h4>
                  <p className="text-white font-medium text-sm leading-relaxed normal-case">{section.key_takeaway}</p>
              </div>
           </div>

           {/* Static Bottom Navigation */}
           <div className="flex gap-4">
                 <button 
                    onClick={() => { setCurrentSectionIdx(Math.max(0, currentSectionIdx - 1)); }} 
                    disabled={currentSectionIdx === 0} 
                    className="flex-1 py-4 rounded-2xl bg-[#1a1a1a] border border-white/10 text-gray-400 font-bold uppercase text-xs hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-sans shadow-lg"
                 >
                    Previous Concept
                 </button>
                 <button 
                    onClick={() => { if (currentSectionIdx < state.sections.length - 1) setCurrentSectionIdx(currentSectionIdx + 1); else onExit(true); }} 
                    className="flex-[2] py-4 rounded-2xl bg-white text-black font-bold uppercase text-xs shadow-xl hover:bg-gray-200 hover:scale-[1.01] transition-all font-sans"
                 >
                    {currentSectionIdx === state.sections.length - 1 ? 'Finish Class' : 'Next Concept'}
                 </button>
           </div>

       </div>
    </div>
  );
};

export default ProfessorView;
