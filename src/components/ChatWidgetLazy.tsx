"use client";

// Client wrapper so ChatWidget can be code-split out of the initial bundle.
// It's a floating helper (FAB + chat drawer) with no above-the-fold content,
// so deferring it past hydration costs nothing visually but removes ~460 lines
// of JS (chat logic + polling) from every page's first load.
//
// [chat-widget-idle-v1] Dulu chunk-nya tetap diunduh & dijalankan tepat sesudah
// hydrate — ikut berebut main thread di HP saat halaman baru tampil. Sekarang
// baru di-mount sesudah event `load` + browser idle (maks. 3 dtk menunggu idle).
// Tak ada komponen lain yang membuka chat lewat event, jadi FAB yang muncul
// sedikit belakangan tidak memutus alur apa pun.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

export default function ChatWidgetLazy() {
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const jadwalkan = () => {
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => setSiap(true), { timeout: 3000 });
      else timer = setTimeout(() => setSiap(true), 1500);
    };
    if (document.readyState === "complete") jadwalkan();
    else window.addEventListener("load", jadwalkan, { once: true });
    return () => {
      window.removeEventListener("load", jadwalkan);
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      clearTimeout(timer);
    };
  }, []);

  return siap ? <ChatWidget /> : null;
}
