/* [boot-splash-v1] Pengendali tirai muat-ulang dashboard siswa.
 *
 * Tirainya sendiri dirender SERVER di src/app/akun/layout.tsx (ada di HTML awal,
 * sebelum hidrasi) bersama skrip yang memasang kelas `lms-dark` sebelum paint
 * pertama. Aturannya satu: tirai tetap menutup selama masih ada pemuat layar
 * penuh (<BootLoader> / <BootHold>) yang terpasang, dan dicabut begitu shell
 * sudah mount dan tak ada lagi yang menahan — artinya layar yang terpaint adalah
 * layar tujuan. Pergantian antar-pemuat dalam satu commit tak pernah bocor karena
 * pemeriksaan ditunda dua frame setelah pelepasan terakhir.
 *
 * Layout /akun bertahan lintas navigasi client-side, jadi tirai cuma bekerja
 * pada muat penuh; pindah menu tidak pernah menampilkannya lagi.
 * Cermin dari src/lib/bootSplash.ts di repo linguo-admin-dashboard.
 */
import { useEffect } from "react";

let holds = 0;
let mounted = false;
let done = false;
let checking = false;

/** Cabut tirai (idempoten). Menunggu font yang sedang dimuat maksimal 1,2 dtk
    supaya teks tidak berganti rupa tepat setelah tirai terbuka. */
export function dismissBootSplash() {
  if (done) return;
  done = true;
  const fire = () => {
    try { (window as { __bootSplashDismiss?: () => void }).__bootSplashDismiss?.(); } catch { /* abaikan */ }
  };
  const fonts = typeof document !== "undefined" ? document.fonts?.ready : undefined;
  if (!fonts) { fire(); return; }
  let fired = false;
  const once = () => { if (!fired) { fired = true; fire(); } };
  fonts.then(once, once);
  setTimeout(once, 1200);
}

function settle() {
  if (done || checking || typeof window === "undefined") return;
  checking = true;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    checking = false;
    if (mounted && holds === 0) dismissBootSplash();
  }));
}

/** Tahan tirai selama pemuat layar penuh terpasang; kembalikan fungsi pelepas. */
export function holdBootSplash(): () => void {
  holds++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds--;
    settle();
  };
}

/** Dipanggil sekali dari layout /akun: sejak ini, "tak ada penahan" = layar tujuan. */
export function markAppMounted() {
  mounted = true;
  settle();
}

/** Hook untuk komponen pemuat layar penuh. */
export function useBootHold() {
  useEffect(() => holdBootSplash(), []);
}
