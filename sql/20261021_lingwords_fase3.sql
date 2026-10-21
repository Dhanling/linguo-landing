-- [lingwords-kelas-v1] Lingwords fase 3 — pengajar menambahkan kosakata sesi ke Lingwords siswa.
-- Jalankan SESUDAH sql/20261021_lingwords_fase2.sql. Aman dijalankan ulang.
--
-- Sesudah mengajar (layar "Kelas selesai" Linguo Meet / sheet "Lengkapi sesi" di portal
-- pengajar) pengajar mencentang kata sesi itu — dari slide vocab, kiriman caption ke
-- Lingnote, kuis live, atau ketik sendiri — lalu kata masuk ke student_words siswa
-- dengan source 'kelas' dan status 'dikenal' (naik ke dikuasai lewat review siswa).
--
-- 1. student_words.note — keterangan asal, mis. "Sesi 5 · Kak Dhani".
-- 2. teacher_tambah_lingwords(p_schedule_id, p_lang, p_words) — SECURITY DEFINER:
--    student_words dikunci RLS ke pemiliknya, jadi fungsi ini yang memeriksa pemanggil
--    memang pengajar sesi/kelas/batch itu (sesi login ≠ staf). Kelas grup: kata masuk ke
--    semua siswa batch yang sesinya (nomor sama) tercatat selesai/hadir.

alter table public.student_words add column if not exists note text;

create or replace function public.teacher_tambah_lingwords(
  p_schedule_id uuid,
  p_lang text,
  p_words jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s        record;
  r        record;
  v_boleh  boolean;
  v_lang   text := lower(left(btrim(coalesce(p_lang, '')), 12));
  v_note   text;
  v_teacher text;
  v_regs   uuid[];
  v_users  uuid[];
  v_n      int := 0;
  v_siswa  int := 0;
begin
  if auth.uid() is null then
    raise exception 'harus login' using errcode = '42501';
  end if;
  if v_lang !~ '^[a-z-]{2,12}$' then
    raise exception 'bahasa tidak sah' using errcode = '22023';
  end if;
  if jsonb_typeof(p_words) <> 'array' or jsonb_array_length(p_words) = 0 or jsonb_array_length(p_words) > 200 then
    raise exception 'p_words harus array 1–200' using errcode = '22023';
  end if;

  select id, registration_id, session_number, teacher_id into s from schedules where id = p_schedule_id;
  if s.id is null or s.registration_id is null then
    raise exception 'jadwal tidak ditemukan' using errcode = 'P0002';
  end if;
  select id, teacher_id, batch_id, test_prep_batch_id into r from registrations where id = s.registration_id;

  -- Yang boleh: pengajar jadwal/kelas ini, pengajar batch grupnya, atau staf kurikulum.
  select exists (
    select 1 from teachers t
     where t.user_id = auth.uid()
       and (t.id in (s.teacher_id, r.teacher_id)
            or (r.batch_id is not null and exists (select 1 from regular_batches b where b.id = r.batch_id and b.teacher_id = t.id))
            or (r.test_prep_batch_id is not null and exists (select 1 from test_prep_batches b where b.id = r.test_prep_batch_id and b.teacher_id = t.id)))
  ) or exists (
    select 1 from profiles p
     where p.id = auth.uid() and p.role = any (array['owner','admin','curriculum'])
  ) into v_boleh;
  if not v_boleh then
    raise exception 'bukan pengajar sesi ini' using errcode = '42501';
  end if;

  -- Siswa sasaran: kelas privat = registrasi ini; kelas grup = semua registrasi batch yang
  -- sesi bernomor sama sudah selesai (hadir), ditambah registrasi jadwal ini sendiri.
  if r.batch_id is not null or r.test_prep_batch_id is not null then
    select array_agg(distinct x.id) into v_regs from (
      select r.id
      union
      select r2.id
        from registrations r2
        join schedules s2 on s2.registration_id = r2.id
       where ((r.batch_id is not null and r2.batch_id = r.batch_id)
              or (r.test_prep_batch_id is not null and r2.test_prep_batch_id = r.test_prep_batch_id))
         and s2.session_number is not distinct from s.session_number
         and lower(coalesce(s2.status, '')) in ('completed', 'selesai', 'done', 'hadir')
    ) x;
  else
    v_regs := array[r.id];
  end if;

  select array_agg(distinct u.id) into v_users
    from registrations rr
    join students st on st.id = rr.student_id
    join auth.users u on lower(u.email) = lower(btrim(st.email))
   where rr.id = any (v_regs) and coalesce(btrim(st.email), '') <> '';
  if v_users is null then
    return jsonb_build_object('siswa', 0, 'kata', 0, 'tanpa_akun', true);
  end if;
  v_siswa := coalesce(array_length(v_users, 1), 0);

  select name into v_teacher from teachers where id = coalesce(s.teacher_id, r.teacher_id);
  v_note := concat_ws(' · ', case when s.session_number is not null then 'Sesi ' || s.session_number end, v_teacher);

  insert into student_words as w
    (user_id, lang, word_key, word, meaning, translit, source, stage, first_seen, note, updated_at)
  select u, v_lang,
         lower(btrim(left(k->>'word', 200))),
         btrim(left(k->>'word', 200)),
         nullif(btrim(left(k->>'meaning', 500)), ''),
         nullif(btrim(left(k->>'translit', 200)), ''),
         'kelas', 'dikenal', now(), nullif(v_note, ''), now()
    from unnest(v_users) u
   cross join jsonb_array_elements(p_words) k
   where coalesce(btrim(k->>'word'), '') <> ''
  on conflict (user_id, lang, word_key) do update set
    -- Kata yang sudah ada TIDAK diturunkan statusnya; arti/cara baca hanya mengisi yang kosong.
    meaning    = coalesce(w.meaning, excluded.meaning),
    translit   = coalesce(w.translit, excluded.translit),
    note       = coalesce(w.note, excluded.note),
    updated_at = now();
  get diagnostics v_n = row_count;

  return jsonb_build_object('siswa', v_siswa, 'kata', v_n);
end;
$$;

revoke all on function public.teacher_tambah_lingwords(uuid, text, jsonb) from public, anon;
grant execute on function public.teacher_tambah_lingwords(uuid, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
