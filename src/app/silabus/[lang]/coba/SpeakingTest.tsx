"use client";

// [placement-dua-jalur-v1] Placement test punya dua jalur (pola Cakap):
// 1) Self-assessment online GRATIS — grammar, reading, listening (tes di halaman ini).
// 2) Speaking Test 1-on-1 dengan pengajar — BERBAYAR, tarifnya = harga Kelas Private
//    level A1 per 60 menit untuk bahasa itu (English 100rb, Spanyol 110rb, Turki 120rb…).
//    Sumber angka = getPrivateBase60 (pricelist Private resmi), jadi ikut kalau harga berubah.
// [speaking-test-bayar-v1] Bayar langsung di website: form singkat → invoice Xendit
// lewat /api/create-trial-invoice (jenis "speaking_test"); sesudah lunas masuk menu
// Trial Class dashboard untuk dijadwalkan dengan pengajar. WhatsApp tetap jadi cadangan.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Mic, MessageCircle, X, ArrowRight } from "lucide-react";
import { getPrivateBase60, formatRupiah } from "@/lib/trial-pricing";
import { trackEvent } from "@/lib/tracking";
import { withAdAttribution } from "@/lib/adAttribution";

const WA_NUMBER = "6282116859493";

/** IELTS/TOEFL bukan bahasa di pricelist — Speaking Test-nya bahasa Inggris. */
function pricingLang(slug: string, langFull: string): string {
  return slug === "ielts" || slug === "toefl-itp" ? "English" : langFull;
}

export function speakingTestPrice(slug: string, langFull: string): number {
  return getPrivateBase60(pricingLang(slug, langFull), "A1");
}

function waHref(langTitle: string, price: number, sublevel?: string) {
  const text =
    `Halo Linguo, saya mau booking Speaking Test ${langTitle} dengan pengajar ` +
    `(${formatRupiah(price)} / 60 menit).` +
    (sublevel ? ` Hasil self-assessment saya: ${sublevel}.` : "");
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

/** Perbandingan dua jalur di layar pembuka placement test. */
export function DuaJalurPlacement({ slug, langFull, langTitle, durasi }: {
  slug: string; langFull: string; langTitle: string; durasi: string;
}) {
  const price = speakingTestPrice(slug, langFull);
  return (
    <div className="mt-10">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dua jalur placement test</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-[#1A9E9E] bg-[#1A9E9E]/5 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-gray-900">Self-assessment</p>
            <span className="rounded-full bg-[#1A9E9E] px-2.5 py-0.5 text-xs font-bold text-white">Gratis</span>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
            {["Grammar, reading, listening", `Online, ${durasi}`, "Hasil level CEFR langsung keluar"].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#1A9E9E] flex-shrink-0 mt-0.5" strokeWidth={3} />{t}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-semibold text-[#1A9E9E]">Yang sedang kamu buka ini</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-gray-900 flex items-center gap-1.5"><Mic className="w-4 h-4 text-violet-600" />Speaking Test</p>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700 whitespace-nowrap">{formatRupiah(price)}</span>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
            {["1-on-1 dengan pengajar via video call", "60 menit, termasuk speaking", "Level & saran belajar dari pengajar"].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" strokeWidth={3} />{t}
              </li>
            ))}
          </ul>
          <BookingButton slug={slug} langFull={langFull} langTitle={langTitle} price={price} source="intro"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors" />
          <a href={waHref(langTitle, price)} target="_blank" rel="noopener"
            className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-violet-700 hover:text-violet-900">
            <MessageCircle className="w-3.5 h-3.5" /> Tanya admin dulu
          </a>
        </div>
      </div>
    </div>
  );
}

/** Tawaran Speaking Test sesudah hasil self-assessment keluar. */
export function SpeakingTestOffer({ slug, langFull, langTitle, sublevel }: {
  slug: string; langFull: string; langTitle: string; sublevel: string;
}) {
  const price = speakingTestPrice(slug, langFull);
  return (
    <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
      <p className="flex items-center gap-2 font-bold text-violet-900">
        <Mic className="w-5 h-5 flex-shrink-0" /> Mau level yang lebih pasti? Ikut Speaking Test
      </p>
      <p className="mt-2 text-sm text-violet-900/80 leading-relaxed">
        Self-assessment tadi mengukur grammar, reading & listening. Di Speaking Test kamu ngobrol 1-on-1 dengan
        pengajar selama 60 menit, lalu pengajar menentukan levelmu dan memberi saran belajar.{" "}
        <span className="font-semibold text-violet-900">{formatRupiah(price)}</span> per sesi.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <BookingButton slug={slug} langFull={langFull} langTitle={langTitle} price={price} source="result" sublevel={sublevel}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors" />
        <a href={waHref(langTitle, price, sublevel)} target="_blank" rel="noopener"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900">
          <MessageCircle className="w-4 h-4" /> Tanya admin dulu
        </a>
      </div>
    </div>
  );
}

type Prefill = { name?: string; email?: string; whatsapp?: string };

/** Tombol "Bayar & booking" + form singkat → invoice Xendit. */
function BookingButton({ slug, langFull, langTitle, price, source, sublevel, className }: {
  slug: string; langFull: string; langTitle: string; price: number;
  source: "intro" | "result"; sublevel?: string; className: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [jadwal, setJadwal] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Isi otomatis dari biodata placement test (localStorage linguo_prefill).
  useEffect(() => {
    if (!open) return;
    try {
      const p: Prefill = JSON.parse(localStorage.getItem("linguo_prefill") || "null") || {};
      if (p.name && !name) setName(p.name);
      if (p.email && !email) setEmail(p.email);
      if (p.whatsapp && !wa) setWa(String(p.whatsapp).replace(/\D/g, "").replace(/^62/, "").replace(/^0+/, ""));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const bayar = async () => {
    setErr("");
    const w = wa.replace(/\D/g, "").replace(/^62/, "").replace(/^0+/, "");
    if (!name.trim()) return setErr("Masukkan nama dulu ya");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr("Masukkan email yang valid");
    if (w.length < 9 || !w.startsWith("8")) return setErr("Nomor WhatsApp diawali 8, minimal 9 digit");
    setBusy(true);
    trackEvent("speaking_test_checkout", { language: langFull, source, level: sublevel ?? "", value: price, currency: "IDR" });
    try {
      const res = await fetch("/api/create-trial-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withAdAttribution({
          jenis: "speaking_test",
          return_slug: slug,
          name: name.trim(),
          email: email.trim(),
          wa_number: "+62" + w,
          language: pricingLang(slug, langFull),
          preferred_schedule: [jadwal.trim(), sublevel ? `Hasil self-assessment: ${sublevel}` : ""].filter(Boolean).join(" — ") || null,
        })),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.invoice_url) {
        try { localStorage.setItem("linguo_prefill", JSON.stringify({ ...(JSON.parse(localStorage.getItem("linguo_prefill") || "null") || {}), name: name.trim(), email: email.trim(), whatsapp: w })); } catch {}
        window.location.href = data.invoice_url;
        return;
      }
      setErr(data?.error || "Gagal membuat tagihan. Coba lagi atau hubungi admin via WhatsApp.");
    } catch {
      setErr("Koneksi terputus. Coba lagi sebentar lagi.");
    }
    setBusy(false);
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm";

  return (
    <>
      <button type="button" className={className}
        onClick={() => { setOpen(true); trackEvent("speaking_test_booking_click", { language: langFull, source, level: sublevel ?? "" }); }}>
        Bayar & booking {formatRupiah(price)} <ArrowRight className="w-4 h-4" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 pointer-events-auto"
          onClick={() => !busy && setOpen(false)}>
          <form role="dialog" aria-modal="true" aria-labelledby="speaking-test-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); bayar(); }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" disabled={busy}
              className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1 flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" />Speaking Test</p>
            <h2 id="speaking-test-title" className="text-xl font-bold text-gray-900 pr-8">{langTitle} · {formatRupiah(price)}</h2>
            <p className="text-sm text-gray-500 mt-1 mb-5">60 menit 1-on-1 dengan pengajar via video call. Sesudah bayar, admin menghubungi kamu via WhatsApp untuk atur jadwal.</p>
            <div className="space-y-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" autoComplete="name" className={inputCls} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email kamu" autoComplete="email" className={inputCls} />
              <div className="flex">
                <span className="px-3 py-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-600 font-mono">+62</span>
                <input type="tel" value={wa} onChange={(e) => setWa(e.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="812 xxxx xxxx" inputMode="numeric" autoComplete="tel-national"
                  className="flex-1 min-w-0 px-4 py-3 rounded-r-xl border border-gray-200 bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm" />
              </div>
              <input type="text" value={jadwal} onChange={(e) => setJadwal(e.target.value)} placeholder="Waktu yang cocok (opsional), mis. Sabtu pagi" className={inputCls} />
              {err && <p className="text-xs text-rose-600">{err}</p>}
            </div>
            <button type="submit" disabled={busy}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-70 disabled:cursor-wait">
              {busy ? "Membuat tagihan…" : <>Lanjut ke pembayaran <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="text-[11px] text-gray-400 mt-3 text-center">Bayar via QRIS, e-wallet, transfer bank, atau kartu (Xendit).</p>
          </form>
        </div>,
        document.body,
      )}
    </>
  );
}
