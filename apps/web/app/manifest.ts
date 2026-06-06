import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Watchly',
    short_name: 'Watchly',
    description: 'Track your YouTube watchlist across devices',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0f0f',
    theme_color: '#0f0f0f',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
