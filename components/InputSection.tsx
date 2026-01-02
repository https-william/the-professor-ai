
import React, { useState, useRef, useEffect } from 'react';
import { ProcessedFile, Difficulty, QuestionType, QuizConfig, TimerDuration, AppMode, AIPersonality, AnalogyDomain, UserProfile } from '../types';
import { processFile } from '../services/fileService';
import { CameraScanner } from './CameraScanner';
import { DuelCreateModal } from './DuelCreateModal';
import { DuelJoinModal } from './DuelJoinModal';
import { StudyRoomModal } from './StudyRoomModal';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';
import { DRIVE_SCOPE, openDrivePicker, downloadDriveFile } from '../services/driveService';

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
  const [activeTab, setActiveTab] = useState<'FILE' | 'TEXT' | 'DRIVE'>('FILE');
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
  const [showDuelSelector, setShowDuelSelector] = useState(false); // New consolidated modal
  const [showStudyRoomModal, setShowStudyRoomModal] = useState(false);

  // Config State
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultConfig.difficulty);
  const [questionType, setQuestionType] = useState<QuestionType>('Multiple Choice');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerDuration, setTimerDuration] = useState<TimerDuration>('Limitless');
  const [personality, setPersonality] = useState<AIPersonality>(userProfile.defaultPersonality || 'Academic');
  const [analogyDomain, setAnalogyDomain] = useState<AnalogyDomain>('General');
  
  const [useOracle, setUseOracle] = useState(false);
  const [useWeaknessDestroyer, setUseWeaknessDestroyer] = useState(false);
  const [isCramMode, setIsCramMode] = useState(false);

  useEffect(() => {
    setDifficulty(defaultConfig.difficulty);
    if (userProfile.defaultPersonality) {
       setPersonality(userProfile.defaultPersonality);
    }
  }, [defaultConfig.difficulty, userProfile.defaultPersonality]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFresher = userProfile.subscriptionTier === 'Fresher';
  const isScholar = userProfile.subscriptionTier === 'Scholar';
  
  const fileLimit = isFresher ? 5 : isScholar ? 10 : 999;
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const canChat = !isFresher;

  // --- DRIVE PICKER HANDLER ---
  const handleDrivePicker = async () => {
      try {
          const provider = new GoogleAuthProvider();
          provider.addScope(DRIVE_SCOPE); 
          provider.setCustomParameters({ prompt: 'select_account' });
          
          const result = await signInWithPopup(auth, provider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          
          if (!credential?.accessToken) {
              throw new Error("Failed to get Google Access Token.");
          }

          const driveFiles = await openDrivePicker(credential.accessToken);
          
          if (driveFiles.length === 0) return;

          setIngestionStatus(`Importing ${driveFiles.length} files from Drive...`);
          setUploadProgress(10);

          const processedBlobs: File[] = [];
          for (let i = 0; i < driveFiles.length; i++) {
              const df = driveFiles[i];
              setIngestionStatus(`Downloading ${df.name} (${i + 1}/${driveFiles.length})...`);
              const blob = await downloadDriveFile(df.id, df.mimeType, credential.accessToken);
              const file = new File([blob], df.name, { type: df.mimeType });
              processedBlobs.push(file);
              setUploadProgress(10 + ((i + 1) / driveFiles.length) * 40);
          }

          addFiles(processedBlobs);
          setIngestionStatus('');
          setUploadProgress(0);
          setActiveTab('FILE'); 

      } catch (error: any) {
          console.error("Drive Error:", error);
          if (error.message && error.message.includes('popup')) return;
          setFileError("Drive Connection Failed: " + (error.message || "Unknown Error"));
          setIngestionStatus('');
      }
  };

  // --- MAIN HANDLERS ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.zip'];
    const validFiles: File[] = [];
    let errorMsg = null;

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
    
    if (selectedFiles.length + validFiles.length > fileLimit) {
        onShowSubscription();
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
      difficulty, questionType, questionCount, timerDuration, personality, analogyDomain, useOracle, useWeaknessDestroyer, isCramMode
  });

  const handleGenerate = async (targetMode?: AppMode) => {
    if (isLoading) return;
    if (isFresher && userProfile.dailyQuizzesGenerated >= 3) {
      onShowSubscription();
      return;
    }
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
         if (activeTab === 'TEXT' && textInput.trim()) fullContent += `\n\n${textInput}`;
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
      if (onDuelStart) {
          addFiles([file]);
          onDuelStart({ wager, file }); 
      }
  };

  const handleDuelJoinSubmit = (code: string) => {
      if (onDuelJoin) onDuelJoin(code);
  }

  return (
    <div className="max-w-5xl mx-auto relative z-10 animate-slide-up-fade px-4 sm:px-0 flex flex-col min-h-[500px] mb-20">
      {showCamera && <CameraScanner onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} mode={appMode === 'PROFESSOR' ? 'SOLVE' : 'QUIZ'} />}
      {showDuelCreate && <DuelCreateModal onClose={() => setShowDuelCreate(false)} onSubmit={handleDuelSubmit} userXP={userProfile.xp || 0} tier={userProfile.subscriptionTier} />}
      {showDuelJoin && <DuelJoinModal onClose={() => setShowDuelJoin(false)} onJoin={handleDuelJoinSubmit} />}
      {showStudyRoomModal && <StudyRoomModal onClose={() => setShowStudyRoomModal(false)} user={userProfile} />}

      {/* Consolidated Duel Selector Modal */}
      {showDuelSelector && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setShowDuelSelector(false)}>
              <div className="bg-[#18181b] border border-purple-500/30 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-purple-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <h3 className="text-white font-bold text-lg">Enter The Arena</h3>
                      <p className="text-gray-400 text-xs">Choose your path, gladiator.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => { setShowDuelSelector(false); setShowDuelCreate(true); }} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 rounded-xl transition-all flex flex-col items-center gap-2">
                          <span className="text-purple-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-white">Create Duel</span>
                      </button>
                      <button onClick={() => { setShowDuelSelector(false); setShowDuelJoin(true); }} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 rounded-xl transition-all flex flex-col items-center gap-2">
                          <span className="text-purple-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-white">Join Code</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Mode Switcher */}
      <div className="flex justify-center items-center mb-6 shrink-0">
        <div className="relative bg-[#0a0a0a] backdrop-blur-xl p-2 rounded-2xl border border-white/10 flex w-full max-w-md shadow-2xl">
          <div 
              className={`absolute top-2 bottom-2 w-[calc(50%-8px)] rounded-xl transition-all duration-500 shadow-lg border border-white/10 ${
                appMode === 'EXAM' 
                ? 'left-2 bg-gradient-to-br from-blue-900 to-blue-800' 
                : 'left-[calc(50%+4px)] bg-gradient-to-br from-amber-900 to-amber-800'
              }`}
          ></div>
          <button onClick={() => setAppMode('EXAM')} className={`relative z-10 flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-all ${appMode === 'EXAM' ? 'text-white' : 'text-gray-500'}`}>Exam</button>
          <button onClick={() => setAppMode('PROFESSOR')} className={`relative z-10 flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-all ${appMode === 'PROFESSOR' ? 'text-amber-100' : 'text-gray-500'}`}>Professor</button>
        </div>
      </div>

      <div className={`glass-panel rounded-3xl relative overflow-hidden flex flex-col flex-grow shadow-2xl ${appMode === 'PROFESSOR' ? 'border-amber-500/10' : 'border-blue-500/10'}`}>
        
        {/* EXAM VIEW */}
        <div className={`flex flex-col flex-grow transition-all duration-500 ${appMode === 'EXAM' ? 'opacity-100' : 'hidden'}`}>
            
            {/* CLEANER CONFIG GRID */}
            <div className="border-b border-white/5 bg-black/30 z-20 flex-shrink-0 backdrop-blur-md p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                  {[
                      { label: "Difficulty", value: difficulty, setter: setDifficulty, options: ["Easy", "Medium", "Hard", "Nightmare"] },
                      { label: "Format", value: questionType, setter: setQuestionType, options: ["Multiple Choice", "True/False", "Fill in the Gap", "Select All That Apply", "Mixed"] },
                      { label: "Timer", value: timerDuration, setter: setTimerDuration, options: ["Limitless", "5m", "10m", "30m", "1h"], disabled: isCramMode },
                      { label: "Count", value: questionCount, setter: (v: string) => setQuestionCount(parseInt(v)), options: ["5", "10", "15", "20", "30", "50"] }
                  ].map((field, idx) => (
                      <div key={idx} className="relative group w-full">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block pl-1">{field.label}</label>
                          <select 
                            value={field.value} 
                            onChange={(e) => field.setter(e.target.value as any)} 
                            disabled={field.disabled}
                            className="w-full appearance-none bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none cursor-pointer transition-all disabled:opacity-50"
                          >
                              {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center text-gray-500 text-[8px]">▼</div>
                      </div>
                  ))}
              </div>
            </div>

            {/* Premium Protocol Cards */}
            <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 mt-2">
               <button onClick={() => setUseOracle(!useOracle)} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${useOracle ? 'bg-amber-900/30 border-amber-500/50 text-amber-200' : 'bg-[#151515] border-white/10 text-gray-400'}`}>
                 <span className="text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                 </span>
                 <span className="text-[10px] font-bold uppercase tracking-widest">The Oracle</span>
               </button>
               <button onClick={() => setUseWeaknessDestroyer(!useWeaknessDestroyer)} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${useWeaknessDestroyer ? 'bg-red-900/30 border-red-500/50 text-red-200' : 'bg-[#151515] border-white/10 text-gray-400'}`}>
                 <span className="text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                 </span>
                 <span className="text-[10px] font-bold uppercase tracking-widest">Weakness Destroyer</span>
               </button>
               <button onClick={() => setIsCramMode(!isCramMode)} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${isCramMode ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-200' : 'bg-[#151515] border-white/10 text-gray-400'}`}>
                 <span className="text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                 </span>
                 <span className="text-[10px] font-bold uppercase tracking-widest">Cram Mode</span>
               </button>
            </div>

            {/* Main Upload Area */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col relative bg-gradient-to-b from-black/0 to-black/20 custom-scrollbar min-h-[250px]">
               
               {/* New Segmented Control Tabs */}
               <div className="flex justify-center mb-6 shrink-0">
                <div className="bg-[#1a1a1a] p-1 rounded-xl flex border border-white/10 shadow-lg w-full max-w-sm">
                    {['FILE', 'DRIVE', 'TEXT'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)} 
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === tab ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                {activeTab === 'DRIVE' ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center animate-fade-in py-8 border-2 border-dashed border-white/5 rounded-3xl bg-black/20">
                        <div className="w-14 h-14 bg-green-900/20 rounded-2xl flex items-center justify-center border border-green-500/20 mb-2">
                            <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 1.485c2.082 0 3.754.02 4.959.084 1.38.074 2.47.334 3.376 1.24.906.906 1.166 1.996 1.24 3.376.064 1.205.084 2.877.084 4.959v1.652c0 2.082-.02 3.754-.084 4.959-.074 1.38-.334 2.47-1.24 3.376-.906.906-1.166-1.996-1.24-3.376-.064-1.205-.084-2.877-.084-4.959.084s-3.754-.02-4.959-.084c-1.38-.074-2.47-.334-3.376-1.24-.906-.906-1.166-1.996-1.24-3.376-.064-1.205-.084-2.877-.084-4.959v-1.652c0-2.082.02-3.754.084-4.959.074-1.38.334-2.47 1.24-3.376.906-.906 1.996-1.166 3.376-1.24 1.205-.064 2.877-.084 4.959-.084Zm-2.735 9.17-2.313 4.008h4.626l2.314-4.008H9.275Zm-3.47 6.012h9.252l-2.313-4.008H7.036l-1.23 2.13L4.65 12.63l-1.231 2.13 2.386 1.908ZM17.14 7.333H7.888l2.313 4.008h9.252l-2.313-4.008Z"/></svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Google Drive Import</h3>
                        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                            Connect your drive to select multiple lectures or folders.
                        </p>
                        <button 
                            onClick={handleDrivePicker}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center gap-2 mt-2"
                        >
                            Connect Drive
                        </button>
                    </div>
                ) : activeTab === 'FILE' ? (
                  <div className="flex flex-col gap-4 h-full">
                      <div 
                        className={`flex-grow border-2 border-dashed rounded-3xl transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group min-h-[180px] ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
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
                            <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar">
                              <div className="grid grid-cols-1 gap-2">
                                {selectedFiles.map((f, i) => (
                                  <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                                        </span>
                                        <div className="min-w-0">
                                            <div className="text-xs text-gray-200 truncate font-medium">{f.name}</div>
                                            <div className="text-[9px] text-gray-500 uppercase">{(f.size / 1024 / 1024).toFixed(1)} MB</div>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-gray-500 hover:text-red-400 p-2">✕</button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-center text-gray-500 mt-4">{selectedFiles.length} / {fileLimit} Files Attached</p>
                            </div>
                          ) : (
                            <div className="text-center p-6">
                              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:scale-110 transition-transform duration-300 shadow-xl text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                              </div>
                              <p className="text-gray-300 font-bold text-sm">Drop lecture materials here</p>
                              <div className="flex gap-2 justify-center mt-3">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setShowCamera(true); }}
                                    className="px-3 py-1.5 bg-white/10 rounded-lg text-[10px] uppercase font-bold text-blue-300 hover:bg-white/20 transition-colors flex items-center gap-1"
                                  >
                                    <span>📸</span> Scan Page
                                  </button>
                              </div>
                            </div>
                          )}
                      </div>
                  </div>
                ) : (
                  <textarea className="w-full flex-grow bg-black/20 text-gray-200 rounded-3xl p-6 border border-white/10 focus:border-blue-500/50 outline-none resize-none text-sm font-mono leading-relaxed placeholder-gray-600 min-h-[200px]" placeholder="Paste raw notes, syllabus, or essay text here..." value={textInput} onChange={(e) => setTextInput(e.target.value)} />
                )}
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-4 border-t border-white/10 bg-[#0a0a0a] shrink-0">
               <div className="grid grid-cols-4 gap-2 mb-3">
                   <button onClick={() => setShowDuelSelector(true)} disabled={isLoading} className="col-span-1 flex flex-col items-center justify-center py-2 rounded-xl bg-purple-900/10 border border-purple-500/20 hover:bg-purple-900/20 hover:border-purple-500/40 transition-all gap-1 group">
                      <span className="text-lg filter grayscale group-hover:grayscale-0 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-wide text-purple-400">Duel</span>
                   </button>
                   <button onClick={() => handleGenerate('CHAT')} disabled={isLoading} className="col-span-1 flex flex-col items-center justify-center py-2 rounded-xl bg-amber-900/10 border border-amber-500/20 hover:bg-amber-900/20 hover:border-amber-500/40 transition-all gap-1 group">
                      <span className="text-lg filter grayscale group-hover:grayscale-0 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-wide text-amber-500">Chat</span>
                   </button>
                   <button onClick={() => handleGenerate('FLASHCARDS')} disabled={isLoading} className="col-span-1 flex flex-col items-center justify-center py-2 rounded-xl bg-indigo-900/10 border border-indigo-500/20 hover:bg-indigo-900/20 hover:border-indigo-500/40 transition-all gap-1 group">
                      <span className="text-lg filter grayscale group-hover:grayscale-0 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-wide text-indigo-400">Cards</span>
                   </button>
                   {isScholar && (
                       <button onClick={() => setShowStudyRoomModal(true)} disabled={isLoading} className="col-span-1 flex flex-col items-center justify-center py-2 rounded-xl bg-green-900/10 border border-green-500/20 hover:bg-green-900/20 hover:border-green-500/40 transition-all gap-1 group">
                          <span className="text-lg filter grayscale group-hover:grayscale-0 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-wide text-green-400">Group</span>
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

        {/* PROFESSOR VIEW INPUT */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0a0a0a] ${appMode === 'PROFESSOR' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
             <h3 className="text-3xl font-serif font-bold text-amber-100 mb-6 animate-slide-up-fade">Class is in session.</h3>
             <div className="w-full max-w-2xl relative group animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
                  {/* Selected Files Display */}
                  {selectedFiles.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-3 flex gap-2 flex-wrap w-full">
                        {selectedFiles.map((f, i) => (
                            <div key={i} className="bg-[#1a1a1a] border border-amber-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-amber-100 shadow-lg animate-fade-in ring-1 ring-amber-500/10">
                                <span className="text-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </span>
                                <span className="truncate max-w-[150px] font-mono">{f.name}</span>
                                <button onClick={() => removeFile(i)} className="text-amber-500 hover:text-red-400 ml-1 transition-colors">✕</button>
                            </div>
                        ))}
                    </div>
                  )}

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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     </button>
                     <button onClick={() => fileInputRef.current?.click()} className="h-full px-3 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
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
