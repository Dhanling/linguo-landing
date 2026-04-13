"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

export default function StudentDashboardPage() {
  const [status, setStatus] = useState<"loading" | "redirecting" | "not_found" | "error">("loading");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const handle = async () => {
      try {
        await new Promise(r => setTimeout(r, 500));
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
            if (event === "SIGNED_IN" && sess) { processUser(sess.user); subscription.unsubscribe(); }
          });
          setTimeout(() => { setStatus("error"); subscription.unsubscribe(); }, 5000);
          return;
        }
        processUser(session.user);
      } catch (e) { console.error("Auth error:", e); setStatus("error"); }
    };

    const processUser = async (user: any) => {
      const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
      const email = user.email || "";
      setUserName(name);
      setUserEmail(email);
      if (!email) { setStatus("error"); return; }
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/students?email=eq.${encodeURIComponent(email)}&select=id,student_token,name`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        const students = await res.json();
        if (students && students.length > 0 && students[0].student_token) {
          setStatus("redirecting");
          setTimeout(() => { window.location.href = `https://dashboard.linguo.id/s/${students[0].student_token}`; }, 1000);
        } else {
          setStatus("not_found");
        }
      } catch (e) { console.error("Lookup error:", e); setStatus("error"); }
    };

    handle();
  }, []);

  const waLink = "https://wa.me/6282116859493?text=" + encodeURIComponent("Halo, saya sudah login tapi akun belum terdaftar. Email: " + userEmail);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdfa] via-white to-[#f0f9ff] flex items-center justify-center px-4" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1A9E9E]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#fbbf24]/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md text-center">
        <Link href="/"><img src="/images/logo-white.png" alt="Linguo.id" className="h-10 mx-auto mb-6 object-contain" style={{ filter: "brightness(0)" }} /></Link>

        {status === "loading" && (
          <div>
            <div className="h-14 w-14 border-4 border-[#1A9E9E] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Memproses login...</h2>
            <p className="text-sm text-slate-500">Mohon tunggu sebentar</p>
          </div>
        )}

        {status === "redirecting" && (
          <div>
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">✓</span></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Selamat datang, {userName.split(" ")[0]}!</h2>
            <p className="text-sm text-slate-500 mb-4">Mengarahkan ke dashboard kamu...</p>
            <div className="h-4 w-4 border-2 border-[#1A9E9E] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {status === "not_found" && (
          <div>
            <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">🔍</span></div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Akun belum terdaftar</h2>
            <p className="text-sm text-slate-500 mb-2">Email <span className="font-semibold">{userEmail}</span> belum terdaftar sebagai siswa Linguo.id.</p>
            <p className="text-sm text-slate-500 mb-6">Daftar dulu atau hubungi admin untuk bantuan.</p>
            <div className="flex flex-col gap-3">
              <Link href="/" className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all text-center">Daftar Sekarang</Link>
              <a href={waLink} target="_blank" className="border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-8 py-3 rounded-full text-sm transition-all text-center">💬 Hubungi Admin</a>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/student/login"; }} className="text-sm text-slate-400 hover:text-slate-600 transition-colors mt-2">Login dengan email lain</button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">✕</span></div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Terjadi kesalahan</h2>
            <p className="text-sm text-slate-500 mb-6">Tidak bisa memproses login. Silakan coba lagi.</p>
            <div className="flex flex-col gap-3">
              <Link href="/student/login" className="bg-[#1A9E9E] hover:bg-[#178888] text-white font-semibold px-8 py-3 rounded-full text-sm transition-all text-center">Coba Lagi</Link>
              <a href="https://wa.me/6282116859493" target="_blank" className="border-2 border-slate-200 text-slate-700 font-semibold px-8 py-3 rounded-full text-sm transition-all text-center">💬 Hubungi Admin</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}