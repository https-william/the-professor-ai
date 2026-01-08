
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
  const [activeTab, setActiveTab] = useState<'ALL' | 'EXAM' | 'PROFESSOR' | 'CHAT' | 'DUEL'>('ALL');

  const filteredHistory = useMemo(() => {
    return history
      .filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'ALL' || item.mode === activeTab;
        return matchesSearch && matchesTab;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [history, searchTerm, activeTab]);

  const getIcon = (mode: string) => {
    switch(mode) {
      case 'EXAM': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
      case 'PROFESSOR': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
      case 'CHAT': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
      default: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
    }
  };

  const getSourceFromTitle = (fullTitle: string, mode: string) => {
      // Logic to split title if formatted like "Exam: Biology Notes"
      const parts = fullTitle.split(':');
      if (parts.length > 1) {
          return { action: mode, source: parts.slice(1).join(':').trim() };
      }
      return { action: mode, source: fullTitle };
  };

  return (
    <div className={`fixed inset-0 z-[120] overflow-hidden pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#18181b] border-l border-white/10 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-[#121214]">
           <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                   My Library
               </h2>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">✕</button>
           </div>
           
           <input 
             type="text" 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             placeholder="Search documents..."
             className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-4 py-3 text-sm text-white focus:border-blue-500 outline-none placeholder-gray-600 transition-colors mb-4"
           />

           <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
               {['ALL', 'EXAM', 'PROFESSOR', 'CHAT'].map((tab) => (
                   <button 
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                         activeTab === tab 
                         ? 'bg-white text-black' 
                         : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                     }`}
                   >
                       {tab}
                   </button>
               ))}
           </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[#0a0a0a]">
           {filteredHistory.map((item) => {
               const { action, source } = getSourceFromTitle(item.title, item.mode);
               return (
                   <div 
                     key={item.id} 
                     className="group p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-all cursor-pointer relative"
                     onClick={() => onSelect(item)}
                   >
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                            item.mode === 'EXAM' ? 'border-blue-500/30 text-blue-500 bg-blue-900/10' :
                            item.mode === 'PROFESSOR' ? 'border-amber-500/30 text-amber-500 bg-amber-900/10' :
                            'border-purple-500/30 text-purple-500 bg-purple-900/10'
                        }`}>
                            {getIcon(item.mode)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate uppercase tracking-wide">{action}</h4>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{source}</p>
                        </div>
                        <span className="text-[9px] text-gray-600 font-mono whitespace-nowrap">{new Date(item.timestamp).toLocaleDateString()}</span>
                     </div>
                     
                     <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="absolute right-2 top-2 p-1 text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                   </div>
               );
           })}
        </div>
      </div>
    </div>
  );
};
