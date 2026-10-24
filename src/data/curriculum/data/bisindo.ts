import type { LanguageCurriculum } from "../types";
import { getLanguageBySlug } from "../languages";

// [isyarat-bisindo-v1] Silabus Bahasa Isyarat Indonesia (BISINDO). Kerangka A1 sama
// dengan ASL, isi ditulis baru: abjad jari dua tangan, tata bahasa hanya yang
// terdokumentasi untuk BISINDO, budaya & sejarah Tuli Indonesia. Dek slide (dashboard:
// src/data/dekSilabus/bisindo-*.ts) — judul sesi WAJIB sama persis dengan heading dek.
// Bentuk isyarat & fakta budaya masih menunggu konfirmasi pengajar Tuli (Keren Noni/Melinda).
const meta = getLanguageBySlug("bisindo")!;

const curriculum: LanguageCurriculum = {
  meta,
  overview:
    "BISINDO (Bahasa Isyarat Indonesia) adalah bahasa isyarat yang tumbuh alami di komunitas Tuli Indonesia — bahasa utuh dengan tata bahasanya sendiri, bukan bahasa Indonesia yang 'dipindah ke tangan'. BISINDO berbeda dengan SIBI (Sistem Isyarat Bahasa Indonesia), sistem buatan pemerintah yang mengikuti tata bahasa Indonesia lengkap dengan imbuhan; komunitas Tuli lewat Gerkatin dan Pusbisindo memperjuangkan BISINDO sebagai bahasa mereka. Ciri khas BISINDO: abjad jari memakai dua tangan, ekspresi wajah dan gerak bibir ikut membawa makna, dan isyaratnya bervariasi antardaerah (Jakarta, Yogyakarta, Solo, Makassar, Bali, dan lain-lain) — seperti logat dalam bahasa lisan. Di Linguo, tiap sesi dilengkapi avatar 3D yang bisa diputar ulang pelan dan dari berbagai sudut. Isyarat di slide mengikuti bentuk yang umum dipakai; pengajar Tuli akan menunjukkan variasi daerahnya. Catatan: BISINDO berbeda dengan ASL (American Sign Language).",
  levels: [
    {
      code: "A1",
      name: "Pemula — Abjad Jari, Sapaan & Bercerita Sederhana",
      description:
        "Fondasi BISINDO: budaya Tuli Indonesia & etika berkomunikasi, abjad jari dua tangan A–Z, nama isyarat, angka, sapaan dan perkenalan diri, pertanyaan dengan ekspresi wajah, keluarga, waktu dengan penanda SUDAH/BELUM/AKAN, makanan, pasar, kota, transportasi, dan kesehatan. A1 juga membahas variasi isyarat antardaerah, perbedaan BISINDO dan SIBI, sejarah komunitas Tuli Indonesia, dan cara bekerja bersama Juru Bahasa Isyarat. Akhir A1 kamu bisa memperkenalkan diri, mengeja nama, bertanya-jawab sederhana, dan menceritakan pengalaman pendek.",
      sublevels: [
        {
          code: "A1.1",
          name: "Isyarat Pertama",
          preview: true,
          sessions: [
            { number: 1, title: "Mengenal BISINDO & Budaya Tuli Indonesia", topics: ["BISINDO bahasa alami komunitas Tuli", "Tuli, bukan tunarungu", "etika: kontak mata, menepuk bahu, melambai", "gerak bibir (mouthing) dalam BISINDO"] },
            { number: 2, title: "Sapaan & Kata Sopan", topics: ["HALO, SELAMAT PAGI/SIANG/MALAM", "TERIMA KASIH, MAAF, TOLONG", "YA, TIDAK + anggukan & gelengan", "dialog sapaan dua tokoh"] },
            { number: 3, title: "Abjad Jari Dua Tangan: A–G", topics: ["tangan dominan & tangan pasif", "huruf A–G", "posisi tangan saat mengeja", "latihan eja kata pendek"] },
            { number: 4, title: "Abjad Jari: H–N", topics: ["huruf H–N", "huruf yang mirip bentuknya", "latihan eja kata pendek"] },
            { number: 5, title: "Abjad Jari: O–U", topics: ["huruf O–U", "membedakan huruf vokal", "eja nama kota"] },
            { number: 6, title: "Abjad Jari: V–Z & Mengeja Nama", topics: ["huruf V–Z", "ritme mengeja yang jelas", "mengeja nama sendiri", "kapan abjad jari dipakai"] },
            { number: 7, title: "Perkenalan Diri: AKU, KAMU, NAMA", topics: ["AKU, KAMU, NAMA", "KENAL, SENANG", "NAMA AKU + eja nama", "dialog perkenalan"] },
            { number: 8, title: "Nama Isyarat", topics: ["apa itu nama isyarat", "diberikan oleh komunitas Tuli, bukan dibuat sendiri", "contoh nama isyarat dari ciri orang", "bertanya nama isyarat seseorang"] },
            { number: 9, title: "Tuli, Dengar & Belajar Isyarat", topics: ["TULI, DENGAR", "BELAJAR, ISYARAT, BISINDO", "KAMU TULI? — YA/TIDAK", "identitas & sikap hormat"] },
            { number: 10, title: "Angka 1–10", topics: ["angka 1–5", "angka 6–10", "nomor telepon", "menghitung benda"] },
            { number: 11, title: "Bertanya dengan Wajah: Pertanyaan Ya/Tidak", topics: ["ekspresi wajah saat bertanya", "KAMU BELAJAR BISINDO?", "menjawab dengan wajah & kepala", "latihan cermin"] },
            { number: 12, title: "Kata Tanya", topics: ["APA, SIAPA, DI MANA", "KAPAN, KENAPA, BAGAIMANA, BERAPA", "wajah saat kata tanya", "posisi kata tanya dalam kalimat"] },
            { number: 13, title: "Kabar & Perasaan", topics: ["APA KABAR? — BAIK", "SENANG, SEDIH, MARAH", "CAPEK, SAKIT, LAPAR", "wajah ikut bercerita"] },
            { number: 14, title: "Strategi Komunikasi", topics: ["ULANG, PELAN-PELAN", "PAHAM, TIDAK PAHAM", "TAHU, TIDAK TAHU, TULIS", "menulis di HP saat buntu"] },
            { number: 15, title: "Keluarga & Teman", topics: ["AYAH, IBU", "KAKAK, ADIK, ANAK", "KELUARGA, TEMAN, SAYANG", "variasi isyarat keluarga antardaerah"] },
            { number: 16, title: "Review & Proyek: Video Perkenalan 60 Detik", topics: ["review isyarat A1.1", "dialog perkenalan lengkap", "rekam video 60 detik", "umpan balik pengajar"] },
          ],
        },
        {
          code: "A1.2",
          name: "Isyarat Sehari-hari",
          preview: true,
          sessions: [
            { number: 1, title: "Kata Ganti & Menunjuk", topics: ["DIA dengan menunjuk", "KITA, KAMI, MEREKA", "menunjuk orang yang tidak hadir"] },
            { number: 2, title: "Angka 11–20 & Umur", topics: ["angka 11–20", "UMUR, BERAPA", "bertanya & menjawab umur"] },
            { number: 3, title: "Hari dalam Seminggu", topics: ["SENIN–MINGGU", "variasi isyarat hari antardaerah", "jadwal mingguan"] },
            { number: 4, title: "Waktu: Sekarang, Nanti, Besok, Kemarin", topics: ["SEKARANG, NANTI, BESOK, KEMARIN", "PAGI, SIANG, SORE, MALAM", "JAM + angka", "janji bertemu"] },
            { number: 5, title: "Penanda SUDAH, BELUM, AKAN", topics: ["SUDAH & BELUM", "AKAN", "kata kerja tidak berubah bentuk", "kalimat tentang kegiatan hari ini"] },
            { number: 6, title: "Kegiatan Harian", topics: ["MAKAN, MINUM, MANDI, TIDUR", "KERJA, SEKOLAH, PULANG", "rutinitas pagi"] },
            { number: 7, title: "Makanan & Minuman Indonesia", topics: ["NASI, MI, TEH, KOPI", "SAMBAL, BAKSO, PEDAS, ENAK", "memesan di warung"] },
            { number: 8, title: "Warna & Benda di Sekitar", topics: ["MERAH, BIRU, HIJAU, KUNING", "HITAM, PUTIH", "benda di kelas & rumah"] },
            { number: 9, title: "Tempat di Kota", topics: ["PASAR, SEKOLAH, KANTOR", "RUMAH SAKIT, MASJID, GEREJA", "DI MANA + menunjuk"] },
            { number: 10, title: "Pekerjaan", topics: ["GURU, DOKTER, POLISI", "PEDAGANG, PEGAWAI, MAHASISWA", "KAMU KERJA APA?"] },
            { number: 11, title: "Negasi: TIDAK, BELUM, BUKAN", topics: ["TIDAK, BELUM, BUKAN", "TIDAK ADA, TIDAK MAU", "gelengan kepala"] },
            { number: 12, title: "Angka Puluhan, Ribuan & Rupiah", topics: ["puluhan & ratusan", "RIBU, RUPIAH", "membaca harga"] },
            { number: 13, title: "Belanja & Tawar-menawar di Pasar", topics: ["BERAPA? MAHAL, MURAH", "BELI, JUAL, KURANG", "roleplay pasar"] },
            { number: 14, title: "Cuaca Indonesia", topics: ["PANAS, HUJAN, MENDUNG", "BANJIR, ANGIN", "musim hujan & kemarau"] },
            { number: 15, title: "Hobi & Waktu Luang", topics: ["SEPAK BOLA, BULU TANGKIS", "NONTON, MASAK, JALAN-JALAN", "SUKA vs TIDAK SUKA"] },
            { number: 16, title: "Review & Mini-Project: Video Rutinitas Harian", topics: ["review isyarat A1.2", "skrip rutinitas dengan SUDAH/BELUM/AKAN", "rekam & kirim"] },
          ],
        },
        {
          code: "A1.3",
          name: "Bercerita Sederhana",
          preview: false,
          sessions: [
            { number: 1, title: "Bercerita Kemarin & Besok", topics: ["keterangan waktu di awal kalimat", "cerita pendek kemarin"] },
            { number: 2, title: "Transportasi", topics: ["MOTOR, MOBIL, ANGKOT, OJEK", "KERETA, PESAWAT, KAPAL"] },
            { number: 3, title: "Arah & Lokasi", topics: ["KIRI, KANAN, LURUS", "DEKAT, JAUH, petunjuk arah"] },
            { number: 4, title: "Tubuh & Kesehatan", topics: ["KEPALA, PERUT, SAKIT", "DOKTER, OBAT, ke puskesmas"] },
            { number: 5, title: "Deskripsi Orang & Pakaian", topics: ["TINGGI, PENDEK, RAMBUT", "JILBAB, KACAMATA, BAJU"] },
            { number: 6, title: "Kata Kerja Berarah", topics: ["MEMBERI, MEMBANTU, BERTANYA", "arah gerak menunjukkan siapa ke siapa"] },
            { number: 7, title: "Mau, Bisa, Harus, Boleh", topics: ["MAU, BISA, TIDAK BISA", "HARUS, BOLEH"] },
            { number: 8, title: "Perbandingan & Pilihan", topics: ["LEBIH, PALING, SAMA", "ATAU, pilih yang mana"] },
            { number: 9, title: "Hari Besar Indonesia", topics: ["LEBARAN, NATAL, IMLEK, NYEPI", "17 AGUSTUS, ucapan selamat"] },
            { number: 10, title: "Variasi Isyarat Antardaerah", topics: ["isyarat Jakarta, Yogyakarta, Solo, Makassar, Bali", "tetap saling memahami"] },
            { number: 11, title: "BISINDO vs SIBI", topics: ["SIBI sistem buatan pemerintah berbasis bahasa Indonesia", "pengalaman Tuli dengan SIBI di sekolah & TV"] },
            { number: 12, title: "Sejarah & Komunitas Tuli Indonesia", topics: ["Gerkatin, Pusbisindo, Kata Kolok Bengkala", "UU No. 8/2016, Hari Bahasa Isyarat Internasional"] },
            { number: 13, title: "Juru Bahasa Isyarat & Aksesibilitas", topics: ["JBI di TV & acara", "etika berbicara lewat JBI, video call"] },
            { number: 14, title: "Bercerita Pengalaman Pribadi", topics: ["cerita liburan", "urutan waktu & ekspresi wajah"] },
            { number: 15, title: "Review A1", topics: ["kuis semua isyarat A1", "dialog bebas"] },
            { number: 16, title: "Proyek Akhir A1: Cerita 2 Menit", topics: ["cerita pengalaman 2 menit", "dialog dengan pengajar Tuli"] },
          ],
        },
      ],
    },
  ],
};

export default curriculum;
