// Deck flashcard Watch & Learn — lapisan data untuk deck tematik AI, deck dari
// kosakata video, dan deck buatan siswa yang bisa dibagikan ke komunitas.
//
// Penyimpanan di Supabase (tabel wl_decks + wl_deck_cards, RLS: deck publik bisa
// dibaca semua user login, tulis hanya pemilik). Beda dengan "Kosakata Saya" yang
// tetap di localStorage (SRS per-perangkat): deck adalah KUMPULAN kartu yang bisa
// dipelajari langsung atau di-IMPORT ke Kosakata Saya agar masuk review harian.

import { supabase } from "@/lib/supabase-client";
import { saveWord } from "./immersionLearn";
import { gradeCard, isDue, newSrsState, type SrsGrade, type SrsState } from "./srs";

export type DeckSource = "ai" | "video" | "custom";

export interface DeckCard {
  word: string;
  meaning: string;
  example: string;
  // Terjemahan Bahasa Indonesia dari `example` — biar siswa paham kalimat contoh,
  // bukan cuma katanya. Bisa kosong untuk deck lama / kartu tanpa terjemahan.
  exampleTranslation: string;
  translit: string;
}

export interface Deck {
  id: string;
  ownerId: string;
  ownerName: string;
  langCode: string;
  title: string;
  description: string;
  theme: string;
  source: DeckSource;
  isPublic: boolean;
  cardCount: number;
  createdAt: string;
}

interface DeckRow {
  id: string;
  owner_id: string;
  owner_name: string;
  lang_code: string;
  title: string;
  description: string;
  theme: string;
  source: string;
  is_public: boolean;
  card_count: number;
  created_at: string;
}

function rowToDeck(r: DeckRow): Deck {
  return {
    id: r.id,
    ownerId: r.owner_id,
    ownerName: r.owner_name || "Siswa Linguo",
    langCode: r.lang_code,
    title: r.title,
    description: r.description ?? "",
    theme: r.theme ?? "",
    source: (["ai", "video", "custom"].includes(r.source) ? r.source : "custom") as DeckSource,
    isPublic: !!r.is_public,
    cardCount: r.card_count ?? 0,
    createdAt: r.created_at,
  };
}

/** User login saat ini (id + nama tampilan utk kolom kontributor), atau null. */
export async function getDeckUser(): Promise<{ id: string; name: string } | null> {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    u.email?.split("@")[0] ||
    "Siswa Linguo";
  return { id: u.id, name };
}

/** Deck milik user login untuk satu bahasa (terbaru dulu). */
export async function listMyDecks(langCode: string): Promise<Deck[]> {
  const user = await getDeckUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("wl_decks")
    .select("*")
    .eq("owner_id", user.id)
    .eq("lang_code", langCode)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as DeckRow[]).map(rowToDeck);
}

/** Deck PUBLIK buatan orang lain untuk satu bahasa — sumber "Deck Komunitas". */
export async function listCommunityDecks(langCode: string, limit = 30): Promise<Deck[]> {
  const user = await getDeckUser();
  let q = supabase
    .from("wl_decks")
    .select("*")
    .eq("lang_code", langCode)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (user) q = q.neq("owner_id", user.id);
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as DeckRow[]).map(rowToDeck);
}

/** Isi kartu sebuah deck, urut posisi. */
export async function fetchDeckCards(deckId: string): Promise<DeckCard[]> {
  // select("*") supaya tetap jalan walau kolom example_translation belum ditambah
  // (migrasi manual) — kolom yang belum ada cukup dibaca sebagai "".
  const { data, error } = await supabase
    .from("wl_deck_cards")
    .select("*")
    .eq("deck_id", deckId)
    .order("position", { ascending: true });
  if (error || !data) return [];
  return (data as (Record<string, string> & { position: number })[]).map((c) => ({
    word: c.word,
    meaning: c.meaning ?? "",
    example: c.example ?? "",
    exampleTranslation: c.example_translation ?? "",
    translit: c.translit ?? "",
  }));
}

/**
 * Simpan deck baru + kartunya. `ownerName` didenormalisasi ke baris deck supaya
 * daftar komunitas bisa menampilkan kontributor tanpa join ke auth.users.
 */
export async function createDeck(params: {
  langCode: string;
  title: string;
  description?: string;
  theme?: string;
  source: DeckSource;
  isPublic: boolean;
  cards: DeckCard[];
}): Promise<Deck | null> {
  const user = await getDeckUser();
  if (!user) return null;
  const cards = params.cards.filter((c) => c.word.trim());
  if (!cards.length) return null;

  const { data, error } = await supabase
    .from("wl_decks")
    .insert({
      owner_id: user.id,
      owner_name: user.name,
      lang_code: params.langCode,
      title: params.title.trim().slice(0, 80) || "Deck tanpa judul",
      description: (params.description ?? "").trim().slice(0, 200),
      theme: (params.theme ?? "").trim().slice(0, 120),
      source: params.source,
      is_public: params.isPublic,
      card_count: cards.length,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  const deck = rowToDeck(data as DeckRow);

  const baseRows = cards.map((c, i) => ({
    deck_id: deck.id,
    position: i,
    word: c.word.trim(),
    meaning: c.meaning.trim(),
    example: c.example.trim(),
    translit: c.translit.trim(),
  }));
  const rowsWithTranslation = baseRows.map((r, i) => ({
    ...r,
    example_translation: (cards[i].exampleTranslation ?? "").trim(),
  }));

  let cardsErr = (await supabase.from("wl_deck_cards").insert(rowsWithTranslation)).error;
  // Fallback: kolom example_translation belum ada (migrasi manual belum jalan) →
  // simpan tanpa terjemahan supaya pembuatan deck tetap berhasil.
  if (cardsErr && /example_translation/i.test(cardsErr.message ?? "")) {
    cardsErr = (await supabase.from("wl_deck_cards").insert(baseRows)).error;
  }
  if (cardsErr) {
    // Kartu gagal masuk → jangan sisakan deck kosong.
    await supabase.from("wl_decks").delete().eq("id", deck.id);
    return null;
  }
  return deck;
}

/** Ubah visibilitas deck (bagikan ke komunitas / jadikan privat). */
export async function setDeckPublic(deckId: string, isPublic: boolean): Promise<boolean> {
  const { error } = await supabase.from("wl_decks").update({ is_public: isPublic }).eq("id", deckId);
  return !error;
}

export async function deleteDeck(deckId: string): Promise<boolean> {
  // Kartu ikut terhapus lewat FK on delete cascade.
  const { error } = await supabase.from("wl_decks").delete().eq("id", deckId);
  if (!error) resetDeckSrs(deckId); // buang juga progres SRS lokalnya
  return !error;
}

/** Hasil generate AI: judul usulan + kartu (belum tersimpan — preview dulu). */
export interface GeneratedDeck {
  title: string;
  cards: DeckCard[];
}

/**
 * Minta AI membuatkan deck tematik (route /api/deck-generate, Gemini). Lempar
 * Error berpesan Indonesia saat gagal — UI menampilkannya apa adanya.
 */
export async function generateAiDeck(params: {
  theme: string;
  langCode: string;
  level?: string;
  count?: number;
}): Promise<GeneratedDeck> {
  const res = await fetch("/api/deck-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = (await res.json().catch(() => ({}))) as {
    title?: string;
    cards?: DeckCard[];
    error?: string;
  };
  if (!res.ok || !Array.isArray(data.cards) || !data.cards.length) {
    throw new Error(data.error || "Gagal membuat deck. Coba lagi.");
  }
  return { title: data.title || params.theme, cards: data.cards };
}

/**
 * Import kartu deck ke "Kosakata Saya" (localStorage + SRS) supaya ikut masuk
 * review harian. Balikin jumlah kartu yang diimpor.
 */
export function importCardsToVocab(cards: DeckCard[], langCode: string): number {
  let n = 0;
  // Dibalik supaya kartu pertama deck berakhir paling atas daftar (saveWord prepend).
  for (const c of [...cards].reverse()) {
    if (!c.word.trim()) continue;
    saveWord({ word: c.word.trim(), meaning: c.meaning.trim(), langCode, example: c.example.trim() });
    n++;
  }
  return n;
}

// ── SRS per-deck (spaced repetition saat mempelajari deck) ────────────────────
// Belajar deck kini memakai penjadwalan SM-2 yang sama dengan "Kosakata Saya",
// TAPI progresnya disimpan terpisah per-deck (localStorage) supaya tidak mencemari
// Kosakata Saya / kena kuota simpan. Kunci: deckId → { word(lowercase) → SrsState }.
// Kartu yang belum pernah dinilai = tidak ada di map = dianggap "baru"/jatuh tempo.

const DECK_SRS_KEY = "linguo:watch:deckstudy:v1";
type DeckSrsStore = Record<string, Record<string, SrsState>>;

function cardKey(word: string): string {
  return word.trim().toLowerCase();
}

function readDeckSrsStore(): DeckSrsStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DECK_SRS_KEY);
    const obj = raw ? (JSON.parse(raw) as DeckSrsStore) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function writeDeckSrsStore(store: DeckSrsStore): void {
  try {
    window.localStorage.setItem(DECK_SRS_KEY, JSON.stringify(store));
  } catch {
    /* penuh/diblokir — abaikan */
  }
}

/** State SRS tersimpan untuk satu deck (word → state). Kosong = semua kartu baru. */
export function getDeckSrs(deckId: string): Record<string, SrsState> {
  return readDeckSrsStore()[deckId] ?? {};
}

/** Nilai satu kartu deck (SRS) lalu simpan; balikin state barunya. */
export function gradeDeckCard(deckId: string, word: string, grade: SrsGrade): SrsState {
  const store = readDeckSrsStore();
  const deckMap = store[deckId] ?? {};
  const next = gradeCard(deckMap[cardKey(word)] ?? newSrsState(), grade);
  store[deckId] = { ...deckMap, [cardKey(word)]: next };
  writeDeckSrsStore(store);
  return next;
}

/** Lupakan progres SRS sebuah deck (mis. saat deck dihapus / "belajar dari awal"). */
export function resetDeckSrs(deckId: string): void {
  const store = readDeckSrsStore();
  if (store[deckId]) {
    delete store[deckId];
    writeDeckSrsStore(store);
  }
}

/**
 * Berapa kartu deck yang jatuh tempo sekarang, TANPA perlu memuat isi kartunya:
 * kartu baru (belum ada di map) selalu jatuh tempo, plus kartu terjadwal yang
 * sudah lewat. Dipakai badge "N jatuh tempo" pada daftar deck.
 */
export function deckDueCount(deckId: string, cardCount: number): number {
  const map = getDeckSrs(deckId);
  const known = Object.keys(map).length;
  const newDue = Math.max(0, cardCount - known); // kartu yang belum pernah dinilai
  let scheduledDue = 0;
  for (const s of Object.values(map)) if (isDue(s)) scheduledDue++;
  return newDue + scheduledDue;
}

/**
 * Ambil kartu (word) untuk state SRS, plus urutkan sesi belajar: kartu jatuh tempo
 * dulu (baru → terjadwal-lewat), lalu diacak. `reviewAhead` = pelajari semua walau
 * belum jatuh tempo (dipakai tombol "Ulangi deck").
 */
export function buildDeckOrder(
  cards: DeckCard[],
  srs: Record<string, SrsState>,
  reviewAhead: boolean
): DeckCard[] {
  const due = cards.filter((c) => isDue(srs[cardKey(c.word)]));
  const pool = reviewAhead || due.length === 0 ? cards.slice() : due;
  return pool
    .map((c) => ({ c, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c);
}
