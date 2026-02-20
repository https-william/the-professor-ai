/**
 * SM-2 Spaced Repetition Algorithm
 * Based on SuperMemo 2 by Piotr Wozniak
 *
 * Quality ratings:
 *   0 = "Blackout" — Complete failure to recall
 *   1 = "Wrong"    — Incorrect, but recognized on reveal
 *   2 = "Hard"     — Correct but with significant difficulty
 *   3 = "Good"     — Correct with some hesitation
 *   4 = "Easy"     — Correct with little effort
 *   5 = "Perfect"  — Instant perfect recall
 */

export interface SM2Card {
    /** Unique card identifier */
    id: string;
    /** SM-2 ease factor (minimum 1.3) */
    easeFactor: number;
    /** Current interval in days */
    interval: number;
    /** Number of consecutive correct reviews */
    repetitions: number;
    /** Next review date (ISO string) */
    nextReview: string;
    /** Last review date (ISO string) */
    lastReview: string;
    /** Learning status */
    status: "new" | "learning" | "review" | "graduated";
}

export interface SM2Result {
    easeFactor: number;
    interval: number;
    repetitions: number;
    nextReview: string;
    status: SM2Card["status"];
}

/**
 * Calculate the next review state for a card
 */
export function sm2(card: SM2Card, quality: number): SM2Result {
    // Clamp quality to 0-5
    const q = Math.max(0, Math.min(5, Math.round(quality)));

    let { easeFactor, interval, repetitions } = card;

    if (q >= 3) {
        // Correct response
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
    } else {
        // Incorrect — reset
        repetitions = 0;
        interval = 1;
    }

    // Update ease factor using SM-2 formula
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    // Calculate next review date
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + interval);

    // Determine status
    let status: SM2Card["status"];
    if (repetitions === 0) status = "learning";
    else if (repetitions <= 2) status = "learning";
    else if (interval >= 21) status = "graduated";
    else status = "review";

    return {
        easeFactor: Math.round(easeFactor * 100) / 100,
        interval,
        repetitions,
        nextReview: next.toISOString(),
        status,
    };
}

/**
 * Create a new SM2 card with default values
 */
export function createSM2Card(id: string): SM2Card {
    return {
        id,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: new Date().toISOString(),
        lastReview: new Date().toISOString(),
        status: "new",
    };
}

/**
 * Check if a card is due for review
 */
export function isDue(card: SM2Card): boolean {
    return new Date(card.nextReview) <= new Date();
}

/**
 * Sort cards: due cards first, then by next review date
 */
export function sortByDue(cards: SM2Card[]): SM2Card[] {
    const now = new Date();
    return [...cards].sort((a, b) => {
        const aDue = new Date(a.nextReview) <= now;
        const bDue = new Date(b.nextReview) <= now;
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        return new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime();
    });
}

/**
 * Get summary stats for a card collection
 */
export function getStats(cards: SM2Card[]) {
    const now = new Date();
    return {
        total: cards.length,
        new: cards.filter(c => c.status === "new").length,
        learning: cards.filter(c => c.status === "learning").length,
        review: cards.filter(c => c.status === "review").length,
        graduated: cards.filter(c => c.status === "graduated").length,
        due: cards.filter(c => new Date(c.nextReview) <= now).length,
    };
}

/**
 * Map a simple user rating (1-4 button press) to SM-2 quality
 */
export function ratingToQuality(rating: "again" | "hard" | "good" | "easy"): number {
    switch (rating) {
        case "again": return 1;
        case "hard": return 2;
        case "good": return 4;
        case "easy": return 5;
    }
}

/**
 * Get a human-readable interval string
 */
export function formatInterval(days: number): string {
    if (days === 0) return "now";
    if (days === 1) return "1 day";
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.round(days / 7)} weeks`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
}

/**
 * Preview what intervals each rating would produce
 */
export function previewIntervals(card: SM2Card): Record<string, string> {
    return {
        again: formatInterval(sm2(card, 1).interval),
        hard: formatInterval(sm2(card, 2).interval),
        good: formatInterval(sm2(card, 4).interval),
        easy: formatInterval(sm2(card, 5).interval),
    };
}
