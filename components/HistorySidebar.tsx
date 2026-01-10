
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
    return history.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => b.timestamp - a.timestamp);
  }, [history, searchTerm]);

  return (
    <div className={`fixed inset-0 z-[120] pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#18181b] border-l border-white/10 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 bg-[#121214] flex justify-between items-center">
           <h2 className="text-xl font-bold text-white">Archives</h2>
           <button onClick={onClose} className="text-gray-400">✕</button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
           {filteredHistory.map(item => (
               <div key={item.id} onClick={() => onSelect(item)} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                   <div className="flex justify-between mb-1">
                       <h4 className="font-bold text-white text-sm">{item.title}</h4>
                       <span className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                   </div>
                   <p className="text-xs text-gray-400 uppercase tracking-wide">
                       {item.mode === 'EXAM' ? 'Completed Exam' : item.mode === 'PROFESSOR' ? 'Lecture Notes' : 'Chat Session'}
                   </p>
               </div>
           ))}
        </div>
      </div>
    </div>
  );
};
