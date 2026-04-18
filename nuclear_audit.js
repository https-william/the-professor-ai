const fs = require('fs');
const files = [
    // API Routes (Renamed dynamic segments to static stubs)
    "src/app/.well-known/assetlinks.json/route.ts",
    "src/app/api/ai/study-plan/route.ts",
    "src/app/api/arena/route.ts",
    "src/app/api/arena/session/route.ts",
    "src/app/api/arena/_id_/route.ts",
    "src/app/api/chat/route.ts",
    "src/app/api/generate/auto-quiz/route.ts",
    "src/app/api/generate/eli5/route.ts",
    "src/app/api/generate/flashcards/route.ts",
    "src/app/api/generate/quiz/route.ts",
    "src/app/api/generate/remark/route.ts",
    "src/app/api/generate/roadmap/route.ts",
    "src/app/api/generate/summary/route.ts",
    "src/app/api/leaderboard/route.ts",
    "src/app/api/library/route.ts",
    "src/app/api/library/batch/route.ts",
    "src/app/api/library/ingest/route.ts",
    "src/app/api/lobby/route.ts",
    "src/app/api/lobby/_id_/route.ts",
    "src/app/api/lobby/_id_/messages/route.ts",
    "src/app/api/parse/route.ts",
    "src/app/api/paystack/initialize/route.ts",
    "src/app/api/paystack/webhook/route.ts",
    "src/app/api/professor/route.ts",
    "src/app/api/tts/route.ts",
    "src/app/api/user/activity/route.ts",
    "src/app/api/user/activity-history/route.ts",
    "src/app/api/user/card-review/route.ts",
    "src/app/api/user/due-cards/route.ts",
    "src/app/api/user/profile/route.ts",
    "src/app/api/user/streak-freeze/route.ts",
    "src/app/auth/callback/route.ts",
    // Metadata Handlers
    "src/app/manifest.ts",
    "src/app/robots.ts",
    "src/app/sitemap.ts",
    // Dynamic Pages (Real UI)
    "src/app/blog/[slug]/page.tsx",
    "src/app/p/[username]/page.tsx",
    "src/app/s/[id]/page.tsx",
    "src/app/share/[id]/page.tsx"
];

files.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            let content = fs.readFileSync(file, 'utf8');
            
            const isClient = content.includes('"use client"') || content.includes("'use client'");
            const isDynamic = file.includes('[') && file.includes(']');
            const isRoute = file.endsWith('route.ts');
            
            // 1. Strict Top-of-File Cleanup
            content = content.replace(/^['"]use client['"]\s*;?\s*/g, '');
            content = content.replace(/^export\s+const\s+dynamic\s*=\s*['"].*?['"]\s*;?\s*/gm, '');
            content = content.replace(/^export\s+const\s+revalidate\s*=\s*.*?;?\s*/gm, '');
            content = content.replace(/^export\s+const\s+dynamicParams\s*=\s*.*?;?\s*/gm, '');
            content = content.replace(/^export\s+async\s+function\s+generateStaticParams\(\)\s*\{\s*return\s*\[\];\s*\}\s*/gm, '');
            content = content.replace(/^false\s*;?\s*$/gm, '');
            content = content.replace(/^3600\s*;?.*?$/gm, '');

            // 2. Construct Header
            let headers = '';
            if (isClient) headers += `"use client";\n\n`;
            headers += `export const dynamic = 'force-static';\nexport const revalidate = false;\n\n`;
            
            // 3. Page vs Route Handling
            if (isDynamic && !isClient && !isRoute) {
                // Real Dynamic Pages need generateStaticParams
                if (!content.includes('export function generateStaticParams') && 
                    !content.includes('export async function generateStaticParams')) {
                    headers += `export async function generateStaticParams() { return []; }\n\n`;
                }
            }

            const newContent = headers + content.trim();
            fs.writeFileSync(file, newContent);
            console.log(`Finalized: ${file}`);
        }
    } catch (e) {
        console.error(`Error on ${file}:`, e.message);
    }
});
