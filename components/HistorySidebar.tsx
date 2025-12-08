import React from 'react';
import { HistoryItem, AppMode } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onSelect, onDelete }) => {
  return (
    <div className={`fixed inset-0 z-50 overflow-hidden pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      <div className={`absolute right-0 top-0 bottom-0 w-80 bg-[#18181b] border-l border-gray-800 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
           <h2 className="text-xl font-bold text-gray-200">Library</h2>
           <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
           {history.length === 0 ? (
             <div className="text-center text-gray-500 mt-10">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
               </svg>
               <p>No study history yet.</p>
             </div>
           ) : (
             history.map((item) => (
               <div 
                 key={item.id} 
                 className={`group p-4 rounded-xl border transition-all cursor-pointer relative hover-lift ${
                   item.mode === 'PROFESSOR' 
                     ? 'bg-amber-900/10 border-amber-900/30 hover:border-amber-500/50' 
                     : 'bg-blue-900/10 border-blue-900/30 hover:border-blue-500/50'
                 }`}
                 onClick={() => onSelect(item)}
               >
                 <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                       item.mode === 'PROFESSOR' ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-900/40 text-blue-400'
                    }`}>
                      {item.mode === 'PROFESSOR' ? 'Class' : 'Exam'}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                 </div>
                 <h3 className="font-medium text-gray-200 line-clamp-1 mb-1">{item.title}</h3>
                 <div className="text-xs text-gray-500 flex justify-between">
                   <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                   {item.config && <span>{item.config.difficulty}</span>}
                 </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};