"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    User, 
    LogOut, 
    Bell, 
    Shield, 
    Sparkles, 
    ChevronRight, 
    Smartphone, 
    Target, 
    Zap,
    CheckCircle2,
    Sliders,
    Volume2,
    HardDriveDownload,
    Eye
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import StandardContainer from "@/components/ui/StandardContainer";
import GlassmorphicCard from "@/components/ui/GlassmorphicCard";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { cn } from "@/lib/utils";

const PRESET_INFOS = [
    { id: 'midnight-scholar', name: 'Midnight Scholar', accent: '#E5A93C', bg: '#09090b', desc: 'Desaturated gold on deep volcanic dark.' },
    { id: 'volcanic-ember', name: 'Volcanic Ember', bg: '#0d0a07', accent: '#D4763A', desc: 'Warm rust on charcoal lava canvas.' },
    { id: 'obsidian', name: 'Obsidian Deep', bg: '#050508', accent: '#8B8BFF', desc: 'Prestige violet on midnight space glass.' },
    { id: 'high-contrast', name: 'High Contrast', bg: '#000000', accent: '#E5A93C', desc: 'Pure black canvas with gold markings.' }
];

export default function SettingsPage() {
    const { user, updateUser } = useUser();
    const { addToast } = useToasts();
    const isLoadingProfile = user.isLoading;
    const router = useRouter();
    const supabase = createClient();

    const { preferences, isLoading: isLoadingPrefs, updatePreference, updateMultiple } = useUserPreferences();

    const [isSaving, setIsSaving] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.name || "");

    const playClickTick = () => {
        if (typeof window === "undefined") return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
    };

    const playSyncChime = () => {
        if (typeof window === "undefined") return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        
        [520, 650].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
            const t = ctx.currentTime + i * 0.08;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.04, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            
            osc.start(t);
            osc.stop(t + 0.35);
        });
    };

    const handleSignOut = async () => {
        playClickTick();
        await fetch('/api/auth/signout', { method: 'POST' });
        await supabase.auth.signOut();
        router.push('/login');
    };

    const updateProfileSetting = async (key: string, value: any) => {
        playClickTick();
        if (key === 'alias') {
            updateUser({ name: value });
            if (typeof window !== "undefined") {
                localStorage.setItem('user_display_name', value);
            }
        } else {
            const storeKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            updateUser({ [storeKey]: value });
        }
        setIsSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value }),
            });

            if (res.ok) {
                addToast("Setting synchronized", "success");
                playSyncChime();
            } else {
                addToast("Failed to sync setting to cloud (saved locally)", "info");
            }
        } catch (error) {
            addToast("Saved locally (will sync when online)", "info");
        } finally {
            setIsSaving(false);
        }
    };

    const updatePreferenceSetting = async (key: any, value: any) => {
        playClickTick();
        await updatePreference(key, value);
        playSyncChime();
        addToast("Preference synchronized", "success");
    };

    const handleBackup = () => {
        playClickTick();
        try {
            const backupData: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith("professor-") || key.startsWith("srs_local_") || key.startsWith("roadmap_local_") || key === "claimed_achievements")) {
                    backupData[key] = localStorage.getItem(key);
                }
            }
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `professor-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            addToast("Local vault backup downloaded successfully", "success");
            playSyncChime();
        } catch (e) {
            addToast("Failed to compile local vault backup", "error");
        }
    };

    if (isLoadingProfile || isLoadingPrefs) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="w-10 h-10 border-2 border-t-transparent border-[var(--accent)] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent text-[var(--foreground)] selection:bg-amber-500/20 pb-32">
            
            {/* Header Section */}
            <section className="pt-24 pb-8 md:pt-32 md:pb-12 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[var(--accent)]/[0.02] to-transparent pointer-events-none" />
                
                <StandardContainer narrow>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)] mb-2 flex items-center gap-2">
                                <Sparkles size={12} className="text-[var(--accent)]" />
                                <span>The Study Lab</span>
                            </p>
                            <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tight italic uppercase">Your Preferences</h1>
                            <p className="text-white/50 max-w-sm text-xs leading-relaxed font-sans">
                                Make yourself at home. Let's get your study space exactly how you like it.
                            </p>
                        </div>
                        
                        <div className="bg-white/[0.01] border border-white/5 backdrop-blur-md p-3 pl-5 rounded-2xl flex items-center gap-4 shadow-xl">
                            <div className="text-right">
                                {isEditingName ? (
                                    <input 
                                        autoFocus
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onBlur={() => {
                                            if (newName !== user.name) updateProfileSetting('alias', newName);
                                            setIsEditingName(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (newName !== user.name) updateProfileSetting('alias', newName);
                                                setIsEditingName(false);
                                            }
                                        }}
                                        className="bg-transparent text-right text-xs font-bold text-white border-b border-[var(--accent)] outline-none w-28"
                                    />
                                ) : (
                                    <p 
                                        onClick={() => {
                                            setNewName(user?.name || "");
                                            setIsEditingName(true);
                                        }}
                                        className="text-xs font-bold text-white cursor-pointer hover:text-[var(--accent)] transition-colors"
                                    >
                                        {user?.name || "Scholar"}
                                    </p>
                                )}
                                <p className="text-[9px] text-[var(--accent)] font-black uppercase tracking-wider mt-0.5 font-mono">
                                    {isEditingName ? "What should the professor call you?" : "Lifelong Scholar"}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[var(--accent)] to-amber-300 flex items-center justify-center text-black font-black text-xs relative group overflow-hidden shadow-lg shadow-amber-500/10">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <span className="relative z-10">{user?.avatar?.startsWith('http') ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user?.avatar || (user?.email?.[0] || "S").toUpperCase())}</span>
                            </div>
                        </div>
                    </div>
                </StandardContainer>
            </section>

            {/* Main Content */}
            <section className="py-4">
                <StandardContainer narrow>
                    <div className="space-y-8">
                        
                        {/* Profile Details & Credentials */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GlassmorphicCard intensity="light" className="p-6 flex flex-col justify-between" radius="20px">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                            <User size={18} className="text-[var(--accent)]" />
                                        </div>
                                        <div className="text-[9px] text-white/30 font-black uppercase tracking-widest font-mono">Profile Details</div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 font-mono">Academy Email</p>
                                        <p className="text-sm font-bold truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[#2BB288] text-[9px] font-black uppercase tracking-widest font-mono">
                                        <Shield size={11} /> Verified Identity
                                    </div>
                                </div>
                            </GlassmorphicCard>

                            {/* Plan Display Card */}
                            <GlassmorphicCard intensity="light" className="p-6 flex flex-col justify-between" radius="20px">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                            <Zap size={18} className="text-[var(--accent)]" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#E5A93C] font-mono">Vault Storage</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 font-mono">Active Tier</p>
                                        <p className="text-sm font-black uppercase tracking-wider">
                                            {user.planStatus === 'free' ? "Scholar Free" : user.planStatus === 'plus' ? "Plus Scholar" : "Unlimited Professor"}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black font-mono">
                                        Standard Scholar Access
                                    </span>
                                </div>
                            </GlassmorphicCard>
                        </div>

                        {/* Theme Preset Selector Card */}
                        <GlassmorphicCard intensity="light" className="p-6" radius="20px">
                            <div className="mb-6">
                                <h3 className="text-base font-bold tracking-tight uppercase tracking-wider">Visual Presets</h3>
                                <p className="text-xs text-white/50 leading-relaxed font-sans">Pick an atmosphere details preset to match your focus environment.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {PRESET_INFOS.map((presetItem) => {
                                    const isSelected = preferences?.theme_preset === presetItem.id;
                                    return (
                                        <button
                                            key={presetItem.id}
                                            onClick={() => updatePreferenceSetting('theme_preset', presetItem.id)}
                                            className={cn(
                                                "p-4 rounded-xl text-left border transition-all relative overflow-hidden group flex flex-col justify-between min-h-[100px] cursor-pointer",
                                                isSelected 
                                                    ? "bg-white/[0.04] text-white" 
                                                    : "bg-white/[0.01] border-white/5 text-white/50 hover:text-white hover:border-white/20"
                                            )}
                                            style={{
                                                borderColor: isSelected ? presetItem.accent : undefined,
                                                boxShadow: isSelected ? `0 0 15px ${presetItem.accent}12` : "none"
                                            }}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-[10px] font-black uppercase tracking-wider font-mono">{presetItem.name}</span>
                                                <div 
                                                    className="w-3 h-3 rounded-full border border-white/10" 
                                                    style={{ backgroundColor: presetItem.accent }} 
                                                />
                                            </div>
                                            <p className="text-[10px] leading-normal opacity-80 mt-4">{presetItem.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </GlassmorphicCard>

                        {/* Study Habits Card */}
                        <GlassmorphicCard intensity="light" className="p-6" radius="20px">
                            <div className="mb-8 border-b border-white/5 pb-4">
                                <h3 className="text-base font-bold tracking-tight uppercase tracking-wider">Study Habits</h3>
                                <p className="text-xs text-white/50 leading-relaxed font-sans">Set your pace. We'll handle the heavy lifting.</p>
                            </div>
                            
                            <div className="space-y-8">
                                {/* Daily Goal Minutes & Weekly Goal Hours */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                                <Target size={14} className="text-[var(--accent)]" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider font-mono">Daily Target</p>
                                                <p className="text-[9px] text-white/40 uppercase tracking-widest font-mono">Minutes you want to study</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[15, 30, 60, 120].map((goal) => (
                                                <button
                                                    key={goal}
                                                    onClick={() => updateProfileSetting('daily_goal_minutes', goal)}
                                                    className={cn(
                                                        "py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                                                        user.dailyGoalMinutes === goal 
                                                            ? "bg-[var(--accent)] text-black border-transparent shadow-lg shadow-amber-500/10" 
                                                            : "bg-white/[0.02] border-white/5 text-white/55 hover:text-white"
                                                    )}
                                                >
                                                    {goal}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                                <Target size={14} className="text-[var(--accent)]" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider font-mono">Weekly Target</p>
                                                <p className="text-[9px] text-white/40 uppercase tracking-widest font-mono">Weekly hours objective</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[5, 10, 20, 30].map((goal) => (
                                                <button
                                                    key={goal}
                                                    onClick={() => updatePreferenceSetting('study_goal_hours_weekly', goal)}
                                                    className={cn(
                                                        "py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                                                        preferences?.study_goal_hours_weekly === goal 
                                                            ? "bg-[var(--accent)] text-black border-transparent shadow-lg shadow-amber-500/10" 
                                                            : "bg-white/[0.02] border-white/5 text-white/55 hover:text-white"
                                                    )}
                                                >
                                                    {goal}h
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Rigor Selector */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                            <Zap size={14} className="text-[var(--accent)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider font-mono">Professor's Rigor</p>
                                            <p className="text-[9px] text-white/40 uppercase tracking-widest font-mono">How hard should I push you?</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['easy', 'medium', 'hard'].map((diff) => (
                                            <button
                                                key={diff}
                                                onClick={() => updateProfileSetting('difficulty_preference', diff)}
                                                className={cn(
                                                    "py-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                                                    user.difficultyPreference === diff 
                                                        ? "bg-[var(--accent)] text-black border-transparent shadow-lg shadow-amber-500/10" 
                                                        : "bg-white/[0.02] border-white/5 text-white/55 hover:text-white"
                                                )}
                                            >
                                                {diff}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </GlassmorphicCard>

                        {/* Accessibility Settings */}
                        <GlassmorphicCard intensity="light" className="p-6" radius="20px">
                            <div className="mb-6 border-b border-white/5 pb-4">
                                <h3 className="text-base font-bold tracking-tight uppercase tracking-wider flex items-center gap-2">
                                    <Sliders size={18} className="text-[var(--accent)]" />
                                    <span>Accessibility Suite</span>
                                </h3>
                                <p className="text-xs text-white/50 leading-relaxed font-sans">Tune structural scales, line heights, dyslexia mode, and visual overlays.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Font Size & Line Height & Audio Speed */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Font Size */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider font-mono">
                                            <span className="text-white/40">Font Size</span>
                                            <span>{preferences?.font_size || 16}px</span>
                                        </div>
                                        <input 
                                            type="range"
                                            min={12}
                                            max={24}
                                            value={preferences?.font_size || 16}
                                            onChange={(e) => updatePreference('font_size', parseInt(e.target.value))}
                                            onMouseUp={() => playSyncChime()}
                                            className="w-full accent-[var(--accent)] cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                                        />
                                    </div>

                                    {/* Line Height */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider font-mono">
                                            <span className="text-white/40">Line Height</span>
                                            <span>{preferences?.line_height || 1.6}</span>
                                        </div>
                                        <input 
                                            type="range"
                                            min={1.2}
                                            max={2.0}
                                            step={0.1}
                                            value={preferences?.line_height || 1.6}
                                            onChange={(e) => updatePreference('line_height', parseFloat(e.target.value))}
                                            onMouseUp={() => playSyncChime()}
                                            className="w-full accent-[var(--accent)] cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                                        />
                                    </div>

                                    {/* Audio Speed */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider font-mono">
                                            <span className="text-white/40">Narrator Speed</span>
                                            <span>{preferences?.audio_speed || 1.0}x</span>
                                        </div>
                                        <input 
                                            type="range"
                                            min={0.75}
                                            max={2.0}
                                            step={0.25}
                                            value={preferences?.audio_speed || 1.0}
                                            onChange={(e) => updatePreference('audio_speed', parseFloat(e.target.value))}
                                            onMouseUp={() => playSyncChime()}
                                            className="w-full accent-[var(--accent)] cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                                        />
                                    </div>
                                </div>

                                {/* Switches grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                                    {/* Dyslexia Mode */}
                                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider font-mono">Dyslexia Font</p>
                                            <p className="text-[9px] text-white/40 font-mono">Apply dyslexia-friendly font</p>
                                        </div>
                                        <button 
                                            onClick={() => updatePreferenceSetting('dyslexia_mode', !preferences?.dyslexia_mode)}
                                            className={cn(
                                                "w-9 h-4.5 rounded-full transition-all relative border cursor-pointer",
                                                preferences?.dyslexia_mode ? "bg-[#2BB288] border-transparent" : "bg-white/[0.05] border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm",
                                                preferences?.dyslexia_mode ? "left-5 bg-black" : "left-0.5 bg-white/30"
                                            )} />
                                        </button>
                                    </div>

                                    {/* Bionic Reading */}
                                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider font-mono">Bionic Reading</p>
                                            <p className="text-[9px] text-white/40 font-mono">Bold concept starting characters</p>
                                        </div>
                                        <button 
                                            onClick={() => updatePreferenceSetting('bionic_reading', !preferences?.bionic_reading)}
                                            className={cn(
                                                "w-9 h-4.5 rounded-full transition-all relative border cursor-pointer",
                                                preferences?.bionic_reading ? "bg-[#2BB288] border-transparent" : "bg-white/[0.05] border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm",
                                                preferences?.bionic_reading ? "left-5 bg-black" : "left-0.5 bg-white/30"
                                            )} />
                                        </button>
                                    </div>

                                    {/* Reduced Motion */}
                                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider font-mono">Reduced Motion</p>
                                            <p className="text-[9px] text-white/40 font-mono">Scale down heavy animations</p>
                                        </div>
                                        <button 
                                            onClick={() => updatePreferenceSetting('reduced_motion', !preferences?.reduced_motion)}
                                            className={cn(
                                                "w-9 h-4.5 rounded-full transition-all relative border cursor-pointer",
                                                preferences?.reduced_motion ? "bg-[#2BB288] border-transparent" : "bg-white/[0.05] border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm",
                                                preferences?.reduced_motion ? "left-5 bg-black" : "left-0.5 bg-white/30"
                                            )} />
                                        </button>
                                    </div>

                                    {/* Low Bandwidth Mode */}
                                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider font-mono">Low Bandwidth</p>
                                            <p className="text-[9px] text-white/40 font-mono">Disable background webgl/effects</p>
                                        </div>
                                        <button 
                                            onClick={() => updatePreferenceSetting('low_bandwidth_mode', !preferences?.low_bandwidth_mode)}
                                            className={cn(
                                                "w-9 h-4.5 rounded-full transition-all relative border cursor-pointer",
                                                preferences?.low_bandwidth_mode ? "bg-[#2BB288] border-transparent" : "bg-white/[0.05] border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm",
                                                preferences?.low_bandwidth_mode ? "left-5 bg-black" : "left-0.5 bg-white/30"
                                            )} />
                                        </button>
                                    </div>

                                    {/* Zen Focus Mode */}
                                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider font-mono">Zen Focus Mode</p>
                                            <p className="text-[9px] text-white/40 font-mono">Hide headers during active sessions</p>
                                        </div>
                                        <button 
                                            onClick={() => updatePreferenceSetting('zen_focus_mode', !preferences?.zen_focus_mode)}
                                            className={cn(
                                                "w-9 h-4.5 rounded-full transition-all relative border cursor-pointer",
                                                preferences?.zen_focus_mode ? "bg-[#2BB288] border-transparent" : "bg-white/[0.05] border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm",
                                                preferences?.zen_focus_mode ? "left-5 bg-black" : "left-0.5 bg-white/30"
                                            )} />
                                        </button>
                                    </div>

                                    {/* Late Night Guard */}
                                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider font-mono">Late Night Guard</p>
                                            <p className="text-[9px] text-white/40 font-mono">Soft glare & rest reminders (10pm-6am)</p>
                                        </div>
                                        <button 
                                            onClick={() => updatePreferenceSetting('late_night_guard', !(preferences as any)?.late_night_guard)}
                                            className={cn(
                                                "w-9 h-4.5 rounded-full transition-all relative border cursor-pointer",
                                                (preferences as any)?.late_night_guard ? "bg-[#2BB288] border-transparent" : "bg-white/[0.05] border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm",
                                                (preferences as any)?.late_night_guard ? "left-5 bg-black" : "left-0.5 bg-white/30"
                                            )} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </GlassmorphicCard>

                        {/* Notification Sub-Preferences */}
                        <GlassmorphicCard intensity="light" className="p-6" radius="20px">
                            <div className="mb-6 border-b border-white/5 pb-4">
                                <h3 className="text-base font-bold tracking-tight uppercase tracking-wider flex items-center gap-2">
                                    <Bell size={18} className="text-[var(--accent)]" />
                                    <span>Notification Center</span>
                                </h3>
                                <p className="text-xs text-white/50 leading-relaxed font-sans">Toggle which alerts and reports reach your terminal inbox.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Email Reminders */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/5">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider font-mono">Email Reminders</p>
                                        <p className="text-[9px] text-white/40 font-mono">Receive daily active study reminders</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const sub = preferences?.notification_prefs || {};
                                            const newSub = { ...sub, email_reminders: !sub.email_reminders };
                                            updatePreferenceSetting('notification_prefs', newSub);
                                        }}
                                        className={cn(
                                            "w-9 h-4.5 rounded-full transition-all relative border cursor-pointer",
                                            preferences?.notification_prefs?.email_reminders ? "bg-[#2BB288] border-transparent" : "bg-white/[0.05] border-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm",
                                            preferences?.notification_prefs?.email_reminders ? "left-5 bg-black" : "left-0.5 bg-white/30"
                                        )} />
                                    </button>
                                </div>

                                {/* Streak Alerts */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/5">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider font-mono">Streak Safeguards</p>
                                        <p className="text-[9px] text-white/40 font-mono">Get notified if your streak is expiring</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const sub = preferences?.notification_prefs || {};
                                            const newSub = { ...sub, streak_alerts: !sub.streak_alerts };
                                            updatePreferenceSetting('notification_prefs', newSub);
                                        }}
                                        className={cn(
                                            "w-9 h-4.5 rounded-full transition-all relative border cursor-pointer",
                                            preferences?.notification_prefs?.streak_alerts ? "bg-[#2BB288] border-transparent" : "bg-white/[0.05] border-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm",
                                            preferences?.notification_prefs?.streak_alerts ? "left-5 bg-black" : "left-0.5 bg-white/30"
                                        )} />
                                    </button>
                                </div>

                                {/* Weekly Wrapped */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/5">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider font-mono">Weekly performance wrapped</p>
                                        <p className="text-[9px] text-white/40 font-mono">Receive sunday performance wraps</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const sub = preferences?.notification_prefs || {};
                                            const newSub = { ...sub, weekly_wrapped: !sub.weekly_wrapped };
                                            updatePreferenceSetting('notification_prefs', newSub);
                                        }}
                                        className={cn(
                                            "w-9 h-4.5 rounded-full transition-all relative border cursor-pointer",
                                            preferences?.notification_prefs?.weekly_wrapped ? "bg-[#2BB288] border-transparent" : "bg-white/[0.05] border-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm",
                                            preferences?.notification_prefs?.weekly_wrapped ? "left-5 bg-black" : "left-0.5 bg-white/30"
                                        )} />
                                    </button>
                                </div>

                                {/* Study Breaks */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/5">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider font-mono">Fatigue Reminders</p>
                                        <p className="text-[9px] text-white/40 font-mono">Suggest study breaks when tired</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const sub = preferences?.notification_prefs || {};
                                            const newSub = { ...sub, study_breaks: !sub.study_breaks };
                                            updatePreferenceSetting('notification_prefs', newSub);
                                        }}
                                        className={cn(
                                            "w-9 h-4.5 rounded-full transition-all relative border cursor-pointer",
                                            preferences?.notification_prefs?.study_breaks ? "bg-[#2BB288] border-transparent" : "bg-white/[0.05] border-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 w-3 h-3 rounded-full transition-all shadow-sm",
                                            preferences?.notification_prefs?.study_breaks ? "left-5 bg-black" : "left-0.5 bg-white/30"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </GlassmorphicCard>

                        {/* Local Backup Panel */}
                        <GlassmorphicCard intensity="light" className="p-6" radius="20px">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold uppercase tracking-wider flex items-center gap-2">
                                        <HardDriveDownload size={18} className="text-[var(--accent)]" />
                                        <span>Backup Study Vault</span>
                                    </h3>
                                    <p className="text-xs text-white/50 leading-relaxed font-sans max-w-md">
                                        Download a portable JSON archive of all your local study metrics, cards progress queues, and highlight annotations.
                                    </p>
                                </div>
                                <button
                                    onClick={handleBackup}
                                    className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer shrink-0"
                                >
                                    Backup Vault
                                </button>
                            </div>
                        </GlassmorphicCard>

                        {/* Sign Out & version */}
                        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                            <button 
                                onClick={handleSignOut}
                                className="px-5 py-2.5 rounded-xl border border-red-500/20 text-red-500/70 hover:text-white hover:bg-red-500 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer bg-transparent"
                            >
                                <LogOut size={12} />
                                Take a Break (Sign Out)
                            </button>
                            <div className="text-right font-mono">
                                <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em]">The Professor Protocol v2.5.0</p>
                                <p className="text-[8px] text-white/35 uppercase font-medium mt-0.5">All systems operational</p>
                            </div>
                        </div>

                    </div>
                </StandardContainer>
            </section>
        </div>
    );
}
