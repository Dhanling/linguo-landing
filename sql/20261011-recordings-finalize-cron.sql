-- [rekaman-sambung-server-v1] 11 Okt 2026
-- Pemicu penyambung rekaman Kelas Video di server: pg_cron → net.http_post →
-- https://linguo.id/api/cron/recordings-finalize (Next.js route di linguo-landing).
-- Vercel Cron TIDAK dipakai (paket Hobby hanya mengizinkan jadwal harian).
--
-- Autentikasi: `Authorization: Bearer` = Vault `service_role_key` (sama seperti
-- job pg_cron lain); route memverifikasinya ke Supabase.
-- [rekaman-sambung-auth-v1] 12 Okt 2026: versi pertama mengirim Vault
-- `cron_secret` lewat `x-cron-secret`, yang bukan nilai env CRON_SECRET Vercel
-- → 401 di setiap putaran. Cek hasil: select status_code, content from
-- net._http_response order by created desc — 202 {"accepted":true} = diterima.
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
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'service_role_key' limit 1
      )
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
$cron$);
