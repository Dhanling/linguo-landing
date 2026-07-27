import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// AMHARIC PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Catatan: semua teks aksara Fidel disertai romanisasi dalam kurung.
// ─────────────────────────────────────────────────────────────────────────────
export const amharicPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti sapaan 'ሰላም (selam)' adalah:",
    options: ["Selamat tinggal", "Halo / damai", "Terima kasih", "Maaf"],
    correct: 1,
    explanation: "'ሰላም (selam)' harfiah berarti 'damai' dan dipakai sebagai sapaan 'halo' — mirip 'salam' dalam bahasa Indonesia (sama-sama akar Semit). 'ደህና ሁን (dehna hun)' = selamat tinggal, 'አመሰግናለሁ (ameseginalehu)' = terima kasih, 'ይቅርታ (yiqirta)' = maaf.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Amharik dengan artinya:",
    pairs: [
      { left: "አንድ (and)", right: "1" },
      { left: "ሶስት (sost)", right: "3" },
      { left: "አምስት (amist)", right: "5" },
      { left: "አስር (asir)", right: "10" },
    ],
    explanation: "Angka dasar penting untuk harga dan transaksi. Amharik ditulis dengan aksara Fidel: tiap huruf mewakili konsonan + vokal (abugida), bukan alfabet biasa.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'እኔ ተማሪ ___። (ine temari ___.)' (Saya seorang murid.)",
    context: "Kata 'adalah' yang menyesuaikan subjek 'saya'.",
    options: ["ነኝ (negn)", "ነው (new)", "ነሽ (nesh)", "ናቸው (nachew)"],
    correct: "ነኝ (negn)",
    explanation: "Kopula Amharik berubah mengikuti pelaku: ነኝ (negn) = saya adalah, ነው (new) = dia (laki-laki) adalah, ነሽ (nesh) = kamu (perempuan) adalah, ናቸው (nachew) = mereka adalah. Karena subjeknya 'እኔ (ine)' = saya, jawabannya ነኝ (negn).",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar (ingat: kata kerja di akhir!):",
    translation: "Saya makan injera.",
    tokens: ["እበላለሁ (ebelalehu)", "እኔ (ine)", "እንጀራ (injera)"],
    correct: ["እኔ (ine)", "እንጀራ (injera)", "እበላለሁ (ebelalehu)"],
    explanation: "Amharik berpola SOV: Subjek (እኔ/ine = saya) + Objek (እንጀራ/injera) + Kata kerja (እበላለሁ/ebelalehu = saya makan) — kata kerja selalu di AKHIR kalimat, berbeda dari bahasa Indonesia yang SVO.",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Untuk menyatakan aksi lampau 'Saya (sudah) minum kopi', kalimat yang tepat:",
    options: [
      "ቡና እጠጣለሁ (buna et'et'alehu)",
      "ቡና ጠጣሁ (buna t'et'ahu)",
      "ቡና እየጠጣሁ ነው (buna eyet'et'ahu new)",
      "ቡና ጠጣ (buna t'et'a)",
    ],
    correct: 1,
    explanation: "Akhiran -ሁ (-hu) pada bentuk sederhana menandai lampau orang pertama: ጠጣሁ (t'et'ahu) = saya sudah minum. 'እጠጣለሁ (et'et'alehu)' = saya minum/akan minum (imperfek), 'እየጠጣሁ ነው (eyet'et'ahu new)' = saya sedang minum, 'ጠጣ (t'et'a)' = dia minum (lampau).",
  },
  {
    id: "q6", difficulty: "A2", type: "matching",
    prompt: "Jodohkan kosakata sehari-hari dengan artinya:",
    pairs: [
      { left: "ውሃ (wiha)", right: "air" },
      { left: "ቤት (bet)", right: "rumah" },
      { left: "ምግብ (migib)", right: "makanan" },
      { left: "ገበያ (gebeya)", right: "pasar" },
    ],
    explanation: "Kosakata inti kebutuhan sehari-hari. 'ቤት (bet)' juga muncul dalam kata majemuk: ምግብ ቤት (migib bet) = rumah makan, መጽሐፍ ቤት (metsehaf bet) = perpustakaan.",
  },
  {
    id: "q7", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'ነገ ወደ ገበያ ___። (nege wede gebeya ___.)' (Besok saya akan pergi ke pasar.)",
    context: "Bentuk 'pergi' untuk masa depan, pelaku 'saya'.",
    options: ["እሄዳለሁ (ehedalehu)", "ሄድኩ (hedku)", "ሂድ (hid)", "ሄደ (hede)"],
    correct: "እሄዳለሁ (ehedalehu)",
    explanation: "Pola እ-…-ኣለሁ (e-…-alehu) = imperfek orang pertama, dipakai untuk masa kini/akan datang: እሄዳለሁ (ehedalehu) = saya (akan) pergi. 'ሄድኩ (hedku)' = saya pergi (lampau), 'ሂድ (hid)' = pergilah! (perintah), 'ሄደ (hede)' = dia pergi. 'ወደ (wede)' = ke (arah).",
  },
  {
    id: "q8", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan bentuk kata kerja yang tepat:",
    template: "ትናንት እንጀራ ___። ዛሬ ቡና ___። (tinant injera …. zare buna ….) (Kemarin saya makan injera. Hari ini saya minum kopi.)",
    blanks: ["በላሁ (belahu)", "እጠጣለሁ (et'et'alehu)"],
    options: ["በላሁ (belahu)", "እጠጣለሁ (et'et'alehu)", "እበላለሁ (ebelalehu)", "ጠጣሁ (t'et'ahu)", "ሂድ (hid)", "ነው (new)"],
    explanation: "'ትናንት (tinant)' = kemarin → lampau በላሁ (belahu = saya makan). 'ዛሬ (zare)' = hari ini → imperfek እጠጣለሁ (et'et'alehu = saya minum). Pengecoh: እበላለሁ (ebelalehu) = saya makan (imperfek — salah untuk 'kemarin'), ጠጣሁ (t'et'ahu) = saya minum (lampau — salah untuk 'hari ini').",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Arti 'ዝናብ ቢዘንብም እሄዳለሁ። (zinab bizenbim ehedalehu.)' :",
    options: [
      "Karena hujan, saya pergi",
      "Meskipun hujan turun, saya akan tetap pergi",
      "Kalau hujan, saya tidak pergi",
      "Setelah hujan, saya pergi",
    ],
    correct: 1,
    explanation: "Pola ቢ-…-ም (bi-…-m) = meskipun/walaupun: ቢዘንብም (bizenbim) = meskipun (hujan) turun. Tanpa akhiran -ም (-m), ቢዘንብ (bizenb) berarti 'kalau turun' (pengandaian). 'ዝናብ (zinab)' = hujan.",
  },
  {
    id: "q10", difficulty: "B1", type: "dragDrop",
    prompt: "Susun kalimat pengandaian (kata kerja utama tetap di akhir):",
    translation: "Kalau saya punya uang, saya akan membeli mobil.",
    tokens: ["መኪና (mekina)", "እገዛለሁ (egezalehu)", "ገንዘብ ካለኝ (genzeb kalegn)"],
    correct: ["ገንዘብ ካለኝ (genzeb kalegn)", "መኪና (mekina)", "እገዛለሁ (egezalehu)"],
    explanation: "Awalan ከ- (ke-) pada kata kerja membentuk klausa syarat: ካለኝ (kalegn) = kalau saya punya. Klausa syarat di depan, lalu objek መኪና (mekina = mobil), dan kata kerja utama እገዛለሁ (egezalehu = saya akan membeli) tetap di posisi akhir sesuai pola SOV.",
  },
  {
    id: "q11", difficulty: "B1", type: "matching",
    prompt: "Jodohkan kata penghubung Amharik dengan artinya:",
    pairs: [
      { left: "ግን (gin)", right: "tetapi" },
      { left: "ምክንያቱም (mikniyatum)", right: "karena" },
      { left: "እና (ina)", right: "dan" },
      { left: "ወይም (weyim)", right: "atau" },
    ],
    explanation: "Empat konjungsi inti kalimat majemuk, mis. 'አማርኛ እማራለሁ ምክንያቱም ኢትዮጵያ እወዳለሁ (amarigna emaralehu mikniyatum ityop'iya ewedalehu)' = saya belajar Amharik karena saya cinta Etiopia.",
  },
  {
    id: "q12", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi perbandingan: 'አውሮፕላን ___ ባቡር ይፈጥናል። (awroplan ___ babur yifet'inal.)' (Pesawat lebih cepat daripada kereta.)",
    context: "Kata penanda 'daripada'.",
    options: ["ከ (ke)", "ወደ (wede)", "እና (ina)", "በ (be)"],
    correct: "ከ (ke)",
    explanation: "Perbandingan memakai ከ (ke) = daripada: ከ ባቡር ይፈጥናል (ke babur yifet'inal) = lebih cepat daripada kereta. 'ወደ (wede)' = ke (arah), 'እና (ina)' = dan, 'በ (be)' = dengan/di.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Kalimat pasif 'መጽሐፉ በተማሪው ተነበበ። (metsehafu betemariw tenebebe.)' berarti:",
    options: [
      "Murid itu sedang membaca buku",
      "Buku itu dibaca oleh murid itu",
      "Murid itu akan membaca buku",
      "Buku itu ditulis oleh murid itu",
    ],
    correct: 1,
    explanation: "Awalan ተ- (te-) membentuk pasif: ነበበ (nebebe, membaca) → ተነበበ (tenebebe, dibaca). 'መጽሐፉ (metsehafu)' = buku itu (akhiran -u = 'itu'), 'በተማሪው (betemariw)' = oleh murid itu (በ/be- menandai pelaku). 'ተጻፈ (tets'afe)' baru berarti 'ditulis'.",
  },
  {
    id: "q14", difficulty: "B2", type: "missing",
    question: "Lengkapi kalimat dengan bentuk yang tepat:",
    template: "አማርኛ ___ እፈልጋለሁ፣ ___ ከባድ ነው። (amarigna … ifelligalehu, … kebad new.) (Saya ingin belajar bahasa Amharik, tetapi itu sulit.)",
    blanks: ["መማር (memar)", "ግን (gin)"],
    options: ["መማር (memar)", "እማራለሁ (emaralehu)", "ግን (gin)", "እና (ina)", "ወይም (weyim)", "ተማረ (temare)"],
    explanation: "Setelah 'ingin' (እፈልጋለሁ/ifelligalehu) dipakai infinitif berawalan መ- (me-): መማር (memar) = belajar. 'ግን (gin)' = tetapi (kontras dengan 'sulit'). Pengecoh: እማራለሁ (emaralehu) = saya belajar (bukan infinitif), ተማረ (temare) = dia belajar (lampau), እና (ina) = dan, ወይም (weyim) = atau.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'ቀስ በቀስ እንቁላል በእግሩ ይሄዳል (qes beqes inkulal be'igru yihedal)' paling dekat maknanya dengan:",
    options: [
      "Tong kosong nyaring bunyinya",
      "Sedikit demi sedikit, lama-lama menjadi bukit",
      "Besar pasak daripada tiang",
      "Air beriak tanda tak dalam",
    ],
    correct: 1,
    explanation: "Harfiah: 'perlahan-lahan, telur pun berjalan dengan kakinya' (ቀስ በቀስ/qes beqes = pelan-pelan, እንቁላል/inkulal = telur, እግር/igir = kaki) — dengan kesabaran dan proses bertahap, hal yang tampak mustahil pun tercapai; senapas dengan 'sedikit demi sedikit, lama-lama menjadi bukit'.",
  },
];
