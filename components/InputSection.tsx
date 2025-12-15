
import React, { useState, useRef, useEffect } from 'react';
import { ProcessedFile, Difficulty, QuestionType, QuizConfig, TimerDuration, AppMode, AIPersonality, AnalogyDomain, UserProfile, DriveFile } from '../types';
import { processFile } from '../services/fileService';
import { CameraScanner } from './CameraScanner';
import { DuelCreateModal } from './DuelCreateModal';
import { DuelJoinModal } from './DuelJoinModal';
import { StudyRoomModal } from './StudyRoomModal';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';
import { DRIVE_SCOPE, extractFolderId, listDriveFiles, downloadDriveFile } from '../services/driveService';

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
  onOpenProfile,
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
  
  const [showCamera, setShowCamera] = useState(false);
  const [showDuelCreate, setShowDuelCreate] = useState(false);
  const [showDuelJoin, setShowDuelJoin] = useState(false);
  const [showStudyRoomModal, setShowStudyRoomModal] = useState(false);

  // Drive State
  const [driveLink, setDriveLink] = useState('');
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [selectedDriveFileIds, setSelectedDriveFileIds] = useState<Set<string>>(new Set());
  const [isDriveScanning, setIsDriveScanning] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState('');

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
  
  // Strict Tier Limits per prompt (Fresher: 5, Scholar: 10, Supreme: Unlimited)
  const fileLimit = isFresher ? 5 : isScholar ? 10 : 999;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const canChat = !isFresher; // Only scholar+ can chat

  // --- DRIVE LOGIC ---
  const handleConnectDrive = async () => {
      try {
          const provider = new GoogleAuthProvider();
          provider.addScope(DRIVE_SCOPE);
          // Force re-select account to ensure consent prompt appears
          provider.setCustomParameters({ prompt: 'select_account consent' });
          
          const result = await signInWithPopup(auth, provider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          
          if (credential?.accessToken) {
              setDriveToken(credential.accessToken);
          } else {
              setFileError("Could not retrieve Drive Access Token.");
          }
      } catch (error: any) {
          console.error("Drive Auth Error:", error);
          setFileError(error.message);
      }
  };

  const handleScanDrive = async () => {
      if (!driveToken || !driveLink) return;
      
      const folderId = extractFolderId(driveLink);
      if (!folderId) {
          setFileError("Invalid Drive Link. Please paste a Folder Link.");
          return;
      }

      setIsDriveScanning(true);
      setFileError(null);
      try {
          const files = await listDriveFiles(folderId, driveToken);
          setDriveFiles(files);
          // Auto-select all by default (up to 50 to be safe for UI rendering)
          const ids = new Set(files.slice(0, 50).map(f => f.id));
          setSelectedDriveFileIds(ids);
          
          if (files.length === 0) setFileError("No compatible files found in this folder.");
      } catch (e: any) {
          setFileError("Failed to scan folder. Ensure you have access.");
          console.error(e);
      } finally {
          setIsDriveScanning(false);
      }
  };

  const toggleDriveFile = (id: string) => {
      const newSet = new Set(selectedDriveFileIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedDriveFileIds(newSet);
  };

  // --- MAIN HANDLERS ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.webp'];
    const validFiles: File[] = [];
    let errorMsg = null;

    for (const f of files) {
        if (!validExtensions.some(ext => f.name.toLowerCase().endsWith(ext))) {
            errorMsg = "Skipped unsupported file formats.";
            continue;
        }
        if (f.size > MAX_FILE_SIZE) {
            errorMsg = "Skipped files larger than 5MB.";
            continue;
        }
        validFiles.push(f);
    }

    if (errorMsg) setFileError(errorMsg);
    
    // Tier Limit Check
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
      let driveFilesProcessed = 0;
      const totalDrive = selectedDriveFileIds.size;

      // DRIVE INGESTION LOGIC (Batch Processing)
      if (activeTab === 'DRIVE' && totalDrive > 0 && driveToken) {
          if (!isScholar && totalDrive > 5) {
              onShowSubscription(); // Gate bulk drive
              return;
          }

          const filesToProcess = driveFiles.filter(f => selectedDriveFileIds.has(f.id));
          
          for (const dFile of filesToProcess) {
              setIngestionStatus(`Downloading ${dFile.name}... (${driveFilesProcessed + 1}/${totalDrive})`);
              
              // Download Blob
              const blob = await downloadDriveFile(dFile.id, dFile.mimeType, driveToken);
              const file = new File([blob], dFile.name, { type: dFile.mimeType });
              
              // Process Text
              const processed = await processFile(file);
              fullContent += `\n\n--- DRIVE FILE: ${dFile.name} ---\n${processed.content}`;
              
              driveFilesProcessed++;
              // Yield to UI to prevent freeze
              await new Promise(r => setTimeout(r, 10)); 
          }
          setIngestionStatus('');
      }
      
      // Standard File Processing
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

      // Append text input based on mode
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
          name: activeTab === 'DRIVE' ? 'Drive Folder Import' : selectedFiles.length > 0 ? (selectedFiles.length === 1 ? selectedFiles[0].name : 'Multi-File Session') : 'Text Input' 
      }, getFullConfig(), finalMode);
      
      setChatInput('');
      if (finalMode === 'PROFESSOR') setSelectedFiles([]);
      
    } catch (err: any) {
      setFileError(err.message);
      setUploadProgress(0);
      setIngestionStatus('');
    }
  };

  const handleCameraCapture = (base64: string) => {
      setShowCamera(false);
      // Create a dummy file from base64
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
            
            {/* GRID LAYOUT FOR CONFIG */}
            <div className="border-b border-white/5 bg-black/30 z-20 flex-shrink-0 backdrop-blur-md p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                  {/* Difficulty */}
                  <div className="relative group w-full">
                      <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)} 
                        className="w-full appearance-none bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white outline-none cursor-pointer transition-all text-center"
                      >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                          <option value="Nightmare">Nightmare 💀</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 text-[8px]">▼</div>
                  </div>

                  {/* Format */}
                  <div className="relative group w-full">
                      <select 
                        value={questionType} 
                        onChange={(e) => setQuestionType(e.target.value as QuestionType)} 
                        className="w-full appearance-none bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white outline-none cursor-pointer transition-all text-center truncate"
                      >
                          <option value="Multiple Choice">Multiple Choice</option>
                          <option value="True/False">True / False</option>
                          <option value="Fill in the Gap">Fill in the Gap</option>
                          <option value="Select All That Apply">Multi-Select</option>
                          <option value="Scenario-based">Scenario</option>
                          <option value="Mixed">Mixed</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 text-[8px]">▼</div>
                  </div>

                  {/* Timer */}
                  <div className="relative group w-full">
                      <select 
                        value={timerDuration} 
                        onChange={(e) => setTimerDuration(e.target.value as TimerDuration)} 
                        disabled={isCramMode}
                        className="w-full appearance-none bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white outline-none cursor-pointer transition-all disabled:opacity-50 text-center"
                      >
                          <option value="Limitless">No Timer</option>
                          <option value="5m">5 Mins</option>
                          <option value="10m">10 Mins</option>
                          <option value="30m">30 Mins</option>
                          <option value="1h">1 Hour</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 text-[8px]">▼</div>
                  </div>

                  {/* Count */}
                  <div className="relative group w-full">
                      <select 
                        value={questionCount} 
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))} 
                        className="w-full appearance-none bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white outline-none cursor-pointer transition-all text-center"
                      >
                          <option value="5">5 Questions</option>
                          <option value="10">10 Questions</option>
                          <option value="15">15 Questions</option>
                          <option value="20">20 Questions</option>
                          <option value="30">30 Questions</option>
                          <option value="50">50 Questions</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 text-[8px]">▼</div>
                  </div>
              </div>
            </div>

            {/* Premium Protocol Cards */}
            <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0 mt-2">
               <button onClick={() => setUseOracle(!useOracle)} className={`p-4 rounded-xl border flex flex-col items-start gap-1 transition-all relative overflow-hidden group ${useOracle ? 'bg-gradient-to-r from-amber-950 to-orange-900 border-amber-500 text-amber-200' : 'bg-[#151515] border-white/20 text-gray-300'}`}><div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 relative z-10"><div className={`w-2 h-2 rounded-full ${useOracle ? 'bg-amber-400 animate-pulse' : 'bg-gray-500'}`}></div>The Oracle</div></button>
               <button onClick={() => setUseWeaknessDestroyer(!useWeaknessDestroyer)} className={`p-4 rounded-xl border flex flex-col items-start gap-1 transition-all relative overflow-hidden group ${useWeaknessDestroyer ? 'bg-gradient-to-r from-red-950 to-rose-900 border-red-600 text-red-200' : 'bg-[#151515] border-white/20 text-gray-300'}`}><div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 relative z-10"><div className={`w-2 h-2 rounded-full ${useWeaknessDestroyer ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>Weakness Destroyer</div></button>
               <button onClick={() => setIsCramMode(!isCramMode)} className={`p-4 rounded-xl border flex flex-col items-start gap-1 transition-all relative overflow-hidden group ${isCramMode ? 'bg-gradient-to-r from-cyan-950 to-blue-900 border-cyan-500 text-cyan-200' : 'bg-[#151515] border-white/20 text-gray-300'}`}><div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 relative z-10"><div className={`w-2 h-2 rounded-full ${isCramMode ? 'bg-cyan-400 animate-pulse' : 'bg-gray-500'}`}></div>Cram Mode</div></button>
            </div>

            {/* Main Upload Area */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col relative bg-gradient-to-b from-black/0 to-black/20 custom-scrollbar min-h-[300px]">
               <div className="flex justify-center mb-6 shrink-0">
                <div className="bg-black/40 p-1.5 rounded-2xl flex gap-1 border border-white/10 shadow-lg w-full sm:w-auto overflow-hidden">
                    <button onClick={() => setActiveTab('FILE')} className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'FILE' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Files</button>
                    <button onClick={() => setActiveTab('DRIVE')} className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'DRIVE' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>G-Drive</button>
                    <button onClick={() => setActiveTab('TEXT')} className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'TEXT' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Text</button>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                {activeTab === 'DRIVE' ? (
                    <div className="flex flex-col gap-4 h-full animate-fade-in">
                        {!driveToken ? (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-green-500/20 bg-green-900/5 rounded-3xl p-8 text-center">
                                <div className="w-16 h-16 bg-green-900/20 rounded-2xl flex items-center justify-center mb-4 border border-green-500/20">
                                    <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 1.485c2.082 0 3.754.02 4.959.084 1.38.074 2.47.334 3.376 1.24.906.906 1.166 1.996 1.24 3.376.064 1.205.084 2.877.084 4.959v1.652c0 2.082-.02 3.754-.084 4.959-.074 1.38-.334 2.47-1.24 3.376-.906.906-1.996 1.166-3.376 1.24-1.205.064-2.877.084-4.959.084s-3.754-.02-4.959-.084c-1.38-.074-2.47-.334-3.376-1.24-.906-.906-1.166-1.996-1.24-3.376-.064-1.205-.084-2.877-.084-4.959v-1.652c0-2.082.02-3.754.084-4.959.074-1.38.334-2.47 1.24-3.376.906-.906 1.996-1.166 3.376-1.24 1.205-.064 2.877-.084 4.959-.084Zm-2.735 9.17-2.313 4.008h4.626l2.314-4.008H9.275Zm-3.47 6.012h9.252l-2.313-4.008H7.036l-1.23 2.13L4.65 12.63l-1.231 2.13 2.386 1.908ZM17.14 7.333H7.888l2.313 4.008h9.252l-2.313-4.008Z"/></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Connect Google Drive</h3>
                                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">Authorize access to scan your departmental folders. Read-only permission required.</p>
                                <button onClick={handleConnectDrive} className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg transition-all flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 1.485c2.082 0 3.754.02 4.959.084 1.38.074 2.47.334 3.376 1.24.906.906 1.166 1.996 1.24 3.376.064 1.205.084 2.877.084 4.959v1.652c0 2.082-.02 3.754-.084 4.959-.074 1.38-.334 2.47-1.24 3.376-.906.906-1.996 1.166-3.376 1.24-1.205.064-2.877.084-4.959.084s-3.754-.02-4.959-.084c-1.38-.074-2.47-.334-3.376-1.24-.906-.906-1.166-1.996-1.24-3.376-.064-1.205-.084-2.877-.084-4.959v-1.652c0-2.082.02-3.754.084-4.959.074-1.38.334-2.47 1.24-3.376.906-.906 1.996-1.166 3.376-1.24 1.205-.064 2.877-.084 4.959-.084Zm-2.735 9.17-2.313 4.008h4.626l2.314-4.008H9.275Zm-3.47 6.012h9.252l-2.313-4.008H7.036l-1.23 2.13L4.65 12.63l-1.231 2.13 2.386 1.908ZM17.14 7.333H7.888l2.313 4.008h9.252l-2.313-4.008Z"/></svg>
                                    Authenticate
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full gap-4">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={driveLink}
                                        onChange={(e) => setDriveLink(e.target.value)}
                                        placeholder="Paste Folder Link (https://drive.google.com/...)" 
                                        className="flex-1 bg-black/40 border border-green-500/30 rounded-xl px-4 py-3 text-white outline-none focus:bg-white/5 transition-all text-sm font-mono text-green-100 placeholder-green-900/50" 
                                    />
                                    <button 
                                        onClick={handleScanDrive} 
                                        disabled={isDriveScanning || !driveLink}
                                        className="px-6 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest disabled:opacity-50"
                                    >
                                        {isDriveScanning ? 'Scanning...' : 'Scan'}
                                    </button>
                                </div>

                                {/* File List */}
                                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Found Files ({driveFiles.length})</span>
                                        <button 
                                            onClick={() => setSelectedDriveFileIds(new Set(selectedDriveFileIds.size === driveFiles.length ? [] : driveFiles.map(f => f.id)))}
                                            className="text-[10px] text-green-400 hover:text-white uppercase font-bold"
                                        >
                                            {selectedDriveFileIds.size === driveFiles.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                        {driveFiles.length === 0 ? (
                                            <div className="h-full flex items-center justify-center text-gray-600 text-xs">
                                                No files scanned yet. Paste a link above.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2">
                                                {driveFiles.map(f => (
                                                    <div 
                                                        key={f.id} 
                                                        onClick={() => toggleDriveFile(f.id)}
                                                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${selectedDriveFileIds.has(f.id) ? 'bg-green-900/20 border-green-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className={`w-4 h-4 rounded-sm border ${selectedDriveFileIds.has(f.id) ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                                                {selectedDriveFileIds.has(f.id) && <svg className="w-full h-full text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                                                            </div>
                                                            <span className="text-xs font-mono truncate text-gray-300">{f.name}</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-600 uppercase">{f.mimeType.split('/').pop()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-green-900/10 border-t border-green-500/20 text-center">
                                        <p className="text-[10px] text-green-400 uppercase font-bold tracking-widest">{selectedDriveFileIds.size} Files Selected for Ingestion</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'FILE' ? (
                  <div className="flex flex-col gap-4 h-full">
                      <button 
                        onClick={() => setShowCamera(true)}
                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-blue-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Scan Textbook Page
                      </button>

                      <div 
                        className={`flex-grow border-2 border-dashed rounded-3xl transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group min-h-[150px] ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
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
                                  <div key={i} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-2xl">📄</span>
                                        <span className="text-sm text-gray-200 truncate font-medium">{f.name}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-gray-500 hover:text-red-400 p-2">✕</button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-center text-gray-500 mt-4">{selectedFiles.length} / {fileLimit} Files</p>
                            </div>
                          ) : (
                            <div className="text-center p-6">
                              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                                <span className="text-3xl">📁</span>
                              </div>
                              <p className="text-gray-300 font-bold text-sm">Drop lecture notes here</p>
                              <p className="text-gray-500 text-xs mt-2">PDF, DOCX, PPTX, TXT (Max 5MB)</p>
                            </div>
                          )}
                      </div>
                  </div>
                ) : (
                  <textarea className="w-full flex-grow bg-black/20 text-gray-200 rounded-3xl p-6 border border-white/10 focus:border-blue-500/50 outline-none resize-none text-sm font-mono leading-relaxed placeholder-gray-600 min-h-[200px]" placeholder="Paste raw text notes..." value={textInput} onChange={(e) => setTextInput(e.target.value)} />
                )}
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-4 border-t border-white/10 bg-[#0a0a0a] shrink-0">
               {/* 
                  Responsive Action Buttons
               */}
               <div className="w-full max-w-full overflow-hidden">
                   <div className="grid grid-cols-4 sm:flex sm:flex-wrap sm:justify-center gap-2 mb-3 w-full">
                       <button onClick={() => setShowDuelCreate(true)} disabled={isLoading} className="flex flex-col sm:flex-row items-center justify-center py-3 sm:px-5 sm:py-3 rounded-2xl bg-purple-900/10 border border-purple-500/20 hover:bg-purple-900/20 hover:border-purple-500/40 transition-all gap-1 sm:gap-3 group">
                          <span className="text-xl sm:text-lg filter grayscale group-hover:grayscale-0 transition-all">⚔️</span>
                          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wide text-purple-400">Create Duel</span>
                       </button>
                       <button onClick={() => setShowDuelJoin(true)} disabled={isLoading} className="flex flex-col sm:flex-row items-center justify-center py-3 sm:px-5 sm:py-3 rounded-2xl bg-purple-900/10 border border-purple-500/20 hover:bg-purple-900/20 hover:border-purple-500/40 transition-all gap-1 sm:gap-3 group">
                          <span className="text-xl sm:text-lg filter grayscale group-hover:grayscale-0 transition-all">🛡️</span>
                          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wide text-purple-400">Join Duel</span>
                       </button>
                       <button onClick={() => handleGenerate('CHAT')} disabled={isLoading} className="flex flex-col sm:flex-row items-center justify-center py-3 sm:px-5 sm:py-3 rounded-2xl bg-amber-900/10 border border-amber-500/20 hover:bg-amber-900/20 hover:border-amber-500/40 transition-all gap-1 sm:gap-3 group">
                          <span className="text-xl sm:text-lg filter grayscale group-hover:grayscale-0 transition-all">💬</span>
                          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wide text-amber-500">AI Chat</span>
                       </button>
                       <button onClick={() => handleGenerate('FLASHCARDS')} disabled={isLoading} className="flex flex-col sm:flex-row items-center justify-center py-3 sm:px-5 sm:py-3 rounded-2xl bg-indigo-900/10 border border-indigo-500/20 hover:bg-indigo-900/20 hover:border-indigo-500/40 transition-all gap-1 sm:gap-3 group">
                          <span className="text-xl sm:text-lg filter grayscale group-hover:grayscale-0 transition-all">🎴</span>
                          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wide text-indigo-400">Flashcards</span>
                       </button>
                       {isScholar && (
                           <button onClick={() => setShowStudyRoomModal(true)} disabled={isLoading} className="col-span-4 sm:col-span-1 flex flex-col sm:flex-row items-center justify-center py-2 sm:px-5 sm:py-3 rounded-2xl bg-green-900/10 border border-green-500/20 hover:bg-green-900/20 hover:border-green-500/40 transition-all gap-2 group mt-1 sm:mt-0">
                              <span className="text-lg filter grayscale group-hover:grayscale-0 transition-all">🤝</span>
                              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wide text-green-400">Syndicate</span>
                           </button>
                       )}
                   </div>
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
                                <span className="text-lg">📄</span>
                                <span className="truncate max-w-[150px] font-mono">{f.name}</span>
                                <button onClick={() => removeFile(i)} className="text-amber-500 hover:text-red-400 ml-1 transition-colors">✕</button>
                            </div>
                        ))}
                    </div>
                  )}

                  {/* Fix: Added padding-right (pr-48) to prevent text from going under the buttons on mobile */}
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
             
             {/* Fix: Added margin top and z-index to ensure text is below input visually */}
             <div className="mt-6 flex items-center gap-2 relative z-0">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">The Professor is listening.</p>
             </div>
        </div>
      </div>
      
      {fileError && <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 text-red-400 text-sm text-center rounded-2xl font-bold animate-slide-up-fade">{fileError}</div>}
      <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.docx,.doc,.pptx,.txt,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
    </div>
  );
};
