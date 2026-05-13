"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useToasts } from "@/components/ui/GlobalToasts";
import { useQuery } from "@tanstack/react-query";
import SEOHead, { getWebApplicationSchema, getBreadcrumbSchema } from "@/components/SEOHead";
import { useAppPlatform } from "@/hooks/useAppPlatform";
import PlatformShell from "@/components/platforms/PlatformShell";

import dynamic from "next/dynamic";

// Platform-Specific Dashboard Components (Dynamically imported for bundle optimization)
const DashboardWeb = dynamic(() => import("@/components/platforms/web/DashboardWeb"));
const DashboardDesktop = dynamic(() => import("@/components/platforms/desktop/DashboardDesktop"));
const DashboardMobile = dynamic(() => import("@/components/platforms/mobile/DashboardMobile"));
import ShareCard from "@/components/ShareCard";
import StreakMilestone from "@/components/features/StreakMilestone";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
function getGreeting(userId?: string): string {
    const hour = new Date().getHours();
    
    // Professor-style greetings (Coffee-Shop Casual)
    const morning = [
        "Rise and shine. It's early sha, but the coffee is fresh and your brain is ready",
        "Morning session? Oya, let's turn these notes into something you actually remember",
        "Early bird energy. You're up before the group chat, and that's a win",
        "Good morning. Let's make today remarkably easy on your future self"
    ];
    const afternoon = [
        "Midday check-in. How's the caffeine levels holding up?",
        "Afternoon shift. Let's tackle that one concept that's been bugging you",
        "Hope your lunch was solid. Oya, let's get back to it—just the good parts",
        "Strategic break? Or strategic study? Either way, I'm here for it"
    ];
    const evening = [
        "Evening session. Let's wrap this up so you can actually have a life tonight",
        "Sunset scholars. The hard part is over sha, now we just refine",
        "Good evening. Ready to distill some knowledge and then call it a day",
        "Wind down mode. Let's look at the highlights and then close the laptop"
    ];
    const night = [
        "Midnight oil? I hope you're doing this for you and not a deadline",
        "Late night wisdom. The world is quiet, perfect for those 'A-ha!' moments",
        "Still awake? Oya, let's make these last few minutes count so you can sleep",
        "2 AM energy? You're built different. Let's secure the bag and go to bed"
    ];
    
    let hash = 0;
    if (userId) {
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash) + userId.charCodeAt(i);
        }
    }
    const idx = Math.abs(hash) % 4;

    if (hour < 5) return night[idx];
    if (hour < 12) return morning[idx];
    if (hour < 17) return afternoon[idx];
    if (hour < 22) return evening[idx];
    return night[idx];
}

export default function DashboardPage() {
    const { user, refreshUser, buyStreakFreeze, recoverStreak } = useUser();
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
            const res = await fetch("/api/user/activity-history");
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
                fetch("/api/user/activity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "daily_challenge",
                        customXp: currentStreak === 7 ? 25 : currentStreak === 14 ? 50 : currentStreak === 30 ? 100 : currentStreak === 60 ? 200 : 500
                    })
                }).then(() => {
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
            const res = await fetch("/api/user/due-cards");
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
            const res = await fetch("/api/ai/study-plan", { method: "POST" });
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();
            return (data.plan || "") as string;
        },
        enabled: !!user?.id,
    });
    
    const studyPlan = studyPlanData || null;

    const canRecover = !!(user?.streak === 0 && user?.lastStreak > 0 && user?.streakResetAt && (Date.now() - new Date(user.streakResetAt).getTime()) < 24 * 60 * 60 * 1000);

    const handleBuyFreeze = async () => {
        setIsProcessingAction(true);
        const success = await buyStreakFreeze();
        if (success) {
            addToast("Streak Freeze banked!", "success", "ac_unit");
        } else {
            addToast("Failed to buy freeze. Check your credits.", "error");
        }
        setIsProcessingAction(false);
    };

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

    const handleShareMastery = () => {
        setShareData({
            title: `${user.streak} Day Mastery`,
            count: user.streak,
            type: "Mastery",
            user: user.name || "Scholar",
            date: new Date().toLocaleDateString()
        });
    };

    const greeting = getGreeting(user.id || undefined);
    
    if (user.isLoading || !user.name || user.name.includes("@")) {
        return <DashboardSkeleton />;
    }

    const firstName = user.name?.split(" ")[0] || "Scholar";

    // Common props passed to each platform orchestrator
    const dashboardProps = {
        user,
        activityData,
        dueCount,
        studyPlan,
        planLoading,
        greeting,
        firstName,
        handleRecover,
        canRecover,
        isProcessingAction,
        handleBuyFreeze,
        handleShare: handleShareMastery
    };

    return (
        <main className="min-h-screen bg-transparent text-[var(--text)] overflow-x-hidden">
            <SEOHead type="WebApplication" data={getWebApplicationSchema()} />
            <SEOHead type="BreadcrumbList" data={getBreadcrumbSchema([{ name: "Home", url: "/" }, { name: "Dashboard", url: "/dashboard" }])} />

            {/* Robust Platform Selection through PlatformShell */}
            <PlatformShell
                web={<DashboardWeb {...dashboardProps} />}
                desktop={<DashboardDesktop {...dashboardProps} />}
                mobile={<DashboardMobile {...dashboardProps} />}
                loading={<DashboardSkeleton />}
            />

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
        </main>
    );
}

