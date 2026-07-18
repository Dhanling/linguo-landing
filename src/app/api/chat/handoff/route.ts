// linguo-patch:ling-intercom-v1 — handoff WA dengan konteks ala Intercom:
// pas user klik tombol admin, percakapan diringkas AI (1-2 kalimat) supaya
// admin langsung tahu kebutuhan user, bukan cuma "halo dari website".
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5";

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const body = (await req.json().catch(() => ({}))) as { sessionId?: unknown };
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId ? body.sessionId : null;
    const db = sb();
    if (!apiKey || !db || !sessionId) return NextResponse.json({ summary: null });

    const { data: m } = await db
      .from("ling_chat_messages")
      .select("role,content")
      .eq("session_id", sessionId)
      .order("id", { ascending: false })
      .limit(16);

    const rows = (m || []).reverse() as Array<{ role: string; content: string }>;
    const userTurns = rows.filter((x) => x.role === "user");
    if (userTurns.length === 0) return NextResponse.json({ summary: null });

    const transcript = rows
      .map(
        (x) =>
          (x.role === "user" ? "User" : x.role === "admin" ? "Admin" : "Bot") +
          ": " +
          x.content.slice(0, 400)
      )
      .join("\n");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system:
          "Ringkas percakapan CS Linguo (kursus bahasa) berikut untuk admin dalam 1-2 kalimat bahasa Indonesia: kebutuhan user, bahasa/program yang diminati, dan hal yang perlu ditindaklanjuti. Teks biasa tanpa markdown, balas ringkasannya saja tanpa pembuka.",
        messages: [{ role: "user", content: transcript }],
      }),
    });
    if (!r.ok) return NextResponse.json({ summary: null });

    const data = (await r.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const summary = Array.isArray(data.content)
      ? data.content
          .filter((b) => b.type === "text")
          .map((b) => b.text || "")
          .join(" ")
          .trim()
          .slice(0, 500)
      : "";

    return NextResponse.json({ summary: summary || null });
  } catch {
    return NextResponse.json({ summary: null });
  }
}
