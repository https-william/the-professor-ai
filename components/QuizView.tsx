
import React, { useState, useEffect } from 'react';
import { QuizState, QuizQuestion } from '../types';
import { RadarChart } from './RadarChart';

interface QuizViewProps {
  quizState: QuizState;
  onAnswerSelect: (questionId: number, answer: string) => void;
  onFlagQuestion: (questionId: number) => void;
  onSubmit: () => void;
  onReset: () => void;
  onTimeExpired: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ 
  quizState, 
  onAnswerSelect, 
  onFlagQuestion,
  onSubmit, 
  onReset,
  onTimeExpired
}) => {
  const { questions, userAnswers, flaggedQuestions, isSubmitted, score, timeRemaining } = quizState;
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [focusStrikes, setFocusStrikes] = useState(0);

  // Focus Mode Logic
  useEffect(() => {
    if (!isSubmitted) {
        // Request Fullscreen
        const enterFullscreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (e) {
                console.log("Fullscreen blocked", e);
            }
        };
        // Trigger on mount (might be blocked by browser policy without user gesture)
        enterFullscreen();

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setFocusStrikes(prev => prev + 1);
                alert("FOCUS MODE VIOLATION: You left the exam window. This incident has been logged.");
            }
        };
        
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        };
    }
  }, [isSubmitted]);

  // Auto-Submit on too many strikes
  useEffect(() => {
      if (focusStrikes >= 3 && !isSubmitted) {
          alert("Academic Dishonesty Detected: Exam Auto-Submitted.");
          onSubmit();
      }
  }, [focusStrikes, isSubmitted, onSubmit]);

  const currentQ = questions[currentQuestionIdx];
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // --- REPORT CARD ---
  if (isSubmitted) {
    // Calculate Pseudo-Stats for Radar Chart based on performance
    const stats = {
        memory: percentage,
        logic: Math.min(100, percentage + 10), // Simulated
        speed: timeRemaining ? Math.min(100, (timeRemaining / 60) * 10) : 80,
        focus: Math.max(0, 100 - (focusStrikes * 33)),
        stamina: 90
    };

    return (
      <div className="max-w-5xl mx-auto pb-20 px-4">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-xl font-bold flex items-center gap-2">📊 Results</h2>
           <button onClick={onReset} className="px-6 py-2 bg-white text-black rounded-full font-bold uppercase text-xs">Exit</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                <h1 className="text-5xl font-serif font-bold mb-2 text-white">{percentage}%</h1>
                <p className="text-gray-400 mb-6">{percentage >= 50 ? "Passed" : "Failed"}</p>
                <div className="text-xs font-mono text-gray-500">Academic Integrity: {focusStrikes === 0 ? "Perfect" : "Compromised"}</div>
            </div>
            
            <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">Cognitive Profile</h3>
                <RadarChart stats={stats} />
            </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
             <div key={q.id} className="glass-panel rounded-2xl p-6 border-l-4 border-l-gray-700">
                <h4 className="text-lg font-medium mb-2">{q.question}</h4>
                <p className="text-gray-400 text-sm mb-2">Correct: {q.correct_answer}</p>
                <p className="text-gray-500 text-xs italic">{q.explanation}</p>
             </div>
          ))}
        </div>
      </div>
    );
  }

  // --- EXAM MODE ---
  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
       {/* HUD */}
       <div className="glass-panel p-4 rounded-xl mb-6 flex justify-between items-center sticky top-4 z-30">
          <span className="text-blue-400 font-bold uppercase text-xs">Q {currentQuestionIdx + 1}/{questions.length}</span>
          {focusStrikes > 0 && <span className="text-red-500 font-bold text-xs animate-pulse">⚠ STRIKE {focusStrikes}/3</span>}
          <span className="font-mono text-xl font-bold">{timeRemaining ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2,'0')}` : '∞'}</span>
       </div>

       <div className="glass-panel rounded-3xl p-6 md:p-12 flex-1 relative flex flex-col">
          <h2 className="text-xl md:text-2xl font-serif font-medium mb-8">{currentQ.question}</h2>
          
          <div className="space-y-3 flex-1 overflow-y-auto">
             {currentQ.options.map((opt) => (
               <button 
                 key={opt} 
                 onClick={() => onAnswerSelect(currentQ.id, opt)}
                 className={`w-full text-left p-4 rounded-xl border-2 transition-all ${userAnswers[currentQ.id] === opt ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
               >
                 {opt}
               </button>
             ))}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
             <button onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))} disabled={currentQuestionIdx === 0} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30">Prev</button>
             {currentQuestionIdx === questions.length - 1 ? (
                <button onClick={onSubmit} className="px-8 py-3 rounded-xl bg-white text-black font-bold uppercase hover:scale-105 transition-transform">Submit Exam</button>
             ) : (
                <button onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)} className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500">Next</button>
             )}
          </div>
       </div>
    </div>
  );
};
