"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfessorCeremony from "@/components/ui/ProfessorCeremony";

/**
 * /create route now redirects to /dashboard which has the
 * unified create + dashboard experience inline.
 * Keeps existing links and bookmarks functional.
 */
export default function CreatePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard");
    }, [router]);

    return <ProfessorCeremony className="min-h-screen" />;
}
