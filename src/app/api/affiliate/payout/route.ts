// src/app/api/affiliate/payout/route.ts
// [linguo-patch:afiliator-payout-route-v1]
// Self-service auto-disburse komisi afiliator via Xendit /v2/payouts.
// Fee Rp2.500 ditanggung afiliator (yang dikirim = total - 2500).
//
// ALUR AMAN (urutan penting — ini nyangkut duit real):
//   1. verifikasi sesi (Bearer access token) -> dapet user_id
//   2. resolve affiliate dari user_id (JANGAN percaya id dari client; RPC ga
//      validasi auth.uid())
//   3. gate: rekening + bank_code lengkap, ga ada payout aktif
//   4. RPC request_affiliate_payout -> CLAIM semua konversi eligible + bikin
//      baris payout 'requested' (RPC ini TIDAK manggil Xendit)
//   5. call Xendit. Kalau GAGAL -> WAJIB fail_affiliate_payout biar claim
//      konversi dilepas (kalau ga, komisi nyangkut 'paid' tapi duit ga kekirim)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY as string;

const FEE = 2500;          // biaya admin, ditanggung afiliator
const MIN_PAYOUT = 10000;  // minimal pencairan Rp10.000
const BUFFER_DAYS = 0;     // <-- 0 BUAT TES. Balikin ke 3 buat PRODUKSI.

export async function POST(req: Request) {
  try {
    // 1. token sesi dari header Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan. Silakan login ulang.' }, { status: 401 });
    }

    // service-role client dipakai buat verifikasi token + semua operasi DB
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 2. verifikasi user dari token
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Sesi tidak valid. Silakan login ulang.' }, { status: 401 });
    }
    const userId = userData.user.id;

    // 3. resolve affiliate dari user_id sesi (bukan dari client!)
    const { data: aff, error: affErr } = await admin
      .from('affiliates')
      .select('id, bank_name, bank_account_no, bank_account_name, bank_code, status')
      .eq('user_id', userId)
      .maybeSingle();
    if (affErr) {
      return NextResponse.json({ error: 'Gagal membaca data afiliator.' }, { status: 500 });
    }
    if (!aff) {
      return NextResponse.json({ error: 'Akun afiliator tidak ditemukan.' }, { status: 404 });
    }

    // 4. gate rekening lengkap + bank_code (Xendit butuh channel_code)
    if (!aff.bank_code || !aff.bank_account_no || !aff.bank_account_name) {
      return NextResponse.json(
        { error: 'Lengkapi rekening dulu (pilih bank dari daftar) sebelum mencairkan.' },
        { status: 400 },
      );
    }

    // 5. gate anti-dobel: ga boleh ada payout requested/processing aktif
    const { data: pending, error: pendErr } = await admin
      .from('affiliate_payouts')
      .select('id')
      .eq('affiliate_id', aff.id)
      .in('status', ['requested', 'processing'])
      .limit(1);
    if (pendErr) {
      return NextResponse.json({ error: 'Gagal cek pencairan berjalan.' }, { status: 500 });
    }
    if (pending && pending.length > 0) {
      return NextResponse.json(
        { error: 'Masih ada pencairan yang sedang diproses. Tunggu selesai dulu ya.' },
        { status: 409 },
      );
    }

    // 6. RPC: claim konversi + bikin baris payout 'requested' (BELUM call Xendit)
    const { data: payoutId, error: rpcErr } = await admin.rpc('request_affiliate_payout', {
      p_affiliate_id: aff.id,
      p_min_amount: MIN_PAYOUT,
      p_buffer_days: BUFFER_DAYS,
      p_tax_rate: 0,
    });
    if (rpcErr || !payoutId) {
      return NextResponse.json(
        { error: rpcErr?.message || 'Tidak ada komisi yang siap dicairkan.' },
        { status: 400 },
      );
    }

    // 7. baca total dari baris payout
    const { data: payoutRow, error: prErr } = await admin
      .from('affiliate_payouts')
      .select('id, amount')
      .eq('id', payoutId)
      .single();
    if (prErr || !payoutRow) {
      await admin.rpc('fail_affiliate_payout', {
        p_payout_id: payoutId,
        p_reason: 'Gagal baca baris payout setelah dibuat.',
      });
      return NextResponse.json({ error: 'Gagal memproses pencairan. Coba lagi.' }, { status: 500 });
    }

    const total = Number(payoutRow.amount) || 0;
    const kirim = total - FEE; // fee ditanggung afiliator
    if (kirim <= 0) {
      await admin.rpc('fail_affiliate_payout', {
        p_payout_id: payoutId,
        p_reason: 'Nominal di bawah biaya admin.',
      });
      return NextResponse.json(
        { error: 'Saldo tidak cukup setelah potongan biaya admin Rp2.500.' },
        { status: 400 },
      );
    }

    // 8. catat fee + net_amount
    await admin
      .from('affiliate_payouts')
      .update({ fee_amount: FEE, net_amount: kirim })
      .eq('id', payoutId);

    // 9. call Xendit /v2/payouts (Idempotency-key = payout_id biar anti dobel-kirim)
    const basic = Buffer.from(`${XENDIT_SECRET}:`).toString('base64');
    let xenditResp: Response;
    let xenditJson: any = null;
    try {
      xenditResp = await fetch('https://api.xendit.co/v2/payouts', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/json',
          'Idempotency-key': String(payoutId),
        },
        body: JSON.stringify({
          reference_id: String(payoutId),
          channel_code: aff.bank_code,
          channel_properties: {
            account_holder_name: aff.bank_account_name,
            account_number: aff.bank_account_no,
          },
          amount: kirim,
          currency: 'IDR',
          description: 'Pencairan komisi afiliator Linguo',
        }),
      });
      xenditJson = await xenditResp.json().catch(() => null);
    } catch (e: any) {
      // network error -> lepas claim
      await admin.rpc('fail_affiliate_payout', {
        p_payout_id: payoutId,
        p_reason: 'Gagal hubungi Xendit: ' + (e?.message || 'network error'),
      });
      return NextResponse.json(
        { error: 'Gagal menghubungi Xendit. Komisi dikembalikan, silakan coba lagi.' },
        { status: 502 },
      );
    }

    if (!xenditResp.ok) {
      const reason = xenditJson?.message || xenditJson?.error_code || `HTTP ${xenditResp.status}`;
      await admin.rpc('fail_affiliate_payout', {
        p_payout_id: payoutId,
        p_reason: 'Xendit menolak: ' + reason,
      });
      return NextResponse.json({ error: 'Xendit menolak pencairan: ' + reason }, { status: 502 });
    }

    // 10. sukses (ACCEPTED) -> simpan id Xendit + status processing
    const xenditId = xenditJson?.id || null;
    await admin
      .from('affiliate_payouts')
      .update({
        xendit_disbursement_id: xenditId,
        provider_ref: xenditId,
        status: 'processing',
      })
      .eq('id', payoutId);

    return NextResponse.json({
      ok: true,
      payout_id: payoutId,
      total,
      fee: FEE,
      diterima: kirim,
      xendit_id: xenditId,
      status: 'processing',
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Error tak terduga: ' + (e?.message || String(e)) }, { status: 500 });
  }
}
