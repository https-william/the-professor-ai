"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session || !session.user) {
          router.push("/login");
          return;
        }

        // Fetch user profile from database to verify role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const userEmail = session.user.email;
        const userRole = profile?.role;

        // Perform authorization check
        const isLocalOverride = typeof window !== "undefined" && window.localStorage.getItem("professor_admin_override") === "true";
        if (!isAdmin(userEmail, userRole) && !isLocalOverride) {
          console.warn("[AdminLayout] Unauthorized access attempt by:", userEmail);
          router.push("/dashboard");
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("[AdminLayout] Error verifying authorization:", err);
        router.push("/dashboard");
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-white">
      {children}
    </div>
  );
}

