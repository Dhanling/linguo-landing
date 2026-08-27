// [aeo-schema-v1] Satu baris pemasang BreadcrumbList.
//
// Sengaja komponen, bukan <script> yang disalin di tiap halaman: BreadcrumbList
// sebelumnya ditulis ulang tiga kali di repo ini (/kursus, /blog/[slug],
// /daftar) dengan bentuk yang sudah mulai berbeda satu sama lain.
//
// Ini komponen server tanpa "use client" — tag-nya ikut ter-render ke HTML
// mentah yang dibaca crawler, dan tidak menambah satu byte pun ke bundle
// browser. Aman dipakai di dalam layout maupun page, termasuk yang isinya
// client component.
import { breadcrumbSchema, jsonLd, type Crumb } from "@/lib/schema";

/** `trail` TANPA butir "Beranda" — itu ditambahkan otomatis di posisi 1. */
export default function BreadcrumbLd({ trail }: { trail: Crumb[] }) {
  return <script type="application/ld+json" {...jsonLd(breadcrumbSchema(trail))} />;
}
