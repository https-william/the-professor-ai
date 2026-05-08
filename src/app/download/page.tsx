"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, 
    Download, 
    CheckCircle, 
    HelpCircle, 
    Smartphone, 
    Laptop, 
    Globe, 
    Monitor,
    Zap,
    Cpu,
    SmartphoneNfc,
    ShieldCheck,
    ChevronRight,
    Star
} from "lucide-react";
import SEOHead, { getWebApplicationSchema } from "@/components/SEOHead";
import { cn } from "@/lib/utils";

type Platform = "android" | "ios" | "desktop" | null;

function detectPlatform(): Platform {
    if (typeof navigator === "undefined") return null;
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "android";
    if (/iphone|ipad|ipod/i.test(ua)) return "ios";
    return "desktop";
}

export default function DownloadPage() {
    const [platform, setPlatform] = useState<Platform>(null);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [pwaInstalled, setPwaInstalled] = useState(false);

    useEffect(() => {
        setPlatform(detectPlatform());

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);

        if (window.matchMedia("(display-mode: standalone)").matches) {
            setPwaInstalled(true);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handlePWAInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setPwaInstalled(true);
                setDeferredPrompt(null);
            }
        }
    };

    const LATEST_APK_URL = "https://github.com/https-william/the-professor-ai/releases/latest/download/app-debug.apk";
    const LATEST_WINDOWS_URL = "https://github.com/https-william/the-professor-ai/releases/latest";

    const PLATFORMS = [
        { 
            id: "android", 
            name: "Android", 
            icon: SmartphoneNfc, 
            color: "#4CAF50", 
            desc: "Direct APK. Native neural engine.",
            action: { label: "Download APK", href: LATEST_APK_URL } 
        },
        { 
            id: "desktop", 
            name: "Windows", 
            icon: Laptop, 
            color: "#0078D4", 
            desc: "Installer for Win 10/11. High fidelity.",
            action: { label: "Get Latest .exe", href: LATEST_WINDOWS_URL } 
        },
        { 
            id: "ios", 
            name: "iOS", 
            icon: Smartphone, 
            color: "#FFFFFF", 
            desc: "PWA Companion. Add to Home Screen.",
            action: { label: "Safari → Share", href: "#" } 
        },
        { 
            id: "web", 
            name: "Web App", 
            icon: Globe, 
            color: "#F59E0B", 
            desc: "Universal access. Offline support.",
            action: { label: "Install as App", onClick: handlePWAInstall } 
        },
    ];

    return (
        <div className="min-h-screen bg-[#08080E] text-[var(--foreground)] selection:bg-[var(--blue-dim)] overflow-x-hidden font-sans">
            {/* ═══ Advanced AEO/SEO Layer ═══ */}
            <SEOHead type="WebApplication" data={getWebApplicationSchema()} />

            {/* Cinematic Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.15),transparent)]" />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[var(--blue)]/5 to-transparent" />
                
                {/* Floating Glimmer Line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
                {/* Back Link */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors mb-16 group">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Archives
                    </Link>
                </motion.div>

                {/* Volumetric Hero */}
                <div className="flex flex-col items-center text-center mb-24">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative mb-10"
                    >
                        {/* Recursive Glow Rings */}
                        <div className="absolute inset-0 rounded-[2.5rem] bg-[#316fae]/20 blur-3xl animate-pulse" />
                        <div className="relative w-32 h-32 md:w-48 md:h-48 aspect-square rounded-[2rem] overflow-hidden glass-skeuo border border-white/10 shadow-2xl p-6 md:p-8">
                        <img 
                            src="/brand/professor-og-logo.svg" 
                            alt="The Professor AI" 
                            className="w-full h-full object-contain filter drop-shadow-2xl"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/20 via-transparent to-transparent pointer-events-none" />
                    </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-[0.95]">
                            Take the Professor<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--blue-light)] via-[var(--blue)] to-[var(--blue-dark)]">Mobile. Native. Everywhere.</span>
                        </h1>
                        <p className="text-white/40 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
                            Cheat codes for your degree, optimized for the device in your hand. Performance is shared, focus is localized.
                        </p>
                    </motion.div>
                </div>

                {/* Recommended Section (Platform Aware) */}
                {platform && platform !== "ios" && (
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-20"
                    >
                        <div className="relative p-[1px] rounded-[3rem] bg-gradient-to-br from-[var(--blue)]/40 via-white/5 to-white/5 overflow-hidden group">
                           <div className="relative bg-[#0A0A10]/90 backdrop-blur-3xl rounded-[calc(3rem-1px)] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                               <div className="w-24 h-24 rounded-3xl bg-[var(--blue-dim)] border border-[var(--blue-border)] flex items-center justify-center shadow-inner shrink-0">
                                   {platform === "android" ? <SmartphoneNfc size={48} className="text-[var(--blue)]" /> : <Monitor size={48} className="text-[var(--blue)]" />}
                               </div>
                               <div className="text-center md:text-left flex-1">
                                   <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
                                       <span className="px-3 py-1 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] text-[10px] font-black uppercase tracking-widest border border-[var(--blue-border)]">Recommended for You</span>
                                       <h2 className="text-2xl font-black text-white">{platform === "android" ? "The Android App" : "The Windows Client"}</h2>
                                   </div>
                                   <p className="text-white/40 font-medium mb-8 leading-relaxed max-w-lg">
                                       Experience the fastest generation speeds with our direct-to-metal {platform === "android" ? "Android APK" : "Windows Installer"}. 
                                   </p>
                                   <div className="relative inline-block">
                                       <div 
                                          className="btn-skeuo-primary px-10 py-4 inline-flex items-center gap-3 grayscale opacity-60 cursor-not-allowed pointer-events-none"
                                       >
                                           <Download size={20} />
                                           Get the Native App
                                       </div>
                                       <span className="absolute -top-3 -right-6 px-3 py-1 bg-[var(--blue)] text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-2xl rotate-12 ring-2 ring-[#08080E] animate-pulse">
                                           Coming Soon!!
                                       </span>
                                   </div>
                               </div>
                               <div className="hidden lg:block w-px h-24 bg-white/5" />
                               <div className="hidden lg:grid grid-cols-1 gap-4">
                                   <div className="flex items-center gap-3">
                                       <Zap size={14} className="text-[var(--blue)]" />
                                       <span className="text-[11px] font-bold text-white/60">60FPS Fluid UI</span>
                                   </div>
                                   <div className="flex items-center gap-3">
                                       <Cpu size={14} className="text-[var(--blue)]" />
                                       <span className="text-[11px] font-bold text-white/60">Neural Cache</span>
                                   </div>
                                   <div className="flex items-center gap-3">
                                       <ShieldCheck size={14} className="text-[var(--blue)]" />
                                       <span className="text-[11px] font-bold text-white/60">Encrypted Vault</span>
                                   </div>
                               </div>
                           </div>
                        </div>
                    </motion.div>
                )}

                {/* Platform Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-24">
                    {PLATFORMS.map((p, i) => (
                        <motion.div 
                            key={p.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            className="group relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                            <div className="relative bg-white/[0.03] border border-white/10 p-7 rounded-[2rem] h-full flex flex-col transition-all hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                                    <p.icon size={24} style={{ color: p.color }} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-black text-white mb-2">{p.name}</h3>
                                <p className="text-[13px] text-white/30 font-medium leading-relaxed mb-8 flex-1">{p.desc}</p>
                                
                                {p.action.onClick ? (
                                    <button 
                                        onClick={p.action.onClick}
                                        className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                                        style={{ color: p.color }}
                                    >
                                        {deferredPrompt && !pwaInstalled ? p.action.label : pwaInstalled ? "Active" : "Check Menu"}
                                        <ChevronRight size={14} />
                                    </button>
                                ) : (
                                    <div className="relative">
                                        <div 
                                            className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 opacity-40 cursor-not-allowed"
                                            style={{ color: p.color }}
                                        >
                                            {p.action.label}
                                            <ChevronRight size={14} />
                                        </div>
                                        <span className="absolute -top-2 -right-4 px-2 py-0.5 bg-[var(--blue)] text-white text-[7px] font-black uppercase tracking-tighter rounded-full shadow-xl">
                                            Soon
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Installation Journey */}
                <div className="max-w-xl mx-auto mb-24">
                    <div className="text-center mb-12">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--blue)] mb-4 block">Deployment Guide</span>
                        <h2 className="text-3xl font-black text-white">How to Install</h2>
                    </div>
                    
                    <div className="space-y-6 relative">
                        {/* Connector Line */}
                        <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-[var(--blue)] via-white/5 to-transparent" />
                        
                        {[
                            { title: "Acquire Artifact", desc: "Download the native archive (.apk or .exe) from the anchors above." },
                            { title: "Security Permission", desc: "If prompted, allow your system or browser to 'Install from unknown sources'." },
                            { title: "Initialize Core", desc: "Launch the installer or tap the APK to begin the synthesis process." },
                            { title: "Mastery Entry", desc: "Find 'The Professor' in your apps and log in to sync your archives." }
                        ].map((step, i) => (
                            <motion.div 
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-6 relative z-10"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-[#0A0A10] border border-white/10 flex items-center justify-center shrink-0 shadow-2xl">
                                    <span className="text-lg font-black text-[var(--blue)]">{i + 1}</span>
                                </div>
                                <div className="pt-2">
                                    <h4 className="text-[15px] font-black text-white mb-1">{step.title}</h4>
                                    <p className="text-[13px] text-white/40 font-medium leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Trust Footer */}
                <div className="flex flex-col items-center text-center opacity-40">
                    <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" className="text-[var(--blue)]" />)}
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest mb-2 text-white">Direct Repository Access</p>
                    <p className="text-[10px] text-white/30 max-w-xs font-medium">Verify all binaries via the official GitHub repository releases page.</p>
                </div>
            </div>
        </div>
    );
}
