"use client";

// [onboarding-belanja-v1] Belanja produk digital langsung DARI onboarding /akun.
//
// Kenapa ada: langkah "Program" di OnboardingWizard cuma menawarkan empat kelas
// dengan pengajar, dan semuanya berakhir di WhatsApp — padahal tiga produk yang
// bisa dibeli & dipakai DETIK ITU JUGA (Simulasi Tes, E-Book, E-Learning) tak
// pernah disebut sama sekali. Orang yang cuma mau modul belajar mandiri harus
// menyelesaikan wizard kelas dulu, mendarat di dashboard, menemukan
// Perpustakaan sendiri, baru bisa membayar.
//
// Layar ini memotong jalur itu: pilih produk → keranjang → satu invoice Xendit.
//
// SATU invoice untuk isi keranjang — termasuk campuran e-book, e-learning, dan
// Simulasi Tes. Yang menyatukannya `/api/create-cart-invoice`; harga dibaca
// ULANG di server (tier katalog + harga simulasi), jadi angka di layar ini
// murni tampilan dan tak bisa dipakai menawar.
//
// Baris `students` dibuat SEBELUM redirect ke Xendit (POST /api/enroll dengan
// profile_only) supaya pembeli yang belum punya kelas tetap punya dashboard
// waktu balik dari pembayaran — tanpa itu, /akun melemparnya ke wizard lagi dan
// produk yang sudah dibayar seperti hilang.

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, BookMarked, Check, ClipboardCheck, Loader2, MonitorPlay,
  Plus, Search, ShoppingCart, Trash2, Sparkles, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { FLAG_CODE_BY_SLUG, RectFlag } from "@/components/RectFlag";
import {
  loadKatalogDigital, judulRingkas, labelBahasa, hargaMulai, tierDefault,
  fmtRupiah, type ProdukKatalog, type TierKatalog,
} from "@/lib/katalogDigital";

export type KategoriBelanja = "simulasi" | "ebook" | "elearning";

/** Baris keranjang. `kind` menentukan bentuk payload checkout-nya. */
type ItemBelanja =
  | {
      kind: "digital";
      key: string;
      productId: string;
      pricingId: string;
      judul: string;
      sub: string;
      harga: number;
      tipe: "ebook" | "elearning";
      bahasa: string | null;
    }
  | {
      kind: "simulasi";
      key: string;
      testType: "toefl" | "ielts";
      judul: string;
      sub: string;
      harga: number;
    };

// Harga simulasi ditulis di sini HANYA untuk tampilan; server memakai
// PRODUCT_PRICES/promoAmountFor sendiri (lihat api/create-cart-invoice).
const SIM_HARGA = 79000;

// Paket simulasi yang benar-benar bisa dibeli. Cermin `soon:false` di
// lib/simulasiPakets — file itu menyeret ikon lucide lewat SKILL_META, jadi
// yang dibutuhkan di sini disalin seperlunya (dua jenis tes saja).
const SIM_PAKET: { testType: "toefl" | "ielts"; judul: string; sub: string; flag: string }[] = [
  { testType: "toefl", judul: "Simulasi TOEFL", sub: "Format ITP & iBT — sekali bayar, akses selamanya", flag: "us" },
  { testType: "ielts", judul: "Simulasi IELTS", sub: "Academic & General — sekali bayar, akses selamanya", flag: "gb" },
];

const KATEGORI_META: Record<KategoriBelanja, { label: string; icon: typeof BookMarked; tint: string; desc: string }> = {
  simulasi: { label: "Simulasi Tes", icon: ClipboardCheck, tint: "bg-violet-50 text-violet-600", desc: "Full test + skor & pembahasan otomatis" },
  ebook: { label: "E-Book", icon: BookMarked, tint: "bg-amber-50 text-amber-600", desc: "Modul belajar mandiri per bahasa" },
  elearning: { label: "E-Learning", icon: MonitorPlay, tint: "bg-sky-50 text-sky-600", desc: "Rekaman kelas, belajar kapan saja" },
};

function Bendera({ bahasa }: { bahasa: string | null }) {
  const code = bahasa ? FLAG_CODE_BY_SLUG[bahasa.trim().toLowerCase()] : undefined;
  if (!code) return <span className="inline-block h-[15px] w-[22px] rounded-sm bg-gray-100" />;
  return <RectFlag code={code} h={15} className="shadow-sm" />;
}

export default function OnboardingBelanja({
  user, kategoriAwal, onKembali, onSelesai,
}: {
  user: any;
  kategoriAwal: KategoriBelanja;
  /** Balik ke langkah "Program" di wizard. */
  onKembali: () => void;
  /** Dipanggil kalau pembeli memilih membuka dashboard tanpa membayar dulu. */
  onSelesai: () => void;
}) {
  const [kategori, setKategori] = useState<KategoriBelanja>(kategoriAwal);
  const [katalog, setKatalog] = useState<ProdukKatalog[] | null>(null);
  const [cari, setCari] = useState("");
  const [keranjang, setKeranjang] = useState<ItemBelanja[]>([]);
  const [layar, setLayar] = useState<"pilih" | "bayar">("pilih");
  const [nama, setNama] = useState(user?.user_metadata?.full_name || "");
  const [wa, setWa] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  /** Produk yang tier-nya sedang dipilih (e-book/e-learning punya 2–3 durasi). */
  const [pilihTier, setPilihTier] = useState<ProdukKatalog | null>(null);

  useEffect(() => {
    let hidup = true;
    loadKatalogDigital(supabase)
      .then((r) => { if (hidup) setKatalog(r); })
      .catch(() => { if (hidup) setKatalog([]); });
    return () => { hidup = false; };
  }, []);

  const email = user?.email as string | undefined;
  const waDigits = wa.replace(/\D/g, "");
  const waNorm = waDigits.startsWith("0") ? "62" + waDigits.slice(1)
    : waDigits.startsWith("8") ? "62" + waDigits : waDigits;
  const waValid = waNorm.startsWith("62") && waNorm.length >= 10 && waNorm.length <= 15;
  const dataValid = nama.trim().length >= 2 && waValid;

  const total = keranjang.reduce((n, x) => n + x.harga, 0);
  const punya = (key: string) => keranjang.some((x) => x.key === key);

  const daftar = useMemo(() => {
    if (kategori === "simulasi" || !katalog) return [];
    const q = cari.trim().toLowerCase();
    return katalog
      .filter((p) => p.type === kategori)
      .filter((p) => !q || `${p.title} ${p.language ?? ""} ${labelBahasa(p.language ?? "")}`.toLowerCase().includes(q))
      .sort((a, b) => (a.language ?? "").localeCompare(b.language ?? "") || a.title.localeCompare(b.title));
  }, [katalog, kategori, cari]);

  const tambahDigital = (p: ProdukKatalog, tier: TierKatalog) => {
    setKeranjang((isi) => [
      ...isi.filter((x) => x.key !== `d:${p.id}`),
      {
        kind: "digital", key: `d:${p.id}`, productId: p.id, pricingId: tier.id,
        judul: judulRingkas(p.title),
        sub: `${KATEGORI_META[p.type].label}${tier.display_label ? ` · ${tier.display_label}` : ""}`,
        harga: tier.price, tipe: p.type, bahasa: p.language,
      },
    ]);
    setPilihTier(null);
    toast.success(`${judulRingkas(p.title)} masuk keranjang`);
  };

  const toggleSim = (s: (typeof SIM_PAKET)[number]) => {
    const key = `s:${s.testType}`;
    if (punya(key)) { setKeranjang((isi) => isi.filter((x) => x.key !== key)); return; }
    setKeranjang((isi) => [...isi, {
      kind: "simulasi", key, testType: s.testType, judul: s.judul,
      sub: "Simulasi Tes · akses selamanya", harga: SIM_HARGA,
    }]);
    toast.success(`${s.judul} masuk keranjang`);
  };

  const klikProduk = (p: ProdukKatalog) => {
    if (punya(`d:${p.id}`)) { setKeranjang((isi) => isi.filter((x) => x.key !== `d:${p.id}`)); return; }
    // Satu tier = langsung masuk; lebih dari satu = pembeli pilih durasinya dulu.
    if (p.pricing.length === 1) { tambahDigital(p, p.pricing[0]); return; }
    setPilihTier(p);
  };

  /** Baris students dibuat lebih dulu — lihat catatan kepala berkas. */
  const simpanProfil = async () => {
    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_only: true,
        email,
        name: nama.trim(),
        wa_number: waNorm || null,
        avatar_url: user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null,
        lead_source: "Onboarding Belanja",
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({} as any));
      throw new Error(j?.error || `Gagal menyimpan data (HTTP ${res.status})`);
    }
    try { localStorage.setItem(`linguo_onboarded_${user?.id || email}`, "1"); } catch {}
  };

  const bayar = async () => {
    if (keranjang.length === 0) { setGalat("Keranjang masih kosong."); return; }
    if (!dataValid) { setGalat("Lengkapi nama & nomor WhatsApp dulu."); return; }
    setSibuk(true); setGalat("");
    try {
      await simpanProfil();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/create-cart-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: session?.access_token ?? "",
          items: keranjang.filter((x): x is Extract<ItemBelanja, { kind: "digital" }> => x.kind === "digital")
            .map((x) => ({ productId: x.productId, pricingId: x.pricingId })),
          sim_items: keranjang.filter((x): x is Extract<ItemBelanja, { kind: "simulasi" }> => x.kind === "simulasi")
            .map((x) => ({ testType: x.testType })),
        }),
      });
      const j = await res.json().catch(() => ({} as any));
      if (!res.ok || !j?.invoice_url) throw new Error(j?.error || `Gagal membuat tagihan (HTTP ${res.status})`);
      // Item yang gugur di server (sudah dimiliki / materi belum siap) dilaporkan
      // apa adanya — jangan diam-diam menagih lebih sedikit dari yang dipilih.
      if (Array.isArray(j.ditolak) && j.ditolak.length > 0) {
        toast.warning(`Tidak ikut ditagih: ${j.ditolak.join("; ")}`);
      }
      window.location.href = j.invoice_url;
    } catch (e: any) {
      console.error("[onboarding-belanja] checkout gagal:", e);
      setGalat(e?.message || "Gagal membuat tagihan. Coba lagi sebentar.");
      setSibuk(false);
    }
  };

  const lewati = async () => {
    setSibuk(true);
    try { await simpanProfil(); } catch (e) { console.warn("[onboarding-belanja] profil gagal:", e); }
    onSelesai();
  };

  // ── Layar 2: data diri + rincian tagihan ─────────────────────────────────
  if (layar === "bayar") {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-br from-teal-50 via-white to-teal-50">
        <div className="mx-auto w-full max-w-lg px-5 py-8">
          <button onClick={() => setLayar("pilih")} className="mb-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-4 w-4" /> Kembali ke keranjang
          </button>
          <h2 className="text-xl font-extrabold text-gray-900">Satu langkah lagi</h2>
          <p className="mt-1 text-sm text-gray-400">Data ini dipakai untuk tagihan &amp; pengiriman akses.</p>

          <div className="mt-5 space-y-3 rounded-2xl bg-white p-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Email</label>
              <div className="truncate rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-500">{email || "—"}</div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Nama lengkap</label>
              <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap kamu"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-300" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Nomor WhatsApp aktif</label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-gray-300">
                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-600">
                  <RectFlag code="id" h={14} /> +62
                </span>
                <input value={wa} onChange={(e) => setWa(e.target.value)} inputMode="numeric" placeholder="812 3456 7890"
                  className="w-full bg-white px-4 py-2.5 text-sm outline-none" />
              </div>
              {wa.length > 0 && !waValid && (
                <p className="mt-1.5 text-[11px] text-red-500">Masukkan nomor WhatsApp yang valid (tanpa 0 di depan)</p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Rincian</p>
            {keranjang.map((x) => (
              <div key={x.key} className="flex items-start justify-between gap-3 py-1.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-gray-800">{x.judul}</span>
                  <span className="block text-[11px] text-gray-400">{x.sub}</span>
                </span>
                <span className="shrink-0 font-semibold text-gray-700">{fmtRupiah(x.harga)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
              <span className="font-bold text-gray-800">Total</span>
              <span className="text-lg font-extrabold text-teal-700">{fmtRupiah(total)}</span>
            </div>
          </div>

          {galat && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{galat}</span>
            </div>
          )}

          <button onClick={bayar} disabled={sibuk || !dataValid}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98] ${
              sibuk || !dataValid ? "cursor-not-allowed bg-gray-200 text-gray-400" : "bg-teal-600 text-white shadow-md shadow-teal-200 hover:bg-teal-700"}`}>
            {sibuk ? <><Loader2 className="h-5 w-5 animate-spin" /> Menyiapkan tagihan…</> : <>Bayar {fmtRupiah(total)}</>}
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Pembayaran diproses Xendit — QRIS, VA bank, e-wallet, kartu.
          </p>
        </div>
      </div>
    );
  }

  // ── Layar 1: pilih produk + keranjang ────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-br from-teal-50 via-white to-teal-50 pb-32">
      <div className="mx-auto w-full max-w-lg px-5 py-6">
        <button onClick={onKembali} className="mb-4 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> Ganti program
        </button>

        <div className="mb-5 text-center">
          <div className="mb-3 flex justify-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><Sparkles className="h-6 w-6" /></span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Belajar mandiri, akses instan</h2>
          <p className="mt-1 text-sm text-gray-400">Pilih sebanyak yang kamu mau — bayarnya sekali.</p>
        </div>

        {/* Tab kategori */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {(Object.keys(KATEGORI_META) as KategoriBelanja[]).map((k) => {
            const m = KATEGORI_META[k];
            const Icon = m.icon;
            const aktif = kategori === k;
            return (
              <button key={k} onClick={() => { setKategori(k); setCari(""); }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center transition-all active:scale-95 ${aktif ? "bg-white shadow-sm ring-1 ring-teal-200" : "bg-gray-50 hover:bg-gray-100"}`}>
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${m.tint}`}><Icon className="h-4.5 w-4.5" /></span>
                <span className={`text-[11px] font-bold ${aktif ? "text-teal-700" : "text-gray-600"}`}>{m.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mb-3 text-center text-[11px] text-gray-400">{KATEGORI_META[kategori].desc}</p>

        {/* Daftar produk */}
        {kategori === "simulasi" ? (
          <div className="space-y-3">
            {SIM_PAKET.map((s) => {
              const dipilih = punya(`s:${s.testType}`);
              return (
                <button key={s.testType} onClick={() => toggleSim(s)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98] ${dipilih ? "bg-teal-50 ring-1 ring-teal-300" : "bg-white hover:bg-gray-50"}`}>
                  <RectFlag code={s.flag} h={22} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-gray-800">{s.judul}</span>
                    <span className="block text-[11px] text-gray-400">{s.sub}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-teal-600">{fmtRupiah(SIM_HARGA)}</span>
                  </span>
                  <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${dipilih ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {dipilih ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="relative mb-3">
              <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari bahasa…"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-gray-300" />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {katalog === null ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat katalog…
              </div>
            ) : daftar.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Belum ada produk yang cocok.</div>
            ) : (
              <div className="max-h-[46vh] space-y-2 overflow-y-auto pb-1">
                {daftar.map((p) => {
                  const dipilih = punya(`d:${p.id}`);
                  const mulai = hargaMulai(p);
                  return (
                    <button key={p.id} onClick={() => klikProduk(p)}
                      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all active:scale-[0.98] ${dipilih ? "bg-teal-50 ring-1 ring-teal-300" : "bg-white hover:bg-gray-50"}`}>
                      <Bendera bahasa={p.language} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-gray-800">{judulRingkas(p.title)}</span>
                        <span className="block text-[11px] text-gray-400">
                          {p.language ? labelBahasa(p.language) : "—"}
                          {p.level ? ` · ${p.level}` : ""}
                          {p.pricing.length > 1 ? " · pilih durasi" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs font-semibold text-teal-600">
                          {mulai !== null ? (p.pricing.length > 1 ? `dari ${fmtRupiah(mulai)}` : fmtRupiah(mulai)) : "—"}
                        </span>
                        <span className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${dipilih ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                          {dipilih ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Isi keranjang */}
        {keranjang.length > 0 && (
          <div className="mt-5 rounded-2xl bg-white p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
              <ShoppingCart className="h-3.5 w-3.5" /> Keranjang ({keranjang.length})
            </p>
            {keranjang.map((x) => (
              <div key={x.key} className="flex items-center justify-between gap-2 border-t border-gray-50 py-2 first:border-t-0 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-gray-800">{x.judul}</span>
                  <span className="block text-[11px] text-gray-400">{x.sub}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-gray-700">{fmtRupiah(x.harga)}</span>
                  <button onClick={() => setKeranjang((isi) => isi.filter((y) => y.key !== x.key))}
                    className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Keluarkan">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        <button onClick={lewati} disabled={sibuk}
          className="mt-5 w-full py-2 text-sm text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50">
          Lihat dashboard dulu →
        </button>
      </div>

      {/* Bilah bayar — menempel di bawah supaya total selalu kelihatan */}
      {keranjang.length > 0 && (
        <motion.div initial={{ y: 60 }} animate={{ y: 0 }}
          className="fixed inset-x-0 bottom-0 z-[101] border-t border-gray-100 bg-white/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-lg items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] text-gray-400">{keranjang.length} produk</span>
              <span className="block text-lg font-extrabold text-teal-700">{fmtRupiah(total)}</span>
            </span>
            <button onClick={() => { setGalat(""); setLayar("bayar"); }}
              className="rounded-2xl bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-teal-200 transition-all hover:bg-teal-700 active:scale-[0.98]">
              Lanjut Bayar
            </button>
          </div>
        </motion.div>
      )}

      {/* Pilih durasi akses (produk bertier lebih dari satu) */}
      {pilihTier && (
        <div className="fixed inset-0 z-[102] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setPilihTier(null)}>
          <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <p className="text-sm font-extrabold text-gray-900">{judulRingkas(pilihTier.title)}</p>
            <p className="mb-3 text-[11px] text-gray-400">Pilih durasi akses</p>
            <div className="space-y-2">
              {pilihTier.pricing.map((t) => {
                const disarankan = tierDefault(pilihTier.pricing)?.id === t.id;
                return (
                  <button key={t.id} onClick={() => tambahDigital(pilihTier, t)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3 text-left transition-all hover:bg-teal-50 active:scale-[0.98]">
                    <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                      {t.display_label || (t.duration_days ? `${t.duration_days} hari` : "Selamanya")}
                      {disarankan && <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">Populer</span>}
                    </span>
                    <span className="shrink-0 text-sm font-extrabold text-teal-700">{fmtRupiah(t.price)}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPilihTier(null)} className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-gray-600">Batal</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
