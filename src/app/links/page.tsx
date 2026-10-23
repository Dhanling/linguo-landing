// =============================================================================
// /links — [link-bio-v1] pengganti linktr.ee/asklinguo (Bug Tracker a3cad0cb).
//
// Halaman tautan bio: satu kolom tombol untuk ditaruh di bio Instagram/TikTok/
// Threads. Sengaja TANPA navbar/footer penuh — pengunjung datang dari HP lewat
// bio dan cuma butuh daftar tombol yang bisa ditekan sekali. Isinya dari
// src/data/linkBio.ts; nomor WA & akun sosial dari BRAND_FACTS.
// Alias: /linktree, /bio, /link → diarahkan ke sini (next.config.ts).
// =============================================================================
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { FacebookIcon, InstagramIcon, LinkedInIcon, TikTokIcon, YouTubeIcon } from "@/components/BrandIcons";

import { pageMetadata } from "@/lib/seo";
import { BRAND_FACTS } from "@/lib/brand-facts";
import { BIO_LINKS } from "@/data/linkBio";

const F = BRAND_FACTS;

export const metadata = pageMetadata({
  path: "/links",
  title: `Tautan Resmi ${F.name} — Daftar Kelas, Customer Support, E-Learning`,
  description: `Semua tautan resmi ${F.name} di satu halaman: pendaftaran Kelas Reguler, TOEFL/IELTS Prep, Private Class, Linguo for Corporate, E-Learning, E-book, lowongan kerja, dan customer support WhatsApp.`,
  keywords: ["linguo links", "linktree linguo", "daftar kelas linguo", "customer support linguo"],
  ogTitle: `Tautan Resmi ${F.name}`,
});

const SOCIAL_ICON: { match: string; label: string; Icon: typeof InstagramIcon }[] = [
  { match: "instagram.com", label: "Instagram", Icon: InstagramIcon },
  { match: "tiktok.com", label: "TikTok", Icon: TikTokIcon },
  { match: "youtube.com", label: "YouTube", Icon: YouTubeIcon },
  { match: "facebook.com", label: "Facebook", Icon: FacebookIcon },
  { match: "linkedin.com", label: "LinkedIn", Icon: LinkedInIcon },
];

const isExternal = (href: string) => /^https?:\/\//i.test(href);

export default function LinksPage() {
  const socials = F.social
    .map((url) => {
      const meta = SOCIAL_ICON.find((s) => url.includes(s.match));
      return meta ? { url, ...meta } : null;
    })
    .filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-white">
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 pb-16 pt-10">
        {/* Kepala */}
        <Link href="/" className="rounded-full ring-4 ring-white shadow-md" aria-label={`Beranda ${F.name}`}>
          <Image
            src="/logo-icon.png"
            alt={`Logo ${F.name}`}
            width={88}
            height={88}
            className="h-22 w-22 rounded-full bg-white object-contain"
            priority
          />
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">@asklinguo</h1>
        <p className="mt-1 max-w-xs text-center text-sm text-slate-600">
          Kursus {F.languageCountLabel} online &amp; offline · kelas live via Zoom · level {F.cefrLevels}
        </p>

        {/* Sosial media */}
        {socials.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            {socials.map(({ url, label, Icon }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-[#1A9E9E] hover:ring-[#1A9E9E]/40"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        )}

        {/* Tombol tautan */}
        <nav aria-label="Tautan resmi Linguo" className="mt-7 w-full space-y-3">
          {BIO_LINKS.map((item) => {
            const external = isExternal(item.href);
            const className = item.highlight
              ? "group flex w-full items-center justify-between gap-3 rounded-2xl bg-[#1A9E9E] px-5 py-4 text-left text-white shadow-md shadow-teal-600/20 transition hover:-translate-y-0.5 hover:bg-[#178c8c] focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300"
              : "group flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 text-left text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-[#1A9E9E]/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200";
            const inner = (
              <>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-snug">{item.label}</span>
                  {item.note && (
                    <span className={`mt-0.5 block text-xs ${item.highlight ? "text-teal-50/90" : "text-slate-500"}`}>
                      {item.note}
                    </span>
                  )}
                </span>
                {external ? (
                  <ArrowUpRight className={`h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 ${item.highlight ? "text-white" : "text-slate-400"}`} />
                ) : (
                  <ChevronRight className={`h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 ${item.highlight ? "text-white" : "text-slate-400"}`} />
                )}
              </>
            );
            return external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
                {inner}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={className}>
                {inner}
              </Link>
            );
          })}
        </nav>

        <p className="mt-10 text-center text-xs text-slate-400">
          <Link href="/" className="font-medium text-slate-500 hover:text-[#1A9E9E]">
            linguo.id
          </Link>{" "}
          · {F.legalName}
        </p>
      </div>
    </main>
  );
}
