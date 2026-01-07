
import React, { useRef, useState, useEffect } from 'react';

interface CameraScannerProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
  mode: 'QUIZ' | 'SOLVE';
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose, mode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        streamRef.current = mediaStream;
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
      setIsScanning(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        
        // Simulate Scan Delay for Effect
        setTimeout(() => {
            onCapture(base64);
        }, 800);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col animate-fade-in font-mono">
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {hasPermission === false && (
            <div className="text-white text-center p-6">
                <p className="text-red-400 font-bold mb-2">Camera Access Denied</p>
                <p className="text-gray-400 text-sm">Please enable camera permissions.</p>
                <button onClick={onClose} className="mt-6 px-6 py-2 bg-white/10 rounded-full text-sm">Close</button>
            </div>
        )}
        
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        
        {/* OCR SNIPER HUD */}
        <div className="absolute inset-0 pointer-events-none">
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-10"></div>
            
            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/90 to-transparent flex flex-col items-center pt-8">
                <span className="bg-green-900/30 text-green-400 px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-[0.2em] border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    {mode === 'QUIZ' ? 'INPUT MODE: TEXT RECOGNITION' : 'INPUT MODE: PROBLEM SOLVER'}
                </span>
                <div className="flex gap-1 mt-2">
                    <span className="w-16 h-0.5 bg-green-500/50"></span>
                    <span className="w-2 h-0.5 bg-green-500/50"></span>
                    <span className="w-2 h-0.5 bg-green-500/50"></span>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/90 to-transparent"></div>
            
            {/* Target Reticle */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] transition-all duration-300 ${isScanning ? 'border-green-400 bg-green-500/10' : 'border-white/30'} border-2 rounded-lg overflow-hidden`}>
                {/* Corner Markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500"></div>
                
                {/* Center Crosshair */}
                <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-green-500/50 -translate-x-1/2"></div>
                <div className="absolute top-1/2 left-1/2 h-4 w-0.5 bg-green-500/50 -translate-y-1/2"></div>

                {/* Scanning Laser */}
                {!isScanning && <div className="absolute top-0 left-0 w-full h-0.5 bg-green-400 blur-[2px] shadow-[0_0_10px_lime] animate-[slideIn_2s_linear_infinite]"></div>}
                
                {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <span className="text-green-400 font-bold uppercase tracking-widest animate-pulse">Analyzing Target...</span>
                    </div>
                )}
            </div>
            
            {/* Tech Data Decorations */}
            <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-2 text-[8px] text-green-500/60 font-bold uppercase">
                <span>ISO: AUTO</span>
                <span>EXP: 0.02ms</span>
                <span>F-STOP: 1.8</span>
                <div className="h-20 w-1 bg-gradient-to-b from-transparent via-green-500/50 to-transparent"></div>
            </div>
        </div>
      </div>

      <div className="h-36 bg-black flex items-center justify-between px-10 pb-6 relative z-20 border-t border-white/10">
         <button onClick={onClose} className="text-gray-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">Abort</button>
         
         <button 
            onClick={handleCapture}
            disabled={isScanning}
            className="group relative w-20 h-20 flex items-center justify-center"
         >
            <div className="absolute inset-0 border-2 border-green-500/30 rounded-full group-hover:scale-110 transition-transform"></div>
            <div className="absolute inset-2 border-2 border-green-500/60 rounded-full group-hover:scale-90 transition-transform"></div>
            <div className="w-14 h-14 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all"></div>
         </button>
         
         <div className="w-10"></div> 
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
