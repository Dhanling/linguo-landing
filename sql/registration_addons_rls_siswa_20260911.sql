-- ── addon-akses-rekaman-v1 ──────────────────────────────────────────────────
-- Kenapa berkas ini ada (laporan admin Faujiah 11 Sep 2026, bug fcf8c425).
--
-- Add-on kelas Private ("pembelian tambahan": Recording Rp 100.000, E-book,
-- Modul) diinput admin per registrasi. Sisi E-BOOK sudah otomatis (trigger DB di
-- repo admin menuliskan digital_purchases dari registration_addons). Sisi REKAMAN
-- tadinya TIDAK DIGERBANG sama sekali: selama baris `schedules` punya
-- recording_url, tombol "Tonton rekaman" di /akun muncul buat siapa pun.
--
-- Gerbangnya sekarang ada di dua lapis:
--   • server — src/app/api/class-recording/route.ts memakai service key, jadi dia
--     TIDAK butuh policy ini (RLS dilewati). Itu gerbang yang sesungguhnya, karena
--     roomId rekaman (`sched-<uuid>`) gampang ditebak.
--   • tampilan — /akun (SesiTimeline, ClassProgressTab, JadwalCalendar) membaca
--     `registration_addons` DENGAN SESI SISWA supaya tombolnya tidak muncul lalu
--     mentok 403. Tanpa policy di bawah, query itu selalu balik kosong dan semua
--     kelas jatuh ke "belum-didata" (tombol tetap tampil) — bukan salah, tapi
--     tombolnya jadi bohong.
--
-- Bentuk policy-nya MENIRU sql/20260820_perpustakaan_akses_email.sql: cocokkan
-- lewat email di JWT secara case-insensitive, bukan student_id/auth_user_id. Satu
-- orang sering punya lebih dari satu baris `students` (registrasi lama dibuat
-- manual admin), dan kolom penghubung auth sering NULL buat siswa yang bikin akun
-- SESUDAH bayar — patokan email yang membuat Perpustakaan akhirnya tidak kosong.
--
-- Catatan tiga keadaan (lihat src/lib/addonAccess.ts): data add-on di produksi
-- belum lengkap — 45 registrasi punya rekaman, hanya 21 punya catatan add-on, 17
-- nol catatan. Registrasi tanpa catatan apa pun SENGAJA tetap boleh menonton; yang
-- ditolak cuma registrasi yang add-on-nya sudah didata dan Recording tak termasuk.
-- Policy ini hanya SELECT — siswa tidak boleh menulis/mengubah add-on.
--
-- Idempoten, aman dijalankan ulang.

-- 1) Jaring staf + aktifkan RLS ─────────────────────────────────────────────
-- HATI-HATI: kalau RLS dinyalakan di tabel yang belum punya policy apa pun, menu
-- Registrasi di admin dashboard (kunci anon/authenticated, bukan service role)
-- langsung kehilangan seluruh baris add-on. Jadi policy staf dibuat LEBIH DULU,
-- dan hanya kalau tabelnya memang belum punya policy.
do $$
declare
  ada_policy boolean;
  rls_aktif  boolean;
begin
  select exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'registration_addons'
  ) into ada_policy;

  select relrowsecurity from pg_class where oid = 'public.registration_addons'::regclass
  into rls_aktif;

  if not ada_policy then
    execute $p$
      create policy registration_addons_staff_all on public.registration_addons
        for all to authenticated
        using (exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = any (array['owner', 'admin', 'curriculum'])
        ))
        with check (exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = any (array['owner', 'admin', 'curriculum'])
        ))
    $p$;
    raise notice 'registration_addons: policy staf dibuat (tabel belum punya policy apa pun)';
  end if;

  if not rls_aktif then
    execute 'alter table public.registration_addons enable row level security';
    raise notice 'registration_addons: row level security diaktifkan';
  end if;
end $$;

-- 2) Policy baca milik sendiri (siswa) ──────────────────────────────────────
drop policy if exists registration_addons_student_read_own on public.registration_addons;
create policy registration_addons_student_read_own on public.registration_addons
  for select to public
  using (
    exists (
      select 1
      from public.registrations r
      join public.students s on s.id = r.student_id
      where r.id = registration_addons.registration_id
        and s.email is not null
        and auth.jwt() ->> 'email' is not null
        and lower(s.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- 3) DIAGNOSA ───────────────────────────────────────────────────────────────
-- Angka-angka yang dipakai mengambil keputusan "belum-didata tetap terlihat".
-- Kalau nanti `rekaman_tanpa_catatan_addon` sudah mendekati 0, gerbangnya boleh
-- diperketat jadi dua keadaan saja.
select
  (select count(distinct registration_id) from public.schedules
     where recording_url is not null)                                  as reg_punya_rekaman,
  (select count(distinct registration_id) from public.registration_addons) as reg_punya_baris_addon,
  (select count(*) from public.registration_addons
     where lower(addon_type) = 'recording')                            as baris_addon_recording,
  (select count(*) from public.registrations where addon_ebook_recording)   as reg_bundel_ebook_rekaman,
  (select count(distinct s.registration_id)
     from public.schedules s
     join public.registrations r on r.id = s.registration_id
    where s.recording_url is not null
      and not exists (select 1 from public.registration_addons a where a.registration_id = r.id)
      and coalesce(r.addons::text, '') in ('', '{}', 'null')
      and r.addon_ebook_recording is not true)                             as rekaman_tanpa_catatan_addon;
-- ^ "is not true", BUKAN "is null": kolomnya NOT NULL default false, jadi "is null" selalu 0
--   dan diagnosanya bohong (11 Sep 2026 sebenarnya 18 kelas tanpa catatan add-on).
