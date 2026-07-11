-- Watch & Learn — akses admin ke cache transkrip `yt_transcripts`.
--
-- Kenapa: cache transkrip semula service_role-only (route Next + worker), RLS
-- aktif TANPA policy. Tapi UI kurasi di admin dashboard query Supabase LANGSUNG
-- (anon key + JWT admin) untuk:
--   1) baca `dur` per (video, bahasa) buat kolom durasi, dan
--   2) HAPUS cache saat admin menghapus job — kalau cache tak ikut terhapus,
--      video "hantu" tetap muncul di tab "Siap" (dibaca dari tabel ini).
-- Tanpa policy, kedua operasi itu diam-diam kena blokir RLS (0 baris).
--
-- Sama seperti policy jobs: TIDAK boleh sekadar "authenticated" (siswa juga
-- authenticated di project ini) — batasi ke owner/admin lewat tabel profiles.
--
-- JALANKAN MANUAL di Supabase SQL editor (project jbtgciepdmqxxcjflrxz). Idempotent.

drop policy if exists "admin kelola cache transkrip" on public.yt_transcripts;

create policy "admin kelola cache transkrip"
  on public.yt_transcripts
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
