"use client";

// [watch-sentence-study-v1] Mode "Analisa Kalimat" — layar penuh (drawer kanan di
// desktop / bottom-sheet di mobile) yang dibuka dari tombol AI melayang. Sepupu
// WordStudy tapi subjeknya SATU KALIMAT utuh yang sedang tayang di video: arti
// keseluruhan, struktur/tata bahasa, nada, dan pecahan bermakna (kata/frasa + peran
// + artinya). Plus tab "Tanya AI" untuk pertanyaan lanjutan bebas tentang kalimat
// itu. Semua konten AI ditarik dari /api/word-deep (kind:"sentence") — sekali per buka.

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, MessageCircle, Quote, Send, Sparkles, Volume2, X } from "lucide-react";
import {
  askSentenceQuestion,
  FollowupQ,
  getSentenceBreakdown,
  getSentenceDeepDive,
  isRtl,
  POS_COLOR,
  POS_LABEL_ID,
  PosCategory,
  SentenceBreakdown,
  speakText,
  SentenceDeepDive,
} from "@/lib/immersionLearn";
import { getImmersionLang } from "@/lib/immersion";
import { RectFlag } from "@/components/RectFlag";
// Elemen render bersama dengan drawer kata (chat kaya, kartu section, tab, ikon).
import WordStudy, { AnswerSkeleton, IconBtn, RichText, Section, stripGuillemets, TabBtn, WordTapHandler } from "./WordStudy";
import ExplanationWordTip from "./ExplanationWordTip";
// [watch-followup-translit-v1] Bacaan Latin kata bahasa target yang dikutip di chip.
import { FollowupText, hasInlineReading, useFollowupReadings } from "./followupTranslit";

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
  const [wordTip, setWordTip] = useState<{
    word: string;
    x: number;
    y: number;
    anchor?: { top: number; bottom: number };
    id: number;
  } | null>(null);
  const [subWord, setSubWord] = useState<string | null>(null);
  // [watch-tip-anchor-v1] Kotak elemen kata diambil SEKARANG (bukan di render balon)
  // supaya balon menempel di tepi kata — di Pecahan Kalimat satu token setinggi
  // 2–3 baris, jadi balon di titik jari gampang menutupi katanya sendiri.
  const onExplainWordTap = useCallback<WordTapHandler>((w, e) => {
    const r = (e.currentTarget as HTMLElement | null)?.getBoundingClientRect();
    setWordTip({
      word: w,
      x: r ? r.left + r.width / 2 : e.clientX,
      y: e.clientY,
      anchor: r ? { top: r.top, bottom: r.bottom } : undefined,
      id: Date.now(),
    });
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

  // [watch-sentence-header-shrink-v1] Header (kalimat besar + bacaan Latin + arti)
  // makan seperempat layar mobile. Begitu isi digulir, header menciut jadi satu
  // baris ringkas — arti & transliterasinya balik lagi saat digulir ke atas.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  // Pindah tab = konten baru → balik ke atas, header mekar lagi.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setScrolled(false);
  }, [tab]);
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
  // [watch-followup-translit-v1] Bacaan Latin tiap kutipan bahasa target di chip yang
  // SEDANG tampil (mis. 要 → yào) — bahasa beraksara Latin tak memicu apa pun.
  const chipReadings = useFollowupReadings(
    dockChips.map((c) => stripGuillemets(c.q)),
    langCode
  );

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
          <p
            className={`font-extrabold text-white transition-all duration-200 ${
              scrolled ? "truncate text-[15px] leading-tight" : "text-[18px] leading-snug sm:text-[20px]"
            }`}
            dir="auto"
          >
            {sentence}
          </p>
          {/* Bacaan Latin + arti dilipat saat menggulir (bukan dilepas dari DOM,
              biar transisinya mulus dan tak bikin layout melompat). */}
          <div
            className={`overflow-hidden transition-all duration-200 ${
              scrolled ? "max-h-0 opacity-0" : "max-h-40 opacity-100"
            }`}
          >
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
      <div
        ref={scrollRef}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 24)}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
      >
        <div className="mx-auto max-w-2xl">
          {tab === "study" ? (
            <StudyTab
              loading={loading}
              errored={errored}
              deep={deep}
              bd={bd}
              bdLoading={bdLoading}
              langCode={langCode}
              headTranslation={headTranslation}
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
          {/* [watch-sentence-chip-row-v1] Chip usulan dulu membungkus jadi 3 baris dan
              memakan ~20% layar terus-menerus. Sekarang SATU baris yang bisa digeser
              mendatar; teks panjang dipotong secara tampilan saja — yang dikirim ke AI
              tetap pertanyaan utuh (`c.q`), dan versi penuhnya ada di tooltip. */}
          {!loading && dockChips.length > 0 && (
            <div className="mb-2">
              <p className="mb-1.5 text-[11px] font-semibold" style={{ color: SUB }}>
                {dockLabel}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {dockChips.map((c) => (
                  <button
                    key={c.q}
                    onClick={() => ask(stripGuillemets(c.q))}
                    title={stripGuillemets(c.q)}
                    className="flex max-w-[74vw] shrink-0 flex-col items-start rounded-2xl px-3 py-1.5 text-left transition-colors hover:bg-white/10 sm:max-w-[300px]"
                    style={{ backgroundColor: "rgba(26,158,158,0.16)", color: "#7FE0E0" }}
                  >
                    <span className="block max-w-full truncate text-[12.5px] font-semibold">
                      <FollowupText text={stripGuillemets(c.q)} readings={chipReadings} />
                    </span>
                    {/* `tl` dari AI cuma dipakai kalau bacaan per-kutipan belum ada
                        (bahasa Latin tak pernah punya keduanya) — biar tak dobel. */}
                    {c.tl && !hasInlineReading(stripGuillemets(c.q), chipReadings) && (
                      <span className="block max-w-full truncate text-[11px] italic opacity-80">
                        {stripGuillemets(c.tl)}
                      </span>
                    )}
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
        anchor={wordTip.anchor}
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
  // Bentuknya mengikuti susunan baru: baris nada → pecahan kalimat → arti → tata
  // bahasa (tertutup). Chip pertanyaan tak ada di sini — tempatnya di dok bawah.
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Menyiapkan analisa kalimat">
      <Skel w="62%" h={30} r={12} />
      <SkelSection lines={3} />
      <SkelSection lines={2} />
      <SkelSection lines={1} />
    </div>
  );
}

// Dua teks dianggap sama kalau isinya identik selain huruf besar/kecil, spasi, dan
// tanda baca — dipakai membuang terjemahan yang cuma mengulang isi header.
const normText = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
function sameText(a: string, b: string): boolean {
  return !!a && !!b && normText(a) === normText(b);
}

// [watch-sentence-tone-row-v1] Nada kalimat sebagai SATU baris (dulu kartu penuh
// dengan judul + padding demi satu kalimat pendek). Diketuk = teks utuh.
function ToneRow({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/[0.07]"
      style={{ backgroundColor: CARD }}
    >
      <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#7FE0E0" }} />
      <span className={`text-[12.5px] leading-snug text-white/75 ${open ? "" : "line-clamp-1"}`}>
        <span className="font-bold" style={{ color: "#7FE0E0" }}>Nada: </span>
        {text}
      </span>
    </button>
  );
}

// [watch-pos-legend-v1] Legenda warna kelas kata — pengganti label teks yang dulu
// dicetak di bawah TIAP kata. Hanya kelas yang muncul di kalimat ini, satu baris,
// dan bisa disembunyikan (pilihannya diingat) buat yang sudah hafal warnanya.
function PosLegend({ cats }: { cats: PosCategory[] }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("wl-pos-legend");
      if (v === "0") setOpen(false);
    } catch {
      /* penyimpanan diblokir → tampilkan saja */
    }
  }, []);
  if (!cats.length) return null;
  const toggle = () =>
    setOpen((o) => {
      const next = !o;
      try {
        window.localStorage.setItem("wl-pos-legend", next ? "1" : "0");
      } catch {
        /* abaikan */
      }
      return next;
    });
  return (
    <div className="mt-2.5 border-t pt-2" style={{ borderColor: BORDER }}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide"
        style={{ color: SUB }}
      >
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
        Warna = kelas kata
      </button>
      {open && (
        <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1">
          {cats.map((c) => (
            <span key={c} className="text-[10.5px] font-bold" style={{ color: POS_COLOR[c] }}>
              {POS_LABEL_ID[c]}
            </span>
          ))}
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
  bd,
  bdLoading,
  langCode,
  headTranslation,
  onWordTap,
}: {
  loading: boolean;
  errored: boolean;
  deep: SentenceDeepDive | null;
  // Breakdown per-kata (sumber sama dgn mode Analisa player); null = belum ada/gagal.
  bd: SentenceBreakdown | null;
  bdLoading: boolean;
  langCode: string;
  // Arti yang SUDAH tercetak emas di header — dipakai untuk membuang terjemahan
  // kontekstual yang isinya sama persis (dulu tampil dobel dengan gaya yang sama).
  headTranslation: string;
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

  // Terjemahan kontekstual sering identik dengan arti yang SUDAH tercetak emas di
  // header — kalau sama, jangan ditampilkan dua kali dengan gaya yang sama persis.
  const contextual = deep.contextual && !sameText(deep.contextual, headTranslation) ? deep.contextual : "";
  // Kelas kata yang benar-benar muncul di kalimat ini — jadi legenda warna, gantinya
  // label teks di bawah TIAP kata (dulu 11 kata = 11 label; sekarang 1 baris).
  const legendCats = (bd?.tokens ?? [])
    .map((t) => t.cat)
    .filter((c, i, a) => c !== "punctuation" && a.indexOf(c) === i);

  return (
    <div className="space-y-3">
      {/* Nada — dulu kartu penuh demi satu kalimat pendek; sekarang satu baris yang
          bisa diketuk untuk melihat teks utuhnya. */}
      {deep.tone && <ToneRow text={deep.tone} />}

      {/* Pecahan kalimat — naik ke ATAS karena paling cepat dicerna (dulu nomor 3,
          di bawah fold). Tampilan per-kata PERSIS mode Analisa di player: arti (emas
          redup) di atas kata, kata diwarnai kelas kata, bacaan Latin. Label kelas
          kata TIDAK lagi dicetak di tiap kata — warna + legenda + balon (yang sudah
          menampilkan badge kelas kata saat diketuk) sudah mewakili. */}
      {bd && bd.tokens.length > 0 ? (
        <Section title="Pecahan Kalimat">
          <div
            className="flex flex-wrap items-end gap-x-3 gap-y-2.5"
            dir={isRtl(langCode) ? "rtl" : undefined}
          >
            {bd.tokens.map((t, i) => (
              <span
                key={i}
                onClick={(e) => onWordTap(t.word, e)}
                title={POS_LABEL_ID[t.cat]}
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
              </span>
            ))}
          </div>
          <PosLegend cats={legendCats} />
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

      {/* [watch-sentence-meaning-merge-v1] Satu kartu "Arti" menggantikan dua tempat
          terpisah: gloss harfiah yang dulu nebeng di kartu tata bahasa + kartu
          "Terjemahan Kontekstual". Disandingkan begini, keduanya terbaca sebagai
          PERBANDINGAN (bunyi apa adanya vs bunyi kalau diucapkan sehari-hari) —
          bukan sebagai versi arti ketiga yang mengulang header. */}
      {(contextual || deep.literal) && (
        <Section title="Arti">
          {contextual && (
            <p className="text-[14.5px] font-bold leading-snug" style={{ color: GOLD }}>
              <span className="text-[12px] font-bold" style={{ color: "#7FE0E0" }}>Sehari-hari: </span>
              {contextual}
            </p>
          )}
          {deep.literal && (
            <p className={`text-[13px] leading-relaxed ${contextual ? "mt-1.5" : ""}`} style={{ color: SUB }}>
              <span className="font-bold" style={{ color: "#7FE0E0" }}>Harfiah: </span>
              {deep.literal}
            </p>
          )}
          {/* Alasan bedanya cuma relevan kalau versi sehari-harinya memang tampil. */}
          {contextual && deep.contextNote && (
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: SUB }}>
              <span className="font-bold" style={{ color: "#7FE0E0" }}>Kenapa begitu: </span>
              {deep.contextNote}
            </p>
          )}
        </Section>
      )}

      {/* Struktur & tata bahasa — isi terpanjang tapi paling jarang dibaca ulang,
          jadi TERTUTUP default (cuplikan 1 baris tetap kelihatan). Kartu "Arti
          Keseluruhan" tetap tak ada: artinya sudah tercetak emas di header. */}
      {deep.grammar && (
        <Section
          title="Struktur & Tata Bahasa"
          collapsible
          defaultOpen={false}
          storageKey="grammar"
          preview={deep.grammar}
        >
          <p className="text-[13.5px] leading-relaxed text-white/85">{deep.grammar}</p>
        </Section>
      )}

      {/* Idiom/ungkapan yang ada di kalimat ini — arti harfiah vs makna sebenarnya.
          Kosong kalau kalimatnya lurus (AI dilarang mengarang idiom). */}
      {deep.idioms.length > 0 && (
        <Section
          title={deep.idioms.length > 1 ? "Idiom & Ungkapan" : "Idiom"}
          collapsible
          defaultOpen={false}
          storageKey="idiom"
          preview={`${deep.idioms[0].phrase} — ${deep.idioms[0].meaning}`}
        >
          <div className="space-y-3">
            {deep.idioms.map((it, i) => (
              <div key={i} className={i > 0 ? "pt-3" : undefined} style={i > 0 ? { borderTop: `1px solid ${BORDER}` } : undefined}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <button
                    onClick={() => speakText(it.phrase, langCode)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[14px] font-extrabold transition-colors hover:bg-white/10"
                    style={{ color: "#7FE0E0", backgroundColor: "rgba(26,158,158,0.16)" }}
                    dir="auto"
                  >
                    <Quote className="h-3.5 w-3.5 shrink-0" />
                    {it.phrase}
                  </button>
                  {it.tl && (
                    <span className="text-[11.5px] italic" style={{ color: SUB }}>
                      {it.tl}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[13.5px] font-semibold leading-relaxed text-white/90">{it.meaning}</p>
                {it.literal && (
                  <p className="mt-0.5 text-[12.5px] leading-relaxed" style={{ color: SUB }}>
                    <span className="font-bold">Harfiah: </span>
                    {it.literal}
                  </p>
                )}
                {it.note && (
                  <p className="mt-0.5 text-[12.5px] leading-relaxed" style={{ color: SUB }}>
                    {it.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
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
