-- [lingbook-progress] Persist progres & skor siswa per-bab — jalankan MANUAL di
-- Supabase (SQL Editor project jbtgciepdmqxxcjflrxz). Aman diulang (idempotent).
--
-- Tujuan:
--   Menyimpan kemajuan belajar Lingbook per (user, buku, bab): step unit yang
--   sudah selesai, status bab tuntas, dan skor Test terakhir. Sebelum ini progres
--   hanya state lokal (hilang saat reload). Reader punya FALLBACK localStorage →
--   fitur tetap jalan walau tabel ini belum dibuat / user belum login.
--
-- Keamanan (RLS):
--   Setiap baris milik satu user (user_id = auth.uid()). User hanya bisa
--   baca/tulis barisnya sendiri. Tidak ada akses lintas-user.

-- ── Progres per bab ──────────────────────────────────────────────────────────
create table if not exists public.lingbook_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  book_slug    text not null,
  chapter_slug text not null,
  -- StepId[] yang sudah selesai: 'tujuan'|'dialog'|'vocab'|'grammar'|'latihan'|'test'
  steps_done   text[] not null default '{}',
  is_done      boolean not null default false,
  -- Skor Test terakhir (0–100), null bila belum mengerjakan.
  score        integer,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, book_slug, chapter_slug)
);

create index if not exists lingbook_progress_user_idx
  on public.lingbook_progress (user_id, book_slug);

-- ── updated_at otomatis (pakai helper dari migrasi CMS bila ada) ─────────────
create or replace function public.lingbook_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lingbook_progress_touch on public.lingbook_progress;
create trigger trg_lingbook_progress_touch before update on public.lingbook_progress
  for each row execute function public.lingbook_touch_updated_at();

-- ── RLS: user hanya barisnya sendiri ────────────────────────────────────────
alter table public.lingbook_progress enable row level security;

drop policy if exists lingbook_progress_select_own on public.lingbook_progress;
create policy lingbook_progress_select_own on public.lingbook_progress
  for select using (user_id = auth.uid());

drop policy if exists lingbook_progress_insert_own on public.lingbook_progress;
create policy lingbook_progress_insert_own on public.lingbook_progress
  for insert with check (user_id = auth.uid());

drop policy if exists lingbook_progress_update_own on public.lingbook_progress;
create policy lingbook_progress_update_own on public.lingbook_progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists lingbook_progress_delete_own on public.lingbook_progress;
create policy lingbook_progress_delete_own on public.lingbook_progress
  for delete using (user_id = auth.uid());
