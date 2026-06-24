import { Metadata } from "next";
import { notFound } from "next/navigation";
import { glossaryTerms } from "@/lib/blog/glossary";
import SEOHead from "@/components/SEOHead";
import GlossaryTermClient from "./GlossaryTermClient";

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
    <>
      <SEOHead type="FAQPage" data={faqSchema} />
      <GlossaryTermClient term={term} />
    </>
  );
}
