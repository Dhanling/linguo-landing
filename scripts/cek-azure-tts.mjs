#!/usr/bin/env node
/* [tts-azure-minoritas-v1] Pemeriksa jalur Azure Speech untuk /api/tts.
 *
 *   node scripts/cek-azure-tts.mjs            → cocokkan AZURE_VOICES dengan katalog live
 *   node scripts/cek-azure-tts.mjs is "Góðan daginn"  → sintesis contoh → dist/azure-is.mp3
 *
 * Kunci dibaca dari AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (env atau .env.local).
 * Jalankan SEBELUM menambah baris ke AZURE_VOICES di src/lib/ttsVoice.ts: nama
 * voice dipakai apa adanya sebagai folder cache, jadi nama yang salah = 502
 * di produksi tanpa satu pun galat waktu build.
 */
import fs from "node:fs";
import path from "node:path";

for (const f of [".env.local", ".env"]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*(AZURE_SPEECH_KEY|AZURE_SPEECH_REGION)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const KEY = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION;
if (!KEY || !REGION) {
  console.error("AZURE_SPEECH_KEY / AZURE_SPEECH_REGION belum ada (env atau .env.local).");
  process.exit(1);
}

// Peta voice dibaca langsung dari sumbernya supaya tak pernah melenceng.
const src = fs.readFileSync(path.join("src", "lib", "ttsVoice.ts"), "utf8");
const blok = src.match(/export const AZURE_VOICES[^{]*\{([\s\S]*?)\n\};/)?.[1] || "";
const PETA = {};
for (const m of blok.matchAll(/(\w+):\s*\{\s*locale:\s*"([^"]+)",\s*voice:\s*"([^"]+)"\s*\}/g)) {
  PETA[m[1]] = { locale: m[2], voice: m[3] };
}
const FORMAT = src.match(/AZURE_FORMAT = "([^"]+)"/)?.[1] || "audio-24khz-48kbitrate-mono-mp3";

const [kode, ...sisa] = process.argv.slice(2);

if (!kode) {
  const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
    headers: { "Ocp-Apim-Subscription-Key": KEY },
  });
  if (!res.ok) { console.error("voices/list gagal:", res.status, await res.text()); process.exit(1); }
  const semua = await res.json();
  const ada = new Map(semua.map((v) => [v.ShortName, v]));
  let salah = 0;
  for (const [k, { locale, voice }] of Object.entries(PETA)) {
    const v = ada.get(voice);
    if (v) {
      console.log(`✓ ${k.padEnd(3)} ${voice.padEnd(24)} ${v.Gender.padEnd(6)} ${v.VoiceType}`);
    } else {
      salah++;
      const alt = semua.filter((x) => x.Locale.toLowerCase() === locale.toLowerCase()).map((x) => x.ShortName);
      console.log(`✗ ${k.padEnd(3)} ${voice} TIDAK ADA — pilihan ${locale}: ${alt.join(", ") || "(nihil)"}`);
    }
  }
  console.log(`\n${Object.keys(PETA).length} bahasa diperiksa, ${salah} salah nama. Katalog: ${semua.length} suara.`);
  process.exit(salah ? 2 : 0);
}

const v = PETA[kode];
if (!v) { console.error(`kode "${kode}" tidak ada di AZURE_VOICES`); process.exit(1); }
const teks = sisa.join(" ") || "Halló";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${v.locale}"><voice name="${v.voice}">${esc(teks)}</voice></speak>`;
const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
  method: "POST",
  headers: {
    "Ocp-Apim-Subscription-Key": KEY,
    "Content-Type": "application/ssml+xml",
    "X-Microsoft-OutputFormat": FORMAT,
    "User-Agent": "linguo-tts-cek",
  },
  body: ssml,
});
if (!res.ok) { console.error("sintesis gagal:", res.status, await res.text()); process.exit(1); }
const buf = Buffer.from(await res.arrayBuffer());
fs.mkdirSync("dist", { recursive: true });
const out = path.join("dist", `azure-${kode}.mp3`);
fs.writeFileSync(out, buf);
console.log(`✓ ${v.voice}: ${buf.length} byte → ${out}`);
