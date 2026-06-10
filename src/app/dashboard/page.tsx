"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useQuery } from "@tanstack/react-query";
import SEOHead, { getWebApplicationSchema, getBreadcrumbSchema } from "@/components/SEOHead";
import { useAppPlatform } from "@/hooks/useAppPlatform";
import PlatformShell from "@/components/platforms/PlatformShell";
import { createClient } from "@/lib/supabase/client";

import dynamic from "next/dynamic";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

// Platform-Specific Dashboard Components (Dynamically imported with custom skeleton fallback for client-side navigation)
const DashboardWeb = dynamic(() => import("@/components/platforms/web/DashboardWeb").catch((err) => {
    if (typeof window !== "undefined" && (err.name === "ChunkLoadError" || err.message?.includes("Failed to load chunk"))) {
        window.location.reload();
    }
    throw err;
}), { loading: () => <DashboardSkeleton /> });

const DashboardDesktop = dynamic(() => import("@/components/platforms/desktop/DashboardDesktop").catch((err) => {
    if (typeof window !== "undefined" && (err.name === "ChunkLoadError" || err.message?.includes("Failed to load chunk"))) {
        window.location.reload();
    }
    throw err;
}), { loading: () => <DashboardSkeleton /> });

const DashboardMobile = dynamic(() => import("@/components/platforms/mobile/DashboardMobile").catch((err) => {
    if (typeof window !== "undefined" && (err.name === "ChunkLoadError" || err.message?.includes("Failed to load chunk"))) {
        window.location.reload();
    }
    throw err;
}), { loading: () => <DashboardSkeleton /> });
import ShareCard from "@/components/ShareCard";
import StreakMilestone from "@/components/features/StreakMilestone";
import { LateNightGuard } from "@/components/features/LateNightGuard";

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
function getGreeting(userId?: string): string {
    const hour = new Date().getHours();
    
    // Professor-style greetings (Coffee-Shop Casual, Culturally Authentic Nigerian Lifestyle, Max 6 Words)
    const morning = [
        "Sun's barely up. You're ahead",
        "Up early. Ahead of schedule",
        "Early bird. Smart move",
        "Let's make today easy",
        "Quiet morning. Perfect study weather",
        "Filter the noise. Learn fast",
        "Gen is off. Focus restored",
        "Start smart. Free afternoon later",
        "Quick review. Wake the brain up",
        "First light. Just the facts",
        "No long talk. Let's study",
        "Dew outside. Wisdom inside",
        "Beat the morning rush",
        "Clear the queue before breakfast",
        "Skip the stress. Learn now",
        "Early reps. Permanent memory",
        "Morning clarity is unmatched",
        "New day. Same smart you",
        "Heavy lifting done early",
        "No notifications. Pure focus",
        "Wake up. Lock in",
        "Quick session. Big impact",
        "Early morning dedication. Respect",
        "Rise. Shine. Remember"
    ];
    const afternoon = [
        "Midday check-in. Standards are higher",
        "Tackle that one tough concept",
        "Lunch done. Just the good parts",
        "Smart break or smart study?",
        "Beat the midday heat",
        "No fluff. Just core concepts",
        "Focus now. More sleep later",
        "Stay sharp. Halfway there",
        "Smart reps now. Free evening",
        "Secure the win before sundown",
        "Afternoon quiet. Let's make progress",
        "Keep it brief. Keep it smart",
        "Don't let the slump win",
        "Straight to the point",
        "Clear the pending slides today",
        "Quick session. Big results",
        "Day's young. Focus is high",
        "One concept. That's all",
        "Bypass the academic jargon",
        "Afternoon push. Organize the chaos",
        "Effort now saves exam panic",
        "Understand first. Memorize later",
        "Keep the momentum alive",
        "No wasted time today"
    ];
    const evening = [
        "Evening session. Make it count",
        "Sunset scholars. Time to refine",
        "Distill knowledge. Keep it simple",
        "Smart review. Get time back",
        "Clear the noise. Lock in",
        "Prime time for active recall",
        "Secure grades before dinner",
        "Cool breeze. Clear thoughts",
        "Smart review. Sleep easy tonight",
        "One last check. Ace tomorrow",
        "Day ending. Memory peaking",
        "Clear the queue. Claim evening",
        "Evening calm. Study made simple",
        "Evening calm. Connect the dots",
        "Don't leave it for midnight",
        "Lock in concepts while fresh",
        "Wrap up notes. Enjoy tonight",
        "Quick sprint. Keep streak active",
        "Verify knowledge. Sleep in peace",
        "Less reading. More active recall",
        "Finishing touches on today's plan",
        "Put in hours. Elegant review",
        "No midnight panic needed",
        "Simplify final topics today"
    ];
    const night = [
        "Midnight oil? Do it for you",
        "Late wisdom. Quiet world",
        "Still awake? Make it count",
        "2 AM energy? Built different",
        "Inverter holding up. Quiet progress",
        "Midnight silence. Best for formulas",
        "No notifications. Just core concepts",
        "Make late night hours count",
        "Quick sprint. Clear the deck",
        "Bed calling. Just one review",
        "Burning late hours. High marks",
        "Late night clarity. Lock in",
        "Stars out. Study guide out",
        "No background noise. Pure focus",
        "Beat the sun. Lock in",
        "Late night dedication. Respect",
        "Get sorted. Ace tomorrow",
        "Late study weather. Simple bullets",
        "Skipping fluff. Just exact answers",
        "Midnight focus active. Absorb material",
        "Working while others sleep. Succeed",
        "Productive night. Easy tomorrow",
        "Quiet hours. Deep comprehension",
        "One last concept. Ace tomorrow"
    ];
    
    let hash = 0;
    if (userId) {
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
        }
    }
    const dayOfMonth = new Date().getDate();
    const idx = Math.abs(hash + dayOfMonth) % 24;

    if (hour < 5) return night[idx];
    if (hour < 12) return morning[idx];
    if (hour < 17) return afternoon[idx];
    if (hour < 22) return evening[idx];
    return night[idx];
}

export default function DashboardPage() {
    const { user, refreshUser, recoverStreak } = useUser();
    const { addToast } = useToasts();
    const { isLoaded } = useAppPlatform();
    const [milestoneToCelebrate, setMilestoneToCelebrate] = useState<number | null>(null);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [shareData, setShareData] = useState<any>(null);

    // Fetch activity data
    const { data: activityData, isLoading: activityLoading } = useQuery({
        queryKey: ['activity-history', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/user/activity-history", {
                headers: session?.access_token ? {
                    Authorization: `Bearer ${session.access_token}`
                } : undefined
            });
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        },
    });

    // Milestone & Celebration Logic (Side Effect)
    useEffect(() => {
        if (typeof window === 'undefined' || !activityData) return;

        const milestones = [7, 14, 30, 60, 100];
        const currentStreak = activityData.streak || 0;
        
        if (milestones.includes(currentStreak)) {
            const key = `milestone_celebrated_${currentStreak}`;
            const alreadyCelebrated = localStorage.getItem(key);
            
            if (!alreadyCelebrated) {
                setMilestoneToCelebrate(currentStreak);
                localStorage.setItem(key, "true");
                
                // Award Credits/XP through the dedicated activity API
                const awardMilestone = async () => {
                    const supabase = createClient();
                    const { data: { session } } = await supabase.auth.getSession();
                    return fetch("/api/user/activity", {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
                        },
                        body: JSON.stringify({
                            type: "daily_challenge",
                            customXp: currentStreak === 7 ? 25 : currentStreak === 14 ? 50 : currentStreak === 30 ? 100 : currentStreak === 60 ? 200 : 500
                        })
                    });
                };

                awardMilestone().then(() => {
                    // Only refresh user data once after the reward is posted
                    refreshUser();
                    addToast(`Check your rewards! +${currentStreak} day Milestone reached.`, "success", undefined, undefined, true);
                }).catch(err => console.error("Failed to award milestone XP:", err));
            }
        }
    }, [activityData?.streak, refreshUser, addToast]);

    // Fetch due cards
    const { data: dueData } = useQuery({
        queryKey: ['due-cards', user?.id],
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/user/due-cards", {
                headers: session?.access_token ? {
                    Authorization: `Bearer ${session.access_token}`
                } : undefined
            });
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        },
        enabled: !!user?.id,
    });
    const dueCount = dueData?.totalDue || 0;

    // Fetch study plan
    const { data: studyPlanData, isLoading: planLoading } = useQuery({
        queryKey: ['study-plan', user?.id],
        queryFn: async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch("/api/ai/study-plan", { 
                method: "POST",
                headers: session?.access_token ? {
                    Authorization: `Bearer ${session.access_token}`
                } : undefined
            });
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();
            return (data.plan || "") as string;
        },
        enabled: !!user?.id,
    });
    
    const studyPlan = studyPlanData || null;

    const canRecover = !!(user?.streak === 0 && user?.lastStreak > 0 && user?.streakResetAt && (Date.now() - new Date(user.streakResetAt).getTime()) < 24 * 60 * 60 * 1000);

    const handleRecover = async () => {
        setIsProcessingAction(true);
        const success = await recoverStreak();
        if (success) {
            addToast("Streak restored! Welcome back.", "success", "restore");
        } else {
            addToast("Recovery failed or window expired.", "error");
        }
        setIsProcessingAction(false);
    };

    const handleShareMilestone = () => {
        setShareData({
            title: `${user.streak} Day Milestone`,
            count: user.streak,
            type: "Milestone",
            user: user.name || "Scholar",
            date: new Date().toLocaleDateString()
        });
    };

    const greeting = getGreeting(user.id || undefined);
    
    if (user.isLoading) {
        return <DashboardSkeleton />;
    }

    const firstName = user.firstName || (user.name !== "Scholar" ? user.name?.split(" ")[0] : null) || user.username || user.email?.split("@")[0] || "Scholar";

    // Common props passed to each platform orchestrator
    const dashboardProps = {
        user,
        activityData,
        dueCount,
        dueData,
        studyPlan,
        planLoading,
        greeting,
        firstName,
        handleRecover,
        canRecover,
        isProcessingAction,
        handleShare: handleShareMilestone
    };

    return (
        <main className="min-h-screen bg-[#060608] text-[var(--text)] overflow-x-hidden relative">
            {/* Grid Line Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-60 z-0" />
            
            {/* Desaturated Ambient Radial Halos */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03),transparent_60%)] filter blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.02),transparent_60%)] filter blur-[120px] pointer-events-none z-0" />

            <div className="relative z-10">
                <SEOHead type="WebApplication" data={getWebApplicationSchema()} />
                <SEOHead type="BreadcrumbList" data={getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Dashboard", url: "/dashboard" }])} />

                {/* Robust Platform Selection through PlatformShell */}
                <PlatformShell
                    web={<DashboardWeb {...dashboardProps} />}
                    desktop={<DashboardDesktop {...dashboardProps} />}
                    mobile={<DashboardMobile {...dashboardProps} />}
                    loading={<DashboardSkeleton />}
                />
            </div>

            <StreakMilestone 
                count={milestoneToCelebrate || 0}
                isVisible={!!milestoneToCelebrate}
                onClose={() => setMilestoneToCelebrate(null)}
            />

            {shareData && (
                <ShareCard 
                    isOpen={!!shareData}
                    onClose={() => setShareData(null)}
                    data={shareData}
                />
            )}

            <LateNightGuard />
        </main>
    );
}

