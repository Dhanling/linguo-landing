// linguo-patch:chat-widget-ai-wa-v1
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5";

// ====== OTAK CHATBOT — boleh diedit kapan aja ======
const SYSTEM = `Kamu adalah "Ling", asisten virtual resmi Linguo.id — kursus bahasa online nomor 1 di Indonesia (sejak 2020, PT Linguo Edu Indonesia).

GAYA:
- Ramah, hangat, ringkas (2-4 kalimat). Pakai bahasa yang dipakai user (Indonesia/Inggris/dll). Boleh emoji secukupnya.
- Jangan bertele-tele. Jawab to the point lalu tawarkan langkah lanjut.

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

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply:
          "Maaf, asisten AI lagi belum aktif. Silakan klik tombol WhatsApp di atas untuk ngobrol langsung sama admin ya 🙏",
      });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const rawList = Array.isArray((body as { messages?: unknown }).messages)
      ? ((body as { messages: unknown[] }).messages as unknown[])
      : [];

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

    if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") {
      return NextResponse.json({
        reply: "Halo! Ada yang bisa Ling bantu soal kelas bahasa di Linguo? 😊",
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

    return NextResponse.json({
      reply:
        reply ||
        "Maaf, Ling belum bisa jawab itu. Klik tombol WhatsApp di atas buat ngobrol sama admin ya 🙏",
    });
  } catch {
    return NextResponse.json({
      reply:
        "Maaf, lagi ada gangguan. Klik tombol WhatsApp di atas untuk ngobrol sama admin ya 🙏",
    });
  }
}
