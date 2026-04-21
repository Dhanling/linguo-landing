"use client";
import { supabase } from "@/lib/supabase-client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, ChevronLeft, ChevronRight, MessageCircle, Mail, Star, Check, ArrowRight, ArrowUp, Menu, X, Zap, AtSign, Search } from "lucide-react";
import PlacementPicker from "@/components/PlacementPicker";

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

async function saveLead(data: {wa_number:string; language?:string; name?:string; email?:string; program?:string; level?:string; referral_source?:string}) {
  try {
    // Get referral from URL or localStorage
    const ref = new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("linguo_ref") || undefined;
    if (ref) localStorage.setItem("linguo_ref", ref);
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ ...data, source: "landing-page", referral_source: data.referral_source || ref || null }),
    });
  } catch (e) { console.error("Lead save failed:", e); }
}

const LANG_CATEGORIES = [
  { label: "Populer", langs: ["English","Japanese","Korean","Mandarin","Arabic","French","German","Spanish"] },
  { label: "Asia", langs: ["Japanese","Korean","Mandarin","Arabic","Thai","Vietnamese","Hindi","Turkish","Hebrew","Persian","Tagalog","Malay","Georgian","Urdu","Bengali"] },
  { label: "Eropa", langs: ["English","French","German","Spanish","Italian","Dutch","Portuguese","Russian","Polish","Swedish","Norwegian","Danish","Finnish","Greek","Czech","Hungarian","Romanian"] },
  { label: "Nusantara", langs: ["Javanese","Sundanese","BIPA"] },
  { label: "Afrika", langs: ["Swahili"] },
];

const TEACHERS = [
  {name:"Febri Darusman",role:"Spanish & Thai",flags:"🇪🇸🇹🇭"},{name:"Nitalia Wijaya",role:"Korean & English",flags:"🇰🇷🇬🇧"},
  {name:"Angga",role:"Chinese & Korean",flags:"🇨🇳🇰🇷"},{name:"Paramita Wulandari",role:"Japanese & Portuguese",flags:"🇯🇵🇧🇷"},
  {name:"Thifal Syahla",role:"English & Persian",flags:"🇬🇧🇮🇷"},{name:"Yeremia Immanuel",role:"French & Swahili",flags:"🇫🇷🇰🇪"},
];
const FAQS = [
  {q:"Apa itu Linguo.id?",a:"Linguo.id adalah platform kursus bahasa online pertama di Indonesia dengan 55+ pilihan bahasa dan metode interaktif."},
  {q:"Boleh ikut lebih dari 1 bahasa?",a:"Boleh banget! Kamu bisa daftar beberapa bahasa sekaligus."},
  {q:"Bagaimana format kelasnya?",a:"Kelas Private 1-on-1 via Zoom. Request jadwal & topik sesukamu. Dapat rekaman & materi."},
  {q:"Dapat sertifikat?",a:"Ya! Setiap siswa yang menyelesaikan kursus mendapat e-certificate."},
  {q:"Cara bayarnya?",a:"Transfer bank, QRIS, GoPay, OVO, dan lainnya. Konfirmasi otomatis."},
  {q:"Ada kelas lanjutan?",a:"Ada! Tersedia dari Basic hingga Advance."},
];

// ========== LOGIN MODAL ==========
type AuthView = "login" | "signup" | "forgot" | "forgot_sent" | "verify_phone";

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

  const reset = () => {
    setError(""); setSuccess(""); setName(""); setEmail("");
    setPhone(""); setPassword(""); setOtp(""); setShowPass(false);
  };

  const goTo = (v: AuthView) => { reset(); setView(v); };

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
    else { setSuccess("Cek email kamu untuk konfirmasi akun ya! 📧"); }
  };

  // ── Forgot Password ──
  const handleForgot = async () => {
    if (!email) { setError("Masukkan email kamu dulu."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/callback?type=recovery",
    });
    setLoading(false);
    if (error) { setError(error.message); }
    else { goTo("forgot_sent"); }
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

              {/* ── FORGOT SENT ── */}
              {view === "forgot_sent" ? (
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">📧</div>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-2">Cek email kamu!</h2>
                  <p className="text-slate-500 text-sm mb-6">Link reset password sudah dikirim ke <strong>{email}</strong>. Cek inbox atau folder spam ya.</p>
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
                    {view === "signup" ? "Daftar Akun Baru" : view === "forgot" ? "Reset Password" : "Selamat datang! 👋"}
                  </h2>
                  <p className="text-slate-500 text-sm mb-6">
                    {view === "signup" ? "Buat akun untuk mulai belajar bahasa impianmu." :
                     view === "forgot" ? "Masukkan emailmu, kami kirim link reset password." :
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
                      {view === "forgot" ? "Kirim Link Reset" : view === "signup" ? "Daftar Sekarang" : tab === "phone" ? "Kirim Kode OTP" : "Masuk"}
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
  const [scrolled, setScrolled] = useState(false);
  const [placementPickerOpen, setPlacementPickerOpen] = useState(false);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 80); window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn); }, []);
  const c = scrolled;

  const scrollTo = (id:string, tab?:number) => {
    if(tab!==undefined) onPricingTab(tab);
    setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'}), tab!==undefined?50:0);
    setProgOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Main Nav */}
      <nav className={`transition-all duration-300 ${c ? "bg-white shadow-sm" : "bg-[#1A9E9E]"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <a href="/" className="flex items-center">
              <img src="/images/logo-white.png" alt="Linguo" className={`h-8 sm:h-14 object-contain transition-all ${c?"brightness-0":""}`} />
            </a>
            <div className="hidden md:flex items-center gap-8">
              {/* Our Program dropdown */}
              <div className="relative" onMouseEnter={()=>setProgOpen(true)} onMouseLeave={()=>setProgOpen(false)}>
                <button className={`cursor-pointer relative text-sm font-medium py-1 flex items-center gap-1 ${c?"text-slate-600 hover:text-slate-900":"text-white/80 hover:text-white"} transition-colors group`}>
                  Our Program
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${progOpen?"rotate-180":""}`}/>
                  <span className={`absolute left-0 -bottom-1 h-[3px] w-0 group-hover:w-full transition-all duration-300 rounded-full bg-[#fbbf24]`}/>
                </button>
                <AnimatePresence>{progOpen&&(
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} transition={{duration:0.2}}
                    className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-2 overflow-hidden">
                    {/* Kelas Private */}
                    <button onClick={()=>{(window as any).__openFunnel?.("Kelas Private");setProgOpen(false)}}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors">
                      Kelas Private
                    </button>
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
                            📅 Cek Jadwal Reguler
                          </a>
                          <button
                            onClick={() => { (window as any).__openFunnel?.("Kelas Reguler"); setProgOpen(false); setRegulerSubOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors"
                          >
                            📝 Daftar Kelas Reguler
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Kelas Kids */}
                    <button onClick={()=>{(window as any).__openFunnel?.("Kelas Kids");setProgOpen(false)}}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors">
                      Kelas Kids
                    </button>
                    {/* IELTS / TOEFL */}
                    <button onClick={()=>{(window as any).__openFunnel?.("IELTS/TOEFL Prep");setProgOpen(false)}}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors">
                      IELTS / TOEFL
                    </button>
                    <div className="border-t border-slate-100 my-1"/>
                    <a href="/produk"
                      className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors">
                      E-Learning & E-Book
                    </a>
                    <a href="/corporate"
                      className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] transition-colors">
                      Corporate Class
                    </a>
                  </motion.div>
                )}</AnimatePresence>
              </div>
              {/* Other nav links */}
              {[["Corporate","/corporate"],["Jadi Pengajar","/jadi-pengajar"],["FAQ","faq"],["Silabus","/silabus"],["Blog","/blog"]].map(([l,h]) => (
                <a key={l} onClick={()=>{
                  if(h.startsWith("/")){
                    window.location.href = h;
                  } else if(h.startsWith("wa-")){
                    const msg = "Halo, saya tertarik menjadi pengajar di Linguo";
                    window.location.href = `https://wa.me/6282116859493?text=${encodeURIComponent(msg)}`;
                  } else { scrollTo(h); }
                }} className={`cursor-pointer relative text-sm font-medium py-1 ${c?"text-slate-600 hover:text-slate-900":"text-white/80 hover:text-white"} transition-colors group`}>
                  {l}
                  <span className={`absolute left-0 -bottom-1 h-[3px] w-0 group-hover:w-full transition-all duration-300 rounded-full bg-[#fbbf24]`}/>
                </a>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={()=>setLang(lang==='id'?'en':'id')} className="hover:opacity-80 transition-opacity">
              <img src={lang==='id'?"/images/flag-id.png":"/images/flag-en.png"} alt={lang==='id'?"ID":"EN"} className="h-8 w-8 rounded-full object-cover border-2 border-white/40"/>
            </button>
            <button onClick={onLoginOpen} className={`font-semibold px-5 py-2.5 rounded-full text-sm transition-all border-2 ${c ? "border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E]/5" : "border-white/60 text-white hover:bg-white/10"}`}>Login</button>
            <button onClick={()=>setPlacementPickerOpen(true)} className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-2.5 rounded-full text-sm transition-all active:scale-95">Placement Test</button>
          </div>
          <button className="md:hidden" onClick={()=>setOpen(!open)}>{open?<X className={`h-5 w-5 ${c?"text-slate-900":"text-white"}`}/>:<Menu className={`h-5 w-5 ${c?"text-slate-900":"text-white"}`}/>}</button>
        </div>
        <AnimatePresence>{open&&(<motion.div initial={{height:0}} animate={{height:"auto"}} exit={{height:0}} className="md:hidden bg-white border-t overflow-hidden">
          <div className="px-6 py-4 flex flex-col gap-2">
            <a href="/silabus/english/coba" className="block py-2.5 text-sm text-[#1A9E9E] font-semibold hover:text-[#147a7a] border-b border-gray-100 mb-1 pb-3">🎯 Placement Test Gratis</a>
            <button onClick={()=>{(window as any).__openFunnel?.("Kelas Private");setOpen(false)}} className="text-sm py-2.5 text-left">Kelas Private</button>
            <button onClick={()=>{(window as any).__openFunnel?.("Kelas Reguler");setOpen(false)}} className="text-sm py-2.5 text-left">Kelas Reguler</button>
            <a href="/jadwal-kelas-reguler" onClick={()=>setOpen(false)} className="text-sm py-2.5 text-left text-[#1A9E9E] pl-4 border-l-2 border-[#1A9E9E]/30">└ 📅 Jadwal Batch Terbaru</a>
            <button onClick={()=>{(window as any).__openFunnel?.("IELTS/TOEFL Prep");setOpen(false)}} className="text-sm py-2.5 text-left">IELTS / TOEFL</button>
            <button onClick={()=>{(window as any).__openFunnel?.("Kelas Kids");setOpen(false)}} className="text-sm py-2.5 text-left">Kelas Kids 🧒</button>
            <a href="/produk" onClick={()=>setOpen(false)} className="text-sm py-2.5 text-left">E-Learning & E-Book</a>
            <a href="/corporate" className="text-sm py-2.5">Corporate</a>
            <a href="/jadi-pengajar" className="text-sm py-2.5">Jadi Pengajar</a>
            <button onClick={()=>{scrollTo("faq");setOpen(false)}} className="text-sm py-2.5 text-left">FAQ</button>
            <a href="/silabus" onClick={()=>setOpen(false)} className="text-sm py-2.5">Silabus</a>
            <a href="/blog" onClick={()=>setOpen(false)} className="text-sm py-2.5">Blog</a>
            <button onClick={()=>{onLoginOpen();setOpen(false)}} className="mt-2 border-2 border-[#1A9E9E] text-[#1A9E9E] text-center py-3 rounded-full font-semibold text-sm w-full block">Login</button>
            <button onClick={()=>{setPlacementPickerOpen(true);setOpen(false)}} className="mt-2 bg-[#1A9E9E] text-white text-center py-3 rounded-full font-semibold text-sm w-full">Placement Test</button>
          </div>
        </motion.div>)}</AnimatePresence>
      </nav>
      <PlacementPicker open={placementPickerOpen} onClose={()=>setPlacementPickerOpen(false)} />

    </div>
  );
}

function FAQ({q,a}:{q:string;a:string}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button onClick={()=>setOpen(!open)} className="flex items-center justify-between w-full py-6 text-left">
        <span className="text-base font-semibold pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open?"rotate-180":""}`}/>
      </button>
      <AnimatePresence>{open&&(<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
        <p className="pb-6 text-sm text-slate-500 leading-relaxed">{a}</p>
      </motion.div>)}</AnimatePresence>
    </div>
  );
}

const GREETINGS = [
  {text:"Hello!",flag:"🇬🇧"},{text:"Hola!",flag:"🇪🇸"},{text:"こんにちは",flag:"🇯🇵"},{text:"안녕하세요",flag:"🇰🇷"},
  {text:"你好!",flag:"🇨🇳"},{text:"Bonjour!",flag:"🇫🇷"},{text:"Hallo!",flag:"🇩🇪"},{text:"Ciao!",flag:"🇮🇹"},
  {text:"مرحبا!",flag:"🇸🇦"},{text:"Olá!",flag:"🇧🇷"},{text:"Привет!",flag:"🇷🇺"},{text:"สวัสดี!",flag:"🇹🇭"},
];

const FLAG_CODES: Record<string,string> = {
  // English names
  English:"gb",Japanese:"jp",Korean:"kr",Mandarin:"cn",Arabic:"sa",French:"fr",German:"de",Spanish:"es",Italian:"it",Dutch:"nl",Portuguese:"br",Russian:"ru",Thai:"th",Vietnamese:"vn",Hindi:"in",Turkish:"tr",Polish:"pl",Swedish:"se",Norwegian:"no",Danish:"dk",Finnish:"fi",Greek:"gr",Czech:"cz",Hungarian:"hu",Hebrew:"il",Persian:"ir",Swahili:"ke",Tagalog:"ph",Malay:"my",Georgian:"ge",Javanese:"id",Sundanese:"id",BIPA:"id",Urdu:"pk",Bengali:"bd",Romanian:"ro",
  // Indonesian names (Mandarin same in both languages — already covered above)
  Inggris:"gb",Jepang:"jp",Korea:"kr",Arab:"sa",Prancis:"fr",Jerman:"de",Spanyol:"es",Italia:"it",Belanda:"nl",Portugis:"br",Rusia:"ru",Thailand:"th",Vietnam:"vn",Turki:"tr",Polandia:"pl",Swedia:"se",Norwegia:"no",Denmark:"dk",Finlandia:"fi",Yunani:"gr",Ceko:"cz",Hungaria:"hu",Ibrani:"il",Persia:"ir",Filipina:"ph",Melayu:"my",Georgia:"ge",Jawa:"id",Sunda:"id",Pakistan:"pk",Bangladesh:"bd",Rumania:"ro"
};
function getFlagCode(name:string){return FLAG_CODES[name]||"un"}

function TypingBubble() {
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

  return (
    <span className="font-bold text-[#1A9E9E] text-xl inline-flex items-center gap-2 min-w-[140px]">
      <span className="text-2xl">{GREETINGS[idx].flag}</span>
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
  const total = WHY_CARDS.length;
  const cardW = 300;
  const gap = 24;
  const step = cardW + gap;

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % total), 4000);
    return () => clearInterval(t);
  }, []);

  // Center the active card: offset so active is in the middle
  const offset = -(active * step);

  return (
    <div className="relative px-6">
      <div className="flex justify-end max-w-5xl mx-auto gap-2 mb-6">
        <button onClick={() => setActive(a => (a - 1 + total) % total)} className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"><ChevronLeft className="h-4 w-4 text-slate-500"/></button>
        <button onClick={() => setActive(a => (a + 1) % total)} className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"><ChevronRight className="h-4 w-4 text-slate-500"/></button>
      </div>
      <div className="max-w-5xl mx-auto overflow-hidden py-6">
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
                  <img src={src} alt="" className="w-full h-auto"/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-4">
        {WHY_CARDS.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} className={`transition-all duration-500 rounded-full ${i === active ? "w-8 h-2.5 bg-[#1A9E9E]" : "w-2.5 h-2.5 bg-[#1A9E9E]/30"}`}/>
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
  const total = TESTIMONIALS.length;

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % total), 6000);
    return () => clearInterval(t);
  }, []);

  const cardW = 560;
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
              return (
                <div key={i} className="shrink-0" style={{width:`${cardW}px`}} onClick={() => setActive(i)}>
                  <div className={`flex gap-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${isCurrent ? "opacity-100 shadow-lg" : "opacity-40 scale-95"}`}>
                    <div className={`w-[200px] shrink-0 bg-gradient-to-br ${t.color} flex items-center justify-center relative overflow-hidden`}>
                      {t.photo ? (
                        // Foto asli — full cover, tanpa overlay apapun
                        <img 
                          src={t.photo} 
                          alt={`Testimoni ${t.name} - Siswa Kelas ${t.lang} Linguo`}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        // Fallback initials — hanya muncul kalau photo field gak ada
                        <div className="h-24 w-24 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white">{t.initials}</div>
                      )}
                    </div>
                    <div className="flex-1 bg-slate-50 p-6 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="font-bold text-sm">{t.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <img src={`https://flagcdn.com/w40/${getFlagCode(t.lang)}.png`} alt={`Bendera ${t.lang}`} className="h-3.5 w-3.5 rounded-full object-cover"/>
                            <p className="text-xs text-[#1A9E9E]">{t.lang}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400"/>)}</div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mt-2 line-clamp-4">{t.text}</p>
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
  const [step, setStep] = useState(1);
  const [selLang, setSelLang] = useState("");
  const [selProgram, setSelProgram] = useState("");
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
    if (!open) { setStep(1); setSelProgram(""); setSelLang(""); setSelLevel(""); }
  }, [open, initialProgram, initialLang, initialLevel, initialPreferredProg, initialName, initialWa]);
  const [selLevel, setSelLevel] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formWa, setFormWa] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Populer");

  const filtered = search.trim()
    ? LANG_CATEGORIES.flatMap(c=>c.langs).filter((v,i,a)=>a.indexOf(v)===i).filter(l=>l.toLowerCase().includes(search.toLowerCase()))
    : LANG_CATEGORIES.find(c=>c.label===activeTab)?.langs || [];

  const isEnglish = selLang==="English";

  const programs = [
    {id:"Kelas Private",icon:"🎓",title:"Kelas Private",desc:"1-on-1 via Zoom, jadwal fleksibel",price:"Rp 90.000/sesi",highlight:true},
    {id:"Kelas Reguler",icon:"👥",title:"Kelas Reguler",desc:"Grup class, jadwal tetap, lebih terjangkau",price:"Rp 150.000/2 bulan",highlight:false,note:"*Kelas dibuka minimal 8 peserta"},
    {id:"Kelas Kids",icon:"🧒",title:"Kelas Kids",desc:"1-on-1 untuk anak 5-12 tahun, fun & interaktif",price:"Mulai Rp 75.000/sesi",highlight:false},
    ...(isEnglish?[{id:"IELTS/TOEFL Prep",icon:"📝",title:"IELTS / TOEFL Prep",desc:"16 sesi @90 menit, persiapan intensif",price:"Rp 300.000/2 bulan",highlight:false}]:[]),
  ];

  const levels = selProgram==="Kelas Reguler"
    ? [{id:"A1",label:"A1 — Basic",desc:"Pemula, mulai dari nol"}]
    : selProgram==="Kelas Kids"
    ? [{id:"Little Learner",label:"🐣 Little Learner",desc:"Usia 5–8 tahun • 30 menit • Rp 75.000/sesi"},
       {id:"Young Explorer",label:"🚀 Young Explorer",desc:"Usia 9–12 tahun • 45 menit • Rp 85.000/sesi"}]
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

      // Step 1: Save lead to DB FIRST — always, regardless of Xendit/WA outcome.
      // This ensures lead capture even if user drops off at WA step.
      try {
        await saveLead({
          wa_number: fullNum,
          name: formName,
          email: formEmail,
          language: selLang,
          program: selProgram,
          level: selLevel,
        });
      } catch (leadErr) {
        console.error("Lead save failed (non-blocking):", leadErr);
      }

      // Step 2: Redirect to WhatsApp with pre-filled template.
      // Xendit invoice path below is commented pending dokumen verification.
      // TODO: when Xendit is live, restore create-invoice call and remove WA redirect.
      const waMsg =
        "Halo Admin Linguo, saya tertarik mendaftar:\n\n" +
        "📚 Program: " + selProgram + "\n" +
        "🌏 Bahasa: " + selLang + "\n" +
        "📊 Level: " + selLevel + "\n" +
        "🙋 Nama: " + formName + "\n" +
        "📧 Email: " + formEmail + "\n\n" +
        "Mohon info pembayaran & jadwalnya. Terima kasih!";
      window.location.href = "https://wa.me/6282116859493?text=" + encodeURIComponent(waMsg);

      /* === XENDIT PATH (disabled until dokumen approved) ===
      let productKey = "";
      if(selProgram==="Kelas Private") productKey = "private-" + selLevel.toLowerCase();
      else if(selProgram==="Kelas Reguler") productKey = "reguler-" + selLevel.toLowerCase();
      else if(selProgram==="IELTS/TOEFL Prep") productKey = "ielts-toefl";
      else if(selProgram==="Kelas Kids") productKey = "kids-" + selLevel.toLowerCase().replace(/ /g, "-");

      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, wa_number: fullNum, language: selLang, program: productKey.split("-")[0], level: selLevel, productKey, referral_source: localStorage.getItem("linguo_ref") || undefined }),
      });
      const data = await res.json();
      if(data.invoice_url) window.location.href = data.invoice_url;
      else { alert("Gagal membuat invoice: " + (data.error || "Silakan coba lagi")); setSaving(false); }
      */
    } catch(e) {
      console.error("Submit error:", e);
      alert("Terjadi kesalahan. Silakan coba lagi.");
      setSaving(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Save funnel data in cookie (survives OAuth redirect, unlike localStorage/URL params)
    document.cookie = "linguo_funnel=" + encodeURIComponent(JSON.stringify({ program: selProgram, language: selLang, level: selLevel })) + ";path=/;max-age=600;SameSite=Lax";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/akun" },
    });
  };
  const handleClose = () => { onClose(); setStep(1); setSearch(""); setSelLang(""); setSelProgram(""); setSelLevel(""); setFormName(""); setFormEmail(""); setFormWa(""); setFormError(""); };

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
                <p className="text-sm text-slate-500 mb-4">Pilih bahasa yang kamu minati</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                  <input type="text" placeholder="Cari bahasa..." value={search} onChange={(e)=>setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20"/>
                </div>
              </div>
              {!search.trim() && (
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
                    <button key={l} onClick={()=>{setSelLang(l);setSearch("");setStep(selProgram?3:2)}}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left border border-slate-100 text-slate-700 hover:bg-[#1A9E9E]/5 hover:text-[#1A9E9E] hover:border-[#1A9E9E]/30">
                      <img src={`https://flagcdn.com/w40/${getFlagCode(l)}.png`} alt="" className="h-6 w-6 rounded-full object-cover"/>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Pilih Program */}
          {step===2 && (
            <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1">
              <button onClick={()=>setStep(1)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti bahasa</button>
              <div className="flex items-center gap-2 mb-4">
                <img src={`https://flagcdn.com/w40/${getFlagCode(selLang)}.png`} alt="" className="h-6 w-6 rounded-full object-cover"/>
                <span className="font-bold">{selLang}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Pilih jenis kelas</h3>
              <p className="text-sm text-slate-500 mb-6">Mau belajar dengan cara apa?</p>
              <div className="flex flex-col gap-3">
                {programs.map(p=>(
                  <button key={p.id} onClick={()=>{setSelProgram(p.id);setStep(3)}}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all hover:border-[#1A9E9E]/40 hover:shadow-md ${p.highlight?"border-[#1A9E9E]/20 bg-[#1A9E9E]/[0.02]":"border-slate-100"}`}>
                    <span className="text-2xl mt-0.5">{p.icon}</span>
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

          {/* STEP 3 — Pilih Level */}
          {step===3 && (
            <motion.div key="s3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1">
              <button onClick={()=>setStep(2)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti program</button>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-5">
                <img src={`https://flagcdn.com/w40/${getFlagCode(selLang)}.png`} alt="" className="h-5 w-5 rounded-full object-cover"/>
                <span className="text-sm font-medium">{selLang}</span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-[#1A9E9E] font-medium">{selProgram}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{selProgram==="Kelas Kids"?"Pilih jenis kelas":"Pilih level"}</h3>
              <p className="text-sm text-slate-500 mb-6">{selProgram==="Kelas Kids"?"Sesuaikan dengan usia anak":"Mulai dari mana?"}</p>
              <div className="flex flex-col gap-3">
                {levels.map(lv=>(
                  <button key={lv.id} onClick={()=>{setSelLevel(lv.id);setStep(4)}}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 text-left transition-all hover:border-[#1A9E9E]/40 hover:shadow-md">
                    <div className="h-10 w-10 rounded-full bg-[#1A9E9E]/10 flex items-center justify-center text-sm font-bold text-[#1A9E9E]">{selProgram==="Kelas Kids"?(lv.id==="Little Learner"?"🐣":"🚀"):lv.id}</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{lv.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{lv.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0"/>
                  </button>
                ))}
              </div>
              {selProgram==="Kelas Reguler" && <p className="text-xs text-slate-400 mt-4 text-center">*Kelas Reguler saat ini tersedia untuk level A1</p>}
            </motion.div>
          )}

          {/* STEP 4 — Form Data Diri */}
          {step===4 && (
            <motion.div key="s4" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1 overflow-y-auto">
              <button onClick={()=>setStep(3)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Ganti level</button>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5 mb-5 text-xs">
                <img src={`https://flagcdn.com/w40/${getFlagCode(selLang)}.png`} alt="" className="h-4 w-4 rounded-full object-cover"/>
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
            <motion.div key="s5" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="p-6 flex-1">
              <button onClick={()=>setStep(4)} className="text-sm text-[#1A9E9E] font-medium mb-3 flex items-center gap-1 hover:underline">← Edit data</button>
              <div className="text-center mb-5">
                <span className="text-4xl mb-2 block">🎉</span>
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
                    <img src={`https://flagcdn.com/w40/${getFlagCode(selLang)}.png`} alt="" className="h-4 w-4 rounded-full object-cover"/>{selLang}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Program</span>
                  <span className="text-sm font-medium text-[#1A9E9E]">{selProgram}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Level</span>
                  <span className="text-sm font-medium">{selLevel}</span>
                </div>
              </div>
              <button onClick={handleFinal} disabled={saving}
                className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-slate-900 font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg">
                {saving ? "Memproses pembayaran..." : "Bayar Sekarang →"}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-3">Kamu akan diarahkan ke halaman pembayaran Xendit</p>
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
  if(typeof window!=="undefined")(window as any).__openFunnel=(input:string|{language?:string;program?:string;preferredProgram?:string;level?:string;source?:string;prefillName?:string;prefillWa?:string})=>{
      if(typeof input==="string"){setFunnelProg(input);setFunnelLang("");setFunnelLevel("");setFunnelPreferredProg("");setFunnelSource("");setFunnelPrefillName("");setFunnelPrefillWa("");}
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

  const handleQuickSubmit = async () => {
    if(!waNumber) { setError("Masukkan nomor WhatsApp-mu"); return; }
    if(waNumber.length < 9) { setError("Nomor terlalu pendek, minimal 9 digit"); return; }
    if(waNumber.length > 15) { setError("Nomor terlalu panjang"); return; }
    if(countryCode==="+62" && !["8"].includes(waNumber[0])) { setError("Nomor Indonesia harus diawali angka 8 (contoh: 812...)"); return; }
    setError("");
    const fullNum = countryCode.replace("+","") + waNumber;
    await saveLead({wa_number: fullNum});
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
        <div className="bg-white rounded-full flex items-center max-w-[400px] sm:max-w-lg shadow-lg">
          <select value={countryCode} onChange={(e)=>setCountryCode(e.target.value)}
            className="bg-transparent pl-4 pr-0 py-3 text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer appearance-none">
            {["+62","+60","+65","+66","+81","+82","+86","+91","+1","+44","+61","+49","+33","+971","+966","+7","+55","+234"].map(c=>(
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="tel" placeholder="812-3456-7890" value={waNumber}
            onChange={(e)=>{const v=e.target.value.replace(/[^0-9]/g,"");setWaNumber(v.startsWith("0")?v.slice(1):v);setError("")}}
            className="flex-1 min-w-0 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
            onKeyDown={(e)=>e.key==='Enter'&&handleQuickSubmit()}/>
          <button onClick={handleQuickSubmit}
            className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-3 sm:px-4 py-2 text-[10px] sm:text-xs transition-all active:scale-95 whitespace-nowrap rounded-full m-1 shrink-0">
            <span className="hidden sm:inline">Dapatkan Diskon →</span><span className="sm:hidden">Diskon →</span>
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
              <img src={t.img} alt={t.name} className="h-20 w-20 rounded-full object-cover"/>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex">
                <img src={`https://flagcdn.com/w40/${t.f1}.png`} alt="" className="h-5 w-5 rounded-full object-cover border-2 border-white -mr-1 relative z-10"/>
                <img src={`https://flagcdn.com/w40/${t.f2}.png`} alt="" className="h-5 w-5 rounded-full object-cover border-2 border-white"/>
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
  {badge:"🎓 Paling Diminati",badgeColor:"bg-[#1A9E9E] text-white",title:"Kelas Private",desc:"Belajar 1-on-1 via Zoom, request jadwal & topik sesukamu",priceOld:"Rp 100.000",price:"Rp 90.000",per:"/sesi",discount:"10%",tab:0},
  {badge:"👥 Terjangkau",badgeColor:"bg-blue-500 text-white",title:"Kelas Reguler",desc:"Grup class dengan jadwal tetap, cocok untuk belajar bareng",priceOld:"Rp 200.000",price:"Rp 150.000",per:"/2 bulan",discount:"25%",tab:1},
  {badge:"📝 Intensif",badgeColor:"bg-amber-500 text-white",title:"IELTS / TOEFL",desc:"16 sesi @90 menit, persiapan tes bahasa Inggris terlengkap",priceOld:"Rp 400.000",price:"Rp 300.000",per:"/2 bulan",discount:"25%",tab:2},
  {badge:"🧒 Anak 5-12 thn",badgeColor:"bg-pink-500 text-white",title:"Kelas Kids",desc:"Belajar bahasa 1-on-1 untuk anak, fun & interaktif",priceOld:null,price:"Rp 75.000",per:"/sesi",discount:null,tab:3},
  {badge:"📱 Belajar Mandiri",badgeColor:"bg-purple-500 text-white",title:"E-Learning",desc:"Akses materi interaktif kapan saja, belajar sesuai tempo sendiri",priceOld:null,price:"Rp 29.000",per:"",discount:null,tab:-1,href:"/produk"},
  {badge:"📚 Digital",badgeColor:"bg-rose-500 text-white",title:"E-Book",desc:"Buku digital lengkap untuk belajar mandiri di mana saja",priceOld:null,price:"Rp 29.000",per:"",discount:null,tab:-1,href:"/produk?tab=ebook"},
];

function ProductDock({setPricingTab,onSelectProgram}:{setPricingTab:(t:number)=>void;onSelectProgram:(prog:string)=>void}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number|null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getScale = (el:HTMLDivElement|null) => {
    if(isMobile || mouseX===null || !el) return 1;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width/2;
    const dist = Math.abs(mouseX - center);
    const maxDist = 300;
    if(dist > maxDist) return 1;
    return 1 + 0.1 * Math.pow(1 - dist/maxDist, 2);
  };

  return (
    <div ref={containerRef}
      className="flex lg:justify-center gap-3 lg:gap-4 items-stretch py-2 lg:py-6 px-2 lg:px-4 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-3 lg:pb-4 -mx-2 lg:mx-0"
      onMouseMove={(e)=>setMouseX(e.clientX)}
      onMouseLeave={()=>setMouseX(null)}>
      {PRODUCTS.map((p,i)=>(
        <DockCard key={i} product={p} getScale={getScale} setPricingTab={setPricingTab} onSelectProgram={onSelectProgram}/>
      ))}
    </div>
  );
}

function DockCard({product:p,getScale,setPricingTab,onSelectProgram}:{product:typeof PRODUCTS[0];getScale:(el:HTMLDivElement|null)=>number;setPricingTab:(t:number)=>void;onSelectProgram:(prog:string)=>void}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const scale = getScale(ref.current);

  return (
    <div ref={ref}
      className="flex flex-col bg-white border-2 rounded-2xl p-3 lg:p-5 w-[150px] lg:w-[200px] shrink-0 snap-center cursor-pointer origin-bottom"
      style={{
        transform:`scale(${scale})`,
        transition: 'transform 0.2s cubic-bezier(0.33,1,0.68,1)',
        boxShadow: scale > 1.03 ? '0 20px 50px -12px rgba(26,158,158,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
        borderColor: scale > 1.03 ? 'rgba(26,158,158,0.35)' : '#f1f5f9',
        zIndex: scale > 1.03 ? 10 : 1,
        position:'relative',
      }}>
      <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full mb-3 self-start ${p.badgeColor}`}>{p.badge}</span>
      <h3 className="font-bold text-sm mb-1">{p.title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">{p.desc}</p>
      <div className="mb-3 min-h-[48px] flex flex-col justify-end">
        {p.priceOld ? (
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-slate-400 line-through">{p.priceOld}</span>
            {p.discount && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">{p.discount}</span>}
          </div>
        ) : (
          <div className="mb-0.5 h-[18px]"/>
        )}
        <span className="text-lg font-bold text-[#1A9E9E]">{p.price}</span>
        <span className="text-xs text-slate-400">{p.per}</span>
      </div>
      <button onClick={()=>{
        if(p.tab>=0){(window as any).__openFunnel?.(["Kelas Private","Kelas Reguler","IELTS/TOEFL Prep","Kelas Kids"][p.tab]||"")}
        else if((p).href){window.location.href=(p).href}
        else{window.open(`https://wa.me/6282116859493?text=Halo, saya tertarik ${p.title} Linguo`,'_blank')}
      }}
        className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white text-xs font-semibold py-2.5 rounded-full transition-colors active:scale-95">
        Beli Paket
      </button>
    </div>
  );
}

const PRICING_TABS = [
  {
    id:"private",label:"Kelas Private",desc:"Fleksibel, personal, dan efektif. 1-on-1 via Zoom.",
    plans:[
      {name:"Per Sesi",desc:"Coba dulu 1 sesi",price:"Rp 90.000",highlighted:true,badge:"Recommended"},
      {name:"5 Sesi",desc:"Hemat buat rutin",price:"Rp 400.000",highlighted:false},
      {name:"10 Sesi",desc:"Serius & lebih hemat",price:"Rp 750.000",highlighted:false},
      {name:"20 Sesi",desc:"Best value",price:"Rp 1.400.000",highlighted:false,badge:"BEST VALUE"},
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
      {name:"Little Learner",desc:"30 menit • usia 5-8 thn",price:"Rp 75.000",highlighted:true,badge:"🐣 USIA 5-8"},
      {name:"Young Explorer",desc:"45 menit • usia 9-12 thn",price:"Rp 85.000",highlighted:false,badge:"🚀 USIA 9-12"},
    ],
    features:["Recording Class/sesi","Interactive Class via ZOOM","Materi Fun & Gamified","Request Jadwal","Qualified Kids Teacher","E-Certificate","55+ Bahasa Tersedia","Progress Report untuk Orang Tua"],
    allCheck:true,
    wa:"Kelas Kids",
  },
];

function PricingSection({tab,setTab,onGetStarted}:{tab:number;setTab:(t:number)=>void;onGetStarted:(program:string)=>void}) {
  const t = PRICING_TABS[tab];
  return (
    <section id="produk" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-2">Choose a learning plan<br/>that speaks to you</h2>
        <p className="text-slate-500 mb-10">Mulai perjalanan bahasamu sekarang.</p>

        {/* Tabs */}
        <div className="inline-flex bg-slate-100 rounded-full p-1.5 mb-12">
          {PRICING_TABS.map((pt,i)=>(
            <button key={pt.id} onClick={()=>setTab(i)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${tab===i?"bg-[#1A9E9E] text-white shadow-lg shadow-[#1A9E9E]/25":"text-slate-500 hover:text-slate-700"}`}>
              {pt.label}
            </button>
          ))}
        </div>

        <p className="text-slate-500 text-sm mb-10">{t.desc}</p>

        {/* Cards layout for plans */}
        <div className={`flex justify-center gap-5 flex-wrap mb-6`}>
          {t.plans.map((p,pi)=>(
            <div key={pi} className={`relative w-[220px] rounded-2xl border-2 p-6 text-center transition-all duration-300 ${p.highlighted?"border-[#1A9E9E] shadow-xl bg-white scale-[1.03]":"border-slate-200 bg-white hover:border-slate-300"}`}>
              {p.badge&&<span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap ${p.badge==="BEST VALUE"?"bg-[#fbbf24] text-slate-900":"bg-[#1A9E9E] text-white"}`}>{p.badge}</span>}
              <p className="font-bold text-lg mt-2">{p.name}</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">{p.desc}</p>
              <p className={`text-2xl font-bold mb-5 ${p.highlighted?"text-[#1A9E9E]":"text-slate-900"}`}>{p.price}</p>
              <button onClick={()=>onGetStarted(t.label)}
                className={`inline-block w-full px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${p.highlighted?"bg-[#1A9E9E] text-white hover:bg-[#178888] shadow-lg shadow-[#1A9E9E]/25":"border-2 border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E] hover:text-white"}`}>
                Get Started
              </button>
            </div>
          ))}
        </div>

        {/* Feature list */}
        <div className="max-w-md mx-auto mt-10 text-left">
          {t.features.map((f,fi)=>(
            <div key={fi} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
              <Check className="h-4 w-4 text-[#1A9E9E] shrink-0"/>
              <span className="text-sm text-slate-600">{f}</span>
            </div>
          ))}
        </div>

        {/* Digital Products */}
        <div id="digital" className="mt-16 pt-12 border-t border-slate-100">
          <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">BELAJAR MANDIRI</p>
          <h3 className="text-xl font-bold mb-6">Mau belajar sendiri dulu?</h3>
          <div className="flex justify-center gap-5 flex-wrap">
            {[
              {name:"E-Learning",desc:"Akses materi interaktif kapan saja",price:"Rp 29.000",icon:"📱"},
              {name:"E-Book",desc:"Buku digital lengkap untuk belajar mandiri",price:"Rp 29.000",icon:"📚"},
            ].map((d,i)=>(
              <div key={i} className="w-[260px] bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center hover:border-[#1A9E9E]/40 hover:shadow-md transition-all">
                <span className="text-3xl mb-3 block">{d.icon}</span>
                <p className="font-bold">{d.name}</p>
                <p className="text-xs text-slate-400 mt-1 mb-3">{d.desc}</p>
                <p className="text-xl font-bold text-[#1A9E9E] mb-4">{d.price}</p>
                <a href={(d as any).href || "/produk"}
                  className="inline-block w-full border-2 border-[#1A9E9E] text-[#1A9E9E] hover:bg-[#1A9E9E] hover:text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95">
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
    const fn=()=>setSt(window.scrollY>400);window.addEventListener("scroll",fn);
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
              <h1 className="text-[1.6rem] sm:text-4xl lg:text-[3.8rem] font-extrabold text-white leading-[1.1] mb-4 lg:mb-8">
                Everyone Can<br/>Be a Polyglot
              </h1>
            </div>
            <div className="lg:hidden shrink-0 relative">
              <img src="/images/hero-character.png" alt="" className="w-36 sm:w-44 drop-shadow-xl"/>
              <motion.div animate={{y:[0,-5,0]}} transition={{duration:3,repeat:Infinity}} className="absolute -top-6 -left-6 sm:-top-8 sm:-left-8">
                <div className="relative bg-white rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 shadow-lg">
                  <span className="font-bold text-[#1A9E9E] text-xs sm:text-sm flex items-center gap-1"><span>{GREETINGS[0].flag}</span> Hello!</span>
                  <div className="absolute -bottom-1 right-3 w-2.5 h-2.5 bg-white rotate-45"/>
                </div>
              </motion.div>
            </div>
          </div>
          <HeroFunnel lang={lang} onLoginOpen={()=>setLoginOpen(true)}/>
          <img src="/images/google-review.png" alt="Google Reviews 5.0/5" className="h-7 sm:h-8 mt-4 sm:mt-6 opacity-90"/>
          
        </motion.div>
        <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{delay:0.3}} className="hidden lg:flex justify-end relative -mr-20">
          <div className="relative w-[750px] h-[750px]">
            <img src="/images/hero-character.png" alt="Learn languages with Linguo" className="w-full h-full object-contain drop-shadow-2xl" />
            <div className="absolute top-16 left-[15%]">
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

    {/* WA CHAT WIDGET */}
    <a href="https://wa.me/6282116859493" target="_blank"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
      <span className="bg-white text-slate-700 text-sm font-medium px-4 py-2.5 rounded-full shadow-lg border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Need help? Chat with Us</span>
      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-110 transition-transform">
        <MessageCircle className="h-6 w-6 text-white" />
      </div>
    </a>

    {/* PRODUCT CARDS — macOS Dock style */}
    <section className="bg-white py-14 border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-lg sm:text-2xl font-bold text-center mb-1">Semua kebutuhan belajar bahasa ada di Linguo</h2>
        <p className="text-slate-500 text-sm text-center mb-10">Pilih program yang sesuai dengan kebutuhanmu</p>
        <ProductDock setPricingTab={setPricingTab} onSelectProgram={(prog:string)=>{(window as any).__openFunnel?.(prog)}}/>
      </div>
    </section>

    {/* OUR CLIENTS */}
    <section className="py-5 sm:py-10 bg-white border-b border-slate-100 overflow-hidden group">
      <div className="animate-marquee flex items-center gap-16 w-max group-hover:[animation-play-state:paused]" style={{animationDuration:'50s'}}>
        {[...Array(3)].flatMap((_, ri) =>
          [
            { src: "/images/clients/aiesec.png", alt: "AIESEC" },
            { src: "/images/clients/cimsa.png", alt: "CIMSA" },
            { src: "/images/clients/prasetiya-mulya.png", alt: "Prasetiya Mulya" },
            { src: "/images/clients/vaksindo.png", alt: "Vaksindo" },
            { src: "/images/clients/binus.png", alt: "BINUS University" },
            { src: "/images/clients/bitget.png", alt: "Bitget" },
            { src: "/images/clients/gojek.png", alt: "Gojek" },
            { src: "/images/clients/polban.png", alt: "POLBAN" },
            { src: "/images/clients/kai.png", alt: "KAI" },
            { src: "/images/clients/orica.png", alt: "Orica" },
            { src: "/images/clients/mondelez.png", alt: "Mondelez" },
          ].map((logo, i) => (
            <img key={`${ri}-${i}`} src={logo.src} alt={logo.alt} className="h-10 max-w-[200px] w-auto object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
          ))
        )}
      </div>
    </section>

    {/* HOW IT WORKS */}
    <section className="py-8 lg:py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-lg sm:text-3xl lg:text-4xl font-bold text-[#1A9E9E] mb-3">Learning new language is complicated<br/>but we can make it easy for you</h2>
        <p className="text-slate-500 mb-8 lg:mb-16">Linguo helps you to become fluent in many language.</p>
        <div className="hidden lg:flex items-start justify-between max-w-5xl mx-auto">
          {[{img:"/images/step-1.png",s:"Step 1",t:"Select Language",d:"Pilih bahasa yang kamu sukai (bisa memilih lebih dari satu bahasa sekaligus)"},
            {img:"/images/step-2.png",s:"Step 2",t:"Choose The Language Level",d:"Pilih level kemampuanmu (tersedia dari basic hingga advance*)",note:"* untuk beberapa bahasa"},
            {img:"/images/step-3.png",s:"Step 3",t:"Learn & Practice with Linguo",d:"Setelah menyelesaikan pembayaran kamu bisa mulai belajar sesuai jadwal belajar"},
            {img:"/images/step-4.png",s:"Step 4",t:"Level up & Get certified",d:"Setelah delapan sesi, kamu bisa ikut kelas lanjutan hingga mendapatkan e-sertifikat*",note:"* S&K berlaku"}
          ].map((s,i)=>(<div key={i} className="flex items-start">
            <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}} className="flex flex-col items-center w-[200px]">
              <div className="h-[70px] flex items-end justify-center mb-4"><img src={s.img} alt={s.t} className="max-h-[70px] w-auto object-contain"/></div>
              <p className="text-xs text-[#1A9E9E] font-semibold italic mb-1">{s.s}</p>
              <h3 className="text-sm font-bold mb-2 leading-tight">{s.t}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{s.d}</p>
              {s.note&&<p className="text-[10px] text-slate-400 mt-1">{s.note}</p>}
            </motion.div>
            {i<3&&<div className="flex items-center mt-[45px] mx-3 shrink-0"><div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#1A9E9E]"/><div className="w-16 border-t-[1.5px] border-dashed border-[#1A9E9E]/40"/><div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#1A9E9E]"/></div>}
          </div>))}
        </div>
        {/* Mobile: simple grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:hidden">
          {[{img:"/images/step-1.png",s:"Step 1",t:"Select Language",d:"Pilih bahasa yang kamu sukai (bisa memilih lebih dari satu bahasa sekaligus)"},
            {img:"/images/step-2.png",s:"Step 2",t:"Choose the language level",d:"Pilih level kemampuanmu (tersedia dari basic hingga advance*)"},
            {img:"/images/step-3.png",s:"Step 3",t:"Learn & practice with Linguo",d:"Setelah menyelesaikan pembayaran kamu bisa mulai belajar sesuai jadwal belajar"},
            {img:"/images/step-4.png",s:"Step 4",t:"Level up & Get certified",d:"Setelah delapan sesi, kamu bisa ikut kelas lanjutan hingga mendapatkan e-sertifikat*"}
          ].map((s,i)=>(<motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}} className="flex flex-col items-center">
            <img src={s.img} alt={s.t} className="h-20 object-contain mb-4"/>
            <p className="text-xs text-[#1A9E9E] font-semibold italic mb-1">{s.s}</p>
            <h3 className="text-sm font-bold mb-2">{s.t}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{s.d}</p>
          </motion.div>))}
        </div>
      </div>
    </section>

    {/* POPULAR CLASS */}
    <section className="py-8 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl sm:text-3xl font-bold">Most popular class</h2>
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
                    <img src={c.img} alt={c.l} className="w-full h-full object-cover"/>
                    <span className="absolute top-3 left-3 bg-[#1A9E9E] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                      <img src={`https://flagcdn.com/w20/${c.fc}.png`} alt="" className="h-3.5 w-3.5 rounded-full object-cover"/> {c.l}
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

    {/* WHY LINGUO */}
    <section className="py-16 lg:py-24 bg-white relative overflow-hidden">
      <img src="/images/wave-line.png" alt="" className="absolute top-1/2 left-0 w-full -translate-y-1/2 pointer-events-none opacity-60"/>
      <div className="relative z-10">
        <h2 className="text-xl sm:text-3xl font-bold text-center text-[#1A9E9E] mb-4">Why Linguo?</h2>
        <WhyCarousel/>
      </div>
    </section>

    {/* TEACHERS */}
    <section id="teacher" className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-xl sm:text-3xl font-bold mb-3">Meet Our Teacher</h2>
        <p className="text-slate-500 mb-14">Linguo helps you to become fluent in many language.</p>
        <TeacherGrid/>
      </div>
    </section>

    {/* TESTIMONIAL */}
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-10 lg:mb-14">Story from our student</h2>
        <TestimonialCarousel/>
      </div>
    </section>

    {/* PRICING */}
    <PricingSection tab={pricingTab} setTab={setPricingTab} onGetStarted={(prog:string)=>{(window as any).__openFunnel?.(prog)}}/>

    {/* CTA */}
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">Learning is journey<br/>Start now & Grow up with Linguo</h2>
        <p className="text-slate-500 mb-4 sm:mb-8 max-w-lg mx-auto">Linguo helps you to become fluent in many language through interactive classes that always prioritizes practice.</p>
        <a href="https://wa.me/6282116859493" target="_blank" className="inline-flex items-center gap-2 bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold px-8 py-4 rounded-full transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">Mulai Belajar</a>
      </div>
    </section>

    {/* FAQ */}
    <section id="faq" className="py-16 lg:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest text-center mb-2">LEARN HOW TO GET STARTED</p>
        <h2 className="text-xl sm:text-3xl font-bold text-center mb-3">Frequently Asked Questions</h2>
        <p className="text-[#1A9E9E] text-sm font-semibold text-center mb-10 cursor-pointer hover:underline">Contact Support</p>
        <div>{FAQS.map((f,i)=><FAQ key={i} q={f.q} a={f.a}/>)}</div>
      </div>
    </section>

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
          <div><h4 className="font-bold mb-4">Teaching</h4>
            <a href="/jadi-pengajar" target="_blank" className="text-sm text-white/80 mb-6 block hover:text-white transition-colors">Become a Teacher</a>
            <div className="text-sm text-white/80 space-y-1">
              <p>Happy Creative Hub, Jl. Cisitu Indah III No.2,</p><p>Dago, Coblong, Bandung 40135</p>
              <p className="mt-3">Tel: (022) 85942550</p><p>Email: official.linguo@gmail.com</p>
            </div>
            <div className="flex gap-3 mt-4">{["ig","fb","tt","li","yt"].map(s=>(<a key={s} href={s==="ig"?"https://instagram.com/linguo.id":"#"} target="_blank" className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"><AtSign className="h-3.5 w-3.5"/></a>))}</div>
          </div>
        </div>
        <div className="border-t border-white/20 pt-6 text-center text-sm text-white/60">© {new Date().getFullYear()} PT. Linguo Edu Indonesia</div>
      </div>
    </footer>
  </>);
}
