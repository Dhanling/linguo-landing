// [availability-masih-sama-v1] Halaman sekali ketuk dari WA pengingat Availability pengajar.
// Menampilkan jam yang tercatat; "Ya, masih sama" → POST /api/availability/masih-sama.
// Kalau ada yang berubah, pengajar diarahkan ke tab Availability di dashboard pengajar.
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { AVAIL_SEGAR_HARI, bacaTiketAvail, ringkasAvailability } from "@/lib/availabilityLink";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Konfirmasi Jam Tersedia — Linguo",
  robots: { index: false, follow: false },
};

const TEAL = "#1A9E9E";
const LINK_DASHBOARD = "https://teach.linguo.id/?buka=availability";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const satu = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

function tglIndo(ms: number) {
  return new Date(ms).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  const t = satu(sp.t);
  const exp = satu(sp.exp);
  const sig = satu(sp.sig);
  const hasil = satu(sp.hasil);
  const teacherId = bacaTiketAvail(t, exp, sig);

  if (!teacherId || hasil === "tak-sah") {
    return (
      <Kartu judul="Link sudah tidak berlaku">
        <p>Link ini sudah kedaluwarsa atau tidak lengkap. Kakak tetap bisa memperbarui jam tersedia langsung di dashboard pengajar.</p>
        <TombolDashboard utama />
      </Kartu>
    );
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const [{ data: guru }, { data: slot }] = await Promise.all([
    admin.from("teachers").select("name, nickname").eq("id", teacherId).maybeSingle(),
    admin.from("teacher_availability").select("day_of_week, time_slot, created_at").eq("teacher_id", teacherId).range(0, 999),
  ]);
  const nama = (guru?.nickname || guru?.name || "").trim();
  const sapaan = nama ? `Kak ${nama}` : "Kak";
  const rows = slot ?? [];
  const ringkas = ringkasAvailability(rows);
  const terakhir = rows.reduce((m, r) => Math.max(m, Date.parse(r.created_at) || 0), 0);
  const berlakuSampai = terakhir ? terakhir + AVAIL_SEGAR_HARI * 86_400_000 : 0;

  if (rows.length === 0 || hasil === "kosong") {
    return (
      <Kartu judul={`Halo ${sapaan} 👋`}>
        <p>Jam tersedia Kakak belum tercatat. Isi dulu di dashboard pengajar ya, supaya siswa yang jadwalnya cocok bisa langsung dicocokkan dengan Kakak.</p>
        <TombolDashboard utama />
      </Kartu>
    );
  }

  if (hasil === "ok") {
    return (
      <Kartu judul="Terima kasih, Kak! 🙏">
        <p>Jam tersedia Kakak sudah diperbarui dan berlaku sampai <b>{tglIndo(berlakuSampai)}</b>. Nanti kami ingatkan lagi sebelum habis.</p>
        <DaftarJam ringkas={ringkas} />
        <TombolDashboard label="Ada yang berubah? Ubah di dashboard" />
      </Kartu>
    );
  }

  const basi = berlakuSampai < Date.now();
  return (
    <Kartu judul={`Halo ${sapaan} 👋`}>
      <p>Ini jam tersedia Kakak yang tercatat di Linguo. Jam ini dipakai untuk mencocokkan siswa baru dengan pengajar.</p>
      <DaftarJam ringkas={ringkas} />
      <p className="text-sm text-slate-500">
        {basi ? "Sudah lewat masa berlaku sejak " : "Berlaku sampai "}
        {tglIndo(berlakuSampai)}
        {basi ? ", jadi untuk sementara belum dihitung saat pencocokan." : "."}
      </p>
      {hasil === "gagal" && <p className="text-sm text-red-600">Gagal menyimpan, coba ketuk sekali lagi ya.</p>}
      <form method="post" action="/api/availability/masih-sama" className="pt-1">
        <input type="hidden" name="t" value={t ?? ""} />
        <input type="hidden" name="exp" value={exp ?? ""} />
        <input type="hidden" name="sig" value={sig ?? ""} />
        <button type="submit" className="w-full rounded-full px-6 py-3 font-semibold text-white" style={{ backgroundColor: TEAL }}>
          Ya, masih sama
        </button>
      </form>
      <TombolDashboard label="Ada yang berubah, ubah di dashboard" />
    </Kartu>
  );
}

function Kartu({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-teal-50/60 to-white px-5 py-16">
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-100 bg-white p-7 text-slate-700 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{judul}</h1>
        {children}
      </div>
    </main>
  );
}

function DaftarJam({ ringkas }: { ringkas: string[] }) {
  return (
    <ul className="space-y-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
      {ringkas.map((r) => (
        <li key={r}>{r} WIB</li>
      ))}
    </ul>
  );
}

function TombolDashboard({ utama, label = "Buka dashboard pengajar" }: { utama?: boolean; label?: string }) {
  return (
    <a
      href={LINK_DASHBOARD}
      className={
        utama
          ? "block w-full rounded-full px-6 py-3 text-center font-semibold text-white"
          : "block w-full text-center text-sm font-medium"
      }
      style={utama ? { backgroundColor: TEAL } : { color: TEAL }}
    >
      {label}
    </a>
  );
}
