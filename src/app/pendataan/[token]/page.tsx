// [pendataan-siswa-private-v1] Form Pendataan Siswa — pengganti Google Form.
//
// Dibuka siswa lewat link ber-token yang dibagikan admin dari dashboard setelah
// tagihan private dibuat / pembayaran masuk. Datanya langsung mendarat di tabel
// yang sama dengan data pembayaran (lihat migrasi 20260805120000), jadi tidak
// ada lagi langkah "salin dari spreadsheet ke dashboard".
//
// [pendataan-wizard-v3] Dulu semua pertanyaan tertumpuk di satu halaman panjang
// dan bagian jadwal memakan 7 blok "Pagi/Siang/Malam + tambah jam spesifik" —
// siswa capek sebelum sampai bawah. Sekarang: 4 langkah pendek, dan jadwalnya
// jadi kisi (hari × jam) yang tiap kotaknya 30 menit, tinggal ketuk/geser.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2,
  ChevronLeft, ChevronRight, Clock, GraduationCap, Heart, History, Loader2, Mail,
  MessageCircle, Phone, School, SearchX, Sparkles, Target, User, X,
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
const DAYS_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// ── Jadwal: 1 kotak = 30 menit ────────────────────────────────────────────────
// Kotak disimpan sebagai "hari|menit-sejak-tengah-malam" (contoh "0|780" =
// Senin 13.00). Waktu selalu WIB, sama seperti jadwal kelas di dashboard.
const STEP_MIN = 30;
const EARLY_START = 6 * 60;   // 06.00 — disembunyikan sampai siswa memintanya
const DAY_START = 8 * 60;     // 08.00
const DAY_END = 21 * 60;      // 21.00 (kotak terakhir 20.30-21.00)

const blockKey = (dayIdx: number, minute: number) => `${dayIdx}|${minute}`;
const fmtTime = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}.${String(minute % 60).padStart(2, "0")}`;

/** Kotak-kotak berurutan digabung jadi satu rentang supaya yang dibaca admin
 *  ringkas: "Senin 19.00-20.30", bukan tiga baris 30 menit. */
function serializeBlocks(blocks: Set<string>): string {
  const byDay = new Map<number, number[]>();
  for (const key of blocks) {
    const [d, m] = key.split("|").map(Number);
    if (Number.isNaN(d) || Number.isNaN(m)) continue;
    const list = byDay.get(d) || [];
    list.push(m);
    byDay.set(d, list);
  }
  const out: string[] = [];
  for (let d = 0; d < DAYS.length; d++) {
    const mins = (byDay.get(d) || []).sort((a, b) => a - b);
    let i = 0;
    while (i < mins.length) {
      let end = mins[i] + STEP_MIN;
      let j = i + 1;
      while (j < mins.length && mins[j] === end) { end += STEP_MIN; j++; }
      out.push(`${DAYS[d]} ${fmtTime(mins[i])}-${fmtTime(end)}`);
      i = j;
    }
  }
  return out.join(", ");
}

const RANGE_RE = /^(\S+)\s+(\d{1,2})[.:](\d{2})\s*[-–]\s*(\d{1,2})[.:](\d{2})$/;
const LEGACY_SLOT_RE = /^(\S+)\s+\w+\s*\((\d{1,2})-(\d{1,2})\)$/;   // "Senin pagi (08-12)"
const LEGACY_SPECIFIC_RE = /^(\S+)\s+pukul\s+(\d{1,2})[.:](\d{2})$/; // "Senin pukul 13.00"

/** Baca balik nilai tersimpan jadi kotak-kotak. Bentuk lama (rentang
 *  Pagi/Siang/Malam & "pukul HH.MM") ikut dikenali supaya form yang pernah diisi
 *  sebelum kisi ini ada tetap tampil terpilih. */
function parseSchedule(raw: string | null): Set<string> {
  const set = new Set<string>();
  if (!raw) return set;
  const add = (dayIdx: number, from: number, to: number) => {
    for (let m = Math.max(from, 0); m < Math.min(to, 24 * 60); m += STEP_MIN) {
      set.add(blockKey(dayIdx, m - (m % STEP_MIN)));
    }
  };
  for (const chunk of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    let m = chunk.match(RANGE_RE);
    if (m) {
      const d = DAYS.indexOf(m[1]);
      if (d >= 0) add(d, Number(m[2]) * 60 + Number(m[3]), Number(m[4]) * 60 + Number(m[5]));
      continue;
    }
    m = chunk.match(LEGACY_SLOT_RE);
    if (m) {
      const d = DAYS.indexOf(m[1]);
      if (d >= 0) add(d, Number(m[2]) * 60, Number(m[3]) * 60);
      continue;
    }
    m = chunk.match(LEGACY_SPECIFIC_RE);
    if (m) {
      const d = DAYS.indexOf(m[1]);
      if (d >= 0) add(d, Number(m[2]) * 60 + Number(m[3]), Number(m[2]) * 60 + Number(m[3]) + STEP_MIN);
    }
  }
  return set;
}

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

const STEPS = [
  { title: "Data Diri", icon: User },
  { title: "Kontak", icon: Phone },
  { title: "Tujuan", icon: Target },
  { title: "Jadwal", icon: CalendarDays },
];

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-[#1A9E9E] focus:outline-none focus:ring-4 focus:ring-[#1A9E9E]/10";

const chipClass = (on: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition active:scale-95 ${
    on ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-[#1A9E9E]/40 hover:text-slate-900"
  }`;

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
      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{hint}</p>}
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

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const THIS_YEAR = new Date().getFullYear();

/** Pemilih tanggal lahir dalam satu kolom. Tiga dropdown terpisah (tgl/bulan/
 *  tahun) memaksa tiga keputusan untuk satu jawaban, dan di HP tiap dropdown
 *  membuka penggulung sistem yang panjang. Di sini: satu tombol → kalender,
 *  dengan bulan & tahun yang bisa dilompati langsung. */
function BirthDatePicker({
  day, month, year, onPick,
}: {
  day: string; month: string; year: string;
  onPick: (d: string, m: string, y: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => (month ? Number(month) : 1));
  const [viewYear, setViewYear] = useState(() => (year ? Number(year) : THIS_YEAR - 20));
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Di layar HP kalendernya lebih tinggi dari sisa halaman; tanpa ini
    // separuhnya tertutup bilah tombol dan siswa mengira tanggalnya cuma sedikit.
    boxRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const openPicker = () => {
    if (month) setViewMonth(Number(month));
    if (year) setViewYear(Number(year));
    setOpen(true);
  };

  const shift = (delta: number) => {
    const m = viewMonth + delta;
    if (m < 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else if (m > 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(m);
  };

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  // getDay() menghitung Minggu sebagai 0; kalender di sini mulai Senin.
  const lead = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7;
  const today = new Date();
  const isFuture = (d: number) => new Date(viewYear, viewMonth - 1, d) > today;

  const label = day && month && year
    ? `${day} ${MONTHS[Number(month) - 1]} ${year}`
    : "Pilih tanggal lahir";

  return (
    <div className="relative" ref={boxRef}>
      <button type="button" onClick={() => (open ? setOpen(false) : openPicker())}
        className={`${inputClass} flex items-center justify-between text-left`}>
        <span className={day && month && year ? "text-slate-900" : "text-slate-400"}>{label}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center gap-2">
            <button type="button" onClick={() => shift(-1)} aria-label="Bulan sebelumnya"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))}
              aria-label="Bulan"
              className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#1A9E9E] focus:outline-none">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))}
              aria-label="Tahun"
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#1A9E9E] focus:outline-none">
              {Array.from({ length: 90 }, (_, i) => THIS_YEAR - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" onClick={() => shift(1)} aria-label="Bulan berikutnya"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1 text-center text-[10px] font-bold uppercase text-slate-400">{w}</div>
            ))}
            {Array.from({ length: lead }, (_, i) => <div key={`lead-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const picked = Number(day) === d && Number(month) === viewMonth && Number(year) === viewYear;
              const future = isFuture(d);
              return (
                <button key={d} type="button" disabled={future}
                  onClick={() => { onPick(String(d), String(viewMonth), String(viewYear)); setOpen(false); }}
                  className={`aspect-square rounded-lg text-xs font-medium transition ${
                    picked ? "text-white" : future ? "text-slate-200" : "text-slate-600 hover:bg-[#1A9E9E]/10"
                  }`}
                  style={picked ? { background: TEAL } : undefined}>
                  {d}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/** Kisi hari × jam. Punya penggulung sendiri (bukan ikut halaman) supaya ringkasan
 *  pilihan & tombol Kirim tetap terlihat sambil memilih; baris hari mengambang di
 *  puncaknya biar kolom tidak perlu dihafal waktu menggulung ke jam malam.
 *  Di HP kotaknya sengaja ketuk-saja (bukan geser) — kalau kotak menahan gerakan
 *  jari, penggulungnya jadi rebutan. */
function ScheduleGrid({
  blocks, setBlocks, showEarly, onShowEarly,
}: {
  blocks: Set<string>;
  setBlocks: (updater: (prev: Set<string>) => Set<string>) => void;
  showEarly: boolean;
  onShowEarly: () => void;
}) {
  const paintMode = useRef<"add" | "remove" | null>(null);
  const skipClick = useRef(false);

  useEffect(() => {
    const stop = () => { paintMode.current = null; };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  const apply = useCallback((key: string, mode: "add" | "remove") => {
    setBlocks((prev) => {
      if (mode === "add" ? prev.has(key) : !prev.has(key)) return prev;
      const next = new Set(prev);
      if (mode === "add") next.add(key); else next.delete(key);
      return next;
    });
  }, [setBlocks]);

  const rows: number[] = [];
  for (let m = showEarly ? EARLY_START : DAY_START; m < DAY_END; m += STEP_MIN) rows.push(m);

  /** Satu ketukan untuk "tiap hari jam segini" — kasus paling sering di WA. */
  const toggleRow = (minute: number) => {
    const allOn = DAYS.every((_, d) => blocks.has(blockKey(d, minute)));
    setBlocks((prev) => {
      const next = new Set(prev);
      DAYS.forEach((_, d) => (allOn ? next.delete(blockKey(d, minute)) : next.add(blockKey(d, minute))));
      return next;
    });
  };

  return (
    <div className="select-none">
      {!showEarly && (
        <button type="button" onClick={onShowEarly}
          className="mb-2 text-[11px] font-medium text-slate-400 transition hover:text-slate-600">
          + Tampilkan jam pagi (06.00-08.00)
        </button>
      )}

      <div className="max-h-[62vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid" style={{ gridTemplateColumns: `48px repeat(${DAYS.length}, minmax(0, 1fr))` }}>
          {/* Latar wajib pekat, bukan transparan: baris ini melayang di atas
              kotak-kotak yang lewat di bawahnya waktu digulung. */}
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50" />
          {DAYS_SHORT.map((d) => (
            <div key={d} className="sticky top-0 z-10 border-b border-l border-slate-200 bg-slate-50 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {d}
            </div>
          ))}

          {rows.map((minute) => {
            const onHour = minute % 60 === 0;
            return (
              <div key={minute} className="contents">
                <button type="button" onClick={() => toggleRow(minute)}
                  title="Pilih jam ini di semua hari"
                  className={`border-t bg-slate-50/80 pr-1.5 text-right text-[10px] font-medium tabular-nums transition hover:text-[#1A9E9E] ${
                    onHour ? "border-slate-200 text-slate-500" : "border-dashed border-slate-100 text-slate-300"
                  }`}>
                  {onHour ? fmtTime(minute) : ".30"}
                </button>
                {DAYS.map((_, d) => {
                  const key = blockKey(d, minute);
                  const on = blocks.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${DAYS[d]} ${fmtTime(minute)}`}
                      onPointerDown={(e) => {
                        // Sentuhan sengaja tidak ikut mode geser: kalau kotak
                        // menahan gerakan jari, halaman jadi tidak bisa di-scroll.
                        if (e.pointerType !== "mouse") return;
                        e.preventDefault();
                        skipClick.current = true;
                        const mode = on ? "remove" : "add";
                        paintMode.current = mode;
                        apply(key, mode);
                      }}
                      onPointerEnter={() => { if (paintMode.current) apply(key, paintMode.current); }}
                      onClick={() => {
                        if (skipClick.current) { skipClick.current = false; return; }
                        apply(key, on ? "remove" : "add");
                      }}
                      className={`h-8 border-l border-t transition-colors ${
                        onHour ? "border-t-slate-200" : "border-t-slate-100"
                      } ${on ? "border-l-white/40" : "border-l-slate-100 hover:bg-[#1A9E9E]/10"}`}
                      // Garis putus-putus menandai batas 30 menit; `border-dashed`
                      // Tailwind kena semua sisi, jadi sisi atasnya diatur di sini.
                      style={{ borderTopStyle: onHour ? "solid" : "dashed", ...(on ? { background: TEAL } : {}) }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
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

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

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
  const [blocks, setBlocks] = useState<Set<string>>(new Set());
  const [showEarly, setShowEarly] = useState(false);
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
        const parsed = parseSchedule(d.preferred_schedule);
        setBlocks(parsed);
        // Pilihan subuh yang pernah tersimpan harus kelihatan, bukan tersembunyi
        // di balik tombol "tampilkan jam pagi".
        for (const key of parsed) {
          if (Number(key.split("|")[1]) < DAY_START) { setShowEarly(true); break; }
        }
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

  const scheduleText = useMemo(() => serializeBlocks(blocks), [blocks]);
  const scheduleChips = useMemo(
    () => (scheduleText ? scheduleText.split(", ") : []),
    [scheduleText],
  );

  const removeChip = (chip: string) => {
    const m = chip.match(RANGE_RE);
    if (!m) return;
    const d = DAYS.indexOf(m[1]);
    if (d < 0) return;
    const from = Number(m[2]) * 60 + Number(m[3]);
    const to = Number(m[4]) * 60 + Number(m[5]);
    setBlocks((prev) => {
      const next = new Set(prev);
      for (let x = from; x < to; x += STEP_MIN) next.delete(blockKey(d, x));
      return next;
    });
  };

  /** Galat langkah berjalan. Dikembalikan sebagai teks supaya tombol "Lanjut"
   *  tetap bisa ditekan — siswa dapat penjelasan, bukan tombol mati tanpa sebab. */
  const stepError = (s: number): string => {
    if (s === 0) {
      if (!fullName.trim()) return "Nama lengkap wajib diisi";
      if (!birthdate) return "Lengkapi tanggal lahir";
    }
    if (s === 1) {
      if (!whatsapp.trim()) return "Nomor WhatsApp wajib diisi";
      if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return "Format email belum benar";
    }
    if (s === 2) {
      if (!experience) return "Pilih pengalaman belajarmu sebelumnya";
      if (!goal.trim()) return "Ceritakan sedikit tujuan belajarmu";
    }
    if (s === 3 && blocks.size === 0) return "Pilih minimal 1 blok waktu yang kamu bisa";
    return "";
  };

  const go = (next: number) => {
    if (next > step) {
      const msg = stepError(step);
      if (msg) { setError(msg); return; }
    }
    setError("");
    setDir(next > step ? 1 : -1);
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const last = step === STEPS.length - 1;

  /** Enter = tombol utama langkah ini. Kolom isian di sini bukan <form>, jadi
   *  tanpa ini Enter tidak melakukan apa-apa dan siswa harus meraih tombolnya. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const el = e.target as HTMLElement;
    // Textarea butuh Enter untuk ganti baris; tombol & kotak pilihan sudah punya
    // arti sendiri untuk Enter (menekan dirinya).
    if (el.tagName === "TEXTAREA" || el.tagName === "BUTTON" || el.tagName === "SELECT") return;
    e.preventDefault();
    if (last) handleSubmit(); else go(step + 1);
  };

  const handleSubmit = async () => {
    for (let s = 0; s < STEPS.length; s++) {
      const msg = stepError(s);
      if (msg) { setDir(s < step ? -1 : 1); setStep(s); setError(msg); return; }
    }

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
          preferred_schedule: scheduleText,
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
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14" style={{ color: TEAL }} />
        </motion.div>
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
  // Langkah jadwal butuh ruang: kolom hari yang sempit bikin kotak 30 menit
  // susah dikenai. Lebar kartunya melar hanya di langkah itu.
  const shellWidth = last ? "max-w-3xl" : "max-w-lg";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/40" onKeyDown={onKeyDown}>
      {/* Kop tetap menempel: bilah langkah harus selalu kelihatan supaya siswa
          tahu formnya pendek dan sisa berapa lagi. */}
      <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/85 backdrop-blur-md">
        <div className={`mx-auto ${shellWidth} px-5 pb-3 pt-4 transition-[max-width] duration-300`}>
          <div className="mb-3 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-white.png" alt="Linguo" className="h-8 brightness-0" />
            <span className="text-[11px] font-medium text-slate-400">
              Langkah {step + 1} dari {STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <button key={s.title} type="button" onClick={() => i < step && go(i)}
                className="group flex-1 text-left" aria-label={s.title}>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div className="h-full rounded-full"
                    initial={false}
                    animate={{ width: i < step ? "100%" : i === step ? "100%" : "0%", opacity: i <= step ? 1 : 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    style={{ background: i === step ? TEAL : `${TEAL}80` }} />
                </div>
                <span className={`mt-1.5 block truncate text-[10px] font-semibold transition ${i === step ? "text-slate-700" : "text-slate-300"}`}>
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`mx-auto ${shellWidth} px-5 pb-40 pt-6 transition-[max-width] duration-300`}>
        {step === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-slate-900">
              Hai{greetName ? ` ${greetName}` : ""}, selamat bergabung!
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Isi 4 langkah singkat ini supaya kami bisa menyiapkan pengajar, jadwal, dan grup kelasmu.
            </p>
            {(form?.language || form?.program) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#1A9E9E]/15 bg-[#1A9E9E]/5 px-4 py-3 text-xs">
                <Sparkles className="h-3.5 w-3.5" style={{ color: TEAL }} />
                {form?.language && <span className="font-semibold" style={{ color: TEAL }}>{form.language}</span>}
                {form?.language && form?.program && <span className="text-slate-300">•</span>}
                {form?.program && <span className="text-slate-600">{form.program}</span>}
                {form?.level && <><span className="text-slate-300">•</span><span className="text-slate-600">Level {form.level}</span></>}
              </div>
            )}
          </motion.div>
        )}

        <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: dir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* ── 1. Data diri ── */}
              {step === 0 && (
                <div className="space-y-5">
                  <StepHead icon={User} title="Data Diri" desc="Buat catatan kelas dan sertifikatmu nanti." />

                  {/* Nama lengkap & panggilan satu baris: keduanya pendek dan
                      dijawab berbarengan, tidak perlu dua baris penuh. */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nama lengkap" icon={User} required>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        placeholder="Sesuai KTP" className={inputClass} />
                    </Field>
                    <Field label="Nama panggilan" icon={User}>
                      <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                        placeholder="contoh: Dina" className={inputClass} />
                    </Field>
                  </div>
                  <p className="-mt-2 text-[11px] leading-relaxed text-slate-400">
                    Nama panggilan dipakai pengajar saat kelas berlangsung.
                  </p>

                  <Field label="Tanggal lahir" icon={CalendarDays} required>
                    <BirthDatePicker day={birthDay} month={birthMonth} year={birthYear}
                      onPick={(d, m, y) => { setBirthDay(d); setBirthMonth(m); setBirthYear(y); }} />
                    {age !== null && (
                      <p className="mt-2 text-[11px] font-semibold" style={{ color: TEAL }}>Usia kamu {age} tahun</p>
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
                </div>
              )}

              {/* ── 2. Kontak ── */}
              {step === 1 && (
                <div className="space-y-5">
                  <StepHead icon={Phone} title="Kontak" desc="Ke sini kami kirim undangan grup kelas dan materi." />

                  <Field label="Nomor WhatsApp" icon={Phone} required hint="Nomor ini yang akan dimasukkan ke grup kelas.">
                    <input type="tel" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="contoh: 08123456789" className={inputClass} />
                  </Field>

                  <Field label="Email" icon={Mail} hint="Dipakai untuk kirim materi & akun belajar.">
                    <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com" className={inputClass} />
                  </Field>
                </div>
              )}

              {/* ── 3. Pengalaman + tujuan ── */}
              {step === 2 && (
                <div className="space-y-6">
                  <StepHead icon={Target} title="Tujuan Belajar" desc="Penentu level awal dan materi sesi pertamamu." />

                  <div className="space-y-3">
                    <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-500">
                      <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      Pernah belajar bahasa ini sebelumnya? Jawaban jujur membantu kami menaruhmu di
                      level yang pas — bukan mengulang yang sudah kamu bisa.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCES.map((e) => (
                        <button key={e} type="button" onClick={() => setExperience(e)}
                          className={chipClass(experience === e)}
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
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-5">
                    <p className="text-xs font-semibold text-slate-600">Kenapa kamu belajar bahasa ini?</p>
                    <div className="flex flex-wrap gap-2">
                      {GOALS.map((g) => (
                        <button key={g} type="button" onClick={() => setGoal(g)}
                          className={chipClass(goal === g)}
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
                  </div>
                </div>
              )}

              {/* ── 4. Jadwal ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <StepHead icon={CalendarDays} title="Jadwal yang Diinginkan"
                    desc="1 kotak = 30 menit. Ketuk semua waktu yang kamu bisa (boleh banyak)." />

                  {/* Ikon + teks dibungkus span sendiri: kalau teksnya jadi anak
                      langsung flex, tiap potongan kalimat pecah jadi kolom. */}
                  <div className="flex items-start gap-1.5 rounded-2xl bg-slate-50 px-3.5 py-3 text-[11px] leading-relaxed text-slate-500">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>
                      Jam mengikuti WIB. Di komputer bisa <span className="font-semibold text-slate-600">klik-tahan lalu geser</span> untuk
                      memilih banyak kotak sekaligus; ketuk jam di kiri untuk memilih jam itu di semua hari.
                    </span>
                  </div>

                  <ScheduleGrid blocks={blocks} setBlocks={setBlocks} showEarly={showEarly} onShowEarly={() => setShowEarly(true)} />

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium text-slate-400">
                      {blocks.size > 0
                        ? `${blocks.size} blok terpilih · ${(blocks.size * 30) / 60} jam`
                        : "Belum ada waktu terpilih"}
                    </p>
                    {blocks.size > 0 && (
                      <button type="button" onClick={() => setBlocks(() => new Set())}
                        className="text-[11px] font-semibold text-slate-400 transition hover:text-red-500">
                        Bersihkan
                      </button>
                    )}
                  </div>

                  {scheduleChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {scheduleChips.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                          style={{ borderColor: `${TEAL}55`, color: TEAL, background: `${TEAL}0d` }}>
                          {c}
                          <button type="button" onClick={() => removeChip(c)} aria-label={`Hapus ${c}`}
                            className="opacity-60 transition hover:opacity-100">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 px-4 py-2.5 text-center text-xs font-medium text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </motion.p>
          )}
        </AnimatePresence>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          Data kamu hanya dipakai untuk keperluan kelas di Linguo.
        </p>
        <div className="mt-2 text-center">
          <a href={`https://wa.me/${WA_CS}?text=Halo%20Linguo%2C%20saya%20ada%20kendala%20mengisi%20form%20pendataan`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition hover:text-[#1A9E9E]">
            <MessageCircle className="h-3 w-3" /> Ada kendala? Chat CS
          </a>
        </div>
      </div>

      {/* Navigasi menempel di bawah — jempol tidak perlu mencari tombol di ujung
          halaman yang panjang (kisi jadwal bisa 26 baris). */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white/90 backdrop-blur-md">
        <div className={`mx-auto flex ${shellWidth} items-center gap-3 px-5 py-3.5 transition-[max-width] duration-300`}>
          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </button>
          )}
          {last ? (
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="flex-1 rounded-full bg-[#fbbf24] py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-200/60 transition-all hover:bg-[#f59e0b] active:scale-95 disabled:opacity-50">
              {saving ? "Menyimpan..." : "Kirim Data"}
            </button>
          ) : (
            <button type="button" onClick={() => go(step + 1)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-200/60 transition-all hover:brightness-110 active:scale-95"
              style={{ background: TEAL }}>
              Lanjut <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHead({
  icon: Icon, title, desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${TEAL}12`, color: TEAL }}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
      </div>
    </div>
  );
}
