import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog/posts';
import { glossaryTerms } from '@/lib/blog/glossary';

import { pillars } from '@/lib/blog/pillars';

export default function sitemap(): MetadataRoute.Sitemap {
  const SITE_URL = 'https://theprofessor.xyz';

  // Base routes
  const routes = [
    '',
    '/blog',
    '/glossary',
    '/resources/best-ai-tools-for-students-2026',
    '/exams/jamb',
    '/exams/waec',
    '/tools/ai-study-planner',
    '/dashboard',
    '/library',
    '/login',
    '/signup'
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Strategic Pillars (pSEO)
  const pillarRoutes = Object.keys(pillars).map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // Subject pages
  const subjects = ['biology', 'math', 'jamb'];
  const subjectRoutes = subjects.map((sub) => ({
    url: `${SITE_URL}/best-ai-for/${sub}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // Glossary terms
  const glossary = glossaryTerms.map((term) => ({
    url: `${SITE_URL}/glossary/${term.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Blog posts
  const posts = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...routes, ...pillarRoutes, ...subjectRoutes, ...glossary, ...posts];
}