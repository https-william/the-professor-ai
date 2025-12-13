import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { getHistorySnippet } from '../services/storageService';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onSelect, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'EXAM' | 'PROFESSOR' | 'CHAT'>('ALL');

  // Filter and Sort Logic
  const filteredHistory = useMemo(() => {
    return history
      .filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'ALL' || item.mode === activeTab;
        return matchesSearch && matchesTab;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [history, searchTerm, activeTab]);

  // Group by Date
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 86400000 * 7;

    filteredHistory.forEach(item => {
      if (item.timestamp >= today) groups['Today'].push(item);
      else if (item.timestamp >= yesterday) groups['Yesterday'].push(item);
      else if (item.timestamp >= lastWeek) groups['Previous 7 Days'].push(item);
      else groups['Older'].push(item);
    });

    return groups;
  }, [filteredHistory]);

  const getIcon = (mode: string) => {
    switch(mode) {
      case 'EXAM': return '📝';
      case 'PROFESSOR': return '👨‍🏫';
      case 'CHAT': return '💬';
      case 'DUEL': return '⚔️';
      default: return '📄';
    }
  };

  const getModeLabel = (mode: string) => {
      if (mode === 'PROFESSOR') return 'Class';
      if (mode === 'CHAT') return 'Chat';
      if (mode === 'EXAM') return 'Exam';
      return 'Session';
  };

  return (
    <div className={`fixed inset-0 z-[120] overflow-hidden pointer-events-none ${isOpen ? 'pointer-events-auto' : ''}`}>
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      <div className={`absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-[#18181b] border-l border-white/10 shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#121214]">
           <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-white tracking-tight">Library</h2>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">✕</button>
           </div>
           
           {/* Search */}
           <div className="relative mb-4">
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search archives..."
                 className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none placeholder-gray-600 transition-colors"
               />
               <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>

           {/* Tabs */}
           <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
               {['ALL', 'EXAM', 'PROFESSOR', 'CHAT'].map((tab) => (
                   <button 
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                         activeTab === tab 
                         ? 'bg-blue-600 text-white' 
                         : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                     }`}
                   >
                       {tab}
                   </button>
               ))}
           </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[#0a0a0a]">
           {history.length === 0 ? (
             <div className="text-center text-gray-600 mt-20 flex flex-col items-center">
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               </div>
               <p className="text-sm font-medium">Archives Empty</p>
               <p className="text-xs mt-1 opacity-60">Start a session to populate history.</p>
             </div>
           ) : (
             Object.entries(groupedHistory).map(([label, items]) => (
               (items as HistoryItem[]).length > 0 && (
                 <div key={label}>
                   <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-2 sticky top-0 bg-[#0a0a0a] z-10 py-1">{label}</h3>
                   <div className="space-y-2">
                     {(items as HistoryItem[]).map((item) => (
                       <div 
                         key={item.id} 
                         className={`group p-3 rounded-xl border transition-all cursor-pointer relative hover:bg-white/5 ${
                           item.mode === 'PROFESSOR' ? 'border-amber-900/30 bg-amber-900/5' 
                           : item.mode === 'CHAT' ? 'border-purple-900/30 bg-purple-900/5'
                           : 'border-blue-900/30 bg-blue-900/5'
                         }`}
                         onClick={() => onSelect(item)}
                       >
                         <div className="flex items-start gap-3">
                            <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm border ${
                                item.mode === 'PROFESSOR' ? 'bg-amber-900/20 border-amber-500/20 text-amber-500' 
                                : item.mode === 'CHAT' ? 'bg-purple-900/20 border-purple-500/20 text-purple-500'
                                : 'bg-blue-900/20 border-blue-500/20 text-blue-500'
                            }`}>
                                {getIcon(item.mode)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-medium text-gray-200 truncate pr-4">{item.title}</h4>
                                    <span className="text-[9px] text-gray-600 font-mono whitespace-nowrap mt-0.5">
                                        {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                
                                <p className="text-xs text-gray-500 mt-1 truncate font-mono opacity-80">
                                    {getHistorySnippet(item)}
                                </p>
                            </div>
                         </div>

                         <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                            className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-400 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                       </div>
                     ))}
                   </div>
                 </div>
               )
             ))
           )}
        </div>
      </div>
    </div>
  );
};