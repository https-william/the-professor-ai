import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Professor AI',
    short_name: 'Professor AI',
    description: 'Cheat codes for your degree - AI powered study companion.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#7C3AED',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
