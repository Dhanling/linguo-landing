/* [ebook-tts-ketuk-kata-v1] Pelafalan kata/kalimat yang diketuk di reader e-book.
 *
 * Modul mandiri Linguo ditulis untuk dibaca SENDIRI: tidak ada pengajar di
 * sebelah siswa yang bisa ditanya "ini bunyinya bagaimana". Ketuk katanya di
 * halaman, suaranya keluar — itu saja lubang yang ditutup fitur ini.
 *
 * Suaranya lewat /api/tts (Google Chirp 3 HD; Azure Neural untuk bahasa yang
 * Google tak punya suaranya — lihat AZURE_VOICES di ttsVoice.ts), rute yang
 * sama dengan TTS kuis & Watch and Learn.
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

/** Bahasa ini punya suara di /api/tts (Chirp 3 HD atau Azure Neural)? Beda
 *  dengan `bisaTts` di kuis: di sini Indonesia IKUT, karena modul BIPA memang
 *  bahasa targetnya Indonesia. */
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
  abjad absen abu acak acara ada adalah adanya adik aduh agak agar age agus agustus air
  aja ajari akan akhir akhirnya akibat aksara aksaranya aksen aku akuntan ala alamat
  alasan alasannya alat alergi alfabet alhamdulillah alih alkohol alun alurnya ambang
  ambil ampun anak anda aneh anggota anggukan anggur angin angka angkanya angkat anime
  answer antara antaranya antrean antusias apa apakah apartemen api aplikasi apotek
  apoteknya apples arah arahkan arti artinya asalmu asing aslinya asyik atas atasnya atau
  aturan aturannya australia australian awal awet ayah ayahku ayahmu ayam ayamnya ayo
  ayudarme bab baby baca bacaan bacalah bacamu bacanya bad badai badan badanmu badannya
  bagaimana bagi bagian bagiannya bagus bahan bahannya bahasa bahasanya bahwa baik baiklah
  baiknya baju bakal baku balai balik balikkan bandara bandon banget bangkit bangsa bangun
  bank banknya bantu bantuan bantuannya bantuin banyak bapak barang barat bareng baris
  barisan baru barunya basa basah basi basket batasnya bawa bawah bawang bayangan
  bayangkan bayar bayarnya bayi beban bebas beberapa bedakan bedanya beddo begitu bekas
  bekerja beku belajar belakang belakangan belakangnya belanja belanjaan belas beli belok
  belokkan belong belongs benar benci benda bendanya bentuk bentuknya benua berada
  berakhir beraktivitas berangin berangkat berapa berarti berasal berat berawan berbagi
  berbahasa berbalik berbaring berbasa berbeda berbelanja berbelok berbentuk berbicara
  berbuah bercampur bercerai bercerita berd berdampingan berdatangan berdekatan
  berdempetan berdiam berdiri berdoa berdua bereaksi berenang berfungsi berganti
  bergantian bergantung bergeser berguna berharap berharga berhasil berhenti berhubungan
  beri berikut berisi berisik beristirahat berita berjalan berjanji berjenjangnya berkat
  berkata berkebun berkelakuan berkelompok berkembang berkenalan berlaku berlangsung
  berlari berlatih berlebihan berlima berlin bermakna bermuara bermunculan bernama
  berolahraga berpakaian berpamitan berpasangan berpindah berpola bersalju bersama
  bersamamu bersandar bersaudara berseberangan bersejarah berselancar berselang berselera
  bersiap bersih bersihin bertahan bertahun bertambah bertanya bertiga bertukar bertumpu
  berubah berulang berumur berupa berurutan berusaha berwarna besar besarnya beserta besok
  betapa betul biar biarkan biasa biasanya biaya biayanya bicara bicarakan bicaramu
  bicaranya bikin bingung bioskop birthday bisa bisakah blues boleh bombai bonnya boot
  bosan boys brazilian britania bru buah buat buatkan buatmu budaya buddha bue bujur buk
  buka bukan bukanya buktinya buku bukumu bulan bunga bungkukan bungkukannya bungkus
  bunyikan bunyinya buru buruk bus butuh cabai campurannya canggung cans cansados cantik
  capek cara caranya careful cari carlos caros catatan cefr celana cepat cerah cerdas
  ceria cerita ceritakan ceritamu cermat cerrados chat cina cinta cirinya citys ciuman
  clouds coba cobalah cocok cokelat coming contoh conversation cooks coretan cuaca
  cuacanya cuarta cuci cucu cuestan cukup cuma dadar daging dagingnya dah dalam dalamnya
  dan dapur dapurnya dari daripada darurat dasarnya dashboard datang dekat dekatnya
  delapan demi dengan dengar dengarkan depan depanmu depannya departemen derajat deretan
  desember detektif detik dewi dia diabaikan diadakan diajak dialog dialognya diam diambil
  dian dianggap diatur dibaca dibalas dibalik dibangun dibatalkan dibawa dibedah dibedakan
  dibeli diberi diberikan dibicarakan dibuat dibuka dibunyikan dibutuhkan dicari dicetak
  dicoba didahului didahulukan dieja difficult digandeng digantikan digit digitalmu
  dihafal dihangatkan diharapkan dihormati diikuti diingat diinginkan dijaga dijanjikan
  dijawab dijelaskan dikejar dikerjakan dilahirkan dilatih diletakkan dilewati diliburkan
  dilihat dilunakkan dilupakan dimiliki diminta dimuat dinding dingin dipadatkan dipahami
  dipakainya dipaksa dipaksakan dipanggil dipasangi dipastikan dipegang dipelajari
  diperhalus diperiksa dipikir dirancang dirangkai direncanakan diri dirimu dirinya
  disambung disambut disarankan disebut disentuh diseret disertai disesuaikan disingkat
  diskon diskonnya disorot disuruh disusun ditambah ditambahkan ditanya ditanyakan ditawar
  ditebak ditekankan diterjemahkan ditinggalkan ditukar dituliskan ditumpuk ditunjukkan
  dituntut diturunkan ditutup diubah diucapkan diuji diulang diulangi diurutkan dokter
  dompet dong dosen drama drives dua duanya duda duduk duermen dugaanmu dulu dunia durasi
  easy efektif eggs ejaan ejaannya elang empat enak enaknya enam episode era eropa
  fahrenheit fakta februari feminin film filmnya finishes fondasi fonetik formulir fotokan
  fourty france frasa frekuensi french fuera furigana gagal galak gambarkan gampang
  gangguan ganti gantilah garis gaun gedung gelombang gerakan gerbang gereja german
  germany giliran gim gimana gitar gitarnya glosarium goes golongan goreng goresan gram
  granada guapas gula gunanya gunung guru guruh gurumu gurunya habis habiskan hadiah hafal
  hafalan hafalkan hal halaman halo halte haltenya halus ham hampir hanya harga harganya
  hari harian harianmu harimu harinya harus hasilnya hasrat hates hati heavy hebat hei
  hewan hiasan hidangan hidup hidupku hidupmu hijau hijos hilang hilangnya hiragana hitam
  hitung hitungan hobi hormat hou hujan hurufnya ibu ibuku ibumu icoca ide identitas ielts
  ikan ikat ikut ikuti indah india indonesia indonesiamu indonesianya industri info
  informations ingat ingatan inggris inggrisnya ingin inginkan ini inilah insinyur
  interaktif internasional interogasi inti ipar iri isi isian isinya iskul istadi istilah
  istimewa istirahat istri istrinya itu itulah iya izin jabat jadi jadwal jadwalmu jaga
  jago jaket jalan jalannya jam jamak jamnya janda jangan janggal janggalnya janjian
  januari jarak jaraknya jarang jaringan jatuh jauh jawab jawabanmu jawabannya jembatan
  jendela jepang jepangnya jeruk jii jins jlpt juga jujur juli jumat jumlahnya jumpa juni
  juru jus justru juta kabar kabari kabarmu kabarnya kabut kadang kafe kaget kah kain
  kaisar kaiwa kakak kakaknya kakarimashita kakek kaki kalau kali kalimat kalimatmu
  kalimatnya kalinya kamar kamarmu kamarnya kami kamis kampung kampus kamu kamus kamusnya
  kanada kanan kanannya kandung kanji kantin kantong kantor kantornya kapas karena kartu
  karyawan kasih kasihan kasir kata katakana katanya katedral katedralnya katun kayaknya
  kayu keadaan kebangsaan kebangsaannya kebanyakan kebenaran keberangkatan kebesaran
  kebetulan kebiasaan kebutuhan kebutuhanmu kecepatan kecil kecilnya kecuali kedatangan
  kedekatan kedengaran kedengarannya kedokteran kedua keduanya keempat keempatnya keenam
  kegiatannya kehabisan kehilangan keigo keinginan kejadian keju kekecilan kekurangan
  kelahiranmu kelas kelasnya kelelahan kelihatan kelihatannya kelima keliru kelompok
  keluar keluarga keluargaku kemajuan kemampuan kemampuanmu kemarau kemarin kembali
  kembalian kembaliannya kembalilah kembang kemeja kemejanya kemewahan kemewahanku
  kemudian kemungkinan kenal kenalan kenali kenalkan kenapa kendaraan kentang kepada
  kepadamu kepala kepalamu kepemilikan kepingan keponakan keponakanmu kerangka kerangkanya
  keras kereta keretanya kering kerja kerjaan kerjakan kerjamu kerjanya kesalahan kesan
  kesempatan kesenangan kesepakatan kesepuluh kesepuluhnya kesopanannya kesukaan ketat
  ketemu ketemuan keterangan ketergesaan keterlambatan ketersediaan ketidaksopanan ketiga
  ketiganya ketinggalan ketujuhnya ketuk ketukannya keturunannya keunggulan keys khas
  khawatir khusus kini kira kiri kita klasik knowing kok kolom kolombia koma komputer
  konkretnya konteks kopi korean kos kosakata kosakatanya kosong kota kotak kotamu kotanya
  kotor krim kuasai kuat kuil kuliah kunci kuning kurang kurs kursi kurung kurus label
  lada lagi lagu lahir lain lajang laki lakiku lakimu lakukan lalu lama lambang lambat
  lampau lampaunya lampu lancar langitnya langkah langsung lanjutkan lantai lapar laptop
  larangan largas lari larut latar latihan latihannya latin laut lawan layak layar learn
  lebih lega lekat lelah lelaki lelucon lembap lembar lembaran lembut lengkapi lengkapnya
  lengkungnya leo letak letaknya level levelmu lewat lewati lezat lho libro libur liburan
  lift lihat lihatlah liis liked lima lingkaran lingkarannya linguo lintas lirik listrik
  liter lives loket longgar lorong luang luar luas lucu lumayan lupakan lurus lusa lusin
  maaf maafkan macet mahal mahasiswa mahir main mainkan maju maka makan makanan makanannya
  makanya makhluk makin maksud maksudnya malam malamnya malang mama mampir mana mandarin
  mandek mandi manis mantap mantel marah maret mari masak masakan masalah masih masing
  masjid maskulin masuk matamu matang matte mau maupun mawar mayores means mei meja mejaku
  melainkan melakukan melamar melampaukan melanggar melanjutkan melatih melayu melebur
  meleburkan melelahkan melengkapi melepaskannya meleset meletakkan melewatkan melihat
  melihatnya melirik melompati melupakan memahami memahamimu memainkan memakai memakan
  memaksamu memancing memandikan memanggil memangnya memasak memasang memastikan membaca
  membacanya membagi membaik membalik membandingkan membangun membantu membaringkan
  membawa membawakan membayangkan membayar membedakan membedakannya membeku membela
  membeli membelinya membentak membentuk memberi memberikannya membersihkan membetulkan
  membiarkan membiarkannya membicarakan membingungkan membuang membuat membuatnya membuka
  membulatkan membungkuk membunyikan membutuhkan memecahkan memegang memeriksa memesan
  memilih meminta memisahkan memotong memotret memperbaiki mempercepatmu memperhitungkan
  memperkenalkan memperlihatkan mempersembahkan mempertimbangkan memuat memulai memutus
  menabung menahan menaikkan menakjubkan menakutkan menambahkan menandakan menang
  menangkap menanyakan menanyakannya menari menarik menaruh menawar menawarkan mencari
  mencarinya menceritakan mencicipi mencintai mencoba mencuci mendaftar mendapat mendatar
  mendekatimu mendengar mendengarkan mendung menebak menekankan menelepon menemani
  menempel menempelkan menemukan menerima menerjemahkannya menerus menetap mengajak
  mengajar mengakhiri mengaku mengalahkan mengalihkan mengambil mengandung menganggapnya
  mengangkat mengantar mengapa mengatakan mengatur mengecilkan mengeja mengejanya mengejar
  mengelilingi mengeluarkan mengembalikan mengenai mengenal mengenali mengenalinya
  mengendarai mengeras mengerjakan mengerjakannya mengerti mengetik mengetuk
  menggabungkannya menggambar menggambarkan mengganti menggesernya menggosok menggurui
  menghadang menghafal menghafalnya menghalangi menghemat menghilang menghindari
  menghitung menghitungnya menghujan mengikutinya mengincar mengingat mengingatnya
  menginginkan mengintrogasi mengira mengirim mengisi mengobrol menguap mengubahnya
  mengucapkan mengucapkannya mengulang mengunci mengunjungi mengusir mengusulkan menikah
  menikmati menilai meninggalkan menipu menit menitnya menjadi menjaga menjatuhkan
  menjawab menjebak menjegal menjelaskan menjual menolak menolong menonton menulis
  menulisnya menumpuk menunggu menunjuk menunjukkan menuntaskan menuntut menunya menurut
  menurutmu menutup menutupi menyakiti menyalin menyamarkan menyambung menyambungnya
  menyambut menyampaikan menyangkal menyanyi menyapa menyatakan menyeberang menyebut
  menyebutkan menyebutkannya menyebutnya menyediakan menyelamatkan menyelesaikan
  menyelesaikannya menyenangkan menyepakati menyerah menyertai menyesali menyesuaikan
  menyetir menyewa menyiapkan menyiapkanmu menyimpan menyinggung menyisakan menyuruhmu
  menyusun mepet merah merangkai merangkum merasa mereka merekomendasikan merendah
  merespons meriah merica mertua mesinnya meski mewah milik milikku mimasen minggu
  mingguan minimal minimarket minta minum minuman minumnya minyak mobil modern modul mohon
  momen moon mrs muda mudah muka mula mulai mulailah mulainya mulut mulutmu mulutnya
  muncul mundur mungkin murah murid museos museumnya musik musim mutlak nadanya naik
  naikkan naiklah nama namamu namanya namun nanti narimashita nasi nasional negara
  negaramu negaranya negatif negeri nenek nenekku neraka netral ngapa ngapain ngobrol nhk
  nicer nihonjin nilai nilainya node nol nomimasen nomor nongkrong nonton nou novel
  numbers nyaman nyasar nyata nyetir nyonya objeknya obral oke oktober oleh orang orangnya
  oranye osaka otak otomatis outside oyoide pabrik pacar pada padahal padanan padanannya
  pagi paham pajak pak pakai pakaian paman pamanku panas panggang panggilan panik panjang
  panjangnya pantai pantainya pantas papan paparan paraguas parah paris partikel
  partikelnya paruh pas pasang pasangan pasangkan pasarnya pasif pasmo pasnya paspor pasti
  patah patokan payung pecahannya pedas pedasnya pegawai pekan pekanmu pekannya pekerjaan
  pekerjaanmu pelafalannya pelajar pelajaran pelajarannya pelajari pelaku pelan pelayan
  peleburan pelemah pelindung pemahaman pemakaian pemakaiannya pemandian pembaca
  pembanding pembeda pembelajar pembeli pembicara pemilik pemrogram pemula penanda
  penanggalan penanya penasaran pencuci pendaftaran pendapat pendek penderitaan pengajar
  pengajarnya pengalamanmu pengandaian pengantar pengantaran pengecualian pengenal
  pengganti penggolongnya penghapus penghasilan pengin penguat pengucapan pengulangan
  pengusaha penilaian penilaiannya penjaga penjelasan penjelasannya penopang pensil
  pentingnya penuh penumpang penutur penuturnya penyambung penyambungnya penyebab
  penyebabnya per perabot peran perasaan perasaanmu perawat perawatan perbaikan perbaiki
  perbedaan perbedaannya perbelanjaan percakapan percakapannya percobaan perempat
  perempuan perempuanku perempuanmu pergantian pergaulan pergi perhatikan perih periksa
  perintah peristiwa perjalanan perjalanannya perkenalan perkumpulan perlakuan perlu
  permintaan permisi pernah pernikahan perpisahan perpustakaan persegi persiapan persis
  pertama pertamamu pertamanya pertanyaan pertanyaannya pertemuan perubahan perusahaan
  perut pesan pesanan pesanannya pesawat peserta pesta peta petani petir petugas
  petugasnya petunjuk petunjuknya pierre pihak pikir pilih pilihannya pindah pinggang
  pinjam pintar pintas pintu pipi pirang pisang plastik plays podcast poin pojok pokok
  pola polanya polisi ponsel ponselmu porsi portugis positif posnya potong potongan
  praktis praktisnya prihatin primas privat private pro produktif profesi prosesnya pueden
  pujian pukul pula pulang pulangnya pulpen puluh puluhan pun punggung punya punyaku
  punyamu pusat putih questions quinto raazh rabu rahmat raining rajin rak raksasa ramah
  ramai rambut rambutnya rangka rangkaian rangkuman ranjang rantainya rapi rapikan rasa
  rata ratus ratusan reads receh reguler reiwa rekomendasikan rekomendasinya rencana
  rencanamu rencananya rendah repot reputasi resmi restoran restorannya ribu ribuan riid
  rina ringkasan risiko rok roti ruang ruangan rubios rujukan rumah rumahku rumahmu
  rumpang rumusnya runtut rusak rutin rutinitas rutinitasmu sabtu sah sakit sakitnya saku
  salah salam salat salin saling salju sama sambil sampai sampaikan samuku sana sanalah
  sananya sandangnya sangat sanggup sangkar santap santo sarapan sari satu satunya saudara
  saya sayang sayur sayuran sebabnya sebagai sebagian sebaiknya sebaliknya sebar sebeda
  sebelah sebelahnya sebelas sebelum sebenarnya sebentar seberang seberangi seberapa
  sebotol sebuah sebulan sebut sebutan sebutkan secangkir secara sedang sederhana sediakan
  sedih sedikit sedingin segalanya segelas segera segitu sehari seharian sehat sehingga
  sejak sejarah sejenak sejuta sekadar sekaleng sekali sekaligus sekalipun sekarang
  sekelas sekelasnya seketika sekian sekilas sekilo sekilonya sekitar sekitarmu sekitarnya
  sekolah sekolahnya selain selalu selama selamat selancar selanjutnya selasa selatan
  selesai seling seluruh seluruhnya selusin semacamnya semangat semata sembarang
  sembarangan sembilan sembuh semeja semester seminggu semoga sempat sempit sempurna semua
  semuanya senang sendiri sendirian sendirinya sengaja senggang seni senin senti seorang
  seoul sepak sepanjang separuh sepasang sepatu sepeda sepenuhnya seperempat sepertinya
  sepi sepotong sepuh sepuluh sepupu serangan seratus serialmu seribu serikat sering
  serius serta sertifikat seru servis sesekali seseorang sesuai sesuaikan sesuatu
  sesudahnya setahun setara setelah setengah seterusnya setiap shining shinto siang
  siangan siap siapkan siaran sibuk sifatnya sih silakan singapura singkat sini sinilah
  sip sisanya sisi sisipkan sistem siswa siti siting sitting situ situasi situlah sixty
  skor sleeping smaller snows soal soalnya soda sopan sopir sor sorenya spanyol spanyolmu
  spanyolnya speaks spreadsheet starts stasiun stasiunnya status stopped stroberi strong
  struk struknya studied suami suara suarakan suaranya suatu sudah sudut suica suka suku
  sulit sulung sumpit sungai sungguh sungguhan supaya susu susun susunan susunannya
  suwatte swalayan swasta syarat syukurlah tabel tabelnya tadi tagihan tahu tahun
  tahunannya takarannya takarir taksi takut tam taman tambahan tambahkan tampak tampan
  tamu tanah tandanya tangan tanganku tanganmu tangga tanggal tanggalnya tanggapan
  tanjakan tanpa tante tanyakan tapi taruhannya tas tata tatap teachers tebak ted tegak
  tegas teh tekanan tekanannya teks tekun tel telanjang telat telepon teleponku teleponmu
  televisi telinga telingamu telkom teman temanku temannya tempat tempati tempo temu temui
  tenang tengah tengahnya tenggat tenses tentang tentara tenteram tentu teorinya tepat
  terakhir terasa teratur terbaca terbaik terbalik terbang terbangun terbatas terbiasa
  terbuka terburu tercepat tercer tercera terdengar terendah tergagap tergantung terhadap
  terhitung terhormat teriakan terik terikat terima terjadi terjadwal terjemahan
  terjemahannya terjemahkan terkenal terlalu terlambat terlanjur termasuk termudah
  ternyata terpesona terpikir terpisah terpotong tersedia tersendat tersering tersesat
  tersimpan tersulit tertangkap tertawa tertera tertolong tertukar tertutup terus tetangga
  tetangganya tetap tetapi tetesan thoot tiap tiba tid tidak tidur tidurnya tiga tiganya
  tiketnya timur tinggal tinggalmu tinggalnya tinggi tingkat tip tirai tiru titik titiknya
  toefl toko tolong tombol tombolnya tooo topi total tradisional traktir transaksi
  transportasi tua tuaku tuamu tuan tugas tugasnya tujuanmu tujuannya tujuh tukang tulang
  tulis tulisan tulisanmu tulisannya tuliskan tulus tunai tunangan tunggal tunggu tunjuk
  tunjukkan tunjuknya tuntas turis turun turunannya turut tutup ubah ucapan ucapkan udara
  ujiannya ukuran ukurannya ulang ulangi umumnya umur umurmu umurnya undangan ungkapan
  ungu unit unitnya universitas untuk urutan urutannya usah usaha utama utara utuh varian
  veinticuatro veis versi versimu video visitan visited vokalnya vuelven wah wajar wajib
  waktumu walau wants warna warnanya wartawan warung wash wawancara weerkt willn wind
  wisata wortel writing yah yaitu yang years yokute yuko zii
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

/* [ebook-jaga-bahasa-id-v3] Perasan ULANG dari 96 modul (17 Sep 2026) — hanya
   kata yang belum ada di dua daftar di atas. LEKSIKON_ID diperas waktu
   modulnya masih segelintir, jadi prosa modul new edition penuh kata Indonesia
   yang tak dikenalnya — "Kalimat *penyelamat* nomor satu" di Polish 101 — dan
   kata tak dikenal dianggap bahasa target, lalu dibunyikan berlogat Polandia.
   Syarat masuknya lebih ketat dari perasan pertama: tercetak di prosa ≥ 2
   modul, dan TAK PERNAH muncul di baris dialog/kosakata/judul target modul
   mana pun (selain Sunda) — lihat scripts/leksikon-id-ebook.mjs. */
const LEKSIKON_ID_V3 = `
  abad abadi abaikan abangnya abjadnya above absorb acaranya aceh acnya acuan adab adabnya
  adakan adaptasi adapun adat adatnya adegan adem adikku adikmu adiknya adil adit
  administrasi administrasinya adobonya adu aduk afghanistan aflyste afrika agaknya agama
  agen agennya agensi agresif agrikultura agung ahad ahli aib airnya ajaib ajak ajar
  ajarin ajarkan ajukan akademis akal akanlah akarnya akhiran akhirannya akhiri aksenmu
  aksennya akses akta aktifnya aktivitas aktor aktris aktrisnya akulah akun akuntansi akur
  akurat akus alamatmu alamatnya alami alarmku alarmnya alasanmu alatnya album alergimu
  alipay alive alkitab allah alternatif alternatifnya alunnya alur alvarez amal amandel
  amandelnya amankan amannya amati ambilkan ambillah ambulans amiche amman amplop ampuh
  amusons anakku anakmu anaknya analis analisis analog andai andaian andaikan andal
  andalan andalkan andat andavamo andremmo andremo anehnya anggap anggaran anggarannya
  angguk anggurnya anginnya angkamu angkatan angkut angkutan angsa angsur anisa anjingnya
  anjlok anjuran anonim antar antarkan antarmuka antarteman antei antibiotik antre
  antreannya apaan apabila apakan apanya apartemenku apartemenmu apartemennya apelnya
  apinya aplikasinya apostrof apoteker apotekernya appeared appears arab arabmu arabnya
  arahan arahmu arahnya arak area argo argonya argumen argumenmu arithmetic arloji aroma
  arrangements arrivent arrivi arsip arsipnya arsitek arsitektur artikelmu artikelnya arus
  asal asalan asalkan asalnya asap asas asean asisten asli asmara aspek aspeknya asrama
  assimil astaga asumsi asuransi asuransinya atap atapnya atasanmu atasannya atasmu atik
  atlantik attach atur audionya aurora austronesia avviser awalan awalnya awas awasi
  ayahnya ayat babak babi babinya babnya bacain bacakan bacon badanku bagaimanapun bagan
  bagasi bagasinya bagianmu bagikan bagimu baguslah bagusnya bahas bahasamu bahasan bahaya
  baht bahunya baikan baitnya bajumu bajunya bakarnya bakat bakcang baklava bakpau bakteri
  bakti bakunya balapan balas balasan balasannya balau bales balikin baliknya balkan
  balkonnya balok bambini banding bandingkan bangga banggakan bangi bangku bangsal
  bangsanya bangunan bangunannya bangunkan bangunnya banjir bantah bantahannya bantal
  bantalnya banter bantuanmu bantunya banyakkan banyaknya barangkali barangnya barengan
  baret baring baringkan barisnya barista barulah barumu barusan basemen basement basque
  batal batalin batalkan batangnya batasi bate baterai baterainya batin batuk batuknya
  batunya bau baunya bawaannya bawahi bawahnya bawain bawakan bawalah bawangnya bayam
  bayangannya bayangin bayarannya bbc beasiswa bebannya beda bedah bedoeld bee beekeepers
  bees begadang begini beginilah begituan begitulah behaves beijing bekal bekalnya beker
  belah belajarlah belajarmu belajarnya belaka belakangmu belanda belandamu belandanya
  belanjaanmu belanjakan belanjanya belasan belasnya beliau believes beliin belikan
  belilah belokkanlah beloklah benang benarkah benarkan benarnya bencana beneran benerin
  bengkak bengkel bengkok bensin bentang bentangkan bentar benteng bentrok bentukan
  bepergian berabad beradalah beradu beragama berair berakal berakar berakhiran beraksara
  beralih beramai berambut berangkatnya berangsur berani beranjak berantakan berantem
  berarah berargumen berasa berasnya berasumsi beratnya beraturannya berawalan berayun
  berbagai berbahagia berbahaya berbaik berbaikan berbakti berbalas berbaris berbatasan
  berbau berbayar berbelit berbeloklah berbenturan berbicaralah berbincang berbobot
  berbohong berbuat berbulan berbunga berbunyi bercabang bercahaya bercakap bercanda
  berceritamu bercetak bercukur berdamai berdarah berdasar berdasarkan berdaya berdebat
  berdebu berdempet berdentang berderet berdering berdesakan berdirilah berdiskusi
  berempat berencana berendam beres beresi beresin bereskan berfokus berfoto bergabung
  bergambar berganda bergandengan bergaris bergaul bergaya bergegas bergelar bergelembung
  bergema bergembira bergerak bergiliran bergosip berguguran bergurau berhadapan berhak
  berhalangan berharakat berhari berhemat berhentilah berhentinya berhitung berhubung
  berhujan berhuruf berikan berilah berimbuhan beristirahatlah beristri beritahu beritamu
  beritanya berjadwal berjaga berjajar berjalanlah berjam berjamak berjanggut berjangka
  berjauhan berjemur berjenggot berjenis berjenjang berjualan berjuang berjumlah berjumpa
  berkabar berkacamata berkah berkaitan berkaki berkala berkali berkas berkasmu berkasnya
  berkatalah berkebalikan berkeberatan berkedudukan berkelahi berkelanjutan berkeliling
  berkelok berkeluarga berkemas berkenan berkendara berkepala berkepentingan berkerabat
  berkeringat berkesan berkesempatan berketerangan berkewajiban berkirim berkisah berkisar
  berkomentar berkonotasi berkonsentrasi berkonsultasi berkuasa berkumpul berkunjung
  berkurang berkurung berlabel berlalu berlama berlampu berlangganan berlanjut berlapis
  berlarut berlatar berlawanan berlebih berlibur berliku berlimpah berlipat bermacam
  bermain bermaksud bermarga bermata berminggu berminyak bermotor bermuatan bermukim
  bermula bernada bernapas berniat bernilai bernyanyi berobat berongga beroperasi
  berpadanan berpagar berpantul berpapasan berpartikel berpemanas berpendapat
  berpengalaman berpengaruh berpenghasilan berperabot berperangai berperilaku berpihak
  berpikir berpikirmu berpikirnya berpuasa berpuluh berpura berpusat berputar bersaing
  bersalah bersalaman bersamaan bersamaku bersamanya bersangkal bersangkalan bersangkutan
  bersantai bersarapan bersasaran bersayap bersebelahan bersedia bersekolah berselisih
  bersemangat bersembahyang bersenandung bersenang bersepakat bersepeda berseru bersiaplah
  bersidang bersifat bersikap bersikeras bersilangan bersimpati bersin bersinar
  berspekulasi berstatus berstruktur bersulang bersumber bersumpah bersungguh bersusah
  bersusunan bersyukur berta bertabrakan bertahap bertali bertamu bertanda bertandang
  bertanggung bertanyalah bertanyanya bertaruh bertebaran berteduh bertele bertelepon
  berteman bertempat bertemu bertenaga bertengkar bertepuk bertepung berteriak berterima
  bertetangga bertindak bertingkah bertipe bertitik bertiup bertugas bertulis bertulisan
  bertuliskan bertumbuh berturut berturutan berubahnya berujung berumah berunding beruntun
  beruntung berupaya berurusan berusia berutang berwajah berwaktu berwisata berwujud
  besaran besarannya besi besoknya bete betulkan biarin biarkanlah biarlah biarpun
  biasakan biasamu bibinya bibirmu bibirnya bicaraku bicaralah bidang bidangnya bihun
  bijak bijaksana biji bikinin bikinnya bilangan bilangannya bilangin bilangnya bimbang
  bimbingan bimbingannya bina bingkai bintang biola bioskopnya birnya birokrasi biryani
  bisalah bisanya bisita biskuit bisnis bius blak blakan blok blus bobot bobotnya bocor
  bocornya bodoh body boekje bohong bolak bolehkah bolehlah bolong bombay bongkah
  bongkahan bongkar boros bosen bosku bosmu bosnya botol botolnya bowl branch breaking
  british brussel buahan buahnya buang buatan buatku buatlah bubar bubuhkan bubuk bugar
  bukalah bukankah bukanlah bukannya bukit bukti buktikan bukunya bulanan bulanannya
  bulatan bulatnya bulu bumbunya bundar bundaran bunganya bungkukkan bungkusan bungkusnya
  bunyimu buram buruknya burung busnya busuk buta butir butirnya butuhin butuhkan butuhnya
  cabainya cabang cabut cacat cadang cahaya cahayanya cairan cakap cakep cakupan
  cakupannya calon camerieri camilan candi candra capai capaian cards carikan carilah
  catat catatanmu catatannya catatlah catur cctv cedera cegah cekatan ceko celah celahnya
  celananya cemas cemerlang cenderung centang cepatkan cepatlah cepatnya cepetan cerdik
  cerewet ceritain ceritakanlah ceritanya cermin cerminnya cerna ceroboh cetak cetakan
  cetakkan cewek cherchais cherchons chien choose cicilan cicip cicipilah cincin ciri
  clara closer cocokkan coklat college colokan combined conference confidential congrats
  contains continent contohkan contohnya costi counting cowok criticism croissant cru
  cucian cucinya cucunya cuka curah curam curang curiga curigai cute cutinya cuy dacha
  daerah daerahmu daerahnya daftarkan daftarnya dagang dagangan dahak dahi dahulu daily
  dakwaan dalih damai dampaknya dana dananya danau danaunya dapatkan darah daratan dariku
  darimu daring darinya darmi daruratnya dasarmu dashboardmu datamu datangi datanglah
  datangnya datanya daulat daur daya dayung debat debit dedikasi definisinya degan deh
  dehidrasi dejarlo deket delf deliberately delima demam demamnya demikian denah dendam
  dendanya denganku denganmu dengannya dengarkanlah dengarlah dengarnya denger dengerin
  denmark denmarkmu denmarknya denyut departamento deped depositnya derajatnya deret
  deretnya derita desa desain desainer desak desakan descend description desimal desisyon
  deskripsi detailnya devanagari dewa dewan dewasa diabetes diacak diaduk diagnosis
  diajari diajarkan diajukan diakhiri diakses diakui dialah dialami dialek dialeknya
  diamlah dianalisis diandalkan diangkat diangkut diantar diantarkan diapa diapain diapit
  diarahkan diawali diawasi dibacakan dibacanya dibagi dibagikan dibahas dibakar dibakukan
  dibalikin dibanding dibandingkan dibanggakan dibantu dibatasi dibayangkan dibayar
  dibayarkan dibebaskan dibela dibelanjakan dibelikan dibenci dibentangkan dibentuk
  dibereskan diberhentikan diberitahu diberitahukan diberkahi diberkati diberlakukan
  dibersihin dibersihkan dibesarkan dibetulkan dibiarkan dibiasakan dibikin dibilang
  dibilangin dibisa dibohongi dibongkar dibuang dibuktikan dibunyikannya dibutuhkannya
  dicabut dicampur dicantumkan dicap dicapai dicarikan dicat dicatat dicegah dicek
  diceritain diceritakan dicicil dicicip dicicipi dicoret dictionaries dictionary dicuci
  dicukur dicuri dicurigai didaki didatangi didenda didengar didengarkan didukung difoto
  digagalkan digambarkan digandakan diganggu diganti digantung digarap digelar
  digeneralisasi digeser digoreng digubris digugat dihabiskan dihadapi dihadiri dihafalkan
  dihapus dihargai diharuskan dihemat dihentikan dihidangkan dihidupkan dihilangkan
  dihitung dihubungi diinformasikan diingatkan diingetin diinjak diisap diisi diizinkan
  dijadikan dijalan dijalani dijalankan dijamakkan dijamu dijangkau dijatuhkan dijemput
  dijual dijumlah dikabari dikabarin dikabarkan dikabulkan dikacaukan dikalahkan dikali
  dikalikan dikarang dikasih dikatakan dikecilkan dikehendaki dikelola dikelompokkan
  dikeluarkan dikeluhkan dikemas dikembalikan dikenali dikenalnya dikeringkan diketahui
  diketuk dikhawatirkan dikira dikirim dikirimi dikirimkan dikit diklaim dikocok
  dikonfirmasi dikonversi dikoreksi dikritik diksi dikte dikuasai dikumpulkan dikunci
  dikunjungi dikurangi dikutip dilacak dilaksanakan dilakuin dilakukan dilampirkan
  dilanggar dilanjutkan dilaporkan dilarang dilawan dilayani dilebih dilegalisasi
  dilembutkan dilengkapi dilewat dilewatkan dilihatnya dilipat dilirik dilokalkan
  dilontarkan dilukiskan dilunasi diluncurkan diluruskan dima dimaafkan dimakan dimaklumi
  dimaksud dimaksudkan dimandikan dimanfaatkan dimarahi dimasakkan dimasukin dimasukkan
  dimatikan dimenangkan dimengerti diminum diminumnya dimohon dimudahkan dimulai
  dimuliakan dimundurkan dinaikkan dinamai dinar dinas dinegosiasikan dinginnya dini
  dinikmati dinilai dinyalakan dinyanyikan dinyatakan dinyatakannya diomongin dioperasi
  dipahat dipakai dipanaskan dipandang dipangkas diparafrase diparkir dipasang dipasifkan
  dipatuhi dipecah dipecat dipekerjakan dipelajarinya dipendekin dipendekkan dipenuhi
  diperbaiki diperbarui diperbolehkan dipercaya dipercepat diperdebatkan diperebutkan
  diperhatikan diperiksakan diperingatkan diperintah diperjelas diperjuangkan
  diperkenalkan diperkirakan diperlakukan diperlihatkan diperluas diperlukan dipermalukan
  diperpanjang dipersiapkan dipersilakan dipersoalkan dipertahankan dipertaruhkan
  dipertimbangkan dipesan dipesankan dipijak dipikirin dipikirkan dipilah dipindai
  dipinjam dipinjami dipisah dipisahkan diproses dipublikasikan dipuji dipungut dipunyai
  diputar diputus diputuskan dirakit diramalkan dirangkum dirapikan dirasakan dirawat
  dirayakan direbut direkam direkomendasikan direksi direktur direkturnya direndahkan
  direndam direnovasi diresepkan direvisi dirikan diriku dirilis dirindukan diringkas
  dirmelo dirugikan dirundingkan disadari disalahkan disalahpahami disamakan disambungkan
  disampaikan disangka disangkal disapa disappointing disapu disatukan disayangkan
  discover disebutkan disederhanakan disediakan diseduh diselamatkan diselenggarakan
  diselesaikan disembunyikan disengaja disepakati diserahkan diserang diserap disesali
  disetujui disewa disewakan disiapkan disifati disifatinya disimpan disinggung
  disingkirkan disiplin disisihkan disuguhi disukai disusul disyaratkan ditabrak
  ditafsirkan ditagih ditaksir ditakuti ditakutkan ditambal ditanam ditandai ditandainya
  ditandatangani ditanggapi ditangguhkan ditanggung ditangkap ditanyai ditanyain ditarik
  ditaruh ditata ditawari ditawarkan ditegakkan ditegaskan ditegur ditekan ditelaah
  ditelepon ditemani ditempati ditempatkan ditempel ditempeli ditempelinya ditempelkan
  ditempuh ditemukan ditengok ditentukan ditepati diterangkannya diterapkan diterbitkan
  diterima ditertawakan diteruskan ditetapkan ditiduri ditinggali ditinggikan ditinjau
  ditiru dititipkan ditonton ditransfer dituang ditujukan ditulis ditulisnya ditunda
  ditunggu dituntaskan ditutupi dituturkan diukur diumumkan diundang diundur diungkit
  diurus diusulkan diutak divalidasi diverifikasi divisi divoting diwajibkan diwarisi
  diwariskan diwawancara diwawancarai doa doakan doang dobr dokternya dokumen dokumennya
  dokumentasi domisili dompetmu dompetnya dongeng donnes dormendo dorong doryoku dosenmu
  dosennya download doyan draf drafnya drastis dresden drops dsb dudukkan duduklah
  duduknya duga dugaanku dugaannya dukung dukungan duluan dupa duri durinya dusnya
  dwibahasa efek efisien efisiensi ehm eja ekonomis ekor ekornya eksis ekspedisi
  ekspektasi ekspresi eksternal ekstrem elegan elektronik eliminasi elok emailku emailnya
  emang emangnya embel embun emisi emosi emosional empatnya empedu enakan enamnya
  endingnya eneg energi enggak enggan engkau engsel enrolment entah entahlah enteng enter
  entradas entres entri equipment equivalent esai esainya estropear etalase evaluasi
  examiner exercises experienced facebook fajar faktanya faktor faktur fakturnya fakultas
  falso fantastis farah fasad fase fasih fasilitas fatima favoritmu favourite femininnya
  femke feri fields figures filenya filipina filosofis finisci finlandia fiskal fitnah
  flowering flu fokusnya formalitas formulirnya fossil fotografer fotografi fotoin
  fotokopi fotolah fotonya francese frasanya frisch frustrasi fuka fuman fungsi fungsinya
  fusha gabung gabungan gabungannya gabungkan gadis gagang gagangnya gagasan gajah gajian
  gajinya galat gambar gambarannya gambarnya gandum ganggu ganteng gantian gantiin
  gantikan gantinya gantung gantungan garam garamnya garansi garansinya garasi gardez
  garing garpu gaul gawat gayanya gedungmu gedungnya gejala gejalanya gekauft gelang gelap
  gelapnya gelar gelasnya gelembung geli gelisah gemar gemas gembira gembok gemboknya
  gemetar gempa gemuk gemukan genangan genap gendang generasi generator generik generiknya
  genggam genggamnya gengsi genuine georgia gerai gerakannya gerakkan geraknya gerbangnya
  gerbong gerejanya gerobak gesa gesek gesekan geser gestuurd getarkan gevaarlijk giga
  gigih gigit gih gila gilirannya gini ginjal giron gitu godaan godaannya golongannya
  gonggong gorden gosip gosong gotong goyah grafiknya grass greater grup gua guangzhou
  guchi gudang gudangnya gugatan gugup gujarat gulanya gumpalan guna gunakan guncangan
  gundukan gundul gunting guntur gunungnya gupit gusi gyeongbokgung habisan habisin
  habislah habisnya hadap hadapi hadiahnya hadir hadirin hafalannya haikei hajatan hak
  hakikat hakmu haknya halal halamannya halnya halusnya hambatan hamil hampa hancur
  handful handuk handuknya hangeul hangus hanyalah hape hapenya hapus harakat harapkan
  hardest harfiahnya hargai hariku haring harta harum haruslah harusnya hasilkan hatian
  hatiku hatilah hatimu hatinya heboh heden helai helm helsinki hemat hematnya hembusan
  hembusannya hendak hendra hening henti hentikan hewannya hibrida hibur hiburan
  hidangannya hide hidung hidungmu hidupnya hijriah hiku hilangkan hindu hingga hinugasan
  hipotek hipotesis hiro hisab hitunganmu hitungannya hitunglah hive hoaks hobimu hoki
  hokkien homens hont hormati hormatnya hotelnya hotpot hubieran hubung hubungan
  hubunganmu hubungannya hubungi hujannya hukum hukuman hummus humor hunian hutan ibadah
  ibrani ibunya idealnya identik identitasmu identitasnya idenya idhafah idiom idiomnya
  idulfitri igd ijazah ikannya iklan iklannya iklim ikutilah ikutin ilmu ilmuwan iman
  imbalannya imbauan imbuhan imbuhannya imigrasi immigration impas impor imut inap incar
  independence indera indo indomaret indra induknya induksi infeksi infinitifnya infonya
  informasi informasinya informatika infrastruktur ingatanmu ingatkan ingetin inggrismu
  ingkarnya ingus ininom injak insiden insister instalasi installed institut instr
  instruksi insyaallah interior internetnya interrupting intervensi intip inversinya
  investasi investigasi iramanya iran irina iris irlandia ironis isan iseng islam islami
  islandia issues istilahnya istirahatlah istirahatnya istrimu isyarat italiamu italianya
  iuran ivan iyalah izinkan izinnya jabatan jabatannya jadikan jadilah jadinya jadwalnya
  jagain jagalah jahat jahe jahit jahitan jahitannya jaketmu jaketnya jalanan jalankan
  jalanlah jalanmu jalur jalurnya jamaknya jambu jamin jaminan jaminanmu jaminannya jamuan
  jamurnya jangankan janganlah janggut jangka jangkau jangkauan janjikan janjinya jantung
  japanese jaring jatah jatuhnya jauhnya jawabku jawablah jawabmu jawabnya jebakan
  jebakannya jebol jedanya jedo jejak jelas jelasin jelaskan jelek jeleknya jeli jempol
  jendelanya jenggot jenguk jenis jenisnya jenjang jeonse jepangmu jepit jerih jerman
  jermanmu jermannya jernih jersey jeruknya jilbab jilid jiwa jorok jual jualan juara
  jubah judul judulnya jujurnya jumlah juntrungannya jurusan jutaan kabarin kabel kabin
  kabinnya kabupaten kaca kacamata kacangan kacanya kacau kadarnya kadonya kafenya kaidah
  kainnya kairo kait kakakku kakakmu kakaotalk kakekku kakekmu kakeknya kakiku kakinya
  kalangan kalaupun kalbu kaleng kalengan kalian kaligrafi kalikan kambing kameranya
  kampanye kampungan kampusnya kamulah kanakan kananmu kandidat kanton kantongnya kantoran
  kantormu kapalnya kapasitas kapel kapital kapnya kaprah kapten karachi karang karangan
  karaoke karat karbon kardus kardusmu kardusnya karenanya karier karpet kartunya karya
  kasar kasarnya kasihkan kasingmahal kasirnya kastet kastil kasurnya kasus kasusnya
  katakan katakanlah katalog katamu kategori katering katte kau kaupakai kaus kawan
  kawannya kawasan kawin kayak keadaanmu keadaannya keadilan keagamaan keahlian keajaiban
  keamanan keanehan keanggotaan keasinan keausan kebablasan kebagian kebahagiaan kebaikan
  kebaikanmu kebajikan kebakar kebakaran kebalikan kebalikannya kebanggaan kebangun
  kebanjiran kebasahan kebebasan kebenarannya keberadaannya keberanian keberaniannya
  keberapa keberatan keberatannya keberhasilan kebersihan keberuntungan kebiasaanmu
  kebiasaannya kebijakan kebijaksanaan kebingungan kebingungannya kebisingan kebocoran
  kebohongan kebosanan kebudayaan kebun kebunnya keburu kecamatan kecanduan kecantikan
  kecelakaan kecenderungan kecepatanmu kecepatannya kecepetan keceplosan kecerdasan
  kecerobohan kecilan kecilkan kecilmu kecualinya kecurian kedai kedainya kedaluwarsa
  kedap kedatanganmu kedatangannya kedelapan kedengeran kediaman kedinginan kedip keduamu
  kedudukan kedudukannya kedutaan keenamnya keesokan kefasihan kefir kegagalan kegelapan
  kegemaran kegembiraan kegiatan kegiatanmu kegunaan kehadiran kehadiranmu kehadirannya
  kehalusan kehangatan keharusan kehati kehausan kehidupan kehormatan kehujanan keindahan
  keindahannya keisatsu kejadiannya kejam kejanggalan kejar kejauhan kejayaan kejunya
  kejuruan kejutan kejutannya kekacauan kekanak kekasaran kekasih kekayaan kekecewaan
  kekecualian kekecualiannya kekejar kekeliruan kekerabatan kekerapan kekerasannya
  kekeringan kekesalan kekhasan kekhawatiran kekosongan kekosongannya kekuatan kekuatanmu
  kekuatannya kekurangajaran kekurangannya kela kelahiran kelak kelakuannya kelalaian
  kelamaan kelambu kelamin kelaminmu kelaminnya kelancangan kelancaran kelanjutan kelapa
  kelapanya kelaparan kelar kelarin kelasmu kelaziman kelebihan kelebihanmu keledai
  kelegaan kelemahan kelembagaan kelembapan kelewat kelewatan keliling kelimanya kelipatan
  kelompokkan kelompokmu kelompoknya kelonggaran kelontong keluangan keluaran keluargamu
  keluarganya keluarin keluarkan keluarlah keluarnya keluhan keluhanmu keluhannya
  kelulusan kelupaan kelurahan kemacetan kemah kemahalan kemahiran kemajuanmu kemajuannya
  kemalaman kemalasan kemampuannya kemangi kemanginya kemanusiaan kemarahan kemari
  kemarilah kemarinmu kemasan kemasannya kematian kembalikan kembar kembaran kembarannya
  kementerian kemiripan kemiskinan kemudahan kemudi kemunculan kemunduran kemurahan
  kenaikan kenaikannya kenalanmu kenalannya kenangan kencang kencing kendala kendalikan
  kendara kendaraannya kendarai kenduri kentara kenyamanan kenyang kenyataan kenyataannya
  kep kepadaku kepadanya kepadatan kepagian kepal kepalaku kepalanya kepanasan kepanjangan
  kepastiannya kepedasan kepedulian kepekaan kependekan kepentingan kepentingannya
  kepercayaan kepercayaannya kepergian keperluan keperluanmu keperluannya kepikiran
  kepindahan keping kepingin kepo kepolisian keponakannya kepuasan kepulangan kepulauan
  kepunyaan kepunyaanku kepunyaanmu kepunyaannya keputusan keputusanmu keputusannya
  kerabat keraguan keramahan keramaian keran keranjang kerap kerasa kerasnya kerbau keren
  kerendahan kerepotan keresmian keributan keriting kerjaanku kerjaanmu kerjaannya kerjain
  kerjanyalah kern kertas kertasnya kerudung kerugian kerugiannya kerukunan kerumitan
  kerusakan kerusakannya kesabaran kesabarannya kesadaran kesakitan kesaksian kesal
  kesalahanmu kesalahannya kesalahpahaman kesalkan kesamaan kesanggupan kesanmu kesannya
  kesatu kesatuan kesebelas kesedihan keseharian kesehatan kesehatanmu kesehatannya
  keseimbangan keselamatan keselarasan keseleo keseluruhan kesembilan kesempatannya
  kesempitan kesempurnaan kesempurnaannya kesenjangan kesepian keseratus keseringan
  kesetiaan kesialan kesiangan kesibukan kesimpulanmu kesimpulannya kesombongan kesopanan
  kesukaanmu kesuksesan kesulitan kesulitanmu kesulitannya kesunyian kesusahan ketahuan
  ketahuannya ketahui ketakutan ketawa ketegangan ketegasan ketelitian ketemunya
  ketenagakerjaan ketenangan ketentuan ketepatan ketepatannya keterampilan keteranganmu
  keterangannya keteraturan keterbatasan keterbatasannya keterima keterkejutan keterlaluan
  keterlibatan keterpaksaan ketertiban keterusan keterusterangan ketetapan ketiadaannya
  ketidakcocokan ketidakjujuran ketidaknyamanan ketidaknyamanannya ketidakpastian
  ketidakpedulian ketidakpuasan ketidakramahan ketidaksetujuan ketidaksukaan ketiduran
  ketik ketinggian ketsuron ketua ketujuh ketuker ketumbar keturunan ketus keuangan
  keuntungan keuntungannya kewajiban kewalahan keyakinan keyakinanmu khasiat khatulistiwa
  khawatirkan khawatirlah khawatirnya khayalan khmer khotbah khususnya kiamat kiasan kikuk
  kinerja kininya kinmu kinuha kios kipas kiranya kiril kirim kirimannya kirimi kirimin
  kirimkan kirimkanlah kirimlah kirimnya kirimu kirinya kisah kisaran klaim klaimnya
  klausanya klausul klien kliennya klik kliniknya kloset kocok kode kodenya koki kokoh
  kolaborasi kolam kollegin kolomnya komanya kombinasi komedi komentar komentarnya
  komersial komisi komite komparativ kompartemen kompensasi kompetensi komplain komponen
  kompor kompornya komunikasi komunikasikan komunitas kondektur kondisi kondisinya
  kondominium koneksi koneksinya konektor konferensi konfirmasi konfirmasinya konfrontasi
  konjugasinya konon konsentrasi konsep konsepnya konser konsernya konsistensi
  konsistensinya konsonannya konstruksi konsultan konsultasi konsumen konsumsi kontainer
  kontainernya kontak kontaknya konteksnya konter kontradiksi kontrak kontrakan kontrakmu
  kontraknya kontrakten kontraktor kontroversi konversi konyol koordinasi koordinator
  kopenhagen koper koperasi kopermu kopernya kopinya koran korannya korban koreamu
  koreanya korelasi koridor koridornya kosakatamu kosnya kosongkan kostum kotaknya
  kotamadya kotapraja kramanya kran kreatif kristen kristin kriteria kritis kroasia
  ksatria ktp kuakui kuala kuali kualitasnya kuartal kuartalnya kuas kuasa kubaca kubah
  kubahnya kubalas kubalikin kubantu kubawa kubayangkan kubeli kuberikan kubikin kubilang
  kucatat kuceritain kuceritakan kucingnya kudaftar kudapat kudengar kuduga kue kuenya
  kuesioner kuhapus kuitansi kuitansinya kujawab kukasih kukira kukirim kulakukan kuliahmu
  kuliahnya kulihat kuliner kulkas kulkasnya kuman kuminta kumpul kumpulan kumpulkan
  kumulatif kunciku kuncimu kuncinya kuningnya kunjung kunjungan kunjungannya kunjungi
  kupahami kupakai kupas kuperiksa kupikir kupikirin kupikirkan kupinjamkan kuputuskan
  kurangi kurangnya kurasa kurir kurirnya kurma kursinya kursusnya kurun kusampaikan
  kusangka kuselesaikan kusut kutahan kutanya kutaruh kutelepon kutub kutulis kutunggu
  kututup kuyup kuzu kyakusama laba labelnya laboratorium laci lacinya lafal lafalmu
  lagian lagipula lagunya lahan lahirmu lahore laila lainnya laju lajur lakinya laku
  lakuin lakukanlah lalai lamaku lamamu lamanya lamar lamaran lamarannya lambangnya
  lambung lampaui lampirannya lampirkan lampunya lancang landai landas landasan langganan
  langka langkahmu langkahnya langsing langsungnya lanjut lanjutkanlah lansia lantainya
  lantang lao lapak lapangan lapisan lapisnya lapor laporan laporanku laporanmu laporannya
  laporkan laptopmu laptopnya larangannya laranglah larilah lasagna lassi lasting latarnya
  latih latihanmu latihlah latinnya lauknya laundry lautan lautnya layanan layarnya
  lazimnya leading lebaran lebarnya lebat lebay lebihkan lebihnya lecet ledeng ledengnya
  legendaris leggendo leher leipzig lekas leker lelakinya leluasa leluconnya lemak
  lemarinya lemas lembaga lembur lemburnya lembutkan lemon lemot lempar lengan lengannya
  lengket lengkung lenyap lepas lepaskan lesu letakkan levant levert lewatin lewatkan
  lewatnya lha liaison liar liat libatkan liburanmu liburannya liburku licin lidahmu
  lifted liftnya lihatnya lilin lilinnya limit limun lindqvist lindung lingkar lingkari
  lingkungan lingkungannya linguistik linknya lintasan lintasnya liputan lisannya lisbon
  lisensi listriknya lleguen loak lobak lobi locking logam logat logatmu logatnya logika
  logikanya login logistik loh lokal lokasi lokasinya lokatif loker lolos lompat lompatan
  lompati london longsor lonjakan losmen loteng lottery lowongan lowongannya luangkan
  luasnya lubang lucunya lugas lukisan lukisannya luluhnya lulus lulusan lulutuin lumpuh
  lumpur lumut lunakkan lunas luntur lupain lupalah luput luring lusinan lutut luwes macam
  macetnya madilim madu magang magpalit mahalnya mahasiswamu mahasiswanya mahkamah mainan
  mainnya majelis majikan majukan makainya makaka makakain makalah makananmu makanlah
  makannya makasih makelar makian maklum maklumat makmur maknanya maksa maksudkan maksudku
  maksudmu malaikat malammu malaysia malilimutan malnya malu mampat mampet mampirlah mampu
  manajemen manajer manajermu manajernya mancing mancur mandara mandarinmu mandarinnya
  mandinya mandiri manfaatkan manfaatnya mangeons mangganya manisan manisnya manjur mantan
  mantra manual manusia manusiawi mapan margin marilah marina marine markets marks
  marktplaats maroko masakanku masakanmu masakannya masakkan masalahmu masalahnya masam
  masehi masjidnya maskapai masukan masukanmu masuki masukin masukkan masuklah masuknya
  masyaallah masyhur matahari mataharinya mataku matalik matches materi matian matiin
  matikan matinya maukah maulah maunya mayoritas medis mejamu mejanya mekanik mekar
  melabeli melacak melafalkan melafalkannya melahirkan melaksanakan melakukannya melalui
  melamarnya melambangkan melambat melampaui melampirkan melamun melanggarnya melangkah
  melanjutkannya melapor melaporkan melaporkannya melarang melarangnya melati melatihmu
  melatihnya melayang melayani melayanimu melbourne melebih melebihi meledak meledek
  melegakan melek melekat meleleh melemah melemahkan melembutkannya melempar melenceng
  melengkapinya melepas melepaskan melepasnya meler melewati melewatinya melewatkannya
  melibatkan melindungi melingkar melingkari melingkupi melintang melintasi melintir melon
  melonjak melonjaknya meluangkan meluas melukai melukis melukiskan melulu melunakkannya
  melupakannya meluruh memaafkan memadai memadamkan memadatkan memadatkannya memadukan
  memagari memahaminya memajukan memakaikan memakainya memakannya memaksa memaksakan
  memaksakannya memaksanya memaksudkan memalukan memamerkan memampatkan memanaskan
  memandang memandangi memandangnya memandu memanfaatkan memanfaatkannya memanggang
  memanggilmu memanggilnya memangkas memanjat memantau memar memarahi memarkir memasaknya
  memasangkan memasangnya memasifkan memasok memastikannya memasuki memasukkan
  memasukkannya mematikan mematikannya mematuhi membacakan membacamu membagikan
  membagikannya membahas membahasnya membakar membalas membalasnya membalikkannya
  membaliknya membandingkannya membangkang membangkitkan membangunkan membangunnya
  membanjir membantahnya membanting membantumu membantunya membasuh membatalkan
  membawakannya membawamu membawanya membayangkannya membayarnya membebani membebaskanmu
  membedah membelanjakan membelanya membenci membencinya membendakan membengkak membentang
  membentangkan membentuknya member memberanikan membereskan membereskannya memberikan
  memberimu memberinya memberitahu memberitahukan memberitahuku memberitahumu
  memberitahunya memberitakan memberlakukan membesar membesarkan membetulkanmu
  membetulkannya membiasakan membiayai membicarakannya membimbing membingungkanmu
  membisukan memblokir membocorkan membolak membolehkan membolehkannya membolos membongkar
  membongkarnya membosankan membuahkan membuangnya membuatkan membuatku membuatmu
  membubarkan membukakan membukanya membuktikan membuktikannya membumi membungkus membunuh
  membunyikannya memburu memburuk memburunya membutuhkannya memecah memecahnya memecat
  memedulikan memegangnya memelas memelihara memeluk memenangkan memencet memendekkan
  memendekkannya memengaruhi mementingkan memenuhi memerah memercayai memeriksakan
  memeriksalah memeriksanya memerintah memerlukan memerlukannya memesannya memetakan
  memihak memikirkan memikirkanmu memikirkannya memikul memilah memilahnya memiliki
  memilikinya memimpikan memimpin memindahkan memindahkanmu memindahkannya memindai
  meminjam meminjami meminjamkan meminjamkannya meminjamnya memintamu memintanya meminum
  meminumnya memisahkannya memohon memoles memori memotongmu memotongnya memotretnya
  mempan mempekerjakan mempelajari mempelajarinya memperbaikinya memperbarui memperbesar
  mempercayai mempercayainya mempercepat memperdebatkan memperhalus memperhatikan
  memperhatikannya memperindah memperjelas memperkenalkannya memperkirakan
  memperkirakannya memperkuat memperlakukan memperlakukanmu memperlakukannya memperlambat
  memperluas mempermalukan mempermasalahkan memperoleh memperpanjang memperpanjangnya
  mempersempit mempersiapkan mempersilakanmu mempersingkat mempertahankan
  mempertahankannya mempertajam mempertanyakan mempresentasikan memproduksi memproduksinya
  memproses memuaskan memuatnya memudahkan memudar memuja memujimu memukul memulailah
  memulainya memulangkan memuliakan memulihkan memundurkan memungkinkan memungutnya
  memusatkan memusingkan memutar memutuskan memvalidasi memverifikasi menabrakkanmu
  menaburkan menaburkannya menahannya menaik menaiki menaikkannya menakar menaklukkan
  menaksir menakut menakuti menamai menamainya menamatkan menambahkannya menambahnya
  menambal menampilkan menampung menanak menanam menandai menandaimu menandainya
  menandatangani menandatanganinya menangani menanganinya menanggalkan menanggapi
  menanggapinya menanggung menanggungnya menangis menangkapnya menanjak menantikan
  menantikannya menantunya menanyai menanyainya menaranya menariknya menaruhnya menasihati
  menasihatinya menata menatap menawarkannya mencabut mencairkan mencakup mencamkan
  mencampur mencampuradukkan mencampurnya mencantumkan mencapai mencatat mencatatkan
  mencegah mencegat mencela mencemari menceritakannya mencetak mencetaknya mencicipinya
  mencintaimu menciptakan mencium mencobanya mencocokkan mencolok mencoret mencret
  mencubit mencukupi mencukur mencuri mencurigai mencurigakan mendadak mendaftarkan
  mendahului mendahuluinya mendahulukan mendaki mendalam mendalami mendalilkan mendapati
  mendapatkan mendapatkannya mendarat mendasar mendasarinya mendasarkan mendata mendatang
  mendatangi mendekat mendelegasikan mendengarkannya mendengarmu mendengarnya menderita
  mendesak mendiktekan mending mendingan mendingin mendinginkan mendirikan mendoakan
  mendoakannya mendorong mendorongnya mendua mendukung menebaknya menebus menegang
  menegangkan menegosiasikan menegurmu menekan menekuni menelaah menelan menelantarkan
  meneleponmu meneleponnya menelusuri menemanimu menemaninya menembak menembus menempati
  menempatkan menempatkanmu menempatkannya menempelkannya menempuh menempuhnya menemui
  menemuinya menemukanlah menemukannya menendang menengah menengahi menengok menentang
  menentukan menepati menepuk menerangi menerangkannya menerapkan menerapkannya
  menerbitkan menerimanya menerjemahkan menertawakan meneruskan meneruskannya menetapkan
  menetes mengabaikan mengabari mengabarkan mengabulkan mengacau mengacaukan mengacu
  mengada mengadakan mengadakannya mengadu mengaduk mengagetkan mengait mengajakmu
  mengajaknya mengajari mengajarimu mengajarinya mengajarkan mengajarkanmu mengajarkannya
  mengaji mengajukan mengakhirinya mengakibatkan mengakuinya mengalami mengalir
  mengalokasikan mengamankan mengamati mengambang mengambilnya menganalisis mengancam
  mengandaikan mengandalkan mengandalkannya menganggap menganggapmu mengangguk
  menganggukkan menganggur mengangkatnya mengangkut menganjurkan mengantarkan mengantarmu
  mengantarnya mengantre mengantuk mengapung mengarahkan mengarang mengasah mengatakannya
  mengatasi mengatasinya mengawasi mengebut mengecat mengeceknya mengecewakan
  mengecewakanmu mengedit mengejek mengejutkan mengejutkanmu mengelilinginya mengeliminasi
  mengelola mengeluarkannya mengeluh mengeluhkan mengeluhkannya mengemas mengembalikannya
  mengembangkan mengemudi mengemudikan mengena mengenakan mengenalkan mengenalnya
  mengenang mengencangkan mengendalikan mengendap mengepel mengeraskan mengerikan
  mengering mengeringkan mengerjai mengerut mengesahkan mengesankan mengetahui
  mengetahuinya mengetikkan menggabungkan menggambarkannya menggandakan menggandeng
  mengganggu mengganggumu mengganjal menggantikannya menggantinya menggantung menggarami
  menggarap menggelap menggemaskan menggembirakan menggemuk menggenang menggendong
  menggerakkan menggerutu menggeser menggigil menggigit menggiring menggoda menggolongkan
  menggonggong menggoreng menggumpal menggunakan menghabiskan menghadap menghadapi
  menghadapinya menghadapkan menghadiahkan menghadiri menghadirkan menghakimi
  menghalanginya menghambat menghampiri menghampirinya menghancurkan menghantam menghantui
  menghapus menghapusnya mengharapkan mengharapkannya menghargai mengharuskan menghasilkan
  menghendaki menghentikan menghentikanmu menghentikannya mengherankan menghibur
  menghidupkan menghilangkan menghilangkannya menghimpun menghindarinya menghindarkan
  menghindarkanmu menghubungi menghujani menghukum mengikat mengikatnya mengikuti
  mengikutimu menginap mengingatkanmu mengingkari mengingkarinya menginjak mengintip
  mengiranya mengirimi mengirimimu mengirimkan mengirimnya mengiris mengisinya mengiyakan
  mengizinkan mengkhawatirkan mengklaim mengklaimnya mengobati mengocok mengomel
  mengomentari mengonfirmasi mengoordinasi mengoper mengoperkan mengorek mengoreksimu
  mengoreksinya mengorganisasi mengosongkan mengotori menguasai menguasainya menguatkan
  mengubah menguji mengujinya mengukir mengukur mengukus mengulangi mengulanginya
  mengulangnya mengulek mengulurkan mengumpulkan mengumpulkannya mengumumkan mengundang
  mengundangmu mengunduh mengundurkan mengunggah mengunggahnya mengungkapkan menguntungkan
  mengupas mengurai mengurangi menguras mengurungkan mengurus mengurusnya mengusahakan
  mengusulkannya mengutip meniadakan menidurkan menikahkan menikmatinya menilainya
  menimbang menimbulkan menimpa menimpamu menindaklanjuti menindaklanjutinya meninggal
  meninggalkannya meninggikan meningkat meninjau menipis meniru menirukan menirunya
  menitipkan menjadwalkan menjagamu menjalani menjalankannya menjamakkan menjaminnya
  menjamu menjamumu menjangkau menjanjikan menjauh menjawabnya menjebakmu menjelang
  menjelaskannya menjemput menjemputmu menjemputnya menjemur menjengkelkan menjerat
  menolakmu menolaknya menolongmu menonjol mensyaratkan mental mentega mentereng menteri
  mentok mentraktir mentransfer menua menuai menuangkan menugaskan menuju menukar
  menukarnya menular menularkan menuliskan menuliskannya menumbuhkan menumis menumpahkan
  menumpang menumpuknya menundanya menunduk menunggumu menunggunya menunjukkannya
  menunjuknya menuntun menuntutmu menuntutnya menurun menuruni menurunkan menurunkannya
  menurutku menutupnya menyadari menyadarinya menyahut menyajikan menyakitimu menyakitkan
  menyaksikan menyala menyalakan menyalami menyalinnya menyamakannya menyamar
  menyamaratakan menyambar menyambungkan menyampaikannya menyamping menyandang
  menyandarkan menyangka menyangkalnya menyangkut menyanyikan menyanyikannya menyapamu
  menyapanya menyapu menyarankan menyaring menyasar menyatu menyatukan menyatukannya
  menyayangi menyebabkan menyebalkan menyebar menyebarkan menyeberangi menyederhanakan
  menyedihkan menyeduh menyegarkan menyehatkan menyehatkanmu menyelamatkanmu menyelaraskan
  menyelenggarakan menyelidik menyelidiki menyelinap menyelipkan menyeluruh menyembuhkan
  menyembuhkanmu menyembunyikan menyembunyikannya menyempatkan menyempitkan menyendok
  menyengat menyentuhnya menyerahkan menyerahkannya menyerang menyerap menyerapnya
  menyeret menyertaimu menyertainya menyertakan menyesal menyesatkan menyetel menyetop
  menyetujuinya menyewakan menyia menyiarkan menyibukkan menyikat menyiksa menyilangkan
  menyimak menyimpannya menyindir menyingkirkan menyiram menyisip menyisipkan menyombong
  menyombongkan menyorot menyudutkan menyukai menyukainya menyulitkan menyumbang menyurat
  menyuruh menyuruhku menyusahkanmu menyusul menyusulkan menyusunnya menyusuri menyusut
  meraba merahnya meraih merajuk merakit merampas merancang merapatkan merapikan
  merapikannya merasakan merasakannya merawat merayakan merayakannya merdeka merebus
  merebut merece mereda meregangkan merek merekalah merekam merekrut merelakan merembes
  merembet merencanakan merenovasi merenung merepotkan meresepkan merevisi merilis
  merindukan merintis merobek merobohkan merokok merosot merugi merugikan merugikanmu
  merujuk merupakan merusak merusakkan mesin mesir meskipun mesti mestinya meteorologen
  meterai meteran metronya mewajibkan mewakili mewarisi mewarisinya mewawancarai
  meyakinkan middle migran migrasi mikirin mikirnya milan miliar miliki milikmu miliknya
  mimbar mimpi mimpin minat minati mindahin mineral mingguanmu minggunya minimalnya
  minimum minivan mintai mintalah minumannya minumlah minyaknya miring mirip miripnya
  misal miskin mobilku mobilmu modalmu modalnya modelnya modulnya mogok molor moncong
  mongolia monsun monyet mood motif motifnya motivasi motong motto mottomo muak mual muat
  muatan mubazir mudahan mudahnya mudik mukamu mukjizat mulia mulus munculnya mundurkan
  mungil mungkinkah murahan murahnya murbei muridnya murninya musibah musicians musiknya
  musiman musimnya muslim muson mustahil musuh musyawarah mutakhir muter mutiara mutsanna
  mutu mutunya mutusin myanmar myeongdong nababasa nabung nacho nadamu nafsu nagamit nagih
  nahwu naikin naiknya nakabukas nakakuha nakal nakalipas nakapila nakuti nalar naluri
  nalurimu namaku nambah nambahin nampan nanas nangkep nantikan nanya nanyain napakabait
  napas napasnya naruh nasib nasihat nasihati nasihatnya naskah naskahnya native natuloy
  nawarin nebak negasi negerimu negerinya negosiasi nekat nelayan nelepon nemenin nempel
  nemuin nenekmu neneknya nengok nengokin nerea nerima netralnya ngabarin ngajarin ngaku
  ngalamin ngambek ngambil ngantre ngarang ngasih ngatur ngawur ngebantu ngebut ngecek
  ngefek ngeh ngejar ngelakuin ngeluh ngeluhin ngerasa ngeri ngerjain nggak ngikutin
  nginap nginep nginepin ngingetin ngira ngobrolin ngobrolnya ngomel ngomongin ngomongmu
  ngomongnya ngopi ngubah ngukur ngulang ngundang ngurangin ngurus niatnya nikah nikmat
  nikmati ninggalin nisbah niscaya nobel nolak nomorku nomormu nomornya norwegia
  norwegiamu norwegianya notanya notaris notifikasi notulen notulennya nowruz nuansa
  nuansanya nulisnya numpang nunda nunggu nungguin nunggunya nunjukin nyadar nyala nyalain
  nyalakan nyali nyambung nyampe nyamuk nyamuknya nyangka nyangkut nyaranin nyari nyaring
  nyatakan nyatanya nyawa nyebelin nyeberang nyebut nyelametin nyelesaiin nyenyak nyerah
  nyerahin nyeri nyerinya nyesel nyewa nyiakan nyiapin nyinggung obatan obatnya obj
  objektif obrolan offices official olahraga olehku olehmu olehnya ombak omelan omong
  omongan omongannya omongin omzet ongkos ongkosnya onto opbel operasi operasinya
  operasional operator operatornya oposisi opsi opsinya opsional optimis option oralit
  organik organisasi orientasi orientasinya otakmu otodidak otomatisasi otoritas otot otw
  ova oven ovennya overnight pacaran pacarnya padaku padam padamu padanya padat padatkan
  padi paduan pagimu paginya paglipat pagoda pahala pahami pahit pajakmu pajaknya
  pakaianmu pakaiannya pakaikan pakailah pakainya pakar paketnya pakistan paksa paksaan
  paku pali palsu palu pamer pameran panah panaskan panasnya panca pancasila panci
  pancuran pandai pandang pandangan pandangnya panduan panduannya panekuk panggil
  panggilkan panggillah panggung pangkalan pangsa panitia panjangkan panjangmu panjar
  panjat pantang pantangan pantau pantesan panti pantul papannya papers paragrafmu
  paragrafnya parasetamol pariwisata parkir parkiran parkirnya parlarle parlemen partai
  paru pasal pasangannya pascasarjana pashto pasi pasien pasifnya paskah pasokan paspormu
  paspornya passengers pastikan pastinya pasukan patented patokannya patuh patuhi patungan
  patut paula payah payungku payungnya pdf pecahan peci pedagang pedagangnya pedang pede
  pedesaan pedih pedoman peduli pegal pegang pegangan pegunungan pejalan peka pekerja
  pekerjaannya pelacakan pelafalan pelajarnya pelaksanaan pelakunya pelamar pelancong
  pelanggannya pelanggaran pelaporan pelarian pelat pelatih pelatihan pelayanan pelayannya
  pelayaran pelega pelemahan pelembut pelembutan pelengkapnya pelihara peliharaan pelit
  peluang peluangmu peluangnya peluit peluk pelukan pelunasan peluncuran pelupa pemadam
  pemadaman pemahamanmu pemainnya pemakai pemakaman pemalu pemampatan pemanas pemanasan
  pemanasnya pemandangan pemandangannya pemandu pemanduan pemangkasan pemanis pemantauan
  pemarah pemasaran pemasok pemasoknya pemasukan pembacaan pembacanya pembagian
  pembagiannya pembahasannya pembalikannya pembangunan pembaruan pembatalan pembatas
  pembatasan pembawa pembayaran pembayarannya pembebasan pembedaan pembedanya pembelajaran
  pembelian pembentuk pembentukannya pemberhentian pemberi pemberian pemberinya
  pemberitahuan pemberitahuannya pemberontakan pembersihan pembicaraannya pembicaranya
  pembimbing pembimbingnya pembongkaran pembuangan pembuat pembubuhan pembukaan
  pembukaannya pembukamu pembukanya pembuktian pembukuan pemegang pemelajar pemeliharaan
  pemendekan pemeran pemeriksa pemeriksaan pemeriksaannya pemerintah pemerintahan
  pemesanan pemikiran pemilahan pemilihan pemiliknya pemilu pemimpin peminat pemindahan
  peminjaman pemisahan pemisahnya pemkot pemrosesan pemuda pemulihan pemunduran pemutusan
  penakut penalaran penambahan penampilan penandanya penanganan penanganannya penanggung
  penantian penarikan penasihat penata penataan penawar penawaran penawarannya pencahayaan
  pencapaian pencarian pencatatan pencegahan pencegahannya pencet pencetak pencocokan
  pencurian pendaftarannya pendahuluan pendakian pendampingan pendapatan pendapatnya
  pendatang pendekatan pendekkan pendekmu pendeknya pendengar pendengaran pendengarmu
  pendengarnya penderitanya pendiam pendidikan pendidikannya penduduk penduduknya
  pendukung penekanannya penelaahan penelepon peneliti penelitian penelitianmu penempatan
  penentu penerang penerapan penerbangan penerbangannya penerbit penerbitan penerimaannya
  penerjemah penerjemahan penetapan pengacara pengadaan pengadilan pengaduan pengajuan
  pengajuannya pengalaman pengalamanku pengaman pengamatan pengambilan pengampunan
  pengandaiannya penganggur pengangguran pengangkutan pengantarnya pengantin pengantinnya
  pengap pengarang pengaruh pengatur pengaturan pengaturannya pengawas pengawasan
  pengecohnya pengecualiannya pengelola pengelolaan pengeluaran pengembalian pengembang
  pengemudi pengen pengenalnya pengeras pengertian pengertiannya pengesahan pengetahuan
  pengetahuannya pengganggu penggantian penggantinya penggeseran penggolong pengguna
  penghalang penghalus penghambat penghangat penghapusan penghargaan penghasilannya
  penghematan penghentian penghibur penghiburan penghijauan penghinaan penghitung
  penghitungan penghormatan penghubung penghubungnya penghuni penghuninya penginapan
  penginapannya pengingat pengingatnya pengingkar pengirim pengiriman pengirimannya
  pengisi pengisian pengkritik penglihatan pengobatan pengolahan pengorbanan penguasa
  penguasaan penguji pengujian pengukur pengulangannya pengumuman pengumumannya
  pengunduran pengungsian pengunjung pengurangan pengurus pengurusan penilainya
  peninggalan peninjauan penipuan penisilin penitipan penjadwalan penjagaan penjahit
  penjamin penjual penjualan penjualannya penjualnya penolakanmu penolakannya penolong
  penomorannya penonjolan penonton pensiun pensiunan penuaan penuhnya penukaran penulis
  penulisan penulisnya penundaan penunjukan penunjuknya penuntun penurun penurunan
  penutupan penutupnya penyair penyakit penyangga penyangkalannya penyanyi penyanyinya
  penyaring penyebaran penyeberangan penyedia penyedot penyegar penyelamat penyelamatnya
  penyelenggara penyelesaian penyelia penyelidikan penyemangat penyerahan penyesalannya
  penyesuaian penyewa penyimpanan penyimpanannya penyimpangan penyok penyunting penyusun
  penyusunan perabotnya perahu perahunya peralatan peralihan perangkai perangkap
  perangkapnya perangkat perannya perantara perantaraan perantau perantauan perapian
  perasaannya peraturan perawatannya perawatnya perayaan perbaikannya perban
  perbandingannya perbarui perbatasan perbendaharaan perbuatanmu percakapanmu percaya
  percayai percepatan percuma perdagangan perdana perdebatannya perdebatkan pereda
  peredaran perekrut perekrutan perempatan perempuannya perencana perencanaan peresmian
  pergantiannya pergelangan pergeseran pergeserannya pergilah perginya perguruan perhalus
  perhatian perhatiannya perhatiin perhentian perhimpunan perhitungan perhitungkan
  perhubungan peri perihal periksakan periksalah periksanya perilaku perincian peringatan
  peringatannya peringkat perintahmu perintahnya period periode periods perjalananmu
  perjanjian perjelas perjuangan perjumpaan perkakas perkakasnya perkara perkaranya
  perkataan perkawinan perkecualian perkecualiannya perkedel perkemahan perkembangannya
  perkenalkan perkiraan perkirakan perkotaan perlahan perlakukan perlawanan perlengkapan
  perlihatkan perlindungan perluas perluasan perlukan perlunya permainan permanen permen
  permintaanmu permintaannya permohonan permohonanmu permohonannya permukaan permukiman
  permulaan permusuhan pernikahannya pernyataannya perorangan perpanjang perpanjangan
  perpanjangannya perpindahannya perpustakaanmu perpustakaannya perputaran persahabatan
  persaingan persamaan persatuan persediaan perselisihan persembahkan persen persentase
  persepsi perseroan persetujuannya persia persik persimpangan persisnya persoalan
  persoalannya personalia persyaratan pertahankan pertamaku pertanda pertandingan
  pertandingannya pertanian pertanyaanmu pertemanan pertengkaran pertiga pertolongan
  pertukaran pertumbuhan pertumbuhannya pertunjukan peru perubahannya perumahan
  perumpamaan perundingan perusahaanmu perutku perutmu perutnya perwakilan pesaing
  pesananmu pesankan pesanmu pesawatnya pesimis pesisir peso petak petang petanya
  petersburg peti petik pewawancara pewawancaranya phrasal pidana pijakan piketnya pikiran
  pikiranmu pikirannya pikirin pikirkan pikirnya pikul pilah pilek pilihanmu pilipino
  pilot pimpin pimpinan pin pindahan pindahannya pindahkan pindahnya pindai pinggiran
  pinggul pingsan pinjamkan pinjemin pintasnya pintunya pinus pipa pipanya pir piringmu
  piringnya pisahkan pisangnya pisau pistachio pistasio pizze plang platform plester
  plusquamperfekt pochi pohonnya pojokan polandia poli polis polite polusi pompa pompanya
  pondok pondoknya ponselku ponselnya populasi porsinya portable portal portugismu
  portugisnya posisimu posisinya positifnya posmu potongannya potonglah potongnya potret
  pound power praktik praktiknya pramuniaga prancis prancisnya prasasti predikatnya
  prefektur prep preposisinya presentasi presentasimu presentasinya prestasi prestasinya
  prevents pria pribadimu prinsip prinsipnya printernya prioritas prioritasnya prises
  priya produk produknya produksi produktivitas profesinya profits programer progres
  projects promo promosi pronomina properti proporsi prosedur prosedurnya proses prospek
  protes protokol provides provinsi proyek proyeknya proyeksi proyekto puas publik pucat
  pudar puitis pujianmu pukulan pulih pulihkan pulsa puluhannya punah punggungku
  punggungmu punggungnya punyalah punyanya pura purnajual purnama pusing pustaka putar
  putaran putari putihnya puts putus putusan putuskan quelles quieran quieren rab raba
  racun radang radiator ragam ragamnya ragu ragukan rahasia rahasianya rajut raknya rakus
  rakyat ramainya ramalannya rambu rambutku rambutmu ramping ramuan rancangan rancu rangga
  rangkai rangkaiannya rangkanya rangkum ransel ranselnya rantai rapat rapatnya rapor
  rasakan rasanya rasio raut rawa rawat raya rayain react reactie reader reaksinya
  realistis rebahan rebana recognise records reda redaksi reefs refleks reformasi
  registrasi regular rejected rekam rekaman rekamannya rekan rekanmu rekannya reklamasi
  rekomendasi rekor rekrutmen rel rela relakan relatifnya relawan relokasi remnya rempah
  renang rencanain rencanakan rendahnya rendam renovasi rentang rentangnya renzoku
  republik reputasinya resensi resep resepkan resepnya resepsi resepsionis reservasi
  resinya resminya responden respondennya respons respuesta retak retakan retur revisi
  rewel rezeki ribet ribut rikai rileks rinci rincian rincinya rindu rindukan ringkas
  ringkasannya ringkasnya rintangan rintisan risalah risikonya ritme riwayat robot roda
  rokok romanisasi romanisasinya romantis romawi rombongan roots rotinya royong ruanganmu
  ruangannya ruangnya ruas rubel rubrik ruft rugi ruginya rujukannya rukun rumahan
  rumahnya rumi rumit rumpun rumput rumus rumuskan runtuh rupanya rupawan rupee rusa
  rusaknya rusia rusiamu rusianya sabar sabaran sabuk sadar sadari sahabat sahabatnya
  sahaya sahih sains sakelar sakitan sakiti saklar saksama saksikan sakti sakunen salahkan
  salahmu salahnya salaman salami salammu salep salib salinan salinannya saljunya salmon
  saluran samakan samanya samar sambalnya sambilan sambung sambungan sambungannya
  sambungkan sambungnya sambut sambutan samin sampah sampahnya sampainya sampel sampelnya
  samping sampingan sampingmu sampingnya samples sampul samudra samuel sanak sandal
  sandang sandaran sandi sandinya sanggah sangka sangkaan sangkal sangkalannya sangkalnya
  sanskerta santa santun santunnya sapaanmu sapaannya sapunya saran saranin sarankan
  saranku sarannya sarapannya sarhe saringan sarjana sarung sasakyan sasarannya satuan
  satuannya satukan saudaraku saudaramu saudaranya saudari sauerkraut sausnya sayangnya
  sayurnya schwarz schwarzen sdm seabad seadanya seakan seandainya seangkatan sebagaimana
  sebagiannya sebagus sebaik sebal sebanding sebanyak sebatang sebatas sebegini sebegitu
  sebelahmu sebenernya seberangilah seberangnya seberat seberisik sebesar sebetulnya
  sebisa sebungkus sebunyi seburuk sebutannya sebutir secarik secepat secepatnya
  secukupnya sedangkan sedapat sedarah sedekah sedekat sedemikian sederas sederet
  sederhananya sedetik sedikitnya sedunia seenak seenaknya segala segampang segan segar
  segelintir segenggam segini segitunya seharga seharusnya sehubungan seikat seimbang
  seiring seisi sejahtera sejalan sejam sejarahnya sejati sejauh sejelas sejenisnya
  sejujurnya sejumlah sekalian sekamar sekamarnya sekampung sekantong sekantornya
  sekaranglah sekarangnya sekati sekecil sekejap sekeliling sekelilingmu sekelilingnya
  sekeping sekeranjang sekerja sekiranya sekota sekotak sekretaris sekretarisnya sekrup
  seksi sektor sekuat sekujur sekumpulan sekurang sekutu sela selada selagi selamanya
  selamatan selamatkan selang selanya selarut selebihnya seleksi selembar selendang
  selengkapnya selera seleranya selesaikan selimut selipkan selisih seliter selokan seluar
  seluas semacam semahal semakin semalam semalaman semangka semarang semasa semboyan
  sembuhlah sembunyi sembunyikan semenit sementara semestinya semprot semudah semula
  semurah senangnya senantiasa senapan senarai senat sendat sendok sengketa seniornya
  senmonka sentakan senter sentimeter sentral sentuh sentuhan senyap senyum seolah sepadan
  sepadat sepagi sepagian sepaham sepakat sepakati sepanas sepanjangnya separah separuhnya
  sepatah sepatuku sepatumu sepatunya sepatutnya sepedaan sepedaku sepedamu sepedanya
  sepekan sepele sependapat sependek sepenting sepenuh sepersepuluh sepertiga sepertiganya
  sepiring sepopuler seprai sepupuku sepupumu sepupunya seputar seragam serah serahkan
  serangkai serapan seratusan serbaguna serbet serbu serem sergey seri serigala seringnya
  seriously seriusnya sertakan sertifikasi serumah serunya serupa serverer serviced
  servisin sesaat sesalkan sesama sesamanya sesederhana sesering sesi sesiang sesingkat
  sesopan sesorean sesuka sesukanya sesulit sesungguhnya setahu setahuku setahunan setapak
  setelan setempat setengahnya setetes setia setidaknya setimnya setimpal setinggi
  setingkat setipis setir setor setoran setuju setujui setumpuk seumur seumuranmu
  seumurannya seutuhnya sewajarnya sewakan sewamu sewanya seyakin shanghai shapes shenzhen
  shiai shiftnya shinrai shoji shokkan shokushu shokuzen shortens shorui shown sialnya
  siangnya sichuan sidang sif signifikan sikapmu sikat silabus silence simpan simpanan
  simpang simpankan simpanlah simpul simpulkan simultan sinar sinematografi
  sinematografinya sinetron singa singgah singkatan siniar sinis sintetis sinyal sinyalnya
  sipil sirup sisa sisakan sisihkan sisilia sisinya sisipan sistemnya situasinya situs
  situsnya skala skalanya skeptis skhohl skormu skornya skripsi sks slang slavia slide
  slip slovenia smp sofanya sofia solid solusinya sopannya sopirnya sopo sorot sortis
  sosial sosialnya sosis southern spanduk spasi spazieren speakers specific speech
  spending spesialis spoiler sriwijaya stadion staf standar statistik statistiknya stava
  stempel stok stoknya strategi strateginya stres stronger strukmya struktural strukturnya
  studi stur suam suaminya suapan suaramu suasana suasananya subjektif subjungtif submit
  subsidi subtitel subtitle suci sudahi sudahkah sudahlah sudden sudi sudilah suhunya
  sukai sukanya sukarela sukses sukunya sumbang sumbangan sumbu sumpah sunda sungainya
  sungguhnya sungkan suntikan suntuk sunyi superlativ supermarket supermarkets supnya
  suratmu suratnya surel surelmu surelnya surga suriah suruh survei surya susahnya susul
  susulan susulkan susunya sutradara suvenir sweater sweatermu swedia swiss syam syaratnya
  syllables syukuran syukuri syutingnya tabir tablet tabrak tabungan tachiba tadinya
  tagalogmu tagalognya tagih tagihanmu tagihannya tahap tahapan tahapnya tahulah tahunan
  tahunmu tahunnya tahunya taisaku taiwan tajikistan tajuk takaran takbenda takhayul
  takhta taksinya taksiran takutkan takutlah takutnya tamannya tamasya tambahannya tambal
  tambang tampaknya tampil tampilannya tamunya tanam tanaman tanda tandai tandatangani
  tanduk tangani tangannya tangganya tanggap tanggapanmu tanggapi tanggung tanggungan
  tangkap tangkapan tangkis tanpanya tantangan tantenya tanya tanyai tanyain tanyalah
  taplak taraf targetmu tarian tarif tarifnya tarikan tariklah taruhan taruhlah tasku
  tasmu tasnya tatanan tatanggapin tatra taufik tautan tawa tawar tawarannya tawarkan
  tebakan tebakanmu tegang tegaskan teguh tehlah tehmu tehnya teika tekankan teknik teknis
  teknisi teknisinya teknisnya teko teksnya telaah telah telak telan telanjur telapak telc
  teleponan teleponlah teleponnya teleserye televisinya telinganya teliti teluk telunjuk
  telur telurnya telusuri temani temanmu temanya tembok temboknya tembus tembusan
  tempatkan tempatku tempatmu tempatnya tempel tempelan tempelkan templat tempuh temukan
  tenaga tenagamu tenda tendang tendanya tenggang tenggara tenggatnya tenggelam
  tenggorokan tenggorokanku tenggorokanmu tenggorokannya tentangmu tentangnya tentukan
  tentunya tenunan teori tepatnya tepi terakhirmu terakhirnya terampil terancam terang
  terangan terangkan teras teratasi terbagi terbaikmu terbaiknya terbakar terbantahkan
  terbantu terbanyak terbaring terbaru terbasah terbata terbawa terbawah terbayar
  terbebani terbelah terbentuk terbentur terberat terbesar terbesarmu terbesarnya
  terbicarakan terbit terbitan terbitnya terbuang terbuat terbukti terburuk tercakup
  tercantum tercapai tercatat tercecer tercinta terdaftar terdahulu terdampak terdampar
  terdapat terdekat terdekatnya terdidik terdingin terdiri terduga terganggu tergeletak
  tergelincir tergenang tergesa tergoda tergores tergoyahkan terguncang terhafal terhalang
  terhambat terhapus terharu terhenti terhindar terhindarkan teri teriak terimalah
  terimanya terindah teringat terinjak teriris terisi terjaga terjangkau terjatuh terjebak
  terjepit terjual terjun terkait terkasih terkatakan terkecoh terkejar terkejut terkemuka
  terkena terkenang terkesan terkilir terkini terkirim terkonfirmasi terkoreksi terkuat
  terkubur terkumpul terkunci terkuras terlaksana terlama terlampaui terlampir terlantar
  terlarang terlatih terlebih terlelap terlempar terlepas terletak terlewat terlibat
  terlihat terluka terlupa terlupakan termahal termal termometer termuat termuda ternak
  terorganisir terowongan terpadu terpakai terpaksa terpaku terparkir terpaut terpelajar
  terpeleset terpendek terpengaruh terpenting terpentingnya terpenuhi terpercaya
  terperinci terpisahkan terpukul terpusat terputus tersamar tersambung tersampaikan
  tersandung tersangka tersangkut tersayang tersembunyi tersendiri tersentuh tersenyum
  tersenyumlah terserah tersibuk tersinggung tersingkap tersisa terstruktur tersulitnya
  tersumbat tersusul tersusun tertabrak tertahankan tertanam tertanggal tertarik tertata
  tertawakan tertebak tertekan tertib tertidur tertimpa tertinggal tertipu tertulis
  tertulisnya tertunda terukur terulang terurai teruskan terutama terwujud tesmu tesnya
  tested tetanggaku tetanggamu tetapkan tetaplah tetapnya tetep tetes tewas textile
  thailand throughout tht tiada tibalah tidakkah tidaknya tiduran tidurlah tidurmu tiket
  tikungan timbangan timbul timku timnya timpang timun tindahang tindih tinggali
  tinggalkan tinggallah tingginya tingkatan tingkatannya tionghoa tiongkok tipikal tips
  tipsnya tipu tiri tiruan tirukan tirulah titipan titipkan tivi tobias toilet toiletnya
  tokoh tokohnya tokonya tolak tolaklah toleransi tolok tomatnya tonjolkan tonpuku tonton
  tontonlah topan topiknya topinya totalnya trabahong tradisi traditional tranquillement
  transaksinya transit transkrip trik triknya trinke triwulan troli tropis trotoar truk
  tuangkan tuanya tubuhmu tubuhnya tugasmu tuh tuhan tukangnya tukar tula tulislah tulismu
  tulisnya tumbang tumbuh tumbuhan tumpah tumpangan tumpuk tumpukannya tumpul tunainya
  tunawisma tunduk tunggakan tunggalnya tunggulah tungkai tungkunya tunjangan tunjukan
  tunjukin tunjukkanlah tuntasnya tuntutannya turki turunin turunkan turunlah turunnya
  tusukan tutupkan tutuplah tutupnya tutur uang uangku uangmu uangnya ubahlah ucap
  ucapanmu ucapannya udah udahlah udaranya uji ujianmu ujilah ujungnya ukraina ukur
  ukuranmu ulangan ulangnya ulasan umm umumkan umurku undakan undang undangannya unduh
  undur unggahan unggul ungkapannya unik universal universitasnya untaian untukku untukmu
  untuknya untung untunglah untungnya unusually upah upahnya upaya uraian uraikan urat
  urban urdu urus urusan urusanmu urutkan urutnya usahakan usahamu usahanya usang usati
  usciti usg ushi usia usianya ustaz usual usulan usulanmu usulannya usulkan usulmu
  usulnya utamamu utc utilitas utuhnya vaksin variabel vegetarian venivo veranos
  verifikasi verranno versinya versus victoria videonya visanya visual vlog volumenya
  voting wacananya wadah waduk wafel wahai wajah wajahnya wajan wajibnya wakil waktuku
  waktunya walaupun wang wangi warga warganya warsawa wartawannya warungnya waspada
  waspadai wast wastafel watak wawancaranya web wechat weker wewenang wifinya wihara wijen
  wilayah wilayahnya wina wisatawan wkwk wol woy wreda wujud xiao xinhua yakin yasmin
  yayasan yerusalem yoga york youtube yth yuan yunani yunaninya yurisdiksi zaitun zhang
  zhongshan zhou
`;

function kataDaftar(teks: string): Set<string> {
  return new Set(teks.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 1));
}
const SET_ID = new Set([...kataDaftar(LEKSIKON_ID), ...kataDaftar(TAMBAHAN_ID)]);
/* Terpisah dari SET_ID dan TIDAK dipakai modul Inggris: prosa Indonesia penuh
   serapan Inggris ("member", "meeting"), dan untuk modul Inggris kata begitu
   justru bahasa targetnya. Modul Inggris sudah punya LEKSIKON_EN sebagai
   penimbang. */
const SET_ID_V3 = kataDaftar(LEKSIKON_ID_V3);

/* [ebook-jaga-bahasa-en-v1] Leksikon Inggris — bukan untuk membungkam, tapi
   untuk MEMBEBASKAN.

   Penjagaan di berkas ini bertumpu pada satu asumsi diam-diam: bahasa target
   punya huruf yang tak dipakai bahasa Indonesia, jadi `kataTargetJelas` selalu
   punya bukti tandingan. Bahasa Inggris mematahkan asumsi itu — ia ditulis
   dengan huruf Latin polos, tanpa satu pun aksen. Akibatnya, satu kata serapan
   di tengah kalimat Inggris ("Is there a bank near here?") membuat seluruh
   klausanya terbaca Indonesia, dan kalimat yang justru mau didengar siswa jadi
   bisu. Daftar ini yang mengembalikan keseimbangannya: kata yang ada di sini
   dianggap bahasa target, sekalipun ejaannya sama persis dengan kata Indonesia.

   Diperas dari isi modul oleh `scripts/leksikon-id-ebook.mjs`, dari ruas yang
   TIDAK MUNGKIN berbahasa Indonesia. Jalankan ulang skripnya tiap kali modul
   Inggris berubah, jangan menambah kata dengan tangan. */
const LEKSIKON_EN = `
  about accountant afraid afternoon again ago agree ahead airport all allergic alone
  already always am amazing an and andi angry anna any anyone anything anyway apple
  appointment are aren around art as asia ask assistant at ate aunt autumn away back bag
  bags bandingkan bank bathroom be beach because bed bedroom bedrooms beef been behind
  believe berpikir better between big bigger bigs bill bit blue boiling book books bored
  boring born bought boy bravo brazil breakfast bridge bring brother brothers brought
  brush budi bus buses businessman busy but buy by bye call called calling campus can
  cannot car card care catch caught chair cheap cheaper check chef chicken chickens child
  children childs chili chinese church city class classes clean cleaning clock close
  cloudy coffee cold color colour come comfortable company computer congratulations cook
  cooking cool corner cost could country course cousin cow cross crowded cup cupboard cut
  dad dalam dance dark daughter david day days deal degree degrees delicious deliveries
  delivery deni desk did didn dimulai dinner dishes do doctor does doesn doing don door
  double down downtown draw drawing dressed drink drinks drive driver driving dry early
  earn earns eat eating eats economics eight eighth eighty eleven else engineer english
  enjoy enough eraser espresso even evening evenings ever every everyone everything
  exactly exam excited exciting excuse exhausted expensive factory fall family fan far
  farmer fast father february fif fifteen fifth fifty film films fine finish first fish
  fishing fitting five fix floor fog food foot football for forget forty four fourth free
  freezing friday fridays friend friends from front full furniture games garage garden
  gardening gave get getting girl give glad glass glasses go going golf good goodbye
  granddaughter grandfather grandmother grandson great green ground guitar had half
  hanging happen happening happens happy hard hardly has hate have having he hear hello
  help helping her here hers hey hi hiking him his history hit hmm hobby holiday holidays
  home hometown honest hospital hot hotel hour hours house housewife how humid hundred
  hungry hurt hurts husband idea ill imagine in indian indonesia indonesian ing inside
  interested interesting is isn it jakarta jam january japan japanese jeans job journalist
  july just kalimatnya keep key kind kitchen knee knife know language languages large last
  late later latte lawyer leave left lesson let letter lightning lights like likes listen
  listening little live living ll long look looking looks lot love lovely loves lucas luck
  lunch ma machine machines make making malay man many map maps march market married maybe
  me mean meat medicine medium meet meeting mei men menggantung menu met metres midday
  midnight million mine minus minute minutes miss moment monday money month more morning
  mosque most mostly mother motorbike movie much mum museum music must my name names near
  need neighbour neighbours nephew nephews never new next nice niece nieces night nine
  nineteen ninety ninth no nobody noise noon normal not notebook nothing novels now number
  nurse of office officer often oh ok olahraga old older omw on once one ones onion onions
  only open opposite or order our ours out over page pair pairs parents park part past pay
  pelafalan pen pencil people pepper perfect person pharmacy phone photo photos piece
  pieces pig place plan plans play played playing please police poor pork portuguese post
  practise pray pre prefer present price programmer put quarter question quiet quite rain
  rained raining rains rainy rarely re read reading ready really recommend remember rent
  repairman repeat restaurant restaurants rice ride right rina rio road room rooms running
  rupiah sad safe said sale sandwich santoso sarah saturday save saw say says school
  seafood season seasons seat second sedangkan see sell sent september serious seven
  seventy share she shirt shirts shoes shop shopping should show shower sick sing
  singapore sir sister sit six size sky sleep slowly small snow snowing so socks soldier
  some someone something sometimes son sons soon sorry sounds speak special spell spicy
  spreadsheets spring square stand start station stay stayed staying stop store storm
  straight strange street student students studies study studying sugar summer sun sundays
  sunny supermarket surabaya sure surfing surprised swam swim swimming table tables take
  taking talk talking tas taught taxi taxis tea teach teacher teaches teen teeth tell ten
  tenth term terrible thank thanks that the their theirs them then there these they things
  think third thirteenth thirtieth thirty this those though thought thousand three through
  thunder thursday ticket time times tired tiring to today together tom tomorrow tonight
  too touch tough traffic travel travelling tried trip trouser trousers try trying tuesday
  turn tv twelfth twelve twentieth twenty twice two type umbrella uncle under understand
  university until up us use usually vegetables very visit vokal wait waiter waiting wake
  walk walked wall wallet want wanted warm was washing wasn watch watched watching water
  way we weather wednesday week weekend weeks welcome well went were weren wet what when
  where which white who whose why wife will window windy winter with woman women won word
  work worked working works world worried worry wow write year yes yesterday yet you young
  younger your yours zero
`;
const SET_EN = new Set(kataDaftar(LEKSIKON_EN));

/* [ebook-pengantar-en-v1] Modul EDISI INGGRIS (judul produk "… (English
   Edition)", mis. Swedish 101 sv-a1-en): bahasa targetnya tetap Swedia, tapi
   terjemahan, terjemahan harfiah, dan penjelasannya bahasa Inggris. Seluruh
   penjagaan di bawah menimbang "kata ini bahasa Indonesia?", dan kata Inggris
   tak dikenal daftar Indonesia — jadi tanpa ini "the verb always comes second"
   diketuk lalu dibunyikan berlogat Swedia. Untuk modul begini daftar
   Indonesianya DIGANTI daftar ini, diperas dari prosa modul edisi Inggris oleh
   scripts/leksikon-id-ebook.mjs (keluaran LEKSIKON_PENGANTAR_EN). Jangan
   menambah kata dengan tangan — jalankan ulang skripnya. */
const LEKSIKON_PENGANTAR_EN = `
  aah abandoned abbreviations abilities ability abito able about above abrem abroad
  abruptly absolute absolutely absorb absorbed abstract abundant ac academic accent
  accents accept acceptance accepted access accessories accident accidentally
  accommodation according account accountant accounts accuracy accurate accusation
  accusing accustom accustomed accustoms achchhaa achchhii ache aches achetons achieve
  achievement achievements aching achtenveertig achtundsechzig acknowledge acquaintance
  acropolis across act acting action active actively activities activity actor actors
  actress acts actual actually ad adapt adaptation adapted add added adding additional
  addormentano addormenti address addresses adds adjectives adjust adjustable adjustment
  adjustments adjusts administration administrative admiration admire admission admit
  admits admittedly admitting adopt adopted adored ads adults advance advanced advantage
  adventure adverb adverbial adverbials adverbs advertised advise advises advising advisor
  adze affair affect affection afford afraid after afternoon afternoons afterward
  afterwards afterword again against age agencies agency agent agera ages aggressive ago
  agra agree agreed agreeing agreements agudo ahead aht aid aim aimez aiming air airplane
  airport airports aisle akkusativ alacak alacaklar alanya alarm alarms alcohol alcoholic
  aldi alexandria algarve alien align alike alipay alive alkoholu all allege alleged
  allegedly allergic allergies allergy alley allow allowance allowed allowing allows
  allting almocei almonds almost alone along alongside aloud alphabet alphabetical
  alphabetically already also altar alternate alternative although altogether always
  alzarci alzi amazement amazing amazingly ambitious ambulance ambush amendment america
  americans amiche amid amman among amounts amplifier amsterdam amused amusement amusons
  an analog analyses analysis anar anatolia anatomy ancestor anchor anchors ancient and
  andat andi angle angles anglii angrily angry animate anime anklagelser anlamazlar
  anlarlar anniversary announces annoyance annoyed annoying annoyingly annual anonymous
  another answer answered answering answers antalya anthem antibiotics any anymore anyone
  anything anytime anyway anywhere aorist apanhei apart apartment apartments apiece
  apologies apologize apologizing apology apostrophe app appeals appear appeared appearing
  appears appels appendix appetite appetizing apple apples applicable application
  applications applies apply applying appoint appointed appointment appointments appraisal
  appreciate appreciated approach approved approximately apps aprendes apron arab arabic
  arabs arance archipelago architect architecture are area areas aren argue argues arguing
  argumentation arguments armchair arn aroma around arrange arrangement arrangements
  arranging arrest arrested arrival arrivals arrivano arrivat arrivati arrive arrived
  arrivent arrives arriving art article as asia asian aside ask asked asking asks asleep
  asok assault assemble assembled assembly assert assertion assesses assessment
  assessments asset assignment assimil assistant assistants association associations
  assume assumes asthma asunder at ate athena athens attach attached attaches attaching
  attachment attempt attending attention attentive attic attitude attitudes attraversa
  audible audience aunt auntie aunts austria authentic authorities authority authorized
  automatic automatically autre autumn auxiliary availability available avbokad avenue
  average aviv avoid avoided avoiding avoids avons avseende await awake awards aware away
  awe awesome awful awfully awkward awkwardness axe ayudarme baby back backbone backfires
  backpack backup backward backwards badar badge badly bag baggage bags baguette baht
  bairro baitu baixa bakalau bake baked baker bakeries bakery baking balcony ball balloon
  ballooning balloons ballot ballpoint bambang bambini banana bananas banche band bandon
  bangkok bank banknote banks bans barbecue barbecues barbers barely bargain bargaining
  bargains barnet barrel bars basement basic basically basil basis basket basque bass bath
  bathe bathed bathroom battery bazaar be beach beaches bean beanie beans beard beaten
  beats beautiful beauty became because become becomes becoming bed beddo bedroom bedrooms
  bedsheet bedtime beef been beer beet before beforehand beg began begin beginner
  beginners beginning beginnt begins begonnen begun behalf behave behaves behaving
  behavior behind behts beijingers being beings beklemeyecekler beklerim bekleyebilirim
  bekleyecekler bekleyeceksiniz bekliyoruz belgium belief believe believed believes
  believing belli belly belong belonging belongings belongs below belt bench bending
  beneath benefits berries beside besides beslutat best betaalt betona bets better between
  bevendo beverage beware beyond bg bhaiya bianca biblical bicycle big bigger biggest bike
  biked bikes bilhetes bilirsiniz biljetterna bill billed bills bilmezsiniz bilmiyorsun
  bind bindim binding binds bindu binyanim biodiversity biological bion birch birds
  birgitta birth birthday birthdays biryani bismillaahir bisogno bistro bit bite biting
  bitter black blackboard blamed blaming blank blanket blankets blanks blazer bleeft blend
  blends bless blessed blesses blessings blij blind block blocking blocks blogs blood
  blouse blow blown blows blue blunt blur blurred board boarded boards boast boat boats
  bob bodies bodily body bog boil boiled bokningsfunktionen bokningsnummer bolt bone
  bonfire bonfires bonn boohk book bookcase booked booking bookmarking books bookseller
  bookshop bookstore boos boost booth boots border boring born borrow borrowed borrowing
  borrows borscht boss bosses bossy bostaden both bother bothered bothering bothers
  bothnia bottle bottom bought boulevard bounce bounces bound boundaries boundary bouzouki
  bowing box boxes boy boyfriend brabant bracelet bracket brackets brag bragging brain
  brake brakes branches branching brandewijn brasileira brave braver brazil brazilian
  brazilians breach bread breaded break breakdown breakfast breaks breakthrough breast
  breath breathe breathy brew brewed brick bridal bride bridesmaid bridge briefly bright
  bring bringing brings brit british broad broadcast broadcasting broadcasts broader
  broken bron broth brother brothers brought brown browse brudens brush buckwheat buddhist
  buddy budgets budi budiego bue buffalo buffer buh build building buildings builds built
  bump bumping bumps bunch buns burden bureaucratese buried burned burning burst bus busan
  buses bush busier busiest busily business businessperson bustling busy but butang
  butcher buttered button buttons buy buying buys buzz bweh bwohn by byggde bygget byggs
  byzantine cabbage cabin cabinet cafeteria cairo cake calculate calculated calculates
  calculation calculator calendar calendars caliph call called calligraphy calling calls
  calm calming calmly came camera camille camp camper campus can canal cancel canceled
  canceling cancellations cancelled cancels candidate candidates candlelit cannot cans
  cansados canteen canyon canzoni cap capital capitalization capitalize capitalized
  capitals cappadocia capture car carbon carbonara carbonated card cardamom cards care
  cared carefree careful carefully carelessness cares caretaker cargo caring carlos carmel
  caros carpet carriages carried carrier carries carrots carry carrying cars cart carton
  cartons carved case cash cashier casting casually catch catches cathedral catorze cattle
  caught causative causes caution cautious cave cedilha cefr ceiling celebrate celebrated
  celebrating celebration celebrations cell cellar cells celsius center centers
  centimeters central centuries century ceo cereal ceremonies ceremony cerrados certain
  certainly certainty certificate certificates certification cervejas cf chain chains
  chair chairing chairman chairperson chairs chaises challenge chance chances chandrabindu
  change changed changes changing channels chaos chaotic chaotically chapter chapters
  chaque character characteristic characters charge charger charges charity charming chase
  chasing chat chatted chatty chce cheap cheaper cheapest cheaply cheat cheated cheating
  check checked checklist checkout checks checkup cheek cheerful cheers cheese cheesecake
  chegam chegaram cheshch chess chest chew chh chiavi chicken chickens chief child
  childhood children chile chili chinese chipkaart chitchat chocolate chocolates choice
  choices choir choisissez choisissons choose chooses choosing chopped chopstick chorus
  chory chosen christian christians christmas chronic chronological chst cht chuhk chunk
  chunks church churches ciare ciemno cigarette cinemas cinnamon cinquenta circle
  circumference circumstances circunflexo cities citizens city civil claim claimed claims
  clams class classes classic classics classified classifieds classifier classifiers
  classique classmate classmates classroom classrooms clause clauses clay clean cleaner
  cleaning clear clearer clearing clearly cleft clefts clerk clever cleverness click
  client clients cliff climate climates climb climbed climbing clings clinic clinics clip
  clipped clock clocks close closed closely closeness closer closes closest closet closing
  closings cloth clothes cloud clouds cloudy club clue clueless clues clumsy cluster
  clusters coalition coast coasts coat coats cod coffee coffees coherent cohesion cohesive
  coinage coincidence coincides coined coins cold colder coldest colds collared colleague
  colleagues collect collecting collective collects college collides colliding colon color
  colored colors column columns comb combination combine combines combining come comes
  comfort comfortable comforting comforts coming comma commands commas comments commission
  commissioner commit commitment commits committee common commonly communities community
  commute companion company comparative comparatives compare compared compares comparing
  comparison compartment compensate compensation compile compiled complain complained
  complaining complaint complaints complete completed completely completeness completes
  completion complex complicated complication compliment complimenting compliments
  components compounds compramos comprehensible comprehension comprend compress compromise
  conceal concede concentrate concept concern concerned concerning concerns concert
  concerts conclude conclusions concrete concretely condensed condescending condition
  conditional conditioner conditioning conditionnel condizionale condo condolences
  conference confidence confident confirmation confirmed confirming confirms conflict
  confuse confuses confusing confusion congestion congrats congratulate congratulating
  congratulations conheces conjugate conjugated conjunct conjunction conjunctions
  conjuntivo connect connected connection connector connectors connects conquer conscious
  consecutive consensus consequently consider considerate consideration considered
  considering consistency consistent consistently consists consolation console consolidate
  constant constantly construct construction constructive consultancy consultant
  consultation consulting consumers consuming consumption contact contacted contacts
  contagious contain container containing contains contaminated contemporary content
  contents context continental continents continue continued continues continuing contract
  contracted contractions contracts contradict contradicting contrary contrast contribute
  contributed contribution control convenient conventions conversation conversational
  conversations conversion convincing convincingly convivial cook cookbooks cooked cookies
  cooking cooks cool cooperative cooperatives cope copenhagen copy copying cords cores
  corner correct corrected corrections correctly corrects correspondences corridor cost
  costly costs costume cottage cottages cotton couch couche cough coughing could couldn
  council councillor count countable counted counter counteract counterargument
  counterarguments counterpart counterparts countless countries country countryside counts
  county couple coupled courier course courtesies courtesy courtyard cousin cousins
  couvert covenant cover covered covering covers cow cowardly coworker coworkers cows cozy
  crack cracked cracks craftsmen crafty crammed craving crayfish craziest crazy cream
  created creative creature credit creepy crete cricket cries crime crisp criteria
  critical critically criticism criticize critics croissants crore cross crossed crosses
  crossing crossroads crosswise crowd crowded crowds crown crowns crucial cruel crutch
  crying crystal cuarta cube cucumbers cue cues cuestan cuisine cultural culture cultures
  cupboard cure curious curled curling curls curly currencies currency curries curry
  curtain curved curves cushion custom customary customer customs cute cutesy cutlet cuts
  cutter cutters cutting cv cvs cycle cycled cycling cyclists cyklarna cyrillic czasu
  czekamy dad dagsljus dahn daily dakh damage damp dams dana dance danced dances dancing
  danes danger dangerous dangk dangkt danish dared dares darfst dark darkest darkness
  darsu dashboard dashes date dates dativ daughter david day daydream daydreaming
  daydreams days daytime dead deal dealing deals dear dearer death deathbed debate debates
  debit debt decade decades decent decide decided decides deciding decision decisions
  decisive deckare decked declaration declare declaring decline declined declines decode
  decoded decoding decorate decoration decrease decreased dedicated deduct deducted
  deductible deducts deep deeper deeply dees defeat defeats defend defensive definitely
  definiteness deflect degree degrees dehs deinen delay delayed delete delhi deliberate
  deliberately deliberation delicious delighted delivered deliveries delivering delivery
  demand demanding demands demokratin demonstrationen demonstrative denies denk denmark
  denominations dense denser densification dentist dentists deny denying depart departed
  departing department departs departure departures depend dependent depending depends
  deposit deprecation depressing deprioritized depth derived descend descent describe
  described describing descriptions descriptive desert deserve deserves designed designer
  desire desk desks despair desperate despite dessert desserts destinations destroy
  destroyed detail detailed details detective determined devanagari develop developer
  developing development deviation devote devoted dezanove dezassete dezember diabetes
  dialect dialects dialogues diarrhea diary dictate dictionaries dictionary did didn died
  dietary differ difference differences different differently differs difficult
  difficulties difficulty digit digitally digits diligent diligently diminutive dine dined
  diners dines dinlenmesi dinner dinners dioxide diphthong diplom diplomatic
  diplomatically direction directions directly director dirty disagree disagreement
  disappear disappeared disappearing disappears disappoint disappointed disappointment
  discharge discharged discomfort discount discounts discourage discouraged discover
  discovered discovering discovers discuss discussed discussion disease diseases disguise
  dish dishes dishwasher disinterest diskas dislike disliked dismiss display displayed
  disposable disposed dissatisfaction dissatisfied distance distances distancing distinct
  distinction distinctive distinguish distinguished distinguishes distractions district
  districts distrusted disturb disturbing disturbs ditto dive diversity divide divided
  divides divorced diy dizem dizzy do doable dobr dobre doctor document documentaries
  documents dodging doer does doesn dog doi doing doktorsunuz dollars don done dongzhimen
  door doorbell doors doorway dooy dorm dormem dormendo dormitory dorms dot dote double
  doubled doubles doubt doubtful doubts down download downstairs downtown downward dozen
  dozens draft dragging drama dramas dramatically drank draped draw drawer drawers drawn
  draws dream dreaming dreams dreizehn dress dressed dresses dressing drew drier drift
  drifted drill drilled drilling drills drin drink drinker drinking drinks dripping drive
  driven driver drivers drives drop dropped dropping drowsy drug drugs drugstore drunk dry
  ds duck dude duermen duitsland dull dumplings duration during dusk dutch duties duty
  duurder dwellers dying dyka dyohs dze each eager eagle ear earlier early earn earner
  earnest earns earring ears earth ease easier easiest easily east easter eastern easy eat
  eaten eateries eating eats eaux echo eco economic economical economics economy ed edge
  editor editorial editorials education eel ef effect effective effort effortlessly egg
  egyptian eight eighteen eighteenth eighth eighties eighty either elaborate elbil eldest
  election elections electric electricity elegant element elementary elements eleni
  elevate elevated elevator elevators eleven eleventh ellada else elsewhere email emailed
  emails embarrassing embassy emergency emission emit emma emotion emotional emphasis
  emphasize emphasized emphatic employee employees employer employers employment emptied
  empty emptying enchanted enclose encouragement end ended ending endlessly ends energetic
  energy engaged engine engineer english enjoy enjoyable enjoyed enjoying enjoyment enl
  enormous enough enrich enroll enrolling ent enter entered entering enthusiastic entire
  entirely entitled entrance entrepreneur entrust entry envelope envelopes envious
  environment environmental envy eo episode episodes epsilon equal equality equally equals
  equating equator equipped equivalent erased eraser ergative ermee errand errands error
  escalators escape escapes esp especially espera essay essential essentially established
  estimate estimated estimating estuda estudantes estudas estudaste estuvimos etc eternal
  etiquette etje etti europe european europeans evaluate evaluated evaluating evangelist
  evaporate evaporates evasive evdeydim even evening evenings evenly event events
  eventually ever every everybody everyday everyman everyone everything everywhere
  evidence evident evidently evil evler exact exactly exaggerate exaggerated exam examine
  examines example examples exams excellent except exception exceptions excerpt excess
  excessive excessively exchange exchanged exchanging excited exciting exclaim exclamation
  exclamations exclude excluded excuse excused excuses excusing exercise exercises
  exercising exhaust exhausted exhausting exhibition exist existed exists exit exotic
  expand expect expectation expected expecting expects expense expensive experience
  experiences expiry explain explained explaining explains explanation explanations
  exploiting exposed express expressed expresses expressing expression expressions
  extended extent extra extremely eye eyes eyewitness ez fabric face faced faces facing
  fact factory facts factual fades failed failing fails faint faintest faintly fair fairly
  fairy faith faithful fake fallback fallen falls false familiarity familiarize families
  family famous famously fancy fantastic far fares farewell farewells farm farmer farming
  farther farthest fashioned faster fastest fat fatal father fattade fault faults faulty
  faux favorite favorites favors fear fearsome feast feather feature features feb fechada
  fed feed feeding feeds feel feeling feelings feels fees feet felaktigt fell fellow felt
  fem female feminine fence fermented ferries ferry festen festivals fetch fetched fever
  few fewer fewest fey fiction fictional fietst fifteen fifteenth fifth fifty fig fight
  fighting fights figure figures file filed filen files fill filler filles fills films
  filter filtered finally finance find finding finds fine finest fingers fingertips fini
  finisce finisci finish finished finishes finishing finite finito finland finlandismer
  finlandisms finnish fiori firade fire fireworks firing firmer firmly first firstly fish
  fished fisherman fishmonger fit fitr fits fitted fitting five fives fix fixed fixes
  fixing fixture fizzle fizzles fizzy flag flagged flags flap flaschen flat flatly
  flatmates flattens flatter flattery flavor flavoring flavors flaw flea fleeced flew
  flexibility flexible flickor flickorna flies flight flights flik flip flipped flipping
  flips flood flooded flooding floods floor florence flour flow flower flowers flowing
  flown flows flu fluency fluent fluently fluids flustered flux fly flyget flying flytande
  flyttades flytten focus fog foggy fohn folded folder folding follow followed following
  follows fond foo food foods foon foot football footnote footwear for forbid forbidden
  forbidding forbids force forced forces forcing forecast forecasts foreign foreigner
  foreigners forenoon forest forever foreword forget forgetful forgets forgetting forgive
  forgiven forgives forgot forgotten fork form formal formality formally format forme
  formed formerly forming forms formula formulas formulation forskningen forth fortunately
  fortune forty forward found foundation fountain four fourteen fourth fow fox fragments
  fragrant frame framework frank frankly free freedom freedoms freely frees freeze freezes
  freezing french frequency frequent frequently fresh fretta friday fridays fridge friend
  friendlier friendliest friendliness friendly friends friendship fries friesland
  frightening frisian friskare fritt fritters frog frogs from front fronte fronted frost
  frowning froze frozen fry fshyst fshystko fuera full fuller fully fume fun functions
  fund funnel funnier funnily funny fur furigana furnished furniture further furthest fuse
  fused fusha fusion fuskade fuss futur future futuro fyool gadol gahl gain gains gallery
  game games gamma gap garbage garden gardening gardens gargle garlic garpu gasoline gat
  gate gather gathered gathers gatunamn gave gavel gayts gear geer gegeven gehouden
  gekauft gekeken gekregen gelegen geluisterd geluk gender gendered genders generalize
  generally generations generosity generous genomen genomgick genre gentle gentleman
  gentler gentlest gently gentrification genuine genuinely georgian gereden german germans
  germany germs gestaan gestudeerd gesture gestures gesucht get gets getting gevaarlijk
  gewandeld gewartet gewoond gezeten gezocht ghost giacche giant giapponese giardino giare
  gideceksin gidemedi gifts gig gigs gillat gioca giocano giochiamo girl girlfriend gist
  gitmemiz gittin giulia give giveaway given giver gives giving gladly glance glances
  glancing glass gled glide glided glides glitters gloomy gloss glossary gloves glowing
  glue glued glues gneisenau go goal goals goat goddess godis goes going gold golden gone
  gongbao good goodbye goodbyes goodness goods google goong gostamos got gothenburg gotten
  gotuje government governments grab gracefully grade graded gradually graduated
  graduating graduation grahn grahnd grammar grammatical grams granada grandchild
  grandchildren granddaughter grandfather grandma grandmother grandpa grandparent
  grandparents grandson granite granny grant granted granting grape grapes graph grasp
  grateful gratitude gray greasy great greater greece greek greeks green greens greet
  greeted greeting greetings greets greta grew grieving grilled grips groan groceries
  grocery groningen groom groomsman groszes ground grounds groundwork group grouped groups
  grow growing grown grows growth grumpy guangdong guangzhou guapas guaranteed guess
  guessable guessed guesses guessing guest guesthouse guesthouses guests guide guidebook
  guided guidelines guides guilt guitar guitarist gulf gum guy gyeongbokgung gym gymkortet
  gyros haaluka habillez habit habite habits had hadn haeundae hagabion haggle haggled
  haggling hagia hague hahaha hahlp haifa hailing hain hair haircut hairdresser hairs
  hakan halal halant half halfway hall hallmark hallway halting haltingly halves
  halvtidssamtal hamza hamzat handbag handed handful handing handle handled handles
  handmade handout hands handshake handsome handwriting handwritten hang hangeul hanging
  hangs hanna hanoi happen happened happening happens happiest happily happiness happy
  harakat harbor hard harden hardens harder hardest hardly hardware hardworking harmony
  harms harsh harsher harshest has hashanah hasn hassle haste hatch hate haunt have haven
  having hayarkon he head headache headaches headed header headings headlines heads
  headscarf heal healing health healthy hear heard hearing hears heart heartland heat
  heated heating heaven heavier heavily heavy hebrew hedge hedged height hello helmet help
  helped helpers helpful helping helps helsingfors henrik her herbs here herring hers
  herself hesitant hesitate hesitating hesitation heureuses hey hi hidden hide hides
  hiding hierarchies high higher highest highlight highlighting highly highway hijos hijri
  hike hiking hill hills hilly him himself hindi hindsight hindu hinduism hinges hint
  hints hiragana his hissier hissing historic historical hits hmm hoarse hobbies hohg hold
  holding holds holi holiday holidays holland hollow holm home homeless homemade homemaker
  homens homes hometowns homeward homework honest honestly hong honor honorable honorably
  honored honorific hont hook hop hope hopeful hopefully hopeless hopes hops horizontally
  horror hospital hospitality hospitals host hostel hostile hosts hot hotat hotter hottest
  hour hourly hours house housemate housemates houses housewife housing how however hrst
  hrt hug huge hugely huggits hugs huh hum human humble humbly humid humidity hummus hunch
  hundarna hundred hundreds hundredth hung hunger hungry hunt hunter hunting hurdle
  hurried hurries hurry hurrying hurt hurts husband hygiene hyphen hypotheticals ic ice
  iced icicle icoca icy idea ideal ideally ideas identical identification identify
  idiomatic idioms ien if ignore ignored ih ilan ill illness image imagine imitate
  imitating imm immediate immediately immensely immigrant immigrants immigration immune
  imos impact imparfait impassable impatient imperative imperatives imperfeito impersonal
  implementation implicature implied implies impolite imponerar importance important
  importantly imposing impossible impress impressed impression impressions impressive
  improved improving improvise in inability inanimate incense incl include included
  includes including incoming incomprehensible inconvenience increase increased
  increasingly incredibly indeed indent independence independent independently india
  indian indians indicate indicated indifferent indigenous indirect indirectly indo
  indonesia indonesian indonesians indoneziyets indoneziyka indoor indoors inducing
  industrimark inexpensive infect infinitives inflect inform informal informally
  information informations informed ing ingredient ingredients ingrid inhabitant
  inhabitants inheritance inherited injure injured injury inner innermost inquiries
  inquiry insane insecure inseparable insert inserted inserts inside insincere insist
  insisting inspect install installed installing instantly instead instinct instincts
  institute institution institutions instruction instructions instructor instrument
  instruments insult insurance insured intact intelligence intelligentes intelligible
  intend intending intense intensifier intensifiers intensify intention intentions
  interaction interactive interchangeable interchangeably intercity interest interested
  interesting interests internal international interns internship interpreters
  interrogation interrupting interruptions intersection interview interviewed interviews
  intimate into intonation intressanta introduce introduces introducing introduction
  introductory invalid invent inversion invert inverting invest invested investigate
  investigates investigation investing invitation invitations invite invited invites
  inviting involves iram iron ironic irony irritated is isan iskender islamic island
  islands isn iso israel israeli israelis issimo issue issues istanbul it italian italiane
  italians italic italy italyanets italyanka itchy item items its itself ivan ivrit jacht
  jacket jaffa jaipur jakarta jammed jana janitor jansen jante jantei japan japanese
  japonii jar jargon jazeera jealous jerusalem jetty jewish jj jlpt job jobbigt jobs jog
  johan johansgatan john johns johr join joining joins joint joints joke jokes joking joue
  journalism journalist journey journeys jr judges judging judgment jug juice juicy jumbo
  jump jumped jumper jumping jumps junction junior juniors junk just justify jye jyeny
  kaen kahf kaifa kaiwa kakaotalk kakarimashita kalacak kale kalemim kallad kallast kamraa
  kana kanji kannst karachi karaoke karl karna kars katakana kav kay kayaks keen keena
  keep keeping keeps kefir keigo keju kelnerem kemeja ket ketjap key keyboard keyboards
  keys kg khana khao khavitah khaya khis khuh kick kid kids killed kilogram kilometers
  kilos kimim kinci kind kinderen kindergartner kindly kindness kinds kiosks kiria kiss
  kisses kitchen kitchens kk klarat klarna kleines klook klopt knees knew knife knit
  knitted knocks know knowing knowledge knowledges known knows kollegor kolonaki kolorowa
  kong konjunktiv konstaterat kontakta kontroll kontrollerade kopia koppla korea korean
  koreans korsningen kortet kosher kramade kramar krankschreibung kristina kritiseras ks
  ktiv kudos kuhnt kultur kung kungfu kupujemy kurdish kurser kylan kyoto kyrk laan label
  labeled labeling labels lace lach lack lacking lactose ladder lady lahore laid laila
  lake lamb lame lamp lampor lamppost lamps land landed landlady landlord landlords
  landmarks lands landschap lane lanes language languages lanterns lap lappis laptop lard
  largas large largely larger largest larkaa larke lasagna lassi last lasted lasting lasts
  late lately lateness later latest latin laugh laughed laughing laughs laughter launch
  launched launching laundry laviamo lavish lavora lavorate law laws lawyer lay layer
  layered layering layers layout lays lazy lead leader leafy leak leaks lean leaning leans
  learn learned learner learners learning learns lease leash least leave leaves leaving
  lecture lecturer led leevr leeway left leftmost leftover leftward leg legal legendary
  legge leggendo leggi legitimate legs leisure lekarza lekarzem leksaker lekte lektionen
  lemon lend length lengthen lengthened lenient lenses less lesson lessons let lets letter
  letters letting lettuce levantine level levons liaison librarian library libri lidl lie
  lieblingsessen lies life lifeline lifesaver lifesavers lift lifted lifting light lighter
  lightest lightly lightning lights likable like liked likely likes likewise liking lilt
  lilting limburg limit limitation limitations limited lindholmen lindqvist line lined
  lines lingua lingue linguistics linguists linguo lining link linked linking liquid lisa
  lisbon list listed listen listened listener listeners listening listens listings lists
  lit liter literal literally literature liters litter little live lived livelier
  liveliest lives living ljudet ll load loads loaf loan loanwords local locals located
  lock lockar locked locks lodging lodz logged logic logical login logos lol london
  londoners lonely long longed longer longest longing look looked looking lookout looks
  loosely looser lopsided lord lose loses losing loss lost lot lots lottery lotto loud
  louder loudly lounge love loved lovely loves loving lower lowerable lowercase lowest
  loyalty lozenge lozenges ltd lubicie luck luckier luckily lucknow lucky luggage lump
  luna lunar lunch lunched lunchtid lundis lung lungs luxury lycklig lying lyrics macau
  machine machinery madam made mads maestro magic magnetic magnificent mahal mahshi maiden
  mailbox main maine mainly maintain major majority make makes makhberet making malades
  malas malay male malls manage managed management manager manages managing mandarin
  mandatory mangeons mangiano mangled mangoes manner manners manor many map mapping maps
  marble marbuutah marco margin marie marital mark marked marker market marketing
  marketplace markets marking marriage married marry masc mashallah masses master mastered
  mastering match matchen matches matching mate material math matte matter mattered
  matters mature may maybe mayores maypole mb meadow meal meals mealtime mealtimes mean
  meaning meaningful meanings means meant meanwhile measure measured measures measuring
  meat meatballs meatless medical medication medicine medicines medieval mediterranean
  medium meervouden meet meeting meetings meets megabytes mehmet meinem melted melts
  member members membership memorable memories memorization memorize memorized memorizing
  memory mend mensagem mentega mention mentioned mentions menu menus merchant merdeka
  merge merged merger merry meses mess message messages messaging messy metal metaphor
  meter meters method metropolis mexico michael micro microwave midday middle middot
  midnight midsummer mieszka mieszkamy might migration mikaela milan mild mildest mile
  milk million millions mimasen mimic mind mine mineral ming mini miniature minibus
  minimum minister ministers minor minority mint minute minutes miracle mirror miserable
  mishaps mishear misheard mislead misleads misplaced misprint mispronounced misread
  misreading misreadings miss missed missing misslyckades misstep mistake mistaken
  mistakes mister mistranslated misunderstanding misunderstandings misunderstood mittens
  mix mixes mixing mm mobile mobiles mobility modals model moderator modern modest
  modestly modesty module moisture molnen mom moment monastiraki monday mondays money monk
  monster monte month monthly months mood moods mooiste moor morbror more moreover morning
  mornings moroccan mortgage mos moshe mosque mosques most mostly mother mothers motivated
  motivation motor motorbike motorbikes motorcycle motorized mountain mountains mourning
  mouth mouths move moved movement movements moves movie movies moving mr mrs ms msg
  mubarak much mudei mug muggy muitos mulling multi multiethnic multilingual multiples
  multiply mumbai mumbling munich municipal municipalities municipality muscles muscovite
  museos museum museums mushroom mushrooms music musical musimy musing muslim muslimaat
  muslims muslimuun must mustache mustn mutton mutual mutually my myeongdong myndigheten
  myself naafidhatu nadar nagging nahl nahw najgorszy najmniejszy name named namely names
  naming nap napoli naquela narimashita narrate narrow narrowness narrows nasalized nassau
  nasty natation nation national nationalities nationality native natto natural naturally
  nature naturen nausea nauseous navigate navy nd ndirim near nearby nearer nearest nearly
  neat neater neatly necessarily neck need needed needing needn needs negate negated
  negating negative negatively negators negenennegentig negotiate negotiated negotiating
  negotiation negotiator negozi neighbor neighborhood neighboring neighborly neighbors
  neither nephew nephews nereli nerve nervous nesta neste netherlands network neut neuter
  never new newcomer newcomers newer newly news newspaper newspapers next neyen nhk nice
  nicely nicer nicest nickname nicknames niece nieces niemczech night nightgown nights
  nihonjin nikos nine nineteen ninety ninth niqqud nisba nittio noa nobody nod nodding
  node noires noise noisy nok nomimasen nominalization nominalizations none nong nonni
  noodle noon noord nor normal normally norrlanders north northeast northern northerner
  northernmost northward northwest norway norwegian norwegians nose nosiness nosy not note
  notebook notebooks noted notepad notes nothing notice noticeable noticeably noticed
  notices noticing notification notify notion noun nouns nova novas novels novos now
  nowadays nowe nowhere nuance nuclear nuhf number numbered numbering numbers numerals
  numerous nurse nursing nutritional nuts nutshell nyhetsartikel nyttiga obey obeys obj
  object objections objective obl obligation obliged oblique observation observed
  obsessively obsolete obstacle obstacles obtained obvious obviously occasion occasional
  occasionally occasions occupation occupational occupied occupy occurred occurrence
  ochtends odd oddest oddly of off offend offended offending offends offense offenses
  offensive offer offered offering offers office officer offices official officialdom
  officialese often ohsh oil oilier ointment ok okay okhotny okullar okulum okumuyor
  okuyabilirim old older oldest olive olives olle olympic olympics omelet omen on onaardig
  once one ones oneself ongoing onion onions onlara online only onn onto onward oont oops
  oosh open opened opener openers opening openings openly opens operas operators opinion
  opinions opportunity opposed opposite opposites oppressively option optional options or
  oral oranges orbit order ordered ordering orders ordets ordinal ordinary organic
  organizes organs original originally origins oroliga osaka ostrobothnia other others
  otherwise ottoman ough ought our ours ourselves out outdoor outermost outfit outfits
  outing outright outside outsider outsiders outskirts ov ova oven over overall overcast
  overconfident overdo overlap overly overnight overpraise overpriced overpromise
  overrides oversell oversleep overslept overtime overusing overwhelmed owe owl owls own
  owned owner owners owns oyoide pace pack package packaging packed packet packs pad
  paddled padlock page pages pagodas pahrl paid painful painkiller painless pains paint
  painted painting pair pairs pakistan palate pale pali palm palms pancake paneer panel
  panels pangrati panic panicking pants pao paper papers paperwork papua paragraph
  paragraphing paragraphs paraguas paranoia paraplyet parcel parentheses parents parked
  parkens parking parks parlando parlato parliament parliamentary pars parsley part
  partent participation participial participles particle particular particularly parties
  parting partings partit partizip partly partner partners parts party pasmo paspoort
  passability passed passend passenger passengers passerby passes passing passion passives
  passport passports past pastry paternal path patience patient patiently patients patron
  pattern patterned patternless patterns pause pauses pay payment payments pays peace
  peaceful peach peanut pearl pedestrian pedestrians pedro peek peel peeled peer peking
  penalty pencil penh penny pens pensioner pensive people pep pepper perceive percent
  perfect perfectly perform performance perfume perhaps period periods perish perk
  permanent permission permit persevere person personalities personnel persons perspective
  pessoas petrol pets pharmacies pharmacist pharmacists pharmacy phew phi phic philippines
  phnom phone phoned phones phonetic phoning photo photographed photographic photographing
  photos phrase phrased phrases phrasing phuket phy physical physically pick picked
  picking pickled picks pickup picture pictured piece pieces pierre piers pig pill pillars
  pillow pills pinching pines pink pinning pipes piraeus pistachio pistachios pitfalls
  pity pje pl place placed placement places placing plain plainly plane planen planens
  planets planned planner planners planning plans plastic plate platform platforms platter
  play played player playgrounds playing plays pleading pleasant pleasantry please pleased
  pleases pleasing pleasure plenty plot plug pluperfekt plurals pocket pockets podcast
  podcasts pods poet poetry point pointer pointing pointless points poison poke poland
  polarity poldevyatovo pole poles police policy polish polite politely politeness politer
  politest political politician politicians politics polluted pollution pollutions polski
  polskiego pomegranate ponder pooh pool poor popping poppy pops popular population porch
  pork porridge port porticoes portion portions portugal portuguese position positions
  positive possessed possessive possibility possible possibly post posted poster postpone
  postponing postposition pot potato potatoes potions pots pound pounding pounds pouring
  pours power powerful praca practical practically practice practiced practices practicing
  pracy praias praise praised praises praising praktikant praktisk prat pray prayer
  preachy preamble preceded precious precise precisely precision predicate predict
  predictable predictions prefecture prefer preferably preferences preferisci preferred
  prefers prefix prefixes preliminary premises preparation prepare prepared prepares
  preposition prepositions prescription presence presented presenting press pressing
  pressure presumably presumptuous presuppose presupposed presupposes pretend pretended
  pretending prettier pretty preview previous previously price prices pricey pride
  primarily primary primas prime primeval principle print printed printer printout
  printouts prints prioritize prioritized priserna private priya prizes probably probation
  probationary problemet problems process procession proclaimed procurement procurements
  produce produces product productive products produkt profession professional professions
  professor professors profile profit profitability programmer programs progress
  progressive prohibition prohibitions project projector projects promise promised
  promises promising promotion prompts pronoun pronounce pronounceable pronounced
  pronounces pronouncing pronunciation proof proofs prop proper properly proportion
  proposal proposals propose proposes prosper prosperity protect protected protector
  protesting protocol proud proves provided provinces prze przeczytam pshe psyrri public
  publish publishers pudding pueden puliscono pull pulling pulls punch punched punctuality
  punishment pupil pupils purchase pure purely purpose purposes push pushed pushes pushkin
  pushy put putri puts putting puzzle puzzled puzzles puzzling pyotr qamaru qr
  qualification qualifications quality quantities quarantacinque quarrel quarter quarters
  queen quelqu queres question questioning questionnaire questions queues queuing quick
  quickest quickly quiet quieter quietly quinto quirk quirks quit quite quoted quoting qur
  rab race racing racking rad radical radio rahi rahiim rahmaanir rahng rahul rail railway
  rain raincoat rained rainiest raining rains rainy raise raises raising ramadan
  ramkhamhaeng ramps ran random rang range rank ranked ranking rann rapid rapidly rarely
  rarer rasp rate rather rating rattles raus rav raw rays re reach reached reaches react
  reacting reaction reactions read readable reader readers readily reading reads ready
  real reality realize realized realizing really realm rear reason reasonable reasoning
  reasons reassure reassured reassuring rebel rebellious rebook rebuild rebuilding rebut
  recall recalled receipt receipts receive received receiver receives receiving recent
  recently reception receptionist recipe recipes recite reciting recognize recognized
  recognizing recommend recommendation recommending recommends record recorded recording
  recover recovered recovery recur recurring recycle red redo redovisas reduce reduced
  reduction redundant refer reference references referendum referring refill refined
  reflect reflects reflex reflexive refrain refresher refreshing refund refusal refusals
  refuse refuses refusing regarded regardent regarding regardless regards regional regions
  register registering registers regret regretful regrets regular regularly regulars
  regulation rehearsal rehearses rehydration reindeer reiwa reject rejecting rejection
  rejects rejoice related relation relationship relationships relatively relatives relax
  relaxed relaxing release releases reliable relief relies relieved relieving religion
  religious reluctance reluctant rely relying remain remainder remaining remains
  remarkably remember remembered remembering remembers remind reminder reminds remodeling
  remorse remove removes removing renew renewable renovate renovated rent rental rented
  renting rents reopen repair repairs repeat repeated repeating repeats repetition
  repetitive replace replaced replacement replacing replay replies reply report reported
  reporter reporting reports reposent representative reproach reproduced reputation
  reputations request requested requests require required requirement requires reread
  rereading res reschedule rescue rescued rescues research resemblance resemble
  reservation reserve reserved reserves reservoir reshaped reside residence residency
  resident residential residents residing resign resist resistance resources respect
  respectable respected respectful respelled respelling respellings respells respond
  responded responding responds response responsibilities responsibility responsible rest
  restart restarting restating restaurangen restaurant restaurants rested restrict
  restricted restrictions restroom restrooms rests results ret retell retelling rethink
  retire retired retiree retroflex return returned returning returns revered reverse
  reversing revient review reviewing reviews revisit revisited revived revolution reward
  rewarded rewards rewrite rewrites rewriting rhubarb rhythm rice rich rickshaw rid ride
  riders rides ridiculous riding right rights rimane rimast rina rings ripe riper rise
  rises rising risk risky rita ritual rituals river riverside rize road roadside roast
  roasted robbery robert rock rocks role rolling roma romance romanized romantic rome
  rooftop rooftops room roommate roommates rooms root rope rose rosh rosse rota rotation
  roti rotis rotisserie rough rougher roughly round roundabout rounding route routes
  routine routines row rowdy rows rtp rubbed rubbing rubios ruble rubles rude rudeness
  ruder rug ruined ruins rule ruled rules run rung running runny runoff runs rupee rupees
  rural rush russia russian russians rust rustiger rusty ryad saarhe sacred sacrifice sad
  saem safe safekeeping safer safest safety sahk said sailed sailors saint sake saknade
  saku salad salads salaries salary sales salesperson salt salted salts salty samajhtaa
  samajhtii samarbet sambos same sample samt samuku sandal sandalyenin sanskrit sardine
  sardines sari satisfied saturday saturdays satzklammer sauces sauerkraut sauna sausage
  sausages savaa save saved saver saves saving saw sawatdi say saying says scale scales
  scam scan scandal scandinavia scandinavian scarcely scare scared scarf scarier scarves
  scary scb scene scenery scenes scented schedule schedules schijnt schmidt schnapps
  schnell scholar scholarship school schoolchildren schools schoolyards science scissors
  scolding scope score scrambled scraping scratch scratching screen screens script scripts
  scripture scrolling scrutinize sea seafood seagulls sealed search searching season
  seasonal seasoned seasonings seasons seat seated seating sec second secondary secondhand
  secondly seconds secretary section sections sector secular security seed seedling seeing
  seeking seem seemed seems seen seized sejong seldom selection self sell seller sellers
  selling selves semi seminar seminars semitic send sender sending sends senhora sense
  sensed senses sensible sensibly sensitivity senta sentence sentences senti seoul
  separate separated separately separates separating sepatu sequence sequencing sergey
  series serious seriously seriousness sermons servant servants serve served server serves
  service serviced services serving sesame sessant session set sets settle settled settles
  seven seventeen seventh seventies seventy several severe seville sfi sg shabbat shade
  shadeless shadowing shaken shaker shakespeare shaky shall shalosh sham shame shamsu
  shanghai shape shaped shapes share shared shares sharing sharon sharp shave shawl shch
  shcheh shchen she shee sheep sheet shekel shekels shel shelf shelves shent shesh sheshch
  shieh shift shifts shine shining shinto ship shirt shivering shnel shock shocked shoes
  shone shont shop shopkeeper shopkeepers shopper shopping shops shore short shortage
  shortcoming shortcomings shortcut shorten shortened shortening shorter shortest shortly
  shorts shot should shoulder shoulders shouldn shouted shouting show showed shower
  showered shown shows shp shrimp shrimps shrine shrinks shrug sht shuffled shut shutting
  shyness sibling siblings sichuan sick side sided sides sidewalk sidewalks sigh sight
  sighted sightedly sightsee sightseeing sign signal signals signature signboard
  significance signing signs silence silenced silencer silent silently silk similar simma
  simpatica simple simpler simplest simply since sincere sincerely sinemaya sing singer
  singing single sings sink sino sir sister sisters sit site sites sits sitting sittings
  situation situationen situations six sixteen sixth sixties sixtieth sixty sizable size
  sizes sjuka sjukdom sjutton skadades skated skates skating skeleton skeptical sketch
  sketches skheen skhohl skhrey skill skilled skillful skills skim skimming skip skipped
  skipping skips skirt sklepu skogen skriftligt skrivbordet sky skytrain slab slash
  slashes slaughtered slecht sleep sleepiness sleeping sleeps sleepy sleeve sleeved
  sleeves slept slice slid slide slides sliding slight slighted slightest slightly slip
  slippers slippery slipping slips slope slopes sloppy slots slow slower slowing slowly
  sluggish sluggishly sly smack small smaller smallest smallness smart smarter smartphone
  smell smells smile smiling smoke smoking smooth smoother smoothly snabbast snack snacks
  snarast sneakers sneaks sneaky sneeze sneezes snow snowdrift snowing snows snowstorm so
  soak soaked soaking soccer sociable social socially socialstyrelsen soda soften softener
  softeners softer softest softly soi soil solar sold soldier soles solid solution solve
  solved solves somchai some somebody someday someone something sometime sometimes
  somewhat somewhere song songbook songkran songs soon sooner soonest sophia sorrow sorry
  sort sorted sortera sorting sortons sorts sought soul sound sounded sounding soundly
  sounds soup soups sour sources sours south southeast southern souvenir souvenirs
  souvlaki space spaced spacer spaces spacious spain spam spaniards spanish spans spare
  spared spares sparingly sparkling speak speaker speakers speaking speaks special
  specialty specific specifically specimen speculate speeches speed speeds spegeln spell
  spelled spelling spellings spells spend spends spent spicy spilled spilling spinach
  spinning spiral spirit split splits splitting spoke spoken spontaneous spook spoonful
  spoonfuls sportif sportive sports spot spotlight spots spotted spotting spouse spr
  spread spreads spricka spring sprinkles sprinkling sproh sprouts spruckna square
  squeezes squint stable staccato stack stacked stacking staff stage stain stains
  staircase staircases stairs stairwell stake stall stalling stalls stanbulluyuz stanchi
  stand standard standards standing stands staple staring start started starter starters
  starting startled startling starts state statements stating station stationery stations
  statistics status stay stayed staying stays steadily steal steamed steep steer steered
  stemek stems steng step stepping stern stick sticking sticks sticky stiff still stilles
  sting stings stir stko stock stockholmer stockholmers stocking stole stolen stolta
  stomach stomachache stone stood stools stoor stop stopped stopping stops storage store
  stores stories stormen stormwater story storyline storyteller storytelling stove
  straddle straight strain strained strands strange stranger strangers strategierna
  strategies straw strawberries strawberry stray street streetcar streets strength
  strengthen strengthening strengths strep stress stressed stressful stressing stretch
  stretched stretches stretching stretti strict stricter strictly strike strikes striking
  string stringing strings strip stripe stroke strokes stroll strolled strolling strong
  stronger strongest strongly struck structure structured struggle strung stubborn stuck
  student studentami studenten studenti students studerade studied studiert studies study
  studying stuff stumble stumbles stumbling sturdy stuttered style stylish stylistic
  subject subjectless subjects subjunctive sublease sublet sublets subletting submit
  submitted subordinate subordinating subscription substance substances subtitled
  subtitles subtle subtler subtlest subtly subtract suburban suburbs subway success
  successful such suddenly sued suffer suffering suffice suffices suffix suffixes sugar
  suggest suggested suggesting suggestion suggestions suggests suh suica suit suitable
  suitcase suitcases suited suits sum summaries summarizing summarizingly summary summer
  summers sums sundanese sunday sundays sunglasses sunlight sunny sunrise sunscreen sunset
  sunshine suona superb superior superiors superlative superlatives supermarket
  supermarkets supervisor supines supplies supply support suppose supposed supposedly
  surcharge sure surely surface surfaces surgery surnamed surnames surprise surprised
  surprises surprising surprisingly surround surroundings survey survival survive
  surviving suspect suspected suspicion sustainability sustainable suthep suwatte sveriges
  swahili swallow swallows swam swap swapped swapping swaps swear sweater sweaters swede
  sweden swedes swedish sweet sweeter sweetness sweets swerve swim swimming swims swimsuit
  swing switch switched switches switching swollen sword syllable syllables symbol
  symbolize sympathize symptom symptoms synagogue system systems szam szcz taart table
  tablecloths tables tablet tablets taboo tacked tackle tackles tact tactful tagande tags
  tagus tahk tahl tail tails taiwan taj take takeaway taken takes taking taksiden talas
  tale tales talk talked talking talks tall tallies tally tamar tamed tandem tank tap
  taped tapes tapped taps target targets task tasked taste tasted tastes tastiest tasty
  tatras taught taverna tavernas tavla tax taxes taxis tea teach teacher teaches teaching
  team tears tech ted teek teeth teething telc telefonaste telephone television tell
  telling tells temperature template temple temples temporarily temporary tempted tempting
  ten tenant tenants tend tendencies tendency tender tends tense tension tensta tent tenth
  tercer tercera term terminal terminate terms terrace terraces terrible terribly
  terrifying tesha test tested tester testing tests textbook textbooks texted textile
  texts thai thailand thais than thank thanked thankfully thanking thanks that thaw the
  theater theaters theft their theirs them themselves then theory there therefore thermal
  thermals thermos these theses thesis thessaloniki they thick thiin thin thing things
  thingy think thinking thinner third thirds thirst thirsty thirties thirty this thorough
  thoroughly thoroughness those though thought thoughtful thoughts thousand thousands
  thread three threshold thrifty thrilled thriller thrilling thrive thrived throat throaty
  throbbing through throughout throw throwing thrown throws thumb thumbs thunberg thunder
  thunderstorm thursday thursdays thus tianhe ticket tidies tidy tidying tie tied ties
  tight tightly tiktok tilde tiles tillsatte time timed timekeeping timeline times
  timetable timetables ting tiniest tiny tipping tips tire tired tiredness tires tiring
  tiropita tit title titles tje tmp to toast toasts today together togs tohm toil toiled
  toilet tokig told tolerate tomatoes tomorrow tonal tone toned tonight tonsillitis
  tonsils too took toolkit tools tooo tooth toothache topics topik tornat tornati tornato
  torniamo tossed total totally totals touch touched touches touching tour tourist
  tourists touristy toward towards towel town towns trabajaste trabzon trace traced track
  tracks trader traders tradespeople trading traditional traditions traffic trailer
  trailing train trained training trains trait traits tram trams tranquilla transaction
  transfer transform transformation transit transition transitive translate translated
  translating translation translations translator transparent transport transportation
  transportstyrelsen trap traps trash travail travel traveled traveler travelers traversez
  tray treacherous treat treated treating treatment treats treffe trehundrasextiofem
  trends trial trials trick tried tries triggers trinke trip tripped tripping trips triss
  trivdes trivia trivial tropical trouble troublemakers troubles trout true truly trummor
  trust trusts truths try trying tsoh tube tucked tuesday tuesdays tune tunnel turister
  turk turkish turks turn turned turning turnout turns turquoise tusen tutor twelve
  twenties twentieth twenty twice twin twins two twoi twos txt typed typhoon typical
  typically typing typo typos tyrant ubiera uczymy ugh uhn umbrella umiemy unable
  unannounced unappreciative unasked unbearable unbelievable unbroken uncertain unchanged
  uncle unclear uncles uncomfortable unconvinced uncooked uncovered underdeliver undergick
  undergo undergoing underground underline underneath understand understandable
  understanding understands understated understood underwear undisturbed undo undressed
  unemployed unexpected unexplained unfair unfamiliar unfortunate unfortunately unfriendly
  unfurnished unimportant union unions unit units unity universal universities university
  uniwersytecie unknown unless unlike unlikely unlock unlocking unlocks unmarried
  unnecessary unpack unpacked unpacking unpacks unpaid unpleasant unpredictable unprepared
  unpronounced unrecognizable unrelated unreliable unreturned unrounded unsaid unsalted
  unskilled unstuck unsure unsustainable untangle untangling untenable untidy until
  untranslatable unused unusual unusually unuttunuz unvalidated unvoiced unvowelled
  unwanted unwell unwritten up upbringing upcoming upload upon upper uppskrivna uprawiam
  upright ups upset upside upstairs urban urdu urged urgent us usable usage uscit usciti
  uscito use used useful useless user uses usher using ustadh usual usually utc utdelning
  utilities utlovat uto uvular vacant vacation vacations vaccine vackert vacuum vague
  vaguer vahn vaht vain valid validate validated valley valleys value valued values
  vandrat vanished vanishes varan variant variants variation varied varies variety various
  varma vasa vaw ve vegan vegetable vegetables vegetarian vegetarians vehicle veinticuatro
  veis vek vendor vendors venticinque verb verbal verbless verbs verdade vergis
  verjaardagsfeestje verk verlaufen vermicelli verplicht versa versatile version versions
  versus vert vertically very vest viande vibrating vice video vierennegentig vietnam
  vietnamese view viewpoint viewpoints village villig villkor violet violette violin
  virama visible visibly visit visitamos visitan visited visiting visitons visitor
  visitors vistula vivemos vlogs vocabulary vocal voelt voice voiceless voicemail voices
  volume volumes volunteer volvieron vomit vomited vomiting vort vote voter vouches
  vouching vowelled voyage vuelven vuhr vulgar waffle wage wagon wah wai wait waited
  waiter waiters waitress waits waitstaff wake wakes waking walk walked walking walks
  walled wallet wang want wanted wanting wants ward warden wardrobe warehouse warm warmer
  warmest warmly warmth warn warned warning warnings warsaw warszawy wary was wash washes
  washing wasn wast waste wasted wasteful watch watched watches watching water watering
  waterless watermelon wave wavelength waves waving way ways we weaken weakened weakens
  weaker weakness weaknesses wealth weapon wear wearing wears weather web website wechat
  wedding weddings wednesday wednesdays week weekday weekdays weekend weekends weekly
  weeks weigh weighing weight weightier weights welcome welcomed welcoming welfare well
  wellness went were weren werkt west western wet wettest what whatever whatsapp wheat
  wheel wheels when whenever where whereas wherever whether which whichever while whine
  whining whistle white whitening who whoa whoever whole wholly whose why wide widely
  wider widespread widow widower wife wild wildly will willed willing willingness wills
  win wind windmill window windows windowsill windy wine winner wins winter winters wise
  wisest wish wishes wishing witches with withdraw within without witness woke woken woman
  women won wonder wondered wonderful wonderfully wondering wonders wood wooden wooj
  woolly woorden word wording words work workbook workday worked worker working workplace
  works workshop world worlds worldwide worn worried worries worry worse worship worth
  would wouldn wound wow wrap wrapped wrapping wrestled wristwatch write writer writes
  writing written wrong wrongly wrote wszy xl yafo yanni yannis yard yards yasin yay yeah
  year yearly years yellow yemiyorum yeo yes yesterday yet yisin yngre yogurt yokute yoo
  york yossi you young younger youngest your yours yourself yourselves youth yuan yuh yuko
  yup yusuf zaini zeens zero zeros zevenenveertig zevenenzestig zhongshan zhoor zione zip
  zis zodiac zoning zweet zyuh
`;
const SET_PENGANTAR_EN = kataDaftar(LEKSIKON_PENGANTAR_EN);
/* [ebook-pengantar-en-v3] Kata daftar pengantar yang JUGA tercetak di teks
   target modul edisi Inggris bahasa itu ("was"/"die" Jerman, "come" Italia) —
   di modul bahasanya kata ini dibiarkan berbunyi, di modul lain tetap bisu.
   Keluaran scripts/leksikon-id-ebook.mjs; jangan disunting tangan. */
const KECUALI_PENGANTAR_EN_MENTAH: Record<string, string> = {
  "de": "also an budi bus in job kind name restaurant so student warm was will winter",
  "es": "hospital indonesia once",
  "fr": "air an article as attention budi bus camille date end excellent face films jakarta menu minutes normal on parents part photo place restaurant simple six table week",
  "it": "budi come do fine giulia in indonesia marco weekend",
  "nl": "amsterdam apart bed begin budi even half hard in is kind of over sorry warm was water we week weekend wind winter",
  "pl": "budi do ten to weekend",
  "pt": "as budi do hospital portugal",
  "sv": "band bit extra fem full hanna information jakarta just lappis lunch part person smart student system team",
  "tr": "budi her jakarta market on ve",
  "vi": "budi indonesia jakarta long",
};
const KECUALI_PENGANTAR_EN: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(KECUALI_PENGANTAR_EN_MENTAH).map(([b, d]) => [b, new Set(d.split(" "))]),
);

/** Bahasa pengantar modul yang sedang terbuka. Satu reader = satu modul, jadi
 *  cukup disetel reader saat modulnya dibuka (lihat aturPengantarEbook). */
let pengantarAktif: "id" | "en" = "id";

/** Bahasa pengantar modul dari judul produknya: "English Edition" = Inggris. */
export function pengantarEbook(judul?: string | null): "id" | "en" {
  return /english\s+edition/i.test(String(judul || "")) ? "en" : "id";
}

/** Disetel reader setiap kali modul berganti; kembalikan ke "id" saat ditutup. */
export function aturPengantarEbook(p: "id" | "en") {
  pengantarAktif = p;
}

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

/* [ebook-jaga-bahasa-en-v1] Tiga pola berawalan di atas menyerempet bahasa
   Inggris dan harus dilepas untuk modul Inggris: "memb-" menelan *member* &
   *membership*, "ber-" menelan *berries* & *Berlin*, dan "pe…an" menelan
   *pedestrian* & *pelican*. Kata Indonesia yang tadinya tertangkap pola-pola
   itu ("mengambil", "berkenalan", "pekerjaan") tetap terjaring, hanya lewat
   jalur lain — semuanya sudah ada di LEKSIKON_ID karena diperas dari prosa
   modulnya sendiri. Akhiran (-nya, -kan, -kah, -lah, -pun) dan ke…an tetap
   dipakai: tak ada kata Inggris yang berbentuk begitu. */
const MORFOLOGI_EN = MORFOLOGI_ID.filter((p) => {
  const src = p.source;
  return !src.startsWith("^(?:peng") && !src.startsWith("^(?:meng") && !src.startsWith("^ber");
});

/* [ebook-tts-kecuali-target-v1] Kata bahasa target yang ejaannya KEBETULAN sama
   persis dengan kata Indonesia (atau kena pola imbuhan di atas), padahal di
   modulnya nyaris selalu bahasa target. Tanpa daftar ini "allt í lagi",
   "klukkan sjö", "koma", dan "sama eftirnafn" bisu di modul Islandia — dan
   *klukkan* muncul di hampir tiap dialog tentang waktu. Daftar per bahasa,
   dan sengaja PENDEK: cuma kata yang terbukti muncul di modulnya. Kata yang
   dua-duanya wajar di prosa Indonesia (mis. "dan", "kata") JANGAN dimasukkan —
   itu membalikkan masalahnya ke arah lain. */
const KECUALI_TARGET: Record<string, Set<string>> = {
  is: new Set(["lagi", "sama", "sami", "koma", "klukkan"]),
  /* Irlandia (pemindaian ga-a1, 8 Sep 2026): `agus` (= dan, 53×) kena leksikon
     lewat nama orang "Agus"; `Dia` = Tuhan, separuh dari sapaan "Dia duit"
     yang jadi kalimat pertama modul; `leo` = dengan mereka. `air`/`cuma`/`cara`
     sengaja TIDAK — cuma 1–4× di modul, tapi lazim di prosa Indonesia. */
  ga: new Set(["agus", "dia", "leo"]),
};

/** Kata ini bahasa Indonesia dilihat dari dirinya sendiri (tanpa konteks)? */
function kataIdMurni(k: string, kode: string): boolean {
  if (KECUALI_TARGET[kode]?.has(k)) return false;
  /* [ebook-pengantar-en-v1] Modul edisi Inggris: "bahasa pengantar" = daftar
     Inggris, tanpa daftar & imbuhan Indonesia sama sekali. Terjemahan harfiah
     bersambung tanda hubung ("today-goes") tetap diputus per penggal. */
  if (pengantarAktif === "en" && kode !== "en") {
    if (SET_PENGANTAR_EN.has(k) && !KECUALI_PENGANTAR_EN[kode]?.has(k)) return true;
    /* Singkatan & kepemilikan Inggris — "it's", "I'm", "don't", "Elin's". Bahasa
       target Latin yang kita jual tak memakai ekor apostrof begini. */
    if (/^\p{L}+['’](?:s|m|t|ll|ve|re|d)$/u.test(k)) return true;
    if (!k.includes("-")) return false;
    const penggal = k.split(/[-'’]+/).filter(Boolean);
    return penggal.length > 1 && penggal.some((p) => SET_PENGANTAR_EN.has(p));
  }
  if (SET_ID.has(k)) return true;
  if (kode !== "en" && SET_ID_V3.has(k)) return true;
  const morfologi = kode === "en" ? MORFOLOGI_EN
    : AKSARA_SUKU_KATA.has(kode) ? MORFOLOGI_AMAN : MORFOLOGI_ID;
  if (morfologi.some((p) => p.test(k))) return true;
  /* Baris terjemahan harfiah menyambung kata dengan tanda hubung — "terima-kasih",
     "kalau-begitu", "saya-mengangkat-diri". Satu penggal Indonesia di dalamnya
     sudah cukup: gabungan seperti itu tak pernah jadi kata bahasa target. */
  if (!k.includes("-")) return false;
  const penggal = k.split(/[-'’]+/).filter(Boolean);
  return penggal.length > 1 && penggal.some((p) =>
    SET_ID.has(p) || (kode !== "en" && SET_ID_V3.has(p)) || morfologi.some((r) => r.test(p)));
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
  if (kode === "id" || kode === "ms" || kode === "su") return false;
  let id = 0;
  let target = 0;
  for (const w of String(klausa || "").toLowerCase().split(PECAH_KATA)) {
    if (!w) continue;
    if (kataTargetJelas(w)) { target++; continue; }
    const idMurni = kataIdMurni(w, kode);
    /* Kata serapan tidak dihitung ke pihak mana pun: memihakkannya berarti
       kalimat Inggris yang penuh serapan ("The bank near the hotel") menang
       terus, dan kalimat Indonesia yang penuh serapan ikut menang bersamanya. */
    if (kode === "en" && SET_EN.has(w)) { if (!idMurni) target++; continue; }
    if (idMurni) id++;
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
  if (kode === "id" || kode === "ms" || kode === "su") return false;
  const k = kata.trim().toLowerCase();
  if (!k) return true;
  if (kataTargetJelas(k)) return false;
  /* Kata serapan — "bank", "film", "jam" — duduk di KEDUA daftar sekaligus, dan
     tak ada jawaban yang benar untuk kata itu sendirian: di *Is there a bank
     near here?* ia bahasa Inggris, di "uang disimpan di bank" ia bahasa
     Indonesia. Jadi ia tidak diputus di sini, melainkan diserahkan ke klausanya.
     Yang murni Inggris (tak dikenal daftar Indonesia) lolos langsung. */
  if (kode === "en" && SET_EN.has(k)) {
    if (!kataIdMurni(k, kode)) return false;
    if (!konteks) return false;
    return klausaIndonesia(klausaKata(konteks, k) || konteks, kode);
  }
  if (kataIdMurni(k, kode)) return true;
  /* [ebook-tts-semua-section-v1] Kata yang TAK dikenal daftar Indonesia dianggap
     bahasa target — klausanya tidak lagi ikut memutuskan. Dulu "Morgen" di
     kalimat penjelasan "Guten Morgen sampai sekitar pukul sepuluh" dibungkam:
     klausanya memang berbahasa Indonesia, tapi katanya tidak. Di modul bahasa,
     kata asing yang disisipkan ke prosa Indonesia PERSIS kata yang ingin
     didengar siswa, jadi salah menebak ke arah itu jauh lebih mahal daripada
     satu kata Indonesia yang luput dari leksikon (leksikonnya diperas dari
     prosa modul sendiri, jadi yang luput sedikit). Serapan Inggris di atas
     tetap ditimbang lewat klausanya. */
  return false;
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
   tanpa itu nomor baris dialog modul Jepang tak pernah terpangkas.

   [ebook-tts-tanpa-penutur-v3] Nama penutur boleh DUA patah kata ("Frau Weber:",
   "Pak Budi:") — persis seperti BUANG_PENUTUR di bawah. Tanpa patah kedua,
   baris "3 Frau Weber: Und wo wohnen Sie jetzt?" tak terbaca sebagai dialog
   sama sekali: nomornya bertahan, lalu BUANG_PENUTUR pun ikut gagal karena
   barisnya kini diawali angka — jadi "Putar kalimat" membacakan "tiga Frau
   Weber" lebih dulu. */
const BUANG_NOMOR_DIALOG =
  /^\s*\d{1,2}\s+(?=[\p{Lu}\p{Lo}][\p{L}'’.\-]{0,14}(?:\s[\p{L}'’.\-]{1,16})?\s*[:：])/u;
/* Hanya "=", "→", dan pisah em/en dash. Titik dua SENGAJA tidak ikut: baris
   dialog modul ditulis "Ana: Hola, ¿qué tal?" — memenggalnya di titik dua
   menyisakan nama tokohnya saja. Baris "harfiah: …" tetap tersaring oleh
   penjagaan bahasa Indonesia.

   [ebook-tts-pisah-emdash-v1] Modul new edition menulis contoh kalimat dalam
   SATU baris: "У нас есть кошка. — Kami punya kucing." Tanpa tanda pisah ini,
   tombol "Putar kalimat" membacakan terjemahannya sekalian — mesin suara Rusia
   mengeja "Kami punya kucing" dengan lidah Rusia. Spasi WAJIB ada di kedua sisi
   supaya rentang angka ("2019–2021") dan kata bertanda hubung tidak ikut
   terpenggal. */
/* [ebook-tts-garis-miring-v1] Garis miring pasangan bentuk ("o professor /
   a professora", "o estudante / a estudante") juga pemisah: dulu baris seperti
   itu dibacakan utuh, garis miringnya ikut berbunyi, dan dua pilihan yang
   mestinya berdiri sendiri disambung jadi satu. Garis miring di antara dua
   angka (tanggal "12/05", pecahan "1/2") tidak ikut.

   [ebook-tts-panah-v1] Panah ketikan "->" / "=>" dan kerabat "→" (⇒ ➜ ➔ ⟶ ←
   ↔) sama perlakuannya: pemisah, tak pernah dibacakan. "=>" wajib dicocokkan
   sebelum "=" — kalau tidak, ">" tersisa di potongan kanan. */
const GARIS_MIRING = /(?<!\d)\s*\/\s*(?!\d)/;
const PISAH_ARTI = /\s*(?:=>|->|-->|=|[→⇒➜➔➝➞⟶⟹←↔⇔])\s*|\s+[–—]\s+|(?<!\d)\s*\/\s*(?!\d)/;

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

/** [ebook-tts-tanpa-penutur-v2] Baris tanpa nomor baris & nama penuturnya:
 *  "7 Нина: Медленнее, пожалуйста!" → "Медленнее, пожалуйста!". Dipakai frasaSel:
 *  sel dialog PENDEK ("7 Нина: Медленнее") dulu lolos jadi "frasa" tiga kata dan
 *  nama tokohnya ikut dibunyikan — padahal penutur bukan bahasa yang dipelajari. */
export function tanpaPenutur(baris: string): string {
  return String(baris || "")
    .replace(BUANG_NOMOR_DIALOG, "")
    .replace(BUANG_NOMOR, "")
    .replace(BUANG_PENUTUR, "");
}

/** [ebook-tts-tanpa-penutur-v3] Berapa KATA di kepala baris yang bukan bahan
 *  bacaan: nomor baris dialog + nama penuturnya. "3 Frau Weber: Und wo …" → 3
 *  ("3", "Frau", "Weber"), baris biasa → 0.
 *
 *  Kenapa jumlah kata, bukan mengadu teksnya: reader memakai angka ini untuk
 *  memutuskan ketukan mana yang diabaikan, dan nama dua patah kata tak bisa
 *  diadu satu per satu ("Weber" sendirian bukan nama penutur). Ketiga
 *  pembuangnya berjangkar di AWAL baris, jadi sisanya selalu ekor baris itu —
 *  kalau ternyata tidak, angkanya 0 dan tak ada yang dibungkam. */
export function kataKepalaBaris(baris: string): number {
  const s = String(baris || "");
  const sisa = tanpaPenutur(s);
  if (sisa === s || !s.endsWith(sisa)) return 0;
  const kepala = s.slice(0, s.length - sisa.length);
  return (kepala.match(/[\p{L}\p{M}\p{N}'’-]+/gu) ?? []).length;
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
  s = buangTranslit(s, kode); // [ebook-ruby-translit-v1]
  s = s.replace(/\s{2,}/g, " ").trim();
  if (s.length < 2) return "";
  if (barisTerjemahan(s, kode)) return "";
  return s.slice(0, 400);
}

/* [ebook-ruby-translit-v1] Aksara asli tiap bahasa beraksara BUKAN Latin.
   Di modul-modul ini setiap kata bahasa target PASTI memuat aksaranya sendiri,
   jadi potongan yang seluruhnya huruf Latin cuma bisa dua hal: kata Indonesia
   (baris terjemahan — itu dibacakan dengan suara Indonesia, lihat bahasaKata)
   atau transliterasi cara baca yang dicetak di atas katanya ("u-MYE-yu",
   "Saf-SYEM", romaji di atas kana). Transliterasi BUKAN bahasa mana pun: dibaca
   mesin suara Rusia ia jadi ejaan asing yang aneh, dan sebagai kalimat ia malah
   membuat seluruh permintaan TTS-nya gagal — itulah sebabnya tombol "Putar
   kalimat" sempat diam total. Jadi ia tak dibunyikan sama sekali.

   Pagar TATA LETAK-nya ada di `tandaiRubyBaris` (ebookTeksHal.ts) dan itu yang
   utama; ini jaring keduanya, untuk halaman yang anotasinya terlanjur menyatu
   dengan barisnya. Bahasa beraksara Latin tak punya entri di sini, jadi
   modul Spanyol/Jerman/Inggris sama sekali tak tersentuh. */
const AKSARA_ASLI: Record<string, RegExp> = {
  ru: /\p{Script=Cyrillic}/u, uk: /\p{Script=Cyrillic}/u, mn: /\p{Script=Cyrillic}/u,
  ja: /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,
  zh: /\p{Script=Han}/u, ko: /\p{Script=Hangul}/u, th: /\p{Script=Thai}/u,
  lo: /\p{Script=Lao}/u, km: /\p{Script=Khmer}/u, my: /\p{Script=Myanmar}/u,
  el: /\p{Script=Greek}/u, he: /\p{Script=Hebrew}/u, ka: /\p{Script=Georgian}/u,
  hi: /\p{Script=Devanagari}/u, am: /\p{Script=Ethiopic}/u,
  ar: /\p{Script=Arabic}/u, fa: /\p{Script=Arabic}/u, ps: /\p{Script=Arabic}/u,
  ur: /\p{Script=Arabic}/u,
};

/** Modul ini ditulis dengan aksara bukan-Latin? Kembalinya pola aksara aslinya. */
function aksaraAsli(kode: string): RegExp | null {
  return AKSARA_ASLI[String(kode || "").toLowerCase().split("-")[0]] ?? null;
}

/** Buang sisa transliterasi dari sebuah kalimat bahasa target. Cuma jalan kalau
 *  kalimatnya memang masih memuat aksara aslinya — kalau seluruhnya jadi kosong,
 *  teks aslinya yang dikembalikan (biar pagar bahasa berikutnya yang memutus). */
function buangTranslit(teks: string, kode: string): string {
  const aksara = aksaraAsli(kode);
  const s = String(teks || "");
  if (!aksara || !aksara.test(s)) return s;
  /* Yang dibuang RENTETAN huruf Latin-nya, bukan "kata"-nya: waktu anotasi
     terlanjur menyatu dengan barisnya, ia menempel TANPA spasi —
     "СовсемSaf-SYEM неnye умею." cuma punya tiga "kata" menurut hitungan spasi,
     dan ketiganya memuat aksara Cyrillic. */
  const sisa = s.replace(/\p{Script=Latin}[\p{Script=Latin}\p{M}'’-]*/gu, " ");
  const rapi = sisa.replace(/\s+([,.;:!?…])/gu, "$1").replace(/\s{2,}/g, " ").trim();
  return aksara.test(rapi) ? rapi : s;
}

/** Potongan ini transliterasi cara baca, bukan kata bahasa target maupun kata
 *  Indonesia? Cuma berlaku di modul beraksara bukan-Latin. */
export function kataTranslit(teks: string, kode: string): boolean {
  const aksara = aksaraAsli(kode);
  if (!aksara) return false;
  const s = String(teks || "");
  if (!/\p{L}/u.test(s) || aksara.test(s)) return false;
  return !kataIndonesia(s, kode);
}

/* [ebook-tts-semua-section-v1] Kalimat yang ditawarkan untuk SETIAP ketukan —
   termasuk di paragraf penjelasan berbahasa Indonesia yang cuma menyelipkan
   kata bahasa target ("… Guten Morgen sampai sekitar pukul sepuluh, Guten Tag
   sepanjang siang …"). Dulu baris seperti itu dibungkam seluruhnya oleh
   kalimatTarget, dan kata Jermannya ikut tak berbunyi. Sekarang:
     • baris utuh berbahasa target → seluruh barisnya, seperti sebelumnya;
     • baris campuran → rentetan kata SEBAHASA yang bersambung dengan kata yang
       diketuk, berhenti di tanda baca atau di kata dari bahasa lain
       ("Guten Morgen"); kalau rentetannya cuma kata itu sendiri, "" — tombol
       kalimatnya memang tak punya apa-apa untuk ditawarkan.
   Kode suaranya ikut dikembalikan: kata Indonesia dibacakan dengan suara
   Indonesia (id-ID ada di katalog Chirp), bukan dibungkam — dan bukan pula
   dilafalkan berlogat bahasa target. */
export function bahasaKata(kata: string, kode: string, konteks?: string): string {
  if (kataIndonesia(kata, kode, konteks)) return "id";
  // [ebook-ruby-translit-v1] "" = tak berbahasa apa pun → jangan dibunyikan.
  if (kataTranslit(kata, kode)) return "";
  return kode;
}

/* [ebook-tts-satu-kalimat-v1] Satu baris modul kerap memuat DUA kalimat —
   "Я никогда не готовлю. Совсем не умею." Tombol "Putar kalimat" dulu
   membacakan seluruh barisnya; yang diminta pengajar cuma kalimat tempat kata
   yang diketuk berdiri. Dipecah tanpa lookbehind (Safari lama belum punya) dan
   titik hanya dianggap akhir kalimat kalau yang menyusulnya spasi atau ujung
   baris — "2.500" & "hal. 12" tidak ikut terpotong. Tanda baca CJK (。！？)
   memang tak pernah diikuti spasi, jadi ia selalu memotong. */
const TANDA_AKHIR = /[.!?…。！？]/u;
const TANDA_LANJUT = /[.!?…。！？"'»”’)]/u;
export function pecahKalimat(teks: string): string[] {
  const huruf = Array.from(String(teks || ""));
  const hasil: string[] = [];
  let buf = "";
  for (let i = 0; i < huruf.length; i++) {
    const ch = huruf[i];
    buf += ch;
    if (!TANDA_AKHIR.test(ch)) continue;
    while (i + 1 < huruf.length && TANDA_LANJUT.test(huruf[i + 1])) buf += huruf[++i];
    const lanjut = huruf[i + 1];
    const cjk = /[。！？]/u.test(buf.slice(-1));
    if (lanjut !== undefined && !/\s/u.test(lanjut) && !cjk) continue;
    hasil.push(buf.trim());
    buf = "";
  }
  if (buf.trim()) hasil.push(buf.trim());
  return hasil.filter(Boolean);
}

/** Kalimat (satu saja) tempat `kata` berdiri di dalam `teks`. */
export function kalimatBerisiKata(teks: string, kata: string): string {
  const bagian = pecahKalimat(teks);
  if (bagian.length < 2) return String(teks || "").trim();
  const k = String(kata || "").trim().toLowerCase();
  if (!k) return bagian[0];
  const pola = new RegExp(`(^|\\P{L})${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\P{L})`, "iu");
  // Aksara tanpa spasi tak punya batas kata — di sana cocokkan apa adanya.
  return bagian.find((b) => pola.test(b)) ?? bagian.find((b) => b.toLowerCase().includes(k)) ?? bagian[0];
}

const TOKEN_KATA = /[\p{L}\p{M}\p{N}'’-]+|[^\p{L}\p{M}\p{N}'’-]+/gu;
const PUTUS_KLAUSA = /[.,;:!?()[\]{}"“”«»…—–|=/→<>⇒➜➔➝➞⟶⟹←↔⇔]/u; // [ebook-tts-panah-v1]

/* [ebook-tts-kalimat-diketuk-v1] Kunci jawaban modul new edition menderetkan
   beberapa kalimat bahasa target dalam SATU baris, dipisah " — ":
   "4. Сколько вам лет? — Мне двадцать один год. — Ему семь лет. — Медленнее, …".
   kalimatTarget selalu mengambil potongan pertama (pas untuk "kalimat — arti"),
   jadi kata mana pun yang diketuk, "Putar kalimat" membunyikan kalimat paling
   kiri. Di sini tiap potongan dibersihkan sendiri-sendiri, dipecah per kalimat,
   lalu dipilih kalimat tempat kata itu duduk. `ke` = kata yang sama ke berapa
   (dari kiri) di baris itu — "лет" muncul di "Сколько вам лет?" DAN
   "Ему семь лет.", jadi mencocokkan teksnya saja masih bisa meleset. */
function kalimatDiketuk(baris: string, kata: string, kode: string, ke: number): string {
  const k = kata.toLowerCase();
  if (!k) return "";
  const pola = new RegExp(`(^|\\P{L})${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|\\P{L})`, "giu");
  const kalimat: string[] = [];
  // [ebook-tts-garis-miring-v1] Baris bergaris miring itu DAFTAR pasangan
  // ("o amigo / a amiga, o brasileiro / a brasileira") — koma di sana juga
  // memisahkan butir, jadi yang dibunyikan cukup bentuk yang diketuk.
  const daftar = GARIS_MIRING.test(String(baris || ""));
  for (const bagian of String(baris || "").split(PISAH_ARTI)) {
    // [ebook-tts-titik-koma-v1] Titik koma juga pemisah butir ("to år; en ting"):
    // tak pernah dibacakan, yang diputar cukup butir tempat kata itu duduk.
    for (const butir of bagian.split(daftar ? /\s*[,;；]\s*/ : /\s*[;；]\s*/)) {
      const bersih = kalimatTarget(butir, kode);
      if (bersih) kalimat.push(...pecahKalimat(bersih));
    }
  }
  // Aksara tanpa spasi tak punya batas kata — di sana hitung apa adanya.
  const berbatas = kalimat.some((s) => (s.match(pola) ?? []).length > 0);
  const jumlah = (s: string) => berbatas
    ? (s.match(pola) ?? []).length
    : s.toLowerCase().split(k).length - 1;
  let sisa = Math.max(0, ke);
  let pertama = "";
  for (const s of kalimat) {
    const n = jumlah(s);
    if (!n) continue;
    if (!pertama) pertama = s;
    if (sisa < n) return s;
    sisa -= n;
  }
  return pertama;
}

export function kalimatSekitar(
  baris: string, kata: string, kode: string, ke = 0,
): { teks: string; kode: string } {
  const k = String(kata || "").trim();
  const kodeKata = bahasaKata(k, kode, baris);
  // [ebook-ruby-translit-v1] Yang diketuk transliterasi — tak ada yang dibunyikan.
  if (!kodeKata) return { teks: "", kode: "" };
  if (kodeKata === kode) {
    const diketuk = kalimatDiketuk(baris, k, kode, ke);
    if (diketuk) return { teks: diketuk, kode };
    const utuh = kalimatTarget(baris, kode);
    // [ebook-tts-satu-kalimat-v1] SATU kalimat saja: yang memuat kata itu.
    if (utuh) return { teks: kalimatBerisiKata(utuh, k), kode };
  }
  const s = String(baris || "")
    .replace(BUANG_KURUNG, " ")
    .replace(BUANG_NOMOR_DIALOG, "")
    .replace(BUANG_NOMOR, "")
    .replace(BUANG_PENUTUR, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const token = s.match(TOKEN_KATA) ?? [];
  const isKata = (t: string) => /[\p{L}\p{N}]/u.test(t);
  const cari = k.toLowerCase().split(/\s+/)[0] ?? ""; // frasa → kata pertamanya
  if (!cari) return { teks: "", kode: kodeKata };
  let i = token.findIndex((t) => isKata(t) && t.toLowerCase() === cari);
  // Aksara tanpa spasi (日本語, 中文): satu token = satu bentangan; katanya di dalamnya.
  if (i < 0) i = token.findIndex((t) => isKata(t) && t.includes(k));
  if (i < 0) return { teks: "", kode: kodeKata };
  const sebahasa = (t: string) => bahasaKata(t, kode) === kodeKata;
  let a = i;
  let b = i;
  while (a - 2 >= 0 && !PUTUS_KLAUSA.test(token[a - 1]) && isKata(token[a - 2]) && sebahasa(token[a - 2])) a -= 2;
  while (b + 2 < token.length && !PUTUS_KLAUSA.test(token[b + 1]) && isKata(token[b + 2]) && sebahasa(token[b + 2])) b += 2;
  const teks = token.slice(a, b + 1).join("").trim();
  return { teks: teks.length >= 2 ? teks.slice(0, 400) : "", kode: kodeKata };
}

/** Potongan ini kelihatan bahasa Indonesia (baris terjemahan), bukan bahasa target? */
export function barisTerjemahan(teks: string, kode: string): boolean {
  /* [ebook-tts-sunda-v1] id & ms: bahasa Indonesia memang bahasa targetnya.
     su ikut dilepas karena alasan lain — kosakata Sunda & Indonesia tumpang
     tindih luas (buku, acara, kantor, harga, bulan), jadi membungkam kata yang
     kebetulan juga kata Indonesia justru memangkas separuh modulnya. (Dulu
     suaranya dipinjam dari id-ID; kini su-ID-TutiNeural lewat Azure — alasan
     ini tetap berlaku.) */
  if (kode === "id" || kode === "ms" || kode === "su") return false;
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
  eu: "eu-ES", is: "is-IS",
  /* Bahasa jalur Azure (lihat AZURE_VOICES di ttsVoice.ts). Tag browser-nya
     dipakai hanya kalau rute gagal; jv/su tetap dipinjamkan ke id-ID di sini
     karena mesin TTS HP nyaris tak pernah punya suara Jawa/Sunda. */
  ga: "ga-IE", lo: "lo-LA", km: "km-KH", my: "my-MM", mn: "mn-MN", ps: "ps-AF",
  uz: "uz-UZ", fa: "fa-IR", ka: "ka-GE",
  jv: "id-ID", // lihat catatan jv di CHIRP_LOCALES (src/lib/ttsVoice.ts)
  su: "id-ID", // idem — basa Sunda dipinjamkan ke suara Indonesia
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
function ucapkanBrowser(teks: string, kode: string, laju = 1) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(teks);
    u.lang = SUARA_BROWSER[kode] ?? SUARA_BROWSER[kode.split("-")[0]] ?? "en-US";
    u.rate = 0.9 * laju;
    window.speechSynthesis.speak(u);
  } catch {
    /* sudah sejauh ini — biarkan diam */
  }
}

/** [tts-karaoke-v1] Elemen audio yang sedang/terakhir memutar TTS — dibaca
 *  penyorot karaoke (currentTime/duration → kata yang sedang dibaca). */
export function audioEbookAktif(): HTMLAudioElement | null { return audio; }

async function mainkan(base64: string, laju = 1): Promise<boolean> {
  if (!audio) audio = new Audio();
  try { audio.pause(); } catch { /* diam */ }
  try { window.speechSynthesis?.cancel(); } catch { /* diam */ }
  audio.volume = 1;
  // ⚠️ JANGAN menyetel currentTime di sini — lihat jebakan (2) di atas.
  audio.src = `data:audio/mp3;base64,${base64}`;
  // [vc-kuis-listening-laju-v1] Kecepatan putar (1 = biasa, 0.75 = pelan) —
  // kembaran dashboard. Ganti src mengembalikan playbackRate ke default, jadi
  // keduanya disetel di sini (sekaligus mengembalikan 1× untuk pemutaran lain).
  audio.defaultPlaybackRate = laju;
  audio.playbackRate = laju;
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
/* [tts-senyap-v1] Laporan owner 29 Okt 2026 (slide alfabet Denmark: bil, bog, se
   diam saat diklik). Chirp SESEKALI membalas kata pendek dengan mp3 senyap
   ±0,3–0,4 dtk (1,3–1,5 KB; kata asli terpendek ≥2,4 KB). Sekali tersimpan di
   cache bersama + CDN setahun, kata itu diam selamanya. Audio sekecil itu dari
   cache dianggap tak ada: minta ulang /api/tts dengan `segar=1` (URL lain →
   CDN tak menyajikan salinan senyapnya; server menyintesis ulang & menimpanya). */
const BATAS_SENYAP = 1800;
export const audioSenyap = (b64: string) => b64.length * 0.75 < BATAS_SENYAP;

function ambilAudio(kode: string, teks: string, bolehSintesis: boolean): Promise<string | null> {
  const kunci = `${kode}|${teks}`;
  const ada = memori.get(kunci);
  if (ada) return Promise.resolve(ada);
  const jalan = sedang.get(kunci);
  if (jalan) return jalan;

  const kerja = (async () => {
    let segar = false;
    const tersimpan = await dariCacheTetap(kode, teks);
    if (tersimpan && !audioSenyap(tersimpan)) { memori.set(kunci, tersimpan); return tersimpan; }
    if (tersimpan) segar = true;
    else {
      const cdn = await dariCdn(kode, teks);
      if (cdn && !audioSenyap(cdn)) {
        memori.set(kunci, cdn);
        void keCacheTetap(kode, teks, cdn);
        return cdn;
      }
      if (cdn) segar = true;
    }
    if (!bolehSintesis) return null;

    // GET, bukan POST: balasannya boleh disimpan CDN Vercel + cache browser
    // (lihat header abadi di /api/tts) — POST tak pernah disimpan keduanya.
    const alamatApi = `/api/tts?text=${encodeURIComponent(teks)}&lang=${encodeURIComponent(kode)}${segar ? "&segar=1" : ""}`;
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

/* [tts-klik-pertama-v1] Pemanasan fungsi /api/tts.
   Klik pertama pada kata yang belum ada di cache bersama dulu terasa 7–20 detik:
   bukan Chirp yang lambat, melainkan kontainer Vercel yang harus dibangunkan
   lebih dulu, lalu menukar token Google, baru menyintesis. Begitu reader dibuka
   di modul yang bahasanya bersuara, `?warm=1` dikirim — fungsinya bangun dan
   tokennya siap SEBELUM kata pertama diketuk. Diulang tiap beberapa menit
   selama reader terbuka (kontainer yang menganggur ditidurkan lagi) dan tiap
   tab kembali terlihat. Tanpa teks: nol karakter ditagih.
   🔴 Salinan lintas repo (landing & admin) — bedanya cuma asal rutenya. */
const JEDA_HANGAT = 4 * 60_000;
let hangatTerakhir = 0;

export function hangatkanTts(kode?: string | null) {
  if (typeof window === "undefined" || !bisaDibunyikan(kode)) return;
  const kini = Date.now();
  if (kini - hangatTerakhir < JEDA_HANGAT) return;
  hangatTerakhir = kini;
  try {
    void fetch("/api/tts?warm=1", { cache: "no-store" }).catch(() => {});
  } catch { /* diam — pemanasan gagal bukan alasan TTS gagal */ }
}

/** Jaga fungsi TTS tetap hangat selama reader terbuka. Kembalikan fungsi
 *  penghenti — pasang di useEffect. */
export function jagaHangatTts(kode?: string | null): () => void {
  if (typeof window === "undefined" || !bisaDibunyikan(kode)) return () => {};
  hangatkanTts(kode);
  const id = window.setInterval(() => {
    if (document.visibilityState === "visible") hangatkanTts(kode);
  }, JEDA_HANGAT);
  const lihat = () => { if (document.visibilityState === "visible") hangatkanTts(kode); };
  document.addEventListener("visibilitychange", lihat);
  return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", lihat); };
}

/* [tts-kunci-kanonik-v1] Satu kata = satu mp3, di mana pun ia diketuk.

   Kuncinya dulu teks ketukan apa adanya, jadi kata yang sama di dua lokasi
   berbeda mudah jatuh ke entri cache yang berbeda — dan Chirp menyintesisnya
   dua kali padahal bunyinya sama persis:
     • huruf kapital awal kalimat / kata benda Jerman: "Heiße" ≠ "heiße";
     • bentuk Unicode: sebagian fon PDF menyerahkan "ß"/"ü" sebagai huruf +
       tanda gabung (NFD), fon lain sebagai satu kode (NFC);
     • tanda kutip melengkung vs lurus ("l’ami" / "l'ami"), pemenggal lunak,
       spasi tak-putus, dan spasi ganda hasil penataan kolom.
   Kanonisasi ini dipakai di SEMUA lapis — memori, Cache API, kunci CDN, dan
   teks yang dikirim ke /api/tts — supaya seluruh lapisan menunjuk berkas yang
   sama. Huruf awal cuma dikecilkan untuk KATA TUNGGAL berpola kapital-awal
   ("Student" → "student"); singkatan ("DVD", "USA") dan kalimat dibiarkan,
   karena di situ kapitalisasi bisa mengubah cara baca. Yang ditampilkan di
   gelembung tetap teks aslinya — ini kunci cache, bukan tampilan. */
export function kanonikTeksTts(t: string): string {
  let s = String(t || "")
    .normalize("NFC")
    .replace(/[\u00AD\u200B-\u200D\u2060\uFEFF]/g, "") // pemenggal lunak & zero-width
    .replace(/[’ʼ‘]/g, "'")
    .replace(/[\s\u00A0]+/g, " ")
    .trim();
  if (!s.includes(" ") && /^\p{Lu}[\p{Ll}\p{M}'-]+$/u.test(s)) s = s[0].toLowerCase() + s.slice(1);
  return s.slice(0, BATAS_TEKS_TTS);
}

/** Kunci & teks yang dibunyikan — sama di prasiapan, pemutaran, dan Kelas Video. */
const rapikan = kanonikTeksTts;

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
export async function ucapkanEbook(teksMentah: string, kode: string, laju = 1): Promise<HasilUcap> {
  const teks = rapikan(teksMentah);
  if (!teks || !bisaDibunyikan(kode)) return "dilewati";

  const saya = ++seq;
  const putar = async (b64: string) => {
    // Siswa sudah mengetuk kata lain sementara ini menunggu jaringan.
    if (saya !== seq) return "ok" as const;
    if (await mainkan(b64, laju)) return "ok" as const;
    ucapkanBrowser(teks, kode, laju);
    return "gagal" as const;
  };

  const ada = memori.get(`${kode}|${teks}`);
  if (ada) return putar(ada);

  const b64 = await ambilAudio(kode, teks, true);
  if (!b64) { ucapkanBrowser(teks, kode, laju); return "gagal"; }
  return putar(b64);
}
