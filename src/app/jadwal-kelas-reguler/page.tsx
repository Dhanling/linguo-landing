import { Metadata } from "next";
import { Suspense } from "react";
import BreadcrumbLd from "@/components/BreadcrumbLd"; // [aeo-schema-v1]
import { createClient } from "@supabase/supabase-js";
import JadwalKelasRegulerClient from "./JadwalKelasRegulerClient";
import { todayWIBISO } from "@/lib/etpBatches";

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

  const rows = (data || []).filter((b: any) => b.actual_enrolled < b.max_capacity);

  // Siklus lama (mis. AUG26) kadang masih `is_published` walau kelasnya sudah
  // jalan. Batch semacam itu cuma berguna kalau bahasanya belum punya batch
  // penerus — begitu siklus baru terbit, yang lama disembunyikan biar daftarnya
  // tidak penuh kartu "Pendaftaran ditutup".
  // Tanggal dibanding dalam WIB — server Vercel jalan di UTC, kalau pakai jam
  // server batch yang mulai hari ini bisa hilang sejak pukul 07.00 WIB.
  const hariIni = todayWIBISO();
  const masihBuka = (b: any) => {
    if (b.closes_at && new Date(b.closes_at).getTime() < Date.now()) return false;
    return String(b.start_date).slice(0, 10) >= hariIni;
  };
  const adaPenerus = new Set(
    rows.filter(masihBuka).map((b: any) => `${b.language}|${b.level}`)
  );

  return rows.filter(
    (b: any) => masihBuka(b) || !adaPenerus.has(`${b.language}|${b.level}`)
  );
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
    <>
      <BreadcrumbLd trail={[{ name: "Jadwal Kelas Reguler", path: "/jadwal-kelas-reguler" }]} />
      <Suspense fallback={<div className="min-h-screen" />}>
        <JadwalKelasRegulerClient batches={batches} etpBatches={etpBatches} />
      </Suspense>
    </>
  );
}
