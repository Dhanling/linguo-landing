// Shared constants for Interpreter Service module (landing pages)
// Edit here, both /interpreter and /jadi-interpreter pick up changes.

export const LANGUAGES = [
  "Indonesia", "Inggris", "Mandarin", "Jepang", "Korea", "Arab",
  "Spanyol", "Prancis", "Jerman", "Italia", "Portugis", "Rusia",
  "Belanda", "Vietnam", "Thailand",
] as const;

export const INDUSTRIES = [
  "Finance & Banking",
  "IT & Technology",
  "Manufaktur",
  "Healthcare & Pharma",
  "Government & Public Sector",
  "Legal & Law",
  "Energy & Mining",
  "Education",
  "Retail",
  "Media & Entertainment",
  "Hospitality & Tourism",
  "Lainnya",
] as const;

export const MODES = [
  {
    value: "consecutive",
    label: "Consecutive",
    short: "Interpreter ngomong setelah pembicara jeda",
    long: "Cocok buat meeting, interview, negosiasi 1-on-1. Equipment minim.",
  },
  {
    value: "simultaneous",
    label: "Simultaneous",
    short: "Real-time dari booth pakai headset",
    long: "Cocok buat konferensi besar dengan audience >50 orang. Butuh equipment booth & headset.",
  },
  {
    value: "whisper",
    label: "Whisper (chuchotage)",
    short: "Bisikan ke 1–2 listener",
    long: "Cocok buat meeting private, site visit, atau VIP shadowing. No equipment.",
  },
] as const;

export const LOCATION_TYPES = [
  { value: "onsite", label: "Onsite (datang ke lokasi)" },
  { value: "online", label: "Online (via platform meeting)" },
  { value: "hybrid", label: "Hybrid (sebagian onsite, sebagian online)" },
] as const;

export const ONLINE_PLATFORMS = ["Zoom", "Google Meet", "Microsoft Teams", "Webex", "Lainnya"] as const;

export const BUDGET_RANGES = [
  "Belum tahu",
  "< 5 juta",
  "5–10 juta",
  "10–25 juta",
  "25–50 juta",
  "> 50 juta",
] as const;

export const SPECIALIZATIONS = [
  { value: "Legal", label: "Legal", hint: "pengadilan, kontrak" },
  { value: "Medical", label: "Medical", hint: "klinis, farmasi" },
  { value: "Business", label: "Business", hint: "meeting, negosiasi" },
  { value: "Technical", label: "Technical", hint: "engineering, manufaktur" },
  { value: "Conference", label: "Conference", hint: "event besar, simultaneous booth" },
  { value: "Government", label: "Government", hint: "diplomatik, sektor publik" },
  { value: "Education", label: "Education", hint: "akademik, training" },
  { value: "Media", label: "Media", hint: "broadcast, wawancara" },
  { value: "Tourism", label: "Tourism", hint: "guide, kultural" },
  { value: "Lainnya", label: "Lainnya", hint: "" },
] as const;

export const CERTIFICATIONS = [
  "HPI (Himpunan Penerjemah Indonesia)",
  "ATA (American Translators Association)",
  "NAATI (Australia)",
  "AIIC (Conference Interpreters)",
] as const;

export const LANGUAGE_PAIRS_DEFAULT = [
  "Indonesia ↔ Inggris",
  "Indonesia ↔ Mandarin",
  "Indonesia ↔ Jepang",
  "Indonesia ↔ Korea",
  "Indonesia ↔ Arab",
  "Indonesia ↔ Spanyol",
  "Indonesia ↔ Prancis",
  "Indonesia ↔ Jerman",
  "Indonesia ↔ Italia",
  "Indonesia ↔ Belanda",
  "Inggris ↔ Mandarin",
  "Inggris ↔ Spanyol",
] as const;

export const REFERRAL_SOURCES = [
  "Google", "Instagram", "LinkedIn", "Teman", "Linguo Student", "Lainnya",
] as const;

export const GENDERS = [
  { value: "male", label: "Pria" },
  { value: "female", label: "Wanita" },
  { value: "other", label: "Lainnya" },
] as const;
