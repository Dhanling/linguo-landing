// Tema ilustrasi dan kelompok kosakata Prancis; aset raster dibuat dengan imagegen.
import type { MateriSlide } from '../lib/materiSlides';
export interface FrenchThematicTheme { key: string; title: string; label: string; groups: string[]; image: string; sprite: string | null }
export const FRENCH_THEMATIC_THEMES: readonly FrenchThematicTheme[] = [
  {
    "key": "keluarga",
    "title": "La famille",
    "label": "Keluarga",
    "groups": [
      "Keluarga inti",
      "Kerabat",
      "Hubungan keluarga"
    ],
    "image": "/slide-cover/french-themes/keluarga-flat-v1.jpg",
    "sprite": "/slide-cover/french-themes/keluarga-icons-v1.png"
  },
  {
    "key": "hewan",
    "title": "Les animaux",
    "label": "Hewan",
    "groups": [
      "Hewan peliharaan",
      "Hewan ternak",
      "Hewan liar"
    ],
    "image": "/slide-cover/french-themes/hewan-flat-v1.jpg",
    "sprite": "/slide-cover/french-themes/hewan-icons-v1.png"
  },
  {
    "key": "tumbuhan",
    "title": "Les plantes",
    "label": "Tumbuhan",
    "groups": [
      "Bagian tumbuhan",
      "Di kebun",
      "Jenis tumbuhan"
    ],
    "image": "/slide-cover/french-themes/tumbuhan-flat-v1.jpg",
    "sprite": "/slide-cover/french-themes/tumbuhan-icons-v1.png"
  },
  {
    "key": "buah-sayur",
    "title": "Les fruits et les légumes",
    "label": "Buah & Sayur",
    "groups": [
      "Buah-buahan",
      "Sayuran sehari-hari",
      "Sayuran lainnya"
    ],
    "image": "/slide-cover/french-themes/buah-sayur-flat-v1.jpg",
    "sprite": "/slide-cover/french-themes/buah-sayur-icons-v1.png"
  },
  {
    "key": "alam-cuaca",
    "title": "La nature et la météo",
    "label": "Alam & Cuaca",
    "groups": [
      "Langit & cuaca",
      "Bentang alam",
      "Alam di sekitar"
    ],
    "image": "/slide-cover/french-themes/alam-cuaca-flat-v1.jpg",
    "sprite": "/slide-cover/french-themes/alam-cuaca-icons-v1.png"
  },
  {
    "key": "warna-bentuk",
    "title": "Les couleurs et les formes",
    "label": "Warna & Bentuk",
    "groups": [
      "Warna dasar",
      "Warna lainnya",
      "Bentuk"
    ],
    "image": "/slide-cover/french-themes/warna-bentuk-flat-v1.jpg",
    "sprite": null
  },
  {
    "key": "tubuh",
    "title": "Le corps humain",
    "label": "Anggota Tubuh",
    "groups": [
      "Kepala & wajah",
      "Tubuh bagian atas",
      "Tubuh bagian bawah"
    ],
    "image": "/slide-cover/french-themes/tubuh-flat-v1.jpg",
    "sprite": "/slide-cover/french-themes/tubuh-icons-v1.png"
  },
  {
    "key": "rumah",
    "title": "La maison",
    "label": "Rumah & Perabot",
    "groups": [
      "Tempat tinggal",
      "Bagian rumah",
      "Perabot"
    ],
    "image": "/slide-cover/french-themes/rumah-flat-v1.jpg",
    "sprite": "/slide-cover/french-themes/rumah-icons-v1.png"
  },
  {
    "key": "pakaian",
    "title": "Les vêtements",
    "label": "Pakaian",
    "groups": [
      "Pakaian sehari-hari",
      "Aksesori",
      "Pakaian lainnya"
    ],
    "image": "/slide-cover/french-themes/pakaian-flat-v1.jpg",
    "sprite": "/slide-cover/french-themes/pakaian-icons-v1.png"
  },
  {
    "key": "transportasi",
    "title": "Les transports",
    "label": "Transportasi",
    "groups": [
      "Kendaraan sehari-hari",
      "Kendaraan lainnya",
      "Di perjalanan"
    ],
    "image": "/slide-cover/french-themes/transportasi-flat-v1.jpg",
    "sprite": "/slide-cover/french-themes/transportasi-icons-v1.png"
  },
  {
    "key": "profesi",
    "title": "Les métiers",
    "label": "Profesi",
    "groups": [
      "Kesehatan & pendidikan",
      "Jasa & layanan",
      "Pekerjaan lainnya"
    ],
    "image": "/slide-cover/french-themes/profesi-flat-v1.jpg",
    "sprite": "/slide-cover/french-themes/profesi-icons-v1.png"
  }
];
export function frenchThematicTheme(slide: MateriSlide): FrenchThematicTheme | undefined {
  return FRENCH_THEMATIC_THEMES.find(theme => slide.cover === theme.image);
}
