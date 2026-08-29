/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: process.env.SCREENSHOT_MODE === '1',
    // All photography is served from /public — no remote patterns needed.
    deviceSizes: [420, 640, 828, 1080, 1280, 1600, 1920, 2560],
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
