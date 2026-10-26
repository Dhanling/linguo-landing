"use client";

// [konjugasi-animasi-v1] Tabel konjugasi beranimasi di modal sesi silabus.
// Akar verba muncul duluan, lalu penanda tense & akhiran persona "menempel" satu per satu
// dengan warna per jenis — supaya polanya kelihatan, bukan sekadar dihafal.
// Mode latihan menyembunyikan semua akhiran; siswa ketuk baris untuk mengecek tebakannya.
import { useMemo, useState } from "react";
import { Eye, EyeOff, Play, ChevronDown } from "lucide-react";
import type { JenisSegmen, KonjugasiBahasa, TabelKonjugasi as Tabel } from "@/data/konjugasi/types";
import { useT } from "@/lib/uiLang";

const LABEL: Record<JenisSegmen, string> = {
  akar: "Akar kata",
  waktu: "Penanda waktu",
  persona: "Akhiran persona",
  bantu: "Kata bantu",
  lain: "Penanda lain",
};
const URUTAN: JenisSegmen[] = ["akar", "waktu", "persona", "bantu", "lain"];

// Aksara bersambung (Arab, Devanagari, Bengali): potongan inline-block memutus
// sambungan huruf/harakat, jadi di sini segmen cuma diwarnai + digaris bawah, tanpa geser.
const AKSARA_SAMBUNG = /[؀-ۿݐ-ݿﭐ-﻿ऀ-৿]/;

const CSS = `
.konj-row{animation:konjRow .35s ease-out both}
.konj-seg{display:inline-block;border-radius:5px;padding:0 1px;white-space:pre;animation:konjPop .45s cubic-bezier(.2,.9,.3,1.25) both}
.konj-sambung .konj-seg{display:inline;padding:0;border-radius:0;animation-name:konjFade}
.konj-akar{color:#12172B;padding:0}
.konj-waktu{background:rgba(22,121,110,.12);color:#0F5A52}
.konj-persona{background:rgba(242,203,5,.28);color:#7A5A00}
.konj-bantu{background:rgba(124,58,237,.10);color:#6D28D9}
.konj-lain{background:rgba(225,29,72,.09);color:#BE123C}
.konj-sambung .konj-waktu,.konj-sambung .konj-persona,.konj-sambung .konj-bantu,.konj-sambung .konj-lain{background:none;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:5px}
.konj-tutup{color:transparent!important;background:repeating-linear-gradient(90deg,#CBD5E1 0 4px,transparent 4px 7px) bottom/100% 2px no-repeat!important;text-decoration:none!important}
.konj-dot{display:inline-block;width:10px;height:10px;border-radius:3px}
.lms-dark .konj-akar{color:#F1F5F9}
.lms-dark .konj-waktu{background:rgba(45,212,191,.16);color:#5EEAD4}
.lms-dark .konj-persona{background:rgba(242,203,5,.18);color:#FDE68A}
.lms-dark .konj-bantu{background:rgba(167,139,250,.18);color:#C4B5FD}
.lms-dark .konj-lain{background:rgba(251,113,133,.16);color:#FDA4AF}
.lms-dark .konj-tutup{background:repeating-linear-gradient(90deg,#475569 0 4px,transparent 4px 7px) bottom/100% 2px no-repeat!important}
@keyframes konjRow{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
@keyframes konjPop{from{opacity:0;transform:translateY(-10px) scale(.6)}to{opacity:1;transform:none}}
@keyframes konjFade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.konj-row,.konj-seg{animation:none!important}}
`;

export default function TabelKonjugasi({
  data,
  dibahas,
}: {
  data: KonjugasiBahasa;
  /** tabel yang cocok dengan sesi ini — tampil sebagai tab utama */
  dibahas: Tabel[];
}) {
  const t = useT();
  const [semua, setSemua] = useState(false);
  const daftar = semua ? data.tabel : dibahas;
  const [aktifId, setAktifId] = useState(dibahas[0]?.id ?? data.tabel[0]?.id);
  const aktif = daftar.find((x) => x.id === aktifId) ?? daftar[0];
  const [putar, setPutar] = useState(0); // ganti key → animasi diputar ulang
  const [latihan, setLatihan] = useState(false);
  const [terbuka, setTerbuka] = useState<Set<number>>(new Set());

  const jenisAda = useMemo(() => {
    const s = new Set<JenisSegmen>();
    aktif?.baris.forEach((b) => b.bentuk.forEach(([, j]) => s.add(j)));
    return URUTAN.filter((j) => s.has(j));
  }, [aktif]);

  if (!aktif) return null;

  const pilih = (id: string) => {
    setAktifId(id);
    setTerbuka(new Set());
    setPutar((n) => n + 1);
  };
  const ulang = () => {
    setTerbuka(new Set());
    setPutar((n) => n + 1);
  };
  const ketuk = (i: number) => {
    if (!latihan) return;
    setTerbuka((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };
  const lainnya = data.tabel.length - dibahas.length;

  return (
    <div className="mt-5 rounded-2xl bg-slate-50 p-3.5">
      <style>{CSS}</style>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{t("Tabel konjugasi")}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setLatihan((v) => !v); ulang(); }}
            className={`inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-bold transition ${latihan ? "bg-[#16796E] text-white" : "bg-white text-gray-500 hover:text-[#12172B]"}`}
            title={t("Sembunyikan akhiran, tebak dulu, lalu ketuk baris untuk cek")}
          >
            {latihan ? <EyeOff className="h-3.5 w-3.5" strokeWidth={2.4} /> : <Eye className="h-3.5 w-3.5" strokeWidth={2.4} />}
            {t("Latihan")}
          </button>
          <button
            onClick={ulang}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-white px-2 text-[11px] font-bold text-gray-500 transition hover:text-[#12172B]"
            aria-label={t("Putar ulang animasi")}
          >
            <Play className="h-3.5 w-3.5" strokeWidth={2.4} />
            {t("Putar")}
          </button>
        </div>
      </div>

      {daftar.length > 1 ? (
        <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {daftar.map((x) => (
            <button
              key={x.id}
              onClick={() => pilih(x.id)}
              className={`h-8 shrink-0 rounded-lg px-2.5 text-[11.5px] font-bold transition ${x.id === aktif.id ? "bg-[#16796E] text-white" : "bg-white text-gray-500 hover:text-[#12172B]"}`}
            >
              {x.nama}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-2 rounded-xl bg-white p-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[14px] font-extrabold text-[#12172B]">{aktif.nama}</span>
          <span className="text-[12px] font-semibold text-gray-400">
            <span dir="auto" className="font-bold text-gray-500">{aktif.verba}</span> — {aktif.arti}
          </span>
        </div>
        <p className="mt-1 text-[12px] font-medium leading-snug text-gray-500">{aktif.ringkas}</p>

        <div key={`${aktif.id}-${putar}`} className="mt-3 divide-y divide-slate-100">
          {aktif.baris.map((b, i) => {
            const utuh = b.bentuk.map(([s]) => s).join("");
            const sambung = AKSARA_SAMBUNG.test(utuh);
            const tertutup = latihan && !terbuka.has(i);
            const tundaBaris = i * 110;
            return (
              <button
                key={i}
                type="button"
                onClick={() => ketuk(i)}
                className={`konj-row flex w-full items-center gap-3 py-2 text-left ${latihan ? "cursor-pointer" : "cursor-default"}`}
                style={{ animationDelay: `${tundaBaris}ms` }}
              >
                <span className="w-[38%] shrink-0">
                  <span dir="auto" className="block text-[12.5px] font-bold text-[#12172B]">{b.pronomina}</span>
                  <span className="block text-[10.5px] font-medium text-gray-400">{b.arti}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    dir={data.rtl ? "rtl" : "auto"}
                    className={`block text-[17px] font-extrabold leading-relaxed ${sambung ? "konj-sambung" : ""}`}
                  >
                    {b.bentuk.map(([s, j], k) => (
                      <span
                        key={k}
                        className={`konj-seg konj-${j} ${tertutup && j !== "akar" ? "konj-tutup" : ""}`}
                        style={{ animationDelay: `${tundaBaris + (j === "akar" ? 0 : 260 + k * 230)}ms` }}
                      >
                        {s}
                      </span>
                    ))}
                  </span>
                  {b.latin && !tertutup ? (
                    <span className="block text-[11px] font-medium text-gray-400">{b.latin}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        {latihan ? (
          <p className="mt-2 text-[11px] font-semibold text-gray-400">
            {t("Tebak akhirannya, lalu ketuk baris untuk cek")} · {terbuka.size}/{aktif.baris.length}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {jenisAda.map((j) => (
            <span key={j} className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-gray-500">
              <span className={`konj-dot konj-${j}`} style={j === "akar" ? { background: "currentColor", opacity: 0.25 } : undefined} />
              {t(LABEL[j])}
            </span>
          ))}
        </div>
      </div>

      {aktif.catatan?.length || aktif.contoh ? (
        <div className="mt-2 space-y-1.5 px-1">
          {aktif.catatan?.map((c, i) => (
            <p key={i} className="flex gap-2 text-[12px] font-medium leading-snug text-gray-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F2CB05]" />
              <span>{c}</span>
            </p>
          ))}
          {aktif.contoh ? (
            <div className="rounded-lg bg-white px-3 py-2">
              <p dir="auto" className="text-[13px] font-bold text-[#12172B]">{aktif.contoh.kalimat}</p>
              {aktif.contoh.latin ? <p className="text-[11px] font-medium text-gray-400">{aktif.contoh.latin}</p> : null}
              <p className="text-[11.5px] font-medium text-gray-500">{aktif.contoh.arti}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {lainnya > 0 ? (
        <button
          onClick={() => setSemua((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 px-1 text-[11.5px] font-bold text-[#16796E] hover:underline"
        >
          {semua ? t("Tampilkan yang dibahas sesi ini saja") : `${t("Bandingkan dengan tense lain")} (${lainnya})`}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${semua ? "rotate-180" : ""}`} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}
