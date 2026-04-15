import { createClient } from "@supabase/supabase-js";
export default async function sitemap() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data: posts } = await supabase.from("blog_posts").select("slug, updated_at").eq("status", "published");
  const urls = (posts || []).map((p: any) => ({ url: "https://linguo.id/blog/" + p.slug, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.8 }));
  return [{ url: "https://linguo.id/blog", lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 }, ...urls];
}