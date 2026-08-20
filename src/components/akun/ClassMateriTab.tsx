'use client';

// [kelas-tab-v1] Tab Materi di detail kelas siswa — satu tempat semua aset kelas:
//   • lampiran pengajar dari class_materials (link doc/slide/YouTube atau file
//     upload, ditambahkan dari dashboard pengajar);
//   • recording tiap sesi (schedules.recording_url) ikut tampil sebagai materi
//     sesi itu, jadi siswa nggak perlu bolak-balik tab.
//
// [kelas-materi-milestone-v1] Tampilannya sekarang LINIMASA MILESTONE sepanjang
// paket yang dibeli (paket 16 sesi → 16 milestone), bukan lagi daftar seadanya
// sesi yang kebetulan punya lampiran. Alasannya: tab Overview & Jadwal dihapus,
// jadi di sinilah siswa melihat seluruh perjalanan kelasnya — sesi mana yang
// sudah lewat, mana yang terjadwal, dan berapa sesi yang masih tersisa.
// Urutan sengaja DIBALIK: sesi terakhir di paling atas, sesi 1 di paling bawah.
// Kalau tabel class_materials belum dimigrasi, jatuh ke daftar milestone tanpa
// lampiran (jangan crash).
//
// [kelas-materi-silabus-sesi-v1] Tiap milestone SELALU bisa diklik dan selalu ada
// isinya: judul sesi + poin/kosakata yang dipelajari dibaca dari silabus level
// (src/data/curriculum/data/<slug>.ts lewat lib/silabusSesi), terpisah dari
// laporan pengajar. Sebelum ini cuma baris yang punya `schedules` yang hidup —
// di kelas lawas (sesi cuma tercatat di sessions_used) hampir semua baris mati
// walau sudah dicentang hijau.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
// [kelas-switch-instan-v1] materi level yang pernah dibuka/di-prefetch → tampil tanpa "Memuat…"
import { readCache, writeCache, useIsoLayoutEffect, materiKey } from '@/lib/kelasCache';
// (Play, bukan Youtube — versi lucide-react di repo ini tidak meng-export ikon brand)
import { BookOpen, FileText, Presentation, Link2, Paperclip, Video, ExternalLink, Play, Check, X, ChevronRight, Clock, CalendarDays, PenLine, Sparkles, type LucideIcon } from 'lucide-react';
import { studentRecordingHref } from '@/lib/classRoom';
import { publicNotes, parseSessionNotes, ATTENDANCE_BADGE } from '@/components/akun/class-notes';
// [kelas-materi-silabus-sesi-v1] silabus per sesi (judul + poin yang dipelajari)
import { loadSilabusLevel, type SilabusSesi, type SilabusLevel } from '@/lib/silabusSesi';
// [materi-slide-v1] Materi berbentuk dek slide — ditonton di tempat, lihat lib/materiSlides.
import { parseDeck } from '@/lib/materiSlides';
import { SlideDeckViewer } from '@/components/akun/SlideDeckViewer';
import { tr, useT, useUiLang } from '@/lib/uiLang'; // [ui-lang-switcher-v1]

// Deteksi jenis dari URL — fallback kalau kolom kind kosong / materi lama.
export function detectKind(url: string): string {
  const u = (url || '').toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('docs.google.com/presentation') || u.includes('slides.google') || u.endsWith('.ppt') || u.endsWith('.pptx')) return 'slide';
  if (u.includes('docs.google.com')) return 'doc';
  if (u.endsWith('.pdf')) return 'pdf';
  return 'link';
}

function youtubeId(url: string): string | null {
  const m = (url || '').match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export const KIND_META: Record<string, { label: string; Icon: LucideIcon; cls: string }> = {
  // [reg-materi-ai-v1] Materi berupa TEKS (disusun admin/kurikulum lewat AI di
  // dashboard). Tidak punya url — isinya di kolom `content` dan dibaca langsung
  // di halaman ini, bukan diunduh.
  ai: { label: 'Materi Belajar', Icon: Sparkles, cls: 'bg-violet-50 text-violet-600' },
  // [materi-slide-v1] Dek slide dari pengajar — isinya JSON di kolom `content`,
  // ditonton sebagai slideshow di halaman ini (bukan diunduh, bukan ke tab baru).
  ai_slides: { label: 'Slide Materi', Icon: Presentation, cls: 'bg-violet-50 text-violet-600' },
  youtube: { label: 'YouTube', Icon: Play, cls: 'bg-red-50 text-red-600' },
  doc: { label: 'Dokumen', Icon: FileText, cls: 'bg-blue-50 text-blue-600' },
  slide: { label: 'Slide', Icon: Presentation, cls: 'bg-orange-50 text-orange-600' },
  pdf: { label: 'PDF', Icon: FileText, cls: 'bg-red-50 text-red-600' },
  file: { label: 'File', Icon: Paperclip, cls: 'bg-gray-100 text-gray-600' },
  link: { label: 'Link', Icon: Link2, cls: 'bg-teal-50 text-[#16796E]' },
  recording: { label: 'Recording', Icon: Video, cls: 'bg-purple-50 text-purple-600' },
};

// [reg-materi-ai-v1] Materi teks dirender apa adanya dengan format seadanya:
// '## Judul', '- poin', dan **tebal**. Repo ini TIDAK punya react-markdown dan
// materi ini datang dari staf sendiri (bukan input publik), jadi cukup pemformat
// kecil ini — tetap tanpa dangerouslySetInnerHTML.
function TeksMateri({ isi }: { isi: string }) {
  const tebal = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**') ? <strong key={i} className="font-bold text-[#12172B]">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
    );
  return (
    <div className="space-y-2">
      {isi.split('\n').map((baris, i) => {
        const t = baris.trim();
        if (!t) return <div key={i} className="h-1" />;
        const h = t.match(/^(#{1,4})\s*(.+)$/);
        if (h) return <h4 key={i} className="pt-1 text-sm font-extrabold text-[#16796E]">{h[2]}</h4>;
        if (/^[-*]\s+/.test(t)) {
          return (
            <div key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#16796E]" />
              <span>{tebal(t.replace(/^[-*]\s+/, ''))}</span>
            </div>
          );
        }
        return <p key={i} className="text-sm leading-relaxed text-gray-700">{tebal(t)}</p>;
      })}
    </div>
  );
}

export function TeksMateriOverlay({ m, onClose }: { m: any; onClose: () => void }) {
  const t = useT(); // [ui-lang-switcher-v1]
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-6" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:max-w-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-[#12172B]">{m.title}</h3>
            <p className="mt-0.5 text-xs font-medium text-gray-500">
              {t('Materi belajar')}{m.note ? ` · ${m.note}` : ''}
            </p>
          </div>
          <button onClick={onClose} aria-label={t('Tutup')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <TeksMateri isi={m.content || ''} />
        </div>
      </div>
    </div>
  );
}

function MaterialCard({ m, teacherName }: { m: any; teacherName?: string }) {
  const t = useT(); // [ui-lang-switcher-v1]
  const uiLang = useUiLang();
  const dateLocale = uiLang === 'en' ? 'en-GB' : 'id-ID';
  const kind = m.kind && KIND_META[m.kind] ? m.kind : detectKind(m.url || '');
  const meta = KIND_META[kind] || KIND_META.link;
  const yt = kind === 'youtube' || kind === 'recording' ? youtubeId(m.url || '') : null;
  const [baca, setBaca] = useState(false);

  /* [materi-slide-v1] Dek slide. Dicek SEBELUM cabang materi teks karena
     penyimpanannya menumpang kolom `content` yang sama — kalau urutannya
     terbalik, siswa akan melihat JSON mentah sebagai "materi teks". */
  const dek = parseDeck(m.content);
  if (dek) {
    return (
      <>
        <button
          type="button"
          onClick={() => setBaca(true)}
          className="group flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left transition hover:shadow-sm"
        >
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${KIND_META.ai_slides.cls}`}>
            <Presentation className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900 group-hover:text-[#16796E]">{m.title}</div>
            {m.note && <div className="mt-0.5 truncate text-xs text-gray-500">{m.note}</div>}
            <div className="mt-0.5 text-[11px] text-gray-400">
              {dek.slides.length} {t('slide')}
              {teacherName ? ` · ${teacherName}` : ''}
              {m.created_at ? ` · ${new Date(m.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}` : ''}
            </div>
          </div>
          <Play className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-[#16796E]" strokeWidth={2} />
        </button>
        {baca && (
          <SlideDeckViewer
            slides={dek.slides}
            title={m.title}
            subtitle={m.session_number ? `${t('Sesi')} ${m.session_number}` : undefined}
            onClose={() => setBaca(false)}
          />
        )}
      </>
    );
  }

  // Materi teks: dibaca di tempat, bukan dibuka ke tab baru (tidak ada url-nya).
  if (kind === 'ai' || (!m.url && m.content)) {
    return (
      <>
        <button
          type="button"
          onClick={() => setBaca(true)}
          className="group flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left transition hover:shadow-sm"
        >
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${KIND_META.ai.cls}`}>
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900 group-hover:text-[#16796E]">{m.title}</div>
            {m.note && <div className="mt-0.5 truncate text-xs text-gray-500">{m.note}</div>}
            <div className="mt-0.5 text-[11px] text-gray-400">
              {t('Materi Belajar')}
              {m.created_at ? ` · ${new Date(m.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}` : ''}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-[#16796E]" strokeWidth={2} />
        </button>
        {baca && <TeksMateriOverlay m={m} onClose={() => setBaca(false)} />}
      </>
    );
  }

  return (
    <a
      href={m.url || '#'}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-2xl bg-white p-3.5 transition hover:border-slate-200 hover:shadow-sm"
    >
      {yt ? (
        <img src={`https://img.youtube.com/vi/${yt}/mqdefault.jpg`} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.cls}`}>
          <meta.Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-gray-900 group-hover:text-[#16796E]">{m.title}</div>
        {m.note && <div className="mt-0.5 truncate text-xs text-gray-500">{m.note}</div>}
        <div className="mt-0.5 text-[11px] text-gray-400">
          {t(meta.label)}
          {teacherName ? ` · ${teacherName}` : ''}
          {m.created_at ? ` · ${new Date(m.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}` : ''}
        </div>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-[#16796E]" strokeWidth={2} />
    </a>
  );
}

// Status satu milestone. `sched` null = slot sesi yang belum punya baris jadwal.
// [lms-dark-inline-style-gotcha] Warna DIBATASI ke kombinasi yang sudah ditangani
// override .lms-dark di StudentShell (tint -50 + teks -600/-700). Pakai -100/-800
// bikin chip menyala putih di mode gelap karena tidak ada aturannya di sana.
//
// [kelas-milestone-tanpa-badge-v1] Slot tanpa jadwal tidak diberi chip apa pun:
// paket 16 sesi yang baru jalan 4 dulu memunculkan 12+ chip "Belum dijadwalkan"
// beruntun — bising, dan tidak menambah informasi apa-apa di atas nomor sesi
// yang sudah berwarna redup. Yang sudah jalan justru dinaikkan: kelas lawas
// kerap tidak punya baris `schedules` sama sekali (sesinya cuma tercatat di
// registrations.sessions_used), jadi `sudahJalan` datang dari hitungan sesi
// terpakai dan slotnya tetap dicentang hijau seperti sesi selesai lainnya.
function statusMilestone(sched: any | null, sudahJalan = false) {
  if (!sched) {
    return sudahJalan
      ? { label: '', badge: '', dot: 'bg-[#16796E] text-white', done: true }
      : { label: '', badge: '', dot: 'bg-gray-100 text-gray-400', done: false };
  }
  const past = new Date(sched.scheduled_at).getTime() < Date.now();
  if (sched.status === 'completed') {
    return { label: 'Selesai', badge: 'bg-teal-50 text-teal-700', dot: 'bg-[#16796E] text-white', done: true };
  }
  if (sched.status === 'hangus') {
    return { label: 'Hangus', badge: 'bg-red-50 text-red-700', dot: 'bg-red-50 text-red-600', done: false };
  }
  if (past) {
    // [status-lampau-v1] Waktunya lewat tapi pengajar belum menandai selesai —
    // jangan dilabeli "Terjadwal", itu terbaca seolah masih akan datang.
    return { label: 'Menunggu laporan pengajar', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-200 text-gray-600', done: false };
  }
  if (sched.status === 'pending') {
    return { label: 'Menunggu konfirmasi pengajar', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-50 text-amber-600', done: false };
  }
  return { label: 'Terjadwal', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-50 text-blue-600', done: false };
}

// [kelas-materi-drawer-v1] Detail satu sesi: laporan pengajar + semua materinya.
// Sisi tulisnya sudah ada di dashboard pengajar (sheet "Lengkapi sesi" → topik,
// PR, catatan, link rekaman, dan lampiran `class_materials`); di sini cuma dibaca.
// WAJIB lewat parseSessionNotes/publicNotes — `schedules.notes` menyimpan catatan
// PRIBADI pengajar setelah separator ---PRIVATE---.
//
// [kelas-materi-silabus-sesi-v1] `sched` sekarang BOLEH null. Kelas lawas tidak
// punya baris `schedules` sama sekali (sesinya cuma tercatat di sessions_used),
// jadi dulu 15 dari 16 milestone-nya mati total waktu diklik. Drawer tetap ada
// isinya karena silabus level (judul sesi + poin/kosakata yang dipelajari) datang
// dari data kurikulum, bukan dari laporan pengajar.
function SesiDetailDrawer({
  no, sched, st, items, teacherName, durasi, silabus, onClose,
}: {
  no: number;
  sched: any | null;
  st: ReturnType<typeof statusMilestone>;
  items: any[];
  teacherName?: string;
  durasi: number | null;
  silabus?: SilabusSesi | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const dt = sched ? new Date(sched.scheduled_at) : null;
  const catatan = parseSessionNotes(sched?.notes);
  const presensi = ATTENDANCE_BADGE[sched?.attendance_status as string];
  const pesan = [catatan.message, ...catatan.extras].filter(Boolean).join('\n');
  const t = useT(); // [ui-lang-switcher-v1]
  const uiLang = useUiLang();
  const dateLocale = uiLang === 'en' ? 'en-GB' : 'id-ID';
  const pr = (sched?.homework || catatan.homework || '').trim();
  const adaLaporan = !!(catatan.topic || pesan || pr || sched?.material_notes);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-stretch md:justify-end"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:max-h-none md:w-[27rem] md:rounded-none md:rounded-l-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-[#12172B]">{t('Sesi')} {no}</h3>
              {st.label && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.badge}`}>{t(st.label)}</span>}
              {presensi && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${presensi.cls}`}>{t(presensi.label)}</span>}
            </div>
            {silabus?.title && (
              <p className="mt-0.5 text-sm font-bold text-[#16796E]">{silabus.title}</p>
            )}
            {dt ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-medium text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {dt.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB{durasi ? ` · ${durasi} ${t('menit')}` : ''}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-xs font-medium text-gray-500">
                {st.done ? t('Sesi ini sudah berjalan') : t('Belum dijadwalkan')}
                {durasi ? ` · ${durasi} ${t('menit')}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label={t('Tutup')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* [kelas-materi-silabus-sesi-v1] Isi silabus sesi ini — kosakata & poin
              yang dipelajari menurut kurikulum levelnya. Ditaruh paling atas karena
              ini satu-satunya bagian yang selalu ada, termasuk untuk sesi yang
              belum berjalan atau kelas lawas tanpa baris jadwal. */}
          {silabus?.topics && silabus.topics.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{t('Yang dipelajari')}</h4>
              <div className="flex flex-wrap gap-1.5">
                {silabus.topics.map((t, i) => (
                  <span key={i} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-[#16796E]">{t}</span>
                ))}
              </div>
            </section>
          )}

          {catatan.topic && (
            <section>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">{t('Topik')}</h4>
              <p className="text-sm font-semibold text-[#12172B]">{catatan.topic}</p>
            </section>
          )}

          {sched?.material_notes && (
            <section>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">{t('Catatan Materi')}</h4>
              <p className="whitespace-pre-line rounded-2xl bg-gray-50 px-3.5 py-3 text-sm text-gray-600">{sched.material_notes}</p>
            </section>
          )}

          {pesan && (
            <section>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('Catatan')} {teacherName || t('Pengajar')}
              </h4>
              <p className="whitespace-pre-line rounded-2xl bg-gray-50 px-3.5 py-3 text-sm text-gray-600">{pesan}</p>
            </section>
          )}

          {pr && (
            <section>
              <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                <PenLine className="h-3.5 w-3.5" strokeWidth={2.4} /> PR
              </h4>
              <p className="whitespace-pre-line rounded-2xl bg-amber-50 px-3.5 py-3 text-sm font-medium text-amber-700">{pr}</p>
              <p className="mt-1 text-[11px] text-gray-400">{t('Pengumpulan & penilaiannya ada di tab Tugas.')}</p>
            </section>
          )}

          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              {t('Materi Sesi')} {items.length > 0 ? `(${items.length})` : ''}
            </h4>
            {items.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {items.map((m) => <MaterialCard key={m.id} m={m} teacherName={teacherName} />)}
              </div>
            ) : (
              <div className="rounded-2xl bg-gray-50 px-4 py-6 text-center">
                <BookOpen className="mx-auto mb-2 h-7 w-7 text-gray-300" strokeWidth={1.6} />
                <p className="text-sm font-semibold text-gray-500">{t('Belum ada materi untuk sesi ini')}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {!sched
                    ? t('Rekaman, berkas, & catatan sesi ini akan muncul di sini setelah sesinya dijalankan pengajar.')
                    : adaLaporan
                    ? t('Pengajar belum melampirkan berkas atau tautan di sesi ini.')
                    : t('Materi & catatan akan muncul di sini setelah pengajar mengisinya.')}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/** Kepala baris sesi — jadi tombol kalau sesinya bisa dibuka. */
function HeaderSesi({ as, onClick, children }: { as: 'button' | 'div'; onClick?: () => void; children: React.ReactNode }) {
  const cls = 'group/head block w-full text-left';
  if (as === 'div') return <div className={cls}>{children}</div>;
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

function MilestoneRow({
  no,
  sched,
  sudahJalan,
  items,
  durasi,
  silabus,
  isLast,
  onOpen,
}: {
  no: number;
  sched: any | null;
  /** Sesi ini sudah berjalan menurut hitungan sesi terpakai, walau tak ada baris jadwal. */
  sudahJalan?: boolean;
  items: any[];
  /** Durasi per sesi menurut paket (registrations.duration), bukan durasi baris jadwal. */
  durasi: number | null;
  /** Sesi ke-`no` di silabus level ini (judul + poin yang dipelajari), kalau ada. */
  silabus?: SilabusSesi | null;
  isLast: boolean;
  onOpen?: () => void;
}) {
  const t = useT(); // [ui-lang-switcher-v1]
  const uiLang = useUiLang();
  const dateLocale = uiLang === 'en' ? 'en-GB' : 'id-ID';
  const st = statusMilestone(sched, sudahJalan);
  const dt = sched ? new Date(sched.scheduled_at) : null;
  const catatan = sched ? publicNotes(sched.notes) : '';
  // [kelas-materi-silabus-sesi-v1] SEMUA sesi bisa dibuka, bukan cuma yang punya
  // baris jadwal: isi drawer-nya sekarang datang dari silabus level juga, jadi sesi
  // yang belum jalan (atau kelas lawas tanpa `schedules`) tetap ada yang dibaca.
  const bisaDibuka = !!onOpen;

  // Isi lingkaran milestone. [kelas-milestone-flip-v1] Sesi yang sudah selesai
  // menukar centang dengan NOMOR sesinya saat disentuh kursor — nomornya tetap
  // terbaca tanpa mengorbankan centang hijau yang bikin progres kelihatan sekilas.
  // Bulatan 24px: cukup kecil untuk linimasa 18 baris, masih muat centang/nomor.
  const kelasBulatan = 'group/dot absolute left-0 top-0 h-6 w-6 [perspective:600px]';
  const isiBulatan = (
    <span
      className={`relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${st.done ? 'group-hover/dot:[transform:rotateY(180deg)]' : ''}`}
    >
      <span className={`absolute inset-0 flex items-center justify-center rounded-full text-[11px] font-extrabold [backface-visibility:hidden] ${st.dot}`}>
        {st.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : no}
      </span>
      {st.done && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[#16796E] text-[11px] font-extrabold text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {no}
        </span>
      )}
    </span>
  );

  return (
    <li className="relative pl-9">
      {/* [kelas-milestone-rail-v1] Rail milestone. Ditarik dari TITIK TENGAH bulatan
          (top-3 = separuh dari h-6) sampai dasar baris, dan digambar SEBELUM bulatan
          supaya bagian yang bertumpuk tertutup bulatan yang solid. Versi lama mulai
          dari bawah bulatan (`top-9`) sehingga baris pendek — sesi yang belum
          dijadwalkan — punya tinggi rail negatif alias garisnya hilang. */}
      {!isLast && <span aria-hidden className="absolute bottom-0 left-[11px] top-3 w-0.5 bg-gray-200" />}
      {bisaDibuka ? (
        <button type="button" onClick={onOpen} aria-label={`${t('Buka materi sesi')} ${no}`} className={kelasBulatan}>
          {isiBulatan}
        </button>
      ) : (
        <span className={kelasBulatan}>{isiBulatan}</span>
      )}

      <div className={sched ? 'pb-5' : 'pb-3'}>
        {/* [kelas-materi-drawer-v1] Judul + tanggal jadi satu tombol pembuka
            drawer materi — satu-satunya aksi di baris ini, karena siswa memang
            tidak boleh mengubah/membatalkan jadwalnya sendiri. */}
        <HeaderSesi as={bisaDibuka ? 'button' : 'div'} onClick={onOpen}>
          {/* min-h-6 = setinggi bulatan, jadi tulisan "Sesi N" persis sejajar
              dengan titik milestone-nya di semua baris (ada tanggal atau tidak). */}
          <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`text-sm font-extrabold ${sched || st.done ? 'text-[#12172B]' : 'text-gray-400'} ${bisaDibuka ? 'group-hover/head:text-[#16796E]' : ''}`}>{t('Sesi')} {no}</span>
            {/* Judul sesi dari silabus level — bikin linimasa terbaca sebagai peta
                materi, bukan cuma deretan nomor. */}
            {silabus?.title && (
              <span className={`text-sm font-semibold ${sched || st.done ? 'text-gray-600' : 'text-gray-400'}`}>{silabus.title}</span>
            )}
            {st.label && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.badge}`}>{t(st.label)}</span>}
            {items.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-[#16796E]">
                <Paperclip className="h-3 w-3" strokeWidth={2.4} />{items.length} {t('materi')}
              </span>
            )}
            {bisaDibuka && <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover/head:text-[#16796E]" strokeWidth={2.4} />}
          </div>

          {dt && (
            <div className="mt-0.5 text-xs text-gray-500">
              {dt.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              {durasi ? ` · ${durasi} ${t('menit')}` : ''}
            </div>
          )}
        </HeaderSesi>

        {/* [kelas-tab-v1] WAJIB publicNotes(): notes bisa bawa catatan PRIBADI pengajar */}
        {catatan && <div className="mt-1.5 line-clamp-2 whitespace-pre-line text-xs text-gray-500">{catatan}</div>}
      </div>
    </li>
  );
}

export default function ClassMateriTab({
  reg,
  schedules,
  teacherName,
  sesiTerpakai,
}: {
  reg: any;
  schedules: any[];
  teacherName?: string;
  /** Angka "Progress Sesi" dari halaman induk — linimasa wajib memakai angka yang
   *  sama, jangan menghitung ulang sendiri (bisa beda dari yang dibaca siswa). */
  sesiTerpakai?: number;
}) {
  const t = useT(); // [ui-lang-switcher-v1]
  const uiLang = useUiLang();
  const dateLocale = uiLang === 'en' ? 'en-GB' : 'id-ID';
  const [materials, setMaterials] = useState<any[] | null>(null); // null = loading
  // Pasang dari cache SEBELUM paint. Tanpa ini, tiap pindah level tab Materi
  // selalu melewati layar "Memuat…" walau isinya sudah di-prefetch.
  useIsoLayoutEffect(() => {
    setMaterials(readCache<any[]>(materiKey(reg.id)));
  }, [reg.id]);
  const [kosongTerbuka, setKosongTerbuka] = useState(false);
  const [sesiTerbuka, setSesiTerbuka] = useState<number | null>(null); // nomor sesi di drawer
  // [kelas-materi-silabus-sesi-v1] Silabus level kelas ini (16 sesi). null = tidak
  // ketemu (bahasa/level tak terjawab kurikulum) — linimasa tetap jalan tanpa judul.
  const [silabus, setSilabus] = useState<SilabusLevel | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from('class_materials')
        // [reg-materi-tab-v1] session_number: materi yang ditempel ke NOMOR sesi
        // dari dashboard admin (kelas lawas tak punya baris schedules sama sekali).
        // content: materi berupa teks (disusun lewat AI), dibaca langsung di sini.
        .select('id, schedule_id, session_number, title, kind, url, note, content, created_at')
        .eq('registration_id', reg.id)
        .order('created_at', { ascending: false });
      if (!alive) return;
      if (error) {
        // Tabel belum dimigrasi / policy belum ada → tampil kosong, jangan crash.
        console.warn('[kelas-materi] gagal load class_materials:', error.message);
        setMaterials((prev) => prev ?? []); // sudah ada isi dari cache? jangan dikosongkan
        return;
      }
      setMaterials(data || []);
      writeCache(materiKey(reg.id), data || []);
    })();
    return () => { alive = false; };
  }, [reg.id]);

  useEffect(() => {
    let alive = true;
    loadSilabusLevel(reg.language, reg.level)
      .then((s) => { if (alive) setSilabus(s); })
      .catch(() => { if (alive) setSilabus(null); });
    return () => { alive = false; };
  }, [reg.language, reg.level]);

  if (materials === null) {
    return <div className="py-10 text-center text-gray-400">Memuat…</div>;
  }

  // Materi umum = tidak terikat baris jadwal MAUPUN nomor sesi.
  const general = materials.filter((m) => !m.schedule_id && !m.session_number);
  const bySchedule = new Map<string, any[]>();
  materials.filter((m) => m.schedule_id).forEach((m) => {
    const arr = bySchedule.get(m.schedule_id) || [];
    arr.push(m);
    bySchedule.set(m.schedule_id, arr);
  });
  // [reg-materi-tab-v1] Materi yang ditempel ke nomor sesi (dari dashboard admin).
  const byNomorSesi = new Map<number, any[]>();
  materials.filter((m) => m.session_number).forEach((m) => {
    const no = Number(m.session_number);
    const arr = byNomorSesi.get(no) || [];
    arr.push(m);
    byNomorSesi.set(no, arr);
  });

  // [kelas-materi-milestone-v1] Slot milestone = sebanyak sesi yang DIBELI.
  // Sesi 'cancelled' TIDAK memakan slot (kuotanya balik), sesi 'hangus' memakan
  // slot (kuotanya sudah dipotong) — sejalan dgn cara sessions_used dihitung.
  // Kalau jadwal ternyata lebih banyak dari paket (sesi tambahan), slotnya ikut
  // melar supaya tidak ada sesi yang hilang dari linimasa.
  const slotSched = schedules
    .filter((s) => s.status !== 'cancelled')
    .slice()
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const totalSlot = Math.max(reg.sessions_total || 0, slotSched.length);
  // [kelas-milestone-tanpa-badge-v1] Slot terdepan sebanyak sesi terpakai dianggap
  // sudah berjalan. Slot terurut menaik menurut tanggal, jadi yang paling awal
  // memang yang paling mungkin sudah lewat — ini penyelamat kelas lawas yang
  // sesinya tidak pernah dicetak ke `schedules`.
  const terpakai = Math.max(0, Number(sesiTerpakai ?? reg.sessions_used) || 0);
  const milestones = Array.from({ length: totalSlot }, (_, i) => ({
    no: i + 1,
    sched: slotSched[i] || null,
    sudahJalan: i < terpakai,
  }));
  // Paling atas = sesi terakhir, paling bawah = sesi 1.
  const ordered = milestones.slice().reverse();
  // Berapa slot kosong beruntun di paling atas (sesi jauh di depan yang memang
  // belum dijadwalkan) — dilipat kalau lebih dari 2 biar tidak makan satu layar.
  // Sesi yang sudah berjalan tidak pernah ikut terlipat walau tanpa baris jadwal.
  let kosongDepan = 0;
  while (kosongDepan < ordered.length && !ordered[kosongDepan].sched && !ordered[kosongDepan].sudahJalan) kosongDepan++;
  const lipatKosong = !kosongTerbuka && kosongDepan > 2 && kosongDepan < ordered.length;

  // [durasi-paket-v1] Durasi sesi diambil dari PAKET (registrations.duration),
  // bukan dari schedules.duration_minutes: baris jadwal lama/hasil pemecahan blok
  // bisa menyimpan 45 menit padahal siswa membeli kelas 60 menit per sesi.
  const durasiSesi = Number(reg.duration) || null;

  /** Semua materi satu sesi: rekaman + lampiran class_materials + material_links.
   *  `no` = nomor milestone — materi dari dashboard admin nempel ke nomor ini,
   *  jadi sesi tanpa baris jadwal (kelas lawas) tetap bisa punya materi. */
  const itemsFor = (sched: any | null, no?: number) => {
    const byNo = no ? byNomorSesi.get(no) || [] : [];
    if (!sched) return [...byNo];
    // Materi yang punya schedule_id DAN session_number sekaligus (dipasang admin
    // saat baris jadwalnya ada) jangan dihitung dua kali.
    const out = [...byNo, ...(bySchedule.get(sched.id) || []).filter((m) => !m.session_number)];
    // Tautan/berkas yang dipasang pengajar langsung di baris jadwal — sebelumnya
    // cuma terlihat di linimasa beranda, tidak pernah muncul di tab Materi.
    (Array.isArray(sched.material_links) ? sched.material_links : []).forEach((l: any, i: number) => {
      if (!l?.url) return;
      out.push({
        id: `ml-${sched.id}-${i}`,
        title: l.name || tr('Lampiran'),
        kind: l.kind === 'file' ? 'file' : detectKind(l.url),
        url: l.url,
        created_at: sched.scheduled_at,
      });
    });
    if (sched.status === 'completed' && sched.recording_url) {
      out.unshift({
        id: `rec-${sched.id}`,
        title: tr('Recording Sesi'),
        kind: 'recording',
        // [kelas-video-rekaman-siswa-v1] Deep link Riwayat dashboard khusus tim →
        // alihkan ke pemutar siswa (lihat lib/classRoom).
        url: studentRecordingHref(sched.recording_url),
        created_at: sched.scheduled_at,
      });
    }
    return out;
  };

  const msTerbuka = sesiTerbuka === null ? null : milestones.find((m) => m.no === sesiTerbuka) || null;

  /** Sesi ke-`no` di silabus level ini. Paket 16 sesi = 1 sublevel = 16 entri,
   *  jadi nomornya sejajar. Sesi tambahan di luar paket tidak punya pasangan. */
  const silabusSesi = (no: number): SilabusSesi | null => silabus?.sessions?.[no - 1] || null;

  // Sesi yang dibatalkan tidak ikut penomoran, tapi jangan dihilangkan — siswa
  // masih perlu bisa melihat sesi mana yang batal dan alasannya.
  const dibatalkan = schedules
    .filter((s) => s.status === 'cancelled')
    .slice()
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  return (
    <div className="space-y-7">
      {general.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{t('Materi Umum')}</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {general.map((m) => <MaterialCard key={m.id} m={m} teacherName={teacherName} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          {t('Perjalanan Kelas')} ({totalSlot} {t('sesi')})
        </h2>
        {totalSlot === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <BookOpen className="mx-auto mb-2 h-9 w-9" strokeWidth={1.5} />
            <div className="text-sm text-gray-500">{t('Belum ada sesi di kelas ini')}</div>
            <div className="mt-1 text-xs">{t('Hubungi admin untuk menjadwalkan sesi pertamamu')}</div>
          </div>
        ) : (
          <ol className="relative">
            {/* Deretan slot kosong paling atas dilipat. Milestone-nya tetap ada
                (paket 16 sesi tetap 16 baris), cuma tidak sampai mendorong sesi
                yang benar-benar berisi jauh ke bawah layar. */}
            {lipatKosong && (
              <li className="relative pb-3 pl-9">
                <span aria-hidden className="absolute bottom-0 left-[11px] top-3 w-0.5 bg-gray-200" />
                <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[11px] font-extrabold text-gray-400">
                  {kosongDepan}
                </span>
                <button
                  onClick={() => setKosongTerbuka(true)}
                  className="flex min-h-6 items-center text-left text-sm font-bold text-gray-400 hover:text-[#16796E]"
                >
                  {t('Sesi')} {ordered[0].no}–{ordered[kosongDepan - 1].no} {t('belum dijadwalkan')}
                  <span className="ml-1.5 text-xs font-semibold text-[#16796E]">{t('Tampilkan')}</span>
                </button>
              </li>
            )}
            {(lipatKosong ? ordered.slice(kosongDepan) : ordered).map((ms, i, arr) => (
              <MilestoneRow
                key={ms.sched?.id || `slot-${ms.no}`}
                no={ms.no}
                sched={ms.sched}
                sudahJalan={ms.sudahJalan}
                items={itemsFor(ms.sched, ms.no)}
                durasi={durasiSesi || ms.sched?.duration_minutes || null}
                silabus={silabusSesi(ms.no)}
                isLast={i === arr.length - 1}
                onOpen={() => setSesiTerbuka(ms.no)}
              />
            ))}
          </ol>
        )}
      </section>

      {dibatalkan.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{t('Sesi Dibatalkan')} ({dibatalkan.length})</h2>
          <div className="space-y-2">
            {dibatalkan.map((s) => (
              <div key={s.id} className="rounded-2xl bg-gray-50 p-3.5">
                <div className="text-sm font-semibold text-gray-500 line-through">
                  {new Date(s.scheduled_at).toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}
                  {new Date(s.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>
                {s.cancel_reason && (
                  <div className="mt-1 text-xs text-gray-500">{t('Alasan')}: <span className="text-gray-700">{s.cancel_reason}</span></div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {msTerbuka && (
        <SesiDetailDrawer
          no={msTerbuka.no}
          sched={msTerbuka.sched}
          st={statusMilestone(msTerbuka.sched, msTerbuka.sudahJalan)}
          items={itemsFor(msTerbuka.sched, msTerbuka.no)}
          teacherName={teacherName}
          durasi={durasiSesi || msTerbuka.sched?.duration_minutes || null}
          silabus={silabusSesi(msTerbuka.no)}
          onClose={() => setSesiTerbuka(null)}
        />
      )}
    </div>
  );
}
