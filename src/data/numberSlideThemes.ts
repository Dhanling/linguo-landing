// Tema negara dan karakter untuk materi angka; ilustrasi dibuat dengan imagegen.
export interface NumberTheme { slug: string; code: string; label: string; country: string; image: string }
export const NUMBER_THEMES: readonly NumberTheme[] = [
  {
    "slug": "english",
    "code": "en",
    "label": "Inggris",
    "country": "Britania Raya",
    "image": "/slide-cover/number-themes/english-v1.jpg"
  },
  {
    "slug": "mandarin",
    "code": "zh",
    "label": "Mandarin",
    "country": "Tiongkok",
    "image": "/slide-cover/number-themes/mandarin-v1.jpg"
  },
  {
    "slug": "japanese",
    "code": "ja",
    "label": "Jepang",
    "country": "Jepang",
    "image": "/slide-cover/number-themes/japanese-v1.jpg"
  },
  {
    "slug": "korean",
    "code": "ko",
    "label": "Korea",
    "country": "Korea Selatan",
    "image": "/slide-cover/number-themes/korean-v1.jpg"
  },
  {
    "slug": "arabic",
    "code": "ar",
    "label": "Arab",
    "country": "Arab Saudi",
    "image": "/slide-cover/number-themes/arabic-v1.jpg"
  },
  {
    "slug": "german",
    "code": "de",
    "label": "Jerman",
    "country": "Jerman",
    "image": "/slide-cover/number-themes/german-v1.jpg"
  },
  {
    "slug": "french",
    "code": "fr",
    "label": "Prancis",
    "country": "Prancis",
    "image": "/slide-cover/number-themes/french-v1.jpg"
  },
  {
    "slug": "spanish",
    "code": "es",
    "label": "Spanyol",
    "country": "Spanyol",
    "image": "/slide-cover/number-themes/spanish-v1.jpg"
  },
  {
    "slug": "italian",
    "code": "it",
    "label": "Italia",
    "country": "Italia",
    "image": "/slide-cover/number-themes/italian-v1.jpg"
  },
  {
    "slug": "portuguese-pt",
    "code": "pt",
    "label": "Portugis Portugal",
    "country": "Portugal",
    "image": "/slide-cover/number-themes/portuguese-pt-v1.jpg"
  },
  {
    "slug": "portuguese-br",
    "code": "pt",
    "label": "Portugis Brasil",
    "country": "Brasil",
    "image": "/slide-cover/number-themes/portuguese-br-v1.jpg"
  },
  {
    "slug": "russian",
    "code": "ru",
    "label": "Rusia",
    "country": "Rusia",
    "image": "/slide-cover/number-themes/russian-v1.jpg"
  },
  {
    "slug": "turkish",
    "code": "tr",
    "label": "Turki",
    "country": "Turki",
    "image": "/slide-cover/number-themes/turkish-v1.jpg"
  },
  {
    "slug": "thai",
    "code": "th",
    "label": "Thai",
    "country": "Thailand",
    "image": "/slide-cover/number-themes/thai-v1.jpg"
  },
  {
    "slug": "vietnamese",
    "code": "vi",
    "label": "Vietnam",
    "country": "Vietnam",
    "image": "/slide-cover/number-themes/vietnamese-v1.jpg"
  },
  {
    "slug": "hindi",
    "code": "hi",
    "label": "Hindi",
    "country": "India",
    "image": "/slide-cover/number-themes/hindi-v1.jpg"
  },
  {
    "slug": "danish",
    "code": "da",
    "label": "Denmark",
    "country": "Denmark",
    "image": "/slide-cover/number-themes/danish-v1.jpg"
  },
  {
    "slug": "swedish",
    "code": "sv",
    "label": "Swedia",
    "country": "Swedia",
    "image": "/slide-cover/number-themes/swedish-v1.jpg"
  },
  {
    "slug": "norwegian",
    "code": "no",
    "label": "Norwegia",
    "country": "Norwegia",
    "image": "/slide-cover/number-themes/norwegian-v1.jpg"
  },
  {
    "slug": "finnish",
    "code": "fi",
    "label": "Finlandia",
    "country": "Finlandia",
    "image": "/slide-cover/number-themes/finnish-v1.jpg"
  },
  {
    "slug": "polish",
    "code": "pl",
    "label": "Polandia",
    "country": "Polandia",
    "image": "/slide-cover/number-themes/polish-v1.jpg"
  },
  {
    "slug": "czech",
    "code": "cs",
    "label": "Ceko",
    "country": "Ceko",
    "image": "/slide-cover/number-themes/czech-v1.jpg"
  },
  {
    "slug": "greek",
    "code": "el",
    "label": "Yunani",
    "country": "Yunani",
    "image": "/slide-cover/number-themes/greek-v1.jpg"
  },
  {
    "slug": "persian",
    "code": "fa",
    "label": "Persia",
    "country": "Iran",
    "image": "/slide-cover/number-themes/persian-v1.jpg"
  },
  {
    "slug": "hebrew",
    "code": "he",
    "label": "Ibrani",
    "country": "Israel",
    "image": "/slide-cover/number-themes/hebrew-v1.jpg"
  },
  {
    "slug": "georgian",
    "code": "ka",
    "label": "Georgia",
    "country": "Georgia",
    "image": "/slide-cover/number-themes/georgian-v1.jpg"
  },
  {
    "slug": "hungarian",
    "code": "hu",
    "label": "Hongaria",
    "country": "Hongaria",
    "image": "/slide-cover/number-themes/hungarian-v1.jpg"
  },
  {
    "slug": "romanian",
    "code": "ro",
    "label": "Rumania",
    "country": "Rumania",
    "image": "/slide-cover/number-themes/romanian-v1.jpg"
  },
  {
    "slug": "bulgarian",
    "code": "bg",
    "label": "Bulgaria",
    "country": "Bulgaria",
    "image": "/slide-cover/number-themes/bulgarian-v1.jpg"
  },
  {
    "slug": "ukrainian",
    "code": "uk",
    "label": "Ukraina",
    "country": "Ukraina",
    "image": "/slide-cover/number-themes/ukrainian-v1.jpg"
  },
  {
    "slug": "icelandic",
    "code": "is",
    "label": "Islandia",
    "country": "Islandia",
    "image": "/slide-cover/number-themes/icelandic-v1.jpg"
  },
  {
    "slug": "irish",
    "code": "ga",
    "label": "Irlandia",
    "country": "Irlandia",
    "image": "/slide-cover/number-themes/irish-v1.jpg"
  },
  {
    "slug": "filipino",
    "code": "tl",
    "label": "Filipino",
    "country": "Filipina",
    "image": "/slide-cover/number-themes/filipino-v1.jpg"
  },
  {
    "slug": "khmer",
    "code": "km",
    "label": "Khmer",
    "country": "Kamboja",
    "image": "/slide-cover/number-themes/khmer-v1.jpg"
  },
  {
    "slug": "lao",
    "code": "lo",
    "label": "Lao",
    "country": "Laos",
    "image": "/slide-cover/number-themes/lao-v1.jpg"
  },
  {
    "slug": "burmese",
    "code": "my",
    "label": "Myanmar",
    "country": "Myanmar",
    "image": "/slide-cover/number-themes/burmese-v1.jpg"
  },
  {
    "slug": "urdu",
    "code": "ur",
    "label": "Urdu",
    "country": "Pakistan",
    "image": "/slide-cover/number-themes/urdu-v1.jpg"
  },
  {
    "slug": "swahili",
    "code": "sw",
    "label": "Swahili",
    "country": "Tanzania",
    "image": "/slide-cover/number-themes/swahili-v1.jpg"
  },
  {
    "slug": "malay",
    "code": "ms",
    "label": "Melayu",
    "country": "Malaysia",
    "image": "/slide-cover/number-themes/malay-v1.jpg"
  },
  {
    "slug": "bipa",
    "code": "id",
    "label": "Indonesia",
    "country": "Indonesia",
    "image": "/slide-cover/number-themes/bipa-v1.jpg"
  },
  {
    "slug": "javanese",
    "code": "jv",
    "label": "Jawa",
    "country": "Jawa",
    "image": "/slide-cover/number-themes/javanese-v1.jpg"
  },
  {
    "slug": "sundanese",
    "code": "su",
    "label": "Sunda",
    "country": "Jawa Barat",
    "image": "/slide-cover/number-themes/sundanese-v1.jpg"
  },
  {
    "slug": "balinese",
    "code": "ban",
    "label": "Bali",
    "country": "Bali",
    "image": "/slide-cover/number-themes/balinese-v1.jpg"
  },
  {
    "slug": "batak",
    "code": "bbc",
    "label": "Batak",
    "country": "Sumatra Utara",
    "image": "/slide-cover/number-themes/batak-v1.jpg"
  },
  {
    "slug": "bugis",
    "code": "bug",
    "label": "Bugis",
    "country": "Sulawesi Selatan",
    "image": "/slide-cover/number-themes/bugis-v1.jpg"
  },
  {
    "slug": "madurese",
    "code": "mad",
    "label": "Madura",
    "country": "Madura",
    "image": "/slide-cover/number-themes/madurese-v1.jpg"
  },
  {
    "slug": "bengali",
    "code": "bn",
    "label": "Bengali",
    "country": "Bangladesh",
    "image": "/slide-cover/number-themes/bengali-v1.jpg"
  },
  {
    "slug": "cantonese",
    "code": "yue",
    "label": "Kanton",
    "country": "Hong Kong",
    "image": "/slide-cover/number-themes/cantonese-v1.jpg"
  },
  {
    "slug": "betawi",
    "code": "bew",
    "label": "Betawi",
    "country": "Jakarta",
    "image": "/slide-cover/number-themes/betawi-v1.jpg"
  },
  {
    "slug": "asl",
    "code": "ase",
    "label": "ASL",
    "country": "Amerika Serikat",
    "image": "/slide-cover/number-themes/asl-v1.jpg"
  },
  {
    "slug": "bisindo",
    "code": "bisindo",
    "label": "BISINDO",
    "country": "Indonesia",
    "image": "/slide-cover/number-themes/bisindo-v1.jpg"
  },
  {
    "slug": "bosnian",
    "code": "bs",
    "label": "Bosnia",
    "country": "Bosnia dan Herzegovina",
    "image": "/slide-cover/number-themes/bosnian-v1.jpg"
  }
];

