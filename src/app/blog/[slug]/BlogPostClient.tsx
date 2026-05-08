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
  ArrowRight,
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
  Moon,
  Share2,
  Twitter,
  Link as LinkIcon,
  MessageSquare
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
      const title = line.slice(3);
      const id = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      elements.push(
        <h2
          key={`h2-${i}`}
          id={id}
          className="font-heading font-bold text-[var(--foreground)] mt-12 mb-5 tracking-tight scroll-mt-24"
          style={{ fontSize: "var(--text-h2)" }}
        >
          {title}
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
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // Extract TOC headings
  const toc = useMemo(() => {
    const headings = post.content.match(/^##\s+(.+)$/gm) || [];
    return headings.map((h) => {
      const text = h.replace(/^##\s+/, "");
      const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      return { text, id };
    });
  }, [post.content]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`"${post.title}" - Essential intelligence from The Professor AI`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
  };

  const shareOnReddit = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);
    window.open(`https://www.reddit.com/submit?url=${url}&title=${title}`, "_blank");
  };

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
          <div className="flex items-center gap-2">
             <button 
                onClick={handleCopyLink}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all border border-transparent hover:border-[var(--accent-glow)]"
             >
                {copied ? <div className="text-[10px] font-bold">OK</div> : <LinkIcon className="w-3.5 h-3.5" />}
             </button>
             <ThemeToggle variant="minimal" />
          </div>
        </div>
      </nav>

      {/* Article Container */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 px-5 sm:px-6 pt-24 sm:pt-28">
        
        {/* Main Content Area */}
        <article className="max-w-3xl">
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
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-white/20 flex items-center gap-1.5 hidden sm:flex">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
              <div className="h-4 w-px bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-2">
                <button 
                  onClick={shareOnTwitter}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-[var(--accent)] hover:bg-white/5 transition-all"
                >
                  <Twitter className="w-4 h-4" />
                </button>
                <button 
                  onClick={shareOnReddit}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-[var(--accent)] hover:bg-white/5 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
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

        {/* Conversion Footer */}
        <div 
          className="mt-20 p-8 sm:p-12 rounded-[32px] text-center relative overflow-hidden border border-[var(--accent-glow)]"
          style={{
            background: "linear-gradient(145deg, rgba(245,158,11,0.08), rgba(0,0,0,0.4))",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
          }}
        >
          <div className="relative z-10">
            <h3 className="font-galaxie text-2xl sm:text-3xl font-bold text-white mb-4">
              Stop Reading. Start Mastering.
            </h3>
            <p className="text-[15px] text-white/50 max-w-lg mx-auto mb-8 leading-relaxed">
              Knowledge without retrieval is just a distraction. Take this article's strategy and apply it to your own material inside the workspace.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/signup" 
                className="px-8 py-4 rounded-2xl text-[14px] font-black uppercase tracking-widest bg-[var(--foreground)] text-[var(--background)] transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
              >
                Experience the Exam
              </Link>
              <Link 
                href="/login" 
                className="px-8 py-4 rounded-2xl text-[14px] font-black uppercase tracking-widest border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
              >
                Return to Lab
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Sidebar */}
      <aside className="hidden lg:block sticky top-28 self-start">
        <div 
          className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md"
          style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
        >
          <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">
            Table of Contents
          </h4>
          <nav className="space-y-4">
            {toc.map((item) => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                className="block text-[13px] text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors leading-snug"
              >
                {item.text}
              </a>
            ))}
          </nav>

          <div className="mt-10 pt-8 border-t border-white/5">
             <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">
                Share Intelligence
             </h4>
             <div className="flex gap-3">
                <button 
                  onClick={shareOnTwitter}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-[var(--accent)]/10 hover:border-[var(--accent-glow)] transition-all"
                >
                  <Twitter className="w-4 h-4" />
                </button>
                <button 
                  onClick={shareOnReddit}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-[var(--accent)]/10 hover:border-[var(--accent-glow)] transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      </aside>

    </div>

    {/* Related Posts Full Width */}
    <div className="max-w-6xl mx-auto px-5 sm:px-6 pb-28">
      {related.length > 0 && (
        <div className="mt-20">
          <h3 className="font-heading text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-8 text-center">
            More Intelligence
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((rp) => {
              const IconComponent = (IconMap as any)[rp.icon] || Brain;
              return (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group p-6 rounded-2xl transition-all duration-400 hover:translate-y-[-4px]"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: rp.coverGradient }}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                      {rp.category}
                    </span>
                  </div>
                  <h4 className="text-[16px] font-bold text-[var(--foreground-secondary)] group-hover:text-[var(--foreground)] transition-colors leading-tight">
                    {rp.title}
                  </h4>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* Persistent Mobile CTA */}
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm sm:hidden">
      <Link 
        href="/signup" 
        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-black uppercase tracking-widest shadow-2xl animate-fade-in-up"
      >
        Get Started <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  </div>
);
}

