"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
// [fix:gotrue-client-tunggal-v1] pakai client kanonik, jangan bikin instance GoTrue baru
import { supabase } from "@/lib/supabase-client";
import {
  Route,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";


// Brand palette — teal + yellow
const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const YELLOW = "#FFC93C";

export type Segment = "b2c" | "b2b";
type ActiveKey = "dashboard" | "path" | "bahasa" | "sertifikat" | "pengaturan";

type NavItem = { key: ActiveKey; label: string; icon: any; href?: string; soon?: boolean };

const NAV: NavItem[] = [
  { key: "path", label: "Learning Path", icon: Route, soon: true },
  { key: "sertifikat", label: "Sertifikat", icon: Award, soon: true },
  { key: "pengaturan", label: "Pengaturan", icon: Settings, href: "/akun" },
];

export default function LmsShell({
  active,
  children,
}: {
  active: ActiveKey;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");
  const [segment, setSegment] = useState<Segment>("b2c");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let display = "";
      let pic = "";
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (prof) {
          display = prof.full_name || prof.name || prof.first_name || "";
          pic = prof.avatar_url || prof.avatar || "";
        }
      } catch {}
      if (!display) {
        display =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          (user.email ? user.email.split("@")[0] : "Siswa");
      }
      if (!pic) pic = (user.user_metadata?.avatar_url as string) || "";
      setName(display);
      setAvatar(pic);

      const sp =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      if (sp?.get("seg") === "b2b") {
        setSegment("b2b");
        return;
      }
      // TODO(b2b): auto-detect via corporate_class_participants once schema confirmed.
    })();
  }, []);

  const initial = name?.[0]?.toUpperCase() || "S";

  const SidebarInner = (
    <div className="flex h-full flex-col text-white">
      {/* Brand */}
      <a href="/akun" className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <img src="/images/logo-white.png" alt="" className="h-5 w-5 object-contain" />
        </span>
        <span className="text-[15px] font-bold">Linguo</span>
      </a>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          const base =
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition";
          if (item.soon) {
            return (
              <div
                key={item.key}
                className={`${base} cursor-default text-white/35`}
                title="Segera hadir"
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{item.label}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/55">
                  Segera
                </span>
              </div>
            );
          }
          return (
            <a
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`${base} ${
                isActive ? "font-semibold" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
              style={isActive ? { background: YELLOW, color: TEAL_DEEP } : undefined}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Profile + logout */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-full object-cover ring-2"
              style={{ boxShadow: `0 0 0 2px ${YELLOW}` }}
            />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: YELLOW, color: TEAL_DEEP }}
            >
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{name || "Siswa"}</p>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                segment === "b2b" ? "" : "bg-white/15 text-white"
              }`}
              style={segment === "b2b" ? { background: YELLOW, color: TEAL_DEEP } : undefined}
            >
              {segment === "b2b" ? (
                <>
                  <GraduationCap className="h-3 w-3" /> Program Korporat
                </>
              ) : (
                "Akun Pribadi"
              )}
            </span>
          </div>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/akun";
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 hidden w-64 lg:block"
        style={{ background: TEAL_DEEP }}
      >
        {SidebarInner}
      </aside>

      {/* Mobile top bar */}
      <header
        className="sticky top-0 z-40 flex h-14 items-center gap-3 px-4 lg:hidden"
        style={{ background: TEAL_DEEP }}
      >
        <button onClick={() => setOpen(true)} aria-label="Buka menu" className="text-white">
          <Menu className="h-6 w-6" />
        </button>
        <span className="flex items-center gap-2 text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
            <img src="/images/logo-white.png" alt="" className="h-4 w-4 object-contain" />
          </span>
          <span className="font-bold">Linguo</span>
        </span>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl" style={{ background: TEAL_DEEP }}>
            <button
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-4 text-white/70"
            >
              <X className="h-5 w-5" />
            </button>
            {SidebarInner}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
