-- =============================================================================
-- [placement-bank-acak-v1] Bank soal placement test — soal diambil acak tiap tes
--
-- 1. placement_question_bank: stok soal per bahasa. `payload` = objek soal persis
--    tipe Question di landing (src/data/placement/english.ts) TANPA id & difficulty.
--    Bahasa yang belum punya baris di sini tetap memakai soal tetap di kode.
-- 2. placement_results.question_keys: soal mana yang keluar di tes itu — dipakai
--    supaya tes ulang mengutamakan soal yang belum pernah dikerjakan orang itu.
-- 3. placement_bank_for(): seluruh stok aktif satu bahasa + kapan terakhir tiap
--    soal keluar untuk orang ini (dicocokkan lewat student_id / email / nomor WA,
--    sama seperti my_placement_history). Hanya dipanggil server landing
--    (/api/placement-questions) — kunci jawaban ada di payload.
-- =============================================================================

create table if not exists public.placement_question_bank (
  id            uuid primary key default gen_random_uuid(),
  language_slug text not null,
  qkey          text not null check (qkey ~ '^[a-z0-9-]{1,40}$'),
  difficulty    text not null check (difficulty in ('A1','A2','B1','B2')),
  is_listening  boolean not null default false,
  payload       jsonb not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (language_slug, qkey)
);

alter table public.placement_question_bank enable row level security;

drop policy if exists placement_question_bank_staff on public.placement_question_bank;
create policy placement_question_bank_staff on public.placement_question_bank
  for all to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

alter table public.placement_results
  add column if not exists question_keys text[];

create or replace function public.placement_bank_for(
  p_slug text,
  p_student_id uuid default null,
  p_email text default null,
  p_whatsapp text default null
)
returns table(qkey text, difficulty text, is_listening boolean, payload jsonb, last_seen timestamptz)
language sql stable security definer
set search_path to 'public'
as $$
  with ident as (
    select s.id as sid, lower(s.email) as email, public.placement_norm_phone(s.whatsapp) as phone
      from public.students s
     where p_student_id is not null and s.id = p_student_id
    union all
    select null::uuid, nullif(lower(trim(coalesce(p_email, ''))), ''), public.placement_norm_phone(p_whatsapp)
  ),
  seen as (
    select k as qkey, max(p.created_at) as last_seen
      from public.placement_results p
      cross join lateral unnest(p.question_keys) as k
     where p.question_keys is not null
       and p.language_slug = p_slug
       and exists (
             select 1 from ident i
              where (i.sid is not null and p.student_id = i.sid)
                 or (i.email is not null and p.email is not null and lower(p.email) = i.email)
                 or (i.phone is not null and public.placement_norm_phone(p.whatsapp) = i.phone)
           )
     group by k
  )
  select b.qkey, b.difficulty, b.is_listening, b.payload, s.last_seen
    from public.placement_question_bank b
    left join seen s on s.qkey = b.qkey
   where b.language_slug = p_slug and b.active;
$$;

revoke all on function public.placement_bank_for(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.placement_bank_for(text, uuid, text, text) to service_role;
