-- =============================================================================
-- linguo-patch:native-pricing-v1
-- Trial Class sekarang punya pilihan pengajar Lokal/Native (native = 2x tarif
-- lokal, aturan sama dengan Kelas Private & Kelas Kids reguler). `leads` sudah
-- punya kolom teacher_type; `trial_registrations` belum, jadi trial native tidak
-- bisa dibedakan dari trial lokal padahal nominalnya 2x lipat.
--
-- Aditif & nullable: baris lama tetap valid. Default 'lokal' supaya baris baru
-- yang tidak mengirim kolom ini tidak ambigu.
-- Rollback: alter table public.trial_registrations drop column teacher_type;
-- =============================================================================

begin;

alter table public.trial_registrations
  add column if not exists teacher_type text not null default 'lokal';

alter table public.trial_registrations
  drop constraint if exists trial_registrations_teacher_type_check;

alter table public.trial_registrations
  add constraint trial_registrations_teacher_type_check
  check (teacher_type in ('lokal', 'native'));

comment on column public.trial_registrations.teacher_type is
  'native-pricing-v1: lokal | native. Native = 2x tarif lokal (lihat src/lib/trial-pricing.ts applyNativeMultiplier).';

commit;
