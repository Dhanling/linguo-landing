// [avatar-bawaan-siswa-v1] Avatar ilustrasi bawaan untuk siswa yang belum punya foto
// (students.avatar_url kosong). Tabel students tidak punya kolom jenis kelamin, jadi
// pilihannya DITEBAK dari nama: laki-laki, perempuan, atau perempuan berhijab (nama
// bernuansa Islami). Tebakan bisa meleset — karena itu siswa bisa menggantinya sendiri
// di Pengaturan → Foto Profil; pilihan itu disimpan sebagai URL biasa di avatar_url.
// ⚠️ Salinan kembar: linguo-admin-dashboard/src/lib/defaultAvatar.ts — ubah keduanya.

export type AvatarPreset = "laki" | "perempuan" | "hijab";

export const AVATAR_PRESETS: { key: AvatarPreset; label: string; file: string }[] = [
  { key: "laki", label: "Laki-laki", file: "siswa-laki.webp" },
  { key: "perempuan", label: "Perempuan", file: "siswa-perempuan.webp" },
  { key: "hijab", label: "Berhijab", file: "siswa-hijab.webp" },
];

// URL yang DISIMPAN ke avatar_url harus absolut (dibaca juga oleh dashboard pengajar/staf).
const PRESET_ORIGIN = "https://linguo.id";
export const presetPath = (key: AvatarPreset) =>
  `/avatars/${AVATAR_PRESETS.find((p) => p.key === key)!.file}`;
export const presetUrl = (key: AvatarPreset) => PRESET_ORIGIN + presetPath(key);
export const presetOfUrl = (url?: string | null): AvatarPreset | null =>
  AVATAR_PRESETS.find((p) => !!url && url.split("?")[0].endsWith(`/avatars/${p.file}`))?.key ?? null;

// Awalan yang bukan nama (label kelas, gelar) — dilewati saat menebak.
const SKIP = new Set(["tp", "mr", "mrs", "ms", "dr", "drs", "ir", "hj", "h", "kak", "ibu", "bu", "pak", "bapak", "mas", "mbak"]);

// Penanda kuat di posisi mana pun dalam nama.
const MALE_ANY = new Set(["muhammad", "muhamad", "mohammad", "mohamad", "mochammad", "mochamad", "moh", "muh", "m", "md", "ahmad", "achmad", "akhmad", "abdul", "abdullah", "bin", "teuku", "tengku", "putra", "putera", "saputra", "pratama", "wijaya", "kurniawan", "setiawan", "gunawan", "hidayat", "nugroho", "santoso", "firmansyah", "bagus", "gede", "agus"]);
const FEMALE_ANY = new Set(["siti", "sitti", "binti", "putri", "puteri", "dewi", "ayu", "sri", "cut", "ni", "luh", "ning", "nyimas", "saputri", "pratiwi", "lestari", "wulandari", "permatasari", "rahmawati", "anggraini", "anggraeni", "handayani", "maharani", "kusumawati", "ningrum", "ningsih", "safitri", "fitriani", "oktaviani", "novitasari", "puspita", "puspitasari", "utami", "wati", "azzahra", "zahra", "khairunnisa", "annisa", "nisa", "nissa"]);

// Nama depan yang akhirannya menipu aturan umum di bawah.
const MALE_FIRST = new Set(["andhika", "andika", "dhika", "dika", "angga", "reza", "resa", "deva", "hamka", "mahardhika", "mahardika", "isa", "musa", "yahya", "zakaria", "surya", "yoga", "raka", "bima", "krisna", "krishna", "wira", "rama", "aditya", "adithya", "arya", "aria", "satria", "satya", "indra", "candra", "chandra", "hendra", "yudha", "yuda", "danendra", "narendra", "mahendra", "rajendra", "nehemia", "yeremia", "yosua", "joshua", "luca", "luka", "andre", "ade", "adhe", "jose", "ferry", "ferdy", "danny", "denny", "deny", "johny", "jonny", "tommy", "tony", "rudy", "eddy", "edy", "hary", "harry", "henry", "ghiffary", "gary", "jimmy", "willy", "bobby", "rocky", "ricky", "rizky", "risky", "dicky", "fikry", "fahry", "zaky", "rafly", "aldy", "ardy", "andy", "fredy", "freddy", "herry", "jerry", "jeffry", "jefry", "benny", "ronny", "sonny", "teddy", "yopy", "dony", "donny", "i", "ray", "roy", "jay", "rey", "desta", "dana", "nanda", "ananda", "fauza", "mirza", "rafa", "raffa", "daffa", "dafa", "naufa", "zidna", "arka", "azka", "saka", "dewa", "juna", "arjuna", "bisma", "yusa", "tirta", "pasha", "eka", "okta", "prima", "setia", "gilang"]);
const FEMALE_FIRST = new Set(["nur", "nurul", "nuri", "nurin", "dian", "jihan", "husnul", "qatrun", "ruth", "elisabeth", "elizabeth", "lisbeth", "jennifer", "sarah", "hannah", "mayang", "kim", "jocelyn", "jesslyn", "jesselyn", "adelynn", "evelyn", "carolyn", "marlien", "nazneen", "fifin", "ferin", "beatrix", "precious", "mares", "ines", "agnes", "iis", "lilis", "titis", "dzumirratin", "kinar", "nirel", "reichel", "rachel", "rahel", "isabel", "mabel", "angel", "abigail", "hazel", "hayzel", "muriel", "carmen", "karen", "kirana", "ellen", "helen", "jean", "joan", "megan", "lilian", "vivian", "intan", "bulan", "wulan", "berlian", "ririn", "rini", "karin", "airin", "erin", "lin", "titin", "yasmin", "jasmin", "jasmine", "nurjannah", "fitri", "sofi", "sofie", "sophie", "suci", "reni", "reny", "devi", "devy", "debbi", "debby", "emi", "emy", "febi", "feby", "feli", "femmi", "heidi", "sari", "hayati", "narumi", "ruri", "kiki", "maydi", "yayi", "yuli", "yeni", "yenni", "yuni", "leni", "lenni", "eni", "ani", "anni", "tini", "tuti", "titi", "siwi", "tiwi", "dwi", "tri", "asri", "astri", "lastri", "sasi", "desi", "dessy", "desy", "vivi", "lili", "lily", "mimi", "nini", "riri", "susi", "susy", "santi", "shanti", "ranti", "yanti", "asti", "esti", "isti", "rasti", "resti", "risti", "melati", "bestari", "eci", "uci", "oci", "ici", "indri", "putu", "ayumi", "naomi", "noemi", "eunike", "bintang", "kasih", "asih", "ratih", "galuh", "sekar", "mawar", "nilam", "mutiara", "kimberly", "skyy", "thifal", "ha", "thi", "ren", "ekta", "luckystri", "tasya", "maharesi", "meitrie"]);

// Token bernuansa Islami (nama sendiri maupun nama ayah di belakangnya).
const ISLAMI = /^(siti|sitti|binti|bin|nur|ummu|umi|cut)$|^(nur|ain|aisy|aish|ais?yah|ali+yah|all?yah|fati|fath|zahr|zahw|zahir|khair|khoir|khadij|khodij|khans|khofif|rahm|rohm|hiday|fadh?il|fadia|latif|lathif|az+a?hr|aini|izza|jann|salsa|salm|syif|shif|syak|shak|syar|syah|shaf|syaf|saff|safir|sakin|hanif|hasan|hasn|husn|halim|hayat|hafiz|hafidz|habib|aulia|auliy|aqil|afif|afin|atif|alif|alfi|alya|alma|amin|azi+z|arif|azhar|adawi|maulid|ramadh|romadh|fitri|lutf|muth|muti|mufid|muham|moham|mocham|ahmad|achmad|abdul|nabil|nail|najw|nazw|nazh|nazn|nadi|nady|nafis|nisrin|nis+a|sholeh|solih|soleh|ulfa|ulya|wardah|zain|zulf|zaki|zakiy|qatr|qur|kamil|nadhif|rizk|rizq|rezk|risk|farah|farh|farid|faiz|fauz|firda|dzak|dzik|dzum|ghani|ghaz|hakim|ihsan|ikhsan|ilham|ilma|iman|irfan|irsy|islam|jamil|jihan|karim|mahmud|mardiy|maryam|mariam|laila|laela|layla|lail|thif|taqi|taufi|tamana|inayah|hairun|hurun|humair|shauq|syauq|faaiz|akbar|akhbar|akmal|malik|rashid|rasyid|ridw|ridh|lukman|luqman|imam|elfatih|arrij|faisal|fais|fachr|fahr|fahl|fajr|rifd|rifq|rofi|sabil|sabr|syamil|yusuf|yunus|ibrah|ismail|idris|ilyas|umar|usman|utsman|hamz|hamka|hasb|hud|bilal|anas|anis|ahsan|amal|amir|amr|asma|asiy|atiq|azm)|(nisa|nissa|syah|uddin|udin|llah|tul|atun|iyah|iyyah)$/;

const tokensOf = (name?: string | null) =>
  (name || "").toLowerCase().normalize("NFD").replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w && !SKIP.has(w));

function isFemale(tokens: string[]): boolean {
  const first = tokens[0];
  // Penanda perempuan diperiksa dulu: "I Gusti Ayu …" / "M. … Putri" tetap perempuan.
  if (tokens.some((w) => FEMALE_ANY.has(w))) return true;
  if (FEMALE_FIRST.has(first)) return true;
  if (MALE_FIRST.has(first) || tokens.some((w) => MALE_ANY.has(w))) return false;
  if (/(wati|yanti|anti|arni|aeni|aini|uni|tiwi|asmi|ningsih|yati|ati|sari|sih)$/.test(first)) return true;
  if (/(us|ius|o|u|[nr]syah|din|man|wan)$/.test(first)) return false;
  if (/(a|ah|e|ie|y|yn|ine|elle|ette)$/.test(first)) return true;
  return false; // akhiran konsonan / -i selain daftar di atas → umumnya laki-laki
}

/** Tebak preset dari nama. null kalau namanya kosong (biar pemanggil jatuh ke inisial). */
export function guessAvatarPreset(name?: string | null): AvatarPreset | null {
  const tokens = tokensOf(name);
  if (!tokens.length) return null;
  if (!isFemale(tokens)) return "laki";
  return tokens.some((w) => ISLAMI.test(w)) ? "hijab" : "perempuan";
}

/** Avatar bawaan (path relatif, asetnya ada di /public/avatars tiap aplikasi). */
export function defaultAvatarFor(name?: string | null): string | null {
  const key = guessAvatarPreset(name);
  return key ? presetPath(key) : null;
}
