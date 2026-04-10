"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const SCHEDULES = [
  "Senin pagi (08-12)",
  "Senin siang (12-17)",
  "Senin malam (17-21)",
  "Selasa pagi (08-12)",
  "Selasa siang (12-17)",
  "Selasa malam (17-21)",
  "Rabu pagi (08-12)",
  "Rabu siang (12-17)",
  "Rabu malam (17-21)",
  "Kamis pagi (08-12)",
  "Kamis siang (12-17)",
  "Kamis malam (17-21)",
  "Jumat pagi (08-12)",
  "Jumat siang (12-17)",
  "Jumat malam (17-21)",
  "Sabtu pagi (08-12)",
  "Sabtu siang (12-17)",
  "Sabtu malam (17-21)",
  "Minggu pagi (08-12)",
  "Minggu siang (12-17)",
  "Minggu malam (17-21)",
];

const EXPERIENCE_OPTIONS = [
  { id: "none", label: "Belum pernah sama sekali", icon: "🌱" },
  { id: "self", label: "Belajar sendiri (YouTube, app)", icon: "📱" },
  { id: "course", label: "Pernah kursus sebelumnya", icon: "📚" },
  { id: "school", label: "Belajar di sekolah/kuliah", icon: "🎓" },
  { id: "lived", label: "Pernah tinggal di negara tersebut", icon: "✈️" },
];

const GOALS = [
  { id: "travel", label: "Traveling", icon: "🌍" },
  { id: "work", label: "Karir / Kerja", icon: "💼" },
  { id: "study", label: "Studi ke luar negeri", icon: "🎓" },
  { id: "hobby", label: "Hobi / Interest", icon: "❤️" },
  { id: "family", label: "Keluarga / Pasangan", icon: "👨‍👩‍👧" },
  { id: "other", label: "Lainnya", icon: "✨" },
];

type LeadData = {
  name: string;
  email: string;
  wa_number: string;
  language: string;
  program: string;
  level: string;
  onboarding_completed: boolean;
};

export default function OnboardingPage() {
  const params = useParams();
  const token = params.token as string;

  const [lead, setLead] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form fields
  const [birthdate, setBirthdate] = useState("");
  const [domicile, setDomicile] = useState("");
  const [reason, setReason] = useState("");
  const [experience, setExperience] = useState("");
  const [schedules, setSchedules] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/onboarding?token=${token}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((d) => { setLead(d); if (d.onboarding_completed) setAlreadyDone(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleSchedule = (s: string) => {
    setSchedules((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleSubmit = async () => {
    if (!birthdate) { setError("Masukkan tanggal lahir"); return; }
    if (!domicile.trim()) { setError("Masukkan domisili"); return; }
    if (!experience) { setError("Pilih pengalaman belajar"); return; }
    if (schedules.length === 0) { setError("Pilih minimal 1 jadwal"); return; }
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          birthdate,
          domicile,
          reason: reason || goal,
          experience,
          schedule_preference: schedules.join(", "),
          learning_goal: goal,
        }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        setError("Gagal menyimpan. Coba lagi.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white">
      <div className="text-center">
        <div className="h-10 w-10 border-3 border-[#1A9E9E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Memuat data...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="text-center max-w-md">
        <span className="text-5xl block mb-4">🔍</span>
        <h1 className="text-2xl font-bold mb-2">Link tidak valid</h1>
        <p className="text-slate-500 mb-6">Link onboarding ini tidak ditemukan atau sudah kadaluarsa.</p>
        <a href="https://wa.me/6282116859493" target="_blank" className="text-[#1A9E9E] font-semibold hover:underline">Hubungi kami via WhatsApp</a>
      </div>
    </div>
  );

  if (alreadyDone || done) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4">
      <div className="text-center max-w-md">
        <span className="text-5xl block mb-4">🎉</span>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{done ? "Data berhasil disimpan!" : "Data kamu sudah lengkap!"}</h1>
        <p className="text-slate-500 mb-6">Tim Linguo akan segera menghubungi kamu via WhatsApp untuk mulai kelas. Sampai jumpa!</p>
        <div className="flex flex-col gap-3">
          <a href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20sudah%20lengkapi%20data%20onboarding" target="_blank"
            className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition inline-block">Chat WhatsApp</a>
          <a href="/" className="text-[#1A9E9E] hover:underline text-sm">Kembali ke halaman utama</a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <img src="/images/logo-white.png" alt="Linguo" className="h-10 brightness-0" />
          <span className="text-xs text-slate-400">Onboarding Form</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Hai {lead?.name?.split(" ")[0]}! 👋</h1>
          <p className="text-slate-500 text-sm">Lengkapi data di bawah supaya kami bisa siapkan kelas terbaik untukmu.</p>
          <div className="flex items-center gap-2 mt-3 bg-[#1A9E9E]/5 rounded-xl px-4 py-2.5 text-xs">
            <span className="font-medium text-[#1A9E9E]">{lead?.language}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">{lead?.program}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Level {lead?.level}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < step ? "bg-[#1A9E9E]" : "bg-slate-200"}`} />
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Data Pribadi</h2>
                <p className="text-sm text-slate-500">Bantu kami mengenal kamu lebih dekat</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tanggal Lahir</label>
                <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Domisili (Kota)</label>
                <input type="text" placeholder="contoh: Bandung, Jakarta, Surabaya" value={domicile} onChange={(e) => setDomicile(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20" />
              </div>
              <button onClick={() => { if (!birthdate || !domicile.trim()) { setError("Lengkapi semua field"); return; } setError(""); setStep(2); }}
                className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">
                Lanjut →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <button onClick={() => setStep(1)} className="text-sm text-[#1A9E9E] font-medium mb-2 hover:underline">← Kembali</button>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Pengalaman Belajar</h2>
                <p className="text-sm text-slate-500">Seberapa familiar kamu dengan bahasa {lead?.language}?</p>
              </div>
              <div className="space-y-2.5">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button key={opt.id} onClick={() => setExperience(opt.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left text-sm transition-all ${experience === opt.id ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E] font-medium" : "border-slate-100 text-slate-600 hover:border-slate-200"}`}>
                    <span className="text-xl">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
              <button onClick={() => { if (!experience) { setError("Pilih salah satu"); return; } setError(""); setStep(3); }}
                className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">
                Lanjut →
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <button onClick={() => setStep(2)} className="text-sm text-[#1A9E9E] font-medium mb-2 hover:underline">← Kembali</button>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Tujuan Belajar</h2>
                <p className="text-sm text-slate-500">Kenapa kamu tertarik belajar bahasa {lead?.language}?</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {GOALS.map((g) => (
                  <button key={g.id} onClick={() => setGoal(g.id)}
                    className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 text-sm transition-all ${goal === g.id ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-[#1A9E9E] font-medium" : "border-slate-100 text-slate-600 hover:border-slate-200"}`}>
                    <span className="text-2xl">{g.icon}</span>
                    {g.label}
                  </button>
                ))}
              </div>
              <button onClick={() => { if (!goal) { setError("Pilih tujuan belajar"); return; } setError(""); setStep(4); }}
                className="w-full bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg shadow-[#1A9E9E]/25">
                Lanjut →
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div>
                <button onClick={() => setStep(3)} className="text-sm text-[#1A9E9E] font-medium mb-2 hover:underline">← Kembali</button>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Preferensi Jadwal</h2>
                <p className="text-sm text-slate-500">Pilih waktu yang kamu mau (boleh lebih dari 1)</p>
              </div>
              <div className="space-y-1">
                {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((day) => (
                  <div key={day}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-3 mb-1.5">{day}</p>
                    <div className="flex gap-2">
                      {SCHEDULES.filter((s) => s.startsWith(day)).map((s) => {
                        const time = s.match(/\((.+)\)/)?.[1] || "";
                        const label = s.includes("pagi") ? "Pagi" : s.includes("siang") ? "Siang" : "Malam";
                        return (
                          <button key={s} onClick={() => toggleSchedule(s)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${schedules.includes(s) ? "bg-[#1A9E9E] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                            {label}<br /><span className="text-[10px] opacity-75">{time}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleSubmit} disabled={saving}
                className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-slate-900 font-bold py-3.5 rounded-full text-sm transition-all active:scale-95 shadow-lg mt-4">
                {saving ? "Menyimpan..." : "Kirim Data →"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-red-500 text-xs mt-3 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
