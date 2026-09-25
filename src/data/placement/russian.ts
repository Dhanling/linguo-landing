// ─────────────────────────────────────────────────────────────────────────────
// RUSSIAN (Русский) PLACEMENT TEST — 23 soal, mixed types (5 di antaranya listening)
// Distribusi: A1×5 · A2×6 · B1×7 · B2×5 (max 45)
// [placement-listening-v1] Soal ber-`audio` dibunyikan Chirp (lang "ru") lewat /api/tts;
// transkrip sengaja cuma ada di `audio.text` + pembahasan, tidak di layar soal.
// ─────────────────────────────────────────────────────────────────────────────
import type { Question } from "./english";

export const russianPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "ru1", difficulty: "A1", type: "multiple",
    question: "Bagaimana cara mengatakan 'hai' (informal) dalam bahasa Rusia?",
    options: ["До свидания", "Привет", "Спокойной ночи", "Спасибо"],
    correct: 1,
    explanation: "'Привет' (privyet) = hai. 'До свидания' = sampai jumpa, 'Спасибо' = terima kasih.",
  },
  {
    id: "ru2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan kata dengan artinya:",
    pairs: [
      { left: "дом", right: "rumah" },
      { left: "вода", right: "air" },
      { left: "хлеб", right: "roti" },
      { left: "кошка", right: "kucing" },
    ],
    explanation: "Kosakata benda dasar A1. Rusia tidak punya artikel.",
  },
  {
    id: "ru3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'Я ___ по-русски.' (Saya berbicara bahasa Rusia.)",
    context: "Konjugasi 'говорить' untuk 'я'.",
    options: ["говорю", "говоришь", "говорит", "говорить"],
    correct: "говорю",
    explanation: "'говорить': я говорю, ты говоришь, он говорит. Untuk 'я' → 'говорю'. (Catatan: 'to be' di present tidak dipakai.)",
  },
  {
    id: "ru4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya minum kopi.",
    tokens: ["пью", "Я", "кофе"],
    correct: ["Я", "пью", "кофе"],
    explanation: "'Я пью кофе'. Verba 'пить' (minum) untuk 'я' → 'пью'.",
  },

  // [placement-listening-v1] Listening A1 — melengkapi (pasangan mirip студентка/студент)
  {
    id: "l1", difficulty: "A1", type: "fillChoice",
    audio: { lang: "ru", text: "Здравствуйте! Меня зовут Анна. Я студентка, я учусь в университете." },
    question: "Dengarkan audio, lalu lengkapi: 'Я ___, я учусь в университете.'",
    context: "Pilih kata yang kamu dengar.",
    options: ["студентка", "студент", "студенты", "учительница"],
    correct: "студентка",
    explanation: "Transkrip: 'Здравствуйте! Меня зовут Анна. Я студентка, я учусь в университете.' (Halo! Nama saya Anna. Saya mahasiswi, saya kuliah di universitas.) Awas pasangan mirip: 'студентка' = mahasiswi (perempuan), 'студент' = mahasiswa (laki-laki) — bedanya cuma akhiran '-ка'. 'студенты' = para mahasiswa (jamak), 'учительница' = guru perempuan.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "ru5", difficulty: "A2", type: "multiple",
    question: "'Вчера я ___ в футбол.' (играть, past — subjek laki-laki)",
    options: ["играю", "играл", "буду играть", "играть"],
    correct: 1,
    explanation: "Past tense ditandai gender: laki-laki '-л' → 'играл'. (Perempuan: 'играла'.)",
  },
  {
    id: "ru6", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat lampau (perfektif):",
    translation: "Kemarin saya pergi ke sekolah.",
    tokens: ["пошёл", "Вчера", "школу", "в", "я"],
    correct: ["Вчера", "я", "пошёл", "в", "школу"],
    explanation: "'пойти' (perfektif) → 'пошёл'. Gerakan 'в + akusatif': 'в школу'.",
  },
  {
    id: "ru7", difficulty: "A2", type: "missing",
    question: "Aspek verba (несов. vs сов.) — lengkapi:",
    template: "Я обычно ___ книги, но вчера я ___ эту книгу до конца.",
    blanks: ["читаю", "прочитал"],
    options: ["читаю", "прочитал", "читал", "прочитаю", "читать", "прочитать"],
    explanation: "Imperfektif 'читаю' (rutinitas), perfektif 'прочитал' (selesai tuntas). Ini inti sistem aspek.",
  },
  {
    id: "ru8", difficulty: "A2", type: "fillChoice",
    question: "'Я еду ___ Москву.' (Saya sedang pergi ke Moskow.)",
    context: "Pilih preposisi gerakan (ke kota).",
    options: ["в", "на", "из", "от"],
    correct: "в",
    explanation: "Gerakan ke tempat tertutup/kota pakai 'в' + akusatif: 'в Москву'.",
  },
  {
    id: "ru9", difficulty: "A2", type: "multiple",
    question: "'Тебе ___ пойти к врачу.' (Kamu perlu ke dokter — saran)",
    options: ["надо", "можно", "нельзя", "будешь"],
    correct: 0,
    explanation: "'надо' + infinitif = perlu/harus (saran). 'Тебе надо пойти к врачу'.",
  },

  // [placement-listening-v1] Listening A2 — detail informasi (jam + kendaraan)
  {
    id: "l2", difficulty: "A2", type: "multiple",
    audio: { lang: "ru", text: "Обычно я встаю в семь часов, завтракаю, а в восемь тридцать еду на работу на метро, потому что на автобусе очень долго." },
    question: "Dengarkan audio. Jam berapa dia berangkat kerja, dan naik apa?",
    options: [
      "Jam 07.00, naik metro",
      "Jam 08.30, naik metro",
      "Jam 08.30, naik bus",
      "Jam 07.30, naik taksi",
    ],
    correct: 1,
    explanation: "Transkrip: 'Обычно я встаю в семь часов, завтракаю, а в восемь тридцать еду на работу на метро, потому что на автобусе очень долго.' (Biasanya saya bangun jam tujuh, sarapan, lalu jam delapan tiga puluh berangkat kerja naik metro, karena naik bus lama sekali.) Jam 07.00 = waktu BANGUN ('встаю'), bukan berangkat. Bus ('автобус') juga disebut, tapi justru dihindari karena lama. 'в восемь тридцать' = 08.30, 'на метро' = naik metro.",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "ru10", difficulty: "B1", type: "multiple",
    question: "'Если бы у меня ___ время, я бы путешествовал.' (сослагательное)",
    options: ["есть", "было", "будет", "быть"],
    correct: 1,
    explanation: "Pengandaian pakai 'бы' + past: 'Если бы у меня было время, я бы путешествовал'.",
  },
  {
    id: "ru11", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pasif lampau:",
    translation: "Surat itu ditulis kemarin.",
    tokens: ["написано", "Письмо", "вчера", "было"],
    correct: ["Письмо", "было", "написано", "вчера"],
    explanation: "Pasif lampau: 'было' + partisip pasif pendek 'написано'. 'Письмо было написано вчера'.",
  },
  {
    id: "ru12", difficulty: "B1", type: "matching",
    prompt: "Jodohkan konjungsi dengan artinya:",
    pairs: [
      { left: "потому что", right: "karena" },
      { left: "хотя", right: "meskipun" },
      { left: "чтобы", right: "supaya" },
      { left: "пока", right: "selama/sementara" },
    ],
    explanation: "Konjungsi subordinat B1 untuk menghubungkan klausa.",
  },
  {
    id: "ru13", difficulty: "B1", type: "missing",
    question: "Родительный падеж setelah 'нет' — lengkapi:",
    template: "У меня нет ___ (время) и нет ___ (деньги).",
    blanks: ["времени", "денег"],
    options: ["времени", "денег", "время", "деньги", "временем", "деньгами"],
    explanation: "Setelah 'нет' pakai genitif: 'время' → 'времени', 'деньги' → 'денег'.",
  },
  {
    id: "ru14", difficulty: "B1", type: "fillChoice",
    question: "'Человек, ___ я видел вчера, — мой сосед.' (относительное)",
    context: "Pilih bentuk 'который' yang tepat (objek, mask. bernyawa).",
    options: ["который", "которого", "которому", "которым"],
    correct: "которого",
    explanation: "Objek langsung mask. bernyawa → akusatif = genitif 'которого'. 'человек, которого я видел'.",
  },

  // [placement-listening-v1] Listening B1 — menerjemahkan (pengandaian если бы … бы)
  {
    id: "l3", difficulty: "B1", type: "multiple",
    audio: { lang: "ru", text: "Если бы ты мне позвонил, я бы встретил тебя на вокзале." },
    question: "Dengarkan audio. Pilih terjemahan yang paling tepat:",
    options: [
      "Kalau saja kamu meneleponku, aku pasti sudah menjemputmu di stasiun.",
      "Kamu meneleponku, jadi aku menjemputmu di stasiun.",
      "Kalau kamu meneleponku, aku akan menjemputmu di stasiun.",
      "Aku meneleponmu, tapi kamu tidak datang ke stasiun.",
    ],
    correct: 0,
    explanation: "Transkrip: 'Если бы ты мне позвонил, я бы встретил тебя на вокзале.' Pola 'если бы + lampau …, бы + lampau' = pengandaian yang TIDAK terjadi (nyatanya dia tidak menelepon, jadi tidak dijemput). Opsi 'kalau kamu meneleponku, aku akan menjemputmu' dalam bahasa Rusia tanpa 'бы': 'Если ты мне позвонишь, я тебя встречу' — pengandaian yang masih mungkin. 'встретить' di sini = menjemput/menyambut, 'вокзал' = stasiun.",
  },
  // [placement-listening-v1] Listening B1 — dikte 2 kata (pengecoh bunyi mirip)
  {
    id: "l4", difficulty: "B1", type: "missing",
    audio: { lang: "ru", text: "К сожалению, наш поезд задержался из-за сильного снегопада, поэтому мы приехали в Москву только поздно ночью." },
    question: "Dengarkan audio, lalu isi dua kata yang hilang:",
    template: "К сожалению, наш ___ задержался из-за сильного ___, поэтому мы приехали в Москву только поздно ночью.",
    blanks: ["поезд", "снегопада"],
    options: ["подъезд", "снегопада", "поездка", "поезд", "водопада", "листопада"],
    explanation: "Transkrip: 'К сожалению, наш поезд задержался из-за сильного снегопада, поэтому мы приехали в Москву только поздно ночью.' (Sayangnya kereta kami terlambat karena hujan salju lebat, jadi kami baru tiba di Moskow larut malam.) 'поезд' = kereta; 'подъезд' = pintu masuk gedung/apartemen dan 'поездка' = perjalanan — bunyinya mirip. 'снегопада' = hujan salju (genitif setelah 'из-за'); 'водопада' = air terjun, 'листопада' = musim gugur daun — mirip bunyi, tapi tidak cocok maknanya.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "ru15", difficulty: "B2", type: "multiple",
    question: "'Если бы я знал, ___.' (сослагательное о прошлом)",
    options: [
      "я поступлю иначе",
      "я бы поступил иначе",
      "я поступил иначе",
      "я поступаю иначе",
    ],
    correct: 1,
    explanation: "Pengandaian (masa lalu maupun sekarang) selalu pakai 'бы' + past: 'я бы поступил иначе'.",
  },
  {
    id: "ru16", difficulty: "B2", type: "dragDrop",
    prompt: "Susun kalimat dengan деепричастие (adverbial participle):",
    translation: "Setelah membaca buku, saya pergi tidur.",
    tokens: ["книгу", "Прочитав", "спать", "я", "лёг"],
    correct: ["Прочитав", "книгу", "я", "лёг", "спать"],
    explanation: "Деепричастие 'прочитав' (setelah membaca) menyatakan aksi yang mendahului. 'Прочитав книгу, я лёг спать'.",
  },
  {
    id: "ru17", difficulty: "B2", type: "missing",
    question: "Kosakata akademis — lengkapi:",
    template: "Новая политика ___ последствия, тогда как старая только ___ бы их.",
    blanks: ["смягчит", "усугубила"],
    options: ["смягчит", "усугубила", "создаст", "усилит", "стабилизирует", "предотвратит"],
    explanation: "'смягчить' = meredakan, 'усугубить' = memperparah. Pasangan antonim penting di B2.",
  },
  {
    id: "ru18", difficulty: "B2", type: "multiple",
    question: "Kalimat mana yang menggunakan номинализация (nominalisasi/gaya formal)?",
    options: [
      "Она быстро решила.",
      "Её решение было быстрым.",
      "Она решает быстро.",
      "Быстро она решила.",
    ],
    correct: 1,
    explanation: "Nominalisasi: verba 'решить' → nomina 'решение'. Ciri gaya tulisan formal.",
  },
  // [placement-listening-v1] Listening B2 — HOTS: menyimpulkan maksud berita
  {
    id: "l5", difficulty: "B2", type: "multiple",
    audio: { lang: "ru", text: "Городские власти сообщили, что в этом году число туристов выросло почти на треть. Тем не менее с первого января въезд в исторический центр на личных автомобилях будет запрещён." },
    question: "Dengarkan potongan berita ini. Kesimpulan yang PALING masuk akal adalah:",
    options: [
      "Kota melarang mobil masuk pusat kota karena jumlah turis menurun.",
      "Larangan mobil pribadi adalah kebijakan yang disengaja meski pariwisata sedang naik, bukan karena kota kehilangan pengunjung.",
      "Jumlah turis tahun ini turun sepertiga.",
      "Mulai 1 Januari, pusat kota bersejarah ditutup untuk semua turis.",
    ],
    correct: 1,
    explanation: "Transkrip: 'Городские власти сообщили, что в этом году число туристов выросло почти на треть. Тем не менее с первого января въезд в исторический центр на личных автомобилях будет запрещён.' (Pemerintah kota mengumumkan bahwa tahun ini jumlah wisatawan naik hampir sepertiga. Meskipun demikian, mulai 1 Januari kendaraan pribadi dilarang masuk ke pusat kota bersejarah.) Kuncinya 'Тем не менее' = meskipun demikian: turis NAIK tapi mobil tetap dilarang → itu kebijakan yang disengaja, bukan akibat sepi pengunjung. 'выросло' = naik (bukan turun), 'на треть' = sepertiga. Yang dilarang hanya 'въезд … на личных автомобилях' (masuk dengan mobil pribadi), bukan kunjungan turis.",
  },
];
