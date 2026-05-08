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
