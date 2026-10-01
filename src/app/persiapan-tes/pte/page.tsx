// [silabus-pte-v1] Silabus kelas Persiapan PTE Academic. Komponen server:
// isinya (16 modul, FAQ, tabel skor) ikut ter-render ke HTML mentah. Hanya
// pemilih paket + daftar sesi yang jadi pulau klien (SilabusPaket).
// Data: lib/pteSyllabus.ts. Harga: lib/testPrep.ts — jangan tulis angka mati.
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Mic, BookOpen, Headphones, Sparkles } from "lucide-react";
import BreadcrumbLd from "@/components/BreadcrumbLd";
import { pageMetadata } from "@/lib/seo";
import { faqSchema, jsonLd } from "@/lib/schema";
import { SESSION_MINUTES, PRIVATE_SESSION_OPTS } from "@/lib/testPrep";
import { PTE_MODULES, PTE_TEST_PARTS, PTE_IELTS_CONCORDANCE, PTE_FAQ } from "@/lib/pteSyllabus";
import SilabusPaket from "./SilabusPaket";

const PATH = "/persiapan-tes/pte";
const PAGE_URL = `https://linguo.id${PATH}`;
const TEAL = "#1A9E9E";
const PART_ICON = [Mic, BookOpen, Headphones];

export const metadata = pageMetadata({
  path: PATH,
  title: "Silabus Kelas Persiapan PTE Academic — Private 1-on-1 | Linguo.id",
  description:
    "Silabus lengkap kelas persiapan PTE Academic di Linguo: 16 modul yang mencakup 22 tipe soal format terbaru (Speaking, Writing, Reading, Listening) plus mock test. Pilih paket 8, 12, atau 16 sesi private.",
  keywords: [
    "silabus PTE Academic",
    "kursus persiapan PTE",
    "les PTE online",
    "kelas PTE private",
    "PTE Academic Indonesia",
  ],
});

export default function SilabusPtePage() {
  return (
    <>
      <BreadcrumbLd
        trail={[
          { name: "Persiapan Ujian Bahasa", path: "/persiapan-tes" },
          { name: "Silabus PTE Academic", path: PATH },
        ]}
      />
      <script type="application/ld+json" {...jsonLd(faqSchema(PTE_FAQ, PAGE_URL))} />

      <main className="min-h-screen bg-white pb-16" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
            <Link href="/persiapan-tes" className="flex items-center gap-2 font-bold text-slate-800 hover:text-teal-600">
              <ArrowLeft className="h-4 w-4" /> Persiapan Ujian
            </Link>
            <a href="https://wa.me/6282116859493" target="_blank" rel="noopener" className="text-sm font-medium text-teal-600">Butuh bantuan?</a>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-teal-50" />
          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:py-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-700">Mengikuti format PTE Academic sejak 7 Agustus 2025</span>
            </div>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              Silabus Kelas Persiapan <span className="bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">PTE Academic</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {PTE_MODULES.length} modul yang mencakup seluruh 22 tipe soal PTE Academic, dari Read Aloud sampai Write from Dictation, ditutup mock test. Kelasnya Private 1-on-1, jadi urutan dan porsinya disesuaikan dengan target skormu.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {[
                `${PTE_MODULES.length} modul`,
                "22 tipe soal",
                `${SESSION_MINUTES} menit per sesi`,
                `Paket ${PRIVATE_SESSION_OPTS.join(" / ")} sesi`,
              ].map((t) => (
                <span key={t} className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700">{t}</span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/persiapan-tes?produk=pte" className="flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-white shadow" style={{ background: TEAL }}>
                Daftar kelas PTE <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#silabus" className="rounded-xl border-2 px-5 py-3 text-sm font-bold" style={{ borderColor: TEAL, color: TEAL }}>
                Lihat silabus
              </a>
            </div>
          </div>
        </section>

        {/* Sekilas tesnya */}
        <section className="mx-auto max-w-4xl px-4 py-10">
          <h2 className="text-2xl font-extrabold text-slate-900">Sekilas tesnya</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            PTE Academic dikerjakan seluruhnya di komputer dalam satu sesi sekitar 2 jam. Skornya 10–90: satu skor Overall dan empat skor skill. Audio hanya diputar sekali, dan soal yang sudah dilewati tidak bisa dibuka lagi.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {PTE_TEST_PARTS.map((p, i) => {
              const Icon = PART_ICON[i] ?? BookOpen;
              return (
                <div key={p.part} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Icon className="h-[18px] w-[18px]" /></span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{p.part}</p>
                      <p className="font-bold leading-tight text-slate-900">{p.name}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">{p.duration} · {p.types} tipe soal</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{p.contoh}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Silabus per paket */}
        <section id="silabus" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-10">
          <h2 className="text-2xl font-extrabold text-slate-900">Silabus per paket</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Isi modulnya sama di semua paket. Yang berbeda adalah berapa lama tiap modul digarap: paket yang lebih pendek menggabung dua modul dalam satu sesi.
          </p>
          <div className="mt-5">
            <SilabusPaket />
          </div>
        </section>

        {/* Cara mengajar + skor */}
        <section className="mx-auto grid max-w-4xl gap-6 px-4 py-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Cara kelasnya berjalan</h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
              {[
                "Tiap sesi: bedah tipe soal dan cara penilaiannya, latihan berwaktu, lalu umpan balik langsung dari pengajar.",
                "Yang diajarkan adalah kerangka berpikir, bukan kalimat hafalan. Sejak Agustus 2025 isi jawaban di tujuh tipe soal ikut ditinjau penilai manusia, sehingga jawaban template yang tidak menyentuh isi soal dinilai rendah.",
                "Ada tugas mandiri di antara sesi supaya waktu kelas dipakai untuk umpan balik, bukan untuk latihan yang bisa dikerjakan sendiri.",
                "Urutan modul bisa digeser mengikuti hasil diagnostik dan tanggal tesmu.",
              ].map((t) => (
                <li key={t} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" /><span>{t}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Skor PTE dan IELTS</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">IELTS Academic</th>
                    <th className="px-4 py-2 text-right font-semibold">PTE Academic (Overall)</th>
                  </tr>
                </thead>
                <tbody>
                  {PTE_IELTS_CONCORDANCE.map((r) => (
                    <tr key={r.ielts} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-semibold text-slate-800">{r.ielts}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-600">{r.pte}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Sumber: studi konkordansi Pearson, Juli 2025. Angka ini hanya pembanding; syarat skor tiap kampus, pemberi kerja, dan jalur visa berbeda, jadi selalu cek syarat lembaga tujuanmu.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-4 py-10">
          <h2 className="text-2xl font-extrabold text-slate-900">Pertanyaan yang sering ditanyakan</h2>
          <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {PTE_FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <span className="text-slate-400 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Penutup */}
        <section className="mx-auto max-w-4xl px-4 pt-4">
          <div className="rounded-3xl bg-slate-900 px-6 py-8 text-center sm:px-10">
            <h2 className="text-xl font-extrabold text-white sm:text-2xl">Siap mulai persiapan PTE?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Pilih paketnya, bayar, lalu tim Linguo menghubungimu lewat WhatsApp untuk mencocokkan jadwal dan pengajar.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/persiapan-tes?produk=pte" className="flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-white shadow" style={{ background: TEAL }}>
                Daftar kelas PTE <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`https://wa.me/6282116859493?text=${encodeURIComponent("Halo Linguo, saya mau tanya soal kelas persiapan PTE Academic.")}`}
                target="_blank"
                rel="noopener"
                className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white"
              >
                Tanya lewat WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
