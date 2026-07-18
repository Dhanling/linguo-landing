"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  fetchSimulation, getStudentInfo, createAttempt, uploadRecording,
  gradeObjective, gradeWithAI, saveAnswers, finalizeAttempt,
  AUTO_GRADED, SKILL_LABEL, testTypeLabel,
  TEST_OVERVIEW, SKILL_HOWTO, GENERAL_RULES,
  type Simulation, type Section, type Question, type AnswerPayload, type StudentInfo, type Skill,
} from "@/lib/simulations";
import {
  ArrowLeft, ArrowRight, BookOpen, Headphones, PenLine, Mic, Square,
  Loader2, CheckCircle2, Trophy, Sparkles, ListChecks, AlertCircle, ClipboardCheck,
  Clock, X, Info, ChevronDown, Check, Play, Pause, RotateCcw, RotateCw,
  GripVertical, Minimize2, PlayCircle, Type, Moon, Sun, Maximize, Minimize,
} from "lucide-react";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const YELLOW = "#FFC93C";

const SKILL_ICON: Record<string, any> = { reading: BookOpen, listening: Headphones, writing: PenLine, speaking: Mic, structure: Type };

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
const ALLOWED_STYLE_PROP = /^(text-align|font-size|font-weight|font-style|text-decoration(-line|-style)?|font-family|vertical-align)$/;
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
function SmartText({ text, className }: { text: string; className?: string }) {
  if (isHtml(text)) {
    return (
      <div
        className={`${className ?? ""} [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5`.trim()}
        dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(text) }}
      />
    );
  }
  return <RichText text={text} className={className} />;
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

// Admin bisa memotong intro/akhir video → tersimpan sbg &start= / &end= (detik).
// Bentuk src embed yang menghormati trim supaya siswa langsung mulai setelah intro.
function youtubeEmbedSrc(url: string): string | null {
  const id = youtubeEmbedId(url);
  if (!id) return null;
  const num = (re: RegExp) => { const m = (url || "").match(re); return m ? Math.max(0, parseInt(m[1], 10) || 0) : 0; };
  const start = num(/[?&](?:start|t)=(\d+)/);
  const end = num(/[?&]end=(\d+)/);
  const p = new URLSearchParams();
  if (start > 0) p.set("start", String(start));
  if (end > 0) p.set("end", String(end));
  const qs = p.toString();
  return `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : ""}`;
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
type Phase = "loading" | "intro" | "running" | "grading" | "result" | "noauth" | "notfound";
type ResultItem = { question: Question; skill: string; correct: boolean | null; points: number; ai_score: number | null; ai_feedback: string | null };

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
  // Tiap bagian diawali layar "intro/petunjuk" sebelum soalnya. Set = bagian yang
  // intronya sudah dilewati (siswa klik "Mulai bagian ini") → tampil soal.
  const [introDone, setIntroDone] = useState<Set<number>>(new Set());
  const dismissIntro = (si: number) => setIntroDone((prev) => { const n = new Set(prev); n.add(si); return n; });
  const reopenIntro = (si: number) => { setSecIdx(si); setIntroDone((prev) => { const n = new Set(prev); n.delete(si); return n; }); };
  // Layar penuh (fokus ala ujian). Dipanggil dari gesture user (klik Mulai) supaya
  // tak diblokir browser; abaikan bila gagal (mis. izin ditolak).
  const enterFullscreen = () => { if (!fsElement()) requestFs(document.documentElement); };
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [results, setResults] = useState<ResultItem[]>([]);
  const [totals, setTotals] = useState({ score: 0, max_score: 0, auto_score: 0, ai_score: 0 });
  const [gradingMsg, setGradingMsg] = useState("");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    (async () => {
      let studentInfo = await getStudentInfo();
      if (!studentInfo) {
        if (!preview) { setPhase("noauth"); return; }
        studentInfo = { name: "Preview", email: "preview@linguo.id" } as StudentInfo; // dummy, tak disimpan
      }
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
      setPhase("intro");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, preview]);

  // Catat bagian terjauh yang pernah dibuka — soal di bagian yang sudah dilewati
  // namun belum dijawab dianggap "dilewati" (ditandai merah di navigasi).
  useEffect(() => { setMaxSecIdx((m) => Math.max(m, secIdx)); }, [secIdx]);

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
    requestAnimationFrame(() => setTimeout(() => {
      const el = document.getElementById(`q-${qid}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-teal-400");
      setTimeout(() => el?.classList.remove("ring-2", "ring-teal-400"), 1200);
    }, 60));
  }

  async function start() {
    if (!sim || !info) return;
    enterFullscreen(); // masuk layar penuh saat mulai (fokus ala ujian)
    if (preview) {
      setAttemptId("preview"); // tak menyimpan attempt sungguhan
    } else {
      const aid = await createAttempt(sim.id, info);
      if (!aid) { alert("Gagal memulai simulasi. Coba lagi."); return; }
      setAttemptId(aid);
    }
    // Durasi total = durasi simulasi bila diset; kalau 0, jumlahkan durasi tiap
    // bagian (mis. TOEFL ITP yang waktunya per-bagian) → timer tetap otomatis muncul.
    const totalMin = sim.duration_minutes > 0
      ? sim.duration_minutes
      : sections.reduce((n, s) => n + (s.duration_minutes || 0), 0);
    if (totalMin > 0) {
      const dl = Date.now() + totalMin * 60_000;
      setDeadline(dl);
      setRemaining(totalMin * 60);
    }
    setPhase("running");
  }

  // Countdown timer — auto-submit saat waktu habis.
  useEffect(() => {
    if (phase !== "running" || !deadline) return;
    const tick = () => {
      const secs = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) submit(true); // waktu habis → kirim paksa walau belum lengkap
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadline]);

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

    let aiCount = 0;
    questions.forEach((q) => { if (!AUTO_GRADED.includes(q.type)) aiCount++; });
    let aiDone = 0;

    for (const q of questions) {
      const skill = (skillOf[q.id] as any) || "reading";
      const a = answers[q.id] ?? { selected_index: null, text: "", audioBlob: null, audioUrl: null };
      maxScore += q.points;

      if (AUTO_GRADED.includes(q.type)) {
        const { correct, points } = gradeObjective(q, a.selected_index, a.text);
        autoScore += points;
        payloads.push({
          question_id: q.id, section_skill: skill,
          response_text: a.text || null, audio_url: null, selected_index: a.selected_index,
          is_correct: correct, points_earned: points, ai_score: null, ai_feedback: null,
        });
        resultItems.push({ question: q, skill, correct, points, ai_score: null, ai_feedback: null });
      } else if (preview) {
        // Mode preview — tidak memanggil AI (hemat biaya), tampilkan placeholder.
        resultItems.push({ question: q, skill, correct: null, points: 0, ai_score: null, ai_feedback: "Mode preview — Writing/Speaking tidak dinilai." });
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
        resultItems.push({ question: q, skill, correct: null, points: earned, ai_score: ai, ai_feedback: graded?.feedback ?? null });
      }
    }

    const score = autoScore + aiScore;
    const t = { score, max_score: maxScore, auto_score: autoScore, ai_score: aiScore };
    if (!preview) { // mode preview tidak menyimpan attempt/jawaban ke database
      await saveAnswers(attemptId, payloads);
      await finalizeAttempt(attemptId, t);
    }
    setTotals(t);
    setResults(resultItems);
    setPhase("result");
  }

  // ── Render states ──────────────────────────────────────────────────────────
  if (phase === "loading") return <Centered><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></Centered>;

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
    <ResultView sim={sim} totals={totals} results={results} preview={preview} />
  );

  // intro — onboarding wizard 3 langkah sebelum mulai mengerjakan
  if (phase === "intro") {
    return (
      <Shell sim={sim} preview={preview}>
        <IntroWizard sim={sim} sections={sections} questions={questions} onStart={start} />
      </Shell>
    );
  }

  // running
  const section = sections[secIdx];
  const secQs = questions.filter((q) => q.section_id === section.id);
  const isLast = secIdx === sections.length - 1;
  const SkillIcon = SKILL_ICON[section.skill];
  const hasMedia = !!(section.audio_url || section.passage);
  const sectionHeader = (
    <>
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
        <SkillIcon className="h-4 w-4" />{SKILL_LABEL[section.skill]} · Bagian {secIdx + 1}/{sections.length}
      </div>
      <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
      {section.instructions && (
        isHtml(section.instructions)
          ? <SmartText text={section.instructions} className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600" />
          : <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{section.instructions}</p>
      )}
    </>
  );

  // Layar intro/petunjuk bagian — tampil sebelum soal tiap bagian (template default
  // per skill, atau instruksi kustom admin). Alur: intro → soal → intro → soal, dst.
  if (!introDone.has(secIdx)) {
    const tpl = SECTION_INTRO[section.skill] ?? { title: "Petunjuk Bagian", points: [] };
    const customInstr = section.instructions?.trim();
    return (
      <Shell sim={sim} preview={preview} confirmExit headerRight={remaining != null ? <TimerPill seconds={remaining} /> : undefined}>
        <div className="mb-4 flex items-center gap-1.5">
          {sections.map((s, i) => (
            <div key={s.id} className="sim-track h-1.5 flex-1 rounded-full" style={{ background: i <= secIdx ? TEAL : undefined }} />
          ))}
        </div>

        <QuestionNavigator
          sections={sections} questions={questions} answers={answers}
          currentSecIdx={secIdx} maxVisitedSecIdx={maxSecIdx}
          onJump={goToQuestion} onIntro={reopenIntro} qNumber={qNumber}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
            <SkillIcon className="h-4 w-4" />{SKILL_LABEL[section.skill]} · Bagian {secIdx + 1}/{sections.length}
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

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              disabled={secIdx === 0}
              onClick={() => setSecIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />Bagian sebelumnya
            </button>
            <button onClick={() => { enterFullscreen(); dismissIntro(secIdx); }} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
              <PlayCircle className="h-4 w-4" />Mulai bagian ini
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell sim={sim} preview={preview} wide={hasMedia} confirmExit headerRight={remaining != null ? <TimerPill seconds={remaining} /> : undefined}>
      {/* progress */}
      <div className="mb-4 flex items-center gap-1.5">
        {sections.map((s, i) => (
          <div key={s.id} className="sim-track h-1.5 flex-1 rounded-full" style={{ background: i <= secIdx ? TEAL : undefined }} />
        ))}
      </div>

      <QuestionNavigator
        sections={sections}
        questions={questions}
        answers={answers}
        currentSecIdx={secIdx}
        maxVisitedSecIdx={maxSecIdx}
        onJump={goToQuestion}
        onIntro={reopenIntro}
        qNumber={qNumber}
      />

      {/* Split view ala ujian CBT asli: materi (passage/audio) sticky di kiri,
          soal discroll di kanan. Pembatas bisa digeser (drag) untuk mengatur
          lebar. Bagian tanpa materi tetap satu kolom. */}
      {(() => {
        const mediaCard = (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:flex lg:max-h-[calc(100vh-8rem)] lg:min-h-0 lg:flex-col">
            {sectionHeader}
            {section.audio_url && (
              youtubeEmbedId(section.audio_url) ? (
                <div className="mt-3 aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-slate-200">
                  <iframe
                    className="h-full w-full"
                    src={youtubeEmbedSrc(section.audio_url)!}
                    title="Audio listening"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                // Mobile: player nempel di bawah header saat scroll soal; desktop udah sticky di pane kiri.
                <div className="sticky top-[72px] z-20 mt-3 shrink-0 rounded-xl bg-white/95 py-1 backdrop-blur lg:static lg:py-0">
                  <RangedAudio url={section.audio_url} className="w-full" />
                </div>
              )
            )}
            {section.passage && (
              isHtml(section.passage)
                ? <SmartText text={section.passage} className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 [&_p]:text-justify [&_p]:hyphens-auto lg:max-h-none lg:min-h-0 lg:flex-1" />
                : <PassageText text={section.passage} className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 lg:max-h-none lg:min-h-0 lg:flex-1" />
            )}
          </div>
        );

        const questionsCard = (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            {!hasMedia && sectionHeader}

            <div className="mt-5 space-y-5 first:mt-0">
              {secQs.map((q) => (
                <QuestionBlock key={q.id} index={qNumber[q.id]} q={q} state={answers[q.id]} onChange={(p) => setAns(q.id, p)} />
              ))}
              {secQs.length === 0 && <p className="text-sm text-slate-400">Tidak ada soal di bagian ini.</p>}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                disabled={secIdx === 0}
                onClick={() => setSecIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />Sebelumnya
              </button>
              {isLast ? (
                <button onClick={() => submit()} className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white" style={{ background: TEAL_DEEP }}>
                  <CheckCircle2 className="h-4 w-4" />Selesai &amp; Kirim
                </button>
              ) : (
                <button
                  onClick={() => {
                    const next = secIdx + 1;
                    // Bagian berikutnya masih skill yang sama (mis. Listening Part 2
                    // setelah Part 1) → lewati layar intro, langsung tampilkan soal &
                    // audionya karena petunjuknya sama dgn bagian sebelumnya.
                    if (sections[next]?.skill === section.skill) dismissIntro(next);
                    setSecIdx(next);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white"
                  style={{ background: TEAL }}
                >
                  Lanjut <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );

        return hasMedia ? <SplitPane left={mediaCard} right={questionsCard} /> : questionsCard;
      })()}
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

// ── Onboarding wizard: Ikhtisar → Petunjuk & cek mic → Rincian bagian ─────────
const INTRO_STEPS = ["Ikhtisar", "Petunjuk", "Rincian"] as const;

function IntroWizard({ sim, sections, questions, onStart }: {
  sim: Simulation; sections: Section[]; questions: Question[]; onStart: () => void;
}) {
  const [step, setStep] = useState(0);
  const hasSpeaking = useMemo(() => sections.some((s) => s.skill === "speaking"), [sections]);
  const rules = GENERAL_RULES.filter((r) => !r.timed || sim.duration_minutes > 0);

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
            <Stat icon={Clock} label="Durasi" value={sim.duration_minutes > 0 ? `${sim.duration_minutes} menit` : "Tanpa batas"} />
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
      <aside className="mb-4 lg:sticky lg:top-24 lg:mb-0 lg:w-[var(--sim-left)] lg:shrink-0">{left}</aside>
      <div
        onPointerDown={onDown}
        title="Geser untuk mengatur lebar bacaan & soal"
        className="group relative hidden shrink-0 cursor-col-resize touch-none select-none lg:sticky lg:top-24 lg:flex lg:h-[calc(100vh-8rem)] lg:w-5 lg:items-center lg:justify-center"
      >
        <div className="h-16 w-1.5 rounded-full bg-slate-200 transition-colors group-hover:bg-teal-400 group-active:bg-teal-500" />
      </div>
      <div className="lg:min-w-0 lg:flex-1">{right}</div>
    </div>
  );
}

function Shell({ sim, children, headerRight, preview, wide, confirmExit }: { sim: Simulation; children: React.ReactNode; headerRight?: React.ReactNode; preview?: boolean; wide?: boolean; confirmExit?: boolean }) {
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
    <div className={`sim-shell min-h-screen bg-slate-50${dark ? " sim-dark" : ""}`}>
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
        .sim-dark .text-slate-500 { color: #93a0ac; }
        .sim-dark .text-slate-400 { color: #74818d; }
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
        /* Bar progress (segmen non-aktif) — warna via kelas biar bisa ikut gelap. */
        .sim-shell .sim-track { background-color: #e2e8f0; }
        .sim-dark .sim-track { background-color: #26323f; }
      `}</style>
      {preview && (
        <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          Mode Preview — tampilan POV siswa. Jawaban & nilai tidak disimpan.
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className={`mx-auto flex ${maxW} items-center gap-3 px-4 py-3.5 sm:px-6`}>
          {confirmExit && !preview ? (
            // Siswa sungguhan: konfirmasi dulu (cegah kehilangan progres/waktu).
            <button type="button" onClick={() => setAskExit(true)} title="Keluar simulasi" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
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
          <button
            onClick={toggleFs}
            title={fs ? "Keluar layar penuh" : "Layar penuh"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            {fs ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </header>
      <main className={`mx-auto ${maxW} px-4 py-6 sm:px-6`}>{children}</main>

      {/* Konfirmasi keluar sesi tes — cegah keluar tak sengaja saat mengerjakan. */}
      {askExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAskExit(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900">Keluar dari simulasi?</p>
                <p className="mt-1 text-sm text-slate-500">
                  {preview
                    ? "Kamu akan keluar dari mode preview."
                    : "Progres & sisa waktu bagian ini bisa hilang. Kamu yakin mau keluar?"}
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
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
              >
                Ya, keluar
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

// ── Navigasi soal mengambang: blok nomor + status terjawab/belum/dilewati ────
type NavStatus = "answered" | "skipped" | "todo";

function QuestionNavigator({ sections, questions, answers, currentSecIdx, maxVisitedSecIdx, onJump, onIntro, qNumber }: {
  sections: Section[]; questions: Question[]; answers: Record<string, AnswerState>;
  currentSecIdx: number; maxVisitedSecIdx: number; onJump: (secIdx: number, qid: string) => void;
  onIntro?: (secIdx: number) => void;
  qNumber: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);

  // Panel desktop (xl+) bisa digeser bebas & diminimize jadi tombol mengambang.
  // Posisi & status minimize disimpan di localStorage supaya tetap saat pindah soal.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [minimized, setMinimized] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  useEffect(() => {
    try {
      const p = localStorage.getItem("sim-nav-pos");
      if (p) { const v = JSON.parse(p); setPos({ x: v.x, y: Math.max(96, v.y) }); } // jangan menutupi header (tombol kembali)
      setMinimized(localStorage.getItem("sim-nav-min") === "1");
    } catch { /* ignore */ }
  }, []);
  const onDragMove = (e: PointerEvent) => {
    if (!dragRef.current || !panelRef.current) return;
    const w = panelRef.current.offsetWidth, h = panelRef.current.offsetHeight;
    const x = Math.min(Math.max(8, e.clientX - dragRef.current.dx), window.innerWidth - w - 8);
    const y = Math.min(Math.max(96, e.clientY - dragRef.current.dy), window.innerHeight - Math.min(h, 120) - 8);
    setPos({ x, y });
  };
  const onDragEnd = () => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
    setPos((p) => { try { if (p) localStorage.setItem("sim-nav-pos", JSON.stringify(p)); } catch { /* ignore */ } return p; });
  };
  const onDragStart = (e: React.PointerEvent) => {
    if (!panelRef.current) return;
    const r = panelRef.current.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd);
  };
  const setMin = (v: boolean) => { setMinimized(v); try { localStorage.setItem("sim-nav-min", v ? "1" : "0"); } catch { /* ignore */ } };

  // Kelompokkan section menurut skill → maksimal 4 tab (Reading/Listening/Speaking/Writing).
  // Tiap skill berisi satu/lebih "part" (bagian). Accordion 2 tingkat: skill → part → soal.
  const groups = useMemo(() => {
    const map: { skill: Skill; parts: { section: Section; si: number; qs: Question[] }[] }[] = [];
    sections.forEach((s, si) => {
      const qs = questions.filter((q) => q.section_id === s.id);
      if (qs.length === 0) return;
      let g = map.find((x) => x.skill === s.skill);
      if (!g) { g = { skill: s.skill, parts: [] }; map.push(g); }
      g.parts.push({ section: s, si, qs });
    });
    return map;
  }, [sections, questions]);

  const currentSkill = sections[currentSecIdx]?.skill ?? null;
  // Accordion: hanya skill & part yang aktif yang terbuka, lainnya otomatis ter-collapse.
  const [openSkill, setOpenSkill] = useState<Skill | null>(currentSkill);
  const [openPart, setOpenPart] = useState(currentSecIdx);
  useEffect(() => {
    setOpenSkill(sections[currentSecIdx]?.skill ?? null);
    setOpenPart(currentSecIdx);
  }, [currentSecIdx, sections]);

  const statusOf = (q: Question, si: number): NavStatus => {
    if (isAnswered(q, answers[q.id])) return "answered";
    return si < maxVisitedSecIdx ? "skipped" : "todo"; // dilewati vs belum dibuka
  };

  let answeredCount = 0, skippedCount = 0;
  sections.forEach((s, si) => questions.filter((q) => q.section_id === s.id).forEach((q) => {
    const st = statusOf(q, si);
    if (st === "answered") answeredCount++;
    else if (st === "skipped") skippedCount++;
  }));

  const handleJump = (si: number, qid: string) => { onJump(si, qid); setOpen(false); };

  const body = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <ListChecks className="h-4 w-4 text-teal-600" />Navigasi Soal
        </p>
        <span className="text-xs font-medium text-slate-500">{answeredCount}/{questions.length} terjawab</span>
      </div>

      {skippedCount > 0 && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />{skippedCount} soal terlewati belum dijawab
        </p>
      )}

      <div className="space-y-2">
        {groups.map((g) => {
          const Icon = SKILL_ICON[g.skill];
          const isSkillOpen = openSkill === g.skill;
          const allQs = g.parts.flatMap((p) => p.qs);
          const ansInSkill = allQs.filter((q) => isAnswered(q, answers[q.id])).length;
          const skipInSkill = g.parts.reduce((n, p) => n + p.qs.filter((q) => statusOf(q, p.si) === "skipped").length, 0);
          const isActiveSkill = g.skill === currentSkill;
          const multiPart = g.parts.length > 1;

          // Grid nomor soal untuk satu part — diawali chip "Intro" (petunjuk bagian).
          const qGrid = (qs: Question[], si: number) => (
            <div className="flex flex-wrap gap-1.5">
              {onIntro && (
                <button
                  type="button"
                  onClick={() => { onIntro(si); setOpen(false); }}
                  title="Lihat petunjuk bagian ini"
                  className="flex h-9 items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 text-[11px] font-semibold text-teal-700 transition hover:border-teal-300"
                >
                  <Info className="h-3.5 w-3.5" />Intro
                </button>
              )}
              {qs.map((q) => {
                const st = statusOf(q, si);
                const num = qNumber[q.id];
                const cls =
                  st === "answered" ? "text-white"
                  : st === "skipped" ? "border border-red-300 bg-red-50 text-red-600 hover:border-red-400"
                  : "border border-slate-300 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-700";
                const label = st === "answered" ? "sudah dijawab" : st === "skipped" ? "terlewati — belum dijawab" : "belum dijawab";
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleJump(si, q.id)}
                    title={`Soal ${num} · ${label}`}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-1.5 text-xs font-semibold tabular-nums transition ${cls}`}
                    style={st === "answered" ? { background: TEAL } : undefined}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          );

          return (
            <div key={g.skill} className="overflow-hidden rounded-xl border border-slate-100">
              <button
                type="button"
                onClick={() => setOpenSkill(isSkillOpen ? null : g.skill)}
                className={`flex w-full items-center gap-1.5 px-2.5 py-2 text-xs font-semibold ${isActiveSkill ? "bg-teal-50/60 text-teal-800" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="flex-1 truncate text-left">{SKILL_LABEL[g.skill]}</span>
                {isActiveSkill && <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">aktif</span>}
                {skipInSkill > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] text-white">{skipInSkill}</span>}
                <span className="text-[10px] font-medium text-slate-400 tabular-nums">{ansInSkill}/{allQs.length}</span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isSkillOpen ? "rotate-180" : ""}`} />
              </button>

              {isSkillOpen && (
                multiPart ? (
                  // >1 bagian → tampilkan accordion "Part 1 / Part 2 / …".
                  <div className="space-y-1.5 px-2 pb-2.5 pt-1">
                    {g.parts.map((p, pi) => {
                      const isPartOpen = openPart === p.si;
                      const ansInPart = p.qs.filter((q) => isAnswered(q, answers[q.id])).length;
                      const skipInPart = p.qs.filter((q) => statusOf(q, p.si) === "skipped").length;
                      const isActivePart = p.si === currentSecIdx;
                      return (
                        <div key={p.section.id} className="overflow-hidden rounded-lg border border-slate-100">
                          <button
                            type="button"
                            onClick={() => setOpenPart(isPartOpen ? -1 : p.si)}
                            className={`flex w-full items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold ${isActivePart ? "bg-teal-50/60 text-teal-800" : "text-slate-500 hover:bg-slate-50"}`}
                          >
                            <span className="flex-1 truncate text-left">Part {pi + 1}</span>
                            {isActivePart && <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-semibold text-teal-700">aktif</span>}
                            {skipInPart > 0 && <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">{skipInPart}</span>}
                            <span className="text-[10px] font-medium text-slate-400 tabular-nums">{ansInPart}/{p.qs.length}</span>
                            <ChevronDown className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${isPartOpen ? "rotate-180" : ""}`} />
                          </button>
                          {isPartOpen && <div className="px-2 pb-2 pt-1.5">{qGrid(p.qs, p.si)}</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // 1 bagian → langsung grid nomor, tanpa label "Part".
                  <div className="px-2.5 pb-2.5 pt-0.5">{qGrid(g.parts[0].qs, g.parts[0].si)}</div>
                )
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: TEAL }} />Terjawab</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-red-300 bg-red-50" />Dilewati</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-slate-300 bg-white" />Belum</span>
      </div>
    </>
  );

  return (
    <>
      {/* Panel mengambang — layar lebar (xl+). Bisa digeser via header & diminimize. */}
      {!minimized && (
        <aside
          ref={panelRef}
          className="fixed z-30 hidden max-h-[calc(100vh-7rem)] w-56 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg xl:flex"
          style={pos ? { left: pos.x, top: pos.y } : { right: 16, top: 96 }}
        >
          {/* Header = drag handle */}
          <div
            onPointerDown={onDragStart}
            className="flex shrink-0 cursor-grab items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-3 py-2 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="flex-1 text-xs font-bold text-slate-600">Navigasi Soal</span>
            <span className="text-[10px] font-medium text-slate-400 tabular-nums">{answeredCount}/{questions.length}</span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setMin(true)}
              title="Minimize"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200/70 hover:text-slate-600"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="overflow-y-auto p-4">{body}</div>
        </aside>
      )}

      {/* Tombol mengambang restore — layar lebar saat diminimize */}
      {minimized && (
        <button
          type="button"
          onClick={() => setMin(false)}
          className="fixed bottom-5 right-5 z-30 hidden items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg xl:flex"
          style={{ background: TEAL }}
          title="Buka Navigasi Soal"
        >
          <ListChecks className="h-5 w-5" />
          {answeredCount}/{questions.length}
          {skippedCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px]">{skippedCount}</span>}
        </button>
      )}

      {/* Tombol mengambang — layar kecil/sedang */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg xl:hidden"
        style={{ background: TEAL }}
      >
        <ListChecks className="h-5 w-5" />
        {answeredCount}/{questions.length}
        {skippedCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px]">{skippedCount}</span>}
      </button>

      {/* Slide-over — layar kecil/sedang */}
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30 xl:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-72 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {body}
          </div>
        </div>
      )}
    </>
  );
}

// ── Per-question input ──────────────────────────────────────────────────────
const TFNG = ["True", "False", "Not Given"];

// Buang prefiks label "(A) " / "A. " / "A) " bawaan import — badge A/B/C/D sudah
// dirender sendiri, jadi tanpa ini teksnya jadi dobel ("(A) (A) Each of").
function stripOptionLabel(opt: string, i: number): string {
  const letter = String.fromCharCode(65 + i);
  const stripped = opt.replace(new RegExp(`^\\s*[([]?${letter}[)\\].:\\-]?\\s+`, "i"), "").trim();
  return stripped || opt;
}

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
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
        />
      )}

      {q.type === "essay" && (
        <textarea
          value={state.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Tulis esai kamu di sini…"
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

// ── Result ──────────────────────────────────────────────────────────────────
function ResultView({ sim, totals, results, preview }: { sim: Simulation; totals: { score: number; max_score: number; auto_score: number; ai_score: number }; results: ResultItem[]; preview?: boolean }) {
  const pct = totals.max_score > 0 ? Math.round((totals.score / totals.max_score) * 100) : 0;
  // Nomor soal RESET ke 1 tiap bagian (part) — samakan dgn tampilan saat mengerjakan.
  const resultNo = useMemo(() => {
    const arr: number[] = []; let prevSec = ""; let n = 0;
    results.forEach((r) => {
      if (r.question.section_id !== prevSec) { prevSec = r.question.section_id; n = 1; } else { n += 1; }
      arr.push(n);
    });
    return arr;
  }, [results]);
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: TEAL_DEEP }}>
            <Trophy className="h-7 w-7" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Simulasi selesai!</h1>
          <p className="text-sm text-slate-500">{sim.title}</p>
          <div className="mt-4 inline-flex items-baseline gap-1">
            <span className="text-4xl font-extrabold" style={{ color: TEAL_DEEP }}>{Math.round(totals.score)}</span>
            <span className="text-lg font-semibold text-slate-400">/ {Math.round(totals.max_score)}</span>
          </div>
          <p className="text-sm font-medium text-slate-600">{pct}% · objektif {Math.round(totals.auto_score)} + penilaian {Math.round(totals.ai_score)}</p>
        </div>

        <h2 className="mt-6 mb-3 text-sm font-bold text-slate-700">Rincian jawaban</h2>
        <ol className="space-y-3">
          {results.map((r, i) => (
            <li key={r.question.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900"><span className="mr-1 text-slate-400">{resultNo[i]}.</span>{r.question.prompt}</p>
              {r.question.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.question.image_url} alt="Visual soal" className="mt-2 max-h-72 w-full rounded-lg border border-slate-200 object-contain bg-slate-50" />
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{SKILL_LABEL[r.skill as keyof typeof SKILL_LABEL] ?? r.skill}</span>
                {r.correct === true && <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Benar</span>}
                {r.correct === false && <span className="font-semibold text-red-500">Kurang tepat</span>}
                {r.ai_score != null && <span className="inline-flex items-center gap-1 font-semibold text-violet-600"><Sparkles className="h-3.5 w-3.5" />Skor {r.ai_score}/100</span>}
              </div>
              {r.correct === false && r.question.explanation && (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">💡 {r.question.explanation}</p>
              )}
              {r.ai_feedback && (
                <p className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700"><Sparkles className="mr-1 inline h-3 w-3" />{r.ai_feedback}</p>
              )}
            </li>
          ))}
        </ol>

        {/* Preview dibuka admin di tab baru tanpa sesi siswa → hindari /akun* yg
            login-gated; cukup satu tombol tutup preview ke katalog publik. */}
        <div className="mt-6 flex gap-3">
          {preview ? (
            <Link href="/simulasi" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">
              <ArrowLeft className="h-4 w-4" />Tutup preview
            </Link>
          ) : (
            <>
              <Link href="/akun/simulasi" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">
                <ArrowLeft className="h-4 w-4" />Simulasi lain
              </Link>
              <Link href="/akun" className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: TEAL }}>
                Ke Dashboard
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
