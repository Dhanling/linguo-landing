// src/app/api/affiliate/payout-webhook/route.ts
// [linguo-patch:afiliator-payout-webhook-v1]
// Terima callback Xendit Payouts. Map reference_id -> payout_id:
//   SUCCEEDED -> complete_affiliate_payout
//   FAILED    -> fail_affiliate_payout (balikin konversi paid->approved)
//
// PENTING: daftarin URL ini + callback token di dashboard Xendit pada bagian
// webhook PAYOUTS (beda dari webhook Invoice).
//   URL: https://linguo.id/api/affiliate/payout-webhook

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
