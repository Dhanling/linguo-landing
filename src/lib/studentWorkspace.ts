// [student-workspace-v1] Lapis data "Catatan Saya" — ruang kerja belajar siswa.
//
// Kenapa ada: sampai sekarang yang bisa MENYIMPAN cuma pengajar (class_materials).
// Siswa tak punya tempat menaruh materi/berkas/catatannya sendiri, jadi semua
// nyangkut di chat WhatsApp dan hilang. Tiga tabelnya lihat
// `sql/20260904_student_workspace.sql` (student_notes / student_tasks /
// student_focus_sessions).
//
// Semua fungsi di sini SENGAJA tidak melempar error kalau tabelnya belum ada —
// migrasi dijalankan manual, dan UI harus tampil sebagai empty state, bukan OOPS.

import { supabase } from '@/lib/supabase-client';

export interface NoteAttachment {
  name: string;
  url: string;
  kind: 'file' | 'link' | 'pdf' | 'doc' | 'slide' | 'youtube' | 'image';
  path?: string; // storage path (kalau diunggah, biar bisa dihapus lagi)
}

export interface StudentNote {
  id: string;
  student_id: string;
  registration_id: string | null;
  session_number: number | null;
  title: string | null;
  content: string | null;
  icon: string | null;
  color: string | null;
  tags: string[];
  attachments: NoteAttachment[];
  pinned: boolean;
  shared_with_teacher: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentTask {
  id: string;
  student_id: string;
  registration_id: string | null;
  note_id: string | null;
  title: string;
  detail: string | null;
  due_date: string | null;
  done: boolean;
  done_at: string | null;
  source: 'siswa' | 'pengajar' | string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: string;
  student_id: string;
  registration_id: string | null;
  note_id: string | null;
  label: string | null;
  planned_minutes: number;
  focus_seconds: number;
  completed: boolean;
  started_at: string;
  ended_at: string | null;
}

/** Tabel/kolom belum dimigrasi (PGRST205 = tak dikenal PostgREST, 42P01 = relation not exist). */
export function isTableMissing(err: any): boolean {
  const c = err?.code || '';
  return c === 'PGRST205' || c === '42P01' || /does not exist|schema cache/i.test(err?.message || '');
}

const NOTE_COLS =
  'id, student_id, registration_id, session_number, title, content, icon, color, tags, attachments, pinned, shared_with_teacher, archived_at, created_at, updated_at';
const TASK_COLS =
  'id, student_id, registration_id, note_id, title, detail, due_date, done, done_at, source, order_index, created_at, updated_at';

function rapikanNote(row: any): StudentNote {
  return {
    ...row,
    tags: Array.isArray(row?.tags) ? row.tags : [],
    attachments: Array.isArray(row?.attachments) ? row.attachments : [],
  } as StudentNote;
}

// ── Catatan ────────────────────────────────────────────────────────────────

export async function muatCatatan(studentId: string): Promise<{ notes: StudentNote[]; missing: boolean }> {
  const { data, error } = await supabase
    .from('student_notes')
    .select(NOTE_COLS)
    .eq('student_id', studentId)
    .is('archived_at', null)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) return { notes: [], missing: isTableMissing(error) };
  return { notes: (data || []).map(rapikanNote), missing: false };
}

export async function buatCatatan(
  studentId: string,
  patch: Partial<StudentNote> = {}
): Promise<StudentNote | null> {
  const { data, error } = await supabase
    .from('student_notes')
    .insert({
      student_id: studentId,
      title: patch.title ?? '',
      content: patch.content ?? '',
      registration_id: patch.registration_id ?? null,
      session_number: patch.session_number ?? null,
      icon: patch.icon ?? null,
      color: patch.color ?? null,
      tags: patch.tags ?? [],
      attachments: patch.attachments ?? [],
      pinned: patch.pinned ?? false,
      shared_with_teacher: patch.shared_with_teacher ?? false,
    })
    // .select() WAJIB — tanpa ini insert balik kosong dan UI kira gagal.
    .select(NOTE_COLS)
    .single();
  if (error) { console.warn('[student-workspace] buatCatatan gagal:', error.message); return null; }
  return rapikanNote(data);
}

export async function simpanCatatan(id: string, patch: Partial<StudentNote>): Promise<boolean> {
  const { error } = await supabase.from('student_notes').update(patch).eq('id', id);
  if (error) console.warn('[student-workspace] simpanCatatan gagal:', error.message);
  return !error;
}

export async function hapusCatatan(id: string): Promise<boolean> {
  // Soft delete: catatan siswa tak boleh hilang permanen cuma karena salah klik.
  const { error } = await supabase
    .from('student_notes')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

/** Unggah berkas siswa ke bucket `student-materials` (path: <student_id>/<uuid>-<nama>). */
export async function unggahBerkas(studentId: string, file: File): Promise<NoteAttachment | null> {
  const aman = file.name.replace(/[^\w.\-]+/g, '_').slice(-80);
  const path = `${studentId}/${crypto.randomUUID()}-${aman}`;
  const { error } = await supabase.storage.from('student-materials').upload(path, file, { upsert: false });
  if (error) { console.warn('[student-workspace] unggah gagal:', error.message); return null; }
  const url = supabase.storage.from('student-materials').getPublicUrl(path).data.publicUrl;
  return { name: file.name, url, path, kind: jenisBerkas(file.name) };
}

export async function hapusBerkas(path?: string) {
  if (!path) return;
  await supabase.storage.from('student-materials').remove([path]);
}

/** Tebak jenis lampiran dari nama/URL — dipakai buat ikon & label. */
export function jenisBerkas(nama: string): NoteAttachment['kind'] {
  const n = (nama || '').toLowerCase();
  if (n.includes('youtube.com') || n.includes('youtu.be')) return 'youtube';
  if (n.includes('docs.google.com/presentation') || /\.pptx?$/.test(n)) return 'slide';
  if (n.includes('docs.google.com')) return 'doc';
  if (/\.pdf($|\?)/.test(n)) return 'pdf';
  if (/\.(png|jpe?g|webp|gif|heic)($|\?)/.test(n)) return 'image';
  if (/^https?:\/\//.test(n)) return 'link';
  return 'file';
}

// ── Tugas / PR pribadi ─────────────────────────────────────────────────────

export async function muatTugas(studentId: string): Promise<{ tasks: StudentTask[]; missing: boolean }> {
  const { data, error } = await supabase
    .from('student_tasks')
    .select(TASK_COLS)
    .eq('student_id', studentId)
    .order('done', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) return { tasks: [], missing: isTableMissing(error) };
  return { tasks: (data || []) as StudentTask[], missing: false };
}

export async function buatTugas(studentId: string, patch: Partial<StudentTask>): Promise<StudentTask | null> {
  const { data, error } = await supabase
    .from('student_tasks')
    .insert({
      student_id: studentId,
      title: patch.title || '',
      detail: patch.detail ?? null,
      due_date: patch.due_date ?? null,
      registration_id: patch.registration_id ?? null,
      note_id: patch.note_id ?? null,
      source: patch.source ?? 'siswa',
    })
    .select(TASK_COLS)
    .single();
  if (error) { console.warn('[student-workspace] buatTugas gagal:', error.message); return null; }
  return data as StudentTask;
}

export async function ubahTugas(id: string, patch: Partial<StudentTask>): Promise<boolean> {
  const isi: any = { ...patch };
  if (typeof patch.done === 'boolean') isi.done_at = patch.done ? new Date().toISOString() : null;
  const { error } = await supabase.from('student_tasks').update(isi).eq('id', id);
  return !error;
}

export async function hapusTugas(id: string): Promise<boolean> {
  const { error } = await supabase.from('student_tasks').delete().eq('id', id);
  return !error;
}

// ── Pomodoro / Mode Belajar Sendiri ────────────────────────────────────────

export async function catatSesiFokus(
  studentId: string,
  isi: { planned_minutes: number; focus_seconds: number; completed: boolean; label?: string | null; registration_id?: string | null; note_id?: string | null; started_at?: string }
): Promise<boolean> {
  const { error } = await supabase.from('student_focus_sessions').insert({
    student_id: studentId,
    planned_minutes: isi.planned_minutes,
    focus_seconds: Math.max(0, Math.round(isi.focus_seconds)),
    completed: isi.completed,
    label: isi.label ?? null,
    registration_id: isi.registration_id ?? null,
    note_id: isi.note_id ?? null,
    started_at: isi.started_at || new Date().toISOString(),
    ended_at: new Date().toISOString(),
  });
  if (error) console.warn('[student-workspace] catatSesiFokus gagal:', error.message);
  return !error;
}

export interface StatFokus {
  menitHariIni: number;
  menit7Hari: number;
  sesiSelesai: number;
  runtunHari: number; // berapa hari beruntun ada sesi fokus (termasuk hari ini)
  riwayat: FocusSession[];
}

export async function muatStatFokus(studentId: string): Promise<StatFokus> {
  const kosong: StatFokus = { menitHariIni: 0, menit7Hari: 0, sesiSelesai: 0, runtunHari: 0, riwayat: [] };
  const sejak = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data, error } = await supabase
    .from('student_focus_sessions')
    .select('id, student_id, registration_id, note_id, label, planned_minutes, focus_seconds, completed, started_at, ended_at')
    .eq('student_id', studentId)
    .gte('started_at', sejak)
    .order('started_at', { ascending: false })
    .limit(200);
  if (error || !data) return kosong;

  const rows = data as FocusSession[];
  const hariKunci = (iso: string) => new Date(iso).toLocaleDateString('sv-SE'); // YYYY-MM-DD lokal
  const hariIni = hariKunci(new Date().toISOString());
  const batas7 = Date.now() - 7 * 864e5;

  let menitHariIni = 0;
  let menit7Hari = 0;
  let sesiSelesai = 0;
  const hariAda = new Set<string>();
  for (const r of rows) {
    const menit = (r.focus_seconds || 0) / 60;
    const k = hariKunci(r.started_at);
    hariAda.add(k);
    if (k === hariIni) menitHariIni += menit;
    if (+new Date(r.started_at) >= batas7) menit7Hari += menit;
    if (r.completed) sesiSelesai += 1;
  }

  // Runtun: mundur dari hari ini selama harinya ada di daftar. Kalau hari ini belum
  // ada sesi, runtun dihitung dari KEMARIN supaya tidak langsung nol pagi-pagi.
  let runtun = 0;
  const mulai = hariAda.has(hariIni) ? 0 : 1;
  for (let i = mulai; i < 60; i++) {
    const k = hariKunci(new Date(Date.now() - i * 864e5).toISOString());
    if (hariAda.has(k)) runtun++;
    else break;
  }

  return {
    menitHariIni: Math.round(menitHariIni),
    menit7Hari: Math.round(menit7Hari),
    sesiSelesai,
    runtunHari: runtun,
    riwayat: rows.slice(0, 20),
  };
}

// ── Markdown ringan (blok ala Notion) ──────────────────────────────────────
// Repo ini tidak punya react-markdown; catatan ini juga input SISWA SENDIRI, jadi
// pemformat kecil ini cukup — dan tetap tanpa dangerouslySetInnerHTML.

export type Blok =
  | { t: 'h1' | 'h2' | 'h3' | 'p' | 'quote' | 'code'; teks: string; baris: number }
  | { t: 'ul' | 'ol'; teks: string; baris: number; no?: number }
  | { t: 'todo'; teks: string; baris: number; selesai: boolean }
  | { t: 'divider'; teks: ''; baris: number };

export function parseBlok(md: string): Blok[] {
  const out: Blok[] = [];
  const lines = (md || '').split('\n');
  lines.forEach((raw, i) => {
    const line = raw.replace(/\s+$/, '');
    const s = line.trim();
    if (!s) return;
    if (/^---+$/.test(s)) return out.push({ t: 'divider', teks: '', baris: i });
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^###\s+(.*)$/))) return out.push({ t: 'h3', teks: m[1], baris: i });
    if ((m = s.match(/^##\s+(.*)$/))) return out.push({ t: 'h2', teks: m[1], baris: i });
    if ((m = s.match(/^#\s+(.*)$/))) return out.push({ t: 'h1', teks: m[1], baris: i });
    if ((m = s.match(/^[-*]\s+\[( |x|X)\]\s*(.*)$/)))
      return out.push({ t: 'todo', teks: m[2], baris: i, selesai: m[1].toLowerCase() === 'x' });
    if ((m = s.match(/^[-*]\s+(.*)$/))) return out.push({ t: 'ul', teks: m[1], baris: i });
    if ((m = s.match(/^(\d+)\.\s+(.*)$/))) return out.push({ t: 'ol', teks: m[2], baris: i, no: Number(m[1]) });
    if ((m = s.match(/^>\s?(.*)$/))) return out.push({ t: 'quote', teks: m[1], baris: i });
    out.push({ t: 'p', teks: s, baris: i });
  });
  return out;
}

/** Centang/lepas satu baris checklist di dalam markdown (dipakai pratinjau interaktif). */
export function toggleChecklist(md: string, baris: number): string {
  const lines = (md || '').split('\n');
  const l = lines[baris];
  if (l == null) return md;
  if (/\[\s\]/.test(l)) lines[baris] = l.replace('[ ]', '[x]');
  else if (/\[[xX]\]/.test(l)) lines[baris] = l.replace(/\[[xX]\]/, '[ ]');
  return lines.join('\n');
}

/** Ringkasan satu baris untuk kartu daftar catatan. */
export function cuplikan(md: string, panjang = 90): string {
  const teks = (md || '')
    .split('\n')
    .map((l) => l.replace(/^[#>\-*\d.]+\s*(\[[ xX]\])?\s*/, '').trim())
    .filter(Boolean)
    .join(' · ');
  return teks.length > panjang ? teks.slice(0, panjang) + '…' : teks;
}
