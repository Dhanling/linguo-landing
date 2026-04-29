import { Metadata } from "next";
import { Suspense } from "react";
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

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getBatches() {
  const { data, error } = await getSupabase()
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

async function getEtpBatches() {
  const { data, error } = await getSupabase()
    .from("etp_batches")
    .select("*")
    .eq("is_active", true)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("Error fetching ETP batches:", error);
    return [];
  }

  return data || [];
}

export default async function JadwalKelasRegulerPage() {
  const [batches, etpBatches] = await Promise.all([getBatches(), getEtpBatches()]);
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <JadwalKelasRegulerClient batches={batches} etpBatches={etpBatches} />
    </Suspense>
  );
}
