
import React, { useRef, useState, useEffect } from 'react';

interface CameraScannerProps {
  onCapture: (base64Image: string, isInstantSolve: boolean) => void;
  onClose: () => void;
  mode: 'QUIZ' | 'SOLVE';
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose, mode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
      }
    };
    startCamera();
    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
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
        // Simulate processing delay for UX
        setTimeout(() => {
            onCapture(base64, mode === 'SOLVE');
        }, 800);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col animate-fade-in">
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {hasPermission === false && (
            <div className="text-white text-center p-6">
                <p className="text-red-400 font-bold mb-2">Camera Access Denied</p>
                <button onClick={onClose} className="mt-4 px-6 py-2 bg-white/10 rounded-full text-sm">Close</button>
            </div>
        )}
        
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
        
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Simple Crop Guide */}
            <div className={`w-[80%] aspect-[3/4] border-2 border-white/30 rounded-lg relative ${isScanning ? 'border-green-500' : ''}`}>
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white"></div>
                
                {isScanning && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-green-400 font-bold tracking-widest animate-pulse">PROCESSING...</span>
                    </div>
                )}
            </div>
        </div>
        
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent">
            <button onClick={onClose} className="text-white font-medium text-sm">Cancel</button>
        </div>
      </div>

      <div className="bg-black p-8 flex justify-center items-center pb-12">
         <button 
            onClick={handleCapture}
            disabled={isScanning}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
         >
            <div className="w-16 h-16 bg-white rounded-full"></div>
         </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
