"use client";
// [reguler-buka-dari-batch-v1] Bahasa Kelas Reguler yang sedang dibuka, untuk
// komponen klien. Satu fetch per tab (promise di tingkat modul).
// null = belum termuat / gagal → pemanggil memakai daftar statis REGULER_LANGS;
// rute bayar tetap menolak bahasa yang tertutup.
import { useEffect, useState } from "react";

let pending: Promise<string[] | null> | null = null;

function load(): Promise<string[] | null> {
  if (!pending) {
    pending = fetch("/api/reguler-buka")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j && Array.isArray(j.langs) ? (j.langs as string[]) : null))
      .catch(() => null);
  }
  return pending;
}

export function useOpenRegulerLangs(): string[] | null {
  const [langs, setLangs] = useState<string[] | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((l) => {
      if (alive) setLangs(l);
    });
    return () => {
      alive = false;
    };
  }, []);
  return langs;
}
