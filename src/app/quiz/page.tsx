"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DataDustLoader from "@/components/ui/DataDustLoader";

function QuizRouter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const id = searchParams.get("id");
        const mode = searchParams.get("mode");

        if (id) {
            router.replace(`/quiz/${id}`);
        } else if (mode === "generate") {
            router.replace("/quiz/generate");
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

export default function QuizPage() {
    return (
        <Suspense fallback={<DataDustLoader />}>
            <QuizRouter />
        </Suspense>
    );
}
