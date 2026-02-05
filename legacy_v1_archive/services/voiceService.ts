
// Voice Service - Browser Native Only (Gemini TTS Removed)

let synthesis: SpeechSynthesis | null = null;
let preferredVoice: SpeechSynthesisVoice | null = null;

if (typeof window !== 'undefined') {
    synthesis = window.speechSynthesis;
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

export const speak = (text: string) => {
    stopSpeaking();

    // Fallback to Browser Synthesis
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
};

export const isSpeaking = () => {
    return (synthesis ? synthesis.speaking : false);
};
