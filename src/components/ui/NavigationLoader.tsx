"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * NavigationLoaderContent — Internal component using useSearchParams
 */
function NavigationLoaderContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);

    // Watch for link/button clicks to start navigation loading instantly
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest("a, button, [role='button'], [onclick]");
            if (!target) return;

            const href = target.getAttribute("href");
            if (href && href.startsWith("/") && !href.startsWith("#")) {
                // If navigating to a new internal route
                if (href !== pathname) {
                    setIsNavigating(true);
                    setProgress(15);
                }
            } else {
                const text = target.textContent?.toLowerCase() || "";
                if (text.includes("login") || text.includes("sign up") || text.includes("dashboard") || text.includes("library") || text.includes("get started") || text.includes("continue") || text.includes("explore") || text.includes("create") || text.includes("ready") || text.includes("start") || text.includes("sprint") || text.includes("lab") || text.includes("feed")) {
                    setIsNavigating(true);
                    setProgress(15);
                }
            }
        };

        document.addEventListener("click", handleClick, { capture: true });
        return () => document.removeEventListener("click", handleClick, { capture: true });
    }, [pathname]);

    // Finish loading when pathname or searchParams update
    useEffect(() => {
        if (!isNavigating) return;
        setProgress(100);
        const timer = setTimeout(() => {
            setIsNavigating(false);
            setProgress(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    // Simulated progress trickle if navigation takes longer
    useEffect(() => {
        if (!isNavigating) return;
        
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + 5;
            });
        }, 150);

        return () => clearInterval(interval);
    }, [isNavigating]);

    return (
        <AnimatePresence>
            {isNavigating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1"
                >
                    {/* The main bar */}
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 40, 
                            damping: 15,
                            mass: 0.8
                        }}
                        className="h-full bg-[var(--blue)] shadow-[0_0_20px_var(--blue-glow)]"
                        style={{
                            background: "linear-gradient(90deg, transparent, var(--blue), var(--blue))",
                        }}
                    />

                    {/* Leading glow pulse - Ultra refined */}
                    <motion.div
                        animate={{ 
                            opacity: [0.2, 0.6, 0.2],
                            scaleX: [0.8, 1.2, 0.8]
                        }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="absolute top-0 right-0 w-48 h-full"
                        style={{
                            background: "radial-gradient(circle at center, var(--blue) 0%, transparent 70%)",
                            filter: "blur(8px)",
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * NavigationLoader — Global Progress Indicator wrapped in Suspense for SSR safety
 */
export default function NavigationLoader() {
    return (
        <Suspense fallback={null}>
            <NavigationLoaderContent />
        </Suspense>
    );
}
