-- [linguo-patch:trial-level-price-v1] 2026-07-24
-- Harga trial Private sekarang ikut LEVEL yang dipilih siswa di form /kelas-trial
-- (English B1 60 menit = Rp120.000, bukan tarif A1 Rp100.000). Level-nya perlu
-- disimpan supaya admin bisa audit tagihan & konversi trial → registrasi tidak
-- kehilangan level. `leads.level` sudah ada duluan, jadi cukup tabel trial.
-- Aman di-run ulang.
alter table trial_registrations add column if not exists level text;

comment on column trial_registrations.level is
  'Level CEFR pilihan siswa saat daftar trial (A1/A2/B1/B2/C1). Penentu tarif trial Private; null untuk program Kids (ikut tier usia) & pendaftaran sebelum trial-level-price-v1.';
