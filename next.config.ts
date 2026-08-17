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
    // [seo-cwv-image-v1] Cover artikel blog di-upload admin ke Supabase Storage
    // dan sebelumnya dirender lewat <img> mentah — ukuran aslinya apa adanya,
    // tanpa resize per breakpoint. Padahal cover itu elemen LCP di 322 halaman
    // /blog/*, yaitu mayoritas isi sitemap. Diizinkan di sini supaya
    // next/image boleh mengoptimasinya.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jbtgciepdmqxxcjflrxz.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/produk',
        destination: '/toko/paket-elearning',
        permanent: true,
      },
      // [seo-url-kursus-v1] Hub kelas & 46 landing bahasa pindah dari /kelas ke
      // /kursus. Dasarnya data GSC 3 bulan: kueri mengandung "kursus" = 140
      // tayangan, "kelas" = 1. Kata "kelas" praktis tidak dipakai orang saat
      // mencari, jadi URL-nya disamakan dengan judul & H1 yang memang sudah
      // "Kursus Bahasa X Online".
      //
      // permanent: true (308) — Google harus meneruskan sinyal peringkat URL
      // lama ke URL baru. JANGAN diubah jadi sementara.
      //
      // Sengaja per-pola, BUKAN '/kelas/:path*'. Pola menyeluruh akan ikut
      // menyeret /kelas/konfirmasi/<token> yang TIDAK dipindah: link itu
      // dikirim ke siswa lewat WhatsApp dan dibuat di repo lain (edge function
      // schedule-public), jadi rutenya harus tetap hidup apa adanya.
      {
        source: '/kelas',
        destination: '/kursus',
        permanent: true,
      },
      {
        source: '/kelas/bahasa-:slug',
        destination: '/kursus/bahasa-:slug',
        permanent: true,
      },
      {
        // Angket kepuasan siswa: link yang dikirim admin lewat WA pakai domain
        // utama (linguo.id/angket/<token>) supaya terlihat resmi & tidak seperti
        // halaman internal, tapi halaman angketnya sendiri tetap tinggal di app
        // dashboard (/survey/:token). Sengaja BUKAN permanent — kalau nanti
        // angketnya dipindah ke landing, browser tidak keburu meng-cache
        // tujuannya. Link tanpa token (/angket) tidak diarahkan: tokennya unik
        // per siswa dan tidak boleh ditebak.
        source: '/angket/:token',
        destination: 'https://dashboard.linguo.id/survey/:token',
        permanent: false,
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
