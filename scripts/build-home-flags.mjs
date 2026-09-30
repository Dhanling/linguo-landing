// [home-flags-subset-v1] Bangkitkan src/lib/flags/homeFlags.ts — SVG bendera
// blade-flags HANYA untuk kode yang dipakai beranda (±13 KB gzip), supaya
// beranda tak perlu mengimpor @blade-flags/core/flags/default (1,2 MB JS,
// 406 KB gzip, semua negara). Kode yang tak ada di sini tetap tergambar lewat
// RectFlag komponen (unduh set lengkap secara lazy), jadi menambah bahasa baru
// tidak merusak apa pun — jalankan ulang skrip ini supaya ikut cepat:
//   node scripts/build-home-flags.mjs
import { writeFileSync, readFileSync } from "node:fs";
import { resolveFlag } from "@blade-flags/core";
import { defaultFlags } from "@blade-flags/core/flags/default";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
// Semua literal kode ISO-2 di peta FLAG_CODES & GREETINGS beranda.
const codes = [...new Set([...page.matchAll(/(?:code|[A-Za-z]+):"([a-z]{2})"/g)].map((m) => m[1]))].sort();
const out = {};
for (const c of codes) {
  const svg = resolveFlag(defaultFlags, c, "country");
  if (svg) out[c] = svg;
}
writeFileSync(
  new URL("../src/lib/flags/homeFlags.ts", import.meta.url),
  `// BERKAS HASIL GENERATE — jangan diedit tangan. Sumber: scripts/build-home-flags.mjs\n` +
    `export const HOME_FLAGS: Record<string, string> = ${JSON.stringify(out, null, 0)};\n`,
);
console.log(`homeFlags.ts: ${Object.keys(out).length} bendera (${codes.filter((c) => !out[c]).join(",") || "semua ketemu"})`);
