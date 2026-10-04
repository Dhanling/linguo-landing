"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase, resolveSessionForGate } from "@/lib/supabase-client";
import { useUiLang } from "@/lib/uiLang";
import { SESI_BERAKHIR_EVENT, clearSesiBerakhir, isSesiBerakhir, useSesiIdle } from "@/lib/sesiIdle";

// [akun-sesi-idle-v1] Pop-up "Sesi kamu sudah berakhir" untuk dashboard siswa — desain
// sama dengan dashboard staf (SessionExpiredModal di linguo-admin-dashboard). Muncul di
// atas HALAMAN TERAKHIR yang diburamkan; sesinya baru dikeluarkan saat tombol ditekan,
// lalu siswa dibawa ke layar Masuk dengan ?next= supaya mendarat lagi di halaman yang sama.
export default function SesiBerakhirModal() {
  const pathname = usePathname();
  const lang = useUiLang();
  // null = belum tahu. Timer idle cuma jalan untuk yang benar-benar login (bukan tamu di
  // layar Masuk, bukan staf mode pratinjau yang tak punya sesi siswa).
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let alive = true;
    // getSession() polos bisa menjawab null sesaat — pakai vonis gate yang sabar.
    resolveSessionForGate().then((v) => {
      if (alive) setLoggedIn((cur) => cur ?? !!(v.session || v.user));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setLoggedIn(false);
      else if (session) setLoggedIn(true);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const aktif = loggedIn === true && pathname !== "/akun/logout";
  useSesiIdle({ enabled: aktif });

  useEffect(() => {
    // Sudah keluar (layar Masuk) → penandanya tak perlu lagi, jangan sampai mengunci login berikutnya.
    if (loggedIn === false) { clearSesiBerakhir(); setOpen(false); return; }
    if (!aktif) return;
    setOpen(isSesiBerakhir());
    const show = () => setOpen(true);
    window.addEventListener(SESI_BERAKHIR_EVENT, show);
    return () => window.removeEventListener(SESI_BERAKHIR_EVENT, show);
  }, [loggedIn, aktif]);

  // Fokus dikurung di tombol supaya Tab tidak bisa menjelajah halaman di balik buram.
  useEffect(() => {
    if (!open) return;
    btnRef.current?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      btnRef.current?.focus();
    };
    document.addEventListener("keydown", trap, true);
    return () => document.removeEventListener("keydown", trap, true);
  }, [open]);

  if (!open) return null;

  const close = async () => {
    setBusy(true);
    // Jaringan belum nyambung (laptop baru bangun) → signOut server gagal; keluarkan lokal saja.
    const { error } = await supabase.auth.signOut().catch((err) => ({ error: err }));
    if (error) await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    clearSesiBerakhir();
    // /akun sendiri sudah menampilkan layar Masuk di URL yang sama; halaman lain dititipkan lewat ?next=.
    if (window.location.pathname !== "/akun") {
      window.location.href = `/akun?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    setBusy(false);
    setOpen(false);
  };

  const en = lang === "en";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sesi-berakhir-title"
      className="fixed inset-0 z-[2147483001] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md"
    >
      {/* Tema gelap /akun = kelas lms-dark di <html>; aturannya dibawa sendiri karena
          halaman tanpa StudentShell tidak memuat blok gaya gelapnya. */}
      <style>{`.lms-dark .sesi-berakhir-card{background-color:#1a1d1e !important;}.lms-dark .sesi-berakhir-title{color:#ffffff !important;}.lms-dark .sesi-berakhir-text{color:#e2e8f0 !important;}.lms-dark .sesi-berakhir-btn{background-color:#7fb8bd !important;color:#12181a !important;}.lms-dark .sesi-berakhir-btn:hover{background-color:#94c8cc !important;}`}</style>
      <div className="sesi-berakhir-card w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/session-expired.jpg"
          alt=""
          className="aspect-[3/1] w-full object-cover object-[center_60%]"
        />
        <div className="px-6 pb-6 pt-7 sm:px-8">
          <h2 id="sesi-berakhir-title" className="sesi-berakhir-title text-2xl font-semibold tracking-tight text-slate-900">
            {en ? "Session has expired" : "Sesi kamu sudah berakhir"}
          </h2>
          <p className="sesi-berakhir-text mt-4 text-[15px] leading-relaxed text-slate-600">
            {en
              ? "For your security, you have been signed out after 1 hour of inactivity."
              : "Demi keamanan, kamu otomatis dikeluarkan setelah 1 jam tidak ada aktivitas."}
          </p>
          <p className="sesi-berakhir-text mt-2 text-[15px] leading-relaxed text-slate-600">
            {en
              ? "We are holding your place. Sign back in and pick up right where you left off."
              : "Tenang, halamanmu kami simpan. Masuk lagi dan lanjutkan dari tempat terakhir."}
          </p>
          <div className="mt-8 flex justify-end">
            <button
              ref={btnRef}
              type="button"
              onClick={close}
              disabled={busy}
              className="sesi-berakhir-btn rounded-md bg-[#1A9E9E] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#178888] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9E9E] focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {en ? "Sign back in now" : "Masuk lagi sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
