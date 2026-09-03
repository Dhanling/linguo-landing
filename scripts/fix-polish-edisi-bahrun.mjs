// [fix-edisi-lama-bahrun] Bahrun (bayubahrun@gmail.com) bayar Rp79.000 lewat QRIS,
// tapi keranjangnya berisi produk edisi LAMA "Polish 101 (English Edition)" (100 hal)
// — bukan "Polish 101 - A1" edisi baru (152 hal) yang dia maksud. Baris bayarnya
// dipindahkan ke produk edisi baru, tier "Selamanya" (tanpa kedaluwarsa), karena
// yang dia beli memang tier lifetime.
//
// Baris cicipan 7 hari di produk yang sama ikut dibuang supaya raknya tidak
// menampilkan dua kartu Polish 101 - A1 (satu bertanda "Pratinjau").

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

const BELI = "0fa7a8d3-e784-4afc-bba4-214cde7e13cf";    // pembelian Rp79.000 QRIS
const BARU = "1fcd05c1-a939-4384-9511-7135bf8609f8";    // Polish 101 - A1 (152 hal)
const TIER = "a06bdc72-11fb-40d5-8854-dc3a5722158a";    // tier "Selamanya"
const CICIP = "0d7a4a7d-a2d2-4947-ac19-35e4720d596a";   // baris pratinjau 7 hari
const CICIP_REG = "44167a15-cbab-41da-973f-9970c128505a"; // mirror registrations Rp0

const { error: e1 } = await s
  .from("digital_purchases")
  .update({ product_id: BARU, pricing_id: TIER, expires_at: null, access_granted: true })
  .eq("id", BELI);
console.log("pindah pembelian ke edisi baru:", e1?.message ?? "OK");

const { error: e2 } = await s.from("registrations").delete().eq("id", CICIP_REG);
console.log("bersihkan mirror registrations cicipan:", e2?.message ?? "OK");

const { error: e3 } = await s.from("digital_purchases").delete().eq("id", CICIP);
console.log("bersihkan baris cicipan:", e3?.message ?? "OK");

const { data } = await s
  .from("digital_purchases")
  .select("id, payment_status, source, amount, expires_at, digital_products(title, pages)")
  .eq("auth_user_id", "5e8d130a-27d8-4b88-b0f2-d99ef05b0231")
  .order("created_at");
console.log("\nRak Bahrun sekarang:");
for (const r of data ?? []) {
  console.log(` · ${r.digital_products?.title} (${r.digital_products?.pages} hal) — ${r.source}, Rp${r.amount}, expires: ${r.expires_at ?? "selamanya"}`);
}
