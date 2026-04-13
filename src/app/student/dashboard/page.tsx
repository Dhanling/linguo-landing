"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";

export default function StudentDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/student/login";
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    // Handle OAuth redirect (tokens in hash)
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        setLoading(false);
      }
    });

    check();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#1A9E9E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const email = user?.email || "";
  const avatar = user?.user_metadata?.avatar_url || "";
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

  return (
    <div className="min-h-screen bg-[#f8fafb]" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <img src="/images/logo-color.png" alt="Linguo.id" className="h-8 object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{name}</p>
              <p className="text-xs text-slate-400">{email}</p>
            </div>
            {avatar && <img src={avatar} alt="" className="h-9 w-9 rounded-full border-2 border-[#1A9E9E]/20" />}
            <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium">Logout</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{greeting}, {name.split(" ")[0]}! 👋</h1>
          <p className="text-sm text-slate-500 mt-1">Selamat datang di Student Dashboard Linguo.id</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Kelas Aktif", value: "—", icon: "📚", color: "bg-teal-50 border-teal-200 text-teal-700" },
            { label: "Sesi Selesai", value: "—", icon: "✅", color: "bg-green-50 border-green-200 text-green-700" },
            { label: "Level Saat Ini", value: "—", icon: "📊", color: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "Sertifikat", value: "—", icon: "🏆", color: "bg-amber-50 border-amber-200 text-amber-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
              <span className="text-xl">{s.icon}</span>
              <p className="text-2xl font-bold mt-2">{s.value}</p>
              <p className="text-xs font-medium opacity-70 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Classes */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">📅 Jadwal Kelas</h2>
            <div className="text-center py-8 text-slate-400">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm">Belum ada jadwal kelas</p>
              <p className="text-xs text-slate-300 mt-1">Jadwal akan muncul setelah diatur oleh admin</p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">📊 Progress Belajar</h2>
            <div className="text-center py-8 text-slate-400">
              <p className="text-4xl mb-2">📈</p>
              <p className="text-sm">Progress akan ditampilkan di sini</p>
              <p className="text-xs text-slate-300 mt-1">Termasuk level, attendance, dan rapor</p>
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">📖 Materi</h2>
            <div className="text-center py-8 text-slate-400">
              <p className="text-4xl mb-2">📚</p>
              <p className="text-sm">Materi kelas akan muncul di sini</p>
              <p className="text-xs text-slate-300 mt-1">PDF, rekaman, dan catatan dari guru</p>
            </div>
          </div>

          {/* Certificates */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">🏆 Sertifikat</h2>
            <div className="text-center py-8 text-slate-400">
              <p className="text-4xl mb-2">🎓</p>
              <p className="text-sm">Sertifikat akan tersedia setelah menyelesaikan kursus</p>
              <p className="text-xs text-slate-300 mt-1">Download e-certificate dalam format PDF</p>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 bg-gradient-to-r from-[#1A9E9E] to-[#178888] rounded-2xl p-6 text-white text-center">
          <h3 className="font-bold text-lg mb-1">Butuh bantuan?</h3>
          <p className="text-sm text-white/80 mb-4">Tim kami siap membantu kamu via WhatsApp</p>
          <a href="https://wa.me/6282116859493" target="_blank" className="inline-flex items-center gap-2 bg-white text-[#1A9E9E] font-bold px-6 py-3 rounded-full text-sm hover:shadow-lg transition-all active:scale-95">
            💬 Chat WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
