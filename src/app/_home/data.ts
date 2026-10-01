// [home-rsc-v1] Data & helper beranda yang dipakai SERVER (page.tsx) dan klien
// (_home/islands.tsx). Sengaja modul biasa tanpa "use client": nilai yang
// diekspor dari modul "use client" ke komponen server berubah jadi referensi
// klien, bukan isinya.
import { BRAND_FACTS } from "@/lib/brand-facts";
import { programSlugOf, langSlugOf } from "@/lib/funnelRouting";

/**
 * Tautan ke funnel pendaftaran.
 * Tanpa bahasa → /daftar?program=<slug> (bahasa dipilih di langkah 1, lalu
 * langsung lompat ke paket). Dengan bahasa → langsung ke langkah paketnya.
 * JANGAN kirim kombinasi bahasa × program yang tidak dibuka (mis. Reguler untuk
 * bahasa tanpa batch): /daftar sengaja membalas 404 supaya URL sampah tidak lahir.
 */
export const daftarHref = (programLabel?: string, langEn?: string) => {
  const prog = programLabel ? programSlugOf(programLabel) : null;
  if (langEn) return `/daftar/${langSlugOf(langEn)}${prog ? `/${prog}` : ""}`;
  return prog ? `/daftar?program=${prog}` : "/daftar";
};

export const FAQS = [
  {q:"Apa itu Linguo.id?",a:`Linguo.id adalah platform kursus bahasa online milik ${BRAND_FACTS.legalName} yang menawarkan ${BRAND_FACTS.languageCountLabel} dengan kelas live interaktif via Zoom. Level yang tersedia ${BRAND_FACTS.cefrLevelsLabel}. Harga mulai ${BRAND_FACTS.price.fromLabel}.`,video:"3hDBE8o-jJU"},
  {q:"Boleh ikut lebih dari 1 bahasa?",a:"Boleh banget! Kamu bisa daftar beberapa bahasa sekaligus."},
  {q:"Bagaimana format kelasnya?",a:`Kelas Private 1-on-1 via Zoom, 60 menit per sesi, mulai ${BRAND_FACTS.price.privateFromLabel}. Kamu bebas request jadwal & topik. Setiap sesi dapat rekaman, modul pembelajaran, dan e-certificate setelah selesai.`},
  {q:"Dapat sertifikat?",a:"Ya! Setiap siswa yang menyelesaikan kursus mendapat e-certificate."},
  {q:"Cara bayarnya?",a:"Transfer bank, QRIS, GoPay, OVO, dan lainnya. Konfirmasi otomatis."},
  {q:"Ada kelas lanjutan?",a:`Ada. Kurikulum Linguo.id mengikuti ${BRAND_FACTS.cefrLevelsLabel}, jadi kamu bisa lanjut dari Basic sampai Advance tanpa pindah platform.`},
];

// Email format validation (client-side, before hitting Supabase)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// [seo-internal-link-v1] Sepuluh tautan "Learn a Language" di footer dulu semua
// mengarah ke wa.me — jadi otoritas dari halaman terkuat di situs (homepage)
// mengalir keluar ke WhatsApp, sementara landing page bahasa sendiri tidak
// pernah ditaut dari mana pun. Sekarang semuanya menunjuk ke dalam:
// bahasa yang punya landing sendiri → /kursus/bahasa-*, sisanya → silabusnya.
// Label diubah ke bahasa Indonesia supaya cocok dengan kata yang benar-benar
// dicari orang ("kursus bahasa jepang", bukan "learn Japanese").
// [seo-tautan-internal-v1] Enam dari sepuluh baris ini dulu menunjuk
// /silabus/<slug> padahal landing /kursus/bahasa-<slug>-nya SUDAH ada dan justru
// halaman yang menyasar kueri komersial ("kursus bahasa prancis online").
// Tautan dari homepage — halaman terkuat di situs ini — terbuang ke halaman
// silabus yang nilai konversinya jauh lebih rendah. Sekarang semuanya menunjuk
// landing /kursus.
export const FOOTER_LANGUAGES: { label: string; href: string }[] = [
  { label: "Inggris",  href: "/kursus/bahasa-inggris" },
  { label: "Jepang",   href: "/kursus/bahasa-jepang" },
  { label: "Korea",    href: "/kursus/bahasa-korea" },
  { label: "Mandarin", href: "/kursus/bahasa-mandarin" },
  { label: "Prancis",  href: "/kursus/bahasa-prancis" },
  { label: "Jerman",   href: "/kursus/bahasa-jerman" },
  { label: "Spanyol",  href: "/kursus/bahasa-spanyol" },
  { label: "Arab",     href: "/kursus/bahasa-arab" },
  { label: "Italia",   href: "/kursus/bahasa-italia" },
  { label: "Belanda",  href: "/kursus/bahasa-belanda" },
];

// [seo-tautan-internal-v1] Sebelum ini homepage cuma menaut 4 dari 45 landing
// bahasa. Sisanya hanya dijangkau lewat hub /kursus — satu-satunya jalur, dan
// hub itu sendiri baru lahir 17 Agustus 2026. Halaman paling bernilai di situs
// justru yang paling dalam letaknya.
//
// Blok ini menaut SEMUA landing bahasa langsung dari homepage. Urutannya
// sengaja dari bahasa paling dicari ke bahasa daerah, karena urutan tautan
// ikut jadi petunjuk kepentingan.
export const SEMUA_BAHASA: { label: string; slug: string }[] = [
  { label: "Inggris", slug: "inggris" }, { label: "Jepang", slug: "jepang" },
  { label: "Korea", slug: "korea" }, { label: "Mandarin", slug: "mandarin" },
  { label: "Jerman", slug: "jerman" }, { label: "Prancis", slug: "prancis" },
  { label: "Spanyol", slug: "spanyol" }, { label: "Italia", slug: "italia" },
  { label: "Belanda", slug: "belanda" }, { label: "Arab", slug: "arab" },
  { label: "Rusia", slug: "rusia" }, { label: "Turki", slug: "turki" },
  { label: "Yunani", slug: "yunani" }, { label: "Portugis", slug: "portugis" },
  { label: "Thailand", slug: "thailand" }, { label: "Vietnam", slug: "vietnam" },
  { label: "Hindi", slug: "hindi" }, { label: "Swedia", slug: "swedia" },
  { label: "Norwegia", slug: "norwegia" }, { label: "Denmark", slug: "denmark" },
  { label: "Finlandia", slug: "finlandia" }, { label: "Islandia", slug: "islandia" },
  { label: "Polandia", slug: "polandia" }, { label: "Ceko", slug: "ceko" },
  { label: "Hungaria", slug: "hungaria" }, { label: "Rumania", slug: "rumania" },
  { label: "Bulgaria", slug: "bulgaria" }, { label: "Ukraina", slug: "ukraina" },
  { label: "Ibrani", slug: "ibrani" }, { label: "Persia", slug: "persia" },
  { label: "Georgia", slug: "georgia" }, { label: "Kanton", slug: "kanton" },
  { label: "Filipina", slug: "filipina" }, { label: "Khmer", slug: "khmer" },
  { label: "Laos", slug: "laos" }, { label: "Myanmar", slug: "myanmar" },
  { label: "Urdu", slug: "urdu" }, { label: "Indonesia", slug: "indonesia" },
  { label: "Jawa", slug: "jawa" }, { label: "Sunda", slug: "sunda" },
  { label: "Betawi", slug: "betawi" }, { label: "Bali", slug: "bali" },
  { label: "Batak", slug: "batak" }, { label: "Bugis", slug: "bugis" },
  { label: "Madura", slug: "madura" },
];

// Sama seperti di atas: program diarahkan ke halamannya sendiri, bukan ke WA.
// Tombol WA tetap ada di banyak tempat lain — yang hilang cuma kebocoran
// otoritas link, bukan jalur konversinya.
export const FOOTER_PROGRAMS: { label: string; href: string }[] = [
  { label: "Kelas Reguler",   href: "/jadwal-kelas-reguler" },
  { label: "Kelas Private",   href: "/kursus" },
  { label: "Persiapan IELTS", href: "/persiapan-tes" },
  { label: "Persiapan TOEFL", href: "/persiapan-tes" },
  { label: "Persiapan PTE",   href: "/persiapan-tes?produk=pte" },
  { label: "Kelas Anak",      href: "/kelas-anak" },
];
