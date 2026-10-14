// Sintesis semua klip (eleven_v4). Klip yang sudah ada dilewati → aman diulang.
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { SUARA, BARIS } from "./naskah.mjs";
const env = readFileSync("/Users/muhamadlutfiramadhani/linguo-landing/.env.local", "utf8");
const KEY = env.match(/^ELEVENLABS_API_KEY=(.*)$/m)[1].trim();
const UCAP = { W: "Double-u.", H: "Aitch." };
async function tts(id, text, f) {
  for (let coba = 0; ; coba++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_128`, {
      method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: "eleven_v4", voice_settings: { stability: 0.5, similarity_boost: 0.8 } }) });
    const b = Buffer.from(await r.arrayBuffer());
    if (r.ok) return writeFileSync(f, b);
    if (coba >= 2) throw new Error(`${f} ${r.status} ${b.toString().slice(0, 160)}`);
    await new Promise((s) => setTimeout(s, 3000));
  }
}
const ketat = (i, o) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", i, "-af",
  "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.03,areverse,afade=t=in:d=0.01",
  "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le", o]);
const tugas = [], teks = [];
BARIS.forEach(([sp, ...bag], i) => bag.forEach((x, b) => {
  const f = `k/${i}-${b}`;
  if (typeof x === "string") { teks.push(`${f}.mp3`); tugas.push(() => tts(SUARA[sp], x, `${f}.mp3`)); }
  else x.eja.split(" ").forEach((t, j) => t !== "|" && tugas.push(async () => {
    await tts(SUARA[sp], UCAP[t] ?? (t.length === 1 ? `${t}.` : `${t[0].toUpperCase()}${t.slice(1)}.`), `${f}-${j}.mp3`);
    ketat(`${f}-${j}.mp3`, `${f}-${j}.wav`); }));
}));
const sisa = tugas;
for (let i = 0; i < sisa.length; i += 6) { await Promise.all(sisa.slice(i, i + 6).map((t) => t())); process.stdout.write("."); }
writeFileSync("teks.txt", teks.join("\n"));
console.log("\n", tugas.length, "klip");
