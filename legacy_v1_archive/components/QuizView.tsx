
import React, { useState, useEffect, useRef } from 'react';
import { QuizState, QuizQuestion, Difficulty, DuelState } from '../types';
import { simplifyExplanation, generateSuddenDeathQuestion, generateWittyFeedback } from '../services/geminiService';
import { subscribeToDuel, activateSuddenDeath, submitSuddenDeathAnswer } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
// import confetti from 'canvas-confetti'; 

interface QuizViewProps {
    quizState: QuizState;
    onAnswerSelect: (questionId: number, answer: string) => void;
    onFlagQuestion: (questionId: number) => void;
    onSubmit: () => void;
    onReset: () => void;
    onTimeExpired: () => void;
    duelId?: string | null;
    onIndexChange: (index: number) => void;
}

const safeParseJSON = (str: string | undefined | null, fallback: any = []) => {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        return fallback;
    }
};

export const QuizView: React.FC<QuizViewProps> = ({
    quizState, onAnswerSelect, onFlagQuestion, onSubmit, onReset, onTimeExpired, duelId, onIndexChange
}) => {
    const { user } = useAuth();
    const { questions, userAnswers, flaggedQuestions, isSubmitted, score, timeRemaining: initialTime, focusStrikes, currentQuestionIndex } = quizState;
    const [internalIndex, setInternalIndex] = useState(currentQuestionIndex || 0);
    const [timeLeft, setTimeLeft] = useState<number | null>(initialTime);
    const [showGrid, setShowGrid] = useState(false);
    const [textAnswer, setTextAnswer] = useState('');
    const [multiSelectAnswers, setMultiSelectAnswers] = useState<string[]>([]);
    const [aiFeedback, setAiFeedback] = useState("Analyzing Performance Data...");

    // Confetti trigger
    useEffect(() => {
        if (isSubmitted) {
            generateWittyFeedback(score, questions.length).then(setAiFeedback);
        }
    }, [isSubmitted, score]);

    useEffect(() => { setInternalIndex(currentQuestionIndex || 0); }, [currentQuestionIndex]);

    useEffect(() => {
        if (!questions || questions.length === 0) return;
        const q = questions[internalIndex];
        if (!q) return;
        const savedAnswer = userAnswers[q.id];
        if (q.type === 'Fill in the Gap') setTextAnswer(savedAnswer || '');
        else if (q.type === 'Select All That Apply') setMultiSelectAnswers(safeParseJSON(savedAnswer, []));
    }, [internalIndex, userAnswers, questions]);

    useEffect(() => {
        if (isSubmitted) return;
        const timer = setInterval(() => setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isSubmitted]);

    const handleJumpToQuestion = (idx: number) => {
        if (currentQ?.type === 'Fill in the Gap') saveTextInput();
        setInternalIndex(idx);
        onIndexChange(idx);
        setShowGrid(false);
    };

    const handleNextQuestion = () => {
        if (internalIndex < questions.length - 1) {
            handleJumpToQuestion(internalIndex + 1);
        } else { onSubmit(); }
    };

    const currentQ = questions?.[internalIndex];
    if (!currentQ && !isSubmitted) return <div className="text-white text-center mt-20 font-serif">Connection Lost</div>;

    const total = questions.length;
    const saveTextInput = () => { if (textAnswer.trim() && currentQ) onAnswerSelect(currentQ.id, textAnswer.trim()); };

    const toggleMultiSelect = (opt: string) => {
        let newSelection = multiSelectAnswers.includes(opt) ? multiSelectAnswers.filter(o => o !== opt) : [...multiSelectAnswers, opt].sort();
        setMultiSelectAnswers(newSelection);
        if (currentQ) onAnswerSelect(currentQ.id, JSON.stringify(newSelection));
    };

    const handleShareResult = async () => {
        const text = `I just scored ${score}/${total} heavily on The Professor!`;
        if (navigator.share) {
            try { await navigator.share({ title: 'Exam Result', text: text, url: window.location.href }); } catch (e) { }
        } else {
            navigator.clipboard.writeText(text);
            alert("Score copied to clipboard!");
        }
    };

    // --- RENDER: SUBMITTED VIEW ---
    if (isSubmitted) {
        const percentage = (score / total) * 100;
        const isVictory = percentage >= 80;

        return (
            <div className="max-w-5xl mx-auto pb-24 px-4 animate-slide-up-fade custom-scrollbar">

                {/* HEADS UP DISPLAY */}
                <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#050505]/95 backdrop-blur-xl py-4 z-50 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isVictory ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        <h2 className="text-xl font-serif font-bold text-white tracking-wide">Performance Review</h2>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleShareResult} className="px-5 py-2 bg-white/5 text-gray-300 border border-white/10 rounded font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                            Share
                        </button>
                        <button onClick={onReset} className="px-5 py-2 bg-white text-black border border-white rounded font-bold text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">
                            Exit
                        </button>
                    </div>
                </div>

                {/* MAIN SCORE CARD */}
                <div className={`glass-panel-heavy rounded-2xl p-12 flex flex-col items-center justify-center text-center mb-10 overflow-hidden relative border ${isVictory ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>

                    {/* Background Effects */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className={`absolute top-0 w-full h-px bg-gradient-to-r from-transparent ${isVictory ? 'via-emerald-500' : 'via-amber-500'} to-transparent opacity-30`}></div>
                        <div className={`absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent ${isVictory ? 'via-emerald-500' : 'via-amber-500'} to-transparent opacity-30`}></div>
                    </div>

                    <h1 className="text-8xl font-serif font-bold mb-2 text-white relative z-10 tracking-tight">
                        {score}<span className="text-4xl text-gray-600">/{total}</span>
                    </h1>

                    <div className={`px-4 py-1.5 rounded border mb-8 z-10 font-mono text-[10px] uppercase tracking-[0.3em] ${isVictory ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                        {isVictory ? 'High Proficiency' : 'Review Recommended'}
                    </div>

                    <div className="max-w-lg mx-auto bg-black/40 border border-white/5 p-6 rounded relative z-10">
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#050505] border border-white/10 text-gray-500 text-[9px] font-mono uppercase tracking-widest">
                            Professor's Feedback
                        </div>
                        <p className="text-gray-300 font-serif text-lg leading-relaxed italic">
                            "{aiFeedback}"
                        </p>
                    </div>
                </div>

                {/* QUESTION BREAKDOWN */}
                <div className="space-y-4">
                    <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-6 pl-2 border-l-2 border-cyan-500">Neural Analysis Log</h3>

                    {questions.map((q, idx) => {
                        const userAnswer = userAnswers[q.id];
                        const isCorrect = userAnswer === q.correct_answer;

                        return (
                            <div key={q.id} className={`p-6 rounded border transition-all hover:bg-white/[0.02] ${isCorrect ? 'bg-cyan-900/5 border-cyan-500/20' : 'bg-red-900/5 border-red-500/20'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-mono text-gray-500 uppercase">Query Sequence {idx + 1}</span>
                                    <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded border ${isCorrect ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                                        {isCorrect ? 'Match' : 'Divergence'}
                                    </span>
                                </div>
                                <h4 className="text-white font-serif text-lg mb-4">{q.question}</h4>
                                <div className="bg-[#0A0A0C] p-4 rounded border border-white/5 text-sm text-gray-400 leading-relaxed relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-white/10"></div>
                                    <span className="text-[9px] text-gray-600 uppercase font-mono tracking-widest block mb-2">logic_trace:</span>
                                    {q.explanation}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- RENDER: EXAM VIEW ---
    return (
        <div className="max-w-5xl mx-auto h-full flex flex-col relative px-4 sm:px-0">

            {/* HUD / TOP BAR */}
            <div className="glass-panel-heavy p-4 rounded-b-2xl mb-6 sticky top-0 z-30 flex justify-between items-center border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                            <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75"></div>
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase text-gray-400 tracking-widest">{duelId ? 'SYNCED DUEL' : 'EXAM PROTOCOL'}</span>
                    </div>
                    <button onClick={() => setShowGrid(!showGrid)} className={`px-3 py-1 rounded border text-[9px] font-mono uppercase tracking-widest transition-all ${showGrid ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-gray-500 border-transparent hover:text-white'}`}>
                        {showGrid ? 'Close Nav' : 'Open Nav'}
                    </button>
                    {flaggedQuestions.includes(currentQ.id) && <span className="text-[10px] text-amber-500 font-mono animate-pulse">⚠ FLAGGED</span>}
                </div>
                <div className="font-mono text-xl font-bold bg-[#050505] px-4 py-2 rounded text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                    {timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : '∞'}
                </div>
            </div>

            {/* NAVIGATION GRID OVERLAY */}
            {showGrid && (
                <div className="mb-6 bg-black/90 p-6 rounded-xl border border-white/10 animate-slide-up-fade">
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                        {questions.map((q, idx) => (
                            <button key={q.id} onClick={() => handleJumpToQuestion(idx)}
                                className={`
                                    w-full aspect-square rounded flex items-center justify-center text-xs font-mono font-bold border transition-all
                                    ${idx === internalIndex ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_#00F0FF]' :
                                        userAnswers[q.id] ? 'bg-cyan-900/20 text-cyan-500 border-cyan-700/50' :
                                            'bg-white/5 border-white/10 text-gray-600 hover:bg-white/10'}
                                `}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN QUESTION INTERFACE */}
            <div className="glass-panel-heavy rounded-2xl flex-1 flex flex-col shadow-2xl relative overflow-hidden border border-white/5">

                {/* Tech Corners */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t font-mono text-[9px] text-gray-600 p-2">UL-01</div>
                <div className="absolute top-0 right-0 w-16 h-16 border-r border-t-0 p-2 text-right"><div className="w-2 h-2 bg-gray-800 rounded-full ml-auto"></div></div>

                <div className="p-8 md:p-12 flex-1 flex flex-col z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest bg-cyan-900/10 px-2 py-1 rounded mb-2 inline-block">Query Node {internalIndex + 1}</span>
                            <div className="h-px w-20 bg-cyan-500/50 mt-1"></div>
                        </div>
                        <button onClick={() => onFlagQuestion(currentQ.id)} className="text-gray-600 hover:text-amber-500 transition-colors">
                            <svg className="w-5 h-5" fill={flaggedQuestions.includes(currentQ.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-8a2 2 0 012-2h10a2 2 0 012 2v6l-2-2h-2m2-10V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14" /></svg>
                        </button>
                    </div>

                    <h2 className="text-xl md:text-3xl font-serif leading-tight mb-10 text-white drop-shadow-md">
                        {currentQ.question}
                    </h2>

                    <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {currentQ.type === 'Fill in the Gap' ? (
                            <div className="relative group">
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/20 group-focus-within:bg-cyan-500 transition-colors"></div>
                                <input type="text" value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} onBlur={saveTextInput}
                                    className="w-full bg-transparent text-3xl font-light py-4 text-white outline-none placeholder-gray-800 font-sans"
                                    placeholder="Input Answer..."
                                />
                            </div>
                        ) : currentQ.type === 'Select All That Apply' ? (
                            currentQ.options.map((opt) => (
                                <button key={opt} onClick={() => toggleMultiSelect(opt)}
                                    className={`
                                        w-full text-left p-5 rounded-xl border transition-all flex items-center justify-between group
                                        ${multiSelectAnswers.includes(opt)
                                            ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-100 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'}
                                    `}
                                >
                                    <span className="text-lg">{opt}</span>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${multiSelectAnswers.includes(opt) ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}`}>
                                        {multiSelectAnswers.includes(opt) && <span className="text-black text-xs">✓</span>}
                                    </div>
                                </button>
                            ))
                        ) : (
                            currentQ.options.map((opt, i) => (
                                <button key={opt} onClick={() => onAnswerSelect(currentQ.id, opt)}
                                    className={`
                                        w-full text-left p-5 rounded-xl border transition-all group relative overflow-hidden
                                        ${userAnswers[currentQ.id] === opt
                                            ? 'bg-cyan-900/20 border-cyan-500 text-white shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                                            : 'bg-[#0A0A0C] border-white/5 text-gray-400 hover:bg-white/5 hover:text-gray-200 hover:border-white/20'}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs ${userAnswers[currentQ.id] === opt ? 'border-cyan-500 text-cyan-400' : 'border-white/10 text-gray-600'}`}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span className="text-lg font-light">{opt}</span>
                                    </div>
                                    {/* Selection Glow */}
                                    {userAnswers[currentQ.id] === opt && <div className="absolute inset-0 bg-cyan-400/5 pointer-events-none animate-pulse"></div>}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="flex justify-between mt-10 pt-8 border-t border-white/5 items-center">
                        <button onClick={() => { if (currentQ.type === 'Fill in the Gap') saveTextInput(); if (internalIndex > 0) handleJumpToQuestion(internalIndex - 1); }} disabled={internalIndex === 0}
                            className="px-6 py-3 rounded text-gray-500 font-mono text-[10px] uppercase tracking-widest hover:text-white disabled:opacity-20 transition-colors"
                        >
                            ← Previous
                        </button>

                        {/* Progress Dots */}
                        <div className="hidden md:flex gap-1">
                            {questions.map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === internalIndex ? 'bg-cyan-500' : i < internalIndex ? 'bg-gray-600' : 'bg-gray-800'}`}></div>
                            ))}
                        </div>

                        <button onClick={() => { if (currentQ.type === 'Fill in the Gap') saveTextInput(); internalIndex === questions.length - 1 ? onSubmit() : handleNextQuestion(); }}
                            className={`
                                px-8 py-3 rounded font-bold text-xs uppercase tracking-[0.2em] transition-all relative overflow-hidden group
                                ${internalIndex === questions.length - 1 ? 'bg-amber-600/20 text-amber-500 border border-amber-500/50 hover:bg-amber-600/40' : 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-900/40'}
                            `}
                        >
                            <span className="relative z-10">{internalIndex === questions.length - 1 ? 'Finalize Exam' : 'Next Node'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizView;
