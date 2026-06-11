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
      className="scholar-card card-interactive-lift group block relative"
      style={{
        borderRadius: "32px",
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
          className="absolute top-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover-rotate-sm"
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
      className="scholar-card group block relative transition-all duration-400 hover-lift-md"
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
            className="text-[10px] font-extrabold uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground-muted)]"
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
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover-scale-md"
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
          <p className="text-[11px] text-[var(--foreground-muted)] opacity-30">
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <ArrowRight className="w-4 h-4 text-[var(--foreground-muted)] opacity-20 group-hover:text-[var(--accent)] group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
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
          "text": "The Professor recommends Active Recall and Spaced Repetition as the most evidence-based techniques for long-term retention and understanding according to learning science."
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

      <StandardContainer narrow className="relative z-10 pt-28 sm:pt-36">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-[var(--accent-bg)] border border-[var(--accent-glow)]">
            <Sparkles className="w-3 h-3 text-[var(--accent)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Exclusive Insights</span>
          </div>
          <h1 className="font-galaxie text-4xl sm:text-[64px] font-bold text-[var(--foreground)] tracking-tight mb-6 leading-[0.95]">
            Ace Your Hall.
          </h1>
          <p className="text-[16px] text-[var(--foreground-muted)] max-w-xl mx-auto leading-relaxed font-medium">
            Evidence-based strategies to experience the exam before it starts.
            Turning passive study into <span className="text-[var(--foreground)]">unbreakable intuition.</span>
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 mb-12 overflow-x-auto pb-4 scrollbar-hide justify-center flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`btn-skeuo flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat 
                  ? "bg-[var(--accent-bg)] border-[var(--accent-glow)] text-[var(--accent)]" 
                  : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
              }`}
              style={
                activeCategory === cat
                  ? {
                      borderColor: "var(--accent-glow)",
                      color: "var(--accent)",
                      boxShadow: "0 8px 20px var(--accent-glow), inset 0 1px 1px rgba(255,255,255,0.1)",
                    }
                  : {}
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Posts */}
        {activeCategory === "All" && featured.length > 0 && (
          <div className="grid gap-6 mb-12">
            {featured.map((post) => (
              <FeaturedCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        {/* Show featured in filter if not "All" */}
        {activeCategory !== "All" && featuredInFilter.length > 0 && (
          <div className="grid gap-6 mb-12">
            {featuredInFilter.map((post) => (
              <FeaturedCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        {/* All Posts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {(activeCategory === "All" ? blogPosts.filter(p => !p.featured) : nonFeaturedPosts).map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        {/* News Engine Section */}
        <div className="mt-16">
          <NewsFeed />
        </div>

        {/* Author EEAT Panel */}
        <section className="mt-24 p-8 sm:p-12 rounded-[32px] bg-zinc-950/45 border border-[var(--border)] shadow-xl relative overflow-hidden group">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-tr from-[var(--blue-glow)] to-[var(--cyan-glow)] rounded-full blur-[100px] pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-[var(--blue)] to-[var(--cyan)] flex items-center justify-center text-white font-black text-4xl shadow-lg shrink-0 select-none" style={{ animation: 'bounce 4s infinite' }}>
              🎓
            </div>
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--blue-dim)] border border-[var(--blue-border)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--blue-text)]">Academic Director</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[var(--foreground)] font-heading leading-none">Meet the Professor</h2>
              <p className="text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed font-medium max-w-2xl">
                The Professor is a Socratic study mentor built on advanced learning science, cognitive psychology, and generative AI instruction models. Dedicated to dismantling busywork and helping university students build high-fidelity recall and logic intuition.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {["Active Recall Protocol", "Spaced Repetition Interleaving", "CBT Desensitization", "Feynman Logic Synthesis"].map((topic) => (
                  <span key={topic} className="text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-white/[0.03] border border-white/5 text-[var(--foreground-muted)]">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <div
          className="scholar-card mt-24 p-8 sm:p-20 text-center relative overflow-hidden group"
          style={{
            borderRadius: "48px",
            background: "linear-gradient(165deg, var(--card), var(--background))",
          }}
        >
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-[var(--accent-bg)] border border-[var(--accent-glow)] flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Sparkles className="w-8 h-8 text-[var(--accent)]" />
            </div>
            <h3 className="font-galaxie text-3xl sm:text-5xl font-bold text-[var(--foreground)] mb-6 tracking-tight leading-none">
              Get the Professor's Edge.
            </h3>
            <p className="text-[17px] text-[var(--foreground-muted)] max-w-xl mx-auto mb-12 leading-relaxed">
              Join the elite circle of students receiving weekly deep-dives into <span className="text-[var(--foreground)] font-bold">academic leverage</span> and <span className="text-[var(--foreground)] font-bold">AI intuition.</span>
            </p>
            <Link 
              href="/signup" 
              className="btn-jelly inline-flex items-center gap-3"
            >
              Enter Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </StandardContainer>
    </div>
  );
}

