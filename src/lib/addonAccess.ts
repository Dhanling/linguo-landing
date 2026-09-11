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
// ── Kenapa BUKAN boolean, tapi tiga keadaan ───────────────────────────────────
// Data add-on di produksi TIDAK lengkap. Hitungan per 11 Sep 2026:
//   • 45 registrasi punya rekaman (schedules.recording_url terisi),
//   • cuma 21 registrasi punya catatan add-on sama sekali,
//   • 17 registrasi NOL data add-on dalam bentuk apa pun.
// Kalau gerbangnya boolean ("tidak ada catatan = tidak beli"), 17 siswa itu
// langsung KEHILANGAN rekaman yang hari ini bisa mereka tonton — padahal yang
// hilang bukan haknya, tapi pendataannya. Mencabut akses yang sudah jalan jauh
// lebih mahal (keluhan + kepercayaan) daripada kebocoran beberapa rekaman lama.
// KEPUTUSAN EKSPLISIT: "belum-didata" TETAP TERLIHAT. Begitu admin mendata
// add-on registrasi itu (apa pun jenisnya), barisnya otomatis pindah ke "punya"
// atau "tidak" tanpa perlu ganti kode.
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

export type AksesAddon = "punya" | "tidak" | "belum-didata";

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
 *      (tampilkan — lihat blok keputusan di atas).
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
  // "admin memutuskan tanpa rekaman". Menghitungnya mencabut rekaman 18 kelas yang
  // nol catatan add-on (dicek di prod 11 Sep 2026).
  if (rows.length > 0 || j !== null) return "tidak";

  // 5) belum pernah didata sama sekali.
  return "belum-didata";
}

/** Rekaman boleh ditampilkan/di-stream? "belum-didata" ikut boleh (lihat di atas). */
export const rekamanBolehTampil = (a: AksesAddon) => a !== "tidak";

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
 * Gagal query (policy belum dipasang, tabel belum ada) TIDAK boleh menutup akses:
 * hasilnya dibiarkan kosong → semua registrasi jatuh ke "belum-didata"/terlihat,
 * dan gerbang sebenarnya tetap ada di API route yang pakai service key.
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
  try {
    const { data } = await client
      .from("registration_addons")
      .select("registration_id, addon_type, payment_status, quantity")
      .in("registration_id", ids);
    (data || []).forEach((r: any) => {
      const arr = perReg.get(r.registration_id) || [];
      arr.push(r as AddonRow);
      perReg.set(r.registration_id, arr);
    });
  } catch {
    // biarkan kosong — lihat catatan di atas.
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

  ids.forEach((id) => out.set(id, aksesRekaman(fields.get(id) || {}, perReg.get(id) || [])));
  return out;
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
