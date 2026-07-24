"use client";

// [kelas-video-rekaman-siswa-v1] Pemutar rekaman kelas untuk siswa.
//
// Sebelum ini, tombol "Tonton Recording" di tab Progress/Materi mengarah ke deep
// link Riwayat Kelas di dashboard — halaman KHUSUS TIM, jadi siswa selalu mentok
// di layar login dan tidak pernah bisa menonton rekamannya sendiri.
//
// Rekamannya ada di bucket privat (berisi wajah siswa), jadi URL-nya tidak bisa
// dipegang klien: /api/class-recording yang memverifikasi kepemilikan jadwal lalu
// mengembalikan signed URL berumur 1 jam.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, RefreshCw, Video, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import StudentShell, { type AkunTab } from "@/components/akun/StudentShell";

interface RecordingItem {
  key: string;
  url: string;
  recordedAt: string;
  sizeBytes: number;
}

const fmtSize = (b: number) => (b > 0 ? `${(b / 1024 / 1024).toFixed(0)} MB` : "");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function RekamanKelasPage() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const [recordings, setRecordings] = useState<RecordingItem[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setError("");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace("/akun");
        return;
      }
      try {
        const res = await fetch("/api/class-recording", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: params.roomId, accessToken: session.access_token }),
        });
        const body = await res.json();
        if (!alive) return;
        if (!res.ok) {
          setError(body?.error || "Gagal memuat rekaman");
          setRecordings([]);
          return;
        }
        setRecordings(body.recordings || []);
      } catch {
        if (!alive) return;
        setError("Koneksi bermasalah saat memuat rekaman");
        setRecordings([]);
      }
    })();
    return () => { alive = false; };
  }, [params.roomId, router, attempt]);

  const goTab = (t: AkunTab) => router.push(`/akun?menu=${t}`);

  return (
    <StudentShell active="beranda" onTabChange={goTab}>
      <div className="mx-auto w-full max-w-3xl px-1 py-1">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-500 hover:text-[#16796E]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Kembali
        </button>

        <h1 className="text-[19px] font-extrabold text-[#12172B]">Rekaman Kelas</h1>
        <p className="mt-1 text-[13px] font-medium text-gray-500">
          Rekaman hanya bisa diputar oleh kamu — tautannya berlaku 1 jam, muat ulang halaman kalau kedaluwarsa.
        </p>

        {recordings === null ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
          </div>
        ) : recordings.length ? (
          <div className="mt-5 flex flex-col gap-5">
            {recordings.map((r) => (
              <div key={r.key} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                <video
                  src={r.url}
                  controls
                  playsInline
                  className="aspect-video w-full bg-black"
                  preload="metadata"
                />
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[13px] font-bold text-[#12172B]">{fmtDate(r.recordedAt)}</span>
                  <span className="text-[12px] font-medium text-gray-400">{fmtSize(r.sizeBytes)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-12 text-center">
            <Video className="mx-auto mb-2 h-8 w-8 text-slate-300" strokeWidth={1.6} />
            <p className="text-[13.5px] font-semibold text-gray-600">
              {error || "Rekaman sesi ini belum tersedia"}
            </p>
            <p className="mt-1 text-[12.5px] font-medium text-gray-400">
              {error
                ? "Coba muat ulang, atau hubungi tim Linguo kalau masih bermasalah."
                : "Rekaman biasanya muncul beberapa menit setelah kelas selesai."}
            </p>
            <button
              onClick={() => { setRecordings(null); setAttempt((n) => n + 1); }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#16796E] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0F5A52]"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2.5} /> Muat Ulang
            </button>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
