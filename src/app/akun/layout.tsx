// [seo-noindex-v1] Area privat: butuh login / ber-token / hanya untuk satu orang.
// Halaman seperti ini tidak akan pernah dapat peringkat, tapi kalau dirayapi ia
// tetap menghabiskan jatah crawl dan bisa muncul di hasil pencarian sebagai
// "Soft 404" — dua-duanya menekan penilaian kualitas situs secara keseluruhan.
// Dipasangkan dengan Disallow di src/app/robots.ts (itu urusan crawl, ini index).
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  // [vc-notranslate-v1] Matikan tawaran terjemahan Chrome di dashboard siswa
  // saja (halaman publik TIDAK ikut — pengunjung dari 60+ bahasa memang butuh).
  // Gelembung "Google Translate" mendarat di POJOK KIRI ATAS begitu video masuk
  // layar penuh, tepat menimpa materi di rekaman kelas; dan dashboard ini sudah
  // punya pemilih bahasa ID/EN sendiri.
  other: { google: "notranslate" },
};

export default function NoIndexLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
