
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
            } catch (err) {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm" onClick={onClose} />

            {/* PROFILE CONTAINER */}
            <div className="relative glass-panel-heavy w-full max-w-4xl rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[85vh] animate-scale-in bg-[#0A0A0C]/90 backdrop-blur-xl">

                {/* HEADER */}
                <div className="h-16 border-b border-white/5 bg-white/[0.02] flex justify-between items-center px-6 shrink-0 relative">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/80">
                            <span className="text-xl">🎓</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white font-sans tracking-tight">Student Profile</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                <p className="text-xs text-emerald-400/80 font-medium">Academic Level {Math.floor((profile.xp || 0) / 1000) + 1}</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* CONTENT SCROLL AREA */}
                <div className="overflow-y-auto p-8 custom-scrollbar">

                    {/* TOP SECTION: ID CARD */}
                    <div className="flex flex-col md:flex-row gap-8 mb-10">

                        {/* AVATAR */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 rounded-full relative group cursor-pointer border-4 border-white/5 shadow-xl overflow-hidden shrink-0"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 z-0"></div>
                            {editedProfile.photoURL ? (
                                <img src={editedProfile.photoURL} alt="Avatar" className="w-full h-full object-cover relative z-10" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5 z-10 relative">
                                    <span className="text-4xl">{editedProfile.avatarEmoji || '👤'}</span>
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-[2px]">
                                {isUploading ? <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div> : <span className="text-xs font-medium text-white">Change Photo</span>}
                            </div>
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />

                        {/* DETAILS */}
                        <div className="flex-1 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2 font-display">{editedProfile.alias || 'Anonymous Scholar'}</h2>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-gray-300">
                                            Role: Student
                                        </span>
                                        <span className={`px-3 py-1 rounded-full border text-xs font-medium ${editedProfile.subscriptionTier === 'Excellentia' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                            Plan: {editedProfile.subscriptionTier}
                                        </span>
                                    </div>
                                </div>

                                {editedProfile.subscriptionTier === 'Fresher' && onUpgradeRequest && (
                                    <button onClick={onUpgradeRequest} className="px-5 py-2 bg-white text-black rounded-full text-xs font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-white/20">
                                        Unlock Premium
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total XP</p>
                                    <p className="text-xl text-white font-medium">{profile.xp || 0}</p>
                                </div>
                                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Streak</p>
                                    <p className="text-xl text-amber-400 font-medium">{profile.streak || 0} Days</p>
                                </div>
                                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Accuracy</p>
                                    <p className="text-xl text-emerald-400 font-medium">
                                        {profile.questionsAnswered ? Math.round(((profile.correctAnswers || 0) / profile.questionsAnswered) * 100) : 0}%
                                    </p>
                                </div>
                                <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Student ID</p>
                                    <p className="text-xl text-gray-400 font-medium">#{Math.floor(Math.random() * 9000) + 1000}</p>
                                </div>
                            </div>

                            <button
                                onClick={generateTranscript}
                                className="w-full py-3 border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] text-gray-300 hover:text-white rounded-xl flex items-center justify-center gap-2 transition-all group"
                            >
                                <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
                                <span className="text-xs font-medium">Download Academic Transcript</span>
                            </button>
                        </div>
                    </div>

                    {/* ACHIEVEMENTS GRID */}
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <h4 className="text-sm font-medium text-white/50 uppercase tracking-wide">Achievements</h4>
                            <div className="h-px bg-white/5 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {achievements.map(ach => {
                                const isUnlocked = ach.progress >= ach.total;
                                const percent = Math.min((ach.progress / ach.total) * 100, 100);

                                return (
                                    <div key={ach.id} className={`relative p-5 rounded border transition-all duration-300 overflow-hidden group ${isUnlocked ? 'bg-white/[0.03] border-white/10' : 'bg-transparent border-white/5 opacity-60 grayscale'}`}>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className={`p-2 rounded ${isUnlocked ? 'bg-white/5' : 'bg-white/5'}`}>
                                                {/* Simplified Icons matching text-size for better scaling */}
                                                <div className="text-xl">{ach.id === 'fresh_meat' ? '🥩' : ach.id === 'academic_weapon' ? '⚔️' : ach.id === 'no_life' ? '🌱' : ach.id === 'veteran' ? '🎖️' : ach.id === 'einstein' ? '🧠' : '🎯'}</div>
                                            </div>
                                            <span className={`text-[9px] uppercase tracking-widest py-1 px-2 rounded font-bold border ${isUnlocked ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-gray-600 border-gray-800'}`}>
                                                {isUnlocked ? 'Active' : 'Locked'}
                                            </span>
                                        </div>

                                        <h4 className="text-sm font-bold text-white mb-1 relative z-10">{ach.name}</h4>
                                        <p className="text-[10px] text-gray-500 font-mono mb-4 relative z-10 min-h-[2.5em]">{ach.desc}</p>

                                        <div className="relative z-10">
                                            <div className="flex justify-between text-[8px] text-gray-600 font-mono mb-1 uppercase">
                                                <span>Progress</span>
                                                <span>{Math.floor(percent)}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-1000 ${isUnlocked ? 'bg-emerald-500' : 'bg-gray-600'}`} style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>

                                        {/* Background glow for unlocked */}
                                        {isUnlocked && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* DANGER ZONE / FOOTER */}
                    <div className="mt-12 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                        <button onClick={onLegalRequest} className="p-4 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] rounded flex items-center justify-center gap-2 group transition-all">
                            <span className="text-gray-500 group-hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">Legal Protocols</span>
                        </button>
                        <button onClick={onLogout} className="p-4 border border-red-900/20 bg-red-900/5 hover:bg-red-900/10 rounded flex items-center justify-center gap-2 group transition-all">
                            <span className="text-red-500/70 group-hover:text-red-400 transition-colors text-[10px] font-bold uppercase tracking-widest">Terminate Session</span>
                        </button>
                    </div>

                </div>

                {/* FOOTER BAR */}
                <div className="h-14 border-t border-white/5 bg-white/[0.02] flex items-center justify-between px-6 shrink-0 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                    <button onClick={onRequestAdminAccess} className="hover:text-red-500 transition-colors">:: Admin_Override ::</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-white text-black font-bold rounded-sm hover:bg-cyan-400 transition-colors">Save Updates</button>
                </div>

            </div>
        </div>
    );
};
