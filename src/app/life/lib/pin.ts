// [life-dashboard-v1] Gerbang PIN untuk /life.
//
// Halaman ini memuat posisi keuangan pribadi + omzet semua lini bisnis, jadi
// ia TIDAK boleh ikut aturan halaman publik landing. Pengamanannya sengaja
// sederhana tapi tidak bisa ditebak dari klien:
//   • PIN disimpan di env (LIFE_PIN) — tidak pernah dikirim ke browser
//   • yang dititipkan ke cookie hanya HMAC(PIN) memakai LIFE_SECRET, jadi isi
//     cookie tidak bisa dibalik jadi PIN-nya
//   • cookie httpOnly + sameSite lax, umur 30 hari
//
// ⚠️ Set LIFE_PIN & LIFE_SECRET di Environment Variables Vercel. Selama belum
// diset, dipakai nilai bawaan di bawah — cukup untuk deploy pertama, TAPI
// segera timpa lewat dashboard Vercel.
import crypto from "crypto";

export const COOKIE_LIFE = "life_pass";
export const UMUR_COOKIE = 60 * 60 * 24 * 30; // 30 hari

const PIN_BAWAAN = "linguo-hidup";

function pinAsli() {
  return process.env.LIFE_PIN || PIN_BAWAAN;
}

function rahasia() {
  return (
    process.env.LIFE_SECRET ||
    process.env.REVALIDATE_SECRET ||
    "life-dashboard-fallback-secret"
  );
}

/** Token yang ditaruh di cookie — HMAC dari PIN, bukan PIN-nya sendiri. */
export function tokenUntuk(pin: string) {
  return crypto.createHmac("sha256", rahasia()).update(pin.trim()).digest("hex");
}

/** Bandingkan dalam waktu tetap supaya tidak bisa ditebak lewat selisih waktu. */
function samaAman(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function pinBenar(pin: string) {
  return samaAman(pin.trim(), pinAsli());
}

export function tokenBenar(token: string | undefined | null) {
  if (!token) return false;
  return samaAman(token, tokenUntuk(pinAsli()));
}

export function tokenSah() {
  return tokenUntuk(pinAsli());
}

/** Dipakai halaman untuk memberi tahu kalau PIN masih bawaan. */
export function pakaiPinBawaan() {
  return !process.env.LIFE_PIN;
}
