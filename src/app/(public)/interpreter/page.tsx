"use client";

import { useState, Fragment } from "react";
import {
  Languages, Mic, Users, MessageCircleMore, CheckCircle2, Building2,
  Stethoscope, Scale, GraduationCap, Globe, Briefcase, Calendar,
  MapPin, Phone, Loader2, ChevronDown, ChevronLeft, ChevronRight, Check, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { supabase } from "@/lib/supabase-client";
import {
  LANGUAGES, INDUSTRIES, MODES, LOCATION_TYPES, ONLINE_PLATFORMS, BUDGET_RANGES,
} from "@/components/interpreter/constants";

// ---------------------------------------------------------------------------
// FAQ + Industry badges (unchanged from v1)
// ---------------------------------------------------------------------------
const FAQ = [
  { q: "Berapa lama lead time minimum buat book interpreter?",
    a: "Idealnya 5-7 hari kerja sebelum event biar kami bisa match interpreter dengan domain expertise yang tepat. Urgent booking <48 jam tetap bisa dilayani dengan availability subject to interpreter pool." },
  { q: "Equipment buat simultaneous interpreting siapa yang sediain?",
    a: "Default-nya kami sediakan booth + headset (rental partner Jakarta/Bandung/Surabaya). Kalau venue lo udah punya, kita bisa quote service-only." },
  { q: "Bisa NDA?",
    a: "Bisa. Untuk topik sensitif (M&A, litigasi, R&D), kami sign NDA per-engagement. Interpreter kami semua sign master NDA dengan Linguo." },
  { q: "Bahasa yang gak ada di list, available gak?",
    a: "60+ bahasa di pool kami. Ketik di field 'Lainnya' pas isi form, tim kami konfirmasi availability dalam 24 jam." },
  { q: "Pricing model gimana?",
    a: "Per jam, per hari, atau per project rate (untuk event multi-day). Quote dikirim WhatsApp/email dalam 24 jam setelah inquiry masuk." },
];

const INDUSTRY_BADGES = [
  { icon: Briefcase,     label: "Finance" },
  { icon: Stethoscope,   label: "Healthcare" },
  { icon: Scale,         label: "Legal" },
  { icon: GraduationCap, label: "Education" },
  { icon: Building2,     label: "Government" },
  { icon: Globe,         label: "Hospitality" },
];

// ---------------------------------------------------------------------------
// Wizard steps definition
// ---------------------------------------------------------------------------
const STEPS = [
  { title: "Tentang Event",      short: "Event",      icon: Calendar },
  { title: "Industri & Bahasa",  short: "Bahasa",     icon: Globe },
  { title: "Lokasi & Materi",    short: "Lokasi",     icon: MapPin },
  { title: "Kontak",             short: "Kontak",     icon: Phone },
];

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------
type FormState = {
  event_title: string; event_date: string; is_multi_day: boolean;
  event_end_date: string; event_start_time: string; event_end_time: string;
  participant_count: string; topic: string;
  industry: string;
  source_language: string; source_language_other: string;
  target_language: string; target_language_other: string;
  bidirectional: boolean; mode: string; interpreter_count: number;
  location_type: string; venue_address: string; venue_city: string;
  online_platform: string; prep_materials_url: string; client_notes: string;
  company_name: string; contact_name: string; contact_email: string;
  contact_phone: string; budget_range: string;
};

const initialForm: FormState = {
  event_title: "", event_date: "", is_multi_day: false,
  event_end_date: "", event_start_time: "", event_end_time: "",
  participant_count: "", topic: "",
  industry: "",
  source_language: "Indonesia", source_language_other: "",
  target_language: "", target_language_other: "",
  bidirectional: true, mode: "", interpreter_count: 1,
  location_type: "", venue_address: "", venue_city: "",
  online_platform: "", prep_materials_url: "", client_notes: "",
  company_name: "", contact_name: "", contact_email: "",
  contact_phone: "", budget_range: "",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function InterpreterPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isOnsiteOrHybrid = form.location_type === "onsite" || form.location_type === "hybrid";
  const isOnlineOrHybrid = form.location_type === "online" || form.location_type === "hybrid";

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function resolveLanguage(value: string, other: string): string {
    return value === "Lainnya" ? other.trim() : value;
  }
  function scrollToForm() {
    if (typeof window !== "undefined") {
      document.getElementById("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // --------- Per-step validation ---------
  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!form.event_title.trim()) return "Judul event wajib diisi";
      if (!form.event_date) return "Tanggal event wajib diisi";
      if (form.is_multi_day && !form.event_end_date) return "Tanggal akhir wajib untuk event multi-day";
    }
    if (s === 1) {
      const src = resolveLanguage(form.source_language, form.source_language_other);
      const tgt = resolveLanguage(form.target_language, form.target_language_other);
      if (!src) return "Bahasa sumber wajib diisi";
      if (!tgt) return "Bahasa target wajib diisi";
      if (src === tgt) return "Bahasa sumber dan target gak boleh sama";
      if (!form.mode) return "Pilih mode interpretasi";
    }
    if (s === 2) {
      if (!form.location_type) return "Pilih tipe lokasi";
      if ((form.location_type === "onsite" || form.location_type === "hybrid") && !form.venue_city.trim()) {
        return "Kota venue wajib untuk event onsite/hybrid";
      }
      if ((form.location_type === "online" || form.location_type === "hybrid") && !form.online_platform.trim()) {
        return "Pilih platform online";
      }
    }
    if (s === 3) {
      if (!form.company_name.trim()) return "Nama perusahaan wajib";
      if (!form.contact_name.trim()) return "Nama PIC wajib";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) return "Format email tidak valid";
      const phoneParsed = parsePhoneNumberFromString(form.contact_phone, "ID");
      if (!phoneParsed || !phoneParsed.isValid()) return "Nomor WhatsApp tidak valid";
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
    if (s < step) setStep(s); // only allow going back
  }

  async function handleSubmit() {
    // Final validation across all steps
    for (let i = 0; i < STEPS.length; i++) {
      const err = validateStep(i);
      if (err) {
        toast.error(err);
        setStep(i);
        return;
      }
    }

    setSubmitting(true);
    const phoneParsed = parsePhoneNumberFromString(form.contact_phone, "ID");
    const srcLang = resolveLanguage(form.source_language, form.source_language_other);
    const tgtLang = resolveLanguage(form.target_language, form.target_language_other);

    const payload = {
      company_name: form.company_name.trim(),
      contact_name: form.contact_name.trim(),
      contact_email: form.contact_email.trim().toLowerCase(),
      contact_phone: phoneParsed!.number,
      event_title: form.event_title.trim(),
      event_date: form.event_date,
      event_end_date: form.is_multi_day && form.event_end_date ? form.event_end_date : null,
      event_start_time: form.event_start_time || null,
      event_end_time: form.event_end_time || null,
      is_multi_day: form.is_multi_day,
      participant_count: form.participant_count ? Number(form.participant_count) : null,
      topic: form.topic.trim() || null,
      industry: form.industry || null,
      source_language: srcLang,
      target_language: tgtLang,
      bidirectional: form.bidirectional,
      mode: form.mode,
      interpreter_count: form.interpreter_count,
      location_type: form.location_type,
      venue_address: isOnsiteOrHybrid ? form.venue_address.trim() || null : null,
      venue_city: isOnsiteOrHybrid ? form.venue_city.trim() || null : null,
      online_platform: isOnlineOrHybrid ? form.online_platform || null : null,
      prep_materials_url: form.prep_materials_url.trim() || null,
      client_notes: form.client_notes.trim() || null,
      budget_range: form.budget_range || null,
      status: "new",
    };

    const { error } = await supabase.from("interpreter_requests").insert(payload);
    setSubmitting(false);

    if (error) {
      console.error("[interpreter_requests insert]", error);
      toast.error("Gagal kirim inquiry. Coba lagi atau hubungi kami via WhatsApp.");
      return;
    }
    toast.success("Inquiry berhasil dikirim!");
    setSubmitted(true);
    if (typeof window !== "undefined") {
      document.getElementById("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleReset() {
    setForm(initialForm);
    setStep(0);
    setSubmitted(false);
  }

  const StepIcon = STEPS[step].icon;

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="bg-gradient-to-b from-blue-50 via-white to-white pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-4">
            <Languages className="h-4 w-4" /> Layanan Interpreter Linguo.id
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Interpreter Profesional buat Event B2B Lo
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Conference, investor pitch, technical training, atau on-site visit — kami match interpreter dengan domain expertise yang tepat. 60+ bahasa, sertifikasi HPI &amp; AIIC, pool teruji dari engagement enterprise.
          </p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <button onClick={scrollToForm}
              className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
              Kirim Inquiry
            </button>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
               className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition inline-flex items-center gap-2">
              <MessageCircleMore className="h-4 w-4" /> WhatsApp langsung
            </a>
          </div>
        </div>
      </section>

      {/* MODE CARDS */}
      <section className="py-12 sm:py-16 border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
            Pilih Mode yang Cocok
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Bingung consecutive vs simultaneous? Singkat aja:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MODES.map((m, i) => {
              const Icon = [Users, Mic, MessageCircleMore][i];
              return (
                <div key={m.value} className="rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition">
                  <Icon className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-lg text-gray-900">{m.label}</h3>
                  <p className="text-sm text-gray-600 mt-1 font-medium">{m.short}</p>
                  <p className="text-sm text-gray-500 mt-3">{m.long}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* KENAPA LINGUO */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
            Kenapa Linguo.id?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { t: "60+ bahasa, native speakers", d: "Bukan cuma English. Mandarin, Jepang, Arab, Vietnamese (Alfamart case), Korean, Spanyol — semua native atau near-native." },
              { t: "Sertifikasi HPI, AIIC, ATA",  d: "Pool interpreter kami punya kredensial industri standar — bukan agency markup ke freelancer random." },
              { t: "Enterprise track record",     d: "Trusted by Alfamart (Vietnamese program 40 sesi), GroundProbe Indonesia (English A1–B1), dan B2B lainnya." },
              { t: "Quote dalam 24 jam",          d: "Inquiry masuk → tim Linguo reply via WhatsApp/email dengan quote transparan. No ghosting." },
            ].map((b, i) => (
              <div key={i} className="flex gap-4">
                <CheckCircle2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">{b.t}</h3>
                  <p className="text-sm text-gray-600 mt-1">{b.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="py-12 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-8">
            Industri yang sering kami support
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {INDUSTRY_BADGES.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex items-center gap-2 rounded-full bg-white border border-gray-200 px-4 py-2 text-sm text-gray-700">
                  <Icon className="h-4 w-4 text-blue-600" /> {b.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">FAQ</h2>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={i} className="rounded-xl border border-gray-200">
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50 rounded-xl">
                  <span>{f.q}</span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-gray-600">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM (WIZARD) */}
      <section id="form" className="py-12 sm:py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="mx-auto max-w-3xl px-4">
          {submitted ? (
            <SuccessCard onReset={handleReset} />
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
                Kirim Inquiry
              </h2>
              <p className="text-gray-600 text-center mb-8">
                4 langkah singkat — tim Linguo reply dalam 24 jam.
              </p>

              {/* Step indicator */}
              <StepIndicator step={step} jumpTo={jumpTo} />

              {/* Wizard card */}
              <div id="wizard-card" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                {/* Step header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Step {step + 1} dari {STEPS.length}</p>
                    <h3 className="font-semibold text-gray-900 text-lg">{STEPS[step].title}</h3>
                  </div>
                </div>

                {/* Step body */}
                <div key={step} className="animate-fadeSlide space-y-4">
                  {step === 0 && <Step1Event form={form} set={set} />}
                  {step === 1 && <Step2LangMode form={form} set={set} />}
                  {step === 2 && <Step3Location form={form} set={set}
                                    isOnsiteOrHybrid={isOnsiteOrHybrid} isOnlineOrHybrid={isOnlineOrHybrid} />}
                  {step === 3 && <Step4Contact form={form} set={set} />}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <button type="button" onClick={handleBack} disabled={step === 0}
                    className="px-4 py-2.5 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 transition">
                    <ChevronLeft className="h-4 w-4" /> Kembali
                  </button>
                  {step < STEPS.length - 1 ? (
                    <button type="button" onClick={handleNext}
                      className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center gap-1.5 transition shadow-lg shadow-blue-600/20">
                      Lanjut <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit} disabled={submitting}
                      className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-1.5 transition shadow-lg shadow-blue-600/20">
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {submitting ? "Mengirim..." : "Kirim Inquiry"}
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-6">
                Dengan kirim form, lo setuju Linguo akan kontak via WhatsApp/email untuk follow-up.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Local CSS for fade-slide animation */}
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
// Step Indicator
// ===========================================================================
function StepIndicator({ step, jumpTo }: { step: number; jumpTo: (s: number) => void }) {
  return (
    <div className="mb-8">
      {/* Mobile: compact bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-blue-600">Step {step + 1} / {STEPS.length}</span>
          <span className="text-xs text-gray-500">{STEPS[step].title}</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {/* Desktop: dot stepper */}
      <div className="hidden sm:flex items-center max-w-2xl mx-auto">
        {STEPS.map((s, i) => (
          <Fragment key={i}>
            <button type="button" onClick={() => jumpTo(i)}
              disabled={i > step}
              className={`group flex flex-col items-center gap-2 ${i < step ? "cursor-pointer" : i === step ? "cursor-default" : "cursor-not-allowed opacity-60"}`}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200
                ${i < step ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" :
                  i === step ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-600/30" :
                  "bg-gray-100 text-gray-400"}`}>
                {i < step ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i <= step ? "text-gray-900" : "text-gray-400"}`}>{s.short}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-3 mb-6 transition-all duration-300 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Step 1: Event
// ===========================================================================
function Step1Event({ form, set }: any) {
  return (
    <>
      <Field label="Judul event" required>
        <input type="text" value={form.event_title} onChange={(e) => set("event_title", e.target.value)}
          placeholder="Investor Pitch Q3 2026" className={inputCls} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tanggal event" required>
          <input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} className={inputCls} />
          <QuickChips
            options={[
              { label: "Besok", val: addDays(1) },
              { label: "Minggu depan", val: addDays(7) },
              { label: "2 minggu lagi", val: addDays(14) },
              { label: "Bulan depan", val: addDays(30) },
            ]}
            onSelect={(v) => set("event_date", v)}
            isActive={(v) => form.event_date === v}
          />
        </Field>
        <Field label="Multi-day?">
          <label className="flex items-center gap-2 h-[42px] px-3 cursor-pointer">
            <input type="checkbox" checked={form.is_multi_day}
              onChange={(e) => set("is_multi_day", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Event lebih dari 1 hari</span>
          </label>
        </Field>
      </div>
      {form.is_multi_day && (
        <Field label="Tanggal akhir" required>
          <input type="date" value={form.event_end_date}
            onChange={(e) => set("event_end_date", e.target.value)} className={inputCls} />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Jam mulai">
          <input type="time" value={form.event_start_time}
            onChange={(e) => set("event_start_time", e.target.value)} className={inputCls} />
          <QuickChips
            options={["08:00", "09:00", "10:00", "13:00", "14:00"]}
            onSelect={(v) => set("event_start_time", v)}
            isActive={(v) => form.event_start_time === v}
          />
        </Field>
        <Field label="Jam selesai">
          <input type="time" value={form.event_end_time}
            onChange={(e) => set("event_end_time", e.target.value)} className={inputCls} />
          <QuickChips
            options={["11:00", "12:00", "16:00", "17:00", "18:00"]}
            onSelect={(v) => set("event_end_time", v)}
            isActive={(v) => form.event_end_time === v}
          />
        </Field>
      </div>
      <Field label="Jumlah peserta (opsional)">
        <input type="number" min={1} value={form.participant_count}
          onChange={(e) => set("participant_count", e.target.value)}
          placeholder="Perkiraan boleh" className={inputCls} />
        <QuickChips
          options={[
            { label: "<10", val: "5" },
            { label: "10–30", val: "20" },
            { label: "30–50", val: "40" },
            { label: "50–100", val: "75" },
            { label: "100–300", val: "200" },
            { label: ">300", val: "500" },
          ]}
          onSelect={(v) => set("participant_count", v)}
          isActive={(v) => form.participant_count === v}
        />
      </Field>
      <Field label="Topik / konteks (opsional)">
        <input type="text" value={form.topic} onChange={(e) => set("topic", e.target.value)}
          placeholder="Diskusi M&A keuangan, demo produk SaaS, training safety" className={inputCls} />
        <QuickChips
          options={["Investor Pitch", "Product Launch", "Training", "Conference", "Board Meeting", "Site Visit", "Workshop", "Negotiation"]}
          onSelect={(v) => set("topic", v)}
          isActive={(v) => form.topic === v}
        />
      </Field>
    </>
  );
}

// ===========================================================================
// Step 2: Language & Mode
// ===========================================================================
function Step2LangMode({ form, set }: any) {
  return (
    <>
      <Field label="Industri (opsional)">
        <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputCls}>
          <option value="">Pilih industri</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Bahasa sumber" required>
          <select value={form.source_language} onChange={(e) => set("source_language", e.target.value)} className={inputCls}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            <option value="Lainnya">Lainnya (ketik)</option>
          </select>
          {form.source_language === "Lainnya" && (
            <input type="text" value={form.source_language_other}
              onChange={(e) => set("source_language_other", e.target.value)}
              placeholder="Misalnya: Hindi, Turki, Polandia" className={`${inputCls} mt-2`} />
          )}
        </Field>
        <Field label="Bahasa target" required>
          <select value={form.target_language} onChange={(e) => set("target_language", e.target.value)} className={inputCls}>
            <option value="">Pilih bahasa</option>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            <option value="Lainnya">Lainnya (ketik)</option>
          </select>
          {form.target_language === "Lainnya" && (
            <input type="text" value={form.target_language_other}
              onChange={(e) => set("target_language_other", e.target.value)}
              placeholder="Misalnya: Hindi, Turki, Polandia" className={`${inputCls} mt-2`} />
          )}
        </Field>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.bidirectional}
          onChange={(e) => set("bidirectional", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <span className="text-sm text-gray-700">
          Interpreter harus translate 2 arah (sumber → target dan sebaliknya)
        </span>
      </label>
      <Field label="Mode interpretasi" required>
        <div className="space-y-2">
          {MODES.map((m) => (
            <label key={m.value}
              className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition ${form.mode === m.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
              <input type="radio" name="mode" value={m.value} checked={form.mode === m.value}
                onChange={(e) => set("mode", e.target.value)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500" />
              <div>
                <div className="font-medium text-gray-900">{m.label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{m.long}</div>
              </div>
            </label>
          ))}
        </div>
      </Field>
      <Field label="Jumlah interpreter">
        <input type="number" min={1} max={10} value={form.interpreter_count}
          onChange={(e) => set("interpreter_count", Math.max(1, Number(e.target.value) || 1))}
          className={inputCls} />
        <QuickChips
          options={[1, 2, 3, 4]}
          onSelect={(v) => set("interpreter_count", v)}
          isActive={(v) => form.interpreter_count === v}
        />
        <p className="text-xs text-gray-500 mt-1">
          Event panjang (&gt;2 jam) biasanya butuh 2 interpreter rotate, terutama simultaneous.
        </p>
      </Field>
    </>
  );
}

// ===========================================================================
// Step 3: Location & Materials
// ===========================================================================
function Step3Location({ form, set, isOnsiteOrHybrid, isOnlineOrHybrid }: any) {
  return (
    <>
      <Field label="Tipe lokasi" required>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {LOCATION_TYPES.map((lt) => (
            <label key={lt.value}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm transition ${form.location_type === lt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-700"}`}>
              <input type="radio" name="location_type" value={lt.value}
                checked={form.location_type === lt.value}
                onChange={(e) => set("location_type", e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
              {lt.label}
            </label>
          ))}
        </div>
      </Field>
      {isOnsiteOrHybrid && (
        <>
          <Field label="Alamat venue">
            <input type="text" value={form.venue_address}
              onChange={(e) => set("venue_address", e.target.value)}
              placeholder="Hotel Indonesia Kempinski, Jl. M.H. Thamrin No.1" className={inputCls} />
          </Field>
          <Field label="Kota" required>
            <input type="text" value={form.venue_city}
              onChange={(e) => set("venue_city", e.target.value)}
              placeholder="Jakarta" className={inputCls} />
            <QuickChips
              options={["Jakarta", "Bandung", "Surabaya", "Bali", "Yogyakarta", "Medan", "Semarang"]}
              onSelect={(v) => set("venue_city", v)}
              isActive={(v) => form.venue_city === v}
            />
          </Field>
        </>
      )}
      {isOnlineOrHybrid && (
        <Field label="Platform online" required>
          <select value={form.online_platform}
            onChange={(e) => set("online_platform", e.target.value)} className={inputCls}>
            <option value="">Pilih platform</option>
            {ONLINE_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      )}
      <Field label="Link materi prep (opsional)">
        <input type="url" value={form.prep_materials_url}
          onChange={(e) => set("prep_materials_url", e.target.value)}
          placeholder="Google Drive slide/script (kalau udah ada)" className={inputCls} />
      </Field>
      <Field label="Catatan tambahan (opsional)">
        <textarea value={form.client_notes} onChange={(e) => set("client_notes", e.target.value)}
          rows={3} placeholder="Hal yang interpreter perlu tahu sebelumnya" className={inputCls} />
      </Field>
    </>
  );
}

// ===========================================================================
// Step 4: Contact
// ===========================================================================
function Step4Contact({ form, set }: any) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nama perusahaan" required>
          <input type="text" value={form.company_name}
            onChange={(e) => set("company_name", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Nama PIC" required>
          <input type="text" value={form.contact_name}
            onChange={(e) => set("contact_name", e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" required>
          <input type="email" value={form.contact_email}
            onChange={(e) => set("contact_email", e.target.value)}
            placeholder="nama@perusahaan.com" className={inputCls} />
        </Field>
        <Field label="WhatsApp" required>
          <input type="tel" value={form.contact_phone}
            onChange={(e) => set("contact_phone", e.target.value)}
            placeholder="+62812..." className={inputCls} />
        </Field>
      </div>
      <Field label="Budget range (opsional)">
        <select value={form.budget_range} onChange={(e) => set("budget_range", e.target.value)} className={inputCls}>
          <option value="">Pilih range</option>
          {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </Field>
    </>
  );
}

// ===========================================================================
// Success card
// ===========================================================================
function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
      <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
        <CheckCircle2 className="h-9 w-9 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Inquiry kamu masuk!</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        Tim Linguo akan reply via WhatsApp/email dalam <strong>24 jam</strong> dengan quote transparan.
        Cek inbox &amp; folder spam ya 😉
      </p>
      <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm">
        <Sparkles className="h-4 w-4" /> Reference id udah masuk system kami
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onReset}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
          Kirim Inquiry Lagi
        </button>
        <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition inline-flex items-center justify-center gap-2">
          <MessageCircleMore className="h-4 w-4" /> WhatsApp Linguo
        </a>
      </div>
    </div>
  );
}

// ===========================================================================
// QuickChips + date helper
// ===========================================================================
function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

type ChipOpt = string | number | { label: string; val: any };
function QuickChips({ options, onSelect, isActive }: {
  options: ChipOpt[];
  onSelect: (val: any) => void;
  isActive?: (val: any) => boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {options.map((opt, i) => {
        const isObj = typeof opt === "object" && opt !== null && "label" in (opt as any);
        const label = isObj ? (opt as any).label : String(opt);
        const val = isObj ? (opt as any).val : opt;
        const active = isActive ? isActive(val) : false;
        return (
          <button type="button" key={i} onClick={() => onSelect(val)}
            className={`px-2.5 py-1 rounded-full text-xs border transition ${
              active
                ? "bg-blue-100 text-blue-700 border-blue-300 font-medium"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
            }`}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ===========================================================================
// UI helpers
// ===========================================================================
const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition";

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
