// [isyarat-asl-a1a2-v1] Cek semua kode isyarat di dek ada di kamus Blender.
//   node cek_kode.mjs <dek.ts> [<dek.ts>…]   (dari mana saja; butuh tsx di worktree dashboard)
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const W = new URL(".", import.meta.url).pathname;
const tmp = `${W}out/kode-${process.pid}.json`;
const r = spawnSync("/Applications/Blender.app/Contents/MacOS/Blender", ["-b", "--factory-startup", "--python", `${W}blender/daftar_kode.py`, "--", tmp], { encoding: "utf8" });
if (r.status !== 0 || !/KODE \d+/.test(r.stdout)) { console.log(r.stdout.slice(-3000), r.stderr.slice(-2000)); process.exit(2); }
const ada = new Set(JSON.parse(readFileSync(tmp, "utf8")));
let salah = 0, total = 0;
for (const f of process.argv.slice(2)) {
  const { default: dek } = await import(pathToFileURL(f).href);
  for (const [no, slides] of Object.entries(dek)) for (const s of slides) {
    const v = s.visual; if (!v || v.kind !== "isyarat") continue;
    const kode = [...(v.tanda || []).map((t) => t.kode), ...(v.baris || []).flatMap((b) => b.urut)];
    for (const k of kode) { total++; if (k.startsWith("#")) continue; if (!ada.has(k)) { salah++; console.log(`${f.split("/").pop()} sesi ${no}: kode ${k} TIDAK ADA di kamus`); } }
  }
}
console.log(`kamus ${ada.size} kode · dicek ${total} token · ${salah} hilang`);
process.exit(salah ? 1 : 0);
