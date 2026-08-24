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

/* [ebook-translit-ruby-v1] Cara baca DI ATAS aksaranya, bukan di baris terpisah.

   Modul bahasa beraksara non-Latin (Jepang, Korea, Thai, Arab…) tak terbaca
   pemula kalau cara bacanya ditaruh di baris bawah: mata harus melompat bolak-
   balik dan kehilangan tempat di tengah kalimat. Penulisannya di berkas unit:

       [わたし|watashi]は[学生|gakusei]です。

   → `<ruby>` HTML, yang dicetak Chromium sebagai huruf kecil persis di atas
   suku katanya. Tanda kurung siku TANPA garis tegak dibiarkan apa adanya,
   supaya teks biasa yang memakai [...] tidak ikut tersedot. */
const RUBY = /\[([^\[\]|]+)\|([^\[\]|]+)\]/g;
const ruby = (s) => s.replace(RUBY, (_, dasar, baca) => `<ruby>${dasar}<rt>${baca}</rt></ruby>`);

/* [ebook-rtl-arab-v1] Modul beraksara kanan-ke-kiri (Arab, Ibrani, Persia).
   Yang membedakannya dari modul beraksara lain bukan fonnya, melainkan ARAHNYA:
   satu kalimat Arab yang ditaruh apa adanya di dalam paragraf Indonesia memang
   dibalik sendiri oleh peramban, tapi tanda bacanya ikut melompat ke ujung yang
   salah begitu kalimatnya bersinggungan dengan teks Latin ("Ahmad:" di kepala
   baris dialog, tanda kurung, nomor). Jadi tiap potongan bahasa target dipagari
   sendiri: dir rtl + unicode-bidi isolate, supaya urusan arah berhenti di tepi
   potongannya dan tak merembet ke kalimat Indonesia di sekitarnya.

   Ruby TIDAK dipakai di modul begini: cara baca yang dicetak di atas aksara Arab
   ikut tersusun kanan-ke-kiri sementara transliterasinya Latin, dan hasilnya
   terbaca terbalik. Cara bacanya turun jadi barisnya sendiri (baca di tiap baris
   dialog, kolom "Cara baca" di tabel kosakata). */
const RTL = meta.rtl === true;
const FON_RTL = meta.font_rtl ?? `"Geeza Pro", "Al Bayan", "Baghdad", "Noto Naskh Arabic", "Times New Roman"`;

/* Pemagarannya OTOMATIS, bukan lewat penanda yang harus ditulis penulisnya di
   tiap sel: aksara Arab dikenali dari rentang Unicode-nya, lalu satu untaian
   utuh (termasuk spasi & tanda baca di tengahnya) dibungkus sekaligus. Kalau
   tiap katanya dibungkus sendiri-sendiri, untaiannya justru tersusun terbalik —
   dua pagar yang bersebelahan diurutkan kiri-ke-kanan seperti huruf Latin. */
const AKSARA_RTL = "\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF";
const NETRAL_RTL = " \\u00A0.,\\u060C\\u061B\\u061F!?:;()\\[\\]/\\-\\u2013\\u2014\\u00AB\\u00BB0-9\\u0660-\\u0669";
const UNTAIAN_RTL = new RegExp(`[${AKSARA_RTL}](?:[${AKSARA_RTL}${NETRAL_RTL}]*[${AKSARA_RTL}])?`, "g");
const pagariRtl = (s) => s.replace(UNTAIAN_RTL, (m) => `<span class="rtl" dir="rtl">${m}</span>`);

/** *miring* dan **tebal** ala markdown ringan — cukup untuk teks pelajaran. */
const teksDasar = (s) => ruby(esc(s)).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
const teks = (s) => (RTL ? pagariRtl(teksDasar(s)) : teksDasar(s));

/* [ebook-bahasa-pengantar-v1] Judul tetap di dalam unit ("Catatan", "Latihan",
   "Kunci jawaban") ikut BAHASA PENGANTAR modulnya, bukan bahasa targetnya.

   Sampai modul Indonesia (id-a1) semua modul berpengantar bahasa Indonesia,
   jadi judulnya cukup ditulis mati di perakit. Modul BIPA membalik susunannya:
   bahasa yang DIPELAJARI justru bahasa Indonesia, dan pengantarnya Inggris —
   halaman yang seluruhnya berbahasa Inggris tak boleh menyisakan kepala
   "Kosakata unit ini" di tengahnya. Nilai bawaannya persis seperti sebelum ada
   tombol ini, jadi seluruh modul lama tercetak sama saja.

   `label.exercises` juga dipakai waktu PDF dibaca balik untuk mencari halaman
   latihan tiap unit — lihat [ebook-latihan-interaktif-v1] di bawah. Menggantinya
   di meta.json saja sudah cukup; tak ada pola yang perlu disunting dua kali. */
const LABEL = {
  unit: "Unit",
  dialog: "Diálogo",
  notes: "Catatan",
  vocab: "Kosakata unit ini",
  exercises: "Latihan",
  answers: "Kunci jawaban",
  bekal: "Di ujung unit ini kamu bisa:",
  literal: "harfiah:",
  wave: "Ulangan berjenjang:",
  ...(meta.labels ?? {}),
};

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
  ...units.map((u, i) => ({ kunci: `unit:${i + 1}`, label: `${LABEL.unit} ${i + 1} — ${u.title}`, sub: u.title_target })),
  ...(meta.back ?? []).map((h) => ({ kunci: `judul:${h.title}`, label: h.title })),
];

const halamanIsi = (h, nomor) => `
<section class="hal">
  <h2>${esc(h.title)}</h2>
  ${h.intro ? `<p class="isi-intro">${teks(h.intro)}</p>` : ""}
  <table class="isi"><tbody>${barisIsi().map((b) => `
    <tr>
      <td>${esc(b.label)}${b.sub ? `<span class="isi-asing">${teks(b.sub)}</span>` : ""}</td>
      <td class="isi-hal">${nomor.get(b.kunci) ?? "&mdash;"}</td>
    </tr>`).join("")}</tbody></table>
</section>`;

/** Satu blok isi bebas — dipakai halaman pengantar/penutup DAN bagian di
 *  dalam unit (lihat `sections`), supaya penulisnya cuma menghafal satu skema. */
const blok = (b) => {
  if (b.type === "p") return `<p>${teks(b.text)}</p>`;
  if (b.type === "list") return `<ul>${b.items.map((i) => `<li>${teks(i)}</li>`).join("")}</ul>`;
  if (b.type === "tabel") return tabel(b);
  if (b.type === "kotak") return `<div class="kotak"><h4>${teks(b.title)}</h4>${b.items.map((i) => `<p>${teks(i)}</p>`).join("")}</div>`;
  if (b.type === "sub") return `<h4 class="anak-judul">${teks(b.text)}</h4>`;
  return "";
};

const halamanTeks = (h, nomor) => (h.type === "isi" ? halamanIsi(h, nomor) : `
<section class="hal">
  <h2>${esc(h.title)}</h2>
  ${(h.blocks ?? []).map(blok).join("\n")}
</section>`);

const tabel = (b) => `
<table>
  ${b.head ? `<thead><tr>${b.head.map((h) => `<th>${teks(h)}</th>`).join("")}</tr></thead>` : ""}
  <tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${teks(c)}</td>`).join("")}</tr>`).join("")}</tbody>
</table>`;

/* [ebook-translit-ruby-v1] Judul kolom kosakata ikut bahasanya. Modul Spanyol
   cukup "Español · Cara baca · Bahasa Indonesia", modul beraksara asing perlu
   kolom kana/aksara tersendiri — jadi susunannya ditulis di meta.json
   (`vocab_columns: [{head, key}, …]`) dan bentuk lama tetap jadi bawaan. */
/* [ebook-fon-cjk-v1] Ekor tumpukan fon untuk aksara CJK ikut modulnya.

   Ratusan aksara Han dipakai bersama bahasa Jepang dan Mandarin, tapi bentuk
   cetaknya BERBEDA (直, 骨, 令 …). Ekor bawaan tumpukan fon berisi fon Jepang,
   jadi modul Mandarin yang dibiarkan memakainya tercetak dengan bentuk aksara
   Jepang — benar terbaca, tapi salah di mata pembaca Mandarin. Modul memilih
   ekornya sendiri lewat `meta.font_cjk_serif` / `meta.font_cjk_sans`; nilai
   bawaannya persis seperti sebelumnya, jadi modul Jepang & Latin tak berubah. */
const FON_CJK_SERIF = meta.font_cjk_serif ?? `"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP"`;
const FON_CJK_SANS = meta.font_cjk_sans ?? `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP"`;

const KOLOM_KOSAKATA = meta.vocab_columns ?? [
  { head: "Español", key: "es" },
  { head: "Cara baca", key: "baca" },
  { head: "Bahasa Indonesia", key: "id" },
];

/* [ebook-unit-tebal-v2] Satu unit boleh punya lebih dari satu dialog, dan tiap
   dialog membawa catatan serta kotak tata bahasanya sendiri — itulah yang
   membedakan unit sekali-duduk dari unit yang benar-benar menuntaskan satu
   topik. Bentuk lama (`dialog` + `notes` + `grammar` tunggal) tetap dibaca apa
   adanya supaya modul yang sudah ada tak perlu ditulis ulang. */
const kotakTata = (g) => `
  <div class="kotak">
    <h4>${teks(g.title)}</h4>
    ${(g.body ?? []).map((b) => `<p>${teks(b)}</p>`).join("")}
    ${g.table ? tabel(g.table) : ""}
    ${(g.tables ?? []).map(tabel).join("")}
    ${(g.after ?? []).map((b) => `<p>${teks(b)}</p>`).join("")}
  </div>`;

const dialogHtml = (d) => `
  <h3>${teks(d.title ?? LABEL.dialog)}</h3>
  ${d.intro ? `<p class="dialog-intro">${teks(d.intro)}</p>` : ""}
  <div class="dialog">
    ${d.lines.map((l, n) => `
      <div class="baris">
        <span class="nomor">${n + 1}</span>
        <div>
          <p class="asing"${RTL ? ' dir="rtl"' : ""}><b>${teks(l.speaker)}</b> ${teks(l.text)}</p>
          ${l.baca ? `<p class="baca">${teks(l.baca)}</p>` : ""}
          <p class="arti">${teks(l.id)}</p>
          ${l.literal ? `<p class="harfiah">${esc(LABEL.literal)} ${teks(l.literal)}</p>` : ""}
        </div>
      </div>`).join("")}
  </div>
  ${d.notes?.length ? `
  <h3>${teks(d.notes_title ?? LABEL.notes)}</h3>
  <ol class="catatan">${d.notes.map((n) => `<li>${teks(n)}</li>`).join("")}</ol>` : ""}
  ${(d.grammars ?? (d.grammar ? [d.grammar] : [])).map(kotakTata).join("")}`;

const unitHal = (u, i) => `
<section class="hal unit">
  <div class="unit-kepala">
    <span class="unit-no">${esc(LABEL.unit)} ${i + 1}</span>
    <h2>${esc(u.title)}<span class="unit-asing">${teks(u.title_target ?? "")}</span></h2>
    ${u.goal ? `<p class="unit-tujuan">${teks(u.goal)}</p>` : ""}
    ${u.bekal?.length ? `<p class="unit-bekal"><b>${esc(LABEL.bekal)}</b> ${u.bekal.map(teks).join(" &middot; ")}</p>` : ""}
  </div>

  ${(u.dialogs ?? (u.dialog ? [u.dialog] : [])).map(dialogHtml).join("\n")}

  ${u.notes?.length ? `
  <h3>${esc(LABEL.notes)}</h3>
  <ol class="catatan">${u.notes.map((n) => `<li>${teks(n)}</li>`).join("")}</ol>` : ""}

  ${(u.grammars ?? (u.grammar ? [u.grammar] : [])).map(kotakTata).join("")}

  ${(u.sections ?? []).map((s) => `
  <h3>${teks(s.title)}</h3>
  ${(s.blocks ?? []).map(blok).join("\n")}`).join("\n")}

  ${u.vocab?.length ? `
  <h3>${esc(LABEL.vocab)}</h3>
  ${tabel({ head: KOLOM_KOSAKATA.map((k) => k.head), rows: u.vocab.map((v) => KOLOM_KOSAKATA.map((k) => v[k.key])) })}` : ""}

  ${u.exercises?.length ? `
  <h3>${esc(LABEL.exercises)}</h3>
  ${u.exercises.map((e, k) => `
    <div class="latihan">
      <p class="latihan-judul">${k + 1}. ${teks(e.prompt)}</p>
      <ol class="soal">${e.items.map((it) => `<li>${teks(it)}</li>`).join("")}</ol>
    </div>`).join("")}` : ""}

  ${u.answers?.length ? `
  <div class="kunci">
    <h4>${esc(LABEL.answers)}</h4>
    ${u.answers.map((a, k) => `<p><b>${k + 1}.</b> ${teks(a)}</p>`).join("")}
  </div>` : ""}

  ${u.wave ? `<p class="ombak"><b>${esc(LABEL.wave)}</b> ${teks(u.wave)}</p>` : ""}
</section>`;

/* ── halaman jadi ────────────────────────────────────────────────────────── */

const bangunHtml = (nomor) => `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>${esc(meta.title)}</title>
<style>
  /* [ebook-kerapatan-modul-v1] Marjin & ukuran huruf ikut modulnya. Modul
     beraksara asing memakai baris beruby yang tingginya hampir dua kali baris
     biasa; dibiarkan selonggar modul Latin, tebalnya membengkak sampai
     sepertiga tanpa satu kata pun ditambahkan. Nilai bawaannya persis seperti
     sebelum ada tombol ini, jadi modul lama tercetak sama saja.

     meta.line_height menyusul dengan alasan yang sebaliknya: modul yang
     isinya rapat (Tagalog 101 punya 20 unit bertabel) melewati batas halaman
     yang dijanjikan katalognya walau hurufnya sudah dikecilkan — yang menahan
     tebalnya ternyata jarak antarbaris, bukan ukuran hurufnya. */
  @page { size: A4; margin: ${esc(meta.page_margin ?? "18mm 16mm 16mm")}; }
  /* Halaman bernama: cuma sampulnya yang dicetak tanpa marjin. */
  @page sampul { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  /* Huruf Jepang/Korea/Tionghoa disusulkan di ekor tumpukan: peramban memakai
     fon pertama yang PUNYA glifnya, jadi modul beraksara Latin tak berubah
     sedikit pun sementara aksara asing tidak lagi jatuh ke fon darurat. */
  body { margin: 0; font-family: "Charter", "Georgia", "Times New Roman", serif,
         ${FON_CJK_SERIF};
         font-size: ${esc(meta.font_size ?? "10.5pt")}; line-height: ${esc(meta.line_height ?? "1.55")}; color: #1B2233; }
  h1, h2, h3, h4, .unit-no, .sampul-tanda, th { font-family: "Helvetica Neue", Arial, sans-serif,
         ${FON_CJK_SANS}; }

  /* [ebook-translit-ruby-v1] Cara baca di atas aksara. ruby-position over wajib
     ditulis — bawaan Chromium sudah begitu untuk tulisan mendatar, tapi tanpa
     line-height yang dilonggarkan barisnya saling menempel dan rōmaji baris
     bawah menabrak aksara baris atasnya. (Aturan CSS ini ada DI DALAM template
     literal — jangan pakai tanda petik miring di komentarnya, berkasnya
     langsung gagal diurai.) */
  /* [ebook-ruby-matra-v1] Aksara bermatra (Devanagari dan kerabatnya) TIDAK
     boleh kena ruby-align center: untuk menyamakan lebar dasar dengan lebar
     cara bacanya, Chromium menyisipkan jarak DI DALAM gugus aksaranya, jadi
     मेरा pecah jadi "म रा" dengan matra terlepas dari konsonannya. Nilai start
     mematikan perataan itu dan gugusnya utuh; rt-nya sekalian dilonggarkan
     supaya tanda di ATAS garis kepala (bindu, candrabindu) tak tertimpa.
     Modul CJK/Kiril/Georgia tetap memakai center persis seperti sebelumnya —
     pilih lewat meta.ruby_align.
     Tanda di ATAS garis kepala (candrabindu ँ pada हूँ, माँ, पाँच, कहाँ)
     digambar di luar kotak em fonnya, jadi Chromium tidak menyediakan tempat
     untuknya dan cara baca menimpanya. Nilai top -3pt menggeser cara bacanya naik
     TANPA menambah tinggi baris — melonggarkan line-height sama sekali tidak
     menolong, sudah dicoba sampai 2.15 dan tumpang tindihnya tetap. */
  ruby { ruby-position: over; ruby-align: ${meta.ruby_align === "start" ? "start" : "center"}; }
  rt { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 6.4pt; font-weight: 500;
       font-style: normal; color: #12776F; letter-spacing: .01em; line-height: ${meta.ruby_align === "start" ? "1.35" : "1"};
       ${meta.ruby_align === "start" ? "position: relative; top: -3pt;" : ""} }
  /* Cuma baris yang BENAR-BENAR beruby yang dilonggarkan. Melonggarkan seluruh
     badan teks bikin paragraf Indonesia ikut melar dan modulnya membengkak
     puluhan halaman tanpa satu pun aksara asing di dalamnya. */
  p:has(ruby), li:has(ruby), td:has(ruby), th:has(ruby),
  h3:has(ruby), h4:has(ruby), .asing:has(ruby) { line-height: 1.85; }
  h2 rt, h3 rt, h4 rt, th rt { text-transform: none; }

  /* Modul beraksara: jarak antar unsur dirapatkan sekalian, karena barisnya
     sendiri sudah tinggi. Modul Latin tidak kena kelas ini sama sekali.
     [ebook-rtl-arab-v1] Modul kanan-ke-kiri kena aturan yang sama: barisnya
     tinggi karena harakat, dan tiap baris dialognya membawa satu baris cara
     baca tambahan. */
  .beraksara .dialog .baris, .rtl-modul .dialog .baris { margin-bottom: 1.8mm; }
  .beraksara .arti, .rtl-modul .arti { margin-bottom: 0.8mm; }
  .beraksara table, .rtl-modul table { font-size: 9.1pt; margin: 2.2mm 0; }
  .beraksara td, .beraksara th, .rtl-modul td, .rtl-modul th { padding: 1mm 1.6mm; }
  .beraksara h3, .rtl-modul h3 { margin: 5mm 0 1.5mm; }
  .beraksara .kotak, .beraksara .kunci,
  .rtl-modul .kotak, .rtl-modul .kunci { padding: 3mm 4mm; margin: 3mm 0; }
  .beraksara .catatan li, .beraksara .soal li,
  .rtl-modul .catatan li, .rtl-modul .soal li { margin-bottom: 1.2mm; }
  .beraksara p, .rtl-modul p { margin-bottom: 1.7mm; }

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
  .unit-bekal { font-size: 9.5pt; color: #5A6478; margin-top: 1.5mm; }
  .dialog-intro { font-size: 9.5pt; color: #5A6478; margin-bottom: 3mm; }
  .anak-judul { margin: 4mm 0 1.5mm; color: #12776F; }

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

  /* [ebook-rtl-arab-v1] Aksara kanan-ke-kiri. Fonnya dipasang di span pemagar,
     bukan di badan teks: kalau fon Arab ikut menaungi seluruh halaman, huruf
     Latin di sekitarnya ikut berganti bentuk tanpa alasan. Ukurannya dinaikkan
     seperlima karena tinggi huruf Arab jauh lebih kecil daripada huruf Latin
     pada ukuran pt yang sama, dan harakatnya butuh ruang di atas-bawah. */
  .rtl-modul .rtl { direction: rtl; unicode-bidi: isolate;
                    font-family: ${FON_RTL}, serif; font-size: 1.2em; }
  /* Baris dialog seluruhnya bahasa target, jadi ARAH BARISNYA sendiri yang
     dibalik — bukan cuma potongan aksaranya. Kalau cuma potongannya, nama
     penutur dan titik di ujung kalimat (dua-duanya "netral" bagi peramban)
     terlempar ke tepi kiri: yang terbaca jadi nama berkolon terbalik dan titik
     menggantung di depan kalimat. */
  .rtl-modul .asing { direction: rtl; text-align: right; font-size: 1.24em;
                      line-height: 1.7; font-family: ${FON_RTL}, serif; }
  .rtl-modul .asing .rtl { font-size: 1em; }
  /* Sel tabel memilih arahnya sendiri dari huruf pertamanya: satu tabel yang
     sama memuat kolom Arab dan kolom Indonesia bersebelahan. */
  .rtl-modul td, .rtl-modul th { unicode-bidi: plaintext; }
  .rtl-modul p:has(.rtl), .rtl-modul li:has(.rtl),
  .rtl-modul td:has(.rtl), .rtl-modul th:has(.rtl) { line-height: 1.68; }
  .rtl-modul .baca { margin-bottom: .4mm; }
  /* Cara baca turun jadi barisnya sendiri — lihat catatan ruby di atas. */
  .rtl-modul .baca { font-size: 8.8pt; color: #12776F; letter-spacing: .01em; }
  .rtl-modul .unit-asing, .rtl-modul .isi-asing { font-style: normal; }
</style></head><body class="${[meta.ruby ? "beraksara" : "", RTL ? "rtl-modul" : ""].filter(Boolean).join(" ")}">
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

const LABEL_UNIT = new RegExp(`^${LABEL.unit}\\.?(\\d+)$`, "i");
/* Kepala bagian latihan, tanpa spasi & tanpa huruf besar — dibandingkan apa
   adanya, bukan lewat pola, supaya judul berbahasa apa pun aman. */
const KEPALA_LATIHAN = LABEL.exercises.replace(/\s+/g, "").toLowerCase();

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
const polos = (s) => String(s ?? "")
  // [ebook-translit-ruby-v1] Di reader soalnya teks polos: yang tersisa aksara
  // aslinya, cara bacanya dibuang — kepingan jawaban jadi kacau kalau rōmaji
  // ikut menempel di dalam satu chip.
  .replace(RUBY, "$1")
  .replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").trim();

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
      if (b.teks.replace(/\s+/g, "").toLowerCase() === KEPALA_LATIHAN) {
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

function tulisLatihan({ halaman, mulai, latihanHal, judul }) {
  /* Unit terakhir berhenti di halaman penutup, bukan di halaman terakhir PDF:
     tanpa batas ini, lampiran tata bahasa di belakang ikut terhitung sebagai
     bagian unit 10 dan reader menyorotinya sebagai isi unit. */
  const awalPenutup = Math.min(
    ...(meta.back ?? []).map((h) => judul?.get(h.title) ?? Infinity),
    halaman + 1,
  );
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
      sampai: hal ? (berikut ?? awalPenutup) - 1 : null,
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
