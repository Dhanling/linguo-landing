"use client";

// [chunk-reload-v1] Pemulih otomatis "bundle basi" sehabis deploy.
//
// Masalah: komponen tab dimuat lazy (next/dynamic). Sehabis deploy Vercel,
// browser yang masih memegang HTML/bundle LAMA menunjuk chunk hash lama yang
// sudah tidak ada di server → dynamic import gagal diam-diam → klik menu
// (mis. Sertifikat) terasa "mati" tanpa pesan apa pun.
//
// Solusi: dengarkan ChunkLoadError / kegagalan dynamic import di level window,
// lalu reload halaman SEKALI (ambil bundle baru). Guard sessionStorage +
// jendela 60 detik mencegah loop reload kalau errornya bukan karena deploy.

import { useEffect } from "react";

const KEY = "linguo:chunk-reload-at";
const MIN_INTERVAL_MS = 60_000;

const isChunkError = (s: string) =>
  /ChunkLoadError|Loading chunk [^ ]* failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(s);

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < MIN_INTERVAL_MS) return; // baru saja reload — jangan loop
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {}
  window.location.reload();
}

export default function ChunkReloader() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (isChunkError(String(e.message || ""))) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r: any = e.reason;
      const s = String((r && (r.name || "")) + " " + (r && (r.message || r)) || "");
      if (isChunkError(s)) reloadOnce();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
