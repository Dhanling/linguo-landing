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
import { Bug, Upload, X } from "lucide-react";

type Severity = "critical" | "high" | "medium" | "low";

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "critical", label: "Parah — sama sekali gak bisa dipakai" },
  { value: "high", label: "Tinggi — fitur penting rusak" },
  { value: "medium", label: "Sedang — ganggu tapi masih bisa jalan" },
  { value: "low", label: "Ringan — tampilan / typo" },
];

const MAX_MB = 5;

export default function BugReportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const pickFile = (f: File | null) => {
    if (f && f.size > MAX_MB * 1024 * 1024) {
      toast.error(`Ukuran gambar maksimal ${MAX_MB}MB`);
      return;
    }
    setFile(f);
    if (!f) { setPreview(null); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const reset = () => {
    setTitle(""); setDescription(""); setSeverity("medium");
    setFile(null); setPreview(null);
  };

  const submit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi kamu habis — coba login ulang dulu ya");

      let screenshotUrl: string | null = null;
      if (file) {
        const ext = (file.name.split(".").pop() || "png").toLowerCase();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("bug-screenshots")
          .upload(path, file, { upsert: false });
        // Gambar gagal naik JANGAN membatalkan laporan — teks keluhannya yang paling
        // berharga; screenshot cuma pelengkap.
        if (upErr) {
          toast.warning("Gambarnya gagal diunggah, laporan tetap dikirim tanpa gambar.");
        } else {
          screenshotUrl = supabase.storage.from("bug-screenshots").getPublicUrl(path).data.publicUrl;
        }
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
        p_screenshot_url: screenshotUrl,
      });
      if (error) throw error;

      toast.success("Laporan terkirim — makasih! Tim Linguo bakal cek ya 🐛");
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim laporan");
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
      aria-label="Lapor Bug"
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
            <p className="text-[15px] font-bold text-slate-900">Lapor Bug</p>
            <p className="text-[12px] text-slate-500">
              Ada yang error atau aneh? Ceritain di sini — laporannya langsung masuk ke tim Linguo.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-gray-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-slate-700">
              Masalahnya apa? <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Tombol mulai simulasi gak bisa diklik"
              className={inputCls}
              maxLength={140}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-slate-700">
              Ceritain detailnya <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Lagi buka menu apa, ngeklik apa, terus yang muncul apa. Makin detail makin cepat kami perbaiki."
              className={`${inputCls} resize-y`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-slate-700">Seberapa mengganggu?</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className={inputCls}
            >
              {SEVERITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold text-slate-700">
              Screenshot <span className="font-medium text-slate-400">(opsional, tapi sangat membantu)</span>
            </label>
            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Pratinjau" className="max-h-56 w-full rounded-xl border border-slate-200 bg-gray-50 object-contain" />
                <button
                  onClick={() => pickFile(null)}
                  aria-label="Hapus gambar"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 shadow transition hover:bg-gray-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 px-4 py-5 text-slate-500 transition hover:border-[#16796E] hover:bg-gray-50"
              >
                <Upload className="h-5 w-5" />
                <span className="text-[12.5px] font-semibold">Pilih gambar — PNG/JPG, maks {MAX_MB}MB</span>
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-gray-50 px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-slate-500 transition hover:bg-gray-100 hover:text-slate-700"
          >
            Batal
          </button>
          <button
            onClick={submit}
            disabled={!valid || sending}
            className="rounded-xl bg-[#16796E] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-sm transition hover:bg-[#0F5A52] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Mengirim…" : "Kirim Laporan"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
