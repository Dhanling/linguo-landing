// [ai-funnel-v1] /konsultasi — Konsultan Linguo: wawancara singkat → Rencana Belajar.
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import BreadcrumbLd from "@/components/BreadcrumbLd";
import { BRAND_FACTS } from "@/lib/brand-facts";
import KonsultasiClient from "./KonsultasiClient";

export const metadata = pageMetadata({
  path: "/konsultasi",
  title: "Konsultasi Rencana Belajar Bahasa Gratis — Linguo.id",
  description:
    "Ceritakan tujuanmu (kerja di Jepang, S2 di Jerman, ujian, hobi). Konsultan Linguo menyusun rencana belajar: target level CEFR, estimasi durasi, program, dan biaya resmi.",
  keywords: ["konsultasi belajar bahasa", "rencana belajar bahasa", "berapa lama belajar bahasa", "kursus bahasa online"],
});

export default function KonsultasiPage() {
  return (
    <>
      <BreadcrumbLd trail={[{ name: "Konsultasi Rencana Belajar", path: "/konsultasi" }]} />
      <main className="min-h-screen bg-[#F4FAFA] text-slate-900">
        <section className="bg-[#1A9E9E] text-white pt-24 pb-10 lg:pt-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <nav aria-label="Breadcrumb" className="text-sm text-white/70 mb-4">
              <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
              <span className="mx-2">/</span>
              <span className="text-white">Konsultasi</span>
            </nav>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
              Konsultasi Rencana Belajar Bahasa
            </h1>
            <p className="text-white/90 leading-relaxed">
              Jawab beberapa pertanyaan singkat, lalu Konsultan Linguo menyusun rencana belajarmu: target level
              CEFR {BRAND_FACTS.cefrLevels}, estimasi jumlah sesi dan durasi, program yang cocok, serta biaya
              sesuai pricelist resmi {BRAND_FACTS.name}. Gratis, tanpa perlu daftar.
            </p>
          </div>
        </section>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6 pb-16">
          <KonsultasiClient waUrl={BRAND_FACTS.contact.whatsappUrl} />
        </section>
      </main>
    </>
  );
}
