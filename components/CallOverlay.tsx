
import React, { useEffect, useRef, useState } from 'react';
import { callService } from '../services/callService';

interface CallOverlayProps {
  remotePeerId: string;
  onClose: () => void;
  isIncoming?: boolean;
  onAccept?: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({ remotePeerId, onClose, isIncoming, onAccept }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(isIncoming ? 'INCOMING TRANSMISSION' : 'ESTABLISHING LINK');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (isIncoming) return; // Wait for accept

    // Handle Local Stream
    callService.getMedia(true, true).then(stream => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    });

    // Handle Remote Stream Events from Service
    const handleStream = (peerId: string, stream: MediaStream) => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            setConnectionStatus('SECURE LINK ACTIVE');
        }
    };

    const handleClose = () => {
        setConnectionStatus('LINK TERMINATED');
        setTimeout(onClose, 1000);
    };

    callService.onStream = handleStream;
    callService.onPeerClose = handleClose;

    return () => {
        callService.onStream = null;
        callService.onPeerClose = null;
    };
  }, [isIncoming]);

  const handleAcceptCall = async () => {
      if (onAccept) {
          onAccept();
          setConnectionStatus('CONNECTING...');
          const stream = await callService.getMedia(true, true);
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      }
  };

  const toggleMute = () => {
      callService.toggleAudio(!isMuted); // Note: Service logic might need inversion depending on implementation, assuming true = enabled
      setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
      callService.toggleVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
  };

  if (isMinimized) {
      return (
          <div 
            onClick={() => setIsMinimized(false)}
            className="fixed bottom-24 right-6 z-[100] w-16 h-16 rounded-full bg-green-500 border-2 border-white shadow-[0_0_20px_lime] flex items-center justify-center cursor-pointer animate-pulse"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
      );
  }

  return (
    <div className="fixed top-20 right-6 z-[100] w-80 md:w-96 bg-[#0f0f10]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col transition-all">
        
        {/* Header / Status */}
        <div className="h-10 bg-black/50 border-b border-white/5 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connectionStatus.includes('ACTIVE') ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-bounce'}`}></div>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{connectionStatus}</span>
            </div>
            <button onClick={() => setIsMinimized(true)} className="text-gray-500 hover:text-white">-</button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black group">
            {/* Remote Video */}
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {/* Incoming Call UI Overlay */}
            {isIncoming && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center mb-4 animate-ping">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <p className="text-white font-bold text-sm uppercase tracking-widest mb-6">Incoming Transmission</p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2 bg-red-600 rounded-full text-white font-bold text-xs uppercase hover:bg-red-500">Decline</button>
                        <button onClick={handleAcceptCall} className="px-6 py-2 bg-green-600 rounded-full text-white font-bold text-xs uppercase hover:bg-green-500 shadow-[0_0_15px_lime]">Accept</button>
                    </div>
                </div>
            )}

            {/* Local Video (PIP) */}
            {!isIncoming && (
                <div className="absolute bottom-4 right-4 w-24 h-36 bg-[#1a1a1a] rounded-lg border border-white/20 overflow-hidden shadow-lg">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
            )}
        </div>

        {/* Controls (Only show if active) */}
        {!isIncoming && (
            <div className="p-4 flex justify-center gap-4 bg-black/20">
                <button 
                    onClick={toggleMute} 
                    className={`p-3 rounded-full border transition-all ${isMuted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/10 border-transparent text-white hover:bg-white/20'}`}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>
                <button 
                    onClick={onClose} 
                    className="p-3 px-6 rounded-full bg-red-600 text-white font-bold uppercase text-xs tracking-wider hover:bg-red-500 shadow-lg"
                >
                    End Call
                </button>
                <button 
                    onClick={toggleVideo} 
                    className={`p-3 rounded-full border transition-all ${isVideoOff ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/10 border-transparent text-white hover:bg-white/20'}`}
                >
                    {isVideoOff ? '🚫' : '📷'}
                </button>
            </div>
        )}
    </div>
  );
};
