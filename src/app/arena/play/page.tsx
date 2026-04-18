export const dynamic = 'force-static';
export const revalidate = false;

import { Suspense } from "react";
import PlayClient from "./PlayClient";

export default function ArenaPlayPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#EF4444] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <PlayClient />
        </Suspense>
    );
}
