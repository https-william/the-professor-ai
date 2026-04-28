"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BlogPost } from "@/lib/blog/posts";
import { blogPosts } from "@/lib/blog/posts";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { 
  ArrowLeft, 
  GraduationCap, 
  Clock,
  Brain,
  Bot,
  Calendar,
  FileText,
  Lightbulb,
  Home,
  Zap,
  PenTool,
  Moon
} from "lucide-react";

/* ═══ Icon Components Mapping ═══ */
const IconMap = {
  Brain,
  Bot,
  Calendar,
  FileText,
  Lightbulb,
  Home,
  Zap,
  PenTool,
  Moon
};

/* ═══ Simple Markdown Renderer ═══ */
function renderMarkdown(md: string) {
  const lines = md.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let tableRows: string[][] = [];
  let inTable = false;
  let tableHeaderParsed = false;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
        tableHeaderParsed = false;
      }

      // Skip separator row (|---|---|)
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) {
        tableHeaderParsed = true;
        i++;
        continue;
      }

      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      i++;
      continue;
    } else if (inTable) {
      // Flush table
      inTable = false;
      const header = tableRows[0];
      const body = tableRows.slice(1);
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-6">
          <table className="w-full text-[13px]" style={{
            borderCollapse: "separate",
            borderSpacing: 0,
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid var(--card-border)",
          }}>
            <thead>
              <tr>
                {header.map((h, j) => (
                  <th
                    key={j}
                    className="text-left px-4 py-3 font-bold text-[var(--foreground-muted)] text-[11px] uppercase tracking-wider"
                    style={{ background: "var(--background-secondary)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-2.5 text-[var(--foreground-secondary)]"
                      style={{
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      continue; // Re-process current line
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="font-heading font-bold text-[var(--foreground)] mt-12 mb-5 tracking-tight"
          style={{ fontSize: "var(--text-h2)" }}
        >
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="font-heading font-bold text-[var(--foreground-secondary)] mt-10 mb-4"
          style={{ fontSize: "var(--text-h3)" }}
        >
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-2 my-4 pl-1">
          {listItems.map((item, j) => (
            <li key={j} className="flex gap-3 text-[15px] text-[var(--foreground-muted)] leading-relaxed">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold mt-0.5"
                style={{
                  background: "var(--accent-bg)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-glow)",
                }}
              >
                {j + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: inlineMd(item) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list
    if (line.trim().startsWith("- ")) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-2 my-4 pl-1">
          {listItems.map((item, j) => (
            <li key={j} className="flex gap-3 text-[15px] text-[var(--foreground-muted)] leading-relaxed">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--accent)]/40 mt-2.5" />
              <span dangerouslySetInnerHTML={{ __html: inlineMd(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p
        key={`p-${i}`}
        className="text-[var(--foreground-secondary)] leading-[1.65] mb-6"
        style={{ fontSize: "var(--text-body)" }}
        dangerouslySetInnerHTML={{ __html: inlineMd(line) }}
      />
    );
    i++;
  }

  // Flush any remaining table
  if (inTable && tableRows.length > 0) {
    const header = tableRows[0];
    const body = tableRows.slice(1);
    elements.push(
      <div key="table-end" className="overflow-x-auto my-6">
        <table className="w-full text-[13px]" style={{
          borderCollapse: "separate",
          borderSpacing: 0,
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <thead>
            <tr>
              {header.map((h, j) => (
                <th
                  key={j}
                  className="text-left px-4 py-3 font-bold text-white/50 text-[11px] uppercase tracking-wider"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-4 py-2.5 text-white/60"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return elements;
}

/* Inline markdown: bold, italic, code */
function inlineMd(text: string): string {
  return text
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="text-[var(--foreground-secondary)] font-semibold">$1</strong>'
    )
    .replace(/\*(.+?)\*/g, '<em class="text-[var(--foreground-muted)] italic">$1</em>')
    .replace(
      /`(.+?)`/g,
      '<code class="px-1.5 py-0.5 rounded-md bg-[var(--background-secondary)] text-[var(--accent)] text-[13px] font-mono">$1</code>'
    );
}

/* ═══ Blog Post Client Component ═══ */
export default function BlogPostClient({ post }: { post: BlogPost }) {
  const router = useRouter();

  // Find related posts (same category, different slug)
  const related = blogPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 2);

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground-secondary)] pb-28 relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute w-[500px] h-[500px] rounded-full animate-pulse"
          style={{
            top: "-10%",
            right: "-10%",
            background:
              "radial-gradient(circle, var(--accent-glow), transparent 60%)",
            filter: "blur(80px)",
            animationDuration: "8s",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-3 md:px-4 py-3 md:py-4">
        <div
          className="max-w-3xl mx-auto flex items-center justify-between px-4 md:px-5 py-2 md:py-2.5 rounded-full"
          style={{
            background: "var(--background-secondary)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1.5px solid var(--border)",
            boxShadow:
              "var(--shadow-lg), inset 0 1px 1px var(--card-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/blog")}
              className="flex items-center gap-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)] transition-colors text-[12px] font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Blog
            </button>
          </div>
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <BrandLogo size="sm" />
          </Link>
          <ThemeToggle variant="minimal" />
        </div>
      </nav>

      {/* Article */}
      <article className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 pt-24 sm:pt-28">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-3xl mb-10"
          style={{
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="h-56 sm:h-72 relative flex flex-col justify-end p-6 sm:p-10"
            style={{ background: post.coverGradient }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)",
              }}
            />
            {/* Category badge */}
            <span
              className="relative z-10 inline-block self-start px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-4"
              style={{
                background: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(8px)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              {post.category}
            </span>
            <h1 className="relative z-10 font-heading text-2xl sm:text-4xl font-bold text-white leading-tight max-w-2xl">
              {post.title}
            </h1>
          </div>
        </div>

        {/* Meta bar */}
        <div
          className="flex items-center justify-between mb-10 p-4 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                boxShadow: "0 2px 8px var(--accent-glow)",
              }}
            >
              <GraduationCap className="w-4 h-4 text-[var(--background)]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[var(--foreground-secondary)]">
                {post.author}
              </p>
              <p className="text-[10px] text-[var(--foreground-muted)]">
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <span className="text-[12px] text-white/20 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {post.readTime}
          </span>
        </div>

        {/* Content */}
        <div className="prose-professor">
          {useMemo(() => renderMarkdown(post.content), [post.content])}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-12 mb-16">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white/25"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <div>
            <h3 className="font-heading text-lg font-bold text-white/60 mb-5">
              Continue Reading
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((rp) => {
                const IconComponent = (IconMap as any)[rp.icon] || Brain;
                return (
                  <Link
                    key={rp.slug}
                    href={`/blog/${rp.slug}`}
                    className="group p-5 rounded-2xl transition-all duration-300 hover:translate-y-[-2px]"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: rp.coverGradient }}
                      >
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">
                        {rp.category}
                      </span>
                    </div>
                    <h4 className="text-[14px] font-bold text-[var(--foreground-secondary)] group-hover:text-[var(--foreground)] transition-colors leading-snug">
                      {rp.title}
                    </h4>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
