"use client";

// [simulasi-beli-modal-v1] Popup pilih paket + checkout langsung dari katalog
// /akun/simulasi. Daftar paket disinkron dari lib/simulasiPakets (sama dgn
// halaman /simulasi/paket). Alur: pilih paket → isi data → bayar via Xendit.
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { getStudentInfo } from "@/lib/simulations";
import { PAKET, PRICE, FEATURES, SKILL_META, formatRp, type Paket } from "@/lib/simulasiPakets";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";

export default function SimulasiBeliModal({
  open,
  onClose,
  testType,
}: {
  open: boolean;
  onClose: () => void;
  testType?: string; // batasi paket ke satu jenis tes (mis. "toefl"); kosong = semua
}) {
  const list = testType ? PAKET.filter((p) => p.testType === testType) : PAKET;

  const [paket, setPaket] = useState<Paket | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prefill dari user yang login → email harus cocok saat grant entitlement.
  // Kalau sudah login, data (nama/email/WA) diambil dari profil → tak perlu
  // isi form lagi, langsung ke tombol Bayar.
  useEffect(() => {
    (async () => {
      const info = await getStudentInfo();
      if (!info?.user_id) return;
      setLoggedIn(true);
      if (info.name) setName(info.name);
      if (info.email) setEmail(info.email);
      if (info.whatsapp) setWa(info.whatsapp);
    })();
  }, []);

  // Reset pilihan tiap kali modal dibuka.
  useEffect(() => {
    if (open) { setPaket(null); setError(""); }
  }, [open]);

  const checkout = async () => {
    // User login: WA opsional (sudah dari profil / boleh kosong). Tamu: semua wajib.
    if (!name.trim() || !email.trim() || (!loggedIn && !wa.trim())) {
      setError("Lengkapi semua field"); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), wa_number: wa.trim(),
          program: "simulasi", level: paket!.testType, productKey: paket!.productKey,
          variant: paket!.variant,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat invoice");
      window.location.href = data.invoice_url;
    } catch (e: any) { setError(e.message); setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm md:items-center"
          onClick={() => !loading && onClose()}>
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Header */}
            <div className="px-6 py-5 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {paket && (
                    <button onClick={() => !loading && setPaket(null)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  )}
                  <div>
                    <p className="text-xs text-white/70">{paket ? "Checkout" : "Pilih Paket"}</p>
                    <h3 className="text-lg font-bold">{paket ? paket.title : "Simulasi Tes"}</h3>
                  </div>
                </div>
                <button onClick={() => !loading && onClose()} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">✕</button>
              </div>
              {paket && <p className="mt-2 text-2xl font-extrabold">{formatRp(PRICE)}</p>}
            </div>

            {/* Body */}
            {!paket ? (
              /* Langkah 1 — pilih paket (sinkron dgn halaman /simulasi/paket) */
              <div className="space-y-3 overflow-y-auto p-5">
                {list.map((p) => (
                  <button
                    key={p.variant}
                    onClick={() => { setPaket(p); setError(""); }}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: p.accent }}>
                        {p.tag}
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">{formatRp(PRICE)}</span>
                    </div>
                    <h4 className="mt-2 font-bold text-slate-900">{p.title}</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.skills.map((key) => {
                        const s = SKILL_META[key];
                        const Icon = s.icon;
                        return (
                          <span key={key} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            <Icon className="h-3 w-3" style={{ color: p.accent }} /> {s.label}
                          </span>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] font-medium" style={{ color: p.accent }}>{p.covers}</p>
                  </button>
                ))}
              </div>
            ) : (
              /* Langkah 2 — data pembeli + bayar */
              <div className="space-y-4 overflow-y-auto p-6">
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: paket.accent }} /> {paket.skills.length} bagian sesuai format tes asli
                  </li>
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: paket.accent }} /> {f}
                    </li>
                  ))}
                </ul>
                {loggedIn ? (
                  /* Sudah login → tak perlu isi ulang. Tampilkan akun tujuan akses. */
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: TEAL }}>
                      <Mail className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{name || email}</p>
                      <p className="truncate text-xs text-slate-500">Akses terbuka di {email}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500">Nama Lengkap</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" disabled={loading}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500">Email <span className="font-normal text-slate-400">(dipakai untuk akses)</span></label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" disabled={loading}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-500">WhatsApp</label>
                      <input type="tel" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="0821..." disabled={loading}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50" />
                    </div>
                  </>
                )}
                {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>}
                <button onClick={checkout} disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-60"
                  style={{ background: TEAL }}>
                  {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>) : `Bayar ${formatRp(PRICE)}`}
                </button>
                <p className="text-center text-[11px] text-slate-400">Pembayaran aman via Xendit: QRIS, GoPay, OVO, Dana, ShopeePay, Transfer Bank</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
