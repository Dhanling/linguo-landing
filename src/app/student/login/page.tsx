"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";

export default function StudentLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/student/dashboard",
        },
      });
      if (error) setError(error.message);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdfa] via-white to-[#f0f9ff] flex items-center justify-center px-4" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1A9E9E]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#fbbf24]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/images/logo-color.png" alt="Linguo.id" className="h-10 sm:h-12 mx-auto mb-4 object-contain" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Selamat Datang!</h1>
          <p className="text-sm text-slate-500">Login ke Student Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-[#1A9E9E]/30 hover:bg-slate-50 rounded-2xl px-6 py-4 text-sm font-semibold text-slate-700 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? "Memproses..." : "Login dengan Google"}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">atau</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email login (placeholder for future) */}
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email kamu"
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 transition-all"
            />
            <button
              disabled
              className="w-full bg-[#1A9E9E]/30 text-white font-semibold py-3.5 rounded-2xl text-sm cursor-not-allowed"
            >
              Login dengan Email (coming soon)
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-6">
            Belum punya akun?{" "}
            <button
              onClick={() => (window as any).__openFunnel?.("") || window.location.assign("/")}
              className="text-[#1A9E9E] font-semibold hover:underline"
            >
              Daftar Sekarang
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/" className="hover:text-slate-600 transition-colors">← Kembali ke Beranda</Link>
        </p>
      </div>
    </div>
  );
}
