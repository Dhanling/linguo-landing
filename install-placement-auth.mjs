#!/usr/bin/env node
/**
 * install-placement-auth.mjs
 * 
 * Script ini:
 * 1. Buat src/components/AuthModal.tsx langsung di repo
 * 2. Patch PlacementTest.tsx (auth gate di CTA)
 * 3. Patch auth/callback/page.tsx (redirect ke wizard)
 * 
 * Cara pakai:
 *   cd ~/linguo-landing && node install-placement-auth.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

function write(filePath, content) {
  const abs = path.join(ROOT, filePath);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
  console.log(`✅  Created: ${filePath}`);
}

function patchFile(filePath, patches) {
  const abs = path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) {
    console.error(`❌  File tidak ditemukan: ${abs}`);
    process.exit(1);
  }
  let src = fs.readFileSync(abs, "utf8");
  for (const { find, replace, label } of patches) {
    if (!src.includes(find)) {
      console.error(`❌  Patch "${label}" gagal — string tidak ditemukan`);
      console.error(`    Cari: ${find.slice(0, 80)}...`);
      process.exit(1);
    }
    src = src.replace(find, replace);
    console.log(`    ✓ ${label}`);
  }
  fs.writeFileSync(abs, src, "utf8");
  console.log(`✅  Patched: ${filePath}\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Buat AuthModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
console.log("📝  Step 1: Membuat AuthModal.tsx...\n");

write("src/components/AuthModal.tsx", `"use client";

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
`);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Patch PlacementTest.tsx
// ─────────────────────────────────────────────────────────────────────────────
console.log("📝  Step 2: Patching PlacementTest.tsx...");

patchFile("src/app/silabus/[lang]/coba/PlacementTest.tsx", [
  {
    label: "Tambah import AuthModal dan supabase",
    find: `"use client";

import { useState, useEffect, useRef } from "react";`,
    replace: `"use client";

import { useState, useEffect, useRef } from "react";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/lib/supabase-client";`,
  },
  {
    label: "Tambah state showAuthModal dan checkingSession",
    find: `  const [unlocked, setUnlocked] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [waValue, setWaValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateError, setGateError] = useState("");`,
    replace: `  const [unlocked, setUnlocked] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [waValue, setWaValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateError, setGateError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);`,
  },
  {
    label: "Ganti handleStartLearning dengan auth gate",
    find: `  const handleStartLearning = () => {
    const w = window as any;
    const langFull = "Bahasa " + meta.name;
    const sourceTag = "placement-test-" + meta.slug;
    // Get prefill data from localStorage (set by soft-gate submit)
    let prefillName = "";
    let prefillWa = "";
    try {
      const stored = localStorage.getItem("linguo_prefill");
      if (stored) {
        const data = JSON.parse(stored);
        prefillName = data.name || "";
        prefillWa = data.whatsapp || "";
      }
    } catch {}
    if (typeof w.__openFunnel === "function") {
      try {
        w.__openFunnel({
          language: langFull, level: result.sublevel,
          preferredProgram: "Kelas Private", source: sourceTag,
          prefillName, prefillWa,
        });
      } catch { w.__openFunnel(langFull); }
    } else {
      window.location.href = "/?lang=" + encodeURIComponent(langFull) + "&from=" + sourceTag + "&level=" + result.sublevel;
    }
  };`,
    replace: `  const savePlacementIntent = () => {
    try {
      const intentData = JSON.stringify({
        lang: meta.slug,
        langFull: "Bahasa " + meta.name,
        level: result.sublevel,
        source: "placement-test-" + meta.slug,
      });
      document.cookie = "linguo_placement_intent=" + encodeURIComponent(intentData) + ";path=/;max-age=600";
    } catch {}
  };

  const openWizardPrefilled = () => {
    const w = window as any;
    const langFull = "Bahasa " + meta.name;
    const sourceTag = "placement-test-" + meta.slug;
    let prefillName = "";
    let prefillWa = "";
    try {
      const stored = localStorage.getItem("linguo_prefill");
      if (stored) {
        const data = JSON.parse(stored);
        prefillName = data.name || "";
        prefillWa = data.whatsapp || "";
      }
    } catch {}
    if (typeof w.__openFunnel === "function") {
      try {
        w.__openFunnel({
          language: langFull, level: result.sublevel,
          preferredProgram: "Kelas Private", source: sourceTag,
          prefillName, prefillWa,
        });
      } catch { w.__openFunnel(langFull); }
    } else {
      window.location.href = "/?lang=" + encodeURIComponent(langFull) + "&from=" + sourceTag + "&level=" + result.sublevel;
    }
  };

  const handleStartLearning = async () => {
    setCheckingSession(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        openWizardPrefilled();
      } else {
        savePlacementIntent();
        setShowAuthModal(true);
      }
    } catch {
      openWizardPrefilled();
    } finally {
      setCheckingSession(false);
    }
  };

  const handleAuthSuccess = (_userId: string) => {
    setShowAuthModal(false);
    openWizardPrefilled();
  };`,
  },
  {
    label: "Update tombol Langsung Daftar dengan loading state",
    find: `          <button onClick={handleStartLearning}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-lg hover:bg-[#147a7a] shadow-xl shadow-[#1A9E9E]/20 transition-all group">
            Langsung Daftar Kelas
            <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>`,
    replace: `          <button onClick={handleStartLearning} disabled={checkingSession}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1A9E9E] text-white rounded-full font-bold text-lg hover:bg-[#147a7a] shadow-xl shadow-[#1A9E9E]/20 transition-all group disabled:opacity-70 disabled:cursor-wait">
            {checkingSession ? (
              <>
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Langsung Daftar Kelas
                <Icons.ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>`,
  },
  {
    label: "Tambah AuthModal di return ResultScreen",
    find: `      </div>
    </motion.section>
  );
}
// ════════════════════════════════════════════════════════════════════════════
// DragDrop Renderer`,
    replace: `      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        intent={\`Simpan hasil test \${meta.flag} & lanjut daftar kelas\`}
      />
    </motion.section>
  );
}
// ════════════════════════════════════════════════════════════════════════════
// DragDrop Renderer`,
  },
]);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Patch auth/callback/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
console.log("📝  Step 3: Patching auth/callback/page.tsx...");

patchFile("src/app/auth/callback/page.tsx", [
  {
    label: "Tambah parsePlacementIntent helper",
    find: `function deleteCookie(name: string) {
  document.cookie = name + "=;path=/;max-age=0";
}`,
    replace: `function deleteCookie(name: string) {
  document.cookie = name + "=;path=/;max-age=0";
}

function parsePlacementIntent(): { lang: string; langFull: string; level: string; source: string } | null {
  try {
    const raw = getCookie("linguo_placement_intent");
    if (!raw) return null;
    deleteCookie("linguo_placement_intent");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}`,
  },
  {
    label: "Handle placement intent redirect",
    find: `          setStatus("success");

          // Redirect to student dashboard after short delay
          setTimeout(() => {
            window.location.href = "/akun";
          }, 1800);`,
    replace: `          setStatus("success");

          // Cek apakah ada placement intent → redirect ke wizard, bukan /akun
          const placementIntent = parsePlacementIntent();
          const redirectTarget = placementIntent
            ? "/?lang=" + encodeURIComponent(placementIntent.langFull)
              + "&level=" + encodeURIComponent(placementIntent.level)
              + "&from=" + encodeURIComponent(placementIntent.source)
              + "&openFunnel=1"
            : "/akun";

          setTimeout(() => {
            window.location.href = redirectTarget;
          }, 1800);`,
  },
]);

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY
// ─────────────────────────────────────────────────────────────────────────────
console.log("🔍  Verifikasi...\n");
const pt = fs.readFileSync(path.join(ROOT, "src/app/silabus/[lang]/coba/PlacementTest.tsx"), "utf8");
const cb = fs.readFileSync(path.join(ROOT, "src/app/auth/callback/page.tsx"), "utf8");
const am = fs.readFileSync(path.join(ROOT, "src/components/AuthModal.tsx"), "utf8");

const checks = [
  { check: am.includes("handleGoogle"), label: "AuthModal: handleGoogle ada" },
  { check: pt.includes("import AuthModal"), label: "PlacementTest: AuthModal diimport" },
  { check: pt.includes("showAuthModal"), label: "PlacementTest: state showAuthModal ada" },
  { check: pt.includes("checkingSession"), label: "PlacementTest: checkingSession ada" },
  { check: cb.includes("parsePlacementIntent"), label: "Callback: parsePlacementIntent ada" },
  { check: cb.includes("openFunnel=1"), label: "Callback: redirect ke wizard ada" },
];

let ok = true;
for (const c of checks) {
  console.log(c.check ? `  ✅  ${c.label}` : `  ❌  ${c.label}`);
  if (!c.check) ok = false;
}

if (!ok) { console.error("\n❌  Ada check gagal!"); process.exit(1); }

console.log("\n✅  Semua check passed!\n");
console.log("📋  Sekarang jalankan:");
console.log('    git add -A && git commit -m "feat(placement): auth gate → wizard pre-filled" && git push\n');

import { unlinkSync } from "fs";
import { fileURLToPath as ftu } from "url";
try { unlinkSync(ftu(import.meta.url)); } catch {}
console.log("🗑️   Script auto-deleted.\n");
