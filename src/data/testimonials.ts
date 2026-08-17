// [seo-review-schema-v1]
// Testimoni siswa sebelumnya hidup sebagai konstanta lokal di src/app/page.tsx
// dan hanya tampil di homepage. Dipindah ke sini karena sekarang dipakai dua
// tempat: carousel homepage DAN halaman /kursus/bahasa-*, yang memakainya untuk
// schema.org Review + AggregateRating.
//
// ATURAN YANG TIDAK BOLEH DILANGGAR:
//  1. Isinya harus testimoni ASLI dari siswa sungguhan. Review palsu di
//     structured data itu pelanggaran kebijakan Google dan berujung manual
//     action — hukumannya jauh lebih mahal daripada bintang yang didapat.
//  2. Review hanya boleh di-markup di halaman yang MENAMPILKAN review itu.
//     Karena itu /kursus/bahasa-* merender testimoninya, bukan sekadar
//     menyisipkan JSON-LD diam-diam.
//  3. Bahasa yang belum punya testimoni TIDAK mendapat aggregateRating sama
//     sekali — bukan diberi nilai default. Lihat testimonialsForLang().
//
// `lang` di sini dicocokkan dengan `urlSlug` di src/data/languages-detail.ts
// (korea, jepang, inggris, prancis, rusia, turki, ...).

export type Testimonial = {
  /** urlSlug bahasa yang diambil siswa ini. */
  lang: string;
  /** Label bahasa untuk tampilan (dipakai carousel homepage). */
  langLabel: string;
  name: string;
  photo: string;
  /** Gradien fallback kalau foto gagal dimuat. */
  color: string;
  initials: string;
  text: string;
  /** Bintang yang ditampilkan di kartu — sekarang seluruhnya 5. */
  rating: number;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    lang: "inggris", langLabel: "Inggris", name: "Suci Damaeyanti",
    photo: "/images/testimoni/suci-damaeyanti.jpg",
    color: "from-pink-300 to-rose-400", initials: "SD", rating: 5,
    text: "Belajar di Linguo sangat membantu meningkatkan kemampuan bahasa Inggris saya, terutama dalam speaking dan grammar yang awalnya benar-benar tidak saya ketahui. Sekarang, saya sudah mulai paham perlahan. Pengajarnya sabar, materinya mudah dipahami, suasana belajarnya oke, dan waktu les fleksibel.",
  },
  {
    lang: "turki", langLabel: "Turki", name: "Arivania Shafa N",
    photo: "/images/testimoni/arivania-shafa-n.jpg",
    color: "from-blue-300 to-indigo-400", initials: "AS", rating: 5,
    text: "Saya baru pertama kali ikut Kelas Bahasa Turki, awalnya kirain bakal boring dan susah, tapi ternyata gampang banget setelah diajarin tutor Linguo dan seru juga kelasnya, bisa bikin good mood.",
  },
  {
    lang: "korea", langLabel: "Korea", name: "Astrid Setyowati",
    photo: "/images/testimoni/astrid-setyowati.jpg",
    color: "from-purple-300 to-violet-400", initials: "AS", rating: 5,
    text: "Belajar di Linguo sangat membantu saya dalam belajar bahasa Korea. Cara mengajarnya mudah dipahami. Meskipun kelasnya online lewat Zoom, tapi kelasnya tetap terasa menyenangkan.",
  },
  {
    lang: "jepang", langLabel: "Jepang", name: "Tasya Jehan",
    photo: "/images/testimoni/tasya-jehan.jpg",
    color: "from-amber-300 to-orange-400", initials: "TJ", rating: 5,
    text: "Kursus bahasa di Linguo ID sangat menyenangkan. Gurunya mengajar dengan baik serta menjelaskan materi secara lengkap dan detail. Saya mengambil kelas bahasa Jepang dan saat ini sudah melanjutkan hingga tahap ke-3.",
  },
  {
    lang: "rusia", langLabel: "Rusia", name: "Cicie Prilianti",
    photo: "/images/testimoni/cicie-prilianti.jpg",
    color: "from-emerald-300 to-teal-400", initials: "CP", rating: 5,
    text: "Jadi, aku mengikuti dua kelas di Linguo: kelas Bahasa Jepang dan kelas Bahasa Rusia. Pengajarnya sangat semangat dan asyik saat mengajar.",
  },
  {
    lang: "prancis", langLabel: "Prancis", name: "Grace Cynthia",
    photo: "/images/testimoni/grace-cynthia.jpg",
    color: "from-cyan-300 to-sky-400", initials: "GC", rating: 5,
    text: "ini pertama kalinya saya ikut kelas di Linguo ID. Saya ambil kelas Bahasa Prancis. Keren banget ternyata kelasnya karena bisa langsung praktik jadi proses belajarnya terasa nggak terlalu rumit.",
  },
];

/** Testimoni untuk satu bahasa. Array kosong = bahasa itu belum punya. */
export function testimonialsForLang(urlSlug: string): Testimonial[] {
  return TESTIMONIALS.filter((t) => t.lang === urlSlug);
}

/**
 * AggregateRating dari testimoni yang BENAR-BENAR tampil di halaman.
 * Mengembalikan null kalau tidak ada — pemanggil wajib menghilangkan
 * aggregateRating dari schema, bukan mengisinya dengan angka karangan.
 */
export function aggregateRatingFor(items: Testimonial[]) {
  if (items.length === 0) return null;
  const avg = items.reduce((s, t) => s + t.rating, 0) / items.length;
  return {
    "@type": "AggregateRating" as const,
    ratingValue: Number(avg.toFixed(1)),
    reviewCount: items.length,
    bestRating: 5,
    worstRating: 1,
  };
}
