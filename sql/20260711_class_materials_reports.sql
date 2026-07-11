-- Materi Kelas & Rapor — tab "Materi" + "Rapor" di detail kelas siswa (/akun/kelas/[id])
-- dan tombol "Materi kelas" + "Rapor" di dashboard pengajar (teach.linguo.id).
--
-- Dua tabel baru:
--   • class_materials — lampiran materi dari pengajar (link doc/slide/YouTube atau
--     file upload ke bucket `class-materials`); muncul di tab Materi siswa,
--     bisa ditautkan ke sesi tertentu (schedule_id) atau umum per kelas.
--   • class_reports  — rapor tengah (mid, ± sesi 8) & akhir (final, sesi terakhir).
--     Pengajar mengisi draft lalu klik "Terbitkan" → siswa hanya melihat yang
--     published_at-nya terisi. Snapshot skor 4 skill + kehadiran + komentar.
--
-- RLS mengikuti pola 20260705 (teacher_read_own_registrations):
--   • pengajar kelola baris milik kelasnya (registrations.teacher_id → teachers.user_id = auth.uid());
--   • siswa baca baris milik registrasinya (registrations.student_id → students.email = auth.email());
--   • TANPA policy "allow all authenticated" (pelajaran dari audit RLS teacher portal).
--
-- JALANKAN MANUAL di Supabase SQL editor (project jbtgciepdmqxxcjflrxz). Idempotent.

-- ── 1. Materi kelas ──────────────────────────────────────────────────────────
create table if not exists public.class_materials (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null,
  schedule_id     uuid,                          -- null = materi umum kelas; isi = tertaut sesi
  title           text not null,
  kind            text not null default 'link',  -- youtube | doc | slide | pdf | file | link
  url             text,                          -- link eksternal ATAU public URL hasil upload
  storage_path    text,                          -- path di bucket class-materials (buat hapus file)
  note            text,                          -- pesan singkat pengajar (opsional)
  created_by      uuid,                          -- teachers.id
  created_at      timestamptz not null default now()
);

create index if not exists class_materials_reg_idx
  on public.class_materials (registration_id, created_at desc);

-- ── 2. Rapor ─────────────────────────────────────────────────────────────────
create table if not exists public.class_reports (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null,
  report_type     text not null default 'mid',   -- mid (tengah) | final (akhir)
  -- {"speaking":{"score":3,"note":"..."}, "listening":{...}, ...} — skor 1–5 (CEFR A1–C1)
  skills          jsonb not null default '{}'::jsonb,
  -- {"attended":8,"total":16,"rate":100,"hangus":0,"cancelled":0}
  attendance      jsonb not null default '{}'::jsonb,
  teacher_comment text,                          -- komentar naratif pengajar
  recommendation  text,                          -- rekomendasi lanjutan (naik level, dsb.)
  created_by      uuid,                          -- teachers.id
  published_at    timestamptz,                   -- null = draft (tak terlihat siswa)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (registration_id, report_type)          -- 1 rapor tengah + 1 rapor akhir per kelas
);

create index if not exists class_reports_reg_idx
  on public.class_reports (registration_id);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
alter table public.class_materials enable row level security;
alter table public.class_reports  enable row level security;

-- Pengajar: kelola penuh materi & rapor kelas miliknya sendiri.
drop policy if exists "Teacher manage own class materials" on public.class_materials;
create policy "Teacher manage own class materials"
on public.class_materials
for all
to authenticated
using (
  registration_id in (
    select r.id from public.registrations r
    where r.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
  )
)
with check (
  registration_id in (
    select r.id from public.registrations r
    where r.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
  )
);

drop policy if exists "Teacher manage own class reports" on public.class_reports;
create policy "Teacher manage own class reports"
on public.class_reports
for all
to authenticated
using (
  registration_id in (
    select r.id from public.registrations r
    where r.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
  )
)
with check (
  registration_id in (
    select r.id from public.registrations r
    where r.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
  )
);

-- Siswa: baca materi kelas miliknya (registrasi milik email login).
drop policy if exists "Student read own class materials" on public.class_materials;
create policy "Student read own class materials"
on public.class_materials
for select
to authenticated
using (
  registration_id in (
    select r.id from public.registrations r
    join public.students s on s.id = r.student_id
    where lower(s.email) = lower(coalesce(auth.email(), ''))
  )
);

-- Siswa: baca rapor miliknya, HANYA yang sudah diterbitkan (draft tetap privat).
drop policy if exists "Student read own published reports" on public.class_reports;
create policy "Student read own published reports"
on public.class_reports
for select
to authenticated
using (
  published_at is not null
  and registration_id in (
    select r.id from public.registrations r
    join public.students s on s.id = r.student_id
    where lower(s.email) = lower(coalesce(auth.email(), ''))
  )
);

-- ── 4. student_skills: siswa boleh baca nilai skill-nya sendiri ──────────────
-- (Tab Progress siswa menampilkan skill CEFR yang diisi pengajar. Policy tambahan,
-- tidak mengubah policy yang sudah ada; kalau RLS tabel ini nonaktif, tak berefek.)
drop policy if exists "Student read own skills" on public.student_skills;
create policy "Student read own skills"
on public.student_skills
for select
to authenticated
using (
  registration_id in (
    select r.id from public.registrations r
    join public.students s on s.id = r.student_id
    where lower(s.email) = lower(coalesce(auth.email(), ''))
  )
);

-- ── 5. Bucket storage buat file materi (pola sama dgn kontenai-freeform) ─────
insert into storage.buckets (id, name, public)
values ('class-materials', 'class-materials', true)
on conflict (id) do nothing;

drop policy if exists "Public read class-materials" on storage.objects;
create policy "Public read class-materials"
on storage.objects for select
to public
using (bucket_id = 'class-materials');

drop policy if exists "Auth upload class-materials" on storage.objects;
create policy "Auth upload class-materials"
on storage.objects for insert
to authenticated
with check (bucket_id = 'class-materials');

drop policy if exists "Auth delete class-materials" on storage.objects;
create policy "Auth delete class-materials"
on storage.objects for delete
to authenticated
using (bucket_id = 'class-materials');

-- Verifikasi
select id, name, public from storage.buckets where id = 'class-materials';
select tablename, policyname from pg_policies
 where tablename in ('class_materials', 'class_reports', 'student_skills')
 order by tablename, policyname;
