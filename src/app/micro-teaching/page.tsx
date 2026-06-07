"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const TEAL = "#1A9E9E";

type Applicant = {
  name: string | null;
  deadline: string | null;
  status: string | null;
  alreadySubmitted: boolean;
  videoUrl: string | null;
};

function isDriveUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return (
      (u.protocol === "https:" || u.protocol === "http:") &&
      /(^|\.)drive\.google\.com$/i.test(u.hostname)
    );
  } catch {
    return false;
  }
}

function fmtDeadline(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function MicroTeachingInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<Applicant | null>(null);

  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setFatal("Link tidak lengkap. Pastikan kamu membuka link dari email Linguo.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/micro-teaching/applicant?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setFatal(data?.error || "Link tidak valid atau sudah kedaluwarsa.");
        } else {
          setApplicant(data as Applicant);
          if (data?.videoUrl) setUrl(data.videoUrl);
        }
      } catch {
        if (!cancelled) setFatal("Gagal memuat data. Coba muat ulang halaman.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit() {
    setFormError(null);
    const v = url.trim();
    if (!isDriveUrl(v)) {
      setFormError("Link harus berupa URL Google Drive (drive.google.com).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/micro-teaching/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, videoUrl: v }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data?.error || "Gagal mengirim. Coba lagi.");
      } else {
        setDone(true);
      }
    } catch {
      setFormError("Gagal mengirim. Periksa koneksi internet kamu.");
    } finally {
      setSubmitting(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <span
            className="inline-block text-2xl font-extrabold tracking-tight"
            style={{ color: TEAL }}
          >
            Linguo
          </span>
          <p className="text-sm text-gray-500 mt-1">Pengumpulan Video Micro-teaching</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {children}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Linguo · Rekrutmen Pengajar
        </p>
      </div>
    </main>
  );

  if (loading) {
    return shell(
      <div className="py-10 text-center text-gray-400 text-sm">Memuat…</div>
    );
  }

  if (fatal) {
    return shell(
      <div className="text-center py-4">
        <div className="text-3xl mb-3">🔒</div>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Tidak bisa membuka form</h1>
        <p className="text-sm text-gray-500">{fatal}</p>
        <p className="text-sm text-gray-500 mt-3">
          Butuh bantuan? Balas email rekrutmen kami atau hubungi tim Linguo.
        </p>
      </div>
    );
  }

  if (done) {
    return shell(
      <div className="text-center py-4">
        <div className="text-4xl mb-3">✅</div>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Terima kasih!</h1>
        <p className="text-sm text-gray-600">
          Link video micro-teaching kamu sudah kami terima. Tim Linguo akan menilai dan
          mengabari hasilnya lewat email. Mohon ditunggu ya.
        </p>
      </div>
    );
  }

  // Sudah dinilai final → tampil read-only.
  if (applicant?.status === "passed" || applicant?.status === "failed") {
    return shell(
      <div className="text-center py-4">
        <div className="text-4xl mb-3">{applicant.status === "passed" ? "🎉" : "🙏"}</div>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">
          Micro-teaching kamu sudah dinilai
        </h1>
        <p className="text-sm text-gray-600">
          Status penilaian sudah final, jadi form ini tidak bisa diubah lagi. Tim Linguo
          akan mengabari langkah selanjutnya lewat email.
        </p>
      </div>
    );
  }

  const deadlinePassed =
    !!applicant?.deadline && new Date(applicant.deadline).getTime() < Date.now();
  const valid = isDriveUrl(url);

  return shell(
    <>
      <h1 className="text-xl font-bold text-gray-800">
        Halo{applicant?.name ? `, ${applicant.name}` : ""} 👋
      </h1>
      <p className="text-sm text-gray-600 mt-2">
        Kirim link video micro-teaching kamu di bawah ini. Pastikan video sudah diunggah ke
        Google Drive dan aksesnya{" "}
        <span className="font-medium">“Anyone with the link → Viewer”</span> supaya tim kami
        bisa menontonnya.
      </p>

      <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Tenggat pengumpulan</span>
          <span className="font-medium text-gray-800">{fmtDeadline(applicant?.deadline)}</span>
        </div>
      </div>

      {deadlinePassed && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
          ⚠️ Tenggat sudah lewat, tapi kamu masih bisa mengirim. Tim Linguo akan
          mempertimbangkannya.
        </div>
      )}

      {applicant?.alreadySubmitted && (
        <div className="mt-3 rounded-lg bg-teal-50 border border-teal-200 p-3 text-sm text-teal-700">
          Kamu sudah pernah mengirim link. Kamu masih bisa menggantinya selama belum dinilai.
        </div>
      )}

      <label className="block text-sm font-medium text-gray-700 mt-5 mb-1.5">
        Link video Google Drive
      </label>
      <input
        type="url"
        inputMode="url"
        placeholder="https://drive.google.com/file/d/…/view"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          if (formError) setFormError(null);
        }}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
      {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}

      <button
        type="button"
        disabled={submitting || !valid}
        onClick={handleSubmit}
        className="w-full mt-5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
        style={{ backgroundColor: TEAL }}
      >
        {submitting ? "Mengirim…" : "Kirim Video Micro-teaching"}
      </button>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Cek dulu link-nya bisa dibuka di mode penyamaran (incognito) sebelum kirim.
      </p>
    </>
  );
}

export default function MicroTeachingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-sm text-gray-400">Memuat…</div>
        </main>
      }
    >
      <MicroTeachingInner />
    </Suspense>
  );
}
