export const dynamic = 'force-static';
export const revalidate = false;

import { blogPosts, getPostBySlug } from "@/lib/blog/posts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostClient from "./BlogPostClient";
import SEOHead from "@/components/SEOHead";
import { getArticleSchema, getFAQSchema } from "@/lib/seo-schema";
import { getBreadcrumbSchema } from "@/components/SEOHead";


/* ═══ Static Generation ═══ */
export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

/* ═══ Dynamic SEO Metadata ═══ */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const SITE_URL = "https://theprofessor.xyz";
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found | The Professor" };

  const fullUrl = `${SITE_URL}/blog/${slug}`;

  return {
    title: `${post.title} | The Professor`,
    description: post.excerpt,
    keywords: post.tags.join(", "),
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: fullUrl,
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      locale: "en_US",
      alternateLocale: ["en_GB", "es_ES"],
      images: [
        {
          url: "/og-image.svg",
          width: 1200,
          height: 630,
          alt: post.title,
          type: "image/svg+xml",
        },
        {
          url: "/logo.png",
          width: 512,
          height: 512,
          alt: "The Professor Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      site: "@TheProfessorAI",
      creator: "@TheProfessorAI",
      images: ["/og-image.svg"],
    },
  };
}

/* ═══ Page Component ═══ */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <SEOHead type="Article" data={getArticleSchema(post)} />
      <SEOHead 
        type="BreadcrumbList" 
        data={getBreadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` }
        ])} 
      />
      {post.faqs && <SEOHead type="FAQPage" data={getFAQSchema(post.faqs)} />}
      <BlogPostClient post={post} />

    </>

  );
}