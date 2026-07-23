"use client";
/* linguo-patch:harga-native-toggle-v2 */
import { useState, useMemo } from "react";
import Link from "next/link";
import { Hand, Scroll, Globe, Landmark } from "lucide-react";
import { RectFlag } from "@/components/RectFlag";

// ── Data ─────────────────────────────────────────────────────────────────────

// `code` = ISO-2 negara untuk bendera rounded rectangle (sama seperti menu registrasi).
// Bahasa tanpa negara (isyarat, Latin, Esperanto, Mesir Kuno) pakai ikon lucide via `icon`.
type LangIcon = "sign" | "scroll" | "globe" | "landmark";
type LangEntry = { code?: string; icon?: LangIcon; name: string; cat: "A" | "B" | "C" | "D" | "E" };
type TeacherType = "lokal" | "native";

// Sorted by demand (most popular first)
const LANGUAGES: LangEntry[] = [
  // C — paling diminati
  { code: "gb", name: "English",          cat: "C" },
  { code: "kr", name: "Korean",           cat: "C" },
  { code: "jp", name: "Japanese",         cat: "C" },
  { code: "cn", name: "Mandarin",         cat: "C" },
  { code: "fr", name: "French",           cat: "C" },
  { code: "de", name: "German",           cat: "C" },
  { code: "sa", name: "Arabic",           cat: "C" },
  // B — populer Eropa & Asia
  { code: "es", name: "Spanish",          cat: "B" },
  { code: "it", name: "Italian",          cat: "B" },
  { code: "ru", name: "Russian",          cat: "B" },
  { code: "nl", name: "Dutch",            cat: "B" },
  { code: "th", name: "Thai",             cat: "B" },
  { icon: "sign", name: "Sign Language",  cat: "B" },
  // A — langka & Eropa
  { code: "pt", name: "Portuguese",       cat: "A" },
  { code: "vn", name: "Vietnamese",       cat: "A" },
  { code: "in", name: "Hindi",            cat: "A" },
  { code: "tr", name: "Turkish",          cat: "A" },
  { code: "pl", name: "Polish",           cat: "A" },
  { code: "se", name: "Swedish",          cat: "A" },
  { code: "cz", name: "Czech",            cat: "A" },
  { code: "fi", name: "Finnish",          cat: "A" },
  { code: "gr", name: "Greek",            cat: "A" },
  { code: "ro", name: "Romanian",         cat: "A" },
  { code: "ph", name: "Tagalog",          cat: "A" },
  { code: "no", name: "Norwegian",        cat: "A" },
  { code: "dk", name: "Danish",           cat: "A" },
  { code: "il", name: "Hebrew",           cat: "A" },
  { code: "hu", name: "Hungarian",        cat: "A" },
  { code: "my", name: "Malay",            cat: "A" },
  { code: "pk", name: "Urdu",             cat: "A" },
  { code: "kh", name: "Khmer",            cat: "A" },
  { code: "ir", name: "Farsi",            cat: "A" },
  { code: "gb", name: "English British",  cat: "A" },
  { code: "uz", name: "Uzbek",            cat: "A" },
  { code: "rs", name: "Serbian",          cat: "A" },
  { code: "ee", name: "Estonian",         cat: "A" },
  { code: "tz", name: "Swahili",          cat: "A" },
  { code: "tw", name: "Traditional Chinese", cat: "A" },
  { code: "ge", name: "Georgian",         cat: "A" },
  { code: "ie", name: "Irish",            cat: "A" },
  { code: "iq", name: "Kurdish",          cat: "A" },
  { icon: "scroll",   name: "Latin",            cat: "A" },
  { icon: "landmark", name: "Ancient Egyptian", cat: "A" },
  { icon: "globe",    name: "Esperanto",        cat: "A" },
  // D — Nusantara
  { code: "id", name: "Javanese",         cat: "D" },
  { code: "id", name: "Sundanese",        cat: "D" },
  { code: "id", name: "Balinese",         cat: "D" },
  { code: "id", name: "Batak",            cat: "D" },
  { code: "id", name: "Bugis",            cat: "D" },
  { code: "id", name: "Banjar",           cat: "D" },
  { code: "id", name: "Madurese",         cat: "D" },
  // E — BIPA
  { code: "id", name: "BIPA (Indonesian for Foreigners)", cat: "E" },
];

// Bendera kartu: SVG rounded rectangle, atau ikon lucide untuk bahasa tanpa negara.
function LangFlag({ lang, muted }: { lang: LangEntry; muted?: boolean }) {
  const wrap = muted ? "grayscale opacity-70" : "";
  if (lang.icon) {
    const Icon = lang.icon === "sign" ? Hand : lang.icon === "scroll" ? Scroll : lang.icon === "landmark" ? Landmark : Globe;
    return (
      <span className={`inline-flex h-[26px] w-[36px] items-center justify-center rounded-[5px] bg-slate-100 ring-1 ring-black/5 shrink-0 ${wrap}`}>
        <Icon aria-hidden className="h-4 w-4 text-slate-500" strokeWidth={2} />
      </span>
    );
  }
  return <RectFlag code={lang.code} h={26} className={wrap} />;
}

// Price per session (60 min) by [cat][levelIdx]
const PRICE_TABLE: Record<string, number[]> = {
  A: [120000, 130000, 140000, 150000],
  B: [110000, 120000, 130000, 140000],
  C: [100000, 110000, 120000, 130000],
  D: [90000,  95000,  100000, 110000],
  E: [150000, 160000, 170000, 180000],
};

// Pengajar native speaker = 2x tarif pengajar lokal.
// Ubah konstanta ini kalau markup native mau disesuaikan.
const NATIVE_MULTIPLIER = 2;

// Native speaker baru tersedia untuk bahasa berikut. Sisanya tampil "Coming soon".
const NATIVE_AVAILABLE_LANGS = ["English", "Tagalog", "Spanish", "Arabic"];

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

// Harga per sesi sesuai kategori, level, dan tipe pengajar.
// Native dibulatkan ke ribuan terdekat biar rapi.
function priceFor(cat: string, levelIdx: number, teacherType: TeacherType) {
  const base = PRICE_TABLE[cat][levelIdx];
  if (teacherType === "native") {
    return Math.round((base * NATIVE_MULTIPLIER) / 1000) * 1000;
  }
  return base;
}

function buildWaLink(
  lang: string,
  level: string,
  sessions: number,
  price: number,
  teacherType: TeacherType,
) {
  const tt = teacherType === "native" ? "Pengajar Native" : "Pengajar Lokal";
  const msg = `Halo Min Ling! Saya tertarik daftar Kelas Private ${lang} (${tt}) level ${level} (${sessions} sesi = ${formatRp(price)}). Bisa info lebih lanjut?`;
  return `https://wa.me/6282116859493?text=${encodeURIComponent(msg)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HargaPage() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [sessions, setSessions] = useState(16);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [teacherType, setTeacherType] = useState<TeacherType>("lokal");

  const filtered = useMemo(() => {
    setShowAll(false);
    if (!search.trim()) return LANGUAGES;
    const q = search.toLowerCase();
    return LANGUAGES.filter(l => l.name.toLowerCase().includes(q));
  }, [search]);

  const currentLevel = LEVELS[levelIdx];
  const isNative = teacherType === "native";

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

          <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1" />

          {/* Teacher type */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:block">Pengajar:</span>
            <div className="inline-flex bg-slate-100 rounded-full p-0.5">
              {([
                { value: "lokal", label: "Lokal" },
                { value: "native", label: "Native" },
              ] as const).map(t => (
                <button key={t.value} onClick={() => setTeacherType(t.value)}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                    teacherType === t.value
                      ? t.value === "native"
                        ? "bg-[#fbbf24] text-slate-900 shadow-sm"
                        : "bg-[#1A9E9E] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}>
                  {t.label}
                </button>
              ))}
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

        {/* Native price note */}
        {isNative && (
          <div className="-mt-4 mb-7 flex items-start gap-2 text-xs bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 max-w-md">
            <span className="font-extrabold text-amber-700 shrink-0">Native speaker</span>
            <span className="text-amber-600 leading-relaxed">
              — tarif {NATIVE_MULTIPLIER}× pengajar lokal, imersi penuh & pelafalan autentik. Saat ini tersedia untuk English, Tagalog, Spanish & Arabic.
            </span>
          </div>
        )}

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
                const nativeAvail = NATIVE_AVAILABLE_LANGS.includes(lang.name);
                const comingSoon = isNative && !nativeAvail;
                const price = priceFor(lang.cat, levelIdx, teacherType);
                const total = price * sessions;
                const waLink = buildWaLink(lang.name, currentLevel.label, sessions, total, teacherType);
                return (
                  <div key={lang.name}
                    className={`group bg-white rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-200 ${comingSoon ? "border-slate-100 opacity-60" : "border-slate-100 hover:border-[#1A9E9E]/30 hover:shadow-md"}`}>
                    <div className="flex items-center gap-3">
                      <LangFlag lang={lang} muted={comingSoon} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-sm truncate">{lang.name}</p>
                          {isNative && (nativeAvail ? (
                            <span className="shrink-0 text-[9px] font-extrabold bg-[#fbbf24] text-slate-900 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Native</span>
                          ) : (
                            <span className="shrink-0 text-[9px] font-extrabold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Coming soon</span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{currentLevel.label} · {currentLevel.sub}</p>
                      </div>
                    </div>
                    {comingSoon ? (
                      <>
                        <div className="bg-slate-50 rounded-xl px-3 py-3.5 text-center">
                          <p className="text-xs text-slate-400 font-medium leading-relaxed">Pengajar native <span className="font-bold text-slate-500">{lang.name}</span> belum tersedia</p>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-400 text-xs font-bold py-2.5 rounded-xl cursor-not-allowed select-none">
                          Segera Hadir
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
              isNative
                ? "Pengajar native speaker — imersi & pelafalan autentik"
                : "Pengajar lokal berpengalaman & bersertifikat",
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
