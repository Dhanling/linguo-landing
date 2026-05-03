"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crown,
  Users,
  Check,
  ChevronRight,
  Clock,
  Calendar,
  Loader2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

export interface PrefilledData {
  name: string;
  email: string;
  whatsapp: string;
  source: string;               // e.g. "placement-toefl-itp"
  testBand?: string;            // e.g. "Band 4-5"
  testScore?: string;           // e.g. "2/10"
  recommendedProgram: string;   // e.g. "Foundation IELTS"
  language: string;             // e.g. "english"
  level?: string;               // e.g. "foundation-ielts"
}

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  data: PrefilledData;
}

interface ClassBatch {
  id: string;
  name: string;
  language: string;
  level: string | null;
  schedule: string | null;
  day_time: string | null;
  quota: number | null;
  enrolled: number | null;
}

type Step = "choose" | "private" | "reguler" | "waitlist" | "success";

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────

export default function RegisterModal({ open, onClose, data }: RegisterModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Private form state
  const [preferredTime, setPreferredTime] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [preferredStartDate, setPreferredStartDate] = useState<string>("");

  // Reguler state
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batches, setBatches] = useState<ClassBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("choose");
      setError("");
      setSubmitting(false);
      setSelectedBatchId(null);
    }
  }, [open]);

  // Fetch batches when step becomes "reguler"
  useEffect(() => {
    if (step !== "reguler") return;
    setBatchesLoading(true);
    setBatches([]);

    let q = supabase
      .from("class_batches")
      .select("id, name, language, level, schedule, day_time, quota, enrolled")
      .eq("language", data.language);

    if (data.level) q = q.eq("level", data.level);

    q.then(({ data: rows, error: err }) => {
      setBatchesLoading(false);
      if (err) {
        console.error("[batches]", err);
        return;
      }
      // Filter: ada slot kosong (enrolled < quota)
      const available = (rows ?? []).filter(
        (b) => (b.enrolled ?? 0) < (b.quota ?? 0)
      );
      setBatches(available as ClassBatch[]);
    });
  }, [step, data.language, data.level]);

  // ── Submit Private ──
  async function submitPrivate() {
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.from("program_registrations").insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      whatsapp: data.whatsapp.trim(),
      format: "private",
      language: data.language,
      level: data.level ?? null,
      recommended_program: data.recommendedProgram,
      preferred_time: preferredTime || null,
      frequency: frequency || null,
      preferred_start_date: preferredStartDate || null,
      source: data.source,
      test_score: data.testScore ?? null,
      test_band: data.testBand ?? null,
    });
    setSubmitting(false);
    if (err) {
      console.error("[program_registrations insert]", err);
      setError("Gagal menyimpan data. Coba lagi ya.");
      return;
    }
    setStep("success");
  }

  // ── Submit Reguler (pick batch) ──
  async function submitReguler(batchId: string) {
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.from("program_registrations").insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      whatsapp: data.whatsapp.trim(),
      format: "reguler",
      language: data.language,
      level: data.level ?? null,
      recommended_program: data.recommendedProgram,
      batch_id: batchId,
      source: data.source,
      test_score: data.testScore ?? null,
      test_band: data.testBand ?? null,
    });
    setSubmitting(false);
    if (err) {
      console.error("[program_registrations insert]", err);
      setError("Gagal menyimpan data. Coba lagi ya.");
      return;
    }
    setStep("success");
  }

  // ── Submit Waitlist ──
  async function submitWaitlist() {
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.from("waitlist").insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      whatsapp: data.whatsapp.trim(),
      language: data.language,
      level: data.level ?? "unspecified",
      recommended_program: data.recommendedProgram,
      source: data.source,
      test_band: data.testBand ?? null,
    });
    setSubmitting(false);
    if (err) {
      console.error("[waitlist insert]", err);
      setError("Gagal menyimpan data. Coba lagi ya.");
      return;
    }
    setStep("success");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <div className="overflow-y-auto">
              {step === "choose" && <ChooseStep data={data} onChoose={setStep} />}
              {step === "private" && (
                <PrivateStep
                  data={data}
                  preferredTime={preferredTime}
                  setPreferredTime={setPreferredTime}
                  frequency={frequency}
                  setFrequency={setFrequency}
                  preferredStartDate={preferredStartDate}
                  setPreferredStartDate={setPreferredStartDate}
                  onBack={() => setStep("choose")}
                  onSubmit={submitPrivate}
                  submitting={submitting}
                  error={error}
                />
              )}
              {step === "reguler" && (
                <RegulerStep
                  data={data}
                  batches={batches}
                  batchesLoading={batchesLoading}
                  selectedBatchId={selectedBatchId}
                  setSelectedBatchId={setSelectedBatchId}
                  onBack={() => setStep("choose")}
                  onPick={submitReguler}
                  onWaitlist={() => setStep("waitlist")}
                  submitting={submitting}
                  error={error}
                />
              )}
              {step === "waitlist" && (
                <WaitlistStep
                  data={data}
                  onBack={() => setStep("reguler")}
                  onSubmit={submitWaitlist}
                  submitting={submitting}
                  error={error}
                />
              )}
              {step === "success" && <SuccessStep data={data} onClose={onClose} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 1: CHOOSE (Private vs Reguler)
// ─────────────────────────────────────────────────────────

function ChooseStep({
  data,
  onChoose,
}: {
  data: PrefilledData;
  onChoose: (s: Step) => void;
}) {
  return (
    <div>
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-8 pb-6 text-white">
        <p className="text-xs uppercase tracking-widest opacity-90 font-semibold mb-1">
          Daftar Program
        </p>
        <h2 className="text-2xl font-extrabold leading-tight">
          {data.recommendedProgram}
        </h2>
        <p className="text-sm opacity-90 mt-1">
          Pilih format belajar yang cocok untukmu
        </p>
      </div>

      <div className="p-6 space-y-3">
        {/* Private 1:1 */}
        <button
          onClick={() => onChoose("private")}
          className="w-full p-5 rounded-2xl border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-base">Private 1:1</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Fleksibel jadwal, intensif, 1-on-1 sama pengajar
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <Check className="w-3 h-3" /> Selalu tersedia
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 mt-1 flex-shrink-0" />
          </div>
        </button>

        {/* Kelas Reguler */}
        <button
          onClick={() => onChoose("reguler")}
          className="w-full p-5 rounded-2xl border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-base">Kelas Reguler</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Belajar bareng teman, jadwal fixed, lebih hemat
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="inline-flex items-center gap-1 text-violet-700 font-medium">
                  <Sparkles className="w-3 h-3" /> Cek batch tersedia
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 mt-1 flex-shrink-0" />
          </div>
        </button>
      </div>

      <div className="px-6 pb-6">
        <p className="text-xs text-gray-500 text-center">
          Tim Linguo akan kontak kamu max 1x24 jam setelah daftar.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 2A: PRIVATE FORM
// ─────────────────────────────────────────────────────────

function PrivateStep({
  data,
  preferredTime,
  setPreferredTime,
  frequency,
  setFrequency,
  preferredStartDate,
  setPreferredStartDate,
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  data: PrefilledData;
  preferredTime: string;
  setPreferredTime: (v: string) => void;
  frequency: string;
  setFrequency: (v: string) => void;
  preferredStartDate: string;
  setPreferredStartDate: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string;
}) {
  const today = new Date().toISOString().split("T")[0];

  const times = [
    { value: "pagi", label: "Pagi", hint: "06–10" },
    { value: "siang", label: "Siang", hint: "10–14" },
    { value: "sore", label: "Sore", hint: "14–18" },
    { value: "malam", label: "Malam", hint: "18–22" },
  ];
  const freqs = [
    { value: "1x_per_week", label: "1x / minggu" },
    { value: "2x_per_week", label: "2x / minggu" },
  ];

  return (
    <div>
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-6 pt-8 pb-6 text-white">
        <button
          onClick={onBack}
          className="text-xs opacity-90 hover:opacity-100 mb-2 transition-opacity"
        >
          ← Kembali
        </button>
        <h2 className="text-2xl font-extrabold leading-tight">Private 1:1</h2>
        <p className="text-sm opacity-90 mt-1">
          {data.recommendedProgram} · Preferensi jadwal kamu
        </p>
      </div>

      <div className="p-6 space-y-5">
        {/* Preferred time */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Waktu yang cocok untukmu
          </label>
          <div className="grid grid-cols-2 gap-2">
            {times.map((t) => (
              <button
                key={t.value}
                onClick={() => setPreferredTime(t.value)}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  preferredTime === t.value
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-500">{t.hint}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Frekuensi belajar
          </label>
          <div className="grid grid-cols-2 gap-2">
            {freqs.map((f) => (
              <button
                key={f.value}
                onClick={() => setFrequency(f.value)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  frequency === f.value
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">{f.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred start date */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Tanggal mau mulai (opsional)
          </label>
          <input
            type="date"
            min={today}
            value={preferredStartDate}
            onChange={(e) => setPreferredStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:outline-none transition-colors text-gray-900"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-base hover:opacity-95 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              Daftar Sekarang <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Tim akan hubungi {data.whatsapp} max 1x24 jam.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 2B: REGULER (BATCH PICKER)
// ─────────────────────────────────────────────────────────

function RegulerStep({
  data,
  batches,
  batchesLoading,
  selectedBatchId,
  setSelectedBatchId,
  onBack,
  onPick,
  onWaitlist,
  submitting,
  error,
}: {
  data: PrefilledData;
  batches: ClassBatch[];
  batchesLoading: boolean;
  selectedBatchId: string | null;
  setSelectedBatchId: (v: string | null) => void;
  onBack: () => void;
  onPick: (id: string) => void;
  onWaitlist: () => void;
  submitting: boolean;
  error: string;
}) {
  return (
    <div>
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-6 pt-8 pb-6 text-white">
        <button
          onClick={onBack}
          className="text-xs opacity-90 hover:opacity-100 mb-2 transition-opacity"
        >
          ← Kembali
        </button>
        <h2 className="text-2xl font-extrabold leading-tight">Kelas Reguler</h2>
        <p className="text-sm opacity-90 mt-1">
          {data.recommendedProgram} · Pilih batch yang tersedia
        </p>
      </div>

      <div className="p-6 space-y-4">
        {batchesLoading && (
          <div className="py-8 flex items-center justify-center text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cek ketersediaan
            batch...
          </div>
        )}

        {!batchesLoading && batches.length === 0 && (
          <div className="py-8 text-center">
            <div className="inline-flex w-14 h-14 rounded-full bg-violet-100 items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-violet-600" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">
              Batch baru belum dibuka
            </p>
            <p className="text-sm text-gray-600 mb-5">
              Untuk {data.recommendedProgram} belum ada batch yang lagi
              enrolling.
              <br />
              Mau saya kabarin pas dibuka?
            </p>
            <button
              onClick={onWaitlist}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:opacity-95 inline-flex items-center gap-1"
            >
              Daftar Waiting List <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {!batchesLoading && batches.length > 0 && (
          <>
            <div className="space-y-2">
              {batches.map((b) => {
                const slotsLeft = (b.quota ?? 0) - (b.enrolled ?? 0);
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBatchId(b.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedBatchId === b.id
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">
                          {b.name}
                        </p>
                        {b.day_time && (
                          <p className="text-xs text-gray-600 mt-0.5 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {b.day_time}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-violet-700">
                          {slotsLeft} slot
                        </p>
                        <p className="text-[10px] text-gray-500">tersisa</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              onClick={() => selectedBatchId && onPick(selectedBatchId)}
              disabled={!selectedBatchId || submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-base hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  Ambil Slot Ini <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Tim akan konfirmasi pembayaran via WA max 1x24 jam.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 2C: WAITLIST FORM
// ─────────────────────────────────────────────────────────

function WaitlistStep({
  data,
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  data: PrefilledData;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string;
}) {
  return (
    <div>
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-6 pt-8 pb-6 text-white">
        <button
          onClick={onBack}
          className="text-xs opacity-90 hover:opacity-100 mb-2 transition-opacity"
        >
          ← Kembali
        </button>
        <h2 className="text-2xl font-extrabold leading-tight">Waiting List</h2>
        <p className="text-sm opacity-90 mt-1">
          Kami kabarin pas batch baru dibuka
        </p>
      </div>

      <div className="p-6 space-y-4">
        <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100">
          <p className="text-sm text-gray-700">
            Kamu akan masuk daftar tunggu untuk:
          </p>
          <p className="font-bold text-gray-900 mt-1">
            {data.recommendedProgram}
          </p>
          <div className="mt-3 pt-3 border-t border-violet-200/60 space-y-1">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Nama:</span> {data.name}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Email:</span> {data.email}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">WhatsApp:</span> {data.whatsapp}
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          onClick={onSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-base hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              Konfirmasi Daftar Tunggu <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Saat batch baru dibuka, tim akan langsung kabarin via WhatsApp.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// STEP 3: SUCCESS
// ─────────────────────────────────────────────────────────

function SuccessStep({
  data,
  onClose,
}: {
  data: PrefilledData;
  onClose: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="inline-flex w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-4"
      >
        <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
      </motion.div>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
        Pendaftaran Diterima! 🎉
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Tim Linguo akan kontak kamu via WhatsApp ({data.whatsapp}) max 1x24 jam
        buat info berikutnya.
      </p>
      <button
        onClick={onClose}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-base hover:opacity-95"
      >
        Mengerti
      </button>
    </div>
  );
}
