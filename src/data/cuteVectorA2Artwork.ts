/** Ilustrasi SVG minimalis per sesi A1–A2. Teks judul dan tujuan tetap dari dek. */
export const CUTE_VECTOR_A2_LANGUAGES = [
  'japanese', 'korean', 'french', 'arabic', 'hebrew', 'persian', 'javanese',
  'sundanese', 'bipa', 'georgian', 'greek', 'russian', 'swedish', 'norwegian',
  'danish', 'finnish', 'polish', 'hungarian', 'romanian', 'turkish', 'bulgarian',
  'ukrainian', 'icelandic',
] as const;

const bahasa = new Set<string>(CUTE_VECTOR_A2_LANGUAGES);

export function cuteVectorA2Artwork(key: string, session: number): {
  cover: string; objectives: string; latar: string;
} | null {
  const match = /^([a-z-]+)-(a1-[1-3]|a2-[1-4])$/.exec(key);
  if (!match || !bahasa.has(match[1]) || !Number.isInteger(session) || session < 1 || session > 16) return null;
  const base = `/slide-cover/${key}-sesi-${session}`;
  return {
    cover: `${base}-cover-cute-vector-v1.svg`,
    objectives: `${base}-tujuan-cute-vector-v1.svg`,
    latar: `/slide-cover/${match[1]}-a1-a2-latar-cute-vector-v1.svg`,
  };
}
