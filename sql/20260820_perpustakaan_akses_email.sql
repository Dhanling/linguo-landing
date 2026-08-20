-- ── perpustakaan-akses-email-v1 ─────────────────────────────────────────────
-- Masalah: Perpustakaan /akun cuma menampilkan digital_purchases yang
-- `auth_user_id`-nya sama dengan user login. Kolom itu diisi trigger
-- `trg_link_digital_purchase_auth_user` HANYA saat baris pembelian
-- dibuat/diubah — jadi pembeli yang baru bikin akun SESUDAH membayar
-- selamanya punya auth_user_id NULL dan perpustakaannya kosong walau lunas.
-- Per 20 Agu 2026: 37 dari 59 pembelian Lunas ber-auth_user_id NULL, 24 di
-- antaranya emailnya SUDAH punya akun login.
--
-- Isi berkas ini:
--   1. Policy baca dilonggarkan → cocok lewat auth_user_id ATAU email (case-
--      insensitive; policy lama pakai `=` jadi email ber-huruf besar tak cocok).
--   2. Backfill auth_user_id dari auth.users lewat email.
--   3. Blok DIAGNOSA untuk cek ulang kalau perpustakaan terlihat kosong lagi.
--
-- Idempoten, aman dijalankan ulang.

-- 1) Policy baca milik sendiri ─────────────────────────────────────────────
drop policy if exists purchases_user_read_own on public.digital_purchases;
create policy purchases_user_read_own on public.digital_purchases
  for select to public
  using (
    (auth_user_id is not null and auth_user_id = auth.uid())
    or (
      buyer_email is not null
      and auth.jwt() ->> 'email' is not null
      and lower(buyer_email) = lower(auth.jwt() ->> 'email')
    )
  );

-- 2) Backfill auth_user_id ─────────────────────────────────────────────────
-- Catatan: UPDATE ini membangunkan trigger BEFORE `sync_digital_purchase_to_
-- registration` untuk baris LUNAS yang registration_id-nya masih NULL. Itu
-- disengaja & idempoten (upsert ON CONFLICT source_digital_purchase_id) —
-- baris seperti itu memang seharusnya punya cermin di registrations.
update public.digital_purchases dp
set auth_user_id = u.id
from auth.users u
where dp.auth_user_id is null
  and dp.buyer_email is not null
  and lower(u.email) = lower(dp.buyer_email);

-- 3) DIAGNOSA ──────────────────────────────────────────────────────────────
select
  count(*) filter (where payment_status = 'Lunas')                          as lunas_total,
  count(*) filter (where payment_status = 'Lunas' and auth_user_id is null) as lunas_tanpa_auth,
  count(*) filter (
    where payment_status = 'Lunas' and auth_user_id is null
      and exists (
        select 1 from auth.users u
        where lower(u.email) = lower(digital_purchases.buyer_email)
      )
  )                                                                        as lunas_tanpa_auth_tapi_punya_akun
from public.digital_purchases;
