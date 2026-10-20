-- [lingwords-v1] Lingwords — dompet kosakata siswa (lintas perangkat) + log aktivitas harian.
--
-- Sampai sekarang kata simpanan Watch & Learn cuma hidup di localStorage, jadi ganti
-- HP = progres kosakata hilang, dan tak ada riwayat untuk grafik. Tabel ini salinan
-- server-nya: klien (src/lib/lingwords.ts) menyinkronkan kata lokal lewat RPC
-- lingwords_sync, lalu membaca balik semua kata milik siswa dari perangkat mana pun.
--
-- Semua akses lewat auth.uid() — siswa hanya bisa membaca & menulis barisnya sendiri.
-- Aman dijalankan ulang (IF NOT EXISTS / CREATE OR REPLACE).

create table if not exists public.student_words (
  user_id      uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  lang         text        not null,                 -- kode ISO 639-1 ('ja', 'en', …)
  word_key     text        not null,                 -- lower(trim(word)) — kunci kembar
  word         text        not null,
  meaning      text,
  translit     text,
  source       text        not null default 'simpanan', -- simpanan | materi | lingnote | ebook
  stage        text        not null default 'dikenal'
                 check (stage in ('dikenal', 'dilatih', 'dikuasai')),
  first_seen   timestamptz not null default now(),
  mastered_at  timestamptz,                          -- pertama kali tercatat dikuasai
  last_active  timestamptz,                          -- review terakhir
  updated_at   timestamptz not null default now(),
  primary key (user_id, lang, word_key)
);

create index if not exists student_words_user_idx on public.student_words (user_id, lang);

alter table public.student_words enable row level security;

drop policy if exists student_words_select on public.student_words;
create policy student_words_select on public.student_words
  for select to authenticated using (user_id = auth.uid());

drop policy if exists student_words_insert on public.student_words;
create policy student_words_insert on public.student_words
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists student_words_update on public.student_words;
create policy student_words_update on public.student_words
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists student_words_delete on public.student_words;
create policy student_words_delete on public.student_words
  for delete to authenticated using (user_id = auth.uid());

-- Aktivitas harian (bahan heatmap & hari beruntun): berapa kartu yang direview per hari.
create table if not exists public.student_word_activity (
  user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day      date not null,
  lang     text not null,
  n        int  not null default 0,
  primary key (user_id, day, lang)
);

alter table public.student_word_activity enable row level security;

drop policy if exists student_word_activity_select on public.student_word_activity;
create policy student_word_activity_select on public.student_word_activity
  for select to authenticated using (user_id = auth.uid());

drop policy if exists student_word_activity_insert on public.student_word_activity;
create policy student_word_activity_insert on public.student_word_activity
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists student_word_activity_update on public.student_word_activity;
create policy student_word_activity_update on public.student_word_activity
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Sinkron batch kata dari perangkat. Aturan gabung:
--   * first_seen  = yang paling awal, mastered_at = yang paling awal (tak pernah dihapus)
--   * stage/meaning ikut perangkat yang review-nya paling baru (last_active terbesar)
create or replace function public.lingwords_sync(p_words jsonb)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_n   int;
begin
  if v_uid is null then
    raise exception 'harus login';
  end if;
  if jsonb_typeof(p_words) <> 'array' or jsonb_array_length(p_words) > 1000 then
    raise exception 'p_words harus array maks 1000';
  end if;

  insert into public.student_words as s
    (user_id, lang, word_key, word, meaning, translit, source, stage, first_seen, mastered_at, last_active, updated_at)
  select v_uid,
         lower(left(w->>'lang', 12)),
         lower(btrim(left(w->>'word', 200))),
         btrim(left(w->>'word', 200)),
         nullif(left(w->>'meaning', 500), ''),
         nullif(left(w->>'translit', 200), ''),
         coalesce(nullif(w->>'source', ''), 'simpanan'),
         case when w->>'stage' in ('dikenal', 'dilatih', 'dikuasai') then w->>'stage' else 'dikenal' end,
         coalesce((w->>'first_seen')::timestamptz, now()),
         (w->>'mastered_at')::timestamptz,
         (w->>'last_active')::timestamptz,
         now()
  from jsonb_array_elements(p_words) w
  where coalesce(btrim(w->>'word'), '') <> '' and coalesce(w->>'lang', '') <> ''
  on conflict (user_id, lang, word_key) do update set
    first_seen  = least(s.first_seen, excluded.first_seen),
    mastered_at = case
                    when s.mastered_at is null then excluded.mastered_at
                    when excluded.mastered_at is null then s.mastered_at
                    else least(s.mastered_at, excluded.mastered_at) end,
    stage       = case when coalesce(excluded.last_active, 'epoch') >= coalesce(s.last_active, 'epoch')
                       then excluded.stage else s.stage end,
    meaning     = coalesce(excluded.meaning, s.meaning),
    translit    = coalesce(excluded.translit, s.translit),
    last_active = greatest(s.last_active, excluded.last_active),
    updated_at  = now();

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- +n kartu direview hari ini (zona waktu WIB).
create or replace function public.lingwords_tick(p_lang text, p_n int default 1)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.student_word_activity (user_id, day, lang, n)
  values (auth.uid(), (now() at time zone 'Asia/Jakarta')::date, lower(left(p_lang, 12)), greatest(1, least(p_n, 500)))
  on conflict (user_id, day, lang) do update set n = public.student_word_activity.n + excluded.n;
$$;

grant select, insert, update, delete on public.student_words to authenticated;
grant select, insert, update on public.student_word_activity to authenticated;
grant execute on function public.lingwords_sync(jsonb) to authenticated;
grant execute on function public.lingwords_tick(text, int) to authenticated;

notify pgrst, 'reload schema';
