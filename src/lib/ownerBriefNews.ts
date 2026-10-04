// [owner-brief-v1] Berita harian untuk brief owner (PDF ke grup WA "Owner Group
// Linguo", lihat /api/cron/owner-brief).
//
// Alurnya: tarik RSS per topik → buang yang basi / kembar / sudah pernah dikirim
// → AI menilai tiap berita 1–10 → hanya yang lolos ambang (bawaan 8) yang masuk
// PDF, paling banyak beberapa per topik. Topik tanpa berita yang lolos ditulis
// apa adanya ("tidak ada yang lolos"), TIDAK diisi berita bernilai rendah.
//
// Ringkasan dibuat AI HANYA dari judul + cuplikan RSS (artikelnya tidak dibuka),
// jadi prompt-nya melarang menambah fakta di luar cuplikan.

export type TopikKey =
  | "bisnis"
  | "startup"
  | "edutech"
  | "bahasa"
  | "ai"
  | "tech"
  | "saham_id"
  | "saham_us";

export type Berita = {
  topik: TopikKey;
  judul: string;
  link: string;
  sumber: string;
  waktu: number; // epoch ms (0 = tak diketahui)
  cuplikan: string;
};

export type BeritaTerpilih = Berita & { skor: number; ringkas: string; penting: string };

export type HasilTopik = {
  key: TopikKey;
  label: string;
  dinilai: number; // jumlah berita yang benar-benar dinilai AI
  terpilih: BeritaTerpilih[];
  galat?: string; // feed/AI gagal — ditulis di PDF, bukan diam-diam kosong
};

type Feed = { url: string; sumber?: string };
type Topik = {
  key: TopikKey;
  label: string;
  jam: number; // jendela umur berita; topik sepi diberi jendela lebih panjang
  fokus: string; // petunjuk relevansi untuk AI
  feeds: Feed[];
};

// Google News: pencarian bebas per topik. Deskripsinya cuma tautan, jadi feed
// langsung (yang membawa cuplikan) tetap didahulukan bila ada.
const gn = (q: string, hari: number, id = true): Feed => ({
  url:
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(`${q} when:${hari}d`) +
    (id ? "&hl=id&gl=ID&ceid=ID:id" : "&hl=en-US&gl=US&ceid=US:en"),
});

export const TOPIK: Topik[] = [
  {
    key: "bisnis",
    label: "Bisnis & Ekonomi",
    jam: 30,
    fokus:
      "ekonomi & iklim usaha Indonesia: kebijakan, pajak, daya beli, kurs rupiah, suku bunga, UMKM, tren konsumen — yang memengaruhi bisnis jasa pendidikan online",
    feeds: [
      { url: "https://www.cnbcindonesia.com/entrepreneur/rss", sumber: "CNBC Indonesia" },
      { url: "https://www.antaranews.com/rss/ekonomi.xml", sumber: "Antara" },
      { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", sumber: "CNBC" },
      gn("ekonomi Indonesia kebijakan OR pajak OR rupiah OR \"daya beli\"", 1),
    ],
  },
  {
    key: "startup",
    label: "Startup",
    jam: 30,
    fokus:
      "pendanaan, akuisisi, PHK, penutupan, model bisnis & strategi tumbuh startup — terutama Indonesia/Asia Tenggara dan startup konsumer/pendidikan",
    feeds: [
      { url: "https://techcrunch.com/feed/", sumber: "TechCrunch" },
      gn("startup Indonesia pendanaan OR akuisisi OR PHK OR \"modal ventura\"", 1),
      gn("startup funding round OR acquisition Southeast Asia", 1, false),
    ],
  },
  {
    key: "edutech",
    label: "Edutech",
    jam: 72,
    fokus:
      "teknologi pendidikan: kursus online, bimbel, platform belajar, AI untuk belajar, regulasi pendidikan, pemain seperti Ruangguru/Zenius/Cakap/Duolingo/Coursera",
    feeds: [
      { url: "https://www.edsurge.com/articles_rss", sumber: "EdSurge" },
      gn("edtech OR \"education technology\" OR \"online learning\" startup", 3, false),
      gn("edutech OR \"kursus online\" OR \"bimbel online\" OR Ruangguru OR Cakap OR Zenius", 3),
    ],
  },
  {
    key: "bahasa",
    label: "Bahasa & Kursus Bahasa",
    jam: 72,
    fokus:
      "industri belajar bahasa: aplikasi & kursus bahasa, tes IELTS/TOEFL/PTE/JLPT/HSK/TOPIK, kebutuhan bahasa untuk kerja/kuliah luar negeri, kebijakan bahasa asing di Indonesia",
    feeds: [
      gn("\"language learning\" OR Duolingo OR Babbel OR \"language school\" OR IELTS OR TOEFL", 3, false),
      gn("\"kursus bahasa\" OR \"belajar bahasa\" OR IELTS OR TOEFL OR JLPT OR \"bahasa asing\"", 3),
    ],
  },
  {
    key: "ai",
    label: "AI",
    jam: 30,
    fokus:
      "kecerdasan buatan: rilis model/produk besar, harga API, regulasi, dan pemakaian AI yang bisa dipakai bisnis kecil atau mengubah cara orang belajar",
    feeds: [
      { url: "https://techcrunch.com/category/artificial-intelligence/feed/", sumber: "TechCrunch" },
      gn("\"kecerdasan buatan\" OR OpenAI OR Anthropic OR Gemini OR DeepSeek", 1),
    ],
  },
  {
    key: "tech",
    label: "Tech",
    jam: 30,
    fokus:
      "teknologi umum: platform besar (Google, Meta, WhatsApp, TikTok, Apple), aturan iklan/privasi, keamanan, perubahan yang berdampak ke pemasaran & operasional bisnis online",
    feeds: [
      { url: "https://www.theverge.com/rss/index.xml", sumber: "The Verge" },
      { url: "https://www.cnbcindonesia.com/tech/rss", sumber: "CNBC Indonesia" },
    ],
  },
  {
    key: "saham_id",
    label: "Saham Indonesia",
    jam: 30,
    fokus:
      "pasar saham Indonesia: arah IHSG, arus dana asing, BI rate, aksi korporasi & laporan keuangan emiten besar, IPO, aturan OJK/BEI",
    feeds: [
      { url: "https://www.cnbcindonesia.com/market/rss", sumber: "CNBC Indonesia" },
      { url: "https://investasi.kontan.co.id/rss", sumber: "Kontan" },
    ],
  },
  {
    key: "saham_us",
    label: "Saham AS",
    jam: 30,
    fokus:
      "pasar saham Amerika: S&P 500/Nasdaq, The Fed & data inflasi/tenaga kerja, laporan keuangan dan berita besar emiten teknologi",
    feeds: [
      { url: "https://www.cnbc.com/id/20910258/device/rss/rss.html", sumber: "CNBC" },
      { url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", sumber: "MarketWatch" },
      gn("Wall Street stocks \"S&P 500\" OR Nasdaq OR Fed", 1, false),
    ],
  },
];

const URUT_KEMBAR: TopikKey[] = ["edutech", "bahasa", "ai", "saham_id", "saham_us", "startup", "tech", "bisnis"];

const MAKS_PER_FEED = 25;
const MAKS_PER_TOPIK = 32; // yang dikirim ke AI
export const MAKS_TERPILIH = 4; // yang masuk PDF per topik

// ── Parser RSS/Atom ringan (tanpa dependensi) ───────────────────────────────
const ENT: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "-", mdash: "-",
  lsquo: "'", rsquo: "'", ldquo: '"', rdquo: '"', hellip: "...", middot: "·", rarr: "->",
};
export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}
/** HTML → teks polos satu baris. */
export function htmlKeTeks(s: string): string {
  // Dua kali decode: deskripsi RSS sering HTML yang di-escape di dalam XML.
  const sekali = decodeEntities(String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
  return decodeEntities(sekali.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}
function tag(blok: string, nama: string): string {
  const m = blok.match(new RegExp(`<${nama}(?:\\s[^>]*)?>([\\s\\S]*?)</${nama}>`, "i"));
  return m ? m[1] : "";
}

function parseFeed(xml: string, topik: TopikKey, sumberBawaan?: string): Berita[] {
  const blok = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  const out: Berita[] = [];
  for (const b of blok.slice(0, MAKS_PER_FEED)) {
    let judul = htmlKeTeks(tag(b, "title"));
    if (!judul) continue;
    let link = htmlKeTeks(tag(b, "link"));
    if (!link) link = (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || "";
    if (!/^https?:\/\//.test(link)) {
      const guid = htmlKeTeks(tag(b, "guid"));
      link = /^https?:\/\//.test(guid) ? guid : link;
    }
    if (!/^https?:\/\//.test(link)) continue;
    let sumber = htmlKeTeks(tag(b, "source")) || sumberBawaan || "";
    // Google News: "Judul berita - Nama Media".
    if (!sumberBawaan) {
      const i = judul.lastIndexOf(" - ");
      if (i > 20) {
        if (!sumber) sumber = judul.slice(i + 3);
        judul = judul.slice(0, i);
        // "Judul - Bisnis.com - Bisnis.com - Ekonomi": nama media terulang.
        const j = judul.lastIndexOf(" - ");
        if (j > 20 && sumber.toLowerCase().includes(judul.slice(j + 3).toLowerCase())) judul = judul.slice(0, j);
      }
    }
    const tgl = htmlKeTeks(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated"));
    const waktu = tgl ? Date.parse(tgl) || 0 : 0;
    let cuplikan = htmlKeTeks(tag(b, "description") || tag(b, "summary"));
    // Cuplikan Google News cuma mengulang judul + nama media — tak berguna.
    if (!sumberBawaan || cuplikan.startsWith(judul.slice(0, 40))) cuplikan = "";
    out.push({ topik, judul, link, sumber, waktu, cuplikan: cuplikan.slice(0, 320) });
  }
  return out;
}

/** Kunci pembanding judul (untuk buang kembar & yang sudah pernah dikirim). */
export function kunciJudul(judul: string): string {
  return judul.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").slice(0, 9).join(" ");
}

async function ambilFeed(f: Feed, topik: TopikKey): Promise<Berita[]> {
  const r = await fetch(f.url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; LinguoOwnerBrief/1.0)" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`${new URL(f.url).hostname} ${r.status}`);
  return parseFeed(await r.text(), topik, f.sumber);
}

// ── Penilaian AI ─────────────────────────────────────────────────────────────
// DeepSeek dulu (paling murah; isinya berita publik, bukan data Linguo), lalu
// Gemini, lalu Claude Haiku sebagai jaring terakhir.
const DEEPSEEK_MODELS = [process.env.OWNER_BRIEF_DEEPSEEK_MODEL || "deepseek-flash", "deepseek-chat"];
const GEMINI_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-lite-latest"];

async function llmJson(system: string, user: string): Promise<{ teks: string; oleh: string }> {
  const galat: string[] = [];
  const dsKey = process.env.DEEPSEEK_API_KEY;
  if (dsKey) {
    for (const model of DEEPSEEK_MODELS) {
      try {
        const r = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${dsKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 6000,
            response_format: { type: "json_object" },
            // deepseek-flash berpikir secara bawaan; untuk tugas nilai-merangkum
            // ini cuma menghabiskan jatah token.
            ...(model === "deepseek-chat" ? {} : { thinking: { type: "disabled" } }),
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          }),
          signal: AbortSignal.timeout(60_000),
        });
        if (!r.ok) {
          galat.push(`deepseek/${model} ${r.status}`);
          continue;
        }
        const d = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const teks = d.choices?.[0]?.message?.content?.trim();
        if (teks) return { teks, oleh: model };
        galat.push(`deepseek/${model} kosong`);
      } catch (e) {
        galat.push(`deepseek/${model} ${(e as Error).message}`);
      }
    }
  }
  const gmKey = process.env.GEMINI_API_KEY;
  if (gmKey) {
    for (const model of GEMINI_MODELS) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gmKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system }] },
              contents: [{ role: "user", parts: [{ text: user }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 6000, responseMimeType: "application/json" },
            }),
            signal: AbortSignal.timeout(60_000),
          },
        );
        if (!r.ok) {
          galat.push(`gemini/${model} ${r.status}`);
          continue;
        }
        const d = (await r.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const teks = (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
        if (teks) return { teks, oleh: model };
        galat.push(`gemini/${model} kosong`);
      } catch (e) {
        galat.push(`gemini/${model} ${(e as Error).message}`);
      }
    }
  }
  const anKey = process.env.ANTHROPIC_API_KEY;
  if (anKey) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": anKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 6000,
          system,
          messages: [{ role: "user", content: user }],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (r.ok) {
        const d = (await r.json()) as { content?: Array<{ type?: string; text?: string }> };
        const teks = (d.content || []).filter((b) => b.type === "text").map((b) => b.text || "").join("").trim();
        if (teks) return { teks, oleh: "claude-haiku-4-5" };
        galat.push("claude kosong");
      } else galat.push(`claude ${r.status}`);
    } catch (e) {
      galat.push(`claude ${(e as Error).message}`);
    }
  }
  throw new Error(galat.length ? `AI gagal (${galat.join("; ")})` : "tidak ada kunci AI");
}

const SYSTEM = `Kamu editor berita pribadi untuk Dhani, pemilik Linguo - sekolah bahasa online di Indonesia (kelas privat & grup 60+ bahasa, persiapan IELTS/TOEFL, e-book, klien B2B; pemasaran lewat WhatsApp, Instagram, Google; operasionalnya banyak memakai AI). Dhani juga investor ritel saham Indonesia dan Amerika.

Nilai SETIAP berita pada tiga sisi (bilangan bulat):
- "d" DAMPAK 0-4: 4 = peristiwa besar yang mengubah keadaan (aturan resmi yang ditetapkan/berlaku, rilis-akuisisi-kebangkrutan besar, gerak pasar tajam, keputusan bank sentral); 3 = kabar baru yang berarti; 2 = kabar biasa; 1 = kecil atau lokal sempit; 0 = bukan kabar (opini, tips, promosi, daftar "saham pilihan", ramalan tanpa peristiwa, jadwal acara).
- "r" RELEVANSI 0-3 terhadap topik dan terhadap Dhani: 3 = langsung menyentuh bisnis kursus bahasa/edtech Indonesia, kanal & biaya yang dipakainya (WhatsApp, Instagram, Google, iklan, harga AI), aturan pendidikan/pajak usaha digital RI, atau arah pasar saham Indonesia/AS secara luas; 2 = menyentuh industrinya atau satu emiten besar; 1 = jauh; 0 = di luar topik. Berita yang cuma "tentang internet/teknologi/ekonomi" tanpa sentuhan langsung itu paling tinggi r=2.
- "k" KUALITAS 0-3: 3 = media kredibel dan memuat fakta konkret (angka, tanggal, nama); 2 = cukup; 1 = media tak dikenal atau judul sensasional; 0 = clickbait/advertorial/siaran pers.
Jangan bermurah hati: kebanyakan berita pantas total 3-6. Total 8 ke atas hanya untuk kabar yang benar-benar layak 30 detik waktu pemilik bisnis; dari satu daftar biasanya cuma 0-3 berita, dan boleh tidak ada sama sekali.

Kalau beberapa berita mengabarkan PERISTIWA YANG SAMA, isi "g" dengan label peristiwa 2-4 kata yang PERSIS sama untuk semuanya (mis. "dividen interim asii"). Berita tanpa kembaran: "g" dikosongkan.

Hanya untuk berita dengan d+r+k >= 8, tulis juga dalam bahasa Indonesia:
- "ringkas": 1-2 kalimat isi beritanya. HANYA dari judul dan cuplikan yang diberikan - jangan menambah angka, nama, atau fakta yang tidak tertulis di sana. Kalau cuplikan kosong, cukup jelaskan judulnya.
- "penting": 1 kalimat kenapa ini penting, konkret. Jangan mengarang fakta tentang Linguo atau isi portofolio Dhani (kamu tidak tahu saham apa yang ia pegang); kalau kaitannya dengan Linguo tidak langsung, jangan dipaksakan - cukup tulis dampak umumnya.

Balas HANYA JSON ringkas satu baris per berita, tanpa spasi/indentasi berlebih: {"hasil":[{"i":<nomor>,"d":<0-4>,"r":<0-3>,"k":<0-3>}, ...]}. Semua berita wajib ada di "hasil". Kunci "g", "ringkas", "penting" hanya ditulis kalau ada isinya.`;

// Kata penting judul - untuk mengenali dua judul yang mengabarkan hal yang sama.
const kataJudul = (judul: string) =>
  new Set(judul.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w.length > 3));
function judulMirip(a: string, b: string): boolean {
  const A = kataJudul(a);
  const B = kataJudul(b);
  let sama = 0;
  for (const w of A) if (B.has(w)) sama++;
  const gabung = A.size + B.size - sama;
  return sama >= 4 || (gabung > 0 && sama / gabung >= 0.4);
}

type Dinilai = BeritaTerpilih & { g: string };

async function nilaiTopik(t: Topik, kandidat: Berita[], ambang: number): Promise<Dinilai[]> {
  const daftar = kandidat
    .map(
      (b, i) =>
        `${i + 1}. [${b.sumber || "?"}] ${b.judul}` + (b.cuplikan ? `\n   cuplikan: ${b.cuplikan}` : ""),
    )
    .join("\n");
  const { teks } = await llmJson(SYSTEM, `TOPIK: ${t.label}\nYang dicari: ${t.fokus}\n\nBERITA:\n${daftar}`);
  type Butir = { i?: number; d?: number; r?: number; k?: number; g?: string; ringkas?: string; penting?: string };
  let butir: Butir[] = [];
  try {
    const mulai = teks.indexOf("{");
    const akhir = teks.lastIndexOf("}");
    butir = (JSON.parse(mulai >= 0 && akhir > mulai ? teks.slice(mulai, akhir + 1) : teks) as { hasil?: Butir[] }).hasil || [];
  } catch {
    // Jawaban terpotong di tengah (kehabisan token): selamatkan butir yang utuh.
    for (const m of teks.match(/\{[^{}]*\}/g) || []) {
      try {
        butir.push(JSON.parse(m) as Butir);
      } catch {
        /* butir rusak dilewati */
      }
    }
    if (!butir.length) throw new Error("jawaban AI bukan JSON");
  }
  const jepit = (v: unknown, maks: number) => Math.min(maks, Math.max(0, Math.round(Number(v) || 0)));
  const out: Dinilai[] = [];
  for (const h of butir) {
    const b = kandidat[Number(h.i) - 1];
    // Skor dijumlah di sini, bukan dipercayakan ke hitungan model.
    const skor = jepit(h.d, 4) + jepit(h.r, 3) + jepit(h.k, 3);
    if (!b || skor < ambang) continue;
    out.push({
      ...b,
      skor,
      // Model kadang menghitung totalnya lain dan tak menulis ringkasan:
      // pakai cuplikan aslinya, jangan dikarang.
      ringkas: String(h.ringkas || "").trim() || b.cuplikan,
      penting: String(h.penting || "").trim(),
      g: String(h.g || "").trim().toLowerCase(),
    });
  }
  return out.sort((a, b) => b.skor - a.skor || b.cuplikan.length - a.cuplikan.length || b.waktu - a.waktu);
}

/**
 * Tarik semua topik, nilai, kembalikan yang lolos ambang.
 * `sudahDikirim` = kunci judul brief beberapa hari terakhir, supaya berita yang
 * sama tak muncul lagi besoknya (topik berjendela 72 jam rawan berulang).
 */
export async function kumpulkanBerita(opsi: {
  ambang?: number;
  sudahDikirim?: Set<string>;
  sekarang?: number;
}): Promise<HasilTopik[]> {
  const ambang = opsi.ambang ?? 8;
  const now = opsi.sekarang ?? Date.now();
  const lihat = new Set<string>(opsi.sudahDikirim || []);

  // 1. Tarik semua feed sekaligus.
  const mentah = await Promise.all(
    TOPIK.map(async (t) => {
      const hasil = await Promise.allSettled(t.feeds.map((f) => ambilFeed(f, t.key)));
      const gagal = hasil
        .filter((h): h is PromiseRejectedResult => h.status === "rejected")
        .map((h) => String((h.reason as Error)?.message || h.reason));
      // Selang-seling antar feed supaya satu feed ramai tak menghabiskan jatah.
      const daftar = hasil.map((h) => (h.status === "fulfilled" ? h.value : []));
      const campur: Berita[] = [];
      for (let i = 0; i < MAKS_PER_FEED; i++) for (const d of daftar) if (d[i]) campur.push(d[i]);
      return { t, campur, gagal, semuaGagal: gagal.length === t.feeds.length };
    }),
  );

  // 2. Saring umur + kembar. Berurutan (bukan paralel) supaya satu berita yang
  //    muncul di dua topik hanya dinilai sekali — topik yang lebih khusus
  //    didahulukan (berita AI dari TechCrunch masuk "AI", bukan "Startup").
  const urut = (k: TopikKey) => URUT_KEMBAR.indexOf(k);
  const siap = [...mentah].sort((a, b) => urut(a.t.key) - urut(b.t.key)).map(({ t, campur, gagal, semuaGagal }) => {
    const batas = now - t.jam * 3600_000;
    const kandidat: Berita[] = [];
    for (const b of campur) {
      if (b.waktu && (b.waktu < batas || b.waktu > now + 3600_000)) continue;
      // Tanpa tanggal: hanya diterima dari pencarian Google News (sudah dibatasi when:Nd).
      if (!b.waktu && !/news\.google\.com/.test(b.link)) continue;
      const k = kunciJudul(b.judul);
      if (!k || lihat.has(k)) continue;
      lihat.add(k);
      kandidat.push(b);
      if (kandidat.length >= MAKS_PER_TOPIK) break;
    }
    return { t, kandidat, gagal, semuaGagal };
  });

  // 3. Nilai tiap topik (paralel, satu panggilan AI per topik); hasilnya
  //    dikembalikan dalam urutan tampil (urutan TOPIK).
  const tampil = (k: TopikKey) => TOPIK.findIndex((t) => t.key === k);
  siap.sort((a, b) => tampil(a.t.key) - tampil(b.t.key));
  const hasil = await Promise.all(
    siap.map(async ({ t, kandidat, gagal, semuaGagal }): Promise<HasilTopik & { lolos?: Dinilai[] }> => {
      const dasar = { key: t.key, label: t.label };
      if (semuaGagal) return { ...dasar, dinilai: 0, terpilih: [], galat: `sumber berita gagal dimuat (${gagal.join(", ")})` };
      if (kandidat.length === 0) return { ...dasar, dinilai: 0, terpilih: [] };
      try {
        return {
          ...dasar,
          dinilai: kandidat.length,
          lolos: await nilaiTopik(t, kandidat, ambang),
          terpilih: [],
          galat: gagal.length ? `sebagian sumber gagal dimuat (${gagal.join(", ")})` : undefined,
        };
      } catch (e) {
        return { ...dasar, dinilai: 0, terpilih: [], galat: `penilaian AI gagal: ${String((e as Error).message).slice(0, 160)}` };
      }
    }),
  );

  // 4. Buang kembaran di antara yang lolos: label peristiwa dari AI (per topik)
  //    + kemiripan judul (lintas topik). Yang skornya lebih tinggi menang.
  const diambil: Dinilai[] = [];
  return hasil.map(({ lolos, ...topik }) => {
    const terpilih: BeritaTerpilih[] = [];
    for (const { g, ...b } of lolos || []) {
      if (terpilih.length >= MAKS_TERPILIH) break;
      if (diambil.some((x) => (g && x.topik === b.topik && x.g === g) || judulMirip(x.judul, b.judul))) continue;
      diambil.push({ ...b, g });
      terpilih.push(b);
    }
    return { ...topik, terpilih };
  });
}

// ── Penutupan pasar (Yahoo Finance, tanpa kunci) ────────────────────────────
export type Pasar = { nama: string; harga: number; ubahPct: number | null; tanggal: string };

const SIMBOL: Array<{ s: string; nama: string }> = [
  { s: "^JKSE", nama: "IHSG" },
  { s: "^GSPC", nama: "S&P 500" },
  { s: "^IXIC", nama: "Nasdaq" },
  { s: "USDIDR=X", nama: "USD/IDR" },
];

export async function ambilPasar(): Promise<Pasar[]> {
  const hasil = await Promise.allSettled(
    SIMBOL.map(async ({ s, nama }): Promise<Pasar> => {
      const r = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?range=10d&interval=1d`,
        { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10_000), cache: "no-store" },
      );
      if (!r.ok) throw new Error(`${s} ${r.status}`);
      const d = (await r.json()) as {
        chart?: { result?: Array<{ timestamp?: number[]; indicators?: { quote?: Array<{ close?: Array<number | null> }> } }> };
      };
      const res = d.chart?.result?.[0];
      const ts = res?.timestamp || [];
      const close = res?.indicators?.quote?.[0]?.close || [];
      const titik = ts.map((t, i) => ({ t, c: close[i] })).filter((p): p is { t: number; c: number } => typeof p.c === "number");
      if (!titik.length) throw new Error(`${s} kosong`);
      const akhir = titik[titik.length - 1];
      const sebelum = titik[titik.length - 2];
      return {
        nama,
        harga: akhir.c,
        ubahPct: sebelum ? ((akhir.c - sebelum.c) / sebelum.c) * 100 : null,
        tanggal: new Date(akhir.t * 1000).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }),
      };
    }),
  );
  return hasil.filter((h): h is PromiseFulfilledResult<Pasar> => h.status === "fulfilled").map((h) => h.value);
}
