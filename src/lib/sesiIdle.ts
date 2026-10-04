import { useEffect, useRef, useCallback } from "react";

// [akun-sesi-idle-v1] Auto-kunci idle 1 jam untuk dashboard siswa — salinan kembar dari
// `useSessionTimeout` di linguo-admin-dashboard (staf). Idle TIDAK langsung signOut: tab
// cuma dikunci lewat pop-up di atas halaman terakhir yang diburamkan; signOut baru jalan
// saat tombol "Masuk lagi sekarang" ditekan (lihat SesiBerakhirModal).
const TIMEOUT_MS = 60 * 60 * 1000; // 1 jam
const ACTIVITY_KEY = "linguo_akun_last_activity"; // aktivitas terakhir, DIBAGI lintas-tab
const LOGOUT_KEY = "linguo_akun_logout";
// sessionStorage (per tab): bertahan saat refresh, tidak bocor ke login berikutnya di tab lain.
const EXPIRED_KEY = "linguo_akun_session_expired";
export const SESI_BERAKHIR_EVENT = "linguo:akun-session-expired";

export function isSesiBerakhir(): boolean {
  try { return sessionStorage.getItem(EXPIRED_KEY) === "1"; } catch { return false; }
}
export function clearSesiBerakhir() {
  try { sessionStorage.removeItem(EXPIRED_KEY); } catch { /* private mode dsb. */ }
}
function markSesiBerakhir() {
  try { sessionStorage.setItem(EXPIRED_KEY, "1"); } catch { /* private mode dsb. */ }
  window.dispatchEvent(new Event(SESI_BERAKHIR_EVENT));
}

// Video/audio yang sedang diputar = siswa masih di depan layar walau tak menyentuh apa-apa
// (rekaman kelas 90 menit, Watch & Learn, listening simulasi). Tanpa ini pop-up menimpa
// tontonan tepat di menit ke-60.
function adaMediaDiputar(): boolean {
  const els = document.querySelectorAll<HTMLMediaElement>("video, audio");
  for (const el of Array.from(els)) {
    if (!el.paused && !el.ended && el.readyState > 2) return true;
  }
  return false;
}

export function useSesiIdle({ enabled = true }: { enabled?: boolean } = {}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readLastActivity = (): number => {
    try {
      const v = Number(localStorage.getItem(ACTIVITY_KEY));
      return Number.isFinite(v) && v > 0 ? v : Date.now();
    } catch { return Date.now(); }
  };
  const writeLs = (k: string, v: string) => {
    try { localStorage.setItem(k, v); } catch { /* private mode dsb. */ }
  };

  const expire = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    markSesiBerakhir();
  }, []);

  // Jadwalkan pengecekan sesuai SISA waktu dari aktivitas terakhir yang dibagi lintas-tab.
  // Saat timer nyala, cek ulang: kalau ternyata masih ada aktivitas (dari tab lain),
  // jangan kunci — jadwalkan ulang untuk sisa waktunya.
  const scheduleCheck = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const remaining = TIMEOUT_MS - (Date.now() - readLastActivity());
    if (remaining <= 0) {
      if (adaMediaDiputar()) {
        writeLs(ACTIVITY_KEY, Date.now().toString());
        timerRef.current = setTimeout(scheduleCheck, TIMEOUT_MS);
        return;
      }
      writeLs(LOGOUT_KEY, Date.now().toString());
      expire();
      return;
    }
    timerRef.current = setTimeout(scheduleCheck, remaining);
  }, [expire]);

  useEffect(() => {
    if (!enabled) return;
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    let lastReset = 0;
    const markActivity = () => {
      if (isSesiBerakhir()) return; // terkunci → gerakan mouse tak menghidupkan sesi lagi
      const now = Date.now();
      if (now - lastReset < 60_000) return; // throttle tulis localStorage & reschedule
      lastReset = now;
      writeLs(ACTIVITY_KEY, now.toString()); // broadcast ke tab lain
      scheduleCheck();
    };

    events.forEach((e) => window.addEventListener(e, markActivity, { passive: true }));
    const mediaTick = setInterval(() => { if (adaMediaDiputar()) markActivity(); }, 60_000);

    // Refresh saat terkunci → tetap terkunci (jangan dihitung sebagai aktivitas baru).
    if (!isSesiBerakhir()) {
      writeLs(ACTIVITY_KEY, Date.now().toString());
      scheduleCheck();
    }

    const handleStorage = (e: StorageEvent) => {
      // Aktivitas dari tab lain → tab ini ikut "hidup", jadwalkan ulang.
      if (e.key === ACTIVITY_KEY) {
        if (!isSesiBerakhir()) scheduleCheck();
        return;
      }
      // Semua tab sudah idle dan satu tab mengunci → ikut terkunci.
      if (e.key === LOGOUT_KEY && e.newValue) expire();
    };
    window.addEventListener("storage", handleStorage);
    // Timer dibekukan browser selama laptop tidur / tab di latar → cek ulang saat kembali.
    const handleVisible = () => { if (document.visibilityState === "visible" && !isSesiBerakhir()) scheduleCheck(); };
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(mediaTick);
      events.forEach((e) => window.removeEventListener(e, markActivity));
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [scheduleCheck, expire, enabled]);
}
