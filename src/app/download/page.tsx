"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download, CheckCircle, HelpCircle, PhoneIphone, Laptop, Globe, Monitor } from "lucide-react";
import SEOHead, { getWebApplicationSchema } from "@/components/SEOHead";

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

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-amber-500/30 overflow-x-hidden">
            {/* ═══ Advanced AEO/SEO Layer ═══ */}
            <SEOHead type="WebApplication" data={getWebApplicationSchema()} />

            {/* Subtle ambient radial glow */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(99,102,241,0.06) 0%, transparent 70%)",
            }} />

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
                {/* Back */}
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-12 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to home
                </Link>

                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden shadow-2xl relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#7C3AED]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img src="/icon-512.png" alt="The Professor AI" className="w-full h-full object-cover shadow-2xl" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F59E0B] via-[var(--foreground)] to-[#7C3AED]">
                            The Professor AI
                        </span>
                    </h1>
                    <p className="text-[var(--foreground-secondary)] text-lg max-w-md mx-auto">
                        Cheat codes for your degree. Now in your pocket.
                    </p>
                </div>

                {/* Platform-aware CTA */}
                {platform === "android" && (
                    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-3xl p-8 mb-8 text-center clay-card-heavy">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <Monitor size={32} className="text-[#4CAF50]" />
                            <span className="text-lg font-bold">Android Detected!</span>
                        </div>
                        <p className="text-[var(--foreground-secondary)] text-sm mb-6 max-w-xs mx-auto">
                            Download and install the native Android companion directly.
                        </p>
                        <a
                            href={LATEST_APK_URL}
                            className="btn-jelly inline-flex items-center gap-3 px-10 py-4 justify-center"
                            download="the-professor.apk"
                        >
                            <Download size={20} />
                            Download APK — Free
                        </a>
                        <p className="mt-4 text-xs text-[var(--foreground-muted)]">v0.1.0 · Android 7.0+ · ~10MB</p>
                    </div>
                )}

                {/* All-platform cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {/* Android */}
                    <div className={`p-6 rounded-2xl border transition-all ${platform === "android" ? "border-[#4CAF50]/50 bg-[#4CAF50]/5" : "border-[var(--border)] bg-[var(--background-secondary)] shadow-sm"}`}>
                        <div className="flex items-center gap-2 mb-3">
                           <Monitor size={20} className="text-[#4CAF50]" />
                           <h3 className="font-bold">Android</h3>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)] mb-4">Direct APK download. Native performance.</p>
                        <a href={LATEST_APK_URL} className="text-xs text-[#4CAF50] font-bold flex items-center gap-1 hover:underline">
                            Download APK <Download size={14} />
                        </a>
                    </div>

                    {/* Windows */}
                    <div className={`p-6 rounded-2xl border transition-all ${platform === "desktop" ? "border-[#0078D4]/50 bg-[#0078D4]/5" : "border-[var(--border)] bg-[var(--background-secondary)] shadow-sm"}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Laptop size={20} className="text-[#0078D4]" />
                          <h3 className="font-bold">Windows</h3>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)] mb-4">Installer for Windows 10/11. Neural acceleration.</p>
                        <a href={LATEST_WINDOWS_URL} target="_blank" className="text-xs text-[#0078D4] font-bold flex items-center gap-1 hover:underline">
                            Get Latest .exe <Download size={14} />
                        </a>
                    </div>

                    {/* iOS */}
                    <div className={`p-6 rounded-2xl border transition-all ${platform === "ios" ? "border-[var(--foreground)]/50 bg-[var(--foreground)]/5" : "border-[var(--border)] bg-[var(--background-secondary)] shadow-sm"}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <PhoneIphone size={20} className="text-[var(--foreground-muted)]" />
                          <h3 className="font-bold">iOS</h3>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)] mb-4">Add to Home Screen via Safari for native feel.</p>
                        <span className="text-xs text-[var(--foreground-muted)] font-medium">Safari → Share → Add to Home</span>
                    </div>

                    {/* PWA/Desktop */}
                    <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Globe size={20} className="text-[#F59E0B]" />
                          <h3 className="font-bold">Web App</h3>
                        </div>
                        <p className="text-xs text-[var(--foreground-muted)] mb-4">Install as an app from any modern browser.</p>
                        {deferredPrompt && !pwaInstalled ? (
                            <button onClick={handlePWAInstall} className="text-xs text-[#F59E0B] font-bold flex items-center gap-1 hover:underline">
                                Install app <Download size={14} />
                            </button>
                        ) : pwaInstalled ? (
                            <span className="text-xs text-[var(--success)] font-bold flex items-center gap-1">
                                <CheckCircle size={14} /> Already installed!
                            </span>
                        ) : (
                            <span className="text-xs text-[var(--foreground-muted)]">Check menu for "Install App"</span>
                        )}
                    </div>
                </div>

                {/* Android install guide */}
                <details className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-8 group transition-all">
                    <summary className="cursor-pointer flex items-center justify-between font-semibold text-sm list-none">
                        <span className="flex items-center gap-2">
                            <HelpCircle size={18} className="text-[#4CAF50]" />
                            How to install the Android APK
                        </span>
                        <div className="group-open:rotate-180 transition-transform">
                          <Download size={16} className="rotate-180" />
                        </div>
                    </summary>
                    <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                        {[
                            { icon: <Download size={16} />, text: "Tap the Download APK button above — your browser will download the file" },
                            { icon: <Globe size={16} />, text: "A notification appears when complete — tap it, or find it in your Downloads folder" },
                            { icon: <Laptop size={16} />, text: 'If prompted "Install for unknown sources" → tap Settings → toggle ON for browser' },
                            { icon: <Monitor size={16} />, text: "Tap the APK file → tap Install → wait a few seconds" },
                            { icon: <CheckCircle size={16} />, text: 'Find "Professor" in your app drawer or on your home screen!' },
                        ].map((step, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-[var(--foreground-secondary)]">
                                <span className="text-[#4CAF50] mt-0.5 shrink-0">{step.icon}</span>
                                {step.text}
                            </div>
                        ))}
                    </div>
                </details>

                {/* Roadmap */}
                <div className="text-center opacity-60">
                    <p className="text-[var(--foreground-muted)] text-sm mb-4">Official store coming soon</p>
                    <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm">
                            <Monitor size={14} className="text-[var(--foreground-muted)]" />
                            <span className="text-xs font-medium">Google Play — Q2 2026</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm">
                            <PhoneIphone size={14} className="text-[var(--foreground-muted)]" />
                            <span className="text-xs font-medium">App Store — Q3 2026</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
