-- [student-workspace-v1] Ruang kerja belajar siswa ala Notion di dashboard siswa.
--
-- Latar: siswa (BAHRUN, chat 4 Sep) minta bisa menyimpan sendiri materi, catatan,
-- berkas, dan PR-nya supaya tidak hilang — sejauh ini yang bisa menyimpan cuma
-- pengajar (class_materials). Tiga tabel di sini milik SISWA:
--   • student_notes  — catatan/materi/berkas milik siswa (boleh dibagikan ke pengajar)
--   • student_tasks  — daftar tugas/PR (bisa juga ditugaskan pengajar)
--   • student_focus_sessions — log Pomodoro "Mode Belajar Sendiri"
--
-- Idempoten: aman dijalankan ulang.

-- ── student_notes ────────────────────────────────────────────────────────────
create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  -- kelas terkait (opsional): catatan bebas tidak terikat kelas mana pun
  registration_id uuid references public.registrations(id) on delete set null,
  session_number integer,
  title text,
  content text,                                   -- markdown ringan (heading/bullet/checklist)
  icon text,                                      -- nama ikon lucide, mis. 'BookOpen'
  color text,                                     -- warna kartu, mis. 'teal'
  tags text[] not null default '{}',
  attachments jsonb not null default '[]'::jsonb, -- [{name,url,kind,path}]
  pinned boolean not null default false,
  shared_with_teacher boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.student_notes is
  'student-workspace-v1: catatan/materi milik SISWA (bukan class_materials milik pengajar).';
comment on column public.student_notes.shared_with_teacher is
  'student-workspace-v1: true = pengajar kelas ini boleh membaca catatan (default privat).';

create index if not exists idx_student_notes_student on public.student_notes (student_id, updated_at desc);
create index if not exists idx_student_notes_reg on public.student_notes (registration_id) where registration_id is not null;

-- ── student_tasks ────────────────────────────────────────────────────────────
create table if not exists public.student_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete set null,
  note_id uuid references public.student_notes(id) on delete set null,
  title text not null,
  detail text,
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  -- 'siswa' = dibuat sendiri; 'pengajar' = PR yang ditugaskan pengajar
  source text not null default 'siswa',
  created_by uuid,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.student_tasks is
  'student-workspace-v1: daftar tugas/PR siswa. source=pengajar → ditugaskan pengajar dari dashboardnya.';

create index if not exists idx_student_tasks_student on public.student_tasks (student_id, done, due_date);
create index if not exists idx_student_tasks_reg on public.student_tasks (registration_id) where registration_id is not null;

-- ── student_focus_sessions (Pomodoro) ────────────────────────────────────────
create table if not exists public.student_focus_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  registration_id uuid references public.registrations(id) on delete set null,
  note_id uuid references public.student_notes(id) on delete set null,
  label text,
  planned_minutes integer not null default 25,
  focus_seconds integer not null default 0,
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.student_focus_sessions is
  'student-workspace-v1: log sesi fokus (Pomodoro) Mode Belajar Sendiri.';

create index if not exists idx_student_focus_student on public.student_focus_sessions (student_id, started_at desc);

-- ── updated_at otomatis ──────────────────────────────────────────────────────
create or replace function public.tg_student_workspace_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_student_notes_touch on public.student_notes;
create trigger trg_student_notes_touch before update on public.student_notes
  for each row execute function public.tg_student_workspace_touch();

drop trigger if exists trg_student_tasks_touch on public.student_tasks;
create trigger trg_student_tasks_touch before update on public.student_tasks
  for each row execute function public.tg_student_workspace_touch();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- current_student_id() = students.id dari email JWT (SECURITY DEFINER, sudah ada).
alter table public.student_notes enable row level security;
alter table public.student_tasks enable row level security;
alter table public.student_focus_sessions enable row level security;

-- Siswa: kelola punya sendiri. USING + WITH CHECK dua-duanya (USING saja tidak
-- menjaga INSERT/UPDATE — lihat catatan rls-update-with-check-wajib).
drop policy if exists "Student manage own notes" on public.student_notes;
create policy "Student manage own notes" on public.student_notes
  for all using (student_id = public.current_student_id())
  with check (student_id = public.current_student_id());

drop policy if exists "Student manage own tasks" on public.student_tasks;
create policy "Student manage own tasks" on public.student_tasks
  for all using (student_id = public.current_student_id())
  with check (student_id = public.current_student_id());

drop policy if exists "Student manage own focus" on public.student_focus_sessions;
create policy "Student manage own focus" on public.student_focus_sessions
  for all using (student_id = public.current_student_id())
  with check (student_id = public.current_student_id());

-- Pengajar: BACA catatan yang siswanya bagikan, di kelas yang dia pegang saja.
drop policy if exists "Teacher read shared notes" on public.student_notes;
create policy "Teacher read shared notes" on public.student_notes
  for select using (
    shared_with_teacher
    and registration_id in (
      select r.id from public.registrations r
      where r.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
    )
  );

-- Pengajar: lihat & tugaskan PR di kelasnya sendiri.
drop policy if exists "Teacher read class tasks" on public.student_tasks;
create policy "Teacher read class tasks" on public.student_tasks
  for select using (
    registration_id in (
      select r.id from public.registrations r
      where r.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
    )
  );

drop policy if exists "Teacher assign class tasks" on public.student_tasks;
create policy "Teacher assign class tasks" on public.student_tasks
  for insert with check (
    source = 'pengajar'
    and registration_id in (
      select r.id from public.registrations r
      where r.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
    )
  );

-- Pengajar boleh merapikan PR yang DIA sendiri tugaskan (ubah judul/tenggat/hapus),
-- tapi tidak menyentuh tugas yang dibuat siswa.
drop policy if exists "Teacher edit own assigned tasks" on public.student_tasks;
create policy "Teacher edit own assigned tasks" on public.student_tasks
  for update using (
    source = 'pengajar'
    and registration_id in (
      select r.id from public.registrations r
      where r.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
    )
  ) with check (
    source = 'pengajar'
    and registration_id in (
      select r.id from public.registrations r
      where r.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
    )
  );

drop policy if exists "Teacher delete own assigned tasks" on public.student_tasks;
create policy "Teacher delete own assigned tasks" on public.student_tasks
  for delete using (
    source = 'pengajar'
    and registration_id in (
      select r.id from public.registrations r
      where r.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
    )
  );

-- Staf (owner/admin/kurikulum): akses penuh, sama seperti class_materials.
drop policy if exists "Staff manage student notes" on public.student_notes;
create policy "Staff manage student notes" on public.student_notes
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = any (array['owner','admin','curriculum'])))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = any (array['owner','admin','curriculum'])));

drop policy if exists "Staff manage student tasks" on public.student_tasks;
create policy "Staff manage student tasks" on public.student_tasks
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = any (array['owner','admin','curriculum'])))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = any (array['owner','admin','curriculum'])));

-- ── Bucket berkas siswa ──────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('student-materials', 'student-materials', true)
on conflict (id) do nothing;

drop policy if exists "Student upload own materials" on storage.objects;
create policy "Student upload own materials" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'student-materials' and (storage.foldername(name))[1] = public.current_student_id()::text);

drop policy if exists "Student delete own materials" on storage.objects;
create policy "Student delete own materials" on storage.objects
  for delete to authenticated
  using (bucket_id = 'student-materials' and (storage.foldername(name))[1] = public.current_student_id()::text);

drop policy if exists "Public read student materials" on storage.objects;
create policy "Public read student materials" on storage.objects
  for select using (bucket_id = 'student-materials');
