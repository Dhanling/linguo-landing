import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Karir di Linguo.id — Bergabunglah dengan Tim Kami",
  description:
    "Temukan kesempatan karir di Linguo.id, online language school terdepan di Indonesia dengan 60+ bahasa.",
};

export const revalidate = 60;

type JobOpening = {
  id: string;
  title: string;
  slug: string;
  department: string | null;
  employment_type: string | null;
  location: string | null;
  slots: number | null;
  is_published: boolean;
  archived_at: string | null;
  description: string | null;
  created_at: string;
};

async function getOpenings(): Promise<JobOpening[]> {
  const { data, error } = await supabase
    .from("job_openings")
    .select(
      "id, title, slug, department, employment_type, location, slots, is_published, archived_at, description, created_at"
    )
    .eq("is_published", true)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch openings:", error);
    return [];
  }
  return data || [];
}

export default async function KarirPage() {
  const openings = await getOpenings();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-50 via-white to-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium mb-4">
            <Briefcase className="h-3.5 w-3.5" />
            Karir di Linguo.id
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Bergabunglah dengan Tim
            <br />
            <span className="text-[#1A9E9E]">Bahasa Terbesar</span> di Indonesia
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
            Kami sedang mencari talenta yang passionate tentang pendidikan,
            bahasa, dan teknologi untuk tumbuh bareng Linguo.
          </p>
        </div>
      </div>

      {/* Listing */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Lowongan Aktif ({openings.length})
        </h2>

        {openings.length === 0 ? (
          <div className="border border-dashed rounded-xl p-12 text-center text-gray-500">
            <Briefcase className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="font-medium">Belum ada lowongan saat ini.</p>
            <p className="text-sm mt-1">
              Cek lagi nanti, atau kirim CV ke{" "}
              <a
                href="mailto:hi@linguo.id"
                className="text-[#1A9E9E] underline"
              >
                hi@linguo.id
              </a>
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {openings.map((job) => {
              const cleanSlug = job.slug.replace(/^\//, "");
              return (
                <Link
                  key={job.id}
                  href={`/karir/${cleanSlug}`}
                  className="group border rounded-xl p-5 hover:border-[#1A9E9E] hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#1A9E9E] transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                        {job.department && (
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                            {job.department}
                          </span>
                        )}
                        {job.employment_type && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {job.employment_type}
                          </span>
                        )}
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {job.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-[#1A9E9E] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
