"use client";

/* [linguo-patch:produk-digital-link-v1]
 * Pemutar YouTube di dalam dashboard siswa.
 *
 * Sebelum ini produk E-Learning selalu dibuka lewat `window.open` ke YouTube —
 * siswa keluar dari dashboard, dan kalau linknya salah dia mendarat di beranda
 * YouTube tanpa tahu harus ke mana. Sekarang playlist-nya diputar di tempat;
 * tombol "Buka di YouTube" tetap ada buat yang mau menonton di aplikasi.
 *
 * [elearning-playlist-isi-v1] Materi e-learning itu playlist berisi belasan
 * pertemuan, tapi bingkai embed cuma memperlihatkan video pertama — siswa yang
 * ingin mengulang pertemuan ke-5 harus menonton berurutan atau kabur ke
 * YouTube. Sekarang seluruh isi playlist ditampilkan sebagai daftar di samping
 * pemutar (di bawahnya pada layar HP), tinggal diketuk. Daftarnya dibaca lewat
 * edge function `yt-playlist`; kalau gagal dibaca, pemutarnya tetap jalan
 * seperti dulu — daftar itu tambahan, bukan syarat.
 */

import { useEffect, useState } from "react";
import { fetchPlaylist, type PlaylistInfo, type YouTubeRef } from "@/lib/youtube";

export type PlayerTarget = { title: string; ref: YouTubeRef };

export default function YouTubePlayerModal({
  target,
  onClose,
}: {
  target: PlayerTarget | null;
  onClose: () => void;
}) {
  // Daftar isi playlist + video yang sedang dipilih dari daftar itu.
  const [list, setList] = useState<PlaylistInfo | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const listId = target?.ref.listId ?? null;

  useEffect(() => {
    setPick(null);
    setList(null);
    if (!listId) return;
    let alive = true;
    fetchPlaylist(listId).then((r) => {
      if (alive && !("error" in r)) setList(r);
    });
    return () => { alive = false; };
  }, [listId]);

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

  const src = pick && target.ref.listId
    ? `https://www.youtube.com/embed/${pick}?list=${encodeURIComponent(target.ref.listId)}&autoplay=1&rel=0`
    : `${target.ref.embedUrl}${target.ref.embedUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0`;

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
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="aspect-video w-full flex-1 overflow-hidden rounded-xl bg-black">
            <iframe
              key={pick ?? "default"}
              src={src}
              title={target.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {/* Daftar pertemuan. Cuma muncul kalau playlist-nya benar-benar
              terbaca DAN isinya lebih dari satu — untuk video tunggal daftar
              satu baris hanya bikin sempit. */}
          {list && list.items.length > 1 && (
            <div className="w-full shrink-0 lg:w-72">
              <div className="mb-1.5 text-xs font-semibold text-white/70">
                {list.count} video · {list.title || "Playlist"}
              </div>
              <div className="max-h-40 divide-y divide-white/10 overflow-y-auto rounded-xl bg-white/5 lg:max-h-[calc(100%-1.75rem)]">
                {list.items.map((it, i) => {
                  const active = (pick ?? list.items[0].videoId) === it.videoId;
                  return (
                    <button
                      key={it.videoId}
                      type="button"
                      onClick={() => setPick(it.videoId)}
                      className={`flex w-full items-center gap-2 px-2 py-2 text-left text-xs ${
                        active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <span className="w-5 shrink-0 tabular-nums text-white/50">{i + 1}.</span>
                      {it.thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.thumb} alt="" className="h-8 w-14 shrink-0 rounded object-cover" loading="lazy" />
                      )}
                      <span className="line-clamp-2 flex-1">{it.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
