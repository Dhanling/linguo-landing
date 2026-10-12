// [simulasi-aktivasi-wa-v1] Aktivasi Prediction Test yang dibayar lewat invoice
// WA Inbox TANPA email.
//
// Latar: akses simulasi dikunci ke EMAIL (simulation_entitlements), sedangkan
// CS kini boleh membuat invoice prediction test tanpa menanyakan email dulu
// (sama seperti invoice kelas Private). Begitu lunas, xendit-webhook mengirim
// WA berisi link /simulasi/aktivasi?t=<id tagihan> — di sini siswa mengisi
// emailnya sendiri dan aksesnya diterbitkan saat itu juga.
//
// Kuncinya id `manual_invoices` (uuid acak, hanya dikirim ke nomor WA pembeli).
// Satu tagihan = satu kali aktivasi: sesudah terbit, email-nya tak bisa diganti
// dari sini (link yang bocor tak bisa dipakai membuka akses untuk orang lain).
//
//   GET  /api/simulasi/aktivasi?t=<uuid>  -> status tagihan
//   POST /api/simulasi/aktivasi           -> { token, email } terbitkan akses

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

type Invoice = {
  id: string;
  student_name: string | null;
  program: string | null;
  language: string | null;
  level: string | null;
  status: string | null;
  amount: number | null;
  addons_amount: number | null;
};

async function rest(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...HEADERS, ...(init?.headers ?? {}) }, cache: "no-store" });
}

async function loadInvoice(token: string): Promise<Invoice | null> {
  const res = await rest(
    `manual_invoices?select=id,student_name,program,language,level,status,amount,addons_amount&id=eq.${token}&limit=1`,
  );
  if (!res.ok) return null;
  const rows = await res.json();
  const inv = Array.isArray(rows) ? (rows[0] as Invoice | undefined) : undefined;
  if (!inv || String(inv.program ?? "").trim() !== "Simulasi Tes") return null;
  return inv;
}

const testTypeOf = (inv: Invoice) => {
  const t = String(inv.language ?? "").trim().toLowerCase();
  return t === "toefl" || t === "ielts" ? t : null;
};

const externalIdOf = (inv: Invoice) => `LINGUO-INV-${inv.id}`;

async function activatedEmail(inv: Invoice): Promise<string | null> {
  const res = await rest(
    `simulation_entitlements?select=email&source_external_id=eq.${encodeURIComponent(externalIdOf(inv))}&status=eq.active&limit=1`,
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0]?.email ? String(rows[0].email) : null;
}

/** "an***@gmail.com" — cukup untuk dikenali pemiliknya, tak membocorkan alamatnya. */
function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 2)}***@${domain}`;
}

function describe(inv: Invoice, testType: string, email: string | null) {
  return {
    test_type: testType,
    paket: inv.level || null,
    name: inv.student_name || null,
    paid: String(inv.status ?? "").toLowerCase() === "paid",
    activated: !!email,
    email_masked: email ? maskEmail(email) : null,
  };
}

export async function GET(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get("t") || "").trim();
  if (!UUID_RE.test(token)) return NextResponse.json({ error: "Link aktivasi tidak valid." }, { status: 400 });
  const inv = await loadInvoice(token);
  const testType = inv ? testTypeOf(inv) : null;
  if (!inv || !testType) return NextResponse.json({ error: "Link aktivasi tidak ditemukan." }, { status: 404 });
  return NextResponse.json(describe(inv, testType, await activatedEmail(inv)));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    if (!UUID_RE.test(token)) return NextResponse.json({ error: "Link aktivasi tidak valid." }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Format email belum benar." }, { status: 400 });

    const inv = await loadInvoice(token);
    const testType = inv ? testTypeOf(inv) : null;
    if (!inv || !testType) return NextResponse.json({ error: "Link aktivasi tidak ditemukan." }, { status: 404 });
    if (String(inv.status ?? "").toLowerCase() !== "paid") {
      return NextResponse.json(
        { error: "Pembayarannya belum kami terima. Kalau sudah bayar, coba lagi beberapa menit lagi ya." },
        { status: 409 },
      );
    }

    const sudah = await activatedEmail(inv);
    if (sudah) {
      if (sudah.toLowerCase() === email) return NextResponse.json({ ...describe(inv, testType, sudah), already: true });
      return NextResponse.json(
        { error: `Akses ini sudah diaktifkan ke ${maskEmail(sudah)}. Hubungi admin Linguo kalau emailnya perlu diganti.` },
        { status: 409 },
      );
    }

    const ins = await rest("simulation_entitlements", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        email,
        test_type: testType,
        status: "active",
        source_external_id: externalIdOf(inv),
        amount: (inv.amount ?? 0) + (inv.addons_amount ?? 0),
      }),
    });
    if (!ins.ok) {
      console.error("[simulasi-aktivasi] gagal insert entitlement:", inv.id, await ins.text());
      return NextResponse.json({ error: "Gagal mengaktifkan akses. Coba lagi ya." }, { status: 500 });
    }

    // Emailnya ikut dicatat di tagihan & lead omzetnya (non-fatal): dashboard
    // admin jadi tahu akses ini jatuh ke email mana.
    await Promise.allSettled([
      rest(`manual_invoices?id=eq.${inv.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ student_email: email }),
      }),
      rest(`leads?xendit_external_id=eq.${encodeURIComponent(externalIdOf(inv))}&email=is.null`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ email }),
      }),
    ]);

    return NextResponse.json({ ...describe(inv, testType, email), activated: true });
  } catch (err) {
    console.error("[simulasi-aktivasi] error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan. Coba lagi ya." }, { status: 500 });
  }
}
