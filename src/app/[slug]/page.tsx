import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Zap, Target, Book, Brain, Shield, ArrowRight, Trophy, Sparkles } from "lucide-react";
import { pillars } from "@/lib/blog/pillars";

export async function generateStaticParams() {
  return Object.keys(pillars).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = pillars[slug];
  if (!data) return { title: "Not Found" };

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords,
    openGraph: {
      title: data.title,
      description: data.description,
      type: "article",
    }
  };
}

export default async function PillarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = pillars[slug];
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[var(--background)] text-white pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Breadcrumbs for AEO */}
        <nav className="mb-12 text-[10px] font-black uppercase tracking-widest text-white/20 flex items-center gap-2">
           <Link href="/" className="hover:text-white transition-colors">The Professor</Link>
           <span>/</span>
           <span className="text-[var(--accent)]">Study Pillar</span>
        </nav>

        <header className="mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-bg)]/20 border border-[var(--accent-glow)] text-[var(--accent)] text-[10px] font-black uppercase tracking-widest mb-8">
             <Sparkles className="w-3 h-3" /> 2026 Study Guide
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[0.95] tracking-tight">
             {data.content.hero.title}
          </h1>
          <p className="text-2xl text-white/40 font-medium leading-relaxed max-w-2xl">
             {data.content.hero.subtitle}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
           <div className="md:col-span-8 space-y-16">
              {data.content.sections.map((section, i) => (
                <section key={i}>
                   <h2 className="text-2xl font-black mb-6 uppercase tracking-tight flex items-center gap-4">
                      <span className="text-[var(--accent)]">0{i+1}.</span> {section.title}
                   </h2>
                   <p className="text-lg text-white/60 leading-relaxed mb-8">
                      {section.body}
                   </p>
                   {section.list && (
                     <div className="grid grid-cols-1 gap-4">
                        {section.list.map((item, j) => (
                          <div key={j} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                             <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center shrink-0 mt-1">
                                <Zap className="w-2.5 h-2.5 text-[var(--accent)]" />
                             </div>
                             <span className="text-sm font-bold text-white/80">{item}</span>
                          </div>
                        ))}
                     </div>
                   )}
                </section>
              ))}
           </div>

           {/* Sticky CTA Sidebar */}
           <div className="md:col-span-4">
              <div className="sticky top-32 p-8 rounded-[32px] bg-[var(--accent-bg)]/10 border border-[var(--accent-glow)]">
                 <h3 className="text-xl font-black mb-4 leading-tight">{data.content.cta.title}</h3>
                 <p className="text-xs text-white/40 mb-8 leading-relaxed">
                    {data.content.cta.subtitle}
                 </p>
                 <Link href="/signup" className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all">
                    {data.content.cta.label} <ArrowRight className="w-4 h-4" />
                 </Link>
              </div>
           </div>
        </div>

        {/* FAQ Schema for AEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": (data.content.faqs || [
                { q: "Is this AI study guide free?", a: "Yes, our study pillars are free for all students aiming for academic success." },
                { q: "Will these tools work for my specific exam?", a: "Our frameworks are optimized for logic-heavy exams like WAEC, JAMB, SAT, and USMLE." }
              ]).map(faq => ({
                "@type": "Question",
                "name": faq.q,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.a
                }
              }))
            }),
          }}
        />

        <section className="mt-32 pt-24 border-t border-white/5">
           <h3 className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.3em] mb-12 text-center">Frequently Asked Questions</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {(data.content.faqs || [
                { q: "Is this AI study guide free?", a: "Yes, our study pillars are free for all students aiming for academic success." },
                { q: "Will these tools work for my specific exam?", a: "Our frameworks are optimized for logic-heavy exams like WAEC, JAMB, SAT, and USMLE." }
              ]).map((faq, i) => (
                <div key={i} className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[var(--accent)]/30 transition-all">
                   <h4 className="font-black text-white text-lg mb-4 flex items-start gap-3">
                      <span className="text-[var(--accent)] mt-1">Q.</span>
                      {faq.q}
                   </h4>
                   <p className="text-[15px] text-white/50 leading-relaxed pl-7">
                      {faq.a}
                   </p>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
}
