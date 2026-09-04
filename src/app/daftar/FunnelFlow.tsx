"use client";
// =============================================================================
// [daftar-page-funnel-v1]
// Funnel pendaftaran versi HALAMAN, LANGKAH 3–5 (paket → data diri → bayar).
// Langkah 1 & 2 ada di StepLang.tsx / StepProgram.tsx: keduanya diindeks, jadi
// sengaja dipisah supaya bebas dari useSearchParams (yang membuat Next berhenti
// memprarender pohonnya). Menggantikan FunnelModal yang sudah dihapus.
//
// Bedanya dengan modal lama, selain tampilan: keadaan funnel hidup di URL, bukan
// di useState. Konsekuensinya yang harus dijaga saat mengubah file ini —
//  1. Pilihan yang mengubah HARGA (bahasa/program/level) ada di path; pilihan
//     lanjutan (pengajar, durasi, sesi, peserta, mode, kota) ikut sebagai query
//     saat pindah langkah. Refresh & tombol Back browser karenanya tidak
//     menghapus pilihan orang.
//  2. Data diri (nama/email/WA) TIDAK boleh masuk URL — disimpan di
//     sessionStorage `linguo_daftar_form`. Jangan pindahkan ke query "biar
//     gampang": itu PII yang ikut ke-log di analitik & Referer.
//  3. Formula harga di sini WAJIB identik dengan /api/create-funnel-invoice.
//     Angka di layar cuma tampilan — server menghitung ulang (anti-tamper).
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { RectFlag } from "@/components/RectFlag";
import { supabase } from "@/lib/supabase-client";
import {
  getPrivateBase60,
  getSemiPrivatePrice,
  KIDS_LEVEL_KEY,
  computeKidsPerSession,
  NATIVE_MULTIPLIER,
  isNativeAvailable,
  applyNativeMultiplier,
  applyOfflineSurcharge,
  supportsOffline,
  OFFLINE_SURCHARGE_PER_SESSION,
  SEMI_PRIVATE_SIZES,
  SEMI_PRIVATE_MIN,
  SEMI_PRIVATE_MAX,
  offersTeacherTypeChoice,
  supportsAddon,
  ADDON_EBOOK_RECORDING_PRICE,
  KIDS_PRICE_LEVELS,
} from "@/lib/trial-pricing";
import { regulerLangName } from "@/lib/classLanguage";
import {
  buildFunnelPath,
  langNameId,
  levelsForProgram,
  type FunnelRoute,
} from "@/lib/funnelRouting";
import {
  BackLink,
  Card,
  Chosen,
  Row,
  Stepper,
  fmtRp,
  getFlagCode,
  levelBadge,
  levelDesc,
  levelLabel,
} from "./ui";

const SESSION_OPTS = [4, 8, 12, 16, 24];
const IELTS_PRICE = 300000;
const REGULER_PRICE = 150000;
// [private-addon-ebook-recording-v1] Satu angka untuk Reguler DAN Private —
// sumbernya lib/trial-pricing, sama dengan yang dihitung ulang server.
const REGULER_ADDON_PRICE = ADDON_EBOOK_RECORDING_PRICE;
const FORM_KEY = "linguo_daftar_form";

// [kids-cefr-level-v1] Keterangan singkat tiap level untuk orang tua — CEFR
// mentah ("A2") tidak berarti apa-apa buat mereka.
const KIDS_LEVEL_DESC: Record<string, string> = {
  A1: "Baru mulai",
  A2: "Sudah kenal kata dasar",
  B1: "Bisa ngobrol sederhana",
  B2: "Lancar & percaya diri",
};

type FormData = {
  name: string;
  email: string;
  wa: string;
  countryCode: string;
  refCode: string;
};

const EMPTY_FORM: FormData = { name: "", email: "", wa: "", countryCode: "+62", refCode: "" };

// ─────────────────────────────────────────────────────────────────────────────
// KOMPONEN UTAMA
// ─────────────────────────────────────────────────────────────────────────────

export default function FunnelFlow({ route }: { route: FunnelRoute }) {
  const router = useRouter();
  const sp = useSearchParams();

  const { step, langEn, programSlug, program, level } = route;

  // ── Pilihan lanjutan: awalnya dari query, lalu jadi state lokal supaya
  // mengklik opsi tidak memicu navigasi bolak-balik ke server tiap ketukan.
  const [teacherType, setTeacherType] = useState<"lokal" | "native">(
    sp.get("pengajar") === "native" ? "native" : "lokal",
  );
  const [duration, setDuration] = useState(Number(sp.get("durasi")) || 60);
  const [sessions, setSessions] = useState(Number(sp.get("sesi")) || 12);
  // semi-class-size-picker-v1 — jumlah siswa Semi-Private dipilih sendiri (2–10).
  // Query ?peserta= boleh diketik orang, jadi dijepit ke rentang yang sah biar
  // simulasi di layar tidak pernah beda dari hitungan ulang server.
  const [classSize, setClassSize] = useState(() => {
    const n = Number(sp.get("peserta")) || SEMI_PRIVATE_MIN;
    return Math.min(Math.max(Math.round(n), SEMI_PRIVATE_MIN), SEMI_PRIVATE_MAX);
  });
  const [classMode, setClassMode] = useState<"online" | "offline">(
    sp.get("mode") === "offline" ? "offline" : "online",
  );
  const [offlineCity, setOfflineCity] = useState(sp.get("kota") || "");
  const [addAddon, setAddAddon] = useState(sp.get("addon") === "1");
  // [kids-cefr-level-v1] Kelas Kids punya DUA sumbu: kelompok usia (Little
  // Learner / Young Explorer — itu yang jadi segmen `level` di URL) dan level
  // kemampuan bahasa. Sebelumnya sumbu kedua tidak pernah ditanyakan, jadi anak
  // bilingual yang sudah di A2/B1 tetap ditagih tarif A1 — padahal
  // computeKidsPerSession() memang sudah sadar level sejak kids-lang-pricing-v1.
  // Levelnya ikut sebagai query `lvl` (bukan segmen path) supaya URL langkah
  // Kids tetap /daftar/<bahasa>/kids/<kelompok-usia>.
  const [kidsLevel, setKidsLevel] = useState(() => {
    const q = (sp.get("lvl") || "").toUpperCase();
    return KIDS_PRICE_LEVELS.includes(q) ? q : "A1";
  });

  // Level dipilih di halaman langkah 3 (bareng durasi & paket), baru dibawa ke URL.
  // ?level= dipakai alur tes penempatan: hasilnya (A1/A2/B1/B2) sudah tahu level
  // siswa, jadi kartunya tinggal terpilih duluan.
  const suggestedLevel = (sp.get("level") || "").toUpperCase();
  const [selLevel, setSelLevel] = useState(
    level || (programSlug && levelsForProgram(programSlug).includes(suggestedLevel) ? suggestedLevel : ""),
  );
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Data diri: sessionStorage (survive pindah langkah), prefill dari
  // localStorage `linguo_prefill` yang diisi tes penempatan.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(FORM_KEY);
      if (stored) {
        const d = JSON.parse(stored);
        setForm({ ...EMPTY_FORM, ...d });
        return;
      }
      const prefill = localStorage.getItem("linguo_prefill");
      if (prefill) {
        const d = JSON.parse(prefill);
        setForm({
          ...EMPTY_FORM,
          name: d.name || "",
          email: d.email || "",
          wa: String(d.whatsapp || "").replace(/[^0-9]/g, "").replace(/^62/, "").replace(/^0/, ""),
        });
      }
    } catch {}
  }, []);

  const saveForm = useCallback((next: FormData) => {
    setForm(next);
    try { sessionStorage.setItem(FORM_KEY, JSON.stringify(next)); } catch {}
  }, []);

  // Langkah konfirmasi tanpa data diri (mis. URL dibagikan / sessionStorage
  // hilang) → balikkan ke form, jangan tampilkan ringkasan kosong.
  useEffect(() => {
    if (step === 5 && !form.name && !form.email) {
      const stored = (() => { try { return sessionStorage.getItem(FORM_KEY); } catch { return null; } })();
      if (!stored) {
        router.replace(buildFunnelPath({ langEn, programSlug, level }) + optionQuery());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, form.name, form.email]);

  // ── Query pilihan lanjutan, dipasang tiap pindah langkah ──
  function optionQuery(): string {
    const q = new URLSearchParams();
    if (programSlug === "private" || programSlug === "kids") {
      if (hasTeacherPick) q.set("pengajar", teacherType);
      q.set("durasi", String(duration));
      q.set("sesi", String(sessions));
    }
    // [kids-cefr-level-v1] level kemampuan bahasa anak — sumbu kedua Kids.
    if (programSlug === "kids") q.set("lvl", kidsLevel);
    if (programSlug === "semi-private") {
      q.set("peserta", String(classSize));
      q.set("durasi", String(duration));
      q.set("sesi", String(sessions));
    }
    if (canOffline) {
      q.set("mode", classMode);
      if (classMode === "offline" && offlineCity.trim()) q.set("kota", offlineCity.trim());
    }
    // [private-addon-ebook-recording-v1] add-on ikut di query untuk SEMUA program
    // yang menawarkannya, bukan cuma Reguler — kalau tidak, centang di langkah 3
    // Private hilang begitu orang menekan Back.
    if (addAddon && supportsAddon(program || "")) q.set("addon", "1");
    const s = q.toString();
    return s ? `?${s}` : "";
  }

  // ── Harga (mirror /api/create-funnel-invoice) ──
  const lang = langEn || "";
  const isRegulerFlow = program === "Kelas Reguler";
  // langLabel = nama yang DISIMPAN ke lead/registrasi (alur Reguler: "English -
  // Conversation"). Untuk DITAMPILKAN pakai langDisplay — halaman berbahasa
  // Indonesia, jadi "Korea", bukan "Korean". Jangan tukar keduanya: nama Inggris
  // itu kunci pricelist & kolom bahasa di dashboard.
  const langLabel = isRegulerFlow && lang ? regulerLangName(lang) : lang;
  const langDisplay = isRegulerFlow ? langLabel : lang ? langNameId(lang) : "";
  const nativeAvailable = isNativeAvailable(lang);
  // [bahasa-daerah-teacher-type-v1] Bahasa daerah Nusantara pengajarnya memang
  // orang lokal yang sekaligus penutur asli, jadi dikotomi "Lokal vs Native"
  // tidak berlaku di sana — blok pilihannya disembunyikan dan tipe pengajar
  // dikunci ke lokal (server juga menurunkannya, lihat create-funnel-invoice).
  // Didefinisikan SEBELUM blok harga: harga per sesi membacanya.
  const hasTeacherPick =
    (program === "Kelas Private" || program === "Kelas Kids") && offersTeacherTypeChoice(lang);
  const effTeacherType = hasTeacherPick ? teacherType : "lokal";
  const privateBase60 = getPrivateBase60(lang, selLevel || "A1");
  const privatePerSession = applyNativeMultiplier(
    Math.round((privateBase60 * duration) / 60),
    effTeacherType,
  );
  const kidsKey = KIDS_LEVEL_KEY[selLevel];
  const kidsPerSession = kidsKey
    ? computeKidsPerSession(kidsKey, duration, effTeacherType, lang, kidsLevel)
    : 0;
  const semiPrice = program === "Semi Private" ? getSemiPrivatePrice(lang, selLevel, classSize, duration) : null;
  // Pembanding "hemat X%": tarif privat 1-on-1 di bahasa, level & durasi yang
  // sama (tanpa markup native — Semi-Private memang tidak menawarkan native).
  const semiSoloPerSession = Math.round((privateBase60 * duration) / 60);
  const semiSavingPct =
    program === "Semi Private" && semiPrice?.perStudent && semiSoloPerSession
      ? Math.round(((semiSoloPerSession - semiPrice.perStudent) / semiSoloPerSession) * 100)
      : 0;

  const isSessionProg = program === "Kelas Private" || program === "Semi Private" || program === "Kelas Kids";
  const canOffline = supportsOffline(program || "");
  const isOffline = canOffline && classMode === "offline";
  const perSessionOnline =
    program === "Kelas Private" ? privatePerSession
    : program === "Kelas Kids" ? kidsPerSession
    : program === "Semi Private" ? (semiPrice?.perStudent || 0)
    : 0;
  const perSession = canOffline ? applyOfflineSurcharge(perSessionOnline, classMode) : perSessionOnline;
  const offlineReady = !isOffline || offlineCity.trim().length >= 3;
  // [private-addon-ebook-recording-v1] Add-on modul + recording sekarang juga
  // ditawarkan di Kelas Private, bukan cuma Reguler.
  const canAddon = supportsAddon(program || "");
  const addonAmount = canAddon && addAddon ? REGULER_ADDON_PRICE : 0;
  const totalAmount =
    (isSessionProg ? perSession * sessions
    : program === "IELTS/TOEFL Prep" ? IELTS_PRICE
    : program === "Kelas Reguler" ? REGULER_PRICE
    : 0) + addonAmount;

  const durationProg = program === "Kelas Private" || program === "Kelas Kids";
  const DURATION_OPTS = program === "Kelas Kids" ? [30, 45, 60] : [30, 45, 60, 75, 90];

  // ── Navigasi ──
  const goForm = () => {
    if (!selLevel) return;
    router.push(buildFunnelPath({ langEn, programSlug, level: selLevel }) + optionQuery());
  };
  const goConfirm = () => {
    if (!validateForm()) return;
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "funnel_form_submitted", { program, language: lang, level });
    }
    router.push(buildFunnelPath({ langEn, programSlug, level, confirm: true }) + optionQuery());
  };

  function validateForm() {
    if (!form.name.trim()) { setFormError("Masukkan nama lengkap"); return false; }
    if (!form.email.trim() || !form.email.includes("@")) { setFormError("Masukkan email yang valid"); return false; }
    if (!form.wa || form.wa.length < 9) { setFormError("Masukkan nomor WhatsApp yang valid"); return false; }
    if (form.countryCode === "+62" && form.wa[0] !== "8") { setFormError("Nomor Indonesia harus diawali 8"); return false; }
    setFormError("");
    return true;
  }

  // ── Checkout ──
  const handlePay = async () => {
    setSaving(true);
    setFormError("");
    try {
      const fullNum = form.countryCode.replace("+", "") + form.wa;
      const refFinal =
        form.refCode.trim() ||
        (typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("linguo_ref") || ""
          : "");

      // Kelas Reguler punya endpoint sendiri (paket batch + add-on e-book/recording).
      if (program === "Kelas Reguler") {
        const res = await fetch("/api/create-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            wa_number: fullNum,
            // [reguler-english-conversation-v1] simpan nama kelas resminya.
            language: langLabel,
            program: "reguler",
            level: level,
            productKey: "reguler-" + String(level).toLowerCase(),
            addon: addAddon,
            referral_source: localStorage.getItem("linguo_ref") || undefined,
            ref_code: refFinal || undefined,
          }),
        });
        const data = await res.json();
        if (data.invoice_url) { window.location.href = data.invoice_url; return; }
        setFormError(data.error || "Gagal membuat invoice. Silakan coba lagi.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/create-funnel-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          wa_number: fullNum,
          program,
          language: lang,
          level,
          // [kids-cefr-level-v1] level kemampuan bahasa anak (A1–B2). Dikirim
          // terpisah dari `level` karena untuk Kids `level` = kelompok usia.
          kids_level: program === "Kelas Kids" ? kidsLevel : null,
          duration,
          teacher_type: hasTeacherPick ? teacherType : null,
          // [private-addon-ebook-recording-v1] server menghitung ulang nominalnya.
          addon: canAddon && addAddon,
          sessions: isSessionProg ? sessions : null,
          class_size: program === "Semi Private" ? classSize : null,
          class_mode: canOffline ? classMode : "online",
          class_city: isOffline ? offlineCity.trim() : null,
          ref_code: refFinal || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.invoice_url) { window.location.href = data.invoice_url; return; }
      setFormError(data?.error || "Gagal memproses pembayaran. Coba lagi ya.");
      setSaving(false);
    } catch (e) {
      console.error("Checkout error:", e);
      setFormError("Koneksi bermasalah. Silakan coba lagi.");
      setSaving(false);
    }
  };

  const handleGoogleSignIn = async () => {
    document.cookie =
      "linguo_funnel=" +
      encodeURIComponent(JSON.stringify({ program, language: lang, level, wa: form.wa, name: form.name })) +
      ";path=/;max-age=600;SameSite=Lax";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/akun" },
    });
  };

  const levels = programSlug ? levelsForProgram(programSlug) : [];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6">
      <Stepper step={step} langEn={langEn} programSlug={programSlug} level={level} />

      {/* ── LANGKAH 3 — Level, paket & opsi kelas ── */}
      {step === 3 && langEn && programSlug && (
        <Card>
          <BackLink href={buildFunnelPath({ langEn })}>Ganti program</BackLink>
          <Chosen langEn={langEn} program={program} />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            {program === "Kelas Kids" ? "Pilih jenis kelas anak" : "Pilih level & paket"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {program === "Kelas Kids" ? "Sesuaikan dengan usia anak" : "Mulai dari mana, dan berapa lama tiap sesi?"}
          </p>

          {/* [semi-private-mekanisme-grup-v1] Penjelasan mekanisme grup dipasang
              PALING ATAS, sebelum orang menyentuh harga. Kalimatnya sama persis
              dengan yang ada di langkah 1 (StepLang) & kartu program — salah
              paham "Linguo yang mencarikan teman satu grup" adalah keberatan
              paling sering di WhatsApp, jadi diulang di tiap titik keputusan. */}
          {program === "Semi Private" && (
            <div className="mt-5 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">💡 Info Semi-Private</p>
              <p className="mt-1 text-[12px] leading-relaxed text-amber-900/90">
                Program Semi-Private diperuntukkan bagi kamu yang <b>sudah punya anggota grup sendiri</b> —
                teman, keluarga, atau rekan kerja. <b>Linguo tidak mengumpulkan siswa</b> dari pendaftar lain
                untuk membentuk grup. Grup berisi {SEMI_PRIVATE_MIN}–{SEMI_PRIVATE_MAX} orang dan tiap anggota
                mendaftar &amp; membayar porsinya masing-masing.
              </p>
            </div>
          )}

          {/* Tipe pengajar — Private & Kids */}
          {hasTeacherPick && (
            <section className="mt-6">
              <h2 className="text-base font-bold text-slate-900">Tipe pengajar</h2>
              <p className="mb-3 text-sm text-slate-500">Pengajar lokal bersertifikat, atau penutur asli?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => setTeacherType("lokal")}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${teacherType === "lokal" ? "border-[#1A9E9E] bg-[#1A9E9E]/[0.04]" : "border-slate-100 hover:border-[#1A9E9E]/40"}`}
                >
                  <p className="text-sm font-bold text-slate-900">Pengajar Lokal</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Pengajar Indonesia berpengalaman & bersertifikat</p>
                  <p className="mt-1.5 text-[11px] font-bold text-[#1A9E9E]">Tarif normal</p>
                </button>
                {nativeAvailable ? (
                  <button
                    onClick={() => setTeacherType("native")}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${teacherType === "native" ? "border-[#fbbf24] bg-[#fbbf24]/[0.06]" : "border-slate-100 hover:border-[#fbbf24]/60"}`}
                  >
                    <p className="text-sm font-bold text-slate-900">Pengajar Native</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Diajar langsung penutur asli — full immersion</p>
                    <p className="mt-1.5 text-[11px] font-bold text-[#1A9E9E]">{NATIVE_MULTIPLIER}× tarif lokal</p>
                  </button>
                ) : (
                  <div className="cursor-not-allowed rounded-xl border-2 border-slate-100 bg-slate-50 p-3 opacity-70">
                    <p className="text-sm font-bold text-slate-500">Pengajar Native</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                      Belum tersedia untuk Bahasa {langNameId(langEn)}.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Jumlah peserta — Semi Private */}
          {program === "Semi Private" && (
            <section className="mt-6">
              <h2 className="text-base font-bold text-slate-900">Berapa orang dalam grup?</h2>
              <p className="mb-3 text-sm text-slate-500">Makin banyak peserta, makin hemat per orang</p>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setClassSize(n)}
                    className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${classSize === n ? "border-[#1A9E9E] bg-[#1A9E9E] text-white shadow-md" : "border-slate-100 text-slate-600 hover:border-[#1A9E9E]/40"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Level */}
          <section className="mt-6">
            <h2 className="text-base font-bold text-slate-900">
              {program === "Kelas Kids" ? "Kelompok usia" : "Level"}
            </h2>
            <p className="mb-3 text-sm text-slate-500">
              {program === "Kelas Kids" ? "Pilih sesuai usia anak" : "Belum tahu levelmu? Ambil tes penempatan gratis dulu."}
            </p>
            <div className="flex flex-col gap-2">
              {levels.map((lv) => (
                <button
                  key={lv}
                  onClick={() => setSelLevel(lv)}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all hover:border-[#1A9E9E]/40 ${selLevel === lv ? "border-[#1A9E9E] bg-[#1A9E9E]/[0.04]" : "border-slate-100"}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A9E9E]/10 text-sm font-bold text-[#1A9E9E]">
                    {levelBadge(lv)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{levelLabel(lv)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{levelDesc(lv)}</p>
                  </div>
                </button>
              ))}
            </div>
            {program === "Kelas Reguler" && (
              <p className="mt-3 text-xs text-slate-400">*Kelas Reguler saat ini tersedia untuk level A1</p>
            )}
          </section>

          {/* [kids-cefr-level-v1] Level kemampuan bahasa anak — sumbu kedua Kids.
              Usia TIDAK menentukan level: anak bilingual bisa saja sudah di A2/B1.
              Tarifnya ikut level, sama seperti kelas dewasa (KIDS_PRICE_LL/YE). */}
          {program === "Kelas Kids" && (
            <section className="mt-6">
              <h2 className="text-base font-bold text-slate-900">Level bahasa anak</h2>
              <p className="mb-3 text-sm text-slate-500">
                Kelompok usia menentukan gaya belajarnya; level ini menentukan materinya.
                Anak yang sudah terbiasa dua bahasa boleh mulai di level yang lebih tinggi.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {KIDS_PRICE_LEVELS.map((lv) => (
                  <button
                    key={lv}
                    onClick={() => setKidsLevel(lv)}
                    className={`rounded-xl border-2 px-2 py-2.5 text-center transition-all ${kidsLevel === lv ? "border-[#1A9E9E] bg-[#1A9E9E] text-white shadow-md" : "border-slate-100 text-slate-600 hover:border-[#1A9E9E]/40"}`}
                  >
                    <span className="block text-sm font-bold">{lv}</span>
                    <span className={`block text-[10px] leading-tight ${kidsLevel === lv ? "text-white/80" : "text-slate-400"}`}>
                      {KIDS_LEVEL_DESC[lv]}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Belum yakin? Pilih {KIDS_PRICE_LEVELS[0]} — pengajar akan menyesuaikan di sesi pertama,
                dan level bisa dinaikkan tanpa biaya tambahan sebelum kelas dimulai.
              </p>
            </section>
          )}

          {/* Mode kelas — Private & Semi Private */}
          {canOffline && (
            <section className="mt-6">
              <h2 className="text-base font-bold text-slate-900">Mode kelas</h2>
              <p className="mb-3 text-sm text-slate-500">Belajar online, atau pengajar yang datang ke tempatmu?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setClassMode("online")}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${classMode === "online" ? "border-[#1A9E9E] bg-[#1A9E9E]/[0.04]" : "border-slate-100 hover:border-[#1A9E9E]/40"}`}
                >
                  <p className="text-sm font-bold text-slate-900">Online</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Live via Zoom, dari mana saja</p>
                  <p className="mt-1.5 text-[11px] font-bold text-[#1A9E9E]">Tarif normal</p>
                </button>
                <button
                  onClick={() => setClassMode("offline")}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${classMode === "offline" ? "border-[#1A9E9E] bg-[#1A9E9E]/[0.04]" : "border-slate-100 hover:border-[#1A9E9E]/40"}`}
                >
                  <p className="text-sm font-bold text-slate-900">Offline</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Pengajar datang ke tempatmu</p>
                  <p className="mt-1.5 text-[11px] font-bold text-[#1A9E9E]">+{fmtRp(OFFLINE_SURCHARGE_PER_SESSION)}/sesi</p>
                </button>
              </div>
              {isOffline && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    <b>Menyesuaikan ketersediaan pengajar.</b> Kelas offline hanya jalan kalau ada pengajar yang bisa
                    menjangkau daerahmu. Setelah pembayaran, tim kami cek dulu pengajar di area itu — kalau belum ada,
                    kamu bisa pindah ke kelas online (selisih biaya offline dikembalikan) atau dana direfund penuh.
                  </p>
                  <label className="mb-1 mt-3 block text-xs font-semibold text-slate-700">
                    Kota / area kelas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={offlineCity}
                    onChange={(e) => setOfflineCity(e.target.value)}
                    placeholder="Contoh: Bekasi Timur, Kota Bekasi"
                    className="w-full rounded-xl border border-amber-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#1A9E9E] focus:outline-none focus:ring-2 focus:ring-[#1A9E9E]/20"
                  />
                  <p className="mt-1.5 text-[10px] text-amber-800/80">
                    Sebutkan kecamatan & kota biar tim gampang cari pengajar terdekat.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Jumlah siswa — khusus Semi Private (semi-class-size-picker-v1) */}
          {program === "Semi Private" && (
            <section className="mt-6">
              <h2 className="text-base font-bold text-slate-900">Jumlah siswa</h2>
              <p className="mb-3 text-sm text-slate-500">
                Belajar bareng berapa orang? Makin ramai, makin murah per orangnya.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {SEMI_PRIVATE_SIZES.map((n) => (
                  <button
                    key={n}
                    onClick={() => setClassSize(n)}
                    className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${classSize === n ? "border-[#1A9E9E] bg-[#1A9E9E] text-white shadow-md" : "border-slate-100 text-slate-600 hover:border-[#1A9E9E]/40"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                Termasuk kamu. Teman satu grup dicari sendiri ya — Linguo tidak menggabungkan
                siswa dari pendaftar lain. Tiap anggota bayar porsinya masing-masing.
              </p>
              {semiSavingPct > 0 && (
                <p className="mt-1.5 text-[11px] font-semibold text-[#1A9E9E]">
                  Hemat {semiSavingPct}% per orang dibanding kelas privat 1-on-1.
                </p>
              )}
            </section>
          )}

          {/* Durasi & jumlah sesi — program berbasis sesi */}
          {isSessionProg && (
            <>
              <section className="mt-6">
                <h2 className="text-base font-bold text-slate-900">Durasi per sesi</h2>
                <p className="mb-3 text-sm text-slate-500">Pilih lama belajar tiap sesi</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {DURATION_OPTS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${duration === d ? "border-[#1A9E9E] bg-[#1A9E9E] text-white shadow-md" : "border-slate-100 text-slate-600 hover:border-[#1A9E9E]/40"}`}
                    >
                      {d} menit
                    </button>
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <h2 className="text-base font-bold text-slate-900">Jumlah sesi</h2>
                <p className="mb-3 text-sm text-slate-500">Pilih paket jumlah pertemuan</p>
                <div className="grid grid-cols-5 gap-2">
                  {SESSION_OPTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSessions(s)}
                      className={`rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${sessions === s ? "border-[#1A9E9E] bg-[#1A9E9E] text-white shadow-md" : "border-slate-100 text-slate-600 hover:border-[#1A9E9E]/40"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* [private-addon-ebook-recording-v1] Add-on modul + recording untuk
              Kelas Private. Sebelumnya opsi ini cuma ada di jalur WhatsApp:
              siswa yang daftar sendiri lewat web tidak pernah tahu fasilitasnya
              ada, dan admin kehilangan penjualan tambahan. Nominalnya tetap
              dihitung ulang di /api/create-funnel-invoice. */}
          {program === "Kelas Private" && selLevel && (
            <section className="mt-6">
              <h2 className="text-base font-bold text-slate-900">Tambahan (opsional)</h2>
              <p className="mb-3 text-sm text-slate-500">Bisa ditambahkan sekarang, tanpa transaksi terpisah</p>
              <button
                type="button"
                onClick={() => setAddAddon((v) => !v)}
                className={`group flex w-full items-start justify-between gap-3 rounded-2xl border-2 p-4 text-left transition-all ${addAddon ? "border-[#1A9E9E] bg-[#1A9E9E]/[0.04]" : "border-slate-100 hover:border-[#1A9E9E]/40"}`}
              >
                <span className="flex items-start gap-2.5">
                  <span className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition-all ${addAddon ? "border-[#1A9E9E] bg-[#1A9E9E]" : "border-slate-300 group-hover:border-[#1A9E9E]/50"}`}>
                    {addAddon && <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd"/></svg>}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-800">Modul (E-Book) + Recording Kelas</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                      Modul lengkap sesuai bahasa &amp; levelmu, plus rekaman semua sesi — akses selamanya,
                      bisa diulang kapan saja.
                    </span>
                  </span>
                </span>
                <span className={`whitespace-nowrap text-sm font-bold ${addAddon ? "text-[#1A9E9E]" : "text-slate-400"}`}>
                  +{fmtRp(REGULER_ADDON_PRICE)}
                </span>
              </button>
            </section>
          )}

          {/* Ringkasan harga */}
          {selLevel && isSessionProg && perSessionOnline > 0 && (
            <div className="mt-6 rounded-2xl border-2 border-[#1A9E9E]/20 bg-[#1A9E9E]/[0.03] p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {program === "Semi Private" ? `Per orang / sesi (${classSize} peserta)` : `Harga / sesi (${duration} menit)`}
                </span>
                <span>{fmtRp(perSessionOnline)}</span>
              </div>
              {isOffline && (
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Biaya kelas offline / sesi</span>
                  <span>+{fmtRp(OFFLINE_SURCHARGE_PER_SESSION)}</span>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Jumlah sesi</span>
                <span>× {sessions}</span>
              </div>
              {addonAmount > 0 && (
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Modul + Recording Kelas</span>
                  <span>+{fmtRp(addonAmount)}</span>
                </div>
              )}
              <div className="mt-2.5 flex items-center justify-between border-t border-[#1A9E9E]/15 pt-2.5">
                <span className="text-sm font-semibold text-slate-700">
                  Total tagihan{program === "Semi Private" ? " (kamu)" : ""}
                </span>
                <span className="text-xl font-extrabold text-[#1A9E9E]">{fmtRp(totalAmount)}</span>
              </div>
              {/* Semi-Private: tampilkan juga hitungan satu grup, supaya orang
                  yang mengumpulkan temannya tahu total yang harus dikumpulkan.
                  Yang DITAGIH tetap porsi satu orang (perSession × sesi). */}
              {program === "Semi Private" && (
                <div className="mt-2.5 rounded-xl bg-white/70 px-3 py-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Satu grup / sesi ({classSize} orang)</span>
                    <span>{fmtRp(perSession * classSize)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Total satu grup ({sessions} sesi)</span>
                    <span className="font-bold text-slate-700">{fmtRp(perSession * classSize * sessions)}</span>
                  </div>
                </div>
              )}
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                Bayar aman via Xendit. Jadwal diatur Admin setelah pembayaran.
                {program === "Semi Private" && " Tiap anggota grup daftar & bayar porsinya sendiri lewat halaman ini."}
              </p>
            </div>
          )}

          {program === "Kelas Reguler" && (
            <div className="mt-6 rounded-2xl border-2 border-[#1A9E9E]/20 bg-[#1A9E9E]/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Biaya kelas</span>
                <div className="text-right">
                  <span className="mr-1.5 text-xs text-slate-400 line-through">Rp 200.000</span>
                  <span className="text-lg font-extrabold text-[#1A9E9E]">Rp 150.000</span>
                  <span className="text-xs font-medium text-slate-400">/2 bulan</span>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">8 sesi grup class • 90 menit/sesi • dibuka minimal 8 peserta</p>
            </div>
          )}

          {program === "IELTS/TOEFL Prep" && (
            <div className="mt-6 rounded-2xl border-2 border-[#1A9E9E]/20 bg-[#1A9E9E]/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Biaya program</span>
                <span className="text-lg font-extrabold text-[#1A9E9E]">{fmtRp(IELTS_PRICE)}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">16 sesi @ 90 menit • persiapan intensif</p>
            </div>
          )}

          <button
            onClick={goForm}
            disabled={!selLevel || !offlineReady}
            className="mt-6 w-full rounded-full bg-[#1A9E9E] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1A9E9E]/25 transition-all hover:bg-[#178888] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {!selLevel ? "Pilih level dulu" : !offlineReady ? "Isi kota/area kelas dulu" : "Lanjut ke Data Diri →"}
          </button>
        </Card>
      )}

      {/* ── LANGKAH 4 — Data diri ── */}
      {step === 4 && langEn && programSlug && (
        <Card>
          <BackLink href={buildFunnelPath({ langEn, programSlug }) + optionQuery()}>Ganti level</BackLink>
          <Chosen langEn={langEn} program={program} level={level} />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Lengkapi data diri</h1>
          <p className="mt-1 text-sm text-slate-500">Isi data di bawah agar tim kami bisa menghubungimu</p>

          <div className="mt-5 space-y-3">
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Daftar dengan Google
            </button>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">atau isi manual</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nama Lengkap</label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => { saveForm({ ...form, name: e.target.value }); setFormError(""); }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1A9E9E] focus:outline-none focus:ring-2 focus:ring-[#1A9E9E]/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
              <input
                type="email"
                placeholder="john@email.com"
                value={form.email}
                onChange={(e) => { saveForm({ ...form, email: e.target.value }); setFormError(""); }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1A9E9E] focus:outline-none focus:ring-2 focus:ring-[#1A9E9E]/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nomor WhatsApp</label>
              <div className="flex">
                <select
                  value={form.countryCode}
                  onChange={(e) => saveForm({ ...form, countryCode: e.target.value })}
                  className="w-[68px] cursor-pointer appearance-none rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 px-3 text-center text-sm font-medium text-slate-600 focus:outline-none"
                >
                  {["+62","+60","+65","+66","+81","+82","+86","+91","+1","+44","+61","+49","+33","+971","+966","+7","+55","+234"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="812-3456-7890"
                  value={form.wa}
                  onChange={(e) => {
                    saveForm({ ...form, wa: e.target.value.replace(/[^0-9]/g, "").replace(/^0/, "") });
                    setFormError("");
                  }}
                  className="flex-1 rounded-r-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1A9E9E] focus:outline-none focus:ring-2 focus:ring-[#1A9E9E]/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Kode Referral (opsional)</label>
              <input
                type="text"
                placeholder="Masukkan kode referral jika ada"
                value={form.refCode}
                onChange={(e) => saveForm({ ...form, refCode: e.target.value })}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:border-[#1A9E9E] focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">Dapatkan dari teman atau afiliator Linguo</p>
            </div>
          </div>

          {formError && <p className="mt-2 text-xs text-red-500">{formError}</p>}
          <button
            onClick={goConfirm}
            className="mt-5 w-full rounded-full bg-[#1A9E9E] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1A9E9E]/25 transition-all hover:bg-[#178888] active:scale-95"
          >
            Lanjut ke Konfirmasi →
          </button>
        </Card>
      )}

      {/* ── LANGKAH 5 — Konfirmasi & bayar ── */}
      {step === 5 && langEn && programSlug && (
        <Card>
          <BackLink href={buildFunnelPath({ langEn, programSlug, level }) + optionQuery()}>Edit data</BackLink>
          <h1 className="mt-4 text-center text-2xl font-extrabold text-slate-900">Konfirmasi Pendaftaran</h1>
          <p className="mt-1 text-center text-sm text-slate-500">Pastikan data di bawah sudah benar</p>

          <div className="mt-5 space-y-2.5 rounded-2xl bg-slate-50 p-5">
            <Row label="Nama" value={form.name} />
            <Row label="Email" value={form.email} />
            <Row label="WhatsApp" value={`${form.countryCode}${form.wa}`} />
            <div className="my-2.5 border-t border-slate-200" />
            <Row
              label="Bahasa"
              value={
                <span className="flex items-center gap-2">
                  <RectFlag code={getFlagCode(langEn)} h={16} />
                  {langDisplay}
                </span>
              }
            />
            <Row label="Program" value={<span className="text-[#1A9E9E]">{program}</span>} />
            {hasTeacherPick && <Row label="Pengajar" value={teacherType === "native" ? "Native Speaker" : "Lokal"} />}
            {canOffline && <Row label="Mode kelas" value={isOffline ? "Offline (pengajar datang)" : "Online (Zoom)"} />}
            {isOffline && offlineCity.trim() && <Row label="Lokasi kelas" value={offlineCity.trim()} />}
            {program === "Semi Private" && <Row label="Jumlah peserta" value={`${classSize} orang`} />}
            <Row label={program === "Kelas Kids" ? "Kelompok usia" : "Level"} value={levelLabel(level || "")} />
            {program === "Kelas Kids" && (
              <Row label="Level bahasa" value={`${kidsLevel} — ${KIDS_LEVEL_DESC[kidsLevel] ?? ""}`} />
            )}
            {isSessionProg && <Row label="Durasi / sesi" value={`${duration} menit`} />}
            {isSessionProg && <Row label="Jumlah sesi" value={`${sessions} sesi`} />}

            {program === "Kelas Reguler" ? (
              <>
                <Row label="Durasi" value="8 sesi @ 90 menit" />
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-200 pt-2.5">
                  <span className="text-xs text-slate-500">Biaya kelas</span>
                  <span className="text-sm font-medium">Rp 150.000 <span className="font-normal text-slate-400">/2 bulan</span></span>
                </div>
                <button
                  type="button"
                  onClick={() => setAddAddon((v) => !v)}
                  className="group mt-1 flex w-full items-center justify-between gap-3 border-t border-slate-200 pt-3 text-left"
                >
                  <span className="flex items-start gap-2.5">
                    <span className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition-all ${addAddon ? "border-[#1A9E9E] bg-[#1A9E9E]" : "border-slate-300 group-hover:border-[#1A9E9E]/50"}`}>
                      {addAddon && <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd"/></svg>}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-slate-700">Tambah E-Book + Recording Kelas</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-400">Materi lengkap + rekaman semua sesi · akses selamanya</span>
                    </span>
                  </span>
                  <span className={`whitespace-nowrap text-sm font-semibold transition-colors ${addAddon ? "text-[#1A9E9E]" : "text-slate-400"}`}>
                    +Rp150.000
                  </span>
                </button>
                <div className="mt-1 flex items-center justify-between border-t-2 border-slate-200 pt-3">
                  <span className="text-sm font-bold text-slate-800">Total</span>
                  <span className="text-base font-extrabold text-[#1A9E9E]">{fmtRp(totalAmount)}</span>
                </div>
                <div className="mt-3 space-y-1.5 rounded-xl border border-amber-100 bg-amber-50 p-3">
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    <b>Syarat pembukaan kelas:</b> Kelas Reguler dibuka jika minimal <b>8 peserta</b> terkumpul. Jika kuota
                    belum tercapai, kamu akan ditawari batch berikutnya atau <b>refund penuh</b>.
                  </p>
                  {/* [reguler-pengalihan-saldo-v1] Kalimat lama berbunyi "Namun
                      saldo bisa dialihkan ke Kelas Private atau produk lain" tanpa
                      syarat apa pun — padahal pengalihan HANYA berlaku selama
                      kelasnya belum dimulai. Begitu batch berjalan, saldo tidak
                      bisa dipindah ke mana pun. Dipisah jadi dua kondisi supaya
                      siswa tidak merasa dijanjikan sesuatu yang tak ada. */}
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    <b>Kebijakan pembayaran:</b>
                  </p>
                  <ul className="ml-3.5 list-disc space-y-1 text-[11px] leading-relaxed text-amber-900">
                    <li>
                      <b>Kelas belum dimulai:</b> saldo dapat dialihkan ke Kelas Private atau program lain
                      sesuai kebijakan yang berlaku, dengan mengajukan perubahan program ke tim kami.
                    </li>
                    <li>
                      <b>Kelas sudah berjalan:</b> pembayaran tidak dapat di-refund dan saldo{" "}
                      <b>tidak dapat dialihkan</b> ke Kelas Private maupun produk/program lain.
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                {addonAmount > 0 && (
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-200 pt-2.5 text-xs text-slate-500">
                    <span>Modul (E-Book) + Recording Kelas</span>
                    <span>+{fmtRp(addonAmount)}</span>
                  </div>
                )}
                <div className="mt-2.5 flex items-center justify-between border-t-2 border-slate-200 pt-2.5">
                  <span className="text-sm font-bold text-slate-800">
                    Total tagihan{program === "Semi Private" ? " (kamu)" : ""}
                  </span>
                  <span className="text-base font-extrabold text-[#1A9E9E]">{fmtRp(totalAmount)}</span>
                </div>
              </>
            )}
          </div>

          {program === "Kelas Reguler" && (
            <button type="button" onClick={() => setAgreeTerms((v) => !v)} className="group mb-3 flex w-full items-start gap-2.5 text-left">
              <span className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-2 transition-all ${agreeTerms ? "border-[#1A9E9E] bg-[#1A9E9E]" : "border-slate-300 group-hover:border-[#1A9E9E]/50"}`}>
                {agreeTerms && <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd"/></svg>}
              </span>
              <span className="text-[12px] leading-snug text-slate-500">
                Dengan ini saya menyetujui <b className="text-slate-700">syarat pembukaan kelas &amp; kebijakan pembayaran</b> Linguo yang tertera di atas.
              </span>
            </button>
          )}

          {formError && <p className="mb-2 text-center text-xs text-red-500">{formError}</p>}
          <button
            onClick={handlePay}
            disabled={saving || (program === "Kelas Reguler" && !agreeTerms)}
            className="w-full rounded-full bg-[#fbbf24] py-3.5 text-sm font-bold text-slate-900 shadow-lg transition-all hover:bg-[#f59e0b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Memproses..." : `Bayar ${fmtRp(totalAmount)} →`}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Kamu akan diarahkan ke halaman pembayaran Xendit yang aman
          </p>
        </Card>
      )}
    </div>
  );

}
