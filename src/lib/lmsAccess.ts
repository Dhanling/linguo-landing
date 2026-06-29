// [linguo-patch:lms-access-rule-shared-v1]
// Sumber TUNGGAL aturan akses LMS self-paced. Dipakai LessonPlayer (gembok lesson)
// & LmsKatalog (badge owned + target upgrade). Jangan duplikasi rule ini di tempat lain.
//
// Aturan: semua level A1 (A1.1, A1.2, ...) GRATIS; A2–B2 perlu langganan (lms_is_entitled).

export function isFreeLevel(cefrLabel?: string | null) {
  return (cefrLabel || "").toUpperCase().startsWith("A1");
}

// major level dari cefr_label: "A1.2" -> "A1"
export function majorOf(cefrLabel?: string | null) {
  return (cefrLabel || "").toUpperCase().split(".")[0];
}
