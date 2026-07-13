-- Deck flashcard Watch & Learn — deck tematik AI, deck dari kosakata video, dan
-- deck buatan siswa yang bisa DIBAGIKAN ke komunitas (kontributor tampil).
--
-- Kenapa:
--   1) Selama ini flashcard hanya kata yang disimpan saat menonton (localStorage,
--      privat per browser). Deck komunitas butuh penyimpanan server + identitas
--      pemilik → dua tabel baru: `wl_decks` (metadata) + `wl_deck_cards` (isi).
--   2) `owner_name` didenormalisasi di wl_decks (diisi klien dari user_metadata)
--      supaya daftar deck komunitas tak perlu join ke auth.users (yang memang
--      tak boleh dibaca anon/authenticated).
--
-- RLS:
--   • wl_decks   : SELECT deck publik ATAU milik sendiri; INSERT/UPDATE/DELETE
--                  hanya pemilik (owner_id = auth.uid()).
--   • wl_deck_cards: mengikuti deck induknya.
--
-- JALANKAN MANUAL di Supabase SQL editor (project jbtgciepdmqxxcjflrxz). Idempotent.

-- 1) Metadata deck
create table if not exists public.wl_decks (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  owner_name  text not null default '',
  lang_code   text not null,
  title       text not null,
  description text not null default '',
  theme       text not null default '',
  -- asal deck: 'ai' (generate tematik), 'video' (kosakata dari video), 'custom' (manual)
  source      text not null default 'custom' check (source in ('ai', 'video', 'custom')),
  is_public   boolean not null default false,
  card_count  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists wl_decks_lang_public_idx
  on public.wl_decks (lang_code, is_public, created_at desc);
create index if not exists wl_decks_owner_idx
  on public.wl_decks (owner_id, created_at desc);

-- 2) Isi kartu deck
create table if not exists public.wl_deck_cards (
  id       uuid primary key default gen_random_uuid(),
  deck_id  uuid not null references public.wl_decks (id) on delete cascade,
  position integer not null default 0,
  word     text not null,
  meaning  text not null default '',
  example  text not null default '',
  translit text not null default ''
);

create index if not exists wl_deck_cards_deck_idx
  on public.wl_deck_cards (deck_id, position);

-- 3) RLS
alter table public.wl_decks enable row level security;
alter table public.wl_deck_cards enable row level security;

drop policy if exists "wl_decks_select" on public.wl_decks;
create policy "wl_decks_select" on public.wl_decks
  for select to authenticated
  using (is_public or owner_id = auth.uid());

drop policy if exists "wl_decks_insert" on public.wl_decks;
create policy "wl_decks_insert" on public.wl_decks
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "wl_decks_update" on public.wl_decks;
create policy "wl_decks_update" on public.wl_decks
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "wl_decks_delete" on public.wl_decks;
create policy "wl_decks_delete" on public.wl_decks
  for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "wl_deck_cards_select" on public.wl_deck_cards;
create policy "wl_deck_cards_select" on public.wl_deck_cards
  for select to authenticated
  using (exists (
    select 1 from public.wl_decks d
    where d.id = deck_id and (d.is_public or d.owner_id = auth.uid())
  ));

drop policy if exists "wl_deck_cards_insert" on public.wl_deck_cards;
create policy "wl_deck_cards_insert" on public.wl_deck_cards
  for insert to authenticated
  with check (exists (
    select 1 from public.wl_decks d
    where d.id = deck_id and d.owner_id = auth.uid()
  ));

drop policy if exists "wl_deck_cards_delete" on public.wl_deck_cards;
create policy "wl_deck_cards_delete" on public.wl_deck_cards
  for delete to authenticated
  using (exists (
    select 1 from public.wl_decks d
    where d.id = deck_id and d.owner_id = auth.uid()
  ));
