import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { ArrowLeft, Briefcase, MapPin, Clock, Users } from "lucide-react";
import ApplicationForm from "./ApplicationForm";

type Props = { params: Promise<{ slug: string }> };

async function getJob(slug: string) {
  // Tolerant: cocokin dengan atau tanpa leading "/"
  const { data, error } = await supabase
    .from("job_openings")
    .select("*")
    .or(`slug.eq.${slug},slug.eq./${slug}`)
    .eq("is_published", true)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) {
    return { title: "Lowongan Tidak Ditemukan — Linguo.id" };
  }

  return {
    title: `${job.title} — Karir Linguo.id`,
    description:
      job.description?.slice(0, 160) ||
      `Lowongan ${job.title} di Linguo.id. Lamar sekarang.`,
  };
}

export const revalidate = 60;

export default async function KarirDetailPage({ params }: Props) {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8 md:py-12">
        <Link
          href="/karir"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#1A9E9E] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke semua lowongan
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border p-6 md:p-8 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
            {job.department && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-gray-400" />
                {job.department}
              </span>
            )}
            {job.employment_type && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                {job.employment_type}
              </span>
            )}
            {job.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                {job.location}
              </span>
            )}
            {job.slots && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                {job.slots} slot
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div className="bg-white rounded-2xl border p-6 md:p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Deskripsi Pekerjaan
            </h2>
            <div className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </div>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div className="bg-white rounded-2xl border p-6 md:p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Kualifikasi
            </h2>
            <div className="text-sm md:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.requirements}
            </div>
          </div>
        )}

        {/* Apply CTA — conditional */}
        {(job.slug || "").replace(/^\//, "").startsWith("pengajar-") ? (
          <div className="bg-white rounded-2xl border p-6 md:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Lamar Jadi Pengajar
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Proses lamar pengajar menggunakan wizard khusus — kami akan tanya
              bahasa yang Anda ajar, level CEFR, sertifikasi (kalau ada), dan
              minta video demo singkat. Lebih dari sekedar upload CV.
            </p>
            <Link
              href="/jadi-pengajar"
              className="inline-flex items-center justify-center gap-2 bg-[#1A9E9E] hover:bg-[#178585] text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Lamar Jadi Pengajar →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border p-6 md:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Lamar Sekarang
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Isi form di bawah dan upload CV (PDF/DOC, maks 5MB).
            </p>
            <ApplicationForm openingId={job.id} openingTitle={job.title} />
          </div>
        )}
      </div>
    </div>
  );
}
