"use client";

// [rating-sesi-akun-v1] Pop-up "Nilai sesi kemarin" di dashboard siswa.
//
// Jaring kedua untuk rating sesi kelas live: form utamanya ada di layar "Kelas
// selesai" Kelas Video, tapi siswa yang langsung menutup tab tak pernah melihatnya.
// Di sini sesi 7 hari terakhir yang sudah berlangsung dan belum dinilai
// disodorkan satu per satu (maks 3, dari /api/rating-sesi).
//
// "Nanti saja" menunda sesi itu 12 jam di perangkat ini — sengaja tidak bisa
// ditutup permanen, tapi juga tidak mengurung siswa: dashboard tetap harus bisa
// dipakai. Setelah 7 hari sesinya gugur sendiri dari daftar.
// Tanpa sesi login (mis. mode pratinjau POV staf) komponen ini diam.

import { useEffect, useState } from "react";
import { Star, X, Loader2, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

interface Sesi {
  scheduleId: string;
  waktu: string;
  sesi: number | null;
  kelas: string;
  pengajar: string | null;
}
type Aspek = "keseluruhan" | "pengajar" | "materi" | "koneksi";

const TEAL = "#1A9E9E";
const KUNCI_TUNDA = "rating-sesi-tunda-v1";
const TUNDA_MS = 12 * 3600_000;
const LABEL = ["", "Buruk", "Kurang", "Cukup", "Bagus", "Sangat bagus"];

function bacaTunda(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_TUNDA) || "{}") || {};
  } catch {
    return {};
  }
}
function tunda(id: string) {
  try {
    const t = bacaTunda();
    const now = Date.now();
    for (const k of Object.keys(t)) if (t[k] < now) delete t[k];
    t[id] = now + TUNDA_MS;
    localStorage.setItem(KUNCI_TUNDA, JSON.stringify(t));
  } catch { /* penyimpanan diblokir — pop-up muncul lagi di kunjungan berikut */ }
}

async function token(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function Baris({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const tampil = hover || value;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 13, color: "#1f2937", lineHeight: 1.25 }}>{label}</span>
      <div style={{ display: "flex", flexShrink: 0 }} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} bintang — ${LABEL[n]}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2 }}
          >
            <Star size={22} strokeWidth={1.8} color={n <= tampil ? "#fbbf24" : "#d1d5db"} fill={n <= tampil ? "#fbbf24" : "none"} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RatingSesiPengingat() {
  const [antre, setAntre] = useState<Sesi[]>([]);
  const [nilai, setNilai] = useState<Record<Aspek, number>>({ keseluruhan: 0, pengajar: 0, materi: 0, koneksi: 0 });
  const [saran, setSaran] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [galat, setGalat] = useState("");

  useEffect(() => {
    let alive = true;
    // Ditunda sebentar supaya tidak berebut dengan pemuatan dashboard & tirai boot.
    const t = window.setTimeout(async () => {
      try {
        const at = await token();
        if (!at || !alive) return;
        const res = await fetch("/api/rating-sesi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: at, aksi: "daftar" }),
          cache: "no-store",
        });
        if (!res.ok) return;
        const j = await res.json();
        const ditunda = bacaTunda();
        const now = Date.now();
        const list = (Array.isArray(j?.sesi) ? j.sesi : []).filter((s: Sesi) => !(ditunda[s.scheduleId] > now));
        if (alive) setAntre(list);
      } catch { /* diam — ini cuma pengingat */ }
    }, 2500);
    return () => { alive = false; window.clearTimeout(t); };
  }, []);

  const sekarang = antre[0];
  if (!sekarang) return null;

  const lanjut = () => {
    setAntre((a) => a.slice(1));
    setNilai({ keseluruhan: 0, pengajar: 0, materi: 0, koneksi: 0 });
    setSaran("");
    setStatus("idle");
    setGalat("");
  };
  const nanti = () => { tunda(sekarang.scheduleId); lanjut(); };
  const lengkap = !!(nilai.keseluruhan && nilai.pengajar && nilai.materi && nilai.koneksi);
  const set = (k: Aspek) => (n: number) => setNilai((v) => ({ ...v, [k]: n }));

  const kirim = async () => {
    if (!lengkap || status === "busy") return;
    setStatus("busy");
    try {
      const at = await token();
      const res = await fetch("/api/rating-sesi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: at, aksi: "kirim", scheduleId: sekarang.scheduleId, ...nilai, saran }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Gagal mengirim");
      setStatus("ok");
      window.setTimeout(lanjut, 1400);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal mengirim");
      setStatus("err");
    }
  };

  const tgl = new Date(sekarang.waktu).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jakarta" });
  const jam = new Date(sekarang.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  const konteks = [sekarang.kelas, sekarang.sesi ? `Sesi ${sekarang.sesi}` : "", `${tgl}, ${jam}`].filter(Boolean).join(" · ");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nilai sesi kelas"
      style={{ position: "fixed", inset: 0, zIndex: 2147482000, background: "rgba(15,23,42,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ background: "#fff", borderRadius: 22, width: "100%", maxWidth: 440, maxHeight: "calc(100vh - 32px)", overflowY: "auto", padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: "#111827" }}>Bagaimana kelas terakhirmu?</p>
            <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: 12, color: "#6b7280" }}>{konteks}</p>
          </div>
          <button onClick={nanti} aria-label="Nanti saja" style={{ border: "none", background: "#f3f4f6", borderRadius: 999, width: 30, height: 30, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
            <X size={16} color="#6b7280" />
          </button>
        </div>

        {status === "ok" ? (
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, background: "#f0fdfa", borderRadius: 14, padding: "12px 14px" }}>
            <CheckCheck size={18} color={TEAL} />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#115e59" }}>Terima kasih! Penilaianmu sudah diterima pengajar.</span>
          </div>
        ) : (
          <>
            <p style={{ margin: "12px 0 8px", fontWeight: 600, fontSize: 12.5, color: "#4b5563", lineHeight: 1.45 }}>
              Penilaianmu dibaca langsung oleh pengajar untuk memperbaiki pertemuan berikutnya.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Baris label="Kelas secara keseluruhan" value={nilai.keseluruhan} onChange={set("keseluruhan")} />
              <Baris label={sekarang.pengajar ? `Cara mengajar ${sekarang.pengajar}` : "Cara mengajar pengajar"} value={nilai.pengajar} onChange={set("pengajar")} />
              <Baris label="Materi & latihan" value={nilai.materi} onChange={set("materi")} />
              <Baris label="Koneksi, suara & video" value={nilai.koneksi} onChange={set("koneksi")} />
            </div>
            <textarea
              value={saran}
              onChange={(e) => setSaran(e.target.value.slice(0, 2000))}
              rows={3}
              placeholder="Saran untuk kelas berikutnya (opsional)"
              style={{ marginTop: 10, width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid #e5e7eb", padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "#1f2937", background: "#fff", resize: "none", outline: "none", fontFamily: "inherit" }}
            />
            {status === "err" && (
              <p style={{ margin: "8px 0 0", fontWeight: 700, fontSize: 12, color: "#b91c1c" }}>Belum terkirim: {galat}</p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={nanti} style={{ border: "none", background: "#f3f4f6", color: "#4b5563", borderRadius: 999, padding: "11px 16px", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}>
                Nanti saja
              </button>
              <button
                onClick={() => void kirim()}
                disabled={!lengkap || status === "busy"}
                style={{ flex: 1, border: "none", borderRadius: 999, padding: "11px 16px", fontWeight: 800, fontSize: 14, color: "#fff", background: lengkap ? TEAL : "#A7C9C9", cursor: lengkap ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                {status === "busy" && <Loader2 size={15} className="animate-spin" />}
                {lengkap ? "Kirim penilaian" : "Isi semua bintang dulu"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
