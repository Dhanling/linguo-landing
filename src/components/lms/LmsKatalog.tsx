"use client";

// [linguo-patch:lms-katalog-masterdetail-v2]
// Belajar Mandiri jadi 2-partisi (master-detail) nyamain frame "Kelas Live":
// KIRI = daftar bahasa self-study yg ke-seed di lms_modules (chip Semua/Berjalan/Selesai)
// KANAN = detail bahasa kepilih (hero foto + progress + resume) + SilabusOutline (selfpaced)

import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, PlayCircle, GraduationCap, Lock, Crown, ArrowRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import SilabusOutline from "@/components/akun/SilabusOutline";
import { isFreeLevel } from "@/lib/lmsAccess"; // [linguo-patch:lms-katalog-upgrade-cta-v1] sumber tunggal aturan A1-gratis

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TEAL = "#16796E";
const TEAL_DEEP = "#0F5A52";
const YELLOW = "#F2CB05";

// native name + label ID + glyph per bahasa (fallback ke generic kalau ga ada)
const META: Record<string, { native: string; id: string; glyph: string }> = {
  vietnamese: { native: "Tiếng Việt", id: "Bahasa Vietnam", glyph: "Vi" },
  english:    { native: "English",     id: "Bahasa Inggris", glyph: "EN" },
  japanese:   { native: "日本語",       id: "Bahasa Jepang",  glyph: "あ" },
  korean:     { native: "한국어",       id: "Bahasa Korea",   glyph: "한" },
  mandarin:   { native: "中文",         id: "Bahasa Mandarin", glyph: "中" },
  arabic:     { native: "العربية",      id: "Bahasa Arab",    glyph: "ع" },
  russian:    { native: "Русский",      id: "Bahasa Rusia",   glyph: "Я" },
  german:     { native: "Deutsch",      id: "Bahasa Jerman",  glyph: "DE" },
  french:     { native: "Français",     id: "Bahasa Prancis", glyph: "FR" },
  spanish:    { native: "Español",      id: "Bahasa Spanyol", glyph: "ES" },
};

function meta(language: string) {
  const slug = language.toLowerCase().replace(/\s+/g, "-");
  const m = META[slug];
  return {
    slug,
    native: m?.native || language,
    id: m?.id || `Bahasa ${language}`,
    glyph: m?.glyph || language.slice(0, 2).toUpperCase(),
  };
}

type Course = {
  language: string;
  slug: string;
  native: string;
  idLabel: string;
  glyph: string;
  total: number;
  done: number;
  pct: number;
  resume: { id: string; title: string } | null;
  // [linguo-patch:lms-katalog-entitlement-v1] true = sudah dibeli (akses penuh A1–B2); false = gratis A1 doang
  owned: boolean;
  // [linguo-patch:lms-katalog-upgrade-cta-v1] lesson terkunci pertama (A2+) buat deep-link ke panel checkout; null kalau owned / cuma ada A1
  upgrade: string | null;
};

// [linguo-patch:lms-katalog-perf-v1] cache modul-level → switch balik ke Belajar Mandiri = instan (stale-while-revalidate, ga refetch dari nol)
let _lmsCache: { courses: Course[] } | null = null;

function buildCourses(
  modList: { id: string; language: string; sort_order: number; course_id: string | null; cefr_label: string | null }[],
  lessons: { id: string; module_id: string; title: string; sort_order: number; is_preview: boolean }[],
  done: Set<string>,
  ownedCourses: Set<string> // [linguo-patch:lms-katalog-entitlement-v1] course_id yg sudah dientitle
): Course[] {
  const langByModule: Record<string, string> = {};
  modList.forEach((m) => { langByModule[m.id] = m.language; });
  const moduleOrder: Record<string, number> = {};
  modList.forEach((m, i) => { moduleOrder[m.id] = m.sort_order ?? i; });
  // [linguo-patch:lms-katalog-upgrade-cta-v1] cefr per modul → tahu lesson mana yg A2+ (terkunci kalau belum dibeli)
  const cefrByModule: Record<string, string | null> = {};
  modList.forEach((m) => { cefrByModule[m.id] = m.cefr_label; });
  // [linguo-patch:lms-katalog-entitlement-v1] bahasa = owned kalau salah satu course_id-nya dientitle
  const ownedByLang: Record<string, boolean> = {};
  modList.forEach((m) => {
    if (m.course_id && ownedCourses.has(m.course_id)) ownedByLang[m.language] = true;
  });
  const byLang: Record<string, { id: string; module_id: string; sort_order: number; title: string; is_preview: boolean }[]> = {};
  lessons.forEach((l) => {
    const lang = langByModule[l.module_id];
    if (!lang) return;
    (byLang[lang] = byLang[lang] || []).push(l);
  });
  const langOrder: string[] = [];
  modList.forEach((m) => { if (!langOrder.includes(m.language)) langOrder.push(m.language); });
  return langOrder.map((language) => {
    const mt = meta(language);
    const ls = (byLang[language] || []).slice().sort((a, b) => {
      const mo = (moduleOrder[a.module_id] ?? 0) - (moduleOrder[b.module_id] ?? 0);
      return mo !== 0 ? mo : a.sort_order - b.sort_order;
    });
    const total = ls.length;
    const dcount = ls.filter((l) => done.has(l.id)).length;
    const next = ls.find((l) => !done.has(l.id));
    const owned = !!ownedByLang[language];
    // [linguo-patch:lms-katalog-upgrade-cta-v1] target upgrade = lesson terkunci pertama (level A2+, bukan preview).
    // Sama aturannya dgn LessonPlayer (isFreeLevel). Dipakai cuma kalau belum owned & emang ada konten berbayar.
    const upgrade = owned
      ? null
      : ls.find((l) => !isFreeLevel(cefrByModule[l.module_id]) && !l.is_preview)?.id ?? null;
    return {
      language,
      slug: mt.slug,
      native: mt.native,
      idLabel: mt.id,
      glyph: mt.glyph,
      total,
      done: dcount,
      pct: total ? Math.round((dcount / total) * 100) : 0,
      resume: next ? { id: next.id, title: next.title } : null,
      owned,
      upgrade,
    };
  });
}

export default function LmsKatalog({ onOpen, topBar }: { onOpen?: (lessonId: string) => void; topBar?: ReactNode }) {
  const [loading, setLoading] = useState(() => !_lmsCache);
  const [courses, setCourses] = useState<Course[]>(() => _lmsCache?.courses || []);
  const [sel, setSel] = useState<string>(() => _lmsCache?.courses[0]?.slug || ""); // selected slug
  const [filter, setFilter] = useState<"all" | "owned" | "run" | "done">("all");
  // [linguo-patch:lms-katalog-sidebar-collapse-v1] sidebar "Bahasa Kamu" bisa dilipat biar area materi lega
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      // [linguo-patch:lms-katalog-perf-v1] getSession() baca session lokal (no network round-trip kaya getUser)
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;

      // module (id -> language) + urutan + course_id (buat cek entitlement)
      const { data: mods } = await supabase
        .from("lms_modules")
        .select("id,language,sort_order,course_id,cefr_label")
        .order("sort_order");
      const modList = (mods || []) as { id: string; language: string; sort_order: number; course_id: string | null; cefr_label: string | null }[];
      if (modList.length === 0) {
        _lmsCache = { courses: [] };
        if (alive) { setCourses([]); setLoading(false); }
        return;
      }
      const moduleIds = modList.map((m) => m.id);

      // lessons + progress PARALEL (sebelumnya 2x sequential await)
      const [lessRes, progRes] = await Promise.all([
        supabase.from("lms_lessons").select("id,module_id,title,sort_order,is_preview").in("module_id", moduleIds).order("sort_order"),
        uid
          ? supabase.from("lms_progress").select("lesson_id,status").eq("user_id", uid)
          : Promise.resolve({ data: [] as { lesson_id: string; status: string }[] }),
      ]);
      const lessons = (lessRes.data || []) as { id: string; module_id: string; title: string; sort_order: number; is_preview: boolean }[];
      const done = new Set<string>(
        ((progRes.data as any[]) || []).filter((p: any) => p.status === "completed").map((p: any) => p.lesson_id)
      );

      // [linguo-patch:lms-katalog-entitlement-v1] cek kepemilikan per course (paralel), sama RPC yg dipakai LessonPlayer
      const courseIds = Array.from(new Set(modList.map((m) => m.course_id).filter((c): c is string => !!c)));
      const ownedCourses = new Set<string>();
      if (uid && courseIds.length) {
        const ents = await Promise.all(
          courseIds.map(async (cid): Promise<{ cid: string; ok: boolean }> => {
            try {
              const { data } = await supabase.rpc("lms_is_entitled", { p_course_id: cid });
              return { cid, ok: !!data };
            } catch {
              return { cid, ok: false };
            }
          })
        );
        ents.forEach(({ cid, ok }) => { if (ok) ownedCourses.add(cid); });
      }

      // [linguo-patch:lms-katalog-owned-only-v1] cuma tampilin bahasa yang SUDAH dibeli/dientitle.
      // Siswa yang ga daftar bahasa tsb ga lihat sama sekali (mis. Vietnam) — baru muncul setelah beli.
      const built = buildCourses(modList, lessons, done, ownedCourses).filter((c) => c.owned);
      _lmsCache = { courses: built }; // simpen buat re-entry instan
      if (!alive) return;
      setCourses(built);
      setSel((s) => s || built[0]?.slug || "");
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // [linguo-patch:lms-katalog-frame-fallback-v1] loading & empty state WAJIB tetep pakai frame
  // master-detail (sidebar + topBar). Kalau ngga, klik "Belajar Mandiri" pas belum ada paket
  // mandiri = tab "Kelas Live" & sidebar ilang → user ke-trap, ga bisa balik.
  const Frame = ({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) => (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)] lg:grid lg:grid-rows-1 lg:grid-cols-[320px_minmax(0,1fr)] lg:min-h-0 lg:flex-1 lg:rounded-none lg:border-0 lg:shadow-none">
      <aside className="hidden min-h-0 flex-col border-r border-slate-100 bg-white lg:flex">{sidebar}</aside>
      <main className="flex min-w-0 flex-col bg-[#F5F6F8] lg:min-h-0 lg:overflow-y-auto">
        {topBar}
        {children}
      </main>
    </div>
  );

  if (loading) {
    return (
      <Frame sidebar={(
        <div className="shrink-0 px-6 pb-4 pt-7">
          <h2 className="text-[18px] font-extrabold text-[#12172B]">Bahasa Kamu</h2>
          <p className="mt-0.5 text-[12px] font-medium text-gray-500">Memuat…</p>
        </div>
      )}>
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      </Frame>
    );
  }

  if (courses.length === 0) {
    return (
      <Frame sidebar={(
        <div className="shrink-0 px-6 pb-4 pt-7">
          <h2 className="text-[18px] font-extrabold text-[#12172B]">Bahasa Kamu</h2>
          <p className="mt-0.5 text-[12px] font-medium text-gray-500">0 bahasa · belajar mandiri</p>
        </div>
      )}>
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-8 text-center">
          <GraduationCap className="mx-auto mb-2 h-12 w-12 text-slate-300" strokeWidth={1.5} />
          <p className="text-[14px] font-semibold text-gray-600">Belum ada materi mandiri kamu</p>
          <p className="mt-1 max-w-sm text-[12px] font-medium text-gray-400">Kamu belum punya paket Belajar Mandiri. Daftar dulu bahasanya biar materinya muncul di sini.</p>
        </div>
      </Frame>
    );
  }

  const shown = courses.filter((c) => {
    if (filter === "owned") return c.owned;
    if (filter === "run") return c.pct < 100;
    if (filter === "done") return c.pct >= 100;
    return true;
  });
  const selected = shown.find((c) => c.slug === sel) || shown[0] || courses[0];

  const CourseItem = ({ c, mobile }: { c: Course; mobile?: boolean }) => {
    const isSel = selected && c.slug === selected.slug;
    return (
      <button
        onClick={() => setSel(c.slug)}
        className={`group flex items-center gap-3 rounded-2xl p-3 text-left transition ${isSel ? "bg-white shadow-[0_16px_36px_-22px_rgba(18,23,43,0.55)] ring-2 ring-[#16796E]" : "hover:bg-[#F5F6F8]"} ${mobile ? "w-[240px] shrink-0 border border-slate-100 bg-white" : "w-full"}`}
      >
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#16796E]/10 text-xl font-extrabold text-[#16796E]">
          {c.glyph}
          {/* [linguo-patch:lms-katalog-entitlement-v1] mahkota = sudah dibeli, gembok = gratis A1 doang */}
          {c.owned ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F2CB05] ring-2 ring-white" title="Akses penuh">
              <Crown className="h-3 w-3" style={{ color: TEAL_DEEP }} strokeWidth={2.5} />
            </span>
          ) : (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 ring-2 ring-white" title="Gratis A1 · A2–B2 terkunci">
              <Lock className="h-2.5 w-2.5 text-slate-500" strokeWidth={2.5} />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-extrabold text-[#12172B]">{c.native}</span>
          <span className="block truncate text-[12px] font-medium text-gray-500">{c.owned ? "Akses penuh · self-paced" : "Gratis A1 · self-paced"}</span>
          <span className="mt-2 flex items-center gap-2">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8EAEE]"><span className="block h-full rounded-full bg-[#16796E]" style={{ width: `${c.pct}%` }} /></span>
            <span className="text-[11px] font-bold text-gray-500">{c.pct}%</span>
          </span>
        </span>
      </button>
    );
  };

  const startLabel = selected.done === 0 ? "Mulai belajar" : "Lanjutkan";
  const photo = `/lang/${selected.slug}.jpg`;

  const ResumeBtn = ({ block }: { block?: boolean }) =>
    selected.resume ? (
      onOpen ? (
        <button
          onClick={() => onOpen(selected.resume!.id)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold ${block ? "w-full" : ""}`}
          style={{ background: YELLOW, color: TEAL_DEEP }}
        >
          <PlayCircle className="h-4 w-4" />
          {startLabel}
        </button>
      ) : (
        <a
          href={`/akun/belajar/${selected.resume.id}`}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold ${block ? "w-full" : ""}`}
          style={{ background: YELLOW, color: TEAL_DEEP }}
        >
          <PlayCircle className="h-4 w-4" />
          {startLabel}
        </a>
      )
    ) : null;

  // [linguo-patch:lms-katalog-upgrade-cta-v1] CTA buka akses penuh utk bahasa belum dibeli.
  // Deep-link ke lesson terkunci pertama → panel checkout UnlockFullAccess di player muncul (nol kode bayar baru).
  const UpgradeBtn = ({ block }: { block?: boolean }) =>
    !selected.owned && selected.upgrade ? (
      onOpen ? (
        <button
          onClick={() => onOpen(selected.upgrade!)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#16796E]/25 px-4 py-2.5 text-[13px] font-bold text-[#16796E] transition hover:bg-[#16796E]/5 ${block ? "w-full" : ""}`}
        >
          <Crown className="h-4 w-4" />
          Buka akses penuh
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <a
          href={`/akun/belajar/${selected.upgrade}`}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#16796E]/25 px-4 py-2.5 text-[13px] font-bold text-[#16796E] transition hover:bg-[#16796E]/5 ${block ? "w-full" : ""}`}
        >
          <Crown className="h-4 w-4" />
          Buka akses penuh
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      )
    ) : null;

  return (
    <div className={`overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)] lg:grid lg:grid-rows-1 lg:min-h-0 lg:flex-1 lg:rounded-none lg:border-0 lg:shadow-none ${sidebarOpen ? "lg:grid-cols-[320px_minmax(0,1fr)]" : "lg:grid-cols-[56px_minmax(0,1fr)]"}`}>

      {/* LEFT list — desktop [linguo-patch:lms-katalog-sidebar-collapse-v1] bisa dilipat */}
      {sidebarOpen ? (
        <aside className="hidden min-h-0 flex-col border-r border-slate-100 bg-white lg:flex">
          <div className="shrink-0 px-6 pb-4 pt-7">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#12172B]">Bahasa Kamu</h2>
                <p className="mt-0.5 text-[12px] font-medium text-gray-500">{courses.length} bahasa · belajar mandiri</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Lipat panel Bahasa Kamu"
                title="Lipat panel"
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F5F6F8] text-gray-500 transition hover:bg-[#16796E]/10 hover:text-[#16796E]"
              >
                <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              {([["all", "Semua"], ["run", "Berjalan"], ["done", "Selesai"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setFilter(k)} className={`h-8 rounded-full px-3 text-[12px] font-bold transition ${filter === k ? "bg-[#16796E] text-white" : "bg-[#F5F6F8] text-gray-500 hover:text-[#12172B]"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 overflow-y-auto px-4 pb-6">
            {shown.length > 0 ? shown.map((c) => <CourseItem key={c.slug} c={c} />) : (
              <p className="px-2 py-6 text-center text-[13px] font-medium text-gray-400">Tidak ada bahasa di filter ini</p>
            )}
          </div>
        </aside>
      ) : (
        /* rail tipis pas dilipat — tombol buka lagi */
        <aside className="hidden min-h-0 flex-col items-center border-r border-slate-100 bg-white pt-7 lg:flex">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka panel Bahasa Kamu"
            title="Buka panel Bahasa Kamu"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F6F8] text-gray-500 transition hover:bg-[#16796E]/10 hover:text-[#16796E]"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </aside>
      )}

      {/* RIGHT detail (+ mobile pills) */}
      <main className="flex min-w-0 flex-col bg-[#F5F6F8] lg:min-h-0 lg:overflow-y-auto">
        {topBar}
        <div className="flex gap-2.5 overflow-x-auto px-5 pt-3 lg:hidden">
          {shown.map((c) => <CourseItem key={c.slug} c={c} mobile />)}
        </div>

        <div className="flex flex-col gap-6 px-5 pb-5 pt-4 lg:px-7 lg:pb-7">
          {/* hero */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_50px_-34px_rgba(18,23,43,0.5)]">
            <div className="relative flex items-center gap-5 overflow-hidden px-6 py-6 sm:px-7" style={{ background: TEAL }}>
              <img src={photo} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(15,71,65,0.88) 0%, rgba(22,121,110,0.66) 46%, rgba(22,121,110,0.28) 100%)" }} />
              <span className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-[40px] font-extrabold leading-none text-white">{selected.glyph}</span>
              <div className="relative z-10 min-w-0 flex-1 text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">Belajar Mandiri</span>
                <h2 className="mt-2 text-[22px] font-extrabold leading-tight">{selected.native}</h2>
                <p className="mt-1 text-[13px] font-medium text-white/85">{selected.idLabel} · CEFR A1–B2</p>
              </div>
              <div className="relative z-10 ml-2 hidden shrink-0 sm:block">
                <ResumeBtn />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 px-6 py-5 sm:px-7">
              <div>
                <p className="text-[12px] font-semibold text-gray-500">Progress</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8EAEE]"><span className="block h-full rounded-full bg-[#16796E]" style={{ width: `${selected.pct}%` }} /></span>
                  <span className="text-[13px] font-extrabold text-[#12172B]">{selected.pct}%</span>
                </div>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-[12px] font-semibold text-gray-500">Sesi Selesai</p>
                <p className="mt-1 text-[18px] font-extrabold text-[#12172B]">{selected.done}<span className="text-[14px] font-bold text-gray-400">/{selected.total}</span></p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-[12px] font-semibold text-gray-500">Akses</p>
                {/* [linguo-patch:lms-katalog-entitlement-v1] jujur soal kepemilikan — jgn klaim "selamanya" utk bahasa yg belum dibeli */}
                {selected.owned ? (
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-bold leading-tight text-[#12172B]">
                    <Crown className="h-3.5 w-3.5" style={{ color: YELLOW }} strokeWidth={2.5} />
                    Selamanya · kapan aja
                  </p>
                ) : (
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-bold leading-tight text-[#12172B]">
                    <Lock className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />
                    Gratis A1 · A2–B2 terkunci
                  </p>
                )}
              </div>
            </div>
            {/* [linguo-patch:lms-katalog-upgrade-cta-v1] strip upsell — cuma muncul utk bahasa belum dibeli yg punya konten A2+ */}
            {!selected.owned && selected.upgrade && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <p className="text-[12.5px] font-medium leading-snug text-gray-500">
                  Kamu lagi pakai versi gratis (level A1). Buka <span className="font-bold text-[#12172B]">A2–B2</span> buat lanjut sampai mahir.
                </p>
                <div className="shrink-0">
                  <UpgradeBtn />
                </div>
              </div>
            )}
            {/* resume — mobile (banner btn ke-hide di < sm) */}
            <div className="px-6 pb-5 sm:hidden">
              <ResumeBtn block />
            </div>
          </div>

          {/* roadmap penuh — renderer sama persis kayak Kelas Live (DRY) */}
          <SilabusOutline
            slug={selected.slug}
            languageLabel={selected.language}
            currentLevel="A1"
            mode="selfpaced"
            onOpen={onOpen}
          />
        </div>
      </main>
    </div>
  );
}
