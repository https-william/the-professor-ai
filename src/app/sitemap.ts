import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog/posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://theprofessor.xyz';

  // Core pages - High priority
  const corePages = [
    { route: '', priority: 1, changefreq: 'daily' as const },
    { route: '/blog', priority: 0.9, changefreq: 'daily' as const },
    { route: '/login', priority: 0.8, changefreq: 'monthly' as const },
    { route: '/signup', priority: 0.8, changefreq: 'monthly' as const },
    { route: '/hub', priority: 0.9, changefreq: 'daily' as const },
    { route: '/create', priority: 0.9, changefreq: 'daily' as const },
    { route: '/library', priority: 0.9, changefreq: 'daily' as const },
    { route: '/dashboard', priority: 0.8, changefreq: 'daily' as const },
    { route: '/arena', priority: 0.8, changefreq: 'weekly' as const },
    { route: '/roadmap', priority: 0.8, changefreq: 'weekly' as const },
    { route: '/download', priority: 0.7, changefreq: 'monthly' as const },
    { route: '/help', priority: 0.6, changefreq: 'monthly' as const },
  ];

  // Feature pages - Medium priority
  const featurePages = [
    { route: '/flashcards', priority: 0.8, changefreq: 'daily' as const },
    { route: '/quiz', priority: 0.8, changefreq: 'daily' as const },
    { route: '/summary', priority: 0.8, changefreq: 'daily' as const },
    { route: '/chat', priority: 0.8, changefreq: 'daily' as const },
    { route: '/profile', priority: 0.7, changefreq: 'weekly' as const },
  ];

  // Build all static pages
  const staticPages = [...corePages, ...featurePages].map((page) => ({
    url: `${baseUrl}${page.route}`,
    lastModified: new Date(),
    changeFrequency: page.changefreq,
    priority: page.priority,
  }));

  // Blog posts - Medium priority
  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogRoutes];
}