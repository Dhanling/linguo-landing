import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import JadwalKelasRegulerClient from "./JadwalKelasRegulerClient";

export const metadata: Metadata = {
  title: "Jadwal Kelas Reguler — Linguo.id",
  description: "Jadwal lengkap kelas reguler bahasa asing di Linguo: English, Spanyol, German, Bahasa Isyarat, Belanda, dan lainnya. Mulai dari Rp 150.000/batch. Daftar sekarang!",
  keywords: [
    "jadwal kelas reguler",
    "kelas bahasa reguler",
    "kursus bahasa online",
    "kelas english reguler",
    "kelas spanyol reguler",
    "kelas german reguler",
    "kelas bahasa isyarat",
    "linguo jadwal",
  ],
  openGraph: {
    title: "Jadwal Kelas Reguler — Linguo.id",
    description: "Jadwal lengkap kelas reguler bahasa asing di Linguo. Pilih bahasa favoritmu!",
    url: "https://linguo.id/jadwal-kelas-reguler",
    siteName: "Linguo.id",
    images: [{ url: "https://linguo.id/og-jadwal-reguler.jpg", width: 1200, height: 630 }],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jadwal Kelas Reguler — Linguo.id",
    description: "Jadwal lengkap kelas reguler bahasa asing di Linguo.",
  },
  alternates: {
    canonical: "https://linguo.id/jadwal-kelas-reguler",
  },
};

export const revalidate = 60;

async function getBatches() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("v_regular_batches_summary")
    .select("*")
    .eq("is_published", true)
    .in("status", ["Open", "Confirmed"])
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching batches:", error);
    return [];
  }

  return (data || []).filter((b: any) => b.actual_enrolled < b.max_capacity);
}

export default async function JadwalKelasRegulerPage() {
  const batches = await getBatches();
  return <JadwalKelasRegulerClient batches={batches} />;
}
