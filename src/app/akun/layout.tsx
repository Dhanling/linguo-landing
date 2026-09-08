// [seo-noindex-v1] Area privat: butuh login / ber-token / hanya untuk satu orang.
// Halaman seperti ini tidak akan pernah dapat peringkat, tapi kalau dirayapi ia
// tetap menghabiskan jatah crawl dan bisa muncul di hasil pencarian sebagai
// "Soft 404" — dua-duanya menekan penilaian kualitas situs secara keseluruhan.
// Dipasangkan dengan Disallow di src/app/robots.ts (itu urusan crawl, ini index).
import type { Metadata } from "next";
import { AKUN_BOOT_SCRIPT } from "@/lib/akunBootScript"; // [boot-splash-v1]
import BootSettle from "@/components/akun/BootSettle"; // [boot-splash-v1]

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
  return (
    <>
      {/* [boot-splash-v1] Tirai muat-ulang, dirender SERVER supaya sudah ada di HTML
          awal (sebelum hidrasi). Dulu tiap refresh dashboard siswa lewat beberapa
          wajah: spinner gradasi teal tanpa shell (dan tanpa kelas tema gelap, karena
          skrip temanya hidup di StudentShell yang belum terpasang), lalu shell +
          spinner kanvas, baru isi. Semua tahap itu kini berjalan di balik tirai;
          tirai dicabut src/lib/bootSplash.ts begitu tak ada pemuat yang menahan.
          Latar CSS `.lms-dark{background:#000}` juga ditaruh di sini karena
          aturan aslinya baru ikut bersama <style> milik StudentShell. */}
      <style>{`.lms-dark{background:#000000;}#boot-splash img{opacity:0;animation:boot-splash-in .5s ease-out .25s forwards}@keyframes boot-splash-in{to{opacity:.92}}`}</style>
      <div
        id="boot-splash"
        aria-hidden
        style={{ position: "fixed", inset: 0, zIndex: 2147483000, background: "#EEF1F4", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity .22s ease-out", pointerEvents: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/full-logo-linguo-hijau.png" alt="" style={{ width: 132, height: "auto" }} />
      </div>
      <script dangerouslySetInnerHTML={{ __html: AKUN_BOOT_SCRIPT }} />
      {children}
      <BootSettle />
    </>
  );
}
