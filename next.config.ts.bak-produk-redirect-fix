import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/produk',
        destination: '/toko/paket-elearning',
        permanent: true,
      },
      {
        source: '/produk/:path*',
        destination: '/toko/paket-elearning',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
