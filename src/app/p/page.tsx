export const dynamic = 'force-static';
export const revalidate = false;

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfile, calculateLevel, getLevelProgress } from "@/lib/profiles";
import ProfileClient from "./ProfileClient";

interface Props {
  searchParams: Promise<{ username?: string }>;
}

// metadata for public profiles
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { username } = await searchParams;
    if (!username) return { title: "Scholar Profile" };
    
    const profile = await getPublicProfile(username);
    if (!profile) return { title: "Scholar Not Found" };
    
    return {
        title: `${profile.full_name || username} | Scholar Profile`,
        description: `View ${username}'s academic achievements and level on The Professor AI.`,
        openGraph: {
            title: `${profile.full_name || username} - Level ${calculateLevel(profile.xp_total || 0)} Scholar`,
            description: `Academic streak: ${profile.current_streak} days. Join the elite study tier.`,
            type: "profile",
            username: username,
        }
    };
}

export default async function PublicProfilePage({ searchParams }: Props) {
    const { username } = await searchParams;
    
    if (!username) {
        notFound();
    }

    const profile = await getPublicProfile(username);
    
    if (!profile) {
        notFound();
    }

    const level = calculateLevel(profile.xp_total || 0);
    const progress = getLevelProgress(profile.xp_total || 0);

    return (
        <ProfileClient 
            profile={profile} 
            username={username} 
            level={level} 
            progress={progress} 
        />
    );
}
