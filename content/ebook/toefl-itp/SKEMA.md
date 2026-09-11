# Skema unit modul TOEFL ITP Prep (content/ebook/toefl-itp)

Modul ini dirakit `node scripts/build-ebook-pdf.mjs toefl-itp` (jalankan dari root repo linguo-landing).
Periksa berkas unit dengan `node scripts/cek-unit-ebook.mjs toefl-itp` — WAJIB 0 masalah.
Patokan gaya & bentuk berkas: modul kembarannya `content/ebook/ielts-prep/` —
BACA `ielts-prep/unit-06.json` (Reading) dan `ielts-prep/unit-01.json` (Listening + transkrip) DULU sebelum menulis.
Bedanya dengan IELTS: TOEFL ITP **seluruhnya pilihan ganda A–D**, tanpa Writing/Speaking, ejaan **Amerika**.

## Tentang tesnya (fakta yang harus konsisten di semua unit)
- TOEFL ITP Level 1, kertas, ±2 jam, 140 soal, skor 310–677.
- Section 1 **Listening Comprehension** — 50 soal, 35 menit, audio diputar SEKALI, soalnya TIDAK tercetak di buku soal
  (hanya pilihan A–D). Part A: 30 percakapan pendek (2 baris, 1 soal). Part B: 2 percakapan panjang (7–9 soal).
  Part C: 3 ceramah/pengumuman pendek (11–13 soal).
- Section 2 **Structure and Written Expression** — 40 soal, 25 menit. Structure (1–15): melengkapi kalimat.
  Written Expression (16–40): memilih SATU bagian bergaris bawah yang salah dari empat.
- Section 3 **Reading Comprehension** — 50 soal, 55 menit, 5 passage ±250–350 kata, 10 soal per passage.
  Topik akademik gaya buku teks Amerika (sains, sejarah AS, biografi, seni, ilmu sosial). Tidak ada pertanyaan opini.
- Tiap section dinilai skala 31–68; skor total = (jumlah tiga skala × 10) ÷ 3. Salah TIDAK mengurangi skor → semua soal WAJIB diisi.
- Target pembaca: B1–B2 yang mengincar **550+** (syarat umum S2/beasiswa; 500 syarat umum S1).

## Bahasa & gaya
- Pengantar, strategi, pembahasan: **bahasa Indonesia** yang enak dibaca, kalimat pendek, langsung ke inti, boleh "kamu".
  Gaya seperti unit contoh IELTS — bukan gaya buku teks kaku. Jangan menjelaskan grammar dasar dari nol; jelaskan
  **jebakan** yang dipakai penulis soal.
- Materi tes (percakapan, ceramah, kalimat soal, passage, pilihan): **bahasa Inggris** otentik setara TOEFL ITP,
  American spelling (color, center, program, organize). Nama & tempat fiktif tapi masuk akal; topik passage boleh
  nyata (fotosintesis, Dust Bowl, Harlem Renaissance) — fakta harus benar.
- Markdown ringan: `**tebal**`, `*miring*`. JANGAN pakai `*` untuk hal lain. Titik tengah tulis langsung `·`.
  Jangan pakai entitas HTML (&middot; &amp; dll). Tanda kutip lurus `"` boleh.
- Tiap unit: 6–9 halaman A4 ≈ 1.800–2.800 kata total (termasuk transkrip/passage/pilihan). Jangan lebih tipis.

## Bentuk berkas `unit-NN.json`
```json
{
 "jenis": "testprep",
 "skill": "LISTENING · PART A",        // badge di kepala unit, huruf besar. Contoh lain: "STRUCTURE", "WRITTEN EXPRESSION", "READING", "STRATEGI TES"
 "title": "Judul unit (Indonesia/istilah tes)",
 "title_target": "Subjudul bahasa Inggris",
 "goal": "Satu-dua kalimat: yang bisa dilakukan siswa setelah unit ini.",
 "bekal": ["tiga kemampuan konkret", "…", "…"],
 "sections": [ { "title": "…", "blocks": [ …blok… ] } ],   // 4–6 bagian: apa yang diuji & jebakannya → strategi → contoh dibedah → bahan (transkrip/passage) untuk latihan
 "exercises": [ …latihan… ],
 "answers": [ "A — C — B — …", … ],                       // SATU string per latihan, kunci per item dipisah " — " (spasi, em dash, spasi)
 "pembahasan": [ { "title": "Pembahasan", "blocks": [ …blok… ] } ]   // dicetak SETELAH kunci jawaban
}
```

## Jenis blok (di `sections[].blocks` dan `pembahasan[].blocks`)
- `{"type":"p","text":"…"}` paragraf
- `{"type":"sub","text":"…"}` anak judul
- `{"type":"list","items":["…","…"]}` bullet
- `{"type":"kotak","title":"…","items":["paragraf","paragraf"]}` kotak sorot (tips, daftar idiom, definisi)
- `{"type":"tabel","head":["…","…"],"rows":[["…","…"],…]}` — tiap baris JUMLAH SEL = jumlah head
- `{"type":"passage","title":"…","words":312,"paragraphs":[{"label":"1","text":"…"},…]}` bacaan Reading; label = nomor paragraf
  (soal rujukan memakai "in paragraph 2", BUKAN nomor baris — perakit tidak mencetak nomor baris)
- `{"type":"transkrip","title":"…","lines":[{"speaker":"Man","text":"…"},{"speaker":"Woman","text":"…"},{"text":"**Conversation 2**"}]}`
  naskah Listening. Baris tanpa `speaker` dipakai sebagai pemisah/nomor percakapan. Penutur Part A: "Man"/"Woman";
  Part B/C boleh "Student", "Professor", "Guide", "Narrator".

## Latihan (WAJIB dikoreksi otomatis di reader — ikuti persis)
Semua latihan modul ini pilihan ganda:
```json
{"prompt":"Questions 1–8. Read each conversation ONCE, then choose the best answer. (Instruksi tambahan bahasa Indonesia boleh.)",
 "tipe":"isian",
 "pilihan":["A","B","C","D"],
 "items":["What does the woman mean? (A) She has already eaten. (B) She is not hungry yet. (C) She will eat later. (D) She forgot to eat. ____"]}
```
- Tiap item WAJIB diakhiri ` ____` (spasi + empat garis bawah) tepat SATU kali, dan TIDAK boleh ada `____` lain di dalamnya.
  Karena itu **celah kalimat Structure ditulis `……`** (dua elipsis), bukan garis bawah:
  `"The Great Lakes …… the largest group of freshwater lakes in the world. (A) is (B) are (C) being (D) which are ____"`
- Item TIDAK boleh memuat " / " (spasi-garis miring-spasi).
- **Written Expression**: empat bagian bergaris bawah ditulis tebal berlabel:
  `"The results of the experiment **(A) was** published **(B) in** a journal **(C) that** many scientists **(D) read**. ____"`, kunci = huruf bagian yang salah.
  Bagian yang dilabeli harus benar-benar 1–3 kata seperti tes asli, dan HANYA SATU yang salah; tiga lainnya harus benar tanpa keraguan.
- **Listening**: transkrip percakapan/ceramah ditaruh di `sections` (blok `transkrip`) SEBELUM latihan; item latihan hanya
  pertanyaan + pilihan. Part A: satu percakapan per item, beri pemisah `**Conversation N**` di transkrip dengan N = nomor item.
  Part B/C: satu transkrip panjang → 4–6 soal.
- **Reading**: SATU passage 280–360 kata → 10–12 soal yang mencakup: main idea/purpose, vocabulary in context ("The word *X* in paragraph 2 is closest in meaning to"), reference ("The word *they* in paragraph 3 refers to"), detail, negative fact (NOT/EXCEPT), inference, organization.
- Kunci `A`/`B`/`C`/`D` HARUS persis salah satu isi `pilihan`. Sebarkan kunci merata (jangan 6 dari 10 jawabannya C).
- Jumlah potongan kunci di `answers[k]` = jumlah `items` di `exercises[k]`.
- Per unit: 2–4 latihan, total **15–20 item** (Listening Part A 15, Part B/C 10–12, Structure 15, Written Expression 20, Reading 10–12 + 5 soal strategi bila perlu).
- Pengecoh harus bermutu: satu yang memakai kata dari teks tapi maknanya lain, satu yang masuk akal di dunia nyata tapi tak disebut, satu yang bertentangan.

## Pembahasan
Tabel `["No","Jawaban","Alasan & pengecoh"]` untuk tiap soal (kutip frasa sumbernya dengan *miring*; untuk Written Expression tulis bentuk yang benar),
lalu satu `kotak` "Yang perlu dicatat" (2–3 poin).

## Validasi sebelum selesai
1. `node -e "JSON.parse(require('fs').readFileSync('content/ebook/toefl-itp/unit-NN.json','utf8'))"`
2. `node scripts/cek-unit-ebook.mjs toefl-itp` → unit-mu tidak muncul di daftar masalah (unit lain mungkin sedang ditulis agen lain).
3. Hitung: jumlah item = jumlah kunci; tiap item tepat satu `____` di ujung; tiap kunci ∈ pilihan; kunci tersebar.
4. Periksa lagi bahwa jawaban yang kamu tandai benar MEMANG benar dan tiga lainnya MEMANG salah — ini soal grammar & bacaan, kesalahan kunci fatal.
