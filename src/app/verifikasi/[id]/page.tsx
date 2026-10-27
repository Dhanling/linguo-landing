// [sertifikat-qr-verifikasi-v1] Halaman verifikasi publik sertifikat Linguo.
// QR di pojok sertifikat (/akun → Certificates) mengarah ke sini dengan id
// registrasi (UUID, tak bisa ditebak). Dibaca server-side pakai service role,
// yang ditampilkan hanya data sertifikat: nama siswa, program, pengajar, sesi.
// Sertifikat baru dianggap TERBIT kalau sessions_used >= sessions_total (paket per sesi: 16 sesi per level) —
// aturan yang sama dengan memo `certs` di src/app/akun/page.tsx.
import { padananUjian } from "@/lib/levelEquivalence"; // [padanan-ujian-v1]
import Link from "next/link";
import { BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { sapaan } from "@/lib/teacherName"; // [panggilan-pengajar-v1]

export const dynamic = "force-dynamic";
export const metadata = { title: "Verifikasi Sertifikat — Linguo.id", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Data = {
  nama: string;
  bahasa: string;
  level: string;
  pengajar: string;
  sesi: number;
  terbit: boolean;
  noSertifikat: string;
  /** [padanan-ujian-v1] "TOPIK II Level 3" dsb — null kalau bahasa tak punya padanan. */
  padanan: string | null;
};

async function ambil(id: string): Promise<Data | null> {
  if (!UUID.test(id)) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: r } = await supabase
    .from("registrations")
    .select("id, student_id, product_type, language, level, sessions_used, sessions_total, students(name), teachers(name)")
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;
  const reg = r as any;
  let total = Number(reg.sessions_total) || 0;
  let used = Number(reg.sessions_used) || 0;
  // [sertifikat-16-sesi-v1] Private paket < 16 sesi (bayar per sesi / paket 4–12 sesi) dijumlah per
  // bahasa + level dan baru terbit di sesi ke-16 — sama dengan memo `certs` di /akun.
  // [sertifikat-reguler-16-v1] Reguler (batch 8 sesi, `sessions_total` sering NULL) ikut sejak 27 Okt 2026.
  const ikutGabung = (x: any) => {
    const t = Number(x.sessions_total) || 0;
    return x.product_type === "Reguler" ? t < 16 : x.product_type === "Private" && t > 0 && t < 16;
  };
  if (ikutGabung(reg) && reg.student_id) {
    const { data: lain } = await supabase
      .from("registrations")
      .select("sessions_used, sessions_total, product_type, level, pipeline_status, status")
      .eq("student_id", reg.student_id)
      .in("product_type", ["Private", "Reguler"])
      .ilike("language", String(reg.language || ""))
      .in("payment_status", ["Lunas", "Cicilan"])
      .is("archived_at", null);
    used = ((lain as any[]) || [])
      .filter((x) => ikutGabung(x) && String(x.level || "") === String(reg.level || "") && x.pipeline_status !== "Batal" && x.status !== "Transferred")
      .reduce((n, x) => n + (Number(x.sessions_total) > 0 ? Math.min(Number(x.sessions_used) || 0, Number(x.sessions_total)) : Number(x.sessions_used) || 0), 0);
    total = 16;
  }
  const base = String(reg.level || "A1").split(".")[0].toUpperCase();
  return {
    nama: reg.students?.name || "—",
    bahasa: reg.language || "—",
    level: reg.level || "—",
    pengajar: sapaan(reg.teachers?.name) || "Pengajar Linguo", // [panggilan-pengajar-v1] nama lengkap tak pernah tampil ke publik
    sesi: total,
    padanan: padananUjian(reg.language, reg.level)?.label || null,
    terbit: total > 0 && used >= total,
    // sama persis dengan idNo di sertifikat
    noSertifikat: `LING-${String(reg.language || "XX").slice(0, 2).toUpperCase()}-${base}-${String(reg.id).replace(/\D/g, "").slice(0, 6).padStart(6, "0")}`,
  };
}

export default async function VerifikasiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await ambil(id);
  const sah = !!d?.terbit;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7F7] px-4 py-10" style={{ colorScheme: "light" }}>
      <div className="w-full max-w-[420px] overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_-30px_rgba(18,23,43,.35)]">
        <div className={`flex flex-col items-center px-7 py-8 text-center text-white ${sah ? "bg-[#1A9E9E]" : "bg-[#9CA3AF]"}`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            {sah ? <ShieldCheck className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
          </span>
          <p className="mt-3 text-[17px] font-extrabold">{sah ? "Sertifikat Terverifikasi" : d ? "Sertifikat Belum Terbit" : "Sertifikat Tidak Ditemukan"}</p>
          {sah && (
            <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-white/90">
              <BadgeCheck className="h-4 w-4" />
              Asli &amp; diterbitkan oleh Linguo
            </p>
          )}
        </div>
        <div className="px-7 py-6 text-[#12172B]">
          {d ? (
            <dl className="space-y-3 text-[13px]">
              {[
                ["Diberikan kepada", d.nama],
                ["Program", `${d.bahasa} — CEFR ${d.level}`],
                ...(d.padanan ? [["Kurang lebih setara (perkiraan)", `≈ ${d.padanan}`]] : []),
                ["Pengajar", d.pengajar],
                ["Jumlah sesi", `${d.sesi} sesi`],
                ["No. Sertifikat", d.noSertifikat],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4">
                  <dt className="font-medium text-[#6B7280]">{k}</dt>
                  <dd className="text-right font-extrabold">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[13px] leading-relaxed text-[#6B7280]">
              Kode QR ini tidak cocok dengan sertifikat mana pun di sistem Linguo. Hubungi tim Linguo untuk konfirmasi.
            </p>
          )}
          {d && !sah && (
            <p className="mt-5 rounded-2xl bg-[#F3F4F6] p-3 text-[11px] leading-relaxed text-[#6B7280]">
              Program ini masih berjalan — sertifikat baru sah setelah seluruh sesi selesai.
            </p>
          )}
          <Link href="/" className="mt-6 block text-center text-[12px] font-bold text-[#1A9E9E] hover:underline">linguo.id</Link>
        </div>
      </div>
    </div>
  );
}
