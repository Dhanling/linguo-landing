// [lingbook-phase1-v1] Buku demo Spanyol — validasi bahwa reader language-agnostic
// (skrip Latin: tanpa furigana, spasi antar-kata, field grammar berbeda).
import type { Book, Chapter, Token, Word } from "./types";

const glossary: Record<string, Word> = {
  hoy: { surface: "Hoy", meaning: "hari ini", pos: "adverbia", grammar: { Jenis: "adverbia waktu" } },
  yukiE: { surface: "Yuki", meaning: "Yuki (nama orang)", pos: "nomina", grammar: { Jenis: "nama diri" } },
  rinaE: { surface: "Rina", meaning: "Rina (nama orang)", pos: "nomina", grammar: { Jenis: "nama diri" } },
  y: { surface: "y", meaning: "dan", pos: "konjungsi", grammar: { Fungsi: "menghubungkan dua unsur setara" } },
  van: { surface: "van", meaning: "(mereka) pergi", pos: "verba", grammar: { Infinitivo: "ir — tidak beraturan", Konjugasi: "presente · 3 jamak (ellos/ellas)", Peran: "predikat" }, forms: [{ form: "voy", note: "yo" }, { form: "vas", note: "tú" }, { form: "va", note: "él / ella" }] },
  a: { surface: "a", meaning: "ke", pos: "preposisi", grammar: { Fungsi: "arah / tujuan" } },
  un: { surface: "un", meaning: "sebuah (maskulin)", pos: "artikel", grammar: { Jenis: "artikel tak tentu maskulin", "Pasangan feminin": "una" } },
  cafeE: { surface: "café", meaning: "kopi; kafe", pos: "nomina", grammar: { Gender: "maskulin", Jumlah: "tunggal", Peran: "objek" } },
  en: { surface: "en", meaning: "di", pos: "preposisi", grammar: { Fungsi: "lokasi" } },
  madrid: { surface: "Madrid", meaning: "Madrid (kota)", pos: "nomina", grammar: { Jenis: "nama tempat" } },
  les: { surface: "Les", meaning: "kepada mereka", pos: "pronomina", grammar: { Jenis: "pronomina objek tak langsung", Pola: "gustar → les gusta" } },
  gusta: { surface: "gusta", meaning: "disukai (oleh)", pos: "verba", grammar: { Infinitivo: "gustar", Konjugasi: "presente · 3 tunggal", Pola: "subjek = hal yang disukai", Peran: "predikat" }, forms: [{ form: "gustan", note: "subjek jamak" }, { form: "gustó", note: "lampau" }] },
  mucho: { surface: "mucho", meaning: "sangat; banyak", pos: "adverbia", grammar: { Posisi: "setelah verba" } },
  el: { surface: "el", meaning: "artikel tentu maskulin", pos: "artikel", grammar: { Jenis: "artikel tentu maskulin", "Pasangan feminin": "la" } },
  hola: { surface: "Hola", meaning: "halo", pos: "ungkapan", grammar: { Konteks: "sapaan universal, kasual-sopan" } },
  que: { surface: "Qué", meaning: "apa", pos: "pronomina", grammar: { Jenis: "kata tanya", Catatan: 'aksen é membedakan dari "que"' } },
  desean: { surface: "desean", meaning: "(Anda sekalian) ingin", pos: "verba", grammar: { Infinitivo: "desear", Konjugasi: "presente · ustedes (sopan jamak)", Register: "sopan, khas pelayan" }, forms: [{ form: "deseo", note: "yo" }, { form: "deseas", note: "tú" }] },
  tomar: { surface: "tomar", meaning: "minum; mengambil", pos: "verba", grammar: { Bentuk: "infinitivo", Peran: "pelengkap dari desean" } },
  quiero: { surface: "Quiero", meaning: "(saya) ingin", pos: "verba", grammar: { Infinitivo: "querer", "Perubahan akar": "e → ie", Konjugasi: "presente · 1 tunggal (yo)", Peran: "predikat" }, forms: [{ form: "quieres", note: "tú" }, { form: "quiere", note: "él / ella" }, { form: "queremos", note: "nosotros" }] },
  con: { surface: "con", meaning: "dengan", pos: "preposisi", grammar: { Frasa: "café con leche = kopi susu" } },
  leche: { surface: "leche", meaning: "susu", pos: "nomina", grammar: { Gender: "feminin", Frasa: "café con leche" } },
  porfavor: { surface: "por favor", meaning: "tolong; silakan", pos: "ungkapan", grammar: { Register: "sopan universal" } },
  para: { surface: "Para", meaning: "untuk", pos: "preposisi", grammar: { Frasa: 'para mí = "untuk saya"' } },
  mi: { surface: "mí", meaning: "saya (setelah preposisi)", pos: "pronomina", grammar: { Bentuk: "pronomina preposisional", Catatan: 'aksen í membedakan dari "mi" (milikku)' } },
  teE: { surface: "té", meaning: "teh", pos: "nomina", grammar: { Gender: "maskulin", Catatan: 'aksen é membedakan dari "te" (kamu)' } },
  verde: { surface: "verde", meaning: "hijau", pos: "adjektiva", grammar: { Posisi: "setelah nomina", Bentuk: "sama untuk maskulin / feminin" } },
  perfecto: { surface: "Perfecto", meaning: "sempurna; siap", pos: "ungkapan", grammar: { Konteks: "konfirmasi antusias" } },
  ahora: { surface: "Ahora", meaning: "sekarang", pos: "adverbia", grammar: { Frasa: 'ahora mismo = "segera"' } },
  mismo: { surface: "mismo", meaning: "juga; tepat", pos: "adverbia", grammar: { Frasa: 'ahora mismo = "segera"' } },
  quieres: { surface: "quieres", meaning: "(kamu) ingin", pos: "verba", grammar: { Infinitivo: "querer", Konjugasi: "presente · 2 tunggal (tú)" } },
  quiere: { surface: "quiere", meaning: "(dia) ingin", pos: "verba", grammar: { Infinitivo: "querer", Konjugasi: "presente · 3 tunggal" } },
  queremos: { surface: "queremos", meaning: "(kami) ingin", pos: "verba", grammar: { Infinitivo: "querer", Konjugasi: "presente · 1 jamak", Catatan: "akar tidak berubah pada nosotros" } },
};

const t = (...keys: string[]): Token[] => keys.map((k) => (glossary[k] ? { ref: k } : { text: k }));

const chapter: Chapter = {
  slug: "en-el-cafe",
  label: "Bab 3 — En el café",
  title: "En el café",
  subtitle: "Di Kafe",
  meta: "± 6 menit baca · 18 kata baru",
  glossary,
  blocks: [
    { type: "heading", text: "El diálogo", sub: "Percakapan" },
    {
      type: "paragraph",
      tokens: t("hoy", ",", "yukiE", "y", "rinaE", "van", "a", "un", "cafeE", "en", "madrid", ".", "les", "gusta", "mucho", "el", "cafeE", "."),
      translation: "Hari ini, Yuki dan Rina pergi ke sebuah kafe di Madrid. Mereka sangat suka kopi.",
    },
    {
      type: "callout",
      variant: "info",
      title: "Artikel & gender",
      body: "Setiap nomina Spanyol punya gender. Artikelnya mengikuti: un / el (maskulin), una / la (feminin). café bergender maskulin → un café.",
    },
    {
      type: "dialog",
      audioSrc: "/audio/lingbook/es/en-el-cafe/dialog.mp3",
      lines: [
        { speaker: "Camarero", role: "Pelayan", color: "#11313A", tokens: t("¡", "hola", "!", "¿", "que", "desean", "tomar", "?"), translation: "Halo! Mau minum apa?" },
        { speaker: "Rina", role: "Siswa", color: "#1A9E9E", tokens: t("quiero", "un", "cafeE", "con", "leche", ",", "porfavor", "."), translation: "Saya mau kopi susu, ya." },
        { speaker: "Yuki", role: "Siswa", color: "#7A5FC0", tokens: t("para", "mi", ",", "un", "teE", "verde", "."), translation: "Untuk saya, teh hijau." },
        { speaker: "Camarero", role: "Pelayan", color: "#11313A", tokens: t("¡", "perfecto", "!", "ahora", "mismo", "."), translation: "Siap! Segera datang." },
      ],
    },
    {
      type: "table",
      title: "Conjugación: querer (presente)",
      columns: ["Subjek", "Bentuk", "Arti"],
      rows: [
        [{ text: "yo" }, { tokens: t("quiero") }, { text: "saya ingin" }],
        [{ text: "tú" }, { tokens: t("quieres") }, { text: "kamu ingin" }],
        [{ text: "él / ella" }, { tokens: t("quiere") }, { text: "dia ingin" }],
        [{ text: "nosotros" }, { tokens: t("queremos") }, { text: "kami ingin" }],
      ],
    },
  ],
};

export const esPaso: Book = {
  slug: "paso-a-paso",
  title: "Paso a Paso",
  language: { speechLang: "es-ES", name: "Spanyol", nativeName: "Español", script: "latin" },
  level: "A1",
  description: "Bahasa Spanyol langkah demi langkah — dialog sehari-hari dengan analisa kata & tata bahasa.",
  accent: "#E4A11B",
  coverGlyph: "ñ",
  chapterCount: 10,
  toc: [
    { slug: "hola", title: "¡Hola!", subtitle: "Perkenalan", duration: "8 mnt", status: "done" },
    { slug: "de-compras", title: "De compras", subtitle: "Berbelanja", duration: "7 mnt", status: "done" },
    { slug: "en-el-cafe", title: "En el café", subtitle: "Di kafe", duration: "6 mnt", status: "now" },
    { slug: "en-el-restaurante", title: "En el restaurante", subtitle: "Di restoran", duration: "8 mnt", status: "" },
    { slug: "en-la-estacion", title: "En la estación", subtitle: "Di stasiun", duration: "9 mnt", status: "" },
    { slug: "fin-de-semana", title: "El fin de semana", subtitle: "Akhir pekan", duration: "8 mnt", status: "" },
    { slug: "el-tiempo", title: "El tiempo", subtitle: "Cuaca", duration: "7 mnt", status: "" },
    { slug: "la-familia", title: "La familia", subtitle: "Keluarga", duration: "9 mnt", status: "" },
    { slug: "direcciones", title: "Direcciones", subtitle: "Bertanya arah", duration: "9 mnt", status: "" },
    { slug: "de-viaje", title: "De viaje", subtitle: "Perjalanan", duration: "10 mnt", status: "" },
  ],
  chapters: [chapter],
};
