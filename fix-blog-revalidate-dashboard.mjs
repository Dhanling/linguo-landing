#!/usr/bin/env node
// Add on-demand revalidation trigger to BlogPage.tsx mutations
// Run from ~/linguo-admin-dashboard root
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/pages/BlogPage.tsx";
if (!fs.existsSync(FILE)) {
  console.error("❌ src/pages/BlogPage.tsx not found. Run from ~/linguo-admin-dashboard root.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");

// ============ 1. Add revalidateBlog helper after imports ============
const HELPER = `
// ========== ON-DEMAND BLOG REVALIDATION ==========
// Tells linguo.id to refresh its blog cache after save/update/delete
const LANDING_URL = (import.meta.env.VITE_LANDING_URL as string) || "https://linguo.id";
const REVALIDATE_SECRET = (import.meta.env.VITE_REVALIDATE_SECRET as string) || "";

async function revalidateBlog(slug?: string): Promise<boolean> {
  if (!REVALIDATE_SECRET) {
    console.warn("[revalidate] VITE_REVALIDATE_SECRET not set — skipping revalidation");
    return false;
  }
  try {
    const res = await fetch(\`\${LANDING_URL}/api/revalidate-blog\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: REVALIDATE_SECRET, slug }),
    });
    if (!res.ok) {
      console.warn("[revalidate] Failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[revalidate] Error:", e);
    return false;
  }
}
`;

// Insert helper after the last import
const importBlockMatch = src.match(/(import[^;]+;\s*\n)+/);
if (!importBlockMatch) {
  console.error("❌ Couldn't locate import block in BlogPage.tsx");
  process.exit(1);
}

if (src.includes("revalidateBlog")) {
  console.log("✓  revalidateBlog helper already present — skipping helper injection");
} else {
  const insertPos = importBlockMatch.index + importBlockMatch[0].length;
  src = src.slice(0, insertPos) + HELPER + src.slice(insertPos);
  console.log("✅ Injected revalidateBlog helper");
}

// ============ 2. Patch createMut — return data from insert, revalidate onSuccess ============
const OLD_CREATE = `  // Create
  const createMut = useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const { error } = await supabase.from("blog_posts").insert(post);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["blog-posts"] }); setMode("list"); },
    onError: (e: any) => alert("Gagal simpan: " + e.message),
  });`;

const NEW_CREATE = `  // Create
  const createMut = useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const { data, error } = await supabase.from("blog_posts").insert(post).select().single();
      if (error) throw error;
      return data as BlogPost;
    },
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
      setMode("list");
      // Trigger landing page revalidation (only if published)
      if (data?.status === "published") {
        const ok = await revalidateBlog(data.slug);
        console.log(ok ? "[blog] Landing page revalidated ✓" : "[blog] Revalidation skipped/failed");
      }
    },
    onError: (e: any) => alert("Gagal simpan: " + e.message),
  });`;

if (src.includes(OLD_CREATE)) {
  src = src.replace(OLD_CREATE, NEW_CREATE);
  console.log("✅ Patched createMut");
} else if (src.includes("data?.status === \"published\"")) {
  console.log("✓  createMut already patched — skipping");
} else {
  console.warn("⚠️  createMut pattern not found — manual check needed");
}

// ============ 3. Patch updateMut ============
const OLD_UPDATE = `  // Update
  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BlogPost> & { id: string }) => {
      const { error } = await supabase.from("blog_posts").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["blog-posts"] }); setMode("list"); setEditPost(undefined); },
    onError: (e: any) => alert("Gagal update: " + e.message),
  });`;

const NEW_UPDATE = `  // Update
  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BlogPost> & { id: string }) => {
      const { data: updated, error } = await supabase.from("blog_posts").update(data).eq("id", id).select().single();
      if (error) throw error;
      return updated as BlogPost;
    },
    onSuccess: async (updated) => {
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
      setMode("list");
      setEditPost(undefined);
      // Revalidate whether published or going from published → draft (user needs to see it removed too)
      const ok = await revalidateBlog(updated?.slug);
      console.log(ok ? "[blog] Landing page revalidated ✓" : "[blog] Revalidation skipped/failed");
    },
    onError: (e: any) => alert("Gagal update: " + e.message),
  });`;

if (src.includes(OLD_UPDATE)) {
  src = src.replace(OLD_UPDATE, NEW_UPDATE);
  console.log("✅ Patched updateMut");
} else if (src.includes("Landing page revalidated")) {
  console.log("✓  updateMut already patched — skipping");
} else {
  console.warn("⚠️  updateMut pattern not found — manual check needed");
}

// ============ 4. Patch deleteMut — need to grab slug first ============
const OLD_DELETE = `  // Delete
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-posts"] }),
  });`;

const NEW_DELETE = `  // Delete
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      // Fetch slug before delete so we can revalidate that path
      const { data: existing } = await supabase.from("blog_posts").select("slug").eq("id", id).single();
      const slug = existing?.slug;
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
      return { slug };
    },
    onSuccess: async (result) => {
      qc.invalidateQueries({ queryKey: ["blog-posts"] });
      const ok = await revalidateBlog(result?.slug);
      console.log(ok ? "[blog] Landing page revalidated ✓" : "[blog] Revalidation skipped/failed");
    },
  });`;

if (src.includes(OLD_DELETE)) {
  src = src.replace(OLD_DELETE, NEW_DELETE);
  console.log("✅ Patched deleteMut");
} else if (src.includes("Fetch slug before delete")) {
  console.log("✓  deleteMut already patched — skipping");
} else {
  console.warn("⚠️  deleteMut pattern not found — manual check needed");
}

fs.writeFileSync(FILE, src, "utf8");

// ============ 5. Commit & push ============
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "feat(blog): trigger landing revalidation on save/delete"', { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("\n✅ Pushed to GitHub");
} catch (e) {
  console.error("⚠️  Git failed:", e.message);
}

// ============ 6. Instructions ============
console.log("\n" + "━".repeat(60));
console.log("📋 FINAL STEPS — Set env vars di Vercel (dashboard project)");
console.log("━".repeat(60));
console.log("1. Buka https://vercel.com/dashboard → project dashboard.linguo.id");
console.log("2. Settings → Environment Variables → Add New (2 variables):");
console.log("");
console.log("   ┌─ Variable #1 ─────────────────────────────");
console.log("   │ Name:  VITE_LANDING_URL");
console.log("   │ Value: https://linguo.id");
console.log("   │ Environments: Production, Preview, Development");
console.log("   └───────────────────────────────────────────");
console.log("");
console.log("   ┌─ Variable #2 ─────────────────────────────");
console.log("   │ Name:  VITE_REVALIDATE_SECRET");
console.log("   │ Value: <paste secret dari script sebelumnya>");
console.log("   │ Environments: Production, Preview, Development");
console.log("   └───────────────────────────────────────────");
console.log("");
console.log("3. Save → Deployments → ⋯ → Redeploy (WAJIB biar env var masuk)");
console.log("");
console.log("4. Test: buka dashboard → edit artikel → Simpan");
console.log("   Cek Console browser (Cmd+Opt+J): harus ada log:");
console.log("   '[blog] Landing page revalidated ✓'");
console.log("");
console.log("5. Refresh linguo.id/blog → perubahan langsung muncul ⚡");
console.log("━".repeat(60));

// Self-delete
try {
  fs.unlinkSync(new URL(import.meta.url));
  console.log("\n🧹 Script self-deleted");
} catch {}
