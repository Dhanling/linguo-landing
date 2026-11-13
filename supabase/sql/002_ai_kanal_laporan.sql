-- 002_ai_kanal_laporan.sql — [ai-kanal-v1]
-- Laporan bulanan "Kanal AI": berapa orang datang dari ChatGPT / Perplexity /
-- Claude / Gemini / dst, berapa yang pakai MCP (dibedakan ChatGPT vs Claude),
-- berapa yang jadi lead, bayar, dan omzetnya.
--
-- JALANKAN MANUAL di Supabase SQL Editor SETELAH 001_advisor_sessions.sql.
-- Idempoten: aman dijalankan ulang.
--
-- Sumber data (semua sudah ada):
--   landing_page_events   kunjungan web (referrer + utm_source)
--   ad_attributions       jejak asal per nomor WA/email (diisi tiap form)
--   advisor_events        Konsultan web & MCP (channel, meta.client / meta.ai_source)
--   leads                 lead (source web_advisor / mcp)
--   sales_paid()          SATU definisi penjualan Lunas (dipakai laporan penjualan)

begin;

-- ── 1. Event baru dari MCP ─────────────────────────────────────────────────
alter table public.advisor_events drop constraint if exists advisor_events_event_check;
alter table public.advisor_events add constraint advisor_events_event_check check (event in (
  'advisor_started','advisor_plan_generated','advisor_cta_clicked','advisor_lead_saved',
  'mcp_connected','mcp_tool_called'));

create index if not exists advisor_events_channel_idx on public.advisor_events (channel, created_at desc);

-- ── 2. Label sumber AI dari utm_source + referrer ───────────────────────────
-- Cermin src/lib/advisor/aiSource.ts (aiSourceFromVisit) di repo landing.
-- ChatGPT menempelkan ?utm_source=chatgpt.com ke link yang diklik.
create or replace function public.ai_source_label(p_utm_source text, p_referrer text)
returns text
language sql
immutable
as $$
  select case
    when s ~ '(chatgpt|openai)'           then 'ChatGPT'
    when s ~ 'perplexity'                 then 'Perplexity'
    when s ~ '(claude|anthropic)'         then 'Claude'
    when s ~ '(gemini|bard\.google)'      then 'Gemini'
    when s ~ '(copilot|bing\.com/chat)'   then 'Copilot'
    when s ~ 'deepseek'                   then 'DeepSeek'
    when s ~ '(grok|//x\.ai)'             then 'Grok'
    when s ~ 'meta\.ai'                   then 'Meta AI'
    when s ~ '(you\.com|phind|kagi)'      then 'AI lain'
  end
  from (select lower(coalesce(p_utm_source, '') || ' ' || coalesce(p_referrer, '')) as s) x
$$;

-- ── 3. RPC laporan bulanan ─────────────────────────────────────────────────
-- Baris = (bulan, kanal, sumber). Kanal:
--   'Web'        pengunjung yang klik link Linguo di jawaban AI
--   'MCP'        asisten AI yang memakai Linguo sebagai tool (ChatGPT, Claude, …)
--   'Konsultan'  pemakai /konsultasi, dipecah per asal pengunjung
--   'Semua'      total penjualan semua sumber (pembanding rata-rata nilai)
-- Kanal BISA tumpang tindih (orang dari ChatGPT yang memakai /konsultasi
-- terhitung di Web dan Konsultan) — jangan dijumlah antarkanal.
create or replace function public.ai_channel_monthly(p_months int default 6)
returns table (
  bulan          date,
  kanal          text,
  sumber         text,
  sesi           bigint,
  panggilan_tool bigint,
  rencana        bigint,
  lead           bigint,
  bayar          bigint,
  omzet          numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_since_local timestamp := date_trunc('month', now() at time zone 'Asia/Jakarta')
                             - make_interval(months => greatest(least(coalesce(p_months, 6), 24), 1) - 1);
  v_since timestamptz := v_since_local at time zone 'Asia/Jakarta';
begin
  if not exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.role in ('owner','admin','sales','social_media')
  ) then
    raise exception 'Hanya staf' using errcode = '42501';
  end if;

  return query
  with
  sales as (
    select s.kind, s.ref_id, s.paid_at, s.amount, s.buyer_phone, s.buyer_email, s.attr_id
      from public.sales_paid(v_since, now()) s
  ),
  -- Web: kunjungan dari AI ---------------------------------------------------
  web_visits as (
    select date_trunc('month', e.created_at at time zone 'Asia/Jakarta')::date as bulan,
           public.ai_source_label(e.utm_source, e.referrer) as sumber,
           count(distinct e.session_id) as n
      from public.landing_page_events e
     where e.created_at >= v_since
       and public.ai_source_label(e.utm_source, e.referrer) is not null
     group by 1, 2
  ),
  attr as (
    select a.id, a.phone_norm, a.email_norm,
           public.ai_source_label(a.utm_source, a.referrer) as sumber
      from public.ad_attributions a
     where public.ai_source_label(a.utm_source, a.referrer) is not null
  ),
  web_leads as (
    select date_trunc('month', l.created_at at time zone 'Asia/Jakarta')::date as bulan,
           t.sumber, count(distinct l.id) as n
      from public.leads l
      join attr t on (l.wa_number is not null and t.phone_norm = public.norm_phone_key(l.wa_number))
                  or (l.email is not null and t.email_norm = public.norm_email_key(l.email))
     where l.created_at >= v_since
       and coalesce(l.source, '') <> 'mcp'
     group by 1, 2
  ),
  web_sales as (
    select date_trunc('month', s.paid_at at time zone 'Asia/Jakarta')::date as bulan,
           t.sumber, count(*) as n, sum(s.amount) as amt
      from sales s join attr t on t.id = s.attr_id
     group by 1, 2
  ),
  -- Konsultan & MCP: event ----------------------------------------------------
  ev as (
    select date_trunc('month', e.created_at at time zone 'Asia/Jakarta')::date as bulan,
           e.channel, e.event, e.session_id,
           case when e.channel = 'mcp'
                then coalesce(e.meta->>'client', e.meta->>'via', 'Tidak diketahui')
                else coalesce(e.meta->>'ai_source', e.meta->>'via', 'Bukan dari AI') end as sumber
      from public.advisor_events e
     where e.created_at >= v_since
  ),
  ev_agg as (
    select bulan, case when channel = 'mcp' then 'MCP' else 'Konsultan' end as kanal, sumber,
           case when channel = 'mcp'
                then count(distinct session_id) filter (where event = 'mcp_connected')
                else count(distinct session_id) filter (where event = 'advisor_started') end as sesi,
           count(*) filter (where event = 'mcp_tool_called') as panggilan_tool,
           count(*) filter (where event = 'advisor_plan_generated') as rencana,
           count(*) filter (where event = 'advisor_lead_saved') as lead
      from ev group by 1, 2, 3, channel
  ),
  -- Lead AI → penjualan (cocokkan nomor WA lead dengan pembeli) -------------
  adv_leads as (
    select l.wa_number,
           case when l.source = 'mcp' then 'MCP' else 'Konsultan' end as kanal,
           coalesce(x.meta->>'client', x.meta->>'via',
                    case when l.source = 'mcp' then 'Tidak diketahui' else 'Bukan dari AI' end) as sumber
      from public.leads l
      left join lateral (
        select e.meta from public.advisor_events e
         where e.event = 'advisor_lead_saved' and e.meta->>'lead_id' = l.id::text
         limit 1
      ) x on true
     where l.source in ('mcp', 'web_advisor') and l.wa_number is not null
  ),
  adv_sales as (
    select date_trunc('month', z.paid_at at time zone 'Asia/Jakarta')::date as bulan,
           z.kanal, z.sumber, count(*) as n, sum(z.amount) as amt
      from (
        select distinct on (s.kind, s.ref_id) s.paid_at, s.amount, al.kanal, al.sumber
          from sales s
          join adv_leads al on public.norm_phone_key(al.wa_number) = public.norm_phone_key(s.buyer_phone)
         order by s.kind, s.ref_id
      ) z
     group by 1, 2, 3
  ),
  all_sales as (
    select date_trunc('month', s.paid_at at time zone 'Asia/Jakarta')::date as bulan,
           count(*) as n, sum(s.amount) as amt
      from sales s group by 1
  ),
  semua_baris as (
    select bulan, 'Web'::text as kanal, sumber, n as sesi, 0::bigint as panggilan_tool, 0::bigint as rencana,
           0::bigint as lead, 0::bigint as bayar, 0::numeric as omzet from web_visits
    union all select bulan, 'Web', sumber, 0, 0, 0, n, 0, 0 from web_leads
    union all select bulan, 'Web', sumber, 0, 0, 0, 0, n, amt from web_sales
    union all select bulan, kanal, sumber, sesi, panggilan_tool, rencana, lead, 0, 0 from ev_agg
    union all select bulan, kanal, sumber, 0, 0, 0, 0, n, amt from adv_sales
    union all select bulan, 'Semua', 'Semua sumber', 0, 0, 0, 0, n, amt from all_sales
  )
  select r.bulan, r.kanal, r.sumber,
         sum(r.sesi)::bigint, sum(r.panggilan_tool)::bigint, sum(r.rencana)::bigint,
         sum(r.lead)::bigint, sum(r.bayar)::bigint, coalesce(sum(r.omzet), 0)::numeric
    from semua_baris r
   group by r.bulan, r.kanal, r.sumber
   order by r.bulan desc, r.kanal, sum(r.sesi) desc, r.sumber;
end;
$$;

revoke all on function public.ai_channel_monthly(int) from public, anon;
grant execute on function public.ai_channel_monthly(int) to authenticated;

commit;

-- ── Cek ─────────────────────────────────────────────────────────────────────
-- Fungsi ini menolak pemanggil non-staf, jadi dari SQL Editor (tanpa login)
-- cek bagian-bagiannya langsung:
-- select public.ai_source_label('chatgpt.com', null), public.ai_source_label(null, 'https://www.perplexity.ai/');
-- select event, channel, meta->>'client' client, count(*) from public.advisor_events group by 1,2,3 order by 1;
