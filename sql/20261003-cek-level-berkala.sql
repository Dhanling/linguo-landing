-- =============================================================================
-- [cek-level-berkala-v1] Cek Level berkala di dashboard siswa (/akun)
--
-- 1. placement_results: + language_slug, + max_score (grafik riwayat butuh slug
--    yang stabil; `language` berisi nama tampilan — "Inggris", "English", dst).
-- 2. my_placement_history(): siswa membaca riwayat hasil tesnya sendiri. RLS
--    tabelnya cuma mengizinkan staf, dan hasil lama sering tercatat tanpa
--    student_id (tes sebelum mendaftar) — dicocokkan lewat email / nomor WA.
-- =============================================================================

alter table public.placement_results
  add column if not exists language_slug text,
  add column if not exists max_score integer;

-- Slug bahasa yang PUNYA placement test CEFR (kunci CEFR_QUESTIONS di landing,
-- src/app/silabus/[lang]/coba/cefrQuestions.ts) + nama Indonesianya. Tambah
-- bahasa di sana → tambah baris di sini.
create or replace function public.placement_lang_map()
returns table(slug text, nama text)
language sql immutable
as $$
  select * from (values
    ('english','Inggris'),('japanese','Jepang'),('korean','Korea'),('mandarin','Mandarin'),
    ('cantonese','Kanton'),('vietnamese','Vietnam'),('thai','Thailand'),('filipino','Filipina'),
    ('khmer','Khmer'),('burmese','Myanmar'),('hindi','Hindi'),('urdu','Urdu'),
    ('german','Jerman'),('french','Prancis'),('spanish','Spanyol'),('italian','Italia'),
    ('dutch','Belanda'),('greek','Yunani'),('portuguese-br','Portugis (Brasil)'),
    ('portuguese-pt','Portugis (Portugal)'),('swedish','Swedia'),('norwegian','Norwegia'),
    ('danish','Denmark'),('icelandic','Islandia'),('irish','Irlandia'),('bosnian','Bosnia'),
    ('finnish','Finlandia'),('hungarian','Hungaria'),('turkish','Turki'),('romanian','Rumania'),
    ('russian','Rusia'),('ukrainian','Ukraina'),('bulgarian','Bulgaria'),('polish','Polandia'),
    ('czech','Ceko'),('arabic','Arab'),('hebrew','Ibrani'),('persian','Persia'),
    ('kurdish','Kurdi'),('armenian','Armenia'),('javanese','Jawa'),('sundanese','Sunda'),
    ('betawi','Betawi'),('bipa','BIPA'),('balinese','Bali'),('minangkabau','Minang'),
    ('batak','Batak'),('bugis','Bugis'),('acehnese','Aceh'),('banjar','Banjar'),
    ('madurese','Madura'),('lao','Laos'),('bengali','Bengali'),('tamil','Tamil'),
    ('punjabi','Punjabi'),('nepali','Nepal'),('mongolian','Mongol'),('swahili','Swahili'),
    ('zulu','Zulu'),('yoruba','Yoruba'),('amharic','Amhar'),('georgian','Georgia'),
    ('latin','Latin'),('esperanto','Esperanto')
  ) m(slug, nama);
$$;

-- Nama bahasa apa pun (registrations.language / placement_results.language, yang
-- isinya campur Inggris-Indonesia) → slug placement. NULL = tak ada tesnya.
create or replace function public.placement_slug_for_language(p text)
returns text
language sql immutable
as $$
  with x as (
    select lower(trim(regexp_replace(coalesce(p, ''), '^[^[:alnum:]]+', ''))) as l
  )
  select coalesce(
    (select m.slug from public.placement_lang_map() m, x
      where x.l = m.slug or x.l = lower(m.nama) limit 1),
    (select a.slug from (values
        ('tagalog','filipino'),('chinese','mandarin'),('indonesian','bipa'),
        ('bahasa indonesia','bipa'),('ukraine','ukrainian'),('portuguese','portuguese-br'),
        ('portuguese - brazilian','portuguese-br'),('portugis','portuguese-br'),
        ('laos','lao'),('farsi','persian'),('myanmar','burmese'),('minang','minangkabau')
      ) a(k, slug), x where x.l = a.k limit 1),
    (select case
        when x.l like 'english %' or x.l like 'inggris %' then 'english'
        when x.l like 'german %' then 'german'
      end from x)
  );
$$;

-- Isi slug hasil lama: dari `source` ("placement-test-<slug>[-unlocked]"), sisanya dari nama.
update public.placement_results
   set language_slug = regexp_replace(regexp_replace(source, '^placement-test-', ''), '-unlocked$', '')
 where language_slug is null and source like 'placement-test-%';

update public.placement_results
   set language_slug = public.placement_slug_for_language(language)
 where language_slug is null and public.placement_slug_for_language(language) is not null;

create index if not exists idx_placement_results_email_lower
  on public.placement_results (lower(email)) where email is not null;

-- Nomor WA → 62xxxxxxxxxx (NULL kalau bukan nomor).
create or replace function public.placement_norm_phone(p text)
returns text
language sql immutable
as $$
  select case
    when d !~ '^[0-9]{9,15}$' then null
    when d like '0%' then '62' || substr(d, 2)
    when d like '8%' then '62' || d
    else d
  end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) x;
$$;

-- Riwayat hasil tes milik siswa yang login. p_student_id hanya untuk staf
-- (mode "Lihat sebagai Siswa").
create or replace function public.my_placement_history(p_student_id uuid default null)
returns table(
  id uuid, language text, language_slug text, level text,
  score integer, max_score integer, time_elapsed_sec integer, created_at timestamptz
)
language sql stable security definer
set search_path to 'public'
as $$
  with me as (
    select s.id, lower(s.email) as email, public.placement_norm_phone(s.whatsapp) as phone
      from public.students s
     where case
             when p_student_id is not null then public.is_staff() and s.id = p_student_id
             else coalesce(auth.jwt() ->> 'email', '') <> ''
                  and lower(s.email) = lower(auth.jwt() ->> 'email')
           end
  )
  select p.id, p.language,
         coalesce(p.language_slug, public.placement_slug_for_language(p.language)),
         p.level, p.score, p.max_score, p.time_elapsed_sec, p.created_at
    from public.placement_results p
   where exists (
           select 1 from me
            where p.student_id = me.id
               or (p.email is not null and lower(p.email) = me.email)
               or (me.phone is not null and public.placement_norm_phone(p.whatsapp) = me.phone)
         )
   order by p.created_at
   limit 300;
$$;

revoke all on function public.my_placement_history(uuid) from public, anon;
grant execute on function public.my_placement_history(uuid) to authenticated;
