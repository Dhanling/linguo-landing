// Pemeriksa cepat berkas unit e-book: kunci jawaban vs jumlah soal, bentuk blok,
// dan kolom tabel yang tidak rata. Dipakai saat merakit modul baru.
import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug) { console.error("pakai: node scripts/cek-unit-ebook.mjs <slug>"); process.exit(1); }
const dir = path.join("content/ebook", slug);
const JENIS_BLOK = new Set(["p", "list", "tabel", "kotak", "sub"]);
let salah = 0;
const lapor = (f, pesan) => { console.log(`  ✗ ${f}: ${pesan}`); salah++; };

const cekBlok = (f, blocks, dari) => {
  for (const [i, b] of (blocks ?? []).entries()) {
    if (!JENIS_BLOK.has(b.type)) lapor(f, `${dari} blok ${i}: type "${b.type}" tak dikenal`);
    if (b.type === "tabel") {
      const lebar = b.head.length;
      b.rows.forEach((r, j) => { if (r.length !== lebar) lapor(f, `${dari} blok ${i} baris ${j}: ${r.length} sel, kepala ${lebar}`); });
    }
  }
};

let totalSoal = 0, totalHal = 0;
const berkas = fs.readdirSync(dir).filter((n) => /^unit-\d+\.json$/.test(n)).sort();
for (const f of berkas) {
  const u = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  for (const k of ["title", "title_target", "goal", "bekal", "dialogs", "sections", "vocab", "exercises", "answers"])
    if (u[k] == null) lapor(f, `kunci "${k}" hilang`);
  u.exercises?.forEach((e, i) => {
    totalSoal += e.items.length;
    const kunci = u.answers?.[String(i)];
    if (kunci == null) return lapor(f, `latihan ${i}: kunci jawaban hilang`);
    const potong = kunci.split(" — ");
    if (potong.length !== e.items.length) lapor(f, `latihan ${i}: kunci ${potong.length} potong, soal ${e.items.length}`);
    e.items.forEach((it, j) => {
      const susun = it.includes(" / "), isian = it.includes("____");
      if (susun && isian) lapor(f, `latihan ${i} soal ${j}: ada " / " dan "____" sekaligus`);
    });
  });
  u.dialogs?.forEach((d, i) => {
    cekBlok(f, d.grammars?.flatMap((g) => g.table ? [{ type: "tabel", ...g.table }] : []), `dialog ${i} kotak`);
    d.lines?.forEach((l, j) => { if (!l.text || !l.id) lapor(f, `dialog ${i} baris ${j}: text/id kosong`); });
  });
  u.sections?.forEach((s, i) => cekBlok(f, s.blocks, `bagian ${i}`));
  const vocabKunci = new Set(u.vocab?.map((v) => Object.keys(v).join(",")));
  if (vocabKunci.size > 1) lapor(f, `kosakata punya bentuk kunci campur: ${[...vocabKunci].join(" | ")}`);
}

const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
["front", "back"].forEach((k) => (meta[k] ?? []).forEach((h, i) => cekBlok("meta.json", h.blocks, `${k}[${i}]`)));

console.log(`\n${berkas.length} unit • ${totalSoal} soal • ${salah} masalah`);
process.exit(salah ? 1 : 0);
