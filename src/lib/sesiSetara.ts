// [sertifikat-setara-60-v1] Syarat sertifikat 1 sublevel = 16 sesi × 60 menit (arahan owner 6 Nov 2026).
// Sesi Private yang durasinya tercatat < 60 menit dihitung setara: 30 menit = ½ sesi, 45 menit = ¾ sesi.
// Kembaran: dashboard src/components/wainbox/classProgress.ts (bobotSesi), linguo-app suggest-reply,
// dan job DB job_class_done_notify (sql/20261116_sertifikat_setara_60_menit.sql di repo dashboard).

/** Menit per sesi dari kolom `registrations.duration` ("30", "45 menit"); null = tak tercatat. */
export function menitSesi(r: { duration?: string | number | null }): number | null {
  const m = Number(String(r?.duration ?? "").match(/\d+/)?.[0]);
  return Number.isFinite(m) && m > 0 ? m : null;
}

/** Bobot 1 sesi terhadap standar 60 menit. Hanya Private < 60 menit yang dikurangi; sisanya 1. */
export function bobotSesi(r: { product_type?: string | null; duration?: string | number | null }): number {
  const m = menitSesi(r);
  return r?.product_type === "Private" && m != null && m < 60 ? m / 60 : 1;
}
