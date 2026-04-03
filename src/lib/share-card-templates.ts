/**
 * share-card-templates.ts
 *
 * Premium SVG templates for shareable study cards. 
 * Placeholders: {{title}}, {{count}}, {{type}}, {{date}}, {{user}}.
 * Uses \`<tspan>\` wrapping logic inside \`ShareCard.tsx\`.
 */

export const SHARE_CARD_TEMPLATES = [
    {
        id: "neon-grade",
        name: "Neon Grade",
        svg: `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="neonGlow" x1="0" y1="0" x2="1080" y2="1350" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#F4845F"/>
                    <stop offset="1" stop-color="#FF6B9D"/>
                </linearGradient>
                <filter id="blurLg" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="80" />
                </filter>
            </defs>
            
            <!-- Dark Void BG -->
            <rect width="1080" height="1350" fill="#0C0C14"/>
            
            <!-- Ambient Glow -->
            <circle cx="200" cy="200" r="400" fill="#F4845F" fill-opacity="0.2" filter="url(#blurLg)"/>
            <circle cx="900" cy="1150" r="500" fill="#FF6B9D" fill-opacity="0.15" filter="url(#blurLg)"/>

            <!-- Main Panel -->
            <rect x="60" y="60" width="960" height="1230" rx="48" fill="#FFFFFF" fill-opacity="0.03" stroke="url(#neonGlow)" stroke-opacity="0.8" stroke-width="4"/>
            
            <!-- Upper Tags -->
            <rect x="420" y="160" width="240" height="50" rx="25" fill="none" stroke="#F4845F" stroke-width="2"/>
            <text x="540" y="193" text-anchor="middle" fill="#F4845F" font-family="Inter, sans-serif" font-size="16" font-weight="800" letter-spacing="0.2em">EXAM PREP. SYS</text>

            <!-- Dynamic Wrapped Title -->
            <text x="540" y="400" text-anchor="middle" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="80" font-weight="900" letter-spacing="-0.02em">{{title}}</text>
            
            <!-- Mid Stats Component -->
            <g transform="translate(180, 580)">
                <rect width="720" height="300" rx="40" fill="#FFFFFF" fill-opacity="0.06" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1"/>
                
                <text x="360" y="160" text-anchor="middle" fill="url(#neonGlow)" font-family="Inter, sans-serif" font-size="140" font-weight="900">{{count}}</text>
                <text x="360" y="240" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.7" font-family="Inter, sans-serif" font-size="32" font-weight="700" letter-spacing="0.1em">{{type}} GENERATED</text>
            </g>

            <path d="M 280 1000 L 800 1000" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="2" stroke-dasharray="10 10"/>

            <text x="540" y="1120" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.9" font-family="Inter, sans-serif" font-size="34" font-weight="600">The Professor <tspan fill="#F4845F">AI</tspan></text>
            <text x="540" y="1180" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.4" font-family="Inter, sans-serif" font-size="22" font-weight="500">Mastered on {{date}} · {{user}}</text>
        </svg>`
    },
    {
        id: "academic-stamp",
        name: "Academic Stamp",
        svg: `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Cream Canvas -->
            <rect width="1080" height="1350" fill="#FDFCF8"/>
            
            <!-- Grid Pattern -->
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000000" stroke-opacity="0.04" stroke-width="1"/>
                </pattern>
            </defs>
            <rect width="1080" height="1350" fill="url(#grid)"/>

            <rect x="80" y="80" width="920" height="1190" fill="none" stroke="#111111" stroke-width="6"/>
            <rect x="96" y="96" width="888" height="1158" fill="none" stroke="#111111" stroke-width="2"/>

            <text x="540" y="200" text-anchor="middle" fill="#111111" font-family="Playfair Display, serif" font-size="32" font-weight="700" letter-spacing="0.2em">CERTIFICATE OF STUDY</text>
            <line x1="300" y1="240" x2="780" y2="240" stroke="#111111" stroke-width="2"/>

            <!-- Huge wrapped topic -->
            <text x="540" y="440" text-anchor="middle" fill="#111111" font-family="Playfair Display, serif" font-size="96" font-weight="900" letter-spacing="-0.03em">{{title}}</text>

            <!-- Stats seal -->
            <g transform="translate(340, 640)">
                <circle cx="200" cy="200" r="180" fill="#111111"/>
                <circle cx="200" cy="200" r="160" fill="none" stroke="#FFFFFF" stroke-dasharray="8 8" stroke-width="3"/>
                <text x="200" y="220" text-anchor="middle" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="110" font-weight="800">{{count}}</text>
                <text x="200" y="280" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.8" font-family="Inter, sans-serif" font-size="28" font-weight="600" letter-spacing="0.1em">{{type}}</text>
            </g>

            <text x="140" y="1120" text-anchor="start" fill="#444444" font-family="Inter, sans-serif" font-size="24" font-weight="500">DATE RECORDED:</text>
            <text x="140" y="1160" text-anchor="start" fill="#111111" font-family="Inter, sans-serif" font-size="32" font-weight="800">{{date}}</text>

            <text x="940" y="1120" text-anchor="end" fill="#444444" font-family="Inter, sans-serif" font-size="24" font-weight="500">SCHOLAR:</text>
            <text x="940" y="1160" text-anchor="end" fill="#111111" font-family="Inter, sans-serif" font-size="32" font-weight="800">{{user}}</text>

            <line x1="140" y1="1200" x2="940" y2="1200" stroke="#111111" stroke-width="4"/>
            <text x="540" y="1250" text-anchor="middle" fill="#111111" font-family="Playfair Display, serif" font-size="28" font-weight="800" font-style="italic">The Professor Intelligence System</text>
        </svg>`
    },
    {
        id: "witty-banter",
        name: "Witty Banter",
        svg: `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bgGradi" x1="1080" y1="0" x2="0" y2="1350" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#4ECDC4"/>
                    <stop offset="1" stop-color="#2D82B5"/>
                </linearGradient>
                <filter id="shadowBlob">
                    <feDropShadow dx="0" dy="24" stdDeviation="40" flood-opacity="0.15"/>
                </filter>
            </defs>

            <rect width="1080" height="1350" fill="url(#bgGradi)"/>
            
            <!-- Chat bubble style window -->
            <rect x="80" y="180" width="920" height="990" rx="60" fill="#FFFFFF" filter="url(#shadowBlob)"/>
            
            <!-- Three dots for window -->
            <circle cx="160" cy="240" r="10" fill="#FF5F56"/>
            <circle cx="200" cy="240" r="10" fill="#FFBD2E"/>
            <circle cx="240" cy="240" r="10" fill="#27C93F"/>

            <text x="540" y="380" text-anchor="middle" fill="#1A1A2E" font-family="Inter, sans-serif" font-size="70" font-weight="900" letter-spacing="-0.02em">"I Survived</text>
            <text x="540" y="500" text-anchor="middle" fill="#4ECDC4" font-family="Inter, sans-serif" font-size="80" font-weight="900" letter-spacing="-0.02em">{{title}}"</text>

            <rect x="240" y="660" width="600" height="180" rx="30" fill="#F4F5F7" stroke="#E2E8F0" stroke-width="2"/>
            <text x="540" y="740" text-anchor="middle" fill="#1A1A2E" font-family="Inter, sans-serif" font-size="80" font-weight="900">{{count}}</text>
            <text x="540" y="800" text-anchor="middle" fill="#64748B" font-family="Inter, sans-serif" font-size="24" font-weight="700" letter-spacing="0.1em">{{type}} COMPLETED</text>

            <text x="540" y="1000" text-anchor="middle" fill="#64748B" font-family="Inter, sans-serif" font-size="32" font-weight="500">Wait, learning was supposed to be hard?</text>

            <text x="540" y="1080" text-anchor="middle" fill="#CBD5E1" font-family="Inter, sans-serif" font-size="20" font-weight="600">— {{user}} · {{date}}</text>

            <text x="540" y="1280" text-anchor="middle" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="32" font-weight="800">THE PROFESSOR</text>
        </svg>`
    }
];
