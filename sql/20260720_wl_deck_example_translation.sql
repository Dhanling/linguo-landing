-- Tambah terjemahan Bahasa Indonesia untuk kalimat contoh tiap kartu deck.
-- Watch & Learn deck flashcard (wl_deck_cards) kini menampilkan contoh kalimat
-- SEKALIGUS terjemahannya (khususnya deck yang dibuat AI). Kolom baru bersifat
-- opsional (default '') supaya kartu/deck lama tetap valid tanpa backfill.
--
-- Idempoten & aman dijalankan manual di Supabase (project jbtgciepdmqxxcjflrxz):
-- ADD COLUMN IF NOT EXISTS tidak mengubah data yang sudah ada.

alter table public.wl_deck_cards
  add column if not exists example_translation text not null default '';
