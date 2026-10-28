"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Languages, Search, X } from "lucide-react";
import { languages, displayLangTitle } from "@/data/curriculum/languages";
import { PLACEMENT_LANGUAGE_SLUGS } from "@/data/placementLanguages";
import { LangSlugFlag } from "@/components/RectFlag";

const available = languages.filter(language => language.available)
  .sort((a, b) => a.name.localeCompare(b.name, "id"));
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");

export default function LanguageSwitcher({ currentSlug, destination = "silabus" }: { currentSlug: string; destination?: "silabus" | "placement" }) {
  const placement = destination === "placement";
  const title = placement ? "Pilih bahasa" : "Ganti bahasa";
  const titleId = placement ? "placement-language-title" : "silabus-language-title";
  const [accountQuery, setAccountQuery] = useState("");
  const choices = useMemo(() => placement ? languages.filter(language => PLACEMENT_LANGUAGE_SLUGS.has(language.slug))
    .sort((a, b) => a.name.localeCompare(b.name, "id")) : available, [placement]);
  useEffect(() => {
    if (!placement) return;
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("sid");
    if (params.get("ref") === "akun" && sid) {
      setAccountQuery("?" + new URLSearchParams({ ref: "akun", sid }).toString());
    }
  }, [placement]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const search = normalize(query);
    return choices.filter(language => normalize([
      displayLangTitle(language), language.nativeName, language.slug, ...(language.aliases || []),
    ].join(" ")).includes(search));
  }, [query, choices]);

  // Dialog native menangani fokus, tombol Escape, dan interaksi latar belakang.
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    searchInput.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return <>
    <button type="button" aria-haspopup="dialog" aria-expanded={open}
      onClick={() => { setQuery(""); setOpen(true); }}
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-[#1A9E9E]/30 hover:bg-[#ECF9F7] hover:text-[#1A9E9E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A9E9E] md:mb-7">
      <Languages size={17} />{placement ? "Ganti / pilih bahasa" : "Ganti bahasa"}<ChevronDown size={15} />
    </button>
    <dialog ref={dialog} aria-labelledby={titleId} onClose={() => setOpen(false)}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); } }}
      onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-2xl overflow-hidden rounded-[28px] border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm">
      {open && <div className="flex max-h-[85dvh] flex-col">
        <div className="shrink-0 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h2 id={titleId} className="text-xl font-bold">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{placement ? "Pilih bahasa untuk placement test." : "Pilih bahasa untuk melihat silabusnya."}</p></div>
            <button type="button" aria-label="Tutup pilihan bahasa" onClick={() => setOpen(false)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-[#1A9E9E]"><X size={19} /></button>
          </div>
          <div className="relative mt-4">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input ref={searchInput} type="search" aria-label="Cari bahasa" placeholder="Cari bahasa…" value={query} onChange={event => setQuery(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-[#F3F8F9] pl-11 pr-4 text-sm outline-none focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/15" />
          </div>
          <p aria-live="polite" className="mt-2 text-xs text-slate-400">{results.length} bahasa</p>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {results.length ? <ul className="grid gap-1.5 sm:grid-cols-2">
            {results.map(language => {
              const current = language.slug === currentSlug;
              return <li key={language.slug}><Link href={`/silabus/${language.slug}${placement ? "/coba" + accountQuery : ""}`} prefetch={false} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)}
                className={`flex min-h-20 items-center gap-3 rounded-2xl border px-3 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-[#1A9E9E] ${current ? "border-[#1A9E9E]/20 bg-[#ECF9F7]" : "border-transparent hover:bg-[#F3F8F9]"}`}>
                <span className="grid h-11 w-12 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-slate-100"><LangSlugFlag slug={language.slug} h={28} className="!rounded-lg" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{language.name}</span><span className="mt-0.5 block text-xs text-slate-500">{language.nativeName}</span></span>
                {current && <Check size={18} aria-label="Bahasa saat ini" className="shrink-0 text-[#1A9E9E]" />}
              </Link></li>;
            })}
          </ul> : <div className="px-4 py-12 text-center"><Languages className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold">Bahasa tidak ditemukan</p><p className="mt-1 text-xs text-slate-500">Coba nama bahasa atau ejaan lain.</p></div>}
        </div>
      </div>}
    </dialog>
  </>;
}
