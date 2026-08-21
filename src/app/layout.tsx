import type { Metadata } from "next";
import Script from "next/script";
import { Baloo_2, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

// Self-hosted via next/font: no render-blocking request to fonts.googleapis.com,
// preloaded + size-adjusted (no layout shift). Replaces the old <link> stylesheet.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});
import TrialWizardModal from "@/components/TrialWizardModal"; // linguo-patch:trial-wizard-v1
import ChatWidgetLazy from "@/components/ChatWidgetLazy"; // linguo-patch:chat-widget-ai-wa-v1 — code-split out of initial bundle
import ChunkReloader from "@/components/ChunkReloader"; // [chunk-reload-v1] auto-reload saat bundle basi sehabis deploy
import AnalyticsTracker from "@/components/AnalyticsTracker"; // landing-analytics-v1 — catat page view + durasi ke Supabase
import AdAttributionCapture from "@/components/AdAttributionCapture"; // ads-conversion-sync — tangkap fbclid/gclid/_fbp buat konversi offline
import PromoTopBar from "@/components/PromoTopBar"; // promo-merdeka-v1 — banner promo paling atas, hilang sendiri setelah periode
import BatchRegulerTopBar from "@/components/BatchRegulerTopBar"; // bar-batch-reguler-v1 — pita hitung mundur batch Kelas Reguler
import PromoFloatingButton from "@/components/PromoFloatingButton"; // promo-merdeka-v1 — sticker melayang → WA CS
import PromoLeadModal from "@/components/PromoLeadModal"; // promo-lead-form-v1 — form nama/WA/email sebelum ke WhatsApp
import PosterPopup from "@/components/PosterPopup"; // poster-popup-v1 — pop-up poster promo saat pengunjung baru masuk

// [seo-metadata-v1] Judul lama bertumpu pada kata "Polyglot" — hampir tidak ada
// yang mencarinya dalam bahasa Indonesia, jadi homepage kehilangan sinyal
// relevansi untuk kueri yang sebenarnya dicari ("kursus bahasa asing online",
// "les bahasa online"). Deskripsi dipertahankan hampir apa adanya karena CTR-nya
// sudah bagus (16,6% di Search Console) — yang diperbaiki relevansinya, bukan
// daya tariknya.
//
// `metadataBase` sebelumnya tidak ada, jadi URL og:image relatif tidak bisa
// diresolusi jadi URL absolut. Canonical juga belum pernah dipasang di homepage.
//
// CATATAN: sengaja TIDAK memakai title.template. Beberapa halaman anak (mis.
// /kursus/bahasa-*) sudah menuliskan "| Linguo.id" di metaTitle-nya sendiri —
// template akan membuatnya dobel.
export const metadata: Metadata = {
  metadataBase: new URL("https://linguo.id"),
  title: "Kursus Bahasa Asing Online No.1 di Indonesia — Linguo.id",
  description: "Kursus 60+ bahasa asing online rasa offline! Kelas Private, Reguler, IELTS/TOEFL, E-Learning & E-Book. Mulai dari Rp 75.000.",
  keywords: [
    "kursus bahasa asing online",
    "les bahasa online",
    "kursus bahasa online",
    "belajar bahasa asing online",
    "kursus bahasa inggris online",
    "les privat bahasa",
  ],
  alternates: { canonical: "https://linguo.id" },
  openGraph: {
    title: "Kursus Bahasa Asing Online No.1 di Indonesia — Linguo.id",
    description: "Kursus 60+ bahasa asing online rasa offline! Kelas live via Zoom, mulai dari Rp 75.000.",
    url: "https://linguo.id",
    siteName: "Linguo.id",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kursus Bahasa Asing Online No.1 di Indonesia — Linguo.id",
    description: "Kursus 60+ bahasa asing online rasa offline! Kelas live via Zoom, mulai dari Rp 75.000.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

// [seo-jsonld-v1] Sebelumnya tidak ada structured data sama sekali di level
// situs. Organization + WebSite adalah dasar yang dipakai Google untuk knowledge
// panel dan sitelink — dan alamat fisik di Bandung adalah sinyal lokal yang
// selama ini tidak pernah disampaikan ke mesin pencari dalam bentuk terbaca.
const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": "https://linguo.id/#organization",
  name: "Linguo.id",
  legalName: "PT. Linguo Edu Indonesia",
  url: "https://linguo.id",
  logo: "https://linguo.id/FULL_LOGO_LINGUO_HIJAU.png",
  description: "Sekolah bahasa online dengan 60+ pilihan bahasa. Kelas live via Zoom bersama pengajar berpengalaman.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong",
    addressLocality: "Bandung",
    addressRegion: "Jawa Barat",
    postalCode: "40135",
    addressCountry: "ID",
  },
  telephone: "+62-22-85942550",
  email: "official.linguo@gmail.com",
  sameAs: [
    "https://instagram.com/linguo.id",
    "https://facebook.com/linguo.id",
    "https://tiktok.com/@linguo.id",
    "https://linkedin.com/company/linguo-id",
    "https://youtube.com/@linguo.id",
  ],
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://linguo.id/#website",
  url: "https://linguo.id",
  name: "Linguo.id",
  inLanguage: "id-ID",
  publisher: { "@id": "https://linguo.id/#organization" },
};

// Set your IDs in Vercel Environment Variables:
// NEXT_PUBLIC_FB_PIXEL_ID  → from Meta Events Manager
// NEXT_PUBLIC_GA_ID        → from Google Analytics (G-XXXXXXXX)
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${baloo.variable}`}>
      <head>
        {/* Warm up the connection to the flag-image CDN used across the page */}
        <link rel="preconnect" href="https://flagcdn.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />

        {/* [seo-jsonld-v1] Structured data tingkat situs — dibaca crawler, tidak
            memengaruhi tampilan sedikit pun. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
        />

        {/* Google Analytics (GA4) */}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_title: document.title,
                  send_page_view: true,
                });
              `}
            </Script>
          </>
        )}

        {/* Facebook Pixel */}
        {FB_PIXEL_ID && (
          <>
            <Script id="fb-pixel-init" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body className="bg-white text-slate-900 antialiased">
        <PromoTopBar />{/* promo-merdeka-v1 */}
        <BatchRegulerTopBar />{/* bar-batch-reguler-v1 — mundur otomatis kalau Promo Merdeka lagi buka */}
        {children}
        <Toaster richColors position="top-center" closeButton />
        <ChunkReloader />{/* [chunk-reload-v1] */}
        <TrialWizardModal />{/* linguo-patch:trial-wizard-v1 */}
        <ChatWidgetLazy />{/* linguo-patch:chat-widget-ai-wa-v1 */}
        <AnalyticsTracker />{/* landing-analytics-v1 */}
        <AdAttributionCapture />{/* ads-conversion-sync */}
        <PromoFloatingButton />{/* promo-merdeka-v1 */}
        <PromoLeadModal />{/* promo-lead-form-v1 — dipicu banner & sticker */}
        <PosterPopup />{/* poster-popup-v1 — sekali per sesi, ditunda 1,2 dtk */}

      </body>
    </html>
  );
}
