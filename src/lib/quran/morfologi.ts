// [quran-morfologi-v1] Terjemahan tag Quranic Arabic Corpus → istilah nahwu-sharaf
// yang dipakai pengajar Arab di Indonesia (isim/fi'il/harf, marfu'/manshub/majrur,
// wazan, dll). Murni (tanpa I/O) supaya bisa dipakai di klien, route AI, dan tes.
//
// Satu kata Al-Qur'an = beberapa SEGMEN: awalan (وَ، بِ، ال), batang, akhiran
// (dhamir). Data mentah per segmen: [bentuk, pos, "TAG|TAG|KUNCI:NILAI"].
// Lihat scripts/build-quran-morph.mjs untuk asal datanya.

export type SegmenMentah = [bentuk: string, pos: string, tag: string];

export type Segmen = {
  bentuk: string;
  /** Isim / Fi'il / Harf */
  jenis: "isim" | "fi'il" | "harf";
  peran: "awalan" | "batang" | "akhiran";
  /** Label utama, mis. "Fi'il Madhi", "Huruf Jar", "Isim Fa'il". */
  label: string;
  /** Label Arab pendamping, mis. "فعل ماض". */
  labelArab: string;
  /** Chip keterangan: i'rab, jenis kelamin, jumlah, orang, dsb. */
  ciri: string[];
  akar?: string;
  lema?: string;
  /** Wazan fi'il (bab I–XII) bila ada. */
  wazan?: { nomor: number; pola: string };
  /** I'rab/keadaan akhir kata: marfu', manshub, majrur, majzum. */
  irab?: string;
};

const JENIS: Record<string, Segmen["jenis"]> = { N: "isim", V: "fi'il", P: "harf" };

// Tag utama → [label Indonesia, label Arab]. Urutan pengecekan penting: tag yang
// lebih spesifik (ACT_PCPL, REL, DEM) harus menang atas label jenis umum.
const TAG_UTAMA: Record<string, [string, string]> = {
  // Isim
  PN: ["Isim 'Alam (nama diri)", "اسم علم"],
  ADJ: ["Isim Sifat (na'at)", "صفة"],
  DEM: ["Isim Isyarah (kata tunjuk)", "اسم إشارة"],
  REL: ["Isim Maushul (kata sambung)", "اسم موصول"],
  PRON: ["Dhamir (kata ganti)", "ضمير"],
  T: ["Zharaf Zaman (keterangan waktu)", "ظرف زمان"],
  LOC: ["Zharaf Makan (keterangan tempat)", "ظرف مكان"],
  ACT_PCPL: ["Isim Fa'il (pelaku)", "اسم فاعل"],
  PASS_PCPL: ["Isim Maf'ul (yang dikenai)", "اسم مفعول"],
  VN: ["Mashdar (kata benda verbal)", "مصدر"],
  NV: ["Isim Fi'il", "اسم فعل"],
  // Fi'il
  PERF: ["Fi'il Madhi (lampau)", "فعل ماض"],
  IMPF: ["Fi'il Mudhari' (sekarang/akan)", "فعل مضارع"],
  IMPV: ["Fi'il Amr (perintah)", "فعل أمر"],
  // Harf
  P: ["Huruf Jar (preposisi)", "حرف جر"],
  DET: ["Alif Lam Ta'rif (penanda definit)", "أداة تعريف"],
  CONJ: ["Huruf 'Athaf (kata sambung)", "حرف عطف"],
  REM: ["Huruf Isti'naf (pembuka kalimat baru)", "حرف استئنافية"],
  NEG: ["Huruf Nafi (peniadaan)", "حرف نفي"],
  EMPH: ["Lam Taukid (penegas)", "لام التوكيد"],
  ACC: ["Huruf Nashb (inna & saudaranya)", "حرف نصب"],
  SUB: ["Huruf Mashdariyah", "حرف مصدري"],
  COND: ["Huruf Syarat (pengandaian)", "حرف شرط"],
  INTG: ["Huruf Istifham (tanya)", "حرف استفهام"],
  VOC: ["Huruf Nida (panggilan)", "حرف نداء"],
  RES: ["Huruf Hashr (pembatas)", "أداة حصر"],
  EXP: ["Huruf Istitsna' (pengecualian)", "أداة استثناء"],
  CERT: ["Huruf Tahqiq (sungguh/telah)", "حرف تحقيق"],
  RSLT: ["Fa' Jawab (akibat)", "حرف واقع في جواب الشرط"],
  PRO: ["La Nahiyah (larangan)", "حرف نهي"],
  PRP: ["Lam Ta'lil (tujuan)", "لام التعليل"],
  CIRC: ["Wawu Haliyah (keadaan)", "واو الحال"],
  SUP: ["Huruf Za'idah (tambahan)", "حرف زائد"],
  PREV: ["Ma Kaffah (pencegah amal)", "كافة"],
  FUT: ["Huruf Istiqbal (akan)", "حرف استقبال"],
  RET: ["Huruf Idhrab (bahkan)", "حرف إضراب"],
  EXL: ["Huruf Tafshil (adapun)", "حرف تفصيل"],
  AMD: ["Huruf Istidrak (tetapi)", "حرف استدراك"],
  ANS: ["Huruf Jawab", "حرف جواب"],
  INC: ["Huruf Ibtida'", "حرف ابتداء"],
  INT: ["Huruf Tafsir (yakni)", "حرف تفسير"],
  EXH: ["Huruf Tahdhidh (anjuran)", "حرف تحضيض"],
  SUR: ["Huruf Fuja'ah (tiba-tiba)", "حرف فجاءة"],
  AVR: ["Huruf Rad' (sekali-kali tidak)", "حرف ردع"],
  INL: ["Huruf Muqaththa'ah", "حروف مقطعة"],
  EQ: ["Huruf Taswiyah (sama saja)", "حرف تسوية"],
  COM: ["Wawu Ma'iyyah (bersama)", "واو المعية"],
  CAUS: ["Huruf Sababiyah (sebab)", "حرف سببية"],
  ATT: ["Ha' Tanbih (perhatian)", "حرف تنبيه"],
  DIST: ["Lam Bu'd (penanda jauh)", "لام البعد"],
  ADDR: ["Kaf Khitab (penanda lawan bicara)", "حرف خطاب"],
};

const UMUM: Record<Segmen["jenis"], [string, string]> = {
  isim: ["Isim (kata benda)", "اسم"],
  "fi'il": ["Fi'il (kata kerja)", "فعل"],
  harf: ["Harf (partikel)", "حرف"],
};

const IRAB_ISIM: Record<string, string> = { NOM: "Marfu'", ACC: "Manshub", GEN: "Majrur" };
const IRAB_FIIL: Record<string, string> = { IND: "Marfu'", SUBJ: "Manshub", JUS: "Majzum" };

// Pola wazan pakai ف ع ل. Bab XI & XII jarang (1 kemunculan) — tetap diberi nama.
const WAZAN: Record<number, string> = {
  1: "فَعَلَ",
  2: "فَعَّلَ",
  3: "فَاعَلَ",
  4: "أَفْعَلَ",
  5: "تَفَعَّلَ",
  6: "تَفَاعَلَ",
  7: "اِنْفَعَلَ",
  8: "اِفْتَعَلَ",
  9: "اِفْعَلَّ",
  10: "اِسْتَفْعَلَ",
  11: "اِفْعَالَّ",
  12: "اِفْعَوْعَلَ",
};

const ORANG: Record<string, string> = { "1": "orang ke-1", "2": "orang ke-2", "3": "orang ke-3" };
const KELAMIN: Record<string, string> = { M: "mudzakkar", F: "mu'annats" };
const JUMLAH: Record<string, string> = { S: "mufrad", D: "mutsanna", P: "jamak" };

// Dhamir: 3MP → "hum" dst. Dipakai untuk kalimat ringkas ("pelaku: mereka").
const DHAMIR_ID: Record<string, string> = {
  "1S": "aku", "1P": "kami",
  "2MS": "engkau (lk)", "2FS": "engkau (pr)", "2D": "kalian berdua", "2MD": "kalian berdua",
  "2FD": "kalian berdua (pr)", "2MP": "kalian (lk)", "2FP": "kalian (pr)",
  "3MS": "dia (lk)", "3FS": "dia (pr)", "3D": "mereka berdua", "3MD": "mereka berdua (lk)",
  "3FD": "mereka berdua (pr)", "3MP": "mereka (lk)", "3FP": "mereka (pr)",
};

/** Tag PGN (person-gender-number) seperti "3MP", "MS", "FP", "1S", "D". */
const PGN = /^([123])?([MF])?([SDP])$/;

function uraiPgn(tag: string): string[] {
  const m = PGN.exec(tag);
  if (!m) return [];
  const [, o, k, j] = m;
  return [o && ORANG[o], k && KELAMIN[k], j && JUMLAH[j]].filter(Boolean) as string[];
}

export function uraiSegmen([bentuk, pos, tagMentah]: SegmenMentah): Segmen {
  const jenis = JENIS[pos] ?? "harf";
  const tags = tagMentah ? tagMentah.split("|") : [];
  const kv: Record<string, string> = {};
  const flag = new Set<string>();
  for (const t of tags) {
    const i = t.indexOf(":");
    if (i > 0) kv[t.slice(0, i)] = t.slice(i + 1);
    else if (t) flag.add(t);
  }
  const peran: Segmen["peran"] = flag.has("PREF") ? "awalan" : flag.has("SUFF") ? "akhiran" : "batang";

  // Label utama: tag spesifik pertama yang dikenal. IMPV di harf = Lam Amr (awalan),
  // bukan Fi'il Amr; ACC di harf = Huruf Nashb, di isim = kasus manshub.
  let label = UMUM[jenis];
  if (jenis === "harf" && flag.has("IMPV")) label = ["Lam Amr (perintah)", "لام الأمر"];
  else {
    for (const t of tags) {
      if (!(t in TAG_UTAMA)) continue;
      if (jenis !== "harf" && ["P", "ACC", "CONJ", "NEG", "SUB", "COND"].includes(t)) continue;
      if (jenis === "harf" && ["PERF", "IMPF", "IMPV", "PRON", "T", "LOC", "PN"].includes(t)) continue;
      label = TAG_UTAMA[t];
      break;
    }
  }

  const ciri: string[] = [];
  let irab: string | undefined;
  if (jenis === "isim") {
    for (const c of ["NOM", "ACC", "GEN"]) if (flag.has(c)) irab = IRAB_ISIM[c];
    if (flag.has("INDEF")) ciri.push("nakirah (tak tentu)");
  }
  if (jenis === "fi'il") {
    if (kv.MOOD) irab = IRAB_FIIL[kv.MOOD];
    if (flag.has("PASS")) ciri.push("majhul (pasif)");
  }
  if (irab) ciri.unshift(irab);
  for (const t of flag) ciri.push(...uraiPgn(t));
  if (kv.FAM) ciri.push(`golongan ${kv.FAM}`);

  const nomorWazan = kv.VF ? Number(kv.VF) : NaN;
  return {
    bentuk,
    jenis,
    peran,
    label: label[0],
    labelArab: label[1],
    ciri,
    akar: kv.ROOT,
    lema: kv.LEM,
    wazan: Number.isFinite(nomorWazan) ? { nomor: nomorWazan, pola: WAZAN[nomorWazan] ?? "" } : undefined,
    irab,
  };
}

/** Akar "كفر" → "ك ف ر" supaya tiga hurufnya kebaca terpisah. */
export const eja = (akar: string) => [...akar].join(" ");

const ROMAWI = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
export const romawi = (n: number) => ROMAWI[n] ?? String(n);

// Isolasi arah teks (FSI…PDI): potongan Arab di tengah kalimat Latin tanpa ini
// diacak algoritma bidi — tanda kurung & "+" berpindah ke sisi yang salah.
const iso = (ar: string) => `\u2068${ar}\u2069`;

/**
 * Kalimat ringkas satu kata utuh, mis.
 * "wa + Fi'il Madhi (lampau) bab I dari akar ك ف ر, pelaku: mereka (lk)".
 * Dipakai sebagai ringkasan di panel kata & sebagai bahan prompt i'rab AI.
 */
export function ringkasKata(segmen: Segmen[], { isolasi = true } = {}): string {
  const ar = isolasi ? iso : (x: string) => x;
  const batang = segmen.find((s) => s.peran === "batang") ?? segmen[0];
  if (!batang) return "";
  const bagian: string[] = [];
  const awalan = segmen.filter((s) => s.peran === "awalan").map((s) => `${ar(s.bentuk)} (${s.label.split(" (")[0]})`);
  if (awalan.length) bagian.push(`${awalan.join(" + ")} +`);
  let inti = batang.label;
  if (batang.wazan) inti += ` bab ${romawi(batang.wazan.nomor)}`;
  if (batang.akar) inti += ` dari akar ${ar(eja(batang.akar))}`;
  if (batang.irab) inti += `, ${batang.irab.toLowerCase()}`;
  bagian.push(inti);
  const akhiran = segmen.filter((s) => s.peran === "akhiran");
  for (const a of akhiran) {
    const siapa = DHAMIR_ID[kodePgn(a)];
    if (!siapa) continue;
    // Dhamir yang menempel di fi'il = pelaku (fa'il) atau objek; di isim = pemilik.
    const peran = batang.jenis === "fi'il" ? "dhamir" : "milik";
    bagian.push(`+ ${ar(a.bentuk)} (${peran}: ${siapa})`);
  }
  // Fi'il tanpa akhiran: pelakunya tersimpan di bentuk kata kerjanya sendiri.
  if (batang.jenis === "fi'il" && !akhiran.length) {
    const pgn = kodePgn(batang);
    if (pgn && DHAMIR_ID[pgn]) bagian.push(`(pelaku: ${DHAMIR_ID[pgn]})`);
  }
  return bagian.join(" ");
}

// Ambil kembali kode PGN dari ciri yang sudah diterjemahkan (kebalikan uraiPgn).
function kodePgn(s: Segmen): string {
  const o = s.ciri.find((c) => c.startsWith("orang ke-"))?.slice(-1) ?? "";
  const k = s.ciri.includes("mudzakkar") ? "M" : s.ciri.includes("mu'annats") ? "F" : "";
  const j = s.ciri.includes("mufrad") ? "S" : s.ciri.includes("mutsanna") ? "D" : s.ciri.includes("jamak") ? "P" : "";
  return j ? `${o}${k}${j}` : "";
}
