export const dynamic = 'force-static';
export const revalidate = false;

import { Suspense } from "react";
import ArenaClient from "./ArenaClient";

export default function ArenaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--error)] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ArenaClient />
        </Suspense>
    );
}
