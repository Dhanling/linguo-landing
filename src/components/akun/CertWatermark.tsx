// [sertifikat-watermark-v1] Tanda air kertas sertifikat & rapor — pola yang sama
// dengan slide Silabus (dashboard SlideDeckViewer [slide-watermark-v1]): logo besar
// pudar di tengah + tiga baris "linguo.id" miring berulang. Ikut terfoto html2canvas,
// jadi teks yang ditimpa di PDF hasil unduhan akan merusak polanya (susah dipalsukan).
// Gaya inline semua, sama seperti kertasnya.

const TEAL = "#16796E";

export default function CertWatermark({ logoOpacity = 0.05, textOpacity = 0.05 }: { logoOpacity?: number; textOpacity?: number }) {
  return (
    <>
      <img src="/images/certificates/logo-v1.webp" data-certificate-print-src="/images/full-logo-linguo-hijau.png" alt="" aria-hidden="true"
        style={{ position: "absolute", left: "50%", top: "50%", width: "34%", transform: "translate(-50%, -50%)", opacity: logoOpacity, pointerEvents: "none", userSelect: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", userSelect: "none" }}>
        {[18, 50, 82].map((top) => (
          <div key={top} style={{
            position: "absolute", top: `${top}%`, left: "-10%", transform: "rotate(-18deg)", whiteSpace: "nowrap",
            fontSize: 15, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: TEAL, opacity: textOpacity,
          }}>
            {Array.from({ length: 8 }).map(() => "linguo.id").join("   ·   ")}
          </div>
        ))}
      </div>
    </>
  );
}
