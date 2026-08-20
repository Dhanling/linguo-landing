// [pustaka-promo-manual-v1] Terbitkan akses promo FREEEBOOK untuk Español 101 (A1, edisi ID).
//
// Kenapa manual: produk ini belum punya baris `digital_product_pricing`, jadi di
// Perpustakaan kartunya tampil "Harga menyusul / Segera hadir" — tombol Beli
// (satu-satunya pintu masuk popup kode promo) tak pernah muncul. Berkas PDF-nya
// sendiri sudah ada di bucket `ebook-files`, jadi materinya memang siap dibaca.
//
// ⚠️ Pola WAJIB: insert `payment_status:'Belum Bayar'` dulu → UPDATE jadi 'Lunas'.
// Trigger BEFORE INSERT `sync_digital_purchase_to_registration` menyalin baris
// LUNAS ke `registrations` dengan FK ke id baris itu sendiri — saat BEFORE INSERT
// barisnya belum ada, FK gagal (23503).
//
// Syarat hadiahnya disamakan dengan kode FREEEBOOK: 30 hari, amount 0, source 'promo'.

import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
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

const PRODUCT = "7ab3e041-bc28-4a04-a46c-d33ca8f9ebc8"; // espanol-101-a1-id
const UID = "ee0032f9-faf2-40db-9dd2-1e6f485d85c3";
const EMAIL = "mlutfiramadhani1@gmail.com";
const HARI = 30;

const { data: sudah } = await s
  .from("digital_purchases")
  .select("id, payment_status")
  .eq("product_id", PRODUCT)
  .eq("auth_user_id", UID)
  .eq("payment_status", "Lunas");
if (sudah?.length) {
  console.log("Sudah punya akses:", sudah.map((r) => r.id).join(", "));
  process.exit(0);
}

const { data: ins, error: e1 } = await s
  .from("digital_purchases")
  .insert({
    product_id: PRODUCT,
    buyer_email: EMAIL,
    buyer_name: "mlutfiramadhani",
    payment_status: "Belum Bayar",
    amount: 0,
    source: "promo",
    xendit_status: "PENDING",
    auth_user_id: UID,
  })
  .select("id")
  .single();
if (e1) {
  console.error("INSERT gagal:", e1);
  process.exit(1);
}

const { data: up, error: e2 } = await s
  .from("digital_purchases")
  .update({
    payment_status: "Lunas",
    access_granted: true,
    access_granted_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + HARI * 86_400_000).toISOString(),
  })
  .eq("id", ins.id)
  .select("id, product_id, payment_status, access_granted, expires_at, source, registration_id")
  .single();
if (e2) {
  console.error("UPDATE gagal:", e2);
  process.exit(1);
}
console.log(JSON.stringify(up, null, 1));
