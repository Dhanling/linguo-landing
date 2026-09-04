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

function kataDaftar(teks: string): Set<string> {
  return new Set(teks.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 1));
}
const SET_ID = new Set([...kataDaftar(LEKSIKON_ID), ...kataDaftar(TAMBAHAN_ID)]);

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

/** Kata ini bahasa Indonesia dilihat dari dirinya sendiri (tanpa konteks)? */
function kataIdMurni(k: string, kode: string): boolean {
  if (SET_ID.has(k)) return true;
  const morfologi = kode === "en" ? MORFOLOGI_EN
    : AKSARA_SUKU_KATA.has(kode) ? MORFOLOGI_AMAN : MORFOLOGI_ID;
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
const PISAH_ARTI = /\s*(?:=|→)\s*|\s+[–—]\s+/;

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
  /* [ebook-tts-sunda-v1] id & ms: bahasa Indonesia memang bahasa targetnya.
     su ikut dilepas karena alasan lain — suara basa Sunda DIPINJAM dari id-ID
     (lihat CHIRP_LOCALES), jadi membungkam kata yang kebetulan juga kata
     Indonesia (buku, acara, kantor, harga, bulan) tidak menyelamatkan apa pun:
     kata itu memang akan dibacakan dengan lidah yang benar. */
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
  eu: "eu-ES",
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
