import type { Metadata } from "next";
import WatchAndLearn from "@/components/watch/WatchAndLearn";

export const metadata: Metadata = {
  title: "Watch & Learn — Belajar Bahasa dari Video | Linguo.id",
  description:
    "Belajar bahasa dari konten yang kamu suka. Tonton video YouTube dalam 16+ bahasa — film, musik, berita, vlog — lengkap dengan subtitle untuk latihan menyimak.",
  alternates: { canonical: "https://linguo.id/watch" },
};

export default function WatchPage() {
  return <WatchAndLearn />;
}
