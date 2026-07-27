// [linguo-patch:b2b-progress-report-v1]
// Konfigurasi cohort B2B untuk form Laporan Progress yang diisi pengajar
// di /laporan-b2b/<slug>. Nambah cohort baru = nambah satu entry di COHORTS.
//
// Roster & metadata disalin dari tabel corporate_leads + corporate_participants
// (di-hardcode biar form tetap jalan tanpa membuka RLS tabel B2B ke anon —
// pola yang sama dipakai /pretest/vietnam).

export type RosterEntry = { id: string; name: string; department?: string };

export type CohortConfig = {
  slug: string;
  label: string;             // dipakai juga sebagai cohort_label di DB
  leadId: string | null;
  companyName: string;
  language: string;
  flag: "vn" | "cn" | "kr" | "jp" | null;
  level: string;
  sessionsTotal: number;
  defaultTeacherName: string;
  defaultTeacherEmail: string;
  teacherId: string | null;
  /** Sarankan pembagian grup di form (kelas besar biasanya dipecah) */
  suggestGroups: boolean;
  groupOptions: string[];
  roster: RosterEntry[];
};

// PT Sumber Alfaria Trijaya, Tbk (Alfamart) × Vietnam Class
const ALFAMART_VIETNAM: CohortConfig = {
  slug: "alfamart-vietnam",
  label: "Alfamart × Vietnam Class · A1.1",
  leadId: "64fc2114-760d-4638-a7fb-9f64907d5d3b",
  companyName: "PT Sumber Alfaria Trijaya, Tbk (Alfamart)",
  language: "Vietnamese",
  flag: "vn",
  level: "Basic (A1.1)",
  sessionsTotal: 54,
  defaultTeacherName: "Angga Pranata, S.S.",
  defaultTeacherEmail: "huangge71@gmail.com",
  teacherId: "0a2a30bc-dcc7-407d-b77e-dab222d31b26",
  suggestGroups: true,
  groupOptions: ["Kelas A", "Kelas B", "Kelas C"],
  roster: [
    { id: "6cdad278-45e0-4c2e-82a2-d243dddfb49a", name: "YUDI SOBARI", department: "Operations General Manager Regional 3" },
    { id: "25350d75-292d-4e23-a237-7faa05eaa15f", name: "MIRZANDA PITALOKA ARTONO", department: "Merchandising Manager Food 1" },
    { id: "89a90734-7158-465d-ae7a-874d7503f6b1", name: "ABDUL AZIZ", department: "Category Manager" },
    { id: "1ea22111-ee20-4c30-9316-60329c3341ad", name: "BERNADETHE CLAUDIA RINDINA", department: "Branch Marketing Manager" },
    { id: "bd443d14-852a-4beb-8d49-898406c1461d", name: "B. DIMAS SURYA WIRAWAN", department: "Buyer Non Food" },
    { id: "e2aac55e-7e73-4663-b0ab-601353f2ceac", name: "YOHANES ROYKE RAU", department: "Logistic Development Manager" },
    { id: "158b778f-1b6b-4930-be1c-916de61ce5fe", name: "YASON DOUGLAS SITORUS", department: "IT Store Scrum Specialist" },
    { id: "7eadca4b-8ffa-48a1-b412-c4d9ff060172", name: "MUHLISHIN AKBAR", department: "Operations Product & Store Development Specialist" },
    { id: "b3b3fb7d-fe24-41c9-a939-63b82eebf0f5", name: "GEDE DEANY JANUAR", department: "Operations Product & Store Development Specialist" },
    { id: "0609cb59-b66c-44f6-b866-82efbc97c93d", name: "I GST PUTU AGUS YOGA MAHENDRA", department: "Operations Store & Digital Project Manager" },
    { id: "1bb82790-e55a-4a18-aa56-4c679a35a591", name: "AJAT SUDRAJAT SPD I", department: "Branch Location Manager" },
    { id: "4bd4f59a-a8bb-4a81-bfca-d3f1b2780e30", name: "MARLA D SINAGA", department: "Logistic General Manager" },
    { id: "b2bf24c7-1045-48fd-87bd-3d92a8506227", name: "ANDRIAN TIRTA HIRAWAN", department: "International Business Analyst" },
    { id: "b4e44124-4f00-4be4-9cf3-5f2bb22879ce", name: "M. ARIF KURNIAWAN", department: "Logistic System Analyst" },
    { id: "412d14d6-0aa8-4435-b48f-c34d0e045bbc", name: "MATHIAS ANGGER YUDISTIRA", department: "Warehouse Manager" },
    { id: "968668a8-b80a-4218-a63a-79eb37b5d7d2", name: "HANNIF ARDIANSYAH", department: "Issuing Coordinator" },
    { id: "47d60343-55b3-4906-b54e-dc2abaa6c375", name: "ADRIANUS HERI MULIAWAN TANUDJAJA", department: "PROPERTY & DEVELOPMENT DIRECTOR" },
  ],
};

export const COHORTS: Record<string, CohortConfig> = {
  [ALFAMART_VIETNAM.slug]: ALFAMART_VIETNAM,
};

export function getCohort(slug: string): CohortConfig | null {
  return COHORTS[slug] ?? null;
}

// ─── Skala penilaian (sama dengan yang tercetak di laporan klien) ───
export const SCORE_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

export const SCORE_ASPECTS = [
  {
    key: "score_active" as const,
    label: "Keaktifan di kelas",
    hint: "Seberapa sering ikut bicara, tanya, dan ambil inisiatif saat sesi.",
  },
  {
    key: "score_mastery" as const,
    label: "Penguasaan materi",
    hint: "Pemahaman kosakata, tata bahasa, dan akurasi saat latihan.",
  },
  {
    key: "score_confidence" as const,
    label: "Kepercayaan diri",
    hint: "Keberanian & kelancaran waktu praktik bicara.",
  },
];

export function scoreBand(v: number | null): { label: string; tone: string } {
  if (v == null) return { label: "—", tone: "#94a3b8" };
  if (v >= 4.1) return { label: "Sangat Baik / Sangat Aktif", tone: "#15803d" };
  if (v >= 3.1) return { label: "Baik / Aktif", tone: "#0f766e" };
  if (v >= 2.1) return { label: "Cukup", tone: "#b45309" };
  if (v >= 1.1) return { label: "Kurang", tone: "#dc2626" };
  return { label: "Sangat Kurang", tone: "#b91c1c" };
}

/** Label singkat per angka, dipakai di dropdown biar pengajar gak nebak arti skor */
export function scoreOptionLabel(v: number): string {
  const base =
    v >= 4.1 ? "Sangat Baik" : v >= 3.1 ? "Baik" : v >= 2.1 ? "Cukup" : v >= 1.1 ? "Kurang" : "Sangat Kurang";
  return `${v} — ${base}`;
}

export const SCALE_LEGEND = [
  { range: "4.1 – 5.0", label: "Sangat Baik / Sangat Aktif", desc: "Di atas ekspektasi, mandiri, dan konsisten" },
  { range: "3.1 – 4.0", label: "Baik / Aktif", desc: "Memahami & bisa mempraktikkan materi, performa memuaskan" },
  { range: "2.1 – 3.0", label: "Cukup", desc: "Paham dasar, masih butuh bimbingan atau repetisi" },
  { range: "1.1 – 2.0", label: "Kurang", desc: "Kesulitan mengikuti ritme kelas, butuh perhatian khusus" },
  { range: "1.0", label: "Sangat Kurang", desc: "Belum menunjukkan pemahaman atau partisipasi yang diharapkan" },
];

// ─── Tipe baris peserta di form & DB ───
export type ParticipantRow = {
  participant_id: string | null;
  name: string;
  department: string;
  group_label: string;
  active: boolean;               // false = sudah tidak mengikuti kelas
  sessions_total: number | null;
  attended: number | null;
  excused_work: number | null;
  sick: number | null;
  score_active: number | null;
  score_mastery: number | null;
  score_confidence: number | null;
  observation: string;
};

export function makeRow(p: RosterEntry, sessionsDone: number | null): ParticipantRow {
  return {
    participant_id: p.id,
    name: p.name,
    department: p.department || "",
    group_label: "",
    active: true,
    sessions_total: sessionsDone,
    attended: null,
    excused_work: null,
    sick: null,
    score_active: null,
    score_mastery: null,
    score_confidence: null,
    observation: "",
  };
}

export function avgScore(r: ParticipantRow): number | null {
  const vals = [r.score_active, r.score_mastery, r.score_confidence].filter(
    (v): v is number => typeof v === "number"
  );
  if (vals.length < 3) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / 3) * 10) / 10;
}

export function attendancePct(r: ParticipantRow): number | null {
  if (!r.sessions_total || r.attended == null) return null;
  return Math.round((r.attended / r.sessions_total) * 100);
}
