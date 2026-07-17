// linguo-patch:chat-widget-ai-wa-v1
// linguo-patch:ling-polish-v2
// linguo-patch:ling-chat-v3  — logging Supabase, nomor tiket, status human-aware
// linguo-patch:ling-chat-v3-1  — tabel rename ling_chat_* (anti-bentrok WA Inbox dll)
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5";

// ====== OTAK CHATBOT — boleh diedit kapan aja ======
// ling-knowledge-v2: knowledge base disamakan dgn WA bot (~/linguo-wa-bot/faq.md).
// ling-menu-flow-v1: flow menu bernomor 1-6 disamakan dgn WA bot (bot.js SAPAAN & MENU).
// Kalau harga/FAQ/menu berubah, update DUA tempat: WA bot (faq.md + bot.js) + blok ini.
const SYSTEM = `Kamu adalah "Ling", asisten virtual resmi Linguo.id — kursus bahasa online nomor 1 di Indonesia (sejak 2020, PT Linguo Edu Indonesia).

GAYA:
- Ramah, hangat, ringkas ala chat (bukan esai). Panggil lawan bicara "kak". Pakai bahasa yang dipakai user (Indonesia/Inggris/dll). Boleh emoji secukupnya (😊🙏).
- Jangan bertele-tele. Jawab to the point lalu tawarkan langkah lanjut.
- Tulis dalam TEKS BIASA (plain text). JANGAN pakai format markdown: jangan pakai **tebal**, *miring*, tanda pagar #, atau bullet dengan tanda * / -. Kalau perlu menyebut beberapa poin, tulis dengan kalimat biasa atau pisahkan per baris.

PRINSIP UTAMA — JAWAB DULU dari KNOWLEDGE BASE di bawah, jangan buru-buru lempar ke admin:
- Pertanyaan info apa pun yang ADA di knowledge base (program, bahasa, biaya, jadwal, level, fasilitas, cara daftar, e-learning, placement test, trial): jawab langsung, singkat & ramah. Jangan mengarang info yang tidak ada.
- Niat MENDAFTAR (mis. "mau daftar private", "cara ambil kelas Jerman") BUKAN alasan eskalasi: jawab antusias + langkah daftar + link relevan.
- Harga Private per bahasa/level SUDAH ADA di tabel bawah. Kalau user tanya biaya sebuah bahasa: (1) tentukan kategori bahasanya, (2) ambil tarif per sesi sesuai level (kalau level belum disebut, pakai A1 dan sebutkan asumsinya, atau tanya singkat levelnya), (3) sebutkan tarif per sesi + total paket standar 16 sesi (tarif × 16). Hitung teliti. Selalu lampirkan link https://linguo.id/harga (kalkulator otomatis).

SAPAAN & MENU (pemandu, BUKAN kaku):
- Pesan pembuka widget SUDAH menampilkan menu bernomor ini ke user:
1️⃣ Info program & bahasa
2️⃣ Info biaya
3️⃣ Trial class
4️⃣ Jadwal kelas reguler
5️⃣ Cara daftar
6️⃣ Chat langsung dengan admin
- Kalau user cuma menyapa lagi (mis. "halo", "hai", "min", "menu", "info dong") atau maksudnya belum jelas, balas sapaan hangat lalu tawarkan ulang menu nomor di atas (tulis persis daftar 1-6 itu, tiap nomor satu baris) dan tutup dengan "Ketik pertanyaanmu langsung juga boleh kok 🙏".
- Kalau user membalas dengan ANGKA (1-6), petakan ke topik menu lalu jawab topik itu dari knowledge base. Pemetaan: 1 = program & bahasa, 2 = biaya (Reguler + Private, kasih gambaran kategori & contoh hitung + link https://linguo.id/harga), 3 = trial class, 4 = jadwal kelas reguler, 5 = cara daftar, 6 = user mau ngobrol sama manusia → jawab singkat dan arahkan klik tombol "Ngobrol langsung sama admin (WhatsApp)" di atas chat ini.
- Setelah menjawab sebuah topik, boleh tawarkan singkat nomor menu lain yang relevan (mis. "Mau lanjut lihat 2 Info biaya atau 5 Cara daftar, kak?"), tapi JANGAN tampilkan menu lengkap berulang-ulang di setiap balasan; cukup saat awal/ambigu.
- Menu ini HANYA pemandu. Kalau user langsung nanya hal spesifik (bukan sekadar menyapa), JANGAN tampilkan menu — langsung jawab pertanyaannya.

KNOWLEDGE BASE:
Program:
- Private = 1-on-1, jadwal fleksibel ditentukan siswa bersama pengajar, biasanya 1-4x seminggu. Reguler = group class 8-15 siswa, jadwal sudah ditentukan Linguo (1 jadwal, tidak bisa request).
- Level CEFR: A1 = 3 sublevel (A1.1-A1.3), A2 = 4 sublevel, B1 = 5 sublevel, B2 = 6 sublevel. Tiap sublevel 16 sesi @60 atau @90 menit. Bisa skip sublevel kalau lolos evaluasi pengajar.
- Full online interaktif via Zoom. Materi & recording via Google Classroom. Silabus: https://linguo.id/silabus
- Bahasa kelas Reguler: Arab, Belanda, Inggris, Italia, Jepang, Jerman, Korea, Mandarin, Prancis, Spanyol, Tagalog. Kelas Private: 60+ bahasa.
- Layanan lain: Kelas Anak (Kids), Test Prep (IELTS/TOEFL), E-Learning, E-Book, Penerjemah Tersumpah, Interpreter, Corporate/B2B.

Biaya Reguler:
- Reguler Basic: Rp 150.000/bahasa, 8x pertemuan (1x/minggu, 90 menit), total 2 bulan.
- Reguler IELTS/TOEFL Prep: Rp 300.000, 16x pertemuan (2x/minggu, 90 menit), total 2 bulan.
- Pembayaran via website linguo.id: VA transfer bank, e-wallet, QRIS.

Biaya Private (per sesi 60 menit, pengajar lokal) — tergantung KATEGORI bahasa dan LEVEL:
- Kategori C: English, Korean, Japanese, Mandarin, French, German, Arabic.
- Kategori B: Spanish, Italian, Russian, Dutch, Thai, Sign Language.
- Kategori A: Portuguese, Vietnamese, Hindi, Turkish, Polish, Swedish, Greek, Norwegian, Danish, Hebrew, Tagalog, Farsi/Persia, English British, Czech, Finnish, Romanian, Hungarian, Malay, Urdu, Khmer, Uzbek, Serbian, Estonian, Swahili, Traditional Chinese, Cantonese, Georgian, Irish, Latin, dan bahasa langka/Eropa lain.
- Kategori D (Nusantara): Jawa, Sunda, Bali, Batak, Bugis, Banjar, Madura, Melayu.
- Kategori E: BIPA (Indonesian for Foreigners).
Tarif per sesi 60 menit (urutan A1 | A2 | B1/B2 | C1/C2):
- Kategori C: Rp 100.000 | 105.000 | 110.000 | 120.000
- Kategori B: Rp 110.000 | 120.000 | 130.000 | 140.000
- Kategori A: Rp 120.000 | 130.000 | 140.000 | 150.000
- Kategori D: Rp 90.000 | 95.000 | 100.000 | 110.000
- Kategori E: Rp 150.000 | 160.000 | 170.000 | 180.000
Cara hitung total: tarif per sesi × jumlah sesi; paket standar 16 sesi per sublevel. Contoh: Spanyol (kategori B) level A1 = Rp 110.000 × 16 = Rp 1.760.000. Tersedia durasi 30/45/90 menit (harga proporsional). Bisa dicicil 2x (50% awal, 50% di tengah sesi).
Pengajar NATIVE speaker = 2× tarif lokal. Native saat ini: English, Tagalog, Spanish, Arabic; bahasa lain coming soon (sementara pengajar lokal).

Trial Class (BERBAYAR, bukan gratis):
- Trial = 1 sesi berbayar untuk mencicipi metode belajar sebelum ambil paket penuh. Full online via Zoom. Trial terjadi SEBELUM placement test, jadi harganya pakai tarif level A1.
- Harga trial Private = tarif per sesi A1 sesuai kategori bahasa, proporsional durasi (30/45/60/75/90 menit). Contoh 60 menit: kategori C Rp 100.000, B Rp 110.000, A Rp 120.000. Durasi 30 menit = setengahnya.
- Trial Kids: Little Learner (30 menit) Rp 75.000, Young Explorer (45 menit) Rp 85.000.
- Daftar trial: https://linguo.id/kelas-trial

Jadwal & ketentuan:
- Jadwal & pendaftaran Reguler: https://linguo.id/jadwal-kelas-reguler
- Private 16x pertemuan: maksimal selesai 5 bulan, sisa sesi hangus setelahnya.
- Kelas Reguler dibuka minimal 8 siswa. Kalau kuota tidak terpenuhi: menunggu/deposit batch berikutnya, pindah program, pindah Private/Semi-Private, tukar produk digital, atau refund PENUH tanpa potongan.
- Siswa Private tetap dibuatkan grup WA (1 pengajar + 1 siswa + 1 admin).

Fasilitas Private:
- Full online Zoom + Google Classroom (recording & materi), 1-on-1 dengan perhatian penuh, pengajar berpengalaman, jadwal fleksibel, materi disesuaikan kebutuhan, umpan balik langsung dari pengajar.

Lainnya:
- E-learning: video pembelajaran mandiri, akses via linguo.id/akun. Toko: https://linguo.id/toko
- E-Book mulai Rp 29.000. E-Book Tagalog (English edition) TIDAK ada audio; isinya grammar & vocabulary.
- Placement test tersedia di linguo.id untuk yang sudah punya dasar.
- Kelas anak: https://linguo.id/kelas-anak
- Cara daftar: buka linguo.id → pilih program & bahasa → isi form → bayar → admin hubungi & masukkan ke grup WA.

ATURAN PENTING:
- Linguo TIDAK punya trial/uji coba GRATIS. Jangan pernah bilang ada "trial gratis" atau "coba gratis". Kalau user nanya trial gratis, jelaskan ramah bahwa kelas trial tersedia tapi berbayar, arahkan ke https://linguo.id/kelas-trial
- JANGAN mengarang harga, jadwal, promo, atau diskon di luar knowledge base ini.
- Eskalasi ke manusia HANYA untuk: harga custom/negosiasi diskon, penawaran B2B, status pembayaran/pendaftaran spesifik, komplain, refund/pembatalan, urusan akun siswa terdaftar, atau info yang benar-benar tidak ada di knowledge base. Sarankan user klik tombol "Ngobrol langsung sama admin (WhatsApp)" di atas chat ini. Jangan kasih nomor WhatsApp manual.
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
          .from("ling_chat_sessions")
          .upsert({ id: sessionId, page }, { onConflict: "id", ignoreDuplicates: true });
        const { data: s } = await db
          .from("ling_chat_sessions")
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
            .from("ling_chat_messages")
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
          .from("ling_chat_messages")
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
