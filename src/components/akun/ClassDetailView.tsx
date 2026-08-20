'use client';

// [kelas-detail-page-v1] Konten halaman detail kelas /akun/kelas/[id].
// Dulu ini ClassDetailModal (popup di beranda) — 5 tab + flow reschedule/cancel
// kelewat berat buat modal (modal numpuk modal), jadi dinaikkan ke halaman penuh:
// deep-linkable (?tab=progress), tombol back browser jalan, lega di mobile.
// [jadwal-tanpa-aksi-siswa-v1] Aksi ubah/batalkan jadwal milik siswa DIHAPUS —
// perubahan jadwal disepakati di grup kelas, pengajar yang memindahkan sesinya.

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase, resolveSessionForGate } from '@/lib/supabase-client';
import { getFlagUrl, getLangPhoto, langGlyph } from '@/lib/lang-visuals';
import { displayLanguage } from '@/lib/classLanguage';
// [kelas-level-switcher-v1] strip pindah level (A1.1 → A2.2) di bahasa yang sama
import { sameLanguage } from '@/lib/languageSlug';
import ClassLevelSwitcher from '@/components/akun/ClassLevelSwitcher';
// [kelas-switch-instan-v1] cache sesi + pasang-sebelum-paint biar pindah level tak kedip
import { readCache, writeCache, useIsoLayoutEffect, regKey, schedKey, materiKey, levelRegsKey, STUDENT_ID_KEY, simpanDaftarLevel } from '@/lib/kelasCache';
// [teacher-sapaan-v1] siswa manggil pengajarnya "Kak Dhani", bukan nama lengkap
import { sapaan } from '@/lib/teacherName';
import ClassProgressTab from '@/components/akun/ClassProgressTab';
import ClassMateriTab from '@/components/akun/ClassMateriTab';
import { quizScoreRows } from '@/components/akun/ClassQuizScores';
import ClassRaporTab from '@/components/akun/ClassRaporTab';
// [kelas-tab-kuis-v1] Kuis tiap pertemuan: grafik skor + rincian benar/salah + pembahasan
import ClassKuisTab from '@/components/akun/ClassKuisTab';
import { tr, useT, useUiLang } from '@/lib/uiLang'; // [ui-lang-switcher-v1]
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
  // [kelas-sesi-mati-jujur-v1] true = sesi login sudah tak sah. Semua query siswa
  // dijawab RLS dengan daftar KOSONG (bukan error), jadi tanpa penanda ini halaman
  // tampak seperti "kelasnya memang tak punya jadwal & tak punya level lain".
  sesiMati?: boolean;
  // [kelas-level-switcher-v3] true = sesi pratinjau staf sudah kedaluwarsa. Sama
  // bohongnya dengan sesiMati: endpoint pratinjau menolak, halaman tetap tampak utuh.
  pratinjauMati?: boolean;
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
  if (menit <= 0) return tr('sedang berlangsung');
  if (menit < 60) return `${menit} ${tr('menit lagi')}`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} ${tr('jam lagi')}`;
  const hari = Math.round(jam / 24);
  return hari === 1 ? tr('besok') : `${hari} ${tr('hari lagi')}`;
}

export default function ClassDetailView({ reg, initialTab, previewStudentId = null, previewSchedules = null, previewRegs = null, sesiMati = false, pratinjauMati = false }: Props) {
  // [ui-lang-switcher-v1] `tl` — nama `t` sudah dipakai buat item TABS di bawah.
  const tl = useT();
  const uiLang = useUiLang();
  const dateLocale = uiLang === 'en' ? 'en-GB' : 'id-ID';
  const [activeTab, setActiveTabState] = useState<ClassTab>(isValidTab(normalizeTab(initialTab)) ? (normalizeTab(initialTab) as ClassTab) : 'materi');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // [kelas-switch-instan-v1] Jadwal level yang pernah dibuka dipasang dari cache
  // sebelum paint: linimasa & kartu "Sesi Berikutnya" langsung terisi, query di
  // bawah tinggal menyegarkan diam-diam.
  useIsoLayoutEffect(() => {
    const c = readCache<any[]>(reg?.id ? schedKey(reg.id) : null);
    setSchedules(c || []);
    setLoading(!c);
  }, [reg?.id]);
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
    // Sudah ada isi dari cache → segarkan TANPA balik ke layar "Memuat…".
    fetchData(!!readCache<any[]>(schedKey(reg.id)));
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

  // [kelas-level-switcher-v2] Id siswa TIDAK boleh diandalkan dari `reg`: baris
  // handoff kartu beranda tak memuat `student_id` (select-nya memang tak memilih
  // kolom itu), jadi strip level cuma muncul kalau/ketika query verifikasi halaman
  // sempat menimpa reg — itu yang bikin strip-nya kadang tak nongol sama sekali.
  // Sekarang id-nya dicari sendiri (sekali, lalu di-cache per tab).
  const [studentId, setStudentId] = useState<string | null>(null);
  useIsoLayoutEffect(() => {
    setStudentId(reg?.student_id || readCache<string>(STUDENT_ID_KEY) || null);
  }, [reg?.student_id]);
  useEffect(() => {
    if (studentId || previewStudentId) return;
    let alive = true;
    (async () => {
      const email = (await resolveSessionForGate()).user?.email;
      if (!email || !alive) return;
      const { data } = await supabase.from('students').select('id').eq('email', email).maybeSingle();
      if (!alive || !data?.id) return;
      setStudentId(data.id);
      writeCache(STUDENT_ID_KEY, data.id);
    })();
    return () => { alive = false; };
  }, [studentId, previewStudentId]);

  // Strip level dipasang dari cache sebelum paint — kalau tidak, strip-nya hilang
  // lalu muncul lagi tiap pindah level (kedipan paling kelihatan, karena dia yang
  // barusan diklik). Cache kosong TIDAK mengosongkan daftar yang sudah tampil:
  // bahasanya toh sama saat pindah level, dan strip yang berkedip hilang-muncul
  // lebih buruk daripada strip yang telat satu detik menyegarkan diri.
  // Di mode pratinjau id siswa datang dari `?preview=`, bukan dari sesi login —
  // titipan beranda tersimpan dengan id itu, jadi kuncinya harus ikut.
  const cacheOwnerId = previewStudentId || studentId;
  useIsoLayoutEffect(() => {
    const c = readCache<any[]>(cacheOwnerId && reg?.language ? levelRegsKey(cacheOwnerId, reg.language) : null);
    if (c && c.length) setLevelRegs(c);
  }, [cacheOwnerId, reg?.language]);
  useEffect(() => {
    if (!reg?.language) return;
    if (previewStudentId) {
      // `previewRegs` null = endpoint pratinjau belum menjawab / menolak (kode
      // kedaluwarsa). Daftar yang sudah tampil (dari titipan beranda) JANGAN
      // dikosongkan — itu persis yang dulu bikin strip level raib diam-diam.
      if (!previewRegs) return;
      const sekelas = previewRegs.filter((r: any) => sameLanguage(r.language, reg.language));
      if (sekelas.length) setLevelRegs(sekelas);
      simpanDaftarLevel(previewStudentId, previewRegs);
      return;
    }
    if (!studentId) return;
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id, student_id, product, language, level, status,
          sessions_total, sessions_used,
          duration, total_amount, payment_status, pipeline_status,
          teacher_id, archived_at, registration_date, created_at,
          teachers(name, title, avatar_url)
        `)
        .eq('student_id', studentId);
      if (!alive) return;
      if (error) {
        // Strip cuma pemanis navigasi — gagal ambil daftar level TIDAK boleh
        // mengosongkan yang sudah tampil, apalagi bikin halaman error.
        console.warn('[kelas-level-switcher] gagal ambil daftar level:', error.message);
        return;
      }
      const sekelas = (data || []).filter(
        (r: any) =>
          sameLanguage(r.language, reg.language) &&
          r.pipeline_status !== 'Batal' &&
          (r.id === reg.id || r.payment_status === 'Lunas' || r.payment_status === 'Cicilan'),
      );
      setLevelRegs(sekelas);
      writeCache(levelRegsKey(studentId, reg.language), sekelas);
      // Baris tiap level ikut dititipkan: klik chip → halaman tujuan render instan
      // (handoff-nya sudah ada, tak perlu nunggu query verifikasi).
      sekelas.forEach((r: any) => writeCache(regKey(r.id), r));
    })();
    return () => { alive = false; };
  }, [studentId, reg?.language, reg?.id, previewStudentId, previewRegs]);

  // Level yang SEDANG dibuka wajib ada di strip walau tak lolos saringan daftar
  // (mis. baris titipan beranda yang belum lunas, atau daftar yang datang dari
  // cache lama): chip aktifnya yang jadi penunjuk "kamu di sini".
  const levelChips = useMemo(() => {
    if (!reg?.id || !levelRegs.length) return levelRegs;
    return levelRegs.some((r: any) => r.id === reg.id) ? levelRegs : [...levelRegs, reg];
  }, [levelRegs, reg]);

  // [kelas-switch-instan-v1] Prefetch diam-diam isi level tetangga (jadwal + materi)
  // sesudah halaman ini tenang. Dua query IN() untuk SEMUA level sekaligus — jauh
  // lebih murah daripada 2 query per level saat diklik, dan hasilnya: chip level
  // yang belum pernah dibuka pun langsung terisi, tanpa layar "Memuat…".
  useEffect(() => {
    if (previewStudentId || levelRegs.length < 2) return;
    const lain = levelRegs.map((r: any) => r.id).filter((id: string) => id !== reg?.id);
    if (!lain.length) return;
    let alive = true;
    const t = setTimeout(async () => {
      const [sch, mat] = await Promise.all([
        supabase.from('schedules').select('*').in('registration_id', lain).order('scheduled_at', { ascending: true }),
        supabase
          .from('class_materials')
          .select('id, registration_id, schedule_id, session_number, title, kind, url, note, content, created_at')
          .in('registration_id', lain)
          .order('created_at', { ascending: false }),
      ]);
      if (!alive) return;
      const grup = (rows: any[] | null) => {
        const m = new Map<string, any[]>();
        lain.forEach((id: string) => m.set(id, []));
        (rows || []).forEach((row: any) => m.get(row.registration_id)?.push(row));
        return m;
      };
      if (!sch.error) grup(sch.data).forEach((rows, id) => writeCache(schedKey(id), rows));
      if (!mat.error) grup(mat.data).forEach((rows, id) => writeCache(materiKey(id), rows));
    }, 700);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelRegs, reg?.id, previewStudentId]);

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

  async function fetchData(senyap = false) {
    if (!senyap) setLoading(true);
    const { data: s } = await supabase
      .from('schedules')
      .select('*')
      .eq('registration_id', reg.id)
      .order('scheduled_at', { ascending: true });
    setSchedules(s || []);
    writeCache(schedKey(reg.id), s || []);
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
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> {tl('Kembali ke Beranda')}
      </Link>

      {/* [kelas-sesi-mati-jujur-v1] Sesi habis → akui, jangan diam. Tanpa banner ini
          siswa membaca "Belum ada sesi terjadwal" & strip level yang lenyap sebagai
          kenyataan, padahal datanya cuma tak terjangkau. */}
      {/* [kelas-level-switcher-v3] Pratinjau staf kedaluwarsa → akui juga. Tanpa ini
          strip level & jadwal kosong terbaca sebagai fakta tentang siswanya. */}
      {!sesiMati && pratinjauMati && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-bold text-amber-800">{tl('Sesi pratinjau sudah kedaluwarsa')}</div>
          <div className="mt-1 text-[13px] text-amber-700">
            Jadwal &amp; daftar level di bahasa ini tak bisa disegarkan. Yang tampil data terakhir
            yang sempat tersimpan — terbitkan kode &quot;Lihat sebagai Siswa&quot; yang baru dari dasbor.
          </div>
        </div>
      )}

      {sesiMati && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-bold text-amber-800">{tl('Sesi kamu sudah berakhir')}</div>
          <div className="mt-1 text-[13px] text-amber-700">
            {tl('Jadwal, materi, dan daftar level di bahasa ini tidak bisa dimuat sampai kamu masuk lagi. Yang tampil di halaman ini data terakhir yang sempat tersimpan.')}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#16796E] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#0F5A52]"
            >
              {tl('Muat Ulang')}
            </button>
            <Link
              href="/akun"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-[13px] font-bold text-amber-800 hover:bg-amber-100"
            >
              {tl('Masuk Lagi')}
            </Link>
          </div>
        </div>
      )}

      {/* ── Pindah level (bahasa sama) ──
          [kelas-level-switcher-v1] Sengaja DI ATAS banner: posisinya sejajar breadcrumb,
          kelihatan sebelum siswa scroll, dan tak mengganggu urutan hero → progress → tab. */}
      <ClassLevelSwitcher
        regs={levelChips}
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
              <Check className="h-3 w-3" strokeWidth={3} /> {tl('Selesai')}
            </span>
          ) : (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#16796E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16796E]" /> {tl('Aktif')}
            </span>
          )}

          {/* Judul */}
          <div className="relative w-full px-5 pb-5 sm:px-7 sm:pb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">{tl(reg.product || 'Kelas')}</div>
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
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" strokeWidth={2.2} />{reg.duration || '-'} {tl('menit/sesi')}</span>
              <span className="inline-flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" strokeWidth={2.2} />{tl('Paket')} {reg.sessions_total || 0} {tl('sesi')}</span>
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
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#16796E]">{tl('Pengajar')}</div>
              <div className="truncate text-[16px] font-extrabold text-[#12172B]">{teacherName}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
            {tl('Pengajar belum di-assign. Hubungi admin untuk dipasangkan.')}
          </div>
        )}

        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">{tl('Progress Sesi')}</div>
            <div className="text-sm font-bold text-[#16796E]">{sesiTerpakai} / {reg.sessions_total || 0}</div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-gradient-to-r from-[#16796E] to-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          {/* [kelas-progress-konteks-v1] "14 / 16" saja tidak memberi tahu apa-apa.
              Sisa sesi yang bikin siswa sadar kapan harus ambil paket berikutnya. */}
          {sisaSesi > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              {tl('Sisa')} <b className="text-gray-700">{sisaSesi} {tl('sesi')}</b> {tl('lagi di level ini')}
            </div>
          )}
          {selesai && (
            <div className="mt-2 text-xs text-gray-500">{tl('Semua sesi di level ini sudah selesai')}</div>
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
                    <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.4} /> {tl('Sesi Berikutnya')}
                  </div>
                  <div className="mt-1.5 text-[18px] font-extrabold leading-tight text-[#12172B] sm:text-[20px]">
                    {new Date(nextSched.scheduled_at).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div className="mt-0.5 text-sm text-gray-600">
                    {new Date(nextSched.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    {/* [durasi-paket-v1] Durasi paket menang atas duration_minutes baris
                        jadwal — baris lama bisa menyimpan 45 menit di kelas 60 menit. */}
                    {' · '}{Number(reg.duration) || nextSched.duration_minutes || 60} {tl('menit')}
                    {nextSched.status === 'pending' ? ` · ${tl('menunggu konfirmasi pengajar')}` : ''}
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
                  {tl('Mau ubah atau batalkan jadwal? Kabari pengajar di grup kelas ya.')}
                </div>
                <a
                  href={waAdminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold text-gray-600 hover:text-[#16796E]"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.4} /> {tl('Chat Admin')}
                </a>
              </div>
            </div>
          ) : selesai || sesiMati ? null : (
            /* [kelas-selesai-tanpa-cta-v1] Level yang sudah beres TIDAK lagi menampilkan
               kartu "sudah selesai / hubungi admin": isinya cuma mengulang badge Selesai
               di banner + "Semua sesi di level ini sudah selesai" di Progress Sesi, dan
               siswa yang lagi menengok materi lama malah disodori ajakan jualan. Kartu
               ini kini khusus keadaan yang memang butuh aksi: kelas jalan tapi kosong
               jadwal. */
            <div className="rounded-2xl bg-gray-50 p-5 text-center">
              <Calendar className="mx-auto h-6 w-6 text-gray-400" strokeWidth={1.8} />
              <div className="mt-2 text-sm font-semibold text-gray-700">{tl('Belum ada sesi terjadwal')}</div>
              <div className="mt-1 text-xs text-gray-500">{tl('Hubungi admin untuk menjadwalkan sesi berikutnya.')}</div>
              <a href={waAdminUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#16796E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F5A52]">
                <MessageCircle className="h-4 w-4" strokeWidth={2.4} /> {tl('Chat Admin')}
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
                <Icon className="h-4 w-4" strokeWidth={2} />{tl(t.label)}
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
        {loading && <div className="py-10 text-center text-gray-400">{tl('Memuat…')}</div>}

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
