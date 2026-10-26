// [konjugasi-animasi-v1] Periksa data tabel konjugasi terhadap silabus.
// Pakai: node scripts/cek-konjugasi.mjs [slug ...]
//   - tiap tabel: berapa sesi silabus yang cocok (0 = regex-nya tak pernah kena)
//   - sesi ber-kata kunci tense yang TIDAK kena tabel mana pun (kandidat regex terlewat)
//   - validasi bentuk: segmen kosong, jenis tak dikenal, baris tanpa akar
import { build } from "esbuild";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dirK = join(root, "src/data/konjugasi");
const dirC = join(root, "src/data/curriculum/data");
const slugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(dirK).filter((f) => f.endsWith(".ts") && f !== "types.ts").map((f) => f.replace(/\.ts$/, ""));

const out = mkdtempSync(join(tmpdir(), "cek-konj-"));
const KUNCI = /konjugasi|conjugat|present|past|future|tense|lampau|masa depan|perfe[ck]t|pr[äa]sens|pass[ée]|imparfait|pret[ée]rito|futur|aorist|imperfe|-iyor|-di\b|masu|-te form|bentuk -te/i;
const JENIS = new Set(["akar", "waktu", "persona", "bantu", "lain"]);
let gagal = 0;

for (const slug of slugs) {
  await build({
    entryPoints: { [`k-${slug}`]: join(dirK, `${slug}.ts`), [`c-${slug}`]: join(dirC, `${slug}.ts`) },
    bundle: true, format: "esm", outdir: out, logLevel: "error",
  });
  const k = (await import(pathToFileURL(join(out, `k-${slug}.js`)).href)).default;
  const c = (await import(pathToFileURL(join(out, `c-${slug}.js`)).href)).default;
  const sesi = [];
  for (const lv of c.levels) for (const sub of lv.sublevels) for (const s of sub.sessions)
    sesi.push({ kode: sub.code, ...s, teks: [s.title, ...(s.topics || [])].join(" | ") });

  console.log(`\n=== ${slug} — ${k.tabel.length} tabel, ${sesi.length} sesi`);
  // sama dengan tabelUntukSesi() di src/lib/konjugasi.ts: judul dulu, topik hanya kalau judul tak kena
  const pilih = (s) => {
    const f = (teks) => k.tabel.filter((t) => t.cocok.some((r) => r.test(teks)));
    const j = f(s.title);
    return j.length ? j : f((s.topics || []).join(" | "));
  };
  const ids = new Set();
  const kena = new Set();
  for (const t of k.tabel) {
    if (ids.has(t.id)) { console.log(`  ✗ id dobel: ${t.id}`); gagal++; }
    ids.add(t.id);
    for (const b of t.baris) {
      const salah = b.bentuk.find(([teks, j]) => !teks || !JENIS.has(j));
      if (salah) { console.log(`  ✗ ${t.id} / ${b.pronomina}: segmen salah ${JSON.stringify(salah)}`); gagal++; }
      if (!b.bentuk.some(([, j]) => j === "akar")) { console.log(`  ✗ ${t.id} / ${b.pronomina}: tanpa akar`); gagal++; }
    }
    const cocok = sesi.filter((s) => pilih(s).includes(t));
    cocok.forEach((s) => kena.add(s));
    console.log(`  ${cocok.length ? "✓" : "·"} ${t.id.padEnd(26)} ${String(cocok.length).padStart(3)} sesi  ${cocok.slice(0, 4).map((s) => `${s.kode}#${s.number} ${s.title}`).join(" ; ")}`);
  }
  const terlewat = sesi.filter((s) => !kena.has(s) && KUNCI.test(s.teks));
  if (terlewat.length) {
    console.log(`  ? kata kunci tense tapi tak kena tabel (${terlewat.length}):`);
    terlewat.slice(0, 15).forEach((s) => console.log(`      ${s.kode}#${s.number} ${s.title}`));
  }
}
rmSync(out, { recursive: true, force: true });
if (gagal) { console.log(`\n${gagal} galat`); process.exit(1); }
