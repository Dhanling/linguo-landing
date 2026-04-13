"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading"|"success"|"error">("loading");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const handle = async () => {
      try {
        // Step 1: Exchange code for session (PKCE flow)
        const params = new URLSearchParams(window.location.search);
        const authCode = params.get("code");

        if (authCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);
            setStatus("error");
            return;
          }
        }

        // Step 2: Get user after exchange
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("User error:", userError);
          setStatus("error");
          return;
        }

        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
        const email = user.email || "";
        setUserName(name);

        // Step 3: Get funnel data from localStorage
        const funnelData = JSON.parse(localStorage.getItem("linguo_funnel") || "{}");

        // Step 4: Save lead via API
        try {
          const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
          const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
          await fetch(SUPABASE_URL + "/rest/v1/leads", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: "Bearer " + SUPABASE_KEY,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              name, email,
              wa_number: "",
              source: "google_oauth",
              program: funnelData.program || null,
              language: funnelData.language || null,
              level: funnelData.level || null,
            }),
          });
        } catch(e) { console.log("Lead save:", e); }

        localStorage.removeItem("linguo_funnel");
        setStatus("success");

        // Open WA
        setTimeout(() => {
          const msg = "Halo, saya " + name + " (" + email + "). Saya baru mendaftar via Google di linguo.id.\nProgram: " + (funnelData.program||"-") + "\nBahasa: " + (funnelData.language||"-") + "\nLevel: " + (funnelData.level||"-");
          window.open("https://wa.me/6282116859493?text=" + encodeURIComponent(msg), "_blank");
        }, 2500);
      } catch(e) {
        console.error("Callback error:", e);
        setStatus("error");
      }
    };
    handle();
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center" style={{fontFamily:"Poppins,sans-serif"}}>
      <div className="max-w-md mx-auto px-6 text-center">
        {status==="loading" && (
          <div>
            <div className="h-16 w-16 border-4 border-[#1A9E9E] border-t-transparent rounded-full animate-spin mx-auto mb-6"/>
            <h2 className="text-xl font-bold mb-2">Memproses pendaftaran...</h2>
            <p className="text-sm text-slate-500">Mohon tunggu sebentar</p>
          </div>
        )}
        {status==="success" && (
          <div>
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">✓</span></div>
            <h2 className="text-2xl font-bold mb-3">Selamat datang, {userName}!</h2>
            <p className="text-slate-500 text-sm mb-6">Pendaftaran berhasil! Tim kami akan menghubungi kamu via WhatsApp.</p>
            <p className="text-xs text-slate-400 mb-8">WhatsApp terbuka otomatis...</p>
            <Link href="/" className="inline-block bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all">Kembali ke Beranda</Link>
          </div>
        )}
        {status==="error" && (
          <div>
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">✕</span></div>
            <h2 className="text-xl font-bold mb-3">Oops, ada masalah</h2>
            <p className="text-slate-500 text-sm mb-6">Pendaftaran gagal. Silakan coba lagi atau hubungi kami via WhatsApp.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/" className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-full text-sm transition-all">Kembali</Link>
              <a href="https://wa.me/6282116859493" target="_blank" className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-6 py-3 rounded-full text-sm transition-all">WhatsApp</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
