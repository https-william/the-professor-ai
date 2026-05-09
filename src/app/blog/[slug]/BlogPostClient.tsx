"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BlogPost } from "@/lib/blog/posts";
import { blogPosts } from "@/lib/blog/posts";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import StudyPersonaQuiz from "@/components/blog/StudyPersonaQuiz";
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
    )
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-[var(--accent)] font-bold hover:underline decoration-[var(--accent-glow)] decoration-2 underline-offset-4">$1</a>'
    );
}


/* ═══ Blog Post Client Component ═══ */
export default function BlogPostClient({ post }: { post: BlogPost }) {
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById("main-scroll-container");
      if (!element) return;
      const totalHeight = element.scrollHeight - element.clientHeight;
      const progress = (element.scrollTop / totalHeight) * 100;
      setScrollProgress(progress);
    };

    const container = document.getElementById("main-scroll-container");
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);


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
      {/* Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-[var(--accent)] z-[10001] transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%`, boxShadow: "0 0 10px var(--accent-glow)" }}
      /      {/* Article Container */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 px-5 sm:px-6 pt-24 sm:pt-28">
        
        {/* Main Content Area */}
        <article className="max-w-3xl">
          {/* Hero */}
          <div
            className="scholar-card relative overflow-hidden mb-10"
            style={{
              borderRadius: "32px",
            }}
          >
            <div
              className="h-56 sm:h-80 relative flex flex-col justify-end p-6 sm:p-12"
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
              <h1 className="relative z-10 font-heading text-3xl sm:text-5xl font-bold text-white leading-[0.95] tracking-tight max-w-2xl">
                {post.title}
              </h1>
            </div>
          </div>

          {/* Meta bar */}
          <div
            className="flex items-center justify-between mb-12 p-5 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                  boxShadow: "0 2px 8px var(--accent-glow)",
                }}
              >
                <GraduationCap className="w-5 h-5 text-[var(--background)]" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[var(--foreground)]">
                  {post.author}
                </p>
                <p className="text-[11px] text-[var(--foreground-muted)] uppercase tracking-wider">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[12px] text-[var(--foreground-muted)] flex items-center gap-1.5 hidden sm:flex">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
              <div className="h-4 w-px bg-[var(--border)] hidden sm:block" />
              <div className="flex items-center gap-3">
                <button 
                  onClick={shareOnTwitter}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all border border-transparent hover:border-[var(--accent-glow)]"
                >
                  <Twitter className="w-4 h-4" />
                </button>
                <button 
                  onClick={shareOnReddit}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all border border-transparent hover:border-[var(--accent-glow)]"
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

        {/* Professor's Verdict */}
        <div 
          className="scholar-card mt-16 p-8 border border-[var(--accent-glow)] bg-[var(--accent-bg)]/30 relative overflow-hidden group"
          style={{ borderRadius: "24px" }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-12 h-12 text-[var(--accent)]" />
          </div>
          <h3 className="text-[11px] font-black text-[var(--accent)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
             The Professor's Verdict
          </h3>
          <p className="text-[17px] text-[var(--foreground-secondary)] italic leading-relaxed font-medium">
            "Listen carefully. Information is not knowledge. Most of you are drowning in information but starving for strategy. Reading this article won't save you—only execution will. Take the frameworks above and run them through the lab. Otherwise, you're just another library zombie."
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-10 mb-20">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold text-[var(--foreground-muted)] bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--accent-glow)] hover:text-[var(--accent)] transition-all cursor-default"
            >
              #{tag}
            </span>
          ))}
        </div>


        {/* Conversion Footer */}
        <div 
          className="scholar-card mt-24 p-10 sm:p-16 text-center relative overflow-hidden border border-[var(--accent-glow)]"
          style={{
            borderRadius: "40px",
            background: "linear-gradient(165deg, var(--card), var(--background))",
          }}
        >
          <div className="relative z-10">
            <h3 className="font-galaxie text-3xl sm:text-5xl font-bold text-[var(--foreground)] mb-6 tracking-tight leading-none">
              Stop Reading. Start Mastering.
            </h3>
            <p className="text-[17px] text-[var(--foreground-muted)] max-w-xl mx-auto mb-12 leading-relaxed">
              Knowledge without retrieval is just a distraction. Take this article's strategy and apply it to your own material inside the workspace.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                href="/signup" 
                className="btn-jelly"
              >
                Experience the Exam
              </Link>
              <Link 
                href="/login" 
                className="btn-skeuo px-8 py-4"
              >
                Return to Lab
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Sidebar */}
      <aside className="hidden lg:block sticky top-28 self-start space-y-6">
        <StudyPersonaQuiz />

        <div className="glass-panel p-6 rounded-3xl">
           <h4 className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.2em] mb-4 opacity-50">
              Our Frameworks
           </h4>
           <div className="space-y-3">
              <Link href="/glossary/professor-recall-loop" className="block text-[13px] font-medium text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors">
                 The Professor Recall Loop
              </Link>
              <Link href="/glossary/neural-revision-system" className="block text-[13px] font-medium text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors">
                 Neural Revision System
              </Link>
           </div>
        </div>
        
        <div 
          className="glass-panel p-6 rounded-3xl"
        >

          <h4 className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.2em] mb-6 opacity-50">
            Table of Contents
          </h4>
          <nav className="space-y-4">
            {toc.map((item) => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                className="block text-[13px] font-medium text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors leading-snug"
              >
                {item.text}
              </a>
            ))}
          </nav>

          <div className="mt-10 pt-8 border-t border-[var(--border)]">
             <h4 className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.2em] mb-4 opacity-50">
                Share Intelligence
             </h4>
             <div className="flex gap-3">
                <button 
                  onClick={shareOnTwitter}
                  className="flex-1 btn-skeuo py-2.5 px-0"
                >
                  <Twitter className="w-4 h-4" />
                </button>
                <button 
                  onClick={shareOnReddit}
                  className="flex-1 btn-skeuo py-2.5 px-0"
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
        <div className="mt-24">
          <h3 className="font-heading text-[11px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.3em] mb-10 text-center opacity-40">
            More Intelligence
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((rp) => {
              const IconComponent = (IconMap as any)[rp.icon] || Brain;
              return (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="scholar-card group p-6 transition-all duration-400 hover:translate-y-[-4px]"
                  style={{
                    borderRadius: "24px",
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: rp.coverGradient }}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest">
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

