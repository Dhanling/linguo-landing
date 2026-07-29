-- ebook-fulfillment-v1 — backfill pembelian e-book landing yang sudah LUNAS
--
-- Konteks: checkout /produk/ebook cuma menulis baris `leads` + invoice Xendit.
-- Baris `digital_purchases`-nya tidak pernah dibuat, jadi pembelian yang uangnya
-- sudah masuk TIDAK muncul di Overview admin, tidak muncul di Penjualan Digital,
-- dan pembelinya tidak dapat akses di Perpustakaan /akun.
--
-- Perbaikan alurnya ada di src/app/api/xendit-webhook/route.ts (fulfillEbookLead)
-- dan hanya berlaku untuk pembayaran BARU. Skrip ini menambal yang sudah lewat.
--
-- Aman diulang: baris yang external_id-nya sudah punya digital_purchases dilewati.
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- ---------------------------------------------------------------------------
-- 1. Lead e-book LUNAS → digital_purchases (satu baris per bahasa)
-- ---------------------------------------------------------------------------
with lang_map(id_name, catalog) as (values
  ('Inggris','English'), ('Spanyol','Spanish'), ('Jerman','German'),
  ('Jepang','Japanese'), ('Mandarin','Mandarin'), ('Belanda','Dutch'),
  ('Arab','Arabic'), ('Prancis','French'), ('Korea','Korean'),
  ('Tagalog','Tagalog'), ('Italia','Italian'), ('Turki','Turkish'),
  ('Rusia','Russian'), ('Portugis','Portuguese'), ('Thailand','Thai'),
  ('Vietnam','Vietnamese'), ('Hindi','Hindi'), ('Swedia','Swedish'),
  ('Norwegia','Norwegian'), ('Finlandia','Finnish')
),
-- Harga per SKU unik antar edisi, jadi nominal cukup untuk memastikan edisinya.
-- Sumber: PRODUCT_PRICES di src/app/api/create-invoice/route.ts.
edition_map(amount, edition) as (values
  (99000,'id'), (239000,'id'), (349000,'id'), (749000,'id'),
  (79000,'en'), (189000,'en'), (279000,'en'), (599000,'en')
),
src as (
  select
    l.id, l.name, l.email, l.wa_number, l.language,
    l.xendit_external_id, l.xendit_invoice_id, l.paid_at,
    coalesce(l.paid_amount, l.amount, 0)::numeric as total,
    em.edition
  from public.leads l
  join edition_map em on em.amount = coalesce(l.amount, l.paid_amount)
  where l.source = 'landing-page'
    -- Lead lama pakai program "digital" yang dipakai bareng checkout e-learning
    -- /produk. E-learning tak pernah mengisi `language` → baris tanpa bahasa
    -- otomatis tersaring oleh syarat di bawah.
    and lower(coalesce(l.program, '')) in ('digital', 'e-book', 'ebook')
    and upper(coalesce(l.payment_status, '')) in ('PAID', 'CONVERTED')
    and coalesce(trim(l.language), '') <> ''
    and l.email is not null
    and l.xendit_external_id is not null
    and not exists (
      select 1 from public.digital_purchases dp
      where dp.xendit_external_id = l.xendit_external_id
    )
),
picked as (
  -- Paket satuan / bundle: bahasa tercatat sebagai daftar dipisah koma.
  select s.*, trim(x.name) as id_name
  from src s
  cross join lateral unnest(string_to_array(s.language, ',')) as x(name)
  where s.language !~* '^semua'
  union all
  -- All-Access: labelnya "Semua 20 bahasa", bukan daftar bahasa.
  select s.*, m.id_name
  from src s
  cross join lang_map m
  where s.language ~* '^semua'
),
resolved as (
  select p.*, coalesce(lm.catalog, p.id_name) as catalog_lang
  from picked p
  left join lang_map lm on lm.id_name = p.id_name
),
with_prod as (
  select
    r.*,
    prod.id as product_id,
    (select pr.id
       from public.digital_product_pricing pr
      where pr.product_id = prod.id
      order by pr.is_active desc nulls last
      limit 1) as pricing_id,
    row_number() over (partition by r.id order by r.catalog_lang) as rn,
    count(*)   over (partition by r.id) as n
  from resolved r
  join public.digital_products prod
    on prod.type = 'ebook'
   and prod.language = r.catalog_lang
   and prod.slug like '%-' || r.edition
)
insert into public.digital_purchases (
  product_id, pricing_id, buyer_email, buyer_name, buyer_phone, amount,
  payment_status, xendit_status, xendit_invoice_id, xendit_external_id,
  xendit_paid_at, access_granted, access_granted_at, source
)
select
  product_id,
  pricing_id,
  email,
  name,
  wa_number,
  -- Nominal dibagi rata; sisa pembagian ditaruh di baris pertama supaya total
  -- omzet persis sama dengan yang dibayar (bukan N x harga bundle).
  case when rn = 1 then total - floor(total / n) * (n - 1) else floor(total / n) end,
  'Lunas',
  'PAID',
  xendit_invoice_id,
  -- Satu external_id dipakai banyak baris → baris ke-2 dst diberi sufiks biar
  -- tetap bisa dicocokkan 1:1 (dan cek idempotensi di webhook tetap kena baris 1).
  case when rn = 1 then xendit_external_id else xendit_external_id || '-' || rn end,
  coalesce(paid_at, now()),
  true,
  now(),
  'xendit'
from with_prod;

-- ---------------------------------------------------------------------------
-- 2. Normalisasi leads.program: "digital" ambigu → "e-book" / "e-learning"
--    (label admin PROGRAM_LABELS sudah mengenal dua nilai ini)
-- ---------------------------------------------------------------------------
update public.leads
set program = case
                when coalesce(trim(language), '') <> '' then 'e-book'
                else 'e-learning'
              end
where source = 'landing-page'
  and lower(coalesce(program, '')) = 'digital';

-- ---------------------------------------------------------------------------
-- 3. Sambungkan akses ke akun yang sudah terdaftar (Perpustakaan /akun cocokkan
--    lewat auth_user_id, bukan email). Hanya mengisi yang masih kosong.
-- ---------------------------------------------------------------------------
update public.digital_purchases dp
set auth_user_id = u.id
from auth.users u
where dp.auth_user_id is null
  and dp.buyer_email is not null
  and lower(u.email) = lower(dp.buyer_email);

commit;

-- Verifikasi:
--   select buyer_name, buyer_email, amount, xendit_external_id, created_at
--   from digital_purchases where source = 'xendit' order by created_at desc limit 20;
