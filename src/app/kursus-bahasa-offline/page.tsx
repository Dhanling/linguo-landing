// =============================================================================
// /kursus-bahasa-offline — [seo-tes-kota-v1]
//
// Hub kelas offline (pengajar datang ke lokasi siswa) + daftar halaman kota.
// Menyasar kueri "kursus bahasa offline", "les privat bahasa datang ke rumah".
// Komponen server; aturan & harga dari lib/trial-pricing (lihat ../shared.tsx).
// =============================================================================
import Link from "next/link";
import { ArrowLeft, Check, MapPin, MessageCircle, X } from "lucide-react";

import BreadcrumbLd from "@/components/BreadcrumbLd";
import { pageMetadata } from "@/lib/seo";
import { faqSchema, jsonLd } from "@/lib/schema";
import { BRAND_FACTS, rupiah } from "@/lib/brand-facts";
import { KOTA_OFFLINE } from "@/data/kursusOfflineKota";
import { FaqList, LANGKAH, SELISIH_LABEL, TEAL, faqUmumOffline, tarifPrivat, waOfflineHref } from "./shared";

const PATH = "/kursus-bahasa-offline";
const URL_HALAMAN = `${BRAND_FACTS.url}${PATH}`;

export const metadata = pageMetadata({
  path: PATH,
  title: "Kursus Bahasa Offline — Les Privat, Pengajar Datang ke Rumah | Linguo.id",
  description: `Kursus bahasa offline: pengajar privat Linguo datang ke rumah, kos, atau kantormu di Jakarta, Bandung, Surabaya, Yogyakarta, Bali, dan kota lain. Tarif online + ${SELISIH_LABEL}/sesi, Private & Semi Private.`,
  keywords: [
    "kursus bahasa offline",
    "les privat bahasa datang ke rumah",
    "guru les bahasa ke rumah",
    "kursus bahasa inggris privat datang ke rumah",
    "les bahasa tatap muka",
  ],
});

/** Contoh tarif untuk tabel ringkas — bahasa dari kategori harga yang berbeda. */
const CONTOH = [
  { langEn: "English", nama: "Inggris" },
  { langEn: "Japanese", nama: "Jepang" },
  { langEn: "Spanish", nama: "Spanyol" },
  { langEn: "Turkish", nama: "Turki" },
  { langEn: "Sundanese", nama: "Sunda" },
  { langEn: "BIPA", nama: "BIPA (Indonesia untuk penutur asing)" },
];

export default function KursusBahasaOfflineHub() {
  const faq = faqUmumOffline();

  return (
    <>
      <BreadcrumbLd trail={[{ name: "Kursus Bahasa Offline", path: PATH }]} />
      <script type="application/ld+json" {...jsonLd(faqSchema(faq, URL_HALAMAN))} />

      <main className="min-h-screen bg-white pb-16 text-slate-900">
        <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-800 hover:text-teal-600">
              <ArrowLeft className="h-4 w-4" /> Linguo.id
            </Link>
            <a href={waOfflineHref()} target="_blank" rel="noopener" className="text-sm font-medium text-teal-600">
              Cek pengajar
            </a>
          </div>
        </header>

        <section className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <h1 className="font-heading text-3xl font-extrabold leading-tight sm:text-5xl">Kursus Bahasa Offline: Pengajar Datang ke Lokasimu</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Selain kelas online via Zoom, {BRAND_FACTS.name} membuka kelas offline untuk Kelas Private dan Semi Private: pengajar
            datang ke rumah, kos, atau kantormu. Tarifnya sama dengan tarif online ditambah {SELISIH_LABEL} per sesi, berlaku sama
            di semua kota. Linguo tidak punya cabang, jadi kelas offline bergantung pada pengajar yang bisa menjangkau lokasimu —
            ketersediaannya dicek dulu lewat WhatsApp.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={waOfflineHref()}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-white shadow"
              style={{ background: TEAL }}
            >
              <MessageCircle className="h-4 w-4" /> Cek pengajar di kotamu
            </a>
            <a href="#kota" className="rounded-xl border-2 px-5 py-3 text-sm font-bold" style={{ borderColor: TEAL, color: TEAL }}>
              Pilih kota
            </a>
          </div>
        </section>

        {/* Kota */}
        <section id="kota" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Kelas offline per kota</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KOTA_OFFLINE.map((k) => (
              <Link
                key={k.slug}
                href={`/kursus-bahasa-offline/${k.slug}`}
                className="rounded-2xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/40"
              >
                <p className="flex items-center gap-1.5 font-bold text-slate-900">
                  <MapPin className="h-4 w-4 text-teal-600" /> {k.nama}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                  {k.grupArea.flatMap((g) => g.area).slice(0, 4).join(", ")}, dan sekitarnya
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Kotamu tidak ada di daftar? Permintaan dari kota lain tetap diterima dan dicek satu per satu lewat WhatsApp.
          </p>
        </section>

        {/* Yang bisa & tidak bisa */}
        <section className="mx-auto grid max-w-4xl gap-6 px-4 py-8 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-extrabold">Yang bisa offline</h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
              {[
                "Kelas Private 1-on-1, untuk siswa anak maupun dewasa.",
                "Semi Private untuk grup 2–10 orang yang kamu bentuk sendiri (teman, keluarga, rekan kerja).",
                "Semua bahasa yang dibuka Linguo, selama ada pengajar yang menjangkau lokasimu.",
                "Jadwal disepakati bersama pengajar: pagi, malam, atau akhir pekan.",
              ].map((x) => (
                <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" /><span>{x}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-extrabold">Yang tetap online</h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
              {[
                "Kelas Reguler — kelas grup berjadwal tetap per batch via Zoom.",
                "Persiapan IELTS & TOEFL dalam bentuk batch.",
                "Paket Recording sesi & E-book belum termasuk di kelas offline.",
              ].map((x) => (
                <li key={x} className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span>{x}</span></li>
              ))}
            </ul>
          </div>
        </section>

        {/* Tarif */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Contoh tarif kelas offline</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Kelas Private 60 menit, level A1. Tarif dasar berbeda per bahasa dan naik mengikuti level; selisih offline selalu{" "}
            {SELISIH_LABEL} per sesi. Tarif lengkap per bahasa ada di halaman <Link href="/harga" className="font-semibold text-teal-700 underline">Harga</Link>.
          </p>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Bahasa</th>
                  <th className="px-4 py-2 text-right font-semibold">Online / sesi</th>
                  <th className="px-4 py-2 text-right font-semibold">Offline / sesi</th>
                </tr>
              </thead>
              <tbody>
                {CONTOH.map((c) => {
                  const t = tarifPrivat(c.langEn);
                  return (
                    <tr key={c.langEn} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{c.nama}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{rupiah(t.online)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-800">{rupiah(t.offline)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Langkah */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Cara daftar kelas offline</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2">
            {LANGKAH.map((l, i) => (
              <li key={l.judul} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-bold" style={{ color: TEAL }}>Langkah {i + 1}</p>
                <p className="mt-0.5 font-bold text-slate-900">{l.judul}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{l.isi}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Pertanyaan seputar kelas offline</h2>
          <FaqList items={faq} />
        </section>

        <section className="mx-auto max-w-4xl px-4 pt-4">
          <div className="rounded-3xl bg-slate-900 px-6 py-8 text-center sm:px-10">
            <h2 className="font-heading text-xl font-extrabold text-white sm:text-2xl">Lebih suka online?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Kelas online via Zoom tanpa selisih biaya, dari mana saja, untuk {BRAND_FACTS.languageCountLabel}.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/kursus" className="rounded-xl px-5 py-3 text-sm font-bold text-white shadow" style={{ background: TEAL }}>
                Lihat kursus online
              </Link>
              <a href={waOfflineHref()} target="_blank" rel="noopener" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white">
                Tanya kelas offline
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
