"use client";

import { useState } from "react";
import {
  Languages, BadgeCheck, Wallet, Clock, Upload, Loader2, User, Briefcase, DollarSign, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { supabase } from "@/lib/supabase-client";
import {
  SPECIALIZATIONS, CERTIFICATIONS, LANGUAGE_PAIRS_DEFAULT, REFERRAL_SOURCES, GENDERS, MODES,
} from "@/components/interpreter/constants";

type FormState = {
  // Personal
  full_name: string;
  email: string;
  whatsapp: string;
  city: string;
  birth_year: string;
  gender: string;
  // Professional
  language_pairs: string[];
  language_pair_other: string;
  native_languages: string[];
  native_language_other: string;
  years_experience: string;
  specializations: string[];
  certifications: string[];
  certification_other: string;
  modes: string[];
  // Rate & availability
  rate_per_hour: string;
  rate_per_day: string;
  rate_negotiable: boolean;
  availability_notes: string;
  // Portfolio
  portfolio_link: string;
  referral_source: string;
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
  const [submitting, setSubmitting] = useState(false);

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

  function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("CV harus format PDF"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("CV max 5 MB"); return; }
    setCvFile(file);
  }

  async function handleSubmit() {
    // Validation
    if (!form.full_name.trim()) return toast.error("Nama lengkap wajib diisi");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error("Format email tidak valid");
    const phoneParsed = parsePhoneNumberFromString(form.whatsapp, "ID");
    if (!phoneParsed || !phoneParsed.isValid()) return toast.error("Nomor WhatsApp tidak valid");
    if (!form.city.trim()) return toast.error("Kota domisili wajib diisi");

    const langPairs = [...form.language_pairs];
    if (form.language_pair_other.trim()) langPairs.push(form.language_pair_other.trim());
    if (langPairs.length === 0) return toast.error("Pilih minimal 1 pasangan bahasa");

    if (!form.years_experience || Number(form.years_experience) < 0)
      return toast.error("Tahun pengalaman wajib diisi");

    if (form.specializations.length === 0)
      return toast.error("Pilih minimal 1 spesialisasi");

    if (form.modes.length === 0)
      return toast.error("Pilih minimal 1 mode interpretasi");

    if (!cvFile) return toast.error("Upload CV wajib (PDF, max 5 MB)");

    // Submit
    setSubmitting(true);

    // 1. Upload CV
    const tempId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString();
    const safeName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const cvPath = `${tempId}/${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("interpreter-cvs")
      .upload(cvPath, cvFile, { contentType: "application/pdf", upsert: false });
    if (upErr) {
      console.error("[interpreter-cvs upload]", upErr);
      setSubmitting(false);
      return toast.error("Gagal upload CV. Coba lagi.");
    }

    // 2. Build certifications array
    const certs = [...form.certifications];
    if (form.certification_other.trim()) certs.push(form.certification_other.trim());

    // 3. Build native_languages
    const natives = [...form.native_languages];
    if (form.native_language_other.trim()) natives.push(form.native_language_other.trim());

    // 4. Insert record
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      whatsapp: phoneParsed.number,
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
    toast.success("Lamaran kamu masuk! Tim Linguo akan review & hubungi via WhatsApp dalam 3-5 hari kerja.");
    setForm(initialForm);
    setCvFile(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Wallet, t: "Rate kompetitif", d: "Project-based atau hourly. Quote transparan dari klien, no agency markup berlebihan." },
              { icon: BadgeCheck, t: "Pool eksklusif", d: "Match algorithm prioritize sertifikasi & pengalaman domain." },
              { icon: Clock, t: "Fleksibel", d: "Pilih project sesuai availability. No long-term commitment, no in-house pressure." },
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

      {/* FORM */}
      <section className="py-12 bg-gradient-to-b from-white to-emerald-50">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">
            Form Lamaran
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Tim Linguo review dalam 3-5 hari kerja, kontak via WhatsApp.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-8">
            {/* SECTION 1: Personal */}
            <FormSection icon={User} title="1. Data Diri">
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
            </FormSection>

            {/* SECTION 2: Professional */}
            <FormSection icon={Briefcase} title="2. Profesi">
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
                  placeholder="Indonesia, Sunda, Jawa, dst (pisahkan koma)"
                  className={inputCls} />
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
                  placeholder="Sertifikasi lainnya"
                  className={`${inputCls} mt-2`} />
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
            </FormSection>

            {/* SECTION 3: Rate */}
            <FormSection icon={DollarSign} title="3. Rate & Availability">
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
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.rate_negotiable}
                  onChange={(e) => set("rate_negotiable", e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm text-gray-700">Rate negotiable</span>
              </label>
              <Field label="Catatan availability (opsional)">
                <textarea rows={3} value={form.availability_notes}
                  onChange={(e) => set("availability_notes", e.target.value)}
                  placeholder="Available Senin-Jumat, weekend dengan notice 3 hari"
                  className={inputCls} />
              </Field>
            </FormSection>

            {/* SECTION 4: Portfolio */}
            <FormSection icon={FileText} title="4. Portfolio">
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
            </FormSection>

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 px-6 py-3.5 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Mengirim..." : "Kirim Lamaran"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

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

function FormSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <Icon className="h-5 w-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
