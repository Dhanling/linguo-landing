-- 003_cek_kunci_leads.sql — [leads-rls-v1] 14 Nov 2026
-- Tujuan: pastikan tabel `leads` (nama + nomor WA calon siswa, termasuk lead dari
-- Konsultan AI & MCP) TIDAK bisa dibaca akun siswa/pengajar yang login.
--
-- Yang BOLEH tetap jalan:
--   - INSERT dari form publik (anon + authenticated) → policy "leads_insert_public"
--     (RegisterModal, /silabus/*/coba, chat). Form ini hanya insert, tak membaca balik.
--   - Staf kantor (is_team(): owner/admin/curriculum/sales/social_media) → "leads_staf_all"
--   - Server (service_role) → tak kena RLS (route /api/advisor/lead, /api/mcp, invoice).
--
-- Yang DIBUANG (kalau masih ada): policy SELECT/ALL lama yang terbuka untuk semua
-- yang login, mis. "Authenticated can read leads".
--
-- JALANKAN MANUAL di Supabase SQL Editor. Idempoten: aman dijalankan ulang.
-- Langkah 1 (cek) boleh dijalankan sendiri dulu — hanya membaca.

-- ── 1. CEK (baca saja) ──────────────────────────────────────────────────────
-- Hasil yang AMAN: hanya 2 baris →
--   leads_insert_public | INSERT | {anon,authenticated} | qual NULL
--   leads_staf_all      | ALL    | {…}                  | qual is_team()
select policyname, cmd, roles, qual, with_check
  from pg_policies
 where schemaname = 'public' and tablename = 'leads'
 order by cmd, policyname;

-- ── 2. KUNCI ────────────────────────────────────────────────────────────────
begin;

alter table public.leads enable row level security;

-- Pastikan policy staf ada (kalau hilang, halaman Leads dashboard kosong).
do $$
begin
  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_staf_all') then
    create policy "leads_staf_all" on public.leads
      for all to authenticated
      using (public.is_team()) with check (public.is_team());
  else
    alter policy "leads_staf_all" on public.leads using (public.is_team()) with check (public.is_team());
  end if;
end $$;

-- Pastikan form publik tetap bisa mengirim lead.
drop policy if exists "leads_insert_public" on public.leads;
create policy "leads_insert_public" on public.leads
  for insert to anon, authenticated
  with check (true);

-- Buang SEMUA policy lain di `leads` (yang lama/terbuka). Staf tetap tercakup
-- leads_staf_all, form publik tercakup leads_insert_public.
do $$
declare r record;
begin
  for r in select policyname from pg_policies
            where schemaname = 'public' and tablename = 'leads'
              and policyname not in ('leads_staf_all', 'leads_insert_public')
  loop
    raise notice 'Membuang policy leads: %', r.policyname;
    execute format('drop policy %I on public.leads', r.policyname);
  end loop;
end $$;

commit;

-- ── 3. CEK ULANG ────────────────────────────────────────────────────────────
-- Harus tinggal 2 baris seperti di langkah 1.
select policyname, cmd, roles, qual
  from pg_policies
 where schemaname = 'public' and tablename = 'leads'
 order by policyname;

-- Bonus: tabel Konsultan/MCP juga harus tertutup (hanya SELECT staf):
select tablename, policyname, cmd, roles, qual
  from pg_policies
 where schemaname = 'public' and tablename in ('advisor_sessions', 'advisor_events')
 order by tablename, policyname;
