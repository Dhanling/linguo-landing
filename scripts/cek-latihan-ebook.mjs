// [ebook-latihan-interaktif-v1] Pemeriksa cepat: jumlah potongan `answers[k]` wajib sama dengan jumlah `items`.
import { readdirSync, readFileSync } from "node:fs";
const slug = process.argv[2] ?? "fr-a1";
const dir = `content/ebook/${slug}`;
let salah = 0;
for (const f of readdirSync(dir).filter((x) => /^unit-\d+\.json$/.test(x)).sort()) {
  const u = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
  (u.exercises ?? []).forEach((e, i) => {
    const a = (u.answers ?? [])[i];
    if (a === undefined) { console.log(`${f} soal ${i + 1}: kunci HILANG`); salah++; return; }
    const n = a.split(" — ").length;
    if (n !== e.items.length) { console.log(`${f} soal ${i + 1}: ${e.items.length} item vs ${n} kunci`); salah++; }
    e.items.forEach((it) => {
      const susun = it.includes(" / ");
      const isian = it.includes("____");
      if (susun && isian) { console.log(`${f} soal ${i + 1}: item campur " / " dan "____" → ${it}`); salah++; }
    });
  });
  if ((u.answers ?? []).length !== (u.exercises ?? []).length) { console.log(`${f}: jumlah answers != exercises`); salah++; }
}
console.log(salah ? `${salah} masalah` : "semua latihan cocok");
