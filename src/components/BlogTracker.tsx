"use client";

import { useEffect, useRef } from "react";
// [fix:gotrue-client-tunggal-v1] pakai client kanonik (anon, RLS tetap berlaku),
// jangan bikin instance GoTrue baru — instance ganda ganggu deteksi sesi OAuth
import { supabase } from "@/lib/supabase-client";

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
