"use client";
// ebook-xendit-v3 — checkout Xendit otomatis
// [ebook-satuan-only-v1] Blok pemilih paket (Bundle Hemat/Populer/All-Access)
// DIHAPUS — skema bundle sudah tidak dipakai. Halaman cuma menjual e-book
// satuan: 1 bahasa per pembelian, harga mengikuti tier durasi akses.
// [ebook-durasi-akses-v1] Pemilih EDISI dihapus: landing cuma menjual seri "101
// new edition" (pengantar Bahasa Indonesia). Gantinya pemilih DURASI AKSES —
// 6 Bulan / 12 Bulan / Selamanya — persis tier di `digital_product_pricing`,
// supaya "mulai Rp 79.000" di iklan & etalase /toko cocok dengan harga di sini.
// [ebook-bahasa-dari-katalog-v1] Isi halaman dipindah ke sini dari page.tsx:
// daftar bahasanya sekarang datang dari DB (lihat src/lib/ebookBahasa.ts) lewat
// server component, bukan konstanta LANGS yang ditulis tangan — plus pratinjau
// Unit 1 dan kotak cari, karena 50+ bahasa tak lagi muat dibaca sekali lihat.
import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  CalendarClock, Check, FileText, Infinity as InfinityIcon, PenLine, RefreshCw,
  Star, Lock, Zap, Globe, X, ArrowLeft, Search, BookOpen, Loader2, Layers, Package,
} from "lucide-react";
import { LangSlugFlag } from "@/components/RectFlag";
import TautanLegal from "@/components/TautanLegal"; // [xendit-legal-links-v1]
// [ebook-harga-katalog-sync-v1] harga paket & daftar paket dipusatkan — halaman
// ini dan /api/create-invoice membaca tabel yang sama.
import {
  EBOOK_HARGA_TERENDAH,
  EBOOK_DURASI,
  hargaEbook,
  type EbookDurasiId,
} from "@/lib/ebookPricing";
import type { BahasaEbook, ModulEbook } from "@/lib/ebookBahasa";
// [ebook-level-paket-v1] Paket Lengkap A1–B2 = diskon keranjang yang dihitung
// /api/create-cart-invoice (lib/bundelEbook) — halaman ini cuma menampilkannya.
import { HARGA_PAKET_LENGKAP, LEVEL_PAKET } from "@/lib/bundelEbook";

/* [ebook-pratinjau-landing-v1] Reader yang sama dengan /toko/[slug] dan
   dashboard siswa — bentangan dua halaman, animasi balik, ketuk-kata-untuk-
   mendengar. Diimpor DINAMIS: bundelnya (pdf.js + latihan + panduan) ratusan KB
   dan halaman ini halaman jualan yang dibaca mesin pencari, jadi ia tak boleh
   ikut terunduh sampai tombolnya benar-benar ditekan. */
const EbookReader = dynamic(() => import("@/components/akun/EbookReader"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#3ED9C0]" aria-hidden />
        <p className="text-[13px] font-semibold text-white/60">Menyiapkan pratinjau…</p>
      </div>
    </div>
  ),
});

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

// referral-code-field-v1 — baca ref affiliate dari ?ref= URL, cookie linguo_ref, atau localStorage
const storedRef = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const p = new URLSearchParams(window.location.search).get("ref");
  if (p) return p;
  const c = ("; " + document.cookie).split("; linguo_ref=")[1]?.split(";")[0];
  return c || localStorage.getItem("linguo_ref") || undefined;
};

const featuresFor = (durasiLabel: string) => [
  "Format PDF",
  `Akses ${durasiLabel.toLowerCase()}`,
  "Kosakata praktis",
  "Latihan soal",
  "Contoh percakapan",
  "Update gratis",
];

const DURASI = EBOOK_DURASI;

type ModePaket = "satuan" | "lengkap";

const LEVEL_NAMA: Record<string, string> = {
  A1: "Pemula", A2: "Dasar", B1: "Menengah", B2: "Menengah Atas",
};

/** Seri yang punya keempat level → bisa dibeli sebagai Paket Lengkap. */
const lengkap = (b: BahasaEbook) =>
  LEVEL_PAKET.every((lv) => b.modul?.some((m) => m.level === lv));

export default function EbookKlien({ bahasa }: { bahasa: BahasaEbook[] }) {
  // [ebook-level-paket-v1] Satuan (1 level, pilih durasi) atau Paket Lengkap A1–B2.
  const [mode, setMode] = useState<ModePaket>("satuan");
  const [durasi, setDurasi] = useState<EbookDurasiId>("6bln");
  // [ebook-satuan-only-v1] satu bahasa per pembelian
  const [picked, setPicked] = useState<BahasaEbook | null>(null);
  const [level, setLevel] = useState<string>("A1");
  // [ebook-bahasa-dari-katalog-v1] 50+ bahasa → kotak cari, bukan gulir panjang.
  const [cari, setCari] = useState("");
  const [baca, setBaca] = useState(false);

  // ── checkout Xendit ──
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  // referral-code-field-v1 — optional kode referral; default KOSONG (input manual).
  // Affiliate tetap ke-track lewat cookie linguo_ref / ?ref= saat submit (lihat bawah).
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const durasiLabel = DURASI.find((d) => d.id === durasi)?.label ?? "6 Bulan";
  const durasiTier = DURASI.find((d) => d.id === durasi)?.tierLabel ?? "6 Bulan";
  const paket = mode === "lengkap";
  const selamanya = paket || durasi === "selamanya";
  const aksesLabel = selamanya ? "akses selamanya" : `akses ${durasiLabel.toLowerCase()}`;

  const jumlahLengkap = useMemo(() => bahasa.filter(lengkap).length, [bahasa]);
  const jumlahModul = useMemo(
    () => bahasa.reduce((n, b) => n + (b.modul?.length || 1), 0),
    [bahasa],
  );

  // Modul (level) yang sedang dilihat. Bahasa cadangan tak punya daftar modul →
  // null, dan checkout jatuh ke jalur lama /api/create-invoice (hanya A1).
  const modulAktif: ModulEbook | null = useMemo(() => {
    if (!picked?.modul?.length) return null;
    return picked.modul.find((m) => m.level === level) ?? picked.modul[0];
  }, [picked, level]);

  const tierAktif = modulAktif?.tiers.find((t) => t.label === durasiTier) ?? null;
  const normalPaket = (picked?.modul ?? []).reduce(
    (n, m) => n + (m.tiers.find((t) => t.days === null)?.price ?? hargaEbook("selamanya", "satuan")),
    0,
  );
  const price = paket ? HARGA_PAKET_LENGKAP : tierAktif?.price ?? hargaEbook(durasi, "satuan");
  const ready = picked !== null && (!paket || lengkap(picked));

  // Cocokkan nama Indonesia MAUPUN nama katalog: yang mengetik "romanian" atau
  // "dansk" sama-sama sedang mencari buku yang ada.
  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    const dasar = paket ? bahasa.filter(lengkap) : bahasa;
    if (!q) return dasar;
    return dasar.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.katalog.toLowerCase().includes(q) ||
        b.judul.toLowerCase().includes(q),
    );
  }, [bahasa, cari, paket]);

  const kunciOf = (b: BahasaEbook) => b.kunci ?? b.katalog;
  const toggleLang = (b: BahasaEbook) => {
    setPicked((prev) => (prev && kunciOf(prev) === kunciOf(b) ? null : b));
    // level yang sedang dipilih dipertahankan kalau bahasanya punya; selain itu A1
    if (!b.modul?.some((m) => m.level === level)) setLevel(b.modul?.[0]?.level ?? "A1");
  };

  const gantiMode = (m: ModePaket) => {
    setMode(m);
    if (m === "lengkap" && picked && !lengkap(picked)) setPicked(null);
  };

  const judulPesanan = picked
    ? paket
      ? `Paket Lengkap ${picked.label} A1–B2`
      : `E-Book ${picked.label} ${modulAktif?.level ?? "A1"}`
    : "";

  const checkout = async () => {
    if (!picked) return;
    if (!name.trim() || !email.trim() || !wa.trim()) {
      setError("Lengkapi nama, email, dan WhatsApp.");
      return;
    }
    if (!email.includes("@")) {
      setError("Email belum valid.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cleanWa = wa.replace(/\D/g, "").replace(/^0/, "");
      const ref = refCode.trim() || storedRef() || undefined;

      // [ebook-level-paket-v1] Jalur utama: keranjang tamu. Server menghitung
      // ulang harga dari digital_product_pricing, menerapkan Paket Lengkap, dan
      // membuang modul yang sudah dimiliki email ini.
      const items = paket
        ? (picked.modul ?? []).map((m) => {
            const t = m.tiers.find((x) => x.days === null);
            return t ? { productId: m.productId, pricingId: t.id } : null;
          })
        : modulAktif && tierAktif
          ? [{ productId: modulAktif.productId, pricingId: tierAktif.id }]
          : [];
      const sah = items.filter((x): x is { productId: string; pricingId: string } => !!x);

      if (sah.length > 0) {
        const res = await fetch("/api/create-cart-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buyer_name: name.trim(),
            buyer_email: email.trim(),
            buyer_phone: `62${cleanWa}`,
            referral_code: ref,
            items: sah,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.invoice_url) throw new Error(data.error || "Gagal membuat invoice");
        window.location.href = data.invoice_url;
        return;
      }

      // Cadangan: katalog gagal dimuat saat render → jalur lama (nama bahasa, A1).
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          wa_number: cleanWa,
          // Nama INDONESIA: edge fn xendit-webhook menerjemahkannya balik ke nama
          // katalog lewat EBOOK_LANG_TO_CATALOG sebelum mencari produknya.
          language: picked.label,
          // ebook-program-label-v1 — eksplisit "e-book" (dikenal PROGRAM_LABELS admin).
          program: "e-book",
          productKey: `ebook-satuan-id-${durasi}`,
          referral_source: ref,
          ref_code: ref,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat invoice");
      window.location.href = data.invoice_url;
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      {/* [ebook-durasi-akses-v1] Offset --promo-bar-h: bar batch reguler itu `fixed`,
          jadi header `top-0` ketutupan olehnya dan tombol kembali ke beranda ikut hilang. */}
      <header className="sticky top-[var(--promo-bar-h,0px)] z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-800 hover:text-teal-600">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-bold text-lg">Linguo.id</span>
          </Link>
          <a href="https://wa.me/6282116859493" target="_blank" className="text-sm text-teal-600 font-medium">
            Butuh bantuan?
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-teal-50" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm font-medium text-indigo-700">E-Book Digital Linguo</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
            E-Book Belajar Bahasa
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-teal-500">
              Mulai dari {formatRp(EBOOK_HARGA_TERENDAH)}
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Modul lengkap dari basic hingga intermediate. Kosakata praktis, contoh percakapan, dan latihan soal — bisa dipelajari kapan saja.
          </p>
          {bahasa.length > 0 && (
            <p className="mt-4 text-sm font-semibold text-indigo-600">
              {bahasa.length} bahasa tersedia · Unit 1 bisa dibaca gratis sebelum beli
            </p>
          )}
        </div>
      </section>

      {/* [ebook-level-paket-v1] Jenis pembelian: satuan per level atau Paket Lengkap */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-2">
        <h2 className="text-xl font-bold text-slate-900 text-center mb-1">Pilih Jenis Pembelian</h2>
        <p className="text-sm text-slate-500 text-center mb-5">
          Beli satu level dulu, atau langsung ambil seri lengkap dari A1 sampai B2.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {([
            {
              id: "satuan" as const,
              Icon: BookOpen,
              judul: "Satuan per Level",
              harga: `mulai ${formatRp(EBOOK_HARGA_TERENDAH)}`,
              ket: "1 e-book · pilih level & durasi akses",
            },
            {
              id: "lengkap" as const,
              Icon: Layers,
              judul: "Paket Lengkap A1–B2",
              harga: formatRp(HARGA_PAKET_LENGKAP),
              ket: `4 e-book · akses selamanya · ${jumlahLengkap} bahasa`,
            },
          ]).map((o) => {
            const on = mode === o.id;
            return (
              <button
                key={o.id}
                onClick={() => gantiMode(o.id)}
                className={`relative flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                  on ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                {o.id === "lengkap" && (
                  <span className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    Hemat 50%
                  </span>
                )}
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${on ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <o.Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">{o.judul}</span>
                  <span className="block text-base font-extrabold text-slate-900">{o.harga}</span>
                  <span className="block text-[11px] text-slate-500">{o.ket}</span>
                </span>
              </button>
            );
          })}
        </div>

        {!paket && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-700 text-center mb-3">Durasi akses</p>
            <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
              {DURASI.map((d) => {
                const active = d.id === durasi;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDurasi(d.id)}
                    className={`relative rounded-2xl border-2 p-3 text-center transition-all ${
                      active ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"
                    }`}
                  >
                    {d.id === "selamanya" && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        Sekali beli
                      </span>
                    )}
                    <p className="text-sm font-semibold text-slate-900">{d.label}</p>
                    <p className="text-[15px] sm:text-lg font-extrabold text-slate-900 mt-0.5 whitespace-nowrap">
                      {formatRp(hargaEbook(d.id, "satuan"))}
                    </p>
                    <p className="text-[11px] text-slate-400">per e-book</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Pilih bahasa + ringkasan */}
      <section className="max-w-6xl mx-auto px-4 pt-6 pb-16">
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-5 md:p-8">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* [ebook-level-paket-v1] Grid bahasa lebar — dulu kotak gulir kecil
                yang cuma memperlihatkan 12 dari 50+ bahasa, terbaca "bahasanya dikit". */}
            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Pilih Bahasa Favoritmu</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {paket
                      ? `${tersaring.length} bahasa punya seri lengkap A1–B2.`
                      : `${bahasa.length} bahasa · ${jumlahModul} e-book dari A1 sampai B2.`}
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    type="search"
                    value={cari}
                    onChange={(e) => setCari(e.target.value)}
                    placeholder={`Cari dari ${paket ? jumlahLengkap : bahasa.length} bahasa…`}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                {tersaring.map((b) => {
                  const on = picked !== null && kunciOf(picked) === kunciOf(b);
                  const lv = b.modul?.map((m) => m.level) ?? ["A1"];
                  const rentang = lv.length > 1 ? `${lv[0]}–${lv[lv.length - 1]}` : lv[0];
                  return (
                    <button
                      key={kunciOf(b)}
                      onClick={() => toggleLang(b)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 rounded-xl text-[13px] sm:text-sm font-medium transition-all ${
                        on
                          ? "bg-indigo-500 text-white shadow-md"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      <LangSlugFlag slug={b.bendera} h={16} />
                      <span className="truncate flex-1 text-left">{b.label}</span>
                      <span
                        className={`shrink-0 rounded-md px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold ${
                          on ? "bg-white/20 text-white" : lv.length >= 4 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {rentang}
                      </span>
                    </button>
                  );
                })}
                {tersaring.length === 0 && (
                  <p className="col-span-full py-6 text-center text-xs text-slate-400">
                    Bahasa “{cari}” belum ada e-book-nya{paket ? " dalam seri lengkap" : ""}.
                    <br />
                    <a
                      href={`https://wa.me/6282116859493?text=${encodeURIComponent(
                        `Halo Linguo.id! Saya mencari e-book bahasa ${cari}.`,
                      )}`}
                      target="_blank"
                      className="font-semibold text-indigo-500"
                    >
                      Tanyakan ke tim kami
                    </a>
                  </p>
                )}
              </div>
              {!paket && (
                <p className="mt-3 text-[11px] text-slate-400">
                  Label hijau = seri lengkap A1–B2 tersedia (bisa diambil sebagai Paket Lengkap).
                </p>
              )}
            </div>

            {/* Ringkasan pesanan */}
            <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-[calc(var(--promo-bar-h,0px)+80px)] bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="inline-flex items-center gap-1.5 bg-indigo-100 rounded-full px-3 py-1 mb-3 text-xs font-semibold text-indigo-700">
                {paket ? <Package className="h-3.5 w-3.5" aria-hidden /> : <BookOpen className="h-3.5 w-3.5" aria-hidden />}
                {paket ? "4 E-Book · Akses Selamanya" : `1 E-Book · Akses ${durasiLabel}`}
              </span>

              {!picked ? (
                <p className="text-sm text-slate-500">Pilih bahasa dulu di sebelah kiri.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <LangSlugFlag slug={picked.bendera} h={18} />
                    <p className="font-bold text-slate-900">{picked.label}</p>
                  </div>

                  {/* Level */}
                  {!paket && picked.modul && picked.modul.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Pilih level</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {LEVEL_PAKET.map((lv) => {
                          const ada = picked.modul!.some((m) => m.level === lv);
                          const on = modulAktif?.level === lv;
                          return (
                            <button
                              key={lv}
                              disabled={!ada}
                              onClick={() => setLevel(lv)}
                              title={ada ? LEVEL_NAMA[lv] : "Segera terbit"}
                              className={`rounded-lg py-2 text-sm font-bold transition ${
                                on
                                  ? "bg-indigo-500 text-white shadow"
                                  : ada
                                    ? "bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:ring-indigo-300"
                                    : "bg-slate-50 text-slate-300 cursor-not-allowed"
                              }`}
                            >
                              {lv}
                            </button>
                          );
                        })}
                      </div>
                      {modulAktif && (
                        <p className="mt-1.5 text-[11px] text-slate-400">
                          {modulAktif.level} · {LEVEL_NAMA[modulAktif.level]}
                          {picked.modul.length < 4 && " · level lain segera terbit"}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Sampul */}
                  {paket ? (
                    <div className="mb-4 grid grid-cols-4 gap-1.5">
                      {(picked.modul ?? []).map((m) => (
                        <div key={m.level} className="text-center">
                          <div className="aspect-[1/1.414] overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                            {m.cover && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.cover} alt={m.judul} loading="lazy" className="h-full w-full object-cover object-top" />
                            )}
                          </div>
                          <span className="mt-1 block text-[10px] font-bold text-slate-500">{m.level}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-4 flex items-center gap-3">
                      {(modulAktif?.cover ?? picked.cover) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(modulAktif?.cover ?? picked.cover)!}
                          alt={`Sampul ${modulAktif?.judul ?? picked.judul}`}
                          className="h-24 w-[68px] shrink-0 rounded-lg object-cover object-top ring-1 ring-slate-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-24 w-[68px] shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <BookOpen className="h-6 w-6 text-slate-400" aria-hidden />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 line-clamp-2">{modulAktif?.judul ?? picked.judul}</p>
                        <p className="mt-0.5 text-xs text-slate-500">PDF · {aksesLabel}</p>
                        {(modulAktif?.pratinjau ?? picked.pratinjau) && (
                          <button
                            onClick={() => setBaca(true)}
                            className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 hover:text-indigo-700"
                          >
                            <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                            Baca Gratis Unit 1
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-baseline gap-2 border-t border-slate-100 pt-3">
                <span className="text-3xl font-extrabold text-slate-900">{formatRp(price)}</span>
                <span className="text-xs text-slate-400">{paket ? "/ 4 e-book" : "/ e-book"}</span>
              </div>
              {paket && picked && normalPaket > price && (
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="line-through">{formatRp(normalPaket)}</span>{" "}
                  <span className="font-bold text-emerald-600">hemat {formatRp(normalPaket - price)}</span>
                </p>
              )}
              <ul className="mt-3 space-y-1.5">
                {(paket
                  ? ["A1, A2, B1, B2 sekaligus", "Akses selamanya", "Kosakata, latihan & percakapan", "Update gratis"]
                  : featuresFor(selamanya ? "Selamanya" : durasiLabel).slice(0, 4)
                ).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={!ready}
                onClick={() => {
                  setError("");
                  setOpen(true);
                }}
                className="w-full mt-4 py-3 rounded-2xl font-bold text-sm bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 transition-all"
              >
                {ready ? `Beli ${paket ? "Paket" : "E-Book"} — ${formatRp(price)}` : "Pilih bahasa dulu"}
              </button>
              <a
                href={`https://wa.me/6282116859493?text=${encodeURIComponent(
                  `Halo Linguo.id! Saya mau tanya soal ${
                    picked ? (paket ? `Paket Lengkap A1–B2 bahasa ${picked.label}` : `e-book bahasa ${picked.label} level ${modulAktif?.level ?? "A1"} (akses ${durasiLabel})`) : "e-book"
                  }.`,
                )}`}
                target="_blank"
                className="block text-center text-xs text-slate-400 hover:text-indigo-500 mt-2.5"
              >
                atau tanya dulu via WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Feature strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { Icon: FileText, l: "Format PDF", s: "Buka di HP / laptop" },
            selamanya
              ? { Icon: InfinityIcon, l: "Akses Selamanya", s: "Sekali beli, simpan terus" }
              : { Icon: CalendarClock, l: `Akses ${durasiLabel}`, s: "Perpanjang kapan saja" },
            { Icon: PenLine, l: "Latihan Soal", s: "Latih pemahamanmu" },
            { Icon: RefreshCw, l: "Update Gratis", s: "Revisi terbaru gratis" },
          ].map((f) => (
            <div key={f.l} className="bg-slate-50 rounded-2xl p-5 text-center">
              <f.Icon className="h-6 w-6 mx-auto mb-2 text-indigo-500" strokeWidth={1.75} />
              <p className="text-sm font-semibold text-slate-900">{f.l}</p>
              <p className="text-xs text-slate-400 mt-1">{f.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Apa Kata Mereka?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "Budi S.", t: "E-book materinya lengkap dan rapi, jelas banget penjelasannya." },
            { n: "Lia P.", t: "Harganya terjangkau, materinya cocok buat belajar sendiri di rumah." },
            { n: "Andi W.", t: "Format PDF-nya enak dibaca di HP pas lagi senggang." },
          ].map((t, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-6">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 mb-4">&ldquo;{t.t}&rdquo;</p>
              <p className="text-sm font-semibold text-slate-900">{t.n}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-slate-50 rounded-3xl p-8 flex flex-wrap items-center justify-center gap-8">
          {[
            { Icon: Lock, l: "Pembayaran Aman" },
            { Icon: Zap, l: "Akses Instan" },
            // Angkanya ikut katalog: dulu tertulis "20+ Bahasa" padahal daftarnya
            // pas 20 dan katalognya sudah jauh lebih panjang.
            { Icon: Globe, l: `${bahasa.length || 20}+ Bahasa` },
            { Icon: Star, l: "Google Review 5.0" },
          ].map((b) => (
            <span key={b.l} className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <b.Icon className="h-4 w-4 text-slate-400" strokeWidth={2} />
              {b.l}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="text-sm text-slate-400">© 2026 Linguo.id</p>
            <TautanLegal className="text-xs text-slate-500" />
          </div>
          <div className="flex gap-4">
            <a href="https://wa.me/6282116859493" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">WhatsApp</a>
            <a href="https://instagram.com/linguo.id" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">Instagram</a>
            <a href="https://tiktok.com/@linguoid" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">TikTok</a>
          </div>
        </div>
      </footer>

      {/* [ebook-pratinjau-landing-v1] Cicipan Unit 1 — tanpa akun. Yang menjaga
          halaman berbayarnya bukan gerbang login, melainkan servernya:
          /api/ebook/pratinjau-publik memotong PDF-nya dan cuma mengirim Unit 1. */}
      {baca && picked && (
        <EbookReader
          purchaseId={`pratinjau:${modulAktif?.slug ?? picked.slug}`}
          accessToken=""
          title={modulAktif?.judul ?? picked.judul}
          language={picked.katalog}
          pratinjauUrl={`/api/ebook/pratinjau-publik?slug=${encodeURIComponent(modulAktif?.slug ?? picked.slug)}`}
          onBeli={() => {
            setBaca(false);
            setError("");
            setTimeout(() => setOpen(true), 120);
          }}
          onClose={() => setBaca(false)}
        />
      )}

      {/* Checkout modal — Xendit */}
      {open && picked && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-indigo-100 text-xs">Checkout E-Book</p>
                  <h3 className="text-lg font-bold">
                    {judulPesanan} · Akses {paket ? "Selamanya" : durasiLabel}
                  </h3>
                </div>
                <button
                  onClick={() => !loading && setOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-white/20 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-2xl font-extrabold mt-2">{formatRp(price)}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 rounded-xl px-4 py-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Bahasa:</span> {picked.label}
                {" · "}
                <span className="font-semibold text-slate-800">Level:</span>{" "}
                {paket ? "A1, A2, B1, B2" : modulAktif?.level ?? "A1"}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <p className="text-[11px] text-slate-400 mt-1">E-book langsung terbuka di linguo.id/akun (Perpustakaan) dengan email ini setelah bayar.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">WhatsApp</label>
                <input
                  type="tel"
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  placeholder="0821xxxxxxxx"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              {/* referral-code-field-v1 — optional, sama seperti funnel kelas */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kode Referral (opsional)</label>
                <input
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  placeholder="Masukkan kode referral jika ada"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <p className="text-[11px] text-slate-400 mt-1">Dapatkan dari teman atau afiliator Linguo</p>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
              <button
                onClick={checkout}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
              >
                {loading ? "Memproses..." : `Bayar ${formatRp(price)}`}
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                Pembayaran aman via Xendit: QRIS, GoPay, OVO, Dana, ShopeePay, Transfer Bank
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
