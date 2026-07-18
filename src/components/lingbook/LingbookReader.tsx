"use client";

// [lingbook-phase1-v1] Reader ebook interaktif Lingbook. Language-agnostic:
// furigana via <ruby> native, field grammar dirender dinamis per bahasa.
// Word card = popover (desktop) / bottom sheet (mobile, breakpoint md=768px).
// Audio phase 1 via TTS browser (lihat lingbook-speech.ts); field *Src siap
// diganti file storage. Semua teks UI berbahasa Indonesia.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AudioBlock,
  Book,
  Chapter,
  ContentBlock,
  DialogLine,
  TableCell,
  Token,
  Word,
} from "@/data/lingbook";
import { tokensToText } from "@/data/lingbook";
import { cancelSpeech, speak } from "@/lib/lingbook-speech";

const TEAL = "#1A9E9E";
const DARK = "#11313A";
const CJK_FONT = "'Noto Sans JP', 'Hiragino Sans', sans-serif";
const SERIF_FONT = "'Source Serif 4', Georgia, serif";
const MD = 768;

// Warna badge kelas kata (bg, teks).
function posTheme(pos: string): [string, string] {
  const m: Record<string, [string, string]> = {
    verba: ["#DDF1EE", "#0B7570"],
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
  onWord: (key: string, el: HTMLElement) => void;
  dark?: boolean;
  style?: React.CSSProperties;
}) {
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
            onClick={(e) => onWord(key, e.currentTarget)}
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
  tokenTextProps: Omit<React.ComponentProps<typeof TokenText>, "tokens" | "dark" | "style">;
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
  const [furigana, setFurigana] = useState(true);
  const [romaji, setRomaji] = useState(false);
  const [trans, setTrans] = useState(false);
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

  const [activeLine, setActiveLine] = useState(-1);
  const [playingAll, setPlayingAll] = useState(false);
  const playingAllRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollT = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    (key: string, el: HTMLElement) => {
      const word = glossary[key];
      if (!word) return;
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
      if (u) u.onend = () => setActiveLine(-1);
      else setTimeout(() => setActiveLine(-1), 1600);
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
        if (u) u.onend = () => step(i + 1);
        else setTimeout(() => step(i + 1), 1800);
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

  const completeChapter = () => {
    if (!isDone) {
      setCompleted(true);
      setIsDone(true);
    } else {
      showToast("Bab ini sudah ditandai selesai");
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
  const readerStyle: React.CSSProperties = { fontFamily: readFont, fontSize: fpx, lineHeight: lh, color: "#1E3A40", margin: 0 };

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

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "#F6FAF9", fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif", color: DARK }}>
      {/* Font baca + hover kata — dimuat khusus reader */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" />
      <style>{`
        .lb-word:hover{background:#DCEFED !important;}
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
      `}</style>

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ flex: "none", background: "#FFFFFF", borderBottom: "1px solid #E3EEEC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
            <button onClick={goLibrary} title="Kembali ke Library" style={hdrBtn}>←</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: TEAL, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {book.language.nativeName ? `${book.language.nativeName} — ${book.title} · ${book.level}` : `${book.title} · ${book.level}`}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: DARK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chapter.label}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5A7A78", whiteSpace: "nowrap" }}>
              Bab {doneIdx >= 0 ? doneIdx + 1 : 1} dari {book.chapterCount}
            </div>
            <button onClick={() => setTocOpen(true)} title="Daftar Isi" style={hdrBtn}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3.5h12M2 8h12M2 12.5h8" stroke="#33565C" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div style={{ height: 3, background: "#E9F2F0" }}>
            <div style={{ height: "100%", width: `${prog}%`, background: TEAL, borderRadius: "0 2px 2px 0", transition: "width .15s" }} />
          </div>
        </header>

        <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
          <article style={{ maxWidth: 700, margin: "0 auto", padding: "28px 20px 90px 20px", boxSizing: "border-box" }}>
            <div style={{ marginBottom: 30 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: TEAL, marginBottom: 8 }}>
                Bab {doneIdx >= 0 ? doneIdx + 1 : 1} dari {book.chapterCount}
              </div>
              <h1 style={{ fontFamily: readFont, fontSize: isCjk ? 40 : 34, fontWeight: 700, color: DARK, margin: 0, lineHeight: 1.2 }}>{chapter.title}</h1>
              {chapter.subtitle && <div style={{ fontSize: 16, color: "#5A7A78", fontWeight: 600, marginTop: 4 }}>{chapter.subtitle}</div>}
              {chapter.meta && <div style={{ fontSize: 13, color: "#8AA3A0", marginTop: 10 }}>{chapter.meta}</div>}
            </div>

            {chapter.blocks.map((block, bi) => (
              <BlockView
                key={bi}
                block={block}
                bi={bi}
                book={book}
                glossary={glossary}
                readFont={readFont}
                isCjk={isCjk}
                fpx={fpx}
                readerStyle={readerStyle}
                trans={trans}
                activeLine={activeLine}
                playingAll={playingAll}
                onPlayLine={playLine}
                onPlayAll={playAll}
                tokenTextProps={tokenTextProps}
              />
            ))}

            <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 14 }}>
              <button
                onClick={completeChapter}
                style={{
                  width: "100%",
                  padding: 15,
                  borderRadius: 13,
                  border: isDone ? `1.5px solid ${TEAL}` : "none",
                  background: isDone ? "#DFF1EF" : TEAL,
                  color: isDone ? "#0B7570" : "#FFFFFF",
                  fontFamily: "inherit",
                  fontSize: 15.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: isDone ? "none" : "0 6px 16px rgba(26,158,158,.3)",
                }}
              >
                {isDone ? "✓ Bab Selesai" : "Tandai Bab Selesai ✓"}
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => (prevSummary ? goChapter(prevSummary.slug) : showToast("Ini bab pertama"))}
                  style={{ ...navBtn, textAlign: "left" }}
                >
                  ← {prevSummary ? `Bab ${doneIdx}: ${prevSummary.title}` : "Bab pertama"}
                </button>
                <button
                  onClick={() => (nextSummary ? goChapter(nextSummary.slug) : showToast("Ini bab terakhir"))}
                  style={{ ...navBtn, textAlign: "right" }}
                >
                  {nextSummary ? `Bab ${doneIdx + 2}: ${nextSummary.title}` : "Bab terakhir"} →
                </button>
              </div>
            </div>
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
          onPlay={() => {
            setCardSpeaking(true);
            const u = speak(sel.word.surface, book.language.speechLang);
            if (u) u.onend = () => setCardSpeaking(false);
            else setTimeout(() => setCardSpeaking(false), 1200);
          }}
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
          <div style={{ background: "#FFFFFF", borderRadius: 22, padding: "34px 30px", maxWidth: 380, width: "100%", textAlign: "center", boxShadow: "0 24px 60px rgba(17,49,58,.3)" }}>
            <div style={{ width: 74, height: 74, borderRadius: "50%", background: TEAL, color: "#FFFFFF", display: "grid", placeItems: "center", margin: "0 auto 18px auto", animation: "lbCheckPop .45s ease" }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: 21, color: DARK }}>Bab selesai!</div>
            <div style={{ fontSize: 14, color: "#5A7A78", marginTop: 4 }}>{chapter.label}</div>
            <div style={{ display: "flex", gap: 10, margin: "22px 0" }}>
              <div style={statCard}><div style={statNum}>{clicked.size}</div><div style={statLabel}>kata di-tap</div></div>
              <div style={statCard}><div style={statNum}>{saved.size}</div><div style={statLabel}>kata disimpan</div></div>
            </div>
            <button
              onClick={() => { setCompleted(false); if (nextSummary) goChapter(nextSummary.slug); }}
              style={{ width: "100%", padding: 14, borderRadius: 13, border: "none", background: TEAL, color: "#FFFFFF", fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
            >
              {nextSummary ? `Bab ${doneIdx + 2}: ${nextSummary.title}` : "Kembali ke Library"} →
            </button>
            <button onClick={() => setCompleted(false)} style={{ width: "100%", padding: 12, borderRadius: 13, border: "none", background: "none", color: "#5A7A78", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>Kembali membaca</button>
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

const hdrBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 10, border: "1px solid #E3EEEC", background: "#FFFFFF", color: "#33565C", fontSize: 16, cursor: "pointer", display: "grid", placeItems: "center" };
const navBtn: React.CSSProperties = { flex: 1, padding: "13px 14px", borderRadius: 12, border: "1px solid #D5E6E3", background: "#FFFFFF", color: "#33565C", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" };
const statCard: React.CSSProperties = { flex: 1, background: "#F2F8F7", borderRadius: 14, padding: "14px 8px" };
const statNum: React.CSSProperties = { fontWeight: 800, fontSize: 24, color: TEAL };
const statLabel: React.CSSProperties = { fontSize: 12, color: "#5A7A78", fontWeight: 600 };

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
  tokenTextProps: Omit<React.ComponentProps<typeof TokenText>, "tokens" | "dark" | "style">;
}) {
  if (block.type === "heading") {
    return (
      <div style={{ margin: "38px 0 16px 0", display: "flex", alignItems: "baseline", gap: 12, borderBottom: "2px solid #E3EEEC", paddingBottom: 10 }}>
        <h2 style={{ fontFamily: readFont, fontSize: isCjk ? 24 : 22, fontWeight: 700, color: DARK, margin: 0 }}>{block.text}</h2>
        {block.sub && <span style={{ fontSize: 13, color: "#8AA3A0", fontWeight: 600 }}>{block.sub}</span>}
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
          <div style={{ marginTop: 6, padding: "10px 14px", background: "#EAF5F4", borderRadius: 10, fontSize: 14, color: "#33565C", lineHeight: 1.55 }}>{block.translation}</div>
        )}
      </div>
    );
  }

  if (block.type === "callout") {
    const variants: Record<string, [string, string, string, string]> = {
      info: ["#E4F2F1", TEAL, "i", "#0B7570"],
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
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "#33565C" }}>{block.body}</div>
        {block.example && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(255,255,255,.7)", borderRadius: 8, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <TokenText {...tokenTextProps} tokens={block.example.tokens} style={{ fontFamily: readFont, fontSize: Math.round(fpx * 0.9), lineHeight: 2 }} />
            {block.example.translation && <span style={{ fontSize: 13, color: "#5A7A78" }}>{block.example.translation}</span>}
          </div>
        )}
      </div>
    );
  }

  if (block.type === "dialog") {
    return (
      <div style={{ margin: "0 0 24px 0", background: "#FFFFFF", border: "1px solid #E3EEEC", borderRadius: 16, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button
            onClick={() => onPlayAll(bi, block.lines)}
            style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: playingAll ? DARK : "#E4F2F1", color: playingAll ? "#FFFFFF" : "#0B7570", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
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
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "#33565C" }}>{ln.speaker}</span>
                  {ln.role && <span style={{ fontSize: 11.5, color: "#8AA3A0" }}>{ln.role}</span>}
                  <button onClick={() => onPlayLine(bi, li, ln.tokens)} title="Putar audio baris" style={{ width: 22, height: 22, borderRadius: "50%", border: "none", background: active ? TEAL : "#E4F2F1", color: active ? "#FFFFFF" : "#0B7570", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}>
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
                <div style={{ background: active ? "#EAF7F6" : "#F7FAFA", border: active ? `1.5px solid ${TEAL}` : "1.5px solid #EDF4F3", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", transition: "all .2s" }}>
                  <TokenText {...tokenTextProps} tokens={ln.tokens} style={{ ...readerStyle, fontSize: Math.round((readerStyle.fontSize as number) * 0.92) }} />
                  {trans && ln.translation && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #D5E6E3", fontSize: 13.5, color: "#5A7A78" }}>{ln.translation}</div>
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
        <div style={{ width: "100%", aspectRatio: "16/9", position: "relative", borderRadius: 14, overflow: "hidden", background: "linear-gradient(135deg,#E3EEEC,#D5E6E3)" }}>
          {block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.src} alt={block.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#8AA3A0", fontSize: 13, fontWeight: 700 }}>{block.alt || "Gambar"}</div>
          )}
        </div>
        {(block.captionTokens || block.captionTranslation) && (
          <figcaption style={{ marginTop: 10, textAlign: "center" }}>
            {block.captionTokens && <TokenText {...tokenTextProps} tokens={block.captionTokens} style={{ fontFamily: readFont, fontSize: Math.round(fpx * 0.82), lineHeight: 1.9, color: "#33565C" }} />}
            {block.captionTranslation && <div style={{ fontSize: 12.5, color: "#8AA3A0", marginTop: 2 }}>{block.captionTranslation}</div>}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "table") {
    return (
      <div style={{ margin: "0 0 24px 0", background: "#FFFFFF", border: "1px solid #E3EEEC", borderRadius: 14, overflow: "hidden" }}>
        {block.title && <div style={{ padding: "12px 16px", fontWeight: 800, fontSize: 14, color: DARK, borderBottom: "1px solid #E9F2F0", background: "#FBFDFD" }}>{block.title}</div>}
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {block.columns.map((c, ci) => (
                  <th key={ci} style={{ textAlign: "left", padding: "9px 16px", fontSize: 11.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#5A7A78", borderBottom: "1px solid #E9F2F0" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell: TableCell, ci) => (
                    <td key={ci} style={{ padding: "10px 16px", borderBottom: "1px solid #F0F6F5", verticalAlign: "middle" }}>
                      {"tokens" in cell ? (
                        <TokenText {...tokenTextProps} tokens={cell.tokens} style={{ fontFamily: readFont, fontSize: isCjk ? 20 : 17, lineHeight: 1.9 }} />
                      ) : (
                        <span style={{ fontSize: 13.5, color: "#33565C" }}>{cell.text}</span>
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

  return null;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ width: 44, height: 26, borderRadius: 999, background: on ? TEAL : "#D5E6E3", padding: 3, boxSizing: "border-box", cursor: "pointer", transition: "background .2s", flex: "none" }}>
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
  onClose: () => void;
  setFurigana: (v: boolean) => void;
  setRomaji: (v: boolean) => void;
  setTrans: (v: boolean) => void;
  setMark: (v: boolean) => void;
  setFs: (v: number) => void;
}) {
  const rows: { label: string; desc: string; on: boolean; toggle: () => void }[] = [];
  if (isCjk) {
    rows.push({ label: "Furigana", desc: "Cara baca kana di atas kanji", on: furigana, toggle: () => setFurigana(!furigana) });
    rows.push({ label: "Romaji", desc: "Huruf Latin di atas kata", on: romaji, toggle: () => setRomaji(!romaji) });
  }
  rows.push({ label: "Terjemahan kalimat", desc: "Bahasa Indonesia di bawah tiap kalimat", on: trans, toggle: () => setTrans(!trans) });
  rows.push({ label: "Tandai kata di-tap", desc: "Garis putus di kata yang pernah dibuka", on: mark, toggle: () => setMark(!mark) });

  const sheet: React.CSSProperties = isMobile
    ? { position: "fixed", left: 0, right: 0, bottom: 0, background: "#FFFFFF", borderRadius: "22px 22px 0 0", padding: "18px 22px 28px 22px", zIndex: 52, boxShadow: "0 -10px 40px rgba(17,49,58,.2)", animation: "lbSheetUp .28s cubic-bezier(.3,1,.4,1)", boxSizing: "border-box" }
    : { position: "fixed", right: 20, bottom: 90, width: 340, background: "#FFFFFF", borderRadius: 18, padding: "18px 22px 22px 22px", zIndex: 52, border: "1px solid #E3EEEC", boxShadow: "0 18px 50px rgba(17,49,58,.2)", animation: "lbPopIn .18s ease", boxSizing: "border-box" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 51, background: isMobile ? "rgba(17,49,58,.4)" : "transparent", animation: isMobile ? "lbFadeIn .2s" : "none" }} />
      <div style={sheet}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: DARK }}>Pengaturan Baca</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#EFF6F5", color: "#33565C", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid #EDF4F3", gap: 14 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: DARK }}>{r.label}</div>
              <div style={{ fontSize: 12.5, color: "#5A7A78", marginTop: 1 }}>{r.desc}</div>
            </div>
            <Toggle on={r.on} onToggle={r.toggle} />
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0 4px 0", gap: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: DARK }}>Ukuran font</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["Kecil", "Sedang", "Besar"].map((l, i) => (
              <button
                key={l}
                onClick={() => setFs(i)}
                style={{ padding: "7px 12px", borderRadius: 9, border: fs === i ? `1.5px solid ${TEAL}` : "1.5px solid #D5E6E3", background: fs === i ? "#DFF1EF" : "#FFFFFF", color: fs === i ? "#0B7570" : "#5A7A78", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
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
  onPlay: () => void;
}) {
  const w = selection.word;
  const th = posTheme(w.pos);
  const readingLine = isCjk ? [w.reading, w.romaji].filter(Boolean).join(" · ") : "";
  const grammarRows = w.grammar ? Object.entries(w.grammar) : [];

  const base: React.CSSProperties = { background: "#FFFFFF", boxSizing: "border-box", zIndex: 60, boxShadow: "0 18px 50px rgba(17,49,58,.22)" };
  let cardStyle: React.CSSProperties;
  let backStyle: React.CSSProperties;
  if (isMobile || !cardPos) {
    cardStyle = { ...base, position: "fixed", left: 0, right: 0, bottom: 0, borderRadius: "22px 22px 0 0", padding: "14px 22px 26px 22px", maxHeight: "76vh", overflowY: "auto", animation: "lbSheetUp .28s cubic-bezier(.3,1,.4,1)" };
    backStyle = { position: "fixed", inset: 0, background: "rgba(17,49,58,.45)", zIndex: 59, animation: "lbFadeIn .2s" };
  } else {
    cardStyle = { ...base, position: "fixed", left: cardPos.left, top: cardPos.top, width: 340, borderRadius: 18, padding: "20px 22px", maxHeight: "70vh", overflowY: "auto", border: "1px solid #E3EEEC", transform: cardPos.above ? "translateY(-100%)" : "none", animation: `${cardPos.above ? "lbPopInUp" : "lbPopIn"} .18s ease` };
    backStyle = { position: "fixed", inset: 0, zIndex: 59, background: "transparent" };
  }

  return (
    <>
      <div onClick={onClose} style={backStyle} />
      <div style={cardStyle}>
        {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: "#D5E6E3", margin: "0 auto 12px auto" }} />}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: readFont, fontSize: isCjk ? 38 : 32, fontWeight: 700, color: DARK, lineHeight: 1.25 }}>{w.surface}</div>
            {readingLine && <div style={{ fontSize: 14.5, color: "#0E7D7D", fontWeight: 700, marginTop: 3 }}>{readingLine}</div>}
          </div>
          <button onClick={onPlay} title="Dengar pengucapan" style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "#E4F2F1", color: "#0B7570", cursor: "pointer", flex: "none", display: "grid", placeItems: "center", animation: speaking ? "lbPulseRing 1.2s infinite" : "none" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 7.5v5h3.2L11 17V3L6.2 7.5H3z" fill="currentColor" /><path d="M13.5 6.5c1 .9 1.6 2.1 1.6 3.5s-.6 2.6-1.6 3.5M15.5 4.2c1.7 1.4 2.7 3.5 2.7 5.8s-1 4.4-2.7 5.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div style={{ fontSize: 17, color: DARK, fontWeight: 600, marginTop: 10 }}>{w.meaning}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <span style={{ padding: "4px 11px", borderRadius: 999, background: th[0], color: th[1], fontSize: 12, fontWeight: 800, letterSpacing: ".03em", textTransform: "capitalize" }}>{w.pos}</span>
        </div>
        {grammarRows.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {grammarRows.map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ width: 118, flex: "none", fontSize: 11.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "#8AA3A0" }}>{k}</span>
                <span style={{ fontSize: 14, color: DARK, lineHeight: 1.45 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
        {w.forms && w.forms.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", color: "#8AA3A0", marginBottom: 8 }}>Bentuk lain</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {w.forms.map((f, i) => (
                <span key={i} style={{ padding: "6px 11px", background: "#EFF6F5", borderRadius: 9, fontSize: 14, color: DARK }}>
                  <span style={{ fontFamily: readFont, fontWeight: 600 }}>{f.form}</span> <span style={{ fontSize: 11.5, color: "#5A7A78" }}>{f.note}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={onSave}
          style={{ width: "100%", marginTop: 18, padding: 13, borderRadius: 12, border: saved ? `1.5px solid ${TEAL}` : "none", background: saved ? "#DFF1EF" : TEAL, color: saved ? "#0B7570" : "#FFFFFF", fontFamily: "inherit", fontSize: 14.5, fontWeight: 800, cursor: "pointer" }}
        >
          {saved ? "✓ Tersimpan di Kosakata" : "+ Simpan ke Kosakata"}
        </button>
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
    ? { position: "fixed", left: 0, right: 0, bottom: 0, top: "10vh", background: "#FFFFFF", borderRadius: "22px 22px 0 0", padding: "18px 20px", zIndex: 55, overflowY: "auto", animation: "lbSheetUp .3s cubic-bezier(.3,1,.4,1)", boxSizing: "border-box" }
    : { position: "fixed", right: 0, top: 0, bottom: 0, width: 360, background: "#FFFFFF", padding: "20px 20px", zIndex: 55, overflowY: "auto", boxShadow: "-16px 0 40px rgba(17,49,58,.15)", animation: "lbPopIn .2s ease", boxSizing: "border-box" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(17,49,58,.4)", zIndex: 54, animation: "lbFadeIn .2s" }} />
      <div style={drawer}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: DARK }}>Daftar Isi</div>
            <div style={{ fontSize: 12.5, color: "#5A7A78" }}>{book.title} · {book.level}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#EFF6F5", color: "#33565C", cursor: "pointer", fontSize: 13 }}>✕</button>
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
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 10px", borderRadius: 12, cursor: "pointer", background: now ? "#EFF8F7" : "transparent" }}
              >
                <span style={{ width: 30, flex: "none", fontSize: 12.5, fontWeight: 800, color: now ? TEAL : "#B9CCC9", fontVariantNumeric: "tabular-nums" }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "#8AA3A0" }}>{c.subtitle}{c.duration ? ` · ${c.duration}` : ""}</div>
                </div>
                <span style={{ fontSize: done ? 15 : 11, fontWeight: 800, color: done ? TEAL : now ? "#0B7570" : "#B9CCC9", whiteSpace: "nowrap" }}>{done ? "✓" : now ? "● Dibaca" : ""}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
