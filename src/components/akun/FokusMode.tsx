'use client';

// [student-workspace-v1] "Mode Belajar Sendiri" — Pomodoro layar penuh untuk siswa.
//
// Kenapa layar penuh: gunanya justru MENGHILANGKAN dashboard. Kalau timernya cuma
// widget kecil di pojok, siswa tetap ditemani sidebar, notifikasi, dan daftar kelas —
// yang persis bikin fokusnya pecah. Di sini cuma ada: hitung mundur, satu hal yang
// sedang dikerjakan, dan daftar centang.
//
// Tiap putaran fokus yang selesai (atau dihentikan setelah >= 1 menit) dicatat ke
// `student_focus_sessions` supaya statistik "menit hari ini / 7 hari / runtun" nyata,
// bukan angka yang cuma hidup di localStorage satu perangkat.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Play, Pause, RotateCcw, Check, Coffee, Brain, Flame, Clock, Settings2, Plus } from 'lucide-react';
import { catatSesiFokus, muatStatFokus, ubahTugas, buatTugas, type StatFokus, type StudentTask } from '@/lib/studentWorkspace';
import { useT } from '@/lib/uiLang';

type Fase = 'fokus' | 'pendek' | 'panjang';

const DEFAULT_MENIT: Record<Fase, number> = { fokus: 25, pendek: 5, panjang: 15 };
const KUNCI_SETELAN = 'linguo-pomodoro-setelan-v1';

const FASE_META: Record<Fase, { label: string; sub: string; ring: string; bg: string }> = {
  fokus: { label: 'Fokus', sub: 'Kerjakan satu hal saja', ring: '#2DD4BF', bg: 'from-[#08312F] via-[#062523] to-[#04100F]' },
  pendek: { label: 'Istirahat', sub: 'Lepas layar sebentar', ring: '#FBBF24', bg: 'from-[#2A2412] via-[#1D190C] to-[#0D0B05]' },
  panjang: { label: 'Istirahat Panjang', sub: 'Berdiri, minum, jalan', ring: '#818CF8', bg: 'from-[#1B1C33] via-[#141527] to-[#08080F]' },
};

function mmss(detik: number) {
  const d = Math.max(0, Math.round(detik));
  return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`;
}

/** Bunyi tanda selesai — WebAudio, tanpa file aset. */
function bunyi() {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {}
}

export default function FokusMode({
  studentId,
  tasks,
  onTasksChange,
  fokusAwal,
  onClose,
}: {
  studentId: string;
  tasks: StudentTask[];
  onTasksChange: () => void;
  /** Judul + id catatan/kelas yang sedang dibuka waktu tombol ditekan. */
  fokusAwal?: { label?: string | null; noteId?: string | null; regId?: string | null };
  onClose: () => void;
}) {
  const t = useT();
  const [menit, setMenit] = useState<Record<Fase, number>>(DEFAULT_MENIT);
  const [fase, setFase] = useState<Fase>('fokus');
  const [sisa, setSisa] = useState(DEFAULT_MENIT.fokus * 60);
  const [jalan, setJalan] = useState(false);
  const [putaran, setPutaran] = useState(0);
  const [stat, setStat] = useState<StatFokus | null>(null);
  const [label, setLabel] = useState(fokusAwal?.label || '');
  const [bukaSetelan, setBukaSetelan] = useState(false);
  const [tugasBaru, setTugasBaru] = useState('');
  const mulaiRef = useRef<string>(new Date().toISOString());
  const terpakaiRef = useRef(0); // detik fokus yang sudah berjalan di putaran ini

  const meta = FASE_META[fase];
  const total = menit[fase] * 60;

  // Setelan durasi disimpan per perangkat — bukan data belajar, tak perlu ke server.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KUNCI_SETELAN);
      if (raw) {
        const s = JSON.parse(raw);
        const next = { fokus: Number(s.fokus) || 25, pendek: Number(s.pendek) || 5, panjang: Number(s.panjang) || 15 };
        setMenit(next);
        setSisa(next.fokus * 60);
      }
    } catch {}
  }, []);

  const simpanSetelan = (next: Record<Fase, number>) => {
    setMenit(next);
    try { localStorage.setItem(KUNCI_SETELAN, JSON.stringify(next)); } catch {}
  };

  const muatStat = useCallback(async () => {
    if (!studentId) return;
    setStat(await muatStatFokus(studentId));
  }, [studentId]);
  useEffect(() => { muatStat(); }, [muatStat]);

  /** Simpan putaran fokus yang barusan berjalan (dipanggil saat selesai / berhenti). */
  const rekam = useCallback(
    async (selesai: boolean) => {
      const detik = terpakaiRef.current;
      terpakaiRef.current = 0;
      // Putaran istirahat & fokus super pendek (< 1 menit) tidak dicatat — cuma bikin
      // statistiknya penuh baris nol.
      if (fase !== 'fokus' || detik < 60) return;
      await catatSesiFokus(studentId, {
        planned_minutes: menit.fokus,
        focus_seconds: detik,
        completed: selesai,
        label: label || null,
        note_id: fokusAwal?.noteId || null,
        registration_id: fokusAwal?.regId || null,
        started_at: mulaiRef.current,
      });
      muatStat();
    },
    [fase, menit.fokus, label, studentId, fokusAwal?.noteId, fokusAwal?.regId, muatStat]
  );

  const gantiFase = useCallback((f: Fase, autoJalan = false) => {
    setFase(f);
    setSisa(menit[f] * 60);
    setJalan(autoJalan);
    mulaiRef.current = new Date().toISOString();
    terpakaiRef.current = 0;
  }, [menit]);

  // Detak timer. Sengaja pakai timestamp (bukan menghitung tik) supaya tab yang
  // di-background browser — yang setInterval-nya di-throttle — tidak jadi lambat.
  useEffect(() => {
    if (!jalan) return;
    let akhir = Date.now() + sisa * 1000;
    const id = setInterval(() => {
      const detikSisa = (akhir - Date.now()) / 1000;
      if (fase === 'fokus') terpakaiRef.current += 1;
      if (detikSisa <= 0) {
        clearInterval(id);
        setSisa(0);
        setJalan(false);
        bunyi();
        if (fase === 'fokus') {
          const n = putaran + 1;
          setPutaran(n);
          rekam(true);
          // Tiap 4 putaran fokus → istirahat panjang (pola Pomodoro asli).
          gantiFase(n % 4 === 0 ? 'panjang' : 'pendek', true);
        } else {
          gantiFase('fokus', false);
        }
        return;
      }
      setSisa(detikSisa);
    }, 1000);
    return () => clearInterval(id);
    // `sisa` sengaja tidak jadi dependensi: interval-nya memegang `akhir` sendiri.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jalan, fase, putaran, gantiFase, rekam]);

  // Judul tab ikut hitung mundur — siswa sering pindah tab sambil menunggu.
  useEffect(() => {
    const asli = document.title;
    document.title = jalan ? `${mmss(sisa)} · ${meta.label} — Linguo` : asli;
    return () => { document.title = asli; };
  }, [sisa, jalan, meta.label]);

  // Esc = tutup, Spasi = mulai/jeda (kecuali sedang mengetik di kolom isian).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') { e.preventDefault(); tutup(); }
      if (e.code === 'Space') { e.preventDefault(); setJalan((v) => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function tutup() {
    await rekam(false);
    onClose();
  }

  const belum = useMemo(() => tasks.filter((x) => !x.done).slice(0, 8), [tasks]);
  const persen = total ? 1 - sisa / total : 0;
  const R = 130;
  const KELILING = 2 * Math.PI * R;

  return (
    <div className={`fixed inset-0 z-[80] overflow-y-auto bg-gradient-to-br ${meta.bg} text-white`}>
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-5 sm:px-8">
        {/* ── Bar atas ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-white/70">
            <Brain className="h-4 w-4" strokeWidth={2.5} />
            {t('Mode Belajar Sendiri')}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBukaSetelan((v) => !v)}
              className="rounded-xl p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t('Atur durasi')}
            >
              <Settings2 className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={tutup}
              className="rounded-xl p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t('Tutup')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {bukaSetelan && (
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-white/[0.06] p-3">
            {(['fokus', 'pendek', 'panjang'] as Fase[]).map((f) => (
              <label key={f} className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/50">
                  {t(FASE_META[f].label)}
                </span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={menit[f]}
                  onChange={(e) => {
                    const next = { ...menit, [f]: Math.min(120, Math.max(1, Number(e.target.value) || 1)) };
                    simpanSetelan(next);
                    if (f === fase && !jalan) setSisa(next[f] * 60);
                  }}
                  className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-bold text-white outline-none ring-white/20 focus:ring-2"
                />
              </label>
            ))}
          </div>
        )}

        <div className="grid flex-1 items-start gap-6 pt-4 lg:grid-cols-[1fr_320px]">
          {/* ── Timer ── */}
          <div className="flex flex-col items-center">
            <div className="mb-4 flex gap-1.5 rounded-2xl bg-white/[0.07] p-1">
              {(['fokus', 'pendek', 'panjang'] as Fase[]).map((f) => (
                <button
                  key={f}
                  onClick={() => gantiFase(f)}
                  className={`rounded-xl px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                    fase === f ? 'bg-white text-[#0B2B29]' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t(FASE_META[f].label)}
                </button>
              ))}
            </div>

            <div className="relative flex h-[300px] w-[300px] items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="14" />
                <circle
                  cx="150" cy="150" r={R} fill="none" stroke={meta.ring} strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={KELILING}
                  strokeDashoffset={KELILING * (1 - persen)}
                  style={{ transition: 'stroke-dashoffset 0.9s linear' }}
                />
              </svg>
              <div className="text-center">
                <div className="font-mono text-[56px] font-bold leading-none tracking-tight tabular-nums">{mmss(sisa)}</div>
                <div className="mt-2 text-[13px] font-medium text-white/55">{t(meta.sub)}</div>
                {putaran > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/70">
                    <Check className="h-3 w-3" strokeWidth={3} /> {putaran} {t('putaran hari ini')}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => setJalan((v) => !v)}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#0B2B29] shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label={jalan ? t('Jeda') : t('Mulai')}
              >
                {jalan ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="ml-0.5 h-6 w-6" fill="currentColor" />}
              </button>
              <button
                onClick={() => { rekam(false); setSisa(total); setJalan(false); mulaiRef.current = new Date().toISOString(); }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                aria-label={t('Ulang')}
              >
                <RotateCcw className="h-[18px] w-[18px]" />
              </button>
            </div>

            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('Sedang mengerjakan apa? (mis. hafal 20 kosakata)')}
              className="mt-5 w-full max-w-md rounded-2xl bg-white/[0.07] px-4 py-2.5 text-center text-sm text-white placeholder:text-white/35 outline-none ring-white/20 focus:ring-2"
            />
          </div>

          {/* ── Panel kanan: statistik + centang tugas ── */}
          <div className="space-y-3 pb-8">
            <div className="grid grid-cols-3 gap-2">
              {[
                { ikon: Clock, nilai: `${stat?.menitHariIni ?? 0}m`, label: t('Hari ini') },
                { ikon: Brain, nilai: `${stat?.menit7Hari ?? 0}m`, label: t('7 hari') },
                { ikon: Flame, nilai: `${stat?.runtunHari ?? 0}`, label: t('Hari beruntun') },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/[0.07] p-3 text-center">
                  <s.ikon className="mx-auto mb-1 h-4 w-4 text-white/45" />
                  <div className="text-lg font-bold leading-none">{s.nilai}</div>
                  <div className="mt-1 text-[10.5px] font-medium text-white/45">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white/[0.07] p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-white/45">
                <Check className="h-3.5 w-3.5" strokeWidth={3} /> {t('Yang mau diselesaikan')}
              </div>
              <div className="space-y-1">
                {belum.length === 0 && (
                  <p className="py-2 text-[12.5px] text-white/40">{t('Belum ada tugas. Tulis satu di bawah.')}</p>
                )}
                {belum.map((x) => (
                  <button
                    key={x.id}
                    onClick={async () => { await ubahTugas(x.id, { done: true }); onTasksChange(); }}
                    className="flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/10"
                  >
                    <span className="mt-[3px] h-[15px] w-[15px] shrink-0 rounded-[5px] border-2 border-white/35" />
                    <span className="text-[13px] leading-snug text-white/85">{x.title}</span>
                  </button>
                ))}
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const judul = tugasBaru.trim();
                  if (!judul) return;
                  setTugasBaru('');
                  await buatTugas(studentId, { title: judul, registration_id: fokusAwal?.regId || null });
                  onTasksChange();
                }}
                className="mt-2 flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-2.5 py-1.5"
              >
                <Plus className="h-4 w-4 shrink-0 text-white/40" />
                <input
                  value={tugasBaru}
                  onChange={(e) => setTugasBaru(e.target.value)}
                  placeholder={t('Tambah tugas…')}
                  className="w-full bg-transparent text-[13px] text-white placeholder:text-white/35 outline-none"
                />
              </form>
            </div>

            <div className="rounded-2xl bg-white/[0.05] p-3 text-[11.5px] leading-relaxed text-white/45">
              <Coffee className="mb-1 h-3.5 w-3.5" />
              {t('Pola Pomodoro: 25 menit fokus, 5 menit istirahat. Tiap 4 putaran, istirahat panjang. Spasi = mulai/jeda, Esc = keluar.')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
