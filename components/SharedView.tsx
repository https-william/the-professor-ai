
import React, { useEffect, useState, Suspense } from 'react';
import { getShareData } from '../services/supabase';
import { ProfessorView } from './ProfessorView';
import { QuizView } from './QuizView';
import { QuizState, ProfessorState } from '../types';

interface SharedViewProps {
    shareId: string;
    onNavigateHome: () => void;
}

export const SharedView: React.FC<SharedViewProps> = ({ shareId, onNavigateHome }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Quiz State Wrapper for Read-Only interactions
    const [quizState, setQuizState] = useState<QuizState | null>(null);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const result = await getShareData(shareId);
            if (!result) {
                setError("This link has expired or is invalid.");
            } else {
                setData(result);
                if (result.type === 'EXAM') {
                    // Initialize a fresh quiz state based on shared data
                    setQuizState({
                        questions: result.data.questions,
                        userAnswers: {},
                        flaggedQuestions: [],
                        isSubmitted: false,
                        score: 0,
                        startTime: Date.now(),
                        timeRemaining: null, // Limitless for shared
                        focusStrikes: 0,
                        currentQuestionIndex: 0
                    });
                }
            }
            setLoading(false);
        };
        fetch();
    }, [shareId]);

    if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-white rounded-full animate-spin"></div></div>;
    if (error) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-500 font-bold">{error}</div>;

    return (
        <div className="min-h-screen bg-[#050505] pb-24">
            {/* Shared Header */}
            <div className="border-b border-white/5 bg-black/40 p-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
                        Shared {data.type === 'EXAM' ? 'Exam' : 'Lecture'}
                    </div>
                    <span className="text-white font-bold text-sm hidden sm:block">{data.title || 'Untitled Session'}</span>
                </div>
                <button onClick={onNavigateHome} className="px-4 py-2 bg-white text-black text-xs font-bold uppercase rounded-full hover:bg-gray-200">
                    Create Your Own
                </button>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-8">
                {data.type === 'PROFESSOR' ? (
                    <ProfessorView 
                        state={data.data as ProfessorState} 
                        onExit={() => {}} 
                        timeRemaining={null} 
                    />
                ) : quizState ? (
                    <QuizView 
                        quizState={quizState}
                        onAnswerSelect={(qId, ans) => setQuizState(prev => prev ? ({ ...prev, userAnswers: { ...prev.userAnswers, [qId]: ans } }) : null)}
                        onFlagQuestion={(qId) => setQuizState(prev => prev ? ({ ...prev, flaggedQuestions: prev.flaggedQuestions.includes(qId) ? prev.flaggedQuestions.filter(id => id !== qId) : [...prev.flaggedQuestions, qId] }) : null)}
                        onSubmit={() => {
                            // Calculate Score Locally
                            let score = 0;
                            quizState.questions.forEach(q => {
                                if (quizState.userAnswers[q.id] === q.correct_answer) score++;
                            });
                            setQuizState(prev => prev ? ({ ...prev, isSubmitted: true, score }) : null);
                        }}
                        onReset={() => window.location.reload()} // Just reload to retry shared exam
                        onTimeExpired={() => {}}
                        onIndexChange={(idx) => setQuizState(prev => prev ? ({...prev, currentQuestionIndex: idx}) : null)}
                    />
                ) : null}
            </div>

            {/* Sticky Footer CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f10] border-t border-amber-500/20 p-4 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <p className="text-white font-bold text-sm">Study Smarter, Not Harder.</p>
                        <p className="text-gray-500 text-xs">Generated by The Professor AI.</p>
                    </div>
                    <button onClick={onNavigateHome} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg hover:scale-105 transition-transform">
                        Launch App
                    </button>
                </div>
            </div>
        </div>
    );
};
