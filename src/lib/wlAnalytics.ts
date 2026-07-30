// Analitik produk untuk Watch & Learn (web).
//
// Kenapa: kita ingin tahu FITUR MANA di /watch yang paling banyak dibuka orang
// dan BERAPA LAMA waktu dihabiskan di sana, tanpa memasang SDK berat.
//
// Menumpang tabel `public.analytics_events` yang SAMA dengan aplikasi mobile
// (project Supabase jbtgciepdmqxxcjflrxz dipakai bersama), jadi dashboard admin
// bisa membacanya lewat RPC wl_admin_* tanpa infrastruktur baru:
//   • feature_open  → satu baris tiap panel dibuka (kompatibel dgn view
//                     feature_usage_summary yang sudah ada).
//   • feature_close → props.ms = lama panel terbuka (milidetik) → dipakai untuk
//                     metrik "waktu dihabiskan".
//
// Fire-and-forget: TIDAK PERNAH throw — analitik tak boleh merusak layar.
"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-client";

const SESSION_KEY = "wl-analytics-sid";

// Satu id per tab/sesi browser, supaya "10 open dari 1 sesi" bisa dibedakan dari
// "10 open dari 10 sesi" walau pengguna belum login.
function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return "no-storage";
  }
}

// user id di-cache dari satu langganan auth, biar tiap event tak perlu round-trip.
let cachedUserId: string | null = null;
if (typeof window !== "undefined") {
  supabase.auth
    .getUser()
    .then(({ data }) => {
      cachedUserId = data.user?.id ?? null;
    })
    .catch(() => {});
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null;
  });
}

export type WlProps = Record<string, string | number | boolean | null | undefined>;

/** Catat satu event produk. Fire-and-forget, menelan semua error. */
export async function trackWl(event: string, props: WlProps = {}) {
  if (typeof window === "undefined") return;
  try {
    await supabase.from("analytics_events").insert({
      user_id: cachedUserId,
      event,
      props: { area: "watch", ...props },
      platform: "web",
      app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? "landing",
      session_id: sessionId(),
    });
  } catch {
    /* diam — analitik tak boleh mengganggu UX */
  }
}

/**
 * Instrumentasi satu panel WL: kirim `feature_open` saat `isOpen` menjadi true,
 * dan `feature_close` (dengan `ms` = durasi) saat panel ditutup atau di-unmount.
 *
 * Pasang satu baris di komponen yang punya state buka/tutup:
 *   useWlPanel("watch_kosakata", deckOpen);
 *
 * `feature` = kunci stabil snake_case yang dikelompokkan dashboard.
 *
 * `extra` = dimensi tambahan yang ikut dikirim di kedua event (mis. `lang`,
 * `lang_label`, `video_id`) supaya dashboard bisa memecah pemakaian PER BAHASA.
 * Disimpan di ref: isinya boleh berubah tiap render tanpa memicu open/close palsu
 * (kalau masuk dependency array, ganti judul video = "buka panel" baru).
 */
export function useWlPanel(feature: string, isOpen: boolean, extra?: WlProps) {
  const openedAt = useRef<number | null>(null);
  const extraRef = useRef<WlProps | undefined>(extra);
  extraRef.current = extra;
  useEffect(() => {
    if (!isOpen) return;
    openedAt.current = Date.now();
    // Snapshot saat dibuka: kalau pengguna ganti bahasa/video sambil panel terbuka,
    // durasi tetap jatuh ke bahasa yang benar-benar ditonton saat itu.
    const opened = { ...extraRef.current };
    void trackWl("feature_open", { feature, ...opened });
    return () => {
      const ms = openedAt.current ? Date.now() - openedAt.current : 0;
      openedAt.current = null;
      if (ms > 0) void trackWl("feature_close", { feature, ms, ...opened });
    };
  }, [feature, isOpen]);
}

// Detak jantung "masih di sini" — feature_open cuma sekali saat panel dibuka, jadi
// orang yang menonton video 20 menit TIDAK terlihat oleh metrik apa pun sampai ia
// menutup tab. Heartbeat tiap menit membuat kartu "Aktif sekarang" di dashboard
// (jendela 5 menit) memantulkan siapa yang benar-benar sedang memakai Watch & Learn.
const HEARTBEAT_MS = 60_000;

/**
 * Kirim event `heartbeat` tiap menit selama `active` && tab terlihat.
 * Berhenti saat tab disembunyikan (tab nganggur di background bukan "pengguna aktif")
 * dan langsung berdetak lagi begitu tab dibuka kembali.
 */
export function useWlHeartbeat(active: boolean, extra?: WlProps) {
  const extraRef = useRef<WlProps | undefined>(extra);
  extraRef.current = extra;
  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const beat = () => {
      if (document.visibilityState !== "visible") return;
      void trackWl("heartbeat", { ...extraRef.current });
    };
    const start = () => {
      if (timer) return;
      beat();
      timer = setInterval(beat, HEARTBEAT_MS);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };
    const onVis = () => (document.visibilityState === "visible" ? start() : stop());
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active]);
}
