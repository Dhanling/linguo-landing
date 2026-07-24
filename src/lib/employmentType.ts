// Label tipe kerja untuk halaman /karir. Nilai mentahnya enum di kolom
// job_openings.employment_type — mirror dari EMPLOYMENT_TYPES di admin dashboard
// (src/pages/Loker.tsx). Kalau ada tipe baru di admin, tambahkan juga di sini.
const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
  contract: "Kontrak",
  internship: "Magang",
};

export function employmentTypeLabel(type: string | null | undefined) {
  if (!type) return null;
  // Tipe tak dikenal tetap tampil, cuma dirapikan: "some_type" → "Some type"
  return (
    EMPLOYMENT_TYPE_LABELS[type] ??
    type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
  );
}
