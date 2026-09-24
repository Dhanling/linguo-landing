-- [placement-notif-v1] Penanda notifikasi hasil placement test (email + WA CS)
-- sudah dikirim — supaya tiap baris cuma dikabari SEKALI walau endpoint
-- dipanggil ulang (klik ganda / enrich kontak).
alter table public.placement_results
  add column if not exists notified_at timestamptz;
