import type { Metadata } from "next";

// [seo-metadata-halaman-v1]
// Sebelumnya 13 halaman publik yang terdaftar di sitemap.xml TIDAK punya
// metadata sendiri. Next.js mewariskan metadata dari src/app/layout.tsx, jadi
// semuanya — termasuk halaman uang seperti /harga dan /corporate — tampil di
// hasil pencarian dengan judul & deskripsi HOMEPAGE. Di mata Google itu sinyal
// duplikat massal: halaman-halaman itu bersaing satu sama lain untuk kueri yang
// sama, dan tidak satu pun punya judul yang cocok dengan maksud pencarinya.
//
// Canonical juga baru dipasang di 12 dari 73 halaman. Tanpa canonical, varian
// URL (utamanya `?ref=` dari program afiliasi) berpotensi dianggap halaman
// terpisah — itu yang memunculkan "Duplicate without user-selected canonical"
// di laporan Pages Search Console.
//
// Helper ini menyatukan keduanya supaya tiap halaman cukup menulis judul,
// deskripsi, dan path-nya. Bagian yang gampang lupa (metadataBase, canonical
// absolut, openGraph.url, twitter card, locale id_ID) diisi otomatis.

const BASE = "https://linguo.id";

type PageSeo = {
  /** Path absolut dari root, diawali "/". Dipakai untuk canonical + og:url. */
  path: string;
  title: string;
  description: string;
  /** Kata kunci target. Bobotnya kecil di Google, tapi tidak merugikan. */
  keywords?: string[];
  /** Judul/deskripsi khusus share sosial. Default: ikut title/description. */
  ogTitle?: string;
  ogDescription?: string;
  ogType?: "website" | "article" | "profile";
  /** Path gambar share, relatif ke root situs. */
  image?: string;
  /**
   * Halaman utilitas yang butuh login / berisi data personal. Selain menyetel
   * noindex, halaman seperti ini juga harus DIKELUARKAN dari sitemap.ts dan
   * di-disallow di robots.ts — tiga tempat itu harus sepakat.
   */
  noindex?: boolean;
};

export function pageMetadata({
  path,
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogType = "website",
  image,
  noindex = false,
}: PageSeo): Metadata {
  const url = `${BASE}${path === "/" ? "" : path}`;

  return {
    metadataBase: new URL(BASE),
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      url,
      siteName: "Linguo.id",
      locale: "id_ID",
      type: ogType,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      ...(image ? { images: [image] } : {}),
    },
    robots: noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

/** Canonical saja — untuk halaman yang metadata-nya sudah ditulis manual. */
export function canonical(path: string) {
  return { canonical: `${BASE}${path === "/" ? "" : path}` };
}
