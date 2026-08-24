#!/usr/bin/env node
// [ebook-sampul-gambar-v1] Perender sampul modul: HTML → PNG lewat Chromium.
//
// Sampul dua modul pertama (Español, 日本語) dirender ad-hoc lalu berkasnya
// disimpan; skrip ini yang membakukannya supaya modul berikutnya tak perlu
// mengarang tata letaknya sendiri. Isinya diambil dari meta.json modul, dan
// hal-hal yang khas per bahasa (pola latar, label kecil, aksara cap air)
// ditaruh di `meta.cover_design`.
//
// PNG, bukan JPEG: latarnya bidang rata + pola garis tipis, dan pada gambar
// seperti itu PNG justru jauh lebih kecil sekaligus tanpa cacat pinggiran.
//
// Pakai:
//   node scripts/build-ebook-cover.mjs en-a1            # → content/ebook/en-a1/cover.png
//   node scripts/build-ebook-cover.mjs en-a1 --html     # HTML saja, buat mengintip

import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";

const slug = process.argv[2];
if (!slug) { console.error("pakai: node scripts/build-ebook-cover.mjs <slug>"); process.exit(1); }
const HTML_SAJA = process.argv.includes("--html");

const DIR = `content/ebook/${slug}`;
const meta = JSON.parse(readFileSync(`${DIR}/meta.json`, "utf8"));
const d = meta.cover_design ?? {};
const unit = readdirSync(DIR).filter((f) => /^unit-\d+\.json$/.test(f)).length;

function cariChrome() {
  const kandidat = [
    ...(existsSync(`${process.env.HOME}/Library/Caches/ms-playwright`)
      ? readdirSync(`${process.env.HOME}/Library/Caches/ms-playwright`)
          .filter((x) => x.startsWith("chromium"))
          .map((x) => `${process.env.HOME}/Library/Caches/ms-playwright/${x}/chrome-headless-shell-mac-arm64/chrome-headless-shell`)
      : []),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  const ada = kandidat.find((p) => existsSync(p));
  if (!ada) throw new Error("Chromium tidak ditemukan — pasang Google Chrome atau `npx playwright install chromium`.");
  return ada;
}

const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/* A4 pada 200 dpi — ukuran yang sama dengan sampul modul Jepang, cukup tajam
   untuk kartu katalog maupun halaman pertama PDF-nya. */
const LEBAR = 1654;
const TINGGI = 2338;

const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${LEBAR}px;height:${TINGGI}px}
  body{
    background:${esc(d.bg ?? "#0E5A57")};
    font-family:"Roboto","Helvetica Neue","Arial",sans-serif;
    color:#fff; position:relative; overflow:hidden;
  }
  /* Pola latar: dibuat dari gradient berulang, jadi tak ada berkas gambar yang
     perlu ikut diangkut. Tiap modul memilih polanya sendiri lewat cover_design. */
  .pola{position:absolute;inset:0;opacity:${d.pola_opacity ?? 0.5};${esc(d.pola ?? "")}}
  .cap{
    position:absolute;right:-40px;bottom:250px;
    font-size:520px;font-weight:700;line-height:1;
    color:rgba(255,255,255,.045);user-select:none;
  }
  .isi{position:absolute;inset:0;padding:130px 128px}
  .merek{font-size:34px;font-weight:700;letter-spacing:.34em;color:${esc(d.accent ?? "#5FD6CA")}}
  .merek-sub{margin-top:14px;font-size:25px;letter-spacing:.28em;color:rgba(255,255,255,.62)}
  .tengah{position:absolute;left:128px;right:128px;top:640px}
  .label{font-size:31px;font-weight:700;letter-spacing:.30em;color:${esc(d.accent ?? "#5FD6CA")}}
  /* [ebook-sampul-gambar-v1] Jarak judul dari labelnya bisa disetel per modul:
     line-height .96 memotong ruang di atas huruf, jadi judul beraksen atas
     (Íslenska, Ðanmörk) menabrak label kecil di atasnya. Bawaannya 8px —
     persis seperti sebelum ada tombol ini, jadi sampul lama tak bergeser. */
  .judul{margin-top:${d.judul_margin ?? "8px"};font-size:${d.judul_size ?? "210px"};font-weight:700;line-height:.96;letter-spacing:-.02em}
  .angka{margin-top:6px;font-size:190px;font-weight:300;line-height:1;color:${esc(d.accent ?? "#5FD6CA")};opacity:.9}
  .garis{width:200px;height:7px;margin:52px 0 44px;background:${esc(d.accent ?? "#5FD6CA")}}
  .ringkas{font-size:47px;line-height:1.42;font-weight:400;max-width:1000px}
  .catatan{margin-top:46px;font-size:31px;letter-spacing:.02em;color:${esc(d.accent ?? "#5FD6CA")};opacity:.92}
  .kaki{position:absolute;left:128px;right:128px;bottom:120px;
        display:flex;justify-content:space-between;align-items:flex-end;
        border-top:2px solid rgba(255,255,255,.22);padding-top:34px;
        font-size:32px;line-height:1.55;color:rgba(255,255,255,.9)}
  .kaki .kanan{text-align:right}
  .kaki .tipis{color:rgba(255,255,255,.62)}
</style></head><body>
  <div class="pola"></div>
  ${d.cap ? `<div class="cap">${esc(d.cap)}</div>` : ""}
  <div class="isi">
    <div class="merek">${esc(meta.brand ?? "LINGUO")}</div>
    <div class="merek-sub">MODUL BELAJAR MANDIRI</div>
    <div class="tengah">
      ${d.label ? `<div class="label">${esc(d.label)}</div>` : ""}
      <div class="judul">${esc(d.judul ?? meta.title.replace(/\s*101$/, ""))}</div>
      <div class="angka">101</div>
      <div class="garis"></div>
      <div class="ringkas">${esc(d.ringkas ?? meta.subtitle)}</div>
      ${d.catatan ? `<div class="catatan">${esc(d.catatan)}</div>` : ""}
    </div>
  </div>
  <div class="kaki">
    <div>
      <div>${esc(meta.level ?? "")}</div>
      <div class="tipis">${unit} unit &middot; dialog &middot; latihan &middot; kunci jawaban</div>
    </div>
    <div class="kanan">
      <div>${esc(meta.edition ?? "")}</div>
      <div class="tipis">linguo.id</div>
    </div>
  </div>
</body></html>`;

const berkasHtml = `${DIR}/cover.html`;
writeFileSync(berkasHtml, html);
if (HTML_SAJA) { console.log(`HTML → ${berkasHtml}`); process.exit(0); }

execFileSync(cariChrome(), [
  "--headless", "--disable-gpu", "--hide-scrollbars",
  `--screenshot=${DIR}/cover.png`,
  `--window-size=${LEBAR},${TINGGI}`,
  `file://${process.cwd()}/${berkasHtml}`,
], { stdio: "ignore" });
unlinkSync(berkasHtml);
console.log(`PNG → ${DIR}/cover.png`);
