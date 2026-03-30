/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  transpilePackages: ['three'],
  // Enable gzip/brotli compression for static assets
  compress: true,
  // Optimize static file serving with long cache headers
  headers: async () => [
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
  ],
};

export default nextConfig;
// Force rebuild 1774883572
