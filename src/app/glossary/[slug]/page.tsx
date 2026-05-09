import { Metadata } from "next";
import { notFound } from "next/navigation";
import { glossaryTerms } from "@/lib/blog/glossary";
import SEOHead from "@/components/SEOHead";
import Link from "next/link";
import { ArrowLeft, BookOpen, MessageSquare } from "lucide-react";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const term = glossaryTerms.find((t) => t.slug === params.slug);
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

export default function GlossaryTermPage({ params }: { params: { slug: string } }) {
  const term = glossaryTerms.find((t) => t.slug === params.slug);
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground-secondary)] pt-24 pb-20">
      <SEOHead type="FAQPage" data={faqSchema} />
      
      <div className="max-w-3xl mx-auto px-6">
        <Link 
          href="/glossary"
          className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Glossary
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{term.term}</h1>
          <div className="p-6 rounded-3xl bg-[var(--accent-bg)]/20 border border-[var(--accent-glow)]">
            <p className="text-lg text-white leading-relaxed italic">
              {term.definition}
            </p>
          </div>
        </header>

        <section className="prose prose-invert max-w-none mb-16">
          <h2 className="text-2xl font-bold text-white mb-4">In-Depth Analysis</h2>
          <p className="text-white/60 leading-relaxed text-lg">
            {term.extendedDefinition}
          </p>
        </section>

        {term.faqs.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[var(--accent)]" /> Common Questions
            </h2>
            <div className="space-y-4">
              {term.faqs.map((faq, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <h3 className="font-bold text-white mb-2">{faq.question}</h3>
                  <p className="text-sm text-white/50">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {term.relatedTerms.length > 0 && (
          <section className="pt-12 border-t border-white/5">
            <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-6">Related Concepts</h2>
            <div className="flex flex-wrap gap-3">
              {term.relatedTerms.map((slug) => {
                const related = glossaryTerms.find(t => t.slug === slug);
                if (!related) return null;
                return (
                  <Link 
                    key={slug}
                    href={`/glossary/${slug}`}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-[var(--accent)]/10 hover:border-[var(--accent-glow)] text-sm transition-all"
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
