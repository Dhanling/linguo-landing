"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Loader2, CheckCircle, Linkedin, Link2, GraduationCap, FileText } from "lucide-react";

type Props = {
  openingId: string;
  openingTitle: string;
};

const LINKEDIN_PATTERN = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-%.]+\/?(\?.*)?$/i;

function validateLinkedIn(url: string): boolean {
  return LINKEDIN_PATTERN.test(url.trim());
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return "https://" + trimmed;
}

export default function ApplicationForm({ openingId, openingTitle }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin_url: "",
    portfolio_url: "",
    education: "",
    experience_summary: "",
    cover_letter: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Nama, email, dan nomor WhatsApp wajib diisi.");
      return;
    }
    if (!form.linkedin_url.trim()) {
      setError("LinkedIn profile wajib diisi.");
      return;
    }
    if (!validateLinkedIn(form.linkedin_url)) {
      setError("Format LinkedIn salah. Contoh: linkedin.com/in/nama-lo");
      return;
    }
    if (form.experience_summary.trim().length < 20) {
      setError("Ceritain pengalaman lo minimal 20 karakter.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        opening_id: openingId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        linkedin_url: normalizeUrl(form.linkedin_url),
        portfolio_url: form.portfolio_url.trim() ? normalizeUrl(form.portfolio_url) : null,
        education: form.education.trim() || null,
        experience_summary: form.experience_summary.trim(),
        cover_letter: form.cover_letter.trim() || null,
        status: "new",
      };

      const { error: insertError } = await supabase
        .from("job_applications")
        .insert(payload);

      if (insertError) {
        throw new Error("Submit lamaran gagal: " + insertError.message);
      }

      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
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
        <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
          <Linkedin className="h-3.5 w-3.5 text-[#0a66c2]" />
          LinkedIn Profile <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.linkedin_url}
          onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:border-[#1A9E9E] focus:ring-1 focus:ring-[#1A9E9E] outline-none"
          placeholder="linkedin.com/in/nama-lo"
        />
        <p className="text-[10px] text-gray-500 mt-1">
          Pastikan profile public — kalau di-private, tim HR gak bisa review.
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5 text-gray-500" />
          Portfolio / Karya (opsional)
        </label>
        <input
          type="text"
          value={form.portfolio_url}
          onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:border-[#1A9E9E] focus:ring-1 focus:ring-[#1A9E9E] outline-none"
          placeholder="instagram.com/handle, behance.net/nama, website pribadi"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5 text-gray-500" />
          Pendidikan Terakhir (opsional)
        </label>
        <input
          type="text"
          value={form.education}
          onChange={(e) => setForm({ ...form, education: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:border-[#1A9E9E] focus:ring-1 focus:ring-[#1A9E9E] outline-none"
          placeholder="Contoh: S1 Pendidikan Bahasa Inggris UPI 2022"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-gray-500" />
          Pengalaman Relevan <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          required
          value={form.experience_summary}
          onChange={(e) => setForm({ ...form, experience_summary: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:border-[#1A9E9E] focus:ring-1 focus:ring-[#1A9E9E] outline-none resize-none"
          placeholder="Ceritain singkat pengalaman lo terkait posisi ini — kerja sebelumnya, project, sertifikat, dll. Minimal 20 karakter."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Cover Letter / Pesan Singkat (opsional)
        </label>
        <textarea
          rows={3}
          value={form.cover_letter}
          onChange={(e) =>
            setForm({ ...form, cover_letter: e.target.value })
          }
          className="w-full px-3 py-2 text-sm border rounded-lg focus:border-[#1A9E9E] focus:ring-1 focus:ring-[#1A9E9E] outline-none resize-none"
          placeholder="Kenapa lo cocok untuk posisi ini?"
        />
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
