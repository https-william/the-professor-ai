import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/blog', '/blog/*', '/library', '/arena', '/roadmap', '/s/*', '/share/*', '/best-ai-for/*', '/exams/*', '/glossary/*', '/download', '/eli5', '/resources', '/legal'],
      disallow: ['/dashboard', '/settings', '/profile', '/chat', '/api/', '/login', '/signup', '/admin/', '/debug/'],
    },
    sitemap: 'https://www.theprofessor.xyz/sitemap.xml',
  };
}