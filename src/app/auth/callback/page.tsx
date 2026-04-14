"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

function deleteCookie(name: string) {
  document.cookie = name + "=;path=/;max-age=0";
}

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading"|"success"|"error">("loading");
  const [userName, setUserName] = useState("");
  const [studentToken, setStudentToken] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Auto-redirect to dashboard when token is available
  useEffect(() => {
    if (studentToken && status === "success") {
      const timer = setTimeout(() => {
        window.location.href = "https://dashboard.linguo.id/s/" + studentToken;
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [studentToken, status]);

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

        // With implicit flow, tokens are in the URL hash
        // Give Supabase a moment to process the hash
        await new Promise(r => setTimeout(r, 500));
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
            if (event === "SIGNED_IN" && sess) {
              processUser(sess.user, funnelData);
              subscription.unsubscribe();
            }
          });
          setTimeout(() => { setStatus("error"); subscription.unsubscribe(); }, 5000);
          return;
        }

        processUser(session.user, funnelData);
      } catch(e) {
        console.error("Callback error:", e);
        setStatus("error");
      }
    };

    const processUser = async (user: any, funnelData: { program: string; language: string; level: string }) => {
      const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
      const email = user.email || "";
      setUserName(name);

      // Save to students + registrations in Supabase
      try {
        const res = await fetch("/api/save-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            program: funnelData.program || undefined,
            language: funnelData.language || undefined,
            level: funnelData.level || undefined,
          }),
        });
        const result = await res.json();
        console.log("Save lead result:", result);
        if (result.studentToken) setStudentToken(result.studentToken);
        if (result.duplicate) setIsDuplicate(true);
        if (!res.ok) console.error("Lead save failed:", result);
      } catch(e) { console.error("Lead save error:", e); }

      setStatus("success");

      // Note: auto-redirect handled in component via useEffect on studentToken
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
            {isDuplicate ? (
              <p className="text-slate-500 text-sm mb-6">Kamu sudah terdaftar sebelumnya. Langsung masuk ke dashboard ya!</p>
            ) : (
              <p className="text-slate-500 text-sm mb-6">Pendaftaran berhasil! Lanjut ke dashboard untuk pilih paket & bayar.</p>
            )}
            <div className="flex flex-col gap-3 items-center">
              {studentToken ? (
                <a href={`https://dashboard.linguo.id/s/${studentToken}`}
                  className="inline-block bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold px-8 py-4 rounded-full text-sm transition-all active:scale-95 shadow-lg">
                  Masuk ke Dashboard Siswa →
                </a>
              ) : (
                <Link href="/student/login"
                  className="inline-block bg-[#1A9E9E] hover:bg-[#178888] text-white font-bold px-8 py-4 rounded-full text-sm transition-all active:scale-95 shadow-lg">
                  Login ke Dashboard →
                </Link>
              )}
              <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                atau kembali ke beranda
              </Link>
            </div>
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
