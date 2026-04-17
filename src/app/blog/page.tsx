import type { Metadata } from "next";
import BlogClient from "./BlogClient";
import SEOHead from "@/components/SEOHead";

export const metadata: Metadata = {
  title: "The Professor's Blog | Evidence-Based Learning Science",
  description: "Explore the science of learning, study techniques, and AI productivity tips from the The Professor. Master active recall, spaced repetition, and more.",
  openGraph: {
    title: "The Professor's Blog | Academic Insights",
    description: "Evidence-based study techniques and the science of learning.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "The Professor Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Professor's Blog | Study Science",
    description: "Master your learning with academic insights.",
    images: ["/logo.png"],
  },
};

export default function BlogPage() {
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
      <BlogClient />
    </>
  );
}
