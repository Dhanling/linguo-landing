// [life-dashboard-v1] Cangkang /life.
//
// Halaman privat: noindex + nofollow, tidak masuk sitemap, dan di robots.ts
// ikut daftar path yang tidak boleh dirayapi.
//
// Token warna didefinisikan sekali di sini. Palet kategorikalnya sudah lolos
// pemeriksaan buta warna (ΔE CVD terburuk 14,1 terang / 13,2 gelap) dan kontras
// terhadap kedua permukaan — jangan tukar hex-nya satu-satu tanpa memvalidasi
// ulang set-nya. Dua slot terang (#eda100, #e87ba4) di bawah 3:1 pada permukaan
// terang, jadi grafik yang memakainya WAJIB berlabel langsung / punya tampilan
// tabel — dan memang punya.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Hidup",
  robots: { index: false, follow: false, nocache: true },
};

const TOKEN = `
.life-root {
  color-scheme: light;
  --life-bg: #f3f5f4;
  --life-surface: #ffffff;
  --life-surface-2: #f7f9f8;
  --life-line: #e2e6e4;
  --life-line-kuat: #cdd4d1;
  --life-text: #0e1413;
  --life-text-2: #515b58;
  --life-text-3: #7c8783;
  --life-baik: #0f7a58;
  --life-buruk: #c0392f;
  --life-brand: #1A9E9E;
  --s1: #1A9E9E; --s2: #eb6834; --s3: #2a78d6; --s4: #eda100;
  --s5: #e87ba4; --s6: #4a3aa7; --s7: #e34948;
}
@media (prefers-color-scheme: dark) {
  .life-root {
    color-scheme: dark;
    --life-bg: #0e100f;
    --life-surface: #191c1b;
    --life-surface-2: #202423;
    --life-line: #2b302e;
    --life-line-kuat: #3b423f;
    --life-text: #f1f4f3;
    --life-text-2: #a6b1ad;
    --life-text-3: #79837f;
    --life-baik: #3ec59a;
    --life-buruk: #e66767;
    --life-brand: #22a5a5;
    --s1: #22a5a5; --s2: #d95926; --s3: #3987e5; --s4: #c98500;
    --s5: #d55181; --s6: #9085e9; --s7: #e66767;
  }
}
.life-root { background: var(--life-bg); color: var(--life-text); min-height: 100vh; }
.life-kartu {
  background: var(--life-surface);
  border: 1px solid var(--life-line);
  border-radius: 14px;
}
.life-angka { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
`;

export default function LifeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="life-root">
      <style dangerouslySetInnerHTML={{ __html: TOKEN }} />
      {children}
    </div>
  );
}
