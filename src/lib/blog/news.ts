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
    title: "Socratic AI beats passive lecturing in study tests",
    summary: "New research shows that AI study partners driving active inquiry increase retention by 30%. Simply giving students the answers leads to empty brains.",
    source: "EdTech Insights",
    date: "Apr 20, 2026"
  },
  {
    id: "news-2",
    category: "Neuroscience",
    title: "Brain scans confirm spacing beats cramming",
    summary: "Neuroscience studies show that retrieval practice spaced over intervals builds durable memory pathways. Your 3 AM library grind is officially a waste.",
    source: "Nature Learning",
    date: "Apr 18, 2026"
  },
  {
    id: "news-3",
    category: "Productivity",
    title: "Monotasking: the rare superpower of 2026",
    summary: "Focusing on one single task without checking your phone is now the top predictor of academic success. Multitasking is just being mediocre at three things at once.",
    source: "Scholar Weekly",
    date: "Apr 15, 2026"
  },
  {
    id: "news-4",
    category: "AI in Ed",
    title: "West African students lead AI retrieval wave",
    summary: "From Lagos to Accra, students like Tunde and Bolu are swapping passive summaries for automated active recall simulations to pass their WAEC and university exams.",
    source: "Academic Sentinel",
    date: "May 02, 2026"
  }
];
