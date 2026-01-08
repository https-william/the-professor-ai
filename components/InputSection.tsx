
import React, { useState, useRef, useEffect } from 'react';
import { ProcessedFile, Difficulty, QuestionType, QuizConfig, TimerDuration, AppMode, AIPersonality, AnalogyDomain, UserProfile } from '../types';
import { processFile } from '../services/fileService';
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
  onHubEnter: () => void;
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
  const [activeTab, setActiveTab] = useState<'TEXT' | 'FILE'>('TEXT');
  const [textInput, setTextInput] = useState('');
  const [chatInput, setChatInput] = useState(''); 
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Config
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultConfig.difficulty);
  const [questionType, setQuestionType] = useState<QuestionType>('Multiple Choice');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timerDuration, setTimerDuration] = useState<TimerDuration>('Limitless');
  const [personality, setPersonality] = useState<AIPersonality>(userProfile.defaultPersonality || 'Academic');
  const [analogyDomain, setAnalogyDomain] = useState<AnalogyDomain>('General');
  const [useOracle, setUseOracle] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFresher = userProfile.subscriptionTier === 'Fresher';
  const isExcellentia = userProfile.subscriptionTier === 'Excellentia';
  const QUIZ_LIMIT = isFresher ? 1 : 999;
  const isLimitReached = (userProfile.dailyQuizzesGenerated || 0) >= QUIZ_LIMIT;

  useEffect(() => {
    setDifficulty(defaultConfig.difficulty);
    if (userProfile.defaultPersonality) setPersonality(userProfile.defaultPersonality);
  }, [defaultConfig.difficulty, userProfile.defaultPersonality]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const addFiles = (files: File[]) => {
    const validFiles: File[] = [];
    for (const f of files) validFiles.push(f);
    if (validFiles.length > 0) setActiveTab('FILE');
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setFileError(null);
    setUploadProgress(0);
  };

  const executeGeneration = async () => {
    if (isLoading) return;
    if (isLimitReached) { setFileError("Daily limit reached."); onShowSubscription(); return; }

    setUploadProgress(0);

    try {
      let fullContent = "";
      let name = 'Generated Session';

      if (activeTab === 'FILE' && selectedFiles.length > 0) {
         setUploadProgress(15);
         for (let i = 0; i < selectedFiles.length; i++) {
            const processed = await processFile(selectedFiles[i], (p) => setUploadProgress(15 + (p * 0.85))); 
            fullContent += `\n\n--- FILE: ${selectedFiles[i].name} ---\n${processed.content}`;
         }
         name = selectedFiles[0].name;
      } else {
         if (appMode === 'PROFESSOR' && chatInput.trim()) {
             fullContent = `User Question: ${chatInput}`;
             name = "Study Query";
         } else {
             fullContent = textInput;
             name = "Text Input";
         }
      }

      if (!fullContent.trim()) { setFileError("Please provide content to analyze."); return; }

      const config: QuizConfig = { difficulty, questionType, questionCount, timerDuration, personality, analogyDomain, useOracle };
      onProcess({ type: 'TEXT', content: fullContent, name }, config, appMode);
      
    } catch (err: any) {
      setFileError(err.message);
      setUploadProgress(0);
    }
  };

  const ConfigSelect = ({ label, value, setter, options }: any) => (
      <div className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{label}</label>
          <select 
            value={value} 
            onChange={(e) => setter(e.target.value)} 
            className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 font-medium cursor-pointer hover:bg-white/5 transition-colors"
          >
              {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto relative z-10 px-4 pb-20">
      {/* Mode Switcher */}
      <div className="flex justify-center mb-8">
        <div className="bg-[#18181b] p-1 rounded-xl border border-white/10 flex shadow-xl">
          <button onClick={() => setAppMode('EXAM')} className={`px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${appMode === 'EXAM' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Exam Mode</button>
          <button onClick={() => setAppMode('PROFESSOR')} className={`px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${appMode === 'PROFESSOR' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Study Room</button>
        </div>
      </div>

      <div className={`bg-[#0f0f10] border rounded-3xl overflow-hidden shadow-2xl transition-colors duration-500 ${appMode === 'EXAM' ? 'border-blue-500/20' : 'border-amber-500/20'}`}>
        
        {/* Config Panel */}
        {appMode === 'EXAM' && (
            <div className="border-b border-white/5 bg-[#141414] p-6">
                <div className="flex flex-wrap gap-6 items-end justify-between">
                    <div className="flex flex-wrap gap-6">
                        <ConfigSelect label="Difficulty" value={difficulty} setter={setDifficulty} options={["Easy", "Medium", "Hard", "Nightmare"]} />
                        <ConfigSelect label="Format" value={questionType} setter={setQuestionType} options={["Multiple Choice", "True/False", "Fill in the Gap", "Mixed"]} />
                        <ConfigSelect label="Questions" value={questionCount} setter={(v:any) => setQuestionCount(parseInt(v))} options={["5", "10", "15", "20", "30"]} />
                        <ConfigSelect label="Time" value={timerDuration} setter={setTimerDuration} options={["Limitless", "5m", "10m", "30m", "1h"]} />
                    </div>
                    
                    {/* THE ORACLE BUTTON */}
                    {isExcellentia && (
                        <button 
                            onClick={() => setUseOracle(!useOracle)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${useOracle ? 'bg-purple-900/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${useOracle ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            <span className="text-xs font-bold uppercase tracking-widest">The Oracle</span>
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* Input Area */}
        <div className="p-4 sm:p-6">
            <div className="flex gap-4 mb-4 px-2">
                <button onClick={() => setActiveTab('TEXT')} className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'TEXT' ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>Text / Paste</button>
                <button onClick={() => setActiveTab('FILE')} className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'FILE' ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-gray-400'}`}>File Upload</button>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl min-h-[250px] relative overflow-hidden border border-white/5">
                {activeTab === 'TEXT' ? (
                    <textarea 
                        value={appMode === 'PROFESSOR' ? chatInput : textInput} 
                        onChange={(e) => appMode === 'PROFESSOR' ? setChatInput(e.target.value) : setTextInput(e.target.value)}
                        placeholder={appMode === 'PROFESSOR' ? "Ask a question to start a lesson..." : "Paste your lecture notes here..."}
                        className="w-full h-full min-h-[250px] bg-transparent p-6 text-base text-gray-200 font-mono outline-none resize-none placeholder-gray-600"
                    />
                ) : (
                    <div 
                        className={`w-full h-full min-h-[250px] flex flex-col items-center justify-center cursor-pointer transition-all ${dragActive ? 'bg-blue-900/10 border-2 border-dashed border-blue-500' : 'hover:bg-white/5'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {selectedFiles.length > 0 ? (
                            <div className="flex flex-wrap gap-2 p-6 justify-center w-full">
                                {selectedFiles.map((f, i) => (
                                    <div key={i} className="bg-[#2a2a2a] px-3 py-2 rounded-lg flex items-center gap-2 border border-white/10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <span className="text-xs text-white">{f.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6">
                                <div className="text-4xl mb-4 text-gray-600 flex justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <p className="text-sm font-bold text-gray-300 uppercase">Click or Drop Files</p>
                            </div>
                        )}
                        {uploadProgress > 0 && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                                <span className="text-blue-500 font-bold">{Math.round(uploadProgress)}%</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="p-6 bg-[#141414] border-t border-white/5 flex justify-end">
            <button 
                onClick={executeGeneration} 
                disabled={isLoading}
                className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold uppercase text-xs tracking-[0.15em] transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] ${isLimitReached ? 'bg-red-900/50 text-red-200' : appMode === 'EXAM' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'}`}
            >
                {isLoading ? 'Processing...' : isLimitReached ? 'Limit Reached' : appMode === 'EXAM' ? 'Generate Exam' : 'Start Session'}
            </button>
        </div>
      </div>

      {fileError && <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 text-red-400 text-sm font-medium text-center rounded-xl animate-fade-in">{fileError}</div>}
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
    </div>
  );
};
