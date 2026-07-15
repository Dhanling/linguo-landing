-- [watch-cue-search-v1] Pencarian kata di transkrip Watch & Learn (ala YouGlish).
--
-- Tujuan: siswa mengetik SATU kata dalam bahasa target → dapat daftar KALIMAT
-- nyata dari video katalog tempat kata itu dipakai, tiap hasil bisa diklik untuk
-- lompat ke detik kata itu diucapkan.
--
-- Kenapa tabel indeks terpisah (bukan langsung cari di yt_transcripts.cues):
-- kolom `cues` JSONB besar & di-TOAST — mencari di dalamnya tiap query = baca
-- seluruh cues tiap video (mahal IO, sensitif buat compute kecil). `yt_cue_index`
-- mendata SATU baris per cue + GIN trigram di `target`, jadi pencarian nabrak
-- indeks (murah) bukan JSONB raksasa. Trigram juga cocok lintas-bahasa termasuk
-- aksara CJK yang batas-katanya kabur.
--
-- Sinkronisasi OTOMATIS lewat trigger di yt_transcripts — worker (Edge Function,
-- deployed-only) tak perlu diubah: begitu ia upsert transkrip, trigger meng-expand
-- cues ke sini. Hapus transkrip → cue-nya ikut terhapus.
--
-- Jalankan sekali di SQL editor Supabase (project jbtgciepdmqxxcjflrxz).

create extension if not exists pg_trgm;

-- ── Tabel indeks cue ─────────────────────────────────────────────────────────
create table if not exists public.yt_cue_index (
  id         bigint generated always as identity primary key,
  video_id   text  not null,
  lang       text  not null,
  cue_start  real  not null,   -- detik mulai (buat seek player)
  cue_end    real,             -- detik selesai
  target     text  not null,   -- kalimat bahasa target
  base       text,             -- terjemahan Indonesia (kalau ada)
  pos        int   not null default 0  -- urutan cue dalam video
);

-- RLS aktif tanpa policy publik (identik pola yt_transcripts): anon tak bisa baca
-- langsung. Pencarian lewat RPC SECURITY DEFINER / service role di API route.
alter table public.yt_cue_index enable row level security;

-- Indeks pencarian: GIN trigram di target (mempercepat ILIKE '%kata%') + btree
-- lang buat menyaring bahasa lebih dulu (bitmap AND).
create index if not exists yt_cue_index_target_trgm
  on public.yt_cue_index using gin (target gin_trgm_ops);
create index if not exists yt_cue_index_lang
  on public.yt_cue_index (lang);
create index if not exists yt_cue_index_video
  on public.yt_cue_index (video_id, lang);

-- ── Sinkronisasi dari yt_transcripts ─────────────────────────────────────────
-- INSERT/UPDATE cues → buang baris lama (video,lang) lalu tanam ulang dari cues.
create or replace function public.sync_yt_cue_index()
returns trigger
language plpgsql
as $$
begin
  delete from public.yt_cue_index
    where video_id = new.video_id and lang = new.lang;

  if jsonb_typeof(new.cues) = 'array' then
    insert into public.yt_cue_index (video_id, lang, cue_start, cue_end, target, base, pos)
    select
      new.video_id,
      new.lang,
      nullif(e.c->>'start', '')::real,
      nullif(e.c->>'end', '')::real,
      e.c->>'target',
      e.c->>'base',
      (e.ord - 1)::int
    from jsonb_array_elements(new.cues) with ordinality as e(c, ord)
    where e.c->>'target' is not null
      and length(e.c->>'target') > 0
      and nullif(e.c->>'start', '') is not null;
  end if;

  return new;
end;
$$;

create or replace function public.del_yt_cue_index()
returns trigger
language plpgsql
as $$
begin
  delete from public.yt_cue_index
    where video_id = old.video_id and lang = old.lang;
  return old;
end;
$$;

drop trigger if exists trg_sync_yt_cue_index on public.yt_transcripts;
create trigger trg_sync_yt_cue_index
  after insert or update of cues on public.yt_transcripts
  for each row execute function public.sync_yt_cue_index();

drop trigger if exists trg_del_yt_cue_index on public.yt_transcripts;
create trigger trg_del_yt_cue_index
  after delete on public.yt_transcripts
  for each row execute function public.del_yt_cue_index();

-- ── Backfill dari transkrip yang sudah ada ───────────────────────────────────
truncate public.yt_cue_index;
insert into public.yt_cue_index (video_id, lang, cue_start, cue_end, target, base, pos)
select
  t.video_id,
  t.lang,
  nullif(e.c->>'start', '')::real,
  nullif(e.c->>'end', '')::real,
  e.c->>'target',
  e.c->>'base',
  (e.ord - 1)::int
from public.yt_transcripts t,
  lateral jsonb_array_elements(t.cues) with ordinality as e(c, ord)
where jsonb_typeof(t.cues) = 'array'
  and e.c->>'target' is not null
  and length(e.c->>'target') > 0
  and nullif(e.c->>'start', '') is not null;

-- ── RPC pencarian ────────────────────────────────────────────────────────────
-- Cari `p_word` sebagai substring (di-escape) dalam kalimat target bahasa p_lang.
-- Kembalikan ≤3 hasil per video (variasi ala YouGlish), yang cocok sbagai KATA
-- UTUH diprioritaskan (batas-kata regex), lalu kalimat lebih pendek dulu (contoh
-- lebih jelas). Join ke yt_transcripts buat judul/channel/level.
create or replace function public.search_cues(
  p_word  text,
  p_lang  text,
  p_limit int default 40
)
returns table (
  video_id  text,
  title     text,
  channel   text,
  level     text,
  cue_start real,
  cue_end   real,
  target    text,
  base      text
)
language sql
stable
security definer
set search_path = public
as $$
  with q as (
    select
      -- escape wildcard ILIKE (\ % _) supaya input diperlakukan literal
      '%' || replace(replace(replace(btrim(p_word), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pat,
      -- batas-kata regex, dgn metakarakter regex di input di-escape supaya input
      -- seperti "(" / "?" tak bikin regex invalid (yang akan menggagalkan query).
      '\m' || regexp_replace(btrim(p_word), '([\\^$.|?*+()\[\]{}-])', '\\\&', 'g') || '\M'
        as word_re
  ),
  matches as (
    select * from (
      select
        ci.video_id, ci.lang, ci.cue_start, ci.cue_end, ci.target, ci.base,
        (ci.target ~* q.word_re) as whole_word,
        row_number() over (
          partition by ci.video_id
          order by (ci.target ~* q.word_re) desc, length(ci.target) asc
        ) as rn
      from public.yt_cue_index ci, q
      where ci.lang = p_lang
        and ci.target ilike q.pat
    ) ranked
    where ranked.rn <= 3  -- maks 3 contoh per video (variasi ala YouGlish)
  )
  select
    m.video_id, t.title, t.channel, t.level::text,
    m.cue_start, m.cue_end, m.target, m.base
  from matches m
  join public.yt_transcripts t
    on t.video_id = m.video_id and t.lang = m.lang
  order by m.whole_word desc, length(m.target) asc
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function public.search_cues(text, text, int) to anon, authenticated, service_role;
