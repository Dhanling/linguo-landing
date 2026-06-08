// PATCH_SWORN_TRANSLATOR_LANDING_V1
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stamp,
  FileText,
  Languages,
  Briefcase,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Link2,
  Scale,
  ShieldCheck,
  Globe,
  BookOpen,
  Heart,
  Wrench,
  ArrowRight,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS = [
  { num: 1, title: "Data Diri" },
  { num: 2, title: "Kredensial" },
  { num: 3, title: "Bahasa" },
  { num: 4, title: "Dokumen" },
  { num: 5, title: "Review" },
];

const LANGS = [
  { code: "id", name: "Indonesia", flag: "🇮🇩" },
  { code: "en", name: "Inggris", flag: "🇬🇧" },
  { code: "ar", name: "Arab", flag: "🇸🇦" },
  { code: "zh", name: "Mandarin", flag: "🇨🇳" },
  { code: "ja", name: "Jepang", flag: "🇯🇵" },
  { code: "ko", name: "Korea", flag: "🇰🇷" },
  { code: "de", name: "Jerman", flag: "🇩🇪" },
  { code: "fr", name: "Prancis", flag: "🇫🇷" },
  { code: "es", name: "Spanyol", flag: "🇪🇸" },
  { code: "nl", name: "Belanda", flag: "🇳🇱" },
  { code: "ru", name: "Rusia", flag: "🇷🇺" },
  { code: "pt", name: "Portugis", flag: "🇵🇹" },
  { code: "it", name: "Italia", flag: "🇮🇹" },
  { code: "th", name: "Thailand", flag: "🇹🇭" },
  { code: "vi", name: "Vietnam", flag: "🇻🇳" },
  { code: "fa", name: "Persia", flag: "🇮🇷" },
  { code: "he", name: "Ibrani", flag: "🇮🇱" },
  { code: "tr", name: "Turki", flag: "🇹🇷" },
];

const SPECIALIZATIONS = [
  {
    value: "legal",
    label: "Hukum & Legal",
    desc: "Kontrak, akta, putusan",
    Icon: Scale,
  },
  {
    value: "imigrasi",
    label: "Imigrasi",
    desc: "Visa, paspor, kewarganegaraan",
    Icon: ShieldCheck,
  },
  {
    value: "bisnis",
    label: "Bisnis & Korporat",
    desc: "Annual report, MoU",
    Icon: Briefcase,
  },
  {
    value: "akademik",
    label: "Akademik",
    desc: "Ijazah, transkrip, riset",
    Icon: BookOpen,
  },
  {
    value: "medis",
    label: "Medis",
    desc: "Rekam medis, jurnal",
    Icon: Heart,
  },
  {
    value: "teknis",
    label: "Teknis & Engineering",
    desc: "Manual, paten, spesifikasi",
    Icon: Wrench,
  },
];

const AREAS = [
  { value: "jakarta", label: "Jakarta" },
  { value: "bandung", label: "Bandung" },
  { value: "surabaya", label: "Surabaya" },
  { value: "yogyakarta", label: "Yogyakarta" },
  { value: "bali", label: "Bali" },
  { value: "remote", label: "Remote / Online" },
  { value: "nationwide", label: "Seluruh Indonesia" },
];

const STATUS_MESSAGES: Record<string, string> = {
  registered:
    "Aplikasi penerjemah tersumpah kamu dengan kontak ini sedang dalam status terdaftar — tunggu review tim kami.",
  reviewed:
    "Aplikasi kamu sedang direview oleh tim Linguo. Mohon tunggu konfirmasi.",
  approved:
    "Kamu sudah terdaftar di pool penerjemah tersumpah Linguo. Silakan hubungi admin jika ada update.",
};

// WhatsApp admin Linguo
const WA = "6285798745252";
const waMsg = (text: string) =>
  `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

// Framer motion presets
const fade = {
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};
const slideIn = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.25 },
};

// ============================================================================
// TYPES
// ============================================================================

type DupStatus = "idle" | "checking" | "ok" | "blocking";
type DupCheckState = { status: DupStatus; appStatus: string | null };
type LangPair = { source: string; target: string };

const langName = (code: string) =>
  LANGS.find((l) => l.code === code)?.name || code;
const langFlag = (code: string) =>
  LANGS.find((l) => l.code === code)?.flag || "";

// Basic URL validation (must start with http or https)
const isValidUrl = (url: string) => {
  if (!url?.trim()) return true; // optional fields
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function JadiPenerjemahTersumpahPage() {
  const [step, setStep] = useState(0);

  // Step 1: Data diri + area
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string[]>([]);
  const [emailCheck, setEmailCheck] = useState<DupCheckState>({
    status: "idle",
    appStatus: null,
  });
  const [phoneCheck, setPhoneCheck] = useState<DupCheckState>({
    status: "idle",
    appStatus: null,
  });

  // Step 2: Kredensial sumpah
  const [skNumber, setSkNumber] = useState("");
  const [skDate, setSkDate] = useState("");
  const [yearsExp, setYearsExp] = useState("");

  // Step 3: Bahasa & spesialisasi
  const [langPairs, setLangPairs] = useState<LangPair[]>([
    { source: "id", target: "" },
  ]);
  const [specialization, setSpecialization] = useState<string[]>([]);

  // Step 4: Dokumen & catatan
  const [skDocUrl, setSkDocUrl] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [sampleUrl, setSampleUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [note, setNote] = useState("");

  // Submit state
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ==========================================================================
  // DUP CHECK (mirror teacher pattern)
  // ==========================================================================

  const checkDup = useCallback(
    async (
      field: "email" | "phone",
      value: string,
      setter: (s: DupCheckState) => void
    ) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setter({ status: "idle", appStatus: null });
        return;
      }
      // Basic format validation before hitting API
      if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setter({ status: "idle", appStatus: null });
        return;
      }
      if (field === "phone" && trimmed.replace(/\D/g, "").length < 9) {
        setter({ status: "idle", appStatus: null });
        return;
      }

      setter({ status: "checking", appStatus: null });
      try {
        const params = new URLSearchParams({ [field]: trimmed });
        const res = await fetch(
          `/api/sworn-translator-apply?${params.toString()}`
        );
        const data = await res.json();
        const match = data[field];
        if (match?.blocking) {
          setter({ status: "blocking", appStatus: match.status });
        } else {
          setter({ status: "ok", appStatus: null });
        }
      } catch {
        setter({ status: "idle", appStatus: null });
      }
    },
    []
  );

  const onEmailChange = (v: string) => {
    setEmail(v);
    if (emailCheck.status !== "idle") {
      setEmailCheck({ status: "idle", appStatus: null });
    }
  };
  const onPhoneChange = (v: string) => {
    setPhone(v);
    if (phoneCheck.status !== "idle") {
      setPhoneCheck({ status: "idle", appStatus: null });
    }
  };
  const handleEmailBlur = () => checkDup("email", email, setEmailCheck);
  const handlePhoneBlur = () => checkDup("phone", phone, setPhoneCheck);

  // ==========================================================================
  // LANG PAIRS
  // ==========================================================================

  const addLangPair = () => {
    if (langPairs.length < 5) {
      setLangPairs([...langPairs, { source: "id", target: "" }]);
    }
  };
  const removeLangPair = (idx: number) => {
    setLangPairs(langPairs.filter((_, i) => i !== idx));
  };
  const updateLangPair = (idx: number, key: keyof LangPair, value: string) => {
    setLangPairs(
      langPairs.map((p, i) => (i === idx ? { ...p, [key]: value } : p))
    );
  };

  const validPairs = langPairs.filter(
    (p) => p.source && p.target && p.source !== p.target
  );

  // ==========================================================================
  // MULTI-SELECT TOGGLES
  // ==========================================================================

  const toggleSpec = (v: string) => {
    setSpecialization((prev) =>
      prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]
    );
  };
  const toggleArea = (v: string) => {
    setArea((prev) =>
      prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]
    );
  };

  // ==========================================================================
  // STEP VALIDATION
  // ==========================================================================

  const canNext = (s: number): boolean => {
    if (s === 1) {
      return (
        name.trim().length > 1 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
        phone.replace(/\D/g, "").length >= 9 &&
        emailCheck.status !== "blocking" &&
        phoneCheck.status !== "blocking" &&
        area.length > 0
      );
    }
    if (s === 2) {
      return skNumber.trim().length > 3;
    }
    if (s === 3) {
      return validPairs.length > 0 && specialization.length > 0;
    }
    if (s === 4) {
      // Dokumen optional, tapi URL harus valid kalau diisi
      return (
        isValidUrl(skDocUrl) &&
        isValidUrl(cvUrl) &&
        isValidUrl(sampleUrl) &&
        isValidUrl(portfolioUrl)
      );
    }
    return true;
  };

  // ==========================================================================
  // SUBMIT
  // ==========================================================================

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/sworn-translator-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          sk_menkumham_number: skNumber.trim(),
          sk_menkumham_date: skDate || null,
          language_pairs: validPairs,
          specialization,
          area,
          years_experience: yearsExp ? parseInt(yearsExp, 10) : null,
          sk_document_url: skDocUrl.trim() || null,
          cv_url: cvUrl.trim() || null,
          sample_translation_url: sampleUrl.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
          note: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "duplicate") {
          setSubmitError(
            data.message ||
              "Email atau nomor WhatsApp kamu sudah terdaftar di sistem kami."
          );
        } else {
          setSubmitError(
            data.error || "Terjadi kesalahan. Silakan coba lagi."
          );
        }
        return;
      }
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setSubmitError(e.message || "Gagal mengirim. Cek koneksi kamu.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // LANDING VIEW (step 0)
  // ==========================================================================

  if (step === 0) {
    return (
      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* HEADER */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/images/logo-color.png"
                alt="Linguo"
                className="h-8"
              />
            </Link>
            <button
              onClick={() => setStep(1)}
              className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all"
            >
              Daftar Sekarang
            </button>
          </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8] text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-9xl">⚖️</div>
            <div className="absolute bottom-10 right-10 text-9xl">📜</div>
          </div>
          <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center">
            <motion.div {...fade}>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
                <Stamp className="h-3.5 w-3.5" />
                <span>Recruitment Penerjemah Tersumpah</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
                Bergabung dengan Pool
                <br />
                <span className="text-[#fbbf24]">
                  Penerjemah Tersumpah
                </span>{" "}
                Linguo
              </h1>
              <p className="text-white/80 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                Dapatkan akses ke project terjemahan tersumpah dari klien
                korporat & individu di seluruh Indonesia. Rate kompetitif,
                pembayaran on-time, dashboard transparan.
              </p>
              <button
                onClick={() => setStep(1)}
                className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-10 py-4 rounded-full transition-all active:scale-95 text-sm"
              >
                Daftar Sekarang →
              </button>
              <p className="text-white/60 text-xs mt-4">
                Proses pendaftaran ± 5-7 menit • Gratis
              </p>
            </motion.div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-14">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">
                Kenapa Linguo
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Benefit Bergabung dengan Pool Kami
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  Icon: Sparkles,
                  title: "Rate Kompetitif",
                  desc: "Mulai Rp 120.000/halaman dengan multiplier 1.5× untuk express order.",
                },
                {
                  Icon: Clock,
                  title: "Pembayaran On-Time",
                  desc: "Pembayaran bulanan tepat waktu via transfer bank, transparan via dashboard.",
                },
                {
                  Icon: Globe,
                  title: "Klien Beragam",
                  desc: "Korporat, individu, lembaga pendidikan, dari berbagai daerah & negara.",
                },
                {
                  Icon: ShieldCheck,
                  title: "Project Aman",
                  desc: "Semua project melalui kontrak resmi, NDA tersedia untuk dokumen sensitif.",
                },
                {
                  Icon: Briefcase,
                  title: "Fleksibel",
                  desc: "Pilih project yang sesuai bidang & ketersediaan kamu — gak ada quota wajib.",
                },
                {
                  Icon: Award,
                  title: "Tier Reward",
                  desc: "Performa konsisten naik tier (Bronze → Silver → Gold) untuk rate lebih tinggi.",
                },
              ].map((b, i) => (
                <motion.div
                  key={i}
                  {...fade}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-6 border border-slate-100"
                >
                  <div className="w-11 h-11 bg-[#1A9E9E]/10 text-[#1A9E9E] rounded-xl flex items-center justify-center mb-4">
                    <b.Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-base mb-1.5">{b.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {b.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SPECIALIZATIONS PREVIEW */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-12">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">
                Bidang Spesialisasi
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Bidang yang Sedang Dibutuhkan
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SPECIALIZATIONS.map((s, i) => (
                <motion.div
                  key={s.value}
                  {...fade}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <s.Icon
                      className="h-5 w-5 text-[#1A9E9E]"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{s.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div {...fade} className="text-center mb-14">
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-widest mb-2">
                Prosesnya Mudah
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold">
                4 Langkah Bergabung
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  num: "01",
                  title: "Isi Form Online",
                  desc: "Lengkapi data, kredensial sumpah, dan bahasa yang dikuasai",
                },
                {
                  num: "02",
                  title: "Review Kredensial",
                  desc: "Tim kami verifikasi SK Menkumham dan dokumen pendukung",
                },
                {
                  num: "03",
                  title: "Onboarding",
                  desc: "Briefing workflow, kontrak partnership, akses dashboard",
                },
                {
                  num: "04",
                  title: "Terima Project!",
                  desc: "Notifikasi assignment masuk, akses dashboard real-time",
                },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  {...fade}
                  transition={{ delay: i * 0.12 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 bg-[#1A9E9E]/10 text-[#1A9E9E] font-bold text-lg rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {s.num}
                  </div>
                  <h3 className="font-bold text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-[#0d4f4f] via-[#1A9E9E] to-[#24b8b8]">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <motion.div {...fade}>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Siap Bergabung?
              </h2>
              <p className="text-white/70 text-sm mb-8">
                Pastikan kamu sudah disumpah dan punya SK Menkumham. Proses
                pendaftaran ± 5-7 menit.
              </p>
              <button
                onClick={() => {
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-10 py-4 rounded-full transition-all active:scale-95 text-sm"
              >
                Daftar Sekarang →
              </button>
            </motion.div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#14726E] text-white py-10">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <Link href="/" className="inline-block mb-4">
              <img
                src="/images/logo-white.png"
                alt="Linguo"
                className="h-10 mx-auto"
              />
            </Link>
            <p className="text-white/60 text-sm mb-2">PT. Linguo Edu Indonesia</p>
            <p className="text-white/40 text-xs">
              Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong,
              Bandung 40135
            </p>
            <div className="border-t border-white/20 mt-6 pt-6 text-xs text-white/40">
              © {new Date().getFullYear()} Linguo.id
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================================================
  // WIZARD VIEW (step 1-5)
  // ==========================================================================

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* WIZARD HEADER */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => (step === 1 ? setStep(0) : setStep(step - 1))}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            ← {step === 1 ? "Kembali" : "Sebelumnya"}
          </button>
          <span className="text-sm font-semibold text-[#1A9E9E]">
            Pendaftaran Penerjemah Tersumpah
          </span>
          <span className="text-xs text-slate-400">Step {step}/5</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <motion.div
            className="h-full bg-[#1A9E9E]"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </header>

      {/* STEP INDICATORS */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 ${
                step >= s.num ? "text-[#1A9E9E]" : "text-slate-300"
              }`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.num
                    ? "bg-[#1A9E9E] text-white"
                    : step === s.num
                    ? "bg-[#1A9E9E]/10 text-[#1A9E9E] ring-2 ring-[#1A9E9E]"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold">{s.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WIZARD CONTENT */}
      <div className="flex-1 py-8">
        <div className="max-w-xl mx-auto px-4">
          <AnimatePresence mode="wait">
            {/* ============================================================== */}
            {/* STEP 1: DATA DIRI + AREA                                       */}
            {/* ============================================================== */}
            {step === 1 && (
              <motion.div key="step1" {...slideIn} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Data Diri</h2>
                  <p className="text-sm text-slate-500">
                    Isi info kontak dan area kerja kamu
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap kamu"
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      onBlur={handleEmailBlur}
                      placeholder="email@example.com"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                        emailCheck.status === "blocking"
                          ? "border-red-300 focus:border-red-500 bg-red-50/30"
                          : emailCheck.status === "ok"
                          ? "border-green-300 focus:border-green-500"
                          : "border-slate-200 focus:border-[#1A9E9E]"
                      }`}
                    />
                    {emailCheck.status === "checking" && (
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <Loader2 className="animate-spin h-3 w-3" />
                        Mengecek email...
                      </p>
                    )}
                    {emailCheck.status === "ok" && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Email belum terdaftar
                      </p>
                    )}
                    {emailCheck.status === "blocking" && (
                      <div className="mt-1.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 leading-relaxed flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>
                            {STATUS_MESSAGES[emailCheck.appStatus!] ||
                              "Email ini sudah terdaftar di sistem kami."}
                          </span>
                        </p>
                        <a
                          href={waMsg(
                            `Halo, saya cek pendaftaran penerjemah tersumpah dengan email ${email}`
                          )}
                          target="_blank"
                          className="inline-block mt-2 text-xs font-semibold text-red-700 underline hover:text-red-800"
                        >
                          Tanya admin via WhatsApp →
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                      No. WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => onPhoneChange(e.target.value)}
                      onBlur={handlePhoneBlur}
                      placeholder="0812-3456-7890"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
                        phoneCheck.status === "blocking"
                          ? "border-red-300 focus:border-red-500 bg-red-50/30"
                          : phoneCheck.status === "ok"
                          ? "border-green-300 focus:border-green-500"
                          : "border-slate-200 focus:border-[#1A9E9E]"
                      }`}
                    />
                    {phoneCheck.status === "checking" && (
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <Loader2 className="animate-spin h-3 w-3" />
                        Mengecek nomor WhatsApp...
                      </p>
                    )}
                    {phoneCheck.status === "ok" && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Nomor belum terdaftar
                      </p>
                    )}
                    {phoneCheck.status === "blocking" && (
                      <div className="mt-1.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 leading-relaxed flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>
                            {STATUS_MESSAGES[phoneCheck.appStatus!] ||
                              "Nomor WhatsApp ini sudah terdaftar di sistem kami."}
                          </span>
                        </p>
                        <a
                          href={waMsg(
                            `Halo, saya cek pendaftaran penerjemah tersumpah dengan WA ${phone}`
                          )}
                          target="_blank"
                          className="inline-block mt-2 text-xs font-semibold text-red-700 underline hover:text-red-800"
                        >
                          Tanya admin via WhatsApp →
                        </a>
                      </div>
                    )}
                  </div>

                  {/* AREA */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Area Kerja * (pilih semua yang relevan)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {AREAS.map((a) => {
                        const selected = area.includes(a.value);
                        return (
                          <button
                            key={a.value}
                            type="button"
                            onClick={() => toggleArea(a.value)}
                            className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                              selected
                                ? "bg-[#1A9E9E]/5 border-[#1A9E9E] text-[#1A9E9E]"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {selected && (
                              <CheckCircle2 className="inline h-4 w-4 mr-1.5" />
                            )}
                            {a.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STEP 2: KREDENSIAL SUMPAH                                      */}
            {/* ============================================================== */}
            {step === 2 && (
              <motion.div key="step2" {...slideIn} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Kredensial Sumpah</h2>
                  <p className="text-sm text-slate-500">
                    Detail SK Menkumham dan pengalaman kamu
                  </p>
                </div>

                <div className="p-4 bg-[#1A9E9E]/5 border border-[#1A9E9E]/20 rounded-xl flex items-start gap-3">
                  <Stamp className="h-5 w-5 text-[#1A9E9E] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    Pastikan kamu sudah disumpah resmi dan punya{" "}
                    <strong>SK Pengangkatan Penerjemah Tersumpah</strong> dari
                    Kementerian Hukum dan HAM (Menkumham) RI.
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                    Nomor SK Menkumham *
                  </label>
                  <input
                    type="text"
                    value={skNumber}
                    onChange={(e) => setSkNumber(e.target.value)}
                    placeholder="Contoh: AHU-12345.AH.02.05.TAHUN.2023"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors font-mono"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    Nomor SK lengkap sesuai yang tertera di dokumen pengangkatan
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Tanggal SK Menkumham
                    <span className="font-normal text-slate-400">(opsional)</span>
                  </label>
                  <input
                    type="date"
                    value={skDate}
                    onChange={(e) => setSkDate(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                    Pengalaman sebagai Penerjemah Tersumpah
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: "0", label: "< 1 tahun" },
                      { value: "1", label: "1-2 tahun" },
                      { value: "3", label: "3-5 tahun" },
                      { value: "6", label: "6-10 tahun" },
                      { value: "11", label: "10+ tahun" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setYearsExp(opt.value)}
                        className={`text-sm px-4 py-3 rounded-xl border-2 transition-all text-left ${
                          yearsExp === opt.value
                            ? "bg-[#1A9E9E]/5 border-[#1A9E9E] text-[#1A9E9E] font-semibold"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STEP 3: BAHASA & SPESIALISASI                                  */}
            {/* ============================================================== */}
            {step === 3 && (
              <motion.div key="step3" {...slideIn} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    Bahasa & Spesialisasi
                  </h2>
                  <p className="text-sm text-slate-500">
                    Pasangan bahasa yang kamu kuasai dan bidang spesialisasi
                  </p>
                </div>

                {/* LANGUAGE PAIRS */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5" />
                    Pasangan Bahasa * (max 5)
                  </label>
                  <div className="space-y-3">
                    {langPairs.map((pair, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                          <select
                            value={pair.source}
                            onChange={(e) =>
                              updateLangPair(idx, "source", e.target.value)
                            }
                            className="border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white"
                          >
                            <option value="">Dari...</option>
                            {LANGS.map((l) => (
                              <option key={l.code} value={l.code}>
                                {l.flag} {l.name}
                              </option>
                            ))}
                          </select>
                          <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <select
                            value={pair.target}
                            onChange={(e) =>
                              updateLangPair(idx, "target", e.target.value)
                            }
                            className="border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors bg-white"
                          >
                            <option value="">Ke...</option>
                            {LANGS.filter((l) => l.code !== pair.source).map(
                              (l) => (
                                <option key={l.code} value={l.code}>
                                  {l.flag} {l.name}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => removeLangPair(idx)}
                            aria-label="Hapus pasangan"
                            className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {langPairs.length < 5 && (
                      <button
                        type="button"
                        onClick={addLangPair}
                        className="text-sm text-[#1A9E9E] font-semibold hover:bg-[#1A9E9E]/5 px-4 py-2 rounded-lg transition-colors"
                      >
                        + Tambah pasangan bahasa
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Tip: kamu boleh isi pasangan dua arah (mis. ID→EN dan EN→ID)
                    sebagai dua entry terpisah
                  </p>
                </div>

                {/* SPECIALIZATION */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-2 block">
                    Bidang Spesialisasi * (pilih semua yang kamu kuasai)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SPECIALIZATIONS.map((s) => {
                      const selected = specialization.includes(s.value);
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => toggleSpec(s.value)}
                          className={`text-left p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 ${
                            selected
                              ? "bg-[#1A9E9E]/5 border-[#1A9E9E]"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <s.Icon
                            strokeWidth={1.75}
                            className={`h-6 w-6 flex-shrink-0 ${
                              selected ? "text-[#1A9E9E]" : "text-slate-500"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{s.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {s.desc}
                            </p>
                          </div>
                          {selected && (
                            <CheckCircle2 className="h-4 w-4 text-[#1A9E9E] flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STEP 4: DOKUMEN & CATATAN                                      */}
            {/* ============================================================== */}
            {step === 4 && (
              <motion.div key="step4" {...slideIn} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Dokumen Pendukung</h2>
                  <p className="text-sm text-slate-500">
                    Upload dokumen ke Google Drive, lalu paste link-nya di sini
                  </p>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Pastikan akses tiap file di-set{" "}
                    <strong>"Anyone with the link can view"</strong> — biar tim
                    kami bisa langsung buka tanpa request access.
                  </p>
                </div>

                {[
                  {
                    label: "Scan SK Menkumham *",
                    value: skDocUrl,
                    setter: setSkDocUrl,
                    placeholder: "https://drive.google.com/...",
                    Icon: Stamp,
                    desc: "SK pengangkatan resmi dari Menkumham",
                  },
                  {
                    label: "CV / Curriculum Vitae",
                    value: cvUrl,
                    setter: setCvUrl,
                    placeholder: "https://drive.google.com/...",
                    Icon: FileText,
                    desc: "CV terbaru kamu",
                  },
                  {
                    label: "Sample Translation",
                    value: sampleUrl,
                    setter: setSampleUrl,
                    placeholder: "https://drive.google.com/...",
                    Icon: Languages,
                    desc: "Contoh hasil terjemahan kamu (1-2 dokumen)",
                  },
                  {
                    label: "Portfolio / Pengalaman",
                    value: portfolioUrl,
                    setter: setPortfolioUrl,
                    placeholder: "https://drive.google.com/...",
                    Icon: Briefcase,
                    desc: "List klien atau project (opsional)",
                  },
                ].map((doc) => {
                  const invalid = doc.value && !isValidUrl(doc.value);
                  return (
                    <div key={doc.label}>
                      <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                        <doc.Icon className="h-3.5 w-3.5" />
                        {doc.label}
                      </label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="url"
                          value={doc.value}
                          onChange={(e) => doc.setter(e.target.value)}
                          placeholder={doc.placeholder}
                          className={`w-full border-2 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${
                            invalid
                              ? "border-red-300 focus:border-red-500 bg-red-50/30"
                              : "border-slate-200 focus:border-[#1A9E9E]"
                          }`}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{doc.desc}</p>
                      {invalid && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Format URL tidak valid (harus dimulai dengan
                          http/https)
                        </p>
                      )}
                    </div>
                  );
                })}

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                    Catatan Tambahan{" "}
                    <span className="font-normal text-slate-400">(opsional)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={4}
                    placeholder="Info tambahan, ketersediaan jadwal, rate ekspektasi, atau hal lain yang perlu kami tau..."
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1A9E9E] transition-colors resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STEP 5: REVIEW & SUBMIT                                        */}
            {/* ============================================================== */}
            {step === 5 && !success && (
              <motion.div key="step5" {...slideIn} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Review & Kirim</h2>
                  <p className="text-sm text-slate-500">
                    Periksa data kamu sebelum mengirim
                  </p>
                </div>

                <div className="bg-white border-2 border-slate-100 rounded-2xl divide-y divide-slate-100">
                  {[
                    { label: "Nama", value: name },
                    { label: "Email", value: email },
                    { label: "WhatsApp", value: phone },
                    {
                      label: "Area Kerja",
                      value:
                        area
                          .map(
                            (a) =>
                              AREAS.find((x) => x.value === a)?.label ?? a
                          )
                          .join(", ") || "-",
                    },
                    { label: "No. SK Menkumham", value: skNumber },
                    { label: "Tanggal SK", value: skDate || "-" },
                    {
                      label: "Pengalaman",
                      value: yearsExp
                        ? {
                            "0": "< 1 tahun",
                            "1": "1-2 tahun",
                            "3": "3-5 tahun",
                            "6": "6-10 tahun",
                            "11": "10+ tahun",
                          }[yearsExp] || `${yearsExp} tahun`
                        : "-",
                    },
                    {
                      label: "Pasangan Bahasa",
                      value:
                        validPairs
                          .map(
                            (p) =>
                              `${langFlag(p.source)} ${langName(
                                p.source
                              )} → ${langFlag(p.target)} ${langName(p.target)}`
                          )
                          .join(" · ") || "-",
                    },
                    {
                      label: "Spesialisasi",
                      value:
                        specialization
                          .map(
                            (s) =>
                              SPECIALIZATIONS.find((x) => x.value === s)
                                ?.label ?? s
                          )
                          .join(", ") || "-",
                    },
                    {
                      label: "SK Document",
                      value: skDocUrl ? "✓ Terlampir" : "-",
                    },
                    { label: "CV", value: cvUrl ? "✓ Terlampir" : "-" },
                    {
                      label: "Sample Translation",
                      value: sampleUrl ? "✓ Terlampir" : "-",
                    },
                    {
                      label: "Portfolio",
                      value: portfolioUrl ? "✓ Terlampir" : "-",
                    },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between px-5 py-3 gap-3">
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {r.label}
                      </span>
                      <span className="text-sm font-medium text-right break-words">
                        {r.value}
                      </span>
                    </div>
                  ))}
                  {note && (
                    <div className="px-5 py-3">
                      <span className="text-xs text-slate-400 block mb-1">
                        Catatan
                      </span>
                      <p className="text-sm text-slate-600">{note}</p>
                    </div>
                  )}
                </div>

                {submitError && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-700 mb-1">
                        Gagal mengirim
                      </p>
                      <p className="text-xs text-red-700 leading-relaxed">
                        {submitError}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* SUCCESS                                                        */}
            {/* ============================================================== */}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2
                    className="h-12 w-12 text-green-600"
                    strokeWidth={2}
                  />
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  Pendaftaran Terkirim!
                </h2>
                <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
                  Data kamu sudah tersimpan. Tim kami akan review SK Menkumham
                  dan menghubungi kamu via WhatsApp dalam 3-7 hari kerja untuk
                  proses selanjutnya.
                </p>
                <Link
                  href="/"
                  className="inline-block bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all"
                >
                  Kembali ke Beranda
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* WIZARD FOOTER */}
      {!success && (
        <div className="bg-white border-t border-slate-100">
          <div className="max-w-xl mx-auto px-4 py-4 flex justify-between">
            <button
              onClick={() => (step === 1 ? setStep(0) : setStep(step - 1))}
              className="text-sm text-slate-500 hover:text-slate-900 px-6 py-3 rounded-full transition-colors"
            >
              ← Kembali
            </button>
            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext(step)}
                className="bg-[#1A9E9E] hover:bg-[#178888] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-full text-sm transition-all active:scale-95"
              >
                Lanjut →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin h-4 w-4" />}
                {loading ? "Mengirim..." : "Kirim Pendaftaran →"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
