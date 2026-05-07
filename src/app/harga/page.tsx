"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

// ── Data ─────────────────────────────────────────────────────────────────────

type LangEntry = { flag: string; name: string; cat: "A" | "B" | "C" | "D" | "E" };

// Sorted by demand (most popular first)
const LANGUAGES: LangEntry[] = [
  // C — paling diminati
  { flag: "🇬🇧", name: "English",          cat: "C" },
  { flag: "🇰🇷", name: "Korean",           cat: "C" },
  { flag: "🇯🇵", name: "Japanese",         cat: "C" },
  { flag: "🇨🇳", name: "Mandarin",         cat: "C" },
  { flag: "🇫🇷", name: "French",           cat: "C" },
  { flag: "🇩🇪", name: "German",           cat: "C" },
  { flag: "🇸🇦", name: "Arabic",           cat: "C" },
  // B — populer Eropa & Asia
  { flag: "🇪🇸", name: "Spanish",          cat: "B" },
  { flag: "🇮🇹", name: "Italian",          cat: "B" },
  { flag: "🇷🇺", name: "Russian",          cat: "B" },
  { flag: "🇳🇱", name: "Dutch",            cat: "B" },
  { flag: "🇹🇭", name: "Thai",             cat: "B" },
  { flag: "👌",   name: "Sign Language",   cat: "B" },
  // A — langka & Eropa
  { flag: "🇵🇹", name: "Portuguese",       cat: "A" },
  { flag: "🇻🇳", name: "Vietnamese",       cat: "A" },
  { flag: "🇮🇳", name: "Hindi",            cat: "A" },
  { flag: "🇹🇷", name: "Turkish",          cat: "A" },
  { flag: "🇵🇱", name: "Polish",           cat: "A" },
  { flag: "🇸🇪", name: "Swedish",          cat: "A" },
  { flag: "🇨🇿", name: "Czech",            cat: "A" },
  { flag: "🇫🇮", name: "Finnish",          cat: "A" },
  { flag: "🇬🇷", name: "Greek",            cat: "A" },
  { flag: "🇷🇴", name: "Romanian",         cat: "A" },
  { flag: "🇵🇭", name: "Tagalog",          cat: "A" },
  { flag: "🇳🇴", name: "Norwegian",        cat: "A" },
  { flag: "🇩🇰", name: "Danish",           cat: "A" },
  { flag: "🇮🇱", name: "Hebrew",           cat: "A" },
  { flag: "🇭🇺", name: "Hungarian",        cat: "A" },
  { flag: "🇲🇾", name: "Malay",            cat: "A" },
  { flag: "🇵🇰", name: "Urdu",             cat: "A" },
  { flag: "🇰🇭", name: "Khmer",            cat: "A" },
  { flag: "🇮🇷", name: "Farsi",            cat: "A" },
  { flag: "🇬🇧", name: "English British",  cat: "A" },
  { flag: "🇺🇿", name: "Uzbek",            cat: "A" },
  { flag: "🇷🇸", name: "Serbian",          cat: "A" },
  { flag: "🇪🇪", name: "Estonian",         cat: "A" },
  { flag: "🇹🇿", name: "Swahili",          cat: "A" },
  { flag: "🇹🇼", name: "Traditional Chinese", cat: "A" },
  { flag: "🇬🇪", name: "Georgian",         cat: "A" },
  { flag: "🇮🇪", name: "Irish",            cat: "A" },
  { flag: "🏴",   name: "Kurdish",          cat: "A" },
  { flag: "📜",   name: "Latin",            cat: "A" },
  { flag: "🇪🇬", name: "Ancient Egyptian", cat: "A" },
  { flag: "🌐",   name: "Esperanto",        cat: "A" },
  // D — Nusantara
  { flag: "🇮🇩", name: "Javanese",         cat: "D" },
  { flag: "🇮🇩", name: "Sundanese",        cat: "D" },
  { flag: "🇮🇩", name: "Balinese",         cat: "D" },
  { flag: "🇮🇩", name: "Batak",            cat: "D" },
  { flag: "🇮🇩", name: "Bugis",            cat: "D" },
  { flag: "🇮🇩", name: "Banjar",           cat: "D" },
  { flag: "🇮🇩", name: "Madurese",         cat: "D" },
  // E — BIPA
  { flag: "🇮🇩", name: "BIPA (Indonesian for Foreigners)", cat: "E" },
];

// Price per session (60 min) by [cat][levelIdx]
const PRICE_TABLE: Record<string, number[]> = {
  A: [120000, 130000, 140000, 150000],
  B: [110000, 120000, 130000, 140000],
  C: [100000, 105000, 110000, 120000],
  D: [90000,  95000,  100000, 110000],
  E: [150000, 160000, 170000, 180000],
};

const LEVELS = [
  { key: 0, label: "A1", sub: "Pemula" },
  { key: 1, label: "A2", sub: "Dasar" },
  { key: 2, label: "B1/B2", sub: "Menengah" },
  { key: 3, label: "C1/C2", sub: "Mahir" },
];

const SESSION_PRESETS = [1, 8, 16, 24, 32];

function formatRp(v: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(v);
}

function buildWaLink(lang: string, level: string, sessions: number, price: number) {
  const msg = `Halo Min Ling! Saya tertarik daftar Kelas Private ${lang} level ${level} (${sessions} sesi = ${formatRp(price)}). Bisa info lebih lanjut?`;
  return `https://wa.me/6282116859493?text=${encodeURIComponent(msg)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HargaPage() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [sessions, setSessions] = useState(16);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    setShowAll(false);
    if (!search.trim()) return LANGUAGES;
    const q = search.toLowerCase();
    return LANGUAGES.filter(l => l.name.toLowerCase().includes(q));
  }, [search]);

  const currentLevel = LEVELS[levelIdx];

  return (
    <div className="min-h-screen bg-[#f8fafa] font-sans">
      {/* ── Navbar ── */}
      <nav className="bg-white/95 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/images/logo-color.png" alt="Linguo" className="h-8 sm:h-9 object-contain" />
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium hidden sm:block">Home</Link>
            <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium hidden sm:block">Blog</Link>
            <a
              href="https://wa.me/6282116859493?text=Halo%20Min%20Ling!%20Saya%20mau%20tanya%20soal%20Kelas%20Private"
              target="_blank" rel="noopener noreferrer"
              className="bg-[#1A9E9E] text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-[#178585] transition-colors"
            >
              Daftar Sekarang
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="bg-white border-b border-slate-100 pt-14 pb-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block bg-[#1A9E9E]/10 text-[#1A9E9E] text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            Kelas Private 1-on-1
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Harga Jelas,<br />Pilih Bahasa & Level
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            60+ bahasa tersedia. Harga disesuaikan bahasa pilihan dan levelmu — transparan, tanpa biaya tersembunyi.
          </p>
        </div>
      </div>

      {/* ── Sticky Controls ── */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Level */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:block">Level:</span>
            {LEVELS.map(l => (
              <button key={l.key} onClick={() => setLevelIdx(l.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  levelIdx === l.key
                    ? "bg-[#1A9E9E] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                {l.label} <span className={`font-normal ${levelIdx === l.key ? "text-white/70" : "text-slate-400"}`}>{l.sub}</span>
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1" />

          {/* Sessions */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 hidden sm:block">Sesi:</span>
            {SESSION_PRESETS.map(s => (
              <button key={s} onClick={() => setSessions(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  sessions === s
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                {s}x
              </button>
            ))}
            {/* Manual input */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1">
              <button onClick={() => setSessions(Math.max(1, sessions - 1))}
                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold text-sm">−</button>
              <span className="text-xs font-bold text-slate-800 w-6 text-center tabular-nums">{sessions}</span>
              <button onClick={() => setSessions(Math.min(200, sessions + 1))}
                className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-900 font-bold text-sm">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Search */}
        <div className="relative mb-8 max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.15z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari bahasa..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/10 shadow-sm"
          />
        </div>

        {/* Language Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-medium">Bahasa tidak ditemukan</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(showAll ? filtered : filtered.slice(0, 12)).map(lang => {
                const price = PRICE_TABLE[lang.cat][levelIdx];
                const total = price * sessions;
                const waLink = buildWaLink(lang.name, currentLevel.label, sessions, total);
                return (
                  <div key={lang.name}
                    className="group bg-white rounded-2xl border border-slate-100 hover:border-[#1A9E9E]/30 hover:shadow-md transition-all duration-200 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl leading-none">{lang.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{lang.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{currentLevel.label} · {currentLevel.sub}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium">Per sesi (60 min)</p>
                          <p className="text-lg font-extrabold text-[#1A9E9E] leading-tight">{formatRp(price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400 font-medium">{sessions} sesi</p>
                          <p className="text-sm font-bold text-slate-700">{formatRp(total)}</p>
                        </div>
                      </div>
                    </div>
                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-[#1A9E9E] hover:bg-[#178585] text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Daftar via WhatsApp
                    </a>
                  </div>
                );
              })}
            </div>
            {!showAll && filtered.length > 12 && (
              <div className="mt-6 text-center">
                <button onClick={() => setShowAll(true)}
                  className="inline-flex items-center gap-2 bg-white border-2 border-[#1A9E9E] text-[#1A9E9E] font-bold px-8 py-3 rounded-full text-sm hover:bg-[#1A9E9E] hover:text-white transition-all">
                  Lihat Semua {filtered.length} Bahasa
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* Notes */}
        <div className="mt-12 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-[#1A9E9E]/10 rounded-md flex items-center justify-center text-[#1A9E9E] text-xs">✓</span>
            Yang kamu dapat di setiap sesi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              "Kelas 1-on-1 via Zoom, jadwal fleksibel",
              "Recording setiap sesi",
              "Soft file materi pembelajaran",
              "Request topik & jadwal sesukamu",
              "Pengajar berpengalaman & bersertifikat",
              "E-Certificate setelah selesai paket",
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                <div className="w-4 h-4 rounded-full bg-[#1A9E9E]/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-[#1A9E9E]" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
            Tersedia durasi 30 menit & 45 menit (harga proporsional). Paket standar: 16 sesi per sublevel.
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 bg-gradient-to-br from-[#1A9E9E] via-[#17918f] to-[#0e7070] rounded-2xl p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">Belum tahu mulai dari mana?</h2>
            <p className="text-white/75 mb-7 text-sm sm:text-base">Ikuti Placement Test gratis — kami bantu tentukan level & rekomendasi paket terbaik.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a href="https://wa.me/6282116859493?text=Halo%20Min%20Ling!%20Saya%20mau%20konsultasi%20soal%20Kelas%20Private%20Linguo"
                target="_blank" rel="noopener noreferrer"
                className="bg-white text-[#1A9E9E] font-bold px-7 py-3 rounded-full text-sm hover:bg-slate-50 transition-colors shadow-sm">
                💬 Konsultasi Gratis
              </a>
              <Link href="/"
                className="bg-white/15 hover:bg-white/25 text-white font-semibold px-7 py-3 rounded-full text-sm transition-colors border border-white/20">
                Placement Test →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-4 border-t border-slate-100 bg-white text-center py-6 text-xs text-slate-400">
        © {new Date().getFullYear()} PT. Linguo Edu Indonesia · <a href="/" className="hover:text-[#1A9E9E] transition-colors">linguo.id</a>
      </footer>
    </div>
  );
}
