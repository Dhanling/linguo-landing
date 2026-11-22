#!/usr/bin/env node
// [slide-cover-bucket-v1] Gambar slide (public/slide-cover, ±1,5 GB) TIDAK lagi ikut
// di tiap deployment Vercel. Berkasnya tetap di git seperti biasa; saat deploy skrip
// ini mengunggah yang baru/berubah ke bucket publik Supabase `slide-cover`, lalu
// membuang salinannya dari keluaran build. Alamat /slide-cover/... tetap sama:
// vercel.json (dashboard) & next.config.ts (landing) me-rewrite ke bucket.
//
// Aman secara rancangan: berkas HANYA dibuang dari keluaran build kalau sudah
// tercatat di manifest bucket dengan isi yang sama. Gagal apa pun (kunci tak ada,
// jaringan putus) → berkas dibiarkan ikut deployment seperti dulu, build tak gagal.
//
// Pakai:
//   node scripts/sinkron-slide-cover.mjs [--dir public/slide-cover]
//        [--mode sumber|tambahan] [--pangkas <folder>] [--uji]
//   --mode sumber    (bawaan, dashboard) unggah berkas baru DAN yang isinya berubah
//   --mode tambahan  (landing) hanya unggah path yang belum ada; tak pernah menimpa
//   --pangkas <f>    hapus dari <f> berkas yang sudah ada di bucket dengan isi sama
//   --uji            hanya melaporkan, tidak mengunggah/menghapus
//   --hanya-vercel   tak berbuat apa-apa kecuali di mesin build Vercel (VERCEL=1)
// Pengaman: --pangkas pada folder sumber (…/public/…) HANYA jalan di mesin build
// Vercel — di laptop itu berarti menghapus berkas git milik folder kerja.
// Env: SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL (atau NEXT_PUBLIC_/VITE_SUPABASE_URL)
import { createHash } from "node:crypto";
import { readdir, readFile, rm, rmdir } from "node:fs/promises";
import path from "node:path";

const BUCKET = "slide-cover";
const MANIFEST = "_manifest.json";
const PARALEL = 12;
const TIPE = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".gif": "image/gif", ".avif": "image/avif",
  ".json": "application/json", ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8",
};

function arg(nama) {
  const i = process.argv.indexOf(nama);
  return i > -1 ? process.argv[i + 1] : undefined;
}
const DIR = path.resolve(arg("--dir") || "public/slide-cover");
const MODE = arg("--mode") || "sumber";
const PANGKAS = arg("--pangkas") ? path.resolve(arg("--pangkas")) : null;
const UJI = process.argv.includes("--uji");
const URL_SB = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const KUNCI = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const log = (...a) => console.log("[slide-cover]", ...a);

async function daftarBerkas(akar) {
  const hasil = [];
  async function jalan(d) {
    let isi;
    try { isi = await readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of isi) {
      if (e.name === ".DS_Store") continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) await jalan(p);
      else if (e.isFile()) hasil.push(path.relative(akar, p).split(path.sep).join("/"));
    }
  }
  await jalan(akar);
  return hasil;
}

async function sha1Berkas(p) {
  return createHash("sha1").update(await readFile(p)).digest("hex");
}

async function paralel(butir, n, kerja) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, butir.length) }, async () => {
    while (i < butir.length) { const k = i++; await kerja(butir[k], k); }
  }));
}

const kepala = (extra = {}) => ({ authorization: `Bearer ${KUNCI}`, apikey: KUNCI, ...extra });
const urlObjek = (rel) => `${URL_SB}/storage/v1/object/${BUCKET}/${rel.split("/").map(encodeURIComponent).join("/")}`;

async function ambilManifest() {
  const r = await fetch(urlObjek(MANIFEST), { headers: kepala(), cache: "no-store" });
  if (r.ok) return (await r.json()).files || {};
  const teks = await r.text();
  if (/bucket not found/i.test(teks)) return null; // bucket belum ada
  if (r.status === 400 || r.status === 404) return {}; // manifest belum ada
  throw new Error(`manifest ${r.status}: ${teks.slice(0, 200)}`);
}

async function buatBucket() {
  const r = await fetch(`${URL_SB}/storage/v1/bucket`, {
    method: "POST",
    headers: kepala({ "content-type": "application/json" }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!r.ok && !/already exists/i.test(await r.text())) throw new Error(`buat bucket gagal ${r.status}`);
}

async function unggah(rel, badan, tipe, cache) {
  let galat;
  for (let coba = 0; coba < 4; coba++) {
    try {
      const r = await fetch(urlObjek(rel), {
        method: "POST",
        headers: kepala({ "content-type": tipe, "cache-control": cache, "x-upsert": "true" }),
        body: badan,
      });
      if (r.ok) return;
      galat = new Error(`${r.status} ${(await r.text()).slice(0, 160)}`);
      if (r.status >= 400 && r.status < 500 && r.status !== 429 && r.status !== 408) break;
    } catch (e) { galat = e; }
    await new Promise((s) => setTimeout(s, 800 * (coba + 1)));
  }
  throw galat;
}

async function utama() {
  const diVercel = process.env.VERCEL === "1";
  if (process.argv.includes("--hanya-vercel") && !diVercel) return;
  if (PANGKAS && !diVercel && !PANGKAS.split(path.sep).includes(".vercel")) {
    log(`--pangkas ${PANGKAS} ditolak di luar mesin build Vercel (hanya .vercel/output yang boleh).`);
    return;
  }
  if (!URL_SB || !KUNCI) {
    log("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ada — dilewati, gambar tetap ikut deployment.");
    return;
  }
  const lokal = await daftarBerkas(DIR);
  if (!lokal.length && !PANGKAS) { log(`tak ada berkas di ${DIR}`); return; }

  let manifest = await ambilManifest();
  if (manifest === null) {
    if (MODE !== "sumber" || UJI) { log("bucket belum ada — dilewati."); return; }
    await buatBucket();
    log(`bucket ${BUCKET} dibuat`);
    manifest = {};
  }

  // 1) Tentukan yang perlu diunggah
  const sha = new Map();
  await paralel(lokal, 16, async (rel) => { sha.set(rel, await sha1Berkas(path.join(DIR, rel))); });
  const perlu = lokal.filter((rel) => (MODE === "sumber" ? manifest[rel] !== sha.get(rel) : !(rel in manifest)));
  log(`${lokal.length} berkas lokal, ${Object.keys(manifest).length} di bucket, ${perlu.length} perlu diunggah (mode ${MODE})`);

  // 2) Unggah
  const baru = {};
  let gagal = 0;
  if (!UJI && perlu.length) {
    let selesai = 0;
    await paralel(perlu, PARALEL, async (rel) => {
      try {
        const tipe = TIPE[path.extname(rel).toLowerCase()] || "application/octet-stream";
        await unggah(rel, await readFile(path.join(DIR, rel)), tipe, "max-age=86400");
        baru[rel] = sha.get(rel);
      } catch (e) {
        gagal++;
        if (gagal <= 5) log(`GAGAL ${rel}: ${e.message}`);
      }
      if (++selesai % 500 === 0) log(`… ${selesai}/${perlu.length}`);
    });
    // 3) Catat ke manifest (ambil ulang dulu: deploy lain bisa jalan bersamaan)
    if (Object.keys(baru).length) {
      const terkini = (await ambilManifest()) || {};
      manifest = { ...terkini, ...baru };
      const badan = JSON.stringify({ v: 1, diperbarui: new Date().toISOString(), files: manifest });
      await unggah(MANIFEST, badan, "application/json", "no-cache");
    }
    log(`terunggah ${Object.keys(baru).length}, gagal ${gagal}`);
  }

  // 4) Pangkas keluaran build: hanya berkas yang terbukti sama dengan isi bucket
  if (PANGKAS) {
    const calon = await daftarBerkas(PANGKAS);
    let buang = 0, tinggal = 0;
    await paralel(calon, 16, async (rel) => {
      const p = path.join(PANGKAS, rel);
      if (manifest[rel] && manifest[rel] === (await sha1Berkas(p))) {
        if (!UJI) await rm(p);
        buang++;
      } else tinggal++;
    });
    if (!UJI) await hapusFolderKosong(PANGKAS);
    log(`pangkas ${PANGKAS}: ${buang} dibuang (disajikan dari bucket), ${tinggal} tetap ikut deployment${UJI ? " [uji]" : ""}`);
  }
}

async function hapusFolderKosong(d) {
  let isi;
  try { isi = await readdir(d, { withFileTypes: true }); } catch { return; }
  for (const e of isi) if (e.isDirectory()) await hapusFolderKosong(path.join(d, e.name));
  try { await rmdir(d); } catch { /* masih ada isinya */ }
}

utama().catch((e) => {
  // Jangan pernah menggagalkan build: tanpa pangkas, gambar ikut deployment seperti dulu.
  log(`dilewati karena galat: ${e.message}`);
});
