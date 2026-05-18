import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/debug/', '/private/'],
    },
    sitemap: 'https://theprofessor.xyz/sitemap.xml',
  };
}