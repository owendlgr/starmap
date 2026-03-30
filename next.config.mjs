/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  transpilePackages: ['three', 'mapbox-gl'],
  // Enable gzip/brotli compression for static assets
  compress: true,
  // Optimize static file serving with long cache headers
  headers: async () => [
    {
      // Security headers for all routes
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
    {
      // Gaia binary chunks rarely change — long cache
      source: '/data/gaia/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
      ],
    },
    {
      // Star catalog may be updated — short cache
      source: '/data/:path((?!gaia).*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
      ],
    },
    {
      // Planet textures rarely change — long cache
      source: '/textures/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' },
      ],
    },
  ],
};

export default nextConfig;
// Force rebuild 1774883572
