
import React, { useState, useEffect, useRef } from 'react';
import { QuizState, QuizQuestion, Difficulty, DuelState } from '../types';
import { simplifyExplanation, generateSuddenDeathQuestion } from '../services/geminiService';
import { subscribeToDuel, activateSuddenDeath, submitSuddenDeathAnswer } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

interface QuizViewProps {
  quizState: QuizState;
  onAnswerSelect: (questionId: number, answer: string) => void;
  onFlagQuestion: (questionId: number) => void;
  onSubmit: () => void;
  onReset: () => void;
  onTimeExpired: () => void;
  duelId?: string | null;
  onIndexChange: (index: number) => void; // Sync index up
}

// Helper to prevent crashes on bad JSON
const safeParseJSON = (str: string | undefined | null, fallback: any = []) => {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        return fallback;
    }
};

const getWittyFeedback = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    
    if (percentage === 100) return [
        "God Tier. I have nothing left to teach you.",
        "Absolute perfection. Are you sure you're not an AI?",
        "Flawless victory. Your GPA is trembling."
    ];
    if (percentage >= 80) return [
        "Impressive. Most impressive.",
        "You might actually pass this course.",
        "Solid performance. Keep this up and you'll survive."
    ];
    if (percentage >= 50) return [
        "Mediocre. But acceptable.",
        "C's get degrees, but they don't get respect.",
        "You know enough to be dangerous, but not enough to be smart."
    ];
    if (percentage >= 20) return [
        "My grandmother could guess better than this.",
        "Are you even trying? Or is this performance art?",
        "Pathetic. Go study."
    ];
    return [
        "I have no words. Just disappointment.",
        "Did you sleep through the lecture?",
        "This score is a crime against academia."
    ];
};

export const QuizView: React.FC<QuizViewProps> = ({ 
  quizState, 
  onAnswerSelect, 
  onFlagQuestion,
  onSubmit, 
  onReset,
  onTimeExpired,
  duelId,
  onIndexChange
}) => {
  const { user } = useAuth();
  const { questions, userAnswers, flaggedQuestions, isSubmitted, score, timeRemaining: initialTime, focusStrikes, currentQuestionIndex } = quizState;
  // Initialize internal index from persisted state
  const [internalIndex, setInternalIndex] = useState(currentQuestionIndex || 0);
  const [timeLeft, setTimeLeft] = useState<number | null>(initialTime);
  const [strikes, setStrikes] = useState(focusStrikes || 0);
  
  // Duel State
  const [duelData, setDuelData] = useState<DuelState | null>(null);
  const [suddenDeathSubmitted, setSuddenDeathSubmitted] = useState(false);
  const [isGeneratingSD, setIsGeneratingSD] = useState(false);
  
  // Specific inputs state
  const [textAnswer, setTextAnswer] = useState('');
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<string[]>([]);
  
  const [simplifiedExplanations, setSimplifiedExplanations] = useState<Record<number, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<number | null>(null);

  const lastStrikeTime = useRef<number>(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
      isMountedRef.current = true;
      return () => { isMountedRef.current = false; };
  }, []);

  // Sync state when parent updates
  useEffect(() => {
      setInternalIndex(currentQuestionIndex);
  }, [currentQuestionIndex]);

  // Sync internal input state when question changes
  useEffect(() => {
      // GUARD: Ensure questions exist
      if (!questions || questions.length === 0) return;
      
      const q = questions[internalIndex];
      if (!q) return;
      
      const savedAnswer = userAnswers[q.id];
      
      if (q.type === 'Fill in the Gap') {
          setTextAnswer(savedAnswer || '');
      } else if (q.type === 'Select All That Apply') {
          setMultiSelectAnswers(safeParseJSON(savedAnswer, []));
      }
  }, [internalIndex, userAnswers, questions]);

  // DUEL: Subscribe to updates if submitted
  useEffect(() => {
      if (isSubmitted && duelId) {
          const unsub = subscribeToDuel(duelId, (data) => {
              setDuelData(data);
              
              // Host Logic to Trigger Sudden Death Generation
              if (data.status === 'SUDDEN_DEATH_PENDING' && data.hostId === user?.uid && !isGeneratingSD) {
                  setIsGeneratingSD(true);
                  generateSuddenDeathQuestion(data.content || "General Knowledge").then((q) => {
                      activateSuddenDeath(duelId, q);
                  });
              }
          });
          return () => unsub();
      }
  }, [isSubmitted, duelId, user, isGeneratingSD]);

  // FOCUS TRACKING PROTOCOL
  useEffect(() => {
      if (isSubmitted) return;

      const handleFocusLost = () => {
          // If unmounted, do nothing
          if (!isMountedRef.current) return;

          const now = Date.now();
          if (now - lastStrikeTime.current < 1500) return; 
          lastStrikeTime.current = now;

          setStrikes(prev => {
              const newStrikes = prev + 1;
              const toast = document.createElement('div');
              toast.className = 'fixed top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest z-[100] animate-bounce shadow-[0_0_20px_red] pointer-events-none transition-opacity duration-500';
              toast.innerText = `⚠️ FOCUS LOST. STRIKE ${newStrikes}`;
              document.body.appendChild(toast);
              setTimeout(() => {
                  toast.style.opacity = '0';
                  setTimeout(() => toast.remove(), 500);
              }, 2500);
              return newStrikes;
          });
      };

      const onVisibilityChange = () => { if (document.hidden) handleFocusLost(); };
      const onWindowBlur = () => {
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (!isMobile) handleFocusLost();
      };

      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('blur', onWindowBlur);
      return () => {
          document.removeEventListener('visibilitychange', onVisibilityChange);
          window.removeEventListener('blur', onWindowBlur);
      };
  }, [isSubmitted, strikes]);

  useEffect(() => {
    if (isSubmitted || timeLeft === null) return;
    if (timeLeft <= 0) {
      onTimeExpired();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, onTimeExpired]);

  const handleNextQuestion = () => {
      if (internalIndex < questions.length - 1) {
          const newIdx = internalIndex + 1;
          setInternalIndex(newIdx);
          onIndexChange(newIdx);
      } else {
          onSubmit();
      }
  };

  const handlePrevQuestion = () => {
      if (internalIndex > 0) {
          const newIdx = internalIndex - 1;
          setInternalIndex(newIdx);
          onIndexChange(newIdx);
      }
  };

  const handleJumpToQuestion = (idx: number) => {
      setInternalIndex(idx);
      onIndexChange(idx);
  };

  const handleSuddenDeathAnswer = (opt: string) => {
      if (!duelData?.suddenDeathQuestion || !duelId || !user) return;
      const isCorrect = opt === duelData.suddenDeathQuestion.correct_answer;
      submitSuddenDeathAnswer(duelId, user.uid, isCorrect);
      setSuddenDeathSubmitted(true);
  };

  // CRITICAL GUARD: If questions are missing or index is broken, show fallback
  const currentQ = questions?.[internalIndex];
  if (!currentQ && !isSubmitted) {
      return (
          <div className="flex items-center justify-center h-full p-8 text-center">
              <div>
                  <h3 className="text-xl font-bold text-red-500 mb-2">Data Corruption Detected</h3>
                  <p className="text-gray-400 mb-6">The exam structure is invalid. Please reset.</p>
                  <button onClick={onReset} className="px-6 py-2 bg-white text-black rounded-lg font-bold">Reset System</button>
              </div>
          </div>
      );
  }

  const total = questions.length;
  
  const getXPFeedback = (score: number) => {
      const xp = Math.min(score * 50, 500); 
      return `+${xp} XP Gained`;
  };

  const handleELI5 = async (q: QuizQuestion) => {
      if (simplifiedExplanations[q.id]) return;
      setLoadingExplanation(q.id);
      try {
          const simplified = await simplifyExplanation(q.explanation, 'ELI5');
          setSimplifiedExplanations(prev => ({ ...prev, [q.id]: simplified }));
      } catch (e) {
          // ignore error
      } finally {
          setLoadingExplanation(null);
      }
  };

  const saveTextInput = () => {
      if (textAnswer.trim() && currentQ) {
          onAnswerSelect(currentQ.id, textAnswer.trim());
      }
  };

  const toggleMultiSelect = (opt: string) => {
      let newSelection;
      if (multiSelectAnswers.includes(opt)) {
          newSelection = multiSelectAnswers.filter(o => o !== opt);
      } else {
          newSelection = [...multiSelectAnswers, opt].sort();
      }
      setMultiSelectAnswers(newSelection);
      if(currentQ) onAnswerSelect(currentQ.id, JSON.stringify(newSelection));
  };

  // --- REPORT CARD ---
  if (isSubmitted) {
    const feedbacks = getWittyFeedback(score, total);
    const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];

    if (duelData?.status === 'SUDDEN_DEATH_ACTIVE' && !suddenDeathSubmitted && duelData.suddenDeathQuestion) {
        const sdQ = duelData.suddenDeathQuestion;
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-red-950/90 backdrop-blur-xl animate-fade-in">
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-black border-2 border-red-600 rounded-3xl p-8 shadow-[0_0_100px_rgba(220,38,38,0.5)] relative overflow-hidden animate-pulse-slow">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_10px,#000_10px,#000_20px)]"></div>
                        <div className="absolute bottom-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_10px,#000_10px,#000_20px)]"></div>
                        
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-black text-red-500 italic tracking-tighter mb-2">SUDDEN DEATH</h1>
                            <p className="text-red-200 font-mono text-xs uppercase tracking-widest">Tie Detected. Winner Takes All.</p>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-white mb-6 leading-relaxed">{sdQ.question}</h2>
                            <div className="grid grid-cols-1 gap-3">
                                {sdQ.options.map(opt => (
                                    <button 
                                        key={opt}
                                        onClick={() => handleSuddenDeathAnswer(opt)}
                                        className="p-4 rounded-xl border border-red-900/50 bg-red-900/10 hover:bg-red-600 hover:text-white hover:border-red-500 transition-all text-left text-gray-300 font-medium"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
      <div className="max-w-5xl mx-auto pb-20 px-4 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-xl font-bold flex items-center gap-2 text-white">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             Exam Results
           </h2>
           <button onClick={onReset} className="px-6 py-2 bg-white text-black rounded-full font-bold uppercase text-xs hover:bg-gray-200">Exit Session</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Score Card */}
            <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[300px]">
                <div className="absolute inset-0 bg-blue-900/10"></div>
                <h1 className="text-8xl font-serif font-bold mb-4 text-white relative z-10">{score}/{total}</h1>
                <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-mono text-blue-300 font-bold uppercase tracking-widest mb-6 border border-white/10">
                    {getXPFeedback(score)}
                </div>
                {strikes > 0 && <div className="text-[10px] text-red-400 font-mono uppercase tracking-widest">⚠️ {strikes} Focus Strikes Detected</div>}
            </div>
            
            {/* Feedback / Duel Leaderboard */}
            <div className="glass-panel rounded-3xl p-8 flex flex-col relative overflow-hidden min-h-[300px] border-l-4 border-l-amber-500">
                {duelId ? (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </span>
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Arena Standings</h3>
                        </div>
                        
                        {duelData?.status === 'SUDDEN_DEATH_PENDING' && (
                            <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-xl mb-4 animate-pulse">
                                <p className="text-red-400 font-bold text-xs uppercase text-center">⚠ TIE DETECTED. GENERATING NIGHTMARE...</p>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto space-y-2">
                            {duelData?.participants
                                .sort((a, b) => (b.score || 0) - (a.score || 0))
                                .map((p, i) => (
                                <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.score !== undefined ? 'bg-amber-900/10 border-amber-500/20' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-amber-500 font-bold w-6">#{i + 1}</div>
                                        <div className="text-sm font-bold text-gray-200">{p.name}</div>
                                    </div>
                                    <div className="text-xs font-mono font-bold text-white">
                                        {p.status === 'COMPLETED' || p.suddenDeathStatus === 'COMPLETED' ? `${p.score}/${total}` : '...'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col justify-center items-center h-full text-center">
                        <div className="absolute inset-0 bg-amber-900/5"></div>
                        <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 border border-amber-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                        </div>
                        <p className="text-xl md:text-2xl text-amber-100 font-serif italic leading-relaxed px-4">
                            "{feedback}"
                        </p>
                        <div className="mt-8 text-[10px] font-bold uppercase tracking-widest text-amber-500/60">
                            The Professor
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Question Review */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Detailed Analysis</h3>
          {questions.map((q, idx) => {
             const userAnswer = userAnswers[q.id];
             let isCorrect = false;
             
             if (q.type === 'Fill in the Gap') {
                 isCorrect = userAnswer?.toLowerCase().trim() === q.correct_answer?.toLowerCase().trim();
             } else if (q.type === 'Select All That Apply') {
                 const parsedCorrect = safeParseJSON(q.correct_answer);
                 isCorrect = userAnswer === JSON.stringify(parsedCorrect.sort());
             } else {
                 isCorrect = userAnswer === q.correct_answer;
             }

             const isSkipped = !userAnswer;
             const simpleExpl = simplifiedExplanations[q.id];

             return (
               <div key={q.id} className={`glass-panel rounded-2xl p-6 border-l-4 ${isCorrect ? 'border-l-green-500 bg-green-900/5' : isSkipped ? 'border-l-gray-500' : 'border-l-red-500 bg-red-900/5'}`}>
                  <div className="flex justify-between items-start mb-4">
                     <h4 className="text-lg font-medium text-white max-w-2xl">{idx + 1}. {q.question}</h4>
                     <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border ${
                         isCorrect ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                         isSkipped ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 
                         'bg-red-500/10 text-red-400 border-red-500/20'
                     }`}>
                        {isCorrect ? 'Correct' : isSkipped ? 'Skipped' : 'Incorrect'}
                     </span>
                  </div>
                  
                  <div className="text-sm text-gray-300 bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col gap-3 mt-4">
                      <div className="flex gap-3">
                          <div className="flex-1">
                              <strong className="block text-blue-400 uppercase tracking-wider text-[10px] mb-1">Explanation</strong>
                              {simpleExpl ? (
                                  <div className="animate-fade-in bg-amber-900/20 p-3 rounded-lg border border-amber-500/30 text-amber-100 leading-relaxed shadow-lg">
                                      <strong className="text-amber-500 text-[9px] uppercase block mb-1">Simplification (ELI5)</strong>
                                      {simpleExpl}
                                  </div>
                              ) : (
                                  q.explanation
                              )}
                          </div>
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                          <button 
                            onClick={() => handleELI5(q)} 
                            disabled={!!simpleExpl || loadingExplanation === q.id}
                            className="text-[10px] font-bold uppercase bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                          >
                            {loadingExplanation === q.id ? 'Translating...' : 'Explain Like I\'m 5'}
                          </button>
                      </div>
                  </div>
               </div>
             );
          })}
        </div>
      </div>
    );
  }

  // --- EXAM MODE ---
  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
       {/* HUD */}
       <div className="glass-panel p-3 sm:p-4 rounded-2xl mb-4 sticky top-4 z-30 flex flex-col gap-2 backdrop-blur-xl transition-all duration-700 border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
          <div className="flex justify-between items-center px-1 sm:px-2">
             <div className="flex items-center gap-2 sm:gap-3">
                 <div className="w-2 h-2 rounded-full animate-pulse bg-blue-500"></div>
                 <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate max-w-[120px] sm:max-w-none text-white">
                    {duelId ? 'DUEL IN PROGRESS' : 'LIVE EXAM'}
                 </span>
             </div>
             
             <div className="flex items-center gap-3">
                 <div className="font-mono text-sm sm:text-xl font-bold tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 min-w-[70px] text-center text-white">
                    {timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2,'0')}` : '∞'}
                 </div>
             </div>
          </div>
          
          {/* Question Palette */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 pt-2 px-1 border-t border-white/5">
             {questions.map((q, idx) => {
                 let statusColor = "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10";
                 const isFlagged = flaggedQuestions.includes(q.id);
                 
                 if (internalIndex === idx) {
                     statusColor = "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-500/30 shadow-lg z-10";
                 } else if (userAnswers[q.id]) {
                     statusColor = "bg-blue-900/20 text-blue-400 border-blue-500/30";
                 } else if (isFlagged) {
                     statusColor = "bg-amber-900/20 text-amber-500 border-amber-500/30";
                 }
                 
                 return (
                    <button 
                      key={q.id} 
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center text-xs font-bold transition-all relative ${statusColor}`}
                    >
                      {idx + 1}
                      {isFlagged && <div className="absolute top-[-2px] right-[-2px] w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_5px_orange] border border-black text-[6px] flex items-center justify-center">!</div>}
                    </button>
                 );
             })}
          </div>
       </div>

       {/* Question Card */}
       <div className="glass-panel rounded-3xl p-5 md:p-10 flex-1 relative flex flex-col shadow-2xl border-white/10">
          <div className="flex justify-between items-start mb-6 sm:mb-8">
              <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border text-blue-400 bg-blue-900/10 border-blue-500/20">Question {internalIndex + 1} / {total}</span>
              <button onClick={() => onFlagQuestion(currentQ.id)} className={`flex items-center gap-2 text-xs uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg transition-all ${flaggedQuestions.includes(currentQ.id) ? 'bg-amber-900/20 text-amber-500 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={flaggedQuestions.includes(currentQ.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 01-2-1.85V19a2 2 0 00-2 2h2zM5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H9c-1.105 0-2 .895-2 2v12z" /></svg>
                 {flaggedQuestions.includes(currentQ.id) ? 'Flagged' : 'Flag'}
              </button>
          </div>

          <h2 className="text-lg md:text-2xl font-medium mb-8 leading-relaxed text-white">{currentQ.question}</h2>
          
          <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
             {/* Dynamic Question Body */}
             {currentQ.type === 'Fill in the Gap' ? (
                 <div className="space-y-4">
                     <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Type your answer below:</p>
                     <input 
                        type="text" 
                        value={textAnswer}
                        onChange={(e) => setTextAnswer(e.target.value)}
                        onBlur={saveTextInput}
                        className="w-full bg-transparent border-b-2 border-white/20 text-2xl py-2 px-1 text-white outline-none focus:border-blue-500 transition-colors font-mono"
                        placeholder="Answer..."
                     />
                 </div>
             ) : currentQ.type === 'Select All That Apply' ? (
                 <div className="grid grid-cols-1 gap-3">
                     <p className="text-xs text-gray-500 uppercase mb-2">Select all options that apply:</p>
                     {currentQ.options.map((opt) => {
                         const isSelected = multiSelectAnswers.includes(opt);
                         return (
                             <button
                                key={opt}
                                onClick={() => toggleMultiSelect(opt)}
                                className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all group ${
                                    isSelected
                                    ? 'bg-blue-600/20 border-blue-500 text-white'
                                    : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10'
                                }`}
                             >
                                 <span>{opt}</span>
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                     {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                 </div>
                             </button>
                         )
                     })}
                 </div>
             ) : (
                 currentQ.options.map((opt) => (
                   <button 
                     key={opt} 
                     onClick={() => onAnswerSelect(currentQ.id, opt)}
                     className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all relative group ${
                        userAnswers[currentQ.id] === opt 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-900/20 scale-[1.01]' 
                        : 'bg-white/5 border-transparent text-gray-300 hover:bg-white/10 hover:border-white/10'
                     }`}
                   >
                     <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all ${userAnswers[currentQ.id] === opt ? 'bg-white/30' : 'bg-transparent'}`}></div>
                     <span className="relative z-10 text-sm sm:text-base">{opt}</span>
                   </button>
                 ))
             )}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
             <button 
               onClick={() => {
                   if (currentQ.type === 'Fill in the Gap') saveTextInput(); 
                   handlePrevQuestion();
               }} 
               disabled={internalIndex === 0} 
               className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-xs uppercase hover:bg-white/10 disabled:opacity-30 transition-all"
             >
               Prev
             </button>
             {internalIndex === questions.length - 1 ? (
                <button 
                    onClick={() => {
                        if (currentQ.type === 'Fill in the Gap') saveTextInput();
                        onSubmit();
                    }} 
                    className="px-10 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-white/10"
                >
                    Submit Exam
                </button>
             ) : (
                <button 
                    onClick={() => {
                        if (currentQ.type === 'Fill in the Gap') saveTextInput();
                        handleNextQuestion();
                    }} 
                    className="px-8 py-3 rounded-xl text-white font-bold text-xs uppercase transition-all shadow-lg bg-blue-600 hover:bg-blue-500 shadow-blue-900/20"
                >
                    Next
                </button>
             )}
          </div>
       </div>
    </div>
  );
};
