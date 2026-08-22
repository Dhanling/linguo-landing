import { NextRequest, NextResponse } from "next/server";

// ⚠️ BACA DULU — route ini BUKAN webhook Xendit yang aktif.
// Bukti (30 Jul 2026): pembayaran simulasi LINGUO-SIM-toefl-1785391868375 masuk
// 4x ke `xendit_webhook_logs` (tabel yang HANYA diisi edge function), tapi tak
// ada satu pun efek dari file ini — entitlement tak dibuat dan baris `leads`
// akhirnya ditandai lunas manual oleh admin ("Transfer Manual / Verifikasi Admin").
// Kesimpulan: URL yang terdaftar di dashboard Xendit = edge function
// `xendit-webhook` (repo linguo-app), bukan endpoint ini.
//
// Jadi: fulfillment baru (simulasi, e-book, dll) HARUS ditulis di
// linguo-app/supabase/functions/xendit-webhook/index.ts. Menambahkannya di sini
// saja = uang masuk tanpa fulfillment. Fungsi di bawah dipertahankan sebagai
// cadangan/dokumentasi kalau URL ini nanti didaftarkan sebagai webhook kedua
// (semua handler-nya idempoten, jadi aman kalau dobel jalan).
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ── lms-subscription-v1: aktivasi access-pass saat invoice PAID ──────────────
// Dipanggil hanya saat status === "PAID". Match by invoice id (subscription
// tidak punya row di `leads`). Non-fatal: kalau invoice ini bukan subscription
// (mis. lead biasa), lookup balik kosong → skip diam-diam.
async function activateLmsSubscription(invoiceId: string): Promise<void> {
  try {
    // Ambil row pending buat tau plan-nya (durasi dihitung dari plan).
    const getRes = await fetch(
      `${SUPABASE_URL}/rest/v1/lms_subscriptions?xendit_invoice_id=eq.${invoiceId}&status=eq.pending&select=id,plan&limit=1`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      }
    );
    if (!getRes.ok) {
      console.error("Sub lookup failed:", await getRes.text());
      return;
    }
    const rows = await getRes.json();
    const sub = Array.isArray(rows) ? rows[0] : null;
    if (!sub?.id) return; // bukan invoice subscription — skip

    const now = new Date();
    const addMonths = (m: number) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() + m);
      return d.toISOString();
    };
    let expiresAt: string | null = null;
    if (sub.plan === "1m") expiresAt = addMonths(1);
    else if (sub.plan === "6m") expiresAt = addMonths(6);
    else if (sub.plan === "12m") expiresAt = addMonths(12);
    else if (sub.plan === "lifetime") expiresAt = null; // akses selamanya

    const patchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/lms_subscriptions?id=eq.${sub.id}&status=eq.pending`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          status: "active",
          started_at: now.toISOString(),
          expires_at: expiresAt,
        }),
      }
    );
    if (!patchRes.ok) {
      console.error("Sub activation failed:", await patchRes.text());
    } else {
      console.log(`LMS subscription activated: ${sub.id} (plan=${sub.plan})`);
    }
  } catch (e) {
    console.error("activateLmsSubscription error (non-fatal):", e);
  }
}

// ── simulasi-paywall-v1: grant akses simulasi saat invoice PAID ──────────────
// Invoice simulasi punya external_id `LINGUO-SIM-<toefl|ielts>-<ts>`. Email
// pembeli diambil dari row lead (sudah di-update di handler utama). Idempoten:
// cek dulu apakah entitlement aktif sudah ada (juga dijaga unique index DB).
async function grantSimulationEntitlement(externalId: string): Promise<void> {
  try {
    const m = /^LINGUO-SIM-(toefl|ielts)-/.exec(externalId || "");
    if (!m) return; // bukan invoice simulasi — skip
    const testType = m[1];

    // Ambil email + amount dari lead.
    const leadRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${externalId}&select=email,amount&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!leadRes.ok) { console.error("Sim lead lookup failed:", await leadRes.text()); return; }
    const leadRows = await leadRes.json();
    const email = Array.isArray(leadRows) ? leadRows[0]?.email : null;
    if (!email) { console.error("Sim entitlement: email tidak ditemukan utk", externalId); return; }

    // Idempotensi: skip kalau sudah ada entitlement aktif utk email+test_type.
    const existRes = await fetch(
      `${SUPABASE_URL}/rest/v1/simulation_entitlements?email=ilike.${encodeURIComponent(email)}&test_type=eq.${testType}&status=eq.active&select=id&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (existRes.ok) {
      const exist = await existRes.json();
      if (Array.isArray(exist) && exist[0]?.id) {
        console.log(`Sim entitlement sudah ada: ${email} (${testType}) — skip`);
        return;
      }
    }

    const insRes = await fetch(`${SUPABASE_URL}/rest/v1/simulation_entitlements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        email,
        test_type: testType,
        status: "active",
        source_external_id: externalId,
        amount: Array.isArray(leadRows) ? leadRows[0]?.amount ?? null : null,
      }),
    });
    if (!insRes.ok) console.error("Sim entitlement insert failed:", await insRes.text());
    else console.log(`Sim entitlement granted: ${email} (${testType})`);
  } catch (e) {
    console.error("grantSimulationEntitlement error (non-fatal):", e);
  }
}

// ── funnel-autoconvert-v1: PAID funnel lead → registrations otomatis ─────────
// MASALAH: checkout funnel landing (create-funnel-invoice) cuma bikin baris di
// `leads`. Overview admin (line chart, "Pendaftaran Terbaru", omzet) baca dari
// `registrations`. Jadi pembayaran ETP/Test Prep/Private dari landing yang sudah
// LUNAS di Xendit TAK PERNAH nongol di Overview sampai admin klik "Convert"
// manual. Fungsi ini mereplikasi logika Convert (Leads.tsx handleConvertToRegistration)
// di sisi server: upsert student → insert registration (Lunas) → tandai lead
// CONVERTED + archived + converted_registration_id.
//
// Anti double-count / idempoten: skip kalau lead sudah punya converted_registration_id
// atau sudah diarsip (webhook Xendit bisa dikirim berkali-kali). Digital (E-Learning/
// E-Book) SENGAJA di-skip — punya pipeline sendiri (digital_purchases) biar tak dobel.
function mapFunnelProgramToProduct(program: string | null): string | null {
  const p = (program || "").toLowerCase().trim();
  if (!p) return null;
  if (p === "kelas private" || p === "private") return "Kelas Private";
  if (p === "kelas reguler" || p === "reguler") return "Kelas Reguler";
  if (p === "kelas kids" || p === "kids") return "Kelas Kids";
  if (p === "semi private" || p === "kelas semi private") return "Kelas Semi Private";
  if (
    p === "ielts/toefl prep" ||
    p === "ielts-toefl" ||
    p === "english test preparation (ielts/toefl)"
  )
    return "English Test Preparation (IELTS/TOEFL)";
  // Test Prep (HSK/JLPT/TOPIK/Goethe): tak ada enum khusus → default format grup kecil.
  if (p === "test prep") return "Kelas Semi Private";
  // "digital"/"e-learning"/"e-book"/"simulasi" → skip (pipeline sendiri).
  return null;
}

async function autoConvertPaidLeadToRegistration(externalId: string): Promise<void> {
  try {
    const supaHeaders = {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    // 1. Ambil lead lengkap by external_id.
    const leadRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${externalId}&select=id,name,email,wa_number,language,program,level,amount,paid_amount,paid_at,birthdate,learning_goal,schedule_preference,sessions,class_mode,class_city,converted_registration_id,archived_at&limit=1`,
      { headers: supaHeaders }
    );
    if (!leadRes.ok) {
      console.error("Autoconvert lead lookup failed:", await leadRes.text());
      return;
    }
    const leadRows = await leadRes.json();
    const lead = Array.isArray(leadRows) ? leadRows[0] : null;
    if (!lead) return; // bukan lead funnel (subscription/enroll/simulasi) — skip diam-diam
    // Idempoten: sudah dikonversi atau diarsip → jangan dobel.
    if (lead.converted_registration_id || lead.archived_at) {
      console.log(`Autoconvert skip: lead ${lead.id} sudah dikonversi/diarsip`);
      return;
    }
    if (!lead.name) {
      console.log(`Autoconvert skip: lead ${lead.id} tanpa nama`);
      return;
    }
    const product = mapFunnelProgramToProduct(lead.program);
    if (!product) {
      console.log(`Autoconvert skip: program "${lead.program}" tak dipetakan (digital/simulasi/unknown)`);
      return;
    }

    // 2. Upsert student (match by nama, mirror admin Convert).
    let studentId: string | null = null;
    const stuRes = await fetch(
      `${SUPABASE_URL}/rest/v1/students?name=ilike.${encodeURIComponent(lead.name)}&select=id&limit=1`,
      { headers: supaHeaders }
    );
    if (stuRes.ok) {
      const stuRows = await stuRes.json();
      if (Array.isArray(stuRows) && stuRows[0]?.id) studentId = stuRows[0].id;
    }
    if (studentId) {
      await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}`, {
        method: "PATCH",
        headers: supaHeaders,
        body: JSON.stringify({
          whatsapp: lead.wa_number || null,
          email: lead.email || null,
          birth_date: lead.birthdate || null,
        }),
      });
    } else {
      // source dibiarkan null (CHECK students_source_check cuma terima enum channel).
      const insStu = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
        method: "POST",
        headers: { ...supaHeaders, Prefer: "return=representation" },
        body: JSON.stringify({
          name: lead.name,
          whatsapp: lead.wa_number || null,
          email: lead.email || null,
          birth_date: lead.birthdate || null,
          learning_objective: lead.learning_goal || null,
        }),
      });
      if (!insStu.ok) {
        console.error("Autoconvert student insert failed:", await insStu.text());
        return;
      }
      const stuJson = await insStu.json();
      studentId = Array.isArray(stuJson) ? stuJson[0]?.id : stuJson?.id;
    }
    if (!studentId) {
      console.error("Autoconvert: student_id tak ketemu setelah upsert");
      return;
    }

    // 3. Reguler: resolusi kode batch dari lead.language (mirror admin).
    // [reguler-english-conversation-v1] nama kelas & level diambil dari baris
    // regular_batches, JANGAN salin blob "English - Conversation A1.1 (ENG-A11-AUG26)"
    // mentah-mentah ke registrations (bikin lookup bendera/silabus siswa gagal).
    const isReguler = product === "Kelas Reguler";
    let resolvedBatchId: string | null = null;
    let resolvedLevel: string | null = null;
    let resolvedLanguage: string | null = lead.language || null;
    const batchCode =
      (lead.language || "").match(/([A-Z]{2,4}-[A-Za-z0-9.]+-[A-Z]{3}\d{2}(?:-[A-Z])?)/)?.[1] ||
      null;
    if (batchCode) {
      // "ENG-A11-AUG26" -> "A1.1" (kode batch lama pakai "A1.1", yg baru "A11").
      resolvedLevel = (batchCode.split("-")[1] || "").replace(/^([A-C][12])(\d)$/i, "$1.$2") || null;
      resolvedLanguage =
        (lead.language || "")
          .replace(/\s*\([^)]*\)\s*$/, "")
          .replace(/\s+[A-Ca-c][12](?:\.\d+)?\s*$/, "")
          .trim() || resolvedLanguage;
      const bRes = await fetch(
        `${SUPABASE_URL}/rest/v1/regular_batches?batch_code=ilike.${encodeURIComponent(batchCode)}&select=id,language,level&limit=1`,
        { headers: supaHeaders }
      );
      if (bRes.ok) {
        const bRows = await bRes.json();
        const batch = Array.isArray(bRows) ? bRows[0] : null;
        if (batch?.id) {
          resolvedBatchId = batch.id;
          resolvedLanguage = batch.language || resolvedLanguage;
          resolvedLevel = batch.level || resolvedLevel;
        }
      }
    }

    // 4. Insert registration (Lunas). payment_date WAJIB diisi biar masuk grafik
    //    Pendapatan (di-bucket by payment_date, lihat omzet-payment-date-invariant).
    const paidDate = lead.paid_at
      ? new Date(lead.paid_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    const isDigital = product === "E-Learning" || product === "E-Book";
    const regPayload: Record<string, unknown> = {
      student_id: studentId,
      product,
      language: resolvedLanguage,
      batch_id: resolvedBatchId,
      level: resolvedLevel || (lead.level ? `${lead.level}.1` : null),
      status: "Aktif",
      pipeline_status: "Aktif",
      total_amount: lead.paid_amount || lead.amount || 0,
      payment_status: "Lunas",
      registration_date: paidDate,
      payment_date: paidDate,
      sessions_total: isDigital || isReguler ? null : Number(lead.sessions) || 16,
      preferred_schedule: isDigital ? null : lead.schedule_preference || null,
      // offline-private-class-v1 — mode kelas ikut dari funnel (offline = pengajar
      // datang ke tempat siswa, ketersediaannya tergantung kota siswa).
      class_mode: lead.class_mode || null,
      class_city: lead.class_mode === "offline" ? lead.class_city || null : null,
    };
    if (lead.class_mode === "offline") {
      regPayload.notes = `Kelas OFFLINE — pengajar datang ke tempat siswa${lead.class_city ? ` (${lead.class_city})` : ""}. Cek ketersediaan pengajar di area ini.`;
    }
    if (isReguler) regPayload.product_type = "Reguler";

    const insReg = await fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
      method: "POST",
      headers: { ...supaHeaders, Prefer: "return=representation" },
      body: JSON.stringify(regPayload),
    });
    if (!insReg.ok) {
      console.error("Autoconvert registration insert failed:", await insReg.text());
      return;
    }
    const regJson = await insReg.json();
    const regId = Array.isArray(regJson) ? regJson[0]?.id : regJson?.id;

    // 5. Tandai lead CONVERTED + link ke registration (idempotensi berikutnya).
    //    SENGAJA TAK diarsip: beda dari Convert manual admin — lead tetap tampil
    //    di daftar Leads aktif dengan badge "Converted" biar customer yang sudah
    //    bayar tetap kelihatan di CRM. `converted_registration_id` jadi kunci
    //    idempotensi + penanda "jangan convert ulang".
    await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: "PATCH",
      headers: supaHeaders,
      body: JSON.stringify({
        payment_status: "CONVERTED",
        converted_registration_id: regId || null,
      }),
    });
    console.log(`Autoconvert OK: lead ${lead.id} (${lead.name}) → registration ${regId} [${product}]`);
  } catch (e) {
    console.error("autoConvertPaidLeadToRegistration error (non-fatal):", e);
  }
}

// ── ebook-fulfillment-v1: lead e-book landing LUNAS → digital_purchases ──────
// MASALAH: checkout e-book /produk/ebook cuma menulis baris `leads` + invoice
// Xendit. Autoconvert di atas SENGAJA melewati program digital dengan alasan
// "punya pipeline sendiri (digital_purchases)" — tapi pipeline itu cuma ada di
// toko (/toko → edge function xendit-create-digital-invoice), TIDAK PERNAH
// dibuat untuk jalur /produk/ebook. Akibatnya pembelian yang sudah dibayar di
// Xendit tidak muncul di Overview admin, tidak muncul di Penjualan Digital, dan
// pembelinya tidak dapat akses di Perpustakaan /akun.
//
// BUNDLE: satu invoice bisa berisi banyak bahasa (Bundle Hemat 3, Populer 5,
// All-Access 20). Dibuat SATU baris digital_purchases PER BAHASA supaya akses
// per-produk benar, dan nominalnya DIBAGI RATA (sisa pembagian ditaruh di baris
// pertama) supaya total omzet persis sama dengan yang dibayar — bukan N×harga.

// Nama bahasa di landing pakai bahasa Indonesia; katalog digital_products pakai
// nama Inggris. Kunci = LANGS di src/app/produk/ebook/page.tsx.
const EBOOK_LANG_TO_CATALOG: Record<string, string> = {
  Inggris: "English", Spanyol: "Spanish", Jerman: "German", Jepang: "Japanese",
  Mandarin: "Mandarin", Belanda: "Dutch", Arab: "Arabic", Prancis: "French",
  Korea: "Korean", Tagalog: "Tagalog", Italia: "Italian", Turki: "Turkish",
  Rusia: "Russian", Portugis: "Portuguese", Thailand: "Thai", Vietnam: "Vietnamese",
  Hindi: "Hindi", Swedia: "Swedish", Norwegia: "Norwegian", Finlandia: "Finnish",
};

// Fallback edisi untuk invoice LAMA yang external_id-nya belum membawa SKU
// (dibuat sebelum ebook-fulfillment-v1). Harga per SKU unik antar edisi, jadi
// nominal cukup untuk memastikan edisinya. Sumber: PRODUCT_PRICES di
// src/app/api/create-invoice/route.ts — jaga tetap sinkron.
const EBOOK_EDITION_BY_AMOUNT: Record<number, "id" | "en"> = {
  99000: "id", 239000: "id", 349000: "id", 749000: "id",
  79000: "en", 189000: "en", 279000: "en", 599000: "en",
};

async function fulfillEbookLead(
  externalId: string,
  invoiceId: string,
  paidAmount: number | null,
  paidAt: string | null
): Promise<void> {
  try {
    const supaHeaders = {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    const sku = /^LINGUO-EBOOK-(satuan|hemat|populer|all)-(id|en)-/.exec(externalId || "");

    const leadRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${externalId}&select=id,name,email,wa_number,language,program,amount,paid_amount&limit=1`,
      { headers: supaHeaders }
    );
    if (!leadRes.ok) {
      console.error("Ebook fulfillment lead lookup failed:", await leadRes.text());
      return;
    }
    const leadRows = await leadRes.json();
    const lead = Array.isArray(leadRows) ? leadRows[0] : null;
    if (!lead) return; // bukan lead funnel — skip diam-diam

    // Gerbang: hanya pembelian e-book. Lead lama pakai program "digital" yang
    // dipakai bareng checkout e-learning /produk — e-learning tak pernah mengisi
    // `language`, jadi baris tanpa bahasa DIABAIKAN (bukan e-book).
    const prog = String(lead.program || "").toLowerCase();
    const rawLang = String(lead.language || "").trim();
    if (!sku && !(["e-book", "ebook", "digital"].includes(prog) && rawLang)) return;
    if (!lead.email) {
      console.error(`Ebook fulfillment: lead ${lead.id} tanpa email — akses tak bisa dibuat`);
      return;
    }

    // Idempotensi: webhook Xendit bisa dikirim berkali-kali.
    const existRes = await fetch(
      `${SUPABASE_URL}/rest/v1/digital_purchases?xendit_external_id=eq.${externalId}&select=id&limit=1`,
      { headers: supaHeaders }
    );
    if (existRes.ok) {
      const exist = await existRes.json();
      if (Array.isArray(exist) && exist[0]?.id) {
        console.log(`Ebook fulfillment: ${externalId} sudah dipenuhi — skip`);
        return;
      }
    }

    const total = Number(paidAmount ?? lead.paid_amount ?? lead.amount ?? 0);
    const edition = sku?.[2] ?? EBOOK_EDITION_BY_AMOUNT[Number(lead.amount ?? total)];
    if (!edition) {
      console.error(`Ebook fulfillment: edisi tak bisa dipastikan utk ${externalId} (Rp${total})`);
      return;
    }

    // All-Access dikirim sebagai label "Semua 20 bahasa", bukan daftar bahasa.
    const isAll = sku?.[1] === "all" || /^semua/i.test(rawLang);
    const wanted = (isAll ? Object.keys(EBOOK_LANG_TO_CATALOG) : rawLang.split(","))
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => EBOOK_LANG_TO_CATALOG[n] || n);
    if (wanted.length === 0) {
      console.error(`Ebook fulfillment: daftar bahasa kosong utk ${externalId}`);
      return;
    }

    // Katalog: 1 produk per bahasa per edisi, dibedakan sufiks slug (-id / -en).
    const prodRes = await fetch(
      `${SUPABASE_URL}/rest/v1/digital_products?type=eq.ebook&language=in.(${wanted
        .map((l) => `"${l}"`)
        .join(",")})&select=id,slug,language,digital_product_pricing(id,is_active,duration_days,price)`,
      { headers: supaHeaders }
    );
    if (!prodRes.ok) {
      console.error("Ebook fulfillment product lookup failed:", await prodRes.text());
      return;
    }
    const prods = (await prodRes.json()) as {
      id: string;
      slug: string;
      language: string;
      digital_product_pricing?: { id: string; is_active: boolean; duration_days: number | null; price: number | null }[];
    }[];

    const picked = wanted
      .map((l) => prods.find((p) => p.language === l && String(p.slug || "").endsWith(`-${edition}`)))
      .filter(Boolean) as typeof prods;
    const missing = wanted.filter((l) => !picked.some((p) => p.language === l));
    if (missing.length > 0) {
      // Non-fatal: bahasa yang ada tetap dipenuhi, sisanya dilaporkan ke log
      // supaya admin bisa menambahkan aksesnya manual dari Penjualan Digital.
      console.error(`Ebook fulfillment: produk edisi '${edition}' tak ada utk ${missing.join(", ")}`);
    }
    if (picked.length === 0) return;

    // Tier "akses selamanya" produk ini; kalau tak ada, tier aktif termurah,
    // supaya baris tetap lahir walau katalognya cuma punya paket berjangka.
    const tierSelamanya = (
      tiers?: { id: string; is_active: boolean; duration_days?: number | null; price?: number | null }[]
    ) => {
      const aktif = (tiers || []).filter((t) => t.is_active);
      const abadi = aktif.find((t) => t.duration_days == null);
      if (abadi) return abadi.id;
      const termurah = aktif.slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
      return termurah?.id ?? (tiers || [])[0]?.id ?? null;
    };

    // Bagi rata; sisa pembagian ke baris pertama → jumlahnya persis `total`.
    const per = Math.floor(total / picked.length);
    const nowIso = new Date().toISOString();
    const payload = picked.map((p, i) => ({
      product_id: p.id,
      // [ebook-tier-langganan-v1] Paket e-book dari landing dijual sebagai akses
      // SELAMANYA (aktivasi di bawah sengaja tidak mengisi expires_at). Sejak
      // modul "new edition" punya tier 6/12 bulan, "tier aktif pertama" tidak
      // lagi cukup: urutan baris dari PostgREST tak dijamin, jadi baris promo
      // bisa tercatat sebagai "6 Bulan" padahal aksesnya tanpa batas. Yang
      // dicari karena itu tier tanpa `duration_days` dulu.
      pricing_id: tierSelamanya(p.digital_product_pricing),
      buyer_email: lead.email,
      buyer_name: lead.name || null,
      buyer_phone: lead.wa_number || null,
      amount: i === 0 ? total - per * (picked.length - 1) : per,
      // WAJIB masuk sebagai BELUM BAYAR dulu — lihat catatan aktivasi di bawah.
      payment_status: "Belum Bayar",
      xendit_status: "PENDING",
      xendit_invoice_id: invoiceId,
      // Baris ke-2 dst diberi sufiks: kolom ini dipakai sebagai kunci match 1:1
      // di tempat lain, jadi jangan sampai satu external_id punya banyak baris
      // identik. Cek idempotensi di atas memakai baris pertama (tanpa sufiks).
      xendit_external_id: i === 0 ? externalId : `${externalId}-${i + 1}`,
      xendit_paid_at: paidAt || nowIso,
      access_granted: false,
      source: "xendit",
    }));

    const insRes = await fetch(`${SUPABASE_URL}/rest/v1/digital_purchases`, {
      method: "POST",
      headers: { ...supaHeaders, Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    if (!insRes.ok) {
      console.error("Ebook fulfillment insert failed:", await insRes.text());
      return;
    }
    const created = (await insRes.json()) as { id: string }[];
    const ids = (Array.isArray(created) ? created : []).map((r) => r.id).filter(Boolean);
    if (ids.length === 0) {
      console.error("Ebook fulfillment: insert tak mengembalikan id");
      return;
    }

    // Aktivasi TERPISAH dari insert — bukan gaya-gayaan, ini keharusan.
    // `digital_purchases` punya trigger BEFORE INSERT OR UPDATE
    // (sync_digital_purchase_to_registration) yang, begitu barisnya dianggap
    // lunas, menyalinnya ke `registrations` dengan source_digital_purchase_id =
    // id baris ini. Pada BEFORE INSERT baris itu BELUM ada di tabel, jadi FK
    // registrations_source_digital_purchase_id_fkey gagal dan seluruh insert
    // ditolak. Alur toko (/toko) selamat karena kebetulan menulis "Belum Bayar"
    // dulu lalu meng-update saat webhook masuk — pola itu yang ditiru di sini.
    const actRes = await fetch(
      `${SUPABASE_URL}/rest/v1/digital_purchases?id=in.(${ids.join(",")})`,
      {
        method: "PATCH",
        headers: supaHeaders,
        body: JSON.stringify({
          payment_status: "Lunas",
          xendit_status: "PAID",
          access_granted: true,
          access_granted_at: nowIso,
        }),
      }
    );
    if (!actRes.ok) {
      console.error("Ebook fulfillment activation failed:", await actRes.text());
      return;
    }
    console.log(
      `Ebook fulfillment OK: lead ${lead.id} (${lead.name}) → ${picked.length} akses e-book edisi ${edition}`
    );
  } catch (e) {
    console.error("fulfillEbookLead error (non-fatal):", e);
  }
}

// ── pustaka-keranjang-v1: invoice keranjang LUNAS → semua barisnya diaktifkan ──
// ⚠️ TIDAK AKTIF: yang terdaftar sebagai callback di Xendit adalah edge function
// `xendit-webhook` (repo linguo-app), bukan route ini. Fungsi yang benar-benar
// jalan = `handleCartPurchase` di sana. Dibiarkan di sini sebagai cadangan kalau
// suatu saat callback dipindah, tapi jangan menambal jalur keranjang di sini.
// Checkout keranjang (/api/create-cart-invoice) sudah menulis N baris
// `digital_purchases` "Belum Bayar" untuk SATU invoice, jadi di sini tak ada
// lagi yang perlu ditebak: cukup cari barisnya lewat xendit_invoice_id dan
// ubah jadi Lunas. Pola insert-dulu-update-kemudian itu keharusan, bukan gaya —
// lihat catatan trigger sync_digital_purchase_to_registration di fulfillEbookLead.
//
// Masa aktif dihitung PER BARIS dari duration_days tier masing-masing: satu
// keranjang bisa berisi e-book "selamanya" (duration_days NULL → expires_at
// dibiarkan NULL) bersama e-learning 6 bulan.
async function fulfillCartPurchase(
  externalId: string,
  invoiceId: string,
  paidAt: string | null
): Promise<void> {
  try {
    const supaHeaders = {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    // Dicari lewat xendit_invoice_id, BUKAN external_id: baris ke-2 dst sengaja
    // memakai external_id bersufiks (-2, -3, …) supaya kolom itu tetap unik 1:1,
    // jadi pencarian by external_id cuma akan menemukan baris pertama.
    const rowsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/digital_purchases?xendit_invoice_id=eq.${invoiceId}&select=id,payment_status,digital_product_pricing(duration_days)`,
      { headers: supaHeaders }
    );
    if (!rowsRes.ok) {
      console.error("Cart fulfillment lookup failed:", await rowsRes.text());
      return;
    }
    const rows = (await rowsRes.json()) as {
      id: string;
      payment_status: string | null;
      digital_product_pricing: { duration_days: number | null } | { duration_days: number | null }[] | null;
    }[];
    if (!Array.isArray(rows) || rows.length === 0) {
      console.error(`Cart fulfillment: tak ada baris untuk invoice ${invoiceId} (${externalId})`);
      return;
    }

    // Idempotensi: webhook Xendit bisa datang berkali-kali untuk invoice sama.
    const belum = rows.filter((r) => r.payment_status !== "Lunas");
    if (belum.length === 0) {
      console.log(`Cart fulfillment: ${externalId} sudah dipenuhi — skip`);
      return;
    }

    const nowIso = new Date().toISOString();
    const mulai = paidAt || nowIso;
    let gagal = 0;
    for (const r of belum) {
      const tier = Array.isArray(r.digital_product_pricing)
        ? r.digital_product_pricing[0]
        : r.digital_product_pricing;
      const hari = tier?.duration_days ?? null;
      const expiresAt = hari
        ? new Date(new Date(mulai).getTime() + hari * 86_400_000).toISOString()
        : null;

      const actRes = await fetch(`${SUPABASE_URL}/rest/v1/digital_purchases?id=eq.${r.id}`, {
        method: "PATCH",
        headers: supaHeaders,
        body: JSON.stringify({
          payment_status: "Lunas",
          xendit_status: "PAID",
          xendit_paid_at: mulai,
          access_granted: true,
          access_granted_at: nowIso,
          expires_at: expiresAt,
        }),
      });
      // Satu baris gagal tak boleh membatalkan sisanya: pembelinya sudah bayar,
      // jadi akses yang bisa terbit harus tetap terbit dan sisanya dilaporkan.
      if (!actRes.ok) {
        gagal++;
        console.error(`Cart fulfillment: baris ${r.id} gagal diaktifkan:`, await actRes.text());
      }
    }

    console.log(
      `Cart fulfillment OK: ${externalId} → ${belum.length - gagal}/${belum.length} akses aktif`
    );
  } catch (e) {
    console.error("fulfillCartPurchase error (non-fatal):", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify webhook token
    const callbackToken = req.headers.get("x-callback-token");
    if (callbackToken !== XENDIT_WEBHOOK_TOKEN) {
      console.error("Invalid webhook token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, external_id, status, paid_amount, paid_at, payment_method, payment_channel } = body;

    console.log(`Webhook received: ${external_id} → ${status}`);

    // 2. Update lead in Supabase (subscription tidak punya lead → 0 rows, aman)
    const updateData: Record<string, unknown> = {
      payment_status: status, // PAID, EXPIRED, etc.
      xendit_invoice_id: id,
    };

    if (status === "PAID") {
      updateData.paid_at = paid_at;
      updateData.paid_amount = paid_amount;
      updateData.payment_method = payment_method;
      updateData.payment_channel = payment_channel;
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?xendit_external_id=eq.${external_id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Supabase update error:", err);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    // 2b. [SUBSCRIPTION] Aktivasi access-pass LMS kalau invoice ini subscription.
    if (status === "PAID") {
      await activateLmsSubscription(id);
      // simulasi-paywall-v1: grant entitlement simulasi (external_id LINGUO-SIM-*).
      await grantSimulationEntitlement(external_id);
      // funnel-autoconvert-v1: lead funnel landing yang LUNAS → registrations otomatis
      // biar langsung nongol di Overview (line chart, Pendaftaran Terbaru, omzet).
      // Skip diam-diam kalau bukan lead funnel / digital / sudah dikonversi.
      await autoConvertPaidLeadToRegistration(external_id);
      // ebook-fulfillment-v1: pembelian e-book landing (bundle sekalipun) → baris
      // digital_purchases, biar masuk Overview/Penjualan Digital + akses /akun.
      await fulfillEbookLead(external_id, id, paid_amount ?? null, paid_at ?? null);
      // pustaka-keranjang-v1: checkout banyak produk sekaligus dari Perpustakaan.
      if (/^LINGUO-CART-/.test(external_id || "")) {
        await fulfillCartPurchase(external_id, id, paid_at ?? null);
      }
    }

    // 2c. [REGISTRATION] enrollment-server-flow-v1 — invoice dari /api/enroll
    //     punya external_id `LINGUO-REG-<registration_id>-<ts>`. Rekonsiliasi
    //     balik ke baris registrations. Non-fatal (invoice lain → no match).
    const regMatch = /^LINGUO-REG-([0-9a-fA-F-]{36})-/.exec(external_id || "");
    if (regMatch) {
      const regId = regMatch[1];
      // registrations.status punya CHECK constraint — JANGAN set status di sini.
      // Cukup update payment_status: 'Lunas' saat PAID, else status mentah webhook.
      const regUpdate: Record<string, unknown> =
        status === "PAID"
          ? { payment_status: "Lunas" }
          : { payment_status: status }; // EXPIRED / dll
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/registrations?id=eq.${regId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify(regUpdate),
        });
      } catch (e) {
        console.error("Webhook registration update error (non-fatal):", e);
      }
    }

    // 3. TODO: Send confirmation email (Resend) — next session

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
