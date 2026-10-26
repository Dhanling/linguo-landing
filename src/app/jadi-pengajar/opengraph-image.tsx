// =============================================================================
// /jadi-pengajar — gambar pratinjau (og:image) [jadi-pengajar-og-v1]
//
// Halaman ini tidak punya og:image, jadi Threads/WA/IG mengambil foto besar
// pertama di halaman (foto pengajar) sebagai pratinjau tautan — tidak nyambung
// dengan loker yang dibagikan dan terkesan tidak resmi. Kartu 1200×630 ini
// memakai maskot Ling-Ling + ringkasan lowongan, pola sama dengan /links.
// Berlaku juga untuk /jadi-pengajar/en (segmen anak mewarisi berkas ini).
// =============================================================================
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { BRAND_FACTS } from "@/lib/brand-facts";

export const alt = `Lowongan Pengajar Bahasa Online — Karier di ${BRAND_FACTS.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CHIPS = ["Freelance", "Jadwal fleksibel", "Fee per sesi", "Online dari mana saja"];

export default async function Image() {
  const mascot = await readFile(path.join(process.cwd(), "public/ling-ling-avatar.png"));
  const mascotSrc = `data:image/png;base64,${mascot.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 72px",
          background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 60%, #5eead4 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, color: "white", paddingRight: 48 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.18)",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            linguo.id/jadi-pengajar
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>
            Lowongan Pengajar Bahasa Online
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 30, opacity: 0.92 }}>
            {`Kelas online ${BRAND_FACTS.languageCountLabel} · Private, Semi-Private & grup`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
            {CHIPS.map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "white",
                  color: "#0f766e",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mascotSrc}
          width={360}
          height={360}
          alt=""
          style={{ borderRadius: 64, border: "10px solid white", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}
        />
      </div>
    ),
    size,
  );
}
