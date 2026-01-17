
import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onSelect, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    // Filter out raw text inputs or non-processed items if any
    const validModes = ['EXAM', 'PROFESSOR', 'CHAT', 'FLASHCARDS'];
    
    return history
        .filter(item => validModes.includes(item.mode) && item.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => b.timestamp - a.timestamp);
  }, [history, searchTerm]);

  return (
    <div className={`fixed inset-0 z-[120] pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      
      {/* Glassmorphism Panel */}
      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-panel border-l border-border-main shadow-2xl transform transition-transform duration-300 flex flex-col backdrop-blur-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-border-main bg-white/5 flex justify-between items-center">
           <h2 className="text-xl font-bold text-text-pri font-display">Archives</h2>
           <button onClick={onClose} className="text-text-sec hover:text-text-pri transition-colors">✕</button>
        </div>
        
        <div className="p-4 border-b border-border-main">
            <input 
                type="text" 
                placeholder="Search history..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border border-border-main rounded-xl px-4 py-2 text-sm text-text-pri outline-none focus:border-accent transition-colors"
            />
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
           {filteredHistory.map(item => (
               <div key={item.id} className="group relative">
                   <div onClick={() => onSelect(item)} className="p-4 rounded-xl border border-border-main bg-white/5 hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer transition-all hover:border-accent/30">
                       <div className="flex justify-between mb-1">
                           <h4 className="font-bold text-text-pri text-sm truncate pr-4">{item.title}</h4>
                           <span className="text-[10px] text-text-sec shrink-0">{new Date(item.timestamp).toLocaleDateString()}</span>
                       </div>
                       <div className="flex justify-between items-center mt-2">
                           <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-white/5 ${
                               item.mode === 'EXAM' ? 'bg-blue-900/20 text-blue-400' : 
                               item.mode === 'PROFESSOR' ? 'bg-amber-900/20 text-amber-400' :
                               item.mode === 'CHAT' ? 'bg-green-900/20 text-green-400' : 'bg-pink-900/20 text-pink-400'
                           }`}>
                               {item.mode}
                           </span>
                       </div>
                   </div>
                   
                   <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
               </div>
           ))}
           
           {filteredHistory.length === 0 && (
               <div className="text-center text-text-sec py-10">
                   <p className="text-sm">No records found.</p>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
