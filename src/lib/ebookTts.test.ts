/* [ebook-jaga-bahasa-id-v2] Uji penjagaan "hanya bahasa target yang boleh
   diketuk", diadu dengan ISI MODUL yang sungguh dijual — bukan kalimat contoh
   karangan. Tiap ruas di content/ebook sudah menyebut bahasanya sendiri
   (`vocab[].es` bahasa target, `vocab[].id` artinya, tabel bawa `head`), jadi
   berkas modul itu sendiri yang jadi kunci jawabannya.

   Angka ambangnya sengaja longgar: penjagaannya heuristik, dan yang dijaga
   adalah arahnya — kata Indonesia yang lolos harus tinggal segelintir, sambil
   kalimat bahasa target tetap boleh diketuk. */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { kataIndonesia, klausaKata } from "./ebookTts";

const AKAR = path.join(process.cwd(), "content/ebook");
const MIRING = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g;
const KEPALA_ID = /arti|makna|indonesia|terjemah/i;
const KEPALA_BACA = /cara baca|baca|pelafalan|romaji|rōmaji/i;

type Contoh = { kata: string; konteks: string };
const id: Contoh[] = [];
const target: Contoh[] = [];

const pecah = (s: string) => String(s).split(/[^\p{L}\p{N}'’-]+/u).filter(Boolean);
function kumpul(bak: Contoh[], teks: unknown) {
  if (typeof teks !== "string") return;
  for (const kata of pecah(teks)) if (kata.length >= 3) bak.push({ kata, konteks: teks });
}
function teksId(s: unknown) {
  if (typeof s !== "string") return;
  for (const m of s.matchAll(MIRING)) kumpul(target, m[1]);
  kumpul(id, s.replace(MIRING, " "));
}
const daftarId = (v: unknown) => (Array.isArray(v) ? v : [v]).forEach(teksId);

function blok(b: any) {
  if (!b || typeof b !== "object") return;
  if (b.type === "tabel" && Array.isArray(b.rows)) {
    const kepala: string[] = Array.isArray(b.head) ? b.head : [];
    for (const baris of b.rows) {
      (Array.isArray(baris) ? baris : []).forEach((sel: unknown, i: number) => {
        const judul = String(kepala[i] ?? "");
        if (KEPALA_BACA.test(judul)) return; // kolom cara baca: bukan bahasa mana pun
        if (KEPALA_ID.test(judul) || (!kepala.length && i > 0)) teksId(sel);
        else kumpul(target, sel);
      });
    }
    return;
  }
  teksId(b.title);
  if (b.type === "sub") kumpul(target, b.text);
  else teksId(b.text);
  daftarId(b.items);
  (b.blocks || []).forEach(blok);
}

for (const modul of fs.readdirSync(AKAR)) {
  const dir = path.join(AKAR, modul);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const berkas of fs.readdirSync(dir)) {
    if (!berkas.endsWith(".json")) continue;
    const j = JSON.parse(fs.readFileSync(path.join(dir, berkas), "utf8"));
    teksId(j.title); kumpul(target, j.title_target); teksId(j.goal); daftarId(j.bekal);
    for (const d of j.dialogs || []) {
      kumpul(target, d.title); teksId(d.intro);
      for (const l of d.lines || []) { kumpul(target, l.text); teksId(l.id); teksId(l.literal); }
    }
    for (const s of j.sections || []) { teksId(s.title); (s.blocks || []).forEach(blok); }
    for (const v of j.vocab || []) { kumpul(target, v.es); kumpul(target, v.ja); teksId(v.id); }
    for (const e of j.exercises || []) { teksId(e.title); teksId(e.prompt); daftarId(e.items); }
    daftarId(j.answers);
    for (const hal of [...(j.front || []), ...(j.back || [])]) { teksId(hal.title); (hal.blocks || []).forEach(blok); }
  }
}

/* Prosa Indonesia di modul memang menyisipkan kata bahasa target tanpa tanda
   miring ("Jawabnya: *Soy* de Indonesia" ditulis apa adanya di kunci jawaban &
   soal latihan), jadi contoh yang dipungut dari ruas Indonesia disaring dulu:
   kata yang juga muncul di ruas bahasa target BUKAN kata Indonesia, dan tak
   boleh ikut dihitung sebagai kebocoran. */
const KATA_TARGET = new Set(target.map((c) => c.kata.toLowerCase()));
const KATA_ID = new Set(id.map((c) => c.kata.toLowerCase()));
const ascii = (k: string) => !/[^\u0000-\u007F]/.test(k);
const contohId = id.filter((c) => !KATA_TARGET.has(c.kata.toLowerCase()) && ascii(c.kata));
/* Kebalikannya juga: judul bagian & kepala tabel sesekali berbahasa Indonesia
   walau duduk di ruas bahasa target ("Cara baca", "Arti"), jadi kata yang juga
   muncul di prosa Indonesia tak dihitung sebagai bahasa target. */
const contohTarget = target.filter((c) => !KATA_ID.has(c.kata.toLowerCase()));

describe("kataIndonesia — hanya bahasa yang dipelajari yang boleh diketuk", () => {
  it("modulnya terbaca", () => {
    expect(contohId.length).toBeGreaterThan(5000);
    expect(contohTarget.length).toBeGreaterThan(2000);
  });

  it("kata Indonesia di modul praktis semua terkunci", () => {
    const lolos = contohId.filter((c) => !kataIndonesia(c.kata, "es", c.konteks));
    console.log("kata Indonesia masih bisa diketuk:", (lolos.length / contohId.length * 100).toFixed(2) + "%");
    expect(lolos.length / contohId.length).toBeLessThan(0.06);
  });

  it("kata bahasa target tetap boleh diketuk", () => {
    const terkunci = contohTarget.filter((c) => kataIndonesia(c.kata, "es", c.konteks));
    console.log("kata bahasa target ikut terkunci:", (terkunci.length / contohTarget.length * 100).toFixed(2) + "%");
    expect(terkunci.length / contohTarget.length).toBeLessThan(0.03);
  });

  it("kata Indonesia biasa yang dulu lolos sekarang terkunci", () => {
    const kalimat = "Jawabnya lengkap: Hoy es martes, doce de agosto.";
    for (const kata of ["Jawabnya", "lengkap"]) {
      expect(kataIndonesia(kata, "es", kalimat)).toBe(true);
    }
    // …tanpa ikut membungkam bahasa Spanyol di klausa sebelahnya.
    for (const kata of ["Hoy", "martes", "agosto"]) {
      expect(kataIndonesia(kata, "es", kalimat)).toBe(false);
    }
  });

  it("rōmaji Jepang tak tertipu akhiran -kan", () => {
    // "toshokan" (perpustakaan) & "eigakan" (bioskop) berekor sama dengan
    // "dengarkan", tapi di modul Jepang itu justru kata yang mau didengar.
    for (const kata of ["toshokan", "eigakan", "nijikan"]) {
      expect(kataIndonesia(kata, "ja", `${kata} ni ikimasu`)).toBe(false);
      expect(kataIndonesia(kata, "es", `${kata} ni ikimasu`)).toBe(true);
    }
  });

  it("modul BIPA: bahasa Indonesia justru bahasa targetnya", () => {
    expect(kataIndonesia("rumah", "id", "rumah besar")).toBe(false);
  });

  it("klausaKata memenggal di tanda baca", () => {
    expect(klausaKata("Jawabnya lengkap: Hoy es martes", "hoy")).toBe("Hoy es martes");
  });
});
