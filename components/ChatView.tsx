
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatState } from '../types';
import { generateChatResponse } from '../services/geminiService';
import { CameraScanner } from './CameraScanner';
import DOMPurify from 'dompurify';

interface ChatViewProps {
  chatState: ChatState;
  onUpdate: (state: ChatState) => void;
  onExit: () => void;
}

declare global {
  interface Window {
    marked: any;
    webkitSpeechRecognition: any;
  }
}

export const ChatView: React.FC<ChatViewProps> = ({ chatState, onUpdate, onExit }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatState.messages.length === 0) {
      const initMsg: ChatMessage = {
          id: 'init',
          role: 'model',
          content: `I have analyzed ${chatState.fileName || 'your document'}. I am ready to answer any questions, verify your understanding, or debate the concepts within. What is on your mind?`,
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

  const handleSend = async (textOverride?: string, imageBase64?: string) => {
    const textToSend = textOverride || input;
    if ((!textToSend.trim() && !imageBase64) || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      image: imageBase64
    };

    const newMessages = [...chatState.messages, userMsg];
    onUpdate({ ...chatState, messages: newMessages });
    
    setInput('');
    setIsTyping(true);

    try {
      let contextWithImage = chatState.fileContext;
      if (imageBase64) {
          contextWithImage += `\n[IMAGE_DATA:${imageBase64}]`;
      }

      const responseText = await generateChatResponse(newMessages, contextWithImage, userMsg.content);
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

  const handleCameraCapture = (base64: string) => {
      setShowCamera(false);
      handleSend("Analyze this visual data.", base64);
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

  const renderMarkdown = (text: string) => {
      const sanitized = DOMPurify.sanitize(text);
      if (window.marked) {
          return { __html: window.marked.parse(sanitized) };
      }
      return { __html: sanitized };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto relative">
      {showCamera && <CameraScanner onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} mode="SOLVE" />}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40 backdrop-blur-sm z-10 rounded-t-3xl">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-900/20 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div>
                  <h2 className="font-bold text-white text-sm uppercase tracking-wider">{chatState.fileName || 'Session'}</h2>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
          {chatState.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 relative group ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-[#1a1a1a] border border-white/10 text-gray-200 rounded-tl-sm'}`}>
                      {msg.image && (
                          <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                              <img src={`data:image/jpeg;base64,${msg.image}`} alt="Visual Context" className="w-full h-auto" />
                          </div>
                      )}
                      
                      <div className="prose prose-invert prose-sm max-w-none leading-relaxed" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                      
                      <div className="mt-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          {msg.role === 'model' && (
                              <button onClick={() => handleToggleSave(msg.id)} className={`ml-2 ${msg.isSaved ? 'text-amber-500' : 'text-gray-600 hover:text-gray-400'}`}>
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
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/60 backdrop-blur-md border-t border-white/5 rounded-b-3xl">
          <div className="flex items-center gap-2 bg-[#1a1a1a] p-2 rounded-2xl border border-white/10 focus-within:border-amber-500/50 transition-colors shadow-lg">
              <button 
                onClick={() => setShowCamera(true)}
                className="p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                title="Upload Visuals"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              
              <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 bg-transparent text-white outline-none text-sm font-medium px-2 py-1 placeholder-gray-600"
              />

              <button 
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'}`}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>

              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="p-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
          </div>
      </div>
    </div>
  );
};
