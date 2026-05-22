"use client";

// =============================================================================
// /kelas-trial
// [linguo-patch:trial-class-v1]
// Fitur Trial Class — pendaftaran trial (Private + Kids), bayar via Xendit.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
const WA_ADMIN = "https://wa.me/6282116859493";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const TIMES = ["Pagi", "Siang", "Sore", "Malam"];

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

export default function KelasTrialPage() {
  const [program, setProgram] = useState<"" | "private" | "kids">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY.code);
  const [waNational, setWaNational] = useState("");
  const [language, setLanguage] = useState("");
  const [duration, setDuration] = useState<number>(60);
  const [kidsType, setKidsType] = useState<
    "" | "little-learner" | "young-explorer"
  >("");
  const [days, setDays] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("gagal")) {
      setError(
        "Pembayaran sebelumnya tidak selesai. Silakan daftar ulang ya."
      );
    }
  }, []);

  const toggle = (
    arr: string[],
    setter: (v: string[]) => void,
    v: string
  ) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const price = useMemo<number | null>(() => {
    if (program === "private") {
      if (!language) return null;
      return computePrivateTrialPrice(language, duration);
    }
    if (program === "kids") {
      if (!kidsType) return null;
      return computeKidsTrialPrice(kidsType);
    }
    return null;
  }, [program, language, duration, kidsType]);

  const handleSubmit = async () => {
    setError("");
    if (!program) return setError("Pilih program trial dulu ya.");
    if (!name.trim()) return setError("Nama wajib diisi.");
    const phone = validatePhoneWithCountry(waNational, country);
    if (!phone.valid) {
      return setError(phone.error || "Nomor WhatsApp tidak valid.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError("Email tidak valid.");
    }
    if (!language) return setError("Pilih bahasa dulu ya.");
    if (program === "private" && !TRIAL_DURATIONS.includes(duration)) {
      return setError("Pilih durasi sesi.");
    }
    if (program === "kids" && !kidsType) {
      return setError("Pilih tipe kelas Kids.");
    }
    if (price == null || price <= 0) {
      return setError(
        "Bahasa ini belum tersedia untuk trial. Hubungi admin via WhatsApp ya."
      );
    }

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

  const inputCls =
    "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
  const labelCls = "block text-sm font-semibold text-gray-800 mb-1.5";
  const chip = (active: boolean) =>
    `px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
      active
        ? "bg-teal-500 text-white border-teal-500"
        : "bg-white text-gray-600 border-gray-200 hover:border-teal-300"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/60 to-white">
      <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-7">
          <span
            className="inline-block text-xs font-semibold tracking-wide px-3 py-1 rounded-full"
            style={{ background: "#1A9E9E1A", color: TEAL }}
          >
            TRIAL CLASS
          </span>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
            Coba Kelas Trial Linguo
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Satu sesi trial sebelum kamu lanjut ke paket penuh. Rasakan dulu
            cara belajar di Linguo bareng pengajar kami.
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 sm:p-6 space-y-6">
          {/* 1. Program */}
          <div>
            <label className={labelCls}>1. Pilih Program</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setProgram("private");
                  setKidsType("");
                }}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  program === "private"
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-teal-300"
                }`}
              >
                <div className="text-lg">🎓</div>
                <div className="font-semibold text-sm text-gray-900">
                  Kelas Private
                </div>
                <div className="text-xs text-gray-500">1-on-1, 60+ bahasa</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setProgram("kids");
                  setDuration(60);
                }}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  program === "kids"
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-teal-300"
                }`}
              >
                <div className="text-lg">🧒</div>
                <div className="font-semibold text-sm text-gray-900">
                  Kelas Kids
                </div>
                <div className="text-xs text-gray-500">Anak usia 5-12</div>
              </button>
            </div>
          </div>

          {program && (
            <>
              {/* 2. Data diri */}
              <div className="space-y-3">
                <label className={labelCls}>2. Data Diri</label>
                <div>
                  <input
                    className={inputCls}
                    placeholder="Nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="rounded-xl border border-gray-200 px-2 py-3 text-sm outline-none focus:border-teal-500 bg-white"
                    value={country}
                    onChange={(e) =>
                      setCountry(e.target.value as CountryCode)
                    }
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
                <div>
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="Email aktif (untuk invoice & konfirmasi)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* 3. Detail kelas */}
              <div className="space-y-3">
                <label className={labelCls}>3. Detail Kelas</label>

                {program === "kids" && (
                  <div className="grid grid-cols-2 gap-3">
                    {KIDS_TIERS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setKidsType(t.id)}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          kidsType === t.id
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-teal-300"
                        }`}
                      >
                        <div className="text-lg">{t.emoji}</div>
                        <div className="font-semibold text-sm text-gray-900">
                          {t.name}
                        </div>
                        <div className="text-xs text-gray-500">{t.age}</div>
                        <div className="text-xs text-gray-400">
                          {t.duration}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <span className="text-xs text-gray-500">Bahasa</span>
                  <select
                    className={inputCls + " mt-1"}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="">— Pilih bahasa —</option>
                    {TRIAL_LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                {program === "private" && (
                  <div>
                    <span className="text-xs text-gray-500">
                      Durasi per sesi
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
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
              </div>

              {/* 4. Preferensi jadwal */}
              <div className="space-y-3">
                <label className={labelCls}>
                  4. Preferensi Jadwal{" "}
                  <span className="font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>
                <div>
                  <span className="text-xs text-gray-500">Hari</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
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
                  <span className="text-xs text-gray-500">Waktu</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
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

              {/* Ringkasan harga */}
              <div className="rounded-xl bg-teal-50 border border-teal-100 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">
                    Biaya trial (1 sesi)
                  </div>
                  <div className="text-xl font-bold" style={{ color: TEAL }}>
                    {price != null ? formatRupiah(price) : "—"}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400 max-w-[45%]">
                  Lanjut ke paket penuh setelah trial dibayar terpisah,
                  tanpa potongan.
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ background: TEAL }}
              >
                {submitting
                  ? "Memproses…"
                  : price != null
                  ? `Daftar & Bayar ${formatRupiah(price)}`
                  : "Daftar & Bayar"}
              </button>

              <p className="text-center text-xs text-gray-400">
                Pembayaran aman lewat Xendit. Ada kendala?{" "}
                <a
                  href={WA_ADMIN}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                  style={{ color: TEAL }}
                >
                  Chat admin
                </a>
              </p>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
