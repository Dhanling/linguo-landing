"use client";

// src/app/blog/[slug]/TableOfContents.tsx
//
// Client-side TOC component for blog articles.
// — Scans DOM after render (no parsing of post.content) for robustness
// — Auto-adds anchor IDs to H2/H3 headings if missing
// — Sticky sidebar on desktop (xl: ≥1280px), drawer on mobile/tablet
// — Intersection Observer for scroll spy (highlight active section)
// — Hides if article has fewer than 3 headings (TOC not useful)

import { useEffect, useState, useCallback } from "react";

interface Heading {
  id: string;
  text: string;
  level: number; // 2 or 3
}

// ============================================================================
// HELPERS
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function findArticleContainer(): Element | null {
  // Priority order — first match wins
  return (
    document.querySelector("[data-article-body]") ||
    document.querySelector("article") ||
    document.querySelector(".prose") ||
    document.querySelector("main") ||
    null
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  // ─── Scan headings from DOM after mount ────────────────────────────────────
  useEffect(() => {
    const scan = () => {
      const article = findArticleContainer();
      if (!article) return;

      const elements = Array.from(article.querySelectorAll("h2, h3"));
      const seenIds = new Set<string>();
      const items: Heading[] = [];

      elements.forEach((el, idx) => {
        const text = (el.textContent || "").trim();
        if (!text) return;

        // Auto-add ID if missing
        let id = el.id || slugify(text) || `section-${idx}`;

        // Ensure uniqueness (in case of duplicate headings)
        let uniqueId = id;
        let counter = 1;
        while (seenIds.has(uniqueId)) {
          uniqueId = `${id}-${counter++}`;
        }
        seenIds.add(uniqueId);

        el.id = uniqueId;

        // Add scroll margin so headings don't hide under sticky header
        (el as HTMLElement).style.scrollMarginTop = "100px";

        items.push({
          id: uniqueId,
          text,
          level: el.tagName === "H2" ? 2 : 3,
        });
      });

      setHeadings(items);
    };

    // Wait briefly for content (especially Supabase-rendered HTML) to settle
    const t = setTimeout(scan, 150);
    return () => clearTimeout(t);
  }, []);

  // ─── Intersection Observer for scroll spy ─────────────────────────────────
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // ─── Click handler: smooth scroll + update URL hash ────────────────────────
  const handleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
    history.pushState(null, "", `#${id}`);
    setMobileOpen(false);
  }, []);

  // ─── Hide TOC if article has too few headings (not useful) ────────────────
  if (headings.length < 3) return null;

  return (
    <>
      {/* ====================================================================== */}
      {/* DESKTOP (xl: ≥1280px): Fixed sidebar on right edge of viewport */}
      {/* ====================================================================== */}
      <aside
        className="
          hidden xl:block
          fixed top-24 right-6
          w-60
          max-h-[calc(100vh-8rem)]
          overflow-y-auto
          z-20
          pr-2
        "
        aria-label="Daftar Isi"
      >
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          Daftar Isi
        </div>
        <nav>
          <ul className="space-y-1 border-l-2 border-slate-200">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              return (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => handleClick(e, h.id)}
                    className={`
                      block py-1 text-sm leading-snug transition-colors
                      ${h.level === 3 ? "pl-7" : "pl-3"}
                      ${
                        isActive
                          ? "border-l-2 -ml-[2px] border-[#1A9E9E] text-[#1A9E9E] font-medium"
                          : "text-slate-600 hover:text-slate-900"
                      }
                    `}
                  >
                    {h.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ====================================================================== */}
      {/* MOBILE/TABLET (< xl): Floating button + slide-up bottom sheet */}
      {/* ====================================================================== */}
      <div className="xl:hidden">
        {/* Floating toggle button — bottom right, above any other FAB */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Buka Daftar Isi"
          className="
            fixed bottom-20 right-6
            z-30
            w-12 h-12
            rounded-full
            bg-white shadow-lg ring-1 ring-slate-200
            flex items-center justify-center
            text-slate-700
            transition-all duration-200
            hover:shadow-xl hover:-translate-y-0.5
            active:scale-95
          "
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h10M4 18h7"
            />
          </svg>
        </button>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />
        )}

        {/* Bottom sheet panel */}
        <div
          role="dialog"
          aria-label="Daftar Isi"
          className={`
            fixed inset-x-0 bottom-0 z-50
            bg-white rounded-t-2xl shadow-2xl
            max-h-[80vh] flex flex-col
            transition-transform duration-300 ease-out
            ${mobileOpen ? "translate-y-0" : "translate-y-full"}
          `}
        >
          {/* Drag handle */}
          <div className="flex justify-center py-3">
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>

          {/* Header */}
          <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Daftar Isi</h3>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup"
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* List */}
          <nav className="flex-1 overflow-y-auto px-5 py-3">
            <ul className="space-y-1">
              {headings.map((h) => {
                const isActive = activeId === h.id;
                return (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      onClick={(e) => handleClick(e, h.id)}
                      className={`
                        block py-2 text-sm leading-snug transition-colors
                        ${h.level === 3 ? "pl-5" : ""}
                        ${
                          isActive
                            ? "text-[#1A9E9E] font-semibold"
                            : "text-slate-700"
                        }
                      `}
                    >
                      {h.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom safe area for iOS */}
          <div className="h-4" />
        </div>
      </div>
    </>
  );
}
