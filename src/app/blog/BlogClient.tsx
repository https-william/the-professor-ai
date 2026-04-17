"use client";

import Link from "next/link";
import { blogPosts, getAllCategories, getFeaturedPosts } from "@/lib/blog/posts";
import type { BlogPost } from "@/lib/blog/posts";
import { useState } from "react";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SEOHead, { getFAQSchema } from "@/components/SEOHead";

/* ═══ Claymorphic Helpers ═══ */
const clay = {
  card: {
    background: "var(--card)",
    borderRadius: "24px",
    border: "1px solid var(--card-border)",
    boxShadow: "var(--shadow-lg), inset 0 1px 1px var(--card-border)",
  } as React.CSSProperties,
  pill: {
    background: "var(--background-secondary)",
    borderRadius: "14px",
    boxShadow: "var(--shadow-sm), inset 0 1px 1px var(--card-border)",
  } as React.CSSProperties,
};

/* ═══ Featured Hero Card ═══ */
function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block relative overflow-hidden transition-all duration-500 hover:translate-y-[-4px]"
      style={{
        ...clay.card,
        borderRadius: "28px",
        boxShadow: "var(--shadow-xl), inset 0 1px 1px var(--card-border)",
      }}
    >
      {/* Gradient Header */}
      <div
        className="h-48 sm:h-56 relative flex items-end p-6 sm:p-8"
        style={{ background: post.coverGradient }}
      >
        {/* Overlay pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)",
          }}
        />
        {/* Floating icon */}
        <div
          className="absolute top-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <span className="material-symbols-outlined text-[28px] text-white">
            {post.icon}
          </span>
        </div>
        {/* Featured badge */}
        <span
          className="absolute top-6 left-6 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest"
          style={{
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          Featured
        </span>
        {/* Title on gradient */}
        <h2 className="relative z-10 text-2xl sm:text-3xl font-bold text-white font-heading leading-tight max-w-lg">
          {post.title}
        </h2>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8">
        <p className="text-[14px] text-[var(--foreground-muted)] leading-relaxed mb-5 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                boxShadow: "0 2px 8px var(--accent-glow)",
              }}
            >
              <span className="material-symbols-outlined text-[14px] text-[var(--background)]">
                school
              </span>
            </div>
            <div>
              <p className="text-[12px] font-bold text-[var(--foreground-secondary)]">
                {post.author}
              </p>
              <p className="text-[10px] text-[var(--foreground-muted)]">
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[var(--foreground-muted)] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">
              schedule
            </span>
            {post.readTime}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ═══ Regular Blog Card ═══ */
function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block relative overflow-hidden transition-all duration-400 hover:translate-y-[-3px]"
      style={clay.card}
    >
      {/* Top accent line */}
      <div
        className="h-1 w-full"
        style={{ background: post.coverGradient }}
      />

      <div className="p-5 sm:p-6">
        {/* Category + Read time */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg"
            style={{
              ...clay.pill,
              border: "1px solid var(--border)",
              color: "var(--foreground-muted)",
            }}
          >
            {post.category}
          </span>
          <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">
              schedule
            </span>
            {post.readTime}
          </span>
        </div>

        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{
              background: post.coverGradient,
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <span className="material-symbols-outlined text-[20px] text-white">
              {post.icon}
            </span>
          </div>
          <h3 className="text-[16px] sm:text-[17px] font-bold text-[var(--foreground-secondary)] font-heading leading-snug group-hover:text-[var(--foreground)] transition-colors">
            {post.title}
          </h3>
        </div>

        {/* Excerpt */}
        <p className="text-[13px] text-[var(--foreground-muted)] leading-relaxed line-clamp-2 mb-5 pl-[60px]">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pl-[60px]">
          <p className="text-[11px] text-white/15">
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <span className="material-symbols-outlined text-[16px] text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all">
            arrow_forward
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogClient() {
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", ...getAllCategories()];
  const featured = getFeaturedPosts();

  const filteredPosts =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((p) => p.category === activeCategory);

  const nonFeaturedPosts = filteredPosts.filter((p) => !p.featured);
  const featuredInFilter = filteredPosts.filter((p) => p.featured);

  const getFAQSchema = () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the best study technique for exam preparation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Professor recommends Active Recall and Spaced Repetition as the most evidence-based techniques for long-term retention and mastery according to learning science."
        }
      },
      {
        "@type": "Question",
        "name": "How does AI help in learning science?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AI helps personalize the learning path, generates practice materials like flashcards and quizzes instantly, and provides 24/7 mentoring based on educational pedagogical standards."
        }
      }
    ]
  });

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground-secondary)] pb-28 relative overflow-hidden">
      {/* FAQ Schema for AEO/SEO */}
      <SEOHead type="FAQPage" data={getFAQSchema()} />
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute w-[600px] h-[600px] rounded-full animate-pulse"
          style={{
            top: "-15%",
            left: "-10%",
            background:
              "radial-gradient(circle, rgba(245,158,11,0.04), transparent 60%)",
            filter: "blur(80px)",
            animationDuration: "8s",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full animate-pulse"
          style={{
            bottom: "5%",
            right: "-10%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.03), transparent 60%)",
            filter: "blur(70px)",
            animationDuration: "10s",
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-3 md:px-4 py-3 md:py-4">
        <div
          className="max-w-4xl mx-auto flex items-center justify-between px-4 md:px-5 py-2 md:py-2.5 rounded-full"
          style={{
            background: "var(--card)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1.5px solid var(--card-border)",
            borderTop: "1.5px solid var(--border)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)",
          }}
        >
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <BrandLogo size="sm" />
            <span className="text-xs font-bold tracking-widest text-white/30 uppercase group-hover:text-white/60 transition-colors hidden sm:inline">
              Blog
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold transition-all hover:translate-y-[-1px] active:scale-95 shadow-[0_4px_12px_var(--accent-glow)]"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                color: "var(--background)",
              }}
            >
              <span className="material-symbols-outlined text-[13px]">
                dashboard
              </span>
              Dashboard
            </Link>
            <ThemeToggle variant="minimal" />
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 pt-28 sm:pt-32">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(145deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
                boxShadow:
                  "inset 0 2px 3px rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.25), 0 4px 16px rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.1)",
              }}
            >
              <span className="material-symbols-outlined text-2xl text-[#F59E0B]">
                auto_stories
              </span>
            </div>
          </div>
          <h1 className="font-heading text-3xl sm:text-[44px] font-bold text-[var(--foreground)] tracking-tight mb-3 leading-tight">
            The Professor&apos;s Blog
          </h1>
          <p className="text-[15px] text-[var(--foreground-muted)] max-w-lg mx-auto leading-relaxed">
            Evidence-based study techniques, academic insights, and the science
            of learning — from your favorite AI professor.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all duration-200"
              style={
                activeCategory === cat
                  ? {
                      background: "var(--accent-bg)",
                      border: "1px solid var(--accent-glow)",
                      color: "var(--accent)",
                      boxShadow:
                        "inset 0 1px 2px var(--accent-glow), 0 2px 8px var(--accent-glow)",
                    }
                  : {
                      ...clay.pill,
                      border: "1px solid var(--border)",
                      color: "var(--foreground-muted)",
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Posts */}
        {activeCategory === "All" && featured.length > 0 && (
          <div className="grid gap-6 mb-10">
            {featured.map((post) => (
              <FeaturedCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        {/* Show featured in filter if not "All" */}
        {activeCategory !== "All" && featuredInFilter.length > 0 && (
          <div className="grid gap-6 mb-10">
            {featuredInFilter.map((post) => (
              <FeaturedCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        {/* All Posts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(activeCategory === "All" ? blogPosts.filter(p => !p.featured) : nonFeaturedPosts).map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        {/* Newsletter CTA */}
        <div
          className="mt-16 p-8 sm:p-10 text-center relative overflow-hidden"
          style={{
            ...clay.card,
            borderRadius: "28px",
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 60%)",
            }}
          />
          <div className="relative z-10">
            <span className="material-symbols-outlined text-4xl text-[#F59E0B]/40 mb-4 block">
              mark_email_read
            </span>
            <h3 className="font-heading text-xl sm:text-2xl font-bold text-white/80 mb-2">
              Stay Sharp
            </h3>
            <p className="text-[13px] text-white/25 max-w-md mx-auto mb-6">
              New articles on study science, learning techniques, and AI in
              education. No spam, just signal.
            </p>
            <div className="flex items-center gap-3 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[13px] text-white/70 placeholder:text-white/15 outline-none focus:border-[#F59E0B]/30 transition-colors"
              />
              <button
                className="px-5 py-3 rounded-xl text-[12px] font-bold transition-all active:scale-95 hover:translate-y-[-1px] flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: "#08080E",
                  boxShadow:
                    "inset 0 1px 2px rgba(255,255,255,0.2), 0 4px 12px rgba(245,158,11,0.25)",
                }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
