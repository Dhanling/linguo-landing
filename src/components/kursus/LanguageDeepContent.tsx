// =============================================================================
// src/components/kursus/LanguageDeepContent.tsx
// [aeo-language-deep-v1]
//
// Blok konten mendalam untuk halaman /kursus/bahasa-*. Dirender hanya kalau
// bahasa yang bersangkutan punya entri di src/data/language-deep.ts.
//
// Halaman bahasa yang sudah ada menjual: kenapa bahasa ini keren, siapa
// pengajarnya, berapa harganya. Yang TIDAK dijawab justru dua pertanyaan yang
// paling sering diketik orang sebelum memutuskan: "susah nggak sih?" dan
// "berapa lama sampai bisa?". Komponen ini menjawab keduanya secara eksplisit,
// dengan asumsi perhitungan yang ditulis terbuka.
//
// Kenapa jujur soal kesulitan justru menguntungkan: mesin jawaban rutin
// menghindari halaman jualan yang semua bagiannya positif. Daftar "yang memang
// sulit" di bawah bukan basa-basi — kalau dihapus, halaman ini kehilangan
// justru bagian yang membuatnya layak dikutip.
//
// Komponen SERVER (tanpa "use client") — tidak menambah bundle browser dan
// isinya ikut ke HTML mentah yang dibaca crawler.
// =============================================================================
import { Check, X } from "lucide-react";

import type { LanguageDeep } from "@/data/language-deep";

const TEAL = "#1A9E9E";

function BilahKesulitan({ skor }: { skor: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="h-2 w-8 rounded-full"
          style={{ background: n <= skor ? TEAL : "#E2E8F0" }}
        />
      ))}
    </div>
  );
}

export default function LanguageDeepContent({
  deep,
  langName,
}: {
  deep: LanguageDeep;
  /** Nama bahasa dalam bahasa Indonesia, mis. "Georgia". */
  langName: string;
}) {
  return (
    <>
      {/* ================= KENAPA BELAJAR BAHASA INI ================= */}
      <section className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#1A9E9E]">
          Sebelum kamu mulai
        </p>
        {/* H2 ditulis sebagai pertanyaan — itu bentuk yang dicocokkan mesin
            jawaban dengan pertanyaan penggunanya. */}
        <h2 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
          Kenapa belajar Bahasa {langName}?
        </h2>
        <div className="space-y-4 leading-relaxed text-slate-600">
          {deep.kenapa.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* ================= TINGKAT KESULITAN ================= */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
          <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            Seberapa sulit Bahasa {langName} untuk penutur Indonesia?
          </h2>
          <p className="mb-6 leading-relaxed text-slate-600">
            {/* Kalimat ini sengaja menyebut ulang nama bahasa dan sudut
                pandangnya, supaya bisa dikutip tanpa paragraf tetangganya. */}
            Tingkat kesulitan Bahasa {langName} bagi penutur bahasa Indonesia:{" "}
            <strong className="font-semibold text-slate-900">{deep.kesulitan.ringkas}</strong>.
            Penilaian di bawah dibuat dari sudut pandang penutur Indonesia, bukan
            penutur Inggris — beberapa hal yang dianggap sulit di sumber berbahasa
            Inggris justru tidak jadi masalah, dan sebaliknya.
          </p>

          <div className="mb-8 flex items-center gap-3">
            <BilahKesulitan skor={deep.kesulitan.skor} />
            <span className="text-sm font-medium text-slate-500">
              {deep.kesulitan.skor} dari 5
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 font-bold text-slate-900">
                Yang justru mudah buat orang Indonesia
              </h3>
              <ul className="space-y-2.5">
                {deep.kesulitan.mudah.map((m) => (
                  <li key={m} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1A9E9E]" aria-hidden />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 font-bold text-slate-900">Yang memang sulit</h3>
              <ul className="space-y-2.5">
                {deep.kesulitan.sulit.map((m) => (
                  <li key={m} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ESTIMASI WAKTU ================= */}
      <section className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
          Berapa lama belajar Bahasa {langName} sampai bisa?
        </h2>
        {/* Asumsi ditaruh SEBELUM angkanya, bukan sebagai catatan kaki. Estimasi
            tanpa asumsi tidak bisa diverifikasi pembaca dan gampang dibaca
            sebagai klaim kosong. */}
        <p className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-700">
          {deep.estimasi.asumsi}
        </p>

        <ol className="space-y-4">
          {deep.estimasi.tahap.map((t, i) => (
            <li
              key={t.target}
              className="relative rounded-2xl border border-slate-200 bg-white p-5 pl-14"
            >
              <span
                className="absolute left-5 top-5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: TEAL }}
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-bold text-slate-900">{t.target}</h3>
                <span className="text-sm font-semibold text-[#1A9E9E]">{t.durasi}</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{t.bisaApa}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ================= SILABUS RINGKAS ================= */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24">
          <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            Apa yang dipelajari di tiap level Bahasa {langName}?
          </h2>
          <p className="mb-7 leading-relaxed text-slate-600">
            Kurikulum Bahasa {langName} di Linguo mengikuti kerangka CEFR dari A1
            sampai B2. Tabel di bawah meringkas fokus tiap level dan kemampuan yang
            dituju di akhirnya.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th scope="col" className="w-20 px-4 py-3 text-left font-semibold text-slate-600">
                    Level
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                    Fokus materi
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                    Di akhir level kamu bisa
                  </th>
                </tr>
              </thead>
              <tbody>
                {deep.silabus.map((s, i) => (
                  <tr key={s.level} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                    <th scope="row" className="px-4 py-3 text-left align-top font-bold text-[#1A9E9E]">
                      {s.level}
                    </th>
                    <td className="px-4 py-3 align-top text-slate-700">{s.fokus}</td>
                    <td className="px-4 py-3 align-top text-slate-700">{s.hasil}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * FAQ spesifik bahasa. Dirender TERPISAH supaya bisa diletakkan berdampingan
 * dengan FAQ umum halaman, dan supaya isinya bisa ikut ke FAQPage schema tanpa
 * menyeret seluruh blok konten di atas.
 */
export function LanguageDeepFaq({
  deep,
  langName,
}: {
  deep: LanguageDeep;
  langName: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#1A9E9E]">
        Khusus Bahasa {langName}
      </p>
      <h2 className="mb-8 text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
        Pertanyaan seputar Bahasa {langName}
      </h2>
      <div className="space-y-7">
        {deep.faq.map((f) => (
          <div key={f.question}>
            <h3 className="mb-2 font-bold text-slate-900">{f.question}</h3>
            <p className="leading-relaxed text-slate-600">{f.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
