#!/usr/bin/env node
// Enhance blog article hero: bigger banner, gradient overlay, priority loading
// Run from ~/linguo-landing root
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/ArticleContent.tsx";
if (!fs.existsSync(FILE)) {
  console.error(`❌ ${FILE} not found. Run from ~/linguo-landing root.`);
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");

const OLD = `      {/* Cover Image / Hero */}
      <div className={\`relative w-full h-[280px] sm:h-[360px] bg-gradient-to-br \${grad} overflow-hidden\`}>
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-white/20 text-[120px] sm:text-[160px] font-black leading-none select-none">{langName?.[0] || "L"}</div>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute bottom-10 left-10 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-white/5" />
          </div>
        )}
        {/* Category overlay */}
        <div className="absolute top-6 left-6">
          <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
            {post.category || "Artikel"}
          </span>
        </div>
      </div>`;

const NEW = `      {/* Cover Image / Hero */}
      <div className={\`relative w-full h-[320px] sm:h-[420px] lg:h-[480px] bg-gradient-to-br \${grad} overflow-hidden\`}>
        {post.cover_image ? (
          <>
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="eager"
              // @ts-ignore - fetchpriority is valid HTML but not yet in React types
              fetchpriority="high"
            />
            {/* Gradient overlays for better text legibility & aesthetic depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-white/20 text-[120px] sm:text-[160px] lg:text-[200px] font-black leading-none select-none">{langName?.[0] || "L"}</div>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute bottom-10 left-10 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-white/5" />
          </div>
        )}
        {/* Category overlay */}
        <div className="absolute top-6 left-6 z-10">
          <span className="bg-white/95 backdrop-blur-sm text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg">
            {post.category || "Artikel"}
          </span>
        </div>
      </div>`;

if (!src.includes(OLD)) {
  if (src.includes('fetchpriority="high"')) {
    console.log("✓  Hero section already enhanced — no changes needed");
    process.exit(0);
  }
  console.error("❌ Hero section pattern not found — file may have been modified");
  process.exit(1);
}

src = src.replace(OLD, NEW);
fs.writeFileSync(FILE, src, "utf8");
console.log("✅ Enhanced article hero section:");
console.log("   - Taller banner: 320px → 420px → 480px (mobile/tablet/desktop)");
console.log("   - Dual gradient overlay for text legibility");
console.log("   - fetchpriority=\"high\" + loading=\"eager\" for better LCP");
console.log("   - Category badge with stronger shadow + z-10");
console.log("   - Bigger fallback letter on desktop (200px)");

// Commit & push
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "feat(blog): enhanced article hero — bigger banner, gradient overlay, priority loading"', { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("\n✅ Pushed to GitHub — Vercel deploying (~30s)");
} catch (e) {
  console.error("⚠️  Git failed:", e.message);
}

// Self-delete
try {
  fs.unlinkSync(new URL(import.meta.url));
  console.log("🧹 Script self-deleted");
} catch {}

console.log("\n" + "━".repeat(60));
console.log("📋 IMPORTANT — Pastikan cover image muncul di banner:");
console.log("━".repeat(60));
console.log("1. Run SQL ini di Supabase SQL Editor:");
console.log("   SELECT slug, cover_image FROM blog_posts");
console.log("   WHERE slug = 'belajar-bahasa-uzbek';");
console.log("");
console.log("2. Kalau cover_image KOSONG → save ulang artikel dari dashboard");
console.log("   Kalau cover_image ADA → refresh linguo.id/blog/belajar-bahasa-uzbek");
console.log("   (tunggu Vercel deploy selesai dulu)");
console.log("");
console.log("3. Kalau masih tampil huruf 'U' padahal cover_image ada → ");
console.log("   Vercel dashboard → linguo-landing → Redeploy manual");
console.log("━".repeat(60));
