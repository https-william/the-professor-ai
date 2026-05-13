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
        src: '/logo.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/logo.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/dashboard-preview.webp',
        sizes: '1280x720',
        type: 'image/webp',
        form_factor: 'wide',
        label: 'The Professor Dashboard'
      },
      {
        src: '/dashboard-preview.webp',
        sizes: '1280x720',
        type: 'image/webp',
        label: 'The Professor Dashboard'
      }
    ]
  };
}