"use client";
import { supabase } from "@/lib/supabase-client";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, ChevronLeft, ChevronRight, Mail, Star, Check, ArrowRight, ArrowUp, Menu, X, Zap, AtSign, Search, Sparkles } from "lucide-react";
import PlacementPicker from "@/components/PlacementPicker";
import { resolveFlag } from "@blade-flags/core";
import { defaultFlags } from "@blade-flags/core/flags/default";
// linguo-patch:private-pricing-v1 — harga Private mengikuti kategori bahasa
import { getLanguageCategory, PRICE_A1_60MIN, getSemiPrivatePrice, KIDS_PRICE, KIDS_DURATION } from "@/lib/trial-pricing"; // linguo-patch:funnel-semi-private-calc-v1 · funnel-session-duration-v1

import TokoCTA from "@/components/TokoCTA";
import Reveal from "@/components/Reveal"; // linguo-patch:scroll-reveal-v1
import { useOverlayLock } from "@/lib/overlayStore";
const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

async function saveLead(data: {wa_number:string; language?:string; name?:string; email?:string; program?:string; level?:string; teacher_type?:string|null; referral_source?:string; source?:string; ref_code?:string}) {

  try {
    // Get referral from URL or localStorage
    const ref = new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("linguo_ref") || undefined;
    if (ref) localStorage.setItem("linguo_ref", ref);
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ ...data, source: data.source || "landing-page", referral_source: data.referral_source || ref || null }),
    });
  } catch (e) { console.error("Lead save failed:", e); }
}

const LANG_CATEGORIES = [
  { label: "Populer", langs: ["English","Japanese","Korean","Mandarin","Arabic","French","German","Spanish"] },
  { label: "Asia", langs: ["Japanese","Korean","Mandarin","Arabic","Thai","Vietnamese","Hindi","Turkish","Hebrew","Persian","Tagalog","Malay","Georgian","Urdu","Bengali"] },
  { label: "Eropa", langs: ["English","French","German","Spanish","Italian","Dutch","Portuguese","Russian","Polish","Swedish","Norwegian","Danish","Finnish","Greek","Czech","Hungarian","Romanian"] },
  { label: "Nusantara", langs: ["Javanese","Sundanese","Betawi","BIPA"] },
  { label: "Afrika", langs: ["Swahili"] },
];

// linguo-patch:reguler-lang-gate — bahasa yg punya jadwal Kelas Reguler (regular_batches). Kalau nambah bahasa reguler baru, update list ini + /jadwal-kelas-reguler.
const REGULER_LANGS = ["English","Mandarin","Japanese","Korean","Arabic","French","German","Italian","Dutch","Spanish","Tagalog"];

const FAQS = [
  {q:"Apa itu Linguo.id?",a:"Linguo.id adalah platform kursus bahasa online pertama di Indonesia dengan 55+ pilihan bahasa dan metode interaktif.",video:"3hDBE8o-jJU"},
  {q:"Boleh ikut lebih dari 1 bahasa?",a:"Boleh banget! Kamu bisa daftar beberapa bahasa sekaligus."},
  {q:"Bagaimana format kelasnya?",a:"Kelas Private 1-on-1 via Zoom. Request jadwal & topik sesukamu. Dapat rekaman & materi."},
  {q:"Dapat sertifikat?",a:"Ya! Setiap siswa yang menyelesaikan kursus mendapat e-certificate."},
  {q:"Cara bayarnya?",a:"Transfer bank, QRIS, GoPay, OVO, dan lainnya. Konfirmasi otomatis."},
  {q:"Ada kelas lanjutan?",a:"Ada! Tersedia dari Basic hingga Advance."},
];

// ========== LOGIN MODAL ==========
type AuthView = "login" | "signup" | "forgot" | "reset_otp" | "forgot_sent" | "verify_phone";

// Email format validation (client-side, before hitting Supabase)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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

function Navbar({lang,setLang,onPricingTab,onLoginOpen}:{lang:string;setLang:(l:string)=>void;onPricingTab:(t:number)=>void;onLoginOpen:()=>void}) {
  const [open, setOpen] = useState(false);
  const [progOpen, setProgOpen] = useState(false);
  const [regulerSubOpen, setRegulerSubOpen] = useState(false);
  const [etpSubOpen, setEtpSubOpen] = useState(false);
  const [corpSubOpen, setCorpSubOpen] = useState(false); // __PATCH_NAV_CORPORATE_SUBMENU__
  const [privateSubOpen, setPrivateSubOpen] = useState(false); // linguo-patch:nav-semi-private-v1
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false); // linguo-patch:nav-hide-on-scroll-v1
  const lastY = useRef(0);
  const [placementPickerOpen, setPlacementPickerOpen] = useState(false);
  const [startPickerOpen, setStartPickerOpen] = useState(false); // linguo-patch:start-picker-v1
  useEffect(() => {
    let ticking = false;
    const fn = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 80);
        // Hide when scrolling down past the hero, reveal on any upward scroll.
        setHidden(y > 140 && y > lastY.current);
        lastY.current = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  // Lock body scroll when mobile drawer open (so background gak ikut ke-scroll)
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);
  const c = scrolled;

  const scrollTo = (id:string, tab?:number) => {
    if(tab!==undefined) onPricingTab(tab);
    setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'}), tab!==undefined?50:0);
    setProgOpen(false);
  };

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50"
      animate={{ y: hidden && !open ? "-100%" : 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      {/* Main Nav */}
      <nav className={`transition-all duration-300 ${c ? "bg-white shadow-sm" : "bg-[#1A9E9E]"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <a href="/" className="flex items-center">
              <Image src="/images/logo-white.png" alt="Linguo" width={158} height={56} loading="eager" sizes="158px" className={`h-8 sm:h-14 w-auto object-contain transition-all ${c?"brightness-0":""}`} />
            </a>
            <div className="hidden md:flex items-center gap-8">
              {/* Our Program dropdown */}
              <div className="relative" onMouseEnter={()=>setProgOpen(true)} onMouseLeave={()=>setProgOpen(false)}>
                <button className={`cursor-pointer relative text-sm font-bold py-1 flex items-center gap-1 ${c?"text-slate-700 hover:text-slate-900":"text-white hover:text-white"} transition-colors group`}>
                  Our Program
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${progOpen?"rotate-180":""}`}/>
                  <span className={`absolute left-0 -bottom-1 h-[3px] w-0 group-hover:w-full transition-all duration-300 rounded-full bg-[#fbbf24]`}/>
                </button>
                <AnimatePresence>{progOpen&&(
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} transition={{duration:0.2}}
                    className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-2 overflow-visible">
                    {/* Kelas Private — flyout submenu 1-on-1 / Semi Private — linguo-patch:nav-semi-private-v1 */}
                    <div
                      className="relative"
                      onMouseEnter={() => setPrivateSubOpen(true)}
                      onMouseLeave={() => setPrivateSubOpen(false)}
                    >
                      <button
                        onClick={() => setPrivateSubOpen((v) => !v)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors flex items-center justify-between"
                      >
                        Kelas Private
                        <ChevronDown className={"h-3 w-3 text-slate-300 transition-transform " + (privateSubOpen ? "rotate-0" : "-rotate-90")} />
                      </button>
                      {privateSubOpen && (
                        <div className="absolute left-full top-0 ml-0 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 transition-all duration-200">
                          <button
                            onClick={() => { (window as any).__openFunnel?.("Kelas Private"); setProgOpen(false); setPrivateSubOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors"
                          >
                            Private 1-on-1
                          </button>
                          <button
                            onClick={() => { (window as any).__openFunnel?.("Semi Private"); setProgOpen(false); setPrivateSubOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors"
                          >
                            Semi Private
                          </button>
                        </div>
                      )}
                    </div>
{/* Kelas Reguler + sub-item Jadwal */}
                    <div
                      className="relative"
                      onMouseEnter={() => setRegulerSubOpen(true)}
                      onMouseLeave={() => setRegulerSubOpen(false)}
                    >
                      <button
                        onClick={() => setRegulerSubOpen((v) => !v)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors flex items-center justify-between"
                      >
                        Kelas Reguler
                        <ChevronDown className={"h-3 w-3 text-slate-300 transition-transform " + (regulerSubOpen ? "rotate-0" : "-rotate-90")} />
                      </button>
                      {regulerSubOpen && (
                        <div className="absolute left-full top-0 ml-0 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 transition-all duration-200">
                          <a
                            href="/jadwal-kelas-reguler"
                            onClick={() => { setProgOpen(false); setRegulerSubOpen(false); }}
                            className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors"
                          >
                            Cek Jadwal Reguler
                          </a>
                          <button
                            onClick={() => { (window as any).__openFunnel?.("Kelas Reguler"); setProgOpen(false); setRegulerSubOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors"
                          >
                            Daftar Kelas Reguler
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Kelas Kids */}
                    <button onClick={()=>{(window as any).__openFunnel?.("Kelas Kids");setProgOpen(false)}}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors">
                      Kelas Kids
                    </button>
                    {/* IELTS / TOEFL + sub-item Jadwal ETP */}
                    <div
                      className="relative"
                      onMouseEnter={() => setEtpSubOpen(true)}
                      onMouseLeave={() => setEtpSubOpen(false)}
                    >
                      <button
                        onClick={() => setEtpSubOpen((v) => !v)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors flex items-center justify-between"
                      >
                        IELTS / TOEFL
                        <ChevronDown className={"h-3 w-3 text-slate-300 transition-transform " + (etpSubOpen ? "rotate-0" : "-rotate-90")} />
                      </button>
                      {etpSubOpen && (
                        <div className="absolute left-full top-0 ml-0 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 transition-all duration-200">
                          <a
                            href="/jadwal-kelas-reguler?tab=etp"
                            onClick={() => { setProgOpen(false); setEtpSubOpen(false); }}
                            className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors"
                          >
                            Cek Jadwal ETP
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-100 my-1"/>
                    <a href="/simulasi"
                      className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors">
                      Simulasi Tes TOEFL/IELTS
                    </a>
                    <a href="/produk"
                      className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors">
                      E-Learning
                    </a>
                    <a href="/produk/ebook"
                      className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors">
                      E-Book
                    </a>{/* produk-ebook-page-v1 */}
                    {/* Corporate + sub-items */}
                    <div
                      className="relative"
                      onMouseEnter={() => setCorpSubOpen(true)}
                      onMouseLeave={() => setCorpSubOpen(false)}
                    >
                      <button
                        onClick={() => setCorpSubOpen((v) => !v)}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors flex items-center justify-between"
                      >
                        Corporate
                        <ChevronDown className={"h-3 w-3 text-slate-300 transition-transform " + (corpSubOpen ? "rotate-0" : "-rotate-90")} />
                      </button>
                      {corpSubOpen && (
                        <div className="absolute left-full top-0 ml-0 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-2 transition-all duration-200">
                          <a
                            href="/corporate"
                            onClick={() => { setProgOpen(false); setCorpSubOpen(false); }}
                            className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors"
                          >
                            Language Training
                          </a>
                          <a
                            href="/interpreter"
                            onClick={() => { setProgOpen(false); setCorpSubOpen(false); }}
                            className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors"
                          >
                            Interpreter Service
                          </a>
                          <a
                            href="/translator"
                            onClick={() => { setProgOpen(false); setCorpSubOpen(false); }}
                            className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors"
                          >
                            Sworn Translator
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}</AnimatePresence>
              </div>
              {/* Other nav links */}
              {[["Harga","/harga"],["Silabus","/silabus"],["Blog","/blog"]].map(([l,h]) => (
                <a key={l} href={h} className={`cursor-pointer relative text-sm font-bold py-1 ${c?"text-slate-700 hover:text-slate-900":"text-white hover:text-white"} transition-colors group`}>
                  {l}
                  <span className={`absolute left-0 -bottom-1 h-[3px] w-0 group-hover:w-full transition-all duration-300 rounded-full bg-[#fbbf24]`}/>
                </a>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={onLoginOpen} className={`font-semibold px-5 py-2.5 rounded-full text-sm transition-all border-2 ${c ? "border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E]/5" : "border-white/60 text-white hover:bg-white/10"}`}>Login</button>
            {/* linguo-patch:start-picker-v1 — Placement Test + Coba Trial digabung jadi 1 tombol */}
            <button onClick={()=>setStartPickerOpen(true)} className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm transition-all active:scale-95">Mulai Belajar</button>
          </div>
          <button className="md:hidden" onClick={()=>setOpen(!open)}>{open?<X className={`h-5 w-5 ${c?"text-slate-900":"text-white"}`}/>:<Menu className={`h-5 w-5 ${c?"text-slate-900":"text-white"}`}/>}</button>
        </div>
        <AnimatePresence>{open&&(
          <motion.div
            initial={{x:"100%"}}
            animate={{x:0}}
            exit={{x:"100%"}}
            transition={{type:"tween", duration:0.25}}
            className="md:hidden fixed inset-0 z-[70] bg-white flex flex-col"
          >
            {/* Sticky header — logo teal + close X */}
            <div className="bg-[#1A9E9E] h-16 px-6 flex items-center justify-between shrink-0">
              <a href="/" onClick={()=>setOpen(false)} className="flex items-center">
                <Image src="/images/logo-white.png" alt="Linguo" width={113} height={40} loading="lazy" sizes="113px" className="h-8 sm:h-10 w-auto object-contain" />
              </a>
              <button
                onClick={()=>setOpen(false)}
                aria-label="Tutup menu"
                className="text-white p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable nav items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-1">
              <a href="/silabus/english/coba" onClick={()=>setOpen(false)} className="block py-3 text-base text-[#1A9E9E] font-semibold border-b border-gray-100 mb-2 pb-4">Placement Test Gratis</a>
              <button onClick={()=>{(window as any).__openFunnel?.("Kelas Private");setOpen(false)}} className="text-base py-3 text-left">Kelas Private 1-on-1</button>{/* linguo-patch:nav-semi-private-v1 */}
              <button onClick={()=>{(window as any).__openFunnel?.("Semi Private");setOpen(false)}} className="text-base py-3 text-left">Semi Private</button>{/* linguo-patch:nav-semi-private-v1 */}
              <button onClick={()=>{(window as any).__openFunnel?.("Kelas Reguler");setOpen(false)}} className="text-base py-3 text-left">Kelas Reguler</button>
              <a href="/jadwal-kelas-reguler" onClick={()=>setOpen(false)} className="text-sm py-2.5 text-left text-[#1A9E9E] pl-4 border-l-2 border-[#1A9E9E]/30">└ Jadwal Batch Terbaru</a>
              <button onClick={()=>{(window as any).__openFunnel?.("IELTS/TOEFL Prep");setOpen(false)}} className="text-base py-3 text-left">IELTS / TOEFL</button>
              <a href="/jadwal-kelas-reguler?tab=etp" onClick={()=>setOpen(false)} className="text-sm py-2.5 text-left text-[#1A9E9E] pl-4 border-l-2 border-[#1A9E9E]/30">└ Cek Jadwal ETP</a>
              <button onClick={()=>{(window as any).__openFunnel?.("Kelas Kids");setOpen(false)}} className="text-base py-3 text-left">Kelas Kids</button>
              <a href="/simulasi" onClick={()=>setOpen(false)} className="text-base py-3 text-left">Simulasi Tes TOEFL/IELTS</a>
              <a href="/produk" onClick={()=>setOpen(false)} className="text-base py-3 text-left">E-Learning</a>
              <a href="/produk/ebook" onClick={()=>setOpen(false)} className="text-base py-3 text-left">E-Book</a>
              <a href="/harga" onClick={()=>setOpen(false)} className="text-base py-3">Harga</a>
              <a href="/silabus" onClick={()=>setOpen(false)} className="text-base py-3">Silabus</a>
              <a href="/blog" onClick={()=>setOpen(false)} className="text-base py-3">Blog</a>
            </div>

            {/* Sticky footer — Login + Placement Test (always visible) */}
            <div className="border-t border-gray-100 p-4 flex flex-col gap-2 shrink-0 bg-white">
              <button onClick={()=>{onLoginOpen();setOpen(false)}} className="border-2 border-[#1A9E9E] text-[#1A9E9E] text-center py-3 rounded-full font-semibold text-sm w-full">Login</button>
              {/* linguo-patch:drawer-start-picker-v1 — Placement Test + Coba Trial digabung jadi 1 tombol Mulai Belajar */}
              <button onClick={()=>{setStartPickerOpen(true);setOpen(false)}} className="bg-[#fbbf24] text-slate-900 text-center py-3 rounded-full font-semibold text-sm w-full">Mulai Belajar</button>
            </div>
          </motion.div>
        )}</AnimatePresence>
      </nav>
      {/* linguo-patch:start-picker-v1 — popup pilih Placement Test / Trial Class */}
      <AnimatePresence>
        {startPickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={()=>setStartPickerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed z-[60] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 pt-6 pb-2 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Mau mulai dari mana?</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Pilih cara kamu kenalan sama Linguo.</p>
                </div>
                <button onClick={()=>setStartPickerOpen(false)} aria-label="Tutup" className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-6 pb-6 pt-2 space-y-3">
                <button
                  onClick={()=>{ setStartPickerOpen(false); setPlacementPickerOpen(true); }}
                  className="w-full text-left rounded-2xl border-2 border-gray-200 bg-white p-4 hover:border-[#1A9E9E] hover:bg-[#1A9E9E]/5 transition-all active:scale-[0.99] flex items-start gap-3"
                >
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      Placement Test
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Gratis</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Cek level bahasa kamu dulu — cuma ~10 menit, langsung dapet hasil.</div>
                  </div>
                </button>
                <button
                  onClick={()=>{ setStartPickerOpen(false); (window as any).__openTrialWizard?.(); }}
                  className="w-full text-left rounded-2xl border-2 border-gray-200 bg-white p-4 hover:border-[#1A9E9E] hover:bg-[#1A9E9E]/5 transition-all active:scale-[0.99] flex items-start gap-3"
                >
                  <div>
                    <div className="font-bold text-gray-900">Trial Class</div>
                    <div className="text-xs text-gray-500 mt-0.5">Coba 1 sesi kelas beneran bareng pengajar (Private / Kids).</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* linguo-patch:old-wa-float-removed-v2 — tombol WA float lama dihapus; diganti ChatWidget Ling */}
      <PlacementPicker open={placementPickerOpen} onClose={()=>setPlacementPickerOpen(false)} />

    </motion.div>
  );
}

function FAQ({q,a,video}:{q:string;a:string;video?:string}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button onClick={()=>setOpen(!open)} className="flex items-center justify-between w-full py-6 text-left">
        <span className="text-base font-semibold pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ease-out ${open?"rotate-180":""}`}/>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open?"grid-rows-[1fr]":"grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className={`pb-6 text-sm text-slate-500 leading-relaxed transition-opacity duration-200 ${open?"opacity-100":"opacity-0"}`}>{a}</p>
          {video && (
            <div className={`pb-6 transition-opacity duration-200 ${open?"opacity-100":"opacity-0"}`}>
              <div className="relative w-full max-w-xl aspect-video rounded-xl overflow-hidden shadow-sm">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${video}`}
                  title={q}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const GREETINGS = [
  {text:"Hello!",code:"gb"},{text:"Hola!",code:"es"},{text:"こんにちは",code:"jp"},{text:"안녕하세요",code:"kr"},
  {text:"你好!",code:"cn"},{text:"Bonjour!",code:"fr"},{text:"Hallo!",code:"de"},{text:"Ciao!",code:"it"},
  {text:"مرحبا!",code:"sa"},{text:"Olá!",code:"br"},{text:"Привет!",code:"ru"},{text:"สวัสดี!",code:"th"},
];

const FLAG_CODES: Record<string,string> = {
  // English names
  English:"gb",Japanese:"jp",Korean:"kr",Mandarin:"cn",Arabic:"sa",French:"fr",German:"de",Spanish:"es",Italian:"it",Dutch:"nl",Portuguese:"br",Russian:"ru",Thai:"th",Vietnamese:"vn",Hindi:"in",Turkish:"tr",Polish:"pl",Swedish:"se",Norwegian:"no",Danish:"dk",Finnish:"fi",Greek:"gr",Czech:"cz",Hungarian:"hu",Hebrew:"il",Persian:"ir",Swahili:"ke",Tagalog:"ph",Malay:"my",Georgian:"ge",Javanese:"id",Sundanese:"id",Betawi:"id",BIPA:"id",Urdu:"pk",Bengali:"bd",Romanian:"ro",
  // Indonesian names (Mandarin same in both languages — already covered above)
  Inggris:"gb",Jepang:"jp",Korea:"kr",Arab:"sa",Prancis:"fr",Jerman:"de",Spanyol:"es",Italia:"it",Belanda:"nl",Portugis:"br",Rusia:"ru",Thailand:"th",Vietnam:"vn",Turki:"tr",Polandia:"pl",Swedia:"se",Norwegia:"no",Denmark:"dk",Finlandia:"fi",Yunani:"gr",Ceko:"cz",Hungaria:"hu",Ibrani:"il",Persia:"ir",Filipina:"ph",Melayu:"my",Georgia:"ge",Jawa:"id",Sunda:"id",Pakistan:"pk",Bangladesh:"bd",Rumania:"ro"
};
function getFlagCode(name:string){return FLAG_CODES[name]||"un"}

// Bendera rounded-rectangle (blade-flags, varian default). SVG inline tanpa
// width/height bawaan -> defaultnya ~150px & bikin layout berantakan. Jadi kita
// hitung dimensi eksplisit dari viewBox (aspect ratio asli dijaga) dan set ke
// SVG + wrapper. Tinggi diatur lewat prop `h` (px).
function RectFlag({code,h=24,className=""}:{code:string;h?:number;className?:string}){
  const svg=resolveFlag(defaultFlags,code,"country");
  if(!svg) return <Globe aria-hidden style={{height:h,width:h}} className={`text-slate-400 shrink-0 ${className}`}/>;
  const m=svg.match(/viewBox="([\d.\s-]+)"/);
  let w=Math.round(h*36/26);
  if(m){const p=m[1].trim().split(/\s+/).map(Number);if(p.length===4&&p[3])w=Math.round(h*p[2]/p[3]);}
  const sized=svg.replace(/<svg /,`<svg width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" style="display:block" `);
  return <span aria-hidden style={{height:h,width:w}} className={`inline-flex overflow-hidden rounded-[4px] shrink-0 ${className}`} dangerouslySetInnerHTML={{__html:sized}}/>;
}

function TypingBubble({size="lg"}:{size?:"sm"|"lg"}={}) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const greeting = GREETINGS[idx].text;
    if (typing) {
      if (displayed.length < greeting.length) {
        const t = setTimeout(() => setDisplayed(greeting.slice(0, displayed.length + 1)), 80);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 1500);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
        return () => clearTimeout(t);
      } else {
        setIdx((idx + 1) % GREETINGS.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, idx]);

  if (size === "sm") {
    return (
      <span className="font-bold text-[#1A9E9E] text-xs sm:text-sm inline-flex items-center gap-1.5 min-w-[60px]">
        <RectFlag code={GREETINGS[idx].code} h={14}/>
        {displayed}<span className="animate-pulse text-[#1A9E9E]/50">|</span>
      </span>
    );
  }

  return (
    <span className="font-bold text-[#1A9E9E] text-xl inline-flex items-center gap-2 min-w-[140px]">
      <RectFlag code={GREETINGS[idx].code} h={22}/>
      {displayed}<span className="animate-pulse text-[#1A9E9E]/50">|</span>
    </span>
  );
}

const WHY_CARDS = [
  "/images/why-1.png","/images/why-2.png","/images/why-3.png",
  "/images/why-4.png","/images/why-5.png","/images/why-6.png",
];

function WhyCarousel() {
  const [active, setActive] = useState(1);
  const [cardW, setCardW] = useState(300);
  const total = WHY_CARDS.length;
  const gap = 24;
  const step = cardW + gap;

  // linguo-patch:disable-autoscroll-v1
  // Auto-scroll disabled — user can navigate manually via arrows/dots

  // Responsive card width — fit phones, normal on desktop
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setCardW(Math.min(w - 80, 220));
      else setCardW(300);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Center the active card: offset so active is in the middle
  const offset = -(active * step);

  return (
    <div className="relative px-4 sm:px-6">
      <div className="flex justify-end max-w-5xl mx-auto gap-2 mb-3 sm:mb-6">
        <button onClick={() => setActive(a => (a - 1 + total) % total)} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"><ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500"/></button>
        <button onClick={() => setActive(a => (a + 1) % total)} className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"><ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500"/></button>
      </div>
      <div className="max-w-5xl mx-auto overflow-hidden py-4 sm:py-6">
        <div className="flex" style={{
          transform: `translateX(calc(50% - ${cardW/2}px + ${offset}px))`,
          transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          gap: `${gap}px`,
        }}>
          {WHY_CARDS.map((src, i) => {
            const isCenter = i === active;
            const isAdj = Math.abs(i - active) === 1 || (active === 0 && i === total-1) || (active === total-1 && i === 0);
            return (
              <div key={i} className="shrink-0 cursor-pointer" style={{width:`${cardW}px`}} onClick={() => setActive(i)}>
                <div className="rounded-2xl overflow-hidden bg-white" style={{
                  transform: `scale(${isCenter ? 1.08 : 0.92})`,
                  opacity: isCenter ? 1 : isAdj ? 0.65 : 0.3,
                  boxShadow: isCenter ? '0 25px 60px -12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
                  border: isCenter ? '2px solid rgba(26,158,158,0.25)' : '1px solid #f1f5f9',
                  transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                  <Image src={src} alt="" width={400} height={519} loading="lazy" sizes="(min-width: 640px) 300px, 220px" className="w-full h-auto"/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-2 sm:mt-4">
        {WHY_CARDS.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} className={`transition-all duration-500 rounded-full ${i === active ? "w-7 sm:w-8 h-2 sm:h-2.5 bg-[#1A9E9E]" : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#1A9E9E]/30"}`}/>
        ))}
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  {name:"Suci Damaeyanti",lang:"Inggris",photo:"/images/testimoni/suci-damaeyanti.jpg",color:"from-pink-300 to-rose-400",initials:"SD",
    text:"Belajar di Linguo sangat membantu meningkatkan kemampuan bahasa Inggris saya, terutama dalam speaking dan grammar yang awalnya benar-benar tidak saya ketahui. Sekarang, saya sudah mulai paham perlahan. Pengajarnya sabar, materinya mudah dipahami, suasana belajarnya oke, dan waktu les fleksibel."},
  {name:"Arivania Shafa N",lang:"Turki",photo:"/images/testimoni/arivania-shafa-n.jpg",color:"from-blue-300 to-indigo-400",initials:"AS",
    text:"Saya baru pertama kali ikut Kelas Bahasa Turki, awalnya kirain bakal boring dan susah, tapi ternyata gampang banget setelah diajarin tutor Linguo dan seru juga kelasnya, bisa bikin good mood."},
  {name:"Astrid Setyowati",lang:"Korea",photo:"/images/testimoni/astrid-setyowati.jpg",color:"from-purple-300 to-violet-400",initials:"AS",
    text:"Belajar di Linguo sangat membantu saya dalam belajar bahasa Korea. Cara mengajarnya mudah dipahami. Meskipun kelasnya online lewat Zoom, tapi kelasnya tetap terasa menyenangkan."},
  {name:"Tasya Jehan",lang:"Jepang",photo:"/images/testimoni/tasya-jehan.jpg",color:"from-amber-300 to-orange-400",initials:"TJ",
    text:"Kursus bahasa di Linguo ID sangat menyenangkan. Gurunya mengajar dengan baik serta menjelaskan materi secara lengkap dan detail. Saya mengambil kelas bahasa Jepang dan saat ini sudah melanjutkan hingga tahap ke-3."},
  {name:"Cicie Prilianti",lang:"Rusia",photo:"/images/testimoni/cicie-prilianti.jpg",color:"from-emerald-300 to-teal-400",initials:"CP",
    text:"Jadi, aku mengikuti dua kelas di Linguo: kelas Bahasa Jepang dan kelas Bahasa Rusia. Pengajarnya sangat semangat dan asyik saat mengajar."},
  {name:"Grace Cynthia",lang:"Prancis",photo:"/images/testimoni/grace-cynthia.jpg",color:"from-cyan-300 to-sky-400",initials:"GC",
    text:"ini pertama kalinya saya ikut kelas di Linguo ID. Saya ambil kelas Bahasa Prancis. Keren banget ternyata kelasnya karena bisa langsung praktik jadi proses belajarnya terasa nggak terlalu rumit."},
];

function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const [cardW, setCardW] = useState(560);
  const total = TESTIMONIALS.length;

  // linguo-patch:disable-autoscroll-v1
  // Auto-scroll disabled — user can navigate manually via arrows/dots

  // Responsive card width: ~90% viewport on mobile, fixed 560px on desktop
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setCardW(Math.min(w - 48, 320));
      else setCardW(560);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const gap = 24;
  const offset = -(active * (cardW + gap));

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        <button onClick={() => setActive(a => (a - 1 + total) % total)} className="hidden sm:flex h-10 w-10 shrink-0 rounded-full border border-slate-200 items-center justify-center hover:bg-slate-50 transition-colors"><ChevronLeft className="h-4 w-4 text-slate-500"/></button>
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-6" style={{
            transform: `translateX(calc(50% - ${cardW/2}px + ${offset}px))`,
            transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {TESTIMONIALS.map((t, i) => {
              const isCurrent = i === active;
              const photoW = cardW < 400 ? 90 : 200;
              return (
                <div key={i} className="shrink-0" style={{width:`${cardW}px`}} onClick={() => setActive(i)}>
                  <div className={`flex gap-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${isCurrent ? "opacity-100 shadow-lg" : "opacity-40 scale-95"}`}>
                    <div className={`shrink-0 bg-gradient-to-br ${t.color} flex items-center justify-center relative overflow-hidden`} style={{width:`${photoW}px`}}>
                      {t.photo ? (
                        // Foto asli — full cover, tanpa overlay apapun
                        <Image
                          src={t.photo}
                          alt={`Testimoni ${t.name} - Siswa Kelas ${t.lang} Linguo`}
                          fill
                          loading="lazy"
                          sizes="(min-width: 400px) 200px, 90px"
                          className="object-cover"
                        />
                      ) : (
                        // Fallback initials — hanya muncul kalau photo field gak ada
                        <div className="h-24 w-24 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white">{t.initials}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 bg-slate-50 p-4 sm:p-6 text-left">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm truncate">{t.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <img src={`https://flagcdn.com/w40/${getFlagCode(t.lang)}.png`} alt={`Bendera ${t.lang}`} loading="lazy" decoding="async" className="h-3.5 w-3.5 rounded-full object-cover"/>
                            <p className="text-xs text-[#1A9E9E]">{t.lang}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 shrink-0">{[1,2,3,4,5].map(s=><Star key={s} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400"/>)}</div>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mt-2 line-clamp-4">{t.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <button onClick={() => setActive(a => (a + 1) % total)} className="hidden sm:flex h-10 w-10 shrink-0 rounded-full border border-slate-200 items-center justify-center hover:bg-slate-50 transition-colors"><ChevronRight className="h-4 w-4 text-slate-500"/></button>
      </div>
      <div className="flex justify-center gap-2 mt-8">
        {TESTIMONIALS.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} className={`transition-all duration-500 rounded-full ${i === active ? "w-8 h-2.5 bg-[#1A9E9E]" : "w-2.5 h-2.5 bg-[#1A9E9E]/30"}`}/>
        ))}
      </div>
    </div>
  );
}

const TEACHER_DATA = [
  {name:"Febri Darusman",role:"Spanish & Thai Teacher",img:"/images/teachers/teacher-febri.png",f1:"th",f2:"es",
    bio:"Lulusan Sastra Prancis UGM. Berpengalaman mengajar dari 2013, selain itu pernah menjadi ketua komunitas Polyglot Indonesia chapter Bandung.",
    lessons:850,rating:5.0,price:"Rp 90K"},
  {name:"Nitalia Wijaya",role:"Korean & English Teacher",img:"/images/teachers/teacher-nitalia.png",f1:"kr",f2:"gb",
    bio:"Lulusan Sastra Korea UNPAD. Memiliki sertifikasi TOPIK Level 5 dan pengalaman tinggal di Seoul selama 2 tahun.",
    lessons:1200,rating:5.0,price:"Rp 90K"},
  {name:"Angga",role:"Chinese & Korean Teacher",img:"/images/teachers/teacher-angga.png",f1:"cn",f2:"kr",
    bio:"Lulusan Sastra China UNPAD dengan sertifikasi HSK 5. Berpengalaman mengajar Bahasa Mandarin dan Korea sejak 2018.",
    lessons:680,rating:4.9,price:"Rp 90K"},
  {name:"Paramita Wulandari",role:"Japanese & Portuguese Teacher",img:"/images/teachers/teacher-paramita.png",f1:"jp",f2:"br",
    bio:"Lulusan Sastra Jepang UI dengan sertifikasi JLPT N2. Pernah tinggal di Osaka selama 1 tahun sebagai exchange student.",
    lessons:920,rating:5.0,price:"Rp 90K"},
  {name:"Thifal Syahla",role:"English & Persian Teacher",img:"/images/teachers/teacher-thifal.png",f1:"gb",f2:"ir",
    bio:"Lulusan Sastra Inggris UPI. Memiliki sertifikasi IELTS 7.5 dan pengalaman mengajar Bahasa Inggris dan Persia sejak 2019.",
    lessons:1050,rating:5.0,price:"Rp 90K"},
  {name:"Yeremia Immanuel",role:"French & Swahili Teacher",img:"/images/teachers/teacher-yeremia.png",f1:"fr",f2:"ke",
    bio:"Lulusan Sastra Prancis UGM. Berpengalaman mengajar Bahasa Prancis dan Swahili dengan pendekatan komunikatif sejak 2017.",
    lessons:740,rating:4.9,price:"Rp 90K"},
];

function FunnelModal({open,onClose,initialProgram="",initialLang="",initialLevel="",initialPreferredProg="",initialSource="",initialName="",initialWa=""}:{open:boolean;onClose:()=>void;initialProgram?:string;initialLang?:string;initialLevel?:string;initialPreferredProg?:string;initialSource?:string;initialName?:string;initialWa?:string}) {
  /* linguo-patch:funnel-native-v1 */
  // Detect initial step dari props biar gak flash step 1 dulu pas open
  const initialStep = (() => {
    if (initialLang && initialLevel && initialPreferredProg) return 5;
    if (initialLang && initialProgram) return 3;
    if (initialLang) return 2;
    return 1;
  })();
  const [step, setStep] = useState(initialStep);
  const [selLang, setSelLang] = useState(initialLang || "");
  const [selProgram, setSelProgram] = useState(initialProgram || initialPreferredProg || "");
  // [ling-hide-fab-overlay-v1] daftarin overlay global → sembunyiin FAB WhatsApp
  useOverlayLock(open);
  useEffect(() => {
    if (open) {
      // Priority logic:
      // 1. Placement test flow: language + level + preferredProgram → step 2 (pilih program, pre-highlight preferredProgram)
      // 2. language + program → step 3 (pilih level)
      // 3. language only → step 2 (pilih program)
      // 4. program only → step 1 (pilih bahasa)
      if (initialLang && initialLevel && initialPreferredProg) {
        setSelLang(initialLang);
        setSelLevel(initialLevel);
        setSelProgram(initialPreferredProg);
        setStep(5); // Skip straight to data diri form (nama/email/WA already partially known)
      } else if (initialLang && initialProgram) {
        setSelLang(initialLang); setSelProgram(initialProgram); setStep(3);
      } else if (initialLang) {
        setSelLang(initialLang); setStep(2);
      } else if (initialProgram) {
        setSelProgram(initialProgram); setStep(1);
      }
      // Auto-fill form fields dari prefill (placement test flow)
      if (initialName) setFormName(initialName);
      if (initialWa) setFormWa(initialWa);
    }
    if (!open) { setStep(1); setSelProgram(""); setSelLang(""); setSelLevel(""); setSelTeacherType("lokal"); setTeacherPick(false); setClassSize(2); setSelDuration(60); setSelSessions(12); setAddAddon(false); setAgreeTerms(false); }
  }, [open, initialProgram, initialLang, initialLevel, initialPreferredProg, initialName, initialWa]);
  const [selLevel, setSelLevel] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formWa, setFormWa] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  // referral-code-field-v1 — optional kode referral; default KOSONG (input manual).
  // Affiliate tetap ke-track di background lewat ?ref= / linguo_ref saat submit.
  const [refCode, setRefCode] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Populer");
  const [selTeacherType, setSelTeacherType] = useState<"lokal"|"native">("lokal");
  const [teacherPick, setTeacherPick] = useState(false);
  const [classSize, setClassSize] = useState(2); // linguo-patch:funnel-semi-private-calc-v1
  const [selDuration, setSelDuration] = useState(60); // linguo-patch:funnel-session-duration-v1 — menit per sesi (Private/Semi/Kids)
  const [selSessions, setSelSessions] = useState(12); // funnel-xendit-v1 — jumlah sesi (paket); total = harga/sesi × jumlah sesi
  const [addAddon, setAddAddon] = useState(false); // addon-ebook-recording-v1 — toggle E-Book + Recording bundle (Reguler only)
  const [agreeTerms, setAgreeTerms] = useState(false); // terms-agreement-v1 — gating "Bayar Sekarang" (Reguler only)

  // linguo-patch:reguler-lang-gate-v3 — di flow Kelas Reguler, step-1 cuma munculin bahasa berjadwal (kayak /jadwal-kelas-reguler)
  const isRegulerFlow = selProgram==="Kelas Reguler";
  const pool = isRegulerFlow
    ? REGULER_LANGS
    : (search.trim()
        ? LANG_CATEGORIES.flatMap(c=>c.langs).filter((v,i,a)=>a.indexOf(v)===i)
        : (LANG_CATEGORIES.find(c=>c.label===activeTab)?.langs || []));
  const filtered = search.trim()
    ? pool.filter(l=>l.toLowerCase().includes(search.toLowerCase()))
    : pool;

  const isEnglish = selLang==="English";
  const isReguler = REGULER_LANGS.includes(selLang);

  // Pengajar native: terbatas ke bahasa yang sudah punya native teacher.
  // Native = NATIVE_MULTIPLIER x tarif lokal (konsisten dgn /harga).
  const NATIVE_AVAILABLE_LANGS = ["English","Tagalog","Spanish","Arabic"];
  const NATIVE_MULTIPLIER = 2;
  // linguo-patch:private-pricing-v1 — harga per sesi 60 menit, level A1, sesuai
  // kategori bahasa. Level dipilih SETELAH langkah ini → angka ini "Mulai dari".
  // Fallback "C" (Rp100rb) bila bahasa belum dikenal, JANGAN D (Rp90rb).
  const PRIVATE_BASE_PRICE = PRICE_A1_60MIN[getLanguageCategory(selLang) || "C"] ?? 100000;
  const nativeAvailable = NATIVE_AVAILABLE_LANGS.includes(selLang);
  const fmtRp = (n:number) => "Rp " + n.toLocaleString("id-ID");
  // linguo-patch:funnel-semi-private-calc-v1 — harga semi private live (ikut durasi sesi terpilih)
  const semiPrice = selProgram==="Semi Private" ? getSemiPrivatePrice(selLang, selLevel, classSize, selDuration) : null;

  // linguo-patch:funnel-session-duration-v1 — pilihan durasi (menit) per sesi.
  // Private & Semi Private: harga proporsional terhadap durasi. Kids: durasi
  // dibatasi utk rentang usia anak, harga di-scale dari tarif dasar per tipe.
  const DURATION_OPTS = selProgram==="Kelas Kids" ? [30,45,60] : [30,45,60,75,90];
  // Harga Private/sesi utk durasi & tipe pengajar terpilih (proporsional dari base 60mnt).
  const privatePerSession = Math.round((PRIVATE_BASE_PRICE * selDuration) / 60) * (selTeacherType==="native" ? NATIVE_MULTIPLIER : 1);
  // Harga Kids/sesi: scale dari tarif dasar (per tipe) proporsional durasi, dibulatkan ke 5rb.
  const KIDS_KEY: Record<string,string> = { "Little Learner":"little-learner", "Young Explorer":"young-explorer" };
  const kidsKey = KIDS_KEY[selLevel];
  const kidsPerSession = kidsKey ? Math.round(((KIDS_PRICE[kidsKey] / KIDS_DURATION[kidsKey]) * selDuration) / 5000) * 5000 : 0;

  // funnel-xendit-v1 — paket jumlah sesi (Private/Semi/Kids) + total tagihan.
  // Formula WAJIB identik dgn /api/create-funnel-invoice (server hitung ulang).
  const SESSION_OPTS = [4, 8, 12, 16, 24];
  const IELTS_PRICE = 300000;
  const isSessionProg = selProgram==="Kelas Private" || selProgram==="Semi Private" || selProgram==="Kelas Kids";
  const perSession = selProgram==="Kelas Private" ? privatePerSession
    : selProgram==="Kelas Kids" ? kidsPerSession
    : selProgram==="Semi Private" ? (semiPrice?.perStudent || 0)
    : 0;
  const totalAmount =
    isSessionProg ? perSession * selSessions
    : selProgram==="IELTS/TOEFL Prep" ? IELTS_PRICE
    : 0;

  const programs = [
    {id:"Kelas Private",title:"Kelas Private",desc:"1-on-1 via Zoom, jadwal fleksibel",price:"Mulai "+fmtRp(PRIVATE_BASE_PRICE)+"/sesi",highlight:true},
    {id:"Semi Private",title:"Semi Private",desc:"Grup kecil 2–10 orang, lebih hemat per orang",price: selLang && getSemiPrivatePrice(selLang,"A1",10,60).perStudent>0 ? ("Mulai "+fmtRp(getSemiPrivatePrice(selLang,"A1",10,60).perStudent)+"/orang") : "Patungan grup — hemat per orang",highlight:false}, // linguo-patch:funnel-semi-private-calc-v1
    ...(isReguler?[{id:"Kelas Reguler",title:"Kelas Reguler",desc:"Grup class, jadwal tetap, lebih terjangkau",price:"Rp 150.000/2 bulan",highlight:false,note:"*Kelas dibuka minimal 8 peserta"}]:[]),
    {id:"Kelas Kids",title:"Kelas Kids",desc:"1-on-1 untuk anak 5-12 tahun, fun & interaktif",price:"Mulai Rp 75.000/sesi",highlight:false},
    ...(isEnglish?[{id:"IELTS/TOEFL Prep",title:"IELTS / TOEFL Prep",desc:"16 sesi @90 menit, persiapan intensif",price:"Rp 300.000/2 bulan",highlight:false}]:[]),
  ];

  const levels = selProgram==="Kelas Reguler"
    ? [{id:"A1",label:"A1 — Basic",desc:"Pemula, mulai dari nol"}]
    : selProgram==="Kelas Kids"
    ? [{id:"Little Learner",label:"Little Learner",desc:"Usia 5–8 tahun • fun & interaktif"},
       {id:"Young Explorer",label:"Young Explorer",desc:"Usia 9–12 tahun • fun & interaktif"}]
    : [{id:"A1",label:"A1 — Basic",desc:"Pemula, mulai dari nol"},
       {id:"A2",label:"A2 — Elementary",desc:"Percakapan sederhana"},
       {id:"B1",label:"B1 — Intermediate",desc:"Percakapan sehari-hari"},
       {id:"B2",label:"B2 — Upper Intermediate",desc:"Lancar & kompleks"}];

  const validateForm = () => {
    if(!formName.trim()) { setFormError("Masukkan nama lengkap"); return false; }
    if(!formEmail.trim() || !formEmail.includes("@")) { setFormError("Masukkan email yang valid"); return false; }
    if(!formWa || formWa.length < 9) { setFormError("Masukkan nomor WhatsApp yang valid"); return false; }
    if(countryCode==="+62" && formWa[0]!=="8") { setFormError("Nomor Indonesia harus diawali 8"); return false; }
    setFormError("");
    return true;
  };

  const handleFinal = async () => {
    setSaving(true);
    try {
      const fullNum = countryCode.replace("+","") + formWa;

      // ── reguler-xendit-v1: Kelas Reguler checks out directly via Xendit. ──
      // Other programs keep the WhatsApp redirect below (unchanged). The
      // /api/create-invoice route inserts its own lead row (payment status +
      // affiliate attribution from the linguo_ref cookie), so we skip saveLead
      // here for Reguler to avoid a duplicate lead.
      if (selProgram === "Kelas Reguler") {
        const productKey = "reguler-" + selLevel.toLowerCase();
        try {
          const res = await fetch("/api/create-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: formName, email: formEmail, wa_number: fullNum, language: selLang, program: "reguler", level: selLevel, productKey, addon: addAddon, referral_source: localStorage.getItem("linguo_ref") || undefined, ref_code: refCode.trim() || undefined }),
          });
          const data = await res.json();
          if (data.invoice_url) { window.location.href = data.invoice_url; return; }
          alert("Gagal membuat invoice: " + (data.error || "Silakan coba lagi"));
          setSaving(false);
        } catch (xErr) {
          console.error("Xendit invoice error:", xErr);
          alert("Terjadi kesalahan saat membuat pembayaran. Silakan coba lagi.");
          setSaving(false);
        }
        return;
      }

      // ── funnel-xendit-v1: Private / Semi Private / Kids / IELTS checkout ──
      // langsung ke Xendit. Harga dihitung ULANG di server (anti-tamper);
      // endpoint menyimpan lead + attribusi referral sendiri.
      const refFinal = refCode.trim()
        || (typeof window !== "undefined"
          ? (new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("linguo_ref") || "")
          : "");
      const res = await fetch("/api/create-funnel-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          wa_number: fullNum,
          program: selProgram,
          language: selLang,
          level: selLevel,
          duration: selDuration,
          teacher_type: selProgram==="Kelas Private" ? selTeacherType : null,
          sessions: isSessionProg ? selSessions : null,
          class_size: selProgram==="Semi Private" ? classSize : null,
          ref_code: refFinal || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.invoice_url) { window.location.href = data.invoice_url; return; }
      setFormError(data?.error || "Gagal memproses pembayaran. Coba lagi ya.");
      setSaving(false);
    } catch(e) {
      console.error("Submit error:", e);
      setFormError("Koneksi bermasalah. Silakan coba lagi.");
      setSaving(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Save funnel data in cookie (survives OAuth redirect, unlike localStorage/URL params)
    document.cookie = "linguo_funnel=" + encodeURIComponent(JSON.stringify({ program: selProgram, language: selLang, level: selLevel, wa: formWa, name: formName })) + ";path=/;max-age=600;SameSite=Lax";
    if(typeof window!=="undefined"&&(window as any).gtag)(window as any).gtag("event","funnel_form_submitted",{program:selProgram,language:selLang,level:selLevel});
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/akun" },
    });
  };
  const handleClose = () => { onClose(); setStep(1); setSearch(""); setSelLang(""); setSelProgram(""); setSelLevel(""); setFormName(""); setFormEmail(""); setFormWa(""); setFormError(""); setSelTeacherType("lokal"); setTeacherPick(false); setClassSize(2); setSelDuration(60); setSelSessions(12); setAddAddon(false); setAgreeTerms(false); };

  return (
    <AnimatePresence>{open&&(
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center px-4"
        onClick={handleClose}>
        <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}}
          className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col"
          onClick={(e)=>e.stopPropagation()}>

          <div className="flex gap-1.5 px-6 pt-5">
            {[1,2,3,4,5].map(s=>(
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s<=step?"bg-[#1A9E9E]":"bg-slate-200"}`}/>
            ))}
          </div>

          <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"><X className="h-5 w-5"/></button>

          {/* STEP 1 — Pilih Bahasa */}
          {step===1 && (
            <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 pb-4">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Mau belajar bahasa apa?</h3>
                <p className="text-sm text-slate-500 mb-4">{isRegulerFlow ? "Bahasa yang punya jadwal Kelas Reguler" : "Pilih bahasa yang kamu minati"}</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                  <input type="text" placeholder="Cari bahasa..." value={search} onChange={(e)=>setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20"/>
                </div>
              </div>
              {!search.trim() && !isRegulerFlow && (
                <div className="px-6 flex gap-2 mb-3 overflow-x-auto pb-1">
                  {LANG_CATEGORIES.map(c=>(
                    <button key={c.label} onClick={()=>setActiveTab(c.label)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeTab===c.label?"bg-[#1A9E9E] text-white":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="px-6 pb-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map(l=>(
                    <button key={l} onClick={()=>{const lReg=REGULER_LANGS.includes(l);setSelLang(l);setSearch("");if(selProgram==="Kelas Reguler"&&!lReg){setSelProgram("");setStep(2);}else if(selProgram==="Kelas Private"){setTeacherPick(true);setStep(2)}else{setStep(selProgram?3:2)}}}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left border border-slate-100 text-slate-700 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] hover:border-[#1A9E9E]/30">
                      <RectFlag code={getFlagCode(l)} h={24}/>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Pilih Program */}
          {step===2 && !teacherPick && (
            <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1">
              <button onClick={()=>setStep(1)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti bahasa</button>
              <div className="flex items-center gap-2 mb-4">
                <RectFlag code={getFlagCode(selLang)} h={24}/>
                <span className="font-bold">{selLang}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Pilih jenis kelas</h3>
              <p className="text-sm text-slate-500 mb-6">Mau belajar dengan cara apa?</p>
              <div className="flex flex-col gap-3">
                {programs.map(p=>(
                  <button key={p.id} onClick={()=>{ setSelLevel(""); setSelDuration(60); setSelSessions(12); if(p.id==="Kelas Private"){ setSelProgram(p.id); setTeacherPick(true); } else { setSelProgram(p.id); setSelTeacherType("lokal"); setStep(3); } }}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:border-[#1A9E9E]/40 hover:shadow-md ${p.highlight?"border-[#1A9E9E]/20 bg-[#1A9E9E]/[0.02]":"border-slate-100"}`}>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm">{p.title}</p>
                        {p.highlight && <span className="text-[10px] font-bold bg-[#1A9E9E] text-white px-2 py-0.5 rounded-full">POPULER</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                      <p className="text-sm font-bold text-[#1A9E9E] mt-2">{p.price}</p>
                      {"note" in p && p.note && <p className="text-[10px] text-slate-400 mt-1">{p.note}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 mt-1 shrink-0"/>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2b — Pilih Tipe Pengajar (khusus Kelas Private) */}
          {step===2 && teacherPick && (
            <motion.div key="s2b" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1 overflow-y-auto">
              <button onClick={()=>setTeacherPick(false)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti program</button>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-5">
                <RectFlag code={getFlagCode(selLang)} h={20}/>
                <span className="text-sm font-medium">{selLang}</span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-[#1A9E9E] font-medium">Kelas Private</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Pilih tipe pengajar</h3>
              <p className="text-sm text-slate-500 mb-5">Mau belajar dengan pengajar lokal atau native speaker?</p>
              <div className="flex flex-col gap-3">
                {/* Lokal */}
                <button onClick={()=>{setSelTeacherType("lokal");setTeacherPick(false);setStep(3)}}
                  className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 text-left transition-all hover:border-[#1A9E9E]/40 hover:shadow-md">
                  <div className="flex-1">
                    <p className="font-bold text-sm">Pengajar Lokal</p>
                    <p className="text-xs text-slate-500 mt-0.5">Pengajar Indonesia berpengalaman & bersertifikat</p>
                    <p className="text-sm font-bold text-[#1A9E9E] mt-2">Mulai {fmtRp(PRIVATE_BASE_PRICE)}/sesi</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 mt-1 shrink-0"/>
                </button>
                {/* Native */}
                {nativeAvailable ? (
                  <button onClick={()=>{setSelTeacherType("native");setTeacherPick(false);setStep(3)}}
                    className="flex items-start gap-4 p-4 rounded-2xl border-2 border-[#fbbf24]/50 bg-[#fbbf24]/[0.04] text-left transition-all hover:border-[#fbbf24] hover:shadow-md">
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm">Pengajar Native</p>
                        <span className="text-[10px] font-bold bg-[#fbbf24] text-slate-900 px-2 py-0.5 rounded-full shrink-0">FULL IMMERSION</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Diajar langsung oleh penutur asli bersertifikat</p>
                      <p className="text-[11px] text-slate-400 italic leading-relaxed mt-1.5">Native speaker classes are conducted fully in your target language by a certified native teacher — full immersion for authentic pronunciation and fluency.</p>
                      <p className="text-sm font-bold text-[#1A9E9E] mt-2">Mulai {fmtRp(PRIVATE_BASE_PRICE*NATIVE_MULTIPLIER)}/sesi</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 mt-1 shrink-0"/>
                  </button>
                ) : (
                  <div className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-left opacity-70 cursor-not-allowed">
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm text-slate-500">Pengajar Native</p>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full shrink-0">COMING SOON</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Pengajar native untuk {selLang} belum tersedia. Saat ini hanya English, Tagalog, Spanish & Arabic.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Pilih Level */}
          {step===3 && selProgram!=="Semi Private" && (
            <motion.div key="s3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1">
              <button onClick={()=>{ if(selProgram==="Kelas Private"){ setTeacherPick(true); } setStep(2); }} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti program</button>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-5">
                <RectFlag code={getFlagCode(selLang)} h={20}/>
                <span className="text-sm font-medium">{selLang}</span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-[#1A9E9E] font-medium">{selProgram}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{selProgram==="Kelas Kids"?"Pilih jenis kelas":"Pilih level"}</h3>
              <p className="text-sm text-slate-500 mb-6">{selProgram==="Kelas Kids"?"Sesuaikan dengan usia anak":"Mulai dari mana?"}</p>
              <div className="flex flex-col gap-3">
                {levels.map(lv=>{
                  const durationProg = selProgram==="Kelas Private" || selProgram==="Kelas Kids"; // linguo-patch:funnel-session-duration-v1
                  const active = durationProg && selLevel===lv.id;
                  return (
                  <button key={lv.id} onClick={()=>{ setSelLevel(lv.id); if(!durationProg) setStep(4); }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:border-[#1A9E9E]/40 hover:shadow-md ${active?"border-[#1A9E9E] bg-[#1A9E9E]/[0.04]":"border-slate-100"}`}>
                    <div className="h-10 w-10 rounded-full bg-[#1A9E9E]/10 flex items-center justify-center text-sm font-bold text-[#1A9E9E]">{selProgram==="Kelas Kids"?(lv.id==="Little Learner"?"LL":"YE"):lv.id}</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{lv.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{lv.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0"/>
                  </button>
                  );
                })}
              </div>

              {/* linguo-patch:funnel-session-duration-v1 — durasi + jumlah sesi + total (Private & Kids) */}
              {(selProgram==="Kelas Private" || selProgram==="Kelas Kids") && selLevel && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-6">
                  <h3 className="text-base font-bold text-slate-900 mb-1">Durasi per sesi</h3>
                  <p className="text-sm text-slate-500 mb-3">Pilih lama belajar tiap sesi</p>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {DURATION_OPTS.map(d=>(
                      <button key={d} onClick={()=>setSelDuration(d)}
                        className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${selDuration===d?"border-[#1A9E9E] bg-[#1A9E9E] text-white shadow-md":"border-slate-100 text-slate-600 hover:border-[#1A9E9E]/40"}`}>
                        {d} menit
                      </button>
                    ))}
                  </div>

                  {/* funnel-xendit-v1 — pilih jumlah sesi (paket) */}
                  <h3 className="text-base font-bold text-slate-900 mb-1">Jumlah sesi</h3>
                  <p className="text-sm text-slate-500 mb-3">Pilih paket jumlah pertemuan</p>
                  <div className="grid grid-cols-5 gap-2 mb-5">
                    {SESSION_OPTS.map(s=>(
                      <button key={s} onClick={()=>setSelSessions(s)}
                        className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${selSessions===s?"border-[#1A9E9E] bg-[#1A9E9E] text-white shadow-md":"border-slate-100 text-slate-600 hover:border-[#1A9E9E]/40"}`}>
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border-2 border-[#1A9E9E]/20 bg-[#1A9E9E]/[0.03] p-4">
                    <div className="flex items-center justify-between text-slate-500 text-xs">
                      <span>Harga / sesi ({selDuration} menit)</span>
                      <span>{fmtRp(perSession)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-xs mt-1">
                      <span>Jumlah sesi</span>
                      <span>× {selSessions}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#1A9E9E]/15 mt-2.5 pt-2.5">
                      <span className="text-sm font-semibold text-slate-700">Total tagihan</span>
                      <span className="text-xl font-extrabold text-[#1A9E9E]">{fmtRp(totalAmount)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">Bayar aman via Xendit. Jadwal diatur Admin setelah pembayaran.</p>
                  </div>
                </motion.div>
              )}

              {/* reguler-xendit-v1: harga flat ditampilkan di step level */}
              {selProgram==="Kelas Reguler" && (
                <div className="mt-4 rounded-2xl border-2 border-[#1A9E9E]/20 bg-[#1A9E9E]/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Biaya kelas</span>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 line-through mr-1.5">Rp 200.000</span>
                      <span className="text-lg font-extrabold text-[#1A9E9E]">Rp 150.000</span>
                      <span className="text-xs font-medium text-slate-400">/2 bulan</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">8 sesi grup class • 90 menit/sesi • dibuka minimal 8 peserta</p>
                </div>
              )}
              {selProgram==="Kelas Reguler" && <p className="text-xs text-slate-400 mt-4 text-center">*Kelas Reguler saat ini tersedia untuk level A1</p>}
              </div>

              {/* funnel-sticky-cta-v1 — tombol lanjut dipin di footer biar tak terpotong scroll */}
              {(selProgram==="Kelas Private" || selProgram==="Kelas Kids") && selLevel && (
                <div className="px-6 py-4 border-t border-slate-100 bg-white">
                  <button onClick={()=>setStep(4)}
                    className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">
                    Lanjut ke Data Diri →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3 (Semi Private) — Jumlah Orang + Level + Harga — linguo-patch:funnel-semi-private-calc-v1 */}
          {step===3 && selProgram==="Semi Private" && (
            <motion.div key="s3sp" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1 overflow-y-auto">
              <button onClick={()=>setStep(initialProgram ? 1 : 2)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← {initialProgram ? "Ganti bahasa" : "Ganti program"}</button>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-5">
                <RectFlag code={getFlagCode(selLang)} h={20}/>
                <span className="text-sm font-medium">{selLang}</span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-[#1A9E9E] font-medium">Semi Private</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">Berapa orang dalam grup?</h3>
              <p className="text-sm text-slate-500 mb-4">Makin banyak peserta, makin hemat per orang</p>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[2,3,4,5,6,7,8,9,10].map(n=>(
                  <button key={n} onClick={()=>setClassSize(n)}
                    className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${classSize===n?"border-[#1A9E9E] bg-[#1A9E9E] text-white shadow-md":"border-slate-100 text-slate-600 hover:border-[#1A9E9E]/40"}`}>
                    {n}
                  </button>
                ))}
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">Pilih level</h3>
              <p className="text-sm text-slate-500 mb-3">Mulai dari mana?</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {levels.map(lv=>(
                  <button key={lv.id} onClick={()=>setSelLevel(lv.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${selLevel===lv.id?"border-[#1A9E9E] bg-[#1A9E9E]/[0.04]":"border-slate-100 hover:border-[#1A9E9E]/40"}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${selLevel===lv.id?"bg-[#1A9E9E] text-white":"bg-[#1A9E9E]/10 text-[#1A9E9E]"}`}>{lv.id}</div>
                    <span className="text-xs font-bold leading-tight">{lv.label}</span>
                  </button>
                ))}
              </div>

              {/* linguo-patch:funnel-session-duration-v1 — durasi sesi (harga ikut proporsional) */}
              <h3 className="text-base font-bold text-slate-900 mb-1">Durasi per sesi</h3>
              <p className="text-sm text-slate-500 mb-3">Pilih lama belajar tiap sesi</p>
              <div className="grid grid-cols-5 gap-2 mb-5">
                {DURATION_OPTS.map(d=>(
                  <button key={d} onClick={()=>setSelDuration(d)}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${selDuration===d?"border-[#1A9E9E] bg-[#1A9E9E] text-white shadow-md":"border-slate-100 text-slate-600 hover:border-[#1A9E9E]/40"}`}>
                    {d}m
                  </button>
                ))}
              </div>

              {/* funnel-xendit-v1 — pilih jumlah sesi (paket) */}
              <h3 className="text-base font-bold text-slate-900 mb-1">Jumlah sesi</h3>
              <p className="text-sm text-slate-500 mb-3">Pilih paket jumlah pertemuan</p>
              <div className="grid grid-cols-5 gap-2 mb-5">
                {SESSION_OPTS.map(s=>(
                  <button key={s} onClick={()=>setSelSessions(s)}
                    className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${selSessions===s?"border-[#1A9E9E] bg-[#1A9E9E] text-white shadow-md":"border-slate-100 text-slate-600 hover:border-[#1A9E9E]/40"}`}>
                    {s}
                  </button>
                ))}
              </div>

              {selLevel && semiPrice && semiPrice.totalGroup>0 && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-2xl border-2 border-[#1A9E9E]/20 bg-[#1A9E9E]/[0.03] p-4 mb-5">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>Per orang / sesi ({classSize} peserta)</span>
                    <span>{fmtRp(semiPrice.perStudent)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-xs mt-1">
                    <span>Jumlah sesi</span>
                    <span>× {selSessions}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#1A9E9E]/15 mt-2.5 pt-2.5">
                    <span className="text-sm font-semibold text-slate-700">Total tagihan (kamu)</span>
                    <span className="text-xl font-extrabold text-[#1A9E9E]">{fmtRp(totalAmount)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">Harga per orang untuk grup {classSize} peserta. Tiap peserta daftar & bayar sendiri. Bayar aman via Xendit.</p>
                </motion.div>
              )}

              <button disabled={!selLevel} onClick={()=>{if(selLevel)setStep(4)}}
                className="w-full bg-[#1A9E9E] hover:bg-[#178888] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">
                {selLevel ? "Lanjut ke Data Diri →" : "Pilih level dulu"}
              </button>
            </motion.div>
          )}

          {/* STEP 4 — Form Data Diri */}
          {step===4 && (
            <motion.div key="s4" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1 overflow-y-auto">
              <button onClick={()=>setStep(3)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti level</button>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5 mb-5 text-xs">
                <RectFlag code={getFlagCode(selLang)} h={16}/>
                <span className="font-medium">{selLang}</span>
                <span className="text-slate-300">•</span>
                <span className="text-[#1A9E9E] font-medium">{selProgram}</span>
                <span className="text-slate-300">•</span>
                <span>{selLevel}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Lengkapi data diri</h3>
              <p className="text-sm text-slate-500 mb-5">Isi data di bawah agar tim kami bisa menghubungimu</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nama Lengkap</label>
                  <button onClick={handleGoogleSignIn} type="button"
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-all active:scale-[0.98] mb-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Daftar dengan Google
                </button>
                <div className="flex items-center gap-3 mb-3"><div className="flex-1 h-px bg-slate-200"></div><span className="text-xs text-slate-400">atau isi manual</span><div className="flex-1 h-px bg-slate-200"></div></div>
                <input type="text" placeholder="John Doe" value={formName} onChange={(e)=>{setFormName(e.target.value);setFormError("")}}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                  <input type="email" placeholder="john@email.com" value={formEmail} onChange={(e)=>{setFormEmail(e.target.value);setFormError("")}}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nomor WhatsApp</label>
                  <div className="flex gap-0">
                    <select value={countryCode} onChange={(e)=>setCountryCode(e.target.value)}
                      className="bg-slate-100 rounded-l-xl px-3 text-sm font-medium text-slate-600 border border-r-0 border-slate-200 focus:outline-none cursor-pointer appearance-none w-[68px] text-center">
                      {["+62","+60","+65","+66","+81","+82","+86","+91","+1","+44","+61","+49","+33","+971","+966","+7","+55","+234"].map(c=>(
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input type="tel" placeholder="812-3456-7890" value={formWa}
                      onChange={(e)=>{setFormWa(e.target.value.replace(/[^0-9]/g,"").replace(/^0/,""));setFormError("")}}
                      className="flex-1 px-4 py-3 rounded-r-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20"/>
                  </div>
                </div>
                {/* referral-code-field-v1 — optional, muncul di semua program (step data diri shared) */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Kode Referral (opsional)</label>
                  <input type="text" placeholder="Masukkan kode referral jika ada" value={refCode}
                    onChange={(e)=>setRefCode(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E]"/>
                  <p className="text-xs text-slate-400 mt-1">Dapatkan dari teman atau afiliator Linguo</p>
                </div>
              </div>
              {formError && <p className="text-red-500 text-xs mt-2">{formError}</p>}
              <button onClick={()=>{if(validateForm()) setStep(5)}}
                className="w-full mt-5 bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">
                Lanjut ke Konfirmasi →
              </button>
            </motion.div>
          )}

          {/* STEP 5 — Konfirmasi & Daftar */}
          {step===5 && (
            <motion.div key="s5" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1 min-h-0 overflow-y-auto">
              <button onClick={()=>setStep(4)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Edit data</button>
              <div className="text-center mb-5">
                <h3 className="text-xl font-bold text-slate-900">Konfirmasi Pendaftaran</h3>
                <p className="text-sm text-slate-500 mt-1">Pastikan data di bawah sudah benar</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 mb-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Nama</span>
                  <span className="text-sm font-medium">{formName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Email</span>
                  <span className="text-sm font-medium">{formEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">WhatsApp</span>
                  <span className="text-sm font-medium">{countryCode}{formWa}</span>
                </div>
                <div className="border-t border-slate-200 pt-2.5 mt-2.5"/>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Bahasa</span>
                  <span className="text-sm font-medium flex items-center gap-2">
                    <RectFlag code={getFlagCode(selLang)} h={16}/>{selLang}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Program</span>
                  <span className="text-sm font-medium text-[#1A9E9E]">{selProgram}</span>
                </div>
                {selProgram==="Kelas Private" && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Pengajar</span>
                    <span className="text-sm font-medium">{selTeacherType==="native"?"Native Speaker":"Lokal"}</span>
                  </div>
                )}
                {selProgram==="Semi Private" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Jumlah peserta</span>
                      <span className="text-sm font-medium">{classSize} orang</span>
                    </div>
                    {semiPrice && semiPrice.totalGroup>0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Estimasi / orang</span>
                        <span className="text-sm font-bold text-[#1A9E9E]">{fmtRp(semiPrice.perStudent)}/sesi</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Level</span>
                  <span className="text-sm font-medium">{selLevel}</span>
                </div>
                {/* linguo-patch:funnel-session-duration-v1 — tampilkan durasi sesi terpilih */}
                {isSessionProg && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Durasi / sesi</span>
                    <span className="text-sm font-medium">{selDuration} menit</span>
                  </div>
                )}
                {/* funnel-xendit-v1 — jumlah sesi (paket) */}
                {isSessionProg && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Jumlah sesi</span>
                    <span className="text-sm font-medium">{selSessions} sesi</span>
                  </div>
                )}
                {/* funnel-xendit-v1 — total tagihan (Private/Semi/Kids/IELTS; Reguler punya blok sendiri) */}
                {selProgram!=="Kelas Reguler" && (
                  <div className="flex items-center justify-between border-t-2 border-slate-200 pt-2.5 mt-2.5">
                    <span className="text-sm font-bold text-slate-800">Total tagihan{selProgram==="Semi Private" ? " (kamu)" : ""}</span>
                    <span className="text-base font-extrabold text-[#1A9E9E]">{fmtRp(totalAmount)}</span>
                  </div>
                )}
                {/* reguler-xendit-v1: durasi + harga · addon-ebook-recording-v1: toggle add-on + total live */}
                {selProgram==="Kelas Reguler" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Durasi</span>
                      <span className="text-sm font-medium">8 sesi @ 90 menit</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 mt-2.5">
                      <span className="text-xs text-slate-500">Biaya kelas</span>
                      <span className="text-sm font-medium">Rp 150.000 <span className="font-normal text-slate-400">/2 bulan</span></span>
                    </div>
                    {/* addon-ebook-recording-v1: cross-sell toggle (Reguler only) */}
                    <button type="button" onClick={()=>setAddAddon(v=>!v)}
                      className="w-full flex items-center justify-between gap-3 border-t border-slate-200 pt-3 mt-1 text-left group">
                      <span className="flex items-start gap-2.5">
                        <span className={"mt-0.5 h-[18px] w-[18px] shrink-0 rounded-md border-2 flex items-center justify-center transition-all " + (addAddon ? "border-[#1A9E9E] bg-[#1A9E9E]" : "border-slate-300 group-hover:border-[#1A9E9E]/50")}>
                          {addAddon && <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd"/></svg>}
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-slate-700">Tambah E-Book + Recording Kelas</span>
                          <span className="block text-[11px] text-slate-400 leading-snug mt-0.5">Materi lengkap + rekaman semua sesi · akses selamanya</span>
                        </span>
                      </span>
                      <span className={"text-sm font-semibold whitespace-nowrap transition-colors " + (addAddon ? "text-[#1A9E9E]" : "text-slate-400")}>+Rp150.000</span>
                    </button>
                    <div className="flex items-center justify-between border-t-2 border-slate-200 pt-3 mt-1">
                      <span className="text-sm font-bold text-slate-800">Total</span>
                      <span className="text-base font-extrabold text-[#1A9E9E]">{fmtRp(150000 + (addAddon ? 150000 : 0))}</span>
                    </div>
                    {/* reguler-policy-v1: min-peserta + kebijakan refund bersyarat */}
                    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-3 space-y-1.5">
                      <p className="text-[11px] leading-relaxed text-amber-900">
                        <b>Syarat pembukaan kelas:</b> Kelas Reguler dibuka jika minimal <b>8 peserta</b> terkumpul. Jika kuota belum tercapai, kamu akan ditawari batch berikutnya atau <b>refund penuh</b>.
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-900">
                        <b>Kebijakan pembayaran:</b> Setelah kelas berjalan, pembayaran tidak dapat di-refund. Namun saldo bisa dialihkan ke Kelas Private atau produk lain.
                      </p>
                    </div>
                  </>
                )}
              </div>
              {/* terms-agreement-v1: checkbox persetujuan sebelum Bayar (Reguler only) */}
              {selProgram==="Kelas Reguler" && (
                <button type="button" onClick={()=>setAgreeTerms(v=>!v)} className="w-full flex items-start gap-2.5 mb-3 text-left group">
                  <span className={"mt-0.5 h-[18px] w-[18px] shrink-0 rounded-md border-2 flex items-center justify-center transition-all " + (agreeTerms ? "border-[#1A9E9E] bg-[#1A9E9E]" : "border-slate-300 group-hover:border-[#1A9E9E]/50")}>
                    {agreeTerms && <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd"/></svg>}
                  </span>
                  <span className="text-[12px] leading-snug text-slate-500">Dengan ini saya menyetujui <b className="text-slate-700">syarat pembukaan kelas & kebijakan pembayaran</b> Linguo yang tertera di atas.</span>
                </button>
              )}
              {formError && <p className="text-red-500 text-xs mb-2 text-center">{formError}</p>}
              {/* funnel-xendit-v1: semua program checkout ke Xendit */}
              <button onClick={handleFinal} disabled={saving || (selProgram==="Kelas Reguler" && !agreeTerms)}
                className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg">
                {saving ? "Memproses..." : (selProgram==="Kelas Reguler" ? `Bayar ${fmtRp(150000 + (addAddon ? 150000 : 0))} →` : `Bayar ${fmtRp(totalAmount)} →`)}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-3">Kamu akan diarahkan ke halaman pembayaran Xendit yang aman</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
  );
}

function HeroFunnel({lang, onLoginOpen}:{lang:string; onLoginOpen?:()=>void}) {
  const [funnelOpen, setFunnelOpen] = useState(false);
  const [funnelProg, setFunnelProg] = useState("");
  const [funnelLang, setFunnelLang] = useState("");
  const [funnelLevel, setFunnelLevel] = useState("");
  const [funnelPreferredProg, setFunnelPreferredProg] = useState("");
  const [funnelPrefillName, setFunnelPrefillName] = useState("");
  const [funnelPrefillWa, setFunnelPrefillWa] = useState("");
  const [funnelSource, setFunnelSource] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("openFunnel") === "1") {
      const lang = params.get("lang") || "";
      const level = params.get("level") || "";
      const from = params.get("from") || "";
      window.history.replaceState({}, "", window.location.pathname);
      if (lang) {
        setFunnelLang(lang); setFunnelLevel(level);
        setFunnelPreferredProg("Kelas Private");
        setFunnelSource(from); setFunnelProg("");
        setFunnelOpen(true);
      }
    }
  }, []);

  if(typeof window!=="undefined")(window as any).__openFunnel=(input:string|{language?:string;program?:string;preferredProgram?:string;level?:string;source?:string;prefillName?:string;prefillWa?:string})=>{
      if(typeof input==="string"){setFunnelProg(input);setFunnelLang("");setFunnelLevel("");setFunnelPreferredProg("");setFunnelSource("");setFunnelPrefillName("");setFunnelPrefillWa("");
        if(typeof window!=="undefined"&&(window as any).gtag)(window as any).gtag("event","funnel_opened",{program:input});
      }
      else{
        setFunnelProg(input.program||"");
        setFunnelLang(input.language||"");
        setFunnelLevel(input.level||"");
        setFunnelPreferredProg(input.preferredProgram||"");
        setFunnelSource(input.source||"");
        setFunnelPrefillName(input.prefillName||"");
        setFunnelPrefillWa(input.prefillWa||"");
      }
      setFunnelOpen(true);
    };
  const [waNumber, setWaNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  const [error, setError] = useState("");

  const quickSavingRef = React.useRef(false);
  const handleQuickSubmit = async () => {
    if(quickSavingRef.current) return; // wa-quick-guard-v1: anti double-fire
    if(!waNumber) { setError("Masukkan nomor WhatsApp-mu"); return; }
    if(waNumber.length < 9) { setError("Nomor terlalu pendek, minimal 9 digit"); return; }
    if(waNumber.length > 15) { setError("Nomor terlalu panjang"); return; }
    if(countryCode==="+62" && !["8"].includes(waNumber[0])) { setError("Nomor Indonesia harus diawali angka 8 (contoh: 812...)"); return; }
    setError("");
    const fullNum = countryCode.replace("+","") + waNumber;
    quickSavingRef.current = true; // wa-quick-guard-v1
    await saveLead({wa_number: fullNum, source: "wa-quick"});
    const msg = `Halo, saya tertarik kursus di Linguo. Nomor WA saya: ${countryCode}${waNumber}`;
    window.location.href = `https://wa.me/6282116859493?text=${encodeURIComponent(msg)}`;
  };

  return (
    <>
      <div className="max-w-lg">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <span className="text-white text-sm sm:text-lg font-semibold">{lang==="id"?"Aku mau belajar bahasa":"I want to learn"}</span>
          <button onClick={()=>setFunnelOpen(true)}
            className="group h-9 sm:h-11 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center gap-0 hover:gap-2 px-3 hover:px-5 hover:bg-white/30 transition-all duration-300 active:scale-95 overflow-hidden">
            <Globe className="h-5 w-5 text-white shrink-0"/>
            <span className="text-white text-sm font-medium max-w-0 group-hover:max-w-[120px] overflow-hidden whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100">Pilih Bahasa</span>
          </button>
        </div>
        {/* Inline WA input — compact */}
        <p className="text-white/70 text-xs mb-1.5">{lang==="id"?"Diskon spesial, masukkan nomor HP sekarang":"Special discount, enter your number now"}</p>
        <div className="bg-white rounded-full flex items-center w-full max-w-full sm:max-w-sm shadow-lg overflow-hidden">
          <select value={countryCode} onChange={(e)=>setCountryCode(e.target.value)}
            className="bg-transparent pl-3 pr-0 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer appearance-none w-[52px] sm:w-auto shrink-0">
            {["+62","+60","+65","+66","+81","+82","+86","+91","+1","+44","+61","+49","+33","+971","+966","+7","+55","+234"].map(c=>(
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="tel" placeholder="812 3456 7890" value={waNumber}
            onChange={(e)=>{const v=e.target.value.replace(/[^0-9]/g,"");setWaNumber(v.startsWith("0")?v.slice(1):v);setError("")}}
            className="flex-1 min-w-0 w-full px-1 sm:px-2 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
            onKeyDown={(e)=>e.key==='Enter'&&handleQuickSubmit()} required />
          <button onClick={handleQuickSubmit}
            className="group no-cta-zoom bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-2 sm:px-4 py-2 text-[10px] sm:text-xs transition-colors active:scale-95 whitespace-nowrap rounded-full m-1 shrink-0 inline-flex items-center gap-1">
            <span className="hidden sm:inline">Dapatkan Diskon</span><span className="sm:hidden">Diskon</span>
            <span className="arrow-loop inline-block">→</span>
          </button>
        </div>
        {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
        <p className="text-white/50 text-xs mt-3">{lang==="id"?"Gratis konsultasi pertama via WhatsApp":"Free first consultation via WhatsApp"}</p>
      </div>
      <FunnelModal open={funnelOpen} onClose={()=>setFunnelOpen(false)} initialProgram={funnelProg} initialLang={funnelLang} initialLevel={funnelLevel} initialPreferredProg={funnelPreferredProg} initialSource={funnelSource} initialName={funnelPrefillName} initialWa={funnelPrefillWa}/>
    </>
  );
}

function TeacherGrid() {
  const [selected, setSelected] = useState<number|null>(null);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
      {TEACHER_DATA.map((t,i)=>(
        <motion.div key={i} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.08}}>
          <div onClick={()=>setSelected(selected===i?null:i)}
            className={`bg-white rounded-2xl border-2 p-5 transition-all cursor-pointer ${selected===i?"border-[#1A9E9E] shadow-lg":"border-transparent hover:border-slate-200 hover:shadow-md"}`}>
            <div className="relative h-20 w-20 mx-auto mb-3">
              <Image src={t.img} alt={t.name} fill loading="lazy" sizes="80px" className="rounded-full object-cover"/>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex">
                <img src={`https://flagcdn.com/w40/${t.f1}.png`} alt="" loading="lazy" decoding="async" className="h-5 w-5 rounded-full object-cover border-2 border-white -mr-1 relative z-10"/>
                <img src={`https://flagcdn.com/w40/${t.f2}.png`} alt="" loading="lazy" decoding="async" className="h-5 w-5 rounded-full object-cover border-2 border-white"/>
              </div>
            </div>
            <p className="font-semibold text-sm">{t.name}</p>
            <p className="text-xs text-slate-400 mb-2">{t.role}</p>
            {/* italki-style stats */}
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="flex items-center gap-0.5 text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400"/>{t.rating}
              </span>
              <span className="text-xs text-slate-400">{t.lessons.toLocaleString()} sesi</span>
            </div>
            {/* Subtle hint to click for bio */}
            <p className="text-[10px] text-slate-300 text-center mt-2 italic">
              {selected===i ? "Klik untuk tutup" : "Klik untuk lihat bio"}
            </p>
          </div>
          <AnimatePresence>{selected===i&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
              <div className="bg-white rounded-b-2xl border-2 border-t-0 border-[#1A9E9E] px-5 py-4 -mt-3 text-left">
                <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-wider mb-1">{t.role}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{t.bio}</p>
              </div>
            </motion.div>
          )}</AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

const PRODUCTS = [
  // linguo-patch:private-pricing-v1 — harga Private bervariasi per bahasa (Rp90rb–
  // 120rb+/sesi). Homepage tidak tahu bahasa, jadi tampilkan "Mulai" + hapus
  // framing "diskon 10% dari Rp100.000" yg tidak akurat utk harga variabel.
  {badgeIcon:<svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 inline-block mr-1"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>,badgeLabel:"Paling Diminati",badgeColor:"bg-[#1A9E9E] text-white",title:"Kelas Private",desc:"Belajar 1-on-1 via Zoom, request jadwal & topik sesukamu",priceOld:null,price:"Mulai Rp 90.000",per:"/sesi",discount:null,tab:0,bgColor:"#E0F7F7",imageEmoji:"",img1:"/images/programs/private-1.jpg",img2:"/images/programs/private-2.jpg"},
  {badgeIcon:<svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 inline-block mr-1"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,badgeLabel:"Terjangkau",badgeColor:"bg-blue-500 text-white",title:"Kelas Reguler",desc:"Grup class dengan jadwal tetap, cocok untuk belajar bareng",priceOld:"Rp 200.000",price:"Rp 150.000",per:"/2 bulan",discount:"25%",tab:1,bgColor:"#E8F0FE",imageEmoji:"",img1:"/images/programs/reguler-1.jpg",img2:"/images/programs/reguler-2.jpg"},
  {badgeIcon:<svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 inline-block mr-1"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>,badgeLabel:"Intensif",badgeColor:"bg-amber-500 text-white",title:"IELTS / TOEFL",desc:"16 sesi @90 menit, persiapan tes bahasa Inggris terlengkap",priceOld:"Rp 400.000",price:"Rp 300.000",per:"/2 bulan",discount:"25%",tab:2,bgColor:"#FFF8E1",imageEmoji:"",img1:"/images/programs/ielts-1.jpg",img2:"/images/programs/ielts-2.jpg"},
  {badgeIcon:<Sparkles className="w-3 h-3 inline-block mr-1"/>,badgeLabel:"Lifetime",badgeColor:"bg-indigo-500 text-white",title:"Simulasi TOEFL/IELTS",desc:"Latihan tes lengkap 4 skill: Reading, Listening, Writing, Speaking",priceOld:null,price:"Rp 79.000",per:"",discount:null,tab:-1,href:"/simulasi",bgColor:"#EEF2FF",imageEmoji:"",img1:"/images/programs/ielts-1.jpg",img2:"/images/programs/ielts-2.jpg"},
  {badgeIcon:<svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 inline-block mr-1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>,badgeLabel:"Anak 5-12 thn",badgeColor:"bg-pink-500 text-white",title:"Kelas Kids",desc:"Belajar bahasa 1-on-1 untuk anak, fun & interaktif",priceOld:null,price:"Rp 75.000",per:"/sesi",discount:null,tab:3,bgColor:"#FCE4EC",imageEmoji:"",img1:"/images/programs/kids-1.jpg",img2:"/images/programs/kids-2.jpg"},
  {badgeIcon:<svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 inline-block mr-1"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>,badgeLabel:"Belajar Mandiri",badgeColor:"bg-purple-500 text-white",title:"E-Learning",desc:"Akses materi interaktif kapan saja, belajar sesuai tempo sendiri",priceOld:null,price:"Rp 29.000",per:"",discount:null,tab:-1,href:"/produk",bgColor:"#F3E8FD",imageEmoji:"",img1:"/images/programs/elearning-1.jpg",img2:"/images/programs/elearning-2.jpg"},
  {badgeIcon:<svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 inline-block mr-1"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V6h10v2z"/></svg>,badgeLabel:"Digital",badgeColor:"bg-rose-500 text-white",title:"E-Book",desc:"Buku digital lengkap untuk belajar mandiri di mana saja",priceOld:null,price:"Rp 29.000",per:"",discount:null,tab:-1,href:"/produk/ebook",bgColor:"#FFEBEE",imageEmoji:"",img1:"/images/programs/ebook-1.jpg",img2:"/images/programs/ebook-2.jpg"},
];

function ProductDock({setPricingTab,onSelectProgram}:{setPricingTab:(t:number)=>void;onSelectProgram:(prog:string)=>void}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Mobile: compact 2-column grid (Ruangguru-style). product-dock-mobile-grid-v1
  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 py-4 items-stretch">
        {PRODUCTS.map((p,i)=>(
          <DockCard key={i} product={p} mobile setPricingTab={setPricingTab} onSelectProgram={onSelectProgram}/>
        ))}
      </div>
    );
  }

  // Desktop: grid melebar penuh (ala mega-menu), bukan baris flex di tengah.
  return (
    <div className="grid grid-cols-4 gap-4 xl:gap-5 py-6 items-stretch">
      {PRODUCTS.map((p,i)=>(
        <DockCard key={i} product={p} setPricingTab={setPricingTab} onSelectProgram={onSelectProgram}/>
      ))}
    </div>
  );
}

function DockCard({product:p,mobile,setPricingTab,onSelectProgram}:{product:typeof PRODUCTS[0];mobile?:boolean;setPricingTab:(t:number)=>void;onSelectProgram:(prog:string)=>void}) {
  const card = p as typeof p & { img1?: string; img2?: string };
  const sizeCls = mobile ? "w-full h-full rounded-xl" : "w-full h-full rounded-3xl";
  const objPos = "object-center";

  const handleClick = () => {
    if(p.tab>=0){(window as any).__openFunnel?.(["Kelas Private","Kelas Reguler","IELTS/TOEFL Prep","Kelas Kids"][p.tab]||"")}
    else if((p).href){window.location.href=(p).href}
    else{window.open(`https://wa.me/6282116859493?text=Halo, saya tertarik ${p.title} Linguo`,'_blank')}
  };

  const priceMulai = p.price.startsWith("Mulai ");
  const priceMain = priceMulai ? p.price.slice(6) : p.price;

  const priceBlock = (
    <div className="flex flex-col min-w-0">
      {p.priceOld && (
        <div className="flex items-center gap-1 mb-0.5">
          <span className={`${mobile?"text-xs":"text-[9px] lg:text-[10px]"} text-slate-400 line-through`}>{p.priceOld}</span>
          {p.discount && <span className={`${mobile?"text-xs":"text-[8px] lg:text-[9px]"} font-bold text-red-500 bg-red-50 px-1 py-0.5 rounded`}>{p.discount}</span>}
        </div>
      )}
      {priceMulai && <span className={`${mobile?"text-xs text-slate-500":"text-[10px] text-slate-400"} leading-none`}>Mulai</span>}
      <div className="flex items-baseline gap-0.5">
        <span className="text-sm lg:text-base font-bold text-slate-900 whitespace-nowrap">{priceMain}</span>
        {p.per && <span className={`${mobile?"text-xs":"text-[10px]"} text-slate-400`}>{p.per}</span>}
      </div>
    </div>
  );

  return (
    <div onClick={handleClick}
      className={`group relative flex flex-col bg-gradient-to-b from-white to-slate-50/80 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(26,158,158,0.15)] transition-all duration-300 cursor-pointer overflow-hidden p-3 ${sizeCls}`}>
      {/* Image zone (inset from card edges): hover-swap img1/img2, else bgColor + emoji */}
      <div className={`relative overflow-hidden w-full mb-0 ${mobile ? "h-[130px] rounded-lg" : "h-52 lg:h-56 rounded-2xl"}`} style={{backgroundColor:p.bgColor}}>
        {card.img1 ? (
          <>
            <Image src={card.img1} alt={p.title} fill loading="lazy" sizes="(min-width: 1024px) 300px, 50vw" className={`object-cover ${objPos} transition-opacity duration-300 group-hover:opacity-0`} />
            <Image src={card.img2 || card.img1} alt="" aria-hidden fill loading="lazy" sizes="(min-width: 1024px) 300px, 50vw" className={`object-cover ${objPos} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">{p.imageEmoji}</span></div>
        )}
        {/* Badge overlaid on image */}
        <span className={`absolute top-2 left-2 lg:top-3 lg:left-3 z-10 inline-flex items-center gap-1 ${mobile?"text-xs px-2 py-0.5":"text-[9px] lg:text-[10px] px-2.5 py-1"} font-bold rounded-full whitespace-nowrap ${p.badgeColor}`}>{p.badgeIcon}{p.badgeLabel}</span>
        {/* Frosted bottom blend into info panel */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/60 to-transparent" />
      </div>

      {/* Info panel below image */}
      <div className="pt-3 pb-1 flex flex-col flex-1">
        <h3 className="font-bold text-sm lg:text-[15px] text-slate-900 mb-0.5">{p.title}</h3>
        <p className={`${mobile?"text-xs":"text-[10px] lg:text-xs"} text-slate-400 leading-snug mb-3 line-clamp-2`}>{p.desc}</p>
        {mobile ? (
          /* Mobile: stack price above a full-width button — never overlap. product-dock-mobile-stack-v1 */
          <div className="flex flex-col gap-2 mt-auto">
            {priceBlock}
            <button onClick={(e)=>{e.stopPropagation(); handleClick();}}
              className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors active:scale-95">
              Beli →
            </button>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-2">
            {priceBlock}
            <button onClick={(e)=>{e.stopPropagation(); handleClick();}}
              className="shrink-0 bg-[#1A9E9E] hover:bg-[#178888] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors active:scale-95 whitespace-nowrap">
              Beli →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== LANGUAGE FLAG STRIP ==========
// Flag codes resolved via getFlagCode(name) — see FLAG_CODES map above.
const LANGUAGES = [
  "English","Japanese","Korean","Mandarin","Arabic","French","German","Spanish",
  "Italian","Dutch","Portuguese","Russian","Polish","Swedish","Norwegian","Danish",
  "Finnish","Greek","Czech","Hungarian","Romanian","Thai","Vietnamese","Hindi",
  "Turkish","Hebrew","Persian","Tagalog","Malay","Swahili","Javanese","Sundanese",
  "Betawi","BIPA","Georgian","Urdu","Bengali",
];

function LanguageStrip({className=""}:{className?:string}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const el = scrollRef.current;
    if (!el) return;
    // Cache the scroll bound (a layout read) and refresh it only on resize,
    // so the per-frame loop touches scrollLeft only — no forced reflow.
    let maxScroll = el.scrollWidth - el.clientWidth - 1;
    const recalc = () => { maxScroll = el.scrollWidth - el.clientWidth - 1; };
    window.addEventListener("resize", recalc, { passive: true });

    let raf = 0;
    let prev = 0;
    const tick = (t: number) => {
      // Keep the original ~1px/30ms cadence regardless of refresh rate.
      if (t - prev >= 30) {
        prev = t;
        el.scrollLeft = el.scrollLeft >= maxScroll ? 0 : el.scrollLeft + 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recalc);
    };
  }, [paused]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className={`relative max-w-5xl mx-auto ${className}`}>
      {/* Edge fades (white to match card bg) */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-[5]" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-[5]" />

      {/* Prev button */}
      <button onClick={() => scrollBy(-300)} aria-label="Sebelumnya"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors">
        <ChevronLeft className="w-4 h-4 text-[#1A9E9E]" />
      </button>

      {/* Scroll track */}
      <div ref={scrollRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="overflow-x-hidden flex items-center gap-6 lg:gap-10 py-4 px-2">
        {LANGUAGES.map((lang, i) => (
          <div key={i}
            onClick={() => (window as any).__openFunnel?.({ program: "Kelas Private", language: lang })}
            className="flex items-center gap-2.5 shrink-0 transition-transform duration-150 ease-out hover:-translate-y-2 cursor-pointer">
            <RectFlag code={getFlagCode(lang)} h={28} className="shadow-sm" />
            <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">{lang}</p>
          </div>
        ))}
      </div>

      {/* Next button */}
      <button onClick={() => scrollBy(300)} aria-label="Berikutnya"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors">
        <ChevronRight className="w-4 h-4 text-[#1A9E9E]" />
      </button>
    </div>
  );
}

// FLAT_PRICING_V1
const PRICING_TABS = [
  {
    // linguo-patch:private-pricing-v1 — harga Private variabel per bahasa & level.
    // Angka di bawah = harga terendah (bahasa daerah, level A1) → diberi "Mulai".
    id:"private",label:"Kelas Private",desc:"Fleksibel, personal, dan efektif. 1-on-1 via Zoom. Harga mulai Rp90.000/sesi — bervariasi per bahasa & level (bahasa lain Rp100rb–120rb/sesi).",
    plans:[
      {name:"Per Sesi",desc:"Coba dulu 1 sesi",price:"Mulai Rp 90.000",highlighted:true,badge:"Recommended"},
      {name:"5 Sesi",desc:"5× sesi 60 menit",price:"Mulai Rp 450.000",highlighted:false},
      {name:"10 Sesi",desc:"10× sesi 60 menit",price:"Mulai Rp 900.000",highlighted:false},
      {name:"20 Sesi",desc:"20× sesi 60 menit",price:"Mulai Rp 1.800.000",highlighted:false},
    ],
    features:["Recording Class/sesi","Interactive Class via ZOOM","Soft file Materi Pembelajaran","Request Jadwal & Topik","Qualified Teacher","E-Certificate","Bebas Pilih 55+ Bahasa"],
    allCheck:true,wa:"Kelas Private",
  },
  {
    id:"reguler",label:"Kelas Reguler",desc:"Grup class, jadwal tetap, harga terjangkau.",
    plans:[
      {name:"2 Bulan",desc:"8 sesi grup class",price:"Rp 150.000",highlighted:true,badge:"AFFORDABLE"},
    ],
    features:["Recording Class/sesi","Interactive Class via ZOOM","Soft file Materi Pembelajaran","Jadwal Tetap (tidak bisa request)","Qualified Teacher","E-Certificate","Bahasa Terbatas (pilihan populer)"],
    checks:[[true],[true],[true],[true],[true],[true],[true]],
    wa:"Kelas Reguler",
  },
  {
    id:"ielts",label:"IELTS / TOEFL",desc:"Persiapan tes bahasa Inggris intensif.",
    plans:[
      {name:"2 Bulan",desc:"16 sesi @90 menit",price:"Rp 300.000",highlighted:true,badge:"INTENSIVE"},
    ],
    features:["Recording Class/sesi","Interactive Class via ZOOM","Soft file Materi Pembelajaran","Jadwal Tetap (batch system)","Qualified IELTS/TOEFL Tutor","E-Certificate","Mock Test & Feedback"],
    checks:[[true],[true],[true],[true],[true],[true],[true]],
    wa:"IELTS TOEFL Prep",
  },
  {
    id:"kids",label:"Kelas Kids",desc:"Belajar bahasa untuk anak usia 5–12 tahun. Fun, interaktif, 1-on-1.",
    plans:[
      {name:"Little Learner",desc:"30 menit • usia 5-8 thn",price:"Rp 75.000",highlighted:true,badge:"USIA 5-8"},
      {name:"Young Explorer",desc:"45 menit • usia 9-12 thn",price:"Rp 85.000",highlighted:false,badge:"USIA 9-12"},
    ],
    features:["Recording Class/sesi","Interactive Class via ZOOM","Materi Fun & Gamified","Request Jadwal","Qualified Kids Teacher","E-Certificate","55+ Bahasa Tersedia","Progress Report untuk Orang Tua"],
    allCheck:true,
    wa:"Kelas Kids",
  },
];

function PricingSection({tab,setTab,onGetStarted}:{tab:number;setTab:(t:number)=>void;onGetStarted:(program:string)=>void}) {
  const t = PRICING_TABS[tab];
  return (
    <section id="produk" className="py-12 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-heading text-xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight">Choose a learning plan<br/>that speaks to you</h2>
        <p className="text-slate-500 text-sm sm:text-base mb-6 sm:mb-10">Mulai perjalanan bahasamu sekarang.</p>

        {/* Tabs */}
        <div className="grid grid-cols-2 sm:inline-flex sm:flex-row gap-1 sm:gap-0 bg-slate-100 rounded-2xl sm:rounded-full p-1 sm:p-1.5 mb-6 sm:mb-12 max-w-full mx-auto">
          {PRICING_TABS.map((pt,i)=>(
            <button key={pt.id} onClick={()=>setTab(i)}
              className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${tab===i?"bg-[#1A9E9E] text-white shadow-lg shadow-[#1A9E9E]/25":"text-slate-500 hover:text-slate-700"}`}>
              {pt.label}
            </button>
          ))}
        </div>

        <p className="text-slate-500 text-xs sm:text-sm mb-6 sm:mb-10 px-2">{t.desc}</p>

        {/* Cards layout for plans */}
        <div className={`flex justify-center gap-3 sm:gap-5 flex-wrap mb-6`}>
          {t.plans.map((p,pi)=>(
            <div key={pi} className={`relative w-[150px] sm:w-[220px] rounded-2xl border-2 p-4 sm:p-6 text-center transition-all duration-300 ${p.highlighted?"border-[#1A9E9E] shadow-xl bg-white scale-[1.03]":"border-slate-200 bg-white hover:border-slate-300"}`}>
              {p.badge&&<span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${p.badge==="BEST VALUE"?"bg-[#fbbf24] text-slate-900":"bg-[#1A9E9E] text-white"}`}>{p.badge}</span>}
              <p className="font-bold text-sm sm:text-lg mt-2">{p.name}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-1 mb-3 sm:mb-4">{p.desc}</p>
              <p className={`text-lg sm:text-2xl font-bold mb-3 sm:mb-5 ${p.highlighted?"text-[#1A9E9E]":"text-slate-900"}`}>{p.price}</p>
              <button onClick={()=>onGetStarted(t.label)}
                className={`inline-block w-full px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 ${p.highlighted?"bg-[#1A9E9E] text-white hover:bg-[#178888] shadow-lg shadow-[#1A9E9E]/25":"border-2 border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E] hover:text-white"}`}>
                Get Started
              </button>
            </div>
          ))}
        </div>

        {/* Feature list */}
        <div className="max-w-md mx-auto mt-8 sm:mt-10 text-left px-2">
          {t.features.map((f,fi)=>(
            <div key={fi} className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 border-b border-slate-100 last:border-0">
              <Check className="h-4 w-4 text-[#1A9E9E] shrink-0"/>
              <span className="text-xs sm:text-sm text-slate-600">{f}</span>
            </div>
          ))}
        </div>

        {/* Digital Products */}
        <div id="digital" className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-slate-100">
          <p className="text-[10px] sm:text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">BELAJAR MANDIRI</p>
          <h3 className="text-base sm:text-xl font-bold mb-4 sm:mb-6">Mau belajar sendiri dulu?</h3>
          <div className="flex justify-center gap-3 sm:gap-5 flex-wrap">
            {[
              {name:"E-Learning",desc:"Akses materi interaktif kapan saja",price:"Rp 29.000"},
              {name:"E-Book",desc:"Buku digital lengkap untuk belajar mandiri",price:"Rp 29.000"},
            ].map((d,i)=>(
              <div key={i} className="w-[160px] sm:w-[260px] bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 text-center hover:border-[#1A9E9E]/40 hover:shadow-md transition-all">
                <p className="font-bold text-sm sm:text-base">{d.name}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1 mb-2 sm:mb-3">{d.desc}</p>
                <p className="text-base sm:text-xl font-bold text-[#1A9E9E] mb-3 sm:mb-4">{d.price}</p>
                <a href={(d as any).href || "/produk"}
                  className="inline-block w-full border-2 border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E] hover:text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95">
                  Beli Sekarang
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [st, setSt] = useState(false);
  const [lang, setLang] = useState("id");
  const [pricingTab, setPricingTab] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  useEffect(()=>{
    window.scrollTo(0,0);
    let ticking=false;
    const fn=()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{setSt(window.scrollY>400);ticking=false;});};
    window.addEventListener("scroll",fn,{passive:true});
    // Save referral param
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("linguo_ref", ref);
    return()=>window.removeEventListener("scroll",fn);
  },[]);

  return (<>
    <Navbar lang={lang} setLang={setLang} onPricingTab={setPricingTab} onLoginOpen={()=>setLoginOpen(true)}/>
    <LoginModal open={loginOpen} onClose={()=>setLoginOpen(false)} />

    {/* HERO */}
    <section className="bg-[#1A9E9E] lg:min-h-screen flex items-center relative overflow-hidden pt-20 lg:pt-32 pb-6 lg:pb-0">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-[1fr_1.3fr] gap-4 items-center py-4 lg:py-0">
        <motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:0.7}}>
          <div className="flex items-start gap-3 lg:block mb-4 lg:mb-0">
            <div className="flex-1">
              <h1 className="font-heading text-[1.6rem] sm:text-4xl lg:text-[3.8rem] font-extrabold text-white leading-[1.1] mb-4 lg:mb-8">
                Everyone Can<br/>Be a Polyglot
              </h1>
            </div>
            <div className="lg:hidden shrink-0 relative translate-x-2 sm:translate-x-3">
              <Image src="/images/hero-character.png" alt="" width={176} height={142} priority sizes="(min-width: 1024px) 0px, 176px" className="w-40 sm:w-48 h-auto drop-shadow-xl"/>
              <motion.div animate={{y:[0,-5,0]}} transition={{duration:3,repeat:Infinity}} className="absolute -top-6 -left-1 sm:-top-8 sm:-left-2">
                <div className="relative bg-white rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg">
                  <TypingBubble size="sm"/>
                  <div className="absolute -bottom-1 right-3 w-2.5 h-2.5 bg-white rotate-45"/>
                </div>
              </motion.div>
            </div>
          </div>
          <HeroFunnel lang={lang} onLoginOpen={()=>setLoginOpen(true)}/>
          <Image src="/images/google-review.png" alt="Google Reviews 5.0/5" width={146} height={31} sizes="146px" className="h-7 sm:h-8 w-auto mt-4 sm:mt-6 opacity-90"/>
          
        </motion.div>
        <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{delay:0.3}} className="hidden lg:flex justify-end relative -mr-28">
          <div className="relative w-[810px] h-[810px]">
            <Image src="/images/hero-character.png" alt="Learn languages with Linguo" width={810} height={656} priority sizes="(min-width: 1024px) 810px, 0px" className="w-full h-full object-contain drop-shadow-2xl" />
            <div className="absolute top-16 left-[27%]">
              <motion.div animate={{y:[0,-8,0]}} transition={{duration:3,repeat:Infinity}}>
                <div className="relative bg-white rounded-2xl px-7 py-4 shadow-xl">
                  <TypingBubble/>
                  <div className="absolute -bottom-2 right-12 w-4 h-4 bg-white rotate-45 shadow-xl"/>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    {/* LANGUAGE FLAG STRIP — flat white, seamless */}
    <Reveal>
    <section className="bg-white pt-8 pb-2">
      <h2 className="font-heading text-xl sm:text-2xl font-bold text-center mb-4">Tersedia <span className="text-[#1A9E9E]">60+ Bahasa</span></h2>
      <div className="bg-white mx-6 lg:mx-12 overflow-hidden"><LanguageStrip /></div>
    </section>
    </Reveal>

    {/* linguo-patch:chat-widget-drawer-aware-v1 — chat widget dipindah ke <Navbar/> (lihat dekat <PlacementPicker/>) */}

    {/* PRODUCT CARDS — macOS Dock style */}
    <Reveal>
    <section className="bg-white py-14 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-1">Semua kebutuhan belajar bahasa ada di Linguo</h2>
        <p className="text-slate-500 text-sm text-center mb-10">Pilih program yang sesuai dengan kebutuhanmu</p>
        <ProductDock setPricingTab={setPricingTab} onSelectProgram={(prog:string)=>{(window as any).__openFunnel?.(prog)}}/>
      </div>
    </section>
    </Reveal>

    {/* OUR CLIENTS */}
    <section className="py-5 sm:py-10 bg-white border-b border-slate-100 overflow-hidden group">
      <div className="animate-marquee flex items-center gap-16 w-max group-hover:[animation-play-state:paused]" style={{animationDuration:'50s'}}>
        {[...Array(3)].flatMap((_, ri) =>
          [
            { src: "/images/clients/aiesec.png", alt: "AIESEC", w: 845, h: 120 },
            { src: "/images/clients/cimsa.png", alt: "CIMSA", w: 88, h: 119 },
            { src: "/images/clients/prasetiya-mulya.png", alt: "Prasetiya Mulya", w: 365, h: 86 },
            { src: "/images/clients/vaksindo.png", alt: "Vaksindo", w: 328, h: 120 },
            { src: "/images/clients/binus.png", alt: "BINUS University", w: 760, h: 437 },
            { src: "/images/clients/bitget.png", alt: "Bitget", w: 361, h: 112 },
            { src: "/images/clients/gojek.png", alt: "Gojek", w: 410, h: 110 },
            { src: "/images/clients/polban.png", alt: "POLBAN", w: 108, h: 120 },
            { src: "/images/clients/kai.png", alt: "KAI", w: 284, h: 120 },
            { src: "/images/clients/orica.png", alt: "Orica", w: 123, h: 120 },
            { src: "/images/clients/mondelez.png", alt: "Mondelez", w: 1982, h: 474 },
            { src: "/images/clients/alfamart.png", alt: "Alfamart", w: 750, h: 240 },
            { src: "/images/clients/dua-kelinci-v2.png", alt: "Dua Kelinci", w: 494, h: 300 },
          ].map((logo, i) => (
            // Marquee repeats the list 3× for the infinite scroll; only the first
            // copy is exposed to assistive tech, the rest are decorative duplicates.
            <Image key={`${ri}-${i}`} src={logo.src} alt={ri === 0 ? logo.alt : ""} aria-hidden={ri !== 0} width={logo.w} height={logo.h} loading="lazy" sizes="200px" className="h-7 sm:h-10 max-w-[120px] sm:max-w-[200px] w-auto object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
          ))
        )}
      </div>
    </section>

    {/* HOW IT WORKS */}
    <Reveal>
    <section className="py-8 lg:py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="font-heading text-lg sm:text-3xl lg:text-4xl font-bold text-[#1A9E9E] mb-3">Learning new language is complicated<br/>but we can make it easy for you</h2>
        <p className="text-slate-500 mb-8 lg:mb-16">Linguo helps you to become fluent in many language.</p>
        <div className="hidden lg:flex items-start justify-between max-w-5xl mx-auto">
          {[{img:"/images/step-1.png",iw:383,ih:293,s:"Step 1",t:"Select Language",d:"Pilih bahasa yang kamu sukai (bisa memilih lebih dari satu bahasa sekaligus)"},
            {img:"/images/step-2.png",iw:383,ih:368,s:"Step 2",t:"Choose The Language Level",d:"Pilih level kemampuanmu (tersedia dari basic hingga advance*)",note:"* untuk beberapa bahasa"},
            {img:"/images/step-3.png",iw:320,ih:388,s:"Step 3",t:"Learn & Practice with Linguo",d:"Setelah menyelesaikan pembayaran kamu bisa mulai belajar sesuai jadwal belajar"},
            {img:"/images/step-4.png",iw:384,ih:207,s:"Step 4",t:"Level up & Get certified",d:"Setelah delapan sesi, kamu bisa ikut kelas lanjutan hingga mendapatkan e-sertifikat*",note:"* S&K berlaku"}
          ].map((s,i)=>(<div key={i} className="flex items-start">
            <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}} className="flex flex-col items-center w-[200px]">
              <div className="h-[70px] flex items-end justify-center mb-4"><Image src={s.img} alt={s.t} width={s.iw} height={s.ih} loading="lazy" sizes="100px" className="max-h-[70px] w-auto object-contain"/></div>
              <p className="text-xs text-[#1A9E9E] font-semibold italic mb-1">{s.s}</p>
              <h3 className="text-sm font-bold mb-2 leading-tight">{s.t}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{s.d}</p>
              {s.note&&<p className="text-[10px] text-slate-400 mt-1">{s.note}</p>}
            </motion.div>
            {i<3&&<div className="flex items-center mt-[45px] mx-3 shrink-0"><div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#1A9E9E]"/><div className="w-16 border-t-[1.5px] border-dashed border-[#1A9E9E]/40"/><div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#1A9E9E]"/></div>}
          </div>))}
        </div>
        {/* Mobile: simple grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-8 lg:hidden">
          {[{img:"/images/step-1.png",iw:383,ih:293,s:"Step 1",t:"Select Language",d:"Pilih bahasa yang kamu sukai (bisa memilih lebih dari satu bahasa sekaligus)"},
            {img:"/images/step-2.png",iw:383,ih:368,s:"Step 2",t:"Choose the language level",d:"Pilih level kemampuanmu (tersedia dari basic hingga advance*)"},
            {img:"/images/step-3.png",iw:320,ih:388,s:"Step 3",t:"Learn & practice with Linguo",d:"Setelah menyelesaikan pembayaran kamu bisa mulai belajar sesuai jadwal belajar"},
            {img:"/images/step-4.png",iw:384,ih:207,s:"Step 4",t:"Level up & Get certified",d:"Setelah delapan sesi, kamu bisa ikut kelas lanjutan hingga mendapatkan e-sertifikat*"}
          ].map((s,i)=>(<motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}} className="flex flex-col items-center px-1">
            <Image src={s.img} alt={s.t} width={s.iw} height={s.ih} loading="lazy" sizes="80px" className="h-12 sm:h-20 w-auto object-contain mb-2 sm:mb-4"/>
            <p className="text-[10px] sm:text-xs text-[#1A9E9E] font-semibold italic mb-0.5 sm:mb-1">{s.s}</p>
            <h3 className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 leading-tight">{s.t}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">{s.d}</p>
          </motion.div>))}
        </div>
      </div>
    </section>
    </Reveal>

    {/* POPULAR CLASS */}
    <Reveal>
    <section className="py-8 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-heading text-xl sm:text-3xl font-bold">Most popular class</h2>
          <div className="flex gap-2">
            <button onClick={()=>{const el=document.getElementById('class-scroll');if(el)el.scrollBy({left:-400,behavior:'smooth'})}} className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"><ChevronLeft className="h-4 w-4 text-slate-500"/></button>
            <button onClick={()=>{const el=document.getElementById('class-scroll');if(el)el.scrollBy({left:400,behavior:'smooth'})}} className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"><ChevronRight className="h-4 w-4 text-slate-500"/></button>
          </div>
        </div>
        <div id="class-scroll" className="overflow-hidden group">
          <div className="animate-marquee flex gap-6 w-max group-hover:[animation-play-state:paused]" style={{animationDuration:'30s'}}>
            {[...Array(2)].flatMap((_, ri) =>
              [{l:"ENGLISH",fc:"gb",img:"/images/classes/class-english.png",t:"Beginner English",n:"Thifal Syahla",lv:"BEGINNER",lc:"text-green-600 border-green-500"},
                {l:"KOREA",fc:"kr",img:"/images/classes/class-korea.png",t:"Sweet and tone",n:"Nitalia Wijaya",lv:"INTERMEDIATE",lc:"text-pink-500 border-pink-400"},
                {l:"JAPAN",fc:"jp",img:"/images/classes/class-japan.png",t:"Japanese Basic",n:"Paramita Wulandari",lv:"BEGINNER",lc:"text-green-600 border-green-500"},
              ].map((c, i) => (
                <a key={`${ri}-${i}`} href={`https://wa.me/6282116859493?text=Halo, saya tertarik kelas ${c.t}`} target="_blank" className="w-[280px] sm:w-[360px] shrink-0 group/card cursor-pointer">
                  <div className="relative h-44 sm:h-56 rounded-2xl mb-3 sm:mb-4 overflow-hidden group-hover/card:shadow-lg transition-shadow">
                    <Image src={c.img} alt={ri === 0 ? c.l : ""} aria-hidden={ri !== 0} fill loading="lazy" sizes="(min-width: 640px) 360px, 280px" className="object-cover"/>
                    <span className="absolute top-3 left-3 bg-[#1A9E9E] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                      <img src={`https://flagcdn.com/w20/${c.fc}.png`} alt="" loading="lazy" decoding="async" className="h-3.5 w-3.5 rounded-full object-cover"/> {c.l}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{c.n.split(" ").map(w=>w[0]).join("")}</div>
                      <div><p className="text-sm font-semibold">{c.t}</p><p className="text-xs text-slate-400">{c.n}</p></div>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded border ${c.lc}`}>{c.lv}</span>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
        <div className="text-center mt-5 sm:mt-10">
          <a href="https://wa.me/6282116859493?text=Halo, saya mau lihat kelas lainnya" target="_blank" className="inline-block border border-slate-300 text-slate-600 font-medium px-8 py-3 rounded-full text-sm hover:bg-slate-50 transition-colors">Browse more</a>
        </div>
      </div>
    </section>
    </Reveal>

    {/* WHY LINGUO */}
    <Reveal>
    <section className="py-8 sm:py-16 lg:py-24 bg-white relative overflow-hidden">
      <Image src="/images/wave-line.png" alt="" aria-hidden width={2000} height={642} loading="lazy" sizes="100vw" className="absolute top-1/2 left-0 w-full h-auto -translate-y-1/2 pointer-events-none opacity-60"/>
      <div className="relative z-10">
        <h2 className="font-heading text-base sm:text-3xl font-bold text-center text-[#1A9E9E] mb-2 sm:mb-4">Why Linguo?</h2>
        <WhyCarousel/>
      </div>
    </section>
    </Reveal>

    {/* TEACHERS */}
    <Reveal>
    <section id="teacher" className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="font-heading text-xl sm:text-3xl font-bold mb-3">Meet Our Teacher</h2>
        <p className="text-slate-500 mb-14">Linguo helps you to become fluent in many language.</p>
        <TeacherGrid/>
      </div>
    </section>
    </Reveal>

    {/* TESTIMONIAL */}
    <Reveal>
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="font-heading text-2xl lg:text-3xl font-bold text-center mb-10 lg:mb-14">Story from our student</h2>
        <TestimonialCarousel/>
      </div>
    </section>
    </Reveal>

    {/* PRICING */}
    <Reveal>
    <PricingSection tab={pricingTab} setTab={setPricingTab} onGetStarted={(prog:string)=>{(window as any).__openFunnel?.(prog)}}/>
    </Reveal>

    {/* CTA */}
    <Reveal>
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">Learning is journey<br/>Start now & Grow up with Linguo</h2>
        <p className="text-slate-500 mb-4 sm:mb-8 max-w-lg mx-auto">Linguo helps you to become fluent in many language through interactive classes that always prioritizes practice.</p>
        <a href="https://wa.me/6282116859493" target="_blank" className="inline-flex items-center gap-2 bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold px-8 py-4 rounded-full transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">Mulai Belajar</a>
      </div>
    </section>
    </Reveal>

    {/* FAQ */}
    <Reveal>
    <section id="faq" className="py-16 lg:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest text-center mb-2">LEARN HOW TO GET STARTED</p>
        <h2 className="font-heading text-xl sm:text-3xl font-bold text-center mb-3">Frequently Asked Questions</h2>
        <p className="text-[#1A9E9E] text-sm font-semibold text-center mb-10 cursor-pointer hover:underline">Contact Support</p>
        <div>{FAQS.map((f,i)=><FAQ key={i} q={f.q} a={f.a} video={"video" in f ? f.video : undefined}/>)}</div>
      </div>
    </section>
    </Reveal>

    {/* FOOTER */}
    <footer className="bg-[#14726E] text-white py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-10 mb-10">
          <div><h4 className="font-bold mb-4">Learn a Language</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">
              {["English","French","Spanish","Portuguese","German","Japanese","Korean","Arabic","Italian","Russian"].map(l=>(<li key={l}><a href={`https://wa.me/6282116859493?text=Halo, saya mau kursus ${l}`} className="hover:text-white transition-colors">Learn {l}</a></li>))}
              <li><a onClick={()=>{window.scrollTo({top:0,behavior:'smooth'})}} className="cursor-pointer font-semibold text-white hover:underline">Learn More Languages</a></li>
            </ul>
          </div>
          <div><h4 className="font-bold mb-4">Level Option</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">{["Basic","Upper Basic","Intermediate","Advance"].map(l=>(<li key={l}><a href={`https://wa.me/6282116859493?text=${encodeURIComponent("Halo, saya mau kursus level "+l)}`} target="_blank" className="hover:text-white transition-colors">{l}</a></li>))}</ul>
            <h4 className="font-bold mt-6 mb-4">Program</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">{["Regular Class","Private Class","IELTS Prep","TOEFL Prep"].map(l=>(<li key={l}><a href={`https://wa.me/6282116859493?text=${encodeURIComponent("Halo, saya tertarik "+l+" Linguo")}`} target="_blank" className="hover:text-white transition-colors">{l}</a></li>))}</ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Info</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">
              <li><a href="/harga" className="hover:text-white transition-colors">Harga Kelas</a></li>
              <li><a href="/silabus" className="hover:text-white transition-colors">Silabus & Kurikulum</a></li>
              <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="/corporate" className="hover:text-white transition-colors">Corporate</a></li>
              <li><a href="/jadi-pengajar" className="hover:text-white transition-colors">Jadi Pengajar</a></li>
              <li><a href="/jadi-interpreter" className="hover:text-white transition-colors">Jadi Interpreter</a></li>
              <li><a href="/afiliator" className="hover:text-white transition-colors">Jadi Afiliator</a></li>
              <li><a href="/karir" className="hover:text-white transition-colors">Karir</a></li>
              <li><a href="/interpreter" className="hover:text-white transition-colors">Layanan Interpreter</a></li>
            </ul>
            <h4 className="font-bold mt-6 mb-2">Bantuan</h4>
            <ul className="flex flex-col gap-1.5 text-sm text-white/80">
              <li><a href="/#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="https://wa.me/6282116859493" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Hubungi Kami</a></li>
            </ul>
          </div>
          <div><h4 className="font-bold mb-4">Kontak</h4>
            <div className="text-sm text-white/80 space-y-1">
              <p>Happy Creative Hub, Jl. Cisitu Indah III No.2,</p><p>Dago, Coblong, Bandung 40135</p>
              <p className="mt-3">Tel: (022) 85942550</p><p>Email: official.linguo@gmail.com</p>
            </div>
            <div className="flex gap-3 mt-4">
              {[
                {id:"ig",href:"https://instagram.com/linguo.id",label:"Instagram",svg:<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>},
                {id:"fb",href:"https://facebook.com/linguo.id",label:"Facebook",svg:<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>},
                {id:"tt",href:"https://tiktok.com/@linguo.id",label:"TikTok",svg:<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.09z"/></svg>},
                {id:"li",href:"https://linkedin.com/company/linguo-id",label:"LinkedIn",svg:<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>},
                {id:"yt",href:"https://youtube.com/@linguo.id",label:"YouTube",svg:<svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>},
              ].map(s=>(
                <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white hover:text-[#1A9E9E] transition-all">
                  {s.svg}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 pt-6 text-center text-sm text-white/60">© {new Date().getFullYear()} PT. Linguo Edu Indonesia</div>
      </div>
    </footer>
    <TokoCTA />
    </>
  );
}
