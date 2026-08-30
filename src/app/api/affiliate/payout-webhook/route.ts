// src/app/api/affiliate/payout-webhook/route.ts
// [linguo-patch:afiliator-payout-webhook-v1]
// [linguo-patch:pencairan-pengajar-v1] — sekarang MELAYANI DUA JENIS PAYOUT.
//
// Terima callback Xendit Payouts. Xendit cuma kasih SATU URL webhook payout per
// akun, jadi callback afiliator DAN pengajar mendarat di sini. Pemilahnya
// reference_id:
//   "TCH-<uuid>" -> fee pengajar  -> teacher_payouts (+ WA otomatis)
//   "<uuid>"     -> komisi afiliator -> complete/fail_affiliate_payout (perilaku lama)
//
// PENTING: daftarin URL ini + callback token di dashboard Xendit pada bagian
// webhook PAYOUTS (beda dari webhook Invoice).
//   URL: https://linguo.id/api/affiliate/payout-webhook

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TEACHER_PREFIX = 'TCH-';
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const rupiah = (n: number) => 'Rp' + Math.round(Number(n) || 0).toLocaleString('id-ID');

// Email pengajar sekarang dikirim RESMI oleh Xendit (receipt_notification.email_to
// di edge fn teacher-payout-disburse). Email Resend kita sudah dilepas biar tidak
// dobel — di sini tinggal notifikasi WA dari bot (nomor kurikulum).

/** 08xx / 8xx / +62xx → 62xx (format yang dipakai bot WA). */
function normalizePhone(raw: string | null | undefined): string | null {
  const d = String(raw || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('62')) return d;
  if (d.startsWith('0')) return '62' + d.slice(1);
  if (d.startsWith('8')) return '62' + d;
  return d;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN as string;

export async function POST(req: Request) {
  try {
    // 1. validasi callback token (header x-callback-token)
    const token = req.headers.get('x-callback-token') || '';
    if (!WEBHOOK_TOKEN || token !== WEBHOOK_TOKEN) {
      return NextResponse.json({ error: 'Invalid callback token' }, { status: 401 });
    }

    const body: any = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Body kosong' }, { status: 400 });
    }

    // payload v2 biasanya { event, data: {...} }; tetap defensif kalau flat
    const data = body.data || body;
    const referenceId = data.reference_id || body.reference_id;
    const statusRaw = String(data.status || body.status || '').toUpperCase();
    const event = String(body.event || '').toLowerCase();
    const xenditId = data.id || body.id || null;

    if (!referenceId) {
      return NextResponse.json({ error: 'reference_id tidak ada' }, { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const isSuccess =
      statusRaw === 'SUCCEEDED' || statusRaw === 'COMPLETED' || event === 'payout.succeeded';
    const isFailed =
      statusRaw === 'FAILED' ||
      statusRaw === 'REJECTED_BY_CHANNEL' ||
      statusRaw === 'REFUNDED' ||
      event === 'payout.failed';

    // ── Fee pengajar (prefix TCH-) — jalur terpisah dari afiliator ──────
    if (String(referenceId).startsWith(TEACHER_PREFIX)) {
      const payoutId = String(referenceId).slice(TEACHER_PREFIX.length);
      if (isSuccess) await completeTeacherPayout(admin, payoutId, xenditId, data);
      else if (isFailed) {
        const reason = data.failure_code || data.failure_reason || 'Xendit melaporkan pencairan gagal';
        await failTeacherPayout(admin, payoutId, String(reason));
      }
      return NextResponse.json({ ok: true });
    }

    if (isSuccess) {
      const { error } = await admin.rpc('complete_affiliate_payout', {
        p_payout_id: referenceId,
        p_provider_ref: xenditId,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (isFailed) {
      const reason = data.failure_code || data.failure_reason || 'Xendit melaporkan pencairan gagal';
      const { error } = await admin.rpc('fail_affiliate_payout', {
        p_payout_id: referenceId,
        p_reason: String(reason),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // status lain (mis. ACCEPTED) -> diabaikan, balikin 200 biar Xendit ga retry

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Fee pengajar — [linguo-patch:pencairan-pengajar-v1]
// ═══════════════════════════════════════════════════════════════════════

/** Payout pengajar SUKSES → tandai transferred, kabari pengajar via WA, tutup batch. */
async function completeTeacherPayout(admin: any, payoutId: string, xenditId: string | null, data: any) {
  const { data: payout } = await admin
    .from('teacher_payouts')
    .select('*, teachers(id, name, whatsapp, email)')
    .eq('id', payoutId)
    .maybeSingle();
  if (!payout) return;
  // sudah pernah diproses (Xendit suka kirim callback dobel) → berhenti,
  // jangan sampai pengajar dapat notifikasi WA/email dua kali.
  if (payout.status === 'transferred') return;

  const now = new Date().toISOString();
  await admin.from('teacher_payouts').update({
    status: 'transferred',
    paid_at: now,
    transferred_at: now,
    provider_ref: xenditId || payout.provider_ref,
    failure_reason: null,
    // biaya transfer ditanggung Linguo — dicatat, tidak memotong fee pengajar
    fee_amount: Number(data?.fee?.amount ?? payout.fee_amount ?? 0) || 0,
  }).eq('id', payoutId);

  // rincian per sesi dipakai bareng oleh notifikasi WA dan email
  const { data: items } = await admin
    .from('teacher_payout_items')
    .select('schedule_id, session_date, student_name, language, level, duration_minutes, amount, note, sessions_count')
    .eq('payout_id', payout.id)
    .is('released_at', null)
    .order('session_date', { ascending: true });

  // Data "struk" — bikin notifikasi terasa seperti bukti transfer Flip: nomor
  // referensi (bisa ditelusuri ke Xendit) + waktu transfer WIB.
  const ref = xenditId || payout.provider_ref || null;
  const paidAtLabel = new Date(now).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  }).replace(/\./g, ':') + ' WIB';

  // Notifikasi best-effort — kegagalan TIDAK boleh membatalkan status transfer
  // (uangnya sudah keluar).
  // WA: dari bot kita (nomor kurikulum). EMAIL: sekarang dikirim RESMI oleh Xendit
  // via receipt_notification.email_to (di edge fn teacher-payout-disburse), jadi
  // email Resend kita DIMATIKAN biar pengajar tidak dapat email dobel.
  await notifyTeacher(admin, payout, items || [], ref, paidAtLabel);
  // await emailTeacher(payout, items || [], ref, paidAtLabel); // digantikan email resmi Xendit
  await closeBatchIfSettled(admin, payout.batch_id);
}

/** Payout pengajar GAGAL → tandai failed + lepas sesinya biar bisa ditarik ulang. */
async function failTeacherPayout(admin: any, payoutId: string, reason: string) {
  const { data: payout } = await admin
    .from('teacher_payouts').select('batch_id, status').eq('id', payoutId).maybeSingle();
  if (!payout || payout.status === 'transferred') return; // jangan timpa yang sudah sukses

  await admin.from('teacher_payouts').update({
    status: 'failed', failure_reason: reason,
  }).eq('id', payoutId);
  await admin.from('teacher_payout_items').update({
    released_at: new Date().toISOString(),
  }).eq('payout_id', payoutId).is('released_at', null);

  await closeBatchIfSettled(admin, payout.batch_id);
}

/** Batch dianggap selesai kalau tak ada lagi baris yang menggantung. */
async function closeBatchIfSettled(admin: any, batchId: string | null) {
  if (!batchId) return;
  const { count } = await admin
    .from('teacher_payouts')
    .select('id', { count: 'exact', head: true })
    .eq('batch_id', batchId)
    .in('status', ['processing', 'approved', 'draft']);
  if ((count ?? 0) === 0) {
    await admin.from('teacher_payout_batches').update({ status: 'done' }).eq('id', batchId);
  }
}

/**
 * Cari sesi pengirim WA "kurikulum" (nomor yang ngurus pengajar, mis. Riny) dari
 * tabel wa_senders. Fee pengajar HARUS dikirim dari nomor ini — BUKAN nomor bot
 * CS (nomor yang dipakai siswa) — biar pengajar nerima info fee dari nomor tim
 * kurikulum, konsisten dengan chat pengajar lainnya. Balikin id sesi (mis.
 * 'riny') atau null kalau tak ada yang connected → fallback ke bot CS.
 */
async function resolveKurikulumSender(admin: any): Promise<string | null> {
  const { data } = await admin
    .from('wa_senders')
    .select('id, label, allowed_roles, status')
    .contains('allowed_roles', ['curriculum'])
    .eq('status', 'connected');
  const list = (data || []) as any[];
  if (!list.length) return null;
  // allowed_roles saja tidak cukup: nomor 'kelas' (khusus grup kelas) juga
  // memegang role curriculum dan urutan baris PostgREST tidak dijamin. Urutan
  // pilih = label "kurikulum" (nomor koordinator) → nomor personal lain → kelas.
  // Cermin resolveKurikulumSender di edge fn teacher-fee-notify (linguo-app).
  const skor = (s: any) => {
    if (/kurikulum/i.test(String(s.label || ''))) return 2;
    if (String(s.id) === 'kelas') return 0;
    return 1;
  };
  return list.slice().sort((a, b) => skor(b) - skor(a))[0]?.id || null;
}

/**
 * Kabari pengajar lewat bot WA (antrian wa_outbound). Dikirim dari nomor
 * KURIKULUM (Riny), bukan nomor bot CS — lihat resolveKurikulumSender.
 * Ini pengganti pesan manual + link Google Sheet yang selama ini dikirim tangan.
 */
/* [fee-wa-rincian-per-kelas-v1] Rincian dikelompokkan PER KELAS, bukan per sesi.
   Struk 28 sesi jadi 28 baris tanggal — panjang, harus di-scroll, dan justru
   menyembunyikan yang mau dicek pengajar: "kelas ini berapa sesi, tarifnya berapa".
   Satu kelas = satu baris. Kuncinya siswa+bahasa+level+durasi, jadi siswa yang naik
   level di tengah bulan tetap dapat dua baris (memang dua kelas).
   Cermin `kelompokkanKelas` di edge fn teacher-fee-notify (repo linguo-app). */
type KelasRingkas = {
  siswa: string; bahasa: string | null; level: string | null;
  durasi: number | null; sesi: number; total: number;
  perSesi: number | null; campur: boolean;
};

function kelompokkanKelas(items: any[], meta: Map<string, any>): KelasRingkas[] {
  const map = new Map<string, KelasRingkas>();
  for (const it of items) {
    // Registrasi (lewat schedule) lebih dipercaya daripada kolom teks di rincian:
    // baris impor lama sering menaruh bahasa di dalam nama siswa & level kosong.
    const m = (it.schedule_id && meta.get(it.schedule_id)) || {};
    const siswa = String(m.siswa || it.student_name || it.note || 'Sesi').trim();
    const bahasa = m.bahasa || it.language || null;
    const level = m.level || it.level || null;
    const durasi = Number(it.duration_minutes) || Number(m.durasi) || null;
    const sesi = Math.max(1, Number(it.sessions_count) || 1);
    const total = Number(it.amount) || 0;
    const per = total / sesi;

    const key = [siswa.toLowerCase(), bahasa || '', level || '', durasi ?? ''].join('|');
    const cur = map.get(key);
    if (!cur) {
      map.set(key, { siswa, bahasa, level, durasi, sesi, total, perSesi: per, campur: false });
      continue;
    }
    // Tarif per sesi beda di dalam satu kelas (mis. sesi pengganti) → "× n" tidak
    // ditulis, cukup totalnya, biar angkanya tidak bohong.
    if (cur.perSesi === null || Math.abs(cur.perSesi - per) > 1) cur.campur = true;
    cur.sesi += sesi;
    cur.total += total;
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function barisKelas(g: KelasRingkas): string {
  const judul = [g.siswa, g.bahasa, g.level].filter(Boolean).join(' · ');
  const durasi = g.durasi ? ` (${g.durasi}m)` : '';
  const hitung = !g.campur && g.sesi > 1 && g.perSesi
    ? `${rupiah(g.perSesi)} × ${g.sesi} = `
    : '';
  return `• ${judul} · ${g.sesi} sesi${durasi} — ${hitung}${rupiah(g.total)}`;
}

/** Bahasa & level kelas diambil dari REGISTRASI lewat schedule — kolom teks di
    `teacher_payout_items` sering kosong (level) atau kotor (bahasa menempel di nama
    siswa). Satu query untuk semua sesi; gagal/kosong cukup jatuh ke kolom item. */
async function metaKelas(admin: any, items: any[]): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  const ids = [...new Set(items.map((it: any) => it.schedule_id).filter(Boolean))];
  if (!ids.length) return map;
  const { data } = await admin
    .from('schedules')
    .select('id, registrations(language, level, duration, students(name))')
    .in('id', ids);
  for (const row of (data || []) as any[]) {
    const r = row.registrations;
    if (!r) continue;
    map.set(row.id, {
      siswa: r.students?.name || null,
      bahasa: r.language || null,
      level: r.level || null,
      durasi: Number(r.duration) || null,
    });
  }
  return map;
}

async function notifyTeacher(admin: any, payout: any, items: any[], ref?: string | null, paidAtLabel?: string) {
  const phone = normalizePhone(payout.teachers?.whatsapp);
  if (!phone) return; // pengajar belum punya nomor — dilewati diam-diam

  const periode = `${MONTHS[(payout.month || 1) - 1]} ${payout.year}`;
  const nama = String(payout.teachers?.name || '').split(' ')[0] || 'Kak';
  const list = items || [];
  const MAX = 12;

  const kelas = kelompokkanKelas(list, await metaKelas(admin, list));
  const rincian = kelas.slice(0, MAX).map(barisKelas);
  if (kelas.length > MAX) rincian.push(`• …dan ${kelas.length - MAX} kelas lainnya`);

  const adj = Number(payout.adjustment_amount) || 0;
  const bank = payout.bank_name || payout.bank_code || 'rekening terdaftar';
  const last4 = String(payout.account_number || '').slice(-4);

  const body = [
    `Halo Kak ${nama} 👋`,
    ``,
    `Fee mengajar periode *${periode}* sudah kami transfer ya.`,
    ``,
    `Jumlah sesi: ${payout.sessions_completed || 0}`,
    `Fee sesi: ${rupiah(payout.total_fee)}`,
    ...(adj ? [`${adj > 0 ? 'Tambahan' : 'Penyesuaian'}: ${rupiah(adj)}${payout.adjustment_note ? ` (${payout.adjustment_note})` : ''}`] : []),
    `*Total ditransfer: ${rupiah(payout.netto)}*`,
    ``,
    `Ke ${bank}${last4 ? ` ···${last4}` : ''} a.n. ${payout.account_holder || '-'}`,
    `Status: Berhasil ✅`,
    ...(paidAtLabel ? [`Waktu: ${paidAtLabel}`] : []),
    ...(ref ? [`No. referensi: ${ref}`] : []),
    ...(rincian.length ? ['', 'Rincian:', ...rincian] : []),
    ``,
    `Kalau ada yang kurang pas, kabari admin ya. Terima kasih sudah mengajar bareng Linguo 🙏`,
  ].join('\n');

  // Kirim dari nomor kurikulum (Riny) — bukan bot CS. sender=null → bot CS (nomor
  // siswa); itu yang bikin fee pengajar salah keluar dari nomor siswa.
  const sender = await resolveKurikulumSender(admin);

  // gagal antre WA TIDAK boleh membatalkan status transfer — uangnya sudah keluar
  const { error } = await admin.from('wa_outbound').insert({ phone, body, sender });
  if (error) { console.error('[teacher-payout] gagal antre WA:', error.message); return; }

  // [fee-transfer-notify-wa-v1] Stempel jejak notifikasi. Jalur MANUAL (Tandai
  // transfer manual / rekonsiliasi di /pencairan-pengajar) memakai edge fn
  // teacher-fee-notify yang membaca kolom ini sebagai anti kirim dobel — tanpa
  // stempel di sini, tombol "kirim notifikasi yang belum terkirim" akan
  // mengabari ulang pengajar yang sudah dapat WA dari jalur Xendit.
  await admin.from('teacher_payouts').update({
    notified_status: 'done', notified_at: new Date().toISOString(),
  }).eq('id', payout.id);
}
