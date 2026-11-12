/* [slide-sifat-pasangan-v1] [slide-pola-warna-v1] Permintaan owner 12 Nov 2026
   (Danish A1, Linguo Meet), berlaku untuk SEMUA bahasa tanpa menyunting data dek:
   1. Kosakata kata sifat tampil BERPASANGAN lawan katanya — kiri "murah", kanan
      "mahal" di baris yang sama; kartu gabungan "billig / dyr — murah / mahal"
      dipecah jadi dua kartu.
   2. Slide pola: rumus "en + kata sifat + kata benda → en rød bil" digambar dua
      baris (label slot di atas, kata contoh sejajar di bawahnya) dan kata sifat /
      kata benda / kata kerja dibedakan warnanya, juga di kartu contoh. */
import type { MateriSlide } from "@/lib/materiSlides";

type VocabItem = NonNullable<MateriSlide["items"]>[number];
type ExampleItem = NonNullable<MateriSlide["examples"]>[number];

/* ── 1. Pasangan lawan kata ─────────────────────────────────────────────── */

/** Lawan kata menurut ARTI (Indonesia / Inggris), jadi berlaku untuk bahasa apa pun. */
const ANTONIM: Array<[string, string]> = [
  ["besar", "kecil"], ["baru", "lama"], ["baru", "tua"], ["muda", "tua"], ["baik", "buruk"],
  ["bagus", "jelek"], ["bagus", "buruk"], ["cantik", "jelek"], ["indah", "jelek"], ["tampan", "jelek"],
  ["murah", "mahal"], ["panjang", "pendek"], ["tinggi", "pendek"], ["tinggi", "rendah"],
  ["panas", "dingin"], ["hangat", "sejuk"], ["cepat", "lambat"], ["cepat", "pelan"],
  ["mudah", "sulit"], ["mudah", "susah"], ["gampang", "susah"], ["banyak", "sedikit"],
  ["ramai", "sepi"], ["bersih", "kotor"], ["berat", "ringan"], ["kaya", "miskin"],
  ["senang", "sedih"], ["bahagia", "sedih"], ["gembira", "sedih"], ["dekat", "jauh"],
  ["terang", "gelap"], ["lebar", "sempit"], ["luas", "sempit"], ["tebal", "tipis"],
  ["kuat", "lemah"], ["gemuk", "kurus"], ["keras", "lunak"], ["keras", "lembut"],
  ["penuh", "kosong"], ["sehat", "sakit"], ["benar", "salah"], ["basah", "kering"],
  ["manis", "pahit"], ["enak", "tidak enak"], ["pintar", "bodoh"], ["rajin", "malas"],
  ["lapar", "kenyang"], ["sibuk", "santai"], ["sibuk", "luang"], ["aman", "berbahaya"],
  ["halus", "kasar"], ["terbuka", "tertutup"], ["buka", "tutup"], ["hidup", "mati"],
  ["rapi", "berantakan"], ["awal", "akhir"], ["pagi", "malam"], ["mentah", "matang"],
  ["segar", "basi"], ["tajam", "tumpul"], ["lurus", "bengkok"], ["ramah", "galak"],
  ["sopan", "kasar"], ["berani", "takut"], ["berani", "penakut"], ["jujur", "bohong"],
  ["kuno", "modern"], ["tenang", "gugup"], ["tenang", "berisik"], ["sunyi", "berisik"],
  // English (dek ber-UI English)
  ["big", "small"], ["large", "small"], ["new", "old"], ["young", "old"], ["good", "bad"],
  ["beautiful", "ugly"], ["pretty", "ugly"], ["cheap", "expensive"], ["long", "short"],
  ["tall", "short"], ["high", "low"], ["hot", "cold"], ["warm", "cool"], ["fast", "slow"],
  ["easy", "difficult"], ["easy", "hard"], ["many", "few"], ["clean", "dirty"],
  ["heavy", "light"], ["rich", "poor"], ["happy", "sad"], ["near", "far"], ["close", "far"],
  ["bright", "dark"], ["wide", "narrow"], ["thick", "thin"], ["strong", "weak"],
  ["fat", "thin"], ["full", "empty"], ["open", "closed"], ["right", "wrong"],
  ["wet", "dry"], ["early", "late"], ["busy", "free"], ["quiet", "noisy"], ["quiet", "loud"],
  ["safe", "dangerous"], ["soft", "hard"], ["sweet", "bitter"], ["healthy", "sick"],
];
const LAWAN = new Map<string, Set<string>>();
for (const [a, b] of ANTONIM) {
  if (!LAWAN.has(a)) LAWAN.set(a, new Set());
  if (!LAWAN.has(b)) LAWAN.set(b, new Set());
  LAWAN.get(a)!.add(b);
  LAWAN.get(b)!.add(a);
}

/** "tua, lama (orang)" → ["tua", "lama"]. */
function artiInti(meaning: string): string[] {
  return meaning.toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .split(/[,;/]|\batau\b|\bor\b/)
    .map((x) => x.replace(/^\s*(sangat|amat|yang|very|to be)\s+/, "").replace(/[.!?'"]/g, "").trim())
    .filter(Boolean);
}

function berlawanan(a: string, b: string): boolean {
  const xs = artiInti(a), ys = artiInti(b);
  return xs.some((x) => ys.some((y) => LAWAN.get(x)?.has(y)));
}

/** "billig / dyr — murah / mahal" → dua kartu, HANYA kalau kedua arti memang berlawanan. */
function pecahGabungan(it: VocabItem): VocabItem[] {
  const t = it.term.split(/\s+\/\s+/), m = (it.meaning || "").split(/\s+\/\s+/);
  if (t.length !== 2 || m.length !== 2 || !berlawanan(m[0], m[1])) return [it];
  const tl = it.translit?.split(/\s+\/\s+/);
  const ke = (i: number): VocabItem => {
    const satu: VocabItem = { ...it, term: t[i].trim(), meaning: m[i].trim(), translit: tl?.length === 2 ? tl[i].trim() : undefined };
    delete satu.example; delete satu.example_meaning; delete satu.example_translit;
    return satu;
  };
  const a = ke(0), b = ke(1);
  if (it.example) {
    // Contohnya ikut kartu yang katanya muncul di kalimat itu (kalau tak ketemu: kartu pertama).
    const milikB = it.example.toLowerCase().includes(t[1].trim().toLowerCase()) && !it.example.toLowerCase().includes(t[0].trim().toLowerCase());
    Object.assign(milikB ? b : a, { example: it.example, example_meaning: it.example_meaning, example_translit: it.example_translit });
  }
  return [a, b];
}

/** Urutkan kartu kosakata supaya lawan kata duduk sebaris (indeks genap = kiri,
 *  ganjil = kanan di grid dua kolom). Tanpa pasangan sama sekali → urutan asli. */
const JUDUL_SIFAT = /kata sifat|adjekti|adjecti|adjektiv|形容|sifat/i;
export function pasangkanLawanKata(items: VocabItem[], heading = ""): VocabItem[] {
  const semua = items.flatMap(pecahGabungan);
  const pakai = new Set<number>();
  const pasangan: Array<[number, number]> = [];
  for (let i = 0; i < semua.length; i++) {
    if (pakai.has(i)) continue;
    for (let j = i + 1; j < semua.length; j++) {
      if (pakai.has(j) || !berlawanan(semua[i].meaning || "", semua[j].meaning || "")) continue;
      pakai.add(i); pakai.add(j); pasangan.push([i, j]);
      break;
    }
  }
  // Slide campuran (uang, cuaca, huruf) yang kebetulan memuat sepasang lawan kata
  // tidak diacak: hanya slide kata sifat, atau yang separuh kartunya berpasangan.
  if (!pasangan.length || (!JUDUL_SIFAT.test(heading) && pasangan.length * 2 < semua.length / 2)) return items;
  return [
    ...pasangan.flatMap(([i, j]) => [semua[i], semua[j]]),
    ...semua.filter((_, i) => !pakai.has(i)),
  ];
}

/* ── 2. Pola kalimat berwarna ───────────────────────────────────────────── */

export type Peran = "sifat" | "benda" | "kerja";
export const WARNA_PERAN: Record<Peran, { teks: string; latar: string }> = {
  sifat: { teks: "#C2410C", latar: "#FFEDD5" },
  benda: { teks: "#1D4ED8", latar: "#DBEAFE" },
  kerja: { teks: "#7E22CE", latar: "#F3E8FF" },
};

const POLA_PERAN: Array<[Peran, RegExp]> = [
  ["sifat", /kata sifat|adjekti\w*|adjecti\w*|\bsifat\b/gi],
  ["benda", /kata benda|\bnomina\b|\bnouns?\b|\bbenda\b/gi],
  ["kerja", /kata kerja|\bverba\b|\bverbs?\b|\bkerja\b/gi],
];
const SUMBER_PERAN = /kata sifat|adjekti\w*|adjecti\w*|\bsifat\b|kata benda|\bnomina\b|\bnouns?\b|\bbenda\b|kata kerja|\bverba\b|\bverbs?\b|\bkerja\b/.source;
/* Regex BARU tiap pemakaian: regex global berbagi `lastIndex` (test() lalu
   matchAll() dulu mulai dari tengah teks dan melewatkan frasa pertama). */
const semuaPeran = () => new RegExp(SUMBER_PERAN, "gi");
const ADA_PERAN = new RegExp(SUMBER_PERAN, "i");

export function peranFrasa(f: string): Peran | null {
  for (const [p, re] of POLA_PERAN) if (new RegExp(re.source, "i").test(f)) return p;
  return null;
}

/** Potong teks jadi kepingan biasa + frasa peran ("kata sifat") supaya bisa diwarnai. */
export function kepingPeran(teks: string): Array<{ t: string; peran: Peran | null }> {
  const out: Array<{ t: string; peran: Peran | null }> = [];
  let akhir = 0;
  for (const m of teks.matchAll(semuaPeran())) {
    if (m.index! > akhir) out.push({ t: teks.slice(akhir, m.index), peran: null });
    out.push({ t: m[0], peran: peranFrasa(m[0]) });
    akhir = m.index! + m[0].length;
  }
  if (akhir < teks.length) out.push({ t: teks.slice(akhir), peran: null });
  return out;
}

export interface Slot { teks: string; peran: Peran | null }
export interface SegmenPola {
  slot: Slot[];
  /** Kata contoh per slot (sejajar) — null kalau contoh tak bisa disejajarkan. */
  sejajar: string[][] | null;
  /** Contoh setelah "→" apa adanya. */
  contoh?: string;
}

const RTL = /[֐-ࣿ]/;
const TANPA_SPASI = /[぀-ヿ㐀-鿿฀-๿]/;
const TEPI = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu; // sama dengan TEPI di SlideDeckViewer (Ucap)
const kataDari = (t: string) => t.split(/\s+/).map((w) => w.replace(TEPI, "")).filter((w) => /\p{L}/u.test(w));

/** Satu slot peran = satu kata; slot lain = kata literalnya. Placeholder ([subjek],
 *  …) panjangnya tak pasti → tak bisa disejajarkan. `ketat` = SEMUA kata literal
 *  harus sama (dipakai saat mencocokkan potongan di tengah kalimat). */
/** Slot pengganti satu kata ("artikel", "[subjek]") — bukan kata literal. */
const BEBAS = /^\[?\s*(artikel|article|subjek|subject|objek|object|nama|name|angka|number|tempat|place|waktu|time|kata ganti|pronomina?|pronoun|posesif|possessive|preposisi|preposition|orang|person)\s*\]?$/i;
const bebas = (x: Slot) => !x.peran && BEBAS.test(x.teks.trim());

function sejajarkanKata(slot: Slot[], kata: string[], ketat: boolean): string[][] | null {
  const panjang = slot.map((s) => (s.peran || bebas(s) ? 1 : /[[\]…]|\.\.\./.test(s.teks) ? -1 : kataDari(s.teks).length));
  if (panjang.some((n) => n < 1) || panjang.reduce((a, b) => a + b, 0) !== kata.length) return null;
  const out: string[][] = [];
  let i = 0, sama = 0, literal = 0;
  for (let k = 0; k < slot.length; k++) {
    const potong = kata.slice(i, i + panjang[k]);
    if (!slot[k].peran && !bebas(slot[k])) {
      const lit = kataDari(slot[k].teks).map((w) => w.toLowerCase());
      potong.forEach((w, n) => { literal++; if (w.toLowerCase() === lit[n]) sama++; });
    }
    out.push(potong);
    i += panjang[k];
  }
  // Literal pembeda ("en", "Den er") harus ada yang sama, kalau tidak ini kalimat lain.
  // Tanpa literal sama sekali, kecocokan sekadar jumlah kata baru dipercaya mulai 3 slot.
  if (literal ? (ketat ? sama < literal : !sama) : slot.length < 3) return null;
  return out;
}

function sejajarkan(slot: Slot[], kalimat: string): string[][] | null {
  if (RTL.test(kalimat) || TANPA_SPASI.test(kalimat)) return null;
  return sejajarkanKata(slot, kataDari(kalimat), false);
}

/** Cari potongan kalimat yang persis mengikuti rumus ("Det er [en ny taske]").
 *  Hanya rumus yang punya kata literal — tanpa itu, potongan mana pun "cocok". */
function cariPotongan(segmen: SegmenPola[], kata: string[]): Array<Peran | null> | null {
  for (const seg of segmen) {
    if (seg.slot.length < 2 || seg.slot.every((x) => x.peran || bebas(x))) continue;
    const L = seg.slot.reduce((a, x) => a + (x.peran || bebas(x) ? 1 : kataDari(x.teks).length), 0);
    for (let m = 0; m + L <= kata.length; m++) {
      const cocok = sejajarkanKata(seg.slot, kata.slice(m, m + L), true);
      if (!cocok) continue;
      const per: Array<Peran | null> = kata.map(() => null);
      let i = m;
      cocok.forEach((ws, k) => ws.forEach(() => { per[i++] = seg.slot[k].peran; }));
      return per;
    }
  }
  return null;
}

/** Urai rumus pola. null = rumus tak menyebut kata sifat/benda/kerja (tampilan lama). */
export function uraiPola(pattern?: string, examples: ExampleItem[] = []): SegmenPola[] | null {
  if (!pattern) return null;
  if (!ADA_PERAN.test(pattern)) return null;
  const segmen = pattern.split(/\s+·\s+|\n+/).map((x) => x.trim()).filter(Boolean);
  const out: SegmenPola[] = [];
  for (const seg of segmen) {
    const [kiri, ...kanan] = seg.split(/\s*→\s*/);
    const contoh = kanan.join(" → ").trim() || undefined;
    const bagian = kiri.split(/\s+\+\s+/).map((x) => x.trim()).filter(Boolean);
    // Kurung tak berpasangan di satu slot ("(+ в/от + konteks)") → rumus bebas, bukan deret slot.
    if (bagian.some((b) => (b.match(/\(/g) || []).length !== (b.match(/\)/g) || []).length)) return null;
    const slot = bagian.map((teks) => {
      const jenis = new Set(kepingPeran(teks).map((k) => k.peran).filter(Boolean));
      return { teks, peran: jenis.size === 1 && kataDari(teks.replace(semuaPeran(), "")).length <= 1 ? [...jenis][0] as Peran : null };
    });
    let sejajar = contoh && slot.length > 1 ? sejajarkan(slot, contoh) : null;
    // Rumus tanpa "→ contoh": baris kedua diambil dari kartu contoh pertama yang pas.
    if (!sejajar && !contoh && slot.length > 1 && slot.some((x) => x.peran)) {
      for (const e of examples) {
        sejajar = sejajarkan(slot, e.target.split(/(?<=[.!?])\s+/)[0]);
        if (sejajar) break;
      }
    }
    out.push({ slot, contoh, sejajar });
  }
  return out;
}

/** Warna tiap KATA (urutan kata berhuruf) di kalimat contoh, dari rumus slide-nya.
 *  Kalimat yang tak cocok rumus mana pun: kata yang di contoh lain sudah ketahuan
 *  perannya ikut diwarnai. */
export function warnaContoh(segmen: SegmenPola[] | null, examples: ExampleItem[]): Array<Array<Peran | null>> {
  if (!segmen) return examples.map(() => []);
  const dikenal = new Map<string, Peran>();
  const hasil = examples.map((e) => {
    const kalimat = e.target.split(/(?<=[.!?])\s+/);
    const per: Array<Peran | null> = [];
    let lengkap = true;
    for (const k of kalimat) {
      let cocok: string[][] | null = null, s: SegmenPola | undefined;
      for (const seg of segmen) {
        if (seg.slot.length < 2) continue;
        cocok = sejajarkan(seg.slot, k);
        if (cocok) { s = seg; break; }
      }
      if (cocok && s) {
        cocok.forEach((ws, i) => ws.forEach((w) => {
          const p = s!.slot[i].peran;
          per.push(p);
          if (p) dikenal.set(w.toLowerCase(), p);
        }));
      } else {
        const kata = RTL.test(k) || TANPA_SPASI.test(k) ? [] : kataDari(k);
        const potongan = kata.length ? cariPotongan(segmen, kata) : null;
        if (potongan) potongan.forEach((p, i) => { per.push(p); if (p) dikenal.set(kata[i].toLowerCase(), p); });
        else { lengkap = false; kataDari(k).forEach(() => per.push(null)); }
      }
    }
    return { e, per, lengkap };
  });
  // Contoh di rumus sendiri ("→ en rød bil") juga sumber kata yang dikenal.
  for (const seg of segmen) seg.sejajar?.forEach((ws, i) => ws.forEach((w) => { const p = seg.slot[i].peran; if (p) dikenal.set(w.toLowerCase(), p); }));
  return hasil.map(({ e, per, lengkap }) => {
    if (lengkap) return per;
    const kata = kataDari(e.target);
    return kata.map((w, i) => per[i] ?? dikenal.get(w.toLowerCase()) ?? null);
  });
}
