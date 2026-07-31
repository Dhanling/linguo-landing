#!/usr/bin/env node
// [sr-kuis-spaced-repetition-v1] Isi ulang stok bank soal kuis harian.
//
// Kuis harian mengambil soal dari `sr_question_bank`; kalau stok satu konsep
// habis, siswa dapat soal yang itu-itu lagi. Script ini menjaga stok minimum:
// tiap konsep aktif yang soalnya < MIN dipanggilkan generator sampai mencapai
// TARGET.
//
// IDEMPOTEN — aman dijalankan berulang kali, termasuk lewat cron. Konsep yang
// stoknya sudah cukup dilewati tanpa memanggil AI sama sekali.
//
// Pakai:
//   node scripts/refill-bank.mjs                 # semua konsep aktif
//   node scripts/refill-bank.mjs --lang fi       # satu bahasa saja
//   node scripts/refill-bank.mjs --lang fi --dry # cuma laporan stok, tanpa generate
//
// Env (dibaca dari .env.local kalau ada):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, QUIZ_FN_SECRET

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const MIN_STOCK = 15; // di bawah ini dianggap menipis
const TARGET_STOCK = 20; // isi sampai segini
const BATCH = 10; // maksimal soal per panggilan generator

// .env.local dibaca manual — script ini jalan di luar Next.js.
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FN_SECRET = process.env.QUIZ_FN_SECRET;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset.");
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const langIdx = args.indexOf("--lang");
const onlyLang = langIdx >= 0 ? args[langIdx + 1] : null;

if (!dryRun && !FN_SECRET) {
  console.error("QUIZ_FN_SECRET belum diset — generator tidak bisa dipanggil.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GEN_URL = `${SUPABASE_URL}/functions/v1/quiz-generate-bank`;

async function generate(conceptId, count) {
  const res = await fetch(GEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-quiz-secret": FN_SECRET },
    body: JSON.stringify({ concept_id: conceptId, count }),
  });
  const text = await res.text();
  // Generator menjawab sebagai aliran (baris kosong = denyut nadi anti idle
  // timeout 150 detik), hasilnya ada di BARIS TERAKHIR yang tidak kosong.
  const lastLine = text.split("\n").map((l) => l.trim()).filter(Boolean).pop() ?? "";
  let body;
  try {
    body = JSON.parse(lastLine);
  } catch {
    throw new Error(`respons bukan JSON (${res.status}): ${text.slice(-200)}`);
  }
  if (!res.ok || body.error) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

async function main() {
  let q = admin
    .from("sr_concepts")
    .select("id, language_code, cefr_level, name")
    .eq("is_active", true)
    .order("language_code")
    .order("cefr_level")
    .order("sort_order");
  if (onlyLang) q = q.eq("language_code", onlyLang);

  const { data: concepts, error } = await q;
  if (error) throw new Error(`Gagal ambil konsep: ${error.message}`);
  if (!concepts?.length) {
    console.log("Tidak ada konsep aktif" + (onlyLang ? ` untuk bahasa ${onlyLang}` : "") + ".");
    return;
  }

  // Stok per konsep ditarik sekali, bukan satu query per konsep.
  const { data: stockRows, error: stockErr } = await admin
    .from("sr_question_bank")
    .select("concept_id")
    .eq("is_active", true)
    .in("concept_id", concepts.map((c) => c.id));
  if (stockErr) throw new Error(`Gagal hitung stok: ${stockErr.message}`);

  const stock = new Map();
  for (const r of stockRows ?? []) stock.set(r.concept_id, (stock.get(r.concept_id) ?? 0) + 1);

  const thin = concepts.filter((c) => (stock.get(c.id) ?? 0) < MIN_STOCK);
  console.log(
    `${concepts.length} konsep aktif, ${thin.length} menipis (< ${MIN_STOCK} soal).` +
      (dryRun ? " [dry run]" : "")
  );

  if (dryRun) {
    for (const c of concepts) {
      console.log(`  ${String(stock.get(c.id) ?? 0).padStart(3)}  ${c.language_code} ${c.cefr_level}  ${c.name}`);
    }
    return;
  }

  let filled = 0;
  let failed = 0;
  for (const c of thin) {
    let have = stock.get(c.id) ?? 0;
    const label = `${c.language_code} ${c.cefr_level} — ${c.name}`;
    // Berhenti kalau satu putaran tidak menambah apa pun: tanpa penjaga ini,
    // konsep yang soalnya selalu ditolak validasi bikin loop tak berujung.
    while (have < TARGET_STOCK) {
      const want = Math.min(BATCH, TARGET_STOCK - have);
      try {
        const res = await generate(c.id, want);
        const added = res.inserted ?? 0;
        console.log(`  +${added}/${want}  ${label}  (stok ${have} → ${have + added})`);
        if (added === 0) {
          console.warn(`  ! ${label}: generator tidak menghasilkan soal baru, lanjut ke konsep berikutnya.`);
          failed++;
          break;
        }
        have += added;
        filled += added;
      } catch (err) {
        console.error(`  ! ${label}: ${err.message}`);
        failed++;
        break;
      }
    }
  }

  console.log(`Selesai: ${filled} soal baru, ${failed} konsep bermasalah.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
