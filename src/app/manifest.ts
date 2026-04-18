export const dynamic = 'force-static';
export const revalidate = false;

import { MetadataRoute } from 'next';



export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Professor AI',
    short_name: 'Professor',
    description: 'Cheat codes for your degree — AI-powered flashcards, quizzes, summaries & more.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#08080E',
    theme_color: '#7C3AED',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}