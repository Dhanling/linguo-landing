// [pustaka-promo-kode-v1] Klaim kode promo produk digital dari Perpustakaan /akun.
//
// Kenapa harus lewat server: memberi akses = menulis baris `digital_purchases`,
// dan tabel itu tertutup RLS untuk siswa (sengaja — kalau tidak, siapa pun bisa
// menerbitkan kepemilikannya sendiri dari console browser). Jadi kode promo
// diverifikasi di sini dengan service role, bukan di komponen.
//
// ⚠️ Gotcha DB yang wajib dipatuhi: `digital_purchases` punya trigger BEFORE
// INSERT OR UPDATE `sync_digital_purchase_to_registration` yang menyalin baris
// LUNAS ke `registrations` dengan source_digital_purchase_id = id baris itu
// sendiri. Saat BEFORE INSERT barisnya belum ada di tabel → FK gagal (23503).
// Karena itu polanya WAJIB: insert "Belum Bayar" dulu → UPDATE jadi Lunas (pola
// yang sama dipakai edge fn xendit-create-digital-invoice + xendit-webhook).
//
// mode "cek"   → cuma memvalidasi kode & menjawab hadiahnya (tanpa menulis)
// mode "klaim" → benar-benar menerbitkan akses

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchProductLangs, materialReady } from "@/lib/digitalAccess";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const NO_STORE = { "Cache-Control": "no-store, private, max-age=0" };

/** Kode promo yang dikenal. Ditulis di server supaya tidak bisa ditebak-ubah dari klien. */
const KODE_PROMO: Record<string, {
  hari: number;
  /** null = berlaku untuk semua tipe produk */
  tipe: "ebook" | "elearning" | null;
  /** berapa produk yang boleh diklaim satu akun dengan kode ini */
  maksPerAkun: number;
  label: string;
}> = {
  FREEEBOOK: { hari: 30, tipe: "ebook", maksPerAkun: 1, label: "Akses gratis 1 bulan" },
};

function tolak(pesan: string, status: number) {
  return NextResponse.json({ ok: false, error: pesan }, { status, headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  let accessToken = "", productId = "", pricingId: string | null = null, kode = "", mode = "cek";
  try {
    const body = await req.json();
    accessToken = String(body.accessToken ?? "");
    productId = String(body.productId ?? "");
    pricingId = body.pricingId ? String(body.pricingId) : null;
    kode = String(body.code ?? "").trim().toUpperCase();
    mode = body.mode === "klaim" ? "klaim" : "cek";
  } catch {
    return tolak("Permintaan tidak terbaca", 400);
  }
  if (!accessToken || !productId || !kode) return tolak("accessToken, productId, dan code wajib diisi", 400);

  const promo = KODE_PROMO[kode];
  if (!promo) return tolak("Kode promo tidak dikenal atau sudah tidak berlaku.", 404);

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

  // ── 2. Produknya ada, aktif, dan materinya benar-benar siap? ──────────────
  const { data: prod, error: prodErr } = await admin
    .from("digital_products")
    .select("id, type, title, is_active, file_url, video_playlist_url")
    .eq("id", productId)
    .maybeSingle();
  if (prodErr) return tolak("Gagal membaca produk", 500);
  if (!prod || prod.is_active === false) return tolak("Produk tidak ditemukan", 404);
  if (promo.tipe && prod.type !== promo.tipe) {
    return tolak(`Kode ${kode} hanya berlaku untuk ${promo.tipe === "ebook" ? "E-Book" : "E-Learning"}.`, 409);
  }
  // Alasan sama dengan tombol Beli: menyerahkan akses ke modul yang berkasnya
  // belum diunggah cuma memindahkan kekecewaan ke sesudah klaim.
  const langs = await fetchProductLangs(admin, [prod.id]);
  if (!materialReady(prod as Parameters<typeof materialReady>[0], langs[prod.id])) {
    return tolak("Materi produk ini belum siap — kodenya belum bisa dipakai di sini.", 409);
  }

  // ── 3. Sudah punya? / jatah kodenya masih ada? ────────────────────────────
  // Kepemilikan dicocokkan sama seperti Perpustakaan: auth_user_id ATAU email.
  const { data: milik } = await admin
    .from("digital_purchases")
    .select("id, product_id, source, expires_at")
    .eq("payment_status", "Lunas")
    .or(`auth_user_id.eq.${user.id},buyer_email.ilike.${email}`);
  const rows = milik ?? [];
  if (rows.some((r) => r.product_id === productId)) {
    return NextResponse.json(
      { ok: false, sudahPunya: true, error: "Produk ini sudah ada di Perpustakaan kamu." },
      { status: 409, headers: NO_STORE },
    );
  }
  const klaimPromo = rows.filter((r) => r.source === "promo").length;
  if (klaimPromo >= promo.maksPerAkun) {
    return tolak(
      `Kode ${kode} cuma bisa dipakai untuk ${promo.maksPerAkun} produk per akun, dan jatah kamu sudah terpakai.`,
      409,
    );
  }

  const sampai = new Date(Date.now() + promo.hari * 86_400_000).toISOString();
  if (mode === "cek") {
    return NextResponse.json(
      { ok: true, code: kode, label: promo.label, hari: promo.hari, expires_at: sampai },
      { headers: NO_STORE },
    );
  }

  // ── 4. Terbitkan akses: insert "Belum Bayar" → UPDATE jadi Lunas ──────────
  const nama =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    email.split("@")[0];
  const { data: baris, error: insErr } = await admin
    .from("digital_purchases")
    .insert({
      product_id: productId,
      pricing_id: pricingId,
      buyer_email: user.email,
      buyer_name: nama,
      amount: 0,
      payment_status: "Belum Bayar",
      // Tidak ada invoice Xendit di jalur ini. "PENDING" dipertahankan karena
      // xendit-reconcile-digital cuma menyentuh baris ber-xendit_invoice_id,
      // jadi baris promo tak akan ikut dikejar ke Xendit.
      xendit_status: "PENDING",
      source: "promo",
      auth_user_id: user.id,
    })
    .select("id")
    .single();
  if (insErr || !baris) {
    console.error("[promo-digital] insert gagal:", insErr);
    // Kode DB ikut ditampilkan: waktu constraint `digital_purchases_source_check`
    // belum mengenal source 'promo', pesan polos "coba lagi sebentar" menyuruh
    // orang mengulang sesuatu yang tak akan pernah berhasil — dan tim support
    // tak punya petunjuk apa pun tanpa membuka log Vercel.
    return tolak(
      `Gagal menerbitkan akses${insErr?.code ? ` (kode ${insErr.code})` : ""}. Coba lagi sebentar atau hubungi admin.`,
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
    console.error("[promo-digital] aktivasi gagal:", updErr);
    // Baris "Belum Bayar" yang gagal diaktifkan tak memberi akses apa pun, tapi
    // jangan ditinggal jadi sampah di daftar tagihan admin.
    await admin.from("digital_purchases").delete().eq("id", baris.id);
    return tolak("Gagal mengaktifkan akses. Coba lagi sebentar.", 500);
  }

  return NextResponse.json(
    { ok: true, code: kode, purchase_id: baris.id, expires_at: sampai, hari: promo.hari, label: promo.label },
    { headers: NO_STORE },
  );
}
