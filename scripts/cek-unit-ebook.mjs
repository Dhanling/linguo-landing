// Pemeriksa cepat berkas unit e-book: kunci jawaban vs jumlah soal, bentuk blok,
// dan kolom tabel yang tidak rata. Dipakai saat merakit modul baru.
import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug) { console.error("pakai: node scripts/cek-unit-ebook.mjs <slug>"); process.exit(1); }
const dir = path.join("content/ebook", slug);
const JENIS_BLOK = new Set(["p", "list", "tabel", "kotak", "sub", "passage", "transkrip", "gambar", "grafik"]);
let salah = 0;
const lapor = (f, pesan) => { console.log(`  ✗ ${f}: ${pesan}`); salah++; };

/* [ebook-transkrip-audio-v1] Naskah Listening boleh membawa `audio`: URL publik
   MP3 hasil scripts/ebook-transkrip-audio.mjs. SENGAJA opsional — naskah yang
   audionya belum dibuat tetap sah (modulnya tetap bisa dirakit), jadi yang
   diperiksa cuma bentuk URL-nya, plus hitungannya dicetak di ringkasan supaya
   naskah yang belum beraudio tidak lolos tanpa terlihat. */
const POLA_AUDIO = /^https:\/\/[^\s"]+\.mp3(\?[^\s"]*)?$/;
let naskah = 0, naskahAudio = 0;

const cekBlok = (f, blocks, dari) => {
  for (const [i, b] of (blocks ?? []).entries()) {
    if (!JENIS_BLOK.has(b.type)) lapor(f, `${dari} blok ${i}: type "${b.type}" tak dikenal`);
    if (b.type === "transkrip") {
      naskah++;
      if (!(b.lines ?? []).length) lapor(f, `${dari} blok ${i}: transkrip tanpa lines`);
      (b.lines ?? []).forEach((l, j) => { if (!l.text) lapor(f, `${dari} blok ${i} baris ${j}: text kosong`); });
      if (b.audio != null) {
        naskahAudio++;
        if (typeof b.audio !== "string" || !POLA_AUDIO.test(b.audio))
          lapor(f, `${dari} blok ${i}: audio "${b.audio}" bukan URL https yang berujung .mp3`);
      }
    }
    if (b.type === "tabel") {
      const lebar = b.head.length;
      b.rows.forEach((r, j) => { if (r.length !== lebar) lapor(f, `${dari} blok ${i} baris ${j}: ${r.length} sel, kepala ${lebar}`); });
    }
  }
};

let totalSoal = 0, totalHal = 0;
const berkas = fs.readdirSync(dir).filter((n) => /^unit-\d+\.json$/.test(n)).sort();
for (const f of berkas) {
  const u = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  // [ebook-testprep-v1] Unit persiapan tes tak punya dialog & kosakata.
  const wajib = u.jenis === "testprep"
    ? ["title", "title_target", "goal", "skill", "sections", "exercises", "answers"]
    : ["title", "title_target", "goal", "bekal", "dialogs", "sections", "vocab", "exercises", "answers"];
  for (const k of wajib)
    if (u[k] == null) lapor(f, `kunci "${k}" hilang`);
  u.exercises?.forEach((e, i) => {
    totalSoal += e.items.length;
    const kunci = u.answers?.[String(i)];
    if (kunci == null) return lapor(f, `latihan ${i}: kunci jawaban hilang`);
    const potong = kunci.split(" — ");
    if (potong.length !== e.items.length) lapor(f, `latihan ${i}: kunci ${potong.length} potong, soal ${e.items.length}`);
    e.items.forEach((it, j) => {
      const susun = it.includes(" / "), isian = it.includes("____");
      if (susun && isian) lapor(f, `latihan ${i} soal ${j}: ada " / " dan "____" sekaligus`);
    });
  });
  u.dialogs?.forEach((d, i) => {
    cekBlok(f, d.grammars?.flatMap((g) => g.table ? [{ type: "tabel", ...g.table }] : []), `dialog ${i} kotak`);
    d.lines?.forEach((l, j) => { if (!l.text || !l.id) lapor(f, `dialog ${i} baris ${j}: text/id kosong`); });
  });
  u.sections?.forEach((s, i) => cekBlok(f, s.blocks, `bagian ${i}`));
  u.pembahasan?.forEach((s, i) => cekBlok(f, s.blocks, `pembahasan ${i}`));
  u.exercises?.forEach((e, i) => {
    if (e.tipe && !["isian", "terjemah", "susun"].includes(e.tipe)) lapor(f, `latihan ${i}: tipe "${e.tipe}" tak dikenal`);
    if (e.pilihan) {
      const kunci = (u.answers?.[i] ?? "").split(" — ").map((k) => k.trim());
      kunci.forEach((k, j) => { if (k && !e.pilihan.includes(k)) lapor(f, `latihan ${i} soal ${j}: kunci "${k}" tak ada di pilihan`); });
    }
  });
  const vocabKunci = new Set(u.vocab?.map((v) => Object.keys(v).join(",")));
  if (vocabKunci.size > 1) lapor(f, `kosakata punya bentuk kunci campur: ${[...vocabKunci].join(" | ")}`);
}

const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
["front", "back"].forEach((k) => (meta[k] ?? []).forEach((h, i) => cekBlok("meta.json", h.blocks, `${k}[${i}]`)));

const naskahInfo = naskah ? ` • ${naskah} naskah listening (${naskahAudio} beraudio${naskah - naskahAudio ? `, ${naskah - naskahAudio} belum` : ""})` : "";
console.log(`\n${berkas.length} unit • ${totalSoal} soal${naskahInfo} • ${salah} masalah`);
process.exit(salah ? 1 : 0);
