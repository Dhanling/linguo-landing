// [nilai-tulisan-v1] Penilaian tulisan tangan dari kemiripan BENTUK (0–100), dihitung di
// peramban — gratis, instan, tanpa jaringan. Dipakai menu Latihan Menulis
// (WritingPractice), slide "Latihan Menulis · Part N" (PapanAksara) dan papan Tulis
// Bersama di Linguo Meet, supaya skor di ketiga tempat itu SAMA rumusnya.
//
// Dipindah apa adanya dari WritingPractice.tsx (14 Nov 2026); tambahannya cuma acuan
// berupa path goresan (`jalur`, kotak 109 KanjiVG/lib/goresan) — dipakai bila huruf
// punya data urutan goresan, jadi acuan = bentuk yang dilihat siswa di papan dan
// tidak bergantung pada font (blok CJK Strokes 笔画 sering tak ada di font perangkat).
//
// Berkas ini KEMBAR dengan linguo-admin-dashboard/src/lib/nilaiTulisan.ts — ubah dua-duanya.

/** Titik tulisan, dinormalkan terhadap LEBAR papan (y berkisar 0..rasio). */
export type Pt = [number, number];

/** Skor minimal dianggap lulus. */
export const BATAS_LULUS = 80;

export const FONT_AKSARA =
  '"Noto Sans", "Noto Sans JP", "Noto Sans KR", "Noto Sans Thai", "Noto Sans Arabic", "Noto Sans Devanagari", "Noto Sans Hebrew", "Hiragino Sans", "Apple SD Gothic Neo", "Thonburi", "Geeza Pro", "Malgun Gothic", "Leelawadee UI", "Nirmala UI", system-ui, sans-serif';

export function gambarHuruf(ctx: CanvasRenderingContext2D, W: number, H: number, teks: string, warna: string, rtl: boolean, font = FONT_AKSARA) {
  ctx.save();
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = warna;
  let px = H * 0.62;
  const ukur = () => {
    ctx.font = `${px}px ${font}`;
    const m = ctx.measureText(teks);
    return {
      kiri: m.actualBoundingBoxLeft,
      w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      naik: m.actualBoundingBoxAscent,
      h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
    };
  };
  let m = ukur();
  const skala = Math.min(1.25, (W * (W === H ? 0.72 : 0.88)) / Math.max(1, m.w), (H * 0.72) / Math.max(1, m.h));
  px *= skala;
  m = ukur();
  ctx.fillText(teks, (W - m.w) / 2 + m.kiri, (H - m.h) / 2 + m.naik);
  ctx.restore();
}

/** Garis dalam satuan lebar papan (S = lebar dalam piksel), dihaluskan lewat titik tengah. */
export function gambarGaris(ctx: CanvasRenderingContext2D, S: number, garis: Pt[][], warna: string, tebal: number) {
  ctx.save();
  ctx.strokeStyle = warna;
  ctx.fillStyle = warna;
  ctx.lineWidth = tebal;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const g of garis) {
    if (!g.length) continue;
    if (g.length === 1) {
      ctx.beginPath();
      ctx.arc(g[0][0] * S, g[0][1] * S, tebal / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(g[0][0] * S, g[0][1] * S);
    for (let i = 1; i < g.length - 1; i++) {
      const tx = ((g[i][0] + g[i + 1][0]) / 2) * S;
      const ty = ((g[i][1] + g[i + 1][1]) / 2) * S;
      ctx.quadraticCurveTo(g[i][0] * S, g[i][1] * S, tx, ty);
    }
    const akhir = g[g.length - 1];
    ctx.lineTo(akhir[0] * S, akhir[1] * S);
    ctx.stroke();
  }
  ctx.restore();
}

function keBit(ctx: CanvasRenderingContext2D, W: number, H: number): Uint8Array {
  const d = ctx.getImageData(0, 0, W, H).data;
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = d[i * 4 + 3] > 70 ? 1 : 0;
  return out;
}

/* ── [nilai-tulisan-v2] Penilaian bentuk yang adil (laporan #36e857f9) ──────────
   v1 (bitmap): tinta dilebarkan ±11 px di kotak 96 lalu dihitung "kena huruf",
   tanpa menghitung PANJANG tinta. Akibatnya coretan bolak-balik/menebal di sekitar
   huruf tetap 100, sedangkan tulisan rapi yang proporsinya sedikit beda (atau ada
   titik kecil yang menggeser kotak batas) bisa jatuh. v2 bekerja di koordinat:
   • acuan = garis tengah goresan (KanjiVG) atau piksel huruf font, disampel rapat;
   • tinta disampel per panjang busur, disejajarkan ke acuan lewat kotak batas
     ROBUST (persentil 3–97) lalu dicari sedikit geser/skala terbaik;
   • presisi = bagian tinta yang jatuh dekat bentuk huruf (tinta liar menurunkan),
     recall = bagian kerangka huruf yang tertulis,
   • tinta jauh lebih panjang dari huruf (coretan/menebalkan) dihukum,
   • jumlah goresan yang meleset jauh dari acuan dikurangi sedikit.
   Inti hitungan murni (tanpa DOM) → bisa diuji di node (linguo-admin-dashboard: scripts/uji-nilai-tulisan.mts). */

/** Acuan bentuk: titik rapat di garis tengah huruf + panjang total garis tengah. */
export type AcuanBentuk = { titik: Pt[]; panjang: number; gores?: number; /** nomor goresan tiap titik (selaras `titik`). */ idGores?: number[]; /** setengah tebal acuan (acuan berupa piksel huruf tebal). */ setengahTebal?: number };

export type RincianNilai = {
  skor: number;
  /** 0..1 — bagian tinta yang berada di bentuk huruf. */
  presisi: number;
  /** 0..1 — bagian kerangka huruf yang tertulis. */
  cakupan: number;
  /** Panjang tinta ÷ panjang huruf (≈1 = pas; >1.6 = terlalu banyak coretan). */
  rasioTinta: number;
  /** Jumlah goresan siswa & acuan (acuan null bila tak diketahui). */
  gores: number;
  goresAcuan: number | null;
  /** Satu kalimat pendek alasan skor (Bahasa Indonesia). */
  alasan: string;
};

const panjangGaris = (g: Pt[]) => {
  let L = 0;
  for (let i = 1; i < g.length; i++) L += Math.hypot(g[i][0] - g[i - 1][0], g[i][1] - g[i - 1][1]);
  return L;
};

/** Sampel titik tiap `langkah` sepanjang polyline. */
function sampelGaris(g: Pt[], langkah: number): Pt[] {
  if (g.length <= 1) return g.slice();
  const out: Pt[] = [g[0]];
  let sisa = langkah;
  for (let i = 1; i < g.length; i++) {
    let [ax, ay] = g[i - 1];
    const [bx, by] = g[i];
    let seg = Math.hypot(bx - ax, by - ay);
    while (seg >= sisa) {
      const t = sisa / seg;
      ax += (bx - ax) * t;
      ay += (by - ay) * t;
      out.push([ax, ay]);
      seg -= sisa;
      sisa = langkah;
    }
    sisa -= seg;
  }
  out.push(g[g.length - 1]);
  return out;
}

/** Path SVG (M L H V C S Q T A Z, absolut & relatif) → polyline. Busur A didekati garis lurus. */
export function polylineJalur(d: string): Pt[][] {
  const tok = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  let x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0, perintah = "", i = 0, prev = "";
  const n = () => parseFloat(tok[i++]);
  const kubik = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    for (let k = 1; k <= 16; k++) {
      const t = k / 16, u = 1 - t;
      cur.push([u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
    }
    cx = x2; cy = y2; x = x3; y = y3;
  };
  const kuadrat = (x1: number, y1: number, x2: number, y2: number) => {
    for (let k = 1; k <= 12; k++) {
      const t = k / 12, u = 1 - t;
      cur.push([u * u * x + 2 * u * t * x1 + t * t * x2, u * u * y + 2 * u * t * y1 + t * t * y2]);
    }
    cx = x1; cy = y1; x = x2; y = y2;
  };
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) perintah = tok[i++];
    else if (!perintah) { i++; continue; }
    const rel = perintah === perintah.toLowerCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    const P = perintah.toUpperCase();
    if (P === "Z") {
      if (cur.length) cur.push([sx, sy]);
      x = sx; y = sy;
      prev = P;
      continue;
    }
    if (i >= tok.length || /[a-zA-Z]/.test(tok[i])) { prev = P; continue; }
    if (P === "M") {
      if (cur.length > 1) out.push(cur);
      x = ox + n(); y = oy + n(); sx = x; sy = y;
      cur = [[x, y]];
      perintah = rel ? "l" : "L";
    } else if (P === "L") { x = ox + n(); y = oy + n(); cur.push([x, y]); }
    else if (P === "H") { x = ox + n(); cur.push([x, y]); }
    else if (P === "V") { y = oy + n(); cur.push([x, y]); }
    else if (P === "C") { const a = [n(), n(), n(), n(), n(), n()]; kubik(ox + a[0], oy + a[1], ox + a[2], oy + a[3], ox + a[4], oy + a[5]); }
    else if (P === "S") {
      const r1x = prev === "C" || prev === "S" ? 2 * x - cx : x, r1y = prev === "C" || prev === "S" ? 2 * y - cy : y;
      const a = [n(), n(), n(), n()];
      kubik(r1x, r1y, ox + a[0], oy + a[1], ox + a[2], oy + a[3]);
    } else if (P === "Q") { const a = [n(), n(), n(), n()]; kuadrat(ox + a[0], oy + a[1], ox + a[2], oy + a[3]); }
    else if (P === "T") {
      const r1x = prev === "Q" || prev === "T" ? 2 * x - cx : x, r1y = prev === "Q" || prev === "T" ? 2 * y - cy : y;
      kuadrat(r1x, r1y, ox + n(), oy + n());
    } else if (P === "A") { n(); n(); n(); n(); n(); x = ox + n(); y = oy + n(); cur.push([x, y]); }
    else { i++; }
    prev = P;
  }
  if (cur.length) out.push(cur);
  return out;
}

/** Acuan dari path goresan (kotak `kotak`) → satuan 0..1. Murni, tanpa DOM. */
export function acuanDariJalur(jalur: string[], kotak = 109): AcuanBentuk | null {
  const titik: Pt[] = [];
  const idGores: number[] = [];
  let panjang = 0;
  jalur.forEach((d, n) => {
    for (const g of polylineJalur(d)) {
      const s = g.map(([x, y]) => [x / kotak, y / kotak] as Pt);
      panjang += panjangGaris(s);
      for (const p of sampelGaris(s, 0.004)) { titik.push(p); idGores.push(n); }
    }
  });
  return titik.length ? { titik, panjang, gores: jalur.length, idGores } : null;
}

/** Acuan dari bitmap huruf font (W×H, satuan lebar W). Panjang garis tengah ≈ keliling/2. */
function acuanDariBitmap(G: Uint8Array, W: number, H: number): AcuanBentuk | null {
  const titik: Pt[] = [];
  let tepi = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!G[i]) continue;
    titik.push([(x + 0.5) / W, (y + 0.5) / W]);
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1 || !G[i - 1] || !G[i + 1] || !G[i - W] || !G[i + W]) tepi++;
  }
  // Tebal rata-rata ≈ 2·luas/keliling → setengahnya = luas/keliling.
  return titik.length ? { titik, panjang: tepi / 2 / W, setengahTebal: titik.length / Math.max(1, tepi) / W } : null;
}

/** Kotak batas robust (persentil) — satu titik nyasar tidak menggeser seluruh tulisan. */
function kotakRobust(t: Pt[], q = 0.03) {
  const xs = t.map((p) => p[0]).sort((a, b) => a - b);
  const ys = t.map((p) => p[1]).sort((a, b) => a - b);
  const ambil = (a: number[], f: number) => a[Math.min(a.length - 1, Math.max(0, Math.round(f * (a.length - 1))))];
  return { x0: ambil(xs, q), x1: ambil(xs, 1 - q), y0: ambil(ys, q), y1: ambil(ys, 1 - q) };
}

/** Peta jarak (chamfer) ke titik terdekat di kisi N×N. */
function petaJarak(titik: Pt[], x0: number, y0: number, sel: number, N: number) {
  const INF = 1e9;
  const d = new Float32Array(N * N).fill(INF);
  for (const [x, y] of titik) {
    const gx = Math.floor((x - x0) / sel), gy = Math.floor((y - y0) / sel);
    if (gx >= 0 && gy >= 0 && gx < N && gy < N) d[gy * N + gx] = 0;
  }
  const r2 = Math.SQRT2;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 1);
    if (y > 0) {
      v = Math.min(v, d[i - N] + 1);
      if (x > 0) v = Math.min(v, d[i - N - 1] + r2);
      if (x < N - 1) v = Math.min(v, d[i - N + 1] + r2);
    }
    d[i] = v;
  }
  for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) {
    const i = y * N + x;
    let v = d[i];
    if (x < N - 1) v = Math.min(v, d[i + 1] + 1);
    if (y < N - 1) {
      v = Math.min(v, d[i + N] + 1);
      if (x < N - 1) v = Math.min(v, d[i + N + 1] + r2);
      if (x > 0) v = Math.min(v, d[i + N - 1] + r2);
    }
    d[i] = v;
  }
  return (x: number, y: number) => {
    const fx = (x - x0) / sel, fy = (y - y0) / sel;
    const gx = Math.min(N - 1, Math.max(0, Math.floor(fx))), gy = Math.min(N - 1, Math.max(0, Math.floor(fy)));
    const luar = Math.hypot(Math.max(0, -fx, fx - N), Math.max(0, -fy, fy - N));
    return (d[gy * N + gx] + luar) * sel;
  };
}

/**
 * Inti penilaian bentuk (murni). `garis` & `acuan` dalam satuan yang sama (lebar papan = 1).
 * `lebar` = papan kata (skala x & y disamakan sendiri-sendiri).
 */
export function rinciBentuk(acuan: AcuanBentuk, garis: Pt[][], lebar = false): RincianNilai | null {
  const tintaMentah = garis.filter((g) => g.length > 0);
  if (!tintaMentah.length || !acuan.titik.length) return null;
  const gA = kotakRobust(acuan.titik, 0.01);
  const wA = Math.max(gA.x1 - gA.x0, 1e-3), hA = Math.max(gA.y1 - gA.y0, 1e-3);
  const D = Math.max(wA, hA);
  const cxA = (gA.x0 + gA.x1) / 2, cyA = (gA.y0 + gA.y1) / 2;
  // Sampel tinta per panjang busur (bukan per kejadian pointer — kecepatan jari tak berpengaruh).
  const langkahI = D * 0.008;
  const tintaSampel = tintaMentah.map((g) => sampelGaris(g, langkahI));
  const semuaI = tintaSampel.flat();
  const gI = kotakRobust(semuaI, 0.03);
  const wI = Math.max(gI.x1 - gI.x0, D * 0.04), hI = Math.max(gI.y1 - gI.y0, D * 0.04);
  const jepit = (v: number) => Math.min(3, Math.max(0.33, v));
  let bx: number, by: number;
  if (lebar) { bx = jepit(wA / wI); by = jepit(hA / hI); }
  else bx = by = jepit(D / Math.max(wI, hI));
  const cxI = (gI.x0 + gI.x1) / 2, cyI = (gI.y0 + gI.y1) / 2;
  // Bingkai dasar: tinta sudah sejajar kotak batas acuan.
  const tinta = tintaSampel.map((g) => g.map(([x, y]) => [(x - cxI) * bx + cxA, (y - cyI) * by + cyA] as Pt));
  const titikI = tinta.flat();
  const panjangI = tinta.reduce((s, g) => s + panjangGaris(g), 0);
  // Toleransi: ≤ setengah tebal huruf cetak = nilai penuh, lalu turun linear sampai 3× (≈ 10% tinggi huruf).
  const tinggiAcuan = lebar ? Math.max(hA, wA * 0.25) : D;
  const tol = tinggiAcuan * 0.035;
  const N = 128;
  const x0 = cxA - D, y0 = cyA - D, sel = (2 * D) / N;
  const jarakA = petaJarak(acuan.titik, x0, y0, sel, N);
  const jarakI = petaJarak(titikI, x0, y0, sel, N);
  const tebalA = acuan.setengahTebal ?? 0;
  const nilaiTitik = (dist: number) => (dist <= tol ? 1 : dist >= tol * 3 ? 0 : 1.5 - dist / (2 * tol));
  // Sampel acuan dijarangkan biar cepat (± 400 titik cukup).
  const lompatA = Math.max(1, Math.floor(acuan.titik.length / 400));
  const lompatI = Math.max(1, Math.floor(titikI.length / 500));
  let terbaik = { f: -1, p: 0, r: 0, s: 1, sx: 1, sy: 1, ox: 0, oy: 0 };
  for (const s of [0.86, 0.93, 1, 1.07, 1.15]) {
    for (const asp of lebar ? [1] : [0.9, 1, 1.1]) {
      const sx = s * Math.sqrt(asp), sy = s / Math.sqrt(asp);
      for (const dx of [-0.08, -0.04, 0, 0.04, 0.08]) {
        for (const dy of [-0.08, -0.04, 0, 0.04, 0.08]) {
          const ox = dx * D, oy = dy * D;
          let p = 0, np = 0;
          for (let k = 0; k < titikI.length; k += lompatI) {
            const [x, y] = titikI[k];
            p += nilaiTitik(jarakA(cxA + (x - cxA) * sx + ox, cyA + (y - cyA) * sy + oy));
            np++;
          }
          let r = 0, nr = 0;
          const sm = (sx + sy) / 2;
          for (let k = 0; k < acuan.titik.length; k += lompatA) {
            const [x, y] = acuan.titik[k];
            // Titik acuan dipetakan balik ke bingkai tinta.
            r += nilaiTitik(Math.max(0, jarakI(cxA + (x - ox - cxA) / sx, cyA + (y - oy - cyA) / sy) * sm - tebalA));
            nr++;
          }
          p /= np; r /= nr;
          const f = p * r;
          if (f > terbaik.f) terbaik = { f, p, r, s: sm, sx, sy, ox, oy };
        }
      }
    }
  }
  const { p: presisi, r: cakupan } = terbaik;
  // Goresan acuan yang (hampir) tak tertulis sama sekali — mis. goresan tegak か hilang —
  // dihukum tersendiri; cakupan rata-rata saja terlalu memaafkan karena goresan lain berdekatan.
  let goresHilang = 0;
  if (acuan.idGores && acuan.gores) {
    const jum = new Array<number>(acuan.gores).fill(0), n = new Array<number>(acuan.gores).fill(0);
    const { sx, sy, ox, oy, s: sm } = terbaik;
    acuan.titik.forEach(([x, y], k) => {
      const id = acuan.idGores![k];
      jum[id] += nilaiTitik(Math.max(0, jarakI(cxA + (x - ox - cxA) / sx, cyA + (y - oy - cyA) / sy) * sm - tebalA));
      n[id]++;
    });
    for (let id = 0; id < acuan.gores; id++) if (n[id] && jum[id] / n[id] < 0.6) goresHilang++;
  }
  const fHilang = Math.pow(0.7, goresHilang);
  const rasioTinta = (panjangI * terbaik.s) / Math.max(acuan.panjang, 1e-6);
  // Coretan berulang / menebalkan huruf: tinta jauh lebih panjang dari garis huruf.
  const fLebih = rasioTinta <= 1.6 ? 1 : 1 / (1 + 1.1 * (rasioTinta - 1.6));
  // Jumlah goresan: hanya selisih yang jelas (≥ 2) yang dikurangi, maksimal 15%.
  const gores = tintaMentah.filter((g) => panjangGaris(g) * bx > D * 0.01 || g.length === 1).length;
  const goresAcuan = acuan.gores ?? null;
  const selisih = goresAcuan == null ? 0 : Math.abs(gores - goresAcuan);
  const fGores = selisih <= 1 ? 1 : Math.max(0.85, 1 - 0.05 * (selisih - 1));
  // Tulisan tangan rapi lazimnya presisi & cakupan ≈ 0.92+ → dianggap penuh.
  const pp = Math.min(1, presisi / 0.92), rr = Math.min(1, cakupan / 0.92);
  const skor = Math.max(0, Math.min(100, Math.round(100 * Math.pow(pp * rr, 1.5) * fLebih * fGores * fHilang)));
  let alasan = "Bentuknya sudah pas.";
  const lemah = [
    { v: fLebih, t: "Terlalu banyak coretan, tulis tiap goresan sekali saja." },
    { v: pp, t: "Ada tinta di luar bentuk huruf." },
    { v: Math.min(rr, fHilang), t: goresHilang ? `Ada ${goresHilang} goresan yang belum tertulis.` : "Ada bagian huruf yang belum tertulis." },
    { v: fGores + 0.05, t: goresAcuan == null ? "" : `Huruf ini punya ${goresAcuan} goresan, kamu menulis ${gores}.` },
  ].filter((x) => x.t).sort((a, b) => a.v - b.v)[0];
  if (skor < 90 && lemah && lemah.v < 0.95) alasan = lemah.t;
  else if (skor < 90) alasan = "Hampir pas, rapikan sedikit lagi bentuknya.";
  return { skor, presisi, cakupan, rasioTinta, gores, goresAcuan, alasan };
}

/**
 * Skor kemiripan bentuk 0–100 + rincian. Tulisan disamakan dulu ukuran & letaknya dengan
 * huruf acuan, jadi menulis tanpa bayangan (lebih kecil / agak bergeser) tidak
 * dihukum — yang dinilai bentuknya, bukan posisinya di kertas.
 */
export function nilaiBentukRinci(
  teks: string, garis: Pt[][], rtl: boolean, rasio = 1, font = FONT_AKSARA,
  /** Path goresan acuan (kotak `kotak`, default 109) — kalau ada, dipakai ganti huruf dari font. Hanya papan persegi. */
  jalur?: string[] | null, kotak = 109,
): RincianNilai | null {
  if (!garis.some((g) => g.length)) return null;
  let acuan: AcuanBentuk | null = null;
  if (jalur?.length && rasio === 1) acuan = acuanDariJalur(jalur, kotak);
  if (!acuan) {
    if (typeof document === "undefined") return null;
    const W = rasio !== 1 ? 192 : 96;
    const H = Math.round(W * rasio);
    const k = document.createElement("canvas");
    k.width = W;
    k.height = H;
    const ctx = k.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    gambarHuruf(ctx, W, H, teks, "#000", rtl, font);
    acuan = acuanDariBitmap(keBit(ctx, W, H), W, H);
  }
  if (!acuan) return null;
  return rinciBentuk(acuan, garis, rasio !== 1);
}

export function nilaiBentuk(
  teks: string, garis: Pt[][], rtl: boolean, rasio = 1, font = FONT_AKSARA,
  jalur?: string[] | null, kotak = 109,
): number | null {
  return nilaiBentukRinci(teks, garis, rtl, rasio, font, jalur, kotak)?.skor ?? null;
}

export function pngTulisan(garis: Pt[][], rasio = 1): string {
  const W = rasio === 1 ? 320 : 560;
  const H = Math.round(W * rasio);
  const k = document.createElement("canvas");
  k.width = W;
  k.height = H;
  const ctx = k.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);
  gambarGaris(ctx, W, garis, "#000", H * 0.03);
  return k.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
}

/** Tinta papan slide/Meet (`pts` datar [x,y,x,y…] 0..1) → garis untuk nilaiBentuk. */
export function garisDariDatar(tinta: Array<{ pts: number[] }>): Pt[][] {
  return tinta
    .map((g) => {
      const out: Pt[] = [];
      for (let i = 0; i + 1 < g.pts.length; i += 2) out.push([g.pts[i], g.pts[i + 1]]);
      return out;
    })
    .filter((g) => g.length > 0);
}

/** Warna & label skor yang sama di semua papan. */
export function nadaSkor(skor: number): { warna: string; latar: string; label: string; labelEn: string } {
  if (skor >= BATAS_LULUS) return { warna: "#047857", latar: "#d1fae5", label: "Bagus!", labelEn: "Great!" };
  if (skor >= 50) return { warna: "#b45309", latar: "#fef3c7", label: "Hampir", labelEn: "Almost" };
  return { warna: "#be123c", latar: "#ffe4e6", label: "Coba lagi", labelEn: "Try again" };
}

/* ── kemajuan (localStorage, sama dengan menu Latihan Menulis) ─────────────────
   Bentuk: { [ScriptSet.id]: { [glyph.c]: skor terbaik } } — latihan di slide ikut
   menambah kemajuan di menu Latihan Menulis, dan sebaliknya. */
export const KUNCI_KEMAJUAN = "linguo:menulis:v1";
export type Kemajuan = Record<string, Record<string, number>>;
export function bacaKemajuan(): Kemajuan {
  try { return JSON.parse(localStorage.getItem(KUNCI_KEMAJUAN) || "{}") as Kemajuan; } catch { return {}; }
}
/** Simpan skor kalau lebih tinggi dari yang tersimpan; kembalikan kemajuan terbaru. */
export function simpanSkorTerbaik(set: string, c: string, skor: number): Kemajuan {
  const lama = bacaKemajuan();
  if (skor <= (lama[set]?.[c] ?? 0)) return lama;
  const baru = { ...lama, [set]: { ...(lama[set] ?? {}), [c]: skor } };
  try { localStorage.setItem(KUNCI_KEMAJUAN, JSON.stringify(baru)); } catch { /* storage penuh/terblokir */ }
  return baru;
}
