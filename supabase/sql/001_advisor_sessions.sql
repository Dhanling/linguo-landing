-- 001_advisor_sessions.sql — [ai-funnel-v1]
-- Konsultan Linguo (/konsultasi) + MCP server (/api/mcp).
--
-- JALANKAN MANUAL di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).
-- Idempoten: aman dijalankan ulang.
--
-- Lead-nya sendiri TIDAK butuh tabel baru: masuk ke `public.leads` yang sudah
-- ada (source = 'web_advisor' / 'mcp'), jadi langsung tampil di halaman Leads
-- admin. Dua tabel di bawah hanya untuk rincian rencana + metrik funnel.
-- Kode di landing FAIL-OPEN: sebelum file ini dijalankan, lead tetap tersimpan,
-- hanya rincian & event yang belum tercatat.
--
-- Akses: tulis HANYA lewat server (service role, bypass RLS). Baca hanya
-- owner/admin/sales. Tidak ada policy untuk anon/authenticated biasa —
-- ingat: siswa yang login juga "authenticated" di project ini.

begin;

-- ── Ringkasan per sesi konsultasi ──────────────────────────────────────────
create table if not exists public.advisor_sessions (
  id                  uuid primary key,              -- sessionId dari klien
  channel             text not null default 'web' check (channel in ('web','mcp','wa')),
  language            text,
  target_level        text,
  program             text,
  estimated_cost_idr  bigint,
  answers             jsonb,                         -- argumen estimate_learning_plan
  plan                jsonb,                         -- hasil estimate_learning_plan
  lead_id             text,                          -- leads.id (tanpa FK: lead boleh dihapus admin)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists advisor_sessions_created_idx on public.advisor_sessions (created_at desc);
create index if not exists advisor_sessions_lead_idx on public.advisor_sessions (lead_id);

-- ── Event metrik funnel ────────────────────────────────────────────────────
create table if not exists public.advisor_events (
  id          bigint generated always as identity primary key,
  session_id  uuid,
  channel     text not null default 'web' check (channel in ('web','mcp','wa')),
  event       text not null check (event in (
                'advisor_started','advisor_plan_generated','advisor_cta_clicked','advisor_lead_saved')),
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists advisor_events_created_idx on public.advisor_events (created_at desc);
create index if not exists advisor_events_event_idx on public.advisor_events (event, created_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.advisor_sessions enable row level security;
alter table public.advisor_events   enable row level security;

revoke all on public.advisor_sessions from anon, authenticated;
revoke all on public.advisor_events   from anon, authenticated;
grant select on public.advisor_sessions to authenticated;
grant select on public.advisor_events   to authenticated;

drop policy if exists advisor_sessions_staff_read on public.advisor_sessions;
create policy advisor_sessions_staff_read on public.advisor_sessions
  for select to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.role in ('owner','admin','sales')));

drop policy if exists advisor_events_staff_read on public.advisor_events;
create policy advisor_events_staff_read on public.advisor_events
  for select to authenticated
  using (exists (select 1 from public.profiles p
                  where p.id = auth.uid() and p.role in ('owner','admin','sales')));

commit;

-- ── Cek cepat setelah jalan ─────────────────────────────────────────────────
-- select event, channel, count(*) from public.advisor_events group by 1,2 order by 1;
-- select source, count(*), min(created_at) from public.leads
--  where source in ('web_advisor','mcp') group by 1;
--
-- Perbandingan ala Fiverr (konversi & nilai paket AI vs pendaftaran biasa),
-- setelah lead dikonversi jadi registrasi lewat halaman Leads:
-- select l.source, count(*) leads,
--        count(*) filter (where l.payment_status = 'Lunas') lunas,
--        round(avg(l.amount) filter (where l.payment_status = 'Lunas')) avg_amount
--   from public.leads l
--  where l.created_at > now() - interval '30 days'
--  group by 1 order by 2 desc;
