"use client";

// Modal langganan Watch & Learn — muncul saat pengguna gratis mentok cicip buka
// arti kata / Analisa (FREE_LOOKUP_LIMIT). Pengguna pilih durasi (1 bln / 6 bln /
// 1 thn — makin panjang makin hemat), boleh masukkan kode promo, lalu checkout
// Xendit. Nonton + subtitle + terjemahan tetap gratis; ini titik konversi ke
// fitur belajar (arti kata + Analisa grammar tanpa batas).
//
// Entitlement asli disambung lewat isWatchPremium/setWatchPremium (lihat
// immersionLearn). Untuk sekarang unlock per-perangkat setelah bayar (redirect).

import { useEffect, useState } from "react";
import { X, Sparkles, Check, ArrowRight, Tag, Loader2, BadgePercent } from "lucide-react";
import { WATCH_PLANS, type WatchPlan } from "@/lib/immersionLearn";

interface PromoApplied {
  code: string;
  discountPct: number;
  discountedAmount: number;
  label?: string;
}

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const CARD = "#0A1212";
const BORDER = "rgba(255,255,255,0.1)";
const SUB = "rgba(255,255,255,0.55)";

const fmt = (n: number) => "Rp" + n.toLocaleString("id-ID");

export default function WatchSubscribeModal({ onClose }: { onClose: () => void }) {
  const [planId, setPlanId] = useState<WatchPlan["id"]>("annual");
  const [email, setEmail] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applied, setApplied] = useState<PromoApplied | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = WATCH_PLANS.find((p) => p.id === planId)!;
  const effectiveAmount = applied ? applied.discountedAmount : plan.price;

  // Validasi kode promo ke server (sumber tunggal = /api/validate-wl-promo).
  const applyPromo = async (planFor: WatchPlan["id"] = planId, code = promo) => {
    const c = code.trim();
    if (!c) {
      setApplied(null);
      setPromoError(null);
      return;
    }
    setPromoBusy(true);
    setPromoError(null);
    try {
      const res = await fetch(
        `/api/validate-wl-promo?code=${encodeURIComponent(c)}&plan=${planFor}`
      );
      const data = await res.json();
      if (res.ok && data.ok) {
        setApplied({
          code: data.code,
          discountPct: data.discountPct,
          discountedAmount: data.discountedAmount,
          label: data.label,
        });
        setPromoError(null);
      } else {
        setApplied(null);
        setPromoError(data.reason || "Kode promo tidak berlaku.");
      }
    } catch {
      setApplied(null);
      setPromoError("Gagal memeriksa kode. Coba lagi.");
    } finally {
      setPromoBusy(false);
    }
  };

  // Diskon bisa bergantung paket (nominal & pembatasan) → validasi ulang saat ganti
  // paket kalau sudah ada promo terpasang.
  useEffect(() => {
    if (applied) applyPromo(planId, applied.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const submit = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      // Salah kolom yang sering kejadian: kode promo diketik di kolom email
      // (toggle promo persis di atasnya). Pindahkan otomatis + kasih tahu.
      if (/^[A-Z0-9_-]{3,24}$/i.test(trimmed) && !trimmed.includes("@")) {
        setPromoOpen(true);
        setPromo(trimmed.toUpperCase());
        setEmail("");
        applyPromo(planId, trimmed);
        setError(
          `"${trimmed.toUpperCase()}" kelihatannya kode promo — sudah dipindahkan ke kolom promo. Sekarang isi email kamu ya.`
        );
        return;
      }
      setError("Masukkan email yang valid untuk kirim invoice & aktivasi.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/create-wl-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, email: trimmed, promo: promo.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal membuat invoice.");
      if (data.invoice_url) {
        window.location.href = data.invoice_url as string;
        return;
      }
      throw new Error("Invoice tidak tersedia. Coba lagi.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-[460px] overflow-y-auto rounded-t-3xl p-6 shadow-2xl sm:rounded-3xl"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(26,158,158,0.16)" }}
          >
            <Sparkles className="h-5 w-5" style={{ color: "#7FE0E0" }} />
          </div>
          <button onClick={onClose} aria-label="Tutup" className="shrink-0 opacity-60 hover:opacity-100">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <h2 className="mt-3 text-[20px] font-extrabold leading-tight text-white">
          Buka semua fitur belajar
        </h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: SUB }}>
          Arti kata & Analisa grammar tanpa batas di semua video. Nonton + subtitle +
          terjemahan tetap gratis.
        </p>

        {/* Manfaat singkat */}
        <ul className="mt-3 space-y-1.5">
          {[
            "Tap kata apa pun — arti, contoh, & audio",
            "Analisa grammar per kalimat (kelas kata)",
            "Simpan kosakata & review (flashcard) tanpa batas",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2 text-[13px] text-white/85">
              <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEAL }} />
              {t}
            </li>
          ))}
        </ul>

        {/* Pilih durasi */}
        <div className="mt-4 space-y-2">
          {WATCH_PLANS.map((p) => {
            const active = p.id === planId;
            return (
              <button
                key={p.id}
                onClick={() => setPlanId(p.id)}
                className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition"
                style={{
                  backgroundColor: active ? "rgba(26,158,158,0.14)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${active ? TEAL : BORDER}`,
                }}
              >
                {/* Radio */}
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ border: `2px solid ${active ? TEAL : "rgba(255,255,255,0.3)"}` }}
                >
                  {active && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TEAL }} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-white">{p.label}</span>
                    {p.badge && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase leading-none"
                        style={{ backgroundColor: "rgba(244,183,64,0.18)", color: GOLD }}
                      >
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px]" style={{ color: SUB }}>
                    {p.months > 1 ? `≈ ${fmt(p.perMonth)}/bln` : "Tagih bulanan"}
                    {p.savePct ? ` · hemat ${p.savePct}%` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-[15px] font-extrabold text-white">{fmt(p.price)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Kode promo */}
        <div className="mt-3">
          {!promoOpen ? (
            <button
              onClick={() => setPromoOpen(true)}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ color: TEAL }}
            >
              <Tag className="h-4 w-4" /> Punya kode promo / afiliator?
            </button>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: SUB }}
                  />
                  <input
                    value={promo}
                    onChange={(e) => {
                      setPromo(e.target.value.toUpperCase());
                      if (applied) setApplied(null);
                      if (promoError) setPromoError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                    placeholder="Kode promo / afiliator"
                    autoFocus
                    autoCapitalize="characters"
                    className="w-full rounded-xl bg-white/5 py-2.5 pl-9 pr-3 text-[14px] font-semibold uppercase tracking-wide text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-white/40 focus:outline-none"
                    style={{ border: `1px solid ${applied ? TEAL : BORDER}` }}
                  />
                </div>
                <button
                  onClick={() => applyPromo()}
                  disabled={promoBusy || !promo.trim()}
                  className="shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", border: `1px solid ${BORDER}` }}
                >
                  {promoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Terapkan"}
                </button>
              </div>
              {applied && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: TEAL }}>
                  <BadgePercent className="h-4 w-4" />
                  {applied.label ?? `Kode ${applied.code}`} — hemat {applied.discountPct}%
                </p>
              )}
              {promoError && (
                <p className="mt-1.5 text-[12.5px] font-semibold text-red-400">{promoError}</p>
              )}
            </div>
          )}
        </div>

        {/* Email — label permanen (bukan cuma placeholder) biar tetap jelas ini
            kolom email walau sudah terisi; sering ketuker sama kolom promo. */}
        <div className="mt-3">
          <label
            htmlFor="wl-subscribe-email"
            className="mb-1 block text-[12px] font-semibold"
            style={{ color: SUB }}
          >
            Email (untuk invoice & aktivasi)
          </label>
          <input
            id="wl-subscribe-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-[14px] text-white placeholder:text-white/40 focus:outline-none"
            style={{ border: `1px solid ${BORDER}` }}
          />
        </div>

        {error && <p className="mt-2 text-[12.5px] font-semibold text-red-400">{error}</p>}

        {/* CTA */}
        <button
          onClick={submit}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          style={{ backgroundColor: TEAL }}
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Menyiapkan pembayaran…
            </>
          ) : (
            <>
              Langganan {plan.label} —{" "}
              {applied && (
                <span className="text-white/60 line-through">{fmt(plan.price)}</span>
              )}{" "}
              {fmt(effectiveAmount)}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-[13px] font-semibold"
          style={{ color: SUB }}
        >
          Nanti aja, lanjut nonton
        </button>
      </div>
    </div>
  );
}
