// [b2b-pendataan-peserta-v1] Form Pendataan Peserta kelas B2B (korporat).
//
// Satu link per perusahaan (corporate_leads.intake_token) — PIC meneruskannya
// ke semua peserta, tiap orang mengisi datanya sendiri. Kiriman langsung masuk
// roster peserta di dashboard (Registrasi → B2B), membuka akses e-book A1
// bahasa kelasnya, dan memicu WA sambutan dari nomor CS. Tampilan mengikuti
// /pendataan/[token] (teks minimal text-sm, label text-base slate-900).
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle, BookOpen, Briefcase, Building2, CalendarDays, CheckCircle2, Clock, GraduationCap, Loader2, Mail,
  MapPin, MessageCircle, Phone, RotateCcw, SearchX, Target, User,
} from "lucide-react";

const TEAL = "#1A9E9E";
const WA_CS = "6282116859493";

type LeadInfo = { company_name: string; language: string | null; level: string | null; logo_url: string | null };

const EXPERIENCE = [
  "Belum pernah belajar sama sekali",
  "Pernah belajar sedikit (otodidak / aplikasi)",
  "Sudah paham dasar-dasarnya",
  "Sudah bisa percakapan sehari-hari",
];

// Jadwal: hari × blok waktu (kelas karyawan biasanya sesudah jam kerja). Disimpan
// sebagai teks "Senin, Rabu · Malam (19.00–21.00)" + catatan — dibaca pengajar
// di surat tugas, jadi bentuknya sengaja kalimat, bukan kode.
const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const SLOTS = ["Pagi (08.00–11.00)", "Siang (12.00–15.00)", "Sore (16.00–18.00)", "Malam (19.00–21.00)"];

const chipClass = (on: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
    on ? "border-transparent text-white shadow-sm" : "border-slate-300 bg-white text-slate-800 hover:border-[#1A9E9E]/60"
  }`;

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-500 shadow-sm transition focus:border-[#1A9E9E] focus:outline-none focus:ring-4 focus:ring-[#1A9E9E]/10";

const EMPTY = {
  name: "", nickname: "", whatsapp: "", email: "", department: "", job_title: "", city: "",
  prior_experience: "", learning_goal: "", schedule_note: "",
  days: [] as string[], slots: [] as string[],
};

function Field({
  label, icon: Icon, required, hint, children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-base font-bold text-slate-900">
        <Icon className="h-4 w-4 text-[#1A9E9E]" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{hint}</p>}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30 px-4 py-16">
      <div className="mx-auto max-w-md text-center">{children}</div>
    </div>
  );
}

export default function PendataanB2BPage() {
  const { token } = useParams<{ token: string }>();
  const [lead, setLead] = useState<LeadInfo | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notfound" | "error" | "done">("loading");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ ebook: string | null; expires_at: string | null; nickname: string; email: string } | null>(null);

  useEffect(() => {
    fetch(`/api/pendataan-b2b?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (r.status === 404) return setState("notfound");
        if (!r.ok) return setState("error");
        setLead(await r.json());
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [token]);

  const toggle = (k: "days" | "slots", v: string) =>
    setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  const set = (k: "name" | "nickname" | "whatsapp" | "email" | "department" | "job_title" | "city" | "learning_goal" | "schedule_note") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const r = await fetch("/api/pendataan-b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token, ...form,
          preferred_schedule: form.days.length && form.slots.length
            ? `${DAYS.filter((d) => form.days.includes(d)).join(", ")} · ${SLOTS.filter((x) => form.slots.includes(x)).join(", ")}`
              + (form.schedule_note.trim() ? ` — ${form.schedule_note.trim()}` : "")
            : "",
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(j?.error || "Gagal menyimpan, coba lagi ya");
        return;
      }
      setResult({ ebook: j.ebook, expires_at: j.expires_at, nickname: form.nickname, email: form.email.trim().toLowerCase() });
      setState("done");
      window.scrollTo({ top: 0 });
    } catch {
      setErr("Koneksi terputus, coba kirim lagi ya");
    } finally {
      setSaving(false);
    }
  };

  if (state === "loading") {
    return <Shell><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1A9E9E]" /></Shell>;
  }
  if (state === "notfound" || state === "error") {
    return (
      <Shell>
        <SearchX className="mx-auto mb-4 h-12 w-12 text-slate-400" />
        <h1 className="text-xl font-bold text-slate-900">
          {state === "notfound" ? "Link form tidak ditemukan" : "Form belum bisa dibuka"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Pastikan link yang dibuka lengkap (tidak terpotong). Kalau masih bermasalah, hubungi tim Linguo.
        </p>
        <a href={`https://wa.me/${WA_CS}`} className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: TEAL }}>
          <MessageCircle className="h-4 w-4" /> Chat Tim Linguo
        </a>
      </Shell>
    );
  }

  if (state === "done" && result) {
    const sampai = result.expires_at
      ? new Date(result.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : null;
    return (
      <Shell>
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[#1A9E9E]" />
        <h1 className="text-2xl font-bold text-slate-900">Terima kasih, {result.nickname}! 🎉</h1>
        <p className="mt-2 text-base text-slate-700">
          Datamu sudah kami terima sebagai peserta kelas {lead?.company_name}. Info jadwal & link kelas akan kami kabarkan lewat WhatsApp.
        </p>
        {result.ebook && (
          <div className="mt-6 rounded-2xl border border-teal-200 bg-white p-5 text-left shadow-sm">
            <p className="flex items-center gap-2 text-base font-bold text-slate-900">
              <BookOpen className="h-5 w-5 text-[#1A9E9E]" /> Bonus e-book aktif
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
              Kamu mendapat akses gratis ke <b>{result.ebook}</b>{sampai ? <> sampai <b>{sampai}</b></> : null}. Masuk ke dashboard
              dengan email <b>{result.email}</b> lalu buka menu <b>Perpustakaan</b>.
            </p>
            <a href="/akun?menu=pustaka" className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-bold text-white" style={{ backgroundColor: TEAL }}>
              Buka Dashboard Siswa
            </a>
          </div>
        )}
        <p className="mt-6 text-sm text-slate-600">Panduan masuk juga sudah kami kirim ke WhatsApp & email kamu.</p>
        <button
          onClick={() => { setForm(EMPTY); setResult(null); setState("ready"); }}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1A9E9E] hover:underline">
          <RotateCcw className="h-4 w-4" /> Isi untuk peserta lain
        </button>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-white.png" alt="Linguo" className="h-8 brightness-0" />
        </div>
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#1A9E9E]">
            <Building2 className="h-4 w-4" /> {lead?.company_name}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Form Pendataan Peserta</h1>
          <p className="mt-2 text-base leading-relaxed text-slate-700">
            Kelas Bahasa {lead?.language || ""} bersama Linguo. Satu form untuk satu peserta — isi data dirimu sendiri ya.
            Sesudah dikirim, kamu langsung bisa masuk dashboard siswa{lead?.language ? ` dan membaca e-book ${lead.language}` : ""}.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <Field label="Nama lengkap" icon={User} required>
            <input className={inputClass} value={form.name} onChange={set("name")} placeholder="Sesuai data karyawan" required />
          </Field>
          <Field label="Nama panggilan" icon={User} required>
            <input className={inputClass} value={form.nickname} onChange={set("nickname")} placeholder="Dipakai pengajar di kelas" required />
          </Field>
          <Field label="Nomor WhatsApp" icon={Phone} required hint="Info kelas & panduan dashboard dikirim ke nomor ini.">
            <input className={inputClass} value={form.whatsapp} onChange={set("whatsapp")} inputMode="tel" placeholder="08xxxxxxxxxx" required />
          </Field>
          <Field label="Email" icon={Mail} required hint="Dipakai untuk masuk dashboard siswa & e-book — pakai email yang bisa kamu buka.">
            <input className={inputClass} type="email" value={form.email} onChange={set("email")} placeholder="nama@perusahaan.com" required />
          </Field>
          <Field label="Divisi / departemen" icon={Building2} required>
            <input className={inputClass} value={form.department} onChange={set("department")} placeholder="mis. Business Development" required />
          </Field>
          <Field label="Jabatan" icon={Briefcase}>
            <input className={inputClass} value={form.job_title} onChange={set("job_title")} placeholder="Opsional" />
          </Field>
          <Field label="Kota domisili" icon={MapPin}>
            <input className={inputClass} value={form.city} onChange={set("city")} placeholder="Opsional" />
          </Field>
          <Field label={`Pengalaman belajar bahasa ${lead?.language || ""}`.trim()} icon={GraduationCap} required>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE.map((o) => {
                const on = form.prior_experience === o;
                return (
                  <button key={o} type="button" onClick={() => setForm((f) => ({ ...f, prior_experience: o }))}
                    className={chipClass(on)}
                    style={on ? { backgroundColor: TEAL } : undefined}>
                    {o}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Hari yang kamu bisa" icon={CalendarDays} required hint="Pilih semua hari yang memungkinkan — jadwal kelas disesuaikan dengan mayoritas peserta.">
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button key={d} type="button" onClick={() => toggle("days", d)} className={chipClass(form.days.includes(d))}
                  style={form.days.includes(d) ? { backgroundColor: TEAL } : undefined}>{d}</button>
              ))}
            </div>
          </Field>
          <Field label="Jam yang kamu bisa (WIB)" icon={Clock} required>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((x) => (
                <button key={x} type="button" onClick={() => toggle("slots", x)} className={chipClass(form.slots.includes(x))}
                  style={form.slots.includes(x) ? { backgroundColor: TEAL } : undefined}>{x}</button>
              ))}
            </div>
            <input className={`${inputClass} mt-3`} value={form.schedule_note} onChange={set("schedule_note")}
              placeholder="Catatan jadwal (opsional), mis. Jumat hanya bisa jam 17.30" />
          </Field>
          <Field label="Tujuan / kebutuhan belajar" icon={Target} hint="mis. meeting dengan klien, presentasi, email, perjalanan dinas.">
            <textarea className={`${inputClass} min-h-[96px]`} value={form.learning_goal} onChange={set("learning_goal")} placeholder="Opsional" />
          </Field>

          {err && (
            <p className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
            </p>
          )}

          <button type="submit" disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-bold text-white shadow-sm transition disabled:opacity-60"
            style={{ backgroundColor: TEAL }}>
            {saving && <Loader2 className="h-5 w-5 animate-spin" />} Kirim Data
          </button>
        </form>
      </div>
    </div>
  );
}
