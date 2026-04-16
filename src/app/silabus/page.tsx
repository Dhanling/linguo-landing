import type { Metadata } from "next";
import SilabusHub from "./SilabusHub";
import { languages } from "@/data/curriculum";

export const metadata: Metadata = {
  title: "Silabus Kursus Bahasa | Linguo.id",
  description: "Pelajari kurikulum lengkap untuk 60+ bahasa di Linguo.id. 192 sesi per bahasa, dari A1 sampai B2. CEFR-aligned, IELTS/TOEFL ready.",
  openGraph: {
    title: "Silabus 60+ Bahasa — Linguo.id",
    description: "192 sesi per bahasa. 4 level CEFR. Lihat apa yang akan kamu pelajari sebelum mendaftar.",
    type: "website",
  },
};

export default function SilabusPage() {
  return <SilabusHub languages={languages} />;
}
