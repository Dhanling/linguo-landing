-- [rekaman-sambung-server-v1] 11 Okt 2026
-- Pemicu penyambung rekaman Kelas Video di server: pg_cron → net.http_post →
-- https://linguo.id/api/cron/recordings-finalize (Next.js route di linguo-landing).
-- Vercel Cron TIDAK dipakai (paket Hobby hanya mengizinkan jadwal harian).
--
-- Autentikasi: header `x-cron-secret` = Vault `cron_secret` (rahasia yang sudah
-- dipakai pg_cron untuk Edge Function). Route menerimanya bila sama dengan env
-- CRON_SECRET di project Vercel linguo-landing. Kalau keduanya ternyata beda
-- (respons 401 di net._http_response), samakan: simpan nilai Vault `cron_secret`
-- sebagai env RECORDINGS_FINALIZE_SECRET (Production) di Vercel, atau buat
-- rahasia baru di kedua tempat dan ganti nama di bawah.
--
-- Route membalas 202 seketika lalu menggarap di latar (maks ±4,5 menit per
-- pemanggilan, 2 rekaman per putaran); kunci finalize-server.json di folder
-- potongan mencegah dua putaran saling tabrak.

select cron.unschedule('recordings-finalize-server')
where exists (select 1 from cron.job where jobname = 'recordings-finalize-server');

select cron.schedule('recordings-finalize-server', '*/10 * * * *', $cron$
  select net.http_post(
    url     := 'https://linguo.id/api/cron/recordings-finalize',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'cron_secret' limit 1
      )
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
$cron$);
