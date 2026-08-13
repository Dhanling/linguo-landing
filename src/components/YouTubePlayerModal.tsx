"use client";

/* [linguo-patch:produk-digital-link-v1]
 * Pemutar YouTube di dalam dashboard siswa.
 *
 * Sebelum ini produk E-Learning selalu dibuka lewat `window.open` ke YouTube —
 * siswa keluar dari dashboard, dan kalau linknya salah dia mendarat di beranda
 * YouTube tanpa tahu harus ke mana. Sekarang playlist-nya diputar di tempat;
 * tombol "Buka di YouTube" tetap ada buat yang mau menonton di aplikasi.
 */

import { useEffect } from "react";
import type { YouTubeRef } from "@/lib/youtube";

export type PlayerTarget = { title: string; ref: YouTubeRef };

export default function YouTubePlayerModal({
  target,
  onClose,
}: {
  target: PlayerTarget | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    // kunci scroll latar selama pemutar terbuka
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [target, onClose]);

  if (!target) return null;

  const src = `${target.ref.embedUrl}${target.ref.embedUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={target.title}
    >
      <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-2">
          <span className="flex-1 truncate text-sm sm:text-base font-medium text-white">{target.title}</span>
          <a
            href={target.ref.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs sm:text-sm text-white/70 hover:text-white underline underline-offset-2"
          >
            Buka di YouTube
          </a>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="shrink-0 rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={src}
            title={target.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
