"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Volume2, VolumeX, Settings, Coffee } from "lucide-react";
import GlassmorphicCard from "./GlassmorphicCard";
import { useUserPreferences } from "@/hooks/useUserPreferences";

export interface AudioPlayerProps {
  /** The text content to be read by the TTS engine */
  textToRead?: string;
  /** Title of the current content/chapter */
  title?: string;
  className?: string;
}

type AmbientSoundType = 'none' | 'brown-noise' | 'rain' | 'lofi-pad';

export default function AudioPlayer({
  textToRead = "",
  title = "Study Session",
  className = "",
}: AudioPlayerProps) {
  const { preferences, updatePreference } = useUserPreferences();
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isPausedTTS, setIsPausedTTS] = useState(false);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('none');
  const [isMutedAmbient, setIsMutedAmbient] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(preferences?.audio_speed || 1.0);
  const [showConfig, setShowConfig] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Web Audio refs for ambient soundscapes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientSourceRef = useRef<any>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  // Sync preference speed
  useEffect(() => {
    if (preferences?.audio_speed) {
      setTtsSpeed(preferences.audio_speed);
    }
  }, [preferences?.audio_speed]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopTTS();
      stopAmbient();
    };
  }, []);

  const handleBoundary = (event: SpeechSynthesisEvent) => {
    // Custom logic to track reading progress/autoscroll if needed in the future
  };

  const startTTS = () => {
    if (!synthRef.current || !textToRead) return;

    // If currently paused, resume
    if (isPausedTTS) {
      synthRef.current.resume();
      setIsPlayingTTS(true);
      setIsPausedTTS(false);
      return;
    }

    // Cancel anything in progress
    synthRef.current.cancel();

    // Clean text: strip markdown elements for better narration
    const cleanText = textToRead
      .replace(/[#*`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\\/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;
    
    // Set speech attributes
    utterance.rate = ttsSpeed;
    utterance.pitch = 1.0;
    
    // Try to find a nice English voice
    const voices = synthRef.current.getVoices();
    const optimalVoice = voices.find(v => v.lang.includes("en-US") && v.name.includes("Natural")) ||
                          voices.find(v => v.lang.includes("en-")) ||
                          voices[0];
    if (optimalVoice) {
      utterance.voice = optimalVoice;
    }

    utterance.onend = () => {
      setIsPlayingTTS(false);
      setIsPausedTTS(false);
    };

    utterance.onerror = () => {
      setIsPlayingTTS(false);
      setIsPausedTTS(false);
    };

    utterance.onboundary = handleBoundary;

    setIsPlayingTTS(true);
    setIsPausedTTS(false);
    synthRef.current.speak(utterance);
  };

  const pauseTTS = () => {
    if (!synthRef.current) return;
    synthRef.current.pause();
    setIsPausedTTS(true);
    setIsPlayingTTS(false);
  };

  const stopTTS = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsPlayingTTS(false);
    setIsPausedTTS(false);
  };

  const handleSpeedChange = (speed: number) => {
    setTtsSpeed(speed);
    updatePreference('audio_speed', speed);
    
    // If speaking, restart with new speed
    if (isPlayingTTS || isPausedTTS) {
      const wasPaused = isPausedTTS;
      stopTTS();
      setTimeout(() => {
        if (!wasPaused) {
          startTTS();
        }
      }, 100);
    }
  };

  // --- Web Audio Synthesizer for Ambient Soundscapes ---
  const startAmbient = (type: AmbientSoundType) => {
    stopAmbient();
    if (type === 'none') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(isMutedAmbient ? 0 : 0.15, ctx.currentTime);
      gainNode.connect(ctx.destination);
      ambientGainRef.current = gainNode;

      if (type === 'brown-noise' || type === 'rain') {
        // Generate dynamic organic brown noise or rain hiss
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'brown-noise') {
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // compensate loss
          } else {
            // Rain: mixture of filtered white noise + cracking transient raindrops
            const filterRain = (lastOut + (0.12 * white)) / 1.12;
            lastOut = filterRain;
            
            // Random crackles (raindrops)
            const drop = Math.random() > 0.9995 ? (Math.random() * 0.5) : 0;
            output[i] = (filterRain * 0.8) + drop;
          }
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.connect(gainNode);
        whiteNoise.start();
        ambientSourceRef.current = whiteNoise;
      } else if (type === 'lofi-pad') {
        // Lofi chord pad synthesized dynamically
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(165, ctx.currentTime); // E3

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, ctx.currentTime);
        filter.Q.setValueAtTime(1.0, ctx.currentTime);

        // Slow tremolo/filter sweep
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.15, ctx.currentTime); // super slow
        lfoGain.gain.setValueAtTime(100, ctx.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);

        lfo.start();
        osc1.start();
        osc2.start();

        // Keep reference to primary osc to stop
        ambientSourceRef.current = osc1;
        
        // Cleanup wrapper to stop multiple oscillators
        const originalStop = osc1.stop.bind(osc1);
        osc1.stop = () => {
          originalStop();
          try { osc2.stop(); } catch {}
          try { lfo.stop(); } catch {}
        };
      }
    } catch (e) {
      console.warn("Web Audio API not supported or initialized:", e);
    }
  };

  const stopAmbient = () => {
    if (ambientSourceRef.current) {
      try {
        (ambientSourceRef.current as any).stop();
      } catch {}
      ambientSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    ambientGainRef.current = null;
  };

  const handleAmbientChange = (type: AmbientSoundType) => {
    setAmbientSound(type);
    if (type === 'none') {
      stopAmbient();
    } else {
      startAmbient(type);
    }
  };

  const toggleMuteAmbient = () => {
    const nextMuted = !isMutedAmbient;
    setIsMutedAmbient(nextMuted);
    if (ambientGainRef.current && audioCtxRef.current) {
      ambientGainRef.current.gain.setValueAtTime(
        nextMuted ? 0 : 0.15,
        audioCtxRef.current.currentTime
      );
    }
  };

  return (
    <GlassmorphicCard
      intensity="medium"
      radius="20px"
      className={`p-4 scholar-card flex flex-col gap-3 transition-all duration-300 ${className}`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E5A93C] italic">
            Audio Center
          </span>
          <span className="text-xs font-bold text-white/80 line-clamp-1">
            {title}
          </span>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors ${
            showConfig ? 'text-[#E5A93C] bg-[#E5A93C]/10' : ''
          }`}
          title="Audio Settings"
        >
          <Settings size={14} />
        </button>
      </div>

      {/* Main Row: Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* TTS Group */}
        <div className="flex items-center gap-2">
          {!isPlayingTTS ? (
            <button
              onClick={startTTS}
              disabled={!textToRead}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E5A93C] text-black hover:bg-[#F2BE65] disabled:opacity-40 disabled:hover:bg-[#E5A93C] transition-all"
              title="Play Narration"
            >
              <Play size={16} fill="currentColor" className="ml-0.5" />
            </button>
          ) : (
            <button
              onClick={pauseTTS}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E5A93C] text-black hover:bg-[#F2BE65] transition-all"
              title="Pause Narration"
            >
              <Pause size={16} fill="currentColor" />
            </button>
          )}

          {(isPlayingTTS || isPausedTTS) && (
            <button
              onClick={stopTTS}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
              title="Stop Narration"
            >
              <Square size={12} fill="currentColor" />
            </button>
          )}

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              Narration
            </span>
            <span className="text-xs text-white/70 font-medium">
              {isPlayingTTS ? "Speaking..." : isPausedTTS ? "Paused" : "Idle"}
            </span>
          </div>
        </div>

        {/* Ambient Sound Group */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMuteAmbient}
            disabled={ambientSound === 'none'}
            className={`p-2 rounded-xl border transition-all ${
              ambientSound === 'none'
                ? 'border-white/5 text-white/20'
                : isMutedAmbient
                ? 'border-[#E85D75]/30 text-[#E85D75] bg-[#E85D75]/5'
                : 'border-[#2BB288]/30 text-[#2BB288] bg-[#2BB288]/5 animate-pulse'
            }`}
            title={isMutedAmbient ? "Unmute Ambient Sound" : "Mute Ambient Sound"}
          >
            {isMutedAmbient || ambientSound === 'none' ? (
              <VolumeX size={14} />
            ) : (
              <Volume2 size={14} />
            )}
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              Background
            </span>
            <select
              value={ambientSound}
              onChange={(e) => handleAmbientChange(e.target.value as AmbientSoundType)}
              className="text-xs font-bold text-white/80 bg-transparent border-none outline-none cursor-pointer focus:ring-0 p-0 pr-6 select-custom"
            >
              <option value="none" className="bg-[#18181b] text-white/60">Off</option>
              <option value="brown-noise" className="bg-[#18181b] text-white">Brown Noise</option>
              <option value="rain" className="bg-[#18181b] text-white">Rainy Cafe</option>
              <option value="lofi-pad" className="bg-[#18181b] text-white">Lo-fi Synth</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expanded Config Panel */}
      {showConfig && (
        <div className="border-t border-white/5 pt-3 flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-200">
          {/* TTS Speed Selection */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
              <Coffee size={10} /> Reading speed
            </span>
            <div className="flex gap-1">
              {[0.8, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${
                    ttsSpeed === speed
                      ? 'bg-[#E5A93C]/20 text-[#E5A93C] border border-[#E5A93C]/20'
                      : 'bg-white/5 text-white/40 border border-transparent hover:text-white/70 hover:bg-white/10'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassmorphicCard>
  );
}
