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
  Send,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import {
  askWordQuestion,
  canSaveWord,
  FollowupQ,
  getWordDeepDive,
  isWordSaved,
  removeSavedWord,
  savedWordCount,
  saveWord,
  speakText,
  WordConjugation,
  WordDeepDive,
  WordMeaning,
} from "@/lib/immersionLearn";
import { getImmersionLang } from "@/lib/immersion";
import { RectFlag } from "@/components/RectFlag";
import WatchUpsellModal from "./WatchUpsellModal";
import ExplanationWordTip from "./ExplanationWordTip";

const TEAL = "#1A9E9E";
// Teal lebih gelap khusus permukaan yang membawa teks putih (tab aktif, gelembung
// pesan pengguna, tombol kirim) — kontras #1A9E9E dengan putih terlalu tipis (~3:1,
// di bawah WCAG AA). Shade ini ~7:1 (AAA) sehingga font putih terbaca sangat jelas.
const TEAL_DARK = "#0A6060";
const GOLD = "#F4B740";
const BG = "#06090A";
// Permukaan kartu/chip/gelembung/input: fill putih transparan yang halus, TANPA
// garis tepi — tampilan modern "borderless" (elemen terpisah lewat fill, bukan outline).
const CARD = "rgba(255,255,255,0.05)";
// Baris tabel selang-seling (zebra) menggantikan garis pemisah antar-baris.
const ROW_ALT = "rgba(255,255,255,0.028)";
// BORDER hanya untuk rangka struktural drawer (tepi panel, garis pemisah header &
// footer input) — hairline lebar-penuh, bukan kotak ber-outline.
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

// Saat penjelasan berbahasa Inggris (baseCode="en"), model kadang mengembalikan
// nilai register versi Inggris ("neutral"/"polite"/…) alih-alih token Indonesia
// di prompt → samakan dulu supaya chip kesopanan tetap berwarna & berlabel benar.
const REGISTER_ALIAS: Record<string, string> = {
  neutral: "netral", polite: "sopan", informal: "casual", rude: "vulgar", crude: "vulgar",
};

function registerStyle(reg: string) {
  const key = REGISTER_ALIAS[reg] ?? reg;
  return REGISTER[key] ?? { label: reg || "—", color: SUB, bg: "rgba(255,255,255,0.06)" };
}

// Pertanyaan lanjutan siap-pakai — chip yang tinggal ketuk.
const SUGGESTED = [
  "Kapan kata ini dipakai?",
  "Apa bedanya dengan kata yang mirip?",
  "Beri contoh dalam situasi formal",
  "Beri contoh dalam situasi santai",
];

type ChatMsg = { role: "user" | "ai"; text: string; followups?: FollowupQ[] };

// [watch-followup-clean-v1] Model kadang membungkus istilah pakai «guillemets» di
// teks pertanyaan lanjutan — buang tanda kutipnya di chip biar bersih dibaca.
export const stripGuillemets = (s: string) => s.replace(/[«»]/g, "");

export default function WordStudy({
  word,
  sentence,
  langCode,
  baseCode,
  videoId,
  translit,
  meaning,
  onClose,
  onSavedChange,
}: {
  word: string;
  sentence: string;
  langCode: string;
  // Bahasa terjemahan/penjelasan pilihan pengguna (kode BASE_LANGS) — dipakai agar
  // materi & jawaban AI ditulis dalam bahasa itu (mis. belajar Indonesia dgn
  // terjemahan Inggris → penjelasan drawer bahasa Inggris), bukan selalu Indonesia.
  baseCode?: string;
  videoId?: string;
  translit?: string;
  meaning?: WordMeaning | null;
  onClose: () => void;
  onSavedChange?: () => void;
}) {
  const lang = getImmersionLang(langCode);
  const [tab, setTab] = useState<"study" | "ask">("study");
  const [saved, setSaved] = useState(false);
  // [watch-explain-word-tip-v1] Kata target yang di-tap di teks jawaban AI → balon
  // arti kecil. `subWord` = kata yang dipilih "Analisa" dari balon → buka WordStudy
  // baru di atasnya (rekursif; komponen ini me-render dirinya sendiri, bukan import
  // melingkar). id memastikan tap kata sama berulang tetap membuka balon lagi.
  const [wordTip, setWordTip] = useState<{ word: string; x: number; y: number; id: number } | null>(null);
  const [subWord, setSubWord] = useState<string | null>(null);
  const onExplainWordTap = useCallback<WordTapHandler>((w, e) => {
    setWordTip({ word: w, x: e.clientX, y: e.clientY, id: Date.now() });
  }, []);
  // Non-null → modal upsell (kuota simpan gratis habis); angka = jumlah kata tersimpan.
  const [upsellCount, setUpsellCount] = useState<number | null>(null);
  // Penyimpanan browser penuh/diblokir → pesan jujur di header, bukan gagal diam-diam.
  const [saveError, setSaveError] = useState(false);

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
    // Kata berganti (drawer dimuat ulang di tempat utk kata baru) → bersihkan konten
    // kata lama: deep-dive, riwayat Tanya AI, input, & balik ke tab Belajar. Tanpa
    // ini header kata baru bisa nyandingkan chat/analisa kata sebelumnya.
    setDeep(null);
    setChat([]);
    setInput("");
    setAsking(false);
    setTab("study");
    let cancelled = false;
    setLoading(true);
    setErrored(false);
    getWordDeepDive({ word, sentence, langCode, baseCode })
      .then((d) => !cancelled && setDeep(d))
      .catch(() => !cancelled && setErrored(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [word, sentence, langCode, baseCode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, asking]);

  // Animasi masuk/keluar drawer — geser dari kanan (desktop) / naik dari bawah
  // (mobile). `entered` di-flip setelah mount agar transisi transform berjalan;
  // `close` menyapu keluar dulu baru unmount (via onClose) supaya mulus.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const close = useCallback(() => {
    setEntered(false);
    window.setTimeout(onClose, 220);
  }, [onClose]);

  const toggleSave = useCallback(() => {
    if (saved) {
      removeSavedWord(word, langCode);
      setSaved(false);
    } else {
      // Gratis: mentok kuota → tawarkan langkah berikutnya, jangan diam-diam gagal.
      if (!canSaveWord(word, langCode)) {
        setUpsellCount(savedWordCount());
        return;
      }
      // Penyimpanan browser penuh → laporkan apa adanya, jangan tampil "Tersimpan"
      // padahal katanya tak masuk flashcard.
      const res = saveWord({
        word,
        meaning: meaning?.meaning ?? deep?.usage ?? "",
        langCode,
        example: sentence,
        videoId,
        ...(translit ? { translit } : {}),
      });
      if (!res.ok) {
        setSaveError(true);
        return;
      }
      setSaveError(false);
      setSaved(true);
    }
    onSavedChange?.();
  }, [saved, word, langCode, meaning, deep, translit, sentence, videoId, onSavedChange]);

  const ask = useCallback(
    (q: string) => {
      const question = q.trim();
      if (!question || asking) return;
      setInput("");
      setTab("ask");
      setChat((c) => [...c, { role: "user", text: question }]);
      setAsking(true);
      askWordQuestion({ word, sentence, langCode, baseCode, question })
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
    [asking, word, sentence, langCode, baseCode]
  );

  const reg = deep ? registerStyle(deep.register) : null;

  return (
    <>
    {/* Backdrop — klik utk tutup. Di desktop transparan (video tetap jelas terlihat,
        ala panel "Tanya AI" YouTube); di mobile diberi dim tipis untuk fokus. */}
    <div
      onClick={close}
      // Desktop: transparan + pointer-events-none → video tetap bisa di-play/pause &
      // di-scrub selagi drawer terbuka (ala YouTube), tutup via tombol X. Mobile:
      // dim tipis & tap-to-dismiss.
      className={`fixed inset-0 z-[96] bg-black/50 transition-opacity duration-200 lg:pointer-events-none lg:bg-transparent ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden
    />
    {/* Drawer — bottom-sheet di mobile, panel kanan di desktop. */}
    <div
      // Lebar desktop dikontrol player lewat CSS var --drawer-w (diseret via separator);
      // fallback 440px kalau var tak ada. Diklem max 92vw biar tak menutupi video penuh.
      className={`fixed z-[97] flex flex-col overflow-hidden shadow-2xl transition-transform duration-[220ms] ease-out inset-x-0 bottom-0 h-[86%] rounded-t-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[var(--drawer-w,440px)] lg:max-w-[92vw] lg:rounded-none ${
        entered ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-x-full lg:translate-y-0"
      }`}
      style={{ backgroundColor: BG, borderTop: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }}
    >
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
          {saveError && (
            <p className="mt-1.5 text-[12px] font-medium leading-snug" style={{ color: "#FCA5A5" }}>
              Gagal menyimpan — penyimpanan browser penuh. Bersihkan data situs lalu coba lagi.
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
              reg={reg}
              langCode={langCode}
              onAsk={ask}
            />
          ) : (
            <AskTab chat={chat} asking={asking} onAsk={ask} chatEndRef={chatEndRef} onWordTap={onExplainWordTap} />
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
      )}

    </div>

    {/* [watch-explain-word-tip-v1] Balon arti kata target yang di-tap di jawaban AI —
        di LUAR drawer supaya fixed-nya relatif viewport (drawer ber-transform). */}
    {wordTip && (
      <ExplanationWordTip
        key={wordTip.id}
        word={wordTip.word}
        sentence={sentence}
        langCode={langCode}
        baseCode={baseCode}
        videoId={videoId}
        x={wordTip.x}
        y={wordTip.y}
        onClose={() => setWordTip(null)}
        onAnalyze={(w) => {
          setWordTip(null);
          setSubWord(w);
        }}
        onSavedChange={onSavedChange}
      />
    )}

    {/* Analisa kata dari balon → WordStudy baru di atas (rekursi komponen ini). */}
    {subWord && (
      <WordStudy
        word={subWord}
        sentence={sentence}
        langCode={langCode}
        baseCode={baseCode}
        videoId={videoId}
        onClose={() => setSubWord(null)}
        onSavedChange={onSavedChange}
      />
    )}

    {/* Modal upsell dirender DI LUAR drawer: drawer punya `transform` (animasi geser)
        yang menjadikannya containing-block untuk elemen fixed → kalau di dalam, modal
        ter-clip / salah posisi. Di luar, ia fixed relatif viewport (benar). */}
    {upsellCount !== null && (
      <WatchUpsellModal savedCount={upsellCount} onClose={() => setUpsellCount(null)} />
    )}
    </>
  );
}

// ── Skeleton loading ─────────────────────────────────────────────────────────
// Placeholder abu-abu dengan sapuan shimmer (kelas .wl-skeleton di globals.css).
function Skel({ w, h = 11, r = 6, className = "" }: { w: number | string; h?: number; r?: number; className?: string }) {
  return <div className={`wl-skeleton ${className}`} style={{ width: w, height: h, borderRadius: r }} />;
}

// Satu kartu section palsu: judul + (opsional) chip + beberapa baris teks.
function SkelSection({ lines = 3, chip = false }: { lines?: number; chip?: boolean }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: CARD }}>
      <Skel w={96} h={10} className="mb-3" />
      {chip && <Skel w={76} h={22} r={9999} className="mb-2.5" />}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skel key={i} w={i === lines - 1 ? "68%" : "100%"} />
        ))}
      </div>
    </div>
  );
}

// Kerangka tab Pelajari saat materi masih dimuat — meniru tata letak section asli
// (kesopanan, penggunaan, contoh) + baris chip pertanyaan.
function StudySkeleton() {
  return (
    <div className="space-y-3.5" aria-busy="true" aria-label="Menyiapkan materi belajar">
      <SkelSection lines={2} chip />
      <SkelSection lines={3} />
      <SkelSection lines={2} />
      <div className="pt-1">
        <Skel w={132} h={10} className="mb-2.5" />
        <div className="flex flex-wrap gap-2">
          {[112, 150, 96, 128].map((w, i) => (
            <Skel key={i} w={w} h={30} r={9999} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Gelembung jawaban palsu saat AI sedang menjawab (Tanya AI / pertanyaan lanjutan).
export function AnswerSkeleton() {
  return (
    <div className="flex justify-start" aria-busy="true" aria-label="Menjawab">
      <div
        className="w-[90%] space-y-2 rounded-2xl rounded-bl-md px-3.5 py-3"
        style={{ backgroundColor: CARD }}
      >
        <Skel w="95%" />
        <Skel w="100%" />
        <Skel w="88%" />
        <Skel w="60%" />
      </div>
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
  // Pertanyaan lanjutan yang diketik langsung dari tab Pelajari.
  const [ownQ, setOwnQ] = useState("");

  // Chip "Apa itu <istilah> dalam bahasa <X>?" untuk tiap istilah tata bahasa baru
  // yang disebut di penjelasan (mis. "vokatif" pada kata Georgia).
  const langName = getImmersionLang(langCode)?.name ?? "";
  const termQuestions = (deep?.terms ?? []).map((t) =>
    langName ? `Apa itu ${t} dalam bahasa ${langName}?` : `Apa itu ${t}?`
  );

  if (loading) {
    return <StudySkeleton />;
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

      {/* Konjugasi (kata kerja) — bagian yang berubah diberi warna */}
      {deep.conjugation && deep.conjugation.rows.length > 0 && (
        <Section title={deep.conjugation.caption ? `Konjugasi — ${deep.conjugation.caption}` : "Konjugasi"}>
          {deep.conjugation.note && (
            <p className="mb-2.5 text-[13px] leading-relaxed text-white/75">{deep.conjugation.note}</p>
          )}
          <ConjugationTable conj={deep.conjugation} langCode={langCode} />
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
                  style={{ color: "#7FE0E0", backgroundColor: CARD }}
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

      {/* Ajakan bertanya — chip istilah tata bahasa baru muncul lebih dulu, mis.
          "Apa itu vokatif dalam bahasa Georgia?" dari deep.terms. */}
      <div className="pt-1">
        <p className="mb-2 text-[12px] font-semibold" style={{ color: SUB }}>
          Masih penasaran? Tanya AI:
        </p>
        <div className="flex flex-wrap gap-2">
          {termQuestions.map((q) => (
            <button
              key={q}
              onClick={() => onAsk(q)}
              className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:bg-white/10"
              style={{ backgroundColor: "rgba(26,158,158,0.16)", color: "#7FE0E0" }}
            >
              {q}
            </button>
          ))}
          {SUGGESTED.map((q) => (
            <button
              key={q}
              onClick={() => onAsk(q)}
              className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-white/85 transition-colors hover:bg-white/10"
              style={{ backgroundColor: CARD }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Ketik pertanyaan sendiri */}
        <div className="mt-3 flex items-center gap-2">
          <input
            value={ownQ}
            onChange={(e) => setOwnQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && ownQ.trim()) {
                onAsk(ownQ);
                setOwnQ("");
              }
            }}
            placeholder="Atau tulis pertanyaanmu sendiri…"
            className="flex-1 rounded-full px-4 py-2.5 text-[13.5px] text-white outline-none placeholder:text-white/35"
            style={{ backgroundColor: CARD }}
          />
          <button
            onClick={() => {
              if (ownQ.trim()) {
                onAsk(ownQ);
                setOwnQ("");
              }
            }}
            disabled={!ownQ.trim()}
            aria-label="Kirim pertanyaan"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: TEAL_DARK }}
          >
            <Send className="h-[18px] w-[18px] text-white" />
          </button>
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
  onWordTap,
}: {
  chat: ChatMsg[];
  asking: boolean;
  onAsk: (q: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onWordTap?: WordTapHandler;
}) {
  if (chat.length === 0 && !asking) {
    return (
      <div className="py-6">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: CARD }}
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
              style={{ backgroundColor: CARD }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Usulan lanjutan diambil dari pesan AI terakhir (tiap jawaban bawa usulan baru).
  const lastMsg = chat[chat.length - 1];
  const lastFollowups = lastMsg?.role === "ai" ? lastMsg.followups ?? [] : [];

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

      {/* Usulan lanjutan yang nyambung dengan jawaban terakhir */}
      {!asking && lastFollowups.length > 0 && (
        <div className="pt-1">
          <p className="mb-2 text-[12px] font-semibold" style={{ color: SUB }}>
            Lanjut tanya:
          </p>
          <div className="flex flex-wrap gap-2">
            {lastFollowups.map((f) => (
              <button
                key={f.q}
                onClick={() => onAsk(stripGuillemets(f.q))}
                className="flex flex-col items-start rounded-2xl px-3 py-1.5 text-left text-white/85 transition-colors hover:bg-white/10"
                style={{ backgroundColor: CARD }}
              >
                <span className="text-[12.5px] font-semibold">{stripGuillemets(f.q)}</span>
                {f.tl && (
                  <span className="text-[11px] italic" style={{ color: "#7FE0E0" }}>
                    {stripGuillemets(f.tl)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
}

// Render jawaban AI: paragraf biasa + tabel markdown (pipe table) untuk konten
// yang tabular (mis. daftar tenses, perbandingan bentuk). Kata dalam «guillemets»
// disorot teal — sama seperti panel analisa grammar di tooltip — baik di paragraf
// maupun di dalam sel tabel.
type RichBlock =
  | { type: "p"; text: string }
  | { type: "table"; header: string[]; rows: string[][] };

// Baris pemisah header tabel markdown: |---|:--:|--- dsb.
const isTableSep = (line: string) =>
  /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

// Pecah satu baris pipe "| a | b |" jadi sel-selnya (buang pipe tepi).
function splitTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

// Model kadang menulis tabel INLINE tanpa baris baru — seluruh "| a | b | |---|---|
// | 1 | 2 |" jadi satu paragraf. Susun ulang jadi markdown multibaris supaya
// parseRichBlocks bisa mengenalinya. Memakai baris pemisah (sel berisi dashes) sebagai
// jangkar: jumlah kolom N = jumlah sel pemisah; N sel tepat sebelum pemisah = header;
// sel setelahnya dikelompokkan per N = baris data; sisa tak-genap di ujung = prosa.
const INLINE_SEP_RE = /\|(?:\s*:?-{2,}:?\s*\|)+/;

function reflowInlineTables(text: string): string {
  const m = INLINE_SEP_RE.exec(text);
  if (!m) return text;
  const sep = m[0];
  const n = (sep.match(/-{2,}/g) || []).length;
  if (n < 1) return text;

  const before = text.slice(0, m.index);
  const after = text.slice(m.index + sep.length);

  // Header: N sel non-kosong terakhir sebelum pemisah; sisanya = prosa pembuka.
  const bc = before.split("|").map((c) => c.trim());
  while (bc.length && bc[bc.length - 1] === "") bc.pop();
  const header = bc.slice(Math.max(0, bc.length - n));
  const lead = bc.slice(0, Math.max(0, bc.length - n)).join(" ").trim();

  // Sel data: buang boundary kosong (antar-baris jadi "| |"), lalu kelompokkan per N.
  // Token sisa di ujung (jumlah tak habis dibagi N) = prosa penutup.
  const cells = after.split("|").map((c) => c.trim()).filter((c) => c !== "");
  const rowCount = Math.floor(cells.length / n);
  const dataCells = cells.slice(0, rowCount * n);
  const trail = cells.slice(rowCount * n).join(" ").trim();

  const lines: string[] = [];
  if (lead) lines.push(lead);
  lines.push(`| ${header.join(" | ")} |`);
  lines.push(`|${Array(n).fill("---").join("|")}|`);
  for (let i = 0; i < dataCells.length; i += n) {
    lines.push(`| ${dataCells.slice(i, i + n).join(" | ")} |`);
  }
  // Kalau prosa penutup masih memuat tabel inline lain, susun ulang juga.
  if (trail) lines.push(INLINE_SEP_RE.test(trail) ? reflowInlineTables(trail) : trail);
  return lines.join("\n");
}

function parseRichBlocks(text: string): RichBlock[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: RichBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Awal tabel: baris pipe diikuti baris pemisah dashes.
    if (line.startsWith("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitTableRow(line);
      const rows: string[][] = [];
      i += 2; // lewati header + pemisah
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i].trim()));
        i++;
      }
      i--; // kompensasi i++ dari for-loop
      blocks.push({ type: "table", header, rows });
      continue;
    }
    blocks.push({ type: "p", text: line });
  }
  return blocks;
}

// [watch-explain-word-tip-v1] `onWordTap` opsional: kalau diberi, tiap kata target
// dalam «guillemets» jadi tombol yang bisa diketuk → host memunculkan balon arti
// (Simpan · Analisa · TTS). Kalau tidak, kata cuma disorot teal seperti biasa.
export type WordTapHandler = (word: string, e: React.MouseEvent) => void;

export function RichText({ text, onWordTap }: { text: string; onWordTap?: WordTapHandler }) {
  let blocks = parseRichBlocks(text);
  // Fallback: tabel ditulis inline (tanpa baris baru) → susun ulang lalu parse lagi.
  if (!blocks.some((b) => b.type === "table") && INLINE_SEP_RE.test(text)) {
    blocks = parseRichBlocks(reflowInlineTables(text));
  }
  return (
    <div className="space-y-2.5 text-[13.5px] leading-relaxed text-white/85">
      {blocks.map((b, i) =>
        b.type === "table" ? (
          <RichTable key={i} header={b.header} rows={b.rows} onWordTap={onWordTap} />
        ) : (
          <p key={i}>
            <RichInline text={b.text} onWordTap={onWordTap} />
          </p>
        )
      )}
    </div>
  );
}

// Sorot «kata» (teal) dan **tebal** (markdown) dalam sepotong teks inline.
function RichInline({ text, onWordTap }: { text: string; onWordTap?: WordTapHandler }) {
  const parts = text.split(/(«[^»]*»(?:\s*\([^)]*\))?|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("«")) {
          // Pisahkan kata target (dalam «») dari gloss dalam kurung — hanya kata
          // target yang bisa diketuk; gloss ikut teal tapi tak interaktif.
          const m = p.match(/^«([^»]*)»(\s*\([^)]*\))?/);
          const inner = (m?.[1] ?? p.replace(/[«»]/g, "")).trim();
          // Arti dalam kurung: model kadang keliru membungkusnya juga dgn
          // «guillemets» → buang, biar tak ada tanda kutip mentah tampil. Arti
          // dibiarkan warna normal (bukan teal) — hanya kata target yang disorot.
          const paren = (m?.[2] ?? "").replace(/[«»]/g, "");
          if (onWordTap && inner) {
            return (
              <span key={i}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWordTap(inner, e);
                  }}
                  className="font-bold underline decoration-dotted underline-offset-2 transition-colors hover:text-white"
                  style={{ color: "#7FE0E0" }}
                  dir="auto"
                >
                  {inner}
                </button>
                {paren && <span className="text-white/85">{paren}</span>}
              </span>
            );
          }
          return (
            <span key={i} className="font-bold" style={{ color: "#7FE0E0" }}>
              {p.replace(/[«»]/g, "")}
            </span>
          );
        }
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
          return (
            <strong key={i} className="font-bold text-white">
              {p.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// Tabel markdown dari jawaban AI — gaya samakan dengan ConjugationTable.
function RichTable({ header, rows, onWordTap }: { header: string[]; rows: string[][]; onWordTap?: WordTapHandler }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr style={{ color: SUB }}>
            {header.map((h, i) => (
              <th
                key={i}
                className="px-2 py-1.5 text-[10.5px] font-bold uppercase tracking-wide"
              >
                <RichInline text={h} onWordTap={onWordTap} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ backgroundColor: ri % 2 === 1 ? ROW_ALT : "transparent" }}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className="px-2 py-2 align-top text-[12.5px] text-white/80"
                >
                  <RichInline text={c} onWordTap={onWordTap} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Rapikan spasi antar-segmen: kadang model menempelkan kata subjek ke kata kerja
// (mis. "I" + "tethered" → "Itethered"). Afiks yang berubah selalu ditandai
// `c:true`, jadi dua segmen INVARIAN (c:false) berturut-turut yang bertemu di
// batas huruf pasti dua kata terpisah → sisipkan spasi. Stem+akhiran tak pernah
// kena aturan ini karena akhirannya c:true.
function spaceConjParts(parts: { t: string; c: boolean }[]): { t: string; c: boolean }[] {
  const endsWithLetter = (s: string) => /\p{L}$/u.test(s);
  const startsWithLetter = (s: string) => /^\p{L}/u.test(s);
  return parts.map((p, j) => {
    if (j === 0) return p;
    const prev = parts[j - 1];
    const glued =
      prev.c === false &&
      p.c === false &&
      endsWithLetter(prev.t) &&
      startsWithLetter(p.t);
    return glued ? { ...p, t: " " + p.t } : p;
  });
}

// Tabel konjugasi kata kerja. Kolom: Bentuk (subjek) · Kata (target) · Suffix · Arti.
// Bagian yang berubah antar-baris (part.c) diwarnai emas di dalam kata utuh, dan
// kolom Suffix menyorotnya lagi biar pola perubahannya kelihatan sekilas.
function ConjugationTable({ conj, langCode }: { conj: WordConjugation; langCode: string }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr style={{ color: SUB }}>
            <th className="px-1.5 py-1 text-[10.5px] font-bold uppercase tracking-wide">Bentuk</th>
            <th className="px-1.5 py-1 text-[10.5px] font-bold uppercase tracking-wide">Kata</th>
            <th className="px-1.5 py-1 text-[10.5px] font-bold uppercase tracking-wide">Suffix</th>
            <th className="px-1.5 py-1 text-[10.5px] font-bold uppercase tracking-wide">Arti</th>
          </tr>
        </thead>
        <tbody>
          {conj.rows.map((r, i) => {
            const parts = spaceConjParts(r.parts);
            const full = parts.map((p) => p.t).join("");
            return (
              <tr key={i} style={{ backgroundColor: i % 2 === 1 ? ROW_ALT : "transparent" }}>
                <td className="px-1.5 py-2 align-top text-[12.5px] font-semibold text-white/75 whitespace-nowrap">
                  {r.label}
                </td>
                <td className="px-1.5 py-2 align-top">
                  <button
                    onClick={() => speakText(full, langCode)}
                    className="inline-flex items-center gap-1 text-left"
                    aria-label="Dengar"
                  >
                    <span className="text-[14.5px] font-bold leading-snug" dir="auto">
                      {parts.map((p, j) => (
                        <span key={j} style={p.c ? { color: GOLD } : { color: "#fff" }} className="whitespace-pre">
                          {p.t}
                        </span>
                      ))}
                    </span>
                    <Volume2 className="h-3.5 w-3.5 shrink-0 opacity-50" style={{ color: TEAL }} />
                  </button>
                  {r.tl && (
                    <p className="text-[11px] italic" style={{ color: "#7FE0E0" }} dir="ltr">
                      {r.tl}
                    </p>
                  )}
                </td>
                <td className="px-1.5 py-2 align-top text-[13px] font-bold whitespace-nowrap" style={{ color: GOLD }} dir="auto">
                  {r.suffix || "—"}
                </td>
                <td className="px-1.5 py-2 align-top text-[12.5px] leading-snug text-white/80">
                  {r.gloss}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: CARD }}>
      <p className="mb-1.5 text-[11.5px] font-bold uppercase tracking-wide" style={{ color: SUB }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export function TabBtn({
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
        backgroundColor: active ? TEAL_DARK : CARD,
        color: active ? "#fff" : "rgba(255,255,255,0.7)",
      }}
    >
      {children}
    </button>
  );
}

export function IconBtn({
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
        color: active ? "#7FE0E0" : "#fff",
        backgroundColor: active ? "rgba(26,158,158,0.15)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}
