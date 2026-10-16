// [seo-tes-kota-v1] Potongan bersama hub /kursus-bahasa-offline dan halaman
// per kota. Komponen server — tanpa "use client".
//
// Semua angka diturunkan dari lib/trial-pricing.ts: selisih offline
// (OFFLINE_SURCHARGE_PER_SESSION), program yang boleh offline
// (OFFLINE_PROGRAMS), dan tarif Private per kategori bahasa.
import type { FaqItem } from "@/lib/schema";
import { BRAND_FACTS, rupiah } from "@/lib/brand-facts";
import {
  OFFLINE_SURCHARGE_PER_SESSION,
  applyOfflineSurcharge,
  getPrivateBase60,
} from "@/lib/trial-pricing";

export const TEAL = BRAND_FACTS.brandColor;
export const SELISIH_LABEL = rupiah(OFFLINE_SURCHARGE_PER_SESSION);

/** Tarif Private 60 menit level A1: online & offline. */
export function tarifPrivat(langEn: string) {
  const online = getPrivateBase60(langEn, "A1");
  return { online, offline: applyOfflineSurcharge(online, "offline") };
}

export function waOfflineHref(kota?: string) {
  const teks = kota
    ? `Halo Linguo, saya mau tanya kelas bahasa offline di ${kota}. Lokasi saya: `
    : "Halo Linguo, saya mau tanya kelas bahasa offline (pengajar datang ke lokasi). Lokasi saya: ";
  return `${BRAND_FACTS.contact.whatsappUrl}?text=${encodeURIComponent(teks)}`;
}

/** Tautan funnel Private langsung dengan mode offline + kota terisi. */
export function daftarOfflineHref(langSlug: string, kota?: string, program: "private" | "semi-private" = "private") {
  const q = new URLSearchParams({ mode: "offline" });
  if (kota) q.set("kota", kota);
  return `/daftar/${langSlug}/${program}?${q.toString()}`;
}

/** Langkah daftar — sama untuk semua kota. */
export const LANGKAH = [
  { judul: "Tanya ketersediaan", isi: "Kirim lokasi (kecamatan & patokan), bahasa, usia siswa, dan jadwal yang diinginkan lewat WhatsApp. Tim mengecek pengajar yang bisa menjangkau areamu." },
  { judul: "Pilih program & bayar", isi: "Pilih Kelas Private atau Semi Private, mode Offline, lalu isi kota/area kelas di halaman pendaftaran." },
  { judul: "Isi form pendataan", isi: "Sesudah pembayaran, kamu menerima link form untuk alamat lengkap dan preferensi jadwal — dipakai untuk mencarikan pengajar terdekat." },
  { judul: "Pengajar datang", isi: "Kelas berjalan di rumah, kos, atau kantormu pada jadwal yang disepakati." },
];

/** FAQ umum kelas offline — jawabannya dihitung, jadi markup = teks halaman. */
export function faqUmumOffline(namaKota?: string): FaqItem[] {
  const contoh = tarifPrivat("English");
  const di = namaKota ? ` di ${namaKota}` : "";
  return [
    {
      q: `Berapa biaya kursus bahasa offline${di}?`,
      a: `Tarif kelas offline sama dengan tarif online ditambah ${SELISIH_LABEL} per sesi, berlaku sama di semua kota. Contoh: Private bahasa Inggris level A1 60 menit ${rupiah(contoh.online)} per sesi online, jadi ${rupiah(contoh.offline)} per sesi offline. Tarif dasar berbeda per bahasa dan naik mengikuti level.`,
    },
    {
      q: "Program apa saja yang bisa offline?",
      a: "Kelas Private (1-on-1) dan Semi Private (grup 2–10 orang yang kamu bentuk sendiri, misalnya bersama teman atau keluarga). Kelas Reguler tetap online via Zoom dengan jadwal tetap per batch.",
    },
    {
      q: "Apakah kelas offline termasuk rekaman sesi dan e-book?",
      a: "Belum. Kelas offline berlangsung tatap muka, jadi belum termasuk paket Recording sesi dan E-book seperti kelas online.",
    },
    {
      q: "Bagaimana kalau belum ada pengajar di area saya?",
      a: "Ketersediaan pengajar offline bergantung pada pengajar yang bisa menjangkau lokasimu, jadi sebaiknya tanyakan dulu lewat WhatsApp. Kalau sesudah pembayaran ternyata belum ada pengajar di areamu, kamu bisa pindah ke kelas online (selisih biaya offline dikembalikan) atau meminta refund penuh.",
    },
    {
      q: "Apakah ada kelas offline untuk anak?",
      a: "Kelas Private dan Semi Private offline bisa untuk siswa anak maupun dewasa. Program Kelas Kids (usia 5–12 tahun, materi gamified) didaftarkan online lewat website; kalau kamu ingin pengajar datang ke rumah untuk anak, tanyakan lewat WhatsApp dengan menyebutkan usia anak.",
    },
    {
      q: `Apakah Linguo punya tempat kursus${di}?`,
      a: `Tidak. ${BRAND_FACTS.name} tidak membuka cabang; kantornya ada di ${BRAND_FACTS.address.addressLocality}. Kelas offline berjalan di lokasi siswa — pengajar yang datang ke rumah, kos, atau kantormu.`,
    },
  ];
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
      {items.map((f) => (
        <details key={f.q} className="group px-5 py-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 marker:hidden">
            <span className="flex items-center justify-between gap-3">
              {f.q}
              <span className="text-slate-400 transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
