
// Voice Service - Supports both Browser API and Gemini TTS

import { generateSpeech } from "./geminiService";

let synthesis: SpeechSynthesis | null = null;
let preferredVoice: SpeechSynthesisVoice | null = null;
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

if (typeof window !== 'undefined') {
    synthesis = window.speechSynthesis;
    // @ts-ignore
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
        audioContext = new AudioContextClass({ sampleRate: 24000 }); // Gemini TTS is 24kHz
    }
}

export const initVoice = () => {
    if (!synthesis) return;
    
    // Attempt to find a high-quality "Neural" or "Google" voice
    const loadVoices = () => {
        const voices = synthesis!.getVoices();
        // Priority: Google US English -> Microsoft Natural -> Default
        preferredVoice = voices.find(v => v.name.includes('Google US English')) ||
                         voices.find(v => v.name.includes('Microsoft')) ||
                         voices.find(v => v.lang === 'en-US') ||
                         voices[0];
    };

    if (synthesis.onvoiceschanged !== undefined) {
        synthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
};

const decodeAudioData = async (base64: string): Promise<AudioBuffer | null> => {
    if (!audioContext) return null;
    
    try {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Gemini returns raw PCM 24kHz Mono (1 channel)
        // We need to construct the buffer manually because decodeAudioData expects headers (WAV/MP3) 
        // which the raw stream might not have, OR if it's raw PCM we assume standard encoding.
        // Actually Gemini SDK returns standard PCM. Let's try raw buffer creation.
        
        // Convert to Int16
        const dataInt16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(dataInt16.length);
        for(let i=0; i<dataInt16.length; i++) {
            float32[i] = dataInt16[i] / 32768.0;
        }

        const buffer = audioContext.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);
        return buffer;

    } catch (e) {
        console.error("Audio Decode Error:", e);
        return null;
    }
};

export const speak = async (text: string, useNeural = true) => {
    stopSpeaking();

    // 1. Try Gemini Neural Voice (Async)
    if (useNeural && audioContext) {
        try {
            const base64Audio = await generateSpeech(text);
            if (base64Audio) {
                const buffer = await decodeAudioData(base64Audio);
                if (buffer) {
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContext.destination);
                    source.start();
                    currentSource = source;
                    return;
                }
            }
        } catch (e) {
            console.warn("Neural voice failed, falling back to browser.", e);
        }
    }

    // 2. Fallback to Browser Synthesis
    if (!synthesis) {
        console.warn("TTS not supported");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    synthesis.speak(utterance);
};

export const stopSpeaking = () => {
    if (synthesis) synthesis.cancel();
    if (currentSource) {
        try { currentSource.stop(); } catch(e) {}
        currentSource = null;
    }
};

export const isSpeaking = () => {
    return (synthesis ? synthesis.speaking : false) || !!currentSource;
};
