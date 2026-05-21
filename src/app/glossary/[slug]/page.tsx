import { Metadata } from "next";
import { notFound } from "next/navigation";
import { glossaryTerms } from "@/lib/blog/glossary";
import SEOHead from "@/components/SEOHead";
import Link from "next/link";
import { ArrowLeft, BookOpen, MessageSquare, Sparkles } from "lucide-react";

export async function generateStaticParams() {
  return glossaryTerms.map((term) => ({
    slug: term.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const term = glossaryTerms.find((t) => t.slug === slug);
  if (!term) return { title: "Term Not Found" };

  return {
    title: `What is ${term.term}? | The Professor AI Glossary`,
    description: term.definition,
    openGraph: {
      title: `Defining ${term.term}: Strategy & Science`,
      description: term.definition,
    },
  };
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const term = glossaryTerms.find((t) => t.slug === slug);
  if (!term) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": term.faqs.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-32 pb-20">
      <SEOHead type="FAQPage" data={faqSchema} />
      
      <div className="max-w-3xl mx-auto px-6">
        <Link 
          href="/glossary"
          className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-12 transition-colors font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Library / Glossary
        </Link>

        <header className="mb-16">
          <div className="flex items-center gap-2 text-[var(--accent)] mb-4">
             <Sparkles className="w-4 h-4 fill-current" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Core Concept</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-[var(--foreground)] mb-8 tracking-tighter leading-tight">{term.term}</h1>
          <div className="p-8 md:p-10 rounded-[40px] bg-[var(--background-secondary)] border-2 border-[var(--border)] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <BookOpen className="w-20 h-20" />
            </div>
            <p className="text-xl md:text-2xl text-[var(--foreground)] leading-relaxed font-serif italic relative z-10">
              "{term.definition}"
            </p>
          </div>
        </header>

        <section className="prose prose-invert max-w-none mb-20">
          <h2 className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.4em] mb-8">Deep Dive</h2>
          <p className="text-[var(--foreground)] leading-relaxed text-xl font-medium opacity-90">
            {term.extendedDefinition}
          </p>
        </section>

        {term.faqs.length > 0 && (
          <section className="mb-20">
            <h2 className="text-2xl font-black text-[var(--foreground)] mb-10 flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[var(--accent)]" /> FAQs
            </h2>
            <div className="space-y-6">
              {term.faqs.map((faq, i) => (
                <div key={i} className="p-8 rounded-3xl bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm">
                  <h3 className="font-black text-lg text-[var(--foreground)] mb-3">{faq.question}</h3>
                  <p className="text-[var(--foreground-muted)] leading-relaxed font-medium">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {term.relatedTerms.length > 0 && (
          <section className="pt-16 border-t border-[var(--border)]">
            <h2 className="text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-[0.4em] mb-8">Connect the Dots</h2>
            <div className="flex flex-wrap gap-4">
              {term.relatedTerms.map((slug) => {
                const related = glossaryTerms.find(t => t.slug === slug);
                if (!related) return null;
                return (
                  <Link 
                    key={slug}
                    href={`/glossary/${slug}`}
                    className="px-6 py-3 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] text-sm font-bold transition-all hover-scale-lg active:scale-95"
                  >
                    {related.term}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

