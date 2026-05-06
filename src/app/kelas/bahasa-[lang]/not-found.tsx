// src/app/kelas/bahasa-[lang]/not-found.tsx
import Link from "next/link";

import { languageDetails, getLanguageMetaForDetail } from "../../../data/languages-detail";

export default function BahasaNotFound() {
  const available = Object.values(languageDetails).map((d) => ({
    detail: d,
    meta: getLanguageMetaForDetail(d),
  }));

  return (
    <main className="min-h-[70vh] bg-white">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#1A9E9E]/10 text-4xl">
          🔎
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Halaman bahasa belum tersedia
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Kelas bahasa yang kamu cari mungkin tersedia di Linguo, tapi halaman detailnya belum
          dirilis. Coba salah satu yang sudah ada di bawah, atau langsung hubungi kami.
        </p>

        <div className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Bahasa yang tersedia
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {available.map(({ detail, meta }) => {
              if (!meta) return null;
              return (
                <Link
                  key={detail.urlSlug}
                  href={`/kelas/bahasa-${detail.urlSlug}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#1A9E9E]/40 hover:shadow-md"
                >
                  <span className="text-3xl">{meta.flag}</span>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">Bahasa {meta.name}</div>
                    <div className="text-xs text-slate-500">{meta.nativeName ?? ""}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/kelas"
            className="inline-flex items-center justify-center rounded-full border-2 border-[#1A9E9E] px-6 py-3 font-semibold text-[#1A9E9E] transition hover:bg-[#1A9E9E] hover:text-white"
          >
            Lihat Semua Kelas
          </Link>
          <a
            href="https://wa.me/6282217866789?text=Halo%20Linguo%2C%20saya%20mau%20tanya%20kelas%20bahasa..."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#1A9E9E] px-6 py-3 font-semibold text-white transition hover:bg-[#168585]"
          >
            Tanya via WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
