// [ebook-pratinjau-unit1-v1] Beri akses CICIP (Unit 1 saja) satu/beberapa Lingbook
// ke satu akun — jalur manual untuk tim: calon pembeli yang minta "boleh lihat
// isinya dulu?" di WA tinggal dibukakan dari sini.
//
// Bedanya dengan tombol "Coba gratis Unit 1" di Perpustakaan: yang di aplikasi
// diklik sendiri oleh calon pembeli yang sudah punya akun; yang ini dipakai tim
// waktu percakapannya sedang berlangsung di WA/IG dan orangnya belum tentu tahu
// menu Perpustakaan ada di mana.
//
// Yang membedakan baris cicip dari pembelian sungguhan cuma `source = 'preview'`.
// /api/ebook membaca kolom itu dan memotong aksesnya di akhir Unit 1 — jangan
// diganti 'manual' atau 'promo', dua-duanya berarti akses PENUH.
//
// ⚠️ Pola WAJIB (sama dengan skrip grant lain): insert 'Belum Bayar' dulu →
// UPDATE jadi 'Lunas'. Trigger BEFORE INSERT `sync_digital_purchase_to_registration`
// menyalin baris LUNAS ke `registrations` dengan FK ke id baris itu sendiri —
// saat BEFORE INSERT barisnya belum ada, FK gagal (23503).
//
// Pakai:
//   node scripts/grant-ebook-pratinjau.mjs <email> <slug|potongan judul> [hari]
// Contoh:
//   node scripts/grant-ebook-pratinjau.mjs calon@gmail.com "Tagalog 103" 7

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const s = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const EMAIL = (process.argv[2] || "").toLowerCase().trim();
const CARI = (process.argv[3] || "").trim();
const HARI = Number(process.argv[4] || 7);
if (!EMAIL || !CARI) {
  console.error("Pakai: node scripts/grant-ebook-pratinjau.mjs <email> <slug|judul> [hari]");
  process.exit(1);
}

// --- 1. akun tujuan ---------------------------------------------------------
// Akun boleh belum ada: barisnya tetap diterbitkan atas `buyer_email`, dan
// Perpustakaan mencocokkannya lewat email begitu orangnya mendaftar
// ([[perpustakaan-auth-user-id-null]]).
let uid = null;
for (let page = 1; page <= 20 && !uid; page++) {
  const { data, error } = await s.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) { console.error("listUsers gagal:", error.message); process.exit(1); }
  uid = data.users.find((u) => (u.email || "").toLowerCase() === EMAIL)?.id ?? null;
  if (data.users.length < 1000) break;
}
console.log("Akun:", EMAIL, uid ?? "(belum punya akun — dicocokkan lewat email)");

// --- 2. produknya -----------------------------------------------------------
const { data: prods, error: ep } = await s
  .from("digital_products")
  .select("id, slug, title, type, is_active, file_url")
  .eq("type", "ebook")
  .or(`slug.ilike.%${CARI}%,title.ilike.%${CARI}%`)
  .order("title");
if (ep) { console.error("Ambil produk gagal:", ep.message); process.exit(1); }
if (!prods.length) { console.error("Tak ada Lingbook yang cocok:", CARI); process.exit(1); }
if (prods.length > 5) {
  console.error(`Terlalu umum — ${prods.length} produk cocok. Persempit kata kuncinya.`);
  prods.slice(0, 10).forEach((p) => console.error("  ·", p.slug, "—", p.title));
  process.exit(1);
}

const sampai = new Date(Date.now() + HARI * 86_400_000).toISOString();
let baru = 0, lewat = 0, gagal = 0;

for (const p of prods) {
  // Berkasnya harus benar-benar ada: cicipan modul yang belum diunggah cuma
  // memindahkan kekecewaan ke sesudah orangnya semangat.
  if (!p.file_url || /^https?:\/\//i.test(p.file_url)) {
    console.log("· dilewati (berkas belum di storage):", p.title);
    lewat++; continue;
  }

  const { data: punya, error: eo } = await s
    .from("digital_purchases")
    .select("id, source, expires_at")
    .eq("product_id", p.id)
    .eq("payment_status", "Lunas")
    .or(uid ? `auth_user_id.eq.${uid},buyer_email.ilike.${EMAIL}` : `buyer_email.ilike.${EMAIL}`);
  if (eo) { console.error("✗ cek kepemilikan gagal:", p.title, eo.message); gagal++; continue; }
  if (punya?.some((r) => r.source !== "preview")) {
    console.log("· sudah dimiliki penuh:", p.title); lewat++; continue;
  }
  const hidup = punya?.find((r) => !r.expires_at || new Date(r.expires_at) > new Date());
  if (hidup) {
    // Cicipan yang masih hidup diperpanjang, bukan digandakan — dua baris untuk
    // satu produk bikin rak menampilkan modul yang sama dua kali.
    const { error } = await s
      .from("digital_purchases").update({ expires_at: sampai, access_granted: true }).eq("id", hidup.id);
    if (error) { console.error("✗ perpanjang gagal:", p.title, error.message); gagal++; continue; }
    console.log("↻ pratinjau diperpanjang:", p.title, "→", sampai.slice(0, 10));
    continue;
  }

  const { data: ins, error: e1 } = await s
    .from("digital_purchases")
    .insert({
      product_id: p.id,
      buyer_email: EMAIL,
      buyer_name: EMAIL.split("@")[0],
      payment_status: "Belum Bayar",   // ⚠️ jangan langsung 'Lunas' (FK trigger)
      amount: 0,
      source: "preview",               // ⚠️ penentu batas Unit 1 di /api/ebook
      xendit_status: "PENDING",        // biar xendit-reconcile-digital tak mengejarnya
      auth_user_id: uid,
    })
    .select("id")
    .single();
  if (e1) { console.error("✗ insert gagal:", p.title, e1.message); gagal++; continue; }

  const { error: e2 } = await s
    .from("digital_purchases")
    .update({
      payment_status: "Lunas",
      access_granted: true,
      access_granted_at: new Date().toISOString(),
      expires_at: sampai,
    })
    .eq("id", ins.id);
  if (e2) {
    console.error("✗ aktivasi gagal:", p.title, e2.message);
    await s.from("digital_purchases").delete().eq("id", ins.id);
    gagal++; continue;
  }
  baru++;
  console.log("✓ pratinjau Unit 1:", p.title, "— sampai", sampai.slice(0, 10));
}

console.log(`\nSelesai — baru: ${baru}, dilewati: ${lewat}, gagal: ${gagal}`);
