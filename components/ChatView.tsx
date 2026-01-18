
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatState, UserProfile } from '../types';
import { generateChatResponse } from '../services/geminiService';
import { CameraScanner } from './CameraScanner';
import DOMPurify from 'dompurify';

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

export const ChatView: React.FC<ChatViewProps> = ({ chatState, onUpdate, onExit, userProfile, onDeductCredits }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatState.messages.length === 0) {
      const hasContext = chatState.fileContext && chatState.fileContext.trim().length > 0;
      const fileName = chatState.fileName || 'your document';
      
      let introText = "";
      if (hasContext) {
          introText = `I have analyzed ${fileName}. I am ready to answer any questions, verify your understanding, or debate the concepts within.`;
      } else {
          introText = "I am The Professor. I am ready to assist you with any academic subject, generate study plans, or explain complex topics. What are we studying today?";
      }

      const initMsg: ChatMessage = {
          id: 'init',
          role: 'model',
          content: introText,
          timestamp: Date.now()
      };
      onUpdate({ ...chatState, messages: [initMsg] });
    }
  }, []);

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
      const responseText = await generateChatResponse(newMessages, chatState.fileContext || "", userMsg.content);
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

      recognition.onend = () => {
          setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
  };

  const handleCameraCapture = (base64: string) => {
      setShowCamera(false);
      const msg = `[IMAGE_DATA:${base64}] \n\nPlease analyze this image I just captured.`;
      handleSend(msg);
  };

  const renderMarkdown = (text: string) => {
      let processed = text;
      if (text.includes('[IMAGE_DATA:')) {
          processed = text.replace(/\[IMAGE_DATA:(.*?)\]/g, '<img src="data:image/jpeg;base64,$1" class="max-w-full rounded-lg border border-white/20 my-2 shadow-lg" alt="Captured Content" />');
      }
      
      const sanitized = DOMPurify.sanitize(processed, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'class', 'alt'] });
      
      if (window.marked) {
          return { __html: window.marked.parse(sanitized) };
      }
      return { __html: sanitized };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto relative">
      
      {showCamera && (
          <CameraScanner 
            onCapture={handleCameraCapture} 
            onClose={() => setShowCamera(false)} 
            mode="SOLVE" 
          />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-main bg-panel backdrop-blur-sm z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-900/20 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div>
                  <h2 className="font-bold text-text-pri text-sm uppercase tracking-wider">{chatState.fileName || 'Session'}</h2>
                  <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] text-text-sec font-mono uppercase">Online</span>
                  </div>
              </div>
          </div>
          <button onClick={onExit} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-text-sec hover:text-text-pri transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
          {chatState.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 relative group ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-panel border border-border-main text-text-pri rounded-tl-sm shadow-sm'}`}>
                      <div className="prose prose-invert prose-sm max-w-none leading-relaxed" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                      
                      {/* Timestamp Footer */}
                      <div className="mt-2 flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] text-text-sec font-mono uppercase tracking-widest">
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {msg.role === 'model' && (
                              <button onClick={() => handleToggleSave(msg.id)} className={`ml-2 ${msg.isSaved ? 'text-amber-500' : 'text-gray-500 hover:text-text-pri'}`}>
                                  {msg.isSaved ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                                  ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                  )}
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          ))}
          
          {isTyping && (
              <div className="flex justify-start">
                  <div className="bg-panel border border-border-main rounded-2xl rounded-tl-sm p-4 flex items-center gap-1">
                      <span className="w-2 h-2 bg-text-sec rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-text-sec rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      <span className="w-2 h-2 bg-text-sec rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-panel backdrop-blur-md border-t border-border-main rounded-b-3xl">
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-2 rounded-2xl border border-border-main focus-within:border-amber-500/50 transition-colors shadow-lg">
              <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={chatState.fileContext ? "Ask about the document..." : "Ask the Professor anything..."}
                  className="flex-1 bg-transparent text-text-pri outline-none text-sm font-medium px-2 py-1 placeholder-text-sec"
              />

              <button
                onClick={() => setShowCamera(true)}
                className="p-2.5 rounded-xl transition-all text-text-sec hover:text-text-pri bg-white/5 hover:bg-white/10"
                title="Camera Scan"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
              </button>

              <button 
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-text-sec hover:text-text-pri bg-white/5 hover:bg-white/10'}`}
              >
                  {isListening ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
                  )}
              </button>

              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="p-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-1"
              >
                  <span className="text-[10px] font-bold">1</span>
                  {/* Small Diamond Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
          </div>
      </div>
    </div>
  );
};
