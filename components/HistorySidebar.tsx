
import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { getHistorySnippet, clearCurrentSession } from '../services/storageService';

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
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesTab = activeTab === 'ALL' || item.mode === activeTab;
        return matchesSearch && matchesTab;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [history, searchTerm, activeTab]);

  // Group by Date
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {
      'Recent Uploads': [],
      'Earlier this Week': [],
      'The Archives': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastWeek = today - 86400000 * 7;

    filteredHistory.forEach(item => {
      if (item.timestamp >= today) groups['Recent Uploads'].push(item);
      else if (item.timestamp >= lastWeek) groups['Earlier this Week'].push(item);
      else groups['The Archives'].push(item);
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

  const handleClearAll = () => {
      if (confirm("WARNING: This will incinerate your entire library. Confirm?")) {
          // In a real app, we'd lift this state up, but for now we iterate deletes
          history.forEach(h => onDelete(h.id));
      }
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
               <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                   My Library
               </h2>
               <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">✕</button>
           </div>
           
           {/* Search */}
           <div className="relative mb-4">
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search documents..."
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
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               </div>
               <p className="text-sm font-medium">Library Empty</p>
               <p className="text-xs mt-1 opacity-60">Upload documents to populate.</p>
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
                            <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg border shadow-lg ${
                                item.mode === 'PROFESSOR' ? 'bg-amber-900/20 border-amber-500/20 text-amber-500' 
                                : item.mode === 'CHAT' ? 'bg-purple-900/20 border-purple-500/20 text-purple-500'
                                : 'bg-blue-900/20 border-blue-500/20 text-blue-500'
                            }`}>
                                {getIcon(item.mode)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-bold text-gray-100 truncate pr-4">{item.title}</h4>
                                    <span className="text-[9px] text-gray-500 font-mono whitespace-nowrap">
                                        {new Date(item.timestamp).toLocaleDateString([], {month: 'short', day:'numeric'})}
                                    </span>
                                </div>
                                
                                {item.summary && (
                                    <div className="bg-black/30 rounded px-2 py-1 mb-1 border border-white/5 inline-block">
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide truncate max-w-[150px]">
                                            {item.summary}
                                        </p>
                                    </div>
                                )}
                                
                                <p className="text-[10px] text-gray-600 mt-1 truncate font-mono opacity-80 flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${item.mode === 'EXAM' ? 'bg-blue-500' : item.mode === 'PROFESSOR' ? 'bg-amber-500' : 'bg-purple-500'}`}></span>
                                    {getHistorySnippet(item)}
                                </p>
                            </div>
                         </div>

                         <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                            className="absolute bottom-2 right-2 p-1.5 text-gray-600 hover:text-red-400 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
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

        {/* Footer */}
        {history.length > 0 && (
            <div className="p-4 border-t border-white/10 bg-[#121214]">
                <button 
                    onClick={handleClearAll}
                    className="w-full py-3 bg-red-900/10 border border-red-500/20 text-red-500 hover:bg-red-900/20 rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
                >
                    Incinerate All Data
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
