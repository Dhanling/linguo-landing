// Susun satu unit: kalimat (.rapi.wav) + token ejaan (.wav) dengan hening tetap → MP3 mono 128k ternormalisasi.
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const N = await import(`./naskah-${String(process.argv[2]).padStart(2, "0")}.mjs`), { BARIS } = N;
// Monolog (ranger, kuliah) boleh menimpa jeda lewat export JEDA di naskah: antar kalimat & antar paragraf.
const HURUF = 0.45, ANGKA = 0.35, GRUP = 0.8, AWAL = 0.5, { ANTAR = 0.3, GILIRAN = 0.5 } = N.JEDA ?? {};
const sil = (d) => { const f = `k/s${d}.wav`; execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(d), "-c:a", "pcm_s16le", f]); return `file '${f}'`; };
const S = Object.fromEntries([HURUF, ANGKA, GRUP, ANTAR, GILIRAN, AWAL].map((d) => [d, sil(d)]));
const d = [S[AWAL]];
BARIS.forEach(([, ...bag], i) => {
  if (i) d.push(S[GILIRAN]);
  bag.forEach((x, b) => {
    if (b) d.push(S[ANTAR]);
    if (typeof x === "string") return d.push(`file 'k/${i}-${b}.rapi.wav'`);
    const tok = x.eja.split(" ");
    tok.forEach((t, j) => {
      if (t === "|") return d.push(S[GRUP]);
      if (j && tok[j - 1] !== "|") d.push(S[x.j === "h" ? HURUF : ANGKA]);
      d.push(`file 'k/${i}-${b}-${j}.wav'`);
    });
  });
});
d.push(S[AWAL]);
writeFileSync("daftar.txt", d.join("\n"));
const out = process.argv[3];
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "daftar.txt", "-af", "loudnorm=I=-16:TP=-1.5", "-ac", "1", "-ar", "44100", "-b:a", "128k", out]);
console.log(out, execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString().trim(), "detik");
