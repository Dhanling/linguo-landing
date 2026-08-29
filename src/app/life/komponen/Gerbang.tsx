"use client";

// [life-dashboard-v1] Form PIN. Sengaja polos: tidak menyebut isi halaman,
// tidak membedakan pesan "PIN salah" dari "PIN belum diatur".
import { useState } from "react";

export default function Gerbang({ pinBawaan }: { pinBawaan: boolean }) {
  const [pin, setPin] = useState("");
  const [kirim, setKirim] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setKirim(true);
    setPesan(null);
    try {
      const r = await fetch("/life/api/masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const j = await r.json();
      if (j.ok) window.location.reload();
      else setPesan(j.pesan || "PIN salah.");
    } catch {
      setPesan("Jaringan bermasalah, coba lagi.");
    } finally {
      setKirim(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <form onSubmit={submit} className="life-kartu w-full max-w-sm p-7">
        <div
          className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white"
          style={{ background: "var(--life-brand)" }}
          aria-hidden
        >
          L
        </div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--life-text)" }}>
          Dashboard Hidup
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--life-text-2)" }}>
          Masukkan PIN untuk melanjutkan.
        </p>

        <label htmlFor="pin" className="sr-only">PIN</label>
        <input
          id="pin"
          type="password"
          inputMode="text"
          autoComplete="current-password"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="life-angka mt-5 w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
          style={{
            background: "var(--life-surface-2)",
            border: "1px solid var(--life-line-kuat)",
            color: "var(--life-text)",
          }}
          placeholder="••••••••"
        />

        {pesan && (
          <p className="mt-3 text-sm" style={{ color: "var(--life-buruk)" }} role="alert">
            {pesan}
          </p>
        )}

        <button
          type="submit"
          disabled={kirim}
          className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ background: "var(--life-brand)" }}
        >
          {kirim ? "Memeriksa…" : "Masuk"}
        </button>

        {pinBawaan && (
          <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--life-text-3)" }}>
            LIFE_PIN belum diset di Vercel — halaman ini masih memakai PIN bawaan.
            Set variabel itu lalu deploy ulang.
          </p>
        )}
      </form>
    </main>
  );
}
