// src/app/api/payroll/kirim-slip/route.ts
// [slip-gaji-kirim-ulang-v1]
//
// Kirim (ulang) slip gaji satu baris payroll ke email karyawannya — dipanggil
// tombol amplop di dashboard HR › Payroll. Dipakai saat email karyawan baru
// diisi/dibetulkan sesudah gajinya cair, atau gaji ditandai "Bayar" manual
// (webhook Xendit cuma mengirim slip sekali, saat baris berpindah ke 'paid').
//
// Owner saja (JWT Supabase di header Authorization), dan hanya baris 'paid'.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { kirimSlipGaji } from "@/lib/slipGajiEmail";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const ORIGIN_INTERNAL = /^https:\/\/dashboard\.linguo\.id$|^http:\/\/localhost:\d+$/;

function corsUntuk(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  if (!ORIGIN_INTERNAL.test(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization",
    Vary: "Origin",
  };
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsUntuk(req) });
}

export async function POST(req: NextRequest) {
  const res = await kirim(req);
  for (const [k, v] of Object.entries(corsUntuk(req))) res.headers.set(k, v);
  return res;
}

async function kirim(req: NextRequest) {
  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    const { data: profile } = await admin.from("profiles").select("role").eq("id", userData.user.id).single();
    if (profile?.role !== "owner") {
      return NextResponse.json({ error: "Cuma owner yang boleh mengirim slip gaji." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const payrollId = typeof body?.payroll_id === "string" ? body.payroll_id : "";
    if (!payrollId) return NextResponse.json({ error: "payroll_id wajib diisi." }, { status: 400 });

    const { data: row } = await admin.from("payroll").select("id, status").eq("id", payrollId).maybeSingle();
    if (!row) return NextResponse.json({ error: "Payroll tidak ditemukan." }, { status: 404 });
    if (row.status !== "paid") {
      return NextResponse.json({ error: "Slip hanya dikirim untuk gaji yang sudah dibayar." }, { status: 400 });
    }

    const hasil = await kirimSlipGaji(admin, payrollId, null);
    if (hasil === "tanpa-email") {
      return NextResponse.json({ error: "Email karyawan kosong — isi dulu di data karyawan." }, { status: 400 });
    }
    if (hasil !== "terkirim") return NextResponse.json({ error: "Email gagal dikirim, coba lagi." }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
