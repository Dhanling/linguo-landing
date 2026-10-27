/* [dialog-suara-penutur-v1] Suara TTS per pembicara di slide dialog.
 *
 * Permintaan owner 27 Okt 2026: "Budi harusnya cowok suaranya". Dulu semua
 * baris dialog dibacakan suara bawaan (Kore, wanita), jadi Frau Schneider dan
 * Budi terdengar sama. Kini tiap pembicara dapat persona PERSONA_SUARA
 * (ttsVoice.ts) sesuai gendernya, dan dua pembicara bergender sama tetap
 * dibedakan (wanita → wanita-tua → remaja-pi, pria → pria-tua → remaja-pa).
 *
 * Gender diambil dari:
 *   1. penuturGender.json — label `speaker` di semua dek siap pakai, diklasifikasi
 *      sekali (27 Okt 2026, 3.451 label; yang netral/ambigu tidak dicatat).
 *   2. gelar di depan nama (Herr/Frau, Pak/Bu, Sr./Sra., …) — untuk dek baru
 *      atau dek buatan pengajar yang namanya belum ada di peta.
 *   3. tak ketahuan → gender yang paling sedikit di dialog itu, supaya dua
 *      pembicara tak pernah bersuara sama.
 *
 * Dek baru dengan nama baru: tambahkan barisnya ke penuturGender.json.
 * 🔴 KEMBAR di dua repo (landing & admin) — salin utuh, termasuk JSON-nya.
 */
import petaGender from "../data/penuturGender.json";

type Gender = "m" | "f";

const PETA = petaGender as Record<string, Gender>;

const GELAR_PRIA = /^(herr|mr|sr|señor|senhor|don|dom|seu|signor|sig|monsieur|m|pak|bapak|mas|kang|bang|abang|tuan|encik|pan|domnul|dl|kuya|tito|amca|bey|ustadz|ustaz|kakek|opa|papa|ayah|abu|om)\b\.?\s/iu;
const GELAR_WANITA = /^(frau|mrs|ms|miss|sra|srta|señora|señorita|senhora|doña|dona|signora|sig\.ra|madame|mme|mademoiselle|mlle|bu|ibu|mbak|teh|ceu|nyonya|puan|pani|doamna|dna|ate|tita|teyze|hanım|ustadzah|nenek|oma|mama|umm|tante)\b\.?\s/iu;

/** Gender seorang pembicara; null = tak ketahuan. */
export function genderPenutur(nama?: string | null): Gender | null {
  const n = String(nama ?? "").trim();
  if (!n) return null;
  const ada = PETA[n] ?? PETA[n.replace(/\s*\([^)]*\)\s*$/, "")];
  if (ada) return ada;
  if (GELAR_WANITA.test(n)) return "f";
  if (GELAR_PRIA.test(n)) return "m";
  return null;
}

const KOLAM: Record<Gender, string[]> = {
  f: ["wanita", "wanita-tua", "remaja-pi"],
  m: ["pria", "pria-tua", "remaja-pa"],
};

/** Nama pembicara (urut kemunculan) → id persona suara. */
export function personaDialog(nama: (string | null | undefined)[]): Map<string, string> {
  const out = new Map<string, string>();
  const hitung: Record<Gender, number> = { f: 0, m: 0 };
  const urut = [...new Set(nama.map((s) => String(s ?? "").trim()).filter(Boolean))];
  const tahu = urut.map(genderPenutur);
  // Yang ketahuan dihitung dulu, supaya yang tak ketahuan mengisi gender yang kurang.
  const sisa: Record<Gender, number> = { f: 0, m: 0 };
  tahu.forEach((g) => { if (g) sisa[g]++; });
  urut.forEach((s, i) => {
    let g = tahu[i];
    if (!g) {
      g = sisa.m < sisa.f ? "m" : sisa.f < sisa.m ? "f" : hitung.f <= hitung.m ? "f" : "m";
      sisa[g]++;
    }
    out.set(s, KOLAM[g][hitung[g] % KOLAM[g].length]);
    hitung[g]++;
  });
  return out;
}
