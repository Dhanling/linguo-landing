/* [ebook-tts-ketuk-kata-v1] Pelafalan kata/kalimat yang diketuk di reader e-book.
 *
 * Modul mandiri Linguo ditulis untuk dibaca SENDIRI: tidak ada pengajar di
 * sebelah siswa yang bisa ditanya "ini bunyinya bagaimana". Ketuk katanya di
 * halaman, suaranya keluar — itu saja lubang yang ditutup fitur ini.
 *
 * Suaranya lewat /api/tts (Google Chirp 3 HD), rute yang sama dengan TTS kuis &
 * Watch and Learn — tidak ada kredensial maupun tagihan baru.
 *
 * Soal biaya: Chirp ditagih per KARAKTER, dan satu kata yang sama diketuk
 * berkali-kali oleh siswa yang sama (dan oleh ratusan siswa lain yang membaca
 * modul yang sama) adalah pola pemakaian yang wajar di reader. Karena itu ada
 * tiga lapis cache:
 *   1. memori    — ketuk ulang di sesi yang sama: nol jaringan, nol tagihan;
 *   2. Cache API — bertahan sesudah tab ditutup, per perangkat;
 *   3. server    — Supabase Storage di /api/tts, DIPAKAI BERSAMA semua siswa,
 *                  jadi satu frasa cuma pernah disintesis sekali seumur hidup.
 */

import { toLangCode } from "@/lib/quiz/language";
import { KODE_CHIRP } from "@/lib/quizTts";
import {
  BATAS_TEKS_TTS, BUCKET_TTS, bersihkanTeksTts, jalurCacheTts, namaVoice,
} from "@/lib/ttsVoice";

/** Bahasa ini punya suara Chirp 3 HD? Beda dengan `bisaTts` di kuis: di sini
 *  Indonesia IKUT, karena modul BIPA memang bahasa targetnya Indonesia. */
export function bisaDibunyikan(kode?: string | null): boolean {
  const k = (kode || "").trim().toLowerCase();
  return !!k && KODE_CHIRP.has(k);
}

/* Judul katalog memuat edisi bahasa pengantarnya — "… (Edisi Bahasa Indonesia)".
   Kalau bagian itu ikut dipindai, modul Spanyol bisa terbaca sebagai modul
   Indonesia dan seluruh isinya dibunyikan dengan suara yang salah. */
const BUANG_EDISI = /\((?:edisi|indonesian?|english)[^)]*\)|edisi\s+bahasa\s+\p{L}+/giu;

/**
 * Kode bahasa modul: kolom `digital_products.language` dulu, judulnya belakangan.
 * null = jangan tawarkan TTS sama sekali (lebih baik tak ada suara daripada
 * kata Spanyol dilafalkan dengan fonem Vietnam).
 */
export function kodeBahasaEbook(language?: string | null, judul?: string | null): string | null {
  const dariKolom = toLangCode(language);
  if (dariKolom) return dariKolom;
  const bersih = String(judul || "").replace(BUANG_EDISI, " ");
  for (const kata of bersih.split(/[^\p{L}]+/u)) {
    if (kata.length < 3) continue;
    const k = toLangCode(kata);
    if (k) return k;
  }
  return null;
}

/* ── penjagaan bahasa: mana yang boleh diketuk ────────────────────────────
   [ebook-jaga-bahasa-id-v2] Modul kita dwibahasa dari sananya: kalimat bahasa
   target, terjemahan Indonesia di kolom sebelahnya, dan penjelasan tata bahasa
   yang seluruhnya bahasa Indonesia. Yang boleh diketuk siswa HANYA teks bahasa
   yang sedang dipelajari — kata Indonesia yang ikut berbunyi (dan ikut dicarikan
   arti) justru mengajarkan pelafalan yang paling tidak boleh ditiru: bahasa
   Indonesia berlogat Spanyol.

   Versi pertama cuma punya daftar ±120 kata umum, jadi kata Indonesia biasa
   yang kebetulan tak masuk daftar ("lengkap", "kolom", "penolakan") lolos dan
   dibunyikan sebagai bahasa Spanyol. Sekarang penilaiannya tiga lapis:

     1. LEKSIKON  — daftar kata di bawah bukan karangan tangan: diperas dari
        seluruh isi modul di content/ebook (`scripts/leksikon-id-ebook.mjs`),
        yaitu kata yang muncul di ruas berbahasa Indonesia dan praktis tak
        pernah muncul di ruas bahasa target. Itu sebabnya isinya sampai kata
        seperti "resepsionis" dan "kembalian" — memang itu yang tercetak di
        modulnya.
     2. MORFOLOGI — imbuhan yang praktis cuma milik bahasa Indonesia: "-nya",
        "-kan", "meng-", "ke-…-an", kata ulang. Ini yang menangkap kata yang
        tak pernah terpikir dimasukkan ke daftar mana pun.
     3. KONTEKS   — kalau kata itu sendiri tak bisa dipastikan, yang dinilai
        KLAUSA tempat ia duduk (sel tabel / potongan kalimat antar tanda baca).
        "Jawabnya lengkap:" berklausa Indonesia, jadi "lengkap" ikut dikunci;
        "Hoy es martes" di klausa sebelahnya tetap boleh diketuk.

   Arahnya sengaja berat sebelah: ragu = tidak dibunyikan. Kata bahasa target
   yang ikut terkunci cuma kehilangan satu ketukan; kata Indonesia yang lolos
   mengajarkan logat yang salah. */

/* Kata yang PASTI bukan bahasa Indonesia: ejaan Indonesia seluruhnya ASCII,
   jadi satu huruf beraksen (á, ñ, ü) atau satu aksara non-Latin (kana, kanji,
   hangul, sirilik, Arab, Thai) sudah cukup menandai kata bahasa target. */
const HURUF_ASING = /[^\u0000-\u007F]/u;

/* [ebook-jaga-bahasa-id-v2] Leksikon Indonesia hasil perasan isi modul.
   Sengaja disimpan sebagai satu string: 800+ kata sebagai literal array
   membengkakkan berkasnya tanpa guna. */
const LEKSIKON_ID = `
  abjad absen abu acak acara ada adalah adanya adik aduh agak agar agus agustus air akan
  akhir akhirnya akibat aksara aksaranya aksen ala alamat alasan alasannya alat
  alhamdulillah alkohol alun alurnya ambang ambil anak anda aneh anggota anggukan anggur
  angin angka angkanya angkat anime anna antara antaranya antrean apa apakah apartemen api
  aplikasi apotek apoteknya april arah arahkan arti artinya asalmu aslinya atas atasnya
  atau aturan aturannya awal awet ayah ayahku ayahmu ayam ayo ayudarme bab baca bacaan
  bacalah bacanya badan badannya bagaimana bagian bagiannya bagus bahan bahannya bahasa
  bahasanya bahwa baik baiklah baiknya bakal baku balai balikkan bandara bandingkan bandon
  banget bangkit bangsa bangun bank bantu bantuan bantuannya banyak bapak barat baris
  barisan baru basi basket batasnya bawa bawah bawang bayangan bayangkan bayar bayarnya
  bayi beban bebas beberapa bedanya beddo begitu bekas bekerja belajar belakang belakangan
  belakangnya belanja belas beli belok belokkan benar benci bendanya bentuk benua
  bepergian berada berakhir berangin berangkat berapa berarti berasal berat beraturan
  berawan berbahasa berbalik berbaring berbasa berbeda berbelok berbentuk berbicara
  berbuah bercampur bercerai bercerita berdatangan berdekatan berdiam berdiri berdua
  berenang berfungsi berganti bergantian bergantung bergeser berguna berharap berharga
  berhasil berhenti berhubungan beri berikut berisi berisik beristirahat berita berjalan
  berjanji berjenjangnya berkat berkata berkelakuan berkembang berkenalan berlaku
  berlebihan berlima berlin bermunculan bernama berolahraga berpakaian berpamitan
  berpasangan berpindah berpola bersama bersamamu bersandar bersaudara bersejarah
  berselang berselera bersih bertahan bertambah bertanya bertiga bertukar berulang berumur
  berupa berurutan berusaha berwarna besar besarnya besok betapa betul biarkan biasa
  biasanya biayanya bicara bicarakan bicaramu bicaranya bikin bingung bioskop bisa boleh
  bombai bonnya buah buat buatkan buatmu budaya buddha bue bujur buka bukan buktinya buku
  bulan bunga bungkukan bungkukannya bungkus bunyinya buru bus butuh butuhkan campurannya
  canggung cansados cantik capek cara caranya cari carlos caros catatan cefr celana cepat
  cerah cerdas ceria cerita ceritakan ceritamu cermat cerrados cirinya ciuman coba cobalah
  cocok cokelat contoh coretan cuaca cuacanya cuarta cucu cuestan cukup cuma dadar daftar
  daging dah dalam dalamnya dan dari daripada darurat dashboard datang dekat dekatnya
  delapan demi dengan dengar dengarkan depan depanmu departemen derajat deretan desember
  detektif detik dewi dia diabaikan diadakan dialog dian dianggap dibaca dibalas dibalik
  dibangun dibatalkan dibawa dibeli diberi diberikan dibuat dibuka dibutuhkan dicari
  dicetak didahului didahulukan digantikan digit dihafal dihangatkan diharapkan dihormati
  diikuti diingat diinginkan dijaga dijanjikan dijelaskan dikejar dikerjakan dilatih
  diletakkan dilewati diliburkan dilihat dilunakkan dilupakan diminta dimuat dimulai
  dingin dipadatkan dipahami dipakainya dipaksa dipanggil dipastikan dipelajari diperiksa
  dipikir dirancang dirangkai diri dirimu dirinya disambung disambut disarankan disebut
  disentuh diseret disertai disesuaikan diskon diskonnya disuruh disusun ditambahkan
  ditanya ditanyakan ditawar ditebak ditekan ditekankan ditukar dituliskan ditumpuk
  ditunjukkan diturunkan ditutup diubah diucapkan diuji diulang dokter dompet dosen drama
  dua duanya duda duduk duermen dugaanmu dulu dunia durasi easy efektif ejaan elang emas
  empat enak enam episode era eropa fakta februari feminin film filmnya formulir frasa
  frekuensi fuera furigana gagal galak gambarkan gampang gangguan ganti gantilah garis
  gaun gedung gelombang gerakan gerbang gereja giliran glosarium goreng goresan gram
  granada guapas gula gunanya gunung guru gurumu gurunya habis hafal hafalan hafalkan hal
  halaman halo halte haltenya halus ham hampir hanya harga harganya hari harinya harus
  hasilnya hasrat hati hebat hiasan hidangan hidup hidupku hijau hijos hilang hilangnya
  hiragana hitam hitungan hormat hujan hurufnya ibu ibuku ibumu icoca ide identitas ikan
  ikat ikut ikuti indah indonesia indonesiamu indonesianya industri info ingat ingatan
  inggris ingin inginkan ini inilah insinyur interaktif ipar iri isi isian isinya
  istirahat istri itu itulah jabat jadi jadwal jadwalmu jago jaket jalan jam jamak jamnya
  janda jangan janggal janji janjian januari jarak jaraknya jarang jaringan jatuh jauh
  jawab jawabanmu jawabannya jembatan jendela jepang jepangnya jeruk jins jlpt juga jujur
  juli jumat jumlahnya jumpa juni juru jus justru kabar kabari kabarmu kadang kaget kah
  kain kaisar kaiwa kakak kakaknya kakarimashita kakek kaki kalau kali kalimat kalimatmu
  kalimatnya kalinya kamar kamarmu kamarnya kami kamis kamu kamus kamusnya kanan kanannya
  kandung kanji kantin kantong kantor kantornya kapas karena kartu karyawan kasih kasir
  kata katakana katanya katedral katedralnya katun kayu keadaan kebangsaan kebangsaannya
  kebanyakan kebenaran keberangkatan kebesaran kebetulan kebiasaan kebutuhan kecepatan
  kecil kecilnya kecuali kedatangan kedekatan kedengarannya kedua keduanya keempat keenam
  kegiatannya kehilangan keigo keinginan kejadian keju kekecilan kelas kelompok keluar
  keluarga keluargaku kemampuanmu kemarau kemarin kembali kembalian kembaliannya
  kembalilah kembang kemeja kemejanya kemewahan kemewahanku kemudian kemungkinan kenal
  kenalan kenali kenalkan kenapa kendaraan kentang kepada kepadamu kepala kepalamu
  kepemilikan kepingan keponakan keponakanmu kerangka kerangkanya keras kereta keretanya
  kerjaan kerjakan kerjanya kesalahan kesan kesempatan kesenangan kesopanannya ketat
  ketemu ketemuan keterangan ketergesaan keterlambatan ketersediaan ketidaksopanan ketiga
  ketiganya ketinggalan ketukannya keunggulan khas khusus kira kiri kita kok kolom
  kolombia koma konkretnya konteks kopi kosakata kosakatanya kosong kota kotak kotamu
  kotanya kotor krim kuasai kuat kuil kunci kuning kurang kurs kursi kurung kurus label
  lagi lagu lahir lain lajang laki lakiku lakimu lakukan lalu lama lambat lampau lampu
  lancar langkah langsung lanjutkan lantai lapar laptop larangan largas larut latar
  latihan latihannya latin laut layar lebih lekat lelah lelaki lelucon lembap lembar
  lembaran lembut lengkapi lengkungnya leo letak letaknya level levelmu lewat lewati lho
  libro libur lift lihat lihatlah lima lingkaran linguo lintas lirik listrik liter loket
  longgar lorong luar luas lucu lurus lusa lusin maaf maafkan macet mahal mahasiswa mahir
  main maju maka makan makanan makanannya makanya makhluk makin maksud malam malamnya mana
  mandi manis mantap mantel maret mari masak masakan masalah masih masing masjid maskulin
  masuk matamu matang matte mau maupun mawar mayores mei meja melainkan melakukan
  melampaukan melanjutkan melatih melebur meleburkan melelahkan melengkapi meleset
  meletakkan melihat melihatnya melirik melompati melupakan memahami memakai memakan
  memaksamu memandikan memanggil memasak memasang memastikan membaca membacanya membagi
  membalik membandingkan membantu membaringkan membawa membawakan membayar membedakan
  membedakannya membela membeli membelinya membentuk memberi membetulkan membiarkannya
  membuang membuat membuatnya membuka membulatkan membungkuk membunyikan membutuhkan
  memeriksa memesan meminta memisahkan memotret memperbaiki mempercepatmu memperhitungkan
  memperkenalkan mempertimbangkan memuat memulai memutus menahan menaikkan menakutkan
  menambahkan menandakan menang menangkap menanyakan menanyakannya menarik menawar
  menawarkan menceritakan mencicipi mencoba mendadak mendaftar mendatar mendengar
  mendengarkan mendung menebak menekankan menemani menempel menempelkan menemukan
  menentukan menerima menerus menetap mengajak mengaku mengalahkan mengalihkan mengambil
  mengangkat mengapa mengatakan mengatur mengecilkan mengejar mengelilingi mengembalikan
  mengenai mengenal mengenali mengenalinya mengeras mengerjakan mengerjakannya mengerti
  mengetik mengetuk menggabungkannya menggambar menggambarkan mengganti menggantung
  menggesernya menggurui menghadang menghafal menghafalnya menghemat menghindari
  menghitung menghujan mengikuti mengikutinya mengincar mengingat mengingatnya
  menginginkan mengobrol mengubahnya mengucapkan mengucapkannya mengulang mengunci
  mengunjungi mengusir menilai meninggalkan menipu menit menitnya menjadi menjaga
  menjatuhkan menjawab menjebak menjegal menjelaskan menjual menolak menolong menonton
  menulis menulisnya menumpuk menunggu menunjuk menunjukkan menuntaskan menuntut menurut
  menutup menyalin menyambung menyambungnya menyangkal menyapa menyatakan menyeberang
  menyebut menyebutkan menyebutkannya menyebutnya menyelamatkan menyelesaikan menyenangkan
  menyepakati menyesali menyesuaikan menyiapkan menyiapkanmu menyinggung menyisakan
  menyuruhmu menyusun mepet merah merangkai merangkum mereka merekomendasikan merendah
  merespons meriah mertua meski mewah milikku mimasen minggu mingguan minimal minimarket
  minta minum minuman minumnya minyak miring mobil modern modul mohon muda mudah mula
  mulai mulut mulutmu mulutnya muncul mundur mungkin murah murid museos museum museumnya
  musik mutlak nadanya naik naiklah nama namamu namanya nanti narimashita nasi nasional
  negara negaramu negaranya negatif negeri nenek nenekku netral ngapain nhk nihonjin nilai
  nilainya node nol nomimasen nomor nonton november nyasar nyata nyonya objeknya oke
  oktober olahraga oleh orang orangnya oranye osaka otak otomatis oyoide pacar pada
  padahal pagi paham pajak pak pakai pakaian paman pamanku panas panggang panggilan panik
  panjangnya pantai pantainya papan paraguas paris partikel partikelnya pas pasang
  pasangan pasangkan pasarnya pasmo pasnya paspor patah patokan payung pecahannya pedas
  pedasnya pegawai pekan pekanmu pekannya pekerjaan pelafalan pelajar pelajaran pelajari
  pelaku pelan pelayan peleburan pelemah pelindung pemahaman pemakaiannya pemandian
  pembaca pembeda pembelajar pembeli pembicara pemula penanda penanggalan penanya pencuci
  pendaftaran pendapat pendek pengajar pengajarnya pengalamanmu pengantar pengecualian
  pengenal pengganti penggolongnya penguat pengucapan pengulangan penilaian penilaiannya
  penjaga penjelasan penjelasannya penopang penting penuh penumpang penutur penuturnya
  penyambung penyambungnya per peran perasaan perawat perbedaan perbelanjaan percakapan
  percakapannya perempuan perempuanku perempuanmu pergantian pergaulan pergi perhatikan
  periksa perintah perjalanan perjalanannya perkenalan perkumpulan perlakuan perlu
  permintaan permisi pernah pernikahan perpustakaan persegi persis pertama pertamamu
  pertamanya pertanyaannya pertemuan perubahan perusahaan perut pesan pesanan pesanannya
  pesawat peserta pesta peta petugas petunjuk petunjuknya pierre pihak pilih pilihannya
  pinggang pintar pintas pintu pipi pirang pisang plastik podcast poin pokok pola polanya
  polisi ponsel ponselmu porsi posisi potong praktis praktisnya primas privat pro
  produktif profesi programmer prosesnya pueden pukul pula pulang pulangnya puluh puluhan
  pun punggung punya pusat putih quinto rabu rahmat rajin rak raksasa ramah ramai rambut
  rambutnya rangka rangkaian rangkuman ranjang rantainya rapi rapikan rasa rata ratus
  ratusan receh reguler reiwa rekomendasikan rencana rencanamu rendah repot reputasi resmi
  restoran ribu ribuan ringkasan risiko rok roti ruangan rubios rujukan rumah rumpang
  rumusnya runtut rupiah rutinitas rutinitasmu sabtu sah sakit saku salah salam salin
  saling salju sama sambil sampai samuku sana sandangnya sangat sanggup sangkar santap
  santo sarapan sari satu satunya saudara saya sayang sebagai sebagian sebaiknya
  sebaliknya sebaya sebeda sebelah sebelahnya sebelas sebelum sebenarnya sebentar seberang
  seberangi seberapa sebotol sebuah sebut sebutan secara sedang sedangkan sederhana
  sediakan sedikit segera segitu sehari seharian sehat sehingga sejak sejarah sejenak
  sejuta sekadar sekaleng sekali sekaligus sekarang sekelas sekelasnya seketika sekilas
  sekilo sekilonya sekitar sekitarmu sekitarnya sekolah sekolahnya selain selalu selama
  selamat selanjutnya selasa selatan selesai seling seluruh seluruhnya selusin semacamnya
  semangat semata sembarangan sembilan sembuh sementara seminggu semoga sempat sempit
  sempurna semua semuanya senang sendiri sendirinya sengaja senggang senin senti seoul
  sepak sepanjang separuh sepatu sepenuhnya seperempat seperti september sepuh sepuluh
  sepupu serangan seratus serialmu seribu serikat sering serius serta sertifikat seru
  sesuai sesuaikan sesuatu sesudahnya setahun setara setelah setengah seterusnya setiap
  shinto siang siapkan siaran sibuk sifatnya silakan singkat sini sinilah sisanya sisi
  sistem siti situ situasi situlah soal soalnya soda sopan sopir sor sorenya spanyol
  spanyolmu spanyolnya stasiun stasiunnya status stroberi struk struknya suami suara
  suarakan suatu sudah sudut suica suka suku sulit sulung sumpit sungai sungguh sungguhan
  supaya susu susun susunannya suwatte swalayan swasta syarat syukurlah tabel tabelnya
  tadi tagihan tahu tahun tahunannya takarannya takarir taksi tam taman tambahan tampak
  tampan tamu tanah tanda tandanya tangan tanganmu tangga tanggal tanggalnya tanjakan
  tanpa tanya tanyakan tapi tas tata tawaran tebak ted tegak tegas teh tekanan tekanannya
  teks tekun telanjang telat telepon televisi telinga telingamu teman temanku temannya
  tempati tempo temu temui tenang tenggat tentang tenteram tentu teorinya tepat terakhir
  teratur terbaca terbaik terbalik terbang terbangun terbatas terbiasa terbuka terburu
  tercepat tercer tercera terdengar terendah tergagap tergantung terhadap terhormat
  terikat terima terjadi terjemahan terjemahannya terjemahkan terkenal terlalu terlambat
  termasuk termudah ternyata terpesona terpisah terpotong tersedia tersendat tersering
  tersesat tertawa tertera tertolong tertukar tertutup terus tetangga tetangganya tetap
  tetapi tetesan tiap tiba tidak tidur tiga timur tinggal tinggalnya tinggi tingkat tip
  tiru titik titiknya toilet toko tolong tombol tooo topi total tradisional transaksi
  transportasi tua tuaku tuamu tuan tugas tugasnya tujuanmu tujuh tulang tulis tulisan
  tulisanmu tulisannya tulus tumbuh tunai tunangan tunggal tunggu tunjuk tunjuknya tuntas
  turis turun turunannya tutup ubah ucapkan udara ujiannya ukuran ukurannya ulang ulangi
  umumnya umur umurnya undangan ungkapan ungu unit unitnya universitas untuk urutan
  urutannya usah utama utara utuh varian veinticuatro veis versimu visitan vokalnya
  vuelven wajib walau warna warnanya wartawan warung wisata wortel yaitu yang yokute yuko
`;

/* Kata umum yang jarang muncul di modul tapi pasti ditemui siswa di halaman
   penjelasan — bulan, cuaca, kata penghubung, istilah tata bahasa. Ditulis
   tangan karena frekuensinya di modul terlalu rendah untuk terperas otomatis. */
const TAMBAHAN_ID = `
  januari februari maret april mei juni juli agustus september oktober november desember
  mendung berawan berkabut gerimis badai petir salju hujan cerah teduh lembap gerah sejuk
  musim semi gugur kemarau penghujan cuaca suhu angin berangin
  yang dan atau dengan untuk dari pada dalam tidak bukan jangan adalah akan sudah belum
  saya aku kamu anda dia mereka kita kami ini itu apa apakah bagaimana mengapa kenapa
  berapa siapa kapan karena kalau jika ketika sampai setelah sesudah sebelum lalu kemudian
  juga hanya sangat lebih paling bisa dapat harus ingin suka tahu ada orang hari malam
  pagi siang sore rumah sekolah kerja bekerja jalan lurus kanan kiri belok terus besar
  kecil baik banyak sedikit semua setiap antara tentang sebagai seperti namun tetapi tapi
  supaya agar sehingga oleh kepada terhadap harfiah permisi maaf maafkan terima kasih
  bentuk perintah sopan urutan catatan contoh latihan kosakata arti artinya makna bermakna
  kalimat halaman bahasa mana kemana dimana menit jam nomor depan belakang naik turun
  ambil kedua ketiga sepuluh nyasar kaki mungkin menanyakan memberi meminta menyebut
  menyatakan memperkenalkan perkenalan petunjuk arah sapaan ucapan angka waktu keluarga
  makanan minuman belanja pekerjaan tubuh transportasi membaca menulis mendengar berbicara
  tata bunyi huruf hafalan ringkasan tujuan target kolom baris tabel kotak daftar
  lengkap hampir nyaris cukup masih justru malah memang bahkan apalagi misalnya yakni
  penolakan penerimaan ajakan tawaran jawaban pertanyaan pernyataan sebutan panggilan
  pengganti menutup membuka pintu terdengar kedengaran sekaligus masing tersebut berikut
  berikutnya sebelumnya pertama terakhir tengah pinggir dalamnya luarnya atas bawah
  sendiri sendirinya biasa umumnya intinya pokoknya singkatnya artinya maksudnya
`;

function kataDaftar(teks: string): Set<string> {
  return new Set(teks.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 1));
}
const SET_ID = new Set([...kataDaftar(LEKSIKON_ID), ...kataDaftar(TAMBAHAN_ID)]);

/* Imbuhan yang praktis cuma milik bahasa Indonesia. Tiap pola dipilih supaya
   TIDAK menyentuh bahasa target yang kita jual: "menú" & "mensaje" tak kena
   karena polanya minta "meng-"/"meny-"/"memb-"/"memp-", bukan "men-" telanjang;
   "menos" & "mercado" tak kena karena "me-" telanjang memang tak dipakai. */
const MORFOLOGI_ID: RegExp[] = [
  /^\p{L}{3,}(?:nya|kan|kah|lah|pun)$/u,      // artinya, dengarkan, apakah
  /^ke\p{L}{3,}an$/u,                         // kebiasaan, keadaan, kesalahan
  /^(?:peng|peny|pem|pen|per|pe)\p{L}{2,}an$/u, // penolakan, pekerjaan, perubahan
  /^(?:meng|meny|memb|memp)\p{L}{2,}$/u,      // mengambil, menyapa, membeli, memperkenalkan
  /^ber\p{L}{3,}$/u,                          // berangin, berkenalan, berdua
  /^(\p{L}{3,})-\1$/u,                        // kata ulang: buku-buku, jalan-jalan
];

/* Rōmaji Jepang, pinyin, dan alih aksara Thai memakai suku kata yang kebetulan
   berekor sama dengan akhiran Indonesia — "toshokan", "shinkansen". Untuk modul
   beraksara suku kata, akhiran "-kan"/"-pun" dilepas dari pagar; "-nya",
   "-kah", "-lah" tetap dipakai karena tak pernah muncul di alih aksara itu. */
const AKSARA_SUKU_KATA = new Set(["ja", "ko", "zh", "th"]);
const MORFOLOGI_AMAN = MORFOLOGI_ID.map((p, i) => (i === 0 ? /^\p{L}{3,}(?:nya|kah|lah)$/u : p));

/** Kata ini bahasa Indonesia dilihat dari dirinya sendiri (tanpa konteks)? */
function kataIdMurni(k: string, kode: string): boolean {
  if (SET_ID.has(k)) return true;
  const morfologi = AKSARA_SUKU_KATA.has(kode) ? MORFOLOGI_AMAN : MORFOLOGI_ID;
  if (morfologi.some((p) => p.test(k))) return true;
  /* Baris terjemahan harfiah menyambung kata dengan tanda hubung — "terima-kasih",
     "kalau-begitu", "saya-mengangkat-diri". Satu penggal Indonesia di dalamnya
     sudah cukup: gabungan seperti itu tak pernah jadi kata bahasa target. */
  if (!k.includes("-")) return false;
  const penggal = k.split(/[-'’]+/).filter(Boolean);
  return penggal.length > 1 && penggal.some((p) => SET_ID.has(p) || morfologi.some((r) => r.test(p)));
}

/** Kata ini pasti bahasa target (huruf/aksara yang tak dipakai bahasa Indonesia)? */
function kataTargetJelas(k: string): boolean {
  return HURUF_ASING.test(k);
}

const PECAH_KATA = /[^\p{L}\p{N}'’-]+/u;

/* Klausa dinilai, bukan seluruh baris: satu baris modul kerap memuat kedua
   bahasa sekaligus ("Jawabnya lengkap: Hoy es martes"), dan menilai barisnya
   utuh akan mengunci kalimat bahasa target yang justru jadi alasan fitur ini
   ada. Pemenggalnya tanda baca — di modul, pergantian bahasa hampir selalu
   ditandai titik dua, koma, tanda kurung, atau tanda kutip. */
const PECAH_KLAUSA = /[.,;:!?()[\]{}"“”«»…—–|=/]+|\s→\s/u;

/** Potongan kalimat tempat `kata` duduk — konteks penilaian bahasanya. */
export function klausaKata(teks: string, kata: string): string {
  const k = kata.trim().toLowerCase();
  if (!k) return "";
  const bagian = String(teks || "").split(PECAH_KLAUSA).map((s) => s.trim()).filter(Boolean);
  const punya = (s: string) => s.toLowerCase().split(PECAH_KATA).includes(k);
  return bagian.find(punya) ?? (punya(String(teks || "")) ? String(teks) : "");
}

/** Klausanya berbahasa Indonesia? Ditimbang: penanda Indonesia lawan penanda
 *  bahasa target, supaya satu kata Spanyol beraksen di tengah kalimat Indonesia
 *  tidak membuat seluruh klausanya dianggap bahasa target. */
function klausaIndonesia(klausa: string, kode: string): boolean {
  if (kode === "id" || kode === "ms") return false;
  let id = 0;
  let target = 0;
  for (const w of String(klausa || "").toLowerCase().split(PECAH_KATA)) {
    if (!w) continue;
    if (kataTargetJelas(w)) target++;
    else if (kataIdMurni(w, kode)) id++;
  }
  return id > 0 && id >= target;
}

/* [ebook-tts-kata-bukan-baris-v1] Penjagaan dinilai PER KATA lebih dulu, bukan
   per baris — inilah yang dulu membungkam hampir seluruh modul. Satu potongan
   teks pdf.js kerap memuat satu BARIS UTUH tabel, dan baris modul kita memang
   dwibahasa dari sananya: "casa (KA-sa) = rumah". Dengan penilaian per baris,
   satu kata "rumah" di ujung kanan cukup untuk membungkam "casa".
   Konteks baru dipakai sebagai penentu terakhir, dan hanya seluas KLAUSA. */
export function kataIndonesia(kata: string, kode: string, konteks?: string): boolean {
  if (kode === "id" || kode === "ms") return false;
  const k = kata.trim().toLowerCase();
  if (!k) return true;
  if (kataTargetJelas(k)) return false;
  if (kataIdMurni(k, kode)) return true;
  if (!konteks) return false;
  return klausaIndonesia(klausaKata(konteks, k) || konteks, kode);
}

/* Yang dibuang dari sebuah baris sebelum dibunyikan sebagai kalimat:
   - "(KA-sa)"  → petunjuk cara baca, bukan bagian kalimatnya;
   - "= rumah"  → kolom arti di tabel kosakata;
   - "1." / "•" → nomor & bulir daftar;
   - "harfiah: …" → baris terjemahan harfiah. */
const BUANG_KURUNG = /\([^)]*\)/g;
/** Nomor urut & bulir di kepala baris: "1.", "2)", "–", "•". */
const BUANG_NOMOR = /^\s*(?:\d{1,3}[.):]|[-–—•·*])\s*/u;
/* Nomor baris dialog itu angka TELANJANG ("1 Ana: ¡Hola!") — nomornya duduk di
   kolom terpisah selebar 6 mm, dan jarak sesempit itu tak selalu terbaca
   sebagai batas kolom. Sengaja hanya dibuang kalau yang menyusul memang nama
   penutur (kata berawal huruf besar lalu titik dua), supaya kalimat yang
   sungguh dimulai angka — "24 horas al día" — tidak ikut terpangkas. Aksara
   Jepang tak mengenal huruf besar, jadi \p{Lo} ikut dihitung nama penutur —
   tanpa itu nomor baris dialog modul Jepang tak pernah terpangkas. */
const BUANG_NOMOR_DIALOG = /^\s*\d{1,2}\s+(?=[\p{Lu}\p{Lo}][\p{L}'’.\-]{0,14}\s*[:：])/u;
/* Hanya "=" dan "→". Titik dua SENGAJA tidak ikut: baris dialog modul ditulis
   "Ana: Hola, ¿qué tal?" — memenggalnya di titik dua menyisakan nama tokohnya
   saja. Baris "harfiah: …" tetap tersaring oleh penjagaan bahasa Indonesia. */
const PISAH_ARTI = /\s*(?:=|→)\s*/;

/* [ebook-tts-tanpa-penutur-v1] Nama penutur di kepala baris dialog ("たなか:",
   "Ana:") BUKAN bagian kalimatnya. Dulu ikut terbaca, jadi tiap kali siswa
   memutar baris dialog ia mendengar nama tokohnya dulu — dan di modul Jepang
   namanya malah ikut terserap jadi "kata" yang diketuk.

   Yang dibuang cuma kepala baris yang benar-benar berbentuk penutur: satu-dua
   patah kata pendek tanpa spasi berlebih, ditutup titik dua, dan masih ada
   kalimat yang tersisa sesudahnya. Baris penjelasan seperti "Bunyinya: です
   dibaca des" ikut terpangkas kepalanya — itu justru benar, kepalanya bahasa
   Indonesia. */
const BUANG_PENUTUR = /^\s*[^\s:：\d][^\s:：]{0,15}(?:\s[^\s:：]{1,16})?\s*[:：]\s*(?=\S)/u;

/** Nama penutur baris dialog, tanpa titik duanya. "" = barisnya bukan dialog. */
export function penuturBaris(baris: string): string {
  const s = String(baris || "").replace(BUANG_NOMOR_DIALOG, "").replace(BUANG_NOMOR, "");
  const m = s.match(BUANG_PENUTUR);
  if (!m) return "";
  return m[0].replace(/[:：]\s*$/u, "").trim();
}

/**
 * [ebook-tts-kalimat-v1] Satu baris halaman → kalimat bahasa target yang layak
 * diputar. Kosong = tak ada yang bisa dibunyikan dari baris itu.
 */
export function kalimatTarget(baris: string, kode: string): string {
  let s = String(baris || "")
    .replace(BUANG_KURUNG, " ")
    .replace(BUANG_NOMOR_DIALOG, "")
    .replace(BUANG_NOMOR, "")
    .replace(BUANG_PENUTUR, "");   // [ebook-tts-tanpa-penutur-v1]
  // "casa = rumah" → yang dibunyikan sisi KIRI. Di modul bahasa, sisi kanan
  // "=" praktis selalu kolom arti; kalimat yang benar-benar memuat tanda sama
  // dengan tidak ada di materi A1.
  const bagian = s.split(PISAH_ARTI).map((x) => x.trim()).filter(Boolean);
  if (bagian.length > 1) s = bagian[0];
  s = s.replace(/\s{2,}/g, " ").trim();
  if (s.length < 2) return "";
  if (barisTerjemahan(s, kode)) return "";
  return s.slice(0, 400);
}

/** Potongan ini kelihatan bahasa Indonesia (baris terjemahan), bukan bahasa target? */
export function barisTerjemahan(teks: string, kode: string): boolean {
  if (kode === "id" || kode === "ms") return false; // modul BIPA/Melayu: itu justru bahasa targetnya
  return klausaIndonesia(teks, kode);
}

/* ── pemutaran ─────────────────────────────────────────────────────────────
   [ebook-tts-data-url-v2] Audionya dipasang sebagai **data: URL**, bukan
   objectURL dari Blob — dan itulah sebabnya versi pertama diam total di Safari
   walau /api/tts membalas 200 dan cache-nya terisi rapi.

   Dua jebakan Safari yang kena sekaligus:
     1. `blob:` di elemen <audio>. Safari memuat media lewat permintaan yang
        mendukung byte-range; sumber blob tak melayani itu, jadi elemennya
        menggantung di readyState 0 — tanpa galat, tanpa bunyi.
     2. `audio.currentTime = 0` tepat setelah `src` diganti. Di WebKit itu
        melempar InvalidStateError selama readyState masih HAVE_NOTHING, dan
        lemparan itu terjadi SEBELUM play() sempat dipanggil.

   Jalur yang dipakai sekarang persis jalur `speakText` Watch and Learn (yang
   memang berbunyi di Safari yang sama): base64 → data: URL → play(). Cache pun
   menyimpan base64, bukan Blob, supaya tak ada objectURL sama sekali.

   SATU elemen Audio dipakai berulang, dan sengaja "dibuka kuncinya" lewat
   ketukan pertama siswa: iOS Safari cuma mengizinkan play() yang lahir dari
   gerakan pengguna, sementara ketukan kata kita selalu melewati setidaknya satu
   await (cache/jaringan). Elemen yang SUDAH pernah bunyi di dalam gesture tetap
   boleh diputar sesudahnya — itulah celah yang dipakai di sini. */
const SENYAP = "data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/** Tag BCP-47 untuk suara bawaan browser — jaring terakhir kalau Chirp gagal. */
const SUARA_BROWSER: Record<string, string> = {
  es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-PT", nl: "nl-NL",
  ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", ru: "ru-RU", ar: "ar-SA", hi: "hi-IN",
  th: "th-TH", vi: "vi-VN", tr: "tr-TR", en: "en-US", id: "id-ID", ms: "ms-MY",
  da: "da-DK", sv: "sv-SE", no: "nb-NO", fi: "fi-FI", pl: "pl-PL", cs: "cs-CZ",
  el: "el-GR", he: "he-IL", uk: "uk-UA", ro: "ro-RO", hu: "hu-HU",
};

let audio: HTMLAudioElement | null = null;
let seq = 0;

/** Dipanggil dari ketukan pertama di reader — lihat catatan SENYAP di atas. */
export function bukaKunciAudio() {
  if (typeof window === "undefined" || audio) return;
  audio = new Audio(SENYAP);
  audio.volume = 0;
  void audio.play().catch(() => {}).then(() => {
    if (audio) audio.volume = 1;
  });
}

export function hentikanEbookTts() {
  seq++;
  if (audio) { try { audio.pause(); } catch { /* diam */ } }
  if (typeof window !== "undefined") {
    try { window.speechSynthesis?.cancel(); } catch { /* diam */ }
  }
}

/* Suara bawaan browser. Mutunya jauh di bawah Chirp — ini bukan pengganti,
   melainkan supaya ketukan tetap MENGELUARKAN bunyi waktu jalur utamanya
   bermasalah. Diam total tak terbedakan dari tombol rusak. */
function ucapkanBrowser(teks: string, kode: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(teks);
    u.lang = SUARA_BROWSER[kode] ?? SUARA_BROWSER[kode.split("-")[0]] ?? "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    /* sudah sejauh ini — biarkan diam */
  }
}

async function mainkan(base64: string): Promise<boolean> {
  if (!audio) audio = new Audio();
  try { audio.pause(); } catch { /* diam */ }
  try { window.speechSynthesis?.cancel(); } catch { /* diam */ }
  audio.volume = 1;
  // ⚠️ JANGAN menyetel currentTime di sini — lihat jebakan (2) di atas.
  audio.src = `data:audio/mp3;base64,${base64}`;
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

/* ── cache ─────────────────────────────────────────────────────────────────── */
const memori = new Map<string, string>(); // `${kode}|${teks}` → base64 mp3
const NAMA_CACHE = "linguo-tts-v1";
const alamat = (kode: string, teks: string) => `/__tts/${kode}/${encodeURIComponent(teks)}`;

async function dariCacheTetap(kode: string, teks: string): Promise<string | null> {
  try {
    if (typeof caches === "undefined") return null;
    const c = await caches.open(NAMA_CACHE);
    const r = await c.match(alamat(kode, teks));
    if (!r) return null;
    const isi = (await r.text()).trim();
    // Entri versi lama menyimpan Blob mp3, bukan base64 — kenali dari isinya
    // (base64 tak pernah memuat karakter di luar abjad base64) lalu buang.
    if (!isi || !/^[A-Za-z0-9+/=\s]+$/.test(isi.slice(0, 64))) {
      await c.delete(alamat(kode, teks)).catch(() => {});
      return null;
    }
    return isi;
  } catch {
    return null; // penyimpanan penuh / mode privat — bukan alasan gagal bunyi
  }
}

async function keCacheTetap(kode: string, teks: string, base64: string) {
  try {
    if (typeof caches === "undefined") return;
    const c = await caches.open(NAMA_CACHE);
    await c.put(alamat(kode, teks), new Response(base64, { headers: { "Content-Type": "text/plain" } }));
  } catch {
    /* diam */
  }
}

/* ── jalur cepat: langsung ke Supabase Storage ─────────────────────────────
   [tts-cepat-v1] Diukur di produksi 21 Agu 2026: ketukan yang mp3-nya SUDAH ada
   di cache bersama tetap menunggu 0,9–2,9 detik (dan 7–20 detik waktu kontainer
   Vercel dingin). Yang lambat bukan Chirp maupun Storage — melainkan
   membangunkan fungsi serverless-nya: permintaan yang langsung dibalas 400
   "text kosong" pun makan 0,6–1,3 detik.

   Karena nama berkas di bucket `tts-cache` deterministik — sha256("voice|teks")
   — klien bisa menghitungnya sendiri dan mengambil mp3-nya LANGSUNG dari CDN
   Storage, tanpa menyentuh fungsi apa pun. Yang tak ada di sana baru lewat
   /api/tts (yang memang harus menyintesis).

   Syaratnya bucket `tts-cache` publik. Selama masih privat, Storage membalas
   `NoSuchBucket` — itu dikenali sekali lalu jalur ini dimatikan untuk sesi ini,
   jadi tak ada permintaan mubazir dan tak ada yang rusak. */
const ASAL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let cdnMati = false;

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** ArrayBuffer → base64 (dipotong-potong: `String.fromCharCode(...)` sekaligus
 *  bisa melimpahi tumpukan pada mp3 kalimat panjang). */
function keBase64(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

async function dariCdn(kode: string, teks: string): Promise<string | null> {
  if (cdnMati || !ASAL_SUPABASE) return null;
  const voice = namaVoice(kode);
  if (!voice || typeof crypto === "undefined" || !crypto.subtle) return null;
  // Kunci dihitung dari teks yang SUDAH dibersihkan seperti di server —
  // bedanya seujung kuku saja sudah cukup membuat semuanya jatuh ke jalur lambat.
  const bersih = bersihkanTeksTts(teks).slice(0, BATAS_TEKS_TTS);
  if (!bersih) return null;
  try {
    const jalur = jalurCacheTts(voice, await sha256Hex(`${voice}|${bersih}`));
    const res = await fetch(
      `${ASAL_SUPABASE}/storage/v1/object/public/${BUCKET_TTS}/${jalur}`,
      { cache: "force-cache" }
    );
    if (!res.ok) {
      // Bucket masih privat → percuma dicoba lagi sepanjang sesi ini.
      const pesan = await res.text().catch(() => "");
      if (/NoSuchBucket|Bucket not found/i.test(pesan)) cdnMati = true;
      return null;
    }
    return keBase64(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/* Ketukan bisa mendahului klik (prasiapan) dan siswa juga suka mengetuk kata
   yang sama dua kali cepat: tanpa daftar ini, satu kata bisa memicu dua
   permintaan jaringan sekaligus. */
const sedang = new Map<string, Promise<string | null>>();

/**
 * base64 mp3 untuk sepotong teks — memori → Cache API → CDN Storage → /api/tts.
 * @param bolehSintesis false = berhenti sebelum /api/tts. Dipakai prasiapan:
 *   ketukan yang ternyata cuma geseran halaman tak boleh menagih Chirp.
 */
function ambilAudio(kode: string, teks: string, bolehSintesis: boolean): Promise<string | null> {
  const kunci = `${kode}|${teks}`;
  const ada = memori.get(kunci);
  if (ada) return Promise.resolve(ada);
  const jalan = sedang.get(kunci);
  if (jalan) return jalan;

  const kerja = (async () => {
    const tersimpan = await dariCacheTetap(kode, teks);
    if (tersimpan) { memori.set(kunci, tersimpan); return tersimpan; }

    const cdn = await dariCdn(kode, teks);
    if (cdn) {
      memori.set(kunci, cdn);
      void keCacheTetap(kode, teks, cdn);
      return cdn;
    }
    if (!bolehSintesis) return null;

    // GET, bukan POST: balasannya boleh disimpan CDN Vercel + cache browser
    // (lihat header abadi di /api/tts) — POST tak pernah disimpan keduanya.
    const alamatApi = `/api/tts?text=${encodeURIComponent(teks)}&lang=${encodeURIComponent(kode)}`;
    const res = await fetch(alamatApi);
    if (!res.ok) return null;
    const { audioContent } = await res.json();
    if (!audioContent) return null;
    memori.set(kunci, audioContent);
    void keCacheTetap(kode, teks, audioContent);
    return audioContent as string;
  })().catch(() => null).finally(() => { sedang.delete(kunci); });

  sedang.set(kunci, kerja);
  return kerja;
}

/** Panjang teks yang dipakai sebagai kunci — sama di prasiapan & pemutaran. */
const rapikan = (t: string) => String(t || "").trim().slice(0, BATAS_TEKS_TTS);

/**
 * [tts-prasiap-v1] Siapkan audio sebuah kata TANPA membunyikannya — dipanggil
 * saat jari baru menyentuh halaman, jadi waktu klik-nya tiba mp3-nya biasanya
 * sudah di memori. Sengaja TIDAK menyintesis: sentuhan yang berakhir jadi
 * geseran halaman tak boleh menambah tagihan Chirp.
 */
export function siapkanEbook(teksMentah: string, kode: string) {
  const teks = rapikan(teksMentah);
  if (!teks || !bisaDibunyikan(kode)) return;
  void ambilAudio(kode, teks, false);
}

export type HasilUcap = "ok" | "gagal" | "dilewati";

/**
 * Bunyikan potongan teks bahasa target.
 * @returns "dilewati" kalau memang tak layak dibunyikan (bukan galat).
 */
export async function ucapkanEbook(teksMentah: string, kode: string): Promise<HasilUcap> {
  const teks = rapikan(teksMentah);
  if (!teks || !bisaDibunyikan(kode)) return "dilewati";

  const saya = ++seq;
  const putar = async (b64: string) => {
    // Siswa sudah mengetuk kata lain sementara ini menunggu jaringan.
    if (saya !== seq) return "ok" as const;
    if (await mainkan(b64)) return "ok" as const;
    ucapkanBrowser(teks, kode);
    return "gagal" as const;
  };

  const ada = memori.get(`${kode}|${teks}`);
  if (ada) return putar(ada);

  const b64 = await ambilAudio(kode, teks, true);
  if (!b64) { ucapkanBrowser(teks, kode); return "gagal"; }
  return putar(b64);
}
