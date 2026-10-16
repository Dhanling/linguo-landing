// [jadwal-publik-v1] /jadwal — pilih bahasa untuk melihat jam kosong Kelas Private.
import type { Metadata } from "next";
import Link from "next/link";
import { LANG_CATEGORIES, langNameId, langSlugOf } from "@/lib/funnelRouting";

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
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Pilih bahasa untuk melihat jam kosong pengajar 2 minggu ke depan.</p>
        {LANG_CATEGORIES.map((c) => (
          <section key={c.label} className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{c.label}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {c.langs.map((l) => (
                <Link
                  key={l}
                  href={`/jadwal/${langSlugOf(l)}`}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:border-[#1A9E9E] hover:text-[#1A9E9E]"
                >
                  {langNameId(l)}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
