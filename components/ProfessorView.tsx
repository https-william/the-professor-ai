
import React, { useState, useEffect, useRef } from 'react';
import { ProfessorState, LockInConfig } from '../types';
import { MermaidDiagram } from './MermaidDiagram';
import { KnowledgeGraph } from './KnowledgeGraph';
import { generateSummary } from '../services/geminiService';
import { LockInModal } from './LockInModal';
import { StudyRoom } from './StudyRoom';
import DOMPurify from 'dompurify';

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPodcastMode, setIsPodcastMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Lock-In State
  const [showLockInModal, setShowLockInModal] = useState(false);
  const [lockInConfig, setLockInConfig] = useState<LockInConfig | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const section = state.sections[currentSectionIdx];

  useEffect(() => {
      if (contentRef.current && window.renderMathInElement) {
          window.renderMathInElement(contentRef.current, {
              delimiters: [
                  {left: '$$', right: '$$', display: true},
                  {left: '$', right: '$', display: false},
                  {left: '\\(', right: '\\)', display: false},
                  {left: '\\[', right: '\\]', display: true}
              ],
              throwOnError: false
          });
      }
  }, [currentSectionIdx, state, summaryContent, lockInConfig]);

  const handleSave = () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportPDF = () => {
      window.print();
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPodcastMode(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(`${section.title}. ${section.content}. Analogy: ${section.analogy}`);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const startPodcast = () => {
      if (isSpeaking && isPodcastMode) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setIsPodcastMode(false);
          return;
      }

      window.speechSynthesis.cancel();
      setIsPodcastMode(true);
      setIsSpeaking(true);

      const intro = new SpeechSynthesisUtterance("Welcome to The Professor Audio Experience. Let's begin the lecture.");
      intro.onend = () => speakSection(0);
      window.speechSynthesis.speak(intro);
  };

  const speakSection = (index: number) => {
      if (index >= state.sections.length) {
          const outro = new SpeechSynthesisUtterance("That concludes the lecture. Good luck.");
          outro.onend = () => {
              setIsSpeaking(false);
              setIsPodcastMode(false);
          };
          window.speechSynthesis.speak(outro);
          return;
      }

      setCurrentSectionIdx(index);

      const s = state.sections[index];
      const text = `Section ${index + 1}: ${s.title}. ${s.content}. Here is a way to think about it: ${s.analogy}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
          if (window.speechSynthesis.speaking === false && isPodcastMode) { // Check cancelled
             speakSection(index + 1);
          }
      };
      window.speechSynthesis.speak(utterance);
  };

  const handleSummary = async () => {
      setShowSummary(true);
      if (summaryContent) return;

      setIsGeneratingSummary(true);
      try {
          const fullText = state.sections.map(s => `${s.title}:\n${s.content}`).join('\n\n');
          const summary = await generateSummary(fullText);
          setSummaryContent(summary);
      } catch (e) {
          setSummaryContent("Failed to generate briefing.");
      } finally {
          setIsGeneratingSummary(false);
      }
  };

  const handleLockIn = (config: LockInConfig) => {
      setLockInConfig(config);
      setShowLockInModal(false);
  };

  useEffect(() => {
    if (!isPodcastMode) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }
    return () => {
        if(!isPodcastMode) window.speechSynthesis.cancel();
    };
  }, [currentSectionIdx]);

  const topics = state.sections.map(s => ({ id: s.id, title: s.title }));

  const renderContent = (content: string) => {
      const sanitized = DOMPurify.sanitize(content);
      if (window.marked) {
          return { __html: window.marked.parse(sanitized) };
      }
      return { __html: sanitized };
  };

  // --- LOCK-IN MODE VIEW ---
  if (lockInConfig) {
      return (
          <div className="max-w-5xl mx-auto pb-20 px-4 animate-fade-in">
              <StudyRoom 
                  section={section} 
                  config={lockInConfig} 
                  onExit={() => setLockInConfig(null)}
                  onNext={() => {
                      if (currentSectionIdx < state.sections.length - 1) {
                          setCurrentSectionIdx(prev => prev + 1);
                      } else {
                          onExit(true);
                      }
                  }}
                  isLast={currentSectionIdx === state.sections.length - 1}
              />
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 relative">
       {showLockInModal && (
           <LockInModal onClose={() => setShowLockInModal(false)} onConfirm={handleLockIn} />
       )}
       
       <div id="printable-content" className="hidden">
           <div style={{marginBottom: '40px', borderBottom: '2px solid black', paddingBottom: '20px'}}>
               <h1 style={{fontSize: '32pt', fontWeight: 'bold'}}>The Professor: Study Notes</h1>
               <p style={{fontSize: '12pt', color: '#666'}}>Generated on {new Date().toLocaleDateString()}</p>
           </div>
           {state.sections.map((s, i) => (
               <div key={i} style={{marginBottom: '40px', pageBreakInside: 'avoid'}}>
                   <h2 style={{fontSize: '20pt', fontWeight: 'bold', borderBottom:'1px solid #ccc', paddingBottom:'5px', marginBottom:'15px'}}>{i+1}. {s.title}</h2>
                   <div style={{fontSize: '12pt', lineHeight: '1.6'}} dangerouslySetInnerHTML={renderContent(s.content)}></div>
                   <div style={{marginTop: '20px', padding: '15px', borderLeft: '4px solid #000', background: '#f5f5f5', fontStyle: 'italic'}}>
                       <strong>Analogy:</strong> {s.analogy}
                   </div>
                   <div style={{marginTop: '10px', fontSize: '10pt', fontWeight: 'bold'}}>
                       KEY TAKEAWAY: {s.key_takeaway}
                   </div>
               </div>
           ))}
       </div>

       <div className="no-print">
           <div className="flex flex-col gap-4 mb-6 border-b border-border-main pb-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-amber-900/20 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-500 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                 </div>
                 <div className="flex-1">
                   <h2 className="text-xl font-bold text-text-pri leading-tight">The Professor</h2>
                   <span className="text-xs text-accent font-mono uppercase tracking-wider flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                     Live Lecture
                   </span>
                 </div>
                 
                 {/* Lock-In Button */}
                 <button 
                    onClick={() => setShowLockInModal(true)}
                    className="px-4 py-2 bg-amber-500 text-black font-black uppercase text-xs tracking-wider rounded-xl hover:bg-amber-400 transition-transform hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse-slow flex items-center gap-2"
                 >
                    <span>🔒</span> Lock In
                 </button>
              </div>

              <div className="grid grid-cols-5 gap-2 w-full mt-2">
                 <button onClick={handleSave} className={`py-3 px-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1.5 ${isSaved ? 'text-green-400 border-green-500/30' : 'text-text-sec hover:text-white hover:bg-white/10'}`}>
                    {isSaved ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    )}
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                 </button>

                 <button onClick={startPodcast} className={`py-3 px-2 border rounded-xl text-[10px] font-bold uppercase transition-all flex flex-col items-center justify-center gap-1.5 ${isPodcastMode ? 'bg-accent text-white border-accent shadow-lg' : 'bg-white/5 border-white/10 text-text-sec hover:text-white hover:bg-white/10'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isPodcastMode ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    <span>{isPodcastMode ? 'Playing' : 'Podcast'}</span>
                 </button>
                 
                 <button onClick={handleSummary} className="py-3 px-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase text-text-sec hover:text-white hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    <span>Briefing</span>
                 </button>

                 <button onClick={handleExportPDF} className="py-3 px-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase text-text-sec hover:text-white hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>PDF</span>
                 </button>
                 
                 <button onClick={() => onExit(false)} className="py-3 px-2 bg-red-900/10 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all flex flex-col items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    <span>End</span>
                 </button>
              </div>
           </div>

           <KnowledgeGraph 
              topics={topics} 
              currentId={section.id} 
              onSelect={(id) => {
                 const idx = state.sections.findIndex(s => s.id === id);
                 if (idx >= 0) setCurrentSectionIdx(idx);
              }} 
           />

           <div className="glass-panel rounded-3xl p-6 md:p-12 animate-slide-up-fade relative overflow-hidden">
              <div className="absolute top-4 right-6 text-[10px] font-bold font-mono text-gray-600 uppercase tracking-widest">
                 Section {currentSectionIdx + 1} / {state.sections.length}
              </div>

              <div ref={contentRef}>
                  <h1 className="text-2xl md:text-4xl font-serif font-bold text-text-pri mb-8 leading-tight">{section.title}</h1>
                  <div 
                    className="prose prose-invert prose-lg max-w-none text-text-sec leading-relaxed mb-8 text-sm md:text-base"
                    dangerouslySetInnerHTML={renderContent(section.content)}
                  />
              </div>

              {section.diagram_markdown && (
                 <div className="mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Visual Architecture</h4>
                    <MermaidDiagram chart={section.diagram_markdown} />
                 </div>
              )}

              <div className="bg-amber-900/10 p-6 rounded-2xl border border-amber-500/20 mb-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                 <h4 className="text-accent text-[10px] font-bold uppercase tracking-widest mb-2">Feynman Analogy</h4>
                 <p className="text-amber-100 italic text-base md:text-lg font-serif">"{section.analogy}"</p>
              </div>
           </div>

           <div className="fixed bottom-0 left-0 right-0 p-4 bg-core/80 backdrop-blur-xl border-t border-border-main md:static md:bg-transparent md:border-none md:p-0 md:mt-8 z-30">
              <div className="flex gap-4 max-w-4xl mx-auto">
                 <button onClick={() => setCurrentSectionIdx(Math.max(0, currentSectionIdx - 1))} disabled={currentSectionIdx === 0} className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold uppercase text-xs hover:bg-white/10 disabled:opacity-30">← Previous</button>
                 <button onClick={() => { if (currentSectionIdx < state.sections.length - 1) setCurrentSectionIdx(currentSectionIdx + 1); else onExit(true); }} className="flex-[2] py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase text-xs shadow-lg">{currentSectionIdx === state.sections.length - 1 ? 'Complete Class' : 'Next Concept →'}</button>
              </div>
           </div>
       </div>

       {showSummary && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in no-print" onClick={() => setShowSummary(false)}>
               <div className="bg-panel border border-accent/30 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                   <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
                   
                   <div className="flex justify-between items-center mb-6">
                       <h2 className="text-2xl font-serif font-bold text-text-pri">Executive Briefing</h2>
                       <button onClick={() => setShowSummary(false)} className="text-text-sec hover:text-white">✕</button>
                   </div>

                   <div className="flex-1 overflow-y-auto custom-scrollbar" ref={contentRef}>
                       {isGeneratingSummary ? (
                           <div className="flex flex-col items-center justify-center h-48 space-y-4">
                               <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
                               <p className="text-xs text-accent font-mono uppercase tracking-widest animate-pulse">Synthesizing Intel...</p>
                           </div>
                       ) : (
                           <div className="prose prose-invert prose-sm max-w-none text-text-sec" dangerouslySetInnerHTML={renderContent(summaryContent || '')} />
                       )}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
