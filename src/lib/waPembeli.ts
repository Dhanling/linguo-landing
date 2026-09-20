// [wa-wajib-digital-v1] Nomor WhatsApp WAJIB untuk setiap pembelian/klaim produk
// digital (e-book, e-learning, simulasi tes).
//
// Kenapa ada: lead "Produk Digital" muncul di dashboard cuma dengan email —
// tim tak bisa follow-up lewat WA, padahal itu satu-satunya kanal yang dipakai.
// Penyebabnya bukan satu form, tapi setiap jalur beli punya aturan sendiri
// (ada yang "opsional", ada yang tak punya kolomnya sama sekali). Berkas ini
// jadi satu sumber aturan: bentuk nomor yang sah + di mana mencari nomor
// pembeli yang sudah pernah tersimpan.
//
// Aman diimpor dari klien MAUPUN server — tak ada dependensi selain tipe.

import type { SupabaseClient } from "@supabase/supabase-js";

/** Kode galat yang dibaca klien untuk memunculkan kolom WA. */
export const KODE_WA_WAJIB = "WA_WAJIB";
export const PESAN_WA_WAJIB = "Nomor WhatsApp aktif wajib diisi.";

/**
 * Rapikan nomor ke bentuk digit internasional tanpa "+" (mis. 6281234567890).
 * `null` = bukan nomor yang masuk akal. Nomor luar negeri tetap diterima —
 * yang dipaksa ke 62 hanya awalan lokal "0" dan "8".
 */
export function normalisasiWa(raw: unknown): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = "62" + d.replace(/^0+/, "");
  else if (d.startsWith("8")) d = "62" + d;
  if (d.length < 10 || d.length > 15) return null;
  return d;
}

/** `_` dan `%` di email adalah wildcard bagi ilike — dimatikan dulu. */
function amanIlike(s: string) {
  return s.replace(/([\\%_])/g, "\\$1");
}

/**
 * SERVER (service role): tentukan nomor WA pembeli.
 * Urutan: nomor kiriman form → students.whatsapp → profiles.whatsapp.
 * Nomor kiriman yang sah sekalian disimpan ke profil yang masih kosong supaya
 * pembelian berikutnya tak menanyakannya lagi. `null` = memang belum ada —
 * pemanggil wajib menolak dengan KODE_WA_WAJIB.
 */
export async function pastikanWaPembeli(
  admin: SupabaseClient,
  p: { email: string; authUserId?: string | null; kiriman?: unknown },
): Promise<string | null> {
  const email = p.email.trim().toLowerCase();
  const dariForm = normalisasiWa(p.kiriman);

  // Email kosong TIDAK boleh sampai ke ilike — ia akan cocok dengan baris
  // students ber-email kosong dan nomor orang ini tertulis ke sana.
  let siswa: { id: string; whatsapp: string | null }[] = [];
  if (email) try {
    const { data } = await admin
      .from("students")
      .select("id, whatsapp")
      .ilike("email", amanIlike(email))
      .order("created_at", { ascending: true });
    siswa = (data ?? []) as typeof siswa;
  } catch (e) {
    console.warn("[wa-wajib] baca students gagal:", e);
  }

  if (dariForm) {
    const kosong = siswa.filter((s) => !normalisasiWa(s.whatsapp)).map((s) => s.id);
    try {
      if (kosong.length > 0) await admin.from("students").update({ whatsapp: dariForm }).in("id", kosong);
      if (p.authUserId) {
        const { data: prof } = await admin.from("profiles").select("whatsapp").eq("id", p.authUserId).maybeSingle();
        if (prof && !normalisasiWa((prof as { whatsapp: string | null }).whatsapp)) {
          await admin.from("profiles").update({ whatsapp: dariForm }).eq("id", p.authUserId);
        }
      }
    } catch (e) {
      console.warn("[wa-wajib] simpan WA ke profil gagal (non-fatal):", e);
    }
    return dariForm;
  }

  for (const s of siswa) {
    const n = normalisasiWa(s.whatsapp);
    if (n) return n;
  }
  if (p.authUserId) {
    try {
      const { data: prof } = await admin.from("profiles").select("whatsapp").eq("id", p.authUserId).maybeSingle();
      const n = normalisasiWa((prof as { whatsapp: string | null } | null)?.whatsapp);
      if (n) return n;
    } catch (e) {
      console.warn("[wa-wajib] baca profiles gagal:", e);
    }
  }
  return null;
}
