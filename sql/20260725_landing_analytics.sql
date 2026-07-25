-- landing-analytics-v1
-- Tracker analytics website landing (linguo.id): catat halaman apa yang dibuka
-- pengunjung + berapa lama waktu dihabiskan (dwell time) per kunjungan, supaya
-- di admin dashboard kelihatan fitur/produk mana paling menarik calon siswa.
--
-- Kenapa:
--   • GA4 + FB Pixel yang sudah ada tak menyimpan data ke Supabase & tak melacak
--     durasi kunjungan (App Router juga tak auto-track navigasi client-side).
--   • Landing menulis event (via /api/track service_role), dashboard membacanya.
--
-- Alur tulis: browser --sendBeacon--> /api/track (service_role, bypass RLS)
--             --> INSERT landing_page_events.
-- Alur baca : dashboard (anon key + sesi admin) --RPC--> agregasi.
--
-- JALANKAN MANUAL di Supabase SQL editor (project jbtgciepdmqxxcjflrxz). Idempotent.

-- 1) Tabel event
create table if not exists public.landing_page_events (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,                 -- id anonim per-perangkat (sessionStorage)
  path        text not null,                 -- mis. /kelas/jepang
  title       text not null default '',
  referrer    text not null default '',
  duration_ms integer not null default 0,    -- lama di halaman (ms)
  device      text not null default '',      -- 'mobile' / 'desktop'
  created_at  timestamptz not null default now()
);

create index if not exists landing_page_events_created_idx
  on public.landing_page_events (created_at desc);
create index if not exists landing_page_events_path_idx
  on public.landing_page_events (path, created_at desc);

-- 2) RLS: tak ada policy INSERT (service_role bypass); hanya SELECT untuk staff.
alter table public.landing_page_events enable row level security;

drop policy if exists landing_page_events_admin_read on public.landing_page_events;
create policy landing_page_events_admin_read on public.landing_page_events
  for select to authenticated
  using (public.is_app_admin());   -- helper existing: profiles.role in ('owner','admin')

-- 3) RPC agregasi (SECURITY DEFINER + guard is_app_admin di dalam).

-- 3a) Statistik per halaman (fitur terpopuler + rata-rata durasi).
create or replace function public.get_landing_page_stats(p_days integer default 30)
returns table (
  path            text,
  views           bigint,
  sessions        bigint,
  avg_duration_ms numeric
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select e.path,
         count(*)::bigint                        as views,
         count(distinct e.session_id)::bigint    as sessions,
         round(avg(e.duration_ms))::numeric      as avg_duration_ms
  from public.landing_page_events e
  where e.created_at >= now() - make_interval(days => p_days)
  group by e.path
  order by views desc;
end;
$$;

grant execute on function public.get_landing_page_stats(integer) to authenticated;

-- 3b) Tren harian (views + sesi unik per hari, timezone WIB).
create or replace function public.get_landing_daily_views(p_days integer default 30)
returns table (
  day      date,
  views    bigint,
  sessions bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'not authorized';
  end if;
  return query
  select (e.created_at at time zone 'Asia/Jakarta')::date as day,
         count(*)::bigint                     as views,
         count(distinct e.session_id)::bigint as sessions
  from public.landing_page_events e
  where e.created_at >= now() - make_interval(days => p_days)
  group by day
  order by day;
end;
$$;

grant execute on function public.get_landing_daily_views(integer) to authenticated;
