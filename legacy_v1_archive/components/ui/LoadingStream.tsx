import React, { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
    "Consulting the Archives...",
    "Synthesizing Neural Pathways...",
    "Forging Knowledge Shards...",
    "Analyzing Study Patterns...",
    "Calibrating Hydra Engine...",
    "Connecting to the Collective...",
    "Decrypting Academic data...",
    "The Professor is reorganizing his library..."
];

export const LoadingStream: React.FC<{ initialText?: string }> = ({ initialText }) => {
    const [currentText, setCurrentText] = useState(initialText || LOADING_MESSAGES[0]);
    const [display, setDisplay] = useState('');
    const [msgIndex, setMsgIndex] = useState(0);

    // Typing Effect
    useEffect(() => {
        let i = 0;
        setDisplay('');
        const typeInterval = setInterval(() => {
            if (i < currentText.length) {
                setDisplay(prev => prev + currentText.charAt(i));
                i++;
            } else {
                clearInterval(typeInterval);
                // Wait then switch message
                setTimeout(() => {
                    const next = (msgIndex + 1) % LOADING_MESSAGES.length;
                    setMsgIndex(next);
                    setCurrentText(LOADING_MESSAGES[next]);
                }, 3000);
            }
        }, 50); // Typing speed

        return () => clearInterval(typeInterval);
    }, [currentText]);

    return (
        <div className="font-mono text-xs md:text-sm text-accent uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            {display}
            <span className="animate-pulse">_</span>
        </div>
    );
};
