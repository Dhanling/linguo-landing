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
/* Ekor kata kerja Spanyol yang sesekali lolos lewat contoh kalimat tanpa tanda
   miring, dan kata serapan yang ejaannya sama persis di bahasa target —
   mengunci ini berarti mengunci kata bahasa targetnya sekalian. */
const EKOR_ASING = /(amos|emos|imos|aron|ieron|aban|ando|iendo|cion|mente|aste|aria|eron)$/;
const BUANG = new Set([
  "middot", "kana", "bon", "sma", "yen", "jakarta", "barcelona", "tokyo", "kyoto",
  "meksiko", "korea", "argentina", "amerika", "natto", "ramen", "kari", "motor",
  "meter", "bola", "pos", "pasar", "euro", "foto", "menu", "serial", "festival",
  "apel", "salad", "tomat", "sup", "pena", "peron", "radio", "hotel", "taxi",
]);

const idF = new Map();
const tgF = new Map();
const pecah = (s) => String(s).toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
const catat = (m, s) => pecah(s).forEach((w) => m.set(w, (m.get(w) || 0) + 1));

/** Teks Indonesia: penggalan *miring* di dalamnya justru bahasa target. */
function teksId(s) {
  if (typeof s !== "string") return;
  catat(tgF, [...s.matchAll(MIRING)].map((m) => m[1]).join(" "));
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
        else teksTarget(sel);
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
  teksId(j.title); teksTarget(j.title_target); teksId(j.goal); daftarId(j.bekal);
  for (const d of j.dialogs || []) {
    teksTarget(d.title); teksId(d.intro);
    for (const l of d.lines || []) { teksTarget(l.text); teksId(l.id); teksId(l.literal); }
  }
  for (const s of j.sections || []) { teksId(s.title); (s.blocks || []).forEach(blok); }
  for (const v of j.vocab || []) { teksTarget(v.es); teksTarget(v.ja); teksId(v.id); }
  for (const e of j.exercises || []) { teksId(e.title); teksId(e.prompt); daftarId(e.items); }
  daftarId(j.answers);
  for (const hal of [...(j.front || []), ...(j.back || [])]) {
    teksId(hal.title); (hal.blocks || []).forEach(blok);
  }
}

for (const modul of fs.readdirSync(AKAR)) {
  const dir = path.join(AKAR, modul);
  if (!fs.statSync(dir).isDirectory()) continue;
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
console.log(baris.join("\n"));
console.error(`${kata.length} kata`);
