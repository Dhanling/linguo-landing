// [seo-noindex-v1] Area privat: butuh login / ber-token / hanya untuk satu orang.
// Halaman seperti ini tidak akan pernah dapat peringkat, tapi kalau dirayapi ia
// tetap menghabiskan jatah crawl dan bisa muncul di hasil pencarian sebagai
// "Soft 404" — dua-duanya menekan penilaian kualitas situs secara keseluruhan.
// Dipasangkan dengan Disallow di src/app/robots.ts (itu urusan crawl, ini index).
import type { Metadata } from "next";
import AkunThemeScope from "@/components/AkunThemeScope"; // [akun-dark-mode-v1] tema gelap khusus dashboard siswa

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function NoIndexLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AkunThemeScope />
      {children}
    </>
  );
}
