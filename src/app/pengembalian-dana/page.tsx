import Link from "next/link";

export const metadata = {
  alternates: { canonical: "https://linguo.id/pengembalian-dana" },
  title: "Ketentuan Pengembalian Dana (Refund Policy) | Linguo",
  description:
    "Ketentuan pengembalian dana (return & refund policy) untuk kelas bahasa dan produk digital Linguo: syarat, cara pengajuan, dan lama proses.",
};

const TEAL = "#1A9E9E";

export default function PengembalianDanaPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
        style={{ color: TEAL }}
      >
        ← Kembali ke Beranda
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Ketentuan Pengembalian Dana
      </h1>
      <p className="mt-1 text-base font-medium text-gray-500">
        Return &amp; Refund Policy
      </p>
      <p className="mt-3 text-sm text-gray-500">
        Berlaku efektif: 2 September 2026. Halaman ini adalah bagian tidak
        terpisahkan dari{" "}
        <Link
          href="/syarat-ketentuan"
          className="font-medium hover:underline"
          style={{ color: TEAL }}
        >
          Syarat &amp; Ketentuan
        </Link>{" "}
        Linguo dan berlaku untuk seluruh pembelian di linguo.id.
      </p>

      <div className="mt-10 space-y-9 text-[15px] leading-relaxed text-gray-700">
        <Section n="1" title="Ruang Lingkup">
          <p>
            Ketentuan ini mengatur pengembalian dana (refund) atas pembayaran
            kelas bahasa dan produk digital yang dibeli melalui linguo.id.
            Layanan Linguo berupa jasa pengajaran dan konten digital, sehingga
            tidak ada pengembalian barang fisik (return). Yang berlaku adalah
            pengembalian dana sesuai ketentuan di bawah.
          </p>
        </Section>

        <Section n="2" title="Kelas Reguler (Grup)">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Kelas Reguler dibuka apabila minimal <strong>8 peserta</strong>{" "}
              terpenuhi per batch.
            </li>
            <li>
              Jika kuota tidak terpenuhi dan batch <strong>dibatalkan</strong>{" "}
              oleh Linguo, peserta berhak memilih:{" "}
              <strong>pengembalian dana 100%</strong> atau dipindahkan ke batch
              berikutnya.
            </li>
            <li>
              Pembatalan oleh peserta <strong>sebelum kelas dimulai</strong>{" "}
              (H-1 atau lebih awal) berhak atas pengembalian dana 100%.
            </li>
            <li>
              Setelah kelas <strong>berjalan</strong>, pembayaran tidak dapat
              dikembalikan. Sisa saldo dapat <strong>dialihkan</strong> ke kelas
              Private atau produk lain senilai pembayaran.
            </li>
          </ul>
        </Section>

        <Section n="3" title="Kelas Private & Kelas Anak">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Pembatalan <strong>sebelum sesi pertama berjalan</strong> berhak
              atas pengembalian dana 100%.
            </li>
            <li>
              Setelah sesi pertama berjalan, pengembalian dihitung{" "}
              <strong>proporsional</strong> atas sisa sesi yang belum terpakai,
              dikurangi biaya administrasi payment gateway.
            </li>
            <li>
              Reschedule sesi dapat diajukan paling lambat{" "}
              <strong>24 jam (H-24)</strong> sebelum sesi dimulai. Di luar batas
              waktu tersebut, sesi dianggap berjalan dan tidak dihitung sebagai
              sesi tersisa.
            </li>
            <li>
              Sesi yang dibatalkan sepihak oleh pengajar akan{" "}
              <strong>dijadwalkan ulang tanpa biaya</strong> atau dikembalikan
              penuh apabila peserta menghendaki.
            </li>
          </ul>
        </Section>

        <Section n="4" title="Produk Digital (E-Learning & E-Book)">
          <p>
            Produk digital dapat langsung diakses setelah pembayaran
            terkonfirmasi, sehingga{" "}
            <strong>tidak dapat dikembalikan setelah akses diberikan</strong>.
            Pengecualian berlaku apabila:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              produk gagal diakses karena kesalahan teknis dari pihak Linguo dan
              tidak dapat diperbaiki dalam <strong>7 hari kerja</strong>;
            </li>
            <li>
              terjadi <strong>pembayaran ganda</strong> untuk produk yang sama.
            </li>
          </ul>
        </Section>

        <Section n="5" title="Pembayaran Ganda & Kesalahan Transaksi">
          <p>
            Pembayaran ganda, kelebihan nominal, atau transaksi yang terdebet
            namun pesanan tidak terbentuk akan{" "}
            <strong>dikembalikan penuh</strong> setelah diverifikasi bersama
            payment gateway.
          </p>
        </Section>

        <Section n="6" title="Cara Mengajukan Pengembalian Dana">
          <p>
            Ajukan melalui email{" "}
            <a
              href="mailto:official.linguo@gmail.com"
              className="font-medium hover:underline"
              style={{ color: TEAL }}
            >
              official.linguo@gmail.com
            </a>{" "}
            atau WhatsApp{" "}
            <a
              href="https://wa.me/6282116859493"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: TEAL }}
            >
              +62 821-1685-9493
            </a>{" "}
            dengan menyertakan:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>nama lengkap dan email yang dipakai saat pendaftaran;</li>
            <li>nomor invoice atau bukti pembayaran;</li>
            <li>nama produk/kelas yang dibeli;</li>
            <li>alasan pengajuan pengembalian dana.</li>
          </ul>
          <p className="mt-3">
            Pengajuan diterima paling lambat <strong>14 hari kalender</strong>{" "}
            sejak tanggal pembayaran.
          </p>
        </Section>

        <Section n="7" title="Lama Proses & Metode Pengembalian">
          <p>
            Setiap pengajuan diverifikasi maksimal <strong>3 hari kerja</strong>{" "}
            sejak dokumen lengkap diterima. Dana dikembalikan ke{" "}
            <strong>metode pembayaran yang sama</strong> dengan saat transaksi:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <strong>Kartu kredit/debit (Visa, Mastercard, JCB)</strong> — dana
              dikembalikan ke kartu yang sama, umumnya{" "}
              <strong>7–14 hari kerja</strong> tergantung kebijakan bank
              penerbit kartu.
            </li>
            <li>
              <strong>Transfer bank / virtual account / e-wallet</strong> — dana
              dikembalikan ke rekening atau akun asal, umumnya{" "}
              <strong>3–7 hari kerja</strong>.
            </li>
          </ul>
          <p className="mt-3">
            Pengembalian dana tidak dikenakan biaya tambahan dari Linguo. Biaya
            administrasi payment gateway atau selisih kurs (untuk transaksi
            lintas negara) berada di luar kendali Linguo dan dapat mengurangi
            nominal yang diterima.
          </p>
        </Section>

        <Section n="8" title="Pembatalan Layanan oleh Linguo">
          <p>
            Apabila Linguo tidak dapat menyediakan layanan yang sudah dibayar —
            misalnya batch dibatalkan atau pengajar tidak tersedia dan tidak ada
            penggantinya — peserta berhak atas{" "}
            <strong>pengembalian dana 100%</strong> tanpa potongan.
          </p>
        </Section>

        <Section n="9" title="Perubahan Ketentuan">
          <p>
            Linguo dapat memperbarui ketentuan ini sewaktu-waktu. Perubahan
            berlaku sejak dipublikasikan pada halaman ini dan tidak berlaku
            surut atas transaksi yang sudah diproses.
          </p>
        </Section>

        <Section n="10" title="Kontak">
          <p>
            PT Linguo Edu Indonesia · Email{" "}
            <a
              href="mailto:official.linguo@gmail.com"
              className="font-medium hover:underline"
              style={{ color: TEAL }}
            >
              official.linguo@gmail.com
            </a>{" "}
            · Tel (022) 85942550 · WhatsApp{" "}
            <a
              href="https://wa.me/6282116859493"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: TEAL }}
            >
              +62 821-1685-9493
            </a>
          </p>
        </Section>
      </div>

      <div className="mt-12 border-t border-gray-200 pt-6 text-sm text-gray-500">
        Baca juga:{" "}
        <Link
          href="/syarat-ketentuan"
          className="font-medium hover:underline"
          style={{ color: TEAL }}
        >
          Syarat &amp; Ketentuan
        </Link>{" "}
        ·{" "}
        <Link
          href="/privacy"
          className="font-medium hover:underline"
          style={{ color: TEAL }}
        >
          Kebijakan Privasi
        </Link>
      </div>
    </main>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">
        <span style={{ color: TEAL }}>{n}.</span> {title}
      </h2>
      {children}
    </section>
  );
}
