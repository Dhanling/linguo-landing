"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

function deleteCookie(name: string) {
  document.cookie = name + "=;path=/;max-age=0";
}

function parsePlacementIntent(): { lang: string; langFull: string; level: string; source: string } | null {
  try {
    const raw = getCookie("linguo_placement_intent");
    if (!raw) return null;
    deleteCookie("linguo_placement_intent");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading"|"success"|"error">("loading");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const handle = async () => {
      try {
        // Read funnel data from cookie (set before OAuth redirect)
        let funnelData = { program: "", language: "", level: "" };
        const raw = getCookie("linguo_funnel");
        if (raw) {
          try { funnelData = JSON.parse(raw); } catch {}
          deleteCookie("linguo_funnel");
        }

        // Give Supabase a moment to process the hash (implicit flow)
        await new Promise(r => setTimeout(r, 600));

        const { data: { session } } = await supabase.auth.getSession();

        const processUser = async (user: any) => {
          const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
          const email = user.email || "";
          setUserName(name);

          // Save lead / funnel data — fire and forget, don't block redirect
          if (funnelData.program || funnelData.language) {
            fetch("/api/save-lead", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, program: funnelData.program || undefined, language: funnelData.language || undefined, level: funnelData.level || undefined }),
            }).catch(e => console.warn("Lead save (non-fatal):", e));
          }

          setStatus("success");

          // Cek apakah ada placement intent → redirect ke wizard, bukan /akun
          const placementIntent = parsePlacementIntent();
          const redirectTarget = placementIntent
            ? "/?lang=" + encodeURIComponent(placementIntent.langFull)
              + "&level=" + encodeURIComponent(placementIntent.level)
              + "&from=" + encodeURIComponent(placementIntent.source)
              + "&openFunnel=1"
            : "/akun";

          setTimeout(() => {
            window.location.href = redirectTarget;
          }, 1800);
        };

        if (session?.user) {
          await processUser(session.user);
          return;
        }

        // Wait for auth state change (e.g. implicit flow with hash)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
          if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && sess?.user) {
            subscription.unsubscribe();
            await processUser(sess.user);
          }
        });

        // Timeout fallback — 8 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          if (status === "loading") setStatus("error");
        }, 8000);

      } catch(e) {
        console.error("Callback error:", e);
        setStatus("error");
      }
    };

    handle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center" style={{fontFamily:"Poppins,sans-serif"}}>
      <div className="max-w-md mx-auto px-6 text-center">

        {status === "loading" && (
          <div>
            <div className="h-16 w-16 border-4 border-[#1A9E9E] border-t-transparent rounded-full animate-spin mx-auto mb-6"/>
            <h2 className="text-xl font-bold mb-2">Memproses login...</h2>
            <p className="text-sm text-slate-500">Mohon tunggu sebentar</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Selamat datang, {userName}! 👋</h2>
            <p className="text-slate-500 text-sm mb-6">Login berhasil! Mengarahkan ke dashboard...</p>
            <div className="flex flex-col gap-3 items-center">
              <a href="/akun"
                className="inline-block bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold px-8 py-4 rounded-full text-sm transition-all active:scale-95 shadow-lg">
                Masuk ke Dashboard →
              </a>
              <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                atau kembali ke beranda
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✕</span>
            </div>
            <h2 className="text-xl font-bold mb-3">Oops, ada masalah</h2>
            <p className="text-slate-500 text-sm mb-6">Login gagal. Coba lagi atau hubungi kami.</p>
            <div className="flex gap-3 justify-center">
              <a href="/akun" className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-6 py-3 rounded-full text-sm transition-all">
                Coba ke Dashboard
              </a>
              <a href="https://wa.me/6282116859493" target="_blank" rel="noopener noreferrer"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-full text-sm transition-all">
                WhatsApp
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
