export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addToQueue, getQueueIndex } from "@/lib/queue";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("plan_status")
            .eq("id", user.id)
            .single();

        const planStatus = profile?.plan_status || "free";

        // Non-free plan users bypass queue instantly
        if (planStatus !== "free") {
            return NextResponse.json({ queuePosition: 0 });
        }

        // Register in waiting list and get queue position
        addToQueue(user.id);
        const index = getQueueIndex(user.id);
        const position = index + 1;

        return NextResponse.json({ queuePosition: position });
    } catch (e: any) {
        console.error("Queue API GET Error:", e);
        return NextResponse.json({ queuePosition: 1 });
    }
}
