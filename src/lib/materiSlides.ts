// [materi-slide-v1] Format slide untuk materi kelas (`class_materials`).
//
// Kenapa format sendiri, bukan menumpang slide Lingcore (`session_slides` +
// PreviewMode di halaman Silabus): slide Lingcore itu perpustakaan silabus
// sekolah — 12 template kaya, puluhan slide per sesi, dan hidup di tabelnya
// sendiri. Materi kelas ini kebalikannya: milik SATU siswa/sesi, maksimal 10
// slide, dan harus bisa dibaca siswa di dalam linguo.id/akun tanpa lompat
// domain. Jadi bentuknya sengaja kecil supaya renderer-nya muat ditulis ulang
// ringkas di repo landing.
//
// ⚠️ SALINAN. Aslinya di linguo-admin-dashboard/src/lib/materiSlides.ts — di
// sanalah pengajar MENULIS deknya; di sini siswa MEMBACANYA. Keduanya menyentuh
// baris `class_materials` yang sama, jadi kalau bentuk slide berubah di repo
// dashboard, salin lagi ke sini — kalau tidak, dek baru berhenti dikenali dan
// siswa cuma melihat JSON mentah.
//
// Penyimpanan: satu baris `class_materials` dengan
//   kind    = 'ai_slides'
//   content = JSON.stringify(MateriDeck)
// Sengaja menumpang kolom `content` yang sudah ada, bukan kolom jsonb baru,
// supaya fitur ini tidak menunggu migrasi dijalankan manual.

export const SLIDE_MATERIAL_KIND = "ai_slides";

/** Batas atas jumlah slide. Materi kelas 1 sesi, bukan silabus. */
export const MAX_SLIDES = 10;
export const MIN_SLIDES = 3;
export const DEFAULT_SLIDES = 6;

export type SlideType = "title" | "points" | "vocab" | "pattern" | "practice" | "recap";

export const SLIDE_TYPES: SlideType[] = ["title", "points", "vocab", "pattern", "practice", "recap"];

export const SLIDE_TYPE_LABEL: Record<SlideType, string> = {
  title: "Pembuka",
  points: "Poin",
  vocab: "Kosakata",
  pattern: "Pola kalimat",
  practice: "Latihan",
  recap: "Rangkuman",
};

export interface VocabItem {
  /** Kata dalam bahasa yang dipelajari. */
  term: string;
  /** Alih aksara / cara baca — kosongkan untuk bahasa beraksara Latin. */
  translit?: string;
  meaning: string;
  example?: string;
  example_meaning?: string;
}

export interface ExampleItem {
  target: string;
  meaning: string;
}

export interface MateriSlide {
  type: SlideType;
  heading: string;
  subheading?: string;
  /** points & recap */
  points?: string[];
  /** vocab */
  items?: VocabItem[];
  /** pattern */
  pattern?: string;
  examples?: ExampleItem[];
  note?: string;
  /** practice — jawaban sejajar indeks dengan soal, boleh lebih pendek */
  questions?: string[];
  answers?: string[];
  /** recap */
  homework?: string;
}

export interface MateriDeck {
  v: 1;
  slides: MateriSlide[];
}

const str = (v: any): string => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
const strList = (v: any): string[] =>
  Array.isArray(v) ? v.map(str).filter(Boolean) : [];

/** Ada aksara di luar Latin/angka/tanda baca? Penanda bahasa beraksara asing. */
const adaAksaraAsing = (s: string) => /[^\u0000-\u024F\u2000-\u206F\s]/.test(s);

/**
 * Cara baca yang terlanjur ditempel di dalam `term` — mis. "일 (il)" — dipisah
 * ke `translit`. Model kadang mengabaikan bidang terpisahnya, dan kalau
 * dibiarkan, kolom cara baca di slide berakhir kosong sementara aksara aslinya
 * jadi berdempet dengan romanisasi.
 *
 * Hanya jalan kalau kepala kata memang beraksara non-Latin — supaya
 * "a house (noun)" di bahasa beraksara Latin tidak ikut terpotong.
 */
function pisahCaraBaca(term: string, translit: string): [string, string] {
  if (translit) return [term, translit];
  const m = term.match(/^(.+?)\s*[（(]\s*([^()（）]+?)\s*[)）]$/);
  if (!m) return [term, translit];
  const [, kepala, kurung] = m;
  if (!adaAksaraAsing(kepala) || adaAksaraAsing(kurung)) return [term, translit];
  return [kepala.trim(), kurung.trim()];
}

function normVocab(v: any): VocabItem | null {
  const meaning = str(v?.meaning);
  const [term, translit] = pisahCaraBaca(str(v?.term), str(v?.translit));
  if (!term && !meaning) return null;
  return {
    term,
    translit: translit || undefined,
    meaning,
    example: str(v?.example) || undefined,
    example_meaning: str(v?.example_meaning) || undefined,
  };
}

function normExample(v: any): ExampleItem | null {
  const target = str(v?.target);
  const meaning = str(v?.meaning);
  if (!target && !meaning) return null;
  return { target, meaning };
}

/**
 * Bentuk ulang satu slide mentah (dari AI atau dari baris lama) jadi bentuk yang
 * pasti bisa dirender. Mengembalikan null kalau slide itu kosong melompong —
 * lebih baik hilang daripada jadi slide putih di tengah presentasi.
 */
export function normalizeSlide(raw: any): MateriSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const type: SlideType = SLIDE_TYPES.includes(raw.type) ? raw.type : "points";
  const s: MateriSlide = { type, heading: str(raw.heading) };
  const sub = str(raw.subheading);
  if (sub) s.subheading = sub;

  if (type === "vocab") {
    s.items = (Array.isArray(raw.items) ? raw.items : []).map(normVocab).filter(Boolean) as VocabItem[];
  } else if (type === "pattern") {
    s.pattern = str(raw.pattern) || undefined;
    s.examples = (Array.isArray(raw.examples) ? raw.examples : []).map(normExample).filter(Boolean) as ExampleItem[];
    s.note = str(raw.note) || undefined;
  } else if (type === "practice") {
    s.questions = strList(raw.questions);
    s.answers = strList(raw.answers);
  } else if (type === "recap") {
    s.points = strList(raw.points);
    s.homework = str(raw.homework) || undefined;
  } else if (type === "points") {
    s.points = strList(raw.points);
  } else if (type === "title") {
    s.note = str(raw.note) || undefined;
  }

  const kosong =
    !s.heading && !s.subheading && !s.note && !s.pattern && !s.homework &&
    !s.points?.length && !s.items?.length && !s.examples?.length &&
    !s.questions?.length;
  return kosong ? null : s;
}

/** Slide kosong siap diisi manual di editor. */
export function emptySlide(type: SlideType): MateriSlide {
  switch (type) {
    case "title": return { type, heading: "", subheading: "" };
    case "vocab": return { type, heading: "", items: [{ term: "", meaning: "" }] };
    case "pattern": return { type, heading: "", pattern: "", examples: [{ target: "", meaning: "" }] };
    case "practice": return { type, heading: "", questions: [""], answers: [""] };
    case "recap": return { type, heading: "", points: [""], homework: "" };
    default: return { type: "points", heading: "", points: [""] };
  }
}

/**
 * Baca kolom `content` jadi dek. Mengembalikan null kalau isinya bukan dek —
 * itu jalur normal untuk materi teks lama, BUKAN error.
 */
export function parseDeck(content: string | null | undefined): MateriDeck | null {
  const t = (content || "").trim();
  if (!t.startsWith("{")) return null;
  let raw: any;
  try { raw = JSON.parse(t); } catch { return null; }
  if (!raw || !Array.isArray(raw.slides)) return null;
  const slides = raw.slides.map(normalizeSlide).filter(Boolean) as MateriSlide[];
  if (!slides.length) return null;
  return { v: 1, slides: slides.slice(0, MAX_SLIDES) };
}

export function serializeDeck(slides: MateriSlide[]): string {
  return JSON.stringify({ v: 1, slides } satisfies MateriDeck);
}

/** Baris materi ini dek slide atau bukan. */
export function isSlideMaterial(m: any): boolean {
  return m?.kind === SLIDE_MATERIAL_KIND || (!!m?.content && !!parseDeck(m.content));
}

/**
 * Dek → teks polos. Dipakai untuk pratinjau ringkas, pencarian, dan sebagai
 * jaring pengaman kalau ada pembaca yang belum kenal format slide.
 */
export function deckToText(deck: MateriDeck): string {
  const out: string[] = [];
  deck.slides.forEach((s, i) => {
    out.push(`## ${i + 1}. ${s.heading || SLIDE_TYPE_LABEL[s.type]}`);
    if (s.subheading) out.push(s.subheading);
    if (s.pattern) out.push(`Pola: ${s.pattern}`);
    s.points?.forEach((p) => out.push(`- ${p}`));
    s.items?.forEach((it) => {
      const cara = it.translit ? ` (${it.translit})` : "";
      const contoh = it.example ? ` — ${it.example}${it.example_meaning ? ` (${it.example_meaning})` : ""}` : "";
      out.push(`- ${it.term}${cara}: ${it.meaning}${contoh}`);
    });
    s.examples?.forEach((e) => out.push(`- ${e.target}${e.meaning ? ` (${e.meaning})` : ""}`));
    s.questions?.forEach((q, qi) => {
      const jawab = s.answers?.[qi];
      out.push(`${qi + 1}. ${q}${jawab ? ` → ${jawab}` : ""}`);
    });
    if (s.note) out.push(s.note);
    if (s.homework) out.push(`PR: ${s.homework}`);
    out.push("");
  });
  return out.join("\n").trim();
}
