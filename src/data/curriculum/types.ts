export interface SessionPreview {
  number: number;
  title: string;
  topics?: string[];
}

export interface Sublevel {
  code: string;
  name: string;
  sessions: SessionPreview[];
  preview: boolean; // true = topics visible (gratis preview), false = titles only (locked)
}

export interface Level {
  code: "A1" | "A2" | "B1" | "B2";
  name: string;
  description: string;
  sublevels: Sublevel[];
}

export type Region = "asian" | "european" | "nusantara" | "middle-eastern" | "african" | "other";

export interface LanguageMeta {
  slug: string;
  name: string;         // Indonesian/English display name
  nativeName: string;   // self-name
  flag: string;         // emoji
  region: Region;
  featured?: boolean;
  available: boolean;   // has full curriculum data
  description?: string;
  /** linguo-patch:silabus-search-alias-v1 — kata lain yang orang ketik di kotak cari
   *  ("malaysia" untuk Melayu, "hongkong" untuk Kanton). Cuma dipakai pencarian,
   *  tidak pernah ditampilkan. */
  aliases?: string[];
}

export interface LanguageCurriculum {
  meta: LanguageMeta;
  overview: string;
  levels: Level[];
}
