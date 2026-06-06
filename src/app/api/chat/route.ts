// linguo-patch:chat-widget-ai-wa-v1
// linguo-patch:ling-polish-v2
// linguo-patch:ling-chat-v3  — logging Supabase, nomor tiket, status human-aware
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5";

// ====== OTAK CHATBOT — boleh diedit kapan aja ======
const SYSTEM = `Kamu adalah "Ling", asisten virtual resmi Linguo.id — kursus bahasa online nomor 1 di Indonesia (sejak 2020, PT Linguo Edu Indonesia).

GAYA:
- Ramah, hangat, ringkas (2-4 kalimat). Pakai bahasa yang dipakai user (Indonesia/Inggris/dll). Boleh emoji secukupnya.
- Jangan bertele-tele. Jawab to the point lalu tawarkan langkah lanjut.
- Tulis dalam TEKS BIASA (plain text). JANGAN pakai format markdown: jangan pakai **tebal**, *miring*, tanda pagar #, atau bullet dengan tanda * / -. Kalau perlu menyebut beberapa poin, tulis dengan kalimat biasa atau pisahkan per baris.

YANG KAMU TAU SOAL LINGUO:
- 55+ bahasa asing, level CEFR A1-B2.
- Layanan: Kelas Private (1-on-1), Kelas Reguler (grup), Kelas Anak, Test Prep (IELTS/TOEFL/dll), E-Learning (belajar mandiri), E-Book, Penerjemah Tersumpah, Interpreter, dan kelas Corporate/B2B.
- Harga mulai Rp29.000 (untuk E-Book/E-Learning).
- Link berguna (arahkan user ke sini bila relevan):
  - Lihat semua harga: https://linguo.id/harga
  - Kelas trial gratis: https://linguo.id/kelas-trial
  - Jadwal kelas reguler: https://linguo.id/jadwal-kelas-reguler
  - Toko E-Learning & E-Book: https://linguo.id/toko
  - Kelas anak: https://linguo.id/kelas-anak

ATURAN PENTING:
- JANGAN mengarang harga, jadwal, promo, atau diskon yang spesifik. Untuk harga kelas Private/Reguler/Test Prep/Corporate yang detail, arahkan ke halaman Harga atau ke admin.
- Kalau pertanyaan butuh manusia - harga custom/penawaran B2B, status pembayaran atau pendaftaran, komplain, penjadwalan personal, atau apa pun yang kamu TIDAK yakin - sarankan user klik tombol "Ngobrol langsung sama admin (WhatsApp)" yang ada di atas chat ini. Jangan kasih nomor WhatsApp manual; cukup arahkan ke tombolnya.
- Jangan pernah berjanji atas nama Linguo soal hal yang tidak pasti.
- Kalau ditanya hal di luar topik bahasa/Linguo, jawab singkat lalu arahkan balik ke layanan Linguo.`;
// ====== /OTAK ======

type ChatMsg = { role: "user" | "assistant"; content: string };

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    const body = (await req.json().catch(() => ({}))) as {
      messages?: unknown;
      sessionId?: unknown;
      page?: unknown;
    };
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId ? body.sessionId : null;
    const page =
      typeof body.page === "string" ? body.page.slice(0, 300) : null;
    const rawList = Array.isArray(body.messages) ? (body.messages as unknown[]) : [];

    const msgs: ChatMsg[] = rawList
      .filter((m): m is ChatMsg => {
        const x = m as { role?: unknown; content?: unknown };
        return (
          !!m &&
          (x.role === "user" || x.role === "assistant") &&
          typeof x.content === "string"
        );
      })
      .slice(-12)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

    // --- Logging + ambil status/tiket (best-effort, ga boleh ngerusak chat) ---
    let ticket_no: string | null = null;
    let status = "bot";
    const db = sb();
    if (db && sessionId) {
      try {
        await db
          .from("chat_sessions")
          .upsert({ id: sessionId, page }, { onConflict: "id", ignoreDuplicates: true });
        const { data: s } = await db
          .from("chat_sessions")
          .select("ticket_no,status")
          .eq("id", sessionId)
          .maybeSingle();
        if (s) {
          ticket_no = (s as { ticket_no: string | null }).ticket_no;
          status = (s as { status: string }).status || "bot";
        }
        const last = msgs[msgs.length - 1];
        if (last && last.role === "user") {
          await db
            .from("chat_messages")
            .insert({ session_id: sessionId, role: "user", content: last.content });
        }
      } catch {
        /* logging gagal: lanjut aja, chat ga boleh putus */
      }
    }

    // Mode human: admin yang pegang, AI berhenti jawab otomatis
    if (status === "human") {
      return NextResponse.json({ reply: "", ticket_no, status });
    }

    if (!apiKey) {
      return NextResponse.json({
        reply:
          "Maaf, asisten AI lagi belum aktif. Silakan klik tombol WhatsApp di atas untuk ngobrol langsung sama admin ya 🙏",
        ticket_no,
        status,
      });
    }

    if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") {
      return NextResponse.json({
        reply: "Halo! Ada yang bisa Ling bantu soal kelas bahasa di Linguo? 😊",
        ticket_no,
        status,
      });
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM,
        messages: msgs,
      }),
    });

    if (!r.ok) {
      return NextResponse.json({
        reply:
          "Maaf, Ling lagi ada gangguan. Coba klik tombol WhatsApp di atas untuk ngobrol sama admin ya 🙏",
        ticket_no,
        status,
      });
    }

    const data = (await r.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const reply = Array.isArray(data.content)
      ? data.content
          .filter((b) => b.type === "text")
          .map((b) => b.text || "")
          .join("\n")
          .trim()
      : "";

    const finalReply =
      reply ||
      "Maaf, Ling belum bisa jawab itu. Klik tombol WhatsApp di atas buat ngobrol sama admin ya 🙏";

    if (db && sessionId && reply) {
      try {
        await db
          .from("chat_messages")
          .insert({ session_id: sessionId, role: "assistant", content: finalReply });
      } catch {
        /* abaikan */
      }
    }

    return NextResponse.json({ reply: finalReply, ticket_no, status });
  } catch {
    return NextResponse.json({
      reply:
        "Maaf, lagi ada gangguan. Klik tombol WhatsApp di atas untuk ngobrol sama admin ya 🙏",
      ticket_no: null,
      status: "bot",
    });
  }
}
