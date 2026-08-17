/**
 * Mesin konversi bertahap: mengubah ketikan Latin jadi aksara SAMBIL diketik,
 * dan tahu kapan harus menunggu.
 *
 * Kenapa "menunggu" itu inti masalahnya: begitu siswa mengetik "s", mesin belum
 * boleh menulis "с" — huruf berikutnya bisa membuatnya "sh" (ш) atau "shch" (щ).
 * Jadi tiap konversi mengembalikan dua bagian: yang sudah PASTI, dan ekor Latin
 * yang masih mungkin tumbuh. Ekor itu ditampilkan apa adanya di kotak jawaban,
 * jadi siswa selalu melihat apa yang baru saja dia tekan.
 */
import { TABEL, panjangKunciMaks, type Tabel } from "./tables";
import { romajaKeHangul } from "./hangul";

export interface HasilKonversi {
  /** Teks yang sudah jadi aksara. */
  hasil: string;
  /** Ekor Latin yang belum bisa diputuskan. */
  sisa: string;
}

/** Huruf yang mengakhiri sebuah kata — di sinilah tunggu-menunggu dibubarkan. */
const PEMISAH = /[\s.,!?;:()"'«»„“”\-—…\[\]{}]/;

function samakanBesarKecil(asli: string, hasil: string): string {
  return /^[A-Z]/.test(asli) ? hasil.charAt(0).toUpperCase() + hasil.slice(1) : hasil;
}

function konversiTabel(teks: string, tabel: Tabel, tuntaskan: boolean): HasilKonversi {
  const maks = panjangKunciMaks(tabel);
  let out = "";
  let i = 0;
  while (i < teks.length) {
    const sisa = teks.slice(i);
    if (PEMISAH.test(sisa[0])) { out += sisa[0]; i += 1; continue; }

    let kunci = "";
    for (let n = Math.min(maks, sisa.length); n > 0; n--) {
      const calon = sisa.slice(0, n).toLowerCase();
      if (tabel[calon]) { kunci = calon; break; }
    }

    if (!kunci) {
      // Bukan huruf yang dikenal (angka, aksara asing) — biarkan lewat utuh.
      const bisaTumbuh = !tuntaskan && Object.keys(tabel).some((k) => k.startsWith(sisa.toLowerCase()));
      if (bisaTumbuh) return { hasil: out, sisa };
      out += sisa[0]; i += 1; continue;
    }

    /* Kunci ketemu, tapi kalau ketikannya masih bisa jadi kunci yang LEBIH
       panjang ("sh" → "shch") dan ini memang ekor ketikan, tahan dulu. */
    const sampaiAkhir = i + kunci.length >= teks.length;
    if (!tuntaskan && sampaiAkhir) {
      const bisaTumbuh = Object.keys(tabel).some(
        (k) => k.length > kunci.length && k.startsWith(sisa.toLowerCase()),
      );
      if (bisaTumbuh) return { hasil: out, sisa };
    }

    out += samakanBesarKecil(sisa.slice(0, kunci.length), tabel[kunci]);
    i += kunci.length;
  }
  return { hasil: out, sisa: "" };
}

/* Sigma akhir kata. Bahasa Yunani menulis σ jadi ς di ujung kata, dan itu baru
   ketahuan setelah katanya selesai — jadi diperbaiki belakangan, bukan saat
   hurufnya diketik. */
function sigmaAkhir(teks: string): string {
  return teks.replace(/σ(?=$|[\s.,!?;:)»"'\]])/g, "ς");
}

export type Aksara = "cyrillic" | "greek" | "kana" | "hangul";

/**
 * @param tuntaskan true saat ketikan dianggap selesai (spasi, kirim, tempel) —
 * ekor yang menggantung dipaksa keluar apa adanya.
 */
export async function konversi(teks: string, aksara: Aksara, kode: string, tuntaskan: boolean): Promise<HasilKonversi> {
  if (aksara === "hangul") return romajaKeHangul(teks, tuntaskan);

  if (aksara === "kana") {
    /* Kana punya seluk-beluk sendiri (っ kecil, ん, vokal panjang) yang sudah
       matang di wanakana — memuat modulnya hanya saat kuisnya bahasa Jepang
       supaya siswa bahasa lain tak ikut mengunduhnya.
       ⚠️ Ini berhenti di kana. Kana → KANJI butuh kamus + daftar kandidat
       seperti Mandarin, dan itu belum dipasang. */
    const { toKana } = await import("wanakana");
    const cocok = teks.match(/[a-zA-Z]+$/);
    const ekor = !tuntaskan && cocok ? cocok[0] : "";
    const inti = ekor ? teks.slice(0, teks.length - ekor.length) : teks;
    const hasil = toKana(inti, { IMEMode: true });
    // Ekor dibiarkan Latin sampai jelas: "ky" belum tentu きゃ.
    const ekorKana = ekor ? toKana(ekor, { IMEMode: true }) : "";
    return /[a-zA-Z]/.test(ekorKana) ? { hasil, sisa: ekor } : { hasil: hasil + ekorKana, sisa: "" };
  }

  const tabel = TABEL[kode];
  if (!tabel) return { hasil: teks, sisa: "" };
  const r = konversiTabel(teks, tabel, tuntaskan);
  return aksara === "greek" ? { hasil: sigmaAkhir(r.hasil), sisa: r.sisa } : r;
}

export { PEMISAH };
