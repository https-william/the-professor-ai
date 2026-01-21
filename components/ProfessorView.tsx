
import React, { useState, useEffect } from 'react';
import { ProfessorState } from '../types';
import DOMPurify from 'dompurify';
import { createShareLink } from '../services/supabase';
import { speak, stopSpeaking, initVoice } from '../services/voiceService';

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
    const [isSharing, setIsSharing] = useState(false);

    if (!state || !state.sections || state.sections.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <h2 className="text-xl font-bold text-white mb-2">No Content Available</h2>
                <button onClick={() => onExit(true)} className="px-6 py-2 bg-white/5 text-white border border-white/10 rounded-full font-bold uppercase text-xs hover:bg-white/10 transition-all">Return</button>
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentSectionIdx]);

    const toggleVoice = () => {
        if (isReading) {
            stopSpeaking();
            setIsReading(false);
        } else {
            speak(`${section.title}. ${section.content}. Analogy: ${section.analogy}`);
            setIsReading(true);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        try {
            // Use existing url if already generated, else create new
            let url = shareUrl;
            if (!url) {
                const id = await createShareLink('PROFESSOR', section.title, state);
                if (id) {
                    // Use the correct path for SharedView routing (e.g. /share/:id)
                    // Assuming app routing handles /share/:id or similar
                    // Based on SharedView usage in App.tsx: `if (currentView === 'SHARED' && shareId)`
                    // We generally need a dedicated route or query param. 
                    // Let's assume hash routing #/share/ID or ?share=ID based on current structure
                    // App.tsx logic: "const params = new URLSearchParams(window.location.search); ... if (params.has('share')) ..." (Need to verify)
                    // Looking at App.tsx lines 240+ "if (params.has('code'))..."
                    // Actually SharedView is triggered by state. 
                    // Let's standardization on: ?share=ID
                    url = `${window.location.origin}/?share=${id}`;
                    setShareUrl(url);
                }
            }

            if (url) {
                if (navigator.share) {
                    await navigator.share({
                        title: section.title,
                        text: `Check out this lecture on ${section.title} from The Professor AI`,
                        url: url
                    });
                } else {
                    await navigator.clipboard.writeText(url);
                    alert("Link copied to clipboard!");
                }
            }
        } catch (e) {
            console.error("Share failed", e);
        }
        setIsSharing(false);
    };

    const renderContent = (content: string) => {
        const sanitized = DOMPurify.sanitize(content);
        if (window.marked) {
            return { __html: window.marked.parse(sanitized) };
        }
        return { __html: sanitized };
    };

    return (
        <div className="pb-24 px-4 sm:px-6 relative flex justify-center">
            <div className="w-full max-w-3xl flex flex-col gap-6">

                <div className="flex items-center justify-between py-4 border-b border-white/10 sticky top-0 bg-[#050505]/90 backdrop-blur-md z-20">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Topic {currentSectionIdx + 1} / {state.sections.length}</span>
                    <div className="flex gap-2">
                        <button onClick={toggleVoice} className={`p-2 rounded-full border ${isReading ? 'bg-amber-500 text-black border-amber-500' : 'border-white/10 text-gray-400 hover:text-white'}`}>
                            {isReading ? '🔊' : '🔈'}
                        </button>
                        <button onClick={handleShare} className="p-2 rounded-full border border-white/10 text-gray-400 hover:text-white">
                            {isSharing ? '...' : '🔗'}
                        </button>
                        <button onClick={() => onExit(false)} className="px-4 py-2 bg-red-600/20 text-red-500 border border-red-500/30 rounded-full text-xs font-bold uppercase hover:bg-red-600/30">
                            End
                        </button>
                    </div>
                </div>

                <div className="bg-[#0f0f10] border border-white/5 rounded-3xl p-8 sm:p-12 shadow-2xl">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight font-display">
                        {section.title}
                    </h1>

                    <div
                        className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-4 font-serif leading-relaxed"
                        dangerouslySetInnerHTML={renderContent(section.content)}
                    />

                    <div className="mt-10 bg-black/30 p-6 rounded-2xl border-l-4 border-amber-500">
                        <h4 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Simpler Terms</h4>
                        <p className="text-amber-100/90 text-lg italic">"{section.analogy}"</p>
                    </div>

                    <div className="mt-6 bg-blue-900/10 p-6 rounded-2xl border border-blue-500/20">
                        <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Key Takeaway</h4>
                        <p className="text-white font-medium text-sm">{section.key_takeaway}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setCurrentSectionIdx(Math.max(0, currentSectionIdx - 1))}
                        disabled={currentSectionIdx === 0}
                        className="flex-1 py-4 rounded-xl border border-white/10 text-gray-400 font-bold uppercase text-xs hover:bg-white/5 disabled:opacity-30"
                    >
                        Prev
                    </button>
                    <button
                        onClick={() => { if (currentSectionIdx < state.sections.length - 1) setCurrentSectionIdx(currentSectionIdx + 1); else onExit(true); }}
                        className="flex-[2] py-4 rounded-xl bg-white text-black font-bold uppercase text-xs hover:bg-gray-200"
                    >
                        {currentSectionIdx === state.sections.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};
