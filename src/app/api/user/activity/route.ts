export const dynamic = 'force-dynamic';


import { NextResponse, NextRequest } from "next/server";
import { recordActivity } from "@/lib/xp";



export async function POST(req: NextRequest) {
    try {
        const { type, customXp } = await req.json();

        if (!['quiz', 'flashcards', 'summary', 'daily_challenge', 'exam_sprint', 'tour_complete'].includes(type)) {
            return NextResponse.json({ error: "Invalid activity type" }, { status: 400 });
        }

        const stats = await recordActivity(type, undefined, undefined, customXp);

        if (!stats) {
            return NextResponse.json({ error: "Failed to record activity" }, { status: 500 });
        }

        return NextResponse.json({ stats });
    } catch (error) {
        console.error("Activity API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
