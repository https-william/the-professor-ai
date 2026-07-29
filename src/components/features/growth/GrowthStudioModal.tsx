"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, 
    Share2, 
    Copy, 
    Check, 
    MessageSquare, 
    Send, 
    Twitter, 
    Linkedin, 
    Trophy, 
    Users, 
    Sparkles,
    ArrowRight,
    ExternalLink
} from "lucide-react";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useUser } from "@/context/UserContext";

interface GrowthStudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    packTitle?: string;
    packId?: string;
}

export default function GrowthStudioModal({ isOpen, onClose, packTitle, packId }: GrowthStudioModalProps) {
    const { user } = useUser();
    const { addToast } = useToasts();

    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedPost, setCopiedPost] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<'whatsapp' | 'telegram' | 'twitter' | 'linkedin'>('whatsapp');
    const [sharing, setSharing] = useState(false);

    // Stats & Referral URLs
    const referralCode = user.id ? user.id.substring(0, 8) : "SCHOLAR100";
    const shareUrl = packId 
        ? `https://theprofessor.xyz/share?id=${packId}&ref=${referralCode}` 
        : `https://theprofessor.xyz/signup?ref=${referralCode}`;

    const defaultTitle = packTitle || "My Course Notes & Study Sets";

    // Friendly messages tailored for classmates and study groups
    const postTemplates = {
        whatsapp: `🔥 Yo! I just turned ${defaultTitle} into interactive flashcards, quizzes & deep summaries in 10 seconds on The Professor AI.

Study smarter, pass exams faster. Check out my study set here and claim +500 free bonus study XP:
👉 ${shareUrl}`,

        telegram: `📚 *The Professor AI - Shared Study Pack*

I created a complete study set for *${defaultTitle}*! 
Features included:
⚡ 10-Second Feynman Summaries
🧠 Spaced Repetition Memory Cards
🏆 Custom Practice Exam Questions

Join using my invite link for +500 Bonus XP:
${shareUrl}`,

        twitter: `Stop spending 5 hours manually summarizing lecture slides 🚨

I just generated an interactive study pack with flashcards, Feynman summaries & quizzes for "${defaultTitle}" in 10 seconds using @TheProfessorAI.

Try it free + get 500 bonus study XP:
${shareUrl} 🧵👇`,

        linkedin: `As students, mastering complex academic materials efficiently is key. I've been using The Professor AI to automatically synthesize course documents into active recall study decks and Feynman summaries.

Here is my latest public study set: ${shareUrl}

#AIInEducation #StudySmarter #EdTech #Productivity`
    };

    const currentPostText = postTemplates[selectedPlatform];

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        addToast("Study link copied to clipboard!", "success");
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleCopyPost = () => {
        navigator.clipboard.writeText(currentPostText);
        setCopiedPost(true);
        addToast("Message text copied!", "success");
        setTimeout(() => setCopiedPost(false), 2000);
    };

    const handle1ClickShare = (platform: 'whatsapp' | 'telegram' | 'twitter' | 'linkedin') => {
        const text = encodeURIComponent(postTemplates[platform]);
        const url = encodeURIComponent(shareUrl);
        let targetUrl = "";

        switch (platform) {
            case 'whatsapp':
                targetUrl = `https://api.whatsapp.com/send?text=${text}`;
                break;
            case 'telegram':
                targetUrl = `https://t.me/share/url?url=${url}&text=${encodeURIComponent(`Check out my study set on The Professor AI!`)}`;
                break;
            case 'twitter':
                targetUrl = `https://twitter.com/intent/tweet?text=${text}`;
                break;
            case 'linkedin':
                targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
        }

        if (targetUrl) {
            window.open(targetUrl, '_blank');
            addToast(`Opening ${platform.toUpperCase()}... Share with your classmates!`, "info");
        }
    };

    const handleAutoPromoteBroadcast = async () => {
        setSharing(true);
        try {
            const res = await fetch("/api/growth/auto-promote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packId,
                    packTitle: defaultTitle,
                    referralCode,
                    platform: selectedPlatform
                })
            });
            const data = await res.json();
            if (data.success && data.broadcast === "telegram_channel") {
                addToast("Broadcast sent to your connected study channel!", "success");
            } else {
                handle1ClickShare(selectedPlatform);
            }
        } catch (err) {
            handle1ClickShare(selectedPlatform);
        } finally {
            setSharing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/75 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-2xl p-6 z-10 space-y-6"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                            <X size={16} />
                        </button>

                        {/* Title */}
                        <div className="flex items-center gap-2">
                            <Share2 size={18} className="text-[var(--blue)]" />
                            <h2 className="text-base font-black uppercase tracking-tight text-[var(--foreground)]">
                                Share Notes & Earn Study XP
                            </h2>
                        </div>

                        {/* Banner / Value Prop */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-[var(--blue)]/15 via-[var(--amber)]/15 to-purple-500/10 border border-[var(--blue)]/30 relative overflow-hidden shadow-lg">
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <div className="p-1.5 rounded-lg bg-[var(--blue)] text-white font-black">
                                    <Sparkles size={14} />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-tight text-[var(--foreground)]">
                                    Share Study Set with Classmates
                                </h3>
                            </div>
                            <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed font-medium">
                                Share your flashcards and summaries with your course WhatsApp group, Telegram channel, or X. Earn <span className="font-bold text-[var(--amber)]">+500 Bonus XP</span> whenever a classmate joins!
                            </p>
                        </div>

                        {/* Growth Stats Strip */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3.5 rounded-xl bg-[var(--background)]/60 border border-[var(--border)] text-center">
                                <div className="flex items-center justify-center gap-1.5 text-[var(--amber)] text-[10px] font-black uppercase mb-1">
                                    <Trophy size={12} />
                                    <span>Bonus XP</span>
                                </div>
                                <p className="text-lg font-black text-[var(--foreground)]">
                                    {((user as any)?.referral_count || 0) * 500}
                                </p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[var(--background)]/60 border border-[var(--border)] text-center">
                                <div className="flex items-center justify-center gap-1.5 text-[var(--blue)] text-[10px] font-black uppercase mb-1">
                                    <Users size={12} />
                                    <span>Classmates Joined</span>
                                </div>
                                <p className="text-lg font-black text-[var(--foreground)]">
                                    {(user as any)?.referral_count || 0}
                                </p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[var(--background)]/60 border border-[var(--border)] text-center">
                                <div className="flex items-center justify-center gap-1.5 text-[var(--emerald)] text-[10px] font-black uppercase mb-1">
                                    <Sparkles size={12} />
                                    <span>Your Code</span>
                                </div>
                                <p className="text-xs font-mono font-bold text-[var(--amber)] truncate mt-1">
                                    {referralCode}
                                </p>
                            </div>
                        </div>

                        {/* Platform Selector Tabs */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mb-2 block">
                                Choose Where to Share
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={() => setSelectedPlatform('whatsapp')}
                                    className={`p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        selectedPlatform === 'whatsapp'
                                            ? "bg-[var(--emerald)]/15 border-[var(--emerald)] text-[var(--emerald)] shadow-sm"
                                            : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    }`}
                                >
                                    <MessageSquare size={14} />
                                    <span>WhatsApp</span>
                                </button>
                                <button
                                    onClick={() => setSelectedPlatform('telegram')}
                                    className={`p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        selectedPlatform === 'telegram'
                                            ? "bg-sky-500/15 border-sky-500 text-sky-400 shadow-sm"
                                            : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    }`}
                                >
                                    <Send size={14} />
                                    <span>Telegram</span>
                                </button>
                                <button
                                    onClick={() => setSelectedPlatform('twitter')}
                                    className={`p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        selectedPlatform === 'twitter'
                                            ? "bg-blue-400/15 border-blue-400 text-blue-400 shadow-sm"
                                            : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    }`}
                                >
                                    <Twitter size={14} />
                                    <span>X / Twitter</span>
                                </button>
                                <button
                                    onClick={() => setSelectedPlatform('linkedin')}
                                    className={`p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                        selectedPlatform === 'linkedin'
                                            ? "bg-blue-600/15 border-blue-600 text-blue-400 shadow-sm"
                                            : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                    }`}
                                >
                                    <Linkedin size={14} />
                                    <span>LinkedIn</span>
                                </button>
                            </div>
                        </div>

                        {/* Pre-formatted Message Preview Box */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground-muted)]">
                                    Pre-formatted Message for Classmates
                                </label>
                                <button
                                    onClick={handleCopyPost}
                                    className="text-[9px] font-bold uppercase tracking-wider text-[var(--amber)] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    {copiedPost ? <Check size={10} /> : <Copy size={10} />}
                                    <span>{copiedPost ? "Copied Message" : "Copy Text"}</span>
                                </button>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] font-mono text-[11px] text-[var(--foreground-secondary)] leading-relaxed relative overflow-hidden max-h-36 overflow-y-auto">
                                {currentPostText}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 space-y-2.5">
                            <button
                                onClick={handleAutoPromoteBroadcast}
                                disabled={sharing}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--blue)] via-indigo-600 to-[var(--violet)] text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[var(--blue)]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <ExternalLink size={14} />
                                <span>Share to {selectedPlatform.toUpperCase()}</span>
                                <ArrowRight size={14} />
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyLink}
                                    className="flex-1 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-bold text-[9px] uppercase tracking-widest hover:bg-[var(--background)]/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    {copiedLink ? <Check size={12} className="text-[var(--emerald)]" /> : <Copy size={12} />}
                                    <span>{copiedLink ? "Link Copied" : "Copy Study Link"}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
