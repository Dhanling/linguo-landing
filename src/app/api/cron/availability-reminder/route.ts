// ============================================================================
// API: /api/cron/availability-reminder  [availability-masih-sama-v1]
// Pengingat bulanan Availability pengajar lewat WA nomor Kurikulum (sender 'riny').
// ----------------------------------------------------------------------------
// Pencocokan jadwal di form pendataan (lib/cocokJadwal) hanya menghitung pengajar yang
// Availability-nya disentuh ≤ 30 hari. Supaya pola mingguan yang masih benar tidak ikut
// basi, pengajar yang Availability-nya berumur ≥ 25 hari (sampai 90 hari — sesudah itu
// dianggap sudah tidak menanggapi) dikirimi daftar jamnya + link sekali ketuk
// "Ya, masih sama" (/availability/masih-sama) dan link ubah di dashboard pengajar.
//
// Paling sering sekali per 6 hari per nomor (dicek dari wa_outbound yang memuat link
// /availability/masih-sama). Pengajar yang belum pernah mengisi Availability TIDAK
// dikirimi di sini — itu urusan blast sekali jalan, bukan pengingat.
// Teks polos tanpa *tebal* dan tanpa perkenalan diri (aturan pesan otomatis Kurikulum).
//
// Dijalankan Vercel Cron 02:00 UTC = 09:00 WIB (vercel.json). Pesan diantre bertahap
// 20 detik sekali lewat scheduled_at supaya nomor Kurikulum tidak mengirim beruntun.
//
// PARAMETER (butuh `Authorization: Bearer $CRON_SECRET` atau kunci service role):
//   ?dry=1   → kembalikan daftar penerima + isi pesan, TIDAK mengantre WA
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AVAIL_SEGAR_HARI, linkMasihSama, ringkasAvailability } from "@/lib/availabilityLink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || "";
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://linguo.id").replace(/\/+$/, "");
const SENDER = "riny";
const HARI_MS = 86_400_000;
const MULAI_INGATKAN_HARI = 25;
const BERHENTI_HARI = 90;
const JEDA_ULANG_HARI = 6;
const JEDA_KIRIM_MS = 20_000;
const LINK_DASHBOARD = "https://teach.linguo.id/?buka=availability";

type Slot = { teacher_id: string; day_of_week: number; time_slot: string; created_at: string };

function normalizePhone(raw: string | null | undefined): string | null {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length < 9) return null;
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  if (d.startsWith("8")) return "62" + d;
  return d;
}

function tglIndo(ms: number) {
  return new Date(ms).toLocaleDateString("id-ID", { day: "numeric", month: "long", timeZone: "Asia/Jakarta" });
}

function tglEn(ms: number) {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Asia/Jakarta" });
}

// Pengajar native (teachers.origin = 'Native') selalu dikirimi bahasa Inggris.
function susunPesanEn(nama: string, berlakuSampai: number, jam: string[], link: string) {
  const status =
    berlakuSampai >= Date.now()
      ? `will expire on ${tglEn(berlakuSampai)}`
      : `expired on ${tglEn(berlakuSampai)}`;
  return [
    `Hi ${nama} 👋`,
    "",
    `Your Availability (teaching hours) at Linguo ${status}. We use these hours to match new students with teachers, so once they expire you aren't included when a new student signs up.`,
    "",
    "Your saved hours (WIB, Jakarta time, GMT+7):",
    ...jam,
    "",
    "If they're still the same, just open this link and tap the confirm button:",
    link,
    "",
    "If anything has changed, update it in the teacher dashboard:",
    LINK_DASHBOARD,
    "",
    "Thank you 🙏",
  ].join("\n");
}

function susunPesan(nama: string, berlakuSampai: number, jam: string[], link: string) {
  const status =
    berlakuSampai >= Date.now()
      ? `akan habis masa berlakunya tanggal ${tglIndo(berlakuSampai)}`
      : `sudah lewat masa berlakunya sejak ${tglIndo(berlakuSampai)}`;
  return [
    `Halo Kak ${nama} 👋`,
    "",
    `Jam tersedia Kakak di Linguo ${status}. Jam ini kami pakai untuk mencocokkan siswa baru dengan pengajar, jadi kalau sudah lewat, Kakak belum ikut dihitung saat ada siswa baru.`,
    "",
    "Jam yang tercatat (WIB):",
    ...jam,
    "",
    "Kalau masih sama, cukup buka link ini lalu ketuk \"Ya, masih sama\":",
    link,
    "",
    "Kalau ada yang berubah, ubah di dashboard pengajar:",
    LINK_DASHBOARD,
    "",
    "Terima kasih Kak 🙏",
  ].join("\n");
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const sah = [CRON_SECRET, SERVICE_ROLE_KEY].filter(Boolean).map((k) => `Bearer ${k}`);
  if (!CRON_SECRET || !sah.includes(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Semua baris Availability — dipaginasi karena PostgREST memotong di 1000 baris.
  const slots: Slot[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("teacher_availability")
      .select("teacher_id, day_of_week, time_slot, created_at")
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    slots.push(...((data ?? []) as Slot[]));
    if (!data || data.length < 1000) break;
  }
  const perGuru = new Map<string, Slot[]>();
  for (const s of slots) {
    const arr = perGuru.get(s.teacher_id) ?? [];
    arr.push(s);
    perGuru.set(s.teacher_id, arr);
  }
  if (perGuru.size === 0) return NextResponse.json({ ok: true, antre: 0, kandidat: 0 });

  const sekarang = Date.now();
  const [{ data: guru, error: eGuru }, { data: sudah }] = await Promise.all([
    admin.from("teachers").select("id, name, nickname, whatsapp, status, origin").in("id", [...perGuru.keys()]),
    admin
      .from("wa_outbound")
      .select("phone")
      .eq("sender", SENDER)
      .ilike("body", "%/availability/masih-sama%")
      .gte("created_at", new Date(sekarang - JEDA_ULANG_HARI * HARI_MS).toISOString())
      .range(0, 9999),
  ]);
  if (eGuru) return NextResponse.json({ error: eGuru.message }, { status: 500 });
  const sudahDiingatkan = new Set((sudah ?? []).map((r) => r.phone));

  const antre: { phone: string; body: string; status: string; sender: string; scheduled_at: string }[] = [];
  const ringkasan: { nama: string; phone: string; umurHari: number }[] = [];
  for (const g of guru ?? []) {
    if (g.status !== "Aktif") continue;
    const phone = normalizePhone(g.whatsapp);
    if (!phone || sudahDiingatkan.has(phone)) continue;
    const rows = perGuru.get(g.id) ?? [];
    const terakhir = rows.reduce((m, r) => Math.max(m, Date.parse(r.created_at) || 0), 0);
    const umurHari = Math.floor((sekarang - terakhir) / HARI_MS);
    if (umurHari < MULAI_INGATKAN_HARI || umurHari >= BERHENTI_HARI) continue;

    const nama = (g.nickname || g.name || "").trim() || "Pengajar";
    const native = g.origin === "Native";
    const namaDepan = (g.nickname || "").trim() || nama.split(/\s+/)[0];
    const body = (native ? susunPesanEn : susunPesan)(native ? namaDepan : nama, terakhir + AVAIL_SEGAR_HARI * HARI_MS, ringkasAvailability(rows, native), linkMasihSama(BASE_URL, g.id));
    antre.push({
      phone,
      body,
      status: "pending",
      sender: SENDER,
      scheduled_at: new Date(sekarang + 5_000 + antre.length * JEDA_KIRIM_MS).toISOString(),
    });
    ringkasan.push({ nama, phone, umurHari });
  }

  if (dry) return NextResponse.json({ ok: true, dry: true, antre: antre.length, penerima: ringkasan, contoh: antre[0]?.body ?? null });
  if (antre.length > 0) {
    const { error } = await admin.from("wa_outbound").insert(antre);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, antre: antre.length, penerima: ringkasan });
}
