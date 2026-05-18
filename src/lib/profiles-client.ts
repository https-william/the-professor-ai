/**
 * Client-safe level calculation utilities.
 * Mirrors the logic from src/lib/profiles.ts but without
 * server-only imports (no Supabase server client).
 * 
 * ═══ COD / LOL Inspired Dual-Layer Progression Architecture ═══
 * Layer 1: Lifetime Academic Rank & Echelons (Infinite Leveling + Prestige Crests)
 * Layer 2: Seasonal Academic Semesters (Monthly/Quarterly Ladder Resets)
 */

export function calculateLevel(xp: number): number {
    // Level = floor(sqrt(xp / 100)) + 1
    // 0 XP = Level 1, 100 XP = Level 2, 400 XP = Level 3, etc. Infinite progression.
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getLevelProgress(xp: number): number {
    const level = calculateLevel(xp);
    const currentLevelXp = Math.pow(level - 1, 2) * 100;
    const nextLevelXp = Math.pow(level, 2) * 100;

    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.min(Math.max(progress, 0), 100);
}

export function getLevelTitle(level: number): string {
    const titles: Record<number, string> = {
        1: "Novice",
        2: "Apprentice",
        3: "Student",
        4: "Scholar",
        5: "Adept",
        6: "Expert",
        7: "Mentor",
        8: "Sage",
        9: "Professor",
        10: "Luminary",
    };
    return titles[level] || `Luminary (Tier ${Math.floor(level / 10)})`;
}

/**
 * ── Layer 1: Lifetime Academic Echelons (Prestige Crests) ──
 * Every 10 levels represents a major Academic Tier. Students earn permanent Prestige Crests.
 */
export interface AcademicEchelon {
    tier: number;
    name: string;
    crest: string; // Emoji or SVG description
    color: string;
    glow: string;
    description: string;
}

export function getAcademicEchelon(level: number): AcademicEchelon {
    if (level < 10) {
        return {
            tier: 1,
            name: "Bronze Laurel",
            crest: "🌿",
            color: "var(--amber)",
            glow: "var(--amber-glow)",
            description: "Foundation of Scholarly Pursuit"
        };
    } else if (level < 20) {
        return {
            tier: 2,
            name: "Silver Quill",
            crest: "✒️",
            color: "var(--cyan)",
            glow: "var(--cyan-glow)",
            description: "Artisan of Written Thought"
        };
    } else if (level < 30) {
        return {
            tier: 3,
            name: "Golden Chalice",
            crest: "🏆",
            color: "var(--amber)",
            glow: "var(--amber-glow)",
            description: "Bearer of Academic Excellence"
        };
    } else if (level < 40) {
        return {
            tier: 4,
            name: "Platinum Crown",
            crest: "👑",
            color: "var(--blue)",
            glow: "var(--blue-glow)",
            description: "Sovereign of Deep Synthesis"
        };
    } else if (level < 50) {
        return {
            tier: 5,
            name: "Diamond Monocle",
            crest: "🧐",
            color: "var(--violet)",
            glow: "var(--violet-glow)",
            description: "Visionary of Flawless Recall"
        };
    } else {
        return {
            tier: 6,
            name: "Obsidian Robe",
            crest: "🎓",
            color: "var(--emerald)",
            glow: "var(--emerald-glow)",
            description: "Grandmaster of the Professor Vault"
        };
    }
}

/**
 * ── Layer 2: Seasonal Academic Semesters (Monthly Resets) ──
 * Students compete on a seasonal ladder that resets monthly/quarterly, keeping lifetime prestige intact.
 */
export interface SemesterInfo {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
}

export function getCurrentSemesterInfo(): SemesterInfo {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    const semesterNames = [
        "Harmattan Sprint", "Harmattan Sprint", "Harmattan Sprint", // Jan-Mar
        "Spring Term", "Spring Term", "Spring Term",             // Apr-Jun
        "Summer Regatta", "Summer Regatta", "Summer Regatta",     // Jul-Sep
        "Ember Sprint", "Ember Sprint", "Ember Sprint"           // Oct-Dec
    ];

    const currentName = `${semesterNames[month]} ${year}`;
    // Approximate quarter end
    const quarter = Math.floor(month / 3);
    const endDate = new Date(year, (quarter + 1) * 3, 0); // Last day of quarter
    const diffTime = endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
        id: `${year}-Q${quarter + 1}`,
        name: currentName,
        startDate: new Date(year, quarter * 3, 1).toLocaleDateString(),
        endDate: endDate.toLocaleDateString(),
        daysRemaining
    };
}

export interface SemesterStanding {
    rankName: string;
    seasonalXp: number;
    nextRankXp: number;
    division: string;
}

export function getSemesterStanding(totalXp: number): SemesterStanding {
    // Derive seasonal XP deterministically using a mock seasonal offset for demonstration
    // In production, this would be fetched from a `seasonal_xp` column in profiles.
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const seed = (now.getFullYear() * 10) + quarter;
    const seasonalXp = totalXp % (seed * 100 || 1000);

    let rankName = "Semester Cadet";
    let nextRankXp = 250;
    let division = "Division IV";

    if (seasonalXp >= 750) {
        rankName = "Chancellor";
        nextRankXp = 1000;
        division = "Division I";
    } else if (seasonalXp >= 500) {
        rankName = "Dean's List";
        nextRankXp = 750;
        division = "Division II";
    } else if (seasonalXp >= 250) {
        rankName = "Scholar";
        nextRankXp = 500;
        division = "Division III";
    }

    return {
        rankName,
        seasonalXp,
        nextRankXp,
        division
    };
}
