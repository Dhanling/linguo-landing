"use client";

// [vc-recmodal-v1] "Tonton Recording" tanpa meninggalkan halaman.
//
// Sebelumnya tombol rekaman membawa siswa ke halaman tersendiri
// (/akun/rekaman/<roomId>): jadwal atau daftar sesi yang sedang dibuka hilang,
// dan kembali ke posisi semula berarti memuat ulang seluruh dashboard. Sekarang
// rekamannya muncul sebagai pop-up di atas halaman yang sama.
//
// Halaman /akun/rekaman/<roomId> SENGAJA dipertahankan: tautan itu sudah
// terlanjur dikirim ke WhatsApp siswa lewat pesan "kelas selesai".

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Loader2, Video, X } from "lucide-react";
import { resolveSessionForGate } from "@/lib/supabase-client";
import { roomIdFromRecordingUrl } from "@/lib/classRoom";
import { ClassVideoPlayer } from "./ClassVideoPlayer";

interface RecordingItem {
  key: string;
  url: string;
  recordedAt: string;
  sizeBytes: number;
}

type State =
  | { s: "loading" }
  | { s: "ok"; items: RecordingItem[] }
  | { s: "external"; url: string }
  | { s: "error"; msg: string };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

/** Deep link dashboard → diputar di sini. Tautan lain (Drive/Zoom) → tab baru. */
const isDashboardDeepLink = (url: string) =>
  url.includes("dashboard.linguo.id") && url.includes("room=");

export default function RecordingModal({
  recordingUrl, title, onClose,
}: {
  recordingUrl: string;
  title?: string;
  onClose: () => void;
}) {
  const [st, setSt] = useState<State>({ s: "loading" });

  useEffect(() => {
    let alive = true;
    const roomId = isDashboardDeepLink(recordingUrl) ? roomIdFromRecordingUrl(recordingUrl) : null;
    if (!roomId) { setSt({ s: "external", url: recordingUrl }); return; }
    (async () => {
      const v = await resolveSessionForGate();
      const token = v.session?.access_token;
      if (!token) {
        if (alive) setSt({ s: "error", msg: v.uncertain ? "Sesi belum siap. Coba muat ulang halaman." : "Kamu perlu masuk dulu untuk menonton rekaman." });
        return;
      }
      try {
        const res = await fetch("/api/class-recording", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, accessToken: token }),
        });
        const body = await res.json();
        if (!alive) return;
        if (!res.ok) { setSt({ s: "error", msg: body?.error || "Gagal memuat rekaman" }); return; }
        const items: RecordingItem[] = body.recordings || [];
        setSt(items.length
          ? { s: "ok", items }
          : { s: "error", msg: "Rekaman sesi ini belum tersedia — biasanya muncul beberapa menit setelah kelas selesai." });
      } catch {
        if (alive) setSt({ s: "error", msg: "Koneksi bermasalah saat memuat rekaman" });
      }
    })();
    return () => { alive = false; };
  }, [recordingUrl]);

  // Escape menutup — kecuali saat video sedang layar penuh (Escape milik dia dulu).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", onKey);
    // Halaman di belakang jangan ikut menggulir saat pop-up terbuka.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-center p-4"
      style={{ background: "rgba(10,26,29,.78)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Rekaman kelas"}
    >
      <div
        className="w-full max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0C2A31]"
        style={{ maxWidth: 940, boxShadow: "0 24px 70px rgba(0,0,0,.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 text-white">
          <Video className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14.5px] font-extrabold">{title || "Rekaman Kelas"}</div>
            <div className="truncate text-[11.5px] font-semibold text-[#8FB8B4]">
              Tautan pemutaran berlaku 1 jam — tutup lalu buka lagi kalau kedaluwarsa.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            title="Tutup (Esc)"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white"
            style={{ background: "rgba(255,255,255,.12)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {st.s === "loading" && (
          <div className="grid aspect-video place-items-center bg-[#081E24]">
            <Loader2 className="h-7 w-7 animate-spin text-[#4E8C88]" />
          </div>
        )}

        {st.s === "ok" && (
          <div className="flex flex-col gap-3">
            {st.items.map((r, i) => (
              <div key={r.key}>
                <ClassVideoPlayer src={r.url} autoPlay={i === 0} keyboard={i === 0} />
                {st.items.length > 1 && (
                  <p className="m-0 px-4 py-1.5 text-[12px] font-bold text-[#8FB8B4]">{fmtDate(r.recordedAt)}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {(st.s === "error" || st.s === "external") && (
          <div className="bg-[#081E24] px-6 py-12 text-center">
            <p className="m-0 text-[13.5px] font-bold text-white">
              {st.s === "error"
                ? st.msg
                : "Rekaman ini dibagikan lewat layanan lain (Google Drive / Zoom), jadi dibuka di tab baru."}
            </p>
            {st.s === "external" && (
              <a
                href={st.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#16796E] px-4 py-2.5 text-[13px] font-bold text-white no-underline hover:bg-[#0F5A52]"
              >
                <ExternalLink className="h-4 w-4" /> Buka rekaman
              </a>
            )}
          </div>
        )}

        <p className="m-0 px-4 py-2.5 text-[11.5px] font-semibold text-[#6F9A96]">
          Pintasan: <b>spasi</b> putar/jeda · <b>← →</b> mundur/maju 5 detik · <b>J / L</b> 10 detik · <b>F</b> layar penuh · <b>M</b> bisu
        </p>
      </div>
    </div>,
    document.body,
  );
}
