'use client';

// [kelas-detail-page-v1] Konten halaman detail kelas /akun/kelas/[id].
// Dulu ini ClassDetailModal (popup di beranda) — 5 tab + flow reschedule/cancel
// kelewat berat buat modal (modal numpuk modal), jadi dinaikkan ke halaman penuh:
// deep-linkable (?tab=progress), tombol back browser jalan, lega di mobile.
// [jadwal-tanpa-aksi-siswa-v1] Aksi ubah/batalkan jadwal milik siswa DIHAPUS —
// perubahan jadwal disepakati di grup kelas, pengajar yang memindahkan sesinya.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { getFlagUrl, getLangPhoto, langGlyph } from '@/lib/lang-visuals';
import { displayLanguage } from '@/lib/classLanguage';
// [kelas-level-switcher-v1] strip pindah level (A1.1 → A2.2) di bahasa yang sama
import { sameLanguage } from '@/lib/languageSlug';
import ClassLevelSwitcher from '@/components/akun/ClassLevelSwitcher';
// [teacher-sapaan-v1] siswa manggil pengajarnya "Kak Dhani", bukan nama lengkap
import { sapaan } from '@/lib/teacherName';
import ClassProgressTab from '@/components/akun/ClassProgressTab';
import ClassMateriTab from '@/components/akun/ClassMateriTab';
import { quizScoreRows } from '@/components/akun/ClassQuizScores';
import ClassRaporTab from '@/components/akun/ClassRaporTab';
// [kelas-tab-kuis-v1] Kuis tiap pertemuan: grafik skor + rincian benar/salah + pembahasan
import ClassKuisTab from '@/components/akun/ClassKuisTab';
import { ArrowLeft, Calendar, TrendingUp, BookOpen, BarChart2, User, Clock, MessageCircle, ClipboardList, Check, ClipboardCheck, CalendarClock, type LucideIcon } from 'lucide-react';

interface Props {
  reg: any; // registration + join teachers(name, title, avatar_url)
  initialTab?: string | null;
  // [preview-keep-param-v1] POV staf: tautan kembali harus tetap membawa ?preview=,
  // kalau tidak halaman /akun kehilangan identitas pratinjau → mendarat di gate login.
  previewStudentId?: string | null;
  // Jadwal hasil endpoint pratinjau (service role). Di mode pratinjau query
  // `schedules` biasa selalu kosong karena RLS memblok anon.
  previewSchedules?: any[] | null;
  // [kelas-level-switcher-v1] Registrasi siswa versi pratinjau (service role) —
  // query `registrations` biasa selalu kosong di mode pratinjau (RLS memblok anon),
  // jadi strip pindah level ikut nebeng endpoint yang sama.
  previewRegs?: any[] | null;
}

// [kelas-tab-ramping-v1] Tab Overview & Jadwal dihapus. Isinya dulu tumpang tindih:
// "Sesi Berikutnya" kini kartu tetap di atas tab bar (selalu kelihatan, tak perlu
// diklik), dan seluruh daftar sesi pindah jadi linimasa milestone di tab Materi —
// yang otomatis jadi tab pertama karena itu yang paling sering dibuka siswa.
export type ClassTab = 'materi' | 'progress' | 'kuis' | 'rapor';

const TABS: { id: ClassTab; label: string; icon: LucideIcon }[] = [
  { id: 'materi', label: 'Materi', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'kuis', label: 'Kuis', icon: ClipboardCheck },
  { id: 'rapor', label: 'Rapor', icon: BarChart2 },
];

const isValidTab = (t: string | null | undefined): t is ClassTab =>
  !!t && TABS.some((x) => x.id === t);

// [kelas-tab-kuis-v1] Tab `tugas` berganti nama jadi `kuis`. Tautan lama
// (?tab=tugas — masih dipakai kartu "PR belum disetor" di beranda & link yang
// terlanjur dibagikan) tetap mendarat di tab yang benar, bukan balik ke Materi.
const normalizeTab = (t: string | null | undefined): string | null | undefined =>
  t === 'tugas' ? 'kuis' : t;

// [sesi-berikutnya-v1] Label hitung mundur ringkas. `now` sengaja dioper (bukan
// Date.now() di dalam) supaya nilainya ikut state `tick` — kalau tidak, React
// tak punya alasan me-render ulang dan labelnya membeku.
function hitungMundur(dt: Date, now: number): string {
  const menit = Math.round((dt.getTime() - now) / 60_000);
  if (menit <= 0) return 'sedang berlangsung';
  if (menit < 60) return `${menit} menit lagi`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} jam lagi`;
  const hari = Math.round(jam / 24);
  return hari === 1 ? 'besok' : `${hari} hari lagi`;
}

export default function ClassDetailView({ reg, initialTab, previewStudentId = null, previewSchedules = null, previewRegs = null }: Props) {
  const [activeTab, setActiveTabState] = useState<ClassTab>(isValidTab(normalizeTab(initialTab)) ? (normalizeTab(initialTab) as ClassTab) : 'materi');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // [sesi-berikutnya-v1] Detak menit buat label hitung mundur — tanpa ini halaman
  // yang dibiarkan terbuka akan terus menampilkan "3 jam lagi" sampai di-refresh.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Sinkron tab ke URL (?tab=) tanpa re-render route — biar bisa di-share/refresh.
  function setActiveTab(t: ClassTab) {
    setActiveTabState(t);
    try {
      const url = new URL(window.location.href);
      if (t === 'materi') url.searchParams.delete('tab');
      else url.searchParams.set('tab', t);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }

  useEffect(() => {
    if (!reg) return;
    if (previewStudentId) {
      setSchedules(previewSchedules || []);
      setLoading(false);
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reg?.id, previewStudentId, previewSchedules]);

  // [teacher-avatar-sync-v1] Tambal data pengajar dari tabel `teachers` (sumber yang
  // SAMA dgn dashboard admin & pengajar) kalau reg (dari handoff/cache lama) belum
  // membawa avatar_url — foto pengajar tetap muncul & sinkron.
  const [teacherFix, setTeacherFix] = useState<any>(null);
  useEffect(() => {
    if (!reg?.teacher_id || reg?.teachers?.avatar_url) { setTeacherFix(null); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('teachers')
        .select('name, title, avatar_url')
        .eq('id', reg.teacher_id)
        .maybeSingle();
      if (alive && data) setTeacherFix(data);
    })();
    return () => { alive = false; };
  }, [reg?.teacher_id, reg?.teachers?.avatar_url]);

  // [kelas-level-switcher-v1] Semua kelas siswa di BAHASA yang sama — bahan strip
  // pindah level di atas banner. Level lama biasanya sudah `archived_at` (hilang dari
  // kartu beranda), justru itu yang mau dijangkau: cek materi/kuis sesi lampau tanpa
  // balik ke beranda. Yang dibuang: dibatalkan admin & yang tak pernah dibayar.
  // Bahasa dicocokkan lewat sameLanguage — `registrations.language` isinya campur
  // ("Russian" vs "Rusia"), eq() bakal melewatkan level lama yang namanya beda.
  // Gagal query = strip tak muncul; halaman TIDAK boleh ikut error.
  const [levelRegs, setLevelRegs] = useState<any[]>([]);
  useEffect(() => {
    if (!reg?.language) { setLevelRegs([]); return; }
    if (previewStudentId) {
      setLevelRegs((previewRegs || []).filter((r: any) => sameLanguage(r.language, reg.language)));
      return;
    }
    if (!reg?.student_id) { setLevelRegs([]); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('registrations')
        .select(`
          id, student_id, product, language, level, status,
          sessions_total, sessions_used,
          duration, total_amount, payment_status, pipeline_status,
          teacher_id, archived_at, registration_date, created_at,
          teachers(name, title, avatar_url)
        `)
        .eq('student_id', reg.student_id);
      if (!alive) return;
      setLevelRegs(
        (data || []).filter(
          (r: any) =>
            sameLanguage(r.language, reg.language) &&
            r.pipeline_status !== 'Batal' &&
            (r.id === reg.id || r.payment_status === 'Lunas' || r.payment_status === 'Cicilan'),
        ),
      );
    })();
    return () => { alive = false; };
  }, [reg?.student_id, reg?.language, reg?.id, previewStudentId, previewRegs]);

  // [kelas-tab-badge-v1] Jumlah isi tiap tab, dipakai buat badge di tab bar.
  // Tanpa ini siswa harus mengklik 6 tab satu-satu cuma buat tahu mana yang ada
  // isinya — Materi/Rapor/Tugas jadi jarang dibuka padahal isinya penting.
  // SEMUA query di sini boleh gagal (tabel belum dimigrasi, RLS, mode pratinjau):
  // kalau gagal badge-nya cuma tidak muncul, halaman TIDAK boleh ikut error.
  const [counts, setCounts] = useState<{ materi: number; rapor: number; kuis: number }>({ materi: 0, rapor: 0, kuis: 0 });
  useEffect(() => {
    if (!reg?.id || previewStudentId) return;
    let alive = true;
    (async () => {
      const [mat, rap, sub] = await Promise.all([
        supabase.from('class_materials').select('id', { count: 'exact', head: true }).eq('registration_id', reg.id),
        supabase.from('class_reports').select('id', { count: 'exact', head: true }).eq('registration_id', reg.id).not('published_at', 'is', null),
        supabase.from('homework_submissions').select('schedule_id').eq('registration_id', reg.id),
      ]);
      if (!alive) return;
      const setoran = new Set((sub.data || []).map((s: any) => s.schedule_id));
      setCounts({
        materi: mat.count || 0,
        rapor: rap.count || 0,
        // Badge Kuis = jumlah kuis yang sudah bernilai + PR yang belum disetor,
        // dua-duanya isi tab itu dan sama-sama menunggu dibuka siswa.
        kuis: quizScoreRows(schedules).length
          + schedules.filter((s: any) => (s.homework || '').trim() && !setoran.has(s.id)).length,
      });
    })();
    return () => { alive = false; };
  }, [reg?.id, previewStudentId, schedules]);

  async function fetchData() {
    setLoading(true);
    const { data: s } = await supabase
      .from('schedules')
      .select('*')
      .eq('registration_id', reg.id)
      .order('scheduled_at', { ascending: true });
    setSchedules(s || []);
    setLoading(false);
  }

  if (!reg) return null;

  const teacher = (reg.teachers || teacherFix) ? { ...(reg.teachers || {}), ...(teacherFix || {}) } : null;
  const teacherName = sapaan(teacher?.name, teacher?.title);
  // [blok-sync-v2] sessions_used bisa tertinggal dari presensi yang tercatat di `schedules`
  // (sesi ditandai selesai lewat menu Jadwal / konfirmasi siswa cuma menyentuh baris
  // schedule). Dashboard pengajar & tab Progress memakai yang terbesar — samakan di sini
  // supaya "Progress Sesi" tidak menyebut angka yang berbeda dari grid presensinya.
  const sesiTerpakai = Math.min(
    reg.sessions_total || Infinity,
    Math.max(reg.sessions_used || 0, schedules.filter((s: any) => s.status === 'completed').length),
  );
  const progress = reg.sessions_total ? Math.round((sesiTerpakai / reg.sessions_total) * 100) : 0;
  const sisaSesi = Math.max(0, (reg.sessions_total || 0) - sesiTerpakai);
  const selesai = (reg.sessions_total > 0 && sesiTerpakai >= reg.sessions_total) || !!reg.archived_at;
  const photo = getLangPhoto(reg.language);
  // Sesi terdekat yang belum lewat (schedules sudah terurut menaik dari query).
  // Riwayat sesi tidak lagi dihitung di sini — linimasa milestone di tab Materi
  // yang memegangnya.
  const upcoming = schedules.filter((s: any) => ['pending', 'scheduled'].includes(s.status) && new Date(s.scheduled_at).getTime() > Date.now() - 3600_000);
  const nextSched = upcoming[0] || null;
  // [wa-prefill-v1] Bawa konteks kelasnya ke chat — admin tak perlu tanya balik
  // "ini kelas yang mana ya kak".
  const waAdminUrl = `https://wa.me/6282116859493?text=${encodeURIComponent(
    `Halo Admin Linguo, saya mau tanya soal kelas ${displayLanguage(reg.language)} ${reg.level || ''}`.trim(),
  )}`;

  return (
    <main className="mx-auto w-full max-w-[1000px] px-4 pb-16 pt-5 sm:px-6">
      {/* Back */}
      <Link href={previewStudentId ? `/akun?preview=${encodeURIComponent(previewStudentId)}` : "/akun"} prefetch className="inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-500 transition hover:text-[#16796E]">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Kembali ke Beranda
      </Link>

      {/* ── Pindah level (bahasa sama) ──
          [kelas-level-switcher-v1] Sengaja DI ATAS banner: posisinya sejajar breadcrumb,
          kelihatan sebelum siswa scroll, dan tak mengganggu urutan hero → progress → tab. */}
      <ClassLevelSwitcher
        regs={levelRegs}
        currentId={reg.id}
        activeTab={activeTab}
        previewStudentId={previewStudentId}
      />

      {/* ── Hero ── */}
      <div className="relative mt-4 overflow-hidden rounded-3xl bg-[#16796E]">
        <div className={`relative flex h-44 items-end sm:h-56 ${selesai ? 'grayscale' : ''}`}>
          {photo ? (
            <>
              <img src={photo} alt={reg.language} className="absolute inset-0 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            </>
          ) : (
            <>
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[110px] font-extrabold tracking-tight text-white/15 sm:text-[150px]">{langGlyph(reg.language)}</span>
              <div className="absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-white/10" />
            </>
          )}

          {/* Status badge */}
          {selesai ? (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-gray-500">
              <Check className="h-3 w-3" strokeWidth={3} /> Selesai
            </span>
          ) : (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#16796E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16796E]" /> Aktif
            </span>
          )}

          {/* Judul */}
          <div className="relative w-full px-5 pb-5 sm:px-7 sm:pb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">{reg.product || 'Kelas'}</div>
            <div className="mt-1 flex items-center gap-2.5">
              <img src={getFlagUrl(reg.language)} alt="" className="h-5 w-5 shrink-0 rounded-sm object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              <h1 className="truncate text-[24px] font-extrabold leading-tight text-white sm:text-[30px]">
                {displayLanguage(reg.language)} · {reg.level || 'TBD'}
              </h1>
            </div>
            {/* [kelas-header-paket-v1] Durasi & jumlah sesi nempel di header —
                itu identitas paketnya, sebaris dgn bahasa & levelnya. Total
                pembayaran sengaja TIDAK ditampilkan di sini (sudah ada di
                halaman Pembayaran). */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12px] font-semibold text-white/85">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" strokeWidth={2.2} />{reg.duration || '-'} menit/sesi</span>
              <span className="inline-flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" strokeWidth={2.2} />Paket {reg.sessions_total || 0} sesi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info strip: pengajar + progress + chips ── */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {teacherName ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[#F0FAF8] p-4">
            {teacher?.avatar_url ? (
              <img src={teacher.avatar_url} alt={teacherName} className="h-11 w-11 shrink-0 rounded-full bg-white object-cover" onError={(e) => { const el = e.currentTarget as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling?.classList.remove('hidden'); }} />
            ) : null}
            <div className={`${teacher?.avatar_url ? 'hidden' : ''} flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#16796E]/10 text-[#16796E]`}>
              <User className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#16796E]">Pengajar</div>
              <div className="truncate text-[16px] font-extrabold text-[#12172B]">{teacherName}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
            Pengajar belum di-assign. Hubungi admin untuk dipasangkan.
          </div>
        )}

        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">Progress Sesi</div>
            <div className="text-sm font-bold text-[#16796E]">{sesiTerpakai} / {reg.sessions_total || 0}</div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-gradient-to-r from-[#16796E] to-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          {/* [kelas-progress-konteks-v1] "14 / 16" saja tidak memberi tahu apa-apa.
              Sisa sesi yang bikin siswa sadar kapan harus ambil paket berikutnya. */}
          {sisaSesi > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Sisa <b className="text-gray-700">{sisaSesi} sesi</b> lagi di level ini
            </div>
          )}
          {selesai && (
            <div className="mt-2 text-xs text-gray-500">Semua sesi di level ini sudah selesai</div>
          )}
        </div>
      </div>

      {/* ── Sesi Berikutnya ──
          [sesi-berikutnya-v1] Yang paling dicari siswa saat membuka kelas adalah
          "kapan sesi saya berikutnya". [kelas-tab-ramping-v1] Dulu ini isi tab
          Overview; setelah tab itu dihapus kartunya naik jadi blok tetap di atas
          tab bar — tetap lengkap dengan aksinya (ubah jadwal / batalkan). */}
      {!loading && (
        <div className="mt-5">
          {nextSched ? (
            <div className="rounded-2xl border border-[#16796E]/25 bg-[#F0FAF8] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#16796E]">
                    <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.4} /> Sesi Berikutnya
                  </div>
                  <div className="mt-1.5 text-[18px] font-extrabold leading-tight text-[#12172B] sm:text-[20px]">
                    {new Date(nextSched.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div className="mt-0.5 text-sm text-gray-600">
                    {new Date(nextSched.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    {/* [durasi-paket-v1] Durasi paket menang atas duration_minutes baris
                        jadwal — baris lama bisa menyimpan 45 menit di kelas 60 menit. */}
                    {' · '}{Number(reg.duration) || nextSched.duration_minutes || 60} menit
                    {nextSched.status === 'pending' ? ' · menunggu konfirmasi pengajar' : ''}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#16796E]">
                  {hitungMundur(new Date(nextSched.scheduled_at), tick)}
                </span>
              </div>
              {/* [jadwal-tanpa-aksi-siswa-v1] Siswa TIDAK bisa ubah/batalkan jadwal
                  sendiri. Perubahan jadwal disepakati dulu di grup kelas, lalu pengajar
                  yang memindahkan sesinya — supaya jadwal pengajar tidak bentrok dan
                  kuota sesi tidak terpotong karena salah klik. */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-[#16796E]/20 pt-3">
                <div className="text-xs text-gray-600">
                  Mau ubah atau batalkan jadwal? Kabari pengajar di grup kelas ya.
                </div>
                <a
                  href={waAdminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold text-gray-600 hover:text-[#16796E]"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.4} /> Chat Admin
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-50 p-5 text-center">
              <Calendar className="mx-auto h-6 w-6 text-gray-400" strokeWidth={1.8} />
              <div className="mt-2 text-sm font-semibold text-gray-700">
                {selesai ? 'Kelas di level ini sudah selesai' : 'Belum ada sesi terjadwal'}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {selesai ? 'Mau lanjut ke level berikutnya? Hubungi admin.' : 'Hubungi admin untuk menjadwalkan sesi berikutnya.'}
              </div>
              <a href={waAdminUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#16796E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F5A52]">
                <MessageCircle className="h-4 w-4" strokeWidth={2.4} /> Chat Admin
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Tab bar (sticky di dalam panel scroll shell) ── */}
      <div className="sticky top-0 z-20 -mx-4 mt-6 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex min-w-max overflow-x-auto" role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            const aktif = activeTab === t.id;
            // Badge: Tugas dihitung yang BELUM disetor (perlu aksi → amber),
            // Materi & Rapor cuma penanda "ada isinya" (netral).
            const badge = t.id === 'kuis' ? counts.kuis : t.id === 'materi' ? counts.materi : t.id === 'rapor' ? counts.rapor : 0;
            const perluAksi = t.id === 'kuis';
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={aktif}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${aktif ? 'border-[#16796E] text-[#16796E]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />{t.label}
                {badge > 0 && (
                  <span className={`ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${perluAksi ? 'bg-amber-100 text-amber-700' : aktif ? 'bg-[#16796E]/12 text-[#16796E]' : 'bg-gray-100 text-gray-600'}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Konten tab ── */}
      <div className="pt-6">
        {loading && <div className="py-10 text-center text-gray-400">Memuat…</div>}

        {/* [kelas-tab-v1] Progress = skill CEFR (student_skills) + timeline laporan sesi */}
        {!loading && activeTab === 'progress' && <ClassProgressTab reg={reg} schedules={schedules} />}

        {/* [kelas-tab-v1] Materi = lampiran pengajar (class_materials) + recording sesi.
            [kelas-materi-milestone-v1] Sekaligus linimasa milestone seluruh sesi
            (baca saja — siswa tak bisa ubah/batalkan jadwal sendiri). */}
        {!loading && activeTab === 'materi' && (
          <ClassMateriTab
            reg={reg}
            schedules={schedules}
            teacherName={teacherName}
            sesiTerpakai={sesiTerpakai}
          />
        )}

        {/* [kelas-tab-kuis-v1] Kuis = grafik nilai antar pertemuan + rincian benar/salah
            + pembahasan per soal. PR (kalau ada) ikut di bawahnya. */}
        {!loading && activeTab === 'kuis' && <ClassKuisTab reg={reg} schedules={schedules} />}

        {/* [kelas-tab-v1] Rapor = class_reports yang published + sertifikat (rapor akhir) */}
        {!loading && activeTab === 'rapor' && <ClassRaporTab reg={reg} teacherName={teacherName} teacherFullName={teacher?.name || undefined} />}
      </div>

    </main>
  );
}
