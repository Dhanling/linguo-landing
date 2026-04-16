import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linguo.id — Kursus Polyglot No. 1 di Indonesia",
  description: "Belajar 55+ bahasa asing online rasa offline! Silabus, Reguler, IELTS/TOEFL, E-Learning & E-Book. Mulai dari Rp 29.000.",
  openGraph: {
    title: "Linguo.id — Kursus Polyglot No. 1 di Indonesia",
    description: "Belajar 55+ bahasa asing online rasa offline! Mulai dari Rp 29.000.",
    url: "https://linguo.id",
    siteName: "Linguo.id",
    locale: "id_ID",
    type: "website",
  },
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
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

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
      </body>
    </html>
  );
}
