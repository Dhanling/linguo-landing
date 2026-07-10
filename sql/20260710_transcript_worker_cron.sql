-- Watch & Learn — jadwalkan drainer antrian transkrip (pg_cron → Edge Function).
--
-- Tiap menit, pg_cron memanggil Edge Function `transcript-worker` yang mengambil
-- job pending dari `yt_transcript_jobs` dan memprosesnya (Groq → fallback Gemini).
-- Konkurensi dibatasi di dalam claim_transcript_job() (maks 5), jadi walau
-- pemanggilan tumpang-tindih saat antrian dalam, tak pernah lebih dari 5 jalan.
--
-- PRASYARAT:
--   1. Migrasi 20260710_yt_transcript_jobs.sql SUDAH dijalankan.
--   2. Edge Function `transcript-worker` SUDAH di-deploy + secret GROQ_API_KEY set.
--   3. Extension pg_cron & pg_net aktif (Supabase: Database → Extensions, atau
--      statement create extension di bawah).
--
-- ⚠️ GANTI `<SERVICE_ROLE_KEY>` di bawah dengan service_role key project
--    (Supabase → Project Settings → API → service_role). JANGAN commit key asli;
--    tempel hanya saat menjalankan di SQL editor.
--
-- JALANKAN MANUAL di Supabase SQL editor (project jbtgciepdmqxxcjflrxz).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Hindari duplikat kalau di-run ulang: hapus jadwal lama bila ada.
select cron.unschedule('drain-transcript-jobs')
where exists (select 1 from cron.job where jobname = 'drain-transcript-jobs');

select cron.schedule(
  'drain-transcript-jobs',
  '* * * * *', -- tiap menit
  $$
  select net.http_post(
    url     := 'https://jbtgciepdmqxxcjflrxz.supabase.co/functions/v1/transcript-worker',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
               ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- Cek jadwal aktif:      select * from cron.job;
-- Lihat riwayat run:     select * from cron.job_run_details order by start_time desc limit 20;
-- Matikan sementara:     select cron.unschedule('drain-transcript-jobs');
