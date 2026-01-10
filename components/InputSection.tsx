
import React, { useState, useRef, useEffect } from 'react';
import { ProcessedFile, Difficulty, QuestionType, QuizConfig, TimerDuration, AppMode, AIPersonality, AnalogyDomain, UserProfile } from '../types';
import { processFile } from '../services/fileService';
import { DuelCreateModal } from './DuelCreateModal';
import { DuelJoinModal } from './DuelJoinModal';
import { queueAction } from '../services/syncService';

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
  onHubEnter: () => void;
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
  onDuelJoin,
  onHubEnter
}) => {
  const [textInput, setTextInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ingestionStatus, setIngestionStatus] = useState('');
  
  const [showDuelCreate, setShowDuelCreate] = useState(false);
  const [showDuelJoin, setShowDuelJoin] = useState(false);
  
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
  const isExcellentia = userProfile.subscriptionTier === 'Excellentia';
  
  const MAX_FILE_SIZE = 50 * 1024 * 1024; 
  const FILE_LIMIT_DAILY = isFresher ? 1 : 999;
  const DUEL_LIMIT = isFresher ? 1 : 999;
  const QUIZ_LIMIT = isFresher ? 1 : 999;

  const canChat = !isFresher; 
  const isLimitReached = (QUIZ_LIMIT - (userProfile.dailyQuizzesGenerated || 0)) <= 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.zip'];
    const validFiles: File[] = [];
    let errorMsg = null;

    if ((userProfile.dailyFilesUploaded || 0) + files.length > FILE_LIMIT_DAILY) {
        setFileError("Daily file limit reached. Unlock unlimited uploads.");
    }

    for (const f of files) {
        if (!validExtensions.some(ext => f.name.toLowerCase().endsWith(ext))) {
            errorMsg = "Skipped unsupported file formats.";
            continue;
        }
        if (f.size > MAX_FILE_SIZE) {
            errorMsg = "Skipped files larger than 50MB.";
            continue;
        }
        validFiles.push(f);
    }

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

  const executeGeneration = async (finalMode: AppMode, overrideContent?: string, overrideName?: string) => {
    if (isLoading) return;
    
    if (isLimitReached) {
        setFileError("Daily limit reached.");
        onShowSubscription(); 
        return;
    }
    
    if (finalMode === 'CHAT' && !canChat) {
        setFileError("Professor Chat is a Scholar feature.");
        onShowSubscription();
        return;
    }

    setUploadProgress(0);

    try {
      let fullContent = overrideContent || "";
      
      if (!overrideContent && selectedFiles.length > 0) {
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

      if (finalMode === 'PROFESSOR' && !overrideContent) {
         if (chatInput.trim()) fullContent += `\n\nUser Context/Question: ${chatInput}`;
         if (!fullContent.trim()) { setFileError("Please ask a question or upload a file."); return; }
      } else if (!overrideContent) {
         if (textInput.trim()) fullContent += `\n\n${textInput}`;
         if (!fullContent.trim()) { setFileError("Please upload a file or paste text content."); return; }
      }

      const name = overrideName || (selectedFiles.length > 0 ? (selectedFiles.length === 1 ? selectedFiles[0].name : 'Multi-File Session') : 'Text Input');

      onProcess({ 
          type: 'TEXT', 
          content: fullContent, 
          name: name
      }, getFullConfig(), finalMode);
      
      setChatInput('');
      if (finalMode === 'PROFESSOR') setSelectedFiles([]);
      
    } catch (err: any) {
      setFileError(err.message);
      setUploadProgress(0);
    }
  };

  const handleDuelSubmit = (wager: number, file: File) => {
      if ((userProfile.dailyDuelsJoined || 0) >= DUEL_LIMIT) {
          onShowSubscription();
          return;
      }
      if (onDuelStart) {
          addFiles([file]);
          onDuelStart({ wager, file }); 
      }
  };

  const handleDuelJoinSubmit = (code: string) => {
      if ((userProfile.dailyDuelsJoined || 0) >= DUEL_LIMIT) {
          onShowSubscription();
          return;
      }
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
    <div className="max-w-6xl mx-auto relative z-10 animate-slide-up-fade px-4 sm:px-0 flex flex-col min-h-[500px] mb-20">
      
      {showDuelCreate && <DuelCreateModal onClose={() => setShowDuelCreate(false)} onSubmit={handleDuelSubmit} userXP={userProfile.xp || 0} tier={userProfile.subscriptionTier} />}
      {showDuelJoin && <DuelJoinModal onClose={() => setShowDuelJoin(false)} onJoin={handleDuelJoinSubmit} />}

      {/* Unified Tab Switcher */}
      <div id="mode-switch-target" className="flex justify-center items-center mb-6 shrink-0">
        <div className="relative bg-[#0a0a0a] backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 flex w-full max-w-2xl shadow-2xl">
          <button onClick={() => setAppMode('EXAM')} className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-xl ${appMode === 'EXAM' ? 'bg-blue-900/50 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Exam</button>
          <button onClick={() => setAppMode('PROFESSOR')} className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-xl ${appMode === 'PROFESSOR' ? 'bg-amber-900/50 text-amber-100 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Study</button>
          <button onClick={() => setAppMode('HUB')} className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-xl ${appMode === 'HUB' ? 'bg-green-900/50 text-green-400 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Hub</button>
          <button onClick={() => { setShowDuelCreate(true); }} className={`relative z-10 flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-xl hover:text-purple-400 text-gray-500`}>Arena</button>
        </div>
      </div>

      <div className={`glass-panel rounded-3xl relative overflow-hidden flex flex-col flex-grow shadow-2xl ${appMode === 'PROFESSOR' ? 'border-amber-500/10' : appMode === 'HUB' ? 'border-green-500/10' : 'border-blue-500/10'}`}>
        
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

                  {/* Oracle Toggle with SVG */}
                  <div className="flex-shrink-0">
                      {isExcellentia ? (
                          <TogglePill 
                            label="The Oracle" 
                            active={useOracle} 
                            onClick={() => setUseOracle(!useOracle)} 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} 
                          />
                      ) : (
                          <div onClick={onShowSubscription}>
                              <TogglePill 
                                label="The Oracle" 
                                active={false} 
                                onClick={()=>{}} 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} 
                              />
                          </div>
                      )}
                  </div>
              </div>
            </div>

            {/* Main Upload Area */}
            <div id="upload-zone-target" className="flex-grow overflow-y-auto p-4 flex flex-col relative bg-gradient-to-b from-black/0 to-black/20 custom-scrollbar min-h-[300px]">
               
               <div className="flex-1 flex flex-col gap-6">
                  {/* TEXT AREA */}
                  <div className="relative group">
                      <div className="absolute top-3 left-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-[#151515] px-2 rounded border border-white/5">
                          Input Source Text
                      </div>
                      <textarea 
                        className="w-full h-32 md:h-40 bg-[#151515] text-gray-200 rounded-2xl p-4 pt-10 border border-white/10 outline-none text-sm font-mono placeholder-gray-700 resize-none transition-all shadow-inner focus:border-blue-500 focus:bg-[#1a1a1a]" 
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
                    className={`border-2 border-dashed rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group min-h-[160px] bg-[#0c0c0c] ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-blue-400/50 hover:bg-white/5'}`}
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
                        <div className="flex flex-col items-center gap-3 p-6">
                           <div className="p-4 bg-white/5 rounded-full mb-1 group-hover:scale-110 transition-transform border border-white/10 group-hover:border-blue-500/50">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                           </div>
                           <div className="text-center">
                               <p className="text-gray-300 font-bold text-sm uppercase tracking-wide group-hover:text-white">Click to Upload</p>
                               <p className="text-gray-600 text-xs mt-1">PDF, DOCX, PPTX, TXT, IMAGES</p>
                           </div>
                        </div>
                      )}
                  </div>
              </div>
            </div>

            {/* ACTION GRID */}
            <div className="p-6 border-t border-white/10 bg-[#0a0a0a] shrink-0">
               <button 
                 onClick={() => executeGeneration('EXAM')} 
                 disabled={isLoading} 
                 className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${isLimitReached ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 disabled:opacity-50'}`}
               >
                  {isLoading || ingestionStatus ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {ingestionStatus || 'Processing...'}
                      </>
                  ) : isLimitReached ? (
                      <>
                        Daily Limit Reached (Unlock)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
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

        {/* STUDY ROOM / HUB INPUT */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0a0a0a] ${appMode === 'PROFESSOR' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
             <h3 className="text-3xl font-display font-normal text-amber-100 mb-6 animate-slide-up-fade">Class is in session.</h3>
             <div className="w-full max-w-2xl relative group animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
                  
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
                        onKeyDown={(e) => e.key === 'Enter' && executeGeneration('PROFESSOR')}
                        className="w-full bg-black/60 border border-amber-500/30 rounded-2xl pl-6 pr-12 md:pr-48 py-6 text-white outline-none focus:border-amber-500 placeholder-gray-600 text-lg shadow-2xl transition-all focus:bg-black/80 z-20 relative" 
                        placeholder="Ask a question..." 
                      />
                      
                      <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1 z-30">
                        <button onClick={() => fileInputRef.current?.click()} className="h-full px-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 hidden md:block">
                            <span className="text-xl">📎</span>
                        </button>
                        
                        <button onClick={() => fileInputRef.current?.click()} className="md:hidden h-10 w-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
                            <span className="text-xl">+</span>
                        </button>

                        <button onClick={() => executeGeneration('PROFESSOR')} className="h-10 w-10 md:h-full md:w-auto md:px-6 bg-amber-600 rounded-xl text-white hover:bg-amber-500 transition-colors shadow-lg flex items-center justify-center font-bold">
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            )}
                        </button>
                      </div>
                  </div>
             </div>
        </div>
      </div>
      
      {fileError && <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 text-red-400 text-sm text-center rounded-2xl font-bold animate-slide-up-fade">{fileError}</div>}
      <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.docx,.doc,.pptx,.txt,.png,.jpg,.jpeg,.webp,.zip" onChange={handleFileChange} />
    </div>
  );
};
