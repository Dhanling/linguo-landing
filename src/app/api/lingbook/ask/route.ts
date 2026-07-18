// [lingbook-phase2] API "Tanya AI" dari word card reader Lingbook.
// Tutor bahasa singkat berbahasa Indonesia. Pakai Anthropic (haiku) via raw
// fetch — pola sama seperti /api/chat. Konteks: kata + kalimat + bahasa + grammar.
import { NextResponse } from "next/server";

const MODEL = "claude-haiku-4-5";
const MAX_QUESTIONS = 5; // batasi per sesi word card

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    const body = (await req.json().catch(() => ({}))) as {
      word?: unknown;
      meaning?: unknown;
      pos?: unknown;
      sentence?: unknown;
      grammar?: unknown;
      langName?: unknown;
      messages?: unknown;
    };

    const str = (v: unknown, max: number) =>
      typeof v === "string" ? v.slice(0, max) : "";
    const word = str(body.word, 120);
    const meaning = str(body.meaning, 200);
    const pos = str(body.pos, 60);
    const sentence = str(body.sentence, 400);
    const grammar = str(body.grammar, 600);
    const langName = str(body.langName, 40) || "asing";

    const rawList = Array.isArray(body.messages) ? (body.messages as unknown[]) : [];
    const msgs: Msg[] = rawList
      .filter((m): m is Msg => {
        const x = m as { role?: unknown; content?: unknown };
        return (
          !!m &&
          (x.role === "user" || x.role === "assistant") &&
          typeof x.content === "string"
        );
      })
      .slice(-12)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 800) }));

    if (msgs.length === 0 || msgs[msgs.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "Pertanyaan kosong." },
        { status: 400 },
      );
    }

    // Batasi jumlah pertanyaan siswa per sesi kartu.
    const userCount = msgs.filter((m) => m.role === "user").length;
    if (userCount > MAX_QUESTIONS) {
      return NextResponse.json({
        reply:
          "Kamu sudah mencapai batas pertanyaan untuk kata ini. Buka kata lain atau lanjut belajar ya 🙂",
        limited: true,
      });
    }

    if (!apiKey) {
      return NextResponse.json({
        reply:
          "Maaf, asisten AI lagi belum aktif. Coba lagi nanti ya 🙏",
      });
    }

    const system =
      `Kamu tutor bahasa ${langName} di aplikasi belajar Linguo. Siswa sedang membaca ebook dan bertanya tentang sebuah kata. ` +
      `Konteks: kata "${word}" (arti: ${meaning}, kelas kata: ${pos})` +
      (sentence ? ` dalam kalimat: "${sentence}"` : "") +
      (grammar ? `. Info grammar: ${grammar}` : "") +
      `. Jawab dalam Bahasa Indonesia, ramah, ringkas (maksimal 120 kata), level pemula. ` +
      `Boleh pakai contoh kalimat pendek. Tulis teks polos tanpa markdown (tanpa asterisk/bold/heading) dan tanpa emoji.`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system,
        messages: msgs,
      }),
    });

    if (!r.ok) {
      return NextResponse.json({
        reply:
          "Maaf, AI sedang tidak bisa dihubungi. Coba lagi sebentar lagi ya.",
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
      reply: reply || "Maaf, aku belum bisa menjawab itu. Coba tanya dengan cara lain ya.",
    });
  } catch {
    return NextResponse.json(
      { reply: "Maaf, terjadi kesalahan. Coba lagi ya." },
      { status: 200 },
    );
  }
}
