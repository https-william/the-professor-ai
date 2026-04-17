/**
 * Client-safe level calculation utilities.
 * Mirrors the logic from src/lib/profiles.ts but without
 * server-only imports (no Supabase server client).
 */

export function calculateLevel(xp: number): number {
    // Level = floor(sqrt(xp / 100)) + 1
    // 0 XP = Level 1, 100 XP = Level 2, 400 XP = Level 3, etc.
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
        7: "Master",
        8: "Sage",
        9: "Professor",
        10: "Luminary",
    };
    return titles[Math.min(level, 10)] || "Legend";
}
