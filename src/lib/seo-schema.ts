export const getArticleSchema = (post: {
  title: string;
  excerpt: string;
  image?: string;
  date: string;
  author: string;
  slug: string;
  tags: string[];
  content: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.excerpt,
  image: post.image || "https://theprofessor.xyz/og-image.svg",
  datePublished: post.date,
  dateModified: post.date,
  author: {
    "@type": "Person" as const,
    name: post.author,
    url: "https://theprofessor.xyz",
  },
  publisher: {
    "@type": "Organization" as const,
    name: "The Professor",
    logo: {
      "@type": "ImageObject" as const,
      url: "https://theprofessor.xyz/logo.svg",
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage" as const,
    "@id": `https://theprofessor.xyz/blog/${post.slug}`,
  },
  keywords: post.tags.join(", "),
  genre: "Educational Strategy",
  wordCount: post.content.split(/\s+/).length,
  articleBody: post.content.replace(/[#*`]/g, ""),
});

export const getFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
});
