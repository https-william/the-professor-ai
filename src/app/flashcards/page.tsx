"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DataDustLoader from "@/components/ui/DataDustLoader";

function FlashcardsRouter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const id = searchParams.get("id");
        const mode = searchParams.get("mode");

        if (id) {
            router.replace(`/flashcards/${id}`);
        } else if (mode === "generate") {
            router.replace("/flashcards/generate");
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

export default function FlashcardsPage() {
    return (
        <Suspense fallback={<DataDustLoader />}>
            <FlashcardsRouter />
        </Suspense>
    );
}
iv>
    );
}
