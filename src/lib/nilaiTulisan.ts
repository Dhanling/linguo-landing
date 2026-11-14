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

/** Path goresan (garis tengah) dilukis setebal huruf cetak, ukuran & letaknya diserahkan
 *  ke penyamaan kotak batas di nilaiBentuk. */
function gambarJalur(ctx: CanvasRenderingContext2D, W: number, jalur: string[], kotak: number) {
  ctx.save();
  ctx.scale(W / kotak, W / kotak);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = kotak * 0.075;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of jalur) {
    try { ctx.stroke(new Path2D(d)); } catch { /* path rusak — lewati */ }
  }
  ctx.restore();
}

function keBit(ctx: CanvasRenderingContext2D, W: number, H: number): Uint8Array {
  const d = ctx.getImageData(0, 0, W, H).data;
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = d[i * 4 + 3] > 70 ? 1 : 0;
  return out;
}

function tebalkan(src: Uint8Array, W: number, H: number, r: number): Uint8Array {
  let a = src;
  for (let k = 0; k < r; k++) {
    const b = new Uint8Array(a);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (a[i]) continue;
        if ((x > 0 && a[i - 1]) || (x < W - 1 && a[i + 1]) || (y > 0 && a[i - W]) || (y < H - 1 && a[i + W])) b[i] = 1;
      }
    }
    a = b;
  }
  return a;
}

/**
 * Skor kemiripan bentuk 0–100. Tulisan disamakan dulu ukuran & letaknya dengan
 * huruf acuan, jadi menulis tanpa bayangan (lebih kecil / agak bergeser) tidak
 * dihukum — yang dinilai bentuknya, bukan posisinya di kertas.
 */
export function nilaiBentuk(
  teks: string, garis: Pt[][], rtl: boolean, rasio = 1, font = FONT_AKSARA,
  /** Path goresan acuan (kotak `kotak`, default 109) — kalau ada, dipakai ganti huruf dari font. Hanya papan persegi. */
  jalur?: string[] | null, kotak = 109,
): number | null {
  const titik = garis.flat();
  if (!titik.length) return null;
  const lebar = rasio !== 1;
  const W = lebar ? 192 : 96;
  const H = Math.round(W * rasio);
  const buat = () => {
    const k = document.createElement("canvas");
    k.width = W;
    k.height = H;
    return k.getContext("2d", { willReadFrequently: true });
  };
  const cg = buat();
  const ci = buat();
  if (!cg || !ci) return null;
  if (jalur?.length && rasio === 1 && typeof Path2D !== "undefined") gambarJalur(cg, W, jalur, kotak);
  else gambarHuruf(cg, W, H, teks, "#000", rtl, font);
  const G = keBit(cg, W, H);
  let gx0 = W, gy0 = H, gx1 = 0, gy1 = 0, isiG = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (G[y * W + x]) {
    isiG++;
    if (x < gx0) gx0 = x; if (x > gx1) gx1 = x; if (y < gy0) gy0 = y; if (y > gy1) gy1 = y;
  }
  if (!isiG) return null;
  let ix0 = Infinity, iy0 = Infinity, ix1 = -Infinity, iy1 = -Infinity;
  for (const [x, y] of titik) {
    if (x < ix0) ix0 = x; if (x > ix1) ix1 = x; if (y < iy0) iy0 = y; if (y > iy1) iy1 = y;
  }
  const jepit = (v: number) => Math.min(3, Math.max(0.5, v));
  let sx: number, sy: number;
  if (lebar) {
    // Kata: lebar & tinggi disamakan sendiri-sendiri — jarak antarhuruf tulisan
    // tangan hampir tak pernah sama dengan huruf cetak.
    sx = jepit((gx1 - gx0) / W / Math.max(ix1 - ix0, 0.04));
    sy = jepit((gy1 - gy0) / W / Math.max(iy1 - iy0, 0.04));
  } else {
    const dimG = Math.max(gx1 - gx0, gy1 - gy0) / W;
    const dimI = Math.max(ix1 - ix0, iy1 - iy0, 0.04);
    sx = sy = jepit(dimG / dimI);
  }
  const cxG = (gx0 + gx1) / 2 / W, cyG = (gy0 + gy1) / 2 / W;
  const cxI = (ix0 + ix1) / 2, cyI = (iy0 + iy1) / 2;
  const pas = garis.map((g) => g.map(([x, y]) => [(x - cxI) * sx + cxG, (y - cyI) * sy + cyG] as Pt));
  gambarGaris(ci, W, pas, "#000", H * 0.05);
  const I = keBit(ci, W, H);
  // Garis tengah tinta (tipis) dipakai untuk presisi: tinta tebal selalu "kena"
  // badan huruf walau jalurnya melenceng.
  const ct = buat();
  if (!ct) return null;
  gambarGaris(ct, W, pas, "#000", H * 0.02);
  const T = keBit(ct, W, H);
  const Gt = tebalkan(G, W, H, 2);
  const It = tebalkan(I, W, H, 3);
  let isiT = 0, kena = 0, tepat = 0;
  for (let i = 0; i < W * H; i++) {
    if (G[i] && It[i]) kena++;
    if (T[i]) { isiT++; if (Gt[i]) tepat++; }
  }
  if (!isiT) return null;
  // cakupan = bagian huruf yang tertulis; presisi = bagian tulisan yang memang di jalur huruf.
  const cakupan = Math.min(1, kena / isiG / 0.85);
  const presisi = Math.min(1, tepat / isiT / 0.92);
  return Math.round(100 * Math.pow(cakupan, 1.3) * Math.pow(presisi, 1.3));
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
