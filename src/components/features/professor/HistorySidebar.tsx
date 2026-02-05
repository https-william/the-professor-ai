"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { FileText, MessageSquare, GraduationCap, X, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HistorySidebar({ isOpen, onClose }: HistorySidebarProps) {
    const [files, setFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (isOpen) {
            fetchFiles();
        }
    }, [isOpen]);

    const fetchFiles = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.storage.from('documents').list();
        if (!error && data) {
            setFiles(data);
        }
        setIsLoading(false);
    };

    const deleteFile = async (name: string) => {
        const { error } = await supabase.storage.from('documents').remove([name]);
        if (!error) {
            fetchFiles();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed left-0 top-0 bottom-0 w-80 bg-[#0A0A0A] border-r border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="font-serif font-bold text-lg text-white/90">Archives</h2>
                            <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-6">
                                {/* Section: Chats (Mocked for now) */}
                                <div>
                                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" /> Recent Lectures
                                    </h3>
                                    <div className="space-y-1">
                                        <div className="p-2 rounded-lg bg-white/5 text-sm text-gray-300 hover:bg-white/10 cursor-pointer transition-colors truncate">
                                            Current Session
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Files */}
                                <div>
                                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Knowledge Base
                                    </h3>

                                    {isLoading ? (
                                        <div className="flex justify-center p-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : files.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic px-2">No documents archived.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {files.map((file) => (
                                                <div key={file.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-sm">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileText className="w-4 h-4 text-teal-500 shrink-0" />
                                                        <span className="text-gray-300 truncate" title={file.name}>{file.name}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                        onClick={() => deleteFile(file.name)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Section: Exams (Mocked) */}
                                <div>
                                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <GraduationCap className="w-3 h-3" /> Exam Records
                                    </h3>
                                    <p className="text-xs text-muted-foreground italic px-2">No exams taken yet.</p>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t border-white/5 bg-black/20">
                            <div className="text-xs text-center text-muted-foreground">
                                The Professor V2.0
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
