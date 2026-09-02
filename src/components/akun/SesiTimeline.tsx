'use client';

// [materi-sesi-timeline-v1] Linimasa sesi buat panel "Kelas & Materi" di /akun.
//
// Sebelum ini tab "Sesi & Rekaman" cuma memuat sesi MENDATANG, jadi kelas yang
// sudah 16/16 tampil kosong total ("belum ada sesi mendatang") padahal seluruh
// riwayat & rekamannya ada. Tab "Materi" pun cuma silabus level — tak ada jalan
// ke materi yang benar-benar dipakai di sesi tertentu.
//
// Sekarang dua-duanya memakai satu daftar sesi ber-nomor: bilah progres di atas,
// lalu sesi TERBARU di paling atas, tiap sesi punya node bernomor di rel kiri.
//   • variant "sesi"   → fokus jadwal + tombol rekaman;
//   • variant "materi" → fokus lampiran: rekaman, berkas/link dari jadwal
//     (schedules.material_links), dan lampiran pengajar (class_materials).
// Kalau tabel class_materials belum dimigrasi, jatuh ke daftar tanpa lampiran —
// jangan crash.

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Calendar, Clock, Video, BookOpen, ExternalLink, Play } from 'lucide-react';
import { studentRecordingHref, isInternalRecordingHref, isPlayableRecording } from '@/lib/classRoom';
import RecordingModal from './RecordingModal';
import { detectKind, KIND_META, TeksMateriOverlay } from './ClassMateriTab';
// [materi-slide-v1] Materi tanpa url (dek slide / teks AI) dibuka di tempat,
// bukan sebagai tautan — lihat ItemRow.
import { parseDeck } from '@/lib/materiSlides';
import { SlideDeckViewer } from '@/components/akun/SlideDeckViewer';
import { getUiLang, tr, useT } from '@/lib/uiLang'; // [ui-lang-switcher-v1]

export type TimelineSchedule = {
  id: string;
  registration_id: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  status?: string | null;
  session_number?: number | null;
  session_title?: string | null;
  material_notes?: string | null;
  material_links?: { name: string; url: string; kind: 'file' | 'link' }[] | null;
  attendance_status?: string | null;
  recording_url?: string | null;
};

type Item = { id: string; title: string; kind?: string; url: string; note?: string | null; content?: string | null };

/** Chip status sesi. Sengaja pakai class Tailwind (bukan hex inline) — warna inline
 *  lolos dari override mode gelap dan berakhir putih di atas putih. */
function statusChip(s: TimelineSchedule, past: boolean) {
  if (s.status === 'cancelled') return { label: 'Dibatalkan', cls: 'bg-gray-100 text-gray-500' };
  if (s.status === 'hangus') return { label: 'Hangus', cls: 'bg-red-50 text-red-600' };
  const att = (s.attendance_status || '').toLowerCase();
  if (att === 'hadir') return { label: 'Hadir', cls: 'bg-emerald-50 text-emerald-700' };
  if (att === 'izin') return { label: 'Izin', cls: 'bg-amber-50 text-amber-700' };
  if (att === 'sakit') return { label: 'Sakit', cls: 'bg-blue-50 text-blue-600' };
  if (att === 'alpa') return { label: 'Alpa', cls: 'bg-red-50 text-red-600' };
  if (s.status === 'completed') return { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700' };
  if (past) return { label: 'Sudah lewat', cls: 'bg-gray-100 text-gray-500' };
  return { label: 'Mendatang', cls: 'bg-[#16796E]/10 text-[#16796E]' };
}

const fmtTanggal = (d: Date) => d.toLocaleDateString(getUiLang() === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtJam = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

function ItemRow({ it }: { it: Item }) {
  const kind = it.kind && KIND_META[it.kind] ? it.kind : detectKind(it.url || '');
  const meta = KIND_META[kind] || KIND_META.link;
  const internal = isInternalRecordingHref(it.url || '');
  const [buka, setBuka] = useState(false);
  // [vc-recmodal-v2] Baris rekaman ikut jadi pop-up — sebelumnya dia satu-satunya
  // lampiran yang menendang siswa keluar dari daftar materi yang sedang dibaca.
  const [rekaman, setRekaman] = useState(false);

  const isi = (
    <>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.cls}`}>
        <meta.Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[13px] font-bold text-[#12172B]">{it.title}</span>
        <span className="block truncate text-[11px] font-medium text-gray-500">{it.note || meta.label}</span>
      </span>
    </>
  );
  const kelas = 'group flex w-full items-center gap-2.5 rounded-xl bg-[#F5F6F8] px-3 py-2.5 transition hover:bg-[#E8EAEE]';

  /* [materi-slide-v1] Materi tanpa url dibuka DI TEMPAT. Dek slide jadi
     slideshow, materi teks jadi overlay baca. Sebelum ini keduanya dirender
     sebagai tautan href="#" — terlihat bisa diklik, tapi tidak ke mana-mana. */
  if (internal || (kind === 'recording' && isPlayableRecording(it.url || ''))) {
    return (
      <>
        <button type="button" onClick={() => setRekaman(true)} className={kelas}>
          {isi}
          <Play className="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-[#16796E]" strokeWidth={2.2} />
        </button>
        {rekaman && (
          <RecordingModal recordingUrl={it.url} title={it.title} onClose={() => setRekaman(false)} />
        )}
      </>
    );
  }

  const dek = parseDeck(it.content);
  if (dek || (!it.url && it.content)) {
    return (
      <>
        <button type="button" onClick={() => setBuka(true)} className={kelas}>
          {isi}
          <Play className="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-[#16796E]" strokeWidth={2.2} />
        </button>
        {buka && (dek
          ? <SlideDeckViewer slides={dek.slides} title={it.title} onClose={() => setBuka(false)} />
          : <TeksMateriOverlay m={it} onClose={() => setBuka(false)} />)}
      </>
    );
  }

  return (
    <a
      href={it.url || '#'}
      target={internal ? undefined : '_blank'}
      rel={internal ? undefined : 'noreferrer'}
      className={kelas}
    >
      {isi}
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-[#16796E]" strokeWidth={2.2} />
    </a>
  );
}

export default function SesiTimeline({
  reg,
  schedules,
  variant,
}: {
  reg: any;
  schedules: TimelineSchedule[];
  variant: 'sesi' | 'materi';
}) {
  const t = useT(); // [ui-lang-switcher-v1]
  // [vc-recmodal-v1] Rekaman yang sedang ditonton di pop-up halaman ini.
  const [rekaman, setRekaman] = useState<{ url: string; title: string } | null>(null);
  // Lampiran pengajar cuma dibutuhkan di tab Materi — jangan query di tab Sesi.
  const [materials, setMaterials] = useState<any[] | null>(variant === 'materi' ? null : []);
  useEffect(() => {
    if (variant !== 'materi') { setMaterials([]); return; }
    let alive = true;
    setMaterials(null);
    (async () => {
      const { data, error } = await supabase
        .from('class_materials')
        .select('id, schedule_id, title, kind, url, note, content, created_at')
        .eq('registration_id', reg.id)
        .order('created_at', { ascending: false });
      if (!alive) return;
      if (error) {
        // Tabel belum dimigrasi / policy belum ada → daftar sesi tetap tampil.
        console.warn('[materi-sesi-timeline] gagal load class_materials:', error.message);
        setMaterials([]);
        return;
      }
      setMaterials(data || []);
    })();
    return () => { alive = false; };
  }, [reg.id, variant]);

  // [materi-sesi-semua-kelas-v1] Kelas terdahulu (paket habis sebelum penjadwalan
  // masuk aplikasi) sering TAK punya satu pun baris `schedules` — sesinya cuma
  // tercatat sebagai angka di `sessions_used`. Kalau linimasa hanya menggambar
  // baris `schedules`, kelas-kelas itu tampil kosong total padahal 16 sesinya
  // benar-benar sudah jalan. Jadi slot paket yang tak punya baris jadwal tetap
  // digambar sebagai sesi "tanpa catatan jadwal": nomornya nyata (dari paket),
  // tanggalnya TIDAK dikarang.
  //   • slot terpakai (sessions_used) ditaruh SEBELUM baris jadwal nyata — sesi
  //     tak tercatat itu yang lebih dulu jalan, jadwal aplikasi menyusul;
  //   • sisa slot paket ditaruh sesudahnya sebagai "belum terjadwal".
  const rows = useMemo(() => {
    const asc = schedules.slice().sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    const totalPaket = Number(reg?.sessions_total) || 0;
    const dipakai = Number(reg?.sessions_used) || 0;
    const selesaiNyata = asc.filter((s) => s.status === 'completed').length;
    const kurang = Math.max(0, totalPaket - asc.length);
    const semuSelesai = Math.max(0, Math.min(dipakai - selesaiNyata, kurang));
    const semuBelum = kurang - semuSelesai;

    // Nomor sesi: pakai session_number cuma kalau SEMUA baris punya & tak ada slot
    // semu — campur session_number & urutan kronologis gampang bikin nomor kembar.
    const semuaBernomor = asc.length > 0 && kurang === 0 && asc.every((s) => Number.isFinite(Number(s.session_number)));

    type Row = { key: string; no: number; s: TimelineSchedule | null; jenis: 'nyata' | 'selesai-semu' | 'belum-semu' };
    const urut: Row[] = [
      ...Array.from({ length: semuSelesai }, (_, i) => ({ key: `semu-done-${i}`, no: 0, s: null, jenis: 'selesai-semu' as const })),
      ...asc.map((s, i) => ({ key: s.id, no: semuaBernomor ? Number(s.session_number) : 0, s, jenis: 'nyata' as const })),
      ...Array.from({ length: semuBelum }, (_, i) => ({ key: `semu-todo-${i}`, no: 0, s: null, jenis: 'belum-semu' as const })),
    ];
    return urut.map((r, i) => ({ ...r, no: r.no || i + 1 })).reverse(); // terbaru di paling atas
  }, [schedules, reg?.sessions_total, reg?.sessions_used]);

  const now = Date.now();
  const total = reg?.sessions_total || rows.length || 0;
  // [sesi-turun-presensi-tercatat] angka sesi = yang terbesar antara catatan paket
  // dan presensi yang benar-benar tercatat, biar tak pernah mundur dari kenyataan.
  const selesai = Math.min(
    total || rows.length,
    Math.max(reg?.sessions_used || 0, rows.filter(({ s }) => s?.status === 'completed').length),
  );
  const pct = total > 0 ? Math.min(100, Math.round((selesai / total) * 100)) : 0;
  const durasiMenit = String(reg?.duration ?? '').match(/\d+/)?.[0] || '';

  const general = (materials || []).filter((m) => !m.schedule_id);
  const bySchedule = new Map<string, any[]>();
  (materials || []).filter((m) => m.schedule_id).forEach((m) => {
    const arr = bySchedule.get(m.schedule_id) || [];
    arr.push(m);
    bySchedule.set(m.schedule_id, arr);
  });

  const itemsOf = (s: TimelineSchedule): Item[] => {
    const out: Item[] = [];
    if (s.recording_url) {
      out.push({
        id: `rec-${s.id}`,
        title: tr('Rekaman sesi'),
        kind: 'recording',
        // [kelas-video-rekaman-siswa-v1] deep link dashboard → pemutar siswa
        url: studentRecordingHref(s.recording_url),
        note: 'Recording',
      });
    }
    (bySchedule.get(s.id) || []).forEach((m) => out.push({ id: m.id, title: m.title, kind: m.kind, url: m.url, note: m.note, content: m.content }));
    (Array.isArray(s.material_links) ? s.material_links : []).forEach((l, i) =>
      out.push({ id: `ml-${s.id}-${i}`, title: l?.name || tr('Lampiran'), kind: l?.kind === 'file' ? 'file' : undefined, url: l?.url || '#' }),
    );
    return out;
  };

  const totalRekaman = rows.filter(({ s }) => !!s?.recording_url).length;
  const totalLampiran = rows.reduce((n, { s }) => n + (s ? (bySchedule.get(s.id)?.length || 0) + (Array.isArray(s.material_links) ? s.material_links.length : 0) : 0), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* indeks progres sesi */}
      <div className="materi-panel rounded-2xl bg-white px-4 py-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[13px] font-extrabold text-[#12172B]">
            {t('Sesi')} {selesai} {t('dari')} {total || rows.length}
          </p>
          <p className="text-[12px] font-semibold text-gray-500">
            {durasiMenit ? `${durasiMenit} ${t('menit/sesi')} · ` : ''}
            {variant === 'materi' ? `${totalRekaman} ${t('rekaman')} · ${totalLampiran} ${t('lampiran')}` : `${pct}% ${t('selesai')}`}
          </p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E8EAEE]">
          <div className="h-full rounded-full bg-[#16796E] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* [kelas-materi] lampiran yang tidak terikat sesi mana pun */}
      {variant === 'materi' && general.length > 0 && (
        <div className="materi-panel rounded-2xl bg-white p-4">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">{t('Materi Umum')}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {general.map((m) => <ItemRow key={m.id} it={{ id: m.id, title: m.title, kind: m.kind, url: m.url, note: m.note, content: m.content }} />)}
          </div>
        </div>
      )}

      {/* Kelas lawas kadang tak punya baris `schedules` sama sekali (sesinya cuma
          tercatat di sessions_used) — bilah indeks di atas tetap berguna, jadi
          empty state-nya taruh di bawahnya, bukan menggantikan seluruh tab. */}
      {rows.length === 0 ? (
        <div className="materi-flat rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-300" strokeWidth={1.6} />
          <p className="text-[13px] font-semibold text-gray-500">{t('Belum ada sesi terjadwal')}</p>
          <p className="mt-1 text-[12px] font-medium text-gray-400">{t('Riwayat sesi, materi & rekaman akan tampil di sini')}</p>
        </div>
      ) : variant === 'materi' && materials === null ? (
        <p className="py-8 text-center text-[13px] font-medium text-gray-400">{t('Memuat materi…')}</p>
      ) : (
        <ol className="flex flex-col">
          {rows.map(({ s, no, key, jenis }, i) => {
            const d = s ? new Date(s.scheduled_at) : null;
            const past = !!d && d.getTime() < now;
            const chip = s
              ? statusChip(s, past)
              : jenis === 'selesai-semu'
                ? { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700' }
                : { label: 'Belum terjadwal', cls: 'bg-gray-100 text-gray-500' };
            const done = s
              ? s.status === 'completed' || (past && s.status !== 'cancelled' && s.status !== 'hangus')
              : jenis === 'selesai-semu';
            const items = variant === 'materi' && s ? itemsOf(s) : [];
            // di tab Sesi rekaman sudah punya tombol sendiri — chip ini cuma buat lampiran
            const jumlahMateri = Array.isArray(s?.material_links) ? s!.material_links!.length : 0;
            return (
              <li key={key} className="flex gap-3">
                {/* rel bernomor */}
                <div className="flex w-9 shrink-0 flex-col items-center">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold tabular-nums ${
                      done ? 'bg-[#16796E] text-white' : 'bg-[#F5F6F8] text-[#12172B]'
                    }`}
                  >
                    {String(no).padStart(2, '0')}
                  </span>
                  {i < rows.length - 1 && <span className="w-px flex-1 bg-[#E8EAEE]" aria-hidden />}
                </div>

                <div className="min-w-0 flex-1 pb-3">
                  <div className="materi-panel rounded-2xl bg-white p-4 transition">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-extrabold text-[#12172B]">{t('Sesi')} {no}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chip.cls}`}>{t(chip.label)}</span>
                      {variant === 'sesi' && jumlahMateri > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F6F8] px-2 py-0.5 text-[11px] font-bold text-gray-500">
                          <BookOpen className="h-3 w-3" strokeWidth={2.4} />{jumlahMateri} {t('materi')}
                        </span>
                      )}
                    </div>
                    {s?.session_title && (
                      <p className="mt-1 truncate text-[13px] font-bold text-[#12172B]">{s.session_title}</p>
                    )}
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-gray-500">
                      {d ? (
                        <>
                          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmtTanggal(d)} · {fmtJam(d)}</span>
                          {/* [durasi-paket-v1] Durasi paket menang atas duration_minutes
                              baris jadwal (baris lama bisa menyimpan 45 di kelas 60). */}
                          {(Number(reg?.duration) || s?.duration_minutes) ? <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{Number(reg?.duration) || s?.duration_minutes} {t('menit')}</span> : null}
                        </>
                      ) : (
                        /* Tanggalnya memang tak ada di data — jangan dikarang. */
                        <span className="inline-flex items-center gap-1.5 text-gray-400">
                          <Calendar className="h-3.5 w-3.5" />
                          {jenis === 'selesai-semu' ? t('Tanggal sesi tak tercatat di aplikasi') : t('Jadwal belum ditentukan')}
                        </span>
                      )}
                    </p>

                    {variant === 'materi' && s?.material_notes && (
                      <p className="mt-2 whitespace-pre-line rounded-xl bg-[#F5F6F8] px-3 py-2 text-[12px] font-medium text-gray-600">{s.material_notes}</p>
                    )}

                    {variant === 'materi' && (
                      items.length > 0 ? (
                        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {items.map((it) => <ItemRow key={it.id} it={it} />)}
                        </div>
                      ) : (
                        <p className="mt-2 text-[12px] font-medium text-gray-400">{t('Belum ada materi untuk sesi ini')}</p>
                      )
                    )}

                    {variant === 'sesi' && s?.recording_url && (() => {
                      const href = studentRecordingHref(s.recording_url!);
                      // [vc-recmodal-v1] Rekaman kita sendiri dibuka sebagai
                      // pop-up di halaman ini; tautan luar tetap ke tab baru.
                      if (isPlayableRecording(s.recording_url!)) {
                        return (
                          <button
                            type="button"
                            onClick={() => setRekaman({ url: s.recording_url!, title: `${t('Rekaman')} — ${t('Sesi')} ${no}` })}
                            className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#16796E] px-3 text-[12px] font-bold text-white transition hover:bg-[#0F5A52]"
                          >
                            <Video className="h-3.5 w-3.5" strokeWidth={2.5} />{t('Tonton rekaman')}
                          </button>
                        );
                      }
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#16796E] px-3 text-[12px] font-bold text-white transition hover:bg-[#0F5A52]"
                        >
                          <Video className="h-3.5 w-3.5" strokeWidth={2.5} />{t('Tonton rekaman')}
                        </a>
                      );
                    })()}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {rekaman && (
        <RecordingModal recordingUrl={rekaman.url} title={rekaman.title} onClose={() => setRekaman(null)} />
      )}
    </div>
  );
}
