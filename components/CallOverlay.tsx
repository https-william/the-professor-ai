
import React, { useEffect, useRef, useState } from 'react';
import { callService, CallState } from '../services/callService';

interface CallOverlayProps {
    state: CallState;
    onToggleMic: () => void;
    onToggleCam: () => void;
    onEndCall: () => void;
    localStream: MediaStream | null;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({ state, onToggleMic, onToggleCam, onEndCall, localStream }) => {
    const localRef = useRef<HTMLVideoElement>(null);
    const remoteRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localRef.current && localStream) localRef.current.srcObject = localStream;
    }, [localStream]);

    useEffect(() => {
        if (remoteRef.current && state.remoteStream) remoteRef.current.srcObject = state.remoteStream;
    }, [state.remoteStream]);

    if (state.status === 'IDLE') return null;

    return (
        <div className="fixed top-24 right-4 z-50 w-72 bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-in">
            {/* Header */}
            <div className="bg-[#111] p-3 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${state.status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                    <span className="text-xs font-bold text-white uppercase">{state.status === 'CONNECTED' ? 'Linked' : state.status}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">SECURE LINE</div>
            </div>

            {/* Video Area */}
            <div className="relative aspect-video bg-black group">
                {state.status === 'CONNECTED' && (
                    <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
                )}

                {/* Local PIP */}
                <div className="absolute bottom-2 right-2 w-20 aspect-video bg-gray-900 rounded-lg overflow-hidden border border-white/20 shadow-lg">
                    <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                </div>

                {/* Status Overlay */}
                {state.status !== 'CONNECTED' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 animate-bounce">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                        </div>
                        <span className="text-xs font-mono uppercase">Signal Search...</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-4 flex justify-center gap-4 bg-[#111]">
                <button onClick={onToggleCam} className={`p - 3 rounded - full transition - colors ${state.isVideoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500'} `}>
                    📷
                </button>
                <button onClick={onToggleMic} className={`p - 3 rounded - full transition - colors ${state.isAudioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500'} `}>
                    🎙️
                </button>
                <button onClick={onEndCall} className="p-3 rounded-full bg-red-600 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                    📞
                </button>
            </div>
        </div>
    );
};

export const IncomingCallModal: React.FC<{ callerId: string, onAccept: () => void, onReject: () => void }> = ({ callerId, onAccept, onReject }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-green-500/30 flex flex-col items-center shadow-[0_0_50px_rgba(34,197,94,0.2)]">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-6 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 ring-call" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Incoming Signal</h3>
            <p className="text-gray-400 text-sm mb-8 font-mono">{callerId || "Unknown Agent"}</p>

            <div className="flex gap-4 w-full">
                <button onClick={onReject} className="flex-1 py-3 bg-red-900/30 border border-red-500/30 text-red-500 rounded-xl font-bold uppercase text-xs hover:bg-red-900/50 transition-colors">Decline</button>
                <button onClick={onAccept} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold uppercase text-xs hover:bg-green-500 shadow-lg hover:scale-105 transition-all">Accept</button>
            </div>
        </div>
    </div>
);
