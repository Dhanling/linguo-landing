// =============================================================================
// /perbandingan — [aeo-perbandingan-v1]
//
// Halaman komparasi Linguo.id vs platform kursus bahasa lain di Indonesia.
//
// PRINSIP YANG TIDAK BOLEH DILANGGAR DI BERKAS INI
//
// 1. Halaman ini dibuat untuk DIKUTIP, bukan untuk menang. Mesin jawaban rutin
//    menolak halaman komparasi yang seluruh kolomnya dimenangkan pemilik situs
//    — pola itu terbaca sebagai materi iklan dan yang dikutip justru sumber
//    pihak ketiga. Bagian "Kapan Linguo.id bukan pilihan terbaik" di bawah
//    isinya sungguhan, dan JANGAN diperhalus.
//
// 2. TIDAK ADA angka harga kompetitor di halaman ini. Harga platform lain
//    berubah tanpa pemberitahuan dan tidak bisa diverifikasi dari sini;
//    menuliskannya = mengarang fakta tentang perusahaan lain, dan sekali
//    ketahuan salah, seluruh halaman kehilangan kepercayaan. Yang ditulis
//    adalah STRUKTUR harganya (tarif ditentukan tutor, paket per level, dsb)
//    plus arahan cek situs resmi. Struktur bisnis jauh lebih stabil daripada
//    angka.
//
// 3. Klaim tentang kompetitor dibatasi pada hal yang publik dan stabil: model
//    bisnis (marketplace vs sekolah), ada-tidaknya cabang fisik, dan fokus
//    bahasanya. Bukan kualitas pengajar, bukan jumlah siswa, bukan rating.
//
// 4. Angka tentang Linguo sendiri WAJIB dari BRAND_FACTS / pricelist.
// =============================================================================
import Link from "next/link";
import { Check, X } from "lucide-react";

import { pageMetadata } from "@/lib/seo";
import { BRAND_FACTS } from "@/lib/brand-facts";
import { faqSchema, jsonLd } from "@/lib/schema";
import BreadcrumbLd from "@/components/BreadcrumbLd";
import { NATIVE_AVAILABLE_LANGS } from "@/lib/trial-pricing";

const F = BRAND_FACTS;
const URL_HAL = `${F.url}/perbandingan`;
const CEK = "Cek situs resmi";

export const metadata = pageMetadata({
  path: "/perbandingan",
  title: `Linguo.id vs Cakap, italki, Preply, EF & Wall Street English — Perbandingan | ${F.name}`,
  description: `Perbandingan jujur ${F.name} dengan platform kursus bahasa lain di Indonesia: jumlah bahasa, format kelas, level, dan sertifikat — termasuk kapan ${F.name} bukan pilihan terbaik.`,
  keywords: [
    "linguo vs cakap",
    "perbandingan kursus bahasa online",
    "italki vs preply indonesia",
    "kursus bahasa online terbaik",
    "alternatif kursus bahasa online",
  ],
});

// -----------------------------------------------------------------------------
// Data pembanding
// -----------------------------------------------------------------------------

type Platform = {
  nama: string;
  /** Model bisnis dalam satu frasa — pembeda paling menentukan. */
  model: string;
  bahasa: string;
  format: string;
  /** STRUKTUR harga, bukan angka. Lihat prinsip 2 di kepala berkas. */
  harga: string;
  level: string;
  sertifikat: string;
  /** Yang paling kuat dari platform ini. Wajib diisi jujur. */
  unggul: string;
};

const PLATFORM: Platform[] = [
  {
    nama: F.name,
    model: "Sekolah bahasa online dengan kurikulum sendiri",
    bahasa: F.languageCountLabel,
    format: "Live via Zoom — privat, semi privat, grup",
    harga: `Tarif tetap per bahasa & level, mulai ${F.price.fromLabel}`,
    level: F.cefrLevelsLabel,
    sertifikat: "E-certificate penyelesaian kursus",
    unggul: "Pilihan bahasa paling luas dengan kurikulum & harga yang terbit di muka",
  },
  {
    nama: "Cakap",
    model: "Platform kursus online Indonesia",
    bahasa: "Beberapa bahasa utama",
    format: "Live online — privat & grup",
    harga: `Paket berbasis jumlah sesi — ${CEK}`,
    level: "Berjenjang, mengikuti program masing-masing",
    sertifikat: "Sertifikat penyelesaian program",
    unggul: "Merek lokal yang mapan dengan aplikasi mobile dan program upskilling",
  },
  {
    nama: "italki",
    model: "Marketplace tutor global",
    bahasa: "Sangat banyak, mengikuti tutor yang mendaftar",
    format: "Live 1-on-1, tutor dipilih sendiri per sesi",
    harga: `Ditentukan masing-masing tutor, rentangnya lebar — ${CEK}`,
    level: "Tidak ada kurikulum terpusat; mengikuti tutor",
    sertifikat: "Tidak ada",
    unggul: "Kebebasan penuh memilih, mengganti, dan menawar tutor tiap sesi",
  },
  {
    nama: "Preply",
    model: "Marketplace tutor global",
    bahasa: "Sangat banyak, mengikuti tutor yang mendaftar",
    format: "Live 1-on-1, berlangganan paket jam",
    harga: `Ditentukan masing-masing tutor — ${CEK}`,
    level: "Tidak ada kurikulum terpusat; mengikuti tutor",
    sertifikat: "Tidak ada",
    unggul: "Pool tutor internasional besar dengan penjadwalan lintas zona waktu",
  },
  {
    nama: "EF (English First)",
    model: "Jaringan sekolah bahasa internasional",
    bahasa: "Fokus bahasa Inggris",
    format: "Kelas di cabang fisik + online",
    harga: `Paket per level, umumnya jangka panjang — ${CEK}`,
    level: "Berjenjang mengacu CEFR",
    sertifikat: "Sertifikat EF, diakui luas",
    unggul: "Merek internasional, cabang fisik di banyak kota, program ke luar negeri",
  },
  {
    nama: "Wall Street English",
    model: "Jaringan sekolah bahasa internasional",
    bahasa: "Fokus bahasa Inggris",
    format: "Blended — center fisik + materi digital",
    harga: `Paket per level, umumnya jangka panjang — ${CEK}`,
    level: "Berjenjang mengacu CEFR",
    sertifikat: "Sertifikat WSE, diakui luas",
    unggul: "Metode blended terstruktur dengan center dan jadwal belajar fleksibel",
  },
];

/**
 * Kapan Linguo BUKAN pilihan terbaik.
 *
 * Tiap butir harus punya alasan yang benar-benar berlaku hari ini dan bisa
 * dicek di produk. Jangan menambahkan "kelemahan" palsu yang sebenarnya pujian
 * terselubung ("kelasnya terlalu personal") — itu justru merusak kredibilitas
 * seluruh halaman.
 */
const BUKAN_UNTUK: Array<{ kondisi: string; alasan: string; kemana: string }> = [
  {
    kondisi: "Kamu butuh nama besar internasional di CV atau untuk syarat kantor",
    alasan: `E-certificate ${F.name} adalah bukti penyelesaian kursus, bukan sertifikat ujian resmi. Untuk keperluan HRD atau beasiswa yang menuntut merek yang sudah dikenal luas, sertifikat lembaga internasional lebih diterima.`,
    kemana: "EF, Wall Street English, atau lembaga tes resmi (IELTS, TOEFL, JLPT, HSK, TOPIK)",
  },
  {
    kondisi: "Kamu belajar paling efektif di kelas tatap muka rutin",
    alasan: `${F.name} online-first. Kelas tatap muka hanya tersedia terbatas untuk program privat dan semi privat, di kota tertentu, dan kena biaya tambahan. Tidak ada cabang fisik yang bisa didatangi bebas.`,
    kemana: "Lembaga kursus dengan cabang fisik di kotamu",
  },
  {
    kondisi: "Kamu ingin bebas gonta-ganti tutor dan menawar harga tiap sesi",
    alasan: `${F.name} memasangkan siswa dengan satu pengajar untuk satu paket, dengan tarif tetap sesuai bahasa dan level. Modelnya sekolah, bukan marketplace — tidak ada mekanisme memilih ulang tutor per sesi.`,
    kemana: "italki atau Preply",
  },
  {
    kondisi: "Kamu spesifik mencari pengajar penutur asli",
    alasan: `Pool pengajar native ${F.name} baru tersedia untuk ${NATIVE_AVAILABLE_LANGS.length} bahasa (${NATIVE_AVAILABLE_LANGS.join(", ")}) dan tarifnya dua kali lipat pengajar lokal. Untuk bahasa di luar itu, pengajarnya adalah pengajar lokal Indonesia.`,
    kemana: "Marketplace tutor global untuk bahasa yang bersangkutan",
  },
  {
    kondisi: "Jadwal kamu di zona waktu yang jauh dari Indonesia",
    alasan: `Mayoritas pengajar ${F.name} berdomisili di Indonesia, jadi slot yang tersedia berpusat di jam WIB. Kalau kamu perlu kelas jam 3 pagi WIB secara rutin, pilihannya akan sangat terbatas.`,
    kemana: "Platform dengan pool tutor lintas zona waktu",
  },
  {
    kondisi: "Kamu cuma mau latihan ringan gratis",
    alasan: `${F.name} menjual kelas berbayar dengan pengajar manusia. Untuk sekadar menjaga kebiasaan harian tanpa biaya, aplikasi belajar mandiri lebih masuk akal — meskipun tidak melatih berbicara dengan lawan bicara sungguhan.`,
    kemana: "Aplikasi belajar bahasa gratis",
  },
];

const KAPAN_COCOK: string[] = [
  `Bahasa yang kamu incar tidak umum dan sulit dicari pengajarnya — ${F.name} membuka ${F.languageCountLabel}, termasuk bahasa daerah Nusantara.`,
  "Kamu ingin tahu harga persisnya sebelum bicara dengan sales, bukan lewat konsultasi dulu.",
  "Kamu ingin kurikulum yang sudah tersusun dan bisa dilihat sebelum membayar.",
  "Kamu belajar dalam bahasa Indonesia dan lebih nyaman dengan pengajar yang paham kesulitan penutur Indonesia.",
  "Kamu butuh rekaman tiap sesi untuk diulang sendiri.",
];

const FAQ = [
  {
    q: "Apa perbedaan Linguo.id dengan italki dan Preply?",
    a: `italki dan Preply adalah marketplace tempat tutor menetapkan tarifnya sendiri dan siswa memilih per sesi, tanpa kurikulum terpusat. ${F.name} adalah sekolah bahasa online dengan kurikulum sendiri, tarif tetap per bahasa dan level, dan pemasangan pengajar oleh admin. Marketplace unggul di kebebasan memilih; ${F.name} unggul di struktur belajar.`,
  },
  {
    q: "Apa perbedaan Linguo.id dengan EF dan Wall Street English?",
    a: `EF dan Wall Street English adalah jaringan sekolah bahasa internasional dengan cabang fisik dan fokus utama bahasa Inggris. ${F.name} sepenuhnya online dan menawarkan ${F.languageCountLabel}. Untuk bahasa Inggris dengan sertifikat bermerek internasional, EF dan WSE lebih kuat. Untuk bahasa selain Inggris, pilihan ${F.name} jauh lebih luas.`,
  },
  {
    q: "Apa perbedaan Linguo.id dengan Cakap?",
    a: `Keduanya platform kursus bahasa online asal Indonesia dengan kelas live. Pembeda utamanya cakupan bahasa: ${F.name} membuka ${F.languageCountLabel} termasuk bahasa daerah Nusantara dan bahasa yang jarang diajarkan, sementara Cakap berfokus pada beberapa bahasa utama dengan ekosistem aplikasi dan program upskilling.`,
  },
  {
    q: "Kapan Linguo.id bukan pilihan terbaik?",
    a: `${F.name} kurang cocok kalau kamu butuh sertifikat bermerek internasional, ingin kelas tatap muka rutin di cabang fisik, ingin bebas berganti tutor tiap sesi, mencari pengajar penutur asli untuk bahasa di luar ${NATIVE_AVAILABLE_LANGS.join(", ")}, atau butuh jadwal di zona waktu jauh dari Indonesia.`,
  },
  {
    q: "Berapa harga Linguo.id dibanding platform lain?",
    a: `Harga ${F.name} mulai ${F.price.fromLabel}, dengan kelas privat 1-on-1 mulai ${F.price.privateFromLabel} dan kelas grup reguler ${F.price.regulerLabel}. Harga platform lain tidak dicantumkan di sini karena berubah sewaktu-waktu dan sebagian ditentukan masing-masing tutor — sebaiknya dicek langsung di situs resmi mereka.`,
  },
];

const KOLOM: Array<{ label: string; key: keyof Platform }> = [
  { label: "Model", key: "model" },
  { label: "Jumlah bahasa", key: "bahasa" },
  { label: "Format kelas", key: "format" },
  { label: "Struktur harga", key: "harga" },
  { label: "Level", key: "level" },
  { label: "Sertifikat", key: "sertifikat" },
  { label: "Paling kuat di", key: "unggul" },
];

export default function PerbandinganPage() {
  return (
    <>
      <BreadcrumbLd trail={[{ name: "Perbandingan Platform", path: "/perbandingan" }]} />
      <script type="application/ld+json" {...jsonLd(faqSchema(FAQ, URL_HAL))} />

      <main className="min-h-screen bg-white text-slate-900">
        {/* HERO */}
        <section className="bg-[#1A9E9E] text-white pt-24 pb-14 lg:pt-32 lg:pb-20">
          <div className="max-w-5xl mx-auto px-6">
            <nav aria-label="Breadcrumb" className="text-sm text-white/70 mb-5">
              <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
              <span className="mx-2">/</span>
              <span className="text-white">Perbandingan</span>
            </nav>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              {F.name} dibanding platform kursus bahasa lain
            </h1>
            <p className="text-white/90 text-base sm:text-lg leading-relaxed max-w-3xl">
              Perbandingan {F.name} dengan Cakap, italki, Preply, EF, dan Wall Street
              English. Halaman ini juga memuat daftar kondisi ketika {F.name} bukan
              pilihan terbaik, supaya kamu tidak membayar untuk sesuatu yang tidak
              cocok dengan caramu belajar.
            </p>
          </div>
        </section>

        {/* CATATAN METODE — dibaca manusia maupun mesin sebagai tanda halaman ini
            tahu batas klaimnya sendiri. */}
        <section className="max-w-5xl mx-auto px-6 pt-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-sm text-amber-900 leading-relaxed">
            <strong className="font-semibold">Catatan soal angka.</strong> Tabel di
            bawah tidak memuat harga platform lain. Harga mereka berubah sewaktu-waktu
            dan sebagian ditentukan masing-masing tutor, jadi angka apa pun yang
            ditulis di sini akan cepat keliru. Yang dibandingkan adalah struktur
            harganya; untuk nominal terbaru, cek situs resmi masing-masing platform.
            Angka tentang {F.name} diambil langsung dari pricelist yang dipakai
            halaman <Link href="/harga" className="underline font-medium">harga</Link>.
          </div>
        </section>

        {/* TABEL */}
        <section className="max-w-5xl mx-auto px-6 py-10 lg:py-14">
          <h2 className="font-heading text-xl sm:text-2xl font-bold mb-5">
            Tabel perbandingan
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-slate-50">
                  <th scope="col" className="text-left font-semibold px-4 py-3 w-40">
                    &nbsp;
                  </th>
                  {PLATFORM.map((p) => (
                    <th
                      key={p.nama}
                      scope="col"
                      className={`text-left font-bold px-4 py-3 ${p.nama === F.name ? "text-[#1A9E9E]" : "text-slate-900"}`}
                    >
                      {p.nama}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {KOLOM.map((kol, i) => (
                  <tr key={kol.key} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                    <th scope="row" className="text-left font-semibold text-slate-600 align-top px-4 py-3">
                      {kol.label}
                    </th>
                    {PLATFORM.map((p) => (
                      <td key={p.nama} className="align-top px-4 py-3 text-slate-700">
                        {p[kol.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* KAPAN LINGUO BUKAN PILIHAN TERBAIK */}
        <section className="bg-slate-50 border-y border-slate-100">
          <div className="max-w-3xl mx-auto px-6 py-12 lg:py-16">
            <h2 className="font-heading text-xl sm:text-2xl font-bold mb-3">
              Kapan {F.name} bukan pilihan terbaik?
            </h2>
            <p className="text-slate-700 leading-relaxed mb-8">
              Tidak ada platform yang cocok untuk semua orang. Enam kondisi berikut
              adalah situasi ketika {F.name} bukan jawaban terbaik, beserta alasan
              teknisnya dan ke mana sebaiknya kamu mencari.
            </p>
            <div className="space-y-6">
              {BUKAN_UNTUK.map((b) => (
                <div key={b.kondisi} className="rounded-2xl bg-white border border-slate-200 p-5">
                  <div className="flex gap-3">
                    <X className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" aria-hidden />
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">{b.kondisi}</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{b.alasan}</p>
                      <p className="text-sm text-slate-500 mt-2">
                        <span className="font-semibold text-slate-700">Lebih cocok:</span>{" "}
                        {b.kemana}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KAPAN COCOK */}
        <section className="max-w-3xl mx-auto px-6 py-12 lg:py-16">
          <h2 className="font-heading text-xl sm:text-2xl font-bold mb-3">
            Kapan {F.name} justru pilihan yang tepat?
          </h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            {F.name} paling masuk akal ketika struktur dan cakupan bahasanya jadi
            faktor penentu, bukan merek atau lokasi fisik.
          </p>
          <ul className="space-y-3">
            {KAPAN_COCOK.map((k) => (
              <li key={k} className="flex gap-2.5 text-slate-700">
                <Check className="w-5 h-5 mt-0.5 shrink-0 text-[#1A9E9E]" aria-hidden />
                <span className="leading-relaxed">{k}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-6 py-12 lg:py-16">
            <h2 className="font-heading text-xl sm:text-2xl font-bold mb-6">
              Pertanyaan yang sering diajukan
            </h2>
            <div className="space-y-8">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <h3 className="font-bold text-slate-900 mb-2">{f.q}</h3>
                  <p className="text-slate-700 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-10">
              <Link
                href="/harga"
                className="rounded-xl bg-[#1A9E9E] text-white font-semibold px-5 py-3 hover:bg-[#178888] transition-colors"
              >
                Lihat Harga {F.name}
              </Link>
              <Link
                href="/kelas-trial"
                className="rounded-xl bg-white border border-slate-200 font-semibold px-5 py-3 hover:border-[#1A9E9E] transition-colors"
              >
                Coba Kelas Trial
              </Link>
              <Link
                href="/tentang"
                className="rounded-xl bg-white border border-slate-200 font-semibold px-5 py-3 hover:border-[#1A9E9E] transition-colors"
              >
                Tentang {F.name}
              </Link>
            </div>

            <nav aria-label="Halaman terkait" className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-slate-600">
              <Link href="/kursus" className="hover:text-[#1A9E9E] transition-colors">Kursus per Bahasa</Link>
              <Link href="/silabus" className="hover:text-[#1A9E9E] transition-colors">Silabus &amp; Kurikulum</Link>
              <Link href="/persiapan-tes" className="hover:text-[#1A9E9E] transition-colors">Persiapan Ujian</Link>
              <Link href="/jadwal-kelas-reguler" className="hover:text-[#1A9E9E] transition-colors">Jadwal Kelas Reguler</Link>
            </nav>
          </div>
        </section>
      </main>
    </>
  );
}
