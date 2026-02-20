"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

interface Segment {
    speaker: string;
    text: string;
}

export default function PodcastPage() {
    const router = useRouter();
    const { resolvedTheme, toggleTheme } = useTheme();

    // Podcast data
    const [title, setTitle] = useState("Study Cast");
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSegment, setCurrentSegment] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load generated content from sessionStorage
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("generatedContent");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.type === "podcast") {
                    setTitle(parsed.title || "Study Cast");

                    // Normalize data to segments array
                    let segs: Segment[] = [];
                    if (Array.isArray(parsed.data)) {
                        segs = parsed.data.map((s: any) => ({
                            speaker: s.speaker || s.role || "Host",
                            text: s.text || s.content || s.line || String(s),
                        }));
                    } else if (parsed.data?.script) {
                        segs = parsed.data.script.map((s: any) => ({
                            speaker: s.speaker || "Host",
                            text: s.text || s.line || String(s),
                        }));
                    } else if (parsed.data?.segments) {
                        segs = parsed.data.segments;
                    }

                    if (segs.length > 0) {
                        setSegments(segs);
                        setLoaded(true);
                    }
                }
            }
        } catch { /* ignore */ }
    }, []);

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const available = speechSynthesis.getVoices();
            if (available.length > 0) setVoices(available);
        };
        loadVoices();
        speechSynthesis.addEventListener("voiceschanged", loadVoices);
        return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    }, []);

    // Pick two distinct voices for speakers
    const getVoice = useCallback((speaker: string): SpeechSynthesisVoice | null => {
        if (voices.length === 0) return null;

        // Try to find English voices
        const enVoices = voices.filter(v => v.lang.startsWith("en"));
        const pool = enVoices.length >= 2 ? enVoices : voices;

        // Use different voices for different speakers
        const speakerNames = [...new Set(segments.map(s => s.speaker))];
        const idx = speakerNames.indexOf(speaker);
        return pool[idx % pool.length] || pool[0];
    }, [voices, segments]);

    // Scroll active segment into view
    useEffect(() => {
        if (scrollRef.current) {
            const active = scrollRef.current.querySelector(`[data-seg="${currentSegment}"]`);
            active?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [currentSegment]);

    // Speak a segment
    const speakSegment = useCallback((index: number) => {
        if (index >= segments.length) {
            setIsPlaying(false);
            setCurrentSegment(0);
            return;
        }

        speechSynthesis.cancel();
        const seg = segments[index];
        const utt = new SpeechSynthesisUtterance(seg.text);
        utt.rate = speed;
        utt.pitch = seg.speaker.toLowerCase().includes("host") || seg.speaker === "A" ? 1.0 : 0.9;

        const voice = getVoice(seg.speaker);
        if (voice) utt.voice = voice;

        utt.onend = () => {
            const next = index + 1;
            setCurrentSegment(next);
            if (next < segments.length) {
                // Small pause between speakers
                setTimeout(() => speakSegment(next), 400);
            } else {
                setIsPlaying(false);
            }
        };

        utt.onerror = () => {
            setIsPlaying(false);
        };

        utteranceRef.current = utt;
        speechSynthesis.speak(utt);
    }, [segments, speed, getVoice]);

    const handlePlay = () => {
        if (isPlaying) {
            speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            speakSegment(currentSegment);
        }
    };

    const handleSkipForward = () => {
        speechSynthesis.cancel();
        const next = Math.min(currentSegment + 1, segments.length - 1);
        setCurrentSegment(next);
        if (isPlaying) speakSegment(next);
    };

    const handleSkipBack = () => {
        speechSynthesis.cancel();
        const prev = Math.max(currentSegment - 1, 0);
        setCurrentSegment(prev);
        if (isPlaying) speakSegment(prev);
    };

    const handleSegmentClick = (index: number) => {
        speechSynthesis.cancel();
        setCurrentSegment(index);
        setIsPlaying(true);
        speakSegment(index);
    };

    const cycleSpeed = () => {
        const speeds = [0.75, 1, 1.25, 1.5, 2];
        const idx = speeds.indexOf(speed);
        setSpeed(speeds[(idx + 1) % speeds.length]);
    };

    // Clean up on unmount
    useEffect(() => {
        return () => { speechSynthesis.cancel(); };
    }, []);

    const progress = segments.length > 0 ? ((currentSegment) / segments.length) * 100 : 0;

    // Unique speakers for color assignment
    const uniqueSpeakers = [...new Set(segments.map(s => s.speaker))];
    const speakerColors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B"];

    if (!loaded) {
        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center pb-24">
                <div className="text-center max-w-sm px-6">
                    <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-red-500 text-4xl">podcasts</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">No Podcast Loaded</h2>
                    <p className="text-sm text-[var(--foreground-muted)] mb-6">
                        Generate a podcast from the Create page first, then come back here to listen.
                    </p>
                    <button
                        onClick={() => router.push("/create")}
                        className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-all"
                    >
                        Go to Create
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-36">
            {/* Header */}
            <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-5 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                    <button onClick={() => router.back()} className="p-1.5 -ml-1 rounded-lg hover:bg-[var(--background-tertiary)] transition-all">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">{title}</h1>
                        <p className="text-[10px] text-[var(--foreground-muted)]">{segments.length} segments</p>
                    </div>
                </div>
                <button onClick={toggleTheme} className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all">
                    <span className="material-symbols-outlined text-lg">{resolvedTheme === "light" ? "dark_mode" : "light_mode"}</span>
                </button>
            </header>

            {/* Transcript */}
            <div ref={scrollRef} className="max-w-2xl mx-auto px-5 py-6 space-y-3">
                {/* Speaker legend */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {uniqueSpeakers.map((speaker, i) => (
                        <div key={speaker} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--card)] border border-[var(--border)]">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: speakerColors[i % speakerColors.length] }} />
                            <span className="text-[10px] font-medium text-[var(--foreground-secondary)]">{speaker}</span>
                        </div>
                    ))}
                </div>

                {/* Segments */}
                {segments.map((seg, i) => {
                    const speakerIdx = uniqueSpeakers.indexOf(seg.speaker);
                    const color = speakerColors[speakerIdx % speakerColors.length];
                    const isActive = i === currentSegment;
                    const isPast = i < currentSegment;

                    return (
                        <button
                            key={i}
                            data-seg={i}
                            onClick={() => handleSegmentClick(i)}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 border ${isActive
                                    ? 'bg-[var(--accent)]/5 border-[var(--accent)]/30 shadow-md'
                                    : isPast
                                        ? 'bg-[var(--background-tertiary)]/50 border-transparent opacity-60'
                                        : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)]/20 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Speaker indicator */}
                                <div className="flex flex-col items-center pt-1 shrink-0">
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${isActive ? 'animate-pulse' : ''}`}
                                        style={{ backgroundColor: color }}
                                    >
                                        {seg.speaker.charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color }}>
                                        {seg.speaker}
                                    </span>
                                    <p className={`text-sm leading-relaxed ${isActive ? 'text-[var(--foreground)]' : 'text-[var(--foreground-secondary)]'}`}>
                                        {seg.text}
                                    </p>
                                </div>

                                {/* Active indicator */}
                                {isActive && isPlaying && (
                                    <div className="shrink-0 flex items-center gap-0.5 pt-2">
                                        {[1, 2, 3].map(bar => (
                                            <div
                                                key={bar}
                                                className="w-0.5 bg-[var(--accent)] rounded-full"
                                                style={{
                                                    height: `${8 + bar * 4}px`,
                                                    animation: `pulse-soft ${0.4 + bar * 0.15}s ease-in-out infinite alternate`,
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Fixed Player Controls */}
            <div className="fixed bottom-20 left-0 right-0 z-30 px-4">
                <div className="max-w-lg mx-auto rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-4 backdrop-blur-xl">
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-[var(--border)] rounded-full mb-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Speed button */}
                        <button
                            onClick={cycleSpeed}
                            className="w-10 h-10 rounded-lg bg-[var(--background-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--foreground-secondary)] hover:bg-[var(--border)] transition-all"
                        >
                            {speed}x
                        </button>

                        {/* Main controls */}
                        <div className="flex items-center gap-3">
                            <button onClick={handleSkipBack} className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all">
                                <span className="material-symbols-outlined text-xl">skip_previous</span>
                            </button>

                            <button
                                onClick={handlePlay}
                                className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-transform"
                            >
                                <span className="material-symbols-outlined text-2xl">
                                    {isPlaying ? "pause" : "play_arrow"}
                                </span>
                            </button>

                            <button onClick={handleSkipForward} className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-all">
                                <span className="material-symbols-outlined text-xl">skip_next</span>
                            </button>
                        </div>

                        {/* Segment counter */}
                        <span className="text-[10px] text-[var(--foreground-muted)] font-medium tabular-nums w-10 text-center">
                            {currentSegment + 1}/{segments.length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
