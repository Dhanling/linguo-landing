"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// Use the same Supabase project — anon key is safe for inserts with RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Tracks a page view for a blog article.
 * Drop this into ArticleContent.tsx:
 *   <BlogTracker slug={article.slug} />
 *
 * Features:
 * - Fires once per page load (deduped via ref)
 * - Captures referrer
 * - Non-blocking — errors are silently swallowed
 * - No cookies, no fingerprinting, privacy-friendly
 */
export default function BlogTracker({ slug }: { slug: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!slug || tracked.current) return;
    tracked.current = true;

    // Fire and forget — don't block rendering
    supabase
      .from("blog_page_views")
      .insert({
        post_slug: slug,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
      })
      .then(({ error }) => {
        if (error) console.warn("[BlogTracker] Failed:", error.message);
      });
  }, [slug]);

  return null; // invisible component
}
