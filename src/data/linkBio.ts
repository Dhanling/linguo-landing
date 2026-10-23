// =============================================================================
// src/data/linkBio.ts — [link-bio-v1]
//
// Isi halaman /links, pengganti linktr.ee/asklinguo (Bug Tracker a3cad0cb, Intan,
// 23 Okt 2026: "sesuai info Ka Dhani saat meeting, Linktree diganti punya Linguo
// sendiri"). Urutan & label mengikuti Linktree lama per 23 Okt 2026, tapi tautannya
// dibenahi: yang dulu menunjuk ke Linktree lain (customersupportlinguo, LinguoB2B,
// B2BLinguo) kini langsung ke halaman/nomor Linguo sendiri.
//
// Mengubah isi bio: cukup edit berkas ini (tim sosmed minta lewat Bug Tracker /
// grup). Nomor WA & sosial media JANGAN diketik ulang — ambil dari BRAND_FACTS.
// =============================================================================
import { BRAND_FACTS } from "@/lib/brand-facts";

export type BioLink = {
  /** Teks tombol. */
  label: string;
  /** Keterangan kecil di bawah label (opsional). */
  note?: string;
  /** URL tujuan — path internal ("/jadwal-kelas-reguler") atau URL penuh (wa.me). */
  href: string;
  /** Tombol yang ditonjolkan (warna brand penuh). */
  highlight?: boolean;
};

const CS_WA = `https://wa.me/${BRAND_FACTS.contact.whatsapp}?text=${encodeURIComponent("Halo Linguo, saya mau tanya kelas bahasa")}`;
const PENGADUAN_WA = `https://wa.me/6281320113243?text=${encodeURIComponent("Halo Linguo, saya ingin menyampaikan saran/keluhan")}`;

export const BIO_LINKS: BioLink[] = [
  { label: "Customer Support", note: "Chat WhatsApp admin Linguo", href: CS_WA, highlight: true },
  { label: "Pendaftaran Kelas Reguler", note: "Mulai 150rb / 2 bulan · 11 bahasa", href: "/jadwal-kelas-reguler" },
  { label: "Pendaftaran Kelas TOEFL/IELTS Prep", note: "300rb / 2 bulan", href: "/jadwal-kelas-reguler?tab=etp" },
  { label: "Pendaftaran Private Class (Online/Offline)", note: `Mulai ${BRAND_FACTS.price.fromLabel} per sesi`, href: "/kelas-trial" },
  { label: "Kelas Bersama Native Teacher", note: "Private dengan penutur asli", href: "/harga" },
  { label: "Linguo for Corporate (B2B)", note: "Pelatihan bahasa untuk tim perusahaan", href: "/corporate" },
  { label: "Paket E-Learning 10+ Bahasa", note: "Berlangganan 1 tahun · cuma 29k", href: "/toko/paket-elearning" },
  { label: "E-book Belajar Bahasa", note: "Cuma 99k", href: "/toko" },
  { label: "Lowongan Kerja Linguo", note: "Karir & rekrutmen pengajar", href: "/karir" },
  { label: "Layanan Pengaduan, Saran & Keluhan", note: "WhatsApp tim kurikulum", href: PENGADUAN_WA },
];
