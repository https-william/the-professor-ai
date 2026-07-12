"use client";

import React from "react";
import DashboardCommandCenter from "@/components/features/dashboard/DashboardCommandCenter";
import { computeFileHash } from "@/lib/hash";
import { useIngestStore } from "@/store/useIngestStore";

interface DashboardWebProps {
    user: any;
    activityData: any;
    dueCount: number;
    dueData: any;
    studyPlan: string | null;
    planLoading: boolean;
    greeting: string;
    firstName: string;
    handleRecover: () => void;
    canRecover: boolean;
    isProcessingAction: boolean;
    handleShare?: () => void;
    inputText: string;
    setInputText: (text: string) => void;
    activeTab: 'upload' | 'text';
    setActiveTab: (tab: 'upload' | 'text') => void;
    missionTitle: string;
    setMissionTitle: (title: string) => void;
    userEditedTitle: boolean;
    setUserEditedTitle: (edited: boolean) => void;
    queue: any[];
    isQueueProcessing: boolean;
    hasSuccess: boolean;
    showConfigAndActions: boolean;
    setupError: string | null;
    setSetupError: (error: string | null) => void;
    handleGenerate: (cardCount?: number, quizCount?: number) => void;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleUploadClick: (e: React.MouseEvent) => void;
    resetSelection: () => void;
    loadDemo: (type: 'mitosis' | 'contract') => void;
    isGeneratingPack: boolean;
    setIsGeneratingPack: (v: boolean) => void;
    trickleProgress: Record<string, number>;
    filePhraseIndex: Record<string, number>;
    customStatusMsg: Record<string, string>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    processingText?: string;
    progress?: number;
}

export default function DashboardWeb({
    greeting,
    firstName,
    activityData,
    inputText,
    setInputText,
    setMissionTitle,
    setUserEditedTitle,
    handleGenerate,
    isGeneratingPack,
    queue,
    loadDemo,
    processingText,
    progress = 0
}: DashboardWebProps) {
    const { addFiles } = useIngestStore();

    const handleFile = async (file: File) => {
        const hashId = await computeFileHash(file);
        addFiles([file], [hashId]);
    };

    const handleTextSubmit = (text: string, title?: string) => {
        setInputText(text);
        if (title) {
            setMissionTitle(title);
            setUserEditedTitle(true);
        }
        setTimeout(() => {
            handleGenerate(15, 15);
        }, 100);
    };

    const isProcessing = isGeneratingPack || queue.some(i => i.status === "uploading" || i.status === "reading" || i.status === "learning");

    return (
        <DashboardCommandCenter
            greeting={greeting}
            firstName={firstName}
            activityData={activityData}
            onFileSelect={handleFile}
            onTextSubmit={handleTextSubmit}
            isProcessing={isProcessing}
            processingText={processingText}
            progress={progress}
            onLoadDemo={loadDemo}
        />
    );
}
