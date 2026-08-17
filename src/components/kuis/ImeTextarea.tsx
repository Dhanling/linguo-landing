"use client";

/**
 * Kotak jawaban yang bisa mengubah ketikan Latin jadi aksara bahasa kuis.
 *
 * Dua perangai, ditentukan bahasanya (lihat src/lib/ime):
 * - "auto"     — Sirilik, Yunani, Kana, Hangul. Berubah sambil diketik.
 * - "kandidat" — Mandarin. Pinyin TIDAK boleh diubah diam-diam (satu bunyi =
 *   puluhan hanzi), jadi yang muncul bilah pilihan dan siswa yang menunjuk.
 *
 * ⚠️ Tiap kali konversi benar-benar terjadi, `onChange` mengabarkan `dibantu:
 * true`. Penanda itu ikut tersimpan ke jawaban supaya pengajar tahu aksaranya
 * lahir dari bantuan sistem — di lembar yang dinilai, itu beda arti.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import {
  imeUntuk, konversi, kandidatPinyin, muatIndeksPinyin, mungkinPinyin,
  type Ime,
} from "@/lib/ime";

const BRAND = "#1A9E9E";
/** Ekor Latin yang sedang diketik = huruf setelah pemisah terakhir. */
const EKOR_LATIN = /[a-zA-Z']+$/;

export default function ImeTextarea({
  value, onChange, bahasa, placeholder, className, style, rows,
}: {
  value: string;
  onChange: (teks: string, dibantu: boolean) => void;
  bahasa?: string | null;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  rows?: number;
}) {
  const ime = imeUntuk(bahasa);
  if (!ime) {
    return (
      <textarea value={value} onChange={(e) => onChange(e.target.value, false)}
        placeholder={placeholder} className={className} style={style} rows={rows} />
    );
  }
  return (
    <ImeAktif ime={ime} value={value} onChange={onChange}
      placeholder={placeholder} className={className} style={style} rows={rows} />
  );
}

function ImeAktif({
  ime, value, onChange, placeholder, className, style, rows,
}: {
  ime: Ime;
  value: string;
  onChange: (teks: string, dibantu: boolean) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  rows?: number;
}) {
  const [nyala, setNyala] = useState(true);
  const [kandidat, setKandidat] = useState<string[]>([]);
  const [kunci, setKunci] = useState("");
  const [memuat, setMemuat] = useState(false);
  const dibantuRef = useRef(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // Kamus Mandarin baru diambil kalau saklarnya benar-benar dipakai: siswa yang
  // memilih mengetik hanzi langsung dari papan ketiknya sendiri tak perlu
  // mengunduh apa pun.
  useEffect(() => {
    if (!nyala || ime.mode !== "kandidat") return;
    setMemuat(true);
    muatIndeksPinyin().finally(() => setMemuat(false));
  }, [nyala, ime.mode]);

  const kirim = useCallback((teks: string) => {
    onChange(teks, dibantuRef.current);
  }, [onChange]);

  async function ketik(baru: string) {
    if (!nyala) { kirim(baru); return; }

    // Hanya ketikan di UJUNG yang dikonversi. Sunting di tengah, hapus, dan
    // tempel dibiarkan apa adanya — mengubah teks yang sudah jadi aksara cuma
    // membuat kursor melompat dan hasilnya kacau.
    const menambahDiUjung = baru.length > value.length && baru.startsWith(value);
    if (!menambahDiUjung) { setKandidat([]); kirim(baru); return; }

    const ekor = baru.match(EKOR_LATIN)?.[0] ?? "";
    const pangkal = ekor ? baru.slice(0, baru.length - ekor.length) : baru;

    if (ime.mode === "kandidat") {
      // Pinyin tak pernah diubah sendiri; teksnya tetap Latin sampai dipilih.
      kirim(baru);
      const { kunci: k, kandidat: c } = kandidatPinyin(ekor);
      const layak = ekor.length > 0 && mungkinPinyin(ekor);
      setKunci(layak ? k : "");
      setKandidat(layak ? c.slice(0, 6) : []);
      return;
    }

    if (!ekor) { kirim(baru); return; }
    const huruf = baru.slice(-1);
    const tuntas = !/[a-zA-Z']/.test(huruf);
    const { hasil, sisa } = await konversi(ekor, ime.aksara as any, ime.kode, tuntas);
    if (hasil) dibantuRef.current = true;
    kirim(pangkal + hasil + sisa);
  }

  function pilih(hanzi: string) {
    const ekor = value.match(EKOR_LATIN)?.[0] ?? "";
    // Sisa pinyin yang belum terpakai tetap tinggal: "wobu" → pilih 我, "bu"
    // masih menunggu giliran. Tanpa ini siswa kehilangan ketikannya sendiri.
    const sisaPinyin = ekor.slice(kunci.length);
    const pangkal = value.slice(0, value.length - ekor.length);
    dibantuRef.current = true;
    kirim(pangkal + hanzi + sisaPinyin);
    const lanjut = kandidatPinyin(sisaPinyin);
    setKunci(sisaPinyin ? lanjut.kunci : "");
    setKandidat(sisaPinyin ? lanjut.kandidat.slice(0, 6) : []);
    areaRef.current?.focus();
  }

  function tombol(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!kandidat.length) return;
    // Angka & spasi adalah cara IME sungguhan memilih; Esc untuk membiarkan
    // pinyinnya tetap Latin (mis. siswa memang ingin menulis "pinyin").
    if (e.key === "Escape") { e.preventDefault(); setKandidat([]); return; }
    if (e.key === " ") { e.preventDefault(); pilih(kandidat[0]); return; }
    const n = Number(e.key);
    if (n >= 1 && n <= kandidat.length) { e.preventDefault(); pilih(kandidat[n - 1]); }
  }

  return (
    <div>
      <button type="button" onClick={() => { setNyala((v) => !v); setKandidat([]); }}
        className="mb-1.5 flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left"
        style={{ borderColor: nyala ? BRAND : "#e2e8f0", background: nyala ? "#f0fdfa" : "#fff" }}>
        <Languages className="h-3.5 w-3.5 shrink-0" style={{ color: nyala ? BRAND : "#94a3b8" }} />
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-bold text-slate-700">{ime.label}</span>
          <span className="block truncate text-[11px] text-slate-500">{ime.contoh}</span>
        </span>
        {memuat && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: BRAND }} />}
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: nyala ? BRAND : "#e2e8f0", color: nyala ? "#fff" : "#64748b" }}>
          {nyala ? "NYALA" : "MATI"}
        </span>
      </button>

      <textarea ref={areaRef} value={value} onChange={(e) => ketik(e.target.value)}
        onKeyDown={tombol} placeholder={placeholder} className={className} style={style} rows={rows}
        // Papan ketik HP kerap "membantu" dengan huruf besar & koreksi otomatis;
        // di kotak yang sedang menyulap huruf, itu menghasilkan aksara ngawur.
        autoCapitalize="none" autoCorrect="off" spellCheck={false} />

      {kandidat.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {kandidat.map((k, i) => (
            <button key={k} type="button" onClick={() => pilih(k)}
              className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 hover:bg-slate-100">
              <span className="text-[10px] font-bold text-slate-400">{i + 1}</span>
              <span className="text-lg leading-none text-slate-800">{k}</span>
            </button>
          ))}
          <span className="ml-auto shrink-0 pr-1 text-[10px] text-slate-400">spasi = pilih ke-1</span>
        </div>
      )}
    </div>
  );
}
