// =============================================================================
// /kursus-bahasa-offline/<kota> — [seo-tes-kota-v1]
//
// Landing SEO "kursus bahasa offline / les privat bahasa di <kota>". Pola
// Ruangguru /center/<kota>, tapi JUJUR: Linguo tidak punya cabang. Yang dijual
// adalah pengajar yang datang ke lokasi siswa, dengan ketersediaan yang dicek
// dulu. Karena itu schema-nya Service (areaServed = kota) yang merujuk node
// organisasi — BUKAN LocalBusiness dengan alamat karangan.
//
// Data: src/data/kursusOfflineKota.ts. Harga & aturan offline: lib/trial-pricing.
// =============================================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, MapPin, MessageCircle, Monitor } from "lucide-react";

import BreadcrumbLd from "@/components/BreadcrumbLd";
import { pageMetadata } from "@/lib/seo";
import { ORG_ID, faqSchema, jsonLd } from "@/lib/schema";
import { BRAND_FACTS, rupiah } from "@/lib/brand-facts";
import { KOTA_OFFLINE, getKotaOffline, type KotaOffline } from "@/data/kursusOfflineKota";
import {
  FaqList,
  LANGKAH,
  SELISIH_LABEL,
  TEAL,
  daftarOfflineHref,
  faqUmumOffline,
  tarifPrivat,
  waOfflineHref,
} from "../shared";

type PageProps = { params: Promise<{ kota: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return KOTA_OFFLINE.map((k) => ({ kota: k.slug }));
}

const judulH1 = (k: KotaOffline) => `Kursus Bahasa Offline di ${k.nama}`;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const k = getKotaOffline((await params).kota);
  if (!k) return { title: "Tidak ditemukan | Linguo.id", robots: { index: false, follow: false } };
  return pageMetadata({
    path: `/kursus-bahasa-offline/${k.slug}`,
    title: `Kursus Bahasa Offline di ${k.nama} — Pengajar Datang ke Rumah | Linguo.id`,
    description: k.metaDescription,
    keywords: [
      `kursus bahasa ${k.nama.toLowerCase()}`,
      `les privat bahasa ${k.nama.toLowerCase()}`,
      `kursus bahasa inggris ${k.nama.toLowerCase()}`,
      `les bahasa datang ke rumah ${k.nama.toLowerCase()}`,
      `kursus bahasa offline ${k.nama.toLowerCase()}`,
    ],
  });
}

export default async function KursusOfflineKotaPage({ params }: PageProps) {
  const k = getKotaOffline((await params).kota);
  if (!k) notFound();

  const path = `/kursus-bahasa-offline/${k.slug}`;
  const url = `${BRAND_FACTS.url}${path}`;
  const faq = [...k.faq, ...faqUmumOffline(k.nama)];
  const baris = k.bahasa.map((b) => ({ ...b, ...tarifPrivat(b.langEn) }));
  const termurah = Math.min(...baris.map((b) => b.offline));
  const tetangga = k.tetangga.map(getKotaOffline).filter((x): x is KotaOffline => x !== null);

  // Service, bukan LocalBusiness: tidak ada alamat cabang di kota ini.
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: judulH1(k),
    serviceType: "Kursus bahasa privat tatap muka di lokasi siswa",
    description: k.metaDescription,
    url,
    provider: { "@id": ORG_ID },
    areaServed: {
      "@type": "City",
      name: k.nama,
      containedInPlace: { "@type": "AdministrativeArea", name: k.provinsi },
    },
    offers: {
      "@type": "Offer",
      name: "Kelas Private offline (60 menit, level A1)",
      price: termurah,
      priceCurrency: "IDR",
      url,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: termurah,
        priceCurrency: "IDR",
        unitText: "per sesi",
      },
    },
  };

  return (
    <>
      <BreadcrumbLd
        trail={[
          { name: "Kursus Bahasa Offline", path: "/kursus-bahasa-offline" },
          { name: k.nama, path },
        ]}
      />
      <script type="application/ld+json" {...jsonLd(serviceLd)} />
      <script type="application/ld+json" {...jsonLd(faqSchema(faq, url))} />

      <main className="min-h-screen bg-white pb-16 text-slate-900">
        <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
            <Link href="/kursus-bahasa-offline" className="flex items-center gap-2 font-bold text-slate-800 hover:text-teal-600">
              <ArrowLeft className="h-4 w-4" /> Kelas Offline
            </Link>
            <a href={waOfflineHref(k.nama)} target="_blank" rel="noopener" className="text-sm font-medium text-teal-600">
              Cek pengajar
            </a>
          </div>
        </header>

        <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-4 pt-5 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-600">Beranda</Link>
          <span className="mx-1.5">/</span>
          <Link href="/kursus-bahasa-offline" className="hover:text-teal-600">Kursus Bahasa Offline</Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-700">{k.nama}</span>
        </nav>

        {/* Hero — tanpa animasi opacity (LCP) */}
        <section className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            <MapPin className="h-3.5 w-3.5" /> {k.nama}, {k.provinsi}
          </p>
          <h1 className="font-heading text-3xl font-extrabold leading-tight sm:text-5xl">{judulH1(k)}</h1>
          <p className="mt-2 text-lg font-semibold text-slate-700">Pengajar privat datang ke rumah, kos, atau kantormu</p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{k.intro}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {[
              "Private 1-on-1 & Semi Private",
              `Tarif online + ${SELISIH_LABEL}/sesi`,
              `Offline mulai ${rupiah(termurah)}/sesi`,
              "Ketersediaan dicek dulu",
            ].map((x) => (
              <span key={x} className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700">{x}</span>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={waOfflineHref(k.nama)}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-white shadow"
              style={{ background: TEAL }}
            >
              <MessageCircle className="h-4 w-4" /> Cek pengajar di {k.nama}
            </a>
            <a
              href="#bahasa"
              className="flex items-center gap-1.5 rounded-xl border-2 px-5 py-3 text-sm font-bold"
              style={{ borderColor: TEAL, color: TEAL }}
            >
              Lihat bahasa & tarif <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Kejujuran soal ketersediaan */}
        <section className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
            <b>Ketersediaan pengajar dicek dulu.</b> Linguo tidak punya cabang di {k.nama}. Kelas offline berjalan kalau ada
            pengajar yang bisa menjangkau lokasimu pada jadwal yang kamu mau — karena itu sebutkan kecamatan dan patokan saat
            bertanya lewat WhatsApp. Kalau belum ada, kelas yang sama tetap bisa diikuti online via Zoom dengan tarif online.
          </div>
        </section>

        {/* Area */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Area {k.nama} yang sering meminta kelas offline</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Daftar ini adalah area yang dikenali tim saat mencarikan pengajar terdekat. Lokasimu tidak ada di daftar? Tetap
            tanyakan — yang menentukan adalah jarak dari pengajar, bukan nama kecamatannya.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {k.grupArea.map((g) => (
              <div key={g.wilayah} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-bold text-slate-900">{g.wilayah}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{g.area.join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Kebutuhan khas kota */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Siapa yang biasanya ambil kelas offline di {k.nama}</h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
            {k.kebutuhan.map((x) => (
              <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" /><span>{x}</span></li>
            ))}
          </ul>
        </section>

        {/* Bahasa & tarif */}
        <section id="bahasa" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Bahasa populer & tarif kelas offline di {k.nama}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Tarif Kelas Private 60 menit level A1. Offline = tarif online + {SELISIH_LABEL} per sesi, sama di semua kota; level
            yang lebih tinggi menyesuaikan pricelist. Bahasa lain di luar daftar ini juga bisa ditanyakan.
          </p>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Bahasa</th>
                  <th className="px-4 py-2 text-right font-semibold">Online / sesi</th>
                  <th className="px-4 py-2 text-right font-semibold">Offline / sesi</th>
                  <th className="px-4 py-2 text-right font-semibold"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody>
                {baris.map((b) => (
                  <tr key={b.slug} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <Link href={`/kursus/bahasa-${b.slug}`} className="font-semibold text-slate-800 hover:text-teal-700">
                        Bahasa {b.nama}
                      </Link>
                      <span className="mt-0.5 block text-[12px] leading-snug text-slate-500">{b.alasan}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500">{rupiah(b.online)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800">{rupiah(b.offline)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={daftarOfflineHref(b.slug, k.kotaFunnel)}
                        rel="nofollow"
                        className="whitespace-nowrap text-xs font-bold"
                        style={{ color: TEAL }}
                      >
                        Daftar offline →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Semi Private offline juga tersedia untuk grup 2–10 orang yang kamu bentuk sendiri; selisih offline ditambahkan
            ke tarif per siswa. Kelas offline belum termasuk paket Recording sesi & E-book.
          </p>
        </section>

        {/* Cara daftar */}
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

        {/* Opsi online */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
            <Monitor className="h-8 w-8 shrink-0 text-teal-600" />
            <div className="flex-1">
              <h2 className="font-heading text-lg font-extrabold">Lebih praktis online?</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Kelas online via Zoom tanpa selisih biaya, dengan pengajar dari seluruh Indonesia — pilihan bahasanya lebih
                lengkap dan jadwalnya lebih longgar. Ada juga Kelas Reguler berjadwal tetap dan Kelas Kids untuk usia 5–12 tahun.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link href="/kursus" className="rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
                Kursus online
              </Link>
              <Link href="/kelas-anak" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700">
                Kelas Kids
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-2xl font-extrabold">Pertanyaan seputar kelas offline di {k.nama}</h2>
          <FaqList items={faq} />
        </section>

        {/* Kota lain */}
        <section className="mx-auto max-w-4xl px-4 py-8">
          <h2 className="font-heading text-xl font-extrabold">Kelas offline di kota lain</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {[...tetangga, ...KOTA_OFFLINE.filter((x) => x.slug !== k.slug && !k.tetangga.includes(x.slug))].map((x) => (
              <Link
                key={x.slug}
                href={`/kursus-bahasa-offline/${x.slug}`}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-teal-300 hover:text-teal-700"
              >
                {x.nama}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Kotamu tidak ada di daftar? Tetap tanyakan lewat WhatsApp, atau ikuti kelas online.
          </p>
        </section>

        {/* Penutup */}
        <section className="mx-auto max-w-4xl px-4 pt-4">
          <div className="rounded-3xl bg-slate-900 px-6 py-8 text-center sm:px-10">
            <h2 className="font-heading text-xl font-extrabold text-white sm:text-2xl">Cek pengajar di dekat lokasimu</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Kirim lokasi, bahasa, usia siswa, dan jadwal yang diinginkan. Tim Linguo membalas dengan ketersediaan pengajar di {k.nama}.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a
                href={waOfflineHref(k.nama)}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-white shadow"
                style={{ background: TEAL }}
              >
                <MessageCircle className="h-4 w-4" /> Tanya lewat WhatsApp
              </a>
              <Link href="/daftar" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white">
                Daftar online
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
