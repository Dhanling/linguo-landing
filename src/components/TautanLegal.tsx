/**
 * Tautan legal untuk footer — Syarat & Ketentuan, Ketentuan Pengembalian Dana,
 * dan Kebijakan Privasi. Wajib mudah ditemukan di seluruh halaman publik
 * (syarat verifikasi pembayaran kartu Visa/Mastercard dari Xendit).
 *
 * Warna teks diturunkan dari elemen induk (pakai currentColor), jadi komponen
 * ini aman dipakai di footer gelap maupun terang — cukup bungkus dengan kelas
 * warna footer yang bersangkutan.
 */
const TAUTAN = [
  { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
  { href: "/pengembalian-dana", label: "Ketentuan Pengembalian Dana" },
  { href: "/privacy", label: "Kebijakan Privasi" },
];

export default function TautanLegal({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Informasi legal"
      className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${className}`}
    >
      {TAUTAN.map((t, i) => (
        <span key={t.href} className="flex items-center gap-x-2">
          {i > 0 && (
            <span aria-hidden="true" className="opacity-50">
              ·
            </span>
          )}
          <a href={t.href} className="underline-offset-2 hover:underline">
            {t.label}
          </a>
        </span>
      ))}
    </nav>
  );
}
