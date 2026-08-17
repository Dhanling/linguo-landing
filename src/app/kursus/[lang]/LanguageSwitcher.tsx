"use client";

// [kursus-language-switcher-v1] Pemilih bahasa di hero landing /kursus/bahasa-*.
//
// Sebelumnya satu-satunya jalan pindah bahasa dari halaman detail adalah lewat
// breadcrumb → /kursus → cari lagi di daftar. Tiga klik untuk hal yang paling
// sering dilakukan pengunjung: "ini Korea, saya sebenarnya cari Jepang".
//
// Pilnya sendiri (bendera + nama asli bahasa) sudah ada di hero sejak awal dan
// ukurannya dipertahankan persis — dia cuma berubah jadi tombol, supaya tata
// letak hero yang jatah barisnya sudah dipatok tidak bergeser sedikit pun.
//
// Daftar bahasanya dioper dari server sebagai prop, BUKAN diimpor di sini:
// src/data/languages-detail.ts itu 7.000+ baris konten landing, dan mengimpornya
// di komponen client akan menyeret semuanya ke bundle browser.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { LangSlugFlag } from "../../../components/RectFlag";

export type LangOption = {
  /** slug URL Indonesia, dipakai di /kursus/bahasa-{urlSlug} */
  urlSlug: string;
  /** slug kurikulum, dipakai untuk lookup bendera */
  languageSlug: string;
  /** nama Indonesia, misal "Korea" */
  name: string;
  /** nama asli, misal "한국어" */
  nativeName: string;
  region: string;
};

const REGION_LABEL: Record<string, string> = {
  asian: "Asia",
  european: "Eropa",
  "middle-eastern": "Timur Tengah",
  nusantara: "Nusantara",
  other: "Lainnya",
};

const REGION_ORDER = ["asian", "european", "middle-eastern", "nusantara", "other"];

/** Buang diakritik & huruf besar, supaya "Espanol" tetap ketemu "Español". */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function LanguageSwitcher({
  options,
  currentSlug,
  currentNativeName,
}: {
  options: LangOption[];
  /** urlSlug bahasa yang sedang dibuka */
  currentSlug: string;
  currentNativeName: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Esc menutup, dan scroll body dikunci selama dialog terbuka — tanpa ini
  // halaman di belakang ikut bergulir saat daftar bahasanya di-scroll di HP.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Fokus pindah ke kolom cari saat dibuka, dan balik ke tombol saat ditutup —
  // kalau tidak, pengguna keyboard tertinggal di awal dokumen.
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else triggerRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const groups = useMemo(() => {
    const q = normalize(query.trim());
    const hits = q
      ? options.filter(
          (o) =>
            normalize(o.name).includes(q) ||
            normalize(o.nativeName).includes(q) ||
            normalize(o.urlSlug).includes(q),
        )
      : options;

    const byRegion = new Map<string, LangOption[]>();
    for (const o of hits) {
      const key = REGION_ORDER.includes(o.region) ? o.region : "other";
      const list = byRegion.get(key);
      if (list) list.push(o);
      else byRegion.set(key, [o]);
    }
    return REGION_ORDER.filter((r) => byRegion.has(r)).map((r) => ({
      region: r,
      label: REGION_LABEL[r] ?? "Lainnya",
      items: (byRegion.get(r) ?? []).sort((a, b) => a.name.localeCompare(b.name, "id")),
    }));
  }, [options, query]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <LangSlugFlag slug={optionSlugOf(options, currentSlug)} h={18} />
        <span className="text-white/90">{currentNativeName}</span>
        <span aria-hidden className="h-4 w-px bg-white/30" />
        <span className="flex items-center gap-1 text-white/80">
          Ganti bahasa
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </span>
      </button>

      {/* Portal ke <body>: hero-nya `overflow-hidden`, dan panel yang dirender
          di dalamnya bisa terpotong di sebagian browser. */}
      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Pilih bahasa"
            >
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />

              <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[80vh] sm:rounded-2xl">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Pilih bahasa</h2>
                    <p className="text-xs text-slate-500">
                      {options.length} bahasa punya halaman kursusnya sendiri
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Tutup"
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>

                <div className="border-b border-slate-100 px-5 py-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-[#1A9E9E] focus-within:bg-white">
                    <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      type="search"
                      placeholder="Cari bahasa — Jepang, 한국어, Deutsch…"
                      aria-label="Cari bahasa"
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                  {total === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-sm text-slate-600">
                        Bahasa <b className="text-slate-900">{query.trim()}</b> belum punya
                        halaman sendiri.
                      </p>
                      <Link
                        href="/kursus"
                        className="mt-3 inline-block text-sm font-semibold text-[#1A9E9E] hover:underline"
                      >
                        Lihat semua bahasa yang tersedia →
                      </Link>
                    </div>
                  ) : (
                    groups.map((g) => (
                      <div key={g.region} className="mb-5 last:mb-0">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          {g.label}
                        </p>
                        <ul className="grid gap-1.5 sm:grid-cols-2">
                          {g.items.map((o) => {
                            const aktif = o.urlSlug === currentSlug;
                            return (
                              <li key={o.urlSlug}>
                                <Link
                                  href={`/kursus/bahasa-${o.urlSlug}`}
                                  onClick={() => setOpen(false)}
                                  aria-current={aktif ? "page" : undefined}
                                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                                    aktif
                                      ? "bg-[#1A9E9E]/10 text-[#0e6e6e]"
                                      : "text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <LangSlugFlag slug={o.languageSlug} h={18} />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold">
                                      Bahasa {o.name}
                                    </span>
                                    <span className="block truncate text-xs text-slate-500">
                                      {o.nativeName}
                                    </span>
                                  </span>
                                  {aktif ? (
                                    <Check className="h-4 w-4 shrink-0 text-[#1A9E9E]" aria-hidden />
                                  ) : null}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 px-5 py-3 text-center">
                  <Link
                    href="/kursus"
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-[#1A9E9E] hover:underline"
                  >
                    Lihat semua kursus bahasa →
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** Bendera pil hero ikut bahasa yang sedang dibuka. */
function optionSlugOf(options: LangOption[], urlSlug: string): string {
  return options.find((o) => o.urlSlug === urlSlug)?.languageSlug ?? urlSlug;
}
