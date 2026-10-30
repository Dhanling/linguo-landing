// [availability-masih-sama-v1] POST dari tombol "Ya, masih sama" di /availability/masih-sama.
// Memperbarui created_at semua baris teacher_availability pengajar itu supaya pencocokan
// jadwal (jadwalPublikServer, batas 30 hari) menghitungnya segar lagi — isinya tidak diubah.
// Sengaja POST, bukan GET: pratinjau link WhatsApp ikut membuka URL, dan itu tidak boleh
// dianggap konfirmasi.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { bacaTiketAvail } from "@/lib/availabilityLink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const t = String(form?.get("t") ?? "");
  const exp = String(form?.get("exp") ?? "");
  const sig = String(form?.get("sig") ?? "");
  const balik = (q: string) =>
    NextResponse.redirect(
      new URL(`/availability/masih-sama?t=${encodeURIComponent(t)}&exp=${encodeURIComponent(exp)}&sig=${encodeURIComponent(sig)}&${q}`, req.url),
      303,
    );

  const teacherId = bacaTiketAvail(t, exp, sig);
  if (!teacherId) return balik("hasil=tak-sah");

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await admin
    .from("teacher_availability")
    .update({ created_at: new Date().toISOString() })
    .eq("teacher_id", teacherId)
    .select("id");
  if (error) {
    console.error("[availability-masih-sama]", error);
    return balik("hasil=gagal");
  }
  return balik(data && data.length > 0 ? "hasil=ok" : "hasil=kosong");
}
