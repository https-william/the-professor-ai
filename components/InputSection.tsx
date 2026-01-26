
import React, { useState, useRef, useEffect } from 'react';
import { ProcessedFile, Difficulty, QuestionType, QuizConfig, TimerDuration, AppMode, AIPersonality, AnalogyDomain, UserProfile } from '../types';
import { processFile } from '../services/fileService';
import { DuelCreateModal } from './DuelCreateModal';
import { DuelJoinModal } from './DuelJoinModal';
import { getModeCost } from '../services/creditService';
import { LiquidDropdown } from './ui/LiquidDropdown';

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
  defaultConfig,
  userProfile,
  onShowSubscription,
  onDuelStart,
  onDuelJoin,
}) => {
  const [textInput, setTextInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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
  const currentCost = getModeCost(appMode, { difficulty, questionType, questionCount, timerDuration, personality, analogyDomain, useOracle });
  const canAfford = (userProfile.credits || 0) >= currentCost;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const addFiles = (files: File[]) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.zip'];
    const validFiles: File[] = [];
    let errorMsg = null;

    if ((userProfile.dailyFilesUploaded || 0) + files.length > FILE_LIMIT_DAILY) {
      setFileError("Daily Limit Reached. Authorization Required.");
    }

    for (const f of files) {
      if (!validExtensions.some(ext => f.name.toLowerCase().endsWith(ext))) {
        errorMsg = "Invalid Format Detected.";
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        errorMsg = "File Exceeds Neural Capacity (50MB).";
        continue;
      }
      validFiles.push(f);
    }

    if (errorMsg) setFileError(errorMsg);
    if (selectedFiles.length + validFiles.length > 10 && !isExcellentia) {
      setFileError("Batch Size Limit. Upgrade for Unlimited Ingestion.");
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
    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFullConfig = (): QuizConfig => ({
    difficulty, questionType, questionCount, timerDuration, personality, analogyDomain, useOracle, mood: 'Neutral'
  });

  const executeGeneration = async (finalMode: AppMode, overrideContent?: string, overrideName?: string) => {
    if (isLoading) return;
    if (!canAfford) {
      setFileError("Insufficient Neural Tokens.");
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
            fullContent += `\n\n--- IMAGE DATA: ${selectedFiles[i].name} ---\n[IMAGE_DATA:${processed.content}]`;
          } else {
            fullContent += `\n\n--- FILE DATA: ${selectedFiles[i].name} ---\n${processed.content}`;
          }
        }
      }

      if ((finalMode === 'PROFESSOR' || finalMode === 'CHAT') && !overrideContent) {
        if (chatInput.trim()) fullContent += `\n\nUser Context: ${chatInput}`;
        if (!fullContent.trim()) { setFileError("Input Stream Empty."); return; }
      } else if (!overrideContent) {
        if (textInput.trim()) fullContent += `\n\n${textInput}`;
        if (!fullContent.trim()) { setFileError("Input Stream Empty."); return; }
      }

      const name = overrideName || (selectedFiles.length > 0 ? (selectedFiles.length === 1 ? selectedFiles[0].name : 'Batch Process') : 'Manual Input');

      onProcess({
        type: 'TEXT',
        content: fullContent,
        name: name
      }, getFullConfig(), finalMode);

      setChatInput('');
      if (finalMode === 'PROFESSOR' || finalMode === 'CHAT') setSelectedFiles([]);

    } catch (err: any) {
      setFileError(err.message);
      setUploadProgress(0);
    }
  };

  const handleDuelSubmit = (wager: number, file: File) => {
    if (onDuelStart) {
      addFiles([file]);
      onDuelStart({ wager, file });
    }
  };

  const handleOracleClick = () => {
    if (isExcellentia) {
      setUseOracle(!useOracle);
    } else {
      onShowSubscription();
    }
  };

  const FileList = () => (
    <div className="w-full flex flex-wrap gap-2 justify-center">
      {selectedFiles.map((f, i) => (
        <div key={i} className="flex items-center gap-2 bg-cyan-900/20 px-3 py-1.5 rounded border border-cyan-500/30">
          <span className="text-xs text-cyan-400 font-mono truncate max-w-[150px]">{f.name}</span>
          <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-cyan-600 hover:text-red-400 ml-1">✕</button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col relative z-10 animate-fade-in p-2">
      {/* DUEL MODALS */}
      {showDuelCreate && <DuelCreateModal onClose={() => setShowDuelCreate(false)} onSubmit={handleDuelSubmit} userXP={userProfile.xp || 0} tier={userProfile.subscriptionTier} />}
      {showDuelJoin && <DuelJoinModal onClose={() => setShowDuelJoin(false)} onJoin={(code) => onDuelJoin && onDuelJoin(code)} />}

      {/* PROGRESS OVERLAY */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-8 backdrop-blur-sm transition-opacity duration-300 rounded-lg">
          <div className="w-full max-w-md h-1 bg-gray-900 mb-4 relative overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-cyan-500 animate-[shimmer_1.5s_infinite]" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <span className="text-cyan-400 font-mono text-xs font-bold tracking-widest animate-pulse">
            UPLINKING MATERIALS... {Math.round(uploadProgress)}%
          </span>
        </div>
      )}

      {/* EXAM CONFIG & UPLOAD (Mode: EXAM) */}
      <div className={`flex flex-col flex-grow h-full transition-all duration-500 ${appMode === 'EXAM' ? 'opacity-100' : 'hidden pointer-events-none absolute inset-0'}`}>


        {/* CONFIG BAR */}
        <div className="border-b border-white/5 p-4 bg-white/[0.02]">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <LiquidDropdown label="Difficulty" value={difficulty} onChange={(v) => setDifficulty(v as Difficulty)} options={["Easy", "Medium", "Hard", isExcellentia ? "Nightmare" : "Nightmare (Locked)"]} disabled={difficulty === 'Nightmare' && !isExcellentia} />
              <LiquidDropdown label="Structure" value={questionType} onChange={(v) => setQuestionType(v as QuestionType)} options={["Multiple Choice", "True/False", "Fill in the Gap", "Mixed"]} />
              <LiquidDropdown label="Duration" value={timerDuration} onChange={(v) => setTimerDuration(v as TimerDuration)} options={["Limitless", "5m", "10m", "30m", "1h"]} />
              <LiquidDropdown label="Count" value={String(questionCount)} onChange={(v) => setQuestionCount(parseInt(v))} options={["5", "10", "15", "20", "30"]} />
            </div>
            <button onClick={handleOracleClick} className={`px-4 py-2 border rounded font-mono text-[10px] uppercase tracking-widest transition-all ${useOracle ? 'border-amber-400 text-amber-100 bg-amber-900/20' : 'border-white/10 text-gray-500 hover:text-white'}`}>
              {useOracle ? 'Predictive Analysis: ON' : 'Enable Prediction'}
            </button>
          </div>
        </div>

        {/* UPLOAD AREA */}
        <div className="flex-grow p-8 flex flex-col gap-6">

          {/* Text Ingestion */}
          <div className="relative group">
            <div className="absolute top-0 left-0 px-2 py-1 bg-[#050505] -translate-y-1/2 translate-x-4 border border-white/10 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              Manual Entry
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste notes, lecture transcripts, or articles here..."
              className="w-full h-32 bg-black/20 border border-white/10 rounded-lg p-4 text-sm font-light text-gray-300 placeholder-gray-700 outline-none focus:border-white/20 focus:bg-black/40 transition-all resize-none font-serif"
            />
          </div>

          <div className="text-center">
            <span className="text-[10px] font-mono text-gray-700 uppercase tracking-widest bg-[#050505] px-2 relative z-10">OR UPLOAD DOCUMENTS</span>
            <div className="h-px bg-white/5 -mt-2"></div>
          </div>

          {/* Drag Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`flex-grow border border-dashed rounded-lg flex flex-col items-center justify-center p-8 cursor-pointer transition-all duration-500 group relative overflow-hidden ${dragActive || selectedFiles.length > 0 ? 'border-gray-500 bg-white/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
          >
            {selectedFiles.length > 0 ? (
              <FileList />
            ) : (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto group-hover:border-gray-400 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <p className="font-serif italic text-gray-400 text-sm">Upload Source Material</p>
                <p className="font-mono text-[10px] text-gray-600">PDF, DOCX, PPTX, Images</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <button
            onClick={() => executeGeneration('EXAM')}
            disabled={isLoading}
            className={`w-full py-4 rounded font-bold uppercase text-xs tracking-[0.2em] transition-all relative overflow-hidden group ${isLoading || !canAfford ? 'opacity-50 cursor-not-allowed border border-red-900/50 text-red-500' : 'bg-white text-black hover:bg-gray-200'}`}
          >
            {isLoading ? 'GENERATING ASSESSMENT...' : !canAfford ? `INSUFFICIENT FUNDS (${currentCost} REQ)` : `BEGIN EXAMINATION (${currentCost} CREDITS)`}
          </button>
        </div>
      </div>

      {/* CHAT / LECTURE MODE INPUT */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#050505] z-20 transition-opacity duration-300 ${(appMode === 'PROFESSOR' || appMode === 'CHAT') ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <h3 className="font-cinzel font-bold text-2xl text-white mb-8">
          {appMode === 'PROFESSOR' ? 'The Lecture Hall' : 'Direct Uplink'}
        </h3>

        {selectedFiles.length > 0 && <div className="mb-8"><FileList /></div>}

        <div className="w-full max-w-2xl relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeGeneration(appMode)}
            placeholder={appMode === 'PROFESSOR' ? "Upload notes to begin lecture..." : "Query the neural network..."}
            className="w-full bg-black/50 border border-white/20 rounded-none border-b-2 focus:border-b-cyan-500 px-6 py-4 text-lg font-light text-white outline-none placeholder-gray-700 transition-colors"
          />
          <div className="absolute right-0 bottom-0 top-0 flex items-center gap-2 pr-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-cyan-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <button onClick={() => executeGeneration(appMode)} className="px-6 h-10 bg-white/5 border border-white/10 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
              TRANSMIT
            </button>
          </div>
        </div>
      </div>



      {
        fileError && (
          <div className="mt-4 p-4 border border-red-500/50 bg-red-900/10 text-red-500 font-mono text-xs text-center uppercase tracking-widest animate-pulse z-50 relative">
            ⚠ ERROR: {fileError}
          </div>
        )
      }

      <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.docx,.doc,.pptx,.txt,.png,.jpg,.jpeg,.webp,.zip" onChange={handleFileChange} />
    </div >
  );
};
