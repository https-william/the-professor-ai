export const dynamic = 'force-static';
export const revalidate = false;

import { Suspense } from "react";
import ResultsClient from "./ResultsClient";

export default function ArenaResultsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#06060B] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ResultsClient />
        </Suspense>
    );
}
