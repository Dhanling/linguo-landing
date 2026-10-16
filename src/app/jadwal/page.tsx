// [jadwal-publik-v1] /jadwal — pilih bahasa untuk melihat jam kosong Kelas Private.
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import PilihBahasa from "./PilihBahasa";

export const metadata: Metadata = {
  title: "Cek Jadwal Kelas Private — Pilih Bahasa | Linguo.id",
  description: "Lihat jam kosong pengajar Kelas Private Linguo untuk 2 minggu ke depan sebelum mendaftar. Pilih bahasanya, pilih jamnya, lalu daftar.",
  alternates: { canonical: "https://linguo.id/jadwal" },
};

export default function JadwalIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-[#1A9E9E]">
            Linguo<span className="text-slate-900">.id</span>
          </Link>
          <Link href="/jadwal-kelas-reguler" className="text-xs font-medium text-slate-400 hover:text-[#1A9E9E]">Jadwal Kelas Reguler</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1A9E9E]">Kelas Private · 1-on-1</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Cek jadwal sebelum daftar</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Pilih bahasa dulu, lalu lihat jam kosong pengajar 2 minggu ke depan.</p>
        <div className="mt-6">
          <PilihBahasa />
        </div>
        <div className="mt-8 flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm leading-relaxed text-slate-600 shadow-sm">
          <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1A9E9E]" />
          <p>
            Sesudah memilih bahasa, kamu melihat kalender mingguan: blok <b className="text-emerald-600">hijau</b> masih kosong
            dan bisa dipilih, blok <b className="text-rose-500">merah</b> sudah terisi. Jamnya diambil langsung dari jadwal
            yang dibuka para pengajar.
          </p>
        </div>
      </main>
    </div>
  );
}
