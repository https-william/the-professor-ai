
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
  
  // Excellentia Features
  const [useOracle, setUseOracle] = useState(false);
  const [useWeaknessDestroyer, setUseWeaknessDestroyer] = useState(false);

  // Sync difficulty & personality when profile changes
  useEffect(() => {
    setDifficulty(defaultConfig.difficulty);
    if (userProfile.defaultPersonality) {
       setPersonality(userProfile.defaultPersonality);
    }
  }, [defaultConfig.difficulty, userProfile.defaultPersonality]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tier Restrictions
  const isFresher = userProfile.subscriptionTier === 'Fresher';
  const isScholar = userProfile.subscriptionTier === 'Scholar';
  const isSupreme = userProfile.subscriptionTier === 'Excellentia Supreme';
  const canChat = isScholar || isSupreme;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFresher) {
       onShowSubscription();
       return;
    }
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.webp'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setFileError("Unsupported file type. Allowed: PDF, DOCX, PPTX, TXT, Images.");
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
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
    if (isFresher) {
      onShowSubscription();
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const getFullConfig = (): QuizConfig => ({ 
      difficulty, 
      questionType, 
      questionCount, 
      timerDuration, 
      personality, 
      analogyDomain,
      useOracle,
      useWeaknessDestroyer
  });

  const handleGenerate = async (targetMode?: AppMode) => {
    if (isLoading) return;
    
    // Usage Limits for Fresher
    if (isFresher && userProfile.dailyQuizzesGenerated >= 3) {
      onShowSubscription();
      return;
    }

    // Chat Lock
    if (targetMode === 'CHAT' && !canChat) {
        onShowSubscription();
        return;
    }

    setUploadProgress(0);

    let payload: ProcessedFile;
    const finalMode = targetMode || appMode;
    
    try {
      if (finalMode === 'PROFESSOR' && chatInput.trim()) {
        payload = { type: 'TEXT', content: chatInput };
      } else if (activeTab === 'FILE' && selectedFile) {
        setUploadProgress(1); // Start visual
        payload = await processFile(selectedFile, (progress) => {
           setUploadProgress(progress);
        });
        setUploadProgress(100);
      } else if (activeTab === 'TEXT' && textInput.trim()) {
        payload = { type: 'TEXT', content: textInput };
      } else {
        return; 
      }
      
      onProcess(payload, getFullConfig(), finalMode);
      setChatInput(''); 
      
    } catch (err: any) {
      setFileError(err.message);
      setUploadProgress(0);
    }
  };

  const LockedOverlay = ({ label }: { label?: string }) => (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-xl cursor-pointer hover:bg-black/90 transition-colors border border-amber-500/20" onClick={onShowSubscription}>
       <span className="text-2xl mb-1">🔒</span>
       <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">{label || "Upgrade"}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto relative z-10 animate-slide-up-fade px-4 sm:px-0">
      
      {/* Premium Mode Switcher */}
      <div id="mode-switch-target" className="flex justify-center mb-6 sm:mb-10 transition-transform duration-300">
        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-white/10 flex w-full max-w-[320px] sm:max-w-2xl shadow-2xl micro-interact">
          {/* Sliding Background */}
          <div 
              className={`absolute top-1.5 bottom-1.5 sm:top-2 sm:bottom-2 w-[calc(50%-6px)] sm:w-[calc(50%-8px)] rounded-[10px] sm:rounded-xl transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) shadow-lg border border-white/10 ${
                appMode === 'EXAM' 
                  ? 'left-1.5 sm:left-2 bg-gray-900' 
                  : 'left-[calc(50%+3px)] sm:left-[calc(50%+4px)] bg-[#1c1917]' // dark amber/brown
              }`}
          >
              <div className={`absolute inset-0 rounded-[10px] sm:rounded-xl opacity-20 ${
                appMode === 'EXAM' 
                  ? 'bg-gradient-to-b from-blue-500 to-transparent' 
                  : 'bg-gradient-to-b from-amber-500 to-transparent'
              }`} />
          </div>
          
          <button 
              onClick={() => setAppMode('EXAM')} 
              className={`relative z-10 flex-1 py-3 sm:py-4 text-[10px] sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 ${
                appMode === 'EXAM' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
              <span className={`text-lg sm:text-xl transition-transform duration-300 ${appMode === 'EXAM' ? 'scale-110' : 'scale-100'}`}>⚡</span>
              Exam
          </button>
          <button 
              onClick={() => setAppMode('PROFESSOR')} 
              className={`relative z-10 flex-1 py-3 sm:py-4 text-[10px] sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 ${
                appMode === 'PROFESSOR' ? 'text-amber-100' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
              <span className={`text-lg sm:text-xl transition-transform duration-300 ${appMode === 'PROFESSOR' ? 'scale-110' : 'scale-100'}`}>👨‍🏫</span>
              Professor
          </button>
        </div>
      </div>

      {/* Main Glass Container */}
      <div className={`glass-panel rounded-3xl sm:rounded-[2.5rem] relative overflow-hidden transition-all duration-700 min-h-[500px] sm:min-h-[600px] flex flex-col ${
        appMode === 'PROFESSOR' ? 'border-amber-500/10 shadow-[0_0_100px_-30px_rgba(245,158,11,0.15)]' : 'border-blue-500/10 shadow-[0_0_100px_-30px_rgba(59,130,246,0.15)]'
      }`}>
        
        {/* Background Gradients */}
        <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${appMode === 'EXAM' ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-blue-500/5 blur-[120px]"></div>
        </div>
        <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${appMode === 'PROFESSOR' ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-amber-500/5 blur-[120px]"></div>
        </div>

        {/* --- EXAM VIEW --- */}
        <div className={`absolute inset-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            appMode === 'EXAM' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 pointer-events-none'
        }`}>
            {/* Integrated Toolbar - Organized for clarity */}
            <div id="exam-config-target" className="border-b border-white/5 bg-black/20 z-20 overflow-visible flex flex-col">
              
              {/* Row 1: Standard Configuration */}
              <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center px-4 md:px-8 gap-3 sm:gap-6 py-4">
                  {/* Difficulty */}
                  <div className="flex flex-col gap-1.5 md:min-w-[140px]">
                      <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Difficulty</label>
                      <div className="relative group micro-interact">
                        <select 
                          value={difficulty} 
                          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                          className="w-full bg-[#151518] border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white appearance-none outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-[#1a1a1d]"
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            {!isSupreme && <option value="Nightmare" disabled>Nightmare 🔒</option>}
                            {isSupreme && <option value="Nightmare">Nightmare 💀</option>}
                        </select>
                        {!isSupreme && difficulty === 'Nightmare' && <LockedOverlay />}
                      </div>
                  </div>

                  <div className="hidden md:block w-px h-10 bg-white/10"></div>

                  {/* Type */}
                  <div className="flex flex-col gap-1.5 md:min-w-[160px]">
                      <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Format</label>
                      <div className="relative group micro-interact">
                        <select 
                          value={questionType} 
                          onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                          className="w-full bg-[#151518] border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white appearance-none outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-[#1a1a1d]"
                        >
                            <option value="Multiple Choice">Multiple Choice</option>
                            <option value="True/False">True / False</option>
                            <option value="Fill in the Gap">Fill in the Gap</option>
                            <option value="Scenario-based">Scenario Based</option>
                        </select>
                      </div>
                  </div>

                  <div className="hidden md:block w-px h-10 bg-white/10"></div>

                  {/* Timer */}
                  <div className="flex flex-col gap-1.5 md:min-w-[120px]">
                        <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Timer</label>
                        <div className="relative group micro-interact">
                          <select 
                            value={timerDuration} 
                            onChange={(e) => setTimerDuration(e.target.value as TimerDuration)}
                            className="w-full bg-[#151518] border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white appearance-none outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-[#1a1a1d]"
                          >
                              <option value="Limitless">No Limit</option>
                              <option value="5m">5 Mins</option>
                              <option value="10m">10 Mins</option>
                              <option value="30m">30 Mins</option>
                          </select>
                        </div>
                  </div>

                   {/* Count */}
                  <div className="flex flex-col gap-1.5 md:min-w-[150px]">
                        <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Questions: {questionCount}</label>
                        <div className="bg-[#151518] border border-white/10 rounded-xl px-4 py-2 sm:py-3 h-[42px] sm:h-[46px] flex items-center hover:border-blue-500/50 transition-colors w-full micro-interact">
                            <input type="range" min="5" max="50" step="5" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 h-1.5" />
                        </div>
                  </div>
              </div>

              {/* Row 2: Advanced Protocols (Oracle & Weakness) */}
              <div className="px-4 md:px-8 pb-4 pt-2 border-t border-white/5 bg-black/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500/70">Advanced Protocols</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3">
                    {/* The Oracle Toggle */}
                    <div 
                        className={`relative group flex items-center gap-3 cursor-pointer px-4 py-2.5 rounded-lg border transition-all micro-interact lg:min-w-[200px] ${
                        useOracle 
                            ? 'bg-amber-900/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                            : 'bg-black/20 border-white/10 hover:border-white/20'
                        }`}
                        onClick={() => !isSupreme ? onShowSubscription() : setUseOracle(!useOracle)}
                    >
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors flex-shrink-0 ${useOracle ? 'bg-amber-500 border-amber-500' : 'border-gray-600'}`}>
                            {useOracle && <svg className="w-3 h-3 text-black" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-bold uppercase tracking-wider leading-none ${useOracle ? 'text-amber-400' : 'text-gray-400'}`}>The Oracle</span>
                            <span className="text-[8px] text-gray-500 mt-0.5">Predictive Exam Engine</span>
                        </div>
                        {!isSupreme && <span className="ml-auto text-[8px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 font-bold">LOCKED</span>}
                    </div>

                    {/* Weakness Destroyer Toggle */}
                    <div 
                        className={`relative group flex items-center gap-3 cursor-pointer px-4 py-2.5 rounded-lg border transition-all micro-interact lg:min-w-[220px] ${
                        useWeaknessDestroyer 
                            ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                            : 'bg-black/20 border-white/10 hover:border-white/20'
                        }`}
                        onClick={() => !isSupreme ? onShowSubscription() : setUseWeaknessDestroyer(!useWeaknessDestroyer)}
                    >
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors flex-shrink-0 ${useWeaknessDestroyer ? 'bg-red-500 border-red-500' : 'border-gray-600'}`}>
                            {useWeaknessDestroyer && <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-bold uppercase tracking-wider leading-none ${useWeaknessDestroyer ? 'text-red-400' : 'text-gray-400'}`}>Weakness Destroyer</span>
                            <span className="text-[8px] text-gray-500 mt-0.5">Target Past Mistakes</span>
                        </div>
                        {!isSupreme && <span className="ml-auto text-[8px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 font-bold">LOCKED</span>}
                    </div>
                  </div>
              </div>
            </div>

            {/* Input Area */}
            <div id="upload-zone-target" className="flex-1 p-4 sm:p-6 md:p-12 flex flex-col justify-center relative">
               
              <div className="flex justify-center gap-4 sm:gap-8 mb-6 sm:mb-8 border-b border-white/5 pb-1 w-fit mx-auto">
                <button onClick={() => setActiveTab('FILE')} className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all relative micro-interact ${activeTab === 'FILE' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    Upload Document
                    {activeTab === 'FILE' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}
                </button>
                <button onClick={() => setActiveTab('TEXT')} className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all relative micro-interact ${activeTab === 'TEXT' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    Paste Text
                    {activeTab === 'TEXT' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}
                </button>
              </div>

              <div className="min-h-[250px] relative">
                {activeTab === 'FILE' ? (
                  <div 
                    className={`h-56 sm:h-64 border-2 border-dashed rounded-3xl transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group micro-interact ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => !isFresher ? fileInputRef.current?.click() : onShowSubscription()}
                  >
                      {/* FRESHER LOCK */}
                      {isFresher && <LockedOverlay label="Upgrade to Upload" />}

                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-blue-500 animate-progress" style={{ width: `${uploadProgress}%`, transition: 'width 0.2s' }}></div>
                          </div>
                          <p className="text-blue-400 font-mono text-xs uppercase tracking-widest animate-pulse">Scanning Document...</p>
                        </div>
                      )}
                      
                      {selectedFile ? (
                        <div className="z-10 text-center animate-slide-up-fade">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl relative group-hover:scale-110 transition-transform">
                              <span className="text-2xl sm:text-3xl">📄</span>
                          </div>
                          <p className="text-base sm:text-lg font-bold text-white mb-1 px-4 truncate max-w-[250px]">{selectedFile.name}</p>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-xs text-red-400 hover:text-red-300 font-medium micro-interact">Remove File</button>
                        </div>
                      ) : (
                        <div className="z-10 text-center group-hover:scale-105 transition-transform duration-300 px-4">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          </div>
                          <p className="text-gray-300 font-medium text-sm sm:text-base">Drop your study material here</p>
                          <p className="text-xs text-gray-500 mt-2">PDF, DOCX, PPTX, TXT</p>
                        </div>
                      )}
                  </div>
                ) : (
                  <textarea
                    className="w-full h-56 sm:h-64 bg-black/20 text-gray-200 rounded-3xl p-4 sm:p-6 border border-white/10 focus:border-blue-500/50 outline-none resize-none text-xs sm:text-sm leading-relaxed custom-scrollbar shadow-inner font-mono micro-interact"
                    placeholder="Paste your lecture notes or text here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                )}
              </div>

              <div className="mt-8 flex justify-center gap-4">
                <button
                    onClick={() => handleGenerate()}
                    disabled={((activeTab === 'FILE' && !selectedFile) || (activeTab === 'TEXT' && !textInput.trim())) || isLoading}
                    className={`px-8 sm:px-12 py-3 sm:py-4 rounded-full font-bold text-xs sm:text-sm uppercase tracking-widest transition-all shadow-lg hover-lift micro-interact ${
                      ((activeTab === 'FILE' && !selectedFile) || (activeTab === 'TEXT' && !textInput.trim())) || isLoading
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-gray-200 hover:scale-105'
                    }`}
                >
                    {isLoading ? 'Processing...' : 'Generate Exam'}
                </button>
                
                {/* Chat Button */}
                <button
                    onClick={() => handleGenerate('CHAT')}
                    disabled={((activeTab === 'FILE' && !selectedFile) || (activeTab === 'TEXT' && !textInput.trim())) || isLoading}
                    className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-xs sm:text-sm uppercase tracking-widest transition-all shadow-lg hover-lift micro-interact flex items-center gap-2 ${
                        ((activeTab === 'FILE' && !selectedFile) || (activeTab === 'TEXT' && !textInput.trim())) || isLoading
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                        : (canChat ? 'bg-amber-900/40 text-amber-500 border border-amber-500/50 hover:bg-amber-900/60' : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-pointer')
                    }`}
                >
                   {canChat ? 'Chat with Notes' : 'Chat with Notes (Locked)'}
                   {canChat && <span className="text-lg">💬</span>}
                   {!canChat && <span className="text-xs">🔒</span>}
                </button>
              </div>
            </div>
        </div>

        {/* --- PROFESSOR VIEW (Hidden for File Upload Logic but shares component) --- */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            appMode === 'PROFESSOR' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'
        }`}>
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-6">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-[#1c1917] to-black rounded-full w-full h-full flex items-center justify-center border border-amber-500/30 shadow-2xl">
                  <span className="text-3xl sm:text-4xl">👨‍🏫</span>
              </div>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-serif text-amber-100 mb-2 text-center">Class is in session.</h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-8 sm:mb-10 text-center max-w-md px-4">Upload materials or ask a question to begin your personalized lesson plan.</p>

            <div className="w-full max-w-xl sm:max-w-2xl relative group px-4 sm:px-0">
              <div className="bg-black/40 rounded-2xl border border-white/10 p-1.5 sm:p-2 flex items-center shadow-inner focus-within:border-amber-500/50 focus-within:bg-black/60 transition-all focus-within:ring-1 focus-within:ring-amber-500/20">
                  <button onClick={() => !isFresher ? fileInputRef.current?.click() : onShowSubscription()} className={`p-2 sm:p-3 hover:bg-white/10 rounded-xl transition-colors micro-interact ${isFresher ? 'text-gray-500' : 'text-gray-400 hover:text-amber-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder={selectedFile ? `Using ${selectedFile.name}...` : "What topic shall we dismantle today?"}
                    className="flex-1 bg-transparent border-none outline-none text-white px-2 sm:px-4 placeholder-gray-500 text-sm sm:text-base min-w-0"
                  />
                  <button 
                    onClick={() => handleGenerate()}
                    disabled={isLoading || (!chatInput && !selectedFile)}
                    className="p-2 sm:p-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 micro-interact"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                  </button>
              </div>
              {selectedFile && (
                  <div className="absolute -bottom-10 left-0 text-[10px] sm:text-xs text-amber-500 font-medium flex items-center gap-2 bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-900/30 animate-fade-in mx-4 sm:mx-0">
                    <span className="truncate max-w-[200px]">Attached: {selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="hover:text-white transition-colors">✕</button>
                  </div>
              )}
            </div>
        </div>

      </div>
      
      {fileError && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center rounded-xl animate-fade-in mx-4 sm:mx-0">{fileError}</div>}
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.doc,.pptx,.txt,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
    </div>
  );
};