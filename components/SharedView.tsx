
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShareLink } from '../services/supabase';
import { ProfessorView } from './ProfessorView';
import { QuizView } from './QuizView';
import { QuizState, ProfessorState } from '../types';
import { BrandLogo } from './BrandLogo';

export const SharedView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [data, setData] = useState<any>(null);
    const [type, setType] = useState<'EXAM' | 'PROFESSOR' | null>(null);

    // Initial state reconstruction
    const [quizState, setQuizState] = useState<QuizState | null>(null);
    const [profState, setProfState] = useState<ProfessorState | null>(null);

    useEffect(() => {
        const fetchShare = async () => {
            if (!id) return;
            const result = await getShareLink(id);
            if (result) {
                setType(result.type);
                setData(result.data);
                
                if (result.type === 'EXAM') {
                    // Reconstruct fresh quiz state from stored questions
                    setQuizState({
                        questions: result.data.questions,
                        userAnswers: {},
                        flaggedQuestions: [],
                        isSubmitted: false,
                        score: 0,
                        startTime: Date.now(),
                        timeRemaining: result.data.timeRemaining || null, 
                        currentQuestionIndex: 0
                    });
                } else if (result.type === 'PROFESSOR') {
                    setProfState(result.data);
                }
            } else {
                setError(true);
            }
            setLoading(false);
        };
        fetchShare();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest animate-pulse">Retrieving Archives...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl mb-4">404</h1>
                <p className="text-gray-400 mb-8">This neural link has expired or never existed.</p>
                <button onClick={() => navigate('/')} className="px-6 py-3 bg-white text-black rounded-xl font-bold uppercase text-xs">Return Home</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white relative">
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-8 h-8"><BrandLogo /></div>
                    <span className="font-bold font-serif hidden sm:block">The Professor</span>
                </div>
                <div className="bg-blue-900/20 border border-blue-500/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Read Only Mode</span>
                </div>
            </div>

            <div className="pt-20 pb-32">
                {type === 'PROFESSOR' && profState && (
                    <ProfessorView 
                        state={profState} 
                        onExit={() => navigate('/')} 
                        timeRemaining={null} 
                    />
                )}

                {type === 'EXAM' && quizState && (
                    <QuizView 
                        quizState={quizState}
                        onAnswerSelect={(qId, ans) => setQuizState(prev => prev ? ({ ...prev, userAnswers: { ...prev.userAnswers, [qId]: ans } }) : null)}
                        onFlagQuestion={(qId) => setQuizState(prev => prev ? ({ ...prev, flaggedQuestions: prev.flaggedQuestions.includes(qId) ? prev.flaggedQuestions.filter(i => i !== qId) : [...prev.flaggedQuestions, qId] }) : null)}
                        onSubmit={() => {
                            // Calculate Score Locally for the guest
                            let score = 0;
                            quizState.questions.forEach(q => { if (quizState.userAnswers[q.id] === q.correct_answer) score++; });
                            setQuizState(prev => prev ? ({ ...prev, isSubmitted: true, score }) : null);
                        }}
                        onReset={() => window.location.reload()}
                        onTimeExpired={() => {}}
                        onIndexChange={(idx) => setQuizState(prev => prev ? ({ ...prev, currentQuestionIndex: idx }) : null)}
                    />
                )}
            </div>

            {/* Sticky CTA Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f10] border-t border-white/10 p-4 z-50 animate-slide-up-fade">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <h4 className="text-sm font-bold text-white">Generate your own study materials.</h4>
                        <p className="text-xs text-gray-500">Join The Professor AI for free.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-8 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg"
                    >
                        Access Terminal
                    </button>
                </div>
            </div>
        </div>
    );
};
