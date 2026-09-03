import { NextRequest, NextResponse } from "next/server";
import { previewStudentId, serviceRest } from "@/lib/previewSession";

// ── preview-session-v1 · Perpustakaan Saya ────────────────────────────────
// Sisi server halaman /akun/perpustakaan untuk mode pratinjau POV siswa.
//
// Pratinjau TIDAK punya sesi login, sedangkan LibraryView menyaring pembelian
// lewat `auth_user_id = <user login>` dan policy digital_purchases cuma berlaku
// buat role `authenticated` → halamannya dulu memantul balik ke /akun (menu
// "Perpustakaan" terasa mati). Data diambil service role di sini, dikunci ke
// SATU siswa oleh cookie pratinjau, dan read-only (tak ada unduh/perpanjang).
//
// Siswa dicocokkan lewat student_id DAN buyer_email: pembelian digital lama
// masuk lewat funnel tanpa akun, jadi barisnya sering cuma punya email.
//
// [pratinjau-beli-langsung-v1] Selain rak, route ini juga menyerahkan identitas
// pembeli (nama/email/WA siswa). Tanpa itu popup Beli di POV mati total: dia
// mengambil `buyer` dari supabase.auth.getUser(), yang di pratinjau kosong.
// Identitasnya diambil server dari baris students — TIDAK dari input klien —
// supaya tagihan tak bisa dialihkan ke email lain lewat devtools.

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

const PURCHASE_SELECT = [
  // [ebook-pratinjau-unit1-v1] `source` ikut: kartu bertanda "Pratinjau"
  // harus terbaca sama di POV staf, kalau tidak staf melihat rak yang berbeda
  // dari yang dilihat siswanya.
  "id,payment_status,access_granted,expires_at,download_count,created_at,source",
  "digital_products(id,type,title,slug,cover_url,file_url,video_playlist_url,language,level,pages,modules_count,total_duration_min)",
  "digital_product_pricing(display_label,duration_days)",
].join(",");

export async function GET(req: NextRequest) {
  const student = req.nextUrl.searchParams.get("student");
  if (!student || !/^[0-9a-f-]{36}$/i.test(student)) {
    return NextResponse.json({ error: "invalid student" }, { status: 400 });
  }
  const allowed = await previewStudentId(req);
  if (!allowed || allowed !== student) {
    return NextResponse.json({ error: "preview session required" }, { status: 403 });
  }

  const rows = (await serviceRest(
    `students?id=eq.${student}&select=email,name,whatsapp&limit=1`,
  )) as Row[] | null;
  const siswa = rows?.[0] ?? null;
  const email = (siswa?.email as string | null)?.trim() || null;

  const filter = email
    ? `or=(student_id.eq.${student},buyer_email.ilike.${encodeURIComponent(email)})`
    : `student_id=eq.${student}`;

  const purchases =
    ((await serviceRest(
      `digital_purchases?select=${PURCHASE_SELECT}&payment_status=eq.Lunas&${filter}&order=created_at.desc`,
    )) as Row[] | null) ?? [];

  // [pratinjau-beli-langsung-v1] `buyer` null kalau siswanya belum punya email —
  // popup Beli membaca itu sebagai "tak bisa ditagih" dan bilang apa adanya.
  const buyer = email
    ? {
        email,
        name: ((siswa?.name as string | null) ?? "").trim() || email.split("@")[0],
        phone: ((siswa?.whatsapp as string | null) ?? "").trim() || null,
      }
    : null;

  return NextResponse.json({ purchases, buyer });
}
