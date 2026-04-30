export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(req.url);
        const usernameQuery = searchParams.get("username");

        // If username query is provided, check for availability
        if (usernameQuery) {
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("id, username")
                .eq("username", usernameQuery.toLowerCase().trim())
                .single();
            
            // Return the profile if found (so client can check if it's theirs or not)
            return NextResponse.json({ profile });
        }
        
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
                        current_streak: 0,
                        xp_total: 0,
                        credits: 100,
                        has_onboarded: false,
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
        const body = await req.json();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // SECURITY: Whitelist allowed fields. BLOCK credits/xp/streak manipulation.
        const allowedUpdates: any = {
            alias: body.alias,
            username: body.username?.toLowerCase().trim(),
            first_name: body.first_name,
            last_name: body.last_name,
            age: body.age,
            avatar_url: body.avatar || body.avatar_url,
            education_level: body.education_level,
            study_goal: body.study_goal,
            study_style: body.study_style,
            preferred_subjects: body.preferred_subjects,
            time_commitment: body.time_commitment,
            main_challenge: body.main_challenge,
            ai_persona: body.ai_persona,
            has_onboarded: body.has_onboarded,
        };

        // Remove undefined keys
        Object.keys(allowedUpdates).forEach(key => 
            allowedUpdates[key] === undefined && delete allowedUpdates[key]
        );

        // Check for username uniqueness if being updated
        if (allowedUpdates.username) {
            const { data: existing, error: checkError } = await supabase
                .from("profiles")
                .select("id")
                .eq("username", allowedUpdates.username)
                .single();
            
            if (existing && existing.id !== user.id) {
                return NextResponse.json({ error: "Username already taken" }, { status: 409 });
            }
        }

        // Update profile
        const { data: profile, error: updateError } = await supabase
            .from("profiles")
            .update(allowedUpdates)
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
