"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session from URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setStatus("error");
          return;
        }

        const user = session.user;
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
        const email = user.email || "";
        setUserName(name);

        // Get saved funnel data from localStorage
        const funnelData = JSON.parse(localStorage.getItem("linguo_funnel") || "{}");

        // Save to registrations table (or students)
        const { error: insertError } = await supabase.from("registrations").upsert({
          name,
          email,
          source: "google_oauth",
          program: funnelData.program || null,
          language: funnelData.language || null,
          level: funnelData.level || null,
          status: "new",
          created_at: new Date().toISOString(),
        }, { onConflict: "email" });

        if (insertError) console.error("Insert error:", insertError);

        // Clear funnel data
        localStorage.removeItem("linguo_funnel");
        
        setStatus("success");

        // Open WhatsApp after 2 seconds
        setTimeout(() => {
          const msg = `Halo, saya ${name} (${email}). Saya baru mendaftar via Google di linguo.id.\n\nProgram: ${funnelData.program || "-"}\nBahasa: ${funnelData.language || "-"}\nLevel: ${funnelData.level || "-"}`;
          window.open(`https://wa.me/6282116859493?text=${encodeURIComponent(msg)}`, "_blank");
        }, 2000);
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="max-w-md mx-auto px-6 text-center">
        {status === "loading" && (
          <div>
            <div className="h-16 w-16 border-4 border-[#1A9E9E] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-2">Memproses pendaftaran...</h2>
            <p className="text-sm text-slate-500">Mohon tunggu sebentar</p>
          </div>
        )}
        {status === "success" && (
          <div>
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Selamat datang, {userName}!</h2>
            <p className="text-slate-500 text-sm mb-6">Pendaftaran berhasil! Tim kami akan menghubungi kamu via WhatsApp untuk langkah selanjutnya.</p>
            <p className="text-xs text-slate-400 mb-8">WhatsApp akan terbuka otomatis...</p>
            <Link href="/" className="inline-block bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all">
              Kembali ke Beranda
            </Link>
          </div>
        )}
        {status === "error" && (
          <div>
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✕</span>
            </div>
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
