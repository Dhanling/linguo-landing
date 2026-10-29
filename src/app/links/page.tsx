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
import styles from "./links.module.css";
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
    <main className={styles.page}>
      <div className={styles.landscape} aria-hidden="true">
        <svg className={styles.sky} viewBox="0 0 1440 260" preserveAspectRatio="none">
          <path fill="#d9f7f5" d="M0 0h1440v125c-190-55-210 100-430 36S790 20 580 98 320 218 140 159 0 170 0 170Z" />
          <path fill="#bceeed" d="M58 98c-18 0-24-31 10-35 11-42 69-43 79 0 33-7 45 35 13 35Z M1250 195c-30 0-28-37 4-38 12-49 70-50 82-2 38-7 45 40 12 40Z" />
        </svg>
        <svg className={styles.hills} viewBox="0 0 1440 420" preserveAspectRatio="none">
          <path fill="#c4efed" d="M0 55C160-35 170 250 380 190s210 210 390 100S1030 115 1170 170 1320 20 1440 80v340H0Z" />
          <path fill="#a6e3df" d="M0 230c200-120 270 130 440 70s220 180 420 0 370 100 580-40v160H0Z" />
          <g fill="#178f96"><ellipse cx="50" cy="330" rx="47" ry="175" transform="rotate(-15 50 330)"/><ellipse cx="168" cy="395" rx="46" ry="160" transform="rotate(46 168 395)"/><ellipse cx="1360" cy="370" rx="48" ry="150" transform="rotate(24 1360 370)"/></g>
          <g fill="#51b6a7"><ellipse cx="140" cy="310" rx="47" ry="150" transform="rotate(35 140 310)"/><ellipse cx="1310" cy="350" rx="47" ry="170" transform="rotate(20 1310 350)"/></g>
          <g fill="#087c87"><ellipse cx="38" cy="415" rx="38" ry="135" transform="rotate(-35 38 415)"/><ellipse cx="1250" cy="408" rx="45" ry="135" transform="rotate(-45 1250 408)"/><ellipse cx="1420" cy="420" rx="40" ry="135" transform="rotate(40 1420 420)"/></g>
        </svg>
      </div>
      <div className="mx-auto flex w-full max-w-[544px] flex-col items-center px-4 pb-12 pt-5 relative z-10">
        {/* Kepala */}
        <Link href="/" className="rounded-[26px] bg-white p-2 shadow-lg shadow-teal-900/5 transition hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1A9E9E]" aria-label={`Beranda ${F.name}`}>
          <Image
            src="/logo-icon.png"
            alt={`Logo ${F.name}`}
            width={88}
            height={88}
            className="h-16 w-16 rounded-2xl bg-white object-contain"
            priority
          />
        </Link>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight text-slate-900">@asklinguo</h1>
        <p className="mt-1 max-w-[360px] text-center text-sm leading-relaxed text-slate-500">
          Kursus {F.languageCountLabel} online &amp; offline · kelas live via Zoom · level {F.cefrLevels}
        </p>

        {/* Sosial media */}
        {socials.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            {socials.map(({ url, label, Icon }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm shadow-teal-900/5 transition hover:-translate-y-0.5 hover:text-[#1A9E9E] hover:ring-[#1A9E9E]/40"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        )}

        {/* Tombol tautan */}
        <nav aria-label="Tautan resmi Linguo" className="mt-4 w-full space-y-2.5">
          {BIO_LINKS.map((item, index) => {
            const external = isExternal(item.href);
            const className = `${styles.card} ${item.highlight ? styles.highlight : ""} group`;
            const inner = (
              <>
                <span className={styles.illustration} aria-hidden="true">
                  <Image src={`/images/links/${item.illustration}-v1.webp`} alt="" width={120} height={120} priority={index < 2} className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0 flex-1 py-3">
                  <span className="block text-[13px] sm:text-[15px] font-bold leading-snug tracking-tight">{item.label}</span>
                  {item.note && (
                    <span className={`mt-1 block text-[11px] sm:text-xs leading-relaxed ${item.highlight ? "text-teal-50/90" : "text-slate-500"}`}>
                      {item.note}
                    </span>
                  )}
                </span>
                <span className={styles.arrow}>
                  {external ? <ArrowUpRight className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </span>
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

        <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          <Link href="/" className="font-medium text-slate-500 hover:text-[#1A9E9E]">
            linguo.id
          </Link>{" "}
          · {F.legalName}
        </p>
      </div>
    </main>
  );
}
