import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// JAPANESE PLACEMENT TEST (20 soal, tipe campuran — 5 di antaranya listening)
// A1: 5 soal · A2: 5 soal · B1: 6 soal · B2: 4 soal
// [placement-listening-v1] Soal ber-`audio` dibunyikan Chirp ja-JP lewat /api/tts;
// transkrip sengaja cuma ada di `audio.text` + pembahasan, tidak di layar soal.
// Levels aligned with JLPT: A1 ≈ N5, A2 ≈ N4, B1 ≈ N3, B2 ≈ N2
// ─────────────────────────────────────────────────────────────────────────────
export const japanesePlacementTest: Question[] = [
  // ═══════════════════════ A1 (JLPT N5) ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Sapaan yang tepat untuk pagi hari dalam bahasa Jepang:",
    options: [
      "おやすみなさい (oyasumi nasai)",
      "おはようございます (ohayō gozaimasu)",
      "こんばんは (konbanwa)",
      "さようなら (sayōnara)",
    ],
    correct: 1,
    explanation: "'おはようございます' dipakai dari pagi hingga sekitar jam 10-11. 'こんばんは' untuk malam.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka hiragana dengan artinya:",
    pairs: [
      { left: "いち (ichi)", right: "1" },
      { left: "さん (san)", right: "3" },
      { left: "ご (go)", right: "5" },
      { left: "じゅう (jū)", right: "10" },
    ],
    explanation: "Angka dasar 1-10 adalah fondasi untuk country name, umur, tanggal.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'わたし ___ がくせい です。' (Saya adalah murid.)",
    context: "Partikel topic marker.",
    options: ["は", "を", "に", "が"],
    correct: "は",
    explanation: "'は' (dibaca 'wa' saat jadi partikel) adalah topic marker. Struktur: [Topik] は [Info] です.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan nasi.",
    tokens: ["ごはん", "を", "たべます", "わたし", "は"],
    correct: ["わたし", "は", "ごはん", "を", "たべます"],
    explanation: "Struktur SOV Jepang: Subject + は + Object + を + Verb. 'を' (o) = partikel objek langsung.",
  },

  // [placement-listening-v1] Listening A1 — melengkapi (pasangan minimal obāsan/obasan)
  {
    id: "l1", difficulty: "A1", type: "fillChoice",
    audio: { lang: "ja", text: "はじめまして。わたしは たなかです。これは わたしの おばあさんです。" },
    question: "Dengarkan audio, lalu lengkapi: 'これは わたしの ___ です。'",
    context: "Pilih kata yang kamu dengar.",
    options: ["おばさん (obasan)", "おばあさん (obāsan)", "おかあさん (okāsan)", "おじいさん (ojīsan)"],
    correct: "おばあさん (obāsan)",
    explanation: "Transkrip: 'はじめまして。わたしは たなかです。これは わたしの おばあさんです。' (Salam kenal. Saya Tanaka. Ini nenek saya.) Awas pasangan mirip: 'おばあさん (obāsan)' dengan vokal panjang 'baa' = nenek, sedangkan 'おばさん (obasan)' dengan vokal pendek = bibi/tante. 'おかあさん (okāsan)' = ibu, 'おじいさん (ojīsan)' = kakek.",
  },

  // ═══════════════════════ A2 (JLPT N4) ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Bentuk lampau (past) dari 'たべます' (makan):",
    options: [
      "たべます (tabemasu)",
      "たべました (tabemashita)",
      "たべません (tabemasen)",
      "たべて (tabete)",
    ],
    correct: 1,
    explanation: "Bentuk lampau polite form: -ます → -ました. 'たべました' = sudah makan.",
  },
  {
    id: "q6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan te-form (untuk menghubungkan):",
    translation: "Saya pergi ke sekolah lalu belajar.",
    tokens: ["がっこう", "べんきょうします", "いって", "に", "わたし", "は"],
    correct: ["わたし", "は", "がっこう", "に", "いって", "べんきょうします"],
    explanation: "Te-form ('いって' dari 'いきます') menghubungkan dua kata kerja berurutan. 'に' partikel arah.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan partikel yang tepat:",
    template: "としょかん ___ ほん ___ よみます。 (Saya baca buku di perpustakaan.)",
    blanks: ["で", "を"],
    options: ["で", "に", "を", "は", "が", "へ"],
    explanation: "'で' = partikel tempat aktivitas. 'を' = partikel objek langsung. Ingat: に = tujuan (statis), で = lokasi aktivitas.",
  },
  {
    id: "q8", difficulty: "A2", type: "fillChoice",
    question: "Bentuk potensial: 'にほんご を ___ 。' (Saya bisa bahasa Jepang.)",
    context: "Bentuk potensial dari 'はなす' (berbicara).",
    options: ["はなせます", "はなします", "はなれます", "はなります"],
    correct: "はなせます",
    explanation: "Verb group 1 (u-verb): -u → -eru. 'はなす' → 'はなせる' / polite 'はなせます'.",
  },

  // [placement-listening-v1] Listening A2 — detail informasi (jam + tempat)
  {
    id: "l2", difficulty: "A2", type: "multiple",
    audio: { lang: "ja", text: "あしたの朝、九時に駅の前で会いましょう。映画は十時半から始まります。" },
    question: "Dengarkan audio. Jam berapa dan di mana mereka akan bertemu?",
    options: [
      "Jam 10.30, di depan stasiun",
      "Jam 09.00, di depan bioskop",
      "Jam 09.00, di depan stasiun",
      "Jam 10.30, di dalam bioskop",
    ],
    correct: 2,
    explanation: "Transkrip: 'あしたの朝、九時に駅の前で会いましょう。映画は十時半から始まります。' (Besok pagi, ayo bertemu jam sembilan di depan stasiun. Filmnya mulai jam setengah sebelas.) '九時 (kuji)' = jam 9, '駅の前 (eki no mae)' = di depan stasiun. Jam 10.30 '十時半 (jūji han)' = waktu film MULAI (pengecoh), dan bioskop bukan tempat bertemu.",
  },

  // ═══════════════════════ B1 (JLPT N3) ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Pilih kalimat dengan keigo (bahasa hormat) yang benar:",
    options: [
      "しゃちょう は ごはん を たべます。",
      "しゃちょう は ごはん を めしあがります。",
      "しゃちょう は ごはん を いただきます。",
      "しゃちょう は ごはん を たべる。",
    ],
    correct: 1,
    explanation: "'めしあがります' adalah sonkeigo (keigo hormat) untuk 'たべる'. 'いただきます' adalah kenjōgo (merendahkan diri sendiri).",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif (受身形):",
    translation: "Saya dimarahi oleh guru.",
    tokens: ["せんせい", "しかられました", "に", "わたし", "は"],
    correct: ["わたし", "は", "せんせい", "に", "しかられました"],
    explanation: "Pasif: Subject は Agent に Verb-pasif. 'しかる' (memarahi) → 'しかられる' (dimarahi).",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan ekspresi dengan fungsinya:",
    pairs: [
      { left: "〜たほうがいい", right: "saran (sebaiknya...)" },
      { left: "〜なければならない", right: "keharusan (harus...)" },
      { left: "〜てもいい", right: "izin (boleh...)" },
      { left: "〜てはいけない", right: "larangan (tidak boleh...)" },
    ],
    explanation: "4 ekspresi modal utama di level N3. Sangat sering muncul di percakapan formal dan JLPT.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi dengan bentuk conditional yang tepat:",
    template: "あめ が ___、 いえ に います。 (Kalau hujan, saya di rumah.)",
    blanks: ["ふったら"],
    options: ["ふったら", "ふれば", "ふると", "ふるなら", "ふって", "ふります"],
    explanation: "'〜たら' adalah conditional paling fleksibel. 'ふる' (turun/hujan) → 'ふったら'.",
  },

  // [placement-listening-v1] Listening B1 — menerjemahkan (penyesalan 〜ばよかった + 〜てしまった)
  {
    id: "l3", difficulty: "B1", type: "multiple",
    audio: { lang: "ja", text: "もっと早く家を出ればよかった。電車に乗り遅れてしまった。" },
    question: "Dengarkan audio. Pilih terjemahan yang paling tepat:",
    options: [
      "Untung aku berangkat dari rumah lebih awal, jadi tidak ketinggalan kereta.",
      "Seharusnya aku berangkat dari rumah lebih awal. Aku jadi ketinggalan kereta.",
      "Kalau aku berangkat lebih awal, aku akan naik kereta.",
      "Aku berangkat lebih awal supaya tidak ketinggalan kereta.",
    ],
    correct: 1,
    explanation: "Transkrip: 'もっと早く家を出ればよかった。電車に乗り遅れてしまった。' (Seharusnya aku keluar rumah lebih awal. Aku jadi ketinggalan kereta.) Pola '〜ばよかった (-ba yokatta)' = penyesalan 'seharusnya…' (kenyataannya TIDAK dilakukan), dan '〜てしまった (-te shimatta)' = sesuatu yang disesali sudah terjadi. '乗り遅れる (noriokureru)' = ketinggalan kendaraan. Opsi 'kalau…, aku akan…' adalah pengandaian yang masih mungkin, bukan penyesalan.",
  },
  // [placement-listening-v1] Listening B1 — dikte 2 kata (pengecoh bunyi mirip)
  {
    id: "l4", difficulty: "B1", type: "missing",
    audio: { lang: "ja", text: "来週の会議は、午後二時から始まる予定ですから、遅れないでください。" },
    question: "Dengarkan audio, lalu isi dua kata yang hilang:",
    template: "来週の ___ は、午後二時から始まる ___ ですから、遅れないでください。",
    blanks: ["会議 (kaigi)", "予定 (yotei)"],
    options: ["会期 (kaiki)", "予定 (yotei)", "会話 (kaiwa)", "会議 (kaigi)", "用意 (yōi)", "予想 (yosō)"],
    explanation: "Transkrip: '来週の会議は、午後二時から始まる予定ですから、遅れないでください。' (Rapat minggu depan dijadwalkan mulai jam dua siang, jadi jangan terlambat.) '会議 (kaigi)' = rapat — beda bunyi tipis dengan '会期 (kaiki)' = masa sidang dan '会話 (kaiwa)' = percakapan. '予定 (yotei)' = rencana/jadwal, '〜予定です' = dijadwalkan akan…; bandingkan '用意 (yōi)' = persiapan dan '予想 (yosō)' = perkiraan.",
  },

  // ═══════════════════════ B2 (JLPT N2) ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Pilih kalimat dengan bentuk causative-passive (使役受身) yang benar:",
    options: [
      "ははに やさいを たべさせました。",
      "ははに やさいを たべさせられました。",
      "ははに やさいを たべられました。",
      "ははは やさいを たべさせます。",
    ],
    correct: 1,
    explanation: "Causative-passive = 'dipaksa untuk...'. 'たべる' → 'たべさせる' (causative) → 'たべさせられる' (causative-passive). Artinya 'dipaksa makan oleh ibu'.",
  },
  {
    id: "q14", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat formal dengan ekspresi 'にもかかわらず':",
    translation: "Meskipun hujan, dia tetap datang.",
    tokens: ["かれ", "きました", "あめ", "は", "にもかかわらず"],
    correct: ["あめ", "にもかかわらず", "かれ", "は", "きました"],
    explanation: "'〜にもかかわらず' = meskipun/walaupun. Register formal, sering di tulisan akademik atau berita.",
  },
  {
    id: "q15", difficulty: "B2", type: "missing",
    question: "Lengkapi dengan ekspresi formal yang tepat:",
    template: "この ほん は ___ むずかしい ___ 、 よみました。 (Buku ini sulit tapi saya tetap baca.)",
    blanks: ["ほど", "けれど"],
    options: ["ほど", "ぐらい", "けれど", "から", "ので", "のに"],
    explanation: "'ほど' = sampai tingkat/sedemikian rupa. 'けれど' = tapi (formal dari 'けど'). Pola ini sering muncul di essay N2.",
  },

  // [placement-listening-v1] Listening B2 — HOTS: menyimpulkan maksud pengumuman
  {
    id: "l5", difficulty: "B2", type: "multiple",
    audio: { lang: "ja", text: "新しい図書館は来月オープンする予定でしたが、工事の遅れにより、開館は三か月延期されることになりました。ただし、オンラインでの本の予約は予定どおり来月から始まります。" },
    question: "Dengarkan pengumuman ini. Kesimpulan yang PALING masuk akal adalah:",
    options: [
      "Perpustakaan baru tetap dibuka bulan depan sesuai rencana.",
      "Semua layanan perpustakaan, termasuk pemesanan online, ditunda tiga bulan.",
      "Gedungnya belum bisa dikunjungi bulan depan, tetapi buku sudah bisa dipesan online mulai bulan depan.",
      "Pembangunan perpustakaan dibatalkan dan diganti layanan online.",
    ],
    correct: 2,
    explanation: "Transkrip: '新しい図書館は来月オープンする予定でしたが、工事の遅れにより、開館は三か月延期されることになりました。ただし、オンラインでの本の予約は予定どおり来月から始まります。' (Perpustakaan baru semula dijadwalkan buka bulan depan, tetapi karena keterlambatan konstruksi, pembukaannya diundur tiga bulan. Namun, pemesanan buku secara online tetap dimulai bulan depan sesuai jadwal.) Kuncinya '延期 (enki)' = ditunda dan 'ただし (tadashi)' = namun/akan tetapi, yang memberi pengecualian: gedung ditunda, layanan online TIDAK. '予定どおり (yotei-dōri)' = sesuai rencana. Tidak ada kata 中止 (chūshi = dibatalkan), jadi opsi 'dibatalkan' salah.",
  },
];
