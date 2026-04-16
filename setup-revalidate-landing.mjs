#!/usr/bin/env node
// Setup on-demand revalidation for blog
// Run from ~/linguo-landing root
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const API_DIR = "src/app/api/revalidate-blog";
const ROUTE_FILE = path.join(API_DIR, "route.ts");
const SLUG_PAGE = "src/app/blog/[slug]/page.tsx";

// Check we're in the right folder
if (!fs.existsSync("src/app/blog")) {
  console.error("❌ src/app/blog not found. Run from ~/linguo-landing root.");
  process.exit(1);
}

// 1. Create API route for revalidation
const ROUTE_CONTENT = `import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, slug } = body;

    const expected = process.env.REVALIDATE_SECRET;
    if (!expected) {
      return NextResponse.json({ error: "REVALIDATE_SECRET not configured" }, { status: 500 });
    }
    if (secret !== expected) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    // Always revalidate the blog listing
    revalidatePath("/blog");

    // If slug provided, revalidate that specific article too
    const paths: string[] = ["/blog"];
    if (slug && typeof slug === "string") {
      revalidatePath(\`/blog/\${slug}\`);
      paths.push(\`/blog/\${slug}\`);
    }

    return NextResponse.json({
      revalidated: true,
      paths,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Revalidation error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

// Also allow GET for simple health check
export async function GET() {
  return NextResponse.json({ status: "ready", endpoint: "/api/revalidate-blog" });
}
`;

if (!fs.existsSync(API_DIR)) fs.mkdirSync(API_DIR, { recursive: true });
fs.writeFileSync(ROUTE_FILE, ROUTE_CONTENT, "utf8");
console.log(`✅ Created ${ROUTE_FILE}`);

// 2. Add `export const revalidate = 60` to [slug]/page.tsx as safety net (if not already there)
if (fs.existsSync(SLUG_PAGE)) {
  let slugSrc = fs.readFileSync(SLUG_PAGE, "utf8");
  if (!slugSrc.includes("export const revalidate")) {
    // Find the last import statement
    const lines = slugSrc.split("\n");
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("import ") || lines[i].startsWith("import{")) {
        lastImportIdx = i;
      }
    }
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, "", "// Safety net: revalidate every 60s even if webhook fails", "export const revalidate = 60;");
      fs.writeFileSync(SLUG_PAGE, lines.join("\n"), "utf8");
      console.log(`✅ Added revalidate=60 safety net to ${SLUG_PAGE}`);
    } else {
      console.log(`⚠️  Couldn't find import in ${SLUG_PAGE}, skipping safety net`);
    }
  } else {
    console.log(`✓  ${SLUG_PAGE} already has revalidate export`);
  }
} else {
  console.log(`⚠️  ${SLUG_PAGE} not found, skipping safety net`);
}

// 3. Generate a suggested secret for the user
const secret = Array.from({ length: 32 }, () =>
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 62))
).join("");

console.log("\n" + "━".repeat(60));
console.log("🔑 SUGGESTED SECRET (copy this!):");
console.log("   " + secret);
console.log("━".repeat(60));

// 4. Commit & push
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "feat(blog): on-demand revalidation API"', { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("\n✅ Pushed to GitHub — Vercel will deploy in ~30s");
} catch (e) {
  console.error("⚠️  Git failed:", e.message);
}

// 5. Instructions
console.log("\n" + "━".repeat(60));
console.log("📋 NEXT STEPS:");
console.log("━".repeat(60));
console.log("1. Buka https://vercel.com/dashboard → project linguo-landing (linguo.id)");
console.log("2. Settings → Environment Variables → Add New");
console.log("3. Name:  REVALIDATE_SECRET");
console.log("   Value: " + secret);
console.log("   Environments: Production, Preview, Development");
console.log("4. Save → Deployments → ⋯ → Redeploy (WAJIB biar env var masuk)");
console.log("");
console.log("5. Copy secret ini buat nanti di-paste di dashboard:");
console.log("   " + secret);
console.log("");
console.log("6. Lanjut run script dashboard: node fix-blog-revalidate-dashboard.mjs");
console.log("━".repeat(60));

// Self-delete
try {
  fs.unlinkSync(new URL(import.meta.url));
  console.log("\n🧹 Script self-deleted");
} catch {}
