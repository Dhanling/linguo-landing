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

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
// (Play, bukan Youtube — versi lucide-react di repo ini tidak meng-export ikon brand)
import { BookOpen, FileText, Presentation, Link2, Paperclip, Video, ExternalLink, Play, Check, RotateCcw, X, type LucideIcon } from 'lucide-react';
import { studentRecordingHref } from '@/lib/classRoom';
import { publicNotes } from '@/components/akun/class-notes';

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
  youtube: { label: 'YouTube', Icon: Play, cls: 'bg-red-50 text-red-600' },
  doc: { label: 'Dokumen', Icon: FileText, cls: 'bg-blue-50 text-blue-600' },
  slide: { label: 'Slide', Icon: Presentation, cls: 'bg-orange-50 text-orange-600' },
  pdf: { label: 'PDF', Icon: FileText, cls: 'bg-red-50 text-red-600' },
  file: { label: 'File', Icon: Paperclip, cls: 'bg-gray-100 text-gray-600' },
  link: { label: 'Link', Icon: Link2, cls: 'bg-teal-50 text-[#16796E]' },
  recording: { label: 'Recording', Icon: Video, cls: 'bg-purple-50 text-purple-600' },
};

function MaterialCard({ m, teacherName }: { m: any; teacherName?: string }) {
  const kind = m.kind && KIND_META[m.kind] ? m.kind : detectKind(m.url || '');
  const meta = KIND_META[kind] || KIND_META.link;
  const yt = kind === 'youtube' || kind === 'recording' ? youtubeId(m.url || '') : null;
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
          {meta.label}
          {teacherName ? ` · ${teacherName}` : ''}
          {m.created_at ? ` · ${new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}
        </div>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-[#16796E]" strokeWidth={2} />
    </a>
  );
}

// Status satu milestone. `sched` null = slot sesi yang belum dijadwalkan sama sekali.
// [lms-dark-inline-style-gotcha] Warna DIBATASI ke kombinasi yang sudah ditangani
// override .lms-dark di StudentShell (tint -50 + teks -600/-700). Pakai -100/-800
// bikin chip menyala putih di mode gelap karena tidak ada aturannya di sana.
function statusMilestone(sched: any | null) {
  if (!sched) {
    return {
      label: 'Belum dijadwalkan',
      badge: 'bg-gray-100 text-gray-500',
      dot: 'bg-gray-100 text-gray-400',
      done: false,
    };
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

function MilestoneRow({
  no,
  sched,
  items,
  teacherName,
  isLast,
  onReschedule,
  onCancel,
}: {
  no: number;
  sched: any | null;
  items: any[];
  teacherName?: string;
  isLast: boolean;
  onReschedule?: (s: any) => void;
  onCancel?: (s: any) => void;
}) {
  const st = statusMilestone(sched);
  const dt = sched ? new Date(sched.scheduled_at) : null;
  const jamKeSesi = dt ? (dt.getTime() - Date.now()) / 3600_000 : 0;
  const akanDatang = !!sched && ['pending', 'scheduled'].includes(sched.status) && jamKeSesi > 0;
  const catatan = sched ? publicNotes(sched.notes) : '';

  return (
    <li className="relative pl-11">
      {/* Rail milestone — garis penyambung antar sesi */}
      {!isLast && <span aria-hidden className="absolute bottom-0 left-[15px] top-9 w-px bg-gray-200" />}
      <span className={`absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-extrabold ${st.dot}`}>
        {st.done ? <Check className="h-4 w-4" strokeWidth={3} /> : no}
      </span>

      <div className={sched ? 'pb-6' : 'pb-3.5'}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`text-sm font-extrabold ${sched ? 'text-[#12172B]' : 'text-gray-400'}`}>Sesi {no}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.badge}`}>{st.label}</span>
        </div>

        {dt && (
          <div className="mt-0.5 text-xs text-gray-500">
            {dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            {dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            {sched?.duration_minutes ? ` · ${sched.duration_minutes} menit` : ''}
          </div>
        )}

        {/* [kelas-tab-v1] WAJIB publicNotes(): notes bisa bawa catatan PRIBADI pengajar */}
        {catatan && <div className="mt-1.5 whitespace-pre-line text-xs text-gray-500">{catatan}</div>}

        {items.length > 0 && (
          <div className="mt-2.5 grid grid-cols-1 gap-2 md:grid-cols-2">
            {items.map((m) => <MaterialCard key={m.id} m={m} teacherName={teacherName} />)}
          </div>
        )}

        {/* Sesi sudah jalan tapi pengajar belum melampirkan apa pun — dikatakan apa
            adanya, biar siswa tidak mengira materinya gagal dimuat. */}
        {items.length === 0 && sched?.status === 'completed' && (
          <div className="mt-1.5 text-xs text-gray-400">Belum ada materi untuk sesi ini</div>
        )}

        {akanDatang && (onReschedule || onCancel) && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {onReschedule && (
              <button
                onClick={() => onReschedule(sched)}
                disabled={jamKeSesi <= 24}
                title={jamKeSesi <= 24 ? 'Ubah jadwal hanya bisa lebih dari 24 jam sebelum sesi' : ''}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.4} /> Ubah Jadwal
              </button>
            )}
            {onCancel && (
              <button
                onClick={() => onCancel(sched)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.6} /> Batalkan
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function ClassMateriTab({
  reg,
  schedules,
  teacherName,
  onReschedule,
  onCancel,
}: {
  reg: any;
  schedules: any[];
  teacherName?: string;
  onReschedule?: (s: any) => void;
  onCancel?: (s: any) => void;
}) {
  const [materials, setMaterials] = useState<any[] | null>(null); // null = loading
  const [kosongTerbuka, setKosongTerbuka] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from('class_materials')
        .select('id, schedule_id, title, kind, url, note, created_at')
        .eq('registration_id', reg.id)
        .order('created_at', { ascending: false });
      if (!alive) return;
      if (error) {
        // Tabel belum dimigrasi / policy belum ada → tampil kosong, jangan crash.
        console.warn('[kelas-materi] gagal load class_materials:', error.message);
        setMaterials([]);
        return;
      }
      setMaterials(data || []);
    })();
    return () => { alive = false; };
  }, [reg.id]);

  if (materials === null) {
    return <div className="py-10 text-center text-gray-400">Memuat…</div>;
  }

  const general = materials.filter((m) => !m.schedule_id);
  const bySchedule = new Map<string, any[]>();
  materials.filter((m) => m.schedule_id).forEach((m) => {
    const arr = bySchedule.get(m.schedule_id) || [];
    arr.push(m);
    bySchedule.set(m.schedule_id, arr);
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
  const milestones = Array.from({ length: totalSlot }, (_, i) => ({ no: i + 1, sched: slotSched[i] || null }));
  // Paling atas = sesi terakhir, paling bawah = sesi 1.
  const ordered = milestones.slice().reverse();
  // Berapa slot kosong beruntun di paling atas (sesi jauh di depan yang memang
  // belum dijadwalkan) — dilipat kalau lebih dari 2 biar tidak makan satu layar.
  let kosongDepan = 0;
  while (kosongDepan < ordered.length && !ordered[kosongDepan].sched) kosongDepan++;
  const lipatKosong = !kosongTerbuka && kosongDepan > 2 && kosongDepan < ordered.length;

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
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Materi Umum</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {general.map((m) => <MaterialCard key={m.id} m={m} teacherName={teacherName} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          Perjalanan Kelas ({totalSlot} sesi)
        </h2>
        {totalSlot === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <BookOpen className="mx-auto mb-2 h-9 w-9" strokeWidth={1.5} />
            <div className="text-sm text-gray-500">Belum ada sesi di kelas ini</div>
            <div className="mt-1 text-xs">Hubungi admin untuk menjadwalkan sesi pertamamu</div>
          </div>
        ) : (
          <ol className="relative">
            {/* Deretan slot kosong paling atas dilipat. Milestone-nya tetap ada
                (paket 16 sesi tetap 16 baris), cuma tidak sampai mendorong sesi
                yang benar-benar berisi jauh ke bawah layar. */}
            {lipatKosong && (
              <li className="relative pl-11 pb-4">
                <span aria-hidden className="absolute bottom-0 left-[15px] top-9 w-px bg-gray-200" />
                <span className="absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[12px] font-extrabold text-gray-400">
                  {kosongDepan}
                </span>
                <button
                  onClick={() => setKosongTerbuka(true)}
                  className="text-left text-sm font-bold text-gray-400 hover:text-[#16796E]"
                >
                  Sesi {ordered[0].no}–{ordered[kosongDepan - 1].no} belum dijadwalkan
                  <span className="ml-1.5 text-xs font-semibold text-[#16796E]">Tampilkan</span>
                </button>
              </li>
            )}
            {(lipatKosong ? ordered.slice(kosongDepan) : ordered).map((ms, i, arr) => {
              const items = ms.sched ? [...(bySchedule.get(ms.sched.id) || [])] : [];
              if (ms.sched?.status === 'completed' && ms.sched.recording_url) {
                items.unshift({
                  id: `rec-${ms.sched.id}`,
                  title: 'Recording Sesi',
                  kind: 'recording',
                  // [kelas-video-rekaman-siswa-v1] Deep link Riwayat dashboard khusus tim →
                  // alihkan ke pemutar siswa (lihat lib/classRoom).
                  url: studentRecordingHref(ms.sched.recording_url),
                  created_at: ms.sched.scheduled_at,
                });
              }
              return (
                <MilestoneRow
                  key={ms.sched?.id || `slot-${ms.no}`}
                  no={ms.no}
                  sched={ms.sched}
                  items={items}
                  teacherName={teacherName}
                  isLast={i === arr.length - 1}
                  onReschedule={onReschedule}
                  onCancel={onCancel}
                />
              );
            })}
          </ol>
        )}
      </section>

      {dibatalkan.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Sesi Dibatalkan ({dibatalkan.length})</h2>
          <div className="space-y-2">
            {dibatalkan.map((s) => (
              <div key={s.id} className="rounded-2xl bg-gray-50 p-3.5">
                <div className="text-sm font-semibold text-gray-500 line-through">
                  {new Date(s.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}
                  {new Date(s.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>
                {s.cancel_reason && (
                  <div className="mt-1 text-xs text-gray-500">Alasan: <span className="text-gray-700">{s.cancel_reason}</span></div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
