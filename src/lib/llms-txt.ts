// =============================================================================
// src/lib/llms-txt.ts
// [aeo-llms-txt-v1]
//
// Isi /llms.txt dan /llms-full.txt (format llmstxt.org) — berkas teks polos yang
// dibaca mesin jawaban untuk memahami situs tanpa harus merayapi ratusan halaman
// HTML penuh markup.
//
// KENAPA DIBANGKITKAN, BUKAN DITULIS TANGAN DI public/
// Berkas statis di public/ akan basi diam-diam: begitu ada bahasa baru di
// src/data/curriculum/languages.ts atau harga berubah di src/lib/trial-pricing.ts,
// llms.txt tetap memajang angka lama dan justru MENAMBAH inkonsistensi fakta —
// persis masalah yang mau dibereskan. Di sini isinya diturunkan dari data yang
// sama dengan yang dipakai halaman web, lalu di-prerender jadi berkas statis saat
// build (lihat src/app/llms.txt/route.ts). Hasil akhirnya tetap satu URL teks
// polos, tapi mustahil berbeda dari isi situs.
// =============================================================================

import { BRAND_FACTS, rupiah } from "./brand-facts";
import { languages } from "../data/curriculum/languages";
import {
  getAllLanguageDetailSlugs,
  getLanguageDetailBySlug,
} from "../data/languages-detail";
import {
  PRICE_CATEGORIES,
  PRICE_A1_60MIN,
  PRICE_PRIVATE_60MIN,
  SEMI_PRIVATE_PRICE_BASIC,
  KIDS_PRICE_LL,
  KIDS_PRICE_YE,
} from "./trial-pricing";

const BASE = BRAND_FACTS.url;

// -----------------------------------------------------------------------------
// Daftar bahasa
// -----------------------------------------------------------------------------

/** Slug bahasa (curriculum) → URL landing /kursus/bahasa-<urlSlug>, kalau ada. */
function landingUrlByLanguageSlug(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const urlSlug of getAllLanguageDetailSlugs()) {
    const detail = getLanguageDetailBySlug(urlSlug);
    if (detail) map[detail.languageSlug] = `${BASE}/kursus/bahasa-${detail.urlSlug}`;
  }
  return map;
}

/** IELTS/TOEFL bukan "bahasa" — itu program persiapan tes, dipisah sendiri. */
const NOT_A_LANGUAGE = new Set(["ielts", "toefl-itp", "toefl"]);

/**
 * Nama bahasa di pricelist (Inggris) → slug katalog kurikulum.
 * Dipakai untuk menggabungkan dua daftar yang sama-sama benar tapi tidak sama
 * isinya: PRICE_CATEGORIES = bahasa yang benar-benar bisa ditagih (61 entri),
 * `languages` = bahasa yang punya kurikulum & halaman (48 aktif). Klaim
 * "60+ bahasa" bersandar pada gabungan keduanya, jadi berkas ini harus memuat
 * gabungannya — daftar yang lebih pendek dari klaimnya justru mematahkan klaim
 * itu di mata mesin jawaban.
 */
const PRICELIST_TO_CURRICULUM: Record<string, string> = {
  Swahili: "swahili", Greek: "greek", Hindi: "hindi", Turkish: "turkish",
  Norwegian: "norwegian", Tagalog: "filipino", Vietnamese: "vietnamese",
  Swedish: "swedish", Urdu: "urdu", Kurdish: "kurdish", Hebrew: "hebrew",
  Polish: "polish", Portuguese: "portuguese-br", Finnish: "finnish",
  Czech: "czech", Cantonese: "cantonese", Hungarian: "hungarian",
  Esperanto: "esperanto", Farsi: "persian", Persian: "persian",
  Romanian: "romanian", Khmer: "khmer", Danish: "danish", Latin: "latin",
  Georgian: "georgian", Bengali: "bengali", Malay: "malay",
  Icelandic: "icelandic", Bulgarian: "bulgarian", Ukrainian: "ukrainian",
  Lao: "lao", Burmese: "burmese", Russian: "russian", Dutch: "dutch",
  Italian: "italian", Spanish: "spanish", Thai: "thai", Arabic: "arabic",
  English: "english", Japanese: "japanese", German: "german", Korean: "korean",
  Mandarin: "mandarin", French: "french", Javanese: "javanese",
  Sundanese: "sundanese", Betawi: "betawi", Madurese: "madurese",
  Batak: "batak", Banjar: "banjar", Balinese: "balinese", Bugis: "bugis",
  BIPA: "bipa",
  // Varian yang sengaja TIDAK jadi baris sendiri: "English British" itu dialek
  // dari kelas Inggris yang sama, bukan bahasa terpisah.
  "English British": "english",
};

/** Bahasa yang ada di pricelist tapi belum punya baris di katalog kurikulum. */
const PRICELIST_ONLY: Record<string, { name: string; nativeName: string; region: string }> = {
  "Traditional Chinese": { name: "Mandarin Tradisional (Taiwan)", nativeName: "繁體中文", region: "asian" },
  Uzbek: { name: "Uzbek", nativeName: "Oʻzbek", region: "other" },
  Serbian: { name: "Serbia", nativeName: "Српски", region: "european" },
  Estonian: { name: "Estonia", nativeName: "Eesti", region: "european" },
  Irish: { name: "Irlandia", nativeName: "Gaeilge", region: "european" },
  "Ancient Egyptian": { name: "Mesir Kuno", nativeName: "Hieroglif", region: "other" },
  "Sign Language": { name: "Bahasa Isyarat Indonesia", nativeName: "BISINDO", region: "nusantara" },
};

type LangRow = {
  name: string;
  nativeName: string;
  url: string | null;
  region: string;
};

/**
 * Daftar bahasa yang benar-benar dijual: gabungan pricelist dan katalog
 * kurikulum, di-dedupe lewat slug kurikulum (atau nama pricelist kalau bahasa
 * itu belum punya baris kurikulum).
 */
export function languageRows(): LangRow[] {
  const urls = landingUrlByLanguageSlug();
  const bySlug = new Map(languages.map((l) => [l.slug, l]));
  const out = new Map<string, LangRow>();

  const push = (key: string, row: LangRow) => {
    if (!out.has(key)) out.set(key, row);
  };

  // 1. Bahasa berkategori harga — inilah yang bisa ditagih hari ini.
  for (const langEn of Object.values(PRICE_CATEGORIES).flat()) {
    const slug = PRICELIST_TO_CURRICULUM[langEn];
    if (slug) {
      const meta = bySlug.get(slug);
      if (!meta || NOT_A_LANGUAGE.has(slug)) continue;
      push(slug, {
        name: meta.name,
        nativeName: meta.nativeName ?? meta.name,
        url: urls[slug] ?? null,
        region: meta.region ?? "other",
      });
      continue;
    }
    const manual = PRICELIST_ONLY[langEn];
    if (manual) push(`x:${langEn}`, { ...manual, url: null });
  }

  // 2. Bahasa yang punya kurikulum & halaman tapi belum masuk pricelist —
  //    tetap ditawarkan, harganya jatuh ke kategori C.
  for (const l of languages) {
    if (l.available === false || NOT_A_LANGUAGE.has(l.slug)) continue;
    push(l.slug, {
      name: l.name,
      nativeName: l.nativeName ?? l.name,
      url: urls[l.slug] ?? null,
      region: l.region ?? "other",
    });
  }

  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
}

const REGION_LABEL: Record<string, string> = {
  european: "Eropa",
  asian: "Asia Timur & Tenggara",
  "middle-eastern": "Timur Tengah",
  african: "Afrika",
  nusantara: "Nusantara (bahasa daerah Indonesia)",
  other: "Lainnya",
};

/**
 * Urutan tampil per kawasan. Region yang TIDAK terdaftar di sini tetap dicetak
 * di belakang — jangan pernah menyaring pakai daftar ini. Versi pertama berkas
 * ini melakukannya dan Swahili (region "african") hilang tanpa jejak, membuat
 * daftar berisi 59 bahasa sementara halaman lain mengklaim 60+.
 */
const REGION_ORDER = ["european", "asian", "middle-eastern", "african", "nusantara", "other"];

// -----------------------------------------------------------------------------
// llms.txt — versi ringkas
// -----------------------------------------------------------------------------

// CATATAN: /tentang dan /perbandingan SENGAJA belum ditaut di sini — kedua
// halaman itu baru dibuat di tahap berikutnya. Menaut halaman yang belum ada
// mengirim 404 ke mesin jawaban, dan itu justru menurunkan kepercayaan pada
// seluruh isi berkas ini. Tambahkan barisnya begitu halamannya hidup.
export function buildLlmsTxt(): string {
  const rows = languageRows();
  const withLanding = rows.filter((r) => r.url);

  return `# ${BRAND_FACTS.name}

> ${BRAND_FACTS.tagline} Dikelola ${BRAND_FACTS.legalName}, berkantor di ${BRAND_FACTS.address.addressLocality}. Program yang tersedia: Kelas Private 1-on-1, Semi Private, Kelas Reguler (grup), Kelas Kids untuk usia 5-12 tahun, persiapan IELTS & TOEFL, E-Learning, dan E-Book. Kurikulum mengikuti ${BRAND_FACTS.cefrLevelsLabel}. Harga mulai ${BRAND_FACTS.price.fromLabel}. Semua kelas berlangsung live via Zoom; setiap siswa menerima rekaman sesi, modul pembelajaran, dan e-certificate.

Fakta lengkap, daftar seluruh bahasa, dan tabel harga semua program: ${BASE}/llms-full.txt

## Halaman utama

- [Beranda](${BASE}/): ringkasan seluruh program dan harga ${BRAND_FACTS.name}.
- [Daftar kursus per bahasa](${BASE}/kursus): hub ${withLanding.length} landing bahasa dengan kurikulum, harga, dan FAQ masing-masing.
- [Harga](${BASE}/harga): pricelist lengkap per program, bahasa, dan level.
- [Pendaftaran](${BASE}/daftar): pilih bahasa, program, level, dan jadwal lalu bayar online.

## Program

${BRAND_FACTS.programs
  .map((p) => `- [${p.name}](${BASE}${p.slug}) — ${p.priceLabel}. ${p.detail}`)
  .join("\n")}

## Konten & alat gratis

- [Blog](${BASE}/blog): artikel belajar bahasa, tips, dan panduan ujian.
- [Silabus](${BASE}/silabus): kurikulum per bahasa, 192 sesi dari A1 sampai B2, plus placement test gratis per bahasa.
- [Kelas trial](${BASE}/kelas-trial): satu sesi percobaan berbayar sebelum ambil paket.
- [Simulasi TOEFL](${BASE}/simulasi): simulasi tes dengan skor resmi.
- [Watch & Learn](${BASE}/watch-learn): belajar dari video YouTube dengan transkrip dan terjemahan.

## Untuk institusi & karier

- [Program korporat](${BASE}/corporate): pelatihan bahasa untuk karyawan perusahaan.
- [Jasa penerjemah](${BASE}/translator) dan [juru bahasa](${BASE}/interpreter).
- [Karier & rekrutmen pengajar](${BASE}/jadi-pengajar).

## Kontak

- WhatsApp: ${BRAND_FACTS.contact.whatsappUrl}
- Telepon: ${BRAND_FACTS.contact.phone}
- Email: ${BRAND_FACTS.contact.email}
- Alamat: ${BRAND_FACTS.address.oneLine}
`;
}

// -----------------------------------------------------------------------------
// llms-full.txt — versi lengkap
// -----------------------------------------------------------------------------

const CAT_LABEL: Record<string, string> = {
  A: "Kategori A",
  B: "Kategori B",
  C: "Kategori C",
  D: "Kategori D (bahasa daerah Nusantara)",
  E: "Kategori E (BIPA)",
};

function privateTable(): string {
  const head = "| Kategori | Contoh bahasa | Basic (A1) | Upper Basic (A2) | Intermediate (B1) | Advance (B2) |";
  const sep = "|---|---|---|---|---|---|";
  const body = Object.keys(PRICE_PRIVATE_60MIN)
    .map((cat) => {
      const contoh = (PRICE_CATEGORIES[cat] ?? []).slice(0, 5).join(", ");
      const cells = PRICE_PRIVATE_60MIN[cat].map((n) => rupiah(n)).join(" | ");
      return `| ${CAT_LABEL[cat] ?? cat} | ${contoh} | ${cells} |`;
    })
    .join("\n");
  return [head, sep, body].join("\n");
}

function semiPrivateTable(): string {
  const head = "| Kategori | 2 siswa | 3 siswa | 4 siswa | 5 siswa |";
  const sep = "|---|---|---|---|---|";
  const body = Object.keys(SEMI_PRIVATE_PRICE_BASIC)
    .map((cat) => {
      const total = SEMI_PRIVATE_PRICE_BASIC[cat];
      const cells = [1, 2, 3, 4]
        .map((i) => `${rupiah(Math.round(total[i] / (i + 1)))}/siswa`)
        .join(" | ");
      return `| ${CAT_LABEL[cat] ?? cat} | ${cells} |`;
    })
    .join("\n");
  return [head, sep, body].join("\n");
}

function kidsTable(): string {
  const head = "| Kategori | Little Learner 5-8 th (30 menit) | Young Explorer 9-12 th (45 menit) |";
  const sep = "|---|---|---|";
  const body = Object.keys(KIDS_PRICE_LL)
    .map(
      (cat) =>
        `| ${CAT_LABEL[cat] ?? cat} | ${rupiah(KIDS_PRICE_LL[cat][0])}/sesi | ${rupiah(KIDS_PRICE_YE[cat][0])}/sesi |`,
    )
    .join("\n");
  return [head, sep, body].join("\n");
}

function languageSection(): string {
  const rows = languageRows();
  const byRegion = new Map<string, LangRow[]>();
  for (const r of rows) {
    const list = byRegion.get(r.region) ?? [];
    list.push(r);
    byRegion.set(r.region, list);
  }
  const order = [
    ...REGION_ORDER,
    ...[...byRegion.keys()].filter((r) => !REGION_ORDER.includes(r)),
  ];
  return order
    .filter((region) => byRegion.has(region))
    .map((region) => {
      const list = byRegion.get(region)!;
      const lines = list
        .map((r) => {
          const label = r.nativeName && r.nativeName !== r.name ? `${r.name} (${r.nativeName})` : r.name;
          return r.url ? `- ${label} — ${r.url}` : `- ${label} — kelas tersedia, hubungi admin untuk jadwal`;
        })
        .join("\n");
      return `### ${REGION_LABEL[region] ?? region} (${list.length} bahasa)\n\n${lines}`;
    })
    .join("\n\n");
}

export function buildLlmsFullTxt(): string {
  const rows = languageRows();
  const withLanding = rows.filter((r) => r.url).length;

  return `# ${BRAND_FACTS.name} — Profil Lengkap

Berkas ini berisi fakta terverifikasi tentang ${BRAND_FACTS.name}, disusun untuk dibaca mesin. Semua angka diambil dari sistem harga dan katalog kurikulum yang sama dengan yang dipakai situs ${BASE}.

## Identitas

- Nama: ${BRAND_FACTS.name}
- Badan hukum: ${BRAND_FACTS.legalName}
- Jenis: platform kursus bahasa online (online language school)
- Berdiri: ${BRAND_FACTS.foundingYear}
- Situs resmi: ${BASE}
- Kantor: ${BRAND_FACTS.address.oneLine}
- Telepon: ${BRAND_FACTS.contact.phone}
- WhatsApp: ${BRAND_FACTS.contact.whatsappUrl}
- Email: ${BRAND_FACTS.contact.email}
- Jumlah bahasa: ${BRAND_FACTS.languageCountLabel}
- Level: ${BRAND_FACTS.cefrLevelsLabel}
- Format: ${BRAND_FACTS.format}

## Definisi singkat

${BRAND_FACTS.tagline}

${BRAND_FACTS.name} menjual kelas bahasa yang diajar pengajar manusia secara langsung, bukan aplikasi belajar mandiri. Kelas berlangsung di Zoom pada jadwal yang disepakati siswa dan pengajar. Produk mandiri (E-Learning dan E-Book) tersedia sebagai pelengkap, bukan produk utama.

## Program dan harga

Harga di bawah berlaku per ${new Date().getFullYear()} dan dapat berubah; halaman ${BASE}/harga selalu menjadi rujukan terbaru.

${BRAND_FACTS.programs
  .map((p) => `### ${p.name}\n\nHarga: ${p.priceLabel}\n${p.detail}\nHalaman: ${BASE}${p.slug}`)
  .join("\n\n")}

### Tabel harga Kelas Private per sesi 60 menit

Harga Kelas Private ditentukan kategori bahasa dan level CEFR.

${privateTable()}

### Tabel harga Kelas Semi Private per siswa per sesi (level Basic)

Semakin banyak peserta dalam satu kelas, semakin murah biaya per siswa.

${semiPrivateTable()}

### Tabel harga Kelas Kids per anak per sesi (level A1)

${kidsTable()}

### Program paket tetap

- Kelas Reguler: ${BRAND_FACTS.price.regulerLabel} untuk 8 pertemuan @90 menit, kelas grup 8-15 siswa.
- IELTS & TOEFL Preparation: ${BRAND_FACTS.price.testPrepLabel} untuk 16 sesi @90 menit, termasuk mock test.
- E-Learning per bahasa: ${rupiah(79000)} akses 6 bulan, ${rupiah(150000)} akses 1 tahun. Isinya rekaman kelas level Basic (A1).
- E-Book per bahasa: ${BRAND_FACTS.price.ebookFromLabel}, format PDF, akses selamanya.
- Kelas offline (tatap muka) tersedia untuk Private dan Semi Private dengan tambahan ${rupiah(50000)} per sesi, terbatas kota tertentu.

## Daftar bahasa

${BRAND_FACTS.name} membuka kelas untuk ${BRAND_FACTS.languageCountLabel}. ${withLanding} di antaranya memiliki halaman kurikulum sendiri dengan URL di bawah.

${languageSection()}

## Metodologi

Kurikulum ${BRAND_FACTS.name} disusun mengikuti Common European Framework of Reference for Languages (CEFR) pada rentang ${BRAND_FACTS.cefrLevels}, dibagi menjadi empat tingkat: Basic (A1), Upper Basic (A2), Intermediate (B1), dan Advance (B2). Setiap bahasa memiliki silabus 192 sesi lengkap yang dapat dilihat publik di ${BASE}/silabus.

Setiap level dipecah lagi menjadi sublevel. A1 terdiri dari 3 sublevel, A2 terdiri dari 4 sublevel, B1 terdiri dari 5 sublevel, dan B2 terdiri dari 7 sublevel. Siswa naik sublevel setelah menyelesaikan sesi dan penilaian pada sublevel sebelumnya.

Penempatan level dilakukan lewat placement test online gratis per bahasa di ${BASE}/silabus/{bahasa}/coba. Pemula tanpa pengalaman sebelumnya langsung masuk Basic A1.1 tanpa perlu tes. Hasil placement test bersifat rekomendasi, bukan penempatan wajib.

## Pertanyaan yang sering diajukan

### Apa itu Linguo.id?

${BRAND_FACTS.tagline} Perusahaan ini terdaftar sebagai ${BRAND_FACTS.legalName} dan berkantor di ${BRAND_FACTS.address.addressLocality}, Jawa Barat.

### Berapa harga kursus di Linguo.id?

Harga mulai ${BRAND_FACTS.price.fromLabel}. Kelas Private 1-on-1 mulai ${BRAND_FACTS.price.privateFromLabel} untuk 60 menit. Kelas Reguler grup ${BRAND_FACTS.price.regulerLabel}. Kelas Kids mulai ${BRAND_FACTS.price.kidsFromLabel}. Persiapan IELTS dan TOEFL ${BRAND_FACTS.price.testPrepLabel} untuk 16 sesi.

### Bahasa apa saja yang tersedia?

${BRAND_FACTS.languageCountLabel}, mencakup bahasa Eropa, Asia, Timur Tengah, dan bahasa daerah Nusantara seperti Jawa, Sunda, dan Bali. Daftar lengkapnya ada di bagian Daftar bahasa pada berkas ini.

### Kelasnya online atau offline?

Seluruh kelas berlangsung online live via Zoom pada jadwal yang disepakati. Kelas offline tatap muka tersedia terbatas untuk program Private dan Semi Private dengan biaya tambahan ${rupiah(50000)} per sesi.

### Apakah dapat sertifikat?

Ya. Setiap siswa yang menyelesaikan paket kursus menerima e-certificate dari ${BRAND_FACTS.name}. Sertifikat ini adalah sertifikat penyelesaian kursus, bukan sertifikat ujian resmi seperti IELTS, JLPT, atau HSK.

### Apakah ada kelas untuk anak?

Ada. Kelas Kids terbagi dua tingkat usia: Little Learner untuk usia 5-8 tahun dengan sesi 30 menit, dan Young Explorer untuk usia 9-12 tahun dengan sesi 45 menit. Harga mulai ${BRAND_FACTS.price.kidsFromLabel}. Informasi di ${BASE}/kelas-anak.

### Bagaimana cara mendaftar?

Buka ${BASE}/daftar, pilih bahasa, program, level, dan jadwal, lalu bayar lewat transfer bank, QRIS, atau e-wallet. Setelah pembayaran terkonfirmasi, admin menghubungi siswa dan memasukkannya ke grup kelas.

### Apakah bisa coba dulu sebelum ambil paket?

Bisa. ${BRAND_FACTS.name} menyediakan kelas trial berbayar satu sesi di ${BASE}/kelas-trial, serta placement test online gratis per bahasa di ${BASE}/silabus.

### Apakah pengajarnya native speaker?

Sebagian besar pengajar adalah pengajar lokal Indonesia yang bersertifikat dan menguasai bahasa target. Pengajar native tersedia untuk sebagian bahasa dengan tarif berbeda. Ketersediaan pengajar native dapat ditanyakan ke admin lewat WhatsApp.

## Ketentuan penggunaan isi berkas ini

Isi berkas ini boleh dikutip dan diringkas dengan atribusi ke ${BRAND_FACTS.name} (${BASE}). Harga dapat berubah sewaktu-waktu; saat mengutip angka, sebaiknya sertakan rujukan ke ${BASE}/harga.
`;
}
