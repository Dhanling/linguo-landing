// [program-arab-quran-v1] Program khusus Bahasa Arab Al-Qur'an.
//
// Lahir dari percakapan calon siswa (28 Sep 2026): sudah bisa membaca, pernah
// belajar tarjim per kata + nahwu-sharaf tapi mandek, dan ingin "kalau ayat
// dibacakan, aku ngerti artinya". Kelas Bahasa Arab umum (/kursus/bahasa-arab)
// berangkat dari Fusha modern + percakapan; program ini khusus bahasa Al-Qur'an:
// kosakata diurutkan menurut frekuensi dalam mushaf, nahwu-sharaf dipakai
// langsung untuk membedah ayat.
//
// Harga TIDAK ditulis di sini — program ini berjalan di format kelas Private /
// Semi Private Bahasa Arab yang tarifnya sudah ada di /harga.
import Link from "next/link";
import { Amiri_Quran } from "next/font/google";
import {
  BookOpen, Ear, Layers, Puzzle, Sparkles, MessageCircle, ArrowRight, Check, Users, User, ScrollText,
  type LucideIcon,
} from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { jsonLd, faqSchema, type FaqItem } from "@/lib/schema";
import BreadcrumbLd from "@/components/BreadcrumbLd";
import TautanLegal from "@/components/TautanLegal";

const amiri = Amiri_Quran({ weight: "400", subsets: ["arabic"], display: "swap" });

const TEAL = "#1A9E9E";
const URL_HAL = "https://linguo.id/bahasa-arab-quran";
const WA =
  "https://wa.me/6282116859493?text=" +
  encodeURIComponent("Halo Linguo, saya tertarik program Bahasa Arab Al-Qur'an. Boleh konsultasi dulu?");

export const metadata = pageMetadata({
  path: "/bahasa-arab-quran",
  title: "Belajar Bahasa Arab Al-Qur'an Online — Paham Makna Ayat | Linguo.id",
  description:
    "Program Bahasa Arab Al-Qur'an: kosakata diurutkan menurut frekuensi dalam mushaf, nahwu-sharaf untuk membedah " +
    "ayat, latihan menyimak murattal. Private 1-on-1 atau semi private, jadwal fleksibel.",
  keywords: [
    "belajar bahasa arab al quran",
    "kursus bahasa arab al quran online",
    "belajar memahami al quran",
    "nahwu sharaf al quran",
    "bahasa arab quran untuk pemula",
  ],
});

// Angka dihitung dari Quranic Arabic Corpus (76.572 kata, per bentuk dasar /
// lema batang kata) — lihat scripts/build-quran-morph.mjs untuk sumber datanya.
const STATISTIK = [
  { angka: "100", teks: "kata dasar terbanyak menutupi ±59% kata dalam Al-Qur'an" },
  { angka: "300", teks: "kata dasar terbanyak menutupi ±75% kata dalam Al-Qur'an" },
  { angka: "1.651", teks: "akar kata — sekali paham polanya, ratusan kata ikut terbuka" },
];

const UNTUK: { ikon: LucideIcon; judul: string; teks: string }[] = [
  {
    ikon: BookOpen,
    judul: "Sudah lancar membaca, belum paham artinya",
    teks: "Bacaan tartil, tapi maknanya masih bergantung penuh pada terjemahan di samping.",
  },
  {
    ikon: Layers,
    judul: "Pernah belajar nahwu-sharaf, lalu mandek",
    teks: "Tabel tashrif dan istilah i'rab terasa jauh dari ayat. Di sini keduanya langsung dipakai di ayat.",
  },
  {
    ikon: Ear,
    judul: "Ingin paham saat mendengar",
    teks: "Saat imam membaca atau murattal diputar, kamu ingin menangkap maknanya tanpa membuka terjemah.",
  },
];

const TAHAP = [
  {
    no: 1,
    judul: "Kosakata inti Al-Qur'an",
    isi: [
      "Kata-kata yang paling sering muncul dalam mushaf, diurutkan menurut frekuensinya",
      "Dhamir (kata ganti), huruf jar, isim isyarah & isim maushul",
      "Latihan langsung di surat-surat pendek juz 30",
    ],
    hasil: "Mulai menangkap makna surat-surat yang dibaca saat shalat.",
  },
  {
    no: 2,
    judul: "Sharaf praktis: membaca pola kata",
    isi: [
      "Akar tiga huruf dan cara menebak makna dari polanya",
      "Wazan fi'il bab I–X, isim fa'il, isim maf'ul, mashdar",
      "Fi'il madhi, mudhari', amr — dan siapa pelakunya dari bentuk katanya",
    ],
    hasil: "Kata baru tidak lagi asing karena akarnya sudah dikenal.",
  },
  {
    no: 3,
    judul: "Nahwu fungsional: membedah kalimat",
    isi: [
      "Jumlah ismiyah & fi'liyah, mubtada'-khabar, fa'il & maf'ul bih",
      "Marfu', manshub, majrur — kenapa harakat akhir berubah",
      "Idhafah, na'at, inna & kana beserta saudaranya",
    ],
    hasil: "Bisa menjelaskan kedudukan tiap kata dalam satu ayat.",
  },
  {
    no: 4,
    judul: "Tadabbur langsung dari ayat",
    isi: [
      "Membedah Al-Fatihah, juz 30, dan ayat-ayat pilihan sesuai minatmu",
      "Menyimak murattal lalu menerjemahkan tanpa melihat teks",
      "Membandingkan pilihan kata dan nuansa antarayat",
    ],
    hasil: "Paham makna saat mendengar, bukan hanya saat membaca terjemah.",
  },
];

const ALUR: { ikon: LucideIcon; judul: string; teks: string }[] = [
  { ikon: Ear, judul: "Dengar", teks: "Ayat diputar dulu. Tebak apa yang sudah kamu tangkap." },
  { ikon: Puzzle, judul: "Bedah kata", teks: "Akar, wazan, dan jenis kata — isim, fi'il, atau harf." },
  { ikon: ScrollText, judul: "I'rab", teks: "Kedudukan tiap kata dan kenapa harakatnya begitu." },
  { ikon: Sparkles, judul: "Tadabbur", teks: "Makna utuh ayat, lalu dengar ulang tanpa teks." },
];

const FAQ: FaqItem[] = [
  {
    q: "Apa bedanya dengan kelas Bahasa Arab biasa di Linguo?",
    a: "Kelas Bahasa Arab umum berangkat dari Fusha modern dan percakapan (berita, studi, kerja di Timur Tengah). Program ini khusus bahasa Al-Qur'an: kosakata dipilih menurut frekuensinya dalam mushaf, dan nahwu-sharaf langsung dipakai untuk membedah ayat — tanpa materi percakapan sehari-hari.",
  },
  {
    q: "Harus sudah bisa membaca huruf Arab?",
    a: "Idealnya sudah bisa membaca Al-Qur'an, meskipun masih pelan. Kalau belum lancar, sampaikan saat konsultasi supaya pengajar menyesuaikan titik mulainya.",
  },
  {
    q: "Saya pernah belajar nahwu-sharaf lalu berhenti. Mulai dari awal lagi?",
    a: "Tidak harus. Di sesi pertama pengajar memetakan apa yang sudah kamu kuasai, lalu kelas melanjutkan dari situ. Materi yang dulu terasa abstrak akan dipakai langsung di ayat, jadi lebih mudah menempel.",
  },
  {
    q: "Kelasnya private atau grup?",
    a: "Bisa Private 1-on-1 (jadwal dan kecepatan sepenuhnya mengikuti kamu) atau Semi Private bersama teman/keluarga. Tarifnya mengikuti kelas Bahasa Arab di halaman harga.",
  },
  {
    q: "Apa itu Al-Qur'an Digital Linguo?",
    a: "Mushaf 604 halaman yang bisa dibuka gratis di linguo.id/alquran. Ketuk kata untuk arti bahasa Indonesia, audio pelafalan, dan analisa sharaf-nya; ada juga analisa i'rab per ayat. Siswa memakainya untuk mengulang materi di luar kelas.",
  },
];

export default function BahasaArabQuranPage() {
  return (
    <main className="min-h-screen bg-white text-stone-900">
      <BreadcrumbLd trail={[{ name: "Bahasa Arab Al-Qur'an", path: "/bahasa-arab-quran" }]} />
      <script type="application/ld+json" {...jsonLd(faqSchema(FAQ, URL_HAL))} />

      {/* Bilah atas */}
      <header className="border-b border-stone-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="font-bold">Linguo</span>
          </Link>
          <Link
            href="/alquran"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-stone-50"
            style={{ color: TEAL }}
          >
            <BookOpen size={16} /> Al-Qur&apos;an Digital
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#F4EFE3]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.15fr_.85fr] md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
              Program khusus
            </p>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Bahasa Arab <span className="whitespace-nowrap">Al-Qur&apos;an</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-stone-600">
              Untuk kamu yang sudah bisa membaca, tapi ingin <b className="text-stone-800">paham maknanya</b> —
              saat membaca sendiri maupun saat ayat diperdengarkan.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={WA}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white shadow-sm transition hover:brightness-110"
                style={{ background: TEAL }}
              >
                <MessageCircle size={18} /> Konsultasi gratis
              </a>
              <Link
                href="/alquran"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-stone-800 ring-1 ring-stone-200 transition hover:bg-stone-50"
              >
                Coba Al-Qur&apos;an Digital <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          {/* Kartu contoh bedah kata */}
          <div className="rounded-3xl border border-[#E2D6B8] bg-[#FFFDF6] p-6 shadow-[0_20px_40px_-20px_rgba(90,70,30,.35)]">
            <p dir="rtl" className={`${amiri.className} text-center text-3xl leading-[2.1] text-stone-900`}>
              إِنَّ ٱلَّذِينَ <span className="rounded-md bg-[#1A9E9E]/20 px-1 text-[#0E6B6B]">كَفَرُوا۟</span> سَوَآءٌ عَلَيْهِمْ
            </p>
            <p className="mt-1 text-center text-xs text-stone-400">QS Al-Baqarah 6</p>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-stone-200">
                <span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
                    fi&apos;il
                  </span>
                  <b className="ml-2">Fi&apos;il Madhi</b> bab I
                </span>
                <span dir="rtl" className={`${amiri.className} text-2xl`}>كَفَرُ</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-stone-200">
                <span>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
                    akhiran
                  </span>
                  <b className="ml-2">Dhamir</b> — mereka (lk)
                </span>
                <span dir="rtl" className={`${amiri.className} text-2xl`}>وا</span>
              </div>
              <p className="pt-1 text-stone-600">
                Akar <b dir="rtl" className={`${amiri.className} text-base`}>ك ف ر</b> · artinya{" "}
                <b>&ldquo;(mereka) kafir&rdquo;</b>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistik */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="max-w-2xl text-2xl font-bold sm:text-3xl">Al-Qur&apos;an lebih dekat dari yang kamu kira</h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          Kata-kata dalam Al-Qur&apos;an banyak yang berulang. Karena itu urutan belajar kami mengikuti frekuensinya —
          yang paling sering muncul, dipelajari lebih dulu.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STATISTIK.map((s) => (
            <div key={s.angka} className="rounded-2xl bg-stone-50 p-6">
              <p className="text-4xl font-extrabold" style={{ color: TEAL }}>
                {s.angka}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.teks}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-400">
          Dihitung dari data morfologi Quranic Arabic Corpus (76.572 kata), berdasarkan bentuk dasar kata.
        </p>
      </section>

      {/* Untuk siapa */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Program ini untuk kamu yang…</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {UNTUK.map(({ ikon: Ikon, judul, teks }) => (
              <div key={judul} className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
                <Ikon size={22} style={{ color: TEAL }} />
                <h3 className="mt-3 font-bold">{judul}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{teks}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kurikulum */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">Alur belajar 4 tahap</h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          Titik mulai menyesuaikan kemampuanmu. Yang pernah belajar nahwu-sharaf bisa langsung masuk tahap yang sesuai.
        </p>
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {TAHAP.map((t) => (
            <li key={t.no} className="rounded-2xl border border-stone-200 p-6">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ background: TEAL }}
                >
                  {t.no}
                </span>
                <h3 className="font-bold">{t.judul}</h3>
              </div>
              <ul className="mt-4 space-y-2">
                {t.isi.map((x) => (
                  <li key={x} className="flex gap-2 text-sm text-stone-600">
                    <Check size={16} className="mt-0.5 shrink-0" style={{ color: TEAL }} />
                    {x}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl bg-[#F4EFE3] px-3 py-2 text-sm font-medium text-stone-700">{t.hasil}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Alur satu sesi */}
      <section className="bg-stone-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Setiap sesi berangkat dari ayat</h2>
          <p className="mt-2 max-w-2xl text-stone-300">
            Bukan hafalan tabel lalu mencari contohnya. Ayat dulu, lalu kaidahnya ditemukan dari ayat itu.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ALUR.map(({ ikon: Ikon, judul, teks }, i) => (
              <div key={judul} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <div className="flex items-center gap-2 text-sm text-stone-400">
                  <Ikon size={18} className="text-[#5FD0D0]" /> Langkah {i + 1}
                </div>
                <h3 className="mt-2 font-bold">{judul}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-300">{teks}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Al-Qur'an digital */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid items-center gap-8 rounded-3xl bg-[#F4EFE3] p-6 sm:p-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Al-Qur&apos;an Digital untuk mengulang di rumah</h2>
            <ul className="mt-4 space-y-2 text-stone-700">
              {[
                "Mushaf Madinah 604 halaman — geser untuk membalik halaman",
                "Ketuk kata: arti bahasa Indonesia + audio pelafalan",
                "Analisa sharaf otomatis: isim/fi'il/harf, akar, wazan, i'rab akhir kata",
                "Analisa i'rab satu ayat penuh, plus terjemah Kemenag & murattal",
              ].map((x) => (
                <li key={x} className="flex gap-2 text-sm">
                  <Check size={16} className="mt-0.5 shrink-0" style={{ color: TEAL }} />
                  {x}
                </li>
              ))}
            </ul>
            <Link
              href="/alquran"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white"
              style={{ background: TEAL }}
            >
              Buka gratis <ArrowRight size={17} />
            </Link>
          </div>
          <Link href="/alquran?hal=1" className="block rounded-2xl border border-[#E2D6B8] bg-[#FFFDF6] p-6 text-center">
            <p dir="rtl" className={`${amiri.className} text-2xl leading-[2.2] text-stone-900`}>
              ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ
            </p>
            <p className="mt-2 text-sm text-stone-500">&ldquo;Segala puji bagi Allah, Tuhan seluruh alam.&rdquo;</p>
          </Link>
        </div>
      </section>

      {/* Format kelas */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">Format kelas</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 ring-2" style={{ ["--tw-ring-color" as string]: TEAL }}>
              <User size={22} style={{ color: TEAL }} />
              <h3 className="mt-3 text-lg font-bold">Private 1-on-1</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                Jadwal, kecepatan, dan titik mulai sepenuhnya mengikuti kamu. Paling cocok untuk yang pernah belajar
                lalu berhenti.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
              <Users size={22} style={{ color: TEAL }} />
              <h3 className="mt-3 text-lg font-bold">Semi Private</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                Belajar bersama pasangan, keluarga, atau teman pengajian dalam satu kelas kecil.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-stone-600">
            Tarif mengikuti kelas Bahasa Arab —{" "}
            <Link href="/harga" className="font-semibold underline" style={{ color: TEAL }}>
              lihat halaman harga
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">Pertanyaan yang sering ditanyakan</h2>
        <div className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <ArrowRight size={16} className="shrink-0 text-stone-400 transition group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl p-8 text-center text-white sm:p-12" style={{ background: TEAL }}>
          <h2 className="text-2xl font-bold sm:text-3xl">Mulai dari ayat yang paling sering kamu dengar</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">
            Ceritakan pengalaman belajarmu — pengajar akan menyarankan titik mulai yang pas.
          </p>
          <a
            href={WA}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-stone-900"
          >
            <MessageCircle size={18} /> Konsultasi via WhatsApp
          </a>
        </div>
        <div className="mx-auto mt-10 max-w-4xl">
          <TautanLegal />
        </div>
      </section>
    </main>
  );
}
