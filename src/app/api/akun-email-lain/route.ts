// [akun-email-lain-v1] "Kelasku terdaftar pakai email lain?"
//
// Laporan Faujiah db6f7259 (21 Okt 2026): Murni Febrina didaftarkan admin ke Kelas
// Private Hebrew dengan email Yahoo, tapi masuk /akun dari HP pakai Gmail. Dashboard
// tidak menemukan baris `students` untuk Gmail itu → onboarding, dan dari wizard
// lahir registrasi kembaran "Belum Bayar". Siswanya mengira dashboard-nya tidak ada.
//
// Route ini mencari siswa lain yang memakai NOMOR WA yang sama dan sudah punya kelas.
// Yang dikembalikan cuma email TERSAMAR + nama kelas — cukup untuk "masuk pakai email
// itu", tidak cukup untuk membocorkan data orang yang kebetulan nomornya diketik.
// Akun TIDAK digabung otomatis: nomor WA bisa diketik siapa saja.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** f*******s@yahoo.com — huruf pertama & terakhir nama, domain utuh. */
function samarkan(email: string): string {
  const [nama, domain] = email.split("@");
  if (!domain) return "***";
  if (nama.length <= 2) return `${nama[0]}*@${domain}`;
  return `${nama[0]}${"*".repeat(Math.min(8, nama.length - 2))}${nama[nama.length - 1]}@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, wa } = await req.json();
    if (!accessToken) return NextResponse.json({ error: "Perlu masuk dulu" }, { status: 401 });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user?.email) {
      return NextResponse.json({ error: "Sesi tidak valid atau sudah habis" }, { status: 401 });
    }

    const digits = String(wa || "").replace(/\D/g, "");
    const inti = digits.startsWith("62") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
    if (inti.length < 8 || inti.length > 13) return NextResponse.json({ akun: [] });
    // Kolom `whatsapp` diisi macam-macam: 62…, 0…, +62…, atau tanpa awalan sama sekali.
    const varian = [`62${inti}`, `0${inti}`, `+62${inti}`, inti];

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: siswa, error: sErr } = await admin
      .from("students")
      .select("id, email")
      .in("whatsapp", varian);
    if (sErr) throw sErr;
    const emailSaya = user.email.trim().toLowerCase();
    const lain = (siswa ?? []).filter((s: { email: string | null }) =>
      !!s.email && s.email.trim().toLowerCase() !== emailSaya);
    if (!lain.length) return NextResponse.json({ akun: [] });

    const { data: regs, error: rErr } = await admin
      .from("registrations")
      .select("student_id, product, language")
      .in("student_id", lain.map((s: { id: string }) => s.id))
      .is("archived_at", null)
      .in("payment_status", ["Lunas", "Cicilan", "Menunggu Verifikasi"]);
    if (rErr) throw rErr;

    const perEmail = new Map<string, Set<string>>();
    for (const r of regs ?? []) {
      const s = lain.find((x: { id: string }) => x.id === r.student_id);
      if (!s?.email) continue;
      const e = s.email.trim().toLowerCase();
      const kelas = [r.product, r.language].filter(Boolean).join(" ");
      perEmail.set(e, (perEmail.get(e) ?? new Set()).add(kelas));
    }
    const akun = [...perEmail.entries()].map(([email, kelas]) => ({
      email: samarkan(email),
      kelas: [...kelas].filter(Boolean),
    }));
    return NextResponse.json({ akun });
  } catch (e) {
    console.error("[akun-email-lain]", e);
    return NextResponse.json({ error: "Gagal memeriksa" }, { status: 500 });
  }
}
