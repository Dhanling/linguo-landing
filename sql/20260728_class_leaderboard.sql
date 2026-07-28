-- [beranda-leaderboard-v1] Papan peringkat kelas grup buat kartu "Peringkat Kelas"
-- di Beranda /akun (src/components/akun/BerandaInsights.tsx).
--
-- KENAPA HARUS RPC:
-- RLS bikin siswa cuma bisa baca registrasinya sendiri — dan itu MEMANG BENAR.
-- Papan peringkat butuh baris siswa lain, jadi satu-satunya cara yang aman
-- adalah fungsi SECURITY DEFINER yang: (a) memastikan pemanggilnya beneran
-- anggota kelas itu, dan (b) cuma mengembalikan data yang sudah diringkas.
--
-- YANG KELUAR & TIDAK KELUAR:
--   keluar      → inisial nama, persen progres sesi, jumlah sesi terpakai
--   TIDAK keluar → nama lengkap, email, WhatsApp, nominal bayar, id siswa
-- Jadi walau responsnya dibuka di devtools, identitas teman sekelas tetap aman.
--
-- Landing menangani ketiadaan fungsi ini dengan anggun: kalau belum dijalankan,
-- loadLeaderboard() balik null dan kartunya tidak dirender sama sekali.
--
-- CARA JALANIN: SQL Editor Supabase (project jbtgciepdmqxxcjflrxz), sekali saja.

create or replace function public.lms_class_leaderboard(p_registration_id uuid)
returns table (
  display_label text,
  is_me         boolean,
  progress_pct  numeric,
  sessions_done integer
)
language sql
security definer
set search_path = public
as $$
  with me as (
    -- Gerbangnya di sini: baris ini cuma ada kalau registrasi yang diminta
    -- BENAR milik pemanggil (dicocokkan lewat email, sama seperti cara
    -- /akun menemukan barisnya di tabel students) DAN kelasnya kelas grup
    -- (punya batch_id). Kelas Private tidak punya teman sekelas, jadi
    -- otomatis balik kosong.
    select r.id, r.student_id, r.batch_id
      from public.registrations r
      join public.students s on s.id = r.student_id
     where r.id = p_registration_id
       and r.batch_id is not null
       and lower(s.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
     limit 1
  )
  select
    -- Inisial saja: "Muhamad Lutfi" -> "ML". Baris sendiri ditandai lewat
    -- is_me; labelnya diganti "Kamu" di sisi klien.
    upper(
      coalesce(left(nullif(split_part(trim(s.name), ' ', 1), ''), 1), '?') ||
      coalesce(left(nullif(split_part(trim(s.name), ' ', 2), ''), 1), '')
    )::text                                                        as display_label,
    (r.student_id = me.student_id)                                 as is_me,
    case
      when coalesce(r.sessions_total, 0) > 0
        then round(least(100, (coalesce(r.sessions_used, 0)::numeric / r.sessions_total) * 100))
      else 0
    end                                                            as progress_pct,
    coalesce(r.sessions_used, 0)::integer                          as sessions_done
  from me
  join public.registrations r on r.batch_id = me.batch_id
  join public.students s      on s.id = r.student_id
  where r.archived_at is null
    and coalesce(r.payment_status, '') in ('Lunas', 'Cicilan')
  order by progress_pct desc, sessions_done desc, display_label asc
  limit 20;
$$;

comment on function public.lms_class_leaderboard(uuid) is
  'Papan peringkat teranonimkan untuk satu kelas grup. Hanya bisa dipanggil oleh anggota kelas tsb; balik inisial + persen progres, tanpa identitas.';

revoke all on function public.lms_class_leaderboard(uuid) from public;
grant execute on function public.lms_class_leaderboard(uuid) to authenticated;
