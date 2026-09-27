"use client";

// landing-analytics-v1 — pelacak halaman + durasi kunjungan untuk analytics
// internal (dibaca di admin dashboard). Kirim satu "view" tiap kali user pindah
// halaman atau meninggalkan tab, lewat sendBeacon ke /api/track.
//
// Hanya halaman PUBLIK yang dicatat — area login/akun dikecualikan (lihat
// EXCLUDED_PREFIXES). Jalur ini terpisah dari GA4/FB Pixel yang sudah ada.
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Path yang TIDAK dilacak (area login/akun & alur auth).
const EXCLUDED_PREFIXES = ["/akun", "/student", "/onboarding", "/auth"];
// Kunjungan lebih pendek dari ini dianggap noise (mis. redirect kilat).
const MIN_DURATION_MS = 1000;
const SID_KEY = "linguo-analytics-sid";

function isTracked(path: string): boolean {
  return !EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

function getDevice(): "mobile" | "desktop" {
  try {
    return window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop";
  } catch {
    return "desktop";
  }
}

// landing-klik-v1 — jenis klik, dibaca kartu "Website Landing" di Overview admin.
const CTA_RE = /daftar|bayar|beli|checkout|trial|coba|pesan|gabung|mulai|register|enroll|buy|book/i;

function classifyClick(el: HTMLElement, href: string, label: string): string {
  if (/wa\.me|whatsapp\.com/i.test(href)) return "whatsapp";
  if (el.closest("[data-track]") || CTA_RE.test(label)) return "cta";
  if (href) {
    try {
      const u = new URL(href, location.href);
      if (u.protocol.startsWith("http")) return u.host === location.host ? "nav" : "outbound";
    } catch {
      // href aneh (javascript:, mailto:) — anggap tombol biasa
    }
  }
  return "button";
}

function sendClick(target: EventTarget | null) {
  const el = (target as HTMLElement | null)?.closest?.("a, button, [role='button']") as HTMLElement | null;
  if (!el) return;
  const path = location.pathname;
  if (!isTracked(path)) return;
  const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") || "" : "";
  const label = (
    el.getAttribute("data-track") ||
    el.getAttribute("aria-label") ||
    el.innerText ||
    el.getAttribute("title") ||
    ""
  ).replace(/\s+/g, " ").trim().slice(0, 120);
  const payload = JSON.stringify({
    type: "click",
    session_id: getSessionId(),
    path,
    label,
    href: href.slice(0, 500),
    kind: classifyClick(el, href, label),
    device: getDevice(),
  });
  try {
    const blob = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon("/api/track", blob)) {
      fetch("/api/track", { method: "POST", body: payload, keepalive: true });
    }
  } catch {
    // diamkan — analytics tak boleh ganggu UX
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  // Kunjungan yang sedang berjalan: path + waktu masuk. null = tak sedang dilacak.
  const current = useRef<{ path: string; enteredAt: number } | null>(null);

  useEffect(() => {
    // Kirim view yang sedang berjalan (dipanggil saat pindah halaman / tab hidden).
    const flush = () => {
      const c = current.current;
      if (!c) return;
      current.current = null;
      const duration_ms = Date.now() - c.enteredAt;
      if (duration_ms < MIN_DURATION_MS) return;
      const payload = JSON.stringify({
        session_id: getSessionId(),
        path: c.path,
        title: document.title,
        referrer: document.referrer,
        duration_ms,
        device: getDevice(),
      });
      try {
        const blob = new Blob([payload], { type: "application/json" });
        if (!navigator.sendBeacon("/api/track", blob)) {
          fetch("/api/track", { method: "POST", body: payload, keepalive: true });
        }
      } catch {
        // diamkan — analytics tak boleh ganggu UX
      }
    };

    // Mulai lacak halaman saat ini (kalau termasuk halaman publik).
    if (isTracked(pathname)) {
      current.current = { path: pathname, enteredAt: Date.now() };
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      } else if (isTracked(pathname) && !current.current) {
        // kembali ke tab — mulai hitung ulang dari sekarang
        current.current = { path: pathname, enteredAt: Date.now() };
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    // Cleanup dipanggil saat pathname berubah → catat durasi halaman sebelumnya.
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  // landing-klik-v1 — satu pendengar di dokumen (fase capture) untuk semua klik.
  useEffect(() => {
    const onClick = (e: MouseEvent) => sendClick(e.target);
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
