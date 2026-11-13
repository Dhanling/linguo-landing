import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/* [lamaran-cv-v1] Unggah CV pelamar pengajar.
   Pelamar belum punya akun, jadi berkasnya tidak bisa diunggah langsung lewat RLS.
   Server menerbitkan signed upload URL ke bucket privat `teacher-docs` di folder
   `lamaran/` — browser lalu mengunggah langsung ke Supabase (tidak lewat fungsi
   Vercel yang badan permintaannya dibatasi ±4,5 MB). Path yang dikembalikan ikut
   dikirim bersama formulir dan disimpan di `teacher_applications.cv_path`; saat
   pelamar diterima, dashboard menyalinnya ke `teachers.cv_path`. */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "teacher-docs";
const MAX_BYTES = 10 * 1024 * 1024; // sama dengan file_size_limit bucket

const EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export async function POST(req: NextRequest) {
  try {
    const { type, size } = await req.json();
    const ext = EXT_BY_TYPE[String(type || "")];
    if (!ext) {
      return NextResponse.json({ error: "bad_type" }, { status: 400 });
    }
    if (typeof size !== "number" || size <= 0 || size > MAX_BYTES) {
      return NextResponse.json({ error: "too_big" }, { status: 400 });
    }

    const path = `lamaran/${randomUUID()}.${ext}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!res.ok) {
      console.error("teacher-apply/cv sign gagal:", res.status, await res.text());
      return NextResponse.json({ error: "sign_failed" }, { status: 502 });
    }
    const data = (await res.json()) as { url?: string };
    const token = data.url ? new URL(data.url, SUPABASE_URL).searchParams.get("token") : null;
    if (!token) {
      return NextResponse.json({ error: "sign_failed" }, { status: 502 });
    }

    return NextResponse.json({
      path,
      uploadUrl: `${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path}?token=${encodeURIComponent(token)}`,
    });
  } catch (e: any) {
    console.error("teacher-apply/cv error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
