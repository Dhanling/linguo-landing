"use client";

// [wa-wajib-digital-v1] Kolom "Nomor WhatsApp" untuk modal beli di /akun.
//
// Pembeli yang sudah login tak pernah ditanya WA — identitasnya diambil dari
// sesi, dan sesi Google/email tak membawa nomor. Hasilnya baris pembelian &
// lead lahir cuma dengan email. Kolom ini muncul HANYA kalau nomornya memang
// belum tersimpan di profil (profiles / students); siswa lama yang nomornya
// sudah ada tak melihat apa pun yang baru.
//
// Pagar terakhir tetap server (`pastikanWaPembeli`): kalau klien salah menebak
// "sudah punya nomor", server menjawab KODE_WA_WAJIB dan pemanggil memanggil
// `minta()` supaya kolomnya muncul.

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalisasiWa } from "@/lib/waPembeli";

export interface WaPembeli {
  /** false selagi profil masih dibaca — tombol bayar sebaiknya menunggu. */
  siap: boolean;
  /** true = kolom harus tampil & diisi. */
  perluIsi: boolean;
  /** Nomor siap kirim (sudah dinormalisasi), atau null kalau belum sah. */
  nomor: string | null;
  ketik: string;
  setKetik: (v: string) => void;
  /** Paksa kolom tampil — dipanggil saat server menjawab KODE_WA_WAJIB. */
  minta: () => void;
  /**
   * Simpan nomor yang baru diketik ke profil siswa (non-fatal). Dipakai jalur
   * yang checkout-nya lewat edge fn — route Next sudah menyimpannya sendiri.
   */
  simpan: () => Promise<void>;
}

/** Nomor WA akun yang sedang login: profiles.whatsapp → students.whatsapp. */
export async function bacaWaTersimpan(supabase: SupabaseClient): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const u = session?.user;
    if (!u) return null;
    const { data: prof } = await supabase.from("profiles").select("whatsapp").eq("id", u.id).maybeSingle();
    const dariProfil = normalisasiWa((prof as { whatsapp: string | null } | null)?.whatsapp);
    if (dariProfil || !u.email) return dariProfil;
    const { data: rows } = await supabase.from("students").select("whatsapp").ilike("email", u.email.replace(/([\\%_])/g, "\\$1"));
    for (const r of (rows ?? []) as { whatsapp: string | null }[]) {
      const n = normalisasiWa(r.whatsapp);
      if (n) return n;
    }
  } catch (e) {
    console.warn("[wa-wajib] baca WA profil gagal:", e);
  }
  return null;
}

/** `lewati` = mode pratinjau POV (identitas pembeli datang dari server). */
export function useWaPembeli(supabase: SupabaseClient, lewati = false): WaPembeli {
  const [siap, setSiap] = useState(lewati);
  const [tersimpan, setTersimpan] = useState<string | null>(null);
  const [dipaksa, setDipaksa] = useState(false);
  const [ketik, setKetik] = useState("");

  useEffect(() => {
    if (lewati) return;
    let hidup = true;
    (async () => {
      const ketemu = await bacaWaTersimpan(supabase);
      if (!hidup) return;
      setTersimpan(ketemu);
      setSiap(true);
    })();
    return () => { hidup = false; };
  }, [supabase, lewati]);

  const perluIsi = !lewati && siap && (dipaksa || !tersimpan);
  const nomor = lewati ? null : perluIsi ? normalisasiWa(ketik) : tersimpan;
  const simpan = async () => {
    if (!perluIsi || !nomor) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const surel = session?.user?.email;
      if (!surel) return;
      await supabase.from("students").update({ whatsapp: nomor })
        .ilike("email", surel.replace(/([\\%_])/g, "\\$1")).is("whatsapp", null);
    } catch (e) {
      console.warn("[wa-wajib] simpan WA ke profil gagal (non-fatal):", e);
    }
  };
  return { siap, perluIsi, nomor, ketik, setKetik, minta: () => setDipaksa(true), simpan };
}

export default function KolomWaPembeli({ wa, disabled = false }: { wa: WaPembeli; disabled?: boolean }) {
  if (!wa.perluIsi) return null;
  const salah = wa.ketik.trim().length > 0 && !wa.nomor;
  return (
    <div className="mb-3 text-left">
      <label className="mb-1 block text-[12px] font-bold text-slate-600">Nomor WhatsApp aktif *</label>
      <input
        type="tel"
        inputMode="tel"
        value={wa.ketik}
        onChange={(e) => wa.setKetik(e.target.value)}
        placeholder="0812 3456 7890"
        disabled={disabled}
        className={`h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] font-medium text-slate-800 outline-none transition disabled:opacity-50 ${salah ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-slate-300"}`}
      />
      <p className={`mt-1 text-[11px] font-medium ${salah ? "text-red-500" : "text-slate-400"}`}>
        {salah ? "Nomor belum valid — contoh: 0812 3456 7890" : "Dipakai tim Linguo untuk mengirim info akses & bantuan."}
      </p>
    </div>
  );
}
