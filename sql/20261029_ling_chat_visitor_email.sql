-- [ling-prechat-kontak-v1] Isian wajib nama + WA + email sebelum chat Minling
-- dimulai. Nama & WA sudah ada kolomnya; email baru.
alter table public.ling_chat_sessions add column if not exists visitor_email text;
