
import React, { useState, useEffect } from 'react';
import { LockInConfig, StudyProtocol, ProfessorSection } from '../types';
import { generateStudyProtocol } from '../services/geminiService';
import DOMPurify from 'dompurify';

interface StudyRoomProps {
  section: ProfessorSection;
  config: LockInConfig;
  onExit: () => void;
  onNext: () => void;
  isLast: boolean;
}

export const StudyRoom: React.FC<StudyRoomProps> = ({ section, config, onExit, onNext, isLast }) => {
  const [protocol, setProtocol] = useState<StudyProtocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(25 * 60); // 25 mins
  const [timerActive, setTimerActive] = useState(config.usePomodoro);
  const [recitation, setRecitation] = useState('');
  
  useEffect(() => {
      // Reset state on section change
      setLoading(true);
      setProtocol(null);
      setRecitation('');
      
      const initProtocol = async () => {
          if (config.technique === 'STANDARD') {
              setProtocol({ step: 'READ' });
              setLoading(false);
              return;
          }
          try {
              const p = await generateStudyProtocol(section.content, config.technique);
              setProtocol(p);
          } catch (e) {
              setProtocol({ step: 'READ' }); // Fallback
          } finally {
              setLoading(false);
          }
      };
      initProtocol();
  }, [section, config.technique]);

  useEffect(() => {
      if (!timerActive || !config.usePomodoro) return;
      const interval = setInterval(() => {
          setTimer(t => (t > 0 ? t - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
  }, [timerActive, config.usePomodoro]);

  const advanceStep = () => {
      if (!protocol) return;
      
      if (protocol.step === 'SURVEY') setProtocol({ ...protocol, step: 'QUESTION' });
      else if (protocol.step === 'QUESTION') setProtocol({ ...protocol, step: 'READ' });
      else if (protocol.step === 'READ') setProtocol({ ...protocol, step: 'RECITE' });
      else if (protocol.step === 'RECITE') setProtocol({ ...protocol, step: 'REVIEW' });
      else if (protocol.step === 'REVIEW') {
          // Done with this section
          onNext();
      }
  };

  const renderContent = (content: string) => {
      return { __html: DOMPurify.sanitize(content) }; // Simplified for Study Room
  };

  const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-amber-500 space-y-4">
              <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing Content Structure...</p>
          </div>
      );
  }

  if (!protocol) return null;

  return (
    <div className="relative min-h-[500px] flex flex-col">
       {/* HUD */}
       <div className="flex justify-between items-center mb-6 bg-black/40 p-4 rounded-2xl border border-amber-500/20">
           <div className="flex items-center gap-3">
               <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
               <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                   {config.technique === 'SQ3R' ? 'THE ARCHITECT' : config.technique === 'RETRIEVAL' ? 'ACTIVE RECALL' : 'FOCUS MODE'}
               </span>
           </div>
           {config.usePomodoro && (
               <div className="font-mono text-xl font-bold text-white tracking-widest">
                   {formatTime(timer)}
               </div>
           )}
           <button onClick={onExit} className="text-xs text-gray-500 hover:text-white uppercase font-bold">Exit Room</button>
       </div>

       {/* Content Area */}
       <div className="flex-1 bg-[#0f0f10] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
           
           {/* Steps Progress */}
           <div className="flex gap-2 mb-8">
               {['SURVEY', 'QUESTION', 'READ', 'RECITE', 'REVIEW'].map((s) => {
                   if (config.technique === 'STANDARD' && s !== 'READ') return null;
                   const isActive = protocol.step === s;
                   const isPast = ['SURVEY', 'QUESTION', 'READ', 'RECITE', 'REVIEW'].indexOf(protocol.step) > ['SURVEY', 'QUESTION', 'READ', 'RECITE', 'REVIEW'].indexOf(s);
                   
                   return (
                       <div key={s} className={`h-1 flex-1 rounded-full transition-all ${isActive ? 'bg-amber-500 shadow-[0_0_10px_orange]' : isPast ? 'bg-amber-900' : 'bg-gray-800'}`}></div>
                   );
               })}
           </div>

           <div className="animate-fade-in">
               {protocol.step === 'SURVEY' && (
                   <div className="text-center py-10">
                       <h3 className="text-3xl font-serif font-bold text-white mb-6">Survey</h3>
                       <div className="bg-amber-900/10 border border-amber-500/20 p-6 rounded-2xl text-amber-100 text-lg leading-relaxed max-w-2xl mx-auto">
                           {protocol.survey}
                       </div>
                       <p className="mt-8 text-gray-500 text-sm">Grasp the big picture before diving in.</p>
                   </div>
               )}

               {protocol.step === 'QUESTION' && (
                   <div className="text-center py-10">
                       <h3 className="text-3xl font-serif font-bold text-white mb-6">Pre-Reading Questions</h3>
                       <div className="space-y-4 max-w-2xl mx-auto">
                           {protocol.questions?.map((q, i) => (
                               <div key={i} className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl text-blue-100 font-medium text-lg">
                                   ❓ {q}
                               </div>
                           ))}
                       </div>
                       <p className="mt-8 text-gray-500 text-sm">Keep these in mind as you read.</p>
                   </div>
               )}

               {protocol.step === 'READ' && (
                   <div>
                       <h1 className="text-3xl font-serif font-bold text-white mb-6">{section.title}</h1>
                       <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed" dangerouslySetInnerHTML={renderContent(section.content)} />
                       <div className="mt-8 bg-black/30 p-4 rounded-xl border border-white/5">
                           <strong className="text-amber-500 text-xs uppercase tracking-widest block mb-2">Feynman Analogy</strong>
                           <p className="italic text-gray-400">{section.analogy}</p>
                       </div>
                   </div>
               )}

               {protocol.step === 'RECITE' && (
                   <div className="text-center py-10">
                       <h3 className="text-3xl font-serif font-bold text-white mb-6">Recite & Recall</h3>
                       <p className="text-gray-400 mb-6">Without looking back, summarize what you just learned.</p>
                       <textarea 
                           value={recitation}
                           onChange={(e) => setRecitation(e.target.value)}
                           className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-6 text-white outline-none focus:border-amber-500 transition-colors text-lg"
                           placeholder="Type your summary here..."
                           autoFocus
                       />
                   </div>
               )}

               {protocol.step === 'REVIEW' && (
                   <div className="text-center py-10">
                        <h3 className="text-3xl font-serif font-bold text-white mb-6">Review</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Key Takeaway</h4>
                                <p className="text-white">{section.key_takeaway}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Your Recall</h4>
                                <p className="text-gray-300 italic">"{recitation || 'No recitation recorded.'}"</p>
                            </div>
                        </div>
                   </div>
               )}
           </div>
       </div>

       {/* Actions */}
       <div className="mt-6 flex justify-end">
           <button 
             onClick={advanceStep} 
             className="px-10 py-4 bg-amber-500 text-black font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all"
           >
               {protocol.step === 'REVIEW' ? (isLast ? 'Complete Session' : 'Next Concept →') : 'Continue →'}
           </button>
       </div>
    </div>
  );
};
