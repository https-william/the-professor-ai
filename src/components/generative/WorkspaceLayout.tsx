import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import SubjectRenderer from "./SubjectRenderer";

export interface WorkspaceLayoutProps {
    title: string;
    sourceText: string;
    phasesData: Record<string, any>;
    onExit: () => void;
}

/**
 * WorkspaceLayout:
 * Dynamically constructs the visual components based on the subject matter 
 * analyzed from the study pack data.
 */
export default function WorkspaceLayout({ title, sourceText, phasesData, onExit }: WorkspaceLayoutProps) {
    // Basic heuristic or schema detection for Generative UI
    let subjectType = "qualitative"; // default
    
    // Check if it's quantitative based on content heuristics or AI tags
    const lowerText = sourceText.toLowerCase();
    if (
        lowerText.includes("finance") || 
        lowerText.includes("equation") || 
        lowerText.includes("calculate") || 
        lowerText.includes("mathematics") ||
        lowerText.includes("formula")
    ) {
        subjectType = "quantitative";
    } else if (
        lowerText.includes("history") ||
        lowerText.includes("timeline") ||
        lowerText.includes("century") ||
        lowerText.includes("chronological")
    ) {
        subjectType = "chronological";
    } else if (
        lowerText.includes("javascript") ||
        lowerText.includes("function") ||
        lowerText.includes("algorithm") ||
        lowerText.includes("programming") ||
        lowerText.includes("syntax")
    ) {
        subjectType = "code";
    } else if (
        lowerText.includes("anatomy") ||
        lowerText.includes("medical") ||
        lowerText.includes("clinical") ||
        lowerText.includes("pathology") ||
        lowerText.includes("physiological")
    ) {
        subjectType = "medical";
    }

    return (
        <div className="w-full min-h-[calc(100vh-6rem)] relative bg-transparent flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-7xl px-4 py-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]/80 backdrop-blur-2xl sticky top-0 z-50">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground-muted)] mb-1">
                        <BrainCircuit size={12} className="text-[var(--violet)]" />
                        <span>Study Environment</span>
                    </div>
                    <h1 className="text-xl font-black text-[var(--foreground)] uppercase tracking-wider">{title}</h1>
                </div>
                <button 
                    onClick={onExit}
                    className="px-4 py-2 bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--foreground)] rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border border-[var(--border)]"
                >
                    Save & Exit
                </button>
            </div>

            {/* Generative Core */}
            <div className="w-full max-w-7xl px-4 py-8 flex-1">
                <SubjectRenderer 
                    subjectType={subjectType} 
                    phasesData={phasesData} 
                    sourceText={sourceText} 
                />
            </div>
        </div>
    );
}
