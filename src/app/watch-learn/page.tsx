import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  MonitorPlay,
  Languages,
  Volume2,
  Layers,
  Zap,
  ScrollText,
  ArrowRight,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Watch & Learn — Belajar Bahasa dari Video yang Kamu Suka | Linguo.id",
  description:
    "Tonton video YouTube favoritmu dalam 16+ bahasa lengkap dengan transkrip interaktif, terjemahan instan, pengucapan asli, dan flashcard otomatis. Coba sekarang, cukup login.",
  alternates: { canonical: "https://linguo.id/watch-learn" },
};

// Fitur utama Watch & Learn — dipakai untuk grid di halaman intro.
const FEATURES = [
  {
    icon: ScrollText,
    title: "Transkrip Interaktif",
    desc: "Subtitle kalimat per kalimat yang bisa kamu klik. Ketuk kata apa pun untuk lihat arti & contoh pakainya.",
  },
  {
    icon: Languages,
    title: "Terjemahan Instan",
    desc: "Setiap baris langsung diterjemahkan ke bahasa Indonesia — paham konteks tanpa buka kamus terpisah.",
  },
  {
    icon: Volume2,
    title: "Dengar Pengucapan Asli",
    desc: "Putar ulang tiap kata atau kalimat dengan suara natural (TTS) biar telinga & lidahmu ikut terlatih.",
  },
  {
    icon: Layers,
    title: "Flashcard & Deck Otomatis",
    desc: "Simpan kosakata baru sambil nonton. Kata-kata tersusun jadi deck flashcard siap kamu ulang kapan saja.",
  },
  {
    icon: Zap,
    title: "Tab “Terjemahan Siap”",
    desc: "Video yang transkripnya sudah tersedia langsung terbuka instan — tanpa nunggu proses.",
  },
  {
    icon: MonitorPlay,
    title: "16+ Bahasa, Konten Nyata",
    desc: "Film, musik, berita, sampai vlog. Belajar dari konten asli yang memang kamu suka tonton.",
  },
];

const STEPS = [
  { n: "1", title: "Pilih bahasa & video", desc: "Tentukan bahasa target, lalu pilih video dari katalog atau tempel link YouTube." },
  { n: "2", title: "Tonton dengan transkrip", desc: "Baca subtitle interaktif, ketuk kata untuk arti, dengar pengucapannya." },
  { n: "3", title: "Kumpulkan & ulang", desc: "Simpan kosakata jadi flashcard dan ulang sampai nempel di kepala." },
];

export default function WatchLearnIntroPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="bg-[#1A9E9E]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/images/logo-white.png" alt="Linguo" width={158} height={56} className="h-9 w-auto object-contain" />
          </Link>
          <Link
            href="/watch"
            className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-5 py-2.5 rounded-full text-sm transition-all"
          >
            Coba Sekarang
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#1A9E9E] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-16 lg:pt-16 lg:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              <MonitorPlay className="w-4 h-4" /> Watch &amp; Learn
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-[3.2rem] font-extrabold leading-[1.1] mb-5">
              Belajar Bahasa dari<br />Video yang Kamu Suka
            </h1>
            <p className="text-white/90 text-base sm:text-lg leading-relaxed max-w-xl mb-7">
              Ubah waktu nonton YouTube jadi sesi belajar. Tonton konten asli dalam 16+ bahasa,
              lengkap dengan transkrip interaktif, terjemahan instan, dan flashcard otomatis —
              semuanya di satu layar.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/watch"
                className="inline-flex items-center gap-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-7 py-3.5 rounded-full text-base transition-all active:scale-95"
              >
                Coba Sekarang <ArrowRight className="w-5 h-5" />
              </Link>
              <span className="text-white/80 text-sm">Gratis — cukup login dulu.</span>
            </div>
          </div>
          <div className="relative hidden lg:flex justify-center">
            <Image
              src="/images/hero-character.png"
              alt="Belajar bahasa dari video bersama Linguo"
              width={520}
              height={420}
              className="w-full max-w-md h-auto object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
            Semua yang kamu butuh untuk belajar dari video
          </h2>
          <p className="text-slate-500 text-base">
            Bukan sekadar nonton — Watch &amp; Learn mengubah setiap video jadi materi belajar aktif.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 hover:border-[#1A9E9E]/40 hover:shadow-lg hover:shadow-[#1A9E9E]/5 transition-all"
            >
              <span className="w-11 h-11 rounded-xl bg-[#1A9E9E]/10 text-[#1A9E9E] flex items-center justify-center mb-4">
                <f.icon className="w-[22px] h-[22px]" />
              </span>
              <h3 className="font-bold text-slate-800 text-lg mb-1.5">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cara kerja */}
      <section className="bg-slate-50 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-12">
            Cukup 3 langkah
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#1A9E9E] text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-1.5">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA akhir */}
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <div className="rounded-3xl bg-[#1A9E9E] text-white text-center px-6 py-14 lg:px-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold mb-4">
            Siap belajar sambil nonton?
          </h2>
          <p className="text-white/90 text-base max-w-xl mx-auto mb-8">
            Login sebentar, lalu langsung mulai. Semua progres kosakata & video kamu tersimpan otomatis.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/watch"
              className="inline-flex items-center gap-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-4 rounded-full text-base transition-all active:scale-95"
            >
              Coba Sekarang <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/85 text-sm">
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> Gratis dicoba</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> 16+ bahasa</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> Progres tersimpan</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
