-- [sim-idle-expire-v1] Tutup otomatis sesi simulasi yang menggantung.
--
-- Masalah: baris `simulation_attempts` dibuat saat siswa menekan "Mulai", tapi
-- jawabannya baru ditulis ke DB waktu dikumpulkan (selama mengerjakan disimpan di
-- localStorage). Kalau siswa menutup tab dan tak pernah kembali, barisnya selamanya
-- berstatus `in_progress` — di panel admin terbaca "Sedang dikerjakan" padahal sudah
-- ditinggal berhari-hari.
--
-- Aturan: lewat 24 jam sejak dimulai dan belum dikumpulkan → status `expired`
-- ("Kedaluwarsa"). `submitted_at` SENGAJA dibiarkan NULL supaya:
--   • jatah percobaan promo (dihitung dari submitted_at) tidak ikut terpakai, dan
--   • baris ini tidak muncul di Riwayat Skor siswa sebagai hasil.
-- Skornya tak bisa dihitung — tak ada satu pun jawaban yang tersimpan di server.
--
-- Sisi klien menangani kasus siswa yang kembali: sesi tersimpan berumur >24 jam
-- langsung auto-submit (IDLE_EXPIRE_MS di /akun/simulasi/[id]), jadi jawaban yang
-- sempat terisi tetap dinilai dan statusnya jadi `graded`.

create or replace function public.expire_stale_simulation_attempts(p_hours integer default 24)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update simulation_attempts
     set status = 'expired'
   where status = 'in_progress'
     and submitted_at is null
     and coalesce(started_at, created_at) < now() - make_interval(hours => p_hours);
  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function public.expire_stale_simulation_attempts(integer) is
  'Tandai attempt simulasi yang ditinggal >p_hours jam tanpa dikumpulkan sebagai expired.';

-- Jalan tiap jam (menit ke-7 supaya tak menumpuk dengan cron lain).
select cron.unschedule('expire-stale-simulation-attempts')
where exists (select 1 from cron.job where jobname = 'expire-stale-simulation-attempts');

select cron.schedule(
  'expire-stale-simulation-attempts',
  '7 * * * *',
  $$select public.expire_stale_simulation_attempts(24)$$
);

-- Bersihkan baris lama yang sudah terlanjur menggantung.
select public.expire_stale_simulation_attempts(24);
