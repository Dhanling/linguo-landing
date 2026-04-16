#!/usr/bin/env node
// Generate a fresh REVALIDATE_SECRET for both Vercel projects
// No need to cd anywhere — just run

const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const secret = Array.from({ length: 32 }, () =>
  chars.charAt(Math.floor(Math.random() * chars.length))
).join("");

console.log("");
console.log("=".repeat(60));
console.log("NEW REVALIDATE SECRET (32 chars)");
console.log("=".repeat(60));
console.log("");
console.log("   " + secret);
console.log("");
console.log("=".repeat(60));
console.log("SETUP STEPS — copy secret di atas, lalu:");
console.log("=".repeat(60));
console.log("");
console.log("PROJECT 1: linguo-landing");
console.log("URL: https://vercel.com/dhanling/linguo-landing/settings/environment-variables");
console.log("  1. Klik 'Add New'");
console.log("  2. Name:  REVALIDATE_SECRET");
console.log("  3. Value: " + secret);
console.log("  4. Environments: Production + Preview + Development (centang semua)");
console.log("  5. Save");
console.log("  6. Deployments -> [titik tiga] -> Redeploy");
console.log("");
console.log("PROJECT 2: linguo-admin-dashboard");
console.log("URL: https://vercel.com/dhanling/linguo-admin-dashboard/settings/environment-variables");
console.log("  1. Klik 'Add New'");
console.log("  2. Name:  VITE_LANDING_URL");
console.log("  3. Value: https://linguo.id");
console.log("  4. Environments: Production + Preview + Development");
console.log("  5. Save");
console.log("");
console.log("  6. Klik 'Add New' lagi");
console.log("  7. Name:  VITE_REVALIDATE_SECRET");
console.log("  8. Value: " + secret);
console.log("     (SECRET YANG SAMA dengan di linguo-landing!)");
console.log("  9. Environments: Production + Preview + Development");
console.log("  10. Save");
console.log("  11. Deployments -> [titik tiga] -> Redeploy");
console.log("");
console.log("=".repeat(60));
console.log("VERIFY setelah redeploy keduanya:");
console.log("=".repeat(60));
console.log("  1. Refresh dashboard (Cmd+Shift+R)");
console.log("  2. Edit artikel -> klik Simpan");
console.log("  3. DevTools Console harusnya nampilin:");
console.log("     [blog] Landing revalidated ✓");
console.log("     (bukan 'VITE_REVALIDATE_SECRET not set')");
console.log("");
console.log("  4. Refresh linguo.id/blog/<slug> -> perubahan muncul instan");
console.log("=".repeat(60));
