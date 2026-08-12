"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  fetchSimulation, getStudentInfo, createAttempt, uploadRecording,
  peekSimulationAccess, startGuestSession, getPromoAttemptStatus,
  gradeObjective, gradeWithAI, saveAnswers, finalizeAttempt,
  AUTO_GRADED, SKILL_LABEL, testTypeLabel, effectiveDurationMinutes,
  TEST_OVERVIEW, SKILL_HOWTO, GENERAL_RULES,
  type Simulation, type Section, type Question, type AnswerPayload, type StudentInfo, type Skill, type PromoAttemptStatus,
} from "@/lib/simulations";
import { readProgress, readAnyProgress, saveProgress, clearProgress, type SavedProgress } from "@/lib/simProgress";
// [sim-official-score-v1] Layar hasil dipindah ke komponen bersama — dipakai juga
// oleh /akun/simulasi/hasil/[attemptId] (buka hasil lama dari Riwayat Skor).
import ResultView, {
  SKILL_ICON, TFNG, stripOptionLabel, type ResultItem,
} from "@/components/akun/simulasi/ResultView";
import {
  ArrowLeft, ArrowRight, BookOpen, Headphones, Mic, Square,
  Loader2, CheckCircle2, Sparkles, ListChecks, AlertCircle, ClipboardCheck,
  Clock, X, Info, ChevronDown, Check, Play, Pause, RotateCcw, RotateCw,
  PlayCircle, Moon, Sun, Maximize, Minimize,
  User, Mail, Phone, Lock, ShieldAlert,
} from "lucide-react";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const YELLOW = "#FFC93C";

// [sim-subtes-urut-v1] Urutan baku subtes, mengikuti ujian aslinya:
// TOEFL ITP = Listening → Structure → Reading; IELTS = Listening → Reading →
// Writing → Speaking. Subtes dikerjakan BERURUTAN — subtes berikutnya baru
// terbuka setelah subtes sebelumnya diselesaikan.
const SKILL_SEQUENCE: Skill[] = ["listening", "structure", "reading", "writing", "speaking"];

// Maksimal soal yang tampil per halaman — supaya siswa tak perlu menggulir jauh
// ke bawah; sisanya dibagi ke halaman berikutnya (tombol "Lanjut" di atas).
const PAGE_SIZE = 5;

// [sim-subtes-v1] Ujian dipecah per SUBTES (kelompok bagian se-skill, mis.
// Listening / Structure / Reading) — dipilih dari hub "Detail Tryout" ala CBT.
// Subtes yang sudah dimulai dikunci minimal segini menit: siswa tidak bisa
// menyelesaikan/pindah subtes sebelum kunci lewat (dicap saat subtes dimulai).
const SECTION_LOCK_MINUTES = 30;
// [sim-proctor-v1] Proctoring anti-curang: pindah tab / keluar layar penuh
// tercatat sebagai pelanggaran; mencapai batas ini → jawaban auto-submit.
const MAX_VIOLATIONS = 3;
// [sim-idle-expire-v1] Sesi yang ditinggal lebih dari sehari dianggap kedaluwarsa:
// begitu siswa membukanya lagi, jawaban yang sempat tersimpan langsung dikumpulkan
// (auto-submit) — bukan dilanjutkan seolah waktunya masih berjalan. Angka yang sama
// dipakai cron `expire-stale-simulation-attempts` di server untuk peserta yang tak
// pernah kembali (lihat sql/20260731_simulasi_auto_expire.sql).
const IDLE_EXPIRE_MS = 24 * 60 * 60 * 1000;
// Keluar simulasi lewat tombol tutup (disengaja) tak boleh dihitung pelanggaran —
// flag modul karena leave() (Shell) & listener proctoring hidup di komponen beda.
let leavingSim = false;
// Aturan tambahan (ikut tampil di wizard intro, bagian Petunjuk Pengerjaan).
const EXTRA_RULES = [
  { text: `Subtes dikerjakan BERURUTAN seperti ujian aslinya (mis. Listening → Structure → Reading, atau Listening → Reading → Writing → Speaking). Subtes berikutnya baru terbuka setelah subtes sebelumnya diselesaikan, dan yang sudah selesai tidak bisa dibuka lagi.` },
  { text: `Tiap subtes punya batas waktu sendiri dan dikunci minimal ${SECTION_LOCK_MINUTES} menit — kamu tidak bisa pindah subtes sebelum itu (kecuali waktunya habis).` },
  { text: `Ujian dikerjakan dalam mode LAYAR PENUH. Berpindah tab, berpindah aplikasi/jendela lain, minimize, atau keluar dari layar penuh tercatat sebagai pelanggaran. ${MAX_VIOLATIONS}× pelanggaran → jawaban otomatis dikumpulkan.` },
  { text: `Selama mengerjakan, klik kanan, blok-salin teks soal, tempel jawaban dari luar, cetak/simpan halaman, dan pintasan devtools diblokir. Yang bisa dipakai hanya tombol di layar ujian (navigasi soal, Selesaikan Subtes, dan tombol keluar).` },
];

// Render deskripsi/intro dengan format ringan (aman, tanpa HTML mentah):
//  • baris kosong  → jarak antar paragraf
//  • baris diawali "•", "-", atau "*" → butir daftar
//  • **teks**      → tebal
function fmtInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part)
      ? <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>,
  );
}

function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    const items = bullets;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="space-y-1.5">
        {items.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TEAL }} />
            <span className="flex-1">{fmtInline(b)}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    const m = line.match(/^[•\-*]\s+(.*)$/);
    if (m) { bullets.push(m[1]); return; }
    flush();
    if (line) blocks.push(<p key={`p-${idx}`}>{fmtInline(line)}</p>);
  });
  flush();
  return <div className={className}>{blocks}</div>;
}

// Passage bacaan berupa teks polos (mis. hasil impor OCR): tiap baris tak-kosong
// jadi paragraf sendiri dengan jarak antar-paragraf, teks dirata kiri-kanan
// (justify) biar rapi ala buku, dan baris "judul" (mis. "Bacaan 1: ...") ditebalkan.
function PassageText({ text, className }: { text: string; className?: string }) {
  const paras = text.replace(/\r\n/g, "\n").split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className={className}>
      {paras.map((p, i) => {
        const isHeading =
          /^(bacaan|passage|reading|text|teks|paragraph|paragraf)\b/i.test(p) ||
          (i === 0 && p.length <= 80 && !/[.!?,;:]$/.test(p));
        return isHeading ? (
          <p key={i} className="mb-2 font-bold text-slate-900 first:mt-0">{fmtInline(p)}</p>
        ) : (
          <p key={i} className="mb-3 text-justify hyphens-auto last:mb-0">{fmtInline(p)}</p>
        );
      })}
    </div>
  );
}

// Deteksi konten HTML (dari CMS admin: passage & instruksi kini disimpan sbg HTML
// dengan bold/italic/underline, rata kiri/tengah/kanan, ukuran font, & daftar).
function isHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}
// Bersihkan HTML dari CMS sebelum dirender: konten lama sempat menyimpan atribut
// `style` sampah hasil computed-style saat admin menempel dari sumber lain (mis.
// `border-color: rgba(0,0,0,0); outline-color: oklab(...)` bawaan Tailwind, bahkan
// pada <br> kosong). Tanpa dibersihkan, style itu ikut terbawa & terlihat "bocor".
// Isomorfik (regex murni, tanpa DOMParser) supaya aman di server & client tanpa
// mismatch hidrasi. Simpan hanya properti gaya yang dipakai editor CMS.
// `font-family` sengaja TIDAK diizinkan: konten impor dari Google Docs/Drive membawa
// serif (Times/Cambria) yg bikin instruksi tampil beda font dari soal. Karena sanitasi
// ini jalan saat render, membuangnya juga merapikan sim lama yg sudah terlanjur simpan
// font-family — teks otomatis ikut font aplikasi (seragam dgn soal).
const ALLOWED_STYLE_PROP = /^(text-align|font-size|font-weight|font-style|text-decoration(-line|-style)?|vertical-align)$/;
function sanitizeCmsHtml(html: string): string {
  return html
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (_m, _q, dq, sq) => {
      const cleaned = ((dq ?? sq ?? "") as string)
        .split(";")
        .map((d) => d.trim())
        .filter(Boolean)
        .filter((d) => ALLOWED_STYLE_PROP.test((d.split(":")[0] || "").trim().toLowerCase()))
        .join("; ");
      return cleaned ? ` style="${cleaned}"` : "";
    });
}
// Render aman: HTML dari CMS dibersihkan lalu ditampilkan (sumber tepercaya = admin
// dashboard internal), teks lama / markdown tetap lewat <RichText> spy kompatibel.
// Gaya tabel WAJIB ada di sini: soal Listening/Reading berbentuk table & form
// completion menyimpan tabelnya sebagai HTML di instruksi section, sementara
// sanitizer di atas sengaja membuang class & style. Tanpa aturan ini tabel tampil
// sebagai deretan teks tanpa garis dan siswa tak bisa membaca kolomnya. Kembarannya
// ada di admin (TestSimulations.tsx → CMS_HTML_CLASS) — ubah dua-duanya.
const CMS_HTML_CLASS =
  "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-[13px] " +
  "[&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-2.5 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-slate-700 [&_th]:align-top " +
  "[&_td]:border [&_td]:border-slate-300 [&_td]:px-2.5 [&_td]:py-2 [&_td]:align-top";
function SmartText({ text, className }: { text: string; className?: string }) {
  if (isHtml(text)) {
    return (
      // Tabel lebar tidak boleh mendorong lebar halaman di HP → digulir sendiri.
      <div
        className={`${className ?? ""} ${CMS_HTML_CLASS} overflow-x-auto`.trim()}
        dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(text) }}
      />
    );
  }
  return <RichText text={text} className={className} />;
}

// ── [sim-table-fill-v1] Isian LANGSUNG di tabel/form soal ────────────────────
// Soal IELTS "Complete the table/notes/form" menyimpan tabelnya sebagai HTML di
// `section.instructions`, dgn penanda blank `(1) ______` di selnya. Sebelumnya
// tabel cuma dipajang dan siswa mengisi daftar soal terpisah di kolom kanan —
// beda jauh dari tes aslinya. Sekarang tiap penanda ditukar jadi kotak isian yang
// terikat ke soalnya, jadi siswa mengetik persis di dalam tabel.
//
// Pemetaan penanda → soal sengaja pakai URUTAN (penanda ke-n = soal isian ke-n),
// bukan angka di dalam kurung: penomoran soal di player di-reset per part,
// sementara video sumber menomori 31–40. Kalau jumlah penanda > jumlah soal
// isian, fitur dimatikan (fallback ke daftar soal biasa) supaya data jelek tak
// pernah bikin soal jadi tak bisa dijawab.
const BLANK_MARK_RE = /\((\d{1,3})\)\s*(?:_{2,}|\.{3,}|…+|…+)/g;
const TEXT_ANSWER_TYPES = new Set(["fill_blank", "short_answer"]);

function buildTableBlanks(instructions: string | null | undefined, qs: Question[]): { html: string; qs: Question[] } | null {
  const raw = (instructions ?? "").trim();
  if (!raw || !isHtml(raw)) return null;
  const marks = raw.match(BLANK_MARK_RE);
  if (!marks || marks.length < 2) return null;
  const fillQs = qs.filter((q) => TEXT_ANSWER_TYPES.has(q.type));
  if (marks.length > fillQs.length) return null;
  let i = 0;
  const html = sanitizeCmsHtml(raw).replace(BLANK_MARK_RE, () => `<span data-sim-blank="${i++}"></span>`);
  if (i !== marks.length) return null;
  return { html, qs: fillQs.slice(0, marks.length) };
}

// Render HTML tabel lalu tanam <input> React ke tiap penanda lewat portal —
// cara paling aman menyisipkan komponen ke tengah HTML tanpa memecah <table>.
function TableFillHtml({ html, qs, answers, onChange, qNumber, className }: {
  html: string;
  qs: Question[];
  answers: Record<string, AnswerState>;
  onChange: (qid: string, patch: Partial<AnswerState>) => void;
  qNumber: Record<string, number>;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hosts, setHosts] = useState<HTMLElement[]>([]);
  useEffect(() => {
    setHosts(Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-sim-blank]") ?? []));
  }, [html]);
  return (
    <div className="relative">
      <div ref={ref} className={`${className ?? ""} ${CMS_HTML_CLASS} overflow-x-auto`.trim()} dangerouslySetInnerHTML={{ __html: html }} />
      {hosts.map((el, i) => {
        const q = qs[i];
        if (!q) return null;
        return createPortal(
          <span id={`q-${q.id}`} className="inline-flex scroll-mt-32 items-center gap-1 rounded align-middle">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">{qNumber[q.id]}</span>
            <input
              value={answers[q.id]?.text ?? ""}
              onChange={(e) => onChange(q.id, { text: e.target.value })}
              placeholder="jawaban…"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              className="w-32 rounded-md border-b-2 border-teal-300 bg-teal-50/70 px-1.5 py-0.5 text-[13px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-teal-500 focus:bg-white"
            />
          </span>,
          el,
        );
      })}
    </div>
  );
}

// Petunjuk default per bagian (template) — dipakai bila admin tidak menulis
// instruksi sendiri. Tampil di layar "intro bagian" sebelum soal dikerjakan.
const SECTION_INTRO: Record<string, { title: string; points: string[] }> = {
  reading: {
    title: "Petunjuk Bagian Reading",
    points: [
      "Baca teks (passage) dengan teliti — teks ada di panel kiri dan bisa digulir.",
      "Jawab tiap soal sesuai informasi pada teks, bukan pengetahuan umum.",
      "Boleh kembali membaca teks kapan saja selama waktu masih ada.",
    ],
  },
  listening: {
    title: "Petunjuk Bagian Listening",
    points: [
      "Putar audio dan simak baik-baik — gunakan tombol ±10 detik untuk mengulang bagian penting.",
      "Kamu boleh menjeda dan mengulang audio selama waktu masih tersedia.",
      "Tulis/pilih jawaban sesuai yang kamu dengar.",
    ],
  },
  writing: {
    title: "Petunjuk Bagian Writing",
    points: [
      "Tulis esai sesuai instruksi dan perhatikan jumlah kata minimal.",
      "Susun jawaban dengan struktur yang jelas: pembuka, isi, penutup.",
      "Periksa kembali tata bahasa dan ejaan sebelum lanjut.",
    ],
  },
  speaking: {
    title: "Petunjuk Bagian Speaking",
    points: [
      "Izinkan akses mikrofon saat diminta browser.",
      "Rekam jawabanmu — bicara dengan jelas dan sesuai instruksi.",
      "Kamu bisa merekam ulang bila belum puas dengan jawabanmu.",
    ],
  },
  structure: {
    title: "Petunjuk Bagian Structure",
    points: [
      "Baca tiap kalimat dengan teliti — ini menguji tata bahasa (grammar).",
      "Pilih jawaban yang melengkapi kalimat dengan benar, atau tandai bagian yang salah.",
      "Andalkan aturan tata bahasa, bukan sekadar bunyi kalimat yang terdengar wajar.",
    ],
  },
};

// audio_url bisa berupa file mp3 (storage) atau link YouTube (disematkan admin).
function youtubeEmbedId(url: string): string | null {
  const m = (url || "").match(/(?:youtube\.com\/watch\?[^#]*\bv=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── [sim-audio-only-v1] Listening YouTube diputar sebagai AUDIO saja ──────────
// Soal listening yang diimpor dari video latihan tes memutar videonya — dan video
// itu MENAMPILKAN tabel soal beserta kunci jawabannya. Siswa cukup mendengar,
// jadi iframe-nya disembunyikan (1px, tak bisa diklik) dan dikendalikan lewat
// YouTube IFrame API dengan kontrol yang bentuknya sama persis dgn <RangedAudio>.
// (Jalan terbaik tetap admin meng-convert videonya jadi MP3 di CMS; ini jaring
// pengaman untuk section lama yang audio_url-nya masih link YouTube.)
let ytApiPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const prev = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => { try { prev?.(); } catch { /* ignore */ } resolve(w.YT); };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return ytApiPromise;
}

function YouTubeAudio({ url, className }: { url: string; className?: string }) {
  const id = youtubeEmbedId(url) ?? "";
  const num = (re: RegExp) => { const m = (url || "").match(re); return m ? Math.max(0, parseInt(m[1], 10) || 0) : 0; };
  const start = num(/[?&](?:start|t)=(\d+)/);
  const end = num(/[?&]end=(\d+)/);

  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(start);
  const [dur, setDur] = useState(0);

  const rEnd = end > 0 ? end : dur;
  const relCur = Math.max(0, cur - start);
  const relDur = Math.max(0, (rEnd || dur) - start);

  useEffect(() => {
    let alive = true;
    let iv: ReturnType<typeof setInterval> | null = null;
    loadYouTubeApi().then((YT) => {
      if (!alive || !hostRef.current) return;
      hostRef.current.innerHTML = "<div></div>";
      playerRef.current = new YT.Player(hostRef.current.firstChild, {
        videoId: id,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, rel: 0, modestbranding: 1, playsinline: 1, start: start || undefined },
        events: {
          onReady: () => {
            if (!alive) return;
            setReady(true);
            try { setDur(playerRef.current.getDuration() || 0); } catch { /* ignore */ }
            iv = setInterval(() => {
              const p = playerRef.current;
              if (!p) return;
              try {
                const t = p.getCurrentTime() || 0;
                setCur(t);
                if (!dur) setDur(p.getDuration() || 0);
                if (end > 0 && t >= end) p.pauseVideo();
              } catch { /* ignore */ }
            }, 300);
          },
          onStateChange: (e: any) => {
            const YTS = (window as any).YT?.PlayerState;
            if (!YTS) return;
            setPlaying(e.data === YTS.PLAYING);
          },
        },
      });
    });
    return () => {
      alive = false;
      if (iv) clearInterval(iv);
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, start, end]);

  const seekTo = (abs: number) => {
    const p = playerRef.current; if (!p) return;
    const hi = rEnd > 0 ? rEnd : (dur || abs);
    const t = Math.min(hi, Math.max(start, abs));
    try { p.seekTo(t, true); } catch { /* ignore */ }
    setCur(t);
  };
  const skip = (d: number) => seekTo(cur + d);
  const toggle = () => {
    const p = playerRef.current; if (!p) return;
    try {
      if (playing) p.pauseVideo();
      else {
        if (cur < start || (rEnd > 0 && cur >= rEnd)) seekTo(start);
        p.playVideo();
      }
    } catch { /* ignore */ }
  };

  return (
    <div className={`relative flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 ${className ?? ""}`}>
      {/* Iframe wajib tetap ada di DOM & tidak display:none supaya audionya jalan. */}
      <div ref={hostRef} aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-px w-px overflow-hidden opacity-0" />
      <button type="button" onClick={() => skip(-10)} title="Mundur 10 detik" className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
        <RotateCcw className="h-4 w-4" /><span className="absolute text-[7px] font-bold">10</span>
      </button>
      <button type="button" onClick={toggle} disabled={!ready} title={playing ? "Jeda" : "Putar"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50" style={{ background: TEAL }}>
        {!ready ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>
      <button type="button" onClick={() => skip(10)} title="Maju 10 detik" className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
        <RotateCw className="h-4 w-4" /><span className="absolute text-[7px] font-bold">10</span>
      </button>
      <span className="w-9 shrink-0 text-right text-[11px] font-medium tabular-nums text-slate-500">{clock(relCur)}</span>
      <input
        type="range" min={0} max={relDur || 0} step={1} value={Math.min(relCur, relDur || 0)}
        onChange={(e) => seekTo(start + Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer accent-teal-600"
        aria-label="Geser posisi audio"
      />
      <span className="w-9 shrink-0 text-[11px] font-medium tabular-nums text-slate-400">{clock(relDur)}</span>
    </div>
  );
}

// Audio mp3 bisa dipotong admin → tersimpan sbg media fragment `#t=start,end`.
// Native <audio> tak selalu berhenti di `end`, jadi diproses manual: seek ke
// start & pause saat mencapai end. base = URL tanpa fragment.
function parseAudioTrim(url: string): { base: string; start: number; end: number } {
  const hash = (url || "").indexOf("#t=");
  if (hash < 0) return { base: url || "", start: 0, end: 0 };
  const base = url.slice(0, hash);
  const m = url.slice(hash + 3).match(/^(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?/);
  return {
    base,
    start: m ? Math.max(0, Math.floor(Number(m[1]) || 0)) : 0,
    end: m && m[2] != null ? Math.max(0, Math.floor(Number(m[2]) || 0)) : 0,
  };
}
// mm:ss dari detik untuk timestamp player.
function clock(s: number): string {
  s = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Player audio kustom: seekbar + timestamp jelas, tombol ±10 detik. Menghormati
// potongan (#t=start,end) — waktu ditampilkan relatif terhadap bagian yang dipotong.
function RangedAudio({ url, className }: { url: string; className?: string }) {
  const { base, start, end } = parseAudioTrim(url);
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(start);
  const [dur, setDur] = useState(0);

  const rEnd = end > 0 ? end : dur;                 // titik akhir efektif
  const relCur = Math.max(0, cur - start);          // posisi relatif terhadap trim
  const relDur = Math.max(0, (rEnd || dur) - start);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onMeta = () => { setDur(a.duration || 0); if (start > 0) { try { a.currentTime = start; } catch { /* ignore */ } setCur(start); } };
    const onTime = () => { setCur(a.currentTime); if (end > 0 && a.currentTime >= end) a.pause(); };
    const onPlay = () => setPlaying(true);
    const onStop = () => setPlaying(false);
    if (a.readyState >= 1) onMeta();
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onStop);
    a.addEventListener("ended", onStop);
    return () => {
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onStop);
      a.removeEventListener("ended", onStop);
    };
  }, [base, start, end]);

  const seekTo = (abs: number) => {
    const a = ref.current; if (!a) return;
    const hi = rEnd > 0 ? rEnd : (a.duration || abs);
    const t = Math.min(hi, Math.max(start, abs));
    a.currentTime = t; setCur(t);
  };
  const skip = (d: number) => seekTo((ref.current?.currentTime ?? start) + d);
  const toggle = () => {
    const a = ref.current; if (!a) return;
    if (a.paused) { if (a.currentTime < start || (rEnd > 0 && a.currentTime >= rEnd)) seekTo(start); a.play().catch(() => {}); }
    else a.pause();
  };

  return (
    <div className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 ${className ?? ""}`}>
      <audio key={base} ref={ref} src={base} preload="metadata" className="hidden" />
      <button type="button" onClick={() => skip(-10)} title="Mundur 10 detik" className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
        <RotateCcw className="h-4 w-4" /><span className="absolute text-[7px] font-bold">10</span>
      </button>
      <button type="button" onClick={toggle} title={playing ? "Jeda" : "Putar"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: TEAL }}>
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>
      <button type="button" onClick={() => skip(10)} title="Maju 10 detik" className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
        <RotateCw className="h-4 w-4" /><span className="absolute text-[7px] font-bold">10</span>
      </button>
      <span className="w-9 shrink-0 text-right text-[11px] font-medium tabular-nums text-slate-500">{clock(relCur)}</span>
      <input
        type="range" min={0} max={relDur || 0} step={0.1} value={Math.min(relCur, relDur || 0)}
        onChange={(e) => seekTo(start + Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer accent-teal-600"
        aria-label="Geser posisi audio"
      />
      <span className="w-9 shrink-0 text-[11px] font-medium tabular-nums text-slate-400">{clock(relDur)}</span>
    </div>
  );
}

type AnswerState = { selected_index: number | null; text: string; audioBlob: Blob | null; audioUrl: string | null };
type Phase = "loading" | "guestform" | "intro" | "running" | "grading" | "result" | "noauth" | "notfound" | "promoexhausted";
// ── Fullscreen API lintas-browser ────────────────────────────────────────────
// Safari memakai prefiks `webkit`; versi unprefixed saja bikin fitur diam-diam
// mati (requestFullscreen/exitFullscreen/fullscreenElement = undefined → `?.()`
// short-circuit tanpa error). Helper ini coba unprefixed dulu, lalu webkit.
function fsElement(): Element | null {
  if (typeof document === "undefined") return null;
  return (document.fullscreenElement || (document as any).webkitFullscreenElement) ?? null;
}
function requestFs(el: HTMLElement) {
  const fn = el.requestFullscreen || (el as any).webkitRequestFullscreen;
  try { const p = fn?.call(el); if (p && typeof p.catch === "function") p.catch(() => { /* diblokir */ }); } catch { /* ignore */ }
}
function exitFs() {
  if (typeof document === "undefined") return;
  const fn = document.exitFullscreen || (document as any).webkitExitFullscreen;
  try { fn?.call(document); } catch { /* ignore */ }
}

export default function SimulasiRunnerPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const searchParams = useSearchParams();
  const preview = searchParams?.get("preview") === "1"; // POV siswa untuk admin/curriculum

  const [phase, setPhase] = useState<Phase>("loading");
  const [sim, setSim] = useState<Simulation | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [info, setInfo] = useState<StudentInfo | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [secIdx, setSecIdx] = useState(0);
  const [maxSecIdx, setMaxSecIdx] = useState(0);
  // Halaman soal aktif dalam bagian sekarang (paginasi tiap PAGE_SIZE soal).
  const [qPage, setQPage] = useState(0);
  // Tiap bagian diawali layar "intro/petunjuk" sebelum soalnya. Set = bagian yang
  // intronya sudah dilewati (siswa klik "Mulai bagian ini") → tampil soal.
  const [introDone, setIntroDone] = useState<Set<number>>(new Set());
  const dismissIntro = (si: number) => setIntroDone((prev) => { const n = new Set(prev); n.add(si); return n; });
  // Layar penuh (fokus ala ujian). Dipanggil dari gesture user (klik Mulai) supaya
  // tak diblokir browser; abaikan bila gagal (mis. izin ditolak).
  const enterFullscreen = () => { if (!fsElement()) requestFs(document.documentElement); };
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [results, setResults] = useState<ResultItem[]>([]);
  const [totals, setTotals] = useState({ score: 0, max_score: 0, auto_score: 0, ai_score: 0 });
  const [gradingMsg, setGradingMsg] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  // [sim-subtes-v1] hub "Detail Tryout" (daftar subtes) vs sedang mengerjakan satu subtes.
  const [view, setView] = useState<"hub" | "work">("hub");
  // Deadline & waktu mulai per subtes (key = skill) — absolut, jadi sisa waktu
  // tetap benar walau siswa keluar-masuk halaman.
  const [groupDeadlines, setGroupDeadlines] = useState<Record<string, number>>({});
  const [groupStartedAt, setGroupStartedAt] = useState<Record<string, number>>({});
  const [groupDone, setGroupDone] = useState<Set<string>>(new Set());
  // Cermin groupDone di ref → pengaman anti dobel-finish dari tick interval
  // (closure interval memegang state basi).
  const finishedRef = useRef<Set<string>>(new Set());
  // [sim-proctor-v1] hitungan pelanggaran + pesan peringatan yang sedang tampil.
  const [violations, setViolations] = useState(0);
  const violationsRef = useRef(0);
  const [violationMsg, setViolationMsg] = useState<string | null>(null);
  const [promo, setPromo] = useState<PromoAttemptStatus | null>(null); // jatah gratis (null = tak dibatasi)
  const [guestTitle, setGuestTitle] = useState<string>(""); // judul sim di form identitas tamu
  const [guestBusy, setGuestBusy] = useState(false);
  const submittingRef = useRef(false);
  // Sesi lama (>24 jam) yang baru dibuka lagi → kumpulkan otomatis, lihat efek
  // di bawah definisi submit().
  const [staleResume, setStaleResume] = useState(false);

  // Ambil paket soal + siapkan state jawaban, lalu tampilkan layar intro.
  async function loadExam(studentInfo: StudentInfo) {
    setInfo(studentInfo);
    const { simulation, sections: secs, questions: qs } = await fetchSimulation(id, preview);
    if (!simulation) { setPhase("notfound"); return; }
    // Section tanpa soal (mis. divider "Reading Comprehension" hasil impor yang
    // cuma berisi petunjuk) tak ada yang bisa dikerjakan → sembunyikan dari siswa
    // supaya tak muncul bagian "Tidak ada soal di bagian ini".
    const secsWithQs = secs.filter((s) => qs.some((q) => q.section_id === s.id));
    const keepIds = new Set(secsWithQs.map((s) => s.id));
    const shownQs = qs.filter((q) => keepIds.has(q.section_id));
    setSim(simulation); setSections(secsWithQs); setQuestions(shownQs);
    const init: Record<string, AnswerState> = {};
    shownQs.forEach((q) => { init[q.id] = { selected_index: null, text: "", audioBlob: null, audioUrl: null }; });
    setAnswers(init);
    // promo-code-v1: kalau akses dari kode gratis, ambil sisa jatah utk ditampilkan
    // di intro & dicek ulang saat mulai. Non-promo/berbayar → null (tak dibatasi).
    if (!preview && studentInfo.user_id) {
      try { setPromo(await getPromoAttemptStatus(simulation.test_type)); } catch { setPromo(null); }
    }
    // Ada progres berjalan yang tersimpan? → lanjutkan dari sisa waktu & jawaban
    // sebelumnya (lompati layar intro). Audio rekaman lokal tak ikut dipulihkan.
    // Utamakan key uid saat ini; fallback pindai semua key sim ini supaya sesi
    // yang tersimpan di bawah identitas berbeda (race auth / tamu) tetap bisa dilanjut.
    const saved = preview ? null : (readProgress(id, studentInfo.user_id) ?? readAnyProgress(id));
    if (saved) {
      const restored = { ...init };
      Object.entries(saved.answers || {}).forEach(([qid, v]) => {
        if (restored[qid]) restored[qid] = { selected_index: v.selected_index ?? null, text: v.text ?? "", audioBlob: null, audioUrl: v.audioUrl ?? null };
      });
      setAnswers(restored);
      setAttemptId(saved.attemptId);
      setSecIdx(Math.min(saved.secIdx ?? 0, Math.max(0, secsWithQs.length - 1)));
      setMaxSecIdx(saved.maxSecIdx ?? 0);
      setIntroDone(new Set(saved.introDone ?? []));
      setQPage(saved.qPage ?? 0);
      // [sim-subtes-v1] pulihkan state per-subtes; selalu mendarat di hub —
      // siswa masuk lagi ke subtes berjalan lewat tombol "Lanjutkan".
      setGroupDeadlines(saved.groupDeadlines ?? {});
      setGroupStartedAt(saved.groupStartedAt ?? {});
      setGroupDone(new Set(saved.groupDone ?? []));
      finishedRef.current = new Set(saved.groupDone ?? []);
      violationsRef.current = saved.violations ?? 0;
      setViolations(saved.violations ?? 0);
      // [sim-idle-expire-v1] Ditinggal lebih dari sehari → sesinya sudah lewat;
      // jawaban yang tersimpan dikumpulkan otomatis begitu state siap.
      if (saved.savedAt && Date.now() - saved.savedAt > IDLE_EXPIRE_MS) setStaleResume(true);
      setView("hub");
      setPhase("running");
      return;
    }
    setPhase("intro");
  }

  useEffect(() => {
    (async () => {
      let studentInfo = await getStudentInfo();
      if (!studentInfo) {
        if (preview) {
          studentInfo = { user_id: null, name: "Preview", email: "preview@linguo.id", whatsapp: null }; // dummy, tak disimpan
        } else {
          // Belum login → intip mode akses. Simulasi mode tamu (B2B) diarahkan ke
          // form identitas (bisa dikerjakan tanpa akun); selain itu wajib login.
          const peek = await peekSimulationAccess(id);
          if (peek?.is_published && peek.access_mode === "guest") {
            setGuestTitle(peek.title); setPhase("guestform"); return;
          }
          setPhase("noauth"); return;
        }
      }
      await loadExam(studentInfo);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, preview]);

  // Submit form identitas tamu → buka sesi anonymous lalu muat soal.
  async function submitGuest(name: string, email: string, whatsapp: string) {
    if (guestBusy) return;
    setGuestBusy(true);
    const studentInfo = await startGuestSession(name, email || null, whatsapp || null);
    if (!studentInfo) {
      setGuestBusy(false);
      alert("Gagal memulai sesi tamu. Coba lagi, atau hubungi admin bila terus berulang.");
      return;
    }
    setPhase("loading");
    await loadExam(studentInfo);
    setGuestBusy(false);
  }

  // Catat bagian terjauh yang pernah dibuka — soal di bagian yang sudah dilewati
  // namun belum dijawab dianggap "dilewati" (ditandai merah di navigasi).
  useEffect(() => { setMaxSecIdx((m) => Math.max(m, secIdx)); }, [secIdx]);

  // Simpan progres tiap kali jawaban/posisi berubah selama tes berjalan → bisa
  // keluar & lanjut lagi dari sisa waktu yang sama. Preview tak disimpan.
  useEffect(() => {
    if (preview || phase !== "running" || !attemptId || !info) return;
    const ser: SavedProgress["answers"] = {};
    Object.entries(answers).forEach(([qid, a]) => { ser[qid] = { selected_index: a.selected_index, text: a.text, audioUrl: a.audioUrl }; });
    saveProgress(id, info.user_id, {
      v: 2, attemptId, deadline: null, answers: ser, secIdx, maxSecIdx, introDone: [...introDone], qPage, savedAt: Date.now(),
      groupDeadlines, groupStartedAt, groupDone: [...groupDone], violations,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, phase, attemptId, answers, secIdx, maxSecIdx, introDone, qPage, groupDeadlines, groupStartedAt, groupDone, violations]);

  const setAns = (qid: string, patch: Partial<AnswerState>) =>
    setAnswers((p) => ({ ...p, [qid]: { ...p[qid], ...patch } }));

  // Penomoran soal RESET ke 1 tiap bagian (part), mengikuti struktur ujian asli
  // (mis. TOEFL ITP: tiap Part A/B/C & Structure mulai dari 1 lagi) — bukan
  // menyambung sepanjang tes. `questions` sudah terurut per section dari
  // fetchSimulation; ikuti urutan `sections` supaya konsisten dgn navigasi.
  const qNumber = useMemo(() => {
    const m: Record<string, number> = {};
    sections.forEach((s) => {
      let n = 1;
      questions.filter((q) => q.section_id === s.id).forEach((q) => { m[q.id] = n++; });
    });
    return m;
  }, [questions, sections]);

  // Loncat ke soal tertentu lewat navigasi: pindah bagian lalu scroll ke soalnya.
  function goToQuestion(targetSecIdx: number, qid: string) {
    setSecIdx(targetSecIdx);
    dismissIntro(targetSecIdx); // loncat ke nomor soal → lewati layar intro bagian
    // Pindah ke halaman yang memuat soal tujuan (paginasi PAGE_SIZE soal/halaman).
    const targetSecId = sections[targetSecIdx]?.id;
    const idxInSec = questions.filter((q) => q.section_id === targetSecId).findIndex((q) => q.id === qid);
    setQPage(idxInSec >= 0 ? Math.floor(idxInSec / PAGE_SIZE) : 0);
    requestAnimationFrame(() => setTimeout(() => {
      const el = document.getElementById(`q-${qid}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-teal-400");
      setTimeout(() => el?.classList.remove("ring-2", "ring-teal-400"), 1200);
    }, 60));
  }

  // [sim-subtes-v1] Kelompokkan bagian per skill → SUBTES (kartu di hub Detail
  // Tryout). Satu subtes bisa berisi beberapa part (mis. Listening Part A/B/C)
  // yang berbagi SATU timer subtes.
  type SkillGroup = { skill: Skill; secIdxs: number[]; qCount: number };
  const skillGroups = useMemo<SkillGroup[]>(() => {
    const arr: SkillGroup[] = [];
    sections.forEach((s, i) => {
      let g = arr.find((x) => x.skill === s.skill);
      if (!g) { g = { skill: s.skill, secIdxs: [], qCount: 0 }; arr.push(g); }
      g.secIdxs.push(i);
      g.qCount += questions.filter((q) => q.section_id === s.id).length;
    });
    // [sim-subtes-urut-v1] Urutkan subtes seperti ujian aslinya — TOEFL ITP:
    // Listening → Structure → Reading; IELTS: Listening → Reading → Writing →
    // Speaking. Satu daftar SKILL_SEQUENCE memenuhi keduanya.
    return arr.sort((a, b) => SKILL_SEQUENCE.indexOf(a.skill) - SKILL_SEQUENCE.indexOf(b.skill));
  }, [sections, questions]);

  // Durasi subtes: jumlah durasi bagian-bagiannya; kalau admin tak mengisi,
  // bagi durasi total efektif proporsional jumlah soalnya (min 5 menit).
  const effTotalMin = useMemo(() => (sim ? effectiveDurationMinutes(sim, sections) : 0), [sim, sections]);
  const groupDurationMin = (g: SkillGroup) => {
    const own = g.secIdxs.reduce((n, si) => n + (sections[si]?.duration_minutes || 0), 0);
    if (own > 0) return own;
    const totalQ = questions.length || 1;
    return Math.max(5, Math.round((effTotalMin * g.qCount) / totalQ)) || 30;
  };
  const groupQuestions = (g: SkillGroup) =>
    g.secIdxs.flatMap((si) => questions.filter((q) => q.section_id === sections[si]?.id));
  const groupAnswered = (g: SkillGroup) =>
    groupQuestions(g).filter((q) => isAnswered(q, answers[q.id])).length;

  // Subtes yang memuat bagian aktif (dipakai saat view "work").
  const activeGroup = useMemo(
    () => skillGroups.find((g) => g.secIdxs.includes(secIdx)) ?? null,
    [skillGroups, secIdx],
  );
  const activeDeadline = activeGroup ? groupDeadlines[activeGroup.skill] ?? null : null;

  // Mulai / lanjutkan subtes dari hub. Deadline & cap waktu mulai hanya diisi
  // sekali (klik "Lanjutkan" tidak me-reset sisa waktu).
  function startGroup(skill: Skill) {
    const g = skillGroups.find((x) => x.skill === skill);
    if (!g || groupDone.has(skill)) return;
    // [sim-subtes-urut-v1] Wajib urut: hanya subtes terdepan yang belum selesai.
    const next = skillGroups.find((x) => !groupDone.has(x.skill));
    if (next && next.skill !== skill) return;
    enterFullscreen();
    const now = Date.now();
    setGroupDeadlines((p) => (p[skill] ? p : { ...p, [skill]: now + groupDurationMin(g) * 60_000 }));
    setGroupStartedAt((p) => (p[skill] ? p : { ...p, [skill]: now }));
    setSecIdx(g.secIdxs[0]);
    setQPage(0);
    setView("work");
  }

  // Tutup subtes aktif (manual setelah kunci lewat, atau otomatis saat waktu
  // subtes habis). Subtes terakhir selesai → seluruh jawaban dikumpulkan.
  function finishGroup(auto = false) {
    const g = activeGroup;
    if (!g || finishedRef.current.has(g.skill)) return;
    if (!auto && !preview) {
      const un = groupQuestions(g).filter((q) => !isAnswered(q, answers[q.id])).length;
      if (un > 0 && !window.confirm(`Masih ada ${un} soal belum dijawab di subtes ini. Subtes yang sudah diselesaikan TIDAK bisa dibuka lagi. Yakin selesai?`)) return;
    }
    finishedRef.current.add(g.skill);
    setGroupDone(new Set(finishedRef.current));
    if (finishedRef.current.size >= skillGroups.length) { submit(true); return; }
    setView("hub");
  }
  // Ref ke versi terbaru — tick interval/listeners memanggil lewat ref supaya
  // tidak menggenggam state basi (answers dkk. berubah tiap detik).
  const finishGroupRef = useRef(finishGroup);
  finishGroupRef.current = finishGroup;

  async function start() {
    if (!sim || !info) return;
    // promo-code-v1: cek ulang jatah gratis tepat sebelum mulai (hindari race /
    // buka tab lama). Jatah habis → layar "kesempatan gratis habis".
    if (!preview && info.user_id) {
      const ps = await getPromoAttemptStatus(sim.test_type);
      setPromo(ps);
      if (ps?.blocked) { setPhase("promoexhausted"); return; }
    }
    enterFullscreen(); // masuk layar penuh saat mulai (fokus ala ujian)
    if (preview) {
      setAttemptId("preview"); // tak menyimpan attempt sungguhan
    } else {
      const aid = await createAttempt(sim.id, info);
      if (!aid) { alert("Gagal memulai simulasi. Coba lagi."); return; }
      setAttemptId(aid);
    }
    // [sim-subtes-v1] tidak ada lagi timer global — masuk hub Detail Tryout;
    // countdown baru jalan per subtes saat siswa menekan "Mulai" di kartunya.
    setView("hub");
    setPhase("running");
  }

  // Countdown timer subtes aktif — waktu subtes habis → subtes dikunci otomatis
  // (dan bila itu subtes terakhir, seluruh jawaban dikumpulkan).
  useEffect(() => {
    if (phase !== "running" || view !== "work" || !activeDeadline) { setRemaining(null); return; }
    const tick = () => {
      const secs = Math.max(0, Math.round((activeDeadline - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) finishGroupRef.current(true); // lewat ref → state selalu segar
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase, view, activeDeadline]);

  // Di hub: subtes yang deadline-nya sudah lewat (mis. siswa menutup tab lalu
  // kembali) dikunci otomatis; kalau semuanya selesai, langsung kumpulkan.
  useEffect(() => {
    if (phase !== "running" || view !== "hub" || skillGroups.length === 0) return;
    const now = Date.now();
    let changed = false;
    skillGroups.forEach((g) => {
      const dl = groupDeadlines[g.skill];
      if (dl && dl <= now && !finishedRef.current.has(g.skill)) { finishedRef.current.add(g.skill); changed = true; }
    });
    if (!changed) return;
    setGroupDone(new Set(finishedRef.current));
    if (finishedRef.current.size >= skillGroups.length) submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, view, skillGroups, groupDeadlines]);

  // [sim-proctor-v1] Proctoring anti-curang — aktif hanya saat mengerjakan subtes
  // (bukan preview): pindah tab/minimize & keluar layar penuh = pelanggaran;
  // klik kanan + copy/paste diblokir diam-diam. MAX_VIOLATIONS → auto-submit.
  const submitRef = useRef<(force?: boolean) => Promise<void>>(submit);
  submitRef.current = submit;

  // [sim-idle-expire-v1] Sesi kedaluwarsa (>24 jam) yang baru dibuka lagi:
  // langsung dikumpulkan apa adanya, tak boleh dilanjutkan.
  useEffect(() => {
    if (!staleResume || preview || phase !== "running" || !attemptId) return;
    setStaleResume(false);
    alert("Sesi simulasi ini sudah lewat dari 24 jam, jadi otomatis dikumpulkan. Jawaban yang sempat tersimpan tetap dinilai.");
    submitRef.current(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staleResume, preview, phase, attemptId]);

  useEffect(() => {
    if (preview || phase !== "running" || view !== "work") return;
    const violate = (msg: string) => {
      if (leavingSim || submittingRef.current) return;
      violationsRef.current += 1;
      setViolations(violationsRef.current);
      if (violationsRef.current >= MAX_VIOLATIONS) {
        setViolationMsg(null);
        submitRef.current(true); // 3× pelanggaran → jawaban dikumpulkan paksa
      } else {
        setViolationMsg(msg);
      }
    };
    const onVis = () => { if (document.visibilityState === "hidden") violate("Kamu terdeteksi berpindah tab / meninggalkan layar ujian."); };
    const onFs = () => { if (!fsElement()) violate("Kamu terdeteksi keluar dari mode layar penuh."); };

    // [sim-proctor-v2] Pindah APLIKASI/jendela lain (Alt+Tab, Cmd+Tab, klik
    // jendela lain, minimize) sering TIDAK memicu visibilitychange → pakai
    // window blur. Dua penjaga anti false-positive:
    //  1. fokus pindah ke <iframe> (player YouTube listening) — bukan curang;
    //  2. cek ulang setelah jeda: kalau fokus balik lagi, abaikan.
    let blurTimer: ReturnType<typeof setTimeout> | null = null;
    const onBlur = () => {
      if (document.activeElement?.tagName === "IFRAME") return;
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (document.hasFocus() || document.activeElement?.tagName === "IFRAME") return;
        violate("Kamu terdeteksi berpindah ke aplikasi/jendela lain.");
      }, 600);
    };
    const onFocus = () => { if (blurTimer) { clearTimeout(blurTimer); blurTimer = null; } };

    const block = (e: Event) => e.preventDefault();

    // [sim-proctor-v2] Pintasan keyboard yang dipakai untuk mencari jawaban /
    // menyalin soal diblokir. Yang di luar kuasa halaman (Alt+Tab, Cmd+Tab,
    // Ctrl+T/N/W, tombol Home OS) tetap tertangkap sebagai pelanggaran lewat
    // blur / visibilitychange di atas.
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      const editable = (e.target as HTMLElement | null)?.closest?.("input, textarea, [contenteditable='true']");
      // DevTools / lihat kode sumber / print / simpan halaman → pelanggaran.
      const devtools =
        k === "f12" ||
        (mod && e.shiftKey && ["i", "j", "c"].includes(k)) ||
        (mod && ["u", "p", "s"].includes(k));
      if (devtools) {
        e.preventDefault();
        violate("Pintasan terlarang (devtools/print/simpan halaman) terdeteksi.");
        return;
      }
      // Tab baru / jendela baru / cari di halaman → diblokir diam-diam.
      if (mod && ["t", "n", "f", "g", "o"].includes(k) && !e.altKey) { e.preventDefault(); return; }
      // Salin / potong / tempel: dilarang di area soal. Di kotak jawaban esai,
      // salin & pilih-semua tulisan sendiri tetap boleh; TEMPEL tetap dilarang
      // (mencegah menempel jawaban dari luar).
      if (mod && ["c", "x", "a"].includes(k) && !editable) { e.preventDefault(); return; }
      if (mod && k === "v") { e.preventDefault(); return; }
    };

    const onPrint = () => violate("Mencetak / menyimpan halaman soal tidak diizinkan.");

    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs); // Safari
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("dragstart", block); // seret teks soal keluar
    document.addEventListener("drop", block);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("beforeprint", onPrint);
    return () => {
      if (blurTimer) clearTimeout(blurTimer);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("drop", block);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeprint", onPrint);
    };
  }, [preview, phase, view]);

  // [sim-proctor-v2] Tutup/segarkan tab saat mengerjakan → konfirmasi bawaan
  // browser, supaya siswa tak "kabur" dari sesi tanpa sadar (Ctrl+W/F5 tak bisa
  // diblokir dari halaman).
  useEffect(() => {
    if (preview || phase !== "running" || view !== "work") return;
    const onUnload = (e: BeforeUnloadEvent) => {
      if (leavingSim || submittingRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [preview, phase, view]);

  async function submit(force = false) {
    if (!sim || !attemptId) return;
    if (submittingRef.current) return;

    // Blokir submit manual bila masih ada soal yang belum dijawab (kecuali waktu habis).
    if (!force) {
      const unanswered = questions.filter((q) => !isAnswered(q, answers[q.id]));
      if (unanswered.length > 0) {
        alert(`Masih ada ${unanswered.length} soal yang belum dijawab. Lengkapi semua soal dulu sebelum mengirim — cek panel Navigasi Soal (tanda merah = terlewati).`);
        return;
      }
    }

    submittingRef.current = true;
    setPhase("grading");

    const payloads: AnswerPayload[] = [];
    const resultItems: ResultItem[] = [];
    let autoScore = 0, aiScore = 0, maxScore = 0;
    const skillOf: Record<string, string> = {};
    sections.forEach((s) => questions.filter((q) => q.section_id === s.id).forEach((q) => { skillOf[q.id] = s.skill; }));
    // Judul bagian dipakai halaman hasil untuk mengelompokkan pembahasan per subtes.
    const sectionTitleOf: Record<string, string> = {};
    sections.forEach((s) => { sectionTitleOf[s.id] = s.title; });

    let aiCount = 0;
    questions.forEach((q) => { if (!AUTO_GRADED.includes(q.type)) aiCount++; });
    let aiDone = 0;

    for (const q of questions) {
      const skill = (skillOf[q.id] as any) || "reading";
      const a = answers[q.id] ?? { selected_index: null, text: "", audioBlob: null, audioUrl: null };
      maxScore += q.points;
      // Konteks jawaban siswa — dilampirkan ke tiap ResultItem di bawah.
      const meta = {
        section_id: q.section_id,
        section_title: sectionTitleOf[q.section_id] || "",
        answer_index: a.selected_index,
        answer_text: a.text || "",
      };

      if (AUTO_GRADED.includes(q.type)) {
        const { correct, points } = gradeObjective(q, a.selected_index, a.text);
        autoScore += points;
        payloads.push({
          question_id: q.id, section_skill: skill,
          response_text: a.text || null, audio_url: null, selected_index: a.selected_index,
          is_correct: correct, points_earned: points, ai_score: null, ai_feedback: null,
        });
        resultItems.push({ question: q, skill, correct, points, ai_score: null, ai_feedback: null, ...meta, answer_audio_url: null });
      } else if (preview) {
        // Mode preview — tidak memanggil AI (hemat biaya), tampilkan placeholder.
        resultItems.push({ question: q, skill, correct: null, points: 0, ai_score: null, ai_feedback: "Mode preview — Writing/Speaking tidak dinilai.", ...meta, answer_audio_url: a.audioUrl });
      } else {
        // Writing / Speaking → AI
        aiDone++;
        setGradingMsg(`Menilai jawaban ${q.type === "speaking_task" ? "speaking" : "writing"} (${aiDone}/${aiCount}) secara otomatis…`);
        let audioUrl: string | null = a.audioUrl;
        if (q.type === "speaking_task" && a.audioBlob && !audioUrl) {
          audioUrl = await uploadRecording(attemptId, q.id, a.audioBlob);
        }
        const graded = await gradeWithAI({
          test_type: sim.test_type,
          skill: q.type === "speaking_task" ? "speaking" : "writing",
          prompt: q.prompt,
          rubric: q.explanation || undefined,
          response_text: a.text || undefined,
          audio_url: audioUrl || undefined,
          image_url: q.image_url || undefined,
        });
        const ai = graded?.score ?? null;
        const earned = ai != null ? (q.points * ai) / 100 : 0;
        aiScore += earned;
        const respText = a.text || graded?.transcript || null;
        payloads.push({
          question_id: q.id, section_skill: skill,
          response_text: respText, audio_url: audioUrl,
          selected_index: null, is_correct: null, points_earned: earned,
          ai_score: ai, ai_feedback: graded?.feedback ?? null,
        });
        resultItems.push({
          question: q, skill, correct: null, points: earned, ai_score: ai, ai_feedback: graded?.feedback ?? null,
          ...meta, answer_text: respText || "", answer_audio_url: audioUrl,
        });
      }
    }

    const score = autoScore + aiScore;
    const t = { score, max_score: maxScore, auto_score: autoScore, ai_score: aiScore };
    if (!preview) { // mode preview tidak menyimpan attempt/jawaban ke database
      await saveAnswers(attemptId, payloads);
      await finalizeAttempt(attemptId, t);
      clearProgress(id, info?.user_id); // tes selesai → buang progres tersimpan
    }
    setTotals(t);
    setResults(resultItems);
    setPhase("result");
  }

  // ── Render states ──────────────────────────────────────────────────────────
  if (phase === "loading") return <Centered><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></Centered>;

  if (phase === "guestform") return (
    <GuestIdentityForm title={guestTitle} busy={guestBusy} onSubmit={submitGuest} />
  );

  if (phase === "noauth") return (
    <Centered>
      <div className="text-center">
        <p className="text-sm text-slate-600">Masuk dulu untuk mengerjakan simulasi.</p>
        <Link href="/akun" className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ background: TEAL }}>
          Masuk / Daftar <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Centered>
  );

  if (phase === "notfound") return (
    <Centered>
      <div className="text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm text-slate-600">Simulasi tidak tersedia. Mungkin belum dipublikasikan, atau kamu belum punya akses paketnya.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link href="/simulasi/paket" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ background: TEAL }}>
            Beli Paket <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/akun?menu=simulasi" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            <ArrowLeft className="h-4 w-4" />Kembali ke daftar
          </Link>
        </div>
      </div>
    </Centered>
  );

  // promo-code-v1: jatah gratis (kode promo) sudah habis.
  if (phase === "promoexhausted") return (
    <Centered>
      <div className="text-center">
        <Sparkles className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-2 font-semibold text-slate-800">Kesempatan gratis sudah habis</p>
        <p className="mt-1 text-sm text-slate-500">
          Kamu sudah memakai {promo?.limit ?? 3}× kesempatan coba gratis untuk tes ini.
          Beli paket untuk akses penuh tanpa batas.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link href="/simulasi/paket" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ background: TEAL }}>
            Beli Paket <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/akun?menu=simulasi" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            <ArrowLeft className="h-4 w-4" />Kembali ke daftar
          </Link>
        </div>
      </div>
    </Centered>
  );

  if (!sim) return null;

  if (phase === "grading") return (
    <Centered>
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" style={{ color: TEAL }} />
        <p className="mt-3 font-semibold text-slate-800">Menilai jawaban kamu…</p>
        <p className="mt-1 text-sm text-slate-500">{gradingMsg || "Mohon tunggu sebentar."}</p>
      </div>
    </Centered>
  );

  if (phase === "result") return (
    <ResultView sim={sim} sections={sections} totals={totals} results={results} preview={preview} studentName={info?.name} attemptId={attemptId} />
  );

  // intro — onboarding wizard 3 langkah sebelum mulai mengerjakan
  if (phase === "intro") {
    return (
      <Shell sim={sim} preview={preview}>
        <IntroWizard sim={sim} sections={sections} questions={questions} onStart={start} promo={promo} />
      </Shell>
    );
  }

  // ── [sim-subtes-v1] HUB "Detail Tryout": daftar subtes terpisah ala CBT ─────
  if (view === "hub") {
    const inProgress = skillGroups.find((g) => groupDeadlines[g.skill] != null && !groupDone.has(g.skill)) ?? null;
    const totalDur = skillGroups.reduce((n, g) => n + groupDurationMin(g), 0);
    // [sim-subtes-urut-v1] Hanya subtes terdepan yang belum selesai yang boleh
    // dibuka — sisanya terkunci sampai giliran (urut seperti ujian asli).
    const nextGroup = skillGroups.find((g) => !groupDone.has(g.skill)) ?? null;
    return (
      <Shell sim={sim} preview={preview} confirmExit>
        <div className="rounded-2xl p-6 text-white sm:p-8" style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DEEP} 100%)` }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Detail Tryout · {testTypeLabel(sim.test_type, sim.test_variant)}</p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">{sim.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-white/90">
            <span className="inline-flex items-center gap-1.5"><ListChecks className="h-4 w-4" />{questions.length} soal · {skillGroups.length} subtes</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />± {totalDur} menit total</span>
            {!preview && <span className="inline-flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" />Proctoring aktif</span>}
          </div>
        </div>

        {violations > 0 && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Pelanggaran tercatat: {violations}/{MAX_VIOLATIONS}. Mencapai {MAX_VIOLATIONS}× → jawaban otomatis dikumpulkan.
          </p>
        )}

        <h2 className="mt-6 mb-3 text-sm font-bold text-slate-800">Subtes yang diujikan</h2>
        <div className="space-y-3">
          {skillGroups.map((g) => {
            const Icon = SKILL_ICON[g.skill];
            const gQs = groupQuestions(g);
            const ans = groupAnswered(g);
            const dur = groupDurationMin(g);
            const done = groupDone.has(g.skill);
            const started = groupDeadlines[g.skill] != null && !done;
            // Terkunci bila bukan giliran (belum tiba urutannya) atau ada subtes
            // lain yang sedang berjalan.
            const myTurn = nextGroup?.skill === g.skill;
            const blocked = !done && !started && (!myTurn || !!inProgress);
            const waitFor = !myTurn && nextGroup ? nextGroup : inProgress;
            return (
              <div key={g.skill} className={`flex items-center gap-4 rounded-2xl border bg-white p-4 sm:p-5 ${done ? "border-emerald-200" : started ? "border-teal-300" : "border-slate-200"}`}>
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${done ? "bg-emerald-50 text-emerald-600" : "bg-teal-50 text-teal-700"}`}>
                  {done ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{SKILL_LABEL[g.skill]}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500 tabular-nums">
                    {ans}/{gQs.length} Soal · {dur} Menit{g.secIdxs.length > 1 ? ` · ${g.secIdxs.length} part` : ""}
                  </p>
                  <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    done ? "bg-emerald-50 text-emerald-600" : started ? "bg-amber-50 text-amber-700" : blocked ? "bg-slate-100 text-slate-400" : "bg-slate-100 text-slate-500"
                  }`}>
                    {done ? "Selesai" : started ? "Sedang dikerjakan" : blocked ? "Terkunci" : "Belum Dikerjakan"}
                  </span>
                </div>
                {!done && (blocked ? (
                  <span
                    title={waitFor ? `Selesaikan subtes ${SKILL_LABEL[waitFor.skill]} dulu` : undefined}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-400"
                  >
                    <Lock className="h-4 w-4" />Terkunci
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => startGroup(g.skill)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                    style={{ background: started ? TEAL_DEEP : TEAL }}
                  >
                    {started ? "Lanjutkan" : "Mulai"} <ArrowRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
          <span>
            Subtes dikerjakan <b className="font-bold">berurutan</b> seperti ujian aslinya
            {skillGroups.length > 1 && <> ({skillGroups.map((g) => SKILL_LABEL[g.skill]).join(" → ")})</>} — subtes berikutnya
            baru terbuka setelah subtes sebelumnya diselesaikan. Tiap subtes punya batas waktu sendiri dan dikunci minimal{" "}
            {SECTION_LOCK_MINUTES} menit setelah dimulai, dan subtes yang sudah diselesaikan tidak bisa dibuka lagi.
            Saat subtes terakhir selesai, seluruh jawaban otomatis dikumpulkan.
          </span>
        </p>
      </Shell>
    );
  }

  // running — mengerjakan SATU subtes (view "work")
  const section = sections[secIdx];
  if (!section || !activeGroup) return null;
  const secQs = questions.filter((q) => q.section_id === section.id);
  const SkillIcon = SKILL_ICON[section.skill];
  const hasMedia = !!(section.audio_url || section.passage);

  // Posisi bagian di dalam subtes aktif — navigasi TIDAK boleh menyeberang subtes.
  const gPos = activeGroup.secIdxs.indexOf(secIdx);
  const isLastInGroup = gPos === activeGroup.secIdxs.length - 1;
  const groupSections = activeGroup.secIdxs.map((si) => sections[si]);
  const gQsAll = groupQuestions(activeGroup);
  const gAnswered = gQsAll.filter((q) => isAnswered(q, answers[q.id])).length;

  // Kunci subtes: sebelum lewat, tombol "Selesaikan Subtes" nonaktif. Nilai ini
  // dihitung ulang tiap render — re-render tiap detik sudah dijamin tick timer.
  const lockMin = Math.min(SECTION_LOCK_MINUTES, groupDurationMin(activeGroup));
  const lockLeft = preview ? 0 : Math.max(0, Math.ceil(((groupStartedAt[activeGroup.skill] ?? 0) + lockMin * 60_000 - Date.now()) / 1000));

  // [sim-table-fill-v1] Soal "lengkapi tabel": isian ditanam di dalam tabelnya,
  // jadi soal-soal itu TIDAK diulang lagi sebagai daftar di kolom kanan.
  const tableFill = buildTableBlanks(section.instructions, secQs);
  const inlineIds = new Set((tableFill?.qs ?? []).map((q) => q.id));
  const listQs = tableFill ? secQs.filter((q) => !inlineIds.has(q.id)) : secQs;

  // Paginasi soal: maksimal PAGE_SIZE soal per halaman (kurangi scroll panjang).
  const pageCount = Math.max(1, Math.ceil(listQs.length / PAGE_SIZE));
  const safePage = Math.min(qPage, pageCount - 1);
  const pageStart = safePage * PAGE_SIZE;
  const pageQs = listQs.slice(pageStart, pageStart + PAGE_SIZE);
  const isLastPage = safePage >= pageCount - 1;
  const isFirstPage = safePage === 0 && gPos <= 0;
  const scrollToTop = () => { try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* ignore */ } };
  // Lanjut: halaman berikut dalam bagian, atau part berikutnya DI SUBTES yang sama.
  const goNextPage = () => {
    if (!isLastPage) { setQPage(safePage + 1); scrollToTop(); return; }
    if (isLastInGroup) return;
    const next = activeGroup.secIdxs[gPos + 1];
    dismissIntro(next); // part se-subtes = se-skill → tak perlu intro ulang
    setSecIdx(next); setQPage(0); scrollToTop();
  };
  // Sebelumnya: halaman sebelum dalam bagian, atau part sebelumnya di subtes yang sama.
  const goPrevPage = () => {
    if (safePage > 0) { setQPage(safePage - 1); scrollToTop(); return; }
    if (gPos <= 0) return;
    const prev = activeGroup.secIdxs[gPos - 1];
    const prevCount = questions.filter((q) => q.section_id === sections[prev].id).length;
    dismissIntro(prev);
    setSecIdx(prev); setQPage(Math.max(0, Math.ceil(prevCount / PAGE_SIZE) - 1)); scrollToTop();
  };
  const sectionHeader = (
    <>
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
        <SkillIcon className="h-4 w-4" />{SKILL_LABEL[section.skill]} · Bagian {secIdx + 1}/{sections.length}
      </div>
      <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
      {/* Tabel isian (tableFill) sengaja tidak di sini — dirender SETELAH pemutar
          audio, supaya urutannya: judul → petunjuk singkat → audio → tabel. */}
      {section.instructions && !tableFill && (
        isHtml(section.instructions)
          ? <SmartText text={section.instructions} className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600" />
          : <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{section.instructions}</p>
      )}
    </>
  );

  // Tabel/form soal dgn kotak isian menempel di selnya (lihat buildTableBlanks).
  const tableBlock = tableFill ? (
    <TableFillHtml
      html={tableFill.html}
      qs={tableFill.qs}
      answers={answers}
      onChange={setAns}
      qNumber={qNumber}
      className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
    />
  ) : null;

  // Layar intro/petunjuk bagian — tampil sebelum soal tiap bagian (template default
  // per skill, atau instruksi kustom admin). Alur: intro → soal → intro → soal, dst.
  if (!introDone.has(secIdx)) {
    const tpl = SECTION_INTRO[section.skill] ?? { title: "Petunjuk Bagian", points: [] };
    const customInstr = section.instructions?.trim();
    return (
      <Shell sim={sim} preview={preview} confirmExit proctored={!preview} headerRight={remaining != null ? <TimerPill seconds={remaining} /> : undefined}>
        <ViolationModal count={violations} msg={violationMsg} onResume={() => { setViolationMsg(null); enterFullscreen(); }} />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
            <SkillIcon className="h-4 w-4" />{SKILL_LABEL[section.skill]} · Part {gPos + 1}/{groupSections.length}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5"><ListChecks className="h-3.5 w-3.5" />{secQs.length} soal</span>
            {section.duration_minutes > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5"><Clock className="h-3.5 w-3.5" />{section.duration_minutes} menit</span>}
            {section.audio_url && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5"><Headphones className="h-3.5 w-3.5" />Ada audio</span>}
            {section.passage && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5"><BookOpen className="h-3.5 w-3.5" />Ada teks bacaan</span>}
          </div>

          <div className="mt-5 rounded-xl border border-teal-100 bg-teal-50 p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800"><Info className="h-4 w-4 text-teal-600" />{tpl.title}</h3>
            {customInstr ? (
              isHtml(customInstr)
                ? <SmartText text={customInstr} className="mt-2 text-sm leading-relaxed text-slate-600" />
                : <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{customInstr}</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {tpl.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />{p}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button onClick={() => { setQPage(0); enterFullscreen(); dismissIntro(secIdx); }} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
              <PlayCircle className="h-4 w-4" />Mulai bagian ini
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // [sim-navbar-top-v1] Navigasi "Nomor Soal" ala CBT — sekarang jadi BAR
  // HORIZONTAL di atas (menggantikan bar progres + panel kanan), supaya kolom
  // bacaan & soal dapat lebar penuh.
  const navBar = (
    <ExamNavBar
      parts={activeGroup.secIdxs.map((si) => ({ si, section: sections[si], qs: questions.filter((q) => q.section_id === sections[si].id) }))}
      answers={answers}
      currentSecIdx={secIdx}
      maxVisitedSecIdx={maxSecIdx}
      currentQids={new Set([...pageQs, ...(tableFill?.qs ?? [])].map((q) => q.id))}
      qNumber={qNumber}
      onJump={goToQuestion}
      lockLeft={lockLeft}
      lockMin={lockMin}
      onFinish={() => finishGroup()}
      answered={gAnswered}
      total={gQsAll.length}
      partPos={gPos}
      partCount={groupSections.length}
      skillLabel={SKILL_LABEL[activeGroup.skill]}
    />
  );

  // Tombol selesaikan subtes — nonaktif selama kunci menit minimal belum lewat.
  const finishGroupBtn = (
    <button
      type="button"
      disabled={lockLeft > 0}
      onClick={() => finishGroup()}
      title={lockLeft > 0 ? `Subtes terkunci minimal ${lockMin} menit — sisa ${clock(lockLeft)}` : undefined}
      className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
      style={{ background: TEAL_DEEP }}
    >
      {lockLeft > 0 ? <><Lock className="h-4 w-4" />Terkunci {clock(lockLeft)}</> : <><CheckCircle2 className="h-4 w-4" />Selesaikan Subtes</>}
    </button>
  );

  // Navigasi bawah (kembar dengan yang di atas) — praktis setelah menjawab
  // halaman ini tanpa harus menggulir balik ke atas.
  const bottomNav = (
    <div className="mt-6 flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={isFirstPage}
        onClick={goPrevPage}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
      >
        <ArrowLeft className="h-4 w-4" />Sebelumnya
      </button>
      {isLastInGroup && isLastPage ? finishGroupBtn : (
        <button type="button" onClick={goNextPage} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
          Lanjut <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <Shell sim={sim} preview={preview} wide confirmExit proctored={!preview} headerRight={remaining != null ? <TimerPill seconds={remaining} /> : undefined}>
      <ViolationModal count={violations} msg={violationMsg} onResume={() => { setViolationMsg(null); enterFullscreen(); }} />

      {/* Navigasi nomor soal horizontal (sticky di bawah header) — menggantikan
          bar progres lama + panel kanan. */}
      {navBar}

      <div className="min-w-0">
      {/* Navigasi halaman soal — di atas (di bawah bar nomor soal), kanan.
          Maks PAGE_SIZE soal/halaman → tak perlu menggulir jauh untuk lanjut. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 tabular-nums">
          {SKILL_LABEL[activeGroup.skill]} ·{" "}
          {listQs.length === 0
            ? `${secQs.length} soal — isi langsung di tabel`
            : <>Soal {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, listQs.length)} dari {listQs.length}</>}
          {pageCount > 1 && <span className="text-slate-400"> · Hal {safePage + 1}/{pageCount}</span>}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isFirstPage}
            onClick={goPrevPage}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />Sebelumnya
          </button>
          {isLastInGroup && isLastPage ? finishGroupBtn : (
            <button type="button" onClick={goNextPage} className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-white" style={{ background: TEAL }}>
              Lanjut <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Split view ala ujian CBT asli: materi (passage/audio) sticky di kiri,
          soal discroll di kanan. Pembatas bisa digeser (drag) untuk mengatur
          lebar. Bagian tanpa materi tetap satu kolom. */}
      {(() => {
        // Semua soal bagian ini sudah jadi isian di dalam tabel → tak ada kolom
        // soal terpisah, kartu materi dipakai satu kolom penuh (tanpa batas tinggi).
        const soloTable = !!tableFill && listQs.length === 0;
        const mediaCard = (
          <div className={soloTable
            ? "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
            : "rounded-2xl border border-slate-200 bg-white p-5 lg:flex lg:max-h-[calc(100vh-11rem)] lg:min-h-0 lg:flex-col"}>
            {sectionHeader}
            {section.audio_url && (
              // Mobile: player nempel di bawah header saat scroll soal; desktop udah sticky di pane kiri.
              // Video YouTube pun diputar sebagai AUDIO saja — layarnya berisi soal & kunci.
              <div className="sticky top-[150px] z-20 mt-3 shrink-0 rounded-xl bg-white/95 py-1 backdrop-blur lg:static lg:py-0">
                {youtubeEmbedId(section.audio_url)
                  ? <YouTubeAudio url={section.audio_url} className="w-full" />
                  : <RangedAudio url={section.audio_url} className="w-full" />}
              </div>
            )}
            {tableBlock}
            {section.passage && (
              isHtml(section.passage)
                ? <SmartText text={section.passage} className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 [&_p]:text-justify [&_p]:hyphens-auto lg:max-h-none lg:min-h-0 lg:flex-1" />
                : <PassageText text={section.passage} className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 lg:max-h-none lg:min-h-0 lg:flex-1" />
            )}
            {soloTable && bottomNav}
          </div>
        );

        const questionsCard = (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            {!hasMedia && sectionHeader}
            {!hasMedia && tableBlock}

            <div className="mt-5 space-y-5 first:mt-0">
              {pageQs.map((q) => (
                <QuestionBlock key={q.id} index={qNumber[q.id]} q={q} state={answers[q.id]} onChange={(p) => setAns(q.id, p)} />
              ))}
              {secQs.length === 0 && <p className="text-sm text-slate-400">Tidak ada soal di bagian ini.</p>}
            </div>

            {bottomNav}
          </div>
        );

        if (soloTable) return hasMedia ? mediaCard : questionsCard;
        return hasMedia ? <SplitPane left={mediaCard} right={questionsCard} /> : questionsCard;
      })()}
      </div>
    </Shell>
  );
}

// ── Layout helpers ────────────────────────────────────────────────────────────
function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5 text-teal-600" />{label}
      </div>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">{children}</div>;
}

// Form identitas untuk siswa mode tamu (B2B) yang mengerjakan tanpa akun. Nama
// wajib; email & WhatsApp opsional (dipakai admin untuk rekap ke perusahaan).
function GuestIdentityForm({ title, busy, onSubmit }: {
  title: string; busy: boolean; onSubmit: (name: string, email: string, whatsapp: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const canSubmit = name.trim().length >= 2 && !busy;
  const fieldCls = "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100";

  return (
    <Centered>
      <form
        onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(name, email, whatsapp); }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: TEAL }}>
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">Isi identitas dulu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sebelum mengerjakan{title ? ` "${title}"` : " simulasi"}, isi data berikut. Nama akan tampil di hasil pengerjaanmu.
        </p>

        <div className="mt-5 space-y-3">
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={fieldCls} placeholder="Nama lengkap *" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={fieldCls} type="email" placeholder="Email (opsional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={fieldCls} inputMode="tel" placeholder="No. WhatsApp (opsional)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
          style={{ background: TEAL }}
        >
          {busy ? <><Loader2 className="h-4 w-4 animate-spin" />Menyiapkan…</> : <>Mulai Simulasi <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
    </Centered>
  );
}

// ── Onboarding wizard: Ikhtisar → Petunjuk & cek mic → Rincian bagian ─────────
const INTRO_STEPS = ["Ikhtisar", "Petunjuk", "Rincian"] as const;

function IntroWizard({ sim, sections, questions, onStart, promo }: {
  sim: Simulation; sections: Section[]; questions: Question[]; onStart: () => void; promo: PromoAttemptStatus | null;
}) {
  const [step, setStep] = useState(0);
  const hasSpeaking = useMemo(() => sections.some((s) => s.skill === "speaking"), [sections]);
  const effDuration = useMemo(() => effectiveDurationMinutes(sim, sections), [sim, sections]);
  // + aturan mode subtes & proctoring (EXTRA_RULES) supaya siswa tahu sebelum mulai.
  const rules = [...GENERAL_RULES.filter((r) => !r.timed || effDuration > 0), ...EXTRA_RULES];

  // Kelompokkan bagian per skill → accordion biar daftar yang panjang (mis. 13
  // bagian) tidak membanjiri layar. Default skill pertama yang terbuka.
  const groups = useMemo(() => {
    const map: { skill: Skill; parts: { section: Section; idx: number; count: number }[] }[] = [];
    sections.forEach((s, i) => {
      const count = questions.filter((q) => q.section_id === s.id).length;
      let g = map.find((x) => x.skill === s.skill);
      if (!g) { g = { skill: s.skill, parts: [] }; map.push(g); }
      g.parts.push({ section: s, idx: i, count });
    });
    return map;
  }, [sections, questions]);
  const [openSkill, setOpenSkill] = useState<Skill | null>(sections[0]?.skill ?? null);

  const isLast = step === INTRO_STEPS.length - 1;

  return (
    <div>
      {/* promo-code-v1: badge sisa jatah gratis (hanya utk akses via kode promo) */}
      {promo && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            Akses gratis (kode promo) — sisa <b>{promo.remaining}</b> dari {promo.limit}× kesempatan.
            {promo.remaining <= 0 && " Jatah habis, beli paket untuk lanjut."}
          </span>
        </div>
      )}
      {/* Stepper */}
      <div className="mb-5 flex items-center">
        {INTRO_STEPS.map((label, i) => (
          <div key={label} className="flex items-center last:flex-none [&:not(:last-child)]:flex-1">
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= step ? "text-white" : "bg-slate-100 text-slate-400"}`}
                style={i <= step ? { background: TEAL } : undefined}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-xs font-semibold sm:inline ${i === step ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
            </div>
            {i < INTRO_STEPS.length - 1 && (
              <div className="sim-track mx-2 h-0.5 flex-1 rounded" style={{ background: i < step ? TEAL : undefined }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0 — Ikhtisar */}
      {step === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">{sim.title}</h2>
          {sim.description
            ? <RichText text={sim.description} className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-600" />
            : <p className="mt-1 text-sm text-slate-600">{TEST_OVERVIEW[sim.test_type]}</p>}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat icon={ListChecks} label="Total Soal" value={`${questions.length} soal`} />
            <Stat icon={BookOpen} label="Jumlah Bagian" value={`${sections.length} bagian`} />
            <Stat icon={Clock} label="Durasi" value={effDuration > 0 ? `${effDuration} menit` : "Tanpa batas"} />
          </div>

        </div>
      )}

      {/* Step 1 — Petunjuk & cek perangkat */}
      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Info className="h-4 w-4 text-teal-600" />Petunjuk Pengerjaan
          </h3>
          <ul className="mt-3 space-y-2">
            {rules.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />{r.text}
              </li>
            ))}
          </ul>

          {hasSpeaking && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Mic className="h-4 w-4 text-teal-600" />Cek Mikrofon
              </h3>
              <p className="mt-1 text-xs text-slate-500">Tes ini ada bagian Speaking. Pastikan mikrofon berfungsi sebelum mulai.</p>
              <MicCheck />
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Rincian bagian (accordion per skill) */}
      {step === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900">Rincian Bagian</h3>
          <p className="mt-1 text-xs text-slate-500">Kerjakan tiap bagian secara berurutan.</p>
          <div className="mt-3 space-y-2">
            {groups.map((g) => {
              const Icon = SKILL_ICON[g.skill];
              const isOpen = openSkill === g.skill;
              const totalQ = g.parts.reduce((n, p) => n + p.count, 0);
              return (
                <div key={g.skill} className="overflow-hidden rounded-xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setOpenSkill(isOpen ? null : g.skill)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-slate-900">{SKILL_LABEL[g.skill]}</span>
                    <span className="text-xs font-medium text-slate-400 tabular-nums">{g.parts.length} bagian · {totalQ} soal</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <ol className="space-y-2 border-t border-slate-100 px-3 py-2.5">
                      {g.parts.map((p) => (
                        <li key={p.section.id} className="text-sm">
                          <p className="font-semibold text-slate-900">
                            <span className="mr-1 text-slate-400">Bagian {p.idx + 1}.</span>{p.section.title}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-teal-700">
                            {p.count} soal{p.section.duration_minutes > 0 ? ` · ${p.section.duration_minutes} menit` : ""}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">{(p.section.instructions ? p.section.instructions.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "") || SKILL_HOWTO[g.skill]}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigasi wizard */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />Kembali
        </button>
        {isLast ? (
          <button onClick={onStart} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL_DEEP }}>
            <CheckCircle2 className="h-4 w-4" />Saya Mengerti, Mulai Simulasi
          </button>
        ) : (
          <button onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
            Lanjut <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Cek mikrofon — minta izin lalu tampilkan level meter sebagai bukti mic aktif.
function MicCheck() {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [level, setLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    ctxRef.current?.close().catch(() => {});
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }
  useEffect(() => stop, []);

  async function check() {
    setStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      setStatus("ok");
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) { const v = Math.abs(data[i] - 128); if (v > peak) peak = v; }
        setLevel(Math.min(100, Math.round((peak / 128) * 200)));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {status === "idle" && (
        <button onClick={check} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: TEAL }}>
          <Mic className="h-4 w-4" />Tes mikrofon
        </button>
      )}
      {status === "checking" && (
        <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Meminta izin mikrofon…</p>
      )}
      {status === "ok" && (
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" />Mikrofon aktif — coba bicara, bar akan bergerak.</p>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full transition-[width] duration-75" style={{ width: `${level}%`, background: TEAL }} />
          </div>
        </div>
      )}
      {status === "error" && (
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-red-500"><AlertCircle className="h-4 w-4" />Tidak bisa mengakses mikrofon. Izinkan akses di browser lalu coba lagi.</p>
          <button onClick={check} className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">
            <Mic className="h-4 w-4" />Coba lagi
          </button>
        </div>
      )}
    </div>
  );
}

// Panel materi|soal dengan pembatas yang bisa digeser (drag) untuk mengatur
// lebar. Lebar (%) kolom kiri disimpan di localStorage supaya tetap saat pindah
// bagian/soal. Default kolom kiri (bacaan) lebih lega (~62%). Hanya aktif di
// desktop (lg+); di layar kecil kartu ditumpuk vertikal seperti biasa.
const splitClamp = (n: number) => Math.min(72, Math.max(38, n));

function SplitPane({ left, right }: { left: ReactNode; right: ReactNode }) {
  const [pct, setPct] = useState(62);
  const wrapRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    try { const v = localStorage.getItem("sim-split-pct"); if (v) setPct(splitClamp(Number(v))); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!draggingRef.current || !wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setPct(splitClamp(((e.clientX - r.left) / r.width) * 100));
    };
    const up = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.userSelect = "";
      setPct((p) => { try { localStorage.setItem("sim-split-pct", String(Math.round(p))); } catch { /* ignore */ } return p; });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.userSelect = "none";
  };

  return (
    <div ref={wrapRef} className="lg:flex lg:items-start" style={{ ["--sim-left" as string]: `${pct}%` } as React.CSSProperties}>
      <aside className="mb-4 lg:sticky lg:top-[152px] lg:mb-0 lg:w-[var(--sim-left)] lg:shrink-0">{left}</aside>
      <div
        onPointerDown={onDown}
        title="Geser untuk mengatur lebar bacaan & soal"
        className="group relative hidden shrink-0 cursor-col-resize touch-none select-none lg:sticky lg:top-[152px] lg:flex lg:h-[calc(100vh-11rem)] lg:w-5 lg:items-center lg:justify-center"
      >
        <div className="h-16 w-1.5 rounded-full bg-slate-200 transition-colors group-hover:bg-teal-400 group-active:bg-teal-500" />
      </div>
      <div className="lg:min-w-0 lg:flex-1">{right}</div>
    </div>
  );
}

function Shell({ sim, children, headerRight, preview, wide, confirmExit, proctored }: { sim: Simulation; children: React.ReactNode; headerRight?: React.ReactNode; preview?: boolean; wide?: boolean; confirmExit?: boolean; proctored?: boolean }) {
  // Konfirmasi sebelum keluar saat tes sedang berjalan (cegah keluar tak sengaja
  // yang bikin kehilangan progres/waktu). Hanya aktif saat confirmExit=true.
  const [askExit, setAskExit] = useState(false);
  // wide = layout split materi|soal (butuh ruang 2 kolom di desktop). Kartu
  // dibuat lebih lebar (memanjang ke kiri & kanan) supaya bacaan & soal lega.
  const maxW = wide ? "max-w-[92rem]" : "max-w-3xl";
  // Tombol back keluar simulasi. Mode preview dibuka admin di tab baru & tanpa sesi
  // siswa → JANGAN arahkan ke /akun/simulasi (butuh login → mentok halaman "masuk
  // dulu"). Pakai katalog publik /simulasi yang bebas login.
  const backHref = preview ? "/simulasi" : "/akun?menu=simulasi";
  // Keluar simulasi: pastikan lepas dari layar penuh dulu, lalu navigasi keras
  // (window.location) — router.push kadang diam-diam gagal di tab baru/preview
  // (tanpa riwayat) atau saat route cache basi. Preview dibuka admin di tab baru →
  // kalau memang bisa ditutup (script-opened), tutup tabnya; jika tidak, ke katalog.
  const leave = () => {
    leavingSim = true; // keluar disengaja → proctoring jangan mencatat pelanggaran
    if (fsElement()) exitFs();
    if (preview) { try { window.close(); } catch { /* diblokir */ } }
    window.location.assign(backHref);
  };

  // Mode gelap (disimpan di localStorage supaya konsisten antar soal & sesi).
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try { setDark(localStorage.getItem("sim-dark") === "1"); } catch { /* ignore */ }
  }, []);
  const toggleDark = () => setDark((d) => {
    const v = !d;
    try { localStorage.setItem("sim-dark", v ? "1" : "0"); } catch { /* ignore */ }
    return v;
  });

  // Layar penuh (browser Fullscreen API) → tab & address bar tersembunyi,
  // fokus penuh ke soal seperti aplikasi ujian.
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const onChange = () => setFs(!!fsElement());
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange); // Safari
    onChange(); // sinkron state awal (mis. sudah fullscreen dari layar intro)
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);
  const toggleFs = () => {
    if (fsElement()) exitFs();
    else requestFs(document.documentElement);
  };

  return (
    <div className={`sim-shell min-h-screen bg-slate-50${dark ? " sim-dark" : ""}${proctored ? " sim-lock" : ""}`}>
      {/* Tampilan bersih & modern: buang outline/ring fokus bawaan browser pada
          semua elemen interaktif (tombol, tab, link) di layar siswa & preview. */}
      <style>{`
        /* Teks dasar dibuat lebih tebal (medium) supaya lebih jelas & nyaman
           dibaca saat mengerjakan soal — heading bold/semibold tetap seperti biasa. */
        .sim-shell { font-weight: 500; }
        .sim-shell :is(button, a, [role="tab"], [role="button"], summary):focus,
        .sim-shell :is(button, a, [role="tab"], [role="button"], summary):focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
        /* ── Mode gelap: remap utility warna terang → gelap (scoped ke .sim-dark).
           Selektor 2-kelas menang atas utility 1-kelas Tailwind tanpa !important. */
        .sim-shell.sim-dark { background: #0b1017; }
        .sim-dark .bg-white { background-color: #151d27; }
        .sim-dark .bg-slate-50 { background-color: #0b1017; }
        .sim-dark .bg-slate-100 { background-color: #1c2735; }
        .sim-dark .bg-slate-200 { background-color: #26323f; }
        .sim-dark .bg-teal-50 { background-color: rgba(26,158,158,0.14); }
        .sim-dark .bg-teal-100 { background-color: rgba(26,158,158,0.22); }
        .sim-dark .bg-red-50 { background-color: rgba(239,68,68,0.16); }
        .sim-dark .text-slate-900 { color: #eef2f6; }
        .sim-dark .text-slate-800 { color: #e2e8ee; }
        .sim-dark .text-slate-700 { color: #cdd6df; }
        .sim-dark .text-slate-600 { color: #b2bdc8; }
        .sim-dark .text-slate-500 { color: #aab5c0; }
        .sim-dark .text-slate-400 { color: #919ea9; }
        .sim-dark .text-teal-800 { color: #34cabf; }
        .sim-dark .text-teal-700 { color: #3ad0c6; }
        .sim-dark .text-teal-600 { color: #45d6cc; }
        .sim-dark .text-teal-500 { color: #45d6cc; }
        .sim-dark .border-teal-100 { border-color: rgba(26,158,158,0.32); }
        .sim-dark .border-slate-100 { border-color: #1e2833; }
        .sim-dark .border-slate-200 { border-color: #26323f; }
        .sim-dark .border-slate-300 { border-color: #33414f; }
        .sim-dark .hover\\:bg-slate-50:hover { background-color: #1c2735; }
        .sim-dark .hover\\:bg-slate-100:hover { background-color: #26323f; }
        .sim-dark .hover\\:bg-slate-200:hover { background-color: #313f4d; }
        /* Varian warna dengan modifier transparansi (mis. bg-slate-50/80,
           bg-teal-50/60, bg-white/95) TIDAK ikut remap 1-kelas di atas → di mode
           gelap tampil terang & washed-out. Petakan eksplisit di sini. */
        .sim-dark .bg-slate-50\\/80 { background-color: #131b24; }
        .sim-dark .bg-slate-50\\/95 { background-color: #131b24; }
        .sim-dark .bg-white\\/95 { background-color: rgba(21,29,39,0.95); }
        .sim-dark .bg-white\\/90 { background-color: rgba(21,29,39,0.9); }
        .sim-dark .bg-teal-50\\/60 { background-color: rgba(26,158,158,0.16); }
        .sim-dark .hover\\:bg-slate-200\\/70:hover { background-color: rgba(49,63,77,0.7); }
        /* Kartu & tab tanpa garis luar (outline): kontainer rounded-xl/2xl pemisahnya
           lewat latar, bukan border. Border status (teal/merah) & kotak opsi/input
           (rounded-lg) tetap punya garis karena bukan slate-100/200. */
        .sim-shell :is(.rounded-xl, .rounded-2xl).border-slate-100,
        .sim-shell :is(.rounded-xl, .rounded-2xl).border-slate-200 { border-color: transparent; }
        /* Bar progress (segmen non-aktif) — warna via kelas biar bisa ikut gelap. */
        .sim-shell .sim-track { background-color: #e2e8f0; }
        .sim-dark .sim-track { background-color: #26323f; }
        /* [sim-navbar-top-v1] Strip nomor soal horizontal: scrollbar tipis biar
           tak memakan tinggi bar. */
        .sim-navstrip { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        .sim-navstrip::-webkit-scrollbar { height: 6px; }
        .sim-navstrip::-webkit-scrollbar-track { background: transparent; }
        .sim-navstrip::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        .sim-dark .sim-navstrip { scrollbar-color: #3b4a5a transparent; }
        .sim-dark .sim-navstrip::-webkit-scrollbar-thumb { background: #3b4a5a; }
        /* [sim-proctor-v2] Mode ujian: teks soal/bacaan tak bisa diblok-salin atau
           diseret ke tab lain; kotak jawaban esai tetap bisa diseleksi normal. */
        .sim-lock, .sim-lock * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
        .sim-lock :is(input, textarea, [contenteditable="true"]) { -webkit-user-select: text; user-select: text; }
        .sim-lock img, .sim-lock a { -webkit-user-drag: none; }
        /* Cetak / "simpan sebagai PDF" halaman soal → halaman kosong. */
        @media print { .sim-lock { display: none !important; } }
      `}</style>
      {preview && (
        <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          Mode Preview — tampilan POV siswa. Jawaban & nilai tidak disimpan.
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className={`mx-auto flex ${maxW} items-center gap-3 px-4 py-3.5 sm:px-6`}>
          {confirmExit && !preview ? (
            // Siswa sungguhan: tombol tutup (X) + konfirmasi dulu. Progres & sisa
            // waktu tersimpan → bisa dilanjutkan saat masuk lagi.
            <button type="button" onClick={() => setAskExit(true)} title="Tutup simulasi" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          ) : (
            // Preview / layar non-ujian: langsung keluar (tak ada progres yg hilang) &
            // pastikan keluar dari layar penuh dulu supaya tak nyangkut fullscreen.
            <button type="button" onClick={leave} title="Keluar simulasi" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: TEAL_DEEP }}>
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{sim.title}</p>
            <p className="text-xs text-slate-500">{testTypeLabel(sim.test_type, sim.test_variant)}</p>
          </div>
          {headerRight}
          <button
            onClick={toggleDark}
            title={dark ? "Mode terang" : "Mode gelap"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {/* [sim-proctor-v1] saat proctoring aktif, keluar layar penuh = pelanggaran →
              tombol toggle disembunyikan supaya tak jadi jebakan; yang tampil hanya
              tombol MASUK fullscreen bila siswa sedang di luar layar penuh. */}
          {(!proctored || !fs) && (
            <button
              onClick={toggleFs}
              title={fs ? "Keluar layar penuh" : "Layar penuh"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              {fs ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          )}
        </div>
      </header>
      <main className={`mx-auto ${maxW} px-4 py-6 sm:px-6`}>{children}</main>

      {/* Konfirmasi keluar sesi tes — cegah keluar tak sengaja saat mengerjakan. */}
      {askExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAskExit(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <X className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900">Tutup simulasi?</p>
                <p className="mt-1 text-sm text-slate-500">
                  {preview
                    ? "Kamu akan keluar dari mode preview."
                    : "Jawaban & sisa waktu tersimpan otomatis. Kamu bisa membuka simulasi ini lagi dan melanjutkan dari titik ini."}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAskExit(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={leave}
                className="rounded-xl px-4 py-2 text-sm font-bold text-white"
                style={{ background: TEAL }}
              >
                {preview ? "Ya, keluar" : "Ya, tutup & simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Timer pill — merah saat <= 60 detik tersisa.
function TimerPill({ seconds }: { seconds: number }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const danger = seconds <= 60;
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums ${danger ? "animate-pulse bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"}`}
      title="Sisa waktu — otomatis dikumpulkan saat habis"
    >
      <Clock className="h-4 w-4" />{mm}:{ss}
    </span>
  );
}

// Apakah sebuah soal sudah dijawab (sesuai tipenya)?
function isAnswered(q: Question, s?: AnswerState) {
  if (!s) return false;
  if (q.type === "multiple_choice" || q.type === "matching" || q.type === "true_false_ng")
    return s.selected_index != null;
  if (q.type === "speaking_task") return !!(s.audioBlob || s.audioUrl);
  return s.text.trim().length > 0;
}

// ── [sim-navbar-top-v1] Bar navigasi nomor soal (sticky di bawah header) ─────
//    Menggantikan bar progres + panel "Nomor Soal" di kanan: blok nomor soal
//    disusun HORIZONTAL (bisa digeser bila panjang) supaya kolom bacaan & soal
//    dapat lebar penuh. Timer TIDAK diulang di sini — cukup yang di header.
type NavStatus = "answered" | "skipped" | "todo";

function ExamNavBar({ parts, answers, currentSecIdx, maxVisitedSecIdx, currentQids, qNumber, onJump, lockLeft, lockMin, onFinish, answered, total, partPos, partCount, skillLabel }: {
  parts: { si: number; section: Section; qs: Question[] }[];
  answers: Record<string, AnswerState>;
  currentSecIdx: number;
  maxVisitedSecIdx: number;
  currentQids: Set<string>; // soal yang sedang tampil di halaman aktif
  qNumber: Record<string, number>;
  onJump: (secIdx: number, qid: string) => void;
  lockLeft: number;  // detik sisa kunci subtes (0 = boleh selesai)
  lockMin: number;
  onFinish: () => void;
  answered: number;
  total: number;
  partPos: number;   // indeks part aktif di dalam subtes
  partCount: number;
  skillLabel: string;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const firstCurrent = parts.find((p) => p.si === currentSecIdx)?.qs.find((q) => currentQids.has(q.id))?.id;

  // Geser strip ke nomor yang sedang dikerjakan tiap ganti halaman/part —
  // `block:"nearest"` supaya halaman soal tidak ikut melompat.
  useEffect(() => {
    if (!firstCurrent) return;
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-qid="${CSS.escape(firstCurrent)}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [firstCurrent]);

  const statusOf = (q: Question, si: number): NavStatus => {
    if (isAnswered(q, answers[q.id])) return "answered";
    return si < maxVisitedSecIdx ? "skipped" : "todo";
  };

  return (
    <div className="sticky top-[60px] z-30 -mx-4 mb-4 border-b border-slate-200 bg-slate-50 px-4 pb-2 pt-2 sm:-mx-6 sm:px-6">
      <div className="mb-1.5 flex items-center gap-3">
        <span className="shrink-0 text-[11px] font-semibold text-slate-500 tabular-nums">
          {skillLabel}{partCount > 1 && <> · Part {partPos + 1}/{partCount}</>}
        </span>
        {/* Legenda status — ala CBT: saat ini / kosong / terisi */}
        <div className="ml-auto hidden items-center gap-x-3 text-[11px] font-medium text-slate-500 md:flex">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: TEAL_DEEP }} />Nomor saat ini</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />Kosong</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: TEAL }} />Terisi</span>
        </div>
        <span className="ml-auto shrink-0 text-[11px] font-semibold text-slate-600 tabular-nums md:ml-0">
          <span className="font-bold text-teal-600">{answered}</span>/{total} terisi
        </span>
        <button
          type="button"
          disabled={lockLeft > 0}
          onClick={onFinish}
          title={lockLeft > 0 ? `Subtes terkunci minimal ${lockMin} menit — sisa ${clock(lockLeft)}` : undefined}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          style={{ background: TEAL_DEEP }}
        >
          {lockLeft > 0
            ? <><Lock className="h-3.5 w-3.5" /><span className="tabular-nums">{clock(lockLeft)}</span></>
            : <><CheckCircle2 className="h-3.5 w-3.5" />Selesaikan<span className="hidden sm:inline"> Subtes</span></>}
        </button>
      </div>

      <div ref={stripRef} className="sim-navstrip flex items-center gap-1.5 overflow-x-auto pb-1">
        {parts.map((p, pi) => (
          <div key={p.section.id} className="flex shrink-0 items-center gap-1.5">
            {pi > 0 && <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" />}
            {parts.length > 1 && (
              <span className={`shrink-0 text-[11px] font-bold ${p.si === currentSecIdx ? "text-teal-700" : "text-slate-400"}`}>
                Part {pi + 1}
              </span>
            )}
            {p.qs.map((q) => {
              const st = statusOf(q, p.si);
              const isCurrent = p.si === currentSecIdx && currentQids.has(q.id);
              const cls = isCurrent
                ? "text-white"
                : st === "answered" ? "text-white"
                : st === "skipped" ? "border border-red-300 bg-red-50 text-red-600 hover:border-red-400"
                : "border border-slate-300 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-700";
              const bg = isCurrent ? TEAL_DEEP : st === "answered" ? TEAL : undefined;
              const label = st === "answered" ? "terisi" : st === "skipped" ? "terlewati — belum dijawab" : "kosong";
              return (
                <button
                  key={q.id}
                  type="button"
                  data-qid={q.id}
                  onClick={() => onJump(p.si, q.id)}
                  title={`Soal ${qNumber[q.id]} · ${label}`}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition ${cls}`}
                  style={bg ? { background: bg } : undefined}
                >
                  {qNumber[q.id]}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── [sim-proctor-v1] Modal peringatan pelanggaran proctoring ─────────────────
function ViolationModal({ count, msg, onResume }: { count: number; msg: string | null; onResume: () => void }) {
  if (!msg) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <p className="mt-3 text-base font-bold text-slate-900">Pelanggaran terdeteksi ({count}/{MAX_VIOLATIONS})</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{msg}</p>
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {MAX_VIOLATIONS}× pelanggaran → jawaban otomatis dikumpulkan dan ujian berakhir.
        </p>
        <button
          type="button"
          onClick={onResume}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
          style={{ background: TEAL }}
        >
          <PlayCircle className="h-4 w-4" />Lanjutkan Ujian (layar penuh)
        </button>
      </div>
    </div>
  );
}

// ── Per-question input ──────────────────────────────────────────────────────
// Soal "melengkapi kalimat" (Structure Part A): prompt punya kotak isian ___ dan
// opsi kata pendek. Ditampilkan gaya tes Linguo — kalimat dgn kotak isian inline
// + chip kata di bawah. Tetap single-select seperti multiple_choice biasa.
const BLANK_RE = /_{3,}/;

// Kalimat dengan kotak isian inline + chip kata (gaya tes Linguo). Kotak isian
// menampilkan kata yang dipilih; tetap 4 opsi (A–D), single-select.
function FillBlankChips({ q, state, onChange }: {
  q: Question; state: AnswerState; onChange: (p: Partial<AnswerState>) => void;
}) {
  const opts = q.options ?? [];
  const chosen = state.selected_index != null ? opts[state.selected_index] : null;
  const parts = q.prompt.split(BLANK_RE);
  return (
    <div className="mt-3">
      <p className="text-base leading-loose text-slate-900">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className={`mx-1 inline-flex min-w-[64px] items-center justify-center rounded-md border px-3 py-0.5 text-sm font-semibold align-middle ${chosen ? "border-teal-400 bg-teal-50 text-teal-700" : "border-dashed border-slate-300 text-slate-400"}`}>
                {chosen ? stripOptionLabel(chosen, state.selected_index!) : "____"}
              </span>
            )}
          </span>
        ))}
      </p>
      <div className="mt-4 space-y-2">
        {opts.map((opt, i) => {
          const active = state.selected_index === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange({ selected_index: i })}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${active ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
            >
              {/* Label pilihan A/B/C/D — sekaligus penanda terpilih */}
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${active ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300 bg-white text-slate-500"}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={active ? "text-teal-700" : "text-slate-700"}>{stripOptionLabel(opt, i)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Soal "pilih bagian yang salah" (Written Expression): opsi berlabel (A)/(B)/…
// dan frasanya muncul di dalam kalimat. Kita ANDALKAN frasa opsi (bukan marker
// di prompt yg sering ga lengkap): buang marker dari kalimat, lalu cari tiap
// frasa opsi utk dijadikan bagian yg bisa diklik. Return null (→ fallback aman
// ke daftar radio) kalau ada frasa yg tak ketemu / bertumpuk — jadi soal
// dgn data import jelek tak pernah tampil rusak / tak bisa dijawab.
function buildErrorInline(prompt: string, options: string[]): Array<{ text: string; optIndex: number | null }> | null {
  const clean = prompt.replace(/\([A-Za-z]\)/g, "").replace(/\s{2,}/g, " ").trim();
  const lower = clean.toLowerCase();
  const found: { start: number; end: number; optIndex: number }[] = [];
  for (let i = 0; i < options.length; i++) {
    const phrase = stripOptionLabel(options[i], i).toLowerCase().trim();
    if (!phrase) return null;
    const start = lower.indexOf(phrase);
    if (start < 0) return null;
    found.push({ start, end: start + phrase.length, optIndex: i });
  }
  found.sort((a, b) => a.start - b.start);
  for (let i = 1; i < found.length; i++) if (found[i].start < found[i - 1].end) return null; // overlap → nyerah
  const tokens: Array<{ text: string; optIndex: number | null }> = [];
  let cursor = 0;
  for (const f of found) {
    if (f.start > cursor) tokens.push({ text: clean.slice(cursor, f.start), optIndex: null });
    tokens.push({ text: clean.slice(f.start, f.end), optIndex: f.optIndex });
    cursor = f.end;
  }
  if (cursor < clean.length) tokens.push({ text: clean.slice(cursor), optIndex: null });
  return tokens;
}

// Kalimat dengan 4 bagian bergaris-bawah berlabel A–D yang bisa diklik untuk
// menandai bagian yang salah secara tata bahasa (gaya tes Linguo).
function IdentifyErrorInline({ tokens, state, onChange }: {
  tokens: Array<{ text: string; optIndex: number | null }>;
  state: AnswerState; onChange: (p: Partial<AnswerState>) => void;
}) {
  return (
    <p className="mt-3 text-base leading-loose text-slate-900">
      {tokens.map((t, i) => {
        if (t.optIndex == null) return <span key={i}>{t.text}</span>;
        const active = state.selected_index === t.optIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange({ selected_index: t.optIndex! })}
            className={`mx-0.5 inline rounded border-b-2 px-1 align-baseline transition ${active ? "border-teal-500 bg-teal-50 font-semibold text-teal-700" : "border-slate-300 hover:border-slate-500 hover:bg-slate-50"}`}
          >
            <sup className={`mr-0.5 text-[10px] font-bold ${active ? "text-teal-600" : "text-slate-400"}`}>{String.fromCharCode(65 + t.optIndex)}</sup>
            {t.text}
          </button>
        );
      })}
    </p>
  );
}

function QuestionBlock({ index, q, state, onChange }: {
  index: number; q: Question; state: AnswerState; onChange: (p: Partial<AnswerState>) => void;
}) {
  const opts = q.type === "true_false_ng" ? TFNG : (q.options ?? []);
  const isFillBlank = q.type === "multiple_choice" && BLANK_RE.test(q.prompt) && (q.options?.length ?? 0) > 0;
  // Written Expression: coba rakit versi inline yg bisa diklik; kalau data tak
  // memungkinkan, errorTokens=null dan jatuh ke daftar radio (tetap bisa dijawab).
  const errorTokens = (!isFillBlank && q.type === "multiple_choice" && (q.options?.length ?? 0) > 0
    && q.options!.every((o) => /^\s*\([A-Za-z]\)/.test(o)))
    ? buildErrorInline(q.prompt, q.options!) : null;
  const hideRawPrompt = isFillBlank || !!errorTokens;
  const promptHeading = isFillBlank
    ? "Lengkapi kalimat dengan kata yang tepat:"
    : "Pilih bagian yang salah secara tata bahasa:";
  return (
    <div id={`q-${q.id}`} className="scroll-mt-24 rounded-xl border border-slate-100 p-4 transition">
      {/* pre-line: prompt listening multi-speaker pakai \n per giliran bicara */}
      <p className="whitespace-pre-line text-sm font-medium text-slate-900"><span className="mr-1 text-slate-400">{index}.</span>{hideRawPrompt ? promptHeading : q.prompt}</p>

      {q.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={q.image_url}
          alt="Visual soal"
          className="mt-3 max-h-96 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
        />
      )}

      {isFillBlank && <FillBlankChips q={q} state={state} onChange={onChange} />}

      {errorTokens && <IdentifyErrorInline tokens={errorTokens} state={state} onChange={onChange} />}

      {!isFillBlank && !errorTokens && (q.type === "multiple_choice" || q.type === "matching" || q.type === "true_false_ng") && (
        <div className="mt-3 space-y-2">
          {opts.map((opt, i) => {
            const active = state.selected_index === i;
            return (
              <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${active ? "border-teal-400 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="radio" name={q.id} checked={active} onChange={() => onChange({ selected_index: i })} className="sr-only" />
                {/* Label pilihan A/B/C/D — sekaligus jadi penanda terpilih */}
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${active ? "border-teal-500 bg-teal-500 text-white" : "border-slate-300 bg-white text-slate-500"}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-slate-700">{q.type === "true_false_ng" ? opt : stripOptionLabel(opt, i)}</span>
              </label>
            );
          })}
        </div>
      )}

      {(q.type === "fill_blank" || q.type === "short_answer") && (
        <input
          value={state.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Ketik jawabanmu…"
          // [sim-proctor-v2] koreksi ejaan/isi otomatis browser = bantuan jawaban → dimatikan.
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
        />
      )}

      {q.type === "essay" && (
        <textarea
          value={state.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Tulis esai kamu di sini…"
          // [sim-proctor-v2] tanpa saran ejaan/tata bahasa browser — esai dinilai apa adanya.
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          className="mt-3 min-h-[160px] w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
        />
      )}

      {q.type === "speaking_task" && (
        <SpeakingRecorder state={state} onChange={onChange} />
      )}
    </div>
  );
}

// ── Mic recorder (MediaRecorder) ────────────────────────────────────────────
function SpeakingRecorder({ state, onChange }: { state: AnswerState; onChange: (p: Partial<AnswerState>) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [err, setErr] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function startRec() {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onChange({ audioBlob: blob });
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setErr("Tidak bisa mengakses mikrofon. Izinkan akses mikrofon di browser.");
    }
  }

  function stopRec() {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-xs text-slate-500">🎤 Rekam jawabanmu.</p>
      <div className="flex items-center gap-3">
        {recording ? (
          <button onClick={stopRec} className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white">
            <Square className="h-4 w-4" />Stop
          </button>
        ) : (
          <button onClick={startRec} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: TEAL }}>
            <Mic className="h-4 w-4" />{state.audioBlob ? "Rekam ulang" : "Mulai rekam"}
          </button>
        )}
        {recording && <span className="flex items-center gap-1.5 text-sm font-medium text-red-500"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />{mm}:{ss}</span>}
      </div>
      {previewUrl && !recording && <audio controls src={previewUrl} className="mt-3 w-full" />}
      {state.audioBlob && !recording && <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Rekaman tersimpan</p>}
      {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
    </div>
  );
}
