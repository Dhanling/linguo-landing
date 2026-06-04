/**
 * [linguo-patch:akun-self-delete-v1]
 * POST /api/account/delete — Penghapusan akun mandiri oleh siswa.
 *
 * Strategi (mode B — anonymize, bukan hard-delete record keuangan):
 *  1. Verifikasi pemanggil dari token-nya sendiri (Authorization: Bearer <access_token>).
 *     HANYA pemilik akun yang bisa menghapus akunnya sendiri — uid diambil dari token,
 *     bukan dari body request.
 *  2. Anonymize PII yang di-key by email (nama/email/WA → sentinel). Baris transaksi
 *     `digital_purchases` TETAP ADA (cuma buyer_email/buyer_name di-mask) → omzet utuh.
 *  3. Hapus data non-keuangan yang di-key by user_id (LMS progress, quiz, notif, dll).
 *     Set leads.user_id = null DULU supaya FK cascade (kalau ada) tak ikut menghapusnya.
 *  4. Hapus auth user PALING AKHIR → email langsung bebas dipakai daftar ulang.
 *
 * Karena `digital_purchases` tidak punya FK ke auth.users (hanya buyer_email/buyer_name),
 * deleteUser TIDAK akan cascade menghapus record pembelian. Email sentinel unik per-uid
 * sehingga tak pernah bentrok dengan email asli maupun antar-akun yang dihapus.
 *
 * ENV WAJIB di Vercel (linguo-landing): SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const delEmail = (uid: string) => `deleted+${uid}@deleted.linguo.id`;
const DEL_NAME = "[dihapus]";
const delPhone = (uid: string) => `deleted-${uid.slice(0, 12)}`;

export async function POST(req: Request) {
  try {
    if (!SERVICE_ROLE) {
      return NextResponse.json(
        { error: "Server belum dikonfigurasi (SUPABASE_SERVICE_ROLE_KEY belum diset)." },
        { status: 500 },
      );
    }

    // 1) Verifikasi pemanggil dari token-nya sendiri
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
    }

    const uid = user.id;
    const email = (user.email || "").trim();

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Best-effort: 1 tabel gagal tak membatalkan keseluruhan; warning dikumpulkan.
    const warnings: string[] = [];
    const run = async (label: string, p: PromiseLike<{ error: unknown }>) => {
      try {
        const { error } = await p;
        if (error) warnings.push(`${label}: ${(error as { message?: string })?.message ?? error}`);
      } catch (e) {
        warnings.push(`${label}: ${(e as Error)?.message ?? String(e)}`);
      }
    };

    // 2) Anonymize PII yang di-key by email (record tetap ada)
    if (email) {
      await run(
        "digital_purchases",
        admin
          .from("digital_purchases")
          .update({ buyer_email: delEmail(uid), buyer_name: DEL_NAME })
          .eq("buyer_email", email),
      );
      await run(
        "students",
        admin
          .from("students")
          .update({ email: delEmail(uid), name: DEL_NAME, whatsapp: delPhone(uid) })
          .eq("email", email),
      );
      await run(
        "leads",
        admin
          .from("leads")
          .update({ email: delEmail(uid), name: DEL_NAME, whatsapp: delPhone(uid), user_id: null })
          .eq("email", email),
      );
      await run(
        "placement_results",
        admin
          .from("placement_results")
          .update({ email: delEmail(uid), name: DEL_NAME, whatsapp: delPhone(uid) })
          .eq("email", email),
      );
      await run(
        "program_registrations",
        admin
          .from("program_registrations")
          .update({ email: delEmail(uid), name: DEL_NAME, whatsapp: delPhone(uid) })
          .eq("email", email),
      );
      await run(
        "trial_registrations",
        admin
          .from("trial_registrations")
          .update({ email: delEmail(uid), name: DEL_NAME })
          .eq("email", email),
      );
      await run(
        "waitlist",
        admin
          .from("waitlist")
          .update({ email: delEmail(uid), name: DEL_NAME, whatsapp: delPhone(uid) })
          .eq("email", email),
      );
    }

    // 3) Hapus data non-keuangan yang di-key by user_id
    await run("lms_progress", admin.from("lms_progress").delete().eq("user_id", uid));
    await run("lms_quiz_attempts", admin.from("lms_quiz_attempts").delete().eq("user_id", uid));
    await run("notifications", admin.from("notifications").delete().eq("user_id", uid));
    await run("push_subscriptions", admin.from("push_subscriptions").delete().eq("user_id", uid));
    await run("action_item_dismissals", admin.from("action_item_dismissals").delete().eq("user_id", uid));
    // profiles: PK biasanya `id` = auth.uid (kalau FK cascade, akan terhapus otomatis di langkah 4)
    await run("profiles", admin.from("profiles").delete().eq("id", uid));

    // 4) Hapus auth user PALING AKHIR → email bebas dipakai daftar ulang
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      return NextResponse.json(
        { error: "Gagal menghapus akun auth: " + delErr.message, warnings },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, warnings });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error)?.message ?? String(e) },
      { status: 500 },
    );
  }
}
