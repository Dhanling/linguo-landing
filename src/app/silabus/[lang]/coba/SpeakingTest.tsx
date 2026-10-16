"use client";

// [placement-dua-jalur-v1] Placement test punya dua jalur (pola Cakap):
// 1) Self-assessment online GRATIS — grammar, reading, listening (tes di halaman ini).
// 2) Speaking Test 1-on-1 dengan pengajar — BERBAYAR, tarifnya = harga Kelas Private
//    level A1 per 60 menit untuk bahasa itu (English 100rb, Spanyol 110rb, Turki 120rb…).
//    Sumber angka = getPrivateBase60 (pricelist Private resmi), jadi ikut kalau harga berubah.
// Pemesanan lewat WhatsApp CS: pengajar & jadwal dicocokkan manual, tagihan dibuat CS.

import { Check, Mic, MessageCircle } from "lucide-react";
import { getPrivateBase60, formatRupiah } from "@/lib/trial-pricing";
import { trackEvent } from "@/lib/tracking";

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
          <a href={waHref(langTitle, price)} target="_blank" rel="noopener"
            onClick={() => trackEvent("speaking_test_booking_click", { language: langFull, source: "intro" })}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:text-violet-900">
            <MessageCircle className="w-4 h-4" /> Booking via WhatsApp
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
      <a href={waHref(langTitle, price, sublevel)} target="_blank" rel="noopener"
        onClick={() => trackEvent("speaking_test_booking_click", { language: langFull, source: "result", level: sublevel })}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
        <MessageCircle className="w-4 h-4" /> Booking Speaking Test
      </a>
    </div>
  );
}
