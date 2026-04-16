// AI Blog Article Generator — Linguo.id SEO
// Generates unique articles for 60+ languages → saves to Supabase blog_posts

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

const LANGUAGES = [
  { name:"Inggris", en:"English", slug:"inggris", speakers:"1.5 miliar", countries:"AS, Inggris, Australia, Kanada", family:"Germanik", script:"Latin", diff:"Mudah", cat:"Edukasi",
    facts:["Bahasa paling banyak dipelajari di dunia","Memiliki kosakata terbesar dari semua bahasa","Bahasa resmi di 67 negara"],
    reasons:["Bahasa bisnis internasional","Akses ke literatur dan riset terluas","Karier global tanpa batas"],
    challenges:["Pengucapan tidak konsisten dengan ejaan","Phrasal verbs yang sangat banyak","Perbedaan British vs American English"],
    tips:["Tonton film atau series tanpa subtitle","Baca berita berbahasa Inggris setiap hari","Praktik speaking dengan partner conversation"] },
  { name:"Jepang", en:"Japanese", slug:"jepang", speakers:"125 juta", countries:"Jepang", family:"Japonik", script:"Hiragana, Katakana, Kanji", diff:"Sulit", cat:"Edukasi",
    facts:["Memiliki 3 sistem penulisan berbeda","Bahasa dengan tingkat kesopanan (keigo) yang kompleks","Kanji berasal dari aksara Tionghoa tapi berbeda makna"],
    reasons:["Peluang kerja di perusahaan Jepang","Memahami anime, manga, dan budaya pop","Jepang adalah partner dagang utama Indonesia"],
    challenges:["Menghafal ribuan kanji","Sistem keigo (bahasa sopan) yang berlapis","Struktur kalimat SOV berbeda dari Indonesia"],
    tips:["Mulai dari hiragana dan katakana dulu","Gunakan aplikasi SRS untuk menghafal kanji","Tonton anime dengan subtitle Jepang"] },
  { name:"Korea", en:"Korean", slug:"korea", speakers:"77 juta", countries:"Korea Selatan, Korea Utara", family:"Koreik", script:"Hangul", diff:"Sedang", cat:"Edukasi",
    facts:["Hangul diciptakan Raja Sejong tahun 1443","Huruf Hangul bisa dipelajari dalam 1-2 hari","K-pop dan K-drama mendorong minat belajar bahasa Korea global"],
    reasons:["Karier di perusahaan Korea (Samsung, LG, Hyundai)","Lebih menikmati K-drama tanpa subtitle","Beasiswa kuliah di Korea sangat banyak"],
    challenges:["Sistem honorifik yang rumit","Konjugasi kata kerja berdasarkan formalitas","Pengucapan konsonan ganda"],
    tips:["Pelajari Hangul terlebih dahulu — bisa 1 hari","Dengarkan lagu K-pop dan coba terjemahkan liriknya","Praktik menulis diary dalam bahasa Korea"] },
  { name:"Mandarin", en:"Mandarin", slug:"mandarin", speakers:"1.1 miliar", countries:"Tiongkok, Taiwan, Singapura", family:"Sino-Tibet", script:"Hanzi (aksara Tionghoa)", diff:"Sulit", cat:"Edukasi",
    facts:["Bahasa dengan penutur asli terbanyak di dunia","Memiliki 4 nada yang mengubah makna kata","Aksara Tionghoa sudah berusia lebih dari 3.000 tahun"],
    reasons:["Tiongkok adalah kekuatan ekonomi terbesar kedua","Peluang bisnis dan perdagangan sangat besar","Memahami budaya Tionghoa yang kaya"],
    challenges:["Sistem nada (tones) yang krusial","Menghafal ribuan karakter Hanzi","Tidak ada alfabet — harus belajar dari nol"],
    tips:["Fokus pada nada sejak awal","Gunakan Pinyin sebagai jembatan","Tulis karakter berulang kali untuk mengingat"] },
  { name:"Arab", en:"Arabic", slug:"arab", speakers:"420 juta", countries:"22 negara Liga Arab", family:"Semitik", script:"Arab (kanan ke kiri)", diff:"Sulit", cat:"Edukasi",
    facts:["Ditulis dari kanan ke kiri","Bahasa resmi PBB dan 22 negara","Bahasa Al-Quran yang dipelajari 1.8 miliar Muslim"],
    reasons:["Memahami Al-Quran secara langsung","Peluang kerja di Timur Tengah","Diplomasi dan hubungan internasional"],
    challenges:["Huruf yang berubah bentuk di awal, tengah, dan akhir kata","Perbedaan besar antara fusha dan dialek","Bunyi huruf yang tidak ada di bahasa Indonesia"],
    tips:["Mulai dengan huruf hijaiyah","Pilih antara Modern Standard Arabic atau dialek","Dengarkan podcast bahasa Arab setiap hari"] },
  { name:"Prancis", en:"French", slug:"prancis", speakers:"300 juta", countries:"Prancis, Kanada, Belgia, Afrika", family:"Romanik", script:"Latin", diff:"Sedang", cat:"Edukasi",
    facts:["Bahasa resmi di 29 negara di 5 benua","Pernah menjadi bahasa diplomasi internasional","30% kosakata Inggris berasal dari Prancis"],
    reasons:["Bahasa diplomasi dan organisasi internasional","Karier di fashion, kuliner, dan seni","Pintu masuk ke 29 negara francophone"],
    challenges:["Pengucapan huruf R yang khas","Gender untuk setiap kata benda","Konjugasi kata kerja yang banyak"],
    tips:["Dengarkan podcast France Inter atau RFI","Tonton film Prancis dengan subtitle","Pelajari gender bersamaan dengan kosakata"] },
  { name:"Jerman", en:"German", slug:"jerman", speakers:"130 juta", countries:"Jerman, Austria, Swiss", family:"Germanik", script:"Latin", diff:"Sedang", cat:"Edukasi",
    facts:["Bahasa dengan kata majemuk terpanjang di dunia","Semua kata benda ditulis huruf kapital","Memiliki 3 gender gramatikal: der, die, das"],
    reasons:["Jerman adalah ekonomi terkuat di Eropa","Banyak beasiswa DAAD untuk Indonesia","Industri otomotif dan engineering kelas dunia"],
    challenges:["Tiga gender gramatikal","Kasus gramatikal (Nominativ, Akkusativ, Dativ, Genitiv)","Kata majemuk yang sangat panjang"],
    tips:["Hafal kata benda SELALU dengan artikelnya","Tonton Deutsche Welle untuk listening","Mulai dari level A1 Goethe-Institut"] },
  { name:"Spanyol", en:"Spanish", slug:"spanyol", speakers:"580 juta", countries:"Spanyol, Meksiko, 20 negara Amerika Latin", family:"Romanik", script:"Latin", diff:"Mudah", cat:"Edukasi",
    facts:["Bahasa kedua terbanyak penutur aslinya setelah Mandarin","Digunakan di 20+ negara","Pengucapan sangat konsisten dengan ejaan"],
    reasons:["Akses ke seluruh Amerika Latin","Salah satu bahasa PBB","Fonetik mirip Indonesia sehingga mudah dipelajari"],
    challenges:["Konjugasi kata kerja yang banyak termasuk subjuntivo","Perbedaan Spanyol vs Amerika Latin","Gender untuk kata benda"],
    tips:["Dengarkan musik reggaeton dan Latin pop","Fonetiknya mirip Indonesia — manfaatkan!","Tonton telenovela untuk listening natural"] },
  { name:"Italia", en:"Italian", slug:"italia", speakers:"85 juta", countries:"Italia, Swiss, San Marino", family:"Romanik", script:"Latin", diff:"Mudah", cat:"Edukasi",
    facts:["Bahasa paling dekat dengan bahasa Latin","Italia memiliki dialek beragam antar kota","Bahasa musik klasik (piano, forte, soprano)"],
    reasons:["Karier di fashion, desain, dan kuliner","Memahami opera dan musik klasik","Studi seni dan arsitektur di Italia"],
    challenges:["Konjugasi kata kerja yang detail","Perbedaan dialek regional yang besar","Penggunaan congiuntivo"],
    tips:["Pengucapan sangat mirip bahasa Indonesia","Dengarkan lagu-lagu Italia","Tonton film klasik Italia dengan subtitle"] },
  { name:"Belanda", en:"Dutch", slug:"belanda", speakers:"25 juta", countries:"Belanda, Belgia, Suriname", family:"Germanik", script:"Latin", diff:"Sedang", cat:"Edukasi",
    facts:["Pernah digunakan di Indonesia selama 350 tahun","Banyak kata serapan Indonesia dari Belanda","Suriname di Amerika Selatan juga berbahasa Belanda"],
    reasons:["Koneksi historis Indonesia-Belanda","Beasiswa kuliah di Belanda sangat banyak","Pintu gerbang ke pasar Eropa"],
    challenges:["Bunyi g dan sch yang khas","Urutan kata yang berbeda dalam kalimat","Kata kerja terpisah (scheidbare werkwoorden)"],
    tips:["Kenali kata serapan Indonesia dari Belanda dulu","Dengarkan NOS Journaal untuk berita","Banyak kesamaan dengan bahasa Jerman"] },
  { name:"Portugis", en:"Portuguese", slug:"portugis", speakers:"260 juta", countries:"Portugal, Brasil, Mozambik, Angola", family:"Romanik", script:"Latin", diff:"Sedang", cat:"Tips",
    facts:["Brasil adalah negara Portugis terbesar bukan Portugal","Bahasa resmi di 9 negara di 4 benua","Sangat mirip dengan bahasa Spanyol"],
    reasons:["Brasil adalah ekonomi terbesar di Amerika Latin","Peluang di negara-negara Afrika lusophone","Pintu masuk ke budaya samba dan bossa nova"],
    challenges:["Perbedaan besar antara Portugis Eropa dan Brasil","Bunyi nasal yang khas","Konjugasi kata kerja yang kompleks"],
    tips:["Pilih fokus Portugis Brasil atau Eropa","Dengarkan bossa nova dan MPB","Kalau sudah bisa Spanyol, Portugis lebih mudah"] },
  { name:"Rusia", en:"Russian", slug:"rusia", speakers:"258 juta", countries:"Rusia, Belarus, Kazakhstan", family:"Slavik", script:"Kiril", diff:"Sulit", cat:"Edukasi",
    facts:["Menggunakan alfabet Kiril dengan 33 huruf","Bahasa ke-8 paling banyak dituturkan","Bahasa pertama yang dikirim ke luar angkasa"],
    reasons:["Rusia adalah negara terluas di dunia","Literatur Rusia termasuk terkaya di dunia","Peluang bisnis energi dan teknologi"],
    challenges:["Alfabet Kiril yang berbeda dari Latin","6 kasus gramatikal","Aspek kata kerja yang unik"],
    tips:["Pelajari alfabet Kiril dulu (bisa 1 minggu)","Dengarkan musik Rusia populer","Baca buku anak-anak Rusia untuk pemula"] },
  { name:"Thai", en:"Thai", slug:"thai", speakers:"60 juta", countries:"Thailand", family:"Tai-Kadai", script:"Thai", diff:"Sulit", cat:"Tips",
    facts:["Memiliki 5 nada yang mengubah makna kata","Aksara Thai berasal dari aksara Khmer kuno","Thailand tidak pernah dijajah bangsa Eropa"],
    reasons:["Destinasi wisata favorit orang Indonesia","Peluang bisnis di Thailand yang berkembang","Memahami budaya dan makanan Thai mendalam"],
    challenges:["5 nada yang harus dikuasai","Aksara Thai dengan 44 konsonan dan 32 vokal","Tidak ada spasi antar kata dalam tulisan"],
    tips:["Mulai dari nada dan pelafalan","Belajar baca aksara Thai dari awal","Tonton drama Thai (lakorn) untuk listening"] },
  { name:"Vietnam", en:"Vietnamese", slug:"vietnam", speakers:"85 juta", countries:"Vietnam", family:"Austroasiatik", script:"Latin (Quoc ngu)", diff:"Sedang", cat:"Tips",
    facts:["Menggunakan huruf Latin dengan diakritik","Memiliki 6 nada berbeda","Dulu menggunakan aksara Tionghoa sebelum Latin"],
    reasons:["Vietnam adalah ekonomi berkembang pesat","Hubungan dagang Indonesia-Vietnam semakin erat","Makanan Vietnam terkenal di seluruh dunia"],
    challenges:["6 nada yang mengubah makna","Banyak diakritik pada huruf vokal","Pengucapan berbeda antar dialek utara dan selatan"],
    tips:["Fokus pada nada sejak hari pertama","Sudah pakai huruf Latin — lebih mudah dari Thai","Tonton vlog travel Vietnam untuk konteks"] },
  { name:"Hindi", en:"Hindi", slug:"hindi", speakers:"600 juta", countries:"India", family:"Indo-Arya", script:"Devanagari", diff:"Sedang", cat:"Edukasi",
    facts:["Bahasa ke-3 terbanyak dituturkan di dunia","Aksara Devanagari sangat fonetik","Bollywood mempopulerkan Hindi ke seluruh dunia"],
    reasons:["India adalah pasar terbesar yang sedang tumbuh","Memahami film Bollywood tanpa subtitle","Peluang IT dan teknologi di India"],
    challenges:["Aksara Devanagari yang baru","Bunyi retrofleks yang tidak ada di Indonesia","Gender gramatikal untuk semua kata benda"],
    tips:["Pelajari Devanagari dulu — sangat logis","Tonton Bollywood dengan subtitle Hindi","Banyak kata Hindi mirip bahasa Sanskerta di Indonesia"] },
  { name:"Turki", en:"Turkish", slug:"turki", speakers:"80 juta", countries:"Turki, Siprus", family:"Turkik", script:"Latin", diff:"Sedang", cat:"Tips",
    facts:["Bahasa aglutinatif — kata bisa sangat panjang","Harmoni vokal membuat pelafalan merdu","Alfabet Latin digunakan sejak 1928"],
    reasons:["Turki adalah jembatan antara Eropa dan Asia","Drama Turki populer di Indonesia","Peluang bisnis tekstil dan perdagangan"],
    challenges:["Harmoni vokal yang harus diikuti","Imbuhan (suffix) yang sangat banyak","Urutan kata SOV"],
    tips:["Pahami harmoni vokal dari awal","Tonton drama Turki (dizi) yang populer","Turki sangat reguler — hampir tidak ada pengecualian"] },
  { name:"Ibrani", en:"Hebrew", slug:"ibrani", speakers:"9 juta", countries:"Israel", family:"Semitik", script:"Ibrani (kanan ke kiri)", diff:"Sulit", cat:"Fun",
    facts:["Bahasa yang dihidupkan kembali setelah punah 2000 tahun","Ditulis kanan ke kiri tanpa huruf vokal","Bahasa Alkitab Perjanjian Lama"],
    reasons:["Memahami teks keagamaan asli","Israel adalah hub teknologi dan startup","Bahasa unik secara historis"],
    challenges:["Aksara Ibrani yang baru","Akar kata tri-konsonantal","Tulisan tanpa vokal"],
    tips:["Pelajari alfabet Ibrani — hanya 22 huruf","Pahami sistem akar kata 3 huruf","Dengarkan musik Israel modern"] },
  { name:"Persia", en:"Persian", slug:"persia", speakers:"110 juta", countries:"Iran, Afghanistan, Tajikistan", family:"Indo-Iran", script:"Arab (modifikasi)", diff:"Sedang", cat:"Fun",
    facts:["Puisi Persia termasuk paling indah di dunia","Menggunakan aksara Arab tapi bukan bahasa Arab","Grammar Persia lebih mudah dari Arab"],
    reasons:["Puisi dan sastra Persia yang legendaris","Iran memiliki warisan budaya 2.500 tahun","Komunikasi di 3 negara"],
    challenges:["Aksara Arab yang dimodifikasi","Kosakata campuran Arab-Persia","Dialek sangat berbeda antar negara"],
    tips:["Kalau sudah bisa aksara Arab, setengah jalan","Baca puisi Rumi dalam bahasa aslinya","Grammar Persia jauh lebih mudah dari Arab"] },
  { name:"Tagalog", en:"Tagalog", slug:"tagalog", speakers:"28 juta", countries:"Filipina", family:"Austronesia", script:"Latin", diff:"Mudah", cat:"Fun",
    facts:["Satu rumpun Austronesia dengan bahasa Indonesia","Banyak kata serapan Spanyol dan Inggris","Filipina menggunakan huruf Latin"],
    reasons:["Satu rumpun bahasa dengan Indonesia","Pekerja Filipina tersebar di seluruh dunia","Budaya Filipina yang ramah dan berwarna"],
    challenges:["Sistem fokus kata kerja yang unik","Campuran kosakata Melayu, Spanyol, Inggris","Perbedaan Tagalog formal dan bahasa gaul"],
    tips:["Banyak kata mirip bahasa Indonesia","Tonton film Filipina untuk listening","Grammarnya berbeda tapi kosakatanya mudah"] },
  { name:"Melayu", en:"Malay", slug:"melayu", speakers:"290 juta", countries:"Malaysia, Brunei, Singapura", family:"Austronesia", script:"Latin", diff:"Sangat Mudah", cat:"Fun",
    facts:["Bahasa Melayu dan Indonesia serumpun","Malaysia menggunakan ejaan sedikit berbeda","Pernah menjadi lingua franca Asia Tenggara"],
    reasons:["Sangat mirip Indonesia — bisa cepat mahir","Peluang kerja di Malaysia dan Singapura","Memahami perbedaan budaya Melayu-Indonesia"],
    challenges:["Kosakata terlihat sama tapi beda makna","Perbedaan ejaan dan istilah","Bahasa formal vs percakapan sehari-hari"],
    tips:["Fokus pada kosakata yang berbeda","Tonton berita Malaysia untuk listening","Perbedaan utamanya di kosakata bukan grammar"] },
  { name:"Georgia", en:"Georgian", slug:"georgia", speakers:"3.7 juta", countries:"Georgia", family:"Kartvelian", script:"Mkhedruli", diff:"Sulit", cat:"Fun",
    facts:["Aksara Georgia salah satu paling unik di dunia","Tidak berhubungan dengan bahasa lain","Tradisi wine tertua di dunia (8.000 tahun)"],
    reasons:["Bahasa yang benar-benar unik dan langka","Georgia semakin populer untuk wisata","Tantangan linguistik yang menarik"],
    challenges:["Aksara Mkhedruli yang sepenuhnya baru","Kluster konsonan yang sangat banyak","Sistem ergativitas dalam grammar"],
    tips:["Nikmati keunikan aksaranya yang indah","Georgia jadi destinasi wisata trending","Mulai dari frasa dasar dan alfabet"] },
  { name:"Polandia", en:"Polish", slug:"polandia", speakers:"45 juta", countries:"Polandia", family:"Slavik", script:"Latin", diff:"Sulit", cat:"Tips",
    facts:["Memiliki 7 kasus gramatikal","Huruf khusus membuat pengucapan unik","Komunitas besar di Eropa Barat"],
    reasons:["Polandia adalah ekonomi terbesar ke-6 di EU","Banyak perusahaan IT di Warsawa","Pintu masuk ke bahasa Slavik lainnya"],
    challenges:["7 kasus gramatikal lebih banyak dari Jerman","Kluster konsonan yang sulit","Aspek kata kerja yang kompleks"],
    tips:["Mulai dari pelafalan — kuncinya di sini","Huruf Latin sudah keuntungan","Pelajari kasus satu per satu"] },
  { name:"Swedia", en:"Swedish", slug:"swedia", speakers:"10 juta", countries:"Swedia, Finlandia", family:"Germanik", script:"Latin", diff:"Sedang", cat:"Edukasi",
    facts:["IKEA dan Spotify berasal dari Swedia","Mirip dengan Norwegia dan Denmark","Memiliki pitch accent yang khas"],
    reasons:["Bekerja di perusahaan Swedia","Kualitas hidup tertinggi di dunia","Mirip Inggris — lebih mudah dipelajari"],
    challenges:["Pitch accent yang membedakan makna","Huruf khusus yang baru","Pengucapan unik tertentu"],
    tips:["Banyak kesamaan dengan bahasa Inggris","Dengarkan podcast Swedish Pod 101","Banyak resource online dari Swedia"] },
  { name:"Norwegia", en:"Norwegian", slug:"norwegia", speakers:"5 juta", countries:"Norwegia", family:"Germanik", script:"Latin", diff:"Sedang", cat:"Tips",
    facts:["Punya 2 bahasa tulis resmi Bokmal dan Nynorsk","Salah satu bahasa termudah untuk penutur Inggris","Negara paling bahagia di dunia"],
    reasons:["Gaji tertinggi di Eropa","Alam Norwegia yang menakjubkan","Pintu masuk ke bahasa Skandinavia"],
    challenges:["Dialek beragam antar kota","Pilihan Bokmal dan Nynorsk","Pitch accent mirip Swedia"],
    tips:["Pilih Bokmal untuk pemula","Kalau bisa Swedia atau Denmark, Norwegia mudah","Tonton NRK untuk listening"] },
  { name:"Denmark", en:"Danish", slug:"denmark", speakers:"5.6 juta", countries:"Denmark, Greenland", family:"Germanik", script:"Latin", diff:"Sedang", cat:"Edukasi",
    facts:["Negara paling bahagia secara konsisten","Pengucapan sangat berbeda dari tulisan","Konsep hygge berasal dari Denmark"],
    reasons:["Kerja di perusahaan Denmark (LEGO, Maersk)","Work-life balance terbaik","Mirip Swedia dan Norwegia"],
    challenges:["Pengucapan berbeda dari ejaan","Glottal stop yang khas","Sistem angka yang unik"],
    tips:["Fokus extra pada listening","Tulisan mirip Norwegia tapi suara berbeda","Tonton DR untuk membiasakan telinga"] },
  { name:"Finlandia", en:"Finnish", slug:"finlandia", speakers:"5.4 juta", countries:"Finlandia", family:"Uralik", script:"Latin", diff:"Sulit", cat:"Tips",
    facts:["BUKAN bahasa Skandinavia — rumpun Uralik","Memiliki 15 kasus gramatikal","Sistem pendidikan terbaik di dunia"],
    reasons:["Sistem pendidikan nomor 1 dunia","Nokia, Linux, dan sauna berasal dari sini","Tantangan linguistik yang memuaskan"],
    challenges:["15 kasus gramatikal","Kata sangat panjang karena aglutinatif","Tidak mirip bahasa Eropa lainnya"],
    tips:["Grammar logis tapi berbeda","Pengucapan sangat fonetik","Banyak resource gratis dari Finlandia"] },
  { name:"Yunani", en:"Greek", slug:"yunani", speakers:"13 juta", countries:"Yunani, Siprus", family:"Helenik", script:"Yunani", diff:"Sedang", cat:"Fun",
    facts:["Alfabet Yunani berusia 2.800 tahun","Banyak istilah ilmiah berasal dari Yunani","Demokrasi dan filosofi lahir di Yunani"],
    reasons:["Warisan peradaban Barat","Memahami istilah ilmiah dan medis","Yunani sebagai destinasi wisata impian"],
    challenges:["Alfabet Yunani yang baru","Konjugasi kata kerja rumit","Perbedaan Yunani kuno vs modern"],
    tips:["Banyak kata Yunani sudah kamu kenal","Alfabet cuma 24 huruf bisa dipelajari cepat","Fokus pada Yunani Modern"] },
  { name:"Ceko", en:"Czech", slug:"ceko", speakers:"10.7 juta", countries:"Republik Ceko", family:"Slavik", script:"Latin", diff:"Sulit", cat:"Fun",
    facts:["Memiliki bunyi unik yang tidak ada di bahasa lain","Praha salah satu kota terindah di Eropa","Bir Ceko terkenal terbaik di dunia"],
    reasons:["Praha adalah hub tech Eropa Tengah","Pintu masuk ke bahasa Slavik","Biaya hidup rendah kualitas tinggi"],
    challenges:["Bunyi khusus yang sangat sulit","7 kasus gramatikal","Kluster konsonan tanpa vokal"],
    tips:["Latihan pelafalan pelan-pelan","Sangat mirip Slovak","Mulai dari kasus dasar"] },
  { name:"Hungaria", en:"Hungarian", slug:"hungaria", speakers:"13 juta", countries:"Hungaria", family:"Uralik", script:"Latin", diff:"Sulit", cat:"Fun",
    facts:["Tidak berhubungan dengan bahasa tetangganya","Memiliki 18 kasus gramatikal","Budapest terkenal dengan pemandian air panas"],
    reasons:["Budapest populer untuk digital nomad","Bahasa unik yang jarang dikuasai","Kuliner Hungaria yang lezat"],
    challenges:["18 kasus gramatikal terbanyak di Eropa","Harmoni vokal seperti Turki","Tidak mirip bahasa Eropa manapun"],
    tips:["Grammar sangat berbeda — buka pikiran lebar","Pengucapan cukup fonetik","Mirip sedikit dengan Finlandia"] },
  { name:"Rumania", en:"Romanian", slug:"rumania", speakers:"24 juta", countries:"Rumania, Moldova", family:"Romanik", script:"Latin", diff:"Sedang", cat:"Tips",
    facts:["Satu-satunya bahasa Romanik di Eropa Timur","Masih sangat mirip bahasa Latin","Moldova juga berbahasa sama"],
    reasons:["IT sector Rumania berkembang pesat","Bahasa Romanik termudah untuk grammar","Transylvania dan kastil bersejarah"],
    challenges:["Kasus gramatikal tidak ada di Romanik lain","Artikel di akhir kata","Pengaruh Slavik dalam kosakata"],
    tips:["Kalau bisa bahasa Romanik lain lebih mudah","Artikel definit ditempel di belakang kata","IT Rumania booming"] },
  { name:"Swahili", en:"Swahili", slug:"swahili", speakers:"100 juta", countries:"Kenya, Tanzania, Uganda", family:"Bantu", script:"Latin", diff:"Sedang", cat:"Fun",
    facts:["Lingua franca Afrika Timur","Banyak kata serapan dari Arab","Simba dan safari adalah kata Swahili"],
    reasons:["Bahasa Afrika paling banyak dipelajari","Akses ke Afrika Timur","Penting untuk diplomasi dan NGO"],
    challenges:["Sistem kelas kata benda yang unik","Konjugasi dengan prefiks","Banyak dialek regional"],
    tips:["Grammar sangat logis dan teratur","Banyak kata sudah kamu kenal","Pengucapan mirip Indonesia"] },
  { name:"Urdu", en:"Urdu", slug:"urdu", speakers:"230 juta", countries:"Pakistan, India", family:"Indo-Arya", script:"Nastaliq", diff:"Sedang", cat:"Edukasi",
    facts:["Saling dipahami dengan Hindi saat percakapan","Aksara Arab modifikasi (Nastaliq)","Bahasa puisi yang indah"],
    reasons:["Pakistan negara berpenduduk ke-5 terbesar","Puisi Urdu yang legendaris","Komunitas Pakistan besar di Timur Tengah"],
    challenges:["Aksara Nastaliq kanan ke kiri","Kosakata formal dari Arab dan Persia","Perbedaan register formal vs informal"],
    tips:["Kalau bisa baca Arab, tinggal tambah huruf","Secara lisan mirip Hindi","Dengarkan ghazal Urdu"] },
  { name:"Bengali", en:"Bengali", slug:"bengali", speakers:"270 juta", countries:"Bangladesh, India", family:"Indo-Arya", script:"Bengali", diff:"Sedang", cat:"Edukasi",
    facts:["Bahasa ke-5 paling banyak dituturkan","Lagu kebangsaan India ditulis dalam Bengali","Bangladesh memperjuangkan hak berbahasa Bengali"],
    reasons:["Bangladesh industri garmen ke-2 terbesar","Sastra Bengali yang kaya","270 juta penutur"],
    challenges:["Aksara Bengali yang baru","Bunyi aspirasi dan retrofleks","Konjugasi berdasarkan formalitas"],
    tips:["Aksara Bengali sangat indah","Banyak kesamaan dengan Hindi","Dengarkan Rabindra Sangeet"] },
  { name:"Jawa", en:"Javanese", slug:"jawa", speakers:"98 juta", countries:"Indonesia", family:"Austronesia", script:"Latin/Jawa", diff:"Sedang", cat:"Fun",
    facts:["Bahasa daerah penutur terbanyak di Indonesia","Memiliki tingkatan Ngoko, Madya, Krama","Aksara Jawa masih dipelajari di sekolah"],
    reasons:["Memahami budaya Jawa yang kaya","Komunikasi lebih dekat dengan masyarakat Jawa","Warisan sastra dan filosofi Jawa"],
    challenges:["Tingkatan bahasa yang kompleks","Kosakata berubah total per tingkat kesopanan","Aksara Jawa untuk belajar lengkap"],
    tips:["Mulai dari Ngoko (informal) dulu","Praktik langsung dengan penutur asli","Pelajari filosofi di balik unggah-ungguh"] },
  { name:"Sunda", en:"Sundanese", slug:"sunda", speakers:"42 juta", countries:"Indonesia", family:"Austronesia", script:"Latin/Sunda", diff:"Mudah", cat:"Fun",
    facts:["Bahasa daerah ke-2 terbanyak di Indonesia","Dikenal sebagai bahasa yang halus dan sopan","Aksara Sunda kuno sedang dilestarikan"],
    reasons:["Komunikasi di Jawa Barat dan Bandung","Memahami budaya Sunda yang lembut","42 juta penutur"],
    challenges:["Tingkatan bahasa mirip Jawa","Kosakata berbeda dari Indonesia","Intonasi dan pelafalan khas"],
    tips:["Tinggal di Bandung? Wajib belajar!","Banyak kata mirip Indonesia","Orang Sunda senang kalau kamu coba bicara Sunda"] },
  { name:"BIPA (Bahasa Indonesia)", en:"Indonesian (BIPA)", slug:"bipa-bahasa-indonesia", speakers:"270 juta", countries:"Indonesia", family:"Austronesia", script:"Latin", diff:"Mudah", cat:"Edukasi",
    facts:["BIPA artinya Bahasa Indonesia untuk Penutur Asing","Termasuk bahasa termudah di Asia","Tidak ada konjugasi, gender, atau kasus"],
    reasons:["Indonesia ekonomi terbesar di ASEAN","270 juta penutur di pasar besar","Bahasa yang relatif mudah dipelajari"],
    challenges:["Imbuhan yang mengubah makna","Kata serapan dari banyak bahasa","Register formal vs informal"],
    tips:["Grammar Indonesia sangat sederhana","Pengucapan fonetik dan mudah","Banyak sumber belajar BIPA tersedia"] },
  { name:"Ukraina", en:"Ukrainian", slug:"ukraina", speakers:"45 juta", countries:"Ukraina", family:"Slavik", script:"Kiril", diff:"Sulit", cat:"Edukasi",
    facts:["Bahasa resmi berbeda dari Rusia","Alfabet Kiril versi sendiri","Tradisi sastra yang kaya"],
    reasons:["Solidaritas dan pemahaman budaya","Diaspora tersebar di seluruh dunia","Punya identitas berbeda dari Rusia"],
    challenges:["Alfabet Kiril varian Ukraina","7 kasus gramatikal","Perbedaan dari Rusia yang membingungkan"],
    tips:["Kalau bisa Rusia, Ukraina lebih mudah","Alfabet hampir sama dengan Rusia","Banyak resource gratis sejak 2022"] },
  { name:"Kroasia", en:"Croatian", slug:"kroasia", speakers:"5.5 juta", countries:"Kroasia", family:"Slavik", script:"Latin", diff:"Sedang", cat:"Tips",
    facts:["Menggunakan huruf Latin berbeda dari Serbia","Mirip Serbia dan Bosnia secara linguistik","Pantai Adriatik yang menakjubkan"],
    reasons:["Kroasia populer untuk wisata","EU member dengan peluang kerja","Bisa 3 bahasa sekaligus"],
    challenges:["7 kasus gramatikal","Aspek kata kerja","Dialek beragam"],
    tips:["Satu bahasa untuk 3 negara","Huruf Latin lebih mudah dari Rusia","Dubrovnik memotivasi belajar!"] },
  { name:"Bulgaria", en:"Bulgarian", slug:"bulgaria", speakers:"7 juta", countries:"Bulgaria", family:"Slavik", script:"Kiril", diff:"Sedang", cat:"Fun",
    facts:["Satu-satunya Slavik tanpa kasus gramatikal","Bulgaria yang menciptakan alfabet Kiril","Tradisi yoghurt tertua di dunia"],
    reasons:["Bulgaria menciptakan Kiril","Biaya hidup rendah di EU","IT sector berkembang pesat"],
    challenges:["Alfabet Kiril","Artikel definit di akhir kata","3 gender gramatikal"],
    tips:["Tidak ada kasus gramatikal!","Kiril diciptakan di Bulgaria","Grammar lebih mudah dari Slavik lain"] },
  { name:"Islandia", en:"Icelandic", slug:"islandia", speakers:"360 ribu", countries:"Islandia", family:"Germanik", script:"Latin", diff:"Sulit", cat:"Fun",
    facts:["Hampir tidak berubah sejak zaman Viking","Menciptakan kata baru daripada meminjam","Literacy rate 99 persen"],
    reasons:["Bisa baca saga Viking asli","Negara paling aman di dunia","Tantangan linguistik unik"],
    challenges:["Grammar sangat kuno dan kompleks","4 kasus dengan banyak pengecualian","Kosakata murni tanpa serapan"],
    tips:["Bahasa paling dekat Old Norse","Grammar mirip Jerman tapi lebih kompleks","Komunitas kecil tapi aktif online"] },
  { name:"Albania", en:"Albanian", slug:"albania", speakers:"7.5 juta", countries:"Albania, Kosovo", family:"Indo-Eropa (cabang sendiri)", script:"Latin", diff:"Sedang", cat:"Fun",
    facts:["Bahasa Indo-Eropa yang berdiri sendiri","Tradisi hospitalitas (besa) yang kuat","Kosovo juga berbahasa Albania"],
    reasons:["Bahasa unik yang langka","Albania terbuka untuk wisata","Memahami budaya Balkan"],
    challenges:["Grammar unik bukan subfamili manapun","Sistem kasus dan artikel","Dialek Gheg vs Tosk"],
    tips:["Huruf Latin sudah keuntungan","Pantai Riviera Albania indah","Bahasa benar-benar unik di Eropa"] },
  { name:"Mongolia", en:"Mongolian", slug:"mongolia", speakers:"5 juta", countries:"Mongolia", family:"Mongolik", script:"Kiril", diff:"Sulit", cat:"Fun",
    facts:["Aksara tradisional vertikal yang indah","Genghis Khan memperluas bahasa ini","Mongolia modern pakai Kiril"],
    reasons:["Warisan Genghis Khan","Padang rumput yang menakjubkan","Bahasa langka membuka perspektif baru"],
    challenges:["Alfabet Kiril atau aksara tradisional","Harmoni vokal","Kasus gramatikal"],
    tips:["Mongolia pakai Kiril mirip Rusia","Harmoni vokal mirip Turki","Negara unik jarang dikunjungi"] },
  { name:"Khmer", en:"Khmer", slug:"khmer", speakers:"16 juta", countries:"Kamboja", family:"Austroasiatik", script:"Khmer", diff:"Sedang", cat:"Tips",
    facts:["Alfabet terbanyak di dunia (74 huruf Guinness Record)","Angkor Wat kuil terbesar di dunia","Tidak memiliki nada"],
    reasons:["Kamboja sedang berkembang pesat","Angkor Wat dan warisan budaya","Tidak ada nada lebih mudah dari Thai"],
    challenges:["Aksara Khmer sangat kompleks","Kluster konsonan banyak","Vokal sangat beragam"],
    tips:["Tidak ada nada!","Lebih mudah dari Thai untuk Indonesia","Kamboja ramah untuk wisatawan"] },
  { name:"Nepal", en:"Nepali", slug:"nepal", speakers:"25 juta", countries:"Nepal, India", family:"Indo-Arya", script:"Devanagari", diff:"Sedang", cat:"Tips",
    facts:["Aksara Devanagari sama seperti Hindi","8 dari 10 gunung tertinggi di Nepal","Mirip Hindi dengan ciri khas sendiri"],
    reasons:["Destinasi trekking terbaik dunia","Saling dipahami dengan Hindi","Komunitas Nepal besar di ASEAN"],
    challenges:["Aksara Devanagari","Honorifik yang rumit","Dialek regional beragam"],
    tips:["Kalau bisa Hindi, Nepal sangat mudah","Devanagari familiar? Tinggal kosakata","Orang Nepal sangat ramah dan terbuka"] },
  { name:"Myanmar (Burma)", en:"Burmese", slug:"myanmar", speakers:"33 juta", countries:"Myanmar", family:"Sino-Tibet", script:"Myanmar", diff:"Sulit", cat:"Fun",
    facts:["Aksara terdiri dari lingkaran bulat indah","Satu rumpun dengan Tibet dan Mandarin","Lebih dari 100 bahasa daerah di Myanmar"],
    reasons:["Myanmar membuka diri ke dunia","Arsitektur kuil Bagan menakjubkan","Bahasa langka jarang dikuasai"],
    challenges:["Aksara bulat sepenuhnya baru","3 nada","Urutan kata berbeda"],
    tips:["Aksara Myanmar sangat indah","Nada lebih sedikit dari Mandarin dan Thai","Dekat Indonesia — bisa praktik langsung"] },
  { name:"Lao", en:"Lao", slug:"laos", speakers:"30 juta", countries:"Laos", family:"Tai-Kadai", script:"Lao", diff:"Sedang", cat:"Tips",
    facts:["Satu rumpun dengan Thai dan saling mirip","Satu-satunya terkurung daratan di ASEAN","Aksara mirip Thai tapi lebih sederhana"],
    reasons:["Laos populer untuk wisata","Mirip Thai bisa 2 bahasa sekaligus","Budaya relaks dan ramah"],
    challenges:["Aksara Lao yang baru","6 nada mirip Thai","Sumber belajar lebih sedikit"],
    tips:["Kalau bisa Thai, Lao sangat mudah","Aksara Lao lebih simpel dari Thai","Alam Laos masih sangat alami"] },
  { name:"Catalan", en:"Catalan", slug:"catalan", speakers:"10 juta", countries:"Spanyol (Catalonia), Andorra", family:"Romanik", script:"Latin", diff:"Mudah", cat:"Tips",
    facts:["Barcelona ibu kota Catalonia berbahasa Catalan","Bukan dialek Spanyol — bahasa berbeda","Andorra menggunakan Catalan resmi"],
    reasons:["Barcelona dan budaya Catalan","Campuran Spanyol dan Prancis","FC Barcelona dan identitas Catalan"],
    challenges:["Sering dianggap dialek Spanyol","Mirip tapi tetap berbeda","Sumber belajar lebih sedikit"],
    tips:["Kalau bisa Spanyol atau Prancis, mudah","Barcelona motivasi terbaik","Duolingo punya kursus Catalan"] },
  { name:"Afrikaans", en:"Afrikaans", slug:"afrikaans", speakers:"7 juta", countries:"Afrika Selatan, Namibia", family:"Germanik", script:"Latin", diff:"Mudah", cat:"Fun",
    facts:["Berkembang dari Belanda di Afrika Selatan","Bahasa Germanik termuda — baru 300 tahun","Grammar paling sederhana dari Germanik"],
    reasons:["Kalau bisa Belanda, sangat mudah","Afrika Selatan destinasi wisata luar biasa","Grammar termudah di Germanik"],
    challenges:["Kosakata berbeda dari Belanda standar","Pengucapan khas Afrika","Double negation dalam kalimat"],
    tips:["Bahasa Germanik TERMUDAH","Tidak ada konjugasi rumit","Kalau bisa Belanda, sudah 90% jalan"] },
  { name:"Tamil", en:"Tamil", slug:"tamil", speakers:"80 juta", countries:"India, Sri Lanka, Singapura", family:"Dravida", script:"Tamil", diff:"Sedang", cat:"Edukasi",
    facts:["Salah satu bahasa tertua masih aktif","Aksara Tamil bulat dan indah","Bahasa resmi di 3 negara"],
    reasons:["Bahasa tertua yang masih hidup","Komunitas Tamil besar di ASEAN","Kollywood semakin populer"],
    challenges:["Aksara Tamil sepenuhnya baru","Bunyi retrofleks banyak","Perbedaan formal dan percakapan"],
    tips:["Aksara sangat logis — vokal plus konsonan","Film Tamil semakin mendunia","Komunitas Tamil di Malaysia bisa praktik"] },
  { name:"Amharik", en:"Amharic", slug:"amharik", speakers:"57 juta", countries:"Ethiopia", family:"Semitik", script:"Ge-ez", diff:"Sulit", cat:"Fun",
    facts:["Aksara Ge-ez satu-satunya aksara asli Afrika","Ethiopia tidak pernah dijajah Eropa","Kalender Ethiopia berbeda dari dunia"],
    reasons:["Ethiopia ekonomi tercepat tumbuh di Afrika","Aksara unik satu-satunya dari Afrika","Kopi berasal dari Ethiopia"],
    challenges:["Aksara dengan 200+ karakter","Konsonan ejektif unik","Konjugasi kompleks"],
    tips:["Ethiopia tanah asal kopi — motivasi sempurna","Aksara Ge-ez indah","Bahasa Semitik tapi berbeda dari Arab"] },
  { name:"Kurdi", en:"Kurdish", slug:"kurdi", speakers:"30 juta", countries:"Irak, Turki, Iran, Suriah", family:"Indo-Iran", script:"Latin/Arab", diff:"Sedang", cat:"Fun",
    facts:["Kurdistan tersebar di 4 negara","2 dialek utama Kurmanji dan Sorani","Etnis terbesar tanpa negara sendiri"],
    reasons:["Memahami konflik dan budaya Kurdi","Tersebar di Timur Tengah","Bahasa jarang dikuasai tapi penting"],
    challenges:["2 dialek yang cukup berbeda","Aksara berbeda per negara","Sumber belajar terbatas"],
    tips:["Pilih Kurmanji (Latin) untuk pemula","Mirip Persia bisa paralel","Budaya Kurdi sangat kaya"] },
  { name:"Armenia", en:"Armenian", slug:"armenia", speakers:"6 juta", countries:"Armenia", family:"Indo-Eropa (cabang sendiri)", script:"Armenia", diff:"Sulit", cat:"Fun",
    facts:["Aksara diciptakan tahun 405 M","Negara Kristen pertama di dunia 301 M","Diaspora tersebar global"],
    reasons:["Aksara indah dan unik","Sejarah 3.000 tahun","Komunitas diaspora global"],
    challenges:["Aksara Armenia sepenuhnya baru","Kluster konsonan banyak","Bunyi aspirasi dan ejektif"],
    tips:["Aksara Armenia paling indah di dunia","Alfabet bisa dipelajari 1-2 minggu","Armenia populer untuk wisata"] },
  { name:"Azerbaijan", en:"Azerbaijani", slug:"azerbaijan", speakers:"25 juta", countries:"Azerbaijan, Iran", family:"Turkik", script:"Latin", diff:"Mudah", cat:"Tips",
    facts:["Sangat mirip Turki dan saling dipahami","Azerbaijan tanah api (land of fire)","Baku semakin modern"],
    reasons:["Mirip Turki bisa 2 bahasa","Azerbaijan kaya minyak dan gas","Baku destinasi wisata baru"],
    challenges:["Kosakata berbeda dari Turki","Pengaruh Rusia dan Persia","Dialek beragam"],
    tips:["Kalau bisa Turki, Azerbaijan gratis","Harmoni vokal sama dengan Turki","Huruf Latin sejak 1991"] },
  { name:"Uzbek", en:"Uzbek", slug:"uzbek", speakers:"35 juta", countries:"Uzbekistan", family:"Turkik", script:"Latin", diff:"Sedang", cat:"Fun",
    facts:["Samarkand dan Bukhara pusat Jalur Sutra","Arsitektur Islam paling indah di dunia","Bahasa Turkik dengan pengaruh Persia"],
    reasons:["Jalur Sutra dan sejarah kaya","Samarkand kota terindah di dunia","Satu rumpun Turkik dengan Turki"],
    challenges:["Pengaruh Rusia masih kuat","Peralihan Kiril ke Latin belum selesai","Campuran Turkik dan Persia"],
    tips:["Rumpun Turkik mirip Turki","Uzbekistan destination yang Instagrammable","Huruf Latin semakin dominan"] },
];

function generateArticle(lang) {
  const diffEmoji = { "Sangat Mudah":"🟢", "Mudah":"🟢", "Sedang":"🟡", "Sulit":"🔴" };
  const emoji = diffEmoji[lang.diff] || "🟡";
  
  const title = `Panduan Belajar Bahasa ${lang.name}: Tips, Tantangan & Cara Efektif`;
  const metaTitle = `Kursus Bahasa ${lang.name} Online | Belajar ${lang.en} di Linguo.id`;
  const metaDesc = `Panduan lengkap belajar bahasa ${lang.name} (${lang.en}) dari nol. Tips, tantangan, dan metode efektif. Kursus private 1-on-1 di Linguo.id.`;
  const excerpt = `Tertarik belajar bahasa ${lang.name}? Simak panduan lengkap: fakta menarik, tantangan, dan tips praktis untuk pemula.`;

  const content = `<p>Bahasa ${lang.name} (${lang.en}) dituturkan oleh <strong>${lang.speakers} orang</strong> di ${lang.countries}. Termasuk rumpun <strong>${lang.family}</strong> dengan sistem penulisan <strong>${lang.script}</strong>, bahasa ini memiliki tingkat kesulitan <strong>${emoji} ${lang.diff}</strong> untuk pelajar Indonesia.</p>

<p>Di Linguo.id, kami menyediakan kursus bahasa ${lang.name} dengan metode 1-on-1 private bersama pengajar profesional. Simak panduan lengkap ini untuk memulai perjalanan belajarmu!</p>

<h2>Mengapa Harus Belajar Bahasa ${lang.name}?</h2>

<p>Ada banyak alasan mengapa belajar bahasa ${lang.name} bisa menjadi investasi terbaik:</p>

<p><strong>${lang.reasons[0]}.</strong> Ini adalah salah satu alasan utama banyak orang memilih mempelajari bahasa ${lang.name}. Dengan menguasai bahasa ini, kamu membuka pintu ke peluang yang sebelumnya tidak terjangkau.</p>

<p><strong>${lang.reasons[1]}.</strong> Kemampuan berbahasa ${lang.name} memungkinkan kamu mendapatkan keuntungan yang tidak bisa didapat hanya dari bahasa Inggris saja.</p>

<p><strong>${lang.reasons[2]}.</strong> Motivasi tambahan ini membuat proses belajar terasa lebih bermakna dan terarah.</p>

<h2>Fakta Menarik tentang Bahasa ${lang.name}</h2>

<p>Sebelum mulai belajar, kenali fakta menarik tentang bahasa ${lang.name}:</p>

<p><strong>1. ${lang.facts[0]}.</strong> Fakta ini menunjukkan betapa uniknya bahasa ${lang.name} di antara bahasa-bahasa dunia.</p>

<p><strong>2. ${lang.facts[1]}.</strong> Hal-hal seperti ini membuat belajar bahasa ${lang.name} tidak pernah membosankan.</p>

<p><strong>3. ${lang.facts[2]}.</strong> Semakin kamu mendalami, semakin banyak hal menarik yang kamu temukan.</p>

<h2>Tantangan yang Akan Kamu Hadapi</h2>

<p>Setiap bahasa punya tantangannya masing-masing. Untuk bahasa ${lang.name}:</p>

<p><strong>${lang.challenges[0]}.</strong> Ini mungkin terasa sulit di awal, tapi dengan latihan konsisten pasti bisa diatasi. Kuncinya adalah tidak menyerah di minggu-minggu pertama.</p>

<p><strong>${lang.challenges[1]}.</strong> Tantangan ini sering membuat pemula kewalahan. Namun, pengajar profesional Linguo.id akan membimbingmu dengan metode yang terbukti efektif.</p>

<p><strong>${lang.challenges[2]}.</strong> Meskipun menantang, ingat bahwa jutaan orang berhasil menguasai bahasa ${lang.name}. Kamu juga pasti bisa!</p>

<h2>Tips Praktis Belajar Bahasa ${lang.name}</h2>

<p>Berdasarkan pengalaman pengajar kami:</p>

<p><strong>Tip 1: ${lang.tips[0]}.</strong> Tips ini sangat penting untuk pemula. Banyak siswa merasakan perbedaan signifikan setelah menerapkannya secara konsisten.</p>

<p><strong>Tip 2: ${lang.tips[1]}.</strong> Metode ini menggabungkan belajar dengan kegiatan menyenangkan. Learning should be fun!</p>

<p><strong>Tip 3: ${lang.tips[2]}.</strong> Konsistensi lebih penting dari intensitas. Lebih baik 15 menit setiap hari daripada 3 jam di akhir pekan.</p>

<h2>Belajar Bahasa ${lang.name} di Linguo.id</h2>

<p>Linguo.id adalah platform kursus bahasa online pertama di Indonesia dengan <strong>60+ pilihan bahasa</strong>. Untuk bahasa ${lang.name}, kami menawarkan:</p>

<p><strong>Kelas Private 1-on-1</strong> — Belajar langsung dengan pengajar profesional via Zoom. Jadwal fleksibel, materi disesuaikan levelmu, dan dapat rekaman setiap sesi.</p>

<p><strong>Kurikulum Terstruktur</strong> — Dari level A1 (Pemula) hingga B2 (Mahir), dengan 192 sesi pembelajaran sistematis.</p>

<p><strong>E-Certificate</strong> — Setiap siswa yang menyelesaikan kursus mendapat sertifikat digital untuk CV atau LinkedIn.</p>

<p>Siap memulai? <strong>Hubungi kami via WhatsApp di +62 821-1685-9493</strong> atau kunjungi <a href="https://linguo.id">linguo.id</a>. Konsultasi pertama GRATIS!</p>

<h2>FAQ</h2>

<p><strong>Berapa lama bisa bahasa ${lang.name}?</strong><br/>Dengan kelas 2-3x seminggu, rata-rata siswa mencapai percakapan dasar dalam 3-4 bulan.</p>

<p><strong>Harus bisa Inggris dulu?</strong><br/>Tidak! Pengajar kami mengajar dalam bahasa Indonesia. Bisa langsung belajar dari nol.</p>

<p><strong>Berapa biayanya?</strong><br/>Kelas Private mulai Rp95.000 per sesi. Tersedia paket hemat. Hubungi kami untuk penawaran terbaik.</p>`;

  return {
    slug: `belajar-bahasa-${lang.slug}`,
    title, content, excerpt,
    featured_image: null,
    category: lang.cat,
    tags: [`bahasa ${lang.name.toLowerCase()}`, lang.en.toLowerCase(), `kursus ${lang.name.toLowerCase()}`, "belajar bahasa"],
    author: "Linguo Team",
    read_time: "6 min",
    status: "published",
    meta_title: metaTitle,
    meta_description: metaDesc,
  };
}

async function insertArticle(article, publishedAt) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ ...article, published_at: publishedAt }),
  });
  return res.ok;
}

async function main() {
  console.log(`\n🚀 Generating ${LANGUAGES.length} blog articles...\n`);

  let success = 0, fail = 0;
  const startDate = new Date("2026-03-01T08:00:00+07:00");

  for (let i = 0; i < LANGUAGES.length; i++) {
    const lang = LANGUAGES[i];
    const article = generateArticle(lang);
    const pubDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000 + Math.random() * 8 * 3600000);

    const ok = await insertArticle(article, pubDate.toISOString());
    if (ok) { success++; console.log(`  ✅ ${String(i+1).padStart(2)}/${LANGUAGES.length}  ${article.slug}`); }
    else { fail++; console.log(`  ❌ ${String(i+1).padStart(2)}/${LANGUAGES.length}  ${article.slug} FAILED`); }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n📊 Results: ${success} ✅ | ${fail} ❌`);
  console.log(`🎉 Done! Check linguo.id/blog`);
}

main().catch(console.error);
