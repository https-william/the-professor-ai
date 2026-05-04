"use client";

import Link from "next/link";
import StandardContainer from "@/components/ui/StandardContainer";
import { blogPosts, getAllCategories, getFeaturedPosts } from "@/lib/blog/posts";
import type { BlogPost } from "@/lib/blog/posts";
import { useState } from "react";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SEOHead, { getFAQSchema } from "@/components/SEOHead";

import { 
  Brain, 
  Bot, 
  Calendar, 
  FileText, 
  Lightbulb, 
  GraduationCap, 
  Clock, 
  Mail, 
  ArrowRight, 
  BookOpen, 
  Zap, 
  Home, 
  PenTool, 
  Moon,
  LayoutDashboard,
  Sparkles
} from "lucide-react";
import NewsFeed from "@/components/blog/NewsFeed";

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

/* ═══ Featured Hero Card ═══ */
function FeaturedCard({ post }: { post: BlogPost }) {
  const IconComponent = (IconMap as any)[post.icon] || Brain;
  
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
          <IconComponent className="w-7 h-7 text-white" />
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
              <GraduationCap className="w-3.5 h-3.5 text-[var(--background)]" />
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
            <Clock className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ═══ Regular Blog Card ═══ */
function BlogCard({ post }: { post: BlogPost }) {
  const IconComponent = (IconMap as any)[post.icon] || Brain;

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
            <Clock className="w-3 h-3" />
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
            <IconComponent className="w-5 h-5 text-white" />
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
          <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
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

      {/* Navigation - Minimal and Floating */}
      <nav className="fixed top-0 w-full z-50 px-3 md:px-4 py-3 md:py-4">
        <StandardContainer narrow
          className="flex items-center justify-between px-4 md:px-5 py-2 md:py-2.5 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1.5px solid var(--card-border)",
            borderTop: "1.5px solid rgba(255,255,255,0.1)",
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)",
          }}
        >
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <BrandLogo size="sm" />
            <span className="hidden sm:block font-heading font-black text-[var(--foreground)] tracking-tighter text-[15px] uppercase">
              The Professor
            </span>
          </Link>

          {/* Floating Middle Blog Identifier */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3 px-4 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded-full shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--foreground)] opacity-80">Knowledge Hub</span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/signup" 
              className="hidden sm:flex text-[11px] font-black uppercase tracking-widest text-[var(--accent)] hover:opacity-80 transition-all"
            >
              Enter Workspace
            </Link>
            <ThemeToggle variant="minimal" />
          </div>
        </StandardContainer>
      </nav>

      <StandardContainer narrow className="relative z-10 pt-28 sm:pt-36">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-[var(--accent-bg)] border border-[var(--accent-glow)]">
            <Sparkles className="w-3 h-3 text-[var(--accent)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Exclusive Insights</span>
          </div>
          <h1 className="font-galaxie text-4xl sm:text-[64px] font-bold text-[var(--foreground)] tracking-tight mb-6 leading-[0.95]">
            Master Your Hall.
          </h1>
          <p className="text-[16px] text-[var(--foreground-muted)] max-w-xl mx-auto leading-relaxed font-medium">
            Evidence-based strategies to experience the exam before it starts.
            Turning passive study into <span className="text-[var(--foreground)]">unbreakable intuition.</span>
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

        {/* News Engine Section */}
        <NewsFeed />

        {/* Newsletter CTA */}
        <div
          className="mt-24 p-8 sm:p-16 text-center relative overflow-hidden group"
          style={{
            ...clay.card,
            borderRadius: "40px",
            background: "linear-gradient(145deg, var(--card), rgba(0,0,0,0.4))",
          }}
        >
          <div className="relative z-10">
            <h3 className="font-galaxie text-2xl sm:text-4xl font-bold text-white mb-4">
              Get the Professor's Edge.
            </h3>
            <p className="text-[15px] text-white/40 max-w-md mx-auto mb-10 leading-relaxed">
              Join 12,000+ students receiving weekly deep-dives into academic leverage and AI intuition.
            </p>
            <Link 
              href="/signup" 
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: "var(--foreground)",
                color: "var(--background)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
              }}
            >
              Enter Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </StandardContainer>
    </div>
  );
}

