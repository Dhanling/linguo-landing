// linguo-patch:ling-chat-v3  — endpoint poll: widget ambil balasan admin + status sesi
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
    const body = (await req.json().catch(() => ({}))) as {
      sessionId?: unknown;
      afterId?: unknown;
    };
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId ? body.sessionId : null;
    const afterId =
      typeof body.afterId === "number" && Number.isFinite(body.afterId)
        ? body.afterId
        : 0;

    if (!sessionId) return NextResponse.json({ status: "bot", messages: [] });

    const db = sb();
    if (!db) return NextResponse.json({ status: "bot", messages: [] });

    const { data: s } = await db
      .from("chat_sessions")
      .select("status")
      .eq("id", sessionId)
      .maybeSingle();

    const { data: m } = await db
      .from("chat_messages")
      .select("id,content,created_at")
      .eq("session_id", sessionId)
      .eq("role", "admin")
      .gt("id", afterId)
      .order("id", { ascending: true })
      .limit(50);

    return NextResponse.json({
      status: (s as { status?: string } | null)?.status || "bot",
      messages: m || [],
    });
  } catch {
    return NextResponse.json({ status: "bot", messages: [] });
  }
}
