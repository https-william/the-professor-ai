
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
            fullContent += `\n\n--- IMAGE FILE: ${selectedFiles[i].name} ---\n[IMAGE_DATA:${processed.content}]`;
          } else {
            fullContent += `\n\n--- FILE: ${selectedFiles[i].name} ---\n${processed.content}`;
          }
        }
      }

      if ((finalMode === 'PROFESSOR' || finalMode === 'CHAT') && !overrideContent) {
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

  const handleDuelJoinSubmit = (code: string) => {
    if (onDuelJoin) onDuelJoin(code);
  }

  const handleOracleClick = () => {
    if (isExcellentia) {
      setUseOracle(!useOracle);
    } else {
      onShowSubscription();
    }
  };

  const ConfigPill = ({ label, value, setter, options, disabled }: any) => (
    <div className="relative group shrink-0 w-1/2 md:w-auto p-1">
      <div className="absolute top-2 left-3 text-[8px] text-text-sec font-bold uppercase tracking-wider pointer-events-none z-10">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => setter(e.target.value)}
        disabled={disabled}
        className={`appearance-none pl-3 pr-8 pt-5 pb-2 rounded-xl text-xs font-bold uppercase tracking-wide outline-none cursor-pointer transition-all border w-full text-left shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed border-border-main bg-black/5 text-gray-500' : 'bg-white/5 border-border-main hover:bg-white/10 text-text-pri hover:shadow-md'}`}
      >
        {options.map((opt: string) => <option key={opt} value={opt} className="bg-core text-text-pri">{opt}</option>)}
      </select>
      <div className="pointer-events-none absolute right-3 bottom-3 text-xs text-text-sec">▼</div>
    </div>
  );

  // Reusable File List Component
  const FileList = () => (
    <div className="w-full flex flex-wrap gap-2 justify-center">
      {selectedFiles.map((f, i) => (
        <div key={i} className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/30 shadow-sm">
          <span className="text-xs text-blue-500 truncate max-w-[150px] font-bold">{f.name}</span>
          <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-blue-400 hover:text-red-400 ml-1">✕</button>
        </div>
      ))}
      <div className="w-full text-center mt-1">
        <span className="text-[10px] text-text-sec uppercase tracking-widest cursor-pointer hover:text-white transition-colors">+ Add More</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto relative z-10 animate-slide-up-fade px-4 sm:px-0 flex flex-col min-h-[500px] mb-24 md:mb-20">

      {showDuelCreate && <DuelCreateModal onClose={() => setShowDuelCreate(false)} onSubmit={handleDuelSubmit} userXP={userProfile.xp || 0} tier={userProfile.subscriptionTier} />}
      {showDuelJoin && <DuelJoinModal onClose={() => setShowDuelJoin(false)} onJoin={handleDuelJoinSubmit} />}

      {/* Main Panel with Liquid Glass effect */}
      <div className={`liquid-glass liquid-glass-card relative overflow-hidden flex flex-col flex-grow shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${appMode === 'PROFESSOR' ? 'glass-glow-amber' : appMode === 'HUB' ? 'glass-glow-blue' : ''}`}>

        {/* PROGRESS OVERLAY */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 transition-opacity duration-300">
            <div className="w-full max-w-md h-2 bg-gray-900 rounded-full overflow-hidden mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 animate-progress" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <span className="text-white font-mono text-sm font-bold tracking-widest animate-pulse">
              INGESTING DATA... {Math.round(uploadProgress)}%
            </span>
          </div>
        )}

        {/* EXAM VIEW */}
        <div className={`flex flex-col flex-grow transition-all duration-500 ${appMode === 'EXAM' ? 'opacity-100' : 'hidden pointer-events-none absolute inset-0'}`}>

          {/* CONTROL DECK */}
          <div id="exam-config-target" className="border-b border-border-main bg-panel z-20 flex-shrink-0 backdrop-blur-md p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-wrap w-full md:w-auto gap-2">
                  <LiquidDropdown label="Difficulty" value={difficulty} onChange={(v) => setDifficulty(v as Difficulty)} options={["Easy", "Medium", "Hard", isExcellentia ? "Nightmare" : "Nightmare (Locked)"]} disabled={difficulty === 'Nightmare' && !isExcellentia} />
                  <LiquidDropdown label="Type" value={questionType} onChange={(v) => setQuestionType(v as QuestionType)} options={["Multiple Choice", "True/False", "Fill in the Gap", "Mixed"]} />
                  <LiquidDropdown label="Timer" value={timerDuration} onChange={(v) => setTimerDuration(v as TimerDuration)} options={["Limitless", "5m", "10m", "30m", "1h"]} />
                  <LiquidDropdown label="Count" value={String(questionCount)} onChange={(v) => setQuestionCount(parseInt(v))} options={["5", "10", "15", "20", "30"]} />
                </div>

                <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
                  <button
                    onClick={handleOracleClick}
                    className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all shadow-md ${useOracle ? 'bg-red-900/20 border-red-500 text-red-500 oracle-glow' : 'bg-black/20 border-border-main text-text-sec hover:text-text-pri hover:bg-black/30'}`}
                  >
                    {!isExcellentia && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-amber-500"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg>
                    )}
                    <span>The Oracle {isExcellentia ? '(2x Cost)' : ''}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Upload Area */}
          <div id="upload-zone-target" className="flex-grow overflow-y-auto p-6 flex flex-col relative bg-transparent custom-scrollbar min-h-[250px]">

            <div className="flex-1 flex flex-col gap-6">
              {/* TEXT AREA */}
              <div className="relative group">
                <div className="absolute top-3 left-3 text-[10px] font-bold text-text-sec uppercase tracking-widest bg-panel px-2 rounded border border-border-main pointer-events-none">
                  Input Source Text
                </div>
                <textarea
                  className="w-full h-32 md:h-40 bg-black/10 dark:bg-[#151515] text-text-pri rounded-2xl p-4 pt-10 border border-border-main outline-none text-sm font-medium placeholder-text-sec resize-none transition-all shadow-inner focus:border-accent hover:bg-black/20"
                  placeholder="Paste lecture notes, articles, or topics here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px bg-gradient-to-r from-transparent via-border-main to-transparent flex-1"></div>
                <span className="text-[10px] font-bold text-text-sec uppercase">OR</span>
                <div className="h-px bg-gradient-to-r from-transparent via-border-main to-transparent flex-1"></div>
              </div>

              {/* HIGH VISIBILITY FILE DROP ZONE */}
              <div
                className={`border-2 border-dashed rounded-3xl transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group min-h-[180px] shadow-lg ${dragActive || selectedFiles.length > 0 ? 'border-blue-500 bg-blue-900/10' : 'border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:border-white/30 hover:bg-white/10'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFiles.length > 0 ? (
                  <div className="w-full p-6">
                    <FileList />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">Drop Files Here</p>
                      <p className="text-text-sec text-xs mt-1">PDF, DOCX, PPTX, Images</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACTION GRID */}
          <div className="p-4 sm:p-6 border-t border-border-main bg-black/10 shrink-0">
            <button
              onClick={() => executeGeneration('EXAM')}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 btn-glass hover:scale-[1.01] active:scale-[0.99] shadow-lg ${!canAfford ? 'opacity-50 cursor-not-allowed bg-red-900/20' : isExcellentia ? 'bg-amber-600/30 border-amber-500/30' : 'bg-blue-600/30 border-blue-500/30'}`}
            >
              {isLoading ? (
                <span className="animate-pulse">Processing Data...</span>
              ) : !canAfford ? (
                `Insufficient Credits (${currentCost} Required)`
              ) : (
                `Generate Exam (${currentCost} NT)`
              )}
            </button>
          </div>
        </div>

        {/* Other Modes (Chat/Hub) Input */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 bg-core z-20 transition-opacity duration-300 ${(appMode === 'PROFESSOR' || appMode === 'CHAT') ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="text-center mb-8">
            <h3 className="text-3xl font-display font-medium text-text-pri mb-2 animate-slide-up-fade">Lecture Hall</h3>
            <p className="text-text-sec text-sm">Upload content to begin session.</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="w-full max-w-2xl mb-6 animate-slide-up-fade">
              <FileList />
            </div>
          )}

          <div className="w-full max-w-2xl relative group animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeGeneration(appMode)}
                className="w-full bg-panel border border-border-main rounded-2xl pl-6 pr-16 md:pr-48 py-6 text-text-pri outline-none focus:border-amber-500 placeholder-text-sec text-lg shadow-2xl transition-all"
                placeholder={appMode === 'PROFESSOR' ? "Upload notes to start lecture..." : "Ask a question..."}
              />
              <div className="absolute right-3 top-3 bottom-3 flex items-center gap-2 z-30">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-full w-10 text-text-sec hover:text-text-pri transition-colors hover:bg-black/5 rounded-xl border border-transparent hover:border-border-main flex items-center justify-center"
                  title="Attach File"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                </button>
                <button onClick={() => executeGeneration(appMode)} className="hidden md:flex h-full px-6 bg-amber-600 rounded-xl text-white hover:bg-amber-500 transition-colors shadow-lg items-center justify-center font-bold text-xs uppercase tracking-widest">
                  Start ({getModeCost(appMode)} NT)
                </button>
                <button onClick={() => executeGeneration(appMode)} className="md:hidden h-10 w-10 bg-amber-600 rounded-xl text-white hover:bg-amber-500 flex items-center justify-center shadow-lg">
                  →
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
