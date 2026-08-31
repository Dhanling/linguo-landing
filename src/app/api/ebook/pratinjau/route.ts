// [ebook-pratinjau-unit1-v1] Terbitkan akses CICIP satu e-book: Unit 1 terbuka,
// sisanya diburamkan + digembok di reader.
//
// Kenapa lewat server: memberi akses = menulis baris `digital_purchases`, dan
// tabel itu tertutup RLS untuk siswa. Kalau tidak, siapa pun bisa menerbitkan
// kepemilikannya sendiri dari console browser (alasan yang sama dengan
// /api/promo-digital).
//
// ⚠️ Gotcha DB yang wajib dipatuhi — sama persis dengan /api/promo-digital:
// `digital_purchases` punya trigger BEFORE INSERT OR UPDATE
// `sync_digital_purchase_to_registration` yang menyalin baris LUNAS ke
// `registrations` dengan FK ke baris itu sendiri. Saat BEFORE INSERT barisnya
// belum ada → FK gagal (23503). Jadi polanya WAJIB: insert "Belum Bayar" dulu →
// UPDATE jadi Lunas.
//
// Kenapa payment_status "Lunas" untuk sesuatu yang gratis: seluruh jalur akses
// (Perpustakaan, /api/ebook, RLS) memakai status itu sebagai gerbang. `amount` 0
// + `source` 'preview' yang membedakannya dari penjualan sungguhan, jadi laporan
// omzet tidak ikut menghitungnya.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isStoragePath } from "@/lib/digitalAccess";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const NO_STORE = { "Cache-Control": "no-store, private, max-age=0" };

/** Umur cicipan. Cukup lama untuk dibaca santai, cukup pendek supaya bukan
    jalan pintas "gratis selamanya" buat yang tak pernah berniat membeli. */
const HARI = 7;

function tolak(pesan: string, status: number) {
  return NextResponse.json({ ok: false, error: pesan }, { status, headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  let accessToken = "", productId = "";
  try {
    const body = await req.json();
    accessToken = String(body.accessToken ?? "");
    productId = String(body.productId ?? "");
  } catch {
    return tolak("Permintaan tidak terbaca", 400);
  }
  if (!accessToken || !productId) return tolak("accessToken dan productId wajib diisi", 400);

  // ── 1. Siapa yang meminta? ────────────────────────────────────────────────
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user?.email) return tolak("Sesi tidak valid atau sudah habis", 401);
  const email = user.email.toLowerCase();

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── 2. Produknya e-book milik kita yang berkasnya memang ada? ─────────────
  // Cicipan cuma masuk akal untuk modul yang dibaca di reader kita: link luar
  // (Drive dsb) tak punya batas halaman yang bisa dijaga siapa pun.
  const { data: prod, error: prodErr } = await admin
    .from("digital_products")
    .select("id, type, title, is_active, file_url")
    .eq("id", productId)
    .maybeSingle();
  if (prodErr) return tolak("Gagal membaca produk", 500);
  if (!prod || prod.is_active === false) return tolak("Produk tidak ditemukan", 404);
  if (prod.type !== "ebook") return tolak("Pratinjau hanya untuk Lingbook.", 409);
  if (!isStoragePath(prod.file_url)) {
    return tolak("Modul ini belum bisa dicicipi — berkasnya belum diunggah.", 409);
  }

  // ── 3. Sudah punya barisnya? ──────────────────────────────────────────────
  // Kepemilikan dicocokkan seperti Perpustakaan: auth_user_id ATAU email.
  const { data: milik } = await admin
    .from("digital_purchases")
    .select("id, product_id, source, expires_at")
    .eq("payment_status", "Lunas")
    .eq("product_id", productId)
    .or(`auth_user_id.eq.${user.id},buyer_email.ilike.${email}`);
  const rows = (milik ?? []) as Array<{ id: string; source: string | null; expires_at: string | null }>;
  const penuh = rows.find((r) => r.source !== "preview");
  if (penuh) {
    return NextResponse.json(
      { ok: true, sudahPunya: true, purchase_id: penuh.id },
      { headers: NO_STORE },
    );
  }
  // Cicipan yang MASIH hidup dipakai ulang, bukan diterbitkan lagi — kalau
  // tidak, tombolnya jadi mesin perpanjangan 7 hari tanpa batas.
  const cicip = rows.find((r) => !r.expires_at || new Date(r.expires_at).getTime() > Date.now());
  if (cicip) {
    return NextResponse.json(
      { ok: true, lanjut: true, purchase_id: cicip.id, expires_at: cicip.expires_at },
      { headers: NO_STORE },
    );
  }
  if (rows.length > 0) {
    return tolak("Masa pratinjau modul ini sudah berakhir. Beli untuk membuka semua unit ya.", 409);
  }

  // ── 4. Terbitkan: insert "Belum Bayar" → UPDATE jadi Lunas ────────────────
  const nama =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    email.split("@")[0];
  const sampai = new Date(Date.now() + HARI * 86_400_000).toISOString();

  const { data: baris, error: insErr } = await admin
    .from("digital_purchases")
    .insert({
      product_id: productId,
      buyer_email: user.email,
      buyer_name: nama,
      amount: 0,
      payment_status: "Belum Bayar",
      // Tak ada invoice Xendit di jalur ini; "PENDING" menjaga baris ini dari
      // xendit-reconcile-digital yang cuma mengejar baris ber-xendit_invoice_id.
      xendit_status: "PENDING",
      source: "preview",
      auth_user_id: user.id,
    })
    .select("id")
    .single();
  if (insErr || !baris) {
    console.error("[ebook-pratinjau] insert gagal:", insErr);
    // Kode DB ikut ditampilkan: waktu constraint source belum mengenal
    // 'preview', pesan polos menyuruh orang mengulang sesuatu yang tak akan
    // pernah berhasil (pelajaran dari kode promo).
    return tolak(
      `Gagal membuka pratinjau${insErr?.code ? ` (kode ${insErr.code})` : ""}. Hubungi CS Linguo ya.`,
      500,
    );
  }

  const { error: updErr } = await admin
    .from("digital_purchases")
    .update({
      payment_status: "Lunas",
      access_granted: true,
      access_granted_at: new Date().toISOString(),
      expires_at: sampai,
    })
    .eq("id", baris.id);
  if (updErr) {
    console.error("[ebook-pratinjau] aktivasi gagal:", updErr);
    // Baris "Belum Bayar" tak memberi akses apa pun, tapi jangan ditinggal jadi
    // sampah di daftar tagihan admin.
    await admin.from("digital_purchases").delete().eq("id", baris.id);
    return tolak("Gagal membuka pratinjau. Coba lagi sebentar.", 500);
  }

  return NextResponse.json(
    { ok: true, purchase_id: baris.id, expires_at: sampai, hari: HARI },
    { headers: NO_STORE },
  );
}
