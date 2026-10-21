-- [lingwords-v2] Lingwords fase 2.
-- Jalankan SESUDAH sql/20261020_lingwords.sql. Aman dijalankan ulang.
--
-- 1. word_themes — cache tema per kata (Peta Kata per tema). Tema adalah sifat
--    KATA, bukan siswa, jadi satu baris dipakai bersama semua siswa: kata yang
--    sudah pernah ditandai tak pernah ditanyakan lagi ke AI. Ditulis HANYA oleh
--    rute /api/lingwords-tema (service role); siswa cukup membaca.
-- 2. teacher_lingwords_siswa — angka + daftar kata Lingwords satu siswa untuk portal
--    pengajar (teach.linguo.id, tab Progress kartu siswa). SECURITY DEFINER karena
--    student_words dikunci RLS ke pemiliknya; fungsi ini sendiri yang memeriksa
--    pemanggil memang pengajar kelas itu (sesi login ≠ staf, lihat KEAMANAN.md).

create table if not exists public.word_themes (
  lang       text        not null,               -- kode ISO 639-1
  word_key   text        not null,               -- lower(trim(word)), sama dgn student_words
  theme      text        not null check (theme in (
               'makanan', 'keluarga', 'angka_waktu', 'transportasi', 'rumah', 'cuaca',
               'belanja', 'sekolah_kerja', 'sapaan', 'kata_umum', 'lainnya')),
  created_at timestamptz not null default now(),
  primary key (lang, word_key)
);

alter table public.word_themes enable row level security;

drop policy if exists word_themes_select on public.word_themes;
create policy word_themes_select on public.word_themes
  for select to authenticated using (true);
-- Sengaja tanpa policy insert/update/delete: penulisan lewat service role saja.

grant select on public.word_themes to authenticated;

create or replace function public.teacher_lingwords_siswa(p_registration_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r       record;
  v_boleh boolean;
  v_email text;
  v_users uuid[];
  v_words jsonb;
  v_act   jsonb;
begin
  if auth.uid() is null then
    raise exception 'harus login' using errcode = '42501';
  end if;

  select id, student_id, teacher_id, language, level into r
    from registrations where id = p_registration_id;
  if r.id is null then
    raise exception 'kelas tidak ditemukan' using errcode = 'P0002';
  end if;

  -- Yang boleh: pengajar kelas ini (termasuk pengganti di salah satu jadwalnya),
  -- atau staf kurikulum. Pola sama dengan teacher_kirim_kosakata.
  select exists (
    select 1 from teachers t
     where t.user_id = auth.uid()
       and (t.id = r.teacher_id
            or exists (select 1 from schedules s where s.registration_id = r.id and s.teacher_id = t.id))
  ) or exists (
    select 1 from profiles p
     where p.id = auth.uid() and p.role = any (array['owner','admin','curriculum'])
  ) into v_boleh;
  if not v_boleh then
    raise exception 'bukan pengajar siswa ini' using errcode = '42501';
  end if;

  -- student_words dikunci ke akun login siswa (auth.users), dicocokkan lewat email.
  select lower(btrim(email)) into v_email from students where id = r.student_id;
  if coalesce(v_email, '') <> '' then
    select array_agg(u.id) into v_users from auth.users u where lower(u.email) = v_email;
  end if;
  if v_users is null then
    return jsonb_build_object('language', r.language, 'level', r.level,
                              'words', '[]'::jsonb, 'activity', '[]'::jsonb, 'akun', false);
  end if;

  -- Satu nilai jsonb (bukan set baris) → tak kena plafon 1.000 baris PostgREST.
  select coalesce(jsonb_agg(jsonb_build_object(
           'lang', w.lang, 'word', w.word, 'meaning', w.meaning, 'translit', w.translit,
           'source', w.source, 'stage', w.stage, 'first_seen', w.first_seen,
           'mastered_at', w.mastered_at, 'last_active', w.last_active) order by w.first_seen), '[]'::jsonb)
    into v_words
    from (select * from student_words where user_id = any (v_users) order by first_seen limit 20000) w;

  select coalesce(jsonb_agg(jsonb_build_object('day', a.day, 'lang', a.lang, 'n', a.n) order by a.day), '[]'::jsonb)
    into v_act
    from student_word_activity a
   where a.user_id = any (v_users) and a.day >= current_date - 90;

  return jsonb_build_object('language', r.language, 'level', r.level,
                            'words', v_words, 'activity', v_act, 'akun', true);
end;
$$;

revoke all on function public.teacher_lingwords_siswa(uuid) from public, anon;
grant execute on function public.teacher_lingwords_siswa(uuid) to authenticated;

notify pgrst, 'reload schema';
