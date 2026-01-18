
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, HistoryItem, QuizState } from '../types';
import { queueAction } from '../services/syncService';
import { useAuth } from '../contexts/AuthContext';
import { loadHistory } from '../services/storageService';
import { useTheme } from '../contexts/ThemeContext';
import { uploadAvatar } from '../services/supabase';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClearHistory: () => void;
  onLogout: () => void;
  isAdmin?: boolean; 
  onRequestAdminAccess?: () => void;
  onUpgradeRequest?: () => void; 
  onLegalRequest?: () => void;
}

declare global {
    interface Window {
        jspdf: any;
    }
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, profile, onSave, onLogout, isAdmin, onRequestAdminAccess, onUpgradeRequest, onLegalRequest }) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setEditedProfile(profile);
      if (isOpen) {
          loadHistory().then(setHistory);
      }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
      onSave(editedProfile);
      if (user) {
          queueAction('UPDATE_PROFILE', { uid: user.uid, data: editedProfile });
      }
      onClose();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && user) {
          setIsUploading(true);
          try {
              const file = e.target.files[0];
              const publicUrl = await uploadAvatar(file, user.uid);
              if (publicUrl) {
                  const updated = { ...editedProfile, photoURL: publicUrl };
                  setEditedProfile(updated);
                  onSave(updated);
              } else {
                  alert("Upload failed. Try a smaller image.");
              }
          } catch(err) {
              console.error(err);
              alert("Error uploading image.");
          } finally {
              setIsUploading(false);
          }
      }
  };

  const calculateGrade = (score: number, total: number) => {
      const pct = (score / total) * 100;
      if (pct >= 90) return { letter: 'A', gpa: 4.0 };
      if (pct >= 80) return { letter: 'B', gpa: 3.0 };
      if (pct >= 70) return { letter: 'C', gpa: 2.0 };
      if (pct >= 60) return { letter: 'D', gpa: 1.0 };
      return { letter: 'F', gpa: 0.0 };
  };

  const generateTranscript = () => {
      if (!window.jspdf) {
          alert("PDF Generator is initializing. Please wait...");
          return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("OFFICIAL ACADEMIC TRANSCRIPT", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Student: ${editedProfile.alias || 'Unknown'}`, 20, 40);
      doc.text(`Institution: ${editedProfile.school || 'The Professor AI'}`, 20, 45);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 20, 50);
      
      doc.line(20, 55, 190, 55);

      const exams = history.filter(h => h.mode === 'EXAM' && (h.data as QuizState).isSubmitted);
      let totalGPA = 0;
      let totalExams = 0;

      const rows = exams.map(exam => {
          const data = exam.data as QuizState;
          const totalQ = data.questions.length;
          const score = data.score;
          const { letter, gpa } = calculateGrade(score, totalQ);
          
          totalGPA += gpa;
          totalExams++;

          return [
              new Date(exam.timestamp).toLocaleDateString(),
              exam.title.substring(0, 40),
              `${score}/${totalQ}`,
              letter,
              gpa.toFixed(1)
          ];
      });

      const finalGPA = totalExams > 0 ? (totalGPA / totalExams).toFixed(2) : "0.00";

      doc.autoTable({
          startY: 60,
          head: [['Date', 'Exam Title', 'Score', 'Grade', 'Points']],
          body: rows,
          theme: 'grid',
          headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
          styles: { fontSize: 9 }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Cumulative GPA: ${finalGPA}`, 20, finalY);
      doc.text(`Total Exams Completed: ${totalExams}`, 20, finalY + 7);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Certified by The Professor AI Neural Engine.", 105, 280, { align: "center" });

      doc.save(`Transcript_${editedProfile.alias}.pdf`);
  };

  const achievements = [
      { id: 'fresh_meat', name: "Fresh Meat", desc: "Complete your first exam.", progress: Math.min((profile.questionsAnswered || 0), 1), total: 1, icon: <div className="w-8 h-8 bg-gray-500 rounded-sm transform rotate-45"></div>, rarity: "Common", color: "bg-gray-800 border-gray-600" },
      { id: 'academic_weapon', name: "Academic Weapon", desc: "Reach 1,000 XP.", progress: Math.min((profile.xp || 0), 1000), total: 1000, icon: <div className="w-8 h-8 border-2 border-blue-500 rounded-full flex items-center justify-center"><div className="w-4 h-4 bg-blue-500 rounded-full"></div></div>, rarity: "Rare", color: "bg-blue-900/40 border-blue-500" },
      { id: 'no_life', name: "Touch Grass", desc: "7 Day Streak.", progress: Math.min((profile.streak || 0), 7), total: 7, icon: <div className="w-8 h-8 border-2 border-purple-500 transform rotate-12"></div>, rarity: "Epic", color: "bg-purple-900/40 border-purple-500" },
      { id: 'veteran', name: "Veteran", desc: "Answer 100 Questions.", progress: Math.min((profile.questionsAnswered || 0), 100), total: 100, icon: <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center"><div className="w-1 h-6 bg-black"></div><div className="w-6 h-1 bg-black absolute"></div></div>, rarity: "Rare", color: "bg-indigo-900/40 border-indigo-500" },
      { id: 'einstein', name: "Einstein", desc: "Reach 5,000 XP.", progress: Math.min((profile.xp || 0), 5000), total: 5000, icon: <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full shadow-[0_0_15px_orange]"></div>, rarity: "Legendary", color: "bg-amber-900/40 border-amber-500" },
      { id: 'sharpshooter', name: "Sharpshooter", desc: "Get 50 Correct Answers.", progress: Math.min((profile.correctAnswers || 0), 50), total: 50, icon: <div className="w-8 h-8 border-2 border-red-500 rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-red-500 rounded-full"></div></div>, rarity: "Epic", color: "bg-red-900/40 border-red-500" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-panel w-full max-w-3xl rounded-[2rem] border border-border-main shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-text-pri">
        
        {/* Header - Dossier Style */}
        <div className="p-6 border-b border-border-main bg-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/20 text-blue-500 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
              </div>
              <div>
                  <h3 className="font-bold text-lg tracking-tight font-serif">Student Dossier</h3>
                  <p className="text-[10px] text-text-sec font-mono uppercase tracking-widest">ID: {editedProfile.alias || 'UNKNOWN'}</p>
              </div>
          </div>
          <button onClick={onClose} className="text-text-sec hover:text-text-pri transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar">
            
            {/* Identity Block */}
            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/10 border border-border-main shrink-0 cursor-pointer overflow-hidden relative group`}
                 style={{ 
                     background: editedProfile.photoURL ? `url(${editedProfile.photoURL}) center/cover` : `linear-gradient(to bottom right, #3b82f6, #06b6d4)` 
                 }}
               >
                   {!editedProfile.photoURL && (
                       <div className="w-16 h-16 bg-white/20 rotate-45 transform skew-x-12 rounded-xl backdrop-blur-sm border border-white/40"></div>
                   )}
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       {isUploading ? (
                           <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       ) : (
                           <span className="text-xs text-white font-bold uppercase">Change</span>
                       )}
                   </div>
               </div>
               <input ref={fileInputRef} type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />

               <div className="text-center sm:text-left flex-1 w-full">
                   <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
                       <h2 className="text-3xl font-bold font-serif">{editedProfile.alias || 'Anonymous'}</h2>
                       <div className="flex gap-2 items-center">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${editedProfile.subscriptionTier === 'Excellentia' ? 'bg-amber-900/20 text-amber-500 border-amber-500/20' : 'bg-blue-900/20 text-blue-400 border-blue-500/20'}`}>
                               {editedProfile.subscriptionTier}
                           </span>
                           {/* Add Upgrade Button Here */}
                           {editedProfile.subscriptionTier === 'Fresher' && onUpgradeRequest && (
                               <button 
                                onClick={onUpgradeRequest}
                                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-amber-600 to-orange-600 text-white animate-pulse shadow-lg hover:scale-105 transition-transform"
                               >
                                   Upgrade Plan
                               </button>
                           )}
                       </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mt-6">
                       <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border-main">
                           <span className="text-[10px] text-text-sec uppercase font-bold block mb-1">XP Level</span>
                           <span className="text-xl font-mono">{Math.floor((profile.xp || 0)/100)}</span>
                           <span className="text-[10px] text-text-sec block mt-1">{(profile.xp || 0)} Total XP</span>
                       </div>
                       <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border-main">
                           <span className="text-[10px] text-text-sec uppercase font-bold block mb-1">Streak</span>
                           <span className="text-xl text-amber-500 font-mono">{profile.streak} Days</span>
                           <span className="text-[10px] text-text-sec block mt-1">Keep it up</span>
                       </div>
                   </div>
                   
                   <button 
                     onClick={generateTranscript}
                     className="mt-6 w-full py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-pri rounded-lg text-xs font-bold uppercase tracking-widest border border-border-main flex items-center justify-center gap-2"
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       Download Official Transcript
                   </button>
               </div>
            </div>

            {/* Achievements */}
            <div>
                <h4 className="text-xs font-bold text-text-sec uppercase tracking-widest mb-4 border-b border-border-main pb-2">Service Records</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {achievements.map(ach => {
                        const isUnlocked = ach.progress >= ach.total;
                        const percent = (ach.progress / ach.total) * 100;
                        
                        return (
                            <div key={ach.id} className={`relative p-4 rounded-xl border transition-all duration-300 group overflow-hidden ${isUnlocked ? `${ach.color} bg-opacity-20` : 'bg-black/10 dark:bg-black/40 border-border-main opacity-70 grayscale'}`}>
                                <div className="relative z-10 flex flex-col items-center text-center h-full">
                                    <div className={`text-4xl mb-3 transform transition-transform group-hover:scale-110 drop-shadow-md`}>
                                        {ach.icon}
                                    </div>
                                    <h5 className={`font-bold text-xs uppercase tracking-wider mb-1 ${isUnlocked ? 'text-text-pri' : 'text-text-sec'}`}>
                                        {ach.name}
                                    </h5>
                                    <p className="text-[10px] text-text-sec leading-tight mb-3">
                                        {ach.desc}
                                    </p>
                                    
                                    <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden border border-border-main mt-auto">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${isUnlocked ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[8px] font-mono text-gray-500 mt-1">{ach.progress} / {ach.total}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Support & Legal */}
            <div className="grid grid-cols-2 gap-4 border-t border-border-main pt-6">
                <a 
                    href="mailto:vexis.automations@gmail.com?subject=The%20Professor%20Support%20Request" 
                    className="flex flex-col items-center justify-center p-4 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 transition-colors border border-border-main group"
                >
                    <span className="text-xl mb-2 group-hover:scale-110 transition-transform text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    </span>
                    <span className="text-xs font-bold text-text-pri uppercase">Contact Support</span>
                </a>
                <button 
                    onClick={onLegalRequest}
                    className="flex flex-col items-center justify-center p-4 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 transition-colors border border-border-main group"
                >
                    <span className="text-xl mb-2 group-hover:scale-110 transition-transform text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499.106 1.028.589 1.202.64.232 1.337.352 2.031.352.694 0 1.391-.12 2.031-.352.483-.174.711-.703.59-1.202L5.25 4.971Z" /></svg>
                    </span>
                    <span className="text-xs font-bold text-text-pri uppercase">Legal & Privacy</span>
                </button>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-border-main">
                <button onClick={onLogout} className="w-full py-4 bg-red-900/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-900/20 transition-all">
                    Terminals Logout
                </button>
            </div>
        </div>

        <div className="p-6 border-t border-border-main bg-black/5 dark:bg-white/5 flex justify-between items-center shrink-0">
           <button 
             onClick={onRequestAdminAccess}
             className="text-[7px] font-bold uppercase tracking-widest text-text-sec hover:text-red-900 transition-colors"
           >
             Authorized Personnel Login
           </button>
           
           <button onClick={handleSave} className="px-8 py-3 bg-text-pri text-core rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-colors shadow-lg">Save Updates</button>
        </div>
      </div>
    </div>
  );
};
