"use client";

// Tab "Deck" di flashcard Watch & Learn — perpustakaan deck kosakata:
//   • Generate AI  → siswa ketik/pilih TEMA (mis. "makanan & restoran"), AI
//                    membuatkan deck (kata + arti Indonesia + contoh + translit
//                    utk non-Latin), preview dulu, baru disimpan.
//   • Dari Video   → susun deck dari kata yang DISIMPAN saat menonton (centang
//                    kata yang mau dimasukkan).
//   • Buat Manual  → isi kartu sendiri (kata / arti / contoh).
// Deck bisa dibagikan ke KOMUNITAS (toggle publik) — deck publik orang lain
// muncul di bagian "Deck Komunitas" lengkap dengan nama kontributornya, bisa
// langsung dipelajari atau diimpor ke "Kosakata Saya" (masuk review SRS harian).

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  Globe2,
  Layers,
  Loader2,
  Lock,
  PencilLine,
  Play,
  Plus,
  Sparkles,
  Trash2,
  User,
  Video,
  Volume2,
  X,
} from "lucide-react";
import {
  buildDeckOrder,
  createDeck,
  deckDueCount,
  deleteDeck,
  fetchDeckCards,
  generateAiDeck,
  getDeckSrs,
  getDeckUser,
  gradeDeckCard,
  importCardsToVocab,
  listCommunityDecks,
  listMyDecks,
  setDeckPublic,
  type Deck,
  type DeckCard,
  type GeneratedDeck,
} from "@/lib/decks";
import { getSavedWords, speakText, type SavedWord } from "@/lib/immersionLearn";
import { gradePreviewLabel, newSrsState, type SrsGrade, type SrsState } from "@/lib/srs";
import { getImmersionLang } from "@/lib/immersion";

const TEAL = "#1A9E9E";
const TEAL_DARK = "#127d7d";
const GOLD = "#F4B740";
const RED = "#FF6B6B";
const ORANGE = "#E8973D";
const GREEN = "#16A34A";
const PURPLE = "#7C6BE0";
const CARD = "#161A1C";
const SURFACE_ALT = "#10161A";
const BORDER = "rgba(255,255,255,0.08)";
const SUB = "rgba(255,255,255,0.5)";

// Empat respons review ala Anki (sama dengan tab "Belajar" Kosakata Saya).
const GRADES: { grade: SrsGrade; label: string; color: string }[] = [
  { grade: "again", label: "Lagi", color: RED },
  { grade: "hard", label: "Sulit", color: ORANGE },
  { grade: "good", label: "Bagus", color: TEAL },
  { grade: "easy", label: "Mudah", color: GREEN },
];

// Tema siap pakai — chip di form Generate AI biar siswa tak mulai dari kosong.
const THEME_SUGGESTIONS = [
  "Perkenalan diri",
  "Makanan & restoran",
  "Perjalanan & bandara",
  "Belanja & tawar-menawar",
  "Pekerjaan & kantor",
  "Keluarga & teman",
  "Angka & waktu",
  "Cuaca & musim",
  "Kesehatan & dokter",
  "Percakapan sehari-hari",
];

const LEVELS = ["Semua", "A1", "A2", "B1", "B2", "C1"];
const COUNTS = [8, 12, 16, 20];

// Ikon + label asal deck (badge di kartu deck).
const SOURCE_META: Record<Deck["source"], { label: string; icon: React.ReactNode; color: string }> = {
  ai: { label: "AI", icon: <Sparkles className="h-3 w-3" />, color: PURPLE },
  video: { label: "Video", icon: <Video className="h-3 w-3" />, color: GOLD },
  custom: { label: "Manual", icon: <PencilLine className="h-3 w-3" />, color: TEAL },
};

type Mode = "home" | "create-ai" | "create-video" | "create-manual";

export default function DeckLibrary({
  lang,
  onVocabChange,
}: {
  lang: string;
  onVocabChange?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("home");
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [myDecks, setMyDecks] = useState<Deck[]>([]);
  const [community, setCommunity] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  // Deck yang sedang dipelajari (overlay sesi belajar).
  const [studying, setStudying] = useState<Deck | null>(null);
  // Bahasa deck mengikuti pemilih bahasa tunggal di pojok kanan atas (prop `lang`)
  // — tak ada selector terpisah di dalam tab Deck.
  const langCode = lang;

  const langName = getImmersionLang(langCode)?.name ?? langCode;

  const reload = useCallback(async () => {
    setLoading(true);
    const user = await getDeckUser();
    setLoggedIn(!!user);
    if (!user) {
      setMyDecks([]);
      setCommunity([]);
      setLoading(false);
      return;
    }
    const [mine, pub] = await Promise.all([listMyDecks(langCode), listCommunityDecks(langCode)]);
    setMyDecks(mine);
    setCommunity(pub);
    setLoading(false);
  }, [langCode]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onCreated = useCallback(
    (deck: Deck | null) => {
      if (deck) {
        setMode("home");
        void reload();
      }
    },
    [reload]
  );

  const togglePublic = useCallback(async (deck: Deck) => {
    const ok = await setDeckPublic(deck.id, !deck.isPublic);
    if (ok) {
      setMyDecks((ds) => ds.map((d) => (d.id === deck.id ? { ...d, isPublic: !deck.isPublic } : d)));
    }
  }, []);

  const removeDeck = useCallback(async (deck: Deck) => {
    if (!window.confirm(`Hapus deck "${deck.title}"?`)) return;
    const ok = await deleteDeck(deck.id);
    if (ok) setMyDecks((ds) => ds.filter((d) => d.id !== deck.id));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: TEAL }} />
      </div>
    );
  }

  if (loggedIn === false) {
    return (
      <p className="py-10 text-center text-[13px]" style={{ color: SUB }}>
        Masuk dulu untuk membuat & membagikan deck.
      </p>
    );
  }

  if (mode === "create-ai") {
    return <CreateAiForm lang={langCode} langName={langName} onBack={() => setMode("home")} onCreated={onCreated} />;
  }
  if (mode === "create-video") {
    return <CreateVideoForm lang={langCode} onBack={() => setMode("home")} onCreated={onCreated} />;
  }
  if (mode === "create-manual") {
    return <CreateManualForm lang={langCode} onBack={() => setMode("home")} onCreated={onCreated} />;
  }

  return (
    <div className="space-y-6">
      {/* Pilihan buat deck baru */}
      <div className="grid gap-2.5 sm:grid-cols-3">
        <CreateTile
          icon={<Sparkles className="h-5 w-5" color="#fff" />}
          bg={`linear-gradient(135deg,${PURPLE},#5A4BC7)`}
          title="Generate AI"
          desc="Deck tematik dibuatkan AI"
          onClick={() => setMode("create-ai")}
        />
        <CreateTile
          icon={<Video className="h-5 w-5" color="#fff" />}
          bg={`linear-gradient(135deg,${GOLD},#D89A22)`}
          title="Dari Video"
          desc="Dari kata yang kamu simpan"
          onClick={() => setMode("create-video")}
        />
        <CreateTile
          icon={<PencilLine className="h-5 w-5" color="#fff" />}
          bg={`linear-gradient(135deg,${TEAL},${TEAL_DARK})`}
          title="Buat Manual"
          desc="Susun kartu sendiri"
          onClick={() => setMode("create-manual")}
        />
      </div>

      {/* Deck Saya */}
      <section>
        <p className="mb-3 text-[14px] font-bold text-white">Deck Saya ({myDecks.length})</p>
        {myDecks.length === 0 ? (
          <p className="rounded-2xl px-4 py-6 text-center text-[13px]" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: SUB }}>
            Belum ada deck {langName}. Buat lewat salah satu tombol di atas.
          </p>
        ) : (
          <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0 xl:grid-cols-3">
            {myDecks.map((d) => (
              <DeckRow
                key={d.id}
                deck={d}
                mine
                onStudy={() => setStudying(d)}
                onTogglePublic={() => void togglePublic(d)}
                onDelete={() => void removeDeck(d)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Deck Komunitas */}
      <section>
        <p className="mb-1 text-[14px] font-bold text-white">Deck Komunitas</p>
        <p className="mb-3 text-[12px]" style={{ color: SUB }}>
          Deck {langName} yang dibagikan siswa lain — nama kontributor tercantum di tiap deck.
        </p>
        {community.length === 0 ? (
          <p className="rounded-2xl px-4 py-6 text-center text-[13px]" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: SUB }}>
            Belum ada deck komunitas untuk bahasa ini. Jadilah kontributor pertama — aktifkan{" "}
            <Globe2 className="inline h-3.5 w-3.5" style={{ color: TEAL }} /> di deck-mu!
          </p>
        ) : (
          <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0 xl:grid-cols-3">
            {community.map((d) => (
              <DeckRow key={d.id} deck={d} onStudy={() => setStudying(d)} />
            ))}
          </div>
        )}
      </section>

      {/* Overlay sesi belajar deck */}
      {studying && (
        <StudyOverlay
          deck={studying}
          lang={langCode}
          onClose={() => setStudying(null)}
          onVocabChange={onVocabChange}
        />
      )}
    </div>
  );
}

// ── Kartu deck (Deck Saya / Komunitas) ────────────────────────────────────────
function DeckRow({
  deck,
  mine,
  onStudy,
  onTogglePublic,
  onDelete,
}: {
  deck: Deck;
  mine?: boolean;
  onStudy: () => void;
  onTogglePublic?: () => void;
  onDelete?: () => void;
}) {
  const src = SOURCE_META[deck.source];
  // Jumlah kartu yang jatuh tempo (SRS) — tampil sebagai lencana ajakan review.
  const due = deckDueCount(deck.id, deck.cardCount);
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-white">{deck.title}</p>
          <p className="mt-0.5 text-[12px]" style={{ color: SUB }}>
            {deck.cardCount} kartu
            {due > 0 && (
              <>
                {" · "}
                <span style={{ color: "#7FE0E0" }}>{due} jatuh tempo</span>
              </>
            )}
            {mine ? null : (
              <>
                {" · "}
                <User className="inline h-3 w-3" /> {deck.ownerName}
              </>
            )}
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
          style={{ backgroundColor: `${src.color}22`, color: src.color }}
        >
          {src.icon}
          {src.label}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onStudy}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: TEAL }}
        >
          <Play className="h-3.5 w-3.5" /> {due > 0 ? "Review" : "Pelajari"}
        </button>
        {mine && onTogglePublic && (
          <button
            onClick={onTogglePublic}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-colors hover:bg-white/10"
            style={{
              border: `1px solid ${deck.isPublic ? TEAL : BORDER}`,
              color: deck.isPublic ? "#7FE0E0" : SUB,
            }}
            title={deck.isPublic ? "Dibagikan ke komunitas — klik untuk jadikan privat" : "Privat — klik untuk bagikan ke komunitas"}
          >
            {deck.isPublic ? <Globe2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {deck.isPublic ? "Publik" : "Privat"}
          </button>
        )}
        {mine && onDelete && (
          <button
            onClick={onDelete}
            className="rounded-xl p-2 transition-colors hover:bg-white/10"
            aria-label="Hapus deck"
          >
            <Trash2 className="h-4 w-4" style={{ color: RED }} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Tile "buat deck baru" ─────────────────────────────────────────────────────
function CreateTile({
  icon,
  bg,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl p-4 text-left transition-opacity hover:opacity-90"
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: bg }}>
        {icon}
      </span>
      <span>
        <span className="block text-[14px] font-bold text-white">{title}</span>
        <span className="block text-[12px]" style={{ color: SUB }}>
          {desc}
        </span>
      </span>
    </button>
  );
}

// ── Bagian bersama form ───────────────────────────────────────────────────────
function FormShell({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-bold transition-colors hover:text-white"
        style={{ color: SUB }}
      >
        <ChevronLeft className="h-4 w-4" /> Kembali
      </button>
      <p className="text-[18px] font-extrabold text-white">{title}</p>
      <p className="mt-1 text-[13px]" style={{ color: SUB }}>
        {subtitle}
      </p>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl px-3.5 py-2.5 text-[14px] text-white outline-none placeholder:text-white/30 focus:ring-1";
const inputStyle = { backgroundColor: SURFACE_ALT, border: `1px solid ${BORDER}` } as const;

function PublicToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white/5"
      style={{ backgroundColor: CARD, border: `1px solid ${value ? TEAL : BORDER}` }}
    >
      {value ? (
        <Globe2 className="h-5 w-5 shrink-0" style={{ color: TEAL }} />
      ) : (
        <Lock className="h-5 w-5 shrink-0" style={{ color: SUB }} />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-white">
          {value ? "Dibagikan ke komunitas" : "Privat"}
        </span>
        <span className="block text-[12px]" style={{ color: SUB }}>
          {value
            ? "Siswa lain bisa melihat & mempelajari deck ini — namamu tampil sebagai kontributor."
            : "Hanya kamu yang bisa melihat deck ini."}
        </span>
      </span>
      <span
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{ backgroundColor: value ? TEAL : "rgba(255,255,255,0.15)" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
          style={{ left: value ? 22 : 2 }}
        />
      </span>
    </button>
  );
}

function SaveButton({
  disabled,
  saving,
  onClick,
  children,
}: {
  disabled?: boolean;
  saving?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || saving}
      className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      style={{ backgroundColor: TEAL }}
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ── Form: Generate AI ─────────────────────────────────────────────────────────
function CreateAiForm({
  lang,
  langName,
  onBack,
  onCreated,
}: {
  lang: string;
  langName: string;
  onBack: () => void;
  onCreated: (deck: Deck | null) => void;
}) {
  const [theme, setTheme] = useState("");
  const [level, setLevel] = useState("Semua");
  const [count, setCount] = useState(12);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<GeneratedDeck | null>(null);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = useCallback(async () => {
    if (!theme.trim() || generating) return;
    setGenerating(true);
    setError("");
    setPreview(null);
    try {
      const deck = await generateAiDeck({
        theme: theme.trim(),
        langCode: lang,
        level: level === "Semua" ? undefined : level,
        count,
      });
      setPreview(deck);
      setTitle(deck.title);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat deck.");
    } finally {
      setGenerating(false);
    }
  }, [theme, level, count, lang, generating]);

  const save = useCallback(async () => {
    if (!preview || saving) return;
    setSaving(true);
    const deck = await createDeck({
      langCode: lang,
      title: title.trim() || preview.title,
      theme: theme.trim(),
      source: "ai",
      isPublic,
      cards: preview.cards,
    });
    setSaving(false);
    if (!deck) {
      setError("Gagal menyimpan deck. Coba lagi.");
      return;
    }
    onCreated(deck);
  }, [preview, saving, lang, title, theme, isPublic, onCreated]);

  return (
    <FormShell
      title="Generate deck by AI"
      subtitle={`Pilih atau ketik tema — AI membuatkan deck kosakata ${langName} lengkap dengan arti & contoh kalimat.`}
      onBack={onBack}
    >
      <div>
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: SUB }}>
          Tema
        </p>
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder='Mis. "makanan & restoran", "wawancara kerja"…'
          className={inputCls}
          style={inputStyle}
        />
        <div className="mt-2.5 flex flex-wrap gap-2">
          {THEME_SUGGESTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors hover:bg-white/10"
              style={{
                backgroundColor: theme === t ? TEAL : CARD,
                border: `1px solid ${theme === t ? TEAL : BORDER}`,
                color: theme === t ? "#fff" : "rgba(255,255,255,0.75)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: SUB }}>
            Level
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="rounded-full px-2.5 py-1 text-[12px] font-bold transition-colors"
                style={{
                  backgroundColor: level === l ? TEAL : CARD,
                  border: `1px solid ${level === l ? TEAL : BORDER}`,
                  color: level === l ? "#fff" : SUB,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: SUB }}>
            Jumlah kartu
          </p>
          <div className="flex flex-wrap gap-1.5">
            {COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className="rounded-full px-2.5 py-1 text-[12px] font-bold transition-colors"
                style={{
                  backgroundColor: count === c ? TEAL : CARD,
                  border: `1px solid ${count === c ? TEAL : BORDER}`,
                  color: count === c ? "#fff" : SUB,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!preview && (
        <button
          onClick={generate}
          disabled={!theme.trim() || generating}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg,${PURPLE},#5A4BC7)` }}
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "AI sedang menyusun deck…" : "Generate deck"}
        </button>
      )}

      {error && (
        <p className="text-center text-[13px]" style={{ color: RED }}>
          {error}
        </p>
      )}

      {preview && (
        <>
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: SUB }}>
              Judul deck
            </p>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} style={inputStyle} />
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: SUB }}>
              Preview ({preview.cards.length} kartu)
            </p>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {preview.cards.map((c, i) => (
                <PreviewCardRow key={`${c.word}-${i}`} card={c} lang={lang} />
              ))}
            </div>
          </div>

          <PublicToggle value={isPublic} onChange={setIsPublic} />
          <SaveButton onClick={() => void save()} saving={saving}>
            Simpan deck
          </SaveButton>
          <button
            onClick={() => void generate()}
            disabled={generating}
            className="w-full rounded-2xl py-3 text-[13.5px] font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-40"
            style={{ border: `1px solid ${BORDER}` }}
          >
            {generating ? "Menyusun ulang…" : "Generate ulang"}
          </button>
        </>
      )}
    </FormShell>
  );
}

function PreviewCardRow({ card, lang }: { card: DeckCard; lang: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-white">
          {card.word}
          {card.translit && (
            <span className="ml-1.5 text-[12px] font-medium" style={{ color: SUB }}>
              ({card.translit})
            </span>
          )}
        </p>
        <p className="truncate text-[12.5px]" style={{ color: GOLD }}>
          {card.meaning}
        </p>
        {card.example && (
          <p className="truncate text-[11.5px] italic" style={{ color: SUB }}>
            {card.example}
          </p>
        )}
        {card.exampleTranslation && (
          <p className="truncate text-[11.5px]" style={{ color: "rgba(127,224,224,0.7)" }}>
            {card.exampleTranslation}
          </p>
        )}
      </div>
      <button
        onClick={() => void speakText(card.word, lang)}
        className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
        aria-label="Dengar"
      >
        <Volume2 className="h-4 w-4" style={{ color: SUB }} />
      </button>
    </div>
  );
}

// ── Form: Dari Video (kata tersimpan) ────────────────────────────────────────
function CreateVideoForm({
  lang,
  onBack,
  onCreated,
}: {
  lang: string;
  onBack: () => void;
  onCreated: (deck: Deck | null) => void;
}) {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const list = getSavedWords().filter((w) => w.langCode === lang);
    setWords(list);
    // Default: semua tercentang — biasanya siswa mau seluruh kosakata videonya.
    setSelected(new Set(list.map((w) => w.word)));
  }, [lang]);

  const toggle = useCallback((word: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    if (saving) return;
    const cards = words
      .filter((w) => selected.has(w.word))
      .map((w) => ({ word: w.word, meaning: w.meaning, example: w.example, exampleTranslation: "", translit: "" }));
    if (!cards.length) {
      setError("Pilih minimal satu kata.");
      return;
    }
    setSaving(true);
    const deck = await createDeck({
      langCode: lang,
      title: title.trim() || "Kosakata dari video",
      source: "video",
      isPublic,
      cards,
    });
    setSaving(false);
    if (!deck) {
      setError("Gagal menyimpan deck. Coba lagi.");
      return;
    }
    onCreated(deck);
  }, [saving, words, selected, lang, title, isPublic, onCreated]);

  return (
    <FormShell
      title="Deck dari video"
      subtitle="Susun deck dari kata yang kamu simpan saat menonton — centang kata yang mau dimasukkan."
      onBack={onBack}
    >
      {words.length === 0 ? (
        <p className="rounded-2xl px-4 py-6 text-center text-[13px]" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: SUB }}>
          Belum ada kata tersimpan untuk bahasa ini. Simpan kata saat menonton dulu, lalu kembali ke sini.
        </p>
      ) : (
        <>
          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: SUB }}>
              Judul deck
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Mis. "Kosakata vlog masak"'
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: SUB }}>
              Kata ({selected.size}/{words.length} dipilih)
            </p>
            <button
              onClick={() =>
                setSelected(selected.size === words.length ? new Set() : new Set(words.map((w) => w.word)))
              }
              className="text-[12px] font-bold"
              style={{ color: "#7FE0E0" }}
            >
              {selected.size === words.length ? "Kosongkan" : "Pilih semua"}
            </button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {words.map((w) => {
              const on = selected.has(w.word);
              return (
                <button
                  key={w.word}
                  onClick={() => toggle(w.word)}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors hover:bg-white/5"
                  style={{ backgroundColor: CARD, border: `1px solid ${on ? TEAL : BORDER}` }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: on ? TEAL : SURFACE_ALT, border: `1px solid ${on ? TEAL : BORDER}` }}
                  >
                    {on && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-white">{w.word}</span>
                    {w.meaning && (
                      <span className="block truncate text-[12.5px]" style={{ color: SUB }}>
                        {w.meaning}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-center text-[13px]" style={{ color: RED }}>
              {error}
            </p>
          )}
          <PublicToggle value={isPublic} onChange={setIsPublic} />
          <SaveButton onClick={() => void save()} saving={saving} disabled={selected.size === 0}>
            Simpan deck ({selected.size} kartu)
          </SaveButton>
        </>
      )}
    </FormShell>
  );
}

// ── Form: Buat Manual ─────────────────────────────────────────────────────────
interface ManualRow {
  word: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
}

function CreateManualForm({
  lang,
  onBack,
  onCreated,
}: {
  lang: string;
  onBack: () => void;
  onCreated: (deck: Deck | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<ManualRow[]>([
    { word: "", meaning: "", example: "", exampleTranslation: "" },
    { word: "", meaning: "", example: "", exampleTranslation: "" },
    { word: "", meaning: "", example: "", exampleTranslation: "" },
  ]);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const langName = getImmersionLang(lang)?.name ?? lang;
  const setRow = useCallback((i: number, patch: Partial<ManualRow>) => {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }, []);
  const filled = useMemo(() => rows.filter((r) => r.word.trim() && r.meaning.trim()), [rows]);

  const save = useCallback(async () => {
    if (saving || !filled.length) return;
    setSaving(true);
    const deck = await createDeck({
      langCode: lang,
      title: title.trim() || "Deck saya",
      source: "custom",
      isPublic,
      cards: filled.map((r) => ({
        word: r.word.trim(),
        meaning: r.meaning.trim(),
        example: r.example.trim(),
        exampleTranslation: r.exampleTranslation.trim(),
        translit: "",
      })),
    });
    setSaving(false);
    if (!deck) {
      setError("Gagal menyimpan deck. Coba lagi.");
      return;
    }
    onCreated(deck);
  }, [saving, filled, lang, title, isPublic, onCreated]);

  return (
    <FormShell
      title="Buat deck manual"
      subtitle={`Isi kata ${langName} + artinya sendiri. Baris tanpa kata/arti dilewati.`}
      onBack={onBack}
    >
      <div>
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider" style={{ color: SUB }}>
          Judul deck
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Mis. "Frasa favoritku"'
          className={inputCls}
          style={inputStyle}
        />
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="space-y-2 rounded-2xl p-3.5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: SUB }}>
                Kartu {i + 1}
              </p>
              {rows.length > 1 && (
                <button
                  onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                  className="rounded-full p-1 transition-colors hover:bg-white/10"
                  aria-label="Hapus kartu"
                >
                  <X className="h-3.5 w-3.5" style={{ color: SUB }} />
                </button>
              )}
            </div>
            <input
              value={r.word}
              onChange={(e) => setRow(i, { word: e.target.value })}
              placeholder={`Kata (${langName})`}
              className={inputCls}
              style={inputStyle}
            />
            <input
              value={r.meaning}
              onChange={(e) => setRow(i, { meaning: e.target.value })}
              placeholder="Arti (Bahasa Indonesia)"
              className={inputCls}
              style={inputStyle}
            />
            <input
              value={r.example}
              onChange={(e) => setRow(i, { example: e.target.value })}
              placeholder="Contoh kalimat (opsional)"
              className={inputCls}
              style={inputStyle}
            />
            <input
              value={r.exampleTranslation}
              onChange={(e) => setRow(i, { exampleTranslation: e.target.value })}
              placeholder="Terjemahan contoh (opsional)"
              className={inputCls}
              style={inputStyle}
            />
          </div>
        ))}
        <button
          onClick={() => setRows((rs) => [...rs, { word: "", meaning: "", example: "", exampleTranslation: "" }])}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-[13.5px] font-bold text-white transition-colors hover:bg-white/10"
          style={{ border: `1px dashed ${BORDER}` }}
        >
          <Plus className="h-4 w-4" /> Tambah kartu
        </button>
      </div>

      {error && (
        <p className="text-center text-[13px]" style={{ color: RED }}>
          {error}
        </p>
      )}
      <PublicToggle value={isPublic} onChange={setIsPublic} />
      <SaveButton onClick={() => void save()} saving={saving} disabled={filled.length === 0}>
        Simpan deck ({filled.length} kartu)
      </SaveButton>
    </FormShell>
  );
}

// ── Sesi belajar deck (overlay penuh) ─────────────────────────────────────────
// Kini memakai SRS (spaced repetition SM-2) yang sama dengan tab "Belajar"
// Kosakata Saya: kartu dinilai 4 tingkat (Lagi/Sulit/Bagus/Mudah) dan dijadwal
// ulang. Progres disimpan TERPISAH per-deck (localStorage, lihat gradeDeckCard)
// supaya tak mencemari Kosakata Saya / kena kuota simpan. Kartu jatuh tempo tampil
// dulu; kalau tak ada yang jatuh tempo, semua kartu ditinjau ("ulang lebih awal").
// Di akhir sesi tetap bisa diimpor ke "Kosakata Saya".
const srsKey = (word: string) => word.trim().toLowerCase();

function StudyOverlay({
  deck,
  lang,
  onClose,
  onVocabChange,
}: {
  deck: Deck;
  lang: string;
  onClose: () => void;
  onVocabChange?: () => void;
}) {
  const [cards, setCards] = useState<DeckCard[] | null>(null);
  const [order, setOrder] = useState<DeckCard[]>([]);
  const [srsMap, setSrsMap] = useState<Record<string, SrsState>>({});
  const [pos, setPos] = useState(0);
  const [knew, setKnew] = useState(0);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchDeckCards(deck.id).then((cs) => {
      if (!alive) return;
      const map = getDeckSrs(deck.id);
      setCards(cs);
      setSrsMap(map);
      setOrder(buildDeckOrder(cs, map, false));
      setPos(0);
      setKnew(0);
    });
    return () => {
      alive = false;
    };
  }, [deck.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const doImport = useCallback(() => {
    if (!cards || imported) return;
    importCardsToVocab(cards, deck.langCode || lang);
    setImported(true);
    onVocabChange?.();
  }, [cards, imported, deck.langCode, lang, onVocabChange]);

  const onGrade = useCallback(
    (grade: SrsGrade) => {
      const card = order[pos];
      if (card) {
        const next = gradeDeckCard(deck.id, card.word, grade);
        setSrsMap((m) => ({ ...m, [srsKey(card.word)]: next }));
        if (grade !== "again") setKnew((k) => k + 1);
      }
      setPos((p) => p + 1);
    },
    [order, pos, deck.id]
  );

  const replay = useCallback(() => {
    if (!cards) return;
    setOrder(buildDeckOrder(cards, getDeckSrs(deck.id), true));
    setPos(0);
    setKnew(0);
  }, [cards, deck.id]);

  const done = cards !== null && cards.length > 0 && pos >= order.length;
  const total = order.length;

  return (
    <div className="fixed inset-0 z-[93] flex flex-col" style={{ backgroundColor: "rgba(6,9,10,0.98)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button onClick={onClose} className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10" aria-label="Tutup">
          <X className="h-5 w-5 text-white" />
        </button>
        <div className="min-w-0 flex-1">
          {total > 0 && !done ? (
            <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: SURFACE_ALT }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(pos / total) * 100}%`, backgroundColor: TEAL }}
              />
            </div>
          ) : (
            <p className="truncate text-[14px] font-bold text-white">{deck.title}</p>
          )}
        </div>
        {total > 0 && !done && (
          <span className="shrink-0 text-[13px] font-bold" style={{ color: SUB }}>
            {Math.min(pos + 1, total)}/{total}
          </span>
        )}
      </div>

      {cards === null ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: TEAL }} />
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-8 text-center">
          <p className="text-[14px]" style={{ color: SUB }}>
            Deck ini kosong.
          </p>
        </div>
      ) : done ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: TEAL }}>
            <Check className="h-9 w-9 text-white" strokeWidth={3} />
          </div>
          <p className="mt-6 text-[26px] font-extrabold text-white">Sesi selesai!</p>
          <p className="mt-2 text-[15px]" style={{ color: SUB }}>
            Kamu mereview {total} kartu — {knew} kamu ingat. Kartu yang sudah dijadwal
            ulang muncul lagi saat jatuh tempo.
          </p>
          <div className="mt-8 w-full max-w-sm space-y-3">
            <button
              onClick={doImport}
              disabled={imported}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: TEAL }}
            >
              {imported ? <Check className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
              {imported ? "Sudah masuk Kosakata Saya" : "Tambahkan ke Kosakata Saya"}
            </button>
            <button
              onClick={replay}
              className="w-full rounded-2xl py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-white/10"
              style={{ border: `1px solid ${BORDER}` }}
            >
              Ulang lebih awal
            </button>
            <button onClick={onClose} className="w-full py-2 text-[13.5px] font-bold" style={{ color: SUB }}>
              Tutup
            </button>
          </div>
        </div>
      ) : (
        <StudyCard
          key={`${deck.id}::${pos}`}
          card={order[pos]}
          lang={deck.langCode || lang}
          srs={srsMap[srsKey(order[pos].word)] ?? newSrsState()}
          onGrade={onGrade}
        />
      )}
    </div>
  );
}

function StudyCard({
  card,
  lang,
  srs,
  onGrade,
}: {
  card: DeckCard;
  lang: string;
  srs: SrsState;
  onGrade: (grade: SrsGrade) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const langDef = getImmersionLang(lang);

  // Otomatis bunyikan kata begitu kartu muncul (sama seperti review SRS).
  useEffect(() => {
    const t = setTimeout(() => void speakText(card.word, lang), 250);
    return () => clearTimeout(t);
  }, [card.word, lang]);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">
      <div className="flex flex-1 items-center justify-center">
        <button
          onClick={() => setRevealed((v) => !v)}
          className="relative w-full max-w-lg rounded-3xl p-6 text-left"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, minHeight: 280 }}
          aria-label="Balik kartu"
        >
          <div className="flex flex-col items-center">
            <span className="text-[12px] font-semibold" style={{ color: SUB }}>
              {langDef?.name ?? lang}
            </span>
            <p className="mt-3 text-center text-[34px] font-extrabold leading-tight text-white sm:text-[40px]">
              {card.word}
            </p>
            {card.translit && (
              <p className="mt-1 text-center text-[15px]" style={{ color: SUB }}>
                {card.translit}
              </p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                void speakText(card.word, lang);
              }}
              className="mt-4 flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
              style={{ backgroundColor: SURFACE_ALT }}
              aria-label="Dengar"
            >
              <Volume2 className="h-5 w-5" style={{ color: TEAL }} />
            </button>
          </div>

          {revealed ? (
            <div className="mt-6 flex flex-col items-center">
              <div className="h-px w-full" style={{ backgroundColor: BORDER }} />
              <p className="mt-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: TEAL }}>
                Arti
              </p>
              <p className="mt-2 text-center text-[24px] font-extrabold leading-tight" style={{ color: GOLD }}>
                {card.meaning || "—"}
              </p>
              {card.example && (
                <div
                  className="mt-4 w-full rounded-2xl px-4 py-3 text-center"
                  style={{ backgroundColor: SURFACE_ALT }}
                >
                  <p className="text-[13px] italic" style={{ color: SUB }}>
                    “{card.example}”
                  </p>
                  {card.exampleTranslation && (
                    <p className="mt-1.5 text-[12.5px]" style={{ color: "rgba(127,224,224,0.85)" }}>
                      {card.exampleTranslation}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-6 text-center text-[13px]" style={{ color: SUB }}>
              Ketuk kartu untuk lihat arti
            </p>
          )}
        </button>
      </div>

      <div className="mx-auto w-full max-w-lg pt-4">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full rounded-2xl py-4 text-[15px] font-bold transition-opacity hover:opacity-90"
            style={{ border: `1px solid ${TEAL}`, color: "#7FE0E0", backgroundColor: CARD }}
          >
            Tampilkan jawaban
          </button>
        ) : (
          <>
            <p className="mb-2.5 text-center text-[13px]" style={{ color: SUB }}>
              Seberapa baik kamu mengingatnya?
            </p>
            <div className="flex gap-2">
              {GRADES.map(({ grade, label, color }) => (
                <button
                  key={grade}
                  onClick={() => onGrade(grade)}
                  className="flex-1 rounded-2xl py-3 text-center transition-opacity hover:opacity-90"
                  style={{ backgroundColor: color }}
                >
                  <span className="block text-[14px] font-bold text-white">{label}</span>
                  <span className="mt-0.5 block text-[10px] font-medium text-white/85">
                    {gradePreviewLabel(srs, grade)}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
