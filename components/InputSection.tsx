
import React, { useState, useRef, useEffect } from 'react';
import { ProcessedFile, Difficulty, QuestionType, QuizConfig, TimerDuration, AppMode, AIPersonality, AnalogyDomain, UserProfile } from '../types';
import { processFile } from '../services/fileService';

interface InputSectionProps {
  onProcess: (processedFile: ProcessedFile, config: QuizConfig, mode: AppMode) => void;
  isLoading: boolean;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  defaultConfig: { difficulty: Difficulty };
  userProfile: UserProfile;
  onShowSubscription: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  onProcess, 
  isLoading, 
  appMode, 
  setAppMode, 
  defaultConfig, 
  userProfile,
  onShowSubscription
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'TEXT'>('FILE');
  const [textInput, setTextInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  // Multi-File State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Config State
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultConfig.difficulty);
  const [questionType, setQuestionType] = useState<QuestionType>('Multiple Choice');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerDuration, setTimerDuration] = useState<TimerDuration>('Limitless');
  const [personality, setPersonality] = useState<AIPersonality>(userProfile.defaultPersonality || 'Academic');
  const [analogyDomain, setAnalogyDomain] = useState<AnalogyDomain>('General');
  
  const [useOracle, setUseOracle] = useState(false);
  const [useWeaknessDestroyer, setUseWeaknessDestroyer] = useState(false);

  useEffect(() => {
    setDifficulty(defaultConfig.difficulty);
    if (userProfile.defaultPersonality) {
       setPersonality(userProfile.defaultPersonality);
    }
  }, [defaultConfig.difficulty, userProfile.defaultPersonality]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFresher = userProfile.subscriptionTier === 'Fresher';
  const isScholar = userProfile.subscriptionTier === 'Scholar';
  const isSupreme = userProfile.subscriptionTier === 'Excellentia Supreme';
  const canChat = isScholar || isSupreme;
  
  const fileLimit = isFresher ? 1 : isScholar ? 5 : 99;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.webp'];
    const validFiles = files.filter(f => validExtensions.some(ext => f.name.toLowerCase().endsWith(ext)));

    if (validFiles.length !== files.length) {
       setFileError("Some files were skipped due to unsupported format.");
    }
    
    // Tier Limit Check
    if (selectedFiles.length + validFiles.length > fileLimit) {
        onShowSubscription(); // Trigger upgrade modal for limit breach
        return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setFileError(null);
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

  const getFullConfig = (): QuizConfig => ({ 
      difficulty, questionType, questionCount, timerDuration, personality, analogyDomain, useOracle, useWeaknessDestroyer
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
      
      if (finalMode === 'PROFESSOR' && chatInput.trim()) {
         fullContent = chatInput;
      } else if (activeTab === 'FILE' && selectedFiles.length > 0) {
         setUploadProgress(5);
         // Process all files
         for (let i = 0; i < selectedFiles.length; i++) {
            const processed = await processFile(selectedFiles[i]);
            fullContent += `\n\n--- FILE: ${selectedFiles[i].name} ---\n${processed.content}`;
            setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
         }
      } else if (activeTab === 'TEXT' && textInput.trim()) {
         fullContent = textInput;
      } else {
         return; 
      }

      onProcess({ type: 'TEXT', content: fullContent, name: selectedFiles.length > 1 ? 'Multiple Files' : selectedFiles[0]?.name || 'Text Input' }, getFullConfig(), finalMode);
      setChatInput(''); 
      
    } catch (err: any) {
      setFileError(err.message);
      setUploadProgress(0);
    }
  };

  const LockedOverlay = ({ label }: { label?: string }) => (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-xl cursor-pointer hover:bg-black/90 transition-colors border border-amber-500/20 group" onClick={onShowSubscription}>
       <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔒</span>
       <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 border border-amber-500/30 px-3 py-1 rounded-full">{label || "Upgrade"}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto relative z-10 animate-slide-up-fade px-4 sm:px-0">
      
      {/* Mode Switcher */}
      <div id="mode-switch-target" className="flex justify-center mb-6 sm:mb-10 transition-transform duration-300">
        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-white/10 flex w-full max-w-[320px] sm:max-w-2xl shadow-2xl micro-interact">
          <div 
              className={`absolute top-1.5 bottom-1.5 sm:top-2 sm:bottom-2 w-[calc(50%-6px)] sm:w-[calc(50%-8px)] rounded-[10px] sm:rounded-xl transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) shadow-lg border border-white/10 ${
                appMode === 'EXAM' ? 'left-1.5 sm:left-2 bg-gray-900' : 'left-[calc(50%+3px)] sm:left-[calc(50%+4px)] bg-[#1c1917]'
              }`}
          >
              <div className={`absolute inset-0 rounded-[10px] sm:rounded-xl opacity-20 ${
                appMode === 'EXAM' ? 'bg-gradient-to-b from-blue-500 to-transparent' : 'bg-gradient-to-b from-amber-500 to-transparent'
              }`} />
          </div>
          <button onClick={() => setAppMode('EXAM')} className={`relative z-10 flex-1 py-3 sm:py-4 text-[10px] sm:text-sm font-bold uppercase tracking-widest transition-all ${appMode === 'EXAM' ? 'text-white' : 'text-gray-500'}`}>Exam</button>
          <button onClick={() => setAppMode('PROFESSOR')} className={`relative z-10 flex-1 py-3 sm:py-4 text-[10px] sm:text-sm font-bold uppercase tracking-widest transition-all ${appMode === 'PROFESSOR' ? 'text-amber-100' : 'text-gray-500'}`}>Professor</button>
        </div>
      </div>

      <div className={`glass-panel rounded-3xl sm:rounded-[2.5rem] relative overflow-hidden transition-all duration-700 min-h-[500px] flex flex-col ${appMode === 'PROFESSOR' ? 'border-amber-500/10' : 'border-blue-500/10'}`}>
        
        {/* EXAM VIEW */}
        <div className={`absolute inset-0 flex flex-col transition-all duration-500 ${appMode === 'EXAM' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 pointer-events-none'}`}>
            <div id="exam-config-target" className="border-b border-white/5 bg-black/20 z-20 flex flex-col">
              
              {/* Responsive Config Layout */}
              <div className="p-4 md:p-8">
                {/* Mobile: Vertical Stack with Cards, Desktop: Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    
                    {/* Card 1: Difficulty */}
                    <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-xl border border-white/5 sm:bg-transparent sm:border-none sm:p-0">
                        <label className="text-[9px] font-bold text-gray-500 uppercase px-1">Difficulty</label>
                        <div className="relative group">
                          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="w-full bg-[#151518] border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500 transition-colors hover:bg-white/5 min-h-[44px]">
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                              <option value="Nightmare">Nightmare 💀</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                          {!isSupreme && difficulty === 'Nightmare' && <LockedOverlay />}
                        </div>
                    </div>

                    {/* Card 2: Format */}
                    <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-xl border border-white/5 sm:bg-transparent sm:border-none sm:p-0">
                        <label className="text-[9px] font-bold text-gray-500 uppercase px-1">Format</label>
                        <div className="relative">
                          <select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)} className="w-full bg-[#151518] border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500 transition-colors hover:bg-white/5 min-h-[44px]">
                              <option value="Multiple Choice">Multiple Choice</option>
                              <option value="True/False">True / False</option>
                              <option value="Fill in the Gap">Fill in the Gap</option>
                              <option value="Scenario-based">Scenario Based</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                        </div>
                    </div>

                    {/* Card 3: Timer */}
                    <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-xl border border-white/5 sm:bg-transparent sm:border-none sm:p-0">
                          <label className="text-[9px] font-bold text-gray-500 uppercase px-1">Timer</label>
                          <div className="relative">
                            <select value={timerDuration} onChange={(e) => setTimerDuration(e.target.value as TimerDuration)} className="w-full bg-[#151518] border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500 transition-colors hover:bg-white/5 min-h-[44px]">
                                  <option value="Limitless">No Limit</option>
                                  <option value="5m">5 Mins</option>
                                  <option value="10m">10 Mins</option>
                                  <option value="30m">30 Mins</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                          </div>
                    </div>

                    {/* Card 4: Questions */}
                    <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-xl border border-white/5 sm:bg-transparent sm:border-none sm:p-0">
                          <label className="text-[9px] font-bold text-gray-500 uppercase px-1">Questions: {questionCount}</label>
                          <div className="bg-[#151518] border border-white/10 rounded-xl px-4 py-3 flex items-center min-h-[44px]">
                              <input type="range" min="5" max="50" step="5" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                          </div>
                    </div>
                </div>
              </div>

              {/* Advanced Protocols */}
              <div className="px-4 md:px-8 pb-4 pt-2 border-t border-white/5 bg-black/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div onClick={() => !isSupreme ? onShowSubscription() : setUseOracle(!useOracle)} className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border transition-all ${useOracle ? 'bg-amber-900/20 border-amber-500/50' : 'bg-black/20 border-white/10'}`}>
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${useOracle ? 'bg-amber-500 border-amber-500' : 'border-gray-600'}`}>
                            {useOracle && <svg className="w-3 h-3 text-black" viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${useOracle ? 'text-amber-400' : 'text-gray-400'}`}>The Oracle</span>
                            <span className="text-[9px] text-gray-600">Predictive AI Questions</span>
                        </div>
                        {!isSupreme && <span className="ml-auto text-[8px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">LOCKED</span>}
                    </div>

                    <div onClick={() => !isSupreme ? onShowSubscription() : setUseWeaknessDestroyer(!useWeaknessDestroyer)} className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border transition-all ${useWeaknessDestroyer ? 'bg-red-900/20 border-red-500/50' : 'bg-black/20 border-white/10'}`}>
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${useWeaknessDestroyer ? 'bg-red-500 border-red-500' : 'border-gray-600'}`}>
                             {useWeaknessDestroyer && <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${useWeaknessDestroyer ? 'text-red-400' : 'text-gray-400'}`}>Weakness Destroyer</span>
                            <span className="text-[9px] text-gray-600">Target Low Score Topics</span>
                        </div>
                        {!isSupreme && <span className="ml-auto text-[8px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">LOCKED</span>}
                    </div>
                  </div>
              </div>
            </div>

            {/* Input Area */}
            <div id="upload-zone-target" className="flex-1 p-4 sm:p-6 md:p-12 flex flex-col justify-center relative bg-gradient-to-b from-black/0 to-black/20">
               <div className="flex justify-center mb-6">
                <div className="bg-black/30 p-1 rounded-xl flex gap-1 border border-white/10 shadow-inner">
                    <button onClick={() => setActiveTab('FILE')} className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'FILE' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Files</button>
                    <button onClick={() => setActiveTab('TEXT')} className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'TEXT' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Text</button>
                </div>
              </div>

              <div className="min-h-[250px] relative">
                {activeTab === 'FILE' ? (
                  <div 
                    className={`h-56 sm:h-64 border-2 border-dashed rounded-3xl transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                      {/* Upload Progress Bar (Engaging Gradient) */}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-8 backdrop-blur-md">
                           <div className="w-full max-w-md h-3 bg-gray-900 rounded-full overflow-hidden mb-4 border border-white/10 shadow-inner relative">
                             {/* Neon Flux Gradient */}
                             <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-500 to-amber-500 animate-[shimmer_2s_linear_infinite] bg-[length:200%_100%]" style={{ width: `${uploadProgress}%`, transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}></div>
                           </div>
                           <div className="flex flex-col items-center gap-1">
                             <span className="text-white font-mono text-xl font-bold">{Math.round(uploadProgress)}%</span>
                             <p className="text-blue-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">Encoding Neural Matrix...</p>
                           </div>
                        </div>
                      )}
                      
                      {selectedFiles.length > 0 ? (
                        <div className="z-10 w-full px-4 overflow-y-auto max-h-48 custom-scrollbar">
                           <div className="grid grid-cols-1 gap-2">
                             {selectedFiles.map((f, i) => (
                               <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group/file">
                                 <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="text-lg group-hover/file:scale-110 transition-transform">📄</span>
                                    <span className="text-sm text-gray-200 truncate max-w-[200px]">{f.name}</span>
                                 </div>
                                 <button onClick={(e) => { e.stopPropagation(); setSelectedFiles(prev => prev.filter((_, idx) => idx !== i)); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">✕</button>
                               </div>
                             ))}
                           </div>
                           <p className="text-xs text-center text-gray-500 mt-4 font-mono">{selectedFiles.length} / {fileLimit} Files Loaded</p>
                           {isFresher && selectedFiles.length === 1 && (
                               <p className="text-[10px] text-center text-amber-500 mt-2">Fresher Limit Reached</p>
                           )}
                        </div>
                      ) : (
                        <div className="z-10 text-center px-4">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors shadow-lg group-hover:scale-110 duration-300">
                            <span className="text-2xl">📂</span>
                          </div>
                          <p className="text-gray-300 font-medium text-sm">Drop lecture notes here</p>
                          <p className="text-xs text-gray-500 mt-2">PDF, DOCX, PPTX (Max {fileLimit})</p>
                        </div>
                      )}
                  </div>
                ) : (
                  <textarea className="w-full h-56 sm:h-64 bg-black/20 text-gray-200 rounded-3xl p-4 sm:p-6 border border-white/10 focus:border-blue-500/50 outline-none resize-none text-xs sm:text-sm font-mono leading-relaxed" placeholder="Paste raw text, notes, or case studies..." value={textInput} onChange={(e) => setTextInput(e.target.value)} />
                )}
              </div>

              <div className="mt-8 flex flex-col md:flex-row justify-center gap-4">
                <button onClick={() => handleGenerate()} disabled={isLoading} className="px-8 py-4 rounded-full bg-white text-black font-bold text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    {isLoading ? 'Processing...' : 'Generate Exam →'}
                </button>
                <button onClick={() => handleGenerate('CHAT')} disabled={isLoading} className="px-6 py-4 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/50 font-bold text-sm uppercase tracking-widest hover:bg-amber-500/20 transition-colors">
                    {canChat ? 'Chat with Notes 💬' : 'Chat Locked 🔒'}
                </button>
              </div>
            </div>
        </div>

        {/* PROFESSOR VIEW */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 ${appMode === 'PROFESSOR' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <h3 className="text-2xl font-serif text-amber-100 mb-4">Class is in session.</h3>
             <div className="w-full max-w-xl relative">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    className="w-full bg-black/40 border border-amber-500/30 rounded-2xl px-6 py-4 text-white outline-none focus:border-amber-500" 
                    placeholder="Ask a question or upload files..." 
                  />
                  <div className="absolute right-2 top-2 bottom-2 flex items-center gap-2">
                     <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white">📎</button>
                     <button onClick={() => handleGenerate()} className="p-2 bg-amber-600 rounded-xl text-white">➜</button>
                  </div>
             </div>
        </div>

      </div>
      
      {fileError && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center rounded-xl font-mono">{fileError}</div>}
      <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.docx,.doc,.pptx,.txt,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
    </div>
  );
};
