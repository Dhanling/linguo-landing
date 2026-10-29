// [ling-prechat-kontak-v1] Isian wajib sebelum chat Minling: nama + WA + email.
// Disimpan ke ling_chat_sessions (biar tampil di dashboard Chat Minling) dan
// sekali per sesi ke tabel leads (source "ling-chat"), supaya pengunjung yang
// cuma tanya-tanya lalu pergi tetap tercatat sebagai calon pelanggan.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Sama dengan normWa di ../route.ts: 0812… / +62… / 812… → 62812…
function normWa(v: string): string | null {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d.length >= 10 && d.length <= 16 ? d : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const sessionId = str(body.sessionId);
  const name = str(body.name).slice(0, 80);
  const wa = normWa(str(body.wa));
  const email = str(body.email).toLowerCase().slice(0, 120);
  const page = str(body.page).slice(0, 300) || null;

  if (!sessionId) return NextResponse.json({ ok: false, error: "Sesi tidak valid" }, { status: 400 });
  if (!name) return NextResponse.json({ ok: false, error: "Nama wajib diisi" }, { status: 400 });
  if (!wa) return NextResponse.json({ ok: false, error: "Nomor WhatsApp tidak valid" }, { status: 400 });
  if (!EMAIL_RE.test(email))
    return NextResponse.json({ ok: false, error: "Email tidak valid" }, { status: 400 });

  const db = sb();
  // DB mati jangan sampai pengunjung terkunci di luar chat.
  if (!db) return NextResponse.json({ ok: true });

  try {
    await db
      .from("ling_chat_sessions")
      .upsert({ id: sessionId, page }, { onConflict: "id", ignoreDuplicates: true });
    const { data: s } = await db
      .from("ling_chat_sessions")
      .select("visitor_wa,ticket_no")
      .eq("id", sessionId)
      .maybeSingle();
    const prev = s as { visitor_wa: string | null; ticket_no: string | null } | null;
    await db
      .from("ling_chat_sessions")
      .update({ visitor_name: name, visitor_wa: wa, visitor_email: email })
      .eq("id", sessionId);
    // Lead sekali per sesi — sama aturannya dengan lead capture AI di ../route.ts.
    if (!prev?.visitor_wa) {
      await db.from("leads").insert({
        name,
        wa_number: wa,
        email,
        source: "ling-chat" + (prev?.ticket_no ? ` · ${prev.ticket_no}` : ""),
      });
    }
  } catch {
    /* gagal simpan: chat tetap boleh jalan */
  }
  return NextResponse.json({ ok: true });
}
