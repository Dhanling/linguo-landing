// ============================================================================
// [wa-lead-ref-v1] Kode lead pendek di tombol WhatsApp (pola Ruangguru)
// ============================================================================
// Masalahnya: chat yang dibuka dari tombol wa.me tidak membawa apa pun soal
// asal pengunjung — Inbox CS cuma melihat nomor baru, dan notif penjualan di grup
// Owner hanya tahu sumber iklan kalau orangnya sempat mengisi form ber-email/HP.
//
// Sekarang tiap tombol WA ke nomor penjualan ditempeli kode `[LG-7F3K]` di akhir
// teks pesannya. Saat diklik, kode itu dikirim ke /api/track bersama UTM/fbclid
// (dari `linguo_attr`), halaman, dan label tombol → tabel `landing_wa_refs`.
// Begitu chatnya masuk, trigger DB membaca kodenya, menautkan nomor HP pengirim,
// dan mengisi `ad_attributions` lewat `record_ad_attribution` — jadi Inbox CS
// bisa menampilkan "datang dari iklan X, halaman Y" dan sales_paid() otomatis
// tahu sumbernya.
//
// Satu kode per pengunjung (localStorage, 30 hari): klik ulang dari halaman lain
// memakai kode yang sama, server mencatat halaman terakhirnya.
// ============================================================================

import { getAdAttribution } from "./adAttribution";

const KEY = "linguo_wa_ref";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Tanpa 0/O/1/I/L supaya tidak salah baca kalau CS mengetik ulang.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const WA_REF_RE = /\[LG-[2-9A-HJKMNP-Z]{4}\]/;

// Hanya nomor penjualan/CS. Nomor Kurikulum (lamaran pengajar) & nomor kuis
// sengaja tidak ditempeli — chat di sana bukan calon siswa.
const TAGGED_NUMBERS = new Set([
  "6282116859493", // CS utama
  "6282217866789", // CS halaman /kursus
  "6281387797267", // hasil Placement Test
]);

function randomCode(): string {
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  let s = "";
  for (const b of buf) s += ALPHABET[b % ALPHABET.length];
  return `LG-${s}`;
}

/** Kode lead pengunjung ini; dibuat sekali lalu dipakai ulang 30 hari. */
export function getWaLeadCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const { code, at } = JSON.parse(raw) as { code?: string; at?: number };
      if (code && at && Date.now() - at < TTL_MS) return code;
    }
    const code = randomCode();
    localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
    return code;
  } catch {
    // Mode privat: tetap beri kode, cuma tidak bertahan antarhalaman.
    try {
      return randomCode();
    } catch {
      return null;
    }
  }
}

/** Nomor tujuan link WA (wa.me/<no> atau api.whatsapp.com/send?phone=<no>). */
function waTarget(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "wa.me") return url.pathname.replace(/\D/g, "") || null;
  if (host === "api.whatsapp.com" || host === "whatsapp.com") {
    return (url.searchParams.get("phone") || "").replace(/\D/g, "") || null;
  }
  return null;
}

/**
 * Tempelkan kode lead ke teks pesan link WA. Link lain (atau yang sudah berkode)
 * dikembalikan apa adanya. Query dibangun ulang dengan encodeURIComponent —
 * URLSearchParams menulis spasi sebagai "+", yang tidak selalu dibaca WA.
 */
export function tagWaUrl(href: string, code = getWaLeadCode()): string {
  if (!code) return href;
  let url: URL;
  try {
    url = new URL(href, typeof location !== "undefined" ? location.href : "https://linguo.id");
  } catch {
    return href;
  }
  const target = waTarget(url);
  if (!target || !TAGGED_NUMBERS.has(target)) return href;
  const text = url.searchParams.get("text") || "";
  if (WA_REF_RE.test(text)) return href;
  const tagged = `${text.trimEnd() || "Halo Linguo"}\n\n[${code}]`;
  const parts: string[] = [];
  let sawText = false;
  url.searchParams.forEach((v, k) => {
    if (k === "text") {
      sawText = true;
      parts.push(`text=${encodeURIComponent(tagged)}`);
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  });
  if (!sawText) parts.push(`text=${encodeURIComponent(tagged)}`);
  return `${url.origin}${url.pathname}?${parts.join("&")}`;
}

/** Ambil kode yang tertempel di link WA (sesudah tagWaUrl). */
export function codeInWaUrl(href: string): string | null {
  try {
    const text = new URL(href, "https://linguo.id").searchParams.get("text") || "";
    const m = text.match(WA_REF_RE);
    return m ? m[0].slice(1, -1) : null;
  } catch {
    return null;
  }
}

/**
 * Catat kode + asal pengunjung ke /api/track (sendBeacon, tahan pindah halaman).
 * Dipanggil AnalyticsTracker saat tombol WA diklik, dan oleh pembuka WA
 * terprogram (window.open) lewat openTaggedWa().
 */
export function sendWaRef(code: string, extra: { session_id?: string; label?: string; href?: string } = {}) {
  try {
    const payload = JSON.stringify({
      type: "wa_ref",
      code,
      session_id: extra.session_id || "",
      path: location.pathname,
      title: document.title.slice(0, 200),
      label: (extra.label || "").slice(0, 120),
      href: (extra.href || "").slice(0, 500),
      attribution: getAdAttribution(),
    });
    const blob = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon("/api/track", blob)) {
      fetch("/api/track", { method: "POST", body: payload, keepalive: true });
    }
  } catch {
    /* pelacakan tak boleh mengganggu klik */
  }
  try {
    // Rekaman Clarity bisa difilter per kode → lihat sesi orang yang chat.
    (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity?.("set", "wa_ref", code);
  } catch {
    /* abaikan */
  }
}

/** Untuk tombol yang membuka WA lewat JS (bukan <a>): tempel kode + catat. */
export function taggedWaUrlAndTrack(href: string, label = ""): string {
  const tagged = tagWaUrl(href);
  const code = codeInWaUrl(tagged);
  if (code && tagged !== href) sendWaRef(code, { label, href: tagged });
  return tagged;
}
