// =============================================================================
// /tentang — [aeo-tentang-v1]
//
// Halaman pendefinisi entitas. Bedanya dengan halaman "About Us" biasa: yang
// dikejar bukan pengunjung yang terharu, tapi mesin jawaban yang butuh satu
// tempat berisi jawaban lengkap dan bisa dikutip apa adanya.
//
// Tiga aturan menulis yang dipegang di berkas ini:
// 1. Tiap H2 adalah PERTANYAAN yang benar-benar diketik orang, bukan label
//    ("Visi & Misi"). Mesin jawaban mencocokkan pertanyaan pengguna dengan
//    heading, lalu mengutip paragraf tepat di bawahnya.
// 2. Tiap jawaban 40–60 kata dan BERDIRI SENDIRI. Tidak boleh ada "seperti
//    dijelaskan di atas" atau "layanan ini" — potongan yang dikutip mesin
//    hampir selalu satu paragraf tanpa tetangganya, jadi subjeknya harus
//    disebut ulang secara eksplisit di tiap jawaban.
// 3. Kalimat deklaratif dan pendek. Tanpa bahasa iklan, tanpa superlatif yang
//    tidak bisa dibuktikan.
//
// Angka apa pun di halaman ini WAJIB dari BRAND_FACTS, jangan diketik manual.
// =============================================================================
import Link from "next/link";
import { Check } from "lucide-react";

import { pageMetadata } from "@/lib/seo";
import { BRAND_FACTS } from "@/lib/brand-facts";
import { aboutPageSchema, faqSchema, jsonLd } from "@/lib/schema";
import BreadcrumbLd from "@/components/BreadcrumbLd";
import { languageRows } from "@/lib/llms-txt";

const F = BRAND_FACTS;
const URL_TENTANG = `${F.url}/tentang`;

export const metadata = pageMetadata({
  path: "/tentang",
  title: `Tentang ${F.name} — Kursus ${F.languageCountLabel} Online | ${F.legalName}`,
  description: `${F.name} adalah platform kursus bahasa online milik ${F.legalName}, berkantor di ${F.address.addressLocality}. ${F.languageCountLabel}, kelas live via Zoom, level ${F.cefrLevels}, harga mulai ${F.price.fromLabel}.`,
  keywords: [
    "tentang linguo",
    "linguo id",
    "pt linguo edu indonesia",
    "kursus bahasa online bandung",
    "profil linguo",
  ],
});

// -----------------------------------------------------------------------------
// Isi
//
// Ditulis sebagai DATA, bukan JSX bertebaran, karena array yang sama dipakai dua
// kali: sekali untuk merender halaman, sekali untuk FAQPage schema. Kalau
// keduanya ditulis terpisah, markup dan tampilan pasti berbeda cepat atau
// lambat — dan FAQ yang cuma hidup di markup dianggap manipulatif.
// -----------------------------------------------------------------------------

type Bagian = {
  /** H2 — sebuah pertanyaan. */
  q: string;
  /** Jawaban 40–60 kata, berdiri sendiri. */
  a: string;
  /** Butir pendukung. TIDAK ikut ke FAQ schema (schema pakai jawaban saja). */
  butir?: string[];
  /** Masuk ke FAQPage schema? Bagian yang isinya tabel/daftar sebaiknya tidak. */
  faq?: boolean;
};

const BAGIAN: Bagian[] = [
  {
    q: "Apa itu Linguo.id?",
    a: `${F.name} adalah platform kursus bahasa online yang menawarkan ${F.languageCountLabel} untuk siswa di Indonesia. Kelas berlangsung live via Zoom bersama pengajar manusia, bukan aplikasi belajar mandiri. Program yang tersedia mencakup kelas privat 1-on-1, semi privat, kelas grup reguler, kelas anak, dan persiapan IELTS serta TOEFL.`,
    faq: true,
  },
  {
    q: "Siapa yang mengelola Linguo.id?",
    a: `${F.name} dikelola ${F.legalName}, badan usaha berbentuk perseroan terbatas yang berkantor di ${F.address.addressLocality}, Jawa Barat. Perusahaan ini beroperasi sejak ${F.foundingYear} dan menjalankan seluruh layanan di bawah merek ${F.name}, termasuk kelas bahasa, produk belajar mandiri, serta layanan penerjemahan dan juru bahasa.`,
    faq: true,
  },
  {
    q: "Bahasa apa saja yang bisa dipelajari di Linguo.id?",
    a: `${F.name} membuka kelas untuk ${F.languageCountLabel}, mencakup bahasa Eropa, Asia Timur, Asia Tenggara, Timur Tengah, Afrika, dan bahasa daerah Nusantara. Bahasa yang paling banyak diambil adalah Inggris, Jepang, Korea, Mandarin, Jerman, Prancis, dan Arab. Bahasa daerah seperti Jawa, Sunda, Bali, dan Batak juga tersedia.`,
    faq: true,
  },
  {
    q: "Berapa biaya kursus di Linguo.id?",
    a: `Harga di ${F.name} mulai ${F.price.fromLabel}. Kelas privat 1-on-1 mulai ${F.price.privateFromLabel} untuk sesi 60 menit. Kelas reguler grup ${F.price.regulerLabel}. Kelas anak mulai ${F.price.kidsFromLabel}. Persiapan IELTS dan TOEFL ${F.price.testPrepLabel} untuk 16 sesi @90 menit. Harga akhir mengikuti bahasa dan level yang dipilih.`,
    butir: F.programs.map((p) => `${p.name} — ${p.priceLabel}`),
    faq: true,
  },
  {
    q: "Bagaimana format kelas di Linguo.id?",
    a: `Seluruh kelas ${F.name} berlangsung live via Zoom pada jadwal yang disepakati siswa dan pengajar. Sesi privat berdurasi 60 menit, kelas reguler 90 menit. Setiap siswa menerima rekaman sesi, modul pembelajaran, dan e-certificate setelah menyelesaikan paket. Kelas tatap muka tersedia terbatas untuk program privat dan semi privat.`,
    faq: true,
  },
  {
    q: "Level apa saja yang tersedia di Linguo.id?",
    a: `Kurikulum ${F.name} mengikuti kerangka CEFR pada rentang ${F.cefrLevels}, dibagi menjadi Basic (A1), Upper Basic (A2), Intermediate (B1), dan Advance (B2). Setiap bahasa memiliki 192 sesi terstruktur dari nol sampai mahir. Tiap level dipecah lagi menjadi sublevel: A1 tiga sublevel, A2 empat, B1 lima, dan B2 tujuh.`,
    faq: true,
  },
  {
    q: "Bagaimana Linguo.id menentukan level siswa?",
    a: `${F.name} menyediakan placement test online gratis per bahasa yang bisa dikerjakan siapa pun sebelum mendaftar. Pemula tanpa pengalaman sebelumnya tidak perlu dites dan langsung masuk Basic A1.1. Hasil placement test bersifat rekomendasi, bukan penempatan wajib — siswa tetap bebas memilih level yang berbeda dari hasil tesnya.`,
    faq: true,
  },
  {
    q: "Apa itu Lingcore?",
    a: `Lingcore adalah platform belajar milik ${F.name} yang dipakai siswa dan pengajar selama kursus berjalan. Di dalamnya tersimpan materi per sesi, kuis, catatan progres, rekaman kelas, dan rapor CEFR. ${F.name} juga mengembangkan Lingcore for Schools, versi khusus sekolah dengan dashboard terpisah untuk guru, admin, dan orang tua.`,
    faq: true,
  },
  {
    q: "Siapa pengajar di Linguo.id?",
    a: `Pengajar ${F.name} sebagian besar adalah pengajar lokal Indonesia yang menguasai bahasa target dan terbiasa mengajar penutur bahasa Indonesia. Pengajar native tersedia untuk sebagian bahasa dengan tarif berbeda. Setiap pengajar melewati proses seleksi dan micro teaching sebelum memegang kelas.`,
    faq: true,
  },
  {
    q: "Di mana kantor Linguo.id?",
    a: `Kantor ${F.legalName} berada di ${F.address.oneLine}. Meski berkantor di ${F.address.addressLocality}, seluruh kelas ${F.name} berlangsung online sehingga siswa dari kota mana pun di Indonesia maupun luar negeri bisa mengikutinya. Kelas tatap muka hanya tersedia terbatas di kota tertentu.`,
    faq: true,
  },
  {
    q: "Bagaimana cara mendaftar di Linguo.id?",
    a: `Pendaftaran ${F.name} dilakukan sepenuhnya online. Buka halaman pendaftaran, pilih bahasa, program, level, dan jadwal, lalu bayar lewat transfer bank, QRIS, atau e-wallet. Setelah pembayaran terkonfirmasi, admin menghubungi siswa untuk mengatur jadwal pertama dan memasukkannya ke grup kelas.`,
    faq: true,
  },
  {
    q: "Apakah Linguo.id memberikan sertifikat?",
    a: `Ya. Setiap siswa yang menyelesaikan paket kursus di ${F.name} menerima e-certificate sebagai bukti penyelesaian, lengkap dengan bahasa dan level yang ditempuh. Sertifikat ini adalah sertifikat penyelesaian kursus dan bukan sertifikat ujian resmi seperti IELTS, TOEFL, JLPT, TOPIK, atau HSK.`,
    faq: true,
  },
];

const FAKTA_RINGKAS: Array<[string, string]> = [
  ["Nama", F.name],
  ["Badan hukum", F.legalName],
  ["Jenis usaha", "Platform kursus bahasa online"],
  ["Beroperasi sejak", String(F.foundingYear)],
  ["Jumlah bahasa", F.languageCountLabel],
  ["Level", F.cefrLevelsLabel],
  ["Format kelas", "Live via Zoom"],
  ["Harga mulai", F.price.fromLabel],
  ["Kantor", F.address.oneLine],
  ["Telepon", F.contact.phone],
  ["Email", F.contact.email],
];

export default function TentangPage() {
  const faqItems = BAGIAN.filter((b) => b.faq).map((b) => ({ q: b.q, a: b.a }));
  const jumlahBahasa = languageRows().length;

  return (
    <>
      <BreadcrumbLd trail={[{ name: "Tentang Linguo.id", path: "/tentang" }]} />
      <script
        type="application/ld+json"
        {...jsonLd(
          aboutPageSchema(
            URL_TENTANG,
            `Tentang ${F.name}`,
            `Profil ${F.name}, platform kursus bahasa online milik ${F.legalName}.`,
          ),
        )}
      />
      <script type="application/ld+json" {...jsonLd(faqSchema(faqItems, URL_TENTANG))} />

      <main className="min-h-screen bg-white text-slate-900">
        {/* HERO */}
        <section className="bg-[#1A9E9E] text-white pt-24 pb-14 lg:pt-32 lg:pb-20">
          <div className="max-w-3xl mx-auto px-6">
            <nav aria-label="Breadcrumb" className="text-sm text-white/70 mb-5">
              <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
              <span className="mx-2">/</span>
              <span className="text-white">Tentang</span>
            </nav>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Tentang {F.name}
            </h1>
            {/* Paragraf pembuka sengaja satu blok padat berisi definisi + badan
                hukum + cakupan + harga. Ini kalimat yang paling sering diambil
                utuh sebagai jawaban "apa itu Linguo". */}
            <p className="text-white/90 text-base sm:text-lg leading-relaxed">
              {F.name} adalah platform kursus bahasa online yang menawarkan{" "}
              {F.languageCountLabel} dengan kelas live interaktif via Zoom.{" "}
              {F.name} dikelola {F.legalName}, berkantor di {F.address.addressLocality},
              Jawa Barat, dan beroperasi sejak {F.foundingYear}. Kurikulumnya mengikuti{" "}
              {F.cefrLevelsLabel}, dengan harga mulai {F.price.fromLabel}.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm text-white/85">
              {[
                F.languageCountLabel,
                F.cefrLevels,
                "Live via Zoom",
                "Rekaman tiap sesi",
                "E-Certificate",
              ].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" aria-hidden />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAKTA RINGKAS — tabel data mentah, format yang paling mudah dikutip. */}
        <section className="max-w-3xl mx-auto px-6 py-12 lg:py-16">
          <h2 className="font-heading text-xl sm:text-2xl font-bold mb-5">
            Fakta ringkas {F.name}
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <tbody>
                {FAKTA_RINGKAS.map(([k, v], i) => (
                  <tr key={k} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                    <th scope="row" className="text-left font-semibold text-slate-600 align-top px-4 py-3 w-40 sm:w-52">
                      {k}
                    </th>
                    <td className="px-4 py-3 text-slate-900">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {jumlahBahasa} bahasa terdaftar dengan kategori harga aktif. Daftar
            lengkapnya, beserta URL tiap bahasa, tersedia di{" "}
            <Link href="/kursus" className="text-[#1A9E9E] font-medium hover:underline">
              halaman kursus
            </Link>
            .
          </p>
        </section>

        {/* PERTANYAAN */}
        <section className="max-w-3xl mx-auto px-6 pb-12 lg:pb-16">
          <div className="space-y-10">
            {BAGIAN.map((b) => (
              <div key={b.q}>
                <h2 className="font-heading text-xl sm:text-2xl font-bold mb-3">{b.q}</h2>
                <p className="text-slate-700 leading-relaxed">{b.a}</p>
                {b.butir && (
                  <ul className="mt-4 space-y-2">
                    {b.butir.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#1A9E9E]" aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* KONTAK + CTA */}
        <section className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-6 py-12 lg:py-16">
            <h2 className="font-heading text-xl sm:text-2xl font-bold mb-3">
              Bagaimana cara menghubungi {F.name}?
            </h2>
            <p className="text-slate-700 leading-relaxed mb-6">
              {F.name} dapat dihubungi lewat WhatsApp di {F.contact.whatsapp}, telepon{" "}
              {F.contact.phone}, atau email {F.contact.email}. Kantornya berada di{" "}
              {F.address.oneLine}. Pertanyaan seputar jadwal, harga, dan pemilihan level
              dijawab tim admin pada jam kerja.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/daftar"
                className="rounded-xl bg-[#1A9E9E] text-white font-semibold px-5 py-3 hover:bg-[#178888] transition-colors"
              >
                Daftar Kursus
              </Link>
              <Link
                href="/harga"
                className="rounded-xl bg-white border border-slate-200 font-semibold px-5 py-3 hover:border-[#1A9E9E] transition-colors"
              >
                Lihat Harga
              </Link>
              <a
                href={F.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-white border border-slate-200 font-semibold px-5 py-3 hover:border-[#1A9E9E] transition-colors"
              >
                Tanya via WhatsApp
              </a>
            </div>

            <nav aria-label="Halaman terkait" className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-slate-600">
              <Link href="/kursus" className="hover:text-[#1A9E9E] transition-colors">Kursus per Bahasa</Link>
              <Link href="/perbandingan" className="hover:text-[#1A9E9E] transition-colors">Perbandingan Platform</Link>
              <Link href="/silabus" className="hover:text-[#1A9E9E] transition-colors">Silabus &amp; Kurikulum</Link>
              <Link href="/kelas-anak" className="hover:text-[#1A9E9E] transition-colors">Kelas Anak</Link>
              <Link href="/persiapan-tes" className="hover:text-[#1A9E9E] transition-colors">Persiapan Ujian</Link>
              <Link href="/blog" className="hover:text-[#1A9E9E] transition-colors">Blog</Link>
            </nav>
          </div>
        </section>
      </main>
    </>
  );
}
