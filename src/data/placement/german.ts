// ─────────────────────────────────────────────────────────────────────────────
// GERMAN (Deutsch) PLACEMENT TEST — 23 soal, mixed types (5 di antaranya listening)
// A1: 5 soal · A2: 6 soal · B1: 7 soal · B2: 5 soal (skor dinormalisasi ke skala 45)
// [placement-listening-v1] Soal ber-`audio` dibunyikan Chirp de-DE lewat /api/tts;
// transkrip sengaja cuma ada di `audio.text` + pembahasan, tidak di layar soal.
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const germanPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "de1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara menyapa di pagi hari dalam bahasa Jerman?",
    options: ["Gute Nacht", "Guten Morgen", "Guten Abend", "Tschüss"],
    correct: 1,
    explanation: "'Guten Morgen' = selamat pagi. 'Guten Abend' = selamat malam (sore), 'Gute Nacht' saat mau tidur.",
  },
  {
    id: "de2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "das Haus", right: "rumah" },
      { left: "das Wasser", right: "air" },
      { left: "das Brot", right: "roti" },
      { left: "die Katze", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Perhatikan setiap kata benda punya artikel (der/die/das).",
  },
  {
    id: "de3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: '___ Hund ist groß.' (Anjing itu besar.)",
    context: "Pilih artikel nominatif yang tepat.",
    options: ["Der", "Die", "Das", "Den"],
    correct: "Der",
    explanation: "'Hund' bergender maskulin → artikel nominatif 'der'. 'den' dipakai untuk akusatif.",
  },
  {
    id: "de4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Nama saya Anna.",
    tokens: ["heiße", "Ich", "Anna"],
    correct: ["Ich", "heiße", "Anna"],
    explanation: "Struktur dasar: Subjek + verba (posisi ke-2) + sisanya. 'Ich heiße Anna.'",
  },

  // [placement-listening-v1] Listening A1 — melengkapi (pasangan mirip Küche/Kirche/Kuchen)
  {
    id: "l1", difficulty: "A1", type: "fillChoice",
    audio: { lang: "de", text: "Hallo! Ich heiße Lena und ich wohne in Hamburg. Am Abend koche ich gern in der Küche." },
    question: "Dengarkan audio, lalu lengkapi: 'Am Abend koche ich gern in der ___.'",
    context: "Pilih kata yang kamu dengar.",
    options: ["Kirche", "Küche", "Kuchen", "Kiste"],
    correct: "Küche",
    explanation: "Transkrip: 'Hallo! Ich heiße Lena und ich wohne in Hamburg. Am Abend koche ich gern in der Küche.' (Halo! Nama saya Lena dan saya tinggal di Hamburg. Malam hari saya suka memasak di dapur.) 'die Küche' = dapur (bunyi ü, 'ch' lembut). Awas yang mirip: 'die Kirche' = gereja (ada bunyi r), 'der Kuchen' = kue (bunyi u, bukan ü), 'die Kiste' = peti.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "de5", difficulty: "A2", type: "multiple",
    question: "'Ich ___ gestern Fußball gespielt.' (Perfekt)",
    options: ["habe", "bin", "hat", "ist"],
    correct: 0,
    explanation: "Perfekt dgn 'spielen' pakai auxiliary 'haben' → 'Ich habe ... gespielt'. 'sein' hanya untuk verba gerak/perubahan.",
  },
  {
    id: "de6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat Perfekt (dgn 'sein'):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["bin", "Ich", "gestern", "gegangen", "zur", "Schule"],
    correct: ["Ich", "bin", "gestern", "zur", "Schule", "gegangen"],
    explanation: "Verba gerak 'gehen' pakai 'sein'. Partisip 'gegangen' selalu di akhir kalimat.",
  },
  {
    id: "de7", difficulty: "A2", type: "missing",
    question: "Verba terpisah (trennbare Verben) — lengkapi:",
    template: "Ich ___ jeden Morgen um 7 Uhr ___.",
    blanks: ["stehe", "auf"],
    options: ["stehe", "auf", "gehe", "an", "komme", "aus"],
    explanation: "'aufstehen' (bangun) itu verba terpisah: 'stehe ... auf'. Prefix 'auf' pindah ke akhir kalimat.",
  },
  {
    id: "de8", difficulty: "A2", type: "fillChoice",
    question: "'Ich helfe ___ Mann.' (Saya membantu pria itu.)",
    context: "Verba 'helfen' menuntut Dativ.",
    options: ["dem", "den", "der", "das"],
    correct: "dem",
    explanation: "'helfen' selalu Dativ. Maskulin Dativ = 'dem'. (Akusatif 'den' salah di sini.)",
  },
  {
    id: "de9", difficulty: "A2", type: "multiple",
    question: "'Du ___ zum Arzt gehen, wenn du krank bist.' (saran)",
    options: ["musst", "kannst", "solltest", "willst"],
    correct: 2,
    explanation: "'solltest' (dari sollen) dipakai untuk memberi saran, mirip 'should' di Inggris.",
  },

  // [placement-listening-v1] Listening A2 — detail informasi (jam + kendaraan)
  {
    id: "l2", difficulty: "A2", type: "multiple",
    audio: { lang: "de", text: "Ich stehe jeden Tag um sechs Uhr auf. Dann frühstücke ich und um halb acht fahre ich mit der U-Bahn zur Arbeit." },
    question: "Dengarkan audio. Jam berapa dia berangkat kerja, dan naik apa?",
    options: [
      "Jam 06.00, naik kereta bawah tanah",
      "Jam 07.30, naik kereta bawah tanah",
      "Jam 08.30, naik kereta bawah tanah",
      "Jam 07.30, naik bus",
    ],
    correct: 1,
    explanation: "Transkrip: 'Ich stehe jeden Tag um sechs Uhr auf. Dann frühstücke ich und um halb acht fahre ich mit der U-Bahn zur Arbeit.' (Saya bangun tiap hari jam enam. Lalu saya sarapan dan jam setengah delapan saya naik U-Bahn ke tempat kerja.) 'halb acht' = setengah MENUJU delapan = 07.30, bukan 08.30. Jam 06.00 = waktu BANGUN (pengecoh). 'die U-Bahn' = kereta bawah tanah, bukan bus.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "de10", difficulty: "B1", type: "multiple",
    question: "'Wenn ich Zeit ___, würde ich mehr reisen.' (Konjunktiv II)",
    options: ["habe", "hatte", "hätte", "haben"],
    correct: 2,
    explanation: "Pengandaian tidak nyata pakai Konjunktiv II: 'hätte'. 'Wenn ich Zeit hätte, würde ich reisen.'",
  },
  {
    id: "de11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif (Passiv):",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["wurde", "Der", "geschrieben", "Brief", "gestern"],
    correct: ["Der", "Brief", "wurde", "gestern", "geschrieben"],
    explanation: "Passiv lampau: Subjek + 'wurde' + ... + Partizip II ('geschrieben') di akhir.",
  },
  {
    id: "de12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "weil", right: "karena" },
      { left: "obwohl", right: "meskipun" },
      { left: "damit", right: "supaya" },
      { left: "trotzdem", right: "meskipun begitu" },
    ],
    explanation: "Konjungsi ini ciri khas B1. 'weil/obwohl/damit' membuat verba pindah ke akhir anak kalimat.",
  },
  {
    id: "de13", difficulty: "B1", type: "missing",
    question: "Preposisi tetap (feste Präpositionen) — lengkapi:",
    template: "Ich interessiere mich ___ Musik und denke oft ___ die Zukunft.",
    blanks: ["für", "an"],
    options: ["für", "an", "auf", "über", "mit", "von"],
    explanation: "'sich interessieren für' + Akk, 'denken an' + Akk. Kombinasi verba+preposisi harus dihafal.",
  },
  {
    id: "de14", difficulty: "B1", type: "fillChoice",
    question: "'Das ist der Mann, ___ ich gestern gesehen habe.' (Relativsatz)",
    context: "Pilih pronomina relatif yang tepat.",
    options: ["der", "den", "dem", "dessen"],
    correct: "den",
    explanation: "Antecedent maskulin sebagai objek langsung (Akusatif) → 'den'. ('der' = subjek, 'dem' = Dativ.)",
  },

  // [placement-listening-v1] Listening B1 — menerjemahkan (nachdem + Plusquamperfekt)
  {
    id: "l3", difficulty: "B1", type: "multiple",
    audio: { lang: "de", text: "Nachdem ich die Prüfung bestanden hatte, habe ich mit meinen Freunden gefeiert." },
    question: "Dengarkan audio. Pilih terjemahan yang paling tepat:",
    options: [
      "Sebelum ujian, saya berpesta dulu dengan teman-teman.",
      "Saya akan merayakan bersama teman-teman kalau lulus ujian.",
      "Setelah saya lulus ujian, saya merayakannya bersama teman-teman.",
      "Karena tidak lulus ujian, saya tidak ikut pesta teman-teman.",
    ],
    correct: 2,
    explanation: "Transkrip: 'Nachdem ich die Prüfung bestanden hatte, habe ich mit meinen Freunden gefeiert.' Pola 'nachdem + Plusquamperfekt (hatte … bestanden)' = SETELAH suatu kejadian selesai, lalu kejadian berikutnya (Perfekt 'habe … gefeiert'). 'bestehen/bestanden' = lulus ujian. 'Sebelum' = 'bevor', dan opsi 'akan … kalau' butuh 'wenn' + bentuk kini/akan datang — keduanya tidak ada di audio.",
  },
  // [placement-listening-v1] Listening B1 — dikte 2 kata (pengecoh bunyi mirip)
  {
    id: "l4", difficulty: "B1", type: "missing",
    audio: { lang: "de", text: "Ich freue mich schon auf den Urlaub, weil wir dieses Jahr endlich ans Meer fahren." },
    question: "Dengarkan audio, lalu isi dua kata yang hilang:",
    template: "Ich freue mich schon ___ den Urlaub, weil wir dieses Jahr endlich ans ___ fahren.",
    blanks: ["auf", "Meer"],
    options: ["über", "Meer", "aus", "mehr", "auf", "Mehl"],
    explanation: "Transkrip: 'Ich freue mich schon auf den Urlaub, weil wir dieses Jahr endlich ans Meer fahren.' (Saya sudah tidak sabar menanti liburan, karena tahun ini kami akhirnya pergi ke laut.) 'sich freuen AUF' = menantikan sesuatu yang AKAN datang; 'sich freuen über' = senang atas sesuatu yang sudah terjadi. 'das Meer' = laut (kata benda, huruf besar, 'ans' = an das) — bunyinya sama dengan 'mehr' (lebih) tapi 'mehr' bukan kata benda; 'Mehl' = tepung.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "de15", difficulty: "B2", type: "multiple",
    question: "'Wenn ich das gewusst hätte, ___.' (Konjunktiv II Vergangenheit)",
    options: [
      "hätte ich anders gehandelt",
      "würde ich anders handeln",
      "habe ich anders gehandelt",
      "handelte ich anders",
    ],
    correct: 0,
    explanation: "Pengandaian lampau tidak nyata: 'hätte ... gehandelt'. Gabung 'hätte gewusst' → 'hätte gehandelt'.",
  },
  {
    id: "de16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat pasif dengan modal:",
    translation: "Masalah itu harus diselesaikan secepatnya.",
    tokens: ["muss", "Das", "gelöst", "werden", "Problem", "schnell"],
    correct: ["Das", "Problem", "muss", "schnell", "gelöst", "werden"],
    explanation: "Passiv + modal: modal terkonjugasi + ... + Partizip + Infinitiv 'werden' di akhir.",
  },
  {
    id: "de17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi dengan kata yang tepat:",
    template: "Die neue Politik wird die Folgen ___, während die alte sie nur ___ würde.",
    blanks: ["mildern", "verschärfen"],
    options: ["mildern", "verschärfen", "erzeugen", "verstärken", "stabilisieren", "verhindern"],
    explanation: "'mildern' = meredakan/mengurangi, 'verschärfen' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "de18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menunjukkan nominalisasi (gaya formal)?",
    options: [
      "Sie hat schnell entschieden.",
      "Ihre Entscheidung war schnell.",
      "Sie entscheidet sich schnell.",
      "Schnell entschied sie.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'entscheiden' → nomina 'Entscheidung'. Ciri khas gaya tulisan akademis/formal.",
  },
  // [placement-listening-v1] Listening B2 — HOTS: menyimpulkan maksud pengumuman
  {
    id: "l5", difficulty: "B2", type: "multiple",
    audio: { lang: "de", text: "Seit Januar ist der Eintritt in alle städtischen Museen kostenlos. Die Besucherzahlen sind jedoch kaum gestiegen. Die Stadt will deshalb nun mehr in Werbung und in Angebote für Schulen investieren." },
    question: "Dengarkan potongan berita ini. Kesimpulan yang PALING masuk akal adalah:",
    options: [
      "Karena museum digratiskan, jumlah pengunjung melonjak tajam.",
      "Program gagal, jadi kota akan memberlakukan lagi tiket masuk museum.",
      "Tiket gratis saja belum cukup menarik pengunjung; kota menilai masalahnya ada pada promosi dan program, bukan harga.",
      "Museum-museum kota ditutup sementara sejak Januari.",
    ],
    correct: 2,
    explanation: "Transkrip: 'Seit Januar ist der Eintritt in alle städtischen Museen kostenlos. Die Besucherzahlen sind jedoch kaum gestiegen. Die Stadt will deshalb nun mehr in Werbung und in Angebote für Schulen investieren.' (Sejak Januar masuk ke semua museum kota gratis. Namun jumlah pengunjung hampir tidak naik. Karena itu kota kini ingin berinvestasi lebih banyak pada iklan dan program untuk sekolah.) Kuncinya 'jedoch' (namun) + 'kaum' (hampir tidak): gratis TIDAK membuat pengunjung melonjak, dan solusinya 'Werbung' (promosi) + program sekolah — bukan memungut tiket lagi (tidak disebut di audio).",
  },
];
