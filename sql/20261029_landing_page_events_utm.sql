-- [link-bio-utm-v1] (29 Okt 2026) Kolom sumber di landing_page_events.
-- Murni tambah kolom nullable — tidak mengubah fungsi/RPC apa pun, jadi aman
-- dijalankan kapan saja. Sebelum ini dijalankan, /api/track otomatis mencatat
-- view tanpa kolom sumber (insert ulang), jadi urutan deploy bebas.
-- Contoh isi dari bio IG: utm_source=ig, utm_medium=social,
-- utm_content=link_in_bio, click_id=fbclid.
alter table public.landing_page_events
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content  text,
  add column if not exists click_id     text;
