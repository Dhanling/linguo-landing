import { upgradeImagegenA2Cover } from "../data/imagegenA2Cover";
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

import { spanishSlideArtwork } from "../data/spanishSlideThemes";

export const SLIDE_MATERIAL_KIND = "ai_slides";

/** Batas atas jumlah slide hasil generate AI. Materi kelas 1 sesi, bukan silabus. */
export const MAX_SLIDES = 10;
/**
 * [dek-siap-pakai-v1] Batas atas dek yang DISIMPAN/disunting. Dek siap pakai
 * per sesi silabus (src/data/dekSilabus) berisi dialog + kosakata + tata bahasa
 * + kuis seperti satu unit e-book, jadi lebih panjang dari hasil AI (~12–16
 * slide). Batas AI tetap MAX_SLIDES; batas ini cuma pagar supaya dek tidak liar.
 */
export const MAX_SLIDES_DEK = 30;
export const MIN_SLIDES = 3;
export const DEFAULT_SLIDES = 6;

export type SlideType = "title" | "points" | "vocab" | "pattern" | "dialog" | "practice" | "quiz" | "recap";

export const SLIDE_TYPES: SlideType[] = ["title", "points", "vocab", "pattern", "dialog", "practice", "quiz", "recap"];

export const SLIDE_TYPE_LABEL: Record<SlideType, string> = {
  title: "Pembuka",
  points: "Poin",
  vocab: "Kosakata",
  pattern: "Pola kalimat",
  dialog: "Dialog",
  practice: "Latihan",
  quiz: "Kuis",
  recap: "Rangkuman",
};

export interface VocabItem {
  /** Kata dalam bahasa yang dipelajari. */
  term: string;
  /** Alih aksara / cara baca — kosongkan untuk bahasa beraksara Latin. */
  translit?: string;
  meaning: string;
  example?: string;
  /** [slide-pinyin-v1] Cara baca kalimat contoh (pinyin, romaji, …). */
  example_translit?: string;
  example_meaning?: string;
}

export interface ExampleItem {
  target: string;
  /** [slide-pinyin-v1] Cara baca — hanya untuk bahasa beraksara non-Latin. */
  translit?: string;
  meaning: string;
}

/** [dek-siap-pakai-v1] Satu baris dialog. */
export interface DialogLine {
  speaker: string;
  text: string;
  /** [slide-pinyin-v1] Cara baca — hanya untuk bahasa beraksara non-Latin. */
  translit?: string;
  meaning?: string;
}

/** [dek-siap-pakai-v1] Satu soal pilihan ganda. `answer` = indeks opsi yang benar. */
export interface QuizItem {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
}

/* ── [slide-visual-v1] Visual khusus di atas jenis slide biasa ───────────────
   Bidang opsional: penonton yang kenal `visual` menggambar diagram (kontur nada,
   susunan suku kata, kelompok bunyi, jebakan ejaan); penonton lama tetap
   membaca bidang teks biasanya (examples/items), jadi slide tak pernah kosong.
   `hanzi` (atau aksara asli lain) = yang dibunyikan TTS — pinyin dibaca suara
   Mandarin sebagai huruf Latin, Hanzi selalu benar nadanya. */

/** Nada Mandarin: 1–4, 0 = netral. */
export type Nada = 0 | 1 | 2 | 3 | 4;

export interface VisualNadaRow { tone: Nada; pinyin: string; hanzi?: string; meaning: string; hint?: string }
export interface VisualSukuRow { initial: string; final: string; tone: Nada; pinyin: string; hanzi?: string; meaning: string }
export interface VisualChip { text: string; sub?: string; hanzi?: string; meaning?: string; mark?: string }
export interface VisualGroup { label: string; big?: string; hint?: string; chips: VisualChip[] }
export interface VisualJebakanRow { text: string; hanzi?: string; meaning?: string; wrong: string; right: string }

/* [slide-sejarah-v1] Sejarah bahasa: peta persebaran yang bisa diputar + linimasa.
   Koordinat dalam derajat (lon, lat); `tahun` negatif = Sebelum Masehi. Elemen
   peta muncul saat linimasa melewati tahunnya. */
export interface SejarahWilayah { lon: number; lat: number; r: number; tahun: number; label?: string }
export interface SejarahTitik { lon: number; lat: number; nama: string; tahun: number; /** label di kiri titik */ kiri?: boolean }
export interface SejarahRute { tahun: number; label?: string; /** posisi label [lon, lat] */ di?: [number, number]; titik: Array<[number, number]> }
export interface SejarahPeristiwa { tahun: number; judul: string; info?: string; asli?: string; translit?: string }
export interface SejarahStat { angka: string; label: string }

/* [slide-banding-v1] Perbandingan tata bahasa dengan bahasa Indonesia. Token
   dengan `g` sama = padanan kata (diberi warna sama) supaya urutan kata terlihat. */
export interface BandingToken { t: string; tr?: string; arti?: string; g?: number }
export type BandingStatus = "sama" | "mirip" | "beda";
export interface BandingRow {
  aspek: string; status: BandingStatus; ringkas: string;
  id: BandingToken[]; target: BandingToken[];
  /** Kalimat utuh yang dibunyikan TTS (kalau kosong: token digabung). */
  teks?: string; catatan?: string;
}

/* [slide-alfabet-v1] Abjad per huruf: satu ubin per huruf, klik = pop-up nama
   huruf, cara baca, dan contoh kata. `tanda` = label singkat untuk huruf yang
   bunyinya beda dari bahasa Indonesia (ubinnya diberi warna).
   [slide-alfabet-aksara-v1] Untuk aksara non-Latin: `ucap` = tulisan asli yang
   dibunyikan TTS (mis. alif → "ألف"; default `nama`), `bentuk` = bentuk lain
   huruf (awal/tengah/akhir Arab), `sorot` = potongan yang diwarnai di contoh kata
   (abugida: huruf mandiri + tanda vokal/matra), contoh `baca` = transliterasi. */
export interface AlfabetContoh { kata: string; arti: string; ikon?: string; baca?: string }
export interface AlfabetHuruf {
  huruf: string; nama: string; baca?: string; tanda?: string; info?: string; contoh: AlfabetContoh[];
  ucap?: string; bentuk?: string; sorot?: string[];
  /** Kapital eksplisit kalau toUpperCase() salah (Turki i → İ); `huruf` = bentuk kecilnya. */
  besar?: string;
}

/* [slide-bunyi-v1] Vokal + bunyi khas: ubin vokal di atas, kartu bunyi khas di
   bawah. `sorot` = potongan huruf yang diwarnai di contoh kata (default `tulisan`);
   `bisu` = potongan itu dicoret karena tak dibunyikan (mis. h).
   Vokal: `baca` = transliterasi kata, `sorot` = potongan yang diwarnai (default `huruf`). */
export interface BunyiVokal { huruf: string; seperti?: string; kata: string; arti: string; ikon?: string; baca?: string; sorot?: string[] }
export interface BunyiContoh { kata: string; baca?: string; arti?: string }
export interface BunyiKhas { tulisan: string; bunyi: string; info?: string; sorot?: string[]; bisu?: boolean; contoh: BunyiContoh[] }

export type SlideVisual =
  | { kind: "nada"; rows: VisualNadaRow[] }
  | { kind: "suku-kata"; rows: VisualSukuRow[] }
  | { kind: "kelompok"; groups: VisualGroup[] }
  | { kind: "jebakan"; rows: VisualJebakanRow[] }
  | {
      kind: "sejarah";
      /** [lonMin, latMin, lonMax, latMax] bingkai peta. */
      fokus: [number, number, number, number];
      peristiwa: SejarahPeristiwa[];
      wilayah?: SejarahWilayah[];
      titik?: SejarahTitik[];
      rute?: SejarahRute[];
      /** Negara (id ISO 3166 angka, mis. "156") yang diwarnai mulai `tahun`. */
      negara?: Array<{ id: string; tahun: number }>;
      stat?: SejarahStat[];
    }
  | { kind: "banding"; bahasa: string; rows: BandingRow[] }
  /** `ui: "en"` = label bawaan visual dalam bahasa Inggris (dek BIPA). */
  /** `ket` = ganti teks legenda blok merah (default "bunyinya beda dari bahasa Indonesia"), mis. Khmer "konsonan seri-o". */
  | { kind: "alfabet"; huruf: AlfabetHuruf[]; ui?: "en"; ket?: string }
  /** `vokalJudul`/`vokalKet` = ganti label kotak vokal (default "Vokal murni"). */
  | { kind: "bunyi"; vokal: BunyiVokal[]; khas: BunyiKhas[]; vokalJudul?: string; vokalKet?: string; ui?: "en" };

export interface MateriSlide {
  type: SlideType;
  heading: string;
  /** Identitas cover ikut tersimpan saat materi dibagikan ke siswa. */
  sublevel?: string;
  flagCode?: string;
  subheading?: string;
  /** points & recap */
  points?: string[];
  /** vocab */
  items?: VocabItem[];
  /** pattern */
  pattern?: string;
  examples?: ExampleItem[];
  note?: string;
  /** dialog */
  lines?: DialogLine[];
  /** quiz — pilihan ganda */
  quiz?: QuizItem[];
  /** practice — jawaban sejajar indeks dengan soal, boleh lebih pendek */
  questions?: string[];
  answers?: string[];
  /** recap */
  homework?: string;
  /** [slide-sampul-v1] Gambar latar 16:9 di /public/slide-cover kedua repo —
   *  sampul untuk slide pembuka, latar untuk jenis lain [slide-latar-v1]. */
  cover?: string;
  /** [slide-latar-v1] "kiri" = isi slide hanya di sisi kiri, karena sisi kanan
   *  gambar latarnya berisi ilustrasi yang tak boleh tertutup. */
  ruang?: "kiri";
  /** [slide-visual-v1] Diagram pengganti isi teks — lihat SlideVisual. */
  visual?: SlideVisual;
}

export interface MateriDeck {
  v: 1;
  /**
   * [slide-tts-v1] Kode bahasa target ("es", "ja") — dipakai penonton slide untuk
   * membunyikan kata yang diklik. Disimpan DI DALAM dek karena sisi siswa
   * (ClassMateriTab/SesiTimeline) tidak selalu memegang bahasa kelasnya. Dek
   * lama tanpa bidang ini tetap terbaca; katanya saja yang tidak bisa diklik.
   */
  lang?: string;
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
    example_translit: str(v?.example_translit) || undefined,
    example_meaning: str(v?.example_meaning) || undefined,
  };
}

function normExample(v: any): ExampleItem | null {
  const target = str(v?.target);
  const meaning = str(v?.meaning);
  if (!target && !meaning) return null;
  const translit = str(v?.translit);
  return translit ? { target, translit, meaning } : { target, meaning };
}

function normLine(v: any): DialogLine | null {
  const text = str(v?.text);
  if (!text) return null;
  return { speaker: str(v?.speaker), text, translit: str(v?.translit) || undefined, meaning: str(v?.meaning) || undefined };
}

function normQuiz(v: any): QuizItem | null {
  const q = str(v?.q);
  const options = strList(v?.options);
  if (!q || options.length < 2) return null;
  const a = Number(v?.answer);
  return {
    q,
    options,
    answer: Number.isInteger(a) && a >= 0 && a < options.length ? a : 0,
    explain: str(v?.explain) || undefined,
  };
}

const nada = (v: any): Nada => {
  const n = Number(v);
  return (n === 1 || n === 2 || n === 3 || n === 4 ? n : 0) as Nada;
};
const opt = (v: any) => str(v) || undefined;

/** [slide-visual-v1] Visual rusak/kosong = dibuang; slide jatuh ke tampilan teks. */
function normVisual(v: any): SlideVisual | undefined {
  if (!v || typeof v !== "object") return undefined;
  const arr = (x: any): any[] => (Array.isArray(x) ? x : []);
  if (v.kind === "nada") {
    const rows = arr(v.rows).map((r) => ({ tone: nada(r?.tone), pinyin: str(r?.pinyin), hanzi: opt(r?.hanzi), meaning: str(r?.meaning), hint: opt(r?.hint) }))
      .filter((r) => r.pinyin);
    return rows.length ? { kind: "nada", rows } : undefined;
  }
  if (v.kind === "suku-kata") {
    const rows = arr(v.rows).map((r) => ({ initial: str(r?.initial), final: str(r?.final), tone: nada(r?.tone), pinyin: str(r?.pinyin), hanzi: opt(r?.hanzi), meaning: str(r?.meaning) }))
      .filter((r) => r.pinyin && r.final);
    return rows.length ? { kind: "suku-kata", rows } : undefined;
  }
  if (v.kind === "kelompok") {
    const groups = arr(v.groups).map((g) => ({
      label: str(g?.label), big: opt(g?.big), hint: opt(g?.hint),
      chips: arr(g?.chips).map((c) => ({ text: str(c?.text), sub: opt(c?.sub), hanzi: opt(c?.hanzi), meaning: opt(c?.meaning), mark: opt(c?.mark) })).filter((c) => c.text),
    })).filter((g) => g.label || g.big);
    return groups.length ? { kind: "kelompok", groups } : undefined;
  }
  if (v.kind === "jebakan") {
    const rows = arr(v.rows).map((r) => ({ text: str(r?.text), hanzi: opt(r?.hanzi), meaning: opt(r?.meaning), wrong: str(r?.wrong), right: str(r?.right) }))
      .filter((r) => r.text && r.right);
    return rows.length ? { kind: "jebakan", rows } : undefined;
  }
  if (v.kind === "sejarah") {
    const num = (x: any) => (Number.isFinite(Number(x)) ? Number(x) : NaN);
    const ok = (o: any) => Object.values(o).every((x) => typeof x !== "number" || Number.isFinite(x));
    const peristiwa = arr(v.peristiwa).map((p) => ({ tahun: num(p?.tahun), judul: str(p?.judul), info: opt(p?.info), asli: opt(p?.asli), translit: opt(p?.translit) }))
      .filter((p) => p.judul && ok(p)).sort((a, b) => a.tahun - b.tahun);
    const f = arr(v.fokus).map(num);
    if (!peristiwa.length || f.length !== 4 || !f.every(Number.isFinite) || f[0] >= f[2] || f[1] >= f[3]) return undefined;
    const wilayah = arr(v.wilayah).map((w) => ({ lon: num(w?.lon), lat: num(w?.lat), r: num(w?.r), tahun: num(w?.tahun), label: opt(w?.label) })).filter((w) => ok(w) && w.r > 0);
    const titik = arr(v.titik).map((t) => ({ lon: num(t?.lon), lat: num(t?.lat), nama: str(t?.nama), tahun: num(t?.tahun), ...(t?.kiri === true ? { kiri: true } : null) })).filter((t) => t.nama && ok(t));
    const titikDi = (x: any) => { const d = arr(x).map(num); return d.length === 2 && d.every(Number.isFinite) ? (d as [number, number]) : undefined; };
    const rute = arr(v.rute).map((r) => ({ tahun: num(r?.tahun), label: opt(r?.label), di: titikDi(r?.di), titik: arr(r?.titik).map((p) => [num(p?.[0]), num(p?.[1])] as [number, number]).filter((p) => p.every(Number.isFinite)) }))
      .filter((r) => Number.isFinite(r.tahun) && r.titik.length >= 2);
    const negara = arr(v.negara).map((n) => ({ id: str(n?.id), tahun: num(n?.tahun) })).filter((n) => /^\d{3}$/.test(n.id) && Number.isFinite(n.tahun));
    const stat = arr(v.stat).map((x) => ({ angka: str(x?.angka), label: str(x?.label) })).filter((x) => x.angka);
    return { kind: "sejarah", fokus: f as [number, number, number, number], peristiwa, wilayah, titik, rute, negara, stat };
  }
  if (v.kind === "banding") {
    const tok = (t: any): BandingToken | null => {
      const x = str(t?.t); if (!x) return null;
      const g = Number(t?.g);
      return { t: x, tr: opt(t?.tr), arti: opt(t?.arti), g: Number.isInteger(g) && g > 0 ? g : undefined };
    };
    const rows = arr(v.rows).map((r) => ({
      aspek: str(r?.aspek), status: (["sama", "mirip", "beda"].includes(r?.status) ? r.status : "mirip") as BandingStatus,
      ringkas: str(r?.ringkas), id: arr(r?.id).map(tok).filter(Boolean) as BandingToken[],
      target: arr(r?.target).map(tok).filter(Boolean) as BandingToken[], teks: opt(r?.teks), catatan: opt(r?.catatan),
    })).filter((r) => r.aspek && r.target.length);
    return rows.length ? { kind: "banding", bahasa: str(v.bahasa) || "Bahasa target", rows } : undefined;
  }
  if (v.kind === "alfabet") {
    const huruf = arr(v.huruf).map((h) => ({
      huruf: str(h?.huruf), nama: str(h?.nama), baca: opt(h?.baca), tanda: opt(h?.tanda), info: opt(h?.info),
      ucap: opt(h?.ucap), bentuk: opt(h?.bentuk), besar: opt(h?.besar), sorot: strList(h?.sorot).length ? strList(h?.sorot) : undefined,
      contoh: arr(h?.contoh).map((c) => ({ kata: str(c?.kata), arti: str(c?.arti), ikon: opt(c?.ikon), baca: opt(c?.baca) })).filter((c) => c.kata),
    })).filter((h) => h.huruf && h.nama);
    return huruf.length ? { kind: "alfabet", huruf, ui: v.ui === "en" ? "en" : undefined, ket: opt(v.ket) } : undefined;
  }
  if (v.kind === "bunyi") {
    const vokal = arr(v.vokal).map((x) => ({
      huruf: str(x?.huruf), seperti: opt(x?.seperti), kata: str(x?.kata), arti: str(x?.arti), ikon: opt(x?.ikon), baca: opt(x?.baca),
      sorot: strList(x?.sorot).length ? strList(x?.sorot) : undefined,
    })).filter((x) => x.huruf && x.kata);
    const khas = arr(v.khas).map((x) => ({
      tulisan: str(x?.tulisan), bunyi: str(x?.bunyi), info: opt(x?.info), bisu: x?.bisu === true ? true : undefined,
      sorot: strList(x?.sorot).length ? strList(x?.sorot) : undefined,
      contoh: arr(x?.contoh).map((c) => ({ kata: str(c?.kata), baca: opt(c?.baca), arti: opt(c?.arti) })).filter((c) => c.kata),
    })).filter((x) => x.tulisan && x.contoh.length);
    return vokal.length || khas.length
      ? { kind: "bunyi", vokal, khas, vokalJudul: opt(v.vokalJudul), vokalKet: opt(v.vokalKet), ui: v.ui === "en" ? "en" : undefined }
      : undefined;
  }
  return undefined;
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
  const sublevel = str(raw.sublevel).toUpperCase();
  if (/^[ABC][12](?:\.\d+)?$/.test(sublevel)) s.sublevel = sublevel;
  const flagCode = str(raw.flagCode).toLowerCase();
  if (/^(?:[a-z]{2}|lang:[a-z]{2})$/.test(flagCode)) s.flagCode = flagCode;
  const sub = str(raw.subheading);
  if (sub) s.subheading = sub;

  if (type === "vocab") {
    s.items = (Array.isArray(raw.items) ? raw.items : []).map(normVocab).filter(Boolean) as VocabItem[];
  } else if (type === "pattern") {
    s.pattern = str(raw.pattern) || undefined;
    s.examples = (Array.isArray(raw.examples) ? raw.examples : []).map(normExample).filter(Boolean) as ExampleItem[];
    s.note = str(raw.note) || undefined;
  } else if (type === "dialog") {
    s.lines = (Array.isArray(raw.lines) ? raw.lines : []).map(normLine).filter(Boolean) as DialogLine[];
    s.note = str(raw.note) || undefined;
  } else if (type === "quiz") {
    s.quiz = (Array.isArray(raw.quiz) ? raw.quiz : []).map(normQuiz).filter(Boolean) as QuizItem[];
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
  const visual = normVisual(raw.visual);
  if (visual) s.visual = visual;
  // [slide-sampul-v1] Hanya berkas di /slide-cover — dek buatan AI atau baris
  // lama tak bisa menyelipkan gambar dari alamat lain.
  const cover = upgradeImagegenA2Cover(str(raw.cover));
  if (/^\/slide-cover\/(?:(?:spanish-themes|spanish-v2|portuguese-br|mandarin-themes|dutch-(?:a[12]-[1-4]|b1-[1-4]|b2-[1-7]))\/)?[\w.-]+$/.test(cover)) {
    // Decks saved before the illustrated artwork was ready contain the old
    // deterministic SVG path. Resolve that specific built-in asset to the
    // current session artwork, preserving uploaded/custom cover choices.
    const spanishVector = cover.match(/^\/slide-cover\/spanish-themes\/(spanish-(?:a1|a2|b1|b2)-\d)-sesi-(\d+)(-tujuan)?-vector\.svg$/);
    const currentSpanishArt = spanishVector
      ? spanishSlideArtwork(spanishVector[1], Number(spanishVector[2]))
      : null;
    s.cover = currentSpanishArt
      ? spanishVector![3] ? currentSpanishArt.objectives : currentSpanishArt.cover
      : cover;
    if (raw.ruang === "kiri" && type !== "title") s.ruang = "kiri";
  }

  const kosong =
    !s.heading && !s.subheading && !s.note && !s.pattern && !s.homework &&
    !s.points?.length && !s.items?.length && !s.examples?.length &&
    !s.questions?.length && !s.lines?.length && !s.quiz?.length && !s.visual;
  return kosong ? null : s;
}

/** Slide kosong siap diisi manual di editor. */
export function emptySlide(type: SlideType): MateriSlide {
  switch (type) {
    case "title": return { type, heading: "", subheading: "" };
    case "vocab": return { type, heading: "", items: [{ term: "", meaning: "" }] };
    case "pattern": return { type, heading: "", pattern: "", examples: [{ target: "", meaning: "" }] };
    case "dialog": return { type, heading: "", lines: [{ speaker: "A", text: "", meaning: "" }] };
    case "practice": return { type, heading: "", questions: [""], answers: [""] };
    case "quiz": return { type, heading: "", quiz: [{ q: "", options: ["", "", ""], answer: 0 }] };
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
  const lang = /^[a-z]{2,3}(-[a-z]{2,4})?$/i.test(str(raw.lang)) ? str(raw.lang).toLowerCase() : undefined;
  return { v: 1, ...(lang ? { lang } : {}), slides: slides.slice(0, MAX_SLIDES_DEK) };
}

export function serializeDeck(slides: MateriSlide[], lang?: string | null): string {
  return JSON.stringify({ v: 1, ...(lang ? { lang } : {}), slides } satisfies MateriDeck);
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
    s.lines?.forEach((l) => out.push(`${l.speaker ? `${l.speaker}: ` : ""}${l.text}${l.meaning ? ` (${l.meaning})` : ""}`));
    s.quiz?.forEach((q, qi) => {
      out.push(`${qi + 1}. ${q.q} — ${q.options.map((o, oi) => `${String.fromCharCode(65 + oi)}) ${o}`).join("  ")} → ${q.options[q.answer] ?? ""}`);
    });
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
