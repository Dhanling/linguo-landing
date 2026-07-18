-- Mode Tamu (B2B) untuk Simulasi ────────────────────────────────────────────
-- Siswa tanpa akun (mis. karyawan B2B yang dikasih link) bisa mengerjakan
-- simulasi yang ditandai `access_mode = 'guest'`. Di sisi klien mereka login
-- via Supabase Anonymous Sign-In (jadi role `authenticated`), lalu attempt &
-- jawaban tersimpan lewat jalur authenticated yang sudah ada + dinilai seperti
-- siswa biasa. Nama/email/WhatsApp diisi lewat form dan disimpan di attempt.
--
-- SEMUA DDL dibungkus 1 transaksi — hindari introspeksi PostgREST beruntun yang
-- pernah bikin IO budget spill (lihat catatan disk-io-budget).
--
-- PRASYARAT: aktifkan Auth → Anonymous Sign-Ins di dashboard Supabase.

begin;

-- 1. Kolom penanda mode akses simulasi ---------------------------------------
alter table public.test_simulations
  add column if not exists access_mode text not null default 'account';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'test_simulations_access_mode_chk'
  ) then
    alter table public.test_simulations
      add constraint test_simulations_access_mode_chk
      check (access_mode in ('account', 'guest'));
  end if;
end $$;

-- 2. Baca simulasi/bagian/soal mode tamu (tanpa entitlement) ------------------
-- Melengkapi policy "Entitled read *" yang menggate lewat has_simulation_access.
-- Cabang tamu: simulasi published & access_mode='guest' boleh dibaca siapa pun
-- yang authenticated (termasuk sesi anonymous).
drop policy if exists "Guest read simulations" on public.test_simulations;
create policy "Guest read simulations" on public.test_simulations
  for select to authenticated
  using (is_published and access_mode = 'guest');

drop policy if exists "Guest read sections" on public.test_simulation_sections;
create policy "Guest read sections" on public.test_simulation_sections
  for select to authenticated
  using (exists (
    select 1 from public.test_simulations s
    where s.id = test_simulation_sections.simulation_id
      and s.is_published and s.access_mode = 'guest'
  ));

drop policy if exists "Guest read questions" on public.test_simulation_questions;
create policy "Guest read questions" on public.test_simulation_questions
  for select to authenticated
  using (exists (
    select 1 from public.test_simulation_sections sec
    join public.test_simulations s on s.id = sec.simulation_id
    where sec.id = test_simulation_questions.section_id
      and s.is_published and s.access_mode = 'guest'
  ));

-- 3. Perketat attempt & jawaban (WAJIB sebelum Anonymous Sign-In aktif) -------
-- Policy lama "Authenticated full access" = qual TRUE → SEMUA user login bisa
-- baca attempt/jawaban SELURUH siswa (nama/email/WA). Dengan anonymous sign-in
-- aktif, siapa pun bisa dapat token authenticated → data bocor. Ganti jadi:
--   • admin (can_manage_simulations) → akses penuh (dashboard tetap jalan)
--   • siswa → hanya baris miliknya sendiri
drop policy if exists "Authenticated full access" on public.simulation_attempts;
create policy "Admin manage attempts" on public.simulation_attempts
  for all to authenticated
  using (can_manage_simulations())
  with check (can_manage_simulations());
create policy "Own attempts" on public.simulation_attempts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Authenticated full access" on public.simulation_answers;
create policy "Admin manage answers" on public.simulation_answers
  for all to authenticated
  using (can_manage_simulations())
  with check (can_manage_simulations());
create policy "Own answers" on public.simulation_answers
  for all to authenticated
  using (exists (
    select 1 from public.simulation_attempts a
    where a.id = simulation_answers.attempt_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.simulation_attempts a
    where a.id = simulation_answers.attempt_id and a.user_id = auth.uid()
  ));

commit;
