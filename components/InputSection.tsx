
import React, { useState, useRef, useEffect } from 'react';
import { ProcessedFile, Difficulty, QuestionType, QuizConfig, TimerDuration, AppMode, AIPersonality, AnalogyDomain, UserProfile } from '../types';
import { processFile } from '../services/fileService';
import { CameraScanner } from './CameraScanner';
import { DuelCreateModal } from './DuelCreateModal';
import { DuelJoinModal } from './DuelJoinModal';
import { StudyRoomModal } from './StudyRoomModal';

interface InputSectionProps {
  onProcess: (processedFile: ProcessedFile, config: QuizConfig, mode: AppMode) => void;
  isLoading: boolean;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  defaultConfig: { difficulty: Difficulty };
  userProfile: UserProfile;
  onShowSubscription: () => void;
  onOpenProfile: () => void;
  onDuelStart?: (config: any) => void;
  onDuelJoin?: (code: string) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  onProcess, 
  isLoading, 
  appMode, 
  setAppMode, 
  defaultConfig, 
  userProfile,
  onShowSubscription,
  onDuelStart,
  onDuelJoin
}) => {
  const [textInput, setTextInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ingestionStatus, setIngestionStatus] = useState('');
  
  const [showCamera, setShowCamera] = useState(false);
  const [showDuelCreate, setShowDuelCreate] = useState(false);
  const [showDuelJoin, setShowDuelJoin] = useState(false);
  const [showDuelSelector, setShowDuelSelector] = useState(false); 
  const [showStudyRoomModal, setShowStudyRoomModal] = useState(false);

  // Config State
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultConfig.difficulty);
  const [questionType, setQuestionType] = useState<QuestionType>('Multiple Choice');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerDuration, setTimerDuration] = useState<TimerDuration>('Limitless');
  const [personality, setPersonality] = useState<AIPersonality>(userProfile.defaultPersonality || 'Academic');
  const [analogyDomain, setAnalogyDomain] = useState<AnalogyDomain>('General');
  
  const [useOracle, setUseOracle] = useState(false);

  useEffect(() => {
    setDifficulty(defaultConfig.difficulty);
    if (userProfile.defaultPersonality) {
       setPersonality(userProfile.defaultPersonality);
    }
  }, [defaultConfig.difficulty, userProfile.defaultPersonality]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFresher = userProfile.subscriptionTier === 'Fresher';
  const isScholar = userProfile.subscriptionTier === 'Scholar';
  const isExcellentia = userProfile.subscriptionTier === 'Excellentia';
  
  // RELAXED LIMITS
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const QUIZ_LIMIT = isFresher ? 10 : 999;
  const FILE_LIMIT_DAILY = isFresher ? 5 : 999;
  const IMG_LIMIT_DAILY = isFresher ? 5 : 999;
  const DUEL_LIMIT = isFresher ? 5 : 999;

  const canChat = !isFresher;

  // --- LIMIT HANDLER ---
  const checkLimit = (current: number, max: number, featureName: string): boolean => {
      if (current >= max) {
          if (confirm(`${featureName} limit reached for your plan. Unlock unlimited access with Scholar tier?`)) {
              onShowSubscription();
          }
          return false;
      }
      return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.zip'];
    const validFiles: File[] = [];
    let errorMsg = null;

    let newFilesCount = 0;
    let newImagesCount = 0;

    for (const f of files) {
        if (!validExtensions.some(ext => f.name.toLowerCase().endsWith(ext))) {
            errorMsg = "Skipped unsupported file formats.";
            continue;
        }
        if (f.size > MAX_FILE_SIZE) {
            errorMsg = "Skipped files larger than 50MB.";
            continue;
        }
        
        const isImage = f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|webp)$/);
        if (isImage) newImagesCount++;
        else newFilesCount++;

        validFiles.push(f);
    }

    if (!checkLimit((userProfile.dailyFilesUploaded || 0) + newFilesCount, FILE_LIMIT_DAILY, "File Upload")) return;
    if (!checkLimit((userProfile.dailyImagesUploaded || 0) + newImagesCount, IMG_LIMIT_DAILY, "Image Upload")) return;

    if (errorMsg) setFileError(errorMsg);
    if (selectedFiles.length + validFiles.length > 10 && !isExcellentia) {
        setFileError("Maximum 10 files per batch.");
        return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (!errorMsg) setFileError(null);
    setUploadProgress(0);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFullConfig = (): QuizConfig => ({ 
      difficulty, questionType, questionCount, timerDuration, personality, analogyDomain, useOracle
  });

  const handleGenerate = async (targetMode?: AppMode) => {
    if (isLoading) return;
    
    // Usage Checks
    if (!checkLimit(userProfile.dailyQuizzesGenerated || 0, QUIZ_LIMIT, "Daily Exam")) return;
    
    if (targetMode === 'CHAT' && !canChat) {
        onShowSubscription();
        return;
    }

    setUploadProgress(0);
    const finalMode = targetMode || appMode;

    try {
      let fullContent = "";
      
      if (selectedFiles.length > 0) {
         setUploadProgress(15);
         for (let i = 0; i < selectedFiles.length; i++) {
            const processed = await processFile(selectedFiles[i], (p) => setUploadProgress(15 + (p * 0.85))); 
            if (processed.type === 'IMAGE') {
                fullContent += `\n\n--- IMAGE FILE: ${selectedFiles[i].name} ---\n[IMAGE_DATA:${processed.content}]`; 
            } else {
                fullContent += `\n\n--- FILE: ${selectedFiles[i].name} ---\n${processed.content}`;
            }
         }
      }

      if (finalMode === 'PROFESSOR') {
         if (chatInput.trim()) fullContent += `\n\nUser Context/Question: ${chatInput}`;
         if (!fullContent.trim()) { setFileError("Please ask a question or upload a file."); return; }
      } else {
         if (textInput.trim()) fullContent += `\n\n${textInput}`;
         if (!fullContent.trim()) { setFileError("Please upload a file or paste text content."); return; }
      }

      onProcess({ 
          type: 'TEXT', 
          content: fullContent, 
          name: selectedFiles.length > 0 ? (selectedFiles.length === 1 ? selectedFiles[0].name : 'Multi-File Session') : 'Text Input' 
      }, getFullConfig(), finalMode);
      
      setChatInput('');
      if (finalMode === 'PROFESSOR') setSelectedFiles([]);
      
    } catch (err: any) {
      setFileError(err.message);
      setUploadProgress(0);
    }
  };

  const handleCameraCapture = (base64: string) => {
      setShowCamera(false);
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {type: 'image/jpeg'});
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      addFiles([file]);
  };

  const handleDuelSubmit = (wager: number, file: File) => {
      if (!checkLimit(userProfile.dailyDuelsJoined || 0, DUEL_LIMIT, "Duel")) return;
      if (onDuelStart) {
          addFiles([file]);
          onDuelStart({ wager, file }); 
      }
  };

  const handleDuelJoinSubmit = (code: string) => {
      if (!checkLimit(userProfile.dailyDuelsJoined || 0, DUEL_LIMIT, "Duel")) return;
      if (onDuelJoin) onDuelJoin(code);
  }

  // --- COMPONENTS ---
  const ConfigPill = ({ label, value, setter, options, disabled }: any) => (
      <div className="relative group shrink-0 w-full md:w-auto">
          <div className="absolute top-1 left-3 text-[8px] text-gray-500 font-bold uppercase tracking-wider pointer-events-none z-10">
              {label}
          </div>
          <select 
            value={value} 
            onChange={(e) => setter(e.target.value)} 
            disabled={disabled}
            className={`appearance-none pl-3 pr-8 pt-5 pb-2 rounded-xl text-xs font-bold uppercase tracking-wide outline-none cursor-pointer transition-all border w-full text-left ${disabled ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/5 text-gray-500' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
          >
              {options.map((opt: string) => <option key={opt} value={opt} className="bg-black text-white">{opt}</option>)}
          </select>
          <div className="pointer-events-none absolute right-2.5 bottom-2.5 text-xs text-gray-400">▼</div>
      </div>
  );

  const TogglePill = ({ label, active, onClick, icon }: any) => (
      <button 
        onClick={onClick}
        className={`shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
            active 
            ? 'bg-amber-900/40 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
            : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/10'
        }`}
      >
          <span>{icon}</span>
          <span>{label}</span>
      </button>
  );

  return (
    <div className="max-w-5xl mx-auto relative z-10 animate-slide-up-fade px-4 sm:px-0 flex flex-col min-h-[500px] mb-20">
      {/* Configuration Modals */}
      {showCamera && <CameraScanner onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} mode={appMode === 'PROFESSOR' ? 'SOLVE' : 'QUIZ'} />}
      {showDuelCreate && <DuelCreateModal onClose={() => setShowDuelCreate(false)} onSubmit={handleDuelSubmit} userXP={userProfile.xp || 0} tier={userProfile.subscriptionTier} />}
      {showDuelJoin && <DuelJoinModal onClose={() => setShowDuelJoin(false)} onJoin={handleDuelJoinSubmit} />}
      {showStudyRoomModal && <StudyRoomModal onClose={() => setShowStudyRoomModal(false)} user={userProfile} />}

      {/* Duel Selector */}
      {showDuelSelector && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setShowDuelSelector(false)}>
              <div className="bg-[#18181b] border border-purple-500/30 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <div className="text-center mb-6">
                      <h3 className="text-white font-bold text-lg">Enter The Arena</h3>
                      <p className="text-gray-400 text-xs">Choose your path, gladiator.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { setShowDuelSelector(false); setShowDuelCreate(true); }} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 rounded-xl transition-all flex flex-col items-center gap-2">
                          <span className="text-2xl">⚔️</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-white">Create Duel</span>
                      </button>
                      <button onClick={() => { setShowDuelSelector(false); setShowDuelJoin(true); }} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 rounded-xl transition-all flex flex-col items-center gap-2">
                          <span className="text-2xl">🔑</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-white">Join Code</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Mode Switcher */}
      <div id="mode-switch-target" className="flex justify-center items-center mb-6 shrink-0">
        <div className="relative bg-[#0a0a0a] backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 flex w-full max-w-md shadow-2xl">
          <div 
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl transition-all duration-500 shadow-lg border border-white/10 ${
                appMode === 'EXAM' 
                ? 'left-1.5 bg-gradient-to-br from-blue-900 to-blue-800' 
                : 'left-[calc(50%+3px)] bg-gradient-to-br from-amber-900 to-amber-800'
              }`}
          ></div>
          <button onClick={() => setAppMode('EXAM')} className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all ${appMode === 'EXAM' ? 'text-white' : 'text-gray-500'}`}>Exam</button>
          <button onClick={() => setAppMode('PROFESSOR')} className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all ${appMode === 'PROFESSOR' ? 'text-amber-100' : 'text-gray-500'}`}>Study Room</button>
        </div>
      </div>

      <div className={`glass-panel rounded-3xl relative overflow-hidden flex flex-col flex-grow shadow-2xl ${appMode === 'PROFESSOR' ? 'border-amber-500/10' : 'border-blue-500/10'}`}>
        
        {/* EXAM VIEW */}
        <div className={`flex flex-col flex-grow transition-all duration-500 ${appMode === 'EXAM' ? 'opacity-100' : 'hidden'}`}>
            
            {/* CONTROL DECK */}
            <div id="exam-config-target" className="border-b border-white/5 bg-black/40 z-20 flex-shrink-0 backdrop-blur-md p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-2 w-full">
                      <ConfigPill label="Difficulty" value={difficulty} setter={setDifficulty} options={["Easy", "Medium", "Hard", isExcellentia ? "Nightmare" : "Nightmare (Locked)"]} disabled={difficulty === 'Nightmare' && !isExcellentia} />
                      <ConfigPill label="Question Type" value={questionType} setter={setQuestionType} options={["Multiple Choice", "True/False", "Fill in the Gap", "Mixed"]} />
                      <ConfigPill label="Timer" value={timerDuration} setter={setTimerDuration} options={["Limitless", "5m", "10m", "30m", "1h"]} />
                      <ConfigPill label="Count" value={questionCount} setter={(v: string) => setQuestionCount(parseInt(v))} options={["5", "10", "15", "20", "30"]} />
                  </div>

                  {/* Oracle Toggle */}
                  <div className="flex-shrink-0">
                      {isExcellentia ? (
                          <TogglePill label="The Oracle" active={useOracle} onClick={() => setUseOracle(!useOracle)} icon="🔮" />
                      ) : (
                          <div onClick={onShowSubscription}>
                              <TogglePill label="The Oracle" active={false} onClick={()=>{}} icon="🔒" />
                          </div>
                      )}
                  </div>
              </div>
            </div>

            {/* Main Upload Area */}
            <div id="upload-zone-target" className="flex-grow overflow-y-auto p-4 flex flex-col relative bg-gradient-to-b from-black/0 to-black/20 custom-scrollbar min-h-[300px]">
               
               <div className="flex-1 flex flex-col gap-6">
                  {/* TEXT AREA - PROMINENT */}
                  <div className="relative">
                      <div className="absolute top-3 left-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[#151515] px-2 rounded">
                          Input Source Text
                      </div>
                      <textarea 
                        className="w-full h-32 md:h-40 bg-[#151515] text-gray-200 rounded-2xl p-4 pt-8 border border-white/10 focus:border-blue-500/50 outline-none text-sm font-mono placeholder-gray-700 resize-none transition-all shadow-inner" 
                        placeholder="Paste lecture notes, articles, or topics here..." 
                        value={textInput} 
                        onChange={(e) => setTextInput(e.target.value)} 
                      />
                  </div>

                  <div className="flex items-center gap-4">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="text-[10px] font-bold text-gray-600 uppercase">OR UPLOAD</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                  </div>

                  {/* FILE DROP ZONE */}
                  <div 
                    className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group min-h-[120px] ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-8 backdrop-blur-md">
                          <div className="w-full max-w-md h-2 bg-gray-900 rounded-full overflow-hidden mb-2 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 animate-progress" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                          <span className="text-white font-mono text-sm font-bold">{Math.round(uploadProgress)}%</span>
                        </div>
                      )}
                      
                      {selectedFiles.length > 0 ? (
                        <div className="w-full p-4 flex flex-wrap gap-2 justify-center">
                            {selectedFiles.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
                                  <span className="text-lg">📄</span>
                                  <span className="text-xs text-blue-200 truncate max-w-[100px]">{f.name}</span>
                                  <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-blue-400 hover:text-red-400 ml-1">✕</button>
                              </div>
                            ))}
                            <div className="w-full text-center mt-2">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">+ Add More</span>
                            </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-6">
                           <div className="p-3 bg-white/5 rounded-full mb-1 group-hover:scale-110 transition-transform">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                           </div>
                           <p className="text-gray-400 font-bold text-xs uppercase tracking-wide">Drop PDF, DOCX, PPTX</p>
                        </div>
                      )}
                  </div>
                  
                  {/* Camera Button - Mobile Friendly */}
                  <button 
                    onClick={() => setShowCamera(true)}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Scan Document
                  </button>
              </div>
            </div>

            {/* ACTION GRID */}
            <div className="p-4 border-t border-white/10 bg-[#0a0a0a] shrink-0">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                   <button onClick={() => setShowDuelSelector(true)} disabled={isLoading} className="p-3 bg-purple-900/10 border border-purple-500/20 hover:bg-purple-900/20 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span className="text-[10px] font-bold uppercase text-purple-400">Duel</span>
                   </button>
                   
                   <button onClick={() => handleGenerate('CHAT')} disabled={isLoading} className="p-3 bg-amber-900/10 border border-amber-500/20 hover:bg-amber-900/20 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      <span className="text-[10px] font-bold uppercase text-amber-500">Chat</span>
                   </button>
                   
                   <button onClick={() => handleGenerate('FLASHCARDS')} disabled={isLoading} className="p-3 bg-indigo-900/10 border border-indigo-500/20 hover:bg-indigo-900/20 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      <span className="text-[10px] font-bold uppercase text-indigo-400">Cards</span>
                   </button>
                   
                   {isScholar || isExcellentia ? (
                       <button onClick={() => setShowStudyRoomModal(true)} disabled={isLoading} className="p-3 bg-green-900/10 border border-green-500/20 hover:bg-green-900/20 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          <span className="text-[10px] font-bold uppercase text-green-400">Group</span>
                       </button>
                   ) : (
                       <button onClick={onShowSubscription} className="p-3 bg-white/5 border border-white/5 opacity-50 rounded-xl flex flex-col items-center justify-center gap-1 cursor-not-allowed">
                          <span className="text-lg">🔒</span>
                          <span className="text-[10px] font-bold uppercase text-gray-500">Group</span>
                       </button>
                   )}
               </div>

               <button onClick={() => handleGenerate()} disabled={isLoading} className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading || ingestionStatus ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {ingestionStatus || 'Processing...'}
                      </>
                  ) : (
                      <>
                        Generate Exam
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </>
                  )}
               </button>
            </div>
        </div>

        {/* STUDY ROOM INPUT */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0a0a0a] ${appMode === 'PROFESSOR' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
             <h3 className="text-3xl font-serif font-bold text-amber-100 mb-6 animate-slide-up-fade">Class is in session.</h3>
             <div className="w-full max-w-2xl relative group animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
                  
                  {/* Selected Files Display */}
                  {selectedFiles.length > 0 && (
                    <div className="flex gap-2 flex-wrap w-full mb-3 justify-center">
                        {selectedFiles.map((f, i) => (
                            <div key={i} className="bg-[#1a1a1a] border border-amber-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-amber-100 shadow-lg animate-fade-in ring-1 ring-amber-500/10">
                                <span className="text-lg">📄</span>
                                <span className="truncate max-w-[150px] font-mono">{f.name}</span>
                                <button onClick={() => removeFile(i)} className="text-amber-500 hover:text-red-400 ml-1 transition-colors">✕</button>
                            </div>
                        ))}
                    </div>
                  )}

                  <div className="relative">
                      <input 
                        type="text" 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        className="w-full bg-black/60 border border-amber-500/30 rounded-2xl pl-6 pr-48 py-6 text-white outline-none focus:border-amber-500 placeholder-gray-600 text-lg shadow-2xl transition-all focus:bg-black/80 z-20 relative" 
                        placeholder="Ask a question or upload files..." 
                      />
                      <div className="absolute right-3 top-3 bottom-3 flex items-center gap-2 z-30">
                        <button onClick={() => setShowCamera(true)} className="h-full px-3 text-gray-400 hover:text-amber-400 transition-colors hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10" title="Snap & Solve">
                            <span className="text-xl">📸</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="h-full px-3 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10">
                            <span className="text-xl">📎</span>
                        </button>
                        <button onClick={() => handleGenerate()} className="h-full px-6 bg-amber-600 rounded-xl text-white hover:bg-amber-500 transition-colors shadow-lg flex items-center justify-center font-bold">
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            )}
                        </button>
                      </div>
                  </div>
             </div>
             
             <div className="mt-6 flex items-center gap-2 relative z-0">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">The Professor is listening.</p>
             </div>
        </div>
      </div>
      
      {fileError && <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 text-red-400 text-sm text-center rounded-2xl font-bold animate-slide-up-fade">{fileError}</div>}
      <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.docx,.doc,.pptx,.txt,.png,.jpg,.jpeg,.webp,.zip" onChange={handleFileChange} />
    </div>
  );
};
