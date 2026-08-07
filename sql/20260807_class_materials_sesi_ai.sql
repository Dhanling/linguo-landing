-- [reg-materi-tab-v1] Materi kelas per SESI + materi hasil generate AI.
--
-- Sebelumnya materi cuma bisa ditautkan ke baris `schedules` (schedule_id) atau
-- dibiarkan umum. Masalahnya kelas lawas sering TIDAK punya baris schedules sama
-- sekali (sesinya cuma tercatat di registrations.sessions_used, lihat catatan
-- "kelas lawas tanpa baris schedules"), jadi materi tidak bisa ditempel ke sesi
-- ke-berapa pun. Kolom `session_number` bikin materi nempel ke NOMOR sesi —
-- selalu ada, dengan atau tanpa baris jadwal.
--
-- `content` menampung materi yang isinya teks (hasil generate AI): siswa membaca
-- langsung di dashboard, tidak perlu file/link ke mana-mana. kind = 'ai'.
--
-- Idempoten — aman dijalankan ulang.

alter table public.class_materials add column if not exists session_number int;
alter table public.class_materials add column if not exists content text;

create index if not exists class_materials_reg_sesi_idx
  on public.class_materials (registration_id, session_number);

-- ── RLS: staf dashboard ──────────────────────────────────────────────────────
-- Sebelum ini class_materials cuma punya policy pengajar (kelasnya sendiri) &
-- siswa (baca). Admin/kurikulum yang memasang materi dari dashboard Pendaftaran
-- ditolak RLS. Pola sama dengan "Admin full access registrations".
-- WITH CHECK ikut ditulis: USING saja tidak mengizinkan INSERT (lihat catatan
-- rls-update-with-check-wajib).
drop policy if exists "Staff manage class materials" on public.class_materials;
create policy "Staff manage class materials" on public.class_materials
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['owner', 'admin', 'curriculum'])
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = any (array['owner', 'admin', 'curriculum'])
    )
  );
