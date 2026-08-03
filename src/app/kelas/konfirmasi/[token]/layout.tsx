import type { Metadata } from "next";

// [konfirmasi-domain-linguo-v1] Halaman ber-token, satu siswa satu link —
// tidak boleh masuk indeks pencarian. robots.ts juga melarang crawl-nya, tapi
// noindex di sini yang menjaga kalau ada yang terlanjur menaut ke halamannya.
export const metadata: Metadata = {
  title: "Konfirmasi Jadwal Kelas | Linguo",
  description: "Konfirmasi kehadiran kelas dan masukkan jadwalnya ke kalender kamu.",
  robots: { index: false, follow: false },
};

export default function KonfirmasiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
