#!/usr/bin/env node
// [aeo-indexnow-v1] Kirim SEMUA URL di sitemap live linguo.id ke IndexNow
// (Bing, Yandex, dll) sekali jalan. Pakai sesudah deploy besar atau halaman
// baru; ping harian untuk perubahan kecil sudah ditangani /api/cron/indexnow.
//
//   node scripts/indexnow-submit.mjs            # semua URL
//   node scripts/indexnow-submit.mjs --dry-run  # cuma hitung & tampilkan
//   node scripts/indexnow-submit.mjs https://linguo.id/a https://linguo.id/b
//
// Kunci WAJIB sama dengan INDEXNOW_KEY di src/lib/indexnow.ts dan berkas
// public/<kunci>.txt harus sudah live (cek: curl https://linguo.id/<kunci>.txt).
const KEY = "5be0cd6976f580a2da9772b4ddbd5c47";
const HOST = "linguo.id";
const SITEMAPS = [
  "https://linguo.id/sitemap.xml",
  "https://linguo.id/blog/sitemap.xml",
  "https://linguo.id/silabus/sitemap.xml",
];

const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
let urls = args.filter((a) => a.startsWith("http"));

if (urls.length === 0) {
  for (const sm of SITEMAPS) {
    const xml = await (await fetch(sm)).text();
    const found = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    console.log(`${sm}: ${found.length} URL`);
    urls.push(...found);
  }
}
urls = [...new Set(urls)].filter((u) => new URL(u).host === HOST);
console.log(`Total unik: ${urls.length}`);

const keyLive = await fetch(`https://${HOST}/${KEY}.txt`);
if (!keyLive.ok || (await keyLive.text()).trim() !== KEY) {
  console.error(`Berkas kunci https://${HOST}/${KEY}.txt belum live — deploy dulu.`);
  process.exit(1);
}
if (dry) process.exit(0);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: HTTP ${res.status} ${res.status === 200 || res.status === 202 ? "(diterima)" : await res.text()}`);
