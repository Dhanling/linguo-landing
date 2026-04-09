import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-slate-900 antialiased">
        <Script id="scroll-top" strategy="beforeInteractive">{`history.scrollRestoration='manual';window.scrollTo(0,0);`}</Script>
        {children}
      </body>
    </html>
  );
}
