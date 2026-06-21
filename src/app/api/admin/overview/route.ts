export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch user profile to get their role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Admin authorization check
    const email = user.email;
    const role = profile?.role;

    if (!isAdmin(email, role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Create admin client bypassing RLS to retrieve dashboard data
    const adminClient = createAdminClient();
    
    // Create client to query auth schema (for emails)
    const authAdminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        db: { schema: 'auth' }
      }
    );

    // Fetch profiles, auth users, and study packs in parallel
    const [profilesRes, authUsersRes, studyPacksRes] = await Promise.all([
      adminClient
        .from("profiles")
        .select("id, alias, first_name, last_name, credits, plan_status, current_streak, last_study_date, role, created_at")
        .order("created_at", { ascending: false }),
      authAdminClient
        .from("users")
        .select("id, email"),
      adminClient
        .from("study_packs")
        .select("user_id")
    ]);

    if (profilesRes.error) {
      return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });
    }

    const profiles = profilesRes.data || [];
    const authUsers = authUsersRes.data || [];
    const studyPacks = studyPacksRes.data || [];

    // Create maps for fast lookup
    const emailMap = new Map<string, string>();
    authUsers.forEach((u: any) => {
      if (u.id && u.email) {
        emailMap.set(u.id, u.email);
      }
    });

    const packsCountMap = new Map<string, number>();
    studyPacks.forEach((p: any) => {
      if (p.user_id) {
        packsCountMap.set(p.user_id, (packsCountMap.get(p.user_id) || 0) + 1);
      }
    });

    // Process user profiles and compute PQL flags
    let premiumUsersCount = 0;
    let activeStreaksCount = 0;
    let totalPqlsCount = 0;

    const usersData = profiles.map((p: any) => {
      const packs_count = packsCountMap.get(p.id) || 0;
      const userEmail = emailMap.get(p.id) || p.email || "No Email";

      // Compute PQL conditions
      const pql_status: string[] = [];
      if (packs_count > 5) {
        pql_status.push("High Usage");
      }
      if (p.credits < 15) {
        pql_status.push("Credit Depleted");
      }
      if (p.current_streak > 5) {
        pql_status.push("High Streak");
      }

      if (pql_status.length > 0) {
        totalPqlsCount++;
      }
      if (p.plan_status && p.plan_status !== "free") {
        premiumUsersCount++;
      }
      if (p.current_streak > 0) {
        activeStreaksCount++;
      }

      return {
        id: p.id,
        alias: p.alias || "Scholar",
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        email: userEmail,
        credits: p.credits ?? 0,
        plan_status: p.plan_status || "free",
        current_streak: p.current_streak ?? 0,
        last_study_date: p.last_study_date || null,
        role: p.role || "user",
        created_at: p.created_at,
        packs_count,
        pql_status
      };
    });

    const stats = {
      totalUsers: profiles.length,
      premiumUsers: premiumUsersCount,
      activeStreaks: activeStreaksCount,
      totalPacks: studyPacks.length,
      totalPqls: totalPqlsCount
    };

    return NextResponse.json({ users: usersData, stats });
  } catch (error: any) {
    console.error("Admin Overview Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
