// [seo-halaman-yatim-v1] Sama seperti /micro-teaching: halaman ini "use client"
// tanpa metadata sendiri, jadi canonical-nya jatuh ke homepage dan judulnya
// ikut judul homepage — Google dikasih tahu halaman ini duplikat linguo.id.
//
// Bedanya, yang ini lebih tidak boleh terindeks lagi: /pretest/vietnam adalah
// formulir pre-test untuk SATU cohort korporat (Alfamart × Vietnam Class), bukan
// materi publik. Kalau terindeks, orang luar bisa masuk dan mengisi pre-test
// milik klien.
import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/pretest/vietnam",
  title: "Pre-Test Vietnam Class — Linguo.id",
  description: "Formulir pre-test peserta kelas bahasa Vietnam Linguo.",
  noindex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
