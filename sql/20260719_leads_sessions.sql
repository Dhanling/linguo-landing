-- funnel-sessions-sync-v1
-- Simpan jumlah sesi yang dipilih siswa di funnel checkout (create-funnel-invoice),
-- supaya webhook xendit (handleFunnelLead) & reconcile bisa mengisi
-- registrations.sessions_total / duration / price_per_session otomatis — dulu selalu null
-- sehingga kolom Sesi & Durasi di admin kosong ("—").
--
-- duration (menit/sesi) sudah ada sejak leads-lang-level-duration-v1; kolom ini melengkapi
-- dengan jumlah sesi. price_per_session diturunkan webhook dari amount / sessions.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS sessions integer;

COMMENT ON COLUMN public.leads.sessions IS
  'Jumlah sesi paket kelas yg dipilih di funnel checkout (utk sync ke registrations.sessions_total).';
