"use client";

// [lingbook-phase1-v1] Reader ebook interaktif Lingbook. Language-agnostic:
// furigana via <ruby> native, field grammar dirender dinamis per bahasa.
// Word card = popover (desktop) / bottom sheet (mobile, breakpoint md=768px).
// Audio pengucapan via Gemini 2.5 Flash TTS (lihat lingbook-speech.ts, fallback
// Web Speech); field *Src siap diganti file storage. Semua teks UI bahasa Indonesia.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AudioBlock,
  Book,
  Chapter,
  ContentBlock,
  DialogLine,
  GrammarPointBlock,
  ObjectivesBlock,
  StepId,
  TableCell,
  Token,
  VocabListBlock,
  Word,
} from "@/data/lingbook";
import { tokensToText } from "@/data/lingbook";
import {
  loadLocalProgress,
  saveLocalProgress,
  loadRemoteProgress,
  saveRemoteProgress,
  mergeProgress,
} from "@/data/lingbook/progress";
import { cancelSpeech, speak } from "@/lib/lingbook-speech";
import { LatihanSection, TestSection } from "./Exercises";
import AskAiPanel, { type AskContext } from "./AskAiPanel";
import RoleplayModal from "./RoleplayModal";
import { PURPLE } from "./theme";

const TEAL = "#1A9E9E";
const DARK = "#11313A";
const CJK_FONT = "'Noto Sans JP', 'Hiragino Sans', sans-serif";
const SERIF_FONT = "'Source Serif 4', Georgia, serif";
const MD = 768;

// Warna badge kelas kata (bg, teks).
function posTheme(pos: string): [string, string] {
  const m: Record<string, [string, string]> = {
    verba: ["#DDF1EE", "var(--lb-teal-ink)"],
    nomina: ["#E1EDF8", "#2A6CA8"],
    partikel: ["#ECE8F9", "#6B54C8"],
    ungkapan: ["#FBF0DB", "#9A6B14"],
    adjektiva: ["#E4F3DF", "#3E7D2E"],
    pronomina: ["#FCE8E4", "#B04A32"],
    kopula: ["#E8EEF0", "#41626B"],
    sufiks: ["#F0EAF3", "#7A5FA0"],
    adverbia: ["#E8F0E8", "#4A7A50"],
    preposisi: ["#ECE8F9", "#6B54C8"],
    artikel: ["#ECE8F9", "#6B54C8"],
    konjungsi: ["#ECE8F9", "#6B54C8"],
  };
  return m[pos] || ["#E8EEF0", "#41626B"];
}

const CLOSING = new Set([",", ".", "!", "?", ";", ":"]);

type CardPos = { left: number; top: number; above: boolean } | null;
type Selection = { key: string; word: Word } | null;

// Konteks interaktif untuk block unit (objectives checklist, vocab_list save-all).
type UnitCtx = {
  stepDone: Set<StepId>;
  saved: Set<string>;
  allSavedRefs: boolean;
  onOpenWord: (key: string) => void;
  onSaveAll: () => void;
  onSpeak: (surface: string) => void;
  isCjk: boolean;
};

// ── Render token inline (dipakai paragraf, dialog, callout, caption, tabel, transkrip) ──
function TokenText({
  tokens,
  glossary,
  isCjk,
  isLatin,
  furigana,
  romaji,
  mark,
  clicked,
  selKey,
  onWord,
  dark = false,
  style,
}: {
  tokens: Token[];
  glossary: Record<string, Word>;
  isCjk: boolean;
  isLatin: boolean;
  furigana: boolean;
  romaji: boolean;
  mark: boolean;
  clicked: Set<string>;
  selKey: string | null;
  onWord: (key: string, el: HTMLElement, sentence: string) => void;
  dark?: boolean;
  style?: React.CSSProperties;
}) {
  const sentence = tokens
    .map((tk) => ("ref" in tk ? glossary[tk.ref]?.surface ?? "" : "text" in tk ? tk.text : ""))
    .join(isLatin ? " " : "")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
  return (
    <span style={style}>
      {tokens.map((tk, i) => {
        const isRef = "ref" in tk;
        const word = isRef ? glossary[tk.ref] : null;
        const surface = word ? word.surface : "text" in tk ? tk.text : "";
        const next = tokens[i + 1];
        const nextText = next && "text" in next ? next.text : null;
        const sp =
          isLatin &&
          i < tokens.length - 1 &&
          !(nextText && CLOSING.has(nextText)) &&
          surface !== "¡" &&
          surface !== "¿";
        const mr = sp ? "0.32em" : 0;

        if (!word) {
          return (
            <span key={i} style={{ color: dark ? "#C8DAD8" : "#33565C", marginRight: mr }}>
              {surface}
            </span>
          );
        }

        const key = (tk as { ref: string }).ref;
        const isSel = selKey === key;
        const wasClicked = mark && clicked.has(key);
        let rt = "";
        if (isCjk) {
          if (romaji && word.romaji) rt = word.romaji;
          else if (furigana && word.reading && word.reading !== word.surface) rt = word.reading;
        }
        const wordStyle: React.CSSProperties = {
          cursor: "pointer",
          borderRadius: 4,
          padding: "0 1px",
          transition: "background .15s",
          background: isSel ? (dark ? "rgba(127,212,208,.3)" : "#C4E8E5") : undefined,
          borderBottom: wasClicked
            ? `2px dotted ${dark ? "rgba(127,212,208,.55)" : "rgba(26,158,158,.5)"}`
            : "2px dotted transparent",
          marginRight: mr,
        };
        return (
          <span
            key={i}
            className={dark ? "lb-word lb-word-dark" : "lb-word"}
            style={wordStyle}
            onClick={(e) => onWord(key, e.currentTarget, sentence)}
          >
            {rt ? (
              <ruby>
                {surface}
                <rt style={{ fontSize: "0.46em", color: dark ? "#9BC9C6" : "#4A7A78" }}>{rt}</rt>
              </ruby>
            ) : (
              surface
            )}
          </span>
        );
      })}
    </span>
  );
}

// ── Audio block (player transkrip) — phase 1 simulasi progress + TTS transkrip ──
function AudioPlayerBlock({
  block,
  glossary,
  book,
  tokenTextProps,
}: {
  block: AudioBlock;
  glossary: Record<string, Word>;
  book: Book;
  tokenTextProps: Omit<React.ComponentProps<typeof TokenText>, "tokens" | "style">;
}) {
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [trOpen, setTrOpen] = useState(false);
  const intRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intRef.current) clearInterval(intRef.current); }, []);

  const toggle = () => {
    if (playing) {
      if (intRef.current) clearInterval(intRef.current);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    intRef.current = setInterval(() => {
      setProg((p) => {
        const np = p + (0.2 / block.durationSec) * 100 * speed;
        if (np >= 100) {
          if (intRef.current) clearInterval(intRef.current);
          setPlaying(false);
          return 0;
        }
        return np;
      });
    }, 200);
  };

  const cur = Math.round((prog / 100) * block.durationSec);
  const mm = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;

  return (
    <div style={{ margin: "0 0 24px 0", background: DARK, borderRadius: 16, padding: "16px 18px", color: "#FFFFFF" }}>
      {/* struktur siap: <audio src={block.src}> saat file storage tersedia */}
      <audio src={block.src} preload="none" style={{ display: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={toggle}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "none",
            background: TEAL,
            color: "#FFFFFF",
            fontSize: 15,
            cursor: "pointer",
            flex: "none",
            animation: playing ? "lbPulseRing 1.4s infinite" : "none",
          }}
          aria-label={playing ? "Jeda" : "Putar"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{block.title}</div>
          <div style={{ height: 5, background: "rgba(255,255,255,.18)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${prog}%`, background: "#7FD4D0", borderRadius: 3, transition: "width .2s linear" }} />
          </div>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,.7)", fontVariantNumeric: "tabular-nums" }}>
          {mm(cur)} / {mm(block.durationSec)}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        {[0.75, 1, 1.25].map((v) => (
          <button
            key={v}
            onClick={() => setSpeed(v)}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "none",
              background: speed === v ? "#7FD4D0" : "rgba(255,255,255,.12)",
              color: speed === v ? DARK : "rgba(255,255,255,.75)",
              fontFamily: "inherit",
              fontSize: 11.5,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {v}x
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {block.transcript && block.transcript.length > 0 && (
          <button
            onClick={() => setTrOpen((v) => !v)}
            style={{ background: "none", border: "none", color: "#7FD4D0", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            {trOpen ? "Sembunyikan transkrip ▲" : "Lihat transkrip ▼"}
          </button>
        )}
      </div>
      {trOpen && block.transcript && (
        <div style={{ marginTop: 14, padding: 14, background: "rgba(255,255,255,.06)", borderRadius: 10 }}>
          {block.transcript.map((ln, li) => (
            <div key={li} style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#7FD4D0", marginRight: 8 }}>{ln.name}</span>
              <TokenText
                {...tokenTextProps}
                tokens={ln.tokens}
                dark
                style={{
                  fontFamily: book.language.script === "cjk" ? CJK_FONT : SERIF_FONT,
                  fontSize: book.language.script === "cjk" ? 17 : 15.5,
                  lineHeight: 2.1,
                  color: "#EAF4F3",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LingbookReader({ book, chapter }: { book: Book; chapter: Chapter }) {
  const router = useRouter();
  const isCjk = book.language.script === "cjk";
  const isLatin = book.language.script === "latin" || book.language.script === "cyrillic";
  const readFont = isCjk ? CJK_FONT : SERIF_FONT;
  const glossary = chapter.glossary;

  const [isMobile, setIsMobile] = useState(false);
  // Default: tampilkan transliterasi Latin (romaji) + terjemahan Indonesia supaya
  // pemula langsung terbantu; furigana off krn romaji sudah jadi bantuan baca
  // (keduanya eksklusif — lihat setter di ReaderSettings). Semua bisa di-toggle.
  const [furigana, setFurigana] = useState(false);
  const [romaji, setRomaji] = useState(true);
  const [trans, setTrans] = useState(true);
  const [mark, setMark] = useState(true);
  const [fs, setFs] = useState(1);

  const [clicked, setClicked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<Selection>(null);
  const [cardPos, setCardPos] = useState<CardPos>(null);
  const [cardSpeaking, setCardSpeaking] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [prog, setProg] = useState(4);
  const [dark, setDark] = useState(false);

  // Preferensi mode gelap — persist per-perangkat, default ikut sistem.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lingbook-dark");
      if (saved === "1") setDark(true);
      else if (saved === "0") setDark(false);
      else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setDark(true);
    } catch { /* no-op */ }
  }, []);
  const toggleDark = useCallback(() => {
    setDark((v) => {
      const nx = !v;
      try { localStorage.setItem("lingbook-dark", nx ? "1" : "0"); } catch { /* no-op */ }
      return nx;
    });
  }, []);

  // ── Unit mode (phase 2) — stepper + progress per section ──
  const steps = chapter.steps ?? [];
  const isUnit = steps.length > 0;
  const [step, setStep] = useState(0);
  const [stepDone, setStepDone] = useState<Set<StepId>>(new Set());
  const [score, setScore] = useState<number | null>(null);
  const hydratedKey = useRef(""); // slug yg progresnya sudah dihidrasi (cegah save silang bab)
  const stepIdx = Math.min(step, Math.max(0, steps.length - 1));
  const stepId: StepId | undefined = isUnit ? steps[stepIdx]?.id : undefined;
  const isLastStep = stepIdx === steps.length - 1;

  // Tanya AI panel + roleplay modal
  const [askCtx, setAskCtx] = useState<AskContext | null>(null);
  const [rpOpen, setRpOpen] = useState(false);

  const [activeLine, setActiveLine] = useState(-1);
  const [playingAll, setPlayingAll] = useState(false);
  const playingAllRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const askSentenceRef = useRef(""); // kalimat konteks kata terakhir dibuka (utk Tanya AI)
  const storeKey = `lingbook-scroll:${book.slug}:${chapter.slug}`;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MD);
    onResize();
    window.addEventListener("resize", onResize);
    // restore posisi baca
    const el = scrollRef.current;
    const pos = parseInt(localStorage.getItem(storeKey) || "0", 10);
    if (el && pos > 0) setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = pos; }, 120);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelSpeech();
      if (toastT.current) clearTimeout(toastT.current);
      if (scrollT.current) clearTimeout(scrollT.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const openCard = useCallback(
    (key: string, el: HTMLElement | null, sentence = "") => {
      const word = glossary[key];
      if (!word) return;
      askSentenceRef.current = sentence;
      setClicked((prev) => {
        if (prev.has(key)) return prev;
        const nx = new Set(prev);
        nx.add(key);
        return nx;
      });
      let pos: CardPos = null;
      if (window.innerWidth >= MD && el) {
        const r = el.getBoundingClientRect();
        const W = 340;
        const H = 430;
        const left = Math.max(12, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - 12));
        const above = r.bottom + H > window.innerHeight - 16 && r.top > H;
        pos = { left, top: above ? r.top - 8 : r.bottom + 8, above };
      }
      setSel({ key, word });
      setCardPos(pos);
      setSettingsOpen(false);
    },
    [glossary],
  );

  const closeCard = () => setSel(null);

  const lineText = useCallback(
    (tokens: Token[]) => tokensToText(tokens, glossary, book.language.script),
    [glossary, book.language.script],
  );

  const playLine = useCallback(
    (bi: number, li: number, tokens: Token[]) => {
      playingAllRef.current = false;
      setPlayingAll(false);
      setActiveLine(bi * 100 + li);
      const u = speak(lineText(tokens), book.language.speechLang);
      u.onended = () => setActiveLine(-1);
    },
    [lineText, book.language.speechLang],
  );

  const playAll = useCallback(
    (bi: number, lines: DialogLine[]) => {
      if (playingAllRef.current) {
        cancelSpeech();
        playingAllRef.current = false;
        setPlayingAll(false);
        setActiveLine(-1);
        return;
      }
      playingAllRef.current = true;
      setPlayingAll(true);
      const step = (i: number) => {
        if (i >= lines.length || !playingAllRef.current) {
          playingAllRef.current = false;
          setPlayingAll(false);
          setActiveLine(-1);
          return;
        }
        setActiveLine(bi * 100 + i);
        const u = speak(lineText(lines[i].tokens), book.language.speechLang);
        u.onended = () => step(i + 1);
      };
      step(0);
    },
    [lineText, book.language.speechLang],
  );

  const saveWord = () => {
    if (!sel || saved.has(sel.key)) return;
    setSaved((prev) => {
      const nx = new Set(prev);
      nx.add(sel.key);
      return nx;
    });
    showToast("✓ Tersimpan ke Kosakata");
  };

  const markStepDone = useCallback((id: StepId | undefined) => {
    if (!id) return;
    setStepDone((prev) => {
      if (prev.has(id)) return prev;
      const nx = new Set(prev);
      nx.add(id);
      return nx;
    });
  }, []);

  // ── [lingbook-progress] Persist progres: localStorage (selalu) + DB (graceful) ──
  // Hidrasi saat bab dibuka: pakai localStorage instan, lalu merge dgn DB bila login
  // & tabel ada. `hydratedKey` menjaga save tak nyasar ke bab lain saat navigasi.
  useEffect(() => {
    const key = `${book.slug}:${chapter.slug}`;
    hydratedKey.current = "";
    const local = loadLocalProgress(book.slug, chapter.slug);
    setStepDone(new Set(local.stepsDone));
    setIsDone(local.isDone);
    setScore(local.score);
    hydratedKey.current = key;
    let alive = true;
    loadRemoteProgress(book.slug, chapter.slug).then((remote) => {
      if (!alive || !remote || hydratedKey.current !== key) return;
      const merged = mergeProgress(local, remote);
      setStepDone(new Set(merged.stepsDone));
      setIsDone(merged.isDone);
      setScore(merged.score);
      saveLocalProgress(book.slug, chapter.slug, merged);
      void saveRemoteProgress(book.slug, chapter.slug, merged);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.slug, chapter.slug]);

  // Simpan tiap perubahan progres → localStorage langsung + DB (debounce ringan).
  useEffect(() => {
    const key = `${book.slug}:${chapter.slug}`;
    if (hydratedKey.current !== key) return; // belum terhidrasi utk bab ini
    const p = { stepsDone: [...stepDone], isDone, score };
    saveLocalProgress(book.slug, chapter.slug, p);
    const t = setTimeout(() => void saveRemoteProgress(book.slug, chapter.slug, p), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepDone, isDone, score]);

  const goStep = useCallback((i: number) => {
    setStep(i);
    setActiveLine(-1);
    setPlayingAll(false);
    playingAllRef.current = false;
    cancelSpeech();
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const saveAllVocab = () => {
    const refs = chapter.vocabRefs ?? [];
    setSaved((prev) => {
      const nx = new Set(prev);
      refs.forEach((k) => nx.add(k));
      return nx;
    });
    showToast(`✓ ${refs.length} kata tersimpan ke Kosakata`);
  };

  // Buka panel Tanya AI dari word card (context: kata + kalimat + grammar).
  const openAsk = useCallback(() => {
    if (!sel) return;
    const w = sel.word;
    const grammar = w.grammar ? Object.entries(w.grammar).map(([k, v]) => `${k}: ${v}`).join("; ") : "";
    setAskCtx({
      word: w.surface,
      meaning: w.meaning,
      pos: w.pos,
      sentence: askSentenceRef.current,
      grammar,
      langName: book.language.name,
    });
    setSel(null);
  }, [sel, book.language.name]);

  const completeChapter = () => {
    markStepDone(stepId);
    if (!isDone) {
      setCompleted(true);
      setIsDone(true);
    } else {
      showToast("Unit ini sudah ditandai selesai");
    }
  };

  const goLibrary = () => router.push("/akun/lingbook");
  const goChapter = (slug: string) => {
    setTocOpen(false);
    router.push(`/akun/lingbook/${book.slug}/${slug}`);
  };

  // font metrics
  const sizes = isCjk ? [19, 22, 26] : [17.5, 20, 23];
  const fpx = sizes[fs];
  const lh = isCjk ? (furigana || romaji ? 2.25 : 1.95) : 1.8;
  const readerStyle: React.CSSProperties = { fontFamily: readFont, fontSize: fpx, lineHeight: lh, color: "var(--lb-ink)", margin: 0 };

  const tokenTextProps = {
    glossary,
    isCjk,
    isLatin,
    furigana,
    romaji,
    mark,
    clicked,
    selKey: sel?.key ?? null,
    onWord: openCard,
    dark,
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const p = Math.min(100, Math.max(2, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100));
    setProg(p);
    if (scrollT.current) clearTimeout(scrollT.current);
    scrollT.current = setTimeout(() => {
      try { localStorage.setItem(storeKey, String(el.scrollTop)); } catch { /* no-op */ }
    }, 300);
  };

  const doneIdx = book.toc.findIndex((c) => c.slug === chapter.slug);
  const prevSummary = doneIdx > 0 ? book.toc[doneIdx - 1] : null;
  const nextSummary = doneIdx >= 0 && doneIdx < book.toc.length - 1 ? book.toc[doneIdx + 1] : null;

  const vocabRefs = chapter.vocabRefs ?? [];
  const unitCtx: UnitCtx = {
    stepDone,
    saved,
    allSavedRefs: vocabRefs.length > 0 && vocabRefs.every((k) => saved.has(k)),
    onOpenWord: (key: string) => openCard(key, null),
    onSaveAll: saveAllVocab,
    onSpeak: (surface: string) => { speak(surface, book.language.speechLang); },
    isCjk,
  };

  // Tombol penutup unit/bab (dipakai di step terakhir & mode baca lama).
  const finishButtons = (
    <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 14 }}>
      <button
        onClick={completeChapter}
        style={{
          width: "100%", padding: 15, borderRadius: 13,
          border: isDone ? `1.5px solid ${TEAL}` : "none",
          background: isDone ? "var(--lb-active)" : TEAL, color: isDone ? "var(--lb-teal-ink)" : "#FFFFFF",
          fontFamily: "inherit", fontSize: 15.5, fontWeight: 800, cursor: "pointer",
          boxShadow: isDone ? "none" : "0 6px 16px rgba(26,158,158,.3)",
        }}
      >
        {isDone ? `✓ ${isUnit ? "Unit" : "Bab"} Selesai` : `Tandai ${isUnit ? "Unit" : "Bab"} Selesai ✓`}
      </button>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => (prevSummary ? goChapter(prevSummary.slug) : showToast(`Ini ${isUnit ? "unit" : "bab"} pertama`))} style={{ ...navBtn, textAlign: "left" }}>
          ← {prevSummary ? `${isUnit ? "Unit" : "Bab"} ${doneIdx}: ${prevSummary.title}` : `${isUnit ? "Unit" : "Bab"} pertama`}
        </button>
        <button onClick={() => (nextSummary ? goChapter(nextSummary.slug) : showToast(`Ini ${isUnit ? "unit" : "bab"} terakhir`))} style={{ ...navBtn, textAlign: "right" }}>
          {nextSummary ? `${isUnit ? "Unit" : "Bab"} ${doneIdx + 2}: ${nextSummary.title}` : `${isUnit ? "Unit" : "Bab"} terakhir`} →
        </button>
      </div>
    </div>
  );

  const blockViewCommon = {
    book, glossary, readFont, isCjk, fpx, readerStyle, trans,
    activeLine, playingAll, onPlayLine: playLine, onPlayAll: playAll, tokenTextProps,
  };

  return (
    <div className="lb-root" data-lb-theme={dark ? "dark" : "light"} style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--lb-bg)", fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", color: "var(--lb-ink)" }}>
      {/* Font baca + hover kata — dimuat khusus reader */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" />
      <style>{`
        .lb-root{
          --lb-bg:#f6faf9; --lb-surface:#ffffff; --lb-surface-2:#fbfdfd;
          --lb-soft:#e4f2f1; --lb-active:#dff1ef; --lb-trans:#eaf5f4;
          --lb-line:#e3eeec; --lb-ink:#11313a; --lb-ink-2:#33565c;
          --lb-ink-3:#5a7a78; --lb-ink-4:#8aa3a0; --lb-teal-ink:#0b7570;
          --lb-scrim:rgba(17,49,58,.45);
          --lb-ai:#8a73d0; --lb-ai-ink:#6b54c8; --lb-ai-bubble:#f2f0fa;
          --lb-ai-soft:#fbfafe; --lb-ai-line:#e0d9f2; --lb-ai-suggest-hover:#f4f1fb;
          --lb-ok-bg:#e4f3df; --lb-ok-ink:#3e7d2e; --lb-ok-line:#9ccb8e;
          --lb-warn-bg:#fbf0db; --lb-warn-ink:#9a6b14; --lb-warn-line:#e0c489;
          --lb-err-bg:#fce8e4; --lb-err-ink:#b04a32; --lb-err-line:#e8b4a5;
        }
        .lb-root[data-lb-theme="dark"]{
          --lb-bg:#0e1619; --lb-surface:#16242b; --lb-surface-2:#1b2d34;
          --lb-soft:#123339; --lb-active:#143b38; --lb-trans:#152e31;
          --lb-line:#283b42; --lb-ink:#e7eff0; --lb-ink-2:#bacdcd;
          --lb-ink-3:#93aeae; --lb-ink-4:#728e8e; --lb-teal-ink:#63d6d0;
          --lb-scrim:rgba(2,10,12,.62);
          --lb-ai:#a996e0; --lb-ai-ink:#b9a9ec; --lb-ai-bubble:#221d33;
          --lb-ai-soft:#1c1830; --lb-ai-line:#33294f; --lb-ai-suggest-hover:#241f38;
          --lb-ok-bg:#173021; --lb-ok-ink:#8fd694; --lb-ok-line:#357a45;
          --lb-warn-bg:#332a12; --lb-warn-ink:#e6c069; --lb-warn-line:#6f5c26;
          --lb-err-bg:#361d1a; --lb-err-ink:#f0a48f; --lb-err-line:#7d4036;
        }
        .lb-root[data-lb-theme="dark"] img{opacity:.92;}
        .lb-word:hover{background:var(--lb-soft) !important;}
        .lb-word-dark:hover{background:rgba(127,212,208,.25) !important;}
        @keyframes lbPopIn{from{opacity:0;transform:translateY(6px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes lbPopInUp{from{opacity:0;transform:translateY(calc(-100% + 6px)) scale(.97);}to{opacity:1;transform:translateY(-100%) scale(1);}}
        @keyframes lbSheetUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
        @keyframes lbFadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes lbToastUp{from{opacity:0;transform:translate(-50%,12px);}to{opacity:1;transform:translate(-50%,0);}}
        @keyframes lbCheckPop{0%{transform:scale(.4);opacity:0;}70%{transform:scale(1.12);}100%{transform:scale(1);opacity:1;}}
        @keyframes lbEq1{0%,100%{height:5px;}50%{height:13px;}}
        @keyframes lbEq2{0%,100%{height:11px;}50%{height:4px;}}
        @keyframes lbEq3{0%,100%{height:7px;}50%{height:12px;}}
        @keyframes lbPulseRing{0%{box-shadow:0 0 0 0 rgba(26,158,158,.4);}100%{box-shadow:0 0 0 10px rgba(26,158,158,0);}}
        @keyframes lbShake{0%,100%{transform:translateX(0);}25%{transform:translateX(-4px);}75%{transform:translateX(4px);}}
        @keyframes lbDotBlink{0%,80%,100%{opacity:.25;}40%{opacity:1;}}
        .lb-ai-suggest:hover{background:var(--lb-ai-suggest-hover) !important;}
        .lb-rp-choice:hover{border-color:#1A9E9E !important;}
        .lb-vocab-card:hover{border-color:#1A9E9E !important;}
      `}</style>

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ flex: "none", background: "var(--lb-surface)", borderBottom: "1px solid var(--lb-line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
            <button onClick={goLibrary} title="Kembali ke Library" style={hdrBtn}>←</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: TEAL, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {book.language.nativeName ? `${book.language.nativeName} — ${book.title} · ${book.level}` : `${book.title} · ${book.level}`}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--lb-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chapter.label}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--lb-ink-3)", whiteSpace: "nowrap" }}>
              {isUnit ? "Unit" : "Bab"} {doneIdx >= 0 ? doneIdx + 1 : 1} dari {book.chapterCount}
            </div>
            <button onClick={toggleDark} title={dark ? "Mode terang" : "Mode gelap"} aria-label={dark ? "Mode terang" : "Mode gelap"} style={hdrBtn}>
              {dark ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M20 14.2A8 8 0 019.8 4 7 7 0 1020 14.2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
              )}
            </button>
            <button onClick={() => setTocOpen(true)} title="Daftar Isi" style={hdrBtn}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3.5h12M2 8h12M2 12.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>

          {/* Step navigator — responsif (scroll horizontal di mobile) */}
          {isUnit && (
            <div style={{ display: "flex", gap: 6, padding: "0 14px 10px 14px", overflowX: "auto" }}>
              {steps.map((st, i) => {
                const done = stepDone.has(st.id);
                const active = i === stepIdx;
                return (
                  <button
                    key={st.id}
                    onClick={() => goStep(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "6px 12px 6px 7px", borderRadius: 999, whiteSpace: "nowrap",
                      border: active ? `1.5px solid ${TEAL}` : "1.5px solid var(--lb-line)", cursor: "pointer", fontFamily: "inherit",
                      background: active ? "var(--lb-active)" : "var(--lb-surface)", color: active ? "var(--lb-teal-ink)" : done ? "var(--lb-teal-ink)" : "var(--lb-ink-4)",
                      fontSize: 12.5, fontWeight: 800, flex: "none",
                    }}
                  >
                    <span style={{ width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 800, background: done || active ? TEAL : "var(--lb-soft)", color: done || active ? "#FFFFFF" : "var(--lb-ink-4)" }}>
                      {done ? "✓" : String(i + 1)}
                    </span>
                    {st.label}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ height: 3, background: "var(--lb-line)" }}>
            <div style={{ height: "100%", width: isUnit ? `${Math.max(4, ((stepIdx + 1) / steps.length) * 100)}%` : `${prog}%`, background: TEAL, borderRadius: "0 2px 2px 0", transition: isUnit ? "width .3s" : "width .15s" }} />
          </div>
        </header>

        <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
          <article style={{ maxWidth: 700, margin: "0 auto", padding: "28px 20px 90px 20px", boxSizing: "border-box" }}>
            {/* Hero — selalu (mode baca lama) atau hanya di step Tujuan (mode unit) */}
            {(!isUnit || stepId === "tujuan") && (
              <div style={{ marginBottom: isUnit ? 26 : 30 }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: TEAL, marginBottom: 8 }}>
                  {isUnit ? "Unit" : "Bab"} {doneIdx >= 0 ? doneIdx + 1 : 1} dari {book.chapterCount}
                </div>
                <h1 style={{ fontFamily: readFont, fontSize: isCjk ? 40 : 34, fontWeight: 700, color: "var(--lb-ink)", margin: 0, lineHeight: 1.2 }}>{chapter.title}</h1>
                {chapter.subtitle && <div style={{ fontSize: 16, color: "var(--lb-ink-3)", fontWeight: 600, marginTop: 4 }}>{chapter.subtitle}</div>}
                {chapter.meta && <div style={{ fontSize: 13, color: "var(--lb-ink-4)", marginTop: 10 }}>{chapter.meta}</div>}
              </div>
            )}

            {!isUnit && (
              <>
                {chapter.blocks.map((block, bi) => (
                  <BlockView key={bi} block={block} bi={bi} {...blockViewCommon} />
                ))}
                {finishButtons}
              </>
            )}

            {isUnit && (
              <>
                {stepId === "tujuan" && (
                  <BlockView block={{ type: "objectives", items: chapter.objectives ?? [] } satisfies ObjectivesBlock} bi={0} {...blockViewCommon} unitCtx={unitCtx} />
                )}
                {stepId === "dialog" && chapter.blocks.map((block, bi) => (
                  <BlockView key={bi} block={block} bi={bi} {...blockViewCommon} />
                ))}
                {stepId === "vocab" && (
                  <BlockView block={{ type: "vocab_list", refs: vocabRefs } satisfies VocabListBlock} bi={0} {...blockViewCommon} unitCtx={unitCtx} />
                )}
                {stepId === "grammar" && (
                  <>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--lb-ink)", margin: "0 0 4px 0" }}>Language Points</h2>
                    <div style={{ fontSize: 13, color: "var(--lb-ink-4)", marginBottom: 20 }}>{(chapter.grammarPoints ?? []).length} poin grammar di unit ini</div>
                    {(chapter.grammarPoints ?? []).map((gp, gi) => (
                      <BlockView key={gi} block={gp} bi={gi} {...blockViewCommon} />
                    ))}
                  </>
                )}
                {stepId === "latihan" && (
                  <LatihanSection exercises={chapter.exercises ?? []} isCjk={isCjk} readFont={readFont} />
                )}
                {stepId === "test" && (
                  <TestSection
                    test={chapter.test ?? []}
                    isCjk={isCjk}
                    readFont={readFont}
                    onSkip={() => { markStepDone("test"); showToast("Test dilewati — ditandai di progres"); }}
                    onScore={(pct) => { setScore(pct); markStepDone("test"); }}
                    onOpenRoleplay={() => setRpOpen(true)}
                  />
                )}

                {!isLastStep ? (
                  <button
                    onClick={() => { markStepDone(stepId); goStep(stepIdx + 1); }}
                    style={{ marginTop: 36, width: "100%", padding: 15, borderRadius: 13, border: "none", background: TEAL, color: "#FFFFFF", fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 16px rgba(26,158,158,.3)" }}
                  >
                    {stepId === "tujuan" ? "Mulai unit →" : `Selesai, lanjut: ${steps[stepIdx + 1].label} →`}
                  </button>
                ) : (
                  finishButtons
                )}
              </>
            )}
          </article>
        </div>
      </main>

      {/* Floating Aa */}
      <button
        onClick={() => { setSettingsOpen((v) => !v); closeCard(); }}
        title="Pengaturan baca"
        style={{ position: "fixed", right: 20, bottom: 24, width: 54, height: 54, borderRadius: "50%", border: "none", background: TEAL, color: "#FFFFFF", fontFamily: "inherit", fontSize: 18, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 18px rgba(17,49,58,.25)", zIndex: 40 }}
      >
        Aa
      </button>

      {settingsOpen && (
        <SettingsSheet
          isMobile={isMobile}
          isCjk={isCjk}
          furigana={furigana}
          romaji={romaji}
          trans={trans}
          mark={mark}
          fs={fs}
          dark={dark}
          onToggleDark={toggleDark}
          onClose={() => setSettingsOpen(false)}
          setFurigana={(v) => { setFurigana(v); if (v) setRomaji(false); }}
          setRomaji={(v) => { setRomaji(v); if (v) setFurigana(false); }}
          setTrans={setTrans}
          setMark={setMark}
          setFs={setFs}
        />
      )}

      {sel && (
        <WordCard
          selection={sel}
          isMobile={isMobile}
          cardPos={cardPos}
          isCjk={isCjk}
          readFont={readFont}
          saved={saved.has(sel.key)}
          speaking={cardSpeaking}
          onClose={closeCard}
          onSave={saveWord}
          onAsk={openAsk}
          onPlay={() => {
            setCardSpeaking(true);
            const u = speak(sel.word.surface, book.language.speechLang);
            u.onended = () => setCardSpeaking(false);
          }}
        />
      )}

      {askCtx && (
        <AskAiPanel ctx={askCtx} isMobile={isMobile} onClose={() => setAskCtx(null)} />
      )}

      {rpOpen && (chapter.roleplay?.length ?? 0) > 0 && (
        <RoleplayModal
          turns={chapter.roleplay ?? []}
          isMobile={isMobile}
          readFont={readFont}
          title={`Roleplay: ${chapter.subtitle ?? chapter.title}`}
          avatar={isCjk ? "店" : (chapter.roleplay?.[0]?.ai?.charAt(0) ?? "AI")}
          onClose={() => setRpOpen(false)}
        />
      )}

      {tocOpen && (
        <TocDrawer
          book={book}
          isMobile={isMobile}
          currentSlug={chapter.slug}
          markedDone={isDone}
          onClose={() => setTocOpen(false)}
          onPick={goChapter}
        />
      )}

      {completed && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(17,49,58,.55)", zIndex: 70, display: "grid", placeItems: "center", animation: "lbFadeIn .25s", padding: 20, boxSizing: "border-box" }}>
          <div style={{ background: "var(--lb-surface)", borderRadius: 22, padding: "34px 30px", maxWidth: 380, width: "100%", textAlign: "center", boxShadow: "0 24px 60px rgba(17,49,58,.3)" }}>
            <div style={{ width: 74, height: 74, borderRadius: "50%", background: TEAL, color: "#FFFFFF", display: "grid", placeItems: "center", margin: "0 auto 18px auto", animation: "lbCheckPop .45s ease" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: 21, color: "var(--lb-ink)" }}>{isUnit ? "Unit" : "Bab"} selesai!</div>
            <div style={{ fontSize: 14, color: "var(--lb-ink-3)", marginTop: 4 }}>{chapter.label}</div>
            <div style={{ display: "flex", gap: 10, margin: "22px 0" }}>
              <div style={statCard}><div style={statNum}>{clicked.size}</div><div style={statLabel}>kata di-tap</div></div>
              <div style={statCard}><div style={statNum}>{saved.size}</div><div style={statLabel}>kata disimpan</div></div>
              {score != null && <div style={statCard}><div style={statNum}>{score}%</div><div style={statLabel}>skor test</div></div>}
            </div>
            <button
              onClick={() => { setCompleted(false); if (nextSummary) goChapter(nextSummary.slug); }}
              style={{ width: "100%", padding: 14, borderRadius: 13, border: "none", background: TEAL, color: "#FFFFFF", fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
            >
              {nextSummary ? `Bab ${doneIdx + 2}: ${nextSummary.title}` : "Kembali ke Library"} →
            </button>
            <button onClick={() => setCompleted(false)} style={{ width: "100%", padding: 12, borderRadius: 13, border: "none", background: "none", color: "var(--lb-ink-3)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>Kembali membaca</button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 94, left: "50%", transform: "translateX(-50%)", background: DARK, color: "#FFFFFF", padding: "11px 18px", borderRadius: 12, fontSize: 13.5, fontWeight: 700, zIndex: 80, boxShadow: "0 8px 22px rgba(17,49,58,.35)", animation: "lbToastUp .25s ease", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Sub-komponen ─────────────────────────────────────────────────────────

const hdrBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 10, border: "1px solid var(--lb-line)", background: "var(--lb-surface)", color: "var(--lb-ink-2)", fontSize: 16, cursor: "pointer", display: "grid", placeItems: "center" };
const navBtn: React.CSSProperties = { flex: 1, padding: "13px 14px", borderRadius: 12, border: "1px solid var(--lb-line)", background: "var(--lb-surface)", color: "var(--lb-ink-2)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" };
const statCard: React.CSSProperties = { flex: 1, background: "var(--lb-surface-2)", borderRadius: 14, padding: "14px 8px" };
const statNum: React.CSSProperties = { fontWeight: 800, fontSize: 24, color: TEAL };
const statLabel: React.CSSProperties = { fontSize: 12, color: "var(--lb-ink-3)", fontWeight: 600 };

function BlockView({
  block,
  bi,
  book,
  glossary,
  readFont,
  isCjk,
  fpx,
  readerStyle,
  trans,
  activeLine,
  playingAll,
  onPlayLine,
  onPlayAll,
  tokenTextProps,
  unitCtx,
}: {
  block: ContentBlock;
  bi: number;
  book: Book;
  glossary: Record<string, Word>;
  readFont: string;
  isCjk: boolean;
  fpx: number;
  readerStyle: React.CSSProperties;
  trans: boolean;
  activeLine: number;
  playingAll: boolean;
  onPlayLine: (bi: number, li: number, tokens: Token[]) => void;
  onPlayAll: (bi: number, lines: DialogLine[]) => void;
  tokenTextProps: Omit<React.ComponentProps<typeof TokenText>, "tokens" | "style">;
  unitCtx?: UnitCtx;
}) {
  if (block.type === "heading") {
    return (
      <div style={{ margin: "38px 0 16px 0", display: "flex", alignItems: "baseline", gap: 12, borderBottom: "2px solid var(--lb-line)", paddingBottom: 10 }}>
        <h2 style={{ fontFamily: readFont, fontSize: isCjk ? 24 : 22, fontWeight: 700, color: "var(--lb-ink)", margin: 0 }}>{block.text}</h2>
        {block.sub && <span style={{ fontSize: 13, color: "var(--lb-ink-4)", fontWeight: 600 }}>{block.sub}</span>}
      </div>
    );
  }

  if (block.type === "paragraph") {
    return (
      <div style={{ margin: "0 0 20px 0" }}>
        <p style={readerStyle}>
          <TokenText {...tokenTextProps} tokens={block.tokens} />
        </p>
        {trans && block.translation && (
          <div style={{ marginTop: 6, padding: "10px 14px", background: "var(--lb-trans)", borderRadius: 10, fontSize: 14, color: "var(--lb-ink-2)", lineHeight: 1.55 }}>{block.translation}</div>
        )}
      </div>
    );
  }

  if (block.type === "callout") {
    const variants: Record<string, [string, string, string, string]> = {
      info: ["var(--lb-soft)", TEAL, "i", "var(--lb-teal-ink)"],
      warning: ["#FBF0DB", "#D9A13B", "!", "#9A6B14"],
      tips: ["#EDE9F8", "#8A73D0", "✦", "#6B54C8"],
    };
    const v = variants[block.variant];
    return (
      <div style={{ margin: "0 0 24px 0", background: v[0], border: `1px solid ${v[1]}44`, borderRadius: 14, padding: "14px 16px", color: v[3] }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: v[1], color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flex: "none" }}>{v[2]}</span>
          <span style={{ fontWeight: 800, fontSize: 14 }}>{block.title}</span>
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--lb-ink-2)" }}>{block.body}</div>
        {block.example && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(255,255,255,.7)", borderRadius: 8, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <TokenText {...tokenTextProps} tokens={block.example.tokens} style={{ fontFamily: readFont, fontSize: Math.round(fpx * 0.9), lineHeight: 2 }} />
            {block.example.translation && <span style={{ fontSize: 13, color: "var(--lb-ink-3)" }}>{block.example.translation}</span>}
          </div>
        )}
      </div>
    );
  }

  if (block.type === "dialog") {
    return (
      <div style={{ margin: "0 0 24px 0", background: "var(--lb-surface)", border: "1px solid var(--lb-line)", borderRadius: 16, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button
            onClick={() => onPlayAll(bi, block.lines)}
            style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: playingAll ? DARK : "var(--lb-soft)", color: playingAll ? "#FFFFFF" : "var(--lb-teal-ink)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
          >
            {playingAll ? "■ Berhenti" : "▶ Putar semua"}
          </button>
        </div>
        {block.lines.map((ln, li) => {
          const active = activeLine === bi * 100 + li;
          return (
            <div key={li} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: ln.color || DARK, color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 15, flex: "none", fontFamily: readFont }}>{ln.speaker.charAt(0)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--lb-ink-2)" }}>{ln.speaker}</span>
                  {ln.role && <span style={{ fontSize: 11.5, color: "var(--lb-ink-4)" }}>{ln.role}</span>}
                  <button onClick={() => onPlayLine(bi, li, ln.tokens)} title="Putar audio baris" style={{ width: 22, height: 22, borderRadius: "50%", border: "none", background: active ? TEAL : "var(--lb-soft)", color: active ? "#FFFFFF" : "var(--lb-teal-ink)", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 1.2v7.6L8.4 5 2 1.2z" fill="currentColor" /></svg>
                  </button>
                  {active && (
                    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 13 }}>
                      <span style={{ width: 3, background: TEAL, borderRadius: 2, animation: "lbEq1 .7s infinite" }} />
                      <span style={{ width: 3, background: TEAL, borderRadius: 2, animation: "lbEq2 .7s infinite .1s" }} />
                      <span style={{ width: 3, background: TEAL, borderRadius: 2, animation: "lbEq3 .7s infinite .2s" }} />
                    </span>
                  )}
                </div>
                <div style={{ background: active ? "var(--lb-trans)" : "var(--lb-surface-2)", border: active ? `1.5px solid ${TEAL}` : "1.5px solid var(--lb-line)", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", transition: "all .2s" }}>
                  <TokenText {...tokenTextProps} tokens={ln.tokens} style={{ ...readerStyle, fontSize: Math.round((readerStyle.fontSize as number) * 0.92) }} />
                  {trans && ln.translation && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--lb-line)", fontSize: 13.5, color: "var(--lb-ink-3)" }}>{ln.translation}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <figure style={{ margin: "0 0 24px 0" }}>
        <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", borderRadius: 14, overflow: "hidden", background: "linear-gradient(135deg,var(--lb-line),var(--lb-line))" }}>
          {block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.src} alt={block.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--lb-ink-4)", fontSize: 13, fontWeight: 700 }}>{block.alt || "Gambar"}</div>
          )}
        </div>
        {(block.captionTokens || block.captionTranslation) && (
          <figcaption style={{ marginTop: 10, textAlign: "center" }}>
            {block.captionTokens && <TokenText {...tokenTextProps} tokens={block.captionTokens} style={{ fontFamily: readFont, fontSize: Math.round(fpx * 0.82), lineHeight: 1.9, color: "var(--lb-ink-2)" }} />}
            {block.captionTranslation && <div style={{ fontSize: 12.5, color: "var(--lb-ink-4)", marginTop: 2 }}>{block.captionTranslation}</div>}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "table") {
    return (
      <div style={{ margin: "0 0 24px 0", background: "var(--lb-surface)", border: "1px solid var(--lb-line)", borderRadius: 14, overflow: "hidden" }}>
        {block.title && <div style={{ padding: "12px 16px", fontWeight: 800, fontSize: 14, color: "var(--lb-ink)", borderBottom: "1px solid var(--lb-line)", background: "var(--lb-surface-2)" }}>{block.title}</div>}
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {block.columns.map((c, ci) => (
                  <th key={ci} style={{ textAlign: "left", padding: "9px 16px", fontSize: 11.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--lb-ink-3)", borderBottom: "1px solid var(--lb-line)" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell: TableCell, ci) => (
                    <td key={ci} style={{ padding: "10px 16px", borderBottom: "1px solid var(--lb-line)", verticalAlign: "middle" }}>
                      {"tokens" in cell ? (
                        <TokenText {...tokenTextProps} tokens={cell.tokens} style={{ fontFamily: readFont, fontSize: isCjk ? 20 : 17, lineHeight: 1.9 }} />
                      ) : (
                        <span style={{ fontSize: 13.5, color: "var(--lb-ink-2)" }}>{cell.text}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (block.type === "audio") {
    return <AudioPlayerBlock block={block} glossary={glossary} book={book} tokenTextProps={tokenTextProps} />;
  }

  if (block.type === "culture_note") {
    return (
      <div style={{ margin: "0 0 24px 0", background: "var(--lb-ai-bubble)", border: "1px solid var(--lb-ai-line)", borderRadius: 14, padding: "14px 16px", color: "var(--lb-ai-ink)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#8A73D0", color: "#FFFFFF", display: "grid", placeItems: "center", fontSize: 12, flex: "none" }}>🌏</span>
          <span style={{ fontWeight: 800, fontSize: 14 }}>{block.title}</span>
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--lb-ink-2)" }}>{block.body}</div>
      </div>
    );
  }

  if (block.type === "grammar_point") {
    return <GrammarPointView block={block} n={bi + 1} isCjk={isCjk} readFont={readFont} fpx={fpx} tokenTextProps={tokenTextProps} />;
  }

  if (block.type === "objectives" && unitCtx) {
    const total = block.items.length;
    const doneN = block.items.filter((o) => unitCtx.stepDone.has(o.section)).length;
    return (
      <div style={{ background: "var(--lb-surface)", border: "1px solid var(--lb-line)", borderRadius: 16, padding: "20px 22px", marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--lb-ink)", marginBottom: 4 }}>Di unit ini kamu akan belajar</div>
        <div style={{ fontSize: 12.5, color: "var(--lb-ink-4)", marginBottom: 14 }}>{doneN} dari {total} objektif tercapai</div>
        {block.items.map((o, oi) => {
          const checked = unitCtx.stepDone.has(o.section);
          return (
            <div key={oi} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--lb-line)" }}>
              <span style={{ width: 22, height: 22, borderRadius: 7, flex: "none", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, background: checked ? TEAL : "var(--lb-surface)", color: "#FFFFFF", border: checked ? "none" : "2px solid var(--lb-line)" }}>{checked ? "✓" : ""}</span>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: checked ? "var(--lb-ink-4)" : "var(--lb-ink)", textDecoration: checked ? "line-through" : "none" }}>{o.text}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (block.type === "vocab_list" && unitCtx) {
    const words = block.refs.map((k) => ({ key: k, word: glossary[k] })).filter((x): x is { key: string; word: Word } => !!x.word);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--lb-ink)", margin: 0 }}>Kosakata Kunci</h2>
            <div style={{ fontSize: 13, color: "var(--lb-ink-4)", marginTop: 2 }}>{words.length} kata penting di unit ini — tap untuk detail</div>
          </div>
          <button onClick={unitCtx.onSaveAll} style={{ padding: "10px 16px", borderRadius: 11, border: unitCtx.allSavedRefs ? `1.5px solid ${TEAL}` : "none", background: unitCtx.allSavedRefs ? "var(--lb-active)" : TEAL, color: unitCtx.allSavedRefs ? "var(--lb-teal-ink)" : "#FFFFFF", fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer", flex: "none" }}>
            {unitCtx.allSavedRefs ? "✓ Semua tersimpan" : "+ Simpan semua"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
          {words.map(({ key, word }) => {
            const sub = isCjk ? [word.reading, word.romaji].filter(Boolean).join(" · ") : word.grammar ? Object.values(word.grammar)[0] : "";
            const isSaved = unitCtx.saved.has(key);
            return (
              <div key={key} onClick={() => unitCtx.onOpenWord(key)} className="lb-vocab-card" style={{ background: "var(--lb-surface)", border: "1px solid var(--lb-line)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: readFont, fontSize: isCjk ? 22 : 19, fontWeight: 700, color: "var(--lb-ink)" }}>{word.surface}</div>
                  {sub && <div style={{ fontSize: 12, color: "var(--lb-teal-ink)", fontWeight: 700 }}>{sub}</div>}
                  <div style={{ fontSize: 13.5, color: "var(--lb-ink-2)", marginTop: 2 }}>{word.meaning}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); unitCtx.onSpeak(word.surface); }} title="Dengar" style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "var(--lb-soft)", color: "var(--lb-teal-ink)", cursor: "pointer", display: "grid", placeItems: "center", flex: "none" }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 7.5v5h3.2L11 17V3L6.2 7.5H3z" fill="currentColor" /><path d="M13.5 6.5c1 .9 1.6 2.1 1.6 3.5s-.6 2.6-1.6 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </button>
                <span style={{ width: 22, flex: "none", textAlign: "center", fontSize: 15, fontWeight: 800, color: TEAL }}>{isSaved ? "✓" : ""}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

// Kartu poin grammar (step "Grammar") — contoh tetap tap-to-learn.
function GrammarPointView({
  block,
  n,
  isCjk,
  readFont,
  fpx,
  tokenTextProps,
}: {
  block: GrammarPointBlock;
  n: number;
  isCjk: boolean;
  readFont: string;
  fpx: number;
  tokenTextProps: Omit<React.ComponentProps<typeof TokenText>, "tokens" | "style">;
}) {
  return (
    <div style={{ background: "var(--lb-surface)", border: "1px solid var(--lb-line)", borderRadius: 16, padding: "20px 22px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--lb-active)", color: "var(--lb-teal-ink)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, flex: "none" }}>{n}</span>
        <span style={{ fontSize: 16.5, fontWeight: 800, color: "var(--lb-ink)", fontFamily: isCjk ? readFont : "inherit" }}>{block.title}</span>
      </div>
      <div style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--lb-ink-2)" }}>{block.body}</div>
      {block.pattern && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--lb-surface-2)", borderLeft: `3px solid ${TEAL}`, borderRadius: "0 10px 10px 0", fontSize: 14.5, fontWeight: 700, color: "var(--lb-teal-ink)" }}>{block.pattern}</div>
      )}
      {block.example && (
        <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--lb-surface-2)", border: "1px solid var(--lb-line)", borderRadius: 10 }}>
          <TokenText {...tokenTextProps} tokens={block.example.tokens} style={{ fontFamily: readFont, fontSize: Math.round(fpx * 0.9), lineHeight: 2 }} />
          {block.example.translation && <div style={{ fontSize: 12.5, color: "var(--lb-ink-4)", marginTop: 4 }}>{block.example.translation}</div>}
        </div>
      )}
      {block.table && (
        <div style={{ marginTop: 12, border: "1px solid var(--lb-line)", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {block.table.columns.map((c, ci) => (
                  <th key={ci} style={{ textAlign: "left", padding: "8px 14px", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--lb-ink-3)", borderBottom: "1px solid var(--lb-line)", background: "var(--lb-surface-2)" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.table.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell: TableCell, ci) => (
                    <td key={ci} style={{ padding: "9px 14px", borderBottom: "1px solid var(--lb-line)", verticalAlign: "middle" }}>
                      {"tokens" in cell ? (
                        <TokenText {...tokenTextProps} tokens={cell.tokens} style={{ fontFamily: readFont, fontSize: isCjk ? 20 : 17, lineHeight: 1.9 }} />
                      ) : (
                        <span style={{ fontSize: 13.5, color: "var(--lb-ink-2)" }}>{cell.text}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ width: 44, height: 26, borderRadius: 999, background: on ? TEAL : "var(--lb-line)", padding: 3, boxSizing: "border-box", cursor: "pointer", transition: "background .2s", flex: "none" }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#FFFFFF", transform: on ? "translateX(18px)" : "none", transition: "transform .2s", boxShadow: "0 1px 3px rgba(17,49,58,.25)" }} />
    </div>
  );
}

function SettingsSheet({
  isMobile,
  isCjk,
  furigana,
  romaji,
  trans,
  mark,
  fs,
  dark,
  onToggleDark,
  onClose,
  setFurigana,
  setRomaji,
  setTrans,
  setMark,
  setFs,
}: {
  isMobile: boolean;
  isCjk: boolean;
  furigana: boolean;
  romaji: boolean;
  trans: boolean;
  mark: boolean;
  fs: number;
  dark: boolean;
  onToggleDark: () => void;
  onClose: () => void;
  setFurigana: (v: boolean) => void;
  setRomaji: (v: boolean) => void;
  setTrans: (v: boolean) => void;
  setMark: (v: boolean) => void;
  setFs: (v: number) => void;
}) {
  const rows: { label: string; desc: string; on: boolean; toggle: () => void }[] = [];
  rows.push({ label: "Mode gelap", desc: "Tema gelap nyaman untuk mata", on: dark, toggle: onToggleDark });
  if (isCjk) {
    rows.push({ label: "Furigana", desc: "Cara baca kana di atas kanji", on: furigana, toggle: () => setFurigana(!furigana) });
    rows.push({ label: "Romaji", desc: "Huruf Latin di atas kata", on: romaji, toggle: () => setRomaji(!romaji) });
  }
  rows.push({ label: "Terjemahan kalimat", desc: "Bahasa Indonesia di bawah tiap kalimat", on: trans, toggle: () => setTrans(!trans) });
  rows.push({ label: "Tandai kata di-tap", desc: "Garis putus di kata yang pernah dibuka", on: mark, toggle: () => setMark(!mark) });

  const sheet: React.CSSProperties = isMobile
    ? { position: "fixed", left: 0, right: 0, bottom: 0, background: "var(--lb-surface)", borderRadius: "22px 22px 0 0", padding: "18px 22px 28px 22px", zIndex: 52, boxShadow: "0 -10px 40px rgba(17,49,58,.2)", animation: "lbSheetUp .28s cubic-bezier(.3,1,.4,1)", boxSizing: "border-box" }
    : { position: "fixed", right: 20, bottom: 90, width: 340, background: "var(--lb-surface)", borderRadius: 18, padding: "18px 22px 22px 22px", zIndex: 52, border: "1px solid var(--lb-line)", boxShadow: "0 18px 50px rgba(17,49,58,.2)", animation: "lbPopIn .18s ease", boxSizing: "border-box" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 51, background: isMobile ? "rgba(17,49,58,.4)" : "transparent", animation: isMobile ? "lbFadeIn .2s" : "none" }} />
      <div style={sheet}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--lb-ink)" }}>Pengaturan Baca</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "var(--lb-soft)", color: "var(--lb-ink-2)", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--lb-line)", gap: 14 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--lb-ink)" }}>{r.label}</div>
              <div style={{ fontSize: 12.5, color: "var(--lb-ink-3)", marginTop: 1 }}>{r.desc}</div>
            </div>
            <Toggle on={r.on} onToggle={r.toggle} />
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0 4px 0", gap: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--lb-ink)" }}>Ukuran font</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["Kecil", "Sedang", "Besar"].map((l, i) => (
              <button
                key={l}
                onClick={() => setFs(i)}
                style={{ padding: "7px 12px", borderRadius: 9, border: fs === i ? `1.5px solid ${TEAL}` : "1.5px solid var(--lb-line)", background: fs === i ? "var(--lb-active)" : "var(--lb-surface)", color: fs === i ? "var(--lb-teal-ink)" : "var(--lb-ink-3)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function WordCard({
  selection,
  isMobile,
  cardPos,
  isCjk,
  readFont,
  saved,
  speaking,
  onClose,
  onSave,
  onAsk,
  onPlay,
}: {
  selection: { key: string; word: Word };
  isMobile: boolean;
  cardPos: CardPos;
  isCjk: boolean;
  readFont: string;
  saved: boolean;
  speaking: boolean;
  onClose: () => void;
  onSave: () => void;
  onAsk: () => void;
  onPlay: () => void;
}) {
  const w = selection.word;
  const th = posTheme(w.pos);
  const readingLine = isCjk ? [w.reading, w.romaji].filter(Boolean).join(" · ") : "";
  const grammarRows = w.grammar ? Object.entries(w.grammar) : [];

  const base: React.CSSProperties = { background: "var(--lb-surface)", boxSizing: "border-box", zIndex: 60, boxShadow: "0 18px 50px rgba(17,49,58,.22)" };
  let cardStyle: React.CSSProperties;
  let backStyle: React.CSSProperties;
  if (isMobile || !cardPos) {
    cardStyle = { ...base, position: "fixed", left: 0, right: 0, bottom: 0, borderRadius: "22px 22px 0 0", padding: "14px 22px 26px 22px", maxHeight: "76vh", overflowY: "auto", animation: "lbSheetUp .28s cubic-bezier(.3,1,.4,1)" };
    backStyle = { position: "fixed", inset: 0, background: "rgba(17,49,58,.45)", zIndex: 59, animation: "lbFadeIn .2s" };
  } else {
    cardStyle = { ...base, position: "fixed", left: cardPos.left, top: cardPos.top, width: 340, borderRadius: 18, padding: "20px 22px", maxHeight: "70vh", overflowY: "auto", border: "1px solid var(--lb-line)", transform: cardPos.above ? "translateY(-100%)" : "none", animation: `${cardPos.above ? "lbPopInUp" : "lbPopIn"} .18s ease` };
    backStyle = { position: "fixed", inset: 0, zIndex: 59, background: "transparent" };
  }

  return (
    <>
      <div onClick={onClose} style={backStyle} />
      <div style={cardStyle}>
        {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--lb-line)", margin: "0 auto 12px auto" }} />}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: readFont, fontSize: isCjk ? 38 : 32, fontWeight: 700, color: "var(--lb-ink)", lineHeight: 1.25 }}>{w.surface}</div>
            {readingLine && <div style={{ fontSize: 14.5, color: "var(--lb-teal-ink)", fontWeight: 700, marginTop: 3 }}>{readingLine}</div>}
          </div>
          <button onClick={onPlay} title="Dengar pengucapan" style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "var(--lb-soft)", color: "var(--lb-teal-ink)", cursor: "pointer", flex: "none", display: "grid", placeItems: "center", animation: speaking ? "lbPulseRing 1.2s infinite" : "none" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 7.5v5h3.2L11 17V3L6.2 7.5H3z" fill="currentColor" /><path d="M13.5 6.5c1 .9 1.6 2.1 1.6 3.5s-.6 2.6-1.6 3.5M15.5 4.2c1.7 1.4 2.7 3.5 2.7 5.8s-1 4.4-2.7 5.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div style={{ fontSize: 17, color: "var(--lb-ink)", fontWeight: 600, marginTop: 10 }}>{w.meaning}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <span style={{ padding: "4px 11px", borderRadius: 999, background: th[0], color: th[1], fontSize: 12, fontWeight: 800, letterSpacing: ".03em", textTransform: "capitalize" }}>{w.pos}</span>
        </div>
        {grammarRows.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {grammarRows.map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ width: 118, flex: "none", fontSize: 11.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--lb-ink-4)" }}>{k}</span>
                <span style={{ fontSize: 14, color: "var(--lb-ink)", lineHeight: 1.45 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
        {w.forms && w.forms.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--lb-ink-4)", marginBottom: 8 }}>Bentuk lain</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {w.forms.map((f, i) => (
                <span key={i} style={{ padding: "6px 11px", background: "var(--lb-soft)", borderRadius: 9, fontSize: 14, color: "var(--lb-ink)" }}>
                  <span style={{ fontFamily: readFont, fontWeight: 600 }}>{f.form}</span> <span style={{ fontSize: 11.5, color: "var(--lb-ink-3)" }}>{f.note}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            onClick={onSave}
            style={{ flex: 1, padding: 13, borderRadius: 12, border: saved ? `1.5px solid ${TEAL}` : "none", background: saved ? "var(--lb-active)" : TEAL, color: saved ? "var(--lb-teal-ink)" : "#FFFFFF", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
          >
            {saved ? "✓ Tersimpan" : "+ Simpan ke Kosakata"}
          </button>
          <button
            onClick={onAsk}
            title="Tanya lebih lanjut ke AI"
            style={{ flex: "none", padding: "13px 16px", borderRadius: 12, border: `1.5px solid ${PURPLE}`, background: "var(--lb-ai-soft)", color: "var(--lb-ai-ink)", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
          >
            ✦ Tanya AI
          </button>
        </div>
      </div>
    </>
  );
}

function TocDrawer({
  book,
  isMobile,
  currentSlug,
  markedDone,
  onClose,
  onPick,
}: {
  book: Book;
  isMobile: boolean;
  currentSlug: string;
  markedDone: boolean;
  onClose: () => void;
  onPick: (slug: string) => void;
}) {
  const drawer: React.CSSProperties = isMobile
    ? { position: "fixed", left: 0, right: 0, bottom: 0, top: "10vh", background: "var(--lb-surface)", borderRadius: "22px 22px 0 0", padding: "18px 20px", zIndex: 55, overflowY: "auto", animation: "lbSheetUp .3s cubic-bezier(.3,1,.4,1)", boxSizing: "border-box" }
    : { position: "fixed", right: 0, top: 0, bottom: 0, width: 360, background: "var(--lb-surface)", padding: "20px 20px", zIndex: 55, overflowY: "auto", boxShadow: "-16px 0 40px rgba(17,49,58,.15)", animation: "lbPopIn .2s ease", boxSizing: "border-box" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(17,49,58,.4)", zIndex: 54, animation: "lbFadeIn .2s" }} />
      <div style={drawer}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--lb-ink)" }}>Daftar Isi</div>
            <div style={{ fontSize: 12.5, color: "var(--lb-ink-3)" }}>{book.title} · {book.level}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "var(--lb-soft)", color: "var(--lb-ink-2)", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
          {book.toc.map((c, i) => {
            const now = c.slug === currentSlug;
            const done = c.status === "done" || (now && markedDone);
            return (
              <div
                key={c.slug}
                onClick={() => onPick(c.slug)}
                className="lb-toc-row"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 10px", borderRadius: 12, cursor: "pointer", background: now ? "var(--lb-soft)" : "transparent" }}
              >
                <span style={{ width: 30, flex: "none", fontSize: 12.5, fontWeight: 800, color: now ? TEAL : "#B9CCC9", fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--lb-ink)" }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "var(--lb-ink-4)" }}>{c.subtitle}{c.duration ? ` · ${c.duration}` : ""}</div>
                </div>
                <span style={{ fontSize: done ? 15 : 11, fontWeight: 800, color: done ? TEAL : now ? "var(--lb-teal-ink)" : "#B9CCC9", whiteSpace: "nowrap" }}>{done ? "✓" : now ? "● Dibaca" : ""}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
