-- [rekaman-sambung-pindai-v1] 12 Okt 2026
-- Daftar room yang punya folder potongan rekaman (`<stamp>.parts/`) di Storage,
-- untuk penyambung rekaman di server (src/lib/recordingsFinalize.ts).
--
-- Tanpa ini penyambung harus membuka SEMUA folder room satu per satu lewat API
-- Storage (ribuan panggilan list): uji kering 12 Okt 2026 tidak selesai dalam
-- 60 detik, artinya sebagian besar jatah waktu satu putaran habis untuk memindai
-- sebelum satu potongan pun diunduh — dan makin lama makin parah.
--
-- Hanya untuk service role (dipanggil server dengan kunci service role).

create or replace function public.vc_recording_parts_rooms()
returns table (bucket_id text, room text)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct o.bucket_id, split_part(o.name, '/', 2) as room
  from storage.objects o
  where o.bucket_id in ('class-recordings', 'class-materials')
    and o.name like 'video-recordings/%.parts/%';
$$;

revoke all on function public.vc_recording_parts_rooms() from public, anon, authenticated;
grant execute on function public.vc_recording_parts_rooms() to service_role;
