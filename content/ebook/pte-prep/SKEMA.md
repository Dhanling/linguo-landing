# Skema unit modul PTE Academic Prep (content/ebook/pte-prep)

Modul ini dirakit `node scripts/build-ebook-pdf.mjs pte-prep` (jalankan dari root repo linguo-landing).
Periksa berkas unit dengan `node scripts/cek-unit-ebook.mjs pte-prep` — WAJIB 0 masalah.
Patokan gaya & bentuk berkas: modul kembarannya `content/ebook/ielts-prep/` —
BACA `ielts-prep/unit-06.json` (Reading), `ielts-prep/unit-01.json` (Listening + transkrip) dan
`ielts-prep/unit-15.json` (Speaking) DULU sebelum menulis.
Bedanya dengan IELTS: PTE Academic **seluruhnya di komputer dan dinilai mesin** (sejak 7 Agustus 2025
sebagian jawaban ikut ditinjau penilai manusia), tak ada pewawancara, dan 22 tipe soalnya pendek-pendek.
Yang diajarkan modul ini adalah cara kerja tiap tipe soal dan cara mesin menilainya.

## Tentang tesnya (fakta yang HARUS konsisten di semua unit — jangan menulis angka di luar daftar ini)
- PTE Academic (Pearson Test of English Academic): tes berbasis komputer di pusat tes Pearson, satu sesi ± 2 jam,
  jawaban Speaking direkam lewat mikrofon headset. Skor 10–90 (Global Scale of English): satu skor Overall + empat
  skor keterampilan (Listening, Reading, Speaking, Writing). Hasil biasanya keluar dalam ± 2 hari.
- Sejak **7 Agustus 2025** formatnya diperbarui: 22 tipe soal (dulu 20). Dua tipe baru di Speaking:
  **Summarize Group Discussion** dan **Respond to a Situation**. Tujuh tipe soal kini juga ditinjau penilai manusia
  untuk ISI-nya: Describe Image, Retell Lecture, Respond to a Situation, Summarize Group Discussion,
  Summarize Written Text, Write Essay, Summarize Spoken Text. Akibatnya **jawaban template hafalan** yang tidak
  menyentuh isi soal dinilai rendah — modul ini mengajarkan KERANGKA (urutan berpikir), bukan kalimat hafalan.
- **Part 1 · Speaking & Writing (76–84 menit)**, urutannya:
  - Personal Introduction — 25 detik siap, 30 detik bicara, TIDAK dinilai.
  - Read Aloud — teks sampai 60 kata; 30–40 detik persiapan; dinilai Speaking (content, oral fluency, pronunciation).
  - Repeat Sentence — audio 3–9 detik, diputar SEKALI; 15 detik menjawab; Listening & Speaking.
  - Describe Image — 25 detik persiapan, 40 detik bicara; Speaking.
  - Retell Lecture — audio sampai 90 detik; 10 detik persiapan, 40 detik bicara; Listening & Speaking.
  - Answer Short Question — audio 3–9 detik; 10 detik menjawab; jawaban satu atau beberapa kata; benar/salah.
  - Summarize Group Discussion — audio diskusi tiga orang sampai 3 menit; 10 detik persiapan, 2 menit bicara; Listening & Speaking.
  - Respond to a Situation — deskripsi situasi sampai 60 kata (dibacakan dan tercetak); 10 detik persiapan, 40 detik bicara; Speaking.
  - Summarize Written Text — teks sampai 300 kata; 10 menit; SATU kalimat, 5–75 kata; Reading & Writing.
  - Write Essay — prompt 2–3 kalimat; 20 menit; 200–300 kata; Writing.
- **Part 2 · Reading (23–30 menit, SATU timer untuk seluruh bagian)**, 5 tipe:
  - Fill in the Blanks (Dropdown) — teks sampai 200 kata, tiap celah punya 4 pilihan dropdown. (Nama lamanya "Reading & Writing: Fill in the Blanks".)
  - Multiple Choice, Multiple Answers — teks sampai 350 kata; benar +1, salah −1, minimum 0.
  - Reorder Paragraph — teks sampai 110 kata (4–5 kotak kalimat); nilai per PASANGAN berurutan yang benar.
  - Fill in the Blanks (Drag and Drop) — teks sampai 80 kata; kata diseret dari kotak, jumlah kata di kotak lebih banyak dari celah.
  - Multiple Choice, Single Answer — teks sampai 110 kata; benar/salah.
- **Part 3 · Listening (31–39 menit)**, 8 tipe, audio diputar SEKALI:
  - Summarize Spoken Text — audio 60–90 detik; 10 menit (timer sendiri per soal); ringkasan 50–70 kata; Listening & Writing.
  - Multiple Choice, Multiple Answers — benar +1, salah −1, minimum 0.
  - Fill in the Blanks (Type In) — audio 30–60 detik; mengetik kata yang hilang di transkrip; ejaan harus benar.
  - Highlight Correct Summary — audio 30–90 detik; pilih satu ringkasan; Listening & Reading.
  - Multiple Choice, Single Answer — audio 30–60 detik.
  - Select Missing Word — audio 20–70 detik; ujung rekaman diganti bunyi "bip", pilih kata/frasa penutupnya.
  - Highlight Incorrect Words — audio 15–50 detik; klik kata di transkrip yang BERBEDA dari rekaman; benar +1, salah −1, minimum 0; Listening & Reading.
  - Write from Dictation — kalimat 3–5 detik; ketik persis; 1 poin per kata yang benar ejaannya; Listening & Writing.
- Jumlah soal per tipe TIDAK diumumkan pasti dan bergeser tiap tes. Kalau perlu menyebut, tulis "kira-kira" dan hanya angka ini:
  Read Aloud ± 6–7, Repeat Sentence ± 10–12, Describe Image ± 5–6, Retell Lecture ± 2–3, Answer Short Question ± 5–6,
  Summarize Group Discussion ± 2–3, Respond to a Situation ± 2–3, Summarize Written Text ± 2, Write Essay ± 1,
  Write from Dictation ± 3–4, Highlight Incorrect Words ± 2–3, Listening Fill in the Blanks ± 2–3, Summarize Spoken Text ± 1–2.
  Untuk tipe lain tulis "beberapa soal", jangan mengarang angka.
- Hal teknis yang benar dan boleh dipakai:
  - Di soal Speaking, mikrofon berhenti merekam kalau kamu diam **3 detik** — status berubah "Completed" dan tak bisa diulang.
  - Tidak ada tombol kembali: sesudah "Next", soal tidak bisa dibuka lagi.
  - Mesin menilai *oral fluency* (irama, tanpa jeda/ulang/ralat) dan *pronunciation* (bisa dipahami penutur asli) terpisah dari *content*.
  - Aksen apa pun diterima asal jelas. Ejaan Inggris British ATAU Amerika diterima asal konsisten dalam satu jawaban.
  - Write Essay dinilai: content, form (200–300 kata), development/structure/coherence, grammar, general linguistic range, vocabulary range, spelling.
  - Summarize Written Text: content, form (satu kalimat, 5–75 kata — lebih dari satu kalimat = form 0), grammar, vocabulary.
  - Summarize Spoken Text: content, form (50–70 kata), grammar, vocabulary, spelling.
  - JANGAN menulis rincian poin/bobot lain (mis. "Repeat Sentence menyumbang 30% skor") — Pearson tidak menerbitkannya.
- Konkordansi resmi Pearson (Juli 2025) PTE ↔ IELTS Academic, skor Overall: IELTS 6.0 = PTE 47–54 · 6.5 = 55–62 · **7.0 = 63–70** · 7.5 = 71–78 · 8.0 = 79–85.
- Target pembaca: B1–B2 yang mengincar **65+** (≈ IELTS 7.0; syarat umum S2 dan banyak jalur visa/profesi). Skor 50-an ≈ IELTS 6.0–6.5.

## Daftar unit (17) — JANGAN mengubah `skill`; urutannya urutan tes
| No | `skill` | Isi |
|---|---|---|
| 1 | SPEAKING · READ ALOUD | Read Aloud |
| 2 | SPEAKING · REPEAT SENTENCE | Repeat Sentence |
| 3 | SPEAKING · DESCRIBE IMAGE | Describe Image |
| 4 | SPEAKING · RETELL LECTURE | Retell Lecture |
| 5 | SPEAKING · SHORT QUESTION & SITUATION | Answer Short Question + Respond to a Situation |
| 6 | SPEAKING · GROUP DISCUSSION | Summarize Group Discussion |
| 7 | WRITING · SUMMARIZE WRITTEN TEXT | Summarize Written Text |
| 8 | WRITING · ESSAY | Write Essay 1: membaca prompt, kerangka, paragraf |
| 9 | WRITING · ESSAY | Write Essay 2: bahasa — grammar range, kosakata, koherensi, ejaan; esai skor 50-an vs 79+ |
| 10 | READING · FILL IN THE BLANKS | Fill in the Blanks (Dropdown): kolokasi & tata bahasa |
| 11 | READING · FILL IN THE BLANKS | Fill in the Blanks (Drag and Drop): kelas kata & makna |
| 12 | READING · REORDER PARAGRAPH | Reorder Paragraph |
| 13 | READING · MULTIPLE CHOICE | Multiple Choice Single & Multiple Answers (Reading) + manajemen waktu Part 2 |
| 14 | LISTENING · SUMMARIZE SPOKEN TEXT | Summarize Spoken Text |
| 15 | LISTENING · MULTIPLE CHOICE & SUMMARY | MC Single/Multiple, Highlight Correct Summary, Select Missing Word |
| 16 | LISTENING · BLANKS & INCORRECT WORDS | Fill in the Blanks (Type In) + Highlight Incorrect Words |
| 17 | LISTENING · WRITE FROM DICTATION | Write from Dictation |

## Bahasa & gaya
- Pengantar, strategi, pembahasan: **bahasa Indonesia** yang enak dibaca, kalimat pendek, langsung ke inti, boleh "kamu".
  Gaya seperti unit contoh IELTS — bukan gaya buku teks kaku. Jangan menjelaskan grammar dasar dari nol; jelaskan
  **apa yang didengar/dihitung mesin** dan kesalahan khas penutur Indonesia.
- Materi tes (teks Read Aloud, kalimat, kuliah, diskusi, passage, prompt esai, model jawaban): **bahasa Inggris** akademik
  otentik setara PTE. Topik akademik-umum (sains, lingkungan, ekonomi, pendidikan, teknologi, sejarah, kesehatan). Nama & lembaga
  fiktif tapi masuk akal; fakta ilmiah harus benar. Ejaan boleh British atau Amerika tapi KONSISTEN dalam satu unit.
- Nama tipe soal ditulis dalam bahasa Inggris persis seperti di tes (Read Aloud, Repeat Sentence, …), tidak diterjemahkan.
- Markdown ringan: `**tebal**`, `*miring*`. JANGAN pakai `*` untuk hal lain. Titik tengah tulis langsung `·`.
  Jangan pakai entitas HTML (&middot; &amp; dll). Jangan pakai tanda `/` diapit spasi di dalam item latihan.
- Tiap unit: 7–9 halaman A4 ≈ 2.200–3.000 kata total; ukuran berkas **22–30 KB**. Jangan lebih tipis.
- JANGAN menyebut "Simulasi" Linguo — belum ada simulasi PTE. Untuk tes penuh, rujuk "tes latihan resmi berskor dari Pearson"
  dan kelas Private PTE Linguo secara umum saja (tanpa harga, tanpa tautan).

## Bentuk berkas `unit-NN.json`
```json
{
 "jenis": "testprep",
 "skill": "SPEAKING · READ ALOUD",      // PERSIS seperti tabel daftar unit di atas
 "title": "Judul unit (Indonesia/istilah tes)",
 "title_target": "Subjudul bahasa Inggris",
 "goal": "Satu-dua kalimat: yang bisa dilakukan siswa setelah unit ini.",
 "bekal": ["tiga kemampuan konkret", "…", "…"],
 "sections": [ { "title": "…", "blocks": [ …blok… ] } ],   // 4–6 bagian: bentuk soal & cara dinilai → strategi langkah demi langkah → contoh dibedah → bahan latihan (teks/naskah/grafik) → tugas terbuka + cara menilai diri
 "exercises": [ …latihan… ],
 "answers": [ "kunci — kunci — kunci", … ],                 // SATU string per latihan, kunci per item dipisah " — " (spasi, em dash, spasi)
 "pembahasan": [ { "title": "Pembahasan", "blocks": [ …blok… ] } ]   // dicetak SETELAH kunci jawaban
}
```
Tulis JSON dengan indentasi 1 spasi seperti unit IELTS, satu baris per baris naskah/item.

## Jenis blok (di `sections[].blocks` dan `pembahasan[].blocks`)
- `{"type":"p","text":"…"}` paragraf
- `{"type":"sub","text":"…"}` anak judul
- `{"type":"list","items":["…","…"]}` bullet
- `{"type":"kotak","title":"…","items":["paragraf","paragraf"]}` kotak sorot (tips, model jawaban, kerangka)
- `{"type":"tabel","head":["…","…"],"rows":[["…","…"],…]}` — tiap baris JUMLAH SEL = jumlah head
- `{"type":"passage","title":"…","words":142,"paragraphs":[{"label":"A","text":"…"},…]}` teks bacaan (label opsional; boleh string polos).
  Untuk Reorder Paragraph: label = huruf kotak ACAK (A–E), urutan cetak = urutan acak.
- `{"type": "transkrip", "title": "…", "lines": [{"speaker":"Lecturer","text":"…"}, {"text":"**Sentence 1**"}, …]}` naskah audio.
  **Tulis PERSIS dengan urutan kunci `"type"` lalu `"title"` di baris yang sama** — skrip audio mencari pola itu.
  Semua blok transkrip di `sections` satu unit digabung jadi SATU MP3 (judul tiap blok dibacakan narator sebagai penanda),
  dan reader menampilkan tombol "Putar audio". Karena itu:
  - blok yang cuma contoh di bagian strategi beri judul berawalan **"Cuplikan: …"** (tidak ikut audio);
  - baris tanpa `speaker` = pemisah yang dibacakan narator, mis. `{"text":"**Sentence 3**"}` atau `{"text":"**Question 5**"}`;
  - penutur yang BOLEH dipakai (suara sudah dipetakan): `Speaker` (kalimat lepas: Repeat Sentence, Write from Dictation,
    Answer Short Question, Select Missing Word), `Lecturer` (kuliah laki-laki), `Professor` (kuliah perempuan),
    `Anna`, `Ben`, `Chloe` (diskusi kelompok tiga orang), `Man`, `Woman` (percakapan), `Model` (model jawaban lisan yang dibacakan).
  - Unit 2, 4, 5, 6, 14, 15, 16, 17 WAJIB punya naskah audio latihan. Unit 1 dan 3 boleh punya satu blok `Model`
    (model pembacaan/jawaban) — bagus untuk ditiru siswa. Total naskah beraudio per unit: 500–1.100 kata.
  - Select Missing Word: naskahnya berhenti di titik potong dan diakhiri "…" — kata/frasa penutupnya TIDAK ditulis di naskah
    (jangan menulis "beep"); pilihan jawabannya ada di item latihan.
  - Highlight Incorrect Words: naskah audio = versi yang BENAR; versi layar (dengan kata yang diganti) ditulis di item latihan.
- `{"type":"grafik","jenis":"garis"|"batang"|"pai", "judul":"…","sumbu_y":"…","satuan":"%","maks":100,"label_nilai":true,
     "kategori":["2000","2010"], "seri":[{"nama":"Men","nilai":[10,20]}]}`
  pai: `"pai":[{"judul":"2000","irisan":[{"nama":"Coal","nilai":40},…]}, …]` (1–3 pai berdampingan).
  Unit 3 (Describe Image) WAJIB memuat minimal 5 grafik (garis, batang, pai) + boleh `tabel` sebagai "gambar tabel".
  Lihat pemakaian `grafik` di `ielts-prep/unit-10.json`.
- `{"type":"gambar","file":"nama.svg","lebar":"150mm","caption":"…"}` — SVG buatan tangan di folder modul ini (diagram proses, peta,
  siklus). Opsional; kalau membuat, nama berkas diakhiri nomor unit (`proses-03.svg`), lebar viewBox ± 600, fon sans-serif, tanpa skrip.

## Latihan (WAJIB dikoreksi otomatis di reader — ikuti persis)
```json
{"prompt":"Instruksi ala PTE (Inggris) … — Artinya: terjemahan instruksinya dalam bahasa Indonesia",   // JANGAN diawali "Latihan 1." — nomor ditambah perakit
 "tipe":"isian",
 "pilihan":["A","B","C","D"],                                  // hanya untuk jawaban tertutup; hapus untuk isian terbuka
 "items":["Kalimat soal … ____", "…"]}
```
- Perintah berbahasa Inggris WAJIB disusul ` — Artinya: ` + terjemahan Indonesianya. Perintah yang sudah berbahasa Indonesia tak perlu.
- Tiap item WAJIB memuat `____` (empat garis bawah) tepat SATU kali — di posisi kosong, atau di ujung untuk pilihan ganda.
  Celah LAIN di dalam kalimat (mis. teks Fill in the Blanks yang punya banyak celah) ditulis per item: SATU item = SATU celah.
  Kalau perlu menandai celah kedua dalam item yang sama, tulis `(…)`, bukan garis bawah.
- Item TIDAK boleh memuat " / " (spasi-garis miring-spasi) — itu dibaca sebagai soal susun kata.
- Pilihan ganda: tulis opsi di dalam item: `"The speaker's main point is that … (A) … (B) … (C) … (D) … ____"` dengan `"pilihan":["A","B","C","D"]`.
- Dropdown (Fill in the Blanks): `"Researchers have ____ a link between sleep and memory. (A) established (B) built (C) done (D) grown"` —
  di sini `____` ada di posisi celah dan opsinya di ujung; `"pilihan":["A","B","C","D"]`, kunci huruf.
- Drag and Drop: `"pilihan"` = bank kata (6–8 kata untuk 4–5 celah, ada pengecoh), kunci = kata dari bank.
- Reorder Paragraph: paragraf acak dicetak sebagai `passage` berlabel A–E di `sections`; item = `"Kalimat pertama (topic sentence): ____"`,
  `"Sesudah kalimat pertama: ____"`, … dengan `"pilihan":["A","B","C","D","E"]`.
- Isian terbuka (Write from Dictation, Listening Fill in the Blanks, Highlight Incorrect Words, Answer Short Question):
  kunci = SATU kata atau frasa pendek, huruf kecil kecuali nama; angka ditulis angka. Reader membandingkan longgar
  (huruf besar/kecil & tanda baca diabaikan) tapi harus satu bentuk — hindari soal yang punya dua jawaban sah.
  Write from Dictation: item = kalimat dengan SATU kata dikosongkan (`"Sentence 1: The lecture will ____ at nine o'clock."`); kalimat lengkapnya
  ada di naskah audio. Naskah audio latihan ditaruh di section tersendiri berjudul "Naskah audio latihan" yang dibuka dengan paragraf
  "Putar audionya dulu dan kerjakan latihan TANPA membaca naskah di bawah; naskah ini untuk memeriksa sesudahnya."
- Speaking/Writing (tak bisa dinilai otomatis sebagai rekaman): latihan TERTUTUP yang melatih keputusan di baliknya —
  memilih letak jeda/tekanan yang benar (A/B), memilih jawaban yang skornya lebih tinggi dan kenapa (A/B/C), melengkapi kerangka dengan
  penghubung dari bank kata, menandai ringkasan yang memenuhi syarat form (YES/NO), memilih kalimat yang salah tata bahasa, memilih data
  yang pantas disebut dari grafik (A–D), mengoreksi satu kata. Tugas bicara/menulis terbuka ditaruh di `sections` (bukan `exercises`)
  dengan model jawaban di `pembahasan` dan daftar periksa menilai diri.
- Setiap kunci yang punya `pilihan` HARUS persis salah satu isi `pilihan`. Sebarkan kunci merata.
- Jumlah potongan kunci di `answers[k]` = jumlah `items` di `exercises[k]`.
- Per unit: 3–5 latihan, total **15–22 item**.
- Pengecoh harus bermutu: satu yang memakai kata dari teks tapi maknanya lain, satu yang masuk akal di dunia nyata tapi tak disebut, satu yang bertentangan.

## Pembahasan
Tabel `["No","Jawaban","Alasan & pengecoh"]` untuk tiap soal (kutip frasa sumbernya dengan *miring*, jelaskan pengecohnya),
model jawaban lengkap untuk tugas terbuka (dalam `kotak`), lalu satu `kotak` "Yang perlu dicatat" (2–3 poin).

## Validasi sebelum selesai
1. `node -e "JSON.parse(require('fs').readFileSync('content/ebook/pte-prep/unit-NN.json','utf8'))"`
2. `node scripts/cek-unit-ebook.mjs pte-prep` → unit-mu tidak muncul di daftar masalah (unit lain mungkin sedang ditulis agen lain).
3. Hitung: jumlah item = jumlah kunci; tiap item tepat satu `____`; tiap kunci ∈ pilihan; tak ada " / " di item.
4. Periksa lagi bahwa jawaban yang kamu tandai benar MEMANG benar dan pengecohnya MEMANG salah, dan bahwa kunci isian terbuka
   benar-benar ADA (persis) di naskah audionya. Kesalahan kunci fatal.
5. Cocokkan semua angka tentang tes (durasi, batas kata, cara nilai) dengan bagian "Tentang tesnya" di atas.
