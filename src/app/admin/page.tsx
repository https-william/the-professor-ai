import { createClient } from "@/lib/supabase/server";
import AdminDashboardClient from "./AdminDashboardClient";
import SiteHeader from "@/components/ui/SiteHeader";

export const metadata = {
  title: "Admin Atrium | The Professor",
};

export default async function AdminPage() {
  // Pre-fetch some initial server data if needed
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto pb-20">
         <div className="mb-10">
            <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)]">Admin Atrium</h1>
            <p className="text-[var(--foreground-muted)] text-sm mt-2">Live command center for The Professor ecosystem.</p>
         </div>
         <AdminDashboardClient />
      </div>
    </div>
  );
}
