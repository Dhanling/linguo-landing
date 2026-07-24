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
    .select('*, teachers(id, name, whatsapp)')
    .eq('id', payoutId)
    .maybeSingle();
  if (!payout) return;
  // sudah pernah diproses (Xendit suka kirim callback dobel) → berhenti,
  // jangan sampai pengajar dapat notifikasi WA dua kali.
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

  await notifyTeacher(admin, payout);
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
 * Kabari pengajar lewat bot WA (antrian wa_outbound, dikirim nomor CS).
 * Ini pengganti pesan manual + link Google Sheet yang selama ini dikirim tangan.
 */
async function notifyTeacher(admin: any, payout: any) {
  const phone = normalizePhone(payout.teachers?.whatsapp);
  if (!phone) return; // pengajar belum punya nomor — dilewati diam-diam

  const { data: items } = await admin
    .from('teacher_payout_items')
    .select('session_date, student_name, duration_minutes, amount, note')
    .eq('payout_id', payout.id)
    .is('released_at', null)
    .order('session_date', { ascending: true });

  const periode = `${MONTHS[(payout.month || 1) - 1]} ${payout.year}`;
  const nama = String(payout.teachers?.name || '').split(' ')[0] || 'Kak';
  const list = items || [];
  const MAX = 15;

  const rincian = list.slice(0, MAX).map((it: any) => {
    const tgl = it.session_date
      ? new Date(it.session_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
      : '-';
    const label = it.student_name || it.note || 'Sesi';
    const durasi = it.duration_minutes ? ` (${it.duration_minutes}m)` : '';
    return `• ${tgl} · ${label}${durasi} — ${rupiah(it.amount)}`;
  });
  if (list.length > MAX) rincian.push(`• …dan ${list.length - MAX} sesi lainnya`);

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
    ...(rincian.length ? ['', 'Rincian:', ...rincian] : []),
    ``,
    `Kalau ada yang kurang pas, kabari admin ya. Terima kasih sudah mengajar bareng Linguo 🙏`,
  ].join('\n');

  // gagal antre WA TIDAK boleh membatalkan status transfer — uangnya sudah keluar
  const { error } = await admin.from('wa_outbound').insert({ phone, body });
  if (error) console.error('[teacher-payout] gagal antre WA:', error.message);
}
