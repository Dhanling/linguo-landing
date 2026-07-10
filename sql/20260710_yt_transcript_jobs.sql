-- Watch & Learn — antrian job transkripsi (kurasi + tahan tab-close).
--
-- Kenapa: sebelumnya transkrip dipicu langsung dari browser (buka video = ASR
-- Gemini ~1 menit). Itu (a) tak terkendali biayanya (siapa pun buka video apa pun
-- = 1 transkripsi) dan (b) hilang kalau tab ditutup di tengah proses. Tabel ini
-- memindah pemrosesan ke SERVER: admin (atau siswa lewat tombol "Minta") menaruh
-- JOB di sini; worker (Edge Function `transcript-worker`, dijadwalkan pg_cron)
-- yang mengerjakannya lalu menyimpan hasil ke `yt_transcripts`. Manfaat:
--   • kontrol penuh — hanya video yang di-antre yang diproses (kurasi);
--   • murah — 1 (video, bahasa) diproses SEKALI lalu di-cache selamanya;
--   • tahan banting — job ada di DB, tutup tab tak menghentikannya;
--   • cap konkurensi GLOBAL lintas-user (di fungsi claim, bukan per-tab).
--
-- Akses HANYA lewat service_role (route Next + worker) — RLS aktif tanpa policy
-- publik, sama pola dengan `yt_transcripts`. UI admin (2B) akan pakai endpoint
-- ber-service_role juga, jadi tabel ini tak perlu policy authenticated.
--
-- JALANKAN MANUAL di Supabase SQL editor (project jbtgciepdmqxxcjflrxz).

create table if not exists public.yt_transcript_jobs (
  id           bigint generated always as identity primary key,
  video_id     text not null,
  lang         text not null,
  status       text not null default 'pending',  -- pending | processing | done | failed
  source       text not null default 'admin',    -- admin | request
  requested_by text,                              -- email/id peminta (audit + gate); null utk admin
  engine       text,                              -- 'groq' | 'gemini' — diisi worker saat selesai
  attempts     integer not null default 0,        -- naik tiap kali di-claim; batasi retry
  error        text,                              -- pesan kegagalan terakhir (buat debug/retry)
  -- Metadata video buat kartu tab "Siap" — diteruskan ke yt_transcripts saat selesai.
  title        text,
  channel      text,
  dur          integer,                           -- durasi detik
  locked_at    timestamptz,                       -- worker set saat mulai; null = bebas di-claim
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Dedup: 1 job per (video, bahasa). Antre ulang video yang sama = no-op (lihat
  -- fungsi enqueue di route Next; upsert on conflict do nothing / reset failed).
  unique (video_id, lang)
);

-- Drainer mengambil pending TERLAMA dulu (FIFO adil). Partial index ramping.
create index if not exists yt_transcript_jobs_pending_idx
  on public.yt_transcript_jobs (created_at)
  where status = 'pending';

-- Menghitung yang sedang jalan (cap konkurensi) + mendeteksi lock basi.
create index if not exists yt_transcript_jobs_processing_idx
  on public.yt_transcript_jobs (locked_at)
  where status = 'processing';

alter table public.yt_transcript_jobs enable row level security;
-- Sengaja TANPA policy: hanya service_role (bypass RLS) yang boleh baca/tulis.

-- ── Claim atomik + cap konkurensi ────────────────────────────────────────────
-- Worker memanggil ini untuk mengambil SATU job dengan aman:
--   1. reclaim job yang lock-nya basi (worker mati di tengah jalan → balik pending);
--   2. kalau yang sedang 'processing' sudah >= max_concurrent → balik kosong (rem);
--   3. kalau tidak, ambil 1 job pending terlama (FOR UPDATE SKIP LOCKED → aman dari
--      race antar pemanggilan paralel), set 'processing' + locked_at + attempts+1.
-- Cap GLOBAL ada di sini, jadi berapa pun tab/user, worker tak pernah menjalankan
-- lebih dari max_concurrent transkripsi sekaligus.
create or replace function public.claim_transcript_job(
  max_concurrent int default 5,
  stale_minutes  int default 15
)
returns setof public.yt_transcript_jobs
language plpgsql
as $$
declare
  running int;
begin
  -- 1) Lock basi → kembalikan ke antrian (worker sebelumnya kemungkinan crash/timeout).
  update public.yt_transcript_jobs
     set status = 'pending', locked_at = null, updated_at = now()
   where status = 'processing'
     and locked_at < now() - make_interval(mins => stale_minutes);

  -- 2) Rem konkurensi.
  select count(*) into running
    from public.yt_transcript_jobs
   where status = 'processing';
  if running >= max_concurrent then
    return;
  end if;

  -- 3) Ambil satu job pending terlama, kunci baris agar tak dobel-claim.
  return query
  update public.yt_transcript_jobs j
     set status = 'processing', locked_at = now(), attempts = attempts + 1, updated_at = now()
   where j.id = (
     select id
       from public.yt_transcript_jobs
      where status = 'pending'
      order by created_at
      for update skip locked
      limit 1
   )
  returning j.*;
end;
$$;
