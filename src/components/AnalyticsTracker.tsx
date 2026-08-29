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
const EXCLUDED_PREFIXES = ["/akun", "/student", "/onboarding", "/auth", "/life"];
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

  return null;
}
