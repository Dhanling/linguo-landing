// [pustaka-keranjang-v1] Checkout keranjang: BANYAK produk digital → SATU invoice Xendit.
//
// Kenapa route sendiri, bukan edge fn xendit-create-digital-invoice: edge fn itu
// satu-invoice-satu-produk sampai ke akarnya — external_id-nya
// `linguo-digital-<purchase_id>-<ts>` menanam SATU id baris digital_purchases,
// dan webhook-nya (`handleDigitalPurchase` di linguo-app) membacanya dengan
// .single() lalu update .eq("id", id). Keranjang butuh N baris per invoice, jadi
// formatnya memang tak muat di sana. Repo landing sendiri sudah punya
// XENDIT_SECRET_KEY + service role, jadi tak perlu deploy lintas repo.
//
// external_id = `LINGUO-CART-<uuid>-<ts>` → dipenuhi oleh
// src/app/api/xendit-webhook/route.ts (fulfillCartPurchase). Awalannya sengaja
// baru: LINGUO-EBOOK-/SIM-/INV-/REG- sudah punya arti masing-masing.
//
// ⚠️ Gotcha DB (sama seperti /api/promo-digital): `digital_purchases` punya
// trigger BEFORE INSERT OR UPDATE `sync_digital_purchase_to_registration` yang
// menyalin baris LUNAS ke `registrations` dengan source_digital_purchase_id =
// id baris itu sendiri — pada BEFORE INSERT barisnya belum ada → FK gagal.
// Karena itu baris keranjang lahir sebagai "Belum Bayar", dan baru webhook yang
// mengubahnya jadi Lunas.
//
// ⚠️ `digital_purchases.source` dijaga CHECK constraint. Dipakai "xendit"
// (nilai yang memang sudah ada), BUKAN nilai baru seperti "cart" — nilai baru
// akan ditolak constraint dan seluruh checkout gagal.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchProductLangs, materialReady } from "@/lib/digitalAccess";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id";

const NO_STORE = { "Cache-Control": "no-store, private, max-age=0" };
const MAKS_ITEM = 20;

function tolak(pesan: string, status: number) {
  return NextResponse.json({ ok: false, error: pesan }, { status, headers: NO_STORE });
}

interface ItemMasuk { productId: string; pricingId: string }

export async function POST(req: NextRequest) {
  let accessToken = "";
  let items: ItemMasuk[] = [];
  let referralCode: string | null = null;
  try {
    const body = await req.json();
    accessToken = String(body.accessToken ?? "");
    referralCode = body.referral_code ? String(body.referral_code) : null;
    items = Array.isArray(body.items)
      ? body.items
          .map((x: unknown) => {
            const o = (x ?? {}) as Record<string, unknown>;
            return { productId: String(o.productId ?? ""), pricingId: String(o.pricingId ?? "") };
          })
          .filter((x: ItemMasuk) => x.productId && x.pricingId)
      : [];
  } catch {
    return tolak("Permintaan tidak terbaca", 400);
  }
  if (!accessToken) return tolak("Sesi tidak terbaca — coba muat ulang halaman.", 401);
  if (items.length === 0) return tolak("Keranjang kosong.", 400);
  if (items.length > MAKS_ITEM) return tolak(`Maksimal ${MAKS_ITEM} produk sekali checkout.`, 400);

  // Produk kembar di satu keranjang = dua baris kepemilikan untuk barang yang
  // sama. Dibuang di sini, bukan cuma di UI.
  const unik = new Map<string, ItemMasuk>();
  for (const it of items) if (!unik.has(it.productId)) unik.set(it.productId, it);
  items = [...unik.values()];

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

  // ── 2. Produk & harganya dibaca ULANG dari DB ─────────────────────────────
  // Harga yang dikirim klien sengaja tidak dipakai sama sekali. Yang dipercaya
  // cuma pasangan (productId, pricingId); nominalnya dari digital_product_pricing.
  const ids = items.map((x) => x.productId);
  const { data: prods, error: prodErr } = await admin
    .from("digital_products")
    .select("id, type, title, slug, language, is_active, file_url, video_playlist_url, digital_product_pricing ( id, price, duration_days, display_label, is_active )")
    .in("id", ids);
  if (prodErr) return tolak("Gagal membaca katalog produk", 500);

  type Tier = { id: string; price: number | null; duration_days: number | null; display_label: string | null; is_active: boolean };
  type Prod = {
    id: string; type: string; title: string; slug: string | null; language: string | null;
    is_active: boolean; file_url: string | null; video_playlist_url: string | null;
    digital_product_pricing?: Tier[];
  };
  const katalog = (prods ?? []) as unknown as Prod[];

  // ── 3. Sudah dimiliki? ────────────────────────────────────────────────────
  // Kepemilikan dicocokkan persis seperti Perpustakaan: auth_user_id ATAU email
  // (akun yang dibuat sesudah bayar punya auth_user_id NULL).
  const { data: milik } = await admin
    .from("digital_purchases")
    .select("product_id")
    .eq("payment_status", "Lunas")
    .or(`auth_user_id.eq.${user.id},buyer_email.ilike.${email}`);
  const dimiliki = new Set((milik ?? []).map((r: { product_id: string }) => r.product_id));

  const langs = await fetchProductLangs(admin, ids);

  // ── 4. Susun baris yang sah ───────────────────────────────────────────────
  const sah: { prod: Prod; tier: Tier }[] = [];
  const ditolak: string[] = [];
  for (const it of items) {
    const p = katalog.find((x) => x.id === it.productId);
    if (!p || p.is_active === false) { ditolak.push("produk tidak ditemukan"); continue; }
    if (dimiliki.has(p.id)) { ditolak.push(`${p.title} sudah ada di Perpustakaan kamu`); continue; }
    // Alasan sama dengan tombol Beli satuan: menjual modul yang berkasnya belum
    // diunggah cuma memindahkan kekecewaan ke sesudah pembayaran.
    if (!materialReady(p as Parameters<typeof materialReady>[0], langs[p.id])) {
      ditolak.push(`${p.title} materinya belum siap`); continue;
    }
    const tier = (p.digital_product_pricing ?? []).find(
      (t) => t.id === it.pricingId && t.is_active !== false,
    );
    // Tier WAJIB milik produk itu sendiri — tanpa cek ini, pricingId e-book
    // termurah bisa dipasang ke produk termahal dari console browser.
    if (!tier || typeof tier.price !== "number" || tier.price <= 0) {
      ditolak.push(`${p.title} paket harganya tidak berlaku`); continue;
    }
    sah.push({ prod: p, tier });
  }

  if (sah.length === 0) {
    return tolak(
      ditolak.length > 0 ? `Tak ada yang bisa dibayar: ${ditolak.join("; ")}.` : "Keranjang kosong.",
      409,
    );
  }

  const total = sah.reduce((n, x) => n + (x.tier.price ?? 0), 0);
  if (total <= 0) return tolak("Total belanja tidak valid.", 400);

  const nama =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    email.split("@")[0];
  const telepon =
    (user.user_metadata?.phone as string) || (user.phone ? `+${user.phone}` : null);

  // ── 5. Baris kepemilikan lahir dulu sebagai "Belum Bayar" ─────────────────
  // Urutannya: baris dulu → invoice. Kalau invoice gagal, barisnya dihapus lagi
  // (bersih). Kalau dibalik, invoice yang gagal dicatat akan jadi tagihan hidup
  // yang tak punya baris kepemilikan — persis pembayaran yatim yang dihindari.
  const extId = `LINGUO-CART-${crypto.randomUUID()}-${Date.now()}`;
  const payload = sah.map((x, i) => ({
    product_id: x.prod.id,
    pricing_id: x.tier.id,
    buyer_email: user.email,
    buyer_name: nama,
    buyer_phone: telepon,
    amount: x.tier.price,
    payment_status: "Belum Bayar",
    xendit_status: "PENDING",
    // Baris ke-2 dst diberi sufiks: kolom ini dipakai sebagai kunci match 1:1 di
    // tempat lain, jadi satu external_id tak boleh punya banyak baris identik.
    // Pola sufiks yang sama dipakai fulfillEbookLead di webhook.
    xendit_external_id: i === 0 ? extId : `${extId}-${i + 1}`,
    access_granted: false,
    source: "xendit",
    auth_user_id: user.id,
    ...(referralCode ? { affiliate_ref_code: referralCode } : {}),
  }));

  const { data: baris, error: insErr } = await admin
    .from("digital_purchases")
    .insert(payload)
    .select("id");
  if (insErr || !baris || baris.length === 0) {
    console.error("[create-cart-invoice] insert gagal:", insErr);
    return tolak(
      `Gagal menyiapkan pesanan${insErr?.code ? ` (kode ${insErr.code})` : ""}. Coba lagi sebentar.`,
      500,
    );
  }
  const barisIds = baris.map((r: { id: string }) => r.id);

  // ── 6. Invoice Xendit ─────────────────────────────────────────────────────
  const rapiTipe = (t: string) => (t === "ebook" ? "E-Book" : t === "elearning" ? "E-Learning" : "Produk");
  try {
    const xres = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        external_id: extId,
        amount: total,
        payer_email: user.email,
        description:
          sah.length === 1
            ? `Linguo — ${sah[0].prod.title}`
            : `Linguo — ${sah.length} produk digital (Perpustakaan)`,
        currency: "IDR",
        invoice_duration: 86400,
        should_send_email: true,
        customer_notification_preference: {
          invoice_created: ["email", "whatsapp"],
          invoice_reminder: ["email", "whatsapp"],
          invoice_paid: ["email", "whatsapp"],
        },
        success_redirect_url: `${BASE_URL}/akun?menu=pustaka&bayar=sukses`,
        failure_redirect_url: `${BASE_URL}/akun?menu=pustaka`,
        // Rinciannya ikut ke halaman Xendit + email tagihan, jadi pembeli bisa
        // memeriksa isi keranjangnya sebelum membayar.
        items: sah.map((x) => ({
          name: `${rapiTipe(x.prod.type)} — ${x.prod.title}${x.tier.display_label ? ` (${x.tier.display_label})` : ""}`,
          quantity: 1,
          price: x.tier.price,
        })),
      }),
    });

    if (!xres.ok) {
      const errTeks = await xres.text();
      console.error("[create-cart-invoice] Xendit gagal:", errTeks);
      let detail = errTeks;
      try { const j = JSON.parse(errTeks); detail = j.message || j.error_code || errTeks; } catch {}
      await admin.from("digital_purchases").delete().in("id", barisIds);
      return tolak(`Gagal membuat invoice: ${detail}`, 502);
    }

    const invoice = await xres.json();
    await admin
      .from("digital_purchases")
      .update({ xendit_invoice_id: invoice.id })
      .in("id", barisIds);

    return NextResponse.json(
      {
        ok: true,
        invoice_url: invoice.invoice_url,
        invoice_id: invoice.id,
        external_id: extId,
        total,
        jumlah: sah.length,
        // Item yang gugur dilaporkan apa adanya supaya UI bisa bilang mana yang
        // tak ikut dibayar — bukan diam-diam menagih lebih sedikit.
        ditolak,
      },
      { headers: NO_STORE },
    );
  } catch (e) {
    console.error("[create-cart-invoice] error:", e);
    await admin.from("digital_purchases").delete().in("id", barisIds);
    return tolak("Gagal menghubungi Xendit. Coba lagi sebentar.", 502);
  }
}
