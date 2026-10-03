// [placement-bank-acak-v1] Cetak SQL pengisi placement_question_bank untuk satu bahasa:
// soal tetap di src/data/placement/<bahasa>.ts + stok tambahan di folder ini.
// Baris yang sudah ada TIDAK ditimpa (on conflict do nothing) — suntingan tim
// Kurikulum di database aman kalau skrip ini dijalankan ulang.
//
//   node --experimental-strip-types scripts/placement-bank/seed.mjs english > /tmp/seed.sql
import { soalDariBank } from "../../src/lib/placementBank.ts";

const BAHASA = {
  english: async () => [
    ...(await import("../../src/data/placement/english.ts")).englishPlacementTest,
    ...(await import("./english.mjs")).englishBankTambahan,
  ],
};

const slug = process.argv[2];
if (!BAHASA[slug]) { console.error("Bahasa belum punya stok: " + slug); process.exit(1); }
const soal = await BAHASA[slug]();

const kunci = new Set();
const baris = soal.map((q) => {
  const { id, difficulty, ...payload } = q;
  if (kunci.has(id)) throw new Error("qkey kembar: " + id);
  kunci.add(id);
  const b = { qkey: id, difficulty, is_listening: !!q.audio, payload, last_seen: null };
  if (!/^[a-z0-9-]{1,40}$/.test(id) || !soalDariBank(b)) throw new Error("Soal tidak utuh: " + id);
  const json = JSON.stringify(payload);
  if (json.includes("$pb$")) throw new Error("Payload memuat $pb$: " + id);
  return `('${slug}', '${id}', '${difficulty}', ${b.is_listening}, $pb$${json}$pb$::jsonb)`;
});

console.log(
  "insert into public.placement_question_bank (language_slug, qkey, difficulty, is_listening, payload) values\n" +
  baris.join(",\n") +
  "\non conflict (language_slug, qkey) do nothing;",
);
console.error(`${slug}: ${baris.length} soal`);
