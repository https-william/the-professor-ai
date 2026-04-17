"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    CalendarCheck2, 
    Layers, 
    HelpCircle, 
    FileText 
} from "lucide-react";

const MODERN_ICON_MAP: Record<string, any> = {
    style: Layers,
    quiz: HelpCircle,
    description: FileText,
};

/* ═══════════════════════════════════════════════════
   SM-2 SPACED REPETITION INTERVALS
   ═══════════════════════════════════════════════════ */
const SM2_INTERVALS = [1, 3, 7, 14, 30, 60]; // Days between reviews

function getReviewDates(createdAt: Date): Date[] {
    const dates: Date[] = [];
    let accumulatedDays = 0;
    for (const interval of SM2_INTERVALS) {
        accumulatedDays += interval;
        const reviewDate = new Date(createdAt);
        reviewDate.setDate(reviewDate.getDate() + accumulatedDays);
        reviewDate.setHours(0, 0, 0, 0);
        dates.push(reviewDate);
    }
    return dates;
}

function getUrgency(dueDate: Date, today: Date): "overdue" | "today" | "upcoming" {
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const todayNorm = new Date(today);
    todayNorm.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((due.getTime() - todayNorm.getTime()) / 86400000);
    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "today";
    return "upcoming";
}

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */
interface ReviewItem {
    id: string;
    title: string;
    type: "flashcards" | "quiz" | "summary";
    dueDate: Date;
    urgency: "overdue" | "today" | "upcoming";
    reviewNumber: number; // Which SM-2 interval this is (1st, 2nd, 3rd...)
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    reviews: ReviewItem[];
}

/* ═══════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════ */
const urgencyColors = {
    overdue: { bg: "var(--error)", text: "#ef4444", label: "Overdue" },
    today: { bg: "var(--accent)", text: "#F59E0B", label: "Due Today" },
    upcoming: { bg: "var(--success)", text: "#22c55e", label: "Upcoming" },
};

const typeIcons: Record<string, string> = {
    flashcards: "style",
    quiz: "quiz",
    summary: "description",
};

/* ═══════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════ */
export default function SpacedRepetitionCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchReviewItems();
    }, []);

    const fetchReviewItems = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: generations } = await supabase
                .from("generations")
                .select("id, title, type, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(30);

            if (generations) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const items: ReviewItem[] = [];

                for (const gen of generations) {
                    const createdAt = new Date(gen.created_at);
                    const reviewDates = getReviewDates(createdAt);

                    for (let i = 0; i < reviewDates.length; i++) {
                        const dueDate = reviewDates[i];
                        const urgency = getUrgency(dueDate, today);

                        // Only include reviews that are within a reasonable window
                        // (overdue up to 30 days, upcoming up to 60 days)
                        const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);
                        if (diffDays >= -30 && diffDays <= 60) {
                            items.push({
                                id: `${gen.id}-r${i}`,
                                title: gen.title,
                                type: gen.type as "flashcards" | "quiz" | "summary",
                                dueDate,
                                urgency,
                                reviewNumber: i + 1,
                            });
                        }
                    }
                }

                setReviewItems(items);
            }
        } catch (error) {
            console.error("Error fetching review items:", error);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date: Date): CalendarDay[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = (firstDay.getDay() + 6) % 7; // Monday start
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days: CalendarDay[] = [];

        // Previous month padding
        for (let i = startPadding - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            d.setHours(0, 0, 0, 0);
            days.push({
                date: d,
                isCurrentMonth: false,
                isToday: false,
                reviews: getReviewsForDate(d),
            });
        }

        // Current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            d.setHours(0, 0, 0, 0);
            days.push({
                date: d,
                isCurrentMonth: true,
                isToday: d.getTime() === today.getTime(),
                reviews: getReviewsForDate(d),
            });
        }

        // Next month padding
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(year, month + 1, i);
            d.setHours(0, 0, 0, 0);
            days.push({
                date: d,
                isCurrentMonth: false,
                isToday: false,
                reviews: getReviewsForDate(d),
            });
        }

        return days;
    };

    const getReviewsForDate = (date: Date): ReviewItem[] => {
        return reviewItems.filter(
            (item) => item.dueDate.toDateString() === date.toDateString()
        );
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const formatMonth = (date: Date) => {
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    const days = getDaysInMonth(currentDate);
    const selectedDay = selectedDate
        ? days.find((d) => d.date.toDateString() === selectedDate.toDateString())
        : null;

    // Summary stats
    const overdueCount = reviewItems.filter(r => r.urgency === "overdue").length;
    const todayCount = reviewItems.filter(r => r.urgency === "today").length;
    const upcomingCount = reviewItems.filter(r => r.urgency === "upcoming").length;

    if (loading) {
        return (
            <div className="bg-[var(--card)] border border-[var(--card-border)] shadow-[inset_0_1px_1px_var(--accent-glow),0_4px_24px_var(--shadow)] rounded-[28px] p-8 min-h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                        <Calendar size={32} strokeWidth={1.5} className="text-[var(--secondary)] opacity-40" />
                    </motion.div>
                    <p className="text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest animate-pulse">Loading schedule...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--card)] border border-[var(--card-border)] shadow-[inset_0_1px_1px_var(--accent-glow),0_4px_24px_var(--shadow)] rounded-[28px] overflow-hidden max-w-md mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--card-border)]">
                <button
                    onClick={prevMonth}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--foreground)]/5 transition-colors"
                >
                    <ChevronLeft size={18} strokeWidth={1.5} className="text-[var(--foreground-muted)]" />
                </button>
                <h3 className="text-base font-bold text-[var(--foreground)]">{formatMonth(currentDate)}</h3>
                <button
                    onClick={nextMonth}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--foreground)]/5 transition-colors"
                >
                    <ChevronRight size={18} strokeWidth={1.5} className="text-[var(--foreground-muted)]" />
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 px-4 pt-4 pb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]/40">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 px-4 pb-4 gap-1">
                {days.map((day, idx) => {
                    const hasReviews = day.reviews.length > 0;
                    const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                    const hasOverdue = day.reviews.some(r => r.urgency === "overdue");
                    const hasToday = day.reviews.some(r => r.urgency === "today");

                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedDate(day.date)}
                            className={`
                                relative aspect-square rounded-xl flex flex-col items-center justify-start pt-2 transition-all duration-200
                                ${day.isCurrentMonth ? "hover:bg-[var(--foreground)]/5" : "opacity-25"}
                                ${day.isToday ? "bg-[var(--accent)]/8 border border-[var(--accent)]/20" : ""}
                                ${isSelected ? "bg-[var(--foreground)]/8 ring-1 ring-[var(--foreground)]/15" : ""}
                            `}
                        >
                            <span className={`text-[13px] font-medium ${
                                day.isToday ? "text-[var(--accent)] font-bold" :
                                day.isCurrentMonth ? "text-[var(--foreground)]" :
                                "text-[var(--foreground-muted)]"
                            }`}>
                                {day.date.getDate()}
                            </span>

                            {/* Review indicators */}
                            {hasReviews && (
                                <div className="flex gap-[3px] mt-1">
                                    {day.reviews.slice(0, 3).map((review, i) => (
                                        <div
                                            key={i}
                                            className="w-[5px] h-[5px] rounded-full"
                                            style={{ background: urgencyColors[review.urgency].text }}
                                        />
                                    ))}
                                    {day.reviews.length > 3 && (
                                        <span className="text-[7px] text-[var(--foreground-muted)] font-bold ml-0.5">+{day.reviews.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected Day Details */}
            <AnimatePresence mode="wait">
                {selectedDay && selectedDate && (
                    <motion.div
                        key={selectedDate.toISOString()}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[var(--card-border)]"
                    >
                        <div className="p-5">
                            <h4 className="text-[12px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-4">
                                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                            </h4>

                            {selectedDay.reviews.length === 0 ? (
                                <div className="text-center py-6">
                                    <CalendarCheck2 size={32} strokeWidth={1.5} className="text-[var(--foreground-muted)]/15 mb-2 mx-auto" />
                                    <p className="text-[var(--foreground-muted)] text-[13px]">Nothing scheduled</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedDay.reviews.map((item) => {
                                        const colors = urgencyColors[item.urgency];
                                        const href = item.type === "quiz" ? `/quiz?id=${item.id.split('-r')[0]}` :
                                                     item.type === "summary" ? `/summary?id=${item.id.split('-r')[0]}` :
                                                     `/flashcards?id=${item.id.split('-r')[0]}`;

                                        return (
                                            <Link
                                                key={item.id}
                                                href={href}
                                                className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-[var(--foreground)]/[0.03] group"
                                            >
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                                    style={{ background: `color-mix(in srgb, ${colors.text} 12%, transparent)` }}
                                                >
                                                    {(() => {
                                                        const IconComp = MODERN_ICON_MAP[typeIcons[item.type]] || FileText;
                                                        return <IconComp size={16} strokeWidth={1.5} style={{ color: colors.text }} />;
                                                    })()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[var(--foreground)] text-[13px] truncate group-hover:text-[var(--accent)] transition-colors">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--foreground-muted)]">
                                                        Review #{item.reviewNumber} · {item.type}
                                                    </p>
                                                </div>
                                                <span
                                                    className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase shrink-0"
                                                    style={{ background: `color-mix(in srgb, ${colors.text} 12%, transparent)`, color: colors.text }}
                                                >
                                                    {colors.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Footer */}
            <div className="flex items-center justify-around px-4 py-4 border-t border-[var(--card-border)]">
                <div className="text-center">
                    <p className="text-xl font-bold" style={{ color: urgencyColors.overdue.text }}>{overdueCount}</p>
                    <p className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider font-bold">Overdue</p>
                </div>
                <div className="w-px h-8 bg-[var(--card-border)]" />
                <div className="text-center">
                    <p className="text-xl font-bold" style={{ color: urgencyColors.today.text }}>{todayCount}</p>
                    <p className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider font-bold">Due Today</p>
                </div>
                <div className="w-px h-8 bg-[var(--card-border)]" />
                <div className="text-center">
                    <p className="text-xl font-bold" style={{ color: urgencyColors.upcoming.text }}>{upcomingCount}</p>
                    <p className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider font-bold">Upcoming</p>
                </div>
            </div>
        </div>
    );
}
