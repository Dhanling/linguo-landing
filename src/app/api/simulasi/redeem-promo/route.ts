// promo-code-v1 — Klaim kode promo GRATIS untuk Simulasi Tes.
// Alih-alih lewat Xendit, kode gratis (mis. LINGUOHEMAT) langsung meng-grant
// simulation_entitlements dengan source_external_id "PROMO-<kode>" + amount 0.
// Cap jumlah attempt ditegakkan di sisi klaim exam (lihat simulations.ts).
//
// KEAMANAN: caller WAJIB kirim access token Supabase (Authorization: Bearer ...).
// Email & user_id diambil dari token yang diverifikasi service-role —
// BUKAN dari body — supaya orang tak bisa grant akses ke email sembarang.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FREE_PROMOS, normalizePromo, PROMO_SOURCE_PREFIX } from "@/lib/simulasiPakets";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VALID_TEST_TYPES = new Set(["toefl", "ielts"]);

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi sesi caller.
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "Harus login dulu." }, { status: 401 });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Sesi tidak valid, coba login ulang." }, { status: 401 });
    }
    const userId = userData.user.id;
    const email = (userData.user.email || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "Akun tanpa email tidak bisa klaim promo." }, { status: 400 });

    // 2. Validasi input.
    const body = await req.json();
    const code = normalizePromo(String(body?.code || ""));
    const testType = String(body?.test_type || "").toLowerCase();
    const promo = FREE_PROMOS[code];
    if (!promo) return NextResponse.json({ error: "Kode promo tidak berlaku." }, { status: 400 });
    if (!VALID_TEST_TYPES.has(testType)) {
      return NextResponse.json({ error: "Jenis tes tidak valid." }, { status: 400 });
    }

    // 3. Sudah punya entitlement aktif utk jenis tes ini? → tidak perlu grant lagi.
    const existRes = await fetch(
      `${SUPABASE_URL}/rest/v1/simulation_entitlements?select=id,source_external_id&status=eq.active&test_type=eq.${testType}&or=(user_id.eq.${userId},email.eq.${encodeURIComponent(email)})&limit=1`,
      { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
    );
    const existRows = existRes.ok ? await existRes.json() : [];
    if (Array.isArray(existRows) && existRows.length > 0) {
      return NextResponse.json({ granted: false, already: true, test_type: testType });
    }

    // 4. Grant entitlement promo (gratis).
    const insRes = await fetch(`${SUPABASE_URL}/rest/v1/simulation_entitlements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        email,
        user_id: userId,
        test_type: testType,
        status: "active",
        source_external_id: `${PROMO_SOURCE_PREFIX}${code}`,
        amount: 0,
      }),
    });
    if (!insRes.ok) {
      const err = await insRes.text();
      console.error("redeem-promo grant error:", err);
      return NextResponse.json({ error: "Gagal mengaktifkan akses promo." }, { status: 500 });
    }

    return NextResponse.json({ granted: true, test_type: testType, attempt_limit: promo.attemptLimit });
  } catch (e) {
    console.error("redeem-promo error:", e);
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}
