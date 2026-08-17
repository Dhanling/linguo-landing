/**
 * Romaja → Hangul. Beda dari Sirilik/Yunani: Hangul bukan deretan huruf, tapi
 * SUKU KATA yang dirakit dari (awal, tengah, akhir) lalu digabung jadi satu
 * kode titik Unicode. Karena itu ia punya berkas sendiri, bukan tabel.
 *
 * Aturan yang menentukan hasil: konsonan akhir baru boleh dipasang kalau
 * sesudahnya BUKAN vokal. "hana" harus 하나 (na jadi suku kata baru), bukan
 * 한ㅏ. Tanpa lihat-ke-depan ini, tiap kata dua suku jadi salah.
 */

const AWAL = ["g", "gg", "n", "d", "dd", "r", "m", "b", "bb", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const TENGAH = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const AKHIR = ["", "g", "gg", "gs", "n", "nj", "nh", "d", "l", "lg", "lm", "lb", "ls", "lt", "lp", "lh", "m", "b", "bs", "s", "ss", "ng", "j", "ch", "k", "t", "p", "h"];

/** Ejaan lain yang lazim diketik orang untuk bunyi yang sama. */
const ALIAS_AWAL: Record<string, string> = { k: "g", t: "d", p: "b", l: "r", c: "ch" };
const ALIAS_AKHIR: Record<string, string> = { r: "l" };

const urutPanjang = (a: string, b: string) => b.length - a.length;
const AWAL_URUT = [...AWAL.filter(Boolean), ...Object.keys(ALIAS_AWAL)].sort(urutPanjang);
const TENGAH_URUT = [...TENGAH].sort(urutPanjang);
const AKHIR_URUT = [...AKHIR.filter(Boolean), ...Object.keys(ALIAS_AKHIR)].sort(urutPanjang);

function rakit(awal: string, tengah: string, akhir: string): string {
  const a = AWAL.indexOf(ALIAS_AWAL[awal] ?? awal);
  const t = TENGAH.indexOf(tengah);
  const k = AKHIR.indexOf(ALIAS_AKHIR[akhir] ?? akhir);
  if (a < 0 || t < 0 || k < 0) return "";
  return String.fromCharCode(0xac00 + (a * 21 + t) * 28 + k);
}

const cocok = (s: string, daftar: string[]) => daftar.find((k) => s.startsWith(k)) ?? "";

/**
 * @returns `hasil` = suku kata yang sudah pasti, `sisa` = ekor Latin yang masih
 * mungkin tumbuh (mis. "ha" belum tentu 하 — bisa jadi "han"). Pemanggil
 * menampilkan `sisa` apa adanya sampai ada huruf berikutnya atau spasi.
 */
export function romajaKeHangul(teks: string, tuntaskan: boolean): { hasil: string; sisa: string } {
  let out = "";
  let i = 0;
  while (i < teks.length) {
    const sisa = teks.slice(i);

    const awal = cocok(sisa, AWAL_URUT);
    const setelahAwal = sisa.slice(awal.length);
    const tengah = cocok(setelahAwal, TENGAH_URUT);

    // Vokal tanpa konsonan awal ditulis dengan ㅇ (indeks 11 = string kosong).
    if (!tengah) {
      if (!awal) { out += sisa[0]; i += 1; continue; }
      // Konsonan yang belum ketemu vokalnya: tunggu ketikan berikutnya, kecuali
      // memang sudah dituntaskan (spasi/kirim) — di situ ia keluar apa adanya.
      if (!tuntaskan) return { hasil: out, sisa };
      out += sisa; return { hasil: out, sisa: "" };
    }

    const setelahTengah = setelahAwal.slice(tengah.length);
    // Vokal masih bisa tumbuh ("o" → "oe"), jadi jangan dipatok kalau ketikan
    // belum tentu selesai.
    if (!tuntaskan && !setelahTengah && TENGAH_URUT.some((v) => v.length > tengah.length && v.startsWith(tengah))) {
      return { hasil: out, sisa };
    }

    /* Inti aturannya: konsonan hanya jadi penutup kalau sesudahnya BUKAN vokal.
       Yang menipu adalah gugus dua huruf — pada "hangug", "ng" cocok sebagai
       penutup, tapi "g"-nya sebenarnya milik 국. Jadi penutup dicoba dari yang
       terpanjang ke terpendek sampai ketemu yang tidak mencuri vokal berikutnya:
       "ng" ditolak (sisanya "ug"), "n" diterima (sisanya "gug") → 한국. */
    const calonPenutup = [...AKHIR_URUT.filter((k) => setelahTengah.startsWith(k)), ""];
    const akhir = calonPenutup.find((f) => !cocok(setelahTengah.slice(f.length), TENGAH_URUT)) ?? "";
    const akhirCalon = calonPenutup[0] ?? "";

    if (!tuntaskan && akhirCalon && !setelahTengah.slice(akhirCalon.length)) {
      // "han" — belum jelas 한 atau awal dari "hana". Tunggu.
      return { hasil: out, sisa };
    }

    const suku = rakit(awal, tengah, akhir);
    if (!suku) { out += sisa[0]; i += 1; continue; }
    out += suku;
    i += awal.length + tengah.length + akhir.length;
  }
  return { hasil: out, sisa: "" };
}
