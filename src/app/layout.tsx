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

export const metadata: Metadata = {
  title: "Linguo.id — Kursus Polyglot No. 1 di Indonesia",
  description: "Belajar 55+ bahasa asing online rasa offline! Kelas Private, Reguler, IELTS/TOEFL, E-Learning & E-Book. Mulai dari Rp 29.000.",
  openGraph: {
    title: "Linguo.id — Kursus Polyglot No. 1 di Indonesia",
    description: "Belajar 55+ bahasa asing online rasa offline! Mulai dari Rp 29.000.",
    url: "https://linguo.id",
    siteName: "Linguo.id",
    locale: "id_ID",
    type: "website",
  },
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
        {children}
        <Toaster richColors position="top-center" closeButton />
        <ChunkReloader />{/* [chunk-reload-v1] */}
        <TrialWizardModal />{/* linguo-patch:trial-wizard-v1 */}
        <ChatWidgetLazy />{/* linguo-patch:chat-widget-ai-wa-v1 */}

      </body>
    </html>
  );
}
