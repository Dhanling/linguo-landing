'use client';

// [student-workspace-v1] "Catatan Saya" — ruang kerja belajar siswa ala Notion.
//
// Permintaan aslinya (chat siswa, 4 Sep 2026): "kalau kami siswa bisa juga?
// kayak nambah materi / note / catata file / PR kami?". Sampai sekarang yang
// punya tempat menyimpan cuma pengajar (class_materials) — punya siswa hilang di
// chat WhatsApp. Di sini siswa punya kanvasnya sendiri:
//   • catatan teks (markdown ringan: judul, poin, kutipan, checklist)
//   • lampiran: unggah berkas sendiri atau tempel link (Drive/YouTube/artikel)
//   • daftar tugas/PR pribadi, lengkap dengan tenggat
//   • tombol "Mode Belajar Sendiri" (Pomodoro) — lihat FokusMode.tsx
//
// Catatan bersifat PRIVAT. Kalau siswa mau pengajarnya ikut baca, ada sakelar
// "Bagikan ke pengajar" per catatan (butuh catatan itu tertaut ke satu kelas —
// pengajar dijaga RLS lewat registrations.teacher_id).
//
// Semua tampilan degrade anggun kalau `sql/20260904_student_workspace.sql` belum
// dijalankan: muncul pemberitahuan, bukan OOPS.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NotebookPen, Plus, Search, Pin, PinOff, Trash2, Paperclip, Link2, FileText, Image as ImageIcon,
  Presentation, Play, Loader2, Check, Share2, Eye, PenLine, Brain, ListTodo, CalendarClock,
  X, Heading1, Heading2, List, ListChecks, Quote, Minus, GraduationCap, Cloud, ChevronLeft, Sparkles,
} from 'lucide-react';
import {
  muatCatatan, buatCatatan, simpanCatatan, hapusCatatan, unggahBerkas, hapusBerkas, jenisBerkas,
  muatTugas, buatTugas, ubahTugas, hapusTugas, parseBlok, toggleChecklist, cuplikan,
  type StudentNote, type StudentTask, type NoteAttachment,
} from '@/lib/studentWorkspace';
import { useT } from '@/lib/uiLang';
import FokusMode from '@/components/akun/FokusMode';

const TEAL = '#16796E';

const IKON_LAMPIRAN: Record<string, any> = {
  youtube: Play, slide: Presentation, doc: FileText, pdf: FileText, image: ImageIcon, link: Link2, file: Paperclip,
};

const fmtTgl = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '';

function judulKelas(reg: any): string {
  if (!reg) return '';
  return [reg.language, reg.level].filter(Boolean).join(' · ');
}

// ── Pratinjau markdown ringan (blok ala Notion) ─────────────────────────────
function Pratinjau({ md, onToggle }: { md: string; onToggle: (baris: number) => void }) {
  const blok = parseBlok(md);
  if (!blok.length) return null;
  const tebal = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="font-bold">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
  return (
    <div className="space-y-1.5 text-[14.5px] leading-relaxed text-gray-700">
      {blok.map((b, i) => {
        if (b.t === 'divider') return <hr key={i} className="my-3 border-gray-200" />;
        if (b.t === 'h1') return <h2 key={i} className="pt-2 text-[21px] font-bold text-gray-900">{tebal(b.teks)}</h2>;
        if (b.t === 'h2') return <h3 key={i} className="pt-1.5 text-[17.5px] font-bold text-gray-900">{tebal(b.teks)}</h3>;
        if (b.t === 'h3') return <h4 key={i} className="pt-1 text-[15px] font-bold text-gray-800">{tebal(b.teks)}</h4>;
        if (b.t === 'quote')
          return <blockquote key={i} className="border-l-[3px] border-teal-300 pl-3 italic text-gray-600">{tebal(b.teks)}</blockquote>;
        if (b.t === 'todo')
          return (
            <button key={i} onClick={() => onToggle(b.baris)} className="flex w-full items-start gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-gray-50">
              <span className={`mt-[3px] flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[5px] border-2 ${b.selesai ? 'border-[#16796E] bg-[#16796E]' : 'border-gray-300'}`}>
                {b.selesai && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
              </span>
              <span className={b.selesai ? 'text-gray-400 line-through' : ''}>{tebal(b.teks)}</span>
            </button>
          );
        if (b.t === 'ul')
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-gray-400" />
              <span>{tebal(b.teks)}</span>
            </div>
          );
        if (b.t === 'ol')
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="shrink-0 font-semibold text-gray-400">{b.no}.</span>
              <span>{tebal(b.teks)}</span>
            </div>
          );
        return <p key={i}>{tebal(b.teks)}</p>;
      })}
    </div>
  );
}

export default function CatatanWorkspace({
  studentId,
  regs = [],
  regId = null,
  embedded = false,
}: {
  studentId: string;
  /** Kelas siswa — dipakai buat menautkan catatan ke kelas & chip filter. */
  regs?: any[];
  /** Dipakai waktu komponen ini jadi tab di dalam satu kelas: kunci ke kelas itu. */
  regId?: string | null;
  embedded?: boolean;
}) {
  const t = useT();
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [belumMigrasi, setBelumMigrasi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState<string | null>(null);
  const [cari, setCari] = useState('');
  const [filterReg, setFilterReg] = useState<string | 'all'>(regId || 'all');
  const [sisi, setSisi] = useState<'catatan' | 'tugas'>('catatan');
  const [mode, setMode] = useState<'tulis' | 'baca'>('baca');
  const [fokusBuka, setFokusBuka] = useState(false);
  const [mobileEditor, setMobileEditor] = useState(false);

  // draft editor (dipisah dari `notes` supaya mengetik tidak menunggu server)
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [status, setStatus] = useState<'' | 'menyimpan' | 'tersimpan'>('');
  const [unggah, setUnggah] = useState(false);
  const [linkBaru, setLinkBaru] = useState('');
  const [bukaLink, setBukaLink] = useState(false);
  const [tugasBaru, setTugasBaru] = useState('');
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const simpanTimer = useRef<any>(null);

  const sel = useMemo(() => notes.find((n) => n.id === selId) || null, [notes, selId]);

  const muat = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    const [a, b] = await Promise.all([muatCatatan(studentId), muatTugas(studentId)]);
    setNotes(a.notes);
    setTasks(b.tasks);
    setBelumMigrasi(a.missing || b.missing);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { muat(); }, [muat]);

  const muatUlangTugas = useCallback(async () => {
    const b = await muatTugas(studentId);
    setTasks(b.tasks);
  }, [studentId]);

  // Pilih catatan → isi draft.
  useEffect(() => {
    if (!sel) { setJudul(''); setIsi(''); return; }
    setJudul(sel.title || '');
    setIsi(sel.content || '');
    setMode(sel.content ? 'baca' : 'tulis');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId]);

  /** Simpan otomatis 700 ms setelah berhenti mengetik. Tidak ada tombol "Simpan":
   *  catatan yang hilang karena lupa menekan tombol persis masalah yang mau dibereskan. */
  useEffect(() => {
    if (!sel) return;
    if (judul === (sel.title || '') && isi === (sel.content || '')) return;
    setStatus('menyimpan');
    clearTimeout(simpanTimer.current);
    simpanTimer.current = setTimeout(async () => {
      const ok = await simpanCatatan(sel.id, { title: judul, content: isi });
      if (ok) {
        setNotes((prev) => prev.map((n) => (n.id === sel.id ? { ...n, title: judul, content: isi, updated_at: new Date().toISOString() } : n)));
        setStatus('tersimpan');
        setTimeout(() => setStatus(''), 1600);
      } else setStatus('');
    }, 700);
    return () => clearTimeout(simpanTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [judul, isi]);

  async function tambahCatatan() {
    const target = regId || (filterReg !== 'all' ? filterReg : null);
    const n = await buatCatatan(studentId, { title: '', content: '', registration_id: target });
    if (!n) { setBelumMigrasi(true); return; }
    setNotes((prev) => [n, ...prev]);
    setSelId(n.id);
    setMode('tulis');
    setMobileEditor(true);
    setTimeout(() => areaRef.current?.focus(), 60);
  }

  async function tempelPerubahan(id: string, patch: Partial<StudentNote>) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } as StudentNote : n)));
    await simpanCatatan(id, patch);
  }

  async function buang(n: StudentNote) {
    if (!confirm(t('Hapus catatan ini?'))) return;
    await hapusCatatan(n.id);
    setNotes((prev) => prev.filter((x) => x.id !== n.id));
    if (selId === n.id) setSelId(null);
  }

  /** Sisipkan awalan blok di baris tempat kursor berada (toolbar ala Notion). */
  function sisip(awalan: string) {
    const el = areaRef.current;
    if (!el) { setIsi((v) => v + (v.endsWith('\n') || !v ? '' : '\n') + awalan); return; }
    const pos = el.selectionStart;
    const teks = isi;
    const awalBaris = teks.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
    const next = teks.slice(0, awalBaris) + awalan + teks.slice(awalBaris);
    setIsi(next);
    setMode('tulis');
    requestAnimationFrame(() => {
      el.focus();
      const p = pos + awalan.length;
      el.setSelectionRange(p, p);
    });
  }

  async function pilihBerkas(files: FileList | null) {
    if (!files?.length || !sel) return;
    setUnggah(true);
    const baru: NoteAttachment[] = [];
    for (const f of Array.from(files).slice(0, 5)) {
      if (f.size > 25 * 1024 * 1024) { alert(t('Ukuran berkas maksimal 25 MB.')); continue; }
      const a = await unggahBerkas(studentId, f);
      if (a) baru.push(a);
    }
    if (baru.length) await tempelPerubahan(sel.id, { attachments: [...(sel.attachments || []), ...baru] });
    setUnggah(false);
  }

  async function tambahLink() {
    const url = linkBaru.trim();
    if (!url || !sel) return;
    const rapi = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const a: NoteAttachment = { name: rapi.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60), url: rapi, kind: jenisBerkas(rapi) };
    setLinkBaru('');
    setBukaLink(false);
    await tempelPerubahan(sel.id, { attachments: [...(sel.attachments || []), a] });
  }

  async function copotLampiran(i: number) {
    if (!sel) return;
    const a = sel.attachments[i];
    const sisa = sel.attachments.filter((_, idx) => idx !== i);
    await tempelPerubahan(sel.id, { attachments: sisa });
    hapusBerkas(a?.path);
  }

  const terfilter = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return notes.filter((n) => {
      if (regId && n.registration_id !== regId) return false;
      if (!regId && filterReg !== 'all' && n.registration_id !== filterReg) return false;
      if (!q) return true;
      return `${n.title || ''} ${n.content || ''}`.toLowerCase().includes(q);
    });
  }, [notes, cari, filterReg, regId]);

  const tugasTampil = useMemo(
    () => tasks.filter((x) => (regId ? x.registration_id === regId : filterReg === 'all' || x.registration_id === filterReg)),
    [tasks, filterReg, regId]
  );
  const tugasBelum = tugasTampil.filter((x) => !x.done);

  const regById = useMemo(() => Object.fromEntries((regs || []).map((r: any) => [r.id, r])), [regs]);

  if (!studentId) return null;

  // ── Panel bantuan kalau migrasi belum jalan ──
  const BannerMigrasi = belumMigrasi ? (
    <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
      <Cloud className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        {t('Ruang catatan belum aktif di server. Beri tahu admin Linguo untuk menjalankan pembaruan database — catatan yang kamu tulis belum bisa tersimpan.')}
      </span>
    </div>
  ) : null;

  return (
    <div className={embedded ? '' : 'px-4 sm:px-6'}>
      {!embedded && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl">
              <NotebookPen className="h-6 w-6 text-[#16796E]" strokeWidth={2.2} />
              {t('Catatan Saya')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('Simpan materi, catatan, berkas, dan PR-mu sendiri — tidak akan hilang seperti di chat.')}
            </p>
          </div>
          <button
            onClick={() => setFokusBuka(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#16796E] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0F5A52]"
          >
            <Brain className="h-4 w-4" strokeWidth={2.5} />
            {t('Mode Belajar Sendiri')}
          </button>
        </div>
      )}

      {BannerMigrasi}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* ── Kolom kiri: daftar ── */}
        <div className={`${mobileEditor ? 'hidden lg:block' : ''} rounded-2xl border border-gray-200 bg-white p-3`}>
          <div className="mb-2 flex gap-1 rounded-xl bg-gray-100 p-1">
            {([['catatan', t('Catatan'), NotebookPen], ['tugas', t('Tugas & PR'), ListTodo]] as const).map(([k, label, Ikon]) => (
              <button
                key={k}
                onClick={() => setSisi(k as any)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-bold transition-colors ${
                  sisi === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Ikon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {label}
                {k === 'tugas' && tugasBelum.length > 0 && (
                  <span className="rounded-full bg-[#16796E] px-1.5 text-[10px] font-bold text-white">{tugasBelum.length}</span>
                )}
              </button>
            ))}
          </div>

          {sisi === 'catatan' ? (
            <>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  value={cari}
                  onChange={(e) => setCari(e.target.value)}
                  placeholder={t('Cari catatan…')}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-[13px] outline-none focus:border-[#16796E] focus:bg-white"
                />
              </div>

              {!regId && regs.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {[{ id: 'all', label: t('Semua') }, ...regs.map((r: any) => ({ id: r.id, label: judulKelas(r) }))].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setFilterReg(c.id as any)}
                      className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                        filterReg === c.id ? 'bg-[#16796E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={tambahCatatan}
                className="mb-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2.5 text-[13px] font-semibold text-gray-500 transition-colors hover:border-[#16796E] hover:bg-teal-50/60 hover:text-[#16796E]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} /> {t('Catatan baru')}
              </button>

              <div className="max-h-[58vh] space-y-1 overflow-y-auto pr-0.5">
                {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>}
                {!loading && terfilter.length === 0 && (
                  <p className="px-2 py-6 text-center text-[12.5px] text-gray-400">
                    {cari ? t('Tidak ada catatan yang cocok.') : t('Belum ada catatan. Mulai dari tombol di atas.')}
                  </p>
                )}
                {terfilter.map((n) => {
                  const reg = n.registration_id ? regById[n.registration_id] : null;
                  return (
                    <button
                      key={n.id}
                      onClick={() => { setSelId(n.id); setMobileEditor(true); }}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        selId === n.id ? 'border-[#16796E] bg-teal-50/70' : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {n.pinned && <Pin className="h-3 w-3 shrink-0 text-amber-500" fill="currentColor" />}
                        <span className="truncate text-[13.5px] font-bold text-gray-900">{n.title || t('Tanpa judul')}</span>
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-gray-500">
                        {cuplikan(n.content || '') || t('Kosong')}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px] text-gray-400">
                        <span>{fmtTgl(n.updated_at)}</span>
                        {n.attachments?.length > 0 && (
                          <span className="inline-flex items-center gap-0.5"><Paperclip className="h-2.5 w-2.5" />{n.attachments.length}</span>
                        )}
                        {reg && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 font-semibold text-gray-500">
                            <GraduationCap className="h-2.5 w-2.5" />{judulKelas(reg)}
                          </span>
                        )}
                        {n.shared_with_teacher && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-teal-50 px-1.5 py-0.5 font-semibold text-[#16796E]">
                            <Share2 className="h-2.5 w-2.5" />{t('Dibagikan')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <TugasPanel
              studentId={studentId}
              tasks={tugasTampil}
              regById={regById}
              regId={regId || (filterReg !== 'all' ? filterReg : null)}
              tugasBaru={tugasBaru}
              setTugasBaru={setTugasBaru}
              onChanged={muatUlangTugas}
            />
          )}
        </div>

        {/* ── Kolom kanan: editor ── */}
        <div className={`${mobileEditor ? '' : 'hidden lg:block'} rounded-2xl border border-gray-200 bg-white`}>
          {!sel ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 px-6 text-center">
              <Sparkles className="h-7 w-7 text-gray-300" />
              <p className="text-[14px] font-semibold text-gray-500">{t('Pilih catatan di kiri, atau buat yang baru')}</p>
              <p className="max-w-sm text-[12.5px] text-gray-400">
                {t('Catatan bisa berisi rangkuman materi, kosakata baru, PR, sampai berkas dari pengajar — semuanya tersimpan di akunmu.')}
              </p>
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col">
              {/* header editor */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 px-3 py-2">
                <button onClick={() => setMobileEditor(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 lg:hidden">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex gap-1 rounded-xl bg-gray-100 p-0.5">
                  {([['tulis', t('Tulis'), PenLine], ['baca', t('Baca'), Eye]] as const).map(([k, label, Ikon]) => (
                    <button
                      key={k}
                      onClick={() => setMode(k as any)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-bold transition-colors ${
                        mode === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      <Ikon className="h-3.5 w-3.5" strokeWidth={2.5} />{label}
                    </button>
                  ))}
                </div>

                <div className="ml-auto flex items-center gap-1">
                  {status && (
                    <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                      {status === 'menyimpan' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-[#16796E]" strokeWidth={3} />}
                      {status === 'menyimpan' ? t('Menyimpan…') : t('Tersimpan')}
                    </span>
                  )}
                  <button
                    onClick={() => setFokusBuka(true)}
                    title={t('Mode Belajar Sendiri')}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-teal-50 hover:text-[#16796E]"
                  >
                    <Brain className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => tempelPerubahan(sel.id, { pinned: !sel.pinned })}
                    title={sel.pinned ? t('Lepas sematan') : t('Sematkan')}
                    className={`rounded-lg p-1.5 transition-colors hover:bg-amber-50 ${sel.pinned ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                  >
                    {sel.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => buang(sel)}
                    title={t('Hapus')}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* judul */}
              <input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder={t('Judul catatan…')}
                className="w-full border-none px-4 pt-4 text-[20px] font-bold text-gray-900 outline-none placeholder:text-gray-300"
              />

              {/* meta: kelas + bagikan */}
              <div className="flex flex-wrap items-center gap-2 px-4 pb-2 pt-2">
                {!regId && (
                  <select
                    value={sel.registration_id || ''}
                    onChange={(e) => tempelPerubahan(sel.id, { registration_id: e.target.value || null })}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11.5px] font-semibold text-gray-600 outline-none"
                  >
                    <option value="">{t('Tanpa kelas')}</option>
                    {regs.map((r: any) => (
                      <option key={r.id} value={r.id}>{judulKelas(r)}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => {
                    if (!sel.registration_id) { alert(t('Pilih kelas dulu supaya catatan ini bisa dibaca pengajarnya.')); return; }
                    tempelPerubahan(sel.id, { shared_with_teacher: !sel.shared_with_teacher });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-semibold transition-colors ${
                    sel.shared_with_teacher ? 'bg-teal-50 text-[#16796E]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Share2 className="h-3 w-3" />
                  {sel.shared_with_teacher ? t('Pengajar bisa baca') : t('Bagikan ke pengajar')}
                </button>
              </div>

              {/* toolbar blok */}
              {mode === 'tulis' && (
                <div className="flex flex-wrap gap-0.5 border-y border-gray-100 px-3 py-1.5">
                  {([
                    [Heading1, '# ', t('Judul besar')],
                    [Heading2, '## ', t('Sub judul')],
                    [List, '- ', t('Poin')],
                    [ListChecks, '- [ ] ', t('Checklist')],
                    [Quote, '> ', t('Kutipan')],
                    [Minus, '---\n', t('Garis')],
                  ] as const).map(([Ikon, awalan, judulTombol], i) => (
                    <button
                      key={i}
                      onClick={() => sisip(awalan as string)}
                      title={judulTombol as string}
                      className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    >
                      <Ikon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              )}

              {/* isi */}
              <div className="flex-1 px-4 py-3">
                {mode === 'tulis' ? (
                  <textarea
                    ref={areaRef}
                    value={isi}
                    onChange={(e) => setIsi(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter di baris list/checklist → lanjut butir berikutnya (ala Notion).
                      if (e.key !== 'Enter' || e.shiftKey) return;
                      const el = e.currentTarget;
                      const pos = el.selectionStart;
                      const awal = isi.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
                      const baris = isi.slice(awal, pos);
                      const m = baris.match(/^(\s*)([-*]\s\[\s\]\s|[-*]\s|\d+\.\s)/);
                      if (!m) return;
                      e.preventDefault();
                      const lanjut = m[2].replace(/\[[xX]\]/, '[ ]');
                      // Baris butir kosong ditekan Enter = keluar dari list.
                      if (baris.trim() === m[2].trim()) {
                        const next = isi.slice(0, awal) + isi.slice(pos);
                        setIsi(next);
                        requestAnimationFrame(() => el.setSelectionRange(awal, awal));
                        return;
                      }
                      const sisip2 = '\n' + m[1] + lanjut;
                      const next = isi.slice(0, pos) + sisip2 + isi.slice(pos);
                      setIsi(next);
                      requestAnimationFrame(() => el.setSelectionRange(pos + sisip2.length, pos + sisip2.length));
                    }}
                    placeholder={t('Tulis di sini… ketik "- " untuk poin, "- [ ] " untuk checklist, "# " untuk judul.')}
                    className="min-h-[240px] w-full resize-y border-none text-[14.5px] leading-relaxed text-gray-800 outline-none placeholder:text-gray-300"
                  />
                ) : isi.trim() ? (
                  <Pratinjau
                    md={isi}
                    onToggle={(baris) => {
                      const next = toggleChecklist(isi, baris);
                      setIsi(next);
                    }}
                  />
                ) : (
                  <button onClick={() => { setMode('tulis'); setTimeout(() => areaRef.current?.focus(), 40); }} className="text-[14px] text-gray-300">
                    {t('Catatan masih kosong — klik untuk mulai menulis.')}
                  </button>
                )}
              </div>

              {/* lampiran */}
              <div className="border-t border-gray-100 px-4 py-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11.5px] font-bold uppercase tracking-wide text-gray-400">{t('Lampiran')}</span>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11.5px] font-semibold text-gray-600 transition-colors hover:bg-gray-200">
                    {unggah ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
                    {t('Unggah berkas')}
                    <input type="file" multiple className="hidden" onChange={(e) => { pilihBerkas(e.target.files); e.currentTarget.value = ''; }} />
                  </label>
                  <button
                    onClick={() => setBukaLink((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11.5px] font-semibold text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    <Link2 className="h-3 w-3" /> {t('Tempel link')}
                  </button>
                </div>

                {bukaLink && (
                  <form onSubmit={(e) => { e.preventDefault(); tambahLink(); }} className="mb-2 flex gap-1.5">
                    <input
                      value={linkBaru}
                      onChange={(e) => setLinkBaru(e.target.value)}
                      placeholder="https://…"
                      autoFocus
                      className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[#16796E]"
                    />
                    <button type="submit" className="rounded-lg bg-[#16796E] px-3 py-1.5 text-[12.5px] font-bold text-white">{t('Tambah')}</button>
                  </form>
                )}

                {sel.attachments?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {sel.attachments.map((a, i) => {
                      const Ikon = IKON_LAMPIRAN[a.kind] || Paperclip;
                      return (
                        <span key={i} className="group inline-flex max-w-full items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-1 pl-2 pr-1 text-[12px]">
                          <Ikon className="h-3.5 w-3.5 shrink-0 text-[#16796E]" />
                          <a href={a.url} target="_blank" rel="noopener noreferrer" className="max-w-[190px] truncate font-medium text-gray-700 hover:underline">
                            {a.name}
                          </a>
                          <button onClick={() => copotLampiran(i)} className="rounded-md p-0.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12px] text-gray-400">{t('Belum ada lampiran — berkas PDF, foto papan tulis, atau link Drive bisa ditempel di sini.')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {fokusBuka && (
        <FokusMode
          studentId={studentId}
          tasks={tasks}
          onTasksChange={muatUlangTugas}
          fokusAwal={{ label: sel?.title || null, noteId: sel?.id || null, regId: sel?.registration_id || regId || null }}
          onClose={() => setFokusBuka(false)}
        />
      )}
    </div>
  );
}

// ── Daftar tugas / PR ───────────────────────────────────────────────────────
function TugasPanel({
  studentId, tasks, regById, regId, tugasBaru, setTugasBaru, onChanged,
}: {
  studentId: string;
  tasks: StudentTask[];
  regById: Record<string, any>;
  regId: string | null;
  tugasBaru: string;
  setTugasBaru: (v: string) => void;
  onChanged: () => void;
}) {
  const t = useT();
  const [tenggat, setTenggat] = useState('');
  const belum = tasks.filter((x) => !x.done);
  const selesai = tasks.filter((x) => x.done);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    const judul = tugasBaru.trim();
    if (!judul) return;
    setTugasBaru('');
    setTenggat('');
    await buatTugas(studentId, { title: judul, due_date: tenggat || null, registration_id: regId });
    onChanged();
  }

  const Baris = ({ x }: { x: StudentTask }) => {
    const reg = x.registration_id ? regById[x.registration_id] : null;
    const telat = !x.done && x.due_date && new Date(x.due_date) < new Date(new Date().toDateString());
    return (
      <div className="group flex items-start gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-50">
        <button
          onClick={async () => { await ubahTugas(x.id, { done: !x.done }); onChanged(); }}
          className={`mt-[3px] flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors ${
            x.done ? 'border-[#16796E] bg-[#16796E]' : 'border-gray-300 hover:border-[#16796E]'
          }`}
        >
          {x.done && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className={`text-[13px] leading-snug ${x.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{x.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10.5px] text-gray-400">
            {x.due_date && (
              <span className={`inline-flex items-center gap-0.5 font-semibold ${telat ? 'text-red-500' : ''}`}>
                <CalendarClock className="h-2.5 w-2.5" />{fmtTgl(x.due_date)}
              </span>
            )}
            {x.source === 'pengajar' && (
              <span className="rounded-full bg-violet-50 px-1.5 py-0.5 font-semibold text-violet-600">{t('Dari pengajar')}</span>
            )}
            {reg && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 font-semibold text-gray-500">{judulKelas(reg)}</span>}
          </div>
        </div>
        {/* PR dari pengajar tidak boleh dihapus siswa — biar tidak "hilang" begitu saja. */}
        {x.source !== 'pengajar' && (
          <button
            onClick={async () => { await hapusTugas(x.id); onChanged(); }}
            className="rounded-lg p-1 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <form onSubmit={tambah} className="mb-2 space-y-1.5 rounded-xl border border-dashed border-gray-300 p-2">
        <div className="flex items-center gap-1.5">
          <Plus className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            value={tugasBaru}
            onChange={(e) => setTugasBaru(e.target.value)}
            placeholder={t('Tugas baru… (mis. hafal 20 kosakata)')}
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-gray-400"
          />
        </div>
        {tugasBaru.trim() && (
          <div className="flex items-center gap-1.5 pl-6">
            <input
              type="date"
              value={tenggat}
              onChange={(e) => setTenggat(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-[11.5px] text-gray-600 outline-none"
            />
            <button type="submit" className="rounded-lg bg-[#16796E] px-3 py-1 text-[11.5px] font-bold text-white">{t('Tambah')}</button>
          </div>
        )}
      </form>

      <div className="max-h-[58vh] overflow-y-auto pr-0.5">
        {belum.length === 0 && selesai.length === 0 && (
          <p className="px-2 py-6 text-center text-[12.5px] text-gray-400">{t('Belum ada tugas. Tulis satu di atas.')}</p>
        )}
        {belum.map((x) => <Baris key={x.id} x={x} />)}
        {selesai.length > 0 && (
          <>
            <div className="mt-2 px-2 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-gray-300">
              {t('Selesai')} ({selesai.length})
            </div>
            {selesai.slice(0, 20).map((x) => <Baris key={x.id} x={x} />)}
          </>
        )}
      </div>
    </div>
  );
}
