export const dynamic = 'force-static';
export const revalidate = false;

import { MetadataRoute } from 'next';



export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Professor AI',
    short_name: 'Professor',
    description: 'Your notes. Just the good parts. Turn overwhelming lectures into simple study guides and instant quizzes. Get your sleep back and reclaim your free time.',
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
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'wide',
        label: 'The Professor AI Logo'
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        label: 'The Professor AI Logo'
      }
    ]
  };
}