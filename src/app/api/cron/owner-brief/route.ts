// ============================================================================
// API: /api/cron/owner-brief  [owner-brief-v1]
// Brief Harian Owner — satu PDF ke grup WA "Owner Group Linguo" tiap pagi,
// dikirim LEWAT nomor owner (sesi bot `owner`, sama dengan asisten owner-qa).
// ----------------------------------------------------------------------------
// Isi PDF (src/lib/ownerBriefPdf.ts):
//   1. Laporan harian Linguo — data yang sama dengan email Laporan Harian,
//      diambil dari /api/cron/daily-report?format=json (bukan hitungan kedua).
//   2. Penutupan pasar: IHSG, S&P 500, Nasdaq, USD/IDR.
//   3. Berita pilihan — bisnis, startup, edutech, bahasa, AI, tech, saham
//      Indonesia, saham AS — yang dinilai AI 8/10 ke atas
//      (src/lib/ownerBriefNews.ts).
//
// Pengiriman: PDF diunggah ke bucket `wa-media`, lalu satu baris `wa_outbound`
// (sender 'owner', media_type 'document') — bot WA yang mengirimnya. Bot
// membuang antrean yang berumur > 1 jam, jadi kalau bot sedang mati saat cron
// jalan brief hari itu tidak terkirim; panggil ulang dengan ?force=1.
//
// Dijalankan Vercel Cron 00:10 UTC = 07:10 WIB (vercel.json), sesudah email.
//
// PARAMETER (semua butuh `Authorization: Bearer $CRON_SECRET` atau kunci service role):
//   ?dry=1            → kembalikan PDF-nya, TIDAK mengirim ke WA
//   ?dry=json         → kembalikan datanya (JSON), TIDAK mengirim ke WA
//   ?force=1          → kirim walau brief hari ini sudah pernah diantre
//   ?date=YYYY-MM-DD  → diteruskan ke daily-report (laporan = H-1 tanggal itu)
//
// ENV opsional: OWNER_BRIEF_GROUP_JID (bawaan: baris pertama owner_qa_groups),
// OWNER_BRIEF_MIN_SCORE (bawaan 8), OWNER_BRIEF_DEEPSEEK_MODEL.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ambilPasar, kumpulkanBerita, kunciJudul } from "@/lib/ownerBriefNews";
import { buildOwnerBriefPdf, type LaporanHarian } from "@/lib/ownerBriefPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || "";
const SENDER = "owner";
const BUCKET = "wa-media";
// Kunci judul yang sudah pernah dikirim (7 hari) — supaya berita kemarin tak
// muncul lagi. Disimpan sebagai berkas, tanpa tabel baru.
const RIWAYAT_PATH = "owner-brief/riwayat.json";

type Riwayat = Record<string, string[]>; // tanggal WIB → kunci judul

const wibDateStr = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10);
const rp = (n: number) => `Rp ${Math.round(n || 0).toLocaleString("id-ID")}`;

export async function GET(req: NextRequest) {
  // Vercel Cron membawa CRON_SECRET; kunci service role ikut diterima supaya
  // brief bisa dipicu manual / dari database (vault menyimpan kunci itu).
  const authHeader = req.headers.get("authorization") || "";
  const sah = [CRON_SECRET, SERVICE_ROLE_KEY].filter(Boolean).map((k) => `Bearer ${k}`);
  if (!CRON_SECRET || !sah.includes(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const q = req.nextUrl.searchParams;
    const dry = q.get("dry") || "";
    const force = q.get("force") === "1";
    const dateParam = /^\d{4}-\d{2}-\d{2}$/.test(q.get("date") || "") ? q.get("date")! : "";
    const ambang = Math.min(10, Math.max(1, Number(process.env.OWNER_BRIEF_MIN_SCORE) || 8));

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const now = Date.now();
    const hariIni = dateParam || wibDateStr(now);
    const namaBerkas = `Brief-Owner-Linguo-${hariIni}.pdf`;

    // ── Grup tujuan ──────────────────────────────────────────────────────
    let jid = process.env.OWNER_BRIEF_GROUP_JID || "";
    if (!jid) {
      const { data: g } = await admin.from("owner_qa_groups").select("jid").order("created_at").limit(1);
      jid = String(g?.[0]?.jid || "");
    }
    if (!dry && !jid.endsWith("@g.us")) {
      return NextResponse.json({ error: "Grup owner tidak ditemukan (owner_qa_groups kosong)" }, { status: 500 });
    }

    // ── Sudah pernah diantre hari ini? (cron bisa terpanggil dua kali) ───
    if (!dry && !force) {
      const { data: ada } = await admin
        .from("wa_outbound")
        .select("id, status")
        .eq("phone", jid)
        .eq("media_name", namaBerkas)
        .in("status", ["pending", "sent"])
        .limit(1);
      if (ada?.length) {
        return NextResponse.json({ ok: true, skipped: "sudah diantre hari ini", outbound: ada[0] });
      }
    }

    // ── Riwayat judul terkirim ───────────────────────────────────────────
    let riwayat: Riwayat = {};
    try {
      const { data: blob } = await admin.storage.from(BUCKET).download(RIWAYAT_PATH);
      if (blob) riwayat = JSON.parse(await blob.text()) as Riwayat;
    } catch {
      /* belum ada berkasnya = brief pertama */
    }
    const sudahDikirim = new Set<string>();
    for (const [tgl, kunci] of Object.entries(riwayat)) if (tgl !== hariIni) kunci.forEach((k) => sudahDikirim.add(k));

    // ── Laporan + pasar + berita, sekaligus ──────────────────────────────
    const [lap, pasar, berita] = await Promise.all([
      (async (): Promise<{ data: LaporanHarian | null; galat?: string }> => {
        try {
          const r = await fetch(
            `${req.nextUrl.origin}/api/cron/daily-report?format=json${dateParam ? `&date=${dateParam}` : ""}`,
            { headers: { authorization: `Bearer ${CRON_SECRET}` }, cache: "no-store", signal: AbortSignal.timeout(90_000) },
          );
          if (!r.ok) return { data: null, galat: `daily-report ${r.status}` };
          const j = (await r.json()) as { data?: LaporanHarian };
          return j.data ? { data: j.data } : { data: null, galat: "daily-report tanpa data" };
        } catch (e) {
          return { data: null, galat: String((e as Error).message).slice(0, 120) };
        }
      })(),
      ambilPasar().catch(() => []),
      kumpulkanBerita({ ambang, sudahDikirim, sekarang: now }),
    ]);

    const tanggalLabel = new Date(hariIni + "T12:00:00+07:00").toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
    });
    const brief = { tanggalLabel, laporan: lap.data, laporanGalat: lap.galat, pasar, berita, ambang };
    const nPilih = berita.reduce((s, t) => s + t.terpilih.length, 0);
    const nNilai = berita.reduce((s, t) => s + t.dinilai, 0);
    const ringkasan = {
      laporan: lap.data ? "ok" : `gagal: ${lap.galat}`,
      pasar: pasar.length,
      berita_dinilai: nNilai,
      berita_lolos: nPilih,
      per_topik: berita.map((t) => ({ topik: t.label, dinilai: t.dinilai, lolos: t.terpilih.length, galat: t.galat })),
    };

    if (dry === "json") return NextResponse.json({ ok: true, ringkasan, brief });

    const pdf = buildOwnerBriefPdf(brief, now);
    if (dry) {
      return new Response(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${namaBerkas}"`,
          "x-brief-summary": JSON.stringify(ringkasan).replace(/[^\x20-\x7E]/g, "?"),
        },
      });
    }

    // Laporan gagal DAN tak ada satu pun berita → tak ada yang layak dikirim.
    if (!lap.data && nPilih === 0) {
      return NextResponse.json({ error: "Brief kosong, tidak dikirim", ringkasan }, { status: 502 });
    }

    // ── Unggah + antre ke WA ─────────────────────────────────────────────
    const path = `${jid.replace(/[^0-9]/g, "")}/${now}-${Math.random().toString(36).slice(2, 10)}.pdf`;
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(pdf), { contentType: "application/pdf", upsert: false });
    if (upErr) {
      return NextResponse.json({ error: "Gagal mengunggah PDF", detail: upErr.message }, { status: 500 });
    }

    const L = lap.data;
    const caption = [
      `Brief harian ${tanggalLabel}`,
      L
        ? `Pemasukan kemarin ${rp(L.revYesterday)} (${L.trxKemarin.length} transaksi), ${L.namaBulan} berjalan ${rp(L.revMtd)}` +
          (L.target ? ` = ${Math.round((L.revMtd / L.target) * 100)}% target.` : ".")
        : "Laporan Linguo gagal dimuat, lihat email Laporan Harian.",
      L ? `${L.aksi.length} hal perlu ditindak` + (L.nSegera > 0 ? `, ${L.nSegera} harus segera.` : ".") : "",
      `${nPilih} berita pilihan (skor ${ambang}+) dari ${nNilai} yang dinilai.`,
    ]
      .filter(Boolean)
      .join("\n");

    const { data: out, error: outErr } = await admin
      .from("wa_outbound")
      .insert({
        phone: jid,
        body: caption,
        status: "pending",
        sender: SENDER,
        media_path: path,
        media_type: "document",
        media_mime: "application/pdf",
        media_name: namaBerkas,
      })
      .select("id")
      .single();
    if (outErr) {
      return NextResponse.json({ error: "Gagal mengantre ke WA", detail: outErr.message }, { status: 500 });
    }

    // ── Catat judul yang terkirim (simpan 7 hari) ────────────────────────
    riwayat[hariIni] = berita.flatMap((t) => t.terpilih.map((b) => kunciJudul(b.judul)));
    const batas = wibDateStr(now - 7 * 86400_000);
    for (const tgl of Object.keys(riwayat)) if (tgl < batas) delete riwayat[tgl];
    const { error: rwErr } = await admin.storage
      .from(BUCKET)
      .upload(RIWAYAT_PATH, Buffer.from(JSON.stringify(riwayat)), { contentType: "application/json", upsert: true });
    if (rwErr) console.error("[owner-brief] riwayat gagal disimpan:", rwErr.message);

    return NextResponse.json({ ok: true, outbound_id: out.id, grup: jid, berkas: namaBerkas, ringkasan });
  } catch (err) {
    console.error("[owner-brief] error:", err);
    return NextResponse.json({ error: "Internal server error", detail: String((err as Error)?.message || err) }, { status: 500 });
  }
}
