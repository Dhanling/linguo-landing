'use client';

// [beranda-insights-v1] Kartu ringkasan belajar di Beranda /akun.
//
// Sebelum ini semua sinyal progres siswa terkubur di dalam detail kelas: skor
// skill, PR yang belum disetor, materi baru dari pengajar — semuanya butuh 2–3
// klik. Beranda cuma menampilkan jadwal + daftar kelas. Blok ini menaikkan yang
// paling sering ditanya siswa ke layar pertama:
//   • Beban minggu ini (jam belajar + sesi)
//   • PR belum disetor (dengan titik merah — dulu tidak ada indikator sama sekali)
//   • Progres 4 skill + selisih dari rapor terakhir + tombol bagikan
//   • Materi terbaru dari pengajar (rak gulir)
//   • Papan peringkat kelas grup (kalau RPC-nya sudah dipasang)
//
// Semua bagian menghilang sendiri kalau datanya kosong — beranda siswa baru
// tidak boleh penuh kotak kosong.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Clock, CalendarDays, ClipboardList, TrendingUp, Share2, Printer, Check,
  ChevronRight, ChevronDown, FileText, Presentation, Link2, Video, Paperclip, Trophy,
  Mic, Headphones, BookOpen, PenLine, type LucideIcon,
} from 'lucide-react';
import {
  fetchStudentInsights, fmtDuration, cefrBand,
  type StudentInsights, type SkillProgress,
} from '@/lib/studentInsights';
import { shareProgress, printProgressCard, periodLabel } from '@/lib/shareProgress';
import { SkillRow, DeltaBadge } from '@/components/akun/SkillBar';
import { useT, useUiLang } from '@/lib/uiLang'; // [ui-lang-switcher-v1]

const SKILLS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'speaking', label: 'Speaking', Icon: Mic },
  { key: 'listening', label: 'Listening', Icon: Headphones },
  { key: 'reading', label: 'Reading', Icon: BookOpen },
  { key: 'writing', label: 'Writing', Icon: PenLine },
];

// Ikon berkas — dipetakan dari kolom `kind` class_materials, jatuh ke tebakan
// dari ekstensi URL kalau kolomnya kosong (materi lama).
function materialIcon(kind: string | null, url: string): LucideIcon {
  const k = (kind || '').toLowerCase();
  const u = (url || '').toLowerCase();
  if (k === 'youtube' || u.includes('youtu')) return Video;
  if (k === 'slide' || u.endsWith('.ppt') || u.endsWith('.pptx')) return Presentation;
  if (k === 'pdf' || k === 'doc' || u.endsWith('.pdf') || u.endsWith('.doc') || u.endsWith('.docx')) return FileText;
  if (k === 'link') return Link2;
  return Paperclip;
}

type RegLite = {
  id: string;
  language: string;
  level?: string | null;
  batch_id?: string | null;
  [k: string]: any;
};

/** Titip data reg ke sessionStorage — pola yang sama dengan card kelas di beranda,
 *  biar halaman detail render instan dan tidak mental balik saat jaringan kedip. */
function handoff(reg: RegLite) {
  try { sessionStorage.setItem(`linguo_reg_${reg.id}`, JSON.stringify(reg)); } catch {}
}

function StatTile({ Icon, value, label, sub, tone = 'teal', alert = false }: {
  Icon: LucideIcon; value: string; label: string; sub?: string;
  tone?: 'teal' | 'amber' | 'indigo' | 'rose'; alert?: boolean;
}) {
  const tint = {
    teal: 'bg-[#16796E]/10 text-[#16796E]',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-500',
    rose: 'bg-rose-50 text-rose-500',
  }[tone];
  return (
    <div className="relative rounded-2xl bg-white p-3.5 ring-1 ring-slate-200/70">
      {alert && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100" />}
      <div className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-full ${tint}`}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </div>
      <div className="text-[20px] font-extrabold leading-none text-[#12172B]">{value}</div>
      <div className="mt-1 text-[11.5px] font-semibold text-gray-600">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] font-medium text-gray-400">{sub}</div>}
    </div>
  );
}

// [beranda-insights-cache-v1] Hasil terakhir ditahan di memori modul.
// Tab Beranda di-unmount tiap pindah menu, jadi balik ke Beranda = komponen ini
// mount ulang dengan data null → seluruh blok "Ringkasan Belajar" hilang dulu,
// baru muncul lagi setelah 5 query kelar = beranda kedip + konten loncat.
// Sekarang render langsung dari cache, fetch-nya jalan diam-diam di belakang.
const insightsCache = new Map<string, StudentInsights>();

// Ingatan buka/tutup blok Ringkasan Belajar (per perangkat).
const RINGKASAN_OPEN_KEY = 'linguo_beranda_ringkasan_open';

export default function BerandaInsights({
  regs,
  studentName,
  displayLanguage = (l: string) => l,
  previewStudentId = null,
  aside = null,
}: {
  regs: RegLite[];
  studentName: string;
  displayLanguage?: (lang: string) => string;
  // [preview-keep-param-v1] POV staf: tautan ke detail kelas wajib membawa
  // ?preview=, kalau tidak halaman tujuan kehilangan identitas pratinjau.
  previewStudentId?: string | null;
  // [beranda-kosakata-aside-v1] kartu tambahan buat KOLOM KANAN (dipakai
  // "Kosakata Saya"). Dulu kartu itu berdiri sendiri selebar layar di bawah blok
  // ini, padahal kolom kanan sering kosong (tak ada PR & materi) → banyak ruang
  // menganggur. Dioper sebagai slot, bukan di-import di sini, biar komponen ini
  // tetap tak tahu-menahu soal data kosakata.
  aside?: ReactNode;
}) {
  const previewQs = previewStudentId ? `&preview=${encodeURIComponent(previewStudentId)}` : "";
  /* [beranda-insights-hook-order-v1] useT/useUiLang WAJIB di atas sini. Dulu
     keduanya dipanggil di bawah, sesudah dua `return <>{aside}</>` (regs kosong /
     data belum datang / semua kotak nihil) — jadi render pertama menjalankan
     lebih SEDIKIT hook daripada render sesudah data insights masuk. React
     membalasnya dengan error #310 ("rendered more hooks than during the previous
     render") yang mematikan SELURUH /akun, bukan cuma blok ini: layar siswa jadi
     "This page couldn't load". Kelihatannya cuma kena sebagian siswa karena yang
     rapornya masih kosong tak pernah melewati early-return itu. */
  const t = useT(); // [ui-lang-switcher-v1]
  const uiLang = useUiLang();
  const [fetched, setFetched] = useState<{ key: string; data: StudentInsights } | null>(null);
  const [selReg, setSelReg] = useState<string>('');
  const [shareState, setShareState] = useState('');

  // [beranda-ringkasan-collapse-v1] Blok ini panjang (4 kotak statistik + kartu
  // progres + kosakata) dan mendorong jadwal & daftar kelas jauh ke bawah, padahal
  // isinya jarang berubah harian. Jadi default-nya TERTUTUP — cuma judulnya yang
  // kelihatan, diketuk baru mengembang. Pilihannya diingat per perangkat.
  // Awal render selalu `false` biar HTML server == HTML klien (tak ada hydration
  // mismatch); localStorage baru dibaca setelah mount.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(RINGKASAN_OPEN_KEY) === '1') setOpen(true);
    } catch {}
  }, []);
  const toggleOpen = () => {
    setOpen((v) => {
      try { localStorage.setItem(RINGKASAN_OPEN_KEY, v ? '0' : '1'); } catch {}
      return !v;
    });
  };

  // Kunci stabil supaya effect tidak jalan ulang tiap render (regs objek baru terus).
  const regKey = useMemo(() => regs.map((r) => r.id).sort().join(','), [regs]);

  // Dibaca saat render (bukan di effect) — kalau lewat effect tetap kebagian satu
  // frame kosong, dan justru frame itu yang kelihatan sebagai kedipan.
  const data = fetched?.key === regKey ? fetched.data : insightsCache.get(regKey) ?? null;

  useEffect(() => {
    let alive = true;
    if (regs.length === 0) { setFetched(null); return; }
    (async () => {
      const res = await fetchStudentInsights(
        regs.map((r) => ({ id: r.id, language: r.language, batch_id: r.batch_id }))
      );
      if (!alive) return;
      insightsCache.set(regKey, res);
      setFetched({ key: regKey, data: res });
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regKey]);

  const regById = useMemo(() => {
    const m = new Map<string, RegLite>();
    regs.forEach((r) => m.set(r.id, r));
    return m;
  }, [regs]);

  // Kelas yang skill-nya sudah dinilai; default pilih yang penilaiannya paling baru.
  const ratedProgress = useMemo(
    () => (data?.skills || []).filter((s) => s.rated && regById.has(s.registrationId)),
    [data, regById]
  );
  const active: SkillProgress | null = useMemo(() => {
    if (ratedProgress.length === 0) return null;
    const picked = ratedProgress.find((s) => s.registrationId === selReg);
    if (picked) return picked;
    return [...ratedProgress].sort((a, b) => (b.periodEnd || '').localeCompare(a.periodEnd || ''))[0];
  }, [ratedProgress, selReg]);

  // Blok ringkasan boleh menyembunyikan diri, tapi kartu titipan (Kosakata) tidak
  // boleh ikut hilang — dia punya isi sendiri yang tak bergantung rapor pengajar.
  if (regs.length === 0 || !data) return <>{aside}</>;

  const { week, pendingHomework, materials, leaderboard } = data;
  const sesiTotal = week.doneCount + week.upcomingCount;

  // Beranda siswa baru jangan dipenuhi kotak kosong — kalau semuanya nihil,
  // blok ini tidak usah muncul sama sekali.
  const adaIsi =
    active !== null || pendingHomework.length > 0 || materials.length > 0 ||
    sesiTotal > 0 || leaderboard !== null;
  if (!adaIsi) return <>{aside}</>;

  const activeReg = active ? regById.get(active.registrationId) : null;
  const shareData = active && activeReg ? {
    studentName,
    language: displayLanguage(activeReg.language || 'Bahasa'),
    level: activeReg.level || null,
    skills: active.skills,
    avg: active.avg,
    avgBefore: active.avgBefore,
    periodStart: active.periodStart,
    periodEnd: active.periodEnd,
  } : null;

  const onShare = async () => {
    if (!shareData) return;
    const r = await shareProgress(shareData);
    if (r === 'copied') setShareState('copied');
    else if (r === 'failed') setShareState('failed');
    window.setTimeout(() => setShareState(''), 2200);
  };

  const dateLocale = uiLang === 'en' ? 'en-GB' : 'id-ID';
  const dur = (min: number) => (uiLang === 'en' ? fmtDuration(min).replace(' jam', ' hr').replace('j ', 'h ') : fmtDuration(min));
  const skillMap: Record<string, any> = {};
  (active?.skills || []).forEach((s) => { skillMap[s.key] = s; });

  return (
    <div className="flex flex-col gap-4">
      {/* Judul = sakelar buka/tutup. Lencana PR sengaja tetap tampil walau blok
          tertutup — itu satu-satunya sinyal tunggakan di layar pertama. */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
      >
        <h2 className="inline-flex items-center gap-2 text-[18px] font-extrabold text-[#12172B]">
          <TrendingUp className="h-5 w-5 text-[#16796E]" strokeWidth={2.5} />
          {t('Ringkasan Belajar')}
        </h2>
        <span className="inline-flex items-center gap-2">
          {pendingHomework.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[12px] font-bold text-rose-600">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              {pendingHomework.length} {t('PR menunggu')}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-gray-500">
            {open ? t('Tutup') : t('Lihat')}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
              strokeWidth={2.6}
            />
          </span>
        </span>
      </button>

      {!open ? null : (
      <>
      {/* ── Baris statistik ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile
          Icon={Clock}
          value={dur(week.doneMinutes)}
          label={t('Jam belajar minggu ini')}
          sub={week.upcomingMinutes ? `+${dur(week.upcomingMinutes)} ${t('terjadwal')}` : t('dari sesi yang sudah jalan')}
        />
        <StatTile
          Icon={CalendarDays}
          tone="indigo"
          value={sesiTotal ? `${week.doneCount}/${sesiTotal}` : '0'}
          label={t('Sesi minggu ini')}
          sub={week.upcomingCount ? `${week.upcomingCount} ${t('sesi lagi')}` : t('semua sudah jalan')}
        />
        <StatTile
          Icon={ClipboardList}
          tone={pendingHomework.length ? 'rose' : 'teal'}
          alert={pendingHomework.length > 0}
          value={String(pendingHomework.length)}
          label={t('PR belum disetor')}
          sub={pendingHomework.length ? t('ketuk kartu PR di bawah') : t('aman, tidak ada tunggakan')}
        />
        <StatTile
          Icon={TrendingUp}
          tone="amber"
          value={active?.avg ? active.avg.toFixed(1) : '—'}
          label={t('Rata-rata skill')}
          sub={active?.avg ? `≈ ${cefrBand(active.avg).band} ${cefrBand(active.avg).name}` : t('belum dinilai pengajar')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* ── Kartu progres skill ── */}
        {active && activeReg && shareData && (
          <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200/70">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-[16px] font-extrabold text-[#12172B]">
                  {t('Progres')} {displayLanguage(activeReg.language)}{activeReg.level ? ` — ${activeReg.level}` : ''}
                </h3>
                <p className="mt-0.5 text-[11.5px] font-semibold text-gray-400">
                  {periodLabel(active.periodStart, active.periodEnd) || t('Dinilai pengajar')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={onShare}
                  aria-label={t('Bagikan progres')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#16796E]/10 px-3 py-2 text-[12px] font-bold text-[#16796E] transition hover:bg-[#16796E]/15"
                >
                  {shareState === 'copied' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Share2 className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  {shareState === 'copied' ? t('Tersalin') : shareState === 'failed' ? t('Gagal') : t('Bagikan')}
                </button>
                <button
                  onClick={() => printProgressCard(shareData)}
                  aria-label={t('Cetak kartu progres')}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-gray-600 transition hover:bg-slate-200"
                >
                  <Printer className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>
            </div>

            {/* Pemilih kelas — hanya kalau lebih dari satu kelas yang sudah dinilai */}
            {ratedProgress.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ratedProgress.map((p) => {
                  const r = regById.get(p.registrationId)!;
                  const on = p.registrationId === active.registrationId;
                  return (
                    <button
                      key={p.registrationId}
                      onClick={() => setSelReg(p.registrationId)}
                      className={`rounded-full px-3 py-1 text-[11.5px] font-bold transition ${on ? 'bg-[#16796E] text-white' : 'bg-slate-100 text-gray-500 hover:text-[#16796E]'}`}
                    >
                      {displayLanguage(r.language)}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-3 space-y-2.5">
              {SKILLS.map(({ key, label, Icon }) => (
                <SkillRow
                  key={key}
                  skill={skillMap[key] || { key, score: 0, before: null, delta: null, note: null }}
                  label={label}
                  Icon={Icon}
                  compact
                />
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
              <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-gray-500">
                {t('Rata-rata')}
                <span className="text-[15px] font-extrabold text-[#16796E]">{active.avg.toFixed(1)}</span>
                <span className="text-[11px] text-gray-400">/5.0</span>
                {active.avgBefore !== null && (
                  <DeltaBadge
                    delta={active.avg - active.avgBefore}
                    before={active.avgBefore}
                    score={active.avg}
                    size="xs"
                  />
                )}
              </span>
              <Link
                href={`/akun/kelas/${activeReg.id}?tab=progress${previewQs}`}
                onClick={() => handoff(activeReg)}
                className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#16796E] hover:text-[#0F5A52]"
              >
                {t('Detail')} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Kolom kanan: PR + materi + kartu titipan (Kosakata) ──
            Kalau kartu progres tidak ada (belum dinilai pengajar), kolom ini
            melebar penuh — kalau tidak, isinya terjepit di separuh kanan grid
            dengan separuh kiri kosong melompong. */}
        <div className={`flex flex-col gap-4 ${active && activeReg && shareData ? '' : 'lg:col-span-2'}`}>
          {pendingHomework.length > 0 && (
            <div className="rounded-3xl bg-white p-4 ring-1 ring-rose-200">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                  <ClipboardList className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-extrabold text-[#12172B]">{t('PR belum disetor')}</h3>
                  <p className="text-[11.5px] font-medium text-gray-500">{pendingHomework.length} {t('tugas menunggu dikerjakan')}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {pendingHomework.slice(0, 3).map((hw) => {
                  const r = regById.get(hw.registrationId);
                  return (
                    <Link
                      key={hw.scheduleId}
                      href={`/akun/kelas/${hw.registrationId}?tab=kuis${previewQs}`}
                      onClick={() => r && handoff(r)}
                      className="group flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 transition hover:bg-rose-50"
                    >
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-bold leading-snug text-[#12172B] line-clamp-2">{hw.homework}</span>
                        <span className="mt-0.5 block text-[11px] font-medium text-gray-500">
                          {r ? displayLanguage(r.language) : t('Kelas')}
                          {hw.sessionNumber ? ` · ${t('sesi')} ${hw.sessionNumber}` : ''}
                          {' · '}
                          {new Date(hw.scheduledAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}
                        </span>
                      </span>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-rose-500" />
                    </Link>
                  );
                })}
                {pendingHomework.length > 3 && (
                  <p className="pt-0.5 text-center text-[11.5px] font-semibold text-gray-400">
                    +{pendingHomework.length - 3} {t('PR lain di tab Tugas')}
                  </p>
                )}
              </div>
            </div>
          )}

          {materials.length > 0 && (
            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200/70">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[15px] font-extrabold text-[#12172B]">{t('Materi Terbaru')}</h3>
                <span className="text-[11.5px] font-semibold text-gray-400">{t('dari pengajar')}</span>
              </div>
              {/* Rak gulir — sengaja horizontal biar 6+ berkas muat tanpa mendorong
                  isi beranda lain ke bawah. */}
              <div className="-mx-1 mt-3 flex gap-2.5 overflow-x-auto px-1 pb-1">
                {materials.slice(0, 8).map((m) => {
                  const Icon = materialIcon(m.kind, m.url);
                  const r = regById.get(m.registrationId);
                  return (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex w-[132px] shrink-0 flex-col rounded-2xl bg-slate-50 p-3 transition hover:bg-[#16796E]/5"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#16796E] ring-1 ring-slate-200/70">
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="mt-2.5 line-clamp-2 text-[12px] font-bold leading-snug text-[#12172B]">{m.title}</span>
                      <span className="mt-1 truncate text-[10.5px] font-medium text-gray-400">
                        {r ? displayLanguage(r.language) : ''}
                        {' · '}
                        {new Date(m.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {aside}
        </div>
      </div>

      {/* ── Papan peringkat kelas grup ── */}
      {leaderboard && (
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200/70">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-2 text-[15px] font-extrabold text-[#12172B]">
              <Trophy className="h-[18px] w-[18px] text-[#F2CB05]" strokeWidth={2.4} />
              {t('Peringkat Kelas')} {displayLanguage(leaderboard.language)}
            </h3>
            {leaderboard.myRank && (
              <span className="rounded-full bg-[#16796E]/10 px-3 py-1 text-[11.5px] font-bold text-[#16796E]">
                {t('Kamu peringkat')} {leaderboard.myRank} {t('dari')} {leaderboard.rows.length}
              </span>
            )}
          </div>
          {/* Nama teman sekelas sengaja hanya inisial — papan peringkat tidak boleh
              jadi jalan bocornya identitas siswa lain. */}
          <div className="mt-3 flex flex-col gap-1.5">
            {leaderboard.rows.slice(0, 6).map((row, i) => (
              <div
                key={`${row.label}-${i}`}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${row.isMe ? 'bg-[#16796E]/8 ring-1 ring-[#16796E]/25' : 'bg-slate-50'}`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold ${i === 0 ? 'bg-[#F2CB05] text-[#0F5A52]' : row.isMe ? 'bg-[#16796E] text-white' : 'bg-white text-gray-500'}`}>
                  {i + 1}
                </span>
                <span className={`w-24 shrink-0 truncate text-[13px] font-bold ${row.isMe ? 'text-[#16796E]' : 'text-[#12172B]'}`}>
                  {row.isMe ? t('Kamu') : row.label}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                  <span
                    className={`block h-full rounded-full ${row.isMe ? 'bg-[#16796E]' : 'bg-slate-300'}`}
                    style={{ width: `${Math.min(100, row.progressPct)}%` }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-[12px] font-extrabold text-gray-600">{row.progressPct}%</span>
                <span className="hidden w-16 shrink-0 text-right text-[11px] font-medium text-gray-400 sm:block">{row.sessionsDone} {t('sesi')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
