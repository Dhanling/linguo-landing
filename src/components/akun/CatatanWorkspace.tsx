'use client';

// [student-workspace-v1] "Lingnote" (dulu "Catatan Saya") — ruang kerja belajar siswa.
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
// [lingnote-buku-v1] 28 Sep 2026: panel kanan jadi BUKU sungguhan — sampul kulit,
// dua halaman bergaris, tiap catatan = satu bentangan halaman, dan pindah catatan
// = halaman dibalik (animasi 3D). Kertas sengaja tetap krem di mode gelap (sama
// seperti kertas sertifikat): isi buku pakai kelas "ln-*" sendiri, BUKAN kelas
// warna Tailwind, supaya aturan `.lms-dark` di StudentShell tidak menghitamkannya.
//
// Catatan bersifat PRIVAT. Kalau siswa mau pengajarnya ikut baca, ada sakelar
// "Bagikan ke pengajar" per catatan (butuh catatan itu tertaut ke satu kelas —
// pengajar dijaga RLS lewat registrations.teacher_id).
//
// Semua tampilan degrade anggun kalau `sql/20260904_student_workspace.sql` belum
// dijalankan: muncul pemberitahuan, bukan OOPS.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  NotebookPen, Plus, Search, Pin, PinOff, Trash2, Paperclip, Link2, FileText, Image as ImageIcon,
  Presentation, Play, Loader2, Check, Share2, Eye, PenLine, Brain, ListTodo, CalendarClock,
  X, Heading1, Heading2, List, ListChecks, Quote, Minus, GraduationCap, Cloud, ChevronLeft, ChevronRight,
  BookOpen, Languages, Maximize2, Minimize2,
} from 'lucide-react';
import {
  muatCatatan, buatCatatan, simpanCatatan, hapusCatatan, unggahBerkas, hapusBerkas, jenisBerkas,
  muatTugas, buatTugas, ubahTugas, hapusTugas, parseBlok, toggleChecklist, cuplikan, infoKiriman, muatPratinjau,
  type StudentNote, type StudentTask, type NoteAttachment,
} from '@/lib/studentWorkspace';
import { useT } from '@/lib/uiLang';
import FokusMode from '@/components/akun/FokusMode';
import { sapaan } from '@/lib/teacherName';

const IKON_LAMPIRAN: Record<string, any> = {
  youtube: Play, slide: Presentation, doc: FileText, pdf: FileText, image: ImageIcon, link: Link2, file: Paperclip,
};

const fmtTgl = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '';
const fmtTglPanjang = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

function judulKelas(reg: any): string {
  if (!reg) return '';
  return [reg.language, reg.level].filter(Boolean).join(' · ');
}

// ── Suara kertas dibalik: derau pendek yang disaring, dirakit WebAudio (tanpa berkas) ──
let _ctx: AudioContext | null = null;
function suaraBalik() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    _ctx = _ctx || new AC();
    const ctx = _ctx;
    const dur = 0.42;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const p = i / d.length;
      // naik cepat, turun pelan, sedikit "kresek" di tengah
      d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * p), 1.6) * (0.75 + 0.25 * Math.random());
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(2600, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.value = 0.07;
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start();
  } catch { /* tanpa suara pun tidak apa-apa */ }
}

// ── Pratinjau markdown ringan — tiap baris 24px supaya pas di garis buku ─────────
function Pratinjau({ md, onToggle }: { md: string; onToggle?: (baris: number) => void }) {
  const blok = parseBlok(md);
  if (!blok.length) return null;
  const tebal = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="ln-strong">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
  return (
    <div className="ln-md">
      {blok.map((b, i) => {
        if (b.t === 'divider') return <div key={i} className="ln-md-hr" />;
        if (b.t === 'h1') return <h2 key={i} className="ln-md-h1">{tebal(b.teks)}</h2>;
        if (b.t === 'h2') return <h3 key={i} className="ln-md-h2">{tebal(b.teks)}</h3>;
        if (b.t === 'h3') return <h4 key={i} className="ln-md-h3">{tebal(b.teks)}</h4>;
        if (b.t === 'quote') return <blockquote key={i} className="ln-md-quote">{tebal(b.teks)}</blockquote>;
        if (b.t === 'todo')
          return (
            <button
              key={i}
              type="button"
              onClick={onToggle ? () => onToggle(b.baris) : undefined}
              className="ln-md-todo"
              data-done={b.selesai ? '1' : undefined}
            >
              <span className="ln-md-box">{b.selesai && <Check className="h-3 w-3" strokeWidth={3.5} />}</span>
              <span className="ln-md-todo-t">{tebal(b.teks)}</span>
            </button>
          );
        if (b.t === 'ul')
          return (
            <div key={i} className="ln-md-li">
              <span className="ln-md-dot" />
              <span>{tebal(b.teks)}</span>
            </div>
          );
        if (b.t === 'ol')
          return (
            <div key={i} className="ln-md-li">
              <span className="ln-md-no">{b.no}.</span>
              <span>{tebal(b.teks)}</span>
            </div>
          );
        return <p key={i} className="ln-md-p">{tebal(b.teks)}</p>;
      })}
    </div>
  );
}

/** [lingnote-kosong-v1] Bentangan pembuka untuk buku yang belum berisi catatan —
 *  sampul tetap bisa dibuka (dulu: sampul mati kalau kosong / pratinjau). */
const KOSONG = '__kosong__';
const KOSONG_NOTE: StudentNote = {
  id: KOSONG, student_id: '', registration_id: null, session_number: null, title: '', content: '', icon: null, color: null,
  tags: [], attachments: [], pinned: false, shared_with_teacher: false, archived_at: null, created_at: '', updated_at: '',
};

type Flip = { kind: 'next' | 'prev' | 'open' | 'close'; from: StudentNote | null; toId: string | null };

export default function CatatanWorkspace({
  studentId,
  regs = [],
  regId = null,
  embedded = false,
  readOnly = false,
}: {
  /** [lingnote-pratinjau-v1] Mode Pratinjau POV (staf, tanpa login siswa): hanya baca. */
  readOnly?: boolean;
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
  const [flip, setFlip] = useState<Flip | null>(null);
  const [lebar, setLebar] = useState(true); // true = bentangan 2 halaman, false = 1 halaman (layar sempit)

  // draft editor (dipisah dari `notes` supaya mengetik tidak menunggu server)
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [status, setStatus] = useState<'' | 'menyimpan' | 'tersimpan'>('');
  const [unggah, setUnggah] = useState(false);
  const [linkBaru, setLinkBaru] = useState('');
  const [bukaLink, setBukaLink] = useState(false);
  const [tugasBaru, setTugasBaru] = useState('');
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const judulRef = useRef<HTMLTextAreaElement | null>(null);
  const simpanTimer = useRef<any>(null);
  const bukuRef = useRef<HTMLDivElement | null>(null);
  const sentuhX = useRef<number | null>(null);

  const sel = useMemo(() => (selId === KOSONG ? KOSONG_NOTE : notes.find((n) => n.id === selId) || null), [notes, selId]);
  const diKosong = selId === KOSONG;

  const muat = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    if (readOnly) {
      const p = await muatPratinjau(studentId);
      setNotes(p.notes);
      setTasks(p.tasks);
      setLoading(false);
      return;
    }
    const [a, b] = await Promise.all([muatCatatan(studentId), muatTugas(studentId)]);
    setNotes(a.notes);
    setTasks(b.tasks);
    setBelumMigrasi(a.missing || b.missing);
    setLoading(false);
  }, [studentId, readOnly]);

  useEffect(() => { muat(); }, [muat]);

  const muatUlangTugas = useCallback(async () => {
    if (readOnly) return;
    const b = await muatTugas(studentId);
    setTasks(b.tasks);
  }, [studentId, readOnly]);

  // Lebar panel menentukan bentuk buku: bentangan 2 halaman atau 1 halaman.
  useEffect(() => {
    const el = bukuRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setLebar(e.contentRect.width >= 700));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Pilih catatan → isi draft SEKETIKA (bukan lewat effect), supaya halaman yang baru
   *  selesai dibalik tidak sempat menampilkan draft catatan sebelumnya satu frame. */
  function pilih(id: string | null, list: StudentNote[] = notes) {
    const n = id ? list.find((x) => x.id === id) || null : null;
    setSelId(id);
    setJudul(n?.title || '');
    setIsi(n?.content || '');
    setMode(n?.content ? 'baca' : 'tulis');
    setBukaLink(false);
  }

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

  /** Sebelum halaman dibalik: simpan draft yang masih menunggu jeda 700 ms —
   *  kalau tidak, timer-nya dibatalkan effect di atas dan ketikan terakhir hilang. */
  function simpanSekarang(): StudentNote | null {
    if (!sel) return null;
    const snap = { ...sel, title: judul, content: isi };
    if (judul !== (sel.title || '') || isi !== (sel.content || '')) {
      clearTimeout(simpanTimer.current);
      simpanCatatan(sel.id, { title: judul, content: isi });
      setNotes((prev) => prev.map((n) => (n.id === sel.id ? { ...n, title: judul, content: isi } : n)));
      setStatus('');
    }
    return snap;
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

  const idxSel = sel ? terfilter.findIndex((n) => n.id === sel.id) : -1;
  const sebelumnya = idxSel > 0 ? terfilter[idxSel - 1] : null;
  const berikutnya = idxSel >= 0 ? terfilter[idxSel + 1] || null : null;

  /** Balik halaman ke catatan `toId` (null = tutup buku). */
  function balik(kind: Flip['kind'], toId: string | null) {
    if (flip) return;
    const from = simpanSekarang();
    const kurangiGerak =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (kurangiGerak) { pilih(toId); return; }
    suaraBalik();
    setFlip({ kind, from, toId });
  }

  function selesaiBalik() {
    if (!flip) return;
    pilih(flip.toId);
    setFlip(null);
  }

  /** Klik catatan di daftar → buku membalik ke arah yang benar. */
  function bukaCatatan(id: string) {
    setMobileEditor(true);
    if (id === selId) return;
    if (!sel) { balik('open', id); return; }
    const a = terfilter.findIndex((n) => n.id === sel.id);
    const b = terfilter.findIndex((n) => n.id === id);
    balik(a >= 0 && b >= 0 && b < a ? 'prev' : 'next', id);
  }

  // [lingnote-layar-penuh-v1] Buku memenuhi layar. Fullscreen API dipasang di wadah buku
  // (lapisan teratas, lolos dari z-index/overflow induk); kelas .ln-full = cadangan
  // position:fixed untuk browser tanpa API itu (Safari iPhone).
  const [penuh, setPenuh] = useState(false);
  async function alihPenuh() {
    if (!penuh) {
      setPenuh(true);
      try { await bukuRef.current?.requestFullscreen?.(); } catch { /* cadangan CSS tetap jalan */ }
    } else {
      setPenuh(false);
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* abaikan */ }
    }
  }
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setPenuh(false); };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  useEffect(() => {
    if (!penuh) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.fullscreenElement) setPenuh(false); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [penuh]);

  // Panah kiri/kanan = balik halaman (kecuali sedang mengetik).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || fokusBuka) return;
      if (e.key === 'ArrowRight' && berikutnya) balik('next', berikutnya.id);
      if (e.key === 'ArrowLeft' && sebelumnya) balik('prev', sebelumnya.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function tambahCatatan() {
    const target = regId || (filterReg !== 'all' ? filterReg : null);
    if (readOnly) return;
    const res = await buatCatatan(studentId, { title: '', content: '', registration_id: target });
    const n = res.note;
    if (!n) {
      if (res.missing) setBelumMigrasi(true);
      else alert(t('Catatan baru gagal dibuat. Coba muat ulang halaman, lalu ulangi.'));
      return;
    }
    const from = simpanSekarang();
    const baru = [n, ...notes.map((x) => (from && x.id === from.id ? from : x))];
    setNotes(baru);
    setMobileEditor(true);
    const kurangiGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (flip || kurangiGerak) {
      pilih(n.id, baru);
      setMode('tulis');
    } else {
      suaraBalik();
      setFlip({ kind: sel ? 'next' : 'open', from, toId: n.id });
    }
  }

  // Catatan baru yang baru selesai dibalik → langsung mode tulis + fokus.
  useEffect(() => {
    if (flip || !sel) return;
    if (!sel.title && !sel.content && !judul && !isi) {
      setMode('tulis');
      setTimeout(() => areaRef.current?.focus(), 40);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId, flip]);

  async function tempelPerubahan(id: string, patch: Partial<StudentNote>) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } as StudentNote : n)));
    await simpanCatatan(id, patch);
  }

  async function buang(n: StudentNote) {
    if (!confirm(t('Hapus catatan ini?'))) return;
    await hapusCatatan(n.id);
    const sisa = notes.filter((x) => x.id !== n.id);
    setNotes(sisa);
    if (selId === n.id) {
      const ganti = berikutnya || sebelumnya;
      if (ganti) pilih(ganti.id, sisa);
      else { pilih(null, sisa); setMobileEditor(false); }
    }
  }

  /** Sisipkan awalan blok di baris tempat kursor berada (toolbar ala Notion). */
  function sisip(awalan: string) {
    const el = areaRef.current;
    if (!el) { setIsi((v) => v + (v.endsWith('\n') || !v ? '' : '\n') + awalan); setMode('tulis'); return; }
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

  // Textarea tumbuh mengikuti isi — yang menggulung wadah bergarisnya, jadi garis
  // buku ikut bergerak bersama tulisan.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [isi, mode, selId, lebar]);

  // Judul panjang turun baris, bukan terpotong.
  useEffect(() => {
    const el = judulRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [judul, selId, lebar, flip]);

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

  // ── Bagian-bagian halaman ──────────────────────────────────────────────────
  // `live` = halaman yang sedang terbuka & bisa diketik. Versi statis dipakai di
  // lembar yang sedang dibalik (dan halaman di bawahnya) selama animasi.
  const nomorHal = (n: StudentNote) => {
    const i = terfilter.findIndex((x) => x.id === n.id);
    return i < 0 ? null : { kiri: i * 2 + 1, kanan: i * 2 + 2 };
  };

  const kartuKiriman = (n: StudentNote) => {
    const info = infoKiriman(n);
    if (!info) return null;
    const reg = n.registration_id ? regById[n.registration_id] : null;
    const kelas = info.kelas || judulKelas(reg);
    return (
      <div className="ln-stamp">
        <div className="ln-stamp-ic"><Languages className="h-4 w-4" /></div>
        <div className="min-w-0">
          <div className="ln-stamp-t">{t('Dikirim pengajar saat kelas live')}</div>
          <div className="ln-stamp-s">
            {[kelas, n.session_number ? `${t('Sesi')} ${n.session_number}` : null, info.pengajar ? `${t('bersama')} ${sapaan(info.pengajar)}` : null]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
      </div>
    );
  };

  const kepala = (n: StudentNote, live: boolean) => {
    const reg = n.registration_id ? regById[n.registration_id] : null;
    return (
      <>
        <div className="ln-kop">
          <span className="ln-kop-tgl">{fmtTglPanjang(n.updated_at || n.created_at)}</span>
          {live && (
            <span className="ml-auto flex items-center gap-0.5">
              <button onClick={() => setFokusBuka(true)} title={t('Mode Belajar Sendiri')} className="ln-ib"><Brain className="h-4 w-4" /></button>
              <button
                onClick={() => tempelPerubahan(n.id, { pinned: !n.pinned })}
                title={n.pinned ? t('Lepas sematan') : t('Sematkan')}
                className="ln-ib"
                data-on={n.pinned ? '1' : undefined}
              >
                {n.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
              <button onClick={() => buang(n)} title={t('Hapus')} className="ln-ib ln-ib-del"><Trash2 className="h-4 w-4" /></button>
            </span>
          )}
        </div>
        {live ? (
          <textarea
            ref={judulRef}
            rows={1}
            value={judul}
            onChange={(e) => setJudul(e.target.value.replace(/\n/g, ' '))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); areaRef.current?.focus(); } }}
            placeholder={t('Judul catatan…')}
            className="ln-title"
          />
        ) : (
          <div className="ln-title" data-kosong={n.title ? undefined : '1'}>{n.title || t('Judul catatan…')}</div>
        )}
        <div className="ln-meta">
          {!regId && (live ? (
            <select
              value={n.registration_id || ''}
              onChange={(e) => tempelPerubahan(n.id, { registration_id: e.target.value || null })}
              className="ln-chip"
            >
              <option value="">{t('Tanpa kelas')}</option>
              {regs.map((r: any) => (
                <option key={r.id} value={r.id}>{judulKelas(r)}</option>
              ))}
            </select>
          ) : (
            <span className="ln-chip">{reg ? judulKelas(reg) : t('Tanpa kelas')}</span>
          ))}
          <button
            onClick={live ? () => {
              if (!n.registration_id) { alert(t('Pilih kelas dulu supaya catatan ini bisa dibaca pengajarnya.')); return; }
              tempelPerubahan(n.id, { shared_with_teacher: !n.shared_with_teacher });
            } : undefined}
            className="ln-chip"
            data-on={n.shared_with_teacher ? '1' : undefined}
          >
            <Share2 className="h-3 w-3" />
            {n.shared_with_teacher ? t('Pengajar bisa baca') : t('Bagikan ke pengajar')}
          </button>
        </div>
        {kartuKiriman(n)}
      </>
    );
  };

  const lampiran = (n: StudentNote, live: boolean) => (
    <div className="ln-lamp">
      <div className="ln-lamp-h">
        <span className="ln-label">{t('Lampiran')}</span>
        {live && (
          <>
            <label className="ln-chip cursor-pointer">
              {unggah ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paperclip className="h-3 w-3" />}
              {t('Unggah berkas')}
              <input type="file" multiple className="hidden" onChange={(e) => { pilihBerkas(e.target.files); e.currentTarget.value = ''; }} />
            </label>
            <button onClick={() => setBukaLink((v) => !v)} className="ln-chip">
              <Link2 className="h-3 w-3" /> {t('Tempel link')}
            </button>
          </>
        )}
      </div>
      {live && bukaLink && (
        <form onSubmit={(e) => { e.preventDefault(); tambahLink(); }} className="mb-2 flex gap-1.5">
          <input value={linkBaru} onChange={(e) => setLinkBaru(e.target.value)} placeholder="https://…" autoFocus className="ln-field flex-1" />
          <button type="submit" className="ln-btn">{t('Tambah')}</button>
        </form>
      )}
      {n.attachments?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {n.attachments.map((a, i) => {
            const Ikon = IKON_LAMPIRAN[a.kind] || Paperclip;
            return (
              <span key={i} className="ln-att">
                <Ikon className="h-3.5 w-3.5 shrink-0 ln-accent" />
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="max-w-[170px] truncate hover:underline">{a.name}</a>
                {live && (
                  <button onClick={() => copotLampiran(i)} className="ln-att-x"><X className="h-3 w-3" /></button>
                )}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="ln-hint">{t('Belum ada lampiran — berkas PDF, foto papan tulis, atau link Drive bisa ditempel di sini.')}</p>
      )}
    </div>
  );

  const isiHal = (n: StudentNote, live: boolean) => {
    const md = live ? isi : n.content || '';
    const tulis = live && mode === 'tulis';
    return (
      <>
        <div className="ln-bar">
          <div className="ln-seg">
            {([['tulis', t('Tulis'), PenLine], ['baca', t('Baca'), Eye]] as const).map(([k, label, Ikon]) => (
              <button
                key={k}
                onClick={live ? () => setMode(k as any) : undefined}
                data-on={(live ? mode : 'baca') === k ? '1' : undefined}
              >
                <Ikon className="h-3.5 w-3.5" strokeWidth={2.5} />{label}
              </button>
            ))}
          </div>
          {tulis && (
            <div className="flex flex-wrap gap-0.5">
              {([
                [Heading1, '# ', t('Judul besar')],
                [Heading2, '## ', t('Sub judul')],
                [List, '- ', t('Poin')],
                [ListChecks, '- [ ] ', t('Checklist')],
                [Quote, '> ', t('Kutipan')],
                [Minus, '---\n', t('Garis')],
              ] as const).map(([Ikon, awalan, judulTombol], i) => (
                <button key={i} onClick={() => sisip(awalan as string)} title={judulTombol as string} className="ln-ib">
                  <Ikon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
          {live && status && (
            <span className="ln-status">
              {status === 'menyimpan' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 ln-accent" strokeWidth={3} />}
              {status === 'menyimpan' ? t('Menyimpan…') : t('Tersimpan')}
            </span>
          )}
        </div>
        {tulis ? (
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
            className="ln-area"
          />
        ) : md.trim() ? (
          <Pratinjau md={md} onToggle={live ? (baris) => setIsi(toggleChecklist(isi, baris)) : undefined} />
        ) : (
          <button
            onClick={live ? () => { setMode('tulis'); setTimeout(() => areaRef.current?.focus(), 40); } : undefined}
            className="ln-hint ln-md-p"
          >
            {t('Catatan masih kosong — klik untuk mulai menulis.')}
          </button>
        )}
      </>
    );
  };

  const pita = (n: StudentNote) => (n.pinned ? <span className="ln-ribbon" aria-hidden /> : null);

  const kosongIsi = (live: boolean) => (
    <>
      <div className="ln-kop"><span className="ln-kop-tgl">{t('Halaman pertama')}</span></div>
      <div className="ln-title">Lingnote</div>
      <div className="ln-lined mt-3">
        <div className="ln-md">
          <p className="ln-md-p">{readOnly ? t('Siswa ini belum punya catatan.') : t('Buku ini masih kosong.')}</p>
          <p className="ln-md-p">{t('Satu catatan = satu bentangan halaman. Balik halaman lewat sudut kertas, tombol panah, atau geser.')}</p>
          <p className="ln-md-p">{t('Kosakata yang dikirim pengajar saat kelas live juga masuk ke sini, per sesi.')}</p>
        </div>
        {live && !readOnly && (
          <button onClick={tambahCatatan} className="ln-btn mt-3 inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> {t('Tulis catatan pertama')}
          </button>
        )}
      </div>
    </>
  );
  const kosongKiri = () => (
    <div className="ln-page ln-page-l">
      <div className="ln-page-in">
        <div className="ln-kop"><span className="ln-kop-tgl">{t('Milik')}</span></div>
        <div className="ln-title">Lingnote</div>
        <p className="ln-kop-tgl mt-3">{t('Buku catatan belajarmu — materi, kosakata, berkas, dan PR tersimpan rapi, tidak hilang seperti di chat.')}</p>
        <div className="ln-fill" />
        <div className="ln-lamp">
          <span className="ln-label">{t('Daftar isi')}</span>
          <p className="ln-hint mt-2">{t('Belum ada halaman.')}</p>
        </div>
      </div>
    </div>
  );
  const kosongKanan = (live: boolean) => (
    <div className="ln-page ln-page-r">
      <div className="ln-page-in">
        <div className="ln-lined ln-scroll">
          <div className="ln-md">
            <p className="ln-md-p">{readOnly ? t('Siswa ini belum punya catatan.') : t('Buku ini masih kosong.')}</p>
            <p className="ln-md-p">{t('Satu catatan = satu bentangan halaman. Balik halaman lewat sudut kertas, tombol panah, atau geser.')}</p>
            <p className="ln-md-p">{t('Kosakata yang dikirim pengajar saat kelas live juga masuk ke sini, per sesi.')}</p>
          </div>
          {live && !readOnly && (
            <button onClick={tambahCatatan} className="ln-btn mt-3 inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> {t('Tulis catatan pertama')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Halaman kiri (bentangan): kop, judul, info kelas, lampiran.
  const HalKiri = (n: StudentNote | null, live = false) =>
    n?.id === KOSONG ? kosongKiri() : n ? (
      <div className="ln-page ln-page-l">
        <div className="ln-page-in">
          {kepala(n, live)}
          <div className="ln-fill" />
          {lampiran(n, live)}
        </div>
        <span className="ln-pno ln-pno-l">{nomorHal(n)?.kiri ?? ''}</span>
        {(live || (readOnly && !flip)) && sebelumnya && (
          <button className="ln-corner ln-corner-l" onClick={() => balik('prev', sebelumnya.id)} title={t('Halaman sebelumnya')} />
        )}
      </div>
    ) : null;

  // Halaman kanan (bentangan): isi catatan di kertas bergaris.
  const HalKanan = (n: StudentNote | null, live = false) =>
    n?.id === KOSONG ? kosongKanan(live) : n ? (
      <div className="ln-page ln-page-r">
        {pita(n)}
        <div className="ln-page-in">
          <div className="ln-lined ln-scroll">
            {isiHal(n, live)}
          </div>
        </div>
        <span className="ln-pno ln-pno-r">{nomorHal(n)?.kanan ?? ''}</span>
        {(live || (readOnly && !flip)) && berikutnya && (
          <button className="ln-corner ln-corner-r" onClick={() => balik('next', berikutnya.id)} title={t('Halaman berikutnya')} />
        )}
      </div>
    ) : null;

  // Satu halaman (layar sempit): semuanya ditumpuk.
  const HalTunggal = (n: StudentNote | null, live = false) =>
    n?.id === KOSONG ? (
      <div className="ln-page ln-page-r">
        <div className="ln-page-in ln-scroll">{kosongIsi(live)}</div>
      </div>
    ) : n ? (
      <div className="ln-page ln-page-r">
        {pita(n)}
        <div className="ln-page-in ln-scroll">
          {kepala(n, live)}
          <div className="ln-lined mt-3">
            {isiHal(n, live)}
          </div>
          {lampiran(n, live)}
        </div>
        <span className="ln-pno ln-pno-r">{nomorHal(n)?.kiri ?? ''}</span>
      </div>
    ) : null;

  const Sampul = (
    <div
      className="ln-cover"
      role="button"
      tabIndex={0}
      onClick={() => balik('open', terfilter[0]?.id || KOSONG)}
      onKeyDown={(e) => { if (e.key === 'Enter') balik('open', terfilter[0]?.id || KOSONG); }}
    >
      <div className="ln-cover-stitch" />
      <div className="ln-cover-band" />
      <div className="ln-cover-body">
        <div className="ln-cover-logo"><BookOpen className="h-7 w-7" strokeWidth={1.8} /></div>
        <div className="ln-cover-title">Lingnote</div>
        <div className="ln-cover-rule" />
        <div className="ln-cover-sub">
          {loading ? '…' : terfilter.length ? `${terfilter.length} ${t('catatan')}` : t('Buku masih kosong')}
        </div>
        <div className="ln-cover-cta">
          {readOnly ? t('Ketuk untuk membuka · hanya baca') : terfilter.length ? t('Ketuk untuk membuka') : t('Ketuk untuk mulai menulis')}
        </div>
      </div>
      <div className="ln-cover-foot">linguo.id</div>
    </div>
  );

  // ── Rakit bentangan: halaman dasar + lembar yang sedang dibalik ─────────────
  const ke = flip?.toId === KOSONG ? KOSONG_NOTE : flip?.toId ? notes.find((n) => n.id === flip.toId) || null : null;
  const dari = flip?.from || null;
  let dasarKiri: ReactNode = null;
  let dasarKanan: ReactNode = null;
  let lembar: ReactNode = null;
  const tertutup = (!sel && !flip) || flip?.kind === 'close';
  const selesai = (e: React.AnimationEvent) => { if (e.target === e.currentTarget) selesaiBalik(); };

  if (lebar) {
    if (!flip) {
      dasarKiri = HalKiri(sel, !readOnly || diKosong);
      dasarKanan = sel ? HalKanan(sel, !readOnly || diKosong) : Sampul;
    } else {
      const muka = { next: [HalKanan(dari), HalKiri(ke)], prev: [HalKiri(dari), HalKanan(ke)], open: [Sampul, HalKiri(ke)], close: [HalKiri(dari), Sampul] }[flip.kind];
      dasarKiri = { next: HalKiri(dari), prev: HalKiri(ke), open: null, close: null }[flip.kind];
      dasarKanan = { next: HalKanan(ke), prev: HalKanan(dari), open: HalKanan(ke), close: HalKanan(dari) }[flip.kind];
      const maju = flip.kind === 'next' || flip.kind === 'open';
      lembar = (
        <div className={`ln-leaf ${maju ? 'ln-leaf-fwd' : 'ln-leaf-back'}`} onAnimationEnd={selesai}>
          <div className="ln-face">{muka[0]}</div>
          <div className="ln-face ln-face-b">{muka[1]}</div>
        </div>
      );
    }
  } else {
    if (!flip) dasarKanan = sel ? HalTunggal(sel, !readOnly || diKosong) : Sampul;
    else {
      dasarKanan = { next: HalTunggal(ke), prev: HalTunggal(dari), open: HalTunggal(ke), close: HalTunggal(dari) }[flip.kind];
      const atas = { next: HalTunggal(dari), prev: HalTunggal(ke), open: Sampul, close: Sampul }[flip.kind];
      const pergi = flip.kind === 'next' || flip.kind === 'open';
      lembar = (
        <div className={`ln-leaf ln-leaf-solo ${pergi ? 'ln-leaf-away' : 'ln-leaf-in'}`} onAnimationEnd={selesai}>
          <div className="ln-face">{atas}</div>
          <div className="ln-face ln-face-b"><div className="ln-page ln-page-l" /></div>
        </div>
      );
    }
  }

  const Buku = (
    <div
      ref={bukuRef}
      className={`ln-stage ${penuh ? 'ln-full' : ''}`}
      onTouchStart={(e) => {
        const tag = (e.target as HTMLElement).tagName.toLowerCase();
        sentuhX.current = tag === 'textarea' || tag === 'input' ? null : e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (sentuhX.current == null) return;
        const dx = e.changedTouches[0].clientX - sentuhX.current;
        sentuhX.current = null;
        if (dx < -60 && berikutnya) balik('next', berikutnya.id);
        if (dx > 60 && sebelumnya) balik('prev', sebelumnya.id);
      }}
    >
      <div className={`ln-book ${lebar ? 'ln-spread' : 'ln-single'} ${tertutup && lebar ? 'ln-closed' : ''}`}>
        {lebar && <div className="ln-half ln-half-l" data-kosong={dasarKiri ? undefined : '1'}>{dasarKiri}</div>}
        <div className="ln-half ln-half-r">{dasarKanan}</div>
        {lembar}
      </div>

      {/* navigasi di bawah buku: kiri tutup · tengah halaman · kanan halaman baru + layar penuh */}
      {!flip && (
        <div className="ln-nav mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[12.5px] font-semibold text-gray-500">
          <div>
            {sel && (
              <button
                onClick={() => (lebar ? balik('close', null) : setMobileEditor(false))}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-gray-100"
              >
                {lebar ? <BookOpen className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {lebar ? t('Tutup buku') : t('Daftar')}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sel && (
              <>
                <button
                  disabled={!sebelumnya}
                  onClick={() => sebelumnya && balik('prev', sebelumnya.id)}
                  className="rounded-xl p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-30"
                  title={t('Halaman sebelumnya')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[64px] text-center tabular-nums">
                  {idxSel >= 0 ? `${idxSel + 1} / ${terfilter.length}` : '—'}
                </span>
                <button
                  disabled={!berikutnya}
                  onClick={() => berikutnya && balik('next', berikutnya.id)}
                  className="rounded-xl p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-30"
                  title={t('Halaman berikutnya')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-1">
            {sel && !readOnly && (
              <button
                onClick={tambahCatatan}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-gray-100"
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">{t('Halaman baru')}</span>
              </button>
            )}
            <button
              onClick={alihPenuh}
              title={penuh ? t('Keluar layar penuh') : t('Layar penuh')}
              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-gray-100"
            >
              {penuh ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{penuh ? t('Keluar layar penuh') : t('Layar penuh')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={embedded ? '' : 'px-4 sm:px-6'}>
      <style>{LN_CSS}</style>
      {!embedded && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl">
              <NotebookPen className="h-6 w-6 text-[#16796E]" strokeWidth={2.2} />
              Lingnote
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('Buku catatan belajarmu — materi, kosakata, berkas, dan PR tersimpan rapi, tidak hilang seperti di chat.')}
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

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* ── Kolom kiri: daftar isi ── */}
        <div className={`${mobileEditor ? 'hidden lg:block' : ''} self-start rounded-2xl border border-gray-200 bg-white p-3`}>
          <div className="mb-2 flex gap-1 rounded-xl bg-gray-100 p-1">
            {([['catatan', t('Semua catatan'), NotebookPen], ['tugas', t('Tugas & PR'), ListTodo]] as const).map(([k, label, Ikon]) => (
              <button
                key={k}
                onClick={() => setSisi(k as any)}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-[12.5px] font-bold transition-colors ${
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
                <div className="mb-2 flex max-h-[132px] flex-wrap gap-1 overflow-y-auto">
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

              {!readOnly && <button
                onClick={tambahCatatan}
                className="mb-2 flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2.5 text-[13px] font-semibold text-gray-500 transition-colors hover:border-[#16796E] hover:bg-teal-50/60 hover:text-[#16796E]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} /> {t('Catatan baru')}
              </button>}

              <div className="max-h-[52vh] space-y-1 overflow-y-auto pr-0.5">
                {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-gray-300" /></div>}
                {!loading && terfilter.length === 0 && (
                  <p className="px-2 py-6 text-center text-[12.5px] text-gray-400">
                    {cari ? t('Tidak ada catatan yang cocok.') : readOnly ? t('Siswa ini belum punya catatan.') : t('Belum ada catatan. Mulai dari tombol di atas.')}
                  </p>
                )}
                {terfilter.map((n, i) => {
                  const reg = n.registration_id ? regById[n.registration_id] : null;
                  const kiriman = infoKiriman(n);
                  return (
                    <button
                      key={n.id}
                      onClick={() => bukaCatatan(n.id)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        selId === n.id ? 'border-[#16796E] bg-teal-50/70' : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {n.pinned && <Pin className="h-3 w-3 shrink-0 text-amber-500" fill="currentColor" />}
                        <span className="truncate text-[13.5px] font-bold text-gray-900">{n.title || t('Tanpa judul')}</span>
                        <span className="ml-auto shrink-0 text-[10.5px] font-semibold tabular-nums text-gray-400">{t('hlm.')} {i * 2 + 1}</span>
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
                        {kiriman && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-1.5 py-0.5 font-semibold text-violet-600">
                            <Languages className="h-2.5 w-2.5" />{t('Dari pengajar')}
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

        {/* ── Kolom kanan: buku ── */}
        <div className={`${mobileEditor ? '' : 'hidden lg:block'} min-w-0`}>{Buku}</div>
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

// ── Gaya buku ────────────────────────────────────────────────────────────────
// Sengaja CSS biasa (bukan utilitas Tailwind) supaya aturan gelap `.lms-dark`
// di StudentShell — yang menimpa lewat NAMA kelas Tailwind — tidak menyentuh kertas.
// JANGAN pakai backtick di dalam string ini.
const LN_CSS = `
.ln-stage{--ln-paper:#FBF7EC;--ln-paper-2:#F3ECDB;--ln-edge:#E4DAC3;--ln-line:rgba(22,121,110,.16);--ln-margin:rgba(214,96,96,.38);
  --ln-ink:#2A2824;--ln-ink-2:#6A6356;--ln-ink-3:#A59D8C;--ln-accent:#16796E;--ln-cover-a:#1A9E9E;--ln-cover-b:#0B4F4A;--ln-shadow:rgba(40,30,10,.28);
  --ln-h:640px;position:relative;}
.lms-dark .ln-stage{--ln-paper:#EDE6D5;--ln-paper-2:#E3DAC5;--ln-edge:#CFC4AA;--ln-shadow:rgba(0,0,0,.7);}
.ln-full{position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;justify-content:center;overflow:auto;padding:20px 28px 12px;
  background:radial-gradient(ellipse at 50% 30%,#2A2520,#14110E 70%);--ln-h:calc(100dvh - 92px);}
.ln-full .ln-book{width:100%;max-width:1500px;margin:0 auto;}
.ln-full .ln-single{height:var(--ln-h);}
.ln-full .ln-nav{width:100%;max-width:1500px;margin-left:auto;margin-right:auto;color:#D6CFC2;}
.ln-full .ln-nav button:hover{background:rgba(255,255,255,.08);}
.ln-full .ln-md,.ln-full .ln-area{font-size:15px;}
.ln-book{position:relative;display:grid;height:var(--ln-h);perspective:2800px;transition:transform .75s cubic-bezier(.45,.05,.3,1);}
.ln-spread{grid-template-columns:1fr 1fr;}
.ln-single{grid-template-columns:1fr;--ln-h:max(540px,calc(100dvh - 230px));height:max(540px,calc(100dvh - 230px));}
.ln-closed{transform:translateX(-25%);}
.ln-half{position:relative;min-width:0;height:100%;}
.ln-half[data-kosong]{visibility:hidden;}
.ln-half-l{border-radius:6px 0 0 6px;box-shadow:-1px 1px 0 var(--ln-edge),-2px 2px 0 var(--ln-paper),-3px 3px 0 var(--ln-edge),-4px 4px 0 var(--ln-paper),-5px 5px 0 var(--ln-edge),0 22px 40px -14px var(--ln-shadow);}
.ln-half-r{border-radius:0 6px 6px 0;box-shadow:1px 1px 0 var(--ln-edge),2px 2px 0 var(--ln-paper),3px 3px 0 var(--ln-edge),4px 4px 0 var(--ln-paper),5px 5px 0 var(--ln-edge),0 22px 40px -14px var(--ln-shadow);}
.ln-single .ln-half-r{border-radius:6px;}
.ln-closed .ln-half-r{box-shadow:0 26px 44px -14px var(--ln-shadow);}

.ln-page{position:absolute;inset:0;overflow:hidden;background:var(--ln-paper);color:var(--ln-ink);
  background-image:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.55),transparent 60%);}
.ln-page-l{border-radius:6px 0 0 6px;}
.ln-page-r{border-radius:0 6px 6px 0;}
.ln-single .ln-page{border-radius:6px;}
/* lekuk jilid di tengah */
.ln-page-l::after,.ln-page-r::after{content:"";position:absolute;top:0;bottom:0;width:56px;pointer-events:none;z-index:3;}
.ln-page-l::after{right:0;background:linear-gradient(to left,rgba(60,40,10,.20),rgba(60,40,10,.06) 30%,transparent);}
.ln-page-r::after{left:0;background:linear-gradient(to right,rgba(60,40,10,.20),rgba(60,40,10,.06) 30%,transparent);}
.ln-single .ln-page-r::after{width:14px;background:linear-gradient(to right,rgba(60,40,10,.16),transparent);}
.ln-page-in{position:absolute;inset:0;display:flex;flex-direction:column;padding:26px 30px 40px 34px;}
.ln-page-r .ln-page-in{padding:22px 30px 40px 40px;}
.ln-single .ln-page-in{padding:20px 20px 40px 24px;display:block;}
.ln-scroll{overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.18) transparent;}
.ln-fill{flex:1;}
.ln-pno{position:absolute;bottom:14px;font:600 11px/1 'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;color:var(--ln-ink-3);letter-spacing:.06em;}
.ln-pno-l{left:34px;}.ln-pno-r{right:30px;}

.ln-kop{display:flex;align-items:center;gap:6px;min-height:30px;border-bottom:1px solid var(--ln-edge);padding-bottom:6px;}
.ln-kop-tgl{font:italic 500 12.5px/1.2 'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;color:var(--ln-ink-2);}
.ln-title{display:block;width:100%;margin-top:14px;background:transparent;border:0;outline:0;padding:0;resize:none;overflow:hidden;
  font:700 22px/1.25 'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif;color:var(--ln-ink);letter-spacing:-.01em;}
.ln-title::placeholder,.ln-title[data-kosong]{color:var(--ln-ink-3) !important;}
.ln-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;}
.ln-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--ln-edge) !important;background:rgba(255,255,255,.55);color:var(--ln-ink-2);
  border-radius:999px;padding:4px 10px;font-size:11.5px;font-weight:600;outline:0;transition:background .15s,color .15s;}
.ln-chip:hover{background:#fff;color:var(--ln-ink);}
.ln-chip[data-on]{background:rgba(22,121,110,.12);color:var(--ln-accent);border-color:rgba(22,121,110,.35) !important;}
select.ln-chip{appearance:auto;padding-right:6px;}
.ln-ib{display:inline-flex;border-radius:8px;padding:5px;color:var(--ln-ink-3);transition:background .15s,color .15s;}
.ln-ib:hover{background:rgba(0,0,0,.05);color:var(--ln-ink);}
.ln-ib[data-on]{color:#D97706;}
.ln-ib-del:hover{color:#DC2626;background:rgba(220,38,38,.08);}
.ln-accent{color:var(--ln-accent);}
.ln-label{font-size:10.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--ln-ink-3);}
.ln-hint{font-size:12.5px;color:var(--ln-ink-3);text-align:left;}
.ln-lamp{margin-top:16px;padding-top:12px;border-top:1px dashed var(--ln-edge);}
.ln-lamp-h{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:8px;}
.ln-att{display:inline-flex;max-width:100%;align-items:center;gap:6px;border-radius:4px;padding:5px 6px 5px 9px;font-size:12px;font-weight:500;color:var(--ln-ink);
  background:#FFFDF6;box-shadow:0 1px 0 var(--ln-edge),0 3px 8px -4px rgba(60,40,10,.25);transform:rotate(-.6deg);}
.ln-att:nth-child(even){transform:rotate(.7deg);}
.ln-att-x{border-radius:4px;padding:2px;color:var(--ln-ink-3);}
.ln-att-x:hover{color:#DC2626;background:rgba(220,38,38,.08);}
.ln-field{border:1px solid var(--ln-edge) !important;background:#fff;color:var(--ln-ink);border-radius:8px;padding:6px 10px;font-size:12.5px;outline:0;}
.ln-btn{border-radius:8px;background:var(--ln-accent);color:#fff;padding:6px 12px;font-size:12.5px;font-weight:700;}

.ln-stamp{display:flex;gap:10px;align-items:flex-start;margin-top:16px;padding:10px 12px;border-radius:6px;
  border:1.5px dashed rgba(109,40,217,.35);background:rgba(139,92,246,.06);color:#5B21B6;transform:rotate(-.8deg);}
.ln-stamp-ic{display:flex;height:28px;width:28px;flex-shrink:0;align-items:center;justify-content:center;border-radius:999px;background:rgba(139,92,246,.14);}
.ln-stamp-t{font-size:12px;font-weight:800;}
.ln-stamp-s{margin-top:2px;font-size:12px;color:#6D28D9;}

.ln-bar{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-height:42px;margin-bottom:6px;padding-bottom:6px;
  background:var(--ln-paper);border-bottom:1px solid var(--ln-edge);}
.ln-seg{display:flex;gap:2px;border-radius:10px;padding:2px;background:rgba(0,0,0,.05);}
.ln-seg button{display:inline-flex;align-items:center;gap:4px;border-radius:8px;padding:4px 9px;font-size:12px;font-weight:700;color:var(--ln-ink-2);}
.ln-seg button[data-on]{background:#fff;color:var(--ln-ink);box-shadow:0 1px 2px rgba(0,0,0,.08);}
.ln-status{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:var(--ln-ink-3);}

/* kertas bergaris: garis & margin merah ikut menggulung bersama tulisan */
.ln-lined{position:relative;height:100%;
  background-image:linear-gradient(to right,transparent 22px,var(--ln-margin) 22px,var(--ln-margin) 23px,transparent 23px),
    linear-gradient(to bottom,transparent 23px,var(--ln-line) 23px,var(--ln-line) 24px);
  background-size:100% 100%,100% 24px;background-attachment:local;padding-left:34px;}
.ln-single .ln-lined{height:auto;min-height:280px;padding-left:26px;background-image:linear-gradient(to right,transparent 14px,var(--ln-margin) 14px,var(--ln-margin) 15px,transparent 15px),linear-gradient(to bottom,transparent 23px,var(--ln-line) 23px,var(--ln-line) 24px);background-size:100% 100%,100% 24px;}
.ln-single .ln-title{font-size:19px;}
.ln-page-r .ln-scroll{flex:1;}
.ln-area{display:block;width:100%;min-height:100%;resize:none;overflow:hidden;background:transparent;border:0;outline:0;padding:0;
  font-size:13.5px;line-height:24px;color:var(--ln-ink);}
.ln-md{font-size:13.5px;line-height:24px;color:var(--ln-ink);}
.ln-md-p{min-height:24px;}
.ln-md-h1{font:700 17px/24px 'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;color:var(--ln-ink);}
.ln-md-h2{font:700 15px/24px 'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;color:var(--ln-ink);}
.ln-md-h3{font-weight:700;font-size:13.5px;line-height:24px;}
.ln-md-quote{border-left:3px solid rgba(22,121,110,.45);padding-left:10px;font-style:italic;color:var(--ln-ink-2);}
.ln-md-hr{height:24px;background:linear-gradient(to bottom,transparent 11px,var(--ln-ink-3) 11px,var(--ln-ink-3) 12px,transparent 12px);opacity:.5;}
.ln-md-li{display:flex;gap:8px;}
.ln-md-dot{margin-top:10px;height:4px;width:4px;flex-shrink:0;border-radius:999px;background:var(--ln-ink-2);}
.ln-md-no{flex-shrink:0;font-weight:700;color:var(--ln-ink-3);}
.ln-md-todo{display:flex;width:100%;gap:8px;text-align:left;border-radius:6px;}
.ln-md-todo:hover{background:rgba(22,121,110,.06);}
.ln-md-box{margin-top:5px;display:flex;height:14px;width:14px;flex-shrink:0;align-items:center;justify-content:center;border-radius:4px;border:2px solid var(--ln-ink-3);color:#fff;}
.ln-md-todo[data-done] .ln-md-box{border-color:var(--ln-accent);background:var(--ln-accent);}
.ln-md-todo[data-done] .ln-md-todo-t{color:var(--ln-ink-3);text-decoration:line-through;}
.ln-strong{font-weight:700;color:var(--ln-ink);}

/* pita pembatas buku untuk catatan yang disematkan */
.ln-ribbon{position:absolute;top:-4px;right:46px;z-index:4;width:16px;height:74px;background:linear-gradient(to right,#B91C1C,#DC2626 45%,#B91C1C);
  clip-path:polygon(0 0,100% 0,100% 100%,50% 84%,0 100%);box-shadow:0 2px 3px rgba(0,0,0,.2);}

/* sudut halaman: melengkung saat disorot, klik = balik */
.ln-corner{position:absolute;bottom:0;z-index:5;width:46px;height:46px;transition:width .2s,height .2s;}
.ln-corner-r{right:0;border-radius:0 0 6px 0;background:linear-gradient(135deg,transparent 50%,var(--ln-paper-2) 50%,var(--ln-edge) 72%,rgba(0,0,0,.08));}
.ln-corner-l{left:0;border-radius:0 0 0 6px;background:linear-gradient(225deg,transparent 50%,var(--ln-paper-2) 50%,var(--ln-edge) 72%,rgba(0,0,0,.08));}
.ln-corner-r::before,.ln-corner-l::before{content:"";position:absolute;inset:0;}
.ln-corner:hover{width:70px;height:70px;}
.ln-corner-r:hover{box-shadow:-6px -6px 14px -8px rgba(0,0,0,.35);}
.ln-corner-l:hover{box-shadow:6px -6px 14px -8px rgba(0,0,0,.35);}

/* sampul */
.ln-cover{position:absolute;inset:0;cursor:pointer;overflow:hidden;border-radius:4px 10px 10px 4px;color:#F4EBD0;outline:0;
  background:radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.16),transparent 55%),
    radial-gradient(circle at 80% 90%,rgba(0,0,0,.25),transparent 60%),
    repeating-linear-gradient(45deg,rgba(255,255,255,.018) 0 2px,rgba(0,0,0,.02) 2px 4px),
    linear-gradient(135deg,var(--ln-cover-a),var(--ln-cover-b));
  box-shadow:inset 10px 0 18px -8px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.08);}
.ln-cover:focus-visible{box-shadow:0 0 0 3px rgba(26,158,158,.6);}
.ln-cover-stitch{position:absolute;inset:14px 14px 14px 22px;border:1.5px dashed rgba(244,235,208,.38);border-radius:4px 8px 8px 4px;}
.ln-cover-band{position:absolute;top:0;bottom:0;right:44px;width:12px;background:linear-gradient(to right,#0A3B37,#12514C 40%,#0A3B37);box-shadow:0 0 6px rgba(0,0,0,.35);}
.ln-cover-body{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:0 60px 0 36px;text-align:center;}
.ln-cover-logo{display:flex;height:64px;width:64px;align-items:center;justify-content:center;border-radius:999px;border:1.5px solid rgba(244,235,208,.5);}
.ln-cover-title{font:700 44px/1 'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif;letter-spacing:.01em;
  text-shadow:0 1px 0 rgba(0,0,0,.35),0 -1px 0 rgba(255,255,255,.12);}
.ln-cover-rule{height:1px;width:120px;background:rgba(244,235,208,.45);}
.ln-cover-sub{font:italic 500 15px/1.3 'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;opacity:.85;}
.ln-cover-cta{margin-top:18px;border-radius:999px;border:1px solid rgba(244,235,208,.4);padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:.04em;opacity:.9;transition:background .2s;}
.ln-cover:hover .ln-cover-cta{background:rgba(244,235,208,.14);}
.ln-cover-foot{position:absolute;bottom:26px;left:0;right:24px;text-align:center;font-size:10.5px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;opacity:.5;}

/* lembar yang sedang dibalik */
.ln-leaf{position:absolute;top:0;bottom:0;width:50%;z-index:10;transform-style:preserve-3d;
  animation-duration:.8s;animation-timing-function:cubic-bezier(.45,.05,.3,1);animation-fill-mode:forwards;}
.ln-leaf-fwd{left:50%;transform-origin:left center;animation-name:ln-fwd;}
.ln-leaf-back{left:0;transform-origin:right center;animation-name:ln-back;}
.ln-leaf-solo{left:0;width:100%;transform-origin:left center;}
.ln-leaf-away{animation-name:ln-fwd;}
.ln-leaf-in{animation-name:ln-in;}
.ln-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;}
.ln-face-b{transform:rotateY(180deg);}
.ln-face::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:20;border-radius:inherit;opacity:0;
  animation:ln-shade .8s cubic-bezier(.45,.05,.3,1) forwards;}
.ln-leaf-fwd .ln-face:not(.ln-face-b)::after,.ln-leaf-away .ln-face:not(.ln-face-b)::after,.ln-leaf-in .ln-face:not(.ln-face-b)::after{background:linear-gradient(to right,rgba(0,0,0,.28),rgba(0,0,0,0) 60%,rgba(255,255,255,.18));}
.ln-leaf-back .ln-face:not(.ln-face-b)::after{background:linear-gradient(to left,rgba(0,0,0,.28),rgba(0,0,0,0) 60%,rgba(255,255,255,.18));}
.ln-face-b::after{background:linear-gradient(to left,rgba(0,0,0,.25),transparent 70%);}
.ln-leaf-back .ln-face-b::after{background:linear-gradient(to right,rgba(0,0,0,.25),transparent 70%);}
@keyframes ln-fwd{0%{transform:rotateY(0)}45%{transform:rotateY(-80deg) skewY(-3deg)}100%{transform:rotateY(-180deg)}}
@keyframes ln-back{0%{transform:rotateY(0)}45%{transform:rotateY(80deg) skewY(3deg)}100%{transform:rotateY(180deg)}}
@keyframes ln-in{0%{transform:rotateY(-180deg)}55%{transform:rotateY(-100deg) skewY(-3deg)}100%{transform:rotateY(0)}}
@keyframes ln-shade{0%{opacity:0}50%{opacity:1}100%{opacity:.15}}
@media (prefers-reduced-motion:reduce){.ln-book{transition:none}}
`;

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
