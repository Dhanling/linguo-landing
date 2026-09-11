# Skema unit modul IELTS Prep (content/ebook/ielts-prep)

Modul ini dirakit `node scripts/build-ebook-pdf.mjs ielts-prep` (jalankan dari root repo linguo-landing).
Periksa berkas unit dengan `node scripts/cek-unit-ebook.mjs ielts-prep` — WAJIB 0 masalah.
Contoh yang sudah jadi dan jadi patokan gaya: `unit-06.json` (Reading) dan `unit-10.json` (Writing Task 1).
BACA KEDUANYA DULU sebelum menulis.

## Bahasa & gaya
- Pengantar, strategi, pembahasan: **bahasa Indonesia** yang enak dibaca, kalimat pendek, langsung ke inti,
  gaya seperti dua unit contoh (bukan gaya buku teks kaku). Boleh "kamu".
- Materi tes (passage, transkrip, soal, model jawaban, cue card): **bahasa Inggris** otentik setara IELTS,
  British spelling (organise, programme, centre). Angka, nama, tempat fiktif tapi masuk akal.
- Target pembaca: B1–B2 mengincar Band 6.5–7.5. Jangan menjelaskan grammar dasar.
- Markdown ringan di teks: `**tebal**`, `*miring*`. JANGAN pakai tanda `*` untuk hal lain (bullet, catatan kaki).
  Titik tengah tulis langsung `·`. Jangan pakai entitas HTML (&middot; &amp; dll).
- Tiap unit: 6–9 halaman A4 ≈ 1.800–2.800 kata total (termasuk passage/transkrip/model). Jangan lebih tipis.

## Bentuk berkas `unit-NN.json`
```json
{
 "jenis": "testprep",
 "skill": "LISTENING · PART 1",        // badge di kepala unit, huruf besar. Contoh lain: "READING", "WRITING TASK 2", "SPEAKING · PART 2"
 "title": "Judul unit (Indonesia/istilah tes)",
 "title_target": "Subjudul bahasa Inggris",
 "goal": "Satu-dua kalimat: yang bisa dilakukan siswa setelah unit ini.",
 "bekal": ["tiga kemampuan konkret", "…", "…"],
 "sections": [ { "title": "…", "blocks": [ …blok… ] } ],   // 4–6 bagian: mengapa/what examiners test → strategi → contoh dibedah → bahan (passage/transkrip/grafik) → (tugas)
 "exercises": [ …latihan… ],
 "answers": [ "kunci — kunci — kunci", … ],                 // SATU string per latihan, kunci per item dipisah " — " (spasi, em dash, spasi)
 "pembahasan": [ { "title": "Pembahasan", "blocks": [ …blok… ] } ]   // dicetak SETELAH kunci jawaban
}
```

## Jenis blok (di `sections[].blocks` dan `pembahasan[].blocks`)
- `{"type":"p","text":"…"}` paragraf
- `{"type":"sub","text":"…"}` anak judul
- `{"type":"list","items":["…","…"]}` bullet
- `{"type":"kotak","title":"…","items":["paragraf","paragraf"]}` kotak sorot (tips, model jawaban, definisi)
- `{"type":"tabel","head":["…","…"],"rows":[["…","…"],…]}` — tiap baris JUMLAH SEL = jumlah head
- `{"type":"passage","title":"…","words":742,"paragraphs":[{"label":"A","text":"…"},…]}` bacaan Reading (label opsional; boleh string polos)
- `{"type":"transkrip","title":"…","lines":[{"speaker":"Receptionist","text":"…"},…]}` naskah Listening
- `{"type":"grafik","jenis":"garis"|"batang"|"pai", "judul":"…","sumbu_y":"…","satuan":"%","maks":100,"label_nilai":true,
     "kategori":["2000","2010"], "seri":[{"nama":"Men","nilai":[10,20]}], ...}`
  pai: `"pai":[{"judul":"2000","irisan":[{"nama":"Coal","nilai":40},…]}, …]` (1–3 pai berdampingan)
- `{"type":"gambar","file":"nama.svg","lebar":"150mm","caption":"…"}` — berkas SVG/PNG di folder modul ini (untuk diagram proses, peta, denah)

## Latihan (WAJIB dikoreksi otomatis di reader — ikuti persis)
```json
{"prompt":"Questions 1–7. Instruksi ala IELTS (Inggris) … — Artinya: terjemahan instruksinya dalam bahasa Indonesia",   // JANGAN diawali "Latihan 1." — nomor ditambah perakit
// [ebook-perintah-dua-bahasa-v1] (laporan Faujiah 11 Sep 2026) Perintah berbahasa Inggris WAJIB
// disusul " — Artinya: " + terjemahan Indonesianya. Rubrik Inggrisnya tetap ditulis lebih dulu
// supaya siswa hafal kalimat soal asli, tapi siswa A2–B1 tidak boleh salah paham aturan
// jawabannya (mis. "NO MORE THAN TWO WORDS"). Perintah yang sudah berbahasa Indonesia tak perlu.
 "tipe":"isian",
 "pilihan":["TRUE","FALSE","NOT GIVEN"],                        // hanya untuk jawaban tertutup; hapus untuk isian terbuka
 "items":["Kalimat soal … ____", "…"]}
```
- Tiap item WAJIB memuat `____` (empat garis bawah) tepat SATU kali — di posisi kosong, atau di ujung untuk TFNG/MCQ.
- Item TIDAK boleh memuat " / " (spasi-garis miring-spasi) — itu dibaca sebagai soal susun kata.
- MCQ: tulis opsi di dalam item: `"What does the speaker say about parking? (A) It is free. (B) It costs £5. (C) It is unavailable. ____"` dengan `"pilihan":["A","B","C"]` dan kunci `A`.
- Matching (headings/features): item = pernyataan + ` ____`, `pilihan` = daftar huruf/romawi `["i","ii","iii",…]` atau `["A","B","C","D"]`; daftar heading-nya ditulis di blok `kotak`/`tabel` di section sebelum latihan.
- Isian terbuka (completion): kunci = kata PERSIS dari teks, huruf kecil kecuali nama; angka ditulis angka. Kunci hanya SATU jawaban (reader membandingkan longgar: huruf besar/kecil & tanda baca diabaikan, tapi harus satu bentuk). Hindari soal yang punya dua jawaban sah.
- Setiap kunci yang punya `pilihan` HARUS persis salah satu isi `pilihan`.
- Jumlah potongan kunci di `answers[k]` = jumlah `items` di `exercises[k]`.
- Per unit: 3–5 latihan, total 12–20 item. Reading: 13 soal dari SATU passage 700–900 kata. Listening: 10 soal dari SATU transkrip (Part 1/2 ≈ 550–700 kata, Part 3/4 ≈ 700–850 kata).
- Writing/Speaking: latihan yang bisa dikoreksi otomatis — melengkapi kalimat dengan kolokasi/penghubung dari bank kata, memilih overview yang benar (TRUE/FALSE), mengurutkan, memperbaiki kesalahan dengan satu kata, memilih kalimat yang Band-nya lebih tinggi (A/B). Tugas menulis/berbicara terbuka ditaruh di `sections` (bukan `exercises`) dengan model jawaban di `pembahasan`.

## Pembahasan
Tabel `["No","Jawaban","Kalimat sumber & alasan"]` untuk tiap soal (kutip frasa sumbernya dengan *miring*, jelaskan pengecohnya),
lalu satu `kotak` "Yang perlu dicatat" (2–3 poin). Untuk Writing/Speaking: model jawaban lengkap + tabel kenapa Band-nya sekian.

## Validasi sebelum selesai
1. `node -e "JSON.parse(require('fs').readFileSync('content/ebook/ielts-prep/unit-NN.json','utf8'))"`
2. `node scripts/cek-unit-ebook.mjs ielts-prep` → 0 masalah (unit lain mungkin sedang ditulis agen lain; yang penting unit-mu tidak muncul di daftar masalah).
3. Hitung kata: passage/transkrip sesuai rentang; jumlah item sesuai kunci.
