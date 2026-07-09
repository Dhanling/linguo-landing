-- Watch & Learn — cache transkrip video YouTube.
--
-- Kenapa: fetch caption dari IP datacenter (Vercel/Supabase) sering diblokir
-- YouTube → jatuh ke ASR (Gemini, ~1 menit). Karena katalog = video populer yang
-- ditonton berulang, cukup proses SEKALI per (video, bahasa): viewer berikutnya
-- baca dari cache ini (instan). Ditulis/dibaca HANYA lewat route Next
-- /api/yt-transcript-cache pakai service_role — RLS aktif tanpa policy publik,
-- jadi anon key TIDAK bisa baca/tulis (cegah polusi cache).
--
-- JALANKAN MANUAL di Supabase SQL editor (project jbtgciepdmqxxcjflrxz).

create table if not exists public.yt_transcripts (
  video_id   text        not null,
  lang       text        not null,
  cues       jsonb       not null,
  source     text,                       -- 'caption' | 'asr'
  created_at timestamptz not null default now(),
  primary key (video_id, lang)
);

alter table public.yt_transcripts enable row level security;
-- Sengaja TANPA policy: hanya service_role (bypass RLS) yang boleh baca/tulis.
