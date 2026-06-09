"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

// Password strength: 0=weak, 1=medium, 2=strong
function scorePassword(pw: string): number {
  if (pw.length < 8) return 0;
  let variety = 0;
  if (/[a-z]/.test(pw)) variety++;
  if (/[A-Z]/.test(pw)) variety++;
  if (/[0-9]/.test(pw)) variety++;
  if (/[^a-zA-Z0-9]/.test(pw)) variety++;
  if (pw.length >= 12 && variety >= 3) return 2;
  if (variety >= 2) return 1;
  return 0;
}

const STRENGTH = [
  { label: "Lemah", color: "#ef4444", bars: 1 },
  { label: "Sedang", color: "#f59e0b", bars: 2 },
  { label: "Kuat", color: "#1A9E9E", bars: 3 },
];

export default function UpdatePasswordPage() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // A valid recovery/OTP session is required to update the password.
  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { setHasSession(true); setChecking(false); return; }
      // Implicit flow may still be settling the hash — wait briefly + listen.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
        if (sess?.user) { setHasSession(true); setChecking(false); subscription.unsubscribe(); }
      });
      setTimeout(() => { subscription.unsubscribe(); setChecking(false); }, 2500);
    };
    run();
  }, []);

  const handleSubmit = async () => {
    if (password.length < 8) { setError("Password minimal 8 karakter."); return; }
    if (password !== confirm) { setError("Konfirmasi password tidak cocok."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("session") || m.includes("missing"))
        setError("Sesi reset sudah kedaluwarsa. Silakan minta kode reset lagi.");
      else if (m.includes("should be different") || m.includes("same"))
        setError("Password baru harus berbeda dari yang lama.");
      else setError("Terjadi kesalahan, silakan coba lagi.");
      return;
    }
    setDone(true);
    setTimeout(() => { window.location.href = "/"; }, 2000);
  };

  const strength = password ? STRENGTH[scorePassword(password)] : null;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="w-full max-w-sm">

        {checking ? (
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-[#1A9E9E] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Memuat...</p>
          </div>

        ) : done ? (
          <div className="text-center">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Password berhasil diperbarui!</h1>
            <p className="text-slate-500 text-sm">Mengarahkan ke beranda...</p>
          </div>

        ) : !hasSession ? (
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-xl font-extrabold text-slate-900 mb-2">Sesi tidak ditemukan</h1>
            <p className="text-slate-500 text-sm mb-6">Sesi reset password sudah kedaluwarsa atau tidak valid. Silakan minta kode reset baru dari halaman login.</p>
            <a href="/" className="inline-block bg-[#1A9E9E] hover:bg-[#178585] text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all">
              Kembali ke Beranda
            </a>
          </div>

        ) : (
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Buat Password Baru</h1>
            <p className="text-slate-500 text-sm mb-6">Masukkan password baru untuk akun Linguo kamu.</p>

            {error && <p className="text-red-500 text-xs mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="relative mb-3">
              <input value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password baru" type={showPass ? "text" : "password"}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/10 placeholder:text-slate-400 transition-all" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPass ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>

            {/* Strength indicator */}
            {strength && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                      style={{ backgroundColor: i < strength.bars ? strength.color : "#e2e8f0" }} />
                  ))}
                </div>
                <span className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}

            <input value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Konfirmasi password" type={showPass ? "text" : "password"}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/10 placeholder:text-slate-400 transition-all mb-2" />
            {confirm && confirm !== password && (
              <p className="text-red-500 text-xs mb-2">Password tidak cocok.</p>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-[#1A9E9E] hover:bg-[#178585] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-3">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Simpan Password Baru
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
