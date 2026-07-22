import type { Metadata } from "next";
import PersiapanTesClient from "./PersiapanTesClient";

export const metadata: Metadata = {
  title: "Persiapan Ujian HSK, JLPT, TOPIK & Goethe | Linguo.id",
  description:
    "Kelas persiapan ujian bahasa: HSK (Mandarin), JLPT (Jepang), TOPIK (Korea), dan Goethe (Jerman). Semi-private grup kecil atau private 1-on-1, plus mock test. Daftar di Linguo.id.",
  alternates: { canonical: "https://linguo.id/persiapan-tes" },
};

export default function PersiapanTesPage() {
  return <PersiapanTesClient />;
}
