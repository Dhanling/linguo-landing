"use client";

// [bug-report-pengajar-siswa-v1]
// Form "Lapor Bug" buat SISWA. Laporannya mendarat di tabel bug_reports yang sama
// dengan laporan tim → langsung kelihatan di menu Bug Tracker dashboard admin.
//
// Kenapa lewat RPC `submit_bug_report`, bukan insert langsung: identitas pelapor
// (nama + peran) diresolve SERVER-SIDE. Siswa tidak punya baris `profiles`, jadi
// kalau namanya di-join belakangan kolom Reporter di Bug Tracker selalu "Unknown".

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { Bug, Film, Upload, X } from "lucide-react";
import { useT } from "@/lib/uiLang"; // [ui-lang-switcher-v1]

type Severity = "critical" | "high" | "medium" | "low";

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "critical", label: "Parah — sama sekali gak bisa dipakai" },
  { value: "high", label: "Tinggi — fitur penting rusak" },
  { value: "medium", label: "Sedang — ganggu tapi masih bisa jalan" },
  { value: "low", label: "Ringan — tampilan / typo" },
];

// [bug-attachments-v1] Satu laporan boleh bawa beberapa lampiran: foto DAN video
// rekaman layar, biar kronologi bug-nya kebaca utuh.
const MAX_MB = 5;
const MAX_VIDEO_MB = 50;
const MAX_FILES = 5;

// Preview pakai objectURL, bukan data-URL: video 50MB di-base64 bikin HP-nya ngos-ngosan.
type Picked = { file: File; url: string; isVideo: boolean };

export default function BugReportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useT(); // [ui-lang-switcher-v1]
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // objectURL wajib di-revoke manual waktu komponennya dibongkar.
  useEffect(
    () => () => {
      setPicked((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return [];
      });
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const room = MAX_FILES - picked.length;
    if (room <= 0) {
      toast.error(`Maksimal ${MAX_FILES} lampiran per laporan`);
      return;
    }
    const accepted: Picked[] = [];
    let overflow = 0;
    for (const f of Array.from(list)) {
      if (accepted.length >= room) { overflow++; continue; }
      const isVideo = f.type.startsWith("video/");
      const maxMb = isVideo ? MAX_VIDEO_MB : MAX_MB;
      if (f.size > maxMb * 1024 * 1024) {
        toast.error(`"${f.name}" kegedean — maksimal ${maxMb}MB buat ${isVideo ? "video" : "gambar"}`);
        continue;
      }
      accepted.push({ file: f, url: URL.createObjectURL(f), isVideo });
    }
    if (overflow > 0) toast.error(`Cuma ${MAX_FILES} lampiran yang muat — sisanya dilewat`);
    if (accepted.length > 0) setPicked((prev) => [...prev, ...accepted]);
  };

  const removeAt = (idx: number) => {
    setPicked((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const reset = () => {
    setTitle(""); setDescription(""); setSeverity("medium");
    setPicked((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
  };

  const submit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("Sesi kamu habis — coba login ulang dulu ya"));

      // Lampiran gagal naik JANGAN membatalkan laporan — teks keluhannya yang paling
      // berharga; foto/video cuma pelengkap. Yang gagal dilewat, sisanya tetap ikut.
      const attachments: { url: string; kind: "image" | "video"; name: string; size: number }[] = [];
      let failed = 0;
      for (let i = 0; i < picked.length; i++) {
        const f = picked[i].file;
        const ext = (f.name.split(".").pop() || "png").toLowerCase();
        const path = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("bug-screenshots")
          .upload(path, f, { upsert: false, contentType: f.type || undefined });
        if (upErr) { failed++; continue; }
        attachments.push({
          url: supabase.storage.from("bug-screenshots").getPublicUrl(path).data.publicUrl,
          kind: picked[i].isVideo ? "video" : "image",
          name: f.name,
          size: f.size,
        });
      }
      if (failed > 0) {
        toast.warning(`${failed} lampiran gagal diunggah, laporan tetap dikirim tanpa itu.`);
      }

      const { error } = await supabase.rpc("submit_bug_report", {
        p_title: title.trim(),
        p_description: description.trim(),
        p_severity: severity,
        p_page_url: window.location.href,
        p_browser_info: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString(),
        },
        // Diisi server dari gambar pertama; dikirim null biar sumbernya cuma satu.
        p_screenshot_url: null,
        p_attachments: attachments,
      });
      if (error) throw error;

      toast.success(t("Laporan terkirim — makasih! Tim Linguo bakal cek ya 🐛"));
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Gagal mengirim laporan"));
    } finally {
      setSending(false);
    }
  };

  const valid = title.trim().length > 0 && description.trim().length > 0;
  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] text-slate-900 outline-none transition focus:border-[#16796E] focus:ring-2 focus:ring-[#16796E]/20";

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
aria-label={t("Lapor Bug")}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#16796E]">
            <Bug className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-slate-900">{t("Lapor Bug")}</p>
            <p className="text-[12px] text-slate-500">
              {t("Ada yang error atau aneh? Ceritain di sini — laporannya langsung masuk ke tim Linguo.")}
            </p>
          </div>
          <button
            onClick={onClose}
aria-label={t("Tutup")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-gray-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-slate-700">
              {t("Masalahnya apa?")} <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("Contoh: Tombol mulai simulasi gak bisa diklik")}
              className={inputCls}
              maxLength={140}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-slate-700">
              {t("Ceritain detailnya")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={t("Lagi buka menu apa, ngeklik apa, terus yang muncul apa. Makin detail makin cepat kami perbaiki.")}
              className={`${inputCls} resize-y`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-slate-700">{t("Seberapa mengganggu?")}</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className={inputCls}
            >
              {SEVERITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t(o.label)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-slate-700">
              {t("Foto / Video")}{" "}
              <span className="font-medium text-slate-400">
                ({t("opsional, tapi sangat membantu")} — {picked.length}/{MAX_FILES})
              </span>
            </label>
            {picked.length > 0 && (
              <div className="mb-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {picked.map((p, i) => (
                  <div key={p.url} className="relative overflow-hidden rounded-xl border border-slate-200 bg-gray-50">
                    {p.isVideo ? (
                      <video src={p.url} controls preload="metadata" playsInline className="h-28 w-full bg-black object-contain" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url} alt={p.file.name} className="h-28 w-full object-contain" />
                    )}
                    <button
                      onClick={() => removeAt(i)}
                      aria-label={`${t("Hapus")} ${p.file.name}`}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-600 shadow transition hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="flex items-center gap-1 px-2 py-1 text-[10.5px] text-slate-500">
                      {p.isVideo && <Film className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{p.file.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {picked.length < MAX_FILES && (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 px-4 py-5 text-slate-500 transition hover:border-[#16796E] hover:bg-gray-50"
              >
                <Upload className="h-5 w-5" />
                <span className="text-[12.5px] font-semibold">
                  {t("Pilih foto atau video — boleh beberapa sekaligus")}
                </span>
                <span className="text-[11px]">
                  {t("Gambar maks")} {MAX_MB}MB · {t("video maks")} {MAX_VIDEO_MB}MB
                </span>
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                // Reset biar file yang sama bisa dipilih lagi setelah dihapus.
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-gray-50 px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-slate-500 transition hover:bg-gray-100 hover:text-slate-700"
          >
            {t("Batal")}
          </button>
          <button
            onClick={submit}
            disabled={!valid || sending}
            className="rounded-xl bg-[#16796E] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-sm transition hover:bg-[#0F5A52] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? t("Mengirim…") : t("Kirim Laporan")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
