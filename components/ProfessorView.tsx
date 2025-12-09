
import React, { useState, useEffect, useRef } from 'react';
import { ProfessorState } from '../types';

interface ProfessorViewProps {
  state: ProfessorState;
  onExit: () => void;
  timeRemaining: number | null;
}

export const ProfessorView: React.FC<ProfessorViewProps> = ({ state, onExit, timeRemaining }) => {
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [showAudioControls, setShowAudioControls] = useState(false);
  
  const sections = state.sections;
  const currentSection = sections[currentSectionIdx];
  const progress = ((currentSectionIdx + 1) / sections.length) * 100;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Cancel speech if user navigates away or switches sections
    stopSpeech();
    return () => stopSpeech();
  }, [currentSectionIdx]);

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setShowAudioControls(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyContent = () => {
    const text = `${currentSection.title}\n\n${currentSection.content}\n\nAnalogy: ${currentSection.analogy}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTranscript = () => {
    const lines = [
        "THE PROFESSOR - LECTURE TRANSCRIPT",
        "==================================",
        `Date: ${new Date().toLocaleDateString()}`,
        "==================================\n",
    ];

    sections.forEach((s, i) => {
        lines.push(`SECTION ${i + 1}: ${s.title}`);
        lines.push(`Content: ${s.content}`);
        lines.push(`Analogy: ${s.analogy}`);
        lines.push(`Key Takeaway: ${s.key_takeaway}\n`);
        lines.push("----------------------------------\n");
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Professor_Lecture_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      startSpeech();
    }
  };

  const startSpeech = () => {
    window.speechSynthesis.cancel(); // Safety clear
    
    const textToRead = `${currentSection.title}. ${currentSection.content}. Analogy: ${currentSection.analogy}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    const voices = window.speechSynthesis.getVoices();
    // Prefer a natural sounding voice
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.lang === 'en-US');
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setShowAudioControls(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
    setShowAudioControls(true);
  };

  // Restart speech if rate/pitch changes while speaking
  const handleAudioSettingChange = (type: 'rate' | 'pitch', value: number) => {
    if (type === 'rate') setRate(value);
    else setPitch(value);

    // If currently speaking, we need to restart to apply changes (Web Speech API limitation)
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.cancel();
      // Small timeout to allow cancel to process
      setTimeout(() => {
          const textToRead = `${currentSection.title}. ${currentSection.content}. Analogy: ${currentSection.analogy}`;
          const utterance = new SpeechSynthesisUtterance(textToRead);
          utterance.rate = type === 'rate' ? value : rate;
          utterance.pitch = type === 'pitch' ? value : pitch;
          
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
          if (preferredVoice) utterance.voice = preferredVoice;

          utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            setShowAudioControls(false);
          };
          
          window.speechSynthesis.speak(utterance);
      }, 50);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `The Professor: ${currentSection.title}`,
      text: `${currentSection.title}\n\n${currentSection.content}\n\nAnalogy: ${currentSection.analogy}\n\n— Generated by The Professor`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        downloadTranscript();
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 relative z-10">
      {/* Professor Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
           <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg shadow-amber-900/20 flex-shrink-0">
              <span className="text-xl sm:text-2xl">👨‍🏫</span>
           </div>
           <div className="flex-1 min-w-0">
             <h2 className="text-base sm:text-lg font-bold text-gray-200">The Professor</h2>
             <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-mono truncate">
                <span>Part {currentSectionIdx + 1}/{sections.length}</span>
                {timeRemaining !== null && (
                  <>
                    <span className="text-gray-700">•</span>
                    <span className={`${timeRemaining < 60 ? 'text-red-400' : 'text-gray-500'}`}>
                       {formatTime(timeRemaining)}
                    </span>
                  </>
                )}
             </div>
           </div>
           <button onClick={onExit} className="sm:hidden text-gray-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
             Exit
           </button>
        </div>
        <button onClick={onExit} className="hidden sm:block text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider hover:bg-white/5 px-4 py-2 rounded-lg">
          Exit Class
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-white/5 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-amber-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Content Card */}
      <div className="glass-panel rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-12 md:p-16 relative overflow-hidden transition-transform duration-500 animate-slide-up-fade flex flex-col">
         
         {/* Action Bar (Refactored for Mobile) */}
         <div className="flex justify-between items-center mb-6 sm:absolute sm:top-6 sm:right-6 sm:mb-0 z-20 w-full sm:w-auto">
           {/* Audio Controls Toggle (Visible when controls hidden) */}
           {!showAudioControls && (
             <div className="flex gap-2">
                <button 
                    onClick={toggleSpeech}
                    className="flex items-center gap-2 px-3 py-1.5 sm:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all text-xs font-bold uppercase tracking-wider"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    Listen
                </button>
             </div>
           )}

            {/* Right Side Actions */}
           <div className="flex gap-2 ml-auto">
             <button 
                onClick={handleShare}
                className="p-2 rounded-lg transition-all duration-300 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                title="Share / Download"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" /></svg>
             </button>

             <button 
                onClick={copyContent} 
                className={`p-2 rounded-lg transition-all duration-300 bg-white/5 hover:bg-white/10 ${copied ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
             >
                {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                )}
             </button>
           </div>
         </div>

         {/* EXPANDED AUDIO CONTROLS */}
         {showAudioControls && (
             <div className="mb-8 p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl animate-fade-in sm:mr-32">
                 <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Voice Control
                     </span>
                     <button onClick={stopSpeech} className="text-amber-500/50 hover:text-amber-500">✕</button>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-6 items-center">
                     {/* Play/Pause Main Button */}
                     <button 
                        onClick={toggleSpeech}
                        className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex-shrink-0"
                     >
                        {isPaused ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        )}
                     </button>

                     {/* Sliders */}
                     <div className="flex-1 w-full grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[10px] text-amber-500/70 font-bold uppercase tracking-wider">
                                <span>Speed</span>
                                <span>{rate}x</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.5" max="2" step="0.1" 
                                value={rate} 
                                onChange={(e) => handleAudioSettingChange('rate', parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-amber-900/40 rounded-full appearance-none cursor-pointer accent-amber-500"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-[10px] text-amber-500/70 font-bold uppercase tracking-wider">
                                <span>Tone</span>
                                <span>{pitch}</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.5" max="1.5" step="0.1" 
                                value={pitch} 
                                onChange={(e) => handleAudioSettingChange('pitch', parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-amber-900/40 rounded-full appearance-none cursor-pointer accent-amber-500"
                            />
                        </div>
                     </div>
                 </div>
             </div>
         )}

         <div key={currentSection.id} className="animate-fade-in mt-2">
             <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-6 sm:mb-10 leading-tight">
               {currentSection.title}
             </h1>

             <div className="prose prose-invert prose-sm sm:prose-lg max-w-none text-gray-300 leading-relaxed font-light mb-8 sm:mb-12 border-l-2 border-white/10 pl-4 sm:pl-6">
               {currentSection.content}
             </div>

             <div className="grid grid-cols-1 gap-6">
               {/* Analogy Box */}
               <div className="bg-amber-900/10 p-6 sm:p-8 rounded-2xl border border-amber-500/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 sm:h-24 sm:w-24 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                 </div>
                 <h4 className="text-amber-500 font-bold uppercase tracking-wider text-xs mb-3">Analogy</h4>
                 <p className="text-amber-100 font-serif text-lg sm:text-xl italic leading-relaxed">"{currentSection.analogy}"</p>
               </div>

               {/* Key Takeaway */}
               <div className="bg-white/5 p-5 sm:p-6 rounded-2xl border border-white/10 flex items-start gap-4">
                 <div className="mt-1 p-2 bg-green-500/20 rounded-lg text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <div>
                    <h4 className="text-gray-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs mb-1">Key Takeaway</h4>
                    <p className="text-gray-200 text-sm sm:text-base font-medium">{currentSection.key_takeaway}</p>
                 </div>
               </div>
             </div>
         </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center mt-6 sm:mt-8 px-2 sm:px-4">
        <button
          onClick={() => setCurrentSectionIdx(prev => Math.max(0, prev - 1))}
          disabled={currentSectionIdx === 0}
          className={`text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors px-4 py-2 rounded-lg hover:bg-white/5 ${currentSectionIdx === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
        >
          ← Previous
        </button>

        <button
          onClick={() => {
            if (currentSectionIdx < sections.length - 1) {
              setCurrentSectionIdx(prev => prev + 1);
            } else {
              onExit();
            }
          }}
          className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold shadow-lg transition-all hover-lift flex items-center gap-2 text-xs sm:text-base ${
            currentSectionIdx === sections.length - 1 
             ? 'bg-white text-black hover:bg-gray-200' 
             : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:brightness-110'
          }`}
        >
          {currentSectionIdx === sections.length - 1 ? 'Finish Class' : 'Next Concept'}
          {currentSectionIdx !== sections.length - 1 && <span>→</span>}
        </button>
      </div>
    </div>
  );
};
