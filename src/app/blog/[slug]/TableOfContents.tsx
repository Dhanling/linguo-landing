"use client";
import { useEffect, useState, useRef, useCallback } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scan DOM for H2 headings only
  useEffect(() => {
    const container = document.querySelector("[data-article-body]");
    if (!container) return;

    const els = Array.from(container.querySelectorAll("h2"));
    if (els.length < 2) return;

    const items: Heading[] = els.map((el, i) => {
      if (!el.id) el.id = `heading-${i}-${el.textContent?.slice(0, 20).replace(/\s+/g, "-").toLowerCase() ?? i}`;
      return { id: el.id, text: el.textContent?.trim() ?? "", level: 2 };
    });

    setHeadings(items);
    if (items.length > 0) setActiveId(items[0].id);
  }, []);

  // Scroll progress + active heading tracker
  const handleScroll = useCallback(() => {
    const article = document.querySelector("[data-article-body]") as HTMLElement | null;
    if (!article) return;

    const rect = article.getBoundingClientRect();
    const total = article.offsetHeight;
    const scrolled = Math.max(0, -rect.top);
    setProgress(Math.min(100, (scrolled / total) * 100));

    // Find active heading
    let current = "";
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) {
        const top = el.getBoundingClientRect().top;
        if (top <= 120) current = h.id;
      }
    }
    if (current) setActiveId(current);
  }, [headings]);

  useEffect(() => {
    if (headings.length === 0) return;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings, handleScroll]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: "smooth" });
    setOpen(false);
  };

  if (headings.length < 2) return null;

  const activeIndex = headings.findIndex((h) => h.id === activeId);

  return (
    <>
      {/* ── Desktop: fixed left sidebar ─────────────────────────── */}
      <aside className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col items-start w-56 max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-5 h-5 rounded-full bg-[#1A9E9E] flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 2h8M1 5h5M1 8h7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daftar Isi</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-slate-100 rounded-full mb-4 mx-1 overflow-hidden">
          <div
            className="h-full bg-[#1A9E9E] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Timeline */}
        <div className="relative w-full overflow-y-auto pr-1" style={{ maxHeight: "calc(70vh - 80px)" }}>
          {/* Vertical track */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-100" />
          {/* Active fill */}
          <div
            className="absolute left-[9px] top-2 w-px bg-[#1A9E9E] transition-all duration-500 ease-out origin-top"
            style={{
              height: activeIndex >= 0
                ? `${((activeIndex) / Math.max(headings.length - 1, 1)) * 100}%`
                : "0%",
            }}
          />

          <ul className="space-y-1">
            {headings.map((h, i) => {
              const isActive = h.id === activeId;
              const isPast = i < activeIndex;
              return (
                <li key={h.id}>
                  <button
                    onClick={() => scrollTo(h.id)}
                    className={`group w-full flex items-start gap-3 py-1.5 text-left transition-all duration-200 rounded-lg px-1 hover:bg-slate-50 ${
                      isActive ? "opacity-100" : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    {/* Milestone dot */}
                    <span className="relative flex-shrink-0 mt-0.5">
                      <span
                        className={`block w-[9px] h-[9px] rounded-full border-2 transition-all duration-300 ${
                          isActive
                            ? "border-[#1A9E9E] bg-[#1A9E9E] scale-[1.4] shadow-[0_0_0_3px_rgba(26,158,158,0.15)]"
                            : isPast
                            ? "border-[#1A9E9E] bg-[#1A9E9E]"
                            : "border-slate-300 bg-white"
                        }`}
                      />
                    </span>

                    {/* Label */}
                    <span
                      className={`text-xs leading-snug font-medium transition-colors duration-200 line-clamp-2 ${
                        isActive ? "text-[#1A9E9E]" : "text-slate-500 group-hover:text-slate-700"
                      }`}
                    >
                      {h.text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* ── Mobile: floating pill button ────────────────────────── */}
      <div className="xl:hidden fixed bottom-20 left-4 z-40">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 bg-white border border-slate-200 shadow-lg rounded-full px-3 py-2 text-xs font-semibold text-slate-600 hover:border-[#1A9E9E] hover:text-[#1A9E9E] transition-all active:scale-95"
          aria-label="Daftar Isi"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3h10M2 7h6M2 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Isi
        </button>

        {/* Drawer */}
        {open && (
          <div className="absolute bottom-12 left-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Daftar Isi</p>
            <ul className="space-y-0.5">
              {headings.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => scrollTo(h.id)}
                    className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors ${
                      h.id === activeId
                        ? "bg-[#1A9E9E]/10 text-[#1A9E9E] font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
