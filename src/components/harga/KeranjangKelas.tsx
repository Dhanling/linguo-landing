"use client";
// =============================================================================
// [harga-keranjang-kelas-v1] Bilah keranjang + modal checkout untuk kalkulator
// /harga. Beberapa paket kelas (bahasa/level/format berbeda) dibayar lewat SATU
// invoice Xendit via /api/create-kelas-invoice.
//
// Sengaja tanpa framer-motion (halaman /harga tidak memakainya) — animasi
// masuk/keluar cukup transisi CSS supaya bundel halaman tidak bertambah.
// =============================================================================
import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { ShoppingCart, X, Trash2, Plus, ArrowRight, Users, User } from "lucide-react";
import { RectFlag } from "@/components/RectFlag";
import { formatRupiah } from "@/lib/trial-pricing";
import {
  cartItemKey, cartTotal, quoteKelasItem, loadIdentity, saveIdentity,
  CART_MAX_ITEMS, SESSION_MINUTES, type KelasCartItem,
} from "@/lib/kelasCart";

const TEAL = "#1A9E9E";

/** Label bahasa untuk ditampilkan (kartu memakai nama panjang untuk BIPA). */
export type LabelResolver = (language: string) => { label: string; code?: string };

// ── Bilah keranjang: menempel di bawah selama ada isi ────────────────────────
export function KeranjangBar({ items, onCheckout, hidden }: {
  items: KelasCartItem[];
  onCheckout: () => void;
  hidden?: boolean;
}) {
  if (!items.length || hidden) return null;
  return (
    // pr-24 di HP: launcher chat (Ling) duduk di pojok kanan bawah.
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pr-24 sm:pr-4">
      <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-2 pl-4 shadow-2xl backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-slate-500">
            {items.length} paket di keranjang · bisa tambah lagi
          </p>
          <p className="truncate text-base font-extrabold text-slate-900">{formatRupiah(cartTotal(items))}</p>
        </div>
        <button onClick={onCheckout}
          className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow"
          style={{ background: TEAL }}>
          Checkout <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Modal checkout ───────────────────────────────────────────────────────────
export function CheckoutKelasModal({ items, resolveLabel, onRemove, onAddMore, onClose, onPaid }: {
  items: KelasCartItem[];
  resolveLabel: LabelResolver;
  onRemove: (key: string) => void;
  onAddMore: () => void;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [ident, setIdent] = useState(() => loadIdentity());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const total = cartTotal(items);
  const adaSemi = items.some((it) => it.classType === "semi");

  const set = (k: keyof typeof ident) => (e: ChangeEvent<HTMLInputElement>) =>
    setIdent({ ...ident, [k]: e.target.value });

  const checkout = async () => {
    if (!items.length) { setError("Keranjang masih kosong."); return; }
    if (!ident.name.trim() || !ident.email.trim() || !ident.email.includes("@") || !ident.wa.trim()) {
      setError("Lengkapi nama, email, dan WhatsApp yang valid."); return;
    }
    setLoading(true); setError("");
    try {
      saveIdentity(ident);
      const ref = typeof window !== "undefined" ? localStorage.getItem("linguo_ref") || undefined : undefined;
      const res = await fetch("/api/create-kelas-invoice", {
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

  const inputCls = "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A9E9E]/40 disabled:opacity-50";

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
        <button onClick={() => !loading && onClose()} aria-label="Tutup"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><X className="h-4 w-4" /></button>
      </div>

      <div className="grid min-w-0 gap-5 overflow-y-auto p-5 md:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
        {/* Daftar paket */}
        <div className="space-y-2">
          {items.map((it) => {
            const q = quoteKelasItem(it);
            if (!q) return null;
            const key = cartItemKey(it);
            const { label, code } = resolveLabel(it.language);
            const Icon = it.classType === "semi" ? Users : User;
            return (
              <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  {code ? <RectFlag code={code} h={14} /> : <Icon className="h-4 w-4 text-slate-400" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight text-slate-900">
                    {label} <span className="font-medium text-slate-500">· {it.level}</span>
                    {it.teacherType === "native" && (
                      <span className="ml-1.5 rounded-full bg-[#fbbf24] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-slate-900">Native</span>
                    )}
                  </p>
                  <p className="text-[11px] leading-snug text-slate-500">
                    {it.classType === "semi"
                      ? `Semi grup ${it.classSize} · ${q.sessions} sesi @${SESSION_MINUTES}m · per orang`
                      : `Private 1-on-1 · ${q.sessions} sesi @${SESSION_MINUTES}m`}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-extrabold tabular-nums text-slate-900">{formatRupiah(q.amount)}</p>
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
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-[#1A9E9E]/40 hover:text-[#1A9E9E]">
              <Plus className="h-4 w-4" /> Tambah paket lain
            </button>
          )}
          {adaSemi && (
            <p className="text-[11px] leading-relaxed text-slate-400">
              Paket Semi Private ditagih <b>per orang</b>; teman satu grup dicari sendiri dan tiap anggota
              membayar porsinya masing-masing lewat halaman ini.
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
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Pembayaran aman via Xendit: QRIS, GoPay, OVO, Dana, ShopeePay, Transfer Bank
        </p>
      </div>
    </Overlay>
  );
}

// ── Kerangka modal ───────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  // Launcher chat (ChatWidget, z-index 9990) menimpa tombol "Bayar" di HP.
  // Selama modal terbuka, tandai <body> dan sembunyikan lewat CSS global.
  useEffect(() => {
    document.body.classList.add("tp-modal-open");
    return () => { document.body.classList.remove("tp-modal-open"); };
  }, []);
  return (
    <div onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm animate-[fadeIn_.18s_ease-out] md:items-center md:p-6">
      <div onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full min-w-0 max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        body.tp-modal-open .lingw-launcher, body.tp-modal-open .lingw-teaser { display: none !important; }
      `}</style>
    </div>
  );
}
