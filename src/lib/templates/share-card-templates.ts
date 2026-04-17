/* ═══════════════════════════════════════════════════════════════
   TEMPLATE ENGINE — 100+ Structural Layouts for Shared Content
   ═══════════════════════════════════════════════════════════════
   
   Architecture:
   1. LayoutPrimitives — Structural building blocks (asymmetric, split, etc.)
   2. ColorThemes — Harmonious palettes applied to any layout
   3. TypographyThemes — Font stacks + sizing scales
   4. Templates — Combination of Layout × Color × Typography
   5. Registry — ID-based lookup with metadata for picker UI
   
   Priority: STRUCTURAL VARIETY over color swaps.
   Content-aware topic generation for shared cards.
   ═══════════════════════════════════════════════════════════════ */

/* ────── TYPES ────── */
export type ContentType = "flashcard" | "quiz" | "summary" | "chat";

export interface ShareableContent {
  type: ContentType;
  title: string;
  /** The raw generated content — flashcard Q/A, quiz questions, summary sections */
  data: Record<string, unknown>;
  /** Auto-generated topic tags from content */
  topics: string[];
  /** User who created it */
  author?: string;
  /** Timestamp */
  createdAt?: string;
}

/* ────── LAYOUT PRIMITIVES ────── */
export type LayoutId =
  | "centered"         // Classic centered content
  | "asymmetric-left"  // Heavy left, light right
  | "asymmetric-right" // Heavy right, light left
  | "split-horizontal" // Top/bottom 50/50
  | "split-vertical"   // Left/right 50/50
  | "card-in-card"     // Nested card pattern
  | "magazine"         // Editorial layout with sidebar
  | "poster"           // Bold type, minimal content
  | "stack"            // Vertical stack with alternating emphasis
  | "mosaic"           // Grid-based modular layout
  | "diagonal"         // Content on a diagonal cut
  | "floating"         // Content floats over background
  | "timeline"         // Chronological/sequential layout
  | "spotlight";       // Single element focus with radial bg

export interface LayoutPrimitive {
  id: LayoutId;
  label: string;
  description: string;
  /** CSS grid/flex template for the layout */
  gridTemplate: string;
  /** Number of content zones the layout supports */
  zones: number;
  /** Best suited for which content types */
  bestFor: ContentType[];
}

export const LAYOUT_PRIMITIVES: LayoutPrimitive[] = [
  {
    id: "centered",
    label: "Centered",
    description: "Clean centered layout with generous whitespace",
    gridTemplate: "grid-rows-[auto_1fr_auto] items-center justify-items-center",
    zones: 3,
    bestFor: ["flashcard", "quiz"],
  },
  {
    id: "asymmetric-left",
    label: "Asymmetric Left",
    description: "Heavy left column with supporting right sidebar",
    gridTemplate: "grid-cols-[2fr_1fr] gap-6",
    zones: 2,
    bestFor: ["summary", "chat"],
  },
  {
    id: "asymmetric-right",
    label: "Asymmetric Right",
    description: "Supporting left sidebar with heavy right content",
    gridTemplate: "grid-cols-[1fr_2fr] gap-6",
    zones: 2,
    bestFor: ["summary", "chat"],
  },
  {
    id: "split-horizontal",
    label: "Split Horizontal",
    description: "Clean top/bottom division",
    gridTemplate: "grid-rows-2 gap-4",
    zones: 2,
    bestFor: ["flashcard", "quiz"],
  },
  {
    id: "split-vertical",
    label: "Split Vertical",
    description: "Left/right 50/50 split",
    gridTemplate: "grid-cols-2 gap-4",
    zones: 2,
    bestFor: ["flashcard"],
  },
  {
    id: "card-in-card",
    label: "Card in Card",
    description: "Nested card with inner floating element",
    gridTemplate: "relative",
    zones: 2,
    bestFor: ["flashcard", "quiz"],
  },
  {
    id: "magazine",
    label: "Magazine",
    description: "Editorial layout with narrow topic sidebar",
    gridTemplate: "grid-cols-[80px_1fr] gap-6",
    zones: 3,
    bestFor: ["summary", "chat"],
  },
  {
    id: "poster",
    label: "Poster",
    description: "Bold typography hero with minimal content below",
    gridTemplate: "grid-rows-[2fr_1fr]",
    zones: 2,
    bestFor: ["flashcard", "quiz"],
  },
  {
    id: "stack",
    label: "Stack",
    description: "Vertical stack with alternating emphasis",
    gridTemplate: "flex flex-col gap-3",
    zones: 4,
    bestFor: ["summary", "quiz"],
  },
  {
    id: "mosaic",
    label: "Mosaic",
    description: "Modular grid with varying cell sizes",
    gridTemplate: "grid-cols-3 grid-rows-2 gap-3",
    zones: 5,
    bestFor: ["summary"],
  },
  {
    id: "diagonal",
    label: "Diagonal",
    description: "Content along a diagonal cut — visually dramatic",
    gridTemplate: "relative overflow-hidden",
    zones: 2,
    bestFor: ["flashcard", "quiz"],
  },
  {
    id: "floating",
    label: "Floating",
    description: "Content floats over a rich background",
    gridTemplate: "relative flex items-center justify-center",
    zones: 2,
    bestFor: ["flashcard"],
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Sequential/chronological layout with vertical line",
    gridTemplate: "flex flex-col gap-4 relative",
    zones: 4,
    bestFor: ["summary", "chat"],
  },
  {
    id: "spotlight",
    label: "Spotlight",
    description: "Single element in focus with radial background",
    gridTemplate: "flex items-center justify-center relative",
    zones: 1,
    bestFor: ["flashcard"],
  },
];

/* ────── COLOR THEMES ────── */
export interface ColorTheme {
  id: string;
  label: string;
  /** Background gradient or solid */
  background: string;
  /** Primary accent */
  accent: string;
  /** Text color */
  text: string;
  /** Secondary text */
  textMuted: string;
  /** Card/panel background */
  cardBg: string;
  /** Border color */
  border: string;
  /** Glow/shadow color */
  glow: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "midnight-scholar",
    label: "Midnight Scholar",
    background: "linear-gradient(135deg, #0A0A14 0%, #121225 50%, #0D0D1A 100%)",
    accent: "#F59E0B",
    text: "#FFFFFFEE",
    textMuted: "#FFFFFF44",
    cardBg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
    glow: "rgba(245,158,11,0.15)",
  },
  {
    id: "indigo-depths",
    label: "Indigo Depths",
    background: "linear-gradient(135deg, #0F0B2E 0%, #1A1145 50%, #0D0926 100%)",
    accent: "#818CF8",
    text: "#FFFFFFEE",
    textMuted: "#FFFFFF44",
    cardBg: "rgba(129,140,248,0.06)",
    border: "rgba(129,140,248,0.15)",
    glow: "rgba(129,140,248,0.2)",
  },
  {
    id: "emerald-forest",
    label: "Emerald Forest",
    background: "linear-gradient(135deg, #071A13 0%, #0D2E20 50%, #081C15 100%)",
    accent: "#34D399",
    text: "#FFFFFFEE",
    textMuted: "#FFFFFF44",
    cardBg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.15)",
    glow: "rgba(52,211,153,0.2)",
  },
  {
    id: "warm-parchment",
    label: "Warm Parchment",
    background: "linear-gradient(135deg, #FBF7F0 0%, #F5EDE0 50%, #FBF7F0 100%)",
    accent: "#92400E",
    text: "#1C1917EE",
    textMuted: "#1C191766",
    cardBg: "rgba(146,64,14,0.05)",
    border: "rgba(146,64,14,0.12)",
    glow: "rgba(146,64,14,0.1)",
  },
  {
    id: "rose-quartz",
    label: "Rose Quartz",
    background: "linear-gradient(135deg, #1A0A14 0%, #2E1125 50%, #1A0A14 100%)",
    accent: "#F472B6",
    text: "#FFFFFFEE",
    textMuted: "#FFFFFF44",
    cardBg: "rgba(244,114,182,0.06)",
    border: "rgba(244,114,182,0.15)",
    glow: "rgba(244,114,182,0.2)",
  },
  {
    id: "arctic-white",
    label: "Arctic White",
    background: "linear-gradient(135deg, #FAFBFF 0%, #EEF0FF 50%, #FAFBFF 100%)",
    accent: "#3B82F6",
    text: "#0F172AEE",
    textMuted: "#0F172A55",
    cardBg: "rgba(59,130,246,0.04)",
    border: "rgba(59,130,246,0.12)",
    glow: "rgba(59,130,246,0.1)",
  },
  {
    id: "cyber-neon",
    label: "Cyber Neon",
    background: "linear-gradient(135deg, #000000 0%, #0A0A0A 50%, #050505 100%)",
    accent: "#00FF88",
    text: "#FFFFFFEE",
    textMuted: "#FFFFFF33",
    cardBg: "rgba(0,255,136,0.04)",
    border: "rgba(0,255,136,0.15)",
    glow: "rgba(0,255,136,0.25)",
  },
  {
    id: "sunset-amber",
    label: "Sunset Amber",
    background: "linear-gradient(135deg, #1A0F05 0%, #2E1A08 50%, #1A0F05 100%)",
    accent: "#FB923C",
    text: "#FFFFFFEE",
    textMuted: "#FFFFFF44",
    cardBg: "rgba(251,146,60,0.06)",
    border: "rgba(251,146,60,0.15)",
    glow: "rgba(251,146,60,0.2)",
  },
];

/* ────── TYPOGRAPHY THEMES ────── */
export interface TypographyTheme {
  id: string;
  label: string;
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  /** Proportional scale for headings */
  headingScale: number;
}

export const TYPOGRAPHY_THEMES: TypographyTheme[] = [
  { id: "scholarly", label: "Scholarly", headingFont: "'Playfair Display', serif", bodyFont: "'Inter', sans-serif", headingWeight: "700", headingScale: 1.0 },
  { id: "modern", label: "Modern", headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif", headingWeight: "800", headingScale: 1.1 },
  { id: "editorial", label: "Editorial", headingFont: "'Outfit', sans-serif", bodyFont: "'Inter', sans-serif", headingWeight: "600", headingScale: 0.95 },
  { id: "mono", label: "Monospace", headingFont: "'JetBrains Mono', monospace", bodyFont: "'JetBrains Mono', monospace", headingWeight: "700", headingScale: 0.85 },
  { id: "bold", label: "Bold Statement", headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif", headingWeight: "900", headingScale: 1.3 },
];

/* ────── TEMPLATE COMPOSITION ────── */
export interface ShareTemplate {
  id: string;
  label: string;
  /** Which content types this template supports */
  supportedTypes: ContentType[];
  /** Layout structure */
  layoutId: LayoutId;
  /** Color palette */
  colorThemeId: string;
  /** Typography settings */
  typographyThemeId: string;
  /** Optional decorative elements */
  decorations?: {
    /** Show watermark topic text */
    watermark?: boolean;
    /** Show gradient orbs */
    orbs?: boolean;
    /** Show noise texture overlay */
    noise?: boolean;
    /** Show border glow */
    borderGlow?: boolean;
    /** Show brand logo */
    brandLogo?: boolean;
    /** Show card shadow depth level (0=none, 3=max) */
    shadowDepth?: 0 | 1 | 2 | 3;
  };
  /** Preview thumbnail color for the picker UI */
  previewColor: string;
  /** Tags for filtering */
  tags: string[];
}

/* ────── TEMPLATE REGISTRY ────── */
function generateTemplates(): ShareTemplate[] {
  const templates: ShareTemplate[] = [];
  let counter = 0;

  // Generate combinations of layout × color × typography
  // Prioritize structural variety — each layout gets multiple color/typo combos
  for (const layout of LAYOUT_PRIMITIVES) {
    for (const color of COLOR_THEMES) {
      for (const typo of TYPOGRAPHY_THEMES) {
        // Skip incompatible combos (e.g. mono typography on poster layout looks weird)
        if (layout.id === "poster" && typo.id === "mono") continue;
        // Skip some combos to stay curated rather than exhaustive
        if (counter > 0 && counter % 3 === 0 && typo.id === "editorial") continue;

        const id = `${layout.id}-${color.id}-${typo.id}`;
        const label = `${color.label} ${layout.label} (${typo.label})`;

        templates.push({
          id,
          label,
          supportedTypes: layout.bestFor,
          layoutId: layout.id,
          colorThemeId: color.id,
          typographyThemeId: typo.id,
          decorations: {
            watermark: layout.id === "poster" || layout.id === "spotlight",
            orbs: color.id.includes("neon") || color.id.includes("indigo"),
            noise: layout.id !== "spotlight",
            borderGlow: color.id.includes("neon") || color.id.includes("rose"),
            brandLogo: true,
            shadowDepth: layout.id === "floating" ? 3 : layout.id === "card-in-card" ? 2 : 1,
          },
          previewColor: color.accent,
          tags: [layout.id, color.id, typo.id, ...layout.bestFor],
        });

        counter++;
      }
    }
  }

  return templates;
}

/** Full registry of all generated templates */
export const TEMPLATE_REGISTRY: ShareTemplate[] = generateTemplates();

/** Quick ID-based lookup */
export function getTemplate(id: string): ShareTemplate | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}

/** Filter templates by content type */
export function getTemplatesForType(type: ContentType): ShareTemplate[] {
  return TEMPLATE_REGISTRY.filter((t) => t.supportedTypes.includes(type));
}

/** Get layout primitive by ID */
export function getLayout(id: LayoutId): LayoutPrimitive | undefined {
  return LAYOUT_PRIMITIVES.find((l) => l.id === id);
}

/** Get color theme by ID */
export function getColorTheme(id: string): ColorTheme | undefined {
  return COLOR_THEMES.find((c) => c.id === id);
}

/** Get typography theme by ID */
export function getTypographyTheme(id: string): TypographyTheme | undefined {
  return TYPOGRAPHY_THEMES.find((t) => t.id === id);
}

/* ────── CONTENT-AWARE TOPIC GENERATION ────── */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "biology": ["cell", "dna", "rna", "protein", "mitochondr", "photosynthes", "gene", "enzyme", "organ", "tissue", "evolution", "ecology"],
  "chemistry": ["atom", "molecule", "bond", "reaction", "acid", "base", "pH", "electron", "orbital", "compound", "stoichiom", "periodic"],
  "physics": ["force", "energy", "momentum", "wave", "quantum", "relativity", "thermodynamic", "electric", "magnetic", "gravity", "velocity", "acceleration"],
  "mathematics": ["equation", "integral", "derivative", "matrix", "vector", "theorem", "proof", "polynomial", "function", "calculus", "algebra", "geometry"],
  "computer science": ["algorithm", "data structure", "array", "binary", "tree", "graph", "recursion", "complexity", "stack", "queue", "hash", "sorting"],
  "history": ["war", "revolution", "empire", "dynasty", "treaty", "century", "civilization", "colonial", "industrial", "ancient", "medieval", "modern"],
  "psychology": ["cogniti", "behavior", "memory", "perception", "emotion", "neuron", "disorder", "therapy", "conscious", "unconsc", "operant", "classical"],
  "economics": ["supply", "demand", "market", "inflation", "gdp", "fiscal", "monetary", "trade", "utility", "equilibrium", "cost", "profit"],
  "philosophy": ["ethics", "moral", "epistemol", "ontolog", "metaphys", "logic", "aesthet", "existential", "platonic", "utilitarian", "categorical"],
  "literature": ["narrative", "metaphor", "protagonist", "theme", "symbol", "allegory", "genre", "syntax", "rhetoric", "irony", "satire", "imagery"],
};

/**
 * Extracts topic tags from content text.
 * Scans for keyword matches and returns ranked topics.
 */
export function extractTopics(text: string, maxTopics: number = 3): string[] {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw, "gi");
      const matches = lower.match(regex);
      if (matches) score += matches.length;
    }
    if (score > 0) scores[topic] = score;
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTopics)
    .map(([topic]) => topic);
}

/** ────── SVG GENERATOR ────── */

/**
 * Wraps text into SVG tspans
 */
function wrapSvgText(text: string, x: number, startY: number, lineWidth: number, fontSize: number): string {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    // Rough but better estimation: avg char width is ~0.6 of fontSize for Inter
    const charWidth = fontSize * 0.55;

    for (const word of words) {
        if ((currentLine + word).length * charWidth > lineWidth) {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word + " ";
        } else {
            currentLine += word + " ";
        }
    }
    if (currentLine) lines.push(currentLine.trim());

    return lines.map((line, i) => 
        `<tspan x="${x}" dy="${i === 0 ? 0 : '1.15em'}">${line}</tspan>`
    ).join("");
}

export function renderTemplate(templateId: string, content: ShareableContent): string {
    const template = getTemplate(templateId) || TEMPLATE_REGISTRY[0];
    const layout = getLayout(template.layoutId) || LAYOUT_PRIMITIVES[0];
    const color = getColorTheme(template.colorThemeId) || COLOR_THEMES[0];
    const typo = getTypographyTheme(template.typographyThemeId) || TYPOGRAPHY_THEMES[0];

    const width = 1080;
    const height = 1350;
    const padding = 80;

    // Base SVG — Using 100% for responsive container support
    let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">`;
    
    // Defs: Gradients, Filters, Fonts
    svg += `
    <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
            <stop stop-color="${color.background.includes('gradient') ? '#0A0A14' : color.background}"/>
            <stop offset="1" stop-color="${color.accent}22"/>
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="30" />
        </filter>
        <filter id="cardShadow">
            <feDropShadow dx="0" dy="20" stdDeviation="40" flood-opacity="0.3"/>
        </filter>
    </defs>
    `;

    // 1. Background
    svg += `<rect width="${width}" height="${height}" fill="${color.background.includes('gradient') ? color.background : color.background}"/>`;
    
    // 2. Decorative Orbs
    if (template.decorations?.orbs) {
        svg += `
        <circle cx="${width * 0.2}" cy="${height * 0.2}" r="300" fill="${color.accent}" fill-opacity="0.1" filter="url(#softGlow)"/>
        <circle cx="${width * 0.8}" cy="${height * 0.8}" r="400" fill="${color.accent}" fill-opacity="0.05" filter="url(#softGlow)"/>
        `;
    }

    // 3. Layout Rendering
    const innerW = width - (padding * 2);
    const innerH = height - (padding * 2);

    switch(layout.id) {
        case "centered":
            svg += `
            <g transform="translate(${padding}, ${padding})">
                <rect width="${innerW}" height="${innerH}" rx="40" fill="${color.cardBg}" stroke="${color.border}" stroke-width="2"/>
                <text x="${innerW/2}" y="${innerH*0.25}" text-anchor="middle" fill="${color.text}" font-family="${typo.headingFont}" font-size="${60 * typo.headingScale}" font-weight="${typo.headingWeight}">${wrapSvgText(content.title, innerW/2, 0, innerW * 0.8, 60)}</text>
                <text x="${innerW/2}" y="${innerH/2 + 40}" text-anchor="middle" fill="${color.accent}" font-family="${typo.bodyFont}" font-size="160" font-weight="900">${content.data.count || content.topics[0] || '100%'}</text>
                <text x="${innerW/2}" y="${innerH/2 + 120}" text-anchor="middle" fill="${color.text}88" font-family="${typo.bodyFont}" font-size="24" font-weight="700" letter-spacing="0.2em">${content.type.toUpperCase()}</text>
                <text x="${innerW/2}" y="${innerH - 60}" text-anchor="middle" fill="${color.textMuted}" font-family="${typo.bodyFont}" font-size="20">Mastered by ${content.author || 'Scholar'} · ${new Date().toLocaleDateString()}</text>
            </g>
            `;
            break;

        case "split-vertical":
            svg += `
            <g transform="translate(${padding}, ${padding})">
                <rect width="${innerW/2 - 20}" height="${innerH}" rx="40" fill="${color.cardBg}" stroke="${color.border}" stroke-width="2"/>
                <rect x="${innerW/2 + 20}" width="${innerW/2 - 20}" height="${innerH}" rx="40" fill="${color.accent}11" stroke="${color.accent}33" stroke-width="2"/>
                
                <text x="${innerW*0.25 - 10}" y="${innerH/2}" text-anchor="middle" fill="${color.text}" font-family="${typo.headingFont}" font-size="${48 * typo.headingScale}" font-weight="${typo.headingWeight}">${wrapSvgText(content.title, innerW*0.25 - 10, 0, innerW * 0.4, 48)}</text>
                
                <text x="${innerW*0.75 + 10}" y="${innerH/2}" text-anchor="middle" fill="${color.accent}" font-family="${typo.bodyFont}" font-size="140" font-weight="900">${content.data.count || '99'}</text>
                <text x="${innerW*0.75 + 10}" y="${innerH/2 + 60}" text-anchor="middle" fill="${color.text}66" font-family="${typo.bodyFont}" font-size="18" font-weight="700" letter-spacing="0.1em">${content.type.toUpperCase()}</text>
            </g>
            `;
            break;

        case "magazine":
            svg += `
            <g transform="translate(${padding}, ${padding})">
                <rect x="120" width="${innerW - 120}" height="${innerH}" rx="20" fill="${color.cardBg}"/>
                <line x1="80" y1="0" x2="80" y2="${innerH}" stroke="${color.accent}" stroke-width="4" stroke-dasharray="10 10"/>
                
                <text x="60" y="${innerH/2}" text-anchor="middle" fill="${color.accent}" font-family="${typo.bodyFont}" font-size="16" font-weight="900" transform="rotate(-90, 60, ${innerH/2})" style="letter-spacing: 0.5em">ACADEMIC RECORD v1.0</text>
                
                <text x="180" y="120" text-anchor="start" fill="${color.text}" font-family="${typo.headingFont}" font-size="${72 * typo.headingScale}" font-weight="${typo.headingWeight}">${wrapSvgText(content.title, 180, 0, innerW - 240, 72)}</text>
                
                <rect x="180" y="${innerH - 240}" width="300" height="140" rx="20" fill="${color.accent}"/>
                <text x="330" y="${innerH - 150}" text-anchor="middle" fill="${color.background.includes('FBF7') ? '#FFFFFF' : '#000000'}" font-family="${typo.bodyFont}" font-size="72" font-weight="900">${content.data.count || '8'}</text>
                <text x="520" y="${innerH - 160}" text-anchor="start" fill="${color.text}" font-family="${typo.bodyFont}" font-size="28" font-weight="700">${content.type.toUpperCase()}</text>
            </g>
            `;
            break;

        case "card-in-card":
            svg += `
            <g transform="translate(${padding}, ${padding})">
                <rect width="${innerW}" height="${innerH}" rx="60" fill="${color.cardBg}" stroke="${color.border}" stroke-width="1"/>
                
                <text x="${innerW/2}" y="120" text-anchor="middle" fill="${color.text}44" font-family="${typo.bodyFont}" font-size="14" font-weight="900" letter-spacing="0.4em">VERIFIED ACHIEVEMENT</text>
                
                <text x="${innerW/2}" y="${innerH/2 - 100}" text-anchor="middle" fill="${color.text}" font-family="${typo.headingFont}" font-size="${52 * typo.headingScale}" font-weight="${typo.headingWeight}">${wrapSvgText(content.title, innerW/2, 0, innerW * 0.7, 52)}</text>
                
                <rect x="${innerW/2 - 140}" y="${innerH/2 + 20}" width="280" height="280" rx="140" fill="${color.background}" stroke="${color.accent}" stroke-width="8" filter="url(#cardShadow)"/>
                <text x="${innerW/2}" y="${innerH/2 + 185}" text-anchor="middle" fill="${color.accent}" font-family="${typo.bodyFont}" font-size="100" font-weight="900">${content.data.count || '12'}</text>
            </g>
            `;
            break;

        case "poster":
            svg += `
            <g transform="translate(${padding}, ${padding})">
                <text x="0" y="150" text-anchor="start" fill="${color.accent}" font-family="${typo.headingFont}" font-size="${120 * typo.headingScale}" font-weight="900" letter-spacing="-0.04em">${wrapSvgText(content.title, 0, 0, innerW, 120)}</text>
                
                <rect y="${innerH - 300}" width="${innerW}" height="300" fill="${color.accent}11"/>
                <text x="${innerW - 40}" y="${innerH - 120}" text-anchor="end" fill="${color.accent}" font-family="${typo.bodyFont}" font-size="200" font-weight="900" opacity="0.3">${content.data.count || '99'}</text>
                
                <text x="40" y="${innerH - 180}" text-anchor="start" fill="${color.text}" font-family="${typo.bodyFont}" font-size="32" font-weight="800">${content.type.toUpperCase()}</text>
                <text x="40" y="${innerH - 140}" text-anchor="start" fill="${color.text}44" font-family="${typo.bodyFont}" font-size="16" font-weight="600">BY THE PROFESSOR AI · ${(content.author || 'Scholar').toUpperCase()}</text>
            </g>
            `;
            break;

        default: // Fallback to centered
            svg += `
            <g transform="translate(${padding}, ${padding})">
                <rect width="${innerW}" height="${innerH}" rx="40" fill="${color.cardBg}" stroke="${color.border}" stroke-width="1"/>
                <text x="${innerW/2}" y="${innerH/2}" text-anchor="middle" fill="${color.text}">${content.title}</text>
            </g>
            `;
    }

    // 4. Branding & Final
    svg += `
    <g transform="translate(${width/2}, ${height - 50})">
        <text text-anchor="middle" fill="${color.text}22" font-family="'Inter', sans-serif" font-size="12" font-weight="900" letter-spacing="0.5em">THE PROFESSOR AI SYSTEM</text>
    </g>
    `;

    svg += `</svg>`;
    return svg;
}

/**
 * Generates a full shareable content object from raw generation data.
 */
export function createShareableContent(
  type: ContentType,
  title: string,
  data: Record<string, unknown>,
  author?: string,
): ShareableContent {
  // Extract text from data for topic detection
  const textContent = JSON.stringify(data).replace(/[{}\[\]"]/g, " ");
  const topics = extractTopics(textContent);

  return {
    type,
    title,
    data,
    topics,
    author,
    createdAt: new Date().toISOString(),
  };
}

/* ────── STATS ────── */
export function getRegistryStats() {
  const byLayout: Record<string, number> = {};
  const byColor: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const t of TEMPLATE_REGISTRY) {
    byLayout[t.layoutId] = (byLayout[t.layoutId] || 0) + 1;
    byColor[t.colorThemeId] = (byColor[t.colorThemeId] || 0) + 1;
    for (const ct of t.supportedTypes) {
      byType[ct] = (byType[ct] || 0) + 1;
    }
  }

  return {
    total: TEMPLATE_REGISTRY.length,
    byLayout,
    byColor,
    byType,
  };
}
