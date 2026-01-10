
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

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setHasPermission(true);
      } catch { setHasPermission(false); }
    };
    startCamera();
    return () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const capture = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
      onCapture(base64, mode === 'SOLVE');
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {hasPermission === false && <p className="text-white">Camera Denied</p>}
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
        
        {/* Simple Reticle */}
        <div className="absolute inset-0 pointer-events-none border-[30px] border-black/50">
            <div className="w-full h-full border-2 border-white/50 relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
            </div>
        </div>
      </div>
      <div className="h-24 bg-black flex items-center justify-between px-8">
         <button onClick={onClose} className="text-white text-xs uppercase font-bold">Cancel</button>
         <button onClick={capture} className="w-16 h-16 bg-white rounded-full border-4 border-gray-300"></button>
         <div className="w-8"></div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
