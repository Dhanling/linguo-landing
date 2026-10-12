"use client";

// [simulasi-aktivasi-wa-v1] Aktivasi Prediction Test yang dibayar lewat invoice
// WA Inbox tanpa email. Link-nya dikirim bot WA begitu pembayaran masuk; siswa
// cukup mengisi email yang dipakai login, aksesnya langsung terbit
// (lihat /api/simulasi/aktivasi).
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";

type Info = {
  test_type: string;
  paket: string | null;
  name: string | null;
  paid: boolean;
  activated: boolean;
  email_masked: string | null;
};

function Aktivasi() {
  const token = (useSearchParams().get("t") || "").trim();
  const [info, setInfo] = useState<Info | null>(null);
  const [fatal, setFatal] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Email yang baru saja diaktifkan di sesi ini — ditampilkan utuh (milik sendiri).
  const [doneEmail, setDoneEmail] = useState("");

  useEffect(() => {
    (async () => {
      if (!token) { setFatal("Link aktivasi tidak lengkap. Buka lagi link dari WhatsApp Linguo ya."); return; }
      try {
        const res = await fetch(`/api/simulasi/aktivasi?t=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) { setFatal(data?.error || "Link aktivasi tidak ditemukan."); return; }
        setInfo(data);
      } catch {
        setFatal("Gagal memuat. Periksa koneksi lalu muat ulang halaman ini.");
      }
      // Sudah login → emailnya dipakai sebagai isian awal (kurangi salah ketik).
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setEmail((prev) => prev || user.email!);
      } catch { /* belum login — isi manual */ }
    })();
  }, [token]);

  const submit = async () => {
    setError("");
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setError("Format email belum benar."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/simulasi/aktivasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: value }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || "Gagal mengaktifkan akses."); return; }
      setInfo(data);
      setDoneEmail(value);
    } catch {
      setError("Gagal terhubung. Coba lagi ya.");
    } finally {
      setLoading(false);
    }
  };

  const label = info ? `Prediction Test ${info.test_type.toUpperCase()}` : "Prediction Test";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="px-6 py-5 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
          <p className="text-xs text-white/70">Linguo.id</p>
          <h1 className="text-lg font-bold">Aktivasi {label}</h1>
          {info?.paket && <p className="mt-1 text-sm text-white/80">{info.paket}</p>}
        </div>

        <div className="space-y-4 p-6">
          {fatal ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">{fatal}</p>
          ) : !info ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat…
            </div>
          ) : info.activated ? (
            <>
              <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Akses {label} sudah aktif untuk <b>{doneEmail || info.email_masked}</b>.
                </p>
              </div>
              <p className="text-sm text-slate-500">
                Login di dashboard Linguo dengan email itu, lalu buka menu Simulasi Tes untuk mulai mengerjakan.
              </p>
              <Link href="/akun"
                className="flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg"
                style={{ background: TEAL }}>
                Buka Dashboard
              </Link>
            </>
          ) : !info.paid ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Pembayarannya belum kami terima. Kalau sudah bayar, tunggu beberapa menit lalu muat ulang halaman ini ya.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                {info.name ? `Halo ${info.name.split(/\s+/)[0]}, pembayarannya` : "Pembayarannya"} sudah kami terima. Isi email
                yang kamu pakai untuk login di Linguo — akses tesnya dibuka ke akun itu.
              </p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                  Email <span className="font-normal text-slate-400">(dipakai untuk login)</span>
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && submit()}
                  placeholder="email@contoh.com" disabled={loading} autoFocus
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50" />
                <p className="mt-1.5 text-xs text-slate-400">
                  Pastikan emailnya benar ya — sesudah diaktifkan, emailnya hanya bisa diganti lewat admin.
                </p>
              </div>
              {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>}
              <button onClick={submit} disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-60"
                style={{ background: TEAL }}>
                {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Mengaktifkan…</>) : "Aktifkan Akses"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SimulasiAktivasiPage() {
  return (
    <Suspense fallback={null}>
      <Aktivasi />
    </Suspense>
  );
}
