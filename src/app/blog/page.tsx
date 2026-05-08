import type { Metadata } from "next";
import BlogClient from "./BlogClient";
import SEOHead from "@/components/SEOHead";

export const metadata: Metadata = {
  title: "Intelligence Hub | The Professor AI Strategic Learning",
  description: "Stop studying harder. Start studying smarter. Elite learning science, academic productivity hacks, and strategic exam dominance from The Professor.",
  keywords: ["study tips", "active recall", "spaced repetition", "exam hacks", "jamb", "waec", "productivity", "learning science", "how to pass exams"],
  openGraph: {
    title: "Intelligence Hub | Strategic Learning Science",
    description: "Elite study techniques and the science of strategic learning. Master the exam before it starts.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "The Professor Intelligence Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Professor | Strategic Intelligence Hub",
    description: "Master your learning with strategic academic insights.",
    images: ["/logo.png"],
  },
};


export default function BlogPage() {
  const globalFaqs = [
    { question: "How does AI improve learning outcomes?", answer: "AI improves learning outcomes by providing personalized, instant feedback and automating the creation of retrieval-based study materials like flashcards and practice exams." },
    { question: "What is the best AI for students in 2026?", answer: "The elite stack for 2026 includes The Professor AI for exam strategy, Claude 3.5 for logical reasoning, and Consensus for peer-reviewed research." },
    { question: "Is AI in education safe?", answer: "Yes, when used as a Socratic study partner to enhance human cognition rather than a tool for academic dishonesty." },
    { question: "How to pass WAEC and JAMB with AI?", answer: "Use AI to simulate the CBT environment and generate high-fidelity practice questions from the official syllabus." }
  ];

  const getBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://theprofessor.xyz"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://theprofessor.xyz/blog"
      }
    ]
  });

  return (
    <>
      <SEOHead type="BreadcrumbList" data={getBreadcrumbSchema()} />
      <SEOHead type="FAQPage" data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": globalFaqs.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      }} />
      <BlogClient />
    </>
  );
}

