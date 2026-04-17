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
    "@type": "Person" as const,
    name: post.author,
  },
  publisher: {
    "@type": "Organization" as const,
    name: "The Professor",
    logo: {
      "@type": "ImageObject" as const,
      url: "https://theprofessor.xyz/logo.png",
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage" as const,
    "@id": `https://theprofessor.xyz/blog/${post.slug}`,
  },
  about: {
    "@type": "Thing" as const,
    name: post.title,
  },
  "@context": "https://schema.org",
  "@type": "Article",
});