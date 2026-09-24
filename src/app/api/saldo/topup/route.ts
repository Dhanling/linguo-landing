// [saldo-siswa-v1] Top up Saldo Linguo dari /akun › Pengaturan › Tagihan & Paket.
//
// Alur: baris `student_wallet_entries` kind='topup' status='pending' dibuat di
// sini → invoice Xendit external_id `LINGUO-TOPUP-<id baris>` → edge fn
// `xendit-webhook` (linguo-app, handleWalletTopup) memanggil rpc
// `wallet_selesaikan_topup` yang mengubahnya jadi 'success'. Saldo cuma
// menghitung baris 'success', jadi invoice yang tak dibayar tak menambah apa pun.
//
// ⚠️ Yang memenuhi invoice ini edge fn di linguo-app, BUKAN
// src/app/api/xendit-webhook/route.ts di repo ini (lihat catatan di sana).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id";

const NO_STORE = { "Cache-Control": "no-store, private, max-age=0" };
const MIN_TOPUP = 10_000;
const MAKS_TOPUP = 50_000_000;

function tolak(pesan: string, status: number) {
  return NextResponse.json({ ok: false, error: pesan }, { status, headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  let accessToken = "";
  let amount = 0;
  try {
    const body = await req.json();
    accessToken = String(body.accessToken ?? "");
    amount = Math.round(Number(body.amount ?? 0));
  } catch {
    return tolak("Permintaan tidak terbaca", 400);
  }
  if (!accessToken) return tolak("Sesi tidak terbaca — coba muat ulang halaman.", 401);
  if (!Number.isFinite(amount) || amount < MIN_TOPUP) {
    return tolak(`Minimal top up Rp ${MIN_TOPUP.toLocaleString("id-ID")}`, 400);
  }
  if (amount > MAKS_TOPUP) return tolak("Nominal top up terlalu besar — hubungi admin.", 400);

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

  // Siswa = baris students se-email (sama dengan policy RLS dashboard siswa).
  // Akun kembar: pakai yang paling tua supaya konsisten.
  const { data: siswa } = await admin
    .from("students")
    .select("id, name")
    .ilike("email", email.replace(/[\\%_]/g, "\\$&"))
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!siswa?.id) return tolak("Profil siswa belum ada — daftar kelas dulu atau hubungi admin.", 404);

  // external_id ditulis sejak INSERT supaya webhook tak pernah datang lebih
  // dulu daripada kuncinya.
  const id = crypto.randomUUID();
  const extId = `LINGUO-TOPUP-${id}`;
  const { error: insErr } = await admin.from("student_wallet_entries").insert({
    id, student_id: siswa.id, amount, kind: "topup", status: "pending",
    xendit_external_id: extId, note: "Top up saldo",
  });
  if (insErr) {
    console.error("[saldo/topup] insert gagal:", insErr);
    return tolak("Gagal menyiapkan top up. Coba lagi ya.", 500);
  }

  try {
    const xres = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        external_id: extId,
        amount,
        payer_email: email,
        description: `Linguo — Top up Saldo Linguo (${siswa.name || email})`,
        currency: "IDR",
        invoice_duration: 86400,
        should_send_email: true,
        success_redirect_url: `${BASE_URL}/akun?menu=akun&pane=tagihan&topup=sukses`,
        failure_redirect_url: `${BASE_URL}/akun?menu=akun&pane=tagihan`,
        items: [{ name: "Top up Saldo Linguo", quantity: 1, price: amount }],
      }),
    });
    if (!xres.ok) {
      const teks = await xres.text();
      console.error("[saldo/topup] Xendit gagal:", teks);
      await admin.from("student_wallet_entries").update({ status: "cancelled" }).eq("id", id);
      return tolak("Gagal membuat invoice top up. Coba lagi ya.", 502);
    }
    const invoice = await xres.json();
    await admin
      .from("student_wallet_entries")
      .update({ xendit_invoice_id: invoice.id })
      .eq("id", id);
    return NextResponse.json({ ok: true, invoice_url: invoice.invoice_url }, { headers: NO_STORE });
  } catch (e) {
    console.error("[saldo/topup] error:", e);
    await admin.from("student_wallet_entries").update({ status: "cancelled" }).eq("id", id);
    return tolak("Gagal membuat invoice top up. Coba lagi ya.", 500);
  }
}
