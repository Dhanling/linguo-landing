// ⚠️ KEMBAR dengan linguo-admin-dashboard/src/lib/terjemahDek.ts — bedanya cuma
// jalur AI (di sini /api/slide-translate) dan pilihan bawaan ikut bahasa UI siswa.
// [slide-terjemah-en-v1] Pilihan bahasa terjemahan slide: Indonesia (bawaan) atau
// English. Dek silabus ditulis untuk pelajar Indonesia — arti kosakata, arti
// contoh/dialog, penjelasan pola, catatan, soal & pembahasan kuis berbahasa
// Indonesia. Untuk siswa yang tak bisa bahasa Indonesia (ekspat, kelas internasional)
// pengajar bisa memilih "EN": bidang-bidang ITU saja diterjemahkan ke English lewat
// AI murah; kata/kalimat bahasa target, cara baca, dan jawaban tak disentuh.
//
// Hemat token: cache PER KALIMAT (memori + localStorage, maks 8.000 entri), jadi
// kalimat yang sama di dek lain / sesi berikutnya tak pernah dikirim ulang.
import type { MateriSlide } from "@/lib/materiSlides";
import type { ArtiKata, HasilArti } from "@/lib/ebookKata";
import { getUiLang } from "@/lib/uiLang";

/* Salinan opsiBahasaTarget (dashboard SlideDeckViewer): pilihan kuis berbahasa
   target tidak diterjemahkan. */
function opsiBahasaTarget(soal: string, opsi: string): boolean {
  const o = opsi.trim();
  if (!o || /\d/.test(o) || /^[[/].*[\]/]$/.test(o) || !/\p{L}/u.test(o)) return false;
  return !/(^|[\s(:])['"‘“«「『][^'"‘’“”«»」』]+['"’”»」』](?=$|[\s.,?!:;)…])/.test(soal);
}

export type BahasaArti = "id" | "en";

const K_PILIHAN = "slide_bahasa_arti";
const K_CACHE = "slide-terjemah-en:v1";
const MAKS_CACHE = 8000;
const PER_PANGGIL = 80;

/** Pilihan tersimpan; belum pernah memilih → ikut bahasa UI dashboard siswa. */
export function bacaBahasaArti(): BahasaArti {
  try {
    const v = localStorage.getItem(K_PILIHAN);
    if (v === "en" || v === "id") return v;
  } catch { /* mode privat */ }
  return getUiLang() === "en" ? "en" : "id";
}
export function simpanBahasaArti(b: BahasaArti) {
  try { localStorage.setItem(K_PILIHAN, b); } catch { /* mode privat */ }
}

let cache: Record<string, string> | null = null;
const muat = () => {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(K_CACHE) || "{}") || {}; } catch { cache = {}; }
  return cache!;
};
const simpan = () => {
  const c = muat();
  const k = Object.keys(c);
  if (k.length > MAKS_CACHE) k.slice(0, k.length - MAKS_CACHE).forEach((x) => delete c[x]);
  try { localStorage.setItem(K_CACHE, JSON.stringify(c)); } catch { /* penuh — memori saja */ }
};

/* Bidang yang berisi bahasa Indonesia (arti/penjelasan). Bidang bahasa target
   (term, target, text, example, translit, answers, hanzi, pinyin, t, tr, kata,
   huruf, gloss, …) sengaja TIDAK ada di sini. */
const KUNCI_ID = new Set([
  "heading", "subheading", "points", "note", "homework", "questions",
  "meaning", "example_meaning", "q", "explain",
  "hint", "label", "judul", "info", "ringkas", "catatan", "arti", "ket", "aspek",
  "seperti", "vokalJudul", "vokalKet", "speaker",
]);

type Setel = (v: string) => void;

/** Telusuri slide; panggil `kena(teks, setel)` untuk tiap string berbahasa Indonesia. */
function telusuri(slides: MateriSlide[], kena: (teks: string, setel: Setel) => void) {
  const jalan = (o: any, konteks: { banding?: boolean; soal?: string }) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach((x) => jalan(x, konteks)); return; }
    const banding = konteks.banding || o.kind === "banding";
    for (const k of Object.keys(o)) {
      const v = o[k];
      // Baris "id" di perbandingan = kalimat Indonesia yang dibandingkan — dibiarkan.
      if (banding && k === "id") continue;
      // Kolom tabel berbahasa target: labelnya nama bentuk target, biarkan.
      if (k === "label" && o.target === true) continue;
      if (k === "options" && Array.isArray(v) && typeof o.q === "string") {
        v.forEach((op: unknown, i: number) => {
          // Kuis listening: pilihannya selalu arti (Indonesia).
          if (typeof op === "string" && op.trim() && (o.audio || !opsiBahasaTarget(o.q, op))) kena(op, (t) => { v[i] = t; });
        });
        continue;
      }
      if (KUNCI_ID.has(k)) {
        if (typeof v === "string" && v.trim()) kena(v, (t) => { o[k] = t; });
        else if (Array.isArray(v)) v.forEach((x, i) => { if (typeof x === "string" && x.trim()) kena(x, (t) => { v[i] = t; }); });
        continue;
      }
      if (v && typeof v === "object") jalan(v, { banding });
    }
  };
  jalan(slides, {});
}

/** Terjemahan yang sudah tersimpan saja (tanpa AI). null = ada yang belum. */
export function dekEnTersimpan(slides: MateriSlide[]): MateriSlide[] | null {
  const c = muat();
  const salin: MateriSlide[] = JSON.parse(JSON.stringify(slides));
  let kurang = false;
  telusuri(salin, (teks, setel) => { const t = c[teks]; if (t) setel(t); else kurang = true; });
  return kurang ? null : tandaiEn(salin);
}

/** [slide-terjemah-en-v2] Tandai dek English → label bawaan slide ikut English. */
function tandaiEn(d: MateriSlide[]): MateriSlide[] {
  d.forEach((x) => { x.ui = "en"; });
  return d;
}

const berjalan = new Map<string, Promise<void>>();

async function terjemahkanKumpulan(teks: string[], bahasaTarget?: string | null) {
  const res = await fetch("/api/slide-translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ t: teks, language: bahasaTarget || "" }),
  });
  const json = (await res.json().catch(() => null)) as { t?: unknown } | null;
  const out = Array.isArray(json?.t) ? json!.t : null;
  if (!out || out.length !== teks.length) throw new Error("Terjemahan gagal");
  const c = muat();
  teks.forEach((s, i) => { const t = String(out[i] ?? "").trim(); if (t) c[s] = t; });
  simpan();
}

/** Dek dengan arti & penjelasan berbahasa English. Bentuk slide tak berubah. */
export async function terjemahkanDekEn(slides: MateriSlide[], bahasaTarget?: string | null): Promise<MateriSlide[]> {
  const ada = dekEnTersimpan(slides);
  if (ada) return ada;
  const c = muat();
  const perlu = new Set<string>();
  telusuri(JSON.parse(JSON.stringify(slides)), (teks) => { if (!c[teks]) perlu.add(teks); });
  const daftar = [...perlu];
  const tugas: Promise<void>[] = [];
  for (let i = 0; i < daftar.length; i += PER_PANGGIL) {
    const potong = daftar.slice(i, i + PER_PANGGIL);
    const kunci = potong.join("\u0001");
    let p = berjalan.get(kunci);
    if (!p) {
      p = terjemahkanKumpulan(potong, bahasaTarget).finally(() => berjalan.delete(kunci));
      berjalan.set(kunci, p);
    }
    tugas.push(p);
  }
  const hasil = await Promise.allSettled(tugas);
  const salin: MateriSlide[] = JSON.parse(JSON.stringify(slides));
  telusuri(salin, (teks, setel) => { const t = muat()[teks]; if (t) setel(t); });
  tandaiEn(salin);
  if (hasil.some((h) => h.status === "rejected") && hasil.every((h) => h.status === "rejected")) {
    throw new Error("Terjemahan English gagal");
  }
  return salin;
}

/* ── [slide-terjemah-en-v2] Arti kata yang diklik (ebook-kata menjawab dalam
   bahasa Indonesia) → English, lewat cache kalimat yang sama. ─────────────── */
const KELAS_EN: Record<string, string> = {
  "kata benda": "noun", "kata kerja": "verb", "kata sifat": "adjective", "kata ganti": "pronoun",
  "kata depan": "preposition", "kata seru": "interjection", "angka": "number", "kata keterangan": "adverb",
  "kata sambung": "conjunction", "partikel": "particle", "kata bilangan": "numeral",
};
const kelasEn = (k: string) => KELAS_EN[k.trim().toLowerCase()] ?? muat()[k];

/** Versi English dari cache saja; undefined = belum ada. */
export function artiKataEnTersimpan(h: ArtiKata): ArtiKata | undefined {
  const a = h.arti ? muat()[h.arti] : "";
  const k = h.kelas ? kelasEn(h.kelas) : "";
  if (a === undefined || k === undefined) return undefined;
  return { ...h, arti: a || h.arti, kelas: k || h.kelas };
}

export async function artiKataEn(h: ArtiKata): Promise<HasilArti> {
  const ada = artiKataEnTersimpan(h);
  if (ada) return ada;
  const perlu = [h.arti, h.kelas && !KELAS_EN[h.kelas.trim().toLowerCase()] ? h.kelas : ""].filter((x) => x && !muat()[x]);
  try { if (perlu.length) await terjemahkanKumpulan(perlu); } catch { return h; }
  return artiKataEnTersimpan(h) ?? h;
}
