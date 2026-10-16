import type { Metadata } from "next";
import Link from "next/link";
import PersiapanTesClient from "./PersiapanTesClient";
import BreadcrumbLd from "@/components/BreadcrumbLd"; // [aeo-schema-v1]
import { TES_BAHASA } from "@/data/persiapanTesBahasa"; // [seo-tes-kota-v1]

export const metadata: Metadata = {
  title: "Persiapan Ujian PTE, HSK, JLPT, TOPIK & Goethe | Linguo.id",
  description:
    "Kelas persiapan ujian bahasa: PTE Academic (Inggris), HSK (Mandarin), JLPT (Jepang), TOPIK (Korea), dan Goethe (Jerman). Semi-private grup kecil atau private 1-on-1, plus mock test. Daftar di Linguo.id.",
  alternates: { canonical: "https://linguo.id/persiapan-tes" },
};

export default function PersiapanTesPage() {
  return (
    <>
      <BreadcrumbLd trail={[{ name: "Persiapan Ujian Bahasa", path: "/persiapan-tes" }]} />
      <PersiapanTesClient />
      {/* [seo-tes-kota-v1] Tautan HTML biasa (server) ke landing per ujian —
          katalog di atas berupa modal klien, jadi tanpa blok ini crawler tidak
          menemukan /persiapan-tes/<tes>. */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-heading text-xl font-extrabold text-slate-900">Panduan persiapan tes bahasa lain</h2>
        <p className="mt-1 text-sm text-slate-500">Isi ujian, padanan level CEFR, dan biaya kelas persiapan per ujian resmi.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TES_BAHASA.map((t) => (
            <Link
              key={t.slug}
              href={`/persiapan-tes/${t.slug}`}
              className="rounded-2xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/40"
            >
              <p className="font-bold text-slate-900">Persiapan {t.tes}</p>
              <p className="mt-0.5 text-xs text-slate-500">Bahasa {t.bahasa}</p>
            </Link>
          ))}
          <Link
            href="/persiapan-tes/pte"
            className="rounded-2xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/40"
          >
            <p className="font-bold text-slate-900">Silabus PTE Academic</p>
            <p className="mt-0.5 text-xs text-slate-500">Bahasa Inggris</p>
          </Link>
        </div>
      </section>
    </>
  );
}
