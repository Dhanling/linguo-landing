"use client";

// linguo-patch:watch-learn-landing-v2 — redesign halaman intro Watch & Learn.
// Kerangka halaman mengikuti pola landing produk modern ala Lingopie: hero besar
// + mockup produk yang hidup, deretan bendera bahasa, penjelasan fitur berselang
// (teks ↔ mockup), kartu jenis konten, harga, FAQ akordeon, lalu CTA penutup.
// Semua mockup digambar pakai CSS (bukan screenshot) supaya ringan & selalu ikut
// perubahan brand.

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  BookOpen,
  Check,
  ChevronDown,
  Clapperboard,
  Languages,
  Layers,
  Menu,
  Mic,
  MousePointerClick,
  Music,
  Newspaper,
  Play,
  Plus,
  ScrollText,
  Sparkles,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { RectFlag } from "@/components/RectFlag";
import { IMMERSION_LANGS } from "@/lib/immersion";
import { BASE_LANGS, WATCH_PLANS } from "@/lib/immersionLearn";

const LANG_COUNT = IMMERSION_LANGS.length;

const NAV_LINKS = [
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#fitur", label: "Fitur" },
  { href: "#bahasa", label: "Bahasa" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

/* ══════════════════════════════════════════════════════════════════════════ */
/* Navbar                                                                     */
/* ══════════════════════════════════════════════════════════════════════════ */

function TopBar() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? "bg-white/85 backdrop-blur-xl border-b border-slate-900/5 shadow-[0_1px_20px_rgba(15,23,42,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 lg:h-[70px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/images/full-logo-linguo-hijau.png"
            alt="Linguo"
            width={158}
            height={56}
            className="h-8 w-auto object-contain"
          />
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#1A9E9E]/10 px-2.5 py-1 text-[11px] font-bold text-[#14807f]">
            <Play className="h-3 w-3" fill="currentColor" /> Watch &amp; Learn
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-900/5 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/watch"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 sm:px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors active:scale-95"
          >
            Mulai gratis <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="lg:hidden h-10 w-10 grid place-items-center rounded-full text-slate-700 hover:bg-slate-900/5"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-900/5 bg-white/95 backdrop-blur-xl px-5 py-3">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-2 py-3 text-[15px] font-semibold text-slate-700 border-b border-slate-100 last:border-0"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Mockup player — bintang utama hero                                          */
/* ══════════════════════════════════════════════════════════════════════════ */

const MOCK_WORDS = ["¿Por", "qué", "me", "regalas", "algo", "hoy?"];

function PlayerMock() {
  return (
    <div className="relative select-none">
      {/* kilau di belakang bingkai */}
      <div className="wl-glow pointer-events-none absolute -inset-10 rounded-[3rem] bg-[radial-gradient(55%_55%_at_50%_45%,rgba(26,158,158,0.38),transparent_72%)] blur-2xl" />

      <div className="relative rounded-[26px] bg-[#0B0E0F] p-2.5 shadow-[0_30px_80px_-20px_rgba(11,14,15,0.55)] ring-1 ring-white/10">
        <div className="relative aspect-video overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#1d3b42_0%,#122a30_45%,#0d1719_100%)]">
          {/* "adegan" abstrak */}
          <div className="absolute -left-10 top-4 h-40 w-40 rounded-full bg-[#1A9E9E]/25 blur-3xl" />
          <div className="absolute right-2 -top-6 h-36 w-36 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* chip kiri atas */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md ring-1 ring-white/15">
              <RectFlag code="es" h={11} /> Spanyol
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[10px] font-bold text-emerald-200 backdrop-blur-md ring-1 ring-emerald-300/25">
              <Zap className="h-3 w-3" /> Terjemahan siap
            </span>
          </div>

          {/* kartu arti kata */}
          <div className="wl-float absolute right-2.5 top-9 sm:right-6 sm:top-14 w-[150px] sm:w-[184px] rounded-2xl bg-white p-2.5 sm:p-3 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-heading text-[15px] font-extrabold text-slate-900">regalas</span>
              <span className="rounded-md bg-[#1A9E9E]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#14807f]">
                VERBA
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-slate-500">
              kamu memberi (hadiah) — <span className="text-slate-400">dari</span> regalar
            </p>
            {/* tombol disembunyikan di layar kecil supaya kartu tak menimpa subtitle */}
            <div className="mt-2.5 hidden sm:flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">
                <Volume2 className="h-3 w-3" /> Dengar
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1A9E9E]/10 px-2 py-1 text-[10px] font-bold text-[#14807f]">
                <Plus className="h-3 w-3" /> Simpan
              </span>
            </div>
          </div>

          {/* subtitle interaktif */}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-11 sm:px-6 sm:pb-12">
            <p className="wl-karaoke font-heading text-[17px] sm:text-2xl font-extrabold leading-snug text-white/90">
              {MOCK_WORDS.map((w, i) => (
                <span
                  key={w}
                  style={{ "--wl-i": i } as React.CSSProperties}
                  className="inline-block mr-1.5"
                >
                  {w}
                </span>
              ))}
            </p>
            <p className="mt-1 text-[12px] sm:text-[15px] font-medium text-[#7fe3e0]">
              Kenapa kamu kasih aku sesuatu hari ini?
            </p>
          </div>

          {/* kontrol player */}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-3 sm:px-5">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/20">
              <div className="wl-progress h-full rounded-full bg-white" style={{ width: "42%" }} />
            </div>
            <div className="mt-2 flex items-center gap-3 text-white/80">
              <Play className="h-3.5 w-3.5" fill="currentColor" />
              <span className="text-[10px] font-semibold tabular-nums">1:12 / 3:04</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold">
                <MousePointerClick className="h-3.5 w-3.5" /> ketuk kata apa pun
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* notifikasi flashcard */}
      <div className="wl-float-slow absolute -bottom-10 -left-2 sm:-left-14 flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-xl ring-1 ring-black/5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-600">
          <Layers className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="text-[12px] font-bold text-slate-900">+1 kartu tersimpan</p>
          <p className="text-[11px] text-slate-400">Deck “Spanyol harian”</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Hero                                                                        */
/* ══════════════════════════════════════════════════════════════════════════ */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F7FBFB] pt-24 pb-14 lg:pt-32 lg:pb-20">
      <div className="pointer-events-none absolute -left-40 -top-24 h-[420px] w-[420px] rounded-full bg-[#1A9E9E]/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-16 h-[380px] w-[380px] rounded-full bg-amber-200/35 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 grid lg:grid-cols-[1.02fr_1fr] gap-12 lg:gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-900/5">
            <Sparkles className="h-3.5 w-3.5 text-[#1A9E9E]" />
            Belajar dari video asli, bukan buku latihan
          </span>

          <h1 className="mt-5 font-heading text-[2.1rem] sm:text-5xl lg:text-[3.6rem] font-extrabold leading-[1.06] tracking-tight text-slate-900">
            Tonton yang kamu suka.
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">Ketuk kata apa pun.</span>
              <span className="absolute inset-x-0 bottom-1 z-0 h-3 sm:h-4 rounded-full bg-[#1A9E9E]/25" />
            </span>
            <br />
            Bahasanya jadi masuk.
          </h1>

          <p className="mt-5 max-w-xl text-[15px] sm:text-lg leading-relaxed text-slate-500">
            Watch &amp; Learn mengubah video YouTube favoritmu jadi kelas bahasa: subtitle
            interaktif dua baris, arti kata sekali ketuk, pengucapan asli, dan flashcard
            yang tersusun sendiri. {LANG_COUNT} bahasa, semuanya di satu layar.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/watch"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A9E9E] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-[#1A9E9E]/25 hover:bg-[#178f8f] transition-all active:scale-95"
            >
              Mulai gratis <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#cara-kerja"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-bold text-slate-800 ring-1 ring-slate-900/10 hover:ring-slate-900/20 transition-all"
            >
              <Play className="h-4 w-4" fill="currentColor" /> Lihat cara kerjanya
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#1A9E9E]" /> Nonton &amp; subtitle gratis
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#1A9E9E]" /> Tanpa kartu kredit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#1A9E9E]" /> Progres tersimpan
            </span>
          </div>
        </div>

        <div className="lg:pl-4">
          <PlayerMock />
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Deretan bendera bahasa                                                      */
/* ══════════════════════════════════════════════════════════════════════════ */

function LangMarquee() {
  const half = Math.ceil(IMMERSION_LANGS.length / 2);
  const rows = [IMMERSION_LANGS.slice(0, half), IMMERSION_LANGS.slice(half)];

  return (
    <section id="bahasa" className="relative bg-white py-12 lg:py-16 overflow-hidden">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <h2 className="font-heading text-2xl sm:text-[2rem] font-extrabold text-slate-900">
          {LANG_COUNT} bahasa siap ditonton
        </h2>
        <p className="mt-2.5 text-slate-500 text-[15px]">
          Dari Spanyol dan Jepang sampai Georgia, Swahili, dan bahasa daerah. Terjemahannya
          bisa kamu baca dalam {BASE_LANGS.length} bahasa — default Bahasa Indonesia.
        </p>
      </div>

      <div className="relative mt-9 space-y-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent" />
        {rows.map((row, ri) => (
          <div key={ri} className="flex overflow-hidden">
            <div
              className={`flex shrink-0 gap-2.5 pr-2.5 ${
                ri === 0 ? "animate-marquee" : "animate-marquee-slow"
              }`}
            >
              {[...row, ...row].map((l, i) => (
                <span
                  key={`${l.code}-${i}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-100 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm"
                >
                  <RectFlag code={l.country} h={16} />
                  {l.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Cara kerja — 3 langkah                                                      */
/* ══════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  {
    n: "01",
    title: "Pilih bahasa & video",
    desc: "Buka katalog per bahasa, cari topik yang kamu suka, atau tempel link YouTube-mu sendiri.",
    mock: <StepMockCatalog />,
  },
  {
    n: "02",
    title: "Nonton sambil ketuk",
    desc: "Subtitle bahasa target + terjemahan tampil bareng. Ketuk kata untuk arti, contoh, dan pengucapannya.",
    mock: <StepMockSubtitle />,
  },
  {
    n: "03",
    title: "Ulang sampai nempel",
    desc: "Kata yang kamu simpan otomatis jadi deck flashcard dengan pengulangan berjarak (SRS) dan kuis.",
    mock: <StepMockDeck />,
  },
];

function StepMockCatalog() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {["from-[#1A9E9E] to-[#0f6f6f]", "from-amber-400 to-orange-500", "from-rose-400 to-rose-600", "from-indigo-400 to-indigo-600", "from-emerald-400 to-emerald-600", "from-slate-400 to-slate-600"].map(
        (g, i) => (
          <div key={i} className={`aspect-video rounded-lg bg-gradient-to-br ${g} opacity-90`} />
        )
      )}
    </div>
  );
}

function StepMockSubtitle() {
  return (
    <div className="rounded-xl bg-[#0B0E0F] p-3">
      <p className="font-heading text-[13px] font-extrabold text-white/90">
        Je <span className="rounded bg-[#1A9E9E] px-1 text-white">voudrais</span> un café
      </p>
      <p className="mt-1 text-[11px] font-medium text-[#7fe3e0]">Saya mau kopi</p>
      <div className="mt-2 rounded-lg bg-white p-2">
        <p className="text-[11px] font-bold text-slate-900">voudrais</p>
        <p className="text-[10px] text-slate-500">saya ingin — kondisional sopan</p>
      </div>
    </div>
  );
}

function StepMockDeck() {
  return (
    <div className="relative h-[104px]">
      <div className="absolute inset-x-6 top-3 h-16 rounded-xl bg-slate-100" />
      <div className="absolute inset-x-3 top-1.5 h-16 rounded-xl bg-slate-200" />
      <div className="absolute inset-x-0 top-0 rounded-xl bg-white p-3 shadow-lg ring-1 ring-slate-900/5">
        <p className="font-heading text-[15px] font-extrabold text-slate-900">お土産</p>
        <p className="text-[11px] text-slate-400">omiyage</p>
        <p className="mt-1 text-[12px] font-semibold text-[#14807f]">oleh-oleh</p>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="cara-kerja" className="bg-[#F7FBFB] py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#1A9E9E]">
            Cara kerja
          </span>
          <h2 className="mt-3 font-heading text-2xl sm:text-[2.4rem] font-extrabold leading-tight text-slate-900">
            Tiga langkah, lalu tinggal nonton
          </h2>
        </Reveal>

        <div className="mt-11 grid md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="h-full rounded-3xl border border-slate-900/5 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-xl hover:shadow-slate-900/5 transition-shadow">
                <div className="rounded-2xl bg-slate-50 p-3">{s.mock}</div>
                <div className="mt-5 flex items-center gap-2.5">
                  <span className="font-heading text-[13px] font-extrabold text-[#1A9E9E]">{s.n}</span>
                  <span className="h-px flex-1 bg-slate-100" />
                </div>
                <h3 className="mt-2.5 font-heading text-lg font-extrabold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Fitur — baris berselang teks ↔ mockup                                       */
/* ══════════════════════════════════════════════════════════════════════════ */

function MockTranscript() {
  const lines = [
    { t: "Ich habe gestern einen Film gesehen.", b: "Kemarin aku nonton film." },
    { t: "Worum ging es denn?", b: "Tentang apa filmnya?" },
    { t: "Um eine Reise nach Island.", b: "Tentang perjalanan ke Islandia." },
  ];
  return (
    <div className="rounded-3xl bg-[#0B0E0F] p-4 sm:p-5 ring-1 ring-white/10">
      <div className="flex items-center gap-2 pb-3">
        <RectFlag code="de" h={14} />
        <span className="text-[12px] font-bold text-white/80">Transkrip</span>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">
          B1
        </span>
      </div>
      <div className="space-y-1.5">
        {lines.map((l, i) => (
          <div
            key={l.t}
            className={`rounded-xl px-3 py-2.5 ${
              i === 1 ? "bg-[#1A9E9E]/18 ring-1 ring-[#1A9E9E]/40" : "bg-white/[0.04]"
            }`}
          >
            <p
              className={`text-[13px] sm:text-[15px] font-bold ${
                i === 1 ? "text-white" : "text-white/60"
              }`}
            >
              {l.t}
            </p>
            <p className={`text-[11px] sm:text-[13px] ${i === 1 ? "text-[#7fe3e0]" : "text-white/35"}`}>
              {l.b}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockWordCard() {
  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 ring-1 ring-slate-900/5 shadow-xl shadow-slate-900/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-2xl font-extrabold text-slate-900">映画</p>
          <p className="text-[13px] text-slate-400">eiga</p>
        </div>
        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white">
          NOMINA
        </span>
      </div>
      <p className="mt-2 text-[15px] font-bold text-[#14807f]">film, bioskop</p>
      <div className="mt-3 rounded-2xl bg-slate-50 p-3">
        <p className="text-[13px] font-semibold text-slate-700">映画を見ました。</p>
        <p className="text-[12px] text-slate-400">Saya menonton film.</p>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-slate-900 py-2 text-[12px] font-bold text-white">
          <Volume2 className="h-3.5 w-3.5" /> Dengar
        </span>
        <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1A9E9E]/10 py-2 text-[12px] font-bold text-[#14807f]">
          <Plus className="h-3.5 w-3.5" /> Simpan
        </span>
      </div>
    </div>
  );
}

function MockAnalysis() {
  const chips = [
    { w: "우리", t: "kami" },
    { w: "같이", t: "bersama" },
    { w: "갈까요?", t: "mau pergi?" },
  ];
  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 ring-1 ring-slate-900/5 shadow-xl shadow-slate-900/5">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#1A9E9E]/10 text-[#14807f]">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-[13px] font-bold text-slate-900">Analisa kalimat</span>
      </div>
      <p className="mt-3 font-heading text-lg font-extrabold text-slate-900">우리 같이 갈까요?</p>
      <p className="text-[13px] text-slate-500">Kita pergi bareng, yuk?</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c.w}
            className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-900/5"
          >
            {c.w} <span className="text-slate-400">· {c.t}</span>
          </span>
        ))}
      </div>
      <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-[12.5px] leading-relaxed text-amber-900">
        Akhiran <b>-ㄹ까요?</b> dipakai buat mengajak atau menawarkan sesuatu dengan sopan.
      </p>
    </div>
  );
}

function MockQuiz() {
  return (
    <div className="rounded-3xl bg-[#0B0E0F] p-4 sm:p-5 ring-1 ring-white/10">
      <div className="flex items-center justify-between text-[11px] font-bold text-white/60">
        <span>Kuis arti kata</span>
        <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-300">Skor 320</span>
      </div>
      <p className="mt-3 font-heading text-xl font-extrabold text-white">merienda</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { t: "camilan sore", ok: true },
          { t: "sarapan", ok: false },
          { t: "tagihan", ok: false },
          { t: "pelayan", ok: false },
        ].map((o) => (
          <span
            key={o.t}
            className={`rounded-xl px-3 py-2.5 text-[12.5px] font-semibold ${
              o.ok
                ? "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/40"
                : "bg-white/[0.05] text-white/55"
            }`}
          >
            {o.t}
          </span>
        ))}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#1A9E9E] to-emerald-400" />
      </div>
    </div>
  );
}

const FEATURE_ROWS = [
  {
    tag: "Transkrip interaktif",
    icon: ScrollText,
    title: "Subtitle dua baris yang bisa kamu klik",
    desc:
      "Baris atas bahasa target, baris bawah terjemahannya. Kalimat yang sedang diucapkan tersorot otomatis — klik kalimat mana pun untuk melompat ke detiknya.",
    points: ["Sorotan kata mengikuti audio", "Lompat balik satu kalimat", "Transliterasi untuk aksara non-Latin"],
    mock: <MockTranscript />,
  },
  {
    tag: "Arti kata instan",
    icon: MousePointerClick,
    title: "Ketuk satu kata, jangan buka kamus lagi",
    desc:
      "Setiap kata bisa diketuk: arti dalam konteks kalimat itu, kelas kata, contoh pakai, plus pengucapan suara natural. Frasa dan idiom dikenali sebagai satu kesatuan.",
    points: ["Arti sesuai konteks, bukan kamus mentah", "Pengucapan asli (TTS)", "Simpan jadi flashcard sekali ketuk"],
    mock: <MockWordCard />,
  },
  {
    tag: "Analisa AI",
    icon: Sparkles,
    title: "Bingung strukturnya? Tanya di tempat",
    desc:
      "Buka Analisa Kalimat untuk membedah kalimat yang sedang tayang: arti utuh, pecahan per bagian, dan pola grammar-nya. Masih penasaran — tanya langsung ke AI-nya.",
    points: ["Pecahan per bagian kalimat", "Penjelasan pola grammar", "Tanya AI lanjutan"],
    mock: <MockAnalysis />,
  },
  {
    tag: "Kosakata & kuis",
    icon: Layers,
    title: "Kata yang kamu simpan tidak menguap",
    desc:
      "Semua kata masuk ke Kosakata Saya dan deck flashcard dengan pengulangan berjarak. Ada kuis cepat bergaya permainan supaya mengulang tidak terasa seperti PR.",
    points: ["Deck otomatis per video atau tema", "Pengulangan berjarak (SRS)", "Kuis arti kata bergamifikasi"],
    mock: <MockQuiz />,
  },
];

function Features() {
  return (
    <section id="fitur" className="bg-white py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#1A9E9E]">Fitur</span>
          <h2 className="mt-3 font-heading text-2xl sm:text-[2.4rem] font-extrabold leading-tight text-slate-900">
            Bukan sekadar nonton dengan subtitle
          </h2>
          <p className="mt-3 text-[15px] text-slate-500">
            Setiap bagian dirancang buat satu hal: mengubah menit menonton jadi kosakata yang
            benar-benar kamu ingat.
          </p>
        </Reveal>

        <div className="mt-14 space-y-16 lg:space-y-24">
          {FEATURE_ROWS.map((f, i) => (
            <div
              key={f.tag}
              className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center"
            >
              <Reveal className={i % 2 === 1 ? "lg:order-2" : ""}>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#1A9E9E]/10 px-3 py-1.5 text-[12px] font-bold text-[#14807f]">
                  <f.icon className="h-3.5 w-3.5" /> {f.tag}
                </span>
                <h3 className="mt-4 font-heading text-xl sm:text-3xl font-extrabold leading-tight text-slate-900">
                  {f.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-500">{f.desc}</p>
                <ul className="mt-5 space-y-2.5">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[14.5px] text-slate-700">
                      <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#1A9E9E]/15 text-[#14807f]">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.08} className={i % 2 === 1 ? "lg:order-1" : ""}>
                {f.mock}
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Jenis konten                                                                */
/* ══════════════════════════════════════════════════════════════════════════ */

const CONTENT_TYPES = [
  { icon: Music, label: "Musik & lirik", grad: "from-rose-500 to-pink-600" },
  { icon: Clapperboard, label: "Klip film & serial", grad: "from-indigo-500 to-violet-600" },
  { icon: Newspaper, label: "Berita harian", grad: "from-sky-500 to-blue-600" },
  { icon: Mic, label: "Podcast & wawancara", grad: "from-amber-500 to-orange-600" },
  { icon: Baby, label: "Konten anak", grad: "from-emerald-500 to-teal-600" },
  { icon: BookOpen, label: "Vlog & keseharian", grad: "from-[#1A9E9E] to-[#0f6f6f]" },
];

const LEVELS = [
  { code: "A1–A2", title: "Pemula", desc: "Kalimat pendek, tempo pelan, kosakata harian." },
  { code: "B1–B2", title: "Menengah", desc: "Percakapan natural, topik sehari-hari sampai berita." },
  { code: "C1+", title: "Mahir", desc: "Tempo penutur asli, idiom, dan bahasan spesifik." },
];

function ContentAndLevels() {
  return (
    <section className="relative overflow-hidden bg-[#0B0E0F] py-16 lg:py-24 text-white">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#1A9E9E]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-6">
        <Reveal className="max-w-2xl">
          <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#7fe3e0]">
            Katalog
          </span>
          <h2 className="mt-3 font-heading text-2xl sm:text-[2.4rem] font-extrabold leading-tight">
            Konten asli yang memang kamu tonton
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            Katalog Watch &amp; Learn diisi video pendek yang dikurasi per bahasa — plus kamu
            bebas menempel link YouTube sendiri. Tab <b className="text-white/80">Terjemahan Siap</b>{" "}
            menandai video yang transkripnya sudah jadi, jadi langsung terbuka tanpa antre.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CONTENT_TYPES.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.05}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 transition-colors hover:bg-white/[0.06]">
                <span
                  className={`inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${c.grad} shadow-lg`}
                >
                  <c.icon className="h-5 w-5" />
                </span>
                <p className="mt-3.5 text-[14.5px] font-bold">{c.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-3.5">
          {LEVELS.map((l, i) => (
            <Reveal key={l.code} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5">
                <span className="inline-flex rounded-lg bg-[#1A9E9E] px-2.5 py-1 text-[11px] font-extrabold">
                  {l.code}
                </span>
                <p className="mt-3 font-heading text-lg font-extrabold">{l.title}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-white/50">{l.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* Harga                                                                       */
/* ══════════════════════════════════════════════════════════════════════════ */

function Pricing() {
  const [planId, setPlanId] = useState<(typeof WATCH_PLANS)[number]["id"]>("annual");
  const plan = WATCH_PLANS.find((p) => p.id === planId)!;

  return (
    <section id="harga" className="bg-[#F7FBFB] py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#1A9E9E]">Harga</span>
          <h2 className="mt-3 font-heading text-2xl sm:text-[2.4rem] font-extrabold leading-tight text-slate-900">
            Nonton gratis. Bayar cuma kalau mau lebih dalam.
          </h2>
        </Reveal>

        <div className="mt-11 grid lg:grid-cols-2 gap-5 items-stretch">
          {/* Gratis */}
          <Reveal>
            <div className="h-full rounded-3xl border border-slate-900/5 bg-white p-6 sm:p-7">
              <p className="font-heading text-lg font-extrabold text-slate-900">Gratis</p>
              <p className="mt-1 text-[14px] text-slate-500">Cukup login, tanpa kartu kredit.</p>
              <p className="mt-5 font-heading text-4xl font-extrabold text-slate-900">Rp0</p>
              <ul className="mt-6 space-y-3">
                {[
                  `Semua ${LANG_COUNT} bahasa & seluruh katalog`,
                  "Subtitle target + terjemahan tanpa batas",
                  "Transliterasi aksara non-Latin",
                  "Cicip arti kata & Analisa beberapa kali",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[14.5px] text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1A9E9E]" strokeWidth={3} />
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/watch"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-[15px] font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Mulai nonton
              </Link>
            </div>
          </Reveal>

          {/* Berlangganan */}
          <Reveal delay={0.08}>
            <div className="relative h-full overflow-hidden rounded-3xl bg-[#0B0E0F] p-6 sm:p-7 text-white ring-1 ring-white/10">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#1A9E9E]/30 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-lg font-extrabold">Watch &amp; Learn Premium</p>
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-slate-900">
                    POPULER
                  </span>
                </div>
                <p className="mt-1 text-[14px] text-white/55">
                  Arti kata &amp; Analisa kalimat tanpa batas.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {WATCH_PLANS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanId(p.id)}
                      className={`rounded-xl px-2 py-2.5 text-center transition-all ${
                        planId === p.id
                          ? "bg-[#1A9E9E] text-white shadow-lg shadow-[#1A9E9E]/25"
                          : "bg-white/[0.06] text-white/60 hover:bg-white/10"
                      }`}
                    >
                      <span className="block text-[12.5px] font-bold">{p.label}</span>
                      {p.savePct ? (
                        <span
                          className={`block text-[10px] font-bold ${
                            planId === p.id ? "text-white/80" : "text-emerald-300"
                          }`}
                        >
                          hemat {p.savePct}%
                        </span>
                      ) : (
                        <span className="block text-[10px] text-transparent">-</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex items-end gap-2">
                  <span className="font-heading text-4xl font-extrabold">{rupiah(plan.price)}</span>
                  <span className="pb-1.5 text-[13px] text-white/50">/ {plan.label.toLowerCase()}</span>
                </div>
                <p className="mt-1 text-[13px] text-white/45">
                  ≈ {rupiah(plan.perMonth)} per bulan
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    "Semua yang ada di paket gratis",
                    "Arti kata sekali ketuk tanpa batas",
                    "Analisa kalimat + Tanya AI",
                    "Flashcard, deck, & kuis kosakata",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-[14.5px] text-white/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7fe3e0]" strokeWidth={3} />
                      {t}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/watch"
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1A9E9E] px-6 py-3.5 text-[15px] font-bold text-white hover:bg-[#178f8f] transition-colors"
                >
                  Coba dulu, gratis <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-center text-[12px] text-white/40">
                  Punya kode promo? Bisa dipakai saat checkout.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* FAQ                                                                         */
/* ══════════════════════════════════════════════════════════════════════════ */

const FAQS = [
  {
    q: "Videonya dari mana?",
    a: "Dari YouTube. Setiap bahasa punya katalog video pendek yang sudah dikurasi per kategori dan level, dan kamu juga bebas menempel link YouTube sendiri untuk ditonton dengan transkrip interaktif.",
  },
  {
    q: "Bahasa apa saja yang tersedia?",
    a: `Ada ${LANG_COUNT} bahasa target — dari Inggris, Jepang, Korea, Mandarin, dan bahasa-bahasa Eropa, sampai Georgia, Swahili, Khmer, serta Jawa dan Sunda. Baris terjemahannya bisa kamu baca dalam ${BASE_LANGS.length} bahasa, default Bahasa Indonesia.`,
  },
  {
    q: "Harus bayar untuk mulai?",
    a: "Tidak. Nonton, subtitle bahasa target, dan terjemahannya gratis tanpa batas — cukup login. Langganan hanya dibutuhkan kalau kamu mau membuka arti kata dan Analisa kalimat tanpa batas.",
  },
  {
    q: "Subtitle otomatisnya seakurat apa?",
    a: "Transkrip disusun ulang jadi kalimat utuh dengan tanda baca, bukan potongan caption mentah, lalu diterjemahkan per kalimat. Video di tab “Terjemahan Siap” sudah diproses penuh sehingga langsung terbuka instan.",
  },
  {
    q: "Bisa dipakai di HP?",
    a: "Bisa. Watch & Learn jalan langsung di browser HP maupun laptop, tanpa perlu memasang aplikasi. Progres kosakata tersimpan di akunmu.",
  },
  {
    q: "Kosakata yang saya simpan disimpan di mana?",
    a: "Di halaman Kosakata Saya, lengkap dengan deck flashcard, penanda kata yang sudah dikuasai, dan kuis untuk mengulang.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-white py-16 lg:py-24">
      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        <Reveal className="text-center">
          <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#1A9E9E]">FAQ</span>
          <h2 className="mt-3 font-heading text-2xl sm:text-[2.4rem] font-extrabold leading-tight text-slate-900">
            Pertanyaan yang sering muncul
          </h2>
        </Reveal>

        <div className="mt-10 divide-y divide-slate-100 rounded-3xl border border-slate-900/5 bg-white">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-4.5 text-left sm:px-6"
                  aria-expanded={isOpen}
                >
                  <span className="flex-1 text-[15px] font-bold text-slate-900">{f.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180 text-[#1A9E9E]" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-[14.5px] leading-relaxed text-slate-500 sm:px-6">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* CTA penutup + footer                                                        */
/* ══════════════════════════════════════════════════════════════════════════ */

function FinalCta() {
  return (
    <section className="bg-white px-5 pb-16 sm:px-6 lg:pb-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-[#1A9E9E] px-6 py-14 text-center text-white sm:px-12">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative">
          <h2 className="font-heading text-2xl sm:text-[2.5rem] font-extrabold leading-tight">
            Video berikutnya bisa jadi pelajaran berikutnya
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/85">
            Login sebentar, pilih bahasa, lalu tinggal tekan play. Kosakata dan progresmu
            tersimpan otomatis.
          </p>
          <Link
            href="/watch"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-[#14807f] shadow-lg transition-all hover:bg-slate-50 active:scale-95"
          >
            Mulai gratis sekarang <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4" /> Tanpa kartu kredit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4" /> {LANG_COUNT} bahasa
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Languages className="h-4 w-4" /> Terjemahan Bahasa Indonesia
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-900/5 bg-[#F7FBFB] py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-5 sm:px-6 md:flex-row md:justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/full-logo-linguo-hijau.png"
            alt="Linguo"
            width={158}
            height={56}
            className="h-8 w-auto object-contain"
          />
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px] font-semibold text-slate-500">
          <Link href="/watch" className="hover:text-slate-900">
            Buka Watch &amp; Learn
          </Link>
          <Link href="/harga" className="hover:text-slate-900">
            Kelas Linguo
          </Link>
          <Link href="/blog" className="hover:text-slate-900">
            Blog
          </Link>
          <Link href="/syarat-ketentuan" className="hover:text-slate-900">
            Syarat &amp; Ketentuan
          </Link>
          <Link href="/privacy" className="hover:text-slate-900">
            Privasi
          </Link>
        </nav>
        <p className="text-[13px] text-slate-400">© {new Date().getFullYear()} Linguo.id</p>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */

export default function WatchLearnClient() {
  return (
    <main className="min-h-screen bg-white">
      <TopBar />
      <Hero />
      <LangMarquee />
      <HowItWorks />
      <Features />
      <ContentAndLevels />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
