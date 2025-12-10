
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatState } from '../types';
import { generateChatResponse } from '../services/geminiService';

interface ChatViewProps {
  chatState: ChatState;
  onUpdate: (state: ChatState) => void;
  onExit: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ chatState, onUpdate, onExit }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Greeting if empty
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

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const newMessages = [...chatState.messages, userMsg];
    onUpdate({ ...chatState, messages: newMessages });
    
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await generateChatResponse(newMessages, chatState.fileContext, userMsg.content);
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

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col p-4 relative z-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg shadow-amber-900/20">
             <span className="text-xl">🎓</span>
          </div>
          <div>
            <h2 className="text-white font-serif font-bold">Socratic Dialogue</h2>
            <p className="text-xs text-amber-500/80 font-mono uppercase tracking-wider">
               Context: {chatState.fileName || 'Uploaded Notes'}
            </p>
          </div>
        </div>
        <button 
          onClick={onExit} 
          className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/5 hover:bg-white/10"
        >
          End Session
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-panel rounded-3xl mb-4 overflow-hidden flex flex-col relative border-amber-500/10">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
           {chatState.messages.map((msg) => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 shadow-lg leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                }`}>
                  {msg.content}
                </div>
             </div>
           ))}
           {isTyping && (
             <div className="flex justify-start animate-fade-in">
               <div className="bg-white/5 rounded-2xl p-5 rounded-tl-none flex gap-1.5 items-center border border-white/5">
                 <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[bounce_1s_infinite]"></div>
                 <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                 <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[bounce_1s_infinite_0.4s]"></div>
               </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="glass-panel p-2 rounded-2xl flex items-center gap-2 border-amber-500/20">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about your notes..."
          className="flex-1 bg-transparent border-none outline-none text-white px-4 py-3 placeholder-gray-500"
          autoFocus
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="p-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl text-white hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </button>
      </div>
    </div>
  );
};
