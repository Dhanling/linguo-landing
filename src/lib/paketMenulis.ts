// [slide-menulis-v1] Slide "Latihan Menulis · Part N" untuk bahasa beraksara non-Latin.
//
// Permintaan owner 13 Nov 2026: menu slide punya latihan menulis untuk siswa —
// satu sesi cukup beberapa huruf saja (Part 1, Part 2, …), dan saat ditulis live di
// Linguo Meet tulisan siswa terbaca pengajar dan sebaliknya. Mandarin lebih ke
// mengenal JENIS goresan (笔画) dulu, baru Hanzi.
//
// Hurufnya diambil dari katalog Latihan Menulis (writingScripts.ts, tahap 1 = huruf)
// lalu dipotong per ±5 huruf. Slide-nya disisipkan otomatis ke dek A1 (lihat
// dekSilabus.rapikanDek): sesi ke-n sepanjang A1.1–A1.3 = Part n. Tidak ada data
// yang ditulis ke berkas dek — tambah huruf di katalog = slide ikut berubah.
//
// Berkas ini KEMBAR dengan linguo-admin-dashboard/src/lib/paketMenulis.ts (beda jalur impor).

import { SCRIPT_LANGS, type ScriptLang, type ScriptSet, type SumberGoresan } from "@/lib/writingScripts";
import type { MateriSlide, MenulisHuruf } from "@/lib/materiSlides";

export interface PaketTulis {
  /** ScriptLang.key, mis. "ja", "ar", "he". */
  aksara: string;
  /** ScriptSet.id asal hurufnya ("zh-bihua" untuk goresan dasar Mandarin). */
  set: string;
  /** Nama set ("Hiragana", "Huruf hijaiyah", "Goresan dasar (笔画)"). */
  label: string;
  part: number;
  huruf: MenulisHuruf[];
}

/* Bahasa daerah & Melayu diajarkan dengan huruf Latin di kelas Linguo — aksaranya
   (Jawi, hanacaraka, Sunda, Bali, Batak, Lontara) tetap ada di menu Latihan
   Menulis, tapi tidak disisipkan ke dek A1-nya. */
const BUKAN_DEK = new Set(["ms", "jv", "su", "ban", "bbc", "bug"]);

/** Aksara non-Latin untuk satu bahasa (slug dek "japanese" atau nama "Bahasa Jepang"). */
export function aksaraUntukBahasa(nama: string | null | undefined): ScriptLang | null {
  const n = String(nama ?? "").trim();
  if (!n) return null;
  const kena = SCRIPT_LANGS.find((l) => l.key === n) ?? SCRIPT_LANGS.find((l) => l.match.test(n));
  return kena && !BUKAN_DEK.has(kena.key) ? kena : null;
}

export const bahasaAksara = (key: string): ScriptLang | null => SCRIPT_LANGS.find((l) => l.key === key) ?? null;

/* ── Goresan dasar Hanzi (笔画) ─────────────────────────────────────────────
   `c` = aksara blok CJK Strokes (datanya di goresan/bihua.ts), `u` = nama Hanzi-nya
   (yang dibunyikan TTS — aksara goresan sendiri tak bisa diucapkan). */
const b = (c: string, r: string, u: string, n: string): MenulisHuruf => ({ c, r, u, n });
const BIHUA: MenulisHuruf[] = [
  b("㇐", "héng", "横", "mendatar · 一 二 三"),
  b("㇑", "shù", "竖", "tegak · 十 中"),
  b("㇒", "piě", "撇", "menyapu ke kiri · 人 八"),
  b("㇔", "diǎn", "点", "titik · 六 文"),
  b("㇏", "nà", "捺", "menyapu ke kanan · 人 大"),
  b("㇀", "tí", "提", "naik ke kanan · 我 打"),
  b("㇕", "héngzhé", "横折", "mendatar lalu tegak · 口 日"),
  b("㇖", "hénggōu", "横钩", "mendatar lalu kait · 写 你"),
  b("㇚", "shùgōu", "竖钩", "tegak lalu kait · 小 水"),
  b("㇙", "shùtí", "竖提", "tegak lalu naik · 以 长"),
  b("㇗", "shùzhé", "竖折", "tegak lalu mendatar · 山 出"),
  b("㇜", "piězhé", "撇折", "menyapu lalu mendatar · 么 去"),
  b("㇛", "piědiǎn", "撇点", "menyapu lalu titik · 女 好"),
  b("㇇", "héngpiě", "横撇", "mendatar lalu menyapu · 又 水"),
  b("㇟", "shùwāngōu", "竖弯钩", "tegak, belok, kait · 七 儿"),
  b("㇂", "xiégōu", "斜钩", "miring lalu kait · 我 找"),
  b("㇃", "wògōu", "卧钩", "lengkung rebah lalu kait · 心 想"),
  b("㇆", "héngzhégōu", "横折钩", "mendatar, tegak, kait · 月 门"),
  b("㇁", "wāngōu", "弯钩", "lengkung lalu kait · 了 家"),
  b("㇊", "héngzhétí", "横折提", "mendatar, tegak, naik · 说 话"),
  b("㇄", "shùwān", "竖弯", "tegak lalu belok · 四 西"),
  b("㇈", "héngzhéwāngōu", "横折弯钩", "mendatar, turun, belok, kait · 九 几"),
  b("㇠", "héngxiégōu", "横斜钩", "mendatar lalu miring kait · 风 飞"),
];
const SET_BIHUA = { id: "zh-bihua", label: "Goresan dasar (笔画)" };

/** Sumber urutan goresan untuk huruf dari set ini. */
export function sumberGoresanPaket(aksara: string, set: string): SumberGoresan | undefined {
  if (set === SET_BIHUA.id) return "linguo:bihua";
  return bahasaAksara(aksara)?.sets.find((s) => s.id === set)?.strokes;
}

/** Huruf yang benar-benar ditulis di papan (pasangan Kiril "Аа" → "а"). */
export const teksTulis = (h: MenulisHuruf) => h.t ?? h.c;
/** Teks yang dibunyikan TTS. */
export const teksUcap = (h: MenulisHuruf) => h.u ?? h.t ?? h.c;

/* Kana dipotong per baris gojūon (a, ka, sa, … ya, ra, wa) supaya Part-nya sama
   dengan urutan buku pelajaran; set lain per 5 huruf. */
const UKURAN: Record<string, number[]> = {
  "ja-hiragana": [5, 5, 5, 5, 5, 5, 5, 3, 5, 3],
  "ja-katakana": [5, 5, 5, 5, 5, 5, 5, 3, 5, 3],
};

function potong<T>(isi: T[], ukuran?: number[]): T[][] {
  const out: T[][] = [];
  if (ukuran) {
    let i = 0;
    for (const n of ukuran) { if (i < isi.length) out.push(isi.slice(i, i + n)); i += n; }
    if (i < isi.length) out.push(isi.slice(i));
    return out;
  }
  for (let i = 0; i < isi.length; i += 5) out.push(isi.slice(i, i + 5));
  // Sisa 1–2 huruf tak layak jadi satu Part sendiri — gabung ke Part sebelumnya.
  if (out.length > 1 && out[out.length - 1].length < 3) out[out.length - 2].push(...out.pop()!);
  return out;
}

const keHuruf = (s: ScriptSet) => (g: ScriptSet["glyphs"][number]): MenulisHuruf => ({
  c: g.c, r: g.r,
  ...(g.n ? { n: g.n } : null),
  ...(s.pair && g.c.length > 1 ? { t: g.c.slice(-1) } : null),
});

const cachePaket = new Map<string, PaketTulis[]>();

/** Semua Part untuk satu aksara, urut belajar: (goresan dasar →) set huruf tahap 1. */
export function paketAksara(aksara: string): PaketTulis[] {
  const ada = cachePaket.get(aksara);
  if (ada) return ada;
  const lang = bahasaAksara(aksara);
  if (!lang) return [];
  const sumber: Array<{ id: string; label: string; huruf: MenulisHuruf[] }> = [];
  if (lang.key === "zh") sumber.push({ ...SET_BIHUA, huruf: BIHUA });
  lang.sets
    .filter((s) => (s.stage ?? 1) === 1 && !s.frasa)
    .forEach((s) => sumber.push({ id: s.id, label: s.label, huruf: s.glyphs.map(keHuruf(s)) }));
  const out: PaketTulis[] = [];
  sumber.forEach((s) => {
    potong(s.huruf, UKURAN[s.id]).forEach((huruf) => {
      out.push({ aksara: lang.key, set: s.id, label: s.label, part: out.length + 1, huruf });
    });
  });
  cachePaket.set(aksara, out);
  return out;
}

/** Judul Part yang ringkas untuk daftar: "Part 3 · Hiragana · さしすせそ". */
export const judulPaket = (p: PaketTulis) =>
  `Part ${p.part} · ${p.label} · ${p.huruf.map((h) => teksTulis(h)).join(" ")}`;

/** Slide Latihan Menulis untuk satu paket. */
export function slidePaket(p: PaketTulis): MateriSlide {
  return {
    type: "points",
    heading: `Latihan Menulis · Part ${p.part}`,
    subheading: p.aksara === "zh" && p.set === SET_BIHUA.id
      ? "Goresan dasar Hanzi (笔画) — kenali bentuk dan arah tiap goresan"
      : `${p.label} — tulis tiap huruf mengikuti urutan goresannya`,
    visual: { kind: "menulis", aksara: p.aksara, set: p.set, label: p.label, part: p.part, huruf: p.huruf },
  };
}

/** Slide Latihan Menulis untuk sesi `no` (1–16) di sublevel A1.x; null = bukan
 *  A1, bahasa beraksara Latin, atau Part-nya sudah habis. */
export function slideMenulisSesi(slug: string, code: string, no: number): MateriSlide | null {
  const m = /^A1\.(\d)$/i.exec(String(code || "").trim());
  if (!m || !(no >= 1)) return null;
  const lang = aksaraUntukBahasa(slug);
  if (!lang) return null;
  const urut = (Number(m[1]) - 1) * 16 + no;
  const p = paketAksara(lang.key)[urut - 1];
  return p ? slidePaket(p) : null;
}

/** Paket dari slide menulis (untuk membuka papan Tulis Bersama di Linguo Meet). */
export function paketDariSlide(s: MateriSlide | null | undefined): PaketTulis | null {
  const v = s?.visual;
  if (!v || v.kind !== "menulis") return null;
  return { aksara: v.aksara, set: v.set, label: v.label, part: v.part, huruf: v.huruf };
}
