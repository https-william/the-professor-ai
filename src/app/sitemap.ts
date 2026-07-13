import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog/posts';
import { pillars } from '@/lib/blog/pillars';
import { glossaryTerms } from '@/lib/blog/glossary';
import { subjects } from '@/lib/blog/subjects';
import { examRegistry } from '@/lib/blog/exams';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.theprofessor.xyz";

  // Static indexable routes (excluding disallowed routes like /dashboard and /settings)
  const staticRoutesList = [
    { path: "", changeFrequency: 'always' as const, priority: 1.0 },
    { path: "/blog", changeFrequency: 'daily' as const, priority: 0.9 },
    { path: "/arena", changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: "/exams", changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: "/flashcards", changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: "/quiz", changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: "/summary", changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: "/tools", changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: "/help", changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: "/download", changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: "/eli5", changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: "/glossary", changeFrequency: 'daily' as const, priority: 0.8 },
    { path: "/resources", changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: "/roadmap", changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: "/legal", changeFrequency: 'monthly' as const, priority: 0.3 },
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticRoutesList.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Dynamic Blog Post routes (/blog/[slug])
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date ? `${post.date}T00:00:00Z` : new Date()),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Dynamic Study Pillar routes (/[slug])
  const pillarRoutes: MetadataRoute.Sitemap = Object.keys(pillars).map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // Dynamic Subject Authority routes (/best-ai-for/[subject])
  const subjectRoutes: MetadataRoute.Sitemap = Object.keys(subjects).map((subject) => ({
    url: `${baseUrl}/best-ai-for/${subject}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic Exam Blueprint routes (/exams/[slug])
  const examRoutes: MetadataRoute.Sitemap = Object.keys(examRegistry).map((slug) => ({
    url: `${baseUrl}/exams/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic Glossary routes (/glossary/[slug])
  const glossaryRoutes: MetadataRoute.Sitemap = glossaryTerms.map((term) => ({
    url: `${baseUrl}/glossary/${term.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...blogRoutes,
    ...pillarRoutes,
    ...subjectRoutes,
    ...examRoutes,
    ...glossaryRoutes,
  ];
}