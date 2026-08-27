// scripts/cek-jsonld.mjs
// [aeo-schema-v1]
//
// Pemeriksa structured data. Dijalankan SESUDAH `npm run build`: berkas ini
// membaca HTML hasil prerender di .next/server/app, bukan berkas sumber — jadi
// yang diperiksa persis apa yang diterima crawler, termasuk kalau ada schema
// yang gagal muncul di HTML mentah karena disuntikkan lewat next/script.
//
// Yang diperiksa:
//   1. Isi tiap <script type="application/ld+json"> harus JSON yang sah.
//   2. Field wajib schema.org per tipe terisi (bukan sekadar ada key-nya —
//      string kosong & array kosong dihitung TIDAK terisi).
//   3. Aturan yang gampang terlewat dan bikin blok di-drop diam-diam oleh
//      Google: Offer tanpa priceCurrency, CourseInstance tanpa courseWorkload,
//      BreadcrumbList dengan position yang tidak urut dari 1.
//
// Keluar dengan kode 1 kalau ada pelanggaran, supaya bisa dipasang di CI.
//
// Pakai: node scripts/cek-jsonld.mjs

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = ".next/server/app";
const problems = [];
const stats = new Map();

function fail(file, msg) {
  problems.push(`${file}\n    ${msg}`);
}

/** Terisi = bukan undefined/null, bukan string kosong, bukan array kosong. */
function has(obj, key) {
  const v = obj?.[key];
  if (v === undefined || v === null) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

function requireFields(file, node, type, fields) {
  for (const f of fields) {
    if (!has(node, f)) fail(file, `${type}: field wajib "${f}" kosong/hilang`);
  }
}

function typesOf(node) {
  const t = node?.["@type"];
  return Array.isArray(t) ? t : t ? [t] : [];
}

function checkOffer(file, offer, where) {
  if (!has(offer, "price") && offer.price !== 0)
    fail(file, `${where}: Offer tanpa "price"`);
  if (!has(offer, "priceCurrency"))
    fail(file, `${where}: Offer tanpa "priceCurrency" — Google membuang seluruh blok induknya`);
}

function checkNode(file, node) {
  if (!node || typeof node !== "object") return;
  const types = typesOf(node);
  for (const t of types) stats.set(t, (stats.get(t) ?? 0) + 1);

  if (types.includes("Organization") || types.includes("EducationalOrganization")) {
    requireFields(file, node, "Organization", ["name", "url"]);
    if (node.address && !has(node.address, "addressCountry"))
      fail(file, "Organization: PostalAddress tanpa addressCountry");
  }

  if (types.includes("WebSite")) {
    requireFields(file, node, "WebSite", ["url", "name"]);
    const action = node.potentialAction;
    if (action) {
      const target = action.target?.urlTemplate ?? action.target;
      if (typeof target !== "string" || !target.includes("{search_term_string}"))
        fail(file, 'WebSite: SearchAction.target tidak memuat "{search_term_string}"');
      if (!has(action, "query-input"))
        fail(file, "WebSite: SearchAction tanpa query-input");
    }
  }

  if (types.includes("FAQPage")) {
    const items = node.mainEntity;
    if (!Array.isArray(items) || items.length === 0) {
      fail(file, "FAQPage: mainEntity kosong");
    } else {
      items.forEach((q, i) => {
        if (!has(q, "name")) fail(file, `FAQPage: Question #${i + 1} tanpa "name"`);
        const text = q?.acceptedAnswer?.text;
        if (typeof text !== "string" || text.trim() === "")
          fail(file, `FAQPage: Question #${i + 1} ("${q?.name}") tanpa acceptedAnswer.text`);
      });
    }
  }

  if (types.includes("BreadcrumbList")) {
    const items = node.itemListElement;
    if (!Array.isArray(items) || items.length === 0) {
      fail(file, "BreadcrumbList: itemListElement kosong");
    } else {
      items.forEach((it, i) => {
        if (it?.position !== i + 1)
          fail(file, `BreadcrumbList: position butir ke-${i + 1} = ${it?.position}, harus urut dari 1`);
        if (!has(it, "name")) fail(file, `BreadcrumbList: butir ke-${i + 1} tanpa "name"`);
      });
      const last = items[items.length - 1];
      if (items.length > 1 && has(last, "item"))
        fail(file, "BreadcrumbList: butir terakhir (halaman ini sendiri) sebaiknya TANPA item");
    }
  }

  if (types.includes("Course")) {
    requireFields(file, node, "Course", ["name", "description", "provider"]);
    const offers = Array.isArray(node.offers) ? node.offers : node.offers ? [node.offers] : [];
    offers.forEach((o, i) => checkOffer(file, o, `Course.offers[${i}]`));
    const instances = Array.isArray(node.hasCourseInstance) ? node.hasCourseInstance : [];
    instances.forEach((ci, i) => {
      if (!has(ci, "courseMode"))
        fail(file, `Course.hasCourseInstance[${i}]: tanpa courseMode`);
      if (!has(ci, "courseWorkload"))
        fail(file, `Course.hasCourseInstance[${i}]: tanpa courseWorkload — instance diabaikan diam-diam`);
      else if (!/^P/.test(ci.courseWorkload))
        fail(file, `Course.hasCourseInstance[${i}]: courseWorkload "${ci.courseWorkload}" bukan ISO 8601 duration`);
    });
    if (node.aggregateRating && !has(node.aggregateRating, "reviewCount"))
      fail(file, "Course: aggregateRating tanpa reviewCount");
  }

  if (types.includes("VideoObject"))
    requireFields(file, node, "VideoObject", ["name", "thumbnailUrl", "uploadDate"]);

  if (types.includes("ItemList")) {
    if (!Array.isArray(node.itemListElement) || node.itemListElement.length === 0)
      fail(file, "ItemList: itemListElement kosong");
  }

  if (types.includes("AboutPage"))
    requireFields(file, node, "AboutPage", ["url", "name"]);
}

/** Ekstrak isi tiap <script type="application/ld+json"> dari HTML. */
function extract(html) {
  const out = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

async function* htmlFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith(".html")) yield p;
  }
}

const seenTypesPerFile = new Map();
let fileCount = 0;
let blockCount = 0;

for await (const file of htmlFiles(ROOT)) {
  const html = await readFile(file, "utf8");
  const blocks = extract(html);
  if (blocks.length === 0) continue;
  fileCount++;
  const rel = file.slice(ROOT.length + 1);
  const types = new Set();

  for (const raw of blocks) {
    blockCount++;
    let parsed;
    try {
      // Kebalikan dari escape < di src/lib/schema.ts.
      parsed = JSON.parse(raw.replace(/\\u003c/g, "<"));
    } catch (err) {
      fail(rel, `JSON tidak sah: ${err.message}\n    ${raw.slice(0, 160)}`);
      continue;
    }
    const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];
    for (const n of nodes) {
      typesOf(n).forEach((t) => types.add(t));
      checkNode(rel, n);
      if (!n["@context"] && !n["@id"])
        fail(rel, `node bertipe ${typesOf(n).join("+") || "?"} tanpa @context`);
    }
  }
  seenTypesPerFile.set(rel, [...types]);
}

console.log(`Diperiksa: ${blockCount} blok JSON-LD di ${fileCount} halaman.\n`);
console.log("Tipe yang ditemukan:");
for (const [t, n] of [...stats.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`  ${String(n).padStart(4)}  ${t}`);

// Halaman kunci yang WAJIB punya tipe tertentu — pagar supaya schema tidak
// hilang diam-diam saat halaman di-refactor.
const WAJIB = [
  ["index.html", ["EducationalOrganization", "WebSite", "FAQPage"]],
  ["kursus.html", ["ItemList", "BreadcrumbList"]],
  ["kursus/bahasa-korea.html", ["Course", "FAQPage", "BreadcrumbList"]],
  ["harga.html", ["BreadcrumbList"]],
];
console.log("\nPagar halaman kunci:");
for (const [f, need] of WAJIB) {
  const got = seenTypesPerFile.get(f);
  if (!got) {
    console.log(`  ?  ${f} — tidak ada di hasil build (lewati)`);
    continue;
  }
  const missing = need.filter((t) => !got.includes(t));
  if (missing.length) {
    fail(f, `halaman kunci kehilangan schema: ${missing.join(", ")}`);
    console.log(`  ✗  ${f} — kurang ${missing.join(", ")}`);
  } else {
    console.log(`  ✓  ${f} — ${need.join(", ")}`);
  }
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} masalah:\n`);
  for (const p of problems) console.error("  " + p + "\n");
  process.exit(1);
}
console.log("\n✓ Semua JSON-LD sah dan field wajibnya terisi.");
