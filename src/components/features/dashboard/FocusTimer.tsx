"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, BookOpen, Coffee, Edit3, Brain, Sparkles, Volume2, VolumeX, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTimerStore } from "@/store/useTimerStore";
import { getRandomQuote } from "@/lib/quotes";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useUserStore } from "@/store/useUserStore";

const AMBIENT_TRACKS = [
    { id: 'rain', name: 'Midnight Rain', icon: '🌧️', desc: 'Soothing rainfall & distant thunder' },
    { id: 'lofi', name: 'Lo-Fi Scholar', icon: '🎧', desc: 'Warm analog chords & vinyl hum' },
    { id: 'library', name: 'Oxford Library', icon: '📖', desc: 'Quiet page turns & soft murmur' },
    { id: 'fire', name: 'Volcanic Embers', icon: '🔥', desc: 'Cozy hearth crackle & warmth' }
];

// Web Audio API Ambient Synthesizer
class AmbientSynthesizer {
    private ctx: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private activeTrack: string | null = null;
    private intervalId: any = null;
    private sourceNodes: AudioNode[] = [];

    private init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.gainNode = this.ctx.createGain();
                this.gainNode.gain.value = 0.15; // gentle ambient volume
                this.gainNode.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.sourceNodes.forEach(node => {
            try {
                if ('stop' in node && typeof (node as any).stop === 'function') {
                    (node as any).stop();
                }
                node.disconnect();
            } catch (e) {
                // ignore cleanup errors
            }
        });
        this.sourceNodes = [];
        this.activeTrack = null;
    }

    public play(trackId: string) {
        this.stop();
        this.init();
        if (!this.ctx || !this.gainNode) return;

        this.activeTrack = trackId;
        const ctx = this.ctx;
        const masterGain = this.gainNode;

        if (trackId === 'rain' || trackId === 'library') {
            // Filtered Pink/Brown Noise
            const bufferSize = ctx.sampleRate * 2;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11;
                b6 = white * 0.115926;
            }

            const whiteNoise = ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = trackId === 'rain' ? 'lowpass' : 'bandpass';
            filter.frequency.value = trackId === 'rain' ? 800 : 500;
            filter.Q.value = 0.5;

            whiteNoise.connect(filter);
            filter.connect(masterGain);
            whiteNoise.start();
            this.sourceNodes.push(whiteNoise, filter);
        } else if (trackId === 'lofi') {
            // Warm analog chord drone with subtle LFO
            const freqs = [110, 164.81, 220, 277.18]; // A2, E3, A3, C#4 (Major 7 warmth)
            freqs.forEach(f => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = f;
                gain.gain.value = 0.03;
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start();
                this.sourceNodes.push(osc, gain);
            });
        } else if (trackId === 'fire') {
            // Low hearth rumble + intermittent crackle pops
            const bufferSize = ctx.sampleRate * 2;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * 0.08;
            }
            const rumble = ctx.createBufferSource();
            rumble.buffer = noiseBuffer;
            rumble.loop = true;

            const lowpass = ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 250;

            rumble.connect(lowpass);
            lowpass.connect(masterGain);
            rumble.start();
            this.sourceNodes.push(rumble, lowpass);

            // Crackle generator
            this.intervalId = setInterval(() => {
                if (!this.ctx || !this.gainNode || this.activeTrack !== 'fire') return;
                if (Math.random() > 0.4) {
                    const pop = this.ctx.createOscillator();
                    const popGain = this.ctx.createGain();
                    pop.type = 'sine';
                    pop.frequency.setValueAtTime(800 + Math.random() * 1200, this.ctx.currentTime);
                    popGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
                    popGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
                    pop.connect(popGain);
                    popGain.connect(this.gainNode);
                    pop.start();
                    pop.stop(this.ctx.currentTime + 0.06);
                }
            }, 180);
        }
    }
}

const ambientSynth = typeof window !== "undefined" ? new AmbientSynthesizer() : null;

export default function FocusTimer({ widget = false }: { widget?: boolean }) {
    const { 
        timeLeft, 
        isActive, 
        mode, 
        startTimer, 
        pauseTimer, 
        resetTimer, 
        tickTimer, 
        setMode, 
        syncHydration 
    } = useTimerStore();

    const { addToast } = useToasts();
    const { updateUser, xp } = useUserStore();

    const [quote, setQuote] = useState({ text: "", author: "" });
    const [showSummary, setShowSummary] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const [activeSound, setActiveSound] = useState<string | null>(null);
    const lastHiddenTime = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (ambientSynth) ambientSynth.stop();
        };
    }, []);

    // Hydration sync & Interval
    useEffect(() => {
        syncHydration();
        let interval: any = null;
        
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                tickTimer();
            }, 1000);
        } else if (isActive && timeLeft <= 0) {
            pauseTimer();
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 500]);
            }
            
            if (mode === "focus") {
                updateUser({ xp: xp + 15 });
                addToast("Focus Complete: +15 XP gained. The Professor is pleased.", "success");
                setShowSummary(true);
                setMode("shortBreak");
            } else {
                addToast("Break Over: Return to your scholarly duties.", "info");
                setMode("focus");
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, tickTimer, pauseTimer, setMode, syncHydration, addToast, updateUser, xp]);

    // Anti-distraction Penalty
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                lastHiddenTime.current = Date.now();
            } else {
                if (isActive && mode === "focus" && lastHiddenTime.current) {
                    const hiddenDuration = Date.now() - lastHiddenTime.current;
                    if (hiddenDuration > 30000) {
                        addToast("Distraction is the thief of retention. You have been away for a while.", "info");
                        if (navigator.vibrate) navigator.vibrate(200);
                    }
                }
                lastHiddenTime.current = null;
                syncHydration();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isActive, mode, addToast, syncHydration]);

    // Fetch quote on start
    useEffect(() => {
        if (isActive && mode === "focus" && !quote.text) {
            setQuote(getRandomQuote());
        }
    }, [isActive, mode, quote]);

    const handleToggle = () => {
        if (isActive) {
            pauseTimer();
        } else {
            startTimer();
            if (navigator.vibrate) navigator.vibrate(50);
        }
    };

    const handleReset = () => {
        resetTimer();
        setQuote({ text: "", author: "" });
    };

    const handleSoundToggle = (trackId: string) => {
        if (activeSound === trackId) {
            setActiveSound(null);
            if (ambientSynth) ambientSynth.stop();
            addToast("Ambient soundscape muted", "info");
        } else {
            setActiveSound(trackId);
            if (ambientSynth) ambientSynth.play(trackId);
            const track = AMBIENT_TRACKS.find(t => t.id === trackId);
            addToast(`Playing ${track?.name || 'soundscape'}...`, "success");
        }
    };

    const saveSummary = () => {
        if (!summaryText.trim()) return;
        addToast("Archive Saved: Your study jotter has been updated.", "success");
        setShowSummary(false);
        setSummaryText("");
    };

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const TOTAL_TIME = mode === "focus" ? 25 * 60 : mode === "shortBreak" ? 5 * 60 : 15 * 60;
    const progress = 1 - (timeLeft / TOTAL_TIME);

    if (widget) {
        return (
            <div className="flex items-center gap-1.5 shrink-0">
                <button 
                    onClick={handleToggle}
                    onDoubleClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="relative w-9 h-9 flex items-center justify-center rounded-full bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--blue)]/40 hover:bg-[var(--background)] transition-all cursor-pointer shadow-sm group select-none shrink-0"
                    title={`${mode === 'focus' ? 'Study' : 'Break'} Session: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} (Click: Play/Pause | Double Click: Reset)`}
                >
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="transparent" stroke="var(--border)" strokeWidth="1.5" />
                        <motion.circle 
                            cx="18" cy="18" r="15" fill="transparent" 
                            stroke={mode === "focus" ? "var(--blue)" : "var(--amber)"} 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                            strokeDasharray="94.2"
                            initial={{ strokeDashoffset: 94.2 }}
                            animate={{ strokeDashoffset: 94.2 - (94.2 * progress) }}
                            transition={{ ease: "linear", duration: 1 }}
                        />
                    </svg>
                    <span className="relative font-mono text-[9px] font-black tracking-tight tabular-nums text-[var(--foreground)] flex items-center justify-center">
                        {isActive ? (
                            <span className="text-[10px]">{mins}</span>
                        ) : (
                            <Play size={10} className="fill-current text-[var(--foreground-muted)] group-hover:text-[var(--foreground)] ml-0.5" />
                        )}
                    </span>
                    {isActive && (
                        <span className={cn(
                            "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--background-secondary)]",
                            mode === 'focus' ? 'bg-[var(--blue)]' : 'bg-[var(--amber)]'
                        )} />
                    )}
                </button>
                
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMode(mode === 'focus' ? 'shortBreak' : 'focus');
                        setQuote({ text: '', author: '' });
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all cursor-pointer shrink-0"
                    title={`Switch to ${mode === 'focus' ? 'Break' : 'Study'} Mode`}
                >
                    {mode === 'focus' ? <Coffee size={13} /> : <Brain size={13} />}
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 sm:p-8 rounded-[32px] bg-[var(--surface)] border border-[var(--border-2)] relative overflow-hidden group transition-all flex flex-col h-full shadow-xl">
            {/* Ambient background glow */}
            <div className={cn(
                "absolute -top-12 -right-12 w-56 h-56 rounded-full blur-3xl opacity-20 transition-colors duration-1000 pointer-events-none",
                mode === "focus" ? "bg-[var(--blue)]" : mode === "shortBreak" ? "bg-[var(--amber)]" : "bg-[var(--purple)]"
            )} />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <Clock size={16} className={mode === "focus" ? "text-[var(--blue)]" : mode === "shortBreak" ? "text-[var(--amber)]" : "text-[var(--purple)]"} />
                    <span className="font-mono text-xs uppercase tracking-[0.2em] font-black text-[var(--foreground)]">Midnight Study Lounge</span>
                </div>
                {isActive && (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)]">
                        <span className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            mode === "focus" ? "bg-[var(--blue)]" : mode === "shortBreak" ? "bg-[var(--amber)]" : "bg-[var(--purple)]"
                        )} />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Live Sprint</span>
                    </div>
                )}
            </div>

            {/* Persistent Mode Toggle Bar */}
            <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] mb-8 relative z-10 shadow-inner">
                <button 
                    onClick={() => { setMode("focus"); setQuote({ text: "", author: "" }); }} 
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        mode === "focus" 
                            ? "bg-[var(--blue)] text-white shadow-md scale-[1.02]" 
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    <Brain size={14} />
                    <span>Study (25m)</span>
                </button>
                <button 
                    onClick={() => { setMode("shortBreak"); setQuote({ text: "", author: "" }); }} 
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        mode === "shortBreak" 
                            ? "bg-[var(--amber)] text-black shadow-md scale-[1.02]" 
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    <Coffee size={14} />
                    <span>Break (5m)</span>
                </button>
                <button 
                    onClick={() => { setMode("longBreak"); setQuote({ text: "", author: "" }); }} 
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                        mode === "longBreak" 
                            ? "bg-[var(--purple)] text-white shadow-md scale-[1.02]" 
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    )}
                >
                    <BookOpen size={14} />
                    <span>Rest (15m)</span>
                </button>
            </div>

            {/* Timer Dial & Controls */}
            <div className="flex flex-col items-center justify-center py-4 flex-1 relative z-10">
                <div className="relative flex items-center justify-center w-48 h-48 mb-8">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" fill="transparent" stroke="var(--border)" strokeWidth="3" strokeDasharray="276" />
                        <motion.circle 
                            cx="50" cy="50" r="44" fill="transparent" 
                            stroke={mode === "focus" ? "var(--blue)" : mode === "shortBreak" ? "var(--amber)" : "var(--purple)"} 
                            strokeWidth="5" 
                            strokeLinecap="round"
                            strokeDasharray="276" 
                            initial={{ strokeDashoffset: 276 }}
                            animate={{ strokeDashoffset: 276 - (276 * progress) }}
                            transition={{ strokeDashoffset: { ease: "linear", duration: 1 } }}
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-[var(--foreground)] tabular-nums tracking-tight font-mono leading-none">
                            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                        </span>
                        <span className="text-xs font-black text-[var(--foreground-muted)] uppercase tracking-widest mt-2">
                            {mode === "focus" ? "Deep Work" : mode === "shortBreak" ? "Short Rest" : "Long Rest"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleToggle} 
                        className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer",
                            mode === "focus" 
                                ? "btn-skeuo-blue text-white" 
                                : mode === "shortBreak"
                                ? "bg-[var(--amber)] text-black hover:opacity-90 font-bold"
                                : "bg-[var(--purple)] text-white hover:opacity-90 font-bold"
                        )}
                        title={isActive ? "Pause Sprint" : "Start Sprint"}
                    >
                        {isActive ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
                    </button>
                    <button 
                        onClick={handleReset} 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--background-secondary)] border border-[var(--border)] active:scale-95 transition-all text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30 shadow-sm cursor-pointer"
                        title="Reset Timer"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>
            
            {/* Ambient Soundscape Bar */}
            <div className="mt-8 pt-6 border-t border-[var(--border)] relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                        <Music size={14} className="text-[var(--blue)]" />
                        <span>Ambient Soundscapes</span>
                    </span>
                    {activeSound && (
                        <button
                            onClick={() => handleSoundToggle(activeSound)}
                            className="text-[10px] font-mono font-bold text-[var(--blue)] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <VolumeX size={12} />
                            <span>Mute</span>
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {AMBIENT_TRACKS.map(track => {
                        const isPlaying = activeSound === track.id;
                        return (
                            <button
                                key={track.id}
                                onClick={() => handleSoundToggle(track.id)}
                                className={cn(
                                    "p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left cursor-pointer",
                                    isPlaying 
                                        ? "bg-[var(--blue)]/15 border-[var(--blue)] text-[var(--foreground)] shadow-sm" 
                                        : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-2)]"
                                )}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="text-base">{track.icon}</span>
                                    {isPlaying && (
                                        <span className="w-2 h-2 rounded-full bg-[var(--blue)] animate-pulse" />
                                    )}
                                </div>
                                <span className="text-xs font-bold truncate w-full">{track.name}</span>
                                <span className="text-[9px] text-[var(--foreground-muted)] truncate w-full font-medium">{track.desc}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Quote / Suggestion Footer */}
            <div className="mt-6 min-h-[44px] flex items-center justify-center border-t border-[var(--border)] pt-4 relative z-10">
                <AnimatePresence mode="wait">
                    {isActive && mode === "focus" && quote.text ? (
                        <motion.div 
                            key="quote"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-center px-4"
                        >
                            <p className="text-xs font-bold text-[var(--foreground-secondary)] italic leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--foreground-muted)] mt-1.5">, {quote.author}</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="break-sugg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center gap-6 font-mono text-xs uppercase tracking-widest text-[var(--foreground-muted)] flex-wrap px-2 text-center items-center font-bold"
                        >
                            <span className="flex items-center gap-1.5 text-[var(--amber)]"><Coffee size={14} /> Hydrate</span>
                            <span className="flex items-center gap-1.5 text-[var(--blue)]"><BookOpen size={14} /> Rest Eyes</span>
                            <span className="flex items-center gap-1.5 text-[var(--purple)]"><Sparkles size={14} /> Stretch</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Study Jotter Modal */}
            <AnimatePresence>
                {showSummary && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 bg-[var(--background)]/95 backdrop-blur-xl z-50 flex flex-col p-6 rounded-[32px] border border-[var(--border-2)] shadow-2xl"
                    >
                        <div className="flex items-center gap-2 mb-4 text-[var(--blue)]">
                            <Edit3 size={18} />
                            <h4 className="text-sm font-black uppercase tracking-widest">Study Jotter</h4>
                        </div>
                        <p className="text-xs text-[var(--foreground)] mb-4 font-bold leading-relaxed">What concept did you master in the last 25 minutes?</p>
                        
                        <textarea 
                            value={summaryText}
                            onChange={(e) => setSummaryText(e.target.value)}
                            placeholder="I finally understood the mechanics of..."
                            className="w-full flex-1 bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-4 text-sm text-[var(--foreground)] resize-none focus:border-[var(--blue)]/50 focus:ring-1 focus:ring-[var(--blue)]/50 outline-none transition-all"
                        />
                        
                        <div className="flex gap-3 mt-6">
                            <button 
                                onClick={() => setShowSummary(false)}
                                className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                            >
                                Dismiss
                            </button>
                            <button 
                                onClick={saveSummary}
                                disabled={!summaryText.trim()}
                                className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest btn-skeuo-blue disabled:opacity-50 transition-all cursor-pointer"
                            >
                                Log Study
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
