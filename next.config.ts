import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake barrel-file libraries: only the icons/exports actually used
    // get bundled, instead of the whole package.
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'sonner',
      'libphonenumber-js',
    ],
  },
  images: {
    // Serve AVIF/WebP (far smaller than the source PNGs) and cache the
    // optimized variants aggressively.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
  async redirects() {
    return [
      {
        source: '/produk',
        destination: '/toko/paket-elearning',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Static public assets (images, sounds). Long-lived cache to fix
        // "efficient cache lifetimes"; bump the filename when an asset changes.
        // (Next.js already sets immutable caching on /_next/static itself.)
        source: '/:dir(images|sounds|lang|silabus)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
