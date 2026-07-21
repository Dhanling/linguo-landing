-- [simulasi-cover-by-type] Cover foto per JENIS tes untuk kartu teaser "Segera".
-- Kartu terkunci di katalog siswa bersifat per-jenis (toefl/ielts), bukan per-
-- simulasi. Simulasi IELTS masih Draft (is_published=false) sehingga cover-nya
-- tak terbaca lewat RLS "Guest read simulations". RPC ini SECURITY DEFINER dan
-- HANYA membocorkan {test_type, cover_url} (URL gambar publik) — tanpa soal,
-- kunci jawaban, atau isi apa pun — jadi aman di-grant ke authenticated & anon.

create or replace function public.get_simulation_covers()
returns table(test_type text, cover_url text)
language sql
security definer
set search_path = public
as $$
  select distinct on (test_type) test_type, cover_url
  from public.test_simulations
  where cover_url is not null
  order by test_type, created_at desc;
$$;

grant execute on function public.get_simulation_covers() to authenticated, anon;
