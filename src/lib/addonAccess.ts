// [addon-akses-rekaman-v1] Gerbang akses REKAMAN kelas di dashboard siswa.
//
// ── Masalahnya (laporan admin Faujiah, 11 Sep 2026 — bug fcf8c425) ────────────
// "Pembelian tambahan" kelas Private (add-on) diinput admin per registrasi:
// Recording (Rp 100.000), E-book, Modul. Yang BELI harus dapat, yang TIDAK beli
// tidak boleh dapat. Sisi e-book sudah beres (trigger DB di repo admin menuliskan
// `digital_purchases` dari `registration_addons`; 89/97 sudah di-backfill).
// Sisi REKAMAN belum sama sekali: selama baris `schedules` punya `recording_url`,
// tombol "Tonton rekaman" muncul buat siapa pun — tak peduli dia beli add-on
// Recording atau tidak. Jadi add-on Rp 100.000 itu praktis gratis.
//
// ── Tiga keadaan data, SATU aturan akses ──────────────────────────────────────
// [rekaman-wajib-beli-v1] (19 Sep 2026, keputusan owner) Rekaman HANYA untuk
// registrasi yang membeli add-on Recording / paket yang memuat Recording. Tanpa
// catatan pembelian = tidak beli = terkunci — berlaku untuk SEMUA siswa.
//
// Sebelumnya (11 Sep 2026) registrasi yang nol catatan add-on ("belum-didata")
// sengaja tetap boleh menonton supaya siswa lama tak kehilangan akses. Akibatnya
// setiap registrasi BARU tanpa add-on (keadaan paling umum: siswa memang tak
// beli apa-apa) otomatis dapat rekaman gratis — add-on Rp 100.000 praktis tak
// perlu dibeli. Per 19 Sep 2026 ada 24 registrasi (74 rekaman) yang menonton
// lewat celah itu. Siswa yang ternyata memang beli tapi belum didata: admin
// cukup mencatat add-on Recording di menu Registrasi → aksesnya langsung kembali
// tanpa ganti kode.
//
// Keadaan "belum-didata" tetap dibedakan dari "tidak" HANYA untuk keperluan
// audit/diagnosa; hak aksesnya sama-sama terkunci. "memuat" = peta akses belum
// datang — UI tak menampilkan tombol maupun gembok supaya pembeli sah tak melihat
// kedipan "terkunci".
//
// ── Add-on tersimpan di TIGA tempat — jangan pernah baca satu saja ────────────
//   1. tabel `registration_addons` — (registration_id, addon_type
//      recording|ebook|modul|other, payment_status, total_amount, quantity).
//      Ini sumber paling baru & paling rinci (dipakai form admin sekarang).
//   2. `registrations.addons` jsonb — bentuknya kira-kira
//      {modul: bool|number, recording: bool|number}. Dipakai form lama.
//   3. `registrations.addon_ebook_recording` boolean + `addon_amount` — paket
//      bundel dari penawaran WA: e-book + rekaman DIGABUNG jadi satu harga.
//      Jadi `true` berarti REKAMAN IKUT (bukan cuma e-book).
//
// Helper ini dipakai di tiga tempat supaya jawabannya tak pernah beda:
// UI (/akun: SesiTimeline, ClassProgressTab, JadwalCalendar), API rekaman
// (src/app/api/class-recording/route.ts — gerbang sebenarnya, karena URL room
// gampang ditebak), dan policy RLS di sql/registration_addons_rls_siswa_20260911.sql
// supaya siswa boleh membaca baris add-on miliknya sendiri.

import { canonLangName } from "@/lib/programLanguages";

export type AksesAddon ="punya" | "tidak" | "belum-didata" | "memuat";

/** Baris `registration_addons` — sekadar yang dibutuhkan gerbang ini. */
export type AddonRow = {
  addon_type: string;
  payment_status?: string | null;
  quantity?: number | null;
};

/** Potongan `registrations` yang dibutuhkan gerbang ini. */
export type RegAddonFields = {
  addons?: any;
  addon_ebook_recording?: boolean | null;
};

/** Kolom registrasi yang WAJIB ikut di-select kalau mau memanggil aksesRekaman(). */
export const ADDON_REG_COLUMNS = "addons, addon_ebook_recording";

const LUNAS = new Set(["lunas", "paid"]);

/** payment_status add-on yang dianggap sudah dibayar (case-insensitive). */
function sudahLunas(status?: string | null): boolean {
  return LUNAS.has(String(status ?? "").trim().toLowerCase());
}

/** `addons` jsonb dianggap "sudah didata" kalau objeknya punya minimal satu kunci. */
function addonsJsonb(reg: RegAddonFields): Record<string, any> | null {
  const a = reg?.addons;
  if (!a || typeof a !== "object" || Array.isArray(a)) return null;
  return Object.keys(a).length > 0 ? (a as Record<string, any>) : null;
}

/**
 * Apakah registrasi ini berhak menonton rekaman sesi?
 *
 * Urutan aturannya (berhenti di yang pertama cocok):
 *   1. ada baris `registration_addons` bertipe 'recording' & payment_status
 *      Lunas/Paid                                              → "punya"
 *   2. `addon_ebook_recording === true` (bundel WA: rekaman IKUT) → "punya"
 *   3. `addons` jsonb punya kunci `recording` yang truthy        → "punya"
 *   4. ADA catatan add-on apa pun buat registrasi ini (minimal satu baris
 *      `registration_addons` jenis apa saja, ATAU `addons` jsonb tidak kosong) → "tidak".
 *      Flag `addon_ebook_recording === false` TIDAK dihitung: default kolomnya false.
 *      Artinya admin memang sudah mendata pembelian tambahannya dan rekaman
 *      TIDAK termasuk di situ.
 *   5. tak ada catatan apa pun                             → "belum-didata"
 *      (TERKUNCI juga — lihat [rekaman-wajib-beli-v1] di atas).
 */
export function aksesRekaman(reg: RegAddonFields, addonRows: AddonRow[]): AksesAddon {
  const rows = Array.isArray(addonRows) ? addonRows : [];

  // 1) baris add-on recording yang sudah dibayar.
  const rekamanLunas = rows.some(
    (r) => String(r?.addon_type ?? "").trim().toLowerCase() === "recording" && sudahLunas(r?.payment_status),
  );
  if (rekamanLunas) return "punya";

  // 2) bundel e-book + rekaman dari penawaran WA.
  if (reg?.addon_ebook_recording === true) return "punya";

  // 3) `addons` jsonb versi lama.
  const j = addonsJsonb(reg);
  if (j && j.recording) return "punya";

  // 4) add-on sudah didata, rekaman tidak termasuk.
  // `addon_ebook_recording === false` SENGAJA tidak dihitung sebagai "sudah didata":
  // kolomnya NOT NULL default false, jadi false = "tak pernah disentuh", bukan
  // "admin memutuskan tanpa rekaman". (Hak aksesnya kini sama dengan "belum-didata";
  // pembedaan ini tinggal untuk audit.)
  if (rows.length > 0 || j !== null) return "tidak";

  // 5) belum pernah didata sama sekali.
  return "belum-didata";
}

/** Rekaman boleh ditampilkan/di-stream? HANYA pembeli Recording. [rekaman-wajib-beli-v1] */
export const rekamanBolehTampil = (a: AksesAddon) => a === "punya";

/** Tampilkan gembok + penjelasan? Tidak selama peta akses masih dimuat. */
export const rekamanTerkunci = (a: AksesAddon) => a === "tidak" || a === "belum-didata";

/** Kalimat penolakan yang dipakai UI maupun API — satu sumber, satu nada. */
export const PESAN_REKAMAN_TERKUNCI = "Rekaman sesi tidak termasuk paket kelas ini";

type SupabaseLike = {
  from: (table: string) => any;
};

/**
 * Peta akses rekaman untuk sekumpulan registrasi — satu query `registration_addons`
 * saja, lalu dikelompokkan di memori.
 *
 * `regs` sudah membawa kolom `addons`/`addon_ebook_recording` kalau pemanggilnya
 * men-select ADDON_REG_COLUMNS; kalau belum, lewatkan `ambilKolomReg: true` supaya
 * helper ini menambalnya sendiri (dipakai jalur cache /akun yang snapshot-nya lama).
 *
 * Gagal query `registration_addons` (jaringan, policy) → registrasi yang tak
 * terbukti "punya" dari kolom registrasinya dikembalikan "memuat", BUKAN terkunci:
 * pembeli sah tak boleh melihat gembok hanya karena query-nya gagal. Tombol di UI
 * bukan gerbangnya — gerbang sebenarnya `/api/class-recording` (service key).
 */
export async function muatAksesRekamanMap(
  client: SupabaseLike,
  regs: ({ id: string } & RegAddonFields)[],
  opts: { ambilKolomReg?: boolean } = {},
): Promise<Map<string, AksesAddon>> {
  const out = new Map<string, AksesAddon>();
  const ids = (regs || []).map((r) => r?.id).filter(Boolean) as string[];
  if (ids.length === 0) return out;

  const perReg = new Map<string, AddonRow[]>();
  let addonGagal = false;
  try {
    const { data, error } = await client
      .from("registration_addons")
      .select("registration_id, addon_type, payment_status, quantity")
      .in("registration_id", ids);
    if (error) addonGagal = true;
    (data || []).forEach((r: any) => {
      const arr = perReg.get(r.registration_id) || [];
      arr.push(r as AddonRow);
      perReg.set(r.registration_id, arr);
    });
  } catch {
    addonGagal = true;
  }

  let fields = new Map<string, RegAddonFields>((regs || []).map((r) => [r.id, r]));
  if (opts.ambilKolomReg) {
    try {
      const { data } = await client.from("registrations").select(`id, ${ADDON_REG_COLUMNS}`).in("id", ids);
      if (data?.length) fields = new Map((data as any[]).map((r) => [r.id, r as RegAddonFields]));
    } catch {
      /* pakai yang ada di `regs` */
    }
  }

  ids.forEach((id) => {
    const a = aksesRekaman(fields.get(id) || {}, perReg.get(id) || []);
    out.set(id, addonGagal && a !== "punya" ? "memuat" : a);
  });

  // [rekaman-lanjutan-waris-v1] registrasi lanjutan mewarisi Recording kelas sebelumnya.
  const terkunci = ids.filter((id) => rekamanTerkunci(out.get(id) as AksesAddon));
  if (terkunci.length > 0) {
    const waris = await muatWarisanRekaman(client, terkunci);
    // Gagal dibaca → "memuat", bukan gembok (alasan yang sama dengan addonGagal).
    terkunci.forEach((id) => {
      if (waris === null) out.set(id, "memuat");
      else if (waris.has(id)) out.set(id, "punya");
    });
  }
  return out;
}

// ── [rekaman-lanjutan-waris-v1] Recording ikut ke registrasi LANJUTAN ─────────
// Laporan owner 12 Okt 2026 (siswa Restu, English A1.1 Private): bayar 1 sesi +
// Recording & E-book (3 Okt), lalu bayar 1 sesi lagi untuk melanjutkan (7 Okt).
// Tiap pembayaran = satu baris `registrations` ([private-lanjutan-v1] di repo
// admin), dan add-on Recording hanya menempel di baris PERTAMA — jadi rekaman
// sesi lanjutannya terkunci "tidak termasuk paket kelas ini" padahal Recording
// kelas itu sudah dibeli.
//
// Aturannya: registrasi yang tak punya Recording sendiri ikut "punya" kalau ada
// registrasi SEBELUMNYA milik siswa yang sama, dengan produk, bahasa dan level
// yang sama, yang Recording-nya memang dibeli. Trial, registrasi yang diarsipkan
// dan yang Batal/Transferred tidak mewariskan. Level berbeda = paket baru →
// Recording dibeli lagi ([rekaman-wajib-beli-v1] tetap berlaku).

const KOLOM_LANJUTAN = `id, student_id, product, language, level, created_at, is_trial, status, archived_at, ${ADDON_REG_COLUMNS}`;

type RegLanjutan = RegAddonFields & {
  id: string;
  student_id?: string | null;
  product?: string | null;
  language?: string | null;
  level?: string | null;
  created_at?: string | null;
  is_trial?: boolean | null;
  status?: string | null;
  archived_at?: string | null;
};

const kunci = (s?: string | null) => String(s ?? "").trim().toLowerCase();

function kelasSama(a: RegLanjutan, b: RegLanjutan): boolean {
  return (
    kunci(a.product) === kunci(b.product) &&
    canonLangName(a.language).toLowerCase() === canonLangName(b.language).toLowerCase() &&
    kunci(a.level) === kunci(b.level)
  );
}

/**
 * Dari `regIds` (registrasi yang Recording-nya tidak dibeli langsung), mana yang
 * mewarisi Recording dari registrasi sebelumnya di kelas yang sama?
 * `null` = datanya gagal dibaca (pemanggil jangan memvonis "tidak beli").
 */
export async function muatWarisanRekaman(client: SupabaseLike, regIds: string[]): Promise<Set<string> | null> {
  const out = new Set<string>();
  const ids = (regIds || []).filter(Boolean);
  if (ids.length === 0) return out;
  try {
    const cur = await client.from("registrations").select(KOLOM_LANJUTAN).in("id", ids);
    if (cur.error) return null;
    const lanjutan = ((cur.data || []) as RegLanjutan[]).filter((r) => r.student_id && !r.is_trial);
    if (lanjutan.length === 0) return out;

    const studentIds = Array.from(new Set(lanjutan.map((r) => r.student_id as string)));
    const sib = await client.from("registrations").select(KOLOM_LANJUTAN).in("student_id", studentIds);
    if (sib.error) return null;
    const calon = ((sib.data || []) as RegLanjutan[]).filter(
      (p) => !p.is_trial && !p.archived_at && !["batal", "transferred"].includes(kunci(p.status)),
    );
    if (calon.length === 0) return out;

    const add = await client
      .from("registration_addons")
      .select("registration_id, addon_type, payment_status, quantity")
      .in("registration_id", calon.map((p) => p.id));
    if (add.error) return null;
    const perReg = new Map<string, AddonRow[]>();
    (add.data || []).forEach((r: any) => {
      const arr = perReg.get(r.registration_id) || [];
      arr.push(r as AddonRow);
      perReg.set(r.registration_id, arr);
    });

    lanjutan.forEach((r) => {
      const ada = calon.some(
        (p) =>
          p.id !== r.id &&
          p.student_id === r.student_id &&
          String(p.created_at ?? "") < String(r.created_at ?? "") &&
          kelasSama(p, r) &&
          aksesRekaman(p, perReg.get(p.id) || []) === "punya",
      );
      if (ada) out.add(r.id);
    });
    return out;
  } catch {
    return null;
  }
}

/** Versi satu registrasi — untuk komponen yang tak dapat peta dari induknya. */
export async function muatAksesRekamanSatu(
  client: SupabaseLike,
  regId: string,
  reg?: RegAddonFields,
): Promise<AksesAddon> {
  if (!regId) return "belum-didata";
  const perlu = !reg || reg.addons === undefined || reg.addon_ebook_recording === undefined;
  const map = await muatAksesRekamanMap(client, [{ id: regId, ...(reg || {}) }], { ambilKolomReg: perlu });
  return map.get(regId) ?? "belum-didata";
}
