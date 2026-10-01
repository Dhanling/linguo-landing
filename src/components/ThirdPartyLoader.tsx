"use client";

// [third-party-interaksi-v1] Pustaka GA4 (±170 KB) & Pixel Meta (±200 KB) baru
// diunduh saat pengunjung pertama kali berinteraksi (scroll / sentuh / mouse /
// keyboard) atau 15 dtk sesudah halaman selesai dimuat — mana yang duluan.
// Dulu `lazyOnload`: tetap jalan di detik ke-8-an dan tugas JS-nya masuk hitungan
// TBT PageSpeed HP. Stub gtag/fbq di layout.tsx tetap dipasang sejak awal, jadi
// PageView & event yang terjadi sebelum pustakanya datang diantrekan
// (dataLayer / fbq.queue) lalu dikirim begitu pustaka tiba — tidak hilang,
// kecuali pengunjung pergi < 15 dtk tanpa menyentuh apa pun.
import { useEffect } from "react";

const EVENTS = ["scroll", "pointerdown", "touchstart", "keydown", "mousemove"] as const;

export default function ThirdPartyLoader({ srcs }: { srcs: string[] }) {
  useEffect(() => {
    if (!srcs.length) return;
    let sudah = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const muat = () => {
      if (sudah) return;
      sudah = true;
      lepas();
      for (const src of srcs) {
        if (document.querySelector(`script[src="${src}"]`)) continue;
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        document.head.appendChild(s);
      }
    };
    const onLoad = () => { timer = setTimeout(muat, 15000); };
    const lepas = () => {
      EVENTS.forEach((e) => window.removeEventListener(e, muat));
      window.removeEventListener("load", onLoad);
      clearTimeout(timer);
    };
    EVENTS.forEach((e) => window.addEventListener(e, muat, { once: true, passive: true }));
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return lepas;
  }, [srcs]);
  return null;
}
