/**
 * Professor's Pulse — Static store for quick academic news and study snippets.
 */

export interface NewsItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  source: string;
  date: string;
}

export const newsItems: NewsItem[] = [
  {
    id: "news-1",
    category: "AI Research",
    title: "Large Language Models now simulate Socratic tutoring",
    summary: "Recent studies show that AI agents can increase student retention by 30% when using inquiry-based methods rather than direct answers.",
    source: "EdTech Insights",
    date: "Apr 20, 2026"
  },
  {
    id: "news-2",
    category: "Neuroscience",
    title: "The 'Spacing Effect' confirmed in long-term linguistic study",
    summary: "New brain scans reveal that interval-based retrieval strengthens neural connections in the hippocampus faster than traditional repetition.",
    source: "Nature Learning",
    date: "Apr 18, 2026"
  },
  {
    id: "news-3",
    category: "Productivity",
    title: "Monotasking is the new superpower in 2026",
    summary: "In a world of fragments, the ability to maintain deep focus on a single mathematical or creative task is the top predictor of academic success.",
    source: "Scholar Weekly",
    date: "Apr 15, 2026"
  },
  {
    id: "news-4",
    category: "AI in Ed",
    title: "Regional Trends: AI-Assisted Retrieval on the Rise",
    summary: "New reports indicate a significant increase in students across West African universities adopting AI-native retrieval strategies to combat exam anxiety and improve recall accuracy.",
    source: "Academic Sentinel",
    date: "May 02, 2026"
  }
];
