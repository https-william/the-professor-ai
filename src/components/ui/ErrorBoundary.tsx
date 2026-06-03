"use client";

import React, { Component, ErrorInfo } from "react";
import { motion } from "framer-motion";
import BrandLogo from "./BrandLogo";
import { RefreshCcw } from "lucide-react";

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary: A premium, minimal fallback for when the scholarship hits a snag.
 */
export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidMount() {
    window.addEventListener("unhandledrejection", this.handlePromiseRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener("unhandledrejection", this.handlePromiseRejection);
  }

  private handlePromiseRejection = (event: PromiseRejectionEvent) => {
    console.error("Unhandled promise rejection caught by boundary:", event.reason);
    this.setState({ hasError: true });
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Scholarship Interrupted:", error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#08080E] relative overflow-hidden">
          {/* Atmospheric depth — Restored brand vibrancy */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }} />

          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="max-w-md w-full relative z-10"
          >
            <div className="bg-[#0C0C16]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] text-center relative overflow-hidden">
              {/* Premium top highlights */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <div className="flex justify-center mb-8">
                 <div className="relative group">
                    <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full group-hover:bg-white/20 transition-all duration-700" />
                    <div className="w-24 h-24 rounded-3xl bg-[#08080E] border border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                       <BrandLogo size="lg" />
                    </div>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Something went astray.</h1>
              <p className="text-white/50 mb-10 text-sm leading-relaxed max-w-[280px] mx-auto">
                The Professor is re-organizing his notes. A quick refresh should get the session back on track.
              </p>

              <button
                onClick={this.handleRefresh}
                className="w-full py-4.5 rounded-2xl bg-white text-[#08080E] font-black text-sm flex items-center justify-center gap-3 transition-all hover-scale-md hover:bg-neutral-100 active:scale-[0.98] shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
              >
                <RefreshCcw size={18} strokeWidth={3} className="animate-spin-slow" />
                <span>Reload Session</span>
              </button>

              <p className="mt-10 text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">
                SCHOLARSHIP ERROR BOUNDARY
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
