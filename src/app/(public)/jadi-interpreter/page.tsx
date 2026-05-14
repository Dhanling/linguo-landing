"use client";

import { useState, Fragment } from "react";
import {
  Languages, BadgeCheck, Wallet, Clock, Upload, Loader2, User, Briefcase, DollarSign,
  FileText, ChevronLeft, ChevronRight, Check, CheckCircle2, MessageCircleMore, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { supabase } from "@/lib/supabase-client";
import {
  SPECIALIZATIONS, CERTIFICATIONS, LANGUAGE_PAIRS_DEFAULT, REFERRAL_SOURCES, GENDERS, MODES,
} from "@/components/interpreter/constants";

const STEPS = [
  { title: "Data Diri",         short: "Profil",    icon: User },
  { title: "Profesi",           short: "Profesi",   icon: Briefcase },
  { title: "Rate & Availability", short: "Rate",    icon: DollarSign },
  { title: "Portfolio",         short: "Portfolio", icon: FileText },
];

type FormState = {
  full_name: string; email: string; whatsapp: string; city: string;
  birth_year: string; gender: string;
  language_pairs: string[]; language_pair_other: string;
  native_languages: string[]; native_language_other: string;
  years_experience: string;
  specializations: string[]; certifications: string[]; certification_other: string;
  modes: string[];
  rate_per_hour: string; rate_per_day: string;
  rate_negotiable: boolean; availability_notes: string;
  portfolio_link: string; referral_source: string;
};

const initialForm: FormState = {
  full_name: "", email: "", whatsapp: "", city: "", birth_year: "", gender: "",
  language_pairs: [], language_pair_other: "",
  native_languages: [], native_language_other: "",
  years_experience: "",
  specializations: [], certifications: [], certification_other: "",
  modes: [],
  rate_per_hour: "", rate_per_day: "", rate_negotiable: false,
  availability_notes: "",
  portfolio_link: "", referral_source: "",
};

export default function JadiInterpreterPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function toggleArray<K extends keyof FormState>(key: K, val: string) {
    setForm((f) => {
      const arr = (f[key] as string[]) || [];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      return { ...f, [key]: next as any };
    });
  }
  function scrollToForm() {
    if (typeof window !== "undefined") {
      document.getElementById("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("CV harus format PDF"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("CV max 5 MB"); return; }
    setCvFile(file);
  }

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!form.full_name.trim()) return "Nama lengkap wajib diisi";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Format email tidak valid";
      const phoneParsed = parsePhoneNumberFromString(form.whatsapp, "ID");
      if (!phoneParsed || !phoneParsed.isValid()) return "Nomor WhatsApp tidak valid";
      if (!form.city.trim()) return "Kota domisili wajib diisi";
    }
    if (s === 1) {
      const langPairs = [...form.language_pairs];
      if (form.language_pair_other.trim()) langPairs.push(form.language_pair_other.trim());
      if (langPairs.length === 0) return "Pilih minimal 1 pasangan bahasa";
      if (!form.years_experience || Number(form.years_experience) < 0) return "Tahun pengalaman wajib";
      if (form.specializations.length === 0) return "Pilih minimal 1 spesialisasi";
      if (form.modes.length === 0) return "Pilih minimal 1 mode interpretasi";
    }
    if (s === 2) {
      // Rate optional — no required fields, but if rate is set must be positive
      if (form.rate_per_hour && Number(form.rate_per_hour) < 0) return "Rate per jam ga boleh negatif";
      if (form.rate_per_day && Number(form.rate_per_day) < 0) return "Rate per hari ga boleh negatif";
    }
    if (s === 3) {
      if (!cvFile) return "Upload CV wajib (PDF, max 5 MB)";
    }
    return null;
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (typeof window !== "undefined") {
      document.getElementById("wizard-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
    if (typeof window !== "undefined") {
      document.getElementById("wizard-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  function jumpTo(s: number) {
    if (s < step) setStep(s);
  }

  async function handleSubmit() {
    for (let i = 0; i < STEPS.length; i++) {
      const err = validateStep(i);
      if (err) { toast.error(err); setStep(i); return; }
    }

    setSubmitting(true);

    const tempId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString();
    const safeName = cvFile!.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const cvPath = `${tempId}/${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("interpreter-cvs")
      .upload(cvPath, cvFile!, { contentType: "application/pdf", upsert: false });
    if (upErr) {
      console.error("[interpreter-cvs upload]", upErr);
      setSubmitting(false);
      return toast.error("Gagal upload CV. Coba lagi.");
    }

    const certs = [...form.certifications];
    if (form.certification_other.trim()) certs.push(form.certification_other.trim());
    const natives = [...form.native_languages];
    if (form.native_language_other.trim()) natives.push(form.native_language_other.trim());
    const langPairs = [...form.language_pairs];
    if (form.language_pair_other.trim()) langPairs.push(form.language_pair_other.trim());

    const phoneParsed = parsePhoneNumberFromString(form.whatsapp, "ID");

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      whatsapp: phoneParsed!.number,
      city: form.city.trim(),
      birth_year: form.birth_year ? Number(form.birth_year) : null,
      gender: form.gender || null,
      language_pairs: langPairs,
      native_languages: natives.length > 0 ? natives : null,
      years_experience: Number(form.years_experience),
      specializations: form.specializations,
      certifications: certs.length > 0 ? certs : null,
      modes: form.modes,
      rate_per_hour: form.rate_per_hour ? Number(form.rate_per_hour) : null,
      rate_per_day: form.rate_per_day ? Number(form.rate_per_day) : null,
      rate_negotiable: form.rate_negotiable,
      availability_notes: form.availability_notes.trim() || null,
      cv_url: cvPath,
      portfolio_link: form.portfolio_link.trim() || null,
      referral_source: form.referral_source || null,
      status: "screening",
    };

    const { error: insErr } = await supabase.from("interpreter_applications").insert(payload);
    setSubmitting(false);

    if (insErr) {
      console.error("[interpreter_applications insert]", insErr);
      return toast.error("Gagal kirim lamaran. Coba lagi.");
    }
    toast.success("Lamaran berhasil dikirim!");
    setSubmitted(true);
    if (typeof window !== "undefined") {
      document.getElementById("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleReset() {
    setForm(initialForm);
    setCvFile(null);
    setStep(0);
    setSubmitted(false);
  }

  const StepIcon = STEPS[step].icon;

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="bg-gradient-to-b from-emerald-50 via-white to-white pt-20 pb-12 sm:pt-28">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-4">
            <Languages className="h-4 w-4" /> Gabung Pool Interpreter Linguo.id
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Jadi Freelance Interpreter di Linguo
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Kerja remote/onsite, project B2B dari client enterprise, rate transparan.
            Domain expertise lo (legal, medical, conference) match dengan project yang tepat.
          </p>
          <div className="mt-8">
            <button onClick={scrollToForm}
              className="rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">
              Daftar Sekarang
            </button>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Wallet,     t: "Rate kompetitif", d: "Project-based atau hourly. Quote transparan dari klien, no agency markup berlebihan." },
              { icon: BadgeCheck, t: "Pool eksklusif",  d: "Match algorithm prioritize sertifikasi & pengalaman domain." },
              { icon: Clock,      t: "Fleksibel",       d: "Pilih project sesuai availability. No long-term commitment, no in-house pressure." },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="rounded-2xl border border-gray-200 p-6 hover:border-emerald-300 hover:shadow-md transition">
                  <Icon className="h-8 w-8 text-emerald-600 mb-3" />
                  <h3 className="font-semibold text-lg text-gray-900">{b.t}</h3>
                  <p className="text-sm text-gray-600 mt-2">{b.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FORM (WIZARD) */}
      <section id="form" className="py-12 bg-gradient-to-b from-white to-emerald-50">
        <div className="mx-auto max-w-3xl px-4">
          {submitted ? (
            <SuccessCard onReset={handleReset} />
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
                Form Lamaran
              </h2>
              <p className="text-gray-600 text-center mb-8">
                4 langkah singkat — tim Linguo review dalam 3-5 hari kerja.
              </p>

              <StepIndicator step={step} jumpTo={jumpTo} />

              <div id="wizard-card" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Step {step + 1} dari {STEPS.length}</p>
                    <h3 className="font-semibold text-gray-900 text-lg">{STEPS[step].title}</h3>
                  </div>
                </div>

                <div key={step} className="animate-fadeSlide space-y-4">
                  {step === 0 && <Step1Profile form={form} set={set} />}
                  {step === 1 && <Step2Profession form={form} set={set} toggleArray={toggleArray} />}
                  {step === 2 && <Step3Rate form={form} set={set} />}
                  {step === 3 && <Step4Portfolio form={form} set={set} cvFile={cvFile} handleCvChange={handleCvChange} />}
                </div>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <button type="button" onClick={handleBack} disabled={step === 0}
                    className="px-4 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition">
                    <ChevronLeft className="h-4 w-4" /> Kembali
                  </button>
                  {step < STEPS.length - 1 ? (
                    <button type="button" onClick={handleNext}
                      className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20">
                      Lanjut <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit} disabled={submitting}
                      className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20">
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {submitting ? "Mengirim..." : "Kirim Lamaran"}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        :global(.animate-fadeSlide) { animation: fadeSlide 0.3s ease-out; }
      `}</style>
    </main>
  );
}

// ===========================================================================
// Step Indicator (emerald variant)
// ===========================================================================
function StepIndicator({ step, jumpTo }: { step: number; jumpTo: (s: number) => void }) {
  return (
    <div className="mb-8">
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-emerald-600">Step {step + 1} / {STEPS.length}</span>
          <span className="text-xs text-gray-500">{STEPS[step].title}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
      <div className="hidden sm:flex items-center max-w-2xl mx-auto">
        {STEPS.map((s, i) => (
          <Fragment key={i}>
            <button type="button" onClick={() => jumpTo(i)} disabled={i > step}
              className={`group flex flex-col items-center gap-2 ${i < step ? "cursor-pointer" : i === step ? "cursor-default" : "cursor-not-allowed opacity-60"}`}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200
                ${i < step ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" :
                  i === step ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-lg shadow-emerald-600/30" :
                  "bg-gray-100 text-gray-400"}`}>
                {i < step ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i <= step ? "text-gray-900" : "text-gray-400"}`}>{s.short}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-3 mb-6 transition-all duration-300 ${i < step ? "bg-emerald-600" : "bg-gray-200"}`} />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Step 1: Profile
// ===========================================================================
function Step1Profile({ form, set }: any) {
  return (
    <>
      <Field label="Nama lengkap" required>
        <input type="text" value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)} className={inputCls} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" required>
          <input type="email" value={form.email}
            onChange={(e) => set("email", e.target.value)} className={inputCls} />
        </Field>
        <Field label="WhatsApp" required>
          <input type="tel" value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="+62812..." className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Kota domisili" required>
          <input type="text" value={form.city}
            onChange={(e) => set("city", e.target.value)} placeholder="Jakarta" className={inputCls} />
        </Field>
        <Field label="Tahun lahir (opsional)">
          <input type="number" min={1940} max={2015} value={form.birth_year}
            onChange={(e) => set("birth_year", e.target.value)} placeholder="1995" className={inputCls} />
        </Field>
      </div>
      <Field label="Gender (opsional)">
        <div className="flex gap-3">
          {GENDERS.map((g) => (
            <label key={g.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm ${form.gender === g.value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-700"}`}>
              <input type="radio" name="gender" value={g.value}
                checked={form.gender === g.value}
                onChange={(e) => set("gender", e.target.value)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
              {g.label}
            </label>
          ))}
        </div>
      </Field>
    </>
  );
}

// ===========================================================================
// Step 2: Profession
// ===========================================================================
function Step2Profession({ form, set, toggleArray }: any) {
  return (
    <>
      <Field label="Pasangan bahasa" required>
        <p className="text-xs text-gray-500 mb-2">Pilih semua yang lo bisa handle.</p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_PAIRS_DEFAULT.map((pair) => (
            <button type="button" key={pair} onClick={() => toggleArray("language_pairs", pair)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${form.language_pairs.includes(pair) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"}`}>
              {pair}
            </button>
          ))}
        </div>
        <input type="text" value={form.language_pair_other}
          onChange={(e) => set("language_pair_other", e.target.value)}
          placeholder="Tambahkan pasangan lain (e.g., Indonesia ↔ Belanda)"
          className={`${inputCls} mt-3`} />
      </Field>
      <Field label="Bahasa ibu (opsional)">
        <input type="text" value={form.native_language_other}
          onChange={(e) => set("native_language_other", e.target.value)}
          placeholder="Indonesia, Sunda, Jawa, dst (pisahkan koma)" className={inputCls} />
      </Field>
      <Field label="Tahun pengalaman interpretasi" required>
        <input type="number" min={0} value={form.years_experience}
          onChange={(e) => set("years_experience", e.target.value)} className={inputCls} />
        <p className="text-xs text-gray-500 mt-1">Pengalaman freelance + in-house di-total.</p>
      </Field>
      <Field label="Spesialisasi" required>
        <p className="text-xs text-gray-500 mb-2">Pilih minimal 1. Lo bisa pilih beberapa.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SPECIALIZATIONS.map((s) => (
            <label key={s.value}
              className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer text-sm ${form.specializations.includes(s.value) ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
              <input type="checkbox" checked={form.specializations.includes(s.value)}
                onChange={() => toggleArray("specializations", s.value)}
                className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500" />
              <div>
                <div className="font-medium text-gray-900">{s.label}</div>
                {s.hint && <div className="text-xs text-gray-500">{s.hint}</div>}
              </div>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Sertifikasi (opsional)">
        <div className="space-y-2">
          {CERTIFICATIONS.map((c) => (
            <label key={c}
              className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer ${form.certifications.includes(c) ? "bg-emerald-50 text-emerald-800" : "text-gray-700"}`}>
              <input type="checkbox" checked={form.certifications.includes(c)}
                onChange={() => toggleArray("certifications", c)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500" />
              {c}
            </label>
          ))}
        </div>
        <input type="text" value={form.certification_other}
          onChange={(e) => set("certification_other", e.target.value)}
          placeholder="Sertifikasi lainnya" className={`${inputCls} mt-2`} />
      </Field>
      <Field label="Mode yang dikuasai" required>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button type="button" key={m.value} onClick={() => toggleArray("modes", m.value)}
              className={`px-4 py-2 rounded-lg text-sm border transition ${form.modes.includes(m.value) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"}`}>
              {m.label}
            </button>
          ))}
        </div>
      </Field>
    </>
  );
}

// ===========================================================================
// Step 3: Rate
// ===========================================================================
function Step3Rate({ form, set }: any) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Rate per jam (IDR, opsional)">
          <input type="number" min={0} value={form.rate_per_hour}
            onChange={(e) => set("rate_per_hour", e.target.value)}
            placeholder="300000" className={inputCls} />
        </Field>
        <Field label="Rate per hari (IDR, opsional)">
          <input type="number" min={0} value={form.rate_per_day}
            onChange={(e) => set("rate_per_day", e.target.value)}
            placeholder="2500000" className={inputCls} />
        </Field>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.rate_negotiable}
          onChange={(e) => set("rate_negotiable", e.target.checked)}
          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500" />
        <span className="text-sm text-gray-700">Rate negotiable</span>
      </label>
      <Field label="Catatan availability (opsional)">
        <textarea rows={3} value={form.availability_notes}
          onChange={(e) => set("availability_notes", e.target.value)}
          placeholder="Available Senin-Jumat, weekend dengan notice 3 hari" className={inputCls} />
      </Field>
    </>
  );
}

// ===========================================================================
// Step 4: Portfolio
// ===========================================================================
function Step4Portfolio({ form, set, cvFile, handleCvChange }: any) {
  return (
    <>
      <Field label="Upload CV (PDF, max 5 MB)" required>
        <label className="flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition">
          <Upload className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {cvFile ? cvFile.name : "Klik untuk pilih CV (.pdf)"}
          </span>
          <input type="file" accept="application/pdf" onChange={handleCvChange} className="hidden" />
        </label>
      </Field>
      <Field label="Link portfolio / LinkedIn (opsional)">
        <input type="url" value={form.portfolio_link}
          onChange={(e) => set("portfolio_link", e.target.value)}
          placeholder="https://linkedin.com/in/..." className={inputCls} />
      </Field>
      <Field label="Dapat info dari mana? (opsional)">
        <select value={form.referral_source}
          onChange={(e) => set("referral_source", e.target.value)} className={inputCls}>
          <option value="">Pilih</option>
          {REFERRAL_SOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
    </>
  );
}

// ===========================================================================
// Success card (emerald)
// ===========================================================================
function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
        <CheckCircle2 className="h-9 w-9 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Lamaran berhasil dikirim!</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        Tim Linguo akan review dalam <strong>3-5 hari kerja</strong> dan kontak via WhatsApp kalau profile lo match dengan project yang aktif.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm">
        <Sparkles className="h-4 w-4" /> Sukses masuk pool kandidat Linguo
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onReset}
          className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition">
          Submit Lamaran Baru
        </button>
        <a href="/" className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition inline-flex items-center justify-center gap-2">
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}

// ===========================================================================
// UI helpers
// ===========================================================================
const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
