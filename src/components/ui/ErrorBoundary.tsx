"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import BrandLogo from "./BrandLogo";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#08080E] relative overflow-hidden">
          {/* Ambient Background Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />

          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="max-w-md w-full relative z-10"
          >
            <div className="bg-[#0C0C16]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
              {/* Internal Refraction Line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <div className="flex justify-center mb-6">
                 <div className="relative">
                   <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full animate-pulse" />
                   <div className="w-20 h-20 rounded-2xl bg-[#0C0C16] border border-white/10 flex items-center justify-center relative z-10">
                      <BrandLogo size="md" />
                   </div>
                   <div className="absolute -bottom-2 -right-2 bg-white rounded-lg p-1.5 shadow-lg border border-black/20">
                      <AlertTriangle size={16} className="text-black" />
                   </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-white mb-3">Ah, a minor mishap!</h1>
              <p className="text-white/60 mb-8 text-sm leading-relaxed">
                "It seems some of my notes have been misplaced, or perhaps the ink has spilled. Not to worry—even the best scholars face a tumble now and again. Let's get everything back in order, shall we?"
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReset}
                  className="w-full py-4 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                >
                  <RefreshCcw size={18} strokeWidth={2.5} />
                  <span>Try again, Professor</span>
                </button>
                
                <Link
                  href="/"
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-white/10"
                >
                  <Home size={18} strokeWidth={2} />
                  <span>Back to Hallway</span>
                </Link>
              </div>

              <p className="mt-8 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
                Laboratory Error Boundary
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
