import type { LanguageCurriculum } from "../types";
import { getLanguageBySlug } from "../languages";

// [isyarat-3d-v1] Silabus American Sign Language (ASL). A1.1 punya dek slide
// siap pakai dengan avatar 3D (dashboard: src/data/dekSilabus/asl-a1-1.ts) —
// judul sesi di sini WAJIB sama persis dengan heading dek ("Sesi N · …").
const meta = getLanguageBySlug("asl")!;

const curriculum: LanguageCurriculum = {
  meta,
  overview:
    "American Sign Language (ASL) adalah bahasa isyarat komunitas Tuli di Amerika Serikat dan sebagian Kanada — bahasa utuh dengan tata bahasanya sendiri, bukan bahasa Inggris yang 'diterjemahkan ke tangan'. ASL lahir dari pertemuan bahasa isyarat Prancis (LSF) dengan isyarat lokal Amerika di sekolah Tuli pertama di Hartford (1817), dan kini dipakai di kampus, konferensi, dan konten internasional. Satu isyarat terbentuk dari bentuk tangan, lokasi, gerakan, arah telapak, dan ekspresi wajah; ekspresi wajah bahkan berfungsi sebagai tata bahasa (alis naik untuk pertanyaan ya/tidak, alis berkerut untuk pertanyaan WH). Di Linguo, tiap sesi A1 dilengkapi avatar 3D yang bisa diputar ulang pelan dan dari berbagai sudut, plus dialog dua tokoh yang bisa diputar per baris. Catatan: ASL berbeda dengan BISINDO (Bahasa Isyarat Indonesia).",
  levels: [
    {
      code: "A1",
      name: "Pemula — Abjad Jari, Sapaan & Kalimat Dasar",
      description:
        "Fondasi ASL: budaya Tuli & etika berkomunikasi, abjad jari A–Z, angka 0–20, sapaan dan perkenalan diri, ekspresi wajah sebagai tata bahasa (pertanyaan ya/tidak dan WH), kosakata keluarga, waktu, warna, dan kebutuhan sehari-hari. Akhir A1 kamu bisa memperkenalkan diri, bertanya-jawab sederhana, mengeja nama, dan meminta lawan bicara mengulang atau memperlambat isyarat.",
      sublevels: [
        {
          code: "A1.1",
          name: "First Signs — Isyarat Pertama",
          preview: true,
          sessions: [
            { number: 1, title: "Mengenal ASL & Budaya Tuli", topics: ["ASL bahasa utuh, bukan bahasa Inggris di tangan", "sejarah Hartford 1817 & Gallaudet", "etika: kontak mata, menepuk bahu, melambai", "ASL ≠ BISINDO"] },
            { number: 2, title: "Sapaan & Kata Sopan Pertama", topics: ["HELLO, BYE", "THANK-YOU, PLEASE, SORRY", "YES, NO + anggukan & gelengan", "dialog sapaan dua tokoh"] },
            { number: 3, title: "Abjad Jari A–M", topics: ["posisi tangan saat mengeja", "huruf A–M", "huruf mirip: A-S-T-M-N, D-F", "latihan eja kata pendek"] },
            { number: 4, title: "Abjad Jari N–Z & Mengeja Nama", topics: ["huruf N–Z", "huruf bergerak: J & Z", "ritme mengeja tanpa memantul", "mengeja nama sendiri"] },
            { number: 5, title: "Perkenalan Diri: NAME, ME, YOU", topics: ["ME, YOU, MY, YOUR", "NAME, NICE, MEET", "MY NAME + eja nama", "dialog perkenalan"] },
            { number: 6, title: "Tuli, Dengar & Belajar Isyarat", topics: ["DEAF, HEARING", "LEARN, SIGN, ASL", "YOU DEAF? — YES/NO", "identitas & sikap hormat"] },
            { number: 7, title: "Angka 0–10", topics: ["1–5 telapak ke diri sendiri", "6–9 ibu jari menyentuh jari", "10 dengan goyangan", "nomor telepon & menghitung"] },
            { number: 8, title: "Ekspresi Wajah: Pertanyaan Ya/Tidak", topics: ["alis naik + kepala condong", "YOU LEARN SIGN?", "menjawab YES/NO dengan wajah", "latihan cermin"] },
            { number: 9, title: "Kata Tanya WH", topics: ["WHAT, WHERE, WHO", "WHEN, WHY, HOW", "alis berkerut di pertanyaan WH", "kata tanya di akhir kalimat"] },
            { number: 10, title: "Kabar & Perasaan", topics: ["HOW YOU? — FINE", "GOOD, BAD, HAPPY, SAD", "TIRED, SICK, HUNGRY", "wajah ikut bercerita"] },
            { number: 11, title: "Strategi Komunikasi di Kelas", topics: ["AGAIN, SLOW", "UNDERSTAND, DON'T-UNDERSTAND", "KNOW, DON'T-KNOW, QUESTION", "TEACHER, STUDENT, HELP"] },
            { number: 12, title: "Keluarga & Teman", topics: ["MOTHER, FATHER (dahi = laki-laki, dagu = perempuan)", "SISTER, BROTHER, BABY", "FAMILY, FRIEND, LOVE", "silsilah keluarga"] },
            { number: 13, title: "Angka 11–20 & Umur", topics: ["11–15 dengan jentikan & tekukan", "16–19 diputar dari 10", "20", "OLD + HOW-MANY"] },
            { number: 14, title: "Waktu & Warna", topics: ["MORNING, NIGHT, NOW, DAY", "TOMORROW, YESTERDAY (garis waktu)", "RED, BLUE, GREEN, YELLOW", "BLACK, WHITE, ORANGE"] },
            { number: 15, title: "Kebutuhan Sehari-hari", topics: ["EAT, DRINK, WATER", "TOILET, SLEEP, WORK, HOUSE", "WANT, NEED, LIKE", "kalimat permintaan sopan"] },
            { number: 16, title: "Review & Proyek Percakapan", topics: ["review 80+ isyarat", "dialog perkenalan lengkap", "rekam video 60 detik", "umpan balik pengajar"] },
          ],
        },
        {
          code: "A1.2",
          name: "Everyday Signs — Isyarat Sehari-hari",
          preview: true,
          sessions: [
            { number: 1, title: "Kata Ganti & Penunjukan Ruang", topics: ["HE/SHE/IT dengan menunjuk", "WE, THEY", "menaruh orang di ruang isyarat"] },
            { number: 2, title: "Kalimat Dasar & Urutan Topik–Komentar", topics: ["topik dulu, komentar kemudian", "alis naik untuk topik", "latihan 20 kalimat"] },
            { number: 3, title: "Hari dalam Seminggu", topics: ["MONDAY–SUNDAY", "putaran huruf pertama", "jadwal mingguan"] },
            { number: 4, title: "Jam & Waktu", topics: ["TIME, HOUR, MINUTE", "angka di pergelangan", "janji bertemu"] },
            { number: 5, title: "Kata Kerja Harian", topics: ["GO, COME, WORK, STUDY", "kata kerja berarah", "rutinitas pagi"] },
            { number: 6, title: "Makanan & Minuman", topics: ["APPLE, BREAD, RICE, COFFEE", "suka/tidak suka", "memesan di kafe"] },
            { number: 7, title: "Tempat di Kota", topics: ["SCHOOL, HOSPITAL, STORE", "WHERE + menunjuk", "petunjuk arah sederhana"] },
            { number: 8, title: "Pekerjaan", topics: ["TEACHER, DOCTOR, STUDENT", "akhiran PERSON", "YOU WORK WHAT?"] },
            { number: 9, title: "Negasi dalam ASL", topics: ["NOT, NONE, NEVER", "gelengan kepala", "kalimat negatif"] },
            { number: 10, title: "Kata Sifat & Deskripsi Orang", topics: ["TALL, SHORT, BEAUTIFUL", "rambut & pakaian", "mendeskripsikan teman"] },
            { number: 11, title: "Angka 21–100", topics: ["21–29 pola khusus", "puluhan", "harga & umur"] },
            { number: 12, title: "Uang & Belanja", topics: ["DOLLAR, CENT, COST", "HOW-MUCH", "roleplay toko"] },
            { number: 13, title: "Cuaca & Musim", topics: ["HOT, COLD, RAIN, SUN", "SPRING–WINTER", "cuaca hari ini"] },
            { number: 14, title: "Hobi & Waktu Luang", topics: ["READ, SWIM, MOVIE, MUSIC", "LIKE vs DON'T-LIKE", "berbagi hobi"] },
            { number: 15, title: "Review A1.2", topics: ["kuis 100 isyarat", "dialog 8 giliran", "umpan balik"] },
            { number: 16, title: "Mini-Project — Video Rutinitas Harian", topics: ["skrip topik–komentar", "wajib 3 kata kerja berarah", "rekam & kirim"] },
          ],
        },
        {
          code: "A1.3",
          name: "Telling Stories — Bercerita Sederhana",
          preview: false,
          sessions: [
            { number: 1, title: "Penanda Waktu Lampau & Mendatang", topics: ["FINISH, WILL", "garis waktu di badan"] },
            { number: 2, title: "Classifier Dasar: Orang & Kendaraan", topics: ["CL:1, CL:3", "menggambar gerak"] },
            { number: 3, title: "Classifier Benda Datar & Bulat", topics: ["CL:B, CL:C", "mendeskripsikan benda"] },
            { number: 4, title: "Kata Kerja Berarah", topics: ["GIVE, HELP, ASK", "subjek & objek dari arah gerak"] },
            { number: 5, title: "Rumah & Ruangan", topics: ["ROOM, KITCHEN, BED", "denah dengan classifier"] },
            { number: 6, title: "Transportasi", topics: ["CAR, BUS, TRAIN, PLANE", "perjalanan ke kampus"] },
            { number: 7, title: "Kesehatan & Tubuh", topics: ["HEAD, STOMACH, HURT", "ke dokter"] },
            { number: 8, title: "Pertanyaan Retoris", topics: ["WHY? — jawaban sendiri", "alis naik pada WH retoris"] },
            { number: 9, title: "Perbandingan & Pilihan", topics: ["BETTER, PREFER", "menunjuk dua pilihan di ruang"] },
            { number: 10, title: "Role Shift", topics: ["memerankan tokoh", "bahu & pandangan bergeser"] },
            { number: 11, title: "Cerita Pendek Bergambar", topics: ["urutan peristiwa", "classifier + role shift"] },
            { number: 12, title: "Budaya Tuli: Seni & Komunitas", topics: ["puisi ASL, ABC story", "Deaf events"] },
            { number: 13, title: "Mengatur Pertemuan", topics: ["MEET, TIME, PLACE", "mengonfirmasi jadwal"] },
            { number: 14, title: "Video Call & Teknologi", topics: ["VIDEOPHONE, TEXT", "etika video call"] },
            { number: 15, title: "Review A1.3", topics: ["cerita 1 menit", "kuis classifier"] },
            { number: 16, title: "Proyek Akhir A1 — Cerita Diri 2 Menit", topics: ["perkenalan + keluarga + rutinitas", "rekam & presentasi"] },
          ],
        },
      ],
    },
  ],
};

export default curriculum;
