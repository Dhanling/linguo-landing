import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Simulasi TOEFL & IELTS dengan Penilaian AI | Linguo.id",
  description:
    "Latihan simulasi tes TOEFL iBT & IELTS lengkap: Reading, Listening, Writing, dan Speaking. Jawaban Writing & Speaking dinilai otomatis oleh AI dengan feedback detail. Coba gratis di Linguo.id.",
  alternates: { canonical: "https://linguo.id/simulasi" },
};

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";

const SKILLS = [
  { icon: "📖", title: "Reading", desc: "Passage akademik dengan soal pilihan ganda, True/False/Not Given, dan matching. Dinilai otomatis." },
  { icon: "🎧", title: "Listening", desc: "Audio asli dengan beragam tipe soal. Skor langsung keluar begitu selesai." },
  { icon: "✍️", title: "Writing", desc: "Tulis esai sesuai task. AI menilai sesuai kriteria resmi + feedback perbaikan." },
  { icon: "🎤", title: "Speaking", desc: "Rekam jawaban via mikrofon. AI mentranskrip & menilai fluency, grammar, dan kosakata." },
];

const STEPS = [
  { n: "1", title: "Masuk ke akun", desc: "Login atau daftar gratis di Linguo.id." },
  { n: "2", title: "Pilih simulasi", desc: "Pilih paket TOEFL atau IELTS yang ingin dikerjakan." },
  { n: "3", title: "Kerjakan & rekam", desc: "Jawab soal Reading/Listening, tulis Writing, rekam Speaking." },
  { n: "4", title: "Dapat skor & feedback AI", desc: "Lihat skor lengkap plus saran perbaikan dari AI." },
];

export default function SimulasiLandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
        <div className="mx-auto max-w-5xl px-5 py-20 text-center text-white sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">
            ✨ Baru · Dinilai oleh AI
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
            Simulasi TOEFL &amp; IELTS<br />dengan Penilaian AI
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
            Latihan tes lengkap — Reading, Listening, Writing, dan Speaking — persis seperti tes asli.
            Writing &amp; Speaking dinilai otomatis oleh AI lengkap dengan feedback perbaikan.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/akun/simulasi" className="rounded-full bg-[#FFC93C] px-7 py-3 text-sm font-bold text-slate-900 transition hover:bg-[#f5bb1f]">
              Mulai Simulasi Gratis
            </Link>
            <Link href="/harga" className="rounded-full border-2 border-white/60 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10">
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
          {SKILLS.map((s) => (
            <div key={s.title} className="rounded-2xl border border-slate-200 p-6 transition hover:border-teal-300 hover:shadow-md">
              <div className="text-3xl">{s.icon}</div>
              <h3 className="mt-3 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
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

      {/* AI highlight */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-8 sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
            🤖 Penilaian AI
          </span>
          <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Feedback instan untuk Writing &amp; Speaking</h2>
          <p className="mt-3 text-slate-600">
            Tidak perlu menunggu guru mengoreksi. AI menilai esai dan rekaman bicaramu berdasarkan kriteria
            resmi TOEFL/IELTS — memberi skor per kriteria dan saran konkret untuk meningkatkan band-mu.
          </p>
          <Link href="/akun/simulasi" className="mt-6 inline-flex rounded-full px-7 py-3 text-sm font-bold text-white" style={{ background: TEAL_DEEP }}>
            Coba Sekarang →
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 text-center">
        <div className="mx-auto max-w-2xl px-5">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Siap menaklukkan tesmu?</h2>
          <p className="mt-2 text-slate-500">Mulai latihan sekarang, gratis. Butuh bimbingan intensif? Cek kelas persiapan kami.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/akun/simulasi" className="rounded-full px-7 py-3 text-sm font-bold text-white" style={{ background: TEAL }}>
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
