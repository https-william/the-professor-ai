"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DataDustLoader from "@/components/ui/DataDustLoader";

function RoadmapRouter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const id = searchParams.get("id");
        const mode = searchParams.get("mode");

        if (id) {
            router.replace(`/roadmap/${id}`);
        } else if (mode === "generate") {
            router.replace("/roadmap/generate");
        } else {
            router.replace("/library");
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <DataDustLoader />
        </div>
    );
}

export default function RoadmapPage() {
    return (
        <Suspense fallback={<DataDustLoader />}>
            <RoadmapRouter />
        </Suspense>
    );
}
