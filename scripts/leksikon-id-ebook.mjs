/* [ebook-jaga-bahasa-id-v2] Pemeras leksikon Indonesia dari isi modul.
 *
 * Penjagaan "kata Indonesia tidak boleh diketuk" di src/lib/ebookTts.ts berdiri
 * di atas daftar kata. Daftar itu TIDAK dikarang: diperas dari isi modul sendiri
 * di content/ebook — kata yang muncul di ruas berbahasa Indonesia dan praktis
 * tak pernah muncul di ruas bahasa target.
 *
 * Jalankan sesudah menambah modul baru, lalu tempel keluarannya ke konstanta
 * LEKSIKON_ID di src/lib/ebookTts.ts:
 *
 *   node scripts/leksikon-id-ebook.mjs
 *
 * Yang membuat perasannya bersih: struktur modul memang menyebut bahasanya
 * sendiri — `vocab[].es|ja` bahasa target, `vocab[].id` artinya, dan tabel
 * membawa `head` ("Español | Cara baca | Arti") yang menunjuk kolom mana milik
 * siapa. Di paragraf, satu bintang *miring* berarti bahasa target, dua bintang
 * **tebal** berarti penegasan bahasa Indonesia.
 */
import fs from "node:fs";
import path from "node:path";

const AKAR = path.join(process.cwd(), "content/ebook");
const MIRING = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g;
/** Kepala kolom yang isinya bahasa Indonesia. Sisanya dianggap bahasa target. */
const KEPALA_ID = /arti|makna|indonesia|terjemah/i;
/** Kepala kolom "cara baca": bukan bahasa mana pun, jangan diperas. */
const KEPALA_BACA = /cara baca|baca|pelafalan|romaji|rōmaji/i;
/* Ekor kata kerja Spanyol & Italia yang sesekali lolos lewat contoh kalimat
   tanpa tanda miring, dan kata serapan yang ejaannya sama persis di bahasa
   target — mengunci ini berarti mengunci kata bahasa targetnya sekalian.
   Ekor Italia (-ano, -ono, -iamo, -are/-ere/-ire, -ato/-uto/-ito, -issimo,
   -zione) ditambahkan bersama modul it-a1: tanpa itu kata kerja Italia di soal
   latihan ("abitano", "addormenti", "alcune") ikut terperas jadi kata
   Indonesia, lalu dibungkam di reader — persis kebalikan dari maunya. Tak ada
   kata Indonesia lazim yang berekor begini, jadi risikonya sepihak. */
const EKOR_ASING = /(amos|emos|imos|aron|ieron|aban|ando|iendo|cion|mente|aste|aria|eron|iamo|ano|ono|are|ere|ire|ato|uto|ito|issimo|issima|zione)$/;
const BUANG = new Set([
  "middot", "kana", "bon", "sma", "yen", "jakarta", "barcelona", "tokyo", "kyoto",
  "meksiko", "korea", "argentina", "amerika", "natto", "ramen", "kari", "motor",
  "meter", "bola", "pos", "pasar", "euro", "foto", "menu", "serial", "festival",
  "apel", "salad", "tomat", "sup", "pena", "peron", "radio", "hotel", "taxi",
]);

const idF = new Map();
const tgF = new Map();
/* [ebook-jaga-bahasa-en-v1] Modul Inggris butuh daftar KEDUA. Bahasa Inggris
   ditulis dengan huruf Latin polos, jadi `kataTargetJelas` di ebookTts.ts tak
   pernah menemukan bukti bahasa target di dalamnya — dan satu kata serapan
   ("bank", "film", "bus", "video") sudah cukup untuk membungkam seluruh
   klausanya. Daftar ini yang jadi bukti tandingannya, diperas dari ruas yang
   TIDAK MUNGKIN berbahasa Indonesia: baris dialog, `title_target`, dan kolom
   `vocab[].en`. */
const enKuat = new Map();   // ruas yang dijamin skema: dialog, title_target, vocab[].en, kolom "English"
const enLemah = new Map();  // ruas yang dijamin kebiasaan saja: penggalan *miring* di dalam prosa
let modulEn = false;
const teksEn = (s) => { if (modulEn && typeof s === "string") catat(enKuat, s); };
const teksEnMiring = (s) => { if (modulEn && typeof s === "string") catat(enLemah, s); };
const pecah = (s) => String(s).toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
const catat = (m, s) => pecah(s).forEach((w) => m.set(w, (m.get(w) || 0) + 1));

/** Teks Indonesia: penggalan *miring* di dalamnya justru bahasa target. */
function teksId(s) {
  if (typeof s !== "string") return;
  const miring = [...s.matchAll(MIRING)].map((m) => m[1]).join(" ");
  catat(tgF, miring);
  teksEnMiring(miring);                             // *miring* = bahasa target, menurut aturan modul
  catat(idF, s.replace(MIRING, " "));
}
const teksTarget = (s) => { if (typeof s === "string") catat(tgF, s); };
const daftarId = (v) => (Array.isArray(v) ? v : [v]).forEach(teksId);

function blok(b) {
  if (!b || typeof b !== "object") return;
  if (b.type === "tabel" && Array.isArray(b.rows)) {
    const kepala = Array.isArray(b.head) ? b.head : [];
    for (const baris of b.rows) {
      (Array.isArray(baris) ? baris : []).forEach((sel, i) => {
        const judul = String(kepala[i] ?? "");
        if (KEPALA_BACA.test(judul)) return;                 // kolom cara baca: bukan bahasa mana pun
        if (KEPALA_ID.test(judul) || (!kepala.length && i > 0)) teksId(sel);
        else { teksTarget(sel); if (/^english$/i.test(judul.trim())) teksEn(sel); }
      });
    }
    teksId(b.title);
    return;
  }
  // Paragraf, bulir, kotak catatan — semuanya prosa Indonesia.
  teksId(b.title); teksId(b.text); daftarId(b.items);
  if (b.type === "sub") { catat(idF, ""); teksTarget(b.text); } // sub-judul ditulis bahasa target
  (b.blocks || []).forEach(blok);
}

function unit(j) {
  teksId(j.title); teksTarget(j.title_target); teksEn(j.title_target); teksId(j.goal); daftarId(j.bekal);
  for (const d of j.dialogs || []) {
    teksTarget(d.title); teksId(d.intro);
    for (const l of d.lines || []) { teksTarget(l.text); teksEn(l.text); teksId(l.id); teksId(l.literal); }
  }
  for (const s of j.sections || []) { teksId(s.title); (s.blocks || []).forEach(blok); }
  /* Kunci kolom bahasa target per modul: es, ja, en, it, de, zh. Modul baru
     WAJIB menambah kuncinya di sini — kalau tidak, kata bahasa targetnya tak
     pernah terhitung di ruas target, lolos perbandingan 6:1, lalu ikut terperas
     jadi "kata Indonesia" dan dibungkam di reader. */
  for (const v of j.vocab || []) {
    for (const k of ["es", "ja", "en", "it", "de", "zh", "ms"]) teksTarget(v[k]);
    teksEn(v.en); teksId(v.id);
  }
  for (const e of j.exercises || []) { teksId(e.title); teksId(e.prompt); daftarId(e.items); }
  daftarId(j.answers);
  for (const hal of [...(j.front || []), ...(j.back || [])]) {
    teksId(hal.title); (hal.blocks || []).forEach(blok);
  }
}

for (const modul of fs.readdirSync(AKAR)) {
  const dir = path.join(AKAR, modul);
  if (!fs.statSync(dir).isDirectory()) continue;
  modulEn = /^en-/.test(modul);
  for (const berkas of fs.readdirSync(dir)) {
    if (!berkas.endsWith(".json")) continue;
    unit(JSON.parse(fs.readFileSync(path.join(dir, berkas), "utf8")));
  }
}

/* Ambang 6:1 lawan ruas target. Sekali muncul pun ikut: kata Indonesia yang
   cuma tercetak sekali di seluruh modul tetap akan diketuk siswa, dan risikonya
   satu arah — kalau kata itu ternyata bahasa target, ia sudah tersaring lebih
   dulu oleh perbandingan 6:1 di atas. */
const kata = [...idF.entries()]
  .filter(([w, n]) => n >= 1 && w.length >= 3 && /^[a-z]+$/.test(w) && n >= 6 * (tgF.get(w) || 0))
  .map(([w]) => w)
  .filter((w) => !BUANG.has(w) && !EKOR_ASING.test(w))
  .sort();

const baris = [];
let kini = "";
for (const w of kata) {
  if ((kini + " " + w).trim().length > 88) { baris.push("  " + kini.trim()); kini = w; }
  else kini += " " + w;
}
baris.push("  " + kini.trim());
console.log("/* ── LEKSIKON_ID ─────────────────────────────────────────── */");
console.log(baris.join("\n"));

/* Tidak disaring dengan perbandingan seperti daftar Indonesia di atas, dan itu
   disengaja: ruas sumbernya sudah dijamin bahasa Inggris oleh skema modul
   (baris dialog, `title_target`, `vocab[].en`), sementara kata yang PALING
   butuh diselamatkan justru kata serapan seperti "bank" & "film" — yang memang
   jauh lebih sering tercetak di penjelasan Indonesianya. Menyaringnya dengan
   perbandingan berarti membuang persis kata yang jadi alasan daftar ini ada.
   Yang ikut terbawa cuma nama diri (Budi, Surabaya, Indonesia), dan nama diri
   memang tak apa-apa dibunyikan. */
/* Dua tingkat kepercayaan, dan itu yang membuat daftarnya bisa longgar tanpa
   bocor. Ruas KUAT dijamin oleh skema modul — baris dialog, `title_target`,
   `vocab[].en`, kolom bertajuk "English" — jadi isinya diterima apa adanya,
   termasuk kata serapan seperti "bank" & "film" yang di prosa Indonesia justru
   jauh lebih sering tercetak. Ruas LEMAH cuma dijamin kebiasaan menulis
   (*miring* = bahasa target), dan di situlah frasa Indonesia sesekali ikut
   terbawa — maka ia disaring 20:1 lawan prosa Indonesianya. */
const kataEn = [...new Set([
  ...[...enKuat.keys()],
  ...[...enLemah.entries()].filter(([w, n]) => n * 20 >= (idF.get(w) || 0)).map(([w]) => w),
])]
  .filter((w) => w.length >= 2 && /^[a-z']+$/.test(w))
  .sort();
const barisEn = [];
let kiniEn = "";
for (const w of kataEn) {
  if ((kiniEn + " " + w).trim().length > 88) { barisEn.push("  " + kiniEn.trim()); kiniEn = w; }
  else kiniEn += " " + w;
}
barisEn.push("  " + kiniEn.trim());
console.log("\n/* ── LEKSIKON_EN ─────────────────────────────────────────── */");
console.log(barisEn.join("\n"));
console.error(`${kata.length} kata Indonesia · ${kataEn.length} kata Inggris`);
