/* [promo-lead-form-v1] Banner & sticker Promo Kemerdekaan tidak lagi langsung
 * melempar ke WhatsApp. Calon pembeli wajib isi nama + nomor WA + email dulu,
 * dan route ini yang menyimpannya sebelum tautan wa.me dibuka.
 *
 * Alasan email diwajibkan: produk yang dijual promo ini = Simulasi Tes, dan
 * akses simulasi/sertifikatnya dikirim ke email — CS tidak bisa menagih invoice
 * "prediction test" tanpa email (lihat catatan prediction-test-invoice-wa).
 *
 * Kerjanya persis /api/wa-quick-lead (lead + baris WA Inbox lewat service role),
 * hanya saja tanpa bahasa/program/pengalaman: pembeli simulasi belum tentu mau
 * ambil kelas, jadi jangan dipaksa memilih.
 */
import { NextRequest, NextResponse } from "next/server";
import { recordAdAttribution } from "@/lib/adAttributionServer";
import { PROMO, isPromoActive } from "@/lib/promoMerdeka";

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
    const { name, email, countryCode, waNumber, referral_source } = body || {};

    const missing: string[] = [];
    if (!name?.trim()) missing.push("nama");
    if (!waNumber?.trim()) missing.push("nomor WhatsApp");
    if (!email?.trim()) missing.push("email");
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

    // ads-conversion-sync — ikat identitas ke click ID iklan (non-fatal).
    recordAdAttribution(req, { email: cleanEmail, phone }, body?.attribution);

    // ── 1. Lead ──────────────────────────────────────────────────────────────
    const leadRes = await supaFetch("leads", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        wa_number: phone,
        program: "Simulasi Tes",
        source: `promo-${PROMO.slug}`,
        referral_source: referral_source || null,
      }),
    });
    if (!leadRes.ok) {
      const detail = await leadRes.text();
      return NextResponse.json({ error: "Gagal menyimpan data", detail }, { status: 500 });
    }

    // ── 2. Baris WA Inbox ────────────────────────────────────────────────────
    // Gagal di sini TIDAK fatal: lead-nya sudah aman dan calon pembeli tetap
    // boleh lanjut ke WhatsApp.
    const notes = [
      `Klaim ${PROMO.badge} — Simulasi TOEFL Rp ${PROMO.price.toLocaleString("id-ID")}`,
      `Nama: ${cleanName}`,
      `Email: ${cleanEmail}`,
      isPromoActive() ? "Periode promo: BUKA" : "Diklik di luar periode promo",
    ].join(" · ");

    /* wa-inbox-one-row-per-phone-v1 — SATU nomor = SATU baris. Isi baris yang
       sudah ada, jangan bikin baris kedua (bot bisa lebih dulu membuatnya). */
    const fillBlanks = async (): Promise<boolean> => {
      const existRes = await supaFetch(
        `whatsapp_inbox_logs?phone=eq.${encodeURIComponent(phone)}&select=id,product,contact_name&limit=1`
      );
      if (!existRes.ok) return false;
      const existing = await existRes.json();
      if (!Array.isArray(existing) || existing.length === 0) return false;
      const row = existing[0];
      const patch: Record<string, string> = {};
      if (!row.contact_name) patch.contact_name = cleanName;
      if (!row.product) { patch.product = "simulasi"; patch.product_source = "admin"; }
      if (Object.keys(patch).length === 0) return true;
      const patchRes = await supaFetch(`whatsapp_inbox_logs?id=eq.${row.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      return patchRes.ok;
    };

    let inboxOk = false;
    try {
      inboxOk = await fillBlanks();
      if (!inboxOk) {
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
            product: "simulasi",
            product_source: "admin",
          }),
        });
        if (insRes.ok) {
          inboxOk = true;
        } else if (insRes.status === 409) {
          // Kalah balapan — barisnya barusan dibuat pihak lain (bot).
          inboxOk = await fillBlanks();
        } else {
          console.error("WA inbox log gagal:", await insRes.text());
        }
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
