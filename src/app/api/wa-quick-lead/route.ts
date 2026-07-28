/* wa-quick-detail-form-v1 — form "Dapatkan Diskon" di hero sekarang wajib isi
 * nama, email, bahasa, pengalaman belajar, dan program. Route ini:
 *   1. simpan lead (source "wa-quick") lengkap dgn detail itu, lalu
 *   2. bikin/lengkapi baris di whatsapp_inbox_logs supaya nomornya LANGSUNG
 *      nongol di WA Inbox admin — tanpa nunggu calon siswa ngirim chat duluan
 *      (lihat catatan "WA Inbox outbound-first": lead cuma lahir dari pesan MASUK).
 * Insert whatsapp_inbox_logs harus lewat server (service role) karena RLS tabel
 * itu nggak ngizinin anon nulis.
 */
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function supaFetch(path: string, options?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      ...(options?.headers || {}),
    },
  });
}

// Program di landing → enum product WA Inbox (lihat WAProduct di dashboard).
const PRODUCT_BY_PROGRAM: Record<string, string> = {
  "Kelas Private": "private",
  "Semi Private": "semi_private",
  "Kelas Reguler": "reguler",
  "Kelas Kids": "kids",
  "IELTS/TOEFL Prep": "test_prep",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Nomor disimpan sebagai digit polos berformat internasional (mis. 62812...).
   Khusus +62: awalan 0 dibuang biar nggak jadi "620812...". */
function normalizeWa(countryCode: string, raw: string): string | null {
  const cc = (countryCode || "+62").replace(/[^0-9]/g, "");
  let n = (raw || "").replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = n.slice(1);
  if (!n) return null;
  const full = n.startsWith(cc) ? n : cc + n;
  if (full.length < 9 || full.length > 16) return null;
  return full;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, email, language, program, experience,
      countryCode, waNumber, referral_source,
    } = body || {};

    // Semua wajib — form hero nggak boleh lolos setengah-setengah.
    const missing: string[] = [];
    if (!name?.trim()) missing.push("nama");
    if (!email?.trim()) missing.push("email");
    if (!language?.trim()) missing.push("bahasa");
    if (!program?.trim()) missing.push("program");
    if (!experience?.trim()) missing.push("pengalaman");
    if (!waNumber?.trim()) missing.push("nomor WhatsApp");
    if (missing.length > 0) {
      return NextResponse.json({ error: `Lengkapi dulu: ${missing.join(", ")}` }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: "Format email belum benar" }, { status: 400 });
    }

    const phone = normalizeWa(countryCode, waNumber);
    if (!phone) {
      return NextResponse.json({ error: "Nomor WhatsApp tidak valid" }, { status: 400 });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanLang = String(language).trim();
    const cleanProgram = String(program).trim();
    const cleanExp = String(experience).trim();

    // ── 1. Lead ──────────────────────────────────────────────────────────────
    const leadRes = await supaFetch("leads", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        wa_number: phone,
        language: cleanLang,
        program: cleanProgram,
        experience: cleanExp,
        source: "wa-quick",
        referral_source: referral_source || null,
      }),
    });
    if (!leadRes.ok) {
      const detail = await leadRes.text();
      return NextResponse.json({ error: "Gagal menyimpan data", detail }, { status: 500 });
    }

    // ── 2. Baris WA Inbox ────────────────────────────────────────────────────
    // Gagal di tahap ini TIDAK dianggap fatal: lead-nya udah aman, calon siswa
    // tetap boleh lanjut ke WhatsApp.
    const product = PRODUCT_BY_PROGRAM[cleanProgram] || null;
    const notes = [
      "Dari form diskon landing (WA Quick)",
      `Nama: ${cleanName}`,
      `Email: ${cleanEmail}`,
      `Bahasa: ${cleanLang}`,
      `Program: ${cleanProgram}`,
      `Pengalaman: ${cleanExp}`,
    ].join(" · ");

    let inboxOk = false;
    try {
      const existRes = await supaFetch(
        `whatsapp_inbox_logs?phone=eq.${encodeURIComponent(phone)}&select=id,language,product,contact_name&limit=1`
      );
      const existing = existRes.ok ? await existRes.json() : [];

      if (Array.isArray(existing) && existing.length > 0) {
        // Row udah ada (mis. pernah chat) → isi HANYA kolom yang masih kosong
        // biar data yang udah disetel admin/bot nggak ketimpa.
        const row = existing[0];
        const patch: Record<string, string> = {};
        if (!row.contact_name) patch.contact_name = cleanName;
        if (!row.language && cleanLang) { patch.language = cleanLang; patch.language_source = "admin"; }
        if (!row.product && product) { patch.product = product; patch.product_source = "admin"; }
        if (Object.keys(patch).length > 0) {
          const patchRes = await supaFetch(`whatsapp_inbox_logs?id=eq.${row.id}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
          });
          inboxOk = patchRes.ok;
        } else {
          inboxOk = true;
        }
      } else {
        const insRes = await supaFetch("whatsapp_inbox_logs", {
          method: "POST",
          body: JSON.stringify({
            logged_at: new Date().toISOString(),
            phone,
            contact_name: cleanName,
            inquiry_type: "daftar_baru",
            source: "Website",
            status: "open",
            notes,
            language: cleanLang || null,
            language_source: cleanLang ? "admin" : null,
            product,
            product_source: product ? "admin" : null,
          }),
        });
        inboxOk = insRes.ok;
        if (!insRes.ok) console.error("WA inbox log gagal:", await insRes.text());
      }
    } catch (e) {
      console.error("WA inbox log error:", e);
    }

    return NextResponse.json({ ok: true, phone, inbox: inboxOk });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 });
  }
}
