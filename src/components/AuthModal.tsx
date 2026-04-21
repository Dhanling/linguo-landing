"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (userId: string) => void;
  intent?: string;
}

type Mode = "choose" | "email-login" | "email-signup";

export default function AuthModal({ open, onClose, onSuccess, intent }: Props) {
  const [mode, setMode] = useState<Mode>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const reset = () => {
    setMode("choose");
    setEmail(""); setPassword(""); setName("");
    setError(""); setLoading(false); setShowPass(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      document.cookie = "linguo_auth_intent=placement;path=/;max-age=300";
      const { error: e } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth/callback" },
      });
      if (e) throw e;
    } catch (e: any) {
      setError(e?.message || "Gagal login dengan Google. Coba lagi.");
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) { setError("Isi email dan password dulu ya."); return; }
    setLoading(true); setError("");
    try {
      const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) throw e;
      if (data.user) onSuccess(data.user.id);
    } catch (e: any) {
      setError(e?.message === "Invalid login credentials" ? "Email atau password salah." : e?.message || "Gagal login.");
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!name.trim()) { setError("Masukkan nama kamu dulu ya."); return; }
    if (!email) { setError("Masukkan email kamu."); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter."); return; }
    setLoading(true); setError("");
    try {
      const { data, error: e } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name.trim() } },
      });
      if (e) throw e;
      if (data.user && data.session) {
        onSuccess(data.user.id);
      } else {
        setError("✅ Cek email kamu untuk konfirmasi, lalu login.");
        setLoading(false);
        setMode("email-login");
      }
    } catch (e: any) {
      const msg = e?.message || "";
      setError(msg.includes("already registered") ? "Email ini sudah terdaftar. Coba login." : msg || "Gagal daftar.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#1A9E9E] via-[#2ABFBF] to-[#1A9E9E]" />
            <div className="px-7 py-7">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {mode === "email-signup" ? "Buat akun gratis" : "Masuk ke Linguo"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 leading-snug">
                    {intent || "Simpan hasil test & lanjut daftar kelas"}
                  </p>
                </div>
                <button onClick={handleClose}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === "choose" && (
                  <motion.div key="choose"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="mt-6 space-y-3">
                    <button onClick={handleGoogle} disabled={loading}
                      className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-2xl font-semibold text-gray-800 text-sm transition-all disabled:opacity-50 active:scale-[0.98]">
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {loading ? "Mengarahkan..." : "Lanjut dengan Google"}
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400 font-medium">atau</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { setError(""); setMode("email-login"); }}
                        className="px-4 py-3 border-2 border-gray-200 hover:border-[#1A9E9E] hover:bg-[#1A9E9E]/5 rounded-2xl text-sm font-semibold text-gray-700 transition-all active:scale-[0.98]">
                        Masuk
                      </button>
                      <button onClick={() => { setError(""); setMode("email-signup"); }}
                        className="px-4 py-3 bg-[#1A9E9E] hover:bg-[#147a7a] rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]">
                        Daftar
                      </button>
                    </div>
                    {error && <p className="text-xs text-rose-600 text-center pt-1">{error}</p>}
                    <p className="text-[10px] text-gray-400 text-center pt-1 leading-relaxed">
                      Dengan masuk, kamu setuju dengan{" "}
                      <a href="/ketentuan" className="underline hover:text-gray-600">Ketentuan Layanan</a>{" "}
                      Linguo.id
                    </p>
                  </motion.div>
                )}

                {(mode === "email-login" || mode === "email-signup") && (
                  <motion.div key={mode}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="mt-5 space-y-3">
                    <button onClick={() => { setError(""); setMode("choose"); }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Kembali
                    </button>
                    {mode === "email-signup" && (
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Nama lengkap"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm" />
                    )}
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm" />
                    <div className="relative">
                      <input type={showPass ? "text" : "password"}
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        onKeyDown={e => e.key === "Enter" && (mode === "email-login" ? handleEmailLogin() : handleEmailSignup())}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm pr-11" />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass
                          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        }
                      </button>
                    </div>
                    {error && (
                      <p className={"text-xs text-center " + (error.startsWith("✅") ? "text-emerald-600" : "text-rose-600")}>
                        {error}
                      </p>
                    )}
                    <button onClick={mode === "email-login" ? handleEmailLogin : handleEmailSignup}
                      disabled={loading}
                      className="w-full py-3.5 bg-[#1A9E9E] hover:bg-[#147a7a] disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98]">
                      {loading ? "Memproses..." : mode === "email-login" ? "Masuk" : "Buat Akun & Lanjut"}
                    </button>
                    <p className="text-xs text-center text-gray-500">
                      {mode === "email-login" ? "Belum punya akun? " : "Sudah punya akun? "}
                      <button onClick={() => { setError(""); setMode(mode === "email-login" ? "email-signup" : "email-login"); }}
                        className="text-[#1A9E9E] font-semibold hover:underline">
                        {mode === "email-login" ? "Daftar gratis" : "Masuk"}
                      </button>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
