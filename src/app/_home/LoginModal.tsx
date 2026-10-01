"use client";
// [home-rsc-v1] Modal login beranda — dipisah dari bundel awal karena membawa
// supabase-js (auth). Dimuat lazy oleh HomeLoginModal di _home/islands.tsx.
import { supabase } from "@/lib/supabase-client";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, ChevronLeft, ChevronRight, Mail, Star, Check, ArrowRight, ArrowUp, Menu, X, Zap, AtSign, Search, Sparkles, GraduationCap, Users, School, Baby, ClipboardList, MonitorPlay, BookOpen, Timer, Building2, Headphones, ScrollText, Languages } from "lucide-react";
import PlacementPicker from "@/components/PlacementPicker";
// [home-flags-subset-v1] Bendera beranda dari subset kecil (bukan set lengkap
// blade-flags 1,2 MB); kode di luar subset jatuh ke RectFlag lazy.
import { HOME_FLAGS } from "@/lib/flags/homeFlags";
import { RectFlag as RectFlagLazy } from "@/components/RectFlag";
// linguo-patch:private-pricing-v1 — harga Private mengikuti kategori bahasa
import { BRAND_FACTS } from "@/lib/brand-facts";
import { jsonLd, faqSchema } from "@/lib/schema"; // [aeo-schema-v1] // [aeo-brand-facts-v1] jumlah bahasa & harga "mulai dari" tidak lagi ditulis manual
import { getLanguageCategory, PRICE_A1_60MIN, getPrivateBase60, getSemiPrivatePrice, KIDS_PRICE, KIDS_LEVEL_KEY, computeKidsPerSession, getKidsBasePerSession, NATIVE_MULTIPLIER, isNativeAvailable, applyNativeMultiplier, applyOfflineSurcharge, supportsOffline, OFFLINE_SURCHARGE_PER_SESSION } from "@/lib/trial-pricing"; // linguo-patch:funnel-semi-private-calc-v1 · funnel-session-duration-v1 · funnel-private-level-price-v1 · native-pricing-v1 · kids-lang-pricing-v1 · offline-private-class-v1

import TokoCTA from "@/components/TokoCTA";
import TautanLegal from "@/components/TautanLegal"; // [xendit-legal-links-v1]
import Reveal from "@/components/Reveal"; // linguo-patch:scroll-reveal-v1
import HeroModel3D from "@/components/HeroModel3D"; // [hero-3d-v1]
import { useOverlayLock } from "@/lib/overlayStore";
import { TESTIMONIALS } from "@/data/testimonials";
import { regulerLangName } from "@/lib/classLanguage"; // [reguler-english-conversation-v1]
// wa-quick-program-lang-sync-v1 — aturan bahasa × program (sumber tunggal)
import { REGULER_LANGS, isProgramLangAllowed, langsForProgram, programsForLang } from "@/lib/programLanguages";
// [daftar-page-funnel-v1] funnel pendaftaran sekarang HALAMAN (/daftar/...), bukan modal.
import { programSlugOf, langSlugOf, langFromSlug, kursusSlugOf } from "@/lib/funnelRouting";
import { EMAIL_REGEX } from "./data";

// ========== LOGIN MODAL ==========
type AuthView = "login" | "signup" | "forgot" | "reset_otp" | "forgot_sent" | "verify_phone";


// Map Supabase reset-password / OTP-send error messages to Bahasa Indonesia
function mapResetError(msg: string): string {
  const m = (msg || "").toLowerCase();
  if (m.includes("unable to validate email address") || m.includes("invalid format"))
    return "Format email tidak valid, pastikan ada '@' dan domain yang benar";
  if (m.includes("user not found") || m.includes("signups not allowed"))
    return "Email ini belum terdaftar di Linguo";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Terlalu banyak percobaan, coba lagi beberapa menit lagi";
  return "Terjadi kesalahan, silakan coba lagi";
}

// Map Supabase verifyOtp error messages to Bahasa Indonesia
function mapOtpError(msg: string): string {
  const m = (msg || "").toLowerCase();
  if (m.includes("expired")) return "Kode sudah kedaluwarsa, silakan kirim ulang";
  if (m.includes("user not found")) return "Email ini belum terdaftar di Linguo";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Terlalu banyak percobaan, coba lagi beberapa menit lagi";
  return "Kode tidak valid atau sudah expired, coba kirim ulang";
}

export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [view, setView] = useState<AuthView>("login");
  const [tab, setTab] = useState<"email" | "phone">("email");

  // Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Email reset OTP (6-digit) state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const reset = () => {
    setError(""); setSuccess(""); setName(""); setEmail("");
    setPhone(""); setPassword(""); setOtp(""); setShowPass(false);
    setOtpDigits(["", "", "", "", "", ""]); setOtpSecondsLeft(0);
  };

  const goTo = (v: AuthView) => { reset(); setView(v); };

  // Countdown timer for the email reset OTP (1 minute)
  useEffect(() => {
    if (view !== "reset_otp") return;
    const t = setInterval(() => setOtpSecondsLeft(s => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [view]);

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Google OAuth ──
  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/akun" },
      });
    } catch { setError("Gagal login dengan Google."); setLoading(false); }
  };

  // ── Email Login ──
  const handleEmailLogin = async () => {
    if (!email || !password) { setError("Email dan password wajib diisi."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message === "Invalid login credentials" ? "Email atau password salah." : error.message); }
    else { onClose(); window.location.href = "/akun"; }
  };

  // ── Email Sign Up ──
  const handleSignUp = async () => {
    if (!name || !email || !password) { setError("Semua field wajib diisi."); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/akun" },
    });
    setLoading(false);
    if (error) { setError(error.message); }
    else { setSuccess("Cek email kamu untuk konfirmasi akun ya!"); }
  };

  // ── Forgot Password — send 6-digit OTP code to email ──
  const handleForgot = async () => {
    if (!email) { setError("Masukkan email kamu dulu."); return; }
    if (!email.includes("@") || !EMAIL_REGEX.test(email)) {
      setError("Format email tidak valid, pastikan ada '@' dan domain yang benar");
      return;
    }
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) { setError(mapResetError(error.message)); return; }
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpSecondsLeft(60);
    setError(""); setSuccess("");
    setView("reset_otp");
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  // ── Resend reset OTP (only after timer expires) ──
  const handleResendResetOtp = async () => {
    if (otpSecondsLeft > 0 || loading) return;
    setLoading(true); setError(""); setSuccess("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) { setError(mapResetError(error.message)); return; }
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpSecondsLeft(60);
    setSuccess("Kode baru sudah dikirim ke email kamu.");
    otpRefs.current[0]?.focus();
  };

  // ── Verify reset OTP → go to update-password page ──
  const handleVerifyResetOtp = async (codeArg?: string) => {
    const code = codeArg ?? otpDigits.join("");
    if (code.length !== 6) { setError("Masukkan 6 digit kode."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    setLoading(false);
    if (error) { setError(mapOtpError(error.message)); return; }
    onClose();
    window.location.href = "/auth/update-password";
  };

  // ── OTP box input handlers ──
  const handleOtpBoxChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[i] = digit;
    setOtpDigits(next);
    if (error) setError("");
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    if (digit && i === 5) {
      const code = next.join("");
      if (code.length === 6) handleVerifyResetOtp(code);
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let j = 0; j < pasted.length; j++) next[j] = pasted[j];
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) handleVerifyResetOtp(pasted);
  };

  // ── Phone OTP Send ──
  const handlePhoneSend = async () => {
    if (!phone) { setError("Nomor HP wajib diisi."); return; }
    setLoading(true); setError("");
    const fullPhone = countryCode + phone.replace(/^0/, "");
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    setLoading(false);
    if (error) { setError("Gagal kirim OTP: " + error.message); }
    else { setSuccess("Kode OTP dikirim ke " + fullPhone); goTo("verify_phone"); }
  };

  // ── Phone OTP Verify ──
  const handleOtpVerify = async () => {
    if (!otp) { setError("Masukkan kode OTP."); return; }
    setLoading(true); setError("");
    const fullPhone = countryCode + phone.replace(/^0/, "");
    const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
    setLoading(false);
    if (error) { setError("Kode OTP salah atau expired."); }
    else { onClose(); window.location.href = "/akun"; }
  };

  if (!open) return null;

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/10 placeholder:text-slate-400 transition-all";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          onClick={onClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">

            {/* Close */}
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">

              {/* ── RESET OTP (6-digit code) ── */}
              {view === "reset_otp" ? (
                <div>
                  <button onClick={() => goTo("forgot")} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Kembali
                  </button>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-1">Masukkan kode reset</h2>
                  <p className="text-slate-500 text-sm mb-6">Kami kirim kode 6 digit ke <strong>{email}</strong>. Cek inbox & folder spam ya.</p>

                  {error && <p className="text-red-500 text-xs mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                  {success && <p className="text-emerald-600 text-xs mb-3 bg-emerald-50 px-3 py-2 rounded-lg">{success}</p>}

                  <div className="flex justify-between gap-2 mb-4">
                    {otpDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        value={d}
                        onChange={e => handleOtpBoxChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        className="w-11 h-14 text-center text-2xl font-bold border border-slate-200 rounded-xl outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/10 transition-all"
                      />
                    ))}
                  </div>

                  <button onClick={() => handleVerifyResetOtp()} disabled={loading}
                    className="w-full bg-[#1A9E9E] hover:bg-[#178585] text-white font-bold py-3.5 rounded-2xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 mb-4">
                    {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Verifikasi Kode
                  </button>

                  <div className="text-center text-sm text-slate-500">
                    {otpSecondsLeft > 0 ? (
                      <span>Kode berlaku selama <strong>{fmtTime(otpSecondsLeft)}</strong></span>
                    ) : (
                      <button onClick={handleResendResetOtp} disabled={loading}
                        className="text-[#1A9E9E] font-semibold hover:underline disabled:opacity-60">
                        Kirim ulang kode
                      </button>
                    )}
                  </div>
                </div>

              ) : view === "forgot_sent" ? (
                /* ── FORGOT SENT (legacy magic-link view) ── */
                <div className="text-center py-4">
                  <h2 className="text-xl font-extrabold text-slate-900 mb-2">Cek email kamu!</h2>
                  <p className="text-slate-500 text-sm mb-6">Link reset sudah dikirim! Cek inbox email kamu, termasuk folder spam.</p>
                  <button onClick={() => goTo("login")} className="text-sm text-[#1A9E9E] font-semibold hover:underline">← Kembali ke Login</button>
                </div>

              ) : view === "verify_phone" ? (
              /* ── VERIFY PHONE OTP ── */
                <div>
                  <button onClick={() => goTo("login")} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-4 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Kembali
                  </button>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-1">Masukkan kode OTP</h2>
                  <p className="text-slate-500 text-sm mb-6">Kode 6 digit sudah dikirim ke <strong>{countryCode + phone}</strong></p>
                  {error && <p className="text-red-500 text-xs mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                  <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="_ _ _ _ _ _"
                    className={inputCls + " text-center text-2xl tracking-[0.5em] font-bold mb-4"} maxLength={6} />
                  <button onClick={handleOtpVerify} disabled={loading}
                    className="w-full bg-[#1A9E9E] hover:bg-[#178585] text-white font-bold py-3.5 rounded-2xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Verifikasi
                  </button>
                </div>

              ) : (
              /* ── MAIN VIEWS: login / signup / forgot ── */
                <>
                  {/* Header */}
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">
                    {view === "signup" ? "Daftar Akun Baru" : view === "forgot" ? "Reset Password" : "Selamat datang!"}
                  </h2>
                  <p className="text-slate-500 text-sm mb-6">
                    {view === "signup" ? "Buat akun untuk mulai belajar bahasa impianmu." :
                     view === "forgot" ? "Masukkan emailmu, kami kirim kode reset 6 digit." :
                     "Masuk untuk lanjut belajar bersama Linguo."}
                  </p>

                  {/* Error / Success */}
                  {error && <p className="text-red-500 text-xs mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                  {success && <p className="text-emerald-600 text-xs mb-4 bg-emerald-50 px-3 py-2 rounded-lg">{success}</p>}

                  {/* Google (not on forgot) */}
                  {view !== "forgot" && (
                    <>
                      <button onClick={handleGoogle} disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-2xl text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 mb-4">
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Lanjutkan dengan Google
                      </button>

                      {/* OR divider */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-xs text-slate-400">atau</span>
                        <div className="flex-1 h-px bg-slate-100" />
                      </div>

                      {/* Email / Phone tabs */}
                      <div className="flex border-b border-slate-100 mb-4">
                        {(["email", "phone"] as const).map(t => (
                          <button key={t} onClick={() => { setTab(t); reset(); }}
                            className={`flex-1 pb-2.5 text-sm font-semibold transition-all ${tab === t ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-400 hover:text-slate-600"}`}>
                            {t === "email" ? "Email" : "No. HP"}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Name (signup only) */}
                  {view === "signup" && (
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap"
                      className={inputCls + " mb-3"} />
                  )}

                  {/* Email tab fields */}
                  {(tab === "email" || view === "forgot") && (
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
                      className={inputCls + " mb-3"} />
                  )}

                  {/* Phone tab fields */}
                  {tab === "phone" && view !== "forgot" && (
                    <div className="flex gap-2 mb-3">
                      <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#1A9E9E] bg-white shrink-0">
                        {["+62","+1","+44","+81","+82","+86","+60","+65","+63","+84","+66"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" type="tel"
                        className={inputCls} />
                    </div>
                  )}

                  {/* Password (not on forgot, not phone) */}
                  {view !== "forgot" && tab === "email" && (
                    <div className="relative mb-1">
                      <input value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Password" type={showPass ? "text" : "password"}
                        className={inputCls + " pr-12"}
                        onKeyDown={e => e.key === "Enter" && (view === "login" ? handleEmailLogin() : handleSignUp())} />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPass ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Forgot password link (login only) */}
                  {view === "login" && tab === "email" && (
                    <div className="flex justify-end mb-4">
                      <button onClick={() => goTo("forgot")} className="text-xs text-slate-400 hover:text-[#1A9E9E] transition-colors font-medium">
                        Lupa password?
                      </button>
                    </div>
                  )}

                  {!success && <div className="mt-4" />}

                  {/* Main CTA button */}
                  {!success && (
                    <button
                      onClick={view === "forgot" ? handleForgot : view === "signup" ? handleSignUp : tab === "phone" ? handlePhoneSend : handleEmailLogin}
                      disabled={loading}
                      className="w-full bg-[#1A9E9E] hover:bg-[#178585] text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mb-5">
                      {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {view === "forgot" ? "Kirim Kode" : view === "signup" ? "Daftar Sekarang" : tab === "phone" ? "Kirim Kode OTP" : "Masuk"}
                    </button>
                  )}

                  {/* Footer links */}
                  <div className="text-center text-sm text-slate-500">
                    {view === "login" ? (
                      <>Belum punya akun?{" "}
                        <button onClick={() => goTo("signup")} className="text-[#1A9E9E] font-semibold hover:underline">Daftar</button>
                      </>
                    ) : view === "signup" ? (
                      <>Sudah punya akun?{" "}
                        <button onClick={() => goTo("login")} className="text-[#1A9E9E] font-semibold hover:underline">Masuk</button>
                      </>
                    ) : (
                      <button onClick={() => goTo("login")} className="text-[#1A9E9E] font-semibold hover:underline">← Kembali ke Login</button>
                    )}
                  </div>

                  {/* Terms (login/signup only) */}
                  {view !== "forgot" && (
                    <p className="text-center text-[11px] text-slate-400 leading-relaxed mt-4">
                      Dengan masuk, kamu menyetujui{" "}
                      <a href="/privacy" className="underline hover:text-slate-600">Syarat & Ketentuan</a>{" "}
                      Linguo.id
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
