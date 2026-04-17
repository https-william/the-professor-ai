"use client";

import Script from "next/script";

export type SchemaType = 
  | "Organization"
  | "WebSite"
  | "WebApplication"
  | "WebPage"
  | "Article"
  | "Course"
  | "FAQPage"
  | "HowTo"
  | "Person"
  | "BreadcrumbList";

interface SEOHeadProps {
  type: SchemaType;
  data: Record<string, any>;
}

export default function SEOHead({ type, data }: SEOHeadProps) {
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };

  return (
    <Script
      id={`json-ld-${type.toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(baseSchema) }}
    />
  );
}

/** ═══ Schema Generators ═══ **/

export const getOrgSchema = () => ({
  name: "The Professor",
  url: "https://theprofessor.xyz",
  logo: "https://theprofessor.xyz/logo.png",
  description: "AI-powered study companion for students. Generate flashcards, quizzes, summaries, and roadmaps instantly.",
  foundingDate: "2024",
  areaServed: "Worldwide",
  serviceType: "Educational Web Application",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Service",
    availableLanguage: ["English", "Spanish", "French", "German", "Japanese"],
  },
  sameAs: [
    "https://twitter.com/TheProfessorAI",
  ],
  potentialAction: {
    "@type": "SearchAction",
    target: "https://theprofessor.xyz/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
});

export const getWebsiteSchema = () => ({
  name: "The Professor",
  url: "https://theprofessor.xyz",
  description: "AI-powered study companion for students. Generate flashcards, quizzes, summaries, and roadmaps instantly.",
  publisher: {
    "@type": "Organization",
    name: "The Professor",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://theprofessor.xyz/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
});

export const getWebApplicationSchema = () => ({
  name: "The Professor",
  url: "https://theprofessor.xyz",
  description: "AI-powered study companion for students. Generate flashcards, quizzes, summaries, and roadmaps instantly.",
  applicationCategory: "EducationApplication",
  operatingSystem: "Web Browser, iOS, Android",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1250",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "AI Flashcard Generator",
    "Quiz Builder", 
    "Study Roadmap Creator",
    "Text Summarizer",
    "Spaced Repetition",
    "Collaborative Study Rooms",
    "1v1 Quiz Duels",
  ],
  provider: {
    "@type": "Organization",
    name: "The Professor",
    url: "https://theprofessor.xyz",
  },
});

export const getArticleSchema = (post: {
  title: string;
  excerpt: string;
  image?: string;
  date: string;
  author: string;
  slug: string;
}) => ({
  headline: post.title,
  description: post.excerpt,
  image: post.image || "https://theprofessor.xyz/og-image.svg",
  datePublished: post.date,
  author: {
    "@type": "Person",
    name: post.author,
  },
  publisher: {
    "@type": "Organization",
    name: "The Professor",
    logo: {
      "@type": "ImageObject",
      url: "https://theprofessor.xyz/logo.png",
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `https://theprofessor.xyz/blog/${post.slug}`,
  },
  about: {
    "@type": "Thing",
    name: "Education",
    description: "Study tips, learning strategies, and academic advice",
  },
  keywords: "study, education, AI, flashcards, learning, exam prep",
});

export const getFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
});

export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `https://theprofessor.xyz${item.url}`,
  })),
});

export const getCourseSchema = (course: {
  title: string;
  description: string;
  provider?: string;
}) => ({
  name: course.title,
  description: course.description,
  coursePrerequisites: "None",
  educationalLevel: "All Levels",
  inLanguage: "en-US",
  learningResourceType: ["Flashcards", "Quiz", "Study Guide", "Roadmap"],
  provider: {
    "@type": "Organization",
    name: course.provider || "The Professor",
    url: "https://theprofessor.xyz",
  },
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    courseWorkload: "PT1H",
  },
});
