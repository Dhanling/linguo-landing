-- [lingbook-cms] Skema CMS kurikulum Lingbook — jalankan MANUAL di Supabase
-- (SQL Editor project jbtgciepdmqxxcjflrxz). Aman diulang (idempotent).
--
-- Tujuan:
--   Memindahkan konten buku/bab Lingbook dari file TS (src/data/lingbook/*) ke DB,
--   agar bisa dikelola lewat CMS di admin dashboard (halaman "Lingbook").
--   Konten bab disimpan sebagai JSONB yang PERSIS mengikuti tipe `Chapter`/`Book`
--   di src/data/lingbook/types.ts → reader tinggal fetch tanpa transformasi.
--
-- Keamanan (RLS):
--   • SELECT publik HANYA untuk baris published=true (siswa membaca via anon key).
--   • Tulis (insert/update/delete) HANYA untuk profiles.role ∈ ('admin','owner').
--   Reader landing punya FALLBACK ke file TS → fitur tetap jalan walau tabel kosong.

-- ── Helper: apakah user saat ini admin/owner ───────────────────────────────
create or replace function public.is_lingbook_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'owner')
  );
$$;

-- ── Buku ────────────────────────────────────────────────────────────────────
create table if not exists public.lingbook_books (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  -- { speechLang, name, nativeName, script } — cocok dgn Book.language
  language      jsonb not null default '{}'::jsonb,
  level         text not null default '',
  description   text,
  accent        text,
  cover_glyph   text,
  chapter_count integer not null default 0,
  -- ChapterSummary[] (daftar isi). Bisa di-generate dari chapters, tapi disimpan
  -- eksplisit agar admin bisa atur urutan/status tampil.
  toc           jsonb not null default '[]'::jsonb,
  sort          integer not null default 0,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Bab / Unit ──────────────────────────────────────────────────────────────
create table if not exists public.lingbook_chapters (
  id             uuid primary key default gen_random_uuid(),
  book_id        uuid not null references public.lingbook_books(id) on delete cascade,
  slug           text not null,
  label          text not null default '',
  title          text not null default '',
  subtitle       text,
  meta           text,
  -- Record<string, Word>
  glossary       jsonb not null default '{}'::jsonb,
  -- ContentBlock[] (step "Dialog")
  blocks         jsonb not null default '[]'::jsonb,
  -- Struktur unit (opsional) — bila `steps` kosong, reader pakai mode baca datar.
  steps          jsonb not null default '[]'::jsonb,
  objectives     jsonb not null default '[]'::jsonb,
  vocab_refs     jsonb not null default '[]'::jsonb,
  grammar_points jsonb not null default '[]'::jsonb,
  exercises      jsonb not null default '[]'::jsonb,
  test           jsonb not null default '[]'::jsonb,
  roleplay       jsonb not null default '[]'::jsonb,
  sort           integer not null default 0,
  published      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (book_id, slug)
);

create index if not exists lingbook_chapters_book_idx
  on public.lingbook_chapters (book_id, sort);

-- ── updated_at otomatis ─────────────────────────────────────────────────────
create or replace function public.lingbook_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lingbook_books_touch on public.lingbook_books;
create trigger trg_lingbook_books_touch before update on public.lingbook_books
  for each row execute function public.lingbook_touch_updated_at();

drop trigger if exists trg_lingbook_chapters_touch on public.lingbook_chapters;
create trigger trg_lingbook_chapters_touch before update on public.lingbook_chapters
  for each row execute function public.lingbook_touch_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.lingbook_books    enable row level security;
alter table public.lingbook_chapters enable row level security;

-- Baca publik hanya yang published (anon + authenticated).
drop policy if exists lingbook_books_read_published on public.lingbook_books;
create policy lingbook_books_read_published on public.lingbook_books
  for select using (published = true or public.is_lingbook_admin());

drop policy if exists lingbook_chapters_read_published on public.lingbook_chapters;
create policy lingbook_chapters_read_published on public.lingbook_chapters
  for select using (published = true or public.is_lingbook_admin());

-- Tulis hanya admin/owner.
drop policy if exists lingbook_books_admin_write on public.lingbook_books;
create policy lingbook_books_admin_write on public.lingbook_books
  for all using (public.is_lingbook_admin()) with check (public.is_lingbook_admin());

drop policy if exists lingbook_chapters_admin_write on public.lingbook_chapters;
create policy lingbook_chapters_admin_write on public.lingbook_chapters
  for all using (public.is_lingbook_admin()) with check (public.is_lingbook_admin());

-- Catatan seed:
--   Data awal (Unit 1 はじめまして & Unit 3 カフェで) masih hidup sebagai file TS.
--   Migrasi isi ke DB dilakukan lewat CMS (tombol "Impor dari file") atau seed
--   terpisah; reader otomatis pakai DB begitu ada baris published, selain itu
--   jatuh ke file TS. Tidak ada data yang hilang.
