import React, { useState, useRef, useEffect } from 'react';
import { ProcessedFile, Difficulty, QuestionType, QuizConfig, TimerDuration, AppMode, AIPersonality, AnalogyDomain } from '../types';
import { processFile } from '../services/fileService';
import { Tooltip } from './Tooltip';

interface InputSectionProps {
  onProcess: (processedFile: ProcessedFile, config: QuizConfig, mode: AppMode) => void;
  isLoading: boolean;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  defaultConfig: { difficulty: Difficulty };
}

export const InputSection: React.FC<InputSectionProps> = ({ onProcess, isLoading, appMode, setAppMode, defaultConfig }) => {
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
  const [personality, setPersonality] = useState<AIPersonality>('Academic');
  const [analogyDomain, setAnalogyDomain] = useState<AnalogyDomain>('General');

  // Sync difficulty when profile changes
  useEffect(() => {
    setDifficulty(defaultConfig.difficulty);
  }, [defaultConfig.difficulty]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const getFullConfig = (): QuizConfig => ({ difficulty, questionType, questionCount, timerDuration, personality, analogyDomain });

  const handleGenerate = async () => {
    if (isLoading) return;
    setUploadProgress(0);

    let payload: ProcessedFile;
    
    try {
      if (appMode === 'PROFESSOR' && chatInput.trim()) {
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
      
      onProcess(payload, getFullConfig(), appMode);
      setChatInput(''); 
      
    } catch (err: any) {
      setFileError(err.message);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-5xl mx-auto relative z-10 animate-slide-up-fade">
      
      {/* Premium Mode Switcher */}
      <div className="flex justify-center mb-10">
        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 flex w-full max-w-2xl shadow-2xl">
          {/* Sliding Background */}
          <div 
              className={`absolute top-2 bottom-2 w-[calc(50%-8px)] rounded-xl transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) shadow-lg border border-white/10 ${
                appMode === 'EXAM' 
                  ? 'left-2 bg-gray-900' 
                  : 'left-[calc(50%+4px)] bg-[#1c1917]' // dark amber/brown
              }`}
          >
              {/* Subtle gradient overlay */}
              <div className={`absolute inset-0 rounded-xl opacity-20 ${
                appMode === 'EXAM' 
                  ? 'bg-gradient-to-b from-blue-500 to-transparent' 
                  : 'bg-gradient-to-b from-amber-500 to-transparent'
              }`} />
          </div>
          
          <button 
              onClick={() => setAppMode('EXAM')} 
              className={`relative z-10 flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 ${
                appMode === 'EXAM' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
              <span className={`text-xl transition-transform duration-300 ${appMode === 'EXAM' ? 'scale-110' : 'scale-100'}`}>⚡</span>
              Exam Mode
          </button>
          <button 
              onClick={() => setAppMode('PROFESSOR')} 
              className={`relative z-10 flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 ${
                appMode === 'PROFESSOR' ? 'text-amber-100' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
              <span className={`text-xl transition-transform duration-300 ${appMode === 'PROFESSOR' ? 'scale-110' : 'scale-100'}`}>👨‍🏫</span>
              Professor
          </button>
        </div>
      </div>

      {/* Main Glass Container */}
      <div className={`glass-panel rounded-[2.5rem] relative overflow-hidden transition-all duration-700 min-h-[600px] flex flex-col ${
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
            {/* Integrated Toolbar */}
            <div className="h-auto md:h-24 border-b border-white/5 bg-black/20 flex flex-wrap items-center px-6 md:px-8 gap-4 md:gap-6 py-4 md:py-0 overflow-x-auto custom-scrollbar z-20">
              
              {/* Difficulty */}
              <div className="flex flex-col gap-1.5 min-w-[140px]">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Difficulty</label>
                  <div className="relative group">
                    <select 
                      value={difficulty} 
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                      className="w-full bg-[#151518] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer hover:bg-[#1a1a1d]"
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="Nightmare">Nightmare 💀</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-blue-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
              </div>

              <div className="hidden md:block w-px h-10 bg-white/10"></div>

              {/* Type */}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Format</label>
                  <div className="relative group">
                    <select 
                      value={questionType} 
                      onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                      className="w-full bg-[#151518] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer hover:bg-[#1a1a1d]"
                    >
                        <option value="Multiple Choice">Multiple Choice</option>
                        <option value="True/False">True / False</option>
                        <option value="Fill in the Gap">Fill in the Gap</option>
                        <option value="Scenario-based">Scenario Based</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-blue-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
              </div>

              <div className="hidden md:block w-px h-10 bg-white/10"></div>

              {/* Count & Timer */}
              <div className="flex gap-4 md:gap-6 items-end flex-wrap">
                  <div className="flex flex-col gap-1.5 min-w-[120px]">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Timer</label>
                    <div className="relative group">
                      <select 
                        value={timerDuration} 
                        onChange={(e) => setTimerDuration(e.target.value as TimerDuration)}
                        className="w-full bg-[#151518] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer hover:bg-[#1a1a1d]"
                      >
                          <option value="Limitless">No Limit</option>
                          <option value="5m">5 Mins</option>
                          <option value="10m">10 Mins</option>
                          <option value="30m">30 Mins</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-blue-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#151518] border border-white/10 rounded-xl px-5 py-3 h-[46px] flex items-center gap-4 hover:border-blue-500/50 transition-colors">
                    <span className="text-xs font-bold text-gray-400 uppercase">Count: <span className="text-white text-sm ml-1">{questionCount}</span></span>
                    <input type="range" min="5" max="50" step="5" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                  </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="flex-1 p-6 md:p-12 flex flex-col justify-center relative">
               
              <div className="flex justify-center gap-8 mb-8 border-b border-white/5 pb-1 w-fit mx-auto">
                <button onClick={() => setActiveTab('FILE')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'FILE' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    Upload Document
                    {activeTab === 'FILE' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}
                </button>
                <button onClick={() => setActiveTab('TEXT')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'TEXT' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    Paste Text
                    {activeTab === 'TEXT' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}
                </button>
              </div>

              <div className="min-h-[250px] relative">
                {activeTab === 'FILE' ? (
                  <div 
                    className={`h-64 border-2 border-dashed rounded-3xl transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
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
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl relative group-hover:scale-110 transition-transform">
                              <span className="text-3xl">📄</span>
                          </div>
                          <p className="text-lg font-bold text-white mb-1">{selectedFile.name}</p>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="text-xs text-red-400 hover:text-red-300 font-medium">Remove File</button>
                        </div>
                      ) : (
                        <div className="z-10 text-center group-hover:scale-105 transition-transform duration-300">
                          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          </div>
                          <p className="text-gray-300 font-medium">Drop your study material here</p>
                          <p className="text-xs text-gray-500 mt-2">PDF, DOCX, PPTX, TXT</p>
                        </div>
                      )}
                  </div>
                ) : (
                  <textarea
                    className="w-full h-64 bg-black/20 text-gray-200 rounded-3xl p-6 border border-white/10 focus:border-blue-500/50 outline-none resize-none text-sm leading-relaxed custom-scrollbar shadow-inner font-mono"
                    placeholder="Paste your lecture notes or text here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                )}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                    onClick={handleGenerate}
                    disabled={((activeTab === 'FILE' && !selectedFile) || (activeTab === 'TEXT' && !textInput.trim())) || isLoading}
                    className={`px-12 py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all shadow-lg hover-lift ${
                      ((activeTab === 'FILE' && !selectedFile) || (activeTab === 'TEXT' && !textInput.trim())) || isLoading
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-gray-200 hover:scale-105'
                    }`}
                >
                    {isLoading ? 'Processing...' : 'Generate Exam'}
                </button>
              </div>
            </div>
        </div>

        {/* --- PROFESSOR VIEW --- */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            appMode === 'PROFESSOR' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'
        }`}>
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-[#1c1917] to-black rounded-full w-full h-full flex items-center justify-center border border-amber-500/30 shadow-2xl">
                  <span className="text-4xl">👨‍🏫</span>
              </div>
            </div>
            
            <h3 className="text-2xl font-serif text-amber-100 mb-2 text-center">Class is in session.</h3>
            <p className="text-gray-400 mb-10 text-center max-w-md">Upload materials or ask a question to begin your personalized lesson plan.</p>

            <div className="w-full max-w-2xl relative group">
              <div className="bg-black/40 rounded-2xl border border-white/10 p-2 flex items-center shadow-inner focus-within:border-amber-500/50 focus-within:bg-black/60 transition-all focus-within:ring-1 focus-within:ring-amber-500/20">
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-white/10 rounded-xl text-gray-400 hover:text-amber-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder={selectedFile ? `Using ${selectedFile.name}...` : "What topic shall we dismantle today?"}
                    className="flex-1 bg-transparent border-none outline-none text-white px-4 placeholder-gray-500"
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={isLoading || (!chatInput && !selectedFile)}
                    className="p-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl text-white shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                  </button>
              </div>
              {selectedFile && (
                  <div className="absolute -bottom-10 left-0 text-xs text-amber-500 font-medium flex items-center gap-2 bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-900/30 animate-fade-in">
                    <span>Attached: {selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="hover:text-white transition-colors">✕</button>
                  </div>
              )}
            </div>
        </div>

      </div>
      
      {fileError && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center rounded-xl animate-fade-in">{fileError}</div>}
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.doc,.pptx,.txt,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
    </div>
  );
};