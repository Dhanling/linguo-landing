"use client";

// =============================================================================
// TrialWizard.tsx
// [linguo-patch:trial-wizard-v1]
// Wizard pendaftaran Trial Class (Private + Kids) — 4 langkah, modern UX.
// Dipakai di halaman /kelas-trial DAN di dalam TrialWizardModal (popup).
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import {
  TRIAL_LANGUAGES,
  TRIAL_DURATIONS,
  KIDS_DURATION,
  computePrivateTrialPrice,
  computeKidsTrialPrice,
  formatRupiah,
} from "@/lib/trial-pricing";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  validatePhoneWithCountry,
} from "@/lib/phone";
import type { CountryCode } from "libphonenumber-js";

const TEAL = "#1A9E9E";
const TEAL_DARK = "#178a8a";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const TIMES = ["Pagi", "Siang", "Sore", "Malam"];
const STEP_TITLES = [
  "Pilih Program",
  "Detail Kelas",
  "Preferensi Jadwal",
  "Data Diri & Pembayaran",
];
const TOTAL = 4;

const KIDS_TIERS = [
  {
    id: "little-learner" as const,
    emoji: "🐣",
    name: "Little Learner",
    age: "Usia 5–8 tahun",
    duration: "30 menit/sesi",
  },
  {
    id: "young-explorer" as const,
    emoji: "🚀",
    name: "Young Explorer",
    age: "Usia 9–12 tahun",
    duration: "45 menit/sesi",
  },
];

const PROGRAMS = [
  {
    id: "private" as const,
    emoji: "🎓",
    name: "Kelas Private",
    desc: "Belajar 1-on-1 bareng pengajar, 60+ bahasa, durasi fleksibel.",
  },
  {
    id: "kids" as const,
    emoji: "🧒",
    name: "Kelas Kids",
    desc: "Khusus anak usia 5–12 tahun. Belajar lewat aktivitas interaktif.",
  },
];

// =============================================================================
// linguo-patch:trial-lang-picker-v1 — ganti <select> bahasa jadi picker ala
// FunnelModal (search + chips region + grid bendera). SUMBER bahasa tetap
// TRIAL_LANGUAGES (string identik) → harga via computePrivateTrialPrice aman.
// Tiap bahasa di TRIAL_LANGUAGES wajib punya entri di LANG_META; yg tak terpetakan
// jatuh ke fallback (bendera "un", region "lainnya") supaya tetap muncul & bisa dipilih.
// =============================================================================
type LangRegion =
  | "eropa"
  | "asia"
  | "timur-tengah"
  | "nusantara"
  | "afrika"
  | "lainnya";

const LANG_FEATURED = new Set<string>([
  "English",
  "Japanese",
  "Korean",
  "Mandarin",
  "Arabic",
  "French",
  "German",
  "Spanish",
]);

// flag = kode ISO buat flagcdn (w40 png), region = grup chip.
const LANG_META: Record<string, { flag: string; region: LangRegion }> = {
  // Kategori C (populer inti)
  Arabic: { flag: "sa", region: "timur-tengah" },
  English: { flag: "gb", region: "eropa" },
  Japanese: { flag: "jp", region: "asia" },
  German: { flag: "de", region: "eropa" },
  Korean: { flag: "kr", region: "asia" },
  Mandarin: { flag: "cn", region: "asia" },
  French: { flag: "fr", region: "eropa" },
  // Kategori B
  Russian: { flag: "ru", region: "eropa" },
  Dutch: { flag: "nl", region: "eropa" },
  Italian: { flag: "it", region: "eropa" },
  Spanish: { flag: "es", region: "eropa" },
  Thai: { flag: "th", region: "asia" },
  "Sign Language": { flag: "un", region: "lainnya" },
  // Kategori A
  Swahili: { flag: "ke", region: "afrika" },
  Greek: { flag: "gr", region: "eropa" },
  Hindi: { flag: "in", region: "asia" },
  Turkish: { flag: "tr", region: "asia" },
  Norwegian: { flag: "no", region: "eropa" },
  Tagalog: { flag: "ph", region: "asia" },
  Vietnamese: { flag: "vn", region: "asia" },
  Swedish: { flag: "se", region: "eropa" },
  Urdu: { flag: "pk", region: "asia" },
  Kurdish: { flag: "un", region: "timur-tengah" },
  Hebrew: { flag: "il", region: "timur-tengah" },
  Polish: { flag: "pl", region: "eropa" },
  Portuguese: { flag: "pt", region: "eropa" },
  Finnish: { flag: "fi", region: "eropa" },
  Czech: { flag: "cz", region: "eropa" },
  "Traditional Chinese": { flag: "tw", region: "asia" },
  Hungarian: { flag: "hu", region: "eropa" },
  Esperanto: { flag: "un", region: "lainnya" },
  Farsi: { flag: "ir", region: "timur-tengah" },
  "English British": { flag: "gb", region: "eropa" },
  Romanian: { flag: "ro", region: "eropa" },
  Khmer: { flag: "kh", region: "asia" },
  Danish: { flag: "dk", region: "eropa" },
  Uzbek: { flag: "uz", region: "asia" },
  Serbian: { flag: "rs", region: "eropa" },
  Estonian: { flag: "ee", region: "eropa" },
  Latin: { flag: "un", region: "lainnya" },
  "Ancient Egyptian": { flag: "eg", region: "lainnya" },
  Georgian: { flag: "ge", region: "asia" },
  Irish: { flag: "ie", region: "eropa" },
  Persian: { flag: "ir", region: "timur-tengah" },
  Bengali: { flag: "bd", region: "asia" },
  // Kategori D (Nusantara)
  Javanese: { flag: "id", region: "nusantara" },
  Sundanese: { flag: "id", region: "nusantara" },
  Madurese: { flag: "id", region: "nusantara" },
  Batak: { flag: "id", region: "nusantara" },
  Banjar: { flag: "id", region: "nusantara" },
  Balinese: { flag: "id", region: "nusantara" },
  Malay: { flag: "my", region: "nusantara" },
  Bugis: { flag: "id", region: "nusantara" },
  // Kategori E
  BIPA: { flag: "id", region: "nusantara" },
};

const langFlag = (name: string): string => LANG_META[name]?.flag || "un";
const langRegion = (name: string): LangRegion =>
  LANG_META[name]?.region || "lainnya";

const LANG_CHIPS: { key: string; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "populer", label: "Populer" },
  { key: "eropa", label: "Eropa" },
  { key: "asia", label: "Asia" },
  { key: "timur-tengah", label: "Timur Tengah" },
  { key: "nusantara", label: "Nusantara" },
  { key: "afrika", label: "Afrika" },
  { key: "lainnya", label: "Lainnya" },
];

export default function TrialWizard({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(1);
  const [program, setProgram] = useState<"" | "private" | "kids">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY.code);
  const [waNational, setWaNational] = useState("");
  const [language, setLanguage] = useState("");
  const [duration, setDuration] = useState(60);
  const [kidsType, setKidsType] = useState<
    "" | "little-learner" | "young-explorer"
  >("");
  const [days, setDays] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // linguo-patch:trial-lang-picker-v1 — state picker bahasa
  const [langQuery, setLangQuery] = useState("");
  const [langCat, setLangCat] = useState("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("gagal")) {
      setError("Pembayaran sebelumnya tidak selesai. Yuk daftar ulang.");
    }
  }, []);

  const price = useMemo<number | null>(() => {
    if (program === "private") {
      return language ? computePrivateTrialPrice(language, duration) : null;
    }
    if (program === "kids") {
      return kidsType ? computeKidsTrialPrice(kidsType) : null;
    }
    return null;
  }, [program, language, duration, kidsType]);

  // linguo-patch:trial-lang-picker-v1 — daftar bahasa terfilter (search + chip)
  const filteredLangs = useMemo(() => {
    const q = langQuery.trim().toLowerCase();
    return TRIAL_LANGUAGES.filter((l) => {
      if (q) return l.toLowerCase().includes(q); // pas search, abaikan kategori
      if (langCat === "all") return true;
      if (langCat === "populer") return LANG_FEATURED.has(l);
      return langRegion(l) === langCat;
    });
  }, [langQuery, langCat]);

  // Chip cuma tampil kalau region-nya punya isi (Semua & Populer selalu ada)
  const visibleChips = useMemo(
    () =>
      LANG_CHIPS.filter((c) => {
        if (c.key === "all" || c.key === "populer") return true;
        return TRIAL_LANGUAGES.some((l) => langRegion(l) === c.key);
      }),
    []
  );

  const toggle = (
    arr: string[],
    setter: (v: string[]) => void,
    v: string
  ) => setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  // ── Validasi per langkah ──────────────────────────────────────────────
  const stepError = (s: number): string => {
    if (s === 1 && !program) return "Pilih program trial dulu ya.";
    if (s === 2) {
      if (program === "kids" && !kidsType) return "Pilih tipe kelas Kids.";
      if (!language) return "Pilih bahasa dulu ya.";
      if (price == null || price <= 0) {
        return "Bahasa ini belum tersedia untuk trial. Hubungi admin ya.";
      }
    }
    if (s === 4) {
      if (!name.trim()) return "Nama wajib diisi.";
      const phone = validatePhoneWithCountry(waNational, country);
      if (!phone.valid) return phone.error || "Nomor WhatsApp tidak valid.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return "Email tidak valid.";
      }
    }
    return "";
  };

  const next = () => {
    const e = stepError(step);
    if (e) {
      setError(e);
      return;
    }
    setError("");
    setStep((s) => Math.min(TOTAL, s + 1));
  };
  const back = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async () => {
    const e = stepError(4);
    if (e) {
      setError(e);
      return;
    }
    setError("");
    const phone = validatePhoneWithCountry(waNational, country);
    const preferred_schedule =
      [days.join(", "), times.join(", ")].filter(Boolean).join(" — ") || null;

    setSubmitting(true);
    try {
      const res = await fetch("/api/create-trial-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          wa_number: phone.e164,
          program,
          language,
          kids_type: program === "kids" ? kidsType : null,
          duration_minutes:
            program === "kids"
              ? KIDS_DURATION[kidsType as string]
              : duration,
          preferred_schedule,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.invoice_url) {
        window.location.href = data.invoice_url;
        return;
      }
      setError(data?.error || "Gagal memproses pendaftaran. Coba lagi ya.");
    } catch {
      setError("Koneksi bermasalah. Coba lagi ya.");
    } finally {
      setSubmitting(false);
    }
  };

  // linguo-patch:trial-lang-picker-v1 — gate tombol Bayar: wajib nama+WA+email valid
  const step4Invalid = stepError(4) !== "";

  // ── Style helpers ─────────────────────────────────────────────────────
  const inputCls =
    "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const chip = (active: boolean) =>
    "px-3.5 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 " +
    (active
      ? "bg-teal-500 text-white border-teal-500 shadow-sm"
      : "bg-white text-gray-600 border-gray-200 hover:border-teal-300");
  const selectCard = (active: boolean) =>
    "relative w-full text-left rounded-2xl border-2 p-4 transition-all active:scale-[0.99] " +
    (active
      ? "border-teal-500 bg-teal-50"
      : "border-gray-200 bg-white hover:border-teal-300");

  const Check = () => (
    <span
      className="absolute top-3 right-3 h-5 w-5 rounded-full flex items-center justify-center text-white text-xs"
      style={{ background: TEAL }}
    >
      ✓
    </span>
  );

  const reqStar = <span className="text-red-500">*</span>;

  // ── Step renderers ────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Pilih jenis kelas yang mau kamu coba dulu.
      </p>
      {PROGRAMS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            setProgram(p.id);
            if (p.id === "private") setKidsType("");
            if (p.id === "kids") setDuration(60);
            setError(""); // linguo-patch:start-picker-v1 — klik kartu langsung lanjut ke step 2
            setStep(2);
          }}
          className={selectCard(program === p.id)}
        >
          {program === p.id && <Check />}
          <div className="flex items-start gap-3">
            <div className="text-3xl leading-none">{p.emoji}</div>
            <div className="pr-6">
              <div className="font-bold text-gray-900">{p.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      {program === "kids" && (
        <div>
          <div className="text-sm font-semibold text-gray-800 mb-2">
            Tipe Kelas Kids
          </div>
          <div className="grid grid-cols-2 gap-3">
            {KIDS_TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setKidsType(t.id)}
                className={selectCard(kidsType === t.id) + " p-3"}
              >
                {kidsType === t.id && <Check />}
                <div className="text-2xl">{t.emoji}</div>
                <div className="font-bold text-sm text-gray-900 mt-1">
                  {t.name}
                </div>
                <div className="text-[11px] text-gray-500">{t.age}</div>
                <div className="text-[11px] text-gray-400">{t.duration}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* linguo-patch:trial-lang-picker-v1 — picker bahasa ala FunnelModal */}
      <div>
        <div className="text-sm font-semibold text-gray-800 mb-1.5">Bahasa</div>

        {/* Search */}
        <div className="relative mb-2.5">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={langQuery}
            onChange={(e) => setLangQuery(e.target.value)}
            placeholder="Cari bahasa..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {/* Chips region — disembunyiin pas lagi search */}
        {!langQuery.trim() && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2.5 -mx-1 px-1">
            {visibleChips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setLangCat(c.key)}
                className={
                  "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors " +
                  (langCat === c.key
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Grid bahasa (bisa scroll biar durasi & harga tetap kejangkau) */}
        <div className="max-h-[300px] overflow-y-auto pr-0.5">
          <div className="grid grid-cols-2 gap-2">
            {filteredLangs.map((l) => {
              const active = language === l;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLanguage(l);
                    setError("");
                  }}
                  className={
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-sm transition-all active:scale-[0.98] " +
                    (active
                      ? "border-teal-500 bg-teal-50 text-teal-700 font-semibold"
                      : "border-gray-100 text-gray-700 hover:border-teal-300 hover:bg-teal-50/40")
                  }
                >
                  <img
                    src={`https://flagcdn.com/w40/${langFlag(l)}.png`}
                    alt=""
                    loading="lazy"
                    className="h-5 w-5 rounded-full object-cover shrink-0"
                  />
                  <span className="truncate">{l}</span>
                </button>
              );
            })}
            {filteredLangs.length === 0 && (
              <div className="col-span-2 text-center py-6 text-sm text-gray-400">
                Bahasa tidak ditemukan
              </div>
            )}
          </div>
        </div>
      </div>

      {program === "private" && (
        <div>
          <div className="text-sm font-semibold text-gray-800 mb-1.5">
            Durasi per sesi
          </div>
          <div className="flex flex-wrap gap-2">
            {TRIAL_DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={chip(duration === d)}
              >
                {d} menit
              </button>
            ))}
          </div>
        </div>
      )}

      {price != null && (
        <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Biaya trial (1 sesi)</span>
          <span className="text-lg font-bold" style={{ color: TEAL }}>
            {formatRupiah(price)}
          </span>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Kasih tahu preferensi waktu kamu — tim kami pakai ini buat atur jadwal.
        Boleh dilewati kalau masih fleksibel.
      </p>
      <div>
        <div className="text-sm font-semibold text-gray-800 mb-2">Hari</div>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggle(days, setDays, d)}
              className={chip(days.includes(d))}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-gray-800 mb-2">Waktu</div>
        <div className="flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(times, setTimes, t)}
              className={chip(times.includes(t))}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const summary =
      (program === "private" ? "Kelas Private" : "Kelas Kids") +
      " · " +
      language +
      (program === "kids"
        ? ` · ${kidsType}`
        : ` · ${duration} menit`);
    return (
      <div className="space-y-4">
        {/* linguo-patch:trial-lang-picker-v1 — nama/WA/email wajib (label + bintang) */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Nama lengkap {reqStar}
            </label>
            <input
              className={inputCls}
              placeholder="Nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Nomor WhatsApp {reqStar}
            </label>
            <div className="flex gap-2">
              <select
                className="rounded-xl border border-gray-200 px-2 py-3 text-sm outline-none focus:border-teal-500 bg-white"
                value={country}
                onChange={(e) => setCountry(e.target.value as CountryCode)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} +{c.dialCode}
                  </option>
                ))}
              </select>
              <input
                className={inputCls}
                placeholder="Nomor WhatsApp"
                inputMode="numeric"
                value={waNational}
                onChange={(e) => setWaNational(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Email {reqStar}
            </label>
            <input
              className={inputCls}
              type="email"
              placeholder="Email aktif (untuk invoice & konfirmasi)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Ringkasan */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-1.5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Ringkasan
          </div>
          <div className="text-sm text-gray-700">{summary}</div>
          {(days.length > 0 || times.length > 0) && (
            <div className="text-xs text-gray-500">
              Preferensi: {[days.join(", "), times.join(", ")]
                .filter(Boolean)
                .join(" — ")}
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-gray-600">Total bayar</span>
            <span className="text-lg font-bold" style={{ color: TEAL }}>
              {price != null ? formatRupiah(price) : "—"}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Pembayaran diproses aman lewat Xendit. Biaya ini untuk 1 sesi trial.
          Kalau lanjut ke paket penuh, biaya paket dihitung terpisah.
        </p>
      </div>
    );
  };

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="flex flex-col bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh]">
      {/* Header */}
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div
              className="text-[11px] font-bold tracking-wide"
              style={{ color: TEAL }}
            >
              TRIAL CLASS · LANGKAH {step}/{TOTAL}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
              {STEP_TITLES[step - 1]}
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center shrink-0"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex gap-1.5 mt-3">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{ background: i < step ? TEAL : "#f1f1f1" }}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 sm:px-6 py-5 overflow-y-auto">
        <div key={step} className="trial-step">
          {steps[step - 1]()}
        </div>
      </div>

      {/* Footer — linguo-patch:start-picker-v1: disembunyiin di step 1 (kecuali ada error) */}
      {(step > 1 || error) && (
      <div className="px-5 sm:px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}
        {/* linguo-patch:trial-lang-picker-v1 — hint kenapa tombol Bayar nonaktif */}
        {step === TOTAL && !submitting && !error && step4Invalid && (
          <p className="mb-2.5 text-[11px] text-gray-400">
            Lengkapi nama, nomor WhatsApp & email yang valid dulu untuk lanjut
            bayar.
          </p>
        )}
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              disabled={submitting}
              className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
            >
              Kembali
            </button>
          )}
          <div className="flex-1 min-w-0">
            {step >= 2 && price != null && (
              <>
                <div className="text-[11px] text-gray-400 leading-none">
                  Biaya trial
                </div>
                <div
                  className="text-base font-bold leading-tight"
                  style={{ color: TEAL }}
                >
                  {formatRupiah(price)}
                </div>
              </>
            )}
          </div>
          {step === 1 ? null : step < TOTAL ? (
            <button
              type="button"
              onClick={next}
              className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity active:scale-95"
              style={{ background: TEAL }}
            >
              Lanjut →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting || step4Invalid}
              className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: TEAL }}
            >
              {submitting
                ? "Memproses…"
                : price != null
                ? `Bayar ${formatRupiah(price)}`
                : "Bayar"}
            </button>
          )}
        </div>
      </div>
      )}

      <style>{`
        @keyframes trialSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .trial-step { animation: trialSlide 0.25s ease both; }
      `}</style>
    </div>
  );
}
