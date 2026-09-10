// [ebook-testprep-grafik-v1] Grafik untuk IELTS Writing Task 1 — SVG dari data.
//
// Task 1 Academic memberi siswa grafik garis/batang/pai/tabel dan menyuruhnya
// mendeskripsikan. Modul test-prep butuh grafik BENERAN di halamannya, bukan
// hanya tabel angka: yang dilatih justru membaca bentuk visualnya (tren naik,
// puncak, irisan terbesar). Digambar sendiri sebagai SVG dari data di JSON
// supaya angkanya konsisten dengan model jawaban dan tidak perlu berkas gambar
// terpisah; Chromium mencetak SVG tajam pada ukuran apa pun.
//
// Bentuk blok di berkas unit:
//   { "type": "grafik", "jenis": "batang" | "garis" | "pai",
//     "judul": "…", "satuan": "%", "sumbu_y": "…",
//     "kategori": ["2000", "2010", "2020"],
//     "seri": [{ "nama": "Men", "nilai": [10, 20, 30] }, …],
//     "pai": [{ "judul": "2000", "irisan": [{ "nama": "…", "nilai": 40 }, …] }],
//     "sumber": "…", "lebar": "150mm" }

const WARNA = ["#1A9E9E", "#F2A65A", "#5A6478", "#C0504D", "#7DB0D5", "#8E7CC3"];
const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const FON = `font-family="Helvetica Neue, Arial, sans-serif"`;

/** Skala sumbu yang enak dibaca: 0 … maks dibulatkan ke kelipatan yang rapi. */
function skalaRapi(maks, langkahIngin = 5) {
  if (maks <= 0) return { atas: 1, langkah: 1 };
  const kasar = maks / langkahIngin;
  const pangkat = 10 ** Math.floor(Math.log10(kasar));
  const sisa = kasar / pangkat;
  const rapi = sisa <= 1 ? 1 : sisa <= 2 ? 2 : sisa <= 2.5 ? 2.5 : sisa <= 5 ? 5 : 10;
  const langkah = rapi * pangkat;
  return { atas: Math.ceil(maks / langkah) * langkah, langkah };
}

const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));

function legenda(seri, x, y) {
  return seri.map((s, i) => `
    <g transform="translate(${x + i * 0},${y + i * 16})">
      <rect width="12" height="12" rx="2" fill="${WARNA[i % WARNA.length]}"/>
      <text x="17" y="10" font-size="10.5" fill="#1B2233" ${FON}>${esc(s.nama)}</text>
    </g>`).join("");
}

function kerangka(b, lebar, tinggi, isi) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lebar} ${tinggi}" width="${esc(b.lebar ?? "150mm")}" role="img">
    <rect width="${lebar}" height="${tinggi}" fill="#FFFFFF"/>
    ${b.judul ? `<text x="${lebar / 2}" y="18" text-anchor="middle" font-size="12.5" font-weight="700" fill="#1B2233" ${FON}>${esc(b.judul)}</text>` : ""}
    ${isi}
    ${b.sumber ? `<text x="${lebar - 6}" y="${tinggi - 5}" text-anchor="end" font-size="8.5" fill="#8A93A3" ${FON}>${esc(b.sumber)}</text>` : ""}
  </svg>`;
}

/** Sumbu + kisi untuk grafik batang & garis. Mengembalikan fungsi pemeta. */
function sumbu(b, L, T, kiri, atas, kanan, bawah) {
  const semua = b.seri.flatMap((s) => s.nilai);
  const { atas: maks, langkah } = skalaRapi(b.maks ?? Math.max(...semua));
  const y = (v) => bawah - ((v - 0) / maks) * (bawah - atas);
  let out = "";
  for (let v = 0; v <= maks + 1e-9; v += langkah) {
    out += `<line x1="${kiri}" x2="${kanan}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "#5A6478" : "#E7ECEB"}" stroke-width="1"/>
      <text x="${kiri - 6}" y="${y(v) + 3.5}" text-anchor="end" font-size="9.5" fill="#5A6478" ${FON}>${fmt(v)}${b.satuan && b.satuan.length <= 2 ? esc(b.satuan) : ""}</text>`;
  }
  if (b.sumbu_y) out += `<text transform="translate(12,${(atas + bawah) / 2}) rotate(-90)" text-anchor="middle" font-size="9.5" fill="#5A6478" ${FON}>${esc(b.sumbu_y)}</text>`;
  return { y, maks, out };
}

export function grafikBatang(b) {
  const L = 560, T = 300;
  const kiri = 58, kanan = L - 20, atas = 34, bawah = T - 60;
  const { y, out } = sumbu(b, L, T, kiri, atas, kanan, bawah);
  const n = b.kategori.length, m = b.seri.length;
  const lebarKelompok = (kanan - kiri) / n;
  const lebarBatang = Math.min(34, (lebarKelompok * 0.7) / m);
  let batang = "";
  b.kategori.forEach((k, i) => {
    const x0 = kiri + i * lebarKelompok + (lebarKelompok - lebarBatang * m) / 2;
    b.seri.forEach((s, j) => {
      const v = s.nilai[i] ?? 0;
      const x = x0 + j * lebarBatang;
      batang += `<rect x="${x}" y="${y(v)}" width="${lebarBatang - 2}" height="${bawah - y(v)}" fill="${WARNA[j % WARNA.length]}"/>`;
      if (b.label_nilai) batang += `<text x="${x + (lebarBatang - 2) / 2}" y="${y(v) - 3}" text-anchor="middle" font-size="8.5" fill="#1B2233" ${FON}>${fmt(v)}</text>`;
    });
    batang += `<text x="${kiri + i * lebarKelompok + lebarKelompok / 2}" y="${bawah + 14}" text-anchor="middle" font-size="9.5" fill="#1B2233" ${FON}>${esc(k)}</text>`;
  });
  const leg = m > 1 ? legenda(b.seri, kiri, bawah + 26) : "";
  return kerangka(b, L, T + (m > 1 ? m * 16 - 10 : 0), out + batang + leg);
}

export function grafikGaris(b) {
  const L = 560, T = 300;
  const kiri = 58, kanan = L - 20, atas = 34, bawah = T - 60;
  const { y, out } = sumbu(b, L, T, kiri, atas, kanan, bawah);
  const n = b.kategori.length;
  const x = (i) => kiri + 18 + (i * (kanan - kiri - 36)) / Math.max(1, n - 1);
  let garis = "";
  b.kategori.forEach((k, i) => {
    garis += `<text x="${x(i)}" y="${bawah + 14}" text-anchor="middle" font-size="9.5" fill="#1B2233" ${FON}>${esc(k)}</text>`;
  });
  b.seri.forEach((s, j) => {
    const w = WARNA[j % WARNA.length];
    const d = s.nilai.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
    garis += `<path d="${d}" fill="none" stroke="${w}" stroke-width="2.4" stroke-linejoin="round"${j % 2 ? ' stroke-dasharray="6 3"' : ""}/>`;
    s.nilai.forEach((v, i) => { garis += `<circle cx="${x(i)}" cy="${y(v)}" r="3.2" fill="#fff" stroke="${w}" stroke-width="2"/>`; });
  });
  const m = b.seri.length;
  const leg = m > 1 ? legenda(b.seri, kiri, bawah + 26) : "";
  return kerangka(b, L, T + (m > 1 ? m * 16 - 10 : 0), out + garis + leg);
}

export function grafikPai(b) {
  const pai = b.pai ?? [{ judul: "", irisan: b.seri.map((s) => ({ nama: s.nama, nilai: s.nilai[0] })) }];
  const L = 560, R = 78;
  const T = 250;
  const nama = [...new Set(pai.flatMap((p) => p.irisan.map((i) => i.nama)))];
  const warna = (n) => WARNA[nama.indexOf(n) % WARNA.length];
  let isi = "";
  pai.forEach((p, k) => {
    const cx = (L / (pai.length + 1)) * (k + 1) - (nama.length ? 40 : 0), cy = 130;
    const total = p.irisan.reduce((a, i) => a + i.nilai, 0);
    let sudut = -Math.PI / 2;
    p.irisan.forEach((i) => {
      const a2 = sudut + (i.nilai / total) * Math.PI * 2;
      const besar = a2 - sudut > Math.PI ? 1 : 0;
      const x1 = cx + R * Math.cos(sudut), y1 = cy + R * Math.sin(sudut);
      const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
      isi += `<path d="M${cx},${cy} L${x1},${y1} A${R},${R} 0 ${besar} 1 ${x2},${y2} Z" fill="${warna(i.nama)}" stroke="#fff" stroke-width="1.5"/>`;
      const tengah = (sudut + a2) / 2;
      const pct = Math.round((i.nilai / total) * 100);
      if (pct >= 4) isi += `<text x="${cx + (R + 16) * Math.cos(tengah)}" y="${cy + (R + 16) * Math.sin(tengah) + 3.5}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#1B2233" ${FON}>${fmt(i.nilai)}${esc(b.satuan ?? "%")}</text>`;
      sudut = a2;
    });
    if (p.judul) isi += `<text x="${cx}" y="${cy + R + 34}" text-anchor="middle" font-size="11" font-weight="700" fill="#1B2233" ${FON}>${esc(p.judul)}</text>`;
  });
  // Legenda memakai WARNA[i] berurutan, dan `nama` juga berurutan — cocok dengan warna().
  isi += legenda(nama.map((n) => ({ nama: n })), L - 150, 60);
  return kerangka(b, L, T, isi);
}

export function grafik(b) {
  if (b.jenis === "batang") return grafikBatang(b);
  if (b.jenis === "garis") return grafikGaris(b);
  if (b.jenis === "pai") return grafikPai(b);
  throw new Error(`grafik: jenis "${b.jenis}" tak dikenal`);
}
