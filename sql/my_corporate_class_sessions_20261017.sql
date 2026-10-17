-- [kelas-b2b-materi-v1] 17 Okt 2026 — linimasa sesi kelas B2B di "Kelas & Materi" (/akun).
--
-- Peserta B2B (corporate_participants) cuma dapat kartu "diam" di Beranda: tak bisa membuka
-- sesi, rekaman, maupun materi dari pengajar. Penyebabnya, semua data itu dibaca dari
-- `schedules` / `class_materials` lewat registration_id milik siswa, sedangkan sesi korporat
-- ber-registration_id NULL (kunci kontraknya schedules.corporate_lead_id) dan peserta B2B
-- tak punya baris registrations sama sekali.
--
-- Fungsi ini membalas sesi kontrak korporat milik pemilik sesi — dicocokkan lewat EMAIL sesi,
-- sama persis dengan my_corporate_classes():
--   • sumber = 'schedule'   → baris schedules (jadwal kalender pengajar) + rekaman + lampiran
--                             class_materials yang ditaut ke sesi itu;
--   • sumber = 'attendance' → kontrak yang belum punya satu pun baris schedules (Alfamart,
--                             Dua Kelinci): riwayat dari grid presensi korporat, supaya peserta
--                             tetap melihat sesi & topik yang sudah jalan.
-- Idempoten — aman dijalankan ulang.

create or replace function public.my_corporate_class_sessions()
returns table (
  lead_id uuid,
  class_no int,
  sumber text,
  id uuid,
  scheduled_at timestamptz,
  duration_minutes int,
  status text,
  session_number int,
  session_title text,
  material_notes text,
  material_links jsonb,
  recording_url text,
  materials jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select lower(trim(coalesce(auth.jwt() ->> 'email', ''))) as email
  ),
  leads as (
    select distinct l.id
    from me
    join corporate_participants p
      on me.email <> ''
     and me.email = any (
       array(select lower(trim(e)) from unnest(string_to_array(coalesce(p.email, ''), '//')) e)
     )
    join corporate_leads l on l.id = p.lead_id
    where l.archived_at is null
      and l.status = 'deal'
      and coalesce(l.service_type, 'training') = 'training'
  )
  select
    s.corporate_lead_id,
    s.corporate_class_no,
    'schedule',
    s.id,
    s.scheduled_at,
    s.duration_minutes,
    s.status,
    s.session_number,
    s.session_title,
    s.material_notes,
    to_jsonb(s.material_links),
    s.recording_url,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', cm.id, 'schedule_id', cm.schedule_id, 'title', cm.title, 'kind', cm.kind,
        'url', cm.url, 'note', cm.note, 'content', cm.content, 'created_at', cm.created_at
      ) order by cm.created_at desc)
      from class_materials cm
      where cm.schedule_id = s.id
    ), '[]'::jsonb)
  from schedules s
  join leads on leads.id = s.corporate_lead_id
  union all
  select
    a.lead_id,
    null::int,
    'attendance',
    a.id,
    (a.session_date::timestamp at time zone 'Asia/Jakarta'),
    null::int,
    'completed',
    a.session_number,
    a.session_topic,
    null::text,
    null::jsonb,
    null::text,
    '[]'::jsonb
  from corporate_attendance a
  join leads on leads.id = a.lead_id
  where not exists (select 1 from schedules s2 where s2.corporate_lead_id = a.lead_id);
$$;

revoke all on function public.my_corporate_class_sessions() from public, anon;
grant execute on function public.my_corporate_class_sessions() to authenticated;
