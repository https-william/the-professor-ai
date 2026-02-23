/**
 * share-card-templates.ts
 *
 * SVG templates for shareable study cards. 
 * Includes placeholders like {{title}}, {{count}}, {{type}}, {{date}}, {{user}}.
 */

export const SHARE_CARD_TEMPLATES = [
    {
        id: "minimal-dark",
        name: "Midnight Void",
        svg: `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="1080" height="1350" fill="#0A0A0A"/>
            <circle cx="900" cy="100" r="300" fill="#6366F1" fill-opacity="0.1" />
            <circle cx="100" cy="1200" r="400" fill="#8B5CF6" fill-opacity="0.05" />
            
            <!-- Border -->
            <rect x="40" y="40" width="1000" height="1270" rx="40" stroke="white" stroke-opacity="0.1" stroke-width="2"/>
            
            <!-- Content -->
            <text x="540" y="300" text-anchor="middle" fill="#6366F1" font-family="Inter, sans-serif" font-size="24" font-weight="700" letter-spacing="0.2em">STUDY SESSION COMPLETE</text>
            <text x="540" y="450" text-anchor="middle" fill="white" font-family="Playfair Display, serif" font-size="80" font-weight="700">{{title}}</text>
            
            <rect x="440" y="550" width="200" height="4" fill="#6366F1" rx="2"/>
            
            <text x="540" y="750" text-anchor="middle" fill="white" font-family="Inter, sans-serif" font-size="120" font-weight="900">{{count}}</text>
            <text x="540" y="820" text-anchor="middle" fill="white" fill-opacity="0.5" font-family="Inter, sans-serif" font-size="32" font-weight="500" letter-spacing="0.05em">{{type}} GENERATED</text>
            
            <!-- Branding -->
            <g transform="translate(440, 1150)">
                <rect width="200" height="60" rx="30" fill="white" fill-opacity="0.05" />
                <text x="100" y="38" text-anchor="middle" fill="white" font-family="Inter, sans-serif" font-size="24" font-weight="700">The Professor</text>
            </g>
            
            <text x="540" y="1250" text-anchor="middle" fill="white" fill-opacity="0.3" font-family="Inter, sans-serif" font-size="20">Generated on {{date}} · By {{user}}</text>
        </svg>`
    },
    {
        id: "vibrant-gradient",
        name: "Hyper Gradient",
        svg: `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="1080" height="1350" fill="url(#bg_grad)"/>
            <defs>
                <linearGradient id="bg_grad" x1="0" y1="0" x2="1080" y2="1350" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#6366F1"/>
                    <stop offset="1" stop-color="#EC4899"/>
                </linearGradient>
            </defs>
            
            <rect x="60" y="60" width="960" height="1230" rx="60" fill="white" fill-opacity="0.1" stroke="white" stroke-opacity="0.2" stroke-width="2"/>
            
            <text x="120" y="200" fill="white" fill-opacity="0.8" font-family="Inter, sans-serif" font-size="28" font-weight="700">ACHIEVEMENT UNLOCKED</text>
            <text x="120" y="320" fill="white" font-family="Inter, sans-serif" font-size="110" font-weight="900" letter-spacing="-0.02em">{{title}}</text>
            
            <g transform="translate(120, 500)">
                <rect width="300" height="150" rx="30" fill="white"/>
                <text x="150" y="80" text-anchor="middle" fill="#6366F1" font-family="Inter, sans-serif" font-size="60" font-weight="900">{{count}}</text>
                <text x="150" y="120" text-anchor="middle" fill="#6366F1" fill-opacity="0.6" font-family="Inter, sans-serif" font-size="20" font-weight="700">{{type}}</text>
            </g>
            
            <text x="120" y="800" fill="white" fill-opacity="0.9" font-family="Inter, sans-serif" font-size="40" font-weight="500" width="840">
                <tspan x="120" dy="1.2em">I just leveled up my</tspan>
                <tspan x="120" dy="1.2em">understanding of this topic</tspan>
                <tspan x="120" dy="1.2em">using AI Study Tools.</tspan>
            </text>
            
            <text x="120" y="1220" fill="white" font-family="Inter, sans-serif" font-size="32" font-weight="800">THE PROFESSOR</text>
            <text x="960" y="1220" text-anchor="end" fill="white" fill-opacity="0.6" font-family="Inter, sans-serif" font-size="24">{{date}}</text>
        </svg>`
    },
    {
        id: "classic-elegant",
        name: "Oxford Paper",
        svg: `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="1080" height="1350" fill="#F8F9FA"/>
            
            <!-- Paper lines -->
            <line x1="0" y1="200" x2="1080" y2="200" stroke="#E9ECEF" stroke-width="2"/>
            <line x1="0" y1="300" x2="1080" y2="300" stroke="#E9ECEF" stroke-width="2"/>
            <line x1="0" y1="400" x2="1080" y2="400" stroke="#E9ECEF" stroke-width="2"/>
            <line x1="150" y1="0" x2="150" y2="1350" stroke="#FFC9C9" stroke-width="2"/>
            
            <text x="200" y="150" fill="#212529" font-family="Playfair Display, serif" font-size="40" font-weight="700">Topic Study: {{title}}</text>
            
            <rect x="200" y="250" width="600" height="400" rx="10" fill="white" stroke="#DEE2E6" stroke-width="1"/>
            <text x="500" y="450" text-anchor="middle" fill="#000" font-family="Inter, sans-serif" font-size="120" font-weight="300">{{count}}</text>
            <text x="500" y="520" text-anchor="middle" fill="#6C757D" font-family="Inter, sans-serif" font-size="30">{{type}} mastered</text>
            
            <text x="200" y="800" fill="#495057" font-family="Inter, sans-serif" font-size="32" font-weight="400">
                <tspan x="200" dy="1.5em">Notes condensed and verified.</tspan>
                <tspan x="200" dy="1.5em">Ready for the examination.</tspan>
            </text>
            
            <path d="M200 1100 L500 1100" stroke="#212529" stroke-width="2"/>
            <text x="200" y="1150" fill="#212529" font-family="Dancing Script, cursive" font-size="40">The Professor</text>
            
            <text x="900" y="1250" text-anchor="end" fill="#ADB5BD" font-family="Inter, sans-serif" font-size="24">{{date}}</text>
        </svg>`
    },
    {
        id: "modern-glass",
        name: "Glass Morph",
        svg: `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="1080" height="1350" fill="#F0F2F5"/>
            <defs>
                <filter id="glass" x="-50" y="-50" width="1180" height="1450" filterUnits="userSpaceOnUse">
                    <feGaussianBlur stdDeviation="20" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
            </defs>
            
            <circle cx="200" cy="200" r="150" fill="#3B82F6"/>
            <circle cx="880" cy="1150" r="200" fill="#10B981"/>
            
            <rect x="100" y="100" width="880" height="1150" rx="40" fill="white" fill-opacity="0.4" style="backdrop-filter: blur(40px)"/>
            <rect x="100" y="100" width="880" height="1150" rx="40" stroke="white" stroke-opacity="0.5" stroke-width="2"/>
            
            <text x="540" y="250" text-anchor="middle" fill="#1F2937" font-family="Inter, sans-serif" font-size="32" font-weight="500">SESSION REPORT</text>
            <text x="540" y="380" text-anchor="middle" fill="#111827" font-family="Inter, sans-serif" font-size="90" font-weight="800">{{title}}</text>
            
            <g transform="translate(390, 550)">
                <rect width="300" height="300" rx="150" fill="#3B82F6"/>
                <text x="150" y="170" text-anchor="middle" fill="white" font-family="Inter, sans-serif" font-size="120" font-weight="900">{{count}}</text>
                <text x="150" y="220" text-anchor="middle" fill="white" fill-opacity="0.8" font-family="Inter, sans-serif" font-size="24" font-weight="600">{{type}}</text>
            </g>
            
            <text x="540" y="1000" text-anchor="middle" fill="#4B5563" font-family="Inter, sans-serif" font-size="36" font-weight="500" width="700">
                <tspan x="540" dy="1.2em">I&apos;ve successfully converted my</tspan>
                <tspan x="540" dy="1.2em">notes into a structured study set.</tspan>
            </text>
            
            <text x="540" y="1200" text-anchor="middle" fill="#1D4ED8" font-family="Inter, sans-serif" font-size="28" font-weight="700">PROFESSOR AI</text>
        </svg>`
    }
];
