// [ebook-buka-cepat-v3] Tiket berumur pendek untuk menarik potongan berkas
// e-book lewat /api/ebook/berkas.
//
// Kenapa perlu tiket sendiri, bukan token sesi Supabase seperti route induknya:
// pdf.js meminta modul POTONG DEMI POTONG (Range), belasan permintaan untuk
// satu bentangan pertama. Kalau tiap potongan harus diverifikasi ke Supabase,
// tiap potongan membayar satu perjalanan jaringan ~200 ms — lebih lambat dari
// mengunduh berkasnya bulat-bulat.
//
// Tiket ini cuma menyandang JALUR BERKAS + waktu kedaluwarsa, ditandatangani
// dengan kunci server. Memverifikasinya tidak menyentuh jaringan sama sekali.
// Hak aksesnya sendiri tetap diperiksa lengkap (pemilik, lunas, belum
// kedaluwarsa) di /api/ebook sebelum tiketnya diterbitkan — tiket ini hasil
// pemeriksaan itu, bukan pengganti.
import crypto from "node:crypto";

/* Kunci tanda tangan menumpang service role key: sudah pasti ada di semua
   lingkungan, tidak pernah keluar dari server, dan HMAC tidak membocorkan
   kuncinya. Tidak ada env baru yang harus diingat waktu deploy. */
const KUNCI = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const b64url = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const dariB64url = (s: string) => Buffer.from(s, "base64url").toString("utf8");

function tandaTangan(muatan: string): string {
  return crypto.createHmac("sha256", KUNCI).update(muatan).digest("base64url");
}

export type TiketBerkas = { p: string; exp: string; sig: string };

/** Terbitkan tiket untuk satu jalur objek di bucket e-book. */
export function buatTiket(jalurBerkas: string, umurDetik: number): TiketBerkas {
  const p = b64url(jalurBerkas);
  const exp = String(Date.now() + umurDetik * 1000);
  return { p, exp, sig: tandaTangan(`${p}.${exp}`) };
}

/** Tiket → jalur berkas. null = tanda tangan palsu atau sudah kedaluwarsa. */
export function bacaTiket(p: string, exp: string, sig: string): string | null {
  if (!KUNCI || !p || !exp || !sig) return null;
  const benar = tandaTangan(`${p}.${exp}`);
  // timingSafeEqual menolak panjang beda — dibandingkan dulu supaya tidak
  // melempar untuk masukan sampah.
  if (sig.length !== benar.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(benar))) return null;
  const batas = Number(exp);
  if (!Number.isFinite(batas) || batas < Date.now()) return null;
  try {
    const jalur = dariB64url(p);
    // Jalur harus tetap di dalam bucket e-book: tanda tangan sudah menjamin
    // isinya dari kita, tapi pagar ini yang menjaga kalau suatu saat ada kode
    // lain yang menerbitkan tiket dari masukan pengguna.
    if (!jalur || jalur.includes("..") || jalur.startsWith("/")) return null;
    return jalur;
  } catch {
    return null;
  }
}
