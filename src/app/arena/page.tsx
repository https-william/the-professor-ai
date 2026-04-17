"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArenaPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/hub?s=arena");
    }, [router]);

    return null;
}
