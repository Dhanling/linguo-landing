-- [lingnote-kosakata-live-v1] Pengajar mengirim kosakata dari caption Kelas Video
-- langsung ke Lingnote (student_notes) siswanya.
--
-- Kenapa RPC, bukan policy INSERT/UPDATE untuk pengajar:
--   • satu catatan per (kelas, sesi) — kata berikutnya DITAMBAHKAN ke catatan yang
--     sama. Kalau dikerjakan klien (baca → tambah → tulis) dua kata yang dikirim
--     beruntun bisa saling menimpa; di sini baris dikunci FOR UPDATE.
--   • pengajar tidak perlu hak baca/ubah catatan pribadi siswa sama sekali —
--     fungsi ini cuma menyentuh catatan bertanda 'dari-pengajar'.
--   • nama pengajar, bahasa, level, dan nomor sesi diambil dari database, bukan
--     dari klien, jadi label di buku siswa tidak bisa dipalsukan.
--
-- Penanda di kolom `tags` (dibaca infoKiriman() di src/lib/studentWorkspace.ts):
--   'dari-pengajar', 'kosakata', 'pengajar:<nama lengkap>', 'kelas:<bahasa · level>'
--
-- Aman dijalankan ulang.

create or replace function public.teacher_kirim_kosakata(
  p_schedule_id uuid,
  p_term text,
  p_meaning text,
  p_translit text default null,
  p_base text default null,
  p_contoh text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  r record;
  v_teacher_name text;
  v_boleh boolean;
  v_note_id uuid;
  v_content text;
  v_baris text;
  v_kelas text;
  v_term text := nullif(btrim(coalesce(p_term, '')), '');
begin
  if auth.uid() is null then
    raise exception 'harus login' using errcode = '42501';
  end if;
  if v_term is null then
    raise exception 'kata kosong' using errcode = '22023';
  end if;

  select id, registration_id, session_number, teacher_id into s
    from schedules where id = p_schedule_id;
  if s.id is null or s.registration_id is null then
    raise exception 'jadwal tidak ditemukan' using errcode = 'P0002';
  end if;

  select id, student_id, language, level, teacher_id into r
    from registrations where id = s.registration_id;
  if r.student_id is null then
    raise exception 'kelas ini tidak punya siswa' using errcode = 'P0002';
  end if;

  -- Yang boleh: pengajar jadwal ini (termasuk pengganti), pengajar kelasnya, atau staf.
  select exists (
    select 1 from teachers t
     where t.user_id = auth.uid() and t.id in (s.teacher_id, r.teacher_id)
  ) or exists (
    select 1 from profiles p
     where p.id = auth.uid() and p.role = any (array['owner','admin','curriculum'])
  ) into v_boleh;
  if not v_boleh then
    raise exception 'bukan pengajar kelas ini' using errcode = '42501';
  end if;

  select name into v_teacher_name from teachers where id = coalesce(s.teacher_id, r.teacher_id);
  v_kelas := concat_ws(' · ', nullif(r.language, ''), nullif(r.level, ''));

  -- Satu baris markdown: "- **kata** (latin) — arti", contoh kalimat jadi kutipan.
  v_baris := '- **' || v_term || '**'
    || coalesce(' (' || nullif(btrim(p_translit), '') || ')', '')
    || case when nullif(btrim(p_base), '') is not null and btrim(p_base) <> v_term
            then ' · bentuk dasar: ' || btrim(p_base) else '' end
    || coalesce(' — ' || nullif(btrim(p_meaning), ''), '')
    || coalesce(E'\n> ' || nullif(regexp_replace(btrim(p_contoh), '\s+', ' ', 'g'), ''), '');

  select id, content into v_note_id, v_content
    from student_notes
   where registration_id = r.id
     and student_id = r.student_id
     and session_number is not distinct from s.session_number
     and 'dari-pengajar' = any (tags)
     and archived_at is null
   order by created_at
   limit 1
   for update;

  if v_note_id is null then
    insert into student_notes (student_id, registration_id, session_number, title, content, icon, tags, shared_with_teacher)
    values (
      r.student_id, r.id, s.session_number,
      'Kosakata ' || coalesce('Sesi ' || s.session_number, to_char(now() at time zone 'Asia/Jakarta', 'DD/MM')) ||
        coalesce(' · ' || nullif(v_kelas, ''), ''),
      v_baris, 'Languages',
      array_remove(array[
        'dari-pengajar', 'kosakata',
        case when v_teacher_name is not null then 'pengajar:' || v_teacher_name end,
        case when v_kelas <> '' then 'kelas:' || v_kelas end
      ], null),
      true
    )
    returning id into v_note_id;
    return jsonb_build_object('note_id', v_note_id, 'duplicate', false, 'baru', true);
  end if;

  -- Kata yang sama tidak ditulis dua kali (siswa mungkin sudah menyuntingnya).
  if position(('**' || v_term || '**') in coalesce(v_content, '')) > 0 then
    return jsonb_build_object('note_id', v_note_id, 'duplicate', true, 'baru', false);
  end if;

  update student_notes
     set content = case when coalesce(btrim(content), '') = '' then v_baris else rtrim(content, E'\n') || E'\n' || v_baris end
   where id = v_note_id;
  return jsonb_build_object('note_id', v_note_id, 'duplicate', false, 'baru', false);
end;
$$;

revoke all on function public.teacher_kirim_kosakata(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.teacher_kirim_kosakata(uuid, text, text, text, text, text) to authenticated;
