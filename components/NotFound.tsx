import React from 'react';

interface NotFoundProps {
    onGoHome?: () => void;
}

/**
 * Professor-themed 404 Page
 * "Class Dismissed" - displayed when user navigates to unknown route
 */
export const NotFound: React.FC<NotFoundProps> = ({ onGoHome }) => {
    const handleGoHome = () => {
        if (onGoHome) {
            onGoHome();
        } else {
            window.location.href = '/';
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center p-6 text-center z-[200]">
            {/* Ambient Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full" />
            </div>

            {/* Glass Container */}
            <div className="relative glass-container glass-container--rounded max-w-lg w-full p-8">
                <div className="glass-filter" />
                <div className="glass-overlay" />
                <div className="glass-specular" />

                <div className="glass-content flex flex-col items-center">
                    {/* 404 Number with Glitch Effect */}
                    <div className="relative mb-6">
                        <h1 className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-600 leading-none font-display tracking-tighter">
                            404
                        </h1>
                        <div className="absolute inset-0 text-[120px] font-black text-red-500/20 leading-none font-display tracking-tighter blur-sm animate-pulse">
                            404
                        </div>
                    </div>

                    {/* Message */}
                    <h2 className="text-2xl font-bold text-white mb-3 font-display">
                        Class Dismissed
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-sm leading-relaxed">
                        The lecture you're looking for has been cancelled, moved, or never existed in the curriculum.
                    </p>

                    {/* Professor Icon */}
                    <div className="w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-red-900/30 to-black border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 w-full">
                        <button
                            onClick={handleGoHome}
                            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl uppercase text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                        >
                            Return to Campus
                        </button>
                    </div>

                    {/* Error Code */}
                    <p className="mt-6 text-xs font-mono text-gray-600 uppercase tracking-widest">
                        Error Code: LECTURE_NOT_FOUND
                    </p>
                </div>
            </div>

            {/* Bottom Decorative Text */}
            <p className="absolute bottom-8 text-xs font-mono text-gray-700 tracking-widest">
                THE PROFESSOR • ACADEMIC INTELLIGENCE SYSTEM
            </p>
        </div>
    );
};

export default NotFound;
