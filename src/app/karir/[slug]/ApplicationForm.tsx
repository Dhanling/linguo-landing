"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Upload, Loader2, CheckCircle } from "lucide-react";

type Props = {
  openingId: string;
  openingTitle: string;
};

const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function ApplicationForm({ openingId, openingTitle }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    cover_letter: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > MAX_SIZE) {
      setError("Ukuran file maksimal 5MB.");
      setCvFile(null);
      return;
    }

    if (!ALLOWED_MIME.includes(f.type)) {
      setError("Format file harus PDF atau DOC/DOCX.");
      setCvFile(null);
      return;
    }

    setError(null);
    setCvFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Nama, email, dan nomor WhatsApp wajib diisi.");
      return;
    }
    if (!cvFile) {
      setError("CV wajib diupload.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload CV ke private bucket
      const ext = cvFile.name.split(".").pop() || "pdf";
      const safeEmail = form.email.replace(/[^a-z0-9]/gi, "_");
      const cvPath = `${openingId}/${Date.now()}-${safeEmail}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("job-cvs")
        .upload(cvPath, cvFile, {
          contentType: cvFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload CV gagal: ${uploadError.message}`);
      }

      // 2. Insert ke job_applications
      const { error: insertError } = await supabase
        .from("job_applications")
        .insert({
          opening_id: openingId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          cover_letter: form.cover_letter.trim() || null,
          cv_url: cvPath,
          status: "new",
        });

      if (insertError) {
        throw new Error(`Submit lamaran gagal: ${insertError.message}`);
      }

      setDone(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-14 w-14 mx-auto text-green-500 mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Lamaran Terkirim!
        </h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          Terima kasih sudah melamar di posisi{" "}
          <strong>{openingTitle}</strong>. Tim HR Linguo akan menghubungi Anda
          via WhatsApp/email kalau profil cocok.
        </p>
        <button
          type="button"
          onClick={() => router.push("/karir")}
          className="text-sm text-[#1A9E9E] hover:underline font-medium"
        >
          ← Lihat lowongan lain
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:border-[#1A9E9E] focus:ring-1 focus:ring-[#1A9E9E] outline-none"
            placeholder="Nama lengkap"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:border-[#1A9E9E] focus:ring-1 focus:ring-[#1A9E9E] outline-none"
            placeholder="nama@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Nomor WhatsApp <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:border-[#1A9E9E] focus:ring-1 focus:ring-[#1A9E9E] outline-none"
          placeholder="081234567890"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Cover Letter / Pesan Singkat
        </label>
        <textarea
          rows={4}
          value={form.cover_letter}
          onChange={(e) =>
            setForm({ ...form, cover_letter: e.target.value })
          }
          className="w-full px-3 py-2 text-sm border rounded-lg focus:border-[#1A9E9E] focus:ring-1 focus:ring-[#1A9E9E] outline-none resize-none"
          placeholder="Kenapa Anda cocok untuk posisi ini? (opsional)"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Upload CV (PDF/DOC, maks 5MB){" "}
          <span className="text-red-500">*</span>
        </label>
        <label className="flex items-center justify-center gap-2 w-full px-3 py-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#1A9E9E] hover:bg-teal-50 transition-colors">
          <Upload className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 truncate">
            {cvFile ? cvFile.name : "Klik untuk pilih file CV"}
          </span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#1A9E9E] hover:bg-[#178585] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Mengirim...
          </>
        ) : (
          "Kirim Lamaran"
        )}
      </button>
    </form>
  );
}
