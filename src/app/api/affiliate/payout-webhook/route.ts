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
import { Resend } from 'resend';

const TEACHER_PREFIX = 'TCH-';
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const rupiah = (n: number) => 'Rp' + Math.round(Number(n) || 0).toLocaleString('id-ID');

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
// Domain HARUS terverifikasi di Resend (sama seperti email lain dari edge functions).
const EMAIL_FROM = process.env.EMAIL_FROM || 'Linguo <noreply@linguo.id>';

const BRAND = '#136666';
const BRAND_DARK = '#0F4F4F';

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
    .select('session_date, student_name, duration_minutes, amount, note')
    .eq('payout_id', payout.id)
    .is('released_at', null)
    .order('session_date', { ascending: true });

  // dua kanal, dua-duanya best-effort — kegagalan notifikasi TIDAK boleh
  // membatalkan status transfer (uangnya sudah keluar).
  await notifyTeacher(admin, payout, items || []);
  await emailTeacher(payout, items || []);
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
async function notifyTeacher(admin: any, payout: any, items: any[]) {
  const phone = normalizePhone(payout.teachers?.whatsapp);
  if (!phone) return; // pengajar belum punya nomor — dilewati diam-diam

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

/** Escape teks bebas (nama siswa, catatan) sebelum ditaruh ke HTML email. */
function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Kabari pengajar lewat EMAIL (Resend) — jalur kedua di samping WA. Dipakai
 * karena tidak semua pengajar aktif di WA, dan email jadi bukti transfer yang
 * bisa dicari ulang. Best-effort: kegagalan kirim TIDAK membatalkan transfer.
 */
async function emailTeacher(payout: any, items: any[]) {
  const to = String(payout.teachers?.email || '').trim();
  if (!to || !to.includes('@')) return; // pengajar belum punya email — lewati
  if (!RESEND_API_KEY) {
    console.error('[teacher-payout] RESEND_API_KEY belum di-set, email dilewati');
    return;
  }

  const periode = `${MONTHS[(payout.month || 1) - 1]} ${payout.year}`;
  const nama = String(payout.teachers?.name || '').split(' ')[0] || 'Kak';
  const adj = Number(payout.adjustment_amount) || 0;
  const bank = payout.bank_name || payout.bank_code || 'rekening terdaftar';
  const last4 = String(payout.account_number || '').slice(-4);
  const list = items || [];
  const MAX = 30;

  // ── rincian per sesi sebagai baris tabel ──
  const rowsHtml = list.slice(0, MAX).map((it: any) => {
    const tgl = it.session_date
      ? new Date(it.session_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
      : '-';
    const label = esc(it.student_name || it.note || 'Sesi');
    const durasi = it.duration_minutes ? ` (${it.duration_minutes}m)` : '';
    return `<tr>
      <td style="color:#5F7876;font-size:13px;padding:6px 0;border-top:1px solid #EEF3F3;white-space:nowrap;">${tgl}</td>
      <td style="color:#1F3534;font-size:13px;padding:6px 10px;border-top:1px solid #EEF3F3;">${label}${durasi}</td>
      <td align="right" style="color:#1F3534;font-size:13px;font-weight:600;padding:6px 0;border-top:1px solid #EEF3F3;white-space:nowrap;">${rupiah(it.amount)}</td>
    </tr>`;
  }).join('');
  const moreHtml = list.length > MAX
    ? `<tr><td colspan="3" style="color:#7A9594;font-size:12px;padding:6px 0;border-top:1px solid #EEF3F3;">…dan ${list.length - MAX} sesi lainnya</td></tr>`
    : '';
  const rincianBlock = list.length
    ? `<tr><td style="padding:16px 0 4px;color:#0F2D2C;font-size:14px;font-weight:700;">Rincian sesi</td></tr>
       <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}${moreHtml}</table></td></tr>`
    : '';

  // ── ringkasan angka ──
  const summaryRows = [
    ['Jumlah sesi', String(payout.sessions_completed || 0)],
    ['Fee sesi', rupiah(payout.total_fee)],
    ...(adj ? [[adj > 0 ? 'Tambahan' : 'Penyesuaian', rupiah(adj) + (payout.adjustment_note ? ` (${esc(payout.adjustment_note)})` : '')]] as [string, string][] : []),
    ['Ditransfer ke', `${esc(bank)}${last4 ? ` ···${last4}` : ''} a.n. ${esc(payout.account_holder || '-')}`],
  ].map(([k, v], i) =>
    `<tr><td style="color:#5F7876;font-size:14px;padding:9px 0;${i ? 'border-top:1px solid #EEF3F3;' : ''}">${k}</td>` +
    `<td align="right" style="color:#1F3534;font-size:14px;font-weight:600;padding:9px 0;${i ? 'border-top:1px solid #EEF3F3;' : ''}">${v}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EAF2F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Fee mengajar ${periode} sudah ditransfer: ${rupiah(payout.netto)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EAF2F2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding:8px 0 20px;">
          <span style="font-size:22px;font-weight:800;color:${BRAND_DARK};letter-spacing:-0.5px;">Linguo</span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:20px;padding:32px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#0F2D2C;font-size:24px;line-height:30px;font-weight:800;padding:0 0 8px;">Fee mengajar sudah ditransfer 🎉</td></tr>
            <tr><td style="color:#1F3534;font-size:15px;line-height:24px;padding:6px 0;">Halo Kak ${esc(nama)}, fee mengajar periode <strong>${periode}</strong> sudah kami transfer ke rekeningmu ya.</td></tr>
            <tr><td style="padding:14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND};border-radius:14px;">
                <tr><td style="padding:18px 20px;">
                  <div style="color:#BFE3E1;font-size:13px;">Total ditransfer</div>
                  <div style="color:#ffffff;font-size:26px;font-weight:800;line-height:32px;">${rupiah(payout.netto)}</div>
                </td></tr>
              </table>
            </td></tr>
            <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${summaryRows}</table></td></tr>
            ${rincianBlock}
            <tr><td style="color:#5F7876;font-size:14px;line-height:22px;padding:18px 0 0;">Kalau ada yang kurang pas, langsung kabari admin ya. Terima kasih sudah mengajar bareng Linguo 🙏</td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:20px 8px;color:#7A9594;font-size:12px;line-height:18px;">
          Kamu menerima email ini karena terdaftar sebagai pengajar di Linguo.<br>
          © ${new Date().getFullYear()} Linguo · <a href="https://linguo.id" style="color:#7A9594;">linguo.id</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Fee mengajar ${periode} sudah ditransfer — ${rupiah(payout.netto)}`,
      html,
    });
    if (error) console.error('[teacher-payout] gagal kirim email:', error);
  } catch (e: any) {
    // best-effort — jangan sampai melempar dan bikin webhook balas 500 (Xendit retry)
    console.error('[teacher-payout] error kirim email (non-fatal):', e?.message || e);
  }
}
