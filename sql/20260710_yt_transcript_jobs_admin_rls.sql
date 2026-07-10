-- Watch & Learn — akses admin ke antrian job transkripsi (buat UI kurasi).
--
-- Tabel yt_transcript_jobs semula service_role-only (worker + route Next). UI
-- kurasi di admin dashboard query Supabase LANGSUNG pakai anon key + JWT admin,
-- jadi butuh policy. TAPI project ini auth-nya dipakai bersama landing (siswa
-- juga "authenticated"), maka policy TIDAK boleh sekadar "authenticated" — kita
-- batasi ke role owner/admin via tabel profiles. Siswa (role 'student') otomatis
-- tertolak; enqueue siswa lewat route Next ber-service_role (bukan tabel langsung).
--
-- JALANKAN MANUAL di Supabase SQL editor (project jbtgciepdmqxxcjflrxz).

create policy "admin kelola transcript jobs"
  on public.yt_transcript_jobs
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
