import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard/',
        '/settings/',
        '/profile/',
      ],
    },
    sitemap: 'https://the-professor.ai/sitemap.xml',
  };
}
