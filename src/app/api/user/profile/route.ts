import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get profile from profiles table
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (profileError) {
            // If profile doesn't exist, create one
            if (profileError.code === "PGRST116") {
                const { data: newProfile, error: createError } = await supabase
                    .from("profiles")
                    .insert({
                        id: user.id,
                        alias: user.email?.split("@")[0] || "Scholar",
                        streak: 0,
                        xp: 0,
                        credits: 100,
                    })
                    .select()
                    .single();

                if (createError) {
                    return NextResponse.json({ error: createError.message }, { status: 500 });
                }

                return NextResponse.json({ profile: newProfile, email: user.email });
            }
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({ profile, email: user.email });
    } catch (error) {
        console.error("Profile GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient();
        const updates = await req.json();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Update profile
        const { data: profile, error: updateError } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ profile });
    } catch (error) {
        console.error("Profile PUT Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
