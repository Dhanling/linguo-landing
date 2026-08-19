"use client";

// [promo-lead-form-v1] Gerbang data sebelum lompat ke WhatsApp.
//
// Banner atas (PromoTopBar) dan sticker melayang (PromoFloatingButton) dulu
// langsung membuka wa.me. Akibatnya CS menerima chat "mau klaim promo" tanpa
// identitas apa pun: nama, nomor (nomor WA pengirim memang kelihatan, tapi
// tidak masuk lead), apalagi email — padahal akses Simulasi Tes dikirim ke
// email. Sekarang kedua pemicu itu membuka modal ini dulu.
//
// Mount SEKALI di layout. Pemicunya lewat event global (openPromoLead) supaya
// banner & sticker tak perlu masing-masing menyalin state form.
import { useCallback, useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { PROMO, promoWaUrl } from "@/lib/promoMerdeka";
import { formatRp } from "@/lib/simulasiPakets";
import { withAdAttribution } from "@/lib/adAttribution";
import { useOverlayLock } from "@/lib/overlayStore";

const OPEN_EVENT = "linguo:promo-lead-open";

/** Dipanggil banner/sticker. Aman dipanggil sebelum modal ter-mount (no-op). */
export function openPromoLead() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#E0353D] focus:bg-white focus:ring-2 focus:ring-[#E0353D]/20";
const COUNTRY_CODES = ["+62","+60","+65","+66","+81","+82","+86","+91","+1","+44","+61","+49","+33","+971","+966","+7","+55","+234"];

export default function PromoLeadModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  const [waNumber, setWaNumber] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false); // anti double-fire (klik + Enter beruntun)

  useEffect(() => {
    const onOpen = () => {
      setError("");
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Kunci scroll body selama modal terbuka.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // [ling-hide-fab-overlay-v1] daftarkan overlay global → FAB WhatsApp disembunyikan
  useOverlayLock(open);

  const close = useCallback(() => {
    if (sendingRef.current) return; // jangan tutup di tengah penyimpanan
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const submit = async () => {
    if (sendingRef.current) return;
    if (!name.trim()) return setError("Nama kamu dulu ya");
    if (!waNumber.trim() || waNumber.length < 9) return setError("Nomor WhatsApp minimal 9 digit");
    if (waNumber.length > 15) return setError("Nomor WhatsApp terlalu panjang");
    if (countryCode === "+62" && waNumber[0] !== "8")
      return setError("Nomor Indonesia diawali angka 8 (contoh: 812…)");
    if (!EMAIL_REGEX.test(email.trim())) return setError("Format email belum benar");

    setError("");
    sendingRef.current = true;
    setSending(true);

    // Tab WA dibuka SEKARANG (masih di dalam gestur klik), isinya diarahkan
    // setelah data tersimpan. Kalau menunggu fetch selesai baru window.open,
    // Safari/iOS memblokirnya sebagai popup dan pengguna mentok di modal.
    const waTab = window.open("", "_blank");

    try {
      const ref =
        new URLSearchParams(window.location.search).get("ref") ||
        localStorage.getItem("linguo_ref") ||
        null;
      const res = await fetch("/api/promo-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          withAdAttribution({ name, email, countryCode, waNumber, referral_source: ref }),
        ),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        waTab?.close();
        setError(j.error || "Gagal mengirim, coba lagi");
        sendingRef.current = false;
        setSending(false);
        return;
      }
    } catch {
      // Jaringan bermasalah → jangan tahan calon pembeli di modal. Datanya
      // tetap ikut terkirim lewat isi pesan WA di bawah ini.
    }

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "promo_merdeka_lead", { value: PROMO.price });
    }

    const url = promoWaUrl({ name, email });
    if (waTab) waTab.location.href = url;
    else window.location.href = url; // popup diblokir → pindah di tab yang sama
    setSending(false);
    sendingRef.current = false;
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={`Klaim ${PROMO.badge}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-sm sm:rounded-3xl"
      >
        <div className="bg-gradient-to-r from-[#B3121F] via-[#E0353D] to-[#B3121F] px-5 py-4 text-white sm:rounded-t-3xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-white/85">
                <span aria-hidden>🇮🇩</span> {PROMO.badge}
              </p>
              <h3 className="mt-0.5 text-lg font-bold">
                Simulasi TOEFL{" "}
                <span className="text-[#FFD43B]">{formatRp(PROMO.price)}</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup"
              className="shrink-0 rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className="mb-4 text-xs text-slate-500">
            Isi data singkat ini dulu ya — akses simulasi dikirim ke emailmu, dan CS kami
            langsung tahu harus menghubungi siapa. Setelah ini kamu tersambung ke WhatsApp.
          </p>

          <div className="space-y-2.5">
            <input
              type="text"
              placeholder="Nama lengkap"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className={FIELD}
              autoFocus
              required
            />

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 pl-3 focus-within:border-[#E0353D] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#E0353D]/20">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                aria-label="Kode negara"
                className="cursor-pointer bg-transparent py-3 text-sm font-semibold text-slate-700 outline-none"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="812 3456 7890"
                value={waNumber}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setWaNumber(v.startsWith("0") ? v.slice(1) : v);
                  setError("");
                }}
                className="min-w-0 flex-1 bg-transparent py-3 pr-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none"
                required
              />
            </div>

            <input
              type="email"
              placeholder="email@kamu.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className={FIELD}
              required
            />
          </div>

          {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={sending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#E0353D] py-3 text-sm font-extrabold text-white transition hover:bg-[#B3121F] active:scale-95 disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan…
              </>
            ) : (
              <>Lanjut ke WhatsApp →</>
            )}
          </button>

          <p className="mt-2.5 text-center text-[11px] text-slate-400">
            Data kamu hanya dipakai untuk memproses klaim promo ini.
          </p>
        </div>
      </div>
    </div>
  );
}
