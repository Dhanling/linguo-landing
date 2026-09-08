"use client";
// [test-prep-v1] Flow katalog + checkout Persiapan Ujian Bahasa (HSK/JLPT/TOPIK/
// Goethe). Pilih produk → format (semi-private / private) → level → (private:
// jumlah sesi) → masuk keranjang → isi identitas → checkout Xendit.
//
// [test-prep-keranjang-v1] Checkout kini lewat KERANJANG: beberapa paket
// (mis. JLPT N5 semi-private + TOPIK I private) dibayar dalam satu invoice
// lewat /api/create-testprep-invoice. Modal produk dibuat dua kolom + tab info
// supaya di desktop tidak perlu scroll; tombol aksi duduk di footer tetap.
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenTool, GraduationCap, ScrollText, Award, Users, User, Check, X,
  ArrowLeft, Clock, Sparkles, ShoppingCart, Plus, Trash2, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { RectFlag } from "@/components/RectFlag";
import { getLangPhoto } from "@/lib/lang-visuals";
import {
  TEST_PREP_PRODUCTS, getTestPrepProduct, quoteTestPrep, formatRupiah, SESSION_MINUTES,
  SEMI_SESSIONS, PRIVATE_SESSION_OPTS, DEFAULT_PRIVATE_SESSIONS,
  SEMI_GROUP_MIN, SEMI_GROUP_MAX, SEMI_GROUP_OPEN_AT,
  privatePerSessionFor, semiPriceFor, semiSavingPct,
  type TestPrepProduct, type TestPrepFormat,
} from "@/lib/testPrep";
import {
  cartItemKey, cartTotal, loadCart, saveCart, loadIdentity, saveIdentity, quoteCartItem,
  CART_MAX_ITEMS, type TestPrepCartItem,
} from "@/lib/testPrepCart";

const TEAL = "#1A9E9E";
const ICON: Record<string, LucideIcon> = { PenTool, GraduationCap, ScrollText, Award };

/** "TOPIK" + "TOPIK I" → "TOPIK I", bukan "TOPIK TOPIK I". */
const judulPaket = (test: string, level: string) => (level.startsWith(test) ? level : `${test} ${level}`);

const namaBahasa = (lang: string) =>
  lang === "Japanese" ? "Jepang" : lang === "Korean" ? "Korea" : lang === "German" ? "Jerman" : "Mandarin";

export default function PersiapanTesClient() {
  const [active, setActive] = useState<TestPrepProduct | null>(null);
  const [cart, setCart] = useState<TestPrepCartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const katalogRef = useRef<HTMLElement>(null);

  // Keranjang hidup di localStorage supaya tahan reload / pindah halaman.
  // `?produk=jlpt` langsung membuka modal produk itu (tautan dari landing/iklan).
  useEffect(() => {
    setCart(loadCart());
    const id = new URLSearchParams(window.location.search).get("produk");
    if (id) setActive(getTestPrepProduct(id));
  }, []);
  const updateCart = (next: TestPrepCartItem[]) => { setCart(next); saveCart(next); };

  const addItem = (item: TestPrepCartItem) => {
    const key = cartItemKey(item);
    const tanpaDobel = cart.filter((c) => cartItemKey(c) !== key);
    updateCart([...tanpaDobel, item].slice(-CART_MAX_ITEMS));
    setPulse((n) => n + 1);
  };
  const removeItem = (key: string) => updateCart(cart.filter((c) => cartItemKey(c) !== key));

  const total = useMemo(() => cartTotal(cart), [cart]);

  return (
    <main className="min-h-screen bg-white pb-28" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-800 hover:text-teal-600">
            <ArrowLeft className="h-4 w-4" /> Linguo.id
          </Link>
          <div className="flex items-center gap-4">
            <a href="https://wa.me/6282116859493" target="_blank" className="text-sm font-medium text-teal-600">Butuh bantuan?</a>
            <button
              onClick={() => cart.length && setCheckoutOpen(true)}
              aria-label={`Keranjang, ${cart.length} paket`}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-teal-300 hover:text-teal-600"
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              {cart.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white" style={{ background: TEAL }}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-indigo-50" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 text-center sm:py-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-700">Persiapan ujian terstruktur + mock test</span>
          </div>
          <h1 className="mb-4 text-3xl font-extrabold text-slate-900 sm:text-5xl">
            Persiapan Ujian Bahasa<br />
            <span className="bg-gradient-to-r from-teal-500 to-indigo-500 bg-clip-text text-transparent">HSK · JLPT · TOPIK · Goethe</span>
          </h1>
          <p className="mx-auto mb-2 max-w-2xl text-base text-slate-500 sm:text-lg">
            Kelas persiapan sertifikasi resmi dengan pengajar berpengalaman. Pilih grup kecil (semi-private) yang ekonomis atau private 1-on-1 yang fleksibel. Bisa ambil beberapa paket sekaligus dalam satu pembayaran.
          </p>
        </div>
      </section>

      {/* Katalog produk — 4 kartu satu baris di desktop */}
      <section ref={katalogRef} className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEST_PREP_PRODUCTS.map((p) => {
            const Icon = ICON[p.icon] ?? Award;
            const foto = getLangPhoto(p.language);
            const bahasa = namaBahasa(p.language);
            const diKeranjang = cart.filter((c) => c.productId === p.id).length;
            return (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                aria-label={`Daftar persiapan ${p.test} (${bahasa})`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                {/* [test-prep-kartu-foto-v1] Banner poster: foto stok bahasa + nama ujian
                    di atas gradien hitam (wajib, teks putih hilang di sampul terang). */}
                <div
                  className="relative isolate flex h-36 items-end overflow-hidden transform-gpu [backface-visibility:hidden]"
                  style={{ background: foto ? "#0E1526" : p.accent }}
                >
                  {foto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={foto}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transform-gpu scale-[1.02] transition-transform duration-300 ease-out [backface-visibility:hidden] group-hover:scale-[1.07]"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_60%)]" />
                      <Icon className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-[65%] text-white/80" strokeWidth={1.6} />
                    </>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                  {p.demandTag && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
                      {p.demandTag}
                    </span>
                  )}
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-md ring-1 ring-white/30" style={{ background: p.accent }}>
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="relative w-full p-3.5">
                    <div className="flex items-center gap-2">
                      <RectFlag code={p.flagCode} h={14} className="shrink-0 shadow" />
                      <h2 className="text-lg font-extrabold leading-tight text-white drop-shadow">{p.test}</h2>
                      <span className="text-xs font-medium text-white/85 drop-shadow">· {bahasa}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="mb-4 flex-1 text-[13px] leading-relaxed text-slate-600 line-clamp-3">{p.blurb}</p>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Mulai dari</p>
                    <p className="text-lg font-extrabold leading-tight text-slate-900">{formatRupiah(p.semiPrice)}</p>
                    {/* [test-prep-level-pricing-v1] "Mulai dari" = level TERENDAH & semi-private. */}
                    <p className="text-[11px] text-slate-400">/orang · {SEMI_SESSIONS} sesi semi-private · {p.levels[0]?.label}</p>
                  </div>
                  <span
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-white shadow-sm transition group-hover:brightness-110"
                    style={{ background: p.accent }}
                  >
                    {diKeranjang ? <><Check className="h-4 w-4" /> {diKeranjang} di keranjang</> : <>Pilih paket <ArrowRight className="h-4 w-4" /></>}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Perbandingan format */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              <p className="font-bold text-slate-900">Semi-Private (grup kecil)</p>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {[`Grup ${SEMI_GROUP_MIN}–${SEMI_GROUP_MAX} orang, harga per orang lebih hemat`, "Ada partner latihan speaking & writing", `Paket ${SEMI_SESSIONS} sesi @${SESSION_MINUTES} menit, kurikulum terstruktur`, `Cukup ${SEMI_GROUP_OPEN_AT} orang untuk buka kelas`].map((f) => (
                <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" /><span>{f}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-2 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              <p className="font-bold text-slate-900">Private 1-on-1</p>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {["Fokus penuh ke kamu, jadwal fleksibel", "Materi menyesuaikan target skor & kelemahan", `Pilih ${PRIVATE_SESSION_OPTS.join(" / ")} sesi @${SESSION_MINUTES} menit`, "Cocok untuk kejar deadline ujian"].map((f) => (
                <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /><span>{f}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-3xl bg-slate-50 p-6">
          {["Pengajar bersertifikat", "Mock test + feedback", "Materi sesuai format ujian resmi", "Pembayaran aman via Xendit"].map((b) => (
            <span key={b} className="flex items-center gap-1.5 text-sm font-medium text-slate-500"><Check className="h-4 w-4 text-teal-500" />{b}</span>
          ))}
        </div>
      </section>

      {/* Bilah keranjang — menempel di bawah selama ada isi */}
      <AnimatePresence>
        {cart.length > 0 && !checkoutOpen && (
          <motion.div
            key={pulse}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pr-24 sm:pr-4"
          >
            <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-2 pl-4 shadow-2xl backdrop-blur">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-slate-500">{cart.length} paket di keranjang · bisa tambah lagi</p>
                <p className="truncate text-base font-extrabold text-slate-900">{formatRupiah(total)}</p>
              </div>
              <button onClick={() => setCheckoutOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow"
                style={{ background: TEAL }}>
                Checkout <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <ProductModal
            key={active.id}
            product={active}
            onClose={() => setActive(null)}
            onAdd={(item) => { addItem(item); setActive(null); }}
            onBuyNow={(item) => { addItem(item); setActive(null); setCheckoutOpen(true); }}
          />
        )}
        {checkoutOpen && (
          <CheckoutModal
            key="checkout"
            items={cart}
            onRemove={removeItem}
            onAddMore={() => { setCheckoutOpen(false); katalogRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            onClose={() => setCheckoutOpen(false)}
            onPaid={() => updateCart([])}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ── Modal produk: pilih format/level/sesi, info di tab, aksi di footer tetap ── */
type InfoTab = "cara" | "dapat" | "harga";

function ProductModal({ product, onClose, onAdd, onBuyNow }: {
  product: TestPrepProduct;
  onClose: () => void;
  onAdd: (item: TestPrepCartItem) => void;
  onBuyNow: (item: TestPrepCartItem) => void;
}) {
  const [format, setFormat] = useState<TestPrepFormat>("semi");
  const [level, setLevel] = useState(product.levels[0]?.id ?? "");
  const [sessions, setSessions] = useState<number>(DEFAULT_PRIVATE_SESSIONS);
  const [tab, setTab] = useState<InfoTab>("cara");

  const quote = quoteTestPrep(product, format, level, sessions);
  const item: TestPrepCartItem = { productId: product.id, format, level, sessions };
  const levelLabel = product.levels.find((l) => l.id === level)?.label ?? level;

  const chip = (on: boolean) =>
    `rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${on ? "border-teal-500 bg-teal-500 text-white" : "border-slate-200 text-slate-700 hover:border-teal-300"}`;

  return (
    <Overlay onClose={onClose}>
      <div className="px-5 py-4 text-white" style={{ background: product.accent }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RectFlag code={product.flagCode} h={18} className="shrink-0 shadow" />
            <div>
              <p className="text-[11px] text-white/80">Persiapan Ujian</p>
              <h3 className="text-lg font-bold leading-tight">{product.test} — {namaBahasa(product.language)}</h3>
            </div>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 overflow-y-auto p-5 md:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
        {/* Kolom kiri: pilihan */}
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-500">Format kelas</p>
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
              {([
                { k: "semi", icon: Users, label: "Semi-Private", sub: `Grup ${SEMI_GROUP_MIN}–${SEMI_GROUP_MAX} orang` },
                { k: "private", icon: User, label: "Private 1-on-1", sub: "Fokus & fleksibel" },
              ] as const).map((f) => {
                const Icon = f.icon; const on = format === f.k;
                return (
                  <button key={f.k} onClick={() => setFormat(f.k)}
                    className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-left transition ${on ? "bg-white shadow-sm" : "hover:bg-white/60"}`}>
                    <Icon className={`h-4 w-4 shrink-0 ${on ? "text-teal-600" : "text-slate-400"}`} />
                    <span className="min-w-0">
                      <span className={`block text-sm font-bold ${on ? "text-slate-900" : "text-slate-600"}`}>{f.label}</span>
                      <span className="block truncate text-[11px] text-slate-500">{f.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-500">Target level ujian</p>
            <div className="flex flex-wrap gap-1.5">
              {product.levels.map((l) => (
                <button key={l.id} onClick={() => setLevel(l.id)} title={l.desc} className={chip(level === l.id)}>{l.label}</button>
              ))}
            </div>
          </div>

          {format === "private" && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-500">Jumlah sesi</p>
              <div className="flex gap-1.5">
                {PRIVATE_SESSION_OPTS.map((s) => (
                  <button key={s} onClick={() => setSessions(s)} className={`flex-1 ${chip(sessions === s)}`}>{s} sesi</button>
                ))}
              </div>
            </div>
          )}

          {/* Ringkasan harga */}
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" /> {quote.sessions} sesi @{SESSION_MINUTES} menit
              {format === "semi" && <span>· grup {SEMI_GROUP_MIN}–{SEMI_GROUP_MAX} orang</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-extrabold text-slate-900">{formatRupiah(quote.amount)}</span>
              <span className="text-xs text-slate-400">({formatRupiah(quote.perSession)}/sesi{format === "semi" ? " · per orang" : ""})</span>
            </div>
            {format === "semi" ? (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Tagihan <b>satu orang</b>, dibayar masing-masing anggota.
                {semiSavingPct(product, level) > 0 && (
                  <span className="font-semibold text-teal-600"> Hemat {semiSavingPct(product, level)}% dibanding private.</span>
                )}
              </p>
            ) : (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Jadwal diatur bersama pengajar setelah pembayaran.</p>
            )}
          </div>
        </div>

        {/* Kolom kanan: info dalam tab */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200">
          <div className="flex gap-1 border-b border-slate-100 p-1.5">
            {([
              { k: "cara", label: "Cara kerja" },
              { k: "dapat", label: "Yang kamu dapat" },
              { k: "harga", label: "Harga per level" },
            ] as { k: InfoTab; label: string }[]).map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)}
                className={`flex-1 rounded-xl px-2 py-1.5 text-[12px] font-semibold transition ${tab === t.k ? "text-white" : "text-slate-500 hover:bg-slate-50"}`}
                style={tab === t.k ? { background: TEAL } : undefined}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 p-4 text-[12px] leading-relaxed text-slate-700">
            {tab === "cara" && (format === "semi" ? (
              <Bullets items={[
                <>Kapasitas <b>{SEMI_GROUP_MIN}–{SEMI_GROUP_MAX} orang</b> per grup. Kelas dibuka setelah minimal <b>{SEMI_GROUP_OPEN_AT} orang</b> terkumpul.</>,
                <>Harga di samping adalah <b>harga per orang</b>, bukan per grup. Tiap anggota mendaftar & membayar porsinya sendiri lewat halaman ini.</>,
                <>Anggota grup <b>kamu kumpulkan sendiri</b> (teman, keluarga, rekan kerja). Linguo tidak menggabungkan pendaftar dari luar.</>,
                <>Paket tetap <b>{SEMI_SESSIONS} sesi @{SESSION_MINUTES} menit</b>, jadwal disepakati bersama satu grup.</>,
              ]} />
            ) : (
              <Bullets items={[
                <>Satu pengajar <b>khusus untukmu</b>, materi menyesuaikan target skor & kelemahanmu.</>,
                <>Pilih <b>{PRIVATE_SESSION_OPTS.join(" / ")} sesi</b> @{SESSION_MINUTES} menit; jadwal fleksibel, bisa diatur ulang.</>,
                <>Setelah bayar, tim Linguo menghubungimu via WhatsApp untuk mencocokkan jadwal & pengajar.</>,
                <>Cocok untuk kejar deadline ujian atau mengulang level yang belum lolos.</>,
              ]} />
            ))}
            {tab === "dapat" && (
              <Bullets items={[
                <>{product.blurb}</>,
                <>Latihan soal sesuai format ujian resmi + <b>mock test</b> dengan pembahasan.</>,
                <>Pengajar spesialis {product.test}, feedback langsung tiap sesi.</>,
                <>Rekaman & materi bisa diakses lewat dashboard siswa Linguo.</>,
              ]} />
            )}
            {tab === "harga" && (
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-[12px]">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                    <tr><th className="px-2.5 py-1.5 text-left font-semibold">Level</th><th className="px-2.5 py-1.5 text-right font-semibold">Semi /orang</th><th className="px-2.5 py-1.5 text-right font-semibold">Private /sesi</th></tr>
                  </thead>
                  <tbody>
                    {product.levels.map((l) => (
                      <tr key={l.id} onClick={() => setLevel(l.id)}
                        className={`cursor-pointer border-t border-slate-100 ${level === l.id ? "bg-teal-50 font-semibold text-teal-800" : "hover:bg-slate-50"}`}>
                        <td className="px-2.5 py-1.5">{l.label}</td>
                        <td className="px-2.5 py-1.5 text-right tabular-nums">{formatRupiah(semiPriceFor(product, l.id))}</td>
                        <td className="px-2.5 py-1.5 text-right tabular-nums">{formatRupiah(privatePerSessionFor(product, l.id))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-2.5 py-1.5 text-[11px] text-slate-400">Semi = paket {SEMI_SESSIONS} sesi. Tarif naik mengikuti level ujian.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer aksi — selalu terlihat */}
      <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 p-4 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 truncate text-xs text-slate-500">
          <b className="text-slate-800">{judulPaket(product.test, levelLabel)}</b> · {format === "semi" ? "Semi-Private" : `Private ${sessions} sesi`} · <b className="text-slate-800">{formatRupiah(quote.amount)}</b>
        </p>
        <div className="flex gap-2">
          <button onClick={() => onAdd(item)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-4 py-2.5 text-sm font-bold sm:flex-none"
            style={{ borderColor: TEAL, color: TEAL }}>
            <Plus className="h-4 w-4" /> Tambah ke keranjang
          </button>
          <button onClick={() => onBuyNow(item)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow sm:flex-none"
            style={{ background: TEAL }}>
            Bayar sekarang <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ── Modal keranjang: daftar paket, identitas, satu tombol bayar ─────────── */
function CheckoutModal({ items, onRemove, onAddMore, onClose, onPaid }: {
  items: TestPrepCartItem[];
  onRemove: (key: string) => void;
  onAddMore: () => void;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [ident, setIdent] = useState(() => loadIdentity());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const total = cartTotal(items);
  const adaSemi = items.some((it) => it.format === "semi");

  const set = (k: keyof typeof ident) => (e: ChangeEvent<HTMLInputElement>) => setIdent({ ...ident, [k]: e.target.value });

  const checkout = async () => {
    if (!items.length) { setError("Keranjang masih kosong."); return; }
    if (!ident.name.trim() || !ident.email.trim() || !ident.email.includes("@") || !ident.wa.trim()) {
      setError("Lengkapi nama, email, dan WhatsApp yang valid."); return;
    }
    setLoading(true); setError("");
    try {
      saveIdentity(ident);
      const ref = typeof window !== "undefined" ? localStorage.getItem("linguo_ref") || undefined : undefined;
      const res = await fetch("/api/create-testprep-invoice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ident.name.trim(), email: ident.email.trim(), wa_number: ident.wa.trim(),
          items, ref_code: ref,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat invoice");
      onPaid();
      window.location.href = data.invoice_url;
    } catch (e: any) { setError(e.message); setLoading(false); }
  };

  const inputCls = "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50";

  return (
    <Overlay onClose={() => !loading && onClose()}>
      <div className="flex items-center justify-between px-5 py-4 text-white" style={{ background: TEAL }}>
        <div className="flex items-center gap-2.5">
          <ShoppingCart className="h-5 w-5" />
          <div>
            <p className="text-[11px] text-white/80">Keranjang</p>
            <h3 className="text-lg font-bold leading-tight">{items.length} paket · {formatRupiah(total)}</h3>
          </div>
        </div>
        <button onClick={() => !loading && onClose()} aria-label="Tutup" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid min-w-0 gap-5 overflow-y-auto p-5 md:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
        {/* Daftar paket */}
        <div className="space-y-2">
          {items.map((it) => {
            const q = quoteCartItem(it);
            const p = q?.product ?? getTestPrepProduct(it.productId);
            if (!q || !p) return null;
            const key = cartItemKey(it);
            const lvl = p.levels.find((l) => l.id === it.level)?.label ?? it.level;
            return (
              <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: p.accent }}>
                  <RectFlag code={p.flagCode} h={12} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight text-slate-900">{judulPaket(p.test, lvl)} <span className="font-medium text-slate-500">· {namaBahasa(p.language)}</span></p>
                  <p className="text-[11px] leading-snug text-slate-500">
                    {it.format === "semi" ? `Semi-Private · ${SEMI_SESSIONS} sesi · per orang` : `Private 1-on-1 · ${q.quote.sessions} sesi`} @{SESSION_MINUTES} mnt
                  </p>
                </div>
                <p className="shrink-0 text-sm font-extrabold tabular-nums text-slate-900">{formatRupiah(q.quote.amount)}</p>
                <button onClick={() => onRemove(key)} disabled={loading} aria-label="Hapus paket"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Keranjang kosong.</p>
          )}
          {items.length < CART_MAX_ITEMS && (
            <button onClick={onAddMore} disabled={loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-teal-300 hover:text-teal-600">
              <Plus className="h-4 w-4" /> Tambah paket lain
            </button>
          )}
          {adaSemi && (
            <p className="text-[11px] leading-relaxed text-slate-400">
              Paket semi-private ditagih <b>per orang</b>; anggota grup lain membayar porsinya masing-masing lewat halaman ini.
            </p>
          )}
        </div>

        {/* Identitas + total */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500">Data pendaftar</p>
          <input value={ident.name} onChange={set("name")} placeholder="Nama lengkap" disabled={loading} className={inputCls} />
          <input type="email" value={ident.email} onChange={set("email")} placeholder="email@contoh.com" disabled={loading} className={inputCls} />
          <input type="tel" value={ident.wa} onChange={set("wa")} placeholder="Nomor WhatsApp (08...)" disabled={loading} className={inputCls} />
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-500">Total {items.length} paket</span>
              <span className="text-2xl font-extrabold text-slate-900">{formatRupiah(total)}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Satu invoice untuk semua paket. Tiap kelas tetap tercatat terpisah.</p>
          </div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-100 p-4">
        <button onClick={checkout} disabled={loading || items.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition disabled:opacity-60"
          style={{ background: TEAL }}>
          {loading ? "Memproses..." : `Bayar ${formatRupiah(total)}`} {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-400">Pembayaran aman via Xendit: QRIS, GoPay, OVO, Dana, ShopeePay, Transfer Bank</p>
      </div>
    </Overlay>
  );
}

/* ── Kerangka modal: overlay + kartu lebar, isi tengah scroll, footer tetap ── */
let modalTerbuka = 0;
function Overlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  // Launcher chat (ChatWidget, z-index 9990) menimpa tombol "Bayar" di HP.
  // Selama ada modal terbuka, tandai <body> dan sembunyikan lewat CSS global.
  // Dihitung (bukan toggle): AnimatePresence menahan modal lama sampai animasi
  // keluar selesai, jadi cleanup-nya jalan SETELAH modal baru terpasang.
  useEffect(() => {
    modalTerbuka += 1;
    document.body.classList.add("tp-modal-open");
    return () => {
      modalTerbuka = Math.max(0, modalTerbuka - 1);
      if (modalTerbuka === 0) document.body.classList.remove("tp-modal-open");
    };
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full min-w-0 max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {children}
      </motion.div>
      <style>{`body.tp-modal-open .lingw-launcher, body.tp-modal-open .lingw-teaser { display: none !important; }`}</style>
    </motion.div>
  );
}

/* Teks bullet dibungkus <span>: kalau dibiarkan telanjang di dalam flex, tiap
   potongan teks dan <b> jadi item flex sendiri-sendiri dan pecah ke kolom. */
function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
