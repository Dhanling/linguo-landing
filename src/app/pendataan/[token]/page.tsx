// [pendataan-siswa-private-v1] Form Pendataan Siswa — pengganti Google Form.
//
// Dibuka siswa lewat link ber-token yang dibagikan admin dari dashboard setelah
// tagihan private dibuat / pembayaran masuk. Datanya langsung mendarat di tabel
// yang sama dengan data pembayaran (lihat migrasi 20260805120000), jadi tidak
// ada lagi langkah "salin dari spreadsheet ke dashboard".
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle, CalendarDays, Check, CheckCircle2, Clock, GraduationCap, Heart,
  History, Loader2, Mail, MessageCircle, Phone, Plus, School, SearchX, Target, User, X,
} from "lucide-react";

const TEAL = "#1A9E9E";
const WA_CS = "6282116859493";

type IntakeForm = {
  token: string;
  status: "pending" | "submitted";
  contact_name: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  language: string | null;
  program: string | null;
  level: string | null;
  full_name: string | null;
  nickname: string | null;
  whatsapp: string | null;
  email: string | null;
  preferred_schedule: string | null;
  birth_date: string | null;
  institution: string | null;
  learning_goal: string | null;
  hobby: string | null;
  prior_experience: string | null;
};

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const SLOTS = [
  { label: "Pagi", time: "08-12" },
  { label: "Siang", time: "12-17" },
  { label: "Malam", time: "17-21" },
];
const slotValue = (day: string, s: (typeof SLOTS)[number]) =>
  `${day} ${s.label.toLowerCase()} (${s.time})`;

// [pendataan-jam-spesifik-v1] Rentang Pagi/Siang/Malam saja tidak cukup: banyak
// siswa sudah punya jam pasti ("Selasa 13.00", "Kamis 19.30") dan dulu terpaksa
// menitipkannya lewat chat CS. Jam spesifik disimpan di kolom yang sama,
// digabung koma, dengan bentuk "<Hari> pukul <HH.MM>" — dashboard cukup
// membacanya apa adanya.
const SPECIFIC_RE = /^(.+?) pukul (\d{1,2})[.:](\d{2})$/;
const specificValue = (day: string, hhmm: string) => `${day} pukul ${hhmm.replace(":", ".")}`;
const MIN_TIME = "06:00";
const MAX_TIME = "21:00";
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Urutkan sesuai hari lalu jam supaya string yang dibaca admin runut, bukan
 *  mengikuti urutan klik siswa. */
const sortSchedules = (list: string[]) => {
  const rank = (v: string) => {
    const specific = v.match(SPECIFIC_RE);
    const day = specific ? specific[1] : DAYS.find((d) => v.startsWith(`${d} `)) || "";
    const dayIdx = DAYS.indexOf(day);
    const minute = specific
      ? Number(specific[2]) * 60 + Number(specific[3])
      : SLOTS.findIndex((s) => v.includes(`(${s.time})`)) * 60;
    return [dayIdx < 0 ? DAYS.length : dayIdx, specific ? 1 : 0, minute] as const;
  };
  return [...list].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2];
  });
};

const GOALS = [
  "Persiapan kerja / karier",
  "Studi ke luar negeri",
  "Traveling",
  "Keluarga / pasangan",
  "Hobi & minat pribadi",
  "Kebutuhan kantor / bisnis",
];

// [pendataan-siswa-private-v2] Pengalaman belajar sebelumnya. Pilihannya
// menentukan sesi pertama: yang benar-benar nol mulai dari huruf & sapaan,
// yang pernah kursus langsung dites penempatan supaya tidak mengulang.
const EXPERIENCES = [
  "Belum pernah sama sekali",
  "Otodidak (aplikasi / YouTube)",
  "Pernah les / kursus",
  "Pelajaran sekolah / kampus",
  "Pernah tinggal / kerja di negaranya",
];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 transition";

function Field({
  label, icon: Icon, required, hint, children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30 px-4 py-16">
      <div className="mx-auto max-w-md text-center">{children}</div>
    </div>
  );
}

export default function PendataanPage() {
  const params = useParams();
  const token = params.token as string;

  const [form, setForm] = useState<IntakeForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [institution, setInstitution] = useState("");
  const [hobby, setHobby] = useState("");
  const [experience, setExperience] = useState("");
  const [experienceNote, setExperienceNote] = useState("");
  const [schedules, setSchedules] = useState<string[]>([]);
  const [timeDraft, setTimeDraft] = useState<Record<string, string>>({});
  const [timeOpen, setTimeOpen] = useState<Record<string, boolean>>({});
  const [timeError, setTimeError] = useState<Record<string, string>>({});
  const [goal, setGoal] = useState("");

  useEffect(() => {
    fetch(`/api/pendataan?token=${encodeURIComponent(token)}`)
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((d: IntakeForm) => {
        setForm(d);
        if (d.status === "submitted") { setAlreadyDone(true); return; }
        // Prefill dari yang sudah diketik admin waktu bikin tagihan — siswa
        // tinggal membetulkan, bukan mengetik ulang dari nol.
        setFullName(d.full_name || d.contact_name || "");
        setNickname(d.nickname || "");
        setWhatsapp(d.whatsapp || d.contact_whatsapp || "");
        setEmail(d.email || d.contact_email || "");
        setInstitution(d.institution || "");
        setGoal(d.learning_goal || "");
        setHobby(d.hobby || "");
        if (d.prior_experience) {
          // Disimpan sebagai "<pilihan> — <detail>"; dipecah balik supaya chip
          // yang dulu dipilih tetap tersorot waktu form dibuka ulang.
          const pick = EXPERIENCES.find((e) => d.prior_experience!.startsWith(e));
          setExperience(pick || "");
          setExperienceNote(pick ? d.prior_experience!.slice(pick.length).replace(/^\s*—\s*/, "") : d.prior_experience);
        }
        setSchedules(d.preferred_schedule ? d.preferred_schedule.split(", ").filter(Boolean) : []);
        if (d.birth_date) {
          const [y, m, dd] = d.birth_date.split("-");
          setBirthYear(y || ""); setBirthMonth(String(Number(m))); setBirthDay(String(Number(dd)));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const birthdate = birthYear && birthMonth && birthDay
    ? `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
    : "";

  // Usia ikut tanggal lahir dan tidak bisa diketik terpisah: dua kolom yang
  // saling bertentangan adalah masalah administrasi yang baru ketahuan nanti.
  const age = useMemo(() => {
    if (!birthdate) return null;
    const d = new Date(`${birthdate}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const before = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
    if (before) a -= 1;
    return a >= 1 && a <= 120 ? a : null;
  }, [birthdate]);

  const toggleSchedule = (v: string) =>
    setSchedules((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  // Jam spesifik tidak disimpan di state terpisah — dibaca balik dari
  // `schedules` supaya form yang dibuka ulang menampilkan persis yang tersimpan.
  const specificByDay = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const v of schedules) {
      const m = v.match(SPECIFIC_RE);
      if (!m || !DAYS.includes(m[1])) continue;
      (map[m[1]] ||= []).push(`${m[2].padStart(2, "0")}.${m[3]}`);
    }
    for (const day of Object.keys(map)) map[day].sort();
    return map;
  }, [schedules]);

  const addSpecific = (day: string) => {
    const raw = (timeDraft[day] || "").trim();
    const fail = (msg: string) => setTimeError((prev) => ({ ...prev, [day]: msg }));
    if (!/^\d{2}:\d{2}$/.test(raw)) return fail("Isi jamnya dulu, contoh 13.00");
    if (toMinutes(raw) < toMinutes(MIN_TIME) || toMinutes(raw) > toMinutes(MAX_TIME))
      return fail("Kelas tersedia antara 06.00-21.00 WIB");
    const v = specificValue(day, raw);
    if (schedules.includes(v)) return fail("Jam itu sudah kamu pilih");
    setSchedules((prev) => [...prev, v]);
    setTimeDraft((prev) => ({ ...prev, [day]: "" }));
    setTimeError((prev) => ({ ...prev, [day]: "" }));
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) { setError("Nama lengkap wajib diisi"); return; }
    if (!whatsapp.trim()) { setError("Nomor WhatsApp wajib diisi"); return; }
    if (!birthdate) { setError("Lengkapi tanggal lahir"); return; }
    if (!experience) { setError("Pilih pengalaman belajarmu sebelumnya"); return; }
    if (schedules.length === 0) { setError("Pilih minimal 1 jadwal yang kamu inginkan"); return; }
    if (!goal.trim()) { setError("Ceritakan sedikit tujuan belajarmu"); return; }

    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/pendataan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          full_name: fullName,
          nickname,
          whatsapp,
          email,
          birth_date: birthdate,
          institution,
          hobby,
          prior_experience: experienceNote.trim() ? `${experience} — ${experienceNote.trim()}` : experience,
          preferred_schedule: sortSchedules(schedules).join(", "),
          learning_goal: goal,
        }),
      });
      if (res.ok) { setDone(true); return; }
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) { setAlreadyDone(true); return; }
      setError(body?.error || "Gagal menyimpan. Coba lagi.");
    } catch {
      setError("Koneksi terputus. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <Loader2 className="mx-auto mb-4 h-9 w-9 animate-spin" style={{ color: TEAL }} />
        <p className="text-sm text-slate-500">Memuat form...</p>
      </Shell>
    );
  }

  if (notFound) {
    return (
      <Shell>
        <SearchX className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Link tidak valid</h1>
        <p className="mb-6 text-slate-500">Link pendataan ini tidak ditemukan. Pastikan link yang kamu buka utuh (tidak terpotong saat disalin dari WhatsApp).</p>
        <a href={`https://wa.me/${WA_CS}`} target="_blank" rel="noreferrer" className="font-semibold hover:underline" style={{ color: TEAL }}>
          Hubungi kami via WhatsApp
        </a>
      </Shell>
    );
  }

  if (alreadyDone || done) {
    return (
      <Shell>
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12" style={{ color: TEAL }} />
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          {done ? "Data berhasil dikirim!" : "Data kamu sudah lengkap"}
        </h1>
        <p className="mb-6 text-slate-500">
          Tim Linguo akan menghubungi kamu via WhatsApp untuk konfirmasi jadwal dan pembuatan grup kelas.
        </p>
        <div className="flex flex-col items-center gap-3">
          <a href={`https://wa.me/${WA_CS}?text=Halo%20Linguo%2C%20saya%20sudah%20mengisi%20form%20pendataan`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-white transition hover:bg-green-600">
            <MessageCircle className="h-4 w-4" /> Chat WhatsApp
          </a>
          <a href="/" className="text-sm hover:underline" style={{ color: TEAL }}>Kembali ke halaman utama</a>
        </div>
      </Shell>
    );
  }

  const greetName = (form?.contact_name || "").split(" ")[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-white.png" alt="Linguo" className="h-10 brightness-0" />
          <span className="text-xs text-slate-400">Form Pendataan Siswa</span>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-1 text-2xl font-bold text-slate-900">
            Hai{greetName ? ` ${greetName}` : ""}, selamat bergabung!
          </h1>
          <p className="text-sm text-slate-500">
            Lengkapi data di bawah supaya kami bisa menyiapkan pengajar, jadwal, dan grup kelasmu.
          </p>
          {(form?.language || form?.program) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#1A9E9E]/5 px-4 py-2.5 text-xs">
              {form?.language && <span className="font-medium" style={{ color: TEAL }}>{form.language}</span>}
              {form?.language && form?.program && <span className="text-slate-300">•</span>}
              {form?.program && <span className="text-slate-600">{form.program}</span>}
              {form?.level && <><span className="text-slate-300">•</span><span className="text-slate-600">Level {form.level}</span></>}
            </div>
          )}
        </motion.div>

        <div className="mt-8 space-y-8">
          {/* ── Identitas ── */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Data Diri</h2>

            <Field label="Nama lengkap" icon={User} required>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Sesuai KTP / akta" className={inputClass} />
            </Field>

            <Field label="Nama panggilan" icon={User} hint="Nama yang dipakai pengajar saat kelas berlangsung.">
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                placeholder="contoh: Dina" className={inputClass} />
            </Field>

            <Field label="Tanggal lahir" icon={CalendarDays} required>
              <div className="flex gap-2">
                <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className={`${inputClass} flex-1 bg-white`}>
                  <option value="">Tgl</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={String(d)}>{d}</option>)}
                </select>
                <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={`${inputClass} flex-[2] bg-white`}>
                  <option value="">Bulan</option>
                  {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
                </select>
                <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className={`${inputClass} flex-1 bg-white`}>
                  <option value="">Tahun</option>
                  {Array.from({ length: 90 }, (_, i) => new Date().getFullYear() - i).map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
              {age !== null && (
                <p className="mt-1.5 text-[11px] font-medium" style={{ color: TEAL }}>Usia kamu {age} tahun</p>
              )}
            </Field>

            <Field label="Sekolah / instansi / perusahaan" icon={School} hint="Kosongkan kalau saat ini tidak sedang sekolah atau bekerja.">
              <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)}
                placeholder="contoh: SMAN 3 Bandung / PT Linguo Nusantara" className={inputClass} />
            </Field>

            <Field label="Hobi & minat" icon={Heart}
              hint="Pengajar memakainya sebagai bahan obrolan dan contoh materi di kelas.">
              <input type="text" value={hobby} onChange={(e) => setHobby(e.target.value)}
                placeholder="contoh: masak, sepak bola, nonton drama Korea" className={inputClass} />
            </Field>
          </section>

          {/* ── Pengalaman belajar ── */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Pengalaman Belajar</h2>
            <p className="flex items-start gap-1.5 text-xs text-slate-500">
              <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              Pernah belajar bahasa ini sebelumnya? Jawaban jujur membantu kami menaruhmu di
              level yang pas — bukan mengulang yang sudah kamu bisa.
            </p>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCES.map((e) => (
                <button key={e} type="button" onClick={() => setExperience(e)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${experience === e ? "border-transparent text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  style={experience === e ? { background: TEAL } : undefined}>
                  {experience === e && <Check className="h-3 w-3" />}
                  {e}
                </button>
              ))}
            </div>
            {experience && experience !== EXPERIENCES[0] && (
              <Field label="Ceritakan sedikit" icon={History}
                hint="Berapa lama, sampai level berapa, atau apa yang masih terasa sulit.">
                <input type="text" value={experienceNote} onChange={(e) => setExperienceNote(e.target.value)}
                  placeholder="contoh: 6 bulan les sampai level A1, masih susah bicara"
                  className={inputClass} />
              </Field>
            )}
          </section>

          {/* ── Kontak ── */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Kontak</h2>

            <Field label="Nomor WhatsApp" icon={Phone} required hint="Nomor ini yang akan dimasukkan ke grup kelas.">
              <input type="tel" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="contoh: 08123456789" className={inputClass} />
            </Field>

            <Field label="Email" icon={Mail} hint="Dipakai untuk kirim materi & akun belajar.">
              <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com" className={inputClass} />
            </Field>
          </section>

          {/* ── Jadwal ── */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Jadwal yang Diinginkan</h2>
            <p className="flex items-start gap-1.5 text-xs text-slate-500">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              Pilih semua waktu yang memungkinkan buat kamu (boleh lebih dari satu). Jam mengikuti WIB.
              Sudah punya jam pasti? Pakai <span className="font-medium text-slate-600">Tambah jam spesifik</span> di bawah harinya.
            </p>
            <div className="space-y-1">
              {DAYS.map((day) => {
                const times = specificByDay[day] || [];
                const open = timeOpen[day] || times.length > 0;
                return (
                <div key={day}>
                  <p className="mb-1.5 mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">{day}</p>
                  <div className="flex gap-2">
                    {SLOTS.map((s) => {
                      const v = slotValue(day, s);
                      const on = schedules.includes(v);
                      return (
                        <button key={v} type="button" onClick={() => toggleSchedule(v)}
                          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${on ? "text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                          style={on ? { background: TEAL } : undefined}>
                          {s.label}
                          <br />
                          <span className="text-[10px] opacity-75">{s.time}</span>
                        </button>
                      );
                    })}
                  </div>

                  {times.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {times.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                          style={{ borderColor: TEAL, color: TEAL }}>
                          {t}
                          <button type="button" onClick={() => toggleSchedule(specificValue(day, t))}
                            aria-label={`Hapus ${day} pukul ${t}`} className="opacity-60 transition hover:opacity-100">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {open ? (
                    <div className="mt-1.5">
                      <div className="flex gap-2">
                        <input type="time" step={300} min={MIN_TIME} max={MAX_TIME}
                          value={timeDraft[day] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTimeDraft((prev) => ({ ...prev, [day]: val }));
                            setTimeError((prev) => ({ ...prev, [day]: "" }));
                          }}
                          aria-label={`Jam spesifik hari ${day}`}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1A9E9E] focus:outline-none focus:ring-2 focus:ring-[#1A9E9E]/20" />
                        <button type="button" onClick={() => addSpecific(day)}
                          className="rounded-lg border px-3 py-2 text-[11px] font-semibold transition hover:bg-[#1A9E9E]/5"
                          style={{ borderColor: TEAL, color: TEAL }}>
                          Tambah
                        </button>
                      </div>
                      {timeError[day] && (
                        <p className="mt-1 text-[11px] text-red-500">{timeError[day]}</p>
                      )}
                    </div>
                  ) : (
                    <button type="button" onClick={() => setTimeOpen((prev) => ({ ...prev, [day]: true }))}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition hover:text-slate-600">
                      <Plus className="h-3 w-3" /> Tambah jam spesifik
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          </section>

          {/* ── Tujuan ── */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Tujuan Belajar</h2>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button key={g} type="button" onClick={() => setGoal(g)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${goal === g ? "border-transparent text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  style={goal === g ? { background: TEAL } : undefined}>
                  {goal === g ? <Check className="h-3 w-3" /> : <Target className="h-3 w-3 text-slate-400" />}
                  {g}
                </button>
              ))}
            </div>
            <Field label="Ceritakan lebih detail" icon={GraduationCap} required
              hint="Makin jelas tujuanmu, makin pas materi yang pengajar siapkan.">
              <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={4}
                placeholder="contoh: Mau lanjut S2 di Jerman tahun depan, target B1 buat syarat visa."
                className={`${inputClass} resize-none`} />
            </Field>
          </section>

          {error && (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}

          <button onClick={handleSubmit} disabled={saving}
            className="w-full rounded-full bg-[#fbbf24] py-3.5 text-sm font-bold text-slate-900 shadow-lg transition-all hover:bg-[#f59e0b] active:scale-95 disabled:opacity-50">
            {saving ? "Menyimpan..." : "Kirim Data"}
          </button>
          <p className="pb-8 text-center text-[11px] text-slate-400">
            Data kamu hanya dipakai untuk keperluan kelas di Linguo.
          </p>
        </div>
      </div>
    </div>
  );
}
