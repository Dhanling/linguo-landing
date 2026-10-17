-- [kelas-b2b-pratinjau-v1] 17 Okt 2026 — kelas B2B ikut tampil di POV siswa (/akun?preview=).
--
-- my_corporate_classes / my_corporate_class_sessions mencocokkan EMAIL SESI (auth.jwt()),
-- jadi pratinjau staf (tanpa login siswa) selalu kosong: Abdul Aziz (peserta Alfamart ×
-- Vietnam) tampil "Belum ada kelas live aktif". Logikanya dipindah ke dua fungsi ber-
-- parameter email yang HANYA boleh dipanggil service_role (/api/preview-student); fungsi
-- my_* tinggal membungkusnya dengan email sesi, perilakunya tak berubah.
-- Idempoten — aman dijalankan ulang.

create or replace function public.corporate_classes_by_email(p_email text)
returns table (
  lead_id uuid, company_name text, language text, level text,
  sessions_total int, sessions_used int, class_status text,
  teacher_id uuid, teacher_name text, teacher_title text, teacher_avatar_url text
)
language sql stable security definer set search_path = public
as $$
  with me as (select lower(trim(coalesce(p_email, ''))) as email)
  select distinct on (l.id)
    l.id, l.company_name, coalesce(l.languages[1], ''), l.level,
    coalesce(l.total_sessions, 0)::int,
    greatest(
      coalesce(l.sessions_completed, 0),
      (select count(*) from schedules s where s.corporate_lead_id = l.id and s.status = 'completed')
    )::int,
    l.class_status, t.id, t.name, t.title, t.avatar_url
  from me
  join corporate_participants p
    on me.email <> ''
   and me.email = any (array(select lower(trim(e)) from unnest(string_to_array(coalesce(p.email, ''), '//')) e))
  join corporate_leads l on l.id = p.lead_id
  left join teachers t on t.id = l.assigned_teacher_id
  where l.archived_at is null and l.status = 'deal'
    and coalesce(l.service_type, 'training') = 'training'
  order by l.id;
$$;

create or replace function public.corporate_class_sessions_by_email(p_email text)
returns table (
  lead_id uuid, class_no int, sumber text, id uuid, scheduled_at timestamptz,
  duration_minutes int, status text, session_number int, session_title text,
  material_notes text, material_links jsonb, recording_url text, materials jsonb
)
language sql stable security definer set search_path = public
as $$
  with leads as (select c.lead_id as id from public.corporate_classes_by_email(p_email) c)
  select
    s.corporate_lead_id, s.corporate_class_no, 'schedule', s.id, s.scheduled_at,
    s.duration_minutes, s.status, s.session_number, s.session_title, s.material_notes,
    to_jsonb(s.material_links), s.recording_url,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', cm.id, 'schedule_id', cm.schedule_id, 'title', cm.title, 'kind', cm.kind,
        'url', cm.url, 'note', cm.note, 'content', cm.content, 'created_at', cm.created_at
      ) order by cm.created_at desc)
      from class_materials cm where cm.schedule_id = s.id
    ), '[]'::jsonb)
  from schedules s
  join leads on leads.id = s.corporate_lead_id
  union all
  select
    a.lead_id, null::int, 'attendance', a.id,
    (a.session_date::timestamp at time zone 'Asia/Jakarta'),
    null::int, 'completed', a.session_number, a.session_topic,
    null::text, null::jsonb, null::text, '[]'::jsonb
  from corporate_attendance a
  join leads on leads.id = a.lead_id
  where not exists (select 1 from schedules s2 where s2.corporate_lead_id = a.lead_id);
$$;

revoke all on function public.corporate_classes_by_email(text) from public, anon, authenticated;
revoke all on function public.corporate_class_sessions_by_email(text) from public, anon, authenticated;
grant execute on function public.corporate_classes_by_email(text) to service_role;
grant execute on function public.corporate_class_sessions_by_email(text) to service_role;

-- Jalur siswa login: pembungkus tipis dengan email sesi.
create or replace function public.my_corporate_classes()
returns table (
  lead_id uuid, company_name text, language text, level text,
  sessions_total int, sessions_used int, class_status text,
  teacher_id uuid, teacher_name text, teacher_title text, teacher_avatar_url text
)
language sql stable security definer set search_path = public
as $$ select * from public.corporate_classes_by_email(auth.jwt() ->> 'email'); $$;

create or replace function public.my_corporate_class_sessions()
returns table (
  lead_id uuid, class_no int, sumber text, id uuid, scheduled_at timestamptz,
  duration_minutes int, status text, session_number int, session_title text,
  material_notes text, material_links jsonb, recording_url text, materials jsonb
)
language sql stable security definer set search_path = public
as $$ select * from public.corporate_class_sessions_by_email(auth.jwt() ->> 'email'); $$;

revoke all on function public.my_corporate_classes() from public, anon;
revoke all on function public.my_corporate_class_sessions() from public, anon;
grant execute on function public.my_corporate_classes() to authenticated;
grant execute on function public.my_corporate_class_sessions() to authenticated;
