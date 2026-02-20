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
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}

