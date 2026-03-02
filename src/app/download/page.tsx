"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

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
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setPlatform(detectPlatform());

        // Capture PWA install prompt (Android/Desktop Chrome)
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);

        // Check if already installed
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

    const LATEST_APK_URL = "https://github.com/https-william/the-professor-ai/releases/latest/download/the-professor-release.apk";

    return (
        <div className="min-h-screen bg-[#08080E] text-white overflow-hidden">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#F59E0B]/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
                {/* Back */}
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 mb-12 transition-colors">
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Back to app
                </Link>

                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden shadow-2xl shadow-[#7C3AED]/30 ring-1 ring-white/10">
                        <img src="/icon-512.png" alt="The Professor AI" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#F59E0B] via-white to-[#7C3AED]">
                        The Professor AI
                    </h1>
                    <p className="text-white/60 text-lg max-w-md mx-auto">
                        Cheat codes for your degree. Now in your pocket.
                    </p>
                </div>

                {/* Platform-aware CTA */}
                {platform === "android" && (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 text-center">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-[#4CAF50] text-3xl">android</span>
                            <span className="text-lg font-bold">Android Detected!</span>
                        </div>
                        <p className="text-white/60 text-sm mb-6">
                            Download and install The Professor directly — no Google Play needed.
                        </p>
                        <a
                            href={LATEST_APK_URL}
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#4CAF50] text-white font-black text-lg hover:bg-[#43A047] transition-all shadow-xl shadow-[#4CAF50]/20 active:scale-95"
                            download="the-professor.apk"
                        >
                            <span className="material-symbols-outlined text-2xl">download</span>
                            Download APK — Free
                        </a>
                        <p className="mt-4 text-xs text-white/30">v1.0.0 · Android 5.0+ · ~5MB</p>
                    </div>
                )}

                {platform === "ios" && (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-white/70 text-3xl">phone_iphone</span>
                            <div>
                                <h2 className="font-bold">iPhone / iPad</h2>
                                <p className="text-xs text-white/50">Install as Home Screen App (iOS PWA)</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[
                                { n: 1, icon: "ios_share", text: "Tap the Share button in Safari (the box with an arrow)" },
                                { n: 2, icon: "add_box", text: 'Scroll down and tap "Add to Home Screen"' },
                                { n: 3, icon: "touch_app", text: 'Tap "Add" in the top right corner' },
                                { n: 4, icon: "check_circle", text: 'Find "Professor" on your home screen — done!' },
                            ].map((step) => (
                                <div key={step.n} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                                    <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center text-sm font-black shrink-0">
                                        {step.n}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-white/60">{step.icon}</span>
                                        <p className="text-sm text-white/80">{step.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                            <p className="text-xs text-[#F59E0B]">
                                ⚡ <strong>Full iOS App Store version coming soon!</strong> Apple requires a $99/yr developer subscription — we're working on it.
                            </p>
                        </div>
                    </div>
                )}

                {/* All-platform cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                    {/* Android */}
                    <div className={`p-6 rounded-2xl border transition-all ${platform === "android" ? "border-[#4CAF50]/50 bg-[#4CAF50]/5" : "border-white/10 bg-white/5"}`}>
                        <span className="material-symbols-outlined text-[#4CAF50] text-2xl mb-3 block">android</span>
                        <h3 className="font-bold mb-1">Android</h3>
                        <p className="text-xs text-white/50 mb-4">Direct APK download. No Play Store needed.</p>
                        <a href={LATEST_APK_URL} download className="text-xs text-[#4CAF50] font-bold flex items-center gap-1 hover:underline">
                            Download APK <span className="material-symbols-outlined text-xs">download</span>
                        </a>
                    </div>

                    {/* iOS */}
                    <div className={`p-6 rounded-2xl border transition-all ${platform === "ios" ? "border-white/50 bg-white/5" : "border-white/10 bg-white/5"}`}>
                        <span className="material-symbols-outlined text-white/70 text-2xl mb-3 block">phone_iphone</span>
                        <h3 className="font-bold mb-1">iPhone / iPad</h3>
                        <p className="text-xs text-white/50 mb-4">Add to Home Screen via Safari for a native feel.</p>
                        <span className="text-xs text-white/40 font-medium">Safari → Share → Add to Home Screen</span>
                    </div>

                    {/* PWA/Desktop */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <span className="material-symbols-outlined text-[#F59E0B] text-2xl mb-3 block">computer</span>
                        <h3 className="font-bold mb-1">Desktop / Chrome</h3>
                        <p className="text-xs text-white/50 mb-4">Install as an app from Chrome, Edge, or Brave.</p>
                        {deferredPrompt && !pwaInstalled ? (
                            <button onClick={handlePWAInstall} className="text-xs text-[#F59E0B] font-bold flex items-center gap-1 hover:underline">
                                Install now <span className="material-symbols-outlined text-xs">download</span>
                            </button>
                        ) : pwaInstalled ? (
                            <span className="text-xs text-[#4CAF50] font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">check_circle</span> Already installed!
                            </span>
                        ) : (
                            <span className="text-xs text-white/30">Use Chrome browser's install prompt (⋮ menu)</span>
                        )}
                    </div>
                </div>

                {/* Android install guide (collapsible) */}
                <details className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 group">
                    <summary className="cursor-pointer flex items-center justify-between font-semibold text-sm list-none">
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#4CAF50] text-base">help_outline</span>
                            How to install the Android APK
                        </span>
                        <span className="material-symbols-outlined text-white/40 group-open:rotate-180 transition-transform">expand_more</span>
                    </summary>
                    <div className="mt-4 space-y-3">
                        {[
                            { icon: "download", text: "Tap the Download APK button above — Chrome will download the file" },
                            { icon: "notifications", text: "A notification appears when download is complete — tap it, or find it in your Downloads folder" },
                            { icon: "security", text: 'If prompted "Install for unknown sources" → tap Settings → toggle ON for your browser' },
                            { icon: "install_mobile", text: "Tap the APK file → tap Install → wait a few seconds" },
                            { icon: "check_circle", text: 'Find "Professor" in your app drawer or on your home screen!' },
                        ].map((step, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-white/70">
                                <span className="material-symbols-outlined text-[#4CAF50] text-base mt-0.5 shrink-0">{step.icon}</span>
                                {step.text}
                            </div>
                        ))}
                    </div>
                </details>

                {/* Roadmap */}
                <div className="text-center">
                    <p className="text-white/30 text-sm mb-4">Coming to official stores soon</p>
                    <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                            <span className="material-symbols-outlined text-white/40">shopping_bag</span>
                            <span className="text-xs text-white/40 font-medium">Google Play — Q2 2025</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                            <span className="material-symbols-outlined text-white/40">apple</span>
                            <span className="text-xs text-white/40 font-medium">App Store — Q3 2025</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
