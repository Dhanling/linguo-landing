'use client';

// [kelas-tab-v1] Tab Materi di detail kelas siswa — satu tempat semua aset kelas:
//   • lampiran pengajar dari class_materials (link doc/slide/YouTube atau file
//     upload, ditambahkan dari dashboard pengajar);
//   • recording tiap sesi (schedules.recording_url) ikut tampil sebagai materi
//     sesi itu, jadi siswa nggak perlu bolak-balik tab.
// Dikelompokkan: "Materi Umum" (tanpa sesi) di atas, lalu per sesi terbaru dulu.
// Kalau tabel class_materials belum dimigrasi, jatuh ke empty state (jangan crash).

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
// (Play, bukan Youtube — versi lucide-react di repo ini tidak meng-export ikon brand)
import { BookOpen, FileText, Presentation, Link2, Paperclip, Video, ExternalLink, Play, type LucideIcon } from 'lucide-react';
import { studentRecordingHref } from '@/lib/classRoom';

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

const KIND_META: Record<string, { label: string; Icon: LucideIcon; cls: string }> = {
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
      className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 transition hover:border-[#16796E]/40 hover:shadow-sm"
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

export default function ClassMateriTab({ reg, schedules, teacherName }: { reg: any; schedules: any[]; teacherName?: string }) {
  const [materials, setMaterials] = useState<any[] | null>(null); // null = loading

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

  // Nomor sesi kronologis (sinkron dgn tab Progress) + recording jadi materi sesi.
  const completedChrono = schedules
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const sessionNo = new Map<string, number>(completedChrono.map((s, i) => [s.id, i + 1]));

  const general = materials.filter((m) => !m.schedule_id);
  const bySchedule = new Map<string, any[]>();
  materials.filter((m) => m.schedule_id).forEach((m) => {
    const arr = bySchedule.get(m.schedule_id) || [];
    arr.push(m);
    bySchedule.set(m.schedule_id, arr);
  });

  // Sesi yang punya materi lampiran ATAU recording — terbaru dulu.
  const sessionGroups = schedules
    .filter((s) => bySchedule.has(s.id) || (s.status === 'completed' && s.recording_url))
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const isEmpty = general.length === 0 && sessionGroups.length === 0;

  if (isEmpty) {
    return (
      <div className="py-14 text-center text-gray-400">
        <BookOpen className="mx-auto mb-2 h-9 w-9" strokeWidth={1.5} />
        <div className="text-sm text-gray-500">Belum ada materi dari pengajar</div>
        <div className="mt-1 text-xs">Materi (dokumen, slide, video, recording) yang dilampirkan pengajar tampil di sini</div>
      </div>
    );
  }

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

      {sessionGroups.map((s) => {
        const no = sessionNo.get(s.id);
        const items = [...(bySchedule.get(s.id) || [])];
        if (s.status === 'completed' && s.recording_url) {
          items.unshift({
            id: `rec-${s.id}`,
            title: 'Recording Sesi',
            kind: 'recording',
            // [kelas-video-rekaman-siswa-v1] Deep link Riwayat dashboard khusus tim →
            // alihkan ke pemutar siswa (lihat lib/classRoom).
            url: studentRecordingHref(s.recording_url),
            created_at: s.scheduled_at,
          });
        }
        return (
          <section key={s.id}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              {no ? `Sesi ${no} — ` : ''}
              {new Date(s.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {items.map((m) => <MaterialCard key={m.id} m={m} teacherName={teacherName} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
