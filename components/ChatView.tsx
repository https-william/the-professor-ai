
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ChatMessage, ChatState, UserProfile } from '../types';
import { generateChatResponse } from '../services/geminiService';
import { CameraScanner } from './CameraScanner';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';

interface ChatViewProps {
  chatState: ChatState;
  onUpdate: (state: ChatState) => void;
  onExit: () => void;
  userProfile?: UserProfile;
  onDeductCredits?: (amount: number, reason: string) => Promise<boolean>;
}

declare global {
  interface Window {
    marked: any;
    webkitSpeechRecognition: any;
  }
}

// --- Suggestions ---
const INITIAL_SUGGESTIONS = [
  "Summarize key points from the document",
  "Explain the main concepts simply",
  "Quiz me on this material"
];

const FOLLOWUP_SUGGESTIONS = [
  "Explain that further",
  "Give me an example"
];

// --- Custom Loader ---
const Loader: React.FC = () => (
  <svg
    className="w-6 h-6 text-amber-500 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m4.9 4.9 2.9 2.9" className="opacity-30" />
    <path d="M2 12h4" className="opacity-40" />
    <path d="m4.9 19.1 2.9-2.9" className="opacity-50" />
    <path d="M12 18v4" className="opacity-60" />
    <path d="m16.2 16.2 2.9 2.9" className="opacity-70" />
    <path d="M18 12h4" className="opacity-80" />
    <path d="m16.2 7.8 2.9-2.9" className="opacity-90" />
    <path d="M12 2v4" />
  </svg>
);

// --- AI Icon ---
const AIIcon: React.FC<{ small?: boolean }> = ({ small }) => (
  <div className={`flex-shrink-0 ${small ? 'w-8 h-8' : 'w-12 h-12'} bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg`}>
    <svg xmlns="http://www.w3.org/2000/svg" className={`${small ? 'w-4 h-4' : 'w-6 h-6'} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  </div>
);

export const ChatView: React.FC<ChatViewProps> = ({ chatState, onUpdate, onExit, userProfile, onDeductCredits }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages, isTyping]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;

    if (onDeductCredits) {
      const canAfford = await onDeductCredits(1, "Chat Message");
      if (!canAfford) return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    const newMessages = [...chatState.messages, userMsg];
    onUpdate({ ...chatState, messages: newMessages });

    if (!textOverride) setInput('');
    setIsTyping(true);

    try {
      const responseText = await generateChatResponse(newMessages, chatState.fileContext || "", userMsg.content, userProfile?.subscriptionTier);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      onUpdate({ ...chatState, messages: [...newMessages, botMsg] });
    } catch (error) {
      console.error("Chat Error", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "My connection to the archives was interrupted. Please try again.",
        timestamp: Date.now()
      };
      onUpdate({ ...chatState, messages: [...newMessages, errorMsg] });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleToggleSave = (msgId: string) => {
    const newMessages = chatState.messages.map(msg =>
      msg.id === msgId ? { ...msg, isSaved: !msg.isSaved } : msg
    );
    onUpdate({ ...chatState, messages: newMessages });
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleCameraCapture = (base64: string) => {
    setShowCamera(false);
    const msg = `[IMAGE_DATA:${base64}] \n\nPlease analyze this image I just captured.`;
    handleSend(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = chatState.messages.length > 0;
  const hasContext = chatState.fileContext && chatState.fileContext.trim().length > 0;
  const placeholder = hasContext ? "Ask about the document..." : "Ask anything…";

  // --- RENDER ---
  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-3xl mx-auto relative glass-container overflow-hidden shadow-2xl">
      {/* Glass Layers */}
      <div className="glass-filter" />
      <div className="glass-overlay" />
      <div className="glass-specular" />

      {/* Content */}
      <div className="glass-content flex flex-col h-full p-0">
        {showCamera && (
          <CameraScanner
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
            mode="SOLVE"
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0a0a0c]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <AIIcon small />
            <div>
              <h2 className="font-bold text-white text-sm uppercase tracking-wider">The Professor</h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-400 font-mono uppercase">Online</span>
              </div>
            </div>
          </div>
          <button onClick={onExit} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* --- WELCOME VIEW --- */}
        {!hasMessages ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full flex items-center justify-center mb-4 mx-auto border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Ask The Professor</h1>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                {hasContext ? `I've analyzed your document. Ask me anything about it.` : `I'm ready to help with any subject. What would you like to learn?`}
              </p>
            </div>

            {/* Suggestions */}
            <div className="w-full max-w-md space-y-3 mb-6">
              {(hasContext ? INITIAL_SUGGESTIONS : ["Explain a complex topic simply", "Help me study for an exam", "Create a study plan for me"]).map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full p-4 text-left bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-amber-500/30 transition-all text-sm text-gray-200 font-medium group"
                >
                  <span className="group-hover:text-amber-400 transition-colors">{suggestion}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="w-full max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white outline-none focus:border-amber-500/50 transition-colors placeholder-gray-500"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* --- CONVERSATION VIEW --- */
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={chatScrollerRef}>
              {chatState.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-3'}`}>
                  {msg.role === 'model' && <AIIcon small />}
                  <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'}`}>
                    <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {/* Timestamp */}
                    <div className="mt-2 flex items-center justify-end gap-2 opacity-50">
                      <span className="text-[9px] font-mono uppercase tracking-widest">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'model' && (
                        <button onClick={() => handleToggleSave(msg.id)} className={`${msg.isSaved ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill={msg.isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start gap-3">
                  <AIIcon small />
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                    <Loader />
                    <span className="text-xs text-gray-400 font-mono uppercase">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area with Follow-up Suggestions */}
            <div className="p-4 bg-[#0a0a0c] border-t border-white/10">
              {/* Follow-up Chips */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                {FOLLOWUP_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    disabled={isTyping}
                    className="flex-shrink-0 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 transition-all disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Main Input */}
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 focus-within:border-amber-500/50 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  rows={1}
                  disabled={isTyping}
                  className="flex-1 bg-transparent text-white outline-none text-sm font-medium px-2 py-1 placeholder-gray-500 resize-none"
                />

                <button
                  onClick={() => setShowCamera(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                  title="Camera Scan"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                </button>

                <button
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'}`}
                >
                  {isListening ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
                  )}
                </button>

                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatView;

