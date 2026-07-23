"use client";

// [watch-sentence-study-v1] Mode "Analisa Kalimat" — layar penuh (drawer kanan di
// desktop / bottom-sheet di mobile) yang dibuka dari tombol AI melayang. Sepupu
// WordStudy tapi subjeknya SATU KALIMAT utuh yang sedang tayang di video: arti
// keseluruhan, struktur/tata bahasa, nada, dan pecahan bermakna (kata/frasa + peran
// + artinya). Plus tab "Tanya AI" untuk pertanyaan lanjutan bebas tentang kalimat
// itu. Semua konten AI ditarik dari /api/word-deep (kind:"sentence") — sekali per buka.

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Sparkles, Volume2, X } from "lucide-react";
import {
  askSentenceQuestion,
  FollowupQ,
  getSentenceBreakdown,
  getSentenceDeepDive,
  isRtl,
  POS_COLOR,
  POS_LABEL_ID,
  SentenceBreakdown,
  speakText,
  SentenceDeepDive,
} from "@/lib/immersionLearn";
import { getImmersionLang } from "@/lib/immersion";
import { RectFlag } from "@/components/RectFlag";
// Elemen render bersama dengan drawer kata (chat kaya, kartu section, tab, ikon).
import WordStudy, { AnswerSkeleton, IconBtn, RichText, Section, stripGuillemets, TabBtn, WordTapHandler } from "./WordStudy";
import ExplanationWordTip from "./ExplanationWordTip";

const TEAL = "#1A9E9E";
const TEAL_DARK = "#0A6060";
const GOLD = "#F4B740";
const BG = "#06090A";
const CARD = "rgba(255,255,255,0.05)";
const BORDER = "rgba(255,255,255,0.09)";
const SUB = "rgba(255,255,255,0.5)";
// Gold redup untuk arti per-kata — SAMA dengan mode Analisa di player, supaya
// "Pecahan Kalimat" di drawer terbaca sebagai tampilan yang sama, bukan gaya lain.
const GOLD_DIM = "rgba(244,183,64,0.72)";

// [watch-sentence-followup-grammar-v1] Chip pertanyaan lanjutan datang dari AI dan
// menempel pada tata bahasa kalimat yang sedang dianalisa (mis. "Ajarin pakai
// «antes de» + infinitif"), maksimal 3 biar tidak jadi dinding chip. Daftar di
// bawah cuma CADANGAN kalau AI tak mengirim usulan (offline/parse gagal).
const SUGGESTED_FALLBACK = [
  "Jelaskan tata bahasanya lebih dalam",
  "Kenapa urutan katanya begini?",
  "Buat contoh kalimat yang mirip",
];
const MAX_FOLLOWUPS = 3;

type ChatMsg = { role: "user" | "ai"; text: string; followups?: FollowupQ[] };

export default function SentenceStudy({
  sentence,
  translit,
  translation,
  langCode,
  baseCode,
  onClose,
}: {
  // Kalimat bahasa target yang sedang tayang (baris `target` cue).
  sentence: string;
  // Bacaan Latin seluruh kalimat (bila ada di cue) — tampil di header sebelum AI.
  translit?: string;
  // Terjemahan cue (baris emas) — tampil instan sebelum analisa AI selesai dimuat.
  translation?: string;
  langCode: string;
  // Bahasa penjelasan/jawaban (kode BASE_LANGS).
  baseCode?: string;
  onClose: () => void;
}) {
  const lang = getImmersionLang(langCode);
  const [tab, setTab] = useState<"study" | "ask">("study");

  // [watch-explain-word-tip-v1] Kata target di-tap di teks penjelasan → balon arti;
  // `subWord` = kata "Analisa" dari balon → buka drawer WordStudy di atasnya.
  const [wordTip, setWordTip] = useState<{ word: string; x: number; y: number; id: number } | null>(null);
  const [subWord, setSubWord] = useState<string | null>(null);
  const onExplainWordTap = useCallback<WordTapHandler>((w, e) => {
    setWordTip({ word: w, x: e.clientX, y: e.clientY, id: Date.now() });
  }, []);

  const [deep, setDeep] = useState<SentenceDeepDive | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  // [watch-study-breakdown-v1] "Pecahan Kalimat" memakai breakdown per-kata yang
  // SAMA dengan mode Analisa di player (arti di atas kata, kata berwarna kelas kata,
  // label kelas kata di bawah) — bukan daftar frasa bergaya sendiri. Sumbernya juga
  // sama (getSentenceBreakdown → cache localStorage/prewarm), jadi hampir selalu
  // instan dan tak pernah beda isi dengan yang tampil di subtitle.
  const [bd, setBd] = useState<SentenceBreakdown | null>(null);
  const [bdLoading, setBdLoading] = useState(true);

  // Tanya-jawab lanjutan.
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Kalimat berganti (drawer dimuat ulang di tempat) → bersihkan konten lama.
    setDeep(null);
    setChat([]);
    setInput("");
    setAsking(false);
    setTab("study");
    let cancelled = false;
    setLoading(true);
    setErrored(false);
    getSentenceDeepDive({ sentence, langCode, baseCode })
      .then((d) => !cancelled && setDeep(d))
      .catch(() => !cancelled && setErrored(true))
      .finally(() => !cancelled && setLoading(false));
    // Breakdown per-kata jalan paralel; gagal = diam-diam fallback ke pecahan frasa AI.
    setBd(null);
    setBdLoading(true);
    getSentenceBreakdown({ sentence, langCode, baseCode })
      .then((b) => !cancelled && setBd(b))
      .catch(() => {})
      .finally(() => !cancelled && setBdLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sentence, langCode, baseCode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, asking]);

  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const close = useCallback(() => {
    setEntered(false);
    window.setTimeout(onClose, 220);
  }, [onClose]);

  const ask = useCallback(
    (q: string) => {
      const question = q.trim();
      if (!question || asking) return;
      setInput("");
      setTab("ask");
      setChat((c) => [...c, { role: "user", text: question }]);
      setAsking(true);
      askSentenceQuestion({ sentence, langCode, baseCode, question })
        .then((a) =>
          setChat((c) => [
            ...c,
            {
              role: "ai",
              text: a.answer || "Maaf, tidak ada jawaban. Coba lagi.",
              followups: a.followups,
            },
          ])
        )
        .catch(() => setChat((c) => [...c, { role: "ai", text: "Gagal memuat jawaban. Coba lagi." }]))
        .finally(() => setAsking(false));
    },
    [asking, sentence, langCode, baseCode]
  );

  // Arti yang ditampilkan di header: hasil AI kalau sudah ada, kalau belum pakai
  // terjemahan cue (baris emas) supaya header tak kosong selagi analisa dimuat.
  const headTranslation = deep?.translation || translation || "";

  // [watch-sentence-composer-dock-v1] Chip pertanyaan + kolom ketik TIDAK lagi ikut
  // menggantung di ujung konten (dulu nyangkut di tengah drawer dengan ruang kosong
  // menganga di bawahnya). Keduanya sekarang DIDOK di dasar drawer ala Gemini:
  // isi bergulir di atasnya, komposer tetap di tempat — sama untuk tab Pelajari
  // maupun Tanya AI, jadi mata tahu "ngetiknya selalu di sini".
  const langName = lang?.name ?? "";
  const baseChips: FollowupQ[] = [
    // Usulan AI (nempel grammar kalimat ini) didahulukan, lalu istilah tata bahasa
    // yang tadi dipakai, baru cadangan generik. Dipotong 3 biar ringkas.
    ...(deep?.followups ?? []),
    ...(deep?.terms ?? []).map((t) => (langName ? `Apa itu ${t} dalam bahasa ${langName}?` : `Apa itu ${t}?`)),
    ...SUGGESTED_FALLBACK,
  ]
    .filter((q, i, arr) => arr.indexOf(q) === i)
    .slice(0, MAX_FOLLOWUPS)
    .map((q) => ({ q }));

  // Chip yang tampil di dok: tab Pelajari = usulan awal; tab Tanya = lanjutan dari
  // jawaban terakhir (biar percakapan terus mengalir), kosong selagi AI menjawab.
  const lastMsg = chat[chat.length - 1];
  const dockChips: FollowupQ[] = asking
    ? []
    : tab === "study" || chat.length === 0
      ? baseChips
      : lastMsg?.role === "ai"
        ? (lastMsg.followups ?? []).slice(0, MAX_FOLLOWUPS)
        : [];
  const dockLabel = tab === "study" || chat.length === 0 ? "Masih penasaran? Tanya AI:" : "Lanjut tanya:";

  return (
    <>
    {/* Backdrop — transparan di desktop (video tetap terlihat, ala WordStudy),
        dim tipis + tap-to-dismiss di mobile. */}
    <div
      onClick={close}
      className={`fixed inset-0 z-[96] bg-black/50 transition-opacity duration-200 lg:pointer-events-none lg:bg-transparent ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden
    />
    {/* Drawer — bottom-sheet di mobile, panel kanan di desktop. Lebar desktop dari
        CSS var --drawer-w yang di-set player (sama dgn drawer kata). */}
    <div
      className={`fixed z-[97] flex flex-col overflow-hidden shadow-2xl transition-transform duration-[220ms] ease-out inset-x-0 bottom-0 h-[86%] rounded-t-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[var(--drawer-w,440px)] lg:max-w-[92vw] lg:rounded-none ${
        entered ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-x-full lg:translate-y-0"
      }`}
      style={{ backgroundColor: BG, borderTop: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            {lang && <RectFlag code={lang.country} h={14} />}
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: SUB }}>
              Analisa Kalimat
            </span>
          </div>
          <p className="text-[18px] font-extrabold leading-snug text-white sm:text-[20px]" dir="auto">
            {sentence}
          </p>
          {translit && (
            <p className="mt-0.5 text-[13px] font-medium italic" style={{ color: "#7FE0E0" }}>
              {translit}
            </p>
          )}
          {headTranslation && (
            <p className="mt-1 text-[15px] font-bold leading-snug" style={{ color: GOLD }}>
              {headTranslation}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <IconBtn label="Dengar" onClick={() => speakText(sentence, langCode)}>
            <Volume2 className="h-5 w-5" />
          </IconBtn>
          <IconBtn label="Tutup" onClick={close}>
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
              bd={bd}
              bdLoading={bdLoading}
              langCode={langCode}
              onWordTap={onExplainWordTap}
            />
          ) : (
            <AskTab chat={chat} asking={asking} chatEndRef={chatEndRef} onWordTap={onExplainWordTap} />
          )}
        </div>
      </div>

      {/* Komposer terdok — chip usulan + kolom ketik, selalu menempel di dasar
          drawer (ala Gemini). Chip disembunyikan selagi analisa dimuat supaya dok
          tak melonjak tinggi lalu mengempis begitu data datang. */}
      <div
        className="px-4 pb-3 pt-2.5 sm:px-6"
        style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: BG, paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-2xl">
          {!loading && dockChips.length > 0 && (
            <div className="mb-2.5 max-h-[34vh] overflow-y-auto">
              <p className="mb-2 text-[12px] font-semibold" style={{ color: SUB }}>
                {dockLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {dockChips.map((c) => (
                  <button
                    key={c.q}
                    onClick={() => ask(stripGuillemets(c.q))}
                    className="flex flex-col items-start rounded-2xl px-3 py-1.5 text-left transition-colors hover:bg-white/10"
                    style={{ backgroundColor: "rgba(26,158,158,0.16)", color: "#7FE0E0" }}
                  >
                    <span className="text-[12.5px] font-semibold">{stripGuillemets(c.q)}</span>
                    {c.tl && <span className="text-[11px] italic opacity-80">{stripGuillemets(c.tl)}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
              placeholder="Tanya apa saja tentang kalimat ini…"
              className="flex-1 rounded-full px-4 py-2.5 text-[14px] text-white outline-none placeholder:text-white/35"
              style={{ backgroundColor: CARD }}
            />
            <button
              onClick={() => ask(input)}
              disabled={!input.trim() || asking}
              aria-label="Kirim"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: TEAL_DARK }}
            >
              <Send className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* [watch-explain-word-tip-v1] Balon arti kata target yang di-tap di penjelasan —
        di LUAR drawer (drawer ber-transform → containing block untuk fixed). */}
    {wordTip && (
      <ExplanationWordTip
        key={wordTip.id}
        word={wordTip.word}
        sentence={sentence}
        langCode={langCode}
        baseCode={baseCode}
        x={wordTip.x}
        y={wordTip.y}
        onClose={() => setWordTip(null)}
        onAnalyze={(w) => {
          setWordTip(null);
          setSubWord(w);
        }}
      />
    )}

    {/* Analisa kata dari balon → drawer WordStudy di atas drawer kalimat. */}
    {subWord && (
      <WordStudy
        word={subWord}
        sentence={sentence}
        langCode={langCode}
        baseCode={baseCode}
        onClose={() => setSubWord(null)}
      />
    )}
    </>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ w, h = 11, r = 6, className = "" }: { w: number | string; h?: number; r?: number; className?: string }) {
  return <div className={`wl-skeleton ${className}`} style={{ width: w, height: h, borderRadius: r }} />;
}

function SkelSection({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: CARD }}>
      <Skel w={96} h={10} className="mb-3" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skel key={i} w={i === lines - 1 ? "68%" : "100%"} />
        ))}
      </div>
    </div>
  );
}

function StudySkeleton() {
  return (
    <div className="space-y-3.5" aria-busy="true" aria-label="Menyiapkan analisa kalimat">
      <SkelSection lines={2} />
      <SkelSection lines={3} />
      <SkelSection lines={4} />
      <div className="pt-1">
        <Skel w={132} h={10} className="mb-2.5" />
        <div className="flex flex-wrap gap-2">
          {[186, 164, 148].map((w, i) => (
            <Skel key={i} w={w} h={30} r={9999} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab Pelajari ─────────────────────────────────────────────────────────────
function StudyTab({
  loading,
  errored,
  deep,
  bd,
  bdLoading,
  langCode,
  onWordTap,
}: {
  loading: boolean;
  errored: boolean;
  deep: SentenceDeepDive | null;
  // Breakdown per-kata (sumber sama dgn mode Analisa player); null = belum ada/gagal.
  bd: SentenceBreakdown | null;
  bdLoading: boolean;
  langCode: string;
  onWordTap: WordTapHandler;
}) {
  if (loading) {
    return <StudySkeleton />;
  }
  if (errored || !deep) {
    return (
      <div className="py-16 text-center">
        <p className="text-[14px] font-bold text-white">Gagal memuat analisa</p>
        <p className="mt-1 text-[13px]" style={{ color: SUB }}>
          Coba tutup lalu buka lagi kalimat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Struktur & tata bahasa. Kartu "Arti Keseluruhan" sengaja DIHAPUS: artinya
          sudah tercetak besar (emas) di header drawer, jadi kartu itu cuma
          mengulang. Gloss harfiah — satu-satunya isi yang tak ada di header —
          menumpang di sini sebagai baris kecil. */}
      {(deep.grammar || deep.literal) && (
        <Section title="Struktur & Tata Bahasa">
          {deep.grammar && <p className="text-[13.5px] leading-relaxed text-white/85">{deep.grammar}</p>}
          {deep.literal && (
            <p className={`text-[13px] leading-relaxed ${deep.grammar ? "mt-2" : ""}`} style={{ color: SUB }}>
              <span className="font-bold" style={{ color: "#7FE0E0" }}>Harfiah: </span>
              {deep.literal}
            </p>
          )}
        </Section>
      )}

      {/* Nada */}
      {deep.tone && (
        <Section title="Nada">
          <p className="text-[13.5px] leading-relaxed text-white/85">{deep.tone}</p>
        </Section>
      )}

      {/* Pecahan kalimat — tampilan per-kata PERSIS mode Analisa di player: arti
          (emas redup) di atas kata, kata diwarnai kelas kata, bacaan Latin, lalu
          label kelas kata di bawah. Ketuk kata = balon arti (Simpan · Analisa · TTS). */}
      {bd && bd.tokens.length > 0 ? (
        <Section title="Pecahan Kalimat">
          <div
            className="flex flex-wrap items-end gap-x-3 gap-y-3"
            dir={isRtl(langCode) ? "rtl" : undefined}
          >
            {bd.tokens.map((t, i) => (
              <span
                key={i}
                onClick={(e) => onWordTap(t.word, e)}
                className="flex cursor-pointer flex-col items-center text-center transition-opacity hover:opacity-80"
              >
                {t.gloss && (
                  <span
                    className="block text-[11px] font-semibold leading-tight"
                    style={{ color: GOLD_DIM }}
                  >
                    {t.gloss}
                  </span>
                )}
                <span
                  className="block text-[19px] font-extrabold leading-tight"
                  style={{ color: POS_COLOR[t.cat] }}
                >
                  {t.word}
                </span>
                {t.translit && (
                  <span className="block text-[11px] italic leading-tight text-white">
                    {t.translit}
                  </span>
                )}
                <span className="block text-[10px] font-semibold" style={{ color: SUB }}>
                  {POS_LABEL_ID[t.cat]}
                </span>
              </span>
            ))}
          </div>
        </Section>
      ) : bdLoading ? (
        <Section title="Pecahan Kalimat">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
            {[52, 38, 64, 46, 58].map((w, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skel w={w * 0.8} h={9} />
                <Skel w={w} h={16} />
                <Skel w={w * 0.6} h={8} />
              </div>
            ))}
          </div>
        </Section>
      ) : deep.chunks.length > 0 ? (
        /* Fallback: breakdown per-kata tak tersedia (offline/AI gagal) → pecahan
           frasa dari deep-dive, gaya lama. */
        <Section title="Pecahan Kalimat">
          <div className="space-y-2.5">
            {deep.chunks.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <button
                  onClick={() => speakText(c.part, langCode)}
                  className="mt-0.5 shrink-0 rounded-lg px-2 py-1 text-[13px] font-bold transition-colors hover:bg-white/10"
                  style={{ color: "#7FE0E0", backgroundColor: CARD }}
                  dir="auto"
                >
                  {c.part}
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {c.role && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: "rgba(26,158,158,0.16)", color: "#7FE0E0" }}
                      >
                        {c.role}
                      </span>
                    )}
                    {c.tl && (
                      <span className="text-[11.5px] italic" style={{ color: SUB }}>
                        {c.tl}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-white/85">{c.gloss}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
      {/* Chip usulan & kolom ketik TIDAK di sini — keduanya didok di dasar drawer
          (lihat komposer di komponen induk), jadi kartu analisa berhenti di sini. */}
    </div>
  );
}

// ── Tab Tanya AI ─────────────────────────────────────────────────────────────
function AskTab({
  chat,
  asking,
  chatEndRef,
  onWordTap,
}: {
  chat: ChatMsg[];
  asking: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onWordTap?: WordTapHandler;
}) {
  // Layar pembuka — chip usulannya ada di dok bawah, jadi di sini cukup ajakannya.
  if (chat.length === 0 && !asking) {
    return (
      <div className="py-6">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: CARD }}
        >
          <Sparkles className="h-6 w-6" color={TEAL} />
        </div>
        <p className="text-center text-[15px] font-bold text-white">Tanya apa saja tentang kalimat ini</p>
        <p className="mx-auto mt-1 max-w-sm text-center text-[13px] leading-relaxed" style={{ color: SUB }}>
          Tata bahasanya, kenapa urutannya begini, versi lain — ketik di bawah atau pilih salah satu usulannya.
        </p>
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
              style={{ backgroundColor: TEAL_DARK }}
            >
              {m.text}
            </div>
          </div>
        ) : (
          <div key={i} className="flex justify-start">
            <div
              className="max-w-[90%] rounded-2xl rounded-bl-md px-3.5 py-2.5"
              style={{ backgroundColor: CARD }}
            >
              <RichText text={m.text} onWordTap={onWordTap} />
            </div>
          </div>
        )
      )}
      {asking && <AnswerSkeleton />}
      {/* Chip "Lanjut tanya" pindah ke dok bawah bersama kolom ketik. */}
      <div ref={chatEndRef} />
    </div>
  );
}
