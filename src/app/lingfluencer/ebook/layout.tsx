import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/lingfluencer/ebook",
  title: "Lingfluencer E-Book — E-Book Bahasa Gratis 1 Bulan | Linguo.id",
  description:
    "Program kolaborasi kreator Linguo: pilih satu e-book bahasa (Inggris, Spanyol, Jepang, Mandarin, Korea, Jerman, Italia, Thailand, Prancis, Turki) gratis 1 bulan, lalu bagikan review-mu.",
  keywords: ["lingfluencer ebook", "kolaborasi influencer bahasa", "ebook bahasa gratis"],
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
