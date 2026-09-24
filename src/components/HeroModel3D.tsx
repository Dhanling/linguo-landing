"use client";
// [hero-3d-v1] Karakter hero versi 3D (GLB dari Tripo, dikompres ke ~1,6 MB:
// tekstur WebP + mesh terkuantisasi, jadi tidak butuh decoder Draco/Meshopt).
// PNG lama tetap jadi lapisan awal & LCP — model-viewer (three.js ~250 KB gz)
// baru diunduh saat browser idle, hanya di desktop, dan dilewati kalau
// pengguna minta hemat data. Begitu GLB selesai dimuat, PNG memudar keluar.
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}

const MODEL_SRC = "/models/hero-character.glb";

export default function HeroModel3D({ alt }: { alt: string }) {
  const [aktif, setAktif] = useState(false);   // modul model-viewer sudah terdaftar
  const [siap, setSiap] = useState(false);     // GLB sudah dirender
  const [diam, setDiam] = useState(false);     // prefers-reduced-motion
  const mvRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    setDiam(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    let batal = false;
    const mulai = () => {
      import("@google/model-viewer").then(() => { if (!batal) setAktif(true); }).catch(() => {});
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(mulai, { timeout: 3000 }) : window.setTimeout(mulai, 1500);
    return () => {
      batal = true;
      if (w.cancelIdleCallback) w.cancelIdleCallback(id); else clearTimeout(id);
    };
  }, []);

  // Event "load" custom element dipasang manual — onLoad di JSX tidak andal untuk web component.
  useEffect(() => {
    const el = mvRef.current;
    if (!aktif || !el) return;
    const onLoad = () => setSiap(true);
    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
  }, [aktif]);

  return (
    <div className="relative w-full h-full">
      <Image
        src="/images/hero-character.png" alt={siap ? "" : alt} aria-hidden={siap || undefined}
        width={810} height={656} priority sizes="(min-width: 1024px) 810px, 0px"
        className={`w-full h-full object-contain drop-shadow-2xl transition-opacity duration-700 ${siap ? "opacity-0" : "opacity-100"}`}
      />
      {aktif && (
        <model-viewer
          src={MODEL_SRC}
          alt={alt}
          camera-controls=""
          disable-zoom=""
          disable-pan=""
          interaction-prompt="none"
          {...(diam ? {} : { "auto-rotate": "", "auto-rotate-delay": "2500", "rotation-per-second": "12deg" })}
          camera-orbit="-35deg 80deg auto"
          min-camera-orbit="auto 60deg auto"
          max-camera-orbit="auto 100deg auto"
          shadow-intensity="0.6"
          shadow-softness="1"
          exposure="1.05"
          environment-image="neutral"
          loading="eager"
          ref={mvRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", opacity: siap ? 1 : 0, transition: "opacity .7s ease", ["--poster-color" as string]: "transparent", outline: "none" }}
        />
      )}
    </div>
  );
}
