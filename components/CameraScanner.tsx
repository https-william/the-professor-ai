
import React, { useRef, useState, useEffect } from 'react';

interface CameraScannerProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
  mode: 'QUIZ' | 'SOLVE';
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose, mode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // Use ref to persist stream for cleanup
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } // Prefer back camera
        });
        streamRef.current = mediaStream; // Store in ref
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera Error:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      // Robust cleanup using ref
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
        });
        streamRef.current = null;
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // High quality JPEG
        const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col animate-fade-in">
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {hasPermission === false && (
            <div className="text-white text-center p-6">
                <p className="text-red-400 font-bold mb-2">Camera Access Denied</p>
                <p className="text-gray-400 text-sm">Please enable camera permissions in your browser settings.</p>
                <button onClick={onClose} className="mt-6 px-6 py-2 bg-white/10 rounded-full text-sm">Close</button>
            </div>
        )}
        
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/90 to-transparent"></div>
            
            {/* Scanner Bracket */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] border-2 border-amber-500/30 rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-xl"></div>
                
                {/* Scanning Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-400/50 blur-sm animate-[slideIn_2s_linear_infinite]"></div>
            </div>
            
            <div className="absolute top-8 left-0 w-full text-center">
                <span className="bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/10 shadow-lg">
                    {mode === 'QUIZ' ? 'Scan Textbook Page' : 'Snap Problem'}
                </span>
            </div>
        </div>
      </div>

      <div className="h-32 bg-black flex items-center justify-between px-10 pb-4 relative z-20">
         <button onClick={onClose} className="text-white opacity-60 hover:opacity-100 font-bold text-xs uppercase tracking-widest">Cancel</button>
         
         <button 
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
         >
            <div className="w-16 h-16 bg-white rounded-full"></div>
         </button>
         
         <div className="w-10"></div> {/* Spacer for balance */}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
