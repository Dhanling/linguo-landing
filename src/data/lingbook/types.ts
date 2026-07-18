// [lingbook-phase1-v1] Tipe data Lingbook — interactive ebook reader.
// Language-agnostic: field grammar & reading fleksibel per bahasa (Jepang, Spanyol,
// Rusia, dst.) lewat Record<string,string>. Semua teks UI berbahasa Indonesia.

/** Skrip tulisan buku — memengaruhi font baca & apakah furigana/romaji relevan. */
export type Script = "cjk" | "latin" | "cyrillic" | "arabic";

/** Satu "bentuk lain" dari kata (konjugasi, deklinasi, dsb.). */
export interface WordForm {
  /** Teks bentuknya, mis. "行かない" atau "quieres". */
  form: string;
  /** Catatan singkat, mis. "negatif kasual" / "tú". */
  note: string;
}

/**
 * Entri glosarium — satu kata dan seluruh info kartunya.
 * Dipakai bersama Chapter.glossary dan direferensikan token di dalam teks.
 * Field `grammar` sengaja Record<string,string> agar bebas per bahasa
 * (Jepang: "Golongan"/"Konjugasi"; Rusia: "Kasus"/"Aspek"; dst.).
 */
export interface Word {
  /** Bentuk tertulis apa adanya, mis. "行きます" / "café". */
  surface: string;
  /** Cara baca kana untuk furigana (Jepang). Kosong untuk skrip Latin. */
  reading?: string;
  /** Transliterasi Latin, mis. "ikimasu" / "kōhī". */
  romaji?: string;
  /** Arti bahasa Indonesia. */
  meaning: string;
  /** Kelas kata (label Indonesia), mis. "verba", "partikel". */
  pos: string;
  /** Rincian tata bahasa; urutan key dipertahankan saat dirender. */
  grammar?: Record<string, string>;
  /** Bentuk-bentuk lain (konjugasi/deklinasi). */
  forms?: WordForm[];
}

/**
 * Token di dalam teks. Kata mengacu ke glosarium via `ref` (bisa dipakai
 * ulang tanpa duplikasi data). Tanda baca / literal non-klik pakai `text`.
 */
export type Token = { ref: string } | { text: string };

/** Satu baris dialog. */
export interface DialogLine {
  /** Nama penutur seperti tampil, mis. "店員" / "Camarero". */
  speaker: string;
  /** Peran/keterangan singkat, mis. "Pelayan". */
  role?: string;
  /** Warna avatar (hex). */
  color?: string;
  tokens: Token[];
  /** Terjemahan Indonesia satu baris. */
  translation?: string;
  /** URL audio per baris (placeholder → Cloudflare/Supabase nanti). */
  audioSrc?: string;
}

export interface HeadingBlock {
  type: "heading";
  text: string;
  /** Sub-judul kecil di samping (mis. terjemahan judul bagian). */
  sub?: string;
}

export interface ParagraphBlock {
  type: "paragraph";
  tokens: Token[];
  translation?: string;
}

export interface DialogBlock {
  type: "dialog";
  lines: DialogLine[];
  /** Audio gabungan seluruh dialog (opsional). */
  audioSrc?: string;
}

export interface ImageBlock {
  type: "image";
  /** URL gambar (placeholder → storage nanti). */
  src?: string;
  alt?: string;
  captionTokens?: Token[];
  captionTranslation?: string;
}

export interface AudioBlock {
  type: "audio";
  title: string;
  /** URL audio (placeholder → storage nanti). */
  src?: string;
  /** Durasi (detik) untuk UI player. */
  durationSec: number;
  /** Transkrip per baris (nama + token). */
  transcript?: { name: string; tokens: Token[] }[];
}

/** Sel tabel: kumpulan token (bisa diklik) atau teks biasa. */
export type TableCell = { tokens: Token[] } | { text: string };

export interface TableBlock {
  type: "table";
  title?: string;
  columns: string[];
  rows: TableCell[][];
}

export interface CalloutBlock {
  type: "callout";
  variant: "info" | "warning" | "tips";
  title: string;
  body: string;
  /** Contoh interaktif di dalam callout (opsional). */
  example?: { tokens: Token[]; translation?: string };
}

// ── Phase 2: struktur unit ala Teach Yourself ─────────────────────────────

/** Id section/langkah unit — menggerakkan stepper navigasi. */
export type StepId = "tujuan" | "dialog" | "vocab" | "grammar" | "latihan" | "test";

/** Satu langkah pada stepper. */
export interface UnitStep {
  id: StepId;
  label: string;
}

/** Satu learning objective — tercentang saat `section` diselesaikan. */
export interface Objective {
  text: string;
  /** Section yang, bila selesai, mencentang tujuan ini. */
  section: StepId;
}

/**
 * Kotak learning objectives di awal unit (step "Tujuan").
 * Dirender jadi checklist yang tercentang mengikuti progress section.
 */
export interface ObjectivesBlock {
  type: "objectives";
  items: Objective[];
}

/** Kartu kosakata kunci (step "Kosakata") — refs mengacu ke glosarium. */
export interface VocabListBlock {
  type: "vocab_list";
  refs: string[];
}

/** Poin grammar (step "Grammar") — penjelasan + pola + contoh + tabel. */
export interface GrammarPointBlock {
  type: "grammar_point";
  title: string;
  body: string;
  /** Pola ringkas, mis. "[nomina] をください". */
  pattern?: string;
  /** Contoh kalimat yang tetap tap-to-learn. */
  example?: { tokens: Token[]; translation?: string };
  /** Tabel pendukung (mis. konjugasi). */
  table?: { columns: string[]; rows: TableCell[][] };
}

/** Callout varian budaya (ikon 🌏). */
export interface CultureNoteBlock {
  type: "culture_note";
  title: string;
  body: string;
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | DialogBlock
  | ImageBlock
  | AudioBlock
  | TableBlock
  | CalloutBlock
  | ObjectivesBlock
  | VocabListBlock
  | GrammarPointBlock
  | CultureNoteBlock;

// ── Latihan & Test Yourself ───────────────────────────────────────────────

/** Soal pilihan ganda / isian (opsi partikel). Feedback instan via `expl`. */
export interface ChoiceExercise {
  type: "mc" | "fill";
  q: string;
  qTrans?: string;
  opts: string[];
  /** Index opsi benar. */
  ans: number;
  expl: string;
}

/** Soal menjodohkan — pasangan [kiri, kanan]. */
export interface MatchExercise {
  type: "match";
  qTrans: string;
  pairs: [string, string][];
}

/** Soal susun kalimat (tap-to-order). `words` = urutan benar. */
export interface OrderExercise {
  type: "order";
  qTrans: string;
  words: string[];
  expl: string;
}

export type Exercise = ChoiceExercise | MatchExercise | OrderExercise;

/** Satu soal mini-quiz Test Yourself. */
export interface TestQuestion {
  q: string;
  opts: string[];
  ans: number;
  /** Materi terkait — untuk breakdown hasil. */
  topic: string;
}

/** Satu pilihan balasan siswa saat roleplay. */
export interface RoleplayChoice {
  t: string;
  tr: string;
}

/** Satu giliran roleplay — ucapan AI + pilihan balasan (null = penutup). */
export interface RoleplayTurn {
  ai: string;
  trans: string;
  choices: RoleplayChoice[] | null;
}

export interface Chapter {
  slug: string;
  /** Label bab, mis. "Bab 3 — カフェで". */
  label: string;
  title: string;
  /** Sub-judul (terjemahan), mis. "Di Kafe". */
  subtitle?: string;
  /** Meta baca, mis. "± 8 menit baca · 24 kata baru". */
  meta?: string;
  glossary: Record<string, Word>;
  /** Konten bacaan/dialog (step "Dialog"). */
  blocks: ContentBlock[];

  // ── Phase 2: struktur unit (opsional). Bila `steps` ada, reader pakai
  //    mode unit (stepper). Bila tidak, jatuh ke mode baca datar lama. ──
  /** Urutan langkah pada stepper. */
  steps?: UnitStep[];
  /** Learning objectives (step "Tujuan"). */
  objectives?: Objective[];
  /** Kata kunci untuk step "Kosakata" (refs glosarium). */
  vocabRefs?: string[];
  /** Poin grammar (step "Grammar"). */
  grammarPoints?: GrammarPointBlock[];
  /** Soal latihan (step "Latihan"). */
  exercises?: Exercise[];
  /** Mini-quiz (step "Test Yourself"). */
  test?: TestQuestion[];
  /** Skrip roleplay akhir unit (mock/scripted). */
  roleplay?: RoleplayTurn[];
}

/** Ringkasan bab untuk daftar isi / library. */
export interface ChapterSummary {
  slug: string;
  title: string;
  subtitle?: string;
  /** Estimasi durasi baca, mis. "8 mnt". */
  duration?: string;
  status?: "done" | "now" | "locked" | "";
}

export interface Book {
  slug: string;
  title: string;
  language: {
    /** Kode BCP47 untuk TTS, mis. "ja-JP" / "es-ES". */
    speechLang: string;
    /** Nama bahasa (Indonesia), mis. "Jepang". */
    name: string;
    /** Nama asli, mis. "日本語". */
    nativeName?: string;
    script: Script;
  };
  /** Level, mis. "N5" / "A1". */
  level: string;
  description?: string;
  /** Warna aksen kover (hex). */
  accent?: string;
  /** Emoji/glyph kover sederhana untuk mock (belum ada gambar). */
  coverGlyph?: string;
  /** Total bab (untuk header "Bab X dari Y"). */
  chapterCount: number;
  /** Ringkasan seluruh bab (daftar isi). */
  toc: ChapterSummary[];
  /** Bab yang punya konten penuh (phase 1: sebagian saja). */
  chapters: Chapter[];
}
