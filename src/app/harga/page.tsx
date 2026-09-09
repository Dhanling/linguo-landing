"use client";
/* linguo-patch:harga-native-toggle-v2 */
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Hand, Scroll, Globe, Landmark, Plus, ShoppingCart } from "lucide-react";
import { RectFlag } from "@/components/RectFlag";
import { matchesLangQuery } from "@/lib/langAlias";
import { getLangPhoto } from "@/lib/lang-visuals";
// semi-class-size-picker-v1 — kalkulator ini dulu Private-only. Angka Semi-Private
// TIDAK ditulis ulang di sini: dipinjam dari sumber tunggal yang sama dengan
// funnel /daftar, /api/create-funnel-invoice, dan WA Inbox (quickReplyData.ts).
//
// [harga-keranjang-kelas-v1] Harga kartu TIDAK lagi dihitung dengan rumus lokal:
// semuanya lewat quoteKelasItem() — fungsi yang sama yang dipakai server saat
// membuat invoice. Dengan begitu angka di layar mustahil beda dari yang ditagih.
import {
  SEMI_PRIVATE_SIZES,
  NATIVE_MULTIPLIER,
  NATIVE_AVAILABLE_LANGS,
  getSemiPrivatePrice,
} from "@/lib/trial-pricing";
import {
  normalizeKelasItem, quoteKelasItem, cartItemKey, loadCart, saveCart,
  CART_MAX_ITEMS, type KelasCartItem,
} from "@/lib/kelasCart";
import { KeranjangBar, CheckoutKelasModal } from "@/components/harga/KeranjangKelas";
import TautanLegal from "@/components/TautanLegal"; // [xendit-legal-links-v1]

// ── Data ─────────────────────────────────────────────────────────────────────

// `code` = ISO-2 negara untuk bendera rounded rectangle (sama seperti menu registrasi).
// Bahasa tanpa negara (isyarat, Latin, Esperanto, Mesir Kuno) pakai ikon lucide via `icon`.
type LangIcon = "sign" | "scroll" | "globe" | "landmark";
type LangEntry = {
  code?: string; icon?: LangIcon; name: string; cat: "A" | "B" | "C" | "D" | "E";
  /** Nama versi PRICELIST kalau beda dari nama tampilan (lihat priceName). */
  price?: string;
};
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
  // Pricelist menyimpannya sebagai "BIPA" polos — tanpa `price` di bawah,
  // getLanguageCategory() tidak menemukannya dan harga jatuh ke kategori C.
  { code: "id", name: "BIPA (Indonesian for Foreigners)", cat: "E", price: "BIPA" },
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



/** Nama bahasa yang dikenal pricelist (dipakai untuk hitung harga & keranjang). */
const priceName = (lang: LangEntry) => lang.price ?? lang.name;

// price-source-single-v1 — B1 & B2 DIPISAH: di kategori C (Inggris, Jepang,
// Korea, Mandarin, Prancis, Jerman, Arab) tarifnya beda 10rb per tingkat, dan
// halaman ini dulu memakai tabel 4-tier sendiri → C1/C2 tampil Rp130.000
// padahal funnel /daftar & registrasi menagih Rp140.000. Kategori lain tetap
// menyamakan B1=B2 lewat getPrivateLevelTier().
const LEVELS = [
  { key: "A1", label: "A1", sub: "Pemula" },
  { key: "A2", label: "A2", sub: "Dasar" },
  { key: "B1", label: "B1", sub: "Menengah" },
  { key: "B2", label: "B2", sub: "Menengah Atas" },
  { key: "C1", label: "C1/C2", sub: "Mahir" },
];

const SESSION_PRESETS = [1, 8, 16, 24, 32];

function formatRp(v: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(v);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HargaPage() {
  const [levelKey, setLevelKey] = useState("A1");
  const [sessions, setSessions] = useState(16);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [teacherType, setTeacherType] = useState<TeacherType>("lokal");
  // semi-class-size-picker-v1 — tipe kelas & besar grup.
  const [classType, setClassType] = useState<"private" | "semi">("private");
  const [classSize, setClassSize] = useState(2);
  const isSemi = classType === "semi";

  // [harga-keranjang-kelas-v1] Keranjang: beberapa paket → satu invoice Xendit.
  const [cart, setCart] = useState<KelasCartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Tab level DI DALAM kartu. Isinya cuma penyimpangan dari filter atas: kartu
  // tanpa entri di sini mengikuti `levelKey`, dan begitu filter atas diubah
  // semua penyimpangan dibuang supaya kartu kembali seragam ("sync").
  const [levelKartu, setLevelKartu] = useState<Record<string, string>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setCart(loadCart()); }, []);
  const updateCart = (next: KelasCartItem[]) => { setCart(next); saveCart(next); };

  const pilihLevelFilter = (key: string) => { setLevelKey(key); setLevelKartu({}); };

  /** Item keranjang untuk satu kartu pada level yang sedang dipilih di kartu itu. */
  const buatItem = (lang: LangEntry, level: string): KelasCartItem | null =>
    normalizeKelasItem({
      language: priceName(lang),
      level,
      sessions,
      classType,
      classSize: isSemi ? classSize : 1,
      teacherType: isSemi ? "lokal" : teacherType,
    });

  // Pembaruan FUNGSIONAL (bukan dari `cart` di closure): dua kartu yang diklik
  // beruntun sebelum render berikutnya akan sama-sama masuk. Versi closure
  // membuat klik kedua menimpa hasil klik pertama.
  const tambahKeKeranjang = (item: KelasCartItem) => {
    const key = cartItemKey(item);
    setCart((prev) => {
      const next = [...prev.filter((c) => cartItemKey(c) !== key), item].slice(-CART_MAX_ITEMS);
      saveCart(next);
      return next;
    });
  };
  const beliSekarang = (item: KelasCartItem) => { tambahKeKeranjang(item); setCheckoutOpen(true); };

  // Nama & bendera untuk daftar di modal checkout (keranjang menyimpan nama
  // pricelist, bukan nama tampilan — lihat priceName).
  const resolveLabel = (language: string) => {
    const e = LANGUAGES.find((l) => priceName(l) === language);
    return { label: e?.name ?? language, code: e?.code };
  };

  const filtered = useMemo(() => {
    setShowAll(false);
    if (!search.trim()) return LANGUAGES;
    // Cari juga lewat nama Indonesia: yang diketik orang "mesir kuno", bukan
    // "Ancient Egyptian" (lihat lib/langAlias).
    return LANGUAGES.filter(l => matchesLangQuery(l.name, search));
  }, [search]);

  // Semi-Private tidak menawarkan pengajar native → badge & markup native mati
  // total di mode ini (kalau tidak, kartunya menagih 2× tarif yang tak pernah ada).
  const isNative = !isSemi && teacherType === "native";

  return (
    <div className="min-h-screen bg-[#f8fafa] font-sans">
      {/* ── Navbar ── */}
      <nav className="bg-white/95 backdrop-blur-xl border-b border-slate-100 sticky top-[var(--promo-bar-h,0px)] z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/images/logo-color.png" alt="Linguo" className="h-8 sm:h-9 object-contain" />
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium hidden sm:block">Home</Link>
            <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium hidden sm:block">Blog</Link>
            {/* [daftar-page-funnel-v1] "Daftar Sekarang" tidak lagi lempar ke
                WhatsApp — sekarang ada halaman pendaftarannya sendiri.
                [harga-keranjang-kelas-v1] Tombol "Daftar via WhatsApp" per kartu
                sudah DIGANTI tombol Beli / Tambah ke keranjang (checkout Xendit
                langsung). Jalur konsultasi WA tetap ada di CTA bawah halaman. */}
            <Link
              href="/daftar"
              className="bg-[#1A9E9E] text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-[#178585] transition-colors"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="bg-white border-b border-slate-100 pt-14 pb-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block bg-[#1A9E9E]/10 text-[#1A9E9E] text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            {isSemi ? `Kelas Semi Private · grup ${classSize} orang` : "Kelas Private 1-on-1"}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Harga Jelas,<br />Pilih Bahasa & Level
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            60+ bahasa tersedia. Harga disesuaikan bahasa pilihan dan levelmu — transparan, tanpa biaya tersembunyi.
            {isSemi && " Semi Private: makin ramai grupnya, makin murah per orang."}
          </p>
        </div>
      </div>

      {/* ── Sticky Controls ── */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          {/* Tipe kelas — Private 1:1 vs Semi Private (semi-class-size-picker-v1) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:block">Kelas:</span>
            <div className="inline-flex bg-slate-100 rounded-full p-0.5">
              {([
                { value: "private", label: "Private 1:1" },
                { value: "semi", label: "Semi Private" },
              ] as const).map(t => (
                <button key={t.value} onClick={() => setClassType(t.value)}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                    classType === t.value ? "bg-[#1A9E9E] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Jumlah siswa — cuma relevan untuk Semi Private */}
          {isSemi && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:block">Siswa:</span>
              {SEMI_PRIVATE_SIZES.map(n => (
                <button key={n} onClick={() => setClassSize(n)}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                    classSize === n ? "bg-[#1A9E9E] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          )}

          <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1" />

          {/* Level */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:block">Level:</span>
            {LEVELS.map(l => (
              <button key={l.key} onClick={() => pilihLevelFilter(l.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  levelKey === l.key
                    ? "bg-[#1A9E9E] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                {l.label} <span className={`font-normal ${levelKey === l.key ? "text-white/70" : "text-slate-400"}`}>{l.sub}</span>
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

          <div className={`h-5 w-px bg-slate-200 mx-1 ${isSemi ? "hidden" : "hidden sm:block"}`} />

          {/* Teacher type — Semi Private tidak punya opsi native */}
          <div className={`items-center gap-1.5 ${isSemi ? "hidden" : "flex"}`}>
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

        {/* Semi Private note */}
        {isSemi && (
          <div className="-mt-4 mb-7 flex items-start gap-2 text-xs bg-[#1A9E9E]/5 border border-[#1A9E9E]/15 rounded-xl px-3.5 py-2.5 max-w-xl">
            <span className="font-extrabold text-[#1A9E9E] shrink-0">Semi Private</span>
            <span className="text-slate-500 leading-relaxed">
              — harga di kartu = porsi <b>per siswa</b> untuk grup {classSize} orang. Teman satu grup dicari
              sendiri (Linguo tidak menggabungkan pendaftar lain), dan tiap anggota bayar porsinya masing-masing.
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
            <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(showAll ? filtered : filtered.slice(0, 12)).map(lang => {
                const nativeAvail = NATIVE_AVAILABLE_LANGS.includes(lang.name);
                const comingSoon = isNative && !nativeAvail;
                // Level kartu: penyimpangan lokal kalau ada, kalau tidak ikut filter atas.
                const lvl = levelKartu[lang.name] ?? levelKey;
                const item = buatItem(lang, lvl);
                const quote = item ? quoteKelasItem(item) : null;
                const price = quote?.perSession ?? 0;
                const total = quote?.amount ?? 0;
                const semi = isSemi ? getSemiPrivatePrice(priceName(lang), lvl, classSize, 60) : null;
                const foto = getLangPhoto(priceName(lang));
                const diKeranjang = cart.some(c => item && cartItemKey(c) === cartItemKey(item));
                return (
                  <div key={lang.name}
                    className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${comingSoon ? "border-slate-100 opacity-60" : "border-slate-100 hover:border-[#1A9E9E]/30 hover:shadow-md"}`}>

                    {/* [harga-kartu-banner-v1] Banner foto bahasa — nama & bendera
                        di dalam foto, di atas gradien gelap (teks putih hilang di
                        sampul terang). Bahasa tanpa foto stok pakai gradien teal. */}
                    <div className="relative isolate flex h-24 items-end overflow-hidden transform-gpu [backface-visibility:hidden]"
                      style={{ background: "#0E1526" }}>
                      {foto ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={foto} alt="" loading="lazy" decoding="async"
                          className="absolute inset-0 h-full w-full transform-gpu scale-[1.02] object-cover transition-transform duration-300 ease-out [backface-visibility:hidden] group-hover:scale-[1.07]"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1A9E9E] via-[#17918f] to-[#0e7070]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                      <div className="relative flex w-full items-center gap-2 p-3">
                        <LangFlag lang={lang} muted={comingSoon} />
                        <p className="min-w-0 flex-1 truncate text-sm font-bold text-white drop-shadow">{lang.name}</p>
                        {isNative && (nativeAvail ? (
                          <span className="shrink-0 rounded-full bg-[#fbbf24] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-slate-900">Native</span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-white/25 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">Soon</span>
                        ))}
                      </div>

                      {/* Aksi muncul saat kursor di atas kartu (desktop). Di HP
                          tidak ada hover → tombol yang sama dirender di badan kartu. */}
                      {!comingSoon && item && (
                        <div className="absolute inset-0 z-10 hidden items-center justify-center gap-2 bg-slate-900/70 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100 sm:flex">
                          <button onClick={() => beliSekarang(item)}
                            className="rounded-xl bg-[#1A9E9E] px-3.5 py-2 text-xs font-bold text-white shadow transition-colors hover:bg-[#178585]">
                            Beli
                          </button>
                          <button onClick={() => tambahKeKeranjang(item)}
                            className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow transition-colors hover:bg-slate-50">
                            <Plus className="h-3.5 w-3.5" /> Keranjang
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2.5 p-3.5">
                      {/* Tab level per kartu — awalnya ikut filter atas, boleh
                          ditimpa untuk kartu ini saja (mis. Korea B1, Jepang A1).
                          Kartu "Segera Hadir" tidak menampilkannya: harganya pun
                          tidak ditampilkan, jadi memilih level tak ada artinya. */}
                      <div className={`flex-wrap gap-1 ${comingSoon ? "hidden" : "flex"}`}>
                        {LEVELS.map(l => (
                          <button key={l.key}
                            onClick={() => setLevelKartu(prev => ({ ...prev, [lang.name]: l.key }))}
                            aria-label={`Level ${l.label} ${lang.name}`}
                            className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                              lvl === l.key
                                ? "bg-[#1A9E9E] text-white shadow-sm"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}>
                            {l.key}
                          </button>
                        ))}
                      </div>

                      {comingSoon ? (
                        <>
                          <div className="bg-slate-50 rounded-xl px-3 py-3.5 text-center">
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Pengajar native <span className="font-bold text-slate-500">{lang.name}</span> belum tersedia</p>
                          </div>
                          <div className="mt-auto flex items-center justify-center gap-1.5 bg-slate-100 text-slate-400 text-xs font-bold py-2.5 rounded-xl cursor-not-allowed select-none">
                            Segera Hadir
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                            <div className="flex items-baseline justify-between">
                              <div>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  {isSemi ? `Per siswa / sesi (grup ${classSize})` : "Per sesi (60 min)"}
                                </p>
                                <p className="text-lg font-extrabold text-[#1A9E9E] leading-tight">{formatRp(price)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] text-slate-400 font-medium">{sessions} sesi</p>
                                <p className="text-sm font-bold text-slate-700">{formatRp(total)}</p>
                              </div>
                            </div>
                            {semi && semi.totalGroup > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-baseline justify-between text-[11px] text-slate-400">
                                <span>Satu grup / sesi</span>
                                <span className="font-semibold text-slate-600">{formatRp(semi.totalGroup)}</span>
                              </div>
                            )}
                          </div>

                          {diKeranjang && (
                            <p className="flex items-center gap-1 text-[11px] font-semibold text-[#1A9E9E]">
                              <ShoppingCart className="h-3 w-3" /> Sudah di keranjang
                            </p>
                          )}

                          {/* Versi HP dari aksi hover di banner. */}
                          {item && (
                            <div className="mt-auto flex gap-2 sm:hidden">
                              <button onClick={() => beliSekarang(item)}
                                className="flex-1 rounded-xl bg-[#1A9E9E] py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#178585]">
                                Beli
                              </button>
                              <button onClick={() => tambahKeKeranjang(item)}
                                className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:border-[#1A9E9E]/40 hover:text-[#1A9E9E]">
                                <Plus className="h-3.5 w-3.5" /> Keranjang
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
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
              isSemi
                ? `Kelas grup kecil ${classSize} orang via Zoom, jadwal disepakati bareng`
                : "Kelas 1-on-1 via Zoom, jadwal fleksibel",
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

      {/* [harga-keranjang-kelas-v1] Bilah keranjang + checkout */}
      <KeranjangBar items={cart} hidden={checkoutOpen} onCheckout={() => setCheckoutOpen(true)} />
      {checkoutOpen && (
        <CheckoutKelasModal
          items={cart}
          resolveLabel={resolveLabel}
          onRemove={key => updateCart(cart.filter(c => cartItemKey(c) !== key))}
          onAddMore={() => { setCheckoutOpen(false); gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
          onClose={() => setCheckoutOpen(false)}
          onPaid={() => updateCart([])}
        />
      )}

      {/* Footer */}
      <footer className="mt-4 border-t border-slate-100 bg-white text-center py-6 text-xs text-slate-400">
        <TautanLegal className="mb-2 text-slate-500" />
        © {new Date().getFullYear()} PT. Linguo Edu Indonesia · <a href="/" className="hover:text-[#1A9E9E] transition-colors">linguo.id</a>
      </footer>
    </div>
  );
}
