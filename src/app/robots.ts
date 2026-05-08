import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = 'https://theprofessor.xyz';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/create/',
        '/api/',
        '/settings/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}