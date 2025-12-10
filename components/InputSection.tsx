
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
  onOpenProfile: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  onProcess, 
  isLoading, 
  appMode, 
  setAppMode, 
  defaultConfig, 
  userProfile,
  onShowSubscription,
  onOpenProfile
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'TEXT'>('FILE');
  const [textInput, setTextInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  
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
        onShowSubscription();
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

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
      
      // Process files first (Unified logic for both modes)
      if (selectedFiles.length > 0) {
         // Simulate fast start
         setUploadProgress(15);
         
         for (let i = 0; i < selectedFiles.length; i++) {
            const processed = await processFile(selectedFiles[i], (p) => setUploadProgress(15 + (p * 0.85))); // Scale progress
            fullContent += `\n\n--- FILE: ${selectedFiles[i].name} ---\n${processed.content}`;
         }
      }

      // Append text input based on mode
      if (finalMode === 'PROFESSOR') {
         if (chatInput.trim()) {
             fullContent += `\n\nUser Context/Question: ${chatInput}`;
         }
         // Validation for Professor mode
         if (!fullContent.trim()) {
             setFileError("Please ask a question or upload a file to begin the lesson.");
             return;
         }
      } else {
         // Exam Mode
         if (activeTab === 'TEXT' && textInput.trim()) {
             // If we are in text tab, we might want to prioritize text input or combine?
             // Logic: If user put text in Text Tab, append it.
             fullContent += `\n\n${textInput}`;
         }
         
         if (!fullContent.trim()) {
             setFileError("Please upload a file or paste text content to generate an exam.");
             return;
         }
      }

      onProcess({ 
          type: 'TEXT', 
          content: fullContent, 
          name: selectedFiles.length > 0 ? (selectedFiles.length === 1 ? selectedFiles[0].name : 'Multi-File Session') : 'Text Input' 
      }, getFullConfig(), finalMode);
      
      setChatInput('');
      if (finalMode === 'PROFESSOR') {
          setSelectedFiles([]); // Clean up after sending in chat mode
      }
      
    } catch (err: any) {
      setFileError(err.message);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto relative z-10 animate-slide-up-fade px-4 sm:px-0 h-[calc(100vh-180px)] min-h-[500px] flex flex-col">
      
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
        <div className={`absolute inset-0 flex flex-col transition-all duration-500 ${appMode === 'EXAM' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 pointer-events-none'}`}>
            {/* Scrollable Configuration */}
            <div className="border-b border-white/5 bg-black/20 z-20 flex-shrink-0">
              <div className="p-4 overflow-x-auto custom-scrollbar">
                <div className="flex sm:grid sm:grid-cols-4 gap-4 min-w-[600px] sm:min-w-0">
                    <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-xl border border-white/5 min-w-[140px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Difficulty</label>
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="w-full bg-[#151518] border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none cursor-pointer hover:border-blue-500/50 transition-colors">
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                              <option value="Nightmare">Nightmare 💀</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-xl border border-white/5 min-w-[140px]">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Format</label>
                        <select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)} className="w-full bg-[#151518] border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none cursor-pointer hover:border-blue-500/50 transition-colors">
                              <option value="Multiple Choice">Multiple Choice</option>
                              <option value="True/False">True / False</option>
                              <option value="Fill in the Gap">Fill in the Gap</option>
                              <option value="Scenario-based">Scenario Based</option>
                              <option value="Mixed">Mixed (All Types)</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-xl border border-white/5 min-w-[140px]">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Timer</label>
                          <select value={timerDuration} onChange={(e) => setTimerDuration(e.target.value as TimerDuration)} className="w-full bg-[#151518] border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none cursor-pointer hover:border-blue-500/50 transition-colors">
                                <option value="Limitless">No Limit</option>
                                <option value="5m">5 Mins</option>
                                <option value="10m">10 Mins</option>
                                <option value="30m">30 Mins</option>
                                <option value="45m">45 Mins</option>
                                <option value="1h">1 Hour</option>
                                <option value="1h 30m">1h 30m</option>
                                <option value="2h">2 Hours</option>
                          </select>
                    </div>
                    <div className="flex flex-col gap-1.5 bg-white/5 p-3 rounded-xl border border-white/5 min-w-[140px]">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Count: {questionCount}</label>
                          <input type="range" min="5" max="50" step="5" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg accent-blue-500 mt-3 cursor-pointer" />
                    </div>
                </div>
              </div>
            </div>

            {/* Premium Protocol Cards */}
            <div className="px-4 py-2 grid grid-cols-2 gap-4 shrink-0">
               <button 
                 onClick={() => setUseOracle(!useOracle)} 
                 className={`p-4 rounded-xl border flex flex-col items-start gap-1 transition-all relative overflow-hidden group ${
                   useOracle 
                   ? 'bg-gradient-to-r from-amber-950 to-orange-900 border-amber-500 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/50' 
                   : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                 }`}
               >
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(251,191,36,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                 <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 relative z-10">
                    <div className={`w-2 h-2 rounded-full ${useOracle ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_orange]' : 'bg-gray-600'}`}></div>
                    The Oracle
                 </div>
                 <div className="text-[9px] opacity-70 font-mono relative z-10">Predictive Questioning Protocol</div>
                 {useOracle && <div className="absolute top-2 right-2 text-[8px] font-bold text-black bg-amber-500 rounded px-1.5 py-0.5 shadow-lg shadow-amber-500/20">ACTIVE</div>}
               </button>

               <button 
                 onClick={() => setUseWeaknessDestroyer(!useWeaknessDestroyer)} 
                 className={`p-4 rounded-xl border flex flex-col items-start gap-1 transition-all relative overflow-hidden group ${
                   useWeaknessDestroyer 
                   ? 'bg-gradient-to-r from-red-950 to-rose-900 border-red-600 text-red-200 shadow-[0_0_20px_rgba(225,29,72,0.3)] ring-1 ring-red-600/50' 
                   : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                 }`}
               >
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(244,63,94,0.15),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                 <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 relative z-10">
                    <div className={`w-2 h-2 rounded-full ${useWeaknessDestroyer ? 'bg-red-500 animate-[ping_2s_infinite] shadow-[0_0_8px_red]' : 'bg-gray-600'}`}></div>
                    Weakness Destroyer
                 </div>
                 <div className="text-[9px] opacity-70 font-mono relative z-10">Target Low Score Topics</div>
                 {useWeaknessDestroyer && <div className="absolute top-2 right-2 text-[8px] font-bold text-black bg-red-500 rounded px-1.5 py-0.5 shadow-lg shadow-red-500/20">ACTIVE</div>}
               </button>
            </div>

            {/* Main Upload Area */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col relative bg-gradient-to-b from-black/0 to-black/20 custom-scrollbar">
               <div className="flex justify-center mb-6 shrink-0">
                <div className="bg-black/40 p-1.5 rounded-2xl flex gap-1 border border-white/10 shadow-lg">
                    <button onClick={() => setActiveTab('FILE')} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'FILE' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Files</button>
                    <button onClick={() => setActiveTab('TEXT')} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'TEXT' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Text</button>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                {activeTab === 'FILE' ? (
                  <div 
                    className={`flex-grow border-2 border-dashed rounded-3xl transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group min-h-[200px] ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
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
                          <p className="text-gray-500 text-xs mt-2">PDF, DOCX, PPTX, TXT</p>
                        </div>
                      )}
                  </div>
                ) : (
                  <textarea className="w-full flex-grow bg-black/20 text-gray-200 rounded-3xl p-6 border border-white/10 focus:border-blue-500/50 outline-none resize-none text-sm font-mono leading-relaxed placeholder-gray-600" placeholder="Paste raw text notes..." value={textInput} onChange={(e) => setTextInput(e.target.value)} />
                )}
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-6 border-t border-white/10 bg-[#0a0a0a] flex flex-col sm:flex-row gap-4 items-center justify-end shrink-0">
               <button onClick={() => handleGenerate('CHAT')} disabled={isLoading} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 font-bold text-xs uppercase tracking-widest hover:bg-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  Chat with Notes
               </button>
               <button onClick={() => handleGenerate()} disabled={isLoading} className="w-full sm:w-auto px-10 py-4 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
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

        {/* PROFESSOR VIEW */}
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

                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    className="w-full bg-black/60 border border-amber-500/30 rounded-2xl pl-6 pr-24 py-6 text-white outline-none focus:border-amber-500 placeholder-gray-600 text-lg shadow-2xl transition-all focus:bg-black/80" 
                    placeholder="Ask a question or upload files..." 
                  />
                  <div className="absolute right-3 top-3 bottom-3 flex items-center gap-2">
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
             <p className="mt-6 text-xs text-gray-500 font-mono uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                The Professor is listening.
             </p>
        </div>
      </div>
      
      {fileError && <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 text-red-400 text-sm text-center rounded-2xl font-bold animate-slide-up-fade">{fileError}</div>}
      <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.docx,.doc,.pptx,.txt,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
    </div>
  );
};
