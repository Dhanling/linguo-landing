"use client";

// Mode "Belajar Mendalami Kata" — layar penuh yang dibuka dari tombol perbesar di
// tooltip kata. Menyajikan kata secara mendalam: arti, tingkat kesopanan
// (register: netral/formal/casual/dll), kapan & bagaimana dipakai, nuansa, kata
// mirip yang gampang ketuker, dan contoh kalimat. Plus tab "Tanya AI" untuk
// pertanyaan lanjutan bebas (kapan pakai, bedanya dengan kata lain, dll).
// Semua konten AI ditarik dari /api/word-deep (Gemini) — sekali per buka.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookmarkCheck,
  BookmarkPlus,
  Loader2,
  Send,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import {
  askWordQuestion,
  getWordDeepDive,
  isWordSaved,
  removeSavedWord,
  saveWord,
  speakText,
  WordDeepDive,
  WordMeaning,
} from "@/lib/immersionLearn";
import { getImmersionLang } from "@/lib/immersion";
import { RectFlag } from "@/components/RectFlag";

const TEAL = "#1A9E9E";
const GOLD = "#F4B740";
const BG = "#06090A";
const CARD = "#0F1416";
const BORDER = "rgba(255,255,255,0.09)";
const SUB = "rgba(255,255,255,0.5)";

// Warna + label ramah untuk tiap tingkat kesopanan (register).
const REGISTER: Record<string, { label: string; color: string; bg: string }> = {
  formal: { label: "Formal", color: "#5AB0FF", bg: "rgba(90,176,255,0.16)" },
  netral: { label: "Netral", color: "#7FE0E0", bg: "rgba(26,158,158,0.16)" },
  casual: { label: "Santai", color: GOLD, bg: "rgba(244,183,64,0.16)" },
  sopan: { label: "Sopan", color: "#9AE66E", bg: "rgba(154,230,110,0.16)" },
  vulgar: { label: "Kasar", color: "#FF6B6B", bg: "rgba(255,107,107,0.16)" },
};

function registerStyle(reg: string) {
  return REGISTER[reg] ?? { label: reg || "—", color: SUB, bg: "rgba(255,255,255,0.06)" };
}

// Pertanyaan lanjutan siap-pakai — chip yang tinggal ketuk.
const SUGGESTED = [
  "Kapan kata ini dipakai?",
  "Apa bedanya dengan kata yang mirip?",
  "Beri contoh dalam situasi formal",
  "Beri contoh dalam situasi santai",
];

type ChatMsg = { role: "user" | "ai"; text: string };

export default function WordStudy({
  word,
  sentence,
  langCode,
  translit,
  meaning,
  onClose,
  onSavedChange,
}: {
  word: string;
  sentence: string;
  langCode: string;
  translit?: string;
  meaning?: WordMeaning | null;
  onClose: () => void;
  onSavedChange?: () => void;
}) {
  const lang = getImmersionLang(langCode);
  const [tab, setTab] = useState<"study" | "ask">("study");
  const [saved, setSaved] = useState(false);

  const [deep, setDeep] = useState<WordDeepDive | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  // Tanya-jawab lanjutan.
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSaved(isWordSaved(word, langCode));
    let cancelled = false;
    setLoading(true);
    setErrored(false);
    getWordDeepDive({ word, sentence, langCode })
      .then((d) => !cancelled && setDeep(d))
      .catch(() => !cancelled && setErrored(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [word, sentence, langCode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, asking]);

  const toggleSave = useCallback(() => {
    if (saved) {
      removeSavedWord(word, langCode);
      setSaved(false);
    } else {
      saveWord({ word, meaning: meaning?.meaning ?? deep?.usage ?? "", langCode, example: sentence });
      setSaved(true);
    }
    onSavedChange?.();
  }, [saved, word, langCode, meaning, deep, sentence, onSavedChange]);

  const ask = useCallback(
    (q: string) => {
      const question = q.trim();
      if (!question || asking) return;
      setInput("");
      setTab("ask");
      setChat((c) => [...c, { role: "user", text: question }]);
      setAsking(true);
      askWordQuestion({ word, sentence, langCode, question })
        .then((a) =>
          setChat((c) => [...c, { role: "ai", text: a || "Maaf, tidak ada jawaban. Coba lagi." }])
        )
        .catch(() => setChat((c) => [...c, { role: "ai", text: "Gagal memuat jawaban. Coba lagi." }]))
        .finally(() => setAsking(false));
    },
    [asking, word, sentence, langCode]
  );

  const reg = deep ? registerStyle(deep.register) : null;

  return (
    <div className="fixed inset-0 z-[97] flex flex-col" style={{ backgroundColor: BG }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {lang && <RectFlag code={lang.country} h={16} />}
            <span className="text-[26px] font-extrabold leading-tight text-white sm:text-[30px]">
              {word}
            </span>
            {meaning?.type && (
              <span
                className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: "rgba(26,158,158,0.18)", color: "#7FE0E0" }}
              >
                {meaning.type}
              </span>
            )}
            {reg && (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{ backgroundColor: reg.bg, color: reg.color }}
              >
                {reg.label}
              </span>
            )}
          </div>
          {translit && (
            <p className="mt-0.5 text-[13px] font-medium italic" style={{ color: "#7FE0E0" }}>
              {translit}
            </p>
          )}
          {meaning?.meaning && (
            <p className="mt-1 text-[16px] font-bold leading-snug" style={{ color: GOLD }}>
              {meaning.meaning}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <IconBtn label="Dengar" onClick={() => speakText(word, langCode)}>
            <Volume2 className="h-5 w-5" />
          </IconBtn>
          <IconBtn label={saved ? "Tersimpan" : "Simpan"} active={saved} onClick={toggleSave}>
            {saved ? <BookmarkCheck className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
          </IconBtn>
          <IconBtn label="Tutup" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconBtn>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-4 pt-3 sm:px-6">
        <TabBtn active={tab === "study"} onClick={() => setTab("study")}>
          Pelajari
        </TabBtn>
        <TabBtn active={tab === "ask"} onClick={() => setTab("ask")}>
          <Sparkles className="h-3.5 w-3.5" /> Tanya AI
        </TabBtn>
      </div>

      {/* Isi */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {tab === "study" ? (
            <StudyTab
              loading={loading}
              errored={errored}
              deep={deep}
              reg={reg}
              langCode={langCode}
              onAsk={ask}
            />
          ) : (
            <AskTab chat={chat} asking={asking} onAsk={ask} chatEndRef={chatEndRef} />
          )}
        </div>
      </div>

      {/* Input tanya (selalu tampak di tab Tanya) */}
      {tab === "ask" && (
        <div className="px-4 py-3 sm:px-6" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder={`Tanya apa saja tentang "${word}"…`}
              className="flex-1 rounded-full px-4 py-2.5 text-[14px] text-white outline-none placeholder:text-white/35"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            />
            <button
              onClick={() => ask(input)}
              disabled={!input.trim() || asking}
              aria-label="Kirim"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: TEAL }}
            >
              <Send className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab Pelajari ─────────────────────────────────────────────────────────────
function StudyTab({
  loading,
  errored,
  deep,
  reg,
  langCode,
  onAsk,
}: {
  loading: boolean;
  errored: boolean;
  deep: WordDeepDive | null;
  reg: { label: string; color: string; bg: string } | null;
  langCode: string;
  onAsk: (q: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16" style={{ color: SUB }}>
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="text-[13px] font-medium">Menyiapkan materi belajar…</p>
      </div>
    );
  }
  if (errored || !deep) {
    return (
      <div className="py-16 text-center">
        <p className="text-[14px] font-bold text-white">Gagal memuat materi</p>
        <p className="mt-1 text-[13px]" style={{ color: SUB }}>
          Coba tutup lalu buka lagi kata ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Tingkat kesopanan */}
      {(deep.registerNote || reg) && (
        <Section title="Tingkat Kesopanan">
          <div className="flex items-center gap-2">
            {reg && (
              <span
                className="rounded-full px-2.5 py-1 text-[12px] font-bold"
                style={{ backgroundColor: reg.bg, color: reg.color }}
              >
                {reg.label}
              </span>
            )}
          </div>
          {deep.registerNote && (
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/85">{deep.registerNote}</p>
          )}
        </Section>
      )}

      {/* Penggunaan */}
      {deep.usage && (
        <Section title="Kapan & Bagaimana Dipakai">
          <p className="text-[13.5px] leading-relaxed text-white/85">{deep.usage}</p>
        </Section>
      )}

      {/* Nuansa */}
      {deep.nuance && (
        <Section title="Nuansa">
          <p className="text-[13.5px] leading-relaxed text-white/85">{deep.nuance}</p>
        </Section>
      )}

      {/* Kata mirip */}
      {deep.similar.length > 0 && (
        <Section title="Kata Mirip yang Gampang Ketuker">
          <div className="space-y-2.5">
            {deep.similar.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <button
                  onClick={() => speakText(s.word, langCode)}
                  className="mt-0.5 shrink-0 rounded-lg px-2 py-1 text-[13px] font-bold transition-colors hover:bg-white/10"
                  style={{ color: "#7FE0E0", border: `1px solid ${BORDER}` }}
                >
                  {s.word}
                </button>
                <div className="min-w-0">
                  {s.tl && (
                    <p className="text-[11.5px] italic" style={{ color: SUB }}>
                      {s.tl}
                    </p>
                  )}
                  <p className="text-[13px] leading-relaxed text-white/80">{s.diff}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Contoh kalimat */}
      {deep.examples.length > 0 && (
        <Section title="Contoh Kalimat">
          <div className="space-y-3">
            {deep.examples.map((ex, i) => (
              <div key={i}>
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => speakText(ex.target, langCode)}
                    aria-label="Dengar contoh"
                    className="mt-0.5 shrink-0 opacity-70 transition-opacity hover:opacity-100"
                    style={{ color: TEAL }}
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-semibold leading-snug text-white">{ex.target}</p>
                    {ex.tl && (
                      <p className="text-[12px] italic" style={{ color: "#7FE0E0" }}>
                        {ex.tl}
                      </p>
                    )}
                    <p className="mt-0.5 text-[13px] leading-snug" style={{ color: GOLD }}>
                      {ex.gloss}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Ajakan bertanya */}
      <div className="pt-1">
        <p className="mb-2 text-[12px] font-semibold" style={{ color: SUB }}>
          Masih penasaran? Tanya AI:
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              onClick={() => onAsk(q)}
              className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white/85 transition-colors hover:bg-white/10"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab Tanya AI ─────────────────────────────────────────────────────────────
function AskTab({
  chat,
  asking,
  onAsk,
  chatEndRef,
}: {
  chat: ChatMsg[];
  asking: boolean;
  onAsk: (q: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (chat.length === 0 && !asking) {
    return (
      <div className="py-6">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
        >
          <Sparkles className="h-6 w-6" color={TEAL} />
        </div>
        <p className="text-center text-[15px] font-bold text-white">Tanya apa saja tentang kata ini</p>
        <p className="mx-auto mt-1 max-w-sm text-center text-[13px] leading-relaxed" style={{ color: SUB }}>
          Kapan dipakai, bedanya dengan kata lain, contoh dalam situasi tertentu — ketik di bawah atau
          pilih salah satu:
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              onClick={() => onAsk(q)}
              className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white/85 transition-colors hover:bg-white/10"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chat.map((m, i) =>
        m.role === "user" ? (
          <div key={i} className="flex justify-end">
            <div
              className="max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-[13.5px] font-medium text-white"
              style={{ backgroundColor: TEAL }}
            >
              {m.text}
            </div>
          </div>
        ) : (
          <div key={i} className="flex justify-start">
            <div
              className="max-w-[90%] rounded-2xl rounded-bl-md px-3.5 py-2.5"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              <RichText text={m.text} />
            </div>
          </div>
        )
      )}
      {asking && (
        <div className="flex justify-start">
          <div
            className="flex items-center gap-2 rounded-2xl rounded-bl-md px-3.5 py-2.5"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: SUB }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[12.5px]">Menjawab…</span>
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
}

// Sorot «kata» (dengan arti opsional dalam kurung) berwarna teal — sama seperti
// panel analisa grammar di tooltip.
function RichText({ text }: { text: string }) {
  const parts = text.split(/(«[^»]*»(?:\s*\([^)]*\))?)/g);
  return (
    <p className="text-[13.5px] leading-relaxed text-white/85">
      {parts.map((p, i) => {
        if (p.startsWith("«")) {
          return (
            <span key={i} className="font-bold" style={{ color: "#7FE0E0" }}>
              {p.replace(/[«»]/g, "")}
            </span>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-wide" style={{ color: SUB }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function TabBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors"
      style={{
        backgroundColor: active ? TEAL : "transparent",
        border: `1px solid ${active ? TEAL : BORDER}`,
        color: active ? "#fff" : "rgba(255,255,255,0.7)",
      }}
    >
      {children}
    </button>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
      style={{
        border: `1px solid ${active ? TEAL : BORDER}`,
        color: active ? "#7FE0E0" : "#fff",
        backgroundColor: active ? "rgba(26,158,158,0.15)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}
