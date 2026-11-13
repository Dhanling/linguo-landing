// [slide-menulis-v1] Goresan dasar Hanzi (笔画 bǐhuà) — digambar tangan untuk slide
// "Latihan Menulis" Mandarin/Kanton. Kotak 109×109 (y ke bawah), path GARIS TENGAH,
// satu goresan per huruf (kunci = aksara blok "CJK Strokes" U+31C0–U+31E3).
// Bentuknya mengikuti goresan kaishu di buku pelajaran HSK; lengkung dibuat landai
// supaya tetap terbaca di papan sekecil ubin slide.
const G: Record<string, string[]> = {
  // 横 héng — mendatar, sedikit naik ke kanan
  "㇐": ["M18,57 Q54,52 91,53"],
  // 竖 shù — tegak lurus ke bawah
  "㇑": ["M54.5,14 L54.5,96"],
  // 撇 piě — menyapu ke kiri bawah
  "㇒": ["M72,16 Q70,52 50,72 Q38,85 22,93"],
  // 点 diǎn — titik miring ke kanan bawah
  "㇔": ["M44,38 Q56,46 64,62"],
  // 捺 nà — menyapu ke kanan bawah, melebar di ujung
  "㇏": ["M26,18 Q44,52 62,70 Q76,82 94,88"],
  // 提 tí — naik ke kanan atas
  "㇀": ["M28,76 L84,46"],
  // 横折 héngzhé — mendatar lalu tegak (口)
  "㇕": ["M22,28 L80,28 L78,92"],
  // 横钩 hénggōu — mendatar lalu kait ke kiri bawah (冖)
  "㇖": ["M18,44 L86,44 Q80,52 70,62"],
  // 竖钩 shùgōu — tegak lalu kait ke kiri (小)
  "㇚": ["M58,14 L58,84 Q57,93 42,84"],
  // 竖提 shùtí — tegak lalu naik ke kanan (以)
  "㇙": ["M40,16 L40,82 L74,62"],
  // 竖折 shùzhé — tegak lalu mendatar (山)
  "㇗": ["M34,18 L34,82 L88,82"],
  // 撇折 piězhé — menyapu kiri lalu mendatar naik (么)
  "㇜": ["M58,16 L30,64 L82,56"],
  // 撇点 piědiǎn — menyapu kiri lalu titik panjang ke kanan (女)
  "㇛": ["M62,14 L34,54 Q56,70 80,92"],
  // 横撇 héngpiě — mendatar lalu menyapu kiri (又)
  "㇇": ["M24,24 L80,24 Q64,58 24,90"],
  // 竖弯钩 shùwāngōu — tegak, membelok mendatar, kait ke atas (七, 儿)
  "㇟": ["M28,14 L28,78 Q28,88 42,88 L84,88 L86,72"],
  // 斜钩 xiégōu — miring panjang lalu kait ke atas (我, 戈)
  "㇂": ["M26,16 Q54,54 86,90 L88,72"],
  // 卧钩 wògōu — lengkung rebah lalu kait (心)
  "㇃": ["M18,48 Q34,86 62,84 Q78,82 88,70 L76,66"],
  // 横折钩 héngzhégōu — mendatar, tegak, kait ke kiri (月, 门)
  "㇆": ["M22,24 L80,24 L80,84 Q79,93 64,86"],
  // 弯钩 wāngōu — tegak melengkung lalu kait (了, 家)
  "㇁": ["M46,14 Q64,40 56,66 Q52,80 54,90 L40,80"],
  // 横折提 héngzhétí — mendatar, tegak, naik ke kanan (讠)
  "㇊": ["M26,28 L62,28 L62,82 L86,64"],
  // 竖弯 shùwān — tegak lalu membelok mendatar tanpa kait (四)
  "㇄": ["M34,18 L34,76 Q34,86 46,86 L88,86"],
  // 横折弯钩 héngzhéwāngōu — mendatar, turun, membelok, kait (九)
  "㇈": ["M18,36 L56,36 Q52,66 52,80 Q52,90 66,90 L88,90 L90,74"],
  // 横斜钩 héngxiégōu — mendatar lalu miring panjang dengan kait (风)
  "㇠": ["M24,28 L60,28 Q70,66 92,90 L94,72"],
};
export default G;
