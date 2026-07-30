// ── preview-session-v1 ───────────────────────────────────────────────────
// Sesi "POV siswa" (dashboard /akun dibuka sebagai siswa tertentu, read-only)
// dulu terbuka begitu saja: siapa pun yang tahu UUID siswa bisa memanggil
// /api/preview-student dan dapat nama, email, WhatsApp, plus riwayat tagihannya.
//
// Sekarang sesinya harus dibuka dengan KODE sekali-pakai yang cuma bisa
// diterbitkan owner/admin (RPC staff_preview_issue, lihat admin-dashboard
// sql/20260730_student_group_gate_preview.sql). /api/preview-start menukar kode
// itu jadi cookie httpOnly; semua endpoint pratinjau memverifikasi cookie itu
// lewat helper di sini.
//
// Kode dipakai apa adanya sebagai isi cookie (bukan token bertanda tangan)
// supaya pratinjau bisa dicabut kapan saja: hapus barisnya, sesi mati.

import type { NextRequest } from "next/server";

export const PREVIEW_COOKIE = "linguo_preview";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const serviceHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

export async function serviceRest(path: string, init?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...serviceHeaders, ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) return null;
  if (res.status === 204) return [];
  return res.json();
}

export interface PreviewCode {
  code: string;
  student_id: string;
  expires_at: string;
  used_at: string | null;
}

/** Baris kode yang masih berlaku, atau null. Bentuk kode divalidasi dulu. */
export async function lookupPreviewCode(code: string | undefined | null): Promise<PreviewCode | null> {
  if (!code || !/^[0-9a-f]{16,96}$/i.test(code)) return null;
  const rows = await serviceRest(
    `staff_preview_codes?code=eq.${encodeURIComponent(code)}&select=code,student_id,expires_at,used_at&limit=1`,
  );
  const row = rows?.[0] as PreviewCode | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;
  return row;
}

/**
 * ID siswa yang boleh dilihat request ini, dari cookie sesi pratinjau.
 * null = bukan sesi pratinjau yang sah (endpoint wajib menolak).
 */
export async function previewStudentId(req: NextRequest): Promise<string | null> {
  const row = await lookupPreviewCode(req.cookies.get(PREVIEW_COOKIE)?.value);
  return row?.student_id ?? null;
}
