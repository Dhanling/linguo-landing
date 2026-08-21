#!/usr/bin/env node
// [ebook-konten-v1] Perakit modul: berkas unit (JSON) → HTML cetak → PDF A4.
//
// PDF-nya dicetak Chromium headless yang SUDAH ada di mesin (cache Playwright /
// Google Chrome). Sengaja tanpa pustaka PDF: satu dependensi lagi cuma untuk
// menyusun teks berkolom tunggal tidak sepadan, dan hasil mesin cetak browser
// jauh lebih rapi soal tipografi.
//
// Bentuk isinya meniru Assimil / Teach Yourself: dialog pendek → terjemahan
// harfiah → catatan → kosakata → latihan → kunci jawaban, satu unit = satu
// duduk belajar. Skema unitnya di content/ebook/<slug>/*.json.
//
// Pakai:
//   node scripts/build-ebook-pdf.mjs es-a1            # → dist/ebook/es-a1.pdf
//   node scripts/build-ebook-pdf.mjs es-a1 --html     # HTML saja (buat pratinjau)
//   node scripts/build-ebook-pdf.mjs es-a1 --png      # + bidikan halaman pertama

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const slug = process.argv[2];
if (!slug) { console.error("pakai: node scripts/build-ebook-pdf.mjs <slug>"); process.exit(1); }
const HTML_SAJA = process.argv.includes("--html");
const PNG = process.argv.includes("--png");

const DIR = `content/ebook/${slug}`;
const OUT = "dist/ebook";
mkdirSync(OUT, { recursive: true });

const meta = JSON.parse(readFileSync(`${DIR}/meta.json`, "utf8"));
const units = readdirSync(DIR)
  .filter((f) => /^unit-\d+\.json$/.test(f))
  .sort()
  .map((f) => JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")));

/** Chromium apa pun yang ada di mesin ini. */
function cariChrome() {
  const kandidat = [
    ...(existsSync(`${process.env.HOME}/Library/Caches/ms-playwright`)
      ? readdirSync(`${process.env.HOME}/Library/Caches/ms-playwright`)
          .filter((d) => d.startsWith("chromium"))
          .map((d) => `${process.env.HOME}/Library/Caches/ms-playwright/${d}/chrome-headless-shell-mac-arm64/chrome-headless-shell`)
      : []),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  const ada = kandidat.find((p) => existsSync(p));
  if (!ada) throw new Error("Chromium tidak ditemukan — pasang Google Chrome atau `npx playwright install chromium`.");
  return ada;
}

/* [ebook-sampul-gambar-v1] Sampul bergambar. Modul yang dijual sebaiknya
   bersampul rancangan desainer, bukan judul di tengah halaman kosong: berkas
   `cover.(jpg|png|webp)` di folder modul (atau `meta.cover`) langsung dipakai
   sebagai halaman 1 penuh tanpa marjin. Gambarnya ditanam sebagai data URI —
   Chromium mencetak dari file:// dan jalur relatif di dalam <img> gampang
   meleset begitu HTML-nya dipindah ke dist/. */
const JENIS_GAMBAR = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
function cariSampul() {
  const kandidat = meta.cover
    ? [`${DIR}/${meta.cover}`]
    : ["cover.jpg", "cover.jpeg", "cover.png", "cover.webp"].map((f) => `${DIR}/${f}`);
  const ada = kandidat.find((f) => existsSync(f));
  if (!ada) return null;
  const jenis = JENIS_GAMBAR[ada.split(".").pop().toLowerCase()];
  if (!jenis) return null;
  return `data:${jenis};base64,${readFileSync(ada).toString("base64")}`;
}
const sampulGambar = cariSampul();

const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
/** *miring* dan **tebal** ala markdown ringan — cukup untuk teks pelajaran. */
const teks = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");

/* ── potongan halaman ────────────────────────────────────────────────────── */

const sampul = () => (sampulGambar ? `
<section class="sampul-gambar"><img src="${sampulGambar}" alt=""></section>` : `
<section class="sampul">
  <div class="sampul-tanda">${esc(meta.brand ?? "LINGUO")}</div>
  <h1>${esc(meta.title)}</h1>
  <p class="sampul-sub">${esc(meta.subtitle ?? "")}</p>
  <div class="sampul-garis"></div>
  <p class="sampul-kaki">${esc(meta.level ?? "")} &middot; ${units.length} unit &middot; ${esc(meta.edition ?? "")}</p>
</section>`);

/* ── daftar isi cetak ───────────────────────────────────────
   [ebook-daftar-isi-cetak-v1] Sidebar "Contents" di reader disusun reader
   sendiri dari ukuran huruf, dan itu cuma hidup di layar: PDF yang diunduh atau
   dicetak siswa tak punya daftar isi sama sekali. Halaman ini yang mengisinya.

   Nomor halamannya perkara ayam-telur: Chromium yang memutuskan paginasi, tapi
   paginasinya baru diketahui SESUDAH dicetak — sementara daftar isinya harus
   ikut tercetak. Jalan keluarnya dua putaran. Putaran pertama mencetak dengan
   nomor bertanda "—", lalu PDF-nya dibaca balik untuk tahu tiap bagian jatuh di
   halaman berapa; putaran kedua mencetak ulang dengan nomor sungguhan. Jumlah
   BARISNYA sama persis di dua putaran, jadi tinggi halamannya tak berubah dan
   nomor putaran pertama tetap sahih. Putarannya diulang sampai nomor yang
   dibaca sama dengan nomor yang dicetak — kalau modulnya tumbuh dan daftar
   isinya meluber jadi dua halaman, putaran ketiga yang membereskan. */
const barisIsi = () => [
  ...(meta.front ?? []).filter((h) => h.type !== "isi").map((h) => ({ kunci: `judul:${h.title}`, label: h.title })),
  ...units.map((u, i) => ({ kunci: `unit:${i + 1}`, label: `Unit ${i + 1} — ${u.title}`, sub: u.title_target })),
  ...(meta.back ?? []).map((h) => ({ kunci: `judul:${h.title}`, label: h.title })),
];

const halamanIsi = (h, nomor) => `
<section class="hal">
  <h2>${esc(h.title)}</h2>
  ${h.intro ? `<p class="isi-intro">${teks(h.intro)}</p>` : ""}
  <table class="isi"><tbody>${barisIsi().map((b) => `
    <tr>
      <td>${esc(b.label)}${b.sub ? `<span class="isi-asing">${esc(b.sub)}</span>` : ""}</td>
      <td class="isi-hal">${nomor.get(b.kunci) ?? "&mdash;"}</td>
    </tr>`).join("")}</tbody></table>
</section>`;

const halamanTeks = (h, nomor) => (h.type === "isi" ? halamanIsi(h, nomor) : `
<section class="hal">
  <h2>${esc(h.title)}</h2>
  ${(h.blocks ?? []).map((b) => {
    if (b.type === "p") return `<p>${teks(b.text)}</p>`;
    if (b.type === "list") return `<ul>${b.items.map((i) => `<li>${teks(i)}</li>`).join("")}</ul>`;
    if (b.type === "tabel") return tabel(b);
    if (b.type === "kotak") return `<div class="kotak"><h4>${esc(b.title)}</h4>${b.items.map((i) => `<p>${teks(i)}</p>`).join("")}</div>`;
    return "";
  }).join("\n")}
</section>`);

const tabel = (b) => `
<table>
  ${b.head ? `<thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>` : ""}
  <tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${teks(c)}</td>`).join("")}</tr>`).join("")}</tbody>
</table>`;

const unitHal = (u, i) => `
<section class="hal unit">
  <div class="unit-kepala">
    <span class="unit-no">Unit ${i + 1}</span>
    <h2>${esc(u.title)}<span class="unit-asing">${esc(u.title_target ?? "")}</span></h2>
    ${u.goal ? `<p class="unit-tujuan">${teks(u.goal)}</p>` : ""}
  </div>

  ${u.dialog ? `
  <h3>${esc(u.dialog.title ?? "Diálogo")}</h3>
  <div class="dialog">
    ${u.dialog.lines.map((l, n) => `
      <div class="baris">
        <span class="nomor">${n + 1}</span>
        <div>
          <p class="asing"><b>${esc(l.speaker)}</b> ${teks(l.text)}</p>
          <p class="arti">${teks(l.id)}</p>
          ${l.literal ? `<p class="harfiah">harfiah: ${teks(l.literal)}</p>` : ""}
        </div>
      </div>`).join("")}
  </div>` : ""}

  ${u.notes?.length ? `
  <h3>Catatan</h3>
  <ol class="catatan">${u.notes.map((n) => `<li>${teks(n)}</li>`).join("")}</ol>` : ""}

  ${u.grammar ? `
  <div class="kotak">
    <h4>${esc(u.grammar.title)}</h4>
    ${u.grammar.body.map((b) => `<p>${teks(b)}</p>`).join("")}
    ${u.grammar.table ? tabel(u.grammar.table) : ""}
  </div>` : ""}

  ${u.vocab?.length ? `
  <h3>Kosakata unit ini</h3>
  ${tabel({ head: ["Español", "Cara baca", "Bahasa Indonesia"], rows: u.vocab.map((v) => [v.es, v.baca, v.id]) })}` : ""}

  ${u.exercises?.length ? `
  <h3>Latihan</h3>
  ${u.exercises.map((e, k) => `
    <div class="latihan">
      <p class="latihan-judul">${k + 1}. ${teks(e.prompt)}</p>
      <ol class="soal">${e.items.map((it) => `<li>${teks(it)}</li>`).join("")}</ol>
    </div>`).join("")}` : ""}

  ${u.answers?.length ? `
  <div class="kunci">
    <h4>Kunci jawaban</h4>
    ${u.answers.map((a, k) => `<p><b>${k + 1}.</b> ${teks(a)}</p>`).join("")}
  </div>` : ""}

  ${u.wave ? `<p class="ombak"><b>Ulangan berjenjang:</b> ${teks(u.wave)}</p>` : ""}
</section>`;

/* ── halaman jadi ────────────────────────────────────────────────────────── */

const bangunHtml = (nomor) => `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>${esc(meta.title)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm 16mm; }
  /* Halaman bernama: cuma sampulnya yang dicetak tanpa marjin. */
  @page sampul { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Charter", "Georgia", "Times New Roman", serif;
         font-size: 10.5pt; line-height: 1.55; color: #1B2233; }
  h1, h2, h3, h4, .unit-no, .sampul-tanda, th { font-family: "Helvetica Neue", Arial, sans-serif; }

  .sampul-gambar { page: sampul; page-break-after: always; }
  /* object-fit: cover — rancangan sampul jarang persis 1:√2, dan gambar yang
     digencet lebih kentara daripada pinggiran yang terpotong satu-dua mm. */
  .sampul-gambar img { display: block; width: 210mm; height: 297mm; object-fit: cover; }

  .sampul { height: 250mm; display: flex; flex-direction: column; justify-content: center;
            text-align: center; page-break-after: always; }
  .sampul-tanda { font-size: 11pt; font-weight: 800; letter-spacing: .32em; color: #1A9E9E; }
  .sampul h1 { font-size: 30pt; line-height: 1.15; margin: 14mm 0 4mm; font-weight: 800; }
  .sampul-sub { font-size: 12pt; color: #5A6478; margin: 0; }
  .sampul-garis { width: 26mm; height: 3px; background: #1A9E9E; margin: 12mm auto; }
  .sampul-kaki { font-size: 10pt; color: #7A8496; }

  .hal { page-break-before: always; }
  h2 { font-size: 17pt; margin: 0 0 2mm; font-weight: 800; }
  h3 { font-size: 11pt; margin: 7mm 0 2mm; color: #12776F; text-transform: uppercase;
       letter-spacing: .08em; border-bottom: 1px solid #D8E3E1; padding-bottom: 1.2mm; }
  h4 { font-size: 10.5pt; margin: 0 0 1.5mm; }
  p { margin: 0 0 2.2mm; }

  .unit-kepala { border-left: 3px solid #1A9E9E; padding-left: 4mm; margin-bottom: 5mm; }
  .unit-no { font-size: 9pt; font-weight: 800; letter-spacing: .18em; color: #1A9E9E; }
  .unit-asing { display: block; font-size: 11pt; font-weight: 500; color: #5A6478; font-style: italic; }
  .unit-tujuan { font-size: 9.5pt; color: #5A6478; margin-top: 1.5mm; }

  .dialog .baris { display: flex; gap: 3mm; margin-bottom: 3mm; page-break-inside: avoid; }
  .nomor { flex: 0 0 6mm; font-size: 8.5pt; color: #A9B2C0; padding-top: 1mm; text-align: right; }
  .asing { font-size: 11pt; }
  .arti { color: #47506380; color: #4A5468; font-size: 10pt; }
  .harfiah { font-size: 8.8pt; color: #8A93A3; font-style: italic; }

  .catatan li { margin-bottom: 1.8mm; }
  .kotak { background: #F2F8F7; border: 1px solid #D8E3E1; border-radius: 3mm;
           padding: 4mm 5mm; margin: 4mm 0; page-break-inside: avoid; }
  .kunci { background: #FBF7EE; border: 1px solid #EBDFC8; border-radius: 3mm;
           padding: 4mm 5mm; margin: 5mm 0 0; page-break-inside: avoid; font-size: 9.5pt; }
  .ombak { margin-top: 4mm; font-size: 9.5pt; color: #5A6478; }

  table { width: 100%; border-collapse: collapse; margin: 3mm 0; font-size: 9.8pt; }
  th { text-align: left; font-size: 8.6pt; text-transform: uppercase; letter-spacing: .06em;
       color: #12776F; border-bottom: 1.5px solid #1A9E9E; padding: 1.6mm 2mm; }
  td { border-bottom: 1px solid #E7ECEB; padding: 1.6mm 2mm; vertical-align: top; }
  tr { page-break-inside: avoid; }

  /* Daftar isi: tabel tanpa garis, nomor halamannya dirapatkan ke tepi kanan. */
  .isi-intro { font-size: 9.5pt; color: #5A6478; margin-bottom: 5mm; }
  table.isi { font-size: 10.5pt; }
  table.isi td { border-bottom: 1px dotted #D8E3E1; padding: 2.2mm 0; }
  .isi-asing { display: block; font-size: 9pt; font-style: italic; color: #8A93A3; }
  .isi-hal { width: 14mm; text-align: right; color: #5A6478; white-space: nowrap; }

  .latihan { margin-bottom: 3.5mm; page-break-inside: avoid; }
  .latihan-judul { font-weight: 700; }
  .soal li { margin-bottom: 1.2mm; }
  ul, ol { margin: 0 0 2.5mm; padding-left: 5.5mm; }
</style></head><body>
${sampul()}
${(meta.front ?? []).map((h) => halamanTeks(h, nomor)).join("\n")}
${units.map(unitHal).join("\n")}
${(meta.back ?? []).map((h) => halamanTeks(h, nomor)).join("\n")}
</body></html>`;

const htmlPath = resolve(`${OUT}/${slug}.html`);
const pdfPath = resolve(`${OUT}/${slug}.pdf`);
const tulisHtml = (nomor) => {
  writeFileSync(htmlPath, bangunHtml(nomor));
  console.log(`HTML  → ${OUT}/${slug}.html (${units.length} unit)`);
};

if (HTML_SAJA) { tulisHtml(new Map()); process.exit(0); }

const chrome = cariChrome();
const cetak = () => execFileSync(chrome, [
  "--headless", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer",
  `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`,
], { stdio: "ignore" });

/* ── berkas latihan interaktif ───────────────────────────────────────────────
   [ebook-latihan-interaktif-v1] Latihan di dalam PDF cuma bisa dikerjakan di
   kepala atau di kertas. Reader dashboard menyulapnya jadi soal yang bisa
   diketik/disusun, dan bahannya diambil dari berkas unit yang SAMA — bukan dari
   hasil pembacaan PDF, yang selalu lebih rapuh.

   Yang tak diketahui berkas unit: latihan unit ke-berapa jatuh di halaman
   berapa. Chromium yang menentukan paginasinya, jadi nomor halamannya dibaca
   balik dari PDF yang barusan dicetak — sekali di sini, bukan tiap kali modulnya
   dibuka siswa. */

const LABEL_UNIT = /^unit\.?(\d+)$/i;

/** Baris teks satu halaman PDF (potongan digabung per ketinggian). */
async function barisHalaman(pdfjs, doc, n) {
  const page = await doc.getPage(n);
  const vp = page.getViewport({ scale: 1 });
  const isi = await page.getTextContent();
  const potongan = [];
  for (const it of isi.items) {
    if (!it.str?.trim() || !it.transform) continue;
    const tx = pdfjs.Util.transform(vp.transform, it.transform);
    const h = Math.hypot(tx[2], tx[3]);
    if (h) potongan.push({ str: it.str, y: tx[5] - h, h });
  }
  potongan.sort((a, b) => a.y - b.y);
  const baris = [];
  let kump = [];
  const tutup = () => {
    if (kump.length) baris.push({ teks: kump.map((i) => i.str).join("").replace(/\s{2,}/g, " ").trim(), h: Math.max(...kump.map((i) => i.h)) });
    kump = [];
  };
  for (const it of potongan) {
    const a = kump[0];
    if (a && Math.abs(it.y - a.y) > Math.max(a.h, it.h) * 0.6) tutup();
    kump.push(it);
  }
  tutup();
  return baris.filter((b) => b.teks);
}

/** Buang penanda *miring* / **tebal** — antarmuka reader menampilkannya polos. */
const polos = (s) => String(s ?? "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").trim();

/* Judul halaman pengantar dicetak sebagai h2 17pt, sedangkan barisnya sendiri
   MUNCUL LAGI di daftar isi dengan huruf badan teks. Yang dipakai sebagai
   penanda halaman karena itu bukan kecocokan teksnya saja, tapi teks yang
   hurufnya jauh lebih besar dari kebanyakan baris di halaman yang sama —
   ambang relatif, sama seperti cara reader menyusun daftar isinya sendiri. */
const judulHalaman = new Set([...(meta.front ?? []), ...(meta.back ?? [])].map((h) => h.title));
const ambangJudul = (baris) => {
  const tinggi = baris.map((b) => b.h).sort((a, b) => a - b);
  return (tinggi[Math.floor(tinggi.length / 2)] ?? 0) * 1.3;
};

/** Baca balik PDF yang barusan dicetak: unit & judul jatuh di halaman berapa. */
async function bacaPdf() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(pdfPath)) }).promise;

  // halaman awal tiap unit + halaman tempat bagian LATIHAN-nya mulai
  const mulai = new Map();   // nomor unit → halaman
  const latihanHal = new Map();
  const judul = new Map();   // judul halaman pengantar/penutup → halaman
  for (let n = 1; n <= doc.numPages; n++) {
    const baris = await barisHalaman(pdfjs, doc, n);
    const ambang = ambangJudul(baris);
    for (const b of baris) {
      const m = b.teks.replace(/\s+/g, "").match(LABEL_UNIT);
      if (m && !mulai.has(Number(m[1]))) mulai.set(Number(m[1]), n);
      if (b.h >= ambang && judulHalaman.has(b.teks) && !judul.has(b.teks)) judul.set(b.teks, n);
      if (/^latihan$/i.test(b.teks.replace(/\s+/g, ""))) {
        // Unit yang halamannya sedang berjalan = unit terakhir yang sudah mulai.
        const no = [...mulai.entries()].filter(([, h]) => h <= n).map(([u]) => u).pop();
        if (no && !latihanHal.has(no)) latihanHal.set(no, n);
      }
    }
  }
  return { halaman: doc.numPages, mulai, latihanHal, judul };
}

/** Hasil pembacaan → peta yang dipakai halaman daftar isi. */
const petaNomor = (baca) => new Map([
  ...[...baca.judul].map(([j, n]) => [`judul:${j}`, n]),
  ...[...baca.mulai].map(([u, n]) => [`unit:${u}`, n]),
]);
const petaSama = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);

/* Dua putaran cetak — lihat [ebook-daftar-isi-cetak-v1] di atas. Tanpa halaman
   daftar isi, putaran pertama sudah final: tak ada nomor yang perlu diisi. */
const punyaDaftarIsi = (meta.front ?? []).some((h) => h.type === "isi");
let nomor = new Map();
let baca;
for (let putaran = 1; putaran <= 3; putaran++) {
  tulisHtml(nomor);
  cetak();
  baca = await bacaPdf();
  const baru = petaNomor(baca);
  const cocok = petaSama(nomor, baru);
  nomor = baru;
  if (!punyaDaftarIsi || cocok) break;
  if (putaran === 3) console.warn("⚠️  nomor daftar isi belum stabil setelah 3 putaran");
}
console.log(`PDF   → ${OUT}/${slug}.pdf (${baca.halaman} halaman)`);

if (PNG) {
  execFileSync(chrome, [
    "--headless", "--disable-gpu", "--no-sandbox", "--window-size=1240,1754",
    `--screenshot=${resolve(`${OUT}/${slug}.png`)}`, `file://${htmlPath}`,
  ], { stdio: "ignore" });
  console.log(`PNG   → ${OUT}/${slug}.png`);
}

function tulisLatihan({ halaman, mulai, latihanHal }) {
  const daftar = units.map((u, i) => {
    const no = i + 1;
    const hal = mulai.get(no) ?? null;
    const berikut = mulai.get(no + 1);
    const latihan = (u.exercises ?? []).map((e, k) => {
      const kunci = String((u.answers ?? [])[k] ?? "").split(/\s+—\s+/).map((x) => x.trim()).filter(Boolean);
      const soal = e.items.map((it, j) => ({ teks: polos(it), kunci: polos(kunci[j] ?? "") }));
      // Jenis soal ditentukan dari BENTUK soalnya, bukan dari perintahnya:
      // perintah ditulis bebas oleh penulis modul, bentuk soalnya tidak.
      const tipe = soal.some((s) => / \/ /.test(s.teks)) ? "susun"
        : soal.some((s) => /_{2,}/.test(s.teks)) ? "isian"
        : "terjemah";
      // Bank kata cuma masuk akal kalau seluruh kuncinya satu kata — di soal
      // "07.00 — ____" kuncinya kalimat penuh, chip-nya jadi konyol.
      const satuKata = soal.length > 1 && soal.every((s) => s.kunci && !/\s/.test(s.kunci));
      const pilihan = tipe === "isian" && satuKata ? [...new Set(soal.map((s) => s.kunci))].sort() : undefined;
      return { perintah: polos(e.prompt), tipe, soal: soal.filter((s) => s.kunci), ...(pilihan ? { pilihan } : {}) };
    }).filter((l) => l.soal.length);
    return {
      no,
      judul: u.title,
      hal,
      sampai: hal ? (berikut ?? halaman + 1) - 1 : null,
      halLatihan: latihanHal.get(no) ?? null,
      latihan,
    };
  }).filter((u) => u.hal && u.latihan.length);

  const keluar = `${OUT}/${slug}.latihan.json`;
  writeFileSync(keluar, JSON.stringify({ slug, produk: meta.product?.slug ?? slug, halaman, unit: daftar }, null, 1));
  const soal = daftar.reduce((a, u) => a + u.latihan.reduce((b, l) => b + l.soal.length, 0), 0);
  console.log(`SOAL  → ${keluar} (${daftar.length} unit · ${soal} soal)`);
}

tulisLatihan(baca);
