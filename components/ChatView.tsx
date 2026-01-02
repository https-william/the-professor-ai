
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

      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
          console.error("Speech Recognition Error", event.error);
          setIsListening(false);
      };
      
      recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result) => result.transcript)
                .join('');
          setInput(transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
  };

  const speakText = (text: string) => {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      window.speechSynthesis.speak(utterance);
  };

  const formatTime = (ts: number) => {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = (content: string) => {
      // Security: Sanitize before render
      const sanitized = DOMPurify.sanitize(content);
      if (window.marked) {
          return { __html: window.marked.parse(sanitized) };
      }
      return { __html: sanitized };
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col relative z-10 animate-fade-in bg-core sm:bg-transparent rounded-3xl overflow-hidden border border-border-main">
      {showCamera && <CameraScanner onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} mode="SOLVE" />}
      
      {/* Header */}
      <div className="flex justify-between items-center bg-panel backdrop-blur-md p-4 border-b border-border-main shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg shadow-amber-900/20">
             <span className="text-xl">🎓</span>
          </div>
          <div>
            <h2 className="text-text-pri font-serif font-bold">The Professor</h2>
            <p className="text-xs text-accent/80 font-mono uppercase tracking-wider">
               Online | {chatState.fileName || 'General Session'}
            </p>
          </div>
        </div>
        <button 
          onClick={onExit} 
          className="text-xs font-bold uppercase tracking-widest text-text-sec hover:text-text-pri transition-colors bg-white/5 px-4 py-2 rounded-lg border border-border-main hover:bg-white/10"
        >
          End
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-black/20">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
           {chatState.messages.map((msg) => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                    onClick={() => handleToggleSave(msg.id)}
                    className={`max-w-[85%] rounded-2xl p-4 shadow-lg leading-relaxed group relative flex flex-col cursor-pointer transition-all ${
                        msg.isSaved 
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-l-4 border-l-accent text-white'
                        : msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none hover:bg-blue-700' 
                            : 'bg-panel text-text-pri rounded-tl-none border border-border-main hover:bg-[#202020]'
                    }`}
                >
                  {msg.image && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                          <img src={`data:image/jpeg;base64,${msg.image}`} alt="User Upload" className="max-h-48 object-cover" />
                      </div>
                  )}
                  
                  <div 
                    className="prose prose-invert prose-sm max-w-none break-words select-text"
                    dangerouslySetInnerHTML={renderContent(msg.content)}
                  />
                  
                  <div className={`text-[9px] mt-2 opacity-50 flex items-center gap-2 ${msg.role === 'user' ? 'text-blue-100 justify-end' : 'text-text-sec justify-start'}`}>
                      {msg.isSaved && <span className="text-accent font-bold uppercase tracking-widest mr-2">Saved</span>}
                      {formatTime(msg.timestamp)}
                  </div>

                  {msg.role === 'model' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); speakText(msg.content); }}
                        className="absolute -right-8 top-2 p-1 text-text-sec hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Read Aloud"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                      </button>
                  )}
                </div>
             </div>
           ))}
           {isTyping && (
             <div className="flex justify-start animate-fade-in">
               <div className="bg-panel rounded-2xl p-5 rounded-tl-none flex gap-1.5 items-center border border-border-main">
                 <div className="w-1.5 h-1.5 bg-accent rounded-full animate-[bounce_1s_infinite]"></div>
                 <div className="w-1.5 h-1.5 bg-accent rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-accent rounded-full animate-[bounce_1s_infinite_0.4s]"></div>
               </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-panel backdrop-blur-md p-4 flex items-center gap-2 border-t border-border-main shrink-0">
        <button onClick={() => setShowCamera(true)} className="p-3 text-text-sec hover:text-accent transition-colors hover:bg-white/5 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type or use voice..."
          className="flex-1 bg-white/5 rounded-xl border border-white/5 outline-none text-text-pri px-4 py-3 placeholder-gray-500 focus:border-accent/50 transition-colors"
          autoFocus
        />
        <button 
            onClick={handleVoiceInput}
            className={`p-3 rounded-xl transition-all ${isListening ? 'text-red-500 bg-red-900/20 animate-pulse' : 'text-text-sec hover:text-text-pri hover:bg-white/5'}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        </button>
        <button 
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="p-3 bg-amber-600 rounded-xl text-white hover:bg-amber-500 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-amber-900/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </button>
      </div>
    </div>
  );
};
