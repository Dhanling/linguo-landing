import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Headphones, PenLine, Mic, Sparkles, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Simulasi TOEFL & IELTS | Linguo.id",
  description:
    "Latihan simulasi tes TOEFL & IELTS lengkap: Reading, Listening, Writing, dan Speaking. Mulai Rp 79.000 di Linguo.id.",
  alternates: { canonical: "https://linguo.id/simulasi" },
};

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";

const SKILLS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: BookOpen, title: "Reading", desc: "Passage akademik dengan soal pilihan ganda, True/False/Not Given, dan matching. Dinilai otomatis." },
  { icon: Headphones, title: "Listening", desc: "Audio asli dengan beragam tipe soal. Skor langsung keluar begitu selesai." },
  { icon: PenLine, title: "Writing", desc: "Tulis esai sesuai task. AI menilai sesuai kriteria resmi + feedback perbaikan." },
  { icon: Mic, title: "Speaking", desc: "Rekam jawaban via mikrofon. AI mentranskrip & menilai fluency, grammar, dan kosakata." },
];

const STEPS = [
  { n: "1", title: "Pilih paket & bayar", desc: "Pilih simulasi TOEFL atau IELTS (Rp 79.000), bayar via Xendit." },
  { n: "2", title: "Login ke akun", desc: "Masuk dengan email yang sama — akses langsung terbuka." },
  { n: "3", title: "Kerjakan & rekam", desc: "Jawab soal Reading/Listening, tulis Writing, rekam Speaking." },
  { n: "4", title: "Dapat skor & feedback AI", desc: "Lihat skor lengkap plus saran perbaikan dari AI." },
];

export default function SimulasiLandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
        <div className="mx-auto max-w-5xl px-5 py-20 text-center text-white sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">
            <Sparkles className="h-4 w-4" /> Baru · Dinilai oleh AI
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
            Simulasi TOEFL &amp; IELTS
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
            Latihan tes lengkap — Reading, Listening, Writing, dan Speaking — persis seperti tes asli. Mulai Rp 79.000.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/simulasi/paket" className="rounded-full bg-[#FFC93C] px-7 py-3 text-sm font-bold text-slate-900 transition hover:bg-[#f5bb1f]">
              Mulai Simulasi
            </Link>
            <Link href="/simulasi/paket" className="rounded-full border-2 border-white/60 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10">
              Lihat Paket Persiapan
            </Link>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">4 Skill, satu simulasi</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">Latih semua bagian tes dalam satu sesi yang terstruktur.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SKILLS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-2xl border border-slate-200 p-6 transition hover:border-teal-300 hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "#E0F7F7", color: TEAL_DEEP }}>
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-3 font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Cara kerjanya</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: TEAL }}>
                  {s.n}
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 text-center">
        <div className="mx-auto max-w-2xl px-5">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Siap menaklukkan tesmu?</h2>
          <p className="mt-2 text-slate-500">Mulai latihan dari Rp 79.000. Butuh bimbingan intensif? Cek kelas persiapan kami.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/simulasi/paket" className="rounded-full px-7 py-3 text-sm font-bold text-white" style={{ background: TEAL }}>
              Mulai Simulasi
            </Link>
            <Link href="/jadwal-kelas-reguler?tab=etp" className="rounded-full border-2 border-slate-200 px-7 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              Jadwal Kelas IELTS/TOEFL
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
