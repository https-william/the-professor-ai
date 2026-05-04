"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface LandingUploadProps {
  compact?: boolean;
}

export default function LandingUpload({ compact = false }: LandingUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setIsUploading(true);

      // Persist metadata for onboarding
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_upload_name", selectedFile.name);
        // We'd normally upload to a temp bucket here, but for now we'll simulate processing
      }

      setTimeout(() => {
        router.push("/onboarding/processing");
      }, 800);
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false,
    disabled: isUploading
  });

  return (
    <div className={cn("w-full max-w-2xl mx-auto", compact ? "mt-4" : "mt-8 md:mt-12")}>
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer transition-all duration-500 rounded-[2rem] p-1",
          isDragActive ? "scale-[1.02]" : "hover:scale-[1.01]"
        )}
      >
        {/* Animated Border Gradient */}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-[var(--border)] via-[var(--foreground)] to-[var(--border)] opacity-20 group-hover:opacity-40 transition-opacity animate-shimmer-sweep" style={{ backgroundSize: '200% auto' }} />

        {/* Inner Content */}
        <div className="relative bg-[var(--background-secondary)] rounded-[calc(2rem-1px)] p-8 md:p-12 border border-[var(--border)] flex flex-col items-center text-center overflow-hidden">
          
          {/* Decorative Orbs */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-[var(--foreground)] opacity-[0.03] blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[var(--foreground)] opacity-[0.03] blur-3xl rounded-full pointer-events-none" />

          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--foreground)]/5 flex items-center justify-center mb-6 relative">
                  <Loader2 className="w-8 h-8 text-[var(--foreground)] animate-spin" />
                  <motion.div 
                    className="absolute inset-0 rounded-2xl border-2 border-[var(--foreground)]"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">The Professor is ready</h3>
                <p className="text-[var(--foreground-muted)] text-sm italic">"Let's see what we're working with..."</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center w-full"
              >
                <div className={cn(
                  "w-20 h-20 rounded-3xl mb-8 flex items-center justify-center transition-all duration-500",
                  isDragActive ? "bg-[var(--foreground)] text-[var(--background)] rotate-12 scale-110" : "bg-[var(--foreground)]/5 text-[var(--foreground-muted)] group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)] group-hover:-rotate-6"
                )}>
                  {isDragActive ? <Sparkles size={32} /> : <Upload size={32} strokeWidth={1.5} />}
                </div>

                <h3 className="text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tight mb-3">
                  {isDragActive ? "Drop them here" : "Try it free — no account needed"}
                </h3>
                
                <p className="text-[var(--foreground-secondary)] max-w-sm mx-auto mb-8 font-medium">
                  Upload your lecture notes, syllabus, or textbooks to start your first lesson.
                </p>

                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <span className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--background)] text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] flex items-center gap-2">
                    <FileText size={12} /> PDF
                  </span>
                  <span className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--background)] text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] flex items-center gap-2">
                    <FileText size={12} /> DOCX
                  </span>
                  <span className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--background)] text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] flex items-center gap-2">
                    <FileText size={12} /> TXT
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-[0.2em] opacity-60">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  No signup required  •  Joined by 1,000+ students across Nigeria 🇳🇬
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <input {...getInputProps()} />
        </div>
      </div>
      
      {!isUploading && (
        <p className="text-center mt-6 text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest opacity-40">
          Max 25MB per file • Privacy first
        </p>
      )}
    </div>
  );
}
