import type { Metadata } from "next";
import BlogClient from "./BlogClient";
import SEOHead from "@/components/SEOHead";

export const metadata: Metadata = {
  title: "The Professor | Strategic Study Secrets & Learning Science",
  description: "Explore the science of learning, strategic study techniques, and elite academic productivity tips from The Professor. Master the exam before it starts.",
  openGraph: {
    title: "The Professor | Strategic Learning Hub",
    description: "Elite study techniques and the science of strategic learning.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "The Professor Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Professor | Strategic Learning Hub",
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
