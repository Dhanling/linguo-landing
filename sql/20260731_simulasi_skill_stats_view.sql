-- [sim-official-score-v1] Rincian per subtes tiap attempt — untuk panel admin.
--
-- Panel admin (TestSimulations → tab Peserta) dulu memakai estimasi LINEAR dari
-- total poin sehingga angkanya beda dengan yang dilihat siswa (yang sudah memakai
-- tabel konversi resmi per-seksi). Supaya keduanya sama, admin butuh rincian per
-- subtes juga — tapi menarik seluruh baris simulation_answers untuk semua peserta
-- terlalu berat (±110 baris per attempt) dan gampang kena batas 1000 baris PostgREST.
--
-- View ini meringkasnya jadi maksimal 5 baris per attempt (satu per skill).
-- `answered` = jumlah soal yang BENAR-BENAR diisi; soal yang dilewati tetap
-- tersimpan sebagai baris jawaban (is_correct=false), jadi tanpa kolom ini attempt
-- yang dikumpulkan kosong tak bisa dibedakan dari yang salah semua — persis kasus
-- "skor 0/110 tapi konversi 310 ITP".
--
-- security_invoker: hak baca tetap ikut RLS simulation_answers (admin lewat
-- can_manage_simulations(), siswa hanya barisnya sendiri).

create or replace view public.simulation_attempt_skill_stats
with (security_invoker = true) as
select
  a.attempt_id,
  coalesce(a.section_skill, 'reading') as section_skill,
  count(*) filter (where a.is_correct is not null)::int as objective,
  count(*) filter (where a.is_correct is true)::int as correct,
  count(*) filter (
    where a.selected_index is not null
       or coalesce(btrim(a.response_text), '') <> ''
       or coalesce(a.audio_url, '') <> ''
  )::int as answered,
  coalesce(sum(a.points_earned), 0)::numeric as earned,
  coalesce(sum(q.points), 0)::numeric as max_points,
  coalesce(
    array_agg(a.ai_score) filter (where a.ai_score is not null),
    '{}'::numeric[]
  ) as ai_scores
from public.simulation_answers a
left join public.test_simulation_questions q on q.id = a.question_id
group by 1, 2;

comment on view public.simulation_attempt_skill_stats is
  'Ringkasan jawaban per subtes tiap attempt simulasi (benar/objektif/diisi/poin) untuk konversi skala resmi.';
