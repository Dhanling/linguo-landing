#!/usr/bin/env node
/**
 * setup-toko-modernize-v2.mjs
 * 
 * Run dari ROOT linguo-landing:
 *   cp ~/Downloads/setup-toko-modernize-v2.mjs ~/linguo-landing/ && cd ~/linguo-landing && node setup-toko-modernize-v2.mjs
 * 
 * What it does:
 *   1. Modernize /toko (page.tsx + TokoClient.tsx)
 *   2. Create TokoCTA component
 *   3. AUTO-DETECT navbar di src/ → patch tambahin Toko link
 *   4. AUTO-PATCH src/app/page.tsx → import + render <TokoCTA />
 *   5. Backup setiap file yang di-modify
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TOKO_DIR = path.join(ROOT, 'src/app/toko');
const COMPONENTS_DIR = path.join(ROOT, 'src/components');
const PAGE_TSX = path.join(ROOT, 'src/app/page.tsx');

if (!fs.existsSync(path.join(ROOT, 'src'))) {
  console.error('❌ Folder src/ gak ketemu. Run dari root ~/linguo-landing/');
  process.exit(1);
}

// ============================================================
// File contents (embedded)
// ============================================================

const TOKO_PAGE = `import { createClient } from "@supabase/supabase-js";
import TokoClient from "./TokoClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Toko Digital — Linguo",
  description: "E-Books premium & recording class. Belajar 10+ bahasa kapan aja, di mana aja.",
};

interface PricingTier {
  price: number;
  display_label: string;
  sort_order: number;
  duration_days: number | null;
}

interface Product {
  id: string;
  type: "ebook" | "elearning";
  title: string;
  slug: string;
  description: string;
  language: string | null;
  level: string | null;
  category: string | null;
  is_featured: boolean;
  digital_product_pricing: PricingTier[];
}

export default async function TokoPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: products } = await supabase
    .from("digital_products")
    .select(\\\`
      id, type, title, slug, description,
      language, level, category, is_featured,
      digital_product_pricing (
        price, display_label, sort_order, duration_days
      )
    \\\`)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  return <TokoClient products={(products ?? []) as Product[]} />;
}
`.replace(/\\\\\\`/g, '`');

const TOKO_CLIENT = `"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const LANG_FLAGS: Record<string, string> = {
  english: "🇬🇧", korean: "🇰🇷", japanese: "🇯🇵",
  mandarin: "🇨🇳", italian: "🇮🇹", turkish: "🇹🇷",
  spanish: "🇪🇸", french: "🇫🇷", german: "🇩🇪",
  arabic: "🇸🇦", multilingual: "🌐",
};

interface PricingTier {
  price: number;
  display_label: string;
  sort_order: number;
  duration_days: number | null;
}

interface Product {
  id: string;
  type: "ebook" | "elearning";
  title: string;
  slug: string;
  description: string;
  language: string | null;
  level: string | null;
  category: string | null;
  is_featured: boolean;
  digital_product_pricing: PricingTier[];
}

type FilterType = "all" | "ebook" | "elearning";

export default function TokoClient({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filter !== "all" && p.type !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.language ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, filter, query]);

  const counts = useMemo(
    () => ({
      all: products.length,
      ebook: products.filter((p) => p.type === "ebook").length,
      elearning: products.filter((p) => p.type === "elearning").length,
    }),
    [products]
  );

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-20 left-[20%] w-[480px] h-[480px] bg-[#1A9E9E] opacity-[0.15] blur-[100px] rounded-full" />
          <div className="absolute -bottom-32 right-[15%] w-[420px] h-[420px] bg-[#F5C842] opacity-[0.18] blur-[100px] rounded-full" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#1A9E9E] font-bold mb-5 animate-[fadeUp_0.6s_ease-out_both]">
            🛍️ Toko Digital
          </div>
          <h1
            className="text-5xl md:text-7xl font-black text-zinc-900 leading-[0.95] tracking-tight mb-6 animate-[fadeUp_0.6s_ease-out_both]"
            style={{ animationDelay: "100ms" }}
          >
            Belajar bahasa
            <br />
            <span className="italic font-serif text-[#1A9E9E] font-medium">di waktu luangmu</span>
            <span className="text-[#F5C842]">.</span>
          </h1>
          <p
            className="text-lg md:text-xl text-zinc-600 max-w-2xl leading-relaxed animate-[fadeUp_0.6s_ease-out_both]"
            style={{ animationDelay: "200ms" }}
          >
            E-Books premium & recording class lengkap. Akses sekali, manfaat seumur hidup.{" "}
            <span className="font-semibold text-zinc-900">{counts.all} produk</span> siap dipelajari.
          </p>
        </div>
      </section>

      {/* FILTER */}
      <section className="sticky top-0 z-20 backdrop-blur-xl bg-[#fafaf7]/85 border-y border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-2.5">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")} count={counts.all}>
            Semua
          </FilterPill>
          <FilterPill active={filter === "ebook"} onClick={() => setFilter("ebook")} count={counts.ebook}>
            <span className="mr-1.5">📚</span>E-Book
          </FilterPill>
          <FilterPill active={filter === "elearning"} onClick={() => setFilter("elearning")} count={counts.elearning}>
            <span className="mr-1.5">🎬</span>E-Learning
          </FilterPill>
          <div className="ml-auto relative w-full md:w-64">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari bahasa..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-zinc-200 bg-white focus:outline-none focus:border-[#1A9E9E] focus:ring-4 focus:ring-[#1A9E9E]/10 text-sm transition-all"
            />
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" key={filter}>
            {filtered.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}
      </section>

      <style jsx global>{\\\`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      \\\`}</style>
    </div>
  );
}

function FilterPill({ active, onClick, count, children }: {
  active: boolean; onClick: () => void; count: number; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={\\\`group relative px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 \\\${
        active
          ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 scale-[1.02]"
          : "bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300"
      }\\\`}
    >
      {children}
      <span className={\\\`ml-2 text-xs font-medium tabular-nums \\\${active ? "text-white/60" : "text-zinc-400"}\\\`}>
        {count}
      </span>
    </button>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const minPrice = product.digital_product_pricing.length > 0
    ? Math.min(...product.digital_product_pricing.map((p) => p.price))
    : 0;
  const flag = LANG_FLAGS[product.language ?? "multilingual"] ?? "🌐";
  const isEbook = product.type === "ebook";

  return (
    <Link
      href={\\\`/toko/\\\${product.slug}\\\`}
      className="group block animate-[fadeUp_0.55s_cubic-bezier(0.22,0.61,0.36,1)_both]"
      style={{ animationDelay: \\\`\\\${Math.min(index * 50, 600)}ms\\\` }}
    >
      <article
        className={\\\`relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 group-hover:-translate-y-1.5 \\\${
          product.is_featured
            ? "border-[#F5C842] shadow-[0_4px_24px_-8px_rgba(245,200,66,0.4)] group-hover:shadow-[0_24px_48px_-12px_rgba(245,200,66,0.5)]"
            : "border-zinc-200 group-hover:border-zinc-300 group-hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)]"
        }\\\`}
      >
        <div
          className={\\\`relative aspect-[5/4] overflow-hidden \\\${
            isEbook
              ? "bg-gradient-to-br from-[#1A9E9E] via-[#0d7474] to-[#0a4f4f]"
              : "bg-gradient-to-br from-[#F5C842] via-[#e0a93c] to-[#a87810]"
          }\\\`}
        >
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)", backgroundSize: "24px 24px" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[88px] group-hover:scale-110 transition-transform duration-700 ease-out">
            <span className="drop-shadow-2xl">{flag}</span>
          </div>
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white backdrop-blur-md">
              {isEbook ? "📚 E-Book" : "🎬 Course"}
            </span>
            {product.level && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/25 text-white backdrop-blur-md">
                {product.level}
              </span>
            )}
          </div>
          {product.is_featured && (
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F5C842] text-zinc-900 shadow-lg flex items-center gap-1">
                ⭐ Featured
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
        <div className="p-5">
          <h3 className="font-bold text-zinc-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#1A9E9E] transition-colors duration-200">
            {product.title}
          </h3>
          <p className="text-sm text-zinc-500 line-clamp-2 mb-5 leading-relaxed">{product.description}</p>
          <div className="flex items-end justify-between pt-4 border-t border-zinc-100">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">Mulai dari</div>
              <div className="text-xl font-black text-zinc-900 tabular-nums">Rp {minPrice.toLocaleString("id-ID")}</div>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-[#1A9E9E] transition-colors">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">Lihat</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24 animate-[fadeUp_0.5s_ease-out_both]">
      <div className="text-7xl mb-6 opacity-20">🔍</div>
      <h3 className="text-xl font-bold text-zinc-700 mb-2">Gak ada yang cocok</h3>
      <p className="text-zinc-500">Coba ubah filter atau search keyword lain.</p>
    </div>
  );
}
`.replace(/\\\\\\`/g, '`').replace(/\\\\\\\$/g, '$');

const TOKO_CTA = `"use client";

import Link from "next/link";

export default function TokoCTA() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/toko"
          className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d7474] via-[#1A9E9E] to-[#1A9E9E] p-10 md:p-14 transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(26,158,158,0.5)]"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#F5C842] opacity-20 blur-3xl rounded-full group-hover:opacity-30 transition-opacity duration-700" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white opacity-10 blur-3xl rounded-full" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)", backgroundSize: "28px 28px" }}
            />
          </div>
          <div className="relative grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-bold text-[#F5C842] mb-4">
                <span>🛍️</span> Toko Digital · Baru!
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-[1] tracking-tight mb-4">
                E-Books & Recording Class
                <br />
                <span className="italic font-serif font-medium text-[#F5C842]">belajar di waktu luangmu.</span>
              </h2>
              <p className="text-white/80 text-lg max-w-xl leading-relaxed">
                Modul belajar 6+ bahasa, plus paket E-Learning unlimited 10+ bahasa. Akses sekali, manfaat seumur hidup.
              </p>
            </div>
            <div className="flex md:flex-col items-center gap-3">
              <span className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white text-zinc-900 font-bold text-base shadow-2xl group-hover:scale-105 group-hover:bg-[#F5C842] transition-all duration-300">
                Masuk Toko
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
              <span className="text-xs text-white/60 hidden md:block">Mulai Rp 29.000</span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
`;

// ============================================================
// Helpers
// ============================================================

function backup(filePath) {
  const bk = filePath + '.backup-' + Date.now();
  fs.copyFileSync(filePath, bk);
  return bk;
}

function walkSync(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'dist' || entry.name === 'build') continue;
      walkSync(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

// ============================================================
// Step 1: Write /toko files
// ============================================================

console.log('🚀 Setup /toko + auto-patch navbar/homepage\n');
console.log('📝 Writing files:');

if (!fs.existsSync(TOKO_DIR)) fs.mkdirSync(TOKO_DIR, { recursive: true });
if (!fs.existsSync(COMPONENTS_DIR)) fs.mkdirSync(COMPONENTS_DIR, { recursive: true });

const tokoFiles = [
  { p: path.join(TOKO_DIR, 'page.tsx'), c: TOKO_PAGE },
  { p: path.join(TOKO_DIR, 'TokoClient.tsx'), c: TOKO_CLIENT },
  { p: path.join(COMPONENTS_DIR, 'TokoCTA.tsx'), c: TOKO_CTA },
];

for (const f of tokoFiles) {
  if (fs.existsSync(f.p)) backup(f.p);
  fs.writeFileSync(f.p, f.c);
  console.log(`  ✅ ${path.relative(ROOT, f.p)}`);
}

// ============================================================
// Step 2: Detect & patch navbar
// ============================================================

console.log('\n🔍 Detecting navbar...');

function findNavbar() {
  const candidates = [];
  walkSync(path.join(ROOT, 'src'), (file) => {
    if (!file.endsWith('.tsx')) return;
    if (file.includes('/toko/')) return;
    if (file.includes('TokoCTA')) return;

    let content;
    try { content = fs.readFileSync(file, 'utf8'); } catch { return; }

    let score = 0;
    const fn = path.basename(file).toLowerCase();
    if (fn.match(/^(nav|navbar|header|menu|topbar)/)) score += 25;
    if (/<nav[\s>]/i.test(content)) score += 12;
    if (/<header[\s>]/i.test(content)) score += 8;
    if (/from\s+["']next\/link["']/.test(content)) score += 5;
    const linkCount = (content.match(/<Link\s+href=["']\//g) || []).length;
    if (linkCount >= 2) score += Math.min(linkCount * 4, 20);
    if (file.endsWith('/page.tsx')) score -= 15;

    if (score >= 25) candidates.push({ file, content, score, linkCount });
  });
  return candidates.sort((a, b) => b.score - a.score);
}

const navCandidates = findNavbar();
let navResult = { ok: false };

if (navCandidates.length > 0) {
  const { file, content } = navCandidates[0];
  const relFile = path.relative(ROOT, file);

  if (content.includes('href="/toko"')) {
    console.log(`  ✓ Already has /toko link: ${relFile}`);
    navResult = { ok: true, alreadyPatched: true, file: relFile };
  } else {
    // Find existing Link to duplicate pattern
    const targetMatch = content.match(/(<Link\s+href="\/(?!toko)[a-z][^"]*"[^>]*>[\s\S]*?<\/Link>)/);

    if (targetMatch) {
      const targetStr = targetMatch[1];
      const classNameMatch = targetStr.match(/className=["']([^"']+)["']/);
      const className = classNameMatch
        ? classNameMatch[1]
        : 'text-zinc-700 hover:text-[#1A9E9E] font-medium transition-colors';

      const tokoLink = `<Link href="/toko" className="${className}">🛍️ Toko</Link>`;
      const newContent = content.replace(targetStr, tokoLink + '\n      ' + targetStr);

      backup(file);
      fs.writeFileSync(file, newContent);
      console.log(`  ✅ Patched: ${relFile} (score ${navCandidates[0].score})`);
      navResult = { ok: true, file: relFile };
    } else {
      console.log(`  ⚠️  Found navbar di ${relFile} tapi pattern Link gak ke-detect`);
      navResult = { ok: false, file: relFile, reason: 'no-link-pattern' };
    }
  }
} else {
  console.log('  ⚠️  Navbar gak ke-detect');
  navResult = { ok: false, reason: 'no-candidate' };
}

// ============================================================
// Step 3: Patch src/app/page.tsx
// ============================================================

console.log('\n🔍 Patching src/app/page.tsx...');

let pageResult = { ok: false };

if (!fs.existsSync(PAGE_TSX)) {
  console.log('  ⚠️  src/app/page.tsx gak ada');
  pageResult = { ok: false, reason: 'no-page' };
} else {
  let content = fs.readFileSync(PAGE_TSX, 'utf8');

  if (content.includes('TokoCTA')) {
    console.log('  ✓ Already has TokoCTA');
    pageResult = { ok: true, alreadyPatched: true };
  } else {
    const importMatches = [...content.matchAll(/^import[^;\n]+;?\s*$/gm)];
    if (importMatches.length === 0) {
      console.log('  ⚠️  Gak nemu import statement');
      pageResult = { ok: false, reason: 'no-imports' };
    } else {
      const lastImport = importMatches[importMatches.length - 1];
      const lastImportEnd = lastImport.index + lastImport[0].length;
      let newContent =
        content.slice(0, lastImportEnd) +
        '\nimport TokoCTA from "@/components/TokoCTA";' +
        content.slice(lastImportEnd);

      // Try insertion strategies
      const strategies = [
        // After <Hero ...> or <HeroSection /> 
        { pattern: /(<Hero(?:Section)?\b[^>]*\/>)/, replacement: '$1\n      <TokoCTA />' },
        { pattern: /(<\/Hero(?:Section)?>)/, replacement: '$1\n      <TokoCTA />' },
        // Before </main>
        { pattern: /(\s*)<\/main>/, replacement: '$1  <TokoCTA />\n$1</main>' },
        // Before fragment close (last </> in file)
        { pattern: /(<\/>)\s*\)\s*;?\s*\}\s*$/, replacement: '  <TokoCTA />\n    $1\n  );\n}\n' },
      ];

      let inserted = false;
      for (const s of strategies) {
        if (s.pattern.test(newContent)) {
          newContent = newContent.replace(s.pattern, s.replacement);
          inserted = true;
          break;
        }
      }

      if (inserted) {
        backup(PAGE_TSX);
        fs.writeFileSync(PAGE_TSX, newContent);
        console.log('  ✅ Patched: imported + rendered <TokoCTA />');
        pageResult = { ok: true };
      } else {
        console.log('  ⚠️  Gak nemu injection point');
        pageResult = { ok: false, reason: 'no-injection-point' };
      }
    }
  }
}

// ============================================================
// Summary
// ============================================================

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ /toko/page.tsx, TokoClient.tsx, TokoCTA.tsx — created
${navResult.ok ? `✅ Navbar — patched (${navResult.file || 'already'})` : `⚠️  Navbar — needs manual edit (${navResult.reason})`}
${pageResult.ok ? `✅ Homepage page.tsx — patched` : `⚠️  Homepage — needs manual edit (${pageResult.reason})`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  git add -A
  git commit -m "feat(toko): modernize UI + filter + homepage CTA + nav link"
  git push

`);

if (!navResult.ok || !pageResult.ok) {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MANUAL FIX NEEDED — share output ke chat:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ls src/components/
  echo "---"
  head -80 src/app/page.tsx
  echo "---"
  cat src/app/layout.tsx | head -60

Gue patch precise berdasarkan struktur lo.
`);
}
