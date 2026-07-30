import { NextRequest, NextResponse } from "next/server";
import { previewStudentId, serviceRest } from "@/lib/previewSession";

// ── preview-session-v1 · Simulasi Tes ─────────────────────────────────────
// Sisi server tab "Simulasi Tes" untuk mode pratinjau POV siswa.
//
// Semua policy test_simulations / test_simulation_* / simulation_entitlements
// hanya berlaku untuk role `authenticated`, sedangkan pratinjau TIDAK punya sesi
// login sama sekali → klien anon membaca nol baris dan katalognya jatuh ke layar
// "Kamu perlu masuk dulu". Datanya diambil service role di sini, dikunci ke SATU
// siswa oleh cookie pratinjau.
//
// Read-only: yang dikembalikan cuma katalog + jenis tes yang sudah dimiliki
// siswa. Tidak ada jalur mengerjakan/membeli dari mode pratinjau.

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

export async function GET(req: NextRequest) {
  const student = req.nextUrl.searchParams.get("student");
  if (!student || !/^[0-9a-f-]{36}$/i.test(student)) {
    return NextResponse.json({ error: "invalid student" }, { status: 400 });
  }
  const allowed = await previewStudentId(req);
  if (!allowed || allowed !== student) {
    return NextResponse.json({ error: "preview session required" }, { status: 403 });
  }

  // Katalog terbit + hitungan bagian/soal (bentuknya menyamai
  // fetchPublishedSimulations di src/lib/simulations.ts).
  const [sims, secs, qs, covers] = await Promise.all([
    serviceRest("test_simulations?is_published=eq.true&select=*&order=created_at.desc") as Promise<Row[] | null>,
    serviceRest("test_simulation_sections?select=id,simulation_id") as Promise<Row[] | null>,
    serviceRest("test_simulation_questions?select=id,section_id") as Promise<Row[] | null>,
    serviceRest("rpc/get_simulation_covers", { method: "POST", body: "{}" }) as Promise<Row[] | null>,
  ]);

  const secToSim: Record<string, string> = {};
  const secCount: Record<string, number> = {};
  (secs || []).forEach((s) => {
    secToSim[s.id] = s.simulation_id;
    secCount[s.simulation_id] = (secCount[s.simulation_id] || 0) + 1;
  });
  const qCount: Record<string, number> = {};
  (qs || []).forEach((q) => {
    const sim = secToSim[q.section_id];
    if (sim) qCount[sim] = (qCount[sim] || 0) + 1;
  });

  const simulations: Row[] = (sims || []).map((s) => ({
    ...s,
    section_count: secCount[s.id] ?? 0,
    question_count: qCount[s.id] ?? 0,
  }));

  const coverMap: Record<string, string> = {};
  (covers || []).forEach((c) => {
    if (c.cover_url) coverMap[c.test_type] = c.cover_url;
  });

  // Entitlement siswa. Identitas siswa di LMS berpegang pada EMAIL (tabel
  // students tak punya user_id), jadi cocokkan lewat email dan — bila emailnya
  // sudah punya akun — lewat user_id juga.
  const rows = (await serviceRest(`students?id=eq.${student}&select=email&limit=1`)) as Row[] | null;
  const email = (rows?.[0]?.email as string | null)?.trim() || null;
  const owned = new Set<string>();
  if (email) {
    const enc = encodeURIComponent(email);
    const [byEmail, profiles] = await Promise.all([
      serviceRest(
        `simulation_entitlements?status=eq.active&email=ilike.${enc}&select=test_type`,
      ) as Promise<Row[] | null>,
      serviceRest(`profiles?email=ilike.${enc}&select=id&limit=1`) as Promise<Row[] | null>,
    ]);
    (byEmail || []).forEach((r) => owned.add(r.test_type));
    const uid = profiles?.[0]?.id as string | undefined;
    if (uid) {
      const byUser = (await serviceRest(
        `simulation_entitlements?status=eq.active&user_id=eq.${uid}&select=test_type`,
      )) as Row[] | null;
      (byUser || []).forEach((r) => owned.add(r.test_type));
    }
  }

  // Pratinjau harus memperlihatkan APA YANG SISWA LIHAT, bukan seluruh katalog:
  // service role melewati RLS, jadi saringan policy ("Entitled read simulations"
  // + "Guest read simulations") ditiru manual di sini. Tanpa ini staf melihat
  // simulasi yang di layar siswanya sendiri masih berupa kartu terkunci.
  const visible = simulations.filter(
    (s) => s.access_mode === "guest" || owned.has(s.test_type),
  );

  return NextResponse.json({
    simulations: visible,
    owned: [...owned],
    covers: coverMap,
  });
}
