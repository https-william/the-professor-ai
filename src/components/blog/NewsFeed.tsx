"use client";

import { newsItems } from "@/lib/blog/news";
import { Newspaper } from "lucide-react";

export default function NewsFeed() {
  return (
    <section className="mt-16 sm:mt-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center border border-[var(--accent-glow)]">
          <Newspaper className="w-5 h-5 text-[var(--accent)]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] font-heading">Professor&apos;s Pulse</h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">Latest in Academic Excellence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {newsItems.map((news) => (
          <div 
            key={news.id}
            className="scholar-card p-6 transition-all group"
            style={{ borderRadius: "20px" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-[var(--background-secondary)] text-[var(--foreground-muted)] border border-[var(--border)]">
                {news.category}
              </span>
              <span className="text-[10px] text-[var(--foreground-muted)] opacity-50">{news.date}</span>
            </div>
            <h3 className="text-[15px] font-bold text-[var(--foreground-secondary)] line-clamp-1 mb-3 group-hover:text-[var(--foreground)] transition-colors">
              {news.title}
            </h3>
            <p className="text-[12px] text-[var(--foreground-muted)] leading-relaxed line-clamp-2">
              {news.summary}
            </p>
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="italic text-[10px] text-[var(--foreground-muted)] opacity-30">
                Source: {news.source}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
