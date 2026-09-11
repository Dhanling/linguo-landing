#!/usr/bin/env node
/* [ebook-transkrip-audio-v1] Naskah Listening di modul persiapan tes → MP3 yang
   benar-benar bisa didengarkan siswa.
 *
 * Kenapa ada: unit Listening 1–4 IELTS Prep memuat naskah lengkapnya, tapi
 * naskah yang cuma DIBACA melatih Reading, bukan Listening — dan PDF yang
 * dicetak Chromium headless tak bisa memuat audio yang bisa diputar. Jadi
 * audionya dibuat sekali di sini, disimpan di bucket PUBLIK `lms-audio`, dan
 * URL-nya ditulis balik ke berkas unit sebagai `audio` pada blok transkripnya.
 * Dari situ perakit (build-ebook-pdf.mjs) menyalinnya ke berkas soal dan reader
 * dashboard memunculkan tombol "Putar audio" (laporan Faujiah 11 Sep 2026).
 *
 * Pipa TTS-nya BUKAN pipa TTS reader (src/lib/ebookTts.ts — satu suara, maks 400
 * karakter per panggilan, buat mengucapkan satu kata yang diketuk), melainkan
 * pipa Simulasi: edge function `simulation-tts` di repo linguo-admin-dashboard
 * (OpenAI gpt-4o-mini-tts → upload ke `lms-audio` → balikin {audio_url}). Itu
 * satu-satunya tempat kunci OpenAI kantor dipegang, dan hasilnya sudah terbukti
 * dipakai audio simulasi IELTS.
 *
 * Kenapa dipanggil SEPOTONG-SEPOTONG, bukan sekali per naskah:
 *  1. `simulation-tts` menolak teks di atas 4.000 karakter, sementara naskah
 *     Part 3 & Part 4 panjangnya 4.4k–4.7k karakter;
 *  2. mode dua suaranya (`voice2` + splitBySpeaker) cuma mengenali penanda
 *     "Speaker 1:/2:", "A:/B:", "S1:" — penutur di naskah kita bernama
 *     ("Receptionist", "Dr Reid"), jadi seluruh naskah akan dibaca satu suara;
 *  3. unit-03 punya TIGA penutur (Dr Reid, Josh, Mina) dan mode dua suara cuma
 *     punya dua. Penutur ketiga tidak boleh diam-diam mewarisi suara yang salah.
 * Jadi: naskah dipecah per GILIRAN bicara, tiap giliran di-TTS dengan suara
 * penuturnya sendiri (mode satu suara), lalu byte MP3-nya digabung berurutan —
 * cara gabung yang sama dengan yang dipakai `simulation-tts` untuk dua suara,
 * dan jeda kecil antar potongan justru membuat percakapannya terdengar wajar.
 * Sisa unggahan sementara di `lms-audio/simulations/` dihapus di ujung.
 *
 * Pakai:
 *   node scripts/ebook-transkrip-audio.mjs ielts-prep            # yang belum ada audionya
 *   node scripts/ebook-transkrip-audio.mjs ielts-prep --unit 3   # satu unit saja
 *   node scripts/ebook-transkrip-audio.mjs ielts-prep --ulang    # timpa audio yang sudah ada
 *   node scripts/ebook-transkrip-audio.mjs ielts-prep --kering   # cuma laporan, tanpa panggilan
 *
 * Env dibaca dari .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "lms-audio";
const FN = "simulation-tts";
/** Batas aman per panggilan — edge function menolak di 4.000. */
const BATAS_POTONG = 3400;

const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith("--"));
const ULANG = argv.includes("--ulang");
const KERING = argv.includes("--kering");
const unitPilih = (() => {
  const i = argv.indexOf("--unit");
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : null;
})();

if (!slug) {
  console.error("pakai: node scripts/ebook-transkrip-audio.mjs <slug> [--unit N] [--ulang] [--kering]");
  process.exit(1);
}

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
}
const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_SB = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KERING && (!URL_SB || !KEY_SB)) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum ada di .env.local");
  process.exit(1);
}

const DIR = `content/ebook/${slug}`;
if (!existsSync(DIR)) { console.error(`${DIR} tidak ada`); process.exit(1); }

/* ── suara per penutur ──────────────────────────────────────────────────────
   Pemetaannya DITULIS TANGAN, bukan diputar otomatis dari daftar: yang menentukan
   suara mana yang pas bukan urutan kemunculan, tapi siapa penuturnya — petugas
   front office, mahasiswa laki-laki, dosen. Nama yang belum terdaftar jatuh ke
   rotasi di bawahnya (tetap beda antar penutur dalam satu naskah), dan namanya
   dicetak di log supaya bisa didaftarkan kalau hasilnya kurang pas.
   Suara yang tersedia di simulation-tts: alloy echo fable onyx nova shimmer ash sage coral. */
const SUARA_PENUTUR = {
  // unit-01 — pendaftaran kursus (dua penutur)
  receptionist: "nova",     // petugas perempuan, ramah, tempo tenang
  caller: "onyx",           // penelepon laki-laki
  // unit-02 — monolog ranger di taman
  ranger: "ash",            // pemandu laki-laki, di luar ruangan, lebih bertenaga
  // unit-03 — diskusi tutorial, TIGA penutur: tiap orang dapat suaranya sendiri,
  // jadi tak ada yang mewarisi suara orang lain (mode dua suara edge function
  // tidak dipakai justru karena cuma menyediakan dua).
  "dr reid": "sage",        // tutor perempuan, lebih senior
  josh: "onyx",             // mahasiswa laki-laki
  mina: "shimmer",          // mahasiswa perempuan, beda warna dari tutornya
  // unit-04 — kuliah
  lecturer: "fable",        // dosen, gaya ceramah
};
const ROTASI = ["nova", "onyx", "sage", "ash", "shimmer", "echo"];

/** Gaya bicara yang diminta ke gpt-4o-mini-tts. Naskah IELTS dibacakan dengan
 *  aksen British, tempo ujian (tidak dramatis, tidak dipercepat). */
const GAYA_DIALOG = "Read in a natural British English accent, as a real person speaking in a recorded IELTS Listening test. Conversational, steady pace, clear consonants. Do not dramatise.";
const GAYA_MONOLOG = "Read in a natural British English accent as an IELTS Listening monologue (Part 2/Part 4): measured, informative, slight pauses at commas. Do not dramatise.";

/* ── pembantu ──────────────────────────────────────────────────────────────── */

const sb = KERING ? null : createClient(URL_SB, KEY_SB, { auth: { persistSession: false } });

/** Giliran bicara: baris berurutan dari penutur yang sama digabung jadi satu. */
function giliran(lines) {
  const out = [];
  for (const l of lines ?? []) {
    const penutur = String(l.speaker ?? "").trim();
    const teks = String(l.text ?? "").trim();
    if (!teks) continue;
    const akhir = out[out.length - 1];
    if (akhir && akhir.penutur === penutur) akhir.teks += " " + teks;
    else out.push({ penutur, teks });
  }
  return out;
}

/** Giliran yang lebih panjang dari batas dipecah di ujung kalimat. */
function potong(teks, batas = BATAS_POTONG) {
  if (teks.length <= batas) return [teks];
  const kalimat = teks.match(/[^.!?]+[.!?]*\s*/g) ?? [teks];
  const out = [];
  let kini = "";
  for (const k of kalimat) {
    if (kini && (kini + k).length > batas) { out.push(kini.trim()); kini = ""; }
    // Satu kalimat yang sendirian sudah melewati batas dipotong keras per kata.
    if (k.length > batas) {
      for (const kata of k.split(/\s+/)) {
        if ((kini + " " + kata).length > batas) { out.push(kini.trim()); kini = ""; }
        kini += (kini ? " " : "") + kata;
      }
      continue;
    }
    kini += k;
  }
  if (kini.trim()) out.push(kini.trim());
  return out;
}

/** Satu panggilan ke edge function → URL publik MP3 potongan. */
async function ttsPotong(teks, voice, instructions, coba = 0) {
  const res = await fetch(`${URL_SB}/functions/v1/${FN}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY_SB}`,
      apikey: KEY_SB,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: teks, voice, instructions }),
  });
  const isi = await res.json().catch(() => ({}));
  if (!res.ok || !isi?.audio_url) {
    const pesan = `${FN} ${res.status}: ${isi?.error ?? "tanpa audio_url"}`;
    // Sekali ulang: kuota/ketimpangan jaringan sering sembuh di percobaan kedua.
    if (coba < 1) {
      console.log(`    ↻ ${pesan} — ulang`);
      await new Promise((r) => setTimeout(r, 2500));
      return ttsPotong(teks, voice, instructions, coba + 1);
    }
    throw new Error(pesan);
  }
  return isi.audio_url;
}

const unduh = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`unduh ${url} → ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

/** `…/object/public/lms-audio/simulations/tts-x.mp3` → `simulations/tts-x.mp3` */
const jalurBucket = (url) => url.split(`/object/public/${BUCKET}/`)[1] ?? null;

/* ── penulisan balik ke berkas unit ────────────────────────────────────────
   Yang ditulis cuma SATU kunci di dalam baris blok transkripnya, lewat sulih teks
   pada berkas mentahnya — bukan JSON.parse → JSON.stringify. Berkas unit ditulis
   tangan dengan susunan baris yang rapat (satu baris per baris dialog); round-trip
   JSON akan merapikan ulang seluruh berkas dan membuat diff-nya tak terbaca. */
function tulisAudio(berkas, url) {
  const raw = readFileSync(berkas, "utf8");
  /* Blok bisa ditulis rapat (`{"type": "transkrip", "title": …` — unit 1, 3, 4) ATAU
     bertingkat dengan `"type"` di baris sendiri (unit 2). Pola lama cuma kenal yang
     rapat, jadi unit 2 sempat gagal SESUDAH MP3-nya terunggah. Spasi/baris baru di
     antara kunci dipertahankan apa adanya — `jeda` dipakai ulang sebagai pemisah. */
  const pola = /(\{\s*"type":\s*"transkrip",)(\s*)(?:"audio":\s*"[^"]*",\s*)?/;
  if (!pola.test(raw)) throw new Error(`blok transkrip tak ditemukan di ${berkas}`);
  writeFileSync(berkas, raw.replace(pola, (_, kepala, jeda) =>
    `${kepala}${jeda}"audio": ${JSON.stringify(url)},${jeda || " "}`), "utf8");
}

/* ── jalan ─────────────────────────────────────────────────────────────────── */

const berkasUnit = readdirSync(DIR).filter((f) => /^unit-\d+\.json$/.test(f)).sort();
const sampah = [];
let dibuat = 0;
let dilewati = 0;

for (const f of berkasUnit) {
  const no = Number(f.match(/\d+/)[0]);
  if (unitPilih && no !== unitPilih) continue;
  const u = JSON.parse(readFileSync(`${DIR}/${f}`, "utf8"));
  const blok = (u.sections ?? []).flatMap((s) => s.blocks ?? []).find((b) => b.type === "transkrip");
  if (!blok) continue;

  const turn = giliran(blok.lines);
  const penutur = [...new Set(turn.map((t) => t.penutur).filter(Boolean))];
  const huruf = turn.reduce((a, t) => a + t.teks.length, 0);
  console.log(`\n${f} · ${turn.length} giliran · ${huruf} huruf · penutur: ${penutur.join(", ") || "(tanpa nama)"}`);

  if (blok.audio && !ULANG) {
    console.log(`  → sudah ada audio (${blok.audio}) — lewati, pakai --ulang untuk menimpa`);
    dilewati++;
    continue;
  }

  // Suara per penutur: peta tangan dulu, sisanya rotasi yang belum terpakai.
  const suara = new Map();
  for (const p of penutur) {
    const pilih = SUARA_PENUTUR[p.toLowerCase()];
    if (pilih) suara.set(p, pilih);
  }
  for (const p of penutur) {
    if (suara.has(p)) continue;
    const sisa = ROTASI.find((v) => ![...suara.values()].includes(v)) ?? ROTASI[0];
    suara.set(p, sisa);
    console.log(`  ⚠️  penutur "${p}" belum ada di SUARA_PENUTUR — dipakai "${sisa}"`);
  }
  for (const [p, v] of suara) console.log(`  ${p} → ${v}`);

  const gaya = penutur.length > 1 ? GAYA_DIALOG : GAYA_MONOLOG;
  const potongan = turn.flatMap((t) => potong(t.teks).map((teks) => ({ teks, voice: suara.get(t.penutur) ?? ROTASI[0] })));
  console.log(`  ${potongan.length} panggilan TTS`);
  if (KERING) continue;

  const bagian = [];
  for (const [i, p] of potongan.entries()) {
    const url = await ttsPotong(p.teks, p.voice, gaya);
    const jalur = jalurBucket(url);
    if (jalur) sampah.push(jalur);
    bagian.push(await unduh(url));
    process.stdout.write(`\r  TTS ${i + 1}/${potongan.length}`);
  }
  const mp3 = Buffer.concat(bagian);
  const jalurAkhir = `ebook/${slug}/unit-${String(no).padStart(2, "0")}.mp3`;
  const { error } = await sb.storage.from(BUCKET)
    .upload(jalurAkhir, mp3, { contentType: "audio/mpeg", upsert: true, cacheControl: "3600" });
  if (error) throw new Error(`unggah ${jalurAkhir} gagal: ${error.message}`);
  const publik = `${URL_SB}/storage/v1/object/public/${BUCKET}/${jalurAkhir}`;
  tulisAudio(`${DIR}/${f}`, publik);
  console.log(`\n  ✓ ${jalurAkhir} (${Math.round(mp3.length / 1024)} KB) → ${f} dapat "audio"`);
  dibuat++;
}

/* Potongan mentahnya sudah ikut tergabung di berkas akhir — yang tertinggal di
   `simulations/` cuma sisa kerja, dan bucket audio LMS dipakai bersama fitur
   lain. Dibersihkan sebaik-bisa: gagal hapus bukan alasan menggagalkan hasil. */
if (sampah.length && sb) {
  const { error } = await sb.storage.from(BUCKET).remove(sampah);
  console.log(error ? `⚠️  ${sampah.length} potongan sementara gagal dibersihkan: ${error.message}`
    : `✓ ${sampah.length} potongan sementara dibersihkan`);
}

console.log(`\n${dibuat} naskah dapat audio · ${dilewati} dilewati${KERING ? " · (kering: tak ada panggilan)" : ""}`);
if (dibuat) console.log("Rakit ulang modulnya: node scripts/build-ebook-pdf.mjs " + slug);
