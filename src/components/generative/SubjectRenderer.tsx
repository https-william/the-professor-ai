import React from "react";
import CalculationGrid from "./modules/CalculationGrid";
import ConceptTimeline from "./modules/ConceptTimeline";
import CodePlayground from "./modules/CodePlayground";
import VisualAnatomy from "./modules/VisualAnatomy";

// Fallback to legacy layout if needed
import { InteractiveSummary } from "@/components/features/InteractiveSummary";
import { InteractiveFlashcards } from "@/components/features/InteractiveFlashcards";
import { InteractiveQuiz } from "@/components/features/InteractiveQuiz";

export interface SubjectRendererProps {
    subjectType: string;
    phasesData: Record<string, any>;
    sourceText: string;
}

export default function SubjectRenderer({ subjectType, phasesData, sourceText }: SubjectRendererProps) {
    if (subjectType === "quantitative") {
        return (
            <div className="space-y-8">
                <CalculationGrid data={phasesData.distill || sourceText} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <InteractiveFlashcards data={phasesData.retain} />
                    <InteractiveQuiz data={phasesData.test} />
                </div>
            </div>
        );
    }

    if (subjectType === "chronological") {
        return (
            <div className="space-y-8">
                <ConceptTimeline data={phasesData.distill || sourceText} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <InteractiveFlashcards data={phasesData.retain} />
                    <InteractiveQuiz data={phasesData.test} />
                </div>
            </div>
        );
    }

    if (subjectType === "code") {
        return (
            <div className="space-y-8">
                <CodePlayground data={phasesData.distill || sourceText} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <InteractiveFlashcards data={phasesData.retain} />
                    <InteractiveQuiz data={phasesData.test} />
                </div>
            </div>
        );
    }

    if (subjectType === "medical") {
        return (
            <div className="space-y-8">
                <VisualAnatomy data={phasesData.distill || sourceText} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <InteractiveFlashcards data={phasesData.retain} />
                    <InteractiveQuiz data={phasesData.test} />
                </div>
            </div>
        );
    }

    // Default Qualitative / Legacy Template Mapping
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <InteractiveSummary content={phasesData.distill} />
                <InteractiveQuiz data={phasesData.test} />
            </div>
            <div className="space-y-8">
                <InteractiveFlashcards data={phasesData.retain} />
            </div>
        </div>
    );
}
