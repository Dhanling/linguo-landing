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
  // [elearning-per-bahasa-v1] Pasangan FREEEBOOK untuk e-learning per bahasa.
  // Jatahnya dihitung TERPISAH per tipe produk (lihat bawah), jadi satu akun
  // boleh mencicipi satu e-book DAN satu bahasa e-learning.
  FREEELEARNING: { hari: 30, tipe: "elearning", maksPerAkun: 1, label: "Akses gratis 1 bulan" },
};

// ── Email ucapan (bukan tagihan) ──────────────────────────────────────────
// Klaim promo tidak melahirkan invoice, jadi satu-satunya kabar yang sampai ke
// pembeli dulu cuma toast di layar — sementara yang menekan "Beli" justru dapat
// email tagihan Xendit. Yang gratis harus tetap dapat kabar, isinya ucapan
// terima kasih + masa aktif + pintu masuk materinya.
//
// Best-effort: klaimnya sudah terbit di DB, email yang gagal tak boleh
// membatalkannya (pola yang sama dipakai _shared/email.ts di edge function).
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Linguo <noreply@linguo.id>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id";

function tglIndo(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  });
}

async function kirimEmailUcapan(opts: {
  to: string; nama: string; judul: string; kode: string; hari: number; sampai: string;
}) {
  if (!RESEND_API_KEY) return;
  const html = `
  <div style="margin:0;padding:24px;background:#F5F6F8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden">
      <div style="background:#1A9E9E;padding:22px 26px;color:#fff">
        <div style="font-size:19px;font-weight:800">Selamat belajar, ${opts.nama}! 🎉</div>
      </div>
      <div style="padding:24px 26px;color:#12172B">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6">
          Terima kasih sudah memakai kode <b>${opts.kode}</b>. Aksesnya sudah aktif —
          <b>tidak ada tagihan apa pun</b> untuk klaim ini.
        </p>
        <div style="border:1px solid #E6E8EC;border-radius:14px;padding:14px 16px;margin:0 0 18px">
          <div style="font-size:15px;font-weight:800">${opts.judul}</div>
          <div style="margin-top:6px;font-size:13px;color:#5B6478">
            Gratis ${opts.hari} hari · aktif sampai ${tglIndo(opts.sampai)}
          </div>
        </div>
        <a href="${BASE_URL}/akun?menu=pustaka"
           style="display:inline-block;background:#1A9E9E;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:12px">
          Buka Perpustakaan
        </a>
        <p style="margin:18px 0 0;font-size:12.5px;line-height:1.6;color:#7A8496">
          Materinya ada di menu <b>Perpustakaan</b> dashboard Linguo. Ada kendala?
          Balas email ini atau hubungi CS Linguo ya.
        </p>
      </div>
    </div>
  </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [opts.to],
        subject: `Akses ${opts.judul} sudah aktif — selamat belajar!`,
        html,
      }),
    });
    if (!res.ok) console.error("[promo-digital] email gagal:", res.status, await res.text());
  } catch (err) {
    console.error("[promo-digital] email error (tidak fatal):", err);
  }
}

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
    .select("id, product_id, source, expires_at, digital_products(type)")
    .eq("payment_status", "Lunas")
    .or(`auth_user_id.eq.${user.id},buyer_email.ilike.${email}`);
  const rows = (milik ?? []) as Array<{
    id: string; product_id: string; source: string | null; expires_at: string | null;
    digital_products: { type: string } | { type: string }[] | null;
  }>;
  const tipeBaris = (r: (typeof rows)[number]) => {
    const dp = Array.isArray(r.digital_products) ? r.digital_products[0] : r.digital_products;
    return dp?.type ?? null;
  };
  if (rows.some((r) => r.product_id === productId)) {
    return NextResponse.json(
      { ok: false, sudahPunya: true, error: "Produk ini sudah ada di Perpustakaan kamu." },
      { status: 409, headers: NO_STORE },
    );
  }
  // Jatah dihitung PER TIPE PRODUK, bukan atas semua baris promo. Dulu satu
  // penghitung dipakai bersama, jadi begitu FREEEBOOK terpakai, FREEELEARNING
  // ikut tertutup padahal itu promo yang lain sama sekali.
  const klaimPromo = rows.filter(
    (r) => r.source === "promo" && (!promo.tipe || tipeBaris(r) === promo.tipe),
  ).length;
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

  // Kabar baiknya dikirim SESUDAH aksesnya benar-benar terbit, dan kegagalannya
  // tidak mengubah jawaban ke klien.
  await kirimEmailUcapan({
    to: user.email, nama: nama.split(" ")[0] || nama, judul: prod.title,
    kode, hari: promo.hari, sampai,
  });

  return NextResponse.json(
    { ok: true, code: kode, purchase_id: baris.id, expires_at: sampai, hari: promo.hari, label: promo.label },
    { headers: NO_STORE },
  );
}
