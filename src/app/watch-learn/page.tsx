import type { Metadata } from "next";
import WatchLearnClient from "./WatchLearnClient";

export const metadata: Metadata = {
  title: "Watch & Learn — Belajar Bahasa dari Video yang Kamu Suka | Linguo.id",
  description:
    "Ubah video YouTube jadi kelas bahasa: subtitle interaktif, arti kata sekali ketuk, pengucapan asli, dan flashcard otomatis dalam 45+ bahasa. Mulai gratis, cukup login.",
  alternates: { canonical: "https://linguo.id/watch-learn" },
  openGraph: {
    title: "Watch & Learn — Belajar Bahasa dari Video yang Kamu Suka",
    description:
      "Tonton yang kamu suka, ketuk kata apa pun, dan kosakatanya tersimpan sendiri. 45+ bahasa di Linguo.id.",
    url: "https://linguo.id/watch-learn",
    type: "website",
  },
};

export default function WatchLearnIntroPage() {
  return <WatchLearnClient />;
}
