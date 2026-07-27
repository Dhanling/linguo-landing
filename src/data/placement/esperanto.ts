import type { Question } from "./english";

// ─────────────────────────────────────────────────────────────────────────────
// ESPERANTO PLACEMENT TEST (15 soal, tipe campuran)
// A1: 4 soal · A2: 4 soal · B1: 4 soal · B2: 3 soal
// Fokus: akhiran -o/-a/-e/-as/-is/-os, akusatif -n, tabel korelativ.
// ─────────────────────────────────────────────────────────────────────────────
export const esperantoPlacementTest: Question[] = [
  // ═══════════════════════ A1 ═══════════════════════
  {
    id: "q1", difficulty: "A1", type: "multiple",
    question: "Arti dari 'Saluton!' adalah:",
    options: ["Sampai jumpa", "Halo", "Terima kasih", "Silakan"],
    correct: 1,
    explanation: "'Saluton!' = halo (secara harfiah 'salam', dengan akusatif -n karena singkatan dari 'mi donas saluton'). 'Ĝis revido' = sampai jumpa, 'Dankon' = terima kasih, 'Bonvolu' = silakan/tolong.",
  },
  {
    id: "q2", difficulty: "A1", type: "matching",
    prompt: "Jodohkan angka Esperanto dengan artinya:",
    pairs: [
      { left: "unu", right: "1" },
      { left: "tri", right: "3" },
      { left: "kvin", right: "5" },
      { left: "dek", right: "10" },
    ],
    explanation: "Angka Esperanto sepenuhnya teratur: 11 = dek unu, 30 = tridek, 55 = kvindek kvin. Hafal 1–10, sisanya tinggal dirangkai.",
  },
  {
    id: "q3", difficulty: "A1", type: "fillChoice",
    question: "Lengkapi: 'La hundo estas ___.' — Anjing itu besar.",
    context: "Pilih akhiran kelas kata yang tepat.",
    options: ["granda", "grando", "grande", "grandas"],
    correct: "granda",
    explanation: "Adjektiva SELALU berakhiran '-a': granda = besar. '-o' = nomina (grando = kebesaran/ukuran), '-e' = adverbia (grande = secara besar), '-as' = verba kala kini.",
  },
  {
    id: "q4", difficulty: "A1", type: "dragDrop",
    prompt: "Susun menjadi kalimat yang benar:",
    translation: "Saya makan roti.",
    tokens: ["panon", "Mi", "manĝas"],
    correct: ["Mi", "manĝas", "panon"],
    explanation: "Mi (saya) + manĝas (makan, kala kini -as) + panon (roti sebagai objek — WAJIB akusatif '-n': pano → panon).",
  },

  // ═══════════════════════ A2 ═══════════════════════
  {
    id: "q5", difficulty: "A2", type: "multiple",
    question: "Kalimat lampau yang benar untuk 'Kemarin saya belajar Esperanto':",
    options: [
      "Hieraŭ mi lernas Esperanton",
      "Hieraŭ mi lernis Esperanton",
      "Hieraŭ mi lernos Esperanton",
      "Hieraŭ mi lernus Esperanton",
    ],
    correct: 1,
    explanation: "Akhiran kala verba: '-is' = lampau (lernis), '-as' = kini (lernas), '-os' = futur (lernos), '-us' = kondisional/pengandaian (lernus). 'Hieraŭ' (kemarin) menuntut -is.",
  },
  {
    id: "q6", difficulty: "A2", type: "fillChoice",
    question: "Lengkapi: 'Mi vidas du ___.' — Saya melihat dua kucing.",
    context: "Perhatikan jamak dan fungsi objek.",
    options: ["katojn", "katoj", "katon", "kato"],
    correct: "katojn",
    explanation: "Jamak '-j' + akusatif '-n' harus dipakai bersamaan: kato → katoj (jamak) → katojn (jamak sebagai objek). 'katon' = satu kucing sebagai objek, 'katoj' = jamak tapi lupa akusatif.",
  },
  {
    id: "q7", difficulty: "A2", type: "missing",
    question: "Lengkapi kalimat dengan kala futur:",
    template: "Morgaŭ ni ___ al la urbo kaj ___ librojn. (Besok kami akan pergi ke kota dan akan membeli buku-buku.)",
    blanks: ["iros", "aĉetos"],
    options: ["iros", "iris", "iras", "aĉetos", "aĉetis", "aĉetas"],
    explanation: "'Morgaŭ' (besok) menuntut futur '-os': iros = akan pergi, aĉetos = akan membeli. Pengecoh: iris/aĉetis = lampau (-is), iras/aĉetas = kini (-as).",
  },
  {
    id: "q8", difficulty: "A2", type: "dragDrop",
    prompt: "Susun kalimat dengan objek dan penerima:",
    translation: "Dia menulis surat kepada temannya (sendiri).",
    tokens: ["leteron", "Ŝi", "al sia amiko", "skribas"],
    correct: ["Ŝi", "skribas", "leteron", "al sia amiko"],
    explanation: "Objek langsung berakusatif: leteron. Setelah preposisi 'al' TIDAK ada -n (al sia amiko). 'sia' = refleksif, merujuk kembali ke subjek 'ŝi' (temannya sendiri).",
  },

  // ═══════════════════════ B1 ═══════════════════════
  {
    id: "q9", difficulty: "B1", type: "multiple",
    question: "Kata tanya yang tepat untuk menanyakan TEMPAT:",
    options: ["Kiam", "Kie", "Kiel", "Kial"],
    correct: 1,
    explanation: "Tabel korelativ ki-: 'Kie' = di mana (tempat), 'Kiam' = kapan (waktu), 'Kiel' = bagaimana (cara), 'Kial' = mengapa (sebab). Akhiran -e = tempat, -am = waktu, -el = cara, -al = sebab.",
  },
  {
    id: "q10", difficulty: "B1", type: "matching",
    prompt: "Jodohkan korelativ Esperanto dengan artinya:",
    pairs: [
      { left: "ĉiam", right: "selalu" },
      { left: "neniam", right: "tidak pernah" },
      { left: "ie", right: "di suatu tempat" },
      { left: "ĉio", right: "segalanya" },
    ],
    explanation: "Tabel korelativ = awalan × akhiran: 'ĉi-' = semua, 'neni-' = tidak ada, 'i-' = suatu; '-am' = waktu, '-e' = tempat, '-o' = benda. Jadi ĉi+am = selalu, neni+am = tak pernah, i+e = di suatu tempat, ĉi+o = segalanya.",
  },
  {
    id: "q11", difficulty: "B1", type: "fillChoice",
    question: "Lengkapi: 'La infano kuris en la ___.' — Anak itu berlari MASUK KE dalam kamar.",
    context: "Bedakan lokasi diam vs arah gerakan.",
    options: ["ĉambron", "ĉambro", "ĉambre", "ĉambroj"],
    correct: "ĉambron",
    explanation: "Akusatif '-n' setelah preposisi tempat menandai ARAH: 'en la ĉambron' = masuk ke kamar. Tanpa -n ('en la ĉambro') berarti berlari-lari DI DALAM kamar. 'ĉambre' = adverbia, 'ĉambroj' = jamak.",
  },
  {
    id: "q12", difficulty: "B1", type: "missing",
    question: "Lengkapi dengan sufiks -iĝ (menjadi) dan -ig (membuat jadi):",
    template: "La teo ___, do mi ___ ĝin per la forno. (Teh itu menjadi dingin, jadi saya memanaskannya dengan kompor.)",
    blanks: ["malvarmiĝis", "varmigas"],
    options: ["malvarmiĝis", "malvarmigis", "varmigas", "varmiĝas", "varmis", "malvarmas"],
    explanation: "'-iĝ' = menjadi (intransitif): malvarmiĝis = menjadi dingin. '-ig' = membuat jadi (transitif): varmigas = memanaskan. 'mal-' = kebalikan (varma → malvarma). Pengecoh 'malvarmigis' = mendinginkan, 'varmiĝas' = sedang menjadi hangat.",
  },

  // ═══════════════════════ B2 ═══════════════════════
  {
    id: "q13", difficulty: "B2", type: "multiple",
    question: "Arti 'Se mi estus riĉa, mi vojaĝus tra la tuta mondo.':",
    options: [
      "Kalau saya kaya (nanti), saya akan berkeliling dunia",
      "Seandainya saya kaya, saya akan berkeliling dunia (pengandaian)",
      "Karena saya kaya, saya berkeliling dunia",
      "Ketika saya kaya, saya berkeliling dunia",
    ],
    correct: 1,
    explanation: "Akhiran '-us' = kondisional untuk pengandaian yang tidak nyata (saya TIDAK kaya). Bandingkan 'Se mi estos riĉa, mi vojaĝos' (-os) = syarat nyata di masa depan.",
  },
  {
    id: "q14", difficulty: "B2", type: "multiple",
    question: "Arti 'La domo estas konstruata.':",
    options: [
      "Rumah itu sedang dibangun",
      "Rumah itu sudah dibangun",
      "Rumah itu akan dibangun",
      "Rumah itu sedang membangun",
    ],
    correct: 0,
    explanation: "Partisip pasif punya tiga kala: '-ata' = sedang di- (konstruata), '-ita' = sudah di- (konstruita), '-ota' = akan di- (konstruota). Bentuk aktifnya: -anta/-inta/-onta.",
  },
  {
    id: "q15", difficulty: "B2", type: "multiple",
    question: "Peribahasa 'Kiu semas venton, rikoltos ŝtormon.' paling dekat maknanya dengan:",
    options: [
      "Berakit-rakit ke hulu, berenang-renang ke tepian",
      "Siapa menabur angin, akan menuai badai",
      "Sekali merengkuh dayung, dua tiga pulau terlampaui",
      "Bagai air di daun talas",
    ],
    correct: 1,
    explanation: "Terjemahan harfiahnya persis: 'kiu … tiu …' (siapa … dia …, korelativ), 'semas' = menabur (kini), 'rikoltos' = akan menuai (-os futur), 'venton'/'ŝtormon' berakusatif -n. Maknanya: perbuatan buruk kecil berbuah akibat besar.",
  },
];
