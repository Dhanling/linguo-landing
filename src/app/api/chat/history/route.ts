// linguo-patch:ling-intercom-v1 — riwayat chat persisten ala Intercom:
// widget muat ulang percakapan lama dari ling_chat_messages saat dibuka,
// jadi refresh/balik lagi ga menghapus obrolan.
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

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { sessionId?: unknown };
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId ? body.sessionId : null;
    if (!sessionId)
      return NextResponse.json({ messages: [], status: "bot", ticket_no: null });

    const db = sb();
    if (!db)
      return NextResponse.json({ messages: [], status: "bot", ticket_no: null });

    const { data: s } = await db
      .from("ling_chat_sessions")
      .select("ticket_no,status")
      .eq("id", sessionId)
      .maybeSingle();

    const { data: m } = await db
      .from("ling_chat_messages")
      .select("id,role,content")
      .eq("session_id", sessionId)
      .order("id", { ascending: true })
      .limit(200);

    // Read receipt: begitu visitor membuka widget & memuat riwayat, semua pesan
    // admin dianggap sudah dibaca → Chat Minling nampilin ✓✓ "Dibaca".
    // Fire-and-forget (tak menghambat respons; gagal ya sudah).
    void db
      .from("ling_chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("role", "admin")
      .is("read_at", null);

    return NextResponse.json({
      messages: m || [],
      status: (s as { status?: string } | null)?.status || "bot",
      ticket_no: (s as { ticket_no?: string | null } | null)?.ticket_no || null,
    });
  } catch {
    return NextResponse.json({ messages: [], status: "bot", ticket_no: null });
  }
}
