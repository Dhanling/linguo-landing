// [jadwal-publik-v1] /jadwal/<bahasa> — jam kosong Kelas Private per bahasa, tanpa login.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { langFromSlug, langNameId } from "@/lib/funnelRouting";
import JadwalPublikClient from "./JadwalPublikClient";
import PilihBahasa from "../PilihBahasa";

const BASE = "https://linguo.id";

type PageProps = { params: Promise<{ bahasa: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bahasa } = await params;
  const langEn = langFromSlug(bahasa);
  if (!langEn) return { title: "Halaman tidak ditemukan | Linguo.id", robots: { index: false, follow: false } };
  const langId = langNameId(langEn);
  const title = `Jadwal Kelas Private Bahasa ${langId} — Cek Jam Kosong | Linguo.id`;
  const description = `Lihat jam kosong pengajar Kelas Private Bahasa ${langId} per minggu, pilih jadwal tetap atau fleksibel, lalu daftar. Pengajar dicocokkan dengan level dan jadwalmu.`;
  const url = `${BASE}/jadwal/${bahasa}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Linguo.id", locale: "id_ID", type: "website" },
  };
}

export default async function JadwalBahasaPage({ params }: PageProps) {
  const { bahasa } = await params;
  const langEn = langFromSlug(bahasa);
  if (!langEn) notFound();
  const langId = langNameId(langEn);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-3xl px-4 pb-32 pt-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1A9E9E]">Kelas Private · 1-on-1</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Jadwal Bahasa {langId}</h1>
          <PilihBahasa current={bahasa} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Pilih jam yang cocok buatmu. Pengajar dicocokkan dengan level, tujuan, dan jadwalmu setelah pendaftaran.
        </p>
        <JadwalPublikClient slug={bahasa} langEn={langEn} langId={langId} />
      </main>
    </div>
  );
}
