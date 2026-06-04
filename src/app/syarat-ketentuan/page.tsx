import Link from "next/link";

export const metadata = {
  title: "Syarat & Ketentuan | Linguo",
  description:
    "Syarat dan ketentuan layanan kursus bahasa dan produk digital Linguo.",
};

const TEAL = "#1A9E9E";

export default function SyaratKetentuanPage() {
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
        Syarat &amp; Ketentuan
      </h1>
      <p className="mt-3 text-sm text-gray-500">
        Berlaku efektif: 4 Juni 2026. Dengan mendaftar, melakukan pembayaran,
        atau menggunakan layanan Linguo, kamu dianggap telah membaca, memahami,
        dan menyetujui seluruh ketentuan di bawah ini.
      </p>

      <div className="mt-10 space-y-9 text-[15px] leading-relaxed text-gray-700">
        <Section n="1" title="Umum">
          <p>
            Linguo adalah layanan kursus bahasa online yang dioperasikan oleh{" "}
            <strong>PT Linguo Edu Indonesia</strong>. Layanan mencakup kelas
            langsung (live), produk digital, serta layanan pendukung lainnya
            yang tersedia melalui linguo.id.
          </p>
        </Section>

        <Section n="2" title="Produk & Layanan">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Kelas Private</strong> — kelas 1-on-1 dengan jadwal
              fleksibel sesuai kesepakatan dengan pengajar.
            </li>
            <li>
              <strong>Kelas Reguler</strong> — kelas grup terjadwal per batch.
            </li>
            <li>
              <strong>Kelas Kids</strong> — kelas untuk anak.
            </li>
            <li>
              <strong>Test Prep &amp; Corporate Training</strong> — sesuai paket
              yang disepakati.
            </li>
            <li>
              <strong>Produk Digital</strong> — e-learning (konten rekaman) dan
              e-book.
            </li>
            <li>
              <strong>Add-on E-Book + Recording</strong> — paket tambahan khusus
              pembeli Kelas Reguler.
            </li>
          </ul>
        </Section>

        <Section n="3" title="Pendaftaran & Pembayaran">
          <p>
            Pembayaran diproses melalui payment gateway pihak ketiga (Xendit).
            Pendaftaran dianggap sah setelah pembayaran terkonfirmasi. Data yang
            kamu isi saat pendaftaran harus benar dan valid; Linguo tidak
            bertanggung jawab atas kendala yang timbul akibat data yang keliru
            (misalnya materi tidak terkirim karena salah email).
          </p>
        </Section>

        <Section n="4" title="Kebijakan Kelas Reguler">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Kelas Reguler dibuka apabila minimal <strong>8 peserta</strong>{" "}
              terpenuhi per batch.
            </li>
            <li>
              Jika kuota <strong>kurang dari 8 peserta</strong>, peserta dapat
              memilih untuk dipindahkan ke <strong>batch berikutnya</strong>{" "}
              atau menerima <strong>refund penuh</strong>.
            </li>
            <li>
              Setelah kelas <strong>berjalan</strong>, pembayaran tidak dapat
              di-refund. Namun, saldo dapat <strong>dialihkan</strong> ke kelas
              Private atau produk lain senilai pembayaran.
            </li>
          </ul>
        </Section>

        <Section n="5" title="Kebijakan Kelas Private & Kids">
          <p>
            Jadwal sesi disepakati antara peserta dan pengajar. Permintaan
            reschedule sesi dapat diajukan paling lambat{" "}
            <strong>24 jam (H-24)</strong> sebelum sesi dimulai. Di luar batas
            waktu tersebut, sesi dianggap berjalan dan tidak dapat dijadwalkan
            ulang.
          </p>
        </Section>

        <Section n="6" title="Produk Digital (E-Learning & E-Book)">
          <p>
            Akses produk digital diberikan setelah pembayaran terkonfirmasi.
            Karena sifatnya digital dan dapat langsung diakses,{" "}
            <strong>produk digital tidak dapat di-refund</strong> setelah akses
            diberikan. Masa akses berlaku sesuai keterangan pada masing-masing
            produk (misalnya akses selamanya, jika dinyatakan).
          </p>
        </Section>

        <Section n="7" title="Add-on E-Book + Recording (Kelas Reguler)">
          <p>
            Add-on senilai Rp150.000 mencakup e-book dan rekaman seluruh sesi
            kelas, keduanya berlaku <strong>selamanya (lifetime)</strong>.
            Pengiriman dilakukan secara manual oleh admin ke email yang kamu
            daftarkan setelah pembayaran terkonfirmasi. Pastikan email yang kamu
            isi aktif dan benar.
          </p>
        </Section>

        <Section n="8" title="Refund">
          <p>
            Refund (apabila berlaku sesuai ketentuan di atas) diproses secara
            manual oleh tim Linguo dalam <strong>3 hari kerja</strong> ke
            rekening atau metode yang disepakati. Untuk pengajuan refund,
            silakan hubungi tim Linguo melalui kontak di bawah.
          </p>
        </Section>

        <Section n="9" title="Hak Kekayaan Intelektual">
          <p>
            Seluruh materi, rekaman kelas, e-book, dan konten lain yang
            disediakan Linguo dilindungi hak cipta dan hanya diperuntukkan bagi{" "}
            <strong>penggunaan pribadi</strong> peserta. Kamu dilarang
            menggandakan, menjual, menyebarluaskan, atau membagikan ulang
            materi tersebut kepada pihak lain tanpa izin tertulis dari Linguo.
          </p>
        </Section>

        <Section n="10" title="Data Pribadi">
          <p>
            Linguo mengumpulkan data (nama, email, nomor WhatsApp, dan
            sejenisnya) semata-mata untuk keperluan operasional layanan dan
            tidak menjualnya kepada pihak ketiga.
          </p>
        </Section>

        <Section n="11" title="Perubahan Ketentuan">
          <p>
            Linguo dapat memperbarui Syarat &amp; Ketentuan ini sewaktu-waktu.
            Perubahan berlaku sejak dipublikasikan pada halaman ini. Penggunaan
            layanan secara berkelanjutan setelah perubahan dianggap sebagai
            persetujuan atas ketentuan yang diperbarui.
          </p>
        </Section>

        <Section n="12" title="Hukum yang Berlaku">
          <p>
            Syarat &amp; Ketentuan ini diatur dan ditafsirkan berdasarkan hukum
            yang berlaku di Republik Indonesia.
          </p>
        </Section>

        <Section n="13" title="Kontak">
          <p>
            Pertanyaan terkait Syarat &amp; Ketentuan dapat diajukan melalui{" "}
            <a
              href="mailto:halo@linguo.id"
              className="font-medium hover:underline"
              style={{ color: TEAL }}
            >
              halo@linguo.id
            </a>
            .
          </p>
        </Section>
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
